---
read_when:
    - Debuggen oder Konfigurieren des WebChat-Zugriffs
summary: Verwendung des statischen Hosts von local loopback WebChat und des Gateway-WS für die Chat-Benutzeroberfläche
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Status: Die macOS-/iOS-SwiftUI-Chat-Benutzeroberfläche spricht direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chat-Benutzeroberfläche für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routingregeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.

## Schnellstart

1. Das Gateway starten.
2. Die WebChat-Benutzeroberfläche (macOS-/iOS-App) oder den Chat-Tab der Control UI öffnen.
3. Sicherstellen, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig Shared Secret,
   auch auf local loopback).

## Wie es funktioniert (Verhalten)

- Die Benutzeroberfläche verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten weglassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` ist außerdem für die Anzeige normalisiert: nur zur Laufzeit vorhandener OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Zustellungsdirektiven-Tags
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, XML-
  Nutzlasten für Tool-Aufrufe im Klartext (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und gekürzte Tool-Call-Blöcke) sowie
  geleakte ASCII-/Full-Width-Modellsteuerungstoken werden aus dem sichtbaren Text entfernt,
  und Assistant-Einträge, deren gesamter sichtbarer Text nur das exakte stille
  Token `NO_REPLY` / `no_reply` ist, werden ausgelassen.
- Als Reasoning markierte Antwort-Nutzlasten (`isReasoning: true`) werden aus dem WebChat-Assistant-Inhalt, dem Text der Transkriptwiedergabe und Audio-Inhaltsblöcken ausgeschlossen, damit reine Denk-Nutzlasten nicht als sichtbare Assistant-Nachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt direkt eine Assistant-Notiz an das Transkript an und sendet sie an die Benutzeroberfläche (kein Agent-Lauf).
- Abgebrochene Läufe können teilweise Assistant-Ausgabe in der Benutzeroberfläche sichtbar lassen.
- Das Gateway speichert teilweise Assistant-Texte aus abgebrochenen Läufen im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruchmetadaten.
- Der Verlauf wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Tools-Bereich für Agents in der Control UI

- Der Tools-Bereich `/agents` der Control UI hat zwei getrennte Ansichten:
  - **Jetzt verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Core-, Plugin- und kanalbezogener Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Überschreibungen und
    Katalogsemantik fokussiert.
- Die Laufzeitverfügbarkeit ist sitzungsbezogen. Ein Sitzungswechsel auf demselben Agent kann die
  Liste **Jetzt verfügbar** verändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; effektiver Zugriff folgt weiterhin der Richtlinien-
  Priorität (`allow`/`deny`, pro-Agent- sowie Provider-/Kanal-Überschreibungen).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Du musst keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Configuration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenanzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag diesen Grenzwert überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Pro Anfrage kann der Client außerdem `maxChars` senden, um diesen Standardwert für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Verwandte globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Browser-Chat-Tab der Control UI kann bei Aktivierung
  Tailscale-Serve-Identitätsheader verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **nicht-local-loopback** Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Ziel des Remote-Gateways.
- `session.*`: Sitzungsspeicher und Standards für Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
