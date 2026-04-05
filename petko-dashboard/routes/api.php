<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ExpensesController;
use App\Http\Controllers\PosController;

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Authenticated ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',          [AuthController::class, 'me']);
    Route::post('/logout',     [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // POS — staff + admin
    Route::post('/pos/transaction', [PosController::class, 'store']);

    // Inventory — read + restock for all, write/edit/delete for admin only
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory/{id}/restock', [InventoryController::class, 'restock']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/inventory',           [InventoryController::class, 'store']);
        Route::put('/inventory/{id}',       [InventoryController::class, 'update']);
        Route::delete('/inventory/{id}',    [InventoryController::class, 'destroy']);
    });

    // Sales & expenses — admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/sales',         [SalesController::class, 'index']);
        Route::get('/sales/summary', [SalesController::class, 'summary']);
        Route::get('/sales/today',   [ExpensesController::class, 'today']);
        Route::post('/expenses',     [ExpensesController::class, 'store']);
    });

    // User management — admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/users',          [AuthController::class, 'users']);
        Route::post('/users',         [AuthController::class, 'createUser']);
        Route::delete('/users/{id}',  [AuthController::class, 'deleteUser']);
    });
});
