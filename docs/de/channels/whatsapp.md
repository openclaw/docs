---
read_when:
    - Arbeiten am Verhalten von WhatsApp-/Web-Kanälen oder am Inbox-Routing
summary: Unterstützung für den WhatsApp-Kanal, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern zur Installation des WhatsApp-Plugin auf, wenn Sie es zum ersten Mal auswählen.
- `openclaw channels login --channel whatsapp` bietet ebenfalls den Installationsablauf an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: verwendet das npm-Paket `@openclaw/whatsapp` auf dem aktuellen offiziellen
  Release-Tag.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Verwenden Sie das reine Paket, um dem aktuellen offiziellen Release-Tag zu folgen. Pinnen Sie eine exakte
Version nur, wenn Sie eine reproduzierbare Installation benötigen.

Unter Windows benötigt das WhatsApp-Plugin während der npm-Installation Git in `PATH`, weil
eine seiner Baileys/libsignal-Abhängigkeiten von einer Git-URL abgerufen wird. Installieren Sie
Git for Windows, starten Sie dann die Shell neu und führen Sie die Installation erneut aus:

```powershell
winget install --id Git.Git -e
```

Portable Git funktioniert ebenfalls, wenn dessen `bin`-Verzeichnis in `PATH` liegt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie ist Kopplung für unbekannte Absender.
  </Card>
  <Card title="Channel-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Channel-Konfigurationsmuster und Beispiele.
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

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Auth-Verzeichnis anzuhängen:

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

    Kopplungsanfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Channel begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer auszuführen. (Die Channel-Metadaten und der Einrichtungsablauf sind für diese Einrichtung optimiert, aber Einrichtungen mit persönlichen Nummern werden ebenfalls unterstützt.)
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
    Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbst-chat-freundliche Basis:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Channel-Bereich nur für WhatsApp Web">
    Der Messaging-Plattform-Channel basiert in der aktuellen OpenClaw-Channel-Architektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Channel in der integrierten Chat-Channel-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Der Wiederverbindungs-Watchdog verwendet WhatsApp-Web-Transportaktivität, nicht nur eingehendes App-Nachrichtenvolumen, sodass eine ruhige verknüpfte Gerätesitzung nicht allein deshalb neu gestartet wird, weil kürzlich niemand eine Nachricht gesendet hat. Eine längere Grenze für Anwendungsschweigen erzwingt weiterhin eine Wiederverbindung, wenn weiterhin Transport-Frames eintreffen, aber im Watchdog-Fenster keine Anwendungsnachrichten verarbeitet werden; nach einer vorübergehenden Wiederverbindung für eine kürzlich aktive Sitzung verwendet diese Prüfung auf Anwendungsschweigen für das erste Wiederherstellungsfenster das normale Nachrichten-Timeout.
