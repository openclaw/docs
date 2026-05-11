---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanalprotokolle live verfolgen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmeldung/Abmeldung, Logs)
title: Kanäle
x-i18n:
    generated_at: "2026-05-11T20:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a964b4db9526defab6ee47b7a99c11086e345d42c8d20f5262fc134337947f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chat-Kanal-Konten und ihren Laufzeitstatus auf dem Gateway.

Zugehörige Dokumentation:

- Kanal-Guides: [Kanäle](/de/channels)
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

`channels list` zeigt nur Chat-Kanäle an: standardmäßig konfigurierte Konten, mit den Status-Tags `installed`, `configured` und `enabled` pro Konto. Übergeben Sie `--all`, um auch gebündelte Kanäle anzuzeigen, die noch kein konfiguriertes Konto haben, sowie installierbare Katalogkanäle, die noch nicht auf der Festplatte vorhanden sind. Auth-Provider (OAuth + API-Schlüssel) und Nutzungs-/Kontingent-Snapshots von Modell-Providern werden hier nicht mehr ausgegeben; verwenden Sie `openclaw models auth list` für Provider-Auth-Profile und `openclaw status` oder `openclaw models list` für die Nutzung.

## Status / Fähigkeiten / Auflösen / Logs

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Bei einem erreichbaren Gateway führt er pro Konto `probeAccount` und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportstatus plus Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann. Wenn das Gateway nicht erreichbar ist, fällt `channels status` auf reine Konfigurationszusammenfassungen statt Live-Prüfausgabe zurück.

Verwenden Sie `openclaw sessions`, Gateway `sessions.list` oder das Agent-Tool `sessions_list` nicht als Signal für den Socket-Zustand eines Kanals. Diese Oberflächen melden gespeicherte Konversationszeilen, nicht den Laufzeitstatus des Providers. Nach einem Neustart des Discord-Providers kann ein verbundenes, aber inaktives Konto fehlerfrei sein, während bis zum nächsten eingehenden oder ausgehenden Konversationsereignis keine Discord-Sitzungszeile erscheint.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt kanalspezifische Flags (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

`channels remove` funktioniert nur mit installierten/konfigurierten Kanal-Plugins. Verwenden Sie für installierbare Katalogkanäle zuerst `channels add`.
Bei laufzeitgestützten Kanal-Plugins fordert `channels remove` außerdem das laufende Gateway auf, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird. So bleibt beim Deaktivieren oder Löschen eines Kontos der alte Listener nicht bis zum Neustart aktiv.

Häufige nicht interaktive Hinzufüge-Oberflächen sind:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal-/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Authentifizierung des Standardkontos, sofern unterstützt

Wenn ein Kanal-Plugin während eines flaggesteuerten Hinzufüge-Befehls installiert werden muss, verwendet OpenClaw die Standard-Installationsquelle des Kanals, ohne den interaktiven Plugin-Installationsprompt zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Route these channel accounts to agents now?`

Wenn Sie die sofortige Bindung bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Kanal-Konto besitzen soll, und schreibt kontobezogene Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch kontenübergreifende Top-Level-Einstellungen für ein Einzelkonto verwendet, ein nicht standardmäßiges Konto hinzufügen, übernimmt OpenClaw kontobezogene Top-Level-Werte in die Konto-Map des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle legen diese Werte in `channels.<channel>.accounts.default` ab, aber gebündelte Kanäle können stattdessen ein vorhandenes passendes hochgestuftes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto existiert oder `defaultAccount` auf ein vorhandenes benanntes Konto verweist, behält die Hochstufung dieses Konto bei, statt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Vorhandene nur kanalbezogene Bindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder überschreibt im nicht interaktiven Modus keine Bindungen automatisch.
- Die interaktive Einrichtung kann optional kontobezogene Bindungen hinzufügen.

Wenn Ihre Konfiguration bereits in einem gemischten Zustand war (benannte Konten vorhanden und Top-Level-Werte für ein Einzelkonto weiterhin gesetzt), führen Sie `openclaw doctor --fix` aus, um kontobezogene Werte in das hochgestufte Konto zu verschieben, das für diesen Kanal ausgewählt wurde. Die meisten Kanäle stufen in `accounts.default` hoch; Matrix kann stattdessen ein vorhandenes benanntes/standardmäßiges Ziel beibehalten.

## Anmelden und Abmelden (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--verbose`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.
- `channels logout` bevorzugt den Live-Gateway-Pfad, wenn er erreichbar ist, sodass die Abmeldung jeden aktiven Listener stoppt, bevor der Auth-Status des Kanals gelöscht wird. Wenn kein lokales Gateway erreichbar ist, fällt der Befehl auf die lokale Auth-Bereinigung zurück.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent `exec` blockiert diesen interaktiven Login-Ablauf; kanalnative Agent-Login-Tools wie `whatsapp_login` sollten aus dem Chat verwendet werden, wenn sie verfügbar sind.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine breite Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt keine Nutzungs-/Kontingent-Snapshots von Modell-Providern mehr aus. Verwenden Sie dafür `openclaw status` (Übersicht) oder `openclaw models list` (pro Provider).
- `openclaw channels status` fällt auf reine Konfigurationszusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn ein unterstützter Kanal-Berechtigungsnachweis über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, wird dieses Konto mit herabgestuften Hinweisen als konfiguriert gemeldet, statt als nicht konfiguriert angezeigt zu werden.

## Fähigkeiten prüfen

Rufen Sie Provider-Fähigkeitshinweise (Intents/Scopes, sofern verfügbar) plus statische Feature-Unterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Erweiterungen).
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine reine numerische Kanal-ID und gilt nur für Discord. Bei Discord-Sprachkanälen markiert die Berechtigungsprüfung fehlende `ViewChannel`, `Connect`, `Speak`, `SendMessages` und `ReadMessageHistory`.
- Prüfungen sind Provider-spezifisch: Discord-Intents + optionale Kanalberechtigungen; Slack-Bot- + Benutzer-Scopes; Telegram-Bot-Flags + Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token + Graph-Rollen/Scopes (annotiert, wo bekannt). Kanäle ohne Prüfungen melden `Probe: unavailable`.

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
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, dieser Berechtigungsnachweis im aktuellen Befehlspfad jedoch nicht verfügbar ist, gibt der Befehl herabgestufte nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.
- `channels resolve` installiert keine Kanal-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kanalübersicht](/de/channels)
