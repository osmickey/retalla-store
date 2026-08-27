import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../lib/api';

function VideoCard({ p }) {
  const videoRef = useRef(null);
  const [controlsOn, setControlsOn] = useState(false);
  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  // The autoPlay attribute is part of the real initial JSX render here (not
  // an innerHTML injection like vanilla's version), so it's more reliable --
  // but a mount-time .play() call can still fire before the browser has
  // buffered enough to satisfy it, and nothing retries once it's ready. Also
  // listen for canplay so a video that becomes playable after mount actually
  // starts, matching vanilla's own defensiveness against autoplay quirks.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    video.addEventListener('canplay', tryPlay);
    return () => video.removeEventListener('canplay', tryPlay);
  }, [p.videoUrl]);

  return (
    <div className="video-card">
      <div className="video-thumb">
        <span className="live-badge">
          <span className="pulse-dot" /> LIVE
        </span>
        <video
          ref={videoRef}
          src={p.videoUrl}
          poster={p.image}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls={controlsOn}
          onClick={() => setControlsOn(true)}
        />
      </div>
      <div className="video-info">
        <h3>{p.name}</h3>
        <div className="price-row">
          <span className="price">Rs. {p.price.toFixed(2)}</span>
          {p.mrp > p.price && (
            <>
              <span className="mrp">Rs. {p.mrp.toFixed(2)}</span>
              <span className="discount">{discount}% off</span>
            </>
          )}
        </div>
        <Link to={`/product.html?id=${p._id}`} className="btn btn-primary btn-sm add-btn">
          Shop Now
        </Link>
      </div>
    </div>
  );
}

export default function LiveVideoSection() {
  const [products, setProducts] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    api
      .get('/products?liveVideo=true&limit=6')
      .then((d) => !cancelled && setProducts(d))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <motion.section
      className="section"
      id="live-video-section"
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="section-head">
        <div>
          <span className="eyebrow">Watch &amp; Shop</span>
          <h2>Retalla Live</h2>
        </div>
        <Link to="/shop.html">View all →</Link>
      </div>
      <div className="video-grid">
        {products.map((p) => (
          <VideoCard key={p._id} p={p} />
        ))}
      </div>
    </motion.section>
  );
}
