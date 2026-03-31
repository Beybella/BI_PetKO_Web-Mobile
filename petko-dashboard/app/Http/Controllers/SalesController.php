<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class SalesController extends Controller
{
    private function loadSales(): array
    {
        $path = storage_path('app/petKO.csv');
        $rows = array_map('str_getcsv', file($path));
        $headers = array_shift($rows);

        // Non-sales items to treat as expenses
        $expenseKeywords = ['expense', 'fee', 'wifi', 'water', 'powder', 'soap',
            'lalamove', 'parcel', 'payment', 'loan', 'ballpen', 'pavement',
            'lipstick', 'bearing soap', 'phonex', 'return'];

        $sales = [];
        foreach ($rows as $row) {
            if (count($row) < 3) continue;
            $item   = array_combine($headers, $row);
            $amount = (float) $item['Amount'];
            $label  = strtolower($item['Item']);

            $isExpense = false;
            foreach ($expenseKeywords as $kw) {
                if (str_contains($label, $kw)) { $isExpense = true; break; }
            }

            $sales[] = [
                'date'       => $item['Date'],
                'item'       => $item['Item'],
                'amount'     => $amount,
                'is_expense' => $isExpense,
            ];
        }
        return $sales;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->loadSales());
    }

    public function summary(): JsonResponse
    {
        $sales = $this->loadSales();

        // Daily totals
        $daily = [];
        // Monthly totals
        $monthly = [];
        // Category totals (keyword-based)
        $categories = [
            'Cat Food'    => ['aozi cat','whiskas','zoi cat','princess','cuties','power cat','special cat','monello','ciao','kitten food'],
            'Dog Food'    => ['aozi dog','pedigree','top breed','smart heart','beef teriyaki','alpo','royal canin','vitality','beef pro','aozi puppy','good boy','aozi dog adult','aozi dog puppy'],
            'Hygiene'     => ['litter sand','shampoo','wipes','pee pad','soap','diaper','tick','anti-tick','catnip','dry shampoo','sawdust'],
            'Medical'     => ['doxy','lc vit','lc-vit','dextrose','hemobicide','frontline','nefrotec','prazital','wormaze','nutri','scour','cof-away','respet','far guard','locil','pet tum'],
            'Accessories' => ['cage','carrier','collar','bowl','leash','scooper','scratcher','cat toy','dog toy','muzzle','flea comb','feeding bottle','poop bag'],
            'Treats/Snacks'=> ['toci','yum yum','tuna steak','sausage','bones','biscuit','chew snack','dentastix','dental','jerky','goats milk','puppy milk'],
        ];

        $catTotals = array_fill_keys(array_keys($categories), 0);
        $productTotals = [];

        foreach ($sales as $s) {
            if ($s['is_expense']) continue;
            // skip combined totals (already aggregated entries)
            if (str_contains(strtolower($s['item']), 'total sales')) continue;

            $date    = $s['date'];
            $month   = substr($date, 0, 7);
            $amount  = $s['amount'];
            $label   = strtolower($s['item']);

            $daily[$date]  = ($daily[$date]  ?? 0) + $amount;
            $monthly[$month]['revenue'] = ($monthly[$month]['revenue'] ?? 0) + $amount;
            $monthly[$month]['transactions'] = ($monthly[$month]['transactions'] ?? 0) + 1;

            // categorise
            $matched = false;
            foreach ($categories as $cat => $keywords) {
                foreach ($keywords as $kw) {
                    if (str_contains($label, $kw)) {
                        $catTotals[$cat] += $amount;
                        $matched = true;
                        break 2;
                    }
                }
            }
            if (!$matched) $catTotals['Treats/Snacks'] += $amount;

            // product totals
            $productTotals[$s['item']] = ($productTotals[$s['item']] ?? 0) + $amount;
        }

        // Expenses per month
        foreach ($sales as $s) {
            if (!$s['is_expense']) continue;
            $month = substr($s['date'], 0, 7);
            $monthly[$month]['expenses'] = ($monthly[$month]['expenses'] ?? 0) + abs($s['amount']);
        }

        // Sort
        ksort($daily);
        ksort($monthly);
        arsort($productTotals);

        $monthlyOut = [];
        foreach ($monthly as $m => $v) {
            $rev  = $v['revenue']      ?? 0;
            $exp  = $v['expenses']     ?? 0;
            $monthlyOut[] = [
                'month'        => $m,
                'revenue'      => round($rev, 2),
                'expenses'     => round($exp, 2),
                'net'          => round($rev - $exp, 2),
                'transactions' => $v['transactions'] ?? 0,
            ];
        }

        return response()->json([
            'daily'       => $daily,
            'monthly'     => $monthlyOut,
            'categories'  => $catTotals,
            'top_products'=> array_slice($productTotals, 0, 10, true),
        ]);
    }
}
