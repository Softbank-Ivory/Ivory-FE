

export const MOCK_EXECUTION_METADATA = {
  payload: {
    orderId: 'ord_123456789',
    items: [
      { id: 'item_1', quantity: 2 },
      { id: 'item_2', quantity: 1 },
    ],
    customer: {
      id: 'cust_987',
      email: 'user@example.com',
    },
  },
  runnerId: 'i-0123456789abcdef0',
  sandboxId: 'sbx-987654321',
  region: 'ap-northeast-2',
};
