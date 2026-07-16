---
read_when:
    - Sie leiten Gruppenchats an dedizierte Agenten weiter
    - Sie möchten parallel arbeiten, ohne dass eine lange Aufgabe jeden Chat blockiert
    - Sie entwerfen eine Betriebsumgebung mit mehreren Agenten
sidebarTitle: Specialist lanes
status: active
summary: Führen Sie spezialisierte Agents parallel aus, ohne gemeinsam genutzte Modell- und Tool-Kapazitäten zu blockieren
title: Parallele Spezialisten-Lanes
x-i18n:
    generated_at: "2026-07-16T12:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Parallele Spezialisten-Lanes ermöglichen es einem Gateway, verschiedene Chats oder Räume an
unterschiedliche Agenten weiterzuleiten und dabei eine schnelle Benutzererfahrung zu
gewährleisten. Behandeln Sie Parallelität als Gestaltungsproblem mit knappen Ressourcen,
nicht nur als „mehr Agenten“.

## Grundprinzipien

Eine Spezialisten-Lane verbessert den Durchsatz nur, wenn sie Konflikte um die
tatsächlichen Engpässe reduziert:

- **Sitzungssperren**: Eine bestimmte Sitzung sollte jeweils nur von einem Lauf verändert werden.
- **Globale Modellkapazität**: Alle sichtbaren Chat-Läufe teilen sich weiterhin die Provider-Limits.
- **Tool-Kapazität**: Shell-, Browser-, Netzwerk- und Repository-Arbeiten können langsamer sein
  als der Modell-Turn selbst.
- **Kontextbudget**: Lange Transkripte machen jeden zukünftigen Turn langsamer und weniger
  fokussiert.
- **Unklare Zuständigkeit**: Doppelte Agenten, die dieselbe Aufgabe erledigen, verschwenden Kapazität.

OpenClaw serialisiert Läufe bereits pro Sitzung und begrenzt die globale Parallelität
über die [Befehlswarteschlange](/de/concepts/queue). Spezialisten-Lanes ergänzen darüber
hinaus Richtlinien: Welcher Agent ist für welche Arbeit zuständig, was bleibt im Chat und
was wird zur Hintergrundarbeit.

## Empfohlene Einführung

### Phase 1: Lane-Verträge und rechenintensive Hintergrundarbeit

Geben Sie jeder Lane einen schriftlichen Vertrag in ihrem Workspace und System-Prompt:

- **Zweck**: die Arbeit, für die diese Lane zuständig ist.
- **Nicht-Ziele**: Arbeit, die sie weitergeben sollte, statt sie selbst zu versuchen.
- **Chatbudget**: Kurze Antworten bleiben im Chat; lange Aufgaben werden kurz bestätigt
  und anschließend in einem Sub-Agenten oder einer Aufgabe im Hintergrund ausgeführt.
- **Übergaberegel**: Wenn eine andere Lane für die Arbeit zuständig ist, geben Sie an, wohin sie gehört,
  und stellen Sie eine kompakte Übergabezusammenfassung bereit.
- **Tool-Risikoregel**: Bevorzugen Sie die kleinste Tool-Oberfläche, mit der sich die Aufgabe erledigen lässt.

Dies ist die kostengünstigste Phase und beseitigt die meisten Blockaden: Ein einzelner Programmierauftrag
macht die Recherche-Lane nicht mehr quälend langsam, und jeder Chat hält seinen eigenen Kontext
übersichtlich.

### Phase 2: Prioritäts- und Parallelitätssteuerung

Stimmen Sie Warteschlangen- und Modellkapazität auf den geschäftlichen Wert der einzelnen Lanes ab:

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

Verwenden Sie direkte/persönliche Chats und Agenten für den Produktionsbetrieb für Aufgaben mit hoher Priorität. Lassen Sie
Recherche, Entwürfe und stapelweise Programmierarbeiten in Hintergrundaufgaben übergehen, wenn das System
ausgelastet ist.

### Phase 3: Koordinator/Verkehrssteuerung

Fügen Sie ein kleines Koordinatormuster hinzu, sobald mehrere Lanes aktiv sind:

- Verfolgen Sie aktive Lane-Aufgaben und deren Zuständige.
- Erkennen Sie doppelte Anfragen über Gruppen hinweg.
- Leiten Sie Übergabezusammenfassungen zwischen Lanes weiter.
- Zeigen Sie nur Blocker, abgeschlossene Ergebnisse und Entscheidungen an, die ein Mensch treffen muss.

Beginnen Sie nicht hier. Ein Koordinator ohne Lane-Verträge koordiniert lediglich Chaos.

## Minimale Vorlage für einen Lane-Vertrag

```md
# Lane-Vertrag

## Zuständig für

- <job this lane is responsible for>

## Nicht zuständig für

- <work to hand off>

## Chatbudget

- Beantworten Sie kurze Fragen direkt.
- Bei mehrstufiger, langsamer oder Tool-intensiver Arbeit: kurz bestätigen, die Arbeit
  in einem Sub-Agenten/im Hintergrund starten und nach Abschluss das Ergebnis zurückgeben.

## Übergabe

Wenn eine andere Lane für die Anfrage zuständig ist, antworten Sie mit:

- Ziel-Lane
- Ziel
- relevantem Kontext
- exakter nächster Aktion

## Tool-Nutzung

Verwenden Sie die kleinste Tool-Oberfläche, mit der sich die Aufgabe abschließen lässt. Vermeiden Sie umfassende Shell-
oder Netzwerkarbeiten, sofern diese Lane nicht ausdrücklich dafür zuständig ist.
```

## Verwandte Themen

- [Multi-Agenten-Routing](/de/concepts/multi-agent)
- [Befehlswarteschlange](/de/concepts/queue)
- [Sub-Agenten](/de/tools/subagents)
