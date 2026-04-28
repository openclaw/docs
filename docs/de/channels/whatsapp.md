---
read_when:
    - An WhatsApp-/Web-Kanalverhalten oder Posteingangsrouting arbeiten
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-26T11:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd4217adb673bc4c071fc1bff6994fb214966c2b28fe59253a1a6f4b4b7fcdba
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern bei der ersten Auswahl von WhatsApp zur Installation des WhatsApp-Plugins auf.
- `openclaw channels login --channel whatsapp` bietet ebenfalls den Installationsablauf an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: standardmäßig wird der lokale Plugin-Pfad verwendet.
- Stable/Beta: standardmäßig wird das npm-Paket `@openclaw/whatsapp` verwendet.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für unbekannte Absender ist Kopplung.
  </Card>
  <Card title="Fehlerbehebung bei Kanälen" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
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

    Um vor dem Login ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Auth-Verzeichnis anzubinden:

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

  <Step title="Erste Kopplungsanfrage genehmigen (bei Verwendung des Kopplungsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Kopplungsanfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Kanal begrenzt.

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
    - geringere Wahrscheinlichkeit von Verwirrung durch Selbst-Chats

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

  <Accordion title="Fallback mit persönlicher Nummer">
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basiskonfiguration:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit orientieren sich Schutzmechanismen für Selbst-Chats an der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Auf WhatsApp Web beschränkter Kanalumfang">
    Der Kanal der Messaging-Plattform basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Reconnect-Schleife.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie eine Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Bestätigungsreaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Felder zur Sitzungskorrelation enthalten. Aus diesem Grund
überträgt WhatsApp eingehende Hook-Payloads vom Typ `message_received` nicht an Plugins,
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

Sie können das Opt-in auf ein Konto beschränken:

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

