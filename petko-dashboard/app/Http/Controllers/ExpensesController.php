<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpensesController extends Controller
{
    private string $csvPath;

    public function __construct()
    {
        $this->csvPath = storage_path('app/petKO.csv');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'description' => 'required|string',
            'amount'      => 'required|numeric|min:0.01',
        ]);

        $date   = now()->format('Y-m-d');
        $desc   = $request->input('description');
        $amount = (float) $request->input('amount');

        $fp = fopen($this->csvPath, 'a');
        fputcsv($fp, [$date, $desc, -$amount]);
        fclose($fp);

        return response()->json([
            'success'     => true,
            'date'        => $date,
            'description' => $desc,
            'amount'      => $amount,
        ]);
    }

    public function today(): JsonResponse
    {
        $today = now()->format('Y-m-d');
        $rows  = array_map('str_getcsv', file($this->csvPath));
        array_shift($rows); // remove header

        $sales    = [];
        $expenses = [];

        foreach ($rows as $row) {
            if (count($row) < 3) continue;
            if (trim($row[0]) !== $today) continue;

            $amount = (float) $row[2];
            $label  = strtolower($row[1]);

            $expenseKeywords = ['expense','fee','wifi','water','powder','lalamove','parcel',
                'payment','loan','ballpen','pavement','lipstick','bearing soap',
                'phonex','return','deep (','danny (','prince (','lucy (','armour'];

            $isExpense = false;
            foreach ($expenseKeywords as $kw) {
                if (str_contains($label, $kw)) { $isExpense = true; break; }
            }

            if ($isExpense || $amount < 0) {
                $expenses[] = ['item' => $row[1], 'amount' => abs($amount)];
            } else {
                $sales[] = ['item' => $row[1], 'amount' => $amount];
            }
        }

        $totalSales    = array_sum(array_column($sales, 'amount'));
        $totalExpenses = array_sum(array_column($expenses, 'amount'));

        // top item
        $itemTotals = [];
        foreach ($sales as $s) {
            $itemTotals[$s['item']] = ($itemTotals[$s['item']] ?? 0) + $s['amount'];
        }
        arsort($itemTotals);
        $topItem = array_key_first($itemTotals);

        return response()->json([
            'date'          => $today,
            'total_sales'   => round($totalSales, 2),
            'total_expenses'=> round($totalExpenses, 2),
            'net'           => round($totalSales - $totalExpenses, 2),
            'transactions'  => count($sales),
            'top_item'      => $topItem,
            'top_item_amt'  => $topItem ? round($itemTotals[$topItem], 2) : 0,
            'sales'         => $sales,
            'expenses'      => $expenses,
        ]);
    }
}
