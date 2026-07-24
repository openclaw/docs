---
read_when:
    - Fehlerbehebung bei der macOS-WebChat-Ansicht oder dem Loopback-Port
summary: Wie die Mac-App den Gateway-WebChat einbettet und wie Sie ihn debuggen
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-24T04:43:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b5e5983954e12d8546a01d089eda54e7eb0c60b4c92eff670f91797cd022c9fd
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Die macOS-Menüleisten-App bettet die WebChat-Benutzeroberfläche als native SwiftUI-Ansicht ein. Sie stellt eine Verbindung zum Gateway her und verwendet standardmäßig die primäre Sitzung für den ausgewählten Agenten (`main` oder `global`, wenn `session.scope` den Wert `global` hat).

Das vollständige Chatfenster ist eine native geteilte Ansicht:

- **Sitzungsseitenleiste**: durchsuchbare Sitzungsliste mit angehefteten, Gateway-gestützten Gruppen- und aktuellen Bereichen. Erzeugte untergeordnete Sitzungen werden innerhalb jedes Bereichs unter ihrer übergeordneten Sitzung verschachtelt; eingeklappte übergeordnete Sitzungen fassen laufende, fehlgeschlagene und ungelesene untergeordnete Sitzungen zusammen. Kontextmenüs unterstützen Sitzungsinformationen, Umbenennen, Anheften, Forken, Gelesen/Ungelesen, Archivieren/Wiederherstellen, Kopieren des Sitzungsschlüssels und Löschen. Die primäre Aktion für eine neue Sitzung (oder Umschalt-Befehl-N) erstellt sie sofort über `sessions.create`; im angrenzenden Options-Popover können ein Agent ausgewählt und ein verwalteter Worktree mit einer optionalen Basisreferenz angefordert werden.
- **Fenstersymbolleiste**: Ring für die Kontextnutzung (Token und Sitzungskosten, mit einer kompakten Aktion), Modellsteuerungen und ein Menü für Sitzungsaktionen. Modelle werden nach Provider gruppiert, wobei der Standard-Provider zuerst angezeigt wird; angeheftete und zuletzt verwendete Modelle bleiben oben. Die Steuerungen können die Denkstufe des Modells übernehmen oder überschreiben, die Ausführlichkeit von Tool-Aufrufen auswählen und schnelle Antworten aktivieren oder deaktivieren. Über das Menü kann die aktuelle Sitzung umbenannt oder geforkt sowie ihr Status für Anheften, Gelesen oder Archiviert aktualisiert werden. **Sitzungen…** (Umschalt-Befehl-S) öffnet die Verwaltung für aktive/archivierte Sitzungen zur Gateway-Suche, Gruppenverwaltung, Sitzungsprüfung, zum Umbenennen, Anheften, Archivieren und Wiederherstellen. Im Auswahlmodus können mehrere aktive Sitzungen angeheftet, losgelöst, archiviert oder gelöscht werden, wobei einzelne Fehler sichtbar bleiben. Separate Häkchen im Menü blenden die Schlussfolgerungen des Assistenten und die Tool-Aktivität ein oder aus; beide sind standardmäßig aktiviert und werden über App-Starts hinweg gespeichert.
- **Transkript und Eingabebereich**: Nachrichten des Assistenten werden als Klartext mit einem Avatar dargestellt, Nachrichten von Benutzern als farblich hervorgehobene Sprechblasen. Ausstehende Fragen des Agenten werden als native Karten mit Optionen zur Einfach- oder Mehrfachauswahl, Freitextantworten unter **Sonstiges**, Ablauf-Countdowns und gemeinsamem Endstatus dargestellt. Leere Chats bieten Einstiegs-Prompts für den Desktop. Durch Eingabe von `/` wird die von `commands.list` bereitgestellte Autovervollständigung für Slash-Befehle geöffnet, mit Tastaturnavigation über Pfeiltasten/Tabulator/Eingabetaste/Escape. Klicken Sie mit der rechten Maustaste auf eine Nachricht, um ihr sichtbares Markdown ohne verborgene Schlussfolgerungen zu kopieren. Bei gekürzten Nachrichten des Assistenten wird außerdem **Vollständige Nachricht öffnen** angeboten; dadurch wird ein auswählbarer Markdown-Reader geladen. Verwenden Sie **Anhören** für Gateway-TTS mit lokaler Sprachausgabe als Fallback.
- **Sprachsteuerungen**: Über den Eingabebereich kann der vorhandene macOS-Sprechmodus gestartet oder beendet werden, ohne dessen Menüleisten-Overlay zu ersetzen. Während der Sprechmodus aktiv ist, zeigt der Eingabebereich seinen Status für Zuhören/Denken/Sprechen, die Live-Audioaktivität und ein ausklappbares, fortlaufendes Transkript an. Klicken Sie mit der rechten Maustaste auf die Sprechtaste, um **Systemstandard** oder ein verbundenes Mikrofon auszuwählen; dieselbe Mikrofonauswahl wird für Voice Wake und Push-to-Talk verwendet. Wird ein ausgewähltes Mikrofon getrennt, wechselt die aktive Sprechsitzung auf den Systemstandard und versucht beim nächsten Start des Sprechmodus erneut, die Auswahl zu verwenden. Eine separate Mikrofonaktion zeichnet eine Sprachnachricht auf, wenn der Sprechmodus die Audioaufnahme nicht belegt.

