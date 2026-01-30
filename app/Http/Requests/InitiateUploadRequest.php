<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InitiateUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'filename' => ['required', 'string', 'max:255'],
            'file_size' => ['required', 'integer', 'min:1', 'max:' . config('upload.max_file_size', 10737418240)],
            'folder_id' => ['nullable', 'exists:folders,id'],
        ];
    }

    public function messages(): array
    {
        $maxSize = config('upload.max_file_size', 10737418240);
        $maxSizeFormatted = round($maxSize / (1024 * 1024 * 1024), 2) . 'GB';

        return [
            'filename.required' => 'A filename is required.',
            'filename.max' => 'Filename must not exceed 255 characters.',
            'file_size.required' => 'File size is required.',
            'file_size.integer' => 'File size must be an integer.',
            'file_size.min' => 'File size must be at least 1 byte.',
            'file_size.max' => "File size must not exceed {$maxSizeFormatted}.",
            'folder_id.exists' => 'The selected folder does not exist.',
        ];
    }
}
