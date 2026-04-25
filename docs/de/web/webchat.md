---
read_when:
    - Fehlerbehebung oder Konfiguration des Zugriffs auf WebChat
summary: Loopback-WebChat-Static-Host und Gateway-WS-Nutzung für die Chat-UI
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Status: Die SwiftUI-Chat-UI für macOS/iOS kommuniziert direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chat-UI für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routing-Regeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.

## Schnellstart

1. Das Gateway starten.
2. Die WebChat-UI (macOS-/iOS-App) oder den Chat-Tab der Control UI öffnen.
3. Sicherstellen, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig Shared Secret,
   auch auf Loopback).

## So funktioniert es (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist zur Stabilität begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten weglassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` ist außerdem anzeige-normalisiert: nur zur Laufzeit vorhandener OpenClaw-Kontext,
  Wrapper für eingehende Umschläge, Inline-Tags für Zustellungsdirektiven
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, Klartext-XML-Payloads für Tool-Aufrufe
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und
  gekürzter Tool-Call-Blöcke) sowie auslaufende ASCII-/Full-Width-Modell-Steuertoken werden aus dem sichtbaren Text entfernt,
  und Assistenteneinträge, deren gesamter sichtbarer Text nur aus dem exakten
  Silent-Token `NO_REPLY` / `no_reply` besteht, werden weggelassen.
- `chat.inject` fügt direkt eine Assistentennotiz an das Transkript an und sendet sie an die UI (ohne Agentenlauf).
- Abgebrochene Läufe können teilweise Assistentenausgaben in der UI sichtbar lassen.
- Das Gateway speichert teilweise Assistententexte aus abgebrochenen Läufen im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruch-Metadaten.
- Der Verlauf wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Panel „Agents Tools“ in der Control UI

- Das Panel **Tools** unter `/agents` in der Control UI hat zwei getrennte Ansichten:
  - **Available Right Now** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Core-, Plugin- und kanalbezogener Tools.
  - **Tool Configuration** verwendet `tools.catalog` und bleibt auf Profile, Überschreibungen und
    Katalogsemantik fokussiert.
- Die Verfügbarkeit zur Laufzeit ist sitzungsbezogen. Wenn du Sitzungen für denselben Agenten wechselst, kann sich die Liste unter
  **Available Right Now** ändern.
- Der Konfigurationseditor impliziert keine Verfügbarkeit zur Laufzeit; effektiver Zugriff folgt weiterhin der
  Priorität der Richtlinien (`allow`/`deny`, pro Agent und Anbieter-/Kanal-Überschreibungen).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Du musst keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenanzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag dieses Limit überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Pro Anfrage kann der Client auch `maxChars` senden, um diesen Standardwert für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann bei Aktivierung Tailscale-Serve-Identity-Header verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **nicht auf Loopback beschränkten** Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Ziel für das Remote-Gateway.
- `session.*`: Standards für Sitzungsspeicher und Hauptschlüssel.

## Zugehörig

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
