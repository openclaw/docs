---
permalink: /security/formal-verification/
read_when:
    - Überprüfung formaler Garantien oder Einschränkungen des Sicherheitsmodells
    - TLA+/TLC-Sicherheitsmodellprüfungen reproduzieren oder aktualisieren
summary: Maschinell geprüfte Sicherheitsmodelle für die Pfade mit dem höchsten Risiko in OpenClaw.
title: Formale Verifikation (Sicherheitsmodelle)
x-i18n:
    generated_at: "2026-07-12T15:53:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

Die formalen Sicherheitsmodelle von OpenClaw (derzeit TLA+/TLC) liefern ein maschinell geprüftes Argument dafür, dass bestimmte Pfade mit dem höchsten Risiko — Autorisierung, Sitzungsisolation, Tool-Zugriffskontrolle und Sicherheit bei Fehlkonfigurationen — unter ausdrücklich genannten Annahmen die vorgesehenen Richtlinien durchsetzen.

> Hinweis: Einige ältere Links verweisen möglicherweise auf den früheren Projektnamen.

## Was dies ist

Eine ausführbare, angriffsorientierte Suite für Sicherheitsregressionstests:

- Für jede Aussage gibt es eine ausführbare Modellprüfung über einen endlichen Zustandsraum.
- Für viele Aussagen gibt es ein zugehöriges Negativmodell, das für eine realistische Fehlerklasse eine Gegenbeispielspur erzeugt.

Dies ist **kein** Beweis dafür, dass OpenClaw in jeder Hinsicht sicher ist, und es überprüft nicht die vollständige TypeScript-Implementierung.

## Speicherort der Modelle

Die Modelle werden in einem separaten Repository gepflegt: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Dieses Repository ist derzeit nicht erreichbar (GitHub gibt zum Zeitpunkt der Erstellung „Repository not found“ zurück). Falls es für Sie weiterhin nicht erreichbar ist, fragen Sie in den Maintainer-Kanälen von OpenClaw nach dem aktuellen Speicherort, bevor Sie annehmen, dass die Modelle entfernt wurden.
</Note>

## Einschränkungen

- Es handelt sich um Modelle, nicht um die vollständige TypeScript-Implementierung — Abweichungen zwischen Modell und Code sind möglich.
- Die Ergebnisse sind durch den von TLC untersuchten Zustandsraum begrenzt. Ein grünes Ergebnis bedeutet keine Sicherheit über die modellierten Annahmen und Grenzen hinaus.
- Einige Aussagen beruhen auf ausdrücklichen Annahmen zur Umgebung (beispielsweise eine korrekte Bereitstellung und korrekte Konfigurationseingaben).

## Ergebnisse reproduzieren

Klonen Sie das Modell-Repository und führen Sie TLC aus:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ erforderlich (TLC wird auf der JVM ausgeführt).
# Das Repository enthält eine festgelegte Version von tla2tools.jar und stellt bin/tlc sowie Make-Ziele bereit.

