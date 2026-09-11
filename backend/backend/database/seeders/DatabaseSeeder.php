<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Departmanlar
        $bilgiIslem = Department::firstOrCreate(['name' => 'Bilgi İşlem']);
        $insanKaynaklari = Department::firstOrCreate(['name' => 'İnsan Kaynakları']);

        // 2. Roller
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $yoneticiRole = Role::firstOrCreate(['name' => 'kurum_yoneticisi']);
        $calisanRole = Role::firstOrCreate(['name' => 'calisan']);

        // 3. Admin Kullanıcısı
        $admin = User::firstOrCreate(
            ['email' => 'admin@aura.test'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'department_id' => $bilgiIslem->id,
            ]
        );
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        // 4. Kurum Yöneticisi (Bilgi İşlem)
        $yonetici = User::firstOrCreate(
            ['email' => 'yonetici@aura.test'],
            [
                'name' => 'Kurum Yöneticisi',
                'password' => Hash::make('password123'),
                'department_id' => $bilgiIslem->id,
            ]
        );
        $yonetici->roles()->syncWithoutDetaching([$yoneticiRole->id]);

        // 5. Çalışan 1 (Bilgi İşlem)
        $calisan = User::firstOrCreate(
            ['email' => 'calisan@aura.test'],
            [
                'name' => 'Çalışan (Bilgi İşlem)',
                'password' => Hash::make('password123'),
                'department_id' => $bilgiIslem->id,
            ]
        );
        $calisan->roles()->syncWithoutDetaching([$calisanRole->id]);

        // 6. Çalışan 2 (İnsan Kaynakları)
        $ikCalisan = User::firstOrCreate(
            ['email' => 'ik_calisan@aura.test'],
            [
                'name' => 'Çalışan (İK)',
                'password' => Hash::make('password123'),
                'department_id' => $insanKaynaklari->id,
            ]
        );
        $ikCalisan->roles()->syncWithoutDetaching([$calisanRole->id]);
    }
}
