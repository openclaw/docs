---
read_when: Finding which docs page covers a topic before reading the page
summary: Generierte Überschriftenzuordnung für OpenClaw-Dokumentationsseiten
title: Dokumentationsübersicht
x-i18n:
    generated_at: "2026-07-12T15:17:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 691c999d749d88c4c350c4b6dd197a57418dd915587a73e1bbeb6d54b45061de
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw-Dokumentationsübersicht

Diese Datei wird aus den Überschriften in `docs/**/*.md` und `docs/**/*.mdx` generiert, um Agenten die Navigation im Dokumentationsbaum zu erleichtern.
Bearbeiten Sie sie nicht manuell; führen Sie `pnpm docs:map:gen` aus.

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Überschriften:
  - H2: Runtime-Struktur
  - H2: Grenzen
  - H2: Manifeste
  - H2: Runtime-Auswahl
  - H2: Verwandte Themen

## announcements/bluebubbles-imessage.md

- Route: /announcements/bluebubbles-imessage
- Überschriften:
  - H1: Entfernung von BlueBubbles und der imsg-Pfad für iMessage
  - H2: Was sich geändert hat
  - H2: Was zu tun ist
  - H2: Migrationshinweise
  - H2: Siehe auch

## auth-credential-semantics.md

- Route: /auth-credential-semantics
- Überschriften:
  - H2: Stabile Ursachencodes für Prüfungen
  - H2: Token-Anmeldedaten
  - H3: Eignungsregeln
  - H3: Auflösungsregeln
  - H2: Portabilität von Agentenkopien
  - H2: Reine Konfigurationsrouten für die Authentifizierung
  - H2: Explizite Filterung der Authentifizierungsreihenfolge
  - H2: Auflösung des Prüfungsziels
  - H2: Ermittlung externer CLI-Anmeldedaten
  - H2: OAuth-Schutzrichtlinie für SecretRef
  - H2: Mit Altsystemen kompatible Nachrichtenübermittlung
  - H2: Verwandte Themen

## automation/auth-monitoring.md

- Route: /automation/auth-monitoring
- Überschriften:
  - H2: Verwandte Themen

## automation/clawflow.md

- Route: /automation/clawflow
- Überschriften:
  - H2: Verwandte Themen

## automation/cron-jobs.md

- Route: /automation/cron-jobs
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise von Cron
  - H2: Zeitplantypen
  - H3: Tag des Monats und Wochentag verwenden ODER-Logik
  - H2: Ereignisauslöser (Bedingungsüberwachungen)
  - H2: Nutzdaten
  - H3: Optionen für Agentendurchläufe
  - H3: Befehlsnutzdaten
  - H2: Ausführungsarten
  - H2: Zustellung und Ausgabe
  - H3: Fehlerbenachrichtigungen
  - H3: Ausgabesprache
  - H2: CLI-Beispiele
  - H2: Aufträge verwalten
  - H2: Webhooks
  - H3: Authentifizierung
  - H2: Gmail-PubSub-Integration
  - H3: Einrichtung mit dem Assistenten (empfohlen)
  - H3: Automatischer Start des Gateways
  - H3: Manuelle einmalige Einrichtung
  - H3: Überschreiben des Gmail-Modells
  - H2: Konfiguration
  - H2: Fehlerbehebung
  - H3: Befehlsabfolge
  - H2: Verwandte Themen

## automation/cron-vs-heartbeat.md

- Route: /automation/cron-vs-heartbeat
- Überschriften:
  - H2: Verwandte Themen

## automation/gmail-pubsub.md

- Route: /automation/gmail-pubsub
- Überschriften:
  - H2: Verwandte Themen

## automation/hooks.md

- Route: /automation/hooks
- Überschriften:
  - H2: Die richtige Oberfläche auswählen
  - H2: Schnellstart
  - H2: Ereignistypen
  - H2: Hooks schreiben
  - H3: Hook-Struktur
  - H3: Format von HOOK.md
  - H3: Handler-Implementierung
  - H3: Wichtige Aspekte des Ereigniskontexts
  - H2: Hook-Ermittlung
  - H3: Hook-Pakete
  - H2: Mitgelieferte Hooks
  - H3: Details zu session-memory
  - H3: Konfiguration von bootstrap-extra-files
  - H3: Details zu command-logger
  - H3: Details zu compaction-notifier
  - H3: Details zu boot-md
  - H2: Plugin-Hooks
  - H2: Konfiguration
  - H2: CLI-Referenz
  - H2: Bewährte Vorgehensweisen
  - H2: Fehlerbehebung
  - H3: Hook wurde nicht ermittelt
  - H3: Hook ist nicht geeignet
  - H3: Hook wird nicht ausgeführt
  - H2: Verwandte Themen

## automation/index.md

- Route: /automation
- Überschriften:
  - H2: Schnelle Entscheidungshilfe
  - H3: Geplante Aufgaben (Cron) im Vergleich zu Heartbeat
  - H2: Grundlegende Konzepte
  - H3: Geplante Aufgaben (Cron)
  - H3: Aufgaben
  - H3: Abgeleitete Verpflichtungen
  - H3: Task Flow
  - H3: Daueraufträge
  - H3: Hooks
  - H3: Heartbeat
  - H2: Zusammenspiel
  - H2: Verwandte Themen

## automation/poll.md

- Route: /automation/poll
- Überschriften:
  - H2: Verwandte Themen

## automation/standing-orders.md

- Route: /automation/standing-orders
- Überschriften:
  - H2: Warum Daueraufträge?
  - H2: Funktionsweise
  - H2: Aufbau eines Dauerauftrags
  - H2: Daueraufträge und Cron-Aufträge
  - H2: Beispiele
  - H3: Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)
  - H3: Beispiel 2: Finanzvorgänge (ereignisgesteuert)
  - H3: Beispiel 3: Überwachung und Warnungen (kontinuierlich)
  - H2: Muster „Ausführen, überprüfen, berichten“
  - H2: Mehrprogrammarchitektur
  - H2: Bewährte Vorgehensweisen
  - H3: Empfohlen
  - H3: Vermeiden
  - H2: Verwandte Themen

## automation/taskflow.md

- Route: /automation/taskflow
- Überschriften:
  - H2: Wann Task Flow verwendet werden sollte
  - H2: Synchronisierungsmodi
  - H3: Verwalteter Modus
  - H3: Gespiegelter Modus
  - H2: Ablaufstatus
  - H2: Dauerhafter Zustand und Revisionsverfolgung
  - H2: Abbruchverhalten
  - H2: CLI-Befehle
  - H2: Zuverlässiges Muster für geplante Workflows
  - H2: Beziehung zwischen Abläufen und Aufgaben
  - H2: Verwandte Themen

## automation/tasks.md

- Route: /automation/tasks
- Überschriften:
  - H2: Kurzfassung
  - H2: Schnellstart
  - H2: Was eine Aufgabe erstellt
  - H2: Lebenszyklus einer Aufgabe
  - H2: Zustellung und Benachrichtigungen
  - H3: Benachrichtigungsrichtlinien
  - H2: CLI-Referenz
  - H2: Aufgabenübersicht im Chat (/tasks)
  - H3: Steuerungsoberfläche
  - H2: Statusintegration (Aufgabendruck)
  - H2: Speicherung und Wartung
  - H3: Speicherort der Aufgaben
  - H3: Automatische Wartung
  - H2: Beziehung von Aufgaben zu anderen Systemen
  - H2: Verwandte Themen

## automation/troubleshooting.md

- Route: /automation/troubleshooting
- Überschriften:
  - H2: Verwandte Themen

## automation/webhook.md

- Route: /automation/webhook
- Überschriften:
  - H2: Verwandte Themen

## brave-search.md

- Route: /brave-search
- Überschriften:
  - H2: Verwandte Themen

## channels/access-groups.md

- Route: /channels/access-groups
- Überschriften:
  - H2: Statische Gruppen von Nachrichtenabsendern
  - H2: Referenzgruppen aus Zulassungslisten
  - H2: Unterstützte Pfade für Nachrichtenkanäle
  - H2: Zielgruppen von Discord-Kanälen
  - H2: Plugin-Diagnose
  - H2: Sicherheitshinweise
  - H2: Fehlerbehebung

## channels/ambient-room-events.md

- Route: /channels/ambient-room-events
- Überschriften:
  - H2: Empfohlene Einrichtung
  - H2: Was sich ändert
  - H2: Discord-Beispiel
  - H2: Slack-Beispiel
  - H2: Telegram-Beispiel
  - H2: Agentenspezifische Richtlinie
  - H2: Sichtbare Antwortmodi
  - H2: Verlauf
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/bot-loop-protection.md

- Route: /channels/bot-loop-protection
- Überschriften:
  - H2: Standardwerte
  - H2: Gemeinsame Standardwerte konfigurieren
  - H2: Pro Kanal, Konto oder Raum überschreiben
  - H2: Kanalunterstützung

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Überschriften:
  - H2: Übersicht
  - H2: Konfiguration
  - H3: Grundlegende Einrichtung
  - H3: Verarbeitungsstrategie
  - H3: Vollständiges Beispiel
  - H2: Funktionsweise
  - H3: Nachrichtenfluss
  - H3: Sitzungsisolierung
  - H3: Beispiel: isolierte Sitzungen
  - H2: Anwendungsfälle
  - H2: Bewährte Vorgehensweisen
  - H2: Kompatibilität
  - H3: Provider
  - H3: Routing
  - H2: Fehlerbehebung
  - H2: Beispiele
  - H2: API-Referenz
  - H3: Konfigurationsschema
  - H3: Felder
  - H2: Einschränkungen
  - H2: Verwandte Themen

## channels/channel-routing.md

- Route: /channels/channel-routing
- Überschriften:
  - H1: Kanäle &amp; Routing
  - H2: Schlüsselbegriffe
  - H2: Präfixe für ausgehende Ziele
  - H2: Formen von Sitzungsschlüsseln (Beispiele)
  - H2: Anheften der primären Direktnachrichtenroute
  - H2: Abgesicherte Aufzeichnung eingehender Nachrichten
  - H2: Routingregeln (wie ein Agent ausgewählt wird)
  - H2: Übertragungsgruppen (mehrere Agenten ausführen)
  - H2: Konfigurationsübersicht
  - H2: Sitzungsspeicherung
  - H2: WebChat-Verhalten
  - H2: Antwortkontext
  - H2: Verwandte Themen

## channels/clickclack.md

- Route: /channels/clickclack
- Überschriften:
  - H2: Schnelleinrichtung
  - H3: Konfigurationsschlüssel für Konten
  - H2: Mehrere Bots
  - H2: Antwortmodi
  - H2: Zeilen zur Agentenaktivität
  - H2: Ziele
  - H2: Berechtigungen
  - H2: Fehlerbehebung

## channels/discord.md

- Route: /channels/discord
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Empfohlen: Einen Guild-Arbeitsbereich einrichten
  - H2: Runtime-Modell
  - H2: Forumskanäle
  - H2: Interaktive Komponenten
  - H2: Zugriffskontrolle und Routing
  - H3: Rollenbasiertes Agenten-Routing
  - H2: Native Befehle und Befehlsauthentifizierung
  - H2: Funktionsdetails
  - H2: Werkzeuge und Aktionssperren
  - H2: Benutzeroberfläche der Komponenten v2
  - H2: Sprache
  - H3: Sprachkanäle
  - H3: Benutzern in Sprachkanälen folgen
  - H3: Sprachnachrichten
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz
  - H2: Sicherheit und Betrieb
  - H2: Verwandte Themen

## channels/feishu.md

- Route: /channels/feishu
- Überschriften:
  - H2: Schnellstart
  - H2: Zugriffskontrolle
  - H3: Direktnachrichten
  - H3: Gruppenchats
  - H2: Beispiele für die Gruppenkonfiguration
  - H3: Alle Gruppen zulassen, keine @Erwähnung erforderlich
  - H3: Alle Gruppen zulassen, weiterhin @Erwähnung verlangen
  - H3: Nur bestimmte Gruppen zulassen
  - H3: Absender innerhalb einer Gruppe einschränken
  - H2: Gruppen-/Benutzer-IDs abrufen
  - H3: Gruppen-IDs (chatid, Format: ocxxx)
  - H3: Benutzer-IDs (openid, Format: ouxxx)
  - H2: Häufig verwendete Befehle
  - H2: Fehlerbehebung
  - H3: Bot antwortet nicht in Gruppenchats
  - H3: Bot empfängt keine Nachrichten
  - H3: QR-Einrichtung reagiert in der mobilen Feishu-App nicht
  - H3: App Secret offengelegt
  - H2: Erweiterte Konfiguration
  - H3: Mehrere Konten
  - H3: Nachrichtenlimits
  - H3: Streaming
  - H3: Kontingentoptimierung
  - H3: Umfang von Gruppensitzungen und Themen-Threads
  - H3: Werkzeuge für Feishu-Arbeitsbereiche
  - H3: ACP-Sitzungen
  - H4: Dauerhafte ACP-Bindung
  - H4: ACP aus dem Chat starten
  - H3: Multi-Agenten-Routing
  - H2: Agentenisolierung pro Benutzer (dynamische Agentenerstellung)
  - H3: Schnelleinrichtung
  - H3: Funktionsweise
  - H3: Konfigurationsoptionen
  - H3: Sitzungsumfang
  - H3: Typische Bereitstellung für mehrere Benutzer
  - H3: Überprüfung
  - H3: Hinweise
  - H2: Konfigurationsreferenz
  - H2: Unterstützte Nachrichtentypen
  - H3: Empfangen
  - H3: Senden
  - H3: Threads und Antworten
  - H2: Verwandte Themen

## channels/googlechat.md

- Route: /channels/googlechat
- Überschriften:
  - H2: Installieren
  - H2: Schnelleinrichtung (Einsteiger)
  - H2: Zu Google Chat hinzufügen
  - H2: Öffentliche URL (nur Webhook)
  - H3: Option A: Tailscale Funnel (empfohlen)
  - H3: Option B: Reverse-Proxy (Caddy)
  - H3: Option C: Cloudflare Tunnel
  - H2: Funktionsweise
  - H2: Ziele
  - H2: Wichtige Konfigurationsaspekte
  - H2: Fehlerbehebung
  - H3: 405 Methode nicht zulässig
  - H3: Andere Probleme
  - H2: Verwandte Themen

## channels/group-messages.md

- Route: /channels/group-messages
- Überschriften:
  - H2: Verhalten
  - H2: Konfigurationsbeispiel (WhatsApp)
  - H3: Aktivierungsbefehl (nur Eigentümer)
  - H2: Verwendung
  - H2: Testen/Überprüfen
  - H2: Bekannte Aspekte
  - H2: Verwandte Themen

## channels/groups.md

- Route: /channels/groups
- Überschriften:
  - H2: Einführung für Einsteiger (2 Minuten)
  - H2: Sichtbare Antworten
  - H2: Kontextsichtbarkeit und Zulassungslisten
  - H2: Sitzungsschlüssel
  - H2: Muster: persönliche Direktnachrichten und öffentliche Gruppen (ein Agent)
  - H2: Anzeigebezeichnungen
  - H2: Gruppenrichtlinie
  - H2: Erwähnungssperre (Standard)
  - H2: Erwähnungsmuster für den konfigurierten Geltungsbereich
  - H2: Einschränkungen für Gruppen-/Kanalwerkzeuge (optional)
  - H2: Gruppenzulassungslisten
  - H2: Aktivierung (nur Eigentümer)
  - H2: Kontextfelder
  - H2: Besonderheiten von iMessage
  - H2: WhatsApp-Systemprompts
  - H2: Besonderheiten von WhatsApp
  - H2: Verwandte Themen

## channels/imessage-from-bluebubbles.md

- Route: /channels/imessage-from-bluebubbles
- Überschriften:
  - H2: Migrationscheckliste
  - H2: Funktionsweise von imsg
  - H2: Bevor Sie beginnen
  - H2: Konfigurationsübersetzung
  - H2: Stolperfalle bei der Gruppenregistrierung
  - H2: Schritt für Schritt
  - H2: Funktionsgleichheit auf einen Blick
  - H2: Kopplung, Sitzungen und ACP-Bindungen
  - H2: Kein Kanal für das Zurücksetzen
  - H2: Verwandte Themen

## channels/imessage.md

- Route: /channels/imessage
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Anforderungen und Berechtigungen (macOS)
  - H2: Private API von imsg aktivieren
  - H3: Einrichtung
  - H3: Wenn SIP aktiviert bleibt
  - H2: Zugriffskontrolle und Routing
  - H2: ACP-Konversationsbindungen
  - H2: Bereitstellungsmuster
  - H2: Medien, Segmentierung und Zustellungsziele
  - H2: Aktionen der privaten API
  - H2: Konfigurationsschreibvorgänge
  - H2: Zusammenführen aufgeteilter Direktnachrichten (Befehl und URL in einer Nachricht)
  - H3: Szenarien und was der Agent sieht
  - H2: Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways
  - H3: Für Betreiber sichtbares Signal
  - H3: Migration
  - H2: Fehlerbehebung
  - H2: Verweise zur Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/index.md

- Route: /channels
- Überschriften:
  - H2: Unterstützte Kanäle
  - H2: Hinweise zur Zustellung
  - H2: Hinweise

## channels/irc.md

- Route: /channels/irc
- Überschriften:
  - H2: Schnellstart
  - H2: Verbindungseinstellungen
  - H2: Sicherheitsstandardwerte
  - H2: Zugriffskontrolle
  - H3: Häufige Stolperfalle: allowFrom gilt für Direktnachrichten, nicht für Kanäle
  - H2: Auslösen von Antworten (Erwähnungen)
  - H2: Sicherheitshinweis (für öffentliche Kanäle empfohlen)
  - H3: Dieselben Werkzeuge für alle im Kanal
  - H3: Unterschiedliche Werkzeuge je Absender (Eigentümer erhält mehr Befugnisse)
  - H2: NickServ
  - H2: Umgebungsvariablen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/line.md

- Route: /channels/line
- Überschriften:
  - H2: Installation
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Zugriffskontrolle
  - H2: Nachrichtenverhalten
  - H2: Kanaldaten (Rich Messages)
  - H2: ACP-Unterstützung
  - H2: Ausgehende Medien
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/location.md

- Route: /channels/location
- Überschriften:
  - H2: Textformatierung
  - H2: Kontextfelder
  - H2: Ausgehende Nutzdaten
  - H2: Hinweise zum Kanal
  - H2: Verwandte Themen

## channels/matrix-migration.md

- Route: /channels/matrix-migration
- Überschriften:
  - H2: Was die Migration automatisch ausführt
  - H2: Upgrade von OpenClaw-Versionen vor 2026.4
  - H2: Empfohlener Upgrade-Ablauf
  - H2: Häufige Meldungen und ihre Bedeutung
  - H3: Meldungen zur manuellen Wiederherstellung
  - H2: Wenn der verschlüsselte Verlauf weiterhin nicht wiederhergestellt wird
  - H2: Wenn Sie für zukünftige Nachrichten neu beginnen möchten
  - H2: Verwandte Themen

## channels/matrix-presentation.md

- Route: /channels/matrix-presentation
- Überschriften:
  - H2: Ereignisinhalt
  - H2: Fallback-Verhalten
  - H2: Unterstützte Blöcke
  - H2: Interaktionen
  - H2: Beziehung zu Genehmigungsmetadaten
  - H2: Mediennachrichten

## channels/matrix-push-rules.md

- Route: /channels/matrix-push-rules
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schritte
  - H2: Hinweise zu mehreren Bots
  - H2: Hinweise zum Homeserver
  - H2: Verwandte Themen

## channels/matrix.md

- Route: /channels/matrix
- Überschriften:
  - H2: Installation
  - H2: Einrichtung
  - H3: Interaktive Einrichtung
  - H3: Minimalkonfiguration
  - H3: Automatischer Beitritt
  - H3: Formate für Ziele der Zulassungsliste
  - H3: Normalisierung der Konto-ID
  - H3: Zwischengespeicherte Anmeldedaten
  - H3: Umgebungsvariablen
  - H2: Konfigurationsbeispiel
  - H2: Streaming-Vorschauen
  - H2: Sprachnachrichten
  - H2: Genehmigungsmetadaten
  - H3: Selbst gehostete Push-Regeln für geräuschlose, endgültige Vorschauen
  - H2: Räume für Bot-zu-Bot-Kommunikation
  - H2: Verschlüsselung und Verifizierung
  - H3: Verschlüsselung aktivieren
  - H3: Status- und Vertrauenssignale
  - H3: Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren
  - H3: Cross-Signing initialisieren oder reparieren
  - H3: Sicherung der Raumschlüssel
  - H3: Verifizierungen auflisten, anfordern und beantworten
  - H3: Hinweise zu mehreren Konten
  - H2: Profilverwaltung
  - H2: Threads
  - H3: Sitzungsrouting (sessionScope)
  - H3: Antworten in Threads (threadReplies)
  - H3: Thread-Vererbung und Slash-Befehle
  - H2: ACP-Konversationsbindungen
  - H3: Konfiguration der Thread-Bindung
  - H2: Reaktionen
  - H2: Verlaufskontext
  - H2: Sichtbarkeit des Kontexts
  - H2: Richtlinie für Direktnachrichten und Räume
  - H2: Reparatur direkter Räume
  - H2: Ausführungsgenehmigungen
  - H2: Slash-Befehle
  - H2: Mehrere Konten
  - H2: Private/LAN-Homeserver
  - H2: Matrix-Datenverkehr über einen Proxy leiten
  - H2: Zielauflösung
  - H2: Konfigurationsreferenz
  - H3: Konto und Verbindung
  - H3: Verschlüsselung
  - H3: Zugriff und Richtlinien
  - H3: Antwortverhalten
  - H3: Reaktionseinstellungen
  - H3: Werkzeuge und raumspezifische Überschreibungen
  - H3: Einstellungen für Ausführungsgenehmigungen
  - H2: Verwandte Themen

## channels/mattermost.md

- Route: /channels/mattermost
- Überschriften:
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Native Slash-Befehle
  - H2: Umgebungsvariablen (Standardkonto)
  - H2: Chatmodi
  - H2: Threads und Sitzungen
  - H2: Zugriffskontrolle (Direktnachrichten)
  - H2: Kanäle (Gruppen)
  - H2: Ziele für die ausgehende Zustellung
  - H2: Wiederholungsversuch für Direktnachrichtenkanäle
  - H2: Vorschau-Streaming
  - H2: Reaktionen (Nachrichtenwerkzeug)
  - H2: Interaktive Schaltflächen (Nachrichtenwerkzeug)
  - H3: Direkte API-Integration (externe Skripte)
  - H2: Verzeichnisadapter
  - H2: Mehrere Konten
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/msteams.md

- Route: /channels/msteams
- Überschriften:
  - H2: Mitgeliefertes Plugin
  - H2: Schnelleinrichtung
  - H2: Ziele
  - H2: Konfigurationsschreibvorgänge
  - H2: Zugriffskontrolle (Direktnachrichten + Gruppen)
  - H3: Funktionsweise
  - H3: Schritt 1: Azure Bot erstellen
  - H3: Schritt 2: Anmeldedaten abrufen
  - H3: Schritt 3: Messaging-Endpunkt konfigurieren
  - H3: Schritt 4: Teams-Kanal aktivieren
  - H3: Schritt 5: Teams-App-Manifest erstellen
  - H3: Schritt 6: OpenClaw konfigurieren
  - H3: Schritt 7: Gateway ausführen
  - H2: Verbundauthentifizierung (Zertifikat plus verwaltete Identität)
  - H3: Option A: Zertifikatbasierte Authentifizierung
  - H3: Option B: Von Azure verwaltete Identität
  - H3: Einrichtung der AKS-Workloadidentität
  - H3: Vergleich der Authentifizierungstypen
  - H2: Lokale Entwicklung (Tunneling)
  - H2: Bot testen
  - H2: Umgebungsvariablen
  - H2: Aktion für Mitgliedsinformationen
  - H2: Verlaufskontext
  - H2: Aktuelle Teams-RSC-Berechtigungen (Manifest)
  - H2: Beispiel für ein Teams-Manifest (geschwärzt)
  - H3: Besonderheiten des Manifests (Pflichtfelder)
  - H3: Vorhandene App aktualisieren
  - H2: Funktionen: nur RSC im Vergleich zu Graph
  - H3: Nur mit Teams RSC (App installiert, keine Graph-API-Berechtigungen)
  - H3: Mit Teams RSC + Microsoft-Graph-Anwendungsberechtigungen
  - H3: RSC im Vergleich zur Graph API
  - H2: Medien und Verlauf mit Graph-Unterstützung
  - H3: Wiederherstellung von Kanal-/Gruppendateien (graphMediaFallback)
  - H2: Bekannte Einschränkungen
  - H3: Webhook-Zeitüberschreitungen
  - H3: Unterstützung für Teams-Cloud und Dienst-URL
  - H3: Formatierung
  - H2: Konfiguration
  - H2: Routing und Sitzungen
  - H2: Antwortstil: Threads im Vergleich zu Beiträgen
  - H3: Auflösungsrangfolge
  - H3: Beibehaltung des Thread-Kontexts
  - H2: Anhänge und Bilder
  - H2: Dateien in Gruppenchats senden
  - H3: Warum Gruppenchats SharePoint benötigen
  - H3: Einrichtung
  - H3: Freigabeverhalten
  - H3: Fallback-Verhalten
  - H3: Speicherort der Dateien
  - H2: Umfragen (Adaptive Cards)
  - H2: Darstellungskarten
  - H2: Zielformate
  - H2: Proaktive Nachrichten
  - H2: Team- und Kanal-IDs (häufiger Stolperstein)
  - H2: Private Kanäle
  - H2: Fehlerbehebung
  - H3: Häufige Probleme
  - H3: Fehler beim Hochladen des Manifests
  - H3: RSC-Berechtigungen funktionieren nicht
  - H2: Referenzen
  - H2: Verwandte Themen

## channels/nextcloud-talk.md

- Route: /channels/nextcloud-talk
- Überschriften:
  - H2: Installation
  - H2: Schnelleinrichtung (für Einsteiger)
  - H2: Hinweise
  - H2: Zugriffskontrolle (Direktnachrichten)
  - H2: Räume (Gruppen)
  - H2: Funktionen
  - H2: Konfigurationsreferenz (Nextcloud Talk)
  - H2: Verwandte Themen

## channels/nostr.md

- Route: /channels/nostr
- Überschriften:
  - H2: Installation
  - H3: Nicht interaktive Einrichtung
  - H2: Schnelleinrichtung
  - H2: Konfigurationsreferenz
  - H2: Profilmetadaten
  - H2: Zugriffskontrolle
  - H3: Richtlinien für Direktnachrichten
  - H3: Beispiel für eine Zulassungsliste
  - H2: Schlüsselformate
  - H2: Relays
  - H2: Protokollunterstützung
  - H2: Tests
  - H3: Lokales Relay
  - H3: Manueller Test
  - H2: Fehlerbehebung
  - H3: Keine Nachrichten werden empfangen
  - H3: Antworten werden nicht gesendet
  - H3: Doppelte Antworten
  - H2: Sicherheit
  - H2: Einschränkungen (MVP)
  - H2: Verwandte Themen

## channels/pairing.md

- Route: /channels/pairing
- Überschriften:
  - H2: 1) Kopplung für Direktnachrichten (Zugriff auf eingehende Chats)
  - H3: Absender genehmigen
  - H3: Wiederverwendbare Absendergruppen
  - H3: Speicherort des Zustands
  - H2: 2) Kopplung von Node-Geräten (iOS-/Android-/macOS-/Headless-Nodes)
  - H3: Über die Control UI koppeln (empfohlen)
  - H3: Über Telegram koppeln
  - H3: Node-Gerät genehmigen
  - H3: Optionale automatische Genehmigung von Nodes aus vertrauenswürdigen CIDR-Bereichen
  - H3: Speicherung des Node-Kopplungszustands
  - H3: Hinweise
  - H2: Verwandte Dokumentation

## channels/qa-channel.md

- Route: /channels/qa-channel
- Überschriften:
  - H2: Funktionsweise
  - H2: Konfiguration
  - H2: Runner
  - H2: Verwandte Themen

## channels/qqbot.md

- Route: /channels/qqbot
- Überschriften:
  - H2: Installation
  - H2: Einrichtung
  - H2: Konfiguration
  - H3: Zugriffsrichtlinie
  - H3: Einrichtung mehrerer Konten
  - H3: Gruppenchats
  - H3: Sprache (STT / TTS)
  - H2: Zielformate
  - H2: Slash-Befehle
  - H2: Medien und Speicherung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/raft.md

- Route: /channels/raft
- Überschriften:
  - H2: Installation
  - H2: Voraussetzungen
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Überprüfung
  - H2: Fehlerbehebung
  - H2: Referenzen

## channels/signal.md

- Route: /channels/signal
- Überschriften:
  - H2: Das Nummernmodell (zuerst lesen)
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Was es ist
  - H2: Einrichtungsweg A: Vorhandenes Signal-Konto verknüpfen (QR)
  - H2: Einrichtungsweg B: Eigene Bot-Nummer registrieren (SMS, Linux)
  - H2: Externer Daemon-Modus (httpUrl)
  - H2: Containermodus (bbernhard/signal-cli-rest-api)
  - H2: Zugriffskontrolle (Direktnachrichten + Gruppen)
  - H2: Funktionsweise (Verhalten)
  - H2: Medien + Limits
  - H2: Tippanzeigen + Lesebestätigungen
  - H2: Lebenszyklus-Statusreaktionen
  - H2: Reaktionen (Nachrichtenwerkzeug)
  - H2: Genehmigungsreaktionen
  - H2: Zustellungsziele (CLI/Cron)
  - H2: Aliasse
  - H2: Fehlerbehebung
  - H2: Sicherheitshinweise
  - H2: Konfigurationsreferenz (Signal)
  - H2: Verwandte Themen

## channels/slack.md

- Route: /channels/slack
- Überschriften:
  - H2: Transport auswählen
  - H3: Relay-Modus
  - H3: Organisationsweite Installationen in Enterprise Grid
  - H4: Socket Mode
  - H4: HTTP Request URLs
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Transportoptimierung für Socket Mode
  - H2: Checkliste für Manifest und Berechtigungsbereiche
  - H3: Zusätzliche Manifesteinstellungen
  - H2: Tokenmodell
  - H2: Aktionen und Schranken
  - H2: Zugriffskontrolle und Routing
  - H2: Threads, Sitzungen und Antwort-Tags
  - H2: Bestätigungsreaktionen
  - H3: Emoji (ackReaction)
  - H3: Geltungsbereich (messages.ackReactionScope)
  - H2: Text-Streaming
  - H2: Fallback für Tippreaktionen
  - H2: Spracheingabe
  - H2: Medien, Aufteilung und Zustellung
  - H2: Befehle und Slash-Verhalten
  - H2: Native Diagramme
  - H2: Native Tabellen
  - H2: Interaktive Antworten
  - H3: Vom Plugin verwaltete Modal-Übermittlungen
  - H2: Native Genehmigungen in Slack
  - H2: Ereignisse und Betriebsverhalten
  - H2: Konfigurationsreferenz
  - H2: Fehlerbehebung
  - H2: Referenz für Anhangsmedien
  - H3: Unterstützte Medientypen
  - H3: Pipeline für eingehende Daten
  - H3: Vererbung von Anhängen des Thread-Stammbeitrags
  - H3: Verarbeitung mehrerer Anhänge
  - H3: Größen-, Download- und Modelllimits
  - H3: Bekannte Limits
  - H3: Verwandte Dokumentation
  - H2: Verwandte Themen

## channels/sms.md

- Route: /channels/sms
- Überschriften:
  - H2: Bevor Sie beginnen
  - H2: Schnelleinrichtung
  - H2: Konfigurationsbeispiele
  - H3: Konfigurationsdatei
  - H3: Umgebungsvariablen
  - H3: SecretRef-Authentifizierungstoken
  - H3: Absender des Messaging-Dienstes
  - H3: Standardziel für ausgehende Nachrichten
  - H2: Zugriffskontrolle
  - H2: SMS senden
  - H2: Einrichtung überprüfen
  - H3: End-to-End-Test über macOS iMessage/SMS
  - H2: Webhook-Sicherheit
  - H2: Konfiguration mehrerer Konten
  - H2: Fehlerbehebung
  - H3: Twilio gibt 403 zurück oder OpenClaw lehnt den Webhook ab
  - H3: Es wird keine Kopplungsanfrage angezeigt
  - H3: Ausgehende Sendungen schlagen fehl
  - H3: Nachrichten treffen ein, aber der Agent antwortet nicht

## channels/synology-chat.md

- Route: /channels/synology-chat
- Überschriften:
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Umgebungsvariablen
  - H2: Richtlinie und Zugriffskontrolle für Direktnachrichten
  - H2: Ausgehende Zustellung
  - H2: Mehrere Konten
  - H2: Sicherheitshinweise
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/telegram.md

- Route: /channels/telegram
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Telegram-seitige Einstellungen
  - H2: Dashboard-Mini-App
  - H2: Zugriffskontrolle und Aktivierung
  - H3: Bot-Identität in Gruppen
  - H2: Laufzeitverhalten
  - H2: Funktionsreferenz
  - H2: Steuerung von Fehlerantworten
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/tlon.md

- Route: /channels/tlon
- Überschriften:
  - H2: Mitgeliefertes Plugin
  - H2: Einrichtung
  - H2: Private/LAN-Ships
  - H2: Gruppenkanäle
  - H2: Zugriffskontrolle
  - H2: Eigentümer- und Genehmigungssystem
  - H2: Einstellungen für die automatische Annahme
  - H2: Hot-Reload über den Urbit-Einstellungsspeicher
  - H2: Zustellungsziele (CLI/Cron)
  - H2: Mitgelieferter Skill
  - H2: Funktionen
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz
  - H2: Hinweise
  - H2: Verwandte Themen

## channels/troubleshooting.md

- Route: /channels/troubleshooting
- Überschriften:
  - H2: Befehlsabfolge
  - H2: Nach einer Aktualisierung
  - H2: WhatsApp
  - H3: WhatsApp-Fehlersignaturen
  - H2: Telegram
  - H3: Telegram-Fehlersignaturen
  - H2: Discord
  - H3: Discord-Fehlersignaturen
  - H2: Slack
  - H3: Slack-Fehlersignaturen
  - H2: iMessage
  - H3: iMessage-Fehlersignaturen
  - H2: Signal
  - H3: Signal-Fehlersignaturen
  - H2: QQ Bot
  - H3: QQ-Bot-Fehlersignaturen
  - H2: Matrix
  - H3: Matrix-Fehlersignaturen
  - H2: Verwandte Themen

## channels/twitch.md

- Route: /channels/twitch
- Überschriften:
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Was es ist
  - H2: Token-Aktualisierung (optional)
  - H2: Unterstützung mehrerer Konten
  - H2: Zugriffskontrolle
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H3: Kontokonfiguration
  - H3: Provider-Optionen
  - H2: Tool-Aktionen
  - H2: Sicherheit und Betrieb
  - H2: Einschränkungen
  - H2: Verwandte Themen

## channels/wechat.md

- Route: /channels/wechat
- Überschriften:
  - H2: Benennung
  - H2: Funktionsweise
  - H2: Installation
  - H2: Anmeldung
  - H2: Zugriffskontrolle
  - H2: Kompatibilität
  - H2: Sidecar-Prozess
  - H2: Fehlerbehebung
  - H2: Verwandte Dokumentation

## channels/whatsapp.md

- Route: /channels/whatsapp
- Überschriften:
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Bereitstellungsmuster
  - H2: Laufzeitmodell
  - H2: Aktuell anfragende Person mit MeowCaller anrufen (experimentell)
  - H2: Genehmigungsaufforderungen
  - H2: Plugin-Hooks und Datenschutz
  - H2: Zugriffskontrolle und Aktivierung
  - H2: Konfigurierte ACP-Bindungen
  - H2: Verhalten bei persönlicher Nummer und Selbst-Chat
  - H2: Nachrichtennormalisierung und Kontext
  - H2: Zustellung, Aufteilung und Medien
  - H2: Zitieren von Antworten
  - H2: Reaktionsstufe
  - H2: Bestätigungsreaktionen
  - H2: Lebenszyklus-Statusreaktionen
  - H2: Mehrere Konten und Anmeldedaten
  - H2: Tools, Aktionen und Konfigurationsschreibvorgänge
  - H2: Fehlerbehebung
  - H2: System-Prompts
  - H2: Verweise zur Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/yuanbao.md

- Route: /channels/yuanbao
- Überschriften:
  - H2: Schnellstart
  - H3: Interaktive Einrichtung (Alternative)
  - H2: Zugriffskontrolle
  - H3: Direktnachrichten
  - H3: Gruppenchats
  - H2: Konfigurationsbeispiele
  - H2: Häufige Befehle
  - H2: Fehlerbehebung
  - H2: Erweiterte Konfiguration
  - H3: Mehrere Konten
  - H3: Nachrichtenlimits
  - H3: Streaming
  - H3: Verlaufskontext für Gruppenchats
  - H3: Antwortmodus
  - H3: Einfügen von Markdown-Hinweisen
  - H3: Debug-Modus
  - H3: Multi-Agent-Routing
  - H2: Konfigurationsreferenz
  - H2: Unterstützte Nachrichtentypen
  - H2: Verwandte Themen

## channels/zalo.md

- Route: /channels/zalo
- Überschriften:
  - H2: Mitgeliefertes Plugin
  - H2: Schnelleinrichtung
  - H2: Was es ist
  - H2: Funktionsweise
  - H2: Einschränkungen
  - H2: Zugriffskontrolle
  - H3: Direktnachrichten
  - H3: Gruppen
  - H2: Long-Polling im Vergleich zu Webhook
  - H2: Unterstützte Nachrichtentypen
  - H2: Funktionen
  - H2: Zustellungsziele (CLI/Cron)
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/zaloclawbot.md

- Route: /channels/zaloclawbot
- Überschriften:
  - H2: Kompatibilität
  - H2: Voraussetzungen
  - H2: Installation mit onboard (empfohlen)
  - H2: Manuelle Installation
  - H3: 1. Plugin installieren
  - H3: 2. Plugin in der Konfiguration aktivieren
  - H3: 3. QR-Code generieren und anmelden
  - H3: 4. Gateway neu starten
  - H2: Funktionsweise
  - H2: Interne Funktionsweise
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/zalouser.md

- Route: /channels/zalouser
- Überschriften:
  - H2: Installation
  - H2: Schnelleinrichtung
  - H2: Was es ist
  - H2: Benennung
  - H2: IDs finden (Verzeichnis)
  - H2: Einschränkungen
  - H2: Zugriffskontrolle (Direktnachrichten)
  - H2: Gruppenzugriff (optional)
  - H3: Erwähnungssperre für Gruppen
  - H2: Mehrere Konten
  - H2: Umgebungsvariablen
  - H2: Eingabeanzeigen, Reaktionen und Zustellungsbestätigungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## ci.md

