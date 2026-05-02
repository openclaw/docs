---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Posteingangs-Routing
summary: Unterstützung des WhatsApp-Kanals, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
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
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
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

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp Web-Auth-Verzeichnis anzuhängen:

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

  <Step title="Erste Kopplungsanfrage genehmigen (wenn Sie den Kopplungsmodus verwenden)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Kopplungsanfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Kanal begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer auszuführen. (Die Kanalmetadaten und der Einrichtungsablauf sind für diese Einrichtung optimiert, Einrichtungen mit persönlicher Nummer werden jedoch ebenfalls unterstützt.)
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

  <Accordion title="Fallback mit persönlicher Nummer">
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Basis:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Kanalumfang nur für WhatsApp Web">
    Der Messaging-Plattformkanal basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Der Wiederverbindungs-Watchdog verwendet WhatsApp Web-Transportaktivität, nicht nur das Volumen eingehender App-Nachrichten. Eine ruhige Sitzung eines verknüpften Geräts wird daher nicht allein deshalb neu gestartet, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Grenze für Anwendungsstille erzwingt weiterhin eine Wiederverbindung, wenn Transport-Frames weiter eintreffen, aber während des Watchdog-Fensters keine Anwendungsnachrichten verarbeitet werden; nach einer vorübergehenden Wiederverbindung für eine kürzlich aktive Sitzung verwendet diese Prüfung auf Anwendungsstille das normale Nachrichten-Timeout für das erste Wiederherstellungsfenster.
- Baileys-Socket-Zeitvorgaben sind explizit unter `web.whatsapp.*`: `keepAliveIntervalMs` steuert WhatsApp Web-Anwendungs-Pings, `connectTimeoutMs` steuert das Timeout für den öffnenden Handshake und `defaultQueryTimeoutMs` steuert Baileys-Abfrage-Timeouts.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Wiederverbindungs-Watchdog folgt der WhatsApp Web-Transportaktivität, nicht nur dem Volumen eingehender App-Nachrichten: Ruhige Sitzungen verknüpfter Geräte bleiben aktiv, solange Transport-Frames weiterlaufen, aber ein Transportstillstand erzwingt eine Wiederverbindung deutlich vor dem späteren Remote-Trennungspfad.
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletter können explizite ausgehende Ziele mit ihrer nativen `@newsletter`-JID sein. Ausgehende Newsletter-Sendungen verwenden Kanal-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) statt DM-Sitzungssemantik.
- Der WhatsApp Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Ack-Reaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Felder zur Sitzungskorrelation enthalten. Aus diesem Grund
sendet WhatsApp eingehende `message_received`-Hook-Payloads nicht an Plugins,
sofern Sie dies nicht ausdrücklich aktivieren:

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
und Kennungen zu erhalten.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf Direktchats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    `allowFrom` ist eine Zugriffskontrollliste für DM-Absender. Sie beschränkt keine expliziten ausgehenden Sendungen an WhatsApp-Gruppen-JIDs oder `@newsletter`-Kanal-JIDs.

    Multi-Konto-Überschreibung: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben Vorrang vor Standardwerten auf Kanalebene für dieses Konto.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im Kanal-Allow-Store gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
    - geplante Automatisierung und Heartbeat-Empfänger-Fallback verwenden explizite Zustellziele oder konfiguriertes `allowFrom`; DM-Kopplungsgenehmigungen sind keine impliziten Cron- oder Heartbeat-Empfänger
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw koppelt ausgehende `fromMe`-DMs nie automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Gruppenzugriff hat zwei Ebenen:

    1. **Gruppenmitgliedschaft-Allowlist** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen berechtigt
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Gruppenabsender-Richtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss `groupAllowFrom` (oder `*`) entsprechen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor Erwähnungs-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Laufzeit-Fallback für die Gruppenrichtlinie `allowlist` (mit einer Warnprotokollmeldung), auch wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Voice-Note-Transkripte für autorisierte Gruppennachrichten
    - implizite Antwort-auf-Bot-Erkennung (Antwortabsender entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur die Erwähnungsprüfung; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden nicht auf der Allowlist stehende Absender weiterhin blockiert, auch wenn sie auf die Nachricht eines Benutzers auf der Allowlist antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist eigentümerbeschränkt.

  </Tab>
</Tabs>

## Persönliche Nummer und Selbst-Chat-Verhalten

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbst-Chat-Schutzmechanismen aktiviert:

- Lesebestätigungen für Selbst-Chat-Turns überspringen
- Verhalten zur automatischen Auslösung durch Erwähnungs-JID ignorieren, das Sie sonst selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwortmetadatenfelder werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).
    Wenn das Ziel der zitierten Antwort herunterladbare Medien sind, speichert OpenClaw diese über
    den normalen Speicher für eingehende Medien und stellt sie als `MediaPath`/`MediaType` bereit, sodass
    der Agent das referenzierte Bild untersuchen kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medien-Platzhalter und Standort-/Kontaktextraktion">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppen-Voice-Notes werden vor der Erwähnungsprüfung transkribiert, wenn der
    Textkörper nur `<media:audio>` ist, sodass das Aussprechen der Bot-Erwähnung in der Voice-Note
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript statt des rohen Platzhalters in der ausstehenden Gruppenhistorie behalten.

    Standorttexte verwenden knappe Koordinatentexte. Standortlabels/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Injektion ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Injektionsmarker:

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

    Self-Chat-Turns überspringen Lesebestätigungen, selbst wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standard-Chunk-Grenze: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensicheres Chunking zurück.

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnotiz) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-Talk-Sprachnotiz darstellen
    - Antwort-Payloads behalten `audioAsVoice` bei; TTS-Sprachnotiz-Ausgabe für WhatsApp bleibt auf diesem PTT-Pfad, auch wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird für Sprachnotiz-Kompatibilität als `audio/ogg; codecs=opus` gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3/WebM-Ausgabe, wird vor der PTT-Zustellung mit `ffmpeg` in 48-kHz-Mono-Ogg/Opus transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnotiz und unterdrückt wiederholtes Senden derselben Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sends unterstützt
    - Beschriftungen werden beim Senden von Multi-Media-Antwort-Payloads auf das erste Medienelement angewendet, außer PTT-Sprachnotizen senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnotiz-Beschriftungen nicht konsistent darstellen
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speichergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendegrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - kontoabhängige Überschreibungen verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um in die Limits zu passen
    - bei einem Fehler beim Mediensenden sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwort-Zitierung

