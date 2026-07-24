---
read_when:
    - Sie möchten Channel-Konten hinzufügen oder entfernen (Discord, Google Chat, iMessage, Matrix, Signal, Slack, Telegram, WhatsApp und weitere)
    - Sie möchten den Kanalstatus prüfen oder Kanalprotokolle fortlaufend anzeigen.
    - Sie müssen ein fehlgeschlagenes eingehendes Kanalereignis überprüfen oder erneut übermitteln
summary: CLI-Referenz für `openclaw channels` (Konten, Status, unzustellbare Nachrichten, Funktionen, Auflösung, Protokolle, An-/Abmeldung)
title: Kanäle
x-i18n:
    generated_at: "2026-07-24T04:56:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5b7d674264af51d6fec34c8c95256129d66918b7c4515ac0f2c2bd311f2c3b
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Verwalten Sie Chatkanalkonten und deren Laufzeitstatus auf dem Gateway.

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
openclaw channels dead-letters list --channel telegram --account default
```

`channels list` zeigt nur Chatkanäle an: standardmäßig konfigurierte Konten mit den Statuskennzeichnungen `installed`, `configured` und `enabled` je Konto (`--json` für maschinenlesbare Ausgabe). Übergeben Sie `--all`, um außerdem gebündelte Kanäle ohne bisher konfiguriertes Konto sowie installierbare Katalogkanäle anzuzeigen, die noch nicht auf dem Datenträger vorhanden sind. Provider-Authentifizierung und Modellnutzung werden an anderer Stelle verwaltet: `openclaw models auth list` für Provider-Authentifizierungsprofile, `openclaw status` oder `openclaw models list` für Nutzung/Kontingent.

## Status / Funktionen / Auflösung / Protokolle

- `channels status`: `--channel <name>`, `--probe`, `--timeout <ms>` (Standardwert `10000`), `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (erfordert `--channel`), `--target <dest>` (erfordert `--channel`), `--timeout <ms>` (Standardwert `10000`, begrenzt auf `30000`), `--json`
- `channels resolve <entries...>`: `--channel <name>`, `--account <id>`, `--kind <auto|user|group>` (Standardwert `auto`), `--json`
- `channels logs`: `--channel <name|all>` (Standardwert `all`), `--lines <n>` (Standardwert `200`), `--json`

`channels status --probe` ist der Live-Pfad: Auf einem erreichbaren Gateway führt er je Konto
`probeAccount` sowie optionale `auditAccount`-Prüfungen aus. Die Ausgabe kann daher den Transportstatus
und Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten.
Wenn das Gateway nicht erreichbar ist, greift `channels status` statt einer Live-Prüfausgabe
auf reine Konfigurationszusammenfassungen zurück.

## Eingehende Dead Letters

Eingehende Ereignisse, deren Wiederholungsrichtlinie ausgeschöpft ist, verbleiben für den bestehenden Aufbewahrungszeitraum fehlgeschlagener Einträge der Warteschlange in der gemeinsamen Statusdatenbank. Prüfen Sie ein Kanalkonto mit:

```bash
openclaw channels dead-letters list --channel telegram --account default
openclaw channels dead-letters list --channel telegram --account default --json
```

Die Textansicht zeigt Ereignis-IDs, Fehlerursachen, die Anzahl der Versuche und das Alter der Fehler. Die JSON-Ausgabe enthält zu Diagnosezwecken außerdem die aufbewahrte Nutzlast, Metadaten, Lane und Zeitstempel der Versuche.

Nachdem Sie das zugrunde liegende Problem behoben haben, stellen Sie ein Ereignis mit seiner ursprünglichen Ereignis-ID erneut in die Warteschlange:

```bash
openclaw channels dead-letters resubmit <event-id> --channel telegram --account default
```

Führen Sie diese Befehle auf dem Gateway-Host aus, damit sie auf dieselbe gemeinsame Statusdatenbank wie die Kanallaufzeit zugreifen. Bei der erneuten Übermittlung bleiben Nutzlast, Metadaten und Lane erhalten, aber der Versuchszähler und das Warteschlangenalter werden zurückgesetzt. Die Fehlermarkierung dieses Ereignisses wird atomar ersetzt. Wird der Befehl wiederholt, während das Ereignis aussteht oder beansprucht ist, wird er daher abgelehnt, anstatt eine zweite Zustellung zu erstellen. Der laufende Kanal übernimmt es beim nächsten Leeren des Eingangs. Abgeschlossene Ereignisse verbleiben im Endzustand und können nicht erneut übermittelt werden. Fehlgeschlagene Zeilen, die vor Einführung der Nutzlastaufbewahrung erstellt wurden, können weiterhin in der Liste erscheinen. Ihre erneute Übermittlung wird jedoch abgelehnt, weil ihre Nutzlast nicht verfügbar ist.

