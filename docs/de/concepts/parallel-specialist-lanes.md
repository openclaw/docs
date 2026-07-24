---
read_when:
    - Sie leiten Gruppenchats an dedizierte Agenten weiter
    - Sie möchten parallel arbeiten, ohne dass eine langwierige Aufgabe jeden Chat blockiert
    - Sie entwerfen eine Betriebsumgebung mit mehreren Agenten
sidebarTitle: Specialist lanes
status: active
summary: Führen Sie spezialisierte Agents parallel aus, ohne gemeinsam genutzte Modell- und Toolkapazitäten zu blockieren
title: Parallele Spezialisten-Workflows
x-i18n:
    generated_at: "2026-07-24T03:49:23Z"
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
gewährleisten. Parallelität sollte als Entwurfsproblem mit knappen Ressourcen betrachtet werden,
nicht nur als „mehr Agenten“.

## Grundprinzipien

Eine Spezialisten-Lane verbessert den Durchsatz nur, wenn sie die Konkurrenz um die
tatsächlichen Engpässe verringert:

- **Sitzungssperren**: Es sollte jeweils nur ein Lauf eine bestimmte Sitzung verändern.
- **Globale Modellkapazität**: Alle sichtbaren Chat-Läufe teilen sich weiterhin die Provider-Limits.
- **Tool-Kapazität**: Shell-, Browser-, Netzwerk- und Repository-Arbeit kann langsamer sein
  als der Modelldurchlauf selbst.
- **Kontextbudget**: Lange Transkripte machen jeden zukünftigen Durchlauf langsamer und weniger
  fokussiert.
- **Unklare Zuständigkeit**: Doppelte Agenten, die dieselbe Aufgabe erledigen, verschwenden Kapazität.

OpenClaw serialisiert Läufe bereits pro Sitzung und begrenzt die globale Parallelität
über die [Befehlswarteschlange](/de/concepts/queue). Spezialisten-Lanes ergänzen darüber
eine Richtlinie: welcher Agent für welche Arbeit zuständig ist, was im Chat verbleibt und
was zur Hintergrundarbeit wird.

## Empfohlene Einführung

### Phase 1: Lane-Verträge und aufwendige Hintergrundarbeit

Definieren Sie für jede Lane einen schriftlichen Vertrag in ihrem Arbeitsbereich und System-Prompt:

- **Zweck**: die Arbeit, für die diese Lane zuständig ist.
- **Nicht-Ziele**: Arbeit, die sie weitergeben sollte, statt sie selbst zu versuchen.
- **Chat-Budget**: Kurze Antworten bleiben im Chat; lange Aufgaben werden kurz bestätigt
  und anschließend in einem Sub-Agenten oder Task im Hintergrund ausgeführt.
- **Übergaberegel**: Wenn eine andere Lane für die Arbeit zuständig ist, nennen Sie das Ziel
  und stellen Sie eine kompakte Übergabezusammenfassung bereit.
- **Tool-Risikoregel**: Bevorzugen Sie die kleinste Tool-Oberfläche, mit der sich die Aufgabe erledigen lässt.

Dies ist die kostengünstigste Phase und beseitigt die meisten Blockaden: Ein einzelner Programmierauftrag
verwandelt die Recherche-Lane nicht mehr in eine zähe Angelegenheit, und jeder Chat hält seinen eigenen Kontext
übersichtlich.

### Phase 2: Prioritäts- und Parallelitätssteuerung

Passen Sie Warteschlangen- und Modellkapazität an den geschäftlichen Wert jeder Lane an:

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

Verwenden Sie direkte/persönliche Chats und Agenten für den Produktionsbetrieb für Arbeit mit hoher Priorität.
Recherche, Entwürfe und gebündelte Programmierarbeiten sollten in Hintergrund-Tasks verlagert werden, wenn das System
ausgelastet ist.

### Phase 3: Koordinator/Verkehrssteuerung

Fügen Sie ein schlankes Koordinatormuster hinzu, sobald mehrere Lanes aktiv sind:

- Aktive Lane-Tasks und deren Zuständige verfolgen.
- Doppelte Anfragen über mehrere Gruppen hinweg erkennen.
- Übergabezusammenfassungen zwischen Lanes weiterleiten.
- Nur Blockaden, abgeschlossene Ergebnisse und Entscheidungen anzeigen, die ein Mensch treffen muss.

Beginnen Sie nicht damit. Ein Koordinator ohne Lane-Verträge koordiniert lediglich Chaos.

## Minimale Vorlage für einen Lane-Vertrag

```md
# Lane-Vertrag

## Zuständig für

- <job this lane is responsible for>

## Nicht zuständig für

- <work to hand off>

## Chat-Budget

- Kurze Fragen direkt beantworten.
- Bei mehrstufiger, langsamer oder Tool-intensiver Arbeit: kurz bestätigen, die Arbeit
  starten/im Hintergrund ausführen und nach Abschluss das Ergebnis zurückgeben.

## Übergabe

Wenn eine andere Lane für die Anfrage zuständig ist, antworten Sie mit:

- Ziel-Lane
- Zielsetzung
- relevantem Kontext
- exakter nächster Aktion

## Tool-Haltung

Verwenden Sie die kleinste Tool-Oberfläche, mit der sich die Aufgabe abschließen lässt. Vermeiden Sie umfassende Shell-
oder Netzwerkarbeit, sofern diese Lane nicht ausdrücklich dafür zuständig ist.
```

## Verwandte Themen

- [Multi-Agenten-Routing](/de/concepts/multi-agent)
- [Befehlswarteschlange](/de/concepts/queue)
- [Sub-Agenten](/de/tools/subagents)
