<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    private string $csvPath;

    public function __construct()
    {
        $this->csvPath = storage_path('app/inventoryPetKO.csv');
    }

    private function readCsv(): array
    {
        $rows    = array_map('str_getcsv', file($this->csvPath));
        $headers = $rows[0];
        return [$headers, $rows];
    }

    public function index(): JsonResponse
    {
        [$headers, $rows] = $this->readCsv();
        $dataRows = array_slice($rows, 1);

        $items = array_map(function ($row) use ($headers) {
            $item = array_combine($headers, $row);
            return [
                'id'          => $item['Item_ID'],
                'category'    => $item['Category'],
                'name'        => $item['Item_Name'],
                'brand'       => $item['Brand'],
                'unit_cost'   => (float) $item['Unit_Cost'],
                'retail_price'=> (float) $item['Retail_Price'],
                'stock'       => (int)   $item['Stock_Level'],
                'reorder'     => (int)   $item['Reorder_Level'],
            ];
        }, $dataRows);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string',
            'category'     => 'required|string',
            'brand'        => 'required|string',
            'unit_cost'    => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'reorder'      => 'required|integer|min:0',
        ]);

        [$headers, $rows] = $this->readCsv();

        // Generate next ID
        $ids     = array_slice($rows, 1);
        $idIdx   = array_search('Item_ID', $headers);
        $lastNum = 0;
        foreach ($ids as $row) {
            if (preg_match('/INV-(\d+)/', $row[$idIdx] ?? '', $m)) {
                $lastNum = max($lastNum, (int)$m[1]);
            }
        }
        $newId = 'INV-' . str_pad($lastNum + 1, 3, '0', STR_PAD_LEFT);

        $newRow = [
            $newId,
            $request->input('category'),
            $request->input('name'),
            $request->input('brand'),
            $request->input('unit_cost'),
            $request->input('retail_price'),
            $request->input('stock'),
            $request->input('reorder'),
        ];

        $rows[] = $newRow;

        $fp = fopen($this->csvPath, 'w');
        foreach ($rows as $row) { fputcsv($fp, $row); }
        fclose($fp);

        return response()->json([
            'id'           => $newId,
            'category'     => $request->input('category'),
            'name'         => $request->input('name'),
            'brand'        => $request->input('brand'),
            'unit_cost'    => (float) $request->input('unit_cost'),
            'retail_price' => (float) $request->input('retail_price'),
            'stock'        => (int)   $request->input('stock'),
            'reorder'      => (int)   $request->input('reorder'),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string',
            'category'     => 'required|string',
            'brand'        => 'required|string',
            'unit_cost'    => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'reorder'      => 'required|integer|min:0',
        ]);

        [$headers, $rows] = $this->readCsv();
        $idIdx = array_search('Item_ID', $headers);
        $found = false;

        for ($i = 1; $i < count($rows); $i++) {
            if (trim($rows[$i][$idIdx]) === trim($id)) {
                $rows[$i] = [
                    $id,
                    $request->input('category'),
                    $request->input('name'),
                    $request->input('brand'),
                    $request->input('unit_cost'),
                    $request->input('retail_price'),
                    $request->input('stock'),
                    $request->input('reorder'),
                ];
                $found = true;
                break;
            }
        }

        if (!$found) return response()->json(['error' => 'Item not found.'], 404);

        $fp = fopen($this->csvPath, 'w');
        foreach ($rows as $row) { fputcsv($fp, $row); }
        fclose($fp);

        return response()->json(['success' => true]);
    }

    public function destroy(string $id): JsonResponse
    {
        [$headers, $rows] = $this->readCsv();
        $idIdx    = array_search('Item_ID', $headers);
        $filtered = array_filter($rows, fn($r) => trim($r[$idIdx] ?? '') !== trim($id));

        if (count($filtered) === count($rows) - 1 || $filtered === $rows) {
            // nothing removed means header only — check properly
        }

        $fp = fopen($this->csvPath, 'w');
        foreach ($filtered as $row) { fputcsv($fp, $row); }
        fclose($fp);

        return response()->json(['success' => true]);
    }

    public function restock(Request $request, string $id): JsonResponse
    {
        $request->validate(['qty' => 'required|integer|min:1']);
        $qty = (int) $request->input('qty');

        [$headers, $rows] = $this->readCsv();

        $idIdx    = array_search('Item_ID',     $headers);
        $stockIdx = array_search('Stock_Level', $headers);
        $found    = false;

        for ($i = 1; $i < count($rows); $i++) {
            if (trim($rows[$i][$idIdx]) === trim($id)) {
                $rows[$i][$stockIdx] = (int)$rows[$i][$stockIdx] + $qty;
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json(['error' => 'Item not found.'], 404);
        }

        $fp = fopen($this->csvPath, 'w');
        foreach ($rows as $row) { fputcsv($fp, $row); }
        fclose($fp);

        return response()->json(['success' => true, 'new_stock' => $rows[$i][$stockIdx]]);
    }
}
