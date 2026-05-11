---
read_when:
    - Planung des Wechsels von BlueBubbles zum mitgelieferten Plugin für iMessage
    - BlueBubbles-Konfigurationsschlüssel in iMessage-Entsprechungen übersetzen
    - imsg vor dem Aktivieren des iMessage-Plugins verifizieren
summary: Migrieren Sie alte BlueBubbles-Konfigurationen zum mitgelieferten iMessage-Plugin, ohne Kopplung, Zulassungslisten oder Gruppenbindungen zu verlieren.
title: Umstieg von BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Das gebündelte `imessage`-Plugin erreicht jetzt dieselbe private API-Oberfläche wie BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, Gruppenverwaltung, Anhänge), indem es [`steipete/imsg`](https://github.com/steipete/imsg) über JSON-RPC steuert. Wenn Sie bereits einen Mac mit installiertem `imsg` betreiben, können Sie den BlueBubbles-Server weglassen und das Plugin direkt mit Messages.app kommunizieren lassen.

Die Unterstützung für BlueBubbles wurde entfernt. OpenClaw unterstützt iMessage nur über `imsg`. Diese Anleitung dient zur Migration alter `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; es gibt keinen anderen unterstützten Migrationspfad.

<Note>
Die kurze Ankündigung und die Betreiberzusammenfassung finden Sie unter [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage).
</Note>

## Migrations-Checkliste

Verwenden Sie diese Checkliste, wenn Sie Ihre alte BlueBubbles-Konfiguration bereits kennen und den kürzesten sicheren Weg möchten:

1. Prüfen Sie `imsg` direkt auf dem Mac, auf dem Messages.app läuft (`imsg chats`, `imsg history`, `imsg send` und `imsg rpc --help`).
2. Kopieren Sie Verhaltensschlüssel aus `channels.bluebubbles` nach `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` und `actions`.
3. Entfernen Sie Transportschlüssel, die nicht mehr existieren: `serverUrl`, `password`, Webhook-URLs und die BlueBubbles-Servereinrichtung.
4. Wenn der Gateway nicht auf dem Messages-Mac läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper und setzen Sie `remoteHost` für den Remote-Abruf von Anhängen.
5. Aktivieren Sie bei gestopptem Gateway `channels.imessage` und führen Sie dann `openclaw channels status --probe --channel imessage` aus.
6. Testen Sie eine DM, eine erlaubte Gruppe, Anhänge, falls aktiviert, und jede private API-Aktion, die der Agent voraussichtlich verwenden soll.
7. Löschen Sie den BlueBubbles-Server und die alte `channels.bluebubbles`-Konfiguration, nachdem der iMessage-Pfad verifiziert wurde.

## Wann diese Migration sinnvoll ist

- Sie führen `imsg` bereits auf demselben Mac aus (oder auf einem per SSH erreichbaren Mac), auf dem Messages.app angemeldet ist.
- Sie möchten ein bewegliches Teil weniger: keinen separaten BlueBubbles-Server, keinen zu authentifizierenden REST-Endpunkt, keine Webhook-Verkabelung. Eine einzelne CLI-Binärdatei statt Server + Client-App + Hilfsprogramm.
- Sie verwenden einen [unterstützten macOS- / `imsg`-Build](/de/channels/imessage#requirements-and-permissions-macos), bei dem die private API-Prüfung `available: true` meldet.

## Was imsg leistet

`imsg` ist eine lokale macOS-CLI für Messages. OpenClaw startet `imsg rpc` als Child-Prozess und kommuniziert über JSON-RPC per stdin/stdout. Es gibt keinen HTTP-Server, keine Webhook-URL, keinen Hintergrund-Daemon, keinen Launch Agent und keinen offenzulegenden Port.

- Lesevorgänge erfolgen aus `~/Library/Messages/chat.db` über ein schreibgeschütztes SQLite-Handle.
- Live eingehende Nachrichten kommen aus `imsg watch` / `watch.subscribe`, das `chat.db`-Dateisystemereignissen mit einem Polling-Fallback folgt.
- Sendevorgänge verwenden Messages.app-Automatisierung für normale Text- und Dateisendungen.
- Erweiterte Aktionen verwenden `imsg launch`, um den `imsg`-Helfer in Messages.app zu injizieren. Dadurch werden Lesebestätigungen, Tippindikatoren, Rich Sends, Bearbeiten, Zurücksenden, Antworten in Threads, Tapbacks und Gruppenverwaltung freigeschaltet.
- Linux-Builds können eine kopierte `chat.db` untersuchen, aber nicht senden, die Live-Mac-Datenbank überwachen oder Messages.app steuern. Führen Sie für OpenClaw iMessage `imsg` auf dem angemeldeten Mac oder über einen SSH-Wrapper zu diesem Mac aus.

## Bevor Sie beginnen

1. Installieren Sie `imsg` auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Wenn `imsg chats` mit `unable to open database file`, leerer Ausgabe oder `authorization denied` fehlschlägt, gewähren Sie dem Terminal, Editor, Node-Prozess, Gateway-Dienst oder SSH-Elternprozess, der `imsg` startet, Vollzugriff auf die Festplatte und öffnen Sie diesen Elternprozess anschließend erneut.

2. Prüfen Sie die Lese-, Watch-, Sende- und RPC-Oberflächen, bevor Sie die OpenClaw-Konfiguration ändern:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ersetzen Sie `42` durch eine echte Chat-ID aus `imsg chats`. Senden erfordert die Automatisierungsberechtigung für Messages.app. Wenn OpenClaw über SSH laufen soll, führen Sie diese Befehle über denselben SSH-Wrapper oder Benutzerkontext aus, den OpenClaw verwenden wird.

3. Aktivieren Sie die private API-Bridge, wenn Sie erweiterte Aktionen benötigen:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` erfordert, dass SIP deaktiviert ist. Einfaches Senden, Verlauf und Watch funktionieren ohne `imsg launch`; erweiterte Aktionen nicht.

4. Nachdem Sie eine aktivierte `channels.imessage`-Konfiguration hinzugefügt haben, prüfen Sie die Bridge über OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Sie möchten `imessage.privateApi.available: true`. Wenn `false` gemeldet wird, beheben Sie das zuerst – siehe [Capability-Erkennung](/de/channels/imessage#private-api-actions). `channels status --probe` prüft nur konfigurierte, aktivierte Konten.

5. Erstellen Sie einen Snapshot Ihrer Konfiguration:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Konfigurationsübertragung

iMessage und BlueBubbles teilen sich viele Konfigurationen auf Channel-Ebene. Die Schlüssel, die sich ändern, betreffen hauptsächlich den Transport (REST-Server gegenüber lokaler CLI). Verhaltensschlüssel (`dmPolicy`, `groupPolicy`, `allowFrom` usw.) behalten dieselbe Bedeutung.

| BlueBubbles                                                | gebündeltes iMessage                      | Hinweise                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Gleiche Semantik.                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.serverUrl`                           | _(entfernt)_                              | Kein REST-Server — das Plugin startet `imsg rpc` über stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(entfernt)_                              | Keine Webhook-Authentifizierung erforderlich.                                                                                                                                                                                                                                                                                                |
| _(implizit)_                                               | `channels.imessage.cliPath`               | Pfad zu `imsg` (Standard `imsg`); verwenden Sie für SSH ein Wrapper-Skript.                                                                                                                                                                                                                                                                  |
| _(implizit)_                                               | `channels.imessage.dbPath`                | Optionale Überschreibung für Messages.app `chat.db`; wird automatisch erkannt, wenn weggelassen.                                                                                                                                                                                                                                             |
| _(implizit)_                                               | `channels.imessage.remoteHost`            | `host` oder `user@host` — nur erforderlich, wenn `cliPath` ein SSH-Wrapper ist und Sie SCP-Abrufe von Anhängen wünschen.                                                                                                                                                                                                                     |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Gleiche Werte (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Pairing-Genehmigungen werden nach Handle übernommen, nicht nach Token.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Gleiche Werte (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Gleich.                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Kopieren Sie dies unverändert, einschließlich eines etwaigen `groups: { "*": { ... } }`-Wildcard-Eintrags.** Gruppenbezogene `requireMention`, `tools`, `toolsBySender` werden übernommen. Mit `groupPolicy: "allowlist"` verwirft ein leerer oder fehlender `groups`-Block stillschweigend jede Gruppennachricht — siehe „Gruppenregistrierungs-Falle“ unten. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standard `true`. Beim gebündelten Plugin wird dies nur ausgelöst, wenn der Private-API-Probe aktiv ist.                                                                                                                                                                                                                                      |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Gleiche Form, **ebenfalls standardmäßig deaktiviert**. Wenn bei BlueBubbles Anhänge übertragen wurden, müssen Sie dies explizit im iMessage-Block erneut setzen — es wird nicht implizit übernommen, und eingehende Fotos/Medien werden stillschweigend verworfen, ohne `Inbound message`-Logzeile, bis Sie es tun.                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale Wurzeln; gleiche Wildcard-Regeln.                                                                                                                                                                                                                                                                                                     |
| _(n. z.)_                                                  | `channels.imessage.remoteAttachmentRoots` | Wird nur verwendet, wenn `remoteHost` für SCP-Abrufe gesetzt ist.                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standard 16 MB bei iMessage (BlueBubbles-Standard war 8 MB). Setzen Sie dies explizit, wenn Sie die niedrigere Obergrenze beibehalten möchten.                                                                                                                                                                                               |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standard 4000 bei beiden.                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Gleiches Opt-in. Nur DMs — Gruppenchats behalten auf beiden Channels die sofortige Dispatch-Ausführung pro Nachricht. Erweitert den standardmäßigen Eingangs-Debounce auf 2500 ms, wenn ohne explizites `messages.inbound.byChannel.imessage` aktiviert. Siehe [iMessage-Dokumentation § Zusammenführen aufgeteilter DMs](/de/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(n. z.)_                                 | iMessage liest die Anzeigenamen der Absender bereits aus `chat.db`.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Umschalter pro Aktion: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                       |

Multi-Account-Konfigurationen (`channels.bluebubbles.accounts.*`) werden eins zu eins nach `channels.imessage.accounts.*` übersetzt.

## Gruppenregistrierungs-Falle

Das gebündelte iMessage-Plugin führt **zwei** separate Allowlist-Prüfungen für Gruppen direkt nacheinander aus. Beide müssen erfolgreich sein, damit eine Gruppennachricht den Agenten erreicht:

1. **Allowlist für Absender / Chat-Ziel** (`channels.imessage.groupAllowFrom`) — geprüft durch `isAllowedIMessageSender`. Gleicht eingehende Nachrichten anhand von Absender-Handle, `chat_guid`, `chat_identifier` oder `chat_id` ab. Gleiche Form wie bei BlueBubbles.
2. **Gruppenregistrierung** (`channels.imessage.groups`) — geprüft durch `resolveChannelGroupPolicy` aus `inbound-processing.ts:199`. Mit `groupPolicy: "allowlist"` erfordert diese Prüfung entweder:
   - einen `groups: { "*": { ... } }`-Wildcard-Eintrag (setzt `allowAll = true`), oder
   - einen expliziten Eintrag pro `chat_id` unter `groups`.

Wenn Prüfung 1 erfolgreich ist, aber Prüfung 2 fehlschlägt, wird die Nachricht verworfen. Das Plugin gibt zwei Signale auf `warn`-Ebene aus, sodass dies beim Standard-Loglevel nicht mehr still passiert:

- Ein einmaliger Start-`warn` pro Account, wenn `groupPolicy: "allowlist"` gesetzt ist, aber `channels.imessage.groups` leer ist (kein `"*"`-Wildcard, keine Einträge pro `chat_id`) — ausgelöst, bevor Nachrichten eintreffen.
- Ein einmaliger `warn` pro `chat_id`, wenn eine bestimmte Gruppe zur Laufzeit zum ersten Mal verworfen wird, mit Nennung der chat_id und des exakten Schlüssels, der zu `groups` hinzugefügt werden muss, um sie zu erlauben.

DMs funktionieren weiterhin, weil sie einen anderen Codepfad verwenden.

Dies ist der häufigste Fehlermodus bei der Migration von BlueBubbles zum gebündelten iMessage: Betreiber kopieren `groupAllowFrom` und `groupPolicy`, überspringen aber den `groups`-Block, weil BlueBubbles' `groups: { "*": { "requireMention": true } }` wie eine unabhängige Mention-Einstellung aussieht. Tatsächlich ist er für die Registrierungsprüfung tragend.

Die minimale Konfiguration, damit Gruppennachrichten nach `groupPolicy: "allowlist"` weiter fließen:

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

`requireMention: true` unter `*` ist unproblematisch, wenn keine Erwähnungsmuster konfiguriert sind: Die Laufzeit setzt `canDetectMention = false` und überspringt das Verwerfen wegen Erwähnungen bei `inbound-processing.ts:512`. Mit konfigurierten Erwähnungsmustern (`agents.list[].groupChat.mentionPatterns`) funktioniert es wie erwartet.

Wenn die Gateway-Protokolle `imessage: dropping group message from chat_id=<id>` oder die Startzeile `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` enthalten, verwirft Gate 2 die Nachricht — fügen Sie den `groups`-Block hinzu.

## Schritt für Schritt

1. Fügen Sie neben dem vorhandenen BlueBubbles-Block einen iMessage-Block hinzu. Lassen Sie ihn deaktiviert, solange das Gateway noch BlueBubbles-Datenverkehr routet:

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

2. **Prüfen Sie, bevor Datenverkehr relevant wird** — stoppen Sie das Gateway, aktivieren Sie den iMessage-Block vorübergehend, und bestätigen Sie, dass iMessage in der CLI als fehlerfrei gemeldet wird:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` prüft nur konfigurierte, aktivierte Konten. Starten Sie das Gateway nicht neu, wenn sowohl BlueBubbles als auch iMessage aktiviert sind, es sei denn, Sie möchten ausdrücklich beide Kanalmonitore ausführen. Wenn Sie nicht sofort umstellen, setzen Sie `channels.imessage.enabled` vor dem Neustart des Gateways wieder auf `false`. Verwenden Sie die direkten `imsg`-Befehle in [Vorbereitung](#before-you-start), um den Mac zu validieren, bevor Sie OpenClaw-Datenverkehr aktivieren.

3. **Stellen Sie um.** Sobald das aktivierte iMessage-Konto als fehlerfrei gemeldet wird, entfernen Sie die BlueBubbles-Konfiguration und lassen Sie iMessage aktiviert:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Starten Sie das Gateway neu. Eingehender iMessage-Datenverkehr läuft nun über das gebündelte Plugin.

4. **Verifizieren Sie DMs.** Senden Sie dem Agent eine Direktnachricht; bestätigen Sie, dass die Antwort ankommt.

5. **Verifizieren Sie Gruppen separat.** DMs und Gruppen verwenden unterschiedliche Codepfade — ein DM-Erfolg beweist nicht, dass Gruppen geroutet werden. Senden Sie dem Agent eine Nachricht in einem gekoppelten Gruppenchat und bestätigen Sie, dass die Antwort ankommt. Wenn die Gruppe stumm bleibt (keine Agent-Antwort, kein Fehler), prüfen Sie das Gateway-Protokoll auf `imessage: dropping group message from chat_id=<id>` oder die Startzeile `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — beide werden auf der Standard-Protokollstufe ausgegeben. Wenn eine davon erscheint, fehlt Ihr `groups`-Block oder ist leer — siehe „Stolperfalle Gruppenregistrierung“ oben.

6. **Verifizieren Sie die Aktionsoberfläche** — bitten Sie den Agent aus einer gekoppelten DM heraus, zu reagieren, zu bearbeiten, das Senden zurückzunehmen, zu antworten, ein Foto zu senden und (in einer Gruppe) die Gruppe umzubenennen bzw. einen Teilnehmer hinzuzufügen oder zu entfernen. Jede Aktion sollte nativ in Messages.app ankommen. Wenn eine davon „iMessage `<action>` requires the imsg private API bridge“ auslöst, führen Sie `imsg launch` erneut aus und aktualisieren Sie `channels status --probe`.

7. **Entfernen Sie den BlueBubbles-Server und die Konfiguration**, sobald iMessage-DMs, Gruppen und Aktionen verifiziert sind. OpenClaw verwendet `channels.bluebubbles` nicht.

## Aktionsparität auf einen Blick

| Aktion                                                     | bisheriges BlueBubbles                  | gebündeltes iMessage                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Text senden / SMS-Fallback                                   | ✅                                  | ✅                                                                                                                      |
| Medien senden (Foto, Video, Datei, Sprache)                     | ✅                                  | ✅                                                                                                                      |
| Thread-Antwort (`reply_to_guid`)                           | ✅                                  | ✅ (schließt [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                 |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Bearbeiten / Senden zurücknehmen (macOS 13+-Empfänger)                       | ✅                                  | ✅                                                                                                                      |
| Mit Bildschirmeffekt senden                                    | ✅                                  | ✅ (schließt einen Teil von [#9394](https://github.com/openclaw/openclaw/issues/9394))                                           |
| Rich-Text fett / kursiv / unterstrichen / durchgestrichen        | ✅                                  | ✅ (Formatierung typisierter Abschnitte über attributedBody)                                                                            |
| Gruppe umbenennen / Gruppensymbol festlegen                              | ✅                                  | ✅                                                                                                                      |
| Teilnehmer hinzufügen / entfernen, Gruppe verlassen                      | ✅                                  | ✅                                                                                                                      |
| Lesebestätigungen und Schreibanzeige                         | ✅                                  | ✅ (durch private API-Prüfung gesteuert)                                                                                         |
| DM-Zusammenfassung desselben Absenders                                  | ✅                                  | ✅ (nur DM; Opt-in über `channels.imessage.coalesceSameSenderDms`)                                                      |
| Aufholen eingehender Nachrichten, die empfangen wurden, während das Gateway inaktiv war | ✅ (Webhook-Wiedergabe + Verlaufsabruf) | ✅ (Opt-in über `channels.imessage.catchup.enabled`; schließt [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

iMessage-Aufholen ist jetzt als Opt-in-Funktion im gebündelten Plugin verfügbar. Beim Start des Gateways führt das Gateway, wenn `channels.imessage.catchup.enabled` `true` ist, einen `chats.list`-Durchlauf plus je Chat einen `messages.history`-Durchlauf gegen denselben JSON-RPC-Client aus, der von `imsg watch` verwendet wird, spielt jede verpasste eingehende Zeile erneut über den Live-Dispatch-Pfad ein (Allowlists, Gruppenrichtlinie, Debouncer, Echo-Cache) und speichert pro Konto einen Cursor, damit nachfolgende Starts dort fortsetzen, wo sie aufgehört haben. Siehe [Nach Gateway-Ausfall aufholen](/de/channels/imessage#catching-up-after-gateway-downtime) für die Feinabstimmung.

## Kopplung, Sitzungen und ACP-Bindings

- **Kopplungsgenehmigungen** werden nach Handle übernommen. Sie müssen bekannte Absender nicht erneut genehmigen — `channels.imessage.allowFrom` erkennt dieselben `+15555550123`- / `user@example.com`-Zeichenfolgen, die BlueBubbles verwendet hat.
- **Sitzungen** bleiben pro Agent + Chat begrenzt. DMs werden unter dem Standardwert `session.dmScope=main` in die Agent-Hauptsitzung zusammengeführt; Gruppensitzungen bleiben pro `chat_id` isoliert. Die Sitzungsschlüssel unterscheiden sich (`agent:<id>:imessage:group:<chat_id>` gegenüber dem BlueBubbles-Äquivalent) — alte Gesprächsverläufe unter BlueBubbles-Sitzungsschlüsseln werden nicht in iMessage-Sitzungen übernommen.
- **ACP-Bindings**, die auf `match.channel: "bluebubbles"` verweisen, müssen auf `"imessage"` aktualisiert werden. Die Formen von `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, reiner Handle) sind identisch.

## Kein Rollback-Kanal

Es gibt keine unterstützte BlueBubbles-Laufzeit, zu der Sie zurückwechseln können. Wenn die iMessage-Verifizierung fehlschlägt, setzen Sie `channels.imessage.enabled: false`, starten Sie das Gateway neu, beheben Sie den `imsg`-Blocker, und wiederholen Sie die Umstellung.

Der Antwort-Cache befindet sich unter `~/.openclaw/state/imessage/reply-cache.jsonl` (Modus `0600`, übergeordnetes Verzeichnis `0700`). Sie können ihn bedenkenlos löschen, wenn Sie neu beginnen möchten.

## Verwandte Themen

- [BlueBubbles-Entfernung und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — kurze Ankündigung und Zusammenfassung für Betreiber.
- [iMessage](/de/channels/imessage) — vollständige iMessage-Kanalreferenz, einschließlich Einrichtung mit `imsg launch` und Fähigkeitserkennung.
- `/channels/bluebubbles` — Legacy-URL, die zu diesem Migrationsleitfaden weiterleitet.
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf.
- [Kanalrouting](/de/channels/channel-routing) — wie das Gateway einen Kanal für ausgehende Antworten auswählt.
