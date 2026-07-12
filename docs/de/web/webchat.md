---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: Statischer Loopback-WebChat-Host und Gateway-WS-Nutzung für die Chat-Benutzeroberfläche
title: WebChat
x-i18n:
    generated_at: "2026-07-12T16:01:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Status: Die macOS/iOS-SwiftUI-Chat-Oberfläche kommuniziert direkt mit dem Gateway-WebSocket. Kein eingebetteter Browser, kein lokaler statischer Server.

## Was es ist

- Eine native Chat-Oberfläche für das Gateway.
- Verwendet dieselben Sitzungen und Routingregeln wie andere Kanäle.
- Deterministisches Routing: Antworten gehen immer zurück an WebChat.
- Der Verlauf wird immer vom Gateway abgerufen (keine Überwachung lokaler Dateien). Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-Oberfläche (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig ein gemeinsames Geheimnis, auch bei Loopback).

## Funktionsweise

- Die Oberfläche stellt eine Verbindung zum Gateway-WebSocket her und verwendet die RPC-Methoden `chat.history`, `chat.send`, `chat.inject` und `chat.message.get`.
- `chat.history` ist aus Stabilitätsgründen begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen. API-Clients können pro Anfrage `maxChars` senden, um das Standardlimit für einen Aufruf zu überschreiben.
- Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann die Control UI bei Bedarf einen seitlichen Lesebereich öffnen und über `chat.message.get` den vollständigen, für die Anzeige normalisierten Eintrag abrufen, ohne die standardmäßige Verlaufsnutzlast zu vergrößern. `chat.message.get` verwendet denselben Transkriptzweig und dieselben Anzeigeregeln wie `chat.history`, zielt jedoch anhand von `messageId` auf einen einzelnen Eintrag und gibt einen zutreffenden Grund für die Nichtverfügbarkeit zurück, wenn der vollständige Inhalt nicht mehr zurückgegeben werden kann.
- `chat.history` folgt bei sitzungsbezogenen Dateien, an die nur angehängt wird, dem aktiven Transkriptzweig. Daher werden verworfene Neuschreibzweige und ersetzte Prompt-Kopien nicht in WebChat dargestellt.
- Compaction-Einträge werden als Trennlinie „Komprimierter Verlauf“ dargestellt. Sie erklärt, dass das komprimierte Transkript als Prüfpunkt erhalten bleibt, und bietet eine Aktion zum Öffnen der Sitzungsprüfpunkte (Verzweigen oder Wiederherstellen, sofern die Berechtigungen dies zulassen).
- Die Control UI merkt sich die vom Gateway über `chat.history` zurückgegebene zugrunde liegende `sessionId` und übermittelt sie bei nachfolgenden `chat.send`-Aufrufen. Dadurch setzen erneute Verbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fort, sofern der Benutzer keine Sitzung startet oder zurücksetzt.
- `chat.send` akzeptiert einen Idempotenzschlüssel (die Control UI verwendet die Ausführungs-ID). Das Gateway dedupliziert wiederholte Anfragen, die denselben Schlüssel erneut verwenden, sodass wiederholte oder doppelte, noch laufende Übermittlungen für dieselbe Sitzung/Nachricht/Anhänge keine zweite Ausführung erzeugen.
- Arbeitsbereich-Startdateien und ausstehende Anweisungen aus `BOOTSTRAP.md` werden über den Abschnitt `# Project Context` des Agent-System-Prompts bereitgestellt und nicht in die WebChat-Benutzernachricht kopiert. Wenn Bootstrap-Inhalte gekürzt werden, erhält der System-Prompt stattdessen einen kurzen „Hinweis zum Bootstrap-Kontext“; detaillierte Anzahlen und Konfigurationsoptionen verbleiben auf Diagnoseoberflächen.
- Die Anzeigenormalisierung von `chat.history` entfernt: ausschließlich zur Laufzeit verwendeten OpenClaw-Kontext, Wrapper eingehender Umschläge, eingebettete Auslieferungsdirektiven-Tags wie `[[reply_to_current]]`, `[[reply_to:<id>]]` und `[[audio_as_voice]]`, XML-Nutzlasten von Werkzeugaufrufen im Klartext (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, einschließlich gekürzter Blöcke) sowie offengelegte ASCII-/vollbreite Modell-Steuerungstoken. Assistenteneinträge, deren gesamter sichtbarer Text ausschließlich aus dem lautlosen Token `NO_REPLY` besteht (ohne Beachtung der Groß-/Kleinschreibung), werden ausgelassen.
- Als Reasoning gekennzeichnete Antwortnutzlasten (`isReasoning: true`) werden von Assistenteninhalten in WebChat, dem Text der Transkriptwiedergabe und Audioinhaltsblöcken ausgeschlossen, sodass reine Denkinhalte weder als sichtbare Assistentennachrichten noch als abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistentennotiz direkt an das Transkript an und überträgt sie an die Oberfläche (keine Agent-Ausführung).
- Bei abgebrochenen Ausführungen können teilweise erzeugte Assistentenausgaben in der Oberfläche sichtbar bleiben. Das Gateway speichert diesen Teiltext im Transkriptverlauf, wenn gepufferte Ausgaben vorhanden sind, und versieht den Eintrag mit Abbruchmetadaten.

