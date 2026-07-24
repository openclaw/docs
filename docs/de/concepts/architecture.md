---
read_when:
    - Arbeiten am Gateway-Protokoll, an Clients oder Transporten
summary: WebSocket-Gateway-Architektur, Komponenten und Client-Abläufe
title: Gateway-Architektur
x-i18n:
    generated_at: "2026-07-24T03:48:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f8054bd87f738b957c24f8d6965d55365de2293d44902530a9ba778afa597cc7
    source_path: concepts/architecture.md
    workflow: 16
---

## Übersicht

- Ein einzelner langlebiger **Gateway** verwaltet alle Messaging-Oberflächen (WhatsApp über
  Baileys, Telegram über grammY, Slack, Discord, Signal, iMessage, WebChat).
- Control-Plane-Clients (macOS-App, CLI, Web-UI, Automatisierungen) verbinden sich über
  **WebSocket** auf dem konfigurierten Bind-Host mit dem Gateway (Standard:
  `127.0.0.1:18789`).
- **Nodes** (macOS/iOS/Android/headless) verbinden sich ebenfalls über **WebSocket**, deklarieren jedoch
  `role: node` mit expliziten Fähigkeiten/Befehlen.
- Ein Gateway pro Host; nur dort wird eine WhatsApp-Sitzung geöffnet.
- Der **Canvas-Host** wird vom Gateway-HTTP-Server unter folgenden Pfaden bereitgestellt:
  - `/__openclaw__/canvas/` (durch den Agenten bearbeitbares HTML/CSS/JS)
  - `/__openclaw__/a2ui/` (A2UI-Host)

  Er verwendet denselben Port wie der Gateway (Standard: `18789`).

## Komponenten und Abläufe

### Gateway (Daemon)

- Hält Provider-Verbindungen aufrecht.
- Stellt eine typisierte WS-API bereit (Anfragen, Antworten, Server-Push-Ereignisse).
- Validiert eingehende Frames anhand eines JSON-Schemas.
- Gibt Ereignisse wie `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron` aus.

### Clients (Mac-App / CLI / Webadministration)

- Eine WS-Verbindung pro Client.
- Senden Anfragen (`health`, `status`, `send`, `agent`, `system-presence`).
- Abonnieren Ereignisse (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / headless)

- Verbinden sich mit `role: node` mit **demselben WS-Server**.
- Stellen in `connect` eine Geräteidentität bereit; das Pairing ist **gerätebasiert** (Rolle `node`) und
  die Genehmigung wird im Geräte-Pairing-Speicher verwaltet.
- Stellen Befehle wie `canvas.*`, `camera.*`, `screen.record`, `location.get` bereit.

Protokolldetails: [Gateway-Protokoll](/de/gateway/protocol)

### WebChat

- Statische UI, die die Gateway-WS-API für den Chatverlauf und zum Senden verwendet.
- Bei Remote-Konfigurationen erfolgt die Verbindung über denselben SSH-/Tailscale-Tunnel wie bei anderen
  Clients.

## Verbindungslebenszyklus (einzelner Client)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: Anfrage:connect
    Gateway-->>Client: Antwort (ok)
    Note right of Gateway: oder Fehlerantwort + Schließen
    Note left of Client: payload=hello-ok<br>Momentaufnahme: Präsenz + Zustand

    Gateway-->>Client: Ereignis:presence
    Gateway-->>Client: Ereignis:tick

    Client->>Gateway: Anfrage:agent
    Gateway-->>Client: Antwort:agent<br>Bestätigung {runId, status:"accepted"}
    Gateway-->>Client: Ereignis:agent<br>(Streaming)
    Gateway-->>Client: Antwort:agent<br>abschließend {runId, status, summary}
```

## Übertragungsprotokoll (Zusammenfassung)

- Transport: WebSocket, Text-Frames mit JSON-Nutzdaten.
- Der erste Frame **muss** `connect` sein.
- Nach dem Handshake:
  - Anfragen: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Ereignisse: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` sind Erkennungsmetadaten und kein
  generierter Auszug jeder aufrufbaren Hilfsroute.
- Die Authentifizierung mit einem gemeinsamen Geheimnis verwendet abhängig vom konfigurierten Gateway-Authentifizierungsmodus `connect.params.auth.token` oder
  `connect.params.auth.password`.
