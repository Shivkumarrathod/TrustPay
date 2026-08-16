"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import {
  Bars3Icon,
  BugAntIcon,
  ClockIcon,
  PlusCircleIcon,
  ScaleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { TrustPayLogo } from "~~/components/trustpay/TrustPayLogo";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Escrows",
    href: "/",
    icon: <Squares2X2Icon className="h-4 w-4" />,
  },
  {
    label: "Create Escrow",
    href: "/#create",
    icon: <PlusCircleIcon className="h-4 w-4" />,
  },
  {
    label: "Dispute Center",
    href: "/#disputes",
    icon: <ScaleIcon className="h-4 w-4" />,
  },
  {
    label: "Activity Feed",
    href: "/#activity",
    icon: <ClockIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href || (href === "/" && pathname === "/");
        return (
          <li key={label} className="h-full">
            <Link
              href={href}
              passHref
              className={`${
                isActive
                  ? "bg-emerald-500/10 text-emerald-300 font-semibold border-b-2 border-emerald-500"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              } transition-all duration-150 h-full px-3.5 text-sm gap-2 flex items-center whitespace-nowrap`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <header className="sticky top-0 navbar bg-[#0a0c14]/90 backdrop-blur-md min-h-16 shrink-0 justify-between z-30 border-b border-white/10 px-3 sm:px-6">
      <div className="navbar-start w-auto flex items-center gap-2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="btn btn-ghost btn-sm lg:hidden hover:bg-slate-800/60 text-slate-300">
            <Bars3Icon className="h-5 w-5" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-2xl bg-[#0e111a] border border-white/10 rounded-xl w-56 space-y-1"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>

        <Link href="/" passHref className="flex items-center gap-2 ml-1 mr-4 shrink-0 group">
          <TrustPayLogo withText={true} />
        </Link>

        <ul className="hidden lg:flex lg:flex-nowrap h-full m-0 p-0 list-none items-center space-x-1">
          <HeaderMenuLinks />
        </ul>
      </div>

      <div className="navbar-end grow flex items-center justify-end gap-2.5">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Escrow Protocol Live</span>
        </div>
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </header>
  );
};
