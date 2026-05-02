---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Posteingangs-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:42:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern Sie auf, das WhatsApp-Plugin zu installieren, wenn Sie es zum ersten Mal auswählen.
- `openclaw channels login --channel whatsapp` bietet ebenfalls den Installationsablauf an, wenn
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
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie ist Kopplung für unbekannte Absender.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
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

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp Web-Auth-Verzeichnis einzubinden:

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
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer auszuführen. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
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
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Basislinie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Nur WhatsApp Web-Kanalumfang">
    Der Messaging-Plattformkanal basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Gateway verwaltet den WhatsApp-Socket und die Reconnect-Schleife.
- Der Reconnect-Watchdog verwendet WhatsApp Web-Transportaktivität, nicht nur das eingehende App-Nachrichtenvolumen, sodass eine ruhige verknüpfte Gerätesitzung nicht allein deshalb neu gestartet wird, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Obergrenze für Anwendungsstille erzwingt weiterhin einen Reconnect, wenn Transport-Frames weiter eintreffen, aber im Watchdog-Fenster keine Anwendungsnachrichten verarbeitet werden; nach einem vorübergehenden Reconnect für eine kürzlich aktive Sitzung verwendet diese Prüfung auf Anwendungsstille das normale Nachrichten-Timeout für das erste Wiederherstellungsfenster.
- Baileys-Socket-Timings sind explizit unter `web.whatsapp.*`: `keepAliveIntervalMs` steuert WhatsApp Web-Anwendungs-Pings, `connectTimeoutMs` steuert das Timeout für den öffnenden Handshake, und `defaultQueryTimeoutMs` steuert Baileys-Abfrage-Timeouts.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Reconnect-Watchdog folgt WhatsApp Web-Transportaktivität, nicht nur dem eingehenden App-Nachrichtenvolumen: Ruhige verknüpfte Gerätesitzungen bleiben aktiv, solange Transport-Frames weiterlaufen, aber ein Transport-Stillstand erzwingt einen Reconnect deutlich vor dem späteren Remote-Disconnect-Pfad.
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-Kanäle/Newsletter können explizite ausgehende Ziele mit ihrer nativen `@newsletter`-JID sein. Ausgehende Newsletter-Sendungen verwenden Kanal-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) statt DM-Sitzungssemantik.
- Der WhatsApp Web-Transport berücksichtigt standardmäßige Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Bestätigungsreaktion, nachdem eine sichtbare Antwort zugestellt wurde.

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

Aktivieren Sie dies nur für Plugins, denen Sie den Empfang eingehender WhatsApp-Nachrichteninhalte
und Kennungen anvertrauen.

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

    Multi-Konto-Override: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben Vorrang vor Standardeinstellungen auf Kanalebene für dieses Konto.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im Kanal-Allow-Store dauerhaft gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
    - geplante Automatisierung und Heartbeat-Empfänger-Fallback verwenden explizite Zustellziele oder konfiguriertes `allowFrom`; DM-Kopplungsgenehmigungen sind keine impliziten Cron- oder Heartbeat-Empfänger
    - wenn keine Zulassungsliste konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig zugelassen
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Gruppenrichtlinie + Zulassungslisten">
    Gruppenzugriff hat zwei Ebenen:

    1. **Zulassungsliste für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen zulässig
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Zulassungsliste (`"*"` erlaubt)

    2. **Gruppen-Absenderrichtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Zulassungsliste wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Zulassungsliste:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Zulassungslisten werden vor Erwähnungs-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block existiert, ist der Laufzeit-Fallback für Gruppenrichtlinien `allowlist` (mit Warnprotokoll), auch wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Sprachnotiz-Transkripte für autorisierte Gruppennachrichten
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender stimmt mit Bot-Identität überein)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur die Erwähnungsprüfung; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden nicht zugelassene Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines zugelassenen Benutzers antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist eigentümerbeschränkt.

  </Tab>
</Tabs>

