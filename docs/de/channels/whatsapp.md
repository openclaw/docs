---
read_when:
    - Arbeiten am WhatsApp-/Web-Kanalverhalten oder am Routing des Posteingangs
summary: Unterstützung für den WhatsApp-Kanal, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T06:36:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Das Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern Sie auf, das WhatsApp-Plugin zu installieren, wenn Sie es zum ersten Mal auswählen.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: verwendet das npm-Paket `@openclaw/whatsapp` mit dem aktuellen offiziellen
  Release-Tag.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur, wenn Sie eine reproduzierbare Installation benötigen.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie ist Kopplung für unbekannte Absender.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanal-Konfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

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

    Um vor der Anmeldung ein vorhandenes/eigenes WhatsApp Web-Authentifizierungsverzeichnis anzuhängen:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Gateway starten">

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
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer zu betreiben. (Die Kanalmetadaten und der Einrichtungsablauf sind für diese Einrichtung optimiert, Einrichtungen mit persönlicher Nummer werden jedoch ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwechslungen durch Selbst-Chats

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

  <Accordion title="Fallback für persönliche Nummer">
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine Selbst-Chat-freundliche Basis:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren die Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Kanalumfang nur für WhatsApp Web">
    Der Messaging-Plattformkanal basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Der Wiederverbindungs-Watchdog verwendet WhatsApp Web-Transportaktivität, nicht nur das Volumen eingehender App-Nachrichten, sodass eine ruhige verknüpfte Gerätesitzung nicht allein deshalb neu gestartet wird, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Begrenzung für Anwendung-Stille erzwingt dennoch eine Wiederverbindung, wenn weiterhin Transport-Frames eintreffen, aber während des Watchdog-Fensters keine Anwendungsnachrichten verarbeitet werden; nach einer vorübergehenden Wiederverbindung für eine kürzlich aktive Sitzung verwendet diese Anwendung-Stille-Prüfung im ersten Wiederherstellungsfenster das normale Nachrichten-Timeout.
- Baileys-Socket-Zeitwerte sind explizit unter `web.whatsapp.*` festgelegt: `keepAliveIntervalMs` steuert WhatsApp Web-Anwendungspings, `connectTimeoutMs` steuert das Timeout des öffnenden Handshakes, und `defaultQueryTimeoutMs` steuert Baileys-Abfrage-Timeouts.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Gruppensendungen hängen native Erwähnungsmetadaten für `@+<digits>`- und `@<digits>`-Token in Text und Medienbeschriftungen an, wenn das Token mit aktuellen WhatsApp-Teilnehmermetadaten übereinstimmt, einschließlich LID-gestützter Gruppen.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Wiederverbindungs-Watchdog folgt der WhatsApp Web-Transportaktivität, nicht nur dem Volumen eingehender App-Nachrichten: Ruhige verknüpfte Gerätesitzungen bleiben aktiv, solange Transport-Frames weiterlaufen, aber ein Transport-Stillstand erzwingt eine Wiederverbindung deutlich vor dem späteren Remote-Trennpfad.
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletter können explizite ausgehende Ziele mit ihrer nativen `@newsletter`-JID sein. Ausgehende Newsletter-Sendungen verwenden Kanal-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) statt DM-Sitzungssemantik.
- Der WhatsApp Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinschreibung). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber kanalbezogenen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Bestätigungsreaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Sitzungs-Korrelationsfelder enthalten. Aus diesem Grund
sendet WhatsApp eingehende `message_received`-Hook-Payloads nicht an Plugins,
es sei denn, Sie stimmen ausdrücklich zu:

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

Sie können die Zustimmung auf ein Konto beschränken:

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
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf direkte Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    `allowFrom` ist eine Zugriffskontrollliste für DM-Absender. Sie steuert keine expliziten ausgehenden Sendungen an WhatsApp-Gruppen-JIDs oder `@newsletter`-Kanal-JIDs.

    Mehrkonto-Override: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben Vorrang vor kanalweiten Standards für dieses Konto.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im Kanal-Allow-Store persistiert und mit konfiguriertem `allowFrom` zusammengeführt
    - Geplante Automatisierung und Heartbeat-Empfänger-Fallback verwenden explizite Zustellziele oder konfiguriertes `allowFrom`; DM-Kopplungsgenehmigungen sind keine impliziten Cron- oder Heartbeat-Empfänger
    - Wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Gruppenzugriff hat zwei Ebenen:

    1. **Gruppenmitgliedschaft-Allowlist** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen berechtigt
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Gruppen-Absenderrichtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss `groupAllowFrom` (oder `*`) entsprechen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor Erwähnungs-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Laufzeit-Fallback für Gruppenrichtlinien `allowlist` (mit Warnprotokoll), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Sprachnotiz-Transkripte für autorisierte Gruppennachrichten
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender entspricht Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Erwähnungs-Gating; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden Absender, die nicht auf der Allowlist stehen, weiterhin blockiert, selbst wenn sie auf die Nachricht eines Benutzers auf der Allowlist antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Sie ist eigentümerbeschränkt.

  </Tab>
