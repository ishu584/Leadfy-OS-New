import { z } from "zod";

export const CreatorAvailabilityEnum = z.enum([
  "AVAILABLE",
  "BOOKED",
  "UNAVAILABLE",
  "ON_HOLD",
]);

export const CreateCreatorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  photo: z.string().optional().nullable(),
  gender: z.string().min(1, "Gender is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  languages: z.string().min(1, "Languages are required"),
  location: z.string().min(2, "Location is required"),
  niches: z.string().min(2, "Niches are required"),
  demographics: z.string().optional().nullable(),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Valid email required"),
  rates: z.number().positive("Rate must be greater than 0"),
  bankDetails: z.string().optional().nullable(),
  portfolioLinks: z.string().optional().nullable(),
  availabilityStatus: CreatorAvailabilityEnum.default("AVAILABLE"),
});

export const UpdateCreatorSchema = CreateCreatorSchema.partial();