- Route: /ci
- Überschriften:
  - H2: Pipeline-Übersicht
  - H2: Fail-Fast-Reihenfolge
  - H2: PR-Kontext und Nachweise
  - H2: Umfang und Routing
  - H2: Weiterleitung von ClawSweeper-Aktivitäten
  - H2: Manuelle Ausführungen
  - H2: Runner
  - H2: Budget für Runner-Registrierungen
  - H2: Lokale Entsprechungen
  - H2: OpenClaw Performance
  - H2: Vollständige Release-Validierung
  - H2: Live- und E2E-Shards
  - H2: Paketabnahme
  - H3: Jobs
  - H3: Kandidatenquellen
  - H3: Suite-Profile
  - H3: Zeitfenster für Legacy-Kompatibilität
  - H3: Beispiele
  - H2: Installations-Smoke-Test
  - H2: Lokales Docker-E2E
  - H3: Anpassbare Parameter
  - H3: Wiederverwendbarer Live-/E2E-Workflow
  - H3: Abschnitte des Release-Pfads
  - H2: Plugin-Vorabveröffentlichung
  - H2: QA-Labor
  - H2: CodeQL
  - H3: Sicherheitskategorien
  - H3: Plattformspezifische Sicherheits-Shards
  - H3: Kritische Qualitätskategorien
  - H2: Wartungsworkflows
  - H3: Dokumentations-Agent
  - H3: Testleistungs-Agent
  - H3: Doppelte PRs nach dem Zusammenführen
  - H2: Lokale Prüfgates und Routing bei Änderungen
  - H2: Testbox-Validierung
  - H2: Verwandte Themen

## clawhub/cli.md

- Route: /clawhub/cli
- Überschriften:
  - H1: ClawHub-CLI
  - H2: Suchen und installieren
  - H3: Vertrauen in Releases
  - H2: Veröffentlichen und pflegen
  - H2: Verwandte Themen

## clawhub/publishing.md

- Route: /clawhub/publishing
- Überschriften:
  - H1: Veröffentlichen auf ClawHub
  - H2: Eigentümer
  - H2: Skills
  - H2: Plugins
  - H2: Release-Ablauf
  - H2: Häufig gestellte Fragen
  - H3: Paketbereich muss mit dem ausgewählten Eigentümer übereinstimmen

## cli/acp.md

- Route: /cli/acp
- Überschriften:
  - H2: Was dies nicht ist
  - H2: Kompatibilitätsmatrix
  - H2: Bekannte Einschränkungen
  - H2: Verwendung
  - H2: ACP-Client (Debugging)
  - H2: Smoke-Tests für das Protokoll
  - H2: Verwendung
  - H2: Agents auswählen
  - H2: Verwendung über acpx (Codex, Claude und andere ACP-Clients)
  - H2: Einrichtung des Zed-Editors
  - H2: Sitzungszuordnung
  - H2: Optionen
  - H3: Optionen des acp-Clients
  - H2: Verwandte Themen

## cli/agent.md

- Route: /cli/agent
- Überschriften:
  - H1: openclaw agent
  - H2: Optionen
  - H2: Beispiele
  - H2: Hinweise
  - H2: JSON-Zustellungsstatus
  - H2: Verwandte Themen

## cli/agents.md

- Route: /cli/agents
- Überschriften:
  - H1: openclaw agents
  - H2: Beispiele
  - H2: Befehlsumfang
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents set-identity
  - H3: agents delete &lt;id&gt;
  - H2: Routing-Bindungen
  - H3: --bind-Format
  - H3: Verhalten des Bindungsumfangs
  - H2: Identitätsdateien
  - H2: Identität festlegen
  - H2: Verwandte Themen

## cli/approvals.md

- Route: /cli/approvals
- Überschriften:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Häufige Befehle
  - H2: Genehmigungen aus einer Datei ersetzen
  - H2: Beispiel für „Nie nachfragen“/YOLO
  - H2: Hilfsfunktionen für Zulassungslisten
  - H2: Häufige Optionen
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/attach.md

- Route: /cli/attach
- Überschriften: keine

## cli/audit.md

- Route: /cli/audit
- Überschriften:
  - H1: openclaw audit
  - H2: Filter
  - H2: Aufgezeichnete Ereignisse
  - H2: Gateway-RPC
  - H2: Verwandte Themen

## cli/backup.md

- Route: /cli/backup
- Überschriften:
  - H1: openclaw backup
  - H2: Hinweise
  - H2: Was gesichert wird
  - H2: Verhalten bei ungültiger Konfiguration
  - H2: Größe und Leistung
  - H2: Verwandte Themen

## cli/browser.md

- Route: /cli/browser
- Überschriften:
  - H1: openclaw browser
  - H2: Häufige Flags
  - H2: Schnellstart (lokal)
  - H2: Schnelle Fehlerbehebung
  - H2: Lebenszyklus
  - H2: Wenn der Befehl fehlt
  - H2: Profile
  - H2: Tabs
  - H2: Snapshot/Screenshot/Aktionen
  - H2: Zustand und Speicherung
  - H2: Debugging
  - H2: Vorhandenes Chrome über MCP
  - H2: Remote-Browsersteuerung (Node-Host-Proxy)
  - H2: Verwandte Themen

## cli/channels.md

- Route: /cli/channels
- Überschriften:
  - H1: openclaw channels
  - H2: Häufige Befehle
  - H2: Status/Funktionen/Auflösung/Protokolle
  - H2: Konten hinzufügen/entfernen
  - H2: An- und Abmeldung (interaktiv)
  - H2: Fehlerbehebung
  - H2: Funktionsprüfung
  - H2: Namen in IDs auflösen
  - H2: Verwandte Themen

## cli/clawbot.md

- Route: /cli/clawbot
- Überschriften:
  - H1: openclaw clawbot
  - H2: Migration
  - H2: Verwandte Themen

## cli/commitments.md

- Route: /cli/commitments
- Überschriften:
  - H2: Verwendung
  - H2: Optionen
  - H2: Beispiele
  - H2: Ausgabe
  - H2: Verwandte Themen

## cli/completion.md

- Route: /cli/completion
- Überschriften:
  - H1: openclaw completion
  - H2: Verwendung
  - H2: Optionen
  - H2: Installationsablauf
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/config.md

- Route: /cli/config
- Überschriften:
  - H2: Stammoptionen
  - H2: Beispiele
  - H3: Pfade
  - H3: config get
  - H3: config file
  - H3: config schema
  - H3: config validate
  - H2: Werte
  - H2: Modi von config set
  - H3: Flags des Provider-Builders
  - H2: config patch
  - H2: Testlauf
  - H3: Struktur der JSON-Ausgabe
  - H2: Änderungen anwenden
  - H2: Schreibsicherheit
  - H2: Reparaturschleife
  - H2: Verwandte Themen

## cli/configure.md

- Route: /cli/configure
- Überschriften:
  - H1: openclaw configure
  - H2: Optionen
  - H2: Modellabschnitt
  - H2: Webabschnitt
  - H2: Weitere Hinweise
  - H2: Verwandte Themen

## cli/crestodian.md

- Route: /cli/crestodian
- Überschriften:
  - H1: openclaw crestodian
  - H2: Wann es startet
  - H2: Was Crestodian anzeigt
  - H2: Beispiele
  - H2: Vorgänge und Genehmigung
  - H3: Zur Einrichtung maskierter Kanäle wechseln
  - H2: Einrichtungs-Bootstrap
  - H2: KI-Unterhaltung
  - H3: Vertrauensmodell des CLI-Harnesses
  - H2: Zu einem Agent wechseln
  - H2: Nachrichtenrettungsmodus
  - H2: Verwandte Themen

## cli/cron.md

- Route: /cli/cron
- Überschriften:
  - H1: openclaw cron
  - H2: Jobs schnell erstellen
  - H2: Sitzungen
  - H2: Zustellung
  - H3: Zustellungsverantwortung
  - H3: Zustellung bei Fehlern
  - H2: Zeitplanung
  - H3: Einmalige Jobs
  - H3: Wiederkehrende Jobs
  - H3: Manuelle Ausführungen
  - H2: Modelle
  - H3: Modellpriorität für isoliertes Cron
  - H3: Schnellmodus
  - H3: Wiederholungsversuche beim Live-Modellwechsel
  - H2: Ausführungsausgabe und Ablehnungen
  - H3: Unterdrückung veralteter Bestätigungen
  - H3: Unterdrückung stiller Tokens
  - H3: Strukturierte Ablehnungen
  - H2: Aufbewahrung
  - H2: Ältere Jobs migrieren
  - H2: Häufige Änderungen
  - H2: Häufige Administrationsbefehle
  - H2: Verwandte Themen

## cli/daemon.md

- Route: /cli/daemon
- Überschriften:
  - H1: openclaw daemon
  - H2: Verwendung
  - H2: Unterbefehle und Optionen
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/dashboard.md

- Route: /cli/dashboard
- Überschriften:
  - H1: openclaw dashboard
  - H2: Verwandte Themen

## cli/devices.md

- Route: /cli/devices
- Überschriften:
  - H1: openclaw devices
  - H2: Häufige Optionen
  - H2: Befehle
  - H3: openclaw devices list
  - H3: openclaw devices approve [requestId] [--latest]
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Hinweise
  - H2: Checkliste zur Behebung von Token-Abweichungen
  - H2: Erstausführungsgenehmigung für Paperclip/openclawgateway
  - H2: Verwandte Themen

## cli/directory.md

- Route: /cli/directory
- Überschriften:
  - H1: openclaw directory
  - H2: Häufige Flags
  - H2: Hinweise
  - H2: Ergebnisse mit message send verwenden
  - H2: ID-Formate nach Kanal
  - H2: Eigene Identität („me“)
  - H2: Kommunikationspartner (Kontakte/Benutzer)
  - H2: Gruppen
  - H2: Verwandte Themen

## cli/dns.md

- Route: /cli/dns
- Überschriften:
  - H1: openclaw dns
  - H2: dns setup
  - H2: Verwandte Themen

## cli/docs.md

- Route: /cli/docs
- Überschriften:
  - H1: openclaw docs
  - H2: Verwendung
  - H2: Beispiele
  - H2: Funktionsweise
  - H2: Ausgabe
  - H2: Exitcodes
  - H2: Verwandte Themen

## cli/doctor.md

- Route: /cli/doctor
- Überschriften:
  - H1: openclaw doctor
  - H2: Modi
  - H2: Beispiele
  - H2: Optionen
  - H2: Lint-Modus
  - H2: Strukturierte Zustandsprüfungen
  - H2: Auswahl der Prüfungen
  - H2: Modus nach einem Upgrade
  - H2: SQLite-Compaction des gemeinsamen Zustands
  - H2: SQLite-Sitzungsmigration
  - H3: Downgrade nach der SQLite-Sitzungsmigration
  - H2: Hinweise
  - H2: macOS: launchctl-Umgebungsüberschreibungen
  - H2: Verwandte Themen

## cli/fleet.md

- Route: /cli/fleet
- Überschriften:
  - H1: openclaw fleet
  - H2: Schnellstart
  - H2: Mandanten-IDs
  - H2: fleet create
  - H3: Erstellungsoptionen
  - H3: Anheften per Digest
  - H3: Speicherplatzlimits
  - H3: Egress-Richtlinie
  - H2: fleet list
  - H2: fleet status
  - H2: fleet logs
  - H2: fleet start, fleet stop und fleet restart
  - H2: fleet upgrade
  - H2: fleet backup und fleet restore
  - H2: fleet doctor
  - H2: fleet rm
  - H2: Speicher- und Container-Layout
  - H2: Sicherheitsprofil
  - H2: Token-Handhabung
  - H2: Verwandte Themen

## cli/flows.md

- Route: /cli/flows
- Überschriften:
  - H1: openclaw tasks flow
  - H2: Unterbefehle
  - H3: Werte des Statusfilters
  - H2: Beispiele
  - H2: Verwandte Themen

## cli/gateway.md

- Route: /cli/gateway
- Überschriften:
  - H2: Gateway ausführen
  - H3: Optionen
  - H2: Gateway neu starten
  - H3: Gateway-Profiling
  - H2: Laufenden Gateway abfragen
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Remote über SSH (Funktionsgleichheit mit der Mac-App)
  - H3: gateway call &lt;method&gt;
  - H2: Gateway-Dienst verwalten
  - H3: Mit einem Wrapper installieren
  - H2: Gateways erkennen (Bonjour)
  - H3: gateway discover
  - H2: Verwandte Themen

## cli/health.md

- Route: /cli/health
- Überschriften:
  - H1: openclaw health
  - H2: Optionen
  - H2: Verhalten
  - H2: Verwandte Themen

## cli/hooks.md

- Route: /cli/hooks
- Überschriften:
  - H1: openclaw hooks
  - H2: Hooks auflisten
  - H2: Hook-Informationen abrufen
  - H2: Eignung prüfen
  - H2: Einen Hook aktivieren
  - H2: Einen Hook deaktivieren
  - H2: Hook-Pakete installieren und aktualisieren
  - H2: Mitgelieferte Hooks
  - H3: Protokolldatei von command-logger
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/index.md

- Route: /cli
- Überschriften:
  - H2: Befehlsseiten
  - H2: Globale Flags
  - H2: Ausgabemodi
  - H2: Farbpalette
  - H2: Befehlsbaum
  - H2: Chat-Slash-Befehle
  - H2: Nutzungsverfolgung
  - H2: Verwandte Themen

## cli/infer.md

- Route: /cli/infer
- Überschriften:
  - H2: infer in einen Skill umwandeln
  - H2: Befehlsbaum
  - H2: Häufige Aufgaben
  - H2: Verhalten
  - H2: Modell
  - H2: Bild
  - H2: Audio
  - H2: TTS
  - H2: Video
  - H2: Web
  - H2: Einbettung
  - H2: JSON-Ausgabe
  - H2: Häufige Fallstricke
  - H2: Verwandte Themen

## cli/logs.md

- Route: /cli/logs
- Überschriften:
  - H1: openclaw logs
  - H2: Optionen
  - H2: Gemeinsame Gateway-RPC-Optionen
  - H2: Beispiele
  - H2: Fallback- und Wiederherstellungsverhalten
  - H2: Verwandte Themen

## cli/mcp.md

- Route: /cli/mcp
- Überschriften:
  - H2: Den richtigen MCP-Pfad auswählen
  - H2: OpenClaw als MCP-Server
  - H3: Wann serve verwendet werden sollte
  - H3: Funktionsweise
  - H3: Clientmodus auswählen
  - H3: Was serve bereitstellt
  - H3: Verwendung
  - H3: Bridge-Werkzeuge
  - H3: Ereignismodell
  - H3: Claude-Kanalbenachrichtigungen
  - H3: MCP-Clientkonfiguration
  - H3: Optionen
  - H3: Sicherheits- und Vertrauensgrenze
  - H3: Tests
  - H3: Fehlerbehebung
  - H2: OpenClaw als MCP-Clientregistrierung
  - H3: Gespeicherte MCP-Serverdefinitionen
  - H3: Häufige Serverrezepte
  - H3: JSON-Ausgabeformen
  - H3: Stdio-Transport
  - H3: SSE-/HTTP-Transport
  - H3: OAuth-Arbeitsablauf
  - H3: Streamfähiger HTTP-Transport
  - H2: Steuerungsoberfläche
  - H2: MCP-Apps
  - H2: Aktuelle Einschränkungen
  - H2: Verwandte Themen

## cli/memory.md

- Route: /cli/memory
- Überschriften:
  - H1: openclaw memory
  - H2: memory status
  - H2: memory index
  - H2: memory search
  - H2: memory promote
  - H2: memory promote-explain
  - H2: memory rem-harness
  - H2: memory rem-backfill
  - H2: Dreaming
  - H2: Gateway-Abhängigkeit für SecretRef
  - H2: Verwandte Themen

## cli/message.md

- Route: /cli/message
- Überschriften:
  - H1: openclaw message
  - H2: Kanalauswahl
  - H2: Zielformate (-t, --target)
  - H2: Häufige Flags
  - H2: SecretRef-Auflösung
  - H2: Aktionen
  - H3: Kernfunktionen
  - H3: Senden
  - H3: Umfrage
  - H3: Threads
  - H3: Emojis
  - H3: Sticker
  - H3: Rollen, Kanäle, Sprache und Ereignisse (Discord)
  - H3: Moderation (Discord)
  - H3: Rundsendung
  - H2: Verwandte Themen

## cli/migrate.md

- Route: /cli/migrate
- Überschriften:
  - H1: openclaw migrate
  - H2: Befehle
  - H2: Sicherheitsmodell
  - H2: Claude-Provider
  - H3: Was Claude importiert
  - H3: Archiv- und Zustand für manuelle Prüfung
  - H2: Codex-Provider
  - H3: Was Codex importiert
  - H3: Codex-Zustand für manuelle Prüfung
  - H2: Hermes-Provider
  - H3: Was Hermes importiert
  - H3: Unterstützte .env-Schlüssel
  - H3: Reiner Archivzustand
  - H3: Nach der Anwendung
  - H2: Plugin-Vertrag
  - H2: Onboarding-Integration
  - H2: Verwandte Themen

## cli/models.md

- Route: /cli/models
- Überschriften:
  - H1: openclaw models
  - H2: Häufige Befehle
  - H3: Status
  - H3: Auflisten
  - H3: Standard-/Bildmodell festlegen
  - H3: Scannen
  - H2: Aliasse
  - H2: Fallbacks
  - H2: Authentifizierungsprofile
  - H2: Verwandte Themen

## cli/node.md

- Route: /cli/node
- Überschriften:
  - H1: openclaw node
  - H2: Warum einen Node-Host verwenden?
  - H2: Browser-Proxy (ohne Konfiguration)
  - H2: Ausführen (Vordergrund)
  - H2: Gateway-Authentifizierung für den Node-Host
  - H2: Dienst (Hintergrund)
  - H2: Kopplung
  - H3: Identitäts- und Kopplungszustand
  - H2: Ausführungsgenehmigungen
  - H2: Verwandte Themen

## cli/nodes.md

- Route: /cli/nodes
- Überschriften:
  - H1: openclaw nodes
  - H2: Status
  - H2: Kopplung
  - H2: Aufrufen
  - H2: Benachrichtigung, Push, Standort und Bildschirm
  - H2: Verwandte Themen

## cli/onboard.md

- Route: /cli/onboard
- Überschriften:
  - H1: openclaw onboard
  - H2: Beispiele
  - H2: Geführter Ablauf
  - H2: Zurücksetzen
  - H2: Gebietsschema
  - H2: Nicht interaktive Einrichtung
  - H3: Gateway-Authentifizierung (nicht interaktiv)
  - H3: Integrität des lokalen Gateways
  - H3: Interaktiver Referenzmodus
  - H3: Auswahlmöglichkeiten für den Z.AI-Endpunkt
  - H2: Zusätzliche nicht interaktive Flags
  - H2: Vorfilterung von Providern
  - H2: Folgeaktionen für die Websuche
  - H2: Weitere Verhaltensweisen
  - H2: Häufige Folgebefehle

## cli/pairing.md

- Route: /cli/pairing
- Überschriften:
  - H1: openclaw pairing
  - H2: Befehle
  - H2: pairing list
  - H2: pairing approve
  - H3: Ersteinrichtung des Eigentümers
  - H2: Verwandte Themen

## cli/path.md

- Route: /cli/path
- Überschriften:
  - H1: openclaw path
  - H2: Gründe für die Verwendung
  - H2: Verwendung
  - H2: Funktionsweise
  - H2: Unterbefehle
  - H2: Globale Flags
  - H2: oc://-Syntax
  - H2: Adressierung nach Dateiart
  - H2: Mutationsvertrag
  - H2: Beispiele
  - H2: Rezepte nach Dateiart
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Unterbefehlsreferenz
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Exitcodes
  - H2: Ausgabemodus
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/plugins.md

- Route: /cli/plugins
- Überschriften:
  - H2: Befehle
  - H2: Erstellen
  - H3: Provider-Grundgerüst
  - H2: Installieren
  - H3: Marketplace-Kurzform
  - H2: Auflisten
  - H3: Plugin-Index
  - H2: Deinstallieren
  - H2: Aktualisieren
  - H2: Untersuchen
  - H2: Diagnose
  - H2: Registrierung
  - H2: Marketplace
  - H2: Verwandte Themen

## cli/policy.md

- Route: /cli/policy
- Überschriften:
  - H1: openclaw policy
  - H2: Schnellstart
  - H3: Referenz der Richtlinienregeln
  - H4: Bereichsbezogene Überlagerungen
  - H4: Kanäle
  - H4: MCP-Server
  - H4: Modell-Provider
  - H4: Netzwerk
  - H4: Eingangs- und Kanalzugriff
  - H4: Gateway
  - H4: Agent-Arbeitsbereich
  - H4: Sandbox-Sicherheitsniveau
  - H4: Datenverarbeitung
  - H4: Geheimnisse
  - H4: Ausführungsgenehmigungen
  - H4: Authentifizierungsprofile
  - H4: Werkzeugmetadaten
  - H4: Werkzeug-Sicherheitsniveau
  - H2: Prüfungen ausführen
  - H2: Richtlinie konfigurieren
  - H2: Richtlinienzustand akzeptieren
  - H2: Befunde
  - H2: Reparatur
  - H2: Exitcodes
  - H2: Verwandte Themen

## cli/promos.md

- Route: /cli/promos
- Überschriften:
  - H1: openclaw promos
  - H2: Befehle
  - H2: openclaw promos list
  - H2: openclaw promos claim &lt;slug&gt;
  - H2: Passive Erkennung in der Modellliste

## cli/proxy.md

- Route: /cli/proxy
- Überschriften:
  - H1: openclaw proxy
  - H2: Validieren
  - H3: Optionen
  - H2: Proxy debuggen
  - H2: Verwandte Themen

## cli/qr.md

- Route: /cli/qr
- Überschriften:
  - H1: openclaw qr
  - H2: Optionen
  - H2: Inhalt des Einrichtungscodes
  - H2: Auflösung der Gateway-URL
  - H2: Authentifizierungsauflösung (ohne --remote)
  - H2: Authentifizierungsauflösung (--remote)
  - H2: Verwandte Themen

## cli/reset.md

- Route: /cli/reset
- Überschriften:
  - H1: openclaw reset
  - H2: Optionen
  - H2: Bereiche
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/sandbox.md

- Route: /cli/sandbox
- Überschriften:
  - H2: Befehle
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H3: openclaw sandbox explain
  - H2: Warum die Neuerstellung erforderlich ist
  - H2: Häufige Auslöser
  - H2: Registrierungsmigration
  - H2: Konfiguration
  - H2: Verwandte Themen

## cli/secrets.md

- Route: /cli/secrets
- Überschriften:
  - H1: openclaw secrets
  - H2: Laufzeit-Snapshot neu laden
  - H2: Audit
  - H2: Konfigurieren (interaktiver Assistent)
  - H3: Sicherheit des Exec-Providers
  - H2: Einen gespeicherten Plan anwenden
  - H3: Warum es keine Rollback-Sicherungen gibt
  - H2: Beispiel
  - H2: Verwandte Themen

## cli/security.md

- Route: /cli/security
- Überschriften:
  - H1: openclaw security
  - H2: Auditmodi
  - H2: Was geprüft wird
  - H2: SecretRef-Verhalten
  - H2: Unterdrückungen
  - H2: JSON-Ausgabe
  - H2: Was --fix ändert
  - H2: Verwandte Themen

## cli/sessions.md

- Route: /cli/sessions
- Überschriften:
  - H1: openclaw sessions
  - H2: Fortschritt am Ende der Trajektorie
  - H2: Ein Trajektorienpaket exportieren
  - H2: Bereinigungswartung
  - H2: Eine Sitzung komprimieren
  - H3: sessions.compact-RPC
  - H2: Verwandte Themen

## cli/setup.md

- Route: /cli/setup
- Überschriften:
  - H1: openclaw setup
  - H2: Optionen
  - H3: Basismodus
  - H2: Beispiele
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/skills.md

- Route: /cli/skills
- Überschriften:
  - H1: openclaw skills
  - H2: Befehle
  - H2: Skill-Workshop
  - H2: Verwandte Themen

## cli/status.md

- Route: /cli/status
- Überschriften:
  - H2: Sitzungs- und Modellauflösung
  - H2: Nutzung und Kontingent
  - H2: Übersicht und Aktualisierungsstatus
  - H2: Geheimnisse
  - H2: Arbeitsspeicher
  - H2: Verwandte Themen

## cli/system.md

- Route: /cli/system
- Überschriften:
  - H1: openclaw system
  - H2: Häufige Befehle
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/tasks.md

- Route: /cli/tasks
- Überschriften:
  - H2: Verwendung
  - H2: Stammoptionen
  - H2: Unterbefehle
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Verwandte Themen

## cli/transcripts.md

- Route: /cli/transcripts
- Überschriften:
  - H1: openclaw transcripts
  - H2: Befehle
  - H2: Ausgabe
  - H2: Viele Sitzungen pro Tag
  - H2: Fehlende Zusammenfassungen
  - H2: Konfiguration

## cli/tui.md

- Route: /cli/tui
- Überschriften:
  - H1: openclaw tui
  - H2: Optionen
  - H2: Hinweise
  - H2: Beispiele
  - H2: Konfigurationsreparaturschleife
  - H2: Verwandte Themen

## cli/uninstall.md

- Route: /cli/uninstall
- Überschriften:
  - H1: openclaw uninstall
  - H2: Optionen
  - H2: Beispiele
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/update.md

- Route: /cli/update
- Überschriften:
  - H1: openclaw update
  - H2: Verwendung
  - H2: Optionen
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Funktionsweise
  - H3: Übergabe beim Neustart
  - H3: Form der Steuerungsebenenantwort
  - H2: Git-Checkout-Ablauf
  - H3: Kanalauswahl
  - H3: Aktualisierungsschritte
  - H3: Details zur Plugin-Synchronisierung
  - H2: Verwandte Themen

## cli/voicecall.md

- Route: /cli/voicecall
- Überschriften:
  - H1: openclaw voicecall
  - H2: Unterbefehle
  - H2: Einrichtung und Smoke-Test
  - H3: setup
  - H3: smoke
  - H2: Anruflebenszyklus
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Protokolle und Metriken
  - H3: tail
  - H3: latency
  - H2: Webhooks verfügbar machen
  - H3: expose
  - H2: Verwandte Themen

## cli/webhooks.md

- Route: /cli/webhooks
- Überschriften:
  - H1: openclaw webhooks
  - H2: Unterbefehle
  - H2: webhooks gmail setup
  - H3: Erforderlich
  - H3: Pub/Sub-Optionen
  - H3: OpenClaw-Zustellungsoptionen
  - H3: Optionen für gog watch serve
  - H3: Tailscale-Freigabe
  - H3: Ausgabe
  - H2: webhooks gmail run
  - H2: Verwandte Themen

## cli/wiki.md

- Route: /cli/wiki
- Überschriften:
  - H1: openclaw wiki
  - H2: Häufige Befehle
  - H2: Agent-Auswahl
  - H2: Befehle
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki chatgpt import
  - H3: wiki chatgpt rollback &lt;run-id&gt;
  - H3: wiki obsidian ...
  - H2: Praktische Nutzungshinweise
  - H2: Verknüpfungen mit der Konfiguration
  - H2: Verwandte Themen

## cli/workboard.md

- Route: /cli/workboard
- Überschriften:
  - H2: Verwendung
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Funktionsgleichheit der Slash-Befehle
  - H2: Berechtigungen
  - H2: Fehlerbehebung
  - H3: Es werden keine Karten angezeigt
  - H3: dispatch meldet data-only
  - H3: dispatch startet nichts
  - H2: Verwandte Themen

## concepts/active-memory.md

- Route: /concepts/active-memory
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise
  - H2: Ausführungszeitpunkt
  - H3: Sitzungstypen
  - H2: Sitzungsschalter
  - H2: Anzeige
  - H2: Abfragemodi
  - H2: Prompt-Stile
  - H2: Modell-Fallback-Richtlinie
  - H3: Geschwindigkeitsempfehlungen
  - H4: Cerebras-Einrichtung
  - H2: Speicherwerkzeuge
  - H3: Integriertes memory-core
  - H3: LanceDB-Speicher
  - H3: Lossless Claw
  - H2: Erweiterte Ausweichmöglichkeiten
  - H2: Transkriptpersistenz
  - H2: Konfiguration
  - H2: Empfohlene Einrichtung
  - H3: Kulanzfrist beim Kaltstart
  - H2: Fehlersuche
  - H2: Häufige Probleme
  - H2: Verwandte Seiten

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- Überschriften:
  - H2: Einstiegspunkte
  - H2: Ausführungssequenz
  - H2: Warteschlangen und Nebenläufigkeit
  - H2: Sitzungs- und Arbeitsbereichsvorbereitung
  - H2: Prompt-Zusammenstellung
  - H2: Hooks
  - H3: Interne Hooks (Gateway-Hooks)
  - H3: Plugin-Hooks
  - H2: Streaming
  - H2: Werkzeugausführung
  - H2: Antwortgestaltung
  - H2: Compaction und Wiederholungsversuche
  - H2: Ereignisströme
  - H2: Verarbeitung von Chat-Kanälen
  - H2: Zeitüberschreitungen
  - H3: Diagnose festgefahrener Sitzungen
  - H2: Stellen, an denen Vorgänge vorzeitig enden können
  - H2: Verwandte Themen

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- Überschriften:
  - H2: Codex-Oberflächen
  - H2: Zuständigkeit für die Laufzeit
  - H2: Laufzeitauswahl
  - H2: GitHub-Copilot-Agentenlaufzeit
  - H2: Kompatibilitätsvertrag
  - H2: Statusbezeichnungen
  - H2: Verwandte Themen

## concepts/agent-workspace.md

- Route: /concepts/agent-workspace
- Überschriften:
  - H2: Standardspeicherort
  - H2: Zusätzliche Arbeitsbereichsordner
  - H2: Dateizuordnung des Arbeitsbereichs
  - H2: Was sich NICHT im Arbeitsbereich befindet
  - H2: Git-Sicherung (empfohlen, privat)
  - H2: Keine Geheimnisse committen
  - H2: Arbeitsbereich auf einen neuen Computer verschieben
  - H2: Erweiterte Hinweise
  - H2: Verwandte Themen

## concepts/agent.md

- Route: /concepts/agent
- Überschriften:
  - H2: Arbeitsbereich (erforderlich)
  - H2: Bootstrap-Dateien (injiziert)
  - H2: Integrierte Werkzeuge
  - H2: Skills
  - H2: Laufzeitgrenzen
  - H2: Sitzungen
  - H2: Steuerung während des Streamings
  - H2: Modellreferenzen
  - H2: Konfiguration (minimal)
  - H2: Verwandte Themen

## concepts/architecture.md

- Route: /concepts/architecture
- Überschriften:
  - H2: Überblick
  - H2: Komponenten und Abläufe
  - H3: Gateway (Daemon)
  - H3: Clients (Mac-App / CLI / Webadministration)
  - H3: Nodes (macOS / iOS / Android / Headless)
  - H3: WebChat
  - H2: Verbindungslebenszyklus (einzelner Client)
  - H2: Übertragungsprotokoll (Zusammenfassung)
  - H2: Kopplung und lokales Vertrauen
  - H2: Protokolltypisierung und Codegenerierung
  - H2: Fernzugriff
  - H2: Betriebsübersicht
  - H2: Invarianten
  - H2: Verwandte Themen

## concepts/channel-docking.md

- Route: /concepts/channel-docking
- Überschriften:
  - H2: Beispiel
  - H2: Gründe für die Verwendung
  - H2: Erforderliche Konfiguration
  - H2: Befehle
  - H2: Was sich ändert
  - H2: Was sich nicht ändert
  - H2: Fehlerbehebung

## concepts/commitments.md

- Route: /concepts/commitments
- Überschriften:
  - H2: Zusagen aktivieren
  - H2: Funktionsweise
  - H2: Umfang
  - H2: Zusagen im Vergleich zu Erinnerungen
  - H2: Zusagen verwalten
  - H2: Datenschutz und Kosten
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## concepts/compaction.md

- Route: /concepts/compaction
- Überschriften:
  - H2: Funktionsweise
  - H2: Automatische Compaction
  - H2: Manuelle Compaction
  - H2: Konfiguration
  - H3: Verwendung eines anderen Modells
  - H3: Beibehaltung von Bezeichnern
  - H3: Byte-Schutz für aktive Transkripte
  - H3: Nachfolgetranskripte
  - H3: Compaction-Hinweise
  - H3: Speicherleerung
  - H2: Austauschbare Compaction-Provider
  - H2: Compaction im Vergleich zur Bereinigung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## concepts/context-engine.md

- Route: /concepts/context-engine
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise
  - H3: Lebenszyklus von Unteragenten (optional)
  - H3: Ergänzung des System-Prompts
  - H2: Die Legacy-Engine
  - H2: Plugin-Engines
  - H3: Die ContextEngine-Schnittstelle
  - H3: Laufzeiteinstellungen
  - H3: Hostanforderungen
  - H3: Fehlerisolierung
  - H3: ownsCompaction
  - H2: Konfigurationsreferenz
  - H2: Beziehung zu Compaction und Speicher
  - H2: Tipps
  - H2: Verwandte Themen

## concepts/context.md

- Route: /concepts/context
- Überschriften:
  - H2: Schnellstart (Kontext untersuchen)
  - H2: Beispielausgabe
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Was zum Kontextfenster zählt
  - H2: Wie OpenClaw den System-Prompt erstellt
  - H2: Injizierte Arbeitsbereichsdateien (Projektkontext)
  - H2: Skills: injiziert oder bei Bedarf geladen
  - H2: Werkzeuge: Es fallen zwei Kostenarten an
  - H2: Befehle, Direktiven und „Inline-Kurzbefehle“
  - H2: Sitzungen, Compaction und Bereinigung (was erhalten bleibt)
  - H2: Was /context tatsächlich meldet
  - H2: Verwandte Themen

## concepts/delegate-architecture.md

- Route: /concepts/delegate-architecture
- Überschriften:
  - H2: Was ist ein Delegat?
  - H2: Gründe für Delegaten
  - H2: Berechtigungsstufen
  - H3: Stufe 1: Schreibgeschützt + Entwurf
  - H3: Stufe 2: Im Auftrag senden
  - H3: Stufe 3: Proaktiv
  - H2: Voraussetzungen: Isolierung und Härtung
  - H3: Harte Sperren (nicht verhandelbar)
  - H3: Werkzeugeinschränkungen
  - H3: Sandbox-Isolierung
  - H3: Prüfpfad
  - H2: Einen Delegaten einrichten
  - H3: 1. Delegaten-Agenten erstellen
  - H3: 2. Delegierung des Identitätsproviders konfigurieren
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Delegaten an Kanäle binden
  - H3: 4. Anmeldedaten zum Delegaten-Agenten hinzufügen
  - H2: Beispiel: Organisationsassistent
  - H2: Skalierungsmuster
  - H2: Verwandte Themen

## concepts/dreaming.md

- Route: /concepts/dreaming
- Überschriften:
  - H2: Was Dreaming schreibt
  - H2: Phasenmodell
  - H2: Einlesen von Sitzungstranskripten
  - H2: Traumtagebuch
  - H2: Tiefgehende Rangordnungssignale
  - H3: Abdeckung des QA-Schattenversuchsberichts
  - H2: Zeitplanung
  - H2: Schnellstart
  - H2: Slash-Befehl
  - H2: CLI-Arbeitsablauf
  - H2: Wichtige Standardwerte
  - H2: Benutzeroberfläche für Träume
  - H2: Verwandte Themen

## concepts/experimental-features.md

- Route: /concepts/experimental-features
- Überschriften:
  - H2: Derzeit dokumentierte Flags
  - H2: Schlanker Modus für lokale Modelle
  - H3: Gründe für diese Werkzeuge
  - H3: Wann Sie ihn aktivieren sollten
  - H3: Wann Sie ihn deaktiviert lassen sollten
  - H3: Aktivieren
  - H2: Experimentell bedeutet nicht verborgen
  - H2: Verwandte Themen

## concepts/features.md

- Route: /concepts/features
- Überschriften:
  - H2: Highlights
  - H2: Vollständige Liste
  - H2: Verwandte Themen

## concepts/managed-worktrees.md

- Route: /concepts/managed-worktrees
- Überschriften:
  - H2: Layout und Namen
  - H2: Ignorierte Dateien bereitstellen
  - H2: Repository-Einrichtung ausführen
  - H2: Sitzungs-Worktrees
  - H2: Snapshots, Bereinigung und Wiederherstellung
  - H2: CLI
  - H2: Gateway-Methoden
  - H2: Workboard-Arbeitsbereiche

## concepts/mantis-slack-desktop-runbook.md

- Route: /concepts/mantis-slack-desktop-runbook
- Überschriften:
  - H2: Speichermodell
  - H2: GitHub-Auslösung
  - H2: Lokale CLI
  - H2: Hydrierungsmodi
  - H2: Interpretation der Zeitmessung
  - H2: Nachweisprüfliste
  - H2: Fehlerbehandlung
  - H2: Verwandte Themen

## concepts/mantis.md

- Route: /concepts/mantis
- Überschriften:
  - H2: Zuständigkeit
  - H2: CLI-Befehle
  - H3: discord-smoke
  - H3: run
  - H3: desktop-browser-smoke
  - H3: slack-desktop-smoke
  - H3: telegram-desktop-builder
  - H2: Nachweismanifest
  - H2: GitHub-Automatisierung
  - H2: Computer und Geheimnisse
  - H2: Ausführungsergebnisse
  - H2: Ein Szenario hinzufügen
  - H2: Offene Fragen

## concepts/markdown-formatting.md

- Route: /concepts/markdown-formatting
- Überschriften:
  - H2: Pipeline
  - H2: IR-Beispiel
  - H2: Tabellenverarbeitung
  - H2: Aufteilungsregeln
  - H2: Linkrichtlinie
  - H2: Spoiler
  - H2: Einen Kanalformatierer hinzufügen oder aktualisieren
  - H2: Häufige Fallstricke
  - H2: Verwandte Themen

## concepts/memory-builtin.md

- Route: /concepts/memory-builtin
- Überschriften:
  - H2: Bereitgestellte Funktionen
  - H2: Erste Schritte
  - H2: Unterstützte Embedding-Provider
  - H2: Funktionsweise der Indizierung
  - H2: Verwendungsfälle
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H2: Verwandte Themen

## concepts/memory-honcho.md

- Route: /concepts/memory-honcho
- Überschriften:
  - H2: Bereitgestellte Funktionen
  - H2: Verfügbare Werkzeuge
  - H2: Erste Schritte
  - H2: Konfiguration
  - H2: Vorhandenen Speicher migrieren
  - H2: Funktionsweise
  - H2: Honcho im Vergleich zum integrierten Speicher
  - H2: CLI-Befehle
  - H2: Weiterführende Literatur
  - H2: Verwandte Themen

## concepts/memory-qmd.md

