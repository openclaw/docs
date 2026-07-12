---
read_when:
    - Planung eines Wechsels von BlueBubbles zum mitgelieferten iMessage-Plugin
    - BlueBubbles-Konfigurationsschlüssel in iMessage-Entsprechungen übersetzen
    - Überprüfen von imsg vor dem Aktivieren des iMessage-Plugins
summary: 'Migrieren Sie alte BlueBubbles-Konfigurationen zum mitgelieferten iMessage-Plugin: Schlüsselzuordnung, Gruppen-Zulassungslisten und Überprüfung der Umstellung.'
title: Wechsel von BlueBubbles
x-i18n:
    generated_at: "2026-07-12T01:22:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Die Unterstützung für BlueBubbles wurde entfernt. OpenClaw unterstützt iMessage nur über das mitgelieferte `imessage`-Plugin, das [`steipete/imsg`](https://github.com/steipete/imsg) über JSON-RPC steuert und dieselbe private API-Oberfläche erreicht, die BlueBubbles hatte (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, native Umfragen, Gruppenverwaltung, Anhänge). Ein einziges CLI-Binärprogramm ersetzt den BlueBubbles-Server, die Client-App und die Webhook-Infrastruktur: kein REST-Endpunkt, keine Webhook-Authentifizierung.

Dieser Leitfaden beschreibt die Migration alter `channels.bluebubbles`-Konfigurationen zu `channels.imessage`. Es gibt keinen anderen unterstützten Migrationspfad. In der aktuellen OpenClaw-Version ist ein verbliebener `channels.bluebubbles`-Block wirkungslos – keine Laufzeitkomponente liest ihn.

<Note>
Die kurze Ankündigung und eine Zusammenfassung für Betreiber finden Sie unter [Entfernung von BlueBubbles und der imsg-Pfad für iMessage](/de/announcements/bluebubbles-imessage).
</Note>

## Migrationscheckliste

Der kürzeste sichere Weg, wenn Sie Ihre alte BlueBubbles-Konfiguration bereits kennen:

1. Überprüfen Sie `imsg` direkt auf dem Mac, auf dem Messages.app ausgeführt wird (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Kopieren Sie die Verhaltensschlüssel aus `channels.bluebubbles` nach `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` und `actions`.
3. Entfernen Sie nicht mehr vorhandene Transportschlüssel: `serverUrl`, `password`, Webhook-URLs und die Einrichtung des BlueBubbles-Servers.
4. Wenn der Gateway nicht auf dem Messages-Mac ausgeführt wird, legen Sie `channels.imessage.cliPath` auf ein SSH-Wrapper-Skript fest und konfigurieren Sie `remoteHost` für das Abrufen entfernter Anhänge.
5. Aktivieren Sie `channels.imessage`, starten Sie den Gateway neu und führen Sie anschließend `openclaw channels status --probe --channel imessage` aus.
6. Testen Sie eine Direktnachricht, eine zulässige Gruppe, Anhänge, sofern aktiviert, und jede private API-Aktion, die der Agent voraussichtlich verwenden wird.
7. Löschen Sie den BlueBubbles-Server und die alte `channels.bluebubbles`-Konfiguration, nachdem Sie den iMessage-Pfad überprüft haben.

## Funktionsweise von imsg

`imsg` ist eine lokale macOS-CLI für Messages. OpenClaw startet `imsg rpc` als untergeordneten Prozess und kommuniziert über stdin/stdout mittels JSON-RPC. Es gibt keinen HTTP-Server, keine Webhook-URL, keinen Hintergrund-Daemon, keinen Launch Agent und keinen offenzulegenden Port.

- Lesevorgänge erfolgen über `~/Library/Messages/chat.db` mithilfe eines schreibgeschützten SQLite-Handles.
- Eingehende Live-Nachrichten stammen aus `imsg watch` / `watch.subscribe`, das Dateisystemereignissen von `chat.db` folgt und ersatzweise regelmäßige Abfragen verwendet.
- Für den normalen Versand von Texten und Dateien wird die Automatisierung von Messages.app verwendet.
- Erweiterte Aktionen verwenden `imsg launch`, um die `imsg`-Hilfskomponente in Messages.app einzuschleusen. Dadurch werden Lesebestätigungen, Tippindikatoren, formatierte Nachrichten, Bearbeiten, Zurückziehen, Antworten in Threads, Tapbacks, Umfragen und Gruppenverwaltung ermöglicht.
- Linux-Builds können eine kopierte `chat.db` untersuchen, aber keine Nachrichten senden, die Live-Datenbank des Macs überwachen oder Messages.app steuern. Führen Sie `imsg` für OpenClaw iMessage auf dem angemeldeten Mac oder über ein SSH-Wrapper-Skript zu diesem Mac aus.

## Vorbereitungen

1. Installieren Sie `imsg` auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Bei der üblichen lokalen Einrichtung kann die OpenClaw-Einrichtung eine vom Benutzer bestätigte Homebrew-Installation oder Aktualisierung von `imsg` auf dem bei Messages angemeldeten Mac anbieten. Manuelle Einrichtungen und Topologien mit SSH-Wrapper-Skripten verbleiben in der Verantwortung des Betreibers: Wiederholen Sie die Homebrew-Aktualisierung im selben lokalen oder entfernten Benutzerkontext, in dem `imsg` ausgeführt wird. Wenn `imsg chats` mit `unable to open database file`, leerer Ausgabe oder `authorization denied` fehlschlägt, gewähren Sie dem Terminal, Editor, Node-Prozess, Gateway-Dienst oder übergeordneten SSH-Prozess, der `imsg` startet, vollständigen Festplattenzugriff und öffnen Sie anschließend diesen übergeordneten Prozess erneut.

2. Überprüfen Sie vor dem Ändern der OpenClaw-Konfiguration die Oberflächen zum Lesen, Überwachen, Senden und für RPC:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ersetzen Sie `42` durch eine echte Chat-ID aus `imsg chats`. Zum Senden ist die Automatisierungsberechtigung für Messages.app erforderlich. Wenn OpenClaw über SSH ausgeführt wird, führen Sie diese Befehle über dasselbe SSH-Wrapper-Skript oder in demselben Benutzerkontext aus, den OpenClaw verwenden wird. Wenn Lesevorgänge funktionieren, Sendevorgänge jedoch mit AppleEvents `-1743` fehlschlagen, prüfen Sie, ob die Automatisierungsberechtigung `/usr/libexec/sshd-keygen-wrapper` zugewiesen wurde; siehe [Sendevorgänge über SSH-Wrapper-Skripte schlagen mit AppleEvents -1743 fehl](/de/channels/imessage#requirements-and-permissions-macos).

3. Aktivieren Sie die Brücke zur privaten API. Dies wird für OpenClaw iMessage dringend empfohlen, da Antworten, Tapbacks, Effekte, Umfragen, Antworten auf Anhänge und Gruppenaktionen davon abhängen:

   ```bash
   imsg launch
   imsg status --json
   ```

   Für `imsg launch` muss SIP deaktiviert sein (und unter modernen macOS-Versionen muss die Bibliotheksvalidierung gelockert werden – siehe [Aktivieren der privaten API von imsg](/de/channels/imessage#enabling-the-imsg-private-api)). Grundlegendes Senden, der Verlauf und die Überwachung funktionieren ohne `imsg launch`; die vollständige iMessage-Aktionsoberfläche von OpenClaw jedoch nicht.

4. Nachdem Sie `channels.imessage` aktiviert und den Gateway gestartet haben, überprüfen Sie die Brücke über OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Das iMessage-Konto sollte `works` melden; mit `--json` enthält die Prüfungsnutzlast `privateApi.available: true`. Wenn `false` gemeldet wird, beheben Sie zuerst dieses Problem – siehe [Funktionserkennung](/de/channels/imessage#private-api-actions). Für die Prüfung muss ein erreichbarer Gateway vorhanden sein (andernfalls gibt die CLI ersatzweise nur Konfigurationsinformationen aus), und es werden ausschließlich konfigurierte, aktivierte Konten geprüft.

5. Erstellen Sie eine Sicherungskopie Ihrer Konfiguration:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Konfigurationsübertragung

iMessage und BlueBubbles verwenden größtenteils dieselben Verhaltensschlüssel auf Kanalebene. Unterschiede bestehen beim Transport (REST-Server gegenüber lokaler CLI) und beim Schlüsselformat des Gruppenregisters.

| BlueBubbles                                                | gebündeltes iMessage                       | Hinweise                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Gleiche Semantik (standardmäßig `true`, sobald der Block vorhanden ist).                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _(entfernt)_                              | Kein REST-Server – das Plugin startet `imsg rpc` über stdio.                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(entfernt)_                              | Keine Webhook-Authentifizierung erforderlich.                                                                                                                                                                                                                                                                         |
| _(implizit)_                                               | `channels.imessage.cliPath`               | Pfad zu `imsg` (Standardwert `imsg`); verwenden Sie für SSH ein Wrapper-Skript.                                                                                                                                                                                                                                       |
| _(implizit)_                                               | `channels.imessage.dbPath`                | Optionale Überschreibung für `chat.db` von Messages.app; wird bei Auslassung automatisch erkannt.                                                                                                                                                                                                                     |
| _(implizit)_                                               | `channels.imessage.remoteHost`            | `host` oder `user@host` – nur erforderlich, wenn `cliPath` ein SSH-Wrapper ist und Sie Anhänge per SCP abrufen möchten.                                                                                                                                                                                               |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Gleiche Werte (`pairing` / `allowlist` / `open` / `disabled`); Standardwert `pairing`.                                                                                                                                                                                                                                |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Gleiche Handle-Formate (`+15555550123`, `user@example.com`). Genehmigungen aus dem Kopplungsspeicher werden nicht übertragen – siehe unten.                                                                                                                                                                           |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Gleiche Werte (`allowlist` / `open` / `disabled`); Standardwert `allowlist`.                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Identisch. Wenn nicht festgelegt, greift iMessage auf `allowFrom` zurück; ein explizit leeres `groupAllowFrom: []` blockiert unter `groupPolicy: "allowlist"` alle Gruppen.                                                                                                                                             |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Kopieren Sie den Platzhaltereintrag `"*"` unverändert; ändern Sie die Schlüssel gruppenspezifischer Einträge auf die numerische iMessage-`chat_id` – siehe „Fallstrick bei der Gruppenregistrierung“. `requireMention`, `tools`, `toolsBySender` und `systemPrompt` werden übernommen.                                    |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Standardwert `true`. Mit dem gebündelten Plugin wird dies nur ausgelöst, wenn die Prüfung der privaten API erfolgreich ist.                                                                                                                                                                                            |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Gleiche Struktur, ebenfalls standardmäßig deaktiviert. Wenn Anhänge über BlueBubbles übertragen wurden, legen Sie dies explizit fest – eingehende Fotos und Medien werden andernfalls stillschweigend verworfen (keine Protokollzeile `Inbound message`).                                                               |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Lokale Stammverzeichnisse; gleiche Platzhalterregeln.                                                                                                                                                                                                                                                                 |
| _(nicht zutreffend)_                                       | `channels.imessage.remoteAttachmentRoots` | Wird nur verwendet, wenn `remoteHost` für SCP-Abrufe festgelegt ist.                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Standardwert bei iMessage: 16 MB (bei BlueBubbles waren es standardmäßig 8 MB). Legen Sie den Wert explizit fest, um die niedrigere Obergrenze beizubehalten.                                                                                                                                                          |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Standardwert bei beiden: 4000.                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Gleiche optionale Aktivierung. Nur für Direktnachrichten – Gruppen verarbeiten jede Nachricht einzeln. Erhöht die standardmäßige Entprellzeit für eingehende Nachrichten auf 7000 ms, sofern weder `messages.inbound.byChannel.imessage` noch ein globales `messages.inbound.debounceMs` festgelegt ist. Siehe [Zusammenführen aufgeteilter Direktnachrichten](/de/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(nicht zutreffend)_                      | `imsg` stellt bereits die Anzeigenamen der Absender aus `chat.db` bereit.                                                                                                                                                                                                                                             |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Gleiche aktionsspezifische Schalter (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) sowie neu `polls`. Alle sind standardmäßig aktiviert; Aktionen der privaten API erfordern weiterhin die Bridge.       |

Konfigurationen mit mehreren Konten (`channels.bluebubbles.accounts.*`) werden eins zu eins in `channels.imessage.accounts.*` übertragen.

## Fallstrick bei der Gruppenregistrierung

Das gebündelte iMessage-Plugin führt zwei Gruppenprüfungen direkt nacheinander aus. Eine Gruppennachricht muss beide bestehen, um den Agenten zu erreichen:

1. **Positivliste für Absender/Chat-Ziel** (`channels.imessage.groupAllowFrom`) – gleicht das Absender-Handle oder das Chat-Ziel ab (Einträge mit `chat_id:`, `chat_guid:`, `chat_identifier:`). Wenn `groupAllowFrom` nicht festgelegt ist, greift diese Prüfung auf `allowFrom` zurück; ein explizites `groupAllowFrom: []` deaktiviert diesen Rückgriff und verwirft unter `groupPolicy: "allowlist"` jede Gruppennachricht.
2. **Gruppenregistrierung** (`channels.imessage.groups`) – verwendet die numerische iMessage-`chat_id` als Schlüssel:
   - Kein `groups`-Block (oder ein leerer Block): Gruppen bestehen diese Prüfung, solange die effektive Absender-Positivliste für Gruppen nicht leer ist; die Absenderfilterung steuert den Zugriff, und beim Start wird keine Warnung ausgegeben, dass alle Nachrichten verworfen werden.
   - `groups` mit Einträgen, aber ohne `"*"`: Nur die aufgeführten `chat_id`-Schlüssel werden zugelassen. Sobald eine Gruppe aufgeführt wird, fungiert die Registrierung selbst unter `groupPolicy: "open"` als Positivliste.
   - `groups: { "*": { ... } }`: Jede Gruppe besteht diese Prüfung.

Der Fallstrick bei der Migration: BlueBubbles verwendete die Chat-GUID bzw. den Chat-Bezeichner als Schlüssel für `groups`-Einträge, während die iMessage-Registrierung die numerische `chat_id` verwendet. Unverändert kopierte gruppenspezifische Einträge erzeugen eine nicht leere Registrierung, deren Schlüssel nie übereinstimmen, sodass jede Gruppennachricht bei Prüfung 2 verworfen wird. Kopieren Sie den Platzhaltereintrag `"*"` unverändert; ändern Sie die Schlüssel bestimmter Gruppeneinträge auf die von `imsg chats` ausgegebenen `chat_id`-Werte.

Beide Verwerfungspfade sind auf der standardmäßigen Protokollebene anhand von `warn`-Zeilen sichtbar:

- Einmal pro Konto beim Start, wenn `groupPolicy: "allowlist"` festgelegt und die effektive Absender-Positivliste für Gruppen leer ist: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Legen Sie `groupAllowFrom` (oder `allowFrom`) fest, um Absender zuzulassen; das alleinige Hinzufügen von `groups` erfüllt die Absenderprüfung nicht.
- Einmal pro `chat_id` zur Laufzeit, wenn die Registrierung eine Gruppe verwirft: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`; dabei wird der genau hinzuzufügende Schlüssel genannt.

Direktnachrichten funktionieren in beiden Fällen weiterhin – sie durchlaufen einen anderen Codepfad, daher belegt eine erfolgreiche Direktnachricht nicht, dass das Gruppenrouting funktioniert.

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

Damit werden die konfigurierten Absender in jeder Gruppe zugelassen. Fügen Sie `groups`-Einträge hinzu, um die zulässigen Chats einzuschränken oder chatspezifische Optionen wie `requireMention` festzulegen; kopieren Sie den BlueBubbles-Eintrag `"*"` unverändert, ändern Sie jedoch die Schlüssel bestimmter Einträge auf numerische iMessage-`chat_id`-Werte.

## Schritt für Schritt

1. Migrieren Sie die Konfiguration. Lassen Sie den neuen Block während der Bearbeitung deaktiviert; der alte Block `channels.bluebubbles` wird von der aktuellen OpenClaw-Version ignoriert und kann als Referenz daneben bestehen bleiben:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // auf true setzen, wenn Sie für die Umstellung bereit sind
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // aus bluebubbles.allowFrom kopieren
         groupPolicy: "allowlist",
         groupAllowFrom: [], // aus bluebubbles.groupAllowFrom kopieren
         groups: { "*": { requireMention: true } }, // Platzhalter unverändert kopieren; chatspezifische Einträge nach chat_id neu verschlüsseln
         // Aktionen sind standardmäßig aktiviert; einzelne Schalter zum Deaktivieren auf false setzen
       },
     },
   }
   ```

2. **Stellen Sie um und führen Sie eine Prüfung durch.** Setzen Sie `channels.imessage.enabled: true`, starten Sie den Gateway neu und vergewissern Sie sich, dass der Kanal als fehlerfrei gemeldet wird:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # „works“ erwartet; --json zeigt privateApi.available: true
   ```

   Die Prüfung erfordert einen erreichbaren Gateway und prüft nur konfigurierte, aktivierte Konten. Verwenden Sie die direkten `imsg`-Befehle unter [Bevor Sie beginnen](#before-you-start), um den Mac selbst zu überprüfen.

3. **Überprüfen Sie Direktnachrichten.** Senden Sie dem Agenten eine Direktnachricht und vergewissern Sie sich, dass die Antwort ankommt.

4. **Überprüfen Sie Gruppen separat.** Direktnachrichten und Gruppen verwenden unterschiedliche Codepfade — der Erfolg bei Direktnachrichten belegt nicht, dass das Routing für Gruppen funktioniert. Senden Sie eine Nachricht in einem zulässigen Gruppenchat und vergewissern Sie sich, dass die Antwort ankommt. Falls die Gruppe stumm bleibt (keine Antwort des Agenten, kein Fehler), suchen Sie im Gateway-Protokoll nach den beiden oben unter „Fehlerquelle bei der Gruppenregistrierung“ beschriebenen `warn`-Zeilen. Die Startwarnung bedeutet, dass die effektive Absender-Zulassungsliste leer ist; eine Warnung für eine bestimmte `chat_id` bedeutet, dass eine befüllte `groups`-Registrierung diesen Chat nicht enthält.

5. **Überprüfen Sie die verfügbaren Aktionen.** Bitten Sie den Agenten aus einer gekoppelten Direktnachricht heraus, eine Reaktion hinzuzufügen, eine Nachricht zu bearbeiten, zurückzuziehen oder zu beantworten und ein Foto zu senden sowie in einer Gruppe die Gruppe umzubenennen oder einen Teilnehmer hinzuzufügen beziehungsweise zu entfernen. Jede Aktion sollte nativ in Messages.app ausgeführt werden. Falls eine Aktion den Fehler `iMessage <action> requires the imsg private API bridge` auslöst, führen Sie `imsg launch` erneut aus und aktualisieren Sie den Status mit `openclaw channels status --probe`.

6. **Entfernen Sie den BlueBubbles-Server und den Block `channels.bluebubbles`**, sobald iMessage-Direktnachrichten, -Gruppen und -Aktionen überprüft wurden. OpenClaw liest `channels.bluebubbles` nicht.

## Aktionsparität im Überblick

| Aktion                                              | bisheriges BlueBubbles | integriertes iMessage                                                           |
| --------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| Text senden / SMS-Ausweichlösung                    | ✅                     | ✅                                                                              |
| Medien senden (Foto, Video, Datei, Sprachnachricht) | ✅                     | ✅                                                                              |
| Antwort im Thread (`reply_to_guid`)                 | ✅                     | ✅ (schließt [#51892](https://github.com/openclaw/openclaw/issues/51892))        |
| Tapback (`react`)                                   | ✅                     | ✅                                                                              |
| Bearbeiten / zurückziehen (Empfänger ab macOS 13)   | ✅                     | ✅                                                                              |
| Mit Bildschirmeffekt senden                         | ✅                     | ✅ (schließt einen Teil von [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Rich Text: fett / kursiv / unterstrichen / durchgestrichen | ✅              | ✅ (Formatierung typisierter Textläufe über attributedBody)                     |
| Native Messages-Umfragen (erstellen und abstimmen)  | ❌                     | ✅ (`actions.polls`; Empfänger benötigen iOS/macOS 26+ für die native Darstellung) |
| Gruppe umbenennen / Gruppensymbol festlegen         | ✅                     | ✅                                                                              |
| Teilnehmer hinzufügen/entfernen, Gruppe verlassen   | ✅                     | ✅                                                                              |
| Lesebestätigungen und Tippanzeige                   | ✅                     | ✅ (abhängig von erfolgreicher Prüfung der privaten API)                        |
| Zusammenführung von Direktnachrichten desselben Absenders | ✅              | ✅ (nur Direktnachrichten; optional über `channels.imessage.coalesceSameSenderDms`) |
| Wiederherstellung eingehender Nachrichten nach einem Neustart | ✅            | ✅ (automatisch: Wiedergabe ab `since_rowid` + GUID-Deduplizierung; lokal mit größerem Zeitfenster) |

iMessage stellt Nachrichten wieder her, die während eines Gateway-Ausfalls verpasst wurden: Beim Start erfolgt über `imsg watch.subscribe` und `since_rowid` eine Wiedergabe ab der zuletzt zugestellten Zeilen-ID, eine Deduplizierung anhand der GUID und eine Altersgrenze für veraltete Rückstände unterdrückt die „Rückstandsbombe“ beim Push-Leeren. Dies läuft über die `imsg`-RPC-Verbindung und funktioniert daher auch bei entfernten SSH-Setups mit `cliPath`; lokale Setups erhalten ein größeres Wiederherstellungszeitfenster, da sie `chat.db` lesen können. Siehe [Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways](/de/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Kopplung, Sitzungen und ACP-Bindungen

- **Zulassungslisten werden anhand des Handles übernommen.** `channels.imessage.allowFrom` erkennt dieselben Zeichenfolgen wie `+15555550123` / `user@example.com`, die BlueBubbles verwendet hat — kopieren Sie sie unverändert.
- **Genehmigungen aus dem Kopplungsspeicher werden nicht übertragen.** Der Kopplungsspeicher ist kanalspezifisch und der alte BlueBubbles-Speicher wird nicht migriert. Absender, die ausschließlich durch Kopplung genehmigt wurden, müssen sich unter iMessage erneut koppeln, oder Sie fügen ihre Handles zu `allowFrom` hinzu.
- **Sitzungen** bleiben auf Agent und Chat beschränkt. Direktnachrichten werden mit der Standardeinstellung `session.dmScope=main` in der Hauptsitzung des Agenten zusammengeführt; Gruppensitzungen bleiben je `chat_id` isoliert (`agent:<agentId>:imessage:group:<chat_id>`). Der alte Gesprächsverlauf unter BlueBubbles-Sitzungsschlüsseln wird nicht in iMessage-Sitzungen übernommen.
- **ACP-Bindungen**, die auf `match.channel: "bluebubbles"` verweisen, müssen in `"imessage"` geändert werden. Die Formate von `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, reines Handle) sind identisch.

## Kein Kanal für ein Rollback

Es gibt keine unterstützte BlueBubbles-Laufzeit, zu der Sie zurückwechseln können. Falls die iMessage-Überprüfung fehlschlägt, setzen Sie `channels.imessage.enabled: false`, starten Sie den Gateway neu, beheben Sie die `imsg`-Blockade und versuchen Sie die Umstellung erneut.

Der Antwort-Cache befindet sich im SQLite-Zustand des Plugins. `openclaw doctor --fix` importiert und archiviert die alte Begleitdatei `imessage/reply-cache.jsonl`, sofern sie vorhanden ist.

## Verwandte Themen

- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — kurze Ankündigung und Zusammenfassung für Betreiber.
- [iMessage](/de/channels/imessage) — vollständige Referenz zum iMessage-Kanal einschließlich der Einrichtung mit `imsg launch` und der Funktionserkennung.
- `/channels/bluebubbles` — bisherige URL, die auf diesen Migrationsleitfaden weiterleitet.
- [Kopplung](/de/channels/pairing) — Authentifizierung von Direktnachrichten und Kopplungsablauf.
- [Kanal-Routing](/de/channels/channel-routing) — wie der Gateway einen Kanal für ausgehende Antworten auswählt.