make <target>
```

Eine CI-Integration zurück in dieses Repository gibt es noch nicht. Eine zukünftige Version könnte über CI ausgeführte Modelle mit öffentlichen Artefakten (Gegenbeispielspuren, Ausführungsprotokolle) oder einen gehosteten „Dieses Modell ausführen“-Workflow für kleine, begrenzte Prüfungen ergänzen.

## Aussagen und Ziele

### Gateway-Exposition und Fehlkonfiguration eines offenen Gateways

**Aussage:** Eine Bindung außerhalb der Loopback-Schnittstelle ohne Authentifizierung kann eine Kompromittierung aus der Ferne ermöglichen und erhöht die Exposition. Ein Token oder Passwort blockiert gemäß den Annahmen des Modells nicht authentifizierte Angreifer.

| Ergebnis       | Ziele                                                            |
| -------------- | ---------------------------------------------------------------- |
| Grün           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Rot (erwartet) | `make gateway-exposure-v2-negative`                              |

Siehe auch `docs/gateway-exposure-matrix.md` im Modell-Repository.

### Node-Ausführungspipeline (Funktion mit dem höchsten Risiko)

**Aussage:** `exec host=node` erfordert (a) eine Positivliste für Node-Befehle sowie deklarierte Befehle und (b) eine aktuelle Genehmigung, sofern diese konfiguriert ist. Im Modell werden Genehmigungen mit Token versehen, um eine erneute Verwendung zu verhindern.

| Ergebnis       | Ziele                                                           |
| -------------- | --------------------------------------------------------------- |
| Grün           | `make nodes-pipeline`, `make approvals-token`                   |
| Rot (erwartet) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Kopplungsspeicher (DM-Zugriffskontrolle)

**Aussage:** Kopplungsanfragen berücksichtigen die TTL und Obergrenzen für ausstehende Anfragen.

| Ergebnis       | Ziele                                                |
| -------------- | ---------------------------------------------------- |
| Grün           | `make pairing`, `make pairing-cap`                   |
| Rot (erwartet) | `make pairing-negative`, `make pairing-cap-negative` |

### Eingangs-Zugriffskontrolle (Erwähnungen und Umgehung durch Steuerbefehle)

**Aussage:** In Gruppenkontexten, die eine Erwähnung erfordern, kann ein nicht autorisierter Steuerbefehl die Zugriffskontrolle für Erwähnungen nicht umgehen.

| Ergebnis       | Ziele                          |
| -------------- | ------------------------------ |
| Grün           | `make ingress-gating`          |
| Rot (erwartet) | `make ingress-gating-negative` |

### Routing und Isolation von Sitzungsschlüsseln

**Aussage:** DMs von unterschiedlichen Kommunikationspartnern werden nicht in derselben Sitzung zusammengeführt, sofern sie nicht ausdrücklich verknüpft oder entsprechend konfiguriert sind.

| Ergebnis       | Ziele                             |
| -------------- | --------------------------------- |
| Grün           | `make routing-isolation`          |
| Rot (erwartet) | `make routing-isolation-negative` |

## v1++-Modelle: Nebenläufigkeit, Wiederholungsversuche und Korrektheit von Spuren

Weiterführende Modelle, die die Übereinstimmung mit realen Fehlermodi verbessern: nicht atomare Aktualisierungen, Wiederholungsversuche und Nachrichten-Fan-out.

### Nebenläufigkeit und Idempotenz des Kopplungsspeichers

**Aussage:** Der Kopplungsspeicher erzwingt `MaxPending` und Idempotenz auch bei verzahnten Abläufen — Prüfung und anschließendes Schreiben müssen atomar beziehungsweise gesperrt erfolgen, und eine Aktualisierung darf keine Duplikate erzeugen. Konkret gilt: Gleichzeitige Anfragen dürfen `MaxPending` für einen Kanal nicht überschreiten, und wiederholte Anfragen oder Aktualisierungen für dasselbe `(channel, sender)` erzeugen keine doppelten aktiven ausstehenden Zeilen.

| Ergebnis       | Ziele                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grün           | `make pairing-race` (atomare/gesperrte Prüfung der Obergrenze), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                             |
| Rot (erwartet) | `make pairing-race-negative` (nicht atomare Begin-/Commit-Konkurrenzsituation bei der Obergrenze), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Korrelation und Idempotenz von Eingangsspuren

**Aussage:** Die Aufnahme erhält die Spurenkorrelation über Fan-out hinweg und ist bei Wiederholungsversuchen des Providers idempotent. Wenn ein externes Ereignis in mehrere interne Nachrichten aufgeteilt wird, behält jeder Teil dieselbe Spuren-/Ereignisidentität. Wiederholungsversuche führen nicht zu einer doppelten Verarbeitung. Wenn Ereignis-IDs des Providers fehlen, greift die Deduplizierung auf einen sicheren Schlüssel zurück (beispielsweise die Spuren-ID), damit unterschiedliche Ereignisse nicht verworfen werden.

| Ergebnis       | Ziele                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Grün           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Rot (erwartet) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Routing-Priorität von dmScope und identityLinks

**Aussage:** Das Routing hält DM-Sitzungen standardmäßig isoliert und führt Sitzungen nur dann zusammen, wenn dies über die Kanalpriorität und Identitätsverknüpfungen ausdrücklich konfiguriert ist. Kanalspezifische Überschreibungen von `dmScope` haben Vorrang vor globalen Standardwerten. `identityLinks` führen Sitzungen nur innerhalb ausdrücklich verknüpfter Gruppen zusammen, nicht über voneinander unabhängige Kommunikationspartner hinweg.

| Ergebnis       | Ziele                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Grün           | `make routing-precedence`, `make routing-identitylinks`                   |
| Rot (erwartet) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Verwandte Themen

- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
