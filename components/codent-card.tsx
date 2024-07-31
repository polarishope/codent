import { error } from "console"
import hljs from "highlight.js"
import { Marked } from "marked"
import { markedHighlight } from "marked-highlight"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useRef, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Replace with your OpenAI API key
const openaiKey = "openai-key"
const model = "gpt-3.5-turbo"
const openaiBaseUrl = "https://api.openai.com/v1/chat/completions"
const prompt =
  "你是一个AI编程助手，帮助用户解读代码，给出代码的详细解释。输出纯文本格式，不要输出Markdown格式。"
const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext"
      return hljs.highlight(code, { language }).value
    }
  })
)

function CodentToggleButton(props: { click; toggle: boolean }) {
  return (
    <button
      id="codent-toggle-button${codentId}"
      className="codent-toggle-button"
      onClick={props.click}>
      {props.toggle ? "▼" : "▲"}
    </button>
  )
}
function CodentCloseButton(props: { click }) {
  return (
    <button
      id="codent-close-button${codentId}"
      className="codent-close-button"
      onClick={props.click}>
      ✖
    </button>
  )
}
function CodentCard(props: {
  index: number
  question: string
  x: number
  y: number
  toggle: boolean
}) {
  const [answer, setAnswer] = useState("")
  const [toggle, setToggle] = useState(false)
  const [closed, setClosed] = useState(false)
  const [coordinates, setcoordinates] = useState({
    x: props.x,
    y: props.y
  })
  const codentCardRef = useRef(null)
  const codentAnswerRef = useRef(null)
  async function queryCodent(query: string) {
    try {
      const request_body = {
        model: `${model}`,
        messages: [
          {
            role: "system",
            content: `${prompt}`
          },
          {
            role: "user",
            content: `${query}`
          }
        ],
        stream: true
      }
      const response = await fetch(`${openaiBaseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify(request_body)
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let fullAnswer = ""
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.trim()) {
              const jsonStr = line.replace(/^data: /, "")
              if (jsonStr !== `[DONE]`) {
                const chunk_json =
                  JSON.parse(jsonStr)["choices"][0]["delta"]["content"]

                if (chunk_json) {
                  fullAnswer += chunk_json
                  const markedAnswer = marked.parse(fullAnswer)
                  if (typeof markedAnswer !== "string")
                    throw error("markedAnswer is not a string")
                  setAnswer(markedAnswer)
                  codentAnswerRef.current.innerHTML = markedAnswer
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Codent query error: ", error)
      setAnswer("查询出错，请稍后再试。")
      codentAnswerRef.current.innerHTML = "查询出错，请稍后再试。"
    }
  }

  useEffect(() => {
    let isDragging = false
    let startX, startY, initialX, initialY
    function onMouseMove(e) {
      if (!isDragging) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      setcoordinates({ x: initialX + dx, y: initialY + dy })
    }

    function onMouseUp() {
      isDragging = false
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
    if (codentCardRef && codentCardRef.current) {
      codentCardRef.current.addEventListener("mousedown", (e) => {
        isDragging = true
        startX = e.clientX
        startY = e.clientY
        initialX = coordinates.x
        initialY = coordinates.y
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
      })
    }
  }, [])

  useEffect(() => {
    if (props.question) {
      queryCodent(props.question)
    }
  }, [])

  return props.question && !closed ? (
    <div
      id="codent-card${codentId}"
      className="codent-card"
      style={{
        top: `${coordinates.y}px`,
        left: `${coordinates.x}px`
      }}>
      <div
        ref={codentCardRef}
        id="codent-card-button-container${codentId}"
        className="codent-card-title no-select">
        <CodentToggleButton
          click={() => {
            setToggle(!toggle)
          }}
          toggle={toggle}
        />
        <h3 className="codent-card-title-text">Codent {props.index}</h3>
        <CodentCloseButton
          click={() => {
            setClosed(true)
          }}
        />
      </div>

      {toggle ? (
        <></>
      ) : (
        <div>
          <p id="codent-content${codentId}" className="codent">
            {props.question}
          </p>
          <div ref={codentAnswerRef}></div>
        </div>
      )}
    </div>
  ) : (
    <></>
  )
}

export { CodentToggleButton, CodentCard }
