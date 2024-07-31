import highlightCSSText from "data-text:~/contents/highlight.css"
import cssText from "data-text:~/contents/styles.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { CodentCard } from "../components/codent-card"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

type Card = {
  index: number
  question: string
  x: number
  y: number
  toggle: boolean
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText + highlightCSSText
  return style
}
let codentCounter = 0
const CodentButton = (props: { click }) => {
  const [selected, setSelected] = useState(false)
  const [coorinates, setCoorinates] = useState({ x: 0, y: 0 })
  const [selection, setSelection] = useState("")
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().length > 0) {
        setSelection(selection.toString())
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setCoorinates({
          x: rect.right + window.scrollX + 5,
          y: rect.top + window.scrollY + 5
        })
        setSelected(true)
      } else {
        setSelection("")
        setSelected(false)
      }
    }
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return selected ? (
    <button
      id="codent-button"
      className="codent-button absolute"
      style={{
        top: coorinates.y,
        left: coorinates.x
      }}
      onClick={props.click}>
      Codent
    </button>
  ) : (
    <></>
  )
}

const CodentFrame = () => {
  const [cards, setCards] = useState<Card[]>([])
  const addCard = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setCards([
        ...cards,
        {
          index: codentCounter++,
          question: selection.toString(),
          x: rect.right + window.scrollX + 5,
          y: rect.top + window.scrollY + 5,
          toggle: false
        }
      ])
    }
  }
  return (
    <div id="codent-frame" className="codent-frame">
      <CodentButton click={addCard} />
      {cards.map((card, index) => (
        <CodentCard key={index} {...card} />
      ))}
    </div>
  )
}

export default CodentFrame
export { CodentButton }
