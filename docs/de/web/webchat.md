---
read_when:
    - Debuggen oder Konfigurieren des WebChat-Zugriffs
summary: Statischer Host für Loopback WebChat und Gateway-WS-Nutzung für die Chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-05-03T06:43:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
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
2. Öffnen Sie die WebChat-Oberfläche (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig Shared Secret,
   auch bei loopback).

## Funktionsweise (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` folgt dem aktiven Transkriptzweig für moderne, nur anhängende Sitzungsdateien, sodass verworfene Rewrite-Zweige und ersetzte Prompt-Kopien nicht in WebChat gerendert werden.
- Compaction-Einträge werden als expliziter Trenner für kompaktierte Historie gerendert. Der Trenner erklärt, dass frühere Durchläufe in einem Checkpoint erhalten bleiben, und verlinkt auf die Checkpoint-Steuerungen für Sitzungen, in denen Operatoren die Ansicht vor der Compaction verzweigen oder wiederherstellen können, wenn ihre Berechtigungen dies zulassen.
- Die Control UI merkt sich die zugrunde liegende Gateway-`sessionId`, die von `chat.history` zurückgegeben wird, und schließt sie in nachfolgenden `chat.send`-Aufrufen ein, sodass erneute Verbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fortsetzen, sofern der Benutzer keine Sitzung startet oder zurücksetzt.
- Die Control UI fasst doppelte laufende Übermittlungen für dieselbe Sitzung, Nachricht und Anhänge zusammen, bevor eine neue `chat.send`-Run-ID erzeugt wird; das Gateway dedupliziert weiterhin wiederholte Anfragen, die denselben Idempotency-Key wiederverwenden.
- `chat.history` ist außerdem für die Anzeige normalisiert: Nur zur Laufzeit verwendeter OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Delivery-Directive-Tags
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, Klartext-XML-Payloads für Tool-Aufrufe
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` sowie abgeschnittener Tool-Aufrufblöcke) und
  durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken werden aus sichtbarem Text entfernt,
  und Assistenteneinträge, deren gesamter sichtbarer Text nur dem exakten stummen
  Token `NO_REPLY` / `no_reply` entspricht, werden ausgelassen.
- Als Reasoning markierte Antwort-Payloads (`isReasoning: true`) werden aus WebChat-Assistenteninhalten, Transkript-Replay-Text und Audio-Inhaltsblöcken ausgeschlossen, sodass reine Denk-Payloads nicht als sichtbare Assistentennachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistentennotiz direkt an das Transkript an und sendet sie an die UI (kein Agent-Run).
- Abgebrochene Runs können teilweise Assistentenausgaben in der UI sichtbar lassen.
- Das Gateway speichert abgebrochenen teilweisen Assistententext in der Transkripthistorie, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruchmetadaten.
- Die Historie wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Control UI-Agents-Tools-Bereich

- Der Tools-Bereich der Control UI unter `/agents` hat zwei separate Ansichten:
  - **Jetzt verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Kern-, Plugin- und kanalbezogener Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Überschreibungen und
    Katalogsemantik fokussiert.
- Die Laufzeitverfügbarkeit ist sitzungsbezogen. Das Wechseln von Sitzungen im selben Agent kann die
  Liste **Jetzt verfügbar** ändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; effektiver Zugriff folgt weiterhin der Richtlinienpriorität
  (`allow`/`deny`, pro Agent sowie Provider-/Kanal-Überschreibungen).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag dieses Limit überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Pro Anfrage kann der Client auch `maxChars` senden, um diesen Standard für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann Tailscale
  Serve-Identitätsheader verwenden, wenn aktiviert.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **non-loopback**-Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
