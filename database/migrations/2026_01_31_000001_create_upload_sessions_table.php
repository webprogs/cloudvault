<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upload_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('folder_id')->nullable()->constrained()->onDelete('set null');
            $table->string('original_filename');
            $table->unsignedBigInteger('total_size');
            $table->unsignedInteger('total_chunks');
            $table->unsignedInteger('chunk_size');
            $table->json('uploaded_chunks')->default('[]');
            $table->string('temp_path', 500);
            $table->enum('status', [
                'pending',
                'uploading',
                'assembling',
                'processing',
                'completed',
                'failed',
                'cancelled'
            ])->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('upload_sessions');
    }
};
