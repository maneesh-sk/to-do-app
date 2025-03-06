"use client"

import type { KeyboardEvent } from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Task = {
  id: string
  text: string
  completed: boolean
}

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the input field when the component mounts
    inputRef.current?.focus()
  }, [])

  const addTask = () => {
    if (newTask.trim() === "") return

    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
    }

    setTasks([...tasks, task])
    setNewTask("")
    inputRef.current?.focus()
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTask()
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "active") return !task.completed
    if (activeTab === "completed") return task.completed
    return true
  })

  return (
    <div className="max-w-md mx-auto p-4 bg-background rounded-lg shadow-lg">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">My Tasks</h1>
      </header>

      <div className="flex mb-4">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 mr-2"
        />
        <Button onClick={addTask} size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="space-y-2">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center p-3 bg-card rounded-md border"
            >
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 h-6 w-6 shrink-0 rounded-full"
                onClick={() => toggleTask(task.id)}
              >
                <motion.span
                  initial={false}
                  animate={{ scale: 1 }}
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    task.completed ? "bg-primary border-primary" : "border-primary/50 bg-transparent",
                  )}
                >
                  <motion.span
                    initial={false}
                    animate={task.completed ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      duration: 0.2,
                    }}
                  >
                    {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </motion.span>
                </motion.span>
                <span className="sr-only">{task.completed ? "Mark as incomplete" : "Mark as complete"}</span>
              </Button>

              <motion.span
                animate={{
                  textDecoration: task.completed ? "line-through" : "none",
                  opacity: task.completed ? 0.5 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="flex-1 text-sm"
              >
                {task.text}
              </motion.span>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="h-8 w-8 shrink-0 rounded-full opacity-70 hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete task</span>
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            {activeTab === "all" ? "No tasks yet" : activeTab === "active" ? "No active tasks" : "No completed tasks"}
          </div>
        )}
      </ul>
    </div>
  )
}

