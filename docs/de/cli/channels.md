---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanalprotokolle fortlaufend anzeigen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmeldung/Abmeldung, Protokolle)
title: Kanäle
x-i18n:
    generated_at: "2026-05-02T20:43:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chat-Kanalkonten und deren Laufzeitstatus auf dem Gateway.

Zugehörige Dokumentation:

- Kanalhandbücher: [Kanäle](/de/channels)
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

## Status / Funktionen / Auflösung / Logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Auf einem erreichbaren Gateway führt er pro Konto
`probeAccount`- und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportstatus
plus Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn der Gateway nicht erreichbar ist, fällt `channels status` auf reine Konfigurationszusammenfassungen
anstelle von Live-Prüfausgaben zurück.

Verwenden Sie `openclaw sessions`, Gateway `sessions.list` oder das Agent-Tool
`sessions_list` nicht als Signal für den Socket-Zustand eines Kanals. Diese Oberflächen melden
gespeicherte Konversationszeilen, nicht den Provider-Laufzeitstatus. Nach einem Neustart des Discord-Providers
kann ein verbundenes, aber stilles Konto fehlerfrei sein, auch wenn keine Discord-Sitzungszeile
erscheint, bis das nächste eingehende oder ausgehende Konversationsereignis eintritt.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt kanalbezogene Flags (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

`channels remove` funktioniert nur mit installierten/konfigurierten Kanal-Plugins. Verwenden Sie zuerst `channels add` für installierbare Katalogkanäle.
Bei laufzeitgestützten Kanal-Plugins fordert `channels remove` außerdem den laufenden Gateway auf, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird. So bleibt der alte Listener beim Deaktivieren oder Löschen eines Kontos nicht bis zum Neustart aktiv.

Häufige nicht interaktive Hinzufügeoberflächen umfassen:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Authentifizierung des Standardkontos, sofern unterstützt

Wenn während eines flaggesteuerten `add`-Befehls ein Kanal-Plugin installiert werden muss, verwendet OpenClaw die Standardinstallationsquelle des Kanals, ohne die interaktive Plugin-Installationsaufforderung zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie das sofortige Binden bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Kanalkonto besitzen soll, und schreibt kontospezifische Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch Single-Account-Einstellungen auf oberster Ebene verwendet, ein Konto hinzufügen, das nicht das Standardkonto ist, verschiebt OpenClaw kontospezifische Werte der obersten Ebene in die Kontozuordnung des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle legen diese Werte in `channels.<channel>.accounts.default` ab, aber gebündelte Kanäle können stattdessen ein vorhandenes passendes verschobenes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto vorhanden ist oder `defaultAccount` auf ein vorhandenes benanntes Konto zeigt, behält die Verschiebung dieses Konto bei, statt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Vorhandene kanalbezogene Bindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder überschreibt im nicht interaktiven Modus keine Bindungen automatisch.
- Die interaktive Einrichtung kann optional kontospezifische Bindungen hinzufügen.

Wenn Ihre Konfiguration bereits in einem gemischten Zustand war (benannte Konten vorhanden und Single-Account-Werte auf oberster Ebene weiterhin gesetzt), führen Sie `openclaw doctor --fix` aus, um kontospezifische Werte in das für diesen Kanal gewählte verschobene Konto zu übertragen. Die meisten Kanäle verschieben nach `accounts.default`; Matrix kann stattdessen ein vorhandenes benanntes/Standardziel beibehalten.

## Anmelden und Abmelden (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--verbose`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.
- `channels logout` bevorzugt den Live-Gateway-Pfad, wenn er erreichbar ist, sodass die Abmeldung jeden aktiven Listener stoppt, bevor der Authentifizierungszustand des Kanals gelöscht wird. Wenn ein lokaler Gateway nicht erreichbar ist, fällt der Befehl auf die lokale Authentifizierungsbereinigung zurück.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent-`exec` blockiert diesen interaktiven Login-Ablauf; kanaleigene Agent-Login-Tools wie `whatsapp_login` sollten, sofern verfügbar, aus dem Chat verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt `Claude: HTTP 403 ... user:profile` aus → der Nutzungs-Snapshot benötigt den Scope `user:profile`. Verwenden Sie `--no-usage`, stellen Sie einen claude.ai-Sitzungsschlüssel (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) bereit oder authentifizieren Sie sich erneut über Claude CLI.
- `openclaw channels status` fällt auf reine Konfigurationszusammenfassungen zurück, wenn der Gateway nicht erreichbar ist. Wenn ein unterstützter Kanal-Credential über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, wird dieses Konto als konfiguriert mit herabgestuften Hinweisen gemeldet, statt es als nicht konfiguriert anzuzeigen.

## Funktionsprüfung

Rufen Sie Hinweise zu Provider-Funktionen (Intents/Scopes, sofern verfügbar) plus statische Feature-Unterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Erweiterungen).
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine reine numerische Kanal-ID und gilt nur für Discord.
- Prüfungen sind providerspezifisch: Discord-Intents plus optionale Kanalberechtigungen; Slack-Bot- und User-Scopes; Telegram-Bot-Flags plus Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token plus Graph-Rollen/Scopes (wo bekannt annotiert). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen haben.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, dieser Credential aber im aktuellen Befehlspfad nicht verfügbar ist, gibt der Befehl herabgestufte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.
- `channels resolve` installiert keine Kanal-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanalübersicht](/de/channels)
