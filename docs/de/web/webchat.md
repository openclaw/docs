---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: Statischer Loopback-WebChat-Host und Gateway-WS-Nutzung für die Chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-04-30T07:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

Status: Die macOS/iOS-SwiftUI-Chat-UI kommuniziert direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chat-UI für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routing-Regeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-UI (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig gemeinsames Geheimnis,
   auch bei loopback).

## Funktionsweise (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist zur Stabilität begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` folgt bei modernen append-only Sitzungsdateien dem aktiven Transkriptzweig, sodass verworfene Rewrite-Zweige und ersetzte Prompt-Kopien in WebChat nicht gerendert werden.
- Die Control UI fasst doppelte laufende Übermittlungen für dieselbe Sitzung, Nachricht und dieselben Anhänge zusammen, bevor eine neue `chat.send`-Run-ID erzeugt wird; das Gateway dedupliziert weiterhin wiederholte Anfragen, die denselben Idempotenzschlüssel wiederverwenden.
- `chat.history` ist außerdem für die Anzeige normalisiert: rein laufzeitbezogener OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Tags für Zustellungsanweisungen
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, Klartext-XML-Payloads von Tool-Aufrufen
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie
  offengelegte ASCII-/vollbreite Modell-Steuerungstoken werden aus sichtbarem Text entfernt,
  und Assistant-Einträge, deren gesamter sichtbarer Text nur das exakte stille
  Token `NO_REPLY` / `no_reply` ist, werden ausgelassen.
- Als Reasoning markierte Antwort-Payloads (`isReasoning: true`) werden aus WebChat-Assistant-Inhalten, Transkript-Wiedergabetext und Audio-Inhaltsblöcken ausgeschlossen, sodass reine Denk-Payloads nicht als sichtbare Assistant-Nachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistant-Notiz direkt an das Transkript an und sendet sie an die UI (kein Agent-Run).
- Abgebrochene Runs können teilweise Assistant-Ausgabe in der UI sichtbar lassen.
- Das Gateway persistiert abgebrochenen teilweisen Assistant-Text in der Transkripthistorie, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruch-Metadaten.
- Die Historie wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Control-UI-Werkzeuge-Panel für Agents

- Das Werkzeuge-Panel der Control UI unter `/agents` hat zwei separate Ansichten:
  - **Derzeit verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich core-, Plugin- und kanalverwalteter Werkzeuge.
  - **Werkzeugkonfiguration** verwendet `tools.catalog` und bleibt auf Profile, Overrides und
    Katalogsemantik fokussiert.
- Laufzeitverfügbarkeit ist sitzungsbezogen. Der Wechsel von Sitzungen auf demselben Agent kann die
  Liste **Derzeit verfügbar** ändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; effektiver Zugriff folgt weiterhin der Richtlinienpriorität
  (`allow`/`deny`, Overrides pro Agent sowie Provider-/Kanal-Overrides).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenanzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag diese Grenze überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Der Client kann auch `maxChars` pro Anfrage senden, um diesen Standard für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  WebSocket-Authentifizierung mit gemeinsamem Geheimnis.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann Tailscale
  Serve-Identitätsheader verwenden, wenn aktiviert.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **non-loopback**-Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
