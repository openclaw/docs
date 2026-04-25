---
read_when:
    - Einrichten der iMessage-Unterstützung
    - Fehlerbehebung beim Senden/Empfangen mit iMessage
summary: Legacy-iMessage-Unterstützung über imsg (JSON-RPC über stdio). Neue Setups sollten BlueBubbles verwenden.
title: iMessage
x-i18n:
    generated_at: "2026-04-25T13:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
Für neue iMessage-Bereitstellungen verwenden Sie <a href="/de/channels/bluebubbles">BlueBubbles</a>.

Die `imsg`-Integration ist veraltet und wird möglicherweise in einer zukünftigen Version entfernt.
</Warning>

Status: veraltete externe CLI-Integration. Gateway startet `imsg rpc` und kommuniziert über JSON-RPC auf stdio (kein separater Daemon/Port).

<CardGroup cols={3}>
  <Card title="BlueBubbles (empfohlen)" icon="message-circle" href="/de/channels/bluebubbles">
    Bevorzugter iMessage-Pfad für neue Setups.
  </Card>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    iMessage-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Konfigurationsreferenz" icon="settings" href="/de/gateway/config-channels#imessage">
    Vollständige Feldreferenz für iMessage.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Lokaler Mac (schneller Pfad)">
    <Steps>
      <Step title="imsg installieren und verifizieren">

```bash
brew install steipete/tap/imsg
imsg rpc --help
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

      <Step title="Erste DM-Kopplung genehmigen (Standard-`dmPolicy`)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Kopplungsanfragen laufen nach 1 Stunde ab.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote-Mac über SSH">
    OpenClaw benötigt nur einen stdio-kompatiblen `cliPath`, daher können Sie `cliPath` auf ein Wrapper-Skript setzen, das sich per SSH mit einem Remote-Mac verbindet und `imsg` ausführt.

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
      remoteHost: "user@gateway-host", // wird für SCP-Abrufe von Anhängen verwendet
      includeAttachments: true,
      // Optional: erlaubte Stammverzeichnisse für Anhänge überschreiben.
      // Standardmäßig enthalten: /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Wenn `remoteHost` nicht gesetzt ist, versucht OpenClaw, ihn automatisch durch Parsen des SSH-Wrapper-Skripts zu erkennen.
    `remoteHost` muss `host` oder `user@host` sein (keine Leerzeichen oder SSH-Optionen).
    OpenClaw verwendet für SCP eine strikte Host-Key-Prüfung, daher muss der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden sein.
    Pfade für Anhänge werden gegen erlaubte Stammverzeichnisse validiert (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Anforderungen und Berechtigungen (macOS)

- Messages muss auf dem Mac angemeldet sein, auf dem `imsg` ausgeführt wird.
- Vollzugriff auf das Dateisystem ist für den Prozesskontext erforderlich, in dem OpenClaw/`imsg` ausgeführt wird (Zugriff auf die Messages-Datenbank).
- Die Automatisierungsberechtigung ist erforderlich, um Nachrichten über Messages.app zu senden.

<Tip>
Berechtigungen werden pro Prozesskontext erteilt. Wenn Gateway headless läuft (LaunchAgent/SSH), führen Sie im selben Kontext einmalig einen interaktiven Befehl aus, um die Eingabeaufforderungen auszulösen:

```bash
imsg chats --limit 1
# oder
imsg send <handle> "test"
```

</Tip>

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.imessage.dmPolicy` steuert Direktnachrichten:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    Feld für die Allowlist: `channels.imessage.allowFrom`.

    Allowlist-Einträge können Handles oder Chat-Ziele sein (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Gruppenrichtlinie + Erwähnungen">
    `channels.imessage.groupPolicy` steuert die Behandlung von Gruppen:

    - `allowlist` (Standard, wenn konfiguriert)
    - `open`
    - `disabled`

    Allowlist für Gruppensender: `channels.imessage.groupAllowFrom`.

    Laufzeit-Fallback: Wenn `groupAllowFrom` nicht gesetzt ist, greifen Prüfungen von iMessage-Gruppensendern zur Laufzeit auf `allowFrom` zurück, falls verfügbar.
    Hinweis zur Laufzeit: Wenn `channels.imessage` vollständig fehlt, verwendet die Laufzeit als Fallback `groupPolicy="allowlist"` und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Steuerung von Erwähnungen für Gruppen:

    - iMessage hat keine nativen Metadaten für Erwähnungen
    - die Erkennung von Erwähnungen verwendet Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - ohne konfigurierte Muster kann die Steuerung von Erwähnungen nicht durchgesetzt werden

    Steuerbefehle von autorisierten Absendern können die Erwähnungssteuerung in Gruppen umgehen.

  </Tab>

  <Tab title="Sitzungen und deterministische Antworten">
    - DMs verwenden direktes Routing; Gruppen verwenden Gruppen-Routing.
    - Mit dem Standard `session.dmScope=main` werden iMessage-DMs in der Hauptsitzung des Agenten zusammengeführt.
    - Gruppensitzungen sind isoliert (`agent:<agentId>:imessage:group:<chat_id>`).
    - Antworten werden anhand der Metadaten des Ursprungskanals/-ziels zurück zu iMessage geroutet.

    Verhalten gruppenähnlicher Threads:

    Einige iMessage-Threads mit mehreren Teilnehmern können mit `is_group=false` ankommen.
    Wenn diese `chat_id` explizit unter `channels.imessage.groups` konfiguriert ist, behandelt OpenClaw sie als Gruppenverkehr (Gruppensteuerung + Isolierung der Gruppensitzung).

  </Tab>
</Tabs>

## ACP-Gesprächsbindungen

Veraltete iMessage-Chats können auch an ACP-Sitzungen gebunden werden.

Schneller Operator-Ablauf:

- Führen Sie `/acp spawn codex --bind here` innerhalb der DM oder des erlaubten Gruppenchats aus.
- Zukünftige Nachrichten in derselben iMessage-Konversation werden an die erzeugte ACP-Sitzung geroutet.
- `/new` und `/reset` setzen dieselbe gebundene ACP-Sitzung direkt zurück.
- `/acp close` schließt die ACP-Sitzung und entfernt die Bindung.

Konfigurierte persistente Bindungen werden über Top-Level-Einträge `bindings[]` mit `type: "acp"` und `match.channel: "imessage"` unterstützt.

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

Siehe [ACP Agents](/de/tools/acp-agents) für gemeinsames Verhalten von ACP-Bindungen.

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierter macOS-Benutzer für Bots (separate iMessage-Identität)">
    Verwenden Sie eine dedizierte Apple-ID und einen dedizierten macOS-Benutzer, damit der Bot-Verkehr von Ihrem persönlichen Messages-Profil getrennt ist.

    Typischer Ablauf:

    1. Einen dedizierten macOS-Benutzer erstellen/anmelden.
    2. In diesem Benutzer Messages mit der Apple-ID des Bots anmelden.
    3. `imsg` in diesem Benutzer installieren.
    4. SSH-Wrapper erstellen, damit OpenClaw `imsg` in diesem Benutzerkontext ausführen kann.
    5. `channels.imessage.accounts.<id>.cliPath` und `.dbPath` auf dieses Benutzerprofil zeigen lassen.

    Der erste Start kann GUI-Genehmigungen erfordern (Automatisierung + Vollzugriff auf das Dateisystem) in der Sitzung dieses Bot-Benutzers.

  </Accordion>

  <Accordion title="Remote-Mac über Tailscale (Beispiel)">
    Häufige Topologie:

    - Gateway läuft auf Linux/VM
    - iMessage + `imsg` läuft auf einem Mac in Ihrem Tailnet
    - der `cliPath`-Wrapper verwendet SSH, um `imsg` auszuführen
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
    Stellen Sie sicher, dass der Host-Key zuerst als vertrauenswürdig eingestuft wurde (zum Beispiel mit `ssh bot@mac-mini.tailnet-1234.ts.net`), damit `known_hosts` gefüllt ist.

  </Accordion>

  <Accordion title="Multi-Account-Muster">
    iMessage unterstützt kontospezifische Konfiguration unter `channels.imessage.accounts`.

    Jedes Konto kann Felder wie `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, Verlaufs-Einstellungen und Allowlists für Stammverzeichnisse von Anhängen überschreiben.

  </Accordion>
</AccordionGroup>

## Medien, Chunking und Zustellungsziele

<AccordionGroup>
  <Accordion title="Anhänge und Medien">
    - die Erfassung eingehender Anhänge ist optional: `channels.imessage.includeAttachments`
    - Remote-Pfade für Anhänge können per SCP abgerufen werden, wenn `remoteHost` gesetzt ist
    - Pfade für Anhänge müssen mit erlaubten Stammverzeichnissen übereinstimmen:
      - `channels.imessage.attachmentRoots` (lokal)
      - `channels.imessage.remoteAttachmentRoots` (Remote-SCP-Modus)
      - Standardmuster für Stammverzeichnisse: `/Users/*/Library/Messages/Attachments`
    - SCP verwendet eine strikte Host-Key-Prüfung (`StrictHostKeyChecking=yes`)
    - die Größe ausgehender Medien verwendet `channels.imessage.mediaMaxMb` (Standard 16 MB)
  </Accordion>

  <Accordion title="Ausgehendes Chunking">
    - Text-Chunk-Grenze: `channels.imessage.textChunkLimit` (Standard 4000)
    - Chunk-Modus: `channels.imessage.chunkMode`
      - `length` (Standard)
      - `newline` (absatzorientiertes Aufteilen zuerst)
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

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="imsg nicht gefunden oder RPC nicht unterstützt">
    Verifizieren Sie die Binärdatei und die RPC-Unterstützung:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Wenn die Probe meldet, dass RPC nicht unterstützt wird, aktualisieren Sie `imsg`.

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
    - Konfiguration der Erwähnungsmuster (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote-Anhänge schlagen fehl">
    Prüfen Sie:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - SSH/SCP-Schlüsselauthentifizierung vom Gateway-Host
    - der Host-Key ist in `~/.ssh/known_hosts` auf dem Gateway-Host vorhanden
    - Lesbarkeit des Remote-Pfads auf dem Mac, auf dem Messages läuft

  </Accordion>

  <Accordion title="macOS-Berechtigungsaufforderungen wurden verpasst">
    Führen Sie die Befehle in einem interaktiven GUI-Terminal im selben Benutzer-/Sitzungskontext erneut aus und genehmigen Sie die Eingabeaufforderungen:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Bestätigen Sie, dass Vollzugriff auf das Dateisystem und Automatisierung für den Prozesskontext gewährt wurden, in dem OpenClaw/`imsg` ausgeführt wird.

  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

- [Konfigurationsreferenz - iMessage](/de/gateway/config-channels#imessage)
- [Gateway-Konfiguration](/de/gateway/configuration)
- [Kopplung](/de/channels/pairing)
- [BlueBubbles](/de/channels/bluebubbles)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Steuerung von Erwähnungen
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungs-Routing für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
