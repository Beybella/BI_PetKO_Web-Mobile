<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $path = storage_path('app/inventoryPetKO.csv');
        $rows = array_map('str_getcsv', file($path));
        $headers = array_shift($rows);

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
        }, $rows);

        return response()->json($items);
    }
}
