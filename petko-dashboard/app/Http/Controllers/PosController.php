<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items'         => 'required|array|min:1',
            'items.*.name'  => 'required|string',
            'items.*.qty'   => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'cash_tendered' => 'required|numeric|min:0',
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
        $date   = now()->toDateString();
        $txId   = 'TXN-' . now()->format('YmdHis');

        DB::transaction(function () use ($items, $date, $txId) {
            foreach ($items as $item) {
                $lineTotal = round($item['qty'] * $item['price'], 2);

                Sale::create([
                    'date'           => $date,
                    'item'           => $item['name'],
                    'amount'         => $lineTotal,
                    'qty'            => (int) $item['qty'],
                    'is_expense'     => false,
                    'transaction_id' => $txId,
                ]);

                // Deduct stock
                Inventory::where('name', $item['name'])
                    ->decrement('stock', $item['qty']);
            }
        });

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
