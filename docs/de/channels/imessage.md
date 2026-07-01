---
read_when:
    - iMessage-Unterstützung einrichten
    - iMessage-Senden/-Empfangen debuggen
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio), mit Private-API-Aktionen für Antworten, Tapbacks, Effekte, Umfragen, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Einrichtungen, wenn die Host-Anforderungen passen.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T12:53:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Verwenden Sie für OpenClaw-iMessage-Bereitstellungen `imsg` auf einem bei macOS Messages angemeldeten Host. Wenn Ihr Gateway unter Linux oder Windows läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Eingehende Wiederherstellung erfolgt automatisch.** Nach einem Neustart der Bridge oder des Gateways spielt iMessage die Nachrichten erneut ab, die während des Ausfalls verpasst wurden, und unterdrückt die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausspülen kann. Dabei wird dedupliziert, sodass nichts zweimal weitergeleitet wird. Es gibt keine Konfiguration zum Aktivieren — siehe [Eingehende Wiederherstellung nach einem Neustart der Bridge oder des Gateways](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Die BlueBubbles-Unterstützung wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage nur über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder mit [Wechsel von BlueBubbles](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native externe CLI-Integration. Das Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port). Erweiterte Aktionen erfordern `imsg launch` und eine erfolgreiche Prüfung der privaten API.

<CardGroup cols={3}>
  <Card title="Aktionen der privaten API" icon="wand-sparkles" href="#private-api-actions">
    Antworten, Tapbacks, Effekte, Umfragen, Anhänge und Gruppenverwaltung.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Entfernter Mac" icon="terminal" href="#remote-mac-over-ssh">
    Verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf dem Messages-Mac läuft.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige iMessage-Feldreferenz.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Weg)">
    <Steps>
      <Step title="imsg installieren und überprüfen">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

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

      <Step title="Erste DM-Kopplung genehmigen (Standard dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Entfernter Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, sodass Sie `cliPath` auf ein Wrapper-Skript setzen können, das per SSH zu einem entfernten Mac verbindet und `imsg` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Empfohlene Konfiguration, wenn Anhänge aktiviert sind:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht gesetzt ist, versucht OpenClaw, ihn durch Parsen des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet strikte Host-Key-Prüfung für SCP, daher muss der Host-Key des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen zulässige Wurzeln (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

<Warning>
Jeder `cliPath`-Wrapper oder SSH-Proxy, den Sie vor `imsg` setzen, MUSS sich wie eine transparente stdio-Pipe für langlebiges JSON-RPC verhalten. OpenClaw tauscht kleine, zeilenbasierte JSON-RPC-Nachrichten über stdin/stdout des Wrappers für die gesamte Lebensdauer des Kanals aus:

- Leiten Sie jeden stdin-Chunk/jede stdin-Zeile **weiter, sobald Bytes verfügbar sind** — warten Sie nicht auf EOF.
- Leiten Sie jeden stdout-Chunk/jede stdout-Zeile in Gegenrichtung zeitnah weiter.
- Bewahren Sie Zeilenumbrüche.
- Vermeiden Sie blockierende Lesevorgänge mit fester Größe (`read(4096)`, `cat | buffer`, Standard-Shell-`read`), die kleine Frames verhungern lassen können.
- Halten Sie stderr vom JSON-RPC-stdout-Stream getrennt.

