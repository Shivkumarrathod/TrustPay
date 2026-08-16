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
      const promises: Promise<any>[] = [];

      for (let i = 0; i < count; i++) {
        promises.push(
          publicClient.readContract({
            address: deployedContractData.address,
            abi: deployedContractData.abi,
            functionName: "getEscrow",
            args: [BigInt(i)],
          }),
        );
      }

      const results = await Promise.all(promises);

      const parsed: Escrow[] = results.map((r: any) => ({
        id: r.id,
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
      }));

      // Sort newest escrows first
      parsed.sort((a, b) => Number(b.id - a.id));

      setEscrows(parsed);
    } catch (err) {
      console.error("Error fetching all escrows:", err);
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