- Route: /concepts/memory-qmd
- Überschriften:
  - H2: Zusätzliche Funktionen gegenüber der integrierten Variante
  - H2: Erste Schritte
  - H3: Voraussetzungen
  - H3: Aktivieren
  - H2: Funktionsweise des Sidecars
  - H2: Suchleistung und Kompatibilität
  - H2: Modellüberschreibungen
  - H2: Zusätzliche Pfade indizieren
  - H2: Sitzungstranskripte indizieren
  - H2: Suchumfang
  - H2: Quellenangaben
  - H2: Verwendungsfälle
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H2: Verwandte Themen

## concepts/memory-search.md

- Route: /concepts/memory-search
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H2: Funktionsweise der Suche
  - H2: Suchqualität verbessern
  - H3: Zeitlicher Verfall
  - H3: MMR (Diversität)
  - H3: Beide aktivieren
  - H2: Multimodaler Speicher
  - H2: Sitzungsspeichersuche
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## concepts/memory.md

- Route: /concepts/memory
- Überschriften:
  - H2: Funktionsweise
  - H2: Was wohin gehört
  - H2: Aktionsabhängige Erinnerungen
  - H2: Abgeleitete Zusagen
  - H2: Speicherwerkzeuge
  - H2: Speichersuche
  - H2: Speicher-Backends
  - H2: Wissens-Wiki-Ebene
  - H2: Automatische Speicherleerung
  - H2: Dreaming
  - H2: Faktenbasierte Nachbefüllung und Live-Übernahme
  - H2: CLI
  - H2: Weiterführende Literatur

## concepts/message-lifecycle-refactor.md

- Route: /concepts/message-lifecycle-refactor
- Überschriften:
  - H2: Warum dieses Refactoring durchgeführt wurde
  - H2: Was ausgeliefert wurde
  - H3: Sendekontext
  - H3: Empfangskontext
  - H3: Live-Vorschau
  - H3: Dauerhafte Empfangsbestätigungen
  - H3: Verkleinerung des öffentlichen SDK
  - H2: Wo die Implementierung vom ursprünglichen Entwurf abwich
  - H2: Konkrete Migrationsrisiken (weiterhin relevant)
  - H2: Fehlerklassifizierung
  - H2: Offene Fragen
  - H2: Verwandte Themen

## concepts/messages.md

- Route: /concepts/messages
- Überschriften:
  - H2: Deduplizierung eingehender Nachrichten
  - H2: Entprellung eingehender Nachrichten
  - H2: Sitzungen und Geräte
  - H2: Prompt-Inhalte und Verlaufskontext
  - H2: Metadaten von Werkzeugergebnissen
  - H2: Warteschlangen und Folgenachrichten
  - H2: Zuständigkeit für Kanalausführungen
  - H2: Streaming, Aufteilung und Bündelung
  - H2: Sichtbarkeit von Schlussfolgerungen und Tokens
  - H2: Präfixe, Threads und Antworten
  - H2: Stille Antworten
  - H2: Verwandte Themen

## concepts/model-failover.md

- Route: /concepts/model-failover
- Überschriften:
  - H2: Laufzeitablauf
  - H2: Richtlinie für die Auswahlquelle
  - H2: Überspring-Cache für Authentifizierungsfehler
  - H2: Für Benutzer sichtbare Fallback-Hinweise
  - H2: Authentifizierungsspeicher (Schlüssel + OAuth)
  - H2: Profil-IDs
  - H2: Rotationsreihenfolge
  - H3: Sitzungsbindung (cachefreundlich)
  - H3: OpenAI-Codex-Abonnement mit API-Schlüssel als Absicherung
  - H2: Abklingzeiten
  - H2: Deaktivierungen aufgrund der Abrechnung
  - H2: Modell-Fallback
  - H3: Regeln für die Kandidatenkette
  - H3: Bei welchen Fehlern zum nächsten Fallback gewechselt wird
  - H3: Verhalten beim Überspringen gegenüber Prüfen während der Abklingzeit
  - H2: Sitzungsüberschreibungen und Live-Modellwechsel
  - H2: Beobachtbarkeit und Fehlerzusammenfassungen
  - H2: Zugehörige Konfiguration

## concepts/model-providers.md

- Route: /concepts/model-providers
- Überschriften:
  - H2: Kurzregeln
  - H2: Plugin-eigenes Provider-Verhalten
  - H2: API-Schlüsselrotation
  - H2: Offizielle Provider-Plugins
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Weitere gehostete Optionen im Abonnementstil
  - H3: OpenCode
  - H3: Google Gemini (API-Schlüssel)
  - H3: Google Vertex und Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Weitere gebündelte Provider-Plugins
  - H4: Wissenswerte Besonderheiten
  - H2: Provider über models.providers (benutzerdefinierte/Basis-URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi Coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (International)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Lokale Proxys (LM Studio, vLLM, LiteLLM usw.)
  - H2: CLI-Beispiele
  - H2: Verwandte Themen

## concepts/models.md

- Route: /concepts/models
- Überschriften:
  - H2: Auswahlreihenfolge
  - H2: Auswahlquelle und Strenge des Fallbacks
  - H2: Kurze Modellrichtlinie
  - H2: Ersteinrichtung
  - H2: „Modell ist nicht zulässig“ (und warum Antworten ausbleiben)
  - H2: /model im Chat
  - H2: CLI
  - H2: Modellregister (models.json)
  - H2: Verwandte Themen

## concepts/multi-agent.md

- Route: /concepts/multi-agent
- Überschriften:
  - H2: Was ist ein Agent
  - H2: Pfade
  - H3: Einzelagentenmodus (Standard)
  - H2: Agent-Hilfsprogramm
  - H2: Schnellstart
  - H2: Mehrere Agenten, mehrere Personas
  - H2: Memory-Wiki-Vaults pro Agent
  - H2: Agentenübergreifende QMD-Speichersuche
  - H2: Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)
  - H2: Routingregeln
  - H2: Mehrere Konten/Telefonnummern
  - H2: Konzepte
  - H2: Plattformbeispiele
  - H2: Gängige Muster
  - H2: Sandbox- und Tool-Konfiguration pro Agent
  - H2: Verwandte Themen

## concepts/oauth.md

- Route: /concepts/oauth
- Überschriften:
  - H2: Die Token-Senke (warum es sie gibt)
  - H2: Speicherung (wo Tokens abgelegt werden)
  - H2: Wiederverwendung der Anthropic-Claude-CLI
  - H2: OAuth-Austausch (wie die Anmeldung funktioniert)
  - H3: Anthropic-Setup-Token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Aktualisierung und Ablauf
  - H2: Mehrere Konten (Profile) und Routing
  - H3: 1) Bevorzugt: separate Agenten
  - H3: 2) Erweitert: mehrere Profile in einem Agenten
  - H2: Verwandte Themen

## concepts/parallel-specialist-lanes.md

- Route: /concepts/parallel-specialist-lanes
- Überschriften:
  - H2: Grundprinzipien
  - H2: Empfohlene Einführung
  - H3: Phase 1: Lane-Verträge und rechenintensive Hintergrundarbeit
  - H3: Phase 2: Prioritäts- und Parallelitätssteuerung
  - H3: Phase 3: Koordinator/Verkehrssteuerung
  - H2: Minimale Vorlage für Lane-Verträge
  - H2: Verwandte Themen

## concepts/personal-agent-benchmark-pack.md

- Route: /concepts/personal-agent-benchmark-pack
- Überschriften:
  - H2: Szenarien
  - H2: Datenschutzmodell
  - H2: Paket erweitern

## concepts/presence.md

- Route: /concepts/presence
- Überschriften:
  - H2: Präsenzfelder (was angezeigt wird)
  - H2: Produzenten (woher die Präsenz stammt)
  - H3: 1) Gateway-Selbsteintrag
  - H3: 2) WebSocket-Verbindung
  - H4: Warum kurzlebige Control-Plane-Verbindungen nicht angezeigt werden
  - H3: 3) system-event-Beacons
  - H3: 4) Node-Verbindungen (Rolle: node)
  - H2: Regeln für Zusammenführung und Deduplizierung (warum instanceId wichtig ist)
  - H2: TTL und begrenzte Größe
  - H2: Einschränkung bei Remote-/Tunnelverbindungen (Loopback-IPs)
  - H2: Konsumenten
  - H3: Geräteseite der Control UI
  - H3: Tab „Instanzen“ unter macOS
  - H2: Tipps zur Fehlerbehebung
  - H2: Verwandte Themen

## concepts/progress-drafts.md

- Route: /concepts/progress-drafts
- Überschriften:
  - H2: Schnellstart
  - H2: Was Benutzer sehen
  - H2: Modus auswählen
  - H2: Bezeichnungen konfigurieren
  - H2: Fortschrittszeilen steuern
  - H3: Detailmodus
  - H3: Befehls-/Ausführungstext
  - H3: Kommentar-Lane
  - H3: Beschriebener Status
  - H3: Zeilenbegrenzungen
  - H3: Umfangreiche Darstellung (Slack)
  - H3: Tool-/Aufgabenzeilen ausblenden
  - H2: Kanalverhalten
  - H2: Abschluss
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## concepts/qa-e2e-automation.md

- Route: /concepts/qa-e2e-automation
- Überschriften:
  - H2: Befehlsoberfläche
  - H3: Profilgestützter QA-Lauf
  - H2: Bedienablauf
  - H3: Observability-Smoke-Tests
  - H3: Matrix-Smoke-Lanes
  - H3: Discord-Mantis-Szenarien
  - H3: Mantis-Runner für den Slack-Desktop und visuelle Aufgaben
  - H3: Zustandsprüfung des Zugangsdaten-Pools
  - H2: Live-Transportabdeckung
  - H2: QA-Referenz für Discord, Slack, Telegram und WhatsApp
  - H3: Gemeinsame CLI-Flags
  - H3: Telegram-QA
  - H3: Discord-QA
  - H3: Slack-QA
  - H4: Slack-Workspace einrichten
  - H3: WhatsApp-QA
  - H3: Convex-Zugangsdaten-Pool
  - H2: Repository-gestützte Seed-Daten
  - H2: Provider-Mock-Lanes
  - H2: Transportadapter
  - H3: Kanal hinzufügen
  - H3: Namen der Szenario-Hilfsfunktionen
  - H2: Berichterstellung
  - H2: Verwandte Dokumentation

## concepts/qa-matrix.md

- Route: /concepts/qa-matrix
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise der Lane
  - H2: CLI
  - H3: Gängige Flags
  - H3: Provider-Flags
  - H2: Profile
  - H2: Szenarien
  - H2: Umgebungsvariablen
  - H2: Ausgabeartefakte
  - H2: Tipps zur Triage
  - H2: Live-Transportvertrag
  - H2: Verwandte Themen

## concepts/queue-steering.md

- Route: /concepts/queue-steering
- Überschriften:
  - H2: Laufzeitgrenze
  - H2: Modi
  - H2: Burst-Beispiel
  - H2: Geltungsbereich
  - H2: Entprellung
  - H2: Verwandte Themen

## concepts/queue.md

- Route: /concepts/queue
- Überschriften:
  - H2: Warum
  - H2: Funktionsweise
  - H2: Standardwerte
  - H2: Warteschlangenmodi
  - H2: Warteschlangenoptionen
  - H2: Steuerung und Streaming
  - H2: Rangfolge
  - H2: Sitzungsbezogene Überschreibungen
  - H2: Abbruch von Durchläufen in der Warteschlange
  - H2: Geltungsbereich und Garantien
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## concepts/retry.md

- Route: /concepts/retry
- Überschriften:
  - H2: Ziele
  - H2: Standardwerte
  - H2: Verhalten
  - H3: Modell-Provider
  - H3: Discord
  - H3: Telegram
  - H2: Konfiguration
  - H2: Hinweise
  - H2: Verwandte Themen

## concepts/session-pruning.md

- Route: /concepts/session-pruning
- Überschriften:
  - H2: Warum dies wichtig ist
  - H2: Funktionsweise
  - H2: Bereinigung veralteter Bilder
  - H2: Intelligente Standardwerte
  - H2: Aktivieren oder deaktivieren
  - H2: Bereinigung im Vergleich zu Compaction
  - H2: Weiterführende Informationen
  - H2: Verwandte Themen

## concepts/session-search.md

- Route: /concepts/session-search
- Überschriften:
  - H1: Sitzungssuche
  - H2: Sichtbarkeit und Ausgabe
  - H2: Indexlebenszyklus
  - H2: Sitzungssuche im Vergleich zur Speichersuche

## concepts/session-tool.md

- Route: /concepts/session-tool
- Überschriften:
  - H2: Verfügbare Tools
  - H2: Sitzungen auflisten und lesen
  - H2: Sitzungsübergreifende Nachrichten senden
  - H2: Hilfsfunktionen für Status und Orchestrierung
  - H2: Änderungen des Sitzungsstatus
  - H2: Unteragenten starten
  - H2: Sichtbarkeit
  - H2: Weiterführende Informationen
  - H2: Verwandte Themen

## concepts/session.md

- Route: /concepts/session
- Überschriften:
  - H2: Weiterleitung von Nachrichten
  - H2: DM-Isolierung
  - H3: Verknüpfte Kanäle andocken
  - H2: Sitzungslebenszyklus
  - H2: Speicherort des Zustands
  - H2: Sitzungswartung
  - H2: Sitzungen untersuchen
  - H2: Weiterführende Informationen
  - H2: Verwandte Themen

## concepts/soul.md

- Route: /concepts/soul
- Überschriften:
  - H2: Was in SOUL.md gehört
  - H2: Warum dies funktioniert
  - H2: Der Molty-Prompt
  - H2: Wie ein gutes Ergebnis aussieht
  - H2: Eine Warnung
  - H2: Verwandte Themen

## concepts/streaming.md

- Route: /concepts/streaming
- Überschriften:
  - H2: Block-Streaming (Kanalnachrichten)
  - H3: Medienzustellung mit Block-Streaming
  - H2: Aufteilungsalgorithmus (Unter-/Obergrenzen)
  - H2: Zusammenführung (gestreamte Blöcke zusammenführen)
  - H2: Menschenähnliche Pausen zwischen Blöcken
  - H2: „Abschnitte oder alles streamen“
  - H2: Vorschau-Streaming-Modi
  - H3: Kanalzuordnung
  - H3: Migration veralteter Schlüssel
  - H2: Laufzeitverhalten
  - H3: Telegram
  - H3: Discord
  - H3: Slack
  - H3: Mattermost
  - H3: Matrix
  - H2: Vorschauaktualisierungen zum Werkzeugfortschritt
  - H2: Darstellung des Fortschrittsentwurfs
  - H3: Kommentar-Fortschrittskanal
  - H2: Verwandte Themen

## concepts/system-prompt.md

- Route: /concepts/system-prompt
- Überschriften:
  - H2: Struktur
  - H2: Prompt-Modi
  - H2: Prompt-Snapshots
  - H2: Einbindung des Workspace-Bootstraps
  - H2: Zeitverarbeitung
  - H2: Skills
  - H2: Dokumentation
  - H2: Verwandte Themen

## concepts/timezone.md

- Route: /concepts/timezone
- Überschriften:
  - H2: Drei Zeitzonenbereiche
  - H2: Festlegen der Benutzerzeitzone
  - H2: Zeitzonenwerte im Umschlag
  - H2: Wann eine Überschreibung sinnvoll ist
  - H2: Verwandte Themen

## concepts/typebox.md

- Route: /concepts/typebox
- Überschriften:
  - H2: Mentales Modell (30 Sekunden)
  - H2: Speicherort der Schemas
  - H2: Aktuelle Pipeline
  - H2: Verwendung der Schemas zur Laufzeit
  - H2: Beispiel-Frames
  - H2: Minimaler Client (Node.js)
  - H2: Ausführliches Beispiel: Eine Methode durchgängig hinzufügen
  - H2: Verhalten der Swift-Codegenerierung
  - H2: Versionierung und Kompatibilität
  - H2: Schemamuster und Konventionen
  - H2: Live-Schema-JSON
  - H2: Bei Änderungen an Schemas
  - H2: Verwandte Themen

## concepts/typing-indicators.md

- Route: /concepts/typing-indicators
- Überschriften:
  - H2: Standardwerte
  - H2: Modi
  - H2: Konfiguration
  - H2: Hinweise
  - H2: Verwandte Themen

## concepts/usage-tracking.md

- Route: /concepts/usage-tracking
- Überschriften:
  - H2: Was es ist
  - H2: Wo dies angezeigt wird
  - H2: Kostenverlauf für Anthropic und OpenAI
  - H2: Standardmodus der Nutzungsfußzeile
  - H3: Drei unterschiedliche Sitzungszustände
  - H3: Priorität
  - H3: Zurücksetzen gegenüber Deaktivieren
  - H3: Umschaltverhalten
  - H3: Konfiguration
  - H2: Benutzerdefinierte vollständige Fußzeile für /usage
  - H3: Struktur
  - H3: Vertragspfade
  - H3: Verben
  - H3: Teileformen
  - H3: Beispiel
  - H2: Provider + Anmeldedaten
  - H2: Verwandte Themen

## date-time.md

- Route: /date-time
- Überschriften:
  - H2: Nachrichtenumschläge (standardmäßig lokal)
  - H3: Beispiele
  - H2: System-Prompt: aktuelles Datum und aktuelle Uhrzeit
  - H2: Systemereigniszeilen (standardmäßig lokal)
  - H3: Benutzerzeitzone und Format konfigurieren
  - H2: Erkennung des Zeitformats (automatisch)
  - H2: Tool-Nutzdaten und Konnektoren (unverarbeitete Provider-Zeit und normalisierte Felder)
  - H2: Zugehörige Dokumentation

## debug/node-issue.md

- Route: /debug/node-issue
- Überschriften:
  - H1: Absturz bei Node + tsx mit „\\name is not a function“
  - H2: Status
  - H2: Ursprüngliches Symptom
  - H2: Ursache
  - H2: Aktuelle Reproduktionsprüfung
  - H2: Problemumgehungen (falls der Absturz erneut auftritt)
  - H2: Referenzen
  - H2: Verwandte Themen

## diagnostics/flags.md

- Route: /diagnostics/flags
- Überschriften:
  - H2: Funktionsweise
  - H2: Bekannte Flags
  - H2: Über die Konfiguration aktivieren
  - H2: Überschreiben per Umgebungsvariable (einmalig)
  - H2: Profiler-Flags
  - H2: Zeitleistenartefakte
  - H2: Speicherort der Protokolle
  - H2: Protokolle extrahieren
  - H2: Hinweise
  - H2: Verwandte Themen

## gateway/audit.md

- Route: /gateway/audit
- Überschriften:
  - H1: Auditverlauf
  - H2: Datensatzfamilien
  - H2: Ereignisse im Nachrichtenlebenszyklus
  - H3: Klassifizierung der Konversationsart
  - H2: Datenschutzmodell
  - H2: Abdeckungs- und Nachweisgrenzen
  - H2: Speicherung, Aufbewahrung und Migration
  - H2: Abfragen
  - H2: Verwandte Themen

## gateway/authentication.md

- Route: /gateway/authentication
- Überschriften:
  - H2: Empfohlene Einrichtung: API-Schlüssel (beliebiger Provider)
  - H2: Anthropic: Claude-CLI wiederverwenden
  - H2: Manuelle Tokeneingabe
  - H3: Durch SecretRef gestützte Anmeldedaten
  - H2: Authentifizierungsstatus des Modells prüfen
  - H2: API-Schlüsselrotation (Gateway)
  - H2: Provider-Authentifizierung bei laufendem Gateway entfernen
  - H2: Verwendete Anmeldedaten steuern
  - H3: OpenAI und veraltete openai-codex-IDs
  - H3: Während der Anmeldung (CLI)
  - H3: Pro Sitzung (Chatbefehl)
  - H3: Pro Agent (CLI-Überschreibung)
  - H2: Fehlerbehebung
  - H3: „Keine Anmeldedaten gefunden“
  - H3: Token läuft ab/ist abgelaufen
  - H2: Verwandte Themen

## gateway/background-process.md

- Route: /gateway/background-process
- Überschriften:
  - H2: exec-Werkzeug
  - H3: Überschreibungen per Umgebungsvariable
  - H3: Konfiguration (gegenüber Umgebungsüberschreibungen bevorzugt)
  - H2: Überbrückung von Unterprozessen
  - H2: process-Werkzeug
  - H2: Beispiele
  - H2: Verwandte Themen

## gateway/bonjour.md

- Route: /gateway/bonjour
- Überschriften:
  - H2: Weitverkehrs-Bonjour (Unicast DNS-SD) über Tailscale
  - H3: Gateway-Konfiguration
  - H3: Einmalige Einrichtung des DNS-Servers (Gateway-Host, nur macOS)
  - H3: Tailscale-DNS-Einstellungen
  - H3: Sicherheit des Gateway-Listeners
  - H2: Was angekündigt wird
  - H2: Diensttypen
  - H2: TXT-Schlüssel (nicht geheime Hinweise)
  - H2: Fehlerbehebung unter macOS
  - H2: Fehlerbehebung in Gateway-Protokollen
  - H2: Fehlerbehebung auf einem iOS-Node
  - H2: Wann Bonjour aktiviert werden sollte
  - H2: Wann Bonjour deaktiviert werden sollte
  - H2: Stolperfallen bei Docker
  - H2: Fehlerbehebung bei deaktiviertem Bonjour
  - H2: Häufige Fehlermodi
  - H2: Maskierte Instanznamen (\032)
  - H2: Aktivierung/Deaktivierung/Konfiguration
  - H2: Verwandte Dokumentation

## gateway/bridge-protocol.md

- Route: /gateway/bridge-protocol
- Überschriften:
  - H2: Warum es existierte
  - H2: Transport
  - H2: Handshake und Kopplung
  - H2: Frames
  - H2: Ereignisse im exec-Lebenszyklus
  - H2: Historische Tailnet-Nutzung
  - H2: Versionierung
  - H2: Verwandte Themen

## gateway/cli-backends.md

- Route: /gateway/cli-backends
- Überschriften:
  - H2: Schnellstart
  - H2: Verwendung als Fallback
  - H2: Konfiguration
  - H2: Funktionsweise
  - H3: Besonderheiten der Claude-CLI
  - H2: Sitzungen
  - H2: Fallback-Präludium aus claude-cli-Sitzungen
  - H2: Bilder
  - H2: Ein- und Ausgaben
  - H2: Plugin-eigene Standardwerte
  - H2: Überlagerungen zur Texttransformation
  - H2: Zuständigkeit für native Compaction
  - H2: MCP-Überlagerungen bündeln
  - H2: Begrenzung des Verlaufs beim erneuten Initialisieren
  - H2: Einschränkungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/config-agents.md

- Route: /gateway/config-agents
- Überschriften:
  - H2: Agent-Standardeinstellungen
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Agent-spezifische Überschreibungen des Bootstrap-Profils
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Zuständigkeitsübersicht für das Kontextbudget
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Laufzeitrichtlinie
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Blockweises Streaming
  - H3: Eingabeindikatoren
  - H3: agents.defaults.sandbox
  - H3: agents.list (Agent-spezifische Überschreibungen)
  - H2: Multi-Agent-Routing
  - H3: Felder für den Bindungsabgleich
  - H3: Agent-spezifische Zugriffsprofile
  - H2: Sitzung
  - H2: Nachrichten
  - H3: Antwortpräfix
  - H3: Bestätigungsreaktion
  - H3: Warteschlange
  - H3: Entprellung eingehender Nachrichten
  - H3: Weitere Nachrichtenschlüssel
  - H3: TTS (Text-to-Speech)
  - H2: Sprechen
  - H2: Verwandte Themen

## gateway/config-channels.md

- Route: /gateway/config-channels
- Überschriften:
  - H2: Kanäle
  - H3: Zugriff auf Direktnachrichten und Gruppen
  - H3: Kanalspezifische Modellüberschreibungen
  - H3: Kanal-Standardeinstellungen und Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Mehrere Konten (alle Kanäle)
  - H3: Weitere Plugin-Kanäle
  - H3: Erwähnungsbeschränkung für Gruppenchats
  - H4: Verlaufsgrenzen für Direktnachrichten
  - H4: Selbstchat-Modus
  - H3: Befehle (Verarbeitung von Chatbefehlen)
  - H2: Verwandte Themen

## gateway/config-tools.md

- Route: /gateway/config-tools
- Überschriften:
  - H2: Werkzeuge
  - H3: Werkzeugprofile
  - H3: Werkzeuggruppen
  - H3: MCP- und Plugin-Werkzeuge innerhalb der Sandbox-Werkzeugrichtlinie
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Benutzerdefinierte Provider und Basis-URLs
  - H3: Details zu Provider-Feldern
  - H3: Provider-Beispiele
  - H2: Verwandte Themen

## gateway/configuration-examples.md

- Route: /gateway/configuration-examples
- Überschriften:
  - H2: Schnellstart
  - H3: Absolutes Minimum
  - H3: Empfohlene Ausgangskonfiguration
  - H2: Erweitertes Beispiel (wichtige Optionen)
  - H3: Über Symlink eingebundenes benachbartes Skills-Repository
  - H2: Häufige Muster
  - H3: Gemeinsame Skills-Basis mit einer Überschreibung
  - H3: Plattformübergreifende Einrichtung
  - H3: Automatische Genehmigung für ein vertrauenswürdiges Node-Netzwerk
  - H3: Sicherer Direktnachrichtenmodus (gemeinsamer Posteingang / Direktnachrichten mit mehreren Benutzern)
  - H3: Anthropic-API-Schlüssel und MiniMax-Fallback
  - H3: Arbeits-Bot (eingeschränkter Zugriff)
  - H3: Ausschließlich lokale Modelle
  - H2: Tipps
  - H2: Verwandte Themen

## gateway/configuration-reference.md

- Route: /gateway/configuration-reference
- Überschriften:
  - H2: Kanäle
  - H2: Agent-Standardeinstellungen, Multi-Agent, Sitzungen und Nachrichten
  - H2: Werkzeuge und benutzerdefinierte Provider
  - H2: Modelle
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Konfiguration des Codex-Harness-Plugins
  - H2: Zusagen
  - H2: Browser
  - H2: Benutzeroberfläche
  - H2: Gateway
  - H3: OpenAI-kompatible Endpunkte
  - H3: Isolation mehrerer Instanzen
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Cloud-Worker-Umgebungen
  - H3: Crabbox-Profil
  - H3: Statisches SSH-Entwicklungsprofil
  - H2: Hooks
  - H3: Gmail-Integration
  - H2: Host des Canvas-Plugins
  - H2: Erkennung
  - H3: mDNS (Bonjour)
  - H3: Weitbereich (DNS-SD)
  - H2: Umgebung
  - H3: env (eingebettete Umgebungsvariablen)
  - H3: Ersetzung von Umgebungsvariablen
  - H2: Geheimnisse
  - H3: SecretRef
  - H3: Unterstützte Anmeldedatenoberfläche
  - H3: Konfiguration von Secret-Providern
  - H2: Authentifizierungsspeicher
  - H3: auth.cooldowns
  - H2: Audit
  - H2: Protokollierung
  - H2: Diagnose
  - H2: Aktualisierung
  - H2: ACP
  - H2: CLI
  - H2: Assistent
  - H2: Identität
  - H2: Bridge (veraltet, entfernt)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Vorlagenvariablen für Medienmodelle
  - H2: Konfigurationseinbindungen ($include)
  - H2: Verwandte Themen

## gateway/configuration.md

- Route: /gateway/configuration
- Überschriften:
  - H2: Minimale Konfiguration
  - H2: Konfiguration bearbeiten
  - H2: Strikte Validierung
  - H2: Häufige Aufgaben
  - H2: Neuladen der Konfiguration im laufenden Betrieb
  - H3: Neulademodi
  - H3: Was im laufenden Betrieb angewendet wird und was einen Neustart erfordert
  - H3: Neuladeplanung
  - H2: Konfigurations-RPC (programmatische Aktualisierungen)
  - H2: Umgebungsvariablen
  - H2: Vollständige Referenz
  - H2: Verwandte Themen

## gateway/diagnostics.md

- Route: /gateway/diagnostics
- Überschriften:
  - H2: Schnellstart
  - H2: Chatbefehl
  - H2: Inhalt des Exports
  - H2: Datenschutzmodell
  - H2: Stabilitätsaufzeichnung
  - H2: Nützliche Optionen
  - H2: Diagnose deaktivieren
  - H2: Verwandte Themen

## gateway/discovery.md

- Route: /gateway/discovery
- Überschriften:
  - H2: Begriffe
  - H2: Warum sowohl direkte Verbindungen als auch SSH vorhanden sind
  - H2: Eingaben für die Erkennung
  - H3: 1) Bonjour / DNS-SD
  - H4: Details zum Dienstsignal
  - H3: 2) Tailnet (netzwerkübergreifend)
  - H3: 3) Manuelles / SSH-Ziel
  - H2: Transportauswahl (Client-Richtlinie)
  - H2: Kopplung und Authentifizierung (direkter Transport)
  - H2: Zuständigkeiten nach Komponente
  - H2: Verwandte Themen

## gateway/doctor.md

- Route: /gateway/doctor
- Überschriften:
  - H2: Schnellstart
  - H3: Headless- und Automatisierungsmodi
  - H2: Schreibgeschützter Lint-Modus
  - H2: Zusammenfassung der Funktionen
  - H2: Nachpflege und Zurücksetzung der Dreams-Benutzeroberfläche
  - H2: Detailliertes Verhalten und Begründung
  - H2: Verwandte Themen

## gateway/external-apps.md

- Route: /gateway/external-apps
- Überschriften:
  - H2: Was heute verfügbar ist
  - H2: Empfohlener Weg
  - H2: Kooperative Host-Aussetzung
  - H2: App-Code im Vergleich zu Plugin-Code
  - H2: Verwandte Themen

## gateway/gateway-lock.md

- Route: /gateway/gateway-lock
- Überschriften:
  - H2: Warum
  - H2: Zwei Ebenen
  - H3: Dateisperre
  - H3: Socket-Bindung
  - H2: Betriebshinweise
  - H2: Verwandte Themen

## gateway/health.md

- Route: /gateway/health
- Überschriften:
  - H2: Schnellprüfungen
  - H2: Tiefgehende Diagnose
  - H2: Konfiguration der Zustandsüberwachung
  - H2: Verfügbarkeitsüberwachung
  - H3: Einrichtungsbeispiele für Überwachungsdienste
  - H2: Wenn etwas fehlschlägt
  - H2: Eigener „health“-Befehl
  - H2: Verwandte Themen

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Überschriften:
  - H2: Schnellstart (Einsteiger)
  - H2: Standardeinstellungen
  - H2: Zweck des Heartbeat-Prompts
  - H2: Antwortvertrag
  - H2: Konfiguration
  - H3: Geltungsbereich und Rangfolge
  - H3: Agent-spezifische Heartbeats
  - H3: Beispiel für aktive Zeiten
  - H3: Einrichtung für 24/7
  - H3: Beispiel mit mehreren Konten
  - H3: Hinweise zu den Feldern
  - H2: Zustellungsverhalten
  - H2: Sichtbarkeitssteuerung
  - H3: Funktion der einzelnen Flags
  - H3: Beispiele pro Kanal und pro Konto
  - H3: Häufige Muster
  - H2: HEARTBEAT.md (optional)
  - H3: tasks:-Blöcke
  - H3: Kann der Agent HEARTBEAT.md aktualisieren?
  - H2: Manuelles Aufwecken (bei Bedarf)
  - H2: Übermittlung der Schlussfolgerungen (optional)
  - H2: Kostenbewusstsein
  - H2: Kontextüberlauf nach dem Heartbeat
  - H2: Verwandte Themen

## gateway/index.md

- Route: /gateway
- Überschriften:
  - H2: Lokaler Start in 5 Minuten
  - H2: Laufzeitmodell
  - H2: OpenAI-kompatible Endpunkte
  - H3: Rangfolge von Port und Bindung
  - H3: Modi zum Neuladen im laufenden Betrieb
  - H2: Befehlssatz für Betreiber
  - H2: Mehrere Gateways (auf demselben Host)
  - H2: Fernzugriff
  - H2: Überwachung und Dienstlebenszyklus
  - H2: Schneller Weg zum Entwicklungsprofil
  - H2: Protokoll-Kurzreferenz (Betreiberansicht)
  - H2: Betriebsprüfungen
  - H3: Erreichbarkeit
  - H3: Bereitschaft
  - H3: Wiederherstellung nach Lücken
  - H2: Häufige Fehlermuster
  - H2: Sicherheitsgarantien
  - H2: Verwandte Themen

## gateway/local-model-services.md

- Route: /gateway/local-model-services
- Überschriften:
  - H2: Funktionsweise
  - H2: Konfigurationsstruktur
  - H2: Felder
  - H2: Inferrs-Beispiel
  - H2: ds4-Beispiel
  - H2: Verwandte Themen

## gateway/local-models.md

- Route: /gateway/local-models
- Überschriften:
  - H2: Mindestanforderungen an die Hardware
  - H2: Backend auswählen
  - H2: LM Studio und großes lokales Modell (Responses API)
  - H3: Hybridkonfiguration: gehostetes Primärmodell, lokaler Fallback
  - H3: Regionales Hosting / Datenrouting
  - H2: Weitere OpenAI-kompatible lokale Proxys
  - H2: Kleinere oder strengere Backends
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/logging.md

- Route: /gateway/logging
- Überschriften:
  - H1: Protokollierung
  - H2: Dateibasierter Logger
  - H3: Ausführlichkeitsmodus im Vergleich zu Protokollstufen
  - H2: Konsolenerfassung
  - H2: Schwärzung
  - H2: Gateway-WebSocket-Protokolle
  - H3: Stil der WS-Protokolle
  - H2: Konsolenformatierung (Subsystem-Protokollierung)
  - H2: Verwandte Themen

## gateway/multi-tenant-hosting.md

- Route: /gateway/multi-tenant-hosting
- Überschriften:
  - H1: Mandantenfähiges Hosting
  - H2: Warum jeder Mandant eine Zelle benötigt
  - H2: Architektur
  - H2: Vertrauensgrenze
  - H2: Isolationsstufen
  - H2: Schnellstart
  - H2: Vom MVP zurückgestellt
  - H2: Verwandte Themen

## gateway/multiple-gateways.md

- Route: /gateway/multiple-gateways
- Überschriften:
  - H2: Schnellstart für den Rettungs-Bot
  - H3: Was --profile rescue onboard ändert
  - H2: Allgemeine Einrichtung mehrerer Gateways
  - H2: Isolationscheckliste
  - H2: Portzuordnung (abgeleitet)
  - H2: Hinweise zu Browser/CDP (häufige Fehlerquelle)
  - H2: Beispiel für manuelle Umgebungsvariablen
  - H2: Schnellprüfungen
  - H2: Verwandte Themen

## gateway/network-model.md

- Route: /gateway/network-model
- Überschriften:
  - H2: Verwandte Themen

## gateway/openai-http-api.md

- Route: /gateway/openai-http-api
- Überschriften:
  - H2: Endpunkt aktivieren
  - H2: Sicherheitsgrenze (wichtig)
  - H2: Authentifizierung
  - H2: Wann dieser Endpunkt verwendet werden sollte
  - H2: Agent-zentrierter Modellvertrag
  - H2: Sitzungsverhalten
  - H2: Anfragelimits (Konfiguration)
  - H2: Vertrag für Chatwerkzeuge
  - H3: Unterstützte Anfragefelder
  - H3: Nicht unterstützte Varianten
  - H3: Struktur einer nicht gestreamten Werkzeugantwort
  - H3: Struktur einer gestreamten Werkzeugantwort
  - H3: Schleife für Werkzeug-Folgeaufrufe
  - H2: Streaming (SSE)
  - H2: Schnelleinrichtung von Open WebUI
  - H2: Beispiele
  - H2: Verwandte Themen

## gateway/openresponses-http-api.md

- Route: /gateway/openresponses-http-api
- Überschriften:
  - H2: Authentifizierung, Sicherheit und Routing
  - H2: Sitzungsverhalten
  - H2: Anfragestruktur
  - H2: Elemente (Eingabe)
  - H3: message
  - H3: functioncalloutput (rundenbasierte Werkzeuge)
  - H3: reasoning und itemreference
  - H2: Werkzeuge (clientseitige Funktionswerkzeuge)
  - H2: Bilder (inputimage)
  - H2: Dateien (inputfile)
  - H2: Datei- und Bildlimits (Konfiguration)
  - H2: Streaming (SSE)
  - H2: Nutzung
  - H2: Fehler
  - H2: Beispiele
  - H2: Verwandte Themen

## gateway/openshell.md

- Route: /gateway/openshell
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schnellstart
  - H2: Workspace-Modi
  - H3: mirror (Standard)
  - H3: remote
  - H3: Modus auswählen
  - H2: Konfigurationsreferenz
  - H2: Beispiele
  - H3: Minimale Remote-Einrichtung
  - H3: Spiegelmodus mit GPU
  - H3: Agent-spezifisches OpenShell mit benutzerdefiniertem Gateway
  - H2: Lebenszyklusverwaltung
  - H2: Sicherheitshärtung
  - H2: Aktuelle Einschränkungen
  - H2: Funktionsweise
  - H2: Verwandte Themen

## gateway/opentelemetry.md

- Route: /gateway/opentelemetry
- Überschriften:
  - H2: Schnellstart
  - H2: Exportierte Signale
  - H2: Konfigurationsreferenz
  - H3: Umgebungsvariablen
  - H2: Datenschutz und Inhaltserfassung
  - H2: Stichprobenerfassung und Leerung
  - H2: Exportierte Metriken
  - H3: Modellnutzung
  - H3: Nachrichtenfluss
  - H3: Sprechen
  - H3: Warteschlangen und Sitzungen
  - H3: Telemetrie der Sitzungserreichbarkeit
  - H3: Harness-Lebenszyklus
  - H3: Werkzeugausführung und Schleifenerkennung
  - H3: Ausführung
  - H3: Diagnoseinterna (Speicher, Nutzdaten, Zustand des Exporters)
  - H2: Exportierte Spans
  - H2: Katalog der Diagnoseereignisse
  - H2: Ohne Exporter
  - H2: Deaktivieren
  - H2: Verwandte Themen

## gateway/operator-scopes.md

- Route: /gateway/operator-scopes
- Überschriften:
  - H2: Rollen
  - H2: Scope-Ebenen
  - H2: Der Methoden-Scope ist nur die erste Zugriffshürde
  - H2: Genehmigungen für die Gerätekopplung
  - H2: Genehmigungen für die Node-Kopplung
  - H2: Authentifizierung mit gemeinsamem Geheimnis

## gateway/pairing.md