Ein Wrapper, der stdin puffert, bis ein großer Block gefüllt ist, erzeugt Symptome, die wie ein iMessage-Ausfall aussehen — `imsg rpc timeout (chats.list)` oder wiederholte Kanalneustarts — obwohl `imsg rpc` selbst fehlerfrei ist. `ssh -T host imsg "$@"` (oben) ist sicher, weil es die `cliPath`-Argumente von OpenClaw wie `rpc` und `--db` weiterleitet. Pipelines wie `ssh host imsg | grep -v '^DEBUG'` sind NICHT sicher — zeilengepufferte Tools können Frames trotzdem zurückhalten; verwenden Sie `stdbuf -oL -eL` auf jeder Stufe, wenn Sie filtern müssen.
</Warning>

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` läuft.
- Vollständiger Festplattenzugriff ist für den Prozesskontext erforderlich, der OpenClaw/`imsg` ausführt (Zugriff auf die Messages-Datenbank).
- Die Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (Reagieren / Bearbeiten / Zurückrufen / Thread-Antwort / Effekte / Umfragen / Gruppenoperationen) muss System Integrity Protection deaktiviert sein — siehe unten [Die private imsg-API aktivieren](#enabling-the-imsg-private-api). Einfaches Senden/Empfangen von Text und Medien funktioniert ohne diese Änderung.

<Tip>
Berechtigungen werden pro Prozesskontext gewährt. Wenn das Gateway ohne Benutzeroberfläche läuft (LaunchAgent/SSH), führen Sie einen einmaligen interaktiven Befehl in demselben Kontext aus, um die Abfragen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH-Wrapper-Sendevorgänge schlagen mit AppleEvents -1743 fehl">
  Eine Remote-SSH-Einrichtung kann Chats lesen, `channels status --probe` bestehen und eingehende Nachrichten verarbeiten, während ausgehende Sendevorgänge weiterhin mit einem AppleEvents-Autorisierungsfehler fehlschlagen:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Prüfen Sie die TCC-Datenbank des angemeldeten Mac-Benutzers oder Systemeinstellungen > Datenschutz & Sicherheit > Automation. Wenn der Automation-Eintrag für `/usr/libexec/sshd-keygen-wrapper` statt für `imsg` oder den lokalen Shell-Prozess aufgezeichnet wird, zeigt macOS für diesen serverseitigen SSH-Client möglicherweise keinen verwendbaren Messages-Schalter an:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In diesem Zustand kann das wiederholte Ausführen von `tccutil reset AppleEvents` oder erneute Ausführen von `imsg send` über denselben SSH-Wrapper weiter fehlschlagen, weil der Prozesskontext, der Messages-Automation benötigt, der SSH-Wrapper ist und nicht eine App, der die UI die Berechtigung gewähren kann.

Verwenden Sie stattdessen einen der unterstützten `imsg`-Prozesskontexte:

- Führen Sie das Gateway oder zumindest die `imsg`-Bridge in der lokalen Sitzung des angemeldeten Messages-Benutzers aus.
- Starten Sie das Gateway mit einem LaunchAgent für diesen Benutzer, nachdem Sie vollständigen Festplattenzugriff und Automation aus derselben Sitzung gewährt haben.
- Wenn Sie die Zwei-Benutzer-SSH-Topologie beibehalten, verifizieren Sie, dass ein echter ausgehender `imsg send` über den exakten Wrapper erfolgreich ist, bevor Sie den Kanal aktivieren. Wenn dafür keine Automation gewährt werden kann, konfigurieren Sie stattdessen eine Ein-Benutzer-`imsg`-Einrichtung, statt sich für Sendevorgänge auf den SSH-Wrapper zu verlassen.

</Accordion>

## Die private imsg-API aktivieren

`imsg` wird in zwei Betriebsmodi ausgeliefert:

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehender Text und Medien über `send`, eingehendes Watch/History, Chatliste. Das erhalten Sie direkt nach einem frischen `brew install steipete/tap/imsg` plus den oben genannten Standardberechtigungen von macOS.
- **Modus mit privater API**: `imsg` injiziert eine Hilfs-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (Thread-Antwort), `sendWithEffect`, `poll` und `poll-vote` (native Messages-Umfragen), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Um die erweiterte Aktionsoberfläche zu erreichen, die diese Kanalseite dokumentiert, benötigen Sie den Modus mit privater API. Das `imsg`-README beschreibt die Anforderung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, Bridge-gestütztes Rich Send, Nachrichtenmutation und Chatverwaltung sind optional. Sie erfordern, dass SIP deaktiviert ist und eine Hilfs-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Hilfs-Injektionstechnik verwendet die eigene dylib von `imsg`, um private Messages-APIs zu erreichen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieter-Server und keine BlueBubbles-Runtime.

<Warning>
**Das Deaktivieren von SIP ist ein realer Sicherheitskompromiss.** SIP ist einer der zentralen macOS-Schutzmechanismen gegen das Ausführen veränderten Systemcodes; das systemweite Abschalten öffnet zusätzliche Angriffsfläche und kann Nebenwirkungen haben. Insbesondere **deaktiviert das Abschalten von SIP auf Apple-Silicon-Macs auch die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste betriebliche Entscheidung, nicht als Standard. Wenn Ihr Bedrohungsmodell deaktiviertes SIP nicht toleriert, ist das gebündelte iMessage auf den Basismodus beschränkt — nur Senden/Empfangen von Text und Medien, keine Reaktionen / Bearbeitung / Zurückrufen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und pro Methode `selectors`, sodass Sie sehen können, was der aktuelle Build unterstützt, bevor Sie beginnen.

2. **Deaktivieren Sie System Integrity Protection und (auf modernem macOS) Library Validation.** Das Injizieren einer nicht von Apple stammenden Hilfs-dylib in die von Apple signierte `Messages.app` erfordert deaktiviertes SIP **und** gelockerte Library Validation. Der SIP-Schritt im Wiederherstellungsmodus ist macOS-versionsspezifisch:
   - **macOS 10.13-10.15 (Sierra-Catalina):** Deaktivieren Sie Library Validation über Terminal, starten Sie in den Wiederherstellungsmodus, führen Sie `csrutil disable` aus, starten Sie neu.
   - **macOS 11+ (Big Sur und neuer), Intel:** Wiederherstellungsmodus (oder Internet Recovery), `csrutil disable`, Neustart.
   - **macOS 11+, Apple Silicon:** Startsequenz über die Einschalttaste, um Recovery aufzurufen; halten Sie auf neueren macOS-Versionen die **linke Umschalttaste** gedrückt, wenn Sie auf Fortfahren klicken, dann `csrutil disable`. Setups mit virtuellen Maschinen folgen einem separaten Ablauf, erstellen Sie daher zuerst einen VM-Snapshot.

   **Unter macOS 11 und neuer reicht `csrutil disable` allein normalerweise nicht aus.** Apple erzwingt Library Validation weiterhin gegen `Messages.app` als Platform Binary, sodass eine ad-hoc-signierte Hilfsbibliothek abgelehnt wird (`Library Validation failed: ... platform binary, but mapped file is not`), selbst wenn SIP deaktiviert ist. Deaktivieren Sie nach dem Deaktivieren von SIP auch Library Validation und starten Sie neu:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verifiziert auf 26.5.1:** Deaktiviertes SIP **plus** der oben genannte `DisableLibraryValidation`-Befehl reicht aus, um die Hilfsbibliothek über 26.0 bis 26.5.x hinweg zu injizieren. **Es sind keine boot-args erforderlich.** Die plist ist der entscheidende Faktor und der häufigste fehlende Schritt, wenn die Injektion auf Tahoe fehlschlägt:
   - **Mit der plist:** `imsg launch` injiziert, und `imsg status` meldet `advanced_features: true`.
   - **Ohne die plist (auch bei deaktiviertem SIP):** `imsg launch` schlägt mit `Failed to launch: Timeout waiting for Messages.app to initialize` fehl. AMFI lehnt den ad-hoc-Helper beim Laden ab, daher wird die Bridge nie bereit und der Start läuft in einen Timeout. Dieser Timeout ist das Symptom, auf das die meisten unter Tahoe stoßen, und die Lösung ist die obige plist, nicht etwas Drastischeres.

   Dies wurde mit einem kontrollierten Vorher/Nachher unter macOS 26.5.1 (Apple Silicon) bestätigt: Mit der plist wird die dylib in `Messages.app` gemappt und die Bridge startet; entfernen Sie die plist und starten Sie neu, dann erzeugt `imsg launch` den oben genannten Timeout-Fehler, wobei die dylib nicht gemappt ist.

   Wenn die `imsg launch`-Injektion oder bestimmte `selectors` nach einem macOS-Upgrade `false` zurückgeben, ist diese Prüfung meist die Ursache. Prüfen Sie Ihren SIP- und Library-Validation-Status, bevor Sie annehmen, dass der SIP-Schritt selbst fehlgeschlagen ist. Wenn diese Einstellungen korrekt sind und die Bridge weiterhin nicht injizieren kann, erfassen Sie `imsg status --json` sowie die Ausgabe von `imsg launch` und melden Sie dies dem `imsg`-Projekt, statt zusätzliche systemweite Sicherheitskontrollen abzuschwächen.

   Folgen Sie Apples Recovery-Mode-Ablauf für Ihren Mac, um SIP zu deaktivieren, bevor Sie `imsg launch` ausführen.

3. **Injizieren Sie den Helper.** Mit deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, wenn SIP noch aktiviert ist, sodass dies zugleich bestätigt, dass Schritt 2 wirksam war.

4. **Überprüfen Sie die Bridge aus OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '{rpc_methods, selectors}'` sollte die von Ihrem macOS-Build bereitgestellten Funktionen anzeigen. Die Erstellung von Umfragen erfordert `selectors.pollPayloadMessage`; Abstimmungen erfordern sowohl `selectors.pollVoteMessage` als auch die RPC-Methode `poll.vote`. Das OpenClaw Plugin bewirbt nur Aktionen, die vom zwischengespeicherten Probe unterstützt werden, während ein leerer Cache optimistisch bleibt und beim ersten Dispatch prüft.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen aber zur Dispatch-Zeit "iMessage `<action>` requires the imsg private API bridge" auslösen, führen Sie `imsg launch` erneut aus — der Helper kann herausfallen (Neustart von Messages.app, OS-Update usw.), und der zwischengespeicherte Status `available: true` bewirbt weiterhin Aktionen, bis der nächste Probe ihn aktualisiert.

