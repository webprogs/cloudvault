<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->string('gcp_path', 500)->nullable()->after('storage_path');
            $table->enum('storage_disk', ['local', 'gcs'])->default('local')->after('gcp_path');
            $table->enum('processing_status', ['pending', 'processing', 'completed', 'failed'])
                ->default('completed')
                ->after('storage_disk');
            $table->uuid('upload_session_id')->nullable()->after('processing_status');

            $table->index('processing_status');
            $table->index('upload_session_id');
            $table->index('storage_disk');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropIndex(['processing_status']);
            $table->dropIndex(['upload_session_id']);
            $table->dropIndex(['storage_disk']);
            $table->dropColumn(['gcp_path', 'storage_disk', 'processing_status', 'upload_session_id']);
        });
    }
};
