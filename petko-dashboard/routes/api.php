<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SalesController;

Route::get('/inventory', [InventoryController::class, 'index']);
Route::get('/sales', [SalesController::class, 'index']);
Route::get('/sales/summary', [SalesController::class, 'summary']);
