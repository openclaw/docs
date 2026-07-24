---
read_when:
    - Hinzufügen einer neuen Kernfunktion und einer Registrierungsoberfläche für Plugins
    - Entscheiden, ob Code in den Kern, ein Provider-Plugin oder ein Funktions-Plugin gehört
    - Einbindung eines neuen Runtime-Helfers für Kanäle oder Tools
sidebarTitle: Adding capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsam genutzten Funktion zum Plugin-System von OpenClaw
title: Funktionen hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-07-24T04:31:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 14f86c98eb10c6e92970d1b65009ac7bb103afcb6bc57bad2c39e59bc038c961
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für Entwickler des OpenClaw-Kerns. Wenn Sie
  ein externes Plugin entwickeln, lesen Sie stattdessen [Plugins entwickeln](/de/plugins/building-plugins).
  Die ausführliche Architekturreferenz (Fähigkeitsmodell, Zuständigkeit,
  Ladepipeline, Laufzeithelfer) finden Sie unter [Plugin-Interna](/de/plugins/architecture).
</Info>

Verwenden Sie dies, wenn OpenClaw eine neue gemeinsam genutzte Domäne wie Einbettungen, Bildgenerierung, Videogenerierung oder einen zukünftigen, von einem Anbieter gestützten Funktionsbereich benötigt.

Die Regel:

- **Plugin** = Zuständigkeitsgrenze
- **Fähigkeit** = gemeinsam genutzter Kernvertrag

Binden Sie einen Anbieter nicht direkt an einen Kanal oder ein Tool an. Definieren Sie zuerst die Fähigkeit.

## Wann eine Fähigkeit erstellt werden sollte

Erstellen Sie eine neue Fähigkeit nur, wenn **alle** folgenden Bedingungen erfüllt sind:

1. Mehr als ein Anbieter könnte sie plausibel implementieren.
2. Kanäle, Tools oder Funktions-Plugins sollen sie nutzen können, ohne den Anbieter kennen zu müssen.
3. Der Kern muss Fallback-, Richtlinien-, Konfigurations- oder Auslieferungsverhalten verwalten.

Wenn die Arbeit anbieterspezifisch ist und noch kein gemeinsamer Vertrag besteht, definieren Sie zuerst den Vertrag.

## Die Standardabfolge

1. Definieren Sie den typisierten Kernvertrag.
2. Fügen Sie die Plugin-Registrierung für diesen Vertrag hinzu.
3. Fügen Sie einen gemeinsam genutzten Laufzeithelfer hinzu.
4. Binden Sie als Nachweis ein echtes Anbieter-Plugin an.
5. Stellen Sie Funktions- und Kanalnutzer auf den Laufzeithelfer um.
6. Fügen Sie Vertragstests hinzu.
7. Dokumentieren Sie die betreiberrelevante Konfiguration und das Zuständigkeitsmodell.

## Was wohin gehört

| Ebene                      | Zuständig für                                                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kern**                   | Anfrage-/Antworttypen; Provider-Registrierung und -Auflösung; Fallback-Verhalten; Konfigurationsschema mit weitergegebenen `title`-/`description`-Dokumentationsmetadaten auf verschachtelten Objekt-, Platzhalter-, Array-Element- und Kompositionsknoten; Oberfläche der Laufzeithelfer. |
| **Anbieter-Plugin**        | Anbieter-API-Aufrufe, Handhabung der Anbieter-Authentifizierung, anbieterspezifische Normalisierung von Anfragen und Registrierung der Fähigkeitsimplementierung.                                                                        |
| **Funktions-/Kanal-Plugin** | Ruft `api.runtime.*` oder den entsprechenden `plugin-sdk/*-runtime`-Helfer auf. Ruft niemals direkt eine Anbieterimplementierung auf.                                                                                                  |

## Schnittstellen für Provider und Harness

Verwenden Sie **Provider-Hooks**, wenn das Verhalten zum Vertrag des Modell-Providers und nicht zur generischen Agentenschleife gehört. Beispiele sind providerspezifische Anfrageparameter nach der Transportauswahl, die Bevorzugung von Authentifizierungsprofilen, Prompt-Erweiterungen und nachgelagertes Fallback-Routing nach einem Modell-/Profil-Failover.

