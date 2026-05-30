import { z } from "zod";

// ─────────────────────────────────────────────
// Enums (mirrored from Prisma for frontend use)
// ─────────────────────────────────────────────

export const ShopCategoryEnum = z.enum(["MALE", "FEMALE", "UNISEX"]);
export const ShopStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]);
export const BookingStatusEnum = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]);
export const HoldStatusEnum = z.enum(["ACTIVE", "CONVERTED", "EXPIRED", "RELEASED"]);
export const ServiceCategoryEnum = z.enum([
  "HAIRCUT", "BEARD", "FACIAL", "MASSAGE",
  "HAIR_COLOR", "HAIR_SPA", "WAXING", "KERATIN", "STRAIGHTENING", "OTHER"
]);

export type ShopCategory = z.infer<typeof ShopCategoryEnum>;
export type ShopStatus = z.infer<typeof ShopStatusEnum>;
export type BookingStatus = z.infer<typeof BookingStatusEnum>;
export type ServiceCategory = z.infer<typeof ServiceCategoryEnum>;

// ─────────────────────────────────────────────
// Working Days
// ─────────────────────────────────────────────

export const WorkingDayEnum = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
export type WorkingDay = z.infer<typeof WorkingDayEnum>;

export const WORKING_DAYS_LABELS: Record<WorkingDay, string> = {
  MON: "Monday", TUE: "Tuesday", WED: "Wednesday",
  THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday",
};

// ─────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────

export const RegisterCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

export const RegisterOwnerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/),
});

// ─────────────────────────────────────────────
// Shop Schemas
// ─────────────────────────────────────────────

export const CreateShopSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(600).optional(),
  category: ShopCategoryEnum,
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(80),
  district: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),   // "09:00"
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),  // "21:00"
  workingDays: z.array(WorkingDayEnum).min(1),
});

export const UpdateShopSchema = CreateShopSchema.partial();

export type CreateShopInput = z.infer<typeof CreateShopSchema>;
export type UpdateShopInput = z.infer<typeof UpdateShopSchema>;

// ─────────────────────────────────────────────
// Service Schemas
// ─────────────────────────────────────────────

export const CreateServiceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(400).optional(),
  category: ServiceCategoryEnum,
  price: z.number().int().min(100),  // min ₹1 (in paise)
  durationMins: z.number().int().min(5).max(480),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

// ─────────────────────────────────────────────
// Staff Schemas
// ─────────────────────────────────────────────

export const CreateStaffSchema = z.object({
  name: z.string().min(2).max(80),
  specialization: z.string().max(100).optional(),
  experience: z.string().max(50).optional(),
  bio: z.string().max(300).optional(),
  displayOrder: z.number().int().default(0),
});

export const UpdateStaffSchema = CreateStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

// ─────────────────────────────────────────────
// Slot Hold Schemas
// ─────────────────────────────────────────────

export const CreateSlotHoldSchema = z.object({
  shopId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // "2026-06-10"
  startTime: z.string().regex(/^\d{2}:\d{2}$/),     // "10:00"
  serviceIds: z.array(z.string().uuid()).min(1),
});

export type CreateSlotHoldInput = z.infer<typeof CreateSlotHoldSchema>;

// ─────────────────────────────────────────────
// Booking Schemas
// ─────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  holdId: z.string().uuid(),
  notes: z.string().max(300).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

// ─────────────────────────────────────────────
// Review Schemas
// ─────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  shopId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────
// API Response wrappers
// ─────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────
// Slot Availability (computed, not from DB)
// ─────────────────────────────────────────────

export type TimeSlot = {
  startTime: string;   // "10:00"
  endTime: string;     // "10:50"
  available: boolean;
  heldByMe?: boolean;  // true if current user holds this slot
};

export type StaffAvailability = {
  staffId: string;
  staffName: string;
  photoUrl: string | null;
  slots: TimeSlot[];
};

export type ShopAvailabilityResponse = {
  date: string;
  totalDurationMins: number;
  byStaff: StaffAvailability[];
  anyAvailable: TimeSlot[];  // merged view for "Any Available"
};

// ─────────────────────────────────────────────
// Realtime Event Payloads (Supabase Realtime)
// ─────────────────────────────────────────────

export type SlotHoldEvent = {
  type: "SLOT_HOLD" | "SLOT_RELEASED" | "SLOT_CONFIRMED";
  shopId: string;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type NotificationEvent = {
  type: "NEW_NOTIFICATION";
  shopId: string;
  notificationId: string;
};
