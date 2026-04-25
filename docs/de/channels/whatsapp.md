---
read_when:
    - Arbeit am Verhalten des WhatsApp-/Web-Kanals oder am Posteingangs-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet verknüpfte Sitzung(en).

## Installieren (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern Sie beim ersten Auswählen des WhatsApp-Plugins zur Installation auf.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: verwendet standardmäßig das npm-Paket `@openclaw/whatsapp`.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für unbekannte Absender ist Pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="WhatsApp-Zugriffsrichtlinie konfigurieren">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp verknüpfen (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Für ein bestimmtes Konto:

```bash
openclaw channels login --channel whatsapp --account work
```

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Authentifizierungsverzeichnis anzubinden:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Das Gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Erste Pairing-Anfrage genehmigen (bei Verwendung des Pairing-Modus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing-Anfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Kanal begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer zu betreiben. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwirrung durch Selbstchats

    Minimales Richtlinienmuster:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Ausweichoption mit persönlicher Nummer">
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basiskonfiguration:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbstchat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Kanalumfang nur für WhatsApp Web">
    Der Messaging-Plattform-Kanal ist in der aktuellen OpenClaw-Kanalarchitektur WhatsApp-Web-basiert (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Registry für Chat-Kanäle.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Ausgehende Nachrichten erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der Transport über WhatsApp Web berücksichtigt standardmäßige Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / entsprechende Varianten in Kleinbuchstaben). Bevorzugen Sie eine Proxy-Konfiguration auf Host-Ebene gegenüber WhatsApp-spezifischen Proxy-Einstellungen auf Kanalebene.

## Plugin hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Felder zur Sitzungszuordnung enthalten. Aus diesem Grund
sendet WhatsApp keine eingehenden `message_received`-Hook-Payloads an Plugins,
es sei denn, Sie aktivieren dies ausdrücklich:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Sie können die Aktivierung auf ein Konto beschränken:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Aktivieren Sie dies nur für Plugins, denen Sie den Empfang eingehender WhatsApp-Nachrichteninhalte
und Kennungen anvertrauen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf Direktchats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Überschreibung für mehrere Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Pairings werden im kanalbezogenen Allow-Store gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw führt niemals automatisches Pairing für ausgehende `fromMe`-DMs durch (Nachrichten, die Sie sich selbst vom verknüpften Gerät senden)

  </Tab>

  <Tab title="Group policy + allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` weggelassen wird, sind alle Gruppen zulässig
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Allowlist für Absender wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Ausweichoption für Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit, falls verfügbar, auf `allowFrom` zurück
    - Allowlists für Absender werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein Block `channels.whatsapp` vorhanden ist, ist die Ausweichrichtlinie für Gruppen zur Laufzeit `allowlist` (mit einer Warnung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Mentions + /activation">
    Antworten in Gruppen erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Ausweichoption `messages.groupChat.mentionPatterns`)
    - implizite Erkennung von Antworten an den Bot (Antwortabsender stimmt mit der Bot-Identität überein)

    Sicherheitshinweis:

    - Zitieren/Antworten erfüllt nur die Erwähnungsbedingung; es gewährt **keine** Autorisierung des Absenders
    - bei `groupPolicy: "allowlist"` werden nicht auf der Allowlist stehende Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines Absenders auf der Allowlist antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungszustand (nicht die globale Konfiguration). Es ist auf den Eigentümer beschränkt.

  </Tab>
</Tabs>

## Verhalten mit persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` enthalten ist, werden Schutzmechanismen für WhatsApp-Selbstchats aktiviert:

- Lesebestätigungen für Selbstchat-Turns überspringen
- automatisches Auslösen über Erwähnungs-JID ignorieren, das Sie andernfalls selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbstchat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag eingebettet.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadatenfelder für Antworten werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).

  </Accordion>

  <Accordion title="Medien-Platzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standorttexte verwenden knappen Koordinatentext. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als abgegrenzte nicht vertrauenswürdige Metadaten dargestellt, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Einfügung ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Ausweichoption: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügungsmarkierungen:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Lesebestätigungen sind für akzeptierte eingehende WhatsApp-Nachrichten standardmäßig aktiviert.

    Global deaktivieren:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Überschreibung pro Konto:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Selbstchat-Turns überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standardlimit für Chunks: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensicheres Chunking zurück
  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Payloads für Bild, Video, Audio (PTT-Sprachnotiz) und Dokument
    - Antwort-Payloads behalten `audioAsVoice` bei; WhatsApp sendet Audio-Medien als Baileys-PTT-Sprachnotizen
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3-/WebM-Ausgabe, wird vor der PTT-Zustellung nach Ogg/Opus transkodiert
    - natives Ogg/Opus-Audio wird mit `audio/ogg; codecs=opus` für Kompatibilität mit Sprachnotizen gesendet
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Beschriftungen werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet
    - Medienquellen können HTTP(S), `file://` oder lokale Pfade sein
  </Accordion>

  <Accordion title="Mediengrößenlimits und Ausweichverhalten">
    - Speicherlimit für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um in die Limits zu passen
    - bei Fehlern beim Senden von Medien sendet die Ausweichoption für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Antwortzitieren, bei dem ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Value       | Verhalten                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Niemals zitieren; als einfache Nachricht senden                       |
