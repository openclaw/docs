---
read_when:
    - Arbeiten am WhatsApp-/Web-Channel-Verhalten oder am Inbox-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern Sie beim ersten Auswählen zur Installation des WhatsApp-Plugins auf.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: installiert zuerst das offizielle `@openclaw/whatsapp`-Plugin aus ClawHub,
  mit npm als Fallback.
- Die WhatsApp-Runtime wird außerhalb des zentralen OpenClaw-npm-Pakets verteilt, damit
  WhatsApp-spezifische Runtime-Abhängigkeiten beim externen Plugin bleiben.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Verwenden Sie das reine npm-Paket (`@openclaw/whatsapp`) nur, wenn Sie den Registry-
Fallback benötigen. Pinnen Sie nur dann eine exakte Version, wenn Sie eine reproduzierbare Installation benötigen.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie ist Pairing für unbekannte Absender.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
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

    Die aktuelle Anmeldung basiert auf QR-Codes. Stellen Sie in Remote- oder Headless-Umgebungen sicher, dass Sie
    einen zuverlässigen Weg haben, den Live-QR-Code an das Telefon zu übertragen, das ihn scannt,
    bevor Sie die Anmeldung starten.

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
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer auszuführen. (Die Kanalmetadaten und der Einrichtungsablauf sind für diese Konfiguration optimiert, Konfigurationen mit persönlicher Nummer werden jedoch ebenfalls unterstützt.)
</Note>

<Warning>
Der aktuelle WhatsApp-Einrichtungsablauf unterstützt nur QR-Codes. Im Terminal gerenderte QR-Codes, Screenshots,
PDFs oder Chat-Anhänge können ablaufen oder unlesbar werden, während sie
von einem Remote-Rechner weitergeleitet werden. Bevorzugen Sie für Remote-/Headless-Hosts eine direkte Übergabe
des QR-Bildes gegenüber einer manuellen Terminal-Erfassung.
</Warning>

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
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Basis:

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

## Runtime-Modell

- Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Der Wiederverbindungs-Watchdog nutzt WhatsApp-Web-Transportaktivität, nicht nur das Volumen eingehender App-Nachrichten, sodass eine ruhige Sitzung eines verknüpften Geräts nicht allein deshalb neu gestartet wird, weil in letzter Zeit niemand eine Nachricht gesendet hat. Eine längere Obergrenze für Anwendungsschweigen erzwingt weiterhin eine Wiederverbindung, wenn Transport-Frames weiter eintreffen, aber während des Watchdog-Fensters keine Anwendungsnachrichten verarbeitet werden; nach einer vorübergehenden Wiederverbindung für eine kürzlich aktive Sitzung verwendet diese Prüfung auf Anwendungsschweigen für das erste Wiederherstellungsfenster das normale Nachrichten-Timeout.
- Baileys-Socket-Timings sind explizit unter `web.whatsapp.*`: `keepAliveIntervalMs` steuert WhatsApp-Web-Anwendungs-Pings, `connectTimeoutMs` steuert das Timeout des Öffnungs-Handshakes, und `defaultQueryTimeoutMs` steuert Baileys-Abfragewartezeiten sowie die Grenzen für lokale ausgehende Sende-/Präsenzoperationen und eingehende Lesebestätigungsoperationen von OpenClaw.
- Ausgehende Sends erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Gruppen-Sends fügen native Mention-Metadaten für `@+<digits>`- und `@<digits>`-Tokens in Text und Medienbeschriftungen hinzu, wenn das Token mit aktuellen WhatsApp-Teilnehmermetadaten übereinstimmt, einschließlich LID-gestützter Gruppen.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Wiederverbindungs-Watchdog folgt WhatsApp-Web-Transportaktivität, nicht nur dem Volumen eingehender App-Nachrichten: Ruhige Sitzungen verknüpfter Geräte bleiben aktiv, solange Transport-Frames fortgesetzt werden, aber ein Transport-Stall erzwingt eine Wiederverbindung deutlich vor dem späteren Remote-Trennungspfad.
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletter können explizite ausgehende Ziele mit ihrer nativen `@newsletter`-JID sein. Ausgehende Newsletter-Sends verwenden Kanalsitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) anstelle von DM-Sitzungssemantik.
- Der WhatsApp-Web-Transport berücksichtigt standardmäßige Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Ack-Reaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Genehmigungs-Prompts

