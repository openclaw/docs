---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: 'Loopback-WebChat: statischer Host und Gateway-WS-Nutzung für die Chat-UI'
title: WebChat
x-i18n:
    generated_at: "2026-05-04T02:26:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Status: Die macOS/iOS-SwiftUI-Chat-UI kommuniziert direkt mit dem Gateway WebSocket.

## Was es ist

- Eine native Chat-UI für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routing-Regeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-UI (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Authentifizierungspfad für das Gateway konfiguriert ist (standardmäßig Shared-Secret,
   auch bei loopback).

## Funktionsweise (Verhalten)

- Die UI stellt eine Verbindung zum Gateway WebSocket her und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist zur Stabilität begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- `chat.history` folgt dem aktiven Transkriptzweig für moderne append-only Sitzungsdateien, sodass verworfene Rewrite-Zweige und ersetzte Prompt-Kopien in WebChat nicht gerendert werden.
- Compaction-Einträge werden als ausdrücklicher Trenner für komprimierten Verlauf gerendert. Der Trenner erklärt, dass frühere Turns in einem Checkpoint beibehalten werden, und verlinkt auf die Sitzungs-Checkpoint-Steuerungen, wo Operatoren die Ansicht vor der Compaction verzweigen oder wiederherstellen können, sofern ihre Berechtigungen dies erlauben.
- Die Control UI merkt sich die vom Gateway `sessionId`, die von `chat.history` zurückgegeben wurde, und schließt sie in nachfolgende `chat.send`-Aufrufe ein, sodass erneute Verbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fortsetzen, sofern der Benutzer keine Sitzung startet oder zurücksetzt.
- Die Control UI fasst doppelte laufende Übermittlungen für dieselbe Sitzung, Nachricht und Anhänge zusammen, bevor eine neue `chat.send`-Run-ID generiert wird; das Gateway dedupliziert weiterhin wiederholte Anfragen, die denselben Idempotency Key wiederverwenden.
- Workspace-Startdateien und ausstehende `BOOTSTRAP.md`-Anweisungen werden über den Project Context des System-Prompts des Agenten bereitgestellt und nicht in die WebChat-Benutzernachricht kopiert. Bootstrap-Kürzung fügt nur einen knappen Wiederherstellungshinweis im System-Prompt hinzu; detaillierte Zählwerte und Konfigurationsoptionen bleiben auf Diagnoseoberflächen.
- `chat.history` wird außerdem für die Anzeige normalisiert: Laufzeitreiner OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Zustellungsdirektiv-Tags
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, Plain-Text-Tool-Call-XML-
  Payloads (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie
  geleakte ASCII-/Vollbreiten-Modellsteuerungs-Token werden aus sichtbarem Text entfernt,
  und Assistenteneinträge, deren gesamter sichtbarer Text nur das exakte stille
  Token `NO_REPLY` / `no_reply` ist, werden ausgelassen.
- Als Reasoning markierte Antwort-Payloads (`isReasoning: true`) werden aus WebChat-Assistenteninhalten, Transkript-Replay-Text und Audio-Inhaltsblöcken ausgeschlossen, sodass reine Denk-Payloads nicht als sichtbare Assistentennachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistentennotiz direkt an das Transkript an und sendet sie an die UI (kein Agenten-Run).
- Abgebrochene Runs können teilweise Assistentenausgaben in der UI sichtbar lassen.
- Das Gateway persistiert abgebrochenen partiellen Assistententext im Transkriptverlauf, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruchmetadaten.
- Der Verlauf wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

### Transkript- und Zustellungsmodell

WebChat hat zwei getrennte Datenpfade:

- Die JSONL-Sitzungsdatei ist das dauerhafte Modell-/Laufzeittranskript. Für normale Agenten-Runs persistiert Pi über seinen Sitzungsmanager modell-sichtbare `user`-, `assistant`- und `toolResult`-Nachrichten. WebChat schreibt keinen beliebigen Zustellungs-, Status- oder Hilfstext in dieses Transkript.
- Gateway-`ReplyPayload`-Events sind die Live-Zustellungsprojektion. Sie können für WebChat-/Kanalanzeige, Block-Streaming, Direktiv-Tags, Medieneinbettung, TTS-/Audio-Flags und UI-Fallback-Verhalten normalisiert werden. Sie sind selbst nicht das kanonische Sitzungsprotokoll.
- WebChat injiziert Assistenten-Transkripteinträge nur, wenn das Gateway eine angezeigte Nachricht außerhalb eines normalen Pi-Assistenten-Turns besitzt: `chat.inject`, Nicht-Agenten-Befehlsantworten, abgebrochene partielle Ausgabe und von WebChat verwaltete Medien-Transkriptergänzungen.
- `chat.history` liest das gespeicherte Sitzungstranskript und wendet die WebChat-Anzeigeprojektion an. Wenn Live-Assistententext während eines Runs erscheint, aber nach dem erneuten Laden des Verlaufs verschwindet, prüfen Sie zuerst, ob die rohe JSONL den Assistententext enthält, dann ob die `chat.history`-Projektion ihn entfernt hat, und dann ob die optimistische Tail-Zusammenführung der Control UI den lokalen Zustellungszustand durch den persistierten Snapshot ersetzt hat.

Finale Antworten normaler Agenten-Runs sollten dauerhaft sein, weil Pi das Assistenten-`message_end` schreibt. Jeder Fallback, der eine zugestellte finale Payload in das Transkript spiegelt, muss zuerst vermeiden, einen Assistenten-Turn zu duplizieren, den Pi bereits geschrieben hat.

## Tools-Panel der Control UI für Agenten

- Das Tools-Panel `/agents` der Control UI hat zwei getrennte Ansichten:
  - **Jetzt verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt, was die aktuelle
    Sitzung zur Laufzeit tatsächlich verwenden kann, einschließlich Kern-, Plugin- und kanalverwalteter Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Überschreibungen und
    Katalogsemantik fokussiert.
- Laufzeitverfügbarkeit ist sitzungsbezogen. Der Wechsel von Sitzungen für denselben Agenten kann die
  Liste **Jetzt verfügbar** ändern.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; effektiver Zugriff folgt weiterhin der Policy-
  Präzedenz (`allow`/`deny`, Überschreibungen pro Agent sowie Provider/Kanal).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat-Optionen:

- `gateway.webchat.chatHistoryMaxChars`: maximale Zeichenzahl für Textfelder in `chat.history`-Antworten. Wenn ein Transkripteintrag dieses Limit überschreitet, kürzt das Gateway lange Textfelder und kann übergroße Nachrichten durch einen Platzhalter ersetzen. Pro Anfrage kann der Client auch `maxChars` senden, um diesen Standardwert für einen einzelnen `chat.history`-Aufruf zu überschreiben.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  Shared-Secret-WebSocket-Authentifizierung.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann Tailscale-
  Serve-Identity-Header verwenden, wenn aktiviert.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **non-loopback**-Proxyquelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Ziel für Remote-Gateway.
- `session.*`: Sitzungsspeicher und Standardwerte für Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
