"use client";

import { useCallback, useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { Escrow, EscrowStatus } from "~~/components/trustpay/types";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const useAllEscrows = () => {
  const publicClient = usePublicClient();
  const { data: deployedContractData } = useDeployedContractInfo({ contractName: "YourContract" });

  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read total escrow count from contract
  const { data: rawCount, refetch: refetchCount } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getEscrowCount",
  });

  const count = rawCount ? Number(rawCount) : 0;

  const fetchSingleEscrow = async (client: any, address: string, abi: any, id: bigint, retries = 2): Promise<any> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await client.readContract({
          address,
          abi,
          functionName: "getEscrow",
          args: [id],
        });
        return res;
      } catch (err) {
        if (attempt === retries) throw err;
        // Small exponential delay before retrying
        await new Promise(res => setTimeout(res, 200 * (attempt + 1)));
      }
    }
  };

  const fetchEscrows = useCallback(async () => {
    if (!publicClient || !deployedContractData || count === 0) {
      if (count === 0) {
        setEscrows([]);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const promises = Array.from({ length: count }, (_, i) =>
        fetchSingleEscrow(publicClient, deployedContractData.address, deployedContractData.abi, BigInt(i)),
      );

      const settled = await Promise.allSettled(promises);

      const parsed: Escrow[] = [];
      settled.forEach((result, idx) => {
        if (result.status === "fulfilled" && result.value) {
          const r = result.value;
          parsed.push({
            id: r.id !== undefined ? r.id : BigInt(idx),
            buyer: r.buyer,
            seller: r.seller,
            token: r.token,
            totalAmount: r.totalAmount,
            depositedAmount: r.depositedAmount,
            releasedAmount: r.releasedAmount,
            refundedAmount: r.refundedAmount,
            deadline: r.deadline,
            arbiter: r.arbiter,
            status: r.status as EscrowStatus,
            milestoneCount: r.milestoneCount,
          });
        }
      });

      // Sort newest escrows first
      parsed.sort((a, b) => Number(b.id - a.id));

      if (parsed.length > 0 || count === 0) {
        setEscrows(parsed);
      }
    } catch (err) {
      console.warn("Notice: Error loading escrows from Monad RPC:", err);
    } finally {
      setIsLoading(false);
    }
  }, [count, publicClient, deployedContractData]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const refetchAll = () => {
    refetchCount();
    fetchEscrows();
  };

  return {
    escrows,
    count,
    isLoading,
    refetchAll,
  };
};
