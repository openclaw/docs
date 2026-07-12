---
read_when:
    - Sie möchten Channel-Konten hinzufügen oder entfernen (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp und weitere)
    - Sie möchten den Kanalstatus überprüfen oder die Kanalprotokolle live verfolgen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Funktionen, Auflösung, Protokolle, An-/Abmeldung)
title: Kanäle
x-i18n:
    generated_at: "2026-07-12T15:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chatkanal-Konten und deren Laufzeitstatus auf dem Gateway.

Zugehörige Dokumentation:

- Kanalanleitungen: [Kanäle](/de/channels)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)

## Häufig verwendete Befehle

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` zeigt nur Chatkanäle an: standardmäßig konfigurierte Konten mit den Statuskennzeichnungen `installed`, `configured` und `enabled` für jedes Konto (`--json` für maschinenlesbare Ausgabe). Übergeben Sie `--all`, um zusätzlich gebündelte Kanäle anzuzeigen, für die noch kein Konto konfiguriert ist, sowie installierbare Katalogkanäle, die sich noch nicht auf dem Datenträger befinden. Provider-Authentifizierung und Modellnutzung werden an anderer Stelle verwaltet: `openclaw models auth list` für Provider-Authentifizierungsprofile, `openclaw status` oder `openclaw models list` für Nutzung und Kontingent.

## Status / Funktionen / Auflösung / Protokolle

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (Standardwert: `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (erfordert `--channel`), `--target <dest>` (erfordert `--channel`), `--timeout <ms>` (Standardwert: `10000`, begrenzt auf `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (Standardwert: `auto`), `--json`
- `channels logs`: `--channel <name|all>` (Standardwert: `all`), `--lines <n>` (Standardwert: `200`), `--json`

`channels status --probe` ist der Live-Pfad: Bei einem erreichbaren Gateway führt er für jedes Konto
`probeAccount`- und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe neben dem
Transportstatus auch Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed`
enthalten kann. Wenn der Gateway nicht erreichbar ist, greift `channels status` anstelle der
Live-Prüfausgabe auf Zusammenfassungen zurück, die ausschließlich auf der Konfiguration basieren.

Verwenden Sie `openclaw sessions`, Gateway `sessions.list` oder das Agent-Tool
`sessions_list` nicht als Signal für den Zustand des Channel-Sockets. Diese Schnittstellen melden
gespeicherte Konversationszeilen, nicht den Laufzeitstatus des Providers. Nach einem Neustart des Discord-Providers
kann ein verbundenes, aber inaktives Konto fehlerfrei funktionieren, obwohl keine Discord-Sitzungszeile
angezeigt wird, bis das nächste ein- oder ausgehende Konversationsereignis eintritt.

## Konten hinzufügen/entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` zeigt Channel-spezifische Flags (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).
</Tip>

`channels remove` funktioniert nur mit installierten/konfigurierten Channel-Plugins. Verwenden Sie für installierbare Katalog-Channels zuerst `channels add`. Ohne `--delete` werden Sie gefragt, ob das Konto deaktiviert werden soll, und dessen Konfiguration bleibt erhalten; `--delete` entfernt die Konfigurationseinträge ohne Rückfrage.
Bei laufzeitgestützten Channel-Plugins weist `channels remove` außerdem den laufenden Gateway an, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird. Dadurch bleibt beim Deaktivieren oder Löschen eines Kontos der alte Listener nicht bis zum Neustart aktiv.

Nicht interaktive, kanalübergreifend verwendete Hinzufügen-Flags: `--account <id>`, `--name <name>`, `--token`, `--token-file`, `--bot-token`, `--app-token`, `--secret`, `--secret-file`, `--password`, `--cli-path`, `--url`, `--base-url`, `--http-url`, `--auth-dir` und `--use-env` (umgebungsvariablenbasierte Authentifizierung, nur für das Standardkonto, sofern unterstützt). Kanalspezifische Flags umfassen:

| Kanal       | Flags                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Wenn während eines flaggesteuerten Hinzufügen-Befehls ein Kanal-Plugin installiert werden muss, verwendet OpenClaw die standardmäßige Installationsquelle des Kanals, ohne die interaktive Eingabeaufforderung zur Plugin-Installation zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Sie zu Eingaben auffordern:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Route these channel accounts to agents now?`

Wenn Sie die Bindung jetzt bestätigen, fragt der Assistent, welcher Agent für jedes konfigurierte Kanalkonto zuständig sein soll, und schreibt kontospezifische Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agenten](/de/cli/agents)).

Wenn Sie einem Kanal, der noch übergeordnete Einzelkonto-Einstellungen verwendet, ein Konto hinzufügen, das nicht das Standardkonto ist, überführt OpenClaw diese übergeordneten Werte in die Kontozuordnung des Kanals, bevor das neue Konto geschrieben wird. Bei der Überführung wird ein vorhandenes benanntes Konto wiederverwendet, wenn der Kanal genau eines hat oder wenn `defaultAccount` auf eines verweist; andernfalls werden die Werte unter `channels.<channel>.accounts.default` abgelegt.

Das Routing-Verhalten bleibt konsistent:

- Vorhandene Bindungen nur für Kanäle (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder überschreibt Bindungen im nicht interaktiven Modus nicht automatisch.
- Bei der interaktiven Einrichtung können optional kontospezifische Bindungen hinzugefügt werden.

Wenn sich Ihre Konfiguration bereits in einem gemischten Zustand befand (benannte Konten vorhanden und übergeordnete Einzelkonto-Werte weiterhin festgelegt), führen Sie `openclaw doctor --fix` aus, um kontospezifische Werte in das für diesen Kanal ausgewählte überführte Konto zu verschieben.

## An- und Abmeldung (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--account <id>` und `--verbose`; `channels logout` unterstützt `--account <id>`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein konfigurierter Kanal diese Aktion unterstützt; bei mehreren müssen Sie `--channel` angeben.
- `channels logout` bevorzugt den aktiven Gateway-Pfad, wenn dieser erreichbar ist, sodass beim Abmelden alle aktiven Listener beendet werden, bevor der Authentifizierungsstatus des Kanals gelöscht wird. Wenn ein lokaler Gateway nicht erreichbar ist, wird ersatzweise die lokale Authentifizierung bereinigt; bei `gateway.mode: "remote"` führt der Gateway-Fehler stattdessen zum Fehlschlagen des Befehls.
- Nach einer erfolgreichen Anmeldung fordert die CLI einen erreichbaren lokalen Gateway auf, das Konto zu starten; im Remote-Modus speichert sie die Authentifizierung lokal und weist darauf hin, dass die Remote-Laufzeit nicht neu gestartet wurde.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent-`exec` blockiert diesen interaktiven Anmeldeablauf; kanaleigene Agent-Anmeldewerkzeuge wie `whatsapp_login` sollten, sofern verfügbar, im Chat verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels status` greift auf reine Konfigurationszusammenfassungen zurück, wenn der Gateway nicht erreichbar ist. Wenn Anmeldedaten eines unterstützten Kanals über SecretRef konfiguriert, im aktuellen Befehlspfad jedoch nicht verfügbar sind, wird das Konto als konfiguriert mit Hinweisen auf eingeschränkte Funktionalität gemeldet, anstatt es als nicht konfiguriert anzuzeigen.

## Prüfung der Fähigkeiten

Rufen Sie Hinweise zu den Provider-Fähigkeiten (Intents/Bereiche, sofern verfügbar) sowie die statische Funktionsunterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um alle Kanäle aufzulisten (einschließlich der von Plugins bereitgestellten Kanäle).
- `--account` ist nur zusammen mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine unverarbeitete numerische Kanal-ID und gilt nur für Discord. Bei Discord-Sprachkanälen kennzeichnet die Berechtigungsprüfung fehlende Berechtigungen für `ViewChannel`, `Connect`, `Speak`, `SendMessages` und `ReadMessageHistory`.
- Prüfungen sind Provider-spezifisch: Discord-Bot-Identität und Intents sowie optionale Kanalberechtigungen; Slack-Bot- und Benutzerbereiche; Telegram-Bot-Flags und Webhook; Signal-Daemon-Version; Microsoft-Teams-App-Token und Graph-Rollen/-Bereiche (soweit bekannt mit Anmerkungen). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Bei mehreren Einträgen mit demselben Namen werden aktive Übereinstimmungen bevorzugt.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, diese Anmeldedaten im aktuellen Befehlspfad jedoch nicht verfügbar sind, gibt der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, anstatt den gesamten Durchlauf abzubrechen.
- `channels resolve` installiert keine Kanal-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kanalübersicht](/de/channels)
