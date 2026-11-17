export const VILTRUM = window.CasperBridge?.getEdition?.() === 'viltrum'
export const ORB_COLOR = VILTRUM ? '#FFFFFF' : undefined
if (VILTRUM) document.documentElement.dataset.edition = 'viltrum'
