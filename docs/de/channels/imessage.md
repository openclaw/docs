---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlerbehebung beim Senden und Empfangen mit iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio) mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Umfragen, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Setups, sofern die Hostanforderungen erfüllt sind.
title: iMessage
x-i18n:
    generated_at: "2026-07-12T15:00:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 81819aad1a9199791c3c02eb0c9cc72059c663710140b33ba31f79b4bc59d8e2
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Für die übliche OpenClaw-iMessage-Bereitstellung führen Sie den Gateway und `imsg` auf demselben macOS-Host aus, auf dem Messages angemeldet ist. Wenn Ihr Gateway an einem anderen Ort ausgeführt wird, verweisen Sie `channels.imessage.cliPath` auf einen transparenten SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Die Wiederherstellung eingehender Nachrichten erfolgt automatisch.** Nach einem Neustart der Bridge oder des Gateways spielt iMessage die während des Ausfalls verpassten Nachrichten erneut ein, unterdrückt die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann, und dedupliziert die Nachrichten, sodass nichts zweimal weitergeleitet wird. Es muss keine Konfiguration aktiviert werden – siehe [Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Die Unterstützung für BlueBubbles wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage ausschließlich über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der iMessage-Anbindung über imsg](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder mit [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native externe CLI-Integration. Der Gateway startet `imsg rpc` und kommuniziert über stdio mittels JSON-RPC – ohne separaten Daemon oder Port. Für einen vollständigen iMessage-Kanal wird der Modus „Private API“ dringend empfohlen; Antworten, Tapbacks, Effekte, Umfragen, Antworten auf Anhänge und Gruppenaktionen erfordern `imsg launch` und eine erfolgreiche Prüfung der Private API.

Bei der üblichen lokalen Einrichtung kann die OpenClaw-Einrichtung eine vom Benutzer bestätigte Installation oder Aktualisierung von `imsg` über Homebrew auf dem bei Messages angemeldeten Mac anbieten. Die manuelle Einrichtung und Topologien mit SSH-Wrapper werden weiterhin vom Betreiber verwaltet: Installieren oder aktualisieren Sie `imsg` im selben Benutzerkontext, in dem der Gateway oder Wrapper ausgeführt wird.

<CardGroup cols={3}>
  <Card title="Aktionen der Private API" icon="wand-sparkles" href="#private-api-actions">
    Antworten, Tapbacks, Effekte, Umfragen, Anhänge und Gruppenverwaltung.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-Direktnachrichten verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Entfernter Mac" icon="terminal" href="#remote-mac-over-ssh">
    Verwenden Sie einen SSH-Wrapper, wenn der Gateway nicht auf dem Messages-Mac ausgeführt wird.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige Referenz der iMessage-Felder.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Weg)">
    <Steps>
      <Step title="imsg installieren und überprüfen">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Wenn der lokale Einrichtungsassistent feststellt, dass der standardmäßige Befehl `imsg` fehlt, kann er zur Installation von `steipete/tap/imsg` über Homebrew auffordern. Wenn er ein von Homebrew verwaltetes `imsg` erkennt, kann er zur Neuinstallation oder Aktualisierung auffordern. Benutzerdefinierte `cliPath`-Wrapper werden nicht geändert.

      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>

      <Step title="Erste Kopplung einer Direktnachricht genehmigen (standardmäßige dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Entfernter Mac über SSH">
    Die meisten Einrichtungen benötigen kein SSH. Verwenden Sie diese Topologie nur, wenn der Gateway nicht auf dem bei Messages angemeldeten Mac ausgeführt werden kann. OpenClaw benötigt lediglich einen stdio-kompatiblen `cliPath`, sodass Sie `cliPath` auf ein Wrapper-Skript verweisen lassen können, das per SSH eine Verbindung zu einem entfernten Mac herstellt und dort `imsg` ausführt.
    Installieren und aktualisieren Sie `imsg` auf diesem entfernten Mac, nicht auf dem Gateway-Host:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Empfohlene Konfiguration bei aktivierten Anhängen:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // wird für den Abruf von Anhängen per SCP verwendet
      includeAttachments: true,
      // Optional: zusätzliche zulässige Stammverzeichnisse für Anhänge (werden mit dem
      // Standardpfad /Users/*/Library/Messages/Attachments zusammengeführt).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht festgelegt ist, versucht OpenClaw, den Wert durch Analyse des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` entsprechen (keine Leerzeichen oder SSH-Optionen); unsichere Werte werden ignoriert.
    OpenClaw verwendet für SCP eine strikte Hostschlüsselprüfung, daher muss der Hostschlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden anhand der zulässigen Stammverzeichnisse (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

<Warning>
Jeder `cliPath`-Wrapper oder SSH-Proxy, den Sie `imsg` vorschalten, MUSS sich für langlebiges JSON-RPC wie eine transparente stdio-Pipe verhalten. OpenClaw tauscht über stdin/stdout des Wrappers während der gesamten Lebensdauer des Kanals kleine, durch Zeilenumbrüche eingerahmte JSON-RPC-Nachrichten aus:

- Leiten Sie jeden stdin-Datenblock bzw. jede stdin-Zeile **sofort weiter, sobald Bytes verfügbar sind** – warten Sie nicht auf EOF.
- Leiten Sie jeden stdout-Datenblock bzw. jede stdout-Zeile unverzüglich in die Gegenrichtung weiter.
- Behalten Sie Zeilenumbrüche bei.
- Vermeiden Sie blockierende Lesevorgänge fester Größe (`read(4096)`, `cat | buffer`, standardmäßiges Shell-`read`), durch die kleine Frames ausgehungert werden können.
- Halten Sie stderr vom JSON-RPC-stdout-Datenstrom getrennt.

Ein Wrapper, der stdin puffert, bis ein großer Block gefüllt ist, erzeugt Symptome, die wie ein iMessage-Ausfall wirken – `imsg rpc timeout (chats.list)` oder wiederholte Kanalneustarts –, obwohl `imsg rpc` selbst ordnungsgemäß funktioniert. `ssh -T host imsg "$@"` (oben) ist sicher, weil damit die `cliPath`-Argumente von OpenClaw wie `rpc` und `--db` weitergeleitet werden. Pipelines wie `ssh host imsg | grep -v '^DEBUG'` sind es NICHT – zeilengepufferte Werkzeuge können Frames dennoch zurückhalten; verwenden Sie bei jeder Stufe `stdbuf -oL -eL`, wenn Sie filtern müssen.
</Warning>

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Für den Prozesskontext, in dem OpenClaw/`imsg` ausgeführt wird, ist vollständiger Festplattenzugriff erforderlich (Zugriff auf die Messages-Datenbank).
- Zum Senden von Nachrichten über Messages.app ist eine Automatisierungsberechtigung erforderlich.
- Für erweiterte Aktionen (Reagieren / Bearbeiten / Zurückziehen / Antwort in einem Thread / Effekte / Umfragen / Gruppenoperationen) muss der Systemintegritätsschutz deaktiviert sein – siehe [Private API von imsg aktivieren](#enabling-the-imsg-private-api). Das grundlegende Senden und Empfangen von Texten und Medien funktioniert auch ohne diese Änderung.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn der Gateway ohne Benutzeroberfläche ausgeführt wird (LaunchAgent/SSH), führen Sie einmalig einen interaktiven Befehl im selben Kontext aus, um die Abfragen auszulösen:

```bash
imsg chats --limit 1
# oder
imsg send <handle> "test"
```

</Tip>

<Accordion title="Senden über SSH-Wrapper schlägt mit AppleEvents -1743 fehl">
  Eine Einrichtung über Remote-SSH kann Chats lesen, `channels status --probe` bestehen und eingehende Nachrichten verarbeiten, während das Senden ausgehender Nachrichten weiterhin mit einem AppleEvents-Autorisierungsfehler fehlschlägt:

```text
Nicht zum Senden von Apple-Ereignissen an Messages autorisiert. (-1743)
```

Prüfen Sie die TCC-Datenbank des angemeldeten Mac-Benutzers oder System Settings > Privacy & Security > Automation. Wenn der Automation-Eintrag für `/usr/libexec/sshd-keygen-wrapper` statt für `imsg` oder den lokalen Shell-Prozess gespeichert ist, stellt macOS möglicherweise keinen verwendbaren Messages-Schalter für diesen serverseitigen SSH-Client bereit:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In diesem Zustand können wiederholtes Ausführen von `tccutil reset AppleEvents` oder erneutes Ausführen von `imsg send` über denselben SSH-Wrapper weiterhin fehlschlagen, da der Prozesskontext, der die Messages-Automatisierung benötigt, der SSH-Wrapper ist und nicht eine App, der die Benutzeroberfläche die Berechtigung erteilen kann.

Verwenden Sie stattdessen einen der unterstützten `imsg`-Prozesskontexte:

- Führen Sie den Gateway oder zumindest die `imsg`-Bridge in der lokalen Sitzung des bei Messages angemeldeten Benutzers aus.
- Starten Sie den Gateway mit einem LaunchAgent für diesen Benutzer, nachdem Sie in derselben Sitzung vollständigen Festplattenzugriff und die Automatisierungsberechtigung erteilt haben.
- Wenn Sie die SSH-Topologie mit zwei Benutzern beibehalten, überprüfen Sie vor dem Aktivieren des Kanals, dass ein echter ausgehender Aufruf von `imsg send` über exakt diesen Wrapper erfolgreich ist. Wenn ihm die Automatisierungsberechtigung nicht erteilt werden kann, konfigurieren Sie stattdessen eine `imsg`-Einrichtung mit einem einzelnen Benutzer, anstatt sich beim Senden auf den SSH-Wrapper zu verlassen.

</Accordion>

## Private API von imsg aktivieren

`imsg` wird mit zwei Betriebsmodi ausgeliefert. Für OpenClaw wird der Modus „Private API“ empfohlen, da er dem Kanal die nativen iMessage-Aktionen bereitstellt, die Benutzer erwarten. Der Basismodus bleibt für risikoarme Installationen, die anfängliche Überprüfung oder Hosts nützlich, auf denen SIP nicht deaktiviert werden kann.

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehende Texte und Medien über `send`, Überwachung/Verlauf eingehender Nachrichten, Chatliste. Dies ist der standardmäßig verfügbare Funktionsumfang nach einem neuen `brew install steipete/tap/imsg` und der Erteilung der oben aufgeführten standardmäßigen macOS-Berechtigungen.
- **Modus „Private API“**: `imsg` injiziert eine Hilfs-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (in Threads), `sendWithEffect`, `poll` und `poll-vote` (native Messages-Umfragen), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant` und `leaveGroup` sowie Tippanzeigen und Lesebestätigungen freigeschaltet.

Der auf dieser Seite empfohlene Aktionsumfang erfordert den Modus „Private API“. Die `imsg`-README nennt die Voraussetzung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, von der Bridge unterstütztes Senden umfangreicher Inhalte, Nachrichtenänderungen und Chatverwaltung sind optional. Sie erfordern, dass SIP deaktiviert und eine Hilfs-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Technik zur Injektion des Hilfsmoduls verwendet die eigene dylib von `imsg`, um auf die privaten APIs von Messages zuzugreifen. Im iMessage-Pfad von OpenClaw gibt es keinen Drittanbieterserver und keine BlueBubbles-Laufzeit.

<Warning>
**Das Deaktivieren von SIP ist ein echter Sicherheitskompromiss.** SIP ist einer der zentralen Schutzmechanismen von macOS gegen die Ausführung veränderten Systemcodes; eine systemweite Deaktivierung eröffnet zusätzliche Angriffsflächen und Nebenwirkungen. Insbesondere gilt: **Das Deaktivieren von SIP auf Macs mit Apple Silicon deaktiviert außerdem die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste betriebliche Entscheidung, insbesondere auf einem primären persönlichen Mac. Für eine produktionsreife OpenClaw-iMessage-Installation empfiehlt sich ein dedizierter Mac oder ein macOS-Bot-Benutzer, bei dem Sie die Bridge bedenkenlos aktivieren können. Wenn Ihr Bedrohungsmodell nicht zulässt, dass SIP irgendwo deaktiviert ist, ist das integrierte iMessage auf den Basismodus beschränkt – ausschließlich Senden und Empfangen von Texten und Medien, keine Reaktionen / Bearbeitung / Zurückziehen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und die `selectors` jeder Methode, sodass Sie vor dem Start sehen können, was der aktuelle Build unterstützt.

2. **Deaktivieren Sie den Systemintegritätsschutz und (unter modernen macOS-Versionen) die Bibliotheksvalidierung.** Das Injizieren einer nicht von Apple stammenden Hilfs-dylib in die von Apple signierte `Messages.app` erfordert, dass SIP deaktiviert **und** die Bibliotheksvalidierung gelockert ist. Der SIP-Schritt im Wiederherstellungsmodus hängt von der macOS-Version ab:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Deaktivieren Sie die Bibliotheksvalidierung über Terminal, starten Sie im Wiederherstellungsmodus neu, führen Sie `csrutil disable` aus und starten Sie erneut.
   - **macOS 11+ (Big Sur und neuer), Intel:** Starten Sie im Wiederherstellungsmodus (oder über die Internetwiederherstellung), führen Sie `csrutil disable` aus und starten Sie neu.
   - **macOS 11+, Apple Silicon:** Verwenden Sie die Startsequenz über den Ein-/Ausschalter, um die Wiederherstellung aufzurufen; halten Sie bei aktuellen macOS-Versionen die Taste **Left Shift** gedrückt, wenn Sie auf Continue klicken, und führen Sie anschließend `csrutil disable` aus. Für virtuelle Maschinen gilt ein separater Ablauf; erstellen Sie daher zuerst einen VM-Snapshot.

   **Unter macOS 11 und neuer reicht `csrutil disable` allein normalerweise nicht aus.** Apple erzwingt weiterhin die Bibliotheksvalidierung für `Messages.app` als Plattformbinärdatei, sodass ein ad hoc signierter Helper selbst bei deaktiviertem SIP abgelehnt wird (`Library Validation failed: ... platform binary, but mapped file is not`). Deaktivieren Sie nach dem Deaktivieren von SIP zusätzlich die Bibliotheksvalidierung und starten Sie das System neu:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verifiziert unter 26.5.1:** Deaktiviertes SIP **zusammen mit** dem obigen Befehl `DisableLibraryValidation` reicht aus, um den Helper unter 26.0 bis einschließlich 26.5.x zu injizieren. **Es sind keine Boot-Argumente erforderlich.** Die plist-Datei ist der entscheidende Faktor und der am häufigsten fehlende Schritt, wenn die Injektion unter Tahoe fehlschlägt:
   - **Mit der plist-Datei:** `imsg launch` injiziert den Helper und `imsg status` meldet `advanced_features: true`.
   - **Ohne die plist-Datei (selbst bei deaktiviertem SIP):** `imsg launch` schlägt mit `Failed to launch: Timeout waiting for Messages.app to initialize` fehl. AMFI lehnt den ad hoc signierten Helper beim Laden ab, sodass die Bridge nie bereit wird und der Start wegen einer Zeitüberschreitung abbricht. Diese Zeitüberschreitung ist das Symptom, auf das die meisten Personen unter Tahoe stoßen; die Lösung ist die obige plist-Datei und keine drastischere Maßnahme.

   Wenn die Injektion mit `imsg launch` oder bestimmte `selectors` nach einem macOS-Upgrade den Wert „false“ zurückgeben, ist diese Sperre üblicherweise die Ursache. Prüfen Sie den Status von SIP und der Bibliotheksvalidierung, bevor Sie davon ausgehen, dass der SIP-Schritt selbst fehlgeschlagen ist. Wenn diese Einstellungen korrekt sind und die Bridge weiterhin nicht injiziert werden kann, erfassen Sie `imsg status --json` zusammen mit der Ausgabe von `imsg launch` und melden Sie dies dem Projekt `imsg`, anstatt weitere systemweite Sicherheitskontrollen abzuschwächen.

3. **Injizieren Sie den Helper.** Bei deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, solange SIP aktiviert ist, und dient damit zugleich als Bestätigung, dass Schritt 2 wirksam war.

4. **Überprüfen Sie die Bridge über OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '{rpc_methods, selectors}'` sollte die von Ihrem macOS-Build bereitgestellten Fähigkeiten anzeigen. Das Erstellen von Umfragen erfordert `selectors.pollPayloadMessage`; für Abstimmungen sind sowohl `selectors.pollVoteMessage` als auch die RPC-Methode `poll.vote` erforderlich. Das OpenClaw-Plugin bietet nur Aktionen an, die von der zwischengespeicherten Prüfung unterstützt werden, während bei einem leeren Cache zunächst optimistisch vorgegangen und beim ersten Dispatch geprüft wird.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen aber beim Dispatch den Fehler „iMessage `<action>` requires the imsg private API bridge“ auslösen, führen Sie `imsg launch` erneut aus – der Helper kann ausfallen (Neustart von Messages.app, Betriebssystemupdate usw.), und der zwischengespeicherte Status `available: true` bietet die Aktionen weiterhin an, bis er durch die nächste Prüfung aktualisiert wird.

### Wenn SIP aktiviert bleibt

Wenn das Deaktivieren von SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` wechselt in den Basismodus zurück – nur Text, Medien und Empfang.
- Das OpenClaw-Plugin bietet weiterhin das Senden von Text und Medien sowie die Überwachung eingehender Nachrichten an; es blendet `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (entsprechend der Fähigkeitsprüfung pro Methode).
- Sie können einen separaten Mac ohne Apple Silicon (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Workload betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe unten [Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)](#deployment-patterns).

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens einen Eintrag in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Feld für die Zulassungsliste: `channels.imessage.allowFrom`.

    Einträge in der Zulassungsliste müssen Absender identifizieren: Handles oder statische Absenderzugriffsgruppen (`accessGroup:<name>`). Verwenden Sie `channels.imessage.groupAllowFrom` für Chatziele wie `chat_id:*`, `chat_guid:*` oder `chat_identifier:*`; verwenden Sie `channels.imessage.groups` für numerische `chat_id`-Registrierungsschlüssel.

  </Tab>

  <Tab title="Gruppenrichtlinie und Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenverarbeitung:

    - `allowlist` (Standard)
    - `open`
    - `disabled`

    Zulassungsliste für Gruppenabsender: `channels.imessage.groupAllowFrom`.

    Einträge in `groupAllowFrom` können auch auf statische Absenderzugriffsgruppen (`accessGroup:<name>`) verweisen.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, verwenden die Prüfungen von iMessage-Gruppenabsendern `allowFrom`; setzen Sie `groupAllowFrom`, wenn sich die Zulassung für Direktnachrichten und Gruppen unterscheiden soll. Ein ausdrücklich leeres `groupAllowFrom: []` führt nicht zum Fallback – es blockiert unter `allowlist` alle Gruppenabsender.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, greift die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Das Gruppen-Routing unter `groupPolicy: "allowlist"` durchläuft direkt nacheinander **zwei** Schranken:

    1. **Absenderzulassungsliste** (`channels.imessage.groupAllowFrom`) – Handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` oder `chat_id`. Eine leere effektive Liste (kein `groupAllowFrom` und kein Fallback auf `allowFrom`) blockiert jeden Gruppenabsender.
    2. **Gruppenregistrierung** (`channels.imessage.groups`) – wird erzwungen, sobald die Zuordnung Einträge enthält: Der Chat muss mit einem expliziten Eintrag pro `chat_id` oder dem Platzhalter `groups: { "*": { ... } }` übereinstimmen. Wenn `groups` leer ist oder fehlt, entscheidet allein die Absenderzulassungsliste über die Zulassung.

    Wenn keine effektive Zulassungsliste für Gruppenabsender konfiguriert ist, wird jede Gruppennachricht vor der Registrierungsschranke verworfen. Jede Schranke besitzt auf der standardmäßigen Protokollierungsstufe ein eigenes Signal der Stufe `warn`, und jedes nennt eine andere Lösung:

    - einmal pro Konto beim Start, wenn die effektive Zulassungsliste für Gruppenabsender leer ist: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` – beheben Sie dies, indem Sie `channels.imessage.groupAllowFrom` (oder `allowFrom`) setzen; das alleinige Hinzufügen von Einträgen zu `groups` führt dazu, dass Schranke 1 weiterhin jeden Absender blockiert.
    - einmal pro `chat_id` zur Laufzeit, wenn ein Absender Schranke 1 passiert hat, der Chat jedoch in einer befüllten `groups`-Registrierung fehlt: `imessage: dropping group message from chat_id=<id> ...` – beheben Sie dies, indem Sie diese `chat_id` (oder `"*"`) unter `channels.imessage.groups` hinzufügen.

    Direktnachrichten sind nicht betroffen – sie verwenden einen anderen Codepfad.

    Empfohlene Konfiguration für den Gruppenfluss unter `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    `groupAllowFrom` allein lässt diese Absender in jeder Gruppe zu; fügen Sie den `groups`-Block hinzu, um einzuschränken, welche Chats zulässig sind (und um chatspezifische Optionen wie `requireMention` festzulegen).
    </Warning>

    Erwähnungssteuerung für Gruppen:

    - iMessage verfügt über keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, ersatzweise `messages.groupChat.mentionPatterns`)
    - wenn keine Muster konfiguriert sind, kann die Erwähnungssteuerung nicht durchgesetzt werden
    - Steuerungsbefehle von autorisierten Absendern umgehen die Erwähnungssteuerung

    Gruppenspezifischer `systemPrompt`:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert eine optionale `systemPrompt`-Zeichenfolge, die bei jedem Durchlauf, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt wird. Die Auflösung entspricht `channels.whatsapp.groups`:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der Eintrag für die jeweilige Gruppe in der Zuordnung vorhanden **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und auf diese Gruppe kein System-Prompt angewendet.
    2. **System-Prompt mit Gruppenplatzhalter** (`groups["*"].systemPrompt`): wird verwendet, wenn der Eintrag für die jeweilige Gruppe in der Zuordnung vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
    ```
    ```json5
          groups: {
    ```
    ```json5
            "*": { systemPrompt: "Verwenden Sie die britische Rechtschreibung." },
    ```
    ```json5
            "8421": {
    ```
    ```json5
              requireMention: true,
    ```
    ```json5
              systemPrompt: "Dies ist der Chat für die Rufbereitschaft. Beschränken Sie Antworten auf höchstens 3 Sätze.",
    ```
    ```json5
            },
            "9907": {
    ```
    ```json5
              // explizite Unterdrückung: Der Platzhalter „Use British spelling.“ gilt hier nicht
    ```
    ```json5
              systemPrompt: "",
            },
    ```
    ```json5
          },
        },
      },
    }
    ```
    Gruppenspezifische Prompts gelten nur für Gruppennachrichten – Direktnachrichten sind davon nicht betroffen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - Direktnachrichten verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit der Standardeinstellung `session.dmScope=main` werden iMessage-Direktnachrichten in der Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der Metadaten des ursprünglichen Kanals und Ziels an iMessage zurückgeleitet.

    Verhalten gruppenähnlicher Threads:

    Einige iMessage-Threads mit mehreren Teilnehmenden können mit `is_group=false` eingehen.
    Wenn diese `chat_id` ausdrücklich unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppenzugriffskontrolle + Isolierung der Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

iMessage-Chats können an ACP-Sitzungen gebunden werden.

Schneller Ablauf für Betreiber:

- Führen Sie `/acp spawn codex --bind here` in der Direktnachricht oder im zulässigen Gruppenchat aus.
- Künftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen verwenden `bindings[]`-Einträge auf oberster Ebene mit `type: "acp"` und `match.channel: "imessage"`.

`match.peer.id` kann Folgendes verwenden:

- normalisiertes DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>` (für stabile Gruppenbindungen empfohlen)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Beispiel:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Informationen zum gemeinsamen Verhalten von ACP-Bindungen finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit der Bot-Datenverkehr von Ihrem persönlichen Messages-Profil getrennt bleibt.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer bzw. melden Sie sich bei diesem an.
    2. Melden Sie sich in diesem Benutzer mit der Apple-ID des Bots bei Messages an.
    3. Installieren Sie `imsg` für diesen Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Richten Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Bei der ersten Ausführung sind möglicherweise GUI-Genehmigungen (Automation + Full Disk Access) in der Sitzung dieses Bot-Benutzers erforderlich.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Übliche Topologie:

    - Gateway wird unter Linux/in einer VM ausgeführt
    - iMessage + `imsg` wird auf einem Mac in Ihrem Tailnet ausgeführt
    - der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` ermöglicht das Abrufen von Anhängen über SCP

    Beispiel:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Verwenden Sie SSH-Schlüssel, damit sowohl SSH als auch SCP nicht interaktiv ausgeführt werden.
    Stellen Sie zunächst sicher, dass dem Hostschlüssel vertraut wird (zum Beispiel mit `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Muster für mehrere Konten">
    iMessage unterstützt eine kontospezifische Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Zulassungslisten für Stammverzeichnisse von Anhängen überschreiben.

  </Accordion>

  <Accordion title="Direktnachrichtenverlauf">
    Legen Sie `channels.imessage.dmHistoryLimit` fest, um neue Direktnachrichtensitzungen mit dem zuletzt dekodierten `imsg`-Verlauf dieser Unterhaltung zu initialisieren. Verwenden Sie `channels.imessage.dms["<sender>"].historyLimit` für absenderspezifische Überschreibungen, einschließlich `0`, um den Verlauf für einen Absender zu deaktivieren.

    Der iMessage-Direktnachrichtenverlauf wird bei Bedarf von `imsg` abgerufen. Wenn `dmHistoryLimit` nicht festgelegt ist, wird die globale Initialisierung mit dem Direktnachrichtenverlauf deaktiviert; ein positiver absenderspezifischer Wert für `channels.imessage.dms["<sender>"].historyLimit` aktiviert die Initialisierung für diesen Absender jedoch weiterhin.

  </Accordion>
</AccordionGroup>

## Medien, Aufteilung und Zustellungsziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - Die Verarbeitung eingehender Anhänge ist **standardmäßig deaktiviert** — legen Sie `channels.imessage.includeAttachments: true` fest, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agenten weiterzuleiten. Ist diese Option deaktiviert, werden iMessages, die nur Anhänge enthalten, verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Protokollzeile.
    - Pfade zu entfernten Anhängen können über SCP abgerufen werden, wenn `remoteHost` festgelegt ist
    - Anhangspfade müssen mit zulässigen Stammverzeichnissen übereinstimmen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Konfigurierte Stammverzeichnisse erweitern das standardmäßige Stammpfadmuster `/Users/*/Library/Messages/Attachments` (sie werden zusammengeführt, nicht ersetzt)
    - SCP verwendet eine strikte Hostschlüsselprüfung (`StrictHostKeyChecking=yes`)
    - Die Größe ausgehender Medien wird über `channels.imessage.mediaMaxMb` festgelegt (Standardwert: 16 MB)

  </Accordion>

  <Accordion title="Ausgehender Text und Aufteilung">
    - Textabschnittslimit: `channels.imessage.textChunkLimit` (Standardwert: 4000)
    - Aufteilungsmodus: `channels.imessage.streaming.chunkMode`
      - `length` (Standardwert)
      - `newline` (Absätze werden bevorzugt getrennt)
    - Ausgehende Markdown-Formatierungen für Fett-, Kursiv-, Unterstrichen- und Durchgestrichen-Schrift werden in nativen formatierten Text umgewandelt (Empfänger mit macOS 15+ sehen die Formatierung; ältere Empfänger sehen einfachen Text ohne die Markierungen); Markdown-Tabellen werden entsprechend dem Markdown-Tabellenmodus des Kanals konvertiert
    - `channels.imessage.sendTransport` (`auto` als Standardwert, `bridge`, `applescript`) legt fest, wie `imsg` Nachrichten zustellt

  </Accordion>

  <Accordion title="Adressierungsformate">
    Bevorzugte explizite Ziele:

    - `chat_id:123` (für stabiles Routing empfohlen)
    - `chat_guid:...`
    - `chat_identifier:...`

    Ziele in Form von Handles werden ebenfalls unterstützt:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Aktionen der privaten API

Wenn `imsg launch` ausgeführt wird und `openclaw channels status --probe` den Wert `privateApi.available: true` meldet, kann das Nachrichten-Tool zusätzlich zum normalen Textversand iMessage-native Aktionen verwenden.

Alle Aktionen sind standardmäßig aktiviert. Verwenden Sie `channels.imessage.actions`, um einzelne Aktionen zu deaktivieren:

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verfügbare Aktionen">
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks entsprechen Liebe, Gefällt mir, Gefällt mir nicht, Lachen, Hervorheben und Frage. Beim Entfernen ohne Emoji wird das jeweils gesetzte Tapback gelöscht.
    - **reply**: Eine Antwort in einem Thread auf eine bestehende Nachricht senden (`messageId`, `text` oder `message` sowie `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Für eine Antwort mit Anhang ist zusätzlich ein `imsg`-Build erforderlich, dessen `send-rich` die Option `--file` unterstützt.
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`). Kurznamen: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Eine gesendete Nachricht unter unterstützten macOS-/privaten API-Versionen bearbeiten (`messageId`, `text` oder `newText`). Nur Nachrichten, die das Gateway selbst gesendet hat, können bearbeitet werden.
    - **unsend**: Eine gesendete Nachricht unter unterstützten macOS-/privaten API-Versionen zurückziehen (`messageId`). Nur Nachrichten, die das Gateway selbst gesendet hat, können zurückgezogen werden.
    - **upload-file**: Medien/Dateien senden (`buffer` als Base64 oder ein aufgelöster `media`-/`path`-/`filePath`-Wert, `filename`, optional `asVoice`). Veralteter Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenunterhaltung ist. Diese Aktionen verändern die Messages-Identität des Hosts und erfordern daher einen Eigentümer als Absender oder einen `operator.admin`-Gateway-Client.
    - **poll**: Eine native Apple-Messages-Umfrage erstellen (`pollQuestion`, `pollOption` 2- bis 12-mal wiederholt sowie `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Empfänger mit iOS/iPadOS/macOS 26+ können die Umfrage nativ sehen und darüber abstimmen; ältere Betriebssystemversionen erhalten ersatzweise den Text „Sent a poll“. Erfordert `selectors.pollPayloadMessage`.
    - **poll-vote**: Über eine bestehende Umfrage abstimmen (`pollId` oder `messageId` sowie genau einer der Werte `pollOptionIndex`, `pollOptionId` oder `pollOptionText`). Erfordert `selectors.pollVoteMessage` und die RPC-Methode `poll.vote`.

    Akzeptierte eingehende Umfragen werden für den Agenten mit der Frage, nummerierten Optionsbezeichnungen, Stimmenzahlen und der für `poll-vote` benötigten Nachrichten-ID dargestellt.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Der Kontext eingehender iMessages enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs (`MessageSidFull`), sofern verfügbar. Kurze IDs gelten nur innerhalb des aktuellen SQLite-basierten Antwort-Caches und werden vor der Verwendung mit dem aktuellen Chat abgeglichen. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, versuchen Sie es erneut mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Funktionserkennung">
    OpenClaw blendet Aktionen der privaten API nur aus, wenn der zwischengespeicherte Prüfstatus angibt, dass die Bridge nicht verfügbar ist. Ist der Status unbekannt, bleiben die Aktionen sichtbar, und beim Ausführen werden Prüfungen verzögert gestartet, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Tippanzeige">
    Wenn die Bridge der privaten API aktiv ist, werden akzeptierte eingehende Chats als gelesen markiert, und in Direktchats wird eine Tippblase angezeigt, sobald der Turn akzeptiert wurde, während der Agent den Kontext vorbereitet und die Antwort generiert. Deaktivieren Sie die Lesemarkierung mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der Funktionsliste pro Methode entstanden sind, deaktivieren Tippanzeige und Lesebestätigungen stillschweigend. OpenClaw protokolliert bei jedem Neustart einmalig eine Warnung, damit sich die fehlende Bestätigung zuordnen lässt.

  </Accordion>

  <Accordion title="Eingehende Tapbacks">
    OpenClaw abonniert iMessage-Tapbacks und leitet akzeptierte Reaktionen als Systemereignisse statt als normalen Nachrichtentext weiter, sodass das Tapback eines Benutzers keine gewöhnliche Antwortschleife auslöst.

    Der Benachrichtigungsmodus wird durch `channels.imessage.reactionNotifications` gesteuert:

    - `"own"` (Standard): Nur benachrichtigen, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren.
    - `"all"`: Für alle eingehenden Tapbacks von autorisierten Absendern benachrichtigen.
    - `"off"`: Eingehende Tapbacks ignorieren.

    Kontospezifische Überschreibungen verwenden `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Genehmigungsreaktionen (👍 / 👎)">
    Wenn `approvals.exec.enabled` oder `approvals.plugin.enabled` auf „true“ gesetzt ist und die Anfrage an iMessage weitergeleitet wird, stellt der Gateway eine native Genehmigungsaufforderung zu und akzeptiert ein Tapback, um sie zu entscheiden:

    - `👍` (Like-Tapback) → `allow-once`
    - `👎` (Dislike-Tapback) → `deny`
    - `allow-always` bleibt eine manuelle Ausweichmöglichkeit: Senden Sie `/approve <id> allow-always` als reguläre Antwort.

    Für die Verarbeitung der Reaktion muss das Handle des reagierenden Benutzers ausdrücklich als Genehmiger eingetragen sein. Die Genehmigerliste wird aus `channels.imessage.allowFrom` (oder `channels.imessage.accounts.<id>.allowFrom`) gelesen. Fügen Sie die Telefonnummer des Benutzers im E.164-Format oder seine Apple-ID-E-Mail-Adresse hinzu (Chatziele wie `chat_id:*` sind keine gültigen Genehmigereinträge). Der Platzhaltereintrag `"*"` wird berücksichtigt, erlaubt jedoch jedem Absender, Genehmigungen zu erteilen. Eine leere Genehmigerliste deaktiviert die Reaktionsabkürzung vollständig. Die Reaktionsabkürzung umgeht absichtlich `reactionNotifications`, `dmPolicy` und `groupAllowFrom`, da ausschließlich die explizite Genehmiger-Zulassungsliste für die Auflösung der Genehmigung maßgeblich ist.

    Die Autorisierung des Textbefehls `/approve` folgt derselben Liste: Wenn `channels.imessage.allowFrom` nicht leer ist, wird `/approve <id> <decision>` anhand dieser Genehmigerliste autorisiert (nicht anhand der umfassenderen DM-Zulassungsliste), und Absender, die auf der DM-Zulassungsliste zugelassen sind, aber nicht in `allowFrom` stehen, erhalten eine ausdrückliche Ablehnung. Wenn `allowFrom` leer ist, bleibt die Ausweichmöglichkeit im selben Chat aktiv, und `/approve` autorisiert alle Personen, die von der DM-Zulassungsliste zugelassen werden. Fügen Sie jeden Operator, der Genehmigungen erteilen soll – über `/approve` oder über Reaktionen –, zu `allowFrom` hinzu.

    Hinweise für Operatoren:
    - Die Reaktionszuordnung wird sowohl im Arbeitsspeicher als auch im persistenten schlüsselbasierten Speicher des Gateways gespeichert (die TTL entspricht dem Ablaufzeitpunkt der Genehmigung). Außerdem fragt der Gateway ausstehende Aufforderungen regelmäßig auf Tapbacks ab, sodass ein Tapback, das kurz nach einem Neustart des Gateways eintrifft, die Genehmigung weiterhin entscheidet.
    - Das eigene Tapback des Operators mit `is_from_me=true` (beispielsweise von einem gekoppelten Apple-Gerät) entscheidet die Genehmigung, wenn dieses Handle ausdrücklich als Genehmiger eingetragen ist.
    - Genehmigungsaufforderungen werden nur dann an eine Gruppenkonversation weitergeleitet, wenn explizite Genehmiger konfiguriert sind; andernfalls könnte jedes Gruppenmitglied die Genehmigung erteilen.
    - Ältere textbasierte Tapbacks (unformatierter Text wie `Liked "…"` von sehr alten Apple-Clients) können Genehmigungen nicht entscheiden, da sie keine Nachrichten-GUID enthalten. Die Auflösung per Reaktion erfordert die strukturierten Tapback-Metadaten, die aktuelle macOS-/iOS-Clients ausgeben.

  </Accordion>
</AccordionGroup>

## Konfigurationsänderungen

iMessage erlaubt standardmäßig vom Kanal initiierte Konfigurationsänderungen (für `/config set|unset`, wenn `commands.config: true`).

Deaktivieren:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Zusammenführen aufgeteilter Direktnachrichten (Befehl und URL in einer Eingabe)

Wenn ein Benutzer einen Befehl und eine URL gemeinsam eingibt – z. B. `Dump https://example.com/article` –, teilt Apples Nachrichten-App den Versand in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Blase (`"https://..."`) mit Bildern der OG-Vorschau als Anhänge.

Die beiden Zeilen treffen bei den meisten Konfigurationen mit einem Abstand von ~0.8-2.0 s bei OpenClaw ein. Ohne Zusammenführung erhält der Agent in Turn 1 nur den Befehl (und antwortet häufig „Senden Sie mir die URL“), bevor die URL in Turn 2 eintrifft. Dies ist Teil der Versandpipeline von Apple und wird weder von OpenClaw noch von `imsg` verursacht.

`channels.imessage.coalesceSameSenderDms` aktiviert für eine Direktnachricht die Pufferung aufeinanderfolgender Zeilen desselben Absenders. Wenn `imsg` in einer der Quellzeilen die strukturelle URL-Vorschaumarkierung `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` bereitstellt, führt OpenClaw nur diesen tatsächlich aufgeteilten Versand zusammen und behält alle anderen gepufferten Zeilen als separate Turns bei. Bei älteren `imsg`-Builds, die keinerlei Balloon-Metadaten ausgeben, kann OpenClaw einen aufgeteilten Versand nicht von separaten Sendungen unterscheiden und führt daher ersatzweise den Bucket zusammen. Dadurch bleibt das Verhalten vor Einführung der Metadaten erhalten, statt aufgeteilte Sendungen vom Typ `Dump <url>` in zwei Turns aufzuteilen. Gruppenchats werden weiterhin nach einzelnen Nachrichten verarbeitet, sodass die Turn-Struktur bei mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie die Option, wenn:

    - Sie Skills bereitstellen, die `command + payload` in einer Nachricht erwarten (Dump, Einfügen, Speichern, Warteschlange usw.).
    - Ihre Benutzer URLs zusammen mit Befehlen einfügen.
    - Sie die zusätzliche Turn-Latenz bei Direktnachrichten akzeptieren können (siehe unten).

    Lassen Sie die Option deaktiviert, wenn:

    - Sie für aus einem einzelnen Wort bestehende Auslöser in Direktnachrichten eine minimale Befehlslatenz benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne nachfolgende Nutzdaten sind.

  </Tab>
  <Tab title="Aktivierung">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // aktivieren (Standard: false)
        },
      },
    }
    ```

    Wenn das Flag aktiviert ist und weder `messages.inbound.byChannel.imessage` noch das globale `messages.inbound.debounceMs` explizit festgelegt wurde, wird das Entprellzeitfenster auf **7000 ms** erweitert (der bisherige Standardwert beträgt 0 ms – keine Entprellung). Das größere Zeitfenster ist erforderlich, weil sich Apples Versandabfolge bei aufgeteilten URL-Vorschauen über mehrere Sekunden erstrecken kann, während Messages.app die Vorschauzeile ausgibt.

    So passen Sie das Zeitfenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms decken beobachtete Verzögerungen bei URL-Vorschauen von Messages.app ab.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Abwägungen">
    - **Für eine präzise Zusammenführung sind aktuelle `imsg`-Nutzdatenmetadaten erforderlich.** Wenn `balloon_bundle_id` vorhanden ist, wird nur der tatsächlich aufgeteilte Versand zusammengeführt; die oben beschriebene ersatzweise Zusammenführung ohne Metadaten dient vorübergehend der Abwärtskompatibilität und wird entfernt, sobald `imsg` aufgeteilte Sendungen vorgelagert selbst zusammenführt.
    - **Zusätzliche Latenz bei Direktnachrichten.** Bei aktiviertem Flag wartet jede Direktnachricht (einschließlich eigenständiger Steuerbefehle und nachfolgender einzelner Textnachrichten) vor der Verarbeitung bis zum Ablauf des Entprellzeitfensters, falls noch eine URL-Vorschauzeile folgt. Nachrichten in Gruppenchats werden weiterhin sofort verarbeitet.
    - **Die zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen begrenzt und erhält bei Überschreitung die explizite Markierung `…[truncated]`; Anhänge sind auf 20 begrenzt; Quelleinträge sind auf 10 begrenzt (bei Überschreitung werden der erste und die neuesten beibehalten). Jede Quell-GUID wird für die nachgelagerte Telemetrie in `coalescedMessageGuids` erfasst.
    - **Nur für Direktnachrichten.** Gruppenchats verwenden weiterhin die Verarbeitung einzelner Nachrichten, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen gleichzeitig schreiben.
    - **Optionale Aktivierung pro Kanal.** Andere Kanäle (Discord, Slack, Telegram, WhatsApp, …) sind nicht betroffen. Bei älteren BlueBubbles-Konfigurationen mit `channels.bluebubbles.coalesceSameSenderDms` sollte dieser Wert zu `channels.imessage.coalesceSameSenderDms` migriert werden.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

Die Spalte „Flag aktiviert“ zeigt das Verhalten bei einem `imsg`-Build, der `balloon_bundle_id` ausgibt. Bei älteren `imsg`-Builds, die keinerlei Balloon-Metadaten ausgeben, werden die unten mit „Zwei Turns“/„N Turns“ gekennzeichneten Zeilen stattdessen ersatzweise wie bisher zusammengeführt (ein Turn): OpenClaw kann einen aufgeteilten Versand strukturell nicht von separaten Sendungen unterscheiden und behält daher die Zusammenführung aus der Zeit vor den Metadaten bei. Die präzise Trennung wird aktiviert, sobald der Build Balloon-Metadaten ausgibt.

  | Benutzer verfasst                                                   | `chat.db` erzeugt                    | Schalter aus (Standard)                     | Schalter an + Zeitfenster (imsg gibt Sprechblasen-Metadaten aus)                                               |
  | ------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
  | `Dump https://example.com` (einmal gesendet)                        | 2 Zeilen im Abstand von ~1 s         | Zwei Agent-Durchläufe: nur „Dump“, dann URL | Ein Durchlauf: zusammengeführter Text `Dump https://example.com`                                               |
  | `Save this 📎image.jpg caption` (Anhang + Text)                      | 2 Zeilen ohne URL-Sprechblasen-Metadaten | Zwei Durchläufe                         | Zwei Durchläufe, nachdem Metadaten erkannt wurden; ein zusammengeführter Durchlauf bei alten Sitzungen bzw. Sitzungen vor dem Latch ohne Metadaten |
  | `/status` (eigenständiger Befehl)                                   | 1 Zeile                              | Sofortige Weiterleitung                     | **Bis zum Ablauf des Zeitfensters warten, dann weiterleiten**                                                  |
  | Nur URL eingefügt                                                   | 1 Zeile                              | Sofortige Weiterleitung                     | Bis zum Ablauf des Zeitfensters warten, dann weiterleiten                                                      |
  | Text + URL als zwei bewusst getrennte Nachrichten im Abstand von Minuten gesendet | 2 Zeilen außerhalb des Zeitfensters | Zwei Durchläufe                     | Zwei Durchläufe (das Zeitfenster läuft dazwischen ab)                                                          |
  | Schnelle Nachrichtenflut (>10 kleine DMs innerhalb des Zeitfensters) | N Zeilen ohne URL-Sprechblasen-Metadaten | N Durchläufe                         | N Durchläufe, nachdem Metadaten erkannt wurden; ein begrenzter zusammengeführter Durchlauf bei alten Sitzungen bzw. Sitzungen vor dem Latch ohne Metadaten |
  | Zwei Personen schreiben in einem Gruppenchat                       | N Zeilen von M Absendern             | M+ Durchläufe (einer pro Absender-Bucket)   | M+ Durchläufe — Gruppenchats werden nicht zusammengeführt                                                      |

  ## Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways

  iMessage stellt Nachrichten wieder her, die während des Ausfalls des Gateways verpasst wurden, und unterdrückt gleichzeitig die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann. Das Standardverhalten ist immer aktiviert und basiert auf der Deduplizierung eingehender Nachrichten.

  - **Wiedergabe-Deduplizierung.** Jede weitergeleitete eingehende Nachricht wird anhand ihrer Apple-GUID im persistenten Plugin-Zustand (`imessage.inbound-dedupe`) erfasst, bei der Aufnahme beansprucht und nach der Verarbeitung bestätigt (bei einem vorübergehenden Fehler wieder freigegeben, damit ein erneuter Versuch möglich ist). Bereits verarbeitete Nachrichten werden verworfen, statt zweimal weitergeleitet zu werden. Dadurch kann die Wiederherstellung Nachrichten umfassend wiedergeben, ohne jede Nachricht einzeln nachzuverfolgen.
  - **Wiederherstellung nach Ausfallzeit.** Beim Start merkt sich der Monitor die zuletzt weitergeleitete `chat.db`-rowid (einen persistenten Cursor pro Konto) und übergibt sie als `since_rowid` an `imsg watch.subscribe`. Dadurch gibt imsg die Zeilen wieder, die während des Gateway-Ausfalls eingegangen sind, und verfolgt anschließend neue Nachrichten live. Die Wiedergabe ist auf die neuesten 500 Zeilen und auf Nachrichten begrenzt, die höchstens ~2 Stunden alt sind; die Deduplizierung verwirft alle bereits verarbeiteten Nachrichten.
  - **Altersgrenze für veralteten Rückstau.** Zeilen oberhalb der Startgrenze sind tatsächlich live; wenn das Sendedatum einer solchen Zeile mehr als ~15 Minuten vor ihrem Eingang liegt, handelt es sich um den durch Push ausgegebenen Rückstau, der unterdrückt wird. Wiedergegebene Zeilen (an oder unterhalb der Grenze) verwenden stattdessen das größere Wiederherstellungszeitfenster. Dadurch wird eine kürzlich verpasste Nachricht zugestellt, während weit zurückliegende Nachrichten nicht zugestellt werden.

  Die Wiederherstellung funktioniert sowohl bei lokalen als auch bei entfernten `cliPath`-Konfigurationen, da die Wiedergabe über `since_rowid` über dieselbe `imsg`-RPC-Verbindung erfolgt. Der Unterschied liegt im Zeitfenster: Wenn das Gateway `chat.db` lesen kann (lokal), verankert es die rowid-Startgrenze, begrenzt den Wiedergabezeitraum und stellt verpasste Nachrichten zu, die bis zu einigen Stunden alt sind. Bei einem entfernten SSH-`cliPath` kann es die Datenbank nicht lesen. Daher ist die Wiedergabe nicht begrenzt und jede Zeile verwendet die Altersgrenze für Live-Nachrichten — kürzlich verpasste Nachrichten werden weiterhin wiederhergestellt und alte Rückstände weiterhin unterdrückt, jedoch mit dem engeren Live-Zeitfenster. Führen Sie das Gateway auf dem Messages-Mac aus, um das größere Wiederherstellungszeitfenster zu verwenden.

  ### Für Betreiber sichtbares Signal

  Unterdrückter Rückstau wird auf der Standardstufe protokolliert und niemals stillschweigend verworfen (das Flag `recovery` zeigt, welches Zeitfenster angewendet wurde):

  ```text
  imessage: veralteter eingehender Rückstau unterdrückt account=<id> sent=<iso> recovery=<bool> (<N> seit dem Start unterdrückt)
  ```

  ### Migration

  `channels.imessage.catchup.*` ist veraltet — die Wiederherstellung nach Ausfallzeiten erfolgt automatisch und erfordert bei neuen Konfigurationen keine Konfiguration. Bestehende Konfigurationen mit `catchup.enabled: true` werden weiterhin als Kompatibilitätsprofil für das Wiedergabezeitfenster der Wiederherstellung berücksichtigt. Deaktivierte Catchup-Blöcke (`enabled: false` oder ohne `enabled: true`) werden nicht mehr verwendet; `openclaw doctor --fix` entfernt sie.

  ## Fehlerbehebung

  <AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Überprüfen Sie die Binärdatei und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Prüfung meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn Aktionen der privaten API nicht verfügbar sind, führen Sie `imsg launch` in der Sitzung des angemeldeten macOS-Benutzers aus und prüfen Sie erneut. Wenn der Gateway nicht unter macOS ausgeführt wird, verwenden Sie stattdessen die oben beschriebene Einrichtung eines entfernten Mac über SSH und nicht den standardmäßigen lokalen `imsg`-Pfad.

  </Accordion>

  <Accordion title="Nachrichten werden gesendet, aber eingehende iMessages kommen nicht an">
    Prüfen Sie zunächst, ob die Nachricht den lokalen Mac erreicht hat. Wenn sich `chat.db` nicht ändert, kann OpenClaw die Nachricht nicht empfangen, selbst wenn `imsg status --json` eine funktionierende Bridge meldet.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Wenn vom Telefon gesendete Nachrichten keine neuen Zeilen erzeugen, reparieren Sie die macOS-Nachrichten- und Apple-Push-Schicht, bevor Sie die OpenClaw-Konfiguration ändern. Eine einmalige Aktualisierung der Dienste reicht häufig aus:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Senden Sie eine neue iMessage vom Telefon und bestätigen Sie eine neue Zeile in `chat.db` oder ein Ereignis von `imsg watch`, bevor Sie OpenClaw-Sitzungen debuggen. Führen Sie dies nicht als regelmäßige Schleife zum Neustarten der Bridge aus. Wiederholte Ausführungen von `imsg launch` zusammen mit Gateway-Neustarts während des aktiven Betriebs können Zustellungen unterbrechen und laufende Kanalausführungen blockieren.

  </Accordion>

  <Accordion title="Gateway wird nicht unter macOS ausgeführt">
    Der standardmäßige `cliPath: "imsg"` muss auf dem Mac ausgeführt werden, der bei Nachrichten angemeldet ist. Legen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript fest, das per SSH eine Verbindung zu diesem Mac herstellt und `imsg "$@"` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Führen Sie anschließend Folgendes aus:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Direktnachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Kopplungsgenehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - das Verhalten der Zulassungsliste `channels.imessage.groups`
    - die Konfiguration der Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Entfernte Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH-/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - ob der Hostschlüssel auf dem Gateway-Host in `~/.ssh/known_hosts` vorhanden ist
    - die Lesbarkeit des entfernten Pfads auf dem Mac, auf dem Nachrichten ausgeführt wird

  </Accordion>

  <Accordion title="macOS-Berechtigungsabfragen wurden übersehen">
    Führen Sie die Befehle erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Abfragen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Vergewissern Sie sich, dass für den Prozesskontext, in dem OpenClaw/`imsg` ausgeführt wird, Festplattenvollzugriff und Automation gewährt wurden.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz – iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — Ankündigung und Zusammenfassung der Migration
- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) — Tabelle zur Konfigurationsübertragung und schrittweise Umstellung
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Beschränkung auf Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
