---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Inbox-Routing
summary: Unterstützung des WhatsApp-Kanals, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: produktionsbereit über WhatsApp Web (Baileys). Das Gateway besitzt die verknüpfte(n) Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern beim ersten Auswählen dazu auf, das WhatsApp-Plugin zu installieren.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
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
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanal-Konfigurationsmuster und Beispiele.
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

    Um vor dem Login ein bestehendes/benutzerdefiniertes WhatsApp Web-Authentifizierungsverzeichnis anzubinden:

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
    - klarere DM-Zulassungslisten und Routing-Grenzen
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

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Auf WhatsApp Web beschränkter Kanalumfang">
    Der Kanal der Messaging-Plattform basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway besitzt den WhatsApp-Socket und die Wiederverbindungsschleife.
- Ausgehende Sends erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direkt-Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp Web-Transport berücksichtigt die Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie eine Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.

## Plugin-Hooks und Datenschutz

WhatsApp-Eingangsnachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Felder zur Sitzungszuordnung enthalten. Aus diesem Grund
sendet WhatsApp eingehende `message_received`-Hook-Payloads nicht an Plugins weiter,
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

Aktivieren Sie dies nur für Plugins, denen Sie vertrauen, eingehende WhatsApp-Nachrichteninhalte
und Kennungen zu empfangen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Direkt-Chat-Zugriff:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (werden intern normalisiert).

    Überschreibung für mehrere Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im kanalbezogenen Allow-Store gespeichert und mit dem konfigurierten `allowFrom` zusammengeführt
    - wenn keine Zulassungsliste konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig zugelassen
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Gruppenrichtlinie + Zulassungslisten">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Zulassungsliste für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` weggelassen wird, sind alle Gruppen zulässig
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Zulassungsliste (`"*"` ist erlaubt)

    2. **Gruppen-Absenderrichtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Zulassungsliste für Absender wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` übereinstimmen (oder `*`)
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Zulassungslisten:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Zulassungslisten werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block existiert, ist der Fallback der Laufzeit für die Gruppenrichtlinie `allowlist` (mit einer Warnprotokollmeldung), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender stimmt mit der Bot-Identität überein)

    Sicherheitshinweis:

    - Zitieren/Antworten erfüllt nur die Erwähnungs-Gating-Bedingung; es gewährt **keine** Absenderautorisierung
    - bei `groupPolicy: "allowlist"` werden nicht zugelassene Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines zugelassenen Absenders antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist auf Eigentümer beschränkt.

  </Tab>
</Tabs>

## Verhalten bei persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden Schutzmechanismen für WhatsApp-Selbst-Chats aktiviert:

- Lesebestätigungen für Selbst-Chat-Züge überspringen
- Verhalten zum automatischen Auslösen per Erwähnungs-JID ignorieren, das Sie andernfalls selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingangshülle + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in die gemeinsame Eingangshülle verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird der Kontext in folgender Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwort-Metadatenfelder werden ebenfalls befüllt, sofern verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nur-Medien-Nachrichten werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standorttexte verwenden knappe Koordinatentexte. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als abgegrenzte nicht vertrauenswürdige Metadaten dargestellt, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Einfügung ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügungsmarkierungen:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Lesebestätigungen sind standardmäßig für akzeptierte eingehende WhatsApp-Nachrichten aktiviert.

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

    Selbst-Chat-Züge überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - Standardlimit für Blöcke: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift dann auf längensichere Blockaufteilung zurück
  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Payloads für Bild, Video, Audio (PTT-Sprachnotiz) und Dokument
    - Antwort-Payloads behalten `audioAsVoice` bei; WhatsApp sendet Audiomedien als Baileys-PTT-Sprachnotizen
    - Audio, das nicht Ogg ist, einschließlich Microsoft Edge TTS-MP3/WebM-Ausgabe, wird vor der PTT-Zustellung nach Ogg/Opus transkodiert
    - natives Ogg/Opus-Audio wird mit `audio/ogg; codecs=opus` für Sprachnotiz-Kompatibilität gesendet
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sends unterstützt
    - Bildunterschriften werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet, außer bei PTT-Sprachnotizen; dort wird das Audio zuerst und der sichtbare Text separat gesendet, weil WhatsApp-Clients Bildunterschriften für Sprachnotizen nicht konsistent darstellen
    - Medienquellen können HTTP(S), `file://` oder lokale Pfade sein
  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speichergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendegrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größen-/Qualitätsdurchläufe), um die Limits einzuhalten
    - bei Fehlern beim Mediensenden sendet der Fallback für das erste Element stattdessen eine Textwarnung, anstatt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Antwortzitieren, bei dem ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                            |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Niemals zitieren; als einfache Nachricht senden                      |
| `"first"`   | Nur den ersten ausgehenden Antwortblock zitieren                     |
| `"all"`     | Jeden ausgehenden Antwortblock zitieren                              |
| `"batched"` | Warteschlangenbasierte gebündelte Antworten zitieren und sofortige Antworten unzitiert lassen |

