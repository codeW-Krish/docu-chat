// app/test-api/page.tsx
'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { LoginData } from '@/lib/api';



export default function TestApiPage() {
  const [result, setResult] = useState<string>('');

  const testApi = async () => {
    try {
      setResult('Testing API connection...');
      const response = await fetch('http://localhost:8080/test-python-quick');
      const data = await response.json();
      setResult(`✅ API Connected: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testAuth = async () => {


    try {
      const response = await api.login({
        email: "tedf@gmail.com",
        password:"password"
      });
      setResult(`✅ Auth endpoint: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`❌ Auth Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">API Connection Test</h1>
        <div className="space-y-2">
          <button 
            onClick={testApi}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Test API Connection
          </button>
          <button 
            onClick={testAuth}
            className="w-full bg-green-500 text-white p-2 rounded"
          >
            Test Auth Endpoint
          </button>
        </div>
        <pre className="bg-gray-100 p-4 rounded text-sm">{result}</pre>
      </div>
    </div>
  );
}