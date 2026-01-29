<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FileUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['required', 'file', 'max:102400'], // 100MB max
            'folder_id' => ['nullable', 'exists:folders,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least one file to upload.',
            'files.*.file' => 'Each item must be a valid file.',
            'files.*.max' => 'Each file must not exceed 100MB.',
        ];
    }
}
