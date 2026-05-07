---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanalprotokolle fortlaufend anzeigen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmeldung/Abmeldung, Protokolle)
title: Kanäle
x-i18n:
    generated_at: "2026-05-07T13:13:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chatkanal-Konten und ihren Laufzeitstatus auf dem Gateway.

Zugehörige Dokumentation:

- Channel-Anleitungen: [Kanäle](/de/channels)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)

## Häufige Befehle

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` zeigt nur Chatkanäle an: standardmäßig konfigurierte Konten, mit den Status-Tags `installed`, `configured` und `enabled` pro Konto. Übergeben Sie `--all`, um auch gebündelte Kanäle anzuzeigen, für die noch kein Konto konfiguriert ist, sowie installierbare Katalogkanäle, die noch nicht auf dem Datenträger vorhanden sind. Auth-Provider (OAuth + API-Schlüssel) und Momentaufnahmen zu Nutzung/Kontingent von Modell-Providern werden hier nicht mehr ausgegeben; verwenden Sie `openclaw models auth list` für Provider-Authentifizierungsprofile und `openclaw status` oder `openclaw models list` für die Nutzung.

## Status / Fähigkeiten / Auflösung / Logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Auf einem erreichbaren Gateway führt er pro Konto
`probeAccount` und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportstatus
sowie Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn der Gateway nicht erreichbar ist, fällt `channels status` auf reine Konfigurationszusammenfassungen
statt auf Live-Prüfausgaben zurück.

Verwenden Sie `openclaw sessions`, Gateway `sessions.list` oder das Agent-Tool
`sessions_list` nicht als Signal für die Socket-Integrität eines Kanals. Diese Oberflächen melden
gespeicherte Konversationszeilen, nicht den Provider-Laufzeitstatus. Nach einem Neustart des Discord-Providers
kann ein verbundenes, aber stilles Konto fehlerfrei sein, obwohl keine Discord-Sitzungszeile
erscheint, bis das nächste eingehende oder ausgehende Konversationsereignis eintritt.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt kanalbezogene Flags an (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

`channels remove` arbeitet nur mit installierten/konfigurierten Channel-Plugins. Verwenden Sie für installierbare Katalogkanäle zuerst `channels add`.
Bei laufzeitgestützten Channel-Plugins fordert `channels remove` außerdem den laufenden Gateway auf, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird. So bleibt beim Deaktivieren oder Löschen eines Kontos der alte Listener nicht bis zum Neustart aktiv.

Häufige nicht interaktive Oberflächen zum Hinzufügen sind:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Authentifizierung des Standardkontos, sofern unterstützt

Wenn ein Channel-Plugin während eines flaggesteuerten `add`-Befehls installiert werden muss, verwendet OpenClaw die Standard-Installationsquelle des Kanals, ohne die interaktive Installationsabfrage für Plugins zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie die Bindung jetzt bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Channel-Konto besitzen soll, und schreibt kontobezogene Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch ein einzelnes Konto in Top-Level-Einstellungen verwendet, ein Nicht-Standardkonto hinzufügen, überführt OpenClaw kontobezogene Top-Level-Werte in die Konten-Map des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle legen diese Werte in `channels.<channel>.accounts.default` ab, gebündelte Kanäle können jedoch stattdessen ein vorhandenes, passendes überführtes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto vorhanden ist oder `defaultAccount` auf ein vorhandenes benanntes Konto verweist, behält die Überführung dieses Konto bei, statt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Vorhandene kanalbezogene Bindungen (ohne `accountId`) passen weiterhin zum Standardkonto.
- `channels add` erstellt oder schreibt im nicht interaktiven Modus keine Bindungen automatisch um.
- Die interaktive Einrichtung kann optional kontobezogene Bindungen hinzufügen.

Wenn Ihre Konfiguration bereits in einem gemischten Zustand war (benannte Konten vorhanden und Top-Level-Werte für ein einzelnes Konto weiterhin gesetzt), führen Sie `openclaw doctor --fix` aus, um kontobezogene Werte in das für diesen Kanal ausgewählte überführte Konto zu verschieben. Die meisten Kanäle überführen nach `accounts.default`; Matrix kann stattdessen ein vorhandenes benanntes/Standardziel beibehalten.

## Anmeldung und Abmeldung (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--verbose`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein unterstütztes Anmeldeziel konfiguriert ist.
- `channels logout` bevorzugt den Live-Gateway-Pfad, wenn er erreichbar ist, sodass die Abmeldung jeden aktiven Listener stoppt, bevor der Authentifizierungsstatus des Kanals gelöscht wird. Wenn ein lokaler Gateway nicht erreichbar ist, fällt er auf die lokale Authentifizierungsbereinigung zurück.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent-`exec` blockiert diesen interaktiven Anmeldefluss; kanalnative Agent-Anmeldetools wie `whatsapp_login` sollten, sofern verfügbar, aus dem Chat verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt keine Momentaufnahmen zu Nutzung/Kontingent von Modell-Providern mehr aus. Verwenden Sie dafür `openclaw status` (Übersicht) oder `openclaw models list` (pro Provider).
- `openclaw channels status` fällt auf reine Konfigurationszusammenfassungen zurück, wenn der Gateway nicht erreichbar ist. Wenn ein unterstützter Kanalzugang über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, wird dieses Konto mit eingeschränkten Hinweisen als konfiguriert gemeldet, statt es als nicht konfiguriert anzuzeigen.

## Fähigkeitsprüfung

Rufen Sie Provider-Fähigkeitshinweise (Intents/Scopes, sofern verfügbar) sowie statische Funktionsunterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Extensions).
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Kanal-ID und gilt nur für Discord. Für Discord-Sprachkanäle kennzeichnet die Berechtigungsprüfung fehlende `ViewChannel`, `Connect`, `Speak`, `SendMessages` und `ReadMessageHistory`.
- Prüfungen sind Provider-spezifisch: Discord-Intents + optionale Kanalberechtigungen; Slack-Bot + Benutzer-Scopes; Telegram-Bot-Flags + Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token + Graph-Rollen/Scopes (annotiert, sofern bekannt). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen zu IDs auflösen

Lösen Sie Kanal-/Benutzernamen über das Provider-Verzeichnis zu IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen haben.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, dieser Zugang im aktuellen Befehlspfad aber nicht verfügbar ist, gibt der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.
- `channels resolve` installiert keine Channel-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanalübersicht](/de/channels)
