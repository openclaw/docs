---
read_when:
    - Debuggen oder Konfigurieren des WebChat-Zugriffs
summary: Statischer Loopback-WebChat-Host und Gateway-WS-Nutzung für die Chat-Benutzeroberfläche
title: Webchat
x-i18n:
    generated_at: "2026-05-02T23:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
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
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig Shared Secret,
   auch bei Loopback).

## Funktionsweise (Verhalten)

- Die UI verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send`, `chat.inject` und `chat.transcribeAudio`.
- `chat.history` ist zur Stabilität begrenzt: Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` folgt bei modernen Append-only-Sitzungsdateien dem aktiven Transkriptzweig, sodass verworfene Rewrite-Zweige und ersetzte Prompt-Kopien nicht in WebChat gerendert werden.
- Control UI merkt sich die vom Gateway über `chat.history` zurückgegebene zugrunde liegende `sessionId` und übergibt sie bei nachfolgenden `chat.send`-Aufrufen, sodass erneute Verbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fortsetzen, sofern der Benutzer keine Sitzung startet oder zurücksetzt.
- Control UI führt doppelte laufende Übermittlungen für dieselbe Sitzung, Nachricht und Anhänge zusammen, bevor eine neue `chat.send`-Lauf-ID erzeugt wird; das Gateway dedupliziert weiterhin wiederholte Anfragen, die denselben Idempotenzschlüssel wiederverwenden.
- `chat.history` wird auch für die Anzeige normalisiert: Nur zur Laufzeit verwendeter OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Tags für Zustellungsdirektiven
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, Nur-Text-XML-Nutzlasten von Tool-Aufrufen
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie
  durchgesickerte ASCII-/vollbreite Modell-Steuerungstoken werden aus sichtbarem Text entfernt,
  und Assistenteneinträge, deren gesamter sichtbarer Text ausschließlich das exakte stille
  Token `NO_REPLY` / `no_reply` ist, werden ausgelassen.
- Antwort-Nutzlasten mit Reasoning-Flag (`isReasoning: true`) werden aus WebChat-Assistenteninhalten, Transkript-Wiedergabetext und Audio-Inhaltsblöcken ausgeschlossen, sodass reine Denk-Nutzlasten nicht als sichtbare Assistentennachrichten oder abspielbares Audio erscheinen.
- `chat.transcribeAudio` ermöglicht serverseitiges Diktieren im Chat-Composer der Control UI. Der Browser zeichnet Mikrofon-Audio auf, sendet es als Base64 an das Gateway, und das Gateway führt die konfigurierte `tools.media.audio`-Pipeline aus. Das zurückgegebene Transkript wird in den Entwurf eingefügt; es wird kein Agentenlauf gestartet, bis der Benutzer ihn absendet.
- `chat.inject` hängt eine Assistentennotiz direkt an das Transkript an und sendet sie an die UI (kein Agentenlauf).
- Abgebrochene Läufe können teilweise Assistentenausgaben in der UI sichtbar halten.
- Gateway persistiert abgebrochenen partiellen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruchmetadaten.
- Der Verlauf wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Tools-Bereich für Control-UI-Agenten

- Der Tools-Bereich der Control UI unter `/agents` hat zwei getrennte Ansichten:
  - **Aktuell verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Core-, Plugin- und kanalverwalteter Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Überschreibungen und
    Katalogsemantik fokussiert.
- Laufzeitverfügbarkeit ist sitzungsbezogen. Der Wechsel zwischen Sitzungen desselben Agenten kann die Liste
  **Aktuell verfügbar** ändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; effektiver Zugriff folgt weiterhin der Richtlinienpriorität
  (`allow`/`deny`, Überschreibungen pro Agent sowie Provider-/Kanal-Overrides).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenanzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag diesen Grenzwert überschreitet, kürzt Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Der Client kann pro Anfrage auch `maxChars` senden, um diesen Standardwert für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann bei Aktivierung Tailscale-
  Serve-Identitätsheader verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **Nicht-Loopback**-Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für Hauptschlüssel.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
