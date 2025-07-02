import React from 'react'

// Notion Logo
export const NotionIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933l3.222-.233zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.933.934 1.494v13.904c0 .747-.233 1.027-1.214.98L2.27 19.95c-.841-.046-1.495-.373-1.495-1.167V2.295c0-.747.374-1.027 1.161-.98z"/>
  </svg>
)

// Slack Logo
export const SlackIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.194 14.644c0 1.16-.943 2.107-2.107 2.107-1.16 0-2.107-.943-2.107-2.107 0-1.16.943-2.106 2.107-2.106h2.107v2.106zm1.061 0c0-1.16.943-2.107 2.107-2.107 1.16 0 2.107.943 2.107 2.107v5.355c0 1.16-.943 2.107-2.107 2.107-1.16 0-2.107-.943-2.107-2.107v-5.355zm2.107-8.517c-1.16 0-2.107-.943-2.107-2.107 0-1.16.943-2.107 2.107-2.107s2.107.943 2.107 2.107v2.107h-2.107zm0 1.061c1.16 0 2.107.943 2.107 2.107s-.943 2.107-2.107 2.107h-5.355c-1.16 0-2.107-.943-2.107-2.107s.943-2.107 2.107-2.107h5.355zm8.517 2.107c0-1.16.943-2.107 2.107-2.107s2.107.943 2.107 2.107-2.107 2.107-2.107 2.107h-2.107v-2.107zm-1.061 0c0 1.16-.943 2.107-2.107 2.107s-2.107-.943-2.107-2.107v-5.355c0-1.16.943-2.107 2.107-2.107s2.107.943 2.107 2.107v5.355zm-2.107 8.517c1.16 0 2.107.943 2.107 2.107s-.943 2.107-2.107 2.107-2.107-.943-2.107-2.107v-2.107h2.107zm0-1.061c-1.16 0-2.107-.943-2.107-2.107s.943-2.107 2.107-2.107h5.355c1.16 0 2.107.943 2.107 2.107s-.943 2.107-2.107 2.107h-5.355z"/>
  </svg>
)

// Google Drive Logo
export const GoogleDriveIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.87 15.5l2.5-4.33 2.5 4.33H4.87zm9.13-15.5L8.37 9.17l2.5 4.33 5.63-9.67zM19.13 15.5h-5l2.5-4.33 2.5 4.33z"/>
  </svg>
)

// Canva Logo
export const CanvaIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

// Zendesk Logo
export const ZendeskIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

// Dropbox Logo
export const DropboxIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.004 3.5l-4.5 2.5 4.5 2.5 4.5-2.5-4.5-2.5zm-4.5 7l4.5 2.5 4.5-2.5-4.5-2.5-4.5 2.5zm9 2.5l4.5-2.5-4.5-2.5-4.5 2.5 4.5 2.5zm9-7l-4.5-2.5-4.5 2.5 4.5 2.5 4.5-2.5z"/>
  </svg>
)

// Generic App Icon (fallback)
export const AppIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

// Icon mapping
export const getAppIcon = (appKey, className = "w-6 h-6") => {
  const iconMap = {
    notion: NotionIcon,
    slack: SlackIcon,
    'google-drive': GoogleDriveIcon,
    canva: CanvaIcon,
    zendesk: ZendeskIcon,
    'personal-dropbox': DropboxIcon,
  }
  
  const IconComponent = iconMap[appKey] || AppIcon
  return <IconComponent className={className} />
} 