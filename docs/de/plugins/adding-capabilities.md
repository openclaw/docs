---
read_when:
    - Eine neue Kernfunktion und Plugin-Registrierungsoberfläche hinzufügen
    - Entscheiden, ob Code in den Core, ein Vendor-Plugin oder ein Feature-Plugin gehört
    - Einen neuen Runtime-Helfer für Kanäle oder Tools verdrahten
sidebarTitle: Adding capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsamen Fähigkeit zum OpenClaw-Plugin-System
title: Funktionen hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-06-27T17:44:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dies ist ein **Contributor-Leitfaden** für OpenClaw-Kernentwickler. Wenn Sie ein externes Plugin
  erstellen, lesen Sie stattdessen [Plugins erstellen](/de/plugins/building-plugins).
  Die ausführliche Architekturreferenz (Capability-Modell, Ownership,
  Lade-Pipeline, Runtime-Helfer) finden Sie unter [Plugin-Interna](/de/plugins/architecture).
</Info>

Verwenden Sie dies, wenn OpenClaw eine neue gemeinsame Domäne benötigt, etwa Embeddings,
Bildgenerierung, Videogenerierung oder einen zukünftigen funktionsbezogenen Bereich mit
Vendor-Unterstützung.

Die Regel:

- **Plugin** = Ownership-Grenze
- **Capability** = gemeinsamer Kernvertrag

Beginnen Sie nicht damit, einen Vendor direkt in einen Kanal oder ein Tool einzubinden. Beginnen Sie mit der Definition der Capability.

## Wann eine Capability erstellt werden sollte

Erstellen Sie eine neue Capability, wenn **alle** diese Punkte zutreffen:

1. Mehr als ein Vendor könnte sie plausibel implementieren.
2. Kanäle, Tools oder Feature-Plugins sollten sie nutzen können, ohne den Vendor zu kennen.
3. Der Kern muss Fallback, Policy, Konfiguration oder Zustellverhalten besitzen.

Wenn die Arbeit nur Vendor-spezifisch ist und noch kein gemeinsamer Vertrag existiert, halten Sie an und definieren Sie zuerst den Vertrag.

## Die Standardreihenfolge

1. Definieren Sie den typisierten Kernvertrag.
2. Fügen Sie die Plugin-Registrierung für diesen Vertrag hinzu.
3. Fügen Sie einen gemeinsamen Runtime-Helfer hinzu.
4. Binden Sie ein echtes Vendor-Plugin als Nachweis ein.
5. Stellen Sie Feature-/Kanal-Consumer auf den Runtime-Helfer um.
6. Fügen Sie Vertragstests hinzu.
7. Dokumentieren Sie die betreiberseitige Konfiguration und das Ownership-Modell.

## Was wohin gehört

**Kern:**

- Request-/Response-Typen.
- Provider-Registry und Auflösung.
- Fallback-Verhalten.
- Konfigurationsschema mit weitergegebenen `title`- / `description`-Docs-Metadaten auf verschachtelten Objekt-, Wildcard-, Array-Item- und Composition-Knoten.
- Runtime-Helferoberfläche.

**Vendor-Plugin:**

- Vendor-API-Aufrufe.
- Vendor-Auth-Verarbeitung.
- Vendor-spezifische Request-Normalisierung.
- Registrierung der Capability-Implementierung.

**Feature-/Kanal-Plugin:**

- Ruft `api.runtime.*` oder den passenden `plugin-sdk/*-runtime`-Helfer auf.
- Ruft niemals direkt eine Vendor-Implementierung auf.

## Provider- und Harness-Schnittstellen

Verwenden Sie **Provider-Hooks**, wenn das Verhalten zum Model-Provider-Vertrag gehört und nicht zum generischen Agent-Loop. Beispiele sind Provider-spezifische Request-Parameter nach der Transportauswahl, Auth-Profil-Präferenz, Prompt-Overlays und Follow-up-Fallback-Routing nach Model-/Profil-Failover.

Verwenden Sie **Agent-Harness-Hooks**, wenn das Verhalten zur Runtime gehört, die einen Turn ausführt. Harnesses können explizite Protokollergebnisse klassifizieren, etwa leere Ausgabe, Reasoning ohne sichtbare Ausgabe oder einen strukturierten Plan ohne abschließende Antwort, damit die äußere Model-Fallback-Policy die Retry-Entscheidung treffen kann.

Halten Sie beide Schnittstellen schmal:

- Der Kern besitzt die Retry-/Fallback-Policy.
- Provider-Plugins besitzen Provider-spezifische Request-/Auth-/Routing-Hinweise.
- Harness-Plugins besitzen Runtime-spezifische Attempt-Klassifizierung.
- Drittanbieter-Plugins geben Hinweise zurück, keine direkten Änderungen am Kernzustand.

## Datei-Checkliste

Für eine neue Capability sollten Sie damit rechnen, diese Bereiche anzupassen:

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
- Konfiguration, Docs, Tests.

## Durchgearbeitetes Beispiel: Bildgenerierung

Bildgenerierung folgt der Standardform:

1. Der Kern definiert `ImageGenerationProvider`.
2. Der Kern stellt `registerImageGenerationProvider(...)` bereit.
3. Der Kern stellt `runtime.imageGeneration.generate(...)` bereit.
4. Die Plugins `openai`, `google`, `fal` und `minimax` registrieren Vendor-gestützte Implementierungen.
5. Zukünftige Vendors registrieren denselben Vertrag, ohne Kanäle/Tools zu ändern.

Der Konfigurationsschlüssel ist absichtlich vom Routing für Vision-Analyse getrennt:

- `agents.defaults.imageModel` analysiert Bilder.
- `agents.defaults.imageGenerationModel` generiert Bilder.

Halten Sie diese getrennt, damit Fallback und Policy explizit bleiben.

## Embedding-Provider

Verwenden Sie `embeddingProviders` für wiederverwendbare Vector-Embedding-Provider. Dieser Vertrag
ist bewusst breiter als Memory: Tools, Suche, Retrieval, Importer oder
zukünftige Feature-Plugins können Embeddings nutzen, ohne von der Memory-
Engine abhängig zu sein.

Memory-Suche kann generische `embeddingProviders` nutzen. Der ältere
Vertrag `memoryEmbeddingProviders` ist veraltete Kompatibilität, während bestehende
Memory-spezifische Provider migrieren; neue wiederverwendbare Embedding-Provider sollten
`embeddingProviders` verwenden.

## Review-Checkliste

Prüfen Sie vor dem Ausliefern einer neuen Capability:

- Kein Kanal/Tool importiert Vendor-Code direkt.
- Der Runtime-Helfer ist der gemeinsame Pfad.
- Mindestens ein Vertragstest bestätigt die gebündelte Ownership.
- Konfigurations-Docs nennen den neuen Model-/Konfigurationsschlüssel.
- Plugin-Docs erklären die Ownership-Grenze.

Wenn ein PR die Capability-Schicht überspringt und Vendor-Verhalten in einem Kanal/Tool hardcodiert, senden Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Capability-Modell, Ownership, Lade-Pipeline, Runtime-Helfer.
- [Plugins erstellen](/de/plugins/building-plugins) — Tutorial für das erste Plugin.
- [SDK-Übersicht](/de/plugins/sdk-overview) — Import-Map und Referenz zur Registrierungs-API.
- [Skills erstellen](/de/tools/creating-skills) — begleitende Contributor-Oberfläche.
