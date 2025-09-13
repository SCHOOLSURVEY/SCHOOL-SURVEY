"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DatabaseService } from "@/lib/database-client"
import { Send, MessageSquare, Users, Plus, Search, MoreVertical } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import type { User } from "@/lib/types"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  is_read: boolean
  message_type: "direct" | "announcement" | "course"
  course_id?: string
  sender?: User
  recipient?: User
}

interface Conversation {
  id: string
  other_user: User
  last_message: Message
  unread_count: number
}

interface MessagingSystemProps {
  currentUserId: string
  userRole: string
}

export function MessagingSystem({ currentUserId, userRole }: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    fetchAvailableUsers()
    
    // Set up real-time subscription for messages
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
          fetchConversations() // Refresh conversations to update unread count
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentUserId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(*),
          recipient:recipient_id(*)
        `)
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>()
      
      data?.forEach((message) => {
        const otherUserId = message.sender_id === currentUserId ? message.recipient_id : message.sender_id
        const otherUser = message.sender_id === currentUserId ? message.recipient : message.sender
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            other_user: otherUser,
            last_message: message,
            unread_count: 0
          })
        }
        
        const conversation = conversationMap.get(otherUserId)!
        if (message.created_at > conversation.last_message.created_at) {
          conversation.last_message = message
        }
        
        if (message.recipient_id === currentUserId && !message.is_read) {
          conversation.unread_count++
        }
      })

      setConversations(Array.from(conversationMap.values()))
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(*),
          recipient:recipient_id(*)
        `)
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("recipient_id", currentUserId)
        .eq("sender_id", otherUserId)
        .eq("is_read", false)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", currentUserId)
        .order("full_name")

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedConversation,
          content: newMessage.trim(),
          message_type: "direct",
          is_read: false
        })

      if (error) throw error

      setNewMessage("")
      fetchMessages(selectedConversation)
      fetchConversations()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = async () => {
    if (!selectedRecipient) return

    setSelectedConversation(selectedRecipient)
    setIsNewMessageDialogOpen(false)
    setSelectedRecipient("")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredUsers = availableUsers.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConversationData = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Messages</h3>
            <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>Start a conversation with another user</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search Users</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Recipient</label>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.full_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {user.unique_id} • {user.role}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsNewMessageDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={startNewConversation} disabled={!selectedRecipient}>
                      Start Conversation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === conversation.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(conversation.other_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {conversation.other_user.full_name}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm opacity-70 truncate">
                      {conversation.last_message.content}
                    </p>
                    <p className="text-xs opacity-50">
                      {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/10">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(selectedConversationData.other_user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversationData.other_user.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversationData.other_user.unique_id} • {selectedConversationData.other_user.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === currentUserId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === currentUserId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="min-h-[40px] max-h-[120px] resize-none"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list or start a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



