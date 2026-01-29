<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->select(['id', 'name', 'username', 'email', 'role', 'created_at'])
            ->withCount('files')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/CreateUser');
    }

    public function store(CreateUserRequest $request)
    {
        User::create($request->validated());

        return redirect()->route('admin.users')->with('success', 'User created successfully.');
    }

    public function destroy(User $user)
    {
        // Prevent deleting self
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Delete user's files from storage
        foreach ($user->files as $file) {
            \Storage::delete($file->storage_path);
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