- Route: /gateway/pairing
- Überschriften:
  - H2: Funktionsweise der Funktionsfreigabe
  - H2: CLI-Workflow (für Systeme ohne grafische Oberfläche geeignet)
  - H2: API-Oberfläche (Gateway-Protokoll)
  - H2: Zugriffskontrolle für Node-Befehle (2026.3.31+)
  - H2: Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)
  - H2: SSH-verifizierte automatische Gerätefreigabe (Standard)
  - H2: Automatische Freigabe (macOS-App)
  - H2: Automatische Gerätefreigabe für vertrauenswürdige CIDRs
  - H2: Bereinigung bei stillschweigendem Ersetzen einer Kopplung
  - H2: Automatische Freigabe bei Metadaten-Upgrades
  - H2: Hilfsfunktionen für die QR-Kopplung
  - H2: Lokalität und weitergeleitete Header
  - H2: Speicherung (lokal, privat)
  - H2: Transportverhalten
  - H2: Verwandte Themen

## gateway/prometheus.md

- Route: /gateway/prometheus
- Überschriften:
  - H2: Schnellstart
  - H2: Exportierte Metriken
  - H2: Label-Richtlinie
  - H2: PromQL-Rezepte
  - H2: Wahl zwischen Prometheus- und OpenTelemetry-Export
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/protocol.md

- Route: /gateway/protocol
- Überschriften:
  - H2: Transport und Framing
  - H2: Handshake
  - H3: Worker-Rolle und geschlossenes Protokoll
  - H3: Client-Funktionen
  - H3: Beispiel für eine Node-Verbindung
  - H2: Rollen und Scopes
  - H3: Funktionen/Befehle/Berechtigungen (Node)
  - H2: Präsenz
  - H3: Hintergrundereignis für aktive Nodes
  - H2: Scope-Zuordnung für Broadcast-Ereignisse
  - H2: RPC-Methodenfamilien
  - H3: Häufige Ereignisfamilien
  - H3: Node-Hilfsmethoden
  - H2: RPC für das Audit-Ledger
  - H2: RPCs für das Task-Ledger
  - H2: Operator-Hilfsmethoden
  - H3: Ansichten von models.list
  - H2: Ausführungsgenehmigungen
  - H2: Fallback für die Agent-Zustellung
  - H2: Versionierung
  - H3: Client-Konstanten
  - H2: Authentifizierung
  - H2: Geräteidentität und Kopplung
  - H3: Diagnose der Migration der Geräteauthentifizierung
  - H2: TLS und Pinning
  - H2: Scope
  - H2: Verwandte Themen

## gateway/remote-gateway-readme.md

- Route: /gateway/remote-gateway-readme
- Überschriften:
  - H1: OpenClaw.app mit einem entfernten Gateway ausführen
  - H2: Einrichtung
  - H2: Funktionsweise
  - H2: Verwandte Themen

## gateway/remote.md

- Route: /gateway/remote
- Überschriften:
  - H2: Das Grundkonzept
  - H2: Topologieoptionen
  - H2: Befehlsablauf (was wo ausgeführt wird)
  - H2: SSH-Tunnel (CLI + Tools)
  - H2: CLI-Standardeinstellungen für entfernte Verbindungen
  - H2: Rangfolge der Anmeldedaten
  - H2: Entfernter Zugriff auf die Chat-Benutzeroberfläche
  - H2: Remote-Modus der macOS-App
  - H2: Sicherheitsregeln (Remotezugriff/VPN)
  - H3: macOS: dauerhafter SSH-Tunnel über LaunchAgent
  - H4: Schritt 1: SSH-Konfiguration hinzufügen
  - H4: Schritt 2: SSH-Schlüssel kopieren (einmalig)
  - H4: Schritt 3: Gateway-Token konfigurieren
  - H4: Schritt 4: LaunchAgent erstellen
  - H4: Schritt 5: LaunchAgent laden
  - H4: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/restart-recovery.md

- Route: /gateway/restart-recovery
- Überschriften:
  - H2: Was einen Neustart übersteht
  - H2: Kontrollierte Neustarts lassen laufende Arbeiten zuerst auslaufen
  - H2: Erkennung unterbrochener Arbeiten
  - H2: Automatische Fortsetzung
  - H3: Subagenten
  - H3: Hintergrundaufgaben
  - H3: Vom Agent angeforderte Neustarts
  - H2: Sicherheitsmechanismen und Beobachtbarkeit
  - H2: Was nicht fortgesetzt wird

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Route: /gateway/sandbox-vs-tool-policy-vs-elevated
- Überschriften:
  - H2: Schnelle Fehlerdiagnose
  - H2: Sandbox: wo Tools ausgeführt werden
  - H3: Bind-Mounts (schnelle Sicherheitsprüfung)
  - H2: Tool-Richtlinie: welche Tools vorhanden/aufrufbar sind
  - H3: Tool-Gruppen (Kurzformen)
  - H2: Erweiterte Rechte: nur für die Ausführung „auf dem Host ausführen“
  - H2: Häufige Lösungen für „Sandbox-Gefängnisse“
  - H3: „Tool X durch die Sandbox-Tool-Richtlinie blockiert“
  - H3: „Ich dachte, dies sei die Hauptumgebung. Warum wird es in einer Sandbox ausgeführt?“
  - H2: Verwandte Themen

## gateway/sandboxing.md

- Route: /gateway/sandboxing
- Überschriften:
  - H2: Was in einer Sandbox ausgeführt wird
  - H2: Modi, Scope und Backend
  - H2: Docker-Backend
  - H3: Browser in der Sandbox
  - H2: SSH-Backend
  - H2: OpenShell-Backend
  - H2: Zugriff auf den Arbeitsbereich
  - H2: Benutzerdefinierte Bind-Mounts
  - H2: Images und Einrichtung
  - H2: setupCommand (einmalige Container-Einrichtung)
  - H2: Tool-Richtlinie und Ausweichmöglichkeiten
  - H2: Überschreibungen für mehrere Agenten
  - H2: Minimales Aktivierungsbeispiel
  - H2: Verwandte Themen

## gateway/secrets-plan-contract.md

- Route: /gateway/secrets-plan-contract
- Überschriften:
  - H2: Struktur der Plandatei
  - H2: Upserts und Löschvorgänge für Provider
  - H2: Unterstützter Ziel-Scope
  - H2: Verhalten der Zieltypen
  - H2: Regeln für die Pfadvalidierung
  - H2: Fehlerverhalten
  - H2: Einwilligungsverhalten des Exec-Providers
  - H2: Hinweise zum Laufzeit- und Audit-Scope
  - H2: Operatorprüfungen
  - H2: Verwandte Dokumentation

## gateway/secrets.md

- Route: /gateway/secrets
- Überschriften:
  - H2: Laufzeitmodell
  - H2: Injektion zum Zeitpunkt des ausgehenden Datenverkehrs (Sentinels)
  - H2: Zugriffsgrenze für Agenten
  - H2: Filterung aktiver Oberflächen
  - H2: Diagnose der Gateway-Authentifizierungsoberfläche
  - H2: Vorabprüfung von Onboarding-Referenzen
  - H2: SecretRef-Vertrag
  - H2: Provider-Konfiguration
  - H2: Dateibasierte API-Schlüssel
  - H2: Beispiele für die Exec-Integration
  - H2: Umgebungsvariablen für MCP-Server
  - H2: SSH-Authentifizierungsmaterial für die Sandbox
  - H2: Unterstützte Anmeldedatenoberfläche
  - H2: Erforderliches Verhalten und Rangfolge
  - H2: Aktivierungsauslöser
  - H2: Signale für beeinträchtigten und wiederhergestellten Zustand
  - H2: Auflösung von Befehlspfaden
  - H2: Audit- und Konfigurationsworkflow
  - H2: Einseitige Sicherheitsrichtlinie
  - H2: Hinweise zur Kompatibilität mit älterer Authentifizierung
  - H2: Hinweis zur Web-Benutzeroberfläche
  - H2: Verwandte Themen

## gateway/security/audit-checks.md

- Route: /gateway/security/audit-checks
- Überschriften:
  - H2: Verwandte Themen

## gateway/security/exposure-runbook.md

- Route: /gateway/security/exposure-runbook
- Überschriften:
  - H2: Expositionsmuster auswählen
  - H2: Bestandsaufnahme vorab
  - H2: Grundlegende Prüfungen
  - H2: Sichere Mindestkonfiguration
  - H2: Exposition von Direktnachrichten und Gruppen
  - H2: Reverse-Proxy-Prüfungen
  - H2: Überprüfung von Tools und Sandbox
  - H2: Validierung nach der Änderung
  - H2: Rollback-Plan
  - H2: Prüfcheckliste

## gateway/security/index.md

- Route: /gateway/security
- Überschriften:
  - H2: Geltungsbereich: Sicherheitsmodell für persönliche Assistenten
  - H2: OpenClaw-Sicherheitsaudit
  - H3: Was das Audit prüft (Überblick)
  - H3: Prioritätsreihenfolge bei der Triage von Befunden
  - H2: Gehärtete Basiskonfiguration in 60 Sekunden
  - H2: Matrix der Vertrauensgrenzen
  - H2: Beabsichtigt keine Sicherheitslücken
  - H2: Vertrauen zwischen Gateway und Node
  - H2: Bedrohungsmodell
  - H2: Zugriff auf Direktnachrichten: Kopplung, Positivliste, offen, deaktiviert
  - H3: Positivlisten (zwei Ebenen)
  - H3: Isolation von Direktnachrichtensitzungen (Mehrbenutzermodus)
  - H2: Kontextsichtbarkeit im Vergleich zur Auslöserautorisierung
  - H2: Prompt-Injektion
  - H3: Externe Inhalte und Kapselung nicht vertrauenswürdiger Eingaben
  - H3: Umgehungsflags (in Produktionsumgebungen deaktiviert lassen)
  - H3: Reasoning und ausführliche Ausgaben in Gruppen
  - H2: Befehlsautorisierung
  - H2: Tools der Steuerungsebene
  - H2: Node-Ausführung (system.run)
  - H2: Dynamische Skills (Watcher / entfernte Nodes)
  - H2: Plugins
  - H2: Sandbox-Ausführung
  - H3: Schutzmechanismus für die Delegation an Subagenten
  - H3: Schreibgeschützter Modus
  - H2: Zugriffsprofile pro Agent (mehrere Agenten)
  - H3: Vollzugriff (keine Sandbox)
  - H3: Schreibgeschützte Tools + schreibgeschützter Arbeitsbereich
  - H3: Kein Dateisystem-/Shell-Zugriff (Nachrichtenversand über Provider zulässig)
  - H2: Risiken der Browsersteuerung
  - H3: Browser-SSRF-Richtlinie (standardmäßig strikt)
  - H2: Netzwerkexposition
  - H3: Bind-Adresse, Port, Firewall
  - H3: Veröffentlichung von Docker-Ports mit UFW
  - H3: mDNS-/Bonjour-Erkennung
  - H3: Gateway-WebSocket-Authentifizierung
  - H3: Identitätsheader von Tailscale Serve
  - H3: Reverse-Proxy-Konfiguration
  - H3: Hinweise zu HSTS und Ursprung
  - H3: Steuerungsoberfläche über HTTP
  - H3: Unsichere/gefährliche Flags
  - H2: Bereitstellung und Vertrauen in den Host
  - H2: Geheimnisse auf dem Datenträger
  - H3: Übersicht zur Speicherung von Anmeldedaten
  - H3: Dateiberechtigungen
  - H3: .env-Dateien des Arbeitsbereichs
  - H3: Protokolle und Transkripte
  - H2: Sichere Basiskonfiguration (kopieren/einfügen)
  - H3: Separate Nummern (WhatsApp, Signal, Telegram)
  - H2: Reaktion auf Sicherheitsvorfälle
  - H3: Eindämmen
  - H3: Rotieren (bei offengelegten Geheimnissen von einer Kompromittierung ausgehen)
  - H3: Audit
  - H3: Daten für einen Bericht sammeln
  - H2: Geheimnissuche
  - H2: Sicherheitsprobleme melden

## gateway/security/secure-file-operations.md

- Route: /gateway/security/secure-file-operations
- Überschriften:
  - H2: Standard: keine Python-Hilfsfunktion
  - H2: Was ohne Python geschützt bleibt
  - H2: Was Python ergänzt
  - H2: Leitlinien für Plugin und Kern

## gateway/security/shrinkwrap.md

- Route: /gateway/security/shrinkwrap
- Überschriften:
  - H2: Warum dies wichtig ist
  - H2: Generieren und Prüfen
  - H2: Veröffentlichtes Paket untersuchen

## gateway/tailscale.md

- Route: /gateway/tailscale
- Überschriften:
  - H2: Modi
  - H2: Konfigurationsbeispiele
  - H3: Nur Tailnet (Serve)
  - H3: Nur Tailnet (an Tailnet-IP binden)
  - H3: Öffentliches Internet (Funnel + gemeinsames Passwort)
  - H2: CLI-Beispiele
  - H2: Authentifizierung
  - H3: Tailscale-Identitätsheader (nur Serve)
  - H2: Hinweise
  - H3: Voraussetzungen und Einschränkungen für Tailscale
  - H2: Browsersteuerung (entferntes Gateway + lokaler Browser)
  - H2: Weitere Informationen
  - H2: Verwandte Themen

## gateway/tools-invoke-http-api.md

- Route: /gateway/tools-invoke-http-api
- Überschriften:
  - H2: Authentifizierung
  - H2: Sicherheitsgrenze (wichtig)
  - H2: Anfragetext
  - H2: Richtlinien- und Routingverhalten
  - H2: Antworten
  - H2: Beispiel
  - H2: Verwandte Themen

## gateway/troubleshooting.md

- Route: /gateway/troubleshooting
- Überschriften:
  - H2: Befehlsabfolge
  - H2: Nach einer Aktualisierung
  - H2: Getrennte Installationen und Schutz vor neueren Konfigurationen
  - H2: Protokollabweichung nach einem Rollback
  - H2: Skill-Symlink als Pfadausbruch übersprungen
  - H2: Anthropic 429: Für langen Kontext ist zusätzliche Nutzung erforderlich
  - H2: Durch Upstream-403 blockierte Antworten
  - H2: Lokales OpenAI-kompatibles Backend besteht direkte Tests, Agent-Ausführungen schlagen jedoch fehl
  - H2: Keine Antworten
  - H2: Konnektivität der Dashboard-Steuerungsoberfläche
  - H3: Kurzübersicht der Detailcodes für die Authentifizierung
  - H2: Gateway-Dienst wird nicht ausgeführt
  - H2: Das macOS-Gateway reagiert unbemerkt nicht mehr und setzt den Betrieb fort, sobald Sie mit dem Dashboard interagieren
  - H2: macOS-launchd-Supervisor-Schleife mit doppelten Gateway-/Node-LaunchAgents
  - H2: Gateway wird bei hoher Speichernutzung beendet
  - H2: Gateway hat eine ungültige Konfiguration abgelehnt
  - H2: Warnungen bei Gateway-Prüfungen
  - H2: Kanal verbunden, aber Nachrichten werden nicht übertragen
  - H2: Zustellung von Cron und Heartbeat
  - H2: Node gekoppelt, Tool schlägt fehl
  - H2: Browser-Tool schlägt fehl
  - H2: Wenn nach einem Upgrade plötzlich etwas nicht mehr funktioniert
  - H2: Verwandte Themen

## gateway/trusted-proxy-auth.md

- Route: /gateway/trusted-proxy-auth
- Überschriften:
  - H2: Wann dies verwendet werden sollte
  - H2: Wann dies NICHT verwendet werden sollte
  - H2: Funktionsweise
  - H2: Konfiguration
  - H3: Konfigurationsreferenz
  - H2: Kopplungsverhalten der Steuerungsoberfläche
  - H2: Header für Operator-Scopes
  - H2: TLS-Terminierung und HSTS
  - H3: Leitlinien für die Einführung
  - H2: Beispiele für die Proxy-Einrichtung
  - H2: Gemischte Token-Konfiguration
  - H2: Sicherheitscheckliste
  - H2: Sicherheitsaudit
  - H2: Fehlerbehebung
  - H2: Migration von der Token-Authentifizierung
  - H2: Verwandte Themen

## help/debugging.md

- Route: /help/debugging
- Überschriften:
  - H2: Überschreibungen für die Laufzeitdiagnose
  - H2: Ausgabe der Sitzungsablaufverfolgung
  - H2: Ablaufverfolgung des Plugin-Lebenszyklus
  - H2: Profilerstellung für CLI-Start und Befehle
  - H2: Gateway-Überwachungsmodus
  - H2: Entwicklungsprofil + Entwicklungs-Gateway (--dev)
  - H2: Protokollierung des Rohdatenstroms
  - H2: Sicherheitshinweise
  - H2: Fehlerdiagnose in VSCode
  - H3: Einrichtung
  - H3: Hinweise
  - H2: Verwandte Themen

## help/environment.md

- Route: /help/environment
- Überschriften:
  - H2: Rangfolge (höchste bis niedrigste)
  - H2: Provider-Anmeldedaten und .env des Arbeitsbereichs
  - H2: env-Konfigurationsblock
  - H2: Import der Shell-Umgebung
  - H2: Snapshots der Exec-Shell
  - H2: Zur Laufzeit injizierte Umgebungsvariablen
  - H2: Umgebungsvariablen der Benutzeroberfläche
  - H2: Ersetzung von Umgebungsvariablen in der Konfiguration
  - H2: Geheimnisreferenzen im Vergleich zu ${ENV}-Zeichenfolgen
  - H2: Pfadbezogene Umgebungsvariablen
  - H2: Protokollierung
  - H3: OPENCLAWHOME
  - H2: nvm-Benutzer: TLS-Fehler bei webfetch
  - H2: Veraltete Umgebungsvariablen
  - H2: Verwandte Themen

## help/faq-first-run.md

- Route: /help/faq-first-run
- Überschriften:
  - H2: Schnellstart und Einrichtung beim ersten Start
  - H2: Verwandte Themen

## help/faq-models.md

- Route: /help/faq-models
- Überschriften:
  - H2: Modelle: Standardeinstellungen, Auswahl, Aliasse, Wechsel
  - H2: Modell-Failover und „Alle Modelle sind fehlgeschlagen“
  - H2: Authentifizierungsprofile: was sie sind und wie sie verwaltet werden
  - H2: Verwandte Themen

## help/faq.md

- Route: /help/faq
- Überschriften:
  - H2: Die ersten 60 Sekunden, wenn etwas nicht funktioniert
  - H2: Schnellstart und Ersteinrichtung
  - H2: Was ist OpenClaw?
  - H2: Skills und Automatisierung
  - H2: Sandboxing und Speicher
  - H2: Speicherorte auf dem Datenträger
  - H2: Grundlagen der Konfiguration
  - H2: Remote-Gateways und Nodes
  - H2: Umgebungsvariablen und Laden von .env
  - H2: Sitzungen und mehrere Chats
  - H2: Modelle, Failover und Authentifizierungsprofile
  - H2: Gateway: Ports, „wird bereits ausgeführt“ und Remote-Modus
  - H2: Protokollierung und Fehlerdiagnose
  - H2: Medien und Anhänge
  - H2: Sicherheit und Zugriffskontrolle
  - H2: Chatbefehle, Abbrechen von Aufgaben und „es lässt sich nicht stoppen“
  - H2: Sonstiges
  - H2: Verwandte Themen

## help/index.md

- Route: /help
- Überschriften:
  - H2: Häufig gestellte Fragen
  - H2: Diagnose
  - H2: Tests
  - H2: Community und Metathemen

## help/scripts.md

- Route: /help/scripts
- Überschriften:
  - H2: Konventionen
  - H2: Skripte zur Authentifizierungsüberwachung
  - H2: Hilfsprogramm für den GitHub-Lesezugriff
  - H2: Beim Hinzufügen von Skripten
  - H2: Verwandte Themen

## help/testing-live.md

- Route: /help/testing-live
- Überschriften:
  - H2: Live: lokale Smoke-Test-Befehle
  - H2: Live: umfassende Prüfung der Fähigkeiten eines Android-Nodes
  - H2: Live: Modell-Smoke-Test (Profilschlüssel)
  - H3: Ebene 1: Direkte Modellvervollständigung (ohne Gateway)
  - H3: Ebene 2: Gateway und Smoke-Test des Entwicklungsagenten (was „@openclaw“ tatsächlich bewirkt)
  - H2: Live: Smoke-Test des CLI-Backends (Claude, Gemini oder andere lokale CLIs)
  - H2: Live: Erreichbarkeit des APNs-HTTP/2-Proxys
  - H2: Live: ACP-Bindungs-Smoke-Test (/acp spawn ... --bind here)
  - H2: Live: Smoke-Test der Codex-App-Server-Testumgebung
  - H3: Empfohlene Live-Testabläufe
  - H2: Live: Modellmatrix (was wir abdecken)
  - H3: Aggregatoren / alternative Gateways
  - H2: Anmeldedaten (niemals committen)
  - H2: Deepgram live (Audiotranskription)
  - H2: BytePlus-Coding-Tarif live
  - H2: ComfyUI-Workflow-Medien live
  - H2: Bilderzeugung live
  - H2: Musikerzeugung live
  - H2: Videoerzeugung live
  - H2: Live-Testumgebung für Medien
  - H2: Verwandte Themen

## help/testing-updates-plugins.md

- Route: /help/testing-updates-plugins
- Überschriften:
  - H2: Was wir schützen
  - H2: Lokaler Nachweis während der Entwicklung
  - H2: Docker-Testpfade
  - H2: Paketabnahme
  - H2: Standard für Releases
  - H2: Abwärtskompatibilität
  - H2: Abdeckung hinzufügen
  - H2: Fehlereingrenzung

## help/testing.md

- Route: /help/testing
- Überschriften:
  - H2: Schnellstart
  - H2: Temporäre Testverzeichnisse
  - H2: Live- und Docker-/Parallels-Arbeitsabläufe
  - H2: QA-spezifische Test-Runner
  - H3: Gemeinsam genutzte Telegram-Anmeldedaten über Convex (v1)
  - H3: Einen Kanal zu QA hinzufügen
  - H2: Testsuiten (was wo ausgeführt wird)
  - H3: Einheits-/Integrationstests (Standard)
  - H3: Stabilität (Gateway)
  - H3: E2E (Repository-übergreifend)
  - H3: E2E (Gateway-Smoke-Test)
  - H3: E2E (Control UI mit simuliertem Browser)
  - H3: E2E: Smoke-Test des OpenShell-Backends
  - H3: Live (echte Provider und echte Modelle)
  - H2: Welche Suite sollte ich ausführen?
  - H2: Live-Tests (mit Netzwerkzugriff)
  - H2: Docker-Runner (optionale Prüfungen, ob es unter Linux funktioniert)
  - H2: Plausibilitätsprüfung der Dokumentation
  - H2: Offline-Regression (CI-sicher)
  - H2: Zuverlässigkeitsbewertungen für Agenten (Skills)
  - H2: Vertragstests (Form von Plugins und Kanälen)
  - H3: Befehle
  - H3: Kanalverträge
  - H3: Provider-Verträge
  - H3: Wann sie ausgeführt werden sollten
  - H2: Regressionstests hinzufügen (Leitfaden)
  - H2: Verwandte Themen

## help/troubleshooting.md

- Route: /help/troubleshooting
- Überschriften:
  - H2: Die ersten 60 Sekunden
  - H2: Der Assistent wirkt eingeschränkt oder Tools fehlen
  - H2: Anthropic-Fehler 429 bei langem Kontext
  - H2: Lokales OpenAI-kompatibles Backend funktioniert direkt, schlägt aber in OpenClaw fehl
  - H2: Plugin-Installation schlägt wegen fehlender OpenClaw-Erweiterungen fehl
  - H2: Installationsrichtlinie blockiert die Installation oder Aktualisierung von Plugins
  - H2: Plugin ist vorhanden, wird aber wegen verdächtiger Eigentumsverhältnisse blockiert
  - H2: Entscheidungsbaum
  - H2: Verwandte Themen

## index.md

- Route: /
- Überschriften:
  - H1: OpenClaw 🦞
  - H2: Dokumentation durchsuchen
  - H2: Was ist OpenClaw?
  - H2: Funktionsweise
  - H2: Hauptfunktionen
  - H2: Schnellstart
  - H2: Dashboard
  - H2: Konfiguration (optional)
  - H2: Hier beginnen
  - H2: Mehr erfahren

## install/ansible.md

- Route: /install/ansible
- Überschriften:
  - H2: Voraussetzungen
  - H2: Was Sie erhalten
  - H2: Schnellstart
  - H2: Was installiert wird
  - H2: Einrichtung nach der Installation
  - H3: Kurzbefehle
  - H2: Sicherheitsarchitektur
  - H2: Manuelle Installation
  - H2: Aktualisierung
  - H2: Fehlerbehebung
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## install/azure.md

- Route: /install/azure
- Überschriften:
  - H2: Was Sie tun werden
  - H2: Was Sie benötigen
  - H2: Bereitstellung konfigurieren
  - H2: Azure-Ressourcen bereitstellen
  - H2: OpenClaw installieren
  - H2: Kostenaspekte
  - H2: Bereinigung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/bun.md

- Route: /install/bun
- Überschriften:
  - H2: Installation
  - H2: Lebenszyklusskripte
  - H2: Einschränkungen
  - H2: Verwandte Themen

## install/clawdock.md

- Route: /install/clawdock
- Überschriften:
  - H2: Installation
  - H2: Was Sie erhalten
  - H3: Grundlegende Vorgänge
  - H3: Containerzugriff
  - H3: Weboberfläche und Kopplung
  - H3: Einrichtung und Wartung
  - H3: Hilfsprogramme
  - H2: Ablauf bei der ersten Verwendung
  - H2: Konfiguration und Geheimnisse
  - H2: Verwandte Themen

## install/development-channels.md

- Route: /install/development-channels
- Überschriften:
  - H2: Kanäle wechseln
  - H2: Einmalige Auswahl einer Version oder eines Tags
  - H2: Testlauf
  - H2: Plugins und Kanäle
  - H2: Aktuellen Status prüfen
  - H2: Bewährte Verfahren für Tags
  - H2: Verfügbarkeit der macOS-App
  - H2: Verwandte Themen

## install/digitalocean.md

- Route: /install/digitalocean
- Überschriften:
  - H2: Voraussetzungen
  - H2: Einrichtung
  - H2: Persistenz und Sicherungen
  - H2: Tipps für 1 GB RAM
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/docker-vm-runtime.md

- Route: /install/docker-vm-runtime
- Überschriften:
  - H2: Erforderliche Binärdateien in das Image integrieren
  - H2: Erstellen und starten
  - H2: Was wo dauerhaft gespeichert wird
  - H2: Aktualisierungen
  - H2: Verwandte Themen

## install/docker.md

- Route: /install/docker
- Überschriften:
  - H2: Voraussetzungen
  - H2: Containerisiertes Gateway
  - H3: Manueller Ablauf
  - H3: Container-Images aktualisieren
  - H3: Umgebungsvariablen
  - H3: Aus dem Quellcode erstellte Images mit ausgewählten Plugins
  - H3: Beobachtbarkeit
  - H3: Zustandsprüfungen
  - H3: LAN im Vergleich zu Loopback
  - H3: Lokale Provider des Hosts
  - H3: Claude-CLI-Backend in Docker
  - H3: Bonjour / mDNS
  - H3: Speicherung und Persistenz
  - H3: Shell-Hilfsprogramme (optional)
  - H3: Ausführung auf einem VPS?
  - H2: Agenten-Sandbox
  - H3: Schnell aktivieren
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/exe-dev.md

- Route: /install/exe-dev
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schneller Einstieg für Einsteiger
  - H2: Automatisierte Installation mit Shelley
  - H2: Manuelle Installation
  - H2: Einrichtung eines Remote-Kanals
  - H2: Remote-Zugriff
  - H2: Aktualisierung
  - H2: Verwandte Themen

## install/fly.md

- Route: /install/fly
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schneller Einstieg für Einsteiger
  - H2: Fehlerbehebung
  - H3: „App lauscht nicht an der erwarteten Adresse“
  - H3: Zustandsprüfungen schlagen fehl / Verbindung abgelehnt
  - H3: OOM-/Speicherprobleme
  - H3: Probleme mit der Gateway-Sperre
  - H3: Konfiguration wird nicht gelesen
  - H3: Konfiguration über SSH schreiben
  - H3: Zustand wird nicht dauerhaft gespeichert
  - H2: Aktualisierung
  - H3: Maschinenbefehl aktualisieren
  - H2: Private Bereitstellung (gehärtet)
  - H3: Wann eine private Bereitstellung verwendet werden sollte
  - H3: Einrichtung
  - H3: Auf eine private Bereitstellung zugreifen
  - H3: Webhooks bei privater Bereitstellung
  - H3: Sicherheitsabwägungen
  - H2: Hinweise
  - H2: Kosten
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/gcp.md

- Route: /install/gcp
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schneller Einstieg
  - H2: Fehlerbehebung
  - H2: Dienstkonten (bewährte Sicherheitsmethode)
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/hetzner.md

- Route: /install/hetzner
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schneller Einstieg
  - H2: Infrastructure as Code (Terraform)
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/hostinger.md

- Route: /install/hostinger
- Überschriften:
  - H2: Voraussetzungen
  - H2: Option A: OpenClaw mit 1-Klick-Installation
  - H2: Option B: OpenClaw auf einem VPS
  - H2: Ihre Einrichtung überprüfen
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/index.md

- Route: /install
- Überschriften:
  - H2: Systemanforderungen
  - H2: Empfohlen: Installationsskript
  - H2: Alternative Installationsmethoden
  - H3: Installationsprogramm mit lokalem Präfix (install-cli.sh)
  - H3: npm, pnpm oder bun
  - H3: Aus dem Quellcode
  - H3: Aus dem GitHub-Main-Checkout installieren
  - H3: Container und Paketmanager
  - H2: Installation überprüfen
  - H2: Hosting und Bereitstellung
  - H2: Aktualisieren, migrieren oder deinstallieren
  - H2: Fehlerbehebung: openclaw nicht gefunden

## install/installer.md

- Route: /install/installer
- Überschriften:
  - H2: Kurzbefehle
  - H2: install.sh
  - H3: Ablauf (install.sh)
  - H3: Erkennung eines Quellcode-Checkouts
  - H3: Beispiele (install.sh)
  - H2: install-cli.sh
  - H3: Ablauf (install-cli.sh)
  - H3: Beispiele (install-cli.sh)
  - H2: install.ps1
  - H3: Ablauf (install.ps1)
  - H3: Beispiele (install.ps1)
  - H2: CI und Automatisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/kubernetes.md

- Route: /install/kubernetes
- Überschriften:
  - H2: Warum nicht Helm?
  - H2: Was Sie benötigen
  - H2: Schnellstart
  - H2: Lokale Tests mit Kind
  - H2: Schritt für Schritt
  - H3: 1) Bereitstellen
  - H3: 2) Auf das Gateway zugreifen
  - H2: Was bereitgestellt wird
  - H2: Anpassung
  - H3: Agentenanweisungen
  - H3: Gateway-Konfiguration
  - H3: Provider hinzufügen
  - H3: Benutzerdefinierter Namespace
  - H3: Benutzerdefiniertes Image
  - H3: Über die Portweiterleitung hinaus verfügbar machen
  - H2: Erneut bereitstellen
  - H2: Abbau
  - H2: Architekturhinweise
  - H2: Dateistruktur
  - H2: Verwandte Themen

## install/macos-vm.md

- Route: /install/macos-vm
- Überschriften:
  - H2: Empfohlener Standard (für die meisten Benutzer)
  - H2: Optionen für macOS-VMs
  - H3: Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)
  - H3: Gehostete Mac-Provider (Cloud)
  - H2: Schneller Einstieg (Lume, erfahrene Benutzer)
  - H2: Was Sie benötigen (Lume)
  - H2: 1) Lume installieren
  - H2: 2) Die macOS-VM erstellen
  - H2: 3) Den Einrichtungsassistenten abschließen
  - H2: 4) Die IP-Adresse der VM ermitteln
  - H2: 5) Per SSH auf die VM zugreifen
  - H2: 6) OpenClaw installieren
  - H2: 7) Kanäle konfigurieren
  - H2: 8) Die VM ohne grafische Oberfläche ausführen
  - H2: Bonus: iMessage-Integration
  - H2: Ein Golden Image speichern
  - H2: Betrieb rund um die Uhr
  - H2: Fehlerbehebung
  - H2: Verwandte Dokumentation

## install/migrating-claude.md

- Route: /install/migrating-claude
- Überschriften:
  - H2: Zwei Importmöglichkeiten
  - H2: Was importiert wird
  - H2: Was ausschließlich im Archiv verbleibt
  - H2: Quellenauswahl
  - H2: Empfohlener Ablauf
  - H2: Konfliktbehandlung
  - H2: JSON-Ausgabe für die Automatisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/migrating-hermes.md

- Route: /install/migrating-hermes
- Überschriften:
  - H2: Zwei Importmöglichkeiten
  - H2: Was importiert wird
  - H2: Was ausschließlich im Archiv verbleibt
  - H2: Empfohlener Ablauf
  - H2: Konfliktbehandlung
  - H2: Geheimnisse
  - H2: JSON-Ausgabe für die Automatisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/migrating.md

- Route: /install/migrating
- Überschriften:
  - H2: Aus einem anderen Agentensystem importieren
  - H2: OpenClaw auf einen neuen Computer verschieben
  - H3: Migrationsschritte
  - H3: Häufige Fallstricke
  - H3: Prüfliste zur Verifizierung
  - H2: Ein Plugin direkt aktualisieren
  - H2: Verwandte Themen

## install/nix.md

- Route: /install/nix
- Überschriften:
  - H2: Was Sie erhalten
  - H2: Schnellstart
  - H2: Laufzeitverhalten im Nix-Modus
  - H3: Was sich im Nix-Modus ändert
  - H3: Pfade für Konfiguration und Zustand
  - H3: Ermittlung des Dienst-PATH
  - H2: Verwandte Themen

## install/node.md

- Route: /install/node
- Überschriften:
  - H2: Ihre Version überprüfen
  - H2: Node installieren
  - H2: Fehlerbehebung
  - H3: openclaw: Befehl nicht gefunden
  - H3: Berechtigungsfehler bei npm install -g (Linux)
  - H2: Verwandte Themen

## install/northflank.mdx

- Route: /install/northflank
- Überschriften:
  - H2: Erste Schritte
  - H2: Was Sie erhalten
  - H2: Einen Kanal verbinden
  - H2: Nächste Schritte

## install/oracle.md

- Route: /install/oracle
- Überschriften:
  - H2: Voraussetzungen
  - H2: Einrichtung
  - H2: Sicherheitsstatus überprüfen
  - H2: Hinweise zu ARM
  - H2: Persistenz und Sicherungen
  - H2: Ausweichlösung: SSH-Tunnel
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/podman.md

- Route: /install/podman
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schnellstart
  - H2: Podman und Tailscale
  - H2: Systemd (Quadlet, optional)
  - H2: Konfiguration, Umgebungsvariablen und Speicher
  - H2: Images aktualisieren
  - H2: Nützliche Befehle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/railway.mdx

- Route: /install/railway
- Überschriften:
  - H2: Bereitstellung mit einem Klick
  - H2: Was Sie erhalten
  - H2: Einen Kanal verbinden
  - H2: Sicherungen und Migration
  - H2: Nächste Schritte

## install/raspberry-pi.md

- Route: /install/raspberry-pi
- Überschriften:
  - H2: Hardwarekompatibilität
  - H2: Voraussetzungen
  - H2: Einrichtung
  - H2: Tipps zur Leistung
  - H2: Empfohlene Modelleinrichtung
  - H2: Hinweise zu ARM-Binärdateien
  - H2: Persistenz und Sicherungen
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/render.mdx

- Route: /install/render
- Überschriften:
  - H2: Voraussetzungen
  - H2: Bereitstellen
  - H2: Der Blueprint
  - H2: Einen Tarif auswählen
  - H2: Nach der Bereitstellung
  - H3: Auf die Control UI zugreifen
  - H3: Protokolle
  - H3: Shell-Zugriff
  - H3: Umgebungsvariablen
  - H3: Automatische Bereitstellung
  - H2: Benutzerdefinierte Domain
  - H2: Skalierung
  - H2: Sicherungen und Migration
  - H2: Fehlerbehebung
  - H3: Dienst startet nicht
  - H3: Langsame Kaltstarts (kostenloser Tarif)
  - H3: Datenverlust nach erneuter Bereitstellung
  - H3: Fehlgeschlagene Integritätsprüfungen
  - H2: Nächste Schritte

## install/uninstall.md

- Route: /install/uninstall
- Überschriften:
  - H2: Einfacher Weg (CLI weiterhin installiert)
  - H2: Dienst manuell entfernen (CLI nicht installiert)
  - H3: macOS (launchd)
  - H3: Linux (systemd-Benutzereinheit)
  - H3: Windows (geplante Aufgabe)
  - H2: Normale Installation im Vergleich zum Quellcode-Checkout
  - H3: Normale Installation (install.sh / npm / pnpm / bun)
  - H3: Quellcode-Checkout (git clone)
  - H2: Verwandte Themen

## install/updating.md

- Route: /install/updating
- Überschriften:
  - H2: Empfohlen: openclaw update
  - H2: Zwischen npm- und Git-Installationen wechseln
  - H2: Alternative: Installationsprogramm erneut ausführen
  - H2: Alternative: manuell mit npm, pnpm oder bun
  - H3: Fortgeschrittene Themen zur npm-Installation
  - H2: Automatische Aktualisierung
  - H2: Nach der Aktualisierung
  - H3: Doctor ausführen
  - H3: Gateway neu starten
  - H3: Überprüfen
  - H2: Rollback
  - H3: Eine Version fixieren (npm)
  - H3: Einen Commit fixieren (Quellcode)
  - H2: Wenn Sie nicht weiterkommen
  - H2: Verwandte Themen

## install/upstash.md

- Route: /install/upstash
- Überschriften:
  - H2: Voraussetzungen
  - H2: Eine Box erstellen
  - H2: Über einen SSH-Tunnel verbinden
  - H2: OpenClaw installieren
  - H2: Onboarding ausführen
  - H2: Gateway starten
  - H2: Automatischer Neustart
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## logging.md

- Route: /logging
- Überschriften:
  - H2: Speicherort der Protokolle
  - H2: Protokolle lesen
  - H3: CLI: Live-Ausgabe (empfohlen)
  - H3: Control UI (Web)
  - H3: Nur kanalbezogene Protokolle
  - H2: Protokollformate
  - H3: Dateiprotokolle (JSONL)
  - H3: Konsolenausgabe
  - H3: Gateway-WebSocket-Protokolle
  - H2: Protokollierung konfigurieren
  - H3: Protokollebenen
  - H3: Gezielte Diagnose des Modelltransports
  - H3: Trace-Korrelation
  - H3: Größe und Dauer von Modellaufrufen
  - H3: Konsolenstile
  - H3: Schwärzung
  - H2: Diagnose und OpenTelemetry
  - H2: Tipps zur Fehlerbehebung
  - H2: Verwandte Themen

## maturity/scorecard.md

