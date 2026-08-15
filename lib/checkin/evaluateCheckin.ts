export type Branch = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  active: boolean;
};

export type CheckIn = {
  userId: string;
  lat: number;
  lng: number;
  accuracyM: number;
  at: string;
};

export type RejectReason = 'NO_BRANCH_ASSIGNED' | 'LOW_ACCURACY' | 'INVALID_COORDINATE';

export type Result =
  | { status: 'VALID'; branchId: string; branchName: string; distanceM: number }
  | { status: 'OUT_OF_RANGE'; nearestBranchId: string | null; distanceM: number | null }
  | { status: 'REJECTED'; reason: RejectReason };

const EARTH_RADIUS = 6371008.8;

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) ** 2;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180 &&
         !(lat === 0 && lng === 0);
}

export function evaluateCheckIn(checkIn: CheckIn, branches: Branch[]): Result {
  const { lat, lng, accuracyM } = checkIn;

  // 1. Validasi koordinat
  if (!isValidCoordinate(lat, lng)) {
    return { status: 'REJECTED', reason: 'INVALID_COORDINATE' };
  }

  // 2. Validasi akurasi
  if (accuracyM > 100) {
    return { status: 'REJECTED', reason: 'LOW_ACCURACY' };
  }

  // 3. Filter cabang aktif
  const activeBranches = branches.filter(b => b.active);
  if (activeBranches.length === 0) {
    return { status: 'REJECTED', reason: 'NO_BRANCH_ASSIGNED' };
  }

  // 4. Hitung jarak ke semua cabang aktif
  const candidates = activeBranches.map(branch => {
    const distance = haversine(lat, lng, branch.lat, branch.lng);
    const tolerance = branch.radiusM + Math.min(accuracyM, 30);
    return { ...branch, distance, tolerance };
  });

  // 5. Cari valid branch terdekat
  const validBranches = candidates.filter(b => b.distance <= b.tolerance);
  const sortedValid = validBranches.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.id.localeCompare(b.id);
  });

  if (sortedValid.length > 0) {
    const best = sortedValid[0]!;
    return {
      status: 'VALID',
      branchId: best.id,
      branchName: best.name,
      distanceM: Math.round(best.distance)
    };
  }

  // 6. Tidak ada yang valid -> OUT_OF_RANGE
  const sortedAll = candidates.sort((a, b) => a.distance - b.distance);
  const nearest = sortedAll[0];

  return {
    status: 'OUT_OF_RANGE',
    nearestBranchId: nearest?.id || null,
    distanceM: nearest ? Math.round(nearest.distance) : null
  };
}