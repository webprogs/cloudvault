<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ChunkedUploadController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FileShareController;
use App\Http\Controllers\FolderController;
use Illuminate\Support\Facades\Route;

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/', fn() => redirect()->route('login'));
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// Public share routes (no auth required)
Route::get('/share/{token}', [FileShareController::class, 'access'])->name('share.access');
Route::post('/share/{token}/verify', [FileShareController::class, 'verifyPassword'])->name('share.verify');
Route::get('/share/{token}/download', [FileShareController::class, 'download'])->name('share.download');

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Password change
    Route::get('/password', [PasswordController::class, 'show'])->name('password.show');
    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');

    // Files
    Route::get('/files', [FileController::class, 'index'])->name('files.index');
    Route::post('/files/upload', [FileController::class, 'upload'])->name('files.upload');
    Route::get('/files/{file}/download', [FileController::class, 'download'])->name('files.download');
    Route::get('/files/{file}/thumbnail', [FileController::class, 'thumbnail'])->name('files.thumbnail');
    Route::get('/files/{file}/processing-status', [FileController::class, 'processingStatus'])->name('files.processing-status');
    Route::delete('/files/{file}', [FileController::class, 'destroy'])->name('files.destroy');
    Route::post('/files/bulk-delete', [FileController::class, 'bulkDelete'])->name('files.bulk-delete');
    Route::patch('/files/{file}/rename', [FileController::class, 'rename'])->name('files.rename');
    Route::patch('/files/{file}/move', [FileController::class, 'move'])->name('files.move');

    // Chunked Uploads API
    Route::prefix('api/uploads')->name('uploads.')->group(function () {
        Route::get('/', [ChunkedUploadController::class, 'index'])->name('index');
        Route::post('/initiate', [ChunkedUploadController::class, 'initiate'])->name('initiate');
        Route::post('/{session}/chunk', [ChunkedUploadController::class, 'uploadChunk'])->name('chunk');
        Route::get('/{session}/status', [ChunkedUploadController::class, 'status'])->name('status');
        Route::delete('/{session}', [ChunkedUploadController::class, 'cancel'])->name('cancel');
    });

    // Folders
    Route::get('/folders/tree', [FolderController::class, 'tree'])->name('folders.tree');
    Route::post('/folders/group', [FolderController::class, 'group'])->name('folders.group');
    Route::post('/folders', [FolderController::class, 'store'])->name('folders.store');
    Route::patch('/folders/{folder}', [FolderController::class, 'update'])->name('folders.update');
    Route::delete('/folders/{folder}', [FolderController::class, 'destroy'])->name('folders.destroy');
    Route::patch('/folders/{folder}/move', [FolderController::class, 'move'])->name('folders.move');

    // File Shares (authenticated)
    Route::prefix('shares')->name('shares.')->group(function () {
        Route::get('/', [FileShareController::class, 'index'])->name('index');
        Route::post('/files/{file}', [FileShareController::class, 'store'])->name('store');
        Route::get('/files/{file}', [FileShareController::class, 'show'])->name('show');
        Route::patch('/{share}', [FileShareController::class, 'update'])->name('update');
        Route::delete('/{share}', [FileShareController::class, 'destroy'])->name('destroy');
    });

    // Admin routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});
