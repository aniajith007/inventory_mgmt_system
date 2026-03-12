export const LOCATION_PART_DETAILS = {
  c12: {
    'PN-C12-001': [
      { batchNo: 'C12-001-B1', systemQty: 40 },
      { batchNo: 'C12-001-B2', systemQty: 35 },
      { batchNo: 'C12-001-B3', systemQty: 25 }
    ],
    'PN-C12-014': [
      { batchNo: 'C12-014-B1', systemQty: 18 },
      { batchNo: 'C12-014-B2', systemQty: 22 }
    ],
    'PN-C12-042': [
      { batchNo: 'C12-042-B1', systemQty: 52 },
      { batchNo: 'C12-042-B2', systemQty: 41 }
    ],
    'PN-C12-133': [
      { batchNo: 'C12-133-B1', systemQty: 16 },
      { batchNo: 'C12-133-B2', systemQty: 10 },
      { batchNo: 'C12-133-B3', systemQty: 9 }
    ],
    'PN-C12-205': [
      { batchNo: 'C12-205-B1', systemQty: 30 },
      { batchNo: 'C12-205-B2', systemQty: 28 }
    ]
  },
  c13: {
    'PN-C13-003': [
      { batchNo: 'C13-003-B1', systemQty: 20 },
      { batchNo: 'C13-003-B2', systemQty: 18 },
      { batchNo: 'C13-003-B3', systemQty: 15 }
    ],
    'PN-C13-017': [
      { batchNo: 'C13-017-B1', systemQty: 42 },
      { batchNo: 'C13-017-B2', systemQty: 16 }
    ],
    'PN-C13-051': [
      { batchNo: 'C13-051-B1', systemQty: 27 },
      { batchNo: 'C13-051-B2', systemQty: 33 }
    ],
    'PN-C13-088': [
      { batchNo: 'C13-088-B1', systemQty: 12 },
      { batchNo: 'C13-088-B2', systemQty: 11 },
      { batchNo: 'C13-088-B3', systemQty: 10 }
    ],
    'PN-C13-190': [
      { batchNo: 'C13-190-B1', systemQty: 50 },
      { batchNo: 'C13-190-B2', systemQty: 24 }
    ]
  },
  c14: {
    'PN-C14-009': [
      { batchNo: 'C14-009-B1', systemQty: 26 },
      { batchNo: 'C14-009-B2', systemQty: 21 }
    ],
    'PN-C14-021': [
      { batchNo: 'C14-021-B1', systemQty: 14 },
      { batchNo: 'C14-021-B2', systemQty: 18 },
      { batchNo: 'C14-021-B3', systemQty: 12 }
    ],
    'PN-C14-067': [
      { batchNo: 'C14-067-B1', systemQty: 35 },
      { batchNo: 'C14-067-B2', systemQty: 29 }
    ],
    'PN-C14-111': [
      { batchNo: 'C14-111-B1', systemQty: 9 },
      { batchNo: 'C14-111-B2', systemQty: 7 },
      { batchNo: 'C14-111-B3', systemQty: 11 }
    ],
    'PN-C14-224': [
      { batchNo: 'C14-224-B1', systemQty: 47 },
      { batchNo: 'C14-224-B2', systemQty: 31 }
    ]
  }
}

export const LOCATION_PARTS = Object.fromEntries(
  Object.entries(LOCATION_PART_DETAILS).map(([location, parts]) => [location, Object.keys(parts)])
)

export const LOCATION_OPTIONS = [
  { label: 'C12', value: 'c12' },
  { label: 'C13', value: 'c13' },
  { label: 'C14', value: 'c14' }
]