### Wenn Sie SIP nicht deaktivieren können

Wenn deaktiviertes SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` fällt auf den Basismodus zurück — nur Text + Medien + Empfang.
- Das OpenClaw Plugin bewirbt weiterhin Text-/Medienversand und eingehende Überwachung; es blendet lediglich `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (gemäß der funktionsbezogenen Capability-Prüfung).
- Sie können einen separaten Mac ohne Apple Silicon (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Workload betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe [Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)](#deployment-patterns) unten.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge müssen Absender identifizieren: Handles oder statische Absender-Zugriffsgruppen (`accessGroup:<name>`). Verwenden Sie `channels.imessage.groupAllowFrom` für Chat-Ziele wie `chat_id:*`, `chat_guid:*` oder `chat_identifier:*`; verwenden Sie `channels.imessage.groups` für numerische `chat_id`-Registryschlüssel.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Gruppen-Absender-Allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-Einträge können auch statische Absender-Zugriffsgruppen referenzieren (`accessGroup:<name>`).

    Runtime-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, verwenden iMessage-Gruppenabsenderprüfungen `allowFrom`; setzen Sie `groupAllowFrom`, wenn sich die Zulassung für DMs und Gruppen unterscheiden soll.
    Runtime-Hinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Runtime auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Gruppen-Routing hat **zwei** Allowlist-Prüfungen, die direkt nacheinander laufen, und beide müssen bestehen:

    1. **Absender- / Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — Handle, `chat_guid`, `chat_identifier` oder `chat_id`.
    2. **Gruppen-Registry** (`channels.imessage.groups`) — mit `groupPolicy: "allowlist"` erfordert diese Prüfung entweder einen Wildcard-Eintrag `groups: { "*": { ... } }` (setzt `allowAll = true`) oder einen expliziten Eintrag pro `chat_id` unter `groups`.

    Wenn Prüfung 2 leer ist, wird jede Gruppennachricht verworfen. Das Plugin gibt auf der Standard-Logstufe zwei Signale der Ebene `warn` aus:

    - einmalig pro Konto beim Start: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - einmalig pro `chat_id` zur Runtime: `imessage: dropping group message from chat_id=<id> ...`

    DMs funktionieren weiterhin, weil sie einen anderen Codepfad verwenden.

    Minimale Konfiguration, damit Gruppen unter `groupPolicy: "allowlist"` weiter fließen:

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

    Wenn diese `warn`-Zeilen im Gateway-Log erscheinen, verwirft Prüfung 2 — fügen Sie den `groups`-Block hinzu.
    </Warning>

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Mention-Metadaten
    - Mention-Erkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Mention-Gating nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können Mention-Gating in Gruppen umgehen.

    Pro-Gruppe-`systemPrompt`:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert eine optionale `systemPrompt`-Zeichenkette. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten injiziert. Die Auflösung entspricht der pro Gruppen-Prompt-Auflösung von `channels.whatsapp.groups`:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenkette (`""`) ist, wird die Wildcard unterdrückt und auf diese Gruppe kein System-Prompt angewendet.
    2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Pro-Gruppen-Prompts gelten nur für Gruppennachrichten — Direktnachrichten in diesem Kanal sind nicht betroffen.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standard `session.dmScope=main` werden iMessage-DMs in der Hauptsession des Agenten zusammengeführt.
    - Gruppensessions sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden mithilfe der ursprünglichen Kanal-/Zielmetadaten zurück an iMessage geroutet.

    Gruppenähnliches Thread-Verhalten:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eintreffen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppentraffic (Gruppen-Gating + Gruppensession-Isolation).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Legacy-iMessage-Chats können auch an ACP-Sessions gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden zur erzeugten ACP-Session geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Session an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Session und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Top-Level-`bindings[]`-Einträge mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisierten DM-Handle wie `+15555550123` oder `user@example.com`
- `chat_id:<id>` (empfohlen für stabile Gruppenbindungen)
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

Siehe [ACP-Agenten](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Verwenden Sie eine dedizierte Apple ID und einen dedizierten macOS-Benutzer, damit Bot-Traffic von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer oder melden Sie sich damit an.
    2. Melden Sie sich in diesem Benutzer in Messages mit der Bot-Apple-ID an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Verweisen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Beim ersten Lauf können GUI-Genehmigungen (Automation + Full Disk Access) in dieser Bot-Benutzersession erforderlich sein.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Übliche Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
    - `remoteHost` aktiviert SCP-Abrufe von Anhängen

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

    Verwenden Sie SSH-Schlüssel, damit sowohl SSH als auch SCP nicht interaktiv sind.
    Stellen Sie zuerst sicher, dass dem Hostschlüssel vertraut wird (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt ist.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage unterstützt kontoabhängige Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Anhang-Root-Verzeichnisse überschreiben.

  </Accordion>

  <Accordion title="Direct-message history">
    Setzen Sie `channels.imessage.dmHistoryLimit`, um neue Direktnachrichtensessions mit dem aktuellen dekodierten `imsg`-Verlauf für diese Konversation zu initialisieren. Verwenden Sie `channels.imessage.dms["<sender>"].historyLimit` für absenderspezifische Überschreibungen, einschließlich `0`, um den Verlauf für einen Absender zu deaktivieren.

    iMessage-DM-Verlauf wird bei Bedarf von `imsg` abgerufen. Wenn `dmHistoryLimit` nicht gesetzt ist, wird die globale DM-Verlaufsinitialisierung deaktiviert, aber ein positiver absenderspezifischer Wert `channels.imessage.dms["<sender>"].historyLimit` aktiviert die Initialisierung für diesen Absender weiterhin.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - Die Verarbeitung eingehender Anhänge ist **standardmäßig deaktiviert** — setzen Sie `channels.imessage.includeAttachments: true`, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agent weiterzuleiten. Ist dies deaktiviert, werden iMessages, die nur Anhänge enthalten, verworfen, bevor sie den Agent erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Protokollzeile.
    - Remote-Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist.
    - Anhangspfade müssen zulässigen Wurzeln entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (Remote-SCP-Modus)
      - Standard-Wurzelmuster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - Die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard: 16 MB)

  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard: 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (Absatz-zuerst-Aufteilung)

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

## Private-API-Aktionen

Wenn `imsg launch` ausgeführt wird und `openclaw channels status --probe` `privateApi.available: true` meldet, kann das Nachrichtentool zusätzlich zum normalen Textversand iMessage-native Aktionen verwenden.

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
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks werden love, like, dislike, laugh, emphasize und question zugeordnet.
    - **reply**: Eine Thread-Antwort auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message` plus `chatGuid`, `chatId`, `chatIdentifier` oder `to`).
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`).
    - **edit**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen bearbeiten (`messageId`, `text` oder `newText`).
    - **unsend**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen zurückziehen (`messageId`).
    - **upload-file**: Medien/Dateien senden (`buffer` als base64 oder ein hydratisiertes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Legacy-Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenunterhaltung ist.
    - **poll**: Eine native Apple-Messages-Umfrage erstellen (`pollQuestion`, `pollOption` 2- bis 12-mal wiederholt, plus `chatGuid`, `chatId`, `chatIdentifier` oder `to`). Empfänger unter iOS/iPadOS/macOS 26+ sehen sie nativ und können nativ abstimmen; ältere Betriebssystemversionen erhalten als Fallback den Text „Sent a poll“. Erfordert `selectors.pollPayloadMessage`.
    - **poll-vote**: Über eine vorhandene Umfrage abstimmen (`pollId` oder `messageId` plus genau eines von `pollOptionIndex`, `pollOptionId` oder `pollOptionText`). Erfordert `selectors.pollVoteMessage` und die RPC-Methode `poll.vote`.

    Akzeptierte eingehende Umfragen werden für den Agent mit der Frage, nummerierten Optionsbeschriftungen, Stimmenzahlen und der von `poll-vote` benötigten Umfragenachrichten-ID gerendert.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Eingehender iMessage-Kontext enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs, wenn verfügbar. Kurze IDs sind auf den aktuellen SQLite-gestützten Antwortcache beschränkt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, versuchen Sie es erneut mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Funktionserkennung">
    OpenClaw blendet Private-API-Aktionen nur aus, wenn der zwischengespeicherte Prüfstatus besagt, dass die Bridge nicht verfügbar ist. Ist der Status unbekannt, bleiben Aktionen sichtbar und lösen Prüfungen verzögert aus, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Tippen">
    Wenn die Private-API-Bridge aktiv ist, werden akzeptierte eingehende Chats als gelesen markiert, und Direktchats zeigen eine Tippblase, sobald der Durchlauf akzeptiert wurde, während der Agent Kontext vorbereitet und generiert. Deaktivieren Sie die Lesemarkierung mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der funktionsspezifischen Methodenliste entstanden sind, sperren Tippen/Lesen stillschweigend; OpenClaw protokolliert pro Neustart eine einmalige Warnung, damit die fehlende Bestätigung zuordenbar ist.

  </Accordion>

  <Accordion title="Eingehende Tapbacks">
    OpenClaw abonniert iMessage-Tapbacks und leitet akzeptierte Reaktionen als Systemereignisse statt als normalen Nachrichtentext weiter, sodass ein Benutzer-Tapback keine gewöhnliche Antwortschleife auslöst.

    Der Benachrichtigungsmodus wird durch `channels.imessage.reactionNotifications` gesteuert:

    - `"own"` (Standard): nur benachrichtigen, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren.
    - `"all"`: für alle eingehenden Tapbacks von autorisierten Absendern benachrichtigen.
    - `"off"`: eingehende Tapbacks ignorieren.

    Kontoabhängige Überschreibungen verwenden `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Genehmigungsreaktionen (👍 / 👎)">
    Wenn `approvals.exec.enabled` oder `approvals.plugin.enabled` wahr ist und die Anfrage an iMessage geroutet wird, liefert der Gateway eine Genehmigungsaufforderung nativ aus und akzeptiert einen Tapback, um sie aufzulösen:

    - `👍` (Like-Tapback) → `allow-once`
    - `👎` (Dislike-Tapback) → `deny`
    - `allow-always` bleibt ein manueller Fallback: Senden Sie `/approve <id> allow-always` als reguläre Antwort.

    Die Reaktionsverarbeitung erfordert, dass das Handle des reagierenden Benutzers ein expliziter Genehmiger ist. Die Genehmigerliste wird aus `channels.imessage.allowFrom` (oder `channels.imessage.accounts.<id>.allowFrom`) gelesen; fügen Sie die Telefonnummer des Benutzers im E.164-Format oder seine Apple-ID-E-Mail hinzu. Der Wildcard-Eintrag `"*"` wird beachtet, erlaubt aber jedem Absender die Genehmigung. Die Reaktionsverknüpfung umgeht absichtlich `reactionNotifications`, `dmPolicy` und `groupAllowFrom`, weil die explizite Genehmiger-Allowlist das einzige Gate ist, das für die Genehmigungsauflösung zählt.

    **Verhaltensänderung mit diesem Release:** Wenn `channels.imessage.allowFrom` nicht leer ist, wird der Textbefehl `/approve <id> <decision>` jetzt gegen diese Genehmigerliste autorisiert (nicht gegen die breitere DM-Allowlist). Absender, die in der DM-Allowlist erlaubt sind, aber nicht in `allowFrom`, erhalten eine explizite Ablehnung. Fügen Sie jeden Operator, der per `/approve` (und per Reaktionen) genehmigen können soll, zu `allowFrom` hinzu, um das bisherige Verhalten beizubehalten. Wenn `allowFrom` leer ist, bleibt der Legacy-„same-chat fallback“ wirksam, und `/approve` autorisiert weiterhin jeden, den die DM-Allowlist erlaubt.

    Operatorhinweise:
    - Die Reaktionsbindung wird sowohl im Speicher (mit einer TTL, die dem Ablauf der Genehmigung entspricht) als auch im persistenten Keyed Store des Gateways gespeichert, sodass ein Tapback, der kurz nach einem Gateway-Neustart eingeht, die Genehmigung trotzdem auflöst.
    - Geräteübergreifende `is_from_me=true`-Tapbacks (die eigene Reaktion des Operators auf einem gekoppelten Apple-Gerät) werden absichtlich ignoriert, damit der Bot sich nicht selbst genehmigen kann.
    - Legacy-Tapbacks im Textstil (`Liked "…"` als Klartext von sehr alten Apple-Clients) können Genehmigungen nicht auflösen, weil sie keine Nachrichten-GUID enthalten; die Reaktionsauflösung erfordert die strukturierten Tapback-Metadaten, die aktuelle macOS-/iOS-Clients ausgeben.

  </Accordion>
</AccordionGroup>

## Konfigurationsschreibvorgänge

iMessage erlaubt standardmäßig kanalinitiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true` gilt).

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

## Zusammenführen von Split-Send-DMs (Befehl + URL in einer Komposition)

Wenn ein Benutzer einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apples Nachrichten-App den Versand in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Zeilen kommen bei den meisten Setups mit etwa 0,8-2,0 s Abstand bei OpenClaw an. Ohne Zusammenführung erhält der Agent in Durchlauf 1 nur den Befehl, antwortet (oft „send me the URL“) und sieht die URL erst in Durchlauf 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren. Das ist Apples Sendepipeline und nichts, was OpenClaw oder `imsg` einführt.

`channels.imessage.coalesceSameSenderDms` aktiviert für eine DM die Pufferung aufeinanderfolgender Zeilen desselben Absenders. Wenn `imsg` den strukturellen URL-Vorschau-Marker `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` in einer der Quellzeilen bereitstellt, führt OpenClaw nur diesen echten Split-Send zusammen und behält alle anderen gepufferten Zeilen als separate Durchläufe bei. Bei älteren `imsg`-Builds, die keinerlei Sprechblasenmetadaten ausgeben, kann OpenClaw einen Split-Send nicht von separaten Sendevorgängen unterscheiden und fällt daher auf das Zusammenführen des Buckets zurück. Das bewahrt das Verhalten vor den Metadaten, statt `Dump <url>`-Split-Sends in zwei Durchläufe zurückfallen zu lassen. Gruppenchats werden weiterhin pro Nachricht ausgeliefert, damit die Mehrbenutzer-Turn-Struktur erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Deaktiviert lassen, wenn:

    - Sie minimale Befehlslatenz für Einwort-DM-Trigger benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne Payload-Follow-ups sind.

  </Tab>
  <Tab title="Aktivierung">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Ist das Flag aktiviert und gibt es kein explizites `messages.inbound.byChannel.imessage` oder globales `messages.inbound.debounceMs`, erweitert sich das Debounce-Fenster auf **7000 ms** (der Legacy-Standard ist 0 ms — kein Debouncing). Das größere Fenster ist erforderlich, weil Apples URL-Vorschau-Split-Send-Taktung sich über mehrere Sekunden erstrecken kann, während Messages.app die Vorschauzeile ausgibt.

    So passen Sie das Fenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromisse">
    - **Präzises Zusammenführen benötigt aktuelle `imsg`-Payload-Metadaten.** Wenn die URL-Zeile `balloon_bundle_id` enthält, wird nur dieser echte Split-Send zusammengeführt und andere gepufferte Zeilen bleiben getrennt. Bei älteren `imsg`-Builds, die keine Balloon-Metadaten bereitstellen, fällt OpenClaw auf das Zusammenführen des gepufferten Buckets zurück, damit Split-Sends wie `Dump <url>` nicht in zwei Turns regressieren (vorläufige Abwärtskompatibilität, wird entfernt, sobald `imsg` Split-Sends upstream zusammenführt).
    - **Zusätzliche Latenz für DM-Nachrichten.** Wenn das Flag aktiviert ist, wartet jede DM (einschließlich eigenständiger Steuerbefehle und einzelner Text-Follow-ups) vor dem Dispatch bis zum Debounce-Fenster, falls noch eine URL-Vorschauzeile kommt. Gruppenchat-Nachrichten werden weiterhin sofort versendet.
    - **Zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleneinträge sind auf 10 begrenzt (darüber hinaus werden erster und neuester beibehalten). Jede Quell-GUID wird in `coalescedMessageGuids` für nachgelagerte Telemetrie erfasst.
    - **Nur DM.** Gruppenchats fallen auf Dispatch pro Nachricht zurück, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen tippen.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen. Legacy-BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` setzen, sollten diesen Wert nach `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

Die Spalte „Flag aktiviert“ zeigt das Verhalten auf einem `imsg`-Build, der `balloon_bundle_id` ausgibt. Bei älteren `imsg`-Builds, die überhaupt keine Balloon-Metadaten ausgeben, fallen die unten als „Zwei Turns“ / „N Turns“ markierten Zeilen stattdessen auf eine Legacy-Zusammenführung zurück (ein Turn): OpenClaw kann einen Split-Send strukturell nicht von separaten Sends unterscheiden und bewahrt daher die Zusammenführung vor den Metadaten. Präzise Trennung wird aktiviert, sobald der Build Balloon-Metadaten ausgibt.

| Benutzer verfasst                                                 | `chat.db` erzeugt                    | Flag deaktiviert (Standard)             | Flag aktiviert + Fenster (`imsg` gibt Balloon-Metadaten aus)                                       |
| ------------------------------------------------------------------ | ------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (ein Send)                              | 2 Zeilen im Abstand von ~1 s         | Zwei Agent-Turns: nur „Dump“, dann URL  | Ein Turn: zusammengeführter Text `Dump https://example.com`                                        |
| `Save this 📎image.jpg caption` (Anhang + Text)                   | 2 Zeilen ohne URL-Balloon-Metadaten  | Zwei Turns                              | Zwei Turns, nachdem Metadaten beobachtet wurden; ein zusammengeführter Turn bei alten/pre-latch Sitzungen ohne Metadaten |
| `/status` (eigenständiger Befehl)                                  | 1 Zeile                              | Sofortiger Dispatch                     | **Bis zum Fenster warten, dann dispatchen**                                                        |
| URL allein eingefügt                                               | 1 Zeile                              | Sofortiger Dispatch                     | Bis zum Fenster warten, dann dispatchen                                                            |
| Text + URL als zwei bewusst separate Nachrichten, Minuten auseinander | 2 Zeilen außerhalb des Fensters      | Zwei Turns                              | Zwei Turns (Fenster läuft dazwischen ab)                                                           |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Zeilen ohne URL-Balloon-Metadaten  | N Turns                                 | N Turns, nachdem Metadaten beobachtet wurden; ein begrenzter zusammengeführter Turn bei alten/pre-latch Sitzungen ohne Metadaten |
| Zwei Personen tippen in einem Gruppenchat                          | N Zeilen von M Sendern               | M+ Turns (einer pro Sender-Bucket)      | M+ Turns — Gruppenchats werden nicht zusammengeführt                                               |

## Eingehende Wiederherstellung nach einem Neustart von Bridge oder Gateway

iMessage stellt Nachrichten wieder her, die verpasst wurden, während das Gateway ausgefallen war, und unterdrückt gleichzeitig die veraltete „Backlog-Bombe“, die Apple nach einer Push-Wiederherstellung ausgeben kann. Das Standardverhalten ist immer aktiv und baut auf der eingehenden Deduplizierung auf.

- **Replay-Deduplizierung.** Jede zugestellte eingehende Nachricht wird anhand ihrer Apple-GUID im persistenten Plugin-Zustand (`imessage.inbound-dedupe`) erfasst, bei der Aufnahme beansprucht und nach der Verarbeitung committet (bei einem vorübergehenden Fehler freigegeben, damit sie erneut versucht werden kann). Alles, was bereits verarbeitet wurde, wird verworfen, statt zweimal zugestellt zu werden. Dadurch kann Recovery aggressiv wiederholen, ohne Buchhaltung pro Nachricht.
- **Downtime-Recovery.** Beim Start merkt sich der Monitor die zuletzt zugestellte `chat.db`-rowid (ein persistenter Cursor pro Konto) und übergibt sie als `since_rowid` an `imsg watch.subscribe`, sodass imsg die Zeilen wiederholt, die eingegangen sind, während das Gateway ausgefallen war, und danach live weiterläuft. Replay ist auf die neuesten Zeilen und auf Nachrichten bis zu ~2 Stunden Alter begrenzt, und die Deduplizierung verwirft alles, was bereits verarbeitet wurde.
- **Altersgrenze für veralteten Backlog.** Zeilen oberhalb der Startgrenze sind tatsächlich live; eine Zeile, deren Sendedatum mehr als ~15 Minuten älter ist als ihre Ankunft, ist der Push-Flush-Backlog und wird unterdrückt. Wiederholte Zeilen (an oder unterhalb der Grenze) verwenden stattdessen das breitere Recovery-Fenster, sodass eine kürzlich verpasste Nachricht zugestellt wird, während uralte Historie nicht zugestellt wird.

Recovery funktioniert sowohl über lokale als auch über Remote-`cliPath`-Setups, weil `since_rowid`-Replay über dieselbe `imsg`-RPC-Verbindung läuft. Der Unterschied ist das Fenster: Wenn das Gateway `chat.db` lesen kann (lokal), verankert es die rowid-Startgrenze, begrenzt die Replay-Spanne und stellt verpasste Nachrichten zu, die bis zu ein paar Stunden alt sind. Über ein Remote-SSH-`cliPath` kann es die Datenbank nicht lesen, daher ist das Replay unbegrenzt und jede Zeile verwendet die Live-Altersgrenze — es stellt weiterhin kürzlich verpasste Nachrichten wieder her und unterdrückt weiterhin alten Backlog, nur mit dem engeren Live-Fenster. Führen Sie das Gateway auf dem Messages-Mac aus, um das breitere Recovery-Fenster zu erhalten.

### Für Operator sichtbares Signal

Unterdrückter Backlog wird auf der Standardebene geloggt und nie stillschweigend verworfen (das Flag `recovery` zeigt, welches Fenster angewendet wurde):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migration

`channels.imessage.catchup.*` ist veraltet — Downtime-Recovery ist jetzt automatisch und benötigt für neue Setups keine Konfiguration. Vorhandene Konfigurationen mit `catchup.enabled: true` werden weiterhin als Kompatibilitätsprofil für das Recovery-Replay-Fenster berücksichtigt. Deaktivierte Catchup-Blöcke (`enabled: false` oder kein `enabled: true`) sind eingestellt; `openclaw doctor --fix` entfernt sie.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie die Binärdatei und RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn der Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn private API-Aktionen nicht verfügbar sind, führen Sie `imsg launch` in der angemeldeten macOS-Benutzersitzung aus und führen Sie den Probe erneut aus. Wenn das Gateway nicht auf macOS läuft, verwenden Sie statt des lokalen Standard-`imsg`-Pfads das oben beschriebene Setup „Remote Mac über SSH“.

  </Accordion>

  <Accordion title="Messages werden gesendet, aber eingehende iMessages kommen nicht an">
    Prüfen Sie zuerst, ob die Nachricht den lokalen Mac erreicht hat. Wenn sich `chat.db` nicht ändert, kann OpenClaw die Nachricht nicht empfangen, selbst wenn `imsg status --json` eine fehlerfreie Bridge meldet.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Wenn vom Telefon gesendete Nachrichten keine neuen Zeilen erzeugen, reparieren Sie die macOS-Messages- und Apple-Push-Schicht, bevor Sie die OpenClaw-Konfiguration ändern. Eine einmalige Service-Aktualisierung reicht oft aus:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Senden Sie eine frische iMessage vom Telefon und bestätigen Sie eine neue `chat.db`-Zeile oder ein `imsg watch`-Ereignis, bevor Sie OpenClaw-Sitzungen debuggen. Führen Sie dies nicht als periodische Bridge-Relaunch-Schleife aus; wiederholtes `imsg launch` plus Gateway-Neustarts während aktiver Arbeit können Zustellungen unterbrechen und laufende Kanal-Runs stranden lassen.

  </Accordion>

  <Accordion title="Gateway läuft nicht auf macOS">
    Der Standardwert `cliPath: "imsg"` muss auf dem Mac laufen, der bei Messages angemeldet ist. Setzen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript, das per SSH auf diesen Mac zugreift und `imsg "$@"` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Führen Sie dann aus:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Pairing-Genehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Konfiguration des Erwähnungsmusters (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Hostschlüssel existiert in `~/.ssh/known_hosts` auf dem Gateway-Host
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsaufforderungen wurden verpasst">
    Führen Sie es erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Aufforderungen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bestätigen Sie, dass Full Disk Access + Automation für den Prozesskontext gewährt sind, der OpenClaw/`imsg` ausführt.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Pairing](/de/channels/pairing)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) — Ankündigung und Migrationszusammenfassung
- [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles) — Konfigurationsübersetzungstabelle und schrittweise Umstellung
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