- Baileys-Socket-Zeitwerte sind unter `web.whatsapp.*` explizit: `keepAliveIntervalMs` steuert WhatsApp-Web-Anwendungspings, `connectTimeoutMs` steuert das Timeout des öffnenden Handshakes, und `defaultQueryTimeoutMs` steuert Baileys-Abfrage-Timeouts.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Gruppensendungen hängen native Erwähnungsmetadaten für `@+<digits>`- und `@<digits>`-Tokens in Text und Medienbeschriftungen an, wenn das Token mit aktuellen WhatsApp-Teilnehmermetadaten übereinstimmt, einschließlich LID-gestützter Gruppen.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Der Wiederverbindungs-Watchdog folgt der WhatsApp-Web-Transportaktivität, nicht nur eingehendem App-Nachrichtenvolumen: ruhige verknüpfte Gerätesitzungen bleiben aktiv, während Transport-Frames weiterlaufen, aber ein Transport-Stillstand erzwingt eine Wiederverbindung deutlich vor dem späteren Remote-Disconnect-Pfad.
- Direkt-Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` führt DMs in der Hauptsitzung des Agenten zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters können explizite ausgehende Ziele mit ihrer nativen `@newsletter`-JID sein. Ausgehende Newsletter-Sendungen verwenden Channel-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) statt DM-Sitzungssemantik.
- Der WhatsApp-Web-Transport beachtet Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinschreibung). Bevorzugen Sie Proxy-Konfiguration auf Host-Ebene gegenüber Channel-spezifischen WhatsApp-Proxy-Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die WhatsApp-Ack-Reaktion, nachdem eine sichtbare Antwort zugestellt wurde.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Nachrichteninhalte, Telefonnummern,
Gruppenkennungen, Absendernamen und Sitzungs-Korrelationsfelder enthalten. Aus diesem Grund
sendet WhatsApp eingehende `message_received`-Hook-Payloads nicht an Plugins,
sofern Sie sich nicht ausdrücklich dafür entscheiden:

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
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf Direkt-Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    `allowFrom` ist eine Zugriffskontrollliste für DM-Absender. Sie begrenzt keine expliziten ausgehenden Sendungen an WhatsApp-Gruppen-JIDs oder `@newsletter`-Channel-JIDs.

    Mehrkonto-Überschreibung: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben Vorrang vor Standardwerten auf Channel-Ebene für dieses Konto.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im Channel-Allow-Store gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
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
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, fällt die Laufzeit auf `allowFrom` zurück, wenn verfügbar
    - Absender-Allowlists werden vor Erwähnungs-/Antwortaktivierung ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block existiert, ist der Laufzeit-Fallback für die Gruppenrichtlinie `allowlist` (mit Warn-Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - eingehende Voice-Note-Transkripte für autorisierte Gruppennachrichten
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender stimmt mit Bot-Identität überein)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur das Mention-Gating; es gewährt **keine** Absenderautorisierung
    - mit `groupPolicy: "allowlist"` werden nicht in der Allowlist enthaltene Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines in der Allowlist enthaltenen Benutzers antworten

    Aktivierungsbefehl auf Sitzungsebene:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Er ist inhaberbeschränkt.

  </Tab>
</Tabs>

## Verhalten bei persönlicher Nummer und Selbst-Chat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Selbst-Chat-Schutzmechanismen aktiviert:

- Lesebestätigungen für Selbst-Chat-Durchläufe überspringen
- Mention-JID-Auto-Trigger-Verhalten ignorieren, das sonst Sie selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

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
    Wenn das zitierte Antwortziel herunterladbare Medien sind, speichert OpenClaw diese über
    den normalen eingehenden Medienspeicher und stellt sie als `MediaPath`/`MediaType` bereit, damit
    der Agent das referenzierte Bild prüfen kann, statt nur
    `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medien-Platzhalter und Standort-/Kontaktextraktion">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern normalisiert, zum Beispiel:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Autorisierte Gruppen-Voice-Notes werden vor dem Mention-Gating transkribiert, wenn der
    Inhalt nur `<media:audio>` ist, sodass das Aussprechen der Bot-Erwähnung in der Voice-Note
    die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, wird das
    Transkript im ausstehenden Gruppenverlauf statt des rohen Platzhalters aufbewahrt.

    Standortinhalte verwenden knappen Koordinatentext. Standortlabels/-kommentare und Kontakt-/vCard-Details werden als eingezäunte nicht vertrauenswürdige Metadaten gerendert, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Ausstehende Gruppenverlauf-Injektion">
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

    Kontospezifische Überschreibung:

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

    Bei Chat-Runden mit sich selbst werden Lesebestätigungen übersprungen, auch wenn sie global aktiviert sind.

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
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnachricht) und Dokument-Payloads
    - Audiomedien werden über den Baileys-`audio`-Payload mit `ptt: true` gesendet, sodass WhatsApp-Clients sie als Push-to-talk-Sprachnachricht darstellen
    - Antwort-Payloads behalten `audioAsVoice` bei; die TTS-Sprachnachrichtenausgabe für WhatsApp bleibt auf diesem PTT-Pfad, auch wenn der Provider MP3 oder WebM zurückgibt
    - natives Ogg/Opus-Audio wird zur Kompatibilität mit Sprachnachrichten als `audio/ogg; codecs=opus` gesendet
    - Nicht-Ogg-Audio, einschließlich Microsoft Edge TTS-MP3/WebM-Ausgabe, wird vor der PTT-Zustellung mit `ffmpeg` in 48 kHz Mono Ogg/Opus transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnachricht und unterdrückt wiederholtes Senden für dieselbe Antwort; `/tts chat on|off|default` steuert Auto-TTS für den aktuellen WhatsApp-Chat
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Beschriftungen werden beim Senden von Multi-Media-Antwort-Payloads auf das erste Medienelement angewendet; PTT-Sprachnachrichten senden jedoch zuerst das Audio und sichtbaren Text separat, weil WhatsApp-Clients Sprachnachrichten-Beschriftungen nicht konsistent darstellen
    - Medienquellen können HTTP(S), `file://` oder lokale Pfade sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherlimit für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - kontospezifische Überschreibungen verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größe/Qualitätssuche), um die Limits einzuhalten
    - bei Fehlern beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt native Antwortzitate, bei denen ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Wert        | Verhalten                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nie zitieren; als einfache Nachricht senden                           |
