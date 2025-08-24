import { Bluetooth, Wifi } from "lucide-react";

export default function StatusBar() {
  return (
    <div className="flex justify-between items-center px-4 py-2 text-sm text-white bg-dark-primary">
      <div className="flex items-center space-x-1">
        <span data-testid="text-time">17:01</span>
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <span className="text-xs">•</span>
      </div>
      <div className="flex items-center space-x-1">
        <Bluetooth size={12} />
        <span className="text-xs" data-testid="text-network">5G</span>
        <div className="flex space-x-1">
          <div className="w-1 h-3 bg-white"></div>
          <div className="w-1 h-3 bg-white"></div>
          <div className="w-1 h-3 bg-white"></div>
          <div className="w-1 h-3 bg-gray-500"></div>
        </div>
        <div className="bg-white text-black px-1 rounded text-xs" data-testid="text-battery">72</div>
      </div>
    </div>
  );
}
