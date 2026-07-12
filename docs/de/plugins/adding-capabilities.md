---
read_when:
    - Hinzufügen einer neuen Kernfunktion und einer Registrierungsoberfläche für Plugins
    - Entscheidung, ob Code in den Kern, ein Provider-Plugin oder ein Funktions-Plugin gehört
    - Einbindung eines neuen Runtime-Helfers für Kanäle oder Tools
sidebarTitle: Adding capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsamen Funktion zum Plugin-System von OpenClaw
title: Funktionen hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-07-12T15:31:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für Entwickler des OpenClaw-Kerns. Wenn Sie
  ein externes Plugin erstellen, lesen Sie stattdessen [Plugins erstellen](/de/plugins/building-plugins).
  Die ausführliche Architekturreferenz (Fähigkeitsmodell, Zuständigkeit,
  Ladepipeline, Runtime-Helfer) finden Sie unter [Plugin-Interna](/de/plugins/architecture).
</Info>

Verwenden Sie diesen Leitfaden, wenn OpenClaw eine neue gemeinsame Domäne benötigt, etwa für Embeddings, Bildgenerierung, Videogenerierung oder einen zukünftigen, von Anbietern gestützten Funktionsbereich.

Die Regel:

- **Plugin** = Zuständigkeitsgrenze
- **Fähigkeit** = gemeinsamer Kernvertrag

Binden Sie einen Anbieter nicht direkt in einen Kanal oder ein Tool ein. Definieren Sie zuerst die Fähigkeit.

## Wann eine Fähigkeit erstellt werden sollte

Erstellen Sie eine neue Fähigkeit nur, wenn **alle** folgenden Bedingungen erfüllt sind:

1. Mehr als ein Anbieter könnte sie plausibel implementieren.
2. Kanäle, Tools oder Funktions-Plugins sollen sie nutzen können, ohne den Anbieter kennen zu müssen.
3. Der Kern muss Fallback-, Richtlinien-, Konfigurations- oder Auslieferungsverhalten verwalten.

Wenn die Arbeit nur einen Anbieter betrifft und noch kein gemeinsamer Vertrag vorhanden ist, definieren Sie zuerst den Vertrag.

## Die Standardreihenfolge

1. Definieren Sie den typisierten Kernvertrag.
2. Fügen Sie die Plugin-Registrierung für diesen Vertrag hinzu.
3. Fügen Sie einen gemeinsamen Runtime-Helfer hinzu.
4. Binden Sie als Nachweis ein echtes Anbieter-Plugin ein.
5. Stellen Sie Funktions- und Kanalnutzer auf den Runtime-Helfer um.
6. Fügen Sie Vertragstests hinzu.
7. Dokumentieren Sie die betreiberseitige Konfiguration und das Zuständigkeitsmodell.

## Was wohin gehört

| Ebene                      | Zuständig für                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kern**                   | Anfrage-/Antworttypen; Provider-Registrierung und -Auflösung; Fallback-Verhalten; Konfigurationsschema mit weitergegebenen `title`-/`description`-Dokumentationsmetadaten für verschachtelte Objekt-, Platzhalter-, Array-Element- und Kompositionsknoten; Runtime-Helferoberfläche. |
| **Anbieter-Plugin**          | Anbieter-API-Aufrufe, Handhabung der Anbieter-Authentifizierung, anbieterspezifische Anfragenormalisierung und Registrierung der Fähigkeitsimplementierung.                                                                                                     |
| **Funktions-/Kanal-Plugin** | Ruft `api.runtime.*` oder den entsprechenden `plugin-sdk/*-runtime`-Helfer auf. Ruft niemals direkt eine Anbieterimplementierung auf.                                                                                                                    |

## Provider- und Harness-Schnittstellen

Verwenden Sie **Provider-Hooks**, wenn das Verhalten zum Vertrag des Modell-Providers und nicht zur generischen Agentenschleife gehört. Beispiele sind providerspezifische Anfrageparameter nach der Transportauswahl, die Bevorzugung von Authentifizierungsprofilen, Prompt-Overlays und nachgelagertes Fallback-Routing nach einem Modell-/Profil-Failover.

