<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;

/**
 * AdminController — Sadece "admin" rolüne sahip kullanıcılar çağırabilir.
 * Şu an için: kullanıcılara rol atama/kaldırma işlemleri buradan yapılır.
 */
class AdminController extends Controller
{
    /**
     * GET /admin/users
     * Sistemdeki tüm kullanıcıları ve rollerini listeler.
     * Admin böylece "kim hangi rolde?" görebilir.
     */
    public function listUsers(Request $request)
    {
        $users = User::with(['roles', 'department'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    /**
     * GET /admin/roles
     * Sistemdeki tüm mevcut rolleri listeler.
     * (calisan, kurum_yoneticisi, admin)
     */
    public function listRoles()
    {
        return response()->json(Role::all());
    }

    /**
     * POST /admin/users/{user}/roles
     * Body: { "role": "kurum_yoneticisi" }
     *
     * Bir kullanıcıya rol atar.
     * Eğer kullanıcı zaten o role sahipse tekrar eklemez (syncWithoutDetaching).
     */
    public function assignRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $role = Role::where('name', $request->role)->firstOrFail();

        // syncWithoutDetaching: Var olan rolleri silmeden, sadece yeni rolü ekler
        $user->roles()->syncWithoutDetaching([$role->id]);

        return response()->json([
            'message' => "{$user->name} kullanıcısına '{$request->role}' rolü atandı.",
            'user'    => $user->load('roles', 'department'),
        ]);
    }

    /**
     * DELETE /admin/users/{user}/roles
     * Body: { "role": "kurum_yoneticisi" }
     *
     * Bir kullanıcıdan belirtilen rolü kaldırır.
     */
    public function removeRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $role = Role::where('name', $request->role)->firstOrFail();

        // detach: pivot tablosundan (role_user) o kaydı siler
        $user->roles()->detach($role->id);

        return response()->json([
            'message' => "{$user->name} kullanıcısından '{$request->role}' rolü kaldırıldı.",
            'user'    => $user->load('roles', 'department'),
        ]);
    }
}
