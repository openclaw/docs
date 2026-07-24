---
read_when:
    - Sie benötigen einen persistenten Speicher, der sitzungs- und kanalübergreifend funktioniert
    - Sie möchten KI-gestütztes Erinnerungsvermögen und Nutzermodellierung
summary: KI-nativer sitzungsübergreifender Speicher über das Honcho-Plugin
title: Honcho-Speicher
x-i18n:
    generated_at: "2026-07-24T03:46:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) erweitert OpenClaw über ein externes Plugin um KI-nativen Speicher. Es speichert Unterhaltungen dauerhaft in einem dedizierten Dienst und erstellt im Laufe der Zeit Benutzer- und Agentenmodelle. Dadurch erhält Ihr Agent sitzungsübergreifenden Kontext, der über Markdown-Dateien im Arbeitsbereich hinausgeht.

## Funktionsumfang

- **Sitzungsübergreifender Speicher** – Unterhaltungen bleiben nach jedem Durchlauf erhalten, sodass der Kontext Sitzungszurücksetzungen, Compaction und Kanalwechsel überdauert.
- **Benutzermodellierung** – Honcho verwaltet ein Profil für jeden Benutzer (Präferenzen, Fakten, Kommunikationsstil) und für den Agenten (Persönlichkeit, erlernte Verhaltensweisen).
- **Semantische Suche** – Suche in Erkenntnissen aus früheren Unterhaltungen, nicht nur in der aktuellen Sitzung.
- **Multi-Agenten-Bewusstsein** – Übergeordnete Agenten verfolgen automatisch erzeugte Unteragenten und werden in untergeordneten Sitzungen als Beobachter hinzugefügt.

## Verfügbare Tools

Honcho registriert Tools, die der Agent während einer Unterhaltung verwenden kann:

**Datenabruf (schnell, kein LLM-Aufruf):**

| Tool                        | Funktion                                               |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | Vollständige Benutzerdarstellung über Sitzungen hinweg |
| `honcho_search_conclusions` | Semantische Suche in gespeicherten Schlussfolgerungen  |
| `honcho_search_messages`    | Nachrichten sitzungsübergreifend finden (nach Absender und Datum filtern) |
| `honcho_session`            | Verlauf und Zusammenfassung der aktuellen Sitzung      |

**Fragen und Antworten (LLM-gestützt):**

| Tool         | Funktion                                                                  |
| ------------ | ------------------------------------------------------------------------- |
| `honcho_ask` | Fragen über den Benutzer stellen. `depth='quick'` für Fakten, `'thorough'` für Synthesen |

## Erste Schritte

Installieren Sie das Plugin und führen Sie die Einrichtung aus:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Der Einrichtungsbefehl fragt Ihre API-Anmeldedaten ab, schreibt die Konfiguration und migriert optional vorhandene Speicherdateien des Arbeitsbereichs.

<Info>
Honcho kann vollständig lokal (selbst gehostet) oder über die verwaltete API unter
`api.honcho.dev` ausgeführt werden. Für die selbst gehostete Option sind keine externen Abhängigkeiten erforderlich.
</Info>

## Konfiguration

Die Einstellungen befinden sich unter `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // für selbst gehostete Instanzen weglassen
          workspaceId: "openclaw", // Speicherisolierung
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Richten Sie für selbst gehostete Instanzen `baseUrl` auf Ihren lokalen Server (zum Beispiel
`http://localhost:8000`) und lassen Sie den API-Schlüssel weg.

## Vorhandenen Speicher migrieren

Wenn Sie über vorhandene Speicherdateien im Arbeitsbereich verfügen (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), erkennt `openclaw honcho setup` diese und
bietet ihre Migration an.

<Info>
Die Migration ist nicht destruktiv – Dateien werden zu Honcho hochgeladen. Die Originale werden
niemals gelöscht oder verschoben.
</Info>

## Funktionsweise

Nach jedem KI-Durchlauf wird die Unterhaltung dauerhaft in Honcho gespeichert. Sowohl Benutzer- als auch Agentennachrichten werden erfasst, sodass Honcho seine Modelle im Laufe der Zeit erstellen und verfeinern kann.

Während der Unterhaltung fragen Honcho-Tools den Dienst über den Plugin-Hook
`before_prompt_build` von OpenClaw ab und fügen relevanten Kontext ein, bevor das Modell
den Prompt erhält.

## Honcho im Vergleich zum integrierten Speicher

|                   | Integriert / QMD             | Honcho                              |
| ----------------- | ---------------------------- | ----------------------------------- |
| **Speicher**      | Markdown-Dateien im Arbeitsbereich | Dedizierter Dienst (lokal oder gehostet) |
| **Sitzungsübergreifend** | Über Speicherdateien   | Automatisch, integriert             |
| **Benutzermodellierung** | Manuell (in MEMORY.md schreiben) | Automatische Profile          |
| **Suche**         | Vektor + Schlüsselwort (hybrid) | Semantisch über Erkenntnisse     |
| **Multi-Agenten** | Werden nicht verfolgt        | Bewusstsein für übergeordnete/untergeordnete Agenten |
| **Abhängigkeiten** | Keine (integriert) oder QMD-Binärdatei | Plugin-Installation        |

Honcho und das integrierte Speichersystem können zusammenarbeiten. Wenn QMD konfiguriert ist, stehen zusätzliche Tools zur Suche in lokalen Markdown-Dateien neben Honchos sitzungsübergreifendem Speicher zur Verfügung.

## CLI-Befehle

```bash
openclaw honcho setup                        # API-Schlüssel konfigurieren und Dateien migrieren
openclaw honcho status                       # Verbindungsstatus prüfen
openclaw honcho ask <question>               # Honcho zum Benutzer befragen
openclaw honcho search <query> [-k N] [-d D] # Semantische Suche im Speicher
```

## Weiterführende Informationen

- [Plugin-Quellcode](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho-Dokumentation](https://docs.honcho.dev)
- [Honcho-Integrationsleitfaden für OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin)
- [QMD-Speicher-Engine](/de/concepts/memory-qmd)
- [Kontext-Engines](/de/concepts/context-engine)
