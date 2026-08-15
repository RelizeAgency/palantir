// Single source of truth for every color used to represent a lead/SEO
// source across the dashboard (donut, stacked bar, stat card borders/dots,
// SEO line chart). Deliberately has no 'use client' directive and lives
// outside any client component file, so both server- and client-rendered
// code can safely import the real values — see SeoSection.tsx for the bug
// this exact setup used to cause when a color constant lived inside a
// 'use client' file instead.
export const STAT_COLORS = {
  bel: '#3e6d9c', // website bel-clicks — also the "Bellen" bucket in the donut/bar chart
  whatsapp: '#4a8b5c',
  form: '#c08a3e',
  gmb: '#7c5aa6', // Google Business Profile calls
  seoImpressions: '#2e7ea8',
  seoClicks: '#d97d4a',
  ga4Visitors: '#3f8f8a',
  ga4Engagement: '#b8657a',
  value: '#c9a227', // Waarde-tab — potentiële omzet per maand
}
