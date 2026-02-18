
import React from 'react';

export const MIN_LIMIT = 5 * 60;
export const MAX_LIMIT = 60 * 60;
export const MIN_LIMIT_MINUTES = 5;
export const MAX_LIMIT_MINUTES = 60;
export const DEFAULT_LIMIT = 30 * 60;
export const BREAK_INTERVAL = 5 * 60; // 5 minutes

export const DAILY_DEFAULTS = [
  { title: "Hydration Break", description: "One full glass of water", credit: 5 },
  { title: "Posture Reset", description: "5 minute neck & wrist stretch", credit: 5 },
  { title: "Reading Time", description: "Read two pages of a book", credit: 5 },
  { title: "Long Video Time", description: "Watch one long video (YouTube/Netflix)", credit: 5 }
];

export const AVAILABLE_APPS = [
  "Instagram",
  "Rednote",
  "Facebook",
  "Wechat",
  "Twitter",
  "YouTube",
  "Anki",
  "Duolingo",
  "Books",
  "Notes",
  "Calendar"
];

export const Icons = {
  Octopus: (props: any) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M50 20C35 20 25 32 25 45C25 58 35 65 35 65L30 80M50 20C65 20 75 32 75 45C75 58 65 65 65 65L70 80M40 70L38 85M60 70L62 85M50 65V90M50 65C50 65 40 60 40 45C40 30 60 30 60 45C60 60 50 65 50 65Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="43" cy="42" r="2" fill="currentColor"/>
      <circle cx="57" cy="42" r="2" fill="currentColor"/>
      <path d="M48 50C48 50 50 52 52 50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M72 75V85M68 82H76M72 85C68 85 67 82 67 82M72 85C76 85 77 82 77 82" stroke="#A7BBC7" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Anchor: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="5" r="3"/><path d="M12 22V8M5 12H2a10 10 0 0 0 20 0h-3"/></svg>
  ),
  Task: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  ),
  Social: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Home: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Settings: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  )
};