WhatsApp kann Ausführungs- und Plugin-Genehmigungs-Prompts mit `👍`-/`👎`-Reaktionen rendern. Die Zustellung wird
durch die oberste Konfiguration für Genehmigungsweiterleitung gesteuert:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` und `approvals.plugin` sind unabhängig. WhatsApp als Kanal zu aktivieren verknüpft nur
den Transport; es sendet keine Genehmigungs-Prompts, sofern die passende Genehmigungsfamilie nicht aktiviert ist
und zu WhatsApp routet. Der Sitzungsmodus liefert native Emoji-Genehmigungen nur für Genehmigungen, die
aus WhatsApp stammen. Der Zielmodus verwendet die gemeinsame Weiterleitungspipeline für explizite WhatsApp-
Ziele und erstellt keinen separaten Approver-DM-Fanout.

WhatsApp-Genehmigungsreaktionen erfordern explizite WhatsApp-Genehmigende aus `allowFrom` oder `"*"`.
`defaultTo` steuert gewöhnliche standardmäßige Nachrichtenziele; es ist kein Genehmigungs-Genehmigender. Manuelle
`/approve`-Befehle durchlaufen weiterhin den normalen WhatsApp-Absenderautorisierungspfad, bevor
die Genehmigung aufgelöst wird.

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
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` steuert den direkten Chat-Zugriff:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    `allowFrom` ist eine Zugriffskontrollliste für DM-Absender. Sie sperrt keine expliziten ausgehenden Sends an WhatsApp-Gruppen-JIDs oder `@newsletter`-Kanal-JIDs.

    Mehrkonto-Override: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben Vorrang vor Standardeinstellungen auf Kanalebene für dieses Konto.

    Details zum Runtime-Verhalten:

    - Pairings werden im Kanal-Allow-Store persistiert und mit konfiguriertem `allowFrom` zusammengeführt
    - geplante Automatisierung und Heartbeat-Empfänger-Fallback verwenden explizite Zustellziele oder konfiguriertes `allowFrom`; DM-Pairing-Genehmigungen sind keine impliziten Cron- oder Heartbeat-Empfänger
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw paart ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Group policy + allowlists">
    Gruppenzugriff hat zwei Ebenen:

    1. **Gruppenmitgliedschaft-Allowlist** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen zulässig
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Gruppenabsender-Richtlinie** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback der Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Runtime auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor Mention-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block existiert, ist der Runtime-Fallback für Gruppenrichtlinien `allowlist` (mit Warn-Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Mentions + /activation">
    Gruppenantworten erfordern standardmäßig eine Mention.

    Mention-Erkennung umfasst:

    - explizite WhatsApp-Mentions der Bot-Identität
    - konfigurierte Mention-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Sprachnotiz-Transkripte für autorisierte Gruppennachrichten
    - implizite Antwort-auf-Bot-Erkennung (Antwortabsender entspricht Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Mention-Gating; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden nicht allowlistete Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines allowlisteten Benutzers antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist Owner-gated.

  </Tab>
</Tabs>

## Konfigurierte ACP-Bindings

WhatsApp unterstützt persistente ACP-Bindings mit `bindings[]`-Einträgen auf oberster Ebene:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Direkte Chats entsprechen E.164-Nummern wie `+15555550123`.
- Gruppen entsprechen WhatsApp-Gruppen-JIDs wie `120363424282127706@g.us`.
- Gruppen-Zulassungslisten, Absenderrichtlinie und Erwähnungs- oder Aktivierungs-Gating werden ausgeführt, bevor OpenClaw sicherstellt, dass die konfigurierte ACP-Sitzung existiert.
- Eine übereinstimmende konfigurierte ACP-Bindung besitzt die Route. WhatsApp-Broadcast-Gruppen verteilen diesen Turn nicht an gewöhnliche WhatsApp-Sitzungen.

## Verhalten bei persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbstchat-Schutzmaßnahmen aktiviert:

- Lesebestätigungen für Selbstchat-Turns überspringen
- Verhalten zum automatischen Auslösen durch Erwähnungs-JID ignorieren, das Sie sonst selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbstchat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort existiert, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwort-Metadatenfelder werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).
    Wenn das Ziel der zitierten Antwort herunterladbare Medien sind, speichert OpenClaw sie über
    den normalen Speicher für eingehende Medien und stellt sie als `MediaPath`/`MediaType` bereit, damit
    der Agent das referenzierte Bild prüfen kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medien-Platzhalter und Standort-/Kontaktextraktion">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppen-Sprachnachrichten werden vor dem Erwähnungs-Gating transkribiert, wenn der
    Inhalt nur `<media:audio>` ist, sodass das Nennen der Bot-Erwähnung in der Sprachnachricht
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird
    das Transkript im ausstehenden Gruppenverlauf behalten statt des rohen Platzhalters.

    Standortinhalte verwenden knappen Koordinatentext. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Einfügen ausstehender Gruppenhistorie">
    Bei Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügemarkierungen:

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

    Selbstchat-Turns überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - Standardlimit für Abschnitte: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - Der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnachricht) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-talk-Sprachnachricht rendern
    - Antwort-Payloads bewahren `audioAsVoice`; TTS-Sprachnachrichtausgabe für WhatsApp bleibt auf diesem PTT-Pfad, auch wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird für Sprachnachrichtkompatibilität als `audio/ogg; codecs=opus` gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3-/WebM-Ausgabe, wird vor der PTT-Zustellung mit `ffmpeg` in 48-kHz-Mono-Ogg/Opus transkodiert
    - `/tts latest` sendet die neueste Assistant-Antwort als eine Sprachnachricht und unterdrückt wiederholtes Senden für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sends unterstützt
    - `forceDocument` / `asDocument` sendet ausgehende Bilder, GIFs und Videos über den Baileys-Dokument-Payload, um WhatsApp-Medienkomprimierung zu vermeiden, während der aufgelöste Dateiname und MIME-Typ erhalten bleiben
    - Beschriftungen werden beim Senden von Multi-Media-Antwort-Payloads auf das erste Medienelement angewendet, außer PTT-Sprachnachrichten senden zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnachricht-Beschriftungen nicht konsistent rendern
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherlimit für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um Limits einzuhalten, außer `forceDocument` / `asDocument` fordert Dokumentzustellung an
    - bei Fehlern beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitierung

WhatsApp unterstützt native Antwortzitierung, bei der ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                            |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                           |
| `"first"`   | Nur den ersten ausgehenden Antwortabschnitt zitieren                   |
| `"all"`     | Jeden ausgehenden Antwortabschnitt zitieren                           |
| `"batched"` | In die Warteschlange gestellte gebündelte Antworten zitieren, während sofortige Antworten unzitiert bleiben |

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

| Stufe         | Bestätigungsreaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                           |
| ------------- | ---------------------- | -------------------------------- | ------------------------------------------------------ |
| `"off"`       | Nein                   | Nein                             | Keine Reaktionen                                       |
| `"ack"`       | Ja                     | Nein                             | Nur Bestätigungsreaktionen (Empfang vor Antwort)       |
| `"minimal"`   | Ja                     | Ja (konservativ)                 | Bestätigung + Agent-Reaktionen mit konservativer Anleitung |
| `"extensive"` | Ja                     | Ja (empfohlen)                   | Bestätigung + Agent-Reaktionen mit empfohlener Anleitung |

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
Bestätigungsreaktionen werden durch `reactionLevel` gegatet — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

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

- wird sofort gesendet, nachdem eingehender Inhalt akzeptiert wurde (vor der Antwort)
- wenn `ackReaction` ohne `emoji` vorhanden ist, verwendet WhatsApp das Identitäts-Emoji des gerouteten Agents und fällt auf "👀" zurück; lassen Sie `ackReaction` weg oder setzen Sie `emoji: ""`, um keine Bestätigungsreaktion zu senden
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Turns; Gruppenaktivierung `always` wirkt als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das Legacy-`messages.ackReaction` wird hier nicht verwendet)

## Lebenszyklus-Statusreaktionen

Setzen Sie `messages.statusReactions.enabled: true`, damit WhatsApp die Bestätigungsreaktion während eines Turns ersetzt, statt ein statisches Empfangs-Emoji stehen zu lassen. Wenn aktiviert, verwendet OpenClaw denselben Reaktionsslot der eingehenden Nachricht für Lebenszykluszustände wie in Warteschlange, Denken, Tool-Aktivität, Compaction, erledigt und Fehler.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Verhaltenshinweise:

- `channels.whatsapp.ackReaction` steuert weiterhin, ob Statusreaktionen für Direktnachrichten und Gruppen zulässig sind.
- Die Statusreaktion für die Warteschlange verwendet dasselbe wirksame Bestätigungs-Emoji wie einfache Bestätigungsreaktionen.
- WhatsApp hat einen Bot-Reaktionsslot pro Nachricht, daher ersetzen Lebenszyklusaktualisierungen die aktuelle Reaktion direkt.
- `messages.removeAckAfterReply: true` löscht die finale Statusreaktion nach der konfigurierten Haltezeit für erledigt/Fehler.
- Tool-Emoji-Kategorien umfassen `tool`, `coding`, `web`, `deploy`, `build` und `concierge`.

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
    - Legacy-Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt die Abmeldung zuerst den laufenden WhatsApp-Listener für das ausgewählte Konto, damit die verknüpfte Sitzung bis zum nächsten Neustart keine Nachrichten weiter empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den laufenden Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

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
    Symptom: Kanalstatus meldet nicht verknüpft.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Stille Konten können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog
    startet neu, wenn die WhatsApp-Web-Transportaktivität stoppt, der Socket geschlossen wird oder
    Aktivität auf Anwendungsebene über das längere Sicherheitsfenster hinaus still bleibt.

    Wenn Logs wiederholt `status=408 Request Time-out Connection was lost` zeigen, passen Sie
    die Baileys-Socket-Zeiten unter `web.whatsapp` an. Beginnen Sie damit,
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

    Behebung:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Wenn die Schleife nach der Behebung von Host-Konnektivität und Timing weiter besteht,
    sichern Sie das Authentifizierungsverzeichnis des Kontos und verknüpfen Sie dieses Konto erneut:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldet, aber
    `openclaw gateway status` und `openclaw channels status --probe` zeigen, dass das
    Gateway und WhatsApp fehlerfrei sind, führen Sie `openclaw doctor` aus. Unter Linux
    warnt doctor vor alten Crontab-Einträgen, die weiterhin
    `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese veralteten Einträge mit
    `crontab -e`, weil cron die systemd-User-Bus-Umgebung fehlen kann und
    dieses alte Skript dadurch den Gateway-Zustand falsch meldet.

    Verknüpfen Sie bei Bedarf mit `channels login` erneut.

  </Accordion>

  <Accordion title="QR-Anmeldung läuft hinter einem Proxy ab">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung.

    Die WhatsApp-Web-Anmeldung verwendet die standardmäßige Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebungsvariablen übernimmt und ob `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen schnell fehl, wenn kein aktiver Gateway-Listener für das Zielkonto existiert.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen erfassen, was der Agent generiert hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw betrachtet eine automatische Antwort erst dann als gesendet, nachdem Baileys eine ausgehende Nachrichten-ID für mindestens einen sichtbaren Text- oder Medienversand zurückgegeben hat.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie die Gateway-Logs auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, behalten Sie daher pro Scope nur ein einzelnes `groupPolicy`

    Wenn `channels.whatsapp.groups` vorhanden ist, kann WhatsApp weiterhin Nachrichten aus anderen Gruppen beobachten, aber OpenClaw verwirft sie vor dem Session-Routing. Fügen Sie die Gruppen-JID zu `channels.whatsapp.groups` hinzu oder fügen Sie `groups["*"]` hinzu, um alle Gruppen zuzulassen, während die Absenderautorisierung unter `groupPolicy` und `groupAllowFrom` bleibt.

  </Accordion>

  <Accordion title="Bun-Runtime-Warnung">
    Die WhatsApp-Gateway-Runtime sollte Node verwenden. Bun wird für den stabilen WhatsApp/Telegram-Gateway-Betrieb als inkompatibel markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt Telegram-ähnliche System-Prompts für Gruppen und direkte Chats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt sie die Root-`groups`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft anschließend auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Wildcard-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt sie die Root-`direct`-Map vollständig (kein Deep Merge). Die Prompt-Suche läuft anschließend auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map existiert **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Wildcard unterdrückt und kein System-Prompt angewendet.
2. **Direkt-Wildcard-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er existiert, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der leichtgewichtige Bucket für Verlaufsüberschreibungen pro DM (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

**Unterschied zum Telegram-Mehrkontenverhalten:** In Telegram wird Root-`groups` für alle Konten in einer Mehrkonteneinrichtung absichtlich unterdrückt, auch für Konten, die keine eigenen `groups` definieren, um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzmaßnahme nicht an: Root-`groups` und Root-`direct` werden immer von Konten geerbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer WhatsApp-Mehrkonteneinrichtung gruppen- oder direktbezogene Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Defaults auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Allowlist für Gruppen auf Chat-Ebene. Im Root- oder Konto-Scope bedeutet `groups["*"]`, dass für diesen Scope „alle Gruppen zugelassen sind“.
- Fügen Sie einen Wildcard-Gruppen-`systemPrompt` nur hinzu, wenn Sie bereits möchten, dass dieser Scope alle Gruppen zulässt. Wenn weiterhin nur eine feste Gruppe von Gruppen-IDs berechtigt sein soll, verwenden Sie `groups["*"]` nicht für den Prompt-Default. Wiederholen Sie den Prompt stattdessen auf jedem explizit in der Allowlist stehenden Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber für sich genommen nicht jeden Absender in diesen Gruppen. Der Absenderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht dieselbe Nebenwirkung für DMs. `direct["*"]` stellt nur eine Default-Konfiguration für direkte Chats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Pairing-Store-Regeln zugelassen wurde.

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
- Mehrkontenbetrieb: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- Session-Verhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandte Themen

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Channel-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
