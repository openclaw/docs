---
read_when: Finding which docs page covers a topic before reading the page
summary: Generierte Überschriftenzuordnung für OpenClaw-Dokumentationsseiten
title: Dokumentationsübersicht
x-i18n:
    generated_at: "2026-07-04T10:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ec366b8fddc45897436eeffb2af38cb4f161e77cf1e75c2f5aeb4a05e5d7063
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw-Dokumentationsübersicht

Diese Datei wird aus den Überschriften von `docs/**/*.md` und `docs/**/*.mdx` generiert, damit Agenten durch den Dokumentationsbaum navigieren können.
Bearbeiten Sie sie nicht von Hand; führen Sie `pnpm docs:map:gen` aus.

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Überschriften:
  - H2: Runtime-Layout
  - H2: Grenzen
  - H2: Manifeste
  - H2: Runtime-Auswahl
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
  - H2: Reine-Konfigurations-Auth-Routen
  - H2: Explizite Auth-Reihenfolgenfilterung
  - H2: Probe-Zielauflösung
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
  - H3: Tag des Monats und Wochentag verwenden ODER-Logik
  - H2: Ausführungsarten
  - H3: Befehls-Payloads
  - H3: Payload-Optionen für isolierte Jobs
  - H2: Zustellung und Ausgabe
  - H2: Ausgabesprache
  - H2: CLI-Beispiele
  - H2: Webhooks
  - H3: Authentifizierung
  - H2: Gmail PubSub-Integration
  - H3: Wizard-Einrichtung (empfohlen)
  - H3: Automatischer Gateway-Start
  - H3: Manuelle einmalige Einrichtung
  - H3: Gmail-Modellüberschreibung
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
  - H2: Die richtige Oberfläche wählen
  - H2: Schnellstart
  - H2: Ereignistypen
  - H2: Hooks schreiben
  - H3: Hook-Struktur
  - H3: HOOK.md-Format
  - H3: Handler-Implementierung
  - H3: Highlights des Ereigniskontexts
  - H2: Hook-Erkennung
  - H3: Hook-Pakete
  - H2: Gebündelte Hooks
  - H3: session-memory-Details
  - H3: bootstrap-extra-files-Konfiguration
  - H3: command-logger-Details
  - H3: compaction-notifier-Details
  - H3: boot-md-Details
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
  - H2: Schnelle Entscheidungshilfe
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
  - H3: Beispiel 2: Finanzabläufe (ereignisgesteuert)
  - H3: Beispiel 3: Monitoring und Warnungen (kontinuierlich)
  - H2: Ausführen-Prüfen-Berichten-Muster
  - H2: Mehrprogrammarchitektur
  - H2: Best Practices
  - H3: Tun
  - H3: Vermeiden
  - H2: Verwandte Themen

## automation/taskflow.md

- Route: /automation/taskflow
- Überschriften:
  - H2: Wann TaskFlow verwendet werden sollte
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
  - H2: Was eine Aufgabe erstellt
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
  - H2: Statische Gruppen von Nachrichtensendern
  - H2: Gruppen aus Allowlisten referenzieren
  - H2: Unterstützte Nachrichtenkanalpfade
  - H2: Plugin-Diagnosen
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
  - H1: Bot-Schleifenschutz
  - H2: Standardwerte
  - H2: Gemeinsame Standardwerte konfigurieren
  - H2: Pro Kanal oder Konto überschreiben
  - H2: Kanalunterstützung

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Überschriften:
  - H2: Übersicht
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
  - H2: Zukünftige Erweiterungen
  - H2: Verwandte Themen

## channels/channel-routing.md

- Route: /channels/channel-routing
- Überschriften:
  - H1: Kanäle &amp; Routing
  - H2: Schlüsselbegriffe
  - H2: Präfixe für ausgehende Ziele
  - H2: Formen von Sitzungsschlüsseln (Beispiele)
  - H2: Anheften der Haupt-DM-Route
  - H2: Geschützte eingehende Aufzeichnung
  - H2: Routingregeln (wie ein Agent ausgewählt wird)
  - H2: Broadcast-Gruppen (mehrere Agenten ausführen)
  - H2: Konfigurationsübersicht
  - H2: Sitzungsspeicherung
  - H2: WebChat-Verhalten
  - H2: Antwortkontext
  - H2: Verwandte Themen

## channels/clickclack.md

- Route: /channels/clickclack
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Mehrere Bots
  - H2: Ziele
  - H2: Berechtigungen
  - H2: Fehlerbehebung

## channels/discord.md

- Route: /channels/discord
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Empfohlen: Guild-Arbeitsbereich einrichten
  - H2: Runtime-Modell
  - H2: Forumskanäle
  - H2: Interaktive Komponenten
  - H2: Zugriffskontrolle und Routing
  - H3: Rollenbasiertes Agent-Routing
  - H2: Native Befehle und Befehls-Auth
  - H2: Funktionsdetails
  - H2: Tools und Aktions-Gates
  - H2: Components-v2-UI
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
  - H3: Alle Gruppen zulassen, keine @mention erforderlich
  - H3: Alle Gruppen zulassen, @mention weiterhin erforderlich
  - H3: Nur bestimmte Gruppen zulassen
  - H3: Sender innerhalb einer Gruppe einschränken
  - H2: Gruppen-/Benutzer-IDs abrufen
  - H3: Gruppen-IDs (chatid, Format: ocxxx)
  - H3: Benutzer-IDs (openid, Format: ouxxx)
  - H2: Häufige Befehle
  - H2: Fehlerbehebung
  - H3: Bot antwortet nicht in Gruppenchats
  - H3: Bot empfängt keine Nachrichten
  - H3: QR-Einrichtung reagiert nicht in der Feishu-Mobile-App
  - H3: App Secret geleakt
  - H2: Erweiterte Konfiguration
  - H3: Mehrere Konten
  - H3: Nachrichtenlimits
  - H3: Streaming
  - H3: Kontingentoptimierung
  - H3: ACP-Sitzungen
  - H4: Persistente ACP-Bindung
  - H4: ACP aus dem Chat starten
  - H3: Multi-Agent-Routing
  - H2: Pro-Benutzer-Agent-Isolation (dynamische Agent-Erstellung)
  - H3: Schnelleinrichtung
  - H3: Wie es funktioniert
  - H3: Konfigurationsoptionen
  - H3: Sitzungsumfang
  - H3: Typisches Mehrbenutzer-Deployment
  - H3: Prüfung
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
  - H3: Option B: Reverse Proxy (Caddy)
  - H3: Option C: Cloudflare Tunnel
  - H2: Wie es funktioniert
  - H2: Ziele
  - H2: Konfigurationshighlights
  - H2: Fehlerbehebung
  - H3: 405 Method Not Allowed
  - H3: Weitere Probleme
  - H2: Verwandte Themen

## channels/group-messages.md

- Route: /channels/group-messages
- Überschriften:
  - H2: Verhalten
  - H2: Konfigurationsbeispiel (WhatsApp)
  - H3: Aktivierungsbefehl (nur Owner)
  - H2: Verwendung
  - H2: Testen / Prüfung
  - H2: Bekannte Überlegungen
  - H2: Verwandte Themen

## channels/groups.md

- Route: /channels/groups
- Überschriften:
  - H2: Einsteiger-Einführung (2 Minuten)
  - H2: Sichtbare Antworten
  - H2: Kontextsichtbarkeit und Allowlisten
  - H2: Sitzungsschlüssel
  - H2: Muster: persönliche DMs + öffentliche Gruppen (ein Agent)
  - H2: Anzeigebezeichnungen
  - H2: Gruppenrichtlinie
  - H2: Mention-Gating (Standard)
  - H2: Konfigurierte Mention-Muster eingrenzen
  - H2: Tool-Einschränkungen für Gruppen/Kanäle (optional)
  - H2: Gruppen-Allowlisten
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
  - H2: Was imsg macht
  - H2: Bevor Sie beginnen
  - H2: Konfigurationsübersetzung
  - H2: Stolperfalle bei der Gruppenregistrierung
  - H2: Schritt für Schritt
  - H2: Aktionsparität auf einen Blick
  - H2: Pairing, Sitzungen und ACP-Bindungen
  - H2: Kein Rollback-Kanal
  - H2: Verwandte Themen

## channels/imessage.md

- Route: /channels/imessage
- Überschriften:
  - H2: Schnelleinrichtung
  - H2: Anforderungen und Berechtigungen (macOS)
  - H2: Aktivieren der privaten imsg-API
  - H3: Einrichtung
  - H3: Wenn Sie SIP nicht deaktivieren können
  - H2: Zugriffskontrolle und Routing
  - H2: ACP-Konversationsbindungen
  - H2: Deployment-Muster
  - H2: Medien, Chunking und Zustellungsziele
  - H2: Private API-Aktionen
  - H2: Konfigurationsschreibvorgänge
  - H2: Zusammenführen geteilter DM-Sendungen (Befehl + URL in einer Komposition)
  - H3: Szenarien und was der Agent sieht
  - H2: Eingehende Wiederherstellung nach einem Bridge- oder Gateway-Neustart
  - H3: Für Operator sichtbares Signal
  - H3: Migration
  - H2: Fehlerbehebung
  - H2: Verweise auf die Konfigurationsreferenz
  - H2: Verwandte Themen

## channels/index.md

- Route: /channels
- Überschriften:
  - H2: Zustellungshinweise
  - H2: Unterstützte Kanäle
  - H2: Hinweise

## channels/irc.md

- Route: /channels/irc
- Überschriften:
  - H2: Schnellstart
  - H2: Sicherheitsstandardwerte
  - H2: Zugriffskontrolle
  - H3: Häufige Stolperfalle: allowFrom gilt für DMs, nicht für Kanäle
  - H2: Antwortauslösung (Mentions)
  - H2: Sicherheitshinweis (empfohlen für öffentliche Kanäle)
  - H3: Gleiche Tools für alle im Kanal
  - H3: Unterschiedliche Tools pro Sender (Owner erhält mehr Rechte)
  - H2: NickServ
  - H2: Umgebungsvariablen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/line.md

- Route: /channels/line
- Überschriften:
  - H2: Installieren
  - H2: Einrichtung
  - H2: Konfigurieren
  - H2: Zugriffskontrolle
  - H2: Nachrichtenverhalten
  - H2: Kanaldaten (Rich-Nachrichten)
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
  - H2: Häufige Meldungen und was sie bedeuten
  - H3: Upgrade- und Erkennungsmeldungen
  - H3: Meldungen zur Wiederherstellung des verschlüsselten Zustands
  - H3: Meldungen zur manuellen Wiederherstellung
  - H3: Meldungen zur Installation benutzerdefinierter Plugins
  - H2: Wenn der verschlüsselte Verlauf weiterhin nicht zurückkommt
  - H2: Wenn Sie für zukünftige Nachrichten neu beginnen möchten
  - H2: Verwandte Themen

## channels/matrix-presentation.md

- Route: /channels/matrix-presentation
- Überschriften:
  - H2: Ereignisinhalte
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
  - H2: Hinweise für mehrere Bots
  - H2: Homeserver-Hinweise
  - H2: Verwandte Themen

## channels/matrix.md

- Route: /channels/matrix
- Überschriften:
  - H2: Installieren
  - H2: Einrichtung
  - H3: Interaktive Einrichtung
  - H3: Minimale Konfiguration
  - H3: Automatischer Beitritt
  - H3: Zielformate für die Allowlist
  - H3: Normalisierung der Konto-ID
  - H3: Zwischengespeicherte Zugangsdaten
  - H3: Umgebungsvariablen
  - H2: Konfigurationsbeispiel
  - H2: Streaming-Vorschauen
  - H2: Sprachnachrichten
  - H2: Genehmigungsmetadaten
  - H3: Selbst gehostete Push-Regeln für ruhige abgeschlossene Vorschauen
  - H2: Bot-zu-Bot-Räume
  - H2: Verschlüsselung und Verifizierung
  - H3: Verschlüsselung aktivieren
  - H3: Status- und Vertrauenssignale
  - H3: Dieses Gerät mit einem Wiederherstellungsschlüssel verifizieren
  - H3: Cross-Signing initialisieren oder reparieren
  - H3: Raum-Schlüssel-Backup
  - H3: Verifizierungen auflisten, anfordern und beantworten
  - H3: Hinweise zu mehreren Konten
  - H2: Profilverwaltung
  - H2: Threads
  - H3: Sitzungsrouting (sessionScope)
  - H3: Antwort-Threading (threadReplies)
  - H3: Thread-Vererbung und Slash-Befehle
  - H2: ACP-Konversationsbindungen
  - H3: Konfiguration der Thread-Bindung
  - H2: Reaktionen
  - H2: Verlaufskontext
  - H2: Kontextsichtbarkeit
  - H2: DM- und Raumrichtlinie
  - H2: Reparatur direkter Räume
  - H2: Exec-Genehmigungen
  - H2: Slash-Befehle
  - H2: Mehrere Konten
  - H2: Private/LAN-Homeserver
  - H2: Matrix-Datenverkehr über Proxy weiterleiten
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
  - H2: Chat-Modi
  - H2: Threading und Sitzungen
  - H2: Zugriffskontrolle (DMs)
  - H2: Kanäle (Gruppen)
  - H2: Ziele für ausgehende Zustellung
  - H2: DM-Kanal-Wiederholung
  - H2: Vorschau-Streaming
  - H2: Reaktionen (Nachrichtentool)
  - H2: Interaktive Schaltflächen (Nachrichtentool)
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
  - H2: Zugriffskontrolle (DMs + Gruppen)
  - H3: So funktioniert es
  - H3: Schritt 1: Azure Bot erstellen
  - H3: Schritt 2: Zugangsdaten abrufen
  - H3: Schritt 3: Messaging-Endpunkt konfigurieren
  - H3: Schritt 4: Teams-Kanal aktivieren
  - H3: Schritt 5: Teams-App-Manifest erstellen
  - H3: Schritt 6: OpenClaw konfigurieren
  - H3: Schritt 7: Gateway ausführen
  - H2: Föderierte Authentifizierung (Zertifikat plus verwaltete Identität)
  - H3: Option A: Zertifikatbasierte Authentifizierung
  - H3: Option B: Azure Managed Identity
  - H3: Einrichtung von AKS Workload Identity
  - H3: Vergleich der Authentifizierungstypen
  - H2: Lokale Entwicklung (Tunneling)
  - H2: Bot testen
  - H2: Umgebungsvariablen
  - H2: Aktion für Mitgliedsinformationen
  - H2: Verlaufskontext
  - H2: Aktuelle Teams-RSC-Berechtigungen (Manifest)
  - H2: Beispiel für ein Teams-Manifest (redigiert)
  - H3: Manifest-Hinweise (Pflichtfelder)
  - H3: Eine vorhandene App aktualisieren
  - H2: Fähigkeiten: nur RSC im Vergleich zu Graph
  - H3: Nur mit Teams RSC (App installiert, keine Graph-API-Berechtigungen)
  - H3: Mit Teams RSC + Microsoft Graph-Anwendungsberechtigungen
  - H3: RSC im Vergleich zur Graph API
  - H2: Graph-gestützte Medien + Verlauf (für Kanäle erforderlich)
  - H2: Bekannte Einschränkungen
  - H3: Webhook-Timeouts
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
  - H3: Speicherort für Dateien
  - H2: Umfragen (Adaptive Cards)
  - H2: Präsentationskarten
  - H2: Zielformate
  - H2: Proaktives Messaging
  - H2: Team- und Kanal-IDs (häufiger Stolperstein)
  - H2: Private Kanäle
  - H2: Fehlerbehebung
  - H3: Häufige Probleme
  - H3: Fehler beim Manifest-Upload
  - H3: RSC-Berechtigungen funktionieren nicht
  - H2: Referenzen
  - H2: Verwandte Themen

## channels/nextcloud-talk.md

- Route: /channels/nextcloud-talk
- Überschriften:
  - H2: Mitgeliefertes Plugin
  - H2: Schnelleinrichtung (Einsteiger)
  - H2: Hinweise
  - H2: Zugriffskontrolle (DMs)
  - H2: Räume (Gruppen)
  - H2: Fähigkeiten
  - H2: Konfigurationsreferenz (Nextcloud Talk)
  - H2: Verwandte Themen

## channels/nostr.md

- Route: /channels/nostr
- Überschriften:
  - H2: Mitgeliefertes Plugin
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
  - H2: Tests
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
  - H3: Einen Absender genehmigen
  - H3: Wiederverwendbare Absendergruppen
  - H3: Wo der Zustand gespeichert wird
  - H2: 2) Node-Geräte-Pairing (iOS/Android/macOS/headless Nodes)
  - H3: Pairing über Telegram (für iOS empfohlen)
  - H3: Ein Node-Gerät genehmigen
  - H3: Optionale automatische Genehmigung für vertrauenswürdige CIDR-Nodes
  - H3: Zustandsspeicher für Node-Pairing
  - H3: Hinweise
  - H2: Verwandte Dokumentation

## channels/qa-channel.md

- Route: /channels/qa-channel
- Überschriften:
  - H2: Was es macht
  - H2: Konfiguration
  - H2: Runner
  - H2: Verwandte Themen

## channels/qqbot.md

- Route: /channels/qqbot
- Überschriften:
  - H2: Installieren
  - H2: Einrichtung
  - H2: Konfigurieren
  - H3: Einrichtung mehrerer Konten
  - H3: Gruppenchats
  - H3: Sprache (STT / TTS)
  - H2: Zielformate
  - H2: Slash-Befehle
  - H2: Engine-Architektur
  - H2: QR-Code-Onboarding
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## channels/raft.md

- Route: /channels/raft
- Überschriften:
  - H2: Installieren
  - H2: Voraussetzungen
  - H2: Konfigurieren
  - H2: So funktioniert es
  - H2: Verifizieren
  - H2: Fehlerbehebung
  - H2: Referenzen

## channels/signal.md

- Route: /channels/signal
- Überschriften:
  - H2: Voraussetzungen
  - H2: Schnelleinrichtung (Einsteiger)
  - H2: Was es ist
  - H2: Konfigurationsschreibvorgänge
  - H2: Das Nummernmodell (wichtig)
  - H2: Einrichtungspfad A: vorhandenes Signal-Konto verknüpfen (QR)
  - H2: Einrichtungspfad B: dedizierte Bot-Nummer registrieren (SMS, Linux)
  - H2: Externer Daemon-Modus (httpUrl)
  - H2: Container-Modus (bbernhard/signal-cli-rest-api)
  - H2: Zugriffskontrolle (DMs + Gruppen)
  - H2: So funktioniert es (Verhalten)
  - H2: Medien + Limits
  - H2: Tippen + Lesebestätigungen
  - H2: Lebenszyklusstatus-Reaktionen
  - H2: Reaktionen (Nachrichtentool)
  - H2: Genehmigungsreaktionen
  - H2: Zustellziele (CLI/Cron)
  - H2: Aliase
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
  - H2: Transportabstimmung für Socket Mode
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
  - H2: Fallback für Tipp-Reaktion
  - H2: Medien, Chunking und Zustellung
  - H2: Befehle und Slash-Verhalten
  - H2: Interaktive Antworten
  - H3: Plugin-eigene Modal-Übermittlungen
  - H2: Native Genehmigungen in Slack
  - H2: Ereignisse und Betriebsverhalten
  - H2: Konfigurationsreferenz
  - H2: Fehlerbehebung
  - H2: Referenz für Attachment Vision
  - H3: Unterstützte Medientypen
  - H3: Eingehende Pipeline
  - H3: Vererbung von Anhängen des Thread-Roots
  - H3: Umgang mit mehreren Anhängen
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
  - H3: Private Nummer nur per Allowlist
  - H3: Messaging-Service-Absender
  - H3: Standardziel für ausgehende Nachrichten
  - H2: Zugriffskontrolle
  - H2: SMS senden
  - H2: Einrichtung verifizieren
  - H3: End-to-End-Test von macOS iMessage/SMS
  - H2: Webhook-Sicherheit
  - H2: Konfiguration mehrerer Konten
  - H2: Fehlerbehebung
  - H3: Twilio gibt 403 zurück oder OpenClaw lehnt den Webhook ab
  - H3: Keine Pairing-Anfrage erscheint
  - H3: Ausgehende Sendevorgänge schlagen fehl
  - H3: Nachrichten kommen an, aber der Agent antwortet nicht

## channels/synology-chat.md

- Route: /channels/synology-chat
- Überschriften:
  - H2: Mitgeliefertes Plugin
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
  - H2: Telegram-seitige Einstellungen
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
  - H2: Mitgeliefertes Plugin
  - H2: Einrichtung
  - H2: Private/LAN-Schiffe
  - H2: Gruppenkanäle
  - H2: Zugriffskontrolle
  - H2: Owner- und Genehmigungssystem
  - H2: Einstellungen für automatische Annahme
  - H2: Zustellziele (CLI/Cron)
  - H2: Mitgelieferte Skill
  - H2: Fähigkeiten
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
  - H2: Schnelle Einrichtung (für Einsteiger)
  - H2: Was es ist
  - H2: Einrichtung (detailliert)
  - H3: Zugangsdaten generieren
  - H3: Den Bot konfigurieren
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
  - H2: Limits
  - H2: Verwandt

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
  - H2: Installation (bei Bedarf)
  - H2: Schnelle Einrichtung
  - H2: Den aktuellen Anfragenden mit MeowCaller anrufen (experimentell)
  - H2: Bereitstellungsmuster
  - H2: Laufzeitmodell
  - H2: Genehmigungsabfragen
  - H2: Plugin-Hooks und Datenschutz
  - H2: Zugriffskontrolle und Aktivierung
  - H2: Konfigurierte ACP-Bindings
  - H2: Verhalten bei persönlicher Nummer und Selbst-Chat
  - H2: Nachrichtennormalisierung und Kontext
  - H2: Zustellung, Chunking und Medien
  - H2: Antwortzitate
  - H2: Reaktionsstufe
  - H2: Bestätigungsreaktionen
  - H2: Lebenszyklus-Statusreaktionen
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
  - H3: Merge-Text-Strategie abstimmen
  - H2: Häufige Befehle
  - H2: Fehlerbehebung
  - H3: Bot antwortet in Gruppenchats nicht
  - H3: Bot empfängt keine Nachrichten
  - H3: Bot sendet leere Antworten oder Fallback-Antworten
  - H3: App Secret offengelegt
  - H2: Erweiterte Konfiguration
  - H3: Mehrere Konten
  - H3: Nachrichtenlimits
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
  - H2: Schnelle Einrichtung (für Einsteiger)
  - H2: Was es ist
  - H2: Einrichtung (schneller Pfad)
  - H3: 1) Bot-Token erstellen (Zalo Bot Platform)
  - H3: 2) Token konfigurieren (env oder config)
  - H2: Funktionsweise (Verhalten)
  - H2: Limits
  - H2: Zugriffskontrolle (DMs)
  - H3: DM-Zugriff
  - H2: Zugriffskontrolle (Gruppen)
  - H2: Long-Polling vs. Webhook
  - H2: Unterstützte Nachrichtentypen
  - H2: Fähigkeiten
  - H2: Zustellungsziele (CLI/Cron)
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
  - H2: Schnelle Einrichtung (für Einsteiger)
  - H2: Was es ist
  - H2: Benennung
  - H2: IDs finden (Verzeichnis)
  - H2: Limits
  - H2: Zugriffskontrolle (DMs)
  - H2: Gruppenzugriff (optional)
  - H3: Gruppen-Mention-Gating
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
  - H2: Scope und Routing
  - H2: Weiterleitung von ClawSweeper-Aktivitäten
  - H2: Manuelle Dispatches
  - H2: Runner
  - H2: Budget für Runner-Registrierung
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
  - H2: Installations-Smoke-Test
  - H2: Lokales Docker-E2E
  - H3: Abstimmungsoptionen
  - H3: Wiederverwendbarer Live/E2E-Workflow
  - H3: Release-Pfad-Chunks
  - H2: Plugin-Prerelease
  - H2: QA-Lab
  - H2: CodeQL
  - H3: Sicherheitskategorien
  - H3: Plattformspezifische Sicherheits-Shards
  - H3: Kritische Qualitätskategorien
  - H2: Wartungsworkflows
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: Doppelte PRs nach dem Merge
  - H2: Lokale Prüf-Gates und Changed-Routing
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
  - H1: Veröffentlichung auf ClawHub
  - H2: Eigentümer
  - H2: Skills
  - H2: Plugins
  - H2: Release-Ablauf
  - H2: FAQ
  - H3: Paket-Scope muss dem ausgewählten Eigentümer entsprechen

