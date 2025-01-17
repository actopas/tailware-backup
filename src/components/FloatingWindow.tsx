import ClassTag from "@/components/ClassTag"
import Toast from "@/components/Toast"
import type { FloatingWindowProps } from "@/types"
import {
  applyTailwindStyle,
  identifyTailwindClasses,
  refreshTailwind,
  removeTailwindStyle,
  searchTailwindClasses
} from "@/utils/tailwindUtils"
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions
} from "@headlessui/react"
import React, { useEffect, useMemo, useRef, useState } from "react"

const FloatingWindow: React.FC<FloatingWindowProps> = ({
  element,
  position,
  isFixed,
  onDeactivate,
  onClassChange
}) => {
  const [classes, setClasses] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [autocompleteResults, setAutocompleteResults] = useState<
    { c: string; p: string }[]
  >([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setClasses(identifyTailwindClasses(element))
  }, [element])

  useEffect(() => {
    if (query.trim() === "") {
      setAutocompleteResults([])
    } else {
      const matches = searchTailwindClasses(query)
      setAutocompleteResults(matches)
    }
  }, [query])

  const handleAddClass = (newClass: string | null) => {
    if (!newClass) return
    const trimmedClass = newClass.trim()
    if (trimmedClass === "") return
    if (!classes.includes(trimmedClass)) {
      element.classList.add(trimmedClass)
      applyTailwindStyle(element, trimmedClass)
      setClasses([...classes, trimmedClass])
      onClassChange()
      refreshTailwind()
    }
    setSelectedClass(null)
    setQuery("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleRemoveClass = (classToRemove: string) => {
    element.classList.remove(classToRemove)
    removeTailwindStyle(element, classToRemove)
    setClasses(classes.filter((c) => c !== classToRemove))
    onClassChange()
    refreshTailwind()
  }

  const handleClassToggle = (className: string, isChecked: boolean) => {
    if (isChecked) {
      element.classList.add(className)
      applyTailwindStyle(element, className)
    } else {
      element.classList.remove(className)
      removeTailwindStyle(element, className)
    }
    onClassChange()
    refreshTailwind()
  }

  const handleCopyClasses = () => {
    const classesString = classes.join(" ")
    navigator.clipboard
      .writeText(classesString)
      .then(() => {
        setToastMessage("Classes copied to clipboard!")
      })
      .catch(() => setToastMessage("Failed to copy classes"))
  }

  const handleCopyElement = () => {
    const elementString = element.outerHTML
    navigator.clipboard
      .writeText(elementString)
      .then(() => {
        setToastMessage("Element copied to clipboard!")
      })
      .catch(() => setToastMessage("Failed to copy element"))
  }

  const memoizedClasses = useMemo(() => classes, [classes.join(",")])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && query.trim() !== "") {
      event.preventDefault()
      handleAddClass(query.trim())
    }
  }

  return (
    <div
      className={`floating-window ${
        isFixed ? "pointer-events-auto" : "pointer-events-none"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: isFixed ? "absolute" : "fixed",
        zIndex: 2147483647
      }}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
        <span className="font-bold text-sm">tailware</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopyClasses}
            className="bg-transparent border-none text-gray-300 cursor-pointer p-1 rounded hover:bg-gray-800"
            title="Copy Classes">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button
            onClick={handleCopyElement}
            className="bg-transparent border-none text-gray-300 cursor-pointer p-1 rounded hover:bg-gray-800"
            title="Copy Element">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </button>
          <button
            onClick={onDeactivate}
            className="bg-transparent border-none text-gray-300 cursor-pointer p-1 rounded hover:bg-gray-800"
            title="Deactivate">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className="bg-gray-800 text-gray-300 p-1.5 rounded text-xs mb-2 font-bold">
        {element.tagName.toLowerCase()}
      </div>
      <div className="h-80 overflow-auto">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {memoizedClasses.map((cls) => (
            <ClassTag
              key={cls}
              className={cls}
              element={element}
              onToggle={handleClassToggle}
              onRemove={handleRemoveClass}
            />
          ))}
        </div>
      </div>
      <Combobox
        value={selectedClass}
        onChange={(value: string | null) => {
          if (value) {
            handleAddClass(value)
          }
        }}
        virtual={{
          options: autocompleteResults.map(({ c }) => c)
        }}>
        <div className="relative mt-1">
          <ComboboxInput
            ref={inputRef}
            className="w-full bg-gray-800 text-gray-300 p-1.5 rounded text-xs"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="add classes"
            autoComplete="off"
            spellCheck="false"
          />
          {autocompleteResults.length > 0 && (
            <ComboboxOptions className="absolute bottom-full w-full py-1 mb-1 overflow-auto text-xs bg-gray-900 rounded-md shadow-lg max-h-60 ring-1 ring-gray-700 focus:outline-none">
              {({ option: className }) => {
                const classData = autocompleteResults.find(
                  ({ c }) => c === className
                )
                return (
                  <ComboboxOption
                    key={className}
                    value={className}
                    className={({ active }) =>
                      `group w-full cursor-default select-none relative py-1 px-2 flex items-center justify-between text-xs overflow-hidden ${
                        active ? "bg-gray-700" : "bg-gray-900"
                      }`
                    }>
                    <span className="font-mono text-gray-300 flex-shrink-0">
                      {className}
                    </span>
                    {classData && (
                      <span className="text-gray-500 flex-shrink-0 ml-2 overflow-hidden">
                        <span className="block truncate group-hover:whitespace-nowrap">
                          <span className="inline-block w-full group-hover:animate-marquee">
                            {classData.p}
                          </span>
                        </span>
                      </span>
                    )}
                  </ComboboxOption>
                )
              }}
            </ComboboxOptions>
          )}
        </div>
      </Combobox>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  )
}

export default FloatingWindow
