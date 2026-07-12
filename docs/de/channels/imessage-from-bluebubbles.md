---
read_when:
    - Planung eines Wechsels von BlueBubbles zum gebündelten iMessage-Plugin
    - BlueBubbles-Konfigurationsschlüssel in iMessage-Entsprechungen übersetzen
    - imsg vor dem Aktivieren des iMessage-Plugins überprüfen
summary: 'Alte BlueBubbles-Konfigurationen in das gebündelte iMessage-Plugin migrieren: Schlüsselzuordnung, Gruppen-Zulassungslisten-Gates und Überprüfung der Umstellung.'
title: Von BlueBubbles kommend
x-i18n:
    generated_at: "2026-07-12T14:59:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Die BlueBubbles-Unterstützung wurde entfernt. OpenClaw unterstützt iMessage nur über das gebündelte `imessage`-Plugin, das [`steipete/imsg`](https://github.com/steipete/imsg) über JSON-RPC steuert und dieselbe private API-Oberfläche erreicht, die BlueBubbles hatte (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, native Umfragen, Gruppenverwaltung, Anhänge). Eine einzige CLI-Binärdatei ersetzt den BlueBubbles-Server, die Client-App und die Webhook-Infrastruktur: kein REST-Endpunkt, keine Webhook-Authentifizierung.

Dieser Leitfaden migriert alte `channels.bluebubbles`-Konfigurationen zu `channels.imessage`. Es gibt keinen anderen unterstützten Migrationspfad. Im aktuellen OpenClaw ist ein verbliebener `channels.bluebubbles`-Block wirkungslos – keine Laufzeitkomponente liest ihn.

<Note>
Die kurze Ankündigung und eine Zusammenfassung für Betreiber finden Sie unter [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage).
</Note>

## Migrationscheckliste

Der kürzeste sichere Weg, wenn Sie Ihre alte BlueBubbles-Konfiguration bereits kennen:

