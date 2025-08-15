import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Filters from './components/Filters';

/** @typedef {"low"|"medium"|"high"} Priority */
/** @typedef {"all"|"active"|"completed"|"overdue"} Status */
/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string=} notes
 * @property {string=} category
 * @property {Priority} priority
 * @property {string=} due
 * @property {boolean} completed
 * @property {string} createdAt
 * @property {string} updatedAt
 */

const uid = () => crypto.randomUUID() || Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);
const isOverdue = (t) => !t.completed && t.due && t.due < todayISO();

const STORAGE_KEY = "tmc_tasks_v2";
const STORAGE_META_KEY = "tmc_meta_v2";
const STORAGE_LANG = "tmc_lang_v2";

const L = {
  ar: {
    title: "مدير المهام المتقدم",
    subtitle: "تطبيق آمن 100% - بياناتك تبقى على جهازك",
    export: "تصدير البيانات",
    import: "استيراد البيانات",
    search: "ابحث في المهام...",
    all: "الكل",
    active: "نشطة",
    completed: "مكتملة",
    overdue: "متأخرة",
    allCats: "كل الفئات",
    anyPri: "أي أولوية",
    high: "عاجل",
    medium: "متوسط",
    low: "عادي",
    newest: "الأحدث",
    oldest: "الأقدم",
    dueDate: "حسب التاريخ",
    byPriority: "حسب الأهمية",
    clearDone: "حذف المكتملة",
    addTask: "إضافة مهمة جديدة",
    saveCat: "حفظ الفئة",
    notes: "ملاحظات إضافية",
    taskTitle: "عنوان المهمة",
    category: "اختر فئة",
    due: "تاريخ التسليم",
    doneBadge: "مكتمل",
    overdueBadge: "متأخر",
    edit: "تعديل",
    del: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    empty: "لا توجد مهام مطابقة",
    footer: "تم التطوير من طرف Rezki-dev - بياناتك تبقى خاصة",
    lang: "English",
    stats: {
      total: "إجمالي المهام",
      completed: "مكتملة",
      overdue: "متأخرة",
      active: "نشطة"
    }
  },
  en: {
    title: "Advanced Task Manager",
    subtitle: "100% Secure - Your data stays on your device",
    export: "Export Data",
    import: "Import Data",
    search: "Search tasks...",
    all: "All",
    active: "Active",
    completed: "Completed",
    overdue: "Overdue",
    allCats: "All Categories",
    anyPri: "Any Priority",
    high: "Urgent",
    medium: "Medium",
    low: "Normal",
    newest: "Newest",
    oldest: "Oldest",
    dueDate: "By Date",
    byPriority: "By Priority",
    clearDone: "Clear Completed",
    addTask: "Add New Task",
    saveCat: "Save Category",
    notes: "Additional Notes",
    taskTitle: "Task Title",
    category: "Select Category",
    due: "Due Date",
    doneBadge: "Done",
    overdueBadge: "Overdue",
    edit: "Edit",
    del: "Delete",
    save: "Save",
    cancel: "Cancel",
    empty: "No matching tasks found",
    footer: "Developed with ❤️ - Your data stays private",
    lang: "العربية",
    stats: {
      total: "Total Tasks",
      completed: "Completed",
      overdue: "Overdue",
      active: "Active"
    }
  }
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_LANG) || "ar");
  const t = L[lang];
  
  useEffect(() => {
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
  }, [lang]);

  const [tasks, setTasks] = useLocalStorage(STORAGE_KEY, []);
  const [meta, setMeta] = useLocalStorage(STORAGE_META_KEY, { 
    categories: lang === "ar" ? ["عمل", "شخصي", "مشاريع"] : ["Work", "Personal", "Projects"] 
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("created-desc");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => isOverdue(t)).length,
    active: tasks.filter(t => !t.completed).length
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    
    // Filter by status
    if (status === "active") result = result.filter(t => !t.completed);
    if (status === "completed") result = result.filter(t => t.completed);
    if (status === "overdue") result = result.filter(t => isOverdue(t));
    
    // Filter by category
    if (category !== "all") result = result.filter(t => t.category === category);
    
    // Filter by priority
    if (priority !== "all") result = result.filter(t => t.priority === priority);
    
    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.notes || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q)
      );
    }
    
    // Sorting
    switch (sort) {
      case "created-asc":
        result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "created-desc":
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "due-asc":
        result.sort((a, b) => (a.due || "9999-99-99").localeCompare(b.due || "9999-99-99"));
        break;
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
    }
    
    return result;
  }, [tasks, status, category, priority, query, sort]);

  // Task CRUD operations
  const addTask = (task) => {
    const now = new Date().toISOString();
    const newTask = {
      id: uid(),
      title: task.title.trim() || (lang === "ar" ? "مهمة جديدة" : "New Task"),
      notes: task.notes?.trim(),
      category: task.category?.trim(),
      priority: task.priority || "medium",
      due: task.due || undefined,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(task => !task.completed));
  };

  // Import/Export functions
  const exportData = () => {
    const data = { tasks, meta, version: 2, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.tasks)) setTasks(data.tasks);
        if (data.meta?.categories) {
          setMeta(prev => ({
            ...prev,
            categories: Array.from(new Set([...prev.categories, ...data.meta.categories]))
          }));
        }
      } catch {
        alert(t.importError || "Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${lang === "ar" ? "font-arabic" : "font-sans"}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-sm text-gray-600">{t.subtitle}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="btn-secondary px-4 py-2 text-sm"
              >
                {t.lang}
              </button>
              
              <button 
                onClick={exportData}
                className="btn-primary px-4 py-2 text-sm"
              >
                {t.export}
              </button>
              
              <label className="btn-primary px-4 py-2 text-sm cursor-pointer">
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      importData(e.target.files[0]);
                      e.target.value = "";
                    }
                  }} 
                />
                {t.import}
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title={t.stats.total} 
            value={stats.total} 
            icon="📋"
            color="bg-indigo-100 text-indigo-600"
          />
          <StatCard 
            title={t.stats.active} 
            value={stats.active} 
            icon="🔵"
            color="bg-blue-100 text-blue-600"
          />
          <StatCard 
            title={t.stats.completed} 
            value={stats.completed} 
            icon="✅"
            color="bg-green-100 text-green-600"
          />
          <StatCard 
            title={t.stats.overdue} 
            value={stats.overdue} 
            icon="⏰"
            color="bg-red-100 text-red-600"
          />
        </div>

        {/* Add Task Section */}
        <section className="card mb-8">
          <AddTaskForm 
            t={t} 
            categories={meta.categories} 
            onAdd={addTask} 
            onCreateCategory={(cat) => {
              if (cat.trim()) {
                setMeta(prev => ({
                  ...prev,
                  categories: Array.from(new Set([...prev.categories, cat.trim()]))
                }));
              }
            }} 
          />
        </section>

        {/* Filters Section */}
        <section className="card mb-8">
          <Filters 
            t={t}
            query={query}
            setQuery={setQuery}
            status={status}
            setStatus={setStatus}
            category={category}
            setCategory={setCategory}
            priority={priority}
            setPriority={setPriority}
            sort={sort}
            setSort={setSort}
            categories={meta.categories}
            clearCompleted={clearCompleted}
          />
        </section>

        {/* Tasks List */}
        <section>
          <AnimatePresence mode="wait">
            {filteredTasks.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4"
              >
                {filteredTasks.map(task => (
                  <TaskCard 
                    key={task.id}
                    t={t}
                    task={task}
                    onToggle={() => updateTask(task.id, { completed: !task.completed })}
                    onDelete={() => deleteTask(task.id)}
                    onUpdate={(updates) => updateTask(task.id, updates)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card text-center py-12 text-gray-500"
              >
                {t.empty}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          {t.footer}
        </div>
      </footer>
    </div>
  );
}

// Component: StatCard
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`card flex items-center gap-4 ${color} bg-opacity-50`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

// Component: AddTaskForm
function AddTaskForm({ t, categories, onAdd, onCreateCategory }) {
  const [form, setForm] = useState({
    title: "",
    notes: "",
    category: categories[0] || "",
    priority: "medium",
    due: ""
  });
  const titleRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
    onAdd(form);
    setForm({
      title: "",
      notes: "",
      category: categories[0] || "",
      priority: "medium",
      due: ""
    });
    titleRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.taskTitle}</label>
          <input
            ref={titleRef}
            type="text"
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            placeholder={t.taskTitle}
            className="input-field"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
          <div className="flex gap-2">
            <input
              list="categories"
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              placeholder={t.category}
              className="input-field flex-1"
            />
            <datalist id="categories">
              {categories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            <button
              type="button"
              onClick={() => form.category.trim() && onCreateCategory(form.category)}
              className="btn-secondary px-3"
              title={t.saveCat}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.priority}</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({...form, priority: e.target.value})}
            className="input-field"
          >
            <option value="high">{t.high}</option>
            <option value="medium">{t.medium}</option>
            <option value="low">{t.low}</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.due}</label>
          <input
            type="date"
            value={form.due}
            onChange={(e) => setForm({...form, due: e.target.value})}
            min={todayISO()}
            className="input-field"
          />
        </div>
        
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary w-full">
            {t.addTask}
          </button>
          <button
            type="button"
            onClick={() => setForm({
              title: "",
              notes: "",
              category: categories[0] || "",
              priority: "medium",
              due: ""
            })}
            className="btn-secondary px-3 py-2"
          >
            {t.cancel}
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({...form, notes: e.target.value})}
          placeholder={t.notes}
          rows={2}
          className="input-field"
        />
      </div>
    </form>
  );
}

