import { AddressTransaction, useSubscription } from 'defi-sdk';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { toAddressTransaction } from 'src/modules/ethereum/transactions/model';
import { useAddressParams } from 'src/ui/shared/user-address/useAddressParams';
import { useLocalAddressTransactions } from 'src/ui/transactions/useLocalAddressTransactions';
import { TransactionsList } from './TransactionsList';

function useMinedAndPendingAddressTransactions() {
  const { params, ready } = useAddressParams();
  const localTransactions = useLocalAddressTransactions(params);

  const { data: localAddressTransactions, ...localTransactionsQuery } =
    useQuery(
      'pages/history',
      () => {
        return Promise.all(
          localTransactions.map((transactionObject) =>
            toAddressTransaction(transactionObject)
          )
        );
      },
      { useErrorBoundary: true }
    );

  const { value } = useSubscription<
    AddressTransaction[],
    'address',
    'transactions'
  >({
    enabled: ready,
    namespace: 'address',
    body: useMemo(
      () => ({
        scope: ['transactions'],
        payload: {
          ...params,
          currency: 'usd',
          transactions_limit: 50,
          transactions_offset: 0,
        },
      }),
      [params]
    ),
  });
  return {
    data: localAddressTransactions
      ? localAddressTransactions.concat(value || [])
      : null,
    ...localTransactionsQuery,
  };
}

export function HistoryList() {
  const { data: transactions, isLoading } =
    useMinedAndPendingAddressTransactions();
  if (isLoading || !transactions) {
    return null;
  }
  return <TransactionsList transactions={transactions} />;
}