## cli/acp.md

- Route: /cli/acp
- Überschriften:
  - H2: Was dies nicht ist
  - H2: Kompatibilitätsmatrix
  - H2: Bekannte Einschränkungen
  - H2: Verwendung
  - H2: ACP-Client (Debug)
  - H2: Protokoll-Smoke-Testing
  - H2: So verwenden Sie dies
  - H2: Agents auswählen
  - H2: Verwendung aus acpx (Codex, Claude, andere ACP-Clients)
  - H2: Einrichtung des Zed-Editors
  - H2: Sitzungszuordnung
  - H2: Optionen
  - H3: ACP-Client-Optionen
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
  - H2: Routing-Bindings
  - H3: --bind-Format
  - H3: Verhalten des Binding-Scopes
  - H2: Befehlsoberfläche
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
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
  - H2: Beispiel für „Nie nachfragen“ / YOLO
  - H2: Allowlist-Helfer
  - H2: Häufige Optionen
  - H2: Hinweise
  - H2: Verwandt

## cli/attach.md

- Route: /cli/attach
- Überschriften: keine

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
  - H2: Zustand und Speicher
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
  - H2: Anmeldung und Abmeldung (interaktiv)
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
  - H3: config schema
  - H3: Pfade
  - H2: Werte
  - H2: config set-Modi
  - H2: config patch
  - H2: Provider-Builder-Flags
  - H2: Testlauf
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
  - H2: Was Crestodian zeigt
  - H2: Beispiele
  - H2: Sicherer Start
  - H2: Betrieb und Genehmigung
  - H2: Setup-Bootstrap
  - H2: Modellgestützter Planer
  - H2: Zu einem Agent wechseln
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
  - H3: Vorrang des isolierten Cron-Modells
  - H3: Schnellmodus
  - H3: Wiederholungen beim Live-Modellwechsel
  - H2: Ausführungsausgabe und Ablehnungen
  - H3: Unterdrückung veralteter Bestätigungen
  - H3: Stille Token-Unterdrückung
  - H3: Strukturierte Ablehnungen
  - H2: Aufbewahrung
  - H2: Ältere Jobs migrieren
  - H2: Häufige Änderungen
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
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Erstgenehmigung für Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
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
  - H2: Ergebnisse mit message send verwenden
  - H2: ID-Formate (nach Kanal)
  - H2: Selbst („me“)
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
  - H2: Strukturierte Zustandsprüfungen
  - H2: Prüfungsauswahl
  - H2: Post-Upgrade-Modus
  - H2: macOS: launchctl-env-Overrides
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
  - H3: gateway call &lt;method&gt;
  - H2: Gateway-Dienst verwalten
  - H3: Mit einem Wrapper installieren
  - H2: Gateways erkennen (Bonjour)
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
  - H2: Hook-Eignung prüfen
  - H2: Einen Hook aktivieren
  - H2: Einen Hook deaktivieren
  - H2: Hinweise
  - H2: Hook-Pakete installieren
  - H2: Hook-Pakete aktualisieren
  - H2: Gebündelte Hooks
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Verwandt

## cli/index.md

- Route: /cli
- Überschriften:
  - H2: Befehlsseiten
  - H2: Globale Flags
  - H2: Ausgabemodi
  - H2: Befehlsbaum
  - H2: Chat-Slash-Befehle
  - H2: Nutzungsverfolgung
  - H2: Verwandt

## cli/infer.md

- Route: /cli/infer
- Überschriften:
  - H2: infer in ein Skill umwandeln
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
  - H2: Embedding
  - H2: JSON-Ausgabe
  - H2: Häufige Fallstricke
  - H2: Hinweise
  - H2: Verwandt

## cli/logs.md

- Route: /cli/logs
- Überschriften:
  - H1: openclaw logs
  - H2: Optionen
  - H2: Gemeinsame Gateway-RPC-Optionen
  - H2: Beispiele
  - H2: Hinweise
  - H2: Verwandt

## cli/mcp.md

- Route: /cli/mcp
- Überschriften:
  - H2: Den richtigen MCP-Pfad wählen
  - H2: OpenClaw als MCP-Server
  - H3: Wann serve verwendet werden sollte
  - H3: So funktioniert es
  - H3: Einen Client-Modus wählen
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
  - H3: Streambarer HTTP-Transport
  - H2: Control UI
  - H2: Aktuelle Einschränkungen
  - H2: Verwandt

## cli/memory.md

- Route: /cli/memory
- Überschriften:
  - H1: openclaw memory
  - H2: Beispiele
  - H2: Optionen
  - H2: Dreaming
  - H2: Verwandt

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
  - H3: Rollen / Kanäle / Mitglieder / Voice
  - H3: Ereignisse
  - H3: Moderation (Discord)
  - H3: Broadcast
  - H2: Beispiele
  - H2: Verwandt

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
  - H3: Nur-Archiv-Status
  - H3: Nach dem Anwenden
  - H2: Plugin-Vertrag
  - H2: Onboarding-Integration
  - H2: Verwandt

## cli/models.md

- Route: /cli/models
- Überschriften:
  - H1: openclaw models
  - H2: Häufige Befehle
  - H3: Modelle scannen
  - H3: Modellstatus
  - H2: Aliase + Fallbacks
  - H2: Auth-Profile
  - H2: Verwandt

## cli/node.md

- Route: /cli/node
- Überschriften:
  - H1: openclaw node
  - H2: Warum einen Node-Host verwenden?
  - H2: Browser-Proxy (Zero-Config)
  - H2: Ausführen (Vordergrund)
  - H2: Gateway-Auth für Node-Host
  - H2: Dienst (Hintergrund)
  - H2: Pairing
  - H2: Exec-Genehmigungen
  - H2: Verwandt

## cli/nodes.md

- Route: /cli/nodes
- Überschriften:
  - H1: openclaw nodes
  - H2: Häufige Befehle
  - H2: Aufrufen
  - H2: Verwandt

## cli/onboard.md

- Route: /cli/onboard
- Überschriften:
  - H1: openclaw onboard
  - H2: Verwandte Leitfäden
  - H2: Beispiele
  - H2: Gebietsschema
  - H3: Nicht interaktive Z.AI-Endpunktauswahl
  - H2: Zusätzliche nicht interaktive Flags
  - H2: Ablaufhinweise
  - H2: Häufige Folge-Befehle

## cli/pairing.md

- Route: /cli/pairing
- Überschriften:
  - H1: openclaw pairing
  - H2: Befehle
  - H2: pairing list
  - H2: pairing approve
  - H2: Hinweise
  - H2: Verwandt

## cli/path.md

- Route: /cli/path
- Überschriften:
  - H1: openclaw path
  - H2: Warum es verwenden
  - H2: Wie es verwendet wird
  - H2: So funktioniert es
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
  - H2: Exit-Codes
  - H2: Ausgabemodus
  - H2: Hinweise
  - H2: Verwandt

## cli/plugins.md

- Route: /cli/plugins
- Überschriften:
  - H2: Befehle
  - H3: Autor
  - H3: Provider-Scaffold
  - H3: Installieren
  - H4: Marketplace-Kurzform
  - H3: Auflisten
  - H3: Plugin-Index
  - H3: Deinstallieren
  - H3: Aktualisieren
  - H3: Prüfen
  - H3: Doctor
  - H3: Registry
  - H3: Marketplace
  - H2: Verwandt

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
  - H4: Ingress und Kanalzugriff
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
  - H2: Reparatur
  - H2: Exit-Codes
  - H2: Verwandt

## cli/proxy.md

- Route: /cli/proxy
- Überschriften:
  - H1: openclaw proxy
  - H2: Befehle
  - H2: Validieren
  - H2: Abfrage-Presets
  - H2: Hinweise
  - H2: Verwandt

## cli/qr.md

- Route: /cli/qr
- Überschriften:
  - H1: openclaw qr
  - H2: Nutzung
  - H2: Optionen
  - H2: Hinweise
  - H2: Verwandt

## cli/reset.md

- Route: /cli/reset
- Überschriften:
  - H1: openclaw reset
  - H2: Verwandt

## cli/sandbox.md

- Route: /cli/sandbox
- Überschriften:
  - H2: Überblick
  - H2: Befehle
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Anwendungsfälle
  - H3: Nach dem Aktualisieren eines Docker-Images
  - H3: Nach dem Ändern der Sandbox-Konfiguration
  - H3: Nach dem Ändern des SSH-Ziels oder SSH-Auth-Materials
  - H3: Nach dem Ändern von OpenShell-Quelle, Richtlinie oder Modus
  - H3: Nach dem Ändern von setupCommand
  - H3: Nur für einen bestimmten Agent
  - H2: Warum dies erforderlich ist
  - H2: Registry-Migration
  - H2: Konfiguration
  - H2: Verwandt

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
  - H2: Verwandt

## cli/security.md

- Route: /cli/security
- Überschriften:
  - H1: openclaw security
  - H2: Audit
  - H2: JSON-Ausgabe
  - H2: Was --fix ändert
  - H2: Verwandt

## cli/sessions.md

- Route: /cli/sessions
- Überschriften:
  - H1: openclaw sessions
  - H2: Cleanup-Wartung
  - H2: Eine Sitzung verdichten
  - H3: sessions.compact-RPC
  - H2: Verwandt

## cli/setup.md

- Route: /cli/setup
- Überschriften:
  - H1: openclaw setup
  - H2: Optionen
  - H3: Baseline-Modus
  - H2: Beispiele
  - H2: Hinweise
  - H2: Verwandt

## cli/skills.md

- Route: /cli/skills
- Überschriften:
  - H1: openclaw skills
  - H2: Befehle
  - H2: Skill Workshop
  - H2: Verwandt

## cli/status.md

- Route: /cli/status
- Überschriften:
  - H2: Verwandt

## cli/system.md

- Route: /cli/system
- Überschriften:
  - H1: openclaw system
  - H2: Häufige Befehle
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Hinweise
  - H2: Verwandt

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
  - H2: Verwandt

## cli/transcripts.md

- Route: /cli/transcripts
- Überschriften:
  - H1: openclaw transcripts
  - H2: Befehle
  - H2: Ausgabe
  - H2: Viele Meetings pro Tag
  - H2: Fehlende Zusammenfassungen
  - H2: Konfiguration

## cli/tui.md

- Route: /cli/tui
- Überschriften:
  - H1: openclaw tui
  - H2: Optionen
  - H2: Beispiele
  - H2: Config-Reparaturschleife
  - H2: Verwandt

## cli/uninstall.md

- Route: /cli/uninstall
- Überschriften:
  - H1: openclaw uninstall
  - H2: Verwandt

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
  - H3: Antwortform der Steuerungsebene
  - H2: Git-Checkout-Ablauf
  - H3: Kanalauswahl
  - H3: Aktualisierungsschritte
  - H2: --update-Kurzform
  - H2: Verwandt

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
  - H2: Verwandt

## cli/webhooks.md

- Route: /cli/webhooks
- Überschriften:
  - H1: openclaw webhooks
  - H2: Unterbefehle
  - H2: webhooks gmail setup
  - H3: Erforderlich
  - H3: Pub/Sub-Optionen
  - H3: OpenClaw-Zustelloptionen
  - H3: gog watch serve-Optionen
  - H3: Tailscale-Bereitstellung
  - H3: Ausgabe
  - H2: webhooks gmail run
  - H2: End-to-End-Ablauf
  - H2: Verwandt

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
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Praktische Nutzungshinweise
  - H2: Konfigurationsverknüpfungen
  - H2: Verwandt

## cli/workboard.md

- Route: /cli/workboard
- Überschriften:
  - H2: Nutzung
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Parität von Slash-Befehlen
  - H2: Berechtigungen
  - H2: Fehlerbehebung
  - H3: Es erscheinen keine Karten
  - H3: Dispatch meldet Data-Only
  - H3: Dispatch startet nichts
  - H2: Verwandt

## concepts/active-memory.md

- Route: /concepts/active-memory
- Überschriften:
  - H2: Schnellstart
  - H2: Geschwindigkeitsempfehlungen
  - H3: Cerebras-Einrichtung
  - H2: So sehen Sie es
  - H2: Sitzungsumschaltung
  - H2: Wann es ausgeführt wird
  - H2: Sitzungstypen
  - H2: Wo es ausgeführt wird
  - H2: Warum es verwenden
  - H2: So funktioniert es
  - H2: Abfragemodi
  - H2: Prompt-Stile
  - H2: Modell-Fallback-Richtlinie
  - H2: Memory-Tools
  - H3: Integrierter memory-core
  - H3: LanceDB-Memory
  - H3: Lossless Claw
  - H2: Erweiterte Escape-Hatches
  - H2: Transkriptpersistenz
  - H2: Konfiguration
  - H2: Empfohlene Einrichtung
  - H3: Cold-Start-Kulanz
  - H2: Debugging
  - H2: Häufige Probleme
  - H2: Verwandte Seiten

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- Überschriften:
  - H2: Einstiegspunkte
  - H2: So funktioniert es (allgemein)
  - H2: Warteschlangen + Nebenläufigkeit
  - H2: Sitzungs- + Arbeitsbereichsvorbereitung
  - H2: Prompt-Zusammenstellung + System-Prompt
  - H2: Hook-Punkte (wo Sie eingreifen können)
  - H3: Interne Hooks (Gateway-Hooks)
  - H3: Plugin-Hooks (Agent- + Gateway-Lebenszyklus)
  - H2: Streaming + Teilantworten
  - H2: Tool-Ausführung + Messaging-Tools
  - H2: Antwortformung + Unterdrückung
  - H2: Compaction + Wiederholungen
  - H2: Ereignisstreams (heute)
  - H2: Chat-Kanalbehandlung
  - H2: Timeouts
  - H2: Wo Dinge frühzeitig enden können
  - H2: Verwandt

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- Überschriften:
  - H2: Codex-Oberflächen
  - H2: Runtime-Zuständigkeit
  - H2: Runtime-Auswahl
  - H2: GitHub Copilot-Agent-Runtime
  - H2: Kompatibilitätsvertrag
  - H2: Statuslabels
  - H2: Verwandt

## concepts/agent-workspace.md

- Route: /concepts/agent-workspace
- Überschriften:
  - H2: Standardspeicherort
  - H2: Zusätzliche Workspace-Ordner
  - H2: Dateikarte des Workspace
  - H2: Was NICHT im Workspace ist
  - H2: Git-Backup (empfohlen, privat)
  - H2: Keine Secrets committen
  - H2: Den Workspace auf einen neuen Rechner verschieben
  - H2: Erweiterte Hinweise
  - H2: Verwandt

## concepts/agent.md

- Route: /concepts/agent
- Überschriften:
  - H2: Workspace (erforderlich)
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
  - H3: Nodes (macOS / iOS / Android / Headless)
  - H3: WebChat
  - H2: Verbindungslebenszyklus (einzelner Client)
  - H2: Wire-Protokoll (Zusammenfassung)
  - H2: Pairing + lokales Vertrauen
  - H2: Protokolltypisierung und Codegenerierung
  - H2: Remote-Zugriff
  - H2: Betriebsübersicht
  - H2: Invarianten
  - H2: Verwandt

## concepts/channel-docking.md

- Route: /concepts/channel-docking
- Überschriften:
  - H2: Beispiel
  - H2: Warum verwenden
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
  - H2: Umfang
  - H2: Verpflichtungen vs. Erinnerungen
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
  - H3: Beibehaltung von Kennungen
  - H3: Byte-Schutz für aktives Transkript
  - H3: Nachfolge-Transkripte
  - H3: Compaction-Hinweise
  - H3: Memory-Flush
  - H2: Austauschbare Compaction-Provider
  - H2: Compaction vs. Pruning
  - H2: Fehlerbehebung
  - H2: Verwandt

## concepts/context-engine.md

- Route: /concepts/context-engine
- Überschriften:
  - H2: Schnellstart
  - H2: Funktionsweise
  - H3: Lebenszyklus von Subagenten (optional)
  - H3: Ergänzung des System-Prompts
  - H2: Die Legacy-Engine
  - H2: Plugin-Engines
  - H3: Die ContextEngine-Schnittstelle
  - H3: Runtime-Einstellungen
  - H3: Host-Anforderungen
  - H3: Fehlerisolation
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
  - H2: Injizierte Workspace-Dateien (Projektkontext)
  - H2: Skills: injiziert vs. bei Bedarf geladen
  - H2: Tools: Es gibt zwei Kosten
  - H2: Befehle, Direktiven und „Inline-Shortcuts“
  - H2: Sitzungen, Compaction und Pruning (was bestehen bleibt)
  - H2: Was /context tatsächlich meldet
  - H2: Verwandt

## concepts/delegate-architecture.md

- Route: /concepts/delegate-architecture
- Überschriften:
  - H2: Was ist ein Delegat?
  - H2: Warum Delegaten?
  - H2: Fähigkeitsstufen
  - H3: Stufe 1: Schreibgeschützt + Entwurf
  - H3: Stufe 2: Im Auftrag senden
  - H3: Stufe 3: Proaktiv
  - H2: Voraussetzungen: Isolation und Härtung
  - H3: Harte Sperren (nicht verhandelbar)
  - H3: Tool-Einschränkungen
  - H3: Sandbox-Isolation
  - H3: Audit-Protokoll
  - H2: Einen Delegaten einrichten
  - H3: 1. Den Delegaten-Agenten erstellen
  - H3: 2. Delegierung beim Identitätsprovider konfigurieren
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Den Delegaten an Kanäle binden
  - H3: 4. Zugangsdaten zum Delegaten-Agenten hinzufügen
  - H2: Beispiel: Organisationsassistent
  - H2: Skalierungsmuster
  - H2: Verwandt

## concepts/dreaming.md

- Route: /concepts/dreaming
- Überschriften:
  - H2: Was Dreaming schreibt
  - H2: Phasenmodell
  - H2: Aufnahme von Sitzungstranskripten
  - H2: Traumtagebuch
  - H2: Tiefgehende Ranking-Signale
  - H2: Abdeckung von QA-Schattenversuchsberichten
  - H2: Zeitplanung
  - H2: Schnellstart
  - H2: Slash-Befehl
  - H2: CLI-Workflow
  - H2: Wichtige Standardeinstellungen
  - H2: Dreams-UI
  - H2: Dreaming wird nie ausgeführt: Status zeigt blockiert
  - H2: Verwandt

## concepts/experimental-features.md

- Route: /concepts/experimental-features
- Überschriften:
  - H2: Derzeit dokumentierte Flags
  - H2: Lean-Modus für lokale Modelle
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
  - H2: Hydratisierungsmodi
  - H2: Timing-Interpretation
  - H2: Evidenz-Checkliste
  - H2: Fehlerbehandlung
  - H2: Verwandt

## concepts/mantis.md

- Route: /concepts/mantis
- Überschriften:
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Zuständigkeit
  - H2: Befehlsform
  - H2: Lauflebenszyklus
  - H2: Discord-MVP
  - H2: Vorhandene QA-Bausteine
  - H2: Evidenzmodell
  - H2: Browser und VNC
  - H2: Maschinen
  - H2: Secrets
  - H2: GitHub-Artefakte und PR-Kommentare
  - H2: Private Bereitstellungshinweise
  - H2: Ein Szenario hinzufügen
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
  - H2: Einen Kanal-Formatter hinzufügen oder aktualisieren
  - H2: Häufige Stolperfallen
  - H2: Verwandt

## concepts/memory-builtin.md

- Route: /concepts/memory-builtin
- Überschriften:
  - H2: Was es bereitstellt
  - H2: Einstieg
  - H2: Unterstützte Embedding-Provider
  - H2: Wie die Indexierung funktioniert
  - H2: Wann verwenden
  - H2: Fehlerbehebung
  - H2: Konfiguration
  - H2: Verwandt

## concepts/memory-honcho.md

- Route: /concepts/memory-honcho
- Überschriften:
  - H2: Was es bereitstellt
  - H2: Verfügbare Tools
  - H2: Einstieg
  - H2: Konfiguration
  - H2: Vorhandenes Memory migrieren
  - H2: Funktionsweise
  - H2: Honcho vs. integriertes Memory
  - H2: CLI-Befehle
  - H2: Weiterführende Lektüre
  - H2: Verwandt

## concepts/memory-qmd.md

- Route: /concepts/memory-qmd
- Überschriften:
  - H2: Was es gegenüber dem integrierten Memory ergänzt
  - H2: Einstieg
  - H3: Voraussetzungen
  - H3: Aktivieren
  - H2: Wie der Sidecar funktioniert
  - H2: Suchleistung und Kompatibilität
  - H2: Modell-Overrides
  - H2: Zusätzliche Pfade indexieren
  - H2: Sitzungstranskripte indexieren
  - H2: Suchumfang
  - H2: Zitationen
  - H2: Wann verwenden
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
  - H3: Zeitlicher Verfall
  - H3: MMR (Diversität)
  - H3: Beides aktivieren
  - H2: Multimodales Memory
  - H2: Sitzungsspeichersuche
  - H2: Fehlerbehebung
  - H2: Weiterführende Lektüre
  - H2: Verwandt

## concepts/memory.md

- Route: /concepts/memory
- Überschriften:
  - H2: Funktionsweise
  - H2: Was wohin gehört
  - H2: Aktionssensitive Erinnerungen
  - H2: Abgeleitete Verpflichtungen
  - H2: Memory-Tools
  - H2: Begleitendes Plugin für Memory-Wiki
  - H2: Memory-Suche
  - H2: Memory-Backends
  - H2: Knowledge-Wiki-Ebene
  - H2: Automatischer Memory-Flush
  - H2: Dreaming
  - H2: Fundiertes Backfill und Live-Promotion
  - H2: CLI
  - H2: Weiterführende Lektüre
  - H2: Verwandt

## concepts/message-lifecycle-refactor.md

- Route: /concepts/message-lifecycle-refactor
- Überschriften:
  - H2: Probleme
  - H2: Ziele
  - H2: Nicht-Ziele
  - H2: Referenzmodell
  - H2: Kernmodell
  - H2: Nachrichtenbegriffe
  - H3: Nachricht
  - H3: Ziel
  - H3: Beziehung
  - H3: Ursprung
  - H3: Empfangsbestätigung
  - H2: Empfangskontext
  - H2: Sendekontext
  - H2: Live-Kontext
  - H2: Adapteroberfläche
  - H2: Reduzierung des öffentlichen SDK
  - H2: Beziehung zum Kanaleingang
  - H2: Kompatibilitätsleitplanken
  - H2: Interne Speicherung
  - H2: Fehlerklassen
  - H2: Kanalzuordnung
  - H2: Migrationsplan
  - H3: Phase 1: Interne Nachrichtendomäne
  - H3: Phase 2: Dauerhafter Sendekern
  - H3: Phase 3: Bridge für Kanaleingang
  - H3: Phase 4: Bridge für vorbereiteten Dispatcher
  - H3: Phase 5: Vereinheitlichter Live-Lebenszyklus
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
  - H2: Nachrichtenfluss (allgemein)
  - H2: Deduplizierung eingehender Nachrichten
  - H2: Debouncing eingehender Nachrichten
  - H2: Sitzungen und Geräte
  - H2: Metadaten von Tool-Ergebnissen
  - H2: Eingehende Inhalte und Verlaufskontext
  - H2: Warteschlangen und Folgeaktionen
  - H2: Zuständigkeit für Kanalläufe
  - H2: Streaming, Chunking und Batching
  - H2: Sichtbarkeit von Reasoning und Tokens
  - H2: Präfixe, Threading und Antworten
  - H2: Stille Antworten
  - H2: Verwandt

## concepts/model-failover.md

- Route: /concepts/model-failover
- Überschriften:
  - H2: Runtime-Ablauf
  - H2: Richtlinie zur Auswahlquelle
  - H2: Skip-Cache bei Authentifizierungsfehlern
  - H2: Für Benutzer sichtbare Fallback-Hinweise
  - H2: Authentifizierungsspeicher (Schlüssel + OAuth)
  - H2: Profil-IDs
  - H2: Rotationsreihenfolge
  - H3: Sitzungsbindung (cachefreundlich)
  - H3: OpenAI-Codex-Abonnement plus API-Schlüssel-Backup
  - H2: Cooldowns
  - H2: Abrechnung deaktiviert
  - H2: Modell-Fallback
  - H3: Regeln für Kandidatenketten
  - H3: Welche Fehler Fallback auslösen
  - H3: Cooldown-Skip vs. Probe-Verhalten
  - H2: Sitzungs-Overrides und Live-Modellwechsel
  - H2: Observability und Fehlerzusammenfassungen
  - H2: Verwandte Konfiguration

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
  - H3: Andere gehostete Optionen im Abonnementstil
  - H3: OpenCode
  - H3: Google Gemini (API-Schlüssel)
  - H3: Google Vertex und Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Andere gebündelte Provider-Plugins
  - H4: Wissenswerte Besonderheiten
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
  - H2: Wie die Modellauswahl funktioniert
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
  - H2: Routing-Regeln (wie Nachrichten einen Agenten auswählen)
  - H2: Mehrere Konten / Telefonnummern
  - H2: Konzepte
  - H2: Plattformbeispiele
  - H2: Häufige Muster
  - H2: Sandbox- und Tool-Konfiguration pro Agent
  - H2: Verwandt

## concepts/oauth.md

- Route: /concepts/oauth
- Überschriften:
  - H2: Die Token-Senke (warum sie existiert)
  - H2: Speicherung (wo Tokens liegen)
  - H2: Kompatibilität mit Anthropic-Legacy-Tokens
  - H2: Anthropic-Claude-CLI-Migration
  - H2: OAuth-Austausch (wie die Anmeldung funktioniert)
  - H3: Anthropic-Setup-Token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Aktualisierung + Ablauf
  - H2: Mehrere Konten (Profile) + Routing
  - H3: 1) Bevorzugt: separate Agenten
  - H3: 2) Erweitert: mehrere Profile in einem Agenten
  - H2: Verwandt

## concepts/parallel-specialist-lanes.md

- Route: /concepts/parallel-specialist-lanes
- Überschriften:
  - H2: Grundprinzipien
  - H2: Empfohlene Einführung
  - H3: Phase 1: Lane-Verträge + schwere Hintergrundarbeit
  - H3: Phase 2: Prioritäts- und Nebenläufigkeitssteuerung
  - H3: Phase 3: Koordinator / Traffic-Controller
  - H2: Minimale Lane-Vertragsvorlage
  - H2: Verwandt

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
  - H2: Producer (woher Präsenz kommt)
  - H3: 1) Gateway-Selbsteintrag
  - H3: 2) WebSocket-Verbindung
  - H4: Warum einmalige CLI-Befehle nicht angezeigt werden
  - H3: 3) system-event-Beacons
  - H3: 4) Node-Verbindungen (Rolle: node)
  - H2: Regeln zum Zusammenführen + Deduplizieren (warum instanceId wichtig ist)
  - H2: TTL und begrenzte Größe
  - H2: Hinweis zu Remote/Tunnel (Loopback-IPs)
  - H2: Consumer
  - H3: Tab „macOS-Instanzen“
  - H2: Debugging-Tipps
  - H2: Verwandt

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
  - H2: Verwandt

## concepts/qa-e2e-automation.md

- Route: /concepts/qa-e2e-automation
- Überschriften:
  - H2: Befehlsoberfläche
  - H2: Operator-Ablauf
  - H2: Abdeckung für Live-Transporte
  - H2: QA-Referenz für Telegram, Discord, Slack und WhatsApp
  - H3: Gemeinsame CLI-Flags
  - H3: Telegram-QA
  - H3: Discord-QA
  - H3: Slack-QA
  - H4: Slack-Workspace einrichten
  - H3: WhatsApp-QA
  - H3: Convex-Anmeldeinformationspool
  - H2: Repository-gestützte Seeds
  - H2: Provider-Mock-Lanes
  - H2: Transportadapter
  - H3: Kanal hinzufügen
  - H3: Namen von Szenario-Helfern
  - H2: Berichterstellung
  - H2: Verwandte Dokumentation

## concepts/qa-matrix.md

- Route: /concepts/qa-matrix
- Überschriften:
  - H2: Schnellstart
  - H2: Was die Lane tut
  - H2: CLI
  - H3: Gemeinsame Flags
  - H3: Provider-Flags
  - H2: Profile
  - H2: Szenarien
  - H2: Umgebungsvariablen
  - H2: Ausgabeartefakte
  - H2: Triage-Tipps
  - H2: Live-Transport-Vertrag
  - H2: Verwandt

## concepts/queue-steering.md

- Route: /concepts/queue-steering
- Überschriften:
  - H2: Runtime-Grenze
  - H2: Modi
  - H2: Burst-Beispiel
  - H2: Geltungsbereich
  - H2: Debounce
  - H2: Verwandt

## concepts/queue.md

- Route: /concepts/queue
- Überschriften:
  - H2: Warum
  - H2: Funktionsweise
  - H2: Standardwerte
  - H2: Queue-Modi
  - H2: Queue-Optionen
  - H2: Steuern und Streaming
  - H2: Rangfolge
  - H2: Sitzungsbezogene Überschreibungen
  - H2: Geltungsbereich und Garantien
  - H2: Fehlerbehebung
  - H2: Verwandt

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
  - H2: Verwandt

## concepts/session-pruning.md

- Route: /concepts/session-pruning
- Überschriften:
  - H2: Warum es wichtig ist
  - H2: Funktionsweise
  - H2: Legacy-Bildbereinigung
  - H2: Intelligente Standardwerte
  - H2: Aktivieren oder deaktivieren
  - H2: Pruning vs. Compaction
  - H2: Weiterführende Informationen
  - H2: Verwandt

## concepts/session-tool.md

- Route: /concepts/session-tool
- Überschriften:
  - H2: Verfügbare Tools
  - H2: Sitzungen auflisten und lesen
  - H2: Sitzungsübergreifende Nachrichten senden
  - H2: Status- und Orchestrierungshelfer
  - H2: Sub-Agenten starten
  - H2: Sichtbarkeit
  - H2: Weiterführende Informationen
  - H2: Verwandt

## concepts/session.md

- Route: /concepts/session
- Überschriften:
  - H2: Wie Nachrichten geroutet werden
  - H2: DM-Isolation
  - H3: Dock-verknüpfte Kanäle
  - H2: Sitzungslebenszyklus
  - H2: Wo Zustand liegt
  - H2: Sitzungswartung
  - H2: Sitzungen inspizieren
  - H2: Weiterführende Informationen
  - H2: Verwandt

## concepts/soul.md

- Route: /concepts/soul
- Überschriften:
  - H2: Was in SOUL.md gehört
  - H2: Warum das funktioniert
  - H2: Der Molty-Prompt
  - H2: Wie gut aussieht
  - H2: Eine Warnung
  - H2: Verwandt

## concepts/streaming.md

- Route: /concepts/streaming
- Überschriften:
  - H2: Block-Streaming (Kanalnachrichten)
  - H3: Medienzustellung mit Block-Streaming
  - H2: Chunking-Algorithmus (untere/obere Grenzen)
  - H2: Zusammenführen (gestreamte Blöcke zusammenführen)
  - H2: Menschlich wirkende Pausen zwischen Blöcken
  - H2: „Chunks oder alles streamen“
  - H2: Vorschau-Streaming-Modi
  - H3: Kanalzuordnung
  - H3: Runtime-Verhalten
  - H3: Vorschauaktualisierungen für Tool-Fortschritt
  - H3: Commentary-Fortschritts-Lane
  - H2: Verwandt

## concepts/system-prompt.md

- Route: /concepts/system-prompt
- Überschriften:
  - H2: Struktur
  - H2: Prompt-Modi
  - H2: Prompt-Snapshots
  - H2: Workspace-Bootstrap-Injektion
  - H2: Zeitbehandlung
  - H2: Skills
  - H2: Dokumentation
  - H2: Verwandt

## concepts/timezone.md

- Route: /concepts/timezone
- Überschriften:
  - H2: Drei Zeitzonen-Oberflächen
  - H2: Benutzerzeitzone festlegen
  - H2: Wann überschrieben werden sollte
  - H2: Verwandt

## concepts/typebox.md

- Route: /concepts/typebox
- Überschriften:
  - H2: Mentales Modell (30 Sekunden)
  - H2: Wo die Schemas liegen
  - H2: Aktuelle Pipeline
  - H2: Wie die Schemas zur Laufzeit verwendet werden
  - H2: Beispiel-Frames
  - H2: Minimaler Client (Node.js)
  - H2: Durchgearbeitetes Beispiel: eine Methode Ende-zu-Ende hinzufügen
  - H2: Swift-Codegen-Verhalten
  - H2: Versionierung + Kompatibilität
  - H2: Schema-Muster und Konventionen
  - H2: Live-Schema-JSON
  - H2: Wenn Sie Schemas ändern
  - H2: Verwandt

## concepts/typing-indicators.md

- Route: /concepts/typing-indicators
- Überschriften:
  - H2: Standardwerte
  - H2: Modi
  - H2: Konfiguration
  - H2: Hinweise
  - H2: Verwandt

## concepts/usage-tracking.md

- Route: /concepts/usage-tracking
- Überschriften:
  - H2: Was es ist
  - H2: Wo es angezeigt wird
  - H2: Standardmodus für Nutzungs-Footer
  - H3: Drei verschiedene Sitzungszustände
  - H3: Rangfolge
  - H3: Zurücksetzen vs. Abschalten
  - H3: Umschaltverhalten
  - H3: Konfiguration
  - H2: Benutzerdefinierter vollständiger /usage-Footer
  - H3: Form
  - H3: Vertragspfade
  - H3: Verben
  - H3: Teilformen
  - H3: Beispiel
  - H2: Provider + Anmeldeinformationen
  - H2: Verwandt

## date-time.md

- Route: /date-time
- Überschriften:
  - H2: Nachrichtenumschläge (standardmäßig lokal)
  - H3: Beispiele
  - H2: System-Prompt: aktuelles Datum und aktuelle Uhrzeit
  - H2: Systemereigniszeilen (standardmäßig lokal)
  - H3: Benutzerzeitzone + Format konfigurieren
  - H2: Zeitformaterkennung (automatisch)
  - H2: Tool-Payloads + Connectors (rohe Provider-Zeit + normalisierte Felder)
  - H2: Verwandte Dokumentation

## debug/node-issue.md

- Route: /debug/node-issue
- Überschriften:
  - H1: Node + tsx-Absturz „\\name is not a function“
  - H2: Zusammenfassung
  - H2: Umgebung
  - H2: Repro (nur Node)
  - H2: Minimale Repro im Repository
  - H2: Node-Version prüfen
  - H2: Hinweise / Hypothese
  - H2: Regressionshistorie
  - H2: Workarounds
  - H2: Referenzen
  - H2: Nächste Schritte
  - H2: Verwandt

## diagnostics/flags.md

- Route: /diagnostics/flags
- Überschriften:
  - H2: Funktionsweise
  - H2: Per Konfiguration aktivieren
  - H2: Env-Überschreibung (einmalig)
  - H2: Profiling-Flags
  - H2: Timeline-Artefakte
  - H2: Wo Logs gespeichert werden
  - H2: Logs extrahieren
  - H2: Hinweise
  - H2: Verwandt

## gateway/authentication.md

- Route: /gateway/authentication
- Überschriften:
  - H2: Empfohlene Einrichtung (API-Schlüssel, beliebiger Provider)
  - H2: Anthropic: Claude CLI und Token-Kompatibilität
  - H2: Anthropic-Hinweis
  - H2: Modell-Authentifizierungsstatus prüfen
  - H2: Verhalten bei API-Schlüsselrotation (Gateway)
  - H2: Provider-Authentifizierung entfernen, während der Gateway läuft
  - H2: Steuern, welche Anmeldeinformation verwendet wird
  - H3: OpenAI und Legacy-openai-codex-IDs
  - H3: Während der Anmeldung (CLI)
  - H3: Pro Sitzung (Chat-Befehl)
  - H3: Pro Agent (CLI-Überschreibung)
  - H2: Fehlerbehebung
  - H3: „No credentials found“
  - H3: Token läuft ab/ist abgelaufen
  - H2: Verwandt

## gateway/background-process.md

- Route: /gateway/background-process
- Überschriften:
  - H2: exec-Tool
  - H2: Child-Process-Bridging
  - H2: process-Tool
  - H2: Beispiele
  - H2: Verwandt

## gateway/bonjour.md

- Route: /gateway/bonjour
- Überschriften:
  - H2: Wide-Area Bonjour (Unicast DNS-SD) über Tailscale
  - H3: Gateway-Konfiguration (empfohlen)
  - H3: Einmalige DNS-Server-Einrichtung (Gateway-Host)
  - H3: Tailscale-DNS-Einstellungen
  - H3: Gateway-Listener-Sicherheit (empfohlen)
  - H2: Was annoncierte Dienste sendet
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
  - H2: Escaped-Instanznamen (\032)
  - H2: Aktivierung / Deaktivierung / Konfiguration
  - H2: Verwandte Dokumentation

## gateway/bridge-protocol.md

- Route: /gateway/bridge-protocol
- Überschriften:
  - H2: Warum es existierte
  - H2: Transport
  - H2: Handshake + Kopplung
  - H2: Frames
  - H2: Exec-Lifecycle-Ereignisse
  - H2: Historische Tailnet-Nutzung
  - H2: Versionierung
  - H2: Verwandt

## gateway/cli-backends.md

- Route: /gateway/cli-backends
- Überschriften:
  - H2: Einsteigerfreundlicher Schnellstart
  - H2: Als Fallback verwenden
  - H2: Konfigurationsübersicht
  - H3: Beispielkonfiguration
  - H2: Funktionsweise
  - H2: Sitzungen
  - H2: Fallback-Präludium aus claude-cli-Sitzungen
  - H2: Bilder (Durchreichen)
  - H2: Eingaben / Ausgaben
  - H2: Standardwerte (Plugin-eigen)
  - H2: Plugin-eigene Standardwerte
  - H2: Native Compaction-Verantwortung
  - H2: Bundle-MCP-Overlays
  - H2: Obergrenze für Reseed-Historie
  - H2: Einschränkungen
  - H2: Fehlerbehebung
  - H2: Verwandt

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
  - H3: Zuständigkeitskarte für Kontextbudget
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
  - H3: Runtime-Policy
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Block-Streaming
  - H3: Typing-Indikatoren
  - H3: agents.defaults.sandbox
  - H3: agents.list (Überschreibungen pro Agent)
  - H2: Multi-Agent-Routing
  - H3: Binding-Abgleichfelder
  - H3: Zugriffsprofile pro Agent
  - H2: Sitzung
  - H2: Nachrichten
  - H3: Antwortpräfix
  - H3: Ack-Reaktion
  - H3: Inbound-Debounce
  - H3: TTS (Text-to-Speech)
  - H2: Talk
  - H2: Verwandt

## gateway/config-channels.md

- Route: /gateway/config-channels
- Überschriften:
  - H2: Kanäle
  - H3: DM- und Gruppenzugriff
  - H3: Kanalspezifische Modellüberschreibungen
  - H3: Kanalstandards und Heartbeat
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
  - H3: Andere Plugin-Kanäle
  - H3: Erwähnungs-Gating in Gruppenchats
  - H4: DM-Verlaufslimits
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
  - H3: Per Symlink eingebundenes benachbartes Skill-Repository
  - H2: Häufige Muster
  - H3: Gemeinsame Skill-Basis mit einer Überschreibung
  - H3: Einrichtung für mehrere Plattformen
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
  - H3: Konfiguration des Codex-Harness-Plugins
  - H2: Verpflichtungen
  - H2: Browser
  - H2: UI
  - H2: Gateway
  - H3: OpenAI-kompatible Endpunkte
  - H3: Isolation mehrerer Instanzen
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooks
  - H3: Gmail-Integration
  - H2: Canvas-Plugin-Host
  - H2: Erkennung
  - H3: mDNS (Bonjour)
  - H3: Weitbereich (DNS-SD)
  - H2: Umgebung
  - H3: env (Inline-Umgebungsvariablen)
  - H3: Ersetzung von Umgebungsvariablen
  - H2: Geheimnisse
  - H3: SecretRef
  - H3: Unterstützte Anmeldedaten-Oberfläche
  - H3: Konfiguration für Geheimnis-Provider
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
  - H2: Konfigurations-Includes ($include)
  - H2: Verwandte Themen

## gateway/configuration.md

- Route: /gateway/configuration
- Überschriften:
  - H2: Minimale Konfiguration
  - H2: Konfiguration bearbeiten
  - H2: Strikte Validierung
  - H2: Häufige Aufgaben
  - H2: Hot Reload der Konfiguration
  - H3: Reload-Modi
  - H3: Was hot-angewendet wird und was einen Neustart benötigt
  - H3: Reload-Planung
  - H2: Konfigurations-RPC (programmatische Updates)
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
  - H2: Erkennungseingaben (wie Clients erfahren, wo sich das Gateway befindet)
  - H3: 1) Bonjour- / DNS-SD-Erkennung
  - H4: Details zum Service-Beacon
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
  - H2: Schreibgeschützter Lint-Modus
  - H2: Was es tut (Zusammenfassung)
  - H2: Backfill und Reset der Dreams-UI
  - H2: Detailliertes Verhalten und Begründung
  - H2: Verwandte Themen

## gateway/external-apps.md

- Route: /gateway/external-apps
- Überschriften:
  - H2: Was heute verfügbar ist
  - H2: Empfohlener Weg
  - H2: App-Code vs. Plugin-Code
  - H2: Verwandte Themen

## gateway/gateway-lock.md

- Route: /gateway/gateway-lock
- Überschriften:
  - H2: Warum
  - H2: Mechanismus
  - H2: Fehleroberfläche
  - H2: Betriebsnotizen
  - H2: Verwandte Themen

## gateway/health.md

- Route: /gateway/health
- Überschriften:
  - H2: Schnellprüfungen
  - H2: Tiefgehende Diagnose
  - H2: Konfiguration des Zustandsmonitors
  - H2: Uptime-Monitoring
  - H3: Beispiele für die Einrichtung eines Monitoring-Dienstes
  - H2: Wenn etwas fehlschlägt
  - H2: Dedizierter "health"-Befehl
  - H2: Verwandte Themen

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Überschriften:
  - H2: Schnellstart (Einsteiger)
  - H2: Standards
  - H2: Wofür der Heartbeat-Prompt gedacht ist
  - H2: Antwortvertrag
  - H2: Konfiguration
  - H3: Geltungsbereich und Vorrang
  - H3: Pro-Agent-Heartbeats
  - H3: Beispiel für aktive Stunden
  - H3: 24/7-Einrichtung
  - H3: Beispiel für mehrere Konten
  - H3: Feldnotizen
  - H2: Zustellverhalten
  - H2: Sichtbarkeitssteuerungen
  - H3: Was jedes Flag tut
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
  - H3: Vorrang von Port und Bind-Adresse
  - H3: Hot-Reload-Modi
  - H2: Befehlssatz für Operatoren
  - H2: Mehrere Gateways (derselbe Host)
  - H2: Remote-Zugriff
  - H2: Überwachung und Service-Lebenszyklus
  - H2: Schneller Weg für das Dev-Profil
  - H2: Protokoll-Kurzreferenz (Operatoransicht)
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
  - H2: Wie es funktioniert
  - H2: Konfigurationsform
  - H2: Felder
  - H2: Inferrs-Beispiel
  - H2: ds4-Beispiel
  - H2: Betriebsnotizen
  - H2: Verwandte Themen

## gateway/local-models.md

- Route: /gateway/local-models
- Überschriften:
  - H2: Mindest-Hardware
  - H2: Backend auswählen
  - H2: Empfohlen: LM Studio + großes lokales Modell (Responses API)
  - H3: Hybridkonfiguration: gehostetes Primärmodell, lokaler Fallback
  - H3: Local-first mit gehostetem Sicherheitsnetz
  - H3: Regionales Hosting / Datenrouting
  - H2: Andere OpenAI-kompatible lokale Proxys
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
  - H2: Bestes empfohlenes Setup
  - H2: Rescue-Bot-Schnellstart
  - H2: Warum das funktioniert
  - H2: Was --profile rescue onboard ändert
  - H2: Allgemeine Einrichtung mehrerer Gateways
  - H2: Isolations-Checkliste
  - H2: Portzuordnung (abgeleitet)
  - H2: Browser-/CDP-Hinweise (häufige Fehlerquelle)
  - H2: Manuelles env-Beispiel
  - H2: Schnellprüfungen
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
  - H2: Wann Sie diesen Endpunkt verwenden sollten
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
  - H3: Form der nicht streamenden Tool-Antwort
  - H3: Form der streamenden Tool-Antwort
  - H3: Tool-Follow-up-Schleife
  - H2: Open WebUI-Schnelleinrichtung
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
  - H3: functioncalloutput (turn-basierte Tools)
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
  - H3: Einen Modus auswählen
  - H2: Konfigurationsreferenz
  - H2: Beispiele
  - H3: Minimale Remote-Einrichtung
  - H3: Spiegelmodus mit GPU
  - H3: Pro-Agent-OpenShell mit benutzerdefiniertem Gateway
  - H2: Lebenszyklusverwaltung
  - H3: Wann neu erstellt werden sollte
  - H2: Sicherheits-Hardening
  - H2: Aktuelle Einschränkungen
  - H2: Wie es funktioniert
  - H2: Verwandte Themen

