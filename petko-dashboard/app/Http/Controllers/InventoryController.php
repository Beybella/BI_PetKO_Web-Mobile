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
