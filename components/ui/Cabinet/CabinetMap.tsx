"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { MapCabinet } from "./CabinetMapTypes"

const STATUS_COLOR: Record<string, string> = {
  ONLINE: "#16a34a",
  OFFLINE: "#dc2626",
  MAINTENANCE: "#f59e0b",
}

function makeIcon(status: string) {
  const color = STATUS_COLOR[status] ?? "#6b7280"
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
      <path fill="${color}" fill-opacity="0.9" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13 3.87-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `
  return L.divIcon({
    className: "ecgo-cabinet-marker",
    html: svg,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  })
}

function popupContent(c: MapCabinet) {
  const uptime =
    c.lastHeartbeat && c.status === "ONLINE"
      ? `<span class="text-green-600">Live</span>`
      : c.status === "OFFLINE"
      ? `<span class="text-red-600">Offline</span>`
      : `<span class="text-amber-600">Maintenance</span>`
  return `
    <div style="min-width:180px">
      <div style="font-weight:600;font-size:14px;margin-bottom:4px">${c.code} — ${c.branch}</div>
      <div style="font-size:12px;color:#4b5563">
        <div>Status: ${uptime}</div>
        <div>Slot terisi: ${c.filledSlots}/${c.totalSlots}</div>
        <div>Swap 24h: ${c.swapCount24h}</div>
      </div>
      <div style="margin-top:6px">
        <a href="/dashboard/cabinets/${c.id}" style="color:#2563eb;font-size:12px;text-decoration:underline">Buka detail</a>
      </div>
    </div>
  `
}

function createMap(container: HTMLDivElement, first: MapCabinet): { map: L.Map; cluster: L.LayerGroup } {
  const map = L.map(container, {
    center: [first.lat!, first.lng!],
    zoom: 11,
    zoomAnimation: false,
    scrollWheelZoom: true,
  })

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map)

  const cluster = L.layerGroup().addTo(map)
  map.whenReady(() => {
    map.invalidateSize()
    requestAnimationFrame(() => map.invalidateSize())
  })

  return { map, cluster }
}

function hasCoords(c: MapCabinet) {
  return c.lat != null && c.lng != null && c.lat !== 0 && c.lng !== 0
}

export default function CabinetMap({ cabinets: data }: { cabinets: MapCabinet[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const clusterRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    const valid = data.filter(hasCoords)
    if (valid.length === 0) return

    if (!mapInstanceRef.current || !clusterRef.current) {
      const { map, cluster } = createMap(mapRef.current, valid[0]!)
      mapInstanceRef.current = map
      clusterRef.current = cluster
    }

    const map = mapInstanceRef.current
    const cluster = clusterRef.current
    if (!map || !cluster) return

    cluster.clearLayers()

    valid.forEach((c) => {
      L.marker([c.lat!, c.lng!], { icon: makeIcon(c.status) })
        .bindPopup(popupContent(c), { minWidth: 220 })
        .addTo(cluster)

      if (c.radiusM && c.radiusM > 0) {
        L.circle([c.lat!, c.lng!], {
          radius: c.radiusM,
          color: STATUS_COLOR[c.status] ?? "#6b7280",
          fillOpacity: 0.08,
          weight: 1.5,
        }).addTo(cluster)
      }
    })

    map.fitBounds(L.latLngBounds(valid.map((c) => [c.lat!, c.lng!])).pad(0.25))
  }, [data])

  useEffect(() => {
    const onResize = () => {
      mapInstanceRef.current?.invalidateSize()
    }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      clusterRef.current = null
    }
  }, [])

  return <div ref={mapRef} className="w-full h-[560px]" />
}