Das verankerte kompakte Chatpanel der Menüleiste behält das kompakte einspaltige Layout bei und zeigt dieselben Steuerungen für Modell, Denken, Ausführlichkeit und schnelle Antworten direkt an, ergänzt um Einstiegs-Prompts, Sprechmodus, Sprachnachrichten und Anhören. Schlussfolgerungen des Assistenten und Tool-Aktivität bleiben in dieser kompakten Oberfläche ausgeblendet.

## Mehrere Gateway-Fenster

Öffnen Sie **Einstellungen → Gateways**, um wiederverwendbare Gateway-Profile hinzuzufügen oder zu entfernen. Jedes
Profil enthält einen privaten Netzwerkendpunkt vom Typ `ws://` oder einen sicheren Endpunkt vom Typ `wss://` sowie das
optionale Token oder Passwort; Anmeldedaten werden im macOS-Schlüsselbund gespeichert.
Sichere Profile verwalten jeweils eine eigene, durch das Systemvertrauen abgesicherte Zertifikatsanheftung bei der ersten Verwendung
und übernehmen `gateway.remote.tlsFingerprint` nicht vom primären Gateway.
Beim Entfernen eines Profils werden außerdem dessen geöffnete Fenster geschlossen und seine sekundäre
Verbindung beendet.

Wählen Sie **Ablage → Neues Gateway-Fenster…** oder drücken Sie Befehl-N und wählen Sie anschließend eines dieser
gespeicherten Profile aus. Die Auswahl merkt sich das zuletzt verwendete Profil. Jede
Auswahl erstellt ein neues unabhängiges Fenster, sodass dasselbe Gateway in
mehreren Fenstern mit unterschiedlichen aktiven Sitzungen und Navigationszuständen angezeigt werden kann.

Jedes gespeicherte Profil besitzt eine gemeinsam genutzte Gateway-Verbindung, einen Bereich für die Geräteauthentifizierung,
einen Transkript-Cache, einen Offline-Postausgang und Routen-Leases. Fenster dieses Profils
verwenden diese Ressourcen gemeinsam, können jedoch unabhängig voneinander navigiert werden. Fenster für
unterschiedliche Profile bleiben verbunden und führen Chats gleichzeitig aus.

Das konfigurierte Gateway der Menüleisten-App bleibt für die Fähigkeiten des Mac-Node
und den Sprechmodus zuständig. Zusätzliche Gateway-Fenster sind ausschließlich für Bedienpersonen vorgesehen, sodass ein
zweites Gateway globale Mikrofon- oder Gerätesteuerungen nicht unbemerkt auf ein anderes Ziel ausrichten kann.
Anhören/TTS und normale Chataktionen verwenden die eigene Gateway-Verbindung des Fensters.

## Quick-Chat-Leiste

Drücken Sie Wahl-Leertaste (⌥Leertaste) oder wählen Sie **Quick Chat** im Menü der Menüleiste, um einen schwebenden Eingabebereich für die Hauptsitzung zu öffnen. Ändern Sie das globale Tastenkürzel mit der Aufzeichnung unter **Einstellungen → Allgemein → Quick-Chat-Tastenkürzel**.

