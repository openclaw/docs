---
read_when:
    - Hinzufügen einer neuen Core-Fähigkeit und Plugin-Registrierungsoberfläche
    - Entscheiden, ob Code in den Core, ein Vendor-Plugin oder ein Feature-Plugin gehört
    - Einrichten eines neuen Laufzeit-Helfers für Kanäle oder Tools
sidebarTitle: Adding Capabilities
summary: Leitfaden für Beitragende zum Hinzufügen einer neuen gemeinsamen Fähigkeit zum OpenClaw-Plugin-System
title: Fähigkeiten hinzufügen (Leitfaden für Beitragende)
x-i18n:
    generated_at: "2026-04-24T09:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Dies ist ein **Leitfaden für Beitragende** für OpenClaw-Core-Entwickler. Wenn Sie
  ein externes Plugin erstellen, lesen Sie stattdessen [Plugins erstellen](/de/plugins/building-plugins).
</Info>

Verwenden Sie dies, wenn OpenClaw einen neuen Bereich wie Bildgenerierung, Video-
generierung oder einen zukünftigen von einem Anbieter unterstützten Funktionsbereich benötigt.

Die Regel:

- Plugin = Besitzgrenze
- Fähigkeit = gemeinsamer Core-Vertrag

Das bedeutet, dass Sie nicht damit beginnen sollten, einen Anbieter direkt in einen Kanal oder ein
Tool einzubinden. Beginnen Sie mit der Definition der Fähigkeit.

## Wann eine Fähigkeit erstellt werden sollte

Erstellen Sie eine neue Fähigkeit, wenn all dies zutrifft:

1. Mehr als ein Anbieter könnte sie plausibel implementieren
2. Kanäle, Tools oder Feature-Plugins sollten sie verwenden können, ohne sich um
   den Anbieter zu kümmern
3. Der Core muss Fallback, Richtlinien, Konfiguration oder Zustellungsverhalten besitzen

Wenn die Arbeit nur anbieterbezogen ist und noch kein gemeinsamer Vertrag existiert, stoppen Sie und definieren
Sie zuerst den Vertrag.

## Die Standardreihenfolge

1. Den typisierten Core-Vertrag definieren.
2. Plugin-Registrierung für diesen Vertrag hinzufügen.
3. Einen gemeinsamen Laufzeit-Helfer hinzufügen.
4. Ein echtes Anbieter-Plugin als Nachweis einbinden.
5. Feature-/Kanal-Consumer auf den Laufzeit-Helfer umstellen.
6. Contract-Tests hinzufügen.
7. Die operatorseitige Konfiguration und das Besitzmodell dokumentieren.

## Was wohin gehört

Core:

- Request-/Response-Typen
- Provider-Registry + Auflösung
- Fallback-Verhalten
- Konfigurationsschema plus weitergegebene `title`- / `description`-Dokumentationsmetadaten auf verschachtelten Objekt-, Wildcard-, Array-Item- und Kompositionsknoten
- Oberfläche des Laufzeit-Helfers

Anbieter-Plugin:

- Anbieter-API-Aufrufe
- Anbieter-Auth-Handling
- anbieterbezogene Request-Normalisierung
- Registrierung der Fähigkeitsimplementierung

Feature-/Kanal-Plugin:

- ruft `api.runtime.*` oder den passenden Helfer `plugin-sdk/*-runtime` auf
- ruft niemals direkt eine Anbieterimplementierung auf

## Provider- und Harness-Seams

Verwenden Sie Provider-Hooks, wenn das Verhalten zum Vertrag des Modell-Providers
gehört und nicht zur generischen Agent-Schleife. Beispiele sind anbieterbezogene Request-
Parameter nach der Auswahl des Transports, Präferenz für Auth-Profile, Prompt-Overlays und
das Routing des nachgelagerten Fallbacks nach Modell-/Profil-Failover.

Verwenden Sie Agent-Harness-Hooks, wenn das Verhalten zur Laufzeit gehört, die
einen Turn ausführt. Harnesses können erfolgreiche, aber unbrauchbare Versuchsergebnisse klassifizieren,
etwa leere, nur aus Reasoning bestehende oder nur planende Antworten, damit die äußere
Modell-Fallback-Richtlinie über den Retry entscheiden kann.

Halten Sie beide Seams schmal:

- der Core besitzt die Retry-/Fallback-Richtlinie
- Provider-Plugins besitzen anbieterbezogene Hinweise für Request/Auth/Routing
- Harness-Plugins besitzen die laufzeitspezifische Klassifizierung von Versuchen
- Plugins von Drittanbietern geben Hinweise zurück, keine direkten Mutationen des Core-Zustands

## Dateicheckliste

Für eine neue Fähigkeit werden voraussichtlich diese Bereiche berührt:

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

Bildgenerierung folgt der Standardschablone:

1. Der Core definiert `ImageGenerationProvider`
2. Der Core stellt `registerImageGenerationProvider(...)` bereit
3. Der Core stellt `runtime.imageGeneration.generate(...)` bereit
4. Die Plugins `openai`, `google`, `fal` und `minimax` registrieren anbieterunterstützte Implementierungen
5. Zukünftige Anbieter können denselben Vertrag registrieren, ohne Kanäle/Tools zu ändern

Der Konfigurationsschlüssel ist von Vision-Analysis-Routing getrennt:

- `agents.defaults.imageModel` = Bilder analysieren
- `agents.defaults.imageGenerationModel` = Bilder generieren

Halten Sie diese getrennt, damit Fallback und Richtlinien explizit bleiben.

## Checkliste für Reviews

Verifizieren Sie vor dem Ausliefern einer neuen Fähigkeit:

- Kein Kanal/Tool importiert Anbieter-Code direkt
- Der Laufzeit-Helfer ist der gemeinsame Pfad
- Mindestens ein Contract-Test stellt gebündelten Besitz sicher
- Die Konfigurationsdokumentation benennt den neuen Modell-/Konfigurationsschlüssel
- Die Plugin-Dokumentation erklärt die Besitzgrenze

Wenn ein PR die Fähigkeitsebene überspringt und Anbieter-Verhalten direkt in einen
Kanal/ein Tool hartcodiert, schicken Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandt

- [Plugin](/de/tools/plugin)
- [Skills erstellen](/de/tools/creating-skills)
- [Tools und Plugins](/de/tools)
