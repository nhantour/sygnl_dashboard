'use client'
export default function Error({ error, reset }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'monospace'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:'2rem',color:'#ef4444'}}>Something broke</h1>
        <p style={{color:'#888',maxWidth:400}}>{error?.message || 'Unknown error'}</p>
        <button onClick={reset} style={{marginTop:16,padding:'8px 24px',background:'#f59e0b',color:'#000',border:'none',borderRadius:6,cursor:'pointer',fontWeight:'bold'}}>Try Again</button>
      </div>
    </div>
  )
}
