---
read_when:
    - Planung des Wechsels von BlueBubbles zum gebündelten iMessage-Plugin
    - BlueBubbles-Konfigurationsschlüssel in iMessage-Entsprechungen übersetzen
    - imsg vor dem Aktivieren des iMessage-Plugins überprüfen
summary: Migrieren Sie alte BlueBubbles-Konfigurationen zum gebündelten iMessage-Plugin, ohne Pairing, Allowlisten oder Gruppenbindungen zu verlieren.
title: Von BlueBubbles kommend
x-i18n:
    generated_at: "2026-06-27T17:10:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Das gebündelte `imessage`-Plugin erreicht jetzt dieselbe private API-Oberfläche wie BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, Gruppenverwaltung, Anhänge), indem es [`steipete/imsg`](https://github.com/steipete/imsg) über JSON-RPC steuert. Wenn Sie bereits einen Mac mit installiertem `imsg` betreiben, können Sie den BlueBubbles-Server entfernen und das Plugin direkt mit Messages.app kommunizieren lassen.

Die BlueBubbles-Unterstützung wurde entfernt. OpenClaw unterstützt iMessage nur über `imsg`. Diese Anleitung dient der Migration alter `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; es gibt keinen anderen unterstützten Migrationspfad.

<Note>
Die kurze Ankündigung und Betreiberzusammenfassung finden Sie unter [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage).
</Note>

## Migrations-Checkliste

Verwenden Sie diese Checkliste, wenn Sie Ihre alte BlueBubbles-Konfiguration bereits kennen und den kürzesten sicheren Weg möchten:

1. Prüfen Sie `imsg` direkt auf dem Mac, auf dem Messages.app ausgeführt wird (`imsg chats`, `imsg history`, `imsg send` und `imsg rpc --help`).
2. Kopieren Sie Verhaltensschlüssel von `channels.bluebubbles` nach `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` und `actions`.
3. Entfernen Sie Transportschlüssel, die nicht mehr existieren: `serverUrl`, `password`, Webhook-URLs und die BlueBubbles-Servereinrichtung.
4. Wenn der Gateway nicht auf dem Messages-Mac läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper und legen Sie `remoteHost` für entfernte Anhangsabrufe fest.
5. Aktivieren Sie bei gestopptem Gateway `channels.imessage` und führen Sie dann `openclaw channels status --probe --channel imessage` aus.
6. Testen Sie eine DM, eine zugelassene Gruppe, Anhänge, sofern aktiviert, und jede private API-Aktion, die der Agent voraussichtlich verwenden soll.
7. Löschen Sie den BlueBubbles-Server und die alte `channels.bluebubbles`-Konfiguration, nachdem der iMessage-Pfad verifiziert wurde.

## Wann diese Migration sinnvoll ist

- Sie betreiben `imsg` bereits auf demselben Mac (oder auf einem per SSH erreichbaren Mac), auf dem Messages.app angemeldet ist.
- Sie möchten eine Komponente weniger betreiben: keinen separaten BlueBubbles-Server, keinen zu authentifizierenden REST-Endpunkt, keine Webhook-Verkabelung. Eine einzelne CLI-Binärdatei statt Server + Client-App + Hilfsprogramm.
- Sie verwenden einen [unterstützten macOS-/`imsg`-Build](/de/channels/imessage#requirements-and-permissions-macos), bei dem der private API-Probe `available: true` meldet.

## Was imsg tut

`imsg` ist eine lokale macOS-CLI für Messages. OpenClaw startet `imsg rpc` als untergeordneten Prozess und kommuniziert per JSON-RPC über stdin/stdout. Es gibt keinen HTTP-Server, keine Webhook-URL, keinen Hintergrund-Daemon, keinen Launch-Agent und keinen Port, der offengelegt werden muss.

- Lesezugriffe erfolgen aus `~/Library/Messages/chat.db` über ein schreibgeschütztes SQLite-Handle.
- Live eingehende Nachrichten kommen aus `imsg watch` / `watch.subscribe`, das `chat.db`-Dateisystemereignissen mit einem Polling-Fallback folgt.
- Sendevorgänge verwenden Messages.app-Automatisierung für normale Text- und Dateisendungen.
- Erweiterte Aktionen verwenden `imsg launch`, um den `imsg`-Helfer in Messages.app einzuschleusen. Das schaltet Lesebestätigungen, Tippindikatoren, Rich Sends, Bearbeiten, Zurückrufen, Antworten in Threads, Tapbacks und Gruppenverwaltung frei.
- Linux-Builds können eine kopierte `chat.db` untersuchen, aber nicht senden, die Live-Mac-Datenbank beobachten oder Messages.app steuern. Führen Sie für OpenClaw iMessage `imsg` auf dem angemeldeten Mac oder über einen SSH-Wrapper zu diesem Mac aus.

## Bevor Sie beginnen

1. Installieren Sie `imsg` auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Wenn `imsg chats` mit `unable to open database file`, leerer Ausgabe oder `authorization denied` fehlschlägt, gewähren Sie dem Terminal, Editor, Node-Prozess, Gateway-Dienst oder SSH-Elternprozess, der `imsg` startet, Festplattenvollzugriff und öffnen Sie diesen Elternprozess anschließend erneut.

2. Prüfen Sie die Lese-, Watch-, Sende- und RPC-Oberflächen, bevor Sie die OpenClaw-Konfiguration ändern:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ersetzen Sie `42` durch eine echte Chat-ID aus `imsg chats`. Senden erfordert eine Automation-Berechtigung für Messages.app. Wenn OpenClaw über SSH ausgeführt wird, führen Sie diese Befehle über denselben SSH-Wrapper oder Benutzerkontext aus, den OpenClaw verwenden wird. Wenn Lesezugriffe/Probes funktionieren, Sendevorgänge aber mit AppleEvents `-1743` fehlschlagen, prüfen Sie, ob Automation auf `/usr/libexec/sshd-keygen-wrapper` gelandet ist; siehe [SSH-Wrapper-Sendevorgänge schlagen mit AppleEvents -1743 fehl](/de/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Aktivieren Sie die private API-Brücke, wenn Sie erweiterte Aktionen benötigen:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` erfordert, dass SIP deaktiviert ist. Einfaches Senden, Verlauf und Watch funktionieren ohne `imsg launch`; erweiterte Aktionen nicht.

4. Nachdem Sie eine aktivierte `channels.imessage`-Konfiguration hinzugefügt haben, verifizieren Sie die Brücke über OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Sie möchten `imessage.privateApi.available: true`. Wenn `false` gemeldet wird, beheben Sie das zuerst; siehe [Capability-Erkennung](/de/channels/imessage#private-api-actions). `channels status --probe` prüft nur konfigurierte, aktivierte Konten.

5. Erstellen Sie einen Snapshot Ihrer Konfiguration:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Konfigurationsübersetzung

iMessage und BlueBubbles teilen viele Konfigurationen auf Kanalebene. Die Schlüssel, die sich ändern, betreffen meist den Transport (REST-Server statt lokaler CLI). Verhaltensschlüssel (`dmPolicy`, `groupPolicy`, `allowFrom` usw.) behalten dieselbe Bedeutung.

| BlueBubbles                                                | gebündeltes iMessage                      | Hinweise                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Gleiche Semantik.                                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(entfernt)_                              | Kein REST-Server — das Plugin startet `imsg rpc` über stdio.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.password`                            | _(entfernt)_                              | Keine Webhook-Authentifizierung erforderlich.                                                                                                                                                                                                                                                                                                                                        |
| _(implizit)_                                               | `channels.imessage.cliPath`               | Pfad zu `imsg` (Standard `imsg`); verwenden Sie ein Wrapper-Skript für SSH.                                                                                                                                                                                                                                                                                                         |
| _(implizit)_                                               | `channels.imessage.dbPath`                | Optionale Überschreibung für die Messages.app-`chat.db`; wird automatisch erkannt, wenn weggelassen.                                                                                                                                                                                                                                                                                 |
| _(implizit)_                                               | `channels.imessage.remoteHost`            | `host` oder `user@host` — nur erforderlich, wenn `cliPath` ein SSH-Wrapper ist und Sie SCP-Abrufe von Anhängen wünschen.                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Gleiche Werte (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Pairing-Freigaben werden nach Handle übernommen, nicht nach Token.                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Gleiche Werte (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Gleich.                                                                                                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Kopieren Sie dies unverändert, einschließlich eines etwaigen `groups: { "*": { ... } }`-Wildcard-Eintrags.** Pro Gruppe werden `requireMention`, `tools`, `toolsBySender` übernommen. Mit `groupPolicy: "allowlist"` verwirft ein leerer oder fehlender `groups`-Block stillschweigend jede Gruppennachricht — siehe „Stolperfalle Gruppenregistrierung“ unten.                    |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standard `true`. Beim gebündelten Plugin wird dies nur ausgelöst, wenn die private API-Prüfung aktiv ist.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Gleiche Form, **ebenfalls standardmäßig deaktiviert**. Wenn bei Ihnen Anhänge über BlueBubbles liefen, müssen Sie dies im iMessage-Block ausdrücklich erneut setzen — es wird nicht implizit übernommen, und eingehende Fotos/Medien werden stillschweigend verworfen, ohne `Inbound message`-Logzeile, bis Sie dies tun.                                                              |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale Roots; gleiche Wildcard-Regeln.                                                                                                                                                                                                                                                                                                                                               |
| _(N/V)_                                                    | `channels.imessage.remoteAttachmentRoots` | Wird nur verwendet, wenn `remoteHost` für SCP-Abrufe gesetzt ist.                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standard 16 MB bei iMessage (BlueBubbles-Standard war 8 MB). Setzen Sie dies explizit, wenn Sie die niedrigere Obergrenze beibehalten möchten.                                                                                                                                                                                                                                      |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standard 4000 bei beiden.                                                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Gleiche Opt-in-Funktion. Nur DMs — Gruppenchats behalten bei beiden Kanälen den sofortigen Versand pro Nachricht. Erweitert den standardmäßigen eingehenden Debounce auf 7000 ms, wenn aktiviert und kein explizites `messages.inbound.byChannel.imessage` oder globales `messages.inbound.debounceMs` gesetzt ist. Siehe [iMessage-Dokumentation § Zusammenführen aufgeteilter DMs](/de/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/V)_                                   | iMessage liest Anzeigenamen von Absendern bereits aus `chat.db`.                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Umschalter pro Aktion: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                              |

Konfigurationen mit mehreren Konten (`channels.bluebubbles.accounts.*`) werden eins zu eins in `channels.imessage.accounts.*` übersetzt.

## Stolperfalle Gruppenregistrierung

Das gebündelte iMessage-Plugin führt **zwei** separate Allowlist-Gates für Gruppen direkt nacheinander aus. Beide müssen erfolgreich sein, damit eine Gruppennachricht den Agenten erreicht:

1. **Allowlist für Absender / Chat-Ziel** (`channels.imessage.groupAllowFrom`) — geprüft durch `isAllowedIMessageSender`. Gleicht eingehende Nachrichten nach Absender-Handle, `chat_guid`, `chat_identifier` oder `chat_id` ab. Gleiche Form wie bei BlueBubbles.
2. **Gruppenregistrierung** (`channels.imessage.groups`) — geprüft durch `resolveChannelGroupPolicy` aus `inbound-processing.ts:199`. Mit `groupPolicy: "allowlist"` erfordert dieses Gate entweder:
   - einen `groups: { "*": { ... } }`-Wildcard-Eintrag (setzt `allowAll = true`) oder
   - einen expliziten Eintrag pro `chat_id` unter `groups`.

Wenn Gate 1 erfolgreich ist, Gate 2 aber fehlschlägt, wird die Nachricht verworfen. Das Plugin gibt zwei Signale auf `warn`-Ebene aus, sodass dies auf der Standard-Logebene nicht mehr still geschieht:

- Ein einmaliger `warn` beim Start pro Konto, wenn `groupPolicy: "allowlist"` gesetzt ist, `channels.imessage.groups` aber leer ist (kein `"*"`-Wildcard, keine Einträge pro `chat_id`) — ausgelöst, bevor Nachrichten eintreffen.
- Ein einmaliger `warn` pro `chat_id`, wenn eine bestimmte Gruppe zur Laufzeit zum ersten Mal verworfen wird, mit Nennung der chat_id und des genauen Schlüssels, der zu `groups` hinzugefügt werden muss, um sie zu erlauben.

DMs funktionieren weiterhin, weil sie einen anderen Codepfad nehmen.

Dies ist der häufigste Fehlermodus bei der Migration von BlueBubbles zu gebündeltem iMessage: Betreiber kopieren `groupAllowFrom` und `groupPolicy`, überspringen aber den `groups`-Block, weil BlueBubbles' `groups: { "*": { "requireMention": true } }` wie eine nicht zusammenhängende Erwähnungseinstellung aussieht. Tatsächlich ist er für das Registry-Gate entscheidend.

Die Mindestkonfiguration, damit Gruppennachrichten nach `groupPolicy: "allowlist"` weiter fließen:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` unter `*` ist harmlos, wenn keine Erwähnungsmuster konfiguriert sind: Die Runtime setzt `canDetectMention = false` und umgeht den Erwähnungs-Drop bei `inbound-processing.ts:512`. Mit konfigurierten Erwähnungsmustern (`agents.list[].groupChat.mentionPatterns`) funktioniert es wie erwartet.

Wenn die Gateway-Logs `imessage: dropping group message from chat_id=<id>` oder die Startzeile `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` enthalten, verwirft Gate 2 die Nachricht - fügen Sie den `groups`-Block hinzu.

## Schritt für Schritt

1. Fügen Sie einen iMessage-Block neben dem vorhandenen BlueBubbles-Block hinzu. Lassen Sie ihn deaktiviert, solange der Gateway noch BlueBubbles-Traffic routet:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Prüfen Sie, bevor Traffic relevant wird** - stoppen Sie den Gateway, aktivieren Sie den iMessage-Block vorübergehend und bestätigen Sie über die CLI, dass iMessage fehlerfrei gemeldet wird:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` prüft nur konfigurierte, aktivierte Konten. Starten Sie den Gateway nicht mit gleichzeitig aktiviertem BlueBubbles und iMessage neu, außer Sie möchten bewusst beide Kanal-Monitore ausführen. Wenn Sie nicht sofort umstellen, setzen Sie `channels.imessage.enabled` vor dem Neustart des Gateway wieder auf `false`. Verwenden Sie die direkten `imsg`-Befehle in [Bevor Sie beginnen](#before-you-start), um den Mac zu validieren, bevor Sie OpenClaw-Traffic aktivieren.

3. **Stellen Sie um.** Sobald das aktivierte iMessage-Konto fehlerfrei gemeldet wird, entfernen Sie die BlueBubbles-Konfiguration und lassen Sie iMessage aktiviert:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Starten Sie den Gateway neu. Eingehender iMessage-Traffic läuft jetzt durch das gebündelte Plugin.

4. **DMs verifizieren.** Senden Sie dem Agent eine Direktnachricht und bestätigen Sie, dass die Antwort ankommt.

5. **Gruppen separat verifizieren.** DMs und Gruppen nehmen unterschiedliche Codepfade - ein DM-Erfolg beweist nicht, dass Gruppen geroutet werden. Senden Sie dem Agent eine Nachricht in einem gekoppelten Gruppenchat und bestätigen Sie, dass die Antwort ankommt. Wenn die Gruppe still bleibt (keine Agent-Antwort, kein Fehler), prüfen Sie das Gateway-Log auf `imessage: dropping group message from chat_id=<id>` oder die Startzeile `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` - beide erscheinen beim Standard-Log-Level. Wenn eine davon erscheint, fehlt Ihr `groups`-Block oder ist leer - siehe „Group registry footgun“ oben.

6. **Aktionsoberfläche verifizieren** - bitten Sie den Agent aus einer gekoppelten DM heraus, zu reagieren, zu bearbeiten, zurückzuziehen, zu antworten, ein Foto zu senden und (in einer Gruppe) die Gruppe umzubenennen / einen Teilnehmer hinzuzufügen oder zu entfernen. Jede Aktion sollte nativ in Messages.app ankommen. Wenn eine davon „iMessage `<action>` requires the imsg private API bridge“ ausgibt, führen Sie erneut `imsg launch` aus und aktualisieren Sie `channels status --probe`.

7. **Entfernen Sie den BlueBubbles-Server und die Konfiguration**, sobald iMessage-DMs, Gruppen und Aktionen verifiziert sind. OpenClaw verwendet `channels.bluebubbles` nicht.

## Aktionsparität auf einen Blick

| Aktion                                              | Legacy BlueBubbles                  | gebündeltes iMessage                                                          |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Text senden / SMS-Fallback                          | ✅                                  | ✅                                                                            |
| Medien senden (Foto, Video, Datei, Sprachnachricht) | ✅                                  | ✅                                                                            |
| Thread-Antwort (`reply_to_guid`)                    | ✅                                  | ✅ (schließt [#51892](https://github.com/openclaw/openclaw/issues/51892))     |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Bearbeiten / zurückziehen (macOS 13+-Empfänger)     | ✅                                  | ✅                                                                            |
| Mit Bildschirmeffekt senden                         | ✅                                  | ✅ (schließt Teil von [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Rich-Text fett / kursiv / unterstrichen / durchgestrichen | ✅                           | ✅ (Typed-Run-Formatierung über attributedBody)                               |
| Gruppe umbenennen / Gruppensymbol setzen            | ✅                                  | ✅                                                                            |
| Teilnehmer hinzufügen / entfernen, Gruppe verlassen | ✅                                  | ✅                                                                            |
| Lesebestätigungen und Tippindikator                 | ✅                                  | ✅ (durch private API-Probe abgesichert)                                      |
| DM-Zusammenführung bei gleichem Absender            | ✅                                  | ✅ (nur DM; opt-in über `channels.imessage.coalesceSameSenderDms`)            |
| Eingehende Wiederherstellung nach einem Neustart    | ✅ (Webhook-Replay + History-Fetch) | ✅ (automatisch: verpasste Nachrichten über since_rowid + Deduplizierung wiedergeben; größeres Fenster lokal) |

iMessage stellt Nachrichten wieder her, die verpasst wurden, während der Gateway offline war: Beim Start spielt es ab der zuletzt weitergeleiteten rowid über `imsg watch.subscribe` `since_rowid` wieder ein und dedupliziert nach GUID, während eine Altersgrenze für veraltete Backlogs die Push-Flush-„Backlog-Bombe“ unterdrückt. Dies läuft über die `imsg`-RPC-Verbindung und funktioniert daher auch für Remote-SSH-Setups mit `cliPath`; lokale Setups erhalten ein größeres Wiederherstellungsfenster, weil sie `chat.db` lesen können. Siehe [Eingehende Wiederherstellung nach einem Bridge- oder Gateway-Neustart](/de/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Pairing, Sitzungen und ACP-Bindings

- **Pairing-Genehmigungen** werden per Handle übernommen. Sie müssen bekannte Absender nicht erneut genehmigen - `channels.imessage.allowFrom` erkennt dieselben `+15555550123`- / `user@example.com`-Strings, die BlueBubbles verwendet hat.
- **Sitzungen** bleiben pro Agent + Chat begrenzt. DMs werden unter dem Standard `session.dmScope=main` in die Hauptsitzung des Agent zusammengeführt; Gruppensitzungen bleiben pro `chat_id` isoliert. Die Sitzungsschlüssel unterscheiden sich (`agent:<id>:imessage:group:<chat_id>` gegenüber dem BlueBubbles-Äquivalent) - alte Konversationshistorie unter BlueBubbles-Sitzungsschlüsseln wird nicht in iMessage-Sitzungen übernommen.
- **ACP-Bindings**, die auf `match.channel: "bluebubbles"` verweisen, müssen auf `"imessage"` aktualisiert werden. Die Formen von `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, bloßes Handle) sind identisch.

## Kein Rollback-Kanal

Es gibt keine unterstützte BlueBubbles-Runtime, zu der Sie zurückwechseln können. Wenn die iMessage-Verifizierung fehlschlägt, setzen Sie `channels.imessage.enabled: false`, starten Sie den Gateway neu, beheben Sie den `imsg`-Blocker und versuchen Sie die Umstellung erneut.

Der Antwort-Cache liegt im SQLite-Plugin-Status. `openclaw doctor --fix` importiert und archiviert die alte `imessage/reply-cache.jsonl`-Sidecar-Datei, wenn sie vorhanden ist.

## Verwandte Themen

- [BlueBubbles-Entfernung und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) - kurze Ankündigung und Betreiberzusammenfassung.
- [iMessage](/de/channels/imessage) - vollständige iMessage-Kanalreferenz, einschließlich Einrichtung mit `imsg launch` und Fähigkeitserkennung.
- `/channels/bluebubbles` - Legacy-URL, die zu diesem Migrationsleitfaden weiterleitet.
- [Pairing](/de/channels/pairing) - DM-Authentifizierung und Pairing-Ablauf.
- [Kanalrouting](/de/channels/channel-routing) - wie der Gateway einen Kanal für ausgehende Antworten auswählt.
