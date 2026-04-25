---
read_when:
    - Hinzufügen einer neuen Kernfunktion und Plugin-Registrierungsoberfläche
    - Entscheiden, ob Code in den Kern, ein Anbieter-Plugin oder ein Feature-Plugin gehört
    - Neue Runtime-Helfer für Channels oder Tools anbinden
sidebarTitle: Adding Capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsamen Funktion zum OpenClaw-Plugin-System
title: Funktionen hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-04-25T13:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für OpenClaw-Core-Entwickler. Wenn Sie
  ein externes Plugin erstellen, lesen Sie stattdessen [Building Plugins](/de/plugins/building-plugins).
</Info>

Verwenden Sie dies, wenn OpenClaw einen neuen Bereich wie Bildgenerierung, Videogenerierung
oder einen zukünftigen von Anbietern unterstützten Funktionsbereich benötigt.

Die Regel:

- Plugin = Eigentumsgrenze
- Funktion = gemeinsamer Core-Vertrag

Das bedeutet, dass Sie nicht damit beginnen sollten, einen Anbieter direkt mit einem Channel oder einem
Tool zu verbinden. Beginnen Sie damit, die Funktion zu definieren.

## Wann eine Funktion erstellt werden sollte

Erstellen Sie eine neue Funktion, wenn all dies zutrifft:

1. mehr als ein Anbieter sie plausibel implementieren könnte
2. Channels, Tools oder Feature-Plugins sie nutzen sollten, ohne sich um
   den Anbieter zu kümmern
3. der Core Fallback, Richtlinie, Konfiguration oder Zustellungsverhalten besitzen muss

Wenn die Arbeit nur anbieterbezogen ist und noch kein gemeinsamer Vertrag existiert, halten Sie an und definieren
Sie zuerst den Vertrag.

## Die Standardabfolge

1. Definieren Sie den typisierten Core-Vertrag.
2. Fügen Sie die Plugin-Registrierung für diesen Vertrag hinzu.
3. Fügen Sie einen gemeinsamen Runtime-Helfer hinzu.
4. Verbinden Sie ein echtes Anbieter-Plugin als Nachweis.
5. Stellen Sie Feature-/Channel-Konsumenten auf den Runtime-Helfer um.
6. Fügen Sie Vertragstests hinzu.
7. Dokumentieren Sie die betreiberseitige Konfiguration und das Eigentumsmodell.

## Was wohin gehört

Core:

- Request-/Response-Typen
- Provider-Registry + Auflösung
- Fallback-Verhalten
- Konfigurationsschema plus weitergegebene `title`- / `description`-Dokumentationsmetadaten auf verschachtelten Objekt-, Wildcard-, Array-Item- und Kompositionsknoten
- Oberfläche des Runtime-Helfers

Anbieter-Plugin:

- API-Aufrufe des Anbieters
- Auth-Handling des Anbieters
- anbieterbezogene Request-Normalisierung
- Registrierung der Funktionsimplementierung

Feature-/Channel-Plugin:

- ruft `api.runtime.*` oder den passenden Helfer `plugin-sdk/*-runtime` auf
- ruft niemals direkt eine Anbieterimplementierung auf

## Provider- und Harness-Seams

Verwenden Sie Provider-Hooks, wenn das Verhalten zum Vertrag des Modell-Providers
gehört und nicht zur generischen Agent-Schleife. Beispiele sind anbieterbezogene Request-
Parameter nach der Transportauswahl, Präferenz für Auth-Profile, Prompt-Overlays und
nachgelagertes Fallback-Routing nach Modell-/Profil-Failover.

Verwenden Sie Agent-Harness-Hooks, wenn das Verhalten zur Runtime gehört, die
einen Turn ausführt. Harnesses können erfolgreiche, aber unbrauchbare Versuchsergebnisse
klassifizieren, etwa leere Antworten oder reine Reasoning-/Planning-Antworten, damit die
äußere Modell-Fallback-Richtlinie die Wiederholungsentscheidung treffen kann.

Halten Sie beide Seams schmal:

- der Core besitzt die Retry-/Fallback-Richtlinie
- Provider-Plugins besitzen anbieterbezogene Hinweise für Request/Auth/Routing
- Harness-Plugins besitzen die runtimespezifische Klassifizierung von Versuchen
- Plugins von Drittanbietern geben Hinweise zurück, keine direkten Mutationen des Core-Status

## Dateicheckliste

Für eine neue Funktion müssen Sie voraussichtlich diese Bereiche anpassen:

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
- ein oder mehrere gebündelte Plugin-Pakete
- Konfiguration/Dokumentation/Tests

## Beispiel: Bildgenerierung

Bildgenerierung folgt der Standardform:

1. der Core definiert `ImageGenerationProvider`
2. der Core stellt `registerImageGenerationProvider(...)` bereit
3. der Core stellt `runtime.imageGeneration.generate(...)` bereit
4. die Plugins `openai`, `google`, `fal` und `minimax` registrieren von Anbietern unterstützte Implementierungen
5. zukünftige Anbieter können denselben Vertrag registrieren, ohne Channels/Tools zu ändern

Der Konfigurationsschlüssel ist getrennt vom Routing für Vision-Analyse:

- `agents.defaults.imageModel` = Bilder analysieren
- `agents.defaults.imageGenerationModel` = Bilder generieren

Halten Sie diese getrennt, damit Fallback und Richtlinie explizit bleiben.

## Checkliste für Reviews

Prüfen Sie vor dem Ausliefern einer neuen Funktion:

- kein Channel/Tool importiert Anbieter-Code direkt
- der Runtime-Helfer ist der gemeinsame Pfad
- mindestens ein Vertragstest bestätigt gebündeltes Eigentum
- die Konfigurationsdokumentation benennt den neuen Modell-/Konfigurationsschlüssel
- die Plugin-Dokumentation erklärt die Eigentumsgrenze

Wenn ein PR die Funktionsebene überspringt und anbieterbezogenes Verhalten fest in einen
Channel/ein Tool codiert, schicken Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandt

- [Plugin](/de/tools/plugin)
- [Creating skills](/de/tools/creating-skills)
- [Tools and plugins](/de/tools)
