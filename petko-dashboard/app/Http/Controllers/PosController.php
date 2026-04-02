<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PosController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.name'   => 'required|string',
            'items.*.qty'    => 'required|integer|min:1',
            'items.*.price'  => 'required|numeric|min:0',
            'cash_tendered'  => 'required|numeric|min:0',
        ]);

        $items = $request->input('items');
        $total = array_sum(array_map(fn($i) => $i['qty'] * $i['price'], $items));
        $cash  = (float) $request->input('cash_tendered');
        $disc  = (float) $request->input('discount', 0);
        $total = max(0, $total - $disc);

        if ($cash < $total) {
            return response()->json(['error' => 'Insufficient cash tendered.'], 422);
        }

        $change = $cash - $total;
        $date   = now()->format('Y-m-d');
        $txId   = 'TXN-' . now()->format('YmdHis');

        // Append each sold item as a new line in petKO.csv
        $csvPath = storage_path('app/petKO.csv');
        $fp = fopen($csvPath, 'a');
        foreach ($items as $item) {
            $lineTotal = round($item['qty'] * $item['price'], 2);
            fputcsv($fp, [$date, $item['name'], $lineTotal]);
        }
        fclose($fp);

        // Update inventory stock levels
        $invPath  = storage_path('app/inventoryPetKO.csv');
        $rows     = array_map('str_getcsv', file($invPath));
        $headers  = $rows[0];
        $nameIdx  = array_search('Item_Name',   $headers);
        $stockIdx = array_search('Stock_Level', $headers);

        $nameMap = [];
        for ($i = 1; $i < count($rows); $i++) {
            if (isset($rows[$i][$nameIdx])) {
                $nameMap[strtolower(trim($rows[$i][$nameIdx]))] = $i;
            }
        }

        foreach ($items as $item) {
            $key = strtolower(trim($item['name']));
            if (isset($nameMap[$key])) {
                $idx = $nameMap[$key];
                $rows[$idx][$stockIdx] = max(0, (int)$rows[$idx][$stockIdx] - (int)$item['qty']);
            }
        }

        $fp = fopen($invPath, 'w');
        foreach ($rows as $row) { fputcsv($fp, $row); }
        fclose($fp);

        return response()->json([
            'success'        => true,
            'transaction_id' => $txId,
            'total'          => round($total, 2),
            'cash_tendered'  => round($cash, 2),
            'change'         => round($change, 2),
            'discount'       => round($disc, 2),
            'date'           => now()->format('Y-m-d H:i:s'),
            'items'          => $items,
        ]);
    }
}