### Transkript- und Auslieferungsmodell

WebChat verfügt über zwei getrennte Datenpfade:

- Die SQLite-Transkriptzeilen bilden das dauerhafte Modell-/Laufzeittranskript. Bei normalen Agent-Ausführungen speichert die eingebettete OpenClaw-Laufzeit die für das Modell sichtbaren Nachrichten `user`, `assistant` und `toolResult` über den Sitzungszugriff. WebChat schreibt keine beliebigen Auslieferungs-, Status- oder Hilfstexte in dieses Transkript.
- Gateway-`ReplyPayload`-Ereignisse bilden die Live-Auslieferungsprojektion: normalisiert für die Anzeige in WebChat/Kanälen, Block-Streaming, Direktiven-Tags, Medieneinbettung, TTS-/Audio-Kennzeichnungen und das Fallback-Verhalten der Oberfläche. Sie selbst sind nicht das kanonische Sitzungsprotokoll.
- Testumgebungen, die sichtbare Antworten über `tools.message` benötigen, verwenden WebChat weiterhin als interne Antwortsenke der aktuellen Ausführung. Ein zielloser `message.send` aus dieser aktiven WebChat-Ausführung wird in denselben Chat projiziert und in das Sitzungstranskript gespiegelt; WebChat wird dadurch nicht zu einem wiederverwendbaren ausgehenden Kanal und übernimmt niemals `lastChannel`.
- WebChat fügt Assistenteneinträge nur dann in das Transkript ein, wenn das Gateway eine angezeigte Nachricht außerhalb eines normalen eingebetteten Agent-Durchlaufs verwaltet: `chat.inject`, Befehlsantworten ohne Agent, abgebrochene Teilausgaben und von WebChat verwaltete Medientranskript-Ergänzungen.
- Wenn während einer Ausführung Live-Assistententext erscheint, aber nach dem erneuten Laden des Verlaufs verschwindet, prüfen Sie in dieser Reihenfolge: ob das SQLite-Transkript den Assistententext enthält, ob die Anzeigeprojektion von `chat.history` ihn entfernt hat und anschließend, ob die Zusammenführung des optimistischen Endes in der Control UI den lokalen Auslieferungsstatus durch den gespeicherten Snapshot ersetzt hat.

Abschließende Antworten normaler Agent-Ausführungen sollten dauerhaft sein, da die eingebettete Laufzeit das Assistenten-`message_end` schreibt. Jeder Fallback, der eine ausgelieferte abschließende Nutzlast in das Transkript spiegelt, muss zunächst vermeiden, einen Assistentendurchlauf zu duplizieren, den die eingebettete Laufzeit bereits geschrieben hat.

## Agent-Werkzeugbereich der Control UI

- Der Werkzeugbereich `/agents` der Control UI verfügt über eine Ansicht „Jetzt verfügbar“, die auf `tools.effective(sessionKey=...)` basiert: eine serverseitig abgeleitete, schreibgeschützte Projektion des Werkzeugbestands der aktuellen Sitzung, einschließlich Kern-, Plugin-, kanaleigener und bereits erkannter MCP-Server-Werkzeuge.
- Eine separate Ansicht zur Konfigurationsbearbeitung (basierend auf `tools.catalog`) deckt Profile, agentenspezifische Überschreibungen und Katalogsemantik ab.
- Die Laufzeitverfügbarkeit ist sitzungsbezogen. Ein Sitzungswechsel beim selben Agent kann die Liste „Jetzt verfügbar“ ändern. Wenn konfigurierte MCP-Server seit der letzten Erkennung noch nicht verbunden wurden oder sich geändert haben, zeigt der Bereich einen Hinweis an, anstatt über den Lesepfad stillschweigend MCP-Transporte zu starten.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; der effektive Zugriff folgt weiterhin der Richtlinienrangfolge (`allow`/`deny`, agentenspezifische sowie Provider-/Kanalüberschreibungen).

## Remote-Verwendung

- Im Remote-Modus wird der Gateway-WebSocket über SSH/Tailscale getunnelt.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat besitzt keinen dauerhaft gespeicherten Konfigurationsabschnitt. Das Gateway verwendet das integrierte Anzeigelimit von `chat.history`; API-Clients können pro Anfrage `maxChars` senden, um es für einen einzelnen Aufruf zu überschreiben. Die veraltete Konfiguration `channels.webchat` und `gateway.webchat` wurde außer Betrieb genommen; führen Sie `openclaw doctor --fix` aus, um sie zu entfernen.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  WebSocket-Authentifizierung mit gemeinsamem Geheimnis.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann bei Aktivierung Identitätsheader von Tailscale
  Serve verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **Nicht-Loopback**-Proxyquelle (siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für den Hauptschlüssel.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
