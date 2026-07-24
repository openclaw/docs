---
permalink: /security/formal-verification/
read_when:
    - Überprüfung formaler Garantien oder Grenzen des Sicherheitsmodells
    - TLA+/TLC-Sicherheitsmodellprüfungen reproduzieren oder aktualisieren
summary: Maschinell geprüfte Sicherheitsmodelle für die risikoreichsten Pfade von OpenClaw.
title: Formale Verifikation (Sicherheitsmodelle)
x-i18n:
    generated_at: "2026-07-24T04:06:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 185ee5c1cff7325f10827330c0c7e55ddc3ca40caf6088d4c930ae5e090d6b27
    source_path: security/formal-verification.md
    workflow: 16
---

Die formalen Sicherheitsmodelle von OpenClaw (derzeit TLA+/TLC) liefern ein maschinell geprüftes Argument dafür, dass bestimmte Pfade mit dem höchsten Risiko – Autorisierung, Sitzungsisolation, Tool-Zugriffskontrolle und Sicherheit bei Fehlkonfigurationen – unter ausdrücklich genannten Annahmen die vorgesehenen Richtlinien durchsetzen.

> Hinweis: Einige ältere Links verweisen möglicherweise auf den früheren Projektnamen.

## Was dies ist

Eine ausführbare, angreifergesteuerte Suite für Sicherheitsregressionstests:

- Für jede Aussage gibt es eine ausführbare Modellprüfung über einen endlichen Zustandsraum.
- Für viele Aussagen gibt es ein zugehöriges negatives Modell, das für eine realistische Fehlerklasse eine Gegenbeispielspur erzeugt.

Dies ist **kein** Beweis dafür, dass OpenClaw in jeder Hinsicht sicher ist, und es verifiziert nicht die vollständige TypeScript-Implementierung.

## Speicherort der Modelle

Die Modelle werden in einem separaten Repository gepflegt: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Dieses Repository ist derzeit nicht erreichbar (GitHub gibt zum Zeitpunkt der Erstellung „Repository not found“ zurück). Falls es für Sie weiterhin nicht erreichbar ist, fragen Sie in den OpenClaw-Maintainer-Kanälen nach dem aktuellen Speicherort, bevor Sie davon ausgehen, dass die Modelle entfernt wurden.
</Note>

## Einschränkungen

- Dies sind Modelle, nicht die vollständige TypeScript-Implementierung – Abweichungen zwischen Modell und Code sind möglich.
- Die Ergebnisse sind auf den von TLC untersuchten Zustandsraum beschränkt. Ein grünes Ergebnis bedeutet keine Sicherheit über die modellierten Annahmen und Grenzen hinaus.
- Einige Aussagen beruhen auf ausdrücklichen Annahmen zur Umgebung (beispielsweise korrekte Bereitstellung und korrekte Konfigurationseingaben).

## Ergebnisse reproduzieren

Klonen Sie das Modell-Repository und führen Sie TLC aus:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ erforderlich (TLC wird auf der JVM ausgeführt).
# Das Repository enthält eine angeheftete tla2tools.jar und stellt bin/tlc sowie Make-Ziele bereit.

