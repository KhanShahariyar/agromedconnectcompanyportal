import { ORDER_STATUS_FLOW } from '@/data/contracts'
import type { DeliveryMode, DeliveryType, FulfilmentStep, OrderDetail } from '@/data/contracts'

/**
 * Which of the two machines an order runs on.
 *
 * Pickup has no courier leg, so it borrows the own-delivery steps up to
 * handover. The company's assigned `deliveryMode` (C14) decides which paths are
 * available at all — the company never chooses this for itself.
 */
export function pathFor(deliveryType: DeliveryType): 'own' | 'partner' {
  return deliveryType === 'partner' ? 'partner' : 'own'
}

export function stepsFor(deliveryType: DeliveryType): readonly FulfilmentStep[] {
  return ORDER_STATUS_FLOW[pathFor(deliveryType)]
}

/**
 * True when the company may choose the path for this specific order — only
 * when the platform assigned `both`, and only before dispatch.
 */
export function mayChoosePath(mode: DeliveryMode, order: OrderDetail): boolean {
  return mode === 'both' && (order.currentStep === 'confirmed' || order.currentStep === null)
}

/**
 * The final step of the partner path is not the company's to take: our delivery
 * team confirms arrival. The control is therefore absent rather than disabled —
 * a company that could close an order it has no knowledge of would be reporting
 * a delivery it never made.
 */
export function isAwaitingPlatform(order: OrderDetail): boolean {
  return pathFor(order.deliveryType) === 'partner' && order.currentStep === 'handed_to_platform'
}

export function currentIndex(order: OrderDetail): number {
  const steps = stepsFor(order.deliveryType)
  return order.currentStep ? steps.indexOf(order.currentStep) : -1
}
