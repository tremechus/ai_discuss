// Simple test to validate React components
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AI Discuss title', () => {
  render(<App />);
  const titleElement = screen.getByText(/AI Discuss/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders topic configuration header', () => {
  render(<App />);
  const configHeader = screen.getByText(/Discussion Configuration/i);
  expect(configHeader).toBeInTheDocument();
});
