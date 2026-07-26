import { Grid, ChevronDown, Filter } from 'lucide-react';

export default function Monitoring() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-on-background">Peer Monitoring</h2>
            <p className="text-secondary text-sm mt-1">Real-time latency mesh analysis and node health tracking.</p>
          </div>
          <div className="flex items-center space-x-3 bg-surface-container p-1.5 rounded border border-outline-variant">
            <label htmlFor="ref-node" className="text-xs font-semibold text-secondary uppercase tracking-wider pl-2">Ref Node:</label>
            <div className="relative">
              <select id="ref-node" className="bg-surface border-none text-sm text-on-surface rounded py-1 pl-2 pr-8 focus:ring-0 cursor-pointer appearance-none">
                <option>NYC-Edge-01</option>
                <option>LON-Core-04</option>
                <option>SGP-Relay-02</option>
                <option>FRA-Edge-09</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mesh Heatmap */}
          <div className="lg:col-span-2 bg-surface-container rounded-lg border border-outline-variant flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-semibold text-sm text-on-surface flex items-center space-x-2">
                <Grid className="text-secondary w-4 h-4" />
                <span>Global Mesh Latency Matrix (ms)</span>
              </h3>
              <div className="flex items-center space-x-4 text-xs text-secondary">
                <span className="flex items-center"><div className="w-2 h-2 rounded bg-tertiary mr-1.5"></div>&lt; 50ms</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded bg-primary mr-1.5"></div>50-150ms</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded bg-error mr-1.5"></div>&gt; 150ms</span>
              </div>
            </div>
            <div className="p-5 flex-1 overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Column Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  <div className="h-8"></div>
                  <div className="h-8 flex items-end justify-center pb-1 text-[10px] font-mono text-secondary truncate">NYC-01</div>
                  <div className="h-8 flex items-end justify-center pb-1 text-[10px] font-mono text-secondary truncate">LON-04</div>
                  <div className="h-8 flex items-end justify-center pb-1 text-[10px] font-mono text-secondary truncate">SGP-02</div>
                  <div className="h-8 flex items-end justify-center pb-1 text-[10px] font-mono text-secondary truncate">FRA-09</div>
                  <div className="h-8 flex items-end justify-center pb-1 text-[10px] font-mono text-secondary truncate">TOK-05</div>
                  <div className="h-8 flex items-end justify-center pb-1 text-[10px] font-mono text-secondary truncate">SYD-11</div>
                </div>

                <div className="space-y-1">
                  {/* Row 1 */}
                  <div className="grid grid-cols-7 gap-1">
                    <div className="h-10 flex items-center justify-end pr-3 text-[10px] font-mono text-secondary truncate">NYC-01</div>
                    <div className="h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center text-xs text-secondary">0</div>
                    <div className="h-10 bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-on-surface font-mono">85</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">210</div>
                    <div className="h-10 bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-on-surface font-mono">92</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">180</div>
                    <div className="h-10 bg-error/40 border border-error/50 flex items-center justify-center text-xs text-on-surface font-mono">245</div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-7 gap-1">
                    <div className="h-10 flex items-center justify-end pr-3 text-[10px] font-mono text-secondary truncate">LON-04</div>
                    <div className="h-10 bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-on-surface font-mono">85</div>
                    <div className="h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center text-xs text-secondary">0</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">165</div>
                    <div className="h-10 bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-xs text-on-surface font-mono">18</div>
                    <div className="h-10 bg-error/40 border border-error/50 flex items-center justify-center text-xs text-on-surface font-mono">230</div>
                    <div className="h-10 bg-error/50 border border-error/60 flex items-center justify-center text-xs text-on-surface font-mono font-bold text-error">290</div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-7 gap-1">
                    <div className="h-10 flex items-center justify-end pr-3 text-[10px] font-mono text-secondary truncate">SGP-02</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">210</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">165</div>
                    <div className="h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center text-xs text-secondary">0</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">175</div>
                    <div className="h-10 bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-xs text-on-surface font-mono">70</div>
                    <div className="h-10 bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-on-surface font-mono">110</div>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-7 gap-1">
                    <div className="h-10 flex items-center justify-end pr-3 text-[10px] font-mono text-secondary truncate">FRA-09</div>
                    <div className="h-10 bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-on-surface font-mono">92</div>
                    <div className="h-10 bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-xs text-on-surface font-mono">18</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">175</div>
                    <div className="h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center text-xs text-secondary">0</div>
                    <div className="h-10 bg-error/40 border border-error/50 flex items-center justify-center text-xs text-on-surface font-mono">240</div>
                    <div className="h-10 bg-error/50 border border-error/60 flex items-center justify-center text-xs text-on-surface font-mono text-error">295</div>
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-7 gap-1">
                    <div className="h-10 flex items-center justify-end pr-3 text-[10px] font-mono text-secondary truncate">TOK-05</div>
                    <div className="h-10 bg-error/20 border border-error/30 flex items-center justify-center text-xs text-on-surface font-mono">180</div>
                    <div className="h-10 bg-error/40 border border-error/50 flex items-center justify-center text-xs text-on-surface font-mono">230</div>
                    <div className="h-10 bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-xs text-on-surface font-mono">70</div>
                    <div className="h-10 bg-error/40 border border-error/50 flex items-center justify-center text-xs text-on-surface font-mono">240</div>
                    <div className="h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center text-xs text-secondary">0</div>
                    <div className="h-10 bg-primary/20 border border-primary/30 flex items-center justify-center text-xs text-on-surface font-mono">105</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Relative Latency Chart */}
          <div className="bg-surface-container rounded-lg border border-outline-variant flex flex-col overflow-hidden h-[400px]">
            <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="font-semibold text-sm text-on-surface">Relative to NYC-01</h3>
              <button className="text-secondary hover:text-primary transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-on-surface">LON-04</span>
                  <span className="text-xs font-mono text-primary">85 ms</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[28%]"></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-on-surface">FRA-09</span>
                  <span className="text-xs font-mono text-primary">92 ms</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[31%]"></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-on-surface">TOK-05</span>
                  <span className="text-xs font-mono text-error">180 ms</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full w-[60%]"></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-on-surface">SGP-02</span>
                  <span className="text-xs font-mono text-error">210 ms</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full w-[70%]"></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-mono text-on-surface">SYD-11</span>
                  <span className="text-xs font-mono text-error font-bold">245 ms</span>
                </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full w-[82%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