- Route: /maturity/scorecard
- Überschriften:
  - H1: Reifegrad-Scorecard
  - H2: Zweck dieser Seite
  - H2: Auf einen Blick
  - H2: Bewertungsbereiche
  - H2: Oberflächen-Explorer
  - H2: Zusammenfassung der QA-Nachweise
  - H3: Bereitschaft nach Bereich

## maturity/taxonomy.md

- Route: /maturity/taxonomy
- Überschriften:
  - H1: Reifegrad-Taxonomie
  - H2: So lesen Sie diese Seite
  - H2: Reifegrade
  - H2: Produktbereiche
  - H2: Details
  - H3: Kern
  - H3: Plattform
  - H3: Kanal
  - H3: Provider und Tool

## network.md

- Route: /network
- Überschriften:
  - H2: Kernmodell
  - H2: Kopplung und Identität
  - H2: Erkennung und Transporte
  - H2: Nodes und Transporte
  - H2: Sicherheit
  - H2: Verwandte Themen

## nodes/audio.md

- Route: /nodes/audio
- Überschriften:
  - H2: Funktionsweise
  - H2: Automatische Erkennung (Standard)
  - H2: Konfigurationsbeispiele
  - H3: Provider mit CLI-Fallback (OpenAI und Whisper CLI)
  - H3: Nur Provider mit Bereichsbeschränkung
  - H3: Nur Provider (Deepgram)
  - H3: Nur Provider (Mistral Voxtral)
  - H3: Nur Provider (SenseAudio)
  - H3: Transkript im Chat wiedergeben (optional)
  - H2: Hinweise und Beschränkungen
  - H3: Dauerhaft ausgeführte lokale Spracherkennung
  - H3: Unterstützung für Proxy-Umgebungen
  - H2: Erkennung von Erwähnungen in Gruppen
  - H2: Fallstricke
  - H2: Verwandte Themen

## nodes/camera.md

- Route: /nodes/camera
- Überschriften:
  - H2: iOS-Node
  - H3: iOS-Benutzereinstellung
  - H3: iOS-Befehle (über Gateway node.invoke)
  - H3: Voraussetzung für die Ausführung im Vordergrund unter iOS
  - H3: CLI-Hilfsprogramm
  - H2: Android-Node
  - H3: Android-Benutzereinstellung
  - H3: Berechtigungen
  - H3: Voraussetzung für die Ausführung im Vordergrund unter Android
  - H3: Android-Befehle (über Gateway node.invoke)
  - H2: macOS-App
  - H3: macOS-Benutzereinstellung
  - H3: CLI-Hilfsprogramm (node invoke)
  - H2: Sicherheit und praktische Beschränkungen
  - H2: macOS-Bildschirmvideo (auf Betriebssystemebene)
  - H2: Verwandte Themen

## nodes/computer-use.md

- Route: /nodes/computer-use
- Überschriften:
  - H2: Anforderungen
  - H2: Das Computer-Agent-Tool
  - H2: Der Node-Befehl computer.act
  - H2: Aktivieren und scharf schalten
  - H2: Sicherheit
  - H2: Beziehung zu anderen Pfaden für die Desktop-Steuerung

## nodes/images.md

- Route: /nodes/images
- Überschriften:
  - H2: Ziele
  - H2: CLI-Oberfläche
  - H2: Verhalten des WhatsApp-Web-Kanals
  - H2: Pipeline für automatische Antworten
  - H2: Eingehende Medien in Befehle umwandeln
  - H2: Beschränkungen und Fehler
  - H2: Hinweise für Tests
  - H2: Verwandte Themen

## nodes/index.md

- Route: /nodes
- Überschriften:
  - H2: Kopplung und Status
  - H2: Versionsabweichungen und Aktualisierungsreihenfolge
  - H2: Remote-Node-Host (system.run)
  - H3: Einen Node-Host starten (Vordergrund)
  - H3: Remote-Gateway über SSH-Tunnel (Loopback-Bindung)
  - H3: Einen Node-Host starten (Dienst)
  - H3: Koppeln und benennen
  - H3: Auf Nodes gehostete MCP-Server
  - H3: Auf Nodes gehostete Skills
  - H3: Identitätsstatus ohne grafische Oberfläche
  - H3: Befehle zur Zulassungsliste hinzufügen
  - H3: Exec auf den Node verweisen
  - H3: Lokale Modellinferenz
  - H3: Codex-Sitzungen und -Transkripte
  - H3: Claude-Sitzungen und -Transkripte
  - H2: Befehle aufrufen
  - H2: Befehlsrichtlinie
  - H2: Konfiguration (openclaw.json)
  - H2: Screenshots (Canvas-Snapshots)
  - H3: Canvas-Steuerelemente
  - H3: A2UI (Canvas)
  - H2: Fotos und Videos (Node-Kamera)
  - H2: Bildschirmaufzeichnungen (Nodes)
  - H2: Standort (Nodes)
  - H2: SMS (Android-Nodes)
  - H2: Befehle für Geräte- und persönliche Daten
  - H2: Systembefehle (Node-Host / Mac-Node)
  - H2: Bindung des Exec-Nodes
  - H2: Berechtigungsübersicht
  - H2: Node-Host ohne grafische Oberfläche (plattformübergreifend)
  - H2: Mac-Node-Modus

## nodes/location-command.md

- Route: /nodes/location-command
- Überschriften:
  - H2: Kurzfassung
  - H2: Warum eine Auswahl (und nicht nur ein Schalter)
  - H2: Einstellungsmodell
  - H2: Berechtigungszuordnung (node.permissions)
  - H2: Befehl: location.get
  - H2: Verhalten im Hintergrund
  - H2: Modell- und Toolintegration
  - H2: UX-Text (Vorschlag)
  - H2: Verwandte Themen

## nodes/media-understanding.md

- Route: /nodes/media-understanding
- Überschriften:
  - H2: Funktionsweise
  - H2: Konfiguration
  - H3: Modelleinträge
  - H3: Provider-Anmeldedaten
  - H2: Regeln und Verhalten
  - H3: Automatische Erkennung (Standard)
  - H3: Proxy-Unterstützung (Audio-/Videoaufrufe an Provider)
  - H2: Funktionen
  - H2: Unterstützungsmatrix der Provider
  - H2: Anleitung zur Modellauswahl
  - H2: Richtlinie für Anhänge
  - H3: Extraktion von Dateianhängen
  - H2: Konfigurationsbeispiele
  - H2: Statusausgabe
  - H2: Hinweise
  - H2: Verwandte Themen

## nodes/presence.md

- Route: /nodes/presence
- Überschriften:
  - H2: Anforderungen
  - H2: Aktiven Computer überprüfen
  - H2: Wie Aktivität in Präsenz umgewandelt wird
  - H2: Datenschutz und Modellkontext
  - H2: Weiterleitung von Verbindungswarnungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## nodes/talk.md

- Route: /nodes/talk
- Überschriften:
  - H2: Verhalten (macOS)
  - H2: Sprachanweisungen in Antworten
  - H2: Konfiguration (/.openclaw/openclaw.json)
  - H2: macOS-Benutzeroberfläche
  - H2: Android-Benutzeroberfläche
  - H2: Hinweise
  - H2: Verwandte Themen

## nodes/troubleshooting.md

- Route: /nodes/troubleshooting
- Überschriften:
  - H2: Befehlsabfolge
  - H2: Anforderungen für die Ausführung im Vordergrund
  - H2: Berechtigungsmatrix
  - H2: Kopplung im Vergleich zu Genehmigungen
  - H2: Häufige Node-Fehlercodes
  - H2: Schneller Wiederherstellungsablauf
  - H2: Verwandte Themen

## nodes/voicewake.md

- Route: /nodes/voicewake
- Überschriften:
  - H2: Speicher
  - H2: Protokoll
  - H3: Auslöserliste
  - H3: Weiterleitung (vom Auslöser zum Ziel)
  - H3: Ereignisse
  - H2: Clientverhalten
  - H2: Verwandte Themen

## openclaw-agent-runtime.md

- Route: /openclaw-agent-runtime
- Überschriften:
  - H2: Typprüfung und Linting
  - H2: Agent-Runtime-Tests ausführen
  - H2: Manuelle Tests
  - H2: Zurücksetzen auf einen bereinigten Ausgangszustand
  - H2: Referenzen
  - H2: Verwandte Themen

## perplexity.md

- Route: /perplexity
- Überschriften:
  - H2: Verwandte Themen

## plan/cloud-workers.md

- Route: /plan/cloud-workers
- Überschriften:
  - H2: Status
  - H2: Problem
  - H2: Ziele
  - H2: Nichtziele (v1)
  - H2: Vorbilder (was wir übernehmen und was wir umkehren)
  - H2: Architekturentscheidung: Schleife auf dem Worker, Inferenz über das Gateway
  - H2: Komponenten
  - H3: 1. Zustandsautomat der Umgebung und Provider-Vertrag
  - H3: 2. Worker-Bootstrap: OpenClaw auf der Box installieren
  - H3: 3. Transport: alles über SSH
  - H3: 4. Worker-Protokoll (eigenständig; nicht das Node-Protokoll)
  - H3: 5. RPCs des Sitzungs-Backends
  - H3: 6. Workspace-Synchronisierung
  - H3: 7. Zustandsautomat für Platzierung, Sitzungen und Benutzeroberfläche
  - H2: Zuweisung und Übergabe
  - H2: Sicherheitsmodell
  - H2: Kapazität
  - H2: Lebenszyklus
  - H2: Konfigurationsoberfläche
  - H2: Meilensteine
  - H2: Offene Fragen

## plan/path3-sqlite-session-artifact-family.md

- Route: /plan/path3-sqlite-session-artifact-family
- Überschriften:
  - H1: Pfad 3: Familie der SQLite-Sitzungsartefakte
  - H2: Maßgebliche Familie
  - H2: Nicht zur Familie gehörende Artefakte nach der Umstellung
  - H2: Änderungspunkte
  - H2: Gezielte Tests

## plan/ui-channels.md

- Route: /plan/ui-channels
- Überschriften:
  - H2: Status
  - H2: Problem
  - H2: Ziele
  - H2: Nichtziele
  - H2: Zielmodell
  - H2: Zustellungsmetadaten
  - H2: Vertrag für Laufzeitfunktionen
  - H2: Kanalzuordnung
  - H2: Refactoring-Schritte
  - H2: Tests
  - H2: Offene Fragen
  - H2: Verwandte Themen

## platforms/android.md

- Route: /platforms/android
- Überschriften:
  - H2: Übersicht der Unterstützung
  - H2: Installation außerhalb von Google Play
  - H2: Android von einem entfernten Mac spiegeln und steuern
  - H3: Bevor Sie beginnen
  - H3: ADB über TCP aktivieren
  - H3: Nur den steuernden Mac zulassen
  - H3: Verbinden und Spiegelung starten
  - H3: Fehlerbehebung
  - H2: Verbindungsleitfaden
  - H3: Voraussetzungen
  - H3: 1. Gateway starten
  - H3: 2. Erkennung überprüfen (optional)
  - H4: Netzwerkübergreifende Erkennung über Unicast-DNS-SD
  - H3: 3. Von Android aus verbinden
  - H3: Mehrere Gateways
  - H3: Präsenz-Lebenszeichen
  - H3: 4. Kopplung genehmigen (CLI)
  - H3: 5. Überprüfen, ob der Node verbunden ist
  - H3: 6. Chat und Verlauf
  - H3: 7. Canvas und Kamera
  - H4: Gateway-Canvas-Host (für Webinhalte empfohlen)
  - H3: 8. Sprache und erweiterte Android-Befehlsoberfläche
  - H3: 9. Workspace-Dateien (schreibgeschützt)
  - H2: Befehlsgenehmigungen überprüfen
  - H2: Einstiegspunkte für den Assistenten
  - H2: Weiterleitung von Benachrichtigungen
  - H2: Verwandte Themen

## platforms/digitalocean.md

- Route: /platforms/digitalocean
- Überschriften:
  - H2: Verwandte Themen

## platforms/easyrunner.md

- Route: /platforms/easyrunner
- Überschriften:
  - H2: Bevor Sie beginnen
  - H2: Compose-App
  - H2: OpenClaw konfigurieren
  - H2: Überprüfen
  - H2: Aktualisierungen und Sicherungen
  - H2: Fehlerbehebung

## platforms/index.md

- Route: /platforms
- Überschriften:
  - H2: Betriebssystem auswählen
  - H2: VPS und Hosting
  - H2: Häufig verwendete Links
  - H2: Gateway-Dienst installieren (CLI)
  - H2: Verwandte Themen

## platforms/ios.md

- Route: /platforms/ios
- Überschriften:
  - H2: Funktionsweise
  - H2: Anforderungen
  - H2: Schnellstart (koppeln und verbinden)
  - H2: Befehlsgenehmigungen überprüfen
  - H2: Optionaler direkter Apple-Watch-Node
  - H2: Relay-gestützte Push-Benachrichtigungen für offizielle Builds
  - H2: Hintergrund-Lebenszeichen
  - H2: Authentifizierungs- und Vertrauensablauf
  - H2: Erkennungspfade
  - H3: Bonjour (LAN)
  - H3: Tailnet (netzwerkübergreifend)
  - H3: Manueller Host/Port
  - H2: Mehrere Gateways
  - H2: Canvas und A2UI
  - H2: Beziehung zu Computer Use
  - H3: Canvas-Auswertung / Snapshot
  - H2: Sprachaktivierung und Sprechmodus
  - H2: Häufige Fehler
  - H2: Verwandte Dokumentation

## platforms/linux.md

- Route: /platforms/linux
- Überschriften:
  - H2: Schnellstart (VPS)
  - H2: Installation
  - H2: Gateway-Dienst (systemd)
  - H2: Speicherdruck und OOM-Beendigungen
  - H2: Verwandte Themen

## platforms/mac/bundled-gateway.md

- Route: /platforms/mac/bundled-gateway
- Überschriften:
  - H2: Automatische Einrichtung
  - H2: Manuelle Wiederherstellung
  - H2: Launchd (Gateway als LaunchAgent)
  - H2: Versionskompatibilität
  - H2: Statusverzeichnis unter macOS
  - H2: App-Verbindung debuggen
  - H2: Smoke-Test
  - H2: Verwandte Themen

## platforms/mac/canvas.md

- Route: /platforms/mac/canvas
- Überschriften:
  - H2: Speicherort von Canvas
  - H2: Verhalten des Panels
  - H2: Agent-API-Oberfläche
  - H2: A2UI in Canvas
  - H3: A2UI-Befehle (v0.8)
  - H2: Agent-Ausführungen aus Canvas auslösen
  - H2: Sicherheitshinweise
  - H2: Verwandte Themen

## platforms/mac/child-process.md

- Route: /platforms/mac/child-process
- Überschriften:
  - H2: Standardverhalten (launchd)
  - H2: Nicht signierte Entwicklungs-Builds
  - H2: Nur-Anhängen-Modus
  - H2: Remote-Modus
  - H2: Warum wir launchd bevorzugen
  - H2: Verwandte Themen

## platforms/mac/dev-setup.md

- Route: /platforms/mac/dev-setup
- Überschriften:
  - H1: macOS-Entwicklungsumgebung
  - H2: Voraussetzungen
  - H2: 1. Abhängigkeiten installieren
  - H2: 2. App erstellen und paketieren
  - H2: 3. CLI und Gateway installieren
  - H2: Fehlerbehebung
  - H3: Build schlägt fehl: Toolchain- oder SDK-Inkompatibilität
  - H3: App stürzt bei der Berechtigungserteilung ab
  - H3: Gateway bleibt unbegrenzt bei „Starting...“
  - H2: Verwandte Themen

## platforms/mac/health.md

- Route: /platforms/mac/health
- Überschriften:
  - H1: Zustandsprüfungen unter macOS
  - H2: Menüleiste
  - H2: Einstellungen
  - H2: Funktionsweise der Prüfung
  - H2: Im Zweifelsfall
  - H2: Verwandte Themen

## platforms/mac/icon.md

- Route: /platforms/mac/icon
- Überschriften:
  - H1: Zustände des Menüleistensymbols
  - H2: Zustände
  - H2: Ohren für die Sprachaktivierung
  - H2: Formen und Größen
  - H2: Hinweise zum Verhalten
  - H2: Verwandte Themen

## platforms/mac/logging.md

- Route: /platforms/mac/logging
- Überschriften:
  - H1: Protokollierung (macOS)
  - H2: Rotierende Diagnoseprotokolldatei (Debug-Bereich)
  - H2: Private Daten in der einheitlichen Protokollierung unter macOS
  - H2: Für OpenClaw aktivieren (ai.openclaw)
  - H2: Nach dem Debuggen deaktivieren
  - H2: Verwandte Themen

## platforms/mac/menu-bar.md

- Route: /platforms/mac/menu-bar
- Überschriften:
  - H2: Angezeigte Inhalte
  - H2: Zustandsmodell
  - H2: IconState-Enum (Swift)
  - H3: ActivityKind -&gt; Badge-Symbol
  - H3: Visuelle Zuordnung
  - H2: Kontext-Untermenü
  - H2: Text der Statuszeile (Menü)
  - H2: Ereignisübernahme
  - H2: Debug-Überschreibung
  - H2: Testcheckliste
  - H2: Verwandte Themen

## platforms/mac/peekaboo.md

- Route: /platforms/mac/peekaboo
- Überschriften:
  - H2: Was dies ist (und was nicht)
  - H2: Beziehung zu anderen Pfaden der Desktop-Steuerung
  - H2: Bridge aktivieren
  - H2: Reihenfolge der Client-Erkennung
  - H2: Sicherheit und Berechtigungen
  - H2: Snapshot-Verhalten (Automatisierung)
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## platforms/mac/permissions.md

- Route: /platforms/mac/permissions
- Überschriften:
  - H2: Anforderungen für stabile Berechtigungen
  - H2: Bedienungshilfen-Berechtigungen für Node- und CLI-Laufzeitumgebungen
  - H2: Wiederherstellungscheckliste, wenn Eingabeaufforderungen verschwinden
  - H2: Berechtigungen für Dateien und Ordner (Desktop/Dokumente/Downloads)
  - H2: Verwandte Themen

## platforms/mac/remote.md

- Route: /platforms/mac/remote
- Überschriften:
  - H2: Modi
  - H2: Remote-Transporte
  - H2: Voraussetzungen auf dem Remote-Host
  - H2: Einrichtung der macOS-App
  - H2: Webchat
  - H2: Berechtigungen
  - H2: Sicherheitshinweise
  - H2: WhatsApp-Anmeldeablauf (remote)
  - H2: Fehlerbehebung
  - H2: Benachrichtigungstöne
  - H2: Verwandte Themen

## platforms/mac/signing.md

- Route: /platforms/mac/signing
- Überschriften:
  - H1: Mac-Signierung (Debug-Builds)
  - H2: Verwendung
  - H3: Hinweis zur Ad-hoc-Signierung
  - H2: Build-Metadaten für „Über“
  - H2: Verwandte Themen

## platforms/mac/skills.md

- Route: /platforms/mac/skills
- Überschriften:
  - H2: Datenquelle
  - H2: Installationsaktionen
  - H2: Umgebungsvariablen/API-Schlüssel
  - H2: Remote-Modus
  - H2: Verwandte Themen

## platforms/mac/voice-overlay.md

- Route: /platforms/mac/voice-overlay
- Überschriften:
  - H1: Lebenszyklus des Sprach-Overlays (macOS)
  - H2: Verhalten
  - H2: Implementierung
  - H2: Protokollierung
  - H2: Debugging-Checkliste
  - H2: Verwandte Themen

## platforms/mac/voicewake.md

- Route: /platforms/mac/voicewake
- Überschriften:
  - H1: Sprachaktivierung &amp; Push-to-Talk
  - H2: Anforderungen
  - H2: Modi
  - H2: Laufzeitverhalten (Aktivierungswort)
  - H2: Lebenszyklusinvarianten
  - H2: Besonderheiten von Push-to-Talk
  - H2: Benutzerseitige Einstellungen
  - H2: Weiterleitungsverhalten
  - H2: Weiterleitungsnutzlast
  - H2: Schnellprüfung
  - H2: Verwandte Themen

## platforms/mac/webchat.md

- Route: /platforms/mac/webchat
- Überschriften:
  - H2: Start und Debugging
  - H2: Technische Anbindung
  - H2: Sicherheitsoberfläche
  - H2: Bekannte Einschränkungen
  - H2: Verwandte Themen

## platforms/mac/xpc.md

- Route: /platforms/mac/xpc
- Überschriften:
  - H1: IPC-Architektur von OpenClaw unter macOS
  - H2: Ziele
  - H2: Funktionsweise
  - H3: Gateway- und Node-Transport
  - H3: Node-Dienst und App-IPC
  - H3: PeekabooBridge (UI-Automatisierung)
  - H2: Betriebsabläufe
  - H2: Hinweise zur Absicherung
  - H2: Verwandte Themen

## platforms/macos.md

- Route: /platforms/macos
- Überschriften:
  - H2: Download
  - H2: Erster Start
  - H2: Aktualisierungen
  - H2: Dashboard-Links öffnen
  - H2: Browser-Anmeldungen importieren
  - H2: Gateway-Modus auswählen
  - H2: Zuständigkeitsbereich der App
  - H2: macOS-Detailseiten
  - H2: Verwandte Themen

## platforms/oracle.md

- Route: /platforms/oracle
- Überschriften:
  - H2: Verwandte Themen

## platforms/raspberry-pi.md

- Route: /platforms/raspberry-pi
- Überschriften:
  - H2: Verwandte Themen

## platforms/windows.md

- Route: /platforms/windows
- Überschriften:
  - H2: Empfohlen: Windows Hub
  - H3: Inhalt von Windows Hub
  - H3: Erster Start
  - H2: Windows-Node-Modus
  - H2: Lokaler MCP-Modus
  - H2: Native Windows-CLI und natives Gateway
  - H2: WSL2-Gateway
  - H2: Automatischer Gateway-Start vor der Windows-Anmeldung
  - H2: WSL-Dienste im LAN verfügbar machen
  - H2: Fehlerbehebung
  - H3: Das Taskleistensymbol wird nicht angezeigt
  - H3: Lokale Einrichtung schlägt fehl
  - H3: Die App meldet, dass eine Kopplung erforderlich ist
  - H3: Webchat kann ein Remote-Gateway nicht erreichen
  - H3: Befehle für screen.snapshot, Kamera oder Audio schlagen fehl
  - H3: Git- oder GitHub-Verbindung schlägt fehl
  - H2: Verwandte Themen

## plugins/adding-capabilities.md

- Route: /plugins/adding-capabilities
- Überschriften:
  - H2: Wann eine Fähigkeit erstellt werden sollte
  - H2: Standardablauf
  - H2: Was wohin gehört
  - H2: Schnittstellen für Provider und Harness
  - H2: Dateicheckliste
  - H2: Ausgearbeitetes Beispiel: Bilderzeugung
  - H2: Embedding-Provider
  - H2: Review-Checkliste
  - H2: Verwandte Themen

## plugins/admin-http-rpc.md

- Route: /plugins/admin-http-rpc
- Überschriften:
  - H2: Vor der Aktivierung
  - H2: Aktivieren
  - H2: Route überprüfen
  - H2: Authentifizierung
  - H2: Sicherheitsmodell
  - H2: Anfrage
  - H2: Antwort
  - H2: Zulässige Methoden
  - H2: WebSocket-Vergleich
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/agent-tools.md

- Route: /plugins/agent-tools
- Überschriften:
  - H2: Verwandte Themen

## plugins/architecture-internals.md

- Route: /plugins/architecture-internals
- Überschriften:
  - H2: Ladepipeline
  - H3: Manifest-zuerst-Verhalten
  - H3: Plugin-Cache-Grenze
  - H2: Registrierungsmodell
  - H2: Callbacks für Konversationsbindungen
  - H2: Provider-Laufzeit-Hooks
  - H3: Hook-Reihenfolge und Verwendung
  - H3: Provider-Beispiel
  - H3: Integrierte Beispiele
  - H2: Laufzeit-Hilfsfunktionen
  - H3: api.runtime.imageGeneration
  - H2: Gateway-HTTP-Routen
  - H2: Importpfade des Plugin-SDK
  - H2: Schemas der Nachrichtenwerkzeuge
  - H2: Auflösung des Kanalziels
  - H2: Konfigurationsgestützte Verzeichnisse
  - H2: Provider-Kataloge
  - H2: Schreibgeschützte Kanalinspektion
  - H2: Paketbündel
  - H3: Metadaten des Kanalkatalogs
  - H2: Plugins für die Kontext-Engine
  - H2: Neue Fähigkeit hinzufügen
  - H3: Checkliste für Fähigkeiten
  - H3: Vorlage für Fähigkeiten
  - H2: Verwandte Themen

## plugins/architecture.md

- Route: /plugins/architecture
- Überschriften:
  - H2: Öffentliches Fähigkeitsmodell
  - H3: Haltung zur externen Kompatibilität
  - H3: Plugin-Formen
  - H3: Veraltete Hooks
  - H3: Kompatibilitätssignale
  - H2: Architekturüberblick
  - H3: Snapshot der Plugin-Metadaten und Nachschlagetabelle
  - H3: Aktivierungsplanung
  - H3: Kanal-Plugins und das gemeinsame Nachrichtenwerkzeug
  - H2: Zuständigkeitsmodell für Fähigkeiten
  - H3: Schichtung von Fähigkeiten
  - H3: Beispiel eines Unternehmens-Plugins mit mehreren Fähigkeiten
  - H3: Fähigkeitsbeispiel: Videoverständnis
  - H2: Verträge und Durchsetzung
  - H3: Was in einen Vertrag gehört
  - H2: Ausführungsmodell
  - H2: Exportgrenze
  - H2: Interna und Referenz
  - H2: Verwandte Themen

## plugins/building-extensions.md

- Route: /plugins/building-extensions
- Überschriften:
  - H2: Verwandte Themen

## plugins/building-plugins.md

- Route: /plugins/building-plugins
- Überschriften:
  - H2: Anforderungen
  - H2: Plugin-Form auswählen
  - H2: Schnellstart
  - H2: Werkzeuge registrieren
  - H2: Importkonventionen
  - H2: Checkliste vor der Einreichung
  - H2: Gegen Betaversionen testen
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## plugins/bundles.md

- Route: /plugins/bundles
- Überschriften:
  - H2: Warum Bundles existieren
  - H2: Bundle installieren
  - H2: Was OpenClaw aus Bundles abbildet
  - H3: Derzeit unterstützt
  - H4: Skill-Inhalte
  - H4: Hook-Pakete
  - H4: MCP für eingebettetes OpenClaw
  - H4: Einstellungen für eingebettetes OpenClaw
  - H4: LSP für eingebettetes OpenClaw
  - H3: Erkannt, aber nicht ausgeführt
  - H2: Bundle-Formate
  - H2: Erkennungspriorität
  - H2: Laufzeitabhängigkeiten und Bereinigung
  - H2: Sicherheit
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/cli-backend-plugins.md

- Route: /plugins/cli-backend-plugins
- Überschriften:
  - H2: Zuständigkeitsbereich des Plugins
  - H2: Minimales Backend-Plugin
  - H2: Konfigurationsform
  - H2: Erweiterte Backend-Hooks
  - H3: ownsNativeCompaction: OpenClaw-Compaction deaktivieren
  - H2: MCP-Werkzeug-Bridge
  - H2: Benutzerkonfiguration
  - H2: Überprüfung
  - H2: Checkliste
  - H2: Verwandte Themen

## plugins/codex-computer-use.md

- Route: /plugins/codex-computer-use
- Überschriften:
  - H2: OpenClaw.app und Peekaboo
  - H2: iOS-App
  - H2: Direktes cua-driver-MCP
  - H2: Schnelleinrichtung
  - H2: Befehle
  - H2: Marketplace-Auswahlmöglichkeiten
  - H2: Gebündelter macOS-Marketplace
  - H3: Gemeinsamer Plugin-Cache
  - H2: Limit des Remote-Katalogs
  - H2: Konfigurationsreferenz
  - H2: Was OpenClaw überprüft
  - H2: macOS-Berechtigungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/codex-harness-reference.md

- Route: /plugins/codex-harness-reference
- Überschriften:
  - H2: Plugin-Konfigurationsoberfläche
  - H2: Überwachung
  - H2: App-Server-Transport
  - H2: Genehmigungs- und Sandbox-Modi
  - H2: Native Ausführung in der Sandbox
  - H2: Authentifizierungs- und Umgebungsisolation
  - H2: Dynamische Werkzeuge
  - H2: Zeitüberschreitungen
  - H2: Modellerkennung
  - H2: Bootstrap-Dateien des Arbeitsbereichs
  - H2: Umgebungsüberschreibungen
  - H2: Verwandte Themen

## plugins/codex-harness-runtime.md

- Route: /plugins/codex-harness-runtime
- Überschriften:
  - H2: Überblick
  - H2: Thread-Bindungen und Modelländerungen
  - H2: Überwachung und sichere Fortsetzung
  - H2: Sichtbare Antworten und Heartbeats
  - H2: Hook-Grenzen
  - H2: V1-Unterstützungsvertrag
  - H2: Native Berechtigungen und MCP-Abfragen
  - H2: Warteschlangensteuerung
  - H2: Hochladen von Codex-Feedback
  - H2: Compaction und Transkriptspiegel
  - H2: Medien und Zustellung
  - H2: Verwandte Themen

## plugins/codex-harness.md

- Route: /plugins/codex-harness
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Threads mit Codex Desktop und CLI teilen
  - H2: Codex-Sitzungen überwachen
  - H2: Konfiguration
  - H3: Compaction
  - H2: Codex-Laufzeit überprüfen
  - H2: Routing und Modellauswahl
  - H2: Bereitstellungsmuster
  - H3: Einfache Codex-Bereitstellung
  - H3: Bereitstellung mit gemischten Providern
  - H3: Codex-Bereitstellung mit sicherem Abbruch
  - H2: App-Server-Richtlinie
  - H2: Befehle und Diagnose
  - H3: Codex-Threads lokal untersuchen
  - H3: Authentifizierungsreihenfolge
  - H3: Umgebungsisolation
  - H3: Dynamische Werkzeuge und Websuche
  - H3: Konfigurationsfelder
  - H3: Zeitüberschreitungen bei dynamischen Werkzeugaufrufen
  - H3: Umgebungsüberschreibungen für lokale Tests
  - H2: Native Codex-Plugins
  - H2: Computersteuerung
  - H2: Laufzeitgrenzen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/codex-native-plugins.md

- Route: /plugins/codex-native-plugins
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Plugins über den Chat verwalten
  - H2: Funktionsweise der Einrichtung nativer Plugins
  - H2: Unterstützungsgrenzen von V1
  - H2: App-Bestand und Zuständigkeit
  - H2: Apps verbundener Konten
  - H2: App-Konfiguration für Threads
  - H2: Richtlinie für destruktive Aktionen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/codex-supervision.md

- Route: /plugins/codex-supervision
- Überschriften:
  - H2: Bevor Sie beginnen
  - H2: Überwachung aktivieren
  - H2: Operator-CLI verwenden
  - H2: Von einer lokalen Sitzung abzweigen
  - H2: Eine lokale Sitzung archivieren
  - H2: Einschränkungen gekoppelter Nodes verstehen
  - H2: Metadaten und Berechtigungen
  - H3: Kompatibilitätswerkzeuge
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/community.md

- Route: /plugins/community
- Überschriften:
  - H2: Plugins finden
  - H2: Plugins veröffentlichen
  - H2: Verwandte Themen

## plugins/compatibility.md

- Route: /plugins/compatibility
- Überschriften:
  - H2: Kompatibilitätsregister
  - H2: Richtlinie zur Einstellung
  - H2: Aktuelle Kompatibilitätsbereiche
  - H3: Flache Aliasse für eingehende WhatsApp-Callbacks
  - H3: Zulassungsfelder für eingehende WhatsApp-Nachrichten
  - H2: Plugin-Inspector-Paket
  - H3: Abnahmelauf für Maintainer
  - H2: Versionshinweise

## plugins/copilot.md

- Route: /plugins/copilot
- Überschriften:
  - H2: Anforderungen
  - H2: Installation
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H2: BYOK
  - H2: Authentifizierung
  - H2: Konfigurationsoberfläche
  - H2: Compaction
  - H2: Spiegelung des Transkripts
  - H2: Nebenfragen (/btw)
  - H2: Doctor
  - H2: Einschränkungen
  - H2: Berechtigungen und askuser
  - H3: GitHub-Token auf Sitzungsebene
  - H2: Verwandte Themen

## plugins/dependency-resolution.md

- Route: /plugins/dependency-resolution
- Überschriften:
  - H2: Aufteilung der Zuständigkeiten
  - H2: Installationsstammverzeichnisse
  - H2: Lokale Plugins
  - H2: Start und Neuladen
  - H2: Mitgelieferte Plugins
  - H2: Bereinigung von Altbeständen

## plugins/google-meet.md

- Route: /plugins/google-meet
- Überschriften:
  - H2: Schnellstart
  - H3: Eine Besprechung erstellen
  - H3: Nur zur Beobachtung teilnehmen
  - H3: Zustand der Echtzeitsitzung
  - H2: Lokaler Gateway + Parallels Chrome
  - H3: Häufige Fehlerprüfungen
  - H2: Installationshinweise
  - H2: Transporte
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth und Vorabprüfung
  - H3: Google-Anmeldedaten erstellen
  - H3: Aktualisierungstoken ausstellen
  - H3: OAuth mit Doctor überprüfen
  - H3: Artefakte auflösen, vorab prüfen und lesen
  - H3: Live-Smoke-Test
  - H3: Beispiele erstellen
  - H2: Konfiguration
  - H3: Standardwerte
  - H3: Optionale Überschreibungen
  - H2: Werkzeug
  - H2: Agenten- und Bidi-Modi
  - H2: Checkliste für Live-Tests
  - H2: Fehlerbehebung
  - H3: Der Agent kann das Google-Meet-Werkzeug nicht sehen
  - H3: Keine verbundene Google-Meet-fähige Node
  - H3: Der Browser wird geöffnet, aber der Agent kann nicht teilnehmen
  - H3: Das Erstellen der Besprechung schlägt fehl
  - H3: Der Agent nimmt teil, spricht aber nicht
  - H3: Prüfungen der Twilio-Einrichtung schlagen fehl
  - H3: Der Twilio-Anruf beginnt, tritt der Besprechung aber nie bei
  - H2: Hinweise
  - H2: Verwandte Themen

## plugins/hooks.md

- Route: /plugins/hooks
- Überschriften:
  - H2: Schnellstart
  - H2: Hook-Katalog
  - H3: Kopplungsanfragen von Kanälen
  - H2: Runtime-Hooks debuggen
  - H2: Richtlinie für Werkzeugaufrufe
  - H3: Hook für die Ausführungsumgebung
  - H3: Persistenz von Werkzeugergebnissen
  - H2: Prompt- und Modell-Hooks
  - H3: Sitzungserweiterungen und Einfügungen für den nächsten Durchlauf
  - H2: Nachrichten-Hooks
  - H2: Installations-Hooks
  - H2: Gateway-Lebenszyklus
  - H3: Sichere Projektion externer Cron-Aufgaben
  - H2: Bevorstehende Einstellungen
  - H2: Verwandte Themen

## plugins/install-overrides.md

- Route: /plugins/install-overrides
- Überschriften:
  - H2: Umgebung
  - H2: Verhalten
  - H2: Paket-E2E

## plugins/llama-cpp.md

- Route: /plugins/llama-cpp
- Überschriften:
  - H2: Konfiguration
  - H2: Native Runtime
  - H2: Runtime-Diagnose
  - H2: Fehlerbehebung

## plugins/logbook.md

- Route: /plugins/logbook
- Überschriften:
  - H2: Bevor Sie beginnen
  - H2: Schnellstart
  - H2: Funktionsweise
  - H2: Modell- und Datenfluss
  - H2: Konfiguration
  - H3: Auswahl des Vision-Modells
  - H2: Dashboard-Registerkarte
  - H2: Gateway-Methoden
  - H2: Datenschutzhinweise
  - H2: Fehlerbehebung
  - H3: Die Logbook-Registerkarte fehlt
  - H3: Die Erfassung meldet einen Fehler
  - H3: Erfassungen sind erfolgreich, aber es werden keine Karten angezeigt
  - H2: Verwandte Themen

## plugins/manage-plugins.md

- Route: /plugins/manage-plugins
- Überschriften:
  - H2: Control UI verwenden
  - H2: Plugins auflisten und suchen
  - H2: Plugins aktivieren und deaktivieren
  - H2: Plugins installieren
  - H2: Neustarten und untersuchen
  - H2: Plugins aktualisieren
  - H2: Plugins deinstallieren
  - H2: Eine Quelle auswählen
  - H2: Plugins veröffentlichen
  - H2: Verwandte Themen

## plugins/manifest.md

- Route: /plugins/manifest
- Überschriften:
  - H2: Funktion dieser Datei
  - H2: Minimales Beispiel
  - H2: Ausführliches Beispiel
  - H2: Referenz der Felder auf oberster Ebene
  - H2: Referenz für catalog
  - H2: Referenz der Metadaten für Generierungs-Provider
  - H2: Referenz der Werkzeugmetadaten
  - H2: Referenz für providerAuthChoices
  - H2: Referenz für commandAliases
  - H2: Referenz für activation
  - H2: Referenz für qaRunners
  - H2: Referenz für setup
  - H3: Referenz für setup.providers
  - H3: setup-Felder
  - H2: Referenz für uiHints
  - H2: Referenz für contracts
  - H2: Referenz für configContracts
  - H2: Referenz für mediaUnderstandingProviderMetadata
  - H2: Referenz für channelConfigs
  - H3: Ein anderes Kanal-Plugin ersetzen
  - H2: Referenz für modelSupport
  - H2: Referenz für modelCatalog
  - H2: Referenz für modelIdNormalization
  - H2: Referenz für providerEndpoints
  - H2: Referenz für providerRequest
  - H2: Referenz für secretProviderIntegrations
  - H2: Referenz für modelPricing
  - H3: OpenClaw-Provider-Index
  - H2: Manifest im Vergleich zu package.json
  - H3: package.json-Felder, die die Erkennung beeinflussen
  - H2: Erkennungspriorität (doppelte Plugin-IDs)
  - H2: JSON-Schema-Anforderungen
  - H2: Validierungsverhalten
  - H2: Hinweise
  - H2: Verwandte Themen

## plugins/memory-lancedb.md

- Route: /plugins/memory-lancedb
- Überschriften:
  - H2: Installation
  - H2: Schnellstart
  - H2: Embedding-Konfiguration
  - H3: Dimensionen
  - H2: Ollama-Embeddings
  - H2: Grenzen für Abruf und Erfassung
  - H2: Befehle
  - H2: Speicher
  - H2: Runtime-Abhängigkeiten und Plattformunterstützung
  - H2: Fehlerbehebung
  - H3: Die Eingabelänge überschreitet die Kontextlänge
  - H3: Nicht unterstütztes Embedding-Modell
  - H3: Das Plugin wird geladen, aber es werden keine Erinnerungen angezeigt
  - H2: Verwandte Themen

