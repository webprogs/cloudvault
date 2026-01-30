<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadChunkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $maxChunkSize = config('upload.chunk_size', 5 * 1024 * 1024) + 1024; // Allow 1KB tolerance

        return [
            'chunk_index' => ['required', 'integer', 'min:0'],
            'chunk' => ['required', 'file', 'max:' . ceil($maxChunkSize / 1024)], // max in KB
        ];
    }

    public function messages(): array
    {
        return [
            'chunk_index.required' => 'Chunk index is required.',
            'chunk_index.integer' => 'Chunk index must be an integer.',
            'chunk_index.min' => 'Chunk index must be non-negative.',
            'chunk.required' => 'Chunk data is required.',
            'chunk.file' => 'Chunk must be a valid file.',
            'chunk.max' => 'Chunk size exceeds the maximum allowed size.',
        ];
    }
}
