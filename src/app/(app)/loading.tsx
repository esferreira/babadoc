export default function AppLoading() {
  return (
    <div className="flex-1 p-4 md:p-8 animate-fade-in w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="w-1/3 h-8 baba-skeleton" />
        <div className="w-32 h-10 baba-skeleton rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="baba-card p-5 h-32 flex flex-col justify-between">
            <div className="w-1/2 h-4 baba-skeleton" />
            <div className="w-full h-8 baba-skeleton" />
          </div>
        ))}
      </div>

      <div className="baba-card p-6 min-h-[400px]">
        <div className="w-1/4 h-6 mb-6 baba-skeleton" />
        
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 rounded-lg baba-skeleton flex-shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="w-3/4 h-4 baba-skeleton" />
                <div className="w-1/2 h-4 baba-skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