| `"first"`   | Nur den ersten ausgehenden Antwort-Chunk zitieren                      |
| `"all"`     | Jeden ausgehenden Antwort-Chunk zitieren                               |
| `"batched"` | In die Warteschlange gestellte gebündelte Antworten zitieren, während sofortige Antworten unzitiert bleiben |

Standardwert ist `"off"`. Kontospezifische Überschreibungen verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Stufe         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                    |
| ------------- | ---------------------- | --------------------------------- | ----------------------------------------------- |
| `"off"`       | Nein                   | Nein                              | Keine Reaktionen                                |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (Empfangsbestätigung vor der Antwort) |
| `"minimal"`   | Ja                     | Ja (konservativ)                  | Bestätigungs- und Agentenreaktionen mit konservativer Vorgabe |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigungs- und Agentenreaktionen mit empfohlener Vorgabe |

Standardwert: `"minimal"`.

Kontospezifische Überschreibungen verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

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

Verhaltenshinweise:

- wird sofort gesendet, nachdem die eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- der Gruppenmodus `mentions` reagiert bei durch Erwähnungen ausgelösten Runden; die Gruppenaktivierung `always` dient als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das Legacy-`messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standardkontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert

  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - Legacy-Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Flows weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    Wenn ein Gateway erreichbar ist, stoppt die Abmeldung zuerst den live laufenden WhatsApp-Listener für das ausgewählte Konto, damit die verknüpfte Sitzung bis zum nächsten Neustart keine Nachrichten weiter empfängt. `openclaw channels remove --channel whatsapp` stoppt ebenfalls den live laufenden Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Agenten-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet, dass keine Verknüpfung besteht.

    Lösung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: Verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Konten ohne Aktivität können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog
    startet neu, wenn die WhatsApp Web-Transportaktivität stoppt, der Socket geschlossen wird oder
    die Aktivität auf Anwendungsebene über das längere Sicherheitsfenster hinaus still bleibt.

    Wenn Logs wiederholt `status=408 Request Time-out Connection was lost` zeigen, passen Sie
    die Baileys-Socket-Timings unter `web.whatsapp` an. Beginnen Sie damit,
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
    dieses alte Skript dadurch den Gateway-Zustand falsch meldet.

    Falls nötig, verknüpfen Sie mit `channels login` erneut.

  </Accordion>

  <Accordion title="Timeout bei der QR-Anmeldung hinter einem Proxy">
    Symptom: `openclaw channels login --channel whatsapp` schlägt fehl, bevor ein nutzbarer QR-Code angezeigt wird, mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung.

    Die WhatsApp Web-Anmeldung verwendet die standardmäßige Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinschreibung und `NO_PROXY`). Prüfen Sie, ob der Gateway-Prozess die Proxy-Umgebung erbt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` passt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendevorgänge schlagen schnell fehl, wenn kein aktiver Gateway-Listener für das Zielkonto vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent generiert hat. Die WhatsApp-Zustellung wird separat geprüft: OpenClaw behandelt eine automatische Antwort erst dann als gesendet, wenn Baileys für mindestens einen sichtbaren Text- oder Mediensendevorgang eine ID einer ausgehenden Nachricht zurückgibt.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort. Eine erfolgreiche Reaktion beweist nicht, dass die spätere Text- oder Medienantwort von WhatsApp akzeptiert wurde.

    Prüfen Sie die Gateway-Logs auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungs-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, behalten Sie daher pro Geltungsbereich nur ein einzelnes `groupPolicy` bei

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Runtime sollte Node verwenden. Bun wird für den stabilen WhatsApp/Telegram-Gateway-Betrieb als inkompatibel gekennzeichnet.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und direkte Chats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Zuerst wird die effektive `groups`-Map bestimmt: Wenn das Konto eine eigene `groups` definiert, ersetzt sie die Root-`groups`-Map vollständig (keine tiefe Zusammenführung). Die Prompt-Suche läuft anschließend auf der daraus resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenfolge (`""`) ist, wird der Platzhalter unterdrückt und kein System-Prompt angewendet.
2. **Gruppen-Platzhalter-System-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag in der Map gar nicht vorhanden ist oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

