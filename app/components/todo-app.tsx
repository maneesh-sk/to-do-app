"use client"

import type { KeyboardEvent } from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Plus, Trash2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Priority = 'P1' | 'P2' | 'P3';

type Task = {
  id: string
  text: string
  completed: boolean
  priority?: Priority
}

const PRIORITY_COLORS = {
  P1: '#ff6b6b',
  P2: '#feca57',
  P3: '#54a0ff',
} as const;

const PRIORITY_LABELS = {
  P1: 'High',
  P2: 'Medium',
  P3: 'Low',
} as const;

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<Priority | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("all")
  const [audioEnabled, setAudioEnabled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const deleteAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio with user interaction
  const initializeAudio = () => {
    try {
      if (!audioRef.current) {
        const basePath = process.env.NODE_ENV === 'production' ? '/to-do-app' : '';
        
        // Pre-load and test audio files
        const completeAudio = new Audio();
        const deleteAudio = new Audio();
        
        // Use Promise.all to load both audio files
        Promise.all([
          new Promise((resolve, reject) => {
            completeAudio.addEventListener('canplaythrough', resolve, { once: true });
            completeAudio.addEventListener('error', reject, { once: true });
            completeAudio.src = `${basePath}/task-complete.wav`;
            completeAudio.load();
          }),
          new Promise((resolve, reject) => {
            deleteAudio.addEventListener('canplaythrough', resolve, { once: true });
            deleteAudio.addEventListener('error', reject, { once: true });
            deleteAudio.src = `${basePath}/delete-sound.wav`;
            deleteAudio.load();
          })
        ]).then(() => {
          audioRef.current = completeAudio;
          deleteAudioRef.current = deleteAudio;
          setAudioEnabled(true);
        }).catch((error) => {
          console.error("Error loading audio files:", error);
          setAudioEnabled(false);
        });
      }
    } catch (error) {
      console.error("Error in initializeAudio:", error);
      setAudioEnabled(false);
    }
  };

  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      const testKey = "__test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.error("localStorage is not available:", e);
      return false;
    }
  };

  // Load tasks from localStorage when component mounts
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.error("localStorage is not available, tasks will not persist");
      return;
    }

    try {
      console.log("Attempting to load tasks from localStorage...");
      const savedTasks = localStorage.getItem("todos")
      console.log("Raw saved tasks:", savedTasks);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        console.log("Successfully parsed tasks:", parsedTasks);
        setTasks(parsedTasks)
      } else {
        console.log("No saved tasks found in localStorage");
      }
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error)
    }
    // Focus the input field when the component mounts
    inputRef.current?.focus()
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      return;
    }

    // Don't save if tasks is empty and there are existing tasks in localStorage
    if (tasks.length === 0) {
      const existingTasks = localStorage.getItem("todos");
      if (existingTasks) {
        const parsedExistingTasks = JSON.parse(existingTasks);
        if (parsedExistingTasks.length > 0) {
          return;
        }
      }
    }

    try {
      console.log("Saving tasks to localStorage:", tasks);
      const tasksString = JSON.stringify(tasks)
      localStorage.setItem("todos", tasksString)
      // Verify the save
      const savedTasks = localStorage.getItem("todos")
      console.log("Verified saved tasks:", savedTasks);
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error)
    }
  }, [tasks])

  const addTask = () => {
    if (newTask.trim() === "") return

    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      completed: false,
      priority: selectedPriority,
    }

    setTasks([...tasks, task])
    setNewTask("")
    setSelectedPriority(undefined) // Reset priority after adding task
    inputRef.current?.focus()
  }

  const updateTaskPriority = (id: string, priority: Priority | undefined) => {
    setTasks(tasks.map((task) => 
      task.id === id ? { ...task, priority } : task
    ))
  }

  const playCompleteSound = async () => {
    try {
      if (!audioEnabled || !audioRef.current) {
        return;
      }
      
      const audio = audioRef.current;
      
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (error: unknown) {
        console.error("Error playing complete sound:", error);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          // User hasn't interacted yet, we'll try again on next interaction
          return;
        }
        setAudioEnabled(false);
      }
    } catch (error) {
      console.error("Error in playCompleteSound:", error);
    }
  };

  const playDeleteSound = async () => {
    try {
      if (!audioEnabled || !deleteAudioRef.current) {
        return;
      }
      
      const audio = deleteAudioRef.current;
      
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (error: unknown) {
        console.error("Error playing delete sound:", error);
        if (error instanceof Error && error.name === 'NotAllowedError') {
          // User hasn't interacted yet, we'll try again on next interaction
          return;
        }
        setAudioEnabled(false);
      }
    } catch (error) {
      console.error("Error in playDeleteSound:", error);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => {
      if (task.id === id) {
        if (!task.completed) {
          // Initialize audio on first interaction if not already done
          initializeAudio();
          playCompleteSound();
        }
        return { ...task, completed: !task.completed };
      }
      return task;
    }));
  }

  const deleteTask = (id: string) => {
    initializeAudio(); // Initialize audio on first interaction
    playDeleteSound();
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

      <div className="flex gap-2 mb-4">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
            >
              <Circle 
                className={cn(
                  "h-4 w-4",
                  selectedPriority ? "fill-current" : "stroke-current fill-none"
                )}
                style={selectedPriority ? { color: PRIORITY_COLORS[selectedPriority] } : undefined}
              />
              <span className="sr-only">Set priority</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedPriority(undefined)}>
              No Priority
            </DropdownMenuItem>
            {(Object.keys(PRIORITY_COLORS) as Priority[]).map((priority) => (
              <DropdownMenuItem
                key={priority}
                onClick={() => setSelectedPriority(priority)}
                className="flex items-center gap-2"
              >
                <Circle 
                  className="h-3 w-3 fill-current"
                  style={{ color: PRIORITY_COLORS[priority] }}
                />
                {PRIORITY_LABELS[priority]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                <span className="sr-only">
                  {task.completed ? "Mark as incomplete" : "Mark as complete"}
                </span>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full"
                  >
                    <Circle 
                      className={cn(
                        "h-4 w-4",
                        task.priority ? "fill-current" : "stroke-current fill-none"
                      )}
                      style={task.priority ? { color: PRIORITY_COLORS[task.priority] } : undefined}
                    />
                    <span className="sr-only">Set priority</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updateTaskPriority(task.id, undefined)}>
                    No Priority
                  </DropdownMenuItem>
                  {(Object.keys(PRIORITY_COLORS) as Priority[]).map((priority) => (
                    <DropdownMenuItem
                      key={priority}
                      onClick={() => updateTaskPriority(task.id, priority)}
                      className="flex items-center gap-2"
                    >
                      <Circle 
                        className="h-3 w-3 fill-current"
                        style={{ color: PRIORITY_COLORS[priority] }}
                      />
                      {PRIORITY_LABELS[priority]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="h-8 w-8 shrink-0 rounded-full opacity-70 hover:opacity-100 ml-1"
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

