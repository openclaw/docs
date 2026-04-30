---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanal-Logs verfolgen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmeldung/Abmeldung, Protokolle)
title: Kanäle
x-i18n:
    generated_at: "2026-04-30T06:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chat-Kanal-Konten und deren Laufzeitstatus auf dem Gateway.

Zugehörige Dokumentation:

- Kanal-Anleitungen: [Kanäle](/de/channels)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)

## Häufige Befehle

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / Capabilities / Resolve / Logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Auf einem erreichbaren Gateway führt er pro Konto
`probeAccount` und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportstatus
plus Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn das Gateway nicht erreichbar ist, fällt `channels status` statt einer Live-Probe-Ausgabe
auf reine Konfigurationszusammenfassungen zurück.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt kanalbezogene Flags (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

Häufige nicht interaktive Add-Oberflächen umfassen:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal-/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für Standardkonto-Authentifizierung über Umgebungsvariablen, wo unterstützt

Wenn während eines flaggesteuerten Add-Befehls ein Kanal-Plugin installiert werden muss, verwendet OpenClaw die Standard-Installationsquelle des Kanals, ohne die interaktive Plugin-Installationsabfrage zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent nach Folgendem fragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie die sofortige Bindung bestätigen, fragt der Assistent, welcher Agent welches konfigurierte Kanalkonto besitzen soll, und schreibt konto-spezifische Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch Single-Account-Einstellungen auf oberster Ebene verwendet, ein nicht standardmäßiges Konto hinzufügen, überführt OpenClaw konto-spezifische Werte der obersten Ebene in die Kontenzuordnung des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle legen diese Werte in `channels.<channel>.accounts.default` ab, aber gebündelte Kanäle können stattdessen ein vorhandenes, passendes überführtes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto existiert oder `defaultAccount` auf ein vorhandenes benanntes Konto verweist, behält die Überführung dieses Konto bei, statt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Bestehende kanalbasierte Bindungen (ohne `accountId`) passen weiterhin auf das Standardkonto.
- `channels add` erstellt oder überschreibt im nicht interaktiven Modus keine Bindungen automatisch.
- Die interaktive Einrichtung kann optional konto-spezifische Bindungen hinzufügen.

Wenn Ihre Konfiguration bereits in einem gemischten Zustand war (benannte Konten vorhanden und Single-Account-Werte auf oberster Ebene weiterhin gesetzt), führen Sie `openclaw doctor --fix` aus, um konto-spezifische Werte in das für diesen Kanal ausgewählte überführte Konto zu verschieben. Die meisten Kanäle überführen nach `accounts.default`; Matrix kann stattdessen ein vorhandenes benanntes Standardziel beibehalten.

## Login und Logout (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--verbose`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.
- Führen Sie `channels login` von einem Terminal auf dem Gateway-Host aus. Agent-`exec` blockiert diesen interaktiven Login-Ablauf; kanalnative Agent-Login-Tools wie `whatsapp_login` sollten, sofern verfügbar, aus dem Chat verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine breite Probe aus.
- Verwenden Sie `openclaw doctor` für angeleitete Korrekturen.
- `openclaw channels list` gibt `Claude: HTTP 403 ... user:profile` aus → Der Nutzungs-Snapshot benötigt den Scope `user:profile`. Verwenden Sie `--no-usage`, stellen Sie einen claude.ai-Sitzungsschlüssel bereit (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oder authentifizieren Sie sich erneut über die Claude CLI.
- `openclaw channels status` fällt auf reine Konfigurationszusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn ein unterstütztes Kanal-Credential über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet der Befehl dieses Konto mit eingeschränkten Hinweisen als konfiguriert, statt es als nicht konfiguriert anzuzeigen.

## Capabilities-Probe

Rufen Sie Provider-Capability-Hinweise (Intents/Scopes, sofern verfügbar) plus statische Feature-Unterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Plugins).
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Kanal-ID und gilt nur für Discord.
- Probes sind Provider-spezifisch: Discord-Intents plus optionale Kanalberechtigungen; Slack-Bot- plus Nutzer-Scopes; Telegram-Bot-Flags plus Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token plus Graph-Rollen/Scopes (annotiert, wo bekannt). Kanäle ohne Probes melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Nutzernamen über das Provider-Verzeichnis in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen teilen.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, das Credential aber im aktuellen Befehlspfad nicht verfügbar ist, gibt der Befehl eingeschränkt nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanäle-Übersicht](/de/channels)
