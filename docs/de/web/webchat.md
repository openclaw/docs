---
read_when:
    - WebChat-Zugriff debuggen oder konfigurieren
summary: Statischer Loopback-WebChat-Host und Gateway-WS-Nutzung für die Chat-Benutzeroberfläche
title: WebChat
x-i18n:
    generated_at: "2026-07-24T05:04:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19c301af1eb1b28650849cdd90924805dd0f5189516693505d9b75f62197007f
    source_path: web/webchat.md
    workflow: 16
---

Status: Die macOS/iOS-Chat-Benutzeroberfläche auf Basis von SwiftUI kommuniziert direkt mit dem Gateway-WebSocket. Kein eingebetteter Browser, kein lokaler statischer Server.

## Was es ist

- Eine native Chat-Benutzeroberfläche für das Gateway.
- Verwendet dieselben Sitzungen und Routingregeln wie andere Kanäle.
- Deterministisches Routing: Antworten werden immer an WebChat zurückgesendet.
- Der Verlauf wird immer vom Gateway abgerufen (keine Überwachung lokaler Dateien). Wenn das Gateway nicht erreichbar ist, ist WebChat schreibgeschützt.

## Schnellstart

1. Starten Sie das Gateway.
2. Öffnen Sie die WebChat-Benutzeroberfläche (macOS/iOS-App) oder den Chat-Tab der Control UI.
3. Stellen Sie sicher, dass ein gültiger Gateway-Authentifizierungspfad konfiguriert ist (standardmäßig ein gemeinsam verwendetes Geheimnis, auch bei Loopback).

## Funktionsweise

