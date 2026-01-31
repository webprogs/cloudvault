import FileCard from './FileCard';
import FolderCard from './FolderCard';

export default function FileGrid({
    files,
    folders,
    selectedFiles,
    onSelectFile,
    onContextMenu,
    onOpenFolder,
    onFolderContextMenu,
    onPreview,
    onDownload,
    onShare,
    onDropToFolder,
    selectedFolders,
    onSelectFolder,
}) {
    if (files.length === 0 && folders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No files yet</h3>
                <p className="text-text-secondary">Upload files to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Folders */}
            {folders.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-text-secondary mb-3">Folders</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {folders.map((folder) => (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                onOpen={() => onOpenFolder(folder.id)}
                                onContextMenu={onFolderContextMenu}
                                onDrop={onDropToFolder}
                                selected={selectedFolders?.includes(folder.id)}
                                onSelect={onSelectFolder}
                                selectable={!!onSelectFolder}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Files */}
            {files.length > 0 && (
                <div>
                    {folders.length > 0 && (
                        <h3 className="text-sm font-medium text-text-secondary mb-3">Files</h3>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                selected={selectedFiles.includes(file.id)}
                                onSelect={onSelectFile}
                                onContextMenu={onContextMenu}
                                onPreview={onPreview}
                                onDownload={onDownload}
                                onShare={onShare}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