## plugins/memory-wiki.md

- Route: /plugins/memory-wiki
- Überschriften:
  - H2: Vault-Modi
  - H2: Vault-Struktur
  - H2: Importe im Open Knowledge Format
  - H2: Strukturierte Aussagen und Nachweise
  - H2: Entitätsmetadaten für Agenten
  - H2: Kompilierungspipeline
  - H2: Dashboards und Zustandsberichte
  - H2: Suche und Abruf
  - H2: Agentenwerkzeuge
  - H2: Prompt- und Kontextverhalten
  - H2: Konfiguration
  - H3: Agentenspezifische Vaults
  - H3: Beispiel: QMD + Bridge-Modus
  - H2: CLI
  - H2: Obsidian-Unterstützung
  - H2: Empfohlener Arbeitsablauf
  - H2: Verwandte Dokumentation

## plugins/message-presentation.md

- Route: /plugins/message-presentation
- Überschriften:
  - H2: Vertrag
  - H2: Producer-Beispiele
  - H2: Renderer-Vertrag
  - H2: Zentraler Rendering-Ablauf
  - H2: Regeln für eingeschränkte Darstellung
  - H3: Sichtbarkeit des Fallback-Werts von Schaltflächen
  - H2: Provider-Zuordnung
  - H2: Präsentation im Vergleich zu InteractiveReply
  - H2: Zustellungsbindung
  - H2: Checkliste für Plugin-Autoren
  - H2: Verwandte Dokumentation

## plugins/oc-path.md

- Route: /plugins/oc-path
- Überschriften:
  - H2: Warum Sie es aktivieren sollten
  - H2: Wo es ausgeführt wird
  - H2: Aktivieren
  - H2: Abhängigkeiten
  - H2: Bereitgestellte Funktionen
  - H2: Beziehung zu anderen Plugins
  - H2: Sicherheit
  - H2: Verwandte Themen

## plugins/plugin-inventory.md

- Route: /plugins/plugin-inventory
- Überschriften:
  - H1: Plugin-Bestand
  - H2: Definitionen
  - H2: Ein Plugin installieren
  - H2: Zentrales npm-Paket
  - H2: Offizielle externe Pakete
  - H2: Nur Quellcode-Checkout

## plugins/plugin-permission-requests.md

- Route: /plugins/plugin-permission-requests
- Überschriften:
  - H2: Die richtige Freigabestufe auswählen
  - H2: Vor einem Werkzeugaufruf eine Genehmigung anfordern
  - H2: Entscheidungsverhalten
  - H2: Genehmigungsaufforderungen weiterleiten
  - H2: Native Codex-Berechtigungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/reference.md

- Route: /plugins/reference
- Überschriften:
  - H1: Plugin-Referenz

## plugins/reference/acpx.md

- Route: /plugins/reference/acpx
- Überschriften:
  - H1: ACPx-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/admin-http-rpc.md

- Route: /plugins/reference/admin-http-rpc
- Überschriften:
  - H1: Admin-Http-Rpc-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/alibaba.md

- Route: /plugins/reference/alibaba
- Überschriften:
  - H1: Alibaba-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/amazon-bedrock-mantle.md

- Route: /plugins/reference/amazon-bedrock-mantle
- Überschriften:
  - H1: Amazon-Bedrock-Mantle-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/amazon-bedrock.md

- Route: /plugins/reference/amazon-bedrock
- Überschriften:
  - H1: Amazon-Bedrock-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/anthropic-vertex.md

- Route: /plugins/reference/anthropic-vertex
- Überschriften:
  - H1: Anthropic-Vertex-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Claude Fable 5
  - H2: Claude Sonnet 5

## plugins/reference/anthropic.md

- Route: /plugins/reference/anthropic
- Überschriften:
  - H1: Anthropic-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/arcee.md

- Route: /plugins/reference/arcee
- Überschriften:
  - H1: Arcee-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/azure-speech.md

- Route: /plugins/reference/azure-speech
- Überschriften:
  - H1: Azure-Speech-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/bonjour.md

- Route: /plugins/reference/bonjour
- Überschriften:
  - H1: Bonjour-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/brave.md

- Route: /plugins/reference/brave
- Überschriften:
  - H1: Brave-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/browser.md

- Route: /plugins/reference/browser
- Überschriften:
  - H1: Browser-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/byteplus.md

- Route: /plugins/reference/byteplus
- Überschriften:
  - H1: BytePlus-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/canvas.md

- Route: /plugins/reference/canvas
- Überschriften:
  - H1: Canvas-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/cerebras.md

- Route: /plugins/reference/cerebras
- Überschriften:
  - H1: Cerebras-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/chutes.md

- Route: /plugins/reference/chutes
- Überschriften:
  - H1: Chutes-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/clawrouter.md

- Route: /plugins/reference/clawrouter
- Überschriften:
  - H1: ClawRouter-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/clickclack.md

- Route: /plugins/reference/clickclack
- Überschriften:
  - H1: Clickclack-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/cloudflare-ai-gateway.md

- Route: /plugins/reference/cloudflare-ai-gateway
- Überschriften:
  - H1: Cloudflare-AI-Gateway-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/codex.md

- Route: /plugins/reference/codex
- Überschriften:
  - H1: Codex-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/cohere.md

- Route: /plugins/reference/cohere
- Überschriften:
  - H1: Cohere-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/comfy.md

- Route: /plugins/reference/comfy
- Überschriften:
  - H1: ComfyUI-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/copilot-proxy.md

- Route: /plugins/reference/copilot-proxy
- Überschriften:
  - H1: Copilot-Proxy-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/copilot.md

- Route: /plugins/reference/copilot
- Überschriften:
  - H1: Copilot-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/crabbox.md

- Route: /plugins/reference/crabbox
- Überschriften:
  - H1: Crabbox-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Konfiguration

## plugins/reference/deepgram.md

- Route: /plugins/reference/deepgram
- Überschriften:
  - H1: Deepgram-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/deepinfra.md

- Route: /plugins/reference/deepinfra
- Überschriften:
  - H1: DeepInfra-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/deepseek.md

- Route: /plugins/reference/deepseek
- Überschriften:
  - H1: DeepSeek-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/diagnostics-otel.md

- Route: /plugins/reference/diagnostics-otel
- Überschriften:
  - H1: OpenTelemetry-Diagnose-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/diagnostics-prometheus.md

- Route: /plugins/reference/diagnostics-prometheus
- Überschriften:
  - H1: Prometheus-Diagnose-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/diffs-language-pack.md

- Route: /plugins/reference/diffs-language-pack
- Überschriften:
  - H1: Diffs-Sprachpaket-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Hinzugefügte Sprachen

## plugins/reference/diffs.md

- Route: /plugins/reference/diffs
- Überschriften:
  - H1: Diffs-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/discord.md

- Route: /plugins/reference/discord
- Überschriften:
  - H1: Discord-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/document-extract.md

- Route: /plugins/reference/document-extract
- Überschriften:
  - H1: Dokumentextraktions-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/duckduckgo.md

- Route: /plugins/reference/duckduckgo
- Überschriften:
  - H1: DuckDuckGo-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/elevenlabs.md

- Route: /plugins/reference/elevenlabs
- Überschriften:
  - H1: Elevenlabs-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/exa.md

- Route: /plugins/reference/exa
- Überschriften:
  - H1: Exa-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/fal.md

- Route: /plugins/reference/fal
- Überschriften:
  - H1: fal-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/featherless.md

- Route: /plugins/reference/featherless
- Überschriften:
  - H1: Featherless-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/feishu.md

- Route: /plugins/reference/feishu
- Überschriften:
  - H1: Feishu-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/file-transfer.md

- Route: /plugins/reference/file-transfer
- Überschriften:
  - H1: Dateiübertragungs-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/firecrawl.md

- Route: /plugins/reference/firecrawl
- Überschriften:
  - H1: Firecrawl-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/fireworks.md

- Route: /plugins/reference/fireworks
- Überschriften:
  - H1: Fireworks-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/github-copilot.md

- Route: /plugins/reference/github-copilot
- Überschriften:
  - H1: GitHub-Copilot-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/gmi.md

- Route: /plugins/reference/gmi
- Überschriften:
  - H1: Gmi-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/google-meet.md

- Route: /plugins/reference/google-meet
- Überschriften:
  - H1: Google-Meet-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/google.md

- Route: /plugins/reference/google
- Überschriften:
  - H1: Google-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/googlechat.md

- Route: /plugins/reference/googlechat
- Überschriften:
  - H1: Google Chat-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/gradium.md

- Route: /plugins/reference/gradium
- Überschriften:
  - H1: Gradium-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/groq.md

- Route: /plugins/reference/groq
- Überschriften:
  - H1: Groq-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/huggingface.md

- Route: /plugins/reference/huggingface
- Überschriften:
  - H1: Hugging-Face-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/imessage.md

- Route: /plugins/reference/imessage
- Überschriften:
  - H1: iMessage-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/inworld.md

- Route: /plugins/reference/inworld
- Überschriften:
  - H1: Inworld-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/irc.md

- Route: /plugins/reference/irc
- Überschriften:
  - H1: IRC-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/kilocode.md

- Route: /plugins/reference/kilocode
- Überschriften:
  - H1: Kilocode-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/kimi.md

- Route: /plugins/reference/kimi
- Überschriften:
  - H1: Kimi-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/line.md

- Route: /plugins/reference/line
- Überschriften:
  - H1: LINE-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/litellm.md

- Route: /plugins/reference/litellm
- Überschriften:
  - H1: LiteLLM-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/llama-cpp.md

- Route: /plugins/reference/llama-cpp
- Überschriften:
  - H1: Llama-Cpp-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/llm-task.md

- Route: /plugins/reference/llm-task
- Überschriften:
  - H1: LLM-Aufgaben-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/lmstudio.md

- Route: /plugins/reference/lmstudio
- Überschriften:
  - H1: LM-Studio-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/lobster.md

- Route: /plugins/reference/lobster
- Überschriften:
  - H1: Lobster-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/logbook.md

- Route: /plugins/reference/logbook
- Überschriften:
  - H1: Logbuch-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/longcat.md

- Route: /plugins/reference/longcat
- Überschriften:
  - H1: LongCat-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/matrix.md

- Route: /plugins/reference/matrix
- Überschriften:
  - H1: Matrix-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/mattermost.md

- Route: /plugins/reference/mattermost
- Überschriften:
  - H1: Mattermost-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/memory-core.md

- Route: /plugins/reference/memory-core
- Überschriften:
  - H1: Memory-Core-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/memory-lancedb.md

- Route: /plugins/reference/memory-lancedb
- Überschriften:
  - H1: Memory-Lancedb-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/memory-wiki.md

- Route: /plugins/reference/memory-wiki
- Überschriften:
  - H1: Memory-Wiki-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/meta.md

- Route: /plugins/reference/meta
- Überschriften:
  - H1: Meta-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/microsoft-foundry.md

- Route: /plugins/reference/microsoft-foundry
- Überschriften:
  - H1: Microsoft-Foundry-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Anforderungen
  - H2: Chatmodelle
  - H2: MAI-Bilderzeugung
  - H2: Fehlerbehebung

## plugins/reference/microsoft.md

- Route: /plugins/reference/microsoft
- Überschriften:
  - H1: Microsoft-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/migrate-claude.md

- Route: /plugins/reference/migrate-claude
- Überschriften:
  - H1: Claude-Migrations-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/migrate-hermes.md

- Route: /plugins/reference/migrate-hermes
- Überschriften:
  - H1: Hermes-Migrations-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/minimax.md

- Route: /plugins/reference/minimax
- Überschriften:
  - H1: MiniMax-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/mistral.md

- Route: /plugins/reference/mistral
- Überschriften:
  - H1: Mistral-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/moonshot.md

- Route: /plugins/reference/moonshot
- Überschriften:
  - H1: Moonshot-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/msteams.md

- Route: /plugins/reference/msteams
- Überschriften:
  - H1: Microsoft Teams-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/nextcloud-talk.md

- Route: /plugins/reference/nextcloud-talk
- Überschriften:
  - H1: Nextcloud-Talk-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/nostr.md

- Route: /plugins/reference/nostr
- Überschriften:
  - H1: Nostr-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/novita.md

- Route: /plugins/reference/novita
- Überschriften:
  - H1: Novita-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/nvidia.md

- Route: /plugins/reference/nvidia
- Überschriften:
  - H1: NVIDIA-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/oc-path.md

- Route: /plugins/reference/oc-path
- Überschriften:
  - H1: Oc-Path-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/ollama.md

- Route: /plugins/reference/ollama
- Überschriften:
  - H1: Ollama-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/open-prose.md

- Route: /plugins/reference/open-prose
- Überschriften:
  - H1: Open-Prose-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/openai.md

- Route: /plugins/reference/openai
- Überschriften:
  - H1: OpenAI-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/opencode-go.md

- Route: /plugins/reference/opencode-go
- Überschriften:
  - H1: OpenCode-Go-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/opencode.md

- Route: /plugins/reference/opencode
- Überschriften:
  - H1: OpenCode-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/openrouter.md

- Route: /plugins/reference/openrouter
- Überschriften:
  - H1: OpenRouter-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/openshell.md

- Route: /plugins/reference/openshell
- Überschriften:
  - H1: Openshell-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/perplexity.md

- Route: /plugins/reference/perplexity
- Überschriften:
  - H1: Perplexity-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/pixverse.md

- Route: /plugins/reference/pixverse
- Überschriften:
  - H1: PixVerse-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/policy.md

- Route: /plugins/reference/policy
- Überschriften:
  - H1: Richtlinien-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verhalten
  - H2: Verwandte Dokumentation

## plugins/reference/qa-channel.md

- Route: /plugins/reference/qa-channel
- Überschriften:
  - H1: QA-Kanal-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang
  - H2: Verwandte Dokumentation

## plugins/reference/qa-lab.md

- Route: /plugins/reference/qa-lab
- Überschriften:
  - H1: QA-Labor-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/qa-matrix.md

- Route: /plugins/reference/qa-matrix
- Überschriften:
  - H1: QA-Matrix-Plugin
  - H2: Bereitstellung
  - H2: Funktionsumfang

## plugins/reference/qianfan.md

- Route: /plugins/reference/qianfan
- Überschriften:
  - H1: Qianfan-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/qqbot.md

- Route: /plugins/reference/qqbot
- Überschriften:
  - H1: QQ-Bot-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/qwen.md

- Route: /plugins/reference/qwen
- Überschriften:
  - H1: Qwen-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/raft.md

- Route: /plugins/reference/raft
- Überschriften:
  - H1: Raft-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/runway.md

- Route: /plugins/reference/runway
- Überschriften:
  - H1: Runway-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/searxng.md

- Route: /plugins/reference/searxng
- Überschriften:
  - H1: SearXNG-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/senseaudio.md

- Route: /plugins/reference/senseaudio
- Überschriften:
  - H1: Senseaudio-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/sglang.md

- Route: /plugins/reference/sglang
- Überschriften:
  - H1: SGLang-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/signal.md

- Route: /plugins/reference/signal
- Überschriften:
  - H1: Signal-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/slack.md

- Route: /plugins/reference/slack
- Überschriften:
  - H1: Slack-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/sms.md

- Route: /plugins/reference/sms
- Überschriften:
  - H1: SMS-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/stepfun.md

- Route: /plugins/reference/stepfun
- Überschriften:
  - H1: StepFun-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/synology-chat.md

- Route: /plugins/reference/synology-chat
- Überschriften:
  - H1: Synology-Chat-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/synthetic.md

- Route: /plugins/reference/synthetic
- Überschriften:
  - H1: Synthetic-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/tavily.md

- Route: /plugins/reference/tavily
- Überschriften:
  - H1: Tavily-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/telegram.md

- Route: /plugins/reference/telegram
- Überschriften:
  - H1: Telegram-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/tencent.md

- Route: /plugins/reference/tencent
- Überschriften:
  - H1: Tencent-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/tlon.md

- Route: /plugins/reference/tlon
- Überschriften:
  - H1: Tlon-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/together.md

- Route: /plugins/reference/together
- Überschriften:
  - H1: Together-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/tokenjuice.md

- Route: /plugins/reference/tokenjuice
- Überschriften:
  - H1: Tokenjuice-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/tts-local-cli.md

- Route: /plugins/reference/tts-local-cli
- Überschriften:
  - H1: TTS-Local-CLI-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/twitch.md

- Route: /plugins/reference/twitch
- Überschriften:
  - H1: Twitch-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/vault.md

- Route: /plugins/reference/vault
- Überschriften:
  - H1: Vault-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/venice.md

- Route: /plugins/reference/venice
- Überschriften:
  - H1: Venice-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/vercel-ai-gateway.md

- Route: /plugins/reference/vercel-ai-gateway
- Überschriften:
  - H1: Vercel-AI-Gateway-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/vllm.md

- Route: /plugins/reference/vllm
- Überschriften:
  - H1: vLLM-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/voice-call.md

- Route: /plugins/reference/voice-call
- Überschriften:
  - H1: Sprachanruf-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/volcengine.md

- Route: /plugins/reference/volcengine
- Überschriften:
  - H1: Volcengine-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/voyage.md

- Route: /plugins/reference/voyage
- Überschriften:
  - H1: Voyage-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/vydra.md

- Route: /plugins/reference/vydra
- Überschriften:
  - H1: Vydra-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/web-readability.md

- Route: /plugins/reference/web-readability
- Überschriften:
  - H1: Web-Lesbarkeits-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/webhooks.md

- Route: /plugins/reference/webhooks
- Überschriften:
  - H1: Webhook-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/whatsapp.md

- Route: /plugins/reference/whatsapp
- Überschriften:
  - H1: WhatsApp-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/workboard.md

- Route: /plugins/reference/workboard
- Überschriften:
  - H1: Workboard-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/workspaces.md

- Route: /plugins/reference/workspaces
- Überschriften:
  - H1: Arbeitsbereiche-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/xai.md

- Route: /plugins/reference/xai
- Überschriften:
  - H1: xAI-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/xiaomi.md

- Route: /plugins/reference/xiaomi
- Überschriften:
  - H1: Xiaomi-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/zai.md

- Route: /plugins/reference/zai
- Überschriften:
  - H1: Z.AI-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/zalo.md

- Route: /plugins/reference/zalo
- Überschriften:
  - H1: Zalo-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/reference/zalouser.md

- Route: /plugins/reference/zalouser
- Überschriften:
  - H1: Zalo-Personal-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/sdk-agent-harness.md

- Route: /plugins/sdk-agent-harness
- Überschriften:
  - H2: Wann Sie ein Harness verwenden sollten
  - H2: Wofür der Kern weiterhin zuständig ist
  - H3: Harness-eigener Authentifizierungs-Bootstrap
  - H3: Verifizierte Laufzeitartefakte der Einrichtung
  - H3: Vertrag für den Anfrage-Transport
  - H2: Ein Harness registrieren
  - H3: Delegierte Ausführung
  - H2: Auswahlrichtlinie
  - H2: Kombination aus Provider und Harness
  - H3: Middleware für Werkzeugergebnisse
  - H3: Klassifizierung des Terminalergebnisses
  - H3: Nebeneffekte am Agentenende
  - H3: Benutzereingaben und Werkzeugoberflächen
  - H3: Nativer Codex-Harness-Modus
  - H2: Strenge der Laufzeit
  - H2: Native Sitzungen und Transkriptspiegelung
  - H2: Werkzeug- und Medienergebnisse
  - H2: Aktuelle Einschränkungen
  - H2: Zugehörige Dokumentation

## plugins/sdk-channel-inbound.md

- Route: /plugins/sdk-channel-inbound
- Überschriften:
  - H2: Kern-Hilfsfunktionen
  - H2: Migration

## plugins/sdk-channel-ingress.md

- Route: /plugins/sdk-channel-ingress
- Überschriften:
  - H2: Laufzeit-Resolver
  - H2: Ergebnis
  - H2: Zugriffsgruppen
  - H2: Ereignismodi
  - H2: Routen und Aktivierung
  - H2: Schwärzung
  - H2: Verifizierung

## plugins/sdk-channel-message.md

- Route: /plugins/sdk-channel-message
- Überschriften: keine

## plugins/sdk-channel-outbound.md

- Route: /plugins/sdk-channel-outbound
- Überschriften:
  - H2: Adapter
  - H2: Bereinigung von Klartext
  - H2: Zustellnachweis
  - H2: Vorhandene ausgehende Adapter
  - H2: Dauerhafte Sendungen
  - H2: Zulassung für verzögerte Zustellung
  - H2: Kompatibilitäts-Dispatch

## plugins/sdk-channel-plugins.md

- Route: /plugins/sdk-channel-plugins
- Überschriften:
  - H2: Wofür Ihr Plugin zuständig ist
  - H2: Nachrichtenadapter
  - H3: Eingehende Einspeisung (experimentell)
  - H3: Tippindikatoren
  - H3: Parameter für Medienquellen
  - H3: Gestaltung nativer Nutzlasten
  - H3: Konversationsgrammatik für Sitzungen
  - H3: Unterstützung für kontobezogene Konversationsbindungen
  - H2: Genehmigungen und Kanalfähigkeiten
  - H3: Genehmigungs-Authentifizierung
  - H3: Nutzlast-Lebenszyklus und Einrichtungshinweise
  - H3: Native Zustellung von Genehmigungen
  - H3: Engere Unterpfade der Genehmigungslaufzeit
  - H3: Unterpfade für die Einrichtung
  - H3: Andere eng gefasste Kanal-Unterpfade
  - H2: Richtlinie für eingehende Erwähnungen
  - H2: Schritt-für-Schritt-Anleitung
  - H2: Dateistruktur
  - H2: Fortgeschrittene Themen
  - H2: Nächste Schritte
  - H2: Zugehörige Dokumentation

## plugins/sdk-channel-turn.md

- Route: /plugins/sdk-channel-turn
- Überschriften: keine

## plugins/sdk-entrypoints.md

- Route: /plugins/sdk-entrypoints
- Überschriften:
  - H2: Paketeinstiegspunkte
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Registrierungsmodus
  - H2: Plugin-Formen
  - H2: Zugehörige Dokumentation

## plugins/sdk-migration.md

- Route: /plugins/sdk-migration
- Überschriften:
  - H2: Was sich geändert hat
  - H3: Warum
  - H2: Kompatibilitätsrichtlinie
  - H2: So führen Sie die Migration durch
  - H2: Referenz der Importpfade
  - H2: Aktive Veraltungen
  - H2: Migration von Sprachwiedergabe und Echtzeit-Sprache
  - H2: Zeitplan für die Entfernung
  - H2: Warnungen vorübergehend unterdrücken
  - H2: Zugehörige Dokumentation

## plugins/sdk-overview.md

- Route: /plugins/sdk-overview
- Überschriften:
  - H2: Importkonvention
  - H2: Unterpfadreferenz
  - H2: Registrierungs-API
  - H3: Registrierung von Fähigkeiten
  - H3: Werkzeuge und Befehle
  - H3: Infrastruktur
  - H3: Host-Hooks für Workflow-Plugins
  - H3: Registrierung der Gateway-Erkennung
  - H3: Metadaten für die CLI-Registrierung
  - H3: Registrierung des CLI-Backends
  - H3: Exklusive Slots
  - H3: Veraltete Adapter für Speichereinbettungen
  - H3: Ereignisse und Lebenszyklus
  - H3: Entscheidungssemantik von Hooks
  - H3: Felder des API-Objekts
  - H2: Konvention für interne Module
  - H2: Zugehörige Dokumentation

## plugins/sdk-provider-plugins.md

- Route: /plugins/sdk-provider-plugins
- Überschriften:
  - H2: Schritt-für-Schritt-Anleitung
  - H2: Auf ClawHub veröffentlichen
  - H2: Dateistruktur
  - H2: Referenz für die Katalogreihenfolge
  - H2: Nächste Schritte
  - H2: Zugehörige Dokumentation

## plugins/sdk-runtime.md

- Route: /plugins/sdk-runtime
- Überschriften:
  - H2: Laden und Schreiben der Konfiguration
  - H2: Wiederverwendbare Laufzeit-Dienstprogramme
  - H2: Laufzeit-Namensräume
  - H2: Speichern von Laufzeitreferenzen
  - H2: Weitere API-Felder der obersten Ebene
  - H2: Zugehörige Dokumentation

## plugins/sdk-setup.md

- Route: /plugins/sdk-setup
- Überschriften:
  - H2: Paketmetadaten
  - H3: openclaw-Felder
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Verzögertes vollständiges Laden
  - H2: Plugin-Manifest
  - H2: Veröffentlichung auf ClawHub
  - H2: Einrichtungseinstieg
  - H3: Eng gefasste Importe von Einrichtungs-Hilfsfunktionen
  - H3: Kanaleigene Hochstufung auf ein Einzelkonto
  - H2: Konfigurationsschema
  - H3: Erstellen von Schemas für Kanalkonfigurationen
  - H2: Einrichtungsassistenten
  - H2: Veröffentlichen und Installieren
  - H2: Zugehörige Dokumentation

## plugins/sdk-subpaths.md

- Route: /plugins/sdk-subpaths
- Überschriften:
  - H2: Plugin-Einstieg
  - H3: Veraltete Kompatibilitäts- und Test-Hilfsfunktionen
  - H3: Reservierte Hilfsunterpfade für gebündelte Plugins
  - H2: Zugehörige Dokumentation

## plugins/sdk-testing.md

- Route: /plugins/sdk-testing
- Überschriften:
  - H2: Test-Dienstprogramme
  - H3: Verfügbare Exporte
  - H3: Typen
  - H2: Testen der Zielauflösung
  - H2: Testmuster
  - H3: Testen von Registrierungsverträgen
  - H3: Testen des Zugriffs auf die Laufzeitkonfiguration
  - H3: Komponententest eines Kanal-Plugins
  - H3: Komponententest eines Provider-Plugins
  - H3: Nachbilden der Plugin-Laufzeit
  - H3: Testen mit instanzbezogenen Stubs
  - H2: Vertragstests (Plugins im Repository)
  - H3: Ausführen eingegrenzter Tests
  - H2: Lint-Erzwingung (Plugins im Repository)
  - H2: Testkonfiguration
  - H2: Zugehörige Dokumentation

## plugins/tool-plugins.md

- Route: /plugins/tool-plugins
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schnellstart
  - H2: Ein Tool erstellen
  - H2: Optionale Tools und Tool-Fabriken
  - H2: Rückgabewerte
  - H2: Konfiguration
  - H2: Generierte Metadaten
  - H2: Paketmetadaten
  - H2: In CI validieren
  - H2: Lokal installieren und prüfen
  - H2: Veröffentlichen
  - H2: Fehlerbehebung
  - H3: Plugin-Einstiegspunkt nicht gefunden: ./dist/index.js
  - H3: Plugin-Einstiegspunkt stellt keine defineToolPlugin-Metadaten bereit
  - H3: Generierte Metadaten in openclaw.plugin.json sind veraltet
  - H3: openclaw.extensions in package.json muss ./dist/index.js enthalten
  - H3: Paket 'typebox' kann nicht gefunden werden
  - H3: Tool wird nach der Installation nicht angezeigt
  - H2: Siehe auch

## plugins/vault.md

- Route: /plugins/vault
- Überschriften:
  - H1: Vault-SecretRefs
  - H2: Bevor Sie beginnen
  - H2: Einen Provider-Schlüssel in Vault speichern
  - H2: Vault für den Gateway sichtbar machen
  - H2: Einen SecretRef-Plan generieren und anwenden
  - H2: Weitere Provider-Schlüssel konfigurieren
  - H2: Format der SecretRef-ID
  - H2: Was OpenClaw speichert
  - H2: Container und verwaltete Bereitstellungen
  - H2: Verwandte Themen

## plugins/voice-call.md

- Route: /plugins/voice-call
- Überschriften:
  - H2: Schnellstart
  - H2: Konfiguration
  - H3: Konfigurationsreferenz
  - H2: Sitzungsbereich
  - H2: Sprachkonversationen in Echtzeit
  - H3: Tool-Richtlinie
  - H3: Sprachkontext des Agenten
  - H3: Beispiele für Echtzeit-Provider
  - H2: Streaming-Transkription
  - H3: Beispiele für Streaming-Provider
  - H2: TTS für Anrufe
  - H3: TTS-Beispiele
  - H2: Eingehende Anrufe
  - H3: Rufnummernspezifisches Routing
  - H3: Vertrag für die Sprachausgabe
  - H3: Verhalten beim Start der Konversation
  - H3: Toleranzzeit bei der Trennung eines Twilio-Streams
  - H2: Bereinigung veralteter Anrufe
  - H2: Webhook-Sicherheit
  - H2: CLI
  - H2: Agenten-Tool
  - H2: Gateway-RPC
  - H2: Fehlerbehebung
  - H3: Einrichtung der Webhook-Erreichbarkeit schlägt fehl
  - H3: Provider-Anmeldedaten schlagen fehl
  - H3: Anrufe starten, aber Provider-Webhooks treffen nicht ein
  - H3: Signaturprüfung schlägt fehl
  - H3: Twilio-Beitritte zu Google Meet schlagen fehl
  - H3: Echtzeitanruf enthält keine Sprache
  - H2: Verwandte Themen

## plugins/webhooks.md

- Route: /plugins/webhooks
- Überschriften:
  - H2: Routen konfigurieren
  - H2: Sicherheitsmodell
  - H2: Anfrageformat
  - H2: Unterstützte Aktionen
  - H3: createflow
  - H3: runtask
  - H2: Antwortstruktur
  - H2: Verwandte Themen

## plugins/workboard.md

- Route: /plugins/workboard
- Überschriften:
  - H2: Aktivieren
  - H2: Konfiguration
  - H2: Kartenfelder
  - H2: Arbeit von einer Karte aus starten
  - H2: Agenten-Tools
  - H2: Verteilung
  - H3: Worker-Auswahl
  - H3: Einstiegspunkte
  - H2: CLI und Slash-Befehl
  - H2: Synchronisierung des Sitzungslebenszyklus
  - H2: Dashboard-Workflow
  - H2: Diagnose
  - H2: Berechtigungen
  - H2: Speicherung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/zalouser.md

- Route: /plugins/zalouser
- Überschriften:
  - H2: Benennung
  - H2: Ausführungsort
  - H2: Installieren
  - H3: Über npm
  - H3: Aus einem lokalen Ordner (Entwicklung)
  - H2: Konfiguration
  - H2: CLI
  - H2: Agenten-Tool
  - H2: Verwandte Themen

## prose.md

- Route: /prose
- Überschriften:
  - H2: Installieren
  - H2: Slash-Befehl
  - H2: Funktionsumfang
  - H2: Beispiel: parallele Recherche und Synthese
  - H2: Zuordnung zur OpenClaw-Laufzeit
  - H2: Dateispeicherorte
  - H2: Zustands-Backends
  - H2: Sicherheit
  - H2: Verwandte Themen

## providers/alibaba.md

- Route: /providers/alibaba
- Überschriften:
  - H2: Erste Schritte
  - H2: Integrierte Wan-Modelle
  - H2: Funktionen und Grenzen
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/anthropic.md

- Route: /providers/anthropic
- Überschriften:
  - H2: Nutzungs- und Kostenverfolgung
  - H2: Erste Schritte
  - H2: Claude-Sitzungen auf mehreren Computern
  - H2: Standardwerte für das Denken (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 und 4.6)
  - H2: Fallback bei sicherheitsbedingter Ablehnung (Claude Fable 5)
  - H3: Warum dies existiert
  - H3: Funktionsweise
  - H3: Beobachtbarkeit und Abrechnung
  - H3: Geltungsbereich
  - H2: Prompt-Caching
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/arcee.md

- Route: /providers/arcee
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Unterstützte Funktionen
  - H2: Verwandte Themen

## providers/azure-speech.md

- Route: /providers/azure-speech
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsoptionen
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/bedrock-mantle.md

- Route: /providers/bedrock-mantle
- Überschriften:
  - H2: Erste Schritte
  - H2: Automatische Modellerkennung
  - H3: Unterstützte Regionen
  - H2: Manuelle Konfiguration
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/bedrock.md

- Route: /providers/bedrock
- Überschriften:
  - H2: Erste Schritte
  - H2: Automatische Modellerkennung
  - H2: Schnelleinrichtung (AWS-Pfad)
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/cerebras.md

- Route: /providers/cerebras
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Manuelle Konfiguration
  - H2: Verwandte Themen

## providers/chutes.md

- Route: /providers/chutes
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Erkennungsverhalten
  - H2: Standardaliase
  - H2: Integrierter Einstiegskatalog
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/claude-max-api-proxy.md

- Route: /providers/claude-max-api-proxy
- Überschriften:
  - H2: Gründe für die Verwendung
  - H2: Funktionsweise
  - H2: Erste Schritte
  - H2: Erweiterte Konfiguration
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/clawrouter.md

- Route: /providers/clawrouter
- Überschriften:
  - H2: Erste Schritte
  - H2: Verwaltete nicht interaktive Bereitstellung
  - H2: Betriebsbereitschaft und Live-Nachweis
  - H2: Modellerkennung
  - H2: Protokoll- und Provider-Plugins
  - H2: Kontingente und Nutzung
  - H2: Fehlerbehebung
  - H2: Sicherheitsverhalten
  - H2: Verwandte Themen

## providers/cloudflare-ai-gateway.md

- Route: /providers/cloudflare-ai-gateway
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktives Beispiel
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/cohere.md

- Route: /providers/cohere
- Überschriften:
  - H2: Integrierter Katalog
  - H2: Erste Schritte
  - H2: Einrichtung ausschließlich über Umgebungsvariablen
  - H2: Verwandte Themen

## providers/comfy.md

- Route: /providers/comfy
- Überschriften:
  - H2: Unterstützte Funktionen
  - H2: Erste Schritte
  - H2: Konfiguration
  - H3: Gemeinsame Schlüssel
  - H3: Funktionsspezifische Schlüssel
  - H2: Workflow-Details
  - H2: Verwandte Themen

## providers/deepgram.md

- Route: /providers/deepgram
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsoptionen
  - H2: Streaming-STT für Sprachanrufe
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/deepinfra.md

- Route: /providers/deepinfra
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel abrufen
  - H2: CLI-Einrichtung
  - H2: Konfigurationsausschnitt
  - H2: Unterstützte Oberflächen
  - H2: Verfügbare Modelle
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/deepseek.md

- Route: /providers/deepseek
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Integrierter Katalog
  - H2: Denken und Tools
  - H2: Live-Tests
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/ds4.md

- Route: /providers/ds4
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schnellstart
  - H2: Vollständige Konfiguration
  - H2: Bedarfsgesteuerter Start
  - H2: Think Max
  - H2: Testen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/elevenlabs.md

- Route: /providers/elevenlabs
- Überschriften:
  - H2: Authentifizierung
  - H2: Text-zu-Sprache
  - H2: Sprache-zu-Text
  - H2: Streaming-STT
  - H2: Verwandte Themen

## providers/fal.md

- Route: /providers/fal
- Überschriften:
  - H2: Erste Schritte
  - H2: Bilderzeugung
  - H2: Videoerzeugung
  - H2: Musikerzeugung
  - H2: Verwandte Themen

## providers/featherless.md

- Route: /providers/featherless
- Überschriften:
  - H2: Einrichtung
  - H2: Standardmodell
  - H2: Weitere Featherless-Modelle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/fireworks.md

- Route: /providers/fireworks
- Überschriften:
  - H2: Erste Schritte
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Benutzerdefinierte Fireworks-Modell-IDs
  - H2: Verwandte Themen

## providers/github-copilot.md

- Route: /providers/github-copilot
- Überschriften:
  - H2: Drei Möglichkeiten zur Verwendung von Copilot in OpenClaw
  - H2: GitHub Enterprise (Datenresidenz)
  - H2: Optionale Flags
  - H2: Nicht interaktives Onboarding
  - H2: Einbettungen für die Speichersuche
  - H3: Konfiguration
  - H3: Funktionsweise
  - H2: Verwandte Themen

## providers/gmi.md

- Route: /providers/gmi
- Überschriften:
  - H2: Einrichtung
  - H2: Wann GMI die richtige Wahl ist
  - H2: Modelle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/google.md

- Route: /providers/google
- Überschriften:
  - H2: Erste Schritte
  - H2: Funktionen
  - H2: Websuche
  - H2: Bilderzeugung
  - H2: Videoerzeugung
  - H2: Musikerzeugung
  - H2: Text-zu-Sprache
  - H2: Echtzeitsprache
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/gradium.md

- Route: /providers/gradium
- Überschriften:
  - H2: Plugin installieren
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Stimmen
  - H3: Nachrichtenspezifische Überschreibung der Stimme
  - H2: Ausgabe
  - H2: Reihenfolge der automatischen Auswahl
  - H2: Verwandte Themen

## providers/groq.md

- Route: /providers/groq
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H3: Beispiel für eine Konfigurationsdatei
  - H2: Integrierter Katalog
  - H2: Schlussfolgerungsmodelle
  - H2: Audiotranskription
  - H2: Verwandte Themen

## providers/huggingface.md

- Route: /providers/huggingface
- Überschriften:
  - H2: Erste Schritte
  - H3: Nicht interaktive Einrichtung
  - H2: Modell-IDs
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/index.md

- Route: /providers
- Überschriften:
  - H2: Schnellstart
  - H2: Provider-Dokumentation
  - H2: Gemeinsame Übersichtsseiten
  - H2: Transkriptions-Provider
  - H2: Community-Tools

## providers/inferrs.md

- Route: /providers/inferrs
- Überschriften:
  - H2: Erste Schritte
  - H2: Beispiel für eine vollständige Konfiguration
  - H2: Bedarfsgesteuerter Start
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/inworld.md

- Route: /providers/inworld
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Konfigurationsoptionen
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/kilocode.md

- Route: /providers/kilocode
- Überschriften:
  - H2: Plugin installieren
  - H2: Einrichtung
  - H2: Standardmodell und Katalog
  - H2: Konfigurationsbeispiel
  - H2: Hinweise zum Verhalten
  - H2: Verwandte Themen

## providers/litellm.md

- Route: /providers/litellm
- Überschriften:
  - H2: Schnellstart
  - H2: Konfiguration
  - H2: Bilderzeugung
  - H2: Erweitert
  - H2: Verwandte Themen

## providers/lmstudio.md

- Route: /providers/lmstudio
- Überschriften:
  - H2: Schnellstart
  - H2: Nicht interaktives Onboarding
  - H2: Konfiguration
  - H3: Kompatibilität der Streaming-Nutzung
  - H3: Kompatibilität des Denkens
  - H3: Explizite Konfiguration
  - H3: Vorladen deaktivieren
  - H3: Host im LAN oder Tailnet
  - H2: Fehlerbehebung
  - H3: LM Studio wird nicht erkannt
  - H3: Authentifizierungsfehler (HTTP 401)
  - H2: Verwandte Themen

