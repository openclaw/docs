---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanallogs fortlaufend anzeigen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmelden/Abmelden, Protokolle)
title: Kanäle
x-i18n:
    generated_at: "2026-05-10T19:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chatkanal-Konten und deren Laufzeitstatus auf dem Gateway.

Verwandte Dokumentation:

- Kanalanleitungen: [Kanäle](/de/channels)
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

`channels list` zeigt nur Chatkanäle an: standardmäßig konfigurierte Konten mit den Status-Tags `installed`, `configured` und `enabled` pro Konto. Übergeben Sie `--all`, um zusätzlich gebündelte Kanäle ohne bisher konfiguriertes Konto sowie installierbare Katalogkanäle anzuzeigen, die noch nicht auf der Festplatte vorhanden sind. Auth-Provider (OAuth + API-Schlüssel) und Nutzungs-/Kontingent-Snapshots von Modell-Providern werden hier nicht mehr ausgegeben; verwenden Sie `openclaw models auth list` für Provider-Auth-Profile und `openclaw status` oder `openclaw models list` für die Nutzung.

## Status / Fähigkeiten / Auflösung / Logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Auf einem erreichbaren Gateway führt er pro Konto
`probeAccount` und optional `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportstatus
sowie Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn das Gateway nicht erreichbar ist, fällt `channels status` auf rein konfigurationsbasierte Zusammenfassungen
statt Live-Prüfausgaben zurück.

Verwenden Sie `openclaw sessions`, Gateway `sessions.list` oder das Agent-Tool
`sessions_list` nicht als Signal für die Socket-Verfügbarkeit eines Kanals. Diese Oberflächen melden
gespeicherte Konversationszeilen, nicht den Laufzeitstatus des Providers. Nach einem Neustart des Discord-Providers
kann ein verbundenes, aber inaktives Konto funktionsfähig sein, während keine Discord-Sitzungszeile
erscheint, bis das nächste eingehende oder ausgehende Konversationsereignis eintrifft.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt kanalbezogene Flags an (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

`channels remove` arbeitet nur mit installierten/konfigurierten Kanal-Plugins. Verwenden Sie für installierbare Katalogkanäle zuerst `channels add`.
Bei laufzeitgestützten Kanal-Plugins fordert `channels remove` außerdem das laufende Gateway auf, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird. So bleibt beim Deaktivieren oder Löschen eines Kontos der alte Listener nicht bis zum Neustart aktiv.

Häufige nicht interaktive Add-Oberflächen sind:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Transportfelder für Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Auth des Standardkontos, sofern unterstützt

Wenn ein Kanal-Plugin während eines flaggesteuerten Add-Befehls installiert werden muss, verwendet OpenClaw die Standard-Installationsquelle des Kanals, ohne die interaktive Plugin-Installationsabfrage zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Route these channel accounts to agents now?`

Wenn Sie die sofortige Bindung bestätigen, fragt der Assistent ab, welcher Agent jedes konfigurierte Kanalkonto besitzen soll, und schreibt kontobezogene Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch Top-Level-Einstellungen für ein einzelnes Konto verwendet, ein nicht standardmäßiges Konto hinzufügen, verschiebt OpenClaw kontobezogene Top-Level-Werte in die Account Map des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle legen diese Werte in `channels.<channel>.accounts.default` ab, gebündelte Kanäle können stattdessen jedoch ein vorhandenes passendes hochgestuftes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto existiert oder `defaultAccount` auf ein vorhandenes benanntes Konto verweist, bewahrt die Hochstufung dieses Konto, statt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Bestehende kanalbezogene Bindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder schreibt im nicht interaktiven Modus keine Bindungen automatisch um.
- Die interaktive Einrichtung kann optional kontobezogene Bindungen hinzufügen.

Wenn Ihre Konfiguration bereits in einem gemischten Zustand war (benannte Konten vorhanden und Top-Level-Werte für ein einzelnes Konto noch gesetzt), führen Sie `openclaw doctor --fix` aus, um kontobezogene Werte in das für diesen Kanal gewählte hochgestufte Konto zu verschieben. Die meisten Kanäle stufen in `accounts.default` hoch; Matrix kann stattdessen ein vorhandenes benanntes/standardmäßiges Ziel beibehalten.

## Anmeldung und Abmeldung (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--verbose`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.
- `channels logout` bevorzugt den Live-Gateway-Pfad, wenn er erreichbar ist, sodass die Abmeldung jeden aktiven Listener stoppt, bevor der Auth-Status des Kanals gelöscht wird. Wenn kein lokales Gateway erreichbar ist, fällt der Befehl auf lokale Auth-Bereinigung zurück.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent `exec` blockiert diesen interaktiven Login-Ablauf; kanalnative Agent-Login-Tools wie `whatsapp_login` sollten, sofern verfügbar, aus dem Chat heraus verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt keine Nutzungs-/Kontingent-Snapshots von Modell-Providern mehr aus. Verwenden Sie dafür `openclaw status` (Übersicht) oder `openclaw models list` (pro Provider).
- `openclaw channels status` fällt auf rein konfigurationsbasierte Zusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn ein unterstützter Kanal-Credential über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, wird dieses Konto mit eingeschränkten Hinweisen als konfiguriert gemeldet, statt es als nicht konfiguriert anzuzeigen.

## Fähigkeitsprüfung

Rufen Sie Hinweise zu Provider-Fähigkeiten (Intents/Scopes, sofern verfügbar) sowie statische Feature-Unterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal (einschließlich Extensions) aufzulisten.
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Kanal-ID und gilt nur für Discord. Bei Discord-Sprachkanälen markiert die Berechtigungsprüfung fehlende `ViewChannel`, `Connect`, `Speak`, `SendMessages` und `ReadMessageHistory`.
- Prüfungen sind Provider-spezifisch: Discord-Intents + optionale Kanalberechtigungen; Slack-Bot + User-Scopes; Telegram-Bot-Flags + Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token + Graph-Rollen/-Scopes (wo bekannt annotiert). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp festzulegen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen teilen.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, dieser Credential im aktuellen Befehlspfad jedoch nicht verfügbar ist, gibt der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.
- `channels resolve` installiert keine Kanal-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanäle: Übersicht](/de/channels)
