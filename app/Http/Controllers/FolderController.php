<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FolderController extends Controller
{
    public function tree(): JsonResponse
    {
        $folders = Folder::where('user_id', auth()->id())
            ->with('children')
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();

        return response()->json(['folders' => $this->buildTree($folders)]);
    }

    protected function buildTree($folders): array
    {
        return $folders->map(function ($folder) {
            return [
                'id' => $folder->id,
                'name' => $folder->name,
                'children' => $this->buildTree($folder->children),
            ];
        })->toArray();
    }

    public function group(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'folder_ids' => ['required', 'array', 'min:2'],
            'folder_ids.*' => ['integer', 'exists:folders,id'],
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'integer', 'exists:folders,id'],
        ]);

        // Verify ownership of all folders
        $folders = Folder::where('user_id', auth()->id())
            ->whereIn('id', $validated['folder_ids'])
            ->get();

        if ($folders->count() !== count($validated['folder_ids'])) {
            return back()->with('error', 'Some folders could not be found.');
        }

        // Verify parent folder ownership if specified
        if ($validated['parent_id']) {
            Folder::where('user_id', auth()->id())->findOrFail($validated['parent_id']);
        }

        // Check for duplicate folder name in target directory
        $exists = Folder::where('user_id', auth()->id())
            ->where('parent_id', $validated['parent_id'])
            ->where('name', $validated['name'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'A folder with this name already exists.');
        }

        // Create the parent folder
        $parentFolder = Folder::create([
            'user_id' => auth()->id(),
            'parent_id' => $validated['parent_id'],
            'name' => $validated['name'],
        ]);

        // Move all selected folders into the new parent
        foreach ($folders as $folder) {
            $folder->update(['parent_id' => $parentFolder->id]);
        }

        return back()->with('success', 'Folders grouped successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:folders,id'],
        ]);

        // Verify parent folder ownership if specified
        if ($validated['parent_id']) {
            Folder::where('user_id', auth()->id())->findOrFail($validated['parent_id']);
        }

        // Check for duplicate folder name in same directory
        $exists = Folder::where('user_id', auth()->id())
            ->where('parent_id', $validated['parent_id'])
            ->where('name', $validated['name'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'A folder with this name already exists.');
        }

        Folder::create([
            'user_id' => auth()->id(),
            'parent_id' => $validated['parent_id'],
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Folder created successfully.');
    }

    public function update(Request $request, Folder $folder)
    {
        // Check ownership
        if ($folder->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        // Check for duplicate folder name in same directory
        $exists = Folder::where('user_id', auth()->id())
            ->where('parent_id', $folder->parent_id)
            ->where('name', $validated['name'])
            ->where('id', '!=', $folder->id)
            ->exists();

        if ($exists) {
            return back()->with('error', 'A folder with this name already exists.');
        }

        $folder->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Folder renamed successfully.');
    }

    public function destroy(Folder $folder)
    {
        // Check ownership
        if ($folder->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Delete all files in this folder and subfolders
        $this->deleteFilesRecursively($folder);

        // Delete the folder (cascade will handle subfolders and their files)
        $folder->delete();

        return back()->with('success', 'Folder deleted successfully.');
    }

    public function move(Request $request, Folder $folder)
    {
        // Check ownership
        if ($folder->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'parent_id' => ['nullable', 'exists:folders,id'],
        ]);

        // Can't move folder into itself or its children
        if ($validated['parent_id']) {
            $targetFolder = Folder::where('user_id', auth()->id())->findOrFail($validated['parent_id']);

            // Check if target is a child of the folder being moved
            $parent = $targetFolder;
            while ($parent) {
                if ($parent->id === $folder->id) {
                    return back()->with('error', 'Cannot move a folder into itself or its children.');
                }
                $parent = $parent->parent;
            }
        }

        // Check for duplicate folder name in target directory
        $exists = Folder::where('user_id', auth()->id())
            ->where('parent_id', $validated['parent_id'])
            ->where('name', $folder->name)
            ->where('id', '!=', $folder->id)
            ->exists();

        if ($exists) {
            return back()->with('error', 'A folder with this name already exists in the destination.');
        }

        $folder->update([
            'parent_id' => $validated['parent_id'],
        ]);

        return back()->with('success', 'Folder moved successfully.');
    }

    protected function deleteFilesRecursively(Folder $folder): void
    {
        // Delete files in this folder
        foreach ($folder->files as $file) {
            Storage::delete($file->storage_path);
        }

        // Recursively delete files in subfolders
        foreach ($folder->children as $child) {
            $this->deleteFilesRecursively($child);
        }
    }
}
