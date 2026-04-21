<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\Sale;
use Illuminate\Database\Seeder;

class CsvImportSeeder extends Seeder
{
    public function run(): void
    {
        $this->importInventory();
        $this->importSales();
    }

    private function importInventory(): void
    {
        $path = storage_path('app/inventoryPetKO.csv');
        if (!file_exists($path)) {
            $this->command->warn('inventoryPetKO.csv not found, skipping inventory import.');
            return;
        }

        $rows    = array_map('str_getcsv', file($path));
        $headers = array_shift($rows);

        $expenseKeywords = [
            'expense','fee','wifi','water','powder','lalamove','parcel',
            'payment','loan','ballpen','pavement','lipstick','bearing soap',
            'phonex','return','deep (','danny (','prince (','lucy (','armour',
            'pina','enertone','cologne','puppy love','respet care',
        ];

        Inventory::truncate();

        foreach ($rows as $row) {
            if (count($row) < count($headers)) continue;
            $item = array_combine($headers, $row);

            Inventory::create([
                'item_id'      => $item['Item_ID'],
                'category'     => $item['Category'],
                'name'         => $item['Item_Name'],
                'brand'        => $item['Brand'],
                'unit_cost'    => (float) $item['Unit_Cost'],
                'retail_price' => (float) $item['Retail_Price'],
                'stock'        => (int)   $item['Stock_Level'],
                'reorder'      => (int)   $item['Reorder_Level'],
            ]);
        }

        $this->command->info('Inventory imported: ' . Inventory::count() . ' items.');
    }

    private function importSales(): void
    {
        $path = storage_path('app/petKO.csv');
        if (!file_exists($path)) {
            $this->command->warn('petKO.csv not found, skipping sales import.');
            return;
        }

        $expenseKeywords = [
            'expense','fee','wifi','water','powder','lalamove','parcel',
            'payment','loan','ballpen','pavement','lipstick','bearing soap',
            'phonex','return','deep (','danny (','prince (','lucy (','armour',
            'pina','enertone','cologne','puppy love','respet care',
        ];

        $rows = array_map('str_getcsv', file($path));
        array_shift($rows); // remove header

        Sale::truncate();

        $batch = [];
        foreach ($rows as $row) {
            if (count($row) < 3) continue;

            $label     = strtolower(trim($row[1]));
            $amount    = (float) $row[2];
            $isExpense = false;

            foreach ($expenseKeywords as $kw) {
                if (str_contains($label, $kw)) { $isExpense = true; break; }
            }
            if ($amount < 0) $isExpense = true;

            $batch[] = [
                'date'           => trim($row[0]),
                'item'           => trim($row[1]),
                'amount'         => abs($amount),
                'is_expense'     => $isExpense,
                'transaction_id' => null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ];

            // Insert in chunks to avoid memory issues
            if (count($batch) >= 500) {
                Sale::insert($batch);
                $batch = [];
            }
        }

        if (!empty($batch)) Sale::insert($batch);

        $this->command->info('Sales imported: ' . Sale::count() . ' records.');
    }
}
