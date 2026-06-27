---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: Statischer Loopback-WebChat-Host und Gateway-WS-Nutzung für Chat-UI
title: Webchat
x-i18n:
    generated_at: "2026-06-27T18:23:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Status: Die macOS/iOS-SwiftUI-Chat-Oberfläche spricht direkt mit dem Gateway-WebSocket.

## Was es ist

- Eine native Chat-Oberfläche für das Gateway (kein eingebetteter Browser und kein lokaler statischer Server).
- Verwendet dieselben Sitzungen und Routing-Regeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-Oberfläche (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig gemeinsames Geheimnis,
   selbst bei loopback).

## Funktionsweise (Verhalten)

- Die Oberfläche verbindet sich mit dem Gateway-WebSocket und verwendet `chat.history`, `chat.send` und `chat.inject`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen.
- Wenn eine sichtbare Assistant-Nachricht in `chat.history` gekürzt wurde, kann die Control UI einen seitlichen Reader öffnen und den vollständigen anzeigebereinigten Eintrag bei Bedarf über `chat.message.get` abrufen, ohne die standardmäßige History-Nutzlast zu vergrößern.
- `chat.history` folgt dem aktiven Transcript-Zweig für moderne sitzungsdateien, an die nur angehängt wird, sodass verworfene Rewrite-Zweige und überholte Prompt-Kopien in WebChat nicht gerendert werden.
- Compaction-Einträge werden als expliziter Trenner für kompaktierte History gerendert. Der Trenner erklärt, dass das kompaktierte Transcript als Checkpoint erhalten bleibt, und verlinkt auf die Checkpoint-Steuerungen der Sitzungen, wo Operators bei entsprechender Berechtigung von dieser kompaktierten Ansicht abzweigen oder sie wiederherstellen können.
- Die Control UI merkt sich die vom Gateway über `chat.history` zurückgegebene zugrunde liegende `sessionId` und fügt sie nachfolgenden `chat.send`-Aufrufen hinzu, sodass Wiederverbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fortsetzen, sofern die Person keine Sitzung startet oder zurücksetzt.
- Die Control UI fasst doppelte laufende Übermittlungen für dieselbe Sitzung, Nachricht und Anhänge zusammen, bevor eine neue `chat.send`-Run-ID erzeugt wird; das Gateway dedupliziert weiterhin wiederholte Anfragen, die denselben Idempotency Key wiederverwenden.
- Workspace-Startdateien und ausstehende `BOOTSTRAP.md`-Anweisungen werden über den Project Context des Agent-System-Prompts bereitgestellt und nicht in die WebChat-Benutzernachricht kopiert. Bootstrap-Kürzung fügt nur einen knappen Wiederherstellungshinweis im System-Prompt hinzu; detaillierte Zählungen und Konfigurationsregler bleiben auf Diagnoseoberflächen.
- `chat.history` ist außerdem anzeigebereinigt: Nur zur Laufzeit verwendeter OpenClaw-Kontext,
  eingehende Envelope-Wrapper, Inline-Delivery-Directive-Tags
  wie `[[reply_to_*]]` und `[[audio_as_voice]]`, XML-Nutzlasten für Tool-Aufrufe in Klartext
  (einschließlich `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke) sowie
  durchgesickerte ASCII-/vollbreite Modellsteuerungstokens werden aus sichtbarem Text entfernt,
  und Assistant-Einträge, deren gesamter sichtbarer Text nur aus dem exakten stillen
  Token `NO_REPLY` / `no_reply` besteht, werden ausgelassen.
- Als Reasoning gekennzeichnete Antwortnutzlasten (`isReasoning: true`) werden von WebChat-Assistant-Inhalten, Transcript-Replay-Text und Audio-Inhaltsblöcken ausgeschlossen, sodass reine Denk-Nutzlasten nicht als sichtbare Assistant-Nachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistant-Notiz direkt an das Transcript an und sendet sie an die Oberfläche (kein Agent-Run).
- Abgebrochene Runs können teilweise Assistant-Ausgabe in der Oberfläche sichtbar lassen.
- Das Gateway persistiert abgebrochenen partiellen Assistant-Text in der Transcript-History, wenn gepufferte Ausgabe vorhanden ist, und markiert diese Einträge mit Abbruch-Metadaten.
- History wird immer vom Gateway abgerufen (keine lokale Dateiüberwachung).
- Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

### Transcript- und Delivery-Modell

WebChat hat zwei getrennte Datenpfade:

- Die Sitzungs-JSONL-Datei ist das dauerhafte Modell-/Runtime-Transcript. Bei normalen Agent-Runs persistiert die eingebettete OpenClaw-Runtime modell-sichtbare `user`-, `assistant`- und `toolResult`-Nachrichten über ihren Sitzungsmanager. WebChat schreibt keine beliebigen Delivery-, Status- oder Hilfstexte in dieses Transcript.
- Gateway-`ReplyPayload`-Ereignisse sind die Live-Delivery-Projektion. Sie können für WebChat-/Kanalanzeige, Block-Streaming, Directive-Tags, Medieneinbettung, TTS-/Audio-Flags und UI-Fallback-Verhalten normalisiert werden. Sie sind selbst nicht das kanonische Sitzungsprotokoll.
- Harnesses, die sichtbare Antworten über `tools.message` benötigen, verwenden WebChat weiterhin als internen Source-Reply-Sink des aktuellen Runs. Ein zielloses `message.send` aus diesem aktiven WebChat-Run wird in denselben Chat projiziert und ins Sitzungs-Transcript gespiegelt; WebChat wird nicht zu einem wiederverwendbaren ausgehenden Kanal und erbt niemals `lastChannel`.
- WebChat fügt Assistant-Transcript-Einträge nur ein, wenn das Gateway eine angezeigte Nachricht außerhalb eines normalen eingebetteten Agent-Turns besitzt: `chat.inject`, Nicht-Agent-Befehlsantworten, abgebrochene partielle Ausgabe und von WebChat verwaltete Medien-Transcript-Ergänzungen.
- `chat.history` liest das gespeicherte Sitzungs-Transcript und wendet die WebChat-Anzeigeprojektion an. Wenn während eines Runs Live-Assistant-Text erscheint, aber nach dem Neuladen der History verschwindet, prüfen Sie zuerst, ob die rohe JSONL den Assistant-Text enthält, dann, ob die `chat.history`-Projektion ihn entfernt hat, und dann, ob die optimistic-tail-Zusammenführung der Control UI lokalen Delivery-State durch den persistierten Snapshot ersetzt hat.
- `chat.message.get` verwendet dieselben Transcript-Zweig- und Anzeigeprojektionsregeln wie `chat.history`, einschließlich Active-Agent-Scoping, zielt aber auf einen einzelnen Transcript-Eintrag per `messageId` und gibt einen ehrlichen Nichtverfügbarkeitsgrund zurück, wenn der vollständige Inhalt nicht mehr zurückgegeben werden kann.

Endgültige Antworten normaler Agent-Runs sollten dauerhaft sein, weil die eingebettete Runtime das Assistant-`message_end` schreibt. Jeder Fallback, der eine zugestellte finale Nutzlast in das Transcript spiegelt, muss zuerst vermeiden, einen Assistant-Turn zu duplizieren, den die eingebettete Runtime bereits geschrieben hat.

## Tools-Bereich für Control-UI-Agents

- Der Tools-Bereich der Control UI unter `/agents` hat zwei getrennte Ansichten:
  - **Aktuell verfügbar** verwendet `tools.effective(sessionKey=...)` und zeigt eine serverabgeleitete
    schreibgeschützte Projektion des aktuellen Sitzungsinventars, einschließlich Core-, Plugin-, kanalverwalteter
    und bereits entdeckter MCP-Server-Tools.
  - **Tool-Konfiguration** verwendet `tools.catalog` und bleibt auf Profile, Overrides und
    Katalogsemantik fokussiert.
- Runtime-Verfügbarkeit ist sitzungsbezogen. Ein Sitzungswechsel auf demselben Agent kann die Liste
  **Aktuell verfügbar** ändern. Wenn konfigurierte MCP-Server noch nicht verbunden wurden oder seit der letzten Discovery
  geändert wurden, zeigt der Bereich einen Hinweis an, statt MCP-Transporte stillschweigend
  aus dem Lesepfad zu starten.
- Der Konfigurationseditor impliziert keine Runtime-Verfügbarkeit; effektiver Zugriff folgt weiterhin der Policy-
  Präzedenz (`allow`/`deny`, Overrides pro Agent und Provider/Kanal).

## Remote-Nutzung

- Der Remote-Modus tunnelt den Gateway-WebSocket über SSH/Tailscale.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat hat keinen persistierten Konfigurationsabschnitt. Das Gateway verwendet das integrierte Anzeigelimit von `chat.history`; API-Clients können pro Anfrage `maxChars` senden, um es für einen einzelnen `chat.history`-Aufruf zu überschreiben. Die Legacy-Konfiguration `channels.webchat` und `gateway.webchat` ist außer Betrieb genommen; führen Sie `openclaw doctor --fix` aus, um sie zu entfernen.

Verwandte globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  WebSocket-Authentifizierung mit gemeinsamem Geheimnis.
- `gateway.auth.allowTailscale`: Der Chat-Tab der Browser-Control-UI kann Tailscale
  Serve-Identity-Header verwenden, wenn dies aktiviert ist.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **non-loopback** Proxy-Quelle (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für Hauptschlüssel.

## Verwandt

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
