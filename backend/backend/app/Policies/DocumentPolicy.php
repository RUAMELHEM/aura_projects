<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine whether the user can view any documents.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        // Admin tüm dokümanları görebilir
        if ($user->hasRole('admin')) {
            return true;
        }

        // Kullanıcı kendi dokümanını görebilir
        if ($user->id === $document->user_id) {
            return true;
        }

        // Kurum yöneticisi kendi departmanındaki çalışanların dokümanlarını görebilir
        if ($user->hasRole('kurum_yoneticisi') && $user->department_id && $document->user && $user->department_id === $document->user->department_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create documents.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the document.
     */
    public function update(User $user, Document $document): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->id === $document->user_id;
    }

    /**
     * Determine whether the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->id === $document->user_id;
    }
}
