<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        if ($user->hasRole('admin')) {
            return User::with(['roles', 'department'])->get();
        }
        
        if ($user->hasRole('kurum_yoneticisi')) {
            return User::where('department_id', $user->department_id)
                ->with(['roles', 'department'])->get();
        }
        
        return response()->json(['message' => 'Yetkisiz erisim'], 403);
    }

    public function show(User $user)
    {
        $currentUser = auth()->user();
        
        if ($currentUser->hasRole('admin') || 
            ($currentUser->hasRole('kurum_yoneticisi') && $currentUser->department_id === $user->department_id) ||
            $currentUser->id === $user->id) {
            return $user->load(['roles', 'department']);
        }
        
        return response()->json(['message' => 'Yetkisiz erisim'], 403);
    }
}
