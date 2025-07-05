import { supabase } from '../lib/supabase.js'

// Notion API Configuration
const NOTION_CONFIG = {
  apiKey: import.meta.env.VITE_NOTION_API_KEY,
  apiBase: 'https://api.notion.com/v1'
}

// Check if real Notion integration is configured
const isRealNotionConfigured = () => {
  return NOTION_CONFIG.apiKey && NOTION_CONFIG.apiKey !== 'your-notion-api-key'
}

// Simplified authentication - no OAuth needed with API key
export const authenticateNotion = () => {
  if (!isRealNotionConfigured()) {
    return new Promise((resolve, reject) => {
      // Create a realistic authentication popup simulation
      const popup = window.open(
        '/oauth-simulation.html',
        'notion-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )
      
      // Simulate the authentication flow
      setTimeout(() => {
        try {
          // Send success message to parent window
          window.postMessage({
            type: 'NOTION_AUTH_SUCCESS',
            token: 'demo_token_' + Date.now()
          }, window.location.origin)
          
          popup?.close()
        } catch (error) {
          console.log('Could not close popup - continuing...')
        }
      }, 2000)
      
      // Listen for the message
      const handleMessage = (event) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'NOTION_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage)
          resolve(event.data.token)
        } else if (event.data.type === 'NOTION_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage)
          reject(new Error(event.data.error))
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Remove problematic popup.closed check
      // The message listener will handle OAuth completion
    })
  }
  
  // For real Notion integration, return success immediately
  return Promise.resolve('authenticated')
}

// Notion API Functions
export async function createNotionPage(content, parentPageId, isReauthAttempt = false) {
  return await callNotionApiWithPolicy('create_page', { content, parent_page_id: parentPageId }, isReauthAttempt);
}

export async function updateNotionPage(pageId, content) {
  return await callNotionApiWithPolicy('update_page', { target_url: pageId, content });
}

export async function appendToNotionPage(pageId, content) {
  return await callNotionApiWithPolicy('append_page', { target_url: pageId, content });
}

// Utility to convert Notion page ID to UUID format
function toNotionUUID(id) {
  const clean = id.replace(/-/g, '');
  if (clean.length !== 32) return id;
  return [
    clean.substr(0, 8),
    clean.substr(8, 4),
    clean.substr(12, 4),
    clean.substr(16, 4),
    clean.substr(20)
  ].join('-');
}

function isValidNotionId(id) {
  // 32 hex chars, optionally with dashes
  return /^[0-9a-fA-F]{32}$/.test(id.replace(/-/g, ''));
}

// Token management functions (simplified for API key approach)
export const storeNotionToken = (userId, token) => {
  localStorage.setItem(`notion_token_${userId}`, token)
}

export const getNotionToken = (userId) => {
  return localStorage.getItem(`notion_token_${userId}`)
}

export const removeNotionToken = (userId) => {
  localStorage.removeItem(`notion_token_${userId}`)
}

export const isTokenValid = async () => {
  // For API key approach, we assume the key is always valid
  return true
}

// Helper to get current user ID
async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

const NOTION_API_URL = import.meta.env.PROD
  ? 'https://gvqsvvfvcurzgfwbjutq.functions.supabase.co/notion-api'
  : '/api/notion';

// Example for a Notion API call (repeat for all Notion API fetches):
export async function callNotionApiWithPolicy(action, body, isReauthAttempt = false) {
  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;
  const response = await fetch(NOTION_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
    },
    body: JSON.stringify({ ...body, action, isReauthAttempt })
  });
  if (response.status === 403) {
    throw new Error('Re-authentication required by admin policy. Please reconnect to Notion.');
  }
  return response.json();
}

// Utility to extract Notion page ID from any valid Notion URL
export function extractNotionPageId(url) {
  // Match 32 hex chars, with or without dashes
  const match = url.match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (!match) return null;
  // Remove dashes if present
  return match[0].replace(/-/g, '');
} 