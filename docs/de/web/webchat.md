---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: Statischer Loopback-WebChat-Host und Gateway-WS-Nutzung für die Chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-05-02T06:49:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: Die macOS/iOS-SwiftUI-Chatoberfläche spricht direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chatoberfläche für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routingregeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-UI (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig shared-secret,
   selbst bei Loopback).

## Funktionsweise (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` folgt dem aktiven Transkriptzweig für moderne Append-only-Sitzungsdateien, sodass verworfene Rewrite-Zweige und ersetzte Prompt-Kopien nicht in WebChat gerendert werden.
- Die Control UI merkt sich die vom `chat.history` zurückgegebene zugrunde liegende Gateway-`sessionId` und fügt sie nachfolgenden `chat.send`-Aufrufen hinzu, sodass Neuverbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fortsetzen, sofern der Benutzer keine Sitzung startet oder zurücksetzt.
- Die Control UI fasst doppelte laufende Übermittlungen für dieselbe Sitzung, Nachricht und Anhänge zusammen, bevor sie eine neue `chat.send`-Run-ID generiert; das Gateway dedupliziert weiterhin wiederholte Anfragen, die denselben Idempotenzschlüssel wiederverwenden.
- `chat.history` ist außerdem für die Anzeige normalisiert: nur zur Laufzeit vorhandener OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Tags für Zustellungsdirektiven
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, XML-Nutzdaten von Klartext-Tool-Aufrufen
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie
  durchgesickerte ASCII-/vollbreite Modell-Steuerungstoken werden aus sichtbarem Text entfernt,
  und Assistant-Einträge, deren gesamter sichtbarer Text nur aus dem exakten stillen
  Token `NO_REPLY` / `no_reply` besteht, werden ausgelassen.
- Als Reasoning markierte Antwortnutzdaten (`isReasoning: true`) werden von WebChat-Assistant-Inhalten, Transkript-Wiedergabetext und Audioinhaltsblöcken ausgeschlossen, sodass reine Denkinhalte nicht als sichtbare Assistant-Nachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistant-Notiz direkt an das Transkript an und sendet sie an die UI (kein Agent-Lauf).
- Abgebrochene Läufe können partielle Assistant-Ausgabe in der UI sichtbar lassen.
- Das Gateway speichert abgebrochenen partiellen Assistant-Text in der Transkript-Historie, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruchmetadaten.
- Die Historie wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Tools-Panel für Control-UI-Agents

- Das Tools-Panel `/agents` der Control UI hat zwei separate Ansichten:
  - **Derzeit verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich core-, Plugin- und kanaleigener Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Überschreibungen und
    Katalogsemantik fokussiert.
- Die Laufzeitverfügbarkeit ist sitzungsbezogen. Das Wechseln von Sitzungen auf demselben Agent kann die
  Liste **Derzeit verfügbar** ändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; der effektive Zugriff folgt weiterhin der Richtlinienpriorität
  (`allow`/`deny`, pro Agent und Provider-/Kanal-Überschreibungen).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenanzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag dieses Limit überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Pro Anfrage kann außerdem `maxChars` vom Client gesendet werden, um diesen Standardwert für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  shared-secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Chat-Tab der Browser-Control-UI kann bei Aktivierung Tailscale
  Serve-Identitäts-Header verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **Nicht-Loopback**-Proxyquelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für den Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