// Component: TaskCard
function TaskCard({ t, task, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    notes: task.notes || "",
    category: task.category || "",
    priority: task.priority,
    due: task.due || ""
  });

  useEffect(() => {
    setEditForm({
      title: task.title,
      notes: task.notes || "",
      category: task.category || "",
      priority: task.priority,
      due: task.due || ""
    });
  }, [task.id]);

  const handleSave = () => {
    onUpdate({
      title: editForm.title.trim(),
      notes: editForm.notes.trim(),
      category: editForm.category.trim() || undefined,
      priority: editForm.priority,
      due: editForm.due || undefined
    });
    setIsEditing(false);
  };

  const priorityClasses = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-green-100 text-green-800 border-green-200"
  };

  const statusClasses = task.completed 
    ? "bg-green-100 text-green-800 border-green-200"
    : isOverdue(task)
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-blue-100 text-blue-800 border-blue-200";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`card ${task.completed ? "opacity-80" : ""}`}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Checkbox */}
        <div className="flex items-start pt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={onToggle}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
        
        {/* Task Content */}
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="input-field"
                placeholder={t.taskTitle}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className="input-field"
                >
                  <option value="high">{t.high}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="low">{t.low}</option>
                </select>
                
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                  className="input-field"
                  placeholder={t.category}
                  list="edit-categories"
                />
                
                <input
                  type="date"
                  value={editForm.due}
                  onChange={(e) => setEditForm({...editForm, due: e.target.value})}
                  className="input-field"
                  min={todayISO()}
                />
              </div>
              
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                className="input-field"
                placeholder={t.notes}
                rows={2}
              />
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn-primary px-3 py-1.5 text-sm"
                >
                  {t.save}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-lg font-semibold ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {task.title}
                </h3>
                
                {task.category && (
                  <span className="badge bg-gray-100 text-gray-800 border-gray-200">
                    {task.category}
                  </span>
                )}
                
                <span className={`badge ${priorityClasses[task.priority]}`}>
                  {t[task.priority]}
                </span>
                
                {task.due && (
                  <span className={`badge ${statusClasses}`}>
                    {t.due}: {task.due}
                  </span>
                )}
                
                {task.completed && (
                  <span className="badge bg-green-100 text-green-800 border-green-200">
                    {t.doneBadge}
                  </span>
                )}
              </div>
              
              {task.notes && (
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {task.notes}
                </p>
              )}
              
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary px-3 py-1.5 text-sm"
                >
                  {t.edit}
                </button>
                <button
                  onClick={onDelete}
                  className="btn-primary bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 text-sm"
                >
                  {t.del}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Custom Hook: useLocalStorage
function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}