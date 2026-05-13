---
read_when:
    - iMessage-Unterstützung einrichten
    - Fehlerbehebung beim Senden/Empfangen mit iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio), mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Setups, wenn die Host-Anforderungen passen.
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Verwenden Sie für OpenClaw iMessage-Bereitstellungen `imsg` auf einem macOS-Messages-Host, der angemeldet ist. Wenn Ihr Gateway unter Linux oder Windows läuft, verweisen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Das Nachholen nach Gateway-Ausfallzeiten ist optional.** Wenn es aktiviert ist (`channels.imessage.catchup.enabled: true`), spielt das Gateway beim nächsten Start eingehende Nachrichten erneut ab, die während der Offline-Zeit (Absturz, Neustart, Mac-Ruhezustand) in `chat.db` eingegangen sind. Standardmäßig deaktiviert — siehe [Nachholen nach Gateway-Ausfallzeiten](#catching-up-after-gateway-downtime). Schließt [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Die BlueBubbles-Unterstützung wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage ausschließlich über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder mit [Wechsel von BlueBubbles](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native externe CLI-Integration. Das Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port). Erweiterte Aktionen erfordern `imsg launch` und einen erfolgreichen Private-API-Test.

<CardGroup cols={3}>
  <Card title="Private-API-Aktionen" icon="wand-sparkles" href="#private-api-actions">
    Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung.
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

  <Tab title="Entfernter Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript verweisen, das per SSH eine Verbindung zu einem entfernten Mac herstellt und `imsg` ausführt.

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
    OpenClaw verwendet für SCP strikte Host-Key-Prüfung, daher muss der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen erlaubte Wurzeln (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` läuft.
- Full Disk Access ist für den Prozesskontext erforderlich, der OpenClaw/`imsg` ausführt (Zugriff auf die Messages-Datenbank).
- Eine Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (reagieren / bearbeiten / Senden zurücknehmen / Thread-Antwort / Effekte / Gruppenoperationen) muss System Integrity Protection deaktiviert sein — siehe [Aktivieren der imsg Private API](#enabling-the-imsg-private-api) unten. Einfaches Senden/Empfangen von Text und Medien funktioniert ohne dies.

<Tip>
Berechtigungen werden pro Prozesskontext gewährt. Wenn das Gateway headless läuft (LaunchAgent/SSH), führen Sie einmalig einen interaktiven Befehl in demselben Kontext aus, um Eingabeaufforderungen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Aktivieren der imsg Private API

`imsg` wird in zwei Betriebsmodi ausgeliefert:

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehender Text und Medien über `send`, eingehendes Watch/History, Chatliste. Dies erhalten Sie direkt mit einer frischen Installation über `brew install steipete/tap/imsg` plus den oben genannten macOS-Standardberechtigungen.
- **Private-API-Modus**: `imsg` injiziert eine Hilfs-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (Thread-Antwort), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Um die auf dieser Kanalseite dokumentierte Oberfläche für erweiterte Aktionen zu erreichen, benötigen Sie den Private-API-Modus. Das `imsg`-README formuliert die Anforderung ausdrücklich:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, bridge-gestütztes Rich Send, Nachrichtenänderung und Chatverwaltung sind optional. Sie erfordern, dass SIP deaktiviert ist und eine Hilfs-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Helper-Injection-Technik verwendet die eigene dylib von `imsg`, um Messages-Private-APIs zu erreichen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieter-Server und keine BlueBubbles-Laufzeit.

<Warning>
**Das Deaktivieren von SIP ist ein realer Sicherheitskompromiss.** SIP ist einer der zentralen macOS-Schutzmechanismen gegen das Ausführen veränderten Systemcodes; das systemweite Deaktivieren öffnet zusätzliche Angriffsfläche und kann Nebeneffekte haben. Insbesondere **deaktiviert das Deaktivieren von SIP auf Apple-Silicon-Macs auch die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste betriebliche Entscheidung, nicht als Standard. Wenn Ihr Bedrohungsmodell deaktiviertes SIP nicht zulässt, ist das gebündelte iMessage auf den Basismodus beschränkt — nur Senden/Empfangen von Text und Medien, keine Reaktionen / Bearbeiten / Senden zurücknehmen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und pro Methode `selectors`, damit Sie vor dem Start sehen können, was der aktuelle Build unterstützt.

2. **Deaktivieren Sie System Integrity Protection.** Dies ist macOS-versionsspezifisch, da die zugrunde liegende Apple-Anforderung vom Betriebssystem und der Hardware abhängt:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Deaktivieren Sie Library Validation über Terminal, starten Sie in den Recovery Mode neu, führen Sie `csrutil disable` aus und starten Sie neu.
   - **macOS 11+ (Big Sur und neuer), Intel:** Recovery Mode (oder Internet Recovery), `csrutil disable`, neu starten.
   - **macOS 11+, Apple Silicon:** Startsequenz über den Einschaltknopf, um Recovery zu öffnen; halten Sie bei neueren macOS-Versionen die Taste **Linke Umschalttaste** gedrückt, wenn Sie auf Fortfahren klicken, und führen Sie dann `csrutil disable` aus. Setups mit virtuellen Maschinen folgen einem separaten Ablauf — erstellen Sie zuerst einen VM-Snapshot.
   - **macOS 26 / Tahoe:** Library-Validation-Richtlinien und Private-Entitlement-Prüfungen von `imagent` wurden weiter verschärft; `imsg` benötigt möglicherweise einen aktualisierten Build, um Schritt zu halten. Wenn `imsg launch`-Injektion oder bestimmte `selectors` nach einem großen macOS-Upgrade `false` zurückgeben, prüfen Sie die Release Notes von `imsg`, bevor Sie davon ausgehen, dass der SIP-Schritt erfolgreich war.

   Folgen Sie Apples Recovery-Mode-Ablauf für Ihren Mac, um SIP zu deaktivieren, bevor Sie `imsg launch` ausführen.

3. **Injizieren Sie den Helper.** Mit deaktiviertem SIP und angemeldeter Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, wenn SIP noch aktiviert ist; dies dient daher zugleich als Bestätigung, dass Schritt 2 wirksam war.

4. **Prüfen Sie die Bridge über OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '.selectors'` sollte `retractMessagePart: true` sowie alle Edit-/Typing-/Read-Selektoren anzeigen, die Ihr macOS-Build bereitstellt. Das Pro-Methode-Gating des OpenClaw-Plugins in `actions.ts` bewirbt nur Aktionen, deren zugrunde liegender Selektor `true` ist; die Aktionsoberfläche, die Sie in der Tool-Liste des Agent sehen, spiegelt daher wider, was die Bridge auf diesem Host tatsächlich ausführen kann.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, bestimmte Aktionen aber zur Dispatch-Zeit "iMessage `<action>` requires the imsg private API bridge" auslösen, führen Sie `imsg launch` erneut aus — der Helper kann herausfallen (Neustart von Messages.app, OS-Update usw.), und der gecachte Status `available: true` bewirbt Aktionen weiter, bis der nächste Probe ihn aktualisiert.

### Wenn Sie SIP nicht deaktivieren können

Wenn deaktiviertes SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` fällt auf den Basismodus zurück — nur Text + Medien + Empfang.
- Das OpenClaw-Plugin bewirbt weiterhin Text-/Medienversand und eingehende Überwachung; es blendet lediglich `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (gemäß dem Pro-Methode-Capability-Gate).
- Sie können einen separaten Nicht-Apple-Silicon-Mac (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Workload betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe [Dedizierter macOS-Bot-Benutzer (separate iMessage-Identität)](#deployment-patterns) unten.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge müssen Absender identifizieren: Handles oder statische Absenderzugriffsgruppen (`accessGroup:<name>`). Verwenden Sie `channels.imessage.groupAllowFrom` für Chat-Ziele wie `chat_id:*`, `chat_guid:*` oder `chat_identifier:*`; verwenden Sie `channels.imessage.groups` für numerische `chat_id`-Registrierungsschlüssel.

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Gruppen-Absender-Allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-Einträge können auch auf statische Absenderzugriffsgruppen verweisen (`accessGroup:<name>`).

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, verwenden iMessage-Gruppen-Absenderprüfungen `allowFrom`; setzen Sie `groupAllowFrom`, wenn sich die Zulassung für DMs und Gruppen unterscheiden soll.
    Laufzeithinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Gruppen-Routing hat **zwei** Allowlist-Gates, die direkt nacheinander laufen, und beide müssen bestehen:

    1. **Absender-/Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — Handle, `chat_guid`, `chat_identifier` oder `chat_id`.
    2. **Gruppenregistrierung** (`channels.imessage.groups`) — mit `groupPolicy: "allowlist"` erfordert dieses Gate entweder einen Wildcard-Eintrag `groups: { "*": { ... } }` (setzt `allowAll = true`) oder einen expliziten Eintrag pro `chat_id` unter `groups`.

    Wenn Gate 2 leer ist, wird jede Gruppennachricht verworfen. Das Plugin gibt auf der Standard-Protokollebene zwei Signale auf `warn`-Ebene aus:

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

    Wenn diese `warn`-Zeilen im Gateway-Protokoll erscheinen, wird Gate 2 verworfen — fügen Sie den `groups`-Block hinzu.
    </Warning>

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Mention-Metadaten
    - Die Mention-Erkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Ohne konfigurierte Muster kann Mention-Gating nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können Mention-Gating in Gruppen umgehen.

    `systemPrompt` pro Gruppe:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert eine optionale `systemPrompt`-Zeichenfolge. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agents eingefügt. Die Auflösung spiegelt die Prompt-Auflösung pro Gruppe wider, die von `channels.whatsapp.groups` verwendet wird:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map existiert **und** sein `systemPrompt`-Schlüssel definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und auf diese Gruppe wird kein System-Prompt angewendet.
    2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag vollständig in der Map fehlt oder wenn er existiert, aber keinen `systemPrompt`-Schlüssel definiert.

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

    Prompts pro Gruppe gelten nur für Gruppennachrichten — Direktnachrichten in diesem Kanal sind nicht betroffen.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Direktnachrichten verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standardwert `session.dmScope=main` werden iMessage-Direktnachrichten in der Haupt-Session des Agents zusammengeführt.
    - Gruppen-Sessions sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der ursprünglichen Kanal-/Ziel-Metadaten zurück an iMessage geroutet.

    Gruppenähnliches Thread-Verhalten:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` eingehen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppen-Gating + Isolation der Gruppen-Session).

  </Tab>
</Tabs>

## ACP-Konversationsbindungen

Legacy-iMessage-Chats können auch an ACP-Sessions gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` in der Direktnachricht oder im erlaubten Gruppenchat aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Session geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Session an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Session und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Einträge der obersten Ebene `bindings[]` mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

`match.peer.id` kann Folgendes verwenden:

- normalisiertes Direktnachrichten-Handle wie `+15555550123` oder `user@example.com`
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

Siehe [ACP Agents](/de/tools/acp-agents) für gemeinsames ACP-Bindungsverhalten.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Verwenden Sie eine dedizierte Apple ID und einen dedizierten macOS-Benutzer, damit Bot-Datenverkehr von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer bzw. melden Sie sich dort an.
    2. Melden Sie sich in diesem Benutzer in Messages mit der Bot-Apple-ID an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` in diesem Benutzerkontext ausführen kann.
    5. Verweisen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Beim ersten Lauf können GUI-Genehmigungen (Automation + Full Disk Access) in dieser Bot-Benutzersitzung erforderlich sein.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Gängige Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - Der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
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
    Stellen Sie zuerst sicher, dass der Hostschlüssel vertrauenswürdig ist (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt wird.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage unterstützt Konfiguration pro Konto unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Anhang-Stammverzeichnisse überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Attachments and media">
    - Die Verarbeitung eingehender Anhänge ist **standardmäßig deaktiviert** — setzen Sie `channels.imessage.includeAttachments: true`, um Fotos, Sprachnotizen, Videos und andere Anhänge an den Agent weiterzuleiten. Wenn dies deaktiviert ist, werden iMessages, die nur Anhänge enthalten, verworfen, bevor sie den Agent erreichen, und erzeugen möglicherweise gar keine `Inbound message`-Protokollzeile.
    - Remote-Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangspfade müssen erlaubten Stammverzeichnissen entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (Remote-SCP-Modus)
      - Standard-Stammverzeichnismuster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Hostschlüsselprüfung (`StrictHostKeyChecking=yes`)
    - Die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - Text-Chunk-Limit: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (absatzorientierte Aufteilung)

  </Accordion>

  <Accordion title="Addressing formats">
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

## Private API-Aktionen

Wenn `imsg launch` läuft und `openclaw channels status --probe` `privateApi.available: true` meldet, kann das Nachrichtentool zusätzlich zum normalen Textversand native iMessage-Aktionen verwenden.

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
  <Accordion title="Available actions">
    - **react**: iMessage-Tapbacks hinzufügen/entfernen (`messageId`, `emoji`, `remove`). Unterstützte Tapbacks werden love, like, dislike, laugh, emphasize und question zugeordnet.
    - **reply**: Eine Thread-Antwort auf eine vorhandene Nachricht senden (`messageId`, `text` oder `message`, plus `chatGuid`, `chatId`, `chatIdentifier` oder `to`).
    - **sendWithEffect**: Text mit einem iMessage-Effekt senden (`text` oder `message`, `effect` oder `effectId`).
    - **edit**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen bearbeiten (`messageId`, `text` oder `newText`).
    - **unsend**: Eine gesendete Nachricht auf unterstützten macOS-/Private-API-Versionen zurückziehen (`messageId`).
    - **upload-file**: Medien/Dateien senden (`buffer` als base64 oder ein hydratisiertes `media`/`path`/`filePath`, `filename`, optional `asVoice`). Legacy-Alias: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gruppenchats verwalten, wenn das aktuelle Ziel eine Gruppenkonversation ist.

  </Accordion>

  <Accordion title="Message IDs">
    Eingehender iMessage-Kontext enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs, sofern verfügbar. Kurze IDs sind auf den aktuellen In-Memory-Antwort-Cache beschränkt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, wiederholen Sie den Vorgang mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw blendet Private API-Aktionen nur aus, wenn der zwischengespeicherte Prüfstatus angibt, dass die Bridge nicht verfügbar ist. Wenn der Status unbekannt ist, bleiben Aktionen sichtbar und die Dispatch-Probes laufen verzögert, damit die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Wenn die Private-API-Bridge aktiv ist, werden akzeptierte eingehende Chats vor dem Dispatch als gelesen markiert, und dem Absender wird eine Tippblase angezeigt, während der Agent generiert. Deaktivieren Sie das Markieren als gelesen mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der Capability-Liste pro Methode liegen, deaktivieren Tippen/Lesebestätigungen stillschweigend; OpenClaw protokolliert einmalig pro Neustart eine Warnung, damit die fehlende Bestätigung zugeordnet werden kann.

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw abonniert iMessage-Tapbacks und routet akzeptierte Reaktionen als Systemereignisse statt als normalen Nachrichtentext, sodass ein Benutzer-Tapback keine gewöhnliche Antwortschleife auslöst.

    Der Benachrichtigungsmodus wird durch `channels.imessage.reactionNotifications` gesteuert:

    - `"own"` (Standard): nur benachrichtigen, wenn Benutzer auf vom Bot verfasste Nachrichten reagieren.
    - `"all"`: für alle eingehenden Tapbacks von autorisierten Absendern benachrichtigen.
    - `"off"`: eingehende Tapbacks ignorieren.

    Überschreibungen pro Konto verwenden `channels.imessage.accounts.<id>.reactionNotifications`.

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

## Zusammenführen aufgeteilter Direktnachrichten-Sendungen (Befehl + URL in einer Eingabe)

Wenn ein Benutzer einen Befehl und eine URL zusammen eingibt — z. B. `Dump https://example.com/article` — teilt Apples Messages-App den Versand in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhängen.

Die beiden Zeilen kommen bei den meisten Setups im Abstand von ca. 0,8-2,0 s bei OpenClaw an. Ohne Zusammenführung erhält der Agent den Befehl allein in Zug 1, antwortet (oft „send me the URL“) und sieht die URL erst in Zug 2 – zu diesem Zeitpunkt ist der Befehlskontext bereits verloren. Das ist Apples Sendepipeline, nicht etwas, das OpenClaw oder `imsg` einführt.

`channels.imessage.coalesceSameSenderDms` aktiviert für eine DM das Zusammenführen aufeinanderfolgender Zeilen desselben Absenders zu einem einzelnen Agenten-Zug. Gruppenchats werden weiterhin pro Nachricht ausgeliefert, damit die Turn-Struktur mit mehreren Benutzern erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (dump, paste, save, queue usw.).
    - Ihre Benutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Lassen Sie es deaktiviert, wenn:

    - Sie minimale Befehlslatenz für einwortige DM-Trigger benötigen.
    - Alle Ihre Abläufe aus einmaligen Befehlen ohne Payload-Folge bestehen.

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

    Wenn das Flag aktiv ist und kein explizites `messages.inbound.byChannel.imessage` gesetzt ist, erweitert sich das Debounce-Fenster auf **2500 ms** (der Legacy-Standard ist 0 ms – kein Debouncing). Das breitere Fenster ist erforderlich, weil Apples Split-Send-Takt von 0,8-2,0 s nicht in einen engeren Standard passt.

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
    - **Zusätzliche Latenz für DM-Nachrichten.** Wenn das Flag aktiv ist, wartet jede DM (einschließlich eigenständiger Steuerbefehle und einzelner Text-Follow-ups) bis zum Debounce-Fenster, bevor sie ausgeliefert wird, falls noch eine Payload-Zeile folgt. Nachrichten in Gruppenchats werden weiterhin sofort ausgeliefert.
    - **Zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge sind auf 10 begrenzt (darüber hinaus werden der erste und die neuesten beibehalten). Jede Quell-GUID wird in `coalescedMessageGuids` für nachgelagerte Telemetrie erfasst.
    - **Nur DM.** Gruppenchats fallen auf Auslieferung pro Nachricht zurück, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen tippen.
    - **Opt-in, pro Channel.** Andere Channels (Telegram, WhatsApp, Slack, …) sind nicht betroffen. Legacy-BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` setzen, sollten diesen Wert zu `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Benutzer verfasst                                                  | `chat.db` erzeugt     | Flag aus (Standard)                    | Flag an + 2500-ms-Fenster                                               |
| ------------------------------------------------------------------ | --------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (ein Senden)                            | 2 Zeilen ~1 s Abstand | Zwei Agenten-Züge: nur „Dump“, dann URL | Ein Zug: zusammengeführter Text `Dump https://example.com`              |
| `Save this 📎image.jpg caption` (Anhang + Text)                    | 2 Zeilen              | Zwei Züge (Anhang beim Merge verworfen) | Ein Zug: Text + Bild bleiben erhalten                                   |
| `/status` (eigenständiger Befehl)                                  | 1 Zeile               | Sofortige Auslieferung                 | **Bis zum Fenster warten, dann ausliefern**                             |
| URL allein eingefügt                                                | 1 Zeile               | Sofortige Auslieferung                 | Sofortige Auslieferung (nur ein Eintrag im Bucket)                      |
| Text + URL als zwei absichtlich separate Nachrichten, Minuten auseinander | 2 Zeilen außerhalb des Fensters | Zwei Züge                              | Zwei Züge (Fenster läuft dazwischen ab)                                 |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Zeilen              | N Züge                                 | Ein Zug, begrenzte Ausgabe (erste + neueste, Text-/Anhanglimits angewendet) |
| Zwei Personen tippen in einem Gruppenchat                          | N Zeilen von M Absendern | M+ Züge (einer pro Absender-Bucket)    | M+ Züge – Gruppenchats werden nicht zusammengeführt                     |

## Nachholen nach Gateway-Ausfallzeit

Wenn das Gateway offline ist (Absturz, Neustart, Mac im Ruhezustand, Maschine aus), setzt `imsg watch` beim aktuellen `chat.db`-Zustand fort, sobald das Gateway wieder hochfährt – alles, was während der Lücke angekommen ist, wird standardmäßig nie gesehen. Catchup spielt diese Nachrichten beim nächsten Start erneut ab, damit der Agent eingehenden Traffic nicht stillschweigend verpasst.

Catchup ist **standardmäßig deaktiviert**. Aktivieren Sie es pro Channel:

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

Ein Durchlauf pro `monitorIMessageProvider`-Start, sequenziert als `imsg launch` bereit → `watch.subscribe` → `performIMessageCatchup` → Live-Auslieferungsschleife. Catchup selbst verwendet `chats.list` + pro Chat `messages.history` gegen denselben JSON-RPC-Client, den `imsg watch` verwendet. Alles, was während des Catchup-Durchlaufs ankommt, läuft normal durch die Live-Auslieferung; der vorhandene Inbound-Dedupe-Cache absorbiert Überschneidungen mit erneut abgespielten Zeilen.

Jede erneut abgespielte Zeile wird durch den Live-Auslieferungspfad geführt (`evaluateIMessageInbound` + `dispatchInboundMessage`), sodass Allowlists, Gruppenrichtlinie, Debouncer, Echo-Cache und Lesebestätigungen bei erneut abgespielten und Live-Nachrichten identisch funktionieren.

### Cursor- und Retry-Semantik

Catchup hält einen Cursor pro Konto unter `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (das OpenClaw-State-Verzeichnis ist standardmäßig `~/.openclaw`, überschreibbar mit `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Der Cursor rückt bei jeder erfolgreichen Auslieferung vor und wird gehalten, wenn die Auslieferung einer Zeile wirft – der nächste Start versucht dieselbe Zeile ab dem gehaltenen Cursor erneut.
- Nach `maxFailureRetries` aufeinanderfolgenden Throws gegen dieselbe `guid` protokolliert Catchup ein `warn` und rückt den Cursor zwangsweise hinter die verklemmte Nachricht vor, damit folgende Starts Fortschritt machen können.
- Bereits aufgegebene GUIDs werden bei späteren Läufen beim Auftauchen übersprungen (kein Auslieferungsversuch) und in der Laufzusammenfassung unter `skippedGivenUp` gezählt.

### Für Betreiber sichtbare Signale

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Eine Zeile `WARN ... capped to perRunLimit` bedeutet, dass ein einzelner Start den vollständigen Rückstand nicht abgearbeitet hat. Erhöhen Sie `perRunLimit` (max. 500), wenn Ihre Lücken regelmäßig den Standarddurchlauf von 50 Zeilen überschreiten.

### Wann Sie es deaktiviert lassen sollten

- Das Gateway läuft kontinuierlich mit Watchdog-Autoneustart und Lücken sind immer < ein paar Sekunden – der Standard „aus“ ist in Ordnung.
- Das DM-Volumen ist niedrig und verpasste Nachrichten würden das Agentenverhalten nicht ändern – das anfängliche Fenster `firstRunLookbackMinutes` kann beim ersten Aktivieren überraschenden alten Kontext ausliefern.

Wenn Sie Catchup aktivieren, blickt der erste Start ohne Cursor nur `firstRunLookbackMinutes` zurück (Standard 30 min), nicht das vollständige Fenster `maxAgeMinutes` – dadurch wird vermieden, dass eine lange Historie von Nachrichten vor der Aktivierung erneut abgespielt wird.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie das Binary und die RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn der Probe RPC als nicht unterstützt meldet, aktualisieren Sie `imsg`. Wenn Private-API-Aktionen nicht verfügbar sind, führen Sie `imsg launch` in der angemeldeten macOS-Benutzersitzung aus und führen Sie den Probe erneut aus. Wenn das Gateway nicht unter macOS läuft, verwenden Sie statt des lokalen Standardpfads `imsg` das oben beschriebene Setup „Remote Mac über SSH“.

  </Accordion>

  <Accordion title="Gateway läuft nicht unter macOS">
    Der Standard `cliPath: "imsg"` muss auf dem Mac laufen, der bei Nachrichten angemeldet ist. Setzen Sie unter Linux oder Windows `channels.imessage.cliPath` auf ein Wrapper-Skript, das per SSH zu diesem Mac verbindet und `imsg "$@"` ausführt.

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
    - Erwähnungsmuster-Konfiguration (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - Hostschlüssel existiert in `~/.ssh/known_hosts` auf dem Gateway-Host
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Nachrichten läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsaufforderungen wurden verpasst">
    Führen Sie es erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Aufforderungen:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Bestätigen Sie, dass „Full Disk Access“ + „Automation“ für den Prozesskontext gewährt sind, der OpenClaw/`imsg` ausführt.

  </Accordion>
</AccordionGroup>

## Verweise auf die Konfigurationsreferenz

- [Konfigurationsreferenz – iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Pairing](/de/channels/pairing)

## Verwandte Themen

- [Channels-Übersicht](/de/channels) – alle unterstützten Channels
- [BlueBubbles-Entfernung und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) – Ankündigung und Migrationszusammenfassung
- [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles) – Tabelle zur Konfigurationsübersetzung und schrittweise Umstellung
- [Pairing](/de/channels/pairing) – DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) – Gruppenchat-Verhalten und Mention-Gating
- [Channel-Routing](/de/channels/channel-routing) – Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) – Zugriffsmodell und Härtung
