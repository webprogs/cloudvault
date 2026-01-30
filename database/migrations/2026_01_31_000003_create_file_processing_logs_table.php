<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('file_processing_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('file_id')->constrained()->onDelete('cascade');
            $table->string('step', 50);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed']);
            $table->text('message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('file_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_processing_logs');
    }
};