## Verhalten mit persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbst-Chat-Schutzmechanismen aktiviert:

- Lesebestätigungen für Selbst-Chat-Durchläufe überspringen
- automatisches Mention-JID-Trigger-Verhalten ignorieren, das Sie andernfalls selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag eingebettet.

    Wenn eine zitierte Antwort existiert, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwortmetadatenfelder werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).
    Wenn das Ziel der zitierten Antwort herunterladbare Medien sind, speichert OpenClaw sie über
    den normalen eingehenden Medienspeicher und stellt sie als `MediaPath`/`MediaType` bereit, sodass
    der Agent das referenzierte Bild prüfen kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medien-Platzhalter und Standort-/Kontaktextraktion">
    Eingehende Nur-Medien-Nachrichten werden mit Platzhaltern wie den folgenden normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppen-Sprachnotizen werden vor der Erwähnungsprüfung transkribiert, wenn der
    Inhalt nur `<media:audio>` ist, sodass das Aussprechen der Bot-Erwähnung in der Sprachnotiz
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript statt des rohen Platzhalters im ausstehenden Gruppenverlauf beibehalten.

    Standortinhalte verwenden knappen Koordinatentext. Standortbeschriftungen/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Einfügung ausstehender Gruppenverläufe">
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

    Selbstchat-Verläufe überspringen Lesebestätigungen, auch wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - Standardlimit für Aufteilungen: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnotiz) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-talk-Sprachnotiz darstellen
    - Antwort-Payloads bewahren `audioAsVoice`; die TTS-Sprachnotiz-Ausgabe für WhatsApp bleibt auf diesem PTT-Pfad, auch wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird für Sprachnotiz-Kompatibilität als `audio/ogg; codecs=opus` gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3/WebM-Ausgabe, wird vor der PTT-Zustellung mit `ffmpeg` in 48 kHz Mono Ogg/Opus transcodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnotiz und unterdrückt wiederholte Sendungen für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - Die Wiedergabe animierter GIFs wird über `gifPlayback: true` bei Videosendungen unterstützt
    - Beschriftungen werden beim Senden von Multi-Media-Antwort-Payloads auf das erste Medienelement angewendet, außer PTT-Sprachnotizen senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnotiz-Beschriftungen nicht konsistent darstellen
    - Medienquellen können HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherlimit für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Kontoüberschreibungen verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderungs-/Qualitätsdurchlauf), um Limits einzuhalten
    - Bei Fehlern beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Zitieren von Antworten, wobei ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                                  |
| ----------- | -------------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                                |
| `"first"`   | Nur den ersten ausgehenden Antwortteil zitieren                            |
| `"all"`     | Jeden ausgehenden Antwortteil zitieren                                     |
| `"batched"` | In der Warteschlange gesammelte Antworten zitieren, sofortige Antworten jedoch nicht |

Standard ist `"off"`. Kontoüberschreibungen verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Stufe         | Ack-Reaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                           |
| ------------- | -------------- | ------------------------------- | ------------------------------------------------------ |
| `"off"`       | Nein           | Nein                            | Keine Reaktionen                                      |
| `"ack"`       | Ja             | Nein                            | Nur Ack-Reaktionen (Bestätigung vor der Antwort)       |
| `"minimal"`   | Ja             | Ja (konservativ)                | Ack + Agent-Reaktionen mit konservativer Führung       |
| `"extensive"` | Ja             | Ja (empfohlen)                  | Ack + Agent-Reaktionen mit empfohlener Führung         |

Standard: `"minimal"`.

Kontoüberschreibungen verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp unterstützt sofortige Ack-Reaktionen beim Eingang über `channels.whatsapp.ackReaction`.
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

Hinweise zum Verhalten:

- wird unmittelbar gesendet, nachdem der Eingang akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Verläufen; Gruppenaktivierung `always` dient als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standardkontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - die veraltete Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Abläufe weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt das Abmelden zuerst den aktiven WhatsApp-Listener für das ausgewählte Konto, sodass die verknüpfte Sitzung nicht bis zum nächsten Neustart weiterhin Nachrichten empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den aktiven Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionsgates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet, dass er nicht verknüpft ist.

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
    Aktivität auf Anwendungsebene über das längere Sicherheitsfenster hinaus still bleibt.

    Wenn Protokolle wiederholt `status=408 Request Time-out Connection was lost` anzeigen, passen Sie
    die Baileys-Socket-Zeitvorgaben unter `web.whatsapp` an. Beginnen Sie damit,
    `keepAliveIntervalMs` unter das Leerlauf-Timeout Ihres Netzwerks zu verkürzen und
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
    `openclaw gateway status` und `openclaw channels status --probe` zeigen, dass das
    Gateway und WhatsApp fehlerfrei sind, führen Sie `openclaw doctor` aus. Unter Linux warnt
    doctor vor veralteten crontab-Einträgen, die weiterhin
    `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese veralteten Einträge mit
    `crontab -e`, weil cron die systemd-User-Bus-Umgebung fehlen kann und
    dieses alte Skript dadurch den Gateway-Zustand falsch meldet.

    Verknüpfen Sie bei Bedarf erneut mit `channels login`.

  </Accordion>

  <Accordion title="QR-Anmeldung läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein verwendbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer getrennten TLS-Socket-Verbindung.

    Die WhatsApp-Web-Anmeldung verwendet die standardmäßige Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinschreibung und `NO_PROXY`). Stellen Sie sicher, dass der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen schnell fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent generiert hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw behandelt eine automatische Antwort erst dann als gesendet, nachdem Baileys für mindestens eine sichtbare Text- oder Mediensendung eine ausgehende Nachrichten-ID zurückgegeben hat.

    Ack-Reaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion belegt nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie die Gateway-Protokolle auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, behalten Sie daher nur ein einzelnes `groupPolicy` pro Scope bei

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun wird als inkompatibel für stabilen WhatsApp/Telegram-Gateway-Betrieb markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt Telegram-ähnliche System-Prompts für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die wirksame `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt es die Root-`groups`-Map vollständig (kein Deep-Merge). Die Prompt-Suche läuft dann auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die wirksame `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt es die Root-`direct`-Map vollständig (kein Deep-Merge). Die Prompt-Suche läuft dann auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Wildcard-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der leichtgewichtige Bucket für Verlaufüberschreibungen pro DM (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

**Unterschied zum Multi-Account-Verhalten von Telegram:** In Telegram werden Root-`groups` in einer Multi-Account-Konfiguration absichtlich für alle Accounts unterdrückt, auch für Accounts, die keine eigenen `groups` definieren, um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzregel nicht an: Root-`groups` und Root-`direct` werden immer von Accounts geerbt, die keinen Override auf Account-Ebene definieren, unabhängig davon, wie viele Accounts konfiguriert sind. Wenn Sie in einer Multi-Account-Konfiguration für WhatsApp gruppen- oder direktnachrichtenspezifische Prompts pro Account verwenden möchten, definieren Sie die vollständige Zuordnung explizit unter jedem Account, statt sich auf Defaults auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurationszuordnung pro Gruppe als auch die Allowlist für Gruppen auf Chat-Ebene. Sowohl im Root- als auch im Account-Scope bedeutet `groups["*"]`: „Alle Gruppen sind für diesen Scope zugelassen“.
- Fügen Sie eine Wildcard-Gruppe `systemPrompt` nur hinzu, wenn dieser Scope ohnehin alle Gruppen zulassen soll. Wenn weiterhin nur ein fester Satz von Gruppen-IDs zulässig sein soll, verwenden Sie `groups["*"]` nicht als Prompt-Default. Wiederholen Sie den Prompt stattdessen in jedem explizit allowgelisteten Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht automatisch jeden Absender in diesen Gruppen. Der Absenderzugriff wird weiterhin separat über `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
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
- Multi-Account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Overrides auf Account-Ebene
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
