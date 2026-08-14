import { describe, it, expect } from 'vitest';
import { evaluateCheckIn } from "./evaluateCheckin";

const branches = [
  { id: 'B-01', name: 'Kemayoran', lat: -6.15690, lng: 106.84490, radiusM: 150, active: true },
  { id: 'B-02', name: 'Sunter', lat: -6.14200, lng: 106.87200, radiusM: 200, active: true },
  { id: 'B-03', name: 'Cakung', lat: -6.18500, lng: 106.94500, radiusM: 120, active: false },
];

describe('evaluateCheckIn', () => {
  it('valid check-in di dalam radius B-01', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.15700, lng: 106.84500, accuracyM: 12, at: '2026-08-13T07:00:00Z' },
      branches
    );
    expect(result.status).toBe('VALID');
    if (result.status === 'VALID') {
      expect(result.branchId).toBe('B-01');
    }
  });

  it('OUT_OF_RANGE karena B-03 nonaktif', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.18510, lng: 106.94510, accuracyM: 10, at: '2026-08-13T07:00:00Z' },
      branches
    );
    expect(result.status).toBe('OUT_OF_RANGE');
  });

  it('REJECTED karena akurasi terlalu rendah', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.15700, lng: 106.84500, accuracyM: 140, at: '2026-08-13T07:00:00Z' },
      branches
    );
    expect(result).toEqual({ status: 'REJECTED', reason: 'LOW_ACCURACY' });
  });

  it('REJECTED karena koordinat (0,0)', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: 0, lng: 0, accuracyM: 5, at: '2026-08-13T07:00:00Z' },
      branches
    );
    expect(result).toEqual({ status: 'REJECTED', reason: 'INVALID_COORDINATE' });
  });

  it('OUT_OF_RANGE dengan nearest branch terdekat', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.30000, lng: 106.80000, accuracyM: 15, at: '2026-08-13T07:00:00Z' },
      branches
    );
    expect(result.status).toBe('OUT_OF_RANGE');
    if (result.status === 'OUT_OF_RANGE') {
      expect(result.nearestBranchId).toBe('B-01');
    }
  });

  it('REJECTED karena tidak ada cabang aktif', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.15700, lng: 106.84500, accuracyM: 12, at: '2026-08-13T07:00:00Z' },
      branches.map(b => ({ ...b, active: false }))
    );
    expect(result).toEqual({ status: 'REJECTED', reason: 'NO_BRANCH_ASSIGNED' });
  });

  it('valid memilih cabang terdekat dari 2 cabang yang valid', () => {
    const twoBranches = [
      { id: 'B-01', name: 'Kemayoran', lat: -6.15690, lng: 106.84490, radiusM: 500, active: true },
      { id: 'B-02', name: 'Sunter', lat: -6.14200, lng: 106.87200, radiusM: 500, active: true },
    ];
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.15700, lng: 106.84500, accuracyM: 12, at: '2026-08-13T07:00:00Z' },
      twoBranches
    );
    expect(result.status).toBe('VALID');
    if (result.status === 'VALID') {
      expect(result.branchId).toBe('B-01');
    }
  });

  it('REJECTED karena koordinat NaN', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: NaN, lng: 106.84500, accuracyM: 12, at: '2026-08-13T07:00:00Z' },
      branches
    );
    expect(result).toEqual({ status: 'REJECTED', reason: 'INVALID_COORDINATE' });
  });

  it('OUT_OF_RANGE dengan nearestBranchId null jika tidak ada cabang', () => {
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.30000, lng:106.80000, accuracyM: 15, at: '2026-08-13T07:00:00Z' },
      []
    );
    expect(result).toEqual({ status: 'REJECTED', reason: 'NO_BRANCH_ASSIGNED' });
  });

  it('tie-breaker: pilih cabang dengan id lebih kecil bila jarak sama', () => {
    const sameDistBranches = [
      { id: 'B-10', name: 'Kemayoran', lat: -6.15690, lng: 106.84490, radiusM: 500, active: true },
      { id: 'B-02', name: 'Sunter', lat: -6.15690, lng: 106.84490, radiusM: 500, active: true },
    ];
    const result = evaluateCheckIn(
      { userId: 'U1', lat: -6.15700, lng: 106.84500, accuracyM: 12, at: '2026-08-13T07:00:00Z' },
      sameDistBranches
    );
    expect(result.status).toBe('VALID');
    if (result.status === 'VALID') {
      expect(result.branchId).toBe('B-02');
    }
  });
});