"use client"

import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import React, { useState } from "react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { UserAuthForm } from "@/components/user-auth-form"

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
}

export default function AuthenticationPage() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  return (
    <>
      <div>
        <iframe
          src="https://lottie.host/embed/d1abe612-14e9-47a9-bc73-fbb22b8fa852/D0QFNbwpcF.json"
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
        />
      </div>
      <div className="container relative flex h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-black dark:border-r lg:flex">
          <div className="relative z-20 flex items-center text-lg font-medium">
            RideShare.
          </div>
          <div className="flex items-center justify-center w-full h-full">
            <iframe
              src="https://lottie.host/embed/5ad493df-451a-4d69-94ae-a156191cd5c4/kpPkwmNZrT.json"
              className="w-[500px] h-[500px] border-0"
              allowFullScreen
            />
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This ride-sharing app has revolutionized my daily commute and 
                helped me navigate the city with ease, making travel more convenient and 
                efficient than ever before.&rdquo;
              </p>
              <footer className="text-sm">Top G</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8 w-full max-w-md mx-auto">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isSignUp ? "Create your account" : "Sign into your account"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email below to {isSignUp ? "create your account" : "sign in to your account"}
              </p>
            </div>
            <UserAuthForm isSignUp={isSignUp} setIsSignUp={setIsSignUp} />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
