---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlersuche beim Senden/Empfangen von iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio), mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Setups, wenn die Host-Anforderungen erfüllt sind.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Verwenden Sie für OpenClaw-iMessage-Bereitstellungen `imsg` auf einem angemeldeten macOS-Messages-Host. Wenn Ihr Gateway unter Linux oder Windows läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Das Nachholen nach Gateway-Ausfallzeiten ist opt-in.** Wenn aktiviert (`channels.imessage.catchup.enabled: true`), spielt das Gateway beim nächsten Start eingehende Nachrichten erneut ab, die in `chat.db` gelandet sind, während es offline war (Absturz, Neustart, Mac-Ruhezustand). Standardmäßig deaktiviert — siehe [Nachholen nach Gateway-Ausfallzeiten](#catching-up-after-gateway-downtime). Schließt [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Die BlueBubbles-Unterstützung wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage nur über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder mit [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native externe CLI-Integration. Das Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port). Erweiterte Aktionen erfordern `imsg launch` und einen erfolgreichen Private-API-Probe.

<CardGroup cols={3}>
  <Card title="Private-API-Aktionen" icon="wand-sparkles" href="#private-api-actions">
    Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Remote-Mac" icon="terminal" href="#remote-mac-over-ssh">
    Verwenden Sie einen SSH-Wrapper, wenn das Gateway nicht auf dem Messages-Mac läuft.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige Referenz der iMessage-Felder.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
    <Steps>
      <Step title="imsg installieren und prüfen">

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

      <Step title="Erste DM-Kopplung genehmigen (Standard-dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote-Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript setzen, das per SSH zu einem Remote-Mac verbindet und `imsg` ausführt.

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
    OpenClaw verwendet strikte Host-Key-Prüfung für SCP, daher muss der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen erlaubte Wurzeln (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Vollständiger Festplattenzugriff ist für den Prozesskontext erforderlich, der OpenClaw/`imsg` ausführt (Zugriff auf die Messages-Datenbank).
- Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (react / edit / unsend / threaded reply / effects / group ops) muss System Integrity Protection deaktiviert sein — siehe unten [Die imsg Private API aktivieren](#enabling-the-imsg-private-api). Grundlegendes Senden/Empfangen von Text und Medien funktioniert ohne dies.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn das Gateway headless läuft (LaunchAgent/SSH), führen Sie in demselben Kontext einmalig einen interaktiven Befehl aus, um Eingabeaufforderungen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Die imsg Private API aktivieren

`imsg` wird in zwei Betriebsmodi ausgeliefert:

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehender Text und Medien über `send`, eingehender Watch/Verlauf, Chatliste. Das erhalten Sie direkt nach einem frischen `brew install steipete/tap/imsg` plus den oben genannten standardmäßigen macOS-Berechtigungen.
- **Private-API-Modus**: `imsg` injiziert eine Hilfs-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Um die auf dieser Kanalseite dokumentierte Oberfläche für erweiterte Aktionen zu erreichen, benötigen Sie den Private-API-Modus. Das `imsg`-README ist hinsichtlich der Anforderung eindeutig:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, bridge-gestütztes Rich-Senden, Nachrichtenmutation und Chatverwaltung sind opt-in. Sie erfordern, dass SIP deaktiviert ist und eine Hilfs-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Helper-Injection-Technik verwendet die eigene dylib von `imsg`, um die privaten APIs von Messages zu erreichen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieter-Server und keine BlueBubbles-Laufzeit.

<Warning>
**Das Deaktivieren von SIP ist ein realer Sicherheitskompromiss.** SIP gehört zu den Kernschutzmechanismen von macOS gegen die Ausführung von verändertem Systemcode; das systemweite Abschalten öffnet zusätzliche Angriffsfläche und kann Nebenwirkungen haben. Insbesondere **deaktiviert das Abschalten von SIP auf Apple-Silicon-Macs auch die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste Betriebsentscheidung, nicht als Standard. Wenn Ihr Threat Model kein deaktiviertes SIP toleriert, ist das gebündelte iMessage auf den Basismodus beschränkt — nur Senden/Empfangen von Text und Medien, keine Reaktionen / Bearbeiten / Zurücknehmen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und pro Methode `selectors`, sodass Sie sehen können, was der aktuelle Build unterstützt, bevor Sie beginnen.

2. **Deaktivieren Sie System Integrity Protection.** Dies ist macOS-versionsspezifisch, weil die zugrunde liegende Apple-Anforderung vom Betriebssystem und der Hardware abhängt:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Deaktivieren Sie Library Validation über Terminal, starten Sie in den Wiederherstellungsmodus neu, führen Sie `csrutil disable` aus, starten Sie neu.
   - **macOS 11+ (Big Sur und neuer), Intel:** Wiederherstellungsmodus (oder Internet Recovery), `csrutil disable`, Neustart.
   - **macOS 11+, Apple Silicon:** Startsequenz über die Einschalttaste, um Recovery zu öffnen; halten Sie bei aktuellen macOS-Versionen die Taste **Left Shift** gedrückt, wenn Sie auf Continue klicken, dann `csrutil disable`. Setups mit virtuellen Maschinen folgen einem separaten Ablauf — erstellen Sie zuerst einen VM-Snapshot.
   - **macOS 26 / Tahoe:** Library-Validation-Richtlinien und Private-Entitlement-Prüfungen von `imagent` wurden weiter verschärft; `imsg` benötigt möglicherweise einen aktualisierten Build, um Schritt zu halten. Wenn die Injektion per `imsg launch` oder bestimmte `selectors` nach einem macOS-Major-Upgrade false zurückgeben, prüfen Sie die Release Notes von `imsg`, bevor Sie annehmen, dass der SIP-Schritt erfolgreich war.

   Folgen Sie dem Recovery-Mode-Ablauf von Apple für Ihren Mac, um SIP vor der Ausführung von `imsg launch` zu deaktivieren.

3. **Injizieren Sie den Helper.** Mit deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, wenn SIP noch aktiviert ist; dies dient daher auch als Bestätigung, dass Schritt 2 gegriffen hat.

4. **Prüfen Sie die Bridge aus OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '.selectors'` sollte `retractMessagePart: true` plus die Edit-/Typing-/Read-Selektoren zeigen, die Ihr macOS-Build bereitstellt. Das methodenspezifische Gating des OpenClaw-Plugins in `actions.ts` bewirbt nur Aktionen, deren zugrunde liegender Selektor `true` ist; daher spiegelt die Aktionsoberfläche, die Sie in der Tool-Liste des Agenten sehen, wider, was die Bridge auf diesem Host tatsächlich leisten kann.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen aber zur Dispatch-Zeit "iMessage `<action>` requires the imsg private API bridge" auslösen, führen Sie `imsg launch` erneut aus — der Helper kann herausfallen (Neustart von Messages.app, OS-Update usw.), und der gecachte Status `available: true` bewirbt Aktionen weiter, bis der nächste Probe aktualisiert.

### Wenn Sie SIP nicht deaktivieren können

Wenn deaktiviertes SIP für Ihr Threat Model nicht akzeptabel ist:

- `imsg` fällt auf den Basismodus zurück — nur Text + Medien + Empfang.
- Das OpenClaw-Plugin bewirbt weiterhin Text-/Medienversand und eingehende Überwachung; es blendet lediglich `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (gemäß dem methodenspezifischen Capability-Gate).
- Sie können einen separaten Nicht-Apple-Silicon-Mac (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Arbeitslast betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe unten [Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)](#deployment-patterns).

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge können Handles, statische Absenderzugriffsgruppen (`accessGroup:<name>`) oder Chat-Ziele (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) sein.

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Allowlist für Gruppenabsender: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-Einträge können ebenfalls statische Absenderzugriffsgruppen (`accessGroup:<name>`) referenzieren.

    Runtime-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, fallen iMessage-Gruppenabsenderprüfungen auf `allowFrom` zurück, sofern verfügbar.
    Runtime-Hinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Runtime auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Gruppen-Routing hat **zwei** Allowlist-Gates, die direkt nacheinander laufen, und beide müssen bestanden werden:

    1. **Absender-/Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — Handle, `chat_guid`, `chat_identifier` oder `chat_id`.
    2. **Gruppen-Registry** (`channels.imessage.groups`) — mit `groupPolicy: "allowlist"` erfordert dieses Gate entweder einen Wildcard-Eintrag `groups: { "*": { ... } }` (setzt `allowAll = true`) oder einen expliziten Eintrag pro `chat_id` unter `groups`.

    Wenn Gate 2 keinen Inhalt hat, wird jede Gruppennachricht verworfen. Das Plugin gibt auf dem Standard-Loglevel zwei Signale auf `warn`-Level aus:

    - einmalig pro Account beim Start: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - einmalig pro `chat_id` zur Laufzeit: `imessage: dropping group message from chat_id=<id> ...`

    DMs funktionieren weiterhin, weil sie einen anderen Codepfad verwenden.

    Minimale Konfiguration, damit Gruppen unter `groupPolicy: "allowlist"` weiterlaufen:

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

    Wenn diese `warn`-Zeilen im Gateway-Log erscheinen, fällt Gate 2 durch — fügen Sie den `groups`-Block hinzu.
    </Warning>

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Mention-Metadaten
    - die Mention-Erkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Mention-Gating nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können Mention-Gating in Gruppen umgehen.

    `systemPrompt` pro Gruppe:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert einen optionalen `systemPrompt`-String. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt. Die Auflösung entspricht der Prompt-Auflösung pro Gruppe, die von `channels.whatsapp.groups` verwendet wird:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein `systemPrompt`-Schlüssel definiert ist. Wenn `systemPrompt` ein leerer String (`""`) ist, wird der Platzhalter unterdrückt und auf diese Gruppe wird kein System-Prompt angewendet.
    2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen `systemPrompt`-Schlüssel definiert.

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

    Prompts pro Gruppe gelten nur für Gruppennachrichten — Direktnachrichten in diesem Kanal bleiben unberührt.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standardwert `session.dmScope=main` werden iMessage-DMs in die Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der Metadaten des ursprünglichen Kanals/Ziels zurück an iMessage geroutet.

    Gruppenähnliches Thread-Verhalten:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eintreffen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + Gruppensitzungsisolierung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Legacy-iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Künftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Einträge auf oberster Ebene in `bindings[]` mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisiertes DM-Handle wie `+15555550123` oder `user@example.com`
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

Siehe [ACP-Agenten](/de/tools/acp-agents) für das gemeinsame Verhalten von ACP-Bindungen.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter bot-macOS-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen macOS-Benutzer, damit Bot-Datenverkehr von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer bzw. melden Sie sich bei ihm an.
    2. Melden Sie sich in Messages mit der Bot-Apple-ID in diesem Benutzer an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` in diesem Benutzerkontext ausführen kann.
    5. Richten Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Beim ersten Ausführen können GUI-Genehmigungen (Automatisierung + Vollzugriff auf die Festplatte) in dieser Bot-Benutzersitzung erforderlich sein.

  </Accordion>

  <Accordion title="Remote-Mac über Tailscale (Beispiel)">
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
    Stellen Sie zuerst sicher, dass der Host-Schlüssel vertrauenswürdig ist (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Multi-Account-Muster">
    iMessage unterstützt account-spezifische Konfiguration unter `channels.imessage.accounts`.

    Jeder Account kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Anhang-Root-Verzeichnisse überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - Eingehende Anhang-Verarbeitung ist **standardmäßig deaktiviert** — setzen Sie `channels.imessage.includeAttachments: true`, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agenten weiterzuleiten. Wenn dies deaktiviert ist, werden reine Anhang-iMessages verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise gar keine `Inbound message`-Logzeile.
    - Remote-Anhangpfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangpfade müssen erlaubten Roots entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (Remote-SCP-Modus)
      - Standard-Root-Muster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - Die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)

  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (absatzbasierte Aufteilung)

  </Accordion>

  <Accordion title="Adressierungsformate">
    Bevorzugte explizite Ziele:

    - `chat_id:123` (empfohlen für stabiles Routing)
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

Wenn `imsg launch` ausgeführt wird und `openclaw channels status --probe` `privateApi.available: true` meldet, kann das Nachrichten-Tool zusätzlich zu normalen Textsendungen native iMessage-Aktionen verwenden.

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Verfügbare Aktionen">
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks werden auf Love, Like, Dislike, Laugh, Emphasize und Question abgebildet.
    - **reply**: Eine Thread-Antwort auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message`, plus `chatGuid`, `chatId`, `chatIdentifier` oder `to`).
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`).
    - **edit**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen bearbeiten (`messageId`, `text` oder `newText`).
    - **unsend**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen zurückziehen (`messageId`).
    - **upload-file**: Medien/Dateien senden (`buffer` als base64 oder ein hydratisiertes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Legacy-Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenkonversation ist.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Eingehender iMessage-Kontext enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs, wenn verfügbar. Kurze IDs sind auf den aktuellen In-Memory-Antwortcache begrenzt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, versuchen Sie es erneut mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Fähigkeitserkennung">
    OpenClaw blendet Private-API-Aktionen nur aus, wenn der gecachte Probe-Status besagt, dass die Bridge nicht verfügbar ist. Wenn der Status unbekannt ist, bleiben Aktionen sichtbar und Dispatch-Probes werden verzögert ausgeführt, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Tippen">
    Wenn die Private-API-Bridge aktiv ist, werden akzeptierte eingehende Chats vor dem Dispatch als gelesen markiert und dem Absender wird eine Tippblase angezeigt, während der Agent generiert. Deaktivieren Sie das Als-gelesen-Markieren mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die älter sind als die Fähigkeitliste pro Methode, deaktivieren Tippen/Lesen stillschweigend; OpenClaw protokolliert pro Neustart eine einmalige Warnung, damit die fehlende Bestätigung zugeordnet werden kann.

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

## Zusammenführen aufgeteilter DM-Sendungen (Befehl + URL in einer Eingabe)

Wenn ein Benutzer einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apples Messages-App den Versand in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschaublase (`"https://..."`) mit OG-Vorschaubildern als Anhängen.

Die zwei Zeilen kommen bei den meisten Setups mit etwa 0,8-2,0 s Abstand bei OpenClaw an. Ohne Zusammenführung erhält der Agent den Befehl allein in Turn 1, antwortet (oft „senden Sie mir die URL“) und sieht die URL erst in Turn 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren. Das ist Apples Sendepipeline, nicht etwas, das OpenClaw oder `imsg` einführt.

`channels.imessage.coalesceSameSenderDms` aktiviert für eine DM das Zusammenführen aufeinanderfolgender Zeilen desselben Absenders zu einem einzigen Agenten-Turn. Gruppenchats dispatchen weiterhin pro Nachricht, damit die Turn-Struktur mit mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Lassen Sie es deaktiviert, wenn:

    - Sie minimale Befehlslatenz für Ein-Wort-DM-Trigger benötigen.
    - Alle Ihre Abläufe One-Shot-Befehle ohne Payload-Follow-ups sind.

  </Tab>
  <Tab title="Aktivieren">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Wenn das Flag aktiviert ist und kein explizites `messages.inbound.byChannel.imessage` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der bisherige Standardwert ist 0 ms – kein Debouncing). Das breitere Fenster ist erforderlich, weil Apples Split-Send-Takt von 0,8-2,0 s nicht in einen engeren Standardwert passt.

    So passen Sie das Fenster selbst an:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Kompromisse">
    - **Zusätzliche Latenz für DM-Nachrichten.** Wenn das Flag aktiviert ist, wartet jede DM (einschließlich eigenständiger Steuerbefehle und einzelner Textnachrichten als Nachtrag) bis zum Debounce-Fenster, bevor sie weitergeleitet wird, falls noch eine Payload-Zeile folgt. Gruppenchat-Nachrichten werden weiterhin sofort weitergeleitet.
    - **Zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen begrenzt, mit einem expliziten Marker `…[truncated]`; Anhänge sind auf 20 begrenzt; Quelleinträge auf 10 (erste plus neueste bleiben darüber hinaus erhalten). Jede Quell-GUID wird für nachgelagerte Telemetrie in `coalescedMessageGuids` nachverfolgt.
    - **Nur DM.** Gruppenchats fallen auf die Weiterleitung pro Nachricht zurück, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen tippen.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen. Bestehende BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` setzen, sollten diesen Wert nach `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                | `chat.db` erzeugt      | Flag aus (Standard)                    | Flag an + 2500-ms-Fenster                                               |
| ---------------------------------------------------------------- | ---------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ein Senden)                          | 2 Zeilen im Abstand von ~1 s | Zwei Agent-Durchläufe: nur "Dump", dann URL | Ein Durchlauf: zusammengeführter Text `Dump https://example.com`        |
| `Save this 📎image.jpg caption` (Anhang + Text)                  | 2 Zeilen               | Zwei Durchläufe (Anhang beim Zusammenführen verworfen) | Ein Durchlauf: Text + Bild bleiben erhalten                             |
| `/status` (eigenständiger Befehl)                                | 1 Zeile                | Sofortige Weiterleitung                | **Warten bis zum Fenster, dann weiterleiten**                           |
| URL allein eingefügt                                             | 1 Zeile                | Sofortige Weiterleitung                | Sofortige Weiterleitung (nur ein Eintrag im Bucket)                     |
| Text + URL als zwei bewusst getrennte Nachrichten, Minuten auseinander | 2 Zeilen außerhalb des Fensters | Zwei Durchläufe                         | Zwei Durchläufe (Fenster läuft dazwischen ab)                           |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)            | N Zeilen               | N Durchläufe                           | Ein Durchlauf, begrenzte Ausgabe (erste + neueste, Text-/Anhang-Limits angewendet) |
| Zwei Personen tippen in einem Gruppenchat                        | N Zeilen von M Absendern | M+ Durchläufe (einer pro Absender-Bucket) | M+ Durchläufe – Gruppenchats werden nicht zusammengeführt               |

## Nach Gateway-Ausfall aufholen

Wenn der Gateway offline ist (Absturz, Neustart, Mac im Ruhezustand, Maschine ausgeschaltet), setzt `imsg watch` beim aktuellen `chat.db`-Stand fort, sobald der Gateway wieder verfügbar ist – alles, was während der Lücke angekommen ist, wird standardmäßig nie gesehen. Catchup spielt diese Nachrichten beim nächsten Start erneut ein, damit der Agent eingehenden Verkehr nicht stillschweigend verpasst.

Catchup ist **standardmäßig deaktiviert**. Aktivieren Sie es pro Kanal:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Ablauf

Ein Durchlauf pro Start von `monitorIMessageProvider`, sequenziert als `imsg launch` bereit → `watch.subscribe` → `performIMessageCatchup` → Live-Dispatch-Schleife. Catchup selbst verwendet `chats.list` + pro Chat `messages.history` über denselben JSON-RPC-Client, den auch `imsg watch` nutzt. Alles, was während des Catchup-Durchlaufs ankommt, läuft normal über den Live-Dispatch; der bestehende Inbound-Dedupe-Cache fängt jede Überschneidung mit erneut eingespielten Zeilen ab.

Jede erneut eingespielte Zeile wird durch den Live-Dispatch-Pfad geführt (`evaluateIMessageInbound` + `dispatchInboundMessage`), sodass Allowlists, Gruppenrichtlinie, Debouncer, Echo-Cache und Lesebestätigungen bei erneut eingespielten und Live-Nachrichten identisch funktionieren.

### Cursor- und Retry-Semantik

Catchup hält pro Konto einen Cursor unter `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (das OpenClaw-State-Verzeichnis ist standardmäßig `~/.openclaw` und kann mit `OPENCLAW_STATE_DIR` überschrieben werden):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Der Cursor rückt bei jedem erfolgreichen Dispatch vor und bleibt stehen, wenn der Dispatch einer Zeile eine Ausnahme auslöst – der nächste Start versucht dieselbe Zeile ab dem gehaltenen Cursor erneut.
- Nach `maxFailureRetries` aufeinanderfolgenden Ausnahmen für dieselbe `guid` protokolliert Catchup ein `warn` und rückt den Cursor zwangsweise über die blockierte Nachricht hinaus, damit spätere Starts fortfahren können.
- GUIDs, die bereits aufgegeben wurden, werden bei späteren Durchläufen beim Sichtkontakt übersprungen (kein Dispatch-Versuch) und in der Laufzusammenfassung unter `skippedGivenUp` gezählt.

### Für Operatoren sichtbare Signale

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Eine Zeile `WARN ... capped to perRunLimit` bedeutet, dass ein einzelner Start den vollständigen Rückstand nicht abgearbeitet hat. Erhöhen Sie `perRunLimit` (max. 500), wenn Ihre Lücken regelmäßig den standardmäßigen 50-Zeilen-Durchlauf überschreiten.

### Wann es deaktiviert bleiben sollte

- Der Gateway läuft kontinuierlich mit Watchdog-Autoneustart und Lücken sind immer < einige Sekunden – der Standardwert aus ist ausreichend.
- Das DM-Volumen ist niedrig und verpasste Nachrichten würden das Agent-Verhalten nicht ändern – das anfängliche Fenster `firstRunLookbackMinutes` kann beim ersten Aktivieren überraschend alten Kontext weiterleiten.

Wenn Sie Catchup aktivieren, schaut der erste Start ohne Cursor nur `firstRunLookbackMinutes` zurück (Standard 30 min), nicht das vollständige Fenster `maxAgeMinutes` – dadurch wird vermieden, dass eine lange Historie von Nachrichten vor der Aktivierung erneut eingespielt wird.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie das Binary und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn private API-Aktionen nicht verfügbar sind, führen Sie `imsg launch` in der angemeldeten macOS-Benutzersitzung aus und prüfen Sie erneut. Wenn der Gateway nicht unter macOS läuft, verwenden Sie statt des standardmäßigen lokalen `imsg`-Pfads die oben beschriebene Einrichtung „Remote Mac über SSH“.

  </Accordion>

  <Accordion title="Gateway läuft nicht unter macOS">
    Der Standardwert `cliPath: "imsg"` muss auf dem Mac laufen, der bei Nachrichten angemeldet ist. Setzen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript, das per SSH zu diesem Mac verbindet und `imsg "$@"` ausführt.

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
    - Kopplungsgenehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Gruppennachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Konfiguration von Erwähnungsmustern (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Hostschlüssel ist in `~/.ssh/known_hosts` auf dem Gateway-Host vorhanden
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Nachrichten läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsabfragen wurden verpasst">
    Führen Sie erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Abfragen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bestätigen Sie, dass Vollzugriff auf Festplatte + Automation für den Prozesskontext gewährt sind, der OpenClaw/`imsg` ausführt.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)

## Verwandt

- [Kanalübersicht](/de/channels) – alle unterstützten Kanäle
- [BlueBubbles-Entfernung und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) – Ankündigung und Migrationszusammenfassung
- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) – Konfigurationsübersetzungstabelle und schrittweise Umstellung
- [Kopplung](/de/channels/pairing) – DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) – Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) – Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Härtung
