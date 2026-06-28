---
read_when:
    - Sie möchten persistente Memory, die sitzungs- und kanalübergreifend funktioniert
    - Sie möchten KI-gestützten Recall und Benutzermodellierung
summary: KI-native sitzungsübergreifende Memory über das Honcho-Plugin
title: Honcho Memory
x-i18n:
    generated_at: "2026-04-24T06:34:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
    postprocess_version: locale-links-v1
---

[Honcho](https://honcho.dev) ergänzt OpenClaw um KI-native Memory. Es persistiert
Unterhaltungen in einen dedizierten Dienst und erstellt im Laufe der Zeit Benutzer- und Agentenmodelle,
wodurch Ihr Agent sitzungsübergreifenden Kontext erhält, der über Markdown-Dateien im
Workspace hinausgeht.

## Was es bereitstellt

- **Sitzungsübergreifende Memory** -- Unterhaltungen werden nach jedem Turn persistiert, sodass
  Kontext über Sitzungsresets, Compaction und Kanalwechsel hinweg erhalten bleibt.
- **Benutzermodellierung** -- Honcho verwaltet ein Profil für jeden Benutzer (Präferenzen,
  Fakten, Kommunikationsstil) und für den Agenten (Persönlichkeit, gelernte
  Verhaltensweisen).
- **Semantische Suche** -- Suche über Beobachtungen aus früheren Unterhaltungen, nicht
  nur über die aktuelle Sitzung.
- **Multi-Agent-Bewusstsein** -- Parent-Agenten verfolgen automatisch gestartete
  Sub-Agenten, wobei Parent-Agenten als Beobachter in Child-Sitzungen hinzugefügt werden.

## Verfügbare Tools

Honcho registriert Tools, die der Agent während der Unterhaltung verwenden kann:

**Datenabruf (schnell, kein LLM-Aufruf):**

| Tool                        | Funktion                                               |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | Vollständige Benutzerrepräsentation über Sitzungen hinweg |
| `honcho_search_conclusions` | Semantische Suche über gespeicherte Schlussfolgerungen |
| `honcho_search_messages`    | Nachrichten sitzungsübergreifend finden (nach Absender, Datum filtern) |
| `honcho_session`            | Verlauf und Zusammenfassung der aktuellen Sitzung      |

**Fragen und Antworten (LLM-gestützt):**

| Tool         | Funktion                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Fragen zum Benutzer stellen. `depth='quick'` für Fakten, `'thorough'` für Synthese |

## Erste Schritte

Installieren Sie das Plugin und führen Sie die Einrichtung aus:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Der Einrichtungsbefehl fordert Sie zur Eingabe Ihrer API-Anmeldedaten auf, schreibt die Konfiguration und
migriert optional vorhandene Memory-Dateien des Workspace.

<Info>
Honcho kann vollständig lokal (self-hosted) oder über die verwaltete API unter
`api.honcho.dev` ausgeführt werden. Für die self-hosted-Option sind keine externen Abhängigkeiten erforderlich.
</Info>

## Konfiguration

Die Einstellungen befinden sich unter `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // für self-hosted weglassen
          workspaceId: "openclaw", // Memory-Isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Für self-hosted-Instanzen setzen Sie `baseUrl` auf Ihren lokalen Server (zum Beispiel
`http://localhost:8000`) und lassen den API-Key weg.

## Vorhandene Memory migrieren

Wenn Sie bereits Memory-Dateien im Workspace haben (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), erkennt `openclaw honcho setup` diese und
bietet ihre Migration an.

<Info>
Die Migration ist nicht destruktiv -- Dateien werden zu Honcho hochgeladen. Originale werden
niemals gelöscht oder verschoben.
</Info>

## So funktioniert es

Nach jedem KI-Turn wird die Unterhaltung in Honcho persistiert. Sowohl Benutzer- als auch
Agentennachrichten werden beobachtet, sodass Honcho seine Modelle im Laufe der Zeit aufbauen und verfeinern kann.

Während der Unterhaltung fragen Honcho-Tools den Dienst in der Phase `before_prompt_build` ab
und injizieren relevanten Kontext, bevor das Modell den Prompt sieht. Dies stellt
genaue Turn-Grenzen und relevanten Recall sicher.

## Honcho vs. integrierte Memory

|                   | Integriert / QMD              | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Speicherung**   | Markdown-Dateien im Workspace | Dedizierter Dienst (lokal oder gehostet) |
| **Sitzungsübergreifend** | Über Memory-Dateien     | Automatisch, integriert             |
| **Benutzermodellierung** | Manuell (in `MEMORY.md` schreiben) | Automatische Profile         |
| **Suche**         | Vektor + Keyword (hybrid)     | Semantisch über Beobachtungen       |
| **Multi-Agent**   | Nicht verfolgt                | Bewusstsein für Parent/Child        |
| **Abhängigkeiten**| Keine (integriert) oder QMD-Binärdatei | Plugin-Installation           |

Honcho und das integrierte Memory-System können zusammenarbeiten. Wenn QMD konfiguriert ist,
werden zusätzliche Tools verfügbar, um lokale Markdown-Dateien neben Honchos sitzungsübergreifender Memory zu durchsuchen.

## CLI-Befehle

```bash
openclaw honcho setup                        # API-Key konfigurieren und Dateien migrieren
openclaw honcho status                       # Verbindungsstatus prüfen
openclaw honcho ask <question>               # Honcho zum Benutzer befragen
openclaw honcho search <query> [-k N] [-d D] # Semantische Suche über Memory
```

## Weiterführende Informationen

- [Plugin-Quellcode](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho-Dokumentation](https://docs.honcho.dev)
- [Integrationsleitfaden für Honcho in OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/de/concepts/memory) -- Überblick über OpenClaw Memory
- [Context Engines](/de/concepts/context-engine) -- wie pluginbasierte Context Engines funktionieren

## Verwandt

- [Memory-Überblick](/de/concepts/memory)
- [Integrierte Memory-Engine](/de/concepts/memory-builtin)
- [QMD-Memory-Engine](/de/concepts/memory-qmd)
