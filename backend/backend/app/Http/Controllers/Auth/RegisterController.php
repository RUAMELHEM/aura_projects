<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class RegisterController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'department_id' => 'required|exists:departments,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'department_id' => $validated['department_id'],
        ]);

        $calisanRole = Role::firstOrCreate(['name' => 'calisan']);
        $user->roles()->attach($calisanRole);

        // Kullanıcıyı session bazlı olarak oturum açtır (Sanctum SPA için)
        \Illuminate\Support\Facades\Auth::login($user);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('roles', 'department'),
            'token' => $token,
        ], 201);
    }
}
