export default function NotFound() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:'monospace'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize:'4rem',margin:0}}>404</h1>
        <p style={{color:'#888'}}>Page not found</p>
        <a href="/" style={{color:'#f59e0b'}}>← Back to SYGNL</a>
      </div>
    </div>
  )
}
