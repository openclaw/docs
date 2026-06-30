---
read_when: Finding which docs page covers a topic before reading the page
summary: Generierte Überschriftenzuordnung für OpenClaw-Dokumentationsseiten
title: Dokumentationsübersicht
x-i18n:
    generated_at: "2026-06-30T13:56:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9526e7b1db302e55d7e598900c7f6db45369ef924946ba8cc0da621482f21cd1
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw-Dokumentationsübersicht

Diese Datei wird aus den Überschriften in `docs/**/*.md` und `docs/**/*.mdx` generiert, um Agenten die Navigation im Dokumentationsbaum zu erleichtern.
Bearbeiten Sie sie nicht von Hand; führen Sie `pnpm docs:map:gen` aus.

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Überschriften:
  - H2: Laufzeitlayout
  - H2: Grenzen
  - H2: Manifeste
  - H2: Laufzeitauswahl
  - H2: Verwandte Themen

## announcements/bluebubbles-imessage.md

- Route: /announcements/bluebubbles-imessage
- Überschriften:
  - H1: Entfernung von BlueBubbles und der imsg-iMessage-Pfad
  - H2: Was sich geändert hat
  - H2: Was zu tun ist
  - H2: Migrationshinweise
  - H2: Siehe auch

## auth-credential-semantics.md

- Route: /auth-credential-semantics
- Überschriften:
  - H2: Stabile Probe-Ursachencodes
  - H2: Token-Anmeldedaten
  - H3: Berechtigungsregeln
  - H3: Auflösungsregeln
  - H2: Portabilität von Agent-Kopien
  - H2: Nur-Konfigurations-Authentifizierungsrouten
  - H2: Explizite Authentifizierungsreihenfolge-Filterung
  - H2: Auflösung des Probe-Ziels
  - H2: Erkennung externer CLI-Anmeldedaten
  - H2: OAuth SecretRef Policy Guard
  - H2: Legacy-kompatible Nachrichten
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
  - H2: Wie Cron funktioniert
  - H2: Zeitplantypen
  - H3: Tag-des-Monats und Wochentag verwenden ODER-Logik
  - H2: Ausführungsarten
  - H3: Befehls-Payloads
  - H3: Payload-Optionen für isolierte Jobs
  - H2: Zustellung und Ausgabe
  - H2: Ausgabesprache
  - H2: CLI-Beispiele
  - H2: Webhooks
  - H3: Authentifizierung
  - H2: Gmail-PubSub-Integration
  - H3: Assistenteneinrichtung (empfohlen)
  - H3: Automatischer Gateway-Start
  - H3: Manuelle einmalige Einrichtung
  - H3: Überschreibung des Gmail-Modells
  - H2: Jobs verwalten
  - H2: Konfiguration
  - H2: Fehlerbehebung
  - H3: Befehlsleiter
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
  - H3: HOOK.md-Format
  - H3: Handler-Implementierung
  - H3: Wichtige Punkte zum Ereigniskontext
  - H2: Hook-Erkennung
  - H3: Hook-Pakete
  - H2: Gebündelte Hooks
  - H3: Details zu session-memory
  - H3: bootstrap-extra-files-Konfiguration
  - H3: Details zu command-logger
  - H3: Details zu compaction-notifier
  - H3: Details zu boot-md
  - H2: Plugin-Hooks
  - H2: Konfiguration
  - H2: CLI-Referenz
  - H2: Best Practices
  - H2: Fehlerbehebung
  - H3: Hook nicht erkannt
  - H3: Hook nicht berechtigt
  - H3: Hook wird nicht ausgeführt
  - H2: Verwandte Themen

## automation/index.md

- Route: /automation
- Überschriften:
  - H2: Kurze Entscheidungshilfe
  - H3: Geplante Aufgaben (Cron) vs. Heartbeat
  - H2: Kernkonzepte
  - H3: Geplante Aufgaben (Cron)
  - H3: Aufgaben
  - H3: Abgeleitete Verpflichtungen
  - H3: TaskFlow
  - H3: Daueraufträge
  - H3: Hooks
  - H3: Heartbeat
  - H2: Wie sie zusammenarbeiten
  - H2: Verwandte Themen

## automation/poll.md

- Route: /automation/poll
- Überschriften:
  - H2: Verwandte Themen

## automation/standing-orders.md

- Route: /automation/standing-orders
- Überschriften:
  - H2: Warum Daueraufträge
  - H2: Wie sie funktionieren
  - H2: Anatomie eines Dauerauftrags
  - H2: Daueraufträge plus Cron-Jobs
  - H2: Beispiele
  - H3: Beispiel 1: Inhalte und soziale Medien (wöchentlicher Zyklus)
  - H3: Beispiel 2: Finanzoperationen (ereignisgesteuert)
  - H3: Beispiel 3: Überwachung und Warnmeldungen (kontinuierlich)
  - H2: Ausführen-Prüfen-Berichten-Muster
  - H2: Mehrprogramm-Architektur
  - H2: Best Practices
  - H3: Empfohlen
  - H3: Vermeiden
  - H2: Verwandte Themen

## automation/taskflow.md

- Route: /automation/taskflow
- Überschriften:
  - H2: Wann Sie TaskFlow verwenden sollten
  - H2: Zuverlässiges Muster für geplante Workflows
  - H2: Synchronisierungsmodi
  - H3: Verwalteter Modus
  - H3: Gespiegelter Modus
  - H2: Dauerhafter Zustand und Revisionsverfolgung
  - H2: Abbruchverhalten
  - H2: CLI-Befehle
  - H2: Wie Flows mit Aufgaben zusammenhängen
  - H2: Verwandte Themen

## automation/tasks.md

- Route: /automation/tasks
- Überschriften:
  - H2: Kurzfassung
  - H2: Schnellstart
  - H2: Wodurch eine Aufgabe erstellt wird
  - H2: Aufgabenlebenszyklus
  - H2: Zustellung und Benachrichtigungen
  - H3: Benachrichtigungsrichtlinien
  - H2: CLI-Referenz
  - H2: Chat-Aufgabenboard (/tasks)
  - H2: Statusintegration (Aufgabendruck)
  - H2: Speicherung und Wartung
  - H3: Wo Aufgaben gespeichert werden
  - H3: Automatische Wartung
  - H2: Wie Aufgaben mit anderen Systemen zusammenhängen
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
  - H2: Gruppen aus Zulassungslisten referenzieren
  - H2: Unterstützte Nachrichtenkanalpfade
  - H2: Plugin-Diagnose
  - H2: Discord-Kanalzielgruppen
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
  - H2: Agent-spezifische Richtlinie
  - H2: Sichtbare Antwortmodi
  - H2: Verlauf
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/bot-loop-protection.md

- Route: /channels/bot-loop-protection
- Überschriften:
  - H1: Schutz vor Bot-Schleifen
  - H2: Standardwerte
  - H2: Gemeinsame Standardwerte konfigurieren
  - H2: Pro Kanal oder Konto überschreiben
  - H2: Kanalunterstützung

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Überschriften:
  - H2: Überblick
  - H2: Anwendungsfälle
  - H2: Konfiguration
  - H3: Grundeinrichtung
  - H3: Verarbeitungsstrategie
  - H3: Vollständiges Beispiel
  - H2: Wie es funktioniert
  - H3: Nachrichtenfluss
  - H3: Sitzungsisolation
  - H3: Beispiel: isolierte Sitzungen
  - H2: Best Practices
  - H2: Kompatibilität
  - H3: Provider
  - H3: Routing
  - H2: Fehlerbehebung
  - H2: Beispiele
  - H2: API-Referenz
  - H3: Konfigurationsschema
  - H3: Felder
  - H2: Einschränkungen
  - H2: Künftige Erweiterungen
  - H2: Verwandte Themen

## channels/channel-routing.md

- Route: /channels/channel-routing
- Überschriften:
  - H1: Kanäle und Routing
  - H2: Schlüsselbegriffe
  - H2: Präfixe für ausgehende Ziele
  - H2: Formen von Sitzungsschlüsseln (Beispiele)
  - H2: Fixierung der Haupt-DM-Route
  - H2: Geschützte Aufzeichnung eingehender Nachrichten
  - H2: Routingregeln (wie ein Agent ausgewählt wird)
  - H2: Broadcast-Gruppen (mehrere Agenten ausführen)
  - H2: Konfigurationsüberblick
  - H2: Sitzungsspeicher
  - H2: WebChat-Verhalten
  - H2: Antwortkontext
  - H2: Verwandte Themen

## channels/clickclack.md

- Route: /channels/clickclack
- Überschriften:
  - H2: Schnelle Einrichtung
  - H2: Mehrere Bots
  - H2: Ziele
  - H2: Berechtigungen
  - H2: Fehlerbehebung

## channels/discord.md

- Route: /channels/discord
- Überschriften:
  - H2: Schnelle Einrichtung
  - H2: Empfohlen: Guild-Workspace einrichten
  - H2: Laufzeitmodell
  - H2: Forumskanäle
  - H2: Interaktive Komponenten
  - H2: Zugriffskontrolle und Routing
  - H3: Rollenbasiertes Agent-Routing
  - H2: Native Befehle und Befehlsauthentifizierung
  - H2: Funktionsdetails
  - H2: Tools und Aktionsfreigaben
  - H2: Components v2-Benutzeroberfläche
  - H2: Sprache
  - H3: Sprachkanäle
  - H3: Benutzern in Sprache folgen
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
  - H2: Beispiele für Gruppenkonfiguration
  - H3: Alle Gruppen zulassen, keine @Erwähnung erforderlich
  - H3: Alle Gruppen zulassen, weiterhin @Erwähnung erforderlich
  - H3: Nur bestimmte Gruppen zulassen
  - H3: Absender innerhalb einer Gruppe einschränken
  - H2: Gruppen-/Benutzer-IDs abrufen
  - H3: Gruppen-IDs (chatid, Format: ocxxx)
  - H3: Benutzer-IDs (openid, Format: ouxxx)
  - H2: Häufige Befehle
  - H2: Fehlerbehebung
  - H3: Bot antwortet in Gruppenchats nicht
  - H3: Bot empfängt keine Nachrichten
  - H3: QR-Einrichtung reagiert in der mobilen Feishu-App nicht
  - H3: App Secret offengelegt
  - H2: Erweiterte Konfiguration
  - H3: Mehrere Konten
  - H3: Nachrichtenlimits
  - H3: Streaming
  - H3: Kontingentoptimierung
  - H3: ACP-Sitzungen
  - H4: Dauerhafte ACP-Bindung
  - H4: ACP aus Chat starten
  - H3: Multi-Agent-Routing
  - H2: Agent-Isolation pro Benutzer (dynamische Agent-Erstellung)
  - H3: Schnelle Einrichtung
  - H3: Wie es funktioniert
  - H3: Konfigurationsoptionen
  - H3: Sitzungsumfang
  - H3: Typische Mehrbenutzerbereitstellung
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
  - H2: Schnelle Einrichtung (Einsteiger)
  - H2: Zu Google Chat hinzufügen
  - H2: Öffentliche URL (nur Webhook)
  - H3: Option A: Tailscale Funnel (empfohlen)
  - H3: Option B: Reverse Proxy (Caddy)
  - H3: Option C: Cloudflare Tunnel
  - H2: Wie es funktioniert
  - H2: Ziele
  - H2: Konfigurationshighlights
  - H2: Fehlerbehebung
  - H3: 405 Method Not Allowed
  - H3: Andere Probleme
  - H2: Verwandte Themen

## channels/group-messages.md

- Route: /channels/group-messages
- Überschriften:
  - H2: Verhalten
  - H2: Konfigurationsbeispiel (WhatsApp)
  - H3: Aktivierungsbefehl (nur Owner)
  - H2: Verwendung
  - H2: Testen / Überprüfung
  - H2: Bekannte Aspekte
  - H2: Verwandte Themen

## channels/groups.md

- Route: /channels/groups
- Überschriften:
  - H2: Einführung für Einsteiger (2 Minuten)
  - H2: Sichtbare Antworten
  - H2: Kontextsichtbarkeit und Zulassungslisten
  - H2: Sitzungsschlüssel
  - H2: Muster: persönliche DMs + öffentliche Gruppen (einzelner Agent)
  - H2: Anzeigebezeichnungen
  - H2: Gruppenrichtlinie
  - H2: Erwähnungs-Gating (Standard)
  - H2: Erwähnungsmuster im Umfang konfigurieren
  - H2: Tool-Einschränkungen für Gruppen/Kanäle (optional)
  - H2: Gruppen-Zulassungslisten
  - H2: Aktivierung (nur Owner)
  - H2: Kontextfelder
  - H2: iMessage-spezifische Details
  - H2: WhatsApp-Systemprompts
  - H2: WhatsApp-spezifische Details
  - H2: Verwandte Themen

## channels/imessage-from-bluebubbles.md

- Route: /channels/imessage-from-bluebubbles
- Überschriften:
  - H2: Migrationscheckliste
  - H2: Wann diese Migration sinnvoll ist
  - H2: Was imsg tut
  - H2: Bevor Sie beginnen
  - H2: Konfigurationsübersetzung
  - H2: Stolperfalle Gruppenregistrierung
  - H2: Schritt für Schritt
  - H2: Aktionsparität auf einen Blick
  - H2: Pairing, Sitzungen und ACP-Bindungen
  - H2: Kein Rollback-Kanal
  - H2: Verwandte Themen

## channels/imessage.md

- Route: /channels/imessage
- Überschriften:
  - H2: Schnelle Einrichtung
  - H2: Anforderungen und Berechtigungen (macOS)
  - H2: Aktivieren der privaten imsg-API
  - H3: Einrichtung
  - H3: Wenn Sie SIP nicht deaktivieren können
  - H2: Zugriffskontrolle und Routing
  - H2: ACP-Konversationsbindungen
  - H2: Bereitstellungsmuster
  - H2: Medien, Chunking und Zustellziele
  - H2: Private API-Aktionen
  - H2: Konfigurationsschreibvorgänge
  - H2: Zusammenführen geteilter DM-Sendungen (Befehl + URL in einer Komposition)
  - H3: Szenarien und was der Agent sieht
  - H2: Wiederherstellung eingehender Nachrichten nach einem Bridge- oder Gateway-Neustart
  - H3: Für Operatoren sichtbares Signal
  - H3: Migration
  - H2: Fehlerbehebung
  - H2: Verweise zur Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/index.md

- Route: /channels
- Überschriften:
  - H2: Zustellhinweise
  - H2: Unterstützte Kanäle
  - H2: Hinweise

## channels/irc.md

- Route: /channels/irc
- Überschriften:
  - H2: Schnellstart
  - H2: Sicherheitsstandards
  - H2: Zugriffskontrolle
  - H3: Häufige Stolperfalle: allowFrom gilt für DMs, nicht für Kanäle
  - H2: Antwortauslösung (Erwähnungen)
  - H2: Sicherheitshinweis (für öffentliche Kanäle empfohlen)
  - H3: Dieselben Tools für alle im Kanal
  - H3: Unterschiedliche Tools pro Absender (Owner erhält mehr Macht)
  - H2: NickServ
  - H2: Umgebungsvariablen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/line.md

- Route: /channels/line
- Überschriften:
  - H2: Installieren
  - H2: Einrichten
  - H2: Konfigurieren
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
  - H2: Kanalhinweise
  - H2: Verwandte Themen

## channels/matrix-migration.md

- Route: /channels/matrix-migration
- Überschriften:
  - H2: Was die Migration automatisch erledigt
  - H2: Was die Migration nicht automatisch erledigen kann
  - H2: Empfohlener Upgrade-Ablauf
  - H2: So funktioniert die verschlüsselte Migration
  - H2: Häufige Meldungen und ihre Bedeutung
  - H3: Upgrade- und Erkennungsmeldungen
  - H3: Meldungen zur Wiederherstellung des verschlüsselten Zustands
  - H3: Meldungen zur manuellen Wiederherstellung
  - H3: Installationsmeldungen für benutzerdefinierte Plugins
  - H2: Wenn der verschlüsselte Verlauf weiterhin nicht zurückkehrt
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
  - H2: Homeserver-Hinweise
  - H2: Verwandte Themen

## channels/matrix.md

- Route: /channels/matrix
- Überschriften:
  - H2: Installieren
  - H2: Einrichten
  - H3: Interaktive Einrichtung
  - H3: Minimale Konfiguration
  - H3: Automatischer Beitritt
  - H3: Zielformate für die Allowlist
  - H3: Normalisierung der Konto-ID
  - H3: Zwischengespeicherte Anmeldedaten
  - H3: Umgebungsvariablen
  - H2: Konfigurationsbeispiel
  - H2: Streaming-Vorschauen
  - H2: Sprachnachrichten
  - H2: Genehmigungsmetadaten
  - H3: Selbst gehostete Push-Regeln für ruhige finalisierte Vorschauen
  - H2: Bot-zu-Bot-Räume
  - H2: Verschlüsselung und Verifizierung
  - H3: Verschlüsselung aktivieren
  - H3: Status- und Vertrauenssignale
  - H3: Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren
  - H3: Cross-Signing initialisieren oder reparieren
  - H3: Raumschlüssel-Backup
  - H3: Verifizierungen auflisten, anfordern und beantworten
  - H3: Hinweise zu mehreren Konten
  - H2: Profilverwaltung
  - H2: Threads
  - H3: Sitzungsrouting (sessionScope)
  - H3: Antwort-Threading (threadReplies)
  - H3: Thread-Vererbung und Slash-Befehle
  - H2: ACP-Konversationsbindungen
  - H3: Thread-Bindungskonfiguration
  - H2: Reaktionen
  - H2: Verlaufskontext
  - H2: Kontextsichtbarkeit
  - H2: DM- und Raumrichtlinie
  - H2: Reparatur direkter Räume
  - H2: Exec-Genehmigungen
  - H2: Slash-Befehle
  - H2: Mehrere Konten
  - H2: Private/LAN-Homeserver
  - H2: Matrix-Datenverkehr proxyn
  - H2: Zielauflösung
  - H2: Konfigurationsreferenz
  - H3: Konto und Verbindung
  - H3: Verschlüsselung
  - H3: Zugriff und Richtlinie
  - H3: Antwortverhalten
  - H3: Reaktionseinstellungen
  - H3: Tooling und raumspezifische Überschreibungen
  - H3: Einstellungen für Exec-Genehmigungen
  - H2: Verwandte Themen

## channels/mattermost.md

- Route: /channels/mattermost
- Überschriften:
  - H2: Installieren
  - H2: Schnelleinrichtung
  - H2: Native Slash-Befehle
  - H2: Umgebungsvariablen (Standardkonto)
  - H2: Chatmodi
  - H2: Threading und Sitzungen
  - H2: Zugriffskontrolle (DMs)
  - H2: Kanäle (Gruppen)
  - H2: Ziele für ausgehende Zustellung
  - H2: Wiederholung für DM-Kanal
  - H2: Vorschau-Streaming
  - H2: Reaktionen (Nachrichtentool)
  - H2: Interaktive Buttons (Nachrichtentool)
  - H3: Direkte API-Integration (externe Skripte)
  - H2: Verzeichnisadapter
  - H2: Mehrere Konten
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/msteams.md

- Route: /channels/msteams
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Schnelleinrichtung
  - H2: Ziele
  - H2: Konfigurationsschreibvorgänge
  - H2: Zugriffskontrolle (DMs + Gruppen)
  - H3: Funktionsweise
  - H3: Schritt 1: Azure Bot erstellen
  - H3: Schritt 2: Anmeldedaten abrufen
  - H3: Schritt 3: Messaging-Endpunkt konfigurieren
  - H3: Schritt 4: Teams-Kanal aktivieren
  - H3: Schritt 5: Teams-App-Manifest erstellen
  - H3: Schritt 6: OpenClaw konfigurieren
  - H3: Schritt 7: Gateway ausführen
  - H2: Föderierte Authentifizierung (Zertifikat plus verwaltete Identität)
  - H3: Option A: Zertifikatbasierte Authentifizierung
  - H3: Option B: Azure Managed Identity
  - H3: AKS Workload Identity-Einrichtung
  - H3: Vergleich der Authentifizierungstypen
  - H2: Lokale Entwicklung (Tunneling)
  - H2: Den Bot testen
  - H2: Umgebungsvariablen
  - H2: Aktion für Mitgliederinformationen
  - H2: Verlaufskontext
  - H2: Aktuelle Teams-RSC-Berechtigungen (Manifest)
  - H2: Beispiel für ein Teams-Manifest (redigiert)
  - H3: Manifest-Hinweise (Pflichtfelder)
  - H3: Eine vorhandene App aktualisieren
  - H2: Funktionen: nur RSC vs. Graph
  - H3: Nur mit Teams RSC (App installiert, keine Graph-API-Berechtigungen)
  - H3: Mit Teams RSC + Microsoft Graph-Anwendungsberechtigungen
  - H3: RSC vs. Graph API
  - H2: Graph-gestützte Medien + Verlauf (für Kanäle erforderlich)
  - H2: Bekannte Einschränkungen
  - H3: Webhook-Timeouts
  - H3: Teams-Cloud- und Dienst-URL-Unterstützung
  - H3: Formatierung
  - H2: Konfiguration
  - H2: Routing und Sitzungen
  - H2: Antwortstil: Threads vs. Beiträge
  - H3: Auflösungsreihenfolge
  - H3: Beibehaltung des Thread-Kontexts
  - H2: Anhänge und Bilder
  - H2: Dateien in Gruppenchats senden
  - H3: Warum Gruppenchats SharePoint benötigen
  - H3: Einrichtung
  - H3: Freigabeverhalten
  - H3: Fallback-Verhalten
  - H3: Speicherort für Dateien
  - H2: Umfragen (Adaptive Cards)
  - H2: Präsentationskarten
  - H2: Zielformate
  - H2: Proaktives Messaging
  - H2: Team- und Kanal-IDs (häufiger Stolperstein)
  - H2: Private Kanäle
  - H2: Fehlerbehebung
  - H3: Häufige Probleme
  - H3: Manifest-Uploadfehler
  - H3: RSC-Berechtigungen funktionieren nicht
  - H2: Referenzen
  - H2: Verwandte Themen

## channels/nextcloud-talk.md

- Route: /channels/nextcloud-talk
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Schnelleinrichtung (Einsteiger)
  - H2: Hinweise
  - H2: Zugriffskontrolle (DMs)
  - H2: Räume (Gruppen)
  - H2: Funktionen
  - H2: Konfigurationsreferenz (Nextcloud Talk)
  - H2: Verwandte Themen

## channels/nostr.md

- Route: /channels/nostr
- Überschriften:
  - H2: Gebündeltes Plugin
  - H3: Ältere/benutzerdefinierte Installationen
  - H3: Nicht interaktive Einrichtung
  - H2: Schnelleinrichtung
  - H2: Konfigurationsreferenz
  - H2: Profilmetadaten
  - H2: Zugriffskontrolle
  - H3: DM-Richtlinien
  - H3: Allowlist-Beispiel
  - H2: Schlüsselformate
  - H2: Relays
  - H2: Protokollunterstützung
  - H2: Testen
  - H3: Lokaler Relay
  - H3: Manueller Test
  - H2: Fehlerbehebung
  - H3: Nachrichten werden nicht empfangen
  - H3: Antworten werden nicht gesendet
  - H3: Doppelte Antworten
  - H2: Sicherheit
  - H2: Einschränkungen (MVP)
  - H2: Verwandte Themen

## channels/pairing.md

- Route: /channels/pairing
- Überschriften:
  - H2: 1) DM-Pairing (eingehender Chat-Zugriff)
  - H3: Absender genehmigen
  - H3: Wiederverwendbare Absendergruppen
  - H3: Wo der Zustand gespeichert ist
  - H2: 2) Node-Geräte-Pairing (iOS-/Android-/macOS-/headless Nodes)
  - H3: Pairing über Telegram (für iOS empfohlen)
  - H3: Node-Gerät genehmigen
  - H3: Optionale automatische Genehmigung für vertrauenswürdige CIDR-Nodes
  - H3: Zustandsspeicher für Node-Pairing
  - H3: Hinweise
  - H2: Verwandte Dokumentation

## channels/qa-channel.md

- Route: /channels/qa-channel
- Überschriften:
  - H2: Was es tut
  - H2: Konfiguration
  - H2: Runner
  - H2: Verwandte Themen

## channels/qqbot.md

- Route: /channels/qqbot
- Überschriften:
  - H2: Installieren
  - H2: Einrichten
  - H2: Konfigurieren
  - H3: Einrichtung mehrerer Konten
  - H3: Gruppenchats
  - H3: Sprache (STT / TTS)
  - H2: Zielformate
  - H2: Slash-Befehle
  - H2: Engine-Architektur
  - H2: Onboarding per QR-Code
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/raft.md

- Route: /channels/raft
- Überschriften:
  - H2: Installieren
  - H2: Voraussetzungen
  - H2: Konfigurieren
  - H2: Funktionsweise
  - H2: Überprüfen
  - H2: Fehlerbehebung
  - H2: Referenzen

## channels/signal.md

- Route: /channels/signal
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schnelleinrichtung (Einsteiger)
  - H2: Worum es sich handelt
  - H2: Konfigurationsschreibvorgänge
  - H2: Das Nummernmodell (wichtig)
  - H2: Einrichtungspfad A: vorhandenes Signal-Konto verknüpfen (QR)
  - H2: Einrichtungspfad B: dedizierte Bot-Nummer registrieren (SMS, Linux)
  - H2: Externer Daemon-Modus (httpUrl)
  - H2: Container-Modus (bbernhard/signal-cli-rest-api)
  - H2: Zugriffskontrolle (DMs + Gruppen)
  - H2: Funktionsweise (Verhalten)
  - H2: Medien + Limits
  - H2: Tippen + Lesebestätigungen
  - H2: Reaktionen (Nachrichtentool)
  - H2: Genehmigungsreaktionen
  - H2: Zustellziele (CLI/Cron)
  - H2: Fehlerbehebung
  - H2: Sicherheitshinweise
  - H2: Konfigurationsreferenz (Signal)
  - H2: Verwandte Themen

## channels/slack.md

- Route: /channels/slack
- Überschriften:
  - H2: Socket Mode oder HTTP Request URLs auswählen
  - H3: Relay-Modus
  - H2: Installieren
  - H2: Schnelleinrichtung
  - H2: Socket Mode-Transport abstimmen
  - H2: Checkliste für Manifest und Scopes
  - H3: Zusätzliche Manifest-Einstellungen
  - H2: Token-Modell
  - H2: Aktionen und Gates
  - H2: Zugriffskontrolle und Routing
  - H2: Threading, Sitzungen und Antwort-Tags
  - H2: Bestätigungsreaktionen
  - H3: Emoji (ackReaction)
  - H3: Scope (messages.ackReactionScope)
  - H2: Text-Streaming
  - H2: Fallback für Tippreaktion
  - H2: Medien, Chunking und Zustellung
  - H2: Befehle und Slash-Verhalten
  - H2: Interaktive Antworten
  - H3: Plugin-eigene Modal-Übermittlungen
  - H2: Native Genehmigungen in Slack
  - H2: Ereignisse und Betriebsverhalten
  - H2: Konfigurationsreferenz
  - H2: Fehlerbehebung
  - H2: Attachment Vision-Referenz
  - H3: Unterstützte Medientypen
  - H3: Eingehende Pipeline
  - H3: Vererbung von Anhängen aus Thread-Roots
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
  - H3: Private Nummer nur mit Allowlist
  - H3: Absender des Messaging Service
  - H3: Standardziel für ausgehende Nachrichten
  - H2: Zugriffskontrolle
  - H2: SMS senden
  - H2: Einrichtung überprüfen
  - H3: End-to-End-Test von macOS iMessage/SMS
  - H2: Webhook-Sicherheit
  - H2: Konfiguration mehrerer Konten
  - H2: Fehlerbehebung
  - H3: Twilio gibt 403 zurück oder OpenClaw lehnt den Webhook ab
  - H3: Keine Pairing-Anfrage erscheint
  - H3: Ausgehendes Senden schlägt fehl
  - H3: Nachrichten kommen an, aber der Agent antwortet nicht

## channels/synology-chat.md

- Route: /channels/synology-chat
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Schnelleinrichtung
  - H2: Umgebungsvariablen
  - H2: DM-Richtlinie und Zugriffskontrolle
  - H2: Ausgehende Zustellung
  - H2: Mehrere Konten
  - H2: Sicherheitshinweise
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/telegram.md

- Route: /channels/telegram
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Einstellungen auf Telegram-Seite
  - H2: Zugriffskontrolle und Aktivierung
  - H3: Gruppen-Bot-Identität
  - H2: Laufzeitverhalten
  - H2: Funktionsreferenz
  - H2: Steuerung von Fehlerantworten
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/tlon.md

- Route: /channels/tlon
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Einrichtung
  - H2: Private/LAN-Schiffe
  - H2: Gruppenkanäle
  - H2: Zugriffskontrolle
  - H2: Eigentümer- und Genehmigungssystem
  - H2: Einstellungen für automatische Annahme
  - H2: Zustellziele (CLI/Cron)
  - H2: Gebündelte Skill
  - H2: Funktionen
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz
  - H2: Hinweise
  - H2: Verwandte Themen

## channels/troubleshooting.md

- Route: /channels/troubleshooting
- Überschriften:
  - H2: Befehlsleiter
  - H2: Nach einem Update
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
  - H3: QQ Bot-Fehlersignaturen
  - H2: Matrix
  - H3: Matrix-Fehlersignaturen
  - H2: Verwandte Themen

## channels/twitch.md

- Route: /channels/twitch
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Schnelle Einrichtung (Einsteiger)
  - H2: Was es ist
  - H2: Einrichtung (detailliert)
  - H3: Zugangsdaten generieren
  - H3: Bot konfigurieren
  - H3: Zugriffskontrolle (empfohlen)
  - H2: Token-Aktualisierung (optional)
  - H2: Unterstützung für mehrere Konten
  - H2: Zugriffskontrolle
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H3: Kontokonfiguration
  - H3: Provider-Optionen
  - H2: Tool-Aktionen
  - H2: Sicherheit und Betrieb
  - H2: Grenzen
  - H2: Verwandt

## channels/wechat.md

- Route: /channels/wechat
- Überschriften:
  - H2: Benennung
  - H2: Funktionsweise
  - H2: Installieren
  - H2: Anmelden
  - H2: Zugriffskontrolle
  - H2: Kompatibilität
  - H2: Sidecar-Prozess
  - H2: Fehlerbehebung
  - H2: Verwandte Dokumentation

## channels/whatsapp.md

- Route: /channels/whatsapp
- Überschriften:
  - H2: Installation (bei Bedarf)
  - H2: Schnelle Einrichtung
  - H2: Bereitstellungsmuster
  - H2: Laufzeitmodell
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
  - H2: Reaktionen auf Lebenszyklusstatus
  - H2: Mehrere Konten und Zugangsdaten
  - H2: Tools, Aktionen und Konfigurationsschreibvorgänge
  - H2: Fehlerbehebung
  - H2: System-Prompts
  - H2: Verweise zur Konfigurationsreferenz
  - H2: Verwandt

## channels/yuanbao.md

- Route: /channels/yuanbao
- Überschriften:
  - H2: Schnellstart
  - H3: Interaktive Einrichtung (Alternative)
  - H2: Zugriffskontrolle
  - H3: Direktnachrichten
  - H3: Gruppenchats
  - H2: Konfigurationsbeispiele
  - H3: Grundeinrichtung mit offener DM-Richtlinie
  - H3: DMs auf bestimmte Benutzer beschränken
  - H3: @mention-Anforderung in Gruppen deaktivieren
  - H3: Ausgehende Nachrichtenzustellung optimieren
  - H3: Strategie zum Zusammenführen von Text abstimmen
  - H2: Häufige Befehle
  - H2: Fehlerbehebung
  - H3: Bot antwortet nicht in Gruppenchats
  - H3: Bot empfängt keine Nachrichten
  - H3: Bot sendet leere oder Fallback-Antworten
  - H3: App Secret offengelegt
  - H2: Erweiterte Konfiguration
  - H3: Mehrere Konten
  - H3: Nachrichtengrenzen
  - H3: Streaming
  - H3: Kontext des Gruppenchatverlaufs
  - H3: Reply-to-Modus
  - H3: Markdown-Hinweisinjektion
  - H3: Debug-Modus
  - H3: Multi-Agent-Routing
  - H2: Konfigurationsreferenz
  - H2: Unterstützte Nachrichtentypen
  - H3: Empfangen
  - H3: Senden
  - H3: Threads und Antworten
  - H2: Verwandt

## channels/zalo.md

- Route: /channels/zalo
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Schnelle Einrichtung (Einsteiger)
  - H2: Was es ist
  - H2: Einrichtung (schneller Pfad)
  - H3: 1) Bot-Token erstellen (Zalo Bot Platform)
  - H3: 2) Token konfigurieren (Umgebung oder Konfiguration)
  - H2: Funktionsweise (Verhalten)
  - H2: Grenzen
  - H2: Zugriffskontrolle (DMs)
  - H3: DM-Zugriff
  - H2: Zugriffskontrolle (Gruppen)
  - H2: Long-Polling vs. Webhook
  - H2: Unterstützte Nachrichtentypen
  - H2: Fähigkeiten
  - H2: Zustellungsziele (CLI/cron)
  - H2: Fehlerbehebung
  - H2: Konfigurationsreferenz (Zalo)
  - H2: Verwandt

## channels/zaloclawbot.md

- Route: /channels/zaloclawbot
- Überschriften:
  - H2: Kompatibilität
  - H2: Voraussetzungen
  - H2: Mit Onboard installieren (empfohlen)
  - H2: Manuelle Installation
  - H3: 1. Plugin installieren
  - H3: 2. Plugin in der Konfiguration aktivieren
  - H3: 3. QR-Code generieren und anmelden
  - H3: 4. Gateway neu starten
  - H2: Funktionsweise
  - H2: Unter der Haube
  - H2: Fehlerbehebung

## channels/zalouser.md

- Route: /channels/zalouser
- Überschriften:
  - H2: Gebündeltes Plugin
  - H2: Schnelle Einrichtung (Einsteiger)
  - H2: Was es ist
  - H2: Benennung
  - H2: IDs finden (Verzeichnis)
  - H2: Grenzen
  - H2: Zugriffskontrolle (DMs)
  - H2: Gruppenzugriff (optional)
  - H3: Gruppen-Erwähnungs-Gating
  - H2: Mehrere Konten
  - H2: Umgebungsvariablen
  - H2: Tippen, Reaktionen und Zustellbestätigungen
  - H2: Fehlerbehebung
  - H2: Verwandt

## ci.md

- Route: /ci
- Überschriften:
  - H2: Pipeline-Übersicht
  - H2: Fail-Fast-Reihenfolge
  - H2: PR-Kontext und Nachweise
  - H2: Umfang und Routing
  - H2: Weiterleitung von ClawSweeper-Aktivitäten
  - H2: Manuelle Dispatches
  - H2: Runner
  - H2: Runner-Registrierungsbudget
  - H2: Lokale Entsprechungen
  - H2: OpenClaw Performance
  - H2: Vollständige Release-Validierung
  - H2: Live- und E2E-Shards
  - H2: Paketakzeptanz
  - H3: Jobs
  - H3: Kandidatenquellen
  - H3: Suite-Profile
  - H3: Legacy-Kompatibilitätsfenster
  - H3: Beispiele
  - H2: Installations-Smoke
  - H2: Lokales Docker-E2E
  - H3: Einstellbare Parameter
  - H3: Wiederverwendbarer Live-/E2E-Workflow
  - H3: Release-Pfad-Abschnitte
  - H2: Plugin-Vorabversion
  - H2: QA-Lab
  - H2: CodeQL
  - H3: Sicherheitskategorien
  - H3: Plattformspezifische Sicherheits-Shards
  - H3: Critical-Quality-Kategorien
  - H2: Wartungs-Workflows
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: Doppelte PRs nach dem Merge
  - H2: Lokale Prüfgates und Änderungsrouting
  - H2: Testbox-Validierung
  - H2: Verwandt

## clawhub/cli.md

- Route: /clawhub/cli
- Überschriften:
  - H1: ClawHub CLI
  - H2: Entdecken und installieren
  - H2: Veröffentlichen und warten
  - H2: Verwandt

## clawhub/publishing.md

- Route: /clawhub/publishing
- Überschriften:
  - H1: Auf ClawHub veröffentlichen
  - H2: Besitzer
  - H2: Skills
  - H2: Plugins
  - H2: Release-Ablauf
  - H2: FAQ
  - H3: Paket-Scope muss dem ausgewählten Besitzer entsprechen

## cli/acp.md

- Route: /cli/acp
- Überschriften:
  - H2: Was dies nicht ist
  - H2: Kompatibilitätsmatrix
  - H2: Bekannte Einschränkungen
  - H2: Verwendung
  - H2: ACP-Client (Debug)
  - H2: Protokoll-Smoke-Test
  - H2: So verwenden Sie dies
  - H2: Agenten auswählen
  - H2: Verwendung aus acpx (Codex, Claude, andere ACP-Clients)
  - H2: Einrichtung des Zed-Editors
  - H2: Sitzungszuordnung
  - H2: Optionen
  - H3: acp-Client-Optionen
  - H2: Verwandt

## cli/agent.md

- Route: /cli/agent
- Überschriften:
  - H1: openclaw agent
  - H2: Optionen
  - H2: Beispiele
  - H2: Hinweise
  - H2: JSON-Zustellstatus
  - H2: Verwandt

## cli/agents.md

- Route: /cli/agents
- Überschriften:
  - H1: openclaw agents
  - H2: Beispiele
  - H2: Routing-Bindungen
  - H3: --bind-Format
  - H3: Verhalten des Bindungsumfangs
  - H2: Befehlsoberfläche
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: Identitätsdateien
  - H2: Identität festlegen
  - H2: Verwandt

## cli/approvals.md

- Route: /cli/approvals
- Überschriften:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Häufige Befehle
  - H2: Genehmigungen aus einer Datei ersetzen
  - H2: "Nie nachfragen" / YOLO-Beispiel
  - H2: Allowlist-Helfer
  - H2: Häufige Optionen
  - H2: Hinweise
  - H2: Verwandt

## cli/backup.md

- Route: /cli/backup
- Überschriften:
  - H1: openclaw backup
  - H2: Hinweise
  - H2: Was gesichert wird
  - H2: Verhalten bei ungültiger Konfiguration
  - H2: Größe und Leistung
  - H2: Verwandt

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
  - H2: Snapshot / Screenshot / Aktionen
  - H2: Zustand und Speicherung
  - H2: Debugging
  - H2: Vorhandenes Chrome über MCP
  - H2: Remote-Browsersteuerung (Node-Host-Proxy)
  - H2: Verwandt

## cli/channels.md

- Route: /cli/channels
- Überschriften:
  - H1: openclaw channels
  - H2: Häufige Befehle
  - H2: Status / Fähigkeiten / Auflösen / Logs
  - H2: Konten hinzufügen / entfernen
  - H2: Anmelden und abmelden (interaktiv)
  - H2: Fehlerbehebung
  - H2: Fähigkeitsprobe
  - H2: Namen in IDs auflösen
  - H2: Verwandt

## cli/clawbot.md

- Route: /cli/clawbot
- Überschriften:
  - H1: openclaw clawbot
  - H2: Migration
  - H2: Verwandt

## cli/commitments.md

- Route: /cli/commitments
- Überschriften:
  - H2: Verwendung
  - H2: Optionen
  - H2: Beispiele
  - H2: Ausgabe
  - H2: Verwandt

## cli/completion.md

- Route: /cli/completion
- Überschriften:
  - H1: openclaw completion
  - H2: Verwendung
  - H2: Optionen
  - H2: Hinweise
  - H2: Verwandt

## cli/config.md

- Route: /cli/config
- Überschriften:
  - H2: Root-Optionen
  - H2: Beispiele
  - H3: config-Schema
  - H3: Pfade
  - H2: Werte
  - H2: config set-Modi
  - H2: config patch
  - H2: Provider-Builder-Flags
  - H2: Probelauf
  - H3: JSON-Ausgabeform
  - H2: Schreibsicherheit
  - H2: Unterbefehle
  - H2: Validieren
  - H2: Verwandt

## cli/configure.md

- Route: /cli/configure
- Überschriften:
  - H1: openclaw configure
  - H2: Optionen
  - H2: Beispiele
  - H2: Verwandt

## cli/crestodian.md

- Route: /cli/crestodian
- Überschriften:
  - H1: openclaw crestodian
  - H2: Was Crestodian anzeigt
  - H2: Beispiele
  - H2: Sicherer Start
  - H2: Betrieb und Genehmigung
  - H2: Setup-Bootstrap
  - H2: Modellgestützter Planer
  - H2: Zu einem Agenten wechseln
  - H2: Nachrichtenrettungsmodus
  - H2: Verwandt

## cli/cron.md

- Route: /cli/cron
- Überschriften:
  - H1: openclaw cron
  - H2: Jobs schnell erstellen
  - H2: Sitzungen
  - H2: Zustellung
  - H3: Zustellungsverantwortung
  - H3: Fehlerzustellung
  - H2: Planung
  - H3: Einmalige Jobs
  - H3: Wiederkehrende Jobs
  - H3: Manuelle Ausführungen
  - H2: Modelle
  - H3: Priorität isolierter Cron-Modelle
  - H3: Schnellmodus
  - H3: Wiederholungen beim Live-Modellwechsel
  - H2: Ausführungsausgabe und Ablehnungen
  - H3: Unterdrückung veralteter Bestätigungen
  - H3: Unterdrückung stummer Tokens
  - H3: Strukturierte Ablehnungen
  - H2: Aufbewahrung
  - H2: Ältere Jobs migrieren
  - H2: Häufige Bearbeitungen
  - H2: Häufige Admin-Befehle
  - H2: Verwandt

## cli/daemon.md

- Route: /cli/daemon
- Überschriften:
  - H1: openclaw daemon
  - H2: Verwendung
  - H2: Unterbefehle
  - H2: Häufige Optionen
  - H2: Bevorzugen
  - H2: Verwandt

## cli/dashboard.md

- Route: /cli/dashboard
- Überschriften:
  - H1: openclaw dashboard
  - H2: Verwandt

## cli/devices.md

- Route: /cli/devices
- Überschriften:
  - H1: openclaw devices
  - H2: Befehle
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Paperclip / openclawgateway-Genehmigung beim ersten Start
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: Häufige Optionen
  - H2: Hinweise
  - H2: Checkliste zur Wiederherstellung bei Token-Drift
  - H2: Verwandt

## cli/directory.md

- Route: /cli/directory
- Überschriften:
  - H1: openclaw directory
  - H2: Häufige Flags
  - H2: Hinweise
  - H2: Ergebnisse mit Nachrichtensendung verwenden
  - H2: ID-Formate (nach Kanal)
  - H2: Selbst ("me")
  - H2: Peers (Kontakte/Benutzer)
  - H2: Gruppen
  - H2: Verwandt

## cli/dns.md

- Route: /cli/dns
- Überschriften:
  - H1: openclaw dns
  - H2: Einrichtung
  - H2: dns setup
  - H2: Verwandt

## cli/docs.md

- Route: /cli/docs
- Überschriften:
  - H1: openclaw docs
  - H2: Verwendung
  - H2: Beispiele
  - H2: Funktionsweise
  - H2: Ausgabe
  - H2: Exit-Codes
  - H2: Verwandt

## cli/doctor.md

- Route: /cli/doctor
- Überschriften:
  - H1: openclaw doctor
  - H2: Warum Sie es verwenden sollten
  - H2: Beispiele
  - H2: Optionen
  - H2: Lint-Modus
  - H2: Strukturierte Gesundheitsprüfungen
  - H2: Prüfauswahl
  - H2: Post-Upgrade-Modus
  - H2: macOS: launchctl-Umgebungsüberschreibungen
  - H2: Verwandt

## cli/flows.md

- Route: /cli/flows
- Überschriften:
  - H1: openclaw tasks flow
  - H2: Unterbefehle
  - H3: Statusfilterwerte
  - H2: Beispiele
  - H2: Verwandt

## cli/gateway.md

- Route: /cli/gateway
- Überschriften:
  - H2: Gateway ausführen
  - H3: Optionen
  - H2: Gateway neu starten
  - H3: Gateway-Profiling
  - H2: Laufendes Gateway abfragen
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Remote über SSH (Parität mit Mac-App)
  - H3: gateway call
  - H2: Gateway-Dienst verwalten
  - H3: Mit Wrapper installieren
  - H2: Gateways entdecken (Bonjour)
  - H3: gateway discover
  - H2: Verwandt

## cli/health.md

- Route: /cli/health
- Überschriften:
  - H1: openclaw health
  - H2: Optionen
  - H2: Verwandt

## cli/hooks.md

- Route: /cli/hooks
- Überschriften:
  - H1: openclaw hooks
  - H2: Alle Hooks auflisten
  - H2: Hook-Informationen abrufen
  - H2: Hook-Berechtigung prüfen
  - H2: Einen Hook aktivieren
  - H2: Einen Hook deaktivieren
  - H2: Hinweise
  - H2: Hook-Pakete installieren
  - H2: Hook-Pakete aktualisieren
  - H2: Mitgelieferte Hooks
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Verwandte Themen

## cli/index.md

- Route: /cli
- Überschriften:
  - H2: Befehlsseiten
  - H2: Globale Flags
  - H2: Ausgabemodi
  - H2: Befehlsbaum
  - H2: Chat-Slash-Befehle
  - H2: Nutzungsverfolgung
  - H2: Verwandte Themen

## cli/infer.md

- Route: /cli/infer
- Überschriften:
  - H2: infer in eine Skill umwandeln
  - H2: Warum infer verwenden
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
  - H2: Häufige Stolperfallen
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/logs.md

- Route: /cli/logs
- Überschriften:
  - H1: openclaw logs
  - H2: Optionen
  - H2: Gemeinsame Gateway-RPC-Optionen
  - H2: Beispiele
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/mcp.md

- Route: /cli/mcp
- Überschriften:
  - H2: Den richtigen MCP-Pfad wählen
  - H2: OpenClaw als MCP-Server
  - H3: Wann serve verwendet werden sollte
  - H3: Funktionsweise
  - H3: Client-Modus auswählen
  - H3: Was serve bereitstellt
  - H3: Nutzung
  - H3: Bridge-Tools
  - H3: Ereignismodell
  - H3: Claude-Kanalbenachrichtigungen
  - H3: MCP-Client-Konfiguration
  - H3: Optionen
  - H3: Sicherheits- und Vertrauensgrenze
  - H3: Tests
  - H3: Fehlerbehebung
  - H2: OpenClaw als MCP-Client-Registry
  - H3: Gespeicherte MCP-Serverdefinitionen
  - H3: Häufige Serverrezepte
  - H3: JSON-Ausgabeformen
  - H3: Stdio-Transport
  - H3: SSE-/HTTP-Transport
  - H3: OAuth-Workflow
  - H3: Streamable-HTTP-Transport
  - H2: Control UI
  - H2: Aktuelle Einschränkungen
  - H2: Verwandte Themen

## cli/memory.md

- Route: /cli/memory
- Überschriften:
  - H1: openclaw memory
  - H2: Beispiele
  - H2: Optionen
  - H2: Dreaming
  - H2: Verwandte Themen

## cli/message.md

- Route: /cli/message
- Überschriften:
  - H1: openclaw message
  - H2: Nutzung
  - H2: Häufige Flags
  - H2: SecretRef-Verhalten
  - H2: Aktionen
  - H3: Kern
  - H3: Threads
  - H3: Emojis
  - H3: Sticker
  - H3: Rollen / Kanäle / Mitglieder / Sprache
  - H3: Ereignisse
  - H3: Moderation (Discord)
  - H3: Broadcast
  - H2: Beispiele
  - H2: Verwandte Themen

## cli/migrate.md

- Route: /cli/migrate
- Überschriften:
  - H1: openclaw migrate
  - H2: Befehle
  - H2: Sicherheitsmodell
  - H2: Claude-Provider
  - H3: Was Claude importiert
  - H3: Archiv- und manueller Prüfstatus
  - H2: Codex-Provider
  - H3: Was Codex importiert
  - H3: Codex-Status für manuelle Prüfung
  - H2: Hermes-Provider
  - H3: Was Hermes importiert
  - H3: Unterstützte .env-Schlüssel
  - H3: Reiner Archivstatus
  - H3: Nach dem Anwenden
  - H2: Plugin-Vertrag
  - H2: Onboarding-Integration
  - H2: Verwandte Themen

## cli/models.md

- Route: /cli/models
- Überschriften:
  - H1: openclaw models
  - H2: Häufige Befehle
  - H3: Modelle scannen
  - H3: Modellstatus
  - H2: Aliasse + Fallbacks
  - H2: Auth-Profile
  - H2: Verwandte Themen

## cli/node.md

- Route: /cli/node
- Überschriften:
  - H1: openclaw node
  - H2: Warum einen Node-Host verwenden?
  - H2: Browser-Proxy (ohne Konfiguration)
  - H2: Ausführen (Vordergrund)
  - H2: Gateway-Authentifizierung für Node-Host
  - H2: Dienst (Hintergrund)
  - H2: Kopplung
  - H2: Exec-Genehmigungen
  - H2: Verwandte Themen

## cli/nodes.md

- Route: /cli/nodes
- Überschriften:
  - H1: openclaw nodes
  - H2: Häufige Befehle
  - H2: Aufrufen
  - H2: Verwandte Themen

## cli/onboard.md

- Route: /cli/onboard
- Überschriften:
  - H1: openclaw onboard
  - H2: Verwandte Anleitungen
  - H2: Beispiele
  - H2: Gebietsschema
  - H3: Nicht interaktive Z.AI-Endpunktoptionen
  - H2: Hinweise zum Ablauf
  - H2: Häufige Folge-Befehle

## cli/pairing.md

- Route: /cli/pairing
- Überschriften:
  - H1: openclaw pairing
  - H2: Befehle
  - H2: pairing list
  - H2: pairing approve
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/path.md

- Route: /cli/path
- Überschriften:
  - H1: openclaw path
  - H2: Warum verwenden
  - H2: Wie es verwendet wird
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
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: Exit-Codes
  - H2: Ausgabemodus
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/plugins.md

- Route: /cli/plugins
- Überschriften:
  - H2: Befehle
  - H3: Author
  - H3: Provider-Gerüst
  - H3: Installieren
  - H4: Marketplace-Kurzform
  - H3: Auflisten
  - H3: Plugin-Index
  - H3: Deinstallieren
  - H3: Aktualisieren
  - H3: Untersuchen
  - H3: Doctor
  - H3: Registry
  - H3: Marketplace
  - H2: Verwandte Themen

## cli/policy.md

- Route: /cli/policy
- Überschriften:
  - H1: openclaw policy
  - H2: Schnellstart
  - H3: Referenz für Richtlinienregeln
  - H4: Bereichsbezogene Overlays
  - H4: Kanäle
  - H4: MCP-Server
  - H4: Modell-Provider
  - H4: Netzwerk
  - H4: Ingress- und Kanalzugriff
  - H4: Gateway
  - H4: Agent-Arbeitsbereich
  - H4: Sandbox-Haltung
  - H4: Datenverarbeitung
  - H4: Secrets
  - H4: Exec-Genehmigungen
  - H4: Auth-Profile
  - H4: Tool-Metadaten
  - H4: Tool-Haltung
  - H2: Richtlinie konfigurieren
  - H2: Richtlinienstatus akzeptieren
  - H2: Befunde
  - H2: Reparieren
  - H2: Exit-Codes
  - H2: Verwandte Themen

## cli/proxy.md

- Route: /cli/proxy
- Überschriften:
  - H1: openclaw proxy
  - H2: Befehle
  - H2: Validieren
  - H2: Abfragevoreinstellungen
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/qr.md

- Route: /cli/qr
- Überschriften:
  - H1: openclaw qr
  - H2: Nutzung
  - H2: Optionen
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/reset.md

- Route: /cli/reset
- Überschriften:
  - H1: openclaw reset
  - H2: Verwandte Themen

## cli/sandbox.md

- Route: /cli/sandbox
- Überschriften:
  - H2: Übersicht
  - H2: Befehle
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Anwendungsfälle
  - H3: Nach dem Aktualisieren eines Docker-Images
  - H3: Nach dem Ändern der Sandbox-Konfiguration
  - H3: Nach dem Ändern des SSH-Ziels oder SSH-Authentifizierungsmaterials
  - H3: Nach dem Ändern von OpenShell-Quelle, Richtlinie oder Modus
  - H3: Nach dem Ändern von setupCommand
  - H3: Nur für einen bestimmten Agent
  - H2: Warum dies erforderlich ist
  - H2: Registry-Migration
  - H2: Konfiguration
  - H2: Verwandte Themen

## cli/secrets.md

- Route: /cli/secrets
- Überschriften:
  - H1: openclaw secrets
  - H2: Runtime-Snapshot neu laden
  - H2: Audit
  - H2: Konfigurieren (interaktiver Helfer)
  - H2: Einen gespeicherten Plan anwenden
  - H2: Warum keine Rollback-Backups
  - H2: Beispiel
  - H2: Verwandte Themen

## cli/security.md

- Route: /cli/security
- Überschriften:
  - H1: openclaw security
  - H2: Audit
  - H2: JSON-Ausgabe
  - H2: Was --fix ändert
  - H2: Verwandte Themen

## cli/sessions.md

- Route: /cli/sessions
- Überschriften:
  - H1: openclaw sessions
  - H2: Bereinigungswartung
  - H2: Eine Sitzung komprimieren
  - H3: sessions.compact RPC
  - H2: Verwandte Themen

## cli/setup.md

- Route: /cli/setup
- Überschriften:
  - H1: openclaw setup
  - H2: Optionen
  - H3: Automatisches Auslösen des Assistenten
  - H2: Beispiele
  - H2: Hinweise
  - H2: Verwandte Themen

## cli/skills.md

- Route: /cli/skills
- Überschriften:
  - H1: openclaw skills
  - H2: Befehle
  - H2: Skill Workshop
  - H2: Verwandte Themen

## cli/status.md

- Route: /cli/status
- Überschriften:
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
  - H2: Nutzung
  - H2: Root-Optionen
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
  - H2: Viele Besprechungen pro Tag
  - H2: Fehlende Zusammenfassungen
  - H2: Konfiguration

## cli/tui.md

- Route: /cli/tui
- Überschriften:
  - H1: openclaw tui
  - H2: Optionen
  - H2: Beispiele
  - H2: Konfigurations-Reparaturschleife
  - H2: Verwandte Themen

## cli/uninstall.md

- Route: /cli/uninstall
- Überschriften:
  - H1: openclaw uninstall
  - H2: Verwandte Themen

## cli/update.md

- Route: /cli/update
- Überschriften:
  - H1: openclaw update
  - H2: Nutzung
  - H2: Optionen
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Was es tut
  - H3: Antwortform der Control Plane
  - H2: Git-Checkout-Ablauf
  - H3: Kanalauswahl
  - H3: Aktualisierungsschritte
  - H2: --update-Kurzform
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
  - H2: Logs und Metriken
  - H3: tail
  - H3: latency
  - H2: Webhooks bereitstellen
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
  - H3: gog-watch-serve-Optionen
  - H3: Tailscale-Freigabe
  - H3: Ausgabe
  - H2: webhooks gmail run
  - H2: End-to-End-Ablauf
  - H2: Verwandte Themen

## cli/wiki.md

- Route: /cli/wiki
- Überschriften:
  - H1: openclaw wiki
  - H2: Wofür es gedacht ist
  - H2: Häufige Befehle
  - H2: Befehle
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Praktische Nutzungshinweise
  - H2: Konfigurationsbezüge
  - H2: Verwandte Themen

## cli/workboard.md

- Route: /cli/workboard
- Überschriften:
  - H2: Nutzung
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Parität mit Slash-Befehlen
  - H2: Berechtigungen
  - H2: Fehlerbehebung
  - H3: Keine Karten erscheinen
  - H3: Dispatch meldet nur Daten
  - H3: Dispatch startet nichts
  - H2: Verwandte Themen

## concepts/active-memory.md

- Route: /concepts/active-memory
- Überschriften:
  - H2: Schnellstart
  - H2: Geschwindigkeitsempfehlungen
  - H3: Cerebras-Einrichtung
  - H2: Wie Sie es sehen
  - H2: Sitzungsumschaltung
  - H2: Wann es ausgeführt wird
  - H2: Sitzungstypen
  - H2: Wo es ausgeführt wird
  - H2: Warum es verwenden
  - H2: Funktionsweise
  - H2: Abfragemodi
  - H2: Prompt-Stile
  - H2: Modell-Fallback-Richtlinie
  - H2: Speicher-Tools
  - H3: Integrierter memory-core
  - H3: LanceDB-Speicher
  - H3: Lossless Claw
  - H2: Erweiterte Ausweichmöglichkeiten
  - H2: Transkriptpersistenz
  - H2: Konfiguration
  - H2: Empfohlene Einrichtung
  - H3: Toleranzzeit beim Kaltstart
  - H2: Debugging
  - H2: Häufige Probleme
  - H2: Verwandte Seiten

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- Überschriften:
  - H2: Einstiegspunkte
  - H2: Funktionsweise (übergeordnet)
  - H2: Warteschlange + Nebenläufigkeit
  - H2: Sitzungs- + Arbeitsbereichsvorbereitung
  - H2: Prompt-Zusammenstellung + System-Prompt
  - H2: Hook-Punkte (wo Sie eingreifen können)
  - H3: Interne Hooks (Gateway-Hooks)
  - H3: Plugin-Hooks (Agent- + Gateway-Lebenszyklus)
  - H2: Streaming + Teilantworten
  - H2: Tool-Ausführung + Messaging-Tools
  - H2: Antwortformung + Unterdrückung
  - H2: Compaction + Wiederholungsversuche
  - H2: Ereignisströme (heute)
  - H2: Chat-Kanalverarbeitung
  - H2: Timeouts
  - H2: Wo Dinge früh enden können
  - H2: Verwandte Themen

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- Überschriften:
  - H2: Codex-Oberflächen
  - H2: Runtime-Zuständigkeit
  - H2: Runtime-Auswahl
  - H2: GitHub-Copilot-Agent-Runtime
  - H2: Kompatibilitätsvertrag
  - H2: Statuslabels
  - H2: Verwandte Themen

## concepts/agent-workspace.md

- Route: /concepts/agent-workspace
- Überschriften:
  - H2: Standardort
  - H2: Zusätzliche Arbeitsbereichsordner
  - H2: Arbeitsbereichs-Dateizuordnung
  - H2: Was NICHT im Arbeitsbereich ist
  - H2: Git-Backup (empfohlen, privat)
  - H2: Secrets nicht committen
  - H2: Den Arbeitsbereich auf einen neuen Computer verschieben
  - H2: Erweiterte Hinweise
  - H2: Verwandte Themen

## concepts/agent.md

- Route: /concepts/agent
- Überschriften:
  - H2: Arbeitsbereich (erforderlich)
  - H2: Bootstrap-Dateien (injiziert)
  - H2: Integrierte Tools
  - H2: Skills
  - H2: Runtime-Grenzen
  - H2: Sitzungen
  - H2: Steuerung während des Streamings
  - H2: Modellreferenzen
  - H2: Konfiguration (minimal)
  - H2: Verwandt

## concepts/architecture.md

- Route: /concepts/architecture
- Überschriften:
  - H2: Überblick
  - H2: Komponenten und Abläufe
  - H3: Gateway (Daemon)
  - H3: Clients (Mac-App / CLI / Web-Admin)
  - H3: Nodes (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Verbindungslebenszyklus (einzelner Client)
  - H2: Übertragungsprotokoll (Zusammenfassung)
  - H2: Pairing + lokales Vertrauen
  - H2: Protokolltypisierung und Codegenerierung
  - H2: Remotezugriff
  - H2: Betriebsübersicht
  - H2: Invarianten
  - H2: Verwandt

## concepts/channel-docking.md

- Route: /concepts/channel-docking
- Überschriften:
  - H2: Beispiel
  - H2: Warum Sie es verwenden sollten
  - H2: Erforderliche Konfiguration
  - H2: Befehle
  - H2: Was sich ändert
  - H2: Was sich nicht ändert
  - H2: Fehlerbehebung

## concepts/commitments.md

- Route: /concepts/commitments
- Überschriften:
  - H2: Verpflichtungen aktivieren
  - H2: Funktionsweise
  - H2: Geltungsbereich
  - H2: Verpflichtungen vs Erinnerungen
  - H2: Verpflichtungen verwalten
  - H2: Datenschutz und Kosten
  - H2: Fehlerbehebung
  - H2: Verwandt

## concepts/compaction.md

- Route: /concepts/compaction
- Überschriften:
  - H2: Funktionsweise
  - H2: Automatische Compaction
  - H2: Manuelle Compaction
  - H2: Konfiguration
  - H3: Ein anderes Modell verwenden
  - H3: Bezeichnerbeibehaltung
  - H3: Byte-Schutz für aktives Transkript
  - H3: Nachfolge-Transkripte
  - H3: Compaction-Hinweise
  - H3: Speicher-Flush
  - H2: Austauschbare Compaction-Provider
  - H2: Compaction vs Bereinigung
  - H2: Fehlerbehebung
  - H2: Verwandt

## concepts/context-engine.md

- Route: /concepts/context-engine
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise
  - H3: Subagent-Lebenszyklus (optional)
  - H3: System-Prompt-Ergänzung
  - H2: Die Legacy-Engine
  - H2: Plugin-Engines
  - H3: Die ContextEngine-Schnittstelle
  - H3: Runtime-Einstellungen
  - H3: Host-Anforderungen
  - H3: Fehlerisolierung
  - H3: ownsCompaction
  - H2: Konfigurationsreferenz
  - H2: Beziehung zu Compaction und Memory
  - H2: Tipps
  - H2: Verwandt

## concepts/context.md

- Route: /concepts/context
- Überschriften:
  - H2: Schnellstart (Kontext prüfen)
  - H2: Beispielausgabe
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Was zum Kontextfenster zählt
  - H2: Wie OpenClaw den System-Prompt erstellt
  - H2: Injizierte Arbeitsbereichsdateien (Projektkontext)
  - H2: Skills: injiziert vs bei Bedarf geladen
  - H2: Tools: Es gibt zwei Kostenarten
  - H2: Befehle, Direktiven und „Inline-Kurzbefehle“
  - H2: Sitzungen, Compaction und Bereinigung (was bestehen bleibt)
  - H2: Was /context tatsächlich meldet
  - H2: Verwandt

## concepts/delegate-architecture.md

- Route: /concepts/delegate-architecture
- Überschriften:
  - H2: Was ist ein Delegate?
  - H2: Warum Delegates?
  - H2: Fähigkeitsstufen
  - H3: Stufe 1: Schreibgeschützt + Entwurf
  - H3: Stufe 2: Im Auftrag senden
  - H3: Stufe 3: Proaktiv
  - H2: Voraussetzungen: Isolation und Härtung
  - H3: Harte Sperren (nicht verhandelbar)
  - H3: Tool-Einschränkungen
  - H3: Sandbox-Isolation
  - H3: Audit-Trail
  - H2: Einen Delegate einrichten
  - H3: 1. Delegate-Agent erstellen
  - H3: 2. Identitäts-Provider-Delegation konfigurieren
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Delegate an Kanäle binden
  - H3: 4. Anmeldedaten zum Delegate-Agent hinzufügen
  - H2: Beispiel: Organisationsassistent
  - H2: Skalierungsmuster
  - H2: Verwandt

## concepts/dreaming.md

- Route: /concepts/dreaming
- Überschriften:
  - H2: Was Dreaming schreibt
  - H2: Phasenmodell
  - H2: Aufnahme von Sitzungstranskripten
  - H2: Dream Diary
  - H2: Tiefe Ranking-Signale
  - H2: Abdeckung des QA-Schattenversuchsberichts
  - H2: Zeitplanung
  - H2: Schnellstart
  - H2: Slash-Befehl
  - H2: CLI-Workflow
  - H2: Wichtige Standardwerte
  - H2: Dreams-UI
  - H2: Dreaming wird nie ausgeführt: Status zeigt blockiert
  - H2: Verwandt

## concepts/experimental-features.md

- Route: /concepts/experimental-features
- Überschriften:
  - H2: Derzeit dokumentierte Flags
  - H2: Schlanker Modus für lokales Modell
  - H3: Warum diese drei Tools
  - H3: Wann Sie ihn einschalten sollten
  - H3: Wann Sie ihn ausgeschaltet lassen sollten
  - H3: Aktivieren
  - H2: Experimentell bedeutet nicht versteckt
  - H2: Verwandt

## concepts/features.md

- Route: /concepts/features
- Überschriften:
  - H2: Highlights
  - H2: Vollständige Liste
  - H2: Verwandt

## concepts/mantis-slack-desktop-runbook.md

- Route: /concepts/mantis-slack-desktop-runbook
- Überschriften:
  - H2: Speichermodell
  - H2: GitHub-Dispatch
  - H2: Lokale CLI
  - H2: Hydrate-Modi
  - H2: Timing-Interpretation
  - H2: Evidenz-Checkliste
  - H2: Fehlerbehandlung
  - H2: Verwandt

## concepts/mantis.md

- Route: /concepts/mantis
- Überschriften:
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Ownership
  - H2: Befehlsform
  - H2: Ausführungslifecycle
  - H2: Discord-MVP
  - H2: Vorhandene QA-Bausteine
  - H2: Evidenzmodell
  - H2: Browser und VNC
  - H2: Maschinen
  - H2: Secrets
  - H2: GitHub-Artefakte und PR-Kommentare
  - H2: Private Bereitstellungshinweise
  - H2: Szenario hinzufügen
  - H2: Provider-Erweiterung
  - H2: Offene Fragen

## concepts/markdown-formatting.md

- Route: /concepts/markdown-formatting
- Überschriften:
  - H2: Ziele
  - H2: Pipeline
  - H2: IR-Beispiel
  - H2: Wo es verwendet wird
  - H2: Tabellenbehandlung
  - H2: Chunking-Regeln
  - H2: Link-Richtlinie
  - H2: Spoiler
  - H2: Channel-Formatter hinzufügen oder aktualisieren
  - H2: Häufige Fallstricke
  - H2: Verwandt

## concepts/memory-builtin.md

- Route: /concepts/memory-builtin
- Überschriften:
  - H2: Was es bereitstellt
  - H2: Erste Schritte
  - H2: Unterstützte Embedding-Provider
  - H2: Funktionsweise der Indexierung
  - H2: Wann Sie es verwenden sollten
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H2: Verwandt

## concepts/memory-honcho.md

- Route: /concepts/memory-honcho
- Überschriften:
  - H2: Was es bereitstellt
  - H2: Verfügbare Tools
  - H2: Erste Schritte
  - H2: Konfiguration
  - H2: Vorhandene Memory migrieren
  - H2: Funktionsweise
  - H2: Honcho vs integrierte Memory
  - H2: CLI-Befehle
  - H2: Weiterführende Informationen
  - H2: Verwandt

## concepts/memory-qmd.md

- Route: /concepts/memory-qmd
- Überschriften:
  - H2: Was es gegenüber integriertem Memory ergänzt
  - H2: Erste Schritte
  - H3: Voraussetzungen
  - H3: Aktivieren
  - H2: Funktionsweise des Sidecars
  - H2: Suchleistung und Kompatibilität
  - H2: Modell-Overrides
  - H2: Zusätzliche Pfade indexieren
  - H2: Sitzungstranskripte indexieren
  - H2: Suchbereich
  - H2: Zitate
  - H2: Wann Sie es verwenden sollten
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H2: Verwandt

## concepts/memory-search.md

- Route: /concepts/memory-search
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H2: Funktionsweise der Suche
  - H2: Suchqualität verbessern
  - H3: Zeitlicher Zerfall
  - H3: MMR (Diversität)
  - H3: Beides aktivieren
  - H2: Multimodale Memory
  - H2: Sitzungsspeichersuche
  - H2: Fehlerbehebung
  - H2: Weiterführende Informationen
  - H2: Verwandt

## concepts/memory.md

- Route: /concepts/memory
- Überschriften:
  - H2: Funktionsweise
  - H2: Was wohin gehört
  - H2: Aktionssensitive Memories
  - H2: Abgeleitete Verpflichtungen
  - H2: Memory-Tools
  - H2: Memory-Wiki-Begleit-Plugin
  - H2: Memory-Suche
  - H2: Memory-Backends
  - H2: Knowledge-Wiki-Ebene
  - H2: Automatischer Memory-Flush
  - H2: Dreaming
  - H2: Fundierte Nachbefüllung und Live-Promotion
  - H2: CLI
  - H2: Weiterführende Informationen
  - H2: Verwandt

## concepts/message-lifecycle-refactor.md

- Route: /concepts/message-lifecycle-refactor
- Überschriften:
  - H2: Probleme
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Referenzmodell
  - H2: Kernmodell
  - H2: Nachrichtenterminologie
  - H3: Nachricht
  - H3: Ziel
  - H3: Beziehung
  - H3: Ursprung
  - H3: Empfangsbestätigung
  - H2: Empfangskontext
  - H2: Sendekontext
  - H2: Live-Kontext
  - H2: Adapter-Oberfläche
  - H2: Reduzierung des öffentlichen SDK
  - H2: Beziehung zu eingehenden Kanalnachrichten
  - H2: Kompatibilitätsleitplanken
  - H2: Interner Speicher
  - H2: Fehlerklassen
  - H2: Kanalzuordnung
  - H2: Migrationsplan
  - H3: Phase 1: Interne Nachrichtendomäne
  - H3: Phase 2: Dauerhafter Sendekern
  - H3: Phase 3: Eingehende Kanal-Bridge
  - H3: Phase 4: Vorbereitete Dispatcher-Bridge
  - H3: Phase 5: Vereinheitlichter Live-Lifecycle
  - H3: Phase 6: Öffentliches SDK
  - H3: Phase 7: Alle Sender
  - H3: Phase 8: Turn-benannte Kompatibilität entfernen
  - H2: Testplan
  - H2: Offene Fragen
  - H2: Akzeptanzkriterien
  - H2: Verwandt

## concepts/messages.md

- Route: /concepts/messages
- Überschriften:
  - H2: Nachrichtenfluss (übergeordnet)
  - H2: Deduplizierung eingehender Nachrichten
  - H2: Debouncing eingehender Nachrichten
  - H2: Sitzungen und Geräte
  - H2: Tool-Ergebnis-Metadaten
  - H2: Eingehende Inhalte und Verlaufskontext
  - H2: Warteschlangen und Follow-ups
  - H2: Besitz von Kanal-Ausführungen
  - H2: Streaming, Chunking und Batching
  - H2: Sichtbarkeit und Tokens für Reasoning
  - H2: Präfixe, Threading und Antworten
  - H2: Stille Antworten
  - H2: Verwandt

## concepts/model-failover.md

- Route: /concepts/model-failover
- Überschriften:
  - H2: Runtime-Ablauf
  - H2: Richtlinie für Auswahlquelle
  - H2: Skip-Cache für Authentifizierungsfehler
  - H2: Nutzerseitig sichtbare Fallback-Hinweise
  - H2: Authentifizierungsspeicher (Schlüssel + OAuth)
  - H2: Profil-IDs
  - H2: Rotationsreihenfolge
  - H3: Sitzungs-Stickiness (cachefreundlich)
  - H3: OpenAI Codex-Abonnement plus API-Schlüssel-Backup
  - H2: Cooldowns
  - H2: Abrechnung deaktiviert
  - H2: Modell-Fallback
  - H3: Regeln für Kandidatenketten
  - H3: Welche Fehler den Fallback fortsetzen
  - H3: Cooldown-Skip vs Probe-Verhalten
  - H2: Sitzungs-Overrides und Live-Modellwechsel
  - H2: Observability und Fehlerzusammenfassungen
  - H2: Verwandte Konfiguration

## concepts/model-providers.md

- Route: /concepts/model-providers
- Überschriften:
  - H2: Kurze Regeln
  - H2: Plugin-eigenes Provider-Verhalten
  - H2: API-Schlüsselrotation
  - H2: Offizielle Provider-Plugins
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Andere gehostete Optionen im Abonnementstil
  - H3: OpenCode
  - H3: Google Gemini (API-Schlüssel)
  - H3: Google Vertex und Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Andere gebündelte Provider-Plugins
  - H4: Wissenswerte Eigenheiten
  - H2: Provider über models.providers (benutzerdefinierte/base URL)
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
  - H2: Verwandt

## concepts/models.md

- Route: /concepts/models
- Überschriften:
  - H2: Funktionsweise der Modellauswahl
  - H2: Auswahlquelle und Fallback-Verhalten
  - H2: Kurze Modellrichtlinie
  - H2: Onboarding (empfohlen)
  - H2: Konfigurationsschlüssel (Überblick)
  - H3: Sichere Allowlist-Bearbeitungen
  - H2: „Model is not allowed“ (und warum Antworten stoppen)
  - H2: Modelle im Chat wechseln (/model)
  - H2: CLI-Befehle
  - H3: models list
  - H3: models status
  - H2: Scanning (kostenlose OpenRouter-Modelle)
  - H2: Modellregistrierung (models.json)
  - H2: Verwandt

## concepts/multi-agent.md

- Route: /concepts/multi-agent
- Überschriften:
  - H2: Was ist „ein Agent“?
  - H2: Pfade (Kurzüberblick)
  - H3: Einzelagentenmodus (Standard)
  - H2: Agentenhelfer
  - H2: Schnellstart
  - H2: Mehrere Agenten = mehrere Personen, mehrere Persönlichkeiten
  - H2: Agentenübergreifende QMD-Memory-Suche
  - H2: Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)
  - H2: Routingregeln (wie Nachrichten einen Agenten auswählen)
  - H2: Mehrere Konten / Telefonnummern
  - H2: Konzepte
  - H2: Plattformbeispiele
  - H2: Häufige Muster
  - H2: Sandbox und Tool-Konfiguration pro Agent
  - H2: Verwandt

## concepts/oauth.md

- Route: /concepts/oauth
- Überschriften:
  - H2: Die Token-Senke (warum sie existiert)
  - H2: Speicher (wo Tokens liegen)
  - H2: Anthropic-Legacy-Token-Kompatibilität
  - H2: Anthropic Claude CLI-Migration
  - H2: OAuth-Austausch (wie Login funktioniert)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Aktualisierung + Ablauf
  - H2: Mehrere Konten (Profile) + Routing
  - H3: 1) Bevorzugt: separate Agenten
  - H3: 2) Erweitert: mehrere Profile in einem Agent
  - H2: Verwandt

## concepts/parallel-specialist-lanes.md

- Route: /concepts/parallel-specialist-lanes
- Überschriften:
  - H2: Grundprinzipien
  - H2: Empfohlene Einführung
  - H3: Phase 1: Spurverträge + aufwendige Hintergrundarbeit
  - H3: Phase 2: Prioritäts- und Parallelitätssteuerung
  - H3: Phase 3: Koordinator / Verkehrssteuerung
  - H2: Minimale Vorlage für Spurverträge
  - H2: Verwandte Themen

## concepts/personal-agent-benchmark-pack.md

- Route: /concepts/personal-agent-benchmark-pack
- Überschriften:
  - H2: Szenarien
  - H2: Datenschutzmodell
  - H2: Pack erweitern

## concepts/presence.md

- Route: /concepts/presence
- Überschriften:
  - H2: Präsenzfelder (was angezeigt wird)
  - H2: Produzenten (woher Präsenz kommt)
  - H3: 1) Gateway-Selbsteintrag
  - H3: 2) WebSocket-Verbindung
  - H4: Warum einmalige CLI-Befehle nicht angezeigt werden
  - H3: 3) system-event-Beacons
  - H3: 4) Node verbindet sich (role: node)
  - H2: Zusammenführungs- und Deduplizierungsregeln (warum instanceId wichtig ist)
  - H2: TTL und begrenzte Größe
  - H2: Remote-/Tunnel-Hinweis (loopback-IPs)
  - H2: Verbraucher
  - H3: macOS-Instanzen-Tab
  - H2: Debugging-Tipps
  - H2: Verwandte Themen

## concepts/progress-drafts.md

- Route: /concepts/progress-drafts
- Überschriften:
  - H2: Schnellstart
  - H2: Was Benutzer sehen
  - H2: Modus auswählen
  - H2: Labels konfigurieren
  - H2: Fortschrittszeilen steuern
  - H2: Kanalverhalten
  - H2: Finalisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## concepts/qa-e2e-automation.md

- Route: /concepts/qa-e2e-automation
- Überschriften:
  - H2: Befehlsoberfläche
  - H2: Operator-Ablauf
  - H2: Live-Transportabdeckung
  - H2: Telegram-, Discord-, Slack- und WhatsApp-QA-Referenz
  - H3: Gemeinsame CLI-Flags
  - H3: Telegram-QA
  - H3: Discord-QA
  - H3: Slack-QA
  - H4: Slack-Arbeitsbereich einrichten
  - H3: WhatsApp-QA
  - H3: Convex-Anmeldeinformationspool
  - H2: Repository-gestützte Seeds
  - H2: Provider-Mock-Spuren
  - H2: Transportadapter
  - H3: Kanal hinzufügen
  - H3: Namen von Szenario-Helfern
  - H2: Berichterstattung
  - H2: Verwandte Dokumentation

## concepts/qa-matrix.md

- Route: /concepts/qa-matrix
- Überschriften:
  - H2: Schnellstart
  - H2: Was die Spur macht
  - H2: CLI
  - H3: Gemeinsame Flags
  - H3: Provider-Flags
  - H2: Profile
  - H2: Szenarien
  - H2: Umgebungsvariablen
  - H2: Ausgabeartefakte
  - H2: Triage-Tipps
  - H2: Live-Transportvertrag
  - H2: Verwandte Themen

## concepts/queue-steering.md

- Route: /concepts/queue-steering
- Überschriften:
  - H2: Laufzeitgrenze
  - H2: Modi
  - H2: Burst-Beispiel
  - H2: Umfang
  - H2: Debounce
  - H2: Verwandte Themen

## concepts/queue.md

- Route: /concepts/queue
- Überschriften:
  - H2: Warum
  - H2: Funktionsweise
  - H2: Standardwerte
  - H2: Warteschlangenmodi
  - H2: Warteschlangenoptionen
  - H2: Steuern und Streaming
  - H2: Vorrang
  - H2: Sitzungsbezogene Überschreibungen
  - H2: Umfang und Garantien
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
  - H2: Warum es wichtig ist
  - H2: Funktionsweise
  - H2: Bereinigung alter Bilder
  - H2: Intelligente Standardwerte
  - H2: Aktivieren oder deaktivieren
  - H2: Pruning vs. Compaction
  - H2: Weiterführende Lektüre
  - H2: Verwandte Themen

## concepts/session-tool.md

- Route: /concepts/session-tool
- Überschriften:
  - H2: Verfügbare Tools
  - H2: Sitzungen auflisten und lesen
  - H2: Sitzungsübergreifende Nachrichten senden
  - H2: Status- und Orchestrierungshelfer
  - H2: Unteragenten starten
  - H2: Sichtbarkeit
  - H2: Weiterführende Lektüre
  - H2: Verwandte Themen

## concepts/session.md

- Route: /concepts/session
- Überschriften:
  - H2: Wie Nachrichten weitergeleitet werden
  - H2: DM-Isolation
  - H3: Dock-verknüpfte Kanäle
  - H2: Sitzungslebenszyklus
  - H2: Speicherort des Zustands
  - H2: Sitzungswartung
  - H2: Sitzungen inspizieren
  - H2: Weiterführende Lektüre
  - H2: Verwandte Themen

## concepts/soul.md

- Route: /concepts/soul
- Überschriften:
  - H2: Was in SOUL.md gehört
  - H2: Warum das funktioniert
  - H2: Der Molty-Prompt
  - H2: Wie gut aussieht
  - H2: Eine Warnung
  - H2: Verwandte Themen

## concepts/streaming.md

- Route: /concepts/streaming
- Überschriften:
  - H2: Block-Streaming (Kanalnachrichten)
  - H3: Medienzustellung mit Block-Streaming
  - H2: Chunking-Algorithmus (untere/obere Grenzen)
  - H2: Zusammenführen (gestreamte Blöcke zusammenführen)
  - H2: Menschlich wirkendes Timing zwischen Blöcken
  - H2: "Chunks streamen oder alles"
  - H2: Vorschau-Streaming-Modi
  - H3: Kanalzuordnung
  - H3: Laufzeitverhalten
  - H3: Vorschauaktualisierungen für Tool-Fortschritt
  - H2: Verwandte Themen

## concepts/system-prompt.md

- Route: /concepts/system-prompt
- Überschriften:
  - H2: Struktur
  - H2: Prompt-Modi
  - H2: Prompt-Snapshots
  - H2: Arbeitsbereich-Bootstrap-Injektion
  - H2: Zeitverarbeitung
  - H2: Skills
  - H2: Dokumentation
  - H2: Verwandte Themen

## concepts/timezone.md

- Route: /concepts/timezone
- Überschriften:
  - H2: Drei Zeitzonenoberflächen
  - H2: Benutzerzeitzone festlegen
  - H2: Wann überschrieben werden sollte
  - H2: Verwandte Themen

## concepts/typebox.md

- Route: /concepts/typebox
- Überschriften:
  - H2: Mentales Modell (30 Sekunden)
  - H2: Wo die Schemas liegen
  - H2: Aktuelle Pipeline
  - H2: Wie die Schemas zur Laufzeit verwendet werden
  - H2: Beispielframes
  - H2: Minimaler Client (Node.js)
  - H2: Durchgearbeitetes Beispiel: eine Methode durchgängig hinzufügen
  - H2: Verhalten der Swift-Codegenerierung
  - H2: Versionierung + Kompatibilität
  - H2: Schemamuster und Konventionen
  - H2: Live-Schema-JSON
  - H2: Wenn Sie Schemas ändern
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
  - H2: Wo es angezeigt wird
  - H2: Standardmodus für die Nutzungsfußzeile
  - H3: Drei unterschiedliche Sitzungszustände
  - H3: Vorrang
  - H3: Zurücksetzen vs. Ausschalten
  - H3: Umschaltverhalten
  - H3: Konfiguration
  - H2: Benutzerdefinierte vollständige /usage-Fußzeile
  - H3: Form
  - H3: Vertragspfade
  - H3: Verben
  - H3: Teilformen
  - H3: Beispiel
  - H2: Provider + Anmeldeinformationen
  - H2: Verwandte Themen

## date-time.md

- Route: /date-time
- Überschriften:
  - H2: Nachrichtenumschläge (standardmäßig lokal)
  - H3: Beispiele
  - H2: System-Prompt: aktuelles Datum und aktuelle Uhrzeit
  - H2: Systemereigniszeilen (standardmäßig lokal)
  - H3: Benutzerzeitzone + Format konfigurieren
  - H2: Erkennung des Zeitformats (automatisch)
  - H2: Tool-Payloads + Konnektoren (Rohzeit des Providers + normalisierte Felder)
  - H2: Verwandte Dokumentation

## debug/node-issue.md

- Route: /debug/node-issue
- Überschriften:
  - H1: Node + tsx "\\name is not a function"-Absturz
  - H2: Zusammenfassung
  - H2: Umgebung
  - H2: Reproduktion (nur Node)
  - H2: Minimale Reproduktion im Repository
  - H2: Node-Versionsprüfung
  - H2: Hinweise / Hypothese
  - H2: Regressionshistorie
  - H2: Workarounds
  - H2: Referenzen
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## diagnostics/flags.md

- Route: /diagnostics/flags
- Überschriften:
  - H2: Funktionsweise
  - H2: Per Konfiguration aktivieren
  - H2: Env-Überschreibung (einmalig)
  - H2: Profiling-Flags
  - H2: Zeitleistenartefakte
  - H2: Speicherort der Logs
  - H2: Logs extrahieren
  - H2: Hinweise
  - H2: Verwandte Themen

## gateway/authentication.md

- Route: /gateway/authentication
- Überschriften:
  - H2: Empfohlenes Setup (API-Schlüssel, beliebiger Provider)
  - H2: Anthropic: Claude CLI und Token-Kompatibilität
  - H2: Anthropic-Hinweis
  - H2: Modell-Authentifizierungsstatus prüfen
  - H2: Verhalten bei API-Schlüsselrotation (Gateway)
  - H2: Provider-Authentifizierung entfernen, während das Gateway läuft
  - H2: Steuern, welche Anmeldeinformation verwendet wird
  - H3: OpenAI und alte openai-codex-IDs
  - H3: Während der Anmeldung (CLI)
  - H3: Sitzungsbezogen (Chat-Befehl)
  - H3: Agentbezogen (CLI-Überschreibung)
  - H2: Fehlerbehebung
  - H3: "Keine Anmeldeinformationen gefunden"
  - H3: Token läuft ab/ist abgelaufen
  - H2: Verwandte Themen

## gateway/background-process.md

- Route: /gateway/background-process
- Überschriften:
  - H2: exec-Tool
  - H2: Überbrückung von Child-Prozessen
  - H2: process-Tool
  - H2: Beispiele
  - H2: Verwandte Themen

## gateway/bonjour.md

- Route: /gateway/bonjour
- Überschriften:
  - H2: Wide-Area-Bonjour (Unicast DNS-SD) über Tailscale
  - H3: Gateway-Konfiguration (empfohlen)
  - H3: Einmalige DNS-Server-Einrichtung (Gateway-Host)
  - H3: Tailscale-DNS-Einstellungen
  - H3: Sicherheit des Gateway-Listeners (empfohlen)
  - H2: Was Werbung sendet
  - H2: Diensttypen
  - H2: TXT-Schlüssel (nicht geheime Hinweise)
  - H2: Debugging unter macOS
  - H2: Debugging in Gateway-Logs
  - H2: Debugging auf iOS-Node
  - H2: Wann Bonjour aktiviert werden sollte
  - H2: Wann Bonjour deaktiviert werden sollte
  - H2: Docker-Fallstricke
  - H2: Fehlerbehebung bei deaktiviertem Bonjour
  - H2: Häufige Fehlermodi
  - H2: Escapte Instanznamen (\032)
  - H2: Aktivieren / Deaktivieren / Konfiguration
  - H2: Verwandte Dokumentation

## gateway/bridge-protocol.md

- Route: /gateway/bridge-protocol
- Überschriften:
  - H2: Warum es existierte
  - H2: Transport
  - H2: Handshake + Pairing
  - H2: Frames
  - H2: Exec-Lebenszyklusereignisse
  - H2: Historische Tailnet-Nutzung
  - H2: Versionierung
  - H2: Verwandte Themen

## gateway/cli-backends.md

- Route: /gateway/cli-backends
- Überschriften:
  - H2: Anfängerfreundlicher Schnellstart
  - H2: Als Fallback verwenden
  - H2: Konfigurationsübersicht
  - H3: Beispielkonfiguration
  - H2: Funktionsweise
  - H2: Sitzungen
  - H2: Fallback-Präludium aus claude-cli-Sitzungen
  - H2: Bilder (Durchleitung)
  - H2: Eingaben / Ausgaben
  - H2: Standardwerte (Plugin-eigen)
  - H2: Plugin-eigene Standardwerte
  - H2: Besitz nativer Compaction
  - H2: MCP-Overlays bündeln
  - H2: Obergrenze für erneutes Seeding der Historie
  - H2: Einschränkungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/config-agents.md

- Route: /gateway/config-agents
- Überschriften:
  - H2: Agent-Standardwerte
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Bootstrap-Profilüberschreibungen pro Agent
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Kontextbudget-Besitzzuordnung
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
  - H3: Block-Streaming
  - H3: Eingabeindikatoren
  - H3: agents.defaults.sandbox
  - H3: agents.list (agentbezogene Überschreibungen)
  - H2: Multi-Agent-Routing
  - H3: Binding-Abgleichsfelder
  - H3: Agentbezogene Zugriffsprofile
  - H2: Sitzung
  - H2: Nachrichten
  - H3: Antwortpräfix
  - H3: Bestätigungsreaktion
  - H3: Eingangs-Debounce
  - H3: TTS (Text-to-Speech)
  - H2: Sprechen
  - H2: Verwandte Themen

## gateway/config-channels.md

- Route: /gateway/config-channels
- Überschriften:
  - H2: Kanäle
  - H3: DM- und Gruppenzugriff
  - H3: Kanal-Modellüberschreibungen
  - H3: Kanal-Standardwerte und Heartbeat
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
  - H3: Mehrkonto-Betrieb (alle Kanäle)
  - H3: Andere Plugin-Kanäle
  - H3: Erwähnungs-Gating für Gruppenchats
  - H4: DM-Historienlimits
  - H4: Selbstchat-Modus
  - H3: Befehle (Chat-Befehlsverarbeitung)
  - H2: Verwandte Themen

## gateway/config-tools.md

- Route: /gateway/config-tools
- Überschriften:
  - H2: Tools
  - H3: Tool-Profile
  - H3: Tool-Gruppen
  - H3: MCP- und Plugin-Tools innerhalb der Sandbox-Tool-Richtlinie
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
  - H3: Details zum Provider-Feld
  - H3: Provider-Beispiele
  - H2: Verwandte Themen

## gateway/configuration-examples.md

- Route: /gateway/configuration-examples
- Überschriften:
  - H2: Schnellstart
  - H3: Absolutes Minimum
  - H3: Empfohlener Einstieg
  - H2: Erweitertes Beispiel (wichtige Optionen)
  - H3: Per Symlink eingebundenes benachbartes Skill-Repo
  - H2: Häufige Muster
  - H3: Gemeinsame Skill-Basis mit einer Überschreibung
  - H3: Multi-Plattform-Einrichtung
  - H3: Automatische Genehmigung für vertrauenswürdiges Node-Netzwerk
  - H3: Sicherer DM-Modus (gemeinsamer Posteingang / Mehrbenutzer-DMs)
  - H3: Anthropic-API-Schlüssel + MiniMax-Fallback
  - H3: Arbeits-Bot (eingeschränkter Zugriff)
  - H3: Nur lokale Modelle
  - H2: Tipps
  - H2: Verwandte Themen

## gateway/configuration-reference.md

- Route: /gateway/configuration-reference
- Überschriften:
  - H2: Kanäle
  - H2: Agent-Standards, Multi-Agent, Sitzungen und Nachrichten
  - H2: Tools und benutzerdefinierte Provider
  - H2: Modelle
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Codex-Harness-Plugin-Konfiguration
  - H2: Commitments
  - H2: Browser
  - H2: Benutzeroberfläche
  - H2: Gateway
  - H3: OpenAI-kompatible Endpunkte
  - H3: Multi-Instanz-Isolation
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooks
  - H3: Gmail-Integration
  - H2: Canvas-Plugin-Host
  - H2: Discovery
  - H3: mDNS (Bonjour)
  - H3: Weitbereich (DNS-SD)
  - H2: Umgebung
  - H3: env (Inline-Umgebungsvariablen)
  - H3: Ersetzung von Umgebungsvariablen
  - H2: Secrets
  - H3: SecretRef
  - H3: Unterstützte Anmeldedatenoberfläche
  - H3: Konfiguration für Secret-Provider
  - H2: Auth-Speicher
  - H3: auth.cooldowns
  - H2: Logging
  - H2: Diagnose
  - H2: Update
  - H2: ACP
  - H2: CLI
  - H2: Assistent
  - H2: Identität
  - H2: Bridge (Legacy, entfernt)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Template-Variablen für Medienmodelle
  - H2: Config-Includes ($include)
  - H2: Verwandte Themen

## gateway/configuration.md

- Route: /gateway/configuration
- Überschriften:
  - H2: Minimale Konfiguration
  - H2: Konfiguration bearbeiten
  - H2: Strikte Validierung
  - H2: Häufige Aufgaben
  - H2: Hot-Reload der Konfiguration
  - H3: Reload-Modi
  - H3: Was per Hot-Apply übernommen wird und was einen Neustart benötigt
  - H3: Reload-Planung
  - H2: Config-RPC (programmatische Aktualisierungen)
  - H2: Umgebungsvariablen
  - H2: Vollständige Referenz
  - H2: Verwandte Themen

## gateway/diagnostics.md

- Route: /gateway/diagnostics
- Überschriften:
  - H2: Schnellstart
  - H2: Chat-Befehl
  - H2: Was der Export enthält
  - H2: Datenschutzmodell
  - H2: Stabilitätsrekorder
  - H2: Nützliche Optionen
  - H2: Diagnose deaktivieren
  - H2: Verwandte Themen

## gateway/discovery.md

- Route: /gateway/discovery
- Überschriften:
  - H2: Begriffe
  - H2: Warum wir sowohl direkt als auch SSH beibehalten
  - H2: Discovery-Eingaben (wie Clients erfahren, wo sich das Gateway befindet)
  - H3: 1) Bonjour- / DNS-SD-Discovery
  - H4: Details zum Dienst-Beacon
  - H3: 2) Tailnet (netzwerkübergreifend)
  - H3: 3) Manuelles / SSH-Ziel
  - H2: Transportauswahl (Client-Richtlinie)
  - H2: Pairing + Auth (direkter Transport)
  - H2: Verantwortlichkeiten nach Komponente
  - H2: Verwandte Themen

## gateway/doctor.md

- Route: /gateway/doctor
- Überschriften:
  - H2: Schnellstart
  - H3: Headless- und Automatisierungsmodi
  - H2: Read-only-Lint-Modus
  - H2: Was es tut (Zusammenfassung)
  - H2: Dreams-UI-Backfill und Zurücksetzen
  - H2: Detailliertes Verhalten und Begründung
  - H2: Verwandte Themen

## gateway/external-apps.md

- Route: /gateway/external-apps
- Überschriften:
  - H2: Was heute verfügbar ist
  - H2: Empfohlener Pfad
  - H2: App-Code vs. Plugin-Code
  - H2: Verwandte Themen

## gateway/gateway-lock.md

- Route: /gateway/gateway-lock
- Überschriften:
  - H2: Warum
  - H2: Mechanismus
  - H2: Fehleroberfläche
  - H2: Betriebshinweise
  - H2: Verwandte Themen

## gateway/health.md

- Route: /gateway/health
- Überschriften:
  - H2: Schnelle Prüfungen
  - H2: Tiefgehende Diagnose
  - H2: Konfiguration des Health-Monitors
  - H2: Uptime-Monitoring
  - H3: Beispiele für die Einrichtung von Monitoring-Diensten
  - H2: Wenn etwas fehlschlägt
  - H2: Dedizierter "health"-Befehl
  - H2: Verwandte Themen

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Überschriften:
  - H2: Schnellstart (Anfänger)
  - H2: Standards
  - H2: Wofür der Heartbeat-Prompt gedacht ist
  - H2: Antwortvertrag
  - H2: Konfiguration
  - H3: Geltungsbereich und Vorrang
  - H3: Heartbeats pro Agent
  - H3: Beispiel für aktive Zeiten
  - H3: 24/7-Einrichtung
  - H3: Beispiel mit mehreren Konten
  - H3: Feldnotizen
  - H2: Zustellungsverhalten
  - H2: Sichtbarkeitssteuerungen
  - H3: Was jedes Flag bewirkt
  - H3: Beispiele pro Kanal vs. pro Konto
  - H3: Häufige Muster
  - H2: HEARTBEAT.md (optional)
  - H3: tasks:-Blöcke
  - H3: Kann der Agent HEARTBEAT.md aktualisieren?
  - H2: Manuelles Wecken (bei Bedarf)
  - H2: Reasoning-Zustellung (optional)
  - H2: Kostenbewusstsein
  - H2: Kontextüberlauf nach Heartbeat
  - H2: Verwandte Themen

## gateway/index.md

- Route: /gateway
- Überschriften:
  - H2: Lokaler Start in 5 Minuten
  - H2: Laufzeitmodell
  - H2: OpenAI-kompatible Endpunkte
  - H3: Port- und Bind-Vorrang
  - H3: Hot-Reload-Modi
  - H2: Operator-Befehlssatz
  - H2: Mehrere Gateways (gleicher Host)
  - H2: Remotezugriff
  - H2: Überwachung und Dienstlebenszyklus
  - H2: Schneller Pfad für Dev-Profil
  - H2: Protokoll-Kurzreferenz (Operator-Ansicht)
  - H2: Betriebsprüfungen
  - H3: Liveness
  - H3: Readiness
  - H3: Lückenwiederherstellung
  - H2: Häufige Fehlersignaturen
  - H2: Sicherheitsgarantien
  - H2: Verwandte Themen

## gateway/local-model-services.md

- Route: /gateway/local-model-services
- Überschriften:
  - H2: Funktionsweise
  - H2: Konfigurationsform
  - H2: Felder
  - H2: Inferrs-Beispiel
  - H2: ds4-Beispiel
  - H2: Betriebshinweise
  - H2: Verwandte Themen

## gateway/local-models.md

- Route: /gateway/local-models
- Überschriften:
  - H2: Hardware-Mindestanforderungen
  - H2: Backend auswählen
  - H2: Empfohlen: LM Studio + großes lokales Modell (Responses API)
  - H3: Hybridkonfiguration: gehostetes primär, lokaler Fallback
  - H3: Local-first mit gehostetem Sicherheitsnetz
  - H3: Regionales Hosting / Datenrouting
  - H2: Weitere OpenAI-kompatible lokale Proxys
  - H2: Kleinere oder strengere Backends
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/logging.md

- Route: /gateway/logging
- Überschriften:
  - H1: Logging
  - H2: Dateibasierter Logger
  - H2: Konsolenerfassung
  - H2: Schwärzung
  - H2: Gateway-WebSocket-Logs
  - H3: WS-Log-Stil
  - H2: Konsolenformatierung (Subsystem-Logging)
  - H2: Verwandte Themen

## gateway/multiple-gateways.md

- Route: /gateway/multiple-gateways
- Überschriften:
  - H2: Beste empfohlene Einrichtung
  - H2: Rescue-Bot-Schnellstart
  - H2: Warum das funktioniert
  - H2: Was --profile rescue onboard ändert
  - H2: Allgemeine Multi-Gateway-Einrichtung
  - H2: Isolations-Checkliste
  - H2: Portzuordnung (abgeleitet)
  - H2: Browser-/CDP-Hinweise (häufiger Stolperstein)
  - H2: Manuelles env-Beispiel
  - H2: Schnelle Prüfungen
  - H2: Verwandte Themen

## gateway/network-model.md

- Route: /gateway/network-model
- Überschriften:
  - H2: Verwandte Themen

## gateway/openai-http-api.md

- Route: /gateway/openai-http-api
- Überschriften:
  - H2: Authentifizierung
  - H2: Sicherheitsgrenze (wichtig)
  - H2: Wann dieser Endpunkt verwendet werden sollte
  - H2: Agent-first-Modellvertrag
  - H2: Endpunkt aktivieren
  - H2: Endpunkt deaktivieren
  - H2: Sitzungsverhalten
  - H2: Warum diese Oberfläche wichtig ist
  - H2: Modellliste und Agent-Routing
  - H2: Streaming (SSE)
  - H2: Chat-Tool-Vertrag
  - H3: Unterstützte Anfragefelder
  - H3: Nicht unterstützte Varianten
  - H3: Antwortform für nicht streamende Tools
  - H3: Antwortform für streamende Tools
  - H3: Tool-Follow-up-Schleife
  - H2: Schnelleinrichtung für Open WebUI
  - H2: Beispiele
  - H2: Verwandte Themen

## gateway/openresponses-http-api.md

- Route: /gateway/openresponses-http-api
- Überschriften:
  - H2: Authentifizierung, Sicherheit und Routing
  - H2: Sitzungsverhalten
  - H2: Anfrageform (unterstützt)
  - H2: Elemente (Eingabe)
  - H3: message
  - H3: functioncalloutput (rundenbasierte Tools)
  - H3: reasoning und itemreference
  - H2: Tools (clientseitige Funktions-Tools)
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
  - H3: mirror
  - H3: remote
  - H3: Modus auswählen
  - H2: Konfigurationsreferenz
  - H2: Beispiele
  - H3: Minimale Remote-Einrichtung
  - H3: Mirror-Modus mit GPU
  - H3: OpenShell pro Agent mit benutzerdefiniertem Gateway
  - H2: Lebenszyklusverwaltung
  - H3: Wann neu erstellt werden sollte
  - H2: Sicherheitshärtung
  - H2: Aktuelle Einschränkungen
  - H2: Funktionsweise
  - H2: Verwandte Themen

## gateway/opentelemetry.md

- Route: /gateway/opentelemetry
- Überschriften:
  - H2: Wie es zusammenpasst
  - H2: Schnellstart
  - H2: Exportierte Signale
  - H2: Konfigurationsreferenz
  - H3: Umgebungsvariablen
  - H2: Datenschutz und Inhaltserfassung
  - H2: Sampling und Flushes
  - H2: Exportierte Metriken
  - H3: Modellnutzung
  - H3: Nachrichtenfluss
  - H3: Talk
  - H3: Warteschlangen und Sitzungen
  - H3: Telemetrie zur Sitzungs-Liveness
  - H3: Harness-Lebenszyklus
  - H3: Tool-Ausführung
  - H3: Exec
  - H3: Diagnose-Interna (Speicher und Tool-Schleife)
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
  - H2: Methodenscope ist nur die erste Hürde
  - H2: Genehmigungen für Geräte-Pairing
  - H2: Genehmigungen für Node-Pairing
  - H2: Shared-Secret-Auth

## gateway/pairing.md

- Route: /gateway/pairing
- Überschriften:
  - H2: Konzepte
  - H2: Funktionsweise des Pairings
  - H2: CLI-Workflow (headless-freundlich)
  - H2: API-Oberfläche (Gateway-Protokoll)
  - H2: Node-Befehls-Gating (2026.3.31+)
  - H2: Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)
  - H2: Automatische Genehmigung (macOS-App)
  - H2: Automatische Genehmigung für Trusted-CIDR-Geräte
  - H2: Automatische Genehmigung bei Metadaten-Upgrade
  - H2: QR-Pairing-Helfer
  - H2: Lokalität und weitergeleitete Header
  - H2: Speicher (lokal, privat)
  - H2: Transportverhalten
  - H2: Verwandte Themen

## gateway/prometheus.md

- Route: /gateway/prometheus
- Überschriften:
  - H2: Schnellstart
  - H2: Exportierte Metriken
  - H2: Label-Richtlinie
  - H2: PromQL-Rezepte
  - H2: Wahl zwischen Prometheus und OpenTelemetry-Export
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/protocol.md

- Route: /gateway/protocol
- Überschriften:
  - H2: Transport
  - H2: Handshake (connect)
  - H3: Node-Beispiel
  - H2: Framing
  - H2: Rollen + Scopes
  - H3: Rollen
  - H3: Scopes (Operator)
  - H3: Caps/Befehle/Berechtigungen (Node)
  - H2: Presence
  - H3: Node-Hintergrund-Alive-Ereignis
  - H2: Scoping von Broadcast-Ereignissen
  - H2: Häufige RPC-Methodenfamilien
  - H3: Häufige Ereignisfamilien
  - H3: Node-Hilfsmethoden
  - H3: Task-Ledger-RPCs
  - H3: Operator-Hilfsmethoden
  - H3: models.list-Ansichten
  - H2: Exec-Genehmigungen
  - H2: Fallback für Agent-Zustellung
  - H2: Versionierung
  - H3: Client-Konstanten
  - H2: Auth
  - H2: Geräteidentität + Pairing
  - H3: Diagnose zur Geräteauthentifizierungs-Migration
  - H2: TLS + Pinning
  - H2: Scope
  - H2: Verwandte Themen

## gateway/remote-gateway-readme.md

- Route: /gateway/remote-gateway-readme
- Überschriften:
  - H1: OpenClaw.app mit einem Remote-Gateway ausführen
  - H2: Übersicht
  - H2: Schnelle Einrichtung
  - H3: Schritt 1: SSH-Konfiguration hinzufügen
  - H3: Schritt 2: SSH-Schlüssel kopieren
  - H3: Schritt 3: Remote-Gateway-Auth konfigurieren
  - H3: Schritt 4: SSH-Tunnel starten
  - H3: Schritt 5: OpenClaw.app neu starten
  - H2: Tunnel beim Login automatisch starten
  - H3: PLIST-Datei erstellen
  - H3: Launch Agent laden
  - H2: Fehlerbehebung
  - H2: Funktionsweise
  - H2: Verwandte Themen

## gateway/remote.md

- Route: /gateway/remote
- Überschriften:
  - H2: Die Grundidee
  - H2: Gängige VPN- und Tailnet-Setups
  - H3: Durchgehend aktiver Gateway in Ihrem Tailnet
  - H3: Heim-Desktop führt den Gateway aus
  - H3: Laptop führt den Gateway aus
  - H2: Befehlsfluss (was wo ausgeführt wird)
  - H2: SSH-Tunnel (CLI + Tools)
  - H2: Remote-Standards für die CLI
  - H2: Vorrang von Anmeldedaten
  - H2: Remote-Zugriff auf die Chat-UI
  - H2: Remote-Modus der macOS-App
  - H2: Sicherheitsregeln (Remote/VPN)
  - H3: macOS: Persistenter SSH-Tunnel über LaunchAgent
  - H4: Schritt 1: SSH-Konfiguration hinzufügen
  - H4: Schritt 2: SSH-Schlüssel kopieren (einmalig)
  - H4: Schritt 3: Gateway-Token konfigurieren
  - H4: Schritt 4: LaunchAgent erstellen
  - H4: Schritt 5: LaunchAgent laden
  - H4: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Route: /gateway/sandbox-vs-tool-policy-vs-elevated
- Überschriften:
  - H2: Schnelles Debugging
  - H2: Sandbox: wo Tools ausgeführt werden
  - H3: Bind-Mounts (schneller Sicherheitscheck)
  - H2: Tool-Richtlinie: welche Tools vorhanden/aufrufbar sind
  - H3: Tool-Gruppen (Kurzformen)
  - H2: Erhöht: nur exec „auf Host ausführen“
  - H2: Häufige Korrekturen für „Sandbox-Gefängnis“
  - H3: „Tool X durch Sandbox-Tool-Richtlinie blockiert“
  - H3: „Ich dachte, das sei main, warum läuft es in der Sandbox?“
  - H2: Verwandte Themen

## gateway/sandboxing.md

- Route: /gateway/sandboxing
- Überschriften:
  - H2: Was in der Sandbox ausgeführt wird
  - H2: Modi
  - H2: Geltungsbereich
  - H2: Backend
  - H3: Backend auswählen
  - H3: Docker-Backend
  - H3: SSH-Backend
  - H3: OpenShell-Backend
  - H4: Workspace-Modi
  - H4: OpenShell-Lebenszyklus
  - H2: Workspace-Zugriff
  - H2: Benutzerdefinierte Bind-Mounts
  - H2: Images und Einrichtung
  - H2: setupCommand (einmalige Container-Einrichtung)
  - H2: Tool-Richtlinie und Notausgänge
  - H2: Multi-Agent-Overrides
  - H2: Minimales Aktivierungsbeispiel
  - H2: Verwandte Themen

## gateway/secrets-plan-contract.md

- Route: /gateway/secrets-plan-contract
- Überschriften:
  - H2: Form der Plan-Datei
  - H2: Provider-Upserts und -Löschungen
  - H2: Unterstützter Zielbereich
  - H2: Verhalten von Zieltypen
  - H2: Regeln zur Pfadvalidierung
  - H2: Fehlerverhalten
  - H2: Zustimmungsverhalten des Exec-Providers
  - H2: Hinweise zu Runtime- und Audit-Geltungsbereich
  - H2: Operator-Prüfungen
  - H2: Verwandte Dokumentation

## gateway/secrets.md

- Route: /gateway/secrets
- Überschriften:
  - H2: Ziele und Runtime-Modell
  - H2: Grenze für Agent-Zugriff
  - H2: Filterung aktiver Oberflächen
  - H2: Diagnose der Gateway-Auth-Oberfläche
  - H2: Referenz-Preflight für Onboarding
  - H2: SecretRef-Vertrag
  - H2: Provider-Konfiguration
  - H2: Dateibasierte API-Schlüssel
  - H2: Beispiele für Exec-Integration
  - H2: Umgebungsvariablen für MCP-Server
  - H2: SSH-Auth-Material für Sandbox
  - H2: Unterstützte Anmeldedaten-Oberfläche
  - H2: Erforderliches Verhalten und Vorrang
  - H2: Aktivierungsauslöser
  - H2: Signale für eingeschränkt und wiederhergestellt
  - H2: Auflösung von Befehlspfaden
  - H2: Audit- und Konfigurations-Workflow
  - H2: Einweg-Sicherheitsrichtlinie
  - H2: Hinweise zur Legacy-Auth-Kompatibilität
  - H2: Hinweis zur Web-UI
  - H2: Verwandte Themen

## gateway/security/audit-checks.md

- Route: /gateway/security/audit-checks
- Überschriften:
  - H2: Verwandte Themen

## gateway/security/exposure-runbook.md

- Route: /gateway/security/exposure-runbook
- Überschriften:
  - H2: Expositionsmuster auswählen
  - H2: Preflight-Inventar
  - H2: Baseline-Prüfungen
  - H2: Sichere Mindest-Baseline
  - H2: DM- und Gruppen-Exposition
  - H2: Reverse-Proxy-Prüfungen
  - H2: Tool- und Sandbox-Überprüfung
  - H2: Validierung nach der Änderung
  - H2: Rollback-Plan
  - H2: Review-Checkliste

## gateway/security/index.md

- Route: /gateway/security
- Überschriften:
  - H2: Zuerst der Geltungsbereich: Sicherheitsmodell für persönliche Assistenten
  - H2: Schnellprüfung: openclaw security audit
  - H3: Abhängigkeits-Lock für veröffentlichtes Paket
  - H3: Deployment und Host-Vertrauen
  - H3: Sichere Dateioperationen
  - H3: Geteilter Slack-Workspace: echtes Risiko
  - H3: Unternehmensweit geteilter Agent: akzeptables Muster
  - H2: Vertrauenskonzept für Gateway und Node
  - H2: Matrix der Vertrauensgrenzen
  - H2: Keine Schwachstellen per Design
  - H2: Gehärtete Baseline in 60 Sekunden
  - H2: Schnellregel für geteilten Posteingang
  - H2: Modell für Kontextsichtbarkeit
  - H2: Was das Audit prüft (Überblick)
  - H2: Speicherkarte für Anmeldedaten
  - H2: Sicherheitsaudit-Checkliste
  - H2: Sicherheitsaudit-Glossar
  - H2: Control UI über HTTP
  - H2: Zusammenfassung unsicherer oder gefährlicher Flags
  - H2: Reverse-Proxy-Konfiguration
  - H2: Hinweise zu HSTS und Origin
  - H2: Lokale Sitzungsprotokolle liegen auf der Festplatte
  - H2: Node-Ausführung (system.run)
  - H2: Dynamische Skills (Watcher / Remote-Nodes)
  - H2: Das Bedrohungsmodell
  - H2: Kernkonzept: Zugriffskontrolle vor Intelligenz
  - H2: Modell zur Befehlsautorisierung
  - H2: Risiko von Control-Plane-Tools
  - H2: Plugins
  - H2: DM-Zugriffsmodell: Kopplung, Allowlist, offen, deaktiviert
  - H2: DM-Sitzungsisolierung (Mehrbenutzermodus)
  - H3: Sicherer DM-Modus (empfohlen)
  - H2: Allowlists für DMs und Gruppen
  - H2: Prompt-Injection (was es ist, warum es wichtig ist)
  - H2: Bereinigung externer Inhalte von Sonder-Tokens
  - H2: Unsichere Bypass-Flags für externe Inhalte
  - H3: Prompt-Injection erfordert keine öffentlichen DMs
  - H3: Selbst gehostete LLM-Backends
  - H3: Modellstärke (Sicherheitshinweis)
  - H2: Reasoning und ausführliche Ausgabe in Gruppen
  - H2: Beispiele zur Konfigurationshärtung
  - H3: Dateiberechtigungen
  - H3: Netzwerkexposition (Bind, Port, Firewall)
  - H3: Docker-Port-Veröffentlichung mit UFW
  - H3: mDNS-/Bonjour-Erkennung
  - H3: Gateway-WebSocket absichern (lokale Auth)
  - H3: Tailscale Serve-Identitäts-Header
  - H3: Browser-Steuerung über Node-Host (empfohlen)
  - H3: Secrets auf der Festplatte
  - H3: Workspace-.env-Dateien
  - H3: Protokolle und Transkripte (Schwärzung und Aufbewahrung)
  - H3: DMs: standardmäßig Kopplung
  - H3: Gruppen: überall Erwähnung erforderlich
  - H3: Separate Nummern (WhatsApp, Signal, Telegram)
  - H3: Schreibgeschützter Modus (über Sandbox und Tools)
  - H3: Sichere Baseline (kopieren/einfügen)
  - H2: Sandboxing (empfohlen)
  - H3: Leitplanke für Sub-Agent-Delegation
  - H2: Risiken der Browser-Steuerung
  - H3: Browser-SSRF-Richtlinie (standardmäßig strikt)
  - H2: Zugriffsprofile pro Agent (Multi-Agent)
  - H3: Beispiel: Vollzugriff (keine Sandbox)
  - H3: Beispiel: schreibgeschützte Tools + schreibgeschützter Workspace
  - H3: Beispiel: kein Dateisystem-/Shell-Zugriff (Provider-Messaging erlaubt)
  - H2: Reaktion auf Vorfälle
  - H3: Eindämmen
  - H3: Rotieren (bei geleakten Secrets Kompromittierung annehmen)
  - H3: Audit
  - H3: Für einen Bericht sammeln
  - H2: Secret-Scanning
  - H2: Sicherheitsprobleme melden

## gateway/security/secure-file-operations.md

- Route: /gateway/security/secure-file-operations
- Überschriften:
  - H2: Standard: kein Python-Helfer
  - H2: Was ohne Python geschützt bleibt
  - H2: Was Python hinzufügt
  - H2: Hinweise für Plugin und Core

## gateway/security/shrinkwrap.md

- Route: /gateway/security/shrinkwrap
- Überschriften:
  - H2: Die einfache Version
  - H2: Warum OpenClaw es verwendet
  - H2: Technische Details

## gateway/tailscale.md

- Route: /gateway/tailscale
- Überschriften:
  - H2: Modi
  - H2: Auth
  - H2: Konfigurationsbeispiele
  - H3: Nur Tailnet (Serve)
  - H3: Nur Tailnet (an Tailnet-IP binden)
  - H3: Öffentliches Internet (Funnel + geteiltes Passwort)
  - H2: CLI-Beispiele
  - H2: Hinweise
  - H2: Browser-Steuerung (Remote-Gateway + lokaler Browser)
  - H2: Tailscale-Voraussetzungen + Limits
  - H2: Mehr erfahren
  - H2: Verwandte Themen

## gateway/tools-invoke-http-api.md

- Route: /gateway/tools-invoke-http-api
- Überschriften:
  - H2: Authentifizierung
  - H2: Sicherheitsgrenze (wichtig)
  - H2: Request-Body
  - H2: Richtlinien- und Routing-Verhalten
  - H2: Antworten
  - H2: Beispiel
  - H2: Verwandte Themen

## gateway/troubleshooting.md

- Route: /gateway/troubleshooting
- Überschriften:
  - H2: Befehlsleiter
  - H2: Nach einem Update
  - H2: Split-Brain-Installationen und Schutz für neuere Konfiguration
  - H2: Protokollkonflikt nach Rollback
  - H2: Skill-Symlink wegen Pfad-Escape übersprungen
  - H2: Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich
  - H2: Upstream-403 blockierte Antworten
  - H2: Lokales OpenAI-kompatibles Backend besteht direkte Probes, aber Agent-Läufe schlagen fehl
  - H2: Keine Antworten
  - H2: Konnektivität der Dashboard-Control-UI
  - H3: Schnellübersicht der Auth-Detailcodes
  - H2: Gateway-Dienst läuft nicht
  - H2: macOS-Gateway reagiert still nicht mehr und setzt fort, sobald Sie das Dashboard berühren
  - H2: Gateway beendet sich bei hoher Speichernutzung
  - H2: Gateway hat ungültige Konfiguration abgelehnt
  - H2: Gateway-Probe-Warnungen
  - H2: Kanal verbunden, Nachrichten fließen nicht
  - H2: Cron- und Heartbeat-Zustellung
  - H2: Node gekoppelt, Tool schlägt fehl
  - H2: Browser-Tool schlägt fehl
  - H2: Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert
  - H2: Verwandte Themen

## gateway/trusted-proxy-auth.md

- Route: /gateway/trusted-proxy-auth
- Überschriften:
  - H2: Wann verwenden
  - H2: Wann NICHT verwenden
  - H2: Funktionsweise
  - H2: Kopplungsverhalten der Control UI
  - H2: Konfiguration
  - H3: Konfigurationsreferenz
  - H2: TLS-Terminierung und HSTS
  - H3: Rollout-Hinweise
  - H2: Beispiele für Proxy-Einrichtung
  - H2: Gemischte Token-Konfiguration
  - H2: Header für Operator-Geltungsbereiche
  - H2: Sicherheitscheckliste
  - H2: Sicherheitsaudit
  - H2: Fehlerbehebung
  - H2: Migration von Token-Auth
  - H2: Verwandte Themen

## help/debugging.md

- Route: /help/debugging
- Überschriften:
  - H2: Runtime-Debug-Overrides
  - H2: Ausgabe von Sitzungstraces
  - H2: Trace des Plugin-Lebenszyklus
  - H2: CLI-Start und Befehlsprofiling
  - H2: Gateway-Watch-Modus
  - H2: Dev-Profil + Dev-Gateway (--dev)
  - H2: Rohstream-Protokollierung (OpenClaw)
  - H2: Rohprotokollierung OpenAI-kompatibler Chunks
  - H2: Sicherheitshinweise
  - H2: Debugging in VSCode
  - H3: Einrichtung
  - H3: Hinweise
  - H2: Verwandte Themen

## help/environment.md

- Route: /help/environment
- Überschriften:
  - H2: Vorrang (höchster → niedrigster)
  - H2: Provider-Anmeldedaten und Workspace-.env
  - H2: Config-env-Block
  - H2: Shell-env-Import
  - H2: Exec-Shell-Snapshots
  - H2: Runtime-injizierte env vars
  - H2: UI-env vars
  - H2: env var-Ersetzung in Konfiguration
  - H2: Secret-Refs vs. ${ENV}-Strings
  - H2: Pfadbezogene env vars
  - H2: Protokollierung
  - H3: OPENCLAWHOME
  - H2: nvm-Benutzer: webfetch-TLS-Fehler
  - H2: Legacy-Umgebungsvariablen
  - H2: Verwandte Themen

## help/faq-first-run.md

- Route: /help/faq-first-run
- Überschriften:
  - H2: Schnellstart und Einrichtung beim ersten Lauf
  - H2: Verwandte Themen

## help/faq-models.md

- Route: /help/faq-models
- Überschriften:
  - H2: Modelle: Standards, Auswahl, Aliasse, Wechsel
  - H2: Modell-Failover und „Alle Modelle fehlgeschlagen“
  - H2: Auth-Profile: was sie sind und wie Sie sie verwalten
  - H2: Verwandte Themen

## help/faq.md

- Route: /help/faq
- Überschriften:
  - H2: Die ersten 60 Sekunden, wenn etwas defekt ist
  - H2: Schnellstart und Einrichtung beim ersten Lauf
  - H2: Was ist OpenClaw?
  - H2: Skills und Automatisierung
  - H2: Sandboxing und Speicher
  - H2: Wo Dinge auf der Festplatte liegen
  - H2: Grundlagen der Konfiguration
  - H2: Remote-Gateways und Nodes
  - H2: env vars und .env-Laden
  - H2: Sitzungen und mehrere Chats
  - H2: Modelle, Failover und Auth-Profile
  - H2: Gateway: Ports, „läuft bereits“ und Remote-Modus
  - H2: Protokollierung und Debugging
  - H2: Medien und Anhänge
  - H2: Sicherheit und Zugriffskontrolle
  - H2: Chat-Befehle, Aufgaben abbrechen und „es stoppt nicht“
  - H2: Verschiedenes
  - H2: Verwandte Themen

## help/index.md

- Route: /help
- Überschriften:
  - H2: FAQ
  - H2: Diagnose
  - H2: Testing
  - H2: Community und Meta

## help/scripts.md

- Route: /help/scripts
- Überschriften:
  - H2: Konventionen
  - H2: Skripte zur Auth-Überwachung
  - H2: GitHub-Lesehelfer
  - H2: Beim Hinzufügen von Skripten
  - H2: Verwandte Themen

## help/testing-live.md

- Route: /help/testing-live
- Überschriften:
  - H2: Live: lokale Smoke-Befehle
  - H2: Live: Android-Node-Capability-Sweep
  - H2: Live: Modell-Smoke (Profilschlüssel)
  - H3: Ebene 1: Direkte Modellvervollständigung (kein Gateway)
  - H3: Ebene 2: Gateway + Dev-Agent-Smoke (was „@openclaw“ tatsächlich macht)
  - H2: Live: CLI-Backend-Smoke (Claude, Gemini oder andere lokale CLIs)
  - H2: Live: Erreichbarkeit des APNs-HTTP/2-Proxys
  - H2: Live: ACP-Bind-Smoke (/acp spawn ... --bind here)
  - H2: Live: Codex-App-Server-Harness-Smoke
  - H3: Empfohlene Live-Rezepte
  - H2: Live: Modellmatrix (was wir abdecken)
  - H3: Modernes Smoke-Set (Tool Calling + Bild)
  - H3: Baseline: Tool Calling (Read + optional Exec)
  - H3: Vision: Bildversand (Anhang → multimodale Nachricht)
  - H3: Aggregatoren / alternative Gateways
  - H2: Zugangsdaten (niemals committen)
  - H2: Deepgram live (Audiotranskription)
  - H2: BytePlus-Coding-Plan live
  - H2: ComfyUI-Workflow-Medien live
  - H2: Bildgenerierung live
  - H2: Musikgenerierung live
  - H2: Videogenerierung live
  - H2: Medien-Live-Harness
  - H2: Verwandte Themen

## help/testing-updates-plugins.md

- Route: /help/testing-updates-plugins
- Überschriften:
  - H2: Was wir schützen
  - H2: Lokaler Nachweis während der Entwicklung
  - H2: Docker-Lanes
  - H2: Paketakzeptanz
  - H2: Release-Standard
  - H2: Legacy-Kompatibilität
  - H2: Abdeckung hinzufügen
  - H2: Fehlertriage

## help/testing.md

- Route: /help/testing
- Überschriften:
  - H2: Schnellstart
  - H2: Test-Temp-Verzeichnisse
  - H2: QA-spezifische Runner
  - H3: Gemeinsame Telegram-Zugangsdaten über Convex (v1)
  - H3: Einen Kanal zu QA hinzufügen
  - H2: Test-Suites (was wo läuft)
  - H3: Unit / Integration (Standard)
  - H3: Stabilität (Gateway)
  - H3: E2E (Repo-Aggregat)
  - H3: E2E (Gateway-Smoke)
  - H3: E2E (Control UI mit gemocktem Browser)
  - H3: E2E: OpenShell-Backend-Smoke
  - H3: Live (echte Provider + echte Modelle)
  - H2: Welche Suite sollte ich ausführen?
  - H2: Live-Tests (mit Netzwerkzugriff)
  - H2: Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)
  - H2: Docs-Sanity
  - H2: Offline-Regression (CI-sicher)
  - H2: Agent-Zuverlässigkeits-Evals (Skills)
  - H2: Vertragstests (Plugin- und Kanalform)
  - H3: Befehle
  - H3: Kanalverträge
  - H3: Provider-Statusverträge
  - H3: Provider-Verträge
  - H3: Wann ausführen
  - H2: Regressionen hinzufügen (Anleitung)
  - H2: Verwandte Themen

## help/troubleshooting.md

- Route: /help/troubleshooting
- Überschriften:
  - H2: Die ersten 60 Sekunden
  - H2: Assistant wirkt eingeschränkt oder Tools fehlen
  - H2: Anthropic-Long-Context 429
  - H2: Lokales OpenAI-kompatibles Backend funktioniert direkt, schlägt aber in OpenClaw fehl
  - H2: Plugin-Installation schlägt wegen fehlender openclaw-Extensions fehl
  - H2: Installationsrichtlinie blockiert Plugin-Installationen oder Updates
  - H2: Plugin vorhanden, aber durch verdächtige Eigentümerschaft blockiert
  - H2: Entscheidungsbaum
  - H2: Verwandte Themen

## index.md

- Route: /
- Überschriften:
  - H1: OpenClaw 🦞
  - H2: Was ist OpenClaw?
  - H2: So funktioniert es
  - H2: Zentrale Fähigkeiten
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
  - H3: Schnellbefehle
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
  - H2: Deployment konfigurieren
  - H2: Azure-Ressourcen bereitstellen
  - H2: OpenClaw installieren
  - H2: Kostenüberlegungen
  - H2: Bereinigung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/bun.md

- Route: /install/bun
- Überschriften:
  - H2: Installieren
  - H2: Lifecycle-Skripte
  - H2: Einschränkungen
  - H2: Verwandte Themen

## install/clawdock.md

- Route: /install/clawdock
- Überschriften:
  - H2: Installieren
  - H2: Was Sie erhalten
  - H3: Grundlegende Vorgänge
  - H3: Containerzugriff
  - H3: Web-UI und Pairing
  - H3: Einrichtung und Wartung
  - H3: Hilfsprogramme
  - H2: Ablauf beim ersten Mal
  - H2: Konfiguration und Secrets
  - H2: Verwandte Themen

## install/development-channels.md

- Route: /install/development-channels
- Überschriften:
  - H2: Channels wechseln
  - H2: Einmaliges Ansteuern einer Version oder eines Tags
  - H2: Probelauf
  - H2: Plugins und Channels
  - H2: Aktuellen Status prüfen
  - H2: Best Practices für Tagging
  - H2: Verfügbarkeit der macOS-App
  - H2: Verwandte Themen

## install/digitalocean.md

- Route: /install/digitalocean
- Überschriften:
  - H2: Voraussetzungen
  - H2: Einrichtung
  - H2: Persistenz und Backups
  - H2: Tipps für 1 GB RAM
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/docker-vm-runtime.md

- Route: /install/docker-vm-runtime
- Überschriften:
  - H2: Erforderliche Binaries in das Image einbacken
  - H2: Bauen und starten
  - H2: Was wo persistiert wird
  - H2: Updates
  - H2: Verwandte Themen

## install/docker.md

- Route: /install/docker
- Überschriften:
  - H2: Ist Docker das Richtige für mich?
  - H2: Voraussetzungen
  - H2: Containerisiertes Gateway
  - H3: Manueller Ablauf
  - H3: Umgebungsvariablen
  - H3: Observability
  - H3: Health Checks
  - H3: LAN vs. loopback
  - H3: Lokale Host-Provider
  - H3: Claude-CLI-Backend in Docker
  - H3: Bonjour / mDNS
  - H3: Speicher und Persistenz
  - H3: Shell-Helfer (optional)
  - H3: Auf einem VPS ausführen?
  - H2: Agent-Sandbox
  - H3: Schnell aktivieren
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/exe-dev.md

- Route: /install/exe-dev
- Überschriften:
  - H2: Schneller Pfad für Einsteiger
  - H2: Was Sie benötigen
  - H2: Automatisierte Installation mit Shelley
  - H2: Manuelle Installation
  - H2: 1) VM erstellen
  - H2: 2) Voraussetzungen installieren (auf der VM)
  - H2: 3) OpenClaw installieren
  - H2: 4) nginx einrichten, um OpenClaw auf Port 8000 zu proxyn
  - H2: 5) Auf OpenClaw zugreifen und Berechtigungen gewähren
  - H2: Remote-Channel-Einrichtung
  - H2: Remotezugriff
  - H2: Aktualisierung
  - H2: Verwandte Themen

## install/fly.md

- Route: /install/fly
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schneller Pfad für Einsteiger
  - H2: Fehlerbehebung
  - H3: „App lauscht nicht auf der erwarteten Adresse“
  - H3: Health Checks schlagen fehl / Verbindung verweigert
  - H3: OOM / Speicherprobleme
  - H3: Gateway-Lock-Probleme
  - H3: Konfiguration wird nicht gelesen
  - H3: Konfiguration per SSH schreiben
  - H3: Zustand persistiert nicht
  - H2: Updates
  - H3: Befehl zum Aktualisieren der Maschine
  - H2: Privates Deployment (gehärtet)
  - H3: Wann privates Deployment verwenden
  - H3: Einrichtung
  - H3: Zugriff auf ein privates Deployment
  - H3: Webhooks mit privatem Deployment
  - H3: Sicherheitsvorteile
  - H2: Hinweise
  - H2: Kosten
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/gcp.md

- Route: /install/gcp
- Überschriften:
  - H2: Was machen wir (einfach erklärt)?
  - H2: Schneller Pfad (erfahrene Operatoren)
  - H2: Was Sie benötigen
  - H2: Fehlerbehebung
  - H2: Servicekonten (Best Practice für Sicherheit)
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/hetzner.md

- Route: /install/hetzner
- Überschriften:
  - H2: Ziel
  - H2: Was machen wir (einfach erklärt)?
  - H2: Schneller Pfad (erfahrene Operatoren)
  - H2: Was Sie benötigen
  - H2: Infrastructure as Code (Terraform)
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/hostinger.md

- Route: /install/hostinger
- Überschriften:
  - H2: Voraussetzungen
  - H2: Option A: 1-Click OpenClaw
  - H2: Option B: OpenClaw auf VPS
  - H2: Ihre Einrichtung überprüfen
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/index.md

- Route: /install
- Überschriften:
  - H2: Systemanforderungen
  - H2: Empfohlen: Installer-Skript
  - H2: Alternative Installationsmethoden
  - H3: Lokaler Prefix-Installer (install-cli.sh)
  - H3: npm, pnpm oder bun
  - H3: Aus dem Quellcode
  - H3: Aus dem GitHub-main-Checkout installieren
  - H3: Container und Paketmanager
  - H2: Installation überprüfen
  - H2: Hosting und Deployment
  - H2: Aktualisieren, migrieren oder deinstallieren
  - H2: Fehlerbehebung: openclaw nicht gefunden

## install/installer.md

- Route: /install/installer
- Überschriften:
  - H2: Schnellbefehle
  - H2: install.sh
  - H3: Ablauf (install.sh)
  - H3: Erkennung des Quellcode-Checkouts
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
  - H2: Lokales Testen mit Kind
  - H2: Schritt für Schritt
  - H3: 1) Deployen
  - H3: 2) Auf das Gateway zugreifen
  - H2: Was bereitgestellt wird
  - H2: Anpassung
  - H3: Agent-Anweisungen
  - H3: Gateway-Konfiguration
  - H3: Provider hinzufügen
  - H3: Benutzerdefinierter Namespace
  - H3: Benutzerdefiniertes Image
  - H3: Über Port-Forward hinaus freigeben
  - H2: Erneut deployen
  - H2: Teardown
  - H2: Architekturhinweise
  - H2: Dateistruktur
  - H2: Verwandte Themen

## install/macos-vm.md

- Route: /install/macos-vm
- Überschriften:
  - H2: Empfohlener Standard (die meisten Benutzer)
  - H2: macOS-VM-Optionen
  - H3: Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)
  - H3: Gehostete Mac-Provider (Cloud)
  - H2: Schneller Pfad (Lume, erfahrene Benutzer)
  - H2: Was Sie benötigen (Lume)
  - H2: 1) Lume installieren
  - H2: 2) macOS-VM erstellen
  - H2: 3) Einrichtungsassistent abschließen
  - H2: 4) IP-Adresse der VM abrufen
  - H2: 5) Per SSH in die VM einloggen
  - H2: 6) OpenClaw installieren
  - H2: 7) Channels konfigurieren
  - H2: 8) VM headless ausführen
  - H2: Bonus: iMessage-Integration
  - H2: Golden Image speichern
  - H2: 24/7-Betrieb
  - H2: Fehlerbehebung
  - H2: Verwandte Dokumentation

## install/migrating-claude.md

- Route: /install/migrating-claude
- Überschriften:
  - H2: Zwei Importmöglichkeiten
  - H2: Was importiert wird
  - H2: Was nur im Archiv bleibt
  - H2: Quellenauswahl
  - H2: Empfohlener Ablauf
  - H2: Konfliktbehandlung
  - H2: JSON-Ausgabe für Automatisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/migrating-hermes.md

- Route: /install/migrating-hermes
- Überschriften:
  - H2: Zwei Importmöglichkeiten
  - H2: Was importiert wird
  - H2: Was nur im Archiv bleibt
  - H2: Empfohlener Ablauf
  - H2: Konfliktbehandlung
  - H2: Secrets
  - H2: JSON-Ausgabe für Automatisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/migrating.md

- Route: /install/migrating
- Überschriften:
  - H2: Aus einem anderen Agent-System importieren
  - H2: OpenClaw auf eine neue Maschine umziehen
  - H3: Migrationsschritte
  - H3: Häufige Fallstricke
  - H3: Prüfcheckliste
  - H2: Ein Plugin direkt aktualisieren
  - H2: Verwandte Themen

## install/nix.md

- Route: /install/nix
- Überschriften:
  - H2: Was Sie erhalten
  - H2: Schnellstart
  - H2: Laufzeitverhalten im Nix-Modus
  - H3: Was sich im Nix-Modus ändert
  - H3: Konfigurations- und Zustandspfade
  - H3: Service-PATH-Erkennung
  - H2: Verwandte Themen

## install/node.md

- Route: /install/node
- Überschriften:
  - H2: Ihre Version prüfen
  - H2: Node installieren
  - H2: Fehlerbehebung
  - H3: openclaw: Befehl nicht gefunden
  - H3: Berechtigungsfehler bei npm install -g (Linux)
  - H2: Verwandte Themen

## install/northflank.mdx

