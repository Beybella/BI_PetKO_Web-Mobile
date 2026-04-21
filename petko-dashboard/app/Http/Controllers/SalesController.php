<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    private array $categories = [
        'Cat Food'      => ['aozi cat','whiskas','zoi cat','princess','cuties','power cat','special cat','monello','ciao','kitten food','me-o'],
        'Dog Food'      => ['aozi dog','pedigree','top breed','smart heart','beef teriyaki','alpo','royal canin','vitality','beef pro','aozi puppy','good boy','aozi dog adult','aozi dog puppy','zoi dog'],
        'Hygiene'       => ['litter sand','shampoo','wipes','pee pad','soap','diaper','tick','anti-tick','catnip','dry shampoo','sawdust','poop bag'],
        'Medical'       => ['doxy','lc vit','lc-vit','dextrose','hemobicide','frontline','nefrotec','prazital','wormaze','nutri','scour','cof-away','respet','far guard','locil','pet tum','syringe'],
        'Accessories'   => ['cage','carrier','collar','bowl','leash','scooper','scratcher','cat toy','dog toy','muzzle','flea comb','feeding bottle','fish net'],
        'Treats/Snacks' => ['toci','yum yum','tuna steak','sausage','bones','biscuit','chew snack','dentastix','dental','jerky','goats milk','puppy milk','african','infinity','mondee'],
    ];

    private function categorise(string $label): string
    {
        $label = strtolower($label);
        foreach ($this->categories as $cat => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($label, $kw)) return $cat;
            }
        }
        return 'Treats/Snacks';
    }

    public function summary(): JsonResponse
    {
        $rows = Sale::where('is_expense', false)
            ->where('item', 'not like', '%total sales%')
            ->get();

        $daily         = [];
        $monthly       = [];
        $catTotals     = array_fill_keys(array_keys($this->categories), 0);
        $productTotals = [];
        $monthlyCats   = [];
        $monthlyProds  = [];

        foreach ($rows as $s) {
            $date   = $s->date->format('Y-m-d');
            $month  = $s->date->format('Y-m');
            $amount = (float) $s->amount;
            $cat    = $this->categorise($s->item);

            $daily[$date] = ($daily[$date] ?? 0) + $amount;

            $monthly[$month]['revenue']      = ($monthly[$month]['revenue']      ?? 0) + $amount;
            $monthly[$month]['transactions'] = ($monthly[$month]['transactions'] ?? 0) + 1;

            $catTotals[$cat] += $amount;
            $monthlyCats[$month][$cat] = ($monthlyCats[$month][$cat] ?? 0) + $amount;

            $productTotals[$s->item] = ($productTotals[$s->item] ?? 0) + $amount;
            $monthlyProds[$month][$s->item] = ($monthlyProds[$month][$s->item] ?? 0) + $amount;
        }

        // Expenses per month
        $expenses = Sale::where('is_expense', true)->get();
        foreach ($expenses as $s) {
            $month = $s->date->format('Y-m');
            $monthly[$month]['expenses'] = ($monthly[$month]['expenses'] ?? 0) + abs((float) $s->amount);
        }

        ksort($daily);
        ksort($monthly);
        arsort($productTotals);

        $monthlyOut = [];
        foreach ($monthly as $m => $v) {
            $rev = $v['revenue']  ?? 0;
            $exp = $v['expenses'] ?? 0;
            $mp  = $monthlyProds[$m] ?? [];
            arsort($mp);
            $mp = array_slice($mp, 0, 10, true);

            $monthlyOut[] = [
                'month'        => $m,
                'revenue'      => round($rev, 2),
                'expenses'     => round($exp, 2),
                'net'          => round($rev - $exp, 2),
                'transactions' => $v['transactions'] ?? 0,
                'categories'   => $monthlyCats[$m] ?? [],
                'top_products' => $mp,
            ];
        }

        return response()->json([
            'daily'        => $daily,
            'monthly'      => $monthlyOut,
            'categories'   => $catTotals,
            'top_products' => array_slice($productTotals, 0, 10, true),
        ]);
    }
}