</Tabs>

## Verhalten bei persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbst-Chat-Schutzmaßnahmen aktiviert:

- Lesebestätigungen für Selbst-Chat-Turns überspringen
- Auto-Trigger-Verhalten für Erwähnungs-JID ignorieren, das Sie sonst selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

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

    Antwortmetadatenfelder werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).
    Wenn das zitierte Antwortziel herunterladbare Medien sind, speichert OpenClaw sie über
    den normalen eingehenden Medienspeicher und stellt sie als `MediaPath`/`MediaType` bereit, sodass
    der Agent das referenzierte Bild prüfen kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakt">
    Eingehende reine Mediennachrichten werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppensprachnotizen werden vor dem Erwähnungs-Gating transkribiert, wenn der
    Body nur `<media:audio>` ist, sodass das Sagen der Bot-Erwähnung in der Sprachnotiz
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript statt des rohen Platzhalters im ausstehenden Gruppenverlauf beibehalten.

    Standort-Bodies verwenden knappen Koordinatentext. Standortlabels/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Injektion ausstehenden Gruppenverlaufs">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext injiziert werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Injektionsmarker:

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

    Self-Chat-Turns überspringen Lesebestätigungen, selbst wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standard-Chunk-Limit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensicheres Chunking zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnotiz) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-Talk-Sprachnotiz darstellen
    - Antwort-Payloads behalten `audioAsVoice` bei; die TTS-Sprachnotiz-Ausgabe für WhatsApp bleibt auf diesem PTT-Pfad, selbst wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird als `audio/ogg; codecs=opus` für Sprachnotiz-Kompatibilität gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3/WebM-Ausgabe, wird vor der PTT-Zustellung mit `ffmpeg` in 48 kHz Mono Ogg/Opus transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnotiz und unterdrückt wiederholte Sendungen für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Beschriftungen werden beim Senden von Multi-Media-Antwort-Payloads auf das erste Medienelement angewendet, außer bei PTT-Sprachnotizen: Diese senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnotiz-Beschriftungen nicht konsistent darstellen
    - Medienquellen können HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherobergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendeobergrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätssuche), damit sie in die Limits passen
    - bei einem Fehler beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt native Antwortzitate, bei denen ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                           |
| `"first"`   | Nur den ersten ausgehenden Antwort-Chunk zitieren                     |
| `"all"`     | Jeden ausgehenden Antwort-Chunk zitieren                              |
| `"batched"` | In die Warteschlange gestellte gebündelte Antworten zitieren, während sofortige Antworten nicht zitiert werden |

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

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Stufe         | Ack-Reaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                         |
| ------------- | -------------- | ------------------------------- | ---------------------------------------------------- |
| `"off"`       | Nein           | Nein                            | Überhaupt keine Reaktionen                           |
| `"ack"`       | Ja             | Nein                            | Nur Ack-Reaktionen (Empfangsbestätigung vor Antwort) |
| `"minimal"`   | Ja             | Ja (konservativ)                | Ack + Agentenreaktionen mit konservativer Vorgabe    |
| `"extensive"` | Ja             | Ja (empfohlen)                  | Ack + Agentenreaktionen mit empfohlener Vorgabe      |

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

WhatsApp unterstützt sofortige Ack-Reaktionen beim Empfang eingehender Nachrichten über `channels.whatsapp.ackReaction`.
Ack-Reaktionen werden durch `reactionLevel` gesteuert — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

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

Verhaltenshinweise:

