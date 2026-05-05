<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Inventory::all()->map(fn($i) => [
            'id'           => $i->item_id,
            'category'     => $i->category,
            'name'         => $i->name,
            'brand'        => $i->brand,
            'unit_cost'    => (float) $i->unit_cost,
            'retail_price' => (float) $i->retail_price,
            'stock'        => (int)   $i->stock,
            'reorder'      => (int)   $i->reorder,
        ]);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string',
            'category'     => 'required|string',
            'brand'        => 'required|string',
            'unit_cost'    => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'reorder'      => 'required|integer|min:0',
        ]);

        // Generate next ID
        $last    = Inventory::orderByRaw("CAST(SUBSTRING(item_id, 5) AS UNSIGNED) DESC")->first();
        $lastNum = $last ? (int) substr($last->item_id, 4) : 0;
        $newId   = 'INV-' . str_pad($lastNum + 1, 3, '0', STR_PAD_LEFT);

        $item = Inventory::create([
            'item_id'      => $newId,
            'category'     => $request->input('category'),
            'name'         => $request->input('name'),
            'brand'        => $request->input('brand'),
            'unit_cost'    => $request->input('unit_cost'),
            'retail_price' => $request->input('retail_price'),
            'stock'        => $request->input('stock'),
            'reorder'      => $request->input('reorder'),
        ]);

        return response()->json([
            'id'           => $item->item_id,
            'category'     => $item->category,
            'name'         => $item->name,
            'brand'        => $item->brand,
            'unit_cost'    => (float) $item->unit_cost,
            'retail_price' => (float) $item->retail_price,
            'stock'        => (int)   $item->stock,
            'reorder'      => (int)   $item->reorder,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name'         => 'required|string',
            'category'     => 'required|string',
            'brand'        => 'required|string',
            'unit_cost'    => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'reorder'      => 'required|integer|min:0',
        ]);

        $item = Inventory::where('item_id', $id)->first();
        if (!$item) return response()->json(['error' => 'Item not found.'], 404);

        $item->update([
            'category'     => $request->input('category'),
            'name'         => $request->input('name'),
            'brand'        => $request->input('brand'),
            'unit_cost'    => $request->input('unit_cost'),
            'retail_price' => $request->input('retail_price'),
            'stock'        => $request->input('stock'),
            'reorder'      => $request->input('reorder'),
        ]);

        return response()->json(['success' => true]);
    }

    public function destroy(string $id): JsonResponse
    {
        $deleted = Inventory::where('item_id', $id)->delete();
        if (!$deleted) return response()->json(['error' => 'Item not found.'], 404);
        return response()->json(['success' => true]);
    }

    public function restock(Request $request, string $id): JsonResponse
    {
        $request->validate(['qty' => 'required|integer|min:1']);

        $item = Inventory::where('item_id', $id)->first();
        if (!$item) return response()->json(['error' => 'Item not found.'], 404);

        $item->increment('stock', (int) $request->input('qty'));

        return response()->json(['success' => true, 'new_stock' => $item->fresh()->stock]);
    }
}
