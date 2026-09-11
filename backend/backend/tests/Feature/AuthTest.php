<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_user_can_register_and_receive_sanctum_token(): void
    {
        $department = Department::firstOrCreate(['name' => 'Auth Test Department']);
        $email = 'auth-' . uniqid() . '@example.test';

        $response = $this->postJson('/api/register', [
            'name' => 'Auth Test User',
            'email' => $email,
            'password' => 'password',
            'password_confirmation' => 'password',
            'department_id' => $department->id,
        ]);

        $response->assertCreated()->assertJsonStructure(['user', 'token']);
        $this->assertDatabaseHas('users', ['email' => $email]);
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'login-' . uniqid() . '@example.test',
            'password' => Hash::make('password'),
        ]);

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $login->assertOk()->assertJsonStructure(['user', 'token']);

        Sanctum::actingAs($user);
        $this->postJson('/api/logout')->assertOk()->assertJson([
            'message' => 'Logged out successfully',
        ]);
    }

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/dashboard/summary')->assertUnauthorized();
    }
}