Aktivieren Sie dies nur für Plugins, denen Sie beim Empfang eingehender WhatsApp-Nachrichteninhalte
und Kennungen vertrauen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf direkte Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Multi-Konto-Überschreibung: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im kanalbezogenen Allow-Store persistent gespeichert und mit dem konfigurierten `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, kommen alle Gruppen infrage
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Allowlist für Absender wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für die Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor Mention-/Antwort-Aktivierung ausgewertet

    Hinweis: Wenn überhaupt kein Block `channels.whatsapp` vorhanden ist, ist der Laufzeit-Fallback für `groupPolicy` `allowlist` (mit einer Warnmeldung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Antworten in Gruppen erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Transkripte eingehender Sprachnotizen für autorisierte Gruppennachrichten
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender stimmt mit Bot-Identität überein)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Mention-Gating; sie gewährt **keine** Absenderautorisierung
    - bei `groupPolicy: "allowlist"` werden nicht erlaubte Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines erlaubten Absenders antworten

    Sitzungsbezogener Aktivierungsbefehl:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist per Owner-Gating geschützt.

  </Tab>
</Tabs>

## Verhalten mit persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden Schutzmechanismen für WhatsApp-Selbst-Chats aktiviert:

- Lesebestätigungen für Selbst-Chat-Turns überspringen
- automatisches Trigger-Verhalten über Mention-JID ignorieren, das Sie andernfalls selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Normalisierung von Nachrichten und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Envelope + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Envelope verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Felder mit Antwort-Metadaten werden ebenfalls gesetzt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).

  </Accordion>

  <Accordion title="Medien-Platzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Sprachnotizen in Gruppen werden vor dem Mention-Gating transkribiert, wenn der
    Nachrichtentext nur `<media:audio>` ist, sodass das Aussprechen der Bot-Erwähnung in der Sprachnotiz
    die Antwort auslösen kann. Wenn das Transkript den Bot trotzdem nicht erwähnt, wird das
    Transkript im ausstehenden Gruppenverlauf statt des rohen Platzhalters gespeichert.

    Standorttexte verwenden knappen Koordinatentext. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als eingefasste nicht vertrauenswürdige Metadaten dargestellt, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Einfügen ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Marker für das Einfügen:

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

    Kontoabhängige Überschreibung:

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

    Selbst-Chat-Turns überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standard-Chunk-Limit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift dann auf längensicheres Chunking zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Payloads für Bild, Video, Audio (PTT-Sprachnotiz) und Dokument
    - Audiomedien werden über die Baileys-Payload `audio` mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-Talk-Sprachnotiz darstellen
    - Antwort-Payloads erhalten `audioAsVoice`; TTS-Ausgaben als Sprachnotiz für WhatsApp bleiben auf diesem PTT-Pfad, auch wenn der Anbieter MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird als `audio/ogg; codecs=opus` gesendet, um Kompatibilität mit Sprachnotizen sicherzustellen
    - nicht-Ogg-Audio, einschließlich MP3-/WebM-Ausgaben von Microsoft Edge TTS, wird mit `ffmpeg` vor der PTT-Zustellung in 48-kHz-Mono-Ogg/Opus transkodiert
    - `/tts latest` sendet die letzte Assistentenantwort als eine einzelne Sprachnotiz und unterdrückt Wiederholungssendungen für dieselbe Antwort; `/tts chat on|off|default` steuert automatisches TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Beschriftungen werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet, außer PTT-Sprachnotizen senden das Audio zuerst und sichtbaren Text separat, da WhatsApp-Clients Beschriftungen für Sprachnotizen nicht konsistent darstellen
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Obergrenze zum Speichern eingehender Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Obergrenze zum Senden ausgehender Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - kontoabhängige Überschreibungen verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenanpassung/Qualitätsdurchlauf), um in die Limits zu passen
    - bei Fehlschlägen beim Mediensenden sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Antwortzitieren, bei dem ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                            |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Niemals zitieren; als einfache Nachricht senden                      |
| `"first"`   | Nur den ersten ausgehenden Antwort-Chunk zitieren                    |
| `"all"`     | Jeden ausgehenden Antwort-Chunk zitieren                             |
| `"batched"` | Eingereihte gebündelte Antworten zitieren, unmittelbare Antworten aber ohne Zitat lassen |

Standard ist `"off"`. Kontoabhängige Überschreibungen verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

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

`channels.whatsapp.reactionLevel` steuert, wie umfassend der Agent Emoji-Reaktionen in WhatsApp verwendet:

| Stufe         | Bestätigungsreaktionen | Agent-initiierte Reaktionen | Beschreibung                                   |
| ------------- | ---------------------- | --------------------------- | ---------------------------------------------- |
| `"off"`       | Nein                   | Nein                        | Überhaupt keine Reaktionen                     |
| `"ack"`       | Ja                     | Nein                        | Nur Bestätigungsreaktionen (Eingangsbestätigung vor Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)          | Bestätigungsreaktionen + Agent-Reaktionen mit zurückhaltender Steuerung |
| `"extensive"` | Ja                     | Ja (empfohlen)              | Bestätigungsreaktionen + Agent-Reaktionen mit empfohlener Steuerung |

Standard: `"minimal"`.

Kontoabhängige Überschreibungen verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp unterstützt sofortige Bestätigungsreaktionen beim Eingang über `channels.whatsapp.ackReaction`.
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

- werden unmittelbar gesendet, nachdem der Eingang akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber die normale Zustellung der Antwort nicht
- der Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Turns; die Gruppenaktivierung `always` umgeht diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (Legacy-`messages.ackReaction` wird hier nicht verwendet)

## Multi-Konto und Zugangsdaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für Lookups normalisiert

  </Accordion>

  <Accordion title="Pfad für Zugangsdaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Backup-Datei: `creds.json.bak`
    - Legacy-Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standard-Konto-Abläufe weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Logout-Verhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivierbar über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet „nicht verknüpft“.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Reconnect-Schleife">
    Symptom: Verknüpftes Konto mit wiederholten Trennungen oder Reconnect-Versuchen.

    Behebung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, mit `channels login` erneut verknüpfen.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen sofort fehl, wenn kein aktiver Gateway-Listener für das Zielkonto vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Allowlist-Einträge in `groups`
    - Mention-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, halten Sie daher pro Scope nur ein `groupPolicy`

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun ist für einen stabilen Gateway-Betrieb von WhatsApp/Telegram als inkompatibel markiert.
  </Accordion>
</AccordionGroup>

## Systemprompts

WhatsApp unterstützt Systemprompts im Telegram-Stil für Gruppen und direkte Chats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Zuerst wird die effektive Map `groups` bestimmt: Wenn das Konto ein eigenes `groups` definiert, ersetzt es die Root-Map `groups` vollständig (kein Deep Merge). Die Prompt-Auflösung läuft dann auf der daraus resultierenden einzelnen Map:

1. **Gruppenspezifischer Systemprompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und es wird kein Systemprompt angewendet.
2. **Platzhalter-Systemprompt für Gruppen** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für direkte Nachrichten:

Zuerst wird die effektive Map `direct` bestimmt: Wenn das Konto ein eigenes `direct` definiert, ersetzt es die Root-Map `direct` vollständig (kein Deep Merge). Die Prompt-Auflösung läuft dann auf der daraus resultierenden einzelnen Map:

1. **Direktnachrichten-spezifischer Systemprompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und es wird kein Systemprompt angewendet.
2. **Platzhalter-Systemprompt für Direktnachrichten** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Hinweis: `dms` bleibt der leichtgewichtige Bucket für Verlaufsüberschreibungen pro DM (`dms.<id>.historyLimit`); Prompt-Überschreibungen liegen unter `direct`.

**Unterschied zum Telegram-Multi-Konto-Verhalten:** In Telegram wird `groups` auf Root-Ebene in einem Multi-Konto-Setup absichtlich für alle Konten unterdrückt — selbst für Konten, die kein eigenes `groups` definieren — um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, zu denen er nicht gehört. WhatsApp wendet diese Schutzmaßnahme nicht an: `groups` und `direct` auf Root-Ebene werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einem WhatsApp-Multi-Konto-Setup gruppen- oder direktchatbezogene Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Chat-Level-Gruppen-Allowlist. Auf Root- oder Kontoebene bedeutet `groups["*"]`, dass „alle Gruppen zugelassen sind“ für diesen Scope.
- Fügen Sie nur dann einen Platzhalter-`systemPrompt` für Gruppen hinzu, wenn Sie ohnehin möchten, dass dieser Scope alle Gruppen zulässt. Wenn weiterhin nur ein fester Satz von Gruppen-IDs infrage kommen soll, verwenden Sie `groups["*"]` nicht als Prompt-Standard. Wiederholen Sie stattdessen den Prompt in jedem explizit allowlisteten Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht automatisch jeden Absender in diesen Gruppen. Der Absenderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für DMs nicht dieselbe Nebenwirkung. `direct["*"]` liefert nur eine Standardkonfiguration für Direktchats, nachdem ein DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln des Kopplungs-Stores zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn auf Root-Ebene alle Gruppen zugelassen sein sollen.
        // Gilt für alle Konten, die keine eigene groups-Map definieren.
        "*": { systemPrompt: "Standardprompt für alle Gruppen." },
      },
      direct: {
        // Gilt für alle Konten, die keine eigene direct-Map definieren.
        "*": { systemPrompt: "Standardprompt für alle direkten Chats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene groups, daher werden groups auf Root-Ebene
            // vollständig ersetzt. Um einen Platzhalter zu behalten, definieren Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus auf Projektmanagement.",
            },
            // Nur verwenden, wenn in diesem Konto alle Gruppen zugelassen sein sollen.
            "*": { systemPrompt: "Standardprompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Map, daher werden direct-Einträge auf Root-Ebene
            // vollständig ersetzt. Um einen Platzhalter zu behalten, definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt für einen bestimmten direkten Arbeitschat." },
            "*": { systemPrompt: "Standardprompt für direkte Arbeitschats." },
          },
        },
      },
    },
  },
}
```

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/config-channels#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Multi-Konto: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalrouting](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
