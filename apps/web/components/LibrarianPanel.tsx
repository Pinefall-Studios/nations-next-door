"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoAnswer } from "../lib/demo-answer";
import type { MapCommand } from "../lib/map-command";
import type { ViewGroup } from "../lib/view";

const SUGGESTIONS = [
  "Who is unreached in Texas?",
  "What resources exist in their language?",
  "Who is unreached in Benin?",
];

type ThreadItem = { role: "ask" | "answer"; text: string; groups: ViewGroup[]; source?: string };

export function LibrarianPanel({
  groups,
  attribution,
  demo,
  onFocus,
  onClose,
  onOpenGroup,
}: {
  groups: ViewGroup[];
  attribution: string;
  demo: boolean;
  onFocus: (command: MapCommand) => void;
  onClose: () => void;
  onOpenGroup: (pgid: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [lookingDemo, setLookingDemo] = useState(false);
  const lastMap = useRef<string>("");
  const latest = useRef<HTMLElement | null>(null);

  const live = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const liveText = useMemo(() => {
    const items: ThreadItem[] = [];
    for (const message of live.messages) {
      if (message.role === "user") {
        const text = message.parts?.find((part) => part.type === "text");
        items.push({ role: "ask", text: text && "text" in text ? text.text : "", groups: [] });
        continue;
      }
      const texts = (message.parts ?? [])
        .filter((part) => part.type === "text" && "text" in part)
        .map((part) => ("text" in part ? part.text : ""));
      const toolGroups: ViewGroup[] = [];
      for (const part of message.parts ?? []) {
        if (part.type === "tool-showOnMap" && "output" in part && part.output && typeof part.output === "object") {
          const output = part.output as { map?: MapCommand; groups?: Array<{ pgid: string }> };
          for (const item of output.groups ?? []) {
            const found = groups.find((group) => group.pgid === item.pgid);
            if (found) toolGroups.push(found);
          }
        }
      }
      items.push({ role: "answer", text: texts.join("\n"), groups: toolGroups, source: attribution });
    }
    return items;
  }, [live.messages, groups, attribution]);

  useEffect(() => {
    for (const message of live.messages) {
      for (const part of message.parts ?? []) {
        if (part.type !== "tool-showOnMap" || !("output" in part) || !part.output || typeof part.output !== "object") continue;
        const output = part.output as { map?: MapCommand };
        if (!output.map) continue;
        const key = JSON.stringify(output.map);
        if (key === lastMap.current) continue;
        lastMap.current = key;
        onFocus(output.map);
      }
    }
  }, [live.messages, onFocus]);

  const items = demo ? thread : liveText;
  const looking = lookingDemo || (!demo && (live.status === "submitted" || live.status === "streaming"));

  useEffect(() => {
    latest.current?.scrollIntoView({ block: "start" });
  }, [items, looking]);

  function ask(text: string) {
    const question = text.trim();
    if (!question) return;
    setDraft("");
    if (demo) {
      const reply = demoAnswer(question, groups, attribution);
      setLookingDemo(true);
      if (reply.map) onFocus(reply.map);
      window.setTimeout(() => {
        setThread((current) => [
          ...current,
          { role: "ask", text: question, groups: [] },
          { role: "answer", text: reply.text, groups: reply.groups, source: attribution },
        ]);
        setLookingDemo(false);
      }, 280);
      return;
    }
    live.sendMessage({ text: question });
  }

  useEffect(() => {
    lastMap.current = "";
  }, [demo]);

  return (
    <aside className="librarian" aria-label="Ask the librarian">
      <header>
        <div>
          <h2>Ask the librarian</h2>
          <p className="demo-note">{demo ? "Demo mode. Answers are written from this set, not a live model." : "Live model."}</p>
        </div>
        <button type="button" className="btn secondary" onClick={onClose}>Close</button>
      </header>
      <div className="thread">
        {items.length === 0 ? (
          <div className="suggestions">
            {SUGGESTIONS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>
            ))}
          </div>
        ) : null}
        {items.map((entry, index) => (
          <article
            key={`${entry.role}-${index}`}
            className={entry.role === "ask" ? "bubble ask" : "bubble"}
            ref={index === items.length - 1 && entry.role === "answer" ? (node) => { latest.current = node; } : undefined}
          >
            {entry.role === "answer" ? <p>{entry.text.split("\n")[0]}</p> : entry.text}
            {entry.groups.map((group) => (
              <button key={group.pgid} type="button" className="mini-card" onClick={() => onOpenGroup(group.pgid)}>
                <strong>{group.name}</strong>
                <span>{group.country}{group.usStates.length ? ` · ${group.usStates.join(", ")}` : ""}</span>
              </button>
            ))}
            {entry.role === "answer" ? <p className="source-line">Source: {entry.source ?? attribution}</p> : null}
          </article>
        ))}
        {looking ? (
          <p className="demo-note looking" ref={(node) => { latest.current = node; }}>Looking…</p>
        ) : null}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
      >
        <input
          type="text"
          value={draft}
          placeholder="Ask about a place or language"
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Question"
        />
        <button className="btn" type="submit">Send</button>
      </form>
    </aside>
  );
}
