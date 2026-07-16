---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen von iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio) mit Aktionen über private APIs für Antworten, Tapbacks, Effekte, Umfragen, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Einrichtungen, wenn die Hostanforderungen erfüllt sind.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T12:22:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Für die übliche OpenClaw-iMessage-Bereitstellung führen Sie den Gateway und `imsg` auf demselben angemeldeten macOS-Messages-Host aus. Wenn Ihr Gateway an anderer Stelle ausgeführt wird, verweisen Sie `channels.imessage.cliPath` auf einen transparenten SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Die Wiederherstellung eingehender Nachrichten erfolgt automatisch.** Nach einem Neustart der Bridge oder des Gateways spielt iMessage die während des Ausfalls verpassten Nachrichten erneut ab und unterdrückt den veralteten „Backlog-Bombardement“, den Apple nach einer Push-Wiederherstellung ausgeben kann. Dabei werden Duplikate entfernt, sodass nichts zweimal weitergeleitet wird. Es muss keine Konfiguration aktiviert werden – siehe [Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Die Unterstützung für BlueBubbles wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage ausschließlich über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder mit [Wechsel von BlueBubbles](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native Integration einer externen CLI. Der Gateway startet `imsg rpc` und kommuniziert über stdio mittels JSON-RPC – ohne separaten Daemon oder Port. Der Modus für die private API wird für einen vollständigen iMessage-Kanal dringend empfohlen; Antworten, Tapbacks, Effekte, Umfragen, Antworten auf Anhänge und Gruppenaktionen erfordern `imsg launch` sowie eine erfolgreiche Prüfung der privaten API.

Für die übliche lokale Einrichtung kann die OpenClaw-Einrichtung eine vom Benutzer bestätigte Homebrew-Installation oder -Aktualisierung von `imsg` auf dem angemeldeten Messages-Mac anbieten. Die manuelle Einrichtung und Topologien mit SSH-Wrapper werden weiterhin vom Betreiber verwaltet: Installieren oder aktualisieren Sie `imsg` im selben Benutzerkontext, in dem der Gateway oder Wrapper ausgeführt wird.

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
    Die meisten Einrichtungen benötigen kein SSH. Verwenden Sie diese Topologie nur, wenn der Gateway nicht auf dem angemeldeten Messages-Mac ausgeführt werden kann. OpenClaw benötigt lediglich ein stdio-kompatibles `cliPath`, sodass Sie `cliPath` auf ein Wrapper-Skript verweisen können, das per SSH eine Verbindung zu einem entfernten Mac herstellt und `imsg` ausführt.
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
      remoteHost: "user@gateway-host", // für das Abrufen von Anhängen per SCP verwendet
      includeAttachments: true,
      // Optional: zusätzliche zulässige Stammverzeichnisse für Anhänge (werden mit dem
      // Standardverzeichnis /Users/*/Library/Messages/Attachments zusammengeführt).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht festgelegt ist, versucht OpenClaw, es durch Analysieren des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen); unsichere Werte werden ignoriert.
    OpenClaw verwendet für SCP eine strenge Hostschlüsselprüfung, daher muss der Hostschlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden anhand der zulässigen Stammverzeichnisse (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

<Warning>
Jeder `cliPath`-Wrapper oder SSH-Proxy, den Sie `imsg` vorschalten, MUSS sich für langlebiges JSON-RPC wie eine transparente stdio-Pipe verhalten. OpenClaw tauscht während der gesamten Lebensdauer des Kanals kleine, durch Zeilenumbrüche begrenzte JSON-RPC-Nachrichten über stdin/stdout des Wrappers aus:

- Leiten Sie jeden stdin-Block bzw. jede stdin-Zeile **sofort weiter, sobald Bytes verfügbar sind** – warten Sie nicht auf EOF.
- Leiten Sie jeden stdout-Block bzw. jede stdout-Zeile umgehend in die Gegenrichtung weiter.
- Behalten Sie Zeilenumbrüche bei.
- Vermeiden Sie blockierende Lesevorgänge mit fester Größe (`read(4096)`, `cat | buffer`, standardmäßiges Shell-`read`), durch die kleine Frames nicht verarbeitet werden können.
- Halten Sie stderr vom JSON-RPC-stdout-Datenstrom getrennt.

Ein Wrapper, der stdin puffert, bis ein großer Block gefüllt ist, verursacht Symptome, die wie ein iMessage-Ausfall wirken – `imsg rpc timeout (chats.list)` oder wiederholte Kanalneustarts –, obwohl `imsg rpc` selbst ordnungsgemäß funktioniert. `ssh -T host imsg "$@"` (oben) ist sicher, da es die `cliPath`-Argumente von OpenClaw wie `rpc` und `--db` weiterleitet. Pipelines wie `ssh host imsg | grep -v '^DEBUG'` sind NICHT sicher – zeilengepufferte Tools können Frames dennoch zurückhalten; verwenden Sie `stdbuf -oL -eL` in jeder Stufe, wenn Sie filtern müssen.
</Warning>

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Vollzugriff auf die Festplatte ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` ausgeführt wird (Zugriff auf die Messages-Datenbank).
- Die Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (Reaktion / Bearbeiten / Senden rückgängig machen / Antwort im Thread / Effekte / Umfragen / Gruppenaktionen) muss der Systemintegritätsschutz deaktiviert sein – siehe [Private API von imsg aktivieren](#enabling-the-imsg-private-api). Das grundlegende Senden und Empfangen von Text und Medien funktioniert ohne diese Deaktivierung.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn der Gateway ohne Benutzeroberfläche ausgeführt wird (LaunchAgent/SSH), führen Sie einmalig einen interaktiven Befehl im selben Kontext aus, um die Eingabeaufforderungen auszulösen:

```bash
imsg chats --limit 1
# oder
imsg send <handle> "test"
```

</Tip>

<Accordion title="Senden über SSH-Wrapper schlägt mit AppleEvents -1743 fehl">
  Eine Einrichtung mit entferntem SSH-Zugriff kann Chats lesen, `channels status --probe` bestehen und eingehende Nachrichten verarbeiten, während ausgehende Sendungen weiterhin mit einem AppleEvents-Autorisierungsfehler fehlschlagen:

```text
Nicht autorisiert, Apple-Ereignisse an Messages zu senden. (-1743)
```

Überprüfen Sie die TCC-Datenbank des angemeldeten Mac-Benutzers oder System Settings > Privacy & Security > Automation. Wenn der Automatisierungseintrag für `/usr/libexec/sshd-keygen-wrapper` anstelle des `imsg`- oder lokalen Shell-Prozesses erfasst ist, zeigt macOS möglicherweise keinen verwendbaren Messages-Schalter für diesen serverseitigen SSH-Client an:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In diesem Zustand können die Wiederholung von `tccutil reset AppleEvents` oder die erneute Ausführung von `imsg send` über denselben SSH-Wrapper weiterhin fehlschlagen, da der Prozesskontext, der die Messages-Automatisierung benötigt, der SSH-Wrapper ist und keine App, der die Benutzeroberfläche die Berechtigung erteilen kann.

Verwenden Sie stattdessen einen der unterstützten `imsg`-Prozesskontexte:

- Führen Sie den Gateway oder zumindest die `imsg`-Bridge in der lokalen Sitzung des angemeldeten Messages-Benutzers aus.
- Starten Sie den Gateway mit einem LaunchAgent für diesen Benutzer, nachdem Sie in derselben Sitzung Vollzugriff auf die Festplatte und die Automatisierungsberechtigung erteilt haben.
- Wenn Sie die SSH-Topologie mit zwei Benutzern beibehalten, überprüfen Sie, dass ein tatsächlicher ausgehender `imsg send`-Vorgang über genau diesen Wrapper erfolgreich ist, bevor Sie den Kanal aktivieren. Wenn ihm die Automatisierungsberechtigung nicht erteilt werden kann, konfigurieren Sie stattdessen eine `imsg`-Einrichtung mit einem einzelnen Benutzer, anstatt sich beim Senden auf den SSH-Wrapper zu verlassen.

</Accordion>

## Private API von imsg aktivieren

`imsg` wird mit zwei Betriebsmodi ausgeliefert. Für OpenClaw ist der Modus für die private API die empfohlene Einrichtung, da er dem Kanal die nativen iMessage-Aktionen bereitstellt, die Benutzer erwarten. Der Basismodus bleibt für Installationen mit geringem Risiko, die erste Überprüfung oder Hosts nützlich, auf denen SIP nicht deaktiviert werden kann.

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehende Texte und Medien über `send`, Überwachung/Verlauf eingehender Nachrichten, Chatliste. Dies erhalten Sie standardmäßig mit einem neuen `brew install steipete/tap/imsg` und den oben genannten standardmäßigen macOS-Berechtigungen.
- **Modus für die private API**: `imsg` injiziert eine Hilfs-Dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (in Threads), `sendWithEffect`, `poll` und `poll-vote` (native Messages-Umfragen), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Der auf dieser Seite empfohlene Aktionsumfang erfordert den Modus für die private API. Die README zu `imsg` beschreibt die Anforderung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, durch die Bridge unterstütztes Senden angereicherter Inhalte, Nachrichtenänderungen und Chatverwaltung müssen explizit aktiviert werden. Sie erfordern, dass SIP deaktiviert und eine Hilfs-Dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Technik zur Injektion der Hilfskomponente verwendet die eigene Dylib von `imsg`, um auf private Messages-APIs zuzugreifen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieterserver und keine BlueBubbles-Laufzeit.

<Warning>
**Das Deaktivieren von SIP ist mit einem echten Sicherheitskompromiss verbunden.** SIP ist einer der zentralen Schutzmechanismen von macOS gegen die Ausführung veränderten Systemcodes; seine systemweite Deaktivierung eröffnet zusätzliche Angriffsflächen und Nebenwirkungen. Insbesondere gilt: **Durch das Deaktivieren von SIP auf Macs mit Apple Silicon wird auch die Möglichkeit deaktiviert, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Betrachten Sie dies als bewusste betriebliche Entscheidung, insbesondere auf einem primären privaten Mac. Für eine produktionsgerechte OpenClaw-iMessage-Umgebung sollten Sie einen dedizierten Mac oder einen macOS-Bot-Benutzer bevorzugen, bei dem Sie die Bridge bedenkenlos aktivieren können. Wenn Ihr Bedrohungsmodell nicht zulässt, dass SIP irgendwo deaktiviert ist, ist das integrierte iMessage auf den Basismodus beschränkt – nur das Senden und Empfangen von Text und Medien, keine Reaktionen / Bearbeitungen / Rücknahme des Sendens / Effekte / Gruppenaktionen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und `selectors` pro Methode, sodass Sie vor dem Start sehen können, was der aktuelle Build unterstützt.

2. **Deaktivieren Sie den Systemintegritätsschutz und (auf modernen macOS-Versionen) die Bibliotheksvalidierung.** Das Einschleusen einer nicht von Apple stammenden Hilfs-Dylib in die von Apple signierte `Messages.app` erfordert, dass SIP deaktiviert **und** die Bibliotheksvalidierung gelockert ist. Der SIP-Schritt im Wiederherstellungsmodus hängt von der macOS-Version ab:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Deaktivieren Sie die Bibliotheksvalidierung über das Terminal, starten Sie im Wiederherstellungsmodus neu, führen Sie `csrutil disable` aus und starten Sie erneut.
   - **macOS 11+ (Big Sur und neuer), Intel:** Öffnen Sie den Wiederherstellungsmodus (oder die Internetwiederherstellung), führen Sie `csrutil disable` aus und starten Sie neu.
   - **macOS 11+, Apple Silicon:** Verwenden Sie die Startsequenz über den Ein-/Ausschalter, um die Wiederherstellung aufzurufen; halten Sie bei neueren macOS-Versionen beim Klicken auf Continue die Taste **Left Shift** gedrückt und führen Sie anschließend `csrutil disable` aus. Für virtuelle Maschinen gilt ein separater Ablauf; erstellen Sie daher zuerst einen VM-Snapshot.

   **Unter macOS 11 und neuer reicht `csrutil disable` allein normalerweise nicht aus.** Apple erzwingt für `Messages.app` als Plattformbinärdatei weiterhin die Bibliotheksvalidierung, sodass eine ad hoc signierte Hilfskomponente selbst bei deaktiviertem SIP abgelehnt wird (`Library Validation failed: ... platform binary, but mapped file is not`). Deaktivieren Sie nach SIP auch die Bibliotheksvalidierung und starten Sie neu:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), unter 26.5.1 verifiziert:** Deaktiviertes SIP **zusammen mit** dem obigen Befehl `DisableLibraryValidation` reicht aus, um die Hilfskomponente unter allen Versionen von 26.0 bis 26.5.x einzuschleusen. **Es sind keine Boot-Argumente erforderlich.** Die plist ist der entscheidende Faktor und der am häufigsten fehlende Schritt, wenn das Einschleusen unter Tahoe fehlschlägt:
   - **Mit der plist:** `imsg launch` schleust die Komponente ein und `imsg status` meldet `advanced_features: true`.
   - **Ohne die plist (selbst bei deaktiviertem SIP):** `imsg launch` schlägt mit `Failed to launch: Timeout waiting for Messages.app to initialize` fehl. AMFI lehnt die ad hoc signierte Hilfskomponente beim Laden ab, sodass die Bridge nie bereit wird und der Start wegen Zeitüberschreitung fehlschlägt. Diese Zeitüberschreitung tritt bei den meisten Personen unter Tahoe auf; die Lösung ist die obige plist und keine drastischere Maßnahme.

   Wenn das Einschleusen von `imsg launch` oder bestimmte `selectors` nach einem macOS-Upgrade beginnen, „false“ zurückzugeben, ist diese Sperre gewöhnlich die Ursache. Prüfen Sie den Zustand von SIP und Bibliotheksvalidierung, bevor Sie annehmen, dass der SIP-Schritt selbst fehlgeschlagen ist. Wenn diese Einstellungen korrekt sind und die Bridge weiterhin nichts einschleusen kann, erfassen Sie `imsg status --json` sowie die Ausgabe von `imsg launch` und melden Sie dies dem Projekt `imsg`, statt weitere systemweite Sicherheitskontrollen zu schwächen.

3. **Schleusen Sie die Hilfskomponente ein.** Wenn SIP deaktiviert und Messages.app angemeldet ist:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert das Einschleusen, solange SIP aktiviert ist. Dies dient daher zugleich als Bestätigung, dass Schritt 2 wirksam wurde.

4. **Überprüfen Sie die Bridge über OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '{rpc_methods, selectors}'` sollte die von Ihrem macOS-Build bereitgestellten Fähigkeiten anzeigen. Das Erstellen von Umfragen erfordert `selectors.pollPayloadMessage`; das Abstimmen erfordert sowohl `selectors.pollVoteMessage` als auch die RPC-Methode `poll.vote`. Das OpenClaw-Plugin bietet nur Aktionen an, die von der zwischengespeicherten Prüfung unterstützt werden; ein leerer Cache bleibt dagegen optimistisch und prüft beim ersten Versand.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen bei der Ausführung jedoch „iMessage `<action>` requires the imsg private API bridge“ auslösen, führen Sie `imsg launch` erneut aus — die Hilfskomponente kann ausfallen (Neustart von Messages.app, Betriebssystemaktualisierung usw.), während der zwischengespeicherte Status `available: true` weiterhin Aktionen anbietet, bis die nächste Prüfung ihn aktualisiert.

### Wenn SIP aktiviert bleibt

Wenn das Deaktivieren von SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` wechselt in den Basismodus zurück — nur Text, Medien und Empfang.
- Das OpenClaw-Plugin bietet weiterhin den Versand von Text und Medien sowie die Überwachung eingehender Nachrichten an; es blendet `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (entsprechend der Fähigkeitssperre pro Methode).
- Sie können für die iMessage-Arbeitslast einen separaten Mac ohne Apple Silicon (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP betreiben und SIP auf Ihren primären Geräten aktiviert lassen. Siehe unten [Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)](#deployment-patterns).

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="Richtlinie für Direktnachrichten">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist` (erfordert mindestens einen Eintrag in `allowFrom`)
    - `open` (erfordert, dass `allowFrom` den Wert `"*"` enthält)
    - `disabled`

    Zulassungslistenfeld: `channels.imessage.allowFrom`.

    Einträge in der Zulassungsliste müssen Absender identifizieren: Handles oder statische Absenderzugriffsgruppen (`accessGroup:<name>`). Verwenden Sie `channels.imessage.groupAllowFrom` für Chatziele wie `chat_id:*`, `chat_guid:*` oder `chat_identifier:*`; verwenden Sie `channels.imessage.groups` für numerische Registrierungsschlüssel von `chat_id`.

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenverarbeitung:

    - `allowlist` (Standard)
    - `open`
    - `disabled`

    Zulassungsliste für Gruppenabsender: `channels.imessage.groupAllowFrom`.

    Einträge in `groupAllowFrom` können auch auf statische Absenderzugriffsgruppen (`accessGroup:<name>`) verweisen.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht festgelegt ist, verwenden die Prüfungen von iMessage-Gruppenabsendern `allowFrom`; legen Sie `groupAllowFrom` fest, wenn für Direktnachrichten und Gruppen unterschiedliche Zulassungsregeln gelten sollen. Ein ausdrücklich leeres `groupAllowFrom: []` verwendet keinen Fallback — es blockiert unter `allowlist` alle Gruppenabsender.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

    <Warning>
    Das Gruppen-Routing unter `groupPolicy: "allowlist"` führt **zwei** Prüfungen unmittelbar nacheinander aus:

    1. **Absender-Zulassungsliste** (`channels.imessage.groupAllowFrom`) — Handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` oder `chat_id`. Eine leere effektive Liste (kein `groupAllowFrom` und kein Fallback auf `allowFrom`) blockiert jeden Gruppenabsender.
    2. **Gruppenregister** (`channels.imessage.groups`) — wird erzwungen, sobald die Zuordnung Einträge enthält: Der Chat muss mit einem expliziten Eintrag pro `chat_id` oder einem Platzhalter `groups: { "*": { ... } }` übereinstimmen. Wenn `groups` leer ist oder fehlt, entscheidet allein die Absender-Zulassungsliste über den Zugriff.

    Wenn keine wirksame Zulassungsliste für Gruppenabsender konfiguriert ist, wird jede Gruppennachricht vor der Registerprüfung verworfen. Jede Prüfung verfügt auf der standardmäßigen Protokollierungsstufe über ein eigenes Signal der Stufe `warn`, und jede nennt eine andere Fehlerbehebung:

    - einmal pro Account beim Start, wenn die effektive Absender-Positivliste für Gruppen leer ist: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — beheben Sie dies, indem Sie `channels.imessage.groupAllowFrom` (oder `allowFrom`) festlegen; wenn Sie ausschließlich `groups`-Einträge hinzufügen, blockiert Gate 1 weiterhin jeden Absender.
    - einmal pro `chat_id` zur Laufzeit, wenn ein Absender Gate 1 passiert hat, der Chat jedoch in einer befüllten `groups`-Registry fehlt: `imessage: dropping group message from chat_id=<id> ...` — beheben Sie dies, indem Sie diese `chat_id` (oder `"*"`) unter `channels.imessage.groups` hinzufügen.

    DMs sind nicht betroffen — sie verwenden einen anderen Codepfad.

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

    `groupAllowFrom` allein lässt diese Absender in jeder Gruppe zu; fügen Sie den `groups`-Block hinzu, um festzulegen, welche Chats zulässig sind (und um chatspezifische Optionen wie `requireMention` festzulegen).
    </Warning>

    Erwähnungs-Gating für Gruppen:

    - iMessage verfügt über keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, ersatzweise `messages.groupChat.mentionPatterns`)
    - wenn keine Muster konfiguriert sind, kann das Erwähnungs-Gating nicht erzwungen werden
    - Steuerbefehle autorisierter Absender umgehen das Erwähnungs-Gating

    Gruppenspezifisches `systemPrompt`:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert eine optionale `systemPrompt`-Zeichenfolge, die bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt wird. Die Auflösung entspricht `channels.whatsapp.groups`:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Zuordnung vorhanden **und** sein `systemPrompt`-Schlüssel definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und auf diese Gruppe kein System-Prompt angewendet.
    2. **System-Prompt für den Gruppenplatzhalter** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag vollständig in der Zuordnung fehlt oder wenn er vorhanden ist, aber keinen `systemPrompt`-Schlüssel definiert.

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
              systemPrompt: "Dies ist der Chat für den Bereitschaftsdienst. Beschränken Sie Antworten auf weniger als 3 Sätze.",
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

    Gruppenspezifische Prompts gelten nur für Gruppennachrichten — Direktnachrichten sind nicht betroffen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem standardmäßigen `session.dmScope=main` werden iMessage-DMs in der Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden mithilfe der Metadaten des ursprünglichen Kanals und Ziels zurück an iMessage geleitet.

    Verhalten von gruppenähnlichen Threads:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eingehen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating und Isolation der Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

iMessage-Chats können an ACP-Sitzungen gebunden werden.

Schneller Ablauf für Operatoren:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des zulässigen Gruppenchats aus.
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
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit der Bot-Datenverkehr von Ihrem persönlichen Nachrichtenprofil getrennt bleibt.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer bzw. melden Sie sich bei diesem an.
    2. Melden Sie sich in diesem Benutzer mit der Bot-Apple-ID bei Messages an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Verweisen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Beim ersten Start können in der Sitzung dieses Bot-Benutzers GUI-Genehmigungen (Automation + Full Disk Access) erforderlich sein.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Übliche Topologie:

    - Der Gateway läuft unter Linux/in einer VM
    - iMessage + `imsg` laufen auf einem Mac in Ihrem Tailnet
    - Der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` ermöglicht den Abruf von Anhängen per SCP

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
    Stellen Sie zuerst sicher, dass dem Hostschlüssel vertraut wird (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt ist.

  </Accordion>

  <Accordion title="Muster für mehrere Konten">
    iMessage unterstützt eine kontospezifische Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Positivlisten für Anhangsstammverzeichnisse überschreiben.

  </Accordion>

  <Accordion title="Direktnachrichtenverlauf">
    Legen Sie `channels.imessage.dmHistoryLimit` fest, um neue Direktnachrichtensitzungen mit dem zuletzt dekodierten `imsg`-Verlauf dieser Unterhaltung zu initialisieren. Verwenden Sie `channels.imessage.dms["<sender>"].historyLimit` für absenderspezifische Überschreibungen, einschließlich `0`, um den Verlauf für einen Absender zu deaktivieren.

    Der iMessage-Direktnachrichtenverlauf wird bei Bedarf aus `imsg` abgerufen. Wenn `dmHistoryLimit` nicht festgelegt ist, wird die globale Initialisierung mit dem Direktnachrichtenverlauf deaktiviert; ein positiver absenderspezifischer Wert für `channels.imessage.dms["<sender>"].historyLimit` aktiviert die Initialisierung für diesen Absender dennoch.

  </Accordion>
</AccordionGroup>

## Medien, Aufteilung und Zustellungsziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - Die Verarbeitung eingehender Anhänge ist **standardmäßig deaktiviert** — legen Sie `channels.imessage.includeAttachments: true` fest, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agenten weiterzuleiten. Wenn sie deaktiviert ist, werden iMessages, die nur Anhänge enthalten, verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Protokollzeile.
    - Entfernte Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` festgelegt ist
    - Anhangspfade müssen zulässigen Stammverzeichnissen entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Konfigurierte Stammverzeichnisse erweitern das standardmäßige Stammverzeichnismuster `/Users/*/Library/Messages/Attachments` (zusammengeführt, nicht ersetzt)
    - SCP verwendet eine strikte Hostschlüsselprüfung (`StrictHostKeyChecking=yes`)
    - Die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard: 16 MB)

  </Accordion>

  <Accordion title="Ausgehender Text und Aufteilung">
    - Textsegmentlimit: `channels.imessage.textChunkLimit` (Standard: 4000)
    - Aufteilungsmodus: `channels.imessage.streaming.chunkMode`
      - `length` (Standard)
      - `newline` (absatzorientierte Aufteilung)
    - Ausgehende Markdown-Formatierungen für Fett, Kursiv, Unterstrichen und Durchgestrichen werden in nativen formatierten Text konvertiert (Empfänger unter macOS 15+ stellen die Formatierung dar; ältere Empfänger sehen Klartext ohne die Markierungen); Markdown-Tabellen werden entsprechend dem Markdown-Tabellenmodus des Kanals konvertiert
    - `channels.imessage.sendTransport` (`auto` als Standard, `bridge`, `applescript`) legt fest, wie `imsg` Sendungen zustellt

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

Wenn `imsg launch` ausgeführt wird und `openclaw channels status --probe` den Wert `privateApi.available: true` meldet, kann das Nachrichtenwerkzeug zusätzlich zum normalen Textversand native iMessage-Aktionen verwenden.

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
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks entsprechen „Liebe“, „Gefällt mir“, „Gefällt mir nicht“, „Lachen“, „Hervorheben“ und „Frage“. Beim Entfernen ohne Emoji wird das jeweils gesetzte Tapback gelöscht.
    - **reply**: Eine Thread-Antwort auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message`, zusätzlich `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Für eine Antwort mit Anhang ist zusätzlich ein `imsg`-Build erforderlich, dessen `send-rich` `--file` unterstützt.
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`). Kurznamen: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Eine gesendete Nachricht unter unterstützten macOS-/privaten API-Versionen bearbeiten (`messageId`, `text` oder `newText`). Nur Nachrichten, die der Gateway selbst gesendet hat, können bearbeitet werden.
    - **unsend**: Eine gesendete Nachricht unter unterstützten macOS-/privaten API-Versionen zurückziehen (`messageId`). Nur Nachrichten, die der Gateway selbst gesendet hat, können zurückgezogen werden.
    - **upload-file**: Medien/Dateien senden (`buffer` als Base64 oder ein hydratisiertes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Veralteter Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenunterhaltung ist. Diese Aktionen ändern die Messages-Identität des Hosts und erfordern daher einen Eigentümer als Absender oder einen `operator.admin`-Gateway-Client.
    - **poll**: Eine native Umfrage in Apple Messages erstellen (`pollQuestion`, `pollOption` 2- bis 12-mal wiederholt, zusätzlich `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Empfänger unter iOS/iPadOS/macOS 26+ sehen die Umfrage nativ und können darin abstimmen; ältere Betriebssystemversionen erhalten als Ersatz den Text „Sent a poll“. Erfordert `selectors.pollPayloadMessage`.
    - **poll-vote**: In einer vorhandenen Umfrage abstimmen (`pollId` oder `messageId`, zusätzlich genau eines von `pollOptionIndex`, `pollOptionId` oder `pollOptionText`). Erfordert `selectors.pollVoteMessage` und die RPC-Methode `poll.vote`.

    Akzeptierte eingehende Umfragen werden für den Agenten mit der Frage, nummerierten Optionsbeschriftungen, Stimmenzahlen und der für `poll-vote` erforderlichen Umfragenachrichten-ID dargestellt.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Der Kontext eingehender iMessages enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs (`MessageSidFull`), sofern verfügbar. Kurze IDs sind auf den aktuellen SQLite-gestützten Antwortcache beschränkt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abläuft, wiederholen Sie den Versuch mit ihrem `MessageSidFull` und geben Sie dabei die Unterhaltung als Ziel an, aus der sie stammt. Vollständige IDs umgehen weder die Bindung an die Unterhaltung noch an das Konto; ersetzen Sie daher eine ID aus einem anderen Chat durch eine aus dem aktuellen Ziel. Entfernt delegierte Aufrufe können veraltete vollständige IDs ablehnen, wenn keine Nachweise zur aktuellen Unterhaltung verfügbar sind.

  </Accordion>

  <Accordion title="Funktionserkennung">
    OpenClaw blendet Aktionen der privaten API nur aus, wenn der zwischengespeicherte Prüfstatus angibt, dass die Bridge nicht verfügbar ist. Ist der Status unbekannt, bleiben die Aktionen sichtbar und führen Prüfungen bei der Ausführung verzögert aus, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Tippanzeige">
    Wenn die Bridge der privaten API aktiv ist, werden akzeptierte eingehende Chats als gelesen markiert, und direkte Chats zeigen eine Tippblase an, sobald der Durchlauf akzeptiert wurde, während der Agent den Kontext vorbereitet und die Antwort generiert. Deaktivieren Sie das Markieren als gelesen mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die älter als die Liste der methodenspezifischen Funktionen sind, deaktivieren Tippanzeige und Lesebestätigungen stillschweigend; OpenClaw protokolliert einmal pro Neustart eine Warnung, damit die fehlende Bestätigung zugeordnet werden kann.

  </Accordion>

  <Accordion title="Eingehende Tapbacks">
    OpenClaw abonniert iMessage-Tapbacks und leitet akzeptierte Reaktionen als Systemereignisse statt als normalen Nachrichtentext weiter, sodass ein Benutzer-Tapback keine gewöhnliche Antwortschleife auslöst.

    Der Benachrichtigungsmodus wird durch `channels.imessage.reactionNotifications` gesteuert:

    - `"own"` (Standard): Nur benachrichtigen, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren.
    - `"all"`: Bei allen eingehenden Tapbacks autorisierter Absender benachrichtigen.
    - `"off"`: Eingehende Tapbacks ignorieren.

    Kontospezifische Überschreibungen verwenden `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Genehmigungsreaktionen (👍 / 👎)">
    Wenn `approvals.exec.enabled` oder `approvals.plugin.enabled` auf true gesetzt ist und die Anfrage an iMessage weitergeleitet wird, stellt der Gateway eine Genehmigungsaufforderung nativ zu und akzeptiert ein Tapback, um sie zu beantworten:

    - `👍` (Gefällt-mir-Tapback) → `allow-once`
    - `👎` (Gefällt-mir-nicht-Tapback) → `deny`
    - `allow-always` bleibt eine manuelle Ausweichmöglichkeit: Senden Sie `/approve <id> allow-always` als reguläre Antwort.

    Die Verarbeitung von Reaktionen setzt voraus, dass das Handle des reagierenden Benutzers explizit als genehmigungsberechtigt eingetragen ist. Die Liste der Genehmigungsberechtigten wird aus `channels.imessage.allowFrom` (oder `channels.imessage.accounts.<id>.allowFrom`) gelesen; fügen Sie die Telefonnummer des Benutzers im E.164-Format oder seine Apple-ID-E-Mail-Adresse hinzu (Chatziele wie `chat_id:*` sind keine gültigen Einträge für Genehmigungsberechtigte). Der Platzhaltereintrag `"*"` wird berücksichtigt, erlaubt jedoch jedem Absender die Genehmigung; eine leere Liste der Genehmigungsberechtigten deaktiviert die Reaktionsabkürzung vollständig. Die Reaktionsabkürzung umgeht bewusst `reactionNotifications`, `dmPolicy` und `groupAllowFrom`, da die explizite Positivliste der Genehmigungsberechtigten die einzige relevante Zugriffsprüfung für die Auflösung von Genehmigungen ist.

    Die Autorisierung des Textbefehls `/approve` folgt derselben Liste: Wenn `channels.imessage.allowFrom` nicht leer ist, wird `/approve <id> <decision>` anhand dieser Liste der Genehmigungsberechtigten autorisiert (nicht anhand der umfassenderen Direktnachrichten-Positivliste), und Absender, die in der Direktnachrichten-Positivliste zugelassen sind, aber nicht in `allowFrom` stehen, erhalten eine ausdrückliche Ablehnung. Wenn `allowFrom` leer ist, bleibt die Ausweichregel für denselben Chat wirksam und `/approve` autorisiert alle Personen, die von der Direktnachrichten-Positivliste zugelassen werden. Fügen Sie jeden Operator, der Genehmigungen erteilen soll — über `/approve` oder über Reaktionen — zu `allowFrom` hinzu.

    Hinweise für Betreiber:
    - Die Reaktionszuordnung wird sowohl im Arbeitsspeicher als auch im persistenten schlüsselbasierten Speicher des Gateways gespeichert (die TTL entspricht dem Ablauf der Genehmigung). Das Gateway fragt außerdem ausstehende Aufforderungen auf Tapbacks ab, sodass ein Tapback, das kurz nach einem Neustart des Gateways eintrifft, die Genehmigung weiterhin auflöst.
    - Das eigene `is_from_me=true`-Tapback des Betreibers (beispielsweise von einem gekoppelten Apple-Gerät) löst die Genehmigung auf, wenn dieses Handle ausdrücklich als genehmigungsberechtigt konfiguriert ist.
    - Genehmigungsaufforderungen werden nur dann an eine Gruppenunterhaltung weitergeleitet, wenn ausdrücklich Genehmigungsberechtigte konfiguriert sind; andernfalls könnte jedes Gruppenmitglied die Genehmigung erteilen.
    - Ältere Tapbacks im Textformat (`Liked "…"`-Klartext von sehr alten Apple-Clients) können Genehmigungen nicht auflösen, da sie keine Nachrichten-GUID enthalten; die Reaktionsauflösung erfordert die strukturierten Tapback-Metadaten, die aktuelle macOS-/iOS-Clients ausgeben.

  </Accordion>
</AccordionGroup>

## Konfigurationsschreibvorgänge

iMessage erlaubt standardmäßig vom Kanal initiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

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

Wenn ein Benutzer einen Befehl und eine URL gemeinsam eingibt — z. B. `Dump https://example.com/article` — teilt Apples Nachrichten-App den Sendevorgang in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Bei den meisten Konfigurationen treffen die beiden Zeilen mit einem Abstand von etwa 0,8–2,0 s bei OpenClaw ein. Ohne Zusammenführung erhält der Agent in Durchlauf 1 nur den Befehl (und antwortet häufig „Senden Sie mir die URL“), bevor die URL in Durchlauf 2 eintrifft. Dies ist Apples Sendepipeline und wird weder von OpenClaw noch von `imsg` verursacht.

`channels.imessage.coalesceSameSenderDms` aktiviert für eine Direktnachricht die Pufferung aufeinanderfolgender Zeilen desselben Absenders. Wenn `imsg` in einer der Quellzeilen die strukturelle URL-Vorschaumarkierung `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` bereitstellt, führt OpenClaw nur diesen tatsächlichen aufgeteilten Sendevorgang zusammen und behält alle anderen gepufferten Zeilen als separate Durchläufe bei. Bei älteren `imsg`-Builds, die keinerlei Sprechblasenmetadaten ausgeben, kann OpenClaw einen aufgeteilten Sendevorgang nicht von separaten Sendevorgängen unterscheiden und greift daher auf das Zusammenführen des Buckets zurück. Dadurch bleibt das Verhalten vor Einführung der Metadaten erhalten, statt `Dump <url>`-Sendevorgänge wieder in zwei Durchläufe aufzuteilen. Gruppenchats werden weiterhin pro Nachricht verarbeitet, damit die Durchlaufstruktur mit mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie diese Option, wenn:

    - Sie Skills bereitstellen, die `command + payload` in einer einzigen Nachricht erwarten (Dump, Einfügen, Speichern, Einreihen usw.).
    - Ihre Benutzer URLs zusammen mit Befehlen einfügen.
    - Sie die zusätzliche Latenz bei Direktnachrichten akzeptieren können (siehe unten).

    Lassen Sie sie deaktiviert, wenn:

    - Sie bei aus einzelnen Wörtern bestehenden Auslösern in Direktnachrichten eine minimale Befehlslatenz benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne nachfolgende Nutzlast sind.

  </Tab>
  <Tab title="Aktivierung">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // explizit aktivieren (Standard: false)
        },
      },
    }
    ```

    Wenn die Option aktiviert ist und weder `messages.inbound.byChannel.imessage` noch das globale `messages.inbound.debounceMs` ausdrücklich festgelegt wurde, wird das Entprellfenster auf **7000 ms** erweitert (der bisherige Standardwert ist 0 ms — keine Entprellung). Das größere Fenster ist erforderlich, da Apples Sendeintervall bei aufgeteilten URL-Vorschauen mehrere Sekunden betragen kann, während Messages.app die Vorschauzeile ausgibt.

    So passen Sie das Fenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms decken die beobachteten Verzögerungen bei URL-Vorschauen in Messages.app ab.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Abwägungen">
    - **Eine präzise Zusammenführung erfordert aktuelle `imsg`-Nutzlastmetadaten.** Wenn `balloon_bundle_id` vorhanden ist, wird nur der tatsächliche aufgeteilte Sendevorgang zusammengeführt; die oben beschriebene ersatzweise Zusammenführung ohne Metadaten dient vorübergehend der Abwärtskompatibilität und wird entfernt, sobald `imsg` aufgeteilte Sendevorgänge vorgelagert zusammenführt.
    - **Zusätzliche Latenz bei Direktnachrichten.** Wenn die Option aktiviert ist, wartet jede Direktnachricht (einschließlich eigenständiger Steuerungsbefehle und nachfolgender einzelner Textnachrichten) bis zum Ablauf des Entprellfensters auf die Verarbeitung, falls noch eine URL-Vorschauzeile eintrifft. Nachrichten in Gruppenchats werden weiterhin sofort verarbeitet.
    - **Die zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen begrenzt und erhält eine ausdrückliche `…[truncated]`-Markierung; Anhänge sind auf 20 und Quelleinträge auf 10 begrenzt (bei einer Überschreitung bleiben der erste und die neuesten erhalten). Jede Quell-GUID wird für nachgelagerte Telemetrie in `coalescedMessageGuids` erfasst.
    - **Nur Direktnachrichten.** Gruppenchats werden weiterhin pro Nachricht verarbeitet, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen schreiben.
    - **Explizite Aktivierung pro Kanal.** Andere Kanäle (Discord, Slack, Telegram, WhatsApp, …) sind nicht betroffen. Ältere BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` festlegen, sollten diesen Wert nach `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und Agentensicht

Die Spalte „Option aktiviert“ zeigt das Verhalten eines `imsg`-Builds, der `balloon_bundle_id` ausgibt. Bei älteren `imsg`-Builds, die keinerlei Sprechblasenmetadaten ausgeben, greifen die unten mit „Zwei Durchläufe“ bzw. „N Durchläufe“ gekennzeichneten Zeilen stattdessen auf die bisherige Zusammenführung zurück (ein Durchlauf): OpenClaw kann einen aufgeteilten Sendevorgang strukturell nicht von separaten Sendevorgängen unterscheiden und behält daher die Zusammenführung aus der Zeit vor den Metadaten bei. Die präzise Trennung wird aktiviert, sobald der Build Sprechblasenmetadaten ausgibt.

| Benutzereingabe                                                      | `chat.db` erzeugt                  | Option deaktiviert (Standard)                      | Option aktiviert + Fenster (imsg gibt Sprechblasenmetadaten aus)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ein Sendevorgang)                              | 2 Zeilen im Abstand von etwa 1 s                   | Zwei Agentendurchläufe: nur „Dump“, dann URL | Ein Durchlauf: zusammengeführter Text `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (Anhang und Text)                | 2 Zeilen ohne Metadaten der URL-Sprechblase | Zwei Durchläufe                               | Zwei Durchläufe, nachdem Metadaten erkannt wurden; ein zusammengeführter Durchlauf in alten Sitzungen bzw. Sitzungen ohne Metadaten vor der Erkennung       |
| `/status` (eigenständiger Befehl)                                     | 1 Zeile                               | Sofortige Verarbeitung                        | **Bis zum Ablauf des Fensters warten, dann verarbeiten**                                                                |
| Nur eine eingefügte URL                                                   | 1 Zeile                               | Sofortige Verarbeitung                        | Bis zum Ablauf des Fensters warten, dann verarbeiten                                                                    |
| Text und URL werden im Abstand von mehreren Minuten absichtlich als zwei separate Nachrichten gesendet | 2 Zeilen außerhalb des Fensters               | Zwei Durchläufe                               | Zwei Durchläufe (das Fenster läuft dazwischen ab)                                                             |
| Schnelle Folge (>10 kleine Direktnachrichten innerhalb des Fensters)                          | N Zeilen ohne Metadaten der URL-Sprechblase | N Durchläufe                                 | N Durchläufe, nachdem Metadaten erkannt wurden; ein begrenzter zusammengeführter Durchlauf in alten Sitzungen bzw. Sitzungen ohne Metadaten vor der Erkennung |
| Zwei Personen schreiben in einem Gruppenchat                                  | N Zeilen von M Absendern               | M+ Durchläufe (einer pro Absender-Bucket)        | M+ Durchläufe — Gruppenchats werden nicht zusammengeführt                                                            |

## Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge oder des Gateways

iMessage stellt Nachrichten wieder her, die während des Gateway-Ausfalls verpasst wurden, und unterdrückt gleichzeitig die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann. Dieses auf der Deduplizierung eingehender Nachrichten basierende Standardverhalten ist immer aktiviert.

- **Deduplizierung bei der Wiedergabe.** Jede verarbeitete eingehende Nachricht wird anhand ihrer Apple-GUID im persistenten Plugin-Zustand (`imessage.inbound-dedupe`) erfasst, bei der Aufnahme beansprucht und nach der Verarbeitung bestätigt (bei einem vorübergehenden Fehler wird sie freigegeben, damit ein erneuter Versuch möglich ist). Bereits verarbeitete Nachrichten werden verworfen, statt zweimal verarbeitet zu werden. Dadurch kann die Wiederherstellung Nachrichten ohne Buchführung pro Nachricht umfassend wiedergeben.
- **Wiederherstellung nach Ausfallzeit.** Beim Start merkt sich der Monitor die zuletzt verarbeitete `chat.db`-Zeilen-ID (einen persistenten Cursor pro Konto) und übergibt sie als `since_rowid` an `imsg watch.subscribe`, sodass imsg die während des Gateway-Ausfalls eingegangenen Zeilen wiedergibt und anschließend Live-Nachrichten verfolgt. Die Wiedergabe ist auf die neuesten 500 Zeilen und auf Nachrichten mit einem Alter von bis zu etwa 2 Stunden begrenzt; die Deduplizierung verwirft alle bereits verarbeiteten Nachrichten.
- **Altersgrenze für veralteten Rückstand.** Zeilen oberhalb der Startgrenze sind tatsächlich live; wenn ihr Sendedatum mehr als etwa 15 Minuten vor ihrer Ankunft liegt, stammen sie aus dem durch Push verursachten Rückstand und werden unterdrückt. Wiedergegebene Zeilen (an oder unterhalb der Grenze) verwenden stattdessen das größere Wiederherstellungsfenster, sodass eine kürzlich verpasste Nachricht zugestellt wird, während ältere Verlaufsdaten nicht zugestellt werden.

Die Wiederherstellung funktioniert sowohl mit lokalen als auch mit entfernten `cliPath`-Konfigurationen, da die Wiedergabe durch `since_rowid` über dieselbe `imsg`-RPC-Verbindung erfolgt. Der Unterschied liegt im Fenster: Wenn das Gateway `chat.db` lesen kann (lokal), verankert es die Zeilen-ID-Grenze beim Start, begrenzt den Wiedergabeumfang und stellt verpasste Nachrichten mit einem Alter von bis zu einigen Stunden zu. Über ein entferntes SSH-`cliPath` kann es die Datenbank nicht lesen; daher ist die Wiedergabe unbegrenzt und jede Zeile verwendet die Live-Altersgrenze. Kürzlich verpasste Nachrichten werden weiterhin wiederhergestellt und alte Rückstände weiterhin unterdrückt, jedoch mit dem kleineren Live-Fenster. Führen Sie das Gateway auf dem Messages-Mac aus, um das größere Wiederherstellungsfenster zu nutzen.

### Für Betreiber sichtbares Signal

Unterdrückter Rückstand wird auf der Standardprotokollierungsstufe protokolliert und niemals stillschweigend verworfen (das Flag `recovery` zeigt, welches Fenster angewendet wurde):

```text
imessage: veralteter Rückstand eingehender Nachrichten unterdrückt account=<id> sent=<iso> recovery=<bool> (<N> seit dem Start unterdrückt)
```