## gateway/opentelemetry.md

- Route: /gateway/opentelemetry
- Überschriften:
  - H2: Wie alles zusammenpasst
  - H2: Schnellstart
  - H2: Exportierte Signale
  - H2: Konfigurationsreferenz
  - H3: Umgebungsvariablen
  - H2: Datenschutz und Inhaltserfassung
  - H2: Sampling und Flushing
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
  - H2: Methoden-Scope ist nur die erste Schranke
  - H2: Genehmigungen für Geräte-Pairing
  - H2: Genehmigungen für Node-Pairing
  - H2: Authentifizierung mit gemeinsamem Geheimnis

## gateway/pairing.md

- Route: /gateway/pairing
- Überschriften:
  - H2: Konzepte
  - H2: Wie Pairing funktioniert
  - H2: CLI-Workflow (headless-freundlich)
  - H2: API-Oberfläche (Gateway-Protokoll)
  - H2: Node-Befehls-Gating (2026.3.31+)
  - H2: Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)
  - H2: Automatische Genehmigung (macOS-App)
  - H2: Automatische Genehmigung für Geräte in vertrauenswürdigen CIDR-Bereichen
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
  - H2: Zwischen Prometheus- und OpenTelemetry-Export wählen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## gateway/protocol.md

- Route: /gateway/protocol
- Überschriften:
  - H2: Transport
  - H2: Handshake (Verbindung)
  - H3: Node-Beispiel
  - H2: Framing
  - H2: Rollen + Scopes
  - H3: Rollen
  - H3: Scopes (Operator)
  - H3: Caps/Befehle/Berechtigungen (Node)
  - H2: Präsenz
  - H3: Hintergrund-Alive-Ereignis von Node
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
  - H3: Diagnose zur Geräte-Auth-Migration
  - H2: TLS + Pinning
  - H2: Scope
  - H2: Verwandte Themen

## gateway/remote-gateway-readme.md

- Route: /gateway/remote-gateway-readme
- Überschriften:
  - H1: OpenClaw.app mit einem Remote-Gateway ausführen
  - H2: Überblick
  - H2: Schnelle Einrichtung
  - H3: Schritt 1: SSH-Konfiguration hinzufügen
  - H3: Schritt 2: SSH-Schlüssel kopieren
  - H3: Schritt 3: Remote-Gateway-Auth konfigurieren
  - H3: Schritt 4: SSH-Tunnel starten
  - H3: Schritt 5: OpenClaw.app neu starten
  - H2: Tunnel bei Anmeldung automatisch starten
  - H3: PLIST-Datei erstellen
  - H3: Launch Agent laden
  - H2: Fehlerbehebung
  - H2: Funktionsweise
  - H2: Verwandte Themen

## gateway/remote.md

- Route: /gateway/remote
- Überschriften:
  - H2: Die Grundidee
  - H2: Häufige VPN- und Tailnet-Setups
  - H3: Immer aktives Gateway in Ihrem Tailnet
  - H3: Heim-Desktop führt das Gateway aus
  - H3: Laptop führt das Gateway aus
  - H2: Befehlsfluss (was wo ausgeführt wird)
  - H2: SSH-Tunnel (CLI + Tools)
  - H2: Remote-Standardwerte der CLI
  - H2: Vorrang von Anmeldedaten
  - H2: Remote-Zugriff auf die Chat-UI
  - H2: Remote-Modus der macOS-App
  - H2: Sicherheitsregeln (remote/VPN)
  - H3: macOS: persistenter SSH-Tunnel über LaunchAgent
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
  - H2: Tool-Policy: welche Tools existieren/aufrufbar sind
  - H3: Tool-Gruppen (Kurzformen)
  - H2: Erhöht: nur für exec „auf Host ausführen“
  - H2: Häufige Korrekturen für „Sandbox-Jail“
  - H3: „Tool X durch Sandbox-Tool-Policy blockiert“
  - H3: „Ich dachte, das wäre main, warum ist es sandboxed?“
  - H2: Verwandte Themen

## gateway/sandboxing.md

- Route: /gateway/sandboxing
- Überschriften:
  - H2: Was in die Sandbox kommt
  - H2: Modi
  - H2: Umfang
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
  - H2: Tool-Policy und Escape-Hatches
  - H2: Multi-Agent-Überschreibungen
  - H2: Minimales Aktivierungsbeispiel
  - H2: Verwandte Themen

## gateway/secrets-plan-contract.md

- Route: /gateway/secrets-plan-contract
- Überschriften:
  - H2: Form der Plan-Datei
  - H2: Provider-Upserts und Löschungen
  - H2: Unterstützter Zielumfang
  - H2: Verhalten des Zieltyps
  - H2: Regeln zur Pfadvalidierung
  - H2: Fehlerverhalten
  - H2: Zustimmungsverhalten des Exec-Providers
  - H2: Hinweise zu Runtime- und Audit-Umfang
  - H2: Operator-Prüfungen
  - H2: Verwandte Dokumentation

## gateway/secrets.md

- Route: /gateway/secrets
- Überschriften:
  - H2: Ziele und Runtime-Modell
  - H2: Agent-Zugriffsgrenze
  - H2: Filterung aktiver Oberflächen
  - H2: Diagnosen zur Gateway-Auth-Oberfläche
  - H2: Onboarding-Referenz-Preflight
  - H2: SecretRef-Vertrag
  - H2: Provider-Konfiguration
  - H2: Dateibasierte API-Schlüssel
  - H2: Beispiele für Exec-Integration
  - H2: Umgebungsvariablen des MCP-Servers
  - H2: SSH-Auth-Material für die Sandbox
  - H2: Unterstützte Anmeldedaten-Oberfläche
  - H2: Erforderliches Verhalten und Vorrang
  - H2: Aktivierungsauslöser
  - H2: Signale für beeinträchtigt und wiederhergestellt
  - H2: Auflösung von Befehlspfaden
  - H2: Audit- und Konfigurationsworkflow
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
  - H2: Minimale sichere Baseline
  - H2: DM- und Gruppenexposition
  - H2: Reverse-Proxy-Prüfungen
  - H2: Tool- und Sandbox-Review
  - H2: Validierung nach der Änderung
  - H2: Rollback-Plan
  - H2: Review-Checkliste

## gateway/security/index.md

- Route: /gateway/security
- Überschriften:
  - H2: Zuerst der Umfang: Sicherheitsmodell für persönliche Assistenten
  - H2: Schnellcheck: openclaw security audit
  - H3: Dependency-Lock für veröffentlichte Pakete
  - H3: Deployment- und Host-Vertrauen
  - H3: Sichere Dateioperationen
  - H3: Gemeinsam genutzter Slack-Workspace: echtes Risiko
  - H3: Unternehmensweit geteilter Agent: akzeptables Muster
  - H2: Vertrauenskonzept für Gateway und Node
  - H2: Matrix der Vertrauensgrenzen
  - H2: Absichtlich keine Schwachstellen
  - H2: Gehärtete Baseline in 60 Sekunden
  - H2: Schnellregel für gemeinsam genutzte Posteingänge
  - H2: Modell für Kontext-Sichtbarkeit
  - H2: Was der Audit prüft (allgemein)
  - H2: Speicherübersicht für Anmeldedaten
  - H2: Checkliste für Sicherheitsaudits
  - H2: Glossar zum Sicherheitsaudit
  - H2: Control-UI über HTTP
  - H2: Zusammenfassung unsicherer oder gefährlicher Flags
  - H2: Reverse-Proxy-Konfiguration
  - H2: Hinweise zu HSTS und Ursprung
  - H2: Lokale Sitzungsprotokolle liegen auf dem Datenträger
  - H2: Node-Ausführung (system.run)
  - H2: Dynamische Skills (Watcher / Remote-Nodes)
  - H2: Das Bedrohungsmodell
  - H2: Kernkonzept: Zugriffskontrolle vor Intelligenz
  - H2: Modell für Befehlsautorisierung
  - H2: Risiko von Control-Plane-Tools
  - H2: Plugins
  - H2: DM-Zugriffsmodell: Pairing, Allowlist, offen, deaktiviert
  - H2: DM-Sitzungsisolation (Multi-User-Modus)
  - H3: Sicherer DM-Modus (empfohlen)
  - H2: Allowlists für DMs und Gruppen
  - H2: Prompt-Injection (was sie ist, warum sie wichtig ist)
  - H2: Bereinigung externer Inhalte von Sondertokens
  - H2: Unsichere Bypass-Flags für externe Inhalte
  - H3: Prompt-Injection erfordert keine öffentlichen DMs
  - H3: Selbst gehostete LLM-Backends
  - H3: Modellstärke (Sicherheitshinweis)
  - H2: Reasoning und ausführliche Ausgabe in Gruppen
  - H2: Beispiele zur Konfigurationshärtung
  - H3: Dateiberechtigungen
  - H3: Netzwerkexposition (Bind, Port, Firewall)
  - H3: Docker-Portveröffentlichung mit UFW
  - H3: mDNS/Bonjour-Erkennung
  - H3: Gateway-WebSocket absichern (lokale Auth)
  - H3: Tailscale Serve-Identitätsheader
  - H3: Browsersteuerung über Node-Host (empfohlen)
  - H3: Secrets auf Datenträger
  - H3: Workspace-.env-Dateien
  - H3: Protokolle und Transkripte (Schwärzung und Aufbewahrung)
  - H3: DMs: standardmäßig Pairing
  - H3: Gruppen: überall Erwähnung verlangen
  - H3: Separate Nummern (WhatsApp, Signal, Telegram)
  - H3: Schreibgeschützter Modus (über Sandbox und Tools)
  - H3: Sichere Baseline (kopieren/einfügen)
  - H2: Sandboxing (empfohlen)
  - H3: Leitplanke für Sub-Agent-Delegation
  - H2: Risiken der Browsersteuerung
  - H3: Browser-SSRF-Richtlinie (standardmäßig strikt)
  - H2: Zugriffprofile pro Agent (Multi-Agent)
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
  - H2: Leitlinien für Plugin und Core

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
  - H3: Öffentliches Internet (Funnel + gemeinsames Passwort)
  - H2: CLI-Beispiele
  - H2: Hinweise
  - H2: Browsersteuerung (Remote-Gateway + lokaler Browser)
  - H2: Tailscale-Voraussetzungen + Limits
  - H2: Mehr erfahren
  - H2: Verwandte Themen

## gateway/tools-invoke-http-api.md

- Route: /gateway/tools-invoke-http-api
- Überschriften:
  - H2: Authentifizierung
  - H2: Sicherheitsgrenze (wichtig)
  - H2: Request-Body
  - H2: Policy + Routing-Verhalten
  - H2: Antworten
  - H2: Beispiel
  - H2: Verwandte Themen

## gateway/troubleshooting.md

- Route: /gateway/troubleshooting
- Überschriften:
  - H2: Befehlsleiter
  - H2: Nach einem Update
  - H2: Split-Brain-Installationen und Schutz für neuere Konfiguration
  - H2: Protokollabweichung nach Rollback
  - H2: Skill-Symlink als Pfadausbruch übersprungen
  - H2: Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich
  - H2: Upstream-403-blockierte Antworten
  - H2: Lokales OpenAI-kompatibles Backend besteht direkte Prüfungen, aber Agent-Läufe schlagen fehl
  - H2: Keine Antworten
  - H2: Konnektivität der Dashboard-Control-UI
  - H3: Schnellzuordnung für Auth-Detailcodes
  - H2: Gateway-Dienst läuft nicht
  - H2: macOS-Gateway reagiert still nicht mehr und wird wieder aktiv, wenn Sie das Dashboard berühren
  - H2: Gateway beendet sich bei hoher Speichernutzung
  - H2: Gateway hat ungültige Konfiguration abgelehnt
  - H2: Gateway-Prüfwarnungen
  - H2: Kanal verbunden, Nachrichten fließen nicht
  - H2: Cron- und Heartbeat-Zustellung
  - H2: Node gekoppelt, Tool schlägt fehl
  - H2: Browser-Tool schlägt fehl
  - H2: Wenn Sie aktualisiert haben und plötzlich etwas nicht mehr funktioniert
  - H2: Verwandte Themen

## gateway/trusted-proxy-auth.md

- Route: /gateway/trusted-proxy-auth
- Überschriften:
  - H2: Wann verwenden
  - H2: Wann NICHT verwenden
  - H2: Funktionsweise
  - H2: Pairing-Verhalten der Control-UI
  - H2: Konfiguration
  - H3: Konfigurationsreferenz
  - H2: TLS-Terminierung und HSTS
  - H3: Rollout-Leitlinien
  - H2: Beispiele für Proxy-Einrichtung
  - H2: Gemischte Token-Konfiguration
  - H2: Header für Operator-Scopes
  - H2: Sicherheitscheckliste
  - H2: Sicherheitsaudit
  - H2: Fehlerbehebung
  - H2: Migration von Token-Auth
  - H2: Verwandte Themen

## help/debugging.md

- Route: /help/debugging
- Überschriften:
  - H2: Runtime-Debug-Überschreibungen
  - H2: Ausgabe des Sitzungs-Traces
  - H2: Trace des Plugin-Lebenszyklus
  - H2: CLI-Start und Befehlsprofiling
  - H2: Gateway-Watch-Modus
  - H2: Dev-Profil + Dev-Gateway (--dev)
  - H2: Raw-Stream-Logging (OpenClaw)
  - H2: Raw-Chunk-Logging für OpenAI-kompatible Backends
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
  - H2: Von der Runtime injizierte env vars
  - H2: UI-env vars
  - H2: env var-Ersetzung in der Konfiguration
  - H2: Secret-Refs vs ${ENV}-Strings
  - H2: Pfadbezogene env vars
  - H2: Logging
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
  - H2: Modelle: Standardwerte, Auswahl, Aliasse, Wechsel
  - H2: Modell-Failover und „All models failed“
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
  - H2: Wo Dinge auf dem Datenträger liegen
  - H2: Grundlagen der Konfiguration
  - H2: Remote-Gateways und Nodes
  - H2: env vars und .env-Laden
  - H2: Sitzungen und mehrere Chats
  - H2: Modelle, Failover und Auth-Profile
  - H2: Gateway: Ports, „bereits ausgeführt“ und Remote-Modus
  - H2: Logging und Debugging
  - H2: Medien und Anhänge
  - H2: Sicherheit und Zugriffskontrolle
  - H2: Chat-Befehle, Aufgaben abbrechen und „es stoppt nicht“
  - H2: Verschiedenes
  - H2: Verwandte Themen

## help/index.md

- Route: /help
- Überschriften:
  - H2: FAQ
  - H2: Diagnosen
  - H2: Tests
  - H2: Community und Meta

## help/scripts.md

- Route: /help/scripts
- Überschriften:
  - H2: Konventionen
  - H2: Auth-Monitoring-Skripte
  - H2: GitHub-Lesehelfer
  - H2: Beim Hinzufügen von Skripten
  - H2: Verwandte Themen

## help/testing-live.md

- Route: /help/testing-live
- Überschriften:
  - H2: Live: lokale Smoke-Befehle
  - H2: Live: Fähigkeitsdurchlauf für Android-Node
  - H2: Live: Modell-Smoke-Test (Profilschlüssel)
  - H3: Ebene 1: Direkte Modellvervollständigung (kein Gateway)
  - H3: Ebene 2: Gateway + Entwicklungs-Agent-Smoke-Test (was "@openclaw" tatsächlich tut)
  - H2: Live: CLI-Backend-Smoke-Test (Claude, Gemini oder andere lokale CLIs)
  - H2: Live: Erreichbarkeit des APNs-HTTP/2-Proxys
  - H2: Live: ACP-Bind-Smoke-Test (/acp spawn ... --bind here)
  - H2: Live: Codex-App-Server-Harness-Smoke-Test
  - H3: Empfohlene Live-Rezepte
  - H2: Live: Modellmatrix (was wir abdecken)
  - H3: Modernes Smoke-Test-Set (Tool-Aufrufe + Bild)
  - H3: Baseline: Tool-Aufrufe (Read + optional Exec)
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
  - H2: Paketabnahme
  - H2: Release-Standard
  - H2: Legacy-Kompatibilität
  - H2: Abdeckung hinzufügen
  - H2: Fehlersuche

## help/testing.md

- Route: /help/testing
- Überschriften:
  - H2: Schnellstart
  - H2: Test-Temp-Verzeichnisse
  - H2: QA-spezifische Runner
  - H3: Gemeinsame Telegram-Zugangsdaten über Convex (v1)
  - H3: Einen Channel zu QA hinzufügen
  - H2: Test-Suites (was wo läuft)
  - H3: Unit / Integration (Standard)
  - H3: Stabilität (Gateway)
  - H3: E2E (Repo-Aggregat)
  - H3: E2E (Gateway-Smoke-Test)
  - H3: E2E (Control-UI mit gemocktem Browser)
  - H3: E2E: OpenShell-Backend-Smoke-Test
  - H3: Live (echte Provider + echte Modelle)
  - H2: Welche Suite sollte ich ausführen?
  - H2: Live-Tests (mit Netzwerkzugriff)
  - H2: Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)
  - H2: Docs-Sanity
  - H2: Offline-Regression (CI-sicher)
  - H2: Agent-Zuverlässigkeitsevaluierungen (Skills)
  - H2: Vertragstests (Plugin- und Channel-Form)
  - H3: Befehle
  - H3: Channel-Verträge
  - H3: Provider-Statusverträge
  - H3: Provider-Verträge
  - H3: Wann ausführen
  - H2: Regressionen hinzufügen (Leitlinien)
  - H2: Verwandte Themen

## help/troubleshooting.md

- Route: /help/troubleshooting
- Überschriften:
  - H2: Die ersten 60 Sekunden
  - H2: Assistent wirkt eingeschränkt oder Tools fehlen
  - H2: Anthropic langer Kontext 429
  - H2: Lokales OpenAI-kompatibles Backend funktioniert direkt, schlägt aber in OpenClaw fehl
  - H2: Plugin-Installation schlägt wegen fehlender openclaw-Erweiterungen fehl
  - H2: Installationsrichtlinie blockiert Plugin-Installationen oder -Updates
  - H2: Plugin vorhanden, aber durch verdächtige Eigentümerschaft blockiert
  - H2: Entscheidungsbaum
  - H2: Verwandte Themen

## index.md

- Route: /
- Überschriften:
  - H1: OpenClaw 🦞
  - H2: Was ist OpenClaw?
  - H2: Wie es funktioniert
  - H2: Kernfunktionen
  - H2: Schnellstart
  - H2: Dashboard
  - H2: Konfiguration (optional)
  - H2: Hier starten
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
  - H2: Bereitstellung konfigurieren
  - H2: Azure-Ressourcen bereitstellen
  - H2: OpenClaw installieren
  - H2: Kostenüberlegungen
  - H2: Bereinigung
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/bun.md

- Route: /install/bun
- Überschriften:
  - H2: Installation
  - H2: Lifecycle-Skripte
  - H2: Einschränkungen
  - H2: Verwandte Themen

## install/clawdock.md

- Route: /install/clawdock
- Überschriften:
  - H2: Installation
  - H2: Was Sie erhalten
  - H3: Grundlegende Vorgänge
  - H3: Containerzugriff
  - H3: Web-UI und Kopplung
  - H3: Einrichtung und Wartung
  - H3: Hilfsprogramme
  - H2: Ablauf beim ersten Start
  - H2: Konfiguration und Secrets
  - H2: Verwandte Themen

## install/development-channels.md

- Route: /install/development-channels
- Überschriften:
  - H2: Channels wechseln
  - H2: Einmalige Versions- oder Tag-Auswahl
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
  - H2: Erforderliche Binärdateien in das Image einbacken
  - H2: Bauen und starten
  - H2: Was wo persistent bleibt
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
  - H3: Beobachtbarkeit
  - H3: Health-Checks
  - H3: LAN vs. Loopback
  - H3: Lokale Host-Provider
  - H3: Claude-CLI-Backend in Docker
  - H3: Bonjour / mDNS
  - H3: Speicherung und Persistenz
  - H3: Shell-Hilfen (optional)
  - H3: Ausführung auf einem VPS?
  - H2: Agent-Sandbox
  - H3: Schnell aktivieren
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/exe-dev.md

- Route: /install/exe-dev
- Überschriften:
  - H2: Schneller Einstieg für Einsteiger
  - H2: Was Sie benötigen
  - H2: Automatisierte Installation mit Shelley
  - H2: Manuelle Installation
  - H2: 1) VM erstellen
  - H2: 2) Voraussetzungen installieren (auf der VM)
  - H2: 3) OpenClaw installieren
  - H2: 4) nginx einrichten, um OpenClaw auf Port 8000 zu proxysieren
  - H2: 5) Auf OpenClaw zugreifen und Berechtigungen erteilen
  - H2: Einrichtung von Remote-Channels
  - H2: Remote-Zugriff
  - H2: Aktualisierung
  - H2: Verwandte Themen

## install/fly.md

- Route: /install/fly
- Überschriften:
  - H2: Was Sie benötigen
  - H2: Schneller Einstieg für Einsteiger
  - H2: Fehlerbehebung
  - H3: "App lauscht nicht an der erwarteten Adresse"
  - H3: Health-Checks schlagen fehl / Verbindung abgelehnt
  - H3: OOM / Speicherprobleme
  - H3: Gateway-Lock-Probleme
  - H3: Konfiguration wird nicht gelesen
  - H3: Konfiguration über SSH schreiben
  - H3: Zustand bleibt nicht persistent
  - H2: Updates
  - H3: Befehl zum Aktualisieren der Maschine
  - H2: Private Bereitstellung (gehärtet)
  - H3: Wann private Bereitstellung verwendet werden sollte
  - H3: Einrichtung
  - H3: Zugriff auf eine private Bereitstellung
  - H3: Webhooks mit privater Bereitstellung
  - H3: Sicherheitsvorteile
  - H2: Hinweise
  - H2: Kosten
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/gcp.md

- Route: /install/gcp
- Überschriften:
  - H2: Was tun wir hier (einfach erklärt)?
  - H2: Schneller Weg (erfahrene Betreiber)
  - H2: Was Sie benötigen
  - H2: Fehlerbehebung
  - H2: Dienstkonten (Best Practice für Sicherheit)
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/hetzner.md

- Route: /install/hetzner
- Überschriften:
  - H2: Ziel
  - H2: Was tun wir hier (einfach erklärt)?
  - H2: Schneller Weg (erfahrene Betreiber)
  - H2: Was Sie benötigen
  - H2: Infrastructure as Code (Terraform)
  - H2: Nächste Schritte
  - H2: Verwandte Themen

## install/hostinger.md

- Route: /install/hostinger
- Überschriften:
  - H2: Voraussetzungen
  - H2: Option A: 1-Klick-OpenClaw
  - H2: Option B: OpenClaw auf VPS
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
  - H3: Lokaler Präfix-Installer (install-cli.sh)
  - H3: npm, pnpm oder bun
  - H3: Aus dem Quellcode
  - H3: Aus dem GitHub-main-Checkout installieren
  - H3: Container und Paketmanager
  - H2: Installation überprüfen
  - H2: Hosting und Bereitstellung
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
  - H3: 1) Bereitstellen
  - H3: 2) Auf das Gateway zugreifen
  - H2: Was bereitgestellt wird
  - H2: Anpassung
  - H3: Agent-Anweisungen
  - H3: Gateway-Konfiguration
  - H3: Provider hinzufügen
  - H3: Benutzerdefinierter Namespace
  - H3: Benutzerdefiniertes Image
  - H3: Über Port-Forward hinaus freigeben
  - H2: Erneut bereitstellen
  - H2: Entfernen
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
  - H2: Schneller Weg (Lume, erfahrene Benutzer)
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
  - H2: Zwei Importwege
  - H2: Was importiert wird
  - H2: Was nur als Archiv erhalten bleibt
  - H2: Quellenauswahl
  - H2: Empfohlener Ablauf
  - H2: Konfliktbehandlung
  - H2: JSON-Ausgabe für Automatisierung
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/migrating-hermes.md

- Route: /install/migrating-hermes
- Überschriften:
  - H2: Zwei Importwege
  - H2: Was importiert wird
  - H2: Was nur als Archiv erhalten bleibt
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
  - H3: Verifizierungs-Checkliste
  - H2: Plugin direkt aktualisieren
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
  - H3: openclaw: command not found
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
  - H2: Sicherheitslage überprüfen
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
  - H2: Konfiguration, env und Speicherung
  - H2: Nützliche Befehle
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## install/railway.mdx

- Route: /install/railway
- Überschriften:
  - H1: Railway
  - H2: Schnell-Checkliste (neue Benutzer)
  - H2: One-Click-Deploy
  - H2: Was Sie erhalten
  - H2: Erforderliche Railway-Einstellungen
  - H3: Öffentliches Networking
  - H3: Volume (erforderlich)
  - H3: Variablen
  - H2: Einen Channel verbinden
  - H2: Backups &amp; Migration
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
  - H2: Verwandte Themen

## install/render.mdx

- Route: /install/render
- Überschriften:
  - H1: Render
  - H2: Voraussetzungen
  - H2: Mit einer Render-Blueprint bereitstellen
  - H2: Die Blueprint verstehen
  - H2: Einen Plan auswählen
  - H2: Nach der Bereitstellung
  - H3: Auf die Control UI zugreifen
  - H2: Funktionen des Render-Dashboards
  - H3: Logs
  - H3: Shell-Zugriff
  - H3: Umgebungsvariablen
  - H3: Automatische Bereitstellung
  - H2: Benutzerdefinierte Domain
  - H2: Skalierung
  - H2: Backups und Migration
  - H2: Fehlerbehebung
  - H3: Dienst startet nicht
  - H3: Langsame Kaltstarts (kostenloser Tarif)
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
  - H2: Normale Installation vs. Source-Checkout
  - H3: Normale Installation (install.sh / npm / pnpm / bun)
  - H3: Source-Checkout (git clone)
  - H2: Verwandte Themen

## install/updating.md

- Route: /install/updating
- Überschriften:
  - H2: Empfohlen: openclaw update
  - H2: Zwischen npm- und git-Installationen wechseln
  - H2: Alternative: Installer erneut ausführen
  - H2: Alternative: manuelles npm, pnpm oder bun
  - H3: Erweiterte Themen zur npm-Installation
  - H2: Auto-Updater
  - H2: Nach dem Aktualisieren
  - H3: Doctor ausführen
  - H3: Gateway neu starten
  - H3: Überprüfen
  - H2: Rollback
  - H3: Eine Version fixieren (npm)
  - H3: Einen Commit fixieren (Source)
  - H2: Wenn Sie nicht weiterkommen
  - H2: Verwandte Themen

## install/upstash.md

- Route: /install/upstash
- Überschriften:
  - H2: Voraussetzungen
  - H2: Eine Box erstellen
  - H2: Mit einem SSH-Tunnel verbinden
  - H2: OpenClaw installieren
  - H2: Onboarding ausführen
  - H2: Gateway starten
  - H2: Automatischer Neustart
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## logging.md

- Route: /logging
- Überschriften:
  - H2: Speicherort der Logs
  - H2: Logs lesen
  - H3: CLI: Live-Tail (empfohlen)
  - H3: Control UI (Web)
  - H3: Nur-Channel-Logs
  - H2: Logformate
  - H3: Datei-Logs (JSONL)
  - H3: Konsolenausgabe
  - H3: Gateway-WebSocket-Logs
  - H2: Logging konfigurieren
  - H3: Log-Level
  - H3: Gezielte Model-Transportdiagnose
  - H3: Trace-Korrelation
  - H3: Größe und Timing von Model-Aufrufen
  - H3: Konsolenstile
  - H3: Schwärzung
  - H2: Diagnose und OpenTelemetry
  - H2: Tipps zur Fehlerbehebung
  - H2: Verwandte Themen

## maturity/scorecard.md

- Route: /maturity/scorecard
- Überschriften:
  - H1: Reifegrad-Scorecard
  - H2: Wofür diese Seite gedacht ist
  - H2: Auf einen Blick
  - H2: Bewertungsbereiche
  - H2: Oberflächen-Explorer
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
  - H3: Channel
  - H3: Provider und Tool

## network.md

- Route: /network
- Überschriften:
  - H2: Core-Modell
  - H2: Pairing + Identität
  - H2: Erkennung + Transporte
  - H2: Nodes + Transporte
  - H2: Sicherheit
  - H2: Verwandte Themen

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
  - H3: Transkript an Chat ausgeben (Opt-in)
  - H2: Hinweise und Grenzen
  - H3: Unterstützung für Proxy-Umgebungen
  - H2: Erwähnungserkennung in Gruppen
  - H2: Fallstricke
  - H2: Verwandte Themen

## nodes/camera.md

- Route: /nodes/camera
- Überschriften:
  - H2: iOS-Node
  - H3: Benutzereinstellung (standardmäßig aktiviert)
  - H3: Befehle (über Gateway node.invoke)
  - H3: Vordergrundanforderung
  - H3: CLI-Helfer
  - H2: Android-Node
  - H3: Android-Benutzereinstellung (standardmäßig aktiviert)
  - H3: Berechtigungen
  - H3: Android-Vordergrundanforderung
  - H3: Android-Befehle (über Gateway node.invoke)
  - H3: Payload-Schutz
  - H2: macOS-App
  - H3: Benutzereinstellung (standardmäßig deaktiviert)
  - H3: CLI-Helfer (node invoke)
  - H2: Sicherheit + praktische Grenzen
  - H2: macOS-Bildschirmvideo (auf Betriebssystemebene)
  - H2: Verwandte Themen

## nodes/images.md

- Route: /nodes/images
- Überschriften:
  - H2: Ziele
  - H2: CLI-Oberfläche
  - H2: Verhalten des WhatsApp-Web-Channels
  - H2: Auto-Reply-Pipeline
  - H2: Eingehende Medien zu Befehlen
  - H2: Grenzen und Fehler
  - H2: Hinweise für Tests
  - H2: Verwandte Themen

## nodes/index.md

- Route: /nodes
- Überschriften:
  - H2: Pairing + Status
  - H2: Remote-Node-Host (system.run)
  - H3: Was wo läuft
  - H3: Einen Node-Host starten (Vordergrund)
  - H3: Remote-Gateway über SSH-Tunnel (Loopback-Bind)
  - H3: Einen Node-Host starten (Dienst)
  - H3: Pairing + Name
  - H3: Befehle auf die Allowlist setzen
  - H3: Exec auf den Node richten
  - H3: Lokale Model-Inferenz
  - H2: Befehle aufrufen
  - H2: Befehlsrichtlinie
  - H2: Konfiguration (openclaw.json)
  - H2: Screenshots (Canvas-Snapshots)
  - H3: Canvas-Steuerungen
  - H3: A2UI (Canvas)
  - H2: Fotos + Videos (Node-Kamera)
  - H2: Bildschirmaufzeichnungen (Nodes)
  - H2: Standort (Nodes)
  - H2: SMS (Android-Nodes)
  - H2: Android-Gerät + Befehle für persönliche Daten
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
  - H2: UX-Text (Vorschlag)
  - H2: Verwandte Themen

## nodes/media-understanding.md

- Route: /nodes/media-understanding
- Überschriften:
  - H2: Ziele
  - H2: Verhalten auf hoher Ebene
  - H2: Konfigurationsübersicht
  - H3: Model-Einträge
  - H3: Provider-Anmeldedaten (apiKey)
  - H2: Standards und Grenzen
  - H3: Medienverständnis automatisch erkennen (Standard)
  - H3: Unterstützung für Proxy-Umgebungen (Provider-Models)
  - H2: Funktionen (optional)
  - H2: Provider-Unterstützungsmatrix (OpenClaw-Integrationen)
  - H2: Anleitung zur Model-Auswahl
  - H2: Anhangsrichtlinie
  - H2: Konfigurationsbeispiele
  - H2: Statusausgabe
  - H2: Hinweise
  - H2: Verwandte Themen

## nodes/talk.md

- Route: /nodes/talk
- Überschriften:
  - H2: Verhalten (macOS)
  - H2: Sprachanweisungen in Antworten
  - H2: Konfiguration (/.openclaw/openclaw.json)
  - H2: macOS-UI
  - H2: Android-UI
  - H2: Hinweise
  - H2: Verwandte Themen

## nodes/troubleshooting.md

- Route: /nodes/troubleshooting
- Überschriften:
  - H2: Befehlsleiter
  - H2: Vordergrundanforderungen
  - H2: Berechtigungsmatrix
  - H2: Pairing versus Genehmigungen
  - H2: Häufige Node-Fehlercodes
  - H2: Schnelle Wiederherstellungsschleife
  - H2: Verwandte Themen

## nodes/voicewake.md

- Route: /nodes/voicewake
- Überschriften:
  - H2: Speicher (Gateway-Host)
  - H2: Protokoll
  - H3: Methoden
  - H3: Routing-Methoden (Trigger → Ziel)
  - H3: Ereignisse
  - H2: Client-Verhalten
  - H3: macOS-App
  - H3: iOS-Node
  - H3: Android-Node
  - H2: Verwandte Themen

## openclaw-agent-runtime.md

- Route: /openclaw-agent-runtime
- Überschriften:
  - H2: Typprüfung und Linting
  - H2: Agent Runtime Tests ausführen
  - H2: Manuelles Testen
  - H2: Zurücksetzen auf einen sauberen Zustand
  - H2: Referenzen
  - H2: Verwandte Themen

## perplexity.md

- Route: /perplexity
- Überschriften:
  - H2: Verwandte Themen

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
  - H3: Semantik der Runtime-Auswahl ändert sich nicht
  - H2: Implementierungsplan
  - H3: 1. Wiederverwendbare Context-Engine-Versuchshelfer exportieren oder verlagern
  - H3: 2. Einen Codex-Kontextprojektionshelfer hinzufügen
  - H3: 3. Bootstrap vor Codex-Thread-Start verdrahten
  - H3: 4. Assembly vor thread/start / thread/resume und turn/start verdrahten
  - H3: 5. Prompt-Cache-stabile Formatierung beibehalten
  - H3: 6. Post-Turn nach Transcript-Mirroring verdrahten
  - H3: 7. Nutzung und Prompt-Cache-Runtime-Kontext normalisieren
  - H3: 8. Compaction-Richtlinie
  - H4: /compact und explizite OpenClaw-Compaction
  - H4: In-Turn-native Codex-contextCompaction-Ereignisse
  - H3: 9. Sitzungs-Reset und Bindungsverhalten
  - H3: 10. Fehlerbehandlung
  - H2: Testplan
  - H3: Unit-Tests
  - H3: Vorhandene zu aktualisierende Tests
  - H3: Integrations- / Live-Tests
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
  - H2: Runtime-Funktionsvertrag
  - H2: Channel-Zuordnung
  - H2: Refactoring-Schritte
  - H2: Tests
  - H2: Offene Fragen
  - H2: Verwandte Themen

## platforms/android.md

- Route: /platforms/android
- Überschriften:
  - H2: Support-Übersicht
  - H2: Systemsteuerung
  - H2: Verbindungs-Runbook
  - H3: Voraussetzungen
  - H3: 1) Gateway starten
  - H3: 2) Erkennung überprüfen (optional)
  - H4: Tailnet-Erkennung (Wien ⇄ London) über Unicast-DNS-SD
  - H3: 3) Von Android verbinden
  - H3: Presence-Alive-Beacons
  - H3: 4) Pairing genehmigen (CLI)
  - H3: 5) Prüfen, ob der Node verbunden ist
  - H3: 6) Chat + Verlauf
  - H3: 7) Canvas + Kamera
  - H4: Gateway Canvas Host (für Webinhalte empfohlen)
  - H3: 8) Sprache + erweiterte Android-Befehlsoberfläche
  - H2: Assistant-Einstiegspunkte
  - H2: Benachrichtigungsweiterleitung
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
  - H2: Updates und Backups
  - H2: Fehlerbehebung

## platforms/index.md

- Route: /platforms
- Überschriften:
  - H2: Ihr Betriebssystem auswählen
  - H2: VPS und Hosting
  - H2: Häufige Links
  - H2: Gateway-Dienstinstallation (CLI)
  - H2: Verwandte Themen

## platforms/ios.md

- Route: /platforms/ios
- Überschriften:
  - H2: Was es tut
  - H2: Anforderungen
  - H2: Schnellstart (pairen + verbinden)
  - H2: Relay-gestützter Push für offizielle Builds
  - H2: Hintergrund-Alive-Beacons
  - H2: Authentifizierung und Vertrauensfluss
  - H2: Erkennungspfade
  - H3: Bonjour (LAN)
  - H3: Tailnet (netzwerkübergreifend)
  - H3: Manueller Host/Port
  - H2: Canvas + A2UI
  - H2: Beziehung zu Computer Use
  - H3: Canvas eval / Snapshot
  - H2: Voice Wake + Sprechmodus
  - H2: Häufige Fehler
  - H2: Verwandte Dokumentation

## platforms/linux.md

- Route: /platforms/linux
- Überschriften:
  - H2: Schneller Einstieg für Anfänger (VPS)
  - H2: Installieren
  - H2: Gateway
  - H2: Gateway-Dienstinstallation (CLI)
  - H2: Systemsteuerung (systemd-Benutzereinheit)
  - H2: Speicherdruck und OOM-Kills
  - H2: Verwandte Themen

## platforms/mac/bundled-gateway.md

- Route: /platforms/mac/bundled-gateway
- Überschriften:
  - H2: Automatische Einrichtung
  - H2: Manuelle Wiederherstellung
  - H2: Launchd (Gateway als LaunchAgent)
  - H2: Versionskompatibilität
  - H2: Zustandsverzeichnis unter macOS
  - H2: App-Konnektivität debuggen
  - H2: Smoke Check
  - H2: Verwandte Themen

## platforms/mac/canvas.md

- Route: /platforms/mac/canvas
- Überschriften:
  - H2: Speicherort von Canvas
  - H2: Panel-Verhalten
  - H2: Agent-API-Oberfläche
  - H2: A2UI in Canvas
  - H3: A2UI-Befehle (v0.8)
  - H2: Agent-Läufe aus Canvas auslösen
  - H2: Sicherheitshinweise
  - H2: Verwandte Themen

## platforms/mac/child-process.md

- Route: /platforms/mac/child-process
- Überschriften:
  - H2: Standardverhalten (launchd)
  - H2: Nicht signierte Dev-Builds
  - H2: Nur-Anhängen-Modus
  - H2: Remote-Modus
  - H2: Warum wir launchd bevorzugen
  - H2: Verwandte Themen

## platforms/mac/dev-setup.md

- Route: /platforms/mac/dev-setup
- Überschriften:
  - H1: macOS-Entwicklereinrichtung
  - H2: Voraussetzungen
  - H2: 1. Abhängigkeiten installieren
  - H2: 2. App erstellen und paketieren
  - H2: 3. CLI und Gateway installieren
  - H2: Fehlerbehebung
  - H3: Build schlägt fehl: Toolchain- oder SDK-Abweichung
  - H3: App stürzt beim Erteilen von Berechtigungen ab
  - H3: Gateway bleibt dauerhaft bei „Starting...“
  - H2: Verwandte Themen

## platforms/mac/health.md

- Route: /platforms/mac/health
- Überschriften:
  - H1: Integritätsprüfungen unter macOS
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
  - H2: Fortlaufendes Diagnose-Dateiprotokoll (Debug-Bereich)
  - H2: Private Daten im Unified Logging unter macOS
  - H2: Für OpenClaw aktivieren (ai.openclaw)
  - H2: Nach dem Debugging deaktivieren
  - H2: Verwandte Themen

## platforms/mac/menu-bar.md

- Route: /platforms/mac/menu-bar
- Überschriften:
  - H2: Was angezeigt wird
  - H2: Zustandsmodell
  - H2: IconState-Enum (Swift)
  - H3: ActivityKind → Symbol
  - H3: Visuelle Zuordnung
  - H2: Kontext-Untermenü
  - H2: Statuszeilentext (Menü)
  - H2: Ereignisaufnahme
  - H2: Debug-Override
  - H2: Test-Checkliste
  - H2: Verwandte Themen

## platforms/mac/peekaboo.md

- Route: /platforms/mac/peekaboo
- Überschriften:
  - H2: Was dies ist (und was nicht)
  - H2: Beziehung zu Computer Use
  - H2: Bridge aktivieren
  - H2: Client-Erkennungsreihenfolge
  - H2: Sicherheit und Berechtigungen
  - H2: Snapshot-Verhalten (Automatisierung)
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## platforms/mac/permissions.md

- Route: /platforms/mac/permissions
- Überschriften:
  - H2: Anforderungen für stabile Berechtigungen
  - H2: Bedienungshilfen-Freigaben für Node- und CLI-Runtimes
  - H2: Wiederherstellungs-Checkliste, wenn Aufforderungen verschwinden
  - H2: Berechtigungen für Dateien und Ordner (Desktop/Dokumente/Downloads)
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
  - H1: Voice-Overlay-Lebenszyklus (macOS)
  - H2: Aktuelle Absicht
  - H2: Implementiert (9. Dez. 2025)
  - H2: Nächste Schritte
  - H2: Debugging-Checkliste
  - H2: Migrationsschritte (vorgeschlagen)
  - H2: Verwandte Themen

## platforms/mac/voicewake.md

- Route: /platforms/mac/voicewake
- Überschriften:
  - H1: Voice Wake &amp; Push-to-Talk
  - H2: Anforderungen
  - H2: Modi
  - H2: Laufzeitverhalten (Wake-Word)
  - H2: Lebenszyklus-Invarianten
  - H2: Fehlerzustand mit haftendem Overlay (vorher)
  - H2: Push-to-Talk-spezifische Details
  - H2: Nutzerseitige Einstellungen
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
  - H1: OpenClaw macOS-IPC-Architektur
  - H2: Ziele
  - H2: Funktionsweise
  - H3: Gateway + Node-Transport
  - H3: Node-Dienst + App-IPC
  - H3: PeekabooBridge (UI-Automatisierung)
  - H2: Betriebsabläufe
  - H2: Härtungshinweise
  - H2: Verwandte Themen

## platforms/macos.md

- Route: /platforms/macos
- Überschriften:
  - H2: Download
  - H2: Erster Start
  - H2: Gateway-Modus auswählen
  - H2: Wofür die App zuständig ist
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
  - H2: Gateway-Autostart vor der Windows-Anmeldung
  - H2: WSL-Dienste über LAN bereitstellen
  - H2: Fehlerbehebung
  - H3: Das Tray-Symbol wird nicht angezeigt
  - H3: Lokale Einrichtung schlägt fehl
  - H3: Die App meldet, dass Kopplung erforderlich ist
  - H3: Web-Chat kann einen Remote-Gateway nicht erreichen
  - H3: screen.snapshot-, Kamera- oder Audiobefehle schlagen fehl
  - H3: Git- oder GitHub-Konnektivität schlägt fehl
  - H2: Verwandte Themen

## plugins/adding-capabilities.md

- Route: /plugins/adding-capabilities
- Überschriften:
  - H2: Wann eine Capability erstellt werden sollte
  - H2: Die Standardsequenz
  - H2: Was wohin gehört
  - H2: Provider- und Harness-Seams
  - H2: Datei-Checkliste
  - H2: Ausgearbeitetes Beispiel: Bildgenerierung
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
  - H2: Lade-Pipeline
  - H3: Manifest-First-Verhalten
  - H3: Plugin-Cache-Grenze
  - H2: Registry-Modell
  - H2: Callbacks für Gesprächsbindung
  - H2: Provider-Runtime-Hooks
  - H3: Hook-Reihenfolge und Verwendung
  - H3: Provider-Beispiel
  - H3: Integrierte Beispiele
  - H2: Runtime-Helfer
  - H3: api.runtime.imageGeneration
  - H2: Gateway-HTTP-Routen
  - H2: Importpfade des Plugin-SDK
  - H2: Nachrichten-Tool-Schemas
  - H2: Auflösung von Kanalzielen
  - H2: Konfigurationsgestützte Verzeichnisse
  - H2: Provider-Kataloge
  - H2: Schreibgeschützte Kanalinspektion
  - H2: Paket-Packs
  - H3: Metadaten des Kanalkatalogs
  - H2: Context-Engine-Plugins
  - H2: Eine neue Capability hinzufügen
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
  - H2: Architekturübersicht
  - H3: Plugin-Metadaten-Snapshot und Lookup-Tabelle
  - H3: Aktivierungsplanung
  - H3: Kanal-Plugins und das gemeinsame Nachrichten-Tool
  - H2: Capability-Zuständigkeitsmodell
  - H3: Capability-Schichtung
  - H3: Beispiel für ein Multi-Capability-Unternehmens-Plugin
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
  - H2: Was OpenClaw aus Bundles abbildet
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
  - H2: Wofür das Plugin zuständig ist
  - H2: Minimales Backend-Plugin
  - H2: Konfigurationsform
  - H2: Erweiterte Backend-Hooks
  - H3: ownsNativeCompaction: Opt-out aus der OpenClaw-Compaction
  - H2: MCP-Tool-Bridge
  - H2: Nutzerkonfiguration
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
  - H2: Authentifizierungs- und Umgebungsisolation
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
  - H2: V1-Support-Vertrag
  - H2: Native Berechtigungen und MCP-Elicitations
  - H2: Queue-Steuerung
  - H2: Codex-Feedback-Upload
  - H2: Compaction und Transcript-Spiegelung
  - H2: Medien und Zustellung
  - H2: Verwandte Themen

## plugins/codex-harness.md

- Route: /plugins/codex-harness
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Threads mit Codex Desktop und CLI teilen
  - H2: Konfiguration
  - H2: Codex-Runtime verifizieren
  - H2: Routing und Modellauswahl
  - H2: Bereitstellungsmuster
  - H3: Einfache Codex-Bereitstellung
  - H3: Gemischte Provider-Bereitstellung
  - H3: Fail-closed-Codex-Bereitstellung
  - H2: App-Server-Richtlinie
  - H2: Befehle und Diagnosen
  - H3: Codex-Threads lokal prüfen
  - H2: Native Codex-Plugins
  - H2: Computer Use
  - H2: Runtime-Grenzen
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## plugins/codex-native-plugins.md

