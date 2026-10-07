"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getNotifications,
  MarketplaceNotification,
  markNotificationAsRead,
  respondToHireNotification,
} from "@/lib/marketplace-store";
import { Bell, Check, CheckCircle2, ChevronRight, X } from "lucide-react";

type NotificationBellProps = {
  role: "creator" | "brand";
  currentUsername: string;
};

export function NotificationBell({ role, currentUsername }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const loadList = useCallback(() => {
    const list = getNotifications(role, currentUsername);
    setNotifications(list);
  }, [role, currentUsername]);

  useEffect(() => {
    loadList();

    // Re-check on custom event, storage event, window focus, or periodic interval
    const interval = setInterval(loadList, 2500);
    window.addEventListener("focus", loadList);
    window.addEventListener("marketplace_notifications_updated", loadList);
    window.addEventListener("storage", loadList);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", loadList);
      window.removeEventListener("marketplace_notifications_updated", loadList);
      window.removeEventListener("storage", loadList);
    };
  }, [loadList]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleToggle() {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Mark as read
      notifications.forEach((n) => {
        if (!n.read) markNotificationAsRead(n.id);
      });
      loadList();
    }
  }

  function handleRespond(notifId: string, action: "accepted" | "declined", e: React.MouseEvent) {
    e.stopPropagation();
    respondToHireNotification(notifId, action);
    loadList();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Open notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-1 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#070b14] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Pop-up Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 z-50 w-80 sm:w-96 rounded-2xl border border-white/15 bg-[#0a0f1d] p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-2 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {role === "creator" ? "Hire Briefs & Offers" : "Creator Responses"}
            </span>
          </div>

          {/* List of Notifications */}
          <div className="mt-2 max-h-80 overflow-y-auto space-y-2 pr-0.5">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => {
                const isHireOffer = item.type === "hire_offer";
                const isPending = item.status === "pending";

                // Brand destination link for creator
                const brandLink = `/creator/brand/${item.senderUsername.toLowerCase().replace(/^@/, "")}`;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition ${
                      !item.read
                        ? "border-violet-500/40 bg-violet-950/20"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Single-line header view: Brand Logo, Name, Badge, Title, Budget */}
                    <div className="flex items-start gap-2.5">
                      
                        {/* Brand / Creator Profile Link */}
                        <Link
                          href={role === "creator" ? brandLink : `/brand/creators/${item.senderUsername.toLowerCase().replace(/^@/, "")}`}
                          onClick={() => setIsIsOpenFalse()}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-xs font-bold text-white shadow"
                        >
                          {item.senderName.replace(/^@/, "").charAt(0).toUpperCase()}
                        </Link>

                        <div className="flex-1 min-w-0">
                          {/* Name & Handle */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={role === "creator" ? brandLink : `/brand/creators/${item.senderUsername.toLowerCase().replace(/^@/, "")}`}
                              onClick={() => setIsIsOpenFalse()}
                              className="font-bold text-xs text-white hover:text-violet-300 transition truncate"
                            >
                              {item.senderName}
                            </Link>
                            <span className="text-[10px] text-violet-300 font-medium">
                              @{item.senderUsername.replace(/^@/, "")}
                            </span>
                          </div>

                          {/* Single-line detail view like search item */}
                          <p className="mt-0.5 text-[11px] text-slate-300 line-clamp-1">
                            {isHireOffer ? (
                              <>
                                <strong className="text-amber-300">{item.budget}</strong> &bull; {item.projectTitle}
                              </>
                            ) : (
                              item.message || item.projectTitle
                            )}
                          </p>

                          {/* Brief Definition Specifications Tags */}
                          {isHireOffer && (item.contentType || item.formatAspectRatio || item.commercialUseRequirements) && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.contentType && (
                                <span className="rounded bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-violet-300">
                                  🎬 {item.contentType}
                                </span>
                              )}
                              {item.formatAspectRatio && (
                                <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-300 font-mono">
                                  📐 {item.formatAspectRatio.split(" ")[0]}
                                </span>
                              )}
                              {item.commercialUseRequirements && (
                                <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300">
                                  ⚖️ Commercial
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Link */}
                          {role === "creator" ? (
                            <Link
                              href={brandLink}
                              onClick={() => setIsIsOpenFalse()}
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-400 hover:underline"
                            >
                              <span>View Brand Profile</span>
                              <ChevronRight className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            <Link
                              href={`/brand/creators/${item.senderUsername.toLowerCase().replace(/^@/, "")}`}
                              onClick={() => setIsIsOpenFalse()}
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-400 hover:underline"
                            >
                              <span>View Creator Profile</span>
                              <ChevronRight className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                    </div>

                    {/* Accept / Decline Action Buttons (Right inside the notification) */}
                    {isHireOffer && role === "creator" && (
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                        {isPending ? (
                          <>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Response required:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => handleRespond(item.id, "accepted", e)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                              >
                                <Check className="h-3 w-3" />
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleRespond(item.id, "declined", e)}
                                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition"
                              >
                                <X className="h-3 w-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </>
                        ) : item.status === "accepted" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Accepted proposal &bull; Collaboration created</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <X className="h-3.5 w-3.5 text-rose-400" />
                            <span>Declined</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Brand Status Notice for Brand Users */}
                    {role === "brand" && (
                      <div className="mt-2 pt-1.5 border-t border-white/5 text-[10px]">
                        {item.type === "hire_accepted" && (
                          <span className="text-emerald-300 font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3" /> Creator accepted! You can now manage milestones.
                          </span>
                        )}
                        {item.type === "hire_declined" && (
                          <span className="text-slate-400">
                            Creator declined this proposal.
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );

  function setIsIsOpenFalse() {
    setIsOpen(false);
  }
}
