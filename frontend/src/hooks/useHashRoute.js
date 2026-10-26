import { useEffect, useState } from 'react';

// Dinh tuyen don gian theo phan # cua URL, khong can them thu vien
function read() {
  return window.location.hash.replace(/^#/, '') || '/tickets';
}

export function navigate(path) {
  window.location.hash = path;
}

export function useHashRoute() {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const onChange = () => setPath(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}