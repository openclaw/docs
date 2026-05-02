---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Inbox-Routing
summary: Unterstützung für den WhatsApp-Kanal, Zugriffskontrollen, Zustellungsverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T06:27:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c25380f6a08e771b1a3f5e39f2284cffbffe76a3b05f1a885efe0a5f6a7d022c
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern Sie auf, das WhatsApp-Plugin zu installieren, wenn Sie es zum ersten Mal auswählen.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: verwendet das npm-Paket `@openclaw/whatsapp`, wenn ein aktuelles Paket
  veröffentlicht ist.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Wenn npm das OpenClaw-eigene Paket als veraltet oder fehlend meldet, verwenden Sie einen
aktuellen paketierten OpenClaw-Build oder einen lokalen Checkout, bis der npm-Paketzug
aufgeholt hat.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie ist Pairing für unbekannte Absender.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Für ein bestimmtes Konto:

```bash
openclaw channels login --channel whatsapp --account work
```

    Um ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Authentifizierungsverzeichnis vor der Anmeldung anzuhängen:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing-Anfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Kanal begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer auszuführen. (Die Kanalmetadaten und der Einrichtungsablauf sind für diese Einrichtung optimiert, aber Einrichtungen mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
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

  <Accordion title="Personal-number fallback">
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Baseline:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Der Messaging-Plattformkanal basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Der Wiederverbindungs-Watchdog nutzt die WhatsApp-Web-Transportaktivität, nicht nur das Volumen eingehender App-Nachrichten. Daher wird eine ruhige Sitzung eines verknüpften Geräts nicht nur deshalb neu gestartet, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Obergrenze für Anwendung-Stille erzwingt weiterhin eine Wiederverbindung, wenn Transport-Frames weiter eintreffen, aber im Watchdog-Zeitfenster keine Anwendungsnachrichten verarbeitet werden; nach einer vorübergehenden Wiederverbindung für eine kürzlich aktive Sitzung verwendet diese Anwendung-Stille-Prüfung im ersten Wiederherstellungsfenster das normale Nachrichten-Timeout.
- Baileys-Socket-Timings sind explizit unter `web.whatsapp.*`: `keepAliveIntervalMs` steuert WhatsApp-Web-Anwendungs-Pings, `connectTimeoutMs` steuert das Timeout für den Eröffnungs-Handshake, und `defaultQueryTimeoutMs` steuert Baileys-Abfrage-Timeouts.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Wiederverbindungs-Watchdog folgt der WhatsApp-Web-Transportaktivität, nicht nur dem Volumen eingehender App-Nachrichten: ruhige Sitzungen verknüpfter Geräte bleiben bestehen, solange Transport-Frames weiterlaufen, aber ein Transport-Stillstand erzwingt eine Wiederverbindung deutlich vor dem späteren Remote-Trennpfad.
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` führt DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt standardmäßige Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinschreibung). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Ack-Reaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Felder zur Sitzungskorrelation enthalten. Aus diesem Grund
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
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf direkte Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Mehrkonto-Override: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Pairings werden im Allow-Store des Kanals persistiert und mit konfiguriertem `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw paart ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Group policy + allowlists">
    Gruppenzugriff hat zwei Ebenen:

    1. **Gruppenmitgliedschaft-Allowlist** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen berechtigt
       - wenn `groups` vorhanden ist, wirkt es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Gruppenabsender-Richtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, wenn verfügbar
    - Absender-Allowlists werden vor Mention-/Reply-Aktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Fallback der Gruppenrichtlinie zur Laufzeit `allowlist` (mit Warnprotokoll), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Mentions + /activation">
    Gruppenantworten erfordern standardmäßig eine Mention.

    Mention-Erkennung umfasst:

    - explizite WhatsApp-Mentions der Bot-Identität
    - konfigurierte Mention-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Voice-Note-Transkripte für autorisierte Gruppennachrichten
    - implizite Antwort-an-Bot-Erkennung (Antwort-Absender entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Mention-Gating; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden nicht allowlistete Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines allowlisteten Benutzers antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist eigentümergeschützt.

  </Tab>
</Tabs>

## Verhalten bei persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbst-Chat-Schutzmechanismen aktiviert:

- Lesebestätigungen für Selbst-Chat-Turns überspringen
- Mention-JID-Auto-Trigger-Verhalten ignorieren, das andernfalls Sie selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort existiert, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwort-Metadatenfelder werden ebenfalls gefüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).
    Wenn das zitierte Antwortziel herunterladbare Medien ist, speichert OpenClaw sie über
    den normalen eingehenden Medienspeicher und stellt sie als `MediaPath`/`MediaType` bereit, damit
    der Agent das referenzierte Bild inspizieren kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern normalisiert, z. B.:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppen-Voice-Notes werden vor dem Mention-Gating transkribiert, wenn der
    Body nur `<media:audio>` ist, sodass das Aussprechen der Bot-Mention in der Voice-Note
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript im ausstehenden Gruppenverlauf behalten statt des rohen Platzhalters.

    Standort-Bodys verwenden knappen Koordinatentext. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Pending group history injection">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext injiziert werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Injektionsmarker:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    Override pro Konto:

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

    Selbst-Chat-Turns überspringen Lesebestätigungen, selbst wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung in Blöcke">
    - Standard-Blocklimit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensichere Blockaufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnotiz) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-talk-Sprachnotiz anzeigen
    - Antwort-Payloads behalten `audioAsVoice` bei; TTS-Sprachnotiz-Ausgabe für WhatsApp bleibt auf diesem PTT-Pfad, auch wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird für Sprachnotiz-Kompatibilität als `audio/ogg; codecs=opus` gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3/WebM-Ausgabe, wird vor der PTT-Zustellung mit `ffmpeg` in 48-kHz-Mono-Ogg/Opus transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnotiz und unterdrückt wiederholtes Senden für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Beschriftungen werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet, außer PTT-Sprachnotizen senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnotiz-Beschriftungen nicht zuverlässig anzeigen
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherlimit für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Kontoabhängige Überschreibungen verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um in die Limits zu passen
    - Bei einem Fehler beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt native Antwortzitate, bei denen ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                            |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                          |
