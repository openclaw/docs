---
read_when:
    - Arbeiten am Verhalten von WhatsApp-/Webkanälen oder am Posteingangs-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T06:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsreif über WhatsApp Web (Baileys). Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fragen bei der ersten Auswahl nach der Installation des WhatsApp-Plugins.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Channel + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: verwendet das npm-Paket `@openclaw/whatsapp`, wenn ein aktuelles Paket
  veröffentlicht ist.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Wenn npm das OpenClaw-eigene Paket als veraltet oder fehlend meldet, verwenden Sie einen
aktuellen paketierten OpenClaw-Build oder einen lokalen Checkout, bis der npm-Paket-Train
aufgeholt hat.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie ist Pairing für unbekannte Absender.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
  </Card>
</CardGroup>

## Schnelle Einrichtung

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

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Auth-Verzeichnis anzuhängen:

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
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer auszuführen. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, Setups mit persönlicher Nummer werden jedoch ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
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

  <Accordion title="Personal-number fallback">
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Basis:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Der Kanal der Messaging-Plattform basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Der Wiederverbindungs-Watchdog verwendet die WhatsApp-Web-Transportaktivität, nicht nur das Volumen eingehender App-Nachrichten, sodass eine ruhige Sitzung eines verknüpften Geräts nicht allein deshalb neu gestartet wird, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Obergrenze für Anwendungsschweigen erzwingt weiterhin eine Wiederverbindung, wenn Transport-Frames weiterhin eintreffen, aber während des Watchdog-Fensters keine Anwendungsnachrichten verarbeitet werden; nach einer vorübergehenden Wiederverbindung für eine kürzlich aktive Sitzung verwendet diese Prüfung auf Anwendungsschweigen das normale Nachrichten-Timeout für das erste Wiederherstellungsfenster.
- Baileys-Socket-Zeitwerte sind explizit unter `web.whatsapp.*`: `keepAliveIntervalMs` steuert WhatsApp-Web-Anwendungs-Pings, `connectTimeoutMs` steuert das Timeout des öffnenden Handshakes, und `defaultQueryTimeoutMs` steuert Baileys-Abfrage-Timeouts.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Wiederverbindungs-Watchdog folgt der WhatsApp-Web-Transportaktivität, nicht nur dem Volumen eingehender App-Nachrichten: ruhige Sitzungen verknüpfter Geräte bleiben aktiv, solange Transport-Frames fortgesetzt werden, aber ein Transportstillstand erzwingt deutlich vor dem späteren Remote-Disconnect-Pfad eine Wiederverbindung.
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.
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

    Mehrkonto-Override: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Pairings werden im Kanal-Allow-Store gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw paart ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Group policy + allowlists">
    Gruppenzugriff hat zwei Ebenen:

    1. **Gruppenmitgliedschafts-Allowlist** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen berechtigt
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Gruppenabsender-Richtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss `groupAllowFrom` (oder `*`) entsprechen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback der Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor Mention-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Laufzeit-Fallback für Gruppenrichtlinien `allowlist` (mit Warnlog), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Mentions + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Mention-Erkennung umfasst:

    - explizite WhatsApp-Mentions der Bot-Identität
    - konfigurierte Mention-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Sprachnotiz-Transkripte für autorisierte Gruppennachrichten
    - implizite Erkennung von Antwort-an-Bot (Antwortabsender entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Mention-Gating; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden nicht in der Allowlist enthaltene Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines Benutzers aus der Allowlist antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist eigentümergeschützt.

  </Tab>
</Tabs>

## Verhalten bei persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbst-Chat-Schutzmechanismen aktiviert:

- Lesebestätigungen für Selbst-Chat-Durchläufe überspringen
- automatisches Auslösen durch Mention-JID ignorieren, das sonst Sie selbst pingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwort-Metadatenfelder werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Sender-JID/E.164).

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Eingehende Nachrichten nur mit Medien werden mit Platzhaltern normalisiert, beispielsweise:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppensprachnotizen werden vor dem Mention-Gating transkribiert, wenn der
    Textkörper nur `<media:audio>` ist, sodass das Aussprechen der Bot-Mention in der Sprachnotiz
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript statt des rohen Platzhalters im ausstehenden Gruppenverlauf behalten.

    Standorttexte verwenden knappe Koordinatentexte. Standortlabels/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Pending group history injection">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Injektionsmarker:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    Selbst-Chat-Durchläufe überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Text chunking">
    - Standard-Chunk-Limit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnotiz) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-Talk-Sprachnotiz darstellen
    - Antwort-Payloads behalten `audioAsVoice` bei; die TTS-Sprachnotiz-Ausgabe für WhatsApp bleibt auf diesem PTT-Pfad, selbst wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird als `audio/ogg; codecs=opus` für Sprachnotiz-Kompatibilität gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS MP3/WebM-Ausgabe, wird mit `ffmpeg` vor der PTT-Zustellung in 48 kHz Mono Ogg/Opus transkodiert
    - `/tts latest` sendet die letzte Assistentenantwort als eine Sprachnotiz und unterdrückt wiederholtes Senden für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Videosendungen unterstützt
    - Beschriftungen werden beim Senden von Multi-Media-Antwort-Payloads auf das erste Medienelement angewendet, außer PTT-Sprachnotizen senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Beschriftungen von Sprachnotizen nicht konsistent darstellen
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherobergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendeobergrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Pro-Konto-Überschreibungen verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um in die Limits zu passen
    - bei Fehlern beim Mediensenden sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Zitieren von Antworten, bei dem ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                            |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                          |
| `"first"`   | Nur den ersten ausgehenden Antwortblock zitieren                      |
| `"all"`     | Jeden ausgehenden Antwortblock zitieren                               |
| `"batched"` | In die Warteschlange gestellte gebündelte Antworten zitieren, unmittelbare Antworten aber unzitiert lassen |

Standard ist `"off"`. Pro-Konto-Überschreibungen verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Stufe         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                        |
| ------------- | ---------------------- | --------------------------------- | --------------------------------------------------- |
| `"off"`       | Nein                   | Nein                              | Keine Reaktionen                                    |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (Empfang vor der Antwort) |
| `"minimal"`   | Ja                     | Ja (konservativ)                  | Bestätigung + Agentenreaktionen mit konservativer Anleitung |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigung + Agentenreaktionen mit empfohlener Anleitung |

Standard: `"minimal"`.

Pro-Konto-Überschreibungen verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp unterstützt unmittelbare Bestätigungsreaktionen beim Eingang über `channels.whatsapp.ackReaction`.
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

Verhaltenshinweise:

- wird unmittelbar gesendet, nachdem die eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Turns; Gruppenaktivierung `always` dient als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das ältere `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standards">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standardkontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - ältere Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In älteren Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Kanalstatus meldet, dass keine Verknüpfung besteht.

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
    Aktivität auf Anwendungsebene über das längere Sicherheitsfenster hinaus ausbleibt.

    Wenn Protokolle wiederholt `status=408 Request Time-out Connection was lost` anzeigen, passen Sie
    die Baileys-Socket-Zeiten unter `web.whatsapp` an. Beginnen Sie damit,
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

    Lösung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, verknüpfen Sie erneut mit `channels login`.

  </Accordion>

  <Accordion title="QR-Anmeldung läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung.

    Die WhatsApp-Web-Anmeldung verwendet die Standard-Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen schnell fehl, wenn kein aktiver Gateway-Listener für das Zielkonto existiert.

    Stellen Sie sicher, dass der Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent generiert hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw behandelt eine automatische Antwort erst dann als gesendet, wenn Baileys für mindestens eine sichtbare Text- oder Mediensendung eine ausgehende Nachrichten-ID zurückgibt.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie Gateway-Protokolle auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, behalten Sie daher pro Geltungsbereich nur ein einziges `groupPolicy`

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun wird als inkompatibel für stabilen WhatsApp/Telegram-Gateway-Betrieb gekennzeichnet.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt sie die Root-`groups`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der daraus resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** dessen Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt sie die Root-`direct`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft dann auf der daraus resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** dessen Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Platzhalter-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der schlanke Bucket für Pro-DM-Verlaufsüberschreibungen (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

**Unterschied zum Telegram-Verhalten mit mehreren Konten:** In Telegram wird Root-`groups` für alle Konten in einer Mehrkonten-Konfiguration absichtlich unterdrückt — selbst für Konten, die keine eigenen `groups` definieren — damit ein Bot keine Gruppennachrichten für Gruppen erhält, denen er nicht angehört. WhatsApp wendet diesen Schutz nicht an: Root-`groups` und Root-`direct` werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer WhatsApp-Mehrkonten-Konfiguration gruppen- oder direktspezifische Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Root-Standardwerte zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurationszuordnung pro Gruppe als auch die Allowlist für Gruppen auf Chat-Ebene. Im Root- oder Konto-Scope bedeutet `groups["*"]` für diesen Scope „alle Gruppen werden zugelassen“.
- Fügen Sie eine Wildcard-Gruppe `systemPrompt` nur hinzu, wenn dieser Scope bereits alle Gruppen zulassen soll. Wenn weiterhin nur eine feste Menge von Gruppen-IDs berechtigt sein soll, verwenden Sie `groups["*"]` nicht für den Prompt-Standardwert. Wiederholen Sie den Prompt stattdessen für jeden ausdrücklich in der Allowlist zugelassenen Gruppeneintrag.
- Gruppenzulassung und Senderautorisierung sind separate Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber für sich genommen nicht jeden Sender in diesen Gruppen. Der Senderzugriff wird weiterhin separat über `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht denselben Nebeneffekt für DMs. `direct["*"]` stellt nur eine Standardkonfiguration für Direkt-Chats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Pairing-Store-Regeln zugelassen wurde.

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
- Mehrere Konten: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
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
