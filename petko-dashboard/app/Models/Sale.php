<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'date', 'item', 'amount', 'qty', 'is_expense', 'transaction_id',
    ];

    protected $casts = [
        'date'       => 'date',
        'amount'     => 'float',
        'is_expense' => 'boolean',
    ];
}