- Identitätsbasierte Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder `gateway.auth.mode: "trusted-proxy"` außerhalb der Loopback-Schnittstelle
  erfüllen die Authentifizierung über Anfrage-Header
  statt über `connect.params.auth.*`.
- Bei privatem Eingang deaktiviert `gateway.auth.mode: "none"` die Authentifizierung mit gemeinsamem Geheimnis
  vollständig; halten Sie diesen Modus bei öffentlichen/nicht vertrauenswürdigen Eingängen deaktiviert.
- Idempotenzschlüssel sind für Methoden mit Nebenwirkungen (`send`, `agent`) erforderlich, damit
  Wiederholungsversuche sicher sind; der Server führt einen kurzlebigen Deduplizierungs-Cache.
- Nodes müssen `role: "node"` sowie Fähigkeiten/Befehle/Berechtigungen in `connect` angeben.

## Pairing und lokales Vertrauen

- Alle WS-Clients (Operatoren + Nodes) geben in `connect` eine **Geräteidentität** an.
- Neue Geräte-IDs erfordern eine Pairing-Genehmigung; der Gateway stellt für nachfolgende Verbindungen ein **Geräte-Token**
  aus.
- Direkte lokale Loopback-Verbindungen können automatisch genehmigt werden, um eine reibungslose Nutzung auf demselben Host
  zu gewährleisten.
- OpenClaw verfügt außerdem über einen eng begrenzten, Backend-/Container-lokalen Selbstverbindungspfad für
  vertrauenswürdige Hilfsabläufe mit gemeinsamem Geheimnis.
- Tailnet- und LAN-Verbindungen, einschließlich Tailnet-Bindings auf demselben Host, erfordern weiterhin
  eine ausdrückliche Pairing-Genehmigung.
- Alle Verbindungen müssen die Nonce `connect.challenge` signieren. Die Signaturnutzdaten `v3`
  binden außerdem `platform` und `deviceFamily`; der Gateway fixiert gekoppelte Metadaten bei
  erneuten Verbindungen und erfordert bei Metadatenänderungen ein erneutes Pairing.
- **Nicht lokale** Verbindungen erfordern weiterhin eine ausdrückliche Genehmigung.
- Die Gateway-Authentifizierung (`gateway.auth.*`) gilt weiterhin für **alle** lokalen oder
  entfernten Verbindungen.

Details: [Gateway-Protokoll](/de/gateway/protocol), [Pairing](/de/channels/pairing),
[Sicherheit](/de/gateway/security).

## Protokolltypisierung und Codegenerierung

- TypeBox-Schemas definieren das Protokoll.
- Das JSON-Schema wird aus diesen Schemas generiert.
- Swift-Modelle werden aus dem JSON-Schema generiert.

## Remote-Zugriff

- Bevorzugt: Tailscale oder VPN.
- Alternative: SSH-Tunnel

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
  ```

- Über den Tunnel gelten derselbe Handshake und dasselbe Authentifizierungs-Token.
- TLS und optionales Pinning können für WS in Remote-Konfigurationen aktiviert werden.

## Betriebsübersicht

- Start: `openclaw gateway` (im Vordergrund, protokolliert nach stdout).
- Zustand: `health` über WS (auch in `hello-ok` enthalten).
- Überwachung: launchd/systemd für automatische Neustarts.

## Invarianten

- Genau ein Gateway steuert pro Host eine einzelne Baileys-Sitzung.
- Der Handshake ist obligatorisch; jeder erste Frame, der kein JSON oder keine Verbindungsanfrage ist, führt zum sofortigen Schließen.
- Ereignisse werden nicht erneut wiedergegeben; Clients müssen bei Lücken eine Aktualisierung durchführen.

## Verwandte Themen

- [Agentenschleife](/de/concepts/agent-loop) — detaillierter Ausführungszyklus des Agenten
- [Gateway-Protokoll](/de/gateway/protocol) — WebSocket-Protokollvertrag
- [Warteschlange](/de/concepts/queue) — Befehlswarteschlange und Nebenläufigkeit
- [Sicherheit](/de/gateway/security) — Vertrauensmodell und Härtung
