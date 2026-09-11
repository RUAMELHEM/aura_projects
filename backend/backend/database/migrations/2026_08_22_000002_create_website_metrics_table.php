<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_scan_id')->constrained()->onDelete('cascade');
            $table->string('category');
            $table->unsignedTinyInteger('score')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
            $table->unique(['website_scan_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_metrics');
    }
};