"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import axiosInstance from "@/services/admin.services";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "superadmin"]),
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function CreateAdminPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await axiosInstance.post("/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      alert("Admin created successfully");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create admin");
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full">

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create New Admin</h2>
          <p className="text-sm text-gray-400 mt-1">Add a new admin user to the portal</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          {/* Name */}
          <input className="admin-inputs" placeholder="Full Name"        {...register("name")} />
          {errors.name && <p className="err">{errors.name.message}</p>}

          {/* Email */}
          <input className="admin-inputs" placeholder="Email Address" type="email" {...register("email")} />
          {errors.email && <p className="err">{errors.email.message}</p>}

          {/* Role */}
          <select className="admin-inputs" {...register("role")}>
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
          {errors.role && <p className="err">{errors.role.message}</p>}

          {/* Password */}
          <input className="admin-inputs" placeholder="Password" type="password" {...register("password")} />
          {errors.password && <p className="err">{errors.password.message}</p>}

          {/* Confirm Password */}
          <input className="admin-inputs" placeholder="Confirm Password" type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="err">{errors.confirmPassword.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-btn"
          >
            {isSubmitting ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}