Der Standard ist `"off"`. Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Stufe         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                    |
| ------------- | ---------------------- | --------------------------------- | ----------------------------------------------- |
| `"off"`       | Nein                   | Nein                              | Überhaupt keine Reaktionen                      |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (Empfang vor Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)                | Bestätigung + Agent-Reaktionen mit zurückhaltender Steuerung |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigung + Agent-Reaktionen mit empfohlener Steuerung |

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

- werden sofort gesendet, nachdem der Eingang akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren jedoch nicht die normale Antwortzustellung
- der Gruppenmodus `mentions` reagiert bei durch Erwähnung ausgelösten Zügen; die Gruppenaktivierung `always` umgeht diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert
  </Accordion>

  <Accordion title="Pfad zu Anmeldedaten und Altsystem-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - veraltete Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standard-Kontoflüsse weiterhin erkannt/migriert
  </Accordion>

  <Accordion title="Logout-Verhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In veralteten Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Unterstützung für Agent-Tools umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivierbar über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet nicht verknüpft.

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
    Ausgehende Sends schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    In dieser Reihenfolge prüfen:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Einträge in der `groups`-Zulassungsliste
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, daher pro Geltungsbereich nur ein einziges `groupPolicy` beibehalten

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun ist für einen stabilen WhatsApp-/Telegram-Gateway-Betrieb als inkompatibel markiert.
  </Accordion>
</AccordionGroup>

## Systemprompts

WhatsApp unterstützt Systemprompts im Telegram-Stil für Gruppen und Direkt-Chats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eine eigene `groups`-Map definiert, ersetzt sie die `groups`-Map auf Root-Ebene vollständig (kein Deep Merge). Die Prompt-Suche wird dann auf der resultierenden einzelnen Map ausgeführt:

1. **Gruppenspezifischer Systemprompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein Systemprompt angewendet.
2. **Wildcard-Systemprompt für Gruppen** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eine eigene `direct`-Map definiert, ersetzt sie die `direct`-Map auf Root-Ebene vollständig (kein Deep Merge). Die Prompt-Suche wird dann auf der resultierenden einzelnen Map ausgeführt:

1. **Direktspezifischer Systemprompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Gegenstelleneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein Systemprompt angewendet.
2. **Wildcard-Systemprompt für Direktnachrichten** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Gegenstelleneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Hinweis: `dms` bleibt der leichtgewichtige Bucket für Verlaufsüberschreibungen pro DM (`dms.<id>.historyLimit`); Prompt-Überschreibungen liegen unter `direct`.

**Unterschied zum Telegram-Mehrkontenverhalten:** In Telegram wird `groups` auf Root-Ebene in einem Mehrkonten-Setup absichtlich für alle Konten unterdrückt — selbst für Konten, die selbst keine `groups` definieren — um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen erhält, zu denen er nicht gehört. WhatsApp wendet diese Schutzmaßnahme nicht an: `groups` und `direct` auf Root-Ebene werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einem WhatsApp-Mehrkonten-Setup kontoabhängige Gruppen- oder Direkt-Prompts möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die chatbezogene Gruppen-Zulassungsliste. Auf Root- oder Kontoebene bedeutet `groups["*"]`, dass „alle Gruppen für diesen Geltungsbereich zugelassen sind“.
- Fügen Sie nur dann einen Wildcard-Gruppen-`systemPrompt` hinzu, wenn Sie ohnehin möchten, dass in diesem Geltungsbereich alle Gruppen zugelassen sind. Wenn weiterhin nur ein fester Satz von Gruppen-IDs zulässig sein soll, verwenden Sie `groups["*"]` nicht als Prompt-Standard. Wiederholen Sie stattdessen den Prompt in jedem explizit auf die Zulassungsliste gesetzten Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge an Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber für sich genommen nicht jeden Absender in diesen Gruppen. Der Absenderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für DMs nicht dieselbe Nebenwirkung. `direct["*"]` stellt nur eine Standard-Direkt-Chat-Konfiguration bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln des Kopplungsspeichers zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn im Root-Geltungsbereich alle Gruppen zugelassen sein sollen.
        // Gilt für alle Konten, die keine eigene groups-Map definieren.
        "*": { systemPrompt: "Standardprompt für alle Gruppen." },
      },
      direct: {
        // Gilt für alle Konten, die keine eigene direct-Map definieren.
        "*": { systemPrompt: "Standardprompt für alle Direkt-Chats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene groups, daher werden groups auf Root-Ebene vollständig
            // ersetzt. Um einen Wildcard-Eintrag beizubehalten, definieren Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus auf Projektmanagement.",
            },
            // Nur verwenden, wenn in diesem Konto alle Gruppen zugelassen sein sollen.
            "*": { systemPrompt: "Standardprompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Map, daher werden Einträge in direct auf Root-Ebene
            // vollständig ersetzt. Um einen Wildcard-Eintrag beizubehalten, definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt für einen bestimmten Arbeits-Direkt-Chat." },
            "*": { systemPrompt: "Standardprompt für Arbeits-Direkt-Chats." },
          },
        },
      },
    },
  },
}
```

## Verweise zur Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/config-channels#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- mehrere Konten: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
