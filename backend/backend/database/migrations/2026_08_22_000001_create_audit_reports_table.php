<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_scan_id')->unique()->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('overall_score')->nullable();
            $table->unsignedInteger('total_issues')->default(0);
            $table->json('issues_by_severity')->nullable();
            $table->text('summary')->nullable();
            $table->json('recommendations')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_reports');
    }
};