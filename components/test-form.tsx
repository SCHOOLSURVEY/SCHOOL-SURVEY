"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TestForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Simple Test Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name (Simple State)</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Type your full name here"
          />
          <div className="text-xs text-gray-500 mt-1">Value: "{fullName}"</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email (Simple State)</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Type your email here" />
          <div className="text-xs text-gray-500 mt-1">Value: "{email}"</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Uncontrolled Input</label>
          <Input placeholder="Type anything here (uncontrolled)" />
        </div>
      </CardContent>
    </Card>
  )
}
