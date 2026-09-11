<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any users.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('kurum_yoneticisi');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $currentUser, User $targetUser): bool
    {
        if ($currentUser->hasRole('admin')) {
            return true;
        }

        if ($currentUser->hasRole('kurum_yoneticisi') && $currentUser->department_id && $currentUser->department_id === $targetUser->department_id) {
            return true;
        }

        return $currentUser->id === $targetUser->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('kurum_yoneticisi');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $currentUser, User $targetUser): bool
    {
        if ($currentUser->hasRole('admin')) {
            return true;
        }

        if ($currentUser->hasRole('kurum_yoneticisi') && $currentUser->department_id && $currentUser->department_id === $targetUser->department_id) {
            return true;
        }

        return $currentUser->id === $targetUser->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $currentUser, User $targetUser): bool
    {
        return $currentUser->hasRole('admin');
    }
}
