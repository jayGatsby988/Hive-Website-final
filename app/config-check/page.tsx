'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

interface CheckResult {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function ConfigCheckPage() {
  const [checks, setChecks] = useState<CheckResult[]>([
    { name: 'Environment Variables', status: 'checking', message: 'Checking...' },
    { name: 'Supabase Connection', status: 'checking', message: 'Checking...' },
    { name: 'Database Access', status: 'checking', message: 'Checking...' },
    { name: 'Authentication', status: 'checking', message: 'Checking...' },
  ]);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = async () => {
    const results: CheckResult[] = [];

    // Check 1: Environment Variables
    const envCheck: CheckResult = {
      name: 'Environment Variables',
      status: 'checking',
      message: 'Checking...',
    };

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      envCheck.status = 'success';
      envCheck.message = 'All required environment variables are set';
      envCheck.details = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length,
      };
    } else {
      envCheck.status = 'error';
      envCheck.message = 'Missing required environment variables';
      envCheck.details = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      };
    }
    results.push(envCheck);
    setChecks([...results]);

    // Check 2: Supabase Connection
    const connectionCheck: CheckResult = {
      name: 'Supabase Connection',
      status: 'checking',
      message: 'Checking...',
    };

    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        connectionCheck.status = 'error';
        connectionCheck.message = `Connection failed: ${error.message}`;
        connectionCheck.details = error;
      } else {
        connectionCheck.status = 'success';
        connectionCheck.message = 'Successfully connected to Supabase';
      }
    } catch (err: any) {
      connectionCheck.status = 'error';
      connectionCheck.message = `Connection error: ${err.message}`;
      connectionCheck.details = err;
    }
    results.push(connectionCheck);
    setChecks([...results]);

    // Check 3: Database Access
    const dbCheck: CheckResult = {
      name: 'Database Access',
      status: 'checking',
      message: 'Checking...',
    };

    try {
      // Try to access multiple tables
      const tables = ['users', 'organizations', 'events'];
      const tableResults: any = {};
      let allSuccess = true;

      for (const table of tables) {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          tableResults[table] = `Error: ${error.message}`;
          allSuccess = false;
        } else {
          tableResults[table] = 'Accessible';
        }
      }

      if (allSuccess) {
        dbCheck.status = 'success';
        dbCheck.message = 'All tables are accessible';
        dbCheck.details = tableResults;
      } else {
        dbCheck.status = 'warning';
        dbCheck.message = 'Some tables are not accessible';
        dbCheck.details = tableResults;
      }
    } catch (err: any) {
      dbCheck.status = 'error';
      dbCheck.message = `Database error: ${err.message}`;
      dbCheck.details = err;
    }
    results.push(dbCheck);
    setChecks([...results]);

    // Check 4: Authentication
    const authCheck: CheckResult = {
      name: 'Authentication',
      status: 'checking',
      message: 'Checking...',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        authCheck.status = 'success';
        authCheck.message = `Logged in as: ${session.user.email}`;
        authCheck.details = {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role,
        };
      } else {
        authCheck.status = 'warning';
        authCheck.message = 'No active session - user not logged in';
      }
    } catch (err: any) {
      authCheck.status = 'error';
      authCheck.message = `Auth error: ${err.message}`;
      authCheck.details = err;
    }
    results.push(authCheck);
    setChecks([...results]);
  };

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'checking':
        return <Loader className="w-5 h-5 text-gray-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: CheckResult['status']) => {
    switch (status) {
      case 'checking':
        return 'bg-gray-50 border-gray-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">HIVE Configuration Check</h1>
        <p className="text-gray-600 mb-8">
          This page checks your Supabase configuration and connection status
        </p>

        <div className="space-y-4">
          {checks.map((check, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 transition-all ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(check.status)}
                    <h3 className="text-lg font-semibold text-gray-900">{check.name}</h3>
                  </div>
                  <p className="text-gray-700">{check.message}</p>
                  {check.details && (
                    <div className="mt-3 p-3 bg-white/50 rounded border border-gray-200">
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Create a <code className="px-1 py-0.5 bg-blue-100 rounded">.env.local</code> file in your project root</li>
            <li>Add your Supabase URL: <code className="px-1 py-0.5 bg-blue-100 rounded">NEXT_PUBLIC_SUPABASE_URL=your_url</code></li>
            <li>Add your Supabase anon key: <code className="px-1 py-0.5 bg-blue-100 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key</code></li>
            <li>Get these values from your Supabase project: Settings → API</li>
            <li>Restart your development server after adding environment variables</li>
          </ol>
        </div>

        <div className="mt-4 flex gap-4">
          <button
            onClick={runChecks}
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Run Checks Again
          </button>
          <a
            href="/"
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
