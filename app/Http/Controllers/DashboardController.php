<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get storage stats
        $totalSize = File::where('user_id', $user->id)->sum('size');
        $fileCount = File::where('user_id', $user->id)->count();
        $folderCount = Folder::where('user_id', $user->id)->count();

        // Get file type breakdown
        $typeBreakdown = File::where('user_id', $user->id)
            ->selectRaw('extension, count(*) as count, sum(size) as total_size')
            ->groupBy('extension')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Get recent files
        $recentFiles = File::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_size' => $this->formatBytes($totalSize),
                'total_size_bytes' => $totalSize,
                'file_count' => $fileCount,
                'folder_count' => $folderCount,
            ],
            'typeBreakdown' => $typeBreakdown,
            'recentFiles' => $recentFiles,
        ]);
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
