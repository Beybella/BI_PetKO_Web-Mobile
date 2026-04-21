<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Sale::where('is_expense', false)
            ->whereNotNull('transaction_id')
            ->orderBy('created_at', 'desc');

        if ($request->has('date')) {
            $query->whereDate('date', $request->input('date'));
        }

        if ($request->has('search')) {
            $query->where('item', 'like', '%' . $request->input('search') . '%');
        }

        $rows = $query->get();

        // Group by transaction_id
        $grouped = [];
        foreach ($rows as $row) {
            $txId = $row->transaction_id;
            if (!isset($grouped[$txId])) {
                $grouped[$txId] = [
                    'transaction_id' => $txId,
                    'date'           => $row->date->format('Y-m-d'),
                    'created_at'     => $row->created_at->format('Y-m-d H:i:s'),
                    'items'          => [],
                    'total'          => 0,
                ];
            }
            $grouped[$txId]['items'][] = [
                'item'   => $row->item,
                'qty'    => (int) ($row->qty ?? 1),
                'amount' => (float) $row->amount,
            ];
            $grouped[$txId]['total'] += (float) $row->amount;
        }

        return response()->json(array_values($grouped));
    }

    public function today(): JsonResponse
    {
        $today = now()->toDateString();
        $rows  = Sale::where('is_expense', false)
            ->whereNotNull('transaction_id')
            ->whereDate('date', $today)
            ->orderBy('created_at', 'desc')
            ->get();

        $grouped = [];
        foreach ($rows as $row) {
            $txId = $row->transaction_id;
            if (!isset($grouped[$txId])) {
                $grouped[$txId] = [
                    'transaction_id' => $txId,
                    'date'           => $row->date->format('Y-m-d'),
                    'created_at'     => $row->created_at->format('Y-m-d H:i:s'),
                    'items'          => [],
                    'total'          => 0,
                ];
            }
            $grouped[$txId]['items'][] = [
                'item'   => $row->item,
                'qty'    => (int) ($row->qty ?? 1),
                'amount' => (float) $row->amount,
            ];
            $grouped[$txId]['total'] += (float) $row->amount;
        }

        return response()->json(array_values($grouped));
    }
}