### Migration

`channels.imessage.catchup.*` ist veraltet — die Wiederherstellung nach Ausfallzeiten erfolgt automatisch und benötigt bei neuen Konfigurationen keine Konfiguration. Vorhandene Konfigurationen mit `catchup.enabled: true` werden weiterhin als Kompatibilitätsprofil für das Wiederherstellungs-Wiedergabefenster berücksichtigt. Deaktivierte Catchup-Blöcke (`enabled: false` oder ohne `enabled: true`) werden nicht mehr unterstützt; `openclaw doctor --fix` entfernt sie.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Überprüfen Sie das Binärprogramm und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Prüfung meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn Aktionen über die private API nicht verfügbar sind, führen Sie `imsg launch` in der Sitzung des angemeldeten macOS-Benutzers aus und prüfen Sie erneut. Wenn das Gateway nicht unter macOS ausgeführt wird, verwenden Sie die oben beschriebene Einrichtung eines entfernten Macs über SSH anstelle des lokalen Standardpfads `imsg`.

  </Accordion>

  <Accordion title="Nachrichten werden gesendet, aber eingehende iMessages kommen nicht an">
    Prüfen Sie zunächst, ob die Nachricht den lokalen Mac erreicht hat. Wenn sich `chat.db` nicht ändert, kann OpenClaw die Nachricht nicht empfangen, selbst wenn `imsg status --json` eine fehlerfrei funktionierende Bridge meldet.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Wenn vom Telefon gesendete Nachrichten keine neuen Zeilen erzeugen, reparieren Sie die macOS-Nachrichten- und Apple-Push-Schicht, bevor Sie die OpenClaw-Konfiguration ändern. Eine einmalige Aktualisierung des Dienstes reicht häufig aus:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Senden Sie eine neue iMessage vom Telefon und bestätigen Sie eine neue `chat.db`-Zeile oder ein `imsg watch`-Ereignis, bevor Sie OpenClaw-Sitzungen debuggen. Führen Sie dies nicht als regelmäßige Schleife zum Neustarten der Bridge aus; wiederholte `imsg launch` sowie Gateway-Neustarts während der aktiven Arbeit können Zustellungen unterbrechen und laufende Kanalausführungen blockieren.

  </Accordion>

  <Accordion title="Gateway wird unter macOS nicht ausgeführt">
    Der standardmäßige `cliPath: "imsg"` muss auf dem Mac ausgeführt werden, der bei Messages angemeldet ist. Legen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript fest, das per SSH eine Verbindung zu diesem Mac herstellt und `imsg "$@"` ausführt.

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
    - `channels.imessage.groups`-Verhalten der Zulassungsliste
    - Konfiguration des Erwähnungsmusters (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie Folgendes:

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

    Vergewissern Sie sich, dass Full Disk Access und Automation für den Prozesskontext gewährt sind, in dem OpenClaw/`imsg` ausgeführt wird.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz – iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — Ankündigung und Migrationsübersicht
- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) — Tabelle zur Konfigurationsübertragung und schrittweise Umstellung
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungssteuerung
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
