'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { migrateEntriesToCategoryId, checkMigrationStatus } from '@/app/actions/migrate-entries';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Play, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MigrateCategoriesPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isSuperadmin = userData?.role === 'superadmin' || 
                       userData?.username === 'superadmin' || 
                       userData?.username === 'admingod';

  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.push('/login');
      } else if (!isSuperadmin) {
        router.push('/admin/dashboard');
      }
    }
  }, [userData, authLoading, router, isSuperadmin]);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await checkMigrationStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm(`⚠️ ต้องการ Migrate Entries ทั้งหมดหรือไม่?\n\nระบบจะเพิ่ม categoryId ให้กับ entries ที่ยังไม่มี\n\n${status?.needsMigration || 0} entries ต้อง migrate`)) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const data = await migrateEntriesToCategoryId();
      setResult(data);
      await loadStatus(); // Reload status after migration
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      });
    } finally {
      setMigrating(false);
    }
  };

  if (authLoading || !isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            Category Migration
          </h1>
          <p className="text-gray-600 mt-2">
            Migrate legacy entries from category names to category IDs
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-800">Migration Status</h2>
          </div>

          {loadingStatus ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{status?.total || 0}</div>
                <div className="text-sm text-blue-800 font-medium">Total Entries</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{status?.withCategoryId || 0}</div>
                <div className="text-sm text-green-800 font-medium">✅ Migrated</div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{status?.needsMigration || 0}</div>
                <div className="text-sm text-orange-800 font-medium">⚠️ Needs Migration</div>
              </div>
            </div>
          )}

          <button
            onClick={loadStatus}
            disabled={loadingStatus}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Migration Action */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Run Migration</h3>
          
          <div className="bg-white rounded-lg p-4 mb-4 border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">What this migration does:</h4>
            <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
              <li>Finds all entries with <code>category</code> (string) but no <code>categoryId</code></li>
              <li>Looks up the category ID from work_categories collection</li>
              <li>Adds <code>categoryId</code> field to each entry</li>
              <li>Keeps original <code>category</code> for backward compatibility</li>
              <li>Updates in batches (500 per batch) for performance</li>
            </ul>
          </div>

          {status && status.needsMigration > 0 && (
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {migrating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  🚀 Run Migration ({status.needsMigration} entries)
                </>
              )}
            </button>
          )}

          {status && status.needsMigration === 0 && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">All entries are migrated!</p>
                <p className="text-xs text-green-800 mt-1">No migration needed.</p>
              </div>
            </div>
          )}
        </div>

        {/* Migration Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl shadow-lg p-6 ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Migration Successful!' : 'Migration Failed'}
                </h3>
                <p className={`text-sm mt-1 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
              </div>
            </div>

            {result.success && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{result.migrated}</div>
                  <div className="text-xs text-green-800">Migrated</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">{result.skipped}</div>
                  <div className="text-xs text-gray-800">Skipped</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                  <div className="text-xs text-red-800">Errors</div>
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="font-bold text-red-900 mb-2 text-sm">Errors:</h4>
                <ul className="text-xs text-red-800 space-y-1">
                  {result.errors.map((err: any, index: number) => (
                    <li key={index} className="font-mono">
                      {err.entryId}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">⚠️ Important Notes:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Run this migration AFTER seeding categories</li>
              <li>This is a ONE-TIME migration (safe to run multiple times)</li>
              <li>Backup your database before running in production</li>
              <li>Large databases may take several minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

