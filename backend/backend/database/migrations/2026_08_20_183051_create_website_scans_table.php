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
        Schema::create('website_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained()->onDelete('cascade');
            $table->string('status')->default('pending');
            $table->integer('overall_score')->nullable();
            $table->integer('seo_score')->nullable();
            $table->integer('security_score')->nullable();
            $table->integer('performance_score')->nullable();
            $table->integer('accessibility_score')->nullable();
            $table->integer('pages_crawled')->default(0);
            $table->json('crawl_result')->nullable();
            $table->text('ai_summary')->nullable();
            $table->json('ai_recommendations')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('website_scans');
    }
};