WhatsApp unterstützt native Antwort-Zitierung, bei der ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                            |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                          |
| `"first"`   | Nur den ersten ausgehenden Antwort-Chunk zitieren                    |
| `"all"`     | Jeden ausgehenden Antwort-Chunk zitieren                             |
| `"batched"` | In der Warteschlange gebündelte Antworten zitieren, unmittelbare Antworten aber unzitiert lassen |

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

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Stufe         | Ack-Reaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                      |
| ------------- | -------------- | ------------------------------- | ------------------------------------------------- |
| `"off"`       | Nein           | Nein                            | Gar keine Reaktionen                             |
| `"ack"`       | Ja             | Nein                            | Nur Ack-Reaktionen (Empfang vor der Antwort)      |
| `"minimal"`   | Ja             | Ja (konservativ)                | Ack + Agent-Reaktionen mit konservativer Vorgabe  |
| `"extensive"` | Ja             | Ja (empfohlen)                  | Ack + Agent-Reaktionen mit empfohlener Vorgabe    |

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

WhatsApp unterstützt unmittelbare Ack-Reaktionen beim Empfang eingehender Nachrichten über `channels.whatsapp.ackReaction`.
Ack-Reaktionen werden durch `reactionLevel` eingeschränkt — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

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

- wird unmittelbar gesendet, nachdem die eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei Turns, die durch Erwähnungen ausgelöst wurden; Gruppenaktivierung `always` dient als Umgehung dieser Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das ältere `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldeinformationen

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standards">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Pfade für Anmeldeinformationen und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - ältere Standard-Auth in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Auth-Status für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt die Abmeldung zuerst den aktiven WhatsApp-Listener für das ausgewählte Konto, damit die verknüpfte Sitzung bis zum nächsten Neustart keine Nachrichten weiter empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den aktiven Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Channel initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Channel-Status meldet, dass keine Verknüpfung besteht.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Ruhige Konten können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog
    startet neu, wenn die WhatsApp-Web-Transportaktivität stoppt, der Socket geschlossen wird oder
    Aktivität auf Anwendungsebene länger als das längere Sicherheitsfenster still bleibt.

    Wenn Logs wiederholt `status=408 Request Time-out Connection was lost` zeigen, passen Sie
    die Baileys-Socket-Zeitwerte unter `web.whatsapp` an. Beginnen Sie damit,
    `keepAliveIntervalMs` unter das Idle-Timeout Ihres Netzwerks zu senken und
    `connectTimeoutMs` auf langsamen oder verlustbehafteten Verbindungen zu erhöhen:

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

    Behebung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldet, aber
    `openclaw gateway status` und `openclaw channels status --probe` zeigen, dass
    Gateway und WhatsApp fehlerfrei sind, führen Sie `openclaw doctor` aus. Unter Linux warnt doctor
    vor älteren Crontab-Einträgen, die weiterhin
    `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese veralteten Einträge mit
    `crontab -e`, weil Cron die systemd-User-Bus-Umgebung fehlen kann und
    dieses alte Skript dadurch den Gateway-Zustand falsch meldet.

    Falls nötig, verknüpfen Sie erneut mit `channels login`.

  </Accordion>

  <Accordion title="QR-Anmeldung läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung.

    WhatsApp-Web-Anmeldung verwendet die Standard-Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sends schlagen schnell fehl, wenn für das Zielkonto kein aktiver Gateway-Listener existiert.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent erzeugt hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw behandelt eine automatische Antwort erst dann als gesendet, nachdem Baileys für mindestens einen sichtbaren Text- oder Mediensend eine ausgehende Nachrichten-ID zurückgegeben hat.

    Ack-Reaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie Gateway-Logs auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, behalten Sie daher ein einzelnes `groupPolicy` pro Scope bei

  </Accordion>

  <Accordion title="Bun-Runtime-Warnung">
    Die WhatsApp-Gateway-Runtime sollte Node verwenden. Bun wird für stabilen WhatsApp/Telegram-Gateway-Betrieb als inkompatibel markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt Telegram-artige System-Prompts für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt sie die Root-`groups`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft anschließend auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenkette (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigenes `direct` definiert, ersetzt es die Root-`direct`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft anschließend auf der resultierenden einzelnen Map:

1. **Direkt-spezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenkette (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Wildcard-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der leichtgewichtige Override-Bucket für Verlauf pro DM (`dms.<id>.historyLimit`). Prompt-Overrides liegen unter `direct`.
</Note>

**Unterschied zum Mehrkontenverhalten von Telegram:** In Telegram wird `groups` auf Root-Ebene in einer Mehrkonteneinrichtung absichtlich für alle Konten unterdrückt, auch für Konten, die keine eigenen `groups` definieren, damit ein Bot keine Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzlogik nicht an: `groups` und `direct` auf Root-Ebene werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer Mehrkonteneinrichtung von WhatsApp gruppen- oder direktchatbezogene Prompts pro Konto verwenden möchten, definieren Sie die vollständige Zuordnung ausdrücklich unter jedem Konto, statt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtige Verhaltensweisen:

- `channels.whatsapp.groups` ist sowohl eine Konfigurationszuordnung pro Gruppe als auch die Zulassungsliste für Gruppen auf Chat-Ebene. Auf Root- oder Kontoebene bedeutet `groups["*"]`: „Alle Gruppen sind für diesen Geltungsbereich zugelassen“.
- Fügen Sie nur dann einen Wildcard-Gruppen-`systemPrompt` hinzu, wenn dieser Geltungsbereich ohnehin alle Gruppen zulassen soll. Wenn weiterhin nur ein fester Satz von Gruppen-IDs berechtigt sein soll, verwenden Sie `groups["*"]` nicht für den Prompt-Standardwert. Wiederholen Sie den Prompt stattdessen für jeden ausdrücklich zugelassenen Gruppeneintrag.
- Gruppenzulassung und Senderautorisierung sind separate Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht automatisch jeden Sender in diesen Gruppen. Der Senderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht denselben Nebeneffekt für Direktnachrichten. `direct["*"]` stellt nur eine Standardkonfiguration für Direktchats bereit, nachdem eine Direktnachricht bereits durch `dmPolicy` plus `allowFrom` oder Regeln aus dem Pairing-Speicher zugelassen wurde.

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

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/config-channels#whatsapp)

Signalstarke WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Mehrkontenbetrieb: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandte Themen

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Channel-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
