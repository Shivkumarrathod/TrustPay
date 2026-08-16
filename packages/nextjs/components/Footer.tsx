import React from "react";
import Link from "next/link";
import { useFetchNativeCurrencyPrice } from "@scaffold-ui/hooks";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site footer
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { price: nativeCurrencyPrice } = useFetchNativeCurrencyPrice();

  return (
    <footer className="min-h-0 py-6 px-4 mb-11 lg:mb-0 border-t border-white/5 bg-[#06070a] text-slate-400">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
            {nativeCurrencyPrice > 0 && (
              <div>
                <div className="btn bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 btn-sm font-medium gap-1.5 cursor-auto backdrop-blur-md">
                  <CurrencyDollarIcon className="h-4 w-4 text-emerald-400" />
                  <span>{targetNetwork.nativeCurrency?.symbol ?? "MON"}/USD: ${nativeCurrencyPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
            {isLocalNetwork && (
              <>
                <Faucet />
                <Link
                  href="/blockexplorer"
                  passHref
                  className="btn bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 btn-sm font-normal gap-1.5 backdrop-blur-md"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-cyan-400" />
                  <span>Block Explorer</span>
                </Link>
              </>
            )}
          </div>
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
          <span className="font-semibold text-slate-200">TrustPay Decentralized Escrow</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Trustless milestone-based protection on Monad Testnet & EVM</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">
            Protocol Mechanics
          </Link>
          <span>·</span>
          <Link href="/debug" className="hover:text-emerald-400 transition-colors">
            Smart Contract Inspector
          </Link>
          <span>·</span>
          <span className="text-slate-500">Network: {targetNetwork.name}</span>
        </div>
      </div>
    </footer>
  );
};
