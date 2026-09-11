<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Website;

class WebsitePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Website $website): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->department_id && $website->department_id && $user->department_id === $website->department_id) {
            return true;
        }

        return $user->id === $website->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function scan(User $user, Website $website): bool
    {
        return $this->view($user, $website);
    }
}
