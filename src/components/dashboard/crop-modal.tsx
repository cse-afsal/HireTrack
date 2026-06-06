"use client";
import { useRef, useState, useEffect, useCallback } from "react";

const SIZE = 260;

export function CropModal({ src, onConfirm, onCancel }: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const dragRef   = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [zoom, setZoom]     = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const redraw = useCallback((img: HTMLImageElement, z: number, ox: number, oy: number) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath(); ctx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI*2); ctx.clip();
    const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight) * z;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.fillStyle = "#e5e7eb"; ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, (SIZE-dw)/2 + ox, (SIZE-dh)/2 + oy, dw, dh);
    ctx.restore();
    ctx.strokeStyle = "#6d28d9"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(SIZE/2, SIZE/2, SIZE/2-1.5, 0, Math.PI*2); ctx.stroke();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; redraw(img, 1, 0, 0); };
    img.src = src;
  }, [src, redraw]);

  useEffect(() => {
    if (imgRef.current) redraw(imgRef.current, zoom, offset.x, offset.y);
  }, [zoom, offset, redraw]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setOffset({ x: dragRef.current.ox + (e.clientX - dragRef.current.sx), y: dragRef.current.oy + (e.clientY - dragRef.current.sy) });
  };
  const onMouseUp = () => { dragRef.current = null; };

  const confirm = () => {
    const c = canvasRef.current; if (!c) return;
    onConfirm(c.toDataURL("image/jpeg", 0.6));
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#111827", borderRadius:16, padding:28, display:"flex", flexDirection:"column", alignItems:"center", gap:16, border:"1px solid #374151", width:340 }}>
        <div style={{ color:"#fff", fontSize:16, fontWeight:700 }}>Crop Profile Photo</div>
        <div style={{ color:"#9ca3af", fontSize:12, textAlign:"center" }}>Drag to reposition · Slider to zoom</div>
        <canvas
          ref={canvasRef} width={SIZE} height={SIZE}
          style={{ borderRadius:"50%", cursor:"grab", userSelect:"none" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        />
        <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
          <span style={{ color:"#9ca3af", fontSize:11, width:36 }}>Zoom</span>
          <input type="range" min={0.5} max={4} step={0.05} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex:1, accentColor:"#6d28d9" }}
          />
          <span style={{ color:"#9ca3af", fontSize:11, width:40, textAlign:"right" }}>{Math.round(zoom*100)}%</span>
        </div>
        <div style={{ display:"flex", gap:10, width:"100%" }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:10, borderRadius:8, border:"1px solid #374151", background:"transparent", color:"#9ca3af", cursor:"pointer", fontSize:13 }}>
            Cancel
          </button>
          <button onClick={confirm}
            style={{ flex:1, padding:10, borderRadius:8, border:"none", background:"#6d28d9", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
