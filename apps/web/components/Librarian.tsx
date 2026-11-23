"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { demoAnswer } from "../lib/demo-answer";
import type { ViewGroup } from "../lib/view";

const SUGGESTIONS = [
  "Who is unreached in Texas?",
  "What resources exist in their language?",
  "Who is unreached in Benin?",
];

export function Librarian({
  groups,
  attribution,
  demo,
  initialOpen = false,
  closeHref,
}: {
  groups: ViewGroup[];
  attribution: string;
  demo: boolean;
  initialOpen?: boolean;
  closeHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<{ role: "ask" | "answer"; text: string }[]>(
    initialOpen
      ? [
          { role: "ask", text: SUGGESTIONS[0] ?? "" },
          { role: "answer", text: demoAnswer(SUGGESTIONS[0] ?? "", groups, attribution) },
        ]
      : [],
  );

  function ask(text: string) {
    const question = text.trim();
    if (!question) return;
    const answer = demo
      ? demoAnswer(question, groups, attribution)
      : "A live model key is configured, but this concept panel still answers from the sample set until the gateway path is reviewed.";
    setThread((current) => [...current, { role: "ask", text: question }, { role: "answer", text: answer }]);
    setDraft("");
  }

  function close() {
    setOpen(false);
    if (closeHref) router.replace(closeHref, { scroll: false });
  }

  return (
    <>
      {open ? (
        <>
          <button type="button" className="drawer-scrim" aria-label="Close librarian" onClick={close} />
          <aside className="drawer" role="dialog" aria-label="Ask the librarian">
            <header>
              <div>
                <h2>Ask the librarian</h2>
                <p className="demo-note">{demo ? "Demo mode. Answers are written from the sample set, not a live model." : "Live model."}</p>
              </div>
              <button type="button" className="btn secondary" onClick={close}>Close</button>
            </header>
            <div className="thread">
              {thread.length === 0 ? (
                <div className="suggestions">
                  {SUGGESTIONS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>
                  ))}
                </div>
              ) : null}
              {thread.map((entry, index) => (
                <article key={`${entry.role}-${index}`} className={entry.role === "ask" ? "bubble ask" : "bubble"}>
                  {entry.text}
                </article>
              ))}
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
        </>
      ) : null}
    </>
  );
}
