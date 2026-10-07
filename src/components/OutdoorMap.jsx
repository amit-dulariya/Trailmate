import { useEffect, useMemo, useState } from 'react';
import { MapPin, LocateFixed, LoaderCircle, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;
const SEARCH_RADIUS = 7000;
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const markerIcon = L.divIcon({
  className: 'trailmate-map-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const locationIcon = L.divIcon({
  className: 'trailmate-location-marker',
  html: '<span></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 0.8 });
  }, [map, position]);
  return null;
}

function categoryFor(element) {
  const tags = element.tags || {};
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'Park';
  if (tags.route === 'hiking' || tags.hiking) return 'Hiking trail';
  if (tags.highway === 'footway' || tags.highway === 'pedestrian' || tags.highway === 'path') return 'Walking area';
  return 'Nature / outdoor';
}

function labelFor(element) {
  const tags = element.tags || {};
  return tags.name || tags['name:en'] || null;
}

function verifiedDetails(element) {
  const tags = element.tags || {};
  const details = [];
  if (tags.description) details.push(['Description', tags.description]);
  if (tags.access) details.push(['Access', tags.access]);
  if (tags.opening_hours) details.push(['Opening hours', tags.opening_hours]);
  if (tags.website) details.push(['Website', tags.website]);
  if (tags.operator) details.push(['Operator', tags.operator]);
  return details;
}

function coordinatesFor(element) {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') return [element.lat, element.lon];
  if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') return [element.center.lat, element.center.lon];
  return null;
}

function buildQuery(lat, lon) {
  const around = `around:${SEARCH_RADIUS},${lat},${lon}`;
  return `[out:json][timeout:25];(\n  node[leisure~"park|garden"](${around});\n  way[leisure~"park|garden"](${around});\n  relation[leisure~"park|garden"](${around});\n  node[route="hiking"](${around});\n  way[route="hiking"](${around});\n  relation[route="hiking"](${around});\n  way[highway~"footway|pedestrian|path"](${around});\n  node[natural~"wood|heath|scrub|grassland"](${around});\n  way[natural~"wood|heath|scrub|grassland"](${around});\n  node[tourism="picnic_site"](${around});\n  way[tourism="picnic_site"](${around});\n);out center tags;`;
}

async function fetchPlaces(lat, lon, signal) {
  const query = buildQuery(lat, lon);
  let lastError;
  for (const endpoint of OVERPASS_URLS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }),
        signal,
      });
      if (!response.ok) throw new Error(`Place service returned ${response.status}.`);
      const data = await response.json();
      return (data.elements || [])
        .map((element) => ({
          id: `${element.type}-${element.id}`,
          name: labelFor(element),
          category: categoryFor(element),
          position: coordinatesFor(element),
          details: verifiedDetails(element),
          sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
          osmType: element.type,
          osmId: element.id,
        }))
        .filter((place) => place.position && place.name)
        .filter((place, index, all) => all.findIndex((item) => item.name === place.name && item.category === place.category) === index)
        .slice(0, 80);
    } catch (error) {
      lastError = error;
      if (error?.name === 'AbortError') throw error;
    }
  }
  throw lastError || new Error('Could not reach the OpenStreetMap place service.');
}

