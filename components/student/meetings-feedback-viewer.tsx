"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/responsive-tabs"
import { 
  Calendar, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react"
import { DatabaseService } from "@/lib/database-client"

interface ScheduledMeeting {
  id: string
  title: string
  description: string
  meeting_type: string
  scheduled_date: string
  status: string
  meeting_link?: string
  notes?: string
  created_at: string
  teacher_id: string
}

interface FeedbackMessage {
  id: string
  title: string
  message: string
  message_type: string
  is_read: boolean
  created_at: string
  teacher_id: string
}

interface MeetingsFeedbackViewerProps {
  studentId: string
}

export function MeetingsFeedbackViewer({ studentId }: MeetingsFeedbackViewerProps) {
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([])
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [studentId])

  const fetchData = async () => {
    try {
      
      const currentUserData = localStorage.getItem("currentUser")
      if (!currentUserData) {
        throw new Error("No current user found")
      }
      const currentUser = JSON.parse(currentUserData)
      const schoolId = currentUser.school_id
      

      // Fetch scheduled meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("scheduled_meetings")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })

      if (meetingsError) {
      } else {
        setMeetings(meetingsData || [])
      }

      // Fetch feedback messages
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback_messages")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })

      if (feedbackError) {
      } else {
        setFeedback(feedbackData || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const markFeedbackAsRead = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from("feedback_messages")
        .update({ is_read: true })
        .eq("id", feedbackId)

      if (error) {
        console.error("Error marking feedback as read:", error)
      } else {
        // Update local state
        setFeedback(prev => 
          prev.map(f => f.id === feedbackId ? { ...f, is_read: true } : f)
        )
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Meetings & Feedback</h2>
        <p className="text-muted-foreground">
          View your scheduled meetings and feedback from teachers
        </p>
      </div>

      <Tabs defaultValue="meetings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meetings" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Meetings ({meetings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback ({feedback.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No scheduled meetings</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <CardDescription>
                        Teacher ID: {meeting.teacher_id}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(meeting.status)}>
                      {getStatusIcon(meeting.status)}
                      <span className="ml-1 capitalize">{meeting.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {meeting.description}
                  </p>
                  {meeting.scheduled_date && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(meeting.scheduled_date).toLocaleDateString()} at{' '}
                        {new Date(meeting.scheduled_date).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {meeting.meeting_link && (
                    <div className="mt-3">
                      <Button size="sm" variant="outline" asChild>
                        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                          Join Meeting
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {feedback.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No feedback messages</p>
              </CardContent>
            </Card>
          ) : (
            feedback.map((message) => (
              <Card key={message.id} className={!message.is_read ? "border-blue-200 bg-blue-50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{message.title}</CardTitle>
                      <CardDescription>
                        Teacher ID: {message.teacher_id}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!message.is_read && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          New
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{message.message}</p>
                  {!message.is_read && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markFeedbackAsRead(message.id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
