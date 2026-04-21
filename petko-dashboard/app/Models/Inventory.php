<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventory';

    protected $fillable = [
        'item_id', 'category', 'name', 'brand',
        'unit_cost', 'retail_price', 'stock', 'reorder',
    ];
}
