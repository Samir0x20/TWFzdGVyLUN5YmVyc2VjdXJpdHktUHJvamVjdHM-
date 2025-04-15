"use client";

import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const GoogleReCaptchaWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default GoogleReCaptchaWrapper;