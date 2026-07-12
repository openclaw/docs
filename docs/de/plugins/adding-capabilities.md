---
read_when:
    - Hinzufügen einer neuen Kernfunktion und Registrierungsoberfläche für Plugins
    - Entscheidung, ob Code zum Kern, zu einem herstellerspezifischen Plugin oder zu einem Funktions-Plugin gehört
    - Einbinden eines neuen Runtime-Helfers für Kanäle oder Tools
sidebarTitle: Adding capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsam genutzten Funktion zum Plugin-System von OpenClaw
title: Funktionen hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-07-12T01:52:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für Entwickler des OpenClaw-Kerns. Wenn Sie
  ein externes Plugin entwickeln, lesen Sie stattdessen [Plugins entwickeln](/de/plugins/building-plugins).
  Eine ausführliche Architekturreferenz (Fähigkeitsmodell, Zuständigkeiten,
  Ladepipeline, Laufzeit-Hilfsfunktionen) finden Sie unter [Plugin-Interna](/de/plugins/architecture).
</Info>

Verwenden Sie dies, wenn OpenClaw einen neuen gemeinsamen Funktionsbereich benötigt, etwa für Einbettungen, Bildgenerierung, Videogenerierung oder einen zukünftigen, von einem Anbieter bereitgestellten Funktionsbereich.

Die Regel:

- **Plugin** = Zuständigkeitsgrenze
- **Fähigkeit** = gemeinsamer Kernvertrag

Binden Sie einen Anbieter nicht direkt in einen Kanal oder ein Werkzeug ein. Definieren Sie zuerst die Fähigkeit.

## Wann eine Fähigkeit erstellt werden sollte

Erstellen Sie eine neue Fähigkeit nur, wenn **alle** folgenden Bedingungen erfüllt sind:

1. Mehr als ein Anbieter könnte sie realistischerweise implementieren.
2. Kanäle, Werkzeuge oder Funktions-Plugins sollen sie verwenden können, ohne den Anbieter kennen zu müssen.
3. Der Kern muss Fallback-, Richtlinien-, Konfigurations- oder Auslieferungsverhalten verantworten.

Wenn die Funktion nur einen Anbieter betrifft und noch kein gemeinsamer Vertrag vorhanden ist, definieren Sie zuerst den Vertrag.

## Die Standardabfolge

1. Definieren Sie den typisierten Kernvertrag.
2. Fügen Sie die Plugin-Registrierung für diesen Vertrag hinzu.
3. Fügen Sie eine gemeinsame Laufzeit-Hilfsfunktion hinzu.
4. Binden Sie zum Nachweis ein echtes Anbieter-Plugin ein.
5. Stellen Sie Funktions- und Kanalnutzer auf die Laufzeit-Hilfsfunktion um.
6. Fügen Sie Vertragstests hinzu.
7. Dokumentieren Sie die betreiberseitige Konfiguration und das Zuständigkeitsmodell.

## Was gehört wohin?

| Ebene                      | Zuständigkeit                                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kern**                   | Anfrage-/Antworttypen; Provider-Registrierung und -Auflösung; Fallback-Verhalten; Konfigurationsschema mit weitergegebenen `title`-/`description`-Dokumentationsmetadaten für verschachtelte Objekt-, Platzhalter-, Array-Element- und Kompositionsknoten; Laufzeit-Hilfsoberfläche. |
| **Anbieter-Plugin**        | Anbieter-API-Aufrufe, Handhabung der Anbieter-Authentifizierung, anbieterspezifische Normalisierung von Anfragen und Registrierung der Fähigkeitsimplementierung.                                                                          |
| **Funktions-/Kanal-Plugin** | Ruft `api.runtime.*` oder die entsprechende `plugin-sdk/*-runtime`-Hilfsfunktion auf. Ruft niemals direkt eine Anbieterimplementierung auf.                                                                                              |

## Schnittstellen für Provider und Laufzeitumgebungen

