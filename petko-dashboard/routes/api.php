<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SalesController;

Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/inventory/{id}/restock', [InventoryController::class, 'restock']);
Route::get('/sales', [SalesController::class, 'index']);
Route::get('/sales/summary', [SalesController::class, 'summary']);

Route::post('/pos/transaction', [\App\Http\Controllers\PosController::class, 'store']);
