import useVoiceSearch from '../../Hooks/useVoiceSearch';

export default function VoiceSearch({ onResult }) {
    const { isListening, isSupported, error, startListening } = useVoiceSearch(onResult);

    if (!isSupported) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={startListening}
                disabled={isListening}
                className={`p-1.5 rounded-md transition-colors ${
                    isListening
                        ? 'text-primary bg-primary-light'
                        : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                }`}
                title={isListening ? 'Listening...' : 'Voice search'}
            >
                <div className="relative">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {isListening && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full voice-active" />
                    )}
                </div>
            </button>
            {error && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-error text-white text-xs rounded-lg whitespace-nowrap z-10">
                    {error}
                </div>
            )}
        </div>
    );
}
