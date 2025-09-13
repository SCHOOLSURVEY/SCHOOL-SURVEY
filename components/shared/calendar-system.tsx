"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatabaseService } from "@/lib/database-client"
import { CalendarIcon, Plus, Clock, MapPin, Users, BookOpen, AlertCircle } from "lucide-react"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { cn } from "@/lib/utils"
import type { Course } from "@/lib/types"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  event_type: "assignment_due" | "exam" | "holiday" | "meeting" | "announcement" | "custom"
  course_id?: string
  created_by: string
  created_at: string
  course?: Course
  created_by_user?: {
    full_name: string
  }
}

interface CalendarSystemProps {
  currentUserId: string
  userRole: string
}

export function CalendarSystem({ currentUserId, userRole }: CalendarSystemProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    event_type: "custom" as const,
    course_id: ""
  })

  useEffect(() => {
    fetchEvents()
    if (userRole === "teacher" || userRole === "admin") {
      fetchCourses()
    }
  }, [currentUserId, userRole])

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from("calendar_events")
        .select(`
          *,
          courses(id, name, class_number),
          created_by_user:created_by(full_name)
        `)
        .order("start_date", { ascending: true })

      // Filter events based on user role and access
      if (userRole === "student") {
        // Students see events for their enrolled courses and general events
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("student_id", currentUserId)

        const courseIds = enrollments?.map(e => e.course_id) || []
        
        if (courseIds.length > 0) {
          query = query.or(`course_id.in.(${courseIds.join(",")}),course_id.is.null`)
        } else {
          query = query.is("course_id", null)
        }
      } else if (userRole === "teacher") {
        // Teachers see events for their courses and general events
        const { data: teacherCourses } = await supabase
          .from("courses")
          .select("id")
          .eq("teacher_id", currentUserId)

        const courseIds = teacherCourses?.map(c => c.id) || []
        
        if (courseIds.length > 0) {
          query = query.or(`course_id.in.(${courseIds.join(",")}),course_id.is.null,created_by.eq.${currentUserId}`)
        } else {
          query = query.or(`course_id.is.null,created_by.eq.${currentUserId}`)
        }
      }
      // Admins see all events

      const { data, error } = await query

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from("courses")
        .select(`
          *,
          subjects!inner(name, code)
        `)
        .order("name")

      if (userRole === "teacher") {
        query = query.eq("teacher_id", currentUserId)
      }

      const { data, error } = await query
      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }

  const createEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.start_date) return

    try {
      const { error } = await supabase
        .from("calendar_events")
        .insert({
          title: newEvent.title.trim(),
          description: newEvent.description.trim() || null,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date || null,
          event_type: newEvent.event_type,
          course_id: newEvent.course_id || null,
          created_by: currentUserId
        })

      if (error) throw error

      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        event_type: "custom",
        course_id: ""
      })
      setIsCreateDialogOpen(false)
      fetchEvents()
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date)
      return isSameDay(eventDate, date)
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "assignment_due": return "bg-blue-100 text-blue-800"
      case "exam": return "bg-red-100 text-red-800"
      case "holiday": return "bg-green-100 text-green-800"
      case "meeting": return "bg-purple-100 text-purple-800"
      case "announcement": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "assignment_due": return <BookOpen className="h-3 w-3" />
      case "exam": return <AlertCircle className="h-3 w-3" />
      case "holiday": return <CalendarIcon className="h-3 w-3" />
      case "meeting": return <Users className="h-3 w-3" />
      case "announcement": return <AlertCircle className="h-3 w-3" />
      default: return <CalendarIcon className="h-3 w-3" />
    }
  }

  const canCreateEvents = userRole === "admin" || userRole === "teacher"

  if (loading) {
    return <div>Loading calendar...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Academic Calendar</span>
              </CardTitle>
              <CardDescription>View and manage important dates and events</CardDescription>
            </div>
            {canCreateEvents && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Add a new event to the calendar</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="Enter event title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Enter event description"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={newEvent.start_date}
                          onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date (Optional)</Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          value={newEvent.end_date}
                          onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_type">Event Type</Label>
                      <Select
                        value={newEvent.event_type}
                        onValueChange={(value: any) => setNewEvent({ ...newEvent, event_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom Event</SelectItem>
                          <SelectItem value="assignment_due">Assignment Due</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="holiday">Holiday</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {courses.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="course">Course (Optional)</Label>
                        <Select
                          value={newEvent.course_id}
                          onValueChange={(value) => setNewEvent({ ...newEvent, course_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">General Event</SelectItem>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} - {course.class_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createEvent} disabled={!newEvent.title.trim() || !newEvent.start_date}>
                        Create Event
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                components={{
                  Day: ({ date, ...props }) => {
                    const dayEvents = getEventsForDate(date)
                    return (
                      <div className="relative">
                        <div {...props} />
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {dayEvents.slice(0, 3).map((event, index) => (
                              <div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }
                }}
              />
            </div>

            {/* Events List */}
            <div className="space-y-4">
              <h3 className="font-semibold">Events for {format(selectedDate, "PPP")}</h3>
              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events scheduled for this date.</p>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <Card key={event.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge className={getEventTypeColor(event.event_type)}>
                            <span className="flex items-center space-x-1">
                              {getEventTypeIcon(event.event_type)}
                              <span className="capitalize">{event.event_type.replace("_", " ")}</span>
                            </span>
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(event.start_date), "HH:mm")}
                            {event.end_date && ` - ${format(new Date(event.end_date), "HH:mm")}`}
                          </span>
                        </div>
                        {event.course && (
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            <span>{event.course.name}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events
              .filter(event => {
                const eventDate = new Date(event.start_date)
                const today = new Date()
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                return eventDate >= today && eventDate <= nextWeek
              })
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {getEventTypeIcon(event.event_type)}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{format(new Date(event.start_date), "MMM d, HH:mm")}</span>
                      {event.course && (
                        <>
                          <span>•</span>
                          <span>{event.course.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

