/**
 * Shipment Configuration
 * 
 * Configure partner-specific shipment tracking behavior
 */

/**
 * Partner ID that bypasses shipment tracking requirements
 * Items from this partner are automatically considered "ready to ship"
 * and don't require manual marking by the partner
 * 
 * This is typically used for in-house inventory or your own products
 */
export const BYPASS_PARTNER_ID = "a90ad93a-98f8-4ef8-9faa-01649e58047b"

/**
 * Check if a partner should bypass shipment validation
 */
export function isBypassPartner(partnerId: string): boolean {
  return partnerId === BYPASS_PARTNER_ID
}

/**
 * Get display name for shipment status based on partner type
 */
export function getShipmentStatusLabel(status: string, partnerId: string): string {
  if (isBypassPartner(partnerId)) {
    return "Ready to Ship" // In-house items are always ready
  }
  
  switch (status) {
    case 'PENDING':
      return 'Pending'
    case 'SHIPPED':
      return 'Ready to Ship'
    case 'DELIVERED':
      return 'Delivered'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}