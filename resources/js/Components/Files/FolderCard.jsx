export default function FolderCard({ folder, onOpen, onContextMenu }) {
    return (
        <div
            className="group relative bg-card border border-border rounded-2xl p-4 transition-all duration-200 cursor-pointer card-hover hover:border-primary/40 hover:shadow-lg"
            onClick={onOpen}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, folder);
            }}
        >
            {/* Folder icon */}
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-light to-blue-100 text-primary transition-transform duration-200 group-hover:scale-110">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
            </div>

            {/* Folder info */}
            <div className="text-center">
                <p className="text-sm font-medium text-text-primary truncate max-w-[140px] mx-auto" title={folder.name}>
                    {folder.name}
                </p>
            </div>

            {/* More options button */}
            <button
                className="absolute top-3 right-3 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all duration-200"
                onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, folder);
                }}
            >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
            </button>
        </div>
    );
}
