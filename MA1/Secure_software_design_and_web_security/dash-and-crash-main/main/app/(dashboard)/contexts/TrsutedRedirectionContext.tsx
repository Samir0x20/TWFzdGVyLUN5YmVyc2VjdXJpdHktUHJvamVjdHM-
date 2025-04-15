"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const TrustedRedirectionContext = createContext<undefined>(undefined);

export const TrustedRedirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const currentPath = usePathname();

    useEffect(() => {
        if (status === "loading") return; // Do nothing while loading

        if (!session) {
            router.push("/auth/role");
        } else {
            const role = session.role;
            if (role === "trusted" && (currentPath === "/preferences" || currentPath === "/")) {
                router.push("/police");
            } else if (role !== "trusted" && role !== "user") {
                router.push("/auth/role");
            } else if (role === "user" && currentPath === "/police") {
                router.push("/");
            }
        }
    }, [session, status, router, currentPath]);

    return (
        <TrustedRedirectionContext.Provider value={undefined}>
            {children}
        </TrustedRedirectionContext.Provider>
    );
};

export const useTrustedRedirection = () => {
    const context = useContext(TrustedRedirectionContext);
    if (!context) {
        throw new Error("useTrustedRedirection must be used within a TrustedRedirectionProvider");
    }
    return context;
};