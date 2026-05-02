---
read_when:
    - Sie leiten Gruppenchats an dedizierte Agenten weiter
    - Sie möchten parallel arbeiten, ohne dass eine lange Aufgabe jeden Chat blockiert
    - Sie entwerfen eine Multi-Agenten-Betriebsumgebung
sidebarTitle: Specialist lanes
status: active
summary: Parallele spezialisierte Agenten ausführen, ohne gemeinsam genutzte Modell- und Tool-Kapazitäten zu blockieren
title: Parallele Fachspuren
x-i18n:
    generated_at: "2026-05-02T20:45:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Parallele Spezialisten-Lanes ermöglichen es einem Gateway, verschiedene Chats oder Räume an verschiedene Agenten weiterzuleiten und dabei die Benutzererfahrung schnell zu halten. Entscheidend ist, Parallelität als Designproblem für knappe Ressourcen zu behandeln, nicht nur als „mehr Agenten“.

## Grundprinzipien

Eine Spezialisten-Lane verbessert den Durchsatz nur, wenn sie die Konkurrenz um die
eigentlichen Engpässe reduziert:

- **Sitzungssperren**: Nur ein Lauf sollte jeweils eine bestimmte Sitzung verändern.
- **Globale Modellkapazität**: Alle sichtbaren Chat-Läufe teilen sich weiterhin die Provider-Limits.
- **Tool-Kapazität**: Shell-, Browser-, Netzwerk- und Repository-Arbeit kann langsamer sein
  als die Modellrunde selbst.
- **Kontextbudget**: Lange Transkripte machen jede zukünftige Runde langsamer und weniger
  fokussiert.
- **Unklare Zuständigkeit**: Doppelte Agenten, die dieselbe Aufgabe erledigen, verschwenden Kapazität.

OpenClaw serialisiert Läufe bereits pro Sitzung und begrenzt die globale Parallelität über
die [Befehlswarteschlange](/de/concepts/queue). Spezialisten-Lanes fügen darüber eine Richtlinie hinzu:
welcher Agent welche Arbeit besitzt, was im Chat bleibt und was zur Hintergrundarbeit wird.

## Empfohlene Einführung

### Phase 1: Lane-Verträge + schwere Hintergrundarbeit

Geben Sie jeder Lane einen schriftlichen Vertrag in ihrem Arbeitsbereich und System-Prompt:

- **Zweck**: die Arbeit, für die diese Lane zuständig ist.
- **Nicht-Ziele**: Arbeit, die sie weitergeben sollte, statt sie selbst zu versuchen.
- **Chat-Budget**: Schnelle Antworten bleiben im Chat; lange Aufgaben sollten kurz bestätigt
  und dann in einem Hintergrund-Sub-Agent oder einer Aufgabe ausgeführt werden.
- **Übergaberegel**: Wenn eine andere Lane für die Arbeit zuständig ist, sagen Sie, wohin sie gehen sollte,
  und liefern Sie eine kompakte Übergabezusammenfassung.
- **Tool-Risikoregel**: Bevorzugen Sie die kleinste Tool-Oberfläche, die die Aufgabe erledigen kann.

Dies ist die günstigste Phase und behebt die meisten Verstopfungen: Ein Coding-Auftrag macht
die Research-Lane nicht mehr zähflüssig, und jeder Chat hält seinen eigenen Kontext sauber.

### Phase 2: Prioritäts- und Parallelitätssteuerung

Stimmen Sie Warteschlange und Modellkapazität auf den geschäftlichen Wert jeder Lane ab:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
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

Nutzen Sie direkte/persönliche Chats und Produktions-Ops-Agenten für Arbeit mit hoher Priorität. Lassen Sie
Recherche, Entwürfe und Batch-Coding in Hintergrundaufgaben wechseln, wenn das System
ausgelastet ist.

### Phase 3: Koordinator / Traffic-Controller

Fügen Sie ein kleines Koordinator-Muster hinzu, sobald mehrere Lanes aktiv sind:

- Aktive Lane-Aufgaben und Zuständige nachverfolgen.
- Doppelte Anfragen über Gruppen hinweg erkennen.
- Übergabezusammenfassungen zwischen Lanes weiterleiten.
- Nur Blocker, abgeschlossene Ergebnisse und Entscheidungen anzeigen, die ein Mensch treffen muss.

Beginnen Sie nicht hier. Ein Koordinator ohne Lane-Verträge koordiniert nur Chaos.

## Minimale Vorlage für einen Lane-Vertrag

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
- [Sub-Agenten](/de/tools/subagents)
