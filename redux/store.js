import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './activitySlice';
import productReducer from './productSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    product: productReducer,
  },
});