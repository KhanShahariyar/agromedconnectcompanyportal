import { ORDER_STATUS_FLOW } from '@/data/contracts'
import type { DeliveryType, FulfilmentStep, OrderDetail } from '@/data/contracts'

export function pathFor(deliveryType: DeliveryType): 'own' | 'partner' {
  return deliveryType === 'partner' ? 'partner' : 'own'
}

export function stepsFor(deliveryType: DeliveryType): readonly FulfilmentStep[] {
  return ORDER_STATUS_FLOW[pathFor(deliveryType)]
}

export function mayChoosePath(): false {
  return false
}

export function isAwaitingPlatform(order: OrderDetail): boolean {
  return pathFor(order.deliveryType) === 'partner' && order.currentStep === 'handed_to_platform'
}

export function currentIndex(order: OrderDetail): number {
  const steps = stepsFor(order.deliveryType)
  return order.currentStep ? steps.indexOf(order.currentStep) : -1
}