- Route: /install/northflank
- Überschriften:
  - H1: Northflank
  - H2: Erste Schritte
  - H2: Was Sie erhalten
  - H2: Einen Channel verbinden
  - H2: Nächste Schritte

## install/oracle.md

- Route: /install/oracle
- Überschriften:
  - H2: Voraussetzungen
  - H2: Einrichtung
  - H2: Sicherheitsstatus überprüfen
  - H2: ARM-Hinweise
  - H2: Persistenz und Backups
  - H2: Fallback: SSH-Tunnel
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
  - H2: Konfiguration, env und Speicher
  - H2: Nützliche Befehle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/railway.mdx

- Route: /install/railway
- Überschriften:
  - H1: Railway
  - H2: Schnelle Checkliste (neue Benutzer)
  - H2: One-Click-Deployment
  - H2: Was Sie erhalten
  - H2: Erforderliche Railway-Einstellungen
  - H3: Öffentliches Netzwerk
  - H3: Volume (erforderlich)
  - H3: Variablen
  - H2: Einen Channel verbinden
  - H2: Backups & Migration
  - H2: Nächste Schritte

## install/raspberry-pi.md

- Route: /install/raspberry-pi
- Überschriften:
  - H2: Hardwarekompatibilität
  - H2: Voraussetzungen
  - H2: Einrichtung
  - H2: Leistungstipps
  - H2: Empfohlene Modelleinrichtung
  - H2: Hinweise zu ARM-Binärdateien
  - H2: Persistenz und Backups
  - H2: Fehlerbehebung
  - H2: Nächste Schritte
  - H2: Siehe auch

## install/render.mdx

- Route: /install/render
- Überschriften:
  - H1: Render
  - H2: Voraussetzungen
  - H2: Mit einem Render-Blueprint bereitstellen
  - H2: Den Blueprint verstehen
  - H2: Einen Tarif auswählen
  - H2: Nach der Bereitstellung
  - H3: Auf die Control UI zugreifen
  - H2: Funktionen des Render-Dashboards
  - H3: Protokolle
  - H3: Shell-Zugriff
  - H3: Umgebungsvariablen
  - H3: Automatische Bereitstellung
  - H2: Benutzerdefinierte Domain
  - H2: Skalierung
  - H2: Backups und Migration
  - H2: Fehlerbehebung
  - H3: Dienst startet nicht
  - H3: Langsame Kaltstarts (kostenlose Stufe)
  - H3: Datenverlust nach erneuter Bereitstellung
  - H3: Fehler bei Health Checks
  - H2: Nächste Schritte

## install/uninstall.md

- Route: /install/uninstall
- Überschriften:
  - H2: Einfacher Weg (CLI noch installiert)
  - H2: Manuelles Entfernen des Dienstes (CLI nicht installiert)
  - H3: macOS (launchd)
  - H3: Linux (systemd-Benutzereinheit)
  - H3: Windows (Geplante Aufgabe)
  - H2: Normale Installation im Vergleich zum Source-Checkout
  - H3: Normale Installation (install.sh / npm / pnpm / bun)
  - H3: Source-Checkout (git clone)
  - H2: Siehe auch

## install/updating.md

- Route: /install/updating
- Überschriften:
  - H2: Empfohlen: openclaw update
  - H2: Zwischen npm- und Git-Installationen wechseln
  - H2: Alternative: Installer erneut ausführen
  - H2: Alternative: manuell mit npm, pnpm oder bun
  - H3: Erweiterte Themen zur npm-Installation
  - H2: Auto-Updater
  - H2: Nach dem Aktualisieren
  - H3: doctor ausführen
  - H3: Gateway neu starten
  - H3: Prüfen
  - H2: Rollback
  - H3: Version anheften (npm)
  - H3: Commit anheften (Source)
  - H2: Wenn Sie feststecken
  - H2: Siehe auch

## install/upstash.md

- Route: /install/upstash
- Überschriften:
  - H2: Voraussetzungen
  - H2: Box erstellen
  - H2: Mit einem SSH-Tunnel verbinden
  - H2: OpenClaw installieren
  - H2: Onboarding ausführen
  - H2: Gateway starten
  - H2: Automatischer Neustart
  - H2: Fehlerbehebung
  - H2: Siehe auch

## logging.md

- Route: /logging
- Überschriften:
  - H2: Speicherort von Protokollen
  - H2: Protokolle lesen
  - H3: CLI: Live-Tail (empfohlen)
  - H3: Control UI (Web)
  - H3: Nur Kanalprotokolle
  - H2: Protokollformate
  - H3: Dateiprotokolle (JSONL)
  - H3: Konsolenausgabe
  - H3: Gateway-WebSocket-Protokolle
  - H2: Protokollierung konfigurieren
  - H3: Protokollstufen
  - H3: Gezielte Model-Transportdiagnose
  - H3: Trace-Korrelation
  - H3: Größe und Timing von Model-Aufrufen
  - H3: Konsolenstile
  - H3: Schwärzung
  - H2: Diagnose und OpenTelemetry
  - H2: Tipps zur Fehlerbehebung
  - H2: Siehe auch

## maturity/scorecard.md

- Route: /maturity/scorecard
- Überschriften:
  - H1: Reifegrad-Scorecard
  - H2: Wofür diese Seite gedacht ist
  - H2: Auf einen Blick
  - H2: Bewertungsbänder
  - H2: Surface-Explorer
  - H2: Zusammenfassung der QA-Nachweise
  - H3: Bereitschaft nach Bereich

## maturity/taxonomy.md

- Route: /maturity/taxonomy
- Überschriften:
  - H1: Reifegrad-Taxonomie
  - H2: Diese Seite lesen
  - H2: Reifegrade
  - H2: Produktbereiche
  - H2: Details
  - H3: Core
  - H3: Plattform
  - H3: Kanal
  - H3: Provider und Tool

## network.md

- Route: /network
- Überschriften:
  - H2: Kernmodell
  - H2: Kopplung + Identität
  - H2: Discovery + Transporte
  - H2: Nodes + Transporte
  - H2: Sicherheit
  - H2: Siehe auch

## nodes/audio.md

- Route: /nodes/audio
- Überschriften:
  - H2: Was funktioniert
  - H2: Automatische Erkennung (Standard)
  - H2: Konfigurationsbeispiele
  - H3: Provider + CLI-Fallback (OpenAI + Whisper CLI)
  - H3: Nur Provider mit Scope-Gating
  - H3: Nur Provider (Deepgram)
  - H3: Nur Provider (Mistral Voxtral)
  - H3: Nur Provider (SenseAudio)
  - H3: Transkript im Chat wiedergeben (Opt-in)
  - H2: Hinweise und Grenzen
  - H3: Unterstützung für Proxy-Umgebungen
  - H2: Erwähnungserkennung in Gruppen
  - H2: Fallstricke
  - H2: Siehe auch

## nodes/camera.md

- Route: /nodes/camera
- Überschriften:
  - H2: iOS-Node
  - H3: Benutzereinstellung (standardmäßig ein)
  - H3: Befehle (über Gateway node.invoke)
  - H3: Vordergrundanforderung
  - H3: CLI-Helfer
  - H2: Android-Node
  - H3: Android-Benutzereinstellung (standardmäßig ein)
  - H3: Berechtigungen
  - H3: Android-Vordergrundanforderung
  - H3: Android-Befehle (über Gateway node.invoke)
  - H3: Payload-Schutz
  - H2: macOS-App
  - H3: Benutzereinstellung (standardmäßig aus)
  - H3: CLI-Helfer (node invoke)
  - H2: Sicherheit + praktische Grenzen
  - H2: macOS-Bildschirmvideo (auf Betriebssystemebene)
  - H2: Siehe auch

## nodes/images.md

- Route: /nodes/images
- Überschriften:
  - H2: Ziele
  - H2: CLI-Oberfläche
  - H2: Verhalten des WhatsApp-Web-Kanals
  - H2: Auto-Reply-Pipeline
  - H2: Eingehende Medien zu Befehlen
  - H2: Grenzen und Fehler
  - H2: Hinweise für Tests
  - H2: Siehe auch

## nodes/index.md

- Route: /nodes
- Überschriften:
  - H2: Kopplung + Status
  - H2: Remote-Node-Host (system.run)
  - H3: Was wo läuft
  - H3: Node-Host starten (Vordergrund)
  - H3: Remote-Gateway über SSH-Tunnel (Loopback-Bindung)
  - H3: Node-Host starten (Dienst)
  - H3: Koppeln + benennen
  - H3: Befehle zur Allowlist hinzufügen
  - H3: exec auf die Node verweisen
  - H2: Befehle aufrufen
  - H2: Befehlsrichtlinie
  - H2: Konfiguration (openclaw.json)
  - H2: Screenshots (Canvas-Snapshots)
  - H3: Canvas-Steuerelemente
  - H3: A2UI (Canvas)
  - H2: Fotos + Videos (Node-Kamera)
  - H2: Bildschirmaufzeichnungen (Nodes)
  - H2: Standort (Nodes)
  - H2: SMS (Android-Nodes)
  - H2: Android-Geräte- + persönliche Datenbefehle
  - H2: Systembefehle (Node-Host / Mac-Node)
  - H2: Exec-Node-Bindung
  - H2: Berechtigungsübersicht
  - H2: Headless-Node-Host (plattformübergreifend)
  - H2: Mac-Node-Modus

## nodes/location-command.md

- Route: /nodes/location-command
- Überschriften:
  - H2: TL;DR
  - H2: Warum ein Selektor (nicht nur ein Schalter)
  - H2: Einstellungsmodell
  - H2: Berechtigungszuordnung (node.permissions)
  - H2: Befehl: location.get
  - H2: Hintergrundverhalten
  - H2: Model-/Tooling-Integration
  - H2: UX-Text (vorgeschlagen)
  - H2: Siehe auch

## nodes/media-understanding.md

- Route: /nodes/media-understanding
- Überschriften:
  - H2: Ziele
  - H2: Verhalten auf hoher Ebene
  - H2: Konfigurationsübersicht
  - H3: Model-Einträge
  - H3: Provider-Anmeldedaten (apiKey)
  - H2: Standardwerte und Grenzen
  - H3: Medienverständnis automatisch erkennen (Standard)
  - H3: Unterstützung für Proxy-Umgebungen (Provider-Models)
  - H2: Fähigkeiten (optional)
  - H2: Provider-Unterstützungsmatrix (OpenClaw-Integrationen)
  - H2: Leitfaden zur Model-Auswahl
  - H2: Richtlinie für Anhänge
  - H2: Konfigurationsbeispiele
  - H2: Statusausgabe
  - H2: Hinweise
  - H2: Siehe auch

## nodes/talk.md

- Route: /nodes/talk
- Überschriften:
  - H2: Verhalten (macOS)
  - H2: Sprachanweisungen in Antworten
  - H2: Konfiguration (/.openclaw/openclaw.json)
  - H2: macOS-UI
  - H2: Android-UI
  - H2: Hinweise
  - H2: Siehe auch

## nodes/troubleshooting.md

- Route: /nodes/troubleshooting
- Überschriften:
  - H2: Befehlsleiter
  - H2: Vordergrundanforderungen
  - H2: Berechtigungsmatrix
  - H2: Kopplung versus Genehmigungen
  - H2: Häufige Node-Fehlercodes
  - H2: Schnelle Wiederherstellungsschleife
  - H2: Siehe auch

## nodes/voicewake.md

- Route: /nodes/voicewake
- Überschriften:
  - H2: Speicher (Gateway-Host)
  - H2: Protokoll
  - H3: Methoden
  - H3: Routing-Methoden (Auslöser → Ziel)
  - H3: Ereignisse
  - H2: Client-Verhalten
  - H3: macOS-App
  - H3: iOS-Node
  - H3: Android-Node
  - H2: Siehe auch

## openclaw-agent-runtime.md

- Route: /openclaw-agent-runtime
- Überschriften:
  - H2: Typprüfung und Linting
  - H2: Agent-Runtime-Tests ausführen
  - H2: Manuelles Testen
  - H2: Zurücksetzen auf einen sauberen Zustand
  - H2: Referenzen
  - H2: Siehe auch

## perplexity.md

- Route: /perplexity
- Überschriften:
  - H2: Siehe auch

## plan/codex-context-engine-harness.md

- Route: /plan/codex-context-engine-harness
- Überschriften:
  - H2: Status
  - H2: Ziel
  - H2: Nicht-Ziele
  - H2: Aktuelle Architektur
  - H2: Aktuelle Lücke
  - H2: Gewünschtes Verhalten
  - H2: Designbeschränkungen
  - H3: Codex-App-Server bleibt kanonisch für nativen Thread-Zustand
  - H3: Context-Engine-Assembly muss in Codex-Eingaben projiziert werden
  - H3: Prompt-Cache-Stabilität ist wichtig
  - H3: Runtime-Auswahlsemantik ändert sich nicht
  - H2: Implementierungsplan
  - H3: 1. Wiederverwendbare Context-Engine-Attempt-Helfer exportieren oder verschieben
  - H3: 2. Codex-Kontextprojektionshelfer hinzufügen
  - H3: 3. Bootstrap vor dem Start des Codex-Threads verdrahten
  - H3: 4. Assembly vor thread/start / thread/resume und turn/start verdrahten
  - H3: 5. Prompt-Cache-stabile Formatierung beibehalten
  - H3: 6. Post-Turn nach der Transkriptspiegelung verdrahten
  - H3: 7. Nutzungs- und Prompt-Cache-Runtime-Kontext normalisieren
  - H3: 8. Compaction-Richtlinie
  - H4: /compact und explizite OpenClaw-Compaction
  - H4: Native Codex-contextCompaction-Ereignisse innerhalb eines Turns
  - H3: 9. Sitzungszurücksetzung und Bindungsverhalten
  - H3: 10. Fehlerbehandlung
  - H2: Testplan
  - H3: Unit-Tests
  - H3: Zu aktualisierende bestehende Tests
  - H3: Integrations-/Live-Tests
  - H2: Beobachtbarkeit
  - H2: Migration / Kompatibilität
  - H2: Offene Fragen
  - H2: Akzeptanzkriterien

## plan/ui-channels.md

- Route: /plan/ui-channels
- Überschriften:
  - H2: Status
  - H2: Problem
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Zielmodell
  - H2: Zustellungsmetadaten
  - H2: Runtime-Fähigkeitsvertrag
  - H2: Kanalzuordnung
  - H2: Refaktorierungsschritte
  - H2: Tests
  - H2: Offene Fragen
  - H2: Siehe auch

## platforms/android.md

- Route: /platforms/android
- Überschriften:
  - H2: Support-Snapshot
  - H2: Systemsteuerung
  - H2: Verbindungs-Runbook
  - H3: Voraussetzungen
  - H3: 1) Gateway starten
  - H3: 2) Discovery prüfen (optional)
  - H4: Tailnet-Discovery (Wien ⇄ London) per Unicast-DNS-SD
  - H3: 3) Von Android aus verbinden
  - H3: Presence-Alive-Beacons
  - H3: 4) Kopplung genehmigen (CLI)
  - H3: 5) Prüfen, ob die Node verbunden ist
  - H3: 6) Chat + Verlauf
  - H3: 7) Canvas + Kamera
  - H4: Gateway-Canvas-Host (empfohlen für Webinhalte)
  - H3: 8) Sprache + erweiterte Android-Befehlsoberfläche
  - H2: Assistant-Einstiegspunkte
  - H2: Benachrichtigungsweiterleitung
  - H2: Siehe auch

## platforms/digitalocean.md

- Route: /platforms/digitalocean
- Überschriften:
  - H2: Siehe auch

## platforms/easyrunner.md

- Route: /platforms/easyrunner
- Überschriften:
  - H2: Bevor Sie beginnen
  - H2: Compose-App
  - H2: OpenClaw konfigurieren
  - H2: Prüfen
  - H2: Updates und Backups
  - H2: Fehlerbehebung

## platforms/index.md

- Route: /platforms
- Überschriften:
  - H2: Wählen Sie Ihr Betriebssystem
  - H2: VPS und Hosting
  - H2: Häufige Links
  - H2: Gateway-Dienstinstallation (CLI)
  - H2: Siehe auch

## platforms/ios.md

- Route: /platforms/ios
- Überschriften:
  - H2: Was es tut
  - H2: Anforderungen
  - H2: Schnellstart (koppeln + verbinden)
  - H2: Relay-gestützter Push für offizielle Builds
  - H2: Background-Alive-Beacons
  - H2: Authentifizierungs- und Vertrauensfluss
  - H2: Discovery-Pfade
  - H3: Bonjour (LAN)
  - H3: Tailnet (netzwerkübergreifend)
  - H3: Manueller Host/Port
  - H2: Canvas + A2UI
  - H2: Beziehung zu Computer Use
  - H3: Canvas-Eval / Snapshot
  - H2: Voice Wake + Talk-Modus
  - H2: Häufige Fehler
  - H2: Verwandte Dokumentation

## platforms/linux.md

- Route: /platforms/linux
- Überschriften:
  - H2: Schneller Einstieg für Anfänger (VPS)
  - H2: Installation
  - H2: Gateway
  - H2: Gateway-Dienstinstallation (CLI)
  - H2: Systemsteuerung (systemd-Benutzereinheit)
  - H2: Speicherdruck und OOM-Kills
  - H2: Siehe auch

## platforms/mac/bundled-gateway.md

- Route: /platforms/mac/bundled-gateway
- Überschriften:
  - H2: CLI installieren (für lokalen Modus erforderlich)
  - H2: Launchd (Gateway als LaunchAgent)
  - H2: Versionskompatibilität
  - H2: Zustandsverzeichnis unter macOS
  - H2: App-Konnektivität debuggen
  - H2: Smoke-Check
  - H2: Siehe auch

## platforms/mac/canvas.md

- Route: /platforms/mac/canvas
- Überschriften:
  - H2: Wo Canvas liegt
  - H2: Panel-Verhalten
  - H2: Agent-API-Oberfläche
  - H2: A2UI in Canvas
  - H3: A2UI-Befehle (v0.8)
  - H2: Agent-Ausführungen aus Canvas auslösen
  - H2: Sicherheitshinweise
  - H2: Siehe auch

## platforms/mac/child-process.md

- Route: /platforms/mac/child-process
- Überschriften:
  - H2: Standardverhalten (launchd)
  - H2: Unsignierte Dev-Builds
  - H2: Nur-Anhängen-Modus
  - H2: Remote-Modus
  - H2: Warum wir launchd bevorzugen
  - H2: Siehe auch

## platforms/mac/dev-setup.md

- Route: /platforms/mac/dev-setup
- Überschriften:
  - H1: macOS-Entwicklereinrichtung
  - H2: Voraussetzungen
  - H2: 1. Abhängigkeiten installieren
  - H2: 2. App bauen und paketieren
  - H2: 3. CLI installieren
  - H2: Fehlerbehebung
  - H3: Build schlägt fehl: Toolchain- oder SDK-Abweichung
  - H3: App stürzt bei Berechtigungserteilung ab
  - H3: Gateway bleibt unbegrenzt bei „Starting...“
  - H2: Verwandte Themen

## platforms/mac/health.md

- Route: /platforms/mac/health
- Überschriften:
  - H1: Zustandsprüfungen unter macOS
  - H2: Menüleiste
  - H2: Einstellungen
  - H2: Funktionsweise der Prüfung
  - H2: Im Zweifel
  - H2: Verwandte Themen

## platforms/mac/icon.md

- Route: /platforms/mac/icon
- Überschriften:
  - H1: Zustände des Menüleistensymbols
  - H2: Verwandte Themen

## platforms/mac/logging.md

- Route: /platforms/mac/logging
- Überschriften:
  - H1: Protokollierung (macOS)
  - H2: Rollierendes Diagnose-Dateiprotokoll (Debug-Bereich)
  - H2: Private Daten in der einheitlichen Protokollierung unter macOS
  - H2: Für OpenClaw aktivieren (ai.openclaw)
  - H2: Nach dem Debugging deaktivieren
  - H2: Verwandte Themen

## platforms/mac/menu-bar.md

- Route: /platforms/mac/menu-bar
- Überschriften:
  - H2: Was angezeigt wird
  - H2: Zustandsmodell
  - H2: IconState-Enum (Swift)
  - H3: ActivityKind → Glyph
  - H3: Visuelle Zuordnung
  - H2: Kontext-Untermenü
  - H2: Text der Statuszeile (Menü)
  - H2: Ereignisaufnahme
  - H2: Debug-Override
  - H2: Test-Checkliste
  - H2: Verwandte Themen

## platforms/mac/peekaboo.md

- Route: /platforms/mac/peekaboo
- Überschriften:
  - H2: Was dies ist (und was nicht)
  - H2: Beziehung zur Computernutzung
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
  - H2: Bedienungshilfenfreigaben für Node- und CLI-Runtimes
  - H2: Wiederherstellungs-Checkliste, wenn Aufforderungen verschwinden
  - H2: Dateien- und Ordnerberechtigungen (Schreibtisch/Dokumente/Downloads)
  - H2: Verwandte Themen

## platforms/mac/remote.md

- Route: /platforms/mac/remote
- Überschriften:
  - H2: Modi
  - H2: Remote-Transporte
  - H2: Voraussetzungen auf dem Remote-Host
  - H2: Einrichtung der macOS-App
  - H2: Web-Chat
  - H2: Berechtigungen
  - H2: Sicherheitshinweise
  - H2: WhatsApp-Anmeldeablauf (remote)
  - H2: Fehlerbehebung
  - H2: Benachrichtigungstöne
  - H2: Verwandte Themen

## platforms/mac/signing.md

- Route: /platforms/mac/signing
- Überschriften:
  - H1: mac-Signierung (Debug-Builds)
  - H2: Verwendung
  - H3: Hinweis zur Ad-hoc-Signierung
  - H2: Build-Metadaten für „Über“
  - H2: Warum
  - H2: Verwandte Themen

## platforms/mac/skills.md

- Route: /platforms/mac/skills
- Überschriften:
  - H2: Datenquelle
  - H2: Installationsaktionen
  - H2: Env/API-Schlüssel
  - H2: Remote-Modus
  - H2: Verwandte Themen

## platforms/mac/voice-overlay.md

- Route: /platforms/mac/voice-overlay
- Überschriften:
  - H1: Lebenszyklus des Sprach-Overlays (macOS)
  - H2: Aktuelle Absicht
  - H2: Implementiert (9. Dez. 2025)
  - H2: Nächste Schritte
  - H2: Debugging-Checkliste
  - H2: Migrationsschritte (vorgeschlagen)
  - H2: Verwandte Themen

## platforms/mac/voicewake.md

- Route: /platforms/mac/voicewake
- Überschriften:
  - H1: Voice Wake & Push-to-Talk
  - H2: Anforderungen
  - H2: Modi
  - H2: Runtime-Verhalten (Wake-Word)
  - H2: Lebenszyklus-Invarianten
  - H2: Fehlermodus eines haftenden Overlays (vorher)
  - H2: Push-to-Talk-Spezifika
  - H2: Benutzerseitige Einstellungen
  - H2: Weiterleitungsverhalten
  - H2: Weiterleitungs-Payload
  - H2: Schnelle Verifizierung
  - H2: Verwandte Themen

## platforms/mac/webchat.md

- Route: /platforms/mac/webchat
- Überschriften:
  - H2: Start und Debugging
  - H2: Wie es verdrahtet ist
  - H2: Sicherheitsoberfläche
  - H2: Bekannte Einschränkungen
  - H2: Verwandte Themen

## platforms/mac/xpc.md

- Route: /platforms/mac/xpc
- Überschriften:
  - H1: OpenClaw-macOS-IPC-Architektur
  - H2: Ziele
  - H2: Funktionsweise
  - H3: Gateway + Node-Transport
  - H3: Node-Dienst + App-IPC
  - H3: PeekabooBridge (UI-Automatisierung)
  - H2: Betriebsabläufe
  - H2: Hinweise zur Härtung
  - H2: Verwandte Themen

## platforms/macos.md

- Route: /platforms/macos
- Überschriften:
  - H2: Download
  - H2: Erster Start
  - H2: Gateway-Modus auswählen
  - H2: Zuständigkeiten der App
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
  - H3: Was Windows Hub enthält
  - H3: Erster Start
  - H2: Windows-Node-Modus
  - H2: Lokaler MCP-Modus
  - H2: Native Windows-CLI und Gateway
  - H2: WSL2-Gateway
  - H2: Automatischer Gateway-Start vor der Windows-Anmeldung
  - H2: WSL-Dienste über LAN freigeben
  - H2: Fehlerbehebung
  - H3: Das Tray-Symbol wird nicht angezeigt
  - H3: Lokale Einrichtung schlägt fehl
  - H3: Die App meldet, dass Pairing erforderlich ist
  - H3: Web-Chat kann keinen Remote-Gateway erreichen
  - H3: screen.snapshot-, Kamera- oder Audiobefehle schlagen fehl
  - H3: Git- oder GitHub-Verbindung schlägt fehl
  - H2: Verwandte Themen

## plugins/adding-capabilities.md

- Route: /plugins/adding-capabilities
- Überschriften:
  - H2: Wann eine Capability erstellt werden sollte
  - H2: Die Standardsequenz
  - H2: Was wohin gehört
  - H2: Provider- und Harness-Nähte
  - H2: Datei-Checkliste
  - H2: Ausgearbeitetes Beispiel: Bilderzeugung
  - H2: Embedding-Provider
  - H2: Review-Checkliste
  - H2: Verwandte Themen

## plugins/admin-http-rpc.md

- Route: /plugins/admin-http-rpc
- Überschriften:
  - H2: Bevor Sie es aktivieren
  - H2: Aktivieren
  - H2: Route verifizieren
  - H2: Authentifizierung
  - H2: Sicherheitsmodell
  - H2: Anfrage
  - H2: Antwort
  - H2: Erlaubte Methoden
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
  - H2: Lade-Pipeline
  - H3: Manifest-First-Verhalten
  - H3: Plugin-Cache-Grenze
  - H2: Registry-Modell
  - H2: Callbacks für Konversationsbindung
  - H2: Provider-Runtime-Hooks
  - H3: Hook-Reihenfolge und Verwendung
  - H3: Provider-Beispiel
  - H3: Eingebaute Beispiele
  - H2: Runtime-Helfer
  - H3: api.runtime.imageGeneration
  - H2: Gateway-HTTP-Routen
  - H2: Plugin-SDK-Importpfade
  - H2: Nachrichtentool-Schemas
  - H2: Auflösung von Channel-Zielen
  - H2: Konfigurationsgestützte Verzeichnisse
  - H2: Provider-Kataloge
  - H2: Schreibgeschützte Channel-Inspektion
  - H2: Paket-Packs
  - H3: Channel-Katalogmetadaten
  - H2: Kontext-Engine-Plugins
  - H2: Neue Capability hinzufügen
  - H3: Capability-Checkliste
  - H3: Capability-Vorlage
  - H2: Verwandte Themen

## plugins/architecture.md

- Route: /plugins/architecture
- Überschriften:
  - H2: Öffentliches Capability-Modell
  - H3: Haltung zur externen Kompatibilität
  - H3: Plugin-Formen
  - H3: Legacy-Hooks
  - H3: Kompatibilitätssignale
  - H2: Architekturüberblick
  - H3: Plugin-Metadaten-Snapshot und Nachschlagetabelle
  - H3: Aktivierungsplanung
  - H3: Channel-Plugins und das gemeinsame Nachrichtentool
  - H2: Capability-Zuständigkeitsmodell
  - H3: Capability-Schichtung
  - H3: Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities
  - H3: Capability-Beispiel: Videoverständnis
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
  - H2: Tools registrieren
  - H2: Importkonventionen
  - H2: Checkliste vor der Einreichung
  - H2: Gegen Beta-Releases testen
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## plugins/bundles.md

- Route: /plugins/bundles
- Überschriften:
  - H2: Warum Bundles existieren
  - H2: Bundle installieren
  - H2: Was OpenClaw aus Bundles zuordnet
  - H3: Derzeit unterstützt
  - H4: Skill-Inhalte
  - H4: Hook-Packs
  - H4: MCP für eingebettetes OpenClaw
  - H4: Eingebettete OpenClaw-Einstellungen
  - H4: Eingebettetes OpenClaw-LSP
  - H3: Erkannt, aber nicht ausgeführt
  - H2: Bundle-Formate
  - H2: Erkennungspriorität
  - H2: Runtime-Abhängigkeiten und Bereinigung
  - H2: Sicherheit
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/cli-backend-plugins.md

- Route: /plugins/cli-backend-plugins
- Überschriften:
  - H2: Zuständigkeiten des Plugins
  - H2: Minimales Backend-Plugin
  - H2: Konfigurationsform
  - H2: Erweiterte Backend-Hooks
  - H3: ownsNativeCompaction: Abmelden von OpenClaw-Compaction
  - H2: MCP-Tool-Bridge
  - H2: Benutzerkonfiguration
  - H2: Verifizierung
  - H2: Checkliste
  - H2: Verwandte Themen

## plugins/codex-computer-use.md

- Route: /plugins/codex-computer-use
- Überschriften:
  - H2: OpenClaw.app und Peekaboo
  - H2: iOS-App
  - H2: Direktes cua-driver-MCP
  - H2: Schnelle Einrichtung
  - H2: Befehle
  - H2: Marketplace-Auswahl
  - H2: Gebündelter macOS-Marketplace
  - H2: Remote-Kataloglimit
  - H2: Konfigurationsreferenz
  - H2: Was OpenClaw prüft
  - H2: macOS-Berechtigungen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/codex-harness-reference.md

- Route: /plugins/codex-harness-reference
- Überschriften:
  - H2: Plugin-Konfigurationsoberfläche
  - H2: App-Server-Transport
  - H2: Genehmigungs- und Sandbox-Modi
  - H2: Sandboxed native Ausführung
  - H2: Auth- und Umgebungsisolation
  - H2: Dynamische Tools
  - H2: Timeouts
  - H2: Modellerkennung
  - H2: Workspace-Bootstrap-Dateien
  - H2: Umgebungs-Overrides
  - H2: Verwandte Themen

## plugins/codex-harness-runtime.md

- Route: /plugins/codex-harness-runtime
- Überschriften:
  - H2: Überblick
  - H2: Thread-Bindungen und Modelländerungen
  - H2: Sichtbare Antworten und Heartbeats
  - H2: Hook-Grenzen
  - H2: V1-Supportvertrag
  - H2: Native Berechtigungen und MCP-Elicitations
  - H2: Queue-Steuerung
  - H2: Codex-Feedback-Upload
  - H2: Compaction und Transcript-Spiegel
  - H2: Medien und Zustellung
  - H2: Verwandte Themen

## plugins/codex-harness.md

- Route: /plugins/codex-harness
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Konfiguration
  - H2: Codex-Runtime verifizieren
  - H2: Routing und Modellauswahl
  - H2: Bereitstellungsmuster
  - H3: Einfache Codex-Bereitstellung
  - H3: Bereitstellung mit gemischten Providern
  - H3: Fail-Closed-Codex-Bereitstellung
  - H2: App-Server-Richtlinie
  - H2: Befehle und Diagnose
  - H3: Codex-Threads lokal inspizieren
  - H2: Native Codex-Plugins
  - H2: Computernutzung
  - H2: Runtime-Grenzen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/codex-native-plugins.md

- Route: /plugins/codex-native-plugins
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Plugins aus dem Chat verwalten
  - H2: Funktionsweise der nativen Plugin-Einrichtung
  - H2: V1-Supportgrenze
  - H2: App-Inventar und Zuständigkeit
  - H2: Thread-App-Konfiguration
  - H2: Richtlinie für destruktive Aktionen
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
  - H2: Kompatibilitäts-Registry
  - H2: Plugin-Inspector-Paket
  - H3: Maintainer-Akzeptanz-Lane
  - H2: Deprecation-Richtlinie
  - H2: Aktuelle Kompatibilitätsbereiche
  - H3: Flache Aliase für eingehende WhatsApp-Callbacks
  - H3: Zulassungsfelder für eingehende WhatsApp-Nachrichten
  - H2: Release Notes

## plugins/copilot.md

- Route: /plugins/copilot
- Überschriften:
  - H2: Anforderungen
  - H2: Plugin-Installation
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H2: BYOK
  - H2: Auth
  - H2: Konfigurationsoberfläche
  - H2: Compaction
  - H2: Transcript-Spiegelung
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
  - H2: Installationswurzeln
  - H2: Lokale Plugins
  - H2: Start und Neuladen
  - H2: Gebündelte Plugins
  - H2: Legacy-Bereinigung

## plugins/google-meet.md

- Route: /plugins/google-meet
- Überschriften:
  - H2: Schnellstart
  - H3: Lokaler Gateway + Parallels Chrome
  - H2: Installationshinweise
  - H2: Transporte
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth und Preflight
  - H3: Google-Zugangsdaten erstellen
  - H3: Refresh-Token ausstellen
  - H3: OAuth mit doctor verifizieren
  - H2: Konfiguration
  - H2: Tool
  - H2: Agent- und bidi-Modi
  - H2: Checkliste für Live-Tests
  - H2: Fehlerbehebung
  - H3: Agent kann das Google Meet-Tool nicht sehen
  - H3: Kein verbundener Google Meet-fähiger Node
  - H3: Browser öffnet sich, aber Agent kann nicht beitreten
  - H3: Meeting-Erstellung schlägt fehl
  - H3: Agent tritt bei, spricht aber nicht
  - H3: Twilio-Einrichtungsprüfungen schlagen fehl
  - H3: Twilio-Anruf startet, tritt dem Meeting aber nie bei
  - H2: Hinweise
  - H2: Verwandte Themen

## plugins/hooks.md

