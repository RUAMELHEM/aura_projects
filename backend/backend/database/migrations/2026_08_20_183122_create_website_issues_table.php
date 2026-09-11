<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('website_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_scan_id')->constrained()->onDelete('cascade');
            $table->string('category')->default('general');
            $table->string('severity')->default('low');
            $table->string('code')->nullable();
            $table->text('message');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('website_issues');
    }
};