`openclaw health` meldet je Kanalkonto die Anzahl der Dead Letters und das Alter des ältesten Fehlers. `openclaw doctor` nennt betroffene Konten und verweist auf den Prüfbefehl.

Verwenden Sie weder `openclaw sessions` noch Gateway-`sessions.list` oder das Agent-Tool
`sessions_list` als Signal für den Zustand des Kanalsockets. Diese Oberflächen melden
gespeicherte Konversationszeilen und nicht den Laufzeitstatus des Providers. Nach dem Neustart eines Discord-Providers
kann ein verbundenes, aber inaktives Konto fehlerfrei funktionieren, obwohl keine Discord-Sitzungszeile
erscheint, bis das nächste ein- oder ausgehende Konversationsereignis eintritt.

## Konten hinzufügen/entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add telegram --help` oder `openclaw channels add --channel telegram --help` zeigt nur die Einrichtungsflags von Telegram an. `openclaw channels add --help` zeigt nur die gemeinsame Befehlshülle an.
</Tip>

`channels remove` verarbeitet nur installierte/konfigurierte Kanal-Plugins. Verwenden Sie für installierbare Katalogkanäle zuerst `channels add`. Ohne `--delete` werden Sie aufgefordert, das Konto zu deaktivieren, wobei seine Konfiguration erhalten bleibt; `--delete` entfernt die Konfigurationseinträge ohne Nachfrage.
Bei laufzeitgestützten Kanal-Plugins fordert `channels remove` außerdem das laufende Gateway auf, das ausgewählte Konto zu stoppen, bevor die Konfiguration aktualisiert wird. Dadurch bleibt der alte Listener nach dem Deaktivieren oder Löschen eines Kontos nicht bis zum Neustart aktiv.

Die gemeinsame Steuerungshülle enthält nur `--channel`, `--account` und die optionale Kontoanzeige `--name`. Jedes moderne Kanal-Plugin verwaltet seine Anmeldedaten sowie seine transport- und providerspezifische Semantik selbst. Sobald ein Kanal anhand seiner positionellen ID oder über `--channel <id>` ausgewählt wurde, erstellt die CLI ausschließlich die Optionen dieses Kanals aus den Paketmetadaten des gebündelten oder installierten Plugins, ohne den Laufzeitcode des Kanals zu laden.

Ähnlich wirkende Flags wie `--token`, `--url` oder `--use-env` werden weiterhin vom Kanal verwaltet, wenn sie von einem modernen Vertrag verarbeitet werden. Wenn ein ausgewähltes Drittanbieter-Plugin noch den veralteten gemeinsamen Einrichtungsadapter verwendet, registriert der Kern ausschließlich für diesen Kanal den veröffentlichten Satz an Kompatibilitätsflags zusammen mit dessen veraltetem `cliAddOptions`. Nicht zugehörige veraltete Felder gelangen nicht in andere Kanäle, und ein ausgewählter moderner Kanal lehnt nicht deklarierte Kompatibilitätsflags ab.

Beispiele für kanaleigene Flags:

| Kanal       | Flags                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--signal-transport`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`    |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

Wenn bei einem flaggesteuerten Hinzufügebefehl ein Kanal-Plugin installiert werden muss, verwendet OpenClaw die Standardinstallationsquelle des Kanals, ohne die interaktive Aufforderung zur Plugin-Installation zu öffnen.

Sowohl die geführte als auch die flaggesteuerte Einrichtung durchlaufen den Parser, die Validierung, die Kontoauflösung, den Konfigurationsschreiber und die Hooks nach dem Schreiben des ausgewählten Kanals. Nicht unterstützte Flags führen zum Einrichtungsfehler des zuständigen Kanals, anstatt über eine globale Eingabesammlung akzeptiert zu werden.

Wenn Sie `openclaw channels add` ohne direkte Konto-, Anmeldedaten- oder Kanalkonfigurationsflags ausführen, kann der interaktive Assistent Eingaben abfragen. Sowohl eine positionelle Kanal-ID als auch `--channel <id>` wählen diesen Kanal vorab aus, ohne die Anleitung zu umgehen:

```bash
openclaw channels add telegram
openclaw channels add --channel telegram
```

Der Assistent kann Folgendes abfragen:

- Konto-IDs je ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Route these channel accounts to agents now?`

Wenn Sie die sofortige Bindung bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Kanalkonto verwalten soll, und schreibt kontobezogene Routingbindungen.

Sie können dieselben Routingregeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [Agenten](/de/cli/agents)).

Wenn Sie einem Kanal, der noch über übergeordnete Einzelkontoeinstellungen verfügt, ein vom Standard abweichendes Konto hinzufügen, überführt OpenClaw diese übergeordneten Werte in die Kontozuordnung des Kanals, bevor das neue Konto geschrieben wird. Bei der Überführung wird ein vorhandenes benanntes Konto wiederverwendet, wenn der Kanal genau eines enthält oder wenn `defaultAccount` auf eines verweist. Andernfalls werden die Werte in `channels.<channel>.accounts.default` gespeichert.

Das Routingverhalten bleibt konsistent:

- Bestehende reine Kanalbindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder überschreibt Bindungen im nicht interaktiven Modus nicht automatisch.
- Die interaktive Einrichtung kann optional kontobezogene Bindungen hinzufügen.

Wenn sich Ihre Konfiguration bereits in einem gemischten Zustand befand (benannte Konten waren vorhanden und übergeordnete Einzelkontowerte weiterhin festgelegt), führen Sie `openclaw doctor --fix` aus, um kontobezogene Werte in das für diesen Kanal ausgewählte überführte Konto zu verschieben.

## An- und Abmeldung (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` unterstützt `--account <id>` und `--verbose`; `channels logout` unterstützt `--account <id>`.
- `channels login` und `logout` können den Kanal ableiten, wenn nur ein konfigurierter Kanal die jeweilige Aktion unterstützt. Bei mehreren Kanälen übergeben Sie `--channel`.
- `channels logout` bevorzugt den Live-Gateway-Pfad, wenn dieser erreichbar ist, sodass bei der Abmeldung alle aktiven Listener gestoppt werden, bevor der Authentifizierungsstatus des Kanals gelöscht wird. Wenn kein lokales Gateway erreichbar ist, wird ersatzweise die lokale Authentifizierung bereinigt; mit `gateway.mode: "remote"` führt der Gateway-Fehler stattdessen zum Fehlschlagen des Befehls.
- Nach einer erfolgreichen Anmeldung fordert die CLI ein erreichbares lokales Gateway auf, das Konto zu starten. Im Remotemodus speichert sie die Authentifizierung lokal und weist darauf hin, dass die entfernte Laufzeit nicht neu gestartet wurde.
- Führen Sie `channels login` in einem Terminal auf dem Gateway-Host aus. Agent-`exec` blockiert diesen interaktiven Anmeldeablauf. Kanalnative Agent-Anmeldetools wie `whatsapp_login` sollten, sofern verfügbar, im Chat verwendet werden.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels status` greift auf reine Konfigurationszusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn die Anmeldedaten eines unterstützten Kanals über SecretRef konfiguriert, im aktuellen Befehlspfad jedoch nicht verfügbar sind, wird das Konto als konfiguriert mit Hinweisen auf die eingeschränkte Funktion gemeldet, statt es als nicht konfiguriert anzuzeigen.

## Funktionsprüfung

Rufen Sie Hinweise zu Provider-Funktionen (Intents/Bereiche, sofern verfügbar) sowie die statische Funktionsunterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um alle Kanäle aufzulisten (einschließlich der von Plugins bereitgestellten Kanäle).
- `--account` ist nur zusammen mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine unverarbeitete numerische Kanal-ID und gilt nur für Discord. Bei Discord-Sprachkanälen kennzeichnet die Berechtigungsprüfung fehlende `ViewChannel`, `Connect`, `Speak`, `SendMessages` und `ReadMessageHistory`.
- Prüfungen sind Provider-spezifisch: Discord-Botidentität und -Intents sowie optionale Kanalberechtigungen; Slack-Bot- und Benutzer-Scopes; Telegram-Bot-Flags und Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token und Graph-Rollen/-Scopes (soweit bekannt mit Anmerkungen versehen). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp festzulegen.
- Bei mehreren Einträgen mit demselben Namen bevorzugt die Auflösung aktive Treffer.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, diese Zugangsdaten im aktuellen Befehlspfad jedoch nicht verfügbar sind, gibt der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, statt den gesamten Lauf abzubrechen.
- `channels resolve` installiert keine Kanal-Plugins. Verwenden Sie `channels add --channel <name>`, bevor Sie Namen für einen installierbaren Katalogkanal auflösen.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Kanalübersicht](/de/channels)