- Route: /plugins/hooks
- Überschriften:
  - H2: Schnellstart
  - H2: Hook-Katalog
  - H2: Runtime-Hooks debuggen
  - H2: Tool-Aufrufrichtlinie
  - H3: Hook für Ausführungsumgebung
  - H3: Persistenz von Tool-Ergebnissen
  - H2: Prompt- und Modell-Hooks
  - H3: Sitzungserweiterungen und Injektionen für die nächste Runde
  - H2: Nachrichten-Hooks
  - H2: Hooks installieren
  - H2: Gateway-Lebenszyklus
  - H2: Kommende Veraltungen
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

## plugins/manage-plugins.md

- Route: /plugins/manage-plugins
- Überschriften:
  - H2: Plugins auflisten und suchen
  - H2: Plugins installieren
  - H2: Neu starten und prüfen
  - H2: Plugins aktualisieren
  - H2: Plugins deinstallieren
  - H2: Quelle auswählen
  - H2: Plugins veröffentlichen
  - H2: Verwandte Themen

## plugins/manifest.md

- Route: /plugins/manifest
- Überschriften:
  - H2: Was diese Datei leistet
  - H2: Minimales Beispiel
  - H2: Umfangreiches Beispiel
  - H2: Referenz der Felder auf oberster Ebene
  - H2: Referenz der Metadaten für Generierungs-Provider
  - H2: Referenz der Tool-Metadaten
  - H2: providerAuthChoices-Referenz
  - H2: commandAliases-Referenz
  - H2: activation-Referenz
  - H2: qaRunners-Referenz
  - H2: setup-Referenz
  - H3: setup.providers-Referenz
  - H3: setup-Felder
  - H2: uiHints-Referenz
  - H2: contracts-Referenz
  - H2: mediaUnderstandingProviderMetadata-Referenz
  - H2: channelConfigs-Referenz
  - H3: Ein anderes Kanal-Plugin ersetzen
  - H2: modelSupport-Referenz
  - H2: modelCatalog-Referenz
  - H2: modelIdNormalization-Referenz
  - H2: providerEndpoints-Referenz
  - H2: providerRequest-Referenz
  - H2: secretProviderIntegrations-Referenz
  - H2: modelPricing-Referenz
  - H3: OpenClaw Provider Index
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
  - H2: Provider-gestützte Embeddings
  - H2: Ollama-Embeddings
  - H2: OpenAI-kompatible Provider
  - H2: Abruf- und Erfassungslimits
  - H2: Befehle
  - H2: Speicher
  - H2: Runtime-Abhängigkeiten
  - H2: Fehlerbehebung
  - H3: Eingabelänge überschreitet die Kontextlänge
  - H3: Nicht unterstütztes Embedding-Modell
  - H3: Plugin wird geladen, aber es erscheinen keine Erinnerungen
  - H2: Verwandte Themen

## plugins/memory-wiki.md

- Route: /plugins/memory-wiki
- Überschriften:
  - H2: Was es hinzufügt
  - H2: Wie es zu Memory passt
  - H2: Empfohlenes Hybridmuster
  - H2: Vault-Modi
  - H3: isoliert
  - H3: Bridge
  - H3: unsafe-local
  - H2: Vault-Layout
  - H2: Importe im Open Knowledge Format
  - H2: Strukturierte Aussagen und Nachweise
  - H2: Agent-seitige Entitätsmetadaten
  - H2: Compile-Pipeline
  - H2: Dashboards und Zustandsberichte
  - H2: Suche und Abruf
  - H2: Agent-Tools
  - H2: Prompt- und Kontextverhalten
  - H2: Konfiguration
  - H3: Beispiel: QMD + Bridge-Modus
  - H2: CLI
  - H2: Obsidian-Unterstützung
  - H2: Empfohlener Workflow
  - H2: Verwandte Dokumentation

## plugins/message-presentation.md

- Route: /plugins/message-presentation
- Überschriften:
  - H2: Vertrag
  - H2: Producer-Beispiele
  - H2: Renderer-Vertrag
  - H2: Core-Renderablauf
  - H2: Degradationsregeln
  - H2: Provider-Zuordnung
  - H2: Darstellung vs. InteractiveReply
  - H2: Zustellungs-Pin
  - H2: Checkliste für Plugin-Autoren
  - H2: Verwandte Dokumentation

## plugins/oc-path.md

- Route: /plugins/oc-path
- Überschriften:
  - H2: Warum Sie es aktivieren sollten
  - H2: Wo es ausgeführt wird
  - H2: Aktivieren
  - H2: Abhängigkeiten
  - H2: Was es bereitstellt
  - H2: Beziehung zu anderen Plugins
  - H2: Sicherheit
  - H2: Verwandte Themen

## plugins/plugin-inventory.md

- Route: /plugins/plugin-inventory
- Überschriften:
  - H1: Plugin-Inventar
  - H2: Definitionen
  - H2: Ein Plugin installieren
  - H2: Core-npm-Paket
  - H2: Offizielle externe Pakete
  - H2: Nur Source-Checkout

## plugins/plugin-permission-requests.md

- Route: /plugins/plugin-permission-requests
- Überschriften:
  - H2: Das richtige Gate auswählen
  - H2: Genehmigung vor einem Tool-Aufruf anfordern
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
  - H1: Amazon Bedrock Mantle-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/amazon-bedrock.md

- Route: /plugins/reference/amazon-bedrock
- Überschriften:
  - H1: Amazon Bedrock-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/anthropic-vertex.md

- Route: /plugins/reference/anthropic-vertex
- Überschriften:
  - H1: Anthropic Vertex-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Claude Fable 5

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
  - H1: Azure Speech-Plugin
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
  - H1: Cloudflare AI Gateway-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/codex-supervisor.md

- Route: /plugins/reference/codex-supervisor
- Überschriften:
  - H1: Codex Supervisor-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Sitzungsauflistung

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
  - H1: Copilot Proxy-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/copilot.md

- Route: /plugins/reference/copilot
- Überschriften:
  - H1: Copilot-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/deepgram.md

- Route: /plugins/reference/deepgram
- Überschriften:
  - H1: Deepgram-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/deepinfra.md

- Route: /plugins/reference/deepinfra
- Überschriften:
  - H1: DeepInfra-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/deepseek.md

- Route: /plugins/reference/deepseek
- Überschriften:
  - H1: DeepSeek-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/diagnostics-otel.md

- Route: /plugins/reference/diagnostics-otel
- Überschriften:
  - H1: Diagnostics OpenTelemetry-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/diagnostics-prometheus.md

- Route: /plugins/reference/diagnostics-prometheus
- Überschriften:
  - H1: Diagnostics Prometheus-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/diffs-language-pack.md

- Route: /plugins/reference/diffs-language-pack
- Überschriften:
  - H1: Diffs Language Pack-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Hinzugefügte Sprachen

## plugins/reference/diffs.md

- Route: /plugins/reference/diffs
- Überschriften:
  - H1: Diffs-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/discord.md

- Route: /plugins/reference/discord
- Überschriften:
  - H1: Discord-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/document-extract.md

- Route: /plugins/reference/document-extract
- Überschriften:
  - H1: Document Extract-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/duckduckgo.md

- Route: /plugins/reference/duckduckgo
- Überschriften:
  - H1: DuckDuckGo-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/elevenlabs.md

- Route: /plugins/reference/elevenlabs
- Überschriften:
  - H1: Elevenlabs-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/exa.md

- Route: /plugins/reference/exa
- Überschriften:
  - H1: Exa-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/fal.md

- Route: /plugins/reference/fal
- Überschriften:
  - H1: fal-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/feishu.md

- Route: /plugins/reference/feishu
- Überschriften:
  - H1: Feishu-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/file-transfer.md

- Route: /plugins/reference/file-transfer
- Überschriften:
  - H1: File Transfer-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/firecrawl.md

- Route: /plugins/reference/firecrawl
- Überschriften:
  - H1: Firecrawl-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/fireworks.md

- Route: /plugins/reference/fireworks
- Überschriften:
  - H1: Fireworks-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/github-copilot.md

- Route: /plugins/reference/github-copilot
- Überschriften:
  - H1: GitHub Copilot-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/gmi.md

- Route: /plugins/reference/gmi
- Überschriften:
  - H1: Gmi-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/google-meet.md

- Route: /plugins/reference/google-meet
- Überschriften:
  - H1: Google Meet-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/google.md

- Route: /plugins/reference/google
- Überschriften:
  - H1: Google-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/googlechat.md

- Route: /plugins/reference/googlechat
- Überschriften:
  - H1: Google Chat-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/gradium.md

- Route: /plugins/reference/gradium
- Überschriften:
  - H1: Gradium-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/groq.md

- Route: /plugins/reference/groq
- Überschriften:
  - H1: Groq-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/huggingface.md

- Route: /plugins/reference/huggingface
- Überschriften:
  - H1: Hugging Face-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/imessage.md

- Route: /plugins/reference/imessage
- Überschriften:
  - H1: iMessage-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/inworld.md

- Route: /plugins/reference/inworld
- Überschriften:
  - H1: Inworld-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/irc.md

- Route: /plugins/reference/irc
- Überschriften:
  - H1: IRC-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/kilocode.md

- Route: /plugins/reference/kilocode
- Überschriften:
  - H1: Kilocode-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/kimi.md

- Route: /plugins/reference/kimi
- Überschriften:
  - H1: Kimi-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/line.md

- Route: /plugins/reference/line
- Überschriften:
  - H1: LINE-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/litellm.md

- Route: /plugins/reference/litellm
- Überschriften:
  - H1: LiteLLM-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/llama-cpp.md

- Route: /plugins/reference/llama-cpp
- Überschriften:
  - H1: Llama Cpp-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/llm-task.md

- Route: /plugins/reference/llm-task
- Überschriften:
  - H1: LLM Task-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/lmstudio.md

- Route: /plugins/reference/lmstudio
- Überschriften:
  - H1: LM Studio-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/lobster.md

- Route: /plugins/reference/lobster
- Überschriften:
  - H1: Lobster-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/matrix.md

- Route: /plugins/reference/matrix
- Überschriften:
  - H1: Matrix-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/mattermost.md

- Route: /plugins/reference/mattermost
- Überschriften:
  - H1: Mattermost-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/memory-core.md

- Route: /plugins/reference/memory-core
- Überschriften:
  - H1: Memory Core-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/memory-lancedb.md

- Route: /plugins/reference/memory-lancedb
- Überschriften:
  - H1: Memory Lancedb-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/memory-wiki.md

- Route: /plugins/reference/memory-wiki
- Überschriften:
  - H1: Memory Wiki-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/microsoft-foundry.md

- Route: /plugins/reference/microsoft-foundry
- Überschriften:
  - H1: Microsoft Foundry-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Anforderungen
  - H2: Chatmodelle
  - H2: MAI-Bildgenerierung
  - H2: Fehlerbehebung

## plugins/reference/microsoft.md

- Route: /plugins/reference/microsoft
- Überschriften:
  - H1: Microsoft-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/migrate-claude.md

- Route: /plugins/reference/migrate-claude
- Überschriften:
  - H1: Claude migrieren-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/migrate-hermes.md

- Route: /plugins/reference/migrate-hermes
- Überschriften:
  - H1: Hermes migrieren-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/minimax.md

- Route: /plugins/reference/minimax
- Überschriften:
  - H1: MiniMax-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/mistral.md

- Route: /plugins/reference/mistral
- Überschriften:
  - H1: Mistral-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/moonshot.md

- Route: /plugins/reference/moonshot
- Überschriften:
  - H1: Moonshot-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/msteams.md

- Route: /plugins/reference/msteams
- Überschriften:
  - H1: Microsoft Teams-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/nextcloud-talk.md

- Route: /plugins/reference/nextcloud-talk
- Überschriften:
  - H1: Nextcloud Talk-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/nostr.md

- Route: /plugins/reference/nostr
- Überschriften:
  - H1: Nostr-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/novita.md

- Route: /plugins/reference/novita
- Überschriften:
  - H1: Novita-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/nvidia.md

- Route: /plugins/reference/nvidia
- Überschriften:
  - H1: NVIDIA-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/oc-path.md

- Route: /plugins/reference/oc-path
- Überschriften:
  - H1: Oc Path-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/ollama.md

- Route: /plugins/reference/ollama
- Überschriften:
  - H1: Ollama-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/open-prose.md

- Route: /plugins/reference/open-prose
- Überschriften:
  - H1: Open Prose-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/openai.md

- Route: /plugins/reference/openai
- Überschriften:
  - H1: OpenAI-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/opencode-go.md

- Route: /plugins/reference/opencode-go
- Überschriften:
  - H1: OpenCode Go-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/opencode.md

- Route: /plugins/reference/opencode
- Überschriften:
  - H1: OpenCode-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/openrouter.md

- Route: /plugins/reference/openrouter
- Überschriften:
  - H1: OpenRouter-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/openshell.md

- Route: /plugins/reference/openshell
- Überschriften:
  - H1: Openshell-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/perplexity.md

- Route: /plugins/reference/perplexity
- Überschriften:
  - H1: Perplexity-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/pixverse.md

- Route: /plugins/reference/pixverse
- Überschriften:
  - H1: PixVerse-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/policy.md

- Route: /plugins/reference/policy
- Überschriften:
  - H1: Policy-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verhalten
  - H2: Verwandte Dokumentation

## plugins/reference/qa-channel.md

- Route: /plugins/reference/qa-channel
- Überschriften:
  - H1: QA Channel-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/qa-lab.md

- Route: /plugins/reference/qa-lab
- Überschriften:
  - H1: QA Lab-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/qa-matrix.md

- Route: /plugins/reference/qa-matrix
- Überschriften:
  - H1: QA Matrix-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/qianfan.md

- Route: /plugins/reference/qianfan
- Überschriften:
  - H1: Qianfan-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/qqbot.md

- Route: /plugins/reference/qqbot
- Überschriften:
  - H1: QQ Bot-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/qwen.md

- Route: /plugins/reference/qwen
- Überschriften:
  - H1: Qwen-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/raft.md

- Route: /plugins/reference/raft
- Überschriften:
  - H1: Raft-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/runway.md

- Route: /plugins/reference/runway
- Überschriften:
  - H1: Runway-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

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
  - H2: Verwandte Dokumentation

## plugins/reference/sglang.md

- Route: /plugins/reference/sglang
- Überschriften:
  - H1: SGLang-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/signal.md

- Route: /plugins/reference/signal
- Überschriften:
  - H1: Signal-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/slack.md

- Route: /plugins/reference/slack
- Überschriften:
  - H1: Slack-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/sms.md

- Route: /plugins/reference/sms
- Überschriften:
  - H1: Sms-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/stepfun.md

- Route: /plugins/reference/stepfun
- Überschriften:
  - H1: StepFun-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/synology-chat.md

- Route: /plugins/reference/synology-chat
- Überschriften:
  - H1: Synology Chat-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/synthetic.md

- Route: /plugins/reference/synthetic
- Überschriften:
  - H1: Synthetic-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tavily.md

- Route: /plugins/reference/tavily
- Überschriften:
  - H1: Tavily-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/telegram.md

- Route: /plugins/reference/telegram
- Überschriften:
  - H1: Telegram-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tencent.md

- Route: /plugins/reference/tencent
- Überschriften:
  - H1: Tencent-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tlon.md

- Route: /plugins/reference/tlon
- Überschriften:
  - H1: Tlon-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/together.md

- Route: /plugins/reference/together
- Überschriften:
  - H1: Together-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tokenjuice.md

- Route: /plugins/reference/tokenjuice
- Überschriften:
  - H1: Tokenjuice-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tts-local-cli.md

- Route: /plugins/reference/tts-local-cli
- Überschriften:
  - H1: TTS Local CLI-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/twitch.md

- Route: /plugins/reference/twitch
- Überschriften:
  - H1: Twitch-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/venice.md

- Route: /plugins/reference/venice
- Überschriften:
  - H1: Venice-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/vercel-ai-gateway.md

- Route: /plugins/reference/vercel-ai-gateway
- Überschriften:
  - H1: Vercel AI Gateway-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/vllm.md

- Route: /plugins/reference/vllm
- Überschriften:
  - H1: vLLM-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/voice-call.md

- Route: /plugins/reference/voice-call
- Überschriften:
  - H1: Voice Call-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/volcengine.md

- Route: /plugins/reference/volcengine
- Überschriften:
  - H1: Volcengine-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

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
  - H2: Verwandte Dokumentation

## plugins/reference/web-readability.md

- Route: /plugins/reference/web-readability
- Überschriften:
  - H1: Web Readability-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/webhooks.md

- Route: /plugins/reference/webhooks
- Überschriften:
  - H1: Webhooks-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/whatsapp.md

- Route: /plugins/reference/whatsapp
- Überschriften:
  - H1: WhatsApp-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/workboard.md

- Route: /plugins/reference/workboard
- Überschriften:
  - H1: Workboard-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/xai.md

- Route: /plugins/reference/xai
- Überschriften:
  - H1: xAI-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/xiaomi.md

- Route: /plugins/reference/xiaomi
- Überschriften:
  - H1: Xiaomi-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/zai.md

- Route: /plugins/reference/zai
- Überschriften:
  - H1: Z.AI-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/zalo.md

- Route: /plugins/reference/zalo
- Überschriften:
  - H1: Zalo-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/zalouser.md

- Route: /plugins/reference/zalouser
- Überschriften:
  - H1: Zalo Personal-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/sdk-agent-harness.md

- Route: /plugins/sdk-agent-harness
- Überschriften:
  - H2: Wann Sie ein Harness verwenden sollten
  - H2: Wofür der Kern weiterhin verantwortlich ist
  - H2: Ein Harness registrieren
  - H2: Auswahlrichtlinie
  - H2: Provider- und Harness-Kopplung
  - H3: Middleware für Tool-Ergebnisse
  - H3: Klassifizierung des Terminal-Ergebnisses
  - H3: Nebeneffekte am Agent-Ende
  - H3: Benutzereingabe und Tool-Oberflächen
  - H3: Nativer Codex-Harness-Modus
  - H2: Laufzeitstrenge
  - H2: Native Sitzungen und Transkriptspiegel
  - H2: Tool- und Medienergebnisse
  - H2: Aktuelle Einschränkungen
  - H2: Verwandte Themen

## plugins/sdk-channel-inbound.md

- Route: /plugins/sdk-channel-inbound
- Überschriften:
  - H2: Kern-Helfer
  - H2: Migration

## plugins/sdk-channel-ingress.md

- Route: /plugins/sdk-channel-ingress
- Überschriften:
  - H1: Channel-Ingress-API
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
  - H2: Vorhandene Outbound-Adapter
  - H2: Dauerhafte Sendungen
  - H2: Kompatibilitäts-Dispatch

## plugins/sdk-channel-plugins.md

- Route: /plugins/sdk-channel-plugins
- Überschriften:
  - H2: Wie Channel-Plugins funktionieren
  - H2: Genehmigungen und Channel-Fähigkeiten
  - H2: Richtlinie für eingehende Erwähnungen
  - H2: Anleitung
  - H2: Dateistruktur
  - H2: Fortgeschrittene Themen
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## plugins/sdk-channel-turn.md

- Route: /plugins/sdk-channel-turn
- Überschriften: keine

## plugins/sdk-entrypoints.md

- Route: /plugins/sdk-entrypoints
- Überschriften:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Registrierungsmodus
  - H2: Plugin-Formen
  - H2: Verwandte Themen

## plugins/sdk-migration.md

- Route: /plugins/sdk-migration
- Überschriften:
  - H2: Was sich ändert
  - H2: Warum sich dies geändert hat
  - H2: Migrationsplan für Talk und Echtzeit-Sprache
  - H2: Kompatibilitätsrichtlinie
  - H2: Migration durchführen
  - H2: Referenz für Importpfade
  - H2: Aktive Veraltungen
  - H2: Zeitplan für die Entfernung
  - H2: Warnungen vorübergehend unterdrücken
  - H2: Verwandte Themen

## plugins/sdk-overview.md

- Route: /plugins/sdk-overview
- Überschriften:
  - H2: Importkonvention
  - H2: Subpfad-Referenz
  - H2: Registrierungs-API
  - H3: Fähigkeitsregistrierung
  - H3: Tools und Befehle
  - H3: Infrastruktur
  - H3: Host-Hooks für Workflow-Plugins
  - H3: Gateway-Discovery-Registrierung
  - H3: CLI-Registrierungsmetadaten
  - H3: CLI-Backend-Registrierung
  - H3: Exklusive Slots
  - H3: Veraltete Adapter für Memory-Embeddings
  - H3: Ereignisse und Lebenszyklus
  - H3: Semantik von Hook-Entscheidungen
  - H3: API-Objektfelder
  - H2: Konvention für interne Module
  - H2: Verwandte Themen

## plugins/sdk-provider-plugins.md

- Route: /plugins/sdk-provider-plugins
- Überschriften:
  - H2: Anleitung
  - H2: In ClawHub veröffentlichen
  - H2: Dateistruktur
  - H2: Referenz zur Katalogreihenfolge
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## plugins/sdk-runtime.md

- Route: /plugins/sdk-runtime
- Überschriften:
  - H2: Konfiguration laden und schreiben
  - H2: Wiederverwendbare Laufzeit-Dienstprogramme
  - H2: Laufzeit-Namespaces
  - H2: Laufzeitreferenzen speichern
  - H2: Weitere API-Felder auf oberster Ebene
  - H2: Verwandte Themen

## plugins/sdk-setup.md

- Route: /plugins/sdk-setup
- Überschriften:
  - H2: Paketmetadaten
  - H3: openclaw-Felder
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Verzögertes vollständiges Laden
  - H2: Plugin-Manifest
  - H2: ClawHub-Veröffentlichung
  - H2: Setup-Einstieg
  - H3: Enge Setup-Helfer-Imports
  - H3: Channel-eigene Einzelkonto-Hochstufung
  - H2: Konfigurationsschema
  - H3: Channel-Konfigurationsschemata erstellen
  - H2: Setup-Assistenten
  - H2: Veröffentlichen und Installieren
  - H2: Verwandte Themen

## plugins/sdk-subpaths.md

- Route: /plugins/sdk-subpaths
- Überschriften:
  - H2: Plugin-Einstieg
  - H3: Veraltete Kompatibilitäts- und Testhelfer
  - H3: Reservierte Hilfs-Subpfade für gebündelte Plugins
  - H2: Verwandte Themen

## plugins/sdk-testing.md

- Route: /plugins/sdk-testing
- Überschriften:
  - H2: Test-Dienstprogramme
  - H3: Verfügbare Exporte
  - H3: Typen
  - H2: Zielauflösung testen
  - H2: Testmuster
  - H3: Registrierungskontrakte testen
  - H3: Laufzeit-Konfigurationszugriff testen
  - H3: Unit-Tests für ein Channel-Plugin
  - H3: Unit-Tests für ein Provider-Plugin
  - H3: Plugin-Laufzeit mocken
  - H3: Testen mit Stubs pro Instanz
  - H2: Kontrakttests (repo-interne Plugins)
  - H3: Bereichsbezogene Tests ausführen
  - H2: Lint-Durchsetzung (repo-interne Plugins)
  - H2: Testkonfiguration
  - H2: Verwandte Themen

## plugins/tool-plugins.md

- Route: /plugins/tool-plugins
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Ein Tool schreiben
  - H2: Optionale Tools und Factory-Tools
  - H2: Rückgabewerte
  - H2: Konfiguration
  - H2: Generierte Metadaten
  - H2: Paketmetadaten
  - H2: In CI validieren
  - H2: Lokal installieren und prüfen
  - H2: Veröffentlichen
  - H2: Fehlerbehebung
  - H3: Plugin-Einstieg nicht gefunden: ./dist/index.js
  - H3: Plugin-Einstieg stellt keine defineToolPlugin-Metadaten bereit
  - H3: openclaw.plugin.json-generierte Metadaten sind veraltet
  - H3: package.json openclaw.extensions muss ./dist/index.js enthalten
  - H3: Paket 'typebox' kann nicht gefunden werden
  - H3: Tool wird nach der Installation nicht angezeigt
  - H2: Siehe auch

## plugins/voice-call.md

- Route: /plugins/voice-call
- Überschriften:
  - H2: Schnellstart
  - H2: Konfiguration
  - H2: Sitzungsumfang
  - H2: Echtzeit-Sprachgespräche
  - H3: Tool-Richtlinie
  - H3: Agent-Sprachkontext
  - H3: Beispiele für Echtzeit-Provider
  - H2: Streaming-Transkription
  - H3: Beispiele für Streaming-Provider
  - H2: TTS für Anrufe
  - H3: TTS-Beispiele
  - H2: Eingehende Anrufe
  - H3: Routing pro Nummer
  - H3: Kontrakt für gesprochene Ausgabe
  - H3: Startverhalten von Konversationen
  - H3: Kulanzzeit für Twilio-Stream-Trennung
  - H2: Reaper für veraltete Anrufe
  - H2: Webhook-Sicherheit
  - H2: CLI
  - H2: Agent-Tool
  - H2: Gateway-RPC
  - H2: Fehlerbehebung
  - H3: Setup schlägt bei Webhook-Exposition fehl
  - H3: Provider-Anmeldedaten schlagen fehl
  - H3: Anrufe starten, aber Provider-Webhooks kommen nicht an
  - H3: Signaturverifizierung schlägt fehl
  - H3: Google Meet-Twilio-Beitritte schlagen fehl
  - H3: Echtzeit-Anruf hat keine Sprache
  - H2: Verwandte Themen

## plugins/webhooks.md

- Route: /plugins/webhooks
- Überschriften:
  - H2: Wo es ausgeführt wird
  - H2: Routen konfigurieren
  - H2: Sicherheitsmodell
  - H2: Anfrageformat
  - H2: Unterstützte Aktionen
  - H3: createflow
  - H3: runtask
  - H2: Antwortform
  - H2: Verwandte Dokumentation

## plugins/workboard.md

- Route: /plugins/workboard
- Überschriften:
  - H2: Standardzustand
  - H2: Was Karten enthalten
  - H2: Kartenausführungen und Aufgaben
  - H2: Agent-Koordination
  - H3: Worker-Auswahl für Dispatch
  - H3: Worker-Prompt und Lebenszyklus
  - H3: Dispatch-Einstiegspunkte
  - H2: CLI und Slash-Befehl
  - H2: Synchronisierung des Sitzungslebenszyklus
  - H2: Dashboard-Workflow
  - H2: Berechtigungen
  - H2: Konfiguration
  - H2: Fehlerbehebung
  - H3: Der Tab meldet, dass Workboard nicht verfügbar ist
  - H3: Karten werden nicht gespeichert
  - H3: Das Starten einer Karte öffnet nicht die erwartete Sitzung
  - H3: Dispatch startet keinen Worker
  - H2: Verwandte Themen

## plugins/zalouser.md

- Route: /plugins/zalouser
- Überschriften:
  - H2: Benennung
  - H2: Wo es ausgeführt wird
  - H2: Installieren
  - H3: Option A: von npm installieren
  - H3: Option B: aus einem lokalen Ordner installieren (Entwicklung)
  - H2: Konfiguration
  - H2: CLI
  - H2: Agent-Tool
  - H2: Verwandte Themen

## prose.md

- Route: /prose
- Überschriften:
  - H2: Installieren
  - H2: Slash-Befehl
  - H2: Was es kann
  - H2: Beispiel: parallele Recherche und Synthese
  - H2: OpenClaw-Laufzeitzuordnung
  - H2: Dateispeicherorte
  - H2: Zustands-Backends
  - H2: Sicherheit
  - H2: Verwandte Themen

## providers/alibaba.md

- Route: /providers/alibaba
- Überschriften:
  - H2: Erste Schritte
  - H2: Integrierte Wan-Modelle
  - H2: Fähigkeiten und Grenzen
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/anthropic.md

- Route: /providers/anthropic
- Überschriften:
  - H2: Erste Schritte
  - H2: Thinking-Standardwerte (Claude Fable 5, 4.8 und 4.6)
  - H2: Prompt-Caching
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/arcee.md

- Route: /providers/arcee
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktives Setup
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
  - H2: Schnelles Setup (AWS-Pfad)
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/cerebras.md

- Route: /providers/cerebras
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktives Setup
  - H2: Integrierter Katalog
  - H2: Manuelle Konfiguration
  - H2: Verwandte Themen

## providers/chutes.md

- Route: /providers/chutes
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Discovery-Verhalten
  - H2: Standard-Aliase
  - H2: Integrierter Starter-Katalog
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/claude-max-api-proxy.md

- Route: /providers/claude-max-api-proxy
- Überschriften:
  - H2: Warum dies verwenden?
  - H2: Funktionsweise
  - H2: Erste Schritte
  - H2: Integrierter Katalog
  - H2: Erweiterte Konfiguration
  - H2: Hinweise
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
  - H2: Erste Schritte
  - H2: Nur-Umgebungs-Setup
  - H2: Verwandte Themen

## providers/comfy.md

- Route: /providers/comfy
- Überschriften:
  - H2: Was es unterstützt
  - H2: Erste Schritte
  - H2: Konfiguration
  - H3: Gemeinsame Schlüssel
  - H3: Schlüssel pro Capability
  - H2: Workflow-Details
  - H2: Verwandte Themen

## providers/deepgram.md

- Route: /providers/deepgram
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsoptionen
  - H2: STT-Streaming für Sprachanrufe
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/deepinfra.md

- Route: /providers/deepinfra
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel erhalten
  - H2: CLI-Setup
  - H2: Konfigurationsausschnitt
  - H2: Unterstützte OpenClaw-Oberflächen
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
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Vollständige Konfiguration
  - H2: Start bei Bedarf
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
  - H2: Bildgenerierung
  - H2: Videogenerierung
  - H2: Musikgenerierung
  - H2: Verwandte Themen

## providers/fireworks.md

- Route: /providers/fireworks
- Überschriften:
  - H2: Erste Schritte
  - H2: Nicht interaktives Setup
  - H2: Integrierter Katalog
  - H2: Benutzerdefinierte Fireworks-Modell-IDs
  - H2: Verwandte Themen

## providers/github-copilot.md

- Route: /providers/github-copilot
- Überschriften:
  - H2: Drei Möglichkeiten, Copilot in OpenClaw zu verwenden
  - H2: Optionale Flags
  - H2: Nicht interaktives Onboarding
  - H2: Memory-Suchembeddings
  - H3: Konfiguration
  - H3: Funktionsweise
  - H2: Verwandte Themen

## providers/gmi.md

- Route: /providers/gmi
- Überschriften:
  - H2: Setup
  - H2: Standardwerte
  - H2: Wann GMI gewählt werden sollte
  - H2: Modelle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/google.md

- Route: /providers/google
- Überschriften:
  - H2: Erste Schritte
  - H2: Capabilities
  - H2: Websuche
  - H2: Bildgenerierung
  - H2: Videogenerierung
  - H2: Musikgenerierung
  - H2: Text-zu-Sprache
  - H2: Echtzeit-Sprache
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/gradium.md

- Route: /providers/gradium
- Überschriften:
  - H2: Plugin installieren
  - H2: Setup
  - H2: Konfiguration
  - H2: Stimmen
  - H3: Stimmenüberschreibung pro Nachricht
  - H2: Ausgabe
  - H2: Reihenfolge der automatischen Auswahl
  - H2: Verwandte Themen

## providers/groq.md

- Route: /providers/groq
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H3: Beispiel für Konfigurationsdatei
  - H2: Integrierter Katalog
  - H2: Reasoning-Modelle
  - H2: Audiotranskription
  - H2: Verwandte Themen

## providers/huggingface.md

- Route: /providers/huggingface
- Überschriften:
  - H2: Erste Schritte
  - H3: Nicht interaktives Setup
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
  - H2: Beispiel für vollständige Konfiguration
  - H2: Start bei Bedarf
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
  - H2: Erste Schritte
  - H2: Standardmodell
  - H2: Integrierter Katalog
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/litellm.md

- Route: /providers/litellm
- Überschriften:
  - H2: Schnellstart
  - H2: Konfiguration
  - H3: Umgebungsvariablen
  - H3: Konfigurationsdatei
  - H2: Erweiterte Konfiguration
  - H3: Bildgenerierung
  - H2: Verwandte Themen

## providers/lmstudio.md

- Route: /providers/lmstudio
- Überschriften:
  - H2: Schnellstart
  - H2: Nicht interaktives Onboarding
  - H2: Konfiguration
  - H3: Kompatibilität der Streaming-Nutzung
  - H3: Kompatibilität für Denken
  - H3: Explizite Konfiguration
  - H2: Fehlerbehebung
  - H3: LM Studio nicht erkannt
  - H3: Authentifizierungsfehler (HTTP 401)
  - H3: Just-in-time-Modellladen
  - H3: LAN- oder Tailnet-LM-Studio-Host
  - H2: Verwandte Themen

## providers/minimax.md

- Route: /providers/minimax
- Überschriften:
  - H2: Integrierter Katalog
  - H2: Erste Schritte
  - H2: Über openclaw configure konfigurieren
  - H2: Capabilities
  - H3: Bildgenerierung
  - H3: Text-zu-Sprache
  - H3: Musikgenerierung
  - H3: Videogenerierung
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
  - H2: STT-Streaming für Sprachanrufe
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/models.md

- Route: /providers/models
- Überschriften:
  - H2: Schnellstart (zwei Schritte)
  - H2: Unterstützte Provider (Starter-Set)
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
  - H2: Setup
  - H2: Standardwerte
  - H2: Wann Novita gewählt werden sollte
  - H2: Modelle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/nvidia.md

- Route: /providers/nvidia
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Hervorgehobener Katalog
  - H2: Nemotron 3 Ultra
  - H2: Gebündelter Fallback-Katalog
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/ollama-cloud.md

