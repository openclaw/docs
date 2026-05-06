---
permalink: /security/formal-verification/
read_when:
    - Prüfung formaler Garantien oder Grenzen des Sicherheitsmodells
    - Reproduzieren oder Aktualisieren von TLA+/TLC-Sicherheitsmodellprüfungen
summary: Maschinell geprüfte Sicherheitsmodelle für die risikoreichsten Pfade von OpenClaw.
title: Formale Verifikation (Sicherheitsmodelle)
x-i18n:
    generated_at: "2026-05-06T07:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Diese Seite verfolgt die **formalen Sicherheitsmodelle** von OpenClaw (derzeit TLA+/TLC; weitere nach Bedarf).

> Hinweis: Einige ältere Links können auf den früheren Projektnamen verweisen.

**Ziel (Nordstern):** ein maschinengeprüftes Argument bereitstellen, dass OpenClaw seine
beabsichtigte Sicherheitsrichtlinie durchsetzt (Autorisierung, Sitzungsisolation, Tool-Gating und
Sicherheit bei Fehlkonfigurationen), unter expliziten Annahmen.

**Was dies ist (heute):** eine ausführbare, angreifergesteuerte **Security-Regression-Suite**:

- Jede Aussage hat eine ausführbare Modellprüfung über einen endlichen Zustandsraum.
- Viele Aussagen haben ein zugehöriges **negatives Modell**, das eine Gegenbeispiel-Ablaufspur für eine realistische Fehlerklasse erzeugt.

**Was dies (noch) nicht ist:** ein Beweis, dass „OpenClaw in jeder Hinsicht sicher ist“ oder dass die vollständige TypeScript-Implementierung korrekt ist.

## Wo die Modelle liegen

Modelle werden in einem separaten Repo gepflegt: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Wichtige Einschränkungen

- Dies sind **Modelle**, nicht die vollständige TypeScript-Implementierung. Abweichungen zwischen Modell und Code sind möglich.
- Ergebnisse sind durch den von TLC untersuchten Zustandsraum begrenzt; „grün“ impliziert keine Sicherheit über die modellierten Annahmen und Grenzen hinaus.
- Einige Aussagen beruhen auf expliziten Umgebungsannahmen (z. B. korrekte Bereitstellung, korrekte Konfigurationseingaben).

## Ergebnisse reproduzieren

Derzeit werden Ergebnisse reproduziert, indem das Modell-Repo lokal geklont und TLC ausgeführt wird (siehe unten). Eine zukünftige Iteration könnte Folgendes anbieten:

- CI-ausgeführte Modelle mit öffentlichen Artefakten (Gegenbeispiel-Ablaufspuren, Ausführungsprotokolle)
- einen gehosteten „Dieses Modell ausführen“-Workflow für kleine, begrenzte Prüfungen

Erste Schritte:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway-Exposition und Fehlkonfiguration eines offenen Gateway

**Aussage:** Eine Bindung über loopback hinaus ohne Auth kann eine entfernte Kompromittierung möglich machen / die Exposition erhöhen; Token/Passwort blockieren nicht authentifizierte Angreifer (gemäß den Modellannahmen).

- Grüne Läufe:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rot (erwartet):
  - `make gateway-exposure-v2-negative`

Siehe auch: `docs/gateway-exposure-matrix.md` im Modell-Repo.

### Node-Exec-Pipeline (Fähigkeit mit höchstem Risiko)

**Aussage:** `exec host=node` erfordert (a) eine Allowlist für Node-Befehle plus deklarierte Befehle und (b) Live-Genehmigung, wenn konfiguriert; Genehmigungen werden tokenisiert, um Replay zu verhindern (im Modell).

- Grüne Läufe:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rot (erwartet):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing-Speicher (DM-Gating)

**Aussage:** Pairing-Anfragen respektieren TTL und Obergrenzen für ausstehende Anfragen.

- Grüne Läufe:
  - `make pairing`
  - `make pairing-cap`
- Rot (erwartet):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress-Gating (Erwähnungen + Umgehung durch Steuerbefehl)

**Aussage:** In Gruppenkontexten, die eine Erwähnung erfordern, kann ein nicht autorisierter „Steuerbefehl“ das Erwähnungs-Gating nicht umgehen.

- Grün:
  - `make ingress-gating`
- Rot (erwartet):
  - `make ingress-gating-negative`

### Routing-/Sitzungsschlüssel-Isolation

**Aussage:** DMs von unterschiedlichen Peers fallen nicht in dieselbe Sitzung zusammen, es sei denn, dies ist explizit verknüpft/konfiguriert.

- Grün:
  - `make routing-isolation`
- Rot (erwartet):
  - `make routing-isolation-negative`

## v1++: zusätzliche begrenzte Modelle (Nebenläufigkeit, Wiederholungen, Trace-Korrektheit)

Dies sind Folgemodelle, die die Genauigkeit rund um reale Fehlermodi verbessern (nicht atomare Aktualisierungen, Wiederholungen und Nachrichten-Fan-out).

### Pairing-Speicher-Nebenläufigkeit / Idempotenz

**Aussage:** Ein Pairing-Speicher sollte `MaxPending` und Idempotenz selbst bei Interleavings erzwingen (d. h. „check-then-write“ muss atomar / gesperrt sein; Aktualisieren sollte keine Duplikate erzeugen).

Was das bedeutet:

- Bei gleichzeitigen Anfragen können Sie `MaxPending` für einen Kanal nicht überschreiten.
- Wiederholte Anfragen/Aktualisierungen für denselben `(channel, sender)` sollten keine doppelten live ausstehenden Zeilen erzeugen.

- Grüne Läufe:
  - `make pairing-race` (atomare/gesperrte Obergrenzenprüfung)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rot (erwartet):
  - `make pairing-race-negative` (nicht atomarer begin/commit-Obergrenzen-Wettlauf)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Ingress-Trace-Korrelation / Idempotenz

**Aussage:** Ingestion sollte die Trace-Korrelation über Fan-out hinweg erhalten und bei Provider-Wiederholungen idempotent sein.

Was das bedeutet:

- Wenn ein externes Ereignis zu mehreren internen Nachrichten wird, behält jeder Teil dieselbe Trace-/Ereignisidentität.
- Wiederholungen führen nicht zu doppelter Verarbeitung.
- Wenn Provider-Ereignis-IDs fehlen, fällt die Deduplizierung auf einen sicheren Schlüssel zurück (z. B. Trace-ID), um zu vermeiden, dass unterschiedliche Ereignisse verworfen werden.

- Grün:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rot (erwartet):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Routing-dmScope-Präzedenz + identityLinks

**Aussage:** Routing muss DM-Sitzungen standardmäßig isoliert halten und Sitzungen nur dann zusammenführen, wenn dies explizit konfiguriert ist (Kanalpräzedenz + Identitätsverknüpfungen).

Was das bedeutet:

- Kanalspezifische dmScope-Overrides müssen gegenüber globalen Standardwerten Vorrang haben.
- identityLinks sollten nur innerhalb explizit verknüpfter Gruppen zusammenführen, nicht über nicht verwandte Peers hinweg.

- Grün:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rot (erwartet):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Verwandt

- [Threat Model](/de/security/THREAT-MODEL-ATLAS)
- [Zum Threat Model beitragen](/de/security/CONTRIBUTING-THREAT-MODEL)