Quick Chat zeigt den Zielagenten an (Avatar oder Emoji, wobei der Name des Agenten als Platzhalter dient) und sendet an die Hauptsitzung dieses Agenten. Nachdem eine Sendung mit der Eingabetaste bestätigt wurde, bleibt die Leiste geöffnet und wird nach unten um die gestreamte Markdown-Antwort und das aktuelle Transkript erweitert. Das Eingabefeld der Leiste bleibt der Eingabebereich. Drücken Sie Befehl-Eingabetaste, um zu senden und dasselbe Ziel im vollständigen Chatfenster zu öffnen, Umschalt-Eingabetaste für einen Zeilenumbruch oder Escape, um die gesamte Leiste einschließlich des Antwortbereichs zu schließen. Ein Klick außerhalb schließt sie ebenfalls. Wenn relevante macOS-Berechtigungen fehlen, bietet eine angefügte Leiste die Aktionen **Erteilen** und **Nicht jetzt** an.

Verwenden Sie die Mikrofontaste, um in den Eingabebereich zu diktieren. Vorläufige Spracherkennungsergebnisse ersetzen den diktierten Abschnitt laufend, während bereits im Eingabebereich vorhandener Text erhalten bleibt. Drücken Sie die Taste erneut, die Eingabetaste oder Escape, um die Aufnahme zu beenden; durch Senden, Ausblenden oder den Verlust des Fokus von Quick Chat wird das Mikrofon ebenfalls freigegeben. Bei der ersten Verwendung wird der Zugriff auf das macOS-Mikrofon und die Spracherkennung angefordert. Quick Chat verwendet Apple Speech und kann dessen Netzwerkdienste nutzen; nur das passive Voice Wake erfordert eine Erkennung auf dem Gerät.

Die kompakte Modellsteuerung zeigt das aktuelle Modell und die Denkstufe der Zielsitzung an. Eine Modellauswahl aktualisiert diese Sitzung und bleibt daher dort bestehen, während eine Auswahl der Denkstufe nur für jede Nachricht gilt, die aus der aktuellen Quick-Chat-Darstellung gesendet wird. Lokale Auswahlen werden zurückgesetzt, wenn die Leiste ausgeblendet wird. Beim Wechseln des Agenten oder Auswählen einer aktuellen Sitzung bleiben explizite Auswahlen erhalten, der zugrunde liegende Modellzustand der neu ausgewählten Zielsitzung wird jedoch neu geladen.

Klicken Sie auf die Verlaufstaste, um aus den fünf zuletzt aktualisierten Sitzungen auszuwählen oder zu **Neue Nachricht an &lt;agent&gt;** zurückzukehren. Bei Auswahl einer aktuellen Sitzung wird an genau diese Sitzung gesendet und der Platzhalter in **Antwort in &lt;session&gt;** geändert. Durch Ausblenden von Quick Chat wird dieses temporäre Ziel auf die Hauptsitzung des ausgewählten Agenten zurückgesetzt; beim Wechseln des Agenten über das Avatar-Menü wird es ebenfalls gelöscht.

Mit Befehl-Eingabetaste wird die Unterhaltung des Agenten geöffnet, der die Sendung erhalten hat, auch wenn der Sitzungsbereich global ist.

Die Kamerataste öffnet ein Menü für **Fenster aufnehmen…** oder **Bereich aufnehmen…**. Bei der Fensteraufnahme wird jedes sichtbare Fenster beschriftet; bei der Bereichsaufnahme wird jedes Display abgedunkelt, während Sie einen Bereich aufziehen, und dessen aktuelle Größe angezeigt. Der ausgewählte Screenshot wird zusammen mit etwaigem eingegebenem Text als Bildunterschrift an den ausgewählten Agenten gesendet. Bei der ersten Verwendung wird der Zugriff auf die macOS-Bildschirmaufnahme angefordert. Escape, ein Klick auf einen leeren Bereich oder ein Klick ohne Aufziehen eines relevanten Bereichs bricht den Vorgang ab.

Verwenden Sie die Dokumenttext-Taste, um Text aus dem fokussierten Fenster der fokussierten App anzuhängen. Quick Chat zeigt das Ergebnis als entfernbaren Kontext-Chip an, statt den erfassten Text in den Eingabebereich einzufügen; beim Senden wird der Text des Chips an die ausgehende Nachricht angehängt und anschließend gelöscht. Dafür ist die macOS-Bedienungshilfen-Berechtigung erforderlich. Angehängter Text wird außerdem bei jedem Schließen von Quick Chat gelöscht, sodass Kontext aus einer Darstellung nicht in eine spätere Sendung gelangen kann.