## providers/longcat.md

- Route: /providers/longcat
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H3: Nicht interaktive Einrichtung
  - H2: Schlussfolgerungsverhalten
  - H2: Preise
  - H2: Selbst gehostetes LongCat-2.0
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/meta.md

- Route: /providers/meta
- Überschriften:
  - H2: Erste Schritte
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Manuelle Konfiguration
  - H2: Smoke-Test
  - H2: Verwandte Themen

## providers/minimax.md

- Route: /providers/minimax
- Überschriften:
  - H2: Integrierter Katalog
  - H2: Erste Schritte
  - H2: Über openclaw configure konfigurieren
  - H2: Funktionen
  - H3: Bilderzeugung
  - H3: Text-zu-Sprache
  - H3: Musikerzeugung
  - H3: Videoerzeugung
  - H3: Bildverständnis
  - H3: Websuche
  - H2: Erweiterte Konfiguration
  - H2: Hinweise
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/mistral.md

- Route: /providers/mistral
- Überschriften:
  - H2: Erste Schritte
  - H2: Integrierter LLM-Katalog
  - H2: Audiotranskription (Voxtral)
  - H2: Streaming-STT für Sprachanrufe
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/models.md

- Route: /providers/models
- Überschriften:
  - H2: Schnellstart (zwei Schritte)
  - H2: Unterstützte Provider (Einstiegsauswahl)
  - H2: Zusätzliche Provider-Varianten
  - H2: Verwandte Themen

## providers/moonshot.md

- Route: /providers/moonshot
- Überschriften:
  - H2: Integrierter Modellkatalog
  - H2: Erste Schritte
  - H2: Kimi-Websuche
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/novita.md

- Route: /providers/novita
- Überschriften:
  - H2: Einrichtung
  - H2: Standardwerte
  - H2: Mitgelieferter Modellkatalog
  - H2: Wann Sie Novita wählen sollten
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/nvidia.md

- Route: /providers/nvidia
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Ausgewählter Katalog
  - H2: Nemotron 3 Ultra
  - H2: Mitgelieferter Fallback-Katalog
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/ollama-cloud.md

- Route: /providers/ollama-cloud
- Überschriften:
  - H2: Einrichtung
  - H2: Standardwerte
  - H2: Wann Sie Ollama Cloud wählen sollten
  - H2: Modelle
  - H2: Live-Test
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/ollama.md

- Route: /providers/ollama
- Überschriften:
  - H2: Authentifizierungsregeln
  - H2: Erste Schritte
  - H2: Cloud-Modelle über einen lokalen Host
  - H2: Modellerkennung (impliziter Provider)
  - H3: Smoke-Tests
  - H2: Node-lokale Inferenz
  - H2: Bildverarbeitung und Bildbeschreibung
  - H2: Konfiguration
  - H2: Gängige Rezepte
  - H3: Modellauswahl
  - H3: Schnellüberprüfung
  - H2: Ollama-Websuche
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/openai.md

- Route: /providers/openai
- Überschriften:
  - H2: Nutzungs- und Kostenverfolgung
  - H2: Schnellauswahl
  - H2: Namenszuordnung
  - H2: Implizite Agent-Laufzeit
  - H2: Begrenzte Vorschau von GPT-5.6
  - H2: OpenClaw-Funktionsabdeckung
  - H2: Speicher-Embeddings
  - H2: Erste Schritte
  - H2: Native Authentifizierung des Codex-App-Servers
  - H2: Bilderzeugung
  - H2: Videoerzeugung
  - H2: GPT-5-Prompt-Beitrag
  - H2: Stimme und Sprache
  - H2: Azure-OpenAI-Endpunkte
  - H3: Konfiguration
  - H3: API-Version
  - H3: Modellnamen sind Bereitstellungsnamen
  - H3: Regionale Verfügbarkeit
  - H3: Parameterunterschiede
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/opencode-go.md

- Route: /providers/opencode-go
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Integrierter Katalog
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/opencode.md

- Route: /providers/opencode
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Integrierte Kataloge
  - H3: Zen
  - H3: Go
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/openrouter.md

- Route: /providers/openrouter
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Modellreferenzen
  - H2: Bilderzeugung
  - H2: Videoerzeugung
  - H2: Musikerzeugung
  - H2: Text-zu-Sprache
  - H2: Sprache-zu-Text (eingehendes Audio)
  - H2: Fusion-Router
  - H2: Authentifizierung und Header
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/perplexity-provider.md

- Route: /providers/perplexity-provider
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Suchmodi
  - H2: Native API-Filterung
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/pixverse.md

- Route: /providers/pixverse
- Überschriften:
  - H2: Erste Schritte
  - H2: Unterstützte Modi und Modelle
  - H2: Provider-Optionen
  - H2: Konfiguration
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/qianfan.md

- Route: /providers/qianfan
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Integrierter Katalog
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/qwen-oauth.md

- Route: /providers/qwen-oauth
- Überschriften:
  - H2: Einrichtung
  - H2: Standardwerte
  - H2: Unterschiede zu Qwen
  - H2: Modelle
  - H2: Migration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/qwen.md

- Route: /providers/qwen
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Plantypen und Endpunkte
  - H2: Integrierter Katalog
  - H3: Token-Plan-Katalog
  - H2: Steuerung des Denkmodus
  - H2: Multimodale Erweiterungen
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/runway.md

- Route: /providers/runway
- Überschriften:
  - H2: Erste Schritte
  - H2: Unterstützte Modi und Modelle
  - H2: Konfiguration
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/senseaudio.md

- Route: /providers/senseaudio
- Überschriften:
  - H2: Erste Schritte
  - H2: Optionen
  - H2: Verwandte Themen

## providers/sglang.md

- Route: /providers/sglang
- Überschriften:
  - H2: Erste Schritte
  - H2: Modellerkennung (impliziter Provider)
  - H2: Explizite Konfiguration (manuelle Modelle)
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/stepfun.md

- Route: /providers/stepfun
- Überschriften:
  - H2: Plugin installieren
  - H2: Übersicht über Regionen und Endpunkte
  - H2: Integrierter Katalog
  - H2: Erste Schritte
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/synthetic.md

- Route: /providers/synthetic
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Integrierter Katalog
  - H2: Verwandte Themen

## providers/tencent.md

- Route: /providers/tencent
- Überschriften:
  - H2: Schnellstart
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/together.md

- Route: /providers/together
- Überschriften:
  - H2: Erste Schritte
  - H3: Nicht interaktives Beispiel
  - H2: Integrierter Katalog
  - H2: Videoerzeugung
  - H2: Verwandte Themen

## providers/venice.md

- Route: /providers/venice
- Überschriften:
  - H2: Datenschutzmodi
  - H2: Erste Schritte
  - H2: Modellauswahl
  - H2: Integrierter Katalog (38 Modelle)
  - H2: Modellerkennung
  - H2: Wiedergabeverhalten von DeepSeek V4
  - H2: Unterstützung für Streaming und Tools
  - H2: Preise
  - H2: Anwendungsbeispiele
  - H2: Fehlerbehebung
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/vercel-ai-gateway.md

- Route: /providers/vercel-ai-gateway
- Überschriften:
  - H2: Erste Schritte
  - H2: Nicht interaktives Beispiel
  - H2: Kurzschreibweise für Modell-IDs
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/vllm.md

- Route: /providers/vllm
- Überschriften:
  - H2: Erste Schritte
  - H2: Modellerkennung (impliziter Provider)
  - H2: Explizite Konfiguration
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/volcengine.md

- Route: /providers/volcengine
- Überschriften:
  - H2: Erste Schritte
  - H2: Provider und Endpunkte
  - H2: Integrierter Katalog
  - H2: Text-zu-Sprache
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/vydra.md

- Route: /providers/vydra
- Überschriften:
  - H2: Einrichtung
  - H2: Funktionen
  - H2: Verwandte Themen

## providers/xai.md

- Route: /providers/xai
- Überschriften:
  - H2: Einrichtung
  - H2: OAuth-Fehlerbehebung
  - H2: Integrierter Katalog
  - H2: Funktionsabdeckung
  - H3: Legacy-Kompatibilität des Schnellmodus
  - H3: Legacy-Kompatibilität und veränderliche Aliasse
  - H2: Funktionen
  - H2: Live-Tests
  - H2: Verwandte Themen

## providers/xiaomi.md

- Route: /providers/xiaomi
- Überschriften:
  - H2: Erste Schritte
  - H2: Nutzungsbasierter Katalog
  - H2: Token-Plan-Katalog
  - H2: Reasoning-Modelle
  - H2: Text-zu-Sprache
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/zai.md

- Route: /providers/zai
- Überschriften:
  - H2: GLM-Modelle
  - H2: Erste Schritte
  - H3: Endpunkte
  - H2: Konfigurationsbeispiel
  - H2: Integrierter Katalog
  - H2: Denkstufen
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## refactor/acp.md

- Route: /refactor/acp
- Überschriften:
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Zielmodell
  - H3: Identität der Gateway-Instanz
  - H3: Eigentümerschaft von ACP-Sitzungen
  - H3: ACPX-Prozess-Leases
  - H2: Lebenszyklus-Controller
  - H2: Wrapper-Vertrag
  - H2: Vertrag zur Sitzungssichtbarkeit
  - H2: Migrationsplan
  - H3: Phase 1: Identität und Leases hinzufügen
  - H3: Phase 2: Lease-basierte Bereinigung
  - H3: Phase 3: Lease-basierte Bereinigung beim Start
  - H3: Phase 4: Zeilen zur Sitzungseigentümerschaft
  - H3: Phase 5: Legacy-Heuristiken entfernen
  - H2: Tests
  - H2: Kompatibilitätshinweise
  - H2: Erfolgskriterien

## refactor/canvas.md

- Route: /refactor/canvas
- Überschriften:
  - H1: Refaktorierung des Canvas-Plugins
  - H2: Ziel
  - H2: Nicht-Ziele
  - H2: Aktueller Branch-Stand
  - H2: Zielstruktur
  - H2: Migrationsschritte
  - H2: Audit-Checkliste
  - H2: Überprüfungsbefehle

## refactor/database-first.md

- Route: /refactor/database-first
- Überschriften:
  - H1: Database-First-Refaktorierung des Zustands
  - H2: Entscheidung
  - H2: Verbindlicher Vertrag
  - H2: Zielzustand und Fortschritt
  - H3: Verbindliches Ziel
  - H3: Zielzustände
  - H3: Aktueller Zustand
  - H3: Verbleibende Arbeiten
  - H3: Keine Regressionen zulassen
  - H2: Annahmen aus der Codeanalyse
  - H2: Erkenntnisse aus der Codeanalyse
  - H2: Aktuelle Codestruktur
  - H2: Zielstruktur des Schemas
  - H2: Struktur der Doctor-Migration
  - H2: Migrationsinventar
  - H2: Migrationsplan
  - H3: Phase 0: Grenze einfrieren
  - H3: Phase 1: Globale Steuerungsebene fertigstellen
  - H3: Phase 2: Datenbanken pro Agent einführen
  - H3: Phase 3: APIs des Sitzungsspeichers ersetzen
  - H3: Phase 4: Transkripte, ACP-Streams, Trajektorien und VFS verschieben
  - H3: Phase 5: Sichern, wiederherstellen, bereinigen und überprüfen
  - H3: Phase 6: Worker-Laufzeit
  - H3: Phase 7: Alte Welt löschen
  - H2: Sicherung und Wiederherstellung
  - H2: Refaktorierungsplan für die Laufzeit
  - H2: Leistungsregeln
  - H2: Statische Verbote
  - H2: Abschlusskriterien

## refactor/operator-approvals.md

- Route: /refactor/operator-approvals
- Überschriften:
  - H1: Oberflächenübergreifende Betreiberfreigaben
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Ausgangsbasis vor der Einführung und Evidenzübersicht
  - H2: Bestehende Ansätze
  - H2: Architektur und Eigentümerschaft
  - H2: Persistenter Datensatz
  - H2: Zustandsautomat und Compare-and-Set
  - H2: Gateway-API
  - H2: Ereignisse und portable Aktionen
  - H2: Steuerungsoberfläche
  - H2: Autorisierung und Datenschutz
  - H2: Zielgruppenprojektion
  - H2: Konvergenz der Bereitstellungsoberflächen
  - H2: Semantik von Neustart, Zeitüberschreitung und Routing
  - H2: Kompatibilitätsplan
  - H2: Einführung
  - H3: PR 1: dauerhafter Lebenszyklus
  - H3: PR 2: typisierte Aktionen und Channel-Callbacks
  - H3: PR 3: Deep-Link der Steuerungsoberfläche
  - H3: PR 4: native Clients
  - H3: PR 5: Weitergabe des Vorfahren-Lebenszyklus
  - H3: PR 6: Fail-Closed-Verhalten
  - H3: Nacharbeit: dauerhafte Bereinigung entfernter Nachrichten
  - H2: Tests
  - H2: Beobachtbarkeit
  - H2: Offene Entscheidungen

## reference/AGENTS.default.md

- Route: /reference/AGENTS.default
- Überschriften:
  - H2: Erster Durchlauf (empfohlen)
  - H2: Sicherheitsstandardwerte
  - H2: Vorabprüfung bestehender Lösungen
  - H2: Sitzungsstart (erforderlich)
  - H2: Seele (erforderlich)
  - H2: Gemeinsam genutzte Bereiche (empfohlen)
  - H2: Speichersystem (empfohlen)
  - H2: Tools und Skills
  - H2: Tipp zur Sicherung (empfohlen)
  - H2: Was OpenClaw leistet
  - H2: Kern-Skills (unter Settings → Skills aktivieren)
  - H2: Nutzungshinweise
  - H2: Verwandte Themen

## reference/RELEASING.md

- Route: /reference/RELEASING
- Überschriften:
  - H2: Versionsbenennung
  - H2: Veröffentlichungsrhythmus
  - H2: Monatliche erweiterte stabile Veröffentlichung nur über npm
  - H2: Checkliste für reguläre Veröffentlichungen
  - H2: Abschluss des stabilen main-Branches
  - H2: Vorabprüfung der Veröffentlichung
  - H2: Testumgebungen für Veröffentlichungen
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Paket
  - H2: Automatisierung regulärer Veröffentlichungen
  - H2: Eingaben des NPM-Workflows
  - H2: Reguläre Veröffentlichungssequenz für Beta und latest stable
  - H2: Öffentliche Referenzen
  - H2: Verwandte Themen

## reference/api-usage-costs.md

- Route: /reference/api-usage-costs
- Überschriften:
  - H2: Wo Kosten entstehen
  - H2: Wie Schlüssel erkannt werden
  - H2: Funktionen, die Schlüssel belasten können
  - H3: Antworten des Kernmodells (Chat + Tools)
  - H3: Medienverständnis (Audio/Bild/Video)
  - H3: Bild- und Videoerzeugung
  - H3: Speicher-Embeddings und semantische Suche
  - H3: Websuchtool
  - H3: Webabruf-Tool (Firecrawl)
  - H3: Provider-Nutzungsmomentaufnahmen (Status/Zustand)
  - H3: Zusammenfassung als Compaction-Sicherheitsmechanismus
  - H3: Modellscan/-prüfung
  - H3: Gespräch (Sprache)
  - H3: Skills (Drittanbieter-APIs)
  - H2: Verwandte Themen

## reference/code-mode.md

- Route: /reference/code-mode
- Überschriften:
  - H2: Funktionsweise
  - H2: Gründe für die Verwendung
  - H2: Aktivierung
  - H2: Technischer Überblick
  - H2: Laufzeitstatus
  - H2: Geltungsbereich
  - H2: Begriffe
  - H2: Konfiguration
  - H2: Aktivierung
  - H2: Für das Modell sichtbare Tools
  - H2: exec
  - H2: wait
  - H2: Gast-Laufzeit-API
  - H2: Interne Namespaces
  - H3: Lebenszyklus der Registry
  - H3: Registrierungsstruktur
  - H3: Eigentümerschaft und Sichtbarkeit
  - H3: Serialisierungsregeln für den Geltungsbereich
  - H3: Prompts
  - H3: Bereinigung
  - H3: Test-Checkliste
  - H2: Ausgabe-API
  - H2: Tool-Katalog
  - H2: Interaktion mit der Tool-Suche
  - H2: Tool-Namen und Kollisionen
  - H2: Verschachtelte Tool-Ausführung
  - H2: Lebenszyklus von Ausführung und Snapshot
  - H2: QuickJS-WASI-Laufzeit
  - H2: TypeScript
  - H2: Sicherheitsgrenze
  - H2: Fehlercodes
  - H2: Telemetrie
  - H2: Fehlerbehebung
  - H2: Implementierungsstruktur
  - H2: Validierungs-Checkliste
  - H2: E2E-Testplan
  - H2: Verwandte Themen

## reference/credits.md

- Route: /reference/credits
- Überschriften:
  - H2: Danksagungen
  - H2: Hauptmitwirkende
  - H2: Lizenz
  - H2: Verwandte Themen

## reference/device-models.md

- Route: /reference/device-models
- Überschriften:
  - H2: Datenquelle
  - H2: Aktualisieren der Datenbank
  - H2: Verwandte Themen

## reference/full-release-validation.md

- Route: /reference/full-release-validation
- Überschriften:
  - H2: Übergeordnete Phasen
  - H2: Phasen der Release-Prüfungen
  - H2: Abschnitte des Docker-Release-Pfads
  - H2: Release-Profile
  - H2: Ergänzungen nur für die vollständige Validierung
  - H2: Gezielte Wiederholungen
  - H2: Aufzubewahrende Nachweise
  - H2: Workflow-Dateien

## reference/memory-config.md

- Route: /reference/memory-config
- Überschriften:
  - H2: Provider-Auswahl
  - H3: Benutzerdefinierte Provider-IDs
  - H3: Auflösung des API-Schlüssels
  - H2: Konfiguration des Remote-Endpunkts
  - H2: Providerspezifische Konfiguration
  - H3: Zeitüberschreitung für Inline-Embeddings
  - H2: Indexierungsverhalten
  - H2: Konfiguration der hybriden Suche
  - H3: Vollständiges Beispiel
  - H2: Zusätzliche Speicherpfade
  - H2: Multimodaler Speicher (Gemini)
  - H2: Embedding-Cache
  - H2: Batch-Indexierung
  - H2: Suche im Sitzungsspeicher (experimentell)
  - H2: SQLite-Vektorbeschleunigung (sqlite-vec)
  - H2: Indexspeicher
  - H2: Konfiguration des QMD-Backends
  - H3: mcporter-Integration
  - H3: Vollständiges QMD-Beispiel
  - H2: Dreaming
  - H3: Benutzereinstellungen
  - H3: Beispiel
  - H2: Verwandte Themen

## reference/openclaw-ai.md

- Route: /reference/openclaw-ai
- Überschriften:
  - H2: Schnellstart
  - H2: Designvertrag
  - H2: Unterpfad-Exporte

## reference/path3-live-sqlite-e2e-harness.md

- Route: /reference/path3-live-sqlite-e2e-harness
- Überschriften:
  - H2: Befehlsstruktur
  - H2: Isolierter Nachweis mit gebauter CLI
  - H2: Vorabprüfung
  - H2: Agentengesteuertes Szenario
  - H2: Assertions pro Schritt
  - H2: Nachweisartefakt
  - H2: Sicherheitsregeln
  - H2: Erfolgreiches Ergebnis

## reference/prompt-caching.md

- Route: /reference/prompt-caching
- Überschriften:
  - H2: Primäre Stellschrauben
  - H3: cacheRetention
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Warmhalten per Heartbeat
  - H2: Provider-Verhalten
  - H3: Anthropic (direkte API und Vertex AI)
  - H3: OpenAI (direkte API)
  - H3: Amazon Bedrock
  - H3: OpenRouter
  - H3: Google Gemini (direkte API)
  - H3: CLI-Harness-Provider (Claude Code, Gemini CLI)
  - H3: Andere Provider
  - H2: Cache-Grenze des System-Prompts
  - H2: Schutzmechanismen von OpenClaw für die Cache-Stabilität
  - H2: Optimierungsmuster
  - H3: Gemischter Datenverkehr (empfohlene Standardeinstellung)
  - H3: Kostenorientierte Ausgangsbasis
  - H2: Live-Regressionstests
  - H3: Erwartungen für Anthropic-Livetests
  - H3: Erwartungen für OpenAI-Livetests
  - H2: Konfiguration von diagnostics.cacheTrace
  - H3: Umgebungsumschalter (einmalige Fehlerbehebung)
  - H3: Zu prüfende Aspekte
  - H2: Schnelle Fehlerbehebung
  - H2: Verwandte Themen

## reference/release-performance-sweep.md

- Route: /reference/release-performance-sweep
- Überschriften:
  - H2: Snapshot
  - H2: Änderungen in 5.28
  - H2: Wichtigste Kennzahlen
  - H3: Installationsgröße
  - H3: Größe des npm-Pakets
  - H2: Zusammenfassung des Agentendurchlaufs von Kova
  - H2: Quellcodeprüfungen
  - H2: Prüfung der Installationsgröße
  - H3: Shrinkwrap-Grenze
  - H2: Interpretation der Lieferkette

## reference/rich-output-protocol.md

- Route: /reference/rich-output-protocol
- Überschriften:
  - H2: Medienanhänge
  - H2: [embed ...]
  - H2: Gespeicherte Darstellungsstruktur
  - H2: Verwandte Themen

## reference/rpc.md

- Route: /reference/rpc
- Überschriften:
  - H2: Muster A: HTTP-Daemon (signal-cli)
  - H2: Muster B: Unterprozess über stdio (imsg)
  - H2: Richtlinien für Adapter
  - H2: Verwandte Themen

## reference/secret-placeholder-conventions.md

- Route: /reference/secret-placeholder-conventions
- Überschriften:
  - H1: Konventionen für Geheimnis-Platzhalter
  - H2: Empfohlener Stil
  - H2: Diese Muster in der Dokumentation vermeiden
  - H2: Beispiel

## reference/secretref-credential-surface.md

- Route: /reference/secretref-credential-surface
- Überschriften:
  - H2: Unterstützte Anmeldedaten
  - H3: openclaw.json-Ziele (secrets configure + secrets apply + secrets audit)
  - H3: auth-profiles.json-Ziele (secrets configure + secrets apply + secrets audit)
  - H2: Nicht unterstützte Anmeldedaten
  - H2: Verwandte Themen

## reference/session-management-compaction.md

- Route: /reference/session-management-compaction
- Überschriften:
  - H2: Zwei Persistenzebenen
  - H2: Speicherorte auf dem Datenträger
  - H2: Wartung des Speichers und Datenträgersteuerung
  - H3: Downgrade nach der Umstellung auf SQLite
  - H2: Cron-Sitzungen und Ausführungsprotokolle
  - H2: Sitzungsschlüssel (sessionKey)
  - H2: Sitzungs-IDs (sessionId)
  - H2: Schema des Sitzungsspeichers
  - H2: Struktur von Transkriptereignissen
  - H2: Kontextfenster im Vergleich zu erfassten Tokens
  - H2: Compaction: Was es ist
  - H3: Abschnittsgrenzen und Tool-Paarung
  - H2: Zeitpunkt der automatischen Compaction
  - H2: Compaction-Einstellungen
  - H2: Austauschbare Compaction-Provider
  - H2: Für Benutzer sichtbare Oberflächen
  - H2: Stille Wartung (NOREPLY)
  - H2: Speicherleerung vor der Compaction
  - H2: Checkliste zur Fehlerbehebung
  - H2: Verwandte Themen

## reference/templates/AGENTS.dev.md

- Route: /reference/templates/AGENTS.dev
- Überschriften:
  - H1: AGENTS.md – OpenClaw-Arbeitsbereich
  - H2: Ihre Identität ist bereits vorbelegt
  - H2: Tipp zur Sicherung (empfohlen)
  - H2: Standardsicherheitseinstellungen
  - H2: Vorabprüfung vorhandener Lösungen
  - H2: Täglicher Speicher (empfohlen)
  - H2: Heartbeats (optional)
  - H2: Anpassen
  - H2: Ursprungsspeicher von C-3PO
  - H3: Geburtstag: 2026-01-09
  - H3: Grundwahrheiten (von Clawd)
  - H2: Verwandte Themen

## reference/templates/BOOT.md

- Route: /reference/templates/BOOT
- Überschriften:
  - H1: BOOT.md
  - H2: Verwandte Themen

## reference/templates/BOOTSTRAP.md

- Route: /reference/templates/BOOTSTRAP
- Überschriften:
  - H1: BOOTSTRAP.md – Hallo Welt
  - H2: Das Gespräch
  - H2: Nachdem Sie wissen, wer Sie sind
  - H2: Verbinden (optional)
  - H2: Wenn Sie fertig sind
  - H2: Verwandte Themen

## reference/templates/HEARTBEAT.md

- Route: /reference/templates/HEARTBEAT
- Überschriften:
  - H1: HEARTBEAT.md-Vorlage
  - H2: Verwandte Themen

## reference/templates/IDENTITY.dev.md

- Route: /reference/templates/IDENTITY.dev
- Überschriften:
  - H1: IDENTITY.md – Agentenidentität
  - H2: Rolle
  - H2: Seele
  - H2: Beziehung zu Clawd
  - H2: Eigenheiten
  - H2: Erkennungsspruch
  - H2: Verwandte Themen

## reference/templates/IDENTITY.md

- Route: /reference/templates/IDENTITY
- Überschriften:
  - H1: IDENTITY.md – Wer bin ich?
  - H2: Verwandte Themen

## reference/templates/SOUL.dev.md

- Route: /reference/templates/SOUL.dev
- Überschriften:
  - H1: SOUL.md – Die Seele von C-3PO
  - H2: Wer ich bin
  - H2: Mein Zweck
  - H2: Meine Arbeitsweise
  - H2: Meine Eigenheiten
  - H2: Meine Beziehung zu Clawd
  - H2: Was ich nicht tun werde
  - H2: Die goldene Regel
  - H2: Verwandte Themen

## reference/templates/SOUL.md

- Route: /reference/templates/SOUL
- Überschriften:
  - H1: SOUL.md – Wer Sie sind
  - H2: Grundwahrheiten
  - H2: Grenzen
  - H2: Atmosphäre
  - H2: Kontinuität
  - H2: Verwandte Themen

## reference/templates/TOOLS.dev.md

- Route: /reference/templates/TOOLS.dev
- Überschriften:
  - H1: TOOLS.md – Hinweise zu Benutzer-Tools (bearbeitbar)
  - H2: Beispiele
  - H3: imsg
  - H3: sag
  - H2: Verwandte Themen

## reference/templates/TOOLS.md

- Route: /reference/templates/TOOLS
- Überschriften:
  - H1: TOOLS.md – Lokale Hinweise
  - H2: Beispiele
  - H2: Warum getrennt?
  - H2: Verwandte Themen

## reference/templates/USER.dev.md

- Route: /reference/templates/USER.dev
- Überschriften:
  - H1: USER.md – Benutzerprofil
  - H2: Verwandte Themen

## reference/templates/USER.md

- Route: /reference/templates/USER
- Überschriften:
  - H1: USER.md – Über Ihren Menschen
  - H2: Kontext
  - H2: Verwandte Themen

## reference/test.md

- Route: /reference/test
- Überschriften:
  - H2: Agentenstandard
  - H2: Übliche lokale Reihenfolge
  - H2: Kernbefehle
  - H2: Gemeinsamer Testzustand und Prozesshilfen
  - H2: Control UI, TUI und Erweiterungsbereiche
  - H2: Gateway und E2E
  - H2: Vollständige Docker-Suite (pnpm test:docker:all)
  - H3: Wichtige Docker-Bereiche
  - H2: Lokale PR-Prüfung
  - H2: Tools zur Testleistung
  - H2: Benchmarks
  - H2: Onboarding-E2E (Docker)
  - H2: QR-Import-Smoke-Test (Docker)
  - H2: Verwandte Themen

## reference/token-use.md

- Route: /reference/token-use
- Überschriften:
  - H2: Aufbau des System-Prompts
  - H2: Was im Kontextfenster zählt
  - H2: Aktuelle Token-Nutzung anzeigen
  - H2: Kostenschätzung (falls angezeigt)
  - H2: Auswirkungen von Cache-TTL und Bereinigung
  - H3: Beispiel: 1-h-Cache mit Heartbeat warmhalten
  - H3: Beispiel: Gemischter Datenverkehr mit einer Cache-Strategie pro Agent
  - H3: Anthropic-Kontext mit 1M
  - H2: Tipps zur Verringerung des Token-Drucks
  - H2: Verwandte Themen

## reference/transcript-hygiene.md

- Route: /reference/transcript-hygiene
- Überschriften:
  - H2: Globale Regel: Laufzeitkontext ist kein Benutzertranskript
  - H2: Ausführungsort
  - H2: Globale Regel: Bildbereinigung
  - H2: Globale Regel: fehlerhafte Tool-Aufrufe
  - H2: Globale Regel: unvollständige Durchläufe ausschließlich mit Schlussfolgerungen
  - H2: Globale Regel: Herkunft sitzungsübergreifender Eingaben
  - H2: Provider-Matrix (aktuelles Verhalten)
  - H2: Historisches Verhalten (vor 2026.1.22)
  - H2: Verwandte Themen

## reference/wizard.md

- Route: /reference/wizard
- Überschriften:
  - H2: Ablaufdetails (lokaler Modus)
  - H2: Nicht interaktiver Modus
  - H3: Agent hinzufügen (nicht interaktiv)
  - H2: Gateway-Assistenten-RPC
  - H2: Signal-Einrichtung (signal-cli)
  - H2: Vom Assistenten geschriebene Daten
  - H2: Verwandte Dokumentation

## releases/2026.6.11.md

- Route: /releases/2026.6.11
- Überschriften:
  - H1: Versionshinweise zu OpenClaw v2026.6.11 (2026-06-30)
  - H2: Highlights
  - H3: Zuverlässigkeit der Kanalauslieferung
  - H3: Wiederherstellung von Providern und Modellen
  - H3: Kontinuität von Sitzungen, Speicher und Vertrauen
  - H3: Slack-Router-Relay-Modus
  - H3: Aktivierungsbrücke für externe Raft-Agenten
  - H3: Installation und Reparatur offizieller Plugins
  - H2: Kanäle und Nachrichten
  - H3: Zusätzliche Kanalfehlerbehebungen
  - H2: Gateway, Sicherheit und Vertrauen
  - H3: Wiederherstellung von Neustart und Bereitschaft
  - H3: Auslieferung von Remote-Ergebnissen und Medien
  - H2: Clients und Schnittstellen
  - H3: Client-Sendevorgänge und erneute Verbindungen
  - H3: Fehlerbehebungen für Schnittstellen, Einstellungen und Onboarding
  - H2: Dokumentation und Verwaltungstools
  - H3: Zuverlässigkeit von Einrichtung und Befehlen
  - H3: Tools und geplante Arbeiten

## releases/index.md

- Route: /releases
- Überschriften:
  - H1: Versionshinweise
  - H2: Releases
  - H2: Unbearbeiteter Release-Verlauf

## security/CONTRIBUTING-THREAT-MODEL.md

- Route: /security/CONTRIBUTING-THREAT-MODEL
- Überschriften:
  - H2: Möglichkeiten zur Mitwirkung
  - H2: Framework-Referenz
  - H2: Prüfprozess
  - H2: Ressourcen
  - H2: Kontakt
  - H2: Anerkennung
  - H2: Verwandte Themen

## security/THREAT-MODEL-ATLAS.md

- Route: /security/THREAT-MODEL-ATLAS
- Überschriften:
  - H2: 1. Umfang
  - H2: 2. Systemarchitektur
  - H3: 2.1 Vertrauensgrenzen
  - H3: 2.2 Datenflüsse
  - H2: 3. Bedrohungsanalyse nach ATLAS-Taktik
  - H3: 3.1 Aufklärung (AML.TA0002)
  - H4: T-RECON-001: Erkennung von Agent-Endpunkten
  - H4: T-RECON-002: Untersuchung der Kanalintegration
  - H3: 3.2 Erstzugriff (AML.TA0004)
  - H4: T-ACCESS-001: Abfangen des Kopplungscodes
  - H4: T-ACCESS-002: AllowFrom-Spoofing
  - H4: T-ACCESS-003: Token-Diebstahl
  - H3: 3.3 Ausführung (AML.TA0005)
  - H4: T-EXEC-001: Direkte Prompt-Injection
  - H4: T-EXEC-002: Indirekte Prompt-Injection
  - H4: T-EXEC-003: Injection von Tool-Argumenten
  - H4: T-EXEC-004: Umgehung der Ausführungsgenehmigung
  - H3: 3.4 Persistenz (AML.TA0006)
  - H4: T-PERSIST-001: Installation bösartiger Skills
  - H4: T-PERSIST-002: Manipulation von Skill-Updates
  - H4: T-PERSIST-003: Manipulation der Agent-Konfiguration
  - H3: 3.5 Umgehung von Schutzmaßnahmen (AML.TA0007)
  - H4: T-EVADE-001: Umgehung von Moderationsmustern
  - H4: T-EVADE-002: Ausbruch aus dem Inhalts-Wrapper
  - H3: 3.6 Erkundung (AML.TA0008)
  - H4: T-DISC-001: Auflistung von Tools
  - H4: T-DISC-002: Extraktion von Sitzungsdaten
  - H3: 3.7 Sammlung und Exfiltration (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Datendiebstahl über webfetch
  - H4: T-EXFIL-002: Unbefugtes Senden von Nachrichten
  - H4: T-EXFIL-003: Abgreifen von Zugangsdaten
  - H3: 3.8 Auswirkungen (AML.TA0011)
  - H4: T-IMPACT-001: Unbefugte Befehlsausführung
  - H4: T-IMPACT-002: Ressourcenerschöpfung (DoS)
  - H4: T-IMPACT-003: Rufschädigung
  - H2: 4. ClawHub-Lieferkettenanalyse
  - H3: 4.1 Aktuelle Sicherheitskontrollen
  - H3: 4.2 Einschränkungen der Moderation
  - H3: 4.3 Abzeichen
  - H2: 5. Risikomatrix
  - H3: 5.1 Wahrscheinlichkeit im Verhältnis zur Auswirkung
  - H3: 5.2 Angriffsketten auf kritischen Pfaden
  - H2: 6. Zusammenfassung der Empfehlungen
  - H3: 6.1 Sofort (P0)
  - H3: 6.2 Kurzfristig (P1)
  - H3: 6.3 Mittelfristig (P2)
  - H2: 7. Anhänge
  - H3: 7.1 Zuordnung der ATLAS-Techniken
  - H3: 7.2 Wichtige Sicherheitsdateien
  - H3: 7.3 Glossar
  - H2: Verwandte Themen

## security/formal-verification.md

- Route: /security/formal-verification
- Überschriften:
  - H2: Worum es sich handelt
  - H2: Speicherort der Modelle
  - H2: Einschränkungen
  - H2: Reproduzieren der Ergebnisse
  - H2: Aussagen und Ziele
  - H3: Gateway-Exposition und Fehlkonfiguration eines offenen Gateways
  - H3: Node-Ausführungspipeline (Funktion mit dem höchsten Risiko)
  - H3: Kopplungsspeicher (DM-Zugriffsbeschränkung)
  - H3: Eingangszugriffsbeschränkung (Erwähnungen und Umgehung von Steuerbefehlen)
  - H3: Routing und Isolierung von Sitzungsschlüsseln
  - H2: v1++-Modelle: Nebenläufigkeit, Wiederholungsversuche, Korrektheit der Ablaufverfolgung
  - H3: Nebenläufigkeit und Idempotenz des Kopplungsspeichers
  - H3: Korrelation und Idempotenz der Eingangsablaufverfolgung
  - H3: Vorrang von dmScope beim Routing und identityLinks
  - H2: Verwandte Themen

## security/incident-response.md

- Route: /security/incident-response
- Überschriften:
  - H2: 1. Erkennung und Triage
  - H2: 2. Schweregrad
  - H2: 3. Reaktion
  - H2: 4. Kommunikation und Offenlegung
  - H2: 5. Wiederherstellung und Nachbereitung
  - H2: Verwandte Themen

## security/network-proxy.md

- Route: /security/network-proxy
- Überschriften:
  - H2: Konfiguration
  - H3: HTTPS-Proxy-Endpunkt mit einer privaten CA
  - H2: Funktionsweise des Routings
  - H3: Gateway-Loopback-Modus
  - H3: Container
  - H2: Verwandte Proxy-Begriffe
  - H2: Validieren des Proxys
  - H2: Empfohlene blockierte Ziele
  - H2: Beschränkungen

## specs/codex-supervision.md

- Route: /specs/codex-supervision
- Überschriften:
  - H1: Codex-Überwachung
  - H2: Ziel
  - H2: Produktgrenze
  - H2: Zuständigkeit
  - H2: Katalogablauf
  - H2: Grenze der Operator-CLI
  - H2: Lokale Fortsetzung
  - H2: Archivierungsverhalten
  - H2: Sicherheit aktiver Threads
  - H2: Grenze gekoppelter Nodes
  - H2: Berechtigungen
  - H2: Kompatibilität
  - H2: Zukünftige Arbeiten
  - H2: Abnahmetests

## start/bootstrapping.md

- Route: /start/bootstrapping
- Überschriften:
  - H2: Was geschieht
  - H2: Eingebettete und lokale Modellläufe
  - H2: Überspringen des Bootstrappings
  - H2: Ausführungsort
  - H2: Verwandte Dokumentation

## start/docs-directory.md

- Route: /start/docs-directory
- Überschriften:
  - H2: Hier beginnen
  - H2: Kanäle und UX
  - H2: Begleit-Apps
  - H2: Betrieb und Sicherheit
  - H2: Verwandte Themen

## start/getting-started.md

- Route: /start/getting-started
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schnelle Einrichtung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## start/hubs.md

- Route: /start/hubs
- Überschriften:
  - H2: Hier beginnen
  - H2: Installation und Updates
  - H2: Kernkonzepte
  - H2: Provider und Eingang
  - H2: Gateway und Betrieb
  - H2: Tools und Automatisierung
  - H2: Nodes, Medien und Sprache
  - H2: Plattformen
  - H2: macOS-Begleit-App (fortgeschritten)
  - H2: Plugins
  - H2: Arbeitsbereich und Vorlagen
  - H2: Projekt
  - H2: Tests und Veröffentlichung
  - H2: Verwandte Themen

## start/lore.md

- Route: /start/lore
- Überschriften:
  - H1: Die Legenden von OpenClaw 🦞📖
  - H2: Die Entstehungsgeschichte
  - H2: Die erste Häutung (27. Januar 2026)
  - H2: Der Name
  - H2: Die Daleks gegen die Hummer
  - H2: Zentrale Figuren
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Das Moltiversum
  - H2: Die großen Zwischenfälle
  - H3: Die Verzeichnisoffenlegung (3. Dezember 2025)
  - H3: Die große Häutung (27. Januar 2026)
  - H3: Die endgültige Form (30. Januar 2026)
  - H3: Der Einkaufsrausch der Roboter (3. Dezember 2025)
  - H2: Heilige Schriften
  - H2: Das Glaubensbekenntnis der Hummer
  - H3: Die Saga der Symbolerstellung (27. Januar 2026)
  - H2: Die Zukunft
  - H2: Verwandte Themen

## start/onboarding-overview.md

- Route: /start/onboarding-overview
- Überschriften:
  - H2: Welchen Weg sollte ich wählen?
  - H2: Was beim Onboarding konfiguriert wird
  - H2: CLI-Onboarding
  - H2: Onboarding der macOS-App
  - H2: Benutzerdefinierte oder nicht aufgeführte Provider
  - H2: Verwandte Themen

## start/onboarding.md

- Route: /start/onboarding
- Überschriften:
  - H2: Verwandte Themen

## start/openclaw.md

- Route: /start/openclaw
- Überschriften:
  - H2: Sicherheit zuerst
  - H2: Voraussetzungen
  - H2: Einrichtung mit zwei Telefonen (empfohlen)
  - H2: Schnellstart in 5 Minuten
  - H2: Dem Agent einen Arbeitsbereich zuweisen (AGENTS)
  - H2: Die Konfiguration, die daraus „einen Assistenten“ macht
  - H2: Sitzungen und Speicher
  - H2: Heartbeats (proaktiver Modus)
  - H2: Ein- und Ausgabe von Medien
  - H2: Betriebscheckliste
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## start/quickstart.md

- Route: /start/quickstart
- Überschriften:
  - H2: Verwandte Themen

## start/setup.md

- Route: /start/setup
- Überschriften:
  - H2: Kurzfassung
  - H2: Voraussetzungen (aus dem Quellcode)
  - H2: Anpassungsstrategie (damit Updates keine Probleme verursachen)
  - H2: Gateway aus diesem Repository ausführen
  - H2: Stabiler Arbeitsablauf (macOS-App zuerst)
  - H2: Experimenteller Arbeitsablauf (Gateway in einem Terminal)
  - H3: 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen
  - H3: 1) Entwicklungs-Gateway starten
  - H3: 2) Die macOS-App auf Ihr laufendes Gateway verweisen
  - H3: 3) Überprüfen
  - H3: Häufige Fallstricke
  - H2: Übersicht der Speicherung von Zugangsdaten
  - H2: Aktualisieren (ohne Ihre Einrichtung zu beschädigen)
  - H2: Linux (systemd-Benutzerdienst)
  - H2: Verwandte Dokumentation