Verwenden Sie **Provider-Hooks**, wenn das Verhalten zum Vertrag des Modell-Providers und nicht zur generischen Agentenschleife gehört. Beispiele sind providerspezifische Anfrageparameter nach der Transportauswahl, die Bevorzugung von Authentifizierungsprofilen, Prompt-Erweiterungen und die nachgelagerte Fallback-Weiterleitung nach einem Modell- oder Profil-Failover.

Verwenden Sie **Hooks der Agenten-Laufzeitumgebung**, wenn das Verhalten zu der Laufzeit gehört, die einen Durchlauf ausführt. Laufzeitumgebungen können explizite Protokollergebnisse klassifizieren, etwa eine leere Ausgabe, Schlussfolgerungen ohne sichtbare Ausgabe oder einen strukturierten Plan ohne abschließende Antwort, damit die äußere Modell-Fallback-Richtlinie über einen erneuten Versuch entscheiden kann.

Halten Sie beide Schnittstellen schlank:

- Der Kern verantwortet die Richtlinie für erneute Versuche und Fallbacks.
- Provider-Plugins verantworten providerspezifische Hinweise zu Anfragen, Authentifizierung und Weiterleitung.
- Laufzeitumgebungs-Plugins verantworten die laufzeitspezifische Klassifizierung von Versuchen.
- Plugins von Drittanbietern geben Hinweise zurück und verändern den Kernzustand nicht direkt.

## Datei-Checkliste

Für eine neue Fähigkeit müssen Sie voraussichtlich diese Bereiche ändern:

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

Die Bildgenerierung folgt dem Standardschema:

1. Der Kern definiert `ImageGenerationProvider`.
2. Der Kern stellt `registerImageGenerationProvider(...)` bereit.
3. Der Kern stellt `api.runtime.imageGeneration.generate(...)` und `.listProviders(...)` bereit.
4. Anbieter-Plugins (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registrieren anbietergestützte Implementierungen.
5. Zukünftige Anbieter registrieren denselben Vertrag, ohne Kanäle oder Werkzeuge zu ändern.

Der Konfigurationsschlüssel ist bewusst von der Weiterleitung für die Bildanalyse getrennt:

- `agents.defaults.imageModel` analysiert Bilder.
- `agents.defaults.imageGenerationModel` erzeugt Bilder.

Halten Sie diese getrennt, damit Fallback und Richtlinie explizit bleiben.

## Einbettungs-Provider

Verwenden Sie `registerEmbeddingProvider(...)` beziehungsweise den Vertrag `embeddingProviders` für wiederverwendbare Provider von Vektoreinbettungen. Dieser Vertrag ist bewusst umfassender als der Speicher: Werkzeuge, Suche, Abruf, Importprogramme oder zukünftige Funktions-Plugins können Einbettungen verwenden, ohne von der Speicher-Engine abhängig zu sein. Auch die Speichersuche verwendet generische `embeddingProviders`.

Die ältere speicherspezifische Registrierungs-API und der Vertrag `memoryEmbeddingProviders` sind veraltet. Verwenden Sie für alle neuen Einbettungs-Provider `registerEmbeddingProvider` und `embeddingProviders`.

## Checkliste für die Überprüfung

Prüfen Sie vor der Auslieferung einer neuen Fähigkeit:

- Kein Kanal oder Werkzeug importiert Anbietercode direkt.
- Die Laufzeit-Hilfsfunktion ist der gemeinsame Pfad.
- Mindestens ein Vertragstest bestätigt die gebündelte Zuständigkeit.
- Die Konfigurationsdokumentation nennt den neuen Modell- oder Konfigurationsschlüssel.
- Die Plugin-Dokumentation erläutert die Zuständigkeitsgrenze.

Wenn ein PR die Fähigkeitsebene überspringt und anbieterspezifisches Verhalten fest in einen Kanal oder ein Werkzeug einbaut, weisen Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell, Zuständigkeiten, Ladepipeline und Laufzeit-Hilfsfunktionen.
- [Plugins entwickeln](/de/plugins/building-plugins) — Einführung in die Entwicklung des ersten Plugins.
- [SDK-Übersicht](/de/plugins/sdk-overview) — Referenz zur Importzuordnung und Registrierungs-API.
- [Skills erstellen](/de/tools/creating-skills) — ergänzende Oberfläche für Mitwirkende.