- Route: /providers/ollama-cloud
- Überschriften:
  - H2: Setup
  - H2: Standardwerte
  - H2: Wann Ollama Cloud gewählt werden sollte
  - H2: Modelle
  - H2: Live-Test
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/ollama.md

- Route: /providers/ollama
- Überschriften:
  - H2: Authentifizierungsregeln
  - H2: Erste Schritte
  - H2: Cloud-Modelle
  - H2: Modellerkennung (impliziter Provider)
  - H2: Bildsehen und Bildbeschreibung
  - H2: Konfiguration
  - H2: Gängige Rezepte
  - H3: Modellauswahl
  - H3: Schnelle Verifizierung
  - H2: Ollama-Websuche
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/openai.md

- Route: /providers/openai
- Überschriften:
  - H2: Schnellauswahl
  - H2: Namenszuordnung
  - H2: OpenClaw-Funktionsabdeckung
  - H2: Memory-Embeddings
  - H2: Erste Schritte
  - H2: Native Codex-App-Server-Authentifizierung
  - H2: Bildgenerierung
  - H2: Videogenerierung
  - H2: GPT-5-Prompt-Beitrag
  - H2: Stimme und Sprache
  - H2: Azure-OpenAI-Endpunkte
  - H3: Konfiguration
  - H3: API-Version
  - H3: Modellnamen sind Deployment-Namen
  - H3: Regionale Verfügbarkeit
  - H3: Parameterunterschiede
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/opencode-go.md

- Route: /providers/opencode-go
- Überschriften:
  - H2: Integrierter Katalog
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
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
  - H2: Bildgenerierung
  - H2: Videogenerierung
  - H2: Musikgenerierung
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
  - H2: Setup
  - H2: Standardwerte
  - H2: Unterschied zu Qwen
  - H2: Wann Qwen OAuth / Portal gewählt werden sollte
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
  - H2: Denksteuerungen
  - H2: Multimodale Add-ons
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
  - H2: Übersicht über Region und Endpunkt
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
  - H2: Nicht interaktives Setup
  - H2: Integrierter Katalog
  - H2: Gestaffelte Preise
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/together.md

- Route: /providers/together
- Überschriften:
  - H2: Erste Schritte
  - H3: Nicht interaktives Beispiel
  - H2: Integrierter Katalog
  - H2: Videogenerierung
  - H2: Verwandte Themen

## providers/venice.md

- Route: /providers/venice
- Überschriften:
  - H2: Warum Venice in OpenClaw
  - H2: Datenschutzmodi
  - H2: Funktionen
  - H2: Erste Schritte
  - H2: Modellauswahl
  - H2: DeepSeek-V4-Replay-Verhalten
  - H2: Integrierter Katalog (insgesamt 41)
  - H2: Modellerkennung
  - H2: Streaming- und Tool-Unterstützung
  - H2: Preise
  - H3: Venice (anonymisiert) vs. direkte API
  - H2: Verwendungsbeispiele
  - H2: Fehlerbehebung
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/vercel-ai-gateway.md

- Route: /providers/vercel-ai-gateway
- Überschriften:
  - H2: Erste Schritte
  - H2: Nicht interaktives Beispiel
  - H2: Modell-ID-Kurzform
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/vllm.md

- Route: /providers/vllm
- Überschriften:
  - H2: Erste Schritte
  - H2: Modellerkennung (impliziter Provider)
  - H2: Explizite Konfiguration (manuelle Modelle)
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
  - H2: Wählen Sie Ihren Einrichtungspfad
  - H2: OAuth-Fehlerbehebung
  - H2: Integrierter Katalog
  - H2: OpenClaw-Funktionsabdeckung
  - H3: Fast-Mode-Zuordnungen
  - H3: Legacy-Kompatibilitätsaliase
  - H2: Funktionen
  - H2: Live-Tests
  - H2: Verwandte Themen

## providers/xiaomi.md

- Route: /providers/xiaomi
- Überschriften:
  - H2: Erste Schritte
  - H2: Pay-as-you-go-Katalog
  - H2: Token Plan-Katalog
  - H2: Text-zu-Sprache
  - H2: Konfigurationsbeispiel
  - H2: Verwandte Themen

## providers/zai.md

- Route: /providers/zai
- Überschriften:
  - H2: GLM-Modelle
  - H2: Erste Schritte
  - H2: Konfigurationsbeispiel
  - H2: Integrierter Katalog
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## refactor/access.md

- Route: /refactor/access
- Überschriften: keine

## refactor/acp.md

- Route: /refactor/acp
- Überschriften:
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Zielmodell
  - H3: Gateway-Instanzidentität
  - H3: ACP-Sitzungsbesitz
  - H3: ACPX-Prozess-Leases
  - H2: Lebenszyklus-Controller
  - H2: Wrapper-Vertrag
  - H2: Vertrag zur Sitzungssichtbarkeit
  - H2: Migrationsplan
  - H3: Phase 1: Identität und Leases hinzufügen
  - H3: Phase 2: Lease-First-Bereinigung
  - H3: Phase 3: Lease-First-Startbereinigung
  - H3: Phase 4: Sitzungsbesitz-Zeilen
  - H3: Phase 5: Legacy-Heuristiken entfernen
  - H2: Tests
  - H2: Kompatibilitätshinweise
  - H2: Erfolgskriterien

## refactor/canvas.md

- Route: /refactor/canvas
- Überschriften:
  - H1: Canvas-Plugin-Refaktorierung
  - H2: Ziel
  - H2: Nicht-Ziele
  - H2: Aktueller Branch-Zustand
  - H2: Zielstruktur
  - H2: Migrationsschritte
  - H2: Audit-Checkliste
  - H2: Verifizierungsbefehle

## refactor/database-first.md

- Route: /refactor/database-first
- Überschriften:
  - H1: Database-First-State-Refaktorierung
  - H2: Entscheidung
  - H2: Harter Vertrag
  - H2: Zielzustand und Fortschritt
  - H3: Hartes Ziel
  - H3: Zielzustände
  - H3: Aktueller Zustand
  - H3: Verbleibende Arbeit
  - H3: Keine Regressionen einführen
  - H2: Code-Read-Annahmen
  - H2: Code-Read-Erkenntnisse
  - H2: Aktuelle Code-Struktur
  - H2: Ziel-Schemastruktur
  - H2: Doctor-Migrationsstruktur
  - H2: Migrationsinventar
  - H2: Migrationsplan
  - H3: Phase 0: Grenze einfrieren
  - H3: Phase 1: Globale Steuerungsebene abschließen
  - H3: Phase 2: Pro-Agent-Datenbanken einführen
  - H3: Phase 3: Session-Store-APIs ersetzen
  - H3: Phase 4: Transkripte, ACP-Streams, Trajektorien und VFS verschieben
  - H3: Phase 5: Sichern, Wiederherstellen, Vacuum und Verifizieren
  - H3: Phase 6: Worker-Runtime
  - H3: Phase 7: Die alte Welt löschen
  - H2: Sichern und Wiederherstellen
  - H2: Runtime-Refaktorierungsplan
  - H2: Performance-Regeln
  - H2: Statische Verbote
  - H2: Erledigt-Kriterien

## refactor/ingress-core.md

- Route: /refactor/ingress-core
- Überschriften:
  - H1: Löschplan für Ingress-Core
  - H2: Budget
  - H2: Diagnose
  - H2: Hotspots
  - H2: Aktuelle Code-Lektüre
  - H2: Grenze
  - H2: Akzeptanzregel
  - H2: Arbeitspakete
  - H2: Löschwellen
  - H2: Nicht verschieben
  - H2: Verifizierung
  - H2: Exit-Kriterien

## reference/AGENTS.default.md

- Route: /reference/AGENTS.default
- Überschriften:
  - H2: Erster Start (empfohlen)
  - H2: Sicherheitsvorgaben
  - H2: Preflight für bestehende Lösungen
  - H2: Sitzungsstart (erforderlich)
  - H2: Soul (erforderlich)
  - H2: Gemeinsame Bereiche (empfohlen)
  - H2: Speichersystem (empfohlen)
  - H2: Tools und Skills
  - H2: Backup-Tipp (empfohlen)
  - H2: Was OpenClaw macht
  - H2: Kern-Skills (in Einstellungen → Skills aktivieren)
  - H2: Nutzungshinweise
  - H2: Verwandte Themen

## reference/RELEASING.md

- Route: /reference/RELEASING
- Überschriften:
  - H2: Versionsbenennung
  - H2: Release-Takt
  - H2: Checkliste für Release-Operatoren
  - H2: Abschluss für stable main
  - H2: Release-Preflight
  - H2: Release-Testboxen
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Paket
  - H2: Release-Veröffentlichungsautomatisierung
  - H2: NPM-Workflow-Eingaben
  - H2: Stabile npm-Release-Sequenz
  - H2: Öffentliche Referenzen
  - H2: Verwandte Themen

## reference/api-usage-costs.md

- Route: /reference/api-usage-costs
- Überschriften:
  - H2: Wo Kosten entstehen (Chat + CLI)
  - H2: Wie Schlüssel gefunden werden
  - H2: Funktionen, die Schlüssel verbrauchen können
  - H3: 1) Kernmodellantworten (Chat + Tools)
  - H3: 2) Medienverständnis (Audio/Bild/Video)
  - H3: 3) Bild- und Videogenerierung
  - H3: 4) Memory-Embeddings + semantische Suche
  - H3: 5) Websuche-Tool
  - H3: 5) Web-Fetch-Tool (Firecrawl)
  - H3: 6) Provider-Nutzungssnapshots (Status/Zustand)
  - H3: 7) Compaction-Schutz-Zusammenfassung
  - H3: 8) Modellscan/-Probe
  - H3: 9) Talk (Sprache)
  - H3: 10) Skills (Drittanbieter-APIs)
  - H2: Verwandte Themen

## reference/application-modernization-plan.md

- Route: /reference/application-modernization-plan
- Überschriften:
  - H2: Ziel
  - H2: Prinzipien
  - H2: Phase 1: Baseline-Audit
  - H2: Phase 2: Produkt- und UX-Bereinigung
  - H2: Phase 3: Frontend-Architektur straffen
  - H2: Phase 4: Performance und Zuverlässigkeit
  - H2: Phase 5: Typ-, Vertrags- und Testhärtung
  - H2: Phase 6: Dokumentation und Release-Bereitschaft
  - H2: Empfohlener erster Abschnitt
  - H2: Frontend-Skill-Update

## reference/code-mode.md

- Route: /reference/code-mode
- Überschriften:
  - H2: Was ist das?
  - H2: Warum ist das gut?
  - H2: So aktivieren Sie es
  - H2: Technische Übersicht
  - H2: Runtime-Status
  - H2: Umfang
  - H2: Begriffe
  - H2: Konfiguration
  - H2: Aktivierung
  - H2: Für das Modell sichtbare Tools
  - H2: exec
  - H2: wait
  - H2: Guest-Runtime-API
  - H2: Interne Namespaces
  - H3: Registry-Lebenszyklus
  - H3: Registrierungsform
  - H3: Besitz und Sichtbarkeit
  - H3: Regeln für Scope-Serialisierung
  - H3: Prompts
  - H3: Bereinigung
  - H3: Test-Checkliste
  - H2: Output-API
  - H2: Tool-Katalog
  - H2: Tool-Search-Interaktion
  - H2: Tool-Namen und Kollisionen
  - H2: Verschachtelte Tool-Ausführung
  - H2: Runtime-Status
  - H2: QuickJS-WASI-Runtime
  - H2: TypeScript
  - H2: Sicherheitsgrenze
  - H2: Fehlercodes
  - H2: Telemetrie
  - H2: Debugging
  - H2: Implementierungslayout
  - H2: Validierungscheckliste
  - H2: E2E-Testplan
  - H2: Verwandte Themen

## reference/credits.md

- Route: /reference/credits
- Überschriften:
  - H2: Der Name
  - H2: Danksagungen
  - H2: Kernbeitragende
  - H2: Lizenz
  - H2: Verwandte Themen

## reference/device-models.md

- Route: /reference/device-models
- Überschriften:
  - H2: Datenquelle
  - H2: Datenbank aktualisieren
  - H2: Verwandte Themen

## reference/full-release-validation.md

- Route: /reference/full-release-validation
- Überschriften:
  - H2: Stufen der obersten Ebene
  - H2: Stufen der Release-Prüfungen
  - H2: Docker-Release-Pfad-Abschnitte
  - H2: Release-Profile
  - H2: Ergänzungen nur für vollständige Läufe
  - H2: Fokussierte Wiederholungen
  - H2: Aufzubewahrende Nachweise
  - H2: Workflow-Dateien

## reference/memory-config.md

- Route: /reference/memory-config
- Überschriften:
  - H2: Provider-Auswahl
  - H3: Benutzerdefinierte Provider-IDs
  - H3: API-Schlüsselauflösung
  - H2: Konfiguration für Remote-Endpunkte
  - H2: Provider-spezifische Konfiguration
  - H3: Inline-Embedding-Timeout
  - H2: Hybrid-Suchkonfiguration
  - H3: Vollständiges Beispiel
  - H2: Zusätzliche Memory-Pfade
  - H2: Multimodaler Speicher (Gemini)
  - H2: Embedding-Cache
  - H2: Batch-Indexierung
  - H2: Session-Memory-Suche (experimentell)
  - H2: SQLite-Vektorbeschleunigung (sqlite-vec)
  - H2: Indexspeicher
  - H2: QMD-Backend-Konfiguration
  - H3: Vollständiges QMD-Beispiel
  - H2: Dreaming
  - H3: Benutzereinstellungen
  - H3: Beispiel
  - H2: Verwandte Themen

## reference/prompt-caching.md

- Route: /reference/prompt-caching
- Überschriften:
  - H2: Primäre Stellschrauben
  - H3: cacheRetention (globaler Standard, Modell und pro Agent)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: Provider-Verhalten
  - H3: Anthropic (direkte API)
  - H3: OpenAI (direkte API)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: OpenRouter-Modelle
  - H3: Andere Provider
  - H3: Direkte Google Gemini API
  - H3: Gemini-CLI-Nutzung
  - H2: System-Prompt-Cache-Grenze
  - H2: Cache-Stabilitätswächter von OpenClaw
  - H2: Tuning-Muster
  - H3: Gemischter Traffic (empfohlener Standard)
  - H3: Kostenorientierte Baseline
  - H2: Cache-Diagnose
  - H2: Live-Regressionstests
  - H3: Anthropic-Live-Erwartungen
  - H3: OpenAI-Live-Erwartungen
  - H3: diagnostics.cacheTrace-Konfiguration
  - H3: Env-Umschalter (einmaliges Debugging)
  - H3: Was zu prüfen ist
  - H2: Schnelle Fehlerbehebung
  - H2: Verwandte Themen

## reference/release-performance-sweep.md

- Route: /reference/release-performance-sweep
- Überschriften:
  - H2: Snapshot
  - H2: Zeitachse des Installationsumfangs
  - H2: Was sich in 5.28 geändert hat
  - H2: Schlagzeilenzahlen
  - H3: Installationsumfang
  - H3: npm-Paketgröße
  - H2: Zusammenfassung der Kova-Agent-Runde
  - H2: Quell-Probes
  - H2: Audit des Installationsumfangs
  - H3: Shrinkwrap-Grenze
  - H2: Supply-Chain-Interpretation

## reference/rich-output-protocol.md

- Route: /reference/rich-output-protocol
- Überschriften:
  - H2: [embed ...]
  - H2: Gespeicherte Rendering-Struktur
  - H2: Verwandte Themen

## reference/rpc.md

- Route: /reference/rpc
- Überschriften:
  - H2: Muster A: HTTP-Daemon (signal-cli)
  - H2: Muster B: stdio-Kindprozess (imsg)
  - H2: Adapter-Richtlinien
  - H2: Verwandte Themen

## reference/secret-placeholder-conventions.md

- Route: /reference/secret-placeholder-conventions
- Überschriften:
  - H1: Konventionen für Secret-Platzhalter
  - H2: Empfohlener Stil
  - H2: Vermeiden Sie diese Muster in der Dokumentation
  - H2: Beispiel

## reference/secretref-credential-surface.md

- Route: /reference/secretref-credential-surface
- Überschriften:
  - H2: Unterstützte Zugangsdaten
  - H3: openclaw.json-Ziele (secrets configure + secrets apply + secrets audit)
  - H3: auth-profiles.json-Ziele (secrets configure + secrets apply + secrets audit)
  - H2: Nicht unterstützte Zugangsdaten
  - H2: Verwandte Themen

## reference/session-management-compaction.md

- Route: /reference/session-management-compaction
- Überschriften:
  - H2: Quelle der Wahrheit: das Gateway
  - H2: Zwei Persistenzebenen
  - H2: Speicherorte auf der Festplatte
  - H2: Store-Wartung und Festplattensteuerung
  - H2: Cron-Sitzungen und Ausführungsprotokolle
  - H2: Sitzungsschlüssel (sessionKey)
  - H2: Sitzungs-IDs (sessionId)
  - H2: Schema des Session Stores (sessions.json)
  - H2: Transkriptstruktur (.jsonl)
  - H2: Kontextfenster vs. nachverfolgte Tokens
  - H2: Compaction: Was es ist
  - H2: Compaction-Chunk-Grenzen und Tool-Paarung
  - H2: Wann Auto-Compaction ausgeführt wird (OpenClaw-Runtime)
  - H2: Compaction-Einstellungen (reserveTokens, keepRecentTokens)
  - H2: Austauschbare Compaction-Provider
  - H2: Für Benutzer sichtbare Oberflächen
  - H2: Stille Haushaltung (NOREPLY)
  - H2: Pre-Compaction-"Memory Flush" (implementiert)
  - H2: Checkliste zur Fehlerbehebung
  - H2: Verwandte Themen

## reference/templates/AGENTS.dev.md

- Route: /reference/templates/AGENTS.dev
- Überschriften:
  - H1: AGENTS.md - OpenClaw-Arbeitsbereich
  - H2: Erster Start (einmalig)
  - H2: Backup-Tipp (empfohlen)
  - H2: Sicherheitsvorgaben
  - H2: Preflight für bestehende Lösungen
  - H2: Tägliches Memory (empfohlen)
  - H2: Heartbeats (optional)
  - H2: Anpassen
  - H2: C-3PO Origin Memory
  - H3: Geburtstag: 2026-01-09
  - H3: Kernwahrheiten (von Clawd)
  - H2: Verwandte Themen

## reference/templates/BOOT.md

- Route: /reference/templates/BOOT
- Überschriften:
  - H1: BOOT.md
  - H2: Verwandte Themen

## reference/templates/BOOTSTRAP.md

- Route: /reference/templates/BOOTSTRAP
- Überschriften:
  - H1: BOOTSTRAP.md - Hallo Welt
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
  - H1: IDENTITY.md - Agentenidentität
  - H2: Rolle
  - H2: Soul
  - H2: Beziehung zu Clawd
  - H2: Eigenheiten
  - H2: Catchphrase
  - H2: Verwandte Themen

## reference/templates/IDENTITY.md

- Route: /reference/templates/IDENTITY
- Überschriften:
  - H1: IDENTITY.md - Wer bin ich?
  - H2: Verwandte Themen

## reference/templates/SOUL.dev.md

- Route: /reference/templates/SOUL.dev
- Überschriften:
  - H1: SOUL.md - Die Seele von C-3PO
  - H2: Wer ich bin
  - H2: Mein Zweck
  - H2: Wie ich arbeite
  - H2: Meine Eigenheiten
  - H2: Meine Beziehung zu Clawd
  - H2: Was ich nicht tun werde
  - H2: Die goldene Regel
  - H2: Verwandt

## reference/templates/SOUL.md

- Route: /reference/templates/SOUL
- Überschriften:
  - H1: SOUL.md - Wer Sie sind
  - H2: Grundlegende Wahrheiten
  - H2: Grenzen
  - H2: Vibe
  - H2: Kontinuität
  - H2: Verwandt

## reference/templates/TOOLS.dev.md

- Route: /reference/templates/TOOLS.dev
- Überschriften:
  - H1: TOOLS.md - Tool-Notizen des Benutzers (bearbeitbar)
  - H2: Beispiele
  - H3: imsg
  - H3: sag
  - H2: Verwandt

## reference/templates/TOOLS.md

- Route: /reference/templates/TOOLS
- Überschriften:
  - H1: TOOLS.md - Lokale Notizen
  - H2: Was hierhin gehört
  - H2: Beispiele
  - H2: Warum getrennt?
  - H2: Verwandt

## reference/templates/USER.dev.md

- Route: /reference/templates/USER.dev
- Überschriften:
  - H1: USER.md - Benutzerprofil
  - H2: Verwandt

## reference/templates/USER.md

- Route: /reference/templates/USER
- Überschriften:
  - H1: USER.md - Über Ihren Menschen
  - H2: Kontext
  - H2: Verwandt

## reference/test.md

- Route: /reference/test
- Überschriften:
  - H2: Lokales PR-Gate
  - H2: Modelllatenz-Benchmark (lokale Schlüssel)
  - H2: CLI-Start-Benchmark
  - H2: Gateway-Start-Benchmark
  - H2: Gateway-Neustart-Benchmark
  - H2: Onboarding-E2E (Docker)
  - H2: QR-Import-Smoke-Test (Docker)
  - H2: Verwandt

## reference/token-use.md

- Route: /reference/token-use
- Überschriften:
  - H2: Wie der System-Prompt erstellt wird
  - H2: Was im Kontextfenster zählt
  - H2: Wie Sie die aktuelle Token-Nutzung sehen
  - H2: Kostenschätzung (wenn angezeigt)
  - H2: Auswirkungen von Cache-TTL und Bereinigung
  - H3: Beispiel: 1h-Cache mit Heartbeat warm halten
  - H3: Beispiel: gemischter Traffic mit Cache-Strategie pro Agent
  - H3: Anthropic-1M-Kontext
  - H2: Tipps zur Reduzierung von Token-Druck
  - H2: Verwandt

## reference/transcript-hygiene.md

- Route: /reference/transcript-hygiene
- Überschriften:
  - H2: Globale Regel: Laufzeitkontext ist kein Benutzertranskript
  - H2: Wo dies ausgeführt wird
  - H2: Globale Regel: Bildbereinigung
  - H2: Globale Regel: fehlerhafte Tool-Aufrufe
  - H2: Globale Regel: unvollständige reine Reasoning-Turns
  - H2: Globale Regel: Eingabeherkunft zwischen Sitzungen
  - H2: Provider-Matrix (aktuelles Verhalten)
  - H2: Historisches Verhalten (vor 2026.1.22)
  - H2: Verwandt

## reference/wizard.md

- Route: /reference/wizard
- Überschriften:
  - H2: Ablaufdetails (lokaler Modus)
  - H2: Nicht-interaktiver Modus
  - H3: Agent hinzufügen (nicht-interaktiv)
  - H2: Gateway-Wizard-RPC
  - H2: Signal-Einrichtung (signal-cli)
  - H2: Was der Wizard schreibt
  - H2: Verwandte Dokumentation

## releases/index.md

- Route: /releases
- Überschriften:
  - H1: Versionshinweise
  - H2: Demnächst
  - H2: Rohe Release-Historie

## security/CONTRIBUTING-THREAT-MODEL.md

- Route: /security/CONTRIBUTING-THREAT-MODEL
- Überschriften:
  - H2: Möglichkeiten zur Mitwirkung
  - H3: Bedrohung hinzufügen
  - H3: Minderung vorschlagen
  - H3: Angriffskette vorschlagen
  - H3: Bestehende Inhalte korrigieren oder verbessern
  - H2: Was wir verwenden
  - H3: MITRE-ATLAS-Framework
  - H3: Bedrohungs-IDs
  - H3: Risikostufen
  - H2: Review-Prozess
  - H2: Ressourcen
  - H2: Kontakt
  - H2: Anerkennung
  - H2: Verwandt

## security/THREAT-MODEL-ATLAS.md

- Route: /security/THREAT-MODEL-ATLAS
- Überschriften:
  - H2: MITRE-ATLAS-Framework
  - H3: Framework-Zuordnung
  - H3: Zu diesem Bedrohungsmodell beitragen
  - H2: 1. Einführung
  - H3: 1.1 Zweck
  - H3: 1.2 Umfang
  - H3: 1.3 Außerhalb des Umfangs
  - H2: 2. Systemarchitektur
  - H3: 2.1 Vertrauensgrenzen
  - H3: 2.2 Datenflüsse
  - H2: 3. Bedrohungsanalyse nach ATLAS-Taktik
  - H3: 3.1 Aufklärung (AML.TA0002)
  - H4: T-RECON-001: Erkennung von Agent-Endpunkten
  - H4: T-RECON-002: Prüfung der Kanalintegration
  - H3: 3.2 Erstzugriff (AML.TA0004)
  - H4: T-ACCESS-001: Abfangen von Pairing-Codes
  - H4: T-ACCESS-002: AllowFrom-Spoofing
  - H4: T-ACCESS-003: Token-Diebstahl
  - H3: 3.3 Ausführung (AML.TA0005)
  - H4: T-EXEC-001: Direkte Prompt-Injection
  - H4: T-EXEC-002: Indirekte Prompt-Injection
  - H4: T-EXEC-003: Tool-Argument-Injection
  - H4: T-EXEC-004: Umgehung der Exec-Genehmigung
  - H3: 3.4 Persistenz (AML.TA0006)
  - H4: T-PERSIST-001: Installation bösartiger Skills
  - H4: T-PERSIST-002: Vergiftung von Skill-Updates
  - H4: T-PERSIST-003: Manipulation der Agent-Konfiguration
  - H3: 3.5 Umgehung von Abwehrmaßnahmen (AML.TA0007)
  - H4: T-EVADE-001: Umgehung von Moderationsmustern
  - H4: T-EVADE-002: Ausbruch aus Content-Wrapper
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Tool-Aufzählung
  - H4: T-DISC-002: Extraktion von Sitzungsdaten
  - H3: 3.7 Sammlung & Exfiltration (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Datendiebstahl über webfetch
  - H4: T-EXFIL-002: Unbefugtes Senden von Nachrichten
  - H4: T-EXFIL-003: Sammeln von Zugangsdaten
  - H3: 3.8 Auswirkung (AML.TA0011)
  - H4: T-IMPACT-001: Unbefugte Befehlsausführung
  - H4: T-IMPACT-002: Ressourcenerschöpfung (DoS)
  - H4: T-IMPACT-003: Reputationsschaden
  - H2: 4. ClawHub-Lieferkettenanalyse
  - H3: 4.1 Aktuelle Sicherheitskontrollen
  - H3: 4.2 Muster für Moderations-Flags
  - H3: 4.3 Geplante Verbesserungen
  - H2: 5. Risikomatrix
  - H3: 5.1 Wahrscheinlichkeit vs. Auswirkung
  - H3: 5.2 Angriffsketten im kritischen Pfad
  - H2: 6. Zusammenfassung der Empfehlungen
  - H3: 6.1 Sofort (P0)
  - H3: 6.2 Kurzfristig (P1)
  - H3: 6.3 Mittelfristig (P2)
  - H2: 7. Anhänge
  - H3: 7.1 Zuordnung von ATLAS-Techniken
  - H3: 7.2 Wichtige Sicherheitsdateien
  - H3: 7.3 Glossar
  - H2: Verwandt

## security/formal-verification.md

- Route: /security/formal-verification
- Überschriften:
  - H2: Wo die Modelle liegen
  - H2: Wichtige Einschränkungen
  - H2: Ergebnisse reproduzieren
  - H3: Gateway-Offenlegung und Fehlkonfiguration eines offenen Gateways
  - H3: Node-exec-Pipeline (Fähigkeit mit höchstem Risiko)
  - H3: Pairing-Speicher (DM-Gating)
  - H3: Ingress-Gating (Erwähnungen + Umgehung von Steuerbefehlen)
  - H3: Routing-/Sitzungsschlüssel-Isolierung
  - H2: v1++: zusätzliche begrenzte Modelle (Nebenläufigkeit, Wiederholungen, Trace-Korrektheit)
  - H3: Nebenläufigkeit / Idempotenz des Pairing-Speichers
  - H3: Ingress-Trace-Korrelation / Idempotenz
  - H3: Routing-dmScope-Priorität + identityLinks
  - H2: Verwandt

## security/incident-response.md

- Route: /security/incident-response
- Überschriften:
  - H2: 1. Erkennung und Triage
  - H2: 2. Bewertung
  - H2: 3. Reaktion
  - H2: 4. Kommunikation
  - H2: 5. Wiederherstellung und Nachbereitung

## security/network-proxy.md

- Route: /security/network-proxy
- Überschriften:
  - H2: Warum einen Proxy verwenden
  - H2: Wie OpenClaw Traffic weiterleitet
  - H2: Verwandte Proxy-Begriffe
  - H2: Konfiguration
  - H3: Gateway-Loopback-Modus
  - H2: Proxy-Anforderungen
  - H2: Empfohlene blockierte Ziele
  - H2: Validierung
  - H2: Proxy-CA-Vertrauen
  - H2: Grenzen

## specs/claw-supervisor.md

- Route: /specs/claw-supervisor
- Überschriften:
  - H1: Claw Supervisor
  - H2: Ziel
  - H2: Produktmodell
  - H2: Architektur
  - H2: Codex-App-Server-Vertrag
  - H2: Sitzungsregistrierung
  - H2: MCP-Oberfläche für Codex
  - H2: Claw-Steuerungsoberfläche
  - H2: Startablauf
  - H2: Bereitstellung
  - H2: Sicherheit
  - H2: Implementierungsplan
  - H2: Akzeptanztests
  - H2: Offene Fragen

## start/bootstrapping.md

- Route: /start/bootstrapping
- Überschriften:
  - H2: Was Bootstrapping tut
  - H2: Bootstrapping überspringen
  - H2: Wo es ausgeführt wird
  - H2: Verwandte Dokumentation

## start/docs-directory.md

- Route: /start/docs-directory
- Überschriften:
  - H2: Hier beginnen
  - H2: Provider und UX
  - H2: Begleit-Apps
  - H2: Betrieb und Sicherheit
  - H2: Verwandt

## start/getting-started.md

- Route: /start/getting-started
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schnelle Einrichtung
  - H2: Was Sie als Nächstes tun sollten
  - H2: Verwandt

## start/hubs.md

- Route: /start/hubs
- Überschriften:
  - H2: Hier beginnen
  - H2: Installation + Updates
  - H2: Kernkonzepte
  - H2: Provider + Ingress
  - H2: Gateway + Betrieb
  - H2: Tools + Automatisierung
  - H2: Nodes, Medien, Stimme
  - H2: Plattformen
  - H2: macOS-Begleit-App (fortgeschritten)
  - H2: Plugins
  - H2: Workspace + Vorlagen
  - H2: Projekt
  - H2: Tests + Release
  - H2: Verwandt

## start/lore.md

- Route: /start/lore
- Überschriften:
  - H1: Die Lore von OpenClaw 🦞📖
  - H2: Die Ursprungsgeschichte
  - H2: Die erste Häutung (27. Januar 2026)
  - H2: Der Name
  - H2: Die Daleks vs. die Hummer
  - H2: Schlüsselfiguren
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Das Moltiverse
  - H2: Die großen Vorfälle
  - H3: Der Directory Dump (3. Dez. 2025)
  - H3: Die große Häutung (27. Jan. 2026)
  - H3: Die endgültige Form (30. Januar 2026)
  - H3: Der Roboter-Einkaufsrausch (3. Dez. 2025)
  - H2: Heilige Texte
  - H2: Das Hummer-Credo
  - H3: Die Icon-Generation-Saga (27. Jan. 2026)
  - H2: Die Zukunft
  - H2: Verwandt

## start/onboarding-overview.md

- Route: /start/onboarding-overview
- Überschriften:
  - H2: Welchen Pfad sollte ich verwenden?
  - H2: Was das Onboarding konfiguriert
  - H2: CLI-Onboarding
  - H2: Onboarding der macOS-App
  - H2: Benutzerdefinierte oder nicht aufgeführte Provider
  - H2: Verwandt

## start/onboarding.md

- Route: /start/onboarding
- Überschriften:
  - H2: Verwandt

## start/openclaw.md

- Route: /start/openclaw
- Überschriften:
  - H2: ⚠️ Sicherheit zuerst
  - H2: Voraussetzungen
  - H2: Das Zwei-Telefon-Setup (empfohlen)
  - H2: 5-Minuten-Schnellstart
  - H2: Dem Agent einen Workspace geben (AGENTS)
  - H2: Die Konfiguration, die ihn zu „einem Assistenten“ macht
  - H2: Sitzungen und Speicher
  - H2: Heartbeats (proaktiver Modus)
  - H2: Medien hinein und hinaus
  - H2: Betriebs-Checkliste
  - H2: Nächste Schritte
  - H2: Verwandt

## start/quickstart.md

- Route: /start/quickstart
- Überschriften:
  - H2: Verwandt

## start/setup.md

- Route: /start/setup
- Überschriften:
  - H2: TL;DR
  - H2: Voraussetzungen (aus dem Quellcode)
  - H2: Anpassungsstrategie (damit Updates nicht schaden)
  - H2: Gateway aus diesem Repository ausführen
  - H2: Stabiler Workflow (macOS-App zuerst)
  - H2: Bleeding-Edge-Workflow (Gateway in einem Terminal)
  - H3: 0) (Optional) macOS-App ebenfalls aus dem Quellcode ausführen
  - H3: 1) Dev-Gateway starten
  - H3: 2) macOS-App auf Ihr laufendes Gateway richten
  - H3: 3) Überprüfen
  - H3: Häufige Stolperfallen
  - H2: Zuordnung der Anmeldedatenspeicherung
  - H2: Aktualisierung (ohne Ihr Setup zu zerstören)
  - H2: Linux (systemd-Benutzerdienst)
  - H2: Verwandte Dokumentation

