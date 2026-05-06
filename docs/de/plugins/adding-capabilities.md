---
read_when:
    - Hinzufügen einer neuen Kernfunktion und Plugin-Registrierungsschnittstelle
    - Entscheiden, ob Code in den Core, ein Vendor-Plugin oder ein Feature-Plugin gehört
    - Einen neuen Laufzeit-Helfer für Kanäle oder Werkzeuge einbinden
sidebarTitle: Adding capabilities
summary: Leitfaden für Mitwirkende zum Hinzufügen einer neuen gemeinsamen Fähigkeit zum OpenClaw-Plugin-System
title: Funktionen hinzufügen (Leitfaden für Mitwirkende)
x-i18n:
    generated_at: "2026-05-06T06:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Dies ist ein **Leitfaden für Mitwirkende** für OpenClaw-Core-Entwickler. Wenn Sie
  ein externes Plugin erstellen, lesen Sie stattdessen [Plugins erstellen](/de/plugins/building-plugins).
  Die ausführliche Architekturreferenz (Fähigkeitsmodell, Ownership,
  Ladepipeline, Runtime-Helpers) finden Sie unter [Plugin-Interna](/de/plugins/architecture).
</Info>

Verwenden Sie dies, wenn OpenClaw eine neue gemeinsame Domäne wie Bilderzeugung, Videoerzeugung oder einen künftigen, vendorgestützten Funktionsbereich benötigt.

Die Regel:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = gemeinsamer Core-Vertrag

Beginnen Sie nicht damit, einen Vendor direkt in einen Kanal oder ein Tool einzubinden. Beginnen Sie mit der Definition der Fähigkeit.

## Wann Sie eine Fähigkeit erstellen sollten

Erstellen Sie eine neue Fähigkeit, wenn **alle** folgenden Punkte zutreffen:

1. Mehr als ein Vendor könnte sie plausibel implementieren.
2. Kanäle, Tools oder Feature-Plugins sollten sie verwenden können, ohne den Vendor berücksichtigen zu müssen.
3. Core muss Fallback-, Policy-, Konfigurations- oder Auslieferungsverhalten besitzen.

Wenn die Arbeit nur vendorbezogen ist und noch kein gemeinsamer Vertrag existiert, halten Sie an und definieren Sie zuerst den Vertrag.

## Die Standardreihenfolge

1. Definieren Sie den typisierten Core-Vertrag.
2. Fügen Sie die Plugin-Registrierung für diesen Vertrag hinzu.
3. Fügen Sie einen gemeinsamen Runtime-Helper hinzu.
4. Binden Sie ein echtes Vendor-Plugin als Nachweis ein.
5. Stellen Sie Feature-/Kanal-Consumer auf den Runtime-Helper um.
6. Fügen Sie Vertragstests hinzu.
7. Dokumentieren Sie die betreiberseitige Konfiguration und das Ownership-Modell.

## Was wohin gehört

**Core:**

- Request-/Response-Typen.
- Provider-Registry + Auflösung.
- Fallback-Verhalten.
- Konfigurationsschema mit weitergegebenen `title`-/`description`-Docs-Metadaten auf verschachtelten Objekt-, Wildcard-, Array-Element- und Kompositionsknoten.
- Runtime-Helper-Oberfläche.

**Vendor-Plugin:**

- Vendor-API-Aufrufe.
- Vendor-Authentifizierungsbehandlung.
- Vendorspezifische Request-Normalisierung.
- Registrierung der Fähigkeitsimplementierung.

**Feature-/Kanal-Plugin:**

- Ruft `api.runtime.*` oder den passenden `plugin-sdk/*-runtime`-Helper auf.
- Ruft niemals direkt eine Vendor-Implementierung auf.

## Provider- und Harness-Schnittstellen

Verwenden Sie **Provider-Hooks**, wenn das Verhalten zum Model-Provider-Vertrag gehört und nicht zur generischen Agent-Schleife. Beispiele sind providerspezifische Request-Parameter nach der Transportauswahl, Auth-Profile-Präferenz, Prompt-Overlays und Follow-up-Fallback-Routing nach Model-/Profile-Failover.

Verwenden Sie **Agent-Harness-Hooks**, wenn das Verhalten zur Runtime gehört, die einen Turn ausführt. Harnesses können erfolgreiche, aber nicht nutzbare Versuchsergebnisse wie leere, nur aus Reasoning bestehende oder nur aus Planung bestehende Antworten klassifizieren, damit die äußere Model-Fallback-Policy die Retry-Entscheidung treffen kann.

Halten Sie beide Schnittstellen schmal:

- Core besitzt die Retry-/Fallback-Policy.
- Provider-Plugins besitzen providerspezifische Request-/Auth-/Routing-Hinweise.
- Harness-Plugins besitzen runtimespezifische Versuchsklassifizierung.
- Drittanbieter-Plugins geben Hinweise zurück, keine direkten Mutationen des Core-Zustands.

## Datei-Checkliste

Für eine neue Fähigkeit müssen Sie voraussichtlich diese Bereiche anfassen:

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

## Ausgearbeitetes Beispiel: Bilderzeugung

Bilderzeugung folgt der Standardform:

1. Core definiert `ImageGenerationProvider`.
2. Core stellt `registerImageGenerationProvider(...)` bereit.
3. Core stellt `runtime.imageGeneration.generate(...)` bereit.
4. Die Plugins `openai`, `google`, `fal` und `minimax` registrieren vendorgestützte Implementierungen.
5. Künftige Vendors registrieren denselben Vertrag, ohne Kanäle/Tools zu ändern.

Der Konfigurationsschlüssel ist absichtlich vom Routing für Bildanalyse getrennt:

- `agents.defaults.imageModel` analysiert Bilder.
- `agents.defaults.imageGenerationModel` erzeugt Bilder.

Halten Sie diese getrennt, damit Fallback und Policy explizit bleiben.

## Review-Checkliste

Prüfen Sie vor dem Ausliefern einer neuen Fähigkeit:

- Kein Kanal/Tool importiert Vendor-Code direkt.
- Der Runtime-Helper ist der gemeinsame Pfad.
- Mindestens ein Vertragstest prüft gebündelte Ownership.
- Konfigurations-Docs nennen das neue Model/den neuen Konfigurationsschlüssel.
- Plugin-Docs erklären die Ownership-Grenze.

Wenn ein PR die Fähigkeitsschicht überspringt und Vendor-Verhalten in einem Kanal/Tool hartcodiert, schicken Sie ihn zurück und definieren Sie zuerst den Vertrag.

## Verwandte Themen

- [Plugin-Interna](/de/plugins/architecture) — Fähigkeitsmodell, Ownership, Ladepipeline, Runtime-Helpers.
- [Plugins erstellen](/de/plugins/building-plugins) — Tutorial für das erste Plugin.
- [SDK-Übersicht](/de/plugins/sdk-overview) — Import-Map und API-Referenz zur Registrierung.
- [Skills erstellen](/de/tools/creating-skills) — ergänzende Oberfläche für Mitwirkende.