make <target>
```

Es gibt noch keine CI-Integration zurück in dieses Repository. Eine zukünftige Iteration könnte über CI ausgeführte Modelle mit öffentlichen Artefakten (Gegenbeispielspuren, Ausführungsprotokolle) oder einen gehosteten „Dieses Modell ausführen“-Workflow für kleine, begrenzte Prüfungen hinzufügen.

## Aussagen und Ziele

### Gateway-Erreichbarkeit und Fehlkonfiguration eines offenen Gateways

**Aussage:** Eine Bindung über die Loopback-Schnittstelle hinaus ohne Authentifizierung kann eine Kompromittierung aus der Ferne ermöglichen und erhöht die Angriffsfläche; gemäß den Annahmen des Modells blockiert ein Token oder Passwort nicht authentifizierte Angreifer.

| Ergebnis       | Ziele                                                            |
| -------------- | ---------------------------------------------------------------- |
| Grün           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Rot (erwartet) | `make gateway-exposure-v2-negative`                              |

Siehe auch `docs/gateway-exposure-matrix.md` im Modell-Repository.

### Node-Ausführungspipeline (Funktion mit dem höchsten Risiko)

**Aussage:** `exec host=node` erfordert (a) eine Positivliste für Node-Befehle zusammen mit deklarierten Befehlen und (b) eine Bestätigung in Echtzeit, sofern konfiguriert; im Modell werden Bestätigungen mit Tokens versehen, um eine Wiederverwendung zu verhindern.

| Ergebnis       | Ziele                                                           |
| -------------- | --------------------------------------------------------------- |
| Grün           | `make nodes-pipeline`, `make approvals-token`                   |
| Rot (erwartet) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Kopplungsspeicher (DM-Zugriffskontrolle)

**Aussage:** Kopplungsanfragen halten die TTL und die Obergrenzen für ausstehende Anfragen ein.

| Ergebnis       | Ziele                                                |
| -------------- | ---------------------------------------------------- |
| Grün           | `make pairing`, `make pairing-cap`                   |
| Rot (erwartet) | `make pairing-negative`, `make pairing-cap-negative` |

### Eingangs-Zugriffskontrolle (Erwähnungen und Umgehung durch Steuerbefehle)

**Aussage:** In Gruppenkontexten, die eine Erwähnung erfordern, kann ein nicht autorisierter Steuerbefehl die Zugriffskontrolle durch Erwähnungen nicht umgehen.

| Ergebnis       | Ziele                          |
| -------------- | ------------------------------ |
| Grün           | `make ingress-gating`          |
| Rot (erwartet) | `make ingress-gating-negative` |

### Routing und Isolation von Sitzungsschlüsseln

**Aussage:** DMs von verschiedenen Kommunikationspartnern werden nicht derselben Sitzung zugeordnet, sofern sie nicht ausdrücklich verknüpft oder entsprechend konfiguriert sind.

| Ergebnis       | Ziele                             |
| -------------- | --------------------------------- |
| Grün           | `make routing-isolation`          |
| Rot (erwartet) | `make routing-isolation-negative` |

## v1++-Modelle: Nebenläufigkeit, Wiederholungsversuche und Korrektheit der Ablaufverfolgung

Weiterführende Modelle, die die Genauigkeit bei realen Fehlermodi erhöhen: nicht atomare Aktualisierungen, Wiederholungsversuche und Nachrichtenauffächerung.

### Nebenläufigkeit und Idempotenz des Kopplungsspeichers

**Aussage:** Der Kopplungsspeicher erzwingt `MaxPending` und Idempotenz selbst bei verschachtelten Ausführungsabläufen – Prüfung und anschließendes Schreiben müssen atomar oder gesperrt erfolgen, und eine Aktualisierung darf keine Duplikate erzeugen. Konkret gilt: Gleichzeitige Anfragen dürfen `MaxPending` für einen Kanal nicht überschreiten, und wiederholte Anfragen oder Aktualisierungen für dieselbe `(channel, sender)` erzeugen keine doppelten aktiven, ausstehenden Zeilen.

| Ergebnis       | Ziele                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grün           | `make pairing-race` (atomare/gesperrte Obergrenzenprüfung), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                              |
| Rot (erwartet) | `make pairing-race-negative` (Wettlaufsituation bei nicht atomarer Begin-/Commit-Obergrenze), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Korrelation und Idempotenz der Eingangs-Ablaufverfolgung

**Aussage:** Die Aufnahme bewahrt die Korrelation der Ablaufverfolgung über die Auffächerung hinweg und ist bei Wiederholungsversuchen des Providers idempotent. Wenn ein externes Ereignis in mehrere interne Nachrichten umgewandelt wird, behält jeder Teil dieselbe Ablaufverfolgungs-/Ereignisidentität; Wiederholungsversuche führen nicht zu einer doppelten Verarbeitung. Wenn Ereignis-IDs des Providers fehlen, greift die Deduplizierung auf einen sicheren Schlüssel zurück (beispielsweise die Ablaufverfolgungs-ID), um zu verhindern, dass unterschiedliche Ereignisse verworfen werden.

| Ergebnis       | Ziele                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Grün           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Rot (erwartet) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Routing-Priorität von dmScope und identityLinks

**Aussage:** Die Priorität von `dmScope` und Identitätsverknüpfungen verhalten sich deterministisch: Der standardmäßige `main`-Geltungsbereich verwendet für die DMs eines einzelnen Eigentümers eine gemeinsame fortlaufende Sitzung (Standardeinstellung für persönliche Agenten), während jeder konfigurierte isolierende Geltungsbereich (`per-peer`, `per-channel-peer`, `per-account-channel-peer`) DM-Sitzungen strikt voneinander trennt. Kanalspezifische Überschreibungen von `dmScope` haben Vorrang vor globalen Standardeinstellungen; `identityLinks` führen Sitzungen nur innerhalb ausdrücklich verknüpfter Gruppen zusammen, nicht über nicht miteinander verbundene Kommunikationspartner hinweg. Bei Posteingängen mit mehreren Benutzern wird erwartet, dass ein isolierender Geltungsbereich aktiviert wird (die Sicherheitsprüfung der Laufzeit empfiehlt dies, wenn sie DM-Datenverkehr von mehreren Benutzern erkennt).

| Ergebnis       | Ziele                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Grün           | `make routing-precedence`, `make routing-identitylinks`                   |
| Rot (erwartet) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Verwandte Themen

- [Bedrohungsmodell](/de/security/THREAT-MODEL-ATLAS)
- [Zum Bedrohungsmodell beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
- [Reaktion auf Sicherheitsvorfälle](/de/security/incident-response)