Verwenden Sie **Agent-Harness-Hooks**, wenn das Verhalten zur Runtime gehört, die einen Durchlauf ausführt. Harnesses können explizite Protokollergebnisse klassifizieren, etwa leere Ausgaben, Reasoning ohne sichtbare Ausgabe oder einen strukturierten Plan ohne endgültige Antwort, damit die äußere Modell-Fallback-Richtlinie über einen erneuten Versuch entscheiden kann.

Halten Sie beide Schnittstellen eng begrenzt:

- Der Kern verwaltet die Wiederholungs-/Fallback-Richtlinie.
- Provider-Plugins verwalten providerspezifische Hinweise zu Anfragen, Authentifizierung und Routing.
- Harness-Plugins verwalten die runtime-spezifische Klassifizierung von Versuchen.
- Drittanbieter-Plugins geben Hinweise zurück und verändern den Kernzustand nicht direkt.

## Datei-Checkliste

Bei einer neuen Fähigkeit müssen voraussichtlich folgende Bereiche geändert werden:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- Ein oder mehrere gebündelte Plugin-Pakete.
- Konfiguration, Dokumentation und Tests.

## Ausgearbeitetes Beispiel: Bildgenerierung

Die Bildgenerierung folgt der Standardstruktur:

1. Der Kern definiert `ImageGenerationProvider`.
2. Der Kern stellt `registerImageGenerationProvider(...)` bereit.
3. Der Kern stellt `api.runtime.imageGeneration.generate(...)` und `.listProviders(...)` bereit.
4. Anbieter-Plugins (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registrieren von Anbietern gestützte Implementierungen.
5. Zukünftige Anbieter registrieren denselben Vertrag, ohne Kanäle oder Tools zu ändern.

Der Konfigurationsschlüssel ist bewusst vom Routing für die Bildanalyse getrennt:

- `agents.defaults.imageModel` analysiert Bilder.
- `agents.defaults.imageGenerationModel` generiert Bilder.

Halten Sie diese getrennt, damit Fallback und Richtlinien explizit bleiben.

## Embedding-Provider

Verwenden Sie `registerEmbeddingProvider(...)` beziehungsweise den Vertrag `embeddingProviders` für wiederverwendbare Provider für Vektor-Embeddings. Dieser Vertrag ist bewusst allgemeiner als der Speicher: Tools, Suche, Abruf, Importer oder zukünftige Funktions-Plugins können Embeddings nutzen, ohne von der Speicher-Engine abhängig zu sein. Auch die Speichersuche nutzt generische `embeddingProviders`.

Die ältere speicherspezifische Registrierungs-API und der Vertrag `memoryEmbeddingProviders` sind veraltet. Verwenden Sie für alle neuen Embedding-Provider `registerEmbeddingProvider` und `embeddingProviders`.

## Review-Checkliste

Prüfen Sie vor der Auslieferung einer neuen Fähigkeit:

- Kein Kanal oder Tool importiert Anbietercode direkt.
- Der Runtime-Helfer ist der gemeinsame Pfad.
- Mindestens ein Vertragstest bestätigt die gebündelte Zuständigkeit.
- Die Konfigurationsdokumentation nennt den neuen Modell-/Konfigurationsschlüssel.
- Die Plugin-Dokumentation erläutert die Zuständigkeitsgrenze.

Wenn ein PR die Fähigkeitsebene überspringt und Anbieterverhalten fest in einen Kanal oder ein Tool einprogrammiert, weisen Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell, Zuständigkeit, Ladepipeline und Runtime-Helfer.
- [Plugins erstellen](/de/plugins/building-plugins) — Tutorial für das erste Plugin.
- [SDK-Übersicht](/de/plugins/sdk-overview) — Referenz für Importzuordnung und Registrierungs-API.
- [Skills erstellen](/de/tools/creating-skills) — ergänzende Oberfläche für Mitwirkende.
