---
read_when:
    - Sie leiten Gruppenchats an dedizierte Agenten weiter
    - Sie möchten parallel arbeiten, ohne dass eine lange Aufgabe jede Unterhaltung blockiert
    - Sie entwerfen ein Multi-Agenten-Betriebssetup
sidebarTitle: Specialist lanes
status: active
summary: Parallele Spezialagenten ausführen, ohne gemeinsam genutzte Modell- und Tool-Kapazität zu blockieren
title: Parallele Spezialistenpfade
x-i18n:
    generated_at: "2026-05-10T19:32:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Parallele Spezialisten-Lanes ermöglichen es einem Gateway, verschiedene Chats oder Räume an
verschiedene Agenten weiterzuleiten und dabei die Benutzererfahrung schnell zu
halten. Der entscheidende Punkt ist, Parallelität als Designproblem für knappe
Ressourcen zu behandeln, nicht nur als „mehr Agenten“.

## Grundprinzipien

Eine Spezialisten-Lane verbessert den Durchsatz nur, wenn sie Konflikte um die
eigentlichen Engpässe reduziert:

- **Session-Sperren**: Es sollte immer nur ein Lauf eine bestimmte Session gleichzeitig ändern.
- **Globale Modellkapazität**: Alle sichtbaren Chat-Läufe teilen sich weiterhin die Provider-Limits.
- **Tool-Kapazität**: Shell-, Browser-, Netzwerk- und Repository-Arbeit kann langsamer sein
  als der Modellschritt selbst.
- **Kontextbudget**: Lange Transkripte machen jede zukünftige Runde langsamer und weniger
  fokussiert.
- **Unklare Zuständigkeit**: Doppelte Agenten, die dieselbe Aufgabe erledigen, verschwenden Kapazität.

OpenClaw serialisiert Läufe bereits pro Session und begrenzt die globale Parallelität über
die [Befehlswarteschlange](/de/concepts/queue). Spezialisten-Lanes ergänzen darüber eine Policy:
welcher Agent welche Arbeit besitzt, was im Chat bleibt und was zu Hintergrundarbeit
wird.

## Empfohlener Rollout

### Phase 1: Lane-Verträge + umfangreiche Hintergrundarbeit

Geben Sie jeder Lane einen schriftlichen Vertrag in ihrem Workspace und System-Prompt:

- **Zweck**: die Arbeit, für die diese Lane zuständig ist.
- **Nicht-Ziele**: Arbeit, die sie weitergeben sollte, statt sie selbst zu versuchen.
- **Chatbudget**: Schnelle Antworten bleiben im Chat; lange Aufgaben sollten kurz bestätigt
  und dann in einem Hintergrund-Sub-Agent oder einer Aufgabe ausgeführt werden.
- **Übergaberegel**: Wenn eine andere Lane für die Arbeit zuständig ist, sagen Sie, wohin sie gehen sollte, und
  geben Sie eine kompakte Übergabezusammenfassung.
- **Tool-Risikoregel**: Bevorzugen Sie die kleinste Tool-Oberfläche, die die Aufgabe erledigen kann.

Dies ist die günstigste Phase und behebt die meisten Blockaden: Ein Coding-Job macht
die Research-Lane nicht mehr zäh, und jeder Chat hält seinen eigenen Kontext sauber.

### Phase 2: Prioritäts- und Nebenläufigkeitssteuerung

Stimmen Sie Warteschlange und Modellkapazität auf den geschäftlichen Wert jeder Lane ab:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Verwenden Sie direkte/persönliche Chats und Production-Ops-Agenten für Arbeit mit hoher Priorität. Lassen Sie
Recherche, Entwürfe und Batch-Coding in Hintergrundaufgaben wechseln, wenn das System
ausgelastet ist.

### Phase 3: Koordinator / Traffic-Controller

Fügen Sie ein kleines Koordinatormuster hinzu, sobald mehrere Lanes aktiv sind:

- Aktive Lane-Aufgaben und Zuständige nachverfolgen.
- Doppelte Anfragen über Gruppen hinweg erkennen.
- Übergabezusammenfassungen zwischen Lanes weiterleiten.
- Nur Blocker, abgeschlossene Ergebnisse und Entscheidungen anzeigen, die der Mensch treffen muss.

Beginnen Sie nicht hier. Ein Koordinator ohne Lane-Verträge koordiniert nur Chaos.

## Minimale Vorlage für Lane-Verträge

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Verwandte Themen

- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Befehlswarteschlange](/de/concepts/queue)
- [Sub-Agents](/de/tools/subagents)
