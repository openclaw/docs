---
read_when:
    - Fehlerbehebung bei der Mac-WebChat-Ansicht oder dem Loopback-Port
summary: Wie die Mac-App den Gateway-WebChat einbettet und wie Sie ihn debuggen
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T15:38:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Die macOS-Menüleisten-App bettet die WebChat-UI als native SwiftUI-Ansicht ein. Sie stellt eine Verbindung zum Gateway her und verwendet standardmäßig die primäre Sitzung für den ausgewählten Agenten (`main` oder `global`, wenn `session.scope` den Wert `global` hat).

Das vollständige Chatfenster ist eine native geteilte Ansicht:

- **Sitzungsseitenleiste**: durchsuchbare Sitzungsliste mit Bereichen für angeheftete und kürzlich verwendete Sitzungen, Ungelesen-Markierungen und Kontextmenüs zum Anheften/Lösen, Kopieren des Sitzungsschlüssels und Löschen. Eine Schaltfläche in der Symbolleiste (oder Cmd-N) erstellt über `sessions.create` eine echte neue Sitzung.
- **Fenstersymbolleiste**: Ring für die Kontextnutzung (Token und Sitzungskosten, mit einer kompakten Aktion), Auswahl der Denkstufe, Modellauswahl und ein Menü für Sitzungsaktionen (neue Sitzung, aktualisieren, Sitzungsschlüssel kopieren, Transkript exportieren, komprimieren, Verlauf löschen).
- **Transkript und Eingabebereich**: Assistentennachrichten werden mit einem Avatar als Klartext dargestellt, Benutzernachrichten als farblich hervorgehobene Sprechblasen. Die Eingabe von `/` öffnet die von `commands.list` bereitgestellte Autovervollständigung für Slash-Befehle mit Tastaturnavigation über Pfeiltasten/Tabulator/Eingabetaste/Escape. Klicken Sie mit der rechten Maustaste auf eine Nachricht, um sie zu kopieren.

Das an der Menüleiste verankerte Schnellchat-Panel behält das kompakte einspaltige Layout mit eingebetteten Auswahlfeldern bei.

- **Lokaler Modus**: stellt eine direkte Verbindung zum lokalen Gateway-WebSocket her.
- **Remote-Modus**: leitet den Gateway-Steuerport über SSH weiter und verwendet diesen Tunnel als Datenebene.

## Start und Fehlerbehebung

- Manuell: Lobster-Menü -> "Open Chat".
- Automatisches Öffnen für Tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` wird als veralteter Alias akzeptiert.)

- Protokolle: `./scripts/clawlog.sh` (Subsystem `ai.openclaw`, Kategorie `WebChatSwiftUI`).

## Technische Anbindung

- Datenebene: Gateway-WS-Methoden `chat.history`, `chat.send`, `chat.abort`, `chat.inject` und Ereignisse `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` gibt ein für die Anzeige normalisiertes Transkript zurück: Eingebettete Direktiven-Tags werden aus dem sichtbaren Text entfernt, Klartext-XML-Nutzdaten von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, einschließlich abgeschnittener Blöcke) sowie offengelegte Modell-Steuerungstoken werden entfernt, reine Assistentenzeilen mit Stille-Token wie exakt `NO_REPLY`/`no_reply` werden ausgelassen und übergroße Zeilen können durch einen Platzhalter für abgeschnittene Inhalte ersetzt werden.
- Sitzung: verwendet standardmäßig die primäre Sitzung wie oben beschrieben; in der UI kann zwischen Sitzungen gewechselt werden.
- Das Onboarding verwendet eine eigene Sitzung, damit die Ersteinrichtung getrennt bleibt.
- Offline-Cache: Die App verwaltet pro Gateway einen kleinen schreibgeschützten Cache der letzten Chatsitzungen und Transkripte (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): Bei einem Kaltstart wird sofort das zuletzt bekannte Transkript angezeigt und aktualisiert, sobald das Gateway antwortet; zudem können kürzlich verwendete Chats auch ohne Verbindung durchsucht werden (das Senden bleibt deaktiviert, bis die Verbindung wiederhergestellt ist).

## Sicherheitsrelevante Oberfläche

- Der Remote-Modus leitet ausschließlich den Gateway-WebSocket-Steuerport über SSH weiter.

## Bekannte Einschränkungen

- Die UI ist für Chatsitzungen optimiert, nicht als vollständige Browser-Sandbox.

## Verwandte Themen

- [WebChat](/de/web/webchat)
- [macOS-App](/de/platforms/macos)