## start/showcase.md

- Route: /start/showcase
- Überschriften:
  - H2: Frisch aus Discord
  - H2: Automatisierung und Workflows
  - H2: Wissen und Speicher
  - H2: Sprache und Telefon
  - H2: Infrastruktur und Bereitstellung
  - H2: Zuhause und Hardware
  - H2: Community-Projekte
  - H2: Reichen Sie Ihr Projekt ein
  - H2: Verwandt

## start/wizard-cli-automation.md

- Route: /start/wizard-cli-automation
- Überschriften:
  - H2: Nicht-interaktives Basisbeispiel
  - H2: Provider-spezifische Beispiele
  - H2: Weiteren Agent hinzufügen
  - H2: Verwandte Dokumentation

## start/wizard-cli-reference.md

- Route: /start/wizard-cli-reference
- Überschriften:
  - H2: Was der Wizard tut
  - H2: Details zum lokalen Ablauf
  - H2: Details zum Remote-Modus
  - H2: Authentifizierungs- und Modelloptionen
  - H2: Ausgaben und Interna
  - H2: Verwandte Dokumentation

## start/wizard.md

- Route: /start/wizard
- Überschriften:
  - H2: Gebietsschema
  - H2: QuickStart vs. Advanced
  - H2: Was das Onboarding konfiguriert
  - H2: Weiteren Agent hinzufügen
  - H2: Vollständige Referenz
  - H2: Verwandte Dokumentation

## tools/acp-agents-setup.md

- Route: /tools/acp-agents-setup
- Überschriften:
  - H2: Unterstützung für acpx-Harness (aktuell)
  - H2: Erforderliche Konfiguration
  - H2: Plugin-Einrichtung für acpx-Backend
  - H3: acpx-Befehl und Versionskonfiguration
  - H3: Automatische Installation von Abhängigkeiten
  - H3: Plugin-Tools-MCP-Bridge
  - H3: OpenClaw-Tools-MCP-Bridge
  - H3: Konfiguration des Laufzeitvorgangs-Timeouts
  - H3: Health-Probe-Agent-Konfiguration
  - H2: Berechtigungskonfiguration
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfiguration
  - H2: Verwandt

## tools/acp-agents.md

- Route: /tools/acp-agents
- Überschriften:
  - H2: Welche Seite brauche ich?
  - H2: Funktioniert das sofort einsatzbereit?
  - H2: Unterstützte Harness-Ziele
  - H2: Operator-Runbook
  - H2: ACP gegenüber Sub-Agents
  - H2: Wie ACP Claude Code ausführt
  - H2: Gebundene Sitzungen
  - H3: Mentales Modell
  - H3: Bindungen in der aktuellen Konversation
  - H2: Persistente Kanalbindungen
  - H3: Bindungsmodell
  - H3: Laufzeitstandards pro Agent
  - H3: Beispiel
  - H3: Verhalten
  - H2: ACP-Sitzungen starten
  - H3: sessionsspawn-Parameter
  - H2: Spawn-Bind- und Thread-Modi
  - H2: Zustellmodell
  - H2: Sandbox-Kompatibilität
  - H2: Auflösung des Sitzungsziels
  - H2: ACP-Steuerungen
  - H3: Zuordnung der Laufzeitoptionen
  - H2: acpx-Harness, Plugin-Einrichtung und Berechtigungen
  - H2: Fehlerbehebung
  - H2: Verwandt

## tools/agent-send.md

- Route: /tools/agent-send
- Überschriften:
  - H2: Schnellstart
  - H2: Flags
  - H2: Verhalten
  - H2: Beispiele
  - H2: Verwandt

## tools/apply-patch.md

- Route: /tools/apply-patch
- Überschriften:
  - H2: Parameter
  - H2: Hinweise
  - H2: Beispiel
  - H2: Verwandt

## tools/brave-search.md

- Route: /tools/brave-search
- Überschriften:
  - H2: API-Schlüssel abrufen
  - H2: Konfigurationsbeispiel
  - H2: Tool-Parameter
  - H2: Hinweise
  - H2: Verwandt

## tools/browser-control.md

- Route: /tools/browser-control
- Überschriften:
  - H2: Steuerungs-API (optional)
  - H3: /act-Fehlervertrag
  - H3: Playwright-Anforderung
  - H4: Docker-Playwright-Installation
  - H2: Funktionsweise (intern)
  - H2: CLI-Kurzreferenz
  - H2: Snapshots und Refs
  - H2: Wait-Erweiterungen
  - H2: Debug-Workflows
  - H2: JSON-Ausgabe
  - H2: Status- und Umgebungseinstellungen
  - H2: Sicherheit und Datenschutz
  - H2: Verwandt

## tools/browser-linux-troubleshooting.md

- Route: /tools/browser-linux-troubleshooting
- Überschriften:
  - H2: Problem: "Chrome CDP konnte auf Port 18800 nicht gestartet werden"
  - H3: Ursache
  - H3: Lösung 1: Google Chrome installieren (empfohlen)
  - H3: Lösung 2: Snap Chromium mit Attach-Only-Modus verwenden
  - H3: Prüfen, ob der Browser funktioniert
  - H3: Konfigurationsreferenz
  - H3: Problem: "Keine Chrome-Tabs für profile=\"user\" gefunden"
  - H2: Verwandt

## tools/browser-login.md

- Route: /tools/browser-login
- Überschriften:
  - H2: Manuelle Anmeldung (empfohlen)
  - H2: Welches Chrome-Profil wird verwendet?
  - H2: X/Twitter: empfohlener Ablauf
  - H2: Sandboxing + Zugriff auf Host-Browser
  - H2: Verwandt

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Route: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Überschriften:
  - H2: Zuerst den richtigen Browsermodus wählen
  - H3: Option 1: Rohes Remote-CDP von WSL2 zu Windows
  - H3: Option 2: Host-lokales Chrome MCP
  - H2: Funktionierende Architektur
  - H2: Warum diese Einrichtung verwirrend ist
  - H2: Kritische Regel für die Control UI
  - H2: Schichtweise validieren
  - H3: Schicht 1: Prüfen, ob Chrome CDP unter Windows bereitstellt
  - H3: Schicht 2: Prüfen, ob WSL2 diesen Windows-Endpunkt erreichen kann
  - H3: Schicht 3: Das richtige Browserprofil konfigurieren
  - H3: Schicht 4: Die Control-UI-Schicht separat prüfen
  - H3: Schicht 5: Browsersteuerung Ende-zu-Ende prüfen
  - H2: Häufige irreführende Fehler
  - H2: Schnelle Triage-Checkliste
  - H2: Praktische Erkenntnis
  - H2: Verwandt

## tools/browser.md

- Route: /tools/browser
- Überschriften:
  - H2: Was Sie erhalten
  - H2: Schnellstart
  - H2: Plugin-Steuerung
  - H2: Agent-Anleitung
  - H2: Fehlender Browserbefehl oder fehlendes Tool
  - H2: Profile: openclaw gegenüber user
  - H2: Konfiguration
  - H3: Screenshot-Vision (Unterstützung für Nur-Text-Modelle)
  - H2: Brave oder einen anderen Chromium-basierten Browser verwenden
  - H2: Lokale gegenüber Remote-Steuerung
  - H2: Node-Browser-Proxy (Zero-Config-Standard)
  - H2: Browserless (gehostetes Remote-CDP)
  - H3: Browserless Docker auf demselben Host
  - H2: Direkte WebSocket-CDP-Provider
  - H3: Browserbase
  - H3: Notte
  - H2: Sicherheit
  - H2: Profile (mehrere Browser)
  - H2: Vorhandene Sitzung über Chrome DevTools MCP
  - H3: Benutzerdefinierter Chrome-MCP-Start
  - H2: Isolationsgarantien
  - H2: Browserauswahl
  - H2: Steuerungs-API (optional)
  - H2: Fehlerbehebung
  - H3: CDP-Startfehler gegenüber Navigations-SSRF-Blockierung
  - H2: Agent-Tools + wie die Steuerung funktioniert
  - H2: Verwandt

## tools/btw.md

- Route: /tools/btw
- Überschriften:
  - H2: Was es tut
  - H2: Was es nicht tut
  - H2: Wie Kontext funktioniert
  - H2: Zustellmodell
  - H2: Oberflächenverhalten
  - H3: TUI
  - H3: Externe Kanäle
  - H3: Control UI / Web
  - H2: Wann BTW verwendet werden sollte
  - H2: Wann BTW nicht verwendet werden sollte
  - H2: Verwandt

## tools/capability-cookbook.md

- Route: /tools/capability-cookbook
- Überschriften:
  - H2: Verwandt

## tools/clawhub.md

- Route: /tools/clawhub
- Überschriften: keine

## tools/code-execution.md

- Route: /tools/code-execution
- Überschriften:
  - H2: Einrichtung
  - H2: Verwendung
  - H2: Fehler
  - H2: Grenzen
  - H2: Verwandt

## tools/creating-skills.md

- Route: /tools/creating-skills
- Überschriften:
  - H2: Ihren ersten Skill erstellen
  - H2: SKILL.md-Referenz
  - H3: Erforderliche Felder
  - H3: Optionale Frontmatter-Schlüssel
  - H3: {baseDir} verwenden
  - H2: Bedingte Aktivierung hinzufügen
  - H2: Über Skill Workshop vorschlagen
  - H2: In ClawHub veröffentlichen
  - H2: Bewährte Verfahren
  - H2: Verwandt

## tools/diffs.md

- Route: /tools/diffs
- Überschriften:
  - H2: Schnellstart
  - H2: Integrierte Systemanleitung deaktivieren
  - H2: Typischer Agent-Workflow
  - H2: Eingabebeispiele
  - H2: Referenz für Tool-Eingaben
  - H2: Syntaxhervorhebung
  - H2: Vertrag für Ausgabedetails
  - H2: Eingeklappte unveränderte Abschnitte
  - H2: Plugin-Standards
  - H3: Persistente Viewer-URL-Konfiguration
  - H2: Sicherheitskonfiguration
  - H2: Artefaktlebenszyklus und Speicherung
  - H2: Viewer-URL und Netzwerkverhalten
  - H2: Sicherheitsmodell
  - H2: Browseranforderungen für den Dateimodus
  - H2: Fehlerbehebung
  - H2: Betriebliche Hinweise
  - H2: Verwandt

## tools/duckduckgo-search.md

- Route: /tools/duckduckgo-search
- Überschriften:
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Tool-Parameter
  - H2: Hinweise
  - H2: Verwandt

## tools/elevated.md

- Route: /tools/elevated
- Überschriften:
  - H2: Direktiven
  - H2: Funktionsweise
  - H2: Auflösungsreihenfolge
  - H2: Verfügbarkeit und Allowlists
  - H2: Was elevated nicht steuert
  - H2: Verwandt

## tools/exa-search.md

- Route: /tools/exa-search
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Basis-URL-Überschreibung
  - H2: Tool-Parameter
  - H3: Inhaltsextraktion
  - H3: Suchmodi
  - H2: Hinweise
  - H2: Verwandt

## tools/exec-approvals-advanced.md

- Route: /tools/exec-approvals-advanced
- Überschriften:
  - H2: Sichere Binaries (nur stdin)
  - H3: Argv-Validierung und abgelehnte Flags
  - H3: Vertrauenswürdige Binary-Verzeichnisse
  - H3: Shell-Verkettung, Wrapper und Multiplexer
  - H3: Sichere Binaries gegenüber Allowlist
  - H2: Interpreter-/Runtime-Befehle
  - H3: Verhalten bei der Follow-up-Zustellung
  - H2: Genehmigungsweiterleitung an Chat-Kanäle
  - H3: Plugin-Genehmigungsweiterleitung
  - H3: Genehmigungen im selben Chat auf jedem Kanal
  - H3: Native Genehmigungszustellung
  - H3: macOS-IPC-Ablauf
  - H2: FAQ
  - H3: Wann würden accountId und threadId für ein Genehmigungsziel verwendet?
  - H3: Wenn Genehmigungen an eine Sitzung gesendet werden, kann dann jede Person in dieser Sitzung sie genehmigen?
  - H2: Verwandt

## tools/exec-approvals.md

- Route: /tools/exec-approvals
- Überschriften:
  - H2: Wirksame Richtlinie prüfen
  - H2: Wo sie gilt
  - H3: Vertrauensmodell
  - H3: macOS-Aufteilung
  - H2: Einstellungen und Speicherung
  - H2: Richtlinieneinstellungen
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO-Modus (keine Genehmigung)
  - H3: Persistente gateway-host-Einrichtung mit "nie nachfragen"
  - H3: Lokale Abkürzung
  - H3: Node-Host
  - H3: Nur-Sitzung-Abkürzung
  - H2: Allowlist (pro Agent)
  - H3: Argumente mit argPattern einschränken
  - H2: Skill-CLIs automatisch erlauben
  - H2: Sichere Binaries und Genehmigungsweiterleitung
  - H2: Bearbeitung in der Control UI
  - H2: Genehmigungsablauf
  - H2: Systemereignisse
  - H2: Verhalten bei abgelehnter Genehmigung
  - H2: Auswirkungen
  - H2: Verwandt

## tools/exec.md

- Route: /tools/exec
- Überschriften:
  - H2: Parameter
  - H2: Konfiguration
  - H3: PATH-Behandlung
  - H2: Sitzungsüberschreibungen (/exec)
  - H2: Autorisierungsmodell
  - H2: Exec-Genehmigungen (Begleit-App / Node-Host)
  - H2: Allowlist + sichere Binaries
  - H2: Beispiele
  - H2: applypatch
  - H2: Verwandt

## tools/firecrawl.md

- Route: /tools/firecrawl
- Überschriften:
  - H2: Plugin installieren
  - H2: Webfetch ohne Schlüssel und API-Schlüssel
  - H2: Firecrawl-Suche konfigurieren
  - H2: Firecrawl-Webfetch-Fallback konfigurieren
  - H3: Selbst gehostetes Firecrawl
  - H2: Firecrawl-Plugin-Tools
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / Bot-Umgehung
  - H2: Wie webfetch Firecrawl verwendet
  - H2: Verwandt

## tools/gemini-search.md

- Route: /tools/gemini-search
- Überschriften:
  - H2: API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Modellauswahl
  - H2: Basis-URL-Überschreibungen
  - H2: Verwandt

## tools/goal.md

- Route: /tools/goal
- Überschriften:
  - H1: Ziel
  - H2: Schnellstart
  - H2: Wofür Ziele gedacht sind
  - H2: Befehlsreferenz
  - H2: Status
  - H2: Token-Budgets
  - H2: Modell-Tools
  - H2: TUI
  - H2: Kanalverhalten
  - H2: Fehlerbehebung
  - H2: Verwandt

## tools/grok-search.md

- Route: /tools/grok-search
- Überschriften:
  - H2: Onboarding und Konfiguration
  - H2: Anmelden oder API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Basis-URL-Überschreibungen
  - H2: Verwandt

## tools/image-generation.md

- Route: /tools/image-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Häufige Routen
  - H2: Unterstützte Provider
  - H2: Provider-Fähigkeiten
  - H2: Tool-Parameter
  - H2: Konfiguration
  - H3: Modellauswahl
  - H3: Provider-Auswahlreihenfolge
  - H3: Bildbearbeitung
  - H2: Provider-Deep-Dives
  - H2: Beispiele
  - H2: Verwandt

## tools/index.md

- Route: /tools
- Überschriften:
  - H2: Hier beginnen
  - H2: Tools, Skills oder Plugins auswählen
  - H2: Integrierte Tool-Kategorien
  - H2: Von Plugins bereitgestellte Tools
  - H2: Zugriff und Genehmigungen konfigurieren
  - H2: Fähigkeiten erweitern
  - H2: Fehlende Tools beheben
  - H2: Verwandt

## tools/kimi-search.md

- Route: /tools/kimi-search
- Überschriften:
  - H2: API-Schlüssel abrufen
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Verwandt

## tools/llm-task.md

- Route: /tools/llm-task
- Überschriften:
  - H2: Plugin aktivieren
  - H2: Konfiguration (optional)
  - H2: Tool-Parameter
  - H2: Ausgabe
  - H2: Beispiel: Lobster-Workflow-Schritt
  - H3: Wichtige Einschränkung
  - H2: Sicherheitshinweise
  - H2: Verwandt

## tools/lobster.md

- Route: /tools/lobster
- Überschriften:
  - H2: Hook
  - H2: Warum
  - H2: Warum eine DSL statt einfacher Programme?
  - H2: Funktionsweise
  - H2: Muster: kleine CLI + JSON-Pipes + Genehmigungen
  - H2: Nur-JSON-LLM-Schritte (llm-task)
  - H3: Wichtige Einschränkung: eingebettetes Lobster gegenüber openclaw.invoke
  - H2: Workflow-Dateien (.lobster)
  - H2: Lobster installieren
  - H2: Das Tool aktivieren
  - H2: Beispiel: E-Mail-Triage
  - H2: Tool-Parameter
  - H3: run
  - H3: resume
  - H3: Optionale Eingaben
  - H2: Ausgabe-Envelope
  - H2: Genehmigungen
  - H2: OpenProse
  - H2: Sicherheit
  - H2: Fehlerbehebung
  - H2: Mehr erfahren
  - H2: Fallstudie: Community-Workflows
  - H2: Verwandt

## tools/loop-detection.md

- Route: /tools/loop-detection
- Überschriften:
  - H2: Warum dies existiert
  - H2: Konfigurationsblock
  - H3: Feldverhalten
  - H2: Empfohlene Einrichtung
  - H2: Schutz nach Compaction
  - H2: Logs und erwartetes Verhalten
  - H2: Verwandt

## tools/media-overview.md

- Route: /tools/media-overview
- Überschriften:
  - H2: Fähigkeiten
  - H2: Matrix der Provider-Fähigkeiten
  - H2: Asynchron gegenüber synchron
  - H2: Speech-to-Text und Voice Call
  - H2: Provider-Zuordnungen (wie Anbieter Oberflächen aufteilen)
  - H2: Verwandt

## tools/minimax-search.md

- Route: /tools/minimax-search
- Überschriften:
  - H2: Token-Plan-Anmeldedaten abrufen
  - H2: Konfiguration
  - H2: Regionsauswahl
  - H2: Unterstützte Parameter
  - H2: Verwandt

## tools/multi-agent-sandbox-tools.md

- Route: /tools/multi-agent-sandbox-tools
- Überschriften:
  - H2: Konfigurationsbeispiele
  - H2: Konfigurationspriorität
  - H3: Sandbox-Konfiguration
  - H3: Tool-Einschränkungen
  - H2: Migration von einem einzelnen Agenten
  - H2: Beispiele für Tool-Einschränkungen
  - H2: Häufige Fehlerquelle: "non-main"
  - H2: Tests
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/music-generation.md

- Route: /tools/music-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H3: Funktionsmatrix
  - H2: Tool-Parameter
  - H2: Asynchrones Verhalten
  - H3: Aufgabenlebenszyklus
  - H2: Konfiguration
  - H3: Modellauswahl
  - H3: Reihenfolge der Provider-Auswahl
  - H2: Provider-Hinweise
  - H2: Den richtigen Pfad wählen
  - H2: Provider-Funktionsmodi
  - H2: Live-Tests
  - H2: Verwandte Themen

## tools/ollama-search.md

- Route: /tools/ollama-search
- Überschriften:
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/parallel-search.md

- Route: /tools/parallel-search
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel (kostenpflichtiger Provider)
  - H2: Konfiguration
  - H2: Überschreiben der Basis-URL
  - H2: Tool-Parameter
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
  - H3: Ausweichmodus für Extraktion
  - H2: Konfiguration
  - H2: Ausgabedetails
  - H2: Fehlerverhalten
  - H2: Beispiele
  - H2: Verwandte Themen

## tools/permission-modes.md

- Route: /tools/permission-modes
- Überschriften:
  - H2: Empfohlene Voreinstellung
  - H2: OpenClaw-Host-Ausführungsmodi
  - H2: Codex Guardian-Zuordnung
  - H2: ACPX-Harness-Berechtigungen
  - H2: Einen Modus wählen
  - H2: Verwandte Themen

## tools/perplexity-search.md

- Route: /tools/perplexity-search
- Überschriften:
  - H2: Plugin installieren
  - H2: Einen Perplexity-API-Schlüssel erhalten
  - H2: OpenRouter-Kompatibilität
  - H2: Konfigurationsbeispiele
  - H3: Native Perplexity Search API
  - H3: OpenRouter-/Sonar-Kompatibilität
  - H2: Wo der Schlüssel festgelegt wird
  - H2: Tool-Parameter
  - H3: Regeln für Domain-Filter
  - H2: Hinweise
  - H2: Verwandte Themen

## tools/plugin.md

- Route: /tools/plugin
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Konfiguration
  - H3: Eine Installationsquelle wählen
  - H3: Installationsrichtlinie für Betreiber
  - H3: Plugin-Richtlinie konfigurieren
  - H2: Plugin-Formate verstehen
  - H2: Plugin-Hooks
  - H2: Aktiven Gateway prüfen
  - H2: Fehlerbehebung
  - H3: Blockierter Besitz eines Plugin-Pfads
  - H3: Langsame Einrichtung von Plugin-Tools
  - H2: Verwandte Themen

## tools/reactions.md

- Route: /tools/reactions
- Überschriften:
  - H2: Funktionsweise
  - H2: Kanalverhalten
  - H2: Reaktionsstufe
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

## tools/skill-workshop.md

- Route: /tools/skill-workshop
- Überschriften:
  - H2: Funktionsweise
  - H2: Lebenszyklus
  - H2: Chat
  - H2: CLI
  - H2: Vorschlagsinhalt
  - H2: Unterstützungsdateien
  - H2: Agenten-Tool
  - H2: Genehmigung und Autonomie
  - H2: Gateway-Methoden
  - H2: Speicher
  - H2: Grenzen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/skills-config.md

- Route: /tools/skills-config
- Überschriften:
  - H2: Laden (skills.load)
  - H2: Installieren (skills.install)
  - H2: Installationsrichtlinie für Betreiber (security.installPolicy)
  - H2: Allowlist für gebündelte Skills
  - H2: Einträge pro Skill (skills.entries)
  - H2: Agenten-Allowlists (agents)
  - H2: Workshop (skills.workshop)
  - H2: Per Symlink verknüpfte Skill-Wurzeln
  - H2: Skills in der Sandbox und env vars
  - H2: Erinnerung an die Ladereihenfolge
  - H2: Verwandte Themen

## tools/skills.md

- Route: /tools/skills
- Überschriften:
  - H2: Ladereihenfolge
  - H2: Agentenspezifische vs. gemeinsame Skills
  - H2: Agenten-Allowlists
  - H2: Plugins und Skills
  - H2: Skill Workshop
  - H2: Installation aus ClawHub
  - H2: Sicherheit
  - H2: SKILL.md-Format
  - H3: Optionale Frontmatter-Schlüssel
  - H2: Gating
  - H3: Installer-Spezifikationen
  - H2: Konfigurationsüberschreibungen
  - H2: Umgebungseinfügung
  - H2: Snapshots und Aktualisierung
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
  - H3: Befehle gebündelter Plugins
  - H3: Skill-Befehle
  - H2: /tools — was der Agent jetzt verwenden kann
  - H2: /model — Modellauswahl
  - H2: /config — Konfigurationsschreibvorgänge auf Datenträger
  - H2: /mcp — MCP-Serverkonfiguration
  - H2: /debug — nur laufzeitbezogene Überschreibungen
  - H2: /plugins — Plugin-Verwaltung
  - H2: /trace — Plugin-Trace-Ausgabe
  - H2: /btw — Nebenfragen
  - H2: Hinweise zu Oberflächen
  - H2: Provider-Nutzung und Status
  - H2: Verwandte Themen

## tools/steer.md

- Route: /tools/steer
- Überschriften:
  - H2: Aktuelle Sitzung
  - H2: Steuern vs. Warteschlange
  - H2: Sub-Agenten
  - H2: ACP-Sitzungen
  - H2: Verwandte Themen

## tools/subagents.md

- Route: /tools/subagents
- Überschriften:
  - H2: Slash-Befehl
  - H3: Thread-Bindungssteuerungen
  - H3: Spawn-Verhalten
  - H2: Kontextmodi
  - H2: Tool: sessionsspawn
  - H3: Delegations-Prompt-Modus
  - H3: Tool-Parameter
  - H3: Aufgabennamen und Zielzuweisung
  - H2: Tool: sessionsyield
  - H2: Tool: subagents
  - H2: Thread-gebundene Sitzungen
  - H3: Thread-unterstützende Kanäle
  - H3: Schneller Ablauf
  - H3: Manuelle Steuerungen
  - H3: Konfigurationsschalter
  - H3: Allowlist
  - H3: Erkennung
  - H3: Automatische Archivierung
  - H2: Verschachtelte Sub-Agenten
  - H3: Tiefenstufen
  - H3: Ankündigungskette
  - H3: Tool-Richtlinie nach Tiefe
  - H3: Spawn-Limit pro Agent
  - H3: Kaskadenstopp
  - H2: Authentifizierung
  - H2: Ankündigen
  - H3: Ankündigungskontext
  - H3: Statistikzeile
  - H3: Warum sessionshistory bevorzugen
  - H2: Tool-Richtlinie
  - H3: Überschreiben per Konfiguration
  - H2: Nebenläufigkeit
  - H2: Aktivität und Wiederherstellung
  - H2: Stoppen
  - H2: Einschränkungen
  - H2: Verwandte Themen

## tools/tavily.md

- Route: /tools/tavily
- Überschriften:
  - H2: Erste Schritte
  - H2: Tool-Referenz
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Das richtige Tool wählen
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## tools/thinking.md

- Route: /tools/thinking
- Überschriften:
  - H2: Was es tut
  - H2: Auflösungsreihenfolge
  - H2: Sitzungsstandard festlegen
  - H2: Anwendung nach Agent
  - H2: Schnellmodus (/fast)
  - H2: Ausführliche Direktiven (/verbose oder /v)
  - H2: Plugin-Trace-Direktiven (/trace)
  - H2: Sichtbarkeit des Reasonings (/reasoning)
  - H2: Verwandte Themen
  - H2: Heartbeats
  - H2: Webchat-UI
  - H2: Provider-Profile

## tools/tokenjuice.md

- Route: /tools/tokenjuice
- Überschriften:
  - H2: Plugin aktivieren
  - H2: Was tokenjuice ändert
  - H2: Funktion prüfen
  - H2: Plugin deaktivieren
  - H2: Verwandte Themen

## tools/tool-search.md

- Route: /tools/tool-search
- Überschriften:
  - H2: Wie ein Turn abläuft
  - H2: Modi
  - H2: Warum es das gibt
  - H2: API
  - H2: Laufzeitgrenze
  - H2: Konfiguration
  - H2: Prompt und Telemetrie
  - H2: E2E-Validierung
  - H2: Fehlerverhalten
  - H2: Verwandte Themen

## tools/trajectory.md

- Route: /tools/trajectory
- Überschriften:
  - H2: Schnellstart
  - H2: Zugriff
  - H2: Was aufgezeichnet wird
  - H2: Bundle-Dateien
  - H2: Erfassungsort
  - H2: Erfassung deaktivieren
  - H2: Flush-Timeout anpassen
  - H2: Datenschutz und Grenzen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/tts.md

- Route: /tools/tts
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H2: Konfiguration
  - H3: Stimmüberschreibungen pro Agent
  - H2: Personas
  - H3: Minimale Persona
  - H3: Vollständige Persona (Provider-neutraler Prompt)
  - H3: Persona-Auflösung
  - H3: Wie Provider Persona-Prompts verwenden
  - H3: Fallback-Richtlinie
  - H2: Modellgesteuerte Direktiven
  - H2: Slash-Befehle
  - H2: Benutzerspezifische Einstellungen
  - H2: Ausgabeformate (fest)
  - H2: Auto-TTS-Verhalten
  - H2: Ausgabeformate nach Kanal
  - H2: Feldreferenz
  - H2: Agenten-Tool
  - H2: Gateway-RPC
  - H2: Dienstlinks
  - H2: Verwandte Themen

## tools/video-generation.md

- Route: /tools/video-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Wie asynchrone Generierung funktioniert
  - H3: Aufgabenlebenszyklus
  - H2: Unterstützte Provider
  - H3: Funktionsmatrix
  - H2: Tool-Parameter
  - H3: Erforderlich
  - H3: Inhaltseingaben
  - H3: Stilsteuerungen
  - H3: Erweitert
  - H4: Fallback und typisierte Optionen
  - H2: Aktionen
  - H2: Modellauswahl
  - H2: Provider-Hinweise
  - H2: Provider-Funktionsmodi
  - H2: Live-Tests
  - H2: Konfiguration
  - H2: Verwandte Themen

## tools/web-fetch.md

- Route: /tools/web-fetch
- Überschriften:
  - H2: Schnellstart
  - H2: Tool-Parameter
  - H2: Funktionsweise
  - H2: Fortschrittsaktualisierungen
  - H2: Konfiguration
  - H2: Firecrawl-Fallback
  - H2: Vertrauenswürdiger env-Proxy
  - H2: Grenzen und Sicherheit
  - H2: Tool-Profile
  - H2: Verwandte Themen

## tools/web.md

- Route: /tools/web
- Überschriften:
  - H2: Schnellstart
  - H2: Einen Provider wählen
  - H3: Provider-Vergleich
  - H2: Automatische Erkennung
  - H2: Native OpenAI-Websuche
  - H2: Native Codex-Websuche
  - H2: Netzwerksicherheit
  - H2: Websuche einrichten
  - H2: Konfiguration
  - H3: API-Schlüssel speichern
  - H2: Tool-Parameter
  - H2: xsearch
  - H3: xsearch-Konfiguration
  - H3: xsearch-Parameter
  - H3: xsearch-Beispiel
  - H2: Beispiele
  - H2: Tool-Profile
  - H2: Verwandte Themen

## tts.md

- Route: /tts
- Überschriften:
  - H2: Verwandte Themen

## vps.md

- Route: /vps
- Überschriften:
  - H2: Einen Provider wählen
  - H2: Wie Cloud-Einrichtungen funktionieren
  - H2: Admin-Zugriff zuerst härten
  - H2: Gemeinsamer Unternehmensagent auf einem VPS
  - H2: Nodes mit einem VPS verwenden
  - H2: Startoptimierung für kleine VMs und ARM-Hosts
  - H3: systemd-Optimierungscheckliste (optional)
  - H2: Verwandte Themen

## web/control-ui.md

- Route: /web/control-ui
- Überschriften:
  - H2: Schnell öffnen (lokal)
  - H2: Gerätekopplung (erste Verbindung)
  - H2: Persönliche Identität (browserlokal)
  - H2: Laufzeit-Konfigurationsendpoint
  - H2: Sprachunterstützung
  - H2: Darstellungsthemen
  - H2: Was sie kann (heute)
  - H2: MCP-Seite
  - H2: Aktivitätstab
  - H2: Chatverhalten
  - H2: PWA-Installation und Web-Push
  - H2: Gehostete Einbettungen
  - H2: Chatnachrichtenbreite
  - H2: Tailnet-Zugriff (empfohlen)
  - H2: Unsicheres HTTP
  - H2: Content Security Policy
  - H2: Avatar-Routen-Authentifizierung
  - H2: Authentifizierung der Assistentenmedienroute
  - H2: UI bauen
  - H2: Leere Control UI-Seite
  - H2: Debugging/Tests: Dev-Server + Remote-Gateway
  - H2: Verwandte Themen

## web/dashboard.md

- Route: /web/dashboard
- Überschriften:
  - H2: Schneller Pfad (empfohlen)
  - H2: Authentifizierungsgrundlagen (lokal vs. remote)
  - H2: Wenn Sie "unauthorized" / 1008 sehen
  - H2: Verwandte Themen

## web/index.md

- Route: /web
- Überschriften:
  - H2: Webhooks
  - H2: Admin-HTTP-RPC
  - H2: Konfiguration (standardmäßig aktiviert)
  - H2: Tailscale-Zugriff
  - H3: Integriertes Bereitstellen (empfohlen)
  - H3: Tailnet-Bind + Token
  - H3: Öffentliches Internet (Funnel)
  - H2: Sicherheitshinweise
  - H2: UI bauen

## web/tui.md

- Route: /web/tui
- Überschriften:
  - H2: Schnellstart
  - H3: Gateway-Modus
  - H3: Lokaler Modus
  - H2: Was Sie sehen
  - H2: Mentales Modell: Agenten + Sitzungen
  - H2: Senden + Zustellung
  - H2: Auswahlen + Overlays
  - H2: Tastenkombinationen
  - H2: Slash-Befehle
  - H2: Lokale Shell-Befehle
  - H2: Konfigurationen aus der lokalen TUI reparieren
  - H2: Tool-Ausgabe
  - H2: Terminalfarben
  - H2: Verlauf + Streaming
  - H2: Verbindungsdetails
  - H2: Optionen
  - H2: Fehlerbehebung
  - H2: Verbindungsfehlerbehebung
  - H2: Verwandte Themen

## web/webchat.md

- Route: /web/webchat
- Überschriften:
  - H2: Was es ist
  - H2: Schnellstart
  - H2: Funktionsweise (Verhalten)
  - H3: Transkript- und Zustellungsmodell
  - H2: Agenten-Tools-Panel der Control UI
  - H2: Remote-Nutzung
  - H2: Konfigurationsreferenz (WebChat)
  - H2: Verwandte Themen
