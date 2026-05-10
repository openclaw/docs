---
read_when:
    - iMessage-Unterstützung einrichten
    - Debugging beim Senden/Empfangen mit iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio), mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Empfohlen für neue OpenClaw-iMessage-Konfigurationen, wenn die Host-Anforderungen erfüllt sind.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Verwenden Sie für OpenClaw iMessage-Deployments `imsg` auf einem macOS-Messages-Host, der angemeldet ist. Wenn Ihr Gateway unter Linux oder Windows läuft, setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Nachholen nach Gateway-Ausfallzeiten ist Opt-in.** Wenn aktiviert (`channels.imessage.catchup.enabled: true`), spielt der Gateway beim nächsten Start eingehende Nachrichten erneut ab, die während der Offline-Zeit (Absturz, Neustart, Mac-Ruhezustand) in `chat.db` eingetroffen sind. Standardmäßig deaktiviert — siehe [Nachholen nach Gateway-Ausfallzeiten](#catching-up-after-gateway-downtime). Schließt [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
BlueBubbles-Unterstützung wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage nur über `imsg`.
</Warning>

Status: native externe CLI-Integration. Gateway startet `imsg rpc` und kommuniziert per JSON-RPC über stdio (kein separater Daemon/Port). Erweiterte Aktionen erfordern `imsg launch` und eine erfolgreiche Private-API-Prüfung.

<CardGroup cols={3}>
  <Card title="Private-API-Aktionen" icon="wand-sparkles" href="#private-api-actions">
    Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Entfernter Mac" icon="terminal" href="#remote-mac-over-ssh">
    Verwenden Sie einen SSH-Wrapper, wenn der Gateway nicht auf dem Messages-Mac läuft.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige iMessage-Feldreferenz.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
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

      <Step title="Erste DM-Kopplung genehmigen (Standard-dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Entfernter Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript setzen, das per SSH eine Verbindung zu einem entfernten Mac herstellt und `imsg` ausführt.

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
- Full Disk Access ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` ausgeführt wird (Zugriff auf die Messages-Datenbank).
- Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (Reagieren / Bearbeiten / Zurückziehen / Thread-Antwort / Effekte / Gruppenoperationen) muss System Integrity Protection deaktiviert sein — siehe unten [imsg Private API aktivieren](#enabling-the-imsg-private-api). Einfaches Senden/Empfangen von Text und Medien funktioniert ohne diese Änderung.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn der Gateway headless läuft (LaunchAgent/SSH), führen Sie einmalig einen interaktiven Befehl in genau diesem Kontext aus, um die Abfragen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## imsg Private API aktivieren

`imsg` wird in zwei Betriebsmodi ausgeliefert:

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehender Text und Medien über `send`, eingehende Überwachung/Verlauf, Chatliste. Das erhalten Sie sofort nach einer frischen Installation mit `brew install steipete/tap/imsg` plus den oben genannten standardmäßigen macOS-Berechtigungen.
- **Private-API-Modus**: `imsg` injiziert eine Helper-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (Thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Um die erweiterte Aktionsoberfläche zu nutzen, die diese Channel-Seite dokumentiert, benötigen Sie den Private-API-Modus. Das `imsg`-README benennt die Anforderung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, bridge-gestütztes Rich Send, Nachrichtenänderung und Chatverwaltung sind Opt-in. Sie erfordern, dass SIP deaktiviert ist und eine Helper-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Helper-Injektionstechnik verwendet die eigene dylib von `imsg`, um Messages Private APIs zu erreichen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieter-Server und keine BlueBubbles-Laufzeit.

<Warning>
**SIP zu deaktivieren ist ein echter Sicherheitskompromiss.** SIP ist einer der zentralen macOS-Schutzmechanismen gegen das Ausführen veränderten Systemcodes; die systemweite Deaktivierung vergrößert die Angriffsfläche und kann Nebeneffekte haben. Insbesondere **deaktiviert SIP auf Apple-Silicon-Macs auch die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste Betriebsentscheidung, nicht als Standard. Wenn Ihr Bedrohungsmodell deaktiviertes SIP nicht toleriert, ist das gebündelte iMessage auf den Basismodus beschränkt — nur Senden/Empfangen von Text und Medien, keine Reaktionen / Bearbeitung / Zurückziehen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app ausgeführt wird:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und pro Methode `selectors`, sodass Sie vor dem Start sehen können, was der aktuelle Build unterstützt.

2. **Deaktivieren Sie System Integrity Protection.** Dies ist macOS-versionsspezifisch, da die zugrunde liegende Apple-Anforderung vom Betriebssystem und von der Hardware abhängt:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Deaktivieren Sie Library Validation über Terminal, starten Sie in den Wiederherstellungsmodus neu, führen Sie `csrutil disable` aus, starten Sie neu.
   - **macOS 11+ (Big Sur und neuer), Intel:** Wiederherstellungsmodus (oder Internet Recovery), `csrutil disable`, Neustart.
   - **macOS 11+, Apple Silicon:** Startsequenz mit Einschalttaste, um Recovery zu öffnen; halten Sie bei aktuellen macOS-Versionen die **linke Umschalttaste** gedrückt, wenn Sie auf Fortfahren klicken, dann `csrutil disable`. Setups mit virtuellen Maschinen folgen einem separaten Ablauf — erstellen Sie zuerst einen VM-Snapshot.
   - **macOS 26 / Tahoe:** Richtlinien für Library Validation und Private-Entitlement-Prüfungen von `imagent` wurden weiter verschärft; `imsg` benötigt möglicherweise einen aktualisierten Build, um Schritt zu halten. Wenn die Injektion mit `imsg launch` oder bestimmte `selectors` nach einem großen macOS-Upgrade `false` zurückgeben, prüfen Sie die Release Notes von `imsg`, bevor Sie annehmen, dass der SIP-Schritt erfolgreich war.

   Folgen Sie dem Apple-Ablauf für den Wiederherstellungsmodus auf Ihrem Mac, um SIP zu deaktivieren, bevor Sie `imsg launch` ausführen.

3. **Injizieren Sie den Helper.** Mit deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, wenn SIP noch aktiviert ist; dies dient also zugleich als Bestätigung, dass Schritt 2 wirksam war.

4. **Überprüfen Sie die Bridge über OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '.selectors'` sollte `retractMessagePart: true` plus die Edit-/Typing-/Read-Selektoren anzeigen, die Ihr macOS-Build bereitstellt. Das methodenspezifische Gating des OpenClaw-Plugins in `actions.ts` bewirbt nur Aktionen, deren zugrunde liegender Selektor `true` ist. Daher spiegelt die Aktionsoberfläche, die Sie in der Tool-Liste des Agenten sehen, wider, was die Bridge auf diesem Host tatsächlich ausführen kann.

Wenn `openclaw channels status --probe` den Channel als `works` meldet, bestimmte Aktionen aber zur Dispatch-Zeit „iMessage `<action>` requires the imsg private API bridge“ auslösen, führen Sie `imsg launch` erneut aus — der Helper kann ausfallen (Neustart von Messages.app, OS-Update usw.), und der zwischengespeicherte Status `available: true` bewirbt Aktionen weiter, bis die nächste Prüfung ihn aktualisiert.

### Wenn Sie SIP nicht deaktivieren können

Wenn deaktiviertes SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` fällt auf den Basismodus zurück — nur Text + Medien + Empfang.
- Das OpenClaw-Plugin bewirbt weiterhin Text-/Medienversand und eingehende Überwachung; es blendet lediglich `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (gemäß dem methodenspezifischen Capability-Gate).
- Sie können einen separaten Mac ohne Apple Silicon (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Workload betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe unten [Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)](#deployment-patterns).

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

    Gruppen-Absender-Allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-Einträge können ebenfalls auf statische Absenderzugriffsgruppen (`accessGroup:<name>`) verweisen.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, fallen iMessage-Gruppenabsenderprüfungen auf `allowFrom` zurück, sofern verfügbar.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Gruppen-Routing hat **zwei** Allowlist-Gates, die direkt nacheinander ausgeführt werden, und beide müssen bestehen:

    1. **Absender-/Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — Handle, `chat_guid`, `chat_identifier` oder `chat_id`.
    2. **Gruppenregistrierung** (`channels.imessage.groups`) — mit `groupPolicy: "allowlist"` erfordert dieses Gate entweder einen Wildcard-Eintrag `groups: { "*": { ... } }` (setzt `allowAll = true`) oder einen expliziten Eintrag pro `chat_id` unter `groups`.

    Wenn Gate 2 leer ist, wird jede Gruppennachricht verworfen. Das Plugin gibt auf dem standardmäßigen Log-Level zwei `warn`-Signale aus:

    - einmalig pro Konto beim Start: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
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

    Wenn diese `warn`-Zeilen im Gateway-Log erscheinen, verwirft Gate 2 — fügen Sie den `groups`-Block hinzu.
    </Warning>

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann die Erwähnungsprüfung nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können die Erwähnungsprüfung in Gruppen umgehen.

    Pro-Gruppe-`systemPrompt`:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert einen optionalen `systemPrompt`-String. Der Wert wird bei jeder Interaktion, die eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt. Die Auflösung entspricht der pro Gruppe verwendeten Prompt-Auflösung von `channels.whatsapp.groups`:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` ein leerer String (`""`) ist, wird der Platzhalter unterdrückt und auf diese Gruppe wird kein System-Prompt angewendet.
    2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

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

    Pro-Gruppe-Prompts gelten nur für Gruppennachrichten — Direktnachrichten in diesem Kanal sind nicht betroffen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standardwert `session.dmScope=main` werden iMessage-DMs in die Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden über Metadaten zu ursprünglichem Kanal und Ziel zurück an iMessage geleitet.

    Verhalten gruppenähnlicher Threads:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` ankommen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + isolierte Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Ältere iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die gestartete ACP-Sitzung geleitet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über `bindings[]`-Einträge auf oberster Ebene mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

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

Siehe [ACP-Agenten](/de/tools/acp-agents) für gemeinsames Verhalten von ACP-Bindungen.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter bot-macOS-Benutzer (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple ID und einen dedizierten macOS-Benutzer, damit Bot-Datenverkehr von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer oder melden Sie sich als solcher an.
    2. Melden Sie sich in diesem Benutzer in Messages mit der Bot-Apple-ID an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Setzen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Beim ersten Ausführen können GUI-Freigaben (Automation + Vollzugriff auf die Festplatte) in dieser Bot-Benutzersitzung erforderlich sein.

  </Accordion>

  <Accordion title="Entfernter Mac über Tailscale (Beispiel)">
    Häufige Topologie:

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
    Stellen Sie sicher, dass der Hostschlüssel zuerst vertrauenswürdig ist (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` gefüllt wird.

  </Accordion>

  <Accordion title="Multi-Account-Muster">
    iMessage unterstützt Konfiguration pro Account unter `channels.imessage.accounts`.

    Jeder Account kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlisten für Anhang-Roots überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - das Einlesen eingehender Anhänge ist **standardmäßig deaktiviert** — setzen Sie `channels.imessage.includeAttachments: true`, um Fotos, Sprachnotizen, Videos und andere Anhänge an den Agenten weiterzuleiten. Wenn dies deaktiviert ist, werden reine Anhang-iMessages verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Logzeile.
    - entfernte Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangspfade müssen erlaubten Roots entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (entfernter SCP-Modus)
      - Standard-Root-Muster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Hostschlüsselprüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)

  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (Absatz-vorrangige Aufteilung)

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

Wenn `imsg launch` läuft und `openclaw channels status --probe` `privateApi.available: true` meldet, kann das Nachrichten-Tool zusätzlich zu normalen Textsendungen native iMessage-Aktionen verwenden.

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
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks werden love, like, dislike, laugh, emphasize und question zugeordnet.
    - **reply**: Eine Thread-Antwort auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message`, plus `chatGuid`, `chatId`, `chatIdentifier` oder `to`).
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`).
    - **edit**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen bearbeiten (`messageId`, `text` oder `newText`).
    - **unsend**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen zurückziehen (`messageId`).
    - **upload-file**: Medien/Dateien senden (`buffer` als base64 oder ein hydratisiertes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Legacy-Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenkonversation ist.

  </Accordion>

  <Accordion title="Nachrichten-IDs">
    Eingehender iMessage-Kontext enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs, wenn verfügbar. Kurze IDs sind auf den aktuellen In-Memory-Antwort-Cache beschränkt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, versuchen Sie es erneut mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Capability-Erkennung">
    OpenClaw blendet Private-API-Aktionen nur aus, wenn der zwischengespeicherte Prüfstatus besagt, dass die Bridge nicht verfügbar ist. Wenn der Status unbekannt ist, bleiben Aktionen sichtbar und Dispatches führen Prüfungen lazy aus, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Lesebestätigungen und Tippen">
    Wenn die Private-API-Bridge aktiv ist, werden akzeptierte eingehende Chats vor dem Dispatch als gelesen markiert und dem Absender wird eine Tippblase angezeigt, während der Agent generiert. Deaktivieren Sie das Markieren als gelesen mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der Capability-Liste pro Methode entstanden sind, schalten Tippen/Lesen stillschweigend ab; OpenClaw protokolliert einmal pro Neustart eine Warnung, damit die fehlende Bestätigung zuordenbar ist.

  </Accordion>
</AccordionGroup>

## Konfigurationsschreibvorgänge

iMessage erlaubt standardmäßig kanalinitiierte Konfigurationsschreibvorgänge (für `/config set|unset`, wenn `commands.config: true`).

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

Wenn ein Benutzer einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apples Messages-App den Versand in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Zeilen treffen auf den meisten Setups bei OpenClaw etwa 0,8-2,0 s auseinander ein. Ohne Zusammenführung erhält der Agent in Interaktion 1 nur den Befehl, antwortet (oft „senden Sie mir die URL“) und sieht die URL erst in Interaktion 2 — zu diesem Zeitpunkt ist der Befehlskontext bereits verloren. Das ist Apples Sendepipeline, nicht etwas, das OpenClaw oder `imsg` einführt.

`channels.imessage.coalesceSameSenderDms` entscheidet, dass eine DM aufeinanderfolgende Zeilen desselben Absenders zu einer einzigen Agenten-Interaktion zusammenführt. Gruppenchats werden weiterhin pro Nachricht dispatched, damit die Mehrbenutzer-Turn-Struktur erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte neben Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Deaktiviert lassen, wenn:

    - Sie minimale Befehlslatenz für Ein-Wort-DM-Trigger benötigen.
    - Alle Ihre Abläufe One-Shot-Befehle ohne Payload-Folgeinhalte sind.

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

    Bei aktiviertem Flag und ohne explizites `messages.inbound.byChannel.imessage` wird das Debounce-Fenster auf **2500 ms** erweitert (der Legacy-Standardwert ist 0 ms — kein Debouncing). Das größere Fenster ist erforderlich, weil Apples Takt beim getrennten Senden von 0,8-2,0 s nicht in einen engeren Standardwert passt.

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
  <Tab title="Trade-offs">
    - **Zusätzliche Latenz für DM-Nachrichten.** Bei aktiviertem Flag wartet jede DM (einschließlich eigenständiger Steuerbefehle und einzelner Textnachrichten als Follow-up) bis zum Debounce-Fenster, bevor sie weitergeleitet wird, falls noch eine Payload-Zeile eintrifft. Gruppenchat-Nachrichten werden weiterhin sofort weitergeleitet.
    - **Zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten `…[truncated]`-Marker begrenzt; Anhänge sind auf 20 begrenzt; Quelleneinträge sind auf 10 begrenzt (darüber hinaus bleiben der erste und die neuesten erhalten). Jede Quell-GUID wird in `coalescedMessageGuids` für nachgelagerte Telemetrie erfasst.
    - **Nur DM.** Gruppenchats werden weiterhin pro Nachricht weitergeleitet, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen tippen.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen. Legacy-BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` setzen, sollten diesen Wert nach `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer erstellt                                                  | `chat.db` erzeugt     | Flag aus (Standard)                     | Flag an + 2500-ms-Fenster                                               |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ein Senden)                            | 2 Zeilen ~1 s Abstand | Zwei Agent-Turns: nur „Dump“, dann URL  | Ein Turn: zusammengeführter Text `Dump https://example.com`             |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Zeilen              | Zwei Turns (Anhang beim Merge verworfen) | Ein Turn: Text + Bild bleiben erhalten                                  |
| `/status` (eigenständiger Befehl)                                  | 1 Zeile               | Sofortige Weiterleitung                 | **Bis zum Fenster warten, dann weiterleiten**                           |
| URL allein eingefügt                                               | 1 Zeile               | Sofortige Weiterleitung                 | Sofortige Weiterleitung (nur ein Eintrag im Bucket)                     |
| Text + URL als zwei bewusst getrennte Nachrichten im Minutenabstand gesendet | 2 Zeilen außerhalb des Fensters | Zwei Turns                              | Zwei Turns (Fenster läuft dazwischen ab)                                |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Zeilen              | N Turns                                 | Ein Turn, begrenzte Ausgabe (erste + neueste, Text-/Anhanglimits angewendet) |
| Zwei Personen tippen in einem Gruppenchat                          | N Zeilen von M Absendern | M+ Turns (einer pro Absender-Bucket)    | M+ Turns — Gruppenchats werden nicht zusammengeführt                    |

## Aufholen nach Gateway-Ausfallzeit

Wenn der Gateway offline ist (Absturz, Neustart, Mac-Ruhezustand, ausgeschaltete Maschine), setzt `imsg watch` beim aktuellen `chat.db`-Zustand fort, sobald der Gateway wieder verfügbar ist — alles, was während der Lücke eingetroffen ist, wird standardmäßig nie gesehen. Catchup spielt diese Nachrichten beim nächsten Start erneut ab, damit der Agent eingehenden Traffic nicht stillschweigend verpasst.

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

Ein Durchlauf pro `monitorIMessageProvider`-Start, sequenziert als `imsg launch` bereit → `watch.subscribe` → `performIMessageCatchup` → Live-Dispatch-Schleife. Catchup selbst verwendet `chats.list` + pro Chat `messages.history` gegen denselben JSON-RPC-Client, der von `imsg watch` verwendet wird. Alles, was während des Catchup-Durchlaufs eintrifft, läuft normal durch den Live-Dispatch; der vorhandene Inbound-Dedupe-Cache fängt Überschneidungen mit erneut abgespielten Zeilen ab.

Jede erneut abgespielte Zeile wird durch den Live-Dispatch-Pfad (`evaluateIMessageInbound` + `dispatchInboundMessage`) geführt, sodass Allowlists, Gruppenrichtlinie, Debouncer, Echo-Cache und Lesebestätigungen bei erneut abgespielten und Live-Nachrichten identisch funktionieren.

### Cursor- und Retry-Semantik

Catchup hält einen Cursor pro Konto unter `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (das OpenClaw-Zustandsverzeichnis ist standardmäßig `~/.openclaw`, überschreibbar mit `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Der Cursor rückt nach jedem erfolgreichen Dispatch vor und wird gehalten, wenn der Dispatch einer Zeile einen Fehler wirft — der nächste Start versucht dieselbe Zeile ab dem gehaltenen Cursor erneut.
- Nach `maxFailureRetries` aufeinanderfolgenden Fehlern für dieselbe `guid` protokolliert Catchup eine `warn` und setzt den Cursor zwangsweise hinter die blockierte Nachricht, damit spätere Starts Fortschritt machen können.
- Bereits aufgegebene GUIDs werden bei Sichtung in späteren Läufen übersprungen (kein Dispatch-Versuch) und in der Laufzusammenfassung unter `skippedGivenUp` gezählt.

### Für Operator sichtbare Signale

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Eine Zeile `WARN ... capped to perRunLimit` bedeutet, dass ein einzelner Start den vollständigen Rückstand nicht abgearbeitet hat. Erhöhen Sie `perRunLimit` (max. 500), wenn Ihre Lücken regelmäßig den Standarddurchlauf mit 50 Zeilen überschreiten.

### Wann Sie es deaktiviert lassen sollten

- Der Gateway läuft kontinuierlich mit Watchdog-Autoneustart, und Lücken sind immer < einige Sekunden — der Standardwert „aus“ ist in Ordnung.
- Das DM-Aufkommen ist niedrig, und verpasste Nachrichten würden das Agent-Verhalten nicht ändern — das anfängliche Fenster `firstRunLookbackMinutes` kann beim ersten Aktivieren überraschend alten Kontext weiterleiten.

Wenn Sie Catchup aktivieren, blickt der erste Start ohne Cursor nur `firstRunLookbackMinutes` zurück (Standard: 30 min), nicht das vollständige `maxAgeMinutes`-Fenster — dies verhindert, dass eine lange Historie von Nachrichten vor der Aktivierung erneut abgespielt wird.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Validieren Sie die Binärdatei und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn private API-Aktionen nicht verfügbar sind, führen Sie `imsg launch` in der angemeldeten macOS-Benutzersitzung aus und testen Sie erneut. Wenn der Gateway nicht unter macOS läuft, verwenden Sie stattdessen die oben beschriebene Einrichtung „Remote Mac über SSH“ anstelle des standardmäßigen lokalen `imsg`-Pfads.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    Das standardmäßige `cliPath: "imsg"` muss auf dem Mac ausgeführt werden, der bei Nachrichten angemeldet ist. Setzen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript, das per SSH auf diesen Mac zugreift und `imsg "$@"` ausführt.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Führen Sie dann aus:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Prüfen Sie:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - Pairing-Genehmigungen (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Prüfen Sie:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - Allowlist-Verhalten von `channels.imessage.groups`
    - Erwähnungsmuster-Konfiguration (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Hostschlüssel ist in `~/.ssh/known_hosts` auf dem Gateway-Host vorhanden
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Nachrichten läuft

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Führen Sie es erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Eingabeaufforderungen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bestätigen Sie, dass Vollzugriff auf das Laufwerk + Automation für den Prozesskontext gewährt sind, der OpenClaw/`imsg` ausführt.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Pairing](/de/channels/pairing)

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) — Konfigurationsübersetzungstabelle und schrittweiser Cutover
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Mention-Gating
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