| `"first"`   | Nur den ersten ausgehenden Antwortblock zitieren                      |
| `"all"`     | Jeden ausgehenden Antwortblock zitieren                              |
| `"batched"` | In der Warteschlange gebündelte Antworten zitieren, sofortige Antworten aber nicht |

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

`channels.whatsapp.reactionLevel` steuert, wie umfassend der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Stufe         | Bestätigungsreaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                      |
| ------------- | ---------------------- | -------------------------------- | ------------------------------------------------- |
| `"off"`       | Nein                   | Nein                             | Gar keine Reaktionen                             |
| `"ack"`       | Ja                     | Nein                             | Nur Bestätigungsreaktionen (Empfangsbestätigung vor der Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)               | Bestätigung + Agent-Reaktionen mit zurückhaltender Anleitung |
| `"extensive"` | Ja                     | Ja (empfohlen)                   | Bestätigung + Agent-Reaktionen mit empfohlener Anleitung |

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

WhatsApp unterstützt sofortige Bestätigungsreaktionen beim Empfang eingehender Nachrichten über `channels.whatsapp.ackReaction`.
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

- wird sofort nach Annahme der eingehenden Nachricht gesendet (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei erwähnungsausgelösten Durchläufen; Gruppenaktivierung `always` dient als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das Legacy-`messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standards">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Anmeldedatenpfade und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - Legacy-Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt die Abmeldung zuerst den aktiven WhatsApp-Listener für das ausgewählte Konto, damit die verknüpfte Sitzung nicht bis zum nächsten Neustart weiter Nachrichten empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den aktiven Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionssperren:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

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
    Symptom: verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Ruhige Konten können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog
    startet neu, wenn die WhatsApp-Web-Transportaktivität stoppt, der Socket geschlossen wird oder
    Aktivität auf Anwendungsebene über das längere Sicherheitsfenster hinaus ausbleibt.

    Wenn die Logs wiederholt `status=408 Request Time-out Connection was lost` zeigen, passen Sie
    die Baileys-Socket-Zeitsteuerungen unter `web.whatsapp` an. Beginnen Sie damit,
    `keepAliveIntervalMs` unter das Leerlauf-Timeout Ihres Netzwerks zu verkürzen und
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

    Behebung:

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
    dieses alte Skript dadurch die Gateway-Integrität falsch meldet.

    Verknüpfen Sie bei Bedarf mit `channels login` neu.

  </Accordion>

  <Accordion title="QR-Anmeldung läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung.

    Die WhatsApp-Web-Anmeldung verwendet die standardmäßige Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinschreibung und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen schnell fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass das Gateway ausgeführt wird und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent generiert hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw behandelt eine automatische Antwort erst dann als gesendet, nachdem Baileys für mindestens einen sichtbaren Text- oder Medienversand eine ausgehende Nachrichten-ID zurückgegeben hat.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie die Gateway-Logs auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Zulassungslisteneinträge in `groups`
    - Erwähnungssteuerung (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, behalten Sie daher nur ein einziges `groupPolicy` pro Geltungsbereich bei

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun wird als inkompatibel für stabilen WhatsApp/Telegram-Gateway-Betrieb markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt Telegram-artige System-Prompts für Gruppen und direkte Chats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive Map `groups` wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt sie die Root-Map `groups` vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der daraus resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für direkte Nachrichten:

Die effektive Map `direct` wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt sie die Root-Map `direct` vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der daraus resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Platzhalter-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der schlanke Bucket für DM-spezifische Verlaufsüberschreibungen (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

**Unterschied zum Multi-Account-Verhalten von Telegram:** In Telegram wird `groups` auf Root-Ebene in einer Multi-Account-Konfiguration absichtlich für alle Konten unterdrückt, auch für Konten, die selbst keine `groups` definieren, damit ein Bot keine Gruppennachrichten für Gruppen erhält, denen er nicht angehört. WhatsApp wendet diesen Schutzmechanismus nicht an: `groups` auf Root-Ebene und `direct` auf Root-Ebene werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer Multi-Account-Konfiguration für WhatsApp gruppen- oder direktchatbezogene Prompts pro Konto verwenden möchten, definieren Sie die vollständige Map ausdrücklich unter jedem Konto, anstatt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Allowlist für Gruppen auf Chat-Ebene. Auf Root- oder Kontoebene bedeutet `groups["*"]`, dass „alle Gruppen für diesen Geltungsbereich zugelassen sind“.
- Fügen Sie einen Platzhaltergruppen-`systemPrompt` nur hinzu, wenn Sie bereits möchten, dass dieser Geltungsbereich alle Gruppen zulässt. Wenn weiterhin nur eine feste Menge von Gruppen-IDs zulässig sein soll, verwenden Sie `groups["*"]` nicht für den Prompt-Standardwert. Wiederholen Sie den Prompt stattdessen für jeden ausdrücklich per Allowlist zugelassenen Gruppeneintrag.
- Gruppenzulassung und Senderautorisierung sind separate Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenbehandlung erreichen können, autorisiert aber nicht automatisch jeden Sender in diesen Gruppen. Der Senderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht denselben Nebeneffekt für DMs. `direct["*"]` stellt nur eine Standardkonfiguration für Direktchats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln aus dem Pairing-Speicher zugelassen wurde.

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

WhatsApp-Felder mit hoher Signalwirkung:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Multi-Account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
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