- Route: /plugins/codex-native-plugins
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Plugins aus dem Chat verwalten
  - H2: Funktionsweise der Einrichtung nativer Plugins
  - H2: V1-Support-Grenze
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
  - H3: Maintainer-Akzeptanzlane
  - H2: Deprecation-Richtlinie
  - H2: Aktuelle Kompatibilitätsbereiche
  - H3: WhatsApp Inbound Callback Flat Aliases
  - H3: WhatsApp Inbound Admission Fields
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
  - H2: Installations-Roots
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
  - H3: Google-Anmeldedaten erstellen
  - H3: Refresh-Token ausstellen
  - H3: OAuth mit doctor verifizieren
  - H2: Konfiguration
  - H2: Werkzeug
  - H2: Agent- und Bidi-Modi
  - H2: Checkliste für Live-Tests
  - H2: Fehlerbehebung
  - H3: Agent kann das Google Meet-Werkzeug nicht sehen
  - H3: Kein verbundener Google Meet-fähiger Node
  - H3: Browser wird geöffnet, aber Agent kann nicht beitreten
  - H3: Meeting-Erstellung schlägt fehl
  - H3: Agent tritt bei, spricht aber nicht
  - H3: Twilio-Einrichtungsprüfungen schlagen fehl
  - H3: Twilio-Anruf startet, tritt dem Meeting aber nie bei
  - H2: Hinweise
  - H2: Verwandt

## plugins/hooks.md

- Route: /plugins/hooks
- Überschriften:
  - H2: Schnellstart
  - H2: Hook-Katalog
  - H2: Runtime-Hooks debuggen
  - H2: Richtlinie für Werkzeugaufrufe
  - H3: Hook für Ausführungsumgebung
  - H3: Persistenz von Werkzeugergebnissen
  - H2: Prompt- und Modell-Hooks
  - H3: Sitzungserweiterungen und Injektionen für den nächsten Turn
  - H2: Nachrichten-Hooks
  - H2: Hooks installieren
  - H2: Gateway-Lebenszyklus
  - H2: Bevorstehende Veraltungen
  - H2: Verwandt

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
  - H2: Neu starten und inspizieren
  - H2: Plugins aktualisieren
  - H2: Plugins deinstallieren
  - H2: Quelle auswählen
  - H2: Plugins veröffentlichen
  - H2: Verwandt

## plugins/manifest.md

- Route: /plugins/manifest
- Überschriften:
  - H2: Was diese Datei bewirkt
  - H2: Minimales Beispiel
  - H2: Umfangreiches Beispiel
  - H2: Referenz für Felder der obersten Ebene
  - H2: Referenz für Metadaten von Generierungs-Providern
  - H2: Referenz für Werkzeugmetadaten
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
  - H2: Erkennungsrangfolge (doppelte Plugin-IDs)
  - H2: JSON-Schema-Anforderungen
  - H2: Validierungsverhalten
  - H2: Hinweise
  - H2: Verwandt

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
  - H2: Verwandt

## plugins/memory-wiki.md

- Route: /plugins/memory-wiki
- Überschriften:
  - H2: Was es hinzufügt
  - H2: Wie es zu Memory passt
  - H2: Empfohlenes Hybridmuster
  - H2: Vault-Modi
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Vault-Layout
  - H2: Open Knowledge Format-Importe
  - H2: Strukturierte Behauptungen und Nachweise
  - H2: Agent-seitige Entitätsmetadaten
  - H2: Compile-Pipeline
  - H2: Dashboards und Zustandsberichte
  - H2: Suche und Retrieval
  - H2: Agent-Werkzeuge
  - H2: Prompt- und Kontextverhalten
  - H2: Konfiguration
  - H3: Beispiel: QMD + bridge-Modus
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
  - H2: Core-Renderfluss
  - H2: Degradationsregeln
  - H3: Sichtbarkeit des Button-Wert-Fallbacks
  - H2: Provider-Zuordnung
  - H2: Presentation vs InteractiveReply
  - H2: Delivery-Pin
  - H2: Checkliste für Plugin-Autoren
  - H2: Verwandte Dokumentation

## plugins/oc-path.md

- Route: /plugins/oc-path
- Überschriften:
  - H2: Warum aktivieren
  - H2: Wo es läuft
  - H2: Aktivieren
  - H2: Abhängigkeiten
  - H2: Was es bereitstellt
  - H2: Beziehung zu anderen Plugins
  - H2: Sicherheit
  - H2: Verwandt

## plugins/plugin-inventory.md

- Route: /plugins/plugin-inventory
- Überschriften:
  - H1: Plugin-Bestand
  - H2: Definitionen
  - H2: Plugin installieren
  - H2: Core-npm-Paket
  - H2: Offizielle externe Pakete
  - H2: Nur Source-Checkout

## plugins/plugin-permission-requests.md

- Route: /plugins/plugin-permission-requests
- Überschriften:
  - H2: Das richtige Gate auswählen
  - H2: Vor einem Werkzeugaufruf Genehmigung anfordern
  - H2: Entscheidungsverhalten
  - H2: Genehmigungs-Prompts weiterleiten
  - H2: Native Codex-Berechtigungen
  - H2: Fehlerbehebung
  - H2: Verwandt

## plugins/reference.md

- Route: /plugins/reference
- Überschriften:
  - H1: Plugin-Referenz

## plugins/reference/acpx.md

- Route: /plugins/reference/acpx
- Überschriften:
  - H1: ACPx-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/admin-http-rpc.md

- Route: /plugins/reference/admin-http-rpc
- Überschriften:
  - H1: Admin-Http-Rpc-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/alibaba.md

- Route: /plugins/reference/alibaba
- Überschriften:
  - H1: Alibaba-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/amazon-bedrock-mantle.md

- Route: /plugins/reference/amazon-bedrock-mantle
- Überschriften:
  - H1: Amazon Bedrock Mantle-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/amazon-bedrock.md

- Route: /plugins/reference/amazon-bedrock
- Überschriften:
  - H1: Amazon Bedrock-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/anthropic-vertex.md

- Route: /plugins/reference/anthropic-vertex
- Überschriften:
  - H1: Anthropic Vertex-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Route: /plugins/reference/anthropic
- Überschriften:
  - H1: Anthropic-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/arcee.md

- Route: /plugins/reference/arcee
- Überschriften:
  - H1: Arcee-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/azure-speech.md

- Route: /plugins/reference/azure-speech
- Überschriften:
  - H1: Azure Speech-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/bonjour.md

- Route: /plugins/reference/bonjour
- Überschriften:
  - H1: Bonjour-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/brave.md

- Route: /plugins/reference/brave
- Überschriften:
  - H1: Brave-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/browser.md

- Route: /plugins/reference/browser
- Überschriften:
  - H1: Browser-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/byteplus.md

- Route: /plugins/reference/byteplus
- Überschriften:
  - H1: BytePlus-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/canvas.md

- Route: /plugins/reference/canvas
- Überschriften:
  - H1: Canvas-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/cerebras.md

- Route: /plugins/reference/cerebras
- Überschriften:
  - H1: Cerebras-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/chutes.md

- Route: /plugins/reference/chutes
- Überschriften:
  - H1: Chutes-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/clawrouter.md

- Route: /plugins/reference/clawrouter
- Überschriften:
  - H1: ClawRouter-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/clickclack.md

- Route: /plugins/reference/clickclack
- Überschriften:
  - H1: Clickclack-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/cloudflare-ai-gateway.md

- Route: /plugins/reference/cloudflare-ai-gateway
- Überschriften:
  - H1: Cloudflare AI Gateway-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/codex-supervisor.md

- Route: /plugins/reference/codex-supervisor
- Überschriften:
  - H1: Codex Supervisor-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Sitzungsauflistung

## plugins/reference/codex.md

- Route: /plugins/reference/codex
- Überschriften:
  - H1: Codex-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/cohere.md

- Route: /plugins/reference/cohere
- Überschriften:
  - H1: Cohere-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/comfy.md

- Route: /plugins/reference/comfy
- Überschriften:
  - H1: ComfyUI-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/copilot-proxy.md

- Route: /plugins/reference/copilot-proxy
- Überschriften:
  - H1: Copilot Proxy-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/copilot.md

- Route: /plugins/reference/copilot
- Überschriften:
  - H1: Copilot-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/deepgram.md

- Route: /plugins/reference/deepgram
- Überschriften:
  - H1: Deepgram-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/deepinfra.md

- Route: /plugins/reference/deepinfra
- Überschriften:
  - H1: DeepInfra-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/deepseek.md

- Route: /plugins/reference/deepseek
- Überschriften:
  - H1: DeepSeek-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/diagnostics-otel.md

- Route: /plugins/reference/diagnostics-otel
- Überschriften:
  - H1: Diagnostics OpenTelemetry-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/diagnostics-prometheus.md

- Route: /plugins/reference/diagnostics-prometheus
- Überschriften:
  - H1: Diagnostics Prometheus-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/diffs-language-pack.md

- Route: /plugins/reference/diffs-language-pack
- Überschriften:
  - H1: Diffs Language Pack-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Hinzugefügte Sprachen

## plugins/reference/diffs.md

- Route: /plugins/reference/diffs
- Überschriften:
  - H1: Diffs-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/discord.md

- Route: /plugins/reference/discord
- Überschriften:
  - H1: Discord-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/document-extract.md

- Route: /plugins/reference/document-extract
- Überschriften:
  - H1: Document Extract-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/duckduckgo.md

- Route: /plugins/reference/duckduckgo
- Überschriften:
  - H1: DuckDuckGo-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/elevenlabs.md

- Route: /plugins/reference/elevenlabs
- Überschriften:
  - H1: Elevenlabs-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/exa.md

- Route: /plugins/reference/exa
- Überschriften:
  - H1: Exa-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/fal.md

- Route: /plugins/reference/fal
- Überschriften:
  - H1: fal-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/feishu.md

- Route: /plugins/reference/feishu
- Überschriften:
  - H1: Feishu-Plugin
  - H2: Distribution
  - H2: Schnittstelle
  - H2: Verwandte Dokumentation

## plugins/reference/file-transfer.md

- Route: /plugins/reference/file-transfer
- Überschriften:
  - H1: File Transfer-Plugin
  - H2: Distribution
  - H2: Schnittstelle

## plugins/reference/firecrawl.md

- Route: /plugins/reference/firecrawl
- Überschriften:
  - H1: Firecrawl Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/fireworks.md

- Route: /plugins/reference/fireworks
- Überschriften:
  - H1: Fireworks Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/github-copilot.md

- Route: /plugins/reference/github-copilot
- Überschriften:
  - H1: GitHub Copilot Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/gmi.md

- Route: /plugins/reference/gmi
- Überschriften:
  - H1: Gmi Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/google-meet.md

- Route: /plugins/reference/google-meet
- Überschriften:
  - H1: Google Meet Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/google.md

- Route: /plugins/reference/google
- Überschriften:
  - H1: Google Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/googlechat.md

- Route: /plugins/reference/googlechat
- Überschriften:
  - H1: Google Chat Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/gradium.md

- Route: /plugins/reference/gradium
- Überschriften:
  - H1: Gradium Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/groq.md

- Route: /plugins/reference/groq
- Überschriften:
  - H1: Groq Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/huggingface.md

- Route: /plugins/reference/huggingface
- Überschriften:
  - H1: Hugging Face Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/imessage.md

- Route: /plugins/reference/imessage
- Überschriften:
  - H1: iMessage Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/inworld.md

- Route: /plugins/reference/inworld
- Überschriften:
  - H1: Inworld Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/irc.md

- Route: /plugins/reference/irc
- Überschriften:
  - H1: IRC Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/kilocode.md

- Route: /plugins/reference/kilocode
- Überschriften:
  - H1: Kilocode Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/kimi.md

- Route: /plugins/reference/kimi
- Überschriften:
  - H1: Kimi Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/line.md

- Route: /plugins/reference/line
- Überschriften:
  - H1: LINE Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/litellm.md

- Route: /plugins/reference/litellm
- Überschriften:
  - H1: LiteLLM Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/llama-cpp.md

- Route: /plugins/reference/llama-cpp
- Überschriften:
  - H1: Llama Cpp Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/llm-task.md

- Route: /plugins/reference/llm-task
- Überschriften:
  - H1: LLM Task Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/lmstudio.md

- Route: /plugins/reference/lmstudio
- Überschriften:
  - H1: LM Studio Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/lobster.md

- Route: /plugins/reference/lobster
- Überschriften:
  - H1: Lobster Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/matrix.md

- Route: /plugins/reference/matrix
- Überschriften:
  - H1: Matrix Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/mattermost.md

- Route: /plugins/reference/mattermost
- Überschriften:
  - H1: Mattermost Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/memory-core.md

- Route: /plugins/reference/memory-core
- Überschriften:
  - H1: Memory Core Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/memory-lancedb.md

- Route: /plugins/reference/memory-lancedb
- Überschriften:
  - H1: Memory Lancedb Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/memory-wiki.md

- Route: /plugins/reference/memory-wiki
- Überschriften:
  - H1: Memory Wiki Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/microsoft-foundry.md

- Route: /plugins/reference/microsoft-foundry
- Überschriften:
  - H1: Microsoft Foundry Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Anforderungen
  - H2: Chatmodelle
  - H2: MAI-Bildgenerierung
  - H2: Fehlerbehebung

## plugins/reference/microsoft.md

- Route: /plugins/reference/microsoft
- Überschriften:
  - H1: Microsoft Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/migrate-claude.md

- Route: /plugins/reference/migrate-claude
- Überschriften:
  - H1: Claude-Migrations-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/migrate-hermes.md

- Route: /plugins/reference/migrate-hermes
- Überschriften:
  - H1: Hermes-Migrations-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/minimax.md

- Route: /plugins/reference/minimax
- Überschriften:
  - H1: MiniMax Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/mistral.md

- Route: /plugins/reference/mistral
- Überschriften:
  - H1: Mistral Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/moonshot.md

- Route: /plugins/reference/moonshot
- Überschriften:
  - H1: Moonshot Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/msteams.md

- Route: /plugins/reference/msteams
- Überschriften:
  - H1: Microsoft Teams Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/nextcloud-talk.md

- Route: /plugins/reference/nextcloud-talk
- Überschriften:
  - H1: Nextcloud Talk Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/nostr.md

- Route: /plugins/reference/nostr
- Überschriften:
  - H1: Nostr Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/novita.md

- Route: /plugins/reference/novita
- Überschriften:
  - H1: Novita Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/nvidia.md

- Route: /plugins/reference/nvidia
- Überschriften:
  - H1: NVIDIA Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/oc-path.md

- Route: /plugins/reference/oc-path
- Überschriften:
  - H1: Oc Path Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/ollama.md

- Route: /plugins/reference/ollama
- Überschriften:
  - H1: Ollama Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/open-prose.md

- Route: /plugins/reference/open-prose
- Überschriften:
  - H1: Open Prose Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/openai.md

- Route: /plugins/reference/openai
- Überschriften:
  - H1: OpenAI Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/opencode-go.md

- Route: /plugins/reference/opencode-go
- Überschriften:
  - H1: OpenCode Go Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/opencode.md

- Route: /plugins/reference/opencode
- Überschriften:
  - H1: OpenCode Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/openrouter.md

- Route: /plugins/reference/openrouter
- Überschriften:
  - H1: OpenRouter Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/openshell.md

- Route: /plugins/reference/openshell
- Überschriften:
  - H1: Openshell Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/perplexity.md

- Route: /plugins/reference/perplexity
- Überschriften:
  - H1: Perplexity Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/pixverse.md

- Route: /plugins/reference/pixverse
- Überschriften:
  - H1: PixVerse Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/policy.md

- Route: /plugins/reference/policy
- Überschriften:
  - H1: Policy Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verhalten
  - H2: Verwandte Dokumentation

## plugins/reference/qa-channel.md

- Route: /plugins/reference/qa-channel
- Überschriften:
  - H1: QA Channel Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/qa-lab.md

- Route: /plugins/reference/qa-lab
- Überschriften:
  - H1: QA Lab Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/qa-matrix.md

- Route: /plugins/reference/qa-matrix
- Überschriften:
  - H1: QA Matrix Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/qianfan.md

- Route: /plugins/reference/qianfan
- Überschriften:
  - H1: Qianfan Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/qqbot.md

- Route: /plugins/reference/qqbot
- Überschriften:
  - H1: QQ Bot Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/qwen.md

- Route: /plugins/reference/qwen
- Überschriften:
  - H1: Qwen Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/raft.md

- Route: /plugins/reference/raft
- Überschriften:
  - H1: Raft Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/runway.md

- Route: /plugins/reference/runway
- Überschriften:
  - H1: Runway Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/searxng.md

- Route: /plugins/reference/searxng
- Überschriften:
  - H1: SearXNG Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/senseaudio.md

- Route: /plugins/reference/senseaudio
- Überschriften:
  - H1: Senseaudio Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/sglang.md

- Route: /plugins/reference/sglang
- Überschriften:
  - H1: SGLang Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/signal.md

- Route: /plugins/reference/signal
- Überschriften:
  - H1: Signal Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/slack.md

- Route: /plugins/reference/slack
- Überschriften:
  - H1: Slack Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/sms.md

- Route: /plugins/reference/sms
- Überschriften:
  - H1: SMS Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/stepfun.md

- Route: /plugins/reference/stepfun
- Überschriften:
  - H1: StepFun Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/synology-chat.md

- Route: /plugins/reference/synology-chat
- Überschriften:
  - H1: Synology Chat Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/synthetic.md

- Route: /plugins/reference/synthetic
- Überschriften:
  - H1: Synthetic Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tavily.md

- Route: /plugins/reference/tavily
- Überschriften:
  - H1: Tavily Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/telegram.md

- Route: /plugins/reference/telegram
- Überschriften:
  - H1: Telegram Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tencent.md

- Route: /plugins/reference/tencent
- Überschriften:
  - H1: Tencent Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tlon.md

- Route: /plugins/reference/tlon
- Überschriften:
  - H1: Tlon Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/together.md

- Route: /plugins/reference/together
- Überschriften:
  - H1: Together Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tokenjuice.md

- Route: /plugins/reference/tokenjuice
- Überschriften:
  - H1: Tokenjuice Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Verwandte Dokumentation

## plugins/reference/tts-local-cli.md

- Route: /plugins/reference/tts-local-cli
- Überschriften:
  - H1: TTS Local CLI Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/twitch.md

- Route: /plugins/reference/twitch
- Überschriften:
  - H1: Twitch-Plugin
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
  - H1: Vercel AI Gateway-Plugin
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
  - H1: Voice Call-Plugin
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
  - H1: Web Readability-Plugin
  - H2: Distribution
  - H2: Oberfläche

## plugins/reference/webhooks.md

- Route: /plugins/reference/webhooks
- Überschriften:
  - H1: Webhooks-Plugin
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
  - H1: Zalo Personal-Plugin
  - H2: Distribution
  - H2: Oberfläche
  - H2: Zugehörige Dokumentation

## plugins/sdk-agent-harness.md

- Route: /plugins/sdk-agent-harness
- Überschriften:
  - H2: Wann Sie ein Harness verwenden sollten
  - H2: Was weiterhin dem Core gehört
  - H2: Ein Harness registrieren
  - H2: Auswahlrichtlinie
  - H2: Provider- und Harness-Kopplung
  - H3: Middleware für Tool-Ergebnisse
  - H3: Klassifizierung des Terminal-Ergebnisses
  - H3: Nebenwirkungen beim Agentenende
  - H3: Benutzereingaben und Tool-Oberflächen
  - H3: Nativer Codex-Harness-Modus
  - H2: Runtime-Striktheit
  - H2: Native Sitzungen und Transkriptspiegel
  - H2: Tool- und Medienergebnisse
  - H2: Aktuelle Einschränkungen
  - H2: Zugehöriges

## plugins/sdk-channel-inbound.md

- Route: /plugins/sdk-channel-inbound
- Überschriften:
  - H2: Core-Hilfsfunktionen
  - H2: Migration

## plugins/sdk-channel-ingress.md

- Route: /plugins/sdk-channel-ingress
- Überschriften:
  - H1: Channel-Ingress-API
  - H2: Runtime-Resolver
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
  - H2: Bestehende Outbound-Adapter
  - H2: Dauerhafte Sendungen
  - H2: Kompatibilitäts-Dispatch

## plugins/sdk-channel-plugins.md

- Route: /plugins/sdk-channel-plugins
- Überschriften:
  - H2: Wie Channel-Plugins funktionieren
  - H2: Genehmigungen und Channel-Fähigkeiten
  - H2: Inbound-Erwähnungsrichtlinie
  - H2: Schritt-für-Schritt-Anleitung
  - H2: Dateistruktur
  - H2: Fortgeschrittene Themen
  - H2: Nächste Schritte
  - H2: Zugehöriges

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
  - H2: Zugehöriges

## plugins/sdk-migration.md

- Route: /plugins/sdk-migration
- Überschriften:
  - H2: Was sich ändert
  - H2: Warum sich dies geändert hat
  - H2: Migrationsplan für Sprache und Echtzeit-Voice
  - H2: Kompatibilitätsrichtlinie
  - H2: So migrieren Sie
  - H2: Importpfadreferenz
  - H2: Aktive Veraltungen
  - H2: Zeitplan für Entfernung
  - H2: Warnungen vorübergehend unterdrücken
  - H2: Zugehöriges

## plugins/sdk-overview.md

- Route: /plugins/sdk-overview
- Überschriften:
  - H2: Importkonvention
  - H2: Subpfadreferenz
  - H2: Registrierungs-API
  - H3: Fähigkeitsregistrierung
  - H3: Tools und Befehle
  - H3: Infrastruktur
  - H3: Host-Hooks für Workflow-Plugins
  - H3: Gateway-Discovery-Registrierung
  - H3: CLI-Registrierungsmetadaten
  - H3: CLI-Backend-Registrierung
  - H3: Exklusive Slots
  - H3: Veraltete Memory-Embedding-Adapter
  - H3: Ereignisse und Lebenszyklus
  - H3: Semantik von Hook-Entscheidungen
  - H3: Felder des API-Objekts
  - H2: Interne Modulkonvention
  - H2: Zugehöriges

## plugins/sdk-provider-plugins.md

- Route: /plugins/sdk-provider-plugins
- Überschriften:
  - H2: Schritt-für-Schritt-Anleitung
  - H2: In ClawHub veröffentlichen
  - H2: Dateistruktur
  - H2: Referenz zur Katalogreihenfolge
  - H2: Nächste Schritte
  - H2: Zugehöriges

## plugins/sdk-runtime.md

- Route: /plugins/sdk-runtime
- Überschriften:
  - H2: Laden und Schreiben der Konfiguration
  - H2: Wiederverwendbare Runtime-Hilfsprogramme
  - H2: Runtime-Namespaces
  - H2: Runtime-Referenzen speichern
  - H2: Weitere API-Felder der obersten Ebene
  - H2: Zugehöriges

## plugins/sdk-setup.md

- Route: /plugins/sdk-setup
- Überschriften:
  - H2: Paketmetadaten
  - H3: openclaw-Felder
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Verzögertes vollständiges Laden
  - H2: Plugin-Manifest
  - H2: Veröffentlichung in ClawHub
  - H2: Setup-Einstieg
  - H3: Schlanke Setup-Hilfsimporte
  - H3: Channel-eigene Einzelkonto-Hochstufung
  - H2: Konfigurationsschema
  - H3: Channel-Konfigurationsschemas erstellen
  - H2: Setup-Assistenten
  - H2: Veröffentlichen und Installieren
  - H2: Zugehöriges

## plugins/sdk-subpaths.md

- Route: /plugins/sdk-subpaths
- Überschriften:
  - H2: Plugin-Einstieg
  - H3: Veraltete Kompatibilitäts- und Testhilfen
  - H3: Reservierte Hilfssubpfade für gebündelte Plugins
  - H2: Zugehöriges

## plugins/sdk-testing.md

- Route: /plugins/sdk-testing
- Überschriften:
  - H2: Testhilfsprogramme
  - H3: Verfügbare Exporte
  - H3: Typen
  - H2: Zielauflösung testen
  - H2: Testmuster
  - H3: Registrierungskontrakte testen
  - H3: Runtime-Konfigurationszugriff testen
  - H3: Unit-Test eines Channel-Plugins
  - H3: Unit-Test eines Provider-Plugins
  - H3: Plugin-Runtime mocken
  - H3: Mit instanzspezifischen Stubs testen
  - H2: Kontrakttests (repo-interne Plugins)
  - H3: Bereichsbezogene Tests ausführen
  - H2: Lint-Erzwingung (repo-interne Plugins)
  - H2: Testkonfiguration
  - H2: Zugehöriges

## plugins/tool-plugins.md

- Route: /plugins/tool-plugins
- Überschriften:
  - H2: Anforderungen
  - H2: Schnellstart
  - H2: Ein Tool schreiben
  - H2: Optionale und Factory-Tools
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
  - H2: Sitzungsbereich
  - H2: Echtzeit-Sprachgespräche
  - H3: Tool-Richtlinie
  - H3: Agenten-Voice-Kontext
  - H3: Beispiele für Echtzeit-Provider
  - H2: Streaming-Transkription
  - H3: Beispiele für Streaming-Provider
  - H2: TTS für Anrufe
  - H3: TTS-Beispiele
  - H2: Eingehende Anrufe
  - H3: Routing pro Nummer
  - H3: Kontrakt für gesprochene Ausgabe
  - H3: Verhalten beim Gesprächsstart
  - H3: Karenzzeit für Twilio-Stream-Trennung
  - H2: Reaper für veraltete Anrufe
  - H2: Webhook-Sicherheit
  - H2: CLI
  - H2: Agenten-Tool
  - H2: Gateway-RPC
  - H2: Fehlerbehebung
  - H3: Setup schlägt bei Webhook-Verfügbarkeit fehl
  - H3: Provider-Anmeldedaten schlagen fehl
  - H3: Anrufe starten, aber Provider-Webhooks kommen nicht an
  - H3: Signaturverifizierung schlägt fehl
  - H3: Google Meet-Twilio-Beitritte schlagen fehl
  - H3: Echtzeitanruf hat keine Sprache
  - H2: Zugehöriges

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
  - H2: Zugehörige Dokumentation

## plugins/workboard.md

- Route: /plugins/workboard
- Überschriften:
  - H2: Standardzustand
  - H2: Was Karten enthalten
  - H2: Kartenausführungen und Aufgaben
  - H2: Agentenkoordination
  - H3: Dispatch-Worker-Auswahl
  - H3: Worker-Prompt und Lebenszyklus
  - H3: Dispatch-Einstiegspunkte
  - H2: CLI und Slash-Befehl
  - H2: Synchronisierung des Sitzungslebenszyklus
  - H2: Dashboard-Workflow
  - H2: Berechtigungen
  - H2: Konfiguration
  - H2: Fehlerbehebung
  - H3: Der Tab sagt, dass Workboard nicht verfügbar ist
  - H3: Karten werden nicht gespeichert
  - H3: Das Starten einer Karte öffnet nicht die erwartete Sitzung
  - H3: Dispatch startet keinen Worker
  - H2: Zugehöriges

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
  - H2: Agenten-Tool
  - H2: Zugehöriges

## prose.md

- Route: /prose
- Überschriften:
  - H2: Installieren
  - H2: Slash-Befehl
  - H2: Was es kann
  - H2: Beispiel: parallele Recherche und Synthese
  - H2: OpenClaw-Runtime-Zuordnung
  - H2: Dateispeicherorte
  - H2: Status-Backends
  - H2: Sicherheit
  - H2: Zugehöriges

## providers/alibaba.md

- Route: /providers/alibaba
- Überschriften:
  - H2: Erste Schritte
  - H2: Integrierte Wan-Modelle
  - H2: Fähigkeiten und Grenzen
  - H2: Erweiterte Konfiguration
  - H2: Zugehöriges

## providers/anthropic.md

- Route: /providers/anthropic
- Überschriften:
  - H2: Erste Schritte
  - H2: Denk-Standardeinstellungen (Claude Fable 5, 4.8 und 4.6)
  - H2: Prompt-Caching
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Zugehöriges

## providers/arcee.md

- Route: /providers/arcee
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktives Setup
  - H2: Integrierter Katalog
  - H2: Unterstützte Funktionen
  - H2: Zugehöriges

## providers/azure-speech.md

- Route: /providers/azure-speech
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsoptionen
  - H2: Hinweise
  - H2: Zugehöriges

## providers/bedrock-mantle.md

- Route: /providers/bedrock-mantle
- Überschriften:
  - H2: Erste Schritte
  - H2: Automatische Modellerkennung
  - H3: Unterstützte Regionen
  - H2: Manuelle Konfiguration
  - H2: Erweiterte Konfiguration
  - H2: Zugehöriges

## providers/bedrock.md

- Route: /providers/bedrock
- Überschriften:
  - H2: Erste Schritte
  - H2: Automatische Modellerkennung
  - H2: Schnelleinrichtung (AWS-Pfad)
  - H2: Erweiterte Konfiguration
  - H2: Zugehöriges

## providers/cerebras.md

- Route: /providers/cerebras
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Nicht interaktives Setup
  - H2: Integrierter Katalog
  - H2: Manuelle Konfiguration
  - H2: Zugehöriges

## providers/chutes.md

- Route: /providers/chutes
- Überschriften:
  - H2: Plugin installieren
  - H2: Erste Schritte
  - H2: Discovery-Verhalten
  - H2: Standardaliase
  - H2: Integrierter Starterkatalog
  - H2: Konfigurationsbeispiel
  - H2: Zugehöriges

## providers/claude-max-api-proxy.md

- Route: /providers/claude-max-api-proxy
- Überschriften:
  - H2: Warum verwenden?
  - H2: Funktionsweise
  - H2: Erste Schritte
  - H2: Integrierter Katalog
  - H2: Erweiterte Konfiguration
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/clawrouter.md

- Route: /providers/clawrouter
- Überschriften:
  - H2: Erste Schritte
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
  - H2: Erste Schritte
  - H2: Einrichtung nur über Umgebung
  - H2: Verwandte Themen

## providers/comfy.md

- Route: /providers/comfy
- Überschriften:
  - H2: Unterstützter Funktionsumfang
  - H2: Erste Schritte
  - H2: Konfiguration
  - H3: Gemeinsame Schlüssel
  - H3: Capability-spezifische Schlüssel
  - H2: Workflow-Details
  - H2: Verwandte Themen

## providers/deepgram.md

- Route: /providers/deepgram
- Überschriften:
  - H2: Erste Schritte
  - H2: Konfigurationsoptionen
  - H2: Streaming-STT für Voice Calls
  - H2: Hinweise
  - H2: Verwandte Themen

## providers/deepinfra.md

- Route: /providers/deepinfra
- Überschriften:
  - H2: Plugin installieren
  - H2: API-Schlüssel abrufen
  - H2: CLI-Einrichtung
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
  - H2: Test
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
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Benutzerdefinierte Fireworks-Modell-IDs
  - H2: Verwandte Themen

## providers/github-copilot.md

- Route: /providers/github-copilot
- Überschriften:
  - H2: Drei Möglichkeiten, Copilot in OpenClaw zu verwenden
  - H2: Optionale Flags
  - H2: Nicht interaktives Onboarding
  - H2: Memory-Sucheinbettungen
  - H3: Konfiguration
  - H3: Funktionsweise
  - H2: Verwandte Themen

## providers/gmi.md

- Route: /providers/gmi
- Überschriften:
  - H2: Einrichtung
  - H2: Standardwerte
  - H2: Wann Sie GMI wählen sollten
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
  - H2: Einrichtung
  - H2: Konfiguration
  - H2: Stimmen
  - H3: Stimmüberschreibung pro Nachricht
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
  - H2: Vollständiges Konfigurationsbeispiel
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
  - H3: Streaming-Nutzungskompatibilität
  - H3: Thinking-Kompatibilität
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
  - H2: Streaming-STT für Voice Calls
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/models.md

- Route: /providers/models
- Überschriften:
  - H2: Schnellstart (zwei Schritte)
  - H2: Unterstützte Provider (Starterset)
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
  - H2: Wann Sie Novita wählen sollten
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
  - H2: Cloud-Modelle
  - H2: Modellerkennung (impliziter Provider)
  - H2: Node-lokale Inferenz
  - H2: Vision und Bildbeschreibung
  - H2: Konfiguration
  - H2: Häufige Rezepte
  - H3: Modellauswahl
  - H3: Schnelle Verifizierung
  - H2: Ollama Web Search
  - H2: Erweiterte Konfiguration
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## providers/openai.md

- Route: /providers/openai
- Überschriften:
  - H2: Schnellauswahl
  - H2: Namenszuordnung
  - H2: Eingeschränkte Vorschau für GPT-5.6
  - H2: OpenClaw-Funktionsabdeckung
  - H2: Memory-Einbettungen
  - H2: Erste Schritte
  - H2: Native Codex-App-Server-Authentifizierung
  - H2: Bildgenerierung
  - H2: Videogenerierung
  - H2: GPT-5-Prompt-Beitrag
  - H2: Stimme und Sprache
  - H2: Azure OpenAI-Endpunkte
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
  - H2: Fusion Router
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
  - H2: Unterschied zu Qwen
  - H2: Wann Sie Qwen OAuth / Portal wählen sollten
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
  - H2: Thinking Controls
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
  - H2: Nicht interaktive Einrichtung
  - H2: Integrierter Katalog
  - H2: Preisstaffelung
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
  - H2: Features
  - H2: Erste Schritte
  - H2: Modellauswahl
  - H2: DeepSeek V4-Wiedergabeverhalten
  - H2: Integrierter Katalog (insgesamt 41)
  - H2: Modellerkennung
  - H2: Streaming- und Tool-Unterstützung
  - H2: Preise
  - H3: Venice (anonymisiert) vs. direkte API
  - H2: Nutzungsbeispiele
  - H2: Fehlerbehebung
  - H2: Erweiterte Konfiguration
  - H2: Verwandte Themen

## providers/vercel-ai-gateway.md

- Route: /providers/vercel-ai-gateway
- Überschriften:
  - H2: Erste Schritte
  - H2: Nicht interaktives Beispiel
  - H2: Kurzform der Modell-ID
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
  - H2: Text-to-Speech
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
  - H2: Einrichtungspfad auswählen
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
  - H2: Token-Plan-Katalog
  - H2: Text-to-Speech
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
  - H2: Vertrag für Sitzungssichtbarkeit
  - H2: Migrationsplan
  - H3: Phase 1: Identität und Leases hinzufügen
  - H3: Phase 2: Lease-First-Bereinigung
  - H3: Phase 3: Lease-First-Startup-Reaping
  - H3: Phase 4: Sitzungsbesitz-Zeilen
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
  - H2: Aktueller Branch-Status
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
  - H3: Keine Regression einführen
  - H2: Annahmen aus dem Code-Read
  - H2: Erkenntnisse aus dem Code-Read
  - H2: Aktuelle Codestruktur
  - H2: Ziel-Schemastruktur
  - H2: Doctor-Migrationsstruktur
  - H2: Migrationsinventar
  - H2: Migrationsplan
  - H3: Phase 0: Grenze einfrieren
  - H3: Phase 1: Globale Control Plane fertigstellen
  - H3: Phase 2: Pro-Agent-Datenbanken einführen
  - H3: Phase 3: Session-Store-APIs ersetzen
  - H3: Phase 4: Transkripte, ACP-Streams, Trajektorien und VFS verschieben
  - H3: Phase 5: Sichern, Wiederherstellen, Vacuum und Verifizieren
  - H3: Phase 6: Worker-Runtime
  - H3: Phase 7: Alte Welt löschen
  - H2: Sichern und Wiederherstellen
  - H2: Runtime-Refaktorierungsplan
  - H2: Performance-Regeln
  - H2: Statische Verbote
  - H2: Erledigt-Kriterien

## refactor/ingress-core.md

- Route: /refactor/ingress-core
- Überschriften:
  - H1: Löschplan für den Ingress-Core
  - H2: Budget
  - H2: Diagnose
  - H2: Hotspots
  - H2: Aktueller Code-Read
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
  - H2: Erster Lauf (empfohlen)
  - H2: Sicherheitsstandards
  - H2: Vorprüfung vorhandener Lösungen
  - H2: Sitzungsstart (erforderlich)
  - H2: Seele (erforderlich)
  - H2: Geteilte Bereiche (empfohlen)
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
  - H2: Release-Kadenz
  - H2: Release-Operator-Checkliste
  - H2: Abschluss für stabiles main
  - H2: Release-Preflight
  - H2: Release-Testboxen
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Paket
  - H2: Automatisierung der Release-Veröffentlichung
  - H2: Eingaben für den NPM-Workflow
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
  - H3: 5) Websuchtool
  - H3: 5) Web-Fetch-Tool (Firecrawl)
  - H3: 6) Provider-Nutzungs-Snapshots (Status/Zustand)
  - H3: 7) Compaction-Schutz-Zusammenfassung
  - H3: 8) Modellscan / Probe
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
  - H2: Phase 5: Typen, Verträge und Tests härten
  - H2: Phase 6: Dokumentation und Release-Bereitschaft
  - H2: Empfohlener erster Abschnitt
  - H2: Frontend-Skill-Update

## reference/code-mode.md

- Route: /reference/code-mode
- Überschriften:
  - H2: Was ist das?
  - H2: Warum ist das gut?
  - H2: So aktivieren Sie es
  - H2: Technische Tour
  - H2: Runtime-Status
  - H2: Umfang
  - H2: Begriffe
  - H2: Konfiguration
  - H2: Aktivierung
  - H2: Für Modelle sichtbare Tools
  - H2: exec
  - H2: wait
  - H2: Gast-Runtime-API
  - H2: Interne Namespaces
  - H3: Registry-Lebenszyklus
  - H3: Registrierungsstruktur
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
  - H2: Runtime-Zustand
  - H2: QuickJS-WASI-Runtime
  - H2: TypeScript
  - H2: Sicherheitsgrenze
  - H2: Fehlercodes
  - H2: Telemetrie
  - H2: Debugging
  - H2: Implementierungsstruktur
  - H2: Validierungscheckliste
  - H2: E2E-Testplan
  - H2: Verwandte Themen

## reference/credits.md

- Route: /reference/credits
- Überschriften:
  - H2: Der Name
  - H2: Danksagungen
  - H2: Kernmitwirkende
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
  - H2: Übergeordnete Phasen
  - H2: Phasen der Release-Prüfungen
  - H2: Docker-Release-Pfad-Chunks
  - H2: Release-Profile
  - H2: Full-only-Ergänzungen
  - H2: Fokussierte Wiederholungen
  - H2: Aufzubewahrende Evidenz
  - H2: Workflow-Dateien

## reference/memory-config.md

- Route: /reference/memory-config
- Überschriften:
  - H2: Provider-Auswahl
  - H3: Benutzerdefinierte Provider-IDs
  - H3: API-Schlüsselauflösung
  - H2: Remote-Endpunkt-Konfiguration
  - H2: Provider-spezifische Konfiguration
  - H3: Inline-Embedding-Timeout
  - H2: Hybrid-Suchkonfiguration
  - H3: Vollständiges Beispiel
  - H2: Zusätzliche Memory-Pfade
  - H2: Multimodales Memory (Gemini)
  - H2: Embedding-Cache
  - H2: Batch-Indexierung
  - H2: Sitzungs-Memory-Suche (experimentell)
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
  - H3: Google Gemini direkte API
  - H3: Gemini-CLI-Nutzung
  - H2: System-Prompt-Cache-Grenze
  - H2: OpenClaw-Cache-Stabilitätswächter
  - H2: Tuning-Muster
  - H3: Gemischter Traffic (empfohlener Standard)
  - H3: Kostenorientierte Basislinie
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
  - H2: Zeitverlauf des Installations-Footprints
  - H2: Was sich in 5.28 geändert hat
  - H2: Wichtigste Zahlen
  - H3: Installations-Footprint
  - H3: npm-Paketgröße
  - H2: Zusammenfassung der Kova-Agent-Turns
  - H2: Quell-Probes
  - H2: Audit des Installations-Footprints
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
  - H2: Single Source of Truth: das Gateway
  - H2: Zwei Persistenzschichten
  - H2: Speicherorte auf der Festplatte
  - H2: Store-Wartung und Festplattensteuerungen
  - H2: Cron-Sitzungen und Ausführungsprotokolle
  - H2: Sitzungsschlüssel (sessionKey)
  - H2: Sitzungs-IDs (sessionId)
  - H2: Session-Store-Schema (sessions.json)
  - H2: Transkriptstruktur (.jsonl)
  - H2: Kontextfenster vs. verfolgte Tokens
  - H2: Compaction: was es ist
  - H2: Compaction-Chunk-Grenzen und Tool-Pairing
  - H2: Wann automatische Compaction erfolgt (OpenClaw-Runtime)
  - H2: Compaction-Einstellungen (reserveTokens, keepRecentTokens)
  - H2: Austauschbare Compaction-Provider
  - H2: Für Benutzer sichtbare Oberflächen
  - H2: Stille Haushaltsführung (NOREPLY)
  - H2: Pre-Compaction-"Memory Flush" (implementiert)
  - H2: Checkliste zur Fehlerbehebung
  - H2: Verwandte Themen

## reference/templates/AGENTS.dev.md

- Route: /reference/templates/AGENTS.dev
- Überschriften:
  - H1: AGENTS.md - OpenClaw-Arbeitsbereich
  - H2: Erster Lauf (einmalig)
  - H2: Backup-Tipp (empfohlen)
  - H2: Sicherheitsstandards
  - H2: Vorprüfung vorhandener Lösungen
  - H2: Tägliches Memory (empfohlen)
  - H2: Heartbeats (optional)
  - H2: Anpassen
  - H2: C-3PO-Ursprungs-Memory
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
  - H1: IDENTITY.md - Agent-Identität
  - H2: Rolle
  - H2: Seele
  - H2: Beziehung zu Clawd
  - H2: Eigenheiten
  - H2: Leitspruch
  - H2: Verwandt

## reference/templates/IDENTITY.md

- Route: /reference/templates/IDENTITY
- Überschriften:
  - H1: IDENTITY.md - Wer bin ich?
  - H2: Verwandt

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
  - H2: Grundwahrheiten
  - H2: Grenzen
  - H2: Stimmung
  - H2: Kontinuität
  - H2: Verwandt

## reference/templates/TOOLS.dev.md

- Route: /reference/templates/TOOLS.dev
- Überschriften:
  - H1: TOOLS.md - Benutzer-Tool-Notizen (bearbeitbar)
  - H2: Beispiele
  - H3: imsg
  - H3: sag
  - H2: Verwandt

## reference/templates/TOOLS.md

- Route: /reference/templates/TOOLS
- Überschriften:
  - H1: TOOLS.md - Lokale Notizen
  - H2: Was hier hineingehört
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
  - H2: Lokaler PR-Gate
  - H2: Modell-Latenz-Benchmark (lokale Schlüssel)
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
  - H2: So sehen Sie die aktuelle Token-Nutzung
  - H2: Kostenschätzung (wenn angezeigt)
  - H2: Auswirkungen von Cache-TTL und Bereinigung
  - H3: Beispiel: 1-h-Cache mit Heartbeat warm halten
  - H3: Beispiel: gemischter Traffic mit Cache-Strategie pro Agent
  - H3: Anthropic-1M-Kontext
  - H2: Tipps zur Reduzierung des Token-Drucks
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
  - H2: Flow-Details (lokaler Modus)
  - H2: Nicht interaktiver Modus
  - H3: Agent hinzufügen (nicht interaktiv)
  - H2: Gateway-Wizard-RPC
  - H2: Signal-Einrichtung (signal-cli)
  - H2: Was der Wizard schreibt
  - H2: Verwandte Dokumentation

## releases/2026.6.11.md

- Route: /releases/2026.6.11
- Überschriften:
  - H1: OpenClaw v2026.6.11 Versionshinweise (2026-06-30)
  - H2: Highlights
  - H3: Zuverlässigkeit der Kanalzustellung
  - H3: Provider- und Modellwiederherstellung
  - H3: Sitzungs-, Speicher- und Vertrauenskontinuität
  - H3: Slack-Router-Relay-Modus
  - H3: Raft External Agent Wake-Bridge
  - H3: Installation und Reparatur offizieller Plugins
  - H2: Kanäle und Messaging
  - H3: Zusätzliche Kanalfehlerbehebungen
  - H2: Gateway, Sicherheit und Vertrauen
  - H3: Neustart- und Bereitschaftswiederherstellung
  - H3: Zustellung von Remote-Ergebnissen und Medien
  - H2: Clients und Schnittstellen
  - H3: Client-Sendungen und Wiederverbindungen
  - H3: Korrekturen an Oberfläche, Einstellungen und Onboarding
  - H2: Dokumentation und Admin-Tools
  - H3: Zuverlässigkeit von Einrichtung und Befehlen
  - H3: Tools und geplante Arbeit

## releases/index.md

- Route: /releases
- Überschriften:
  - H1: Versionshinweise
  - H2: Releases
  - H2: Unbearbeiteter Release-Verlauf

## security/CONTRIBUTING-THREAT-MODEL.md

- Route: /security/CONTRIBUTING-THREAT-MODEL
- Überschriften:
  - H2: Möglichkeiten zur Mitarbeit
  - H3: Bedrohung hinzufügen
  - H3: Minderung vorschlagen
  - H3: Angriffskette vorschlagen
  - H3: Vorhandene Inhalte korrigieren oder verbessern
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
  - H4: T-RECON-002: Sondierung der Kanalintegration
  - H3: 3.2 Erstzugriff (AML.TA0004)
  - H4: T-ACCESS-001: Abfangen des Kopplungscodes
  - H4: T-ACCESS-002: AllowFrom-Spoofing
  - H4: T-ACCESS-003: Token-Diebstahl
  - H3: 3.3 Ausführung (AML.TA0005)
  - H4: T-EXEC-001: Direkte Prompt-Injection
  - H4: T-EXEC-002: Indirekte Prompt-Injection
  - H4: T-EXEC-003: Tool-Argument-Injection
  - H4: T-EXEC-004: Umgehung der Ausführungsgenehmigung
  - H3: 3.4 Persistenz (AML.TA0006)
  - H4: T-PERSIST-001: Installation bösartiger Skills
  - H4: T-PERSIST-002: Vergiftung von Skill-Updates
  - H4: T-PERSIST-003: Manipulation der Agent-Konfiguration
  - H3: 3.5 Umgehung der Verteidigung (AML.TA0007)
  - H4: T-EVADE-001: Umgehung von Moderationsmustern
  - H4: T-EVADE-002: Ausbruch aus dem Content-Wrapper
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Tool-Aufzählung
  - H4: T-DISC-002: Extraktion von Sitzungsdaten
  - H3: 3.7 Sammlung &amp; Exfiltration (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Datendiebstahl über webfetch
  - H4: T-EXFIL-002: Unbefugtes Senden von Nachrichten
  - H4: T-EXFIL-003: Abgreifen von Zugangsdaten
  - H3: 3.8 Auswirkungen (AML.TA0011)
  - H4: T-IMPACT-001: Unbefugte Befehlsausführung
  - H4: T-IMPACT-002: Ressourcenerschöpfung (DoS)
  - H4: T-IMPACT-003: Reputationsschaden
  - H2: 4. ClawHub-Lieferkettenanalyse
  - H3: 4.1 Aktuelle Sicherheitskontrollen
  - H3: 4.2 Muster für Moderationskennzeichnungen
  - H3: 4.3 Geplante Verbesserungen
  - H2: 5. Risikomatrix
  - H3: 5.1 Wahrscheinlichkeit vs. Auswirkung
  - H3: 5.2 Angriffsketten auf dem kritischen Pfad
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
  - H2: Wo sich die Modelle befinden
  - H2: Wichtige Vorbehalte
  - H2: Ergebnisse reproduzieren
  - H3: Gateway-Exponierung und Fehlkonfiguration eines offenen Gateways
  - H3: Node-Exec-Pipeline (Fähigkeit mit höchstem Risiko)
  - H3: Kopplungsspeicher (DM-Gating)
  - H3: Ingress-Gating (Erwähnungen + Umgehung von Steuerbefehlen)
  - H3: Routing-/Sitzungsschlüssel-Isolation
  - H2: v1++: zusätzliche begrenzte Modelle (Nebenläufigkeit, Wiederholungen, Korrektheit von Traces)
  - H3: Nebenläufigkeit / Idempotenz des Kopplungsspeichers
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
  - H2: Wie OpenClaw Traffic routet
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
  - H2: Claw-Steueroberfläche
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
  - H2: Was als Nächstes zu tun ist
  - H2: Verwandt

## start/hubs.md

- Route: /start/hubs
- Überschriften:
  - H2: Hier beginnen
  - H2: Installation + Updates
  - H2: Grundkonzepte
  - H2: Provider + Ingress
  - H2: Gateway + Betrieb
  - H2: Tools + Automatisierung
  - H2: Nodes, Medien, Sprache
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
  - H2: Die Entstehungsgeschichte
  - H2: Die erste Häutung (27. Januar 2026)
  - H2: Der Name
  - H2: Die Daleks vs. die Hummer
  - H2: Hauptfiguren
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Das Moltiverse
  - H2: Die großen Vorfälle
  - H3: Der Verzeichnis-Dump (3. Dez. 2025)
  - H3: Die große Häutung (27. Jan. 2026)
  - H3: Die endgültige Form (30. Januar 2026)
  - H3: Der Roboter-Einkaufsrausch (3. Dez. 2025)
  - H2: Heilige Texte
  - H2: Das Hummer-Credo
  - H3: Die Saga der Icon-Erstellung (27. Jan. 2026)
  - H2: Die Zukunft
  - H2: Verwandt

## start/onboarding-overview.md

- Route: /start/onboarding-overview
- Überschriften:
  - H2: Welchen Pfad sollte ich verwenden?
  - H2: Was das Onboarding konfiguriert
  - H2: CLI-Onboarding
  - H2: macOS-App-Onboarding
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
  - H2: Das Zwei-Telefone-Setup (empfohlen)
  - H2: 5-Minuten-Schnellstart
  - H2: Dem Agent einen Workspace geben (AGENTS)
  - H2: Die Konfiguration, die daraus „einen Assistenten“ macht
  - H2: Sitzungen und Speicher
  - H2: Heartbeats (proaktiver Modus)
  - H2: Medien hinein und hinaus
  - H2: Betriebscheckliste
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
  - H2: Gateway aus diesem Repo ausführen
  - H2: Stabiler Workflow (macOS-App zuerst)
  - H2: Bleeding-Edge-Workflow (Gateway in einem Terminal)
  - H3: 0) (Optional) Auch die macOS-App aus dem Quellcode ausführen
  - H3: 1) Dev-Gateway starten
  - H3: 2) macOS-App auf Ihr laufendes Gateway richten
  - H3: 3) Überprüfen
  - H3: Häufige Stolperfallen
  - H2: Zuordnung der Zugangsdaten-Speicherung
  - H2: Aktualisieren (ohne Ihre Einrichtung zu zerstören)
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
  - H2: Ihr Projekt einreichen
  - H2: Verwandt

## start/wizard-cli-automation.md

- Route: /start/wizard-cli-automation
- Überschriften:
  - H2: Nicht interaktives Basisbeispiel
  - H2: Provider-spezifische Beispiele
  - H2: Weiteren Agent hinzufügen
  - H2: Verwandte Dokumentation

## start/wizard-cli-reference.md

- Route: /start/wizard-cli-reference
- Überschriften:
  - H2: Was der Wizard tut
  - H2: Details zum lokalen Flow
  - H2: Details zum Remote-Modus
  - H2: Authentifizierungs- und Modelloptionen
  - H2: Ausgaben und Interna
  - H2: Verwandte Dokumentation

## start/wizard.md

- Route: /start/wizard
- Überschriften:
  - H2: Gebietsschema
  - H2: QuickStart vs. Erweitert
  - H2: Was das Onboarding konfiguriert
  - H2: Weiteren Agent hinzufügen
  - H2: Vollständige Referenz
  - H2: Verwandte Dokumentation

## tools/acp-agents-setup.md

- Route: /tools/acp-agents-setup
- Überschriften:
  - H2: acpx-Harness-Unterstützung (aktuell)
  - H2: Erforderliche Konfiguration
  - H2: Plugin-Einrichtung für acpx-Backend
  - H3: acpx-Befehl und Versionskonfiguration
  - H3: Automatische Installation von Abhängigkeiten
  - H3: MCP-Bridge für Plugin-Tools
  - H3: MCP-Bridge für OpenClaw-Tools
  - H3: Timeout-Konfiguration für Runtime-Operationen
  - H3: Agent-Konfiguration für Health Probe
  - H2: Berechtigungskonfiguration
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Konfiguration
  - H2: Verwandt

## tools/acp-agents.md

- Route: /tools/acp-agents
- Überschriften:
  - H2: Welche Seite benötige ich?
  - H2: Funktioniert das sofort?
  - H2: Unterstützte Harness-Ziele
  - H2: Operator-Runbook
  - H2: ACP gegenüber Sub-Agents
  - H2: Wie ACP Claude Code ausführt
  - H2: Gebundene Sitzungen
  - H3: Mentales Modell
  - H3: Bindungen für aktuelle Unterhaltungen
  - H2: Persistente Kanalbindungen
  - H3: Bindungsmodell
  - H3: Runtime-Standardwerte pro Agent
  - H3: Beispiel
  - H3: Verhalten
  - H2: ACP-Sitzungen starten
  - H3: sessionsspawn-Parameter
  - H2: Spawn-Bind- und Thread-Modi
  - H2: Zustellungsmodell
  - H2: Sandbox-Kompatibilität
  - H2: Sitzungsziel-Auflösung
  - H2: ACP-Steuerungen
  - H3: Zuordnung von Runtime-Optionen
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
  - H2: API-Schlüssel erhalten
  - H2: Konfigurationsbeispiel
  - H2: Tool-Parameter
  - H2: Hinweise
  - H2: Verwandt

## tools/browser-control.md

- Route: /tools/browser-control
- Überschriften:
  - H2: Control API (optional)
  - H3: /act-Fehlervertrag
  - H3: Playwright-Anforderung
  - H4: Docker-Playwright-Installation
  - H2: Funktionsweise (intern)
  - H2: CLI-Kurzreferenz
  - H2: Snapshots und refs
  - H2: Wait-Power-ups
  - H2: Debug-Workflows
  - H2: JSON-Ausgabe
  - H2: Status- und Umgebungsoptionen
  - H2: Sicherheit und Datenschutz
  - H2: Verwandt

## tools/browser-linux-troubleshooting.md

- Route: /tools/browser-linux-troubleshooting
- Überschriften:
  - H2: Problem: "Chrome-CDP konnte auf Port 18800 nicht gestartet werden"
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
  - H2: Sandboxing + Host-Browserzugriff
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
  - H3: Schicht 5: End-to-End-Browsersteuerung prüfen
  - H2: Häufige irreführende Fehler
  - H2: Schnelle Triage-Checkliste
  - H2: Praktische Kernaussage
  - H2: Verwandt

## tools/browser.md

- Route: /tools/browser
- Überschriften:
  - H2: Was Sie erhalten
  - H2: Schnellstart
  - H2: Plugin-Steuerung
  - H2: Agent-Anleitung
  - H2: Fehlender Browserbefehl oder fehlendes Tool
  - H2: Profile: openclaw vs. user
  - H2: Konfiguration
  - H3: Screenshot-Vision (Unterstützung für reine Textmodelle)
  - H2: Brave oder einen anderen Chromium-basierten Browser verwenden
  - H2: Lokale vs. Remote-Steuerung
  - H2: Node-Browserproxy (Zero-Config-Standard)
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
  - H2: Control API (optional)
  - H2: Fehlerbehebung
  - H3: CDP-Startfehler vs. Navigations-SSRF-Block
  - H2: Agent-Tools + wie die Steuerung funktioniert
  - H2: Verwandt

## tools/btw.md

- Route: /tools/btw
- Überschriften:
  - H2: Was es tut
  - H2: Was es nicht tut
  - H2: Wie Kontext funktioniert
  - H2: Zustellungsmodell
  - H2: Oberflächenverhalten
  - H3: TUI
  - H3: Externe Kanäle
  - H3: Control UI / Web
  - H2: Wann Sie BTW verwenden sollten
  - H2: Wann Sie BTW nicht verwenden sollten
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
  - H2: Limits
  - H2: Verwandt

## tools/creating-skills.md

- Route: /tools/creating-skills
- Überschriften:
  - H2: Erstellen Sie Ihre erste Skill
  - H2: SKILL.md-Referenz
  - H3: Erforderliche Felder
  - H3: Optionale Frontmatter-Schlüssel
  - H3: {baseDir} verwenden
  - H2: Bedingte Aktivierung hinzufügen
  - H2: Über Skill Workshop vorschlagen
  - H2: In ClawHub veröffentlichen
  - H2: Best Practices
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
  - H2: Plugin-Standardwerte
  - H3: Konfiguration der persistenten Viewer-URL
  - H2: Sicherheitskonfiguration
  - H2: Artefaktlebenszyklus und Speicher
  - H2: Viewer-URL und Netzwerkverhalten
  - H2: Sicherheitsmodell
  - H2: Browseranforderungen für den Dateimodus
  - H2: Fehlerbehebung
  - H2: Operative Anleitung
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
  - H2: API-Schlüssel erhalten
  - H2: Konfiguration
  - H2: Base-URL überschreiben
  - H2: Tool-Parameter
  - H3: Inhaltsextraktion
  - H3: Suchmodi
  - H2: Hinweise
  - H2: Verwandt

## tools/exec-approvals-advanced.md

- Route: /tools/exec-approvals-advanced
- Überschriften:
  - H2: Sichere Binaries (nur stdin)
  - H3: Argv-Validierung und verweigerte Flags
  - H3: Vertrauenswürdige Binary-Verzeichnisse
  - H3: Shell-Verkettung, Wrapper und Multiplexer
  - H3: Sichere Binaries gegenüber Allowlist
  - H2: Interpreter-/Runtime-Befehle
  - H3: Follow-up-Zustellungsverhalten
  - H2: Weiterleitung von Genehmigungen an Chatkanäle
  - H3: Plugin-Genehmigungsweiterleitung
  - H3: Genehmigungen im selben Chat auf jedem Kanal
  - H3: Native Genehmigungszustellung
  - H3: macOS-IPC-Ablauf
  - H2: FAQ
  - H3: Wann würden accountId und threadId für ein Genehmigungsziel verwendet?
  - H3: Wenn Genehmigungen an eine Sitzung gesendet werden, kann dann jeder in dieser Sitzung sie genehmigen?
  - H2: Verwandt

## tools/exec-approvals.md

- Route: /tools/exec-approvals
- Überschriften:
  - H2: Die effektive Richtlinie prüfen
  - H2: Wo sie gilt
  - H3: Vertrauensmodell
  - H3: macOS-Aufteilung
  - H2: Einstellungen und Speicher
  - H2: Richtlinienoptionen
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO-Modus (ohne Genehmigung)
  - H3: Persistente gateway-host-Einrichtung mit "nie nachfragen"
  - H3: Lokale Abkürzung
  - H3: Node-Host
  - H3: Nur-Sitzung-Abkürzung
  - H2: Allowlist (pro Agent)
  - H3: Argumente mit argPattern einschränken
  - H2: Skills-CLIs automatisch erlauben
  - H2: Sichere Binaries und Genehmigungsweiterleitung
  - H2: Bearbeitung in der Control UI
  - H2: Genehmigungsablauf
  - H2: Systemereignisse
  - H2: Verhalten bei verweigerter Genehmigung
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
  - H2: Schlüsselloses webfetch und API-Schlüssel
  - H2: Firecrawl-Suche konfigurieren
  - H2: Firecrawl-webfetch-Fallback konfigurieren
  - H3: Selbst gehostetes Firecrawl
  - H2: Firecrawl-Plugin-Tools
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Tarnung / Bot-Umgehung
  - H2: Wie webfetch Firecrawl verwendet
  - H2: Verwandt

## tools/gemini-search.md

- Route: /tools/gemini-search
- Überschriften:
  - H2: API-Schlüssel erhalten
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Modellauswahl
  - H2: Base-URL-Überschreibungen
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
  - H2: Anmelden oder API-Schlüssel erhalten
  - H2: Konfiguration
  - H2: Funktionsweise
  - H2: Unterstützte Parameter
  - H2: Base-URL-Überschreibungen
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
  - H2: Funktionen erweitern
  - H2: Fehlende Tools beheben
  - H2: Verwandt

## tools/kimi-search.md

- Route: /tools/kimi-search
- Überschriften:
  - H2: API-Schlüssel erhalten
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
  - H2: Reine JSON-LLM-Schritte (llm-task)
  - H3: Wichtige Einschränkung: eingebettetes Lobster vs. openclaw.invoke
  - H2: Workflow-Dateien (.lobster)
  - H2: Lobster installieren
  - H2: Tool aktivieren
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
  - H2: Provider-Fähigkeitsmatrix
  - H2: Asynchron vs. synchron
  - H2: Sprache-zu-Text und Sprachanruf
  - H2: Provider-Zuordnungen (wie Anbieter Oberflächen aufteilen)
  - H2: Verwandte Themen

## tools/minimax-search.md

- Route: /tools/minimax-search
- Überschriften:
  - H2: Token-Plan-Zugangsdaten erhalten
  - H2: Konfiguration
  - H2: Regionsauswahl
  - H2: Unterstützte Parameter
  - H2: Verwandte Themen

## tools/multi-agent-sandbox-tools.md

- Route: /tools/multi-agent-sandbox-tools
- Überschriften:
  - H2: Konfigurationsbeispiele
  - H2: Konfigurationspriorität
  - H3: Sandbox-Konfiguration
  - H3: Tool-Einschränkungen
  - H2: Migration von einem einzelnen Agenten
  - H2: Beispiele für Tool-Einschränkungen
  - H2: Häufiger Stolperstein: "non-main"
  - H2: Tests
  - H2: Fehlerbehebung
  - H2: Verwandte Themen

## tools/music-generation.md

- Route: /tools/music-generation
- Überschriften:
  - H2: Schnellstart
  - H2: Unterstützte Provider
  - H3: Fähigkeitsmatrix
  - H2: Tool-Parameter
  - H2: Asynchrones Verhalten
  - H3: Task-Lebenszyklus
  - H2: Konfiguration
  - H3: Modellauswahl
  - H3: Reihenfolge der Provider-Auswahl
  - H2: Provider-Hinweise
  - H2: Den richtigen Pfad wählen
  - H2: Provider-Fähigkeitsmodi
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
  - H2: Überschreibung der Basis-URL
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
  - H3: Installationsquelle wählen
  - H3: Installationsrichtlinie für Operatoren
  - H3: Plugin-Richtlinie konfigurieren
  - H2: Plugin-Formate verstehen
  - H2: Plugin-Hooks
  - H2: Aktiven Gateway verifizieren
  - H2: Fehlerbehebung
  - H3: Blockierte Eigentümerschaft des Plugin-Pfads
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
  - H2: Unterstützende Dateien
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
  - H2: Installationsrichtlinie für Operatoren (security.installPolicy)
  - H2: Allowlist für gebündelte Skills
  - H2: Einträge pro Skill (skills.entries)
  - H2: Agenten-Allowlists (agents)
  - H2: Workshop (skills.workshop)
  - H2: Per Symlink eingebundene Skill-Roots
  - H2: Sandboxed Skills und Umgebungsvariablen
  - H2: Erinnerung zur Ladereihenfolge
  - H2: Verwandte Themen

## tools/skills.md

- Route: /tools/skills
- Überschriften:
  - H2: Ladereihenfolge
  - H2: Skills pro Agent vs. gemeinsam genutzte Skills
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
  - H2: Umgebungseinbindung
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
  - H3: Gebündelte Plugin-Befehle
  - H3: Skill-Befehle
  - H2: /tools — was der Agent jetzt verwenden kann
  - H2: /model — Modellauswahl
  - H2: /config — Konfigurationsschreibvorgänge auf Datenträger
  - H2: /mcp — MCP-Serverkonfiguration
  - H2: /debug — reine Laufzeitüberschreibungen
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
  - H3: Steuerungen für Thread-Bindung
  - H3: Spawn-Verhalten
  - H2: Kontextmodi
  - H2: Tool: sessionsspawn
  - H3: Delegationsprompt-Modus
  - H3: Tool-Parameter
  - H3: Task-Namen und Zielauswahl
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
  - H3: Tiefenebenen
  - H3: Ankündigungskette
  - H3: Tool-Richtlinie nach Tiefe
  - H3: Spawn-Limit pro Agent
  - H3: Kaskadierter Stopp
  - H2: Authentifizierung
  - H2: Ankündigung
  - H3: Ankündigungskontext
  - H3: Statistikzeile
  - H3: Warum sessionshistory bevorzugen
  - H2: Tool-Richtlinie
  - H3: Überschreiben per Konfiguration
  - H2: Parallelität
  - H2: Liveness und Wiederherstellung
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
  - H2: Was es macht
  - H2: Auflösungsreihenfolge
  - H2: Sitzungsstandard festlegen
  - H2: Anwendung durch Agent
  - H2: Schneller Modus (/fast)
  - H2: Ausführliche Direktiven (/verbose oder /v)
  - H2: Plugin-Trace-Direktiven (/trace)
  - H2: Sichtbarkeit des Reasonings (/reasoning)
  - H2: Verwandte Themen
  - H2: Heartbeats
  - H2: Web-Chat-UI
  - H2: Provider-Profile

## tools/tokenjuice.md

- Route: /tools/tokenjuice
- Überschriften:
  - H2: Plugin aktivieren
  - H2: Was tokenjuice ändert
  - H2: Funktion verifizieren
  - H2: Plugin deaktivieren
  - H2: Verwandte Themen

## tools/tool-search.md

- Route: /tools/tool-search
- Überschriften:
  - H2: Wie ein Turn ausgeführt wird
  - H2: Modi
  - H2: Warum es dies gibt
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
  - H2: Einstellungen pro Benutzer
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
  - H2: Funktionsweise asynchroner Generierung
  - H3: Task-Lebenszyklus
  - H2: Unterstützte Provider
  - H3: Fähigkeitsmatrix
  - H2: Tool-Parameter
  - H3: Erforderlich
  - H3: Inhaltseingaben
  - H3: Stilsteuerungen
  - H3: Erweitert
  - H4: Fallback und typisierte Optionen
  - H2: Aktionen
  - H2: Modellauswahl
  - H2: Provider-Hinweise
  - H2: Provider-Fähigkeitsmodi
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
  - H2: Vertrauenswürdiger Umgebungsproxy
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
  - H2: Funktionsweise von Cloud-Einrichtungen
  - H2: Admin-Zugriff zuerst härten
  - H2: Gemeinsamer Unternehmensagent auf einem VPS
  - H2: Nodes mit einem VPS verwenden
  - H2: Startoptimierung für kleine VMs und ARM-Hosts
  - H3: systemd-Tuning-Checkliste (optional)
  - H2: Verwandte Themen

## web/control-ui.md

- Route: /web/control-ui
- Überschriften:
  - H2: Schnell öffnen (lokal)
  - H2: Gerätekopplung (erste Verbindung)
  - H2: Persönliche Identität (browserlokal)
  - H2: Laufzeitkonfigurations-Endpunkt
  - H2: Sprachunterstützung
  - H2: Erscheinungsbild-Themes
  - H2: Was sie kann (heute)
  - H2: MCP-Seite
  - H2: Aktivitätstab
  - H2: Chat-Verhalten
  - H2: PWA-Installation und Web-Push
  - H2: Gehostete Einbettungen
  - H2: Chat-Nachrichtenbreite
  - H2: Tailnet-Zugriff (empfohlen)
  - H2: Unsicheres HTTP
  - H2: Content Security Policy
  - H2: Avatar-Routen-Authentifizierung
  - H2: Medienrouten-Authentifizierung des Assistenten
  - H2: UI erstellen
  - H2: Leere Control-UI-Seite
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
  - H3: Integriertes Serve (empfohlen)
  - H3: Tailnet-Bind + Token
  - H3: Öffentliches Internet (Funnel)
  - H2: Sicherheitshinweise
  - H2: UI erstellen

## web/tui.md

- Route: /web/tui
- Überschriften:
  - H2: Schnellstart
  - H3: Gateway-Modus
  - H3: Lokaler Modus
  - H2: Was Sie sehen
  - H2: Mentales Modell: Agenten + Sitzungen
  - H2: Senden + Zustellung
  - H2: Auswahlfelder + Overlays
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
  - H2: Fehlerbehebung bei Verbindungen
  - H2: Verwandte Themen

## web/webchat.md

- Route: /web/webchat
- Überschriften:
  - H2: Was es ist
  - H2: Schnellstart
  - H2: Funktionsweise (Verhalten)
  - H3: Transkript- und Zustellmodell
  - H2: Tools-Panel für Control-UI-Agenten
  - H2: Remote-Nutzung
  - H2: Konfigurationsreferenz (WebChat)
  - H2: Verwandte Themen
