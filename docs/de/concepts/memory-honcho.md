---
read_when:
    - Sie möchten einen dauerhaften Speicher, der sitzungs- und kanalübergreifend funktioniert
    - Sie wünschen KI-gestütztes Erinnerungsvermögen und Benutzermodellierung
summary: KI-natives sitzungsübergreifendes Gedächtnis über das Honcho-Plugin
title: Honcho-Speicher
x-i18n:
    generated_at: "2026-07-12T01:32:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) erweitert OpenClaw über ein externes Plugin um KI-native Speicherfunktionen. Es speichert Unterhaltungen dauerhaft in einem dedizierten Dienst und erstellt im Laufe der Zeit Benutzer- und Agentenmodelle. Dadurch erhält Ihr Agent sitzungsübergreifenden Kontext, der über Markdown-Dateien im Arbeitsbereich hinausgeht.

## Bereitgestellte Funktionen

- **Sitzungsübergreifender Speicher** – Unterhaltungen werden nach jedem Austausch dauerhaft gespeichert, sodass der Kontext auch nach dem Zurücksetzen von Sitzungen, nach Compaction und beim Wechsel des Kanals erhalten bleibt.
- **Benutzermodellierung** – Honcho verwaltet ein Profil für jeden Benutzer (Präferenzen, Fakten, Kommunikationsstil) sowie für den Agenten (Persönlichkeit, erlernte Verhaltensweisen).
- **Semantische Suche** – Durchsuchen Sie Beobachtungen aus früheren Unterhaltungen, nicht nur aus der aktuellen Sitzung.
- **Agentenübergreifende Übersicht** – Übergeordnete Agenten verfolgen automatisch gestartete Unteragenten und werden in deren Sitzungen als Beobachter hinzugefügt.

## Verfügbare Werkzeuge

Honcho registriert Werkzeuge, die der Agent während der Unterhaltung verwenden kann:

**Datenabruf (schnell, kein LLM-Aufruf):**

| Werkzeug                    | Funktion                                                        |
| --------------------------- | --------------------------------------------------------------- |
| `honcho_context`            | Vollständige Benutzerdarstellung über mehrere Sitzungen hinweg  |
| `honcho_search_conclusions` | Semantische Suche in gespeicherten Schlussfolgerungen           |
| `honcho_search_messages`    | Sitzungsübergreifende Nachrichtensuche (nach Absender, Datum)    |
| `honcho_session`            | Verlauf und Zusammenfassung der aktuellen Sitzung               |

**Fragen und Antworten (LLM-gestützt):**

| Werkzeug     | Funktion                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `honcho_ask` | Fragen zum Benutzer stellen. `depth='quick'` für Fakten, `'thorough'` für umfassende Auswertungen |

## Erste Schritte

Installieren Sie das Plugin und führen Sie die Einrichtung aus:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Der Einrichtungsbefehl fragt Ihre API-Anmeldedaten ab, schreibt die Konfiguration und migriert optional vorhandene Speicherdateien aus dem Arbeitsbereich.

<Info>
Honcho kann vollständig lokal (selbst gehostet) oder über die verwaltete API unter `api.honcho.dev` ausgeführt werden. Für die selbst gehostete Variante sind keine externen Abhängigkeiten erforderlich.
</Info>

## Konfiguration

Die Einstellungen befinden sich unter `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Legen Sie für selbst gehostete Instanzen unter `baseUrl` die Adresse Ihres lokalen Servers fest (beispielsweise `http://localhost:8000`) und lassen Sie den API-Schlüssel weg.

## Vorhandenen Speicher migrieren

Wenn in Ihrem Arbeitsbereich bereits Speicherdateien (`USER.md`, `MEMORY.md`, `IDENTITY.md`, `memory/`, `canvas/`) vorhanden sind, erkennt `openclaw honcho setup` diese und bietet ihre Migration an.

<Info>
Die Migration ist nicht destruktiv – die Dateien werden zu Honcho hochgeladen. Die Originale werden weder gelöscht noch verschoben.
</Info>

## Funktionsweise

Nach jeder KI-Antwort wird die Unterhaltung dauerhaft in Honcho gespeichert. Sowohl Benutzer- als auch Agentennachrichten werden erfasst, sodass Honcho seine Modelle im Laufe der Zeit erstellen und verfeinern kann.

Während einer Unterhaltung fragen Honcho-Werkzeuge den Dienst über den Plugin-Hook `before_prompt_build` von OpenClaw ab und fügen relevanten Kontext ein, bevor das Modell den Prompt verarbeitet.

## Honcho im Vergleich zum integrierten Speicher

|                       | Integriert / QMD                      | Honcho                                    |
| --------------------- | ------------------------------------- | ----------------------------------------- |
| **Speicherung**       | Markdown-Dateien im Arbeitsbereich    | Dedizierter Dienst (lokal oder gehostet)  |
| **Sitzungsübergreifend** | Über Speicherdateien               | Automatisch integriert                    |
| **Benutzermodellierung** | Manuell (in MEMORY.md schreiben)   | Automatische Profile                      |
| **Suche**             | Vektor- und Stichwortsuche (hybrid)   | Semantisch über Beobachtungen             |
| **Mehrere Agenten**   | Keine Erfassung                       | Übersicht über über-/untergeordnete Agenten |
| **Abhängigkeiten**    | Keine (integriert) oder QMD-Binärdatei | Plugin-Installation                      |

Honcho und das integrierte Speichersystem können gemeinsam verwendet werden. Wenn QMD konfiguriert ist, stehen zusätzliche Werkzeuge zur Verfügung, mit denen Sie lokale Markdown-Dateien parallel zum sitzungsübergreifenden Speicher von Honcho durchsuchen können.

## CLI-Befehle

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Weiterführende Informationen

- [Quellcode des Plugins](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho-Dokumentation](https://docs.honcho.dev)
- [Integrationsleitfaden für Honcho und OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Integrierte Speicher-Engine](/de/concepts/memory-builtin)
- [QMD-Speicher-Engine](/de/concepts/memory-qmd)
- [Kontext-Engines](/de/concepts/context-engine)
