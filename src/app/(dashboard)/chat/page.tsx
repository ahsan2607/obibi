export default function ChatLanding() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center h-full">
      <div className="bg-blue-50 p-6 rounded-full mb-6">
        <span className="text-4xl">👋</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Obibi</h2>
      <p className="text-gray-500 max-w-md">
        Select a chat from the sidebar or start a new one to begin chatting about your medicines or health concerns.
      </p>
    </div>
  );
}
