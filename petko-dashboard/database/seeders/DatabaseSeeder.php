<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default admin account
        User::firstOrCreate(
            ['email' => 'admin@petko.com'],
            [
                'name'     => 'Admin',
                'role'     => 'admin',
                'password' => Hash::make('petko2026'),
            ]
        );

        // Default staff account
        User::firstOrCreate(
            ['email' => 'staff@petko.com'],
            [
                'name'     => 'Staff',
                'role'     => 'staff',
                'password' => Hash::make('staff2026'),
            ]
        );
    }
}