Auflösungshierarchie für direkte Nachrichten:

Zuerst wird die effektive `direct`-Map bestimmt: Wenn das Konto eine eigene `direct` definiert, ersetzt sie die Root-`direct`-Map vollständig (keine tiefe Zusammenführung). Die Prompt-Suche läuft anschließend auf der daraus resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vorhanden ist **und** sein Schlüssel `systemPrompt` definiert ist. Wenn `systemPrompt` eine leere Zeichenkette (`""`) ist, wird der Platzhalter unterdrückt und kein System-Prompt angewendet.
2. **Direkter Platzhalter-System-Prompt** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag in der Map vollständig fehlt oder wenn er vorhanden ist, aber keinen Schlüssel `systemPrompt` definiert.

<Note>
`dms` bleibt der schlanke Override-Bucket für den Verlauf pro DM (`dms.<id>.historyLimit`). Prompt-Overrides befinden sich unter `direct`.
</Note>

**Unterschied zum Telegram-Verhalten mit mehreren Konten:** In Telegram wird `groups` auf Root-Ebene in einer Multi-Konto-Konfiguration absichtlich für alle Konten unterdrückt, auch für Konten, die keine eigenen `groups` definieren, um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzmaßnahme nicht an: `groups` und `direct` auf Root-Ebene werden immer von Konten geerbt, die keinen Override auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einer WhatsApp-Konfiguration mit mehreren Konten Gruppen- oder Direkt-Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, statt sich auf Defaults auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Allowlist für Gruppen auf Chat-Ebene. Im Root- oder Kontobereich bedeutet `groups["*"]`, dass „alle Gruppen zugelassen werden“.
- Fügen Sie einen Platzhalter-Gruppen-`systemPrompt` nur hinzu, wenn Sie bereits möchten, dass dieser Bereich alle Gruppen zulässt. Wenn weiterhin nur eine feste Menge von Gruppen-IDs berechtigt sein soll, verwenden Sie `groups["*"]` nicht als Prompt-Default. Wiederholen Sie den Prompt stattdessen auf jedem explizit zugelassenen Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht automatisch jeden Absender in diesen Gruppen. Der Absenderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht dieselbe Nebenwirkung für DMs. `direct["*"]` stellt nur eine Standardkonfiguration für Direkt-Chats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Pairing-Store-Regeln zugelassen wurde.

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
- mehrere Konten: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Overrides auf Kontoebene
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
