<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpensesController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'description' => 'required|string',
            'amount'      => 'required|numeric|min:0.01',
        ]);

        $date   = now()->toDateString();
        $desc   = $request->input('description');
        $amount = (float) $request->input('amount');

        Sale::create([
            'date'       => $date,
            'item'       => $desc,
            'amount'     => $amount,
            'is_expense' => true,
        ]);

        return response()->json([
            'success'     => true,
            'date'        => $date,
            'description' => $desc,
            'amount'      => $amount,
        ]);
    }

    public function today(): JsonResponse
    {
        $today = now()->toDateString();
        $rows  = Sale::whereDate('date', $today)->get();

        $sales    = [];
        $expenses = [];

        foreach ($rows as $row) {
            if ($row->is_expense) {
                $expenses[] = ['item' => $row->item, 'amount' => abs($row->amount)];
            } else {
                $sales[] = ['item' => $row->item, 'amount' => $row->amount];
            }
        }

        $totalSales    = array_sum(array_column($sales, 'amount'));
        $totalExpenses = array_sum(array_column($expenses, 'amount'));

        $itemTotals = [];
        foreach ($sales as $s) {
            $itemTotals[$s['item']] = ($itemTotals[$s['item']] ?? 0) + $s['amount'];
        }
        arsort($itemTotals);
        $topItem = array_key_first($itemTotals);

        return response()->json([
            'date'           => $today,
            'total_sales'    => round($totalSales, 2),
            'total_expenses' => round($totalExpenses, 2),
            'net'            => round($totalSales - $totalExpenses, 2),
            'transactions'   => count($sales),
            'top_item'       => $topItem,
            'top_item_amt'   => $topItem ? round($itemTotals[$topItem], 2) : 0,
            'sales'          => $sales,
            'expenses'       => $expenses,
        ]);
    }
}
