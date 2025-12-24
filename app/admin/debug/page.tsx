'use client';

import { useState } from 'react';
import { debugFirestoreConnection } from '@/app/actions/debug-firestore';

export default function DebugPage() {
          const [result, setResult] = useState<any>(null);
          const [loading, setLoading] = useState(false);

          const runTest = async () => {
                    setLoading(true);
                    setResult(null);
                    try {
                              const data = await debugFirestoreConnection();
                              setResult(data);
                    } catch (e: any) {
                              setResult({ error: 'Client-side error calling action', details: e.message });
                    } finally {
                              setLoading(false);
                    }
          };

          return (
                    <div className="p-8 max-w-2xl mx-auto">
                              <h1 className="text-2xl font-bold mb-6">Firestore Connection Debugger</h1>

                              <button
                                        onClick={runTest}
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
                              >
                                        {loading ? 'Running Test...' : 'Test Connection'}
                              </button>

                              {result && (
                                        <div className={`mt-8 p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                  <h2 className="font-bold text-lg mb-2">
                                                            {result.success ? '✅ Success' : '❌ Failed'}
                                                  </h2>
                                                  <pre className="whitespace-pre-wrap overflow-x-auto text-sm font-mono bg-white p-4 rounded border border-gray-100">
                                                            {JSON.stringify(result, null, 2)}
                                                  </pre>
                                        </div>
                              )}
                    </div>
          );
}
