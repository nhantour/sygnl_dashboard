'use client'
export default function GlobalError({ error, reset }) {
  return (
    <html><body style={{background:'#0a0a0a',color:'#fff',fontFamily:'monospace',display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',margin:0}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:'2rem',color:'#ef4444'}}>Critical Error</h1>
        <p style={{color:'#888'}}>{error?.message || 'Something went wrong'}</p>
        <button onClick={reset} style={{marginTop:16,padding:'8px 24px',background:'#f59e0b',color:'#000',border:'none',borderRadius:6,cursor:'pointer',fontWeight:'bold'}}>Reload</button>
      </div>
    </body></html>
  )
}
