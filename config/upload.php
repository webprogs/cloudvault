<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Chunk Size
    |--------------------------------------------------------------------------
    |
    | The size of each chunk in bytes for chunked uploads.
    | Default is 5MB (5 * 1024 * 1024 = 5242880 bytes).
    |
    */

    'chunk_size' => (int) env('UPLOAD_CHUNK_SIZE', 5 * 1024 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Maximum File Size
    |--------------------------------------------------------------------------
    |
    | The maximum file size allowed for uploads in bytes.
    | Default is 10GB (10 * 1024 * 1024 * 1024 = 10737418240 bytes).
    |
    */

    'max_file_size' => (int) env('UPLOAD_MAX_FILE_SIZE', 10 * 1024 * 1024 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Session Expiry Hours
    |--------------------------------------------------------------------------
    |
    | The number of hours an upload session remains valid before expiring.
    | Expired sessions will be cleaned up by the scheduled cleanup job.
    |
    */

    'session_expiry_hours' => (int) env('UPLOAD_SESSION_EXPIRY_HOURS', 24),

    /*
    |--------------------------------------------------------------------------
    | Use GCP Storage
    |--------------------------------------------------------------------------
    |
    | Whether to upload files to Google Cloud Platform Storage after
    | processing. When enabled, files are uploaded to GCP asynchronously
    | via queue jobs.
    |
    */

    'use_gcp' => (bool) env('UPLOAD_USE_GCP', false),

    /*
    |--------------------------------------------------------------------------
    | Delete Local After GCP Upload
    |--------------------------------------------------------------------------
    |
    | Whether to delete the local copy of a file after it has been
    | successfully uploaded to GCP. Set to false to keep local copies.
    |
    */

    'delete_local_after_gcp' => (bool) env('UPLOAD_DELETE_LOCAL_AFTER_GCP', true),

    /*
    |--------------------------------------------------------------------------
    | Concurrent Chunk Uploads
    |--------------------------------------------------------------------------
    |
    | The maximum number of chunks that can be uploaded concurrently
    | from the frontend. This helps optimize upload speed while
    | preventing server overload.
    |
    */

    'concurrent_chunk_uploads' => (int) env('UPLOAD_CONCURRENT_CHUNKS', 3),

    /*
    |--------------------------------------------------------------------------
    | Small File Threshold
    |--------------------------------------------------------------------------
    |
    | Files smaller than this threshold (in bytes) will use the simple
    | upload method instead of chunked uploads. Default is 100MB.
    |
    */

    'small_file_threshold' => (int) env('UPLOAD_SMALL_FILE_THRESHOLD', 100 * 1024 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Maximum Active Sessions Per User
    |--------------------------------------------------------------------------
    |
    | The maximum number of active upload sessions a single user can have
    | at once. This prevents abuse of the upload system.
    |
    */

    'max_active_sessions_per_user' => (int) env('UPLOAD_MAX_ACTIVE_SESSIONS', 5),

];
