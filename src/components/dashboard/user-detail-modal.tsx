"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  getPlanColor,
  getStatusColor,
  formatDate,
  formatDateTime,
  getInitials,
} from "@/lib/utils";
import type { PlatformUser, Customer } from "@/types";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Globe,
  FileText,
  StickyNote,
  Star,
  X
} from "lucide-react";

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: PlatformUser | Customer | null;
  type?: "user" | "customer";
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-200 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 text-gray-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm text-gray-900 mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

export function UserDetailModal({
  open,
  onClose,
  user,
  type = "user",
}: UserDetailModalProps) {
  if (!user) return null;

  const isCustomer = type === "customer";
  const customer = user as Customer;
  const platformUser = user as PlatformUser;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* ONLY WHITE CARD */}
      <div className="relative bg-white p-6 rounded-2xl shadow-xl">

        {/* ❌ Close button inside */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
        >
          <X size={18} />
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
            {getInitials(user.name)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900">
              {user.name}
            </h3>
            <p className="text-sm text-gray-500">{user.email}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={getPlanColor(user.plan)}>
                <Star size={9} className="mr-1" />
                {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
              </Badge>

              {isCustomer ? (
                <Badge className={getStatusColor(customer.status)}>
                  {customer.status}
                </Badge>
              ) : (
                <Badge className={getStatusColor(platformUser.status)}>
                  {platformUser.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Rest stays SAME */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">
              Contact
            </p>
            <InfoRow icon={<Mail size={13} />} label="Email" value={user.email} />
            <InfoRow icon={<Phone size={13} />} label="Phone" value={user.phone} />
          </div>

          {isCustomer && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">
                Subscription
              </p>
              <InfoRow icon={<Calendar size={13} />} label="Start Date" value={formatDate(customer.planStartDate)} />
              <InfoRow icon={<Calendar size={13} />} label="End Date" value={formatDate(customer.planEndDate)} />
              <InfoRow icon={<FileText size={13} />} label="Reports" value={`${customer.reportsCount} report(s) generated`} />
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">
            Birth Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <div>
              <InfoRow icon={<Calendar size={13} />} label="Date of Birth" value={formatDate(user.dateOfBirth)} />
              <InfoRow icon={<Clock size={13} />} label="Time of Birth" value={user.timeOfBirth} />
            </div>
            <div>
              <InfoRow icon={<MapPin size={13} />} label="Place of Birth" value={user.placeOfBirth} />
              <InfoRow icon={<Globe size={13} />} label="City / Country" value={`${user.cityOfBirth}, ${user.countryOfBirth}`} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">
            Consultation
          </p>
          <InfoRow icon={<Star size={13} />} label="Primary Concern" value={user.primaryConcern} />
          {user.additionalNotes && (
            <InfoRow icon={<StickyNote size={13} />} label="Additional Notes" value={user.additionalNotes} />
          )}
        </div>

        {!isCustomer && (
          <div className="mt-4 grid grid-cols-2 gap-x-6">
            <InfoRow icon={<Clock size={13} />} label="Registered" value={formatDateTime(platformUser.registeredAt)} />
            <InfoRow icon={<User size={13} />} label="Last Login" value={formatDateTime(platformUser.lastLogin)} />
          </div>
        )}
      </div>
    </Modal>
  );
}