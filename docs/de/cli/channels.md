---
read_when:
    - Sie möchten Kanal-Konten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanal-Logs live mitverfolgen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmeldung/Abmeldung, Protokolle)
title: Kanäle
x-i18n:
    generated_at: "2026-05-02T06:28:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9cfde99d49d63397756b182a20ae3936a6b23f2455616dc86ceb3f16a205c06
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chat-Kanal-Konten und deren Laufzeitstatus auf dem Gateway.

Verwandte Dokumentation:

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

## Status / Funktionen / Auflösen / Logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Bei einem erreichbaren Gateway führt er pro Konto
`probeAccount`- und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportstatus
plus Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn der Gateway nicht erreichbar ist, fällt `channels status` auf reine Konfigurationszusammenfassungen
statt auf Live-Prüfausgaben zurück.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt kanalbezogene Flags (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

`channels remove` arbeitet nur mit installierten/konfigurierten Kanal-Plugins. Verwenden Sie zuerst `channels add` für installierbare Katalogkanäle.
Bei laufzeitgestützten Kanal-Plugins fordert `channels remove` außerdem den laufenden Gateway auf, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird, sodass das Deaktivieren oder Löschen eines Kontos den alten Listener nicht bis zum Neustart aktiv lässt.

Häufige nicht-interaktive Hinzufügungsoberflächen umfassen:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Authentifizierung des Standardkontos, sofern unterstützt

Wenn ein Kanal-Plugin während eines flaggesteuerten `add`-Befehls installiert werden muss, verwendet OpenClaw die Standard-Installationsquelle des Kanals, ohne die interaktive Plugin-Installationsaufforderung zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent nach Folgendem fragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie das sofortige Binden bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Kanalkonto besitzen soll, und schreibt kontospezifische Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch Top-Level-Einstellungen für ein einzelnes Konto verwendet, ein Nicht-Standardkonto hinzufügen, verschiebt OpenClaw kontospezifische Top-Level-Werte in die Account-Map des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle legen diese Werte in `channels.<channel>.accounts.default` ab, gebündelte Kanäle können jedoch stattdessen ein vorhandenes passendes verschobenes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto vorhanden ist oder `defaultAccount` auf ein vorhandenes benanntes Konto verweist, behält die Verschiebung dieses Konto bei, statt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Bestehende reine Kanalbindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder schreibt im nicht-interaktiven Modus keine Bindungen automatisch um.
- Die interaktive Einrichtung kann optional kontospezifische Bindungen hinzufügen.

Wenn Ihre Konfiguration bereits in einem gemischten Zustand war (benannte Konten vorhanden und Top-Level-Werte für ein einzelnes Konto weiterhin gesetzt), führen Sie `openclaw doctor --fix` aus, um kontospezifische Werte in das für diesen Kanal ausgewählte verschobene Konto zu verschieben. Die meisten Kanäle verschieben nach `accounts.default`; Matrix kann stattdessen ein vorhandenes benanntes/Standardziel beibehalten.

## Anmeldung und Abmeldung (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--verbose`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.
- `channels logout` bevorzugt den Live-Gateway-Pfad, wenn erreichbar, sodass die Abmeldung aktive Listener stoppt, bevor der Authentifizierungsstatus des Kanals gelöscht wird. Wenn ein lokaler Gateway nicht erreichbar ist, fällt der Befehl auf lokale Authentifizierungsbereinigung zurück.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent-`exec` blockiert diesen interaktiven Login-Ablauf; kanalnative Agent-Login-Tools wie `whatsapp_login` sollten, sofern verfügbar, aus dem Chat verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt `Claude: HTTP 403 ... user:profile` aus → der Nutzungs-Snapshot benötigt den Scope `user:profile`. Verwenden Sie `--no-usage`, stellen Sie einen claude.ai-Sitzungsschlüssel bereit (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) oder authentifizieren Sie sich erneut über die Claude CLI.
- `openclaw channels status` fällt auf reine Konfigurationszusammenfassungen zurück, wenn der Gateway nicht erreichbar ist. Wenn ein unterstützter Kanal-Zugangsnachweis per SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet der Befehl dieses Konto als konfiguriert mit eingeschränkten Hinweisen, statt es als nicht konfiguriert anzuzeigen.

## Funktionsprüfung

Rufen Sie Provider-Funktionshinweise (Intents/Scopes, sofern verfügbar) plus statische Funktionsunterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Plugins).
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Kanal-ID und gilt nur für Discord.
- Prüfungen sind Provider-spezifisch: Discord-Intents plus optionale Kanalberechtigungen; Slack-Bot plus Benutzer-Scopes; Telegram-Bot-Flags plus Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token plus Graph-Rollen/-Scopes (annotiert, soweit bekannt). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen zu IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses zu IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen haben.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto per SecretRef konfiguriert ist, dieser Zugangsnachweis im aktuellen Befehlspfad aber nicht verfügbar ist, gibt der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.
- `channels resolve` installiert keine Kanal-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanalübersicht](/de/channels)