1. Überprüfen Sie `imsg` direkt auf dem Mac, auf dem Messages.app ausgeführt wird (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Kopieren Sie die Verhaltensschlüssel von `channels.bluebubbles` nach `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` und `actions`.
3. Entfernen Sie Transportschlüssel, die nicht mehr existieren: `serverUrl`, `password`, Webhook-URLs und die BlueBubbles-Servereinrichtung.
4. Wenn der Gateway nicht auf dem Messages-Mac ausgeführt wird, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper und legen Sie `remoteHost` für das Abrufen entfernter Anhänge fest.
5. Aktivieren Sie `channels.imessage`, starten Sie den Gateway neu und führen Sie anschließend `openclaw channels status --probe --channel imessage` aus.
6. Testen Sie eine Direktnachricht, eine zulässige Gruppe, Anhänge, falls aktiviert, sowie jede private API-Aktion, die der Agent voraussichtlich verwenden wird.
7. Löschen Sie den BlueBubbles-Server und die alte `channels.bluebubbles`-Konfiguration, nachdem der iMessage-Pfad überprüft wurde.

## Funktionsweise von imsg

`imsg` ist eine lokale macOS-CLI für Messages. OpenClaw startet `imsg rpc` als untergeordneten Prozess und kommuniziert über stdin/stdout mittels JSON-RPC. Es gibt keinen HTTP-Server, keine Webhook-URL, keinen Hintergrund-Daemon, keinen Launch Agent und keinen offenzulegenden Port.

- Lesezugriffe erfolgen über `~/Library/Messages/chat.db` mithilfe eines schreibgeschützten SQLite-Handles.
- Eingehende Live-Nachrichten stammen aus `imsg watch` / `watch.subscribe`, das Dateisystemereignissen von `chat.db` folgt und ersatzweise Polling verwendet.
- Für das normale Senden von Texten und Dateien wird die Automatisierung von Messages.app verwendet.
- Erweiterte Aktionen verwenden `imsg launch`, um den `imsg`-Hilfsprozess in Messages.app zu injizieren. Dadurch werden Lesebestätigungen, Tippindikatoren, formatierte Sendungen, Bearbeiten, Zurückziehen, Antworten in Threads, Tapbacks, Umfragen und Gruppenverwaltung ermöglicht.
- Linux-Builds können eine kopierte `chat.db` untersuchen, aber weder Nachrichten senden noch die Live-Datenbank des Macs überwachen oder Messages.app steuern. Führen Sie für OpenClaw iMessage `imsg` auf dem angemeldeten Mac oder über einen SSH-Wrapper zu diesem Mac aus.

## Bevor Sie beginnen

1. Installieren Sie `imsg` auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Bei der üblichen lokalen Einrichtung kann die OpenClaw-Einrichtung eine vom Benutzer bestätigte Homebrew-Installation oder -Aktualisierung von `imsg` auf dem bei Messages angemeldeten Mac anbieten. Manuelle Einrichtungen und Topologien mit SSH-Wrapper bleiben in der Verantwortung des Betreibers: Wiederholen Sie die Homebrew-Aktualisierung im selben lokalen oder entfernten Benutzerkontext, in dem `imsg` ausgeführt wird. Wenn `imsg chats` mit `unable to open database file`, leerer Ausgabe oder `authorization denied` fehlschlägt, gewähren Sie dem Terminal, Editor, Node-Prozess, Gateway-Dienst oder übergeordneten SSH-Prozess, der `imsg` startet, vollständigen Festplattenzugriff und öffnen Sie anschließend diesen übergeordneten Prozess erneut.

2. Überprüfen Sie die Oberflächen für Lesen, Überwachen, Senden und RPC, bevor Sie die OpenClaw-Konfiguration ändern:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw-imsg-Test"
   imsg rpc --help
   ```

   Ersetzen Sie `42` durch eine echte Chat-ID aus `imsg chats`. Das Senden erfordert die Automatisierungsberechtigung für Messages.app. Wenn OpenClaw über SSH ausgeführt wird, führen Sie diese Befehle über denselben SSH-Wrapper oder Benutzerkontext aus, den OpenClaw verwenden wird. Wenn Lesezugriffe funktionieren, das Senden jedoch mit AppleEvents `-1743` fehlschlägt, prüfen Sie, ob die Automatisierungsberechtigung `/usr/libexec/sshd-keygen-wrapper` zugewiesen wurde; siehe [Senden über den SSH-Wrapper schlägt mit AppleEvents -1743 fehl](/de/channels/imessage#requirements-and-permissions-macos).

3. Aktivieren Sie die private API-Bridge. Dies wird für OpenClaw iMessage dringend empfohlen, da Antworten, Tapbacks, Effekte, Umfragen, Antworten mit Anhängen und Gruppenaktionen davon abhängen:

   ```bash
   imsg launch
   imsg status --json
   ```

   Für `imsg launch` muss SIP deaktiviert sein (und unter modernem macOS muss die Bibliotheksvalidierung gelockert werden – siehe [Aktivieren der privaten imsg-API](/de/channels/imessage#enabling-the-imsg-private-api)). Grundlegendes Senden, der Verlauf und die Überwachung funktionieren ohne `imsg launch`; der vollständige Aktionsumfang von OpenClaw iMessage jedoch nicht.

4. Nachdem Sie `channels.imessage` aktiviert und den Gateway gestartet haben, überprüfen Sie die Bridge über OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Das iMessage-Konto sollte `works` melden; mit `--json` enthält die Probe-Nutzlast `privateApi.available: true`. Wenn `false` gemeldet wird, beheben Sie dies zuerst – siehe [Funktionserkennung](/de/channels/imessage#private-api-actions). Für die Prüfung ist ein erreichbarer Gateway erforderlich (andernfalls greift die CLI auf eine reine Konfigurationsausgabe zurück), und es werden nur konfigurierte, aktivierte Konten geprüft.

5. Erstellen Sie eine Sicherungskopie Ihrer Konfiguration:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Konfigurationsübertragung

iMessage und BlueBubbles verwenden größtenteils dieselben Verhaltensschlüssel auf Kanalebene. Geändert werden der Transport (REST-Server gegenüber lokaler CLI) und das Schlüsselformat der Gruppenregistrierung.

| BlueBubbles                                                | gebündeltes iMessage                      | Hinweise                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Gleiche Semantik (standardmäßig `true`, sobald der Block vorhanden ist).                                                                                                                                                                                                                                                |
| `channels.bluebubbles.serverUrl`                           | _(entfernt)_                              | Kein REST-Server – das Plugin startet `imsg rpc` über stdio.                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _(entfernt)_                              | Keine Webhook-Authentifizierung erforderlich.                                                                                                                                                                                                                                                                           |
| _(implizit)_                                               | `channels.imessage.cliPath`               | Pfad zu `imsg` (Standardwert `imsg`); verwenden Sie für SSH ein Wrapper-Skript.                                                                                                                                                                                                                                         |
| _(implizit)_                                               | `channels.imessage.dbPath`                | Optionale Überschreibung für `chat.db` von Messages.app; wird automatisch erkannt, wenn nicht angegeben.                                                                                                                                                                                                                |
| _(implizit)_                                               | `channels.imessage.remoteHost`            | `host` oder `user@host` – nur erforderlich, wenn `cliPath` ein SSH-Wrapper ist und Sie Anhänge per SCP abrufen möchten.                                                                                                                                                                                                  |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Gleiche Werte (`pairing` / `allowlist` / `open` / `disabled`); Standardwert `pairing`.                                                                                                                                                                                                                                  |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Gleiche Handle-Formate (`+15555550123`, `user@example.com`). Genehmigungen aus dem Pairing-Speicher werden nicht übertragen – siehe unten.                                                                                                                                                                               |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Gleiche Werte (`allowlist` / `open` / `disabled`); Standardwert `allowlist`.                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Gleich. Wenn nicht festgelegt, greift iMessage auf `allowFrom` zurück; ein explizit leeres `groupAllowFrom: []` blockiert unter `groupPolicy: "allowlist"` alle Gruppen.                                                                                                                                                  |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Kopieren Sie den Platzhaltereintrag `"*"` unverändert; versehen Sie gruppenspezifische Einträge mit neuen Schlüsseln anhand der numerischen iMessage-`chat_id` – siehe „Stolperfalle beim Gruppenregister“. `requireMention`, `tools`, `toolsBySender` und `systemPrompt` werden übernommen.                                  |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standardwert `true`. Beim gebündelten Plugin wird dies nur ausgelöst, wenn die Prüfung der privaten API erfolgreich ist.                                                                                                                                                                                                 |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Gleiche Struktur, ebenfalls standardmäßig deaktiviert. Wenn Anhänge über BlueBubbles übertragen wurden, legen Sie dies explizit fest – eingehende Fotos/Medien werden andernfalls stillschweigend verworfen (keine `Inbound message`-Protokollzeile).                                                                      |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale Stammverzeichnisse; gleiche Platzhalterregeln.                                                                                                                                                                                                                                                                  |
| _(n. z.)_                                                  | `channels.imessage.remoteAttachmentRoots` | Wird nur verwendet, wenn `remoteHost` für SCP-Abrufe festgelegt ist.                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standardwert bei iMessage: 16 MB (der Standardwert bei BlueBubbles war 8 MB). Legen Sie den Wert explizit fest, um die niedrigere Obergrenze beizubehalten.                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standardwert bei beiden: 4000.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Gleiche optionale Aktivierung. Nur für Direktnachrichten – Gruppen behalten die Verarbeitung pro Nachricht bei. Erhöht die standardmäßige Eingangsentprellung auf 7000 ms, sofern nicht `messages.inbound.byChannel.imessage` oder ein globales `messages.inbound.debounceMs` festgelegt ist. Siehe [Zusammenfassen aufgeteilter Direktnachrichten](/de/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(n. z.)_                                 | `imsg` stellt die Anzeigenamen der Absender bereits aus `chat.db` bereit.                                                                                                                                                                                                                                               |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Gleiche aktionsspezifische Schalter (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) sowie das neue `polls`. Alle sind standardmäßig aktiviert; Aktionen der privaten API erfordern weiterhin die Bridge. |

Konfigurationen mit mehreren Konten (`channels.bluebubbles.accounts.*`) werden eins zu eins in `channels.imessage.accounts.*` übertragen.

## Stolperfalle beim Gruppenregister

Das gebündelte iMessage-Plugin führt zwei Gruppenprüfungen direkt nacheinander aus. Eine Gruppennachricht muss beide bestehen, um den Agenten zu erreichen:

1. **Absender-/Chatziel-Zulassungsliste** (`channels.imessage.groupAllowFrom`) – gleicht das Absender-Handle oder das Chatziel ab (Einträge mit `chat_id:`, `chat_guid:`, `chat_identifier:`). Wenn `groupAllowFrom` nicht festgelegt ist, greift diese Prüfung auf `allowFrom` zurück; ein explizites `groupAllowFrom: []` deaktiviert diesen Rückgriff und verwirft unter `groupPolicy: "allowlist"` jede Gruppennachricht.
2. **Gruppenregister** (`channels.imessage.groups`) – nach der numerischen iMessage-`chat_id` verschlüsselt:
   - Kein `groups`-Block (oder ein leerer): Gruppen bestehen diese Prüfung, solange Prüfung 1 über eine nicht leere effektive Absender-Zulassungsliste verfügt; die Absenderfilterung steuert den Zugriff, und beim Start wird keine Warnung ausgegeben, dass alle Nachrichten verworfen werden.
   - `groups` mit Einträgen, aber ohne `"*"`: Nur die aufgeführten `chat_id`-Schlüssel werden akzeptiert. Durch das Auflisten einer beliebigen Gruppe wird das Register selbst unter `groupPolicy: "open"` zu einer Zulassungsliste.
   - `groups: { "*": { ... } }`: Jede Gruppe besteht diese Prüfung.

Die Migrationsfalle: BlueBubbles verwendete Chat-GUIDs/Chat-IDs als Schlüssel für `groups`-Einträge, während das iMessage-Register numerische `chat_id`-Werte als Schlüssel verwendet. Unverändert kopierte gruppenspezifische Einträge erzeugen ein nicht leeres Register, dessen Schlüssel niemals übereinstimmen, sodass jede Gruppennachricht bei Prüfung 2 verworfen wird. Kopieren Sie den Platzhaltereintrag `"*"` unverändert; versehen Sie spezifische Gruppeneinträge mit neuen Schlüsseln aus den `chat_id`-Werten von `imsg chats`.

Beide Verwerfungspfade sind auf der standardmäßigen Protokollebene anhand von `warn`-Zeilen sichtbar:

- Einmal pro Konto beim Start, wenn `groupPolicy: "allowlist"` festgelegt und die effektive Absender-Zulassungsliste für Gruppen leer ist: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Legen Sie `groupAllowFrom` (oder `allowFrom`) fest, um Absender zuzulassen; das alleinige Hinzufügen von `groups` erfüllt die Absenderprüfung nicht.
- Einmal pro `chat_id` zur Laufzeit, wenn das Register eine Gruppe verwirft: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`; dabei wird der genaue hinzuzufügende Schlüssel genannt.

Direktnachrichten funktionieren in beiden Fällen weiterhin – sie verwenden einen anderen Codepfad, daher beweist der Erfolg von Direktnachrichten nicht, dass die Gruppenweiterleitung funktioniert.

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

Dadurch werden die konfigurierten Absender in jeder Gruppe zugelassen. Fügen Sie `groups`-Einträge hinzu, um die zulässigen Chats einzuschränken oder chatbezogene Optionen wie `requireMention` festzulegen; kopieren Sie den BlueBubbles-Eintrag `"*"` unverändert, versehen Sie spezifische Einträge jedoch mit neuen Schlüsseln anhand numerischer iMessage-`chat_id`-Werte.

## Schritt für Schritt

1. Migrieren Sie die Konfiguration. Lassen Sie den neuen Block während der Bearbeitung deaktiviert; der alte Block `channels.bluebubbles` wird von der aktuellen OpenClaw-Version ignoriert und kann als Referenz daneben bestehen bleiben:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // auf true setzen, wenn Sie zur Umstellung bereit sind
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // aus bluebubbles.allowFrom kopieren
         groupPolicy: "allowlist",
         groupAllowFrom: [], // aus bluebubbles.groupAllowFrom kopieren
         groups: { "*": { requireMention: true } }, // Platzhalter unverändert kopieren; Einträge pro Chat anhand der chat_id neu verschlüsseln
         // Aktionen sind standardmäßig aktiviert; einzelne Schalter zum Deaktivieren auf false setzen
       },
     },
   }
   ```

2. **Stellen Sie um und führen Sie eine Prüfung durch.** Setzen Sie `channels.imessage.enabled: true`, starten Sie den Gateway neu und bestätigen Sie, dass der Kanal als fehlerfrei gemeldet wird:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # „works“ erwartet; --json zeigt privateApi.available: true
   ```

   Die Prüfung erfordert einen erreichbaren Gateway und prüft nur konfigurierte, aktivierte Konten. Verwenden Sie die direkten `imsg`-Befehle unter [Bevor Sie beginnen](#before-you-start), um den Mac selbst zu überprüfen.

3. **Überprüfen Sie Direktnachrichten.** Senden Sie dem Agenten eine Direktnachricht und bestätigen Sie, dass die Antwort ankommt.

4. **Überprüfen Sie Gruppen separat.** Direktnachrichten und Gruppen durchlaufen unterschiedliche Codepfade — erfolgreiche Direktnachrichten beweisen nicht, dass Gruppen korrekt weitergeleitet werden. Senden Sie eine Nachricht in einem zulässigen Gruppenchat und bestätigen Sie, dass die Antwort ankommt. Wenn die Gruppe stumm bleibt (keine Antwort des Agenten, kein Fehler), prüfen Sie das Gateway-Protokoll auf die beiden `warn`-Zeilen aus „Fehlerquelle bei der Gruppenregistrierung“ oben. Die Startwarnung bedeutet, dass die effektive Absender-Zulassungsliste leer ist; eine Warnung pro `chat_id` bedeutet, dass eine befüllte `groups`-Registrierung diesen Chat nicht enthält.

5. **Überprüfen Sie die Aktionsoberfläche.** Bitten Sie den Agenten aus einer gekoppelten Direktnachricht heraus, eine Reaktion hinzuzufügen, eine Nachricht zu bearbeiten, zurückzuziehen oder zu beantworten, ein Foto zu senden und (in einer Gruppe) die Gruppe umzubenennen oder einen Teilnehmer hinzuzufügen bzw. zu entfernen. Jede Aktion sollte nativ in Messages.app ankommen. Wenn eine Aktion `iMessage <action> requires the imsg private API bridge` auslöst, führen Sie `imsg launch` erneut aus und aktualisieren Sie den Status mit `openclaw channels status --probe`.

6. **Entfernen Sie den BlueBubbles-Server und den Block `channels.bluebubbles`**, sobald iMessage-Direktnachrichten, -Gruppen und -Aktionen überprüft wurden. OpenClaw liest `channels.bluebubbles` nicht.

## Aktionsparität auf einen Blick

| Aktion                                              | älteres BlueBubbles | gebündeltes iMessage                                                            |
| --------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------- |
| Text senden / SMS-Ausweichlösung                    | ✅                  | ✅                                                                              |
| Medien senden (Foto, Video, Datei, Sprachnachricht) | ✅                  | ✅                                                                              |
| Antwort im Thread (`reply_to_guid`)                 | ✅                  | ✅ (schließt [#51892](https://github.com/openclaw/openclaw/issues/51892))       |
| Tapback (`react`)                                   | ✅                  | ✅                                                                              |
| Bearbeiten / zurückziehen (Empfänger mit macOS 13+) | ✅                  | ✅                                                                              |
| Mit Bildschirmeffekt senden                         | ✅                  | ✅ (schließt einen Teil von [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Rich-Text: fett / kursiv / unterstrichen / durchgestrichen | ✅           | ✅ (formatierte Textabschnitte über attributedBody)                             |
| Native Messages-Umfragen (erstellen und abstimmen)  | ❌                  | ✅ (`actions.polls`; Empfänger benötigen iOS/macOS 26+ für die native Darstellung) |
| Gruppe umbenennen / Gruppensymbol festlegen         | ✅                  | ✅                                                                              |
| Teilnehmer hinzufügen / entfernen, Gruppe verlassen | ✅                 | ✅                                                                              |
| Lesebestätigungen und Tippanzeige                   | ✅                  | ✅ (abhängig von der Prüfung der privaten API)                                  |
| Zusammenführung von Direktnachrichten desselben Absenders | ✅            | ✅ (nur Direktnachrichten; Opt-in über `channels.imessage.coalesceSameSenderDms`) |
| Wiederherstellung eingehender Nachrichten nach einem Neustart | ✅         | ✅ (automatisch: `since_rowid`-Wiedergabe + GUID-Deduplizierung; lokal größeres Zeitfenster) |

iMessage stellt Nachrichten wieder her, die während des Gateway-Ausfalls verpasst wurden: Beim Start erfolgt die Wiedergabe ab der zuletzt zugestellten rowid über `since_rowid` von `imsg watch.subscribe`, die Deduplizierung anhand der GUID und die Unterdrückung der „Backlog-Bombe“ bei der Push-Leerung durch eine Altersgrenze für veraltete Rückstände. Dies erfolgt über die `imsg`-RPC-Verbindung und funktioniert daher auch bei Remote-SSH-Konfigurationen von `cliPath`; lokale Konfigurationen erhalten ein größeres Wiederherstellungszeitfenster, da sie `chat.db` lesen können. Siehe [Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways](/de/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Kopplung, Sitzungen und ACP-Bindungen

- **Zulassungslisten werden anhand des Handles übernommen.** `channels.imessage.allowFrom` erkennt dieselben Zeichenfolgen `+15555550123` / `user@example.com`, die BlueBubbles verwendet hat — kopieren Sie sie unverändert.
- **Genehmigungen im Kopplungsspeicher werden nicht übertragen.** Der Kopplungsspeicher ist kanalspezifisch, und der alte BlueBubbles-Speicher wird nicht migriert. Absender, die ausschließlich über die Kopplung genehmigt wurden, müssen sich unter iMessage erneut koppeln, oder Sie fügen deren Handles zu `allowFrom` hinzu.
- **Sitzungen** bleiben auf Agent + Chat beschränkt. Direktnachrichten werden beim standardmäßigen `session.dmScope=main` in der Hauptsitzung des Agenten zusammengeführt; Gruppensitzungen bleiben pro `chat_id` isoliert (`agent:<agentId>:imessage:group:<chat_id>`). Der alte Konversationsverlauf unter BlueBubbles-Sitzungsschlüsseln wird nicht in iMessage-Sitzungen übernommen.
- **ACP-Bindungen**, die auf `match.channel: "bluebubbles"` verweisen, müssen in `"imessage"` geändert werden. Die Formate von `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, reines Handle) sind identisch.

## Kein Kanal für ein Rollback

Es gibt keine unterstützte BlueBubbles-Laufzeit, zu der Sie zurückwechseln können. Wenn die iMessage-Überprüfung fehlschlägt, setzen Sie `channels.imessage.enabled: false`, starten Sie den Gateway neu, beheben Sie das `imsg`-Hindernis und versuchen Sie die Umstellung erneut.

Der Antwort-Cache befindet sich im SQLite-Zustand des Plugins. `openclaw doctor --fix` importiert und archiviert die alte Begleitdatei `imessage/reply-cache.jsonl`, sofern sie vorhanden ist.

## Verwandte Themen

- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — kurze Ankündigung und Zusammenfassung für Betreiber.
- [iMessage](/de/channels/imessage) — vollständige Referenz zum iMessage-Kanal einschließlich der Einrichtung mit `imsg launch` und der Funktionserkennung.
- `/channels/bluebubbles` — ältere URL, die zu diesem Migrationsleitfaden weiterleitet.
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf.
- [Kanalweiterleitung](/de/channels/channel-routing) — wie der Gateway einen Kanal für ausgehende Antworten auswählt.
