---
read_when:
    - iMessage-Unterstützung einrichten
    - Debugging beim Senden/Empfangen mit iMessage
summary: Native iMessage-Unterstützung über imsg (JSON-RPC über stdio), mit privaten API-Aktionen für Antworten, Tapbacks, Effekte, Anhänge und Gruppenverwaltung. Bevorzugt für neue OpenClaw-iMessage-Setups, wenn die Host-Anforderungen passen.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Verwenden Sie für OpenClaw-iMessage-Deployments `imsg` auf einem bei macOS Messages angemeldeten Host. Wenn Ihr Gateway unter Linux oder Windows läuft, verweisen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg` auf dem Mac ausführt.

**Nachholen nach Gateway-Ausfallzeiten ist optional.** Wenn aktiviert (`channels.imessage.catchup.enabled: true`), spielt das Gateway beim nächsten Start eingehende Nachrichten erneut ab, die während der Offlinezeit (Absturz, Neustart, Mac-Ruhezustand) in `chat.db` gelandet sind. Standardmäßig deaktiviert — siehe [Nachholen nach Gateway-Ausfallzeiten](#catching-up-after-gateway-downtime). Schließt [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Die BlueBubbles-Unterstützung wurde entfernt. Migrieren Sie `channels.bluebubbles`-Konfigurationen zu `channels.imessage`; OpenClaw unterstützt iMessage nur über `imsg`. Beginnen Sie mit [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die kurze Ankündigung oder [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) für die vollständige Migrationstabelle.
</Warning>

Status: native externe CLI-Integration. Das Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port). Erweiterte Aktionen erfordern `imsg launch` und eine erfolgreiche Private-API-Prüfung.

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
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, sodass Sie `cliPath` auf ein Wrapper-Skript verweisen können, das per SSH eine Verbindung zu einem entfernten Mac herstellt und `imsg` ausführt.

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

    Wenn `remoteHost` nicht festgelegt ist, versucht OpenClaw, ihn durch Parsen des SSH-Wrapper-Skripts automatisch zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet für SCP strikte Host-Key-Prüfung, daher muss der Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
    Anhangspfade werden gegen zulässige Wurzeln (`attachmentRoots` / `remoteAttachmentRoots`) validiert.

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` läuft.
- Vollzugriff auf die Festplatte ist für den Prozesskontext erforderlich, der OpenClaw/`imsg` ausführt (Zugriff auf die Messages-Datenbank).
- Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.
- Für erweiterte Aktionen (react / edit / unsend / threaded reply / effects / group ops) muss System Integrity Protection deaktiviert sein — siehe unten [Die private API von imsg aktivieren](#enabling-the-imsg-private-api). Einfaches Senden/Empfangen von Text und Medien funktioniert ohne dies.

<Tip>
Berechtigungen werden pro Prozesskontext gewährt. Wenn das Gateway headless läuft (LaunchAgent/SSH), führen Sie in demselben Kontext einmalig einen interaktiven Befehl aus, um die Eingabeaufforderungen auszulösen:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Die private API von imsg aktivieren

`imsg` wird in zwei Betriebsmodi ausgeliefert:

- **Basismodus** (Standard, keine SIP-Änderungen erforderlich): ausgehender Text und Medien über `send`, eingehende Überwachung/Verlauf, Chatliste. Das erhalten Sie direkt nach einem frischen `brew install steipete/tap/imsg` plus den oben genannten standardmäßigen macOS-Berechtigungen.
- **Private-API-Modus**: `imsg` injiziert eine Hilfs-dylib in `Messages.app`, um interne `IMCore`-Funktionen aufzurufen. Dadurch werden `react`, `edit`, `unsend`, `reply` (threaded), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup` sowie Tippindikatoren und Lesebestätigungen freigeschaltet.

Um die auf dieser Kanalseite dokumentierte Oberfläche für erweiterte Aktionen zu erreichen, benötigen Sie den Private-API-Modus. Die `imsg`-README formuliert die Anforderung eindeutig:

> Erweiterte Funktionen wie `read`, `typing`, `launch`, bridge-gestütztes Rich Send, Nachrichtenmutation und Chatverwaltung sind optional. Sie erfordern, dass SIP deaktiviert ist und eine Hilfs-dylib in `Messages.app` injiziert wird. `imsg launch` verweigert die Injektion, wenn SIP aktiviert ist.

Die Hilfsinjektionstechnik verwendet die eigene dylib von `imsg`, um private APIs von Messages zu erreichen. Im OpenClaw-iMessage-Pfad gibt es keinen Drittanbieter-Server oder BlueBubbles-Runtime.

<Warning>
**Das Deaktivieren von SIP ist ein echter Sicherheitskompromiss.** SIP ist eine der zentralen Schutzfunktionen von macOS gegen das Ausführen geänderten Systemcodes; das systemweite Ausschalten eröffnet zusätzliche Angriffsflächen und Nebenwirkungen. Insbesondere **deaktiviert das Abschalten von SIP auf Apple-Silicon-Macs auch die Möglichkeit, iOS-Apps auf Ihrem Mac zu installieren und auszuführen**.

Behandeln Sie dies als bewusste betriebliche Entscheidung, nicht als Standard. Wenn Ihr Bedrohungsmodell nicht toleriert, dass SIP ausgeschaltet ist, ist das gebündelte iMessage auf den Basismodus beschränkt — nur Senden/Empfangen von Text und Medien, keine Reaktionen / Bearbeiten / Zurückrufen / Effekte / Gruppenoperationen.
</Warning>

### Einrichtung

1. **Installieren (oder aktualisieren) Sie `imsg`** auf dem Mac, auf dem Messages.app läuft:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Die Ausgabe von `imsg status --json` meldet `bridge_version`, `rpc_methods` und pro Methode `selectors`, sodass Sie sehen können, was der aktuelle Build unterstützt, bevor Sie beginnen.

2. **Deaktivieren Sie System Integrity Protection.** Dies ist macOS-versionsspezifisch, da die zugrunde liegende Apple-Anforderung vom Betriebssystem und der Hardware abhängt:
   - **macOS 10.13–10.15 (Sierra–Catalina):** Library Validation über Terminal deaktivieren, in den Wiederherstellungsmodus neu starten, `csrutil disable` ausführen, neu starten.
   - **macOS 11+ (Big Sur und neuer), Intel:** Wiederherstellungsmodus (oder Internet Recovery), `csrutil disable`, neu starten.
   - **macOS 11+, Apple Silicon:** Startsequenz über den Einschaltknopf, um Recovery aufzurufen; halten Sie bei aktuellen macOS-Versionen die **linke Umschalttaste** gedrückt, wenn Sie auf Fortfahren klicken, dann `csrutil disable`. Setups mit virtuellen Maschinen folgen einem separaten Ablauf — erstellen Sie zuerst einen VM-Snapshot.
   - **macOS 26 / Tahoe:** Library-Validation-Richtlinien und private-Entitlement-Prüfungen für `imagent` wurden weiter verschärft; `imsg` benötigt möglicherweise einen aktualisierten Build, um Schritt zu halten. Wenn `imsg launch`-Injektion oder bestimmte `selectors` nach einem macOS-Major-Upgrade false zurückgeben, prüfen Sie die Release Notes von `imsg`, bevor Sie davon ausgehen, dass der SIP-Schritt erfolgreich war.

   Folgen Sie dem Recovery-Mode-Ablauf von Apple für Ihren Mac, um SIP zu deaktivieren, bevor Sie `imsg launch` ausführen.

3. **Injizieren Sie den Helper.** Mit deaktiviertem SIP und angemeldetem Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` verweigert die Injektion, wenn SIP noch aktiviert ist; dies dient daher auch als Bestätigung, dass Schritt 2 gegriffen hat.

4. **Prüfen Sie die Bridge aus OpenClaw heraus:**

   ```bash
   openclaw channels status --probe
   ```

   Der iMessage-Eintrag sollte `works` melden, und `imsg status --json | jq '.selectors'` sollte `retractMessagePart: true` plus die Edit-/Typing-/Read-Selectors anzeigen, die Ihr macOS-Build bereitstellt. Das per-Methode-Gating des OpenClaw-Plugins in `actions.ts` bewirbt nur Aktionen, deren zugrunde liegender Selector `true` ist, sodass die Aktionsoberfläche, die Sie in der Toolliste des Agenten sehen, widerspiegelt, was die Bridge auf diesem Host tatsächlich tun kann.

Wenn `openclaw channels status --probe` den Kanal als `works` meldet, aber bestimmte Aktionen zur Dispatch-Zeit „iMessage `<action>` requires the imsg private API bridge“ auslösen, führen Sie `imsg launch` erneut aus — der Helper kann herausfallen (Neustart von Messages.app, OS-Update usw.), und der gecachte Status `available: true` bewirbt weiterhin Aktionen, bis die nächste Prüfung aktualisiert.

### Wenn Sie SIP nicht deaktivieren können

Wenn deaktiviertes SIP für Ihr Bedrohungsmodell nicht akzeptabel ist:

- `imsg` fällt auf den Basismodus zurück — nur Text + Medien + Empfangen.
- Das OpenClaw-Plugin bewirbt weiterhin Text-/Medienversand und eingehende Überwachung; es blendet lediglich `react`, `edit`, `unsend`, `reply`, `sendWithEffect` und Gruppenoperationen aus der Aktionsoberfläche aus (gemäß dem per-Methode-Fähigkeits-Gate).
- Sie können einen separaten Nicht-Apple-Silicon-Mac (oder einen dedizierten Bot-Mac) mit deaktiviertem SIP für die iMessage-Arbeitslast betreiben, während SIP auf Ihren primären Geräten aktiviert bleibt. Siehe unten [Dedizierter Bot-macOS-Benutzer (separate iMessage-Identität)](#deployment-patterns).

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Allowlist-Feld: `channels.imessage.allowFrom`.

    Allowlist-Einträge können Handles, statische Absender-Zugriffsgruppen (`accessGroup:<name>`) oder Chat-Ziele (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) sein.

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Gruppenbehandlung:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Gruppenabsender-Allowlist: `channels.imessage.groupAllowFrom`.

    `groupAllowFrom`-Einträge können auch auf statische Absender-Zugriffsgruppen (`accessGroup:<name>`) verweisen.

    Runtime-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, fallen iMessage-Gruppenabsenderprüfungen auf `allowFrom` zurück, sofern verfügbar.
    Runtime-Hinweis: Wenn `channels.imessage` vollständig fehlt, fällt die Runtime auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    <Warning>
    Gruppenrouting hat **zwei** Allowlist-Gates, die direkt nacheinander laufen, und beide müssen passieren:

    1. **Absender-/Chat-Ziel-Allowlist** (`channels.imessage.groupAllowFrom`) — Handle, `chat_guid`, `chat_identifier` oder `chat_id`.
    2. **Gruppenregistrierung** (`channels.imessage.groups`) — mit `groupPolicy: "allowlist"` erfordert dieses Gate entweder einen `groups: { "*": { ... } }`-Wildcard-Eintrag (setzt `allowAll = true`) oder einen expliziten pro-`chat_id`-Eintrag unter `groups`.

    Wenn Gate 2 nichts enthält, wird jede Gruppennachricht verworfen. Das Plugin gibt auf der Standard-Protokollierungsstufe zwei `warn`-Signale aus:

    - einmalig pro Konto beim Start: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - einmalig pro `chat_id` zur Laufzeit: `imessage: dropping group message from chat_id=<id> ...`

    DMs funktionieren weiterhin, weil sie einen anderen Codepfad verwenden.

    Minimalkonfiguration, damit Gruppen unter `groupPolicy: "allowlist"` weiterlaufen:

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

    Wenn diese `warn`-Zeilen im Gateway-Log erscheinen, verwirft Gate 2 - fügen Sie den `groups`-Block hinzu.
    </Warning>

    Mention-Gating für Gruppen:

    - iMessage hat keine nativen Mention-Metadaten
    - die Mention-Erkennung verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann Mention-Gating nicht erzwungen werden

    Steuerbefehle von autorisierten Absendern können Mention-Gating in Gruppen umgehen.

    `systemPrompt` pro Gruppe:

    Jeder Eintrag unter `channels.imessage.groups.*` akzeptiert optional eine `systemPrompt`-Zeichenfolge. Der Wert wird bei jedem Turn, der eine Nachricht in dieser Gruppe verarbeitet, in den System-Prompt des Agenten eingefügt. Die Auflösung entspricht der Prompt-Auflösung pro Gruppe, die von `channels.whatsapp.groups` verwendet wird:

    1. **Gruppenspezifischer System-Prompt** (`groups["<chat_id>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein `systemPrompt`-Schlüssel definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und für diese Gruppe kein System-Prompt angewendet.
    2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag vollständig in der Map fehlt oder wenn er vorhanden ist, aber keinen `systemPrompt`-Schlüssel definiert.

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

    Prompts pro Gruppe gelten nur für Gruppennachrichten - Direktnachrichten in diesem Kanal sind nicht betroffen.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standard `session.dmScope=main` werden iMessage-DMs in der Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der ursprünglichen Kanal-/Zielmetadaten zurück an iMessage geroutet.

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
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung an Ort und Stelle zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

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

Siehe [ACP-Agenten](/de/tools/acp-agents) für das gemeinsame Verhalten von ACP-Bindungen.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit Bot-Verkehr von Ihrem persönlichen Messages-Profil isoliert ist.

    Typischer Ablauf:

    1. Erstellen Sie einen dedizierten macOS-Benutzer oder melden Sie sich damit an.
    2. Melden Sie sich in diesem Benutzer in Messages mit der Bot-Apple-ID an.
    3. Installieren Sie `imsg` in diesem Benutzer.
    4. Erstellen Sie einen SSH-Wrapper, damit OpenClaw `imsg` im Kontext dieses Benutzers ausführen kann.
    5. Verweisen Sie `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil.

    Der erste Lauf kann GUI-Genehmigungen (Automation + Full Disk Access) in dieser Bot-Benutzersitzung erfordern.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
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
    Stellen Sie zuerst sicher, dass der Host-Key vertrauenswürdig ist (zum Beispiel `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` befüllt ist.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage unterstützt Konfiguration pro Konto unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufseinstellungen und Allowlists für Anhang-Stammverzeichnisse überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellziele

<AccordionGroup>
  <Accordion title="Attachments and media">
    - die Aufnahme eingehender Anhänge ist **standardmäßig deaktiviert** - setzen Sie `channels.imessage.includeAttachments: true`, um Fotos, Sprachmemos, Videos und andere Anhänge an den Agenten weiterzuleiten. Wenn dies deaktiviert ist, werden iMessages, die nur Anhänge enthalten, verworfen, bevor sie den Agenten erreichen, und erzeugen möglicherweise überhaupt keine `Inbound message`-Logzeile.
    - Remote-Anhangspfade können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Anhangspfade müssen zulässigen Stammverzeichnissen entsprechen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (Remote-SCP-Modus)
      - Standard-Stammverzeichnis-Muster: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)

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

## Private-API-Aktionen

Wenn `imsg launch` ausgeführt wird und `openclaw channels status --probe` `privateApi.available: true` meldet, kann das Nachrichtentool zusätzlich zu normalen Textsendungen iMessage-native Aktionen verwenden.

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
    Eingehender iMessage-Kontext enthält sowohl kurze `MessageSid`-Werte als auch vollständige Nachrichten-GUIDs, sofern verfügbar. Kurze IDs sind auf den aktuellen In-Memory-Antwortcache beschränkt und werden vor der Verwendung gegen den aktuellen Chat geprüft. Wenn eine kurze ID abgelaufen ist oder zu einem anderen Chat gehört, versuchen Sie es erneut mit der vollständigen `MessageSidFull`.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw blendet Private-API-Aktionen nur aus, wenn der zwischengespeicherte Probe-Status angibt, dass die Bridge nicht verfügbar ist. Wenn der Status unbekannt ist, bleiben Aktionen sichtbar und Dispatch-Probes werden lazy ausgeführt, sodass die erste Aktion nach `imsg launch` ohne separate manuelle Statusaktualisierung erfolgreich sein kann.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Wenn die Private-API-Bridge aktiv ist, werden akzeptierte eingehende Chats vor dem Dispatch als gelesen markiert und dem Absender wird eine Tippblase angezeigt, während der Agent generiert. Deaktivieren Sie die Lesemarkierung mit:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Ältere `imsg`-Builds, die vor der Fähigkeitsliste pro Methode liegen, deaktivieren Tippen/Lesen stillschweigend; OpenClaw protokolliert pro Neustart eine einmalige Warnung, damit die fehlende Lesebestätigung zugeordnet werden kann.

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

## Zusammenführen geteilt gesendeter DMs (Befehl + URL in einer Komposition)

Wenn ein Benutzer einen Befehl und eine URL zusammen eingibt - z. B. `Dump https://example.com/article` -, teilt Apples Messages-App das Senden in **zwei separate `chat.db`-Zeilen** auf:

1. Eine Textnachricht (`"Dump"`).
2. Eine URL-Vorschau-Sprechblase (`"https://..."`) mit OG-Vorschaubildern als Anhänge.

Die beiden Zeilen treffen bei den meisten Setups im Abstand von etwa 0,8-2,0 s bei OpenClaw ein. Ohne Zusammenführung erhält der Agent den Befehl allein in Turn 1, antwortet (oft „Senden Sie mir die URL“) und sieht die URL erst in Turn 2 - zu diesem Zeitpunkt ist der Befehlskontext bereits verloren. Das ist Apples Sendepipeline, nicht etwas, das OpenClaw oder `imsg` einführt.

`channels.imessage.coalesceSameSenderDms` nimmt eine DM in das Zusammenführen aufeinanderfolgender Zeilen desselben Absenders in einen einzelnen Agent-Turn auf. Gruppenchats werden weiterhin pro Nachricht weitergeleitet, damit die Multi-User-Turn-Struktur erhalten bleibt.

<Tabs>
  <Tab title="Wann aktivieren">
    Aktivieren Sie dies, wenn:

    - Sie Skills ausliefern, die `command + payload` in einer Nachricht erwarten (Dump, Einfügen, Speichern, Warteschlange usw.).
    - Ihre Nutzer URLs, Bilder oder lange Inhalte zusammen mit Befehlen einfügen.
    - Sie die zusätzliche DM-Turn-Latenz akzeptieren können (siehe unten).

    Lassen Sie es deaktiviert, wenn:

    - Sie minimale Befehlslatenz für einwortige DM-Trigger benötigen.
    - Alle Ihre Abläufe einmalige Befehle ohne nachfolgende Nutzlast sind.

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

    Wenn das Flag aktiviert ist und kein explizites `messages.inbound.byChannel.imessage` festgelegt wurde, erweitert sich das Debounce-Fenster auf **2500 ms** (der alte Standardwert ist 0 ms — kein Debouncing). Das breitere Fenster ist erforderlich, weil Apples Kadenz beim aufgeteilten Senden von 0,8-2,0 s nicht in einen engeren Standardwert passt.

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
  <Tab title="Abwägungen">
    - **Zusätzliche Latenz für DM-Nachrichten.** Wenn das Flag aktiviert ist, wartet jede DM (einschließlich eigenständiger Steuerbefehle und einzelner Text-Follow-ups) bis zum Debounce-Fenster, bevor sie weitergeleitet wird, falls eine Nutzlastzeile folgt. Gruppenchat-Nachrichten werden weiterhin sofort weitergeleitet.
    - **Zusammengeführte Ausgabe ist begrenzt.** Zusammengeführter Text ist auf 4000 Zeichen mit einem expliziten Marker `…[truncated]` begrenzt; Anhänge sind auf 20 begrenzt; Quelleinträge auf 10 (darüber hinaus bleiben der erste und der neueste erhalten). Jede Quell-GUID wird in `coalescedMessageGuids` für nachgelagerte Telemetrie erfasst.
    - **Nur DM.** Gruppenchats werden weiterhin pro Nachricht weitergeleitet, damit der Bot reaktionsfähig bleibt, wenn mehrere Personen tippen.
    - **Opt-in, pro Kanal.** Andere Kanäle (Telegram, WhatsApp, Slack, …) sind nicht betroffen. Alte BlueBubbles-Konfigurationen, die `channels.bluebubbles.coalesceSameSenderDms` setzen, sollten diesen Wert nach `channels.imessage.coalesceSameSenderDms` migrieren.

  </Tab>
</Tabs>

### Szenarien und was der Agent sieht

| Nutzer verfasst                                                   | `chat.db` erzeugt     | Flag aus (Standard)                       | Flag an + Fenster von 2500 ms                                             |
| ------------------------------------------------------------------ | --------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `Dump https://example.com` (einmaliges Senden)                     | 2 Zeilen im Abstand von ~1 s | Zwei Agent-Turns: nur „Dump“, dann URL | Ein Turn: zusammengeführter Text `Dump https://example.com`               |
| `Save this 📎image.jpg caption` (Anhang + Text)                   | 2 Zeilen              | Zwei Turns (Anhang beim Zusammenführen verworfen) | Ein Turn: Text + Bild bleiben erhalten                              |
| `/status` (eigenständiger Befehl)                                  | 1 Zeile               | Sofortige Weiterleitung                   | **Bis zum Fenster warten, dann weiterleiten**                             |
| URL allein eingefügt                                               | 1 Zeile               | Sofortige Weiterleitung                   | Sofortige Weiterleitung (nur ein Eintrag im Bucket)                       |
| Text + URL als zwei bewusst getrennte Nachrichten im Abstand von Minuten gesendet | 2 Zeilen außerhalb des Fensters | Zwei Turns | Zwei Turns (Fenster läuft dazwischen ab)                                  |
| Schnelle Flut (>10 kleine DMs innerhalb des Fensters)              | N Zeilen              | N Turns                                   | Ein Turn, begrenzte Ausgabe (erster + neuester, Text-/Anhanggrenzen angewendet) |
| Zwei Personen tippen in einem Gruppenchat                          | N Zeilen von M Absendern | M+ Turns (einer pro Absender-Bucket)    | M+ Turns — Gruppenchats werden nicht zusammengeführt                      |

## Aufholen nach Gateway-Ausfallzeit

Wenn das Gateway offline ist (Absturz, Neustart, Mac-Ruhezustand, Rechner aus), setzt `imsg watch` beim aktuellen Zustand von `chat.db` fort, sobald das Gateway wieder verfügbar ist — alles, was während der Lücke eingetroffen ist, wird standardmäßig nie gesehen. Catchup spielt diese Nachrichten beim nächsten Start erneut ab, damit der Agent eingehenden Traffic nicht stillschweigend verpasst.

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

### Ausführung

Ein Durchlauf pro Start von `monitorIMessageProvider`, sequenziert als `imsg launch` bereit → `watch.subscribe` → `performIMessageCatchup` → Live-Dispatch-Schleife. Catchup selbst verwendet `chats.list` + `messages.history` pro Chat über denselben JSON-RPC-Client, den auch `imsg watch` nutzt. Alles, was während des Catchup-Durchlaufs eintrifft, läuft normal durch den Live-Dispatch; der vorhandene Inbound-Dedupe-Cache nimmt jede Überschneidung mit wiedergegebenen Zeilen auf.

Jede wiedergegebene Zeile wird durch den Live-Dispatch-Pfad geführt (`evaluateIMessageInbound` + `dispatchInboundMessage`), sodass Allowlisten, Gruppenrichtlinie, Debouncer, Echo-Cache und Lesebestätigungen bei wiedergegebenen und Live-Nachrichten identisch funktionieren.

### Cursor- und Wiederholungssemantik

Catchup verwaltet einen Cursor pro Konto unter `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (das OpenClaw-State-Verzeichnis ist standardmäßig `~/.openclaw`, überschreibbar mit `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Der Cursor rückt bei jeder erfolgreichen Weiterleitung vor und bleibt stehen, wenn die Weiterleitung einer Zeile wirft — der nächste Start versucht dieselbe Zeile ab dem gehaltenen Cursor erneut.
- Nach `maxFailureRetries` aufeinanderfolgenden Würfen für dieselbe `guid` protokolliert Catchup eine `warn` und rückt den Cursor zwangsweise über die festhängende Nachricht hinaus vor, damit nachfolgende Starts Fortschritt machen können.
- Bereits aufgegebene GUIDs werden bei späteren Läufen beim Auftauchen übersprungen (kein Weiterleitungsversuch) und in der Laufzusammenfassung unter `skippedGivenUp` gezählt.

### Für Operator sichtbare Signale

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Eine Zeile `WARN ... capped to perRunLimit` bedeutet, dass ein einzelner Start den vollständigen Rückstand nicht abgearbeitet hat. Erhöhen Sie `perRunLimit` (max. 500), wenn Ihre Lücken regelmäßig den standardmäßigen 50-Zeilen-Durchlauf überschreiten.

### Wann es deaktiviert bleiben sollte

- Das Gateway läuft kontinuierlich mit Watchdog-Autoneustart und Lücken sind immer < ein paar Sekunden — der Standardwert „aus“ ist in Ordnung.
- Das DM-Volumen ist gering und verpasste Nachrichten würden das Agent-Verhalten nicht ändern — das anfängliche Fenster `firstRunLookbackMinutes` kann beim ersten Aktivieren überraschend alten Kontext weiterleiten.

Wenn Sie Catchup aktivieren, blickt der erste Start ohne Cursor nur `firstRunLookbackMinutes` zurück (Standard: 30 min), nicht das vollständige Fenster `maxAgeMinutes` — so wird vermieden, dass eine lange Historie von Nachrichten vor der Aktivierung erneut abgespielt wird.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Validieren Sie die Binärdatei und RPC-Unterstützung:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`. Wenn private API-Aktionen nicht verfügbar sind, führen Sie `imsg launch` in der angemeldeten macOS-Benutzersitzung aus und führen Sie die Probe erneut aus. Wenn das Gateway nicht unter macOS läuft, verwenden Sie statt des standardmäßigen lokalen `imsg`-Pfads die oben beschriebene Remote-Mac-über-SSH-Einrichtung.

  </Accordion>

  <Accordion title="Gateway läuft nicht unter macOS">
    Der Standard `cliPath: "imsg"` muss auf dem Mac laufen, der bei Nachrichten angemeldet ist. Unter Linux oder Windows setzen Sie `channels.imessage.cliPath` auf ein Wrapper-Skript, das per SSH zu diesem Mac verbindet und `imsg "$@"` ausführt.

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

  <Accordion title="macOS-Berechtigungsaufforderungen wurden verpasst">
    Führen Sie die Befehle erneut in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext aus und genehmigen Sie die Aufforderungen:

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
- [Pairing](/de/channels/pairing)

## Verwandte Themen

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Entfernung von BlueBubbles und der iMessage-Pfad mit imsg](/de/announcements/bluebubbles-imessage) — Ankündigung und Migrationszusammenfassung
- [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles) — Konfigurationsübersetzungstabelle und schrittweise Umstellung
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Gruppenchat-Verhalten und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
