<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('item_id')->unique();
            $table->string('category');
            $table->string('name');
            $table->string('brand');
            $table->decimal('unit_cost', 10, 2)->default(0);
            $table->decimal('retail_price', 10, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->integer('reorder')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
