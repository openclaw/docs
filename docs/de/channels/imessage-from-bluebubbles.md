---
read_when:
    - Migration von BlueBubbles zum mitgelieferten iMessage-Plugin planen
    - Übersetzen von BlueBubbles-Konfigurationsschlüsseln in iMessage-Äquivalente
    - Überprüfung von imsg vor dem Aktivieren des iMessage-Plugins
summary: Migrieren Sie alte BlueBubbles-Konfigurationen zum mitgelieferten iMessage-Plugin, ohne Kopplung, Zulassungslisten oder Gruppenbindungen zu verlieren.
title: Wechsel von BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Das gebündelte `imessage`-Plugin erreicht jetzt dieselbe private API-Oberfläche wie BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, Gruppenverwaltung, Anhänge), indem es [`steipete/imsg`](https://github.com/steipete/imsg) über JSON-RPC ansteuert. Wenn Sie bereits einen Mac mit installiertem `imsg` betreiben, können Sie den BlueBubbles-Server entfernen und das Plugin direkt mit Messages.app sprechen lassen.

Die Unterstützung für BlueBubbles wurde entfernt. OpenClaw unterstützt iMessage nur über `imsg`. Diese Anleitung dient der Migration alter `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; es gibt keinen anderen unterstützten Migrationspfad.

## Wann diese Migration sinnvoll ist

- Sie betreiben `imsg` bereits auf demselben Mac (oder auf einem per SSH erreichbaren Mac), auf dem Messages.app angemeldet ist.
- Sie möchten eine Komponente weniger betreiben: keinen separaten BlueBubbles-Server, keinen zu authentifizierenden REST-Endpunkt, keine Webhook-Verkabelung. Eine einzelne CLI-Binärdatei statt Server + Client-App + Hilfsprogramm.
- Sie verwenden eine [unterstützte macOS- / `imsg`-Version](/de/channels/imessage#requirements-and-permissions-macos), bei der die private API-Prüfung `available: true` meldet.

## Was imsg macht

`imsg` ist eine lokale macOS-CLI für Messages. OpenClaw startet `imsg rpc` als Kindprozess und kommuniziert per JSON-RPC über stdin/stdout. Es gibt keinen HTTP-Server, keine Webhook-URL, keinen Hintergrund-Daemon, keinen Launch Agent und keinen freizugebenden Port.

- Lesezugriffe erfolgen aus `~/Library/Messages/chat.db` über ein schreibgeschütztes SQLite-Handle.
- Live eingehende Nachrichten kommen aus `imsg watch` / `watch.subscribe`, das Dateisystemereignissen von `chat.db` folgt, mit Polling als Fallback.
- Sendungen verwenden die Automatisierung von Messages.app für normale Text- und Dateisendungen.
- Erweiterte Aktionen verwenden `imsg launch`, um den `imsg`-Helper in Messages.app zu injizieren. Dadurch werden Lesebestätigungen, Tippindikatoren, umfangreiche Sendungen, Bearbeiten, Zurückrufen, Thread-Antworten, Tapbacks und Gruppenverwaltung freigeschaltet.
- Linux-Builds können eine kopierte `chat.db` untersuchen, aber nicht senden, die Live-Mac-Datenbank überwachen oder Messages.app ansteuern. Führen Sie für OpenClaw iMessage `imsg` auf dem angemeldeten Mac aus oder über einen SSH-Wrapper zu diesem Mac.

## Bevor Sie beginnen

1. Installieren Sie `imsg` auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Wenn `imsg chats` mit `unable to open database file`, leerer Ausgabe oder `authorization denied` fehlschlägt, erteilen Sie dem Terminal, Editor, Node-Prozess, Gateway-Dienst oder SSH-Elternprozess, der `imsg` startet, vollständigen Festplattenzugriff und öffnen Sie diesen Elternprozess anschließend erneut.

2. Prüfen Sie die Lese-, Watch-, Sende- und RPC-Oberflächen, bevor Sie die OpenClaw-Konfiguration ändern:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ersetzen Sie `42` durch eine echte Chat-ID aus `imsg chats`. Das Senden erfordert die Automatisierungsberechtigung für Messages.app. Wenn OpenClaw über SSH ausgeführt wird, führen Sie diese Befehle über denselben SSH-Wrapper oder Benutzerkontext aus, den OpenClaw verwenden wird.

3. Aktivieren Sie die private API-Bridge, wenn Sie erweiterte Aktionen benötigen:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` erfordert, dass SIP deaktiviert ist. Einfaches Senden, Verlauf und Watch funktionieren ohne `imsg launch`; erweiterte Aktionen nicht.

4. Prüfen Sie die Bridge über OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Sie möchten `imessage.privateApi.available: true`. Wenn `false` gemeldet wird, beheben Sie das zuerst, siehe [Capability-Erkennung](/de/channels/imessage#private-api-actions).

5. Sichern Sie Ihre Konfiguration:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Konfigurationsübersetzung

iMessage und BlueBubbles teilen sich viele Einstellungen auf Channel-Ebene. Die Schlüssel, die sich ändern, betreffen hauptsächlich den Transport (REST-Server statt lokaler CLI). Verhaltensschlüssel (`dmPolicy`, `groupPolicy`, `allowFrom` usw.) behalten dieselbe Bedeutung.

| BlueBubbles                                                | gebündeltes iMessage                      | Hinweise                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Gleiche Semantik.                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(entfernt)_                              | Kein REST-Server — das Plugin startet `imsg rpc` über stdio.                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(entfernt)_                              | Keine Webhook-Authentifizierung erforderlich.                                                                                                                                                                                                                                                                                                            |
| _(implizit)_                                               | `channels.imessage.cliPath`               | Pfad zu `imsg` (Standardwert `imsg`); verwenden Sie für SSH ein Wrapper-Skript.                                                                                                                                                                                                                                                                               |
| _(implizit)_                                               | `channels.imessage.dbPath`                | Optionale Messages.app-`chat.db`-Überschreibung; wird automatisch erkannt, wenn ausgelassen.                                                                                                                                                                                                                                                                        |
| _(implizit)_                                               | `channels.imessage.remoteHost`            | `host` oder `user@host` — nur erforderlich, wenn `cliPath` ein SSH-Wrapper ist und Sie SCP-Anhangsabrufe wünschen.                                                                                                                                                                                                                                    |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Gleiche Werte (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Kopplungsgenehmigungen werden per Handle übernommen, nicht per Token.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Gleiche Werte (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Gleich.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Kopieren Sie dies unverändert, einschließlich eines etwaigen `groups: { "*": { ... } }`-Wildcard-Eintrags.** Pro Gruppe werden `requireMention`, `tools`, `toolsBySender` übernommen. Mit `groupPolicy: "allowlist"` verwirft ein leerer oder fehlender `groups`-Block stillschweigend jede Gruppennachricht — siehe unten „Stolperfalle Gruppenregistrierung“.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standardwert `true`. Beim gebündelten Plugin wird dies nur ausgelöst, wenn die private API-Prüfung aktiv ist.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Gleiche Form, **ebenfalls standardmäßig deaktiviert**. Wenn bei Ihnen Anhänge über BlueBubbles liefen, müssen Sie dies im iMessage-Block explizit erneut setzen — es wird nicht implizit übernommen, und eingehende Fotos/Medien werden stillschweigend verworfen, ohne `Inbound message`-Protokollzeile, bis Sie dies tun.                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale Root-Pfade; gleiche Wildcard-Regeln.                                                                                                                                                                                                                                                                                                            |
| _(N/Z)_                                                    | `channels.imessage.remoteAttachmentRoots` | Wird nur verwendet, wenn `remoteHost` für SCP-Abrufe gesetzt ist.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standardwert 16 MB bei iMessage (BlueBubbles-Standardwert war 8 MB). Setzen Sie dies explizit, wenn Sie die niedrigere Grenze beibehalten möchten.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standardwert 4000 bei beiden.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Gleiches Opt-in. Nur für DMs — Gruppenchats behalten auf beiden Channels die sofortige Zustellung pro Nachricht. Erweitert den standardmäßigen eingehenden Debounce auf 2500 ms, wenn ohne explizites `messages.inbound.byChannel.imessage` aktiviert. Siehe [iMessage-Dokumentation § Zusammenführen aufgeteilter Sende-DMs](/de/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/Z)_                                   | iMessage liest Anzeigenamen von Absendern bereits aus `chat.db`.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Aktionsspezifische Schalter: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                          |

Multi-Account-Konfigurationen (`channels.bluebubbles.accounts.*`) lassen sich eins zu eins nach `channels.imessage.accounts.*` übertragen.

## Stolperfalle Gruppenregistrierung

Das gebündelte iMessage-Plugin führt **zwei** separate Gruppen-Allowlist-Prüfungen direkt hintereinander aus. Beide müssen bestehen, damit eine Gruppennachricht den Agenten erreicht:

1. **Absender-/Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — wird von `isAllowedIMessageSender` geprüft. Gleicht eingehende Nachrichten anhand von Absender-Handle, `chat_guid`, `chat_identifier` oder `chat_id` ab. Gleiche Form wie BlueBubbles.
2. **Gruppenregistrierung** (`channels.imessage.groups`) — wird von `resolveChannelGroupPolicy` aus `inbound-processing.ts:199` geprüft. Mit `groupPolicy: "allowlist"` erfordert diese Prüfung entweder:
   - einen `groups: { "*": { ... } }`-Wildcard-Eintrag (setzt `allowAll = true`), oder
   - einen expliziten Eintrag pro `chat_id` unter `groups`.

Wenn Prüfung 1 besteht, Prüfung 2 aber fehlschlägt, wird die Nachricht verworfen. Das Plugin gibt zwei Signale auf `warn`-Ebene aus, sodass dies bei der Standard-Protokollebene nicht mehr stillschweigend geschieht:

- Ein einmaliges `warn` pro Account beim Start, wenn `groupPolicy: "allowlist"` gesetzt ist, aber `channels.imessage.groups` leer ist (kein `"*"`-Wildcard, keine Einträge pro `chat_id`) — wird ausgelöst, bevor Nachrichten eintreffen.
- Ein einmaliges `warn` pro `chat_id`, wenn eine bestimmte Gruppe zur Laufzeit erstmals verworfen wird, mit Nennung der chat_id und des exakten Schlüssels, der zu `groups` hinzugefügt werden muss, um sie zuzulassen.

DMs funktionieren weiterhin, weil sie einen anderen Codepfad verwenden.

Dies ist der häufigste Fehlermodus bei der Migration von BlueBubbles → gebündeltes iMessage: Operatoren kopieren `groupAllowFrom` und `groupPolicy`, überspringen aber den `groups`-Block, weil BlueBubbles' `groups: { "*": { "requireMention": true } }` wie eine unabhängige Erwähnungseinstellung aussieht. Tatsächlich ist er für die Registrierungsprüfung tragend.

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

`requireMention: true` unter `*` ist unproblematisch, wenn keine Erwähnungsmuster konfiguriert sind: Die Runtime setzt `canDetectMention = false` und bricht das Verwerfen wegen fehlender Erwähnung bei `inbound-processing.ts:512` frühzeitig ab. Wenn Erwähnungsmuster konfiguriert sind (`agents.list[].groupChat.mentionPatterns`), funktioniert es wie erwartet.

Wenn die Gateway-Logs `imessage: dropping group message from chat_id=<id>` oder die Startzeile `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` anzeigen, verwirft Gate 2 die Nachricht — fügen Sie den `groups`-Block hinzu.

## Schritt für Schritt

1. Fügen Sie neben dem vorhandenen BlueBubbles-Block einen iMessage-Block hinzu. Behalten Sie den alten Block nur als Kopiervorlage, bis der neue Pfad verifiziert ist:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Probelauf** — starten Sie den Gateway und bestätigen Sie, dass iMessage als fehlerfrei gemeldet wird:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Da `imessage.enabled` weiterhin `false` ist, wird noch kein eingehender iMessage-Datenverkehr geroutet — aber `--probe` testet die Bridge, sodass Sie Berechtigungs- oder Installationsprobleme vor der Umstellung erkennen.

3. **Stellen Sie um.** Entfernen Sie die BlueBubbles-Konfiguration und aktivieren Sie iMessage in einer einzigen Konfigurationsänderung:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Starten Sie den Gateway neu. Eingehender iMessage-Datenverkehr läuft nun über das gebündelte Plugin.

4. **Verifizieren Sie DMs.** Senden Sie dem Agent eine Direktnachricht und bestätigen Sie, dass die Antwort ankommt.

5. **Verifizieren Sie Gruppen separat.** DMs und Gruppen verwenden unterschiedliche Codepfade — ein erfolgreicher DM-Test beweist nicht, dass Gruppen geroutet werden. Senden Sie dem Agent eine Nachricht in einem gekoppelten Gruppenchat und bestätigen Sie, dass die Antwort ankommt. Wenn die Gruppe stumm bleibt (keine Agent-Antwort, kein Fehler), prüfen Sie das Gateway-Log auf `imessage: dropping group message from chat_id=<id>` oder die Startzeile `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — beide erscheinen auf dem standardmäßigen Log-Level. Wenn eine davon angezeigt wird, fehlt Ihr `groups`-Block oder er ist leer — siehe oben „Group registry footgun“.

6. **Verifizieren Sie die Aktionsoberfläche** — bitten Sie den Agent aus einer gekoppelten DM heraus, zu reagieren, zu bearbeiten, zurückzuziehen, zu antworten, ein Foto zu senden und (in einer Gruppe) die Gruppe umzubenennen bzw. einen Teilnehmer hinzuzufügen oder zu entfernen. Jede Aktion sollte nativ in Messages.app ankommen. Wenn bei einer Aktion „iMessage `<action>` requires the imsg private API bridge“ ausgelöst wird, führen Sie `imsg launch` erneut aus und aktualisieren Sie `channels status --probe`.

7. **Entfernen Sie den BlueBubbles-Server und die Konfiguration**, sobald iMessage-DMs, Gruppen und Aktionen verifiziert sind. OpenClaw verwendet `channels.bluebubbles` nicht.

## Aktionsparität auf einen Blick

| Aktion                                                     | bisheriges BlueBubbles              | gebündeltes iMessage                                                                                                    |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Text senden / SMS-Fallback                                 | ✅                                  | ✅                                                                                                                      |
| Medien senden (Foto, Video, Datei, Sprache)                | ✅                                  | ✅                                                                                                                      |
| Thread-Antwort (`reply_to_guid`)                           | ✅                                  | ✅ (schließt [#51892](https://github.com/openclaw/openclaw/issues/51892))                                               |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Bearbeiten / zurückziehen (Empfänger mit macOS 13+)        | ✅                                  | ✅                                                                                                                      |
| Mit Bildschirmeffekt senden                                | ✅                                  | ✅ (schließt einen Teil von [#9394](https://github.com/openclaw/openclaw/issues/9394))                                  |
| Rich Text fett / kursiv / unterstrichen / durchgestrichen  | ✅                                  | ✅ (Typed-Run-Formatierung über attributedBody)                                                                         |
| Gruppe umbenennen / Gruppensymbol festlegen                | ✅                                  | ✅                                                                                                                      |
| Teilnehmer hinzufügen / entfernen, Gruppe verlassen        | ✅                                  | ✅                                                                                                                      |
| Lesebestätigungen und Tippindikator                        | ✅                                  | ✅ (durch privaten API-Probe geschützt)                                                                                 |
| Zusammenfassen von DMs desselben Absenders                 | ✅                                  | ✅ (nur DM; Opt-in über `channels.imessage.coalesceSameSenderDms`)                                                      |
| Nachholen eingehender Nachrichten, die während Gateway-Ausfall empfangen wurden | ✅ (Webhook-Replay + History-Fetch) | ✅ (Opt-in über `channels.imessage.catchup.enabled`; schließt [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

iMessage-Catchup ist jetzt als Opt-in-Funktion im gebündelten Plugin verfügbar. Beim Start des Gateway führt der Gateway, wenn `channels.imessage.catchup.enabled` `true` ist, einen `chats.list`-Durchlauf plus pro Chat einen `messages.history`-Durchlauf gegen denselben JSON-RPC-Client aus, den `imsg watch` verwendet, spielt jede verpasste eingehende Zeile über den Live-Dispatch-Pfad erneut ein (Allowlists, Gruppenrichtlinie, Debouncer, Echo-Cache) und persistiert pro Account einen Cursor, damit spätere Starts dort fortfahren, wo sie aufgehört haben. Siehe [Nachholen nach Gateway-Ausfallzeit](/de/channels/imessage#catching-up-after-gateway-downtime) für die Feinabstimmung.

## Pairing, Sitzungen und ACP-Bindings

- **Pairing-Genehmigungen** werden anhand des Handles übernommen. Sie müssen bekannte Absender nicht erneut genehmigen — `channels.imessage.allowFrom` erkennt dieselben `+15555550123`- / `user@example.com`-Strings, die BlueBubbles verwendet hat.
- **Sitzungen** bleiben pro Agent + Chat abgegrenzt. DMs werden unter dem Standard `session.dmScope=main` in der Hauptsitzung des Agent zusammengeführt; Gruppensitzungen bleiben pro `chat_id` isoliert. Die Sitzungsschlüssel unterscheiden sich (`agent:<id>:imessage:group:<chat_id>` gegenüber dem BlueBubbles-Äquivalent) — alter Gesprächsverlauf unter BlueBubbles-Sitzungsschlüsseln wird nicht in iMessage-Sitzungen übernommen.
- **ACP-Bindings** mit Verweis auf `match.channel: "bluebubbles"` müssen auf `"imessage"` aktualisiert werden. Die Formen von `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, reines Handle) sind identisch.

## Kein Rollback-Kanal

Es gibt keine unterstützte BlueBubbles-Runtime, zu der Sie zurückwechseln können. Wenn die iMessage-Verifizierung fehlschlägt, setzen Sie `channels.imessage.enabled: false`, starten Sie den Gateway neu, beheben Sie den `imsg`-Blocker und wiederholen Sie die Umstellung.

Der Antwort-Cache liegt unter `~/.openclaw/state/imessage/reply-cache.jsonl` (Modus `0600`, übergeordnetes Verzeichnis `0700`). Sie können ihn sicher löschen, wenn Sie einen sauberen Neustart möchten.

## Verwandte Themen

- [iMessage](/de/channels/imessage) — vollständige Referenz zum iMessage-Kanal, einschließlich `imsg launch`-Einrichtung und Fähigkeitserkennung.
- `/channels/bluebubbles` — alte URL, die zu diesem Migrationsleitfaden weiterleitet.
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf.
- [Channel-Routing](/de/channels/channel-routing) — wie der Gateway einen Kanal für ausgehende Antworten auswählt.