Verwenden Sie **Agent-Harness-Hooks**, wenn das Verhalten zur Laufzeit gehört, die einen Durchlauf ausführt. Harnesses können explizite Protokollergebnisse wie eine leere Ausgabe, Schlussfolgerungen ohne sichtbare Ausgabe oder einen strukturierten Plan ohne endgültige Antwort klassifizieren, damit die äußere Modell-Fallback-Richtlinie über einen erneuten Versuch entscheiden kann.

Halten Sie beide Schnittstellen eng begrenzt:

- Der Kern verwaltet die Wiederholungs-/Fallback-Richtlinie.
- Provider-Plugins verwalten providerspezifische Hinweise für Anfragen, Authentifizierung und Routing.
- Harness-Plugins verwalten laufzeitspezifische Klassifizierungen von Versuchen.
- Plugins von Drittanbietern geben Hinweise zurück und verändern den Kernzustand nicht direkt.

## Datei-Checkliste

Für eine neue Fähigkeit sind voraussichtlich Änderungen in diesen Bereichen erforderlich:

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
- Konfiguration, Dokumentation, Tests.

## Ausgearbeitetes Beispiel: Bildgenerierung

Die Bildgenerierung folgt der Standardstruktur:

1. Der Kern definiert `ImageGenerationProvider`.
2. Der Kern stellt `registerImageGenerationProvider(...)` bereit.
3. Der Kern stellt `api.runtime.imageGeneration.generate(...)` und `.listProviders(...)` bereit.
4. Anbieter-Plugins (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registrieren anbietergestützte Implementierungen.
5. Zukünftige Anbieter registrieren denselben Vertrag, ohne Kanäle oder Tools zu ändern.

Der Konfigurationsschlüssel ist bewusst vom Routing für die Bildanalyse getrennt:

- `agents.defaults.imageModel` analysiert Bilder.
- `agents.defaults.mediaModels.image` generiert Bilder.

Halten Sie diese getrennt, damit Fallback und Richtlinien explizit bleiben.

## Einbettungs-Provider

Verwenden Sie `registerEmbeddingProvider(...)` / Vertrag `embeddingProviders` für
wiederverwendbare Provider von Vektoreinbettungen. Dieser Vertrag ist bewusst umfassender
als der Speicher: Tools, Suche, Abruf, Importprogramme oder zukünftige Funktions-Plugins
können Einbettungen nutzen, ohne von der Speicher-Engine abhängig zu sein. Die Speichersuche
nutzt ebenfalls generische `embeddingProviders`.

Die ältere speicherspezifische Registrierungs-API und der Vertrag `memoryEmbeddingProviders`
sind veraltet. Verwenden Sie `registerEmbeddingProvider` und
`embeddingProviders` für alle neuen Einbettungs-Provider.

## Review-Checkliste

Prüfen Sie vor der Auslieferung einer neuen Fähigkeit Folgendes:

- Kein Kanal oder Tool importiert Anbietercode direkt.
- Der Laufzeithelfer ist der gemeinsam genutzte Pfad.
- Mindestens ein Vertragstest bestätigt die gebündelte Zuständigkeit.
- Die Konfigurationsdokumentation nennt das neue Modell bzw. den neuen Konfigurationsschlüssel.
- Die Plugin-Dokumentation erläutert die Zuständigkeitsgrenze.

Wenn ein PR die Fähigkeitsebene überspringt und Anbieterverhalten fest in einen Kanal oder ein Tool einprogrammiert, weisen Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell, Zuständigkeit, Ladepipeline, Laufzeithelfer.
- [Plugins entwickeln](/de/plugins/building-plugins) — Tutorial für das erste Plugin.
- [SDK-Übersicht](/de/plugins/sdk-overview) — Referenz für Importzuordnung und Registrierungs-API.
- [Skills erstellen](/de/tools/creating-skills) — ergänzende Oberfläche für Mitwirkende.