- Die Benutzeroberfläche stellt eine Verbindung zum Gateway-WebSocket her und verwendet die RPC-Methoden `chat.history`, `chat.send`, `chat.inject` und `chat.message.get`.
- `chat.history` ist zur Gewährleistung der Stabilität begrenzt: Das Gateway kann lange Textfelder kürzen, umfangreiche Metadaten auslassen und übergroße Einträge durch `[chat.history omitted: message too large]` ersetzen. API-Clients können pro Anfrage ein `maxChars` senden, um das Standardlimit für einen einzelnen Aufruf zu überschreiben.
- Wenn eine sichtbare Assistentennachricht in `chat.history` gekürzt wurde, kann die Control UI einen seitlichen Lesebereich öffnen und den vollständigen, für die Anzeige normalisierten Eintrag bei Bedarf über `chat.message.get` abrufen, ohne die standardmäßige Verlaufsnutzlast zu erhöhen. `chat.message.get` verwendet denselben Transkriptzweig und dieselben Anzeigeregeln wie `chat.history`, richtet sich jedoch anhand von `messageId` an einen einzelnen Eintrag und gibt einen zutreffenden Grund für die Nichtverfügbarkeit zurück, wenn der vollständige Inhalt nicht mehr zurückgegeben werden kann.
- `chat.history` folgt bei ausschließlich erweiterbaren Sitzungsdateien dem aktiven Transkriptzweig, sodass verworfene Neuschreibungszweige und ersetzte Prompt-Kopien nicht in WebChat dargestellt werden.
- Compaction-Einträge werden als Trennlinie „Komprimierter Verlauf“ dargestellt. Sie erläutert, dass das komprimierte Transkript als Prüfpunkt erhalten bleibt, und bietet eine Aktion zum Öffnen der Sitzungsprüfpunkte (Verzweigen oder Wiederherstellen, sofern die Berechtigungen dies zulassen).
- Die Control UI merkt sich die zugrunde liegende Gateway-`sessionId`, die von `chat.history` zurückgegeben wird, und schließt sie in nachfolgende `chat.send`-Aufrufe ein. Dadurch setzen erneute Verbindungen und Seitenaktualisierungen dieselbe gespeicherte Unterhaltung fort, sofern die Person nicht eine Sitzung startet oder zurücksetzt.
- Beim Senden im Vordergrund wird außerdem das Blatt des angezeigten Zweigs aus dem dargestellten Verlauf als `expectedLeafEntryId` einbezogen. Falls ein anderer Client zuvor den Zweig gewechselt hat, stellt die Control UI die Nachricht zur Prüfung zurück und aktualisiert das Transkript, statt sie im neuen Zweig zu veröffentlichen. Bei erneuten Verbindungen und Wiederholungen aus dem wiederhergestellten Postausgang wird diese Vorbedingung nach dem Abgleich des aktuellen Verlaufs absichtlich ausgelassen.
- `chat.send` akzeptiert einen Idempotenzschlüssel (die Control UI verwendet die Ausführungs-ID). Das Gateway dedupliziert wiederholte Anfragen, die denselben Schlüssel wiederverwenden, sodass erneut versuchte oder doppelte laufende Übermittlungen für dieselbe Sitzung/Nachricht/dieselben Anhänge keine zweite Ausführung erzeugen.
- Beim Antworten auf eine bestimmte Nachricht (Rechtsklick → Reply) wird die Transkript-ID des Ziels als `replyToId` in `chat.send` gesendet. Das Gateway löst diese Nachricht aus dem Sitzungsverlauf auf und ergänzt dieselben kanalunabhängigen Antwortkontext-Metadaten, die Discord-Antworten verwenden: Agenten sehen `has_reply_context` sowie den nicht vertrauenswürdigen Block „Antwortziel der aktuellen Benutzernachricht“ mit Absenderbezeichnung und Inhalt. (Bei WebChat-Prompts bleiben flüchtige Unterhaltungs-IDs wie `reply_to_id` gemäß der bestehenden byte-stabilen Prompt-Richtlinie für direkte WebChat-Sitzungen unterdrückt.) Antwortziele ohne dauerhaft gespeicherte Transkript-ID (beispielsweise ausstehende Sendevorgänge) verwenden ersatzweise ein Inline-Zitat im Nachrichtentext.
- Arbeitsbereich-Startdateien und ausstehende `BOOTSTRAP.md`-Anweisungen werden über den Abschnitt `# Project Context` des Agenten-System-Prompts bereitgestellt und nicht in die WebChat-Benutzernachricht kopiert. Wenn Bootstrap-Inhalte gekürzt werden, erhält der System-Prompt stattdessen einen kurzen „Hinweis zum Bootstrap-Kontext“; detaillierte Anzahlen und Konfigurationsoptionen verbleiben auf Diagnoseoberflächen.
- Die Anzeigenormalisierung in `chat.history` entfernt: ausschließlich zur Laufzeit verwendeten OpenClaw-Kontext, Wrapper eingehender Umschläge, Inline-Tags für Zustellungsanweisungen wie `[[reply_to_current]]`, `[[reply_to:<id>]]` und `[[audio_as_voice]]`, XML-Nutzlasten von Werkzeugaufrufen im Klartext (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, einschließlich gekürzter Blöcke) sowie offengelegte Modellsteuerungstoken in ASCII- oder Vollbreitenschreibweise. Assistenteneinträge, deren gesamter sichtbarer Text nur aus dem stillen Token `NO_REPLY` besteht (ohne Beachtung der Groß-/Kleinschreibung), werden ausgelassen.
- Als Reasoning gekennzeichnete Antwortnutzlasten (`isReasoning: true`) werden aus den WebChat-Assistenteninhalten, dem Text bei der Transkriptwiedergabe und den Audioinhaltsblöcken ausgeschlossen, sodass reine Denkinhaltsnutzlasten nicht als sichtbare Assistentennachrichten oder abspielbares Audio erscheinen.
- `chat.inject` hängt eine Assistentennotiz direkt an das Transkript an und überträgt sie an die Benutzeroberfläche (keine Agentenausführung).
- Bei abgebrochenen Ausführungen kann eine teilweise Assistentenausgabe in der Benutzeroberfläche sichtbar bleiben. Das Gateway speichert diesen Teiltext im Transkriptverlauf, wenn eine gepufferte Ausgabe vorhanden ist, und kennzeichnet den Eintrag mit Abbruchmetadaten.

### Transkript- und Zustellungsmodell

WebChat verfügt über zwei getrennte Datenpfade:

- Die SQLite-Transkriptzeilen bilden das dauerhafte Modell-/Laufzeittranskript. Bei normalen Agentenausführungen speichert die eingebettete OpenClaw-Laufzeit die für das Modell sichtbaren Nachrichten `user`, `assistant` und `toolResult` über den Sitzungszugriff. WebChat schreibt keine beliebigen Zustellungs-, Status- oder Hilfstexte in dieses Transkript.
- Gateway-`ReplyPayload`-Ereignisse bilden die Live-Zustellungsprojektion: normalisiert für die Anzeige in WebChat/Kanälen, Block-Streaming, Anweisungstags, Medieneinbettung, TTS-/Audio-Kennzeichnungen und das Ausweichverhalten der Benutzeroberfläche. Sie selbst sind nicht das kanonische Sitzungsprotokoll.
- Testumgebungen, die sichtbare Antworten über `tools.message` erfordern, verwenden WebChat weiterhin als interne Antwortsenke der aktuellen Ausführung. Ein zielloses `message.send` aus dieser aktiven WebChat-Ausführung wird in denselben Chat projiziert und in das Sitzungstranskript gespiegelt. WebChat wird dadurch nicht zu einem wiederverwendbaren ausgehenden Kanal und übernimmt niemals `lastChannel`.
- WebChat fügt Assistenten-Transkripteinträge nur dann ein, wenn das Gateway eine angezeigte Nachricht außerhalb einer normalen eingebetteten Agentenrunde verwaltet: `chat.inject`, Antworten auf Befehle ohne Agenten, abgebrochene Teilausgaben und von WebChat verwaltete Medienergänzungen des Transkripts.
- Wenn während einer Ausführung Live-Assistententext erscheint, aber nach dem Neuladen des Verlaufs verschwindet, prüfen Sie in dieser Reihenfolge: ob das SQLite-Transkript den Assistententext enthält, ob die Anzeigeprojektion `chat.history` ihn entfernt hat und anschließend, ob die Optimistic-Tail-Zusammenführung der Control UI den lokalen Zustellungszustand durch den gespeicherten Snapshot ersetzt hat.

Abschließende Antworten normaler Agentenausführungen sollten dauerhaft sein, da die eingebettete Laufzeit die Assistenten-`message_end` schreibt. Jeder Ausweichmechanismus, der eine zugestellte endgültige Nutzlast in das Transkript spiegelt, muss zunächst verhindern, dass eine von der eingebetteten Laufzeit bereits geschriebene Assistentenrunde dupliziert wird.

## Agenten-Werkzeugbereich der Control UI

- Der Werkzeugbereich `/agents` der Control UI verfügt über eine Ansicht „Derzeit verfügbar“, die auf `tools.effective(sessionKey=...)` basiert: eine vom Server abgeleitete, schreibgeschützte Projektion des Werkzeugbestands der aktuellen Sitzung, einschließlich Kern-, Plugin-, kanaleigener und bereits erkannter MCP-Server-Werkzeuge.
- Eine separate Ansicht zur Konfigurationsbearbeitung (basierend auf `tools.catalog`) deckt Profile, agentenspezifische Überschreibungen und Katalogsemantik ab.
- Die Laufzeitverfügbarkeit gilt pro Sitzung. Ein Sitzungswechsel beim selben Agenten kann die Liste „Derzeit verfügbar“ ändern. Wenn konfigurierte MCP-Server seit der letzten Erkennung noch nicht verbunden wurden oder sich geändert haben, zeigt der Bereich einen Hinweis an, anstatt MCP-Transporte unbemerkt über den Lesepfad zu starten.
- Der Konfigurationseditor impliziert keine Laufzeitverfügbarkeit; der effektive Zugriff folgt weiterhin der Richtlinienrangfolge (`allow`/`deny` sowie agenten- und provider-/kanalspezifische Überschreibungen).

## Remote-Nutzung

- Im Remote-Modus wird der Gateway-WebSocket über SSH/Tailscale getunnelt.
- Sie müssen keinen separaten WebChat-Server ausführen.

## Konfigurationsreferenz (WebChat)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

WebChat besitzt keinen dauerhaft gespeicherten Konfigurationsabschnitt. Das Gateway verwendet das integrierte Anzeigelimit `chat.history`; API-Clients können pro Anfrage `maxChars` senden, um es für einen einzelnen Aufruf zu überschreiben. Die veraltete Konfiguration `channels.webchat` und `gateway.webchat` wurde eingestellt; führen Sie `openclaw doctor --fix` aus, um sie zu entfernen.

Zugehörige globale Optionen:

- `gateway.port`, `gateway.bind`: WebSocket-Host/-Port.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  WebSocket-Authentifizierung mit gemeinsam verwendetem Geheimnis.
- `gateway.auth.allowTailscale`: Der Chat-Tab der browserbasierten Control UI kann bei Aktivierung
  Tailscale-Serve-Identitätsheader verwenden.
- `gateway.auth.mode: "trusted-proxy"`: Reverse-Proxy-Authentifizierung für Browser-Clients hinter einer identitätsbewussten **Nicht-Loopback**-Proxyquelle (siehe [Authentifizierung über vertrauenswürdige Proxys](/de/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: Remote-Gateway-Ziel.
- `session.*`: Sitzungsspeicher und Standardwerte für den Hauptschlüssel.

## Verwandte Themen

- [Control UI](/de/web/control-ui)
- [Dashboard](/de/web/dashboard)