Nachdem eine Antwort abgeschlossen ist, wählen Sie **In &lt;app&gt; einsetzen**, um den sichtbaren Text des Assistenten ohne verborgene Schlussfolgerungen in die allgemeine Zwischenablage zu kopieren und in die zuvor im Vordergrund befindliche App einzusetzen. Dafür ist die macOS-Bedienungshilfen-Berechtigung erforderlich. Die Aktion ersetzt den aktuellen Inhalt der Zwischenablage und blendet anschließend Quick Chat aus.

Deaktivieren Sie die Funktion vollständig unter **Einstellungen → Allgemein → Quick Chat**; derselbe Abschnitt enthält die Aufzeichnung für das Tastenkürzel.

- **Lokaler Modus**: stellt eine direkte Verbindung zum lokalen Gateway-WebSocket her.
- **Remote-Modus**: verwendet die konfigurierte direkte Route vom Typ `ws://`/`wss://` oder den von der App verwalteten SSH-Tunnel als Datenebene.

## Starten und Debugging

- Manuell: Lobster-Menü -> „Chat öffnen“.
- Automatisches Öffnen für Tests:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` wird als Legacy-Alias akzeptiert.)

- Protokolle: `./scripts/clawlog.sh` (Subsystem `ai.openclaw`, Kategorie `WebChatSwiftUI`).

## Technische Anbindung

- Datenebene: Gateway-WS-Methoden `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject` sowie `question.list` und `question.resolve` und die Ereignisse `chat`, `agent`, `presence`, `tick`, `health`; Fragekarten folgen den Ereignissen `question.requested` und `question.resolved` und werden nach erneuten Verbindungen über `question.list` aktualisiert.
- `chat.history` gibt ein für die Anzeige normalisiertes Transkript zurück: Inline-Direktiven-Tags werden aus dem sichtbaren Text entfernt, Klartext-XML-Nutzlasten von Tool-Aufrufen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, einschließlich gekürzter Blöcke) und offengelegte Modellsteuerungs-Token werden entfernt, reine Assistentenzeilen mit lautlosen Token wie exakt `NO_REPLY`/`no_reply` werden ausgelassen und übergroße Zeilen können durch einen Platzhalter für gekürzte Inhalte ersetzt werden.
- Sitzung: verwendet standardmäßig wie oben beschrieben die primäre Sitzung; über die Benutzeroberfläche kann zwischen Sitzungen gewechselt werden.
- Sitzungsgruppen: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` und `sessions.groups.delete` verwalten den Gruppenkatalog. Die Mitgliedschaft ist das über `sessions.patch` aktualisierte Sitzungsfeld `category`.
- Ungelesen-Status: Nachdem eine Sitzung aktiviert und ihr Live-Verlauf erfolgreich geladen wurde, entfernt die App die Ungelesen-Markierung dieser Sitzung. Fehlgeschlagene Ladevorgänge des Verlaufs entfernen sie nicht; ein vorübergehender Fehler beim Anwenden eines Patches wird bei der nächsten Aktivierung erneut versucht.
- Das Onboarding verwendet eine eigene Sitzung, um die Ersteinrichtung getrennt zu halten.
- Offline-Cache: Die App verwaltet pro Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`) einen kleinen schreibgeschützten Cache aktueller Chatsitzungen und Transkripte: Bei einem Kaltstart wird sofort das zuletzt bekannte Transkript angezeigt und aktualisiert, sobald das Gateway antwortet; aktuelle Chats bleiben auch ohne Verbindung durchsuchbar (das Senden bleibt deaktiviert, bis die Verbindung wiederhergestellt ist).

## Sicherheitsoberfläche

- Der Remote-Modus leitet ausschließlich den WebSocket-Steuerungsport des Gateways über SSH weiter.

## Bekannte Einschränkungen

- Die Benutzeroberfläche ist für Chatsitzungen optimiert, nicht als vollständige Browser-Sandbox.

## Verwandte Themen

- [WebChat](/de/web/webchat)
- [macOS-App](/de/platforms/macos)