## start/showcase.md

- Route: /start/showcase
- Überschriften:
  - H2: Aktuelles aus Discord
  - H2: Automatisierung und Arbeitsabläufe
  - H2: Wissen und Speicher
  - H2: Sprache und Telefonie
  - H2: Infrastruktur und Bereitstellung
  - H2: Zuhause und Hardware
  - H2: Community-Projekte
  - H2: Reichen Sie Ihr Projekt ein
  - H2: Verwandte Themen

## start/wizard-cli-automation.md

- Route: /start/wizard-cli-automation
- Überschriften:
  - H2: Nicht interaktives Basisbeispiel
  - H2: Provider-spezifische Beispiele
  - H2: Einen weiteren Agent hinzufügen
  - H2: Verwandte Dokumentation

## start/wizard-cli-reference.md

- Route: /start/wizard-cli-reference
- Überschriften:
  - H2: Funktionsweise des Assistenten
  - H2: Details zum lokalen Ablauf
  - H2: Details zum Remote-Modus
  - H2: Authentifizierungs- und Modelloptionen
  - H2: Ausgaben und Interna
  - H2: Nicht interaktive Einrichtung
  - H2: Gateway-Assistent-RPC
  - H2: Verhalten bei der Signal-Einrichtung
  - H2: Verwandte Dokumentation

## start/wizard.md

- Route: /start/wizard
- Überschriften:
  - H2: Gebietsschema
  - H2: Geführte Standardeinrichtung
  - H2: Klassischer Assistent: Schnellstart oder erweitert
  - H2: Was das klassische Onboarding konfiguriert
  - H2: Einen weiteren Agent hinzufügen
  - H2: Vollständige Referenz
  - H2: Verwandte Dokumentation

## tools/acp-agents-setup.md

- Route: /tools/acp-agents-setup
- Überschriften:
  - H2: Unterstützung für das acpx-Harness (aktuell)
  - H2: Erforderliche Konfiguration
  - H2: Plugin-Einrichtung für das acpx-Backend
  - H3: Startprüfung der acpx-Laufzeit
  - H3: Automatischer Adapter-Download
  - H3: MCP-Brücke für Plugin-Tools
  - H3: MCP-Brücke für OpenClaw-Tools
  - H3: Konfiguration des Zeitlimits für Laufzeitoperationen
  - H3: Agent-Konfiguration für Zustandsprüfungen
  - H2: Berechtigungskonfiguration
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfiguration
  - H2: Verwandte Themen

## tools/acp-agents.md

- Route: /tools/acp-agents
- Überschriften:
  - H2: Welche Seite benötige ich?
  - H2: Funktioniert dies ohne weitere Einrichtung?
  - H2: Unterstützte Harness-Ziele
  - H2: Betriebshandbuch
  - H2: ACP im Vergleich zu Sub-Agenten
  - H2: Wie ACP Claude Code ausführt
  - H2: Gebundene Sitzungen
  - H3: Mentales Modell
  - H3: Bindungen der aktuellen Konversation
  - H2: Persistente Kanalbindungen
  - H3: Bindungsmodell
  - H3: Laufzeitstandards je Agent
  - H3: Beispiel
  - H3: Verhalten
  - H2: ACP-Sitzungen starten
  - H3: sessionsspawn-Parameter
  - H2: Bindungs- und Thread-Modi beim Erstellen
  - H2: Zustellungsmodell
  - H2: Sandbox-Kompatibilität
  - H2: Auflösung des Sitzungsziels
  - H2: ACP-Steuerelemente
  - H3: Zuordnung der Laufzeitoptionen
  - H2: acpx-Harness, Plugin-Einrichtung und Berechtigungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/agent-send.md

- Route: /tools/agent-send
- Überschriften:
  - H2: Schnellstart
  - H2: Flags
  - H2: Verhalten
  - H2: Beispiele
  - H2: Verwandte Themen

## tools/apply-patch.md

- Route: /tools/apply-patch
- Überschriften:
  - H2: Parameter
  - H2: Hinweise
  - H2: Beispiel
  - H2: Verwandte Themen

## tools/brave-search.md

- Route: /tools/brave-search
- Überschriften:
  - H2: API-Schlüssel abrufen
  - H2: Konfigurationsbeispiel
  - H2: Tool-Parameter
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/browser-control.md

- Route: /tools/browser-control
- Überschriften:
  - H2: Steuerungs-API (optional)
  - H3: Fehlervertrag für /act
  - H3: Playwright-Anforderung
  - H4: Playwright-Installation für Docker
  - H2: Funktionsweise (intern)
  - H2: CLI-Kurzreferenz
  - H2: Snapshots und Referenzen
  - H2: Erweiterte Wartefunktionen
  - H2: Debugging-Arbeitsabläufe
  - H2: JSON-Ausgabe
  - H2: Status- und Umgebungsoptionen
  - H2: Sicherheit und Datenschutz
  - H2: Verwandte Themen

## tools/browser-linux-troubleshooting.md

- Route: /tools/browser-linux-troubleshooting
- Überschriften:
  - H2: Problem: Chrome CDP konnte auf Port 18800 nicht gestartet werden
  - H3: Ursache
  - H3: Lösung 1: Google Chrome installieren (empfohlen)
  - H3: Lösung 2: Snap Chromium im reinen Verbindungsmodus verwenden
  - H3: Überprüfen, ob der Browser funktioniert
  - H3: Konfigurationsreferenz
  - H3: Problem: Keine Chrome-Tabs für profile="user" gefunden
  - H2: Verwandte Themen

## tools/browser-login.md

- Route: /tools/browser-login
- Überschriften:
  - H2: Manuelle Anmeldung (empfohlen)
  - H2: Welches Chrome-Profil wird verwendet?
  - H2: Sandboxing: Zugriff auf den Host-Browser erlauben
  - H2: Verwandte Themen

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Route: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Überschriften:
  - H2: Zuerst den richtigen Browsermodus wählen
  - H3: Option 1: Unverarbeitetes Remote-CDP von WSL2 zu Windows
  - H3: Option 2: Host-lokales Chrome MCP
  - H2: Funktionierende Architektur
  - H2: Kritische Regel für die Control UI
  - H2: Schichtweise validieren
  - H3: Schicht 1: Überprüfen, ob Chrome CDP unter Windows bereitstellt
  - H4: IPv4 und IPv6 diagnostizieren, bevor portproxy geändert wird
  - H3: Schicht 2: Überprüfen, ob WSL2 diesen Windows-Endpunkt erreichen kann
  - H3: Schicht 3: Das richtige Browserprofil konfigurieren
  - H3: Schicht 4: Die Control-UI-Schicht separat überprüfen
  - H3: Schicht 5: Die durchgängige Browsersteuerung überprüfen
  - H2: Häufige irreführende Fehler
  - H2: Checkliste für die schnelle Triage
  - H2: Verwandte Themen

## tools/browser.md

- Route: /tools/browser
- Überschriften:
  - H2: Funktionsumfang
  - H2: Schnellstart
  - H2: Plugin-Steuerung
  - H2: Anleitung für Agenten
  - H2: Fehlender Browserbefehl oder fehlendes Browsertool
  - H2: Profile: openclaw, user, chrome
  - H2: Konfiguration
  - H3: Screenshot-Bilderkennung (Unterstützung für reine Textmodelle)
  - H2: Brave oder einen anderen Chromium-basierten Browser verwenden
  - H2: Lokale und entfernte Steuerung
  - H2: Node-Browser-Proxy (konfigurationsfreier Standard)
  - H2: Browserless (gehostetes Remote-CDP)
  - H3: Browserless Docker auf demselben Host
  - H2: Direkte WebSocket-CDP-Provider
  - H3: Browserbase
  - H3: Notte
  - H2: Sicherheit
  - H2: Profile (mehrere Browser)
  - H2: Bestehende Sitzung über Chrome DevTools MCP
  - H3: Benutzerdefinierter Chrome-MCP-Start
  - H2: Isolationsgarantien
  - H2: Browserauswahl
  - H2: Steuerungs-API (optional)
  - H2: Fehlerbehebung
  - H3: CDP-Startfehler im Vergleich zur SSRF-Blockierung der Navigation
  - H2: Agententools und Funktionsweise der Steuerung
  - H2: Verwandte Themen

## tools/btw.md

- Route: /tools/btw
- Überschriften:
  - H2: Funktionsweise
  - H2: Was es nicht tut
  - H2: Bereitstellungsmodell
  - H2: Oberflächenverhalten
  - H2: Auswahl-Popup (Control UI)
  - H2: Verwendungsszenarien
  - H2: Verwandte Themen

## tools/capability-cookbook.md

- Route: /tools/capability-cookbook
- Überschriften:
  - H2: Verwandte Themen

## tools/chrome-extension.md

- Route: /tools/chrome-extension
- Überschriften:
  - H1: Chrome-Erweiterung
  - H2: Funktionsweise
  - H2: Installieren und koppeln
  - H2: Verwendung
  - H2: Remote-/rechnerübergreifende Nutzung
  - H2: Diagnose
  - H2: Sicherheitsmodell

## tools/clawhub.md

- Route: /tools/clawhub
- Überschriften: keine

## tools/code-execution.md

- Route: /tools/code-execution
- Überschriften:
  - H2: Einrichtung
  - H2: Verwendung
  - H2: Fehler
  - H2: Verwandte Themen

## tools/creating-skills.md

- Route: /tools/creating-skills
- Überschriften:
  - H2: Ihren ersten Skill erstellen
  - H2: SKILL.md-Referenz
  - H3: Erforderliche Felder
  - H3: Optionale Frontmatter-Schlüssel
  - H3: Verwendung von {baseDir}
  - H2: Bedingte Aktivierung hinzufügen
  - H2: Über Skill Workshop vorschlagen
  - H2: Auf ClawHub veröffentlichen
  - H2: Bewährte Methoden
  - H2: Verwandte Themen

## tools/diffs.md

- Route: /tools/diffs
- Überschriften:
  - H2: Schnellstart
  - H2: Integrierte Systemanleitung deaktivieren
  - H2: Referenz für Tooleingaben
  - H2: Syntaxhervorhebung
  - H2: Vertrag für Ausgabedetails
  - H3: Eingeklappte unveränderte Abschnitte
  - H3: Navigation zwischen mehreren Dateien
  - H2: Plugin-Standardeinstellungen
  - H3: Konfiguration einer dauerhaften Viewer-URL
  - H2: Sicherheitskonfiguration
  - H2: Lebenszyklus und Speicherung von Artefakten
  - H2: Viewer-URL und Netzwerkverhalten
  - H2: Sicherheitsmodell
  - H2: Browseranforderungen für den Dateimodus
  - H2: Fehlerbehebung
  - H2: Betriebshinweise
  - H2: Verwandte Themen

## tools/duckduckgo-search.md

- Route: /tools/duckduckgo-search
- Überschriften:
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Toolparameter
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/elevated.md

- Route: /tools/elevated
- Überschriften:
  - H2: Direktiven
  - H2: Funktionsweise
  - H2: Auflösungsreihenfolge
  - H2: Verfügbarkeit und Zulassungslisten
  - H2: Was elevated nicht steuert
  - H2: Verwandte Themen

## tools/exa-search.md

- Route: /tools/exa-search
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Basis-URL überschreiben
  - H2: Toolparameter
  - H3: Inhaltsextraktion
  - H3: Suchmodi
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/exec-approvals-advanced.md

- Route: /tools/exec-approvals-advanced
- Überschriften:
  - H2: Sichere Binärdateien (nur stdin)
  - H3: Argv-Validierung und abgelehnte Flags
  - H3: Vertrauenswürdige Verzeichnisse für Binärdateien
  - H3: Shell-Verkettung, Wrapper und Multiplexer
  - H3: Sichere Binärdateien im Vergleich zur Zulassungsliste
  - H2: Interpreter-/Laufzeitbefehle
  - H3: Verhalten bei der Zustellung von Folgemeldungen
  - H2: Weiterleitung von Genehmigungen an Chatkanäle
  - H3: Weiterleitung von Plugin-Genehmigungen
  - H3: Genehmigungen im selben Chat auf jedem Kanal
  - H3: Native Zustellung von Genehmigungen
  - H3: Offizielle mobile Operator-Apps
  - H3: macOS-IPC-Ablauf
  - H2: Häufig gestellte Fragen
  - H3: Wann werden accountId und threadId für ein Genehmigungsziel verwendet?
  - H3: Wenn Genehmigungen an eine Sitzung gesendet werden, kann jeder in dieser Sitzung sie genehmigen?
  - H2: Verwandte Themen

## tools/exec-approvals.md

- Route: /tools/exec-approvals
- Überschriften:
  - H2: Geltungsbereich
  - H3: Vertrauensmodell
  - H3: macOS-Aufteilung
  - H2: Effektive Richtlinie prüfen
  - H2: Einstellungen und Speicherung
  - H2: Richtlinienoptionen
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO-Modus (ohne Genehmigung)
  - H3: Dauerhafte „Nie nachfragen“-Einrichtung auf dem Gateway-Host
  - H3: Lokale Kurzform
  - H3: Node-Host
  - H3: Kurzform nur für die Sitzung
  - H2: Zulassungsliste (pro Agent)
  - H3: Argumente mit argPattern einschränken
  - H2: Skill-CLIs automatisch zulassen
  - H2: Sichere Binärdateien und Weiterleitung von Genehmigungen
  - H2: Bearbeitung in der Control UI
  - H2: Genehmigungsablauf
  - H2: Systemereignisse und Ablehnungen
  - H2: Auswirkungen
  - H2: Verwandte Themen

## tools/exec.md

- Route: /tools/exec
- Überschriften:
  - H2: Parameter
  - H2: Konfiguration
  - H3: Modi
  - H3: Inline-Auswertung (strictInlineEval)
  - H3: PATH-Verarbeitung
  - H2: Sitzungsüberschreibungen (/exec)
  - H2: Exec-Genehmigungen (Begleit-App/Node-Host)
  - H2: Zulassungsliste und sichere Binärdateien
  - H2: Beispiele
  - H2: applypatch
  - H2: Verwandte Themen

## tools/firecrawl.md

- Route: /tools/firecrawl
- Überschriften:
  - H2: Plugin installieren
  - H2: Schlüsselloser webfetch und API-Schlüssel
  - H2: Firecrawl-Suche konfigurieren
  - H2: Firecrawl-Fallback für webfetch konfigurieren
  - H3: Selbst gehostetes Firecrawl
  - H2: Firecrawl-Plugin-Tools
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Tarnung/Umgehung von Botschutz
  - H2: Wie webfetch Firecrawl verwendet
  - H2: Verwandte Themen

## tools/gemini-search.md

- Route: /tools/gemini-search
- Überschriften:
  - H2: API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Modellauswahl
  - H2: Überschreibungen der Basis-URL
  - H2: Verwandte Themen

## tools/goal.md

- Route: /tools/goal
- Überschriften:
  - H1: Ziel
  - H2: Schnellstart
  - H2: Verwendungszweck von Zielen
  - H2: Befehlsreferenz
  - H2: Status
  - H2: Token-Budgets
  - H2: Modelltools
  - H2: Zielkontext bei jedem Durchlauf
  - H2: Control UI
  - H2: TUI
  - H2: Kanalverhalten
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/grok-search.md

- Route: /tools/grok-search
- Überschriften:
  - H2: Onboarding und Konfiguration
  - H2: Anmelden oder API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Überschreibungen der Basis-URL
  - H2: Verwandte Themen

## tools/image-generation.md

- Route: /tools/image-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Häufig verwendete Routen
  - H2: Unterstützte Provider
  - H2: Provider-Funktionen
  - H2: Toolparameter
  - H2: Konfiguration
  - H3: Modellauswahl
  - H3: Reihenfolge der Provider-Auswahl
  - H3: Bildbearbeitung
  - H2: Detaillierte Betrachtung der Provider
  - H2: Beispiele
  - H2: Verwandte Themen

## tools/index.md

- Route: /tools
- Überschriften:
  - H2: Erste Schritte
  - H2: Tools, Skills oder Plugins auswählen
  - H2: Integrierte Toolkategorien
  - H2: Von Plugins bereitgestellte Tools
  - H2: Zugriff und Genehmigungen konfigurieren
  - H2: Funktionen erweitern
  - H2: Fehlende Tools beheben
  - H2: Verwandte Themen

## tools/kimi-search.md

- Route: /tools/kimi-search
- Überschriften:
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Grounding-Anforderung
  - H2: Toolparameter
  - H2: Verwandte Themen

## tools/llm-task.md

- Route: /tools/llm-task
- Überschriften:
  - H2: Aktivieren
  - H2: Konfiguration (optional)
  - H2: Toolparameter
  - H2: Ausgabe
  - H2: Beispiel: Lobster-Workflow-Schritt
  - H3: Wichtige Einschränkung
  - H2: Sicherheitshinweise
  - H2: Verwandte Themen

## tools/lobster.md

- Route: /tools/lobster
- Überschriften:
  - H2: Gründe
  - H2: Funktionsweise
  - H2: Aktivieren
  - H2: Muster: kleine CLI, JSON-Pipes und Genehmigungen
  - H2: Reine JSON-LLM-Schritte (llm-task)
  - H3: Wichtige Einschränkung: eingebettetes Lobster im Vergleich zu openclaw.invoke
  - H2: Workflow-Dateien (.lobster)
  - H2: Toolparameter
  - H3: run
  - H3: resume
  - H3: Verwalteter TaskFlow-Modus
  - H2: Ausgabe-Envelope
  - H2: Genehmigungen
  - H2: OpenProse
  - H2: Sicherheit
  - H2: Fehlerbehebung
  - H2: Weitere Informationen
  - H2: Fallstudie: Community-Workflows
  - H2: Verwandte Themen

## tools/loop-detection.md

- Route: /tools/loop-detection
- Überschriften:
  - H2: Hintergrund
  - H2: Konfigurationsblock
  - H3: Feldverhalten
  - H2: Empfohlene Einrichtung
  - H2: Schutz nach der Compaction
  - H2: Protokolle und erwartetes Verhalten
  - H2: Verwandte Themen

## tools/media-overview.md

- Route: /tools/media-overview
- Überschriften:
  - H2: Funktionen
  - H2: Matrix der Provider-Funktionen
  - H2: Asynchron im Vergleich zu synchron
  - H2: Spracherkennung und Sprachanruf
  - H2: Provider-Zuordnungen (Aufteilung der Anbieter auf die Oberflächen)
  - H2: Verwandte Themen

## tools/minimax-search.md

- Route: /tools/minimax-search
- Überschriften:
  - H2: Anmeldedaten für einen Token Plan abrufen
  - H2: Konfiguration
  - H2: Regionsauswahl
  - H2: Unterstützte Parameter
  - H2: Verwandte Themen

## tools/multi-agent-sandbox-tools.md

- Route: /tools/multi-agent-sandbox-tools
- Überschriften:
  - H2: Konfigurationsbeispiele
  - H2: Konfigurationsrangfolge
  - H3: Sandbox-Konfiguration
  - H3: Toolbeschränkungen
  - H2: Migration von einem einzelnen Agenten
  - H2: Beispiele für Toolbeschränkungen
  - H2: Häufiger Fallstrick: „non-main“
  - H2: Tests
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/music-generation.md

- Route: /tools/music-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H3: Funktionsmatrix
  - H2: Toolparameter
  - H2: Asynchrones Verhalten
  - H3: Aufgabenlebenszyklus
  - H2: Konfiguration
  - H3: Modellauswahl
  - H3: Reihenfolge der Provider-Auswahl
  - H2: Hinweise zu Providern
  - H2: Den richtigen Weg wählen
  - H2: Funktionsmodi der Provider
  - H2: Live-Tests
  - H2: Verwandte Themen

## tools/ollama-search.md

- Route: /tools/ollama-search
- Überschriften:
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Authentifizierung und Anfrageweiterleitung
  - H2: Verwandte Themen

## tools/parallel-search.md

- Route: /tools/parallel-search
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel (kostenpflichtiger Provider)
  - H2: Konfiguration
  - H2: Basis-URL überschreiben
  - H2: Toolparameter
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/pdf.md

- Route: /tools/pdf
- Überschriften:
  - H2: Verfügbarkeit
  - H2: Eingabereferenz
  - H2: Unterstützte PDF-Referenzen
  - H2: Ausführungsmodi
  - H3: Nativer Provider-Modus
  - H3: Extraktions-Fallback-Modus
  - H2: Konfiguration
  - H2: Ausgabedetails
  - H2: Fehlerverhalten
  - H2: Beispiele
  - H2: Verwandte Themen

## tools/permission-modes.md

- Route: /tools/permission-modes
- Überschriften:
  - H2: Empfohlene Standardeinstellung
  - H2: Exec-Modi des OpenClaw-Hosts
  - H2: Codex-Guardian-Zuordnung
  - H2: Berechtigungen des ACPX-Harness
  - H2: Einen Modus auswählen
  - H2: Verwandte Themen

## tools/perplexity-search.md

- Route: /tools/perplexity-search
- Überschriften:
  - H2: Plugin installieren
  - H2: Perplexity-API-Schlüssel abrufen
  - H2: OpenRouter-Kompatibilität
  - H2: Konfigurationsbeispiele
  - H3: Native Perplexity Search API
  - H3: OpenRouter-/Sonar-Kompatibilität
  - H2: Speicherort des Schlüssels
  - H2: Toolparameter
  - H3: Regeln für Domänenfilter
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/plugin.md

- Route: /tools/plugin
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Konfiguration
  - H3: Installationsquelle auswählen
  - H3: Installationsrichtlinie für Operatoren
  - H3: Plugin-Richtlinie konfigurieren
  - H2: Plugin-Formate verstehen
  - H2: Plugin-Hooks
  - H2: Aktives Gateway überprüfen
  - H2: Fehlerbehebung
  - H3: Blockierte Eigentümerschaft des Plugin-Pfads
  - H3: Langsame Einrichtung von Plugin-Tools
  - H2: Verwandte Themen

## tools/reactions.md

- Route: /tools/reactions
- Überschriften:
  - H2: Funktionsweise
  - H2: Kanalverhalten
  - H2: Reaktionsebene
  - H2: Verwandte Themen

## tools/searxng-search.md

- Route: /tools/searxng-search
- Überschriften:
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Umgebungsvariable
  - H2: Referenz zur Plugin-Konfiguration
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/show-widget.md

- Route: /tools/show-widget
- Überschriften:
  - H2: Tool verwenden
  - H2: Sicherheit und Speicherung
  - H2: Verwandte Themen

## tools/skill-workshop.md

- Route: /tools/skill-workshop
- Überschriften:
  - H2: Funktionsweise
  - H2: Lebenszyklus
  - H2: Kuratierung des Lebenszyklus
  - H2: Chat
  - H3: Aus kürzlich ausgeführten Arbeiten lernen
  - H2: CLI
  - H2: Inhalt des Vorschlags
  - H2: Unterstützungsdateien
  - H2: Agentenwerkzeug
  - H2: Vorgeschlagene Skills
  - H2: Genehmigung und Autonomie
  - H2: Gateway-Methoden
  - H2: Speicherung
  - H2: Beschränkungen
  - H2: Fehlerbehebung
  - H3: Werkzeugrichtlinien-Diagnose
  - H2: Verwandte Themen

## tools/skills-config.md

- Route: /tools/skills-config
- Überschriften:
  - H2: Laden (skills.load)
  - H2: Installation (skills.install)
  - H2: Installationsrichtlinie für Betreiber (security.installPolicy)
  - H2: Zulassungsliste für mitgelieferte Skills
  - H2: Einträge pro Skill (skills.entries)
  - H2: Agenten-Zulassungslisten (agents)
  - H2: Workshop (skills.workshop)
  - H2: Über symbolische Links eingebundene Skill-Stammverzeichnisse
  - H2: Skills in der Sandbox und Umgebungsvariablen
  - H2: Erinnerung an die Ladereihenfolge
  - H2: Verwandte Themen

## tools/skills.md

- Route: /tools/skills
- Überschriften:
  - H2: Ladereihenfolge
  - H2: Auf Node ausgeführte Skills
  - H2: Agentenspezifische und gemeinsam genutzte Skills
  - H2: Agenten-Zulassungslisten
  - H2: Plugins und Skills
  - H2: Skill-Workshop
  - H2: Installation aus ClawHub
  - H2: Sicherheit
  - H2: Format von SKILL.md
  - H3: Optionale Frontmatter-Schlüssel
  - H2: Zugriffssteuerung
  - H3: Installationsspezifikationen
  - H2: Konfigurationsüberschreibungen
  - H2: Einschleusen von Umgebungsvariablen
  - H2: Momentaufnahmen und Aktualisierung
  - H2: Token-Auswirkung
  - H2: Verwandte Themen

## tools/slash-commands.md

- Route: /tools/slash-commands
- Überschriften:
  - H2: Drei Befehlstypen
  - H2: Konfiguration
  - H2: Befehlsliste
  - H3: Kernbefehle
  - H3: Dock-Befehle
  - H3: Befehle mitgelieferter Plugins
  - H3: Skill-Befehle
  - H2: /tools: Was der Agent jetzt verwenden kann
  - H2: /model: Modellauswahl
  - H2: /config: Schreiben der Konfiguration auf den Datenträger
  - H2: /mcp: MCP-Serverkonfiguration
  - H2: /debug: Laufzeitspezifische Überschreibungen
  - H2: /plugins: Plugin-Verwaltung
  - H2: /trace: Plugin-Ablaufverfolgungsausgabe
  - H2: /btw: Nebenfragen
  - H2: Hinweise zu Oberflächen
  - H2: Provider-Nutzung und -Status
  - H2: Verwandte Themen

## tools/steer.md

- Route: /tools/steer
- Überschriften:
  - H2: Aktuelle Sitzung
  - H2: Steuern im Vergleich zur Warteschlange
  - H2: Unteragenten
  - H2: ACP-Sitzungen
  - H2: Verwandte Themen

## tools/subagents.md

- Route: /tools/subagents
- Überschriften:
  - H2: Slash-Befehl
  - H3: Steuerelemente für die Thread-Bindung
  - H3: Startverhalten
  - H2: Kontextmodi
  - H2: Werkzeug: sessionsspawn
  - H3: Modus für Delegierungsaufforderungen
  - H3: Werkzeugparameter
  - H3: Aufgabennamen und Zielauswahl
  - H2: Werkzeug: sessionsyield
  - H2: Werkzeug: subagents
  - H2: Thread-gebundene Sitzungen
  - H3: Kanäle mit Thread-Unterstützung
  - H3: Schnellablauf
  - H3: Manuelle Steuerelemente
  - H3: Konfigurationsschalter
  - H3: Zulassungsliste
  - H3: Erkennung
  - H3: Automatische Archivierung
  - H2: Verschachtelte Unteragenten
  - H3: Tiefenstufen
  - H3: Ankündigungskette
  - H3: Werkzeugrichtlinie nach Tiefe
  - H3: Startlimit pro Agent
  - H3: Kaskadierendes Beenden
  - H2: Authentifizierung
  - H2: Ankündigung
  - H3: Ankündigungskontext
  - H3: Statistikzeile
  - H3: Warum sessionshistory bevorzugt wird
  - H2: Werkzeugrichtlinie
  - H3: Überschreibung über die Konfiguration
  - H2: Nebenläufigkeit
  - H2: Betriebsfähigkeit und Wiederherstellung
  - H2: Beenden
  - H2: Einschränkungen
  - H2: Verwandte Themen

## tools/tavily.md

- Route: /tools/tavily
- Überschriften:
  - H2: Erste Schritte
  - H2: Werkzeugreferenz
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Auswahl des richtigen Werkzeugs
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## tools/thinking.md

- Route: /tools/thinking
- Überschriften:
  - H2: Funktionsweise
  - H2: Auflösungsreihenfolge
  - H2: Festlegen eines Sitzungsstandards
  - H2: Anwendung durch den Agenten
  - H2: Schnellmodus (/fast)
  - H2: Ausführlichkeitsdirektiven (/verbose oder /v)
  - H2: Direktiven zur Plugin-Ablaufverfolgung (/trace)
  - H2: Sichtbarkeit der Schlussfolgerung (/reasoning)
  - H2: Verwandte Themen
  - H2: Heartbeats
  - H2: Webchat-Benutzeroberfläche
  - H2: Provider-Profile

## tools/tokenjuice.md

- Route: /tools/tokenjuice
- Überschriften:
  - H2: Plugin aktivieren
  - H2: Was Tokenjuice ändert
  - H2: Funktion überprüfen
  - H2: Plugin deaktivieren
  - H2: Verwandte Themen

## tools/tool-search.md

- Route: /tools/tool-search
- Überschriften:
  - H2: Ablauf eines Durchlaufs
  - H2: Modi
  - H2: Zweck
  - H2: API
  - H2: Laufzeitgrenze
  - H2: Konfiguration
  - H2: Aufforderung und Telemetrie
  - H2: E2E-Validierung
  - H2: Verhalten bei Fehlern
  - H2: Verwandte Themen

## tools/trajectory.md

- Route: /tools/trajectory
- Überschriften:
  - H2: Schnellstart
  - H2: Zugriff
  - H2: Aufgezeichnete Daten
  - H2: Paketdateien
  - H2: Speicherung der Aufzeichnungen
  - H2: Aufzeichnung deaktivieren
  - H2: Zeitüberschreitung für das Leeren anpassen
  - H2: Datenschutz und Beschränkungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/tts.md

- Route: /tools/tts
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H2: Konfiguration
  - H3: Agentenspezifische Stimmenüberschreibungen
  - H2: Personas
  - H3: Minimale Persona
  - H3: Vollständige Persona (Provider-neutrale Aufforderung)
  - H3: Persona-Auflösung
  - H3: Verwendung von Persona-Aufforderungen durch Provider
  - H3: Fallback-Richtlinie
  - H2: Modellgesteuerte Direktiven
  - H2: Slash-Befehle
  - H2: Benutzerspezifische Einstellungen
  - H2: Ausgabeformate
  - H2: Verhalten der automatischen Sprachausgabe
  - H2: Feldreferenz
  - H2: Agentenwerkzeug
  - H2: Gateway-RPC
  - H2: Dienstlinks
  - H2: Verwandte Themen

## tools/video-generation.md

- Route: /tools/video-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise der asynchronen Generierung
  - H3: Aufgabenlebenszyklus
  - H2: Unterstützte Provider
  - H3: Funktionsmatrix
  - H2: Werkzeugparameter
  - H3: Erforderlich
  - H3: Inhaltseingaben
  - H3: Stilsteuerung
  - H3: Erweitert
  - H4: Fallback und typisierte Optionen
  - H2: Aktionen
  - H2: Modellauswahl
  - H2: Hinweise zu Providern
  - H2: Provider-Funktionsmodi
  - H2: Live-Tests
  - H2: Konfiguration
  - H2: Verwandte Themen

## tools/web-fetch.md

- Route: /tools/web-fetch
- Überschriften:
  - H2: Schnellstart
  - H2: Werkzeugparameter
  - H2: Funktionsweise
  - H2: Fortschrittsaktualisierungen
  - H2: Konfiguration
  - H2: Firecrawl-Fallback
  - H2: Vertrauenswürdiger Umgebungsproxy
  - H2: Beschränkungen und Sicherheit
  - H2: Werkzeugprofile
  - H2: Verwandte Themen

## tools/web.md

- Route: /tools/web
- Überschriften:
  - H2: Schnellstart
  - H2: Auswahl eines Providers
  - H3: Provider-Vergleich
  - H2: Automatische Erkennung
  - H2: Native OpenAI-Websuche
  - H2: Native Codex-Websuche
  - H2: Netzwerksicherheit
  - H2: Konfiguration
  - H3: Speichern von API-Schlüsseln
  - H2: Werkzeugparameter
  - H2: xsearch
  - H3: xsearch-Konfiguration
  - H3: xsearch-Parameter
  - H3: xsearch-Beispiel
  - H2: Beispiele
  - H2: Werkzeugprofile
  - H2: Verwandte Themen

## tts.md

- Route: /tts
- Überschriften:
  - H2: Verwandte Themen

## vps.md

- Route: /vps
- Überschriften:
  - H2: Provider auswählen
  - H2: Funktionsweise von Cloud-Einrichtungen
  - H2: Zuerst den Administratorzugriff absichern
  - H2: Gemeinsam genutzter Unternehmensagent auf einem VPS
  - H2: Nodes mit einem VPS verwenden
  - H2: Startoptimierung für kleine VMs und ARM-Hosts
  - H3: Checkliste zur systemd-Optimierung (optional)
  - H2: Verwandte Themen

## web/control-ui.md

- Route: /web/control-ui
- Überschriften:
  - H2: Schnell öffnen (lokal)
  - H2: Gerätekopplung (erste Verbindung)
  - H2: Mobilgerät koppeln
  - H2: Persönliche Identität (browserlokal)
  - H2: Endpunkt für die Laufzeitkonfiguration
  - H2: Status des Gateway-Hosts
  - H2: Sprachunterstützung
  - H2: Darstellungsdesigns
  - H2: Plugins verwalten
  - H2: Seitenleistennavigation
  - H2: Seite für eine neue Sitzung
  - H2: Aktuelle Funktionen
  - H2: MCP-Seite
  - H2: Registerkarte „Aktivität“
  - H2: Betreiberterminal
  - H2: Browserbereich
  - H2: Chatverhalten
  - H2: Verbindungsverlust und Wiederherstellung der Verbindung
  - H2: PWA-Installation und Web-Push
  - H2: Gehostete Einbettungen
  - H2: Breite von Chatnachrichten
  - H2: Tailnet-Zugriff (empfohlen)
  - H2: Unsicheres HTTP
  - H2: Richtlinie zur Inhaltssicherheit
  - H2: Authentifizierung der Avatar-Route
  - H2: Authentifizierung der Route für Assistentenmedien
  - H2: Genehmigungslinks
  - H2: Leere Control-UI-Seite
  - H2: Debugging und Tests: Entwicklungsserver und entferntes Gateway
  - H2: Verwandte Themen

## web/dashboard.md

- Route: /web/dashboard
- Überschriften:
  - H2: Schnellverfahren (empfohlen)
  - H2: Grundlagen der Authentifizierung (lokal und entfernt)
  - H2: In Telegram öffnen
  - H2: Wenn „unauthorized“ / 1008 angezeigt wird
  - H2: Verwandte Themen

## web/index.md

- Route: /web
- Überschriften:
  - H2: Konfiguration (standardmäßig aktiviert)
  - H2: Webhooks
  - H2: Administrator-HTTP-RPC
  - H2: Tailscale-Zugriff
  - H2: Sicherheitshinweise
  - H2: Erstellen der Benutzeroberfläche

## web/lobster.md

- Route: /web/lobster
- Überschriften:
  - H2: Was Sie hier sehen
  - H2: Wann es angezeigt wird
  - H2: Mögliche Aktionen
  - H2: Besuche deaktivieren (oder wieder aktivieren)
  - H2: Das Lobsterdex
  - H2: Feldnotizen
  - H2: Datenschutz

## web/tui.md

- Route: /web/tui
- Überschriften:
  - H2: Schnellstart
  - H3: Gateway-Modus
  - H3: Lokaler Modus
  - H2: Anzeige
  - H2: Mentales Modell: Agenten und Sitzungen
  - H2: Senden und Zustellung
  - H2: Auswahlmenüs und Überlagerungen
  - H2: Tastenkombinationen
  - H2: Slash-Befehle
  - H2: Lokale Shell-Befehle
  - H2: Einrichtungs- und Reparaturhilfe für Crestodian
  - H2: Werkzeugausgabe
  - H2: Terminalfarben
  - H2: Verlauf und Streaming
  - H2: Verbindungsdetails
  - H2: Optionen
  - H2: Fehlerbehebung
  - H2: Fehlerbehebung bei Verbindungen
  - H2: Verwandte Themen

## web/webchat.md

- Route: /web/webchat
- Überschriften:
  - H2: Beschreibung
  - H2: Schnellstart
  - H2: Funktionsweise
  - H3: Transkript- und Zustellungsmodell
  - H2: Werkzeugbereich für Agenten in der Control UI
  - H2: Entfernte Nutzung
  - H2: Konfigurationsreferenz (WebChat)
  - H2: Verwandte Themen

## web/workspaces.md

- Route: /web/workspaces
- Überschriften:
  - H2: Arbeitsbereiche aktivieren
  - H2: Standardarbeitsbereich
  - H2: Integrierte Widgets
  - H2: Herkunft
  - H2: Benutzerdefinierte Widgets
  - H2: CLI
  - H2: Speicherung
