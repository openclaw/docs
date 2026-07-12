---
read_when:
    - Fehlerbehebung bei der macOS-WebChat-Ansicht oder dem local loopback-Port
summary: Wie die Mac-App den Gateway-WebChat einbettet und wie Sie ihn debuggen
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T01:51:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Die macOS-Menüleisten-App bettet die WebChat-Benutzeroberfläche als native SwiftUI-Ansicht ein. Sie verbindet sich mit dem Gateway und verwendet standardmäßig die primäre Sitzung für den ausgewählten Agenten (`main` oder `global`, wenn `session.scope` auf `global` gesetzt ist).

Das vollständige Chatfenster ist eine native geteilte Ansicht:

- **Sitzungsseitenleiste**: durchsuchbare Sitzungsliste mit Bereichen für angeheftete und kürzlich verwendete Sitzungen, Ungelesen-Markierungen und Kontextmenüs zum Anheften/Lösen, Kopieren des Sitzungsschlüssels und Löschen. Eine Schaltfläche in der Symbolleiste (oder Cmd-N) erstellt über `sessions.create` eine echte neue Sitzung.
- **Fenstersymbolleiste**: Ring für die Kontextnutzung (Token und Sitzungskosten, mit einer kompakten Aktion), Auswahl der Denktiefe, Modellauswahl und ein Menü für Sitzungsaktionen (neue Sitzung, aktualisieren, Sitzungsschlüssel kopieren, Transkript exportieren, Compaction durchführen, Verlauf löschen).
- **Transkript und Eingabefeld**: Nachrichten des Assistenten werden mit einem Avatar als Klartext dargestellt, Benutzernachrichten als farblich hervorgehobene Sprechblasen. Die Eingabe von `/` öffnet die durch `commands.list` bereitgestellte Autovervollständigung für Slash-Befehle mit Tastaturnavigation über Pfeiltasten/Tabulator/Eingabetaste/Escape. Klicken Sie mit der rechten Maustaste auf eine Nachricht, um sie zu kopieren.

Das an der Menüleiste verankerte Schnellchat-Panel behält das kompakte einspaltige Layout mit integrierten Auswahlfeldern bei.

- **Lokaler Modus**: stellt eine direkte Verbindung zum WebSocket des lokalen Gateway her.
- **Remote-Modus**: leitet den Steuerungsport des Gateway über SSH weiter und verwendet diesen Tunnel als Datenebene.

## Start und Fehlerbehebung

- Manuell: Lobster-Menü -> "Open Chat".
- Automatisches Öffnen für Tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` wird als veralteter Alias akzeptiert.)

- Protokolle: `./scripts/clawlog.sh` (Subsystem `ai.openclaw`, Kategorie `WebChatSwiftUI`).

## Funktionsweise der Anbindung

- Datenebene: Gateway-WS-Methoden `chat.history`, `chat.send`, `chat.abort`, `chat.inject` und Ereignisse `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` gibt ein für die Anzeige normalisiertes Transkript zurück: Inline-Direktiv-Tags werden aus dem sichtbaren Text entfernt, Klartext-XML-Nutzdaten von Werkzeugaufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, einschließlich abgeschnittener Blöcke) und versehentlich ausgegebene Modell-Steuerungstoken werden entfernt, reine Assistentenzeilen mit Stille-Token wie exakt `NO_REPLY`/`no_reply` werden ausgelassen und übergroße Zeilen können durch einen gekürzten Platzhalter ersetzt werden.
- Sitzung: verwendet standardmäßig die oben beschriebene primäre Sitzung; die Benutzeroberfläche kann zwischen Sitzungen wechseln.
- Das Onboarding verwendet eine eigene Sitzung, um die Ersteinrichtung getrennt zu halten.
- Offline-Cache: Die App verwaltet pro Gateway einen kleinen schreibgeschützten Cache der letzten Chatsitzungen und Transkripte (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): Bei einem Kaltstart wird das zuletzt bekannte Transkript sofort angezeigt und aktualisiert, sobald das Gateway antwortet. Kürzlich verwendete Chats bleiben auch ohne Verbindung durchsuchbar (das Senden bleibt deaktiviert, bis die Verbindung wiederhergestellt ist).

## Sicherheitsrelevante Schnittstellen

- Der Remote-Modus leitet ausschließlich den WebSocket-Steuerungsport des Gateway über SSH weiter.

## Bekannte Einschränkungen

- Die Benutzeroberfläche ist für Chatsitzungen optimiert, nicht als vollständige Browser-Sandbox.

## Verwandte Themen

- [WebChat](/de/web/webchat)
- [macOS-App](/de/platforms/macos)
