---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio) mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Umfragen, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Einrichtungen, wenn die Hostanforderungen erfüllt sind.
title: iMessage
x-i18n:
    generated_at: "2026-07-24T04:15:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f3e8b1a65c76b25d03615c06a976f86a8af555cd96d5bfdb10cef9c955893ddc
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Für die übliche OpenClaw-iMessage-Bereitstellung führen Sie den Gateway und `imsg` auf demselben bei macOS Messages angemeldeten Host aus. Wenn Ihr Gateway an einem anderen Ort ausgeführt wird, verweisen Sie `channels.imessage.cliPath` auf einen transparenten SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Die Wiederherstellung eingehender Nachrichten erfolgt automatisch.** Nach einem Neustart der Bridge oder des Gateways spielt iMessage die während des Ausfalls verpassten Nachrichten erneut ab und unterdrückt die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann. Durch Deduplizierung wird nichts zweimal weitergeleitet. Es muss keine Konfiguration aktiviert werden – siehe [Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Die Unterstützung für BlueBubbles wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage ausschließlich über `imsg`. Lesen Sie zunächst [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native Integration einer externen CLI. Der Gateway startet `imsg rpc` und kommuniziert über stdio mittels JSON-RPC – ohne separaten Daemon oder Port. Der Modus der privaten API wird für einen vollständigen iMessage-Kanal dringend empfohlen; Antworten, Tapbacks, Effekte, Umfragen, Antworten auf Anhänge und Gruppenaktionen erfordern `imsg launch` sowie eine erfolgreiche Prüfung der privaten API.

Für die gängige lokale Einrichtung kann die OpenClaw-Einrichtung eine vom Benutzer bestätigte Homebrew-Installation oder -Aktualisierung von `imsg` auf dem bei Messages angemeldeten Mac anbieten. Die manuelle Einrichtung und Topologien mit SSH-Wrappern werden weiterhin vom Betreiber verwaltet: Installieren oder aktualisieren Sie `imsg` in demselben Benutzerkontext, in dem der Gateway oder Wrapper ausgeführt wird.

<CardGroup cols={3}>
  <Card title="Aktionen der privaten API" icon="wand-sparkles" href="#private-api-actions">
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

        Wenn der lokale Einrichtungsassistent einen fehlenden standardmäßigen `imsg`-Befehl erkennt, kann er zur Installation von `steipete/tap/imsg` über Homebrew auffordern. Wenn er ein von Homebrew verwaltetes `imsg` erkennt, kann er zur Neuinstallation oder Aktualisierung auffordern. Benutzerdefinierte `cliPath`-Wrapper werden nicht geändert.

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
    Die meisten Einrichtungen benötigen kein SSH. Verwenden Sie diese Topologie nur, wenn der Gateway nicht auf dem bei Messages angemeldeten Mac ausgeführt werden kann. OpenClaw benötigt lediglich ein stdio-kompatibles `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript verweisen lassen, das eine SSH-Verbindung zu einem entfernten Mac herstellt und dort `imsg` ausführt.
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
      // Optional: zusätzliche zulässige Stammverzeichnisse für Anhänge (werden mit dem Standardpfad
      // /Users/*/Library/Messages/Attachments zusammengeführt).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht festgelegt ist, versucht OpenClaw, es durch Analyse des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen); unsichere Werte werden ignoriert.
    OpenClaw verwendet für SCP eine strikte Hostschlüsselprüfung, daher muss der Hostschlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden anhand der zulässigen Stammverzeichnisse (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

<Warning>
Jeder `cliPath`-Wrapper oder SSH-Proxy, den Sie `imsg` vorschalten, MUSS sich für langlebiges JSON-RPC wie eine transparente stdio-Pipe verhalten. OpenClaw tauscht während der gesamten Lebensdauer des Kanals kleine, durch Zeilenumbrüche begrenzte JSON-RPC-Nachrichten über stdin/stdout des Wrappers aus:

- Leiten Sie jeden stdin-Block bzw. jede stdin-Zeile **sofort weiter, sobald Bytes verfügbar sind** – warten Sie nicht auf EOF.
- Leiten Sie jeden stdout-Block bzw. jede stdout-Zeile unverzüglich in die Gegenrichtung weiter.
- Behalten Sie Zeilenumbrüche bei.
- Vermeiden Sie blockierende Lesevorgänge mit fester Größe (`read(4096)`, `cat | buffer`, standardmäßiges Shell-`read`), durch die kleine Frames nicht verarbeitet werden können.
- Halten Sie stderr vom JSON-RPC-stdout-Datenstrom getrennt.

Ein Wrapper, der stdin puffert, bis ein großer Block gefüllt ist, verursacht Symptome, die wie ein iMessage-Ausfall wirken – `imsg rpc timeout (chats.list)` oder wiederholte Neustarts des Kanals –, obwohl `imsg rpc` selbst ordnungsgemäß funktioniert. `ssh -T host imsg "$@"` (oben) ist sicher, da es die `cliPath`-Argumente von OpenClaw wie `rpc` und `--db` weiterleitet. Pipelines wie `ssh host imsg | grep -v '^DEBUG'` sind NICHT sicher – auch zeilengepufferte Tools können Frames zurückhalten; verwenden Sie `stdbuf -oL -eL` in jeder Stufe, wenn Sie filtern müssen.
</Warning>

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Festplattenvollzugriff ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` ausgeführt wird (Zugriff auf die Messages-Datenbank).
- Die Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (Reaktion / Bearbeiten / Senden rückgängig machen / Antwort im Thread / Effekte / Umfragen / Gruppenaktionen) muss der Systemintegritätsschutz deaktiviert sein – siehe [Private API von imsg aktivieren](#enabling-the-imsg-private-api). Das grundlegende Senden und Empfangen von Text und Medien funktioniert auch ohne diese Deaktivierung.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn der Gateway ohne Benutzeroberfläche ausgeführt wird (LaunchAgent/SSH), führen Sie einmalig einen interaktiven Befehl in demselben Kontext aus, um die Aufforderungen auszulösen:

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

Überprüfen Sie die TCC-Datenbank des auf dem Mac angemeldeten Benutzers oder System Settings > Privacy & Security > Automation. Wenn der Automation-Eintrag für `/usr/libexec/sshd-keygen-wrapper` statt für den `imsg`- oder lokalen Shell-Prozess erfasst wurde, stellt macOS für diesen serverseitigen SSH-Client möglicherweise keinen nutzbaren Messages-Schalter bereit:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In diesem Zustand können das Wiederholen von `tccutil reset AppleEvents` oder das erneute Ausführen von `imsg send` über denselben SSH-Wrapper weiterhin fehlschlagen, da nicht eine Anwendung, der die Benutzeroberfläche die Berechtigung erteilen kann, sondern der SSH-Wrapper der Prozesskontext ist, der die Messages-Automatisierung benötigt.

Verwenden Sie stattdessen einen der unterstützten `imsg`-Prozesskontexte:

- Führen Sie den Gateway oder zumindest die `imsg`-Bridge in der lokalen Sitzung des bei Messages angemeldeten Benutzers aus.
- Starten Sie den Gateway mit einem LaunchAgent für diesen Benutzer, nachdem Sie in derselben Sitzung Festplattenvollzugriff und Automatisierung gewährt haben.
- Wenn Sie die SSH-Topologie mit zwei Benutzern beibehalten, überprüfen Sie vor der Aktivierung des Kanals, dass ein echter ausgehender `imsg send`-Vorgang über genau diesen Wrapper erfolgreich ist. Wenn ihm keine Automatisierungsberechtigung erteilt werden kann, konfigurieren Sie stattdessen eine `imsg`-Einrichtung mit einem einzelnen Benutzer, anstatt sich beim Senden auf den SSH-Wrapper zu verlassen.

</Accordion>

## Private API von imsg aktivieren

`imsg` wird mit zwei Betriebsmodi ausgeliefert. Für OpenClaw wird der Modus der privaten API empfohlen, da er dem Kanal die nativen iMessage-Aktionen bereitstellt, die Benutzer erwarten. Der Basismodus ist weiterhin für risikoarme Installationen, die erste Überprüfung oder Hosts nützlich, auf denen SIP nicht deaktiviert werden kann.

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehende Texte und Medien über `send`, Überwachung und Verlauf eingehender Nachrichten, Chatliste. Dies steht direkt nach einer Neuinstallation von `brew install steipete/tap/imsg` und der Erteilung der oben genannten standardmäßigen macOS-Berechtigungen zur Verfügung.
- **Modus der privaten API**: `imsg` injiziert eine Hilfs-Dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (im Thread), `sendWithEffect`, `poll` und `poll-vote` (native Messages-Umfragen), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Der auf dieser Seite empfohlene Aktionsumfang erfordert den Modus der privaten API. Die README von `imsg` beschreibt diese Anforderung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, Bridge-gestütztes Senden umfangreicher Inhalte, Nachrichtenänderungen und Chatverwaltung sind optional. Sie erfordern, dass SIP deaktiviert und eine Hilfs-Dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Technik zur Injektion der Hilfsbibliothek verwendet die eigene Dylib von `imsg`, um auf private Messages-APIs zuzugreifen. Der OpenClaw-iMessage-Pfad verwendet weder einen Drittanbieterserver noch eine BlueBubbles-Laufzeitumgebung.

<Warning>
**Die Deaktivierung von SIP ist ein echter Sicherheitskompromiss.** SIP ist einer der zentralen macOS-Schutzmechanismen gegen die Ausführung veränderten Systemcodes. Eine systemweite Deaktivierung eröffnet zusätzliche Angriffsflächen und hat weitere Nebenwirkungen. Insbesondere **deaktiviert das Ausschalten von SIP auf Macs mit Apple Silicon außerdem die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste betriebliche Entscheidung, insbesondere auf einem primär privat genutzten Mac. Für eine produktionsreife OpenClaw-iMessage-Einrichtung empfiehlt sich ein dedizierter Mac oder ein macOS-Bot-Benutzer, bei dem die Aktivierung der Bridge vertretbar ist. Wenn Ihr Bedrohungsmodell eine Deaktivierung von SIP an keinem Ort zulässt, ist das integrierte iMessage auf den Basismodus beschränkt – ausschließlich Senden und Empfangen von Text und Medien, keine Reaktionen / Bearbeitung / Rückgängigmachen des Sendens / Effekte / Gruppenaktionen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` enthält `bridge_version`, `rpc_methods` und `selectors` für jede Methode, sodass Sie vor dem Start erkennen können, was der aktuelle Build unterstützt.

2. **Deaktivieren Sie den Systemintegritätsschutz und (unter modernem macOS) die Bibliotheksvalidierung.** Das Einschleusen einer nicht von Apple stammenden Hilfs-dylib in die von Apple signierte `Messages.app` erfordert, dass SIP deaktiviert **und** die Bibliotheksvalidierung gelockert ist. Der SIP-Schritt im Wiederherstellungsmodus ist von der macOS-Version abhängig:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Deaktivieren Sie die Bibliotheksvalidierung über das Terminal, starten Sie im Wiederherstellungsmodus neu, führen Sie `csrutil disable` aus und starten Sie erneut.
   - **macOS 11+ (Big Sur und neuer), Intel:** Wechseln Sie in den Wiederherstellungsmodus (oder die Internetwiederherstellung), führen Sie `csrutil disable` aus und starten Sie neu.
   - **macOS 11+, Apple Silicon:** Verwenden Sie die Startsequenz über den Ein-/Ausschalter, um die Wiederherstellung aufzurufen; halten Sie bei aktuellen macOS-Versionen die Taste **Left Shift** gedrückt, wenn Sie auf Continue klicken, und führen Sie anschließend `csrutil disable` aus. Für Konfigurationen mit virtuellen Maschinen gilt ein separater Ablauf; erstellen Sie daher zuerst einen VM-Snapshot.

   **Unter macOS 11 und neuer reicht `csrutil disable` allein normalerweise nicht aus.** Apple erzwingt für `Messages.app` als Plattformbinärdatei weiterhin die Bibliotheksvalidierung, sodass ein ad hoc signierter Helfer (`Library Validation failed: ... platform binary, but mapped file is not`) selbst bei deaktiviertem SIP abgewiesen wird. Deaktivieren Sie nach SIP auch die Bibliotheksvalidierung und starten Sie neu:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), unter 26.5.1 verifiziert:** Deaktiviertes SIP **zusammen mit** dem obigen Befehl `DisableLibraryValidation` genügt, um den Helfer unter allen Versionen von 26.0 bis 26.5.x einzuschleusen. **Es sind keine Boot-Argumente erforderlich.** Die plist ist der entscheidende Faktor und der am häufigsten fehlende Schritt, wenn das Einschleusen unter Tahoe fehlschlägt:
   - **Mit der plist:** `imsg launch` schleust den Helfer ein und `imsg status` meldet `advanced_features: true`.
   - **Ohne die plist (selbst bei deaktiviertem SIP):** `imsg launch` schlägt mit `Failed to launch: Timeout waiting for Messages.app to initialize` fehl. AMFI weist den ad hoc signierten Helfer beim Laden ab, sodass die Bridge nie bereit wird und der Start wegen einer Zeitüberschreitung fehlschlägt. Diese Zeitüberschreitung ist das Symptom, auf das die meisten Personen unter Tahoe stoßen; die Lösung ist die obige plist und keine drastischere Maßnahme.

   Wenn das Einschleusen von `imsg launch` oder bestimmte `selectors` nach einem macOS-Upgrade beginnen, false zurückzugeben, ist diese Sperre normalerweise die Ursache. Prüfen Sie den Status von SIP und der Bibliotheksvalidierung, bevor Sie davon ausgehen, dass der SIP-Schritt selbst fehlgeschlagen ist. Wenn diese Einstellungen korrekt sind und die Bridge weiterhin nichts einschleusen kann, erfassen Sie `imsg status --json` sowie die Ausgabe von `imsg launch` und melden Sie dies dem Projekt `imsg`, anstatt weitere systemweite Sicherheitskontrollen zu schwächen.

3. **Schleusen Sie den Helfer ein.** Bei deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert das Einschleusen, solange SIP aktiviert ist. Dies dient daher zugleich als Bestätigung, dass Schritt 2 wirksam war.

4. **Überprüfen Sie die Bridge über OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '{rpc_methods, selectors}'` sollte die von Ihrem macOS-Build bereitgestellten Funktionen anzeigen. Das Erstellen von Umfragen erfordert `selectors.pollPayloadMessage`; Abstimmungen erfordern sowohl `selectors.pollVoteMessage` als auch die RPC-Methode `poll.vote`. Das OpenClaw-Plugin bietet nur Aktionen an, die von der zwischengespeicherten Prüfung unterstützt werden. Bei einem leeren Cache bleibt es dagegen optimistisch und prüft beim ersten Versand.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen jedoch beim Versand den Fehler „iMessage `<action>` requires the imsg private API bridge“ auslösen, führen Sie `imsg launch` erneut aus – der Helfer kann ausfallen (Neustart von Messages.app, Betriebssystemaktualisierung usw.), und der zwischengespeicherte Status `available: true` bietet weiterhin Aktionen an, bis die nächste Prüfung ihn aktualisiert.

### Wenn SIP aktiviert bleibt

Wenn das Deaktivieren von SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` wechselt in den Basismodus – nur Text, Medien und Empfang.
- Das OpenClaw-Plugin bietet weiterhin das Senden von Text und Medien sowie die Überwachung eingehender Nachrichten an; `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen werden auf der Aktionsoberfläche ausgeblendet (entsprechend der funktionsbezogenen Sperre jeder Methode).
- Sie können einen separaten Mac ohne Apple Silicon (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Arbeitslast betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe unten [Dedizierter macOS-Benutzer für den Bot (separate iMessage-Identität)](#deployment-patterns).

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens einen Eintrag in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` den Wert `"*"` enthält)
    - `disabled`

    Feld für die Zulassungsliste: `channels.imessage.allowFrom`.

    Einträge der Zulassungsliste müssen Absender identifizieren: Handles oder statische Absenderzugriffsgruppen (`accessGroup:<name>`). Verwenden Sie `channels.imessage.groupAllowFrom` für Chat-Ziele wie `chat_id:*`, `chat_guid:*` oder `chat_identifier:*`; verwenden Sie `channels.imessage.groups` für numerische Registrierungsschlüssel vom Typ `chat_id`.

  </Tab>

  <Tab title="Gruppenrichtlinie und Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenverarbeitung:

    - `allowlist` (Standard)
    - `open`
    - `disabled`

    Zulassungsliste für Gruppenabsender: `channels.imessage.groupAllowFrom`.

    Einträge in `groupAllowFrom` können auch auf statische Absenderzugriffsgruppen (`accessGroup:<name>`) verweisen.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, verwenden die Prüfungen von iMessage-Gruppenabsendern `allowFrom`; setzen Sie `groupAllowFrom`, wenn sich die Zulassung für DMs und Gruppen unterscheiden soll. Ein ausdrücklich leeres `groupAllowFrom: []` verwendet keinen Fallback – es blockiert unter `allowlist` alle Gruppenabsender.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, greift die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Das Gruppen-Routing unter `groupPolicy: "allowlist"` durchläuft **zwei** unmittelbar aufeinanderfolgende Sperren:

    1. **Absender-Zulassungsliste** (`channels.imessage.groupAllowFrom`) – Handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` oder `chat_id`. Eine leere effektive Liste (kein `groupAllowFrom` und kein Fallback auf `allowFrom`) blockiert jeden Gruppenabsender.
    2. **Gruppenregistrierung** (`channels.imessage.groups`) – wird erzwungen, sobald die Zuordnung Einträge enthält: Der Chat muss mit einem expliziten Eintrag je `chat_id` oder dem Platzhalter `groups: { "*": { ... } }` übereinstimmen. Wenn `groups` leer ist oder fehlt, entscheidet allein die Absender-Zulassungsliste über die Zulassung.

    Wenn keine effektive Zulassungsliste für Gruppenabsender konfiguriert ist, wird jede Gruppennachricht vor der Registrierungssperre verworfen. Jede Sperre besitzt auf der standardmäßigen Protokollierungsstufe ein eigenes Signal auf `warn`-Ebene, und jedes nennt eine andere Lösung:

    - einmal pro Konto beim Start, wenn die effektive Zulassungsliste für Gruppenabsender leer ist: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` – beheben Sie dies, indem Sie `channels.imessage.groupAllowFrom` (oder `allowFrom`) festlegen; allein das Hinzufügen von Einträgen in `groups` führt dazu, dass Sperre 1 weiterhin jeden Absender blockiert.
    - einmal pro `chat_id` zur Laufzeit, wenn ein Absender Sperre 1 passiert hat, der Chat aber in einer befüllten `groups`-Registrierung fehlt: `imessage: dropping group message from chat_id=<id> ...` – beheben Sie dies, indem Sie diesen `chat_id` (oder `"*"`) unter `channels.imessage.groups` hinzufügen.

    DMs sind nicht betroffen – sie verwenden einen anderen Codepfad.

    Empfohlene Konfiguration für den Gruppenablauf unter `groupPolicy: "allowlist"`:

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

    `groupAllowFrom` allein lässt diese Absender in jeder Gruppe zu; fügen Sie den Block `groups` hinzu, um festzulegen, welche Chats erlaubt sind (und um chatspezifische Optionen wie `requireMention` festzulegen).
    </Warning>

    Erwähnungssperre für Gruppen:

    - iMessage besitzt keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet reguläre Ausdrücke (`agents.entries.*.groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann die Erwähnungssperre nicht erzwungen werden
    - Steuerbefehle autorisierter Absender umgehen die Erwähnungssperre

    Gruppenspezifisches `systemPrompt`:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert eine optionale Zeichenfolge `systemPrompt`, die bei jedem Durchlauf, der eine Nachricht dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt wird. Die Auflösung entspricht `channels.whatsapp.groups`:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Zuordnung vorhanden **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und für diese Gruppe kein System-Prompt angewendet.
    2. **System-Prompt des Gruppenplatzhalters** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag vollständig in der Zuordnung fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Verwenden Sie britische Rechtschreibung." },
            "8421": {
              requireMention: true,
              systemPrompt: "Dies ist der Chat für den Bereitschaftsdienst. Beschränken Sie Antworten auf höchstens 3 Sätze.",
            },
            "9907": {
              // explizite Unterdrückung: Der Platzhalter "Verwenden Sie britische Rechtschreibung." gilt hier nicht
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Gruppenspezifische Prompts gelten nur für Gruppennachrichten – Direktnachrichten sind nicht betroffen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem standardmäßigen `session.dmScope=main` werden iMessage-DMs in der Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der Metadaten des ursprünglichen Kanals und Ziels an iMessage zurückgeleitet.

    Verhalten gruppenähnlicher Threads:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eintreffen.
    Wenn dieser `chat_id` ausdrücklich unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw ihn als Gruppenverkehr (Gruppensperren und Isolation der Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

iMessage-Chats können an ACP-Sitzungen gebunden werden.

Schneller Ablauf für Operatoren:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des zugelassenen Gruppenchats aus.
- Künftige Nachrichten in derselben iMessage-Konversation werden an die gestartete ACP-Sitzung weitergeleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen verwenden Einträge im obersten `bindings[]` mit `type: "acp"` und `match.channel: "imessage"`.

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
  <Accordion title="Dedizierter macOS-Benutzer für den Bot (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen eigenen macOS-Benutzer, damit der Bot-Datenverkehr von Ihrem persönlichen Messages-Profil isoliert bleibt.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer bzw. melden Sie sich bei diesem an.
    2. Melden Sie sich unter diesem Benutzer mit der Apple-ID des Bots bei Messages an.
    3. Installieren Sie `imsg` unter diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Verweisen Sie mit `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Bei der ersten Ausführung sind möglicherweise GUI-Genehmigungen (Automation + Full Disk Access) in der Sitzung dieses Bot-Benutzers erforderlich.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Übliche Topologie:

    - Das Gateway wird unter Linux/in einer VM ausgeführt
    - iMessage + `imsg` werden auf einem Mac in Ihrem Tailnet ausgeführt
    - Der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` ermöglicht das Abrufen von Anhängen per SCP

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
    Stellen Sie zunächst sicher, dass dem Hostschlüssel vertraut wird (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt ist.

  </Accordion>

  <Accordion title="Muster für mehrere Konten">
    iMessage unterstützt eine kontospezifische Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Zulassungslisten für Stammverzeichnisse von Anhängen überschreiben.

  </Accordion>

  <Accordion title="Direktnachrichtenverlauf">
    Legen Sie `channels.imessage.dmHistoryLimit` fest, um neue Direktnachrichtensitzungen mit dem zuletzt decodierten `imsg`-Verlauf dieser Unterhaltung zu initialisieren. Verwenden Sie `channels.imessage.dms["<sender>"].historyLimit` für absenderspezifische Überschreibungen, einschließlich `0`, um den Verlauf für einen Absender zu deaktivieren.

    Der iMessage-DM-Verlauf wird bei Bedarf aus `imsg` abgerufen. Wenn `dmHistoryLimit` nicht festgelegt ist, ist die globale Initialisierung mit dem DM-Verlauf deaktiviert; ein positiver absenderspezifischer Wert für `channels.imessage.dms["<sender>"].historyLimit` aktiviert die Initialisierung für diesen Absender jedoch weiterhin.

  </Accordion>
</AccordionGroup>

## Medien, Aufteilung und Zustellungsziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - Die Verarbeitung eingehender Anhänge ist **standardmäßig deaktiviert** — legen Sie `channels.imessage.includeAttachments: true` fest, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agenten weiterzuleiten. Ist diese Option deaktiviert, werden iMessages, die ausschließlich Anhänge enthalten, verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Protokollzeile.
    - Pfade zu entfernten Anhängen können per SCP abgerufen werden, wenn `remoteHost` festgelegt ist
    - Anhangspfade müssen mit den zulässigen Stammverzeichnissen übereinstimmen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Konfigurierte Stammverzeichnisse erweitern das standardmäßige Stammverzeichnismuster `/Users/*/Library/Messages/Attachments` (sie werden zusammengeführt, nicht ersetzt)
    - SCP verwendet eine strikte Hostschlüsselprüfung (`StrictHostKeyChecking=yes`)
    - Die Größe ausgehender Medien wird durch `channels.imessage.mediaMaxMb` bestimmt (Standardwert 16 MB)

  </Accordion>

  <Accordion title="Ausgehender Text und Aufteilung">
    - Textabschnittslimit: `channels.imessage.textChunkLimit` (Standardwert 4000)
    - Aufteilungsmodus: `channels.imessage.streaming.chunkMode`
      - `length` (Standardwert)
      - `newline` (Aufteilung bevorzugt nach Absätzen)
    - Ausgehende Markdown-Formatierungen für Fett, Kursiv, Unterstrichen und Durchgestrichen werden in nativen formatierten Text umgewandelt (Empfänger unter macOS 15+ stellen die Formatierung dar; ältere Empfänger sehen reinen Text ohne die Markierungen); Markdown-Tabellen werden gemäß dem Markdown-Tabellenmodus des Kanals umgewandelt
    - `channels.imessage.sendTransport` (Standardwert `auto`, `bridge`, `applescript`) legt fest, wie `imsg` Nachrichten zustellt

  </Accordion>

  <Accordion title="Adressierungsformate">
    Bevorzugte explizite Ziele:

    - `chat_id:123` (für stabiles Routing empfohlen)
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle-Ziele werden ebenfalls unterstützt:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Aktionen der privaten API

Wenn `imsg launch` ausgeführt wird und `openclaw channels status --probe` den Wert `privateApi.available: true` meldet, kann das Nachrichtenwerkzeug zusätzlich zum normalen Textversand iMessage-native Aktionen verwenden.

Alle Aktionen sind standardmäßig aktiviert; verwenden Sie `channels.imessage.actions`, um einzelne Aktionen zu deaktivieren:

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
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks werden den Bedeutungen Liebe, Gefällt mir, Gefällt mir nicht, Lachen, Hervorheben und Frage zugeordnet. Beim Entfernen ohne Emoji wird das jeweils festgelegte Tapback gelöscht.
    - **reply**: Eine Antwort in einem Thread auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message` sowie `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Für eine Antwort mit Anhang ist zusätzlich ein `imsg`-Build erforderlich, dessen `send-rich` `--file` unterstützt.
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`). Kurznamen: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Eine gesendete Nachricht unter unterstützten macOS-/privaten API-Versionen bearbeiten (`messageId`, `text` oder `newText`). Nur Nachrichten, die das Gateway selbst gesendet hat, können bearbeitet werden.
    - **unsend**: Eine gesendete Nachricht unter unterstützten macOS-/privaten API-Versionen zurückziehen (`messageId`). Nur Nachrichten, die das Gateway selbst gesendet hat, können zurückgezogen werden.
    - **upload-file**: Medien/Dateien senden (`buffer` als Base64 oder ein aufgelöstes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Veralteter Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenunterhaltung ist. Diese Aktionen ändern die Messages-Identität des Hosts und erfordern daher einen als Eigentümer festgelegten Absender oder einen `operator.admin`-Gateway-Client.
    - **poll**: Eine native Apple-Messages-Umfrage erstellen (`pollQuestion`, `pollOption` 2- bis 12-mal wiederholt sowie `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Empfänger unter iOS/iPadOS/macOS 26+ können sie nativ sehen und darüber abstimmen; ältere Betriebssystemversionen erhalten als Ausweichlösung den Text „Umfrage gesendet“. Erfordert `selectors.pollPayloadMessage`.
    - **poll-vote**: Über eine vorhandene Umfrage abstimmen (`pollId` oder `messageId` sowie genau eines von `pollOptionIndex`, `pollOptionId` oder `pollOptionText`). Erfordert `selectors.pollVoteMessage` und die RPC-Methode `poll.vote`.

    Akzeptierte eingehende Umfragen werden für den Agenten mit der Frage, nummerierten Optionsbeschriftungen, Stimmenzahlen und der für `poll-vote` erforderlichen Umfragenachrichten-ID dargestellt.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Der Kontext eingehender iMessages enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs (`MessageSidFull`), sofern verfügbar. Kurze IDs sind auf den aktuellen SQLite-basierten Antwortcache beschränkt und werden vor der Verwendung anhand des aktuellen Chats geprüft. Wenn eine kurze ID abläuft, versuchen Sie es erneut mit ihrem `MessageSidFull` und geben Sie dabei die Unterhaltung als Ziel an, aus der sie stammt. Vollständige IDs umgehen weder die Unterhaltungs- noch die Kontobindung. Ersetzen Sie daher eine ID aus einem anderen Chat durch eine ID aus dem aktuellen Ziel. Entfernt delegierte Aufrufe können veraltete vollständige IDs ablehnen, wenn keine Nachweise zur aktuellen Unterhaltung verfügbar sind.

  </Accordion>

  <Accordion title="Funktionserkennung">
    OpenClaw blendet Aktionen der privaten API nur aus, wenn der zwischengespeicherte Prüfstatus angibt, dass die Bridge nicht verfügbar ist. Wenn der Status unbekannt ist, bleiben die Aktionen sichtbar und führen Prüfungen bei der Ausführung verzögert durch, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Eingabeanzeige">
    Wenn die Bridge der privaten API aktiv ist, werden akzeptierte eingehende Chats als gelesen markiert, und in direkten Chats wird eine Eingabeanzeige eingeblendet, sobald die Anfrage angenommen wurde, während der Agent den Kontext vorbereitet und die Antwort generiert. Deaktivieren Sie das Markieren als gelesen mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der Liste methodenspezifischer Funktionen erstellt wurden, deaktivieren Eingabeanzeige und Lesebestätigungen stillschweigend. OpenClaw protokolliert pro Neustart einmalig eine Warnung, damit sich die fehlende Bestätigung zuordnen lässt.

  </Accordion>

  <Accordion title="Eingehende Tapbacks">
    OpenClaw abonniert iMessage-Tapbacks und leitet akzeptierte Reaktionen als Systemereignisse statt als normalen Nachrichtentext weiter, sodass ein Benutzer-Tapback keine gewöhnliche Antwortschleife auslöst.

    Der Benachrichtigungsmodus wird durch `channels.imessage.reactionNotifications` gesteuert:

    - `"own"` (Standardwert): Nur benachrichtigen, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren.
    - `"all"`: Bei allen eingehenden Tapbacks autorisierter Absender benachrichtigen.
    - `"off"`: Eingehende Tapbacks ignorieren.

    Kontospezifische Überschreibungen verwenden `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Genehmigungsreaktionen (👍 / 👎)">
    Wenn `approvals.exec.enabled` oder `approvals.plugin.enabled` den Wert „true“ hat und die Anfrage an iMessage weitergeleitet wird, stellt das Gateway eine Genehmigungsaufforderung nativ zu und akzeptiert ein Tapback, um sie zu beantworten:

    - `👍` („Gefällt mir“-Tapback) → `allow-once`
    - `👎` („Gefällt mir nicht“-Tapback) → `deny`
    - `allow-always` bleibt eine manuelle Ausweichmöglichkeit: Senden Sie `/approve <id> allow-always` als reguläre Antwort.

    Für die Verarbeitung von Reaktionen muss das Handle des reagierenden Benutzers ausdrücklich als genehmigungsberechtigt eingetragen sein. Die Liste der Genehmigungsberechtigten wird aus `channels.imessage.allowFrom` (oder `channels.imessage.accounts.<id>.allowFrom`) gelesen. Fügen Sie die Telefonnummer des Benutzers im E.164-Format oder seine Apple-ID-E-Mail-Adresse hinzu (Chatziele wie `chat_id:*` sind keine gültigen Einträge für Genehmigungsberechtigte). Der Platzhaltereintrag `"*"` wird berücksichtigt, erlaubt jedoch jedem Absender die Genehmigung; eine leere Liste der Genehmigungsberechtigten deaktiviert die Reaktionsverknüpfung vollständig. Die Reaktionsverknüpfung umgeht absichtlich `reactionNotifications`, `dmPolicy` und `groupAllowFrom`, da ausschließlich die explizite Zulassungsliste der Genehmigungsberechtigten für die Auflösung von Genehmigungen maßgeblich ist.

    Die Autorisierung des Textbefehls `/approve` folgt derselben Liste: Wenn `channels.imessage.allowFrom` nicht leer ist, wird `/approve <id> <decision>` anhand dieser Liste der Genehmigungsberechtigten autorisiert (nicht anhand der umfassenderen DM-Zulassungsliste), und Absender, die in der DM-Zulassungsliste, aber nicht in `allowFrom` zugelassen sind, erhalten eine ausdrückliche Ablehnung. Wenn `allowFrom` leer ist, bleibt die Ausweichregel für denselben Chat aktiv und `/approve` autorisiert alle Personen, die von der DM-Zulassungsliste zugelassen werden. Fügen Sie jeden Operator, der Genehmigungen erteilen soll – über `/approve` oder über Reaktionen –, zu `allowFrom` hinzu.

    Hinweise für Betreiber:
    - Die Reaktionszuordnung wird sowohl im Arbeitsspeicher als auch im persistenten schlüsselbasierten Speicher des Gateways gespeichert (die TTL entspricht dem Ablaufzeitpunkt der Genehmigung). Außerdem fragt das Gateway ausstehende Eingabeaufforderungen auf Tapbacks ab, sodass ein Tapback, das kurz nach einem Neustart des Gateways eingeht, die Genehmigung weiterhin auflöst.
    - Das eigene `is_from_me=true`-Tapback des Betreibers (beispielsweise von einem gekoppelten Apple-Gerät) löst die Genehmigung auf, wenn dieses Handle ausdrücklich als genehmigungsberechtigt festgelegt ist.
    - Genehmigungsaufforderungen werden nur dann an eine Gruppenunterhaltung weitergeleitet, wenn ausdrücklich Genehmigungsberechtigte konfiguriert sind; andernfalls könnte jedes Gruppenmitglied genehmigen.
    - Ältere textbasierte Tapbacks (`Liked "…"`-Klartext von sehr alten Apple-Clients) können Genehmigungen nicht auflösen, da sie keine Nachrichten-GUID enthalten; die Reaktionsauflösung erfordert die strukturierten Tapback-Metadaten, die aktuelle macOS-/iOS-Clients ausgeben.

  </Accordion>

  <Accordion title="Reaktionen auf Fragen (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    Für eine `ask_user`-Eingabeaufforderung mit einer einzelnen, nicht geheimen Einfachauswahlfrage und ein bis vier Optionen fügt OpenClaw nummerierte Emoji-Auswahlmöglichkeiten hinzu. Reagieren Sie auf die zugestellte Eingabeaufforderung mit der entsprechenden Nummer, um die Frage zu beantworten. Die Reaktion muss die stabile GUID der vom Bot verfassten Nachricht enthalten; OpenClaw ordnet die Nummer anschließend über das Gateway der kanonischen Option zu. Veraltete oder doppelte Tippaktionen werden ignoriert.

    Eingabeaufforderungen mit mehreren Fragen, Mehrfachauswahl oder Freitext können weiterhin nur per Textantwort beantwortet werden. Reaktionen auf Fragen unterliegen den normalen Zulassungsregeln für iMessage-Direktnachrichten und -Gruppen. Sie werden auch erkannt, wenn die allgemeine Einstellung `reactionNotifications` den Wert `"off"` hat, ohne dass dadurch nicht zugehörige Reaktionen in Agentenereignisse umgewandelt werden.

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

## Zusammenführen aufgeteilter Direktnachrichten (Befehl + URL in einer Nachricht)

Apple kann einen Befehl und dessen URL-Vorschau als separate physische `chat.db`-Zeilen speichern. `imsg` 0.13.1 und neuer führt diese Zeilen zusammen, bevor die Nachricht von der Überwachung, dem Verlauf oder der Suche zurückgegeben wird. Dadurch empfängt OpenClaw eine einzige logische eingehende Nachricht, ohne kanalspezifische Latenz für Direktnachrichten hinzuzufügen.

Für iMessage ist keine Einstellung zum Zusammenführen erforderlich. Der stillgelegte Schlüssel `channels.imessage.coalesceSameSenderDms` wird von `openclaw doctor --fix` entfernt. Die generische `messages.inbound`-Entprellung bleibt verfügbar, wenn Sie schnelle aufeinanderfolgende Textnachrichten kanalweit absichtlich bündeln möchten.

Wenn Sendungen aus Befehl und URL als separate Agentendurchläufe eingehen, aktualisieren Sie `imsg` auf dem Messages-Mac:

```bash
brew update && brew upgrade imsg
```

## Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways

iMessage stellt Nachrichten wieder her, die während des Ausfalls des Gateways verpasst wurden, und unterdrückt gleichzeitig die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann. Dieses Standardverhalten ist immer aktiviert und basiert auf dauerhaftem Eingangsspeicher sowie einer Altersgrenze.

- **Dauerhafter Schutz vor wiederholter Verarbeitung.** Bevor OpenClaw den Wiederherstellungszeiger weitersetzt, protokolliert es jede Rohzeile in der gemeinsamen SQLite-Eingangswarteschlange und verwendet deren Apple-GUID als Ereignis-ID. Eine abgeschlossene Zeile hinterlässt für etwa 4 Stunden einen Tombstone; die Anzahl ist auf 10.000 Einträge begrenzt. Dadurch wird eine Wiederholung mit derselben GUID auch nach einem Neustart verworfen. Eine ausstehende Zeile bleibt wiederherstellbar, bis die Weiterleitung sie übernimmt.
- **Wiederherstellung nach Ausfallzeiten.** Beim Start merkt sich die Überwachung die Zeilen-ID der zuletzt dauerhaft zugelassenen `chat.db`-Zeile (ein persistenter Cursor pro Konto) und übergibt sie als `since_rowid` an `imsg watch.subscribe`, sodass imsg Zeilen wiedergibt, die noch nicht protokolliert wurden, und anschließend neue Ereignisse fortlaufend verfolgt. Vor einem Absturz protokollierte Zeilen werden aus SQLite fortgesetzt. Die Wiedergabe ist auf die neuesten 500 Zeilen und auf Nachrichten beschränkt, die höchstens etwa 2 Stunden alt sind; GUID-Tombstones verwerfen alle bereits verarbeiteten Einträge.
- **Altersgrenze für veralteten Rückstau.** Zeilen oberhalb der Startgrenze sind tatsächlich aktuell; wenn das Sendedatum einer solchen Zeile mehr als etwa 15 Minuten vor ihrem Eingangszeitpunkt liegt, handelt es sich um den durch den Push-Flush verursachten Rückstau und die Zeile wird unterdrückt. Wiedergegebene Zeilen (an oder unterhalb der Grenze) verwenden stattdessen das größere Wiederherstellungsfenster. Dadurch wird eine kürzlich verpasste Nachricht zugestellt, während sehr alte Verlaufsdaten nicht zugestellt werden.

Die Wiederherstellung funktioniert sowohl bei lokalen als auch bei entfernten `cliPath`-Konfigurationen, da die `since_rowid`-Wiedergabe über dieselbe `imsg`-RPC-Verbindung erfolgt. Der Unterschied liegt im Zeitfenster: Wenn das Gateway `chat.db` lesen kann (lokal), verankert es die Zeilen-ID-Startgrenze, begrenzt den Wiedergabebereich und stellt verpasste Nachrichten zu, die bis zu einigen Stunden alt sind. Bei einer entfernten SSH-`cliPath`-Verbindung kann es die Datenbank nicht lesen. Daher ist die Wiedergabe nicht begrenzt und jede Zeile verwendet die Altersgrenze für aktuelle Nachrichten. Kürzlich verpasste Nachrichten werden weiterhin wiederhergestellt und alter Rückstau weiterhin unterdrückt, allerdings mit dem kleineren Zeitfenster für aktuelle Nachrichten. Führen Sie das Gateway auf dem Messages-Mac aus, um das größere Wiederherstellungsfenster zu verwenden.

### Für Betreiber sichtbares Signal

Unterdrückter Rückstau wird auf der standardmäßigen Protokollierungsstufe erfasst und niemals stillschweigend verworfen (das Flag `recovery` zeigt, welches Fenster angewendet wurde):

```text
imessage: veralteter eingehender Rückstau unterdrückt account=<id> sent=<iso> recovery=<bool> (<N> seit dem Start unterdrückt)
```

### Migration

`channels.imessage.catchup.*` ist veraltet – die Wiederherstellung nach Ausfallzeiten erfolgt automatisch und erfordert bei neuen Konfigurationen keine Einstellungen. Vorhandene Konfigurationen mit `catchup.enabled: true` werden weiterhin als Kompatibilitätsprofil für das Wiederherstellungs-Wiedergabefenster berücksichtigt. Deaktivierte Nachholblöcke (`enabled: false` oder ohne `enabled: true`) sind stillgelegt; `openclaw doctor --fix` entfernt sie.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Überprüfen Sie die Binärdatei und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Prüfung meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn Aktionen der privaten API nicht verfügbar sind, führen Sie `imsg launch` in der Sitzung des angemeldeten macOS-Benutzers aus und prüfen Sie erneut. Wenn das Gateway nicht unter macOS ausgeführt wird, verwenden Sie stattdessen die oben beschriebene Einrichtung eines entfernten Macs über SSH und nicht den standardmäßigen lokalen `imsg`-Pfad.

  </Accordion>

  <Accordion title="Nachrichten werden gesendet, aber eingehende iMessages kommen nicht an">
    Prüfen Sie zunächst, ob die Nachricht den lokalen Mac erreicht hat. Wenn sich `chat.db` nicht ändert, kann OpenClaw die Nachricht nicht empfangen, selbst wenn `imsg status --json` eine fehlerfrei funktionierende Bridge meldet.

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

    Senden Sie eine neue iMessage vom Telefon und bestätigen Sie eine neue `chat.db`-Zeile oder ein neues `imsg watch`-Ereignis, bevor Sie OpenClaw-Sitzungen debuggen. Führen Sie dies nicht als regelmäßige Schleife zum Neustart der Bridge aus. Wiederholte `imsg launch` zusammen mit Gateway-Neustarts während aktiver Vorgänge können Zustellungen unterbrechen und laufende Kanalausführungen blockieren.

  </Accordion>

  <Accordion title="Gateway wird unter macOS nicht ausgeführt">
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
    Prüfen Sie Folgendes:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Kopplungsgenehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` Verhalten der Positivliste
    - Konfiguration des Erwähnungsmusters (`agents.entries.*.groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Hostschlüssel ist in `~/.ssh/known_hosts` auf dem Gateway-Host vorhanden
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Messages ausgeführt wird

  </Accordion>

  <Accordion title="macOS-Berechtigungsabfragen wurden übersehen">
    Führen Sie die Befehle erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Abfragen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Vergewissern Sie sich, dass Festplattenvollzugriff und Automation für den Prozesskontext gewährt sind, in dem OpenClaw/`imsg` ausgeführt wird.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz – iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — Ankündigung und Zusammenfassung der Migration
- [Wechsel von BlueBubbles](/de/channels/imessage-from-bluebubbles) — Tabelle zur Konfigurationsübertragung und schrittweise Umstellung
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Steuerung durch Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Absicherung
