---
read_when:
    - Planung eines Wechsels von BlueBubbles zum mitgelieferten iMessage-Plugin
    - BlueBubbles-Konfigurationsschlüssel in iMessage-Entsprechungen übersetzen
    - imsg vor der Aktivierung des iMessage-Plugins überprüfen
summary: 'Migrieren Sie alte BlueBubbles-Konfigurationen zum gebündelten iMessage-Plugin: Schlüsselzuordnung, Gruppen-Zulassungslistenprüfungen und Überprüfung der Umstellung.'
title: Von BlueBubbles kommend
x-i18n:
    generated_at: "2026-07-24T03:39:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5984ad1319b4bb3060496666bea6de663eba0105a89f82d13030c015c5df159d
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Die Unterstützung für BlueBubbles wurde entfernt. OpenClaw unterstützt iMessage nur über das mitgelieferte `imessage`-Plugin, das [`steipete/imsg`](https://github.com/steipete/imsg) über JSON-RPC steuert und auf dieselbe private API-Oberfläche zugreift wie zuvor BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, native Umfragen, Gruppenverwaltung, Anhänge). Eine einzige CLI-Binärdatei ersetzt den BlueBubbles-Server, die Client-App und die Webhook-Infrastruktur: kein REST-Endpunkt, keine Webhook-Authentifizierung.

Dieser Leitfaden beschreibt die Migration alter `channels.bluebubbles`-Konfigurationen zu `channels.imessage`. Es gibt keinen anderen unterstützten Migrationspfad. In der aktuellen OpenClaw-Version ist ein verbliebener `channels.bluebubbles`-Block wirkungslos – keine Laufzeitkomponente liest ihn.

<Note>
Die kurze Ankündigung und Zusammenfassung für Betreiber finden Sie unter [Entfernung von BlueBubbles und der imsg-Pfad für iMessage](/de/announcements/bluebubbles-imessage).
</Note>

## Migrationscheckliste

Der kürzeste sichere Weg, wenn Ihre alte BlueBubbles-Konfiguration bereits bekannt ist:

1. Überprüfen Sie `imsg` direkt auf dem Mac, auf dem Messages.app ausgeführt wird (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Kopieren Sie die Verhaltensschlüssel aus `channels.bluebubbles` nach `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` und `actions`.
3. Entfernen Sie nicht mehr vorhandene Transportschlüssel: `serverUrl`, `password`, Webhook-URLs und die Einrichtung des BlueBubbles-Servers.
4. Wenn der Gateway nicht auf dem Messages-Mac ausgeführt wird, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper und legen Sie `remoteHost` für den Abruf entfernter Anhänge fest.
5. Aktivieren Sie `channels.imessage`, starten Sie den Gateway neu und führen Sie anschließend `openclaw channels status --probe --channel imessage` aus.
6. Testen Sie eine Direktnachricht, eine zulässige Gruppe, Anhänge, sofern aktiviert, sowie jede private API-Aktion, die der Agent voraussichtlich verwenden wird.
7. Löschen Sie den BlueBubbles-Server und die alte `channels.bluebubbles`-Konfiguration, nachdem der iMessage-Pfad überprüft wurde.

## Funktionsweise von imsg

`imsg` ist eine lokale macOS-CLI für Messages. OpenClaw startet `imsg rpc` als untergeordneten Prozess und kommuniziert über stdin/stdout mittels JSON-RPC. Es gibt keinen HTTP-Server, keine Webhook-URL, keinen Hintergrund-Daemon, keinen Launch Agent und keinen offenzulegenden Port.

- Lesevorgänge erfolgen über `~/Library/Messages/chat.db` mit einem schreibgeschützten SQLite-Handle.
- Eingehende Live-Nachrichten stammen aus `imsg watch` / `watch.subscribe`, das `chat.db`-Dateisystemereignissen folgt und ersatzweise Polling verwendet.
- Zum Senden normaler Texte und Dateien wird die Automatisierung von Messages.app verwendet.
- Erweiterte Aktionen verwenden `imsg launch`, um den `imsg`-Helper in Messages.app einzuschleusen. Dadurch werden Lesebestätigungen, Tippanzeigen, formatierte Sendevorgänge, Bearbeiten, Zurückziehen, Antworten in Threads, Tapbacks, Umfragen und Gruppenverwaltung ermöglicht.
- Linux-Builds können eine kopierte `chat.db` untersuchen, jedoch weder Nachrichten senden noch die Live-Datenbank des Macs überwachen oder Messages.app steuern. Führen Sie für OpenClaw iMessage `imsg` auf dem angemeldeten Mac oder über einen SSH-Wrapper zu diesem Mac aus.

## Vorbereitungen

1. Installieren Sie `imsg` auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Bei der üblichen lokalen Einrichtung kann die OpenClaw-Einrichtung eine vom Benutzer bestätigte Homebrew-Installation oder -Aktualisierung für `imsg` auf dem bei Messages angemeldeten Mac anbieten. Manuelle Einrichtungen und Topologien mit SSH-Wrapper bleiben in der Verantwortung des Betreibers: Wiederholen Sie die Homebrew-Aktualisierung in demselben lokalen oder entfernten Benutzerkontext, in dem `imsg` ausgeführt wird. Wenn `imsg chats` mit `unable to open database file`, leerer Ausgabe oder `authorization denied` fehlschlägt, gewähren Sie dem Terminal, Editor, Node-Prozess, Gateway-Dienst oder übergeordneten SSH-Prozess, der `imsg` startet, vollständigen Festplattenzugriff und öffnen Sie diesen übergeordneten Prozess anschließend erneut.

2. Überprüfen Sie die Oberflächen zum Lesen, Überwachen, Senden und für RPC, bevor Sie die OpenClaw-Konfiguration ändern:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ersetzen Sie `42` durch eine echte Chat-ID aus `imsg chats`. Das Senden erfordert die Automatisierungsberechtigung für Messages.app. Wenn OpenClaw über SSH ausgeführt wird, führen Sie diese Befehle über denselben SSH-Wrapper oder Benutzerkontext aus, den OpenClaw verwenden wird. Wenn Lesevorgänge funktionieren, Sendevorgänge jedoch mit AppleEvents `-1743` fehlschlagen, prüfen Sie, ob die Automatisierungsberechtigung für `/usr/libexec/sshd-keygen-wrapper` erteilt wurde; siehe [SSH-Wrapper-Sendevorgänge schlagen mit AppleEvents -1743 fehl](/de/channels/imessage#requirements-and-permissions-macos).

3. Aktivieren Sie die private API-Bridge. Dies wird für OpenClaw iMessage dringend empfohlen, da Antworten, Tapbacks, Effekte, Umfragen, Antworten auf Anhänge und Gruppenaktionen davon abhängen:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` erfordert, dass SIP deaktiviert ist (und bei modernen macOS-Versionen die Bibliotheksvalidierung gelockert wurde – siehe [Aktivieren der privaten imsg-API](/de/channels/imessage#enabling-the-imsg-private-api)). Grundlegendes Senden sowie Verlauf und Überwachung funktionieren ohne `imsg launch`; der vollständige Aktionsumfang von OpenClaw iMessage jedoch nicht.

4. Nachdem Sie `channels.imessage` aktiviert und den Gateway gestartet haben, überprüfen Sie die Bridge über OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Das iMessage-Konto sollte `works` melden; bei `--json` enthält die Prüfantwort `privateApi.available: true`. Wenn `false` gemeldet wird, beheben Sie dies zuerst – siehe [Funktionserkennung](/de/channels/imessage#private-api-actions). Für die Prüfung muss ein erreichbarer Gateway vorhanden sein (andernfalls gibt die CLI ersatzweise nur Konfigurationsinformationen aus), und es werden ausschließlich konfigurierte, aktivierte Konten geprüft.

5. Erstellen Sie eine Sicherungskopie Ihrer Konfiguration:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Konfigurationsübertragung

iMessage und BlueBubbles verwenden größtenteils dieselben Verhaltensschlüssel auf Kanalebene. Geändert werden der Transport (REST-Server gegenüber lokaler CLI) und das Schlüsselformat der Gruppenregistrierung.

| BlueBubbles                                                | gebündeltes iMessage                      | Hinweise                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Gleiche Semantik (standardmäßig `true`, sobald der Block vorhanden ist).                                                                                                                                                                                                        |
| `channels.bluebubbles.serverUrl`                           | _(entfernt)_                              | Kein REST-Server — das Plugin startet `imsg rpc` über stdio.                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _(entfernt)_                              | Keine Webhook-Authentifizierung erforderlich.                                                                                                                                                                                                                                    |
| _(implizit)_                                               | `channels.imessage.cliPath`               | Pfad zu `imsg` (Standard: `imsg`); verwenden Sie für SSH ein Wrapper-Skript.                                                                                                                                                                                               |
| _(implizit)_                                               | `channels.imessage.dbPath`                | Optionale Überschreibung von Messages.app `chat.db`; wird bei Auslassung automatisch erkannt.                                                                                                                                                                                    |
| _(implizit)_                                               | `channels.imessage.remoteHost`            | `host` oder `user@host` — nur erforderlich, wenn `cliPath` ein SSH-Wrapper ist und Sie Anhänge per SCP abrufen möchten.                                                                                                                                                 |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Gleiche Werte (`pairing` / `allowlist` / `open` / `disabled`); Standard: `pairing`.                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Gleiche Handle-Formate (`+15555550123`, `user@example.com`). Genehmigungen aus dem Kopplungsspeicher werden nicht übertragen — siehe unten.                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Gleiche Werte (`allowlist` / `open` / `disabled`); Standard: `allowlist`.                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Gleich. Wenn nicht festgelegt, greift iMessage auf `allowFrom` zurück; ein explizit leeres `groupAllowFrom: []` blockiert unter `groupPolicy: "allowlist"` alle Gruppen.                                                                                                              |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Kopieren Sie den Platzhaltereintrag `"*"` unverändert; versehen Sie gruppenspezifische Einträge anhand der numerischen iMessage-`chat_id` mit neuen Schlüsseln — siehe „Fallstrick bei der Gruppenregistrierung“. `requireMention`, `tools`, `toolsBySender` und `systemPrompt` werden übernommen. |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standard: `true`. Beim gebündelten Plugin wird dies nur ausgelöst, wenn die Prüfung der privaten API aktiv ist.                                                                                                                                                                |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Gleiche Struktur, ebenfalls standardmäßig deaktiviert. Wenn Anhänge über BlueBubbles übertragen wurden, legen Sie dies explizit fest — eingehende Fotos/Medien werden andernfalls stillschweigend verworfen (keine `Inbound message`-Protokollzeile).                          |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale Stammverzeichnisse; gleiche Platzhalterregeln.                                                                                                                                                                                                                             |
| _(nicht zutreffend)_                                      | `channels.imessage.remoteAttachmentRoots` | Wird nur verwendet, wenn `remoteHost` für SCP-Abrufe festgelegt ist.                                                                                                                                                                                                               |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standardmäßig 16 MB bei iMessage (BlueBubbles verwendete standardmäßig 8 MB). Legen Sie den Wert explizit fest, um die niedrigere Obergrenze beizubehalten.                                                                                                                       |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Bei beiden standardmäßig 4000.                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.coalesceSameSenderDms`               | _(entfernt)_                              | Migrieren Sie diesen Schlüssel nicht. `imsg` ab Version 0.13.1 führt von Apple-URL-Vorschauen aufgeteilte Sendungen zusammen, bevor OpenClaw sie empfängt; `openclaw doctor --fix` entfernt einen veralteten iMessage-Schlüssel.                                          |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(nicht zutreffend)_                       | `imsg` stellt bereits die Anzeigenamen der Absender aus `chat.db` bereit.                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Gleiche aktionsspezifische Umschalter (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) sowie neu `polls`. Alle sind standardmäßig aktiviert; Aktionen der privaten API benötigen weiterhin die Bridge. |

Konfigurationen mit mehreren Konten (`channels.bluebubbles.accounts.*`) werden eins zu eins in `channels.imessage.accounts.*` übertragen.

## Fallstrick bei der Gruppenregistrierung

Das gebündelte iMessage-Plugin führt unmittelbar nacheinander zwei Gruppenprüfungen aus. Eine Gruppennachricht muss beide passieren, um den Agenten zu erreichen:

1. **Zulassungsliste für Absender/Chat-Ziele** (`channels.imessage.groupAllowFrom`) — gleicht das Absender-Handle oder das Chat-Ziel ab (Einträge in `chat_id:`, `chat_guid:`, `chat_identifier:`). Wenn `groupAllowFrom` nicht festgelegt ist, greift diese Prüfung auf `allowFrom` zurück; ein explizites `groupAllowFrom: []` deaktiviert diesen Rückgriff und verwirft unter `groupPolicy: "allowlist"` jede Gruppennachricht.
2. **Gruppenregistrierung** (`channels.imessage.groups`) — nach der numerischen iMessage-`chat_id` verschlüsselt:
   - Kein `groups`-Block (oder ein leerer Block): Gruppen passieren diese Prüfung, solange Prüfung 1 über eine nicht leere effektive Absender-Zulassungsliste verfügt; die Absenderfilterung steuert den Zugriff, und beim Start wird keine Warnung zum Verwerfen aller Nachrichten ausgegeben.
   - `groups` mit Einträgen, aber ohne `"*"`: Nur die aufgeführten `chat_id`-Schlüssel passieren. Sobald eine Gruppe aufgeführt wird, wird die Registrierung selbst unter `groupPolicy: "open"` zu einer Zulassungsliste.
   - `groups: { "*": { ... } }`: Jede Gruppe passiert diese Prüfung.

Der Fallstrick bei der Migration: BlueBubbles verschlüsselte `groups`-Einträge nach Chat-GUID/Chat-Kennung, während die iMessage-Registrierung numerische `chat_id` als Schlüssel verwendet. Unverändert kopierte gruppenspezifische Einträge erzeugen eine nicht leere Registrierung, deren Schlüssel niemals übereinstimmen, sodass jede Gruppennachricht bei Prüfung 2 verworfen wird. Kopieren Sie den Platzhalter `"*"` unverändert; versehen Sie bestimmte Gruppeneinträge mit `chat_id`-Werten aus `imsg chats` mit neuen Schlüsseln.

Beide Verwerfungspfade sind auf der standardmäßigen Protokollierungsstufe anhand von `warn`-Zeilen sichtbar:

- Einmal pro Konto beim Start, wenn `groupPolicy: "allowlist"` festgelegt und die effektive Gruppenabsender-Zulassungsliste leer ist: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Legen Sie `groupAllowFrom` (oder `allowFrom`) fest, um Absender zuzulassen; das alleinige Hinzufügen von `groups` erfüllt die Absenderprüfung nicht.
- Einmal pro `chat_id` zur Laufzeit, wenn die Registrierung eine Gruppe verwirft: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`; dabei wird der exakt hinzuzufügende Schlüssel genannt.

Direktnachrichten funktionieren in beiden Fällen weiterhin — sie verwenden einen anderen Codepfad, daher belegt der Erfolg von Direktnachrichten nicht, dass die Gruppenweiterleitung funktioniert.

Die minimale absenderbezogene Konfiguration mit `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Damit werden die konfigurierten Absender in jeder Gruppe zugelassen. Fügen Sie `groups`-Einträge hinzu, um die zulässigen Chats einzuschränken oder chatbezogene Optionen wie `requireMention` festzulegen; kopieren Sie den BlueBubbles-Eintrag `"*"` unverändert, versehen Sie jedoch bestimmte Einträge anhand der numerischen iMessage-`chat_id`-Werte mit neuen Schlüsseln.

## Schritt für Schritt

1. Übertragen Sie die Konfiguration. Lassen Sie den neuen Block während der Bearbeitung deaktiviert; der alte `channels.bluebubbles`-Block wird vom aktuellen OpenClaw ignoriert und kann als Referenz daneben bestehen bleiben:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // auf true setzen, wenn die Umstellung erfolgen kann
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // aus bluebubbles.allowFrom kopieren
         groupPolicy: "allowlist",
         groupAllowFrom: [], // aus bluebubbles.groupAllowFrom kopieren
         groups: { "*": { requireMention: true } }, // Platzhalter unverändert kopieren; chatspezifische Einträge anhand von chat_id mit neuen Schlüsseln versehen
         // Aktionen sind standardmäßig aktiviert; einzelne Umschalter zum Deaktivieren auf false setzen
       },
     },
   }
   ```

2. **Umstellen und prüfen.** Legen Sie `channels.imessage.enabled: true` fest, starten Sie den Gateway neu und bestätigen Sie, dass der Kanal als fehlerfrei gemeldet wird:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # erwartet „works“; --json zeigt privateApi.available: true
   ```

   Die Prüfung erfordert einen erreichbaren Gateway und prüft nur konfigurierte, aktivierte Konten. Verwenden Sie die direkten `imsg`-Befehle unter [Vorbereitungen](#before-you-start), um den Mac selbst zu validieren.

3. **DMs überprüfen.** Senden Sie dem Agenten eine Direktnachricht und bestätigen Sie, dass die Antwort ankommt.

4. **Gruppen separat überprüfen.** DMs und Gruppen verwenden unterschiedliche Codepfade — erfolgreiche DMs beweisen nicht, dass Gruppen korrekt weitergeleitet werden. Senden Sie eine Nachricht in einem zulässigen Gruppenchat und bestätigen Sie, dass die Antwort ankommt. Wenn die Gruppe stumm bleibt (keine Antwort des Agenten, kein Fehler), prüfen Sie das Gateway-Protokoll auf die beiden oben unter „Group registry footgun“ genannten `warn`-Zeilen. Die Startwarnung bedeutet, dass die effektive Absender-Zulassungsliste leer ist; eine Warnung pro `chat_id` bedeutet, dass eine befüllte `groups`-Registry diesen Chat nicht enthält.

5. **Aktionsumfang überprüfen.** Bitten Sie den Agenten in einer gekoppelten DM, eine Reaktion hinzuzufügen, eine Nachricht zu bearbeiten, zurückzuziehen und zu beantworten sowie ein Foto zu senden und (in einer Gruppe) die Gruppe umzubenennen oder einen Teilnehmer hinzuzufügen bzw. zu entfernen. Jede Aktion sollte nativ in Messages.app erscheinen. Wenn eine Aktion `iMessage <action> requires the imsg private API bridge` auslöst, führen Sie `imsg launch` erneut aus und aktualisieren Sie mit `openclaw channels status --probe`.

6. **Entfernen Sie den BlueBubbles-Server und den `channels.bluebubbles`-Block**, sobald iMessage-DMs, -Gruppen und -Aktionen überprüft wurden. OpenClaw liest `channels.bluebubbles` nicht.

## Aktionsparität auf einen Blick

| Aktion                                              | altes BlueBubbles | gebündeltes iMessage                                                          |
| --------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| Text senden / SMS-Fallback                          | ✅                 | ✅                                                                            |
| Medien senden (Foto, Video, Datei, Sprachnachricht) | ✅                 | ✅                                                                            |
| Antwort im Thread (`reply_to_guid`)              | ✅                 | ✅ (schließt [#51892](https://github.com/openclaw/openclaw/issues/51892))      |
| Tapback (`react`)                        | ✅                 | ✅                                                                            |
| Bearbeiten / zurückziehen (Empfänger mit macOS 13+) | ✅                 | ✅                                                                            |
| Mit Bildschirmeffekt senden                         | ✅                 | ✅ (schließt einen Teil von [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Rich Text: fett / kursiv / unterstrichen / durchgestrichen | ✅          | ✅ (typisierte Lauf-Formatierung über attributedBody)                         |
| Native Messages-Umfragen (erstellen und abstimmen)  | ❌                 | ✅ (`actions.polls`; Empfänger benötigen iOS/macOS 26+ für die native Darstellung) |
| Gruppe umbenennen / Gruppensymbol festlegen         | ✅                 | ✅                                                                            |
| Teilnehmer hinzufügen / entfernen, Gruppe verlassen | ✅                | ✅                                                                            |
| Lesebestätigungen und Tippanzeige                    | ✅                 | ✅ (durch Prüfung der privaten API eingeschränkt)                             |
| Zusammenführung geteilter Apple-URL-Vorschauen       | ✅                 | ✅ (wird vorgelagert von `imsg` 0.13.1 und neuer verarbeitet; keine OpenClaw-Einstellung) |
| Wiederherstellung eingehender Nachrichten nach einem Neustart | ✅        | ✅ (automatisch: `since_rowid`-Wiedergabe + GUID-Deduplizierung; größeres Zeitfenster bei lokaler Ausführung) |

iMessage stellt Nachrichten wieder her, die während eines Gateway-Ausfalls verpasst wurden: Beim Start erfolgt über `imsg watch.subscribe` `since_rowid` eine Wiedergabe ab der rowid der letzten zugestellten Nachricht, eine Deduplizierung anhand der GUID und eine Altersbegrenzung für veraltete Rückstände, die die Push-Flush-„Backlog-Bombe“ unterdrückt. Dies läuft über die `imsg`-RPC-Verbindung und funktioniert daher auch bei Remote-SSH-Konfigurationen mit `cliPath`; lokale Konfigurationen erhalten ein größeres Wiederherstellungszeitfenster, da sie `chat.db` lesen können. Siehe [Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways](/de/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Kopplung, Sitzungen und ACP-Bindungen

- **Zulassungslisten werden anhand des Handles übernommen.** `channels.imessage.allowFrom` erkennt dieselben `+15555550123`- / `user@example.com`-Zeichenfolgen, die BlueBubbles verwendet hat — kopieren Sie sie unverändert.
- **Genehmigungen im Kopplungsspeicher werden nicht übertragen.** Der Kopplungsspeicher gilt pro Kanal, und der alte BlueBubbles-Speicher wird nicht migriert. Absender, die ausschließlich über die Kopplung genehmigt wurden, müssen sich unter iMessage erneut koppeln, oder Sie fügen ihre Handles zu `allowFrom` hinzu.
- **Sitzungen** bleiben auf den jeweiligen Agenten und Chat beschränkt. DMs werden unter dem standardmäßigen `session.dmScope=main` in der Hauptsitzung des Agenten zusammengeführt; Gruppensitzungen bleiben pro `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`) isoliert. Der alte Konversationsverlauf unter BlueBubbles-Sitzungsschlüsseln wird nicht in iMessage-Sitzungen übernommen.
- **ACP-Bindungen**, die auf `match.channel: "bluebubbles"` verweisen, müssen auf `"imessage"` geändert werden. Die `match.peer.id`-Formen (`chat_id:`, `chat_guid:`, `chat_identifier:`, reines Handle) sind identisch.

## Kein Kanal für ein Rollback

Es gibt keine unterstützte BlueBubbles-Laufzeit, zu der zurückgewechselt werden kann. Wenn die iMessage-Überprüfung fehlschlägt, setzen Sie `channels.imessage.enabled: false`, starten Sie den Gateway neu, beheben Sie den `imsg`-Blocker und versuchen Sie die Umstellung erneut.

Der Antwort-Cache befindet sich im SQLite-Plugin-Status. `openclaw doctor --fix` importiert und archiviert die alte `imessage/reply-cache.jsonl`-Sidecar-Datei, sofern vorhanden.

## Verwandte Themen

- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — kurze Ankündigung und Zusammenfassung für Betreiber.
- [iMessage](/de/channels/imessage) — vollständige Referenz zum iMessage-Kanal, einschließlich Einrichtung von `imsg launch` und Funktionserkennung.
- `/channels/bluebubbles` — alte URL, die zu diesem Migrationsleitfaden weiterleitet.
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf.
- [Kanalrouting](/de/channels/channel-routing) — wie der Gateway einen Kanal für ausgehende Antworten auswählt.