| `"first"`   | Nur den ersten ausgehenden Antwort-Chunk zitieren                     |
| `"all"`     | Jeden ausgehenden Antwort-Chunk zitieren                              |
| `"batched"` | Zitieren für in die Warteschlange gestellte gebündelte Antworten, unmittelbare Antworten bleiben unzitiert |

Standard ist `"off"`. Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen in WhatsApp verwendet:

| Stufe         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                     |
| ------------- | ---------------------- | --------------------------------- | ------------------------------------------------ |
| `"off"`       | Nein                   | Nein                              | Überhaupt keine Reaktionen                       |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (Empfang vor Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)                | Bestätigung + Agentenreaktionen mit zurückhaltender Anleitung |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigung + Agentenreaktionen mit empfohlener Anleitung |

Standard: `"minimal"`.

Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Bestätigungsreaktionen

WhatsApp unterstützt unmittelbare Bestätigungsreaktionen beim Empfang eingehender Nachrichten über `channels.whatsapp.ackReaction`.
Bestätigungsreaktionen werden durch `reactionLevel` gesteuert — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Hinweise zum Verhalten:

- werden unmittelbar gesendet, nachdem eine eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Zustellung der Antwort
- Gruppenmodus `mentions` reagiert bei durch Erwähnung ausgelösten Turns; die Gruppenaktivierung `always` wirkt als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (veraltetes `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontenauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standardauswahl des Kontos: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert
  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - veraltete Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Abläufe weiterhin erkannt/migriert
  </Accordion>

  <Accordion title="Verhalten bei Abmeldung">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In veralteten Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Unterstützung für Agenten-Tools umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionssperren:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Kanalstatus meldet nicht verknüpft.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: Verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Behebung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, mit `channels login` erneut verknüpfen.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Einträge in der `groups`-Allowlist
    - Erwähnungsbedingung (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, halten Sie daher pro Geltungsbereich nur ein `groupPolicy`

  </Accordion>

  <Accordion title="Warnung zur Bun-Laufzeit">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun ist für einen stabilen WhatsApp-/Telegram-Gateway-Betrieb als inkompatibel markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive Map `groups` wird zuerst bestimmt: Wenn das Konto ein eigenes `groups` definiert, ersetzt dieses die Root-Map `groups` vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und es wird kein System-Prompt angewendet.
2. **Wildcard-System-Prompt für Gruppen** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive Map `direct` wird zuerst bestimmt: Wenn das Konto ein eigenes `direct` definiert, ersetzt dieses die Root-Map `direct` vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und es wird kein System-Prompt angewendet.
2. **Wildcard-System-Prompt für Direktnachrichten** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

Hinweis: `dms` bleibt der leichte Bucket für Verlaufsüberschreibungen pro DM (`dms.<id>.historyLimit`); Prompt-Überschreibungen liegen unter `direct`.

**Unterschied zum Multi-Konto-Verhalten von Telegram:** In Telegram wird Root-`groups` in einem Multi-Konto-Setup absichtlich für alle Konten unterdrückt — selbst für Konten, die kein eigenes `groups` definieren — um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, zu denen er nicht gehört. WhatsApp wendet diese Schutzmaßnahme nicht an: Root-`groups` und Root-`direct` werden immer an Konten vererbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einem Multi-Konto-WhatsApp-Setup gruppen- oder direktbezogene Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Chat-Ebene-Gruppen-Allowlist. Sowohl im Root- als auch im Kontobereich bedeutet `groups["*"]`: „alle Gruppen sind für diesen Bereich zugelassen“.
- Fügen Sie einen Gruppen-Wildcard-`systemPrompt` nur hinzu, wenn dieser Bereich ohnehin alle Gruppen zulassen soll. Wenn weiterhin nur eine feste Menge von Gruppen-IDs zulässig sein soll, verwenden Sie `groups["*"]` nicht für den Standard-Prompt. Wiederholen Sie stattdessen den Prompt in jedem explizit auf der Allowlist stehenden Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenbehandlung erreichen können, autorisiert aber nicht automatisch jeden Absender in diesen Gruppen. Der Zugriff für Absender wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für DMs nicht denselben Nebeneffekt. `direct["*"]` stellt nur eine Standardkonfiguration für Direktchats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln des Pairing-Stores zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn auf Root-Ebene alle Gruppen zugelassen sein sollen.
        // Gilt für alle Konten, die keine eigene groups-Map definieren.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Gilt für alle Konten, die keine eigene direct-Map definieren.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene groups, daher werden Root-groups
            // vollständig ersetzt. Um einen Wildcard-Eintrag beizubehalten,
            // definieren Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Nur verwenden, wenn in diesem Konto alle Gruppen zugelassen sein sollen.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Map, daher werden Root-direct-Einträge
            // vollständig ersetzt. Um einen Wildcard-Eintrag beizubehalten,
            // definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Configuration reference - WhatsApp](/de/gateway/config-channels#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- mehrere Konten: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandt

- [Pairing](/de/channels/pairing)
- [Groups](/de/channels/groups)
- [Security](/de/gateway/security)
- [Channel routing](/de/channels/channel-routing)
- [Multi-agent routing](/de/concepts/multi-agent)
- [Troubleshooting](/de/channels/troubleshooting)
