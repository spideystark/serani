import { createSlice } from '@reduxjs/toolkit';

const productSlice = createSlice({
  name: 'product',
  initialState: {
    products: [],
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    incrementQty: (state, action) => {
      const item = state.products.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity++;
      }
    },
    decrementQty: (state, action) => {
      const item = state.products.find((item) => item.id === action.payload.id);
      if (item) {
        if (item.quantity > 0) {
          item.quantity--;
        }
      }
    },
  },
});

export const { setProducts, incrementQty, decrementQty } = productSlice.actions;
export default productSlice.reducer;