- sofort gesendet, nachdem die eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Turns; Gruppenaktivierung `always` dient als Bypass für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das Legacy-`messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standards">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - Legacy-Standard-Auth in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Logout-Verhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Auth-Status für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt Logout zuerst den laufenden WhatsApp-Listener für das ausgewählte Konto, damit die verknüpfte Sitzung bis zum nächsten Neustart nicht weiter Nachrichten empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den laufenden Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet nicht verknüpft.

    Lösung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Ruhige Konten können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog
    startet neu, wenn die WhatsApp-Web-Transportaktivität stoppt, der Socket geschlossen wird oder
    Aktivität auf Anwendungsebene über das längere Sicherheitsfenster hinaus still bleibt.

    Wenn Logs wiederholt `status=408 Request Time-out Connection was lost` zeigen, passen Sie
    Baileys-Socket-Timings unter `web.whatsapp` an. Beginnen Sie damit,
    `keepAliveIntervalMs` unter das Idle-Timeout Ihres Netzwerks zu verkürzen und
    `connectTimeoutMs` bei langsamen oder verlustbehafteten Verbindungen zu erhöhen:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Lösung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldet, aber
    `openclaw gateway status` und `openclaw channels status --probe` zeigen, dass das
    Gateway und WhatsApp fehlerfrei sind, führen Sie `openclaw doctor` aus. Unter Linux warnt doctor
    vor Legacy-crontab-Einträgen, die weiterhin
    `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese veralteten Einträge mit
    `crontab -e`, weil Cron die systemd-User-Bus-Umgebung fehlen kann und
    dieses alte Skript dadurch die Gateway-Gesundheit falsch meldet.

    Falls nötig, verknüpfen Sie erneut mit `channels login`.

  </Accordion>

  <Accordion title="QR-Login läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung.

    WhatsApp-Web-Login verwendet die Standard-Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen schnell fehl, wenn kein aktiver Gateway-Listener für das Zielkonto vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent erzeugt hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw behandelt eine automatische Antwort erst dann als gesendet, nachdem Baileys für mindestens einen sichtbaren Text- oder Medienversand eine ausgehende Nachrichten-ID zurückgegeben hat.

    Ack-Reaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie die Gateway-Logs auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, halten Sie daher nur ein einzelnes `groupPolicy` pro Scope

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun wird als inkompatibel für stabilen WhatsApp/Telegram-Gateway-Betrieb markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt sie die Root-`groups`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft anschließend auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt sie die Root-`direct`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft anschließend auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Wildcard-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der schlanke Bucket für Verlaufüberschreibungen pro DM (`dms.<id>.historyLimit`). Prompt-Überschreibungen liegen unter `direct`.
</Note>

**Unterschied zum Telegram-Mehrkontoverhalten:** In Telegram werden Root-`groups` in einer Mehrkontoeinrichtung absichtlich für alle Konten unterdrückt, auch für Konten, die keine eigenen `groups` definieren, damit ein Bot keine Gruppennachrichten für Gruppen erhält, denen er nicht angehört. WhatsApp wendet diesen Schutz nicht an: Root-`groups` und Root-`direct` werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer WhatsApp-Mehrkontoeinrichtung gruppen- oder direktchatbezogene Prompts pro Konto verwenden möchten, definieren Sie die vollständige Zuordnung explizit unter jedem Konto, statt sich auf Root-Defaults zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurationszuordnung pro Gruppe als auch die Allowlist auf Chat-Ebene für Gruppen. Auf Root- oder Kontoebene bedeutet `groups["*"]`: „Alle Gruppen sind für diesen Geltungsbereich zugelassen“.
- Fügen Sie einen Wildcard-Gruppen-`systemPrompt` nur hinzu, wenn Sie für diesen Geltungsbereich ohnehin alle Gruppen zulassen möchten. Wenn weiterhin nur ein fester Satz von Gruppen-IDs berechtigt sein soll, verwenden Sie `groups["*"]` nicht als Prompt-Default. Wiederholen Sie den Prompt stattdessen in jedem explizit zugelassenen Gruppeneintrag.
- Gruppenzulassung und Senderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Gruppe von Chats, die die Gruppenbehandlung erreichen können, autorisiert aber nicht automatisch jeden Sender in diesen Gruppen. Der Senderzugriff wird weiterhin separat über `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht denselben Nebeneffekt für DMs. `direct["*"]` stellt nur eine Default-Konfiguration für Direktchats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Pairing-Store-Regeln zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
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
- Mehrkonto: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandte Themen

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
