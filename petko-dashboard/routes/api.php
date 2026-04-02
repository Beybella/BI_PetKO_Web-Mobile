<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ExpensesController;

Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/inventory', [InventoryController::class, 'store']);
Route::put('/inventory/{id}', [InventoryController::class, 'update']);
Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);
Route::post('/inventory/{id}/restock', [InventoryController::class, 'restock']);

Route::get('/sales', [SalesController::class, 'index']);
Route::get('/sales/summary', [SalesController::class, 'summary']);
Route::get('/sales/today', [ExpensesController::class, 'today']);

Route::post('/expenses', [ExpensesController::class, 'store']);
Route::post('/pos/transaction', [\App\Http\Controllers\PosController::class, 'store']);
