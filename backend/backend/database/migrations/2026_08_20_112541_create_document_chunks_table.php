<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // PostgreSQL pgvector eklentisini aktif et (Eğer yoksa)
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        Schema::create('document_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->onDelete('cascade');
            $table->integer('chunk_index');
            $table->text('text');
            // pgvector boyutu modelimize göre (paraphrase-multilingual-MiniLM-L12-v2 = 384)
            // Laravel'in Blueprint'inde `vector` tipi standart olmadığı için DB::statement ile eklenebilir,
            // ama Laravel 10'da raw kullanabiliriz ya da sütunu ekledikten sonra tipini değiştirebiliriz.
            // En temizi sütunu oluştururken doğrudan eklemek (geography vb. gibi). 
            // Ancak, en garantilisi ayrı bir statement çalıştırmak.
        });

        // Vektör sütununu ekle
        DB::statement('ALTER TABLE document_chunks ADD COLUMN embedding vector(384)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_chunks');
    }
};