export default function OutdoorMap() {
  const [position, setPosition] = useState(null);
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Use your location to discover mapped outdoor places nearby.');
  const [online, setOnline] = useState(() => navigator.onLine);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function useMyLocation() {
    if (!online) {
      setStatus('offline');
      setMessage('You are offline. Live nearby-place discovery is disabled until internet access returns.');
      return;
    }
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('This browser does not provide location access. You can still use the rest of TrailMate.');
      return;
    }

    setStatus('locating');
    setMessage('Requesting your browser location permission…');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const nextPosition = [coords.latitude, coords.longitude];
      setPosition(nextPosition);
      setStatus('loading');
      setMessage('Location found. Discovering mapped outdoor places nearby…');
      const controller = new AbortController();
      try {
        const found = await fetchPlaces(coords.latitude, coords.longitude, controller.signal);
        setPlaces(found);
        setStatus('success');
        setMessage(found.length ? `Found ${found.length} mapped outdoor places within about 7 km.` : 'No named parks, trails, walking areas, or nature locations were found in the nearby OpenStreetMap data. Try moving to another area or search again later.');
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setPlaces([]);
        setStatus('error');
        setMessage('Your location was found, but the live place service could not be reached. Try again when online.');
      }
    }, (error) => {
      setStatus(error.code === 1 ? 'denied' : 'error');
      setMessage(error.code === 1
        ? 'Location access was denied. Allow location permission to discover nearby mapped places; the rest of TrailMate still works.'
        : 'We could not read your location right now. You can try again without affecting the rest of TrailMate.');
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }

  const categories = useMemo(() => ['All', ...new Set(places.map((place) => place.category))], [places]);
  const visiblePlaces = filter === 'All' ? places : places.filter((place) => place.category === filter);

  return (
    <section className="outdoor-map-section" id="nearby-outdoors">
      <div className="map-heading">
        <span className="eyebrow">NEARBY OUTDOORS</span>
        <h2>Find your <em>outside.</em></h2>
        <p>Mapped places come from OpenStreetMap. AI suggestions are kept separate and are never treated as verified locations.</p>
      </div>

      <div className="outdoor-map-card">
        <div className="map-toolbar">
          <div className="map-source-note"><CheckCircle2 size={15} /><span><strong>VERIFIED PLACE DATA</strong> — OpenStreetMap / Overpass</span></div>
          <button type="button" className="primary-button map-location-button" onClick={useMyLocation} disabled={status === 'locating' || status === 'loading'}>
            {status === 'locating' || status === 'loading' ? <LoaderCircle size={16} className="spin" /> : <LocateFixed size={16} />}
            {status === 'locating' || status === 'loading' ? 'Finding places…' : 'Use My Location'}
          </button>
        </div>

        <div className="map-legend">
          <span><i className="legend-dot verified-dot"></i> Verified mapped data</span>
          <span><i className="legend-dot ai-dot"></i> AI suggestions never appear on this map</span>
          {!online && <span className="offline-pill"><WifiOff size={13} /> Offline</span>}
        </div>

        {(status === 'denied' || status === 'error' || status === 'offline') && (
          <div className={`map-status map-status-${status}`} role={status === 'error' ? 'alert' : 'status'}>
            {status === 'offline' ? <WifiOff size={17} /> : <AlertCircle size={17} />}
            <span>{message}</span>
          </div>
        )}
        {status === 'success' && <div className="map-status map-status-success" role="status"><CheckCircle2 size={17} /><span>{message}</span></div>}
        {(status === 'idle' || status === 'locating' || status === 'loading') && <p className="map-helper">{message}</p>}

        <div className="map-layout">
          <div className="map-wrap">
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="trailmate-map">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {position && <><RecenterMap position={position} /><Marker position={position} icon={locationIcon}><Popup><strong>Your current location</strong><br />Only visible after you grant browser location access.</Popup></Marker></>}
              {visiblePlaces.map((place) => (
                <Marker key={place.id} position={place.position} icon={markerIcon}>
                  <Popup>
                    <strong>{place.name}</strong>
                    <br />
                    <span><strong>Verified Place Data</strong></span>
                    <br />
                    {place.category}
                    {place.details.length > 0 && (
                      <div className="map-popup-details">
                        {place.details.map(([label, value]) => (
                          <div key={label}><strong>{label}:</strong> {value}</div>
                        ))}
                      </div>
                    )}
                    <br />
                    <a href={place.sourceUrl} target="_blank" rel="noreferrer">View OpenStreetMap record</a>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <aside className="map-place-list" aria-label="Nearby mapped outdoor places">
            <div className="map-list-heading"><span><MapPin size={16} /> Nearby mapped places</span><small>{places.length || 0}</small></div>
            {places.length > 0 && <div className="map-filters">{categories.map((category) => <button key={category} type="button" className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>}
            {visiblePlaces.length > 0 ? visiblePlaces.slice(0, 14).map((place) => <a className="map-place-item" key={place.id} href={place.sourceUrl} target="_blank" rel="noreferrer"><strong>{place.name}</strong><span>{place.category} · Verified Place Data</span></a>) : <div className="map-empty"><MapPin size={20} /><p>{position ? 'No mapped outdoor places to show yet.' : 'Grant location access to discover nearby mapped places.'}</p></div>}
          </aside>
        </div>

        <div className="map-data-boundary"><strong>AI-GENERATED SUGGESTIONS</strong><span>Plans from Ollama may suggest general place types, but this map only displays locations returned by OpenStreetMap data.</span></div>
        {!online && <div className="map-offline-note"><WifiOff size={15} /><span><strong>Live map/place data is offline.</strong> Cached map tiles may still appear if your browser has them, but nearby discovery will not fabricate or reuse uncached locations.</span></div>}
      </div>
    </section>
  );
}
