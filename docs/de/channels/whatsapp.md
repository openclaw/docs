---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Posteingangs-Routing
summary: Unterstützung für den WhatsApp-Kanal, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T01:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsreif über WhatsApp Web (Baileys). Der Gateway verwaltet die verknüpfte(n) Sitzung(en); es gibt keinen separaten Twilio-WhatsApp-Kanal.

## Installation

`openclaw onboard` und `openclaw channels add --channel whatsapp` fordern Sie bei der ersten Auswahl zur Installation des Plugins auf; `openclaw channels login --channel whatsapp` bietet denselben Installationsablauf an, wenn das Plugin fehlt. Entwicklungs-Checkouts verwenden den lokalen Plugin-Pfad; stabile/Beta-Installationen installieren zuerst `@openclaw/whatsapp` aus ClawHub und greifen ersatzweise auf npm zurück. Die WhatsApp-Laufzeit wird außerhalb des zentralen OpenClaw-npm-Pakets ausgeliefert, sodass ihre Laufzeitabhängigkeiten beim externen Plugin verbleiben. Manuelle Installation:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Verwenden Sie das reine npm-Paket (`@openclaw/whatsapp`) nur als Registry-Ausweichlösung; fixieren Sie eine exakte Version nur für eine reproduzierbare Installation.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie für unbekannte Absender ist die Kopplung.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="Zugriffsrichtlinie konfigurieren">

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

  <Step title="WhatsApp verknüpfen (QR-Code)">

```bash
openclaw channels login --channel whatsapp
```

    Die Anmeldung erfolgt ausschließlich per QR-Code. Stellen Sie auf entfernten oder monitorlosen Hosts vor Beginn der Anmeldung sicher, dass der aktuelle QR-Code zuverlässig an das Telefon übermittelt werden kann; im Terminal dargestellte QR-Codes, Screenshots oder Chat-Anhänge können während der Übertragung ablaufen.

    Für ein bestimmtes Konto:

```bash
openclaw channels login --channel whatsapp --account work
```

    So binden Sie vor der Anmeldung ein vorhandenes/benutzerdefiniertes Authentifizierungsverzeichnis ein:

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

  <Step title="Erste Kopplungsanfrage genehmigen (Kopplungsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Kopplungsanfragen laufen nach einer Stunde ab; pro Konto sind höchstens drei ausstehende Anfragen zulässig.

  </Step>
</Steps>

<Note>
Eine separate WhatsApp-Nummer wird empfohlen (Einrichtung und Metadaten sind dafür optimiert), Konfigurationen mit persönlicher Nummer/Selbstchat werden jedoch vollständig unterstützt.
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Zulassungslisten und Routing-Grenzen
    - geringeres Risiko von Verwechslungen beim Selbstchat

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

  <Accordion title="Ausweichlösung mit persönlicher Nummer">
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine für Selbstchats geeignete Basiskonfiguration: `dmPolicy: "allowlist"`, `allowFrom` einschließlich Ihrer eigenen Nummer, `selfChatMode: true`. Die Laufzeitschutzmaßnahmen für Selbstchats basieren auf der verknüpften eigenen Nummer und `allowFrom`.
  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Der Gateway verwaltet den WhatsApp-Socket und die Schleife für erneute Verbindungen.
- Ein Watchdog überwacht unabhängig voneinander zwei Signale: die rohe WhatsApp-Web-Transportaktivität und die Aktivität von Anwendungsnachrichten. Eine ruhige, aber verbundene Sitzung wird nicht allein deshalb neu gestartet, weil kürzlich keine Nachricht eingegangen ist; eine erneute Verbindung wird nur erzwungen, wenn für ein festes internes Zeitfenster (nicht benutzerkonfigurierbar) keine Transport-Frames mehr eingehen oder Anwendungsnachrichten länger als das Vierfache des normalen Nachrichten-Timeouts ausbleiben. Direkt nach einer erneuten Verbindung einer kürzlich aktiven Sitzung verwendet dieses erste Zeitfenster anstelle des vierfachen Zeitfensters den kürzeren normalen Nachrichten-Timeout. OpenClaw kann automatisch auf Offline-Nachrichten antworten, die Baileys während dieser erneuten Verbindung frühzeitig zustellt, begrenzt durch die Lebensdauer der Deduplizierung eingehender Nachrichten-IDs; beim ersten Start bleibt der kurze Schutz vor veraltetem Verlauf aktiv.
- Die Socket-Zeitvorgaben von Baileys werden explizit unter `web.whatsapp.*` festgelegt: `keepAliveIntervalMs` (Intervall für Anwendungs-Pings), `connectTimeoutMs` (Timeout für den Verbindungsaufbau), `defaultQueryTimeoutMs` (Wartezeiten für Baileys-Abfragen sowie OpenClaws Timeouts für ausgehendes Senden/Präsenz und eingehende Lesebestätigungen).
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto; andernfalls schlagen sie sofort fehl.
- Gruppensendungen fügen native Erwähnungsmetadaten für Tokens im Format `@+<digits>` und `@<digits>` hinzu (in Texten und Medienbeschriftungen), wenn das Token mit den aktuellen Teilnehmermetadaten übereinstimmt; dies gilt auch für LID-basierte Gruppen.
- Status- und Broadcast-Chats (`@status`, `@broadcast`) werden ignoriert.
- Direktchats verwenden die DM-Sitzungsregeln (`session.dmScope`; der Standardwert `main` fasst DMs in der Hauptsitzung des Agenten zusammen). Gruppensitzungen sind pro JID isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-Kanäle/Newsletter können über ihre native `@newsletter`-JID explizite ausgehende Ziele sein und verwenden Kanal-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) anstelle der DM-Semantik.
- Der WhatsApp-Web-Transport berücksichtigt die standardmäßigen Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` sowie Varianten in Kleinschreibung). Bevorzugen Sie die Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die Bestätigungsreaktion, sobald eine sichtbare Antwort zugestellt wurde.

## Aktuell anfragende Person mit MeowCaller anrufen (experimentell)

Das Plugin kann `whatsapp_call` in von WhatsApp ausgehenden Agenteninteraktionen bereitstellen. Es verwendet [MeowCaller](https://github.com/purpshell/meowcaller), um einen WhatsApp-Sprachanruf an die aktuell autorisierte anfragende Person zu tätigen und nach der Annahme eine OpenClaw-TTS-Nachricht abzuspielen. Das Werkzeug besitzt keinen Parameter für die Zielnummer, sodass eine Eingabeaufforderung den Anruf nicht umleiten kann. Standardmäßig deaktiviert.

<Warning>
MeowCaller ist experimentell, besitzt keine versionierte Veröffentlichung und verwendet eine separat gekoppelte whatsmeow-Sitzung für verknüpfte Geräte – die Baileys-Anmeldedaten des Plugins können nicht wiederverwendet werden. Durch die Kopplung wird demselben WhatsApp-Konto ein weiteres verknüpftes Gerät hinzugefügt; scannen Sie den Code mit der von OpenClaw verwendeten Identität. Im Modus mit persönlicher Nummer/Selbstchat sind keine Anrufe an die eigene Nummer möglich; verwenden Sie eine dedizierte OpenClaw-Nummer, um Ihre persönliche Nummer anzurufen.
</Warning>

<Steps>
  <Step title="Experimentelle Anrufe aktivieren">

    Fügen Sie der WhatsApp-Kanalkonfiguration `actions.calls: true` hinzu und starten Sie den Gateway neu:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Wenn die Einstellung fehlt oder `false` ist, stellt OpenClaw das Werkzeug `whatsapp_call` nicht bereit.

  </Step>

  <Step title="Geprüfte MeowCaller-CLI installieren">

    Der Adapter erwartet eine ausführbare Datei namens `meowcaller` im `PATH` des Gateway-Hosts. Bis [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) zusammengeführt wird, erstellen Sie den geprüften Branch:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Stellen Sie sicher, dass `$HOME/.local/bin` im `PATH` des Gateway-Dienstes enthalten ist. Diese Revision verfügt über explizite Befehle `pair` und `notify`, wobei `notify` ausschließlich sendet und weder Mikrofon noch Lautsprecher, Videogerät oder Diagnoseaufzeichnung öffnet. Verwenden Sie nicht ersatzweise den Befehl `play` der beispielhaften Upstream-CLI.

  </Step>

  <Step title="Verknüpftes MeowCaller-Gerät koppeln">

    Bitten Sie den WhatsApp-Agenten, die Anrufeinrichtung zu prüfen (die Statusaktion von `whatsapp_call` meldet das kontospezifische Zustandsverzeichnis und den Kopplungsbefehl). Für das Standardkonto:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Führen Sie dies interaktiv aus, scannen Sie den QR-Code unter **WhatsApp > Linked devices** und warten Sie auf `MeowCaller linked device ready`. Halten Sie `wa-voip.db` geheim – dies ist die MeowCaller-Sitzung. Konten, die nicht das Standardkonto sind, erhalten über die Statusaktion einen eigenen Speicherpfad; führen Sie unter Windows den zugehörigen PowerShell-Befehl aus.

  </Step>

  <Step title="TTS konfigurieren und über WhatsApp anrufen">

    Konfigurieren Sie einen telefoniefähigen [TTS-Provider](/de/tools/tts), starten Sie den Gateway neu und senden Sie dann beispielsweise die Anfrage `Ruf mich an und sage, dass der Build abgeschlossen ist.` Das Werkzeug ermittelt den Absender aus dem vertrauenswürdigen eingehenden Kontext, synthetisiert eine temporäre private WAV-Datei, führt MeowCaller für ein begrenztes Anruffenster aus und löscht anschließend die Audiodatei. OpenClaw übergibt den Speicher des Kontos explizit, wartet nach Annahme/Wiedergabe/Auflegen auf einen Exit-Status von null und behandelt einen Timeout oder einen von null abweichenden Exit-Status als fehlgeschlagenen Werkzeugaufruf.

  </Step>
</Steps>

Einschränkungen: nur ausgehende Eins-zu-eins-Audioanrufe, keine beliebigen Zielnummern, keine gemeinsame Authentifizierung mit der Chatverbindung, keine Selbstanrufe im Modus mit persönlicher Nummer/Selbstchat, synthetisiertes Audio auf 60 Sekunden begrenzt, keine Empfangsbestätigung für die Hörbarkeit auf dem Mobilgerät über den Abschluss von Annahme/Wiedergabe/Auflegen durch MeowCaller hinaus, und OpenClaw beendet den Begleitprozess nach einem begrenzten Zeitfenster von 115–175 Sekunden (einschließlich der Verbindungs-, Annahme-, Wiedergabe- und Beendigungsphasen von MeowCaller).

## Genehmigungsaufforderungen

WhatsApp kann Genehmigungsaufforderungen für Ausführungen und Plugins als `👍`/`👎`-Reaktionen darstellen, gesteuert durch die übergeordnete Konfiguration für die Weiterleitung von Genehmigungen:

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

`approvals.exec` und `approvals.plugin` sind unabhängig voneinander; die Aktivierung von WhatsApp als Kanal verknüpft lediglich den Transport und sendet nichts, sofern die entsprechende Genehmigungsfamilie nicht aktiviert und dorthin geroutet wird. Der Sitzungsmodus stellt native Emoji-Genehmigungen nur für Genehmigungen zu, die aus WhatsApp stammen. Der Zielmodus verwendet die gemeinsame Weiterleitungspipeline für explizite Ziele und erzeugt keine separate Verteilung an die DMs der Genehmigenden.

Für WhatsApp-Genehmigungsreaktionen müssen Genehmigende explizit in `allowFrom` (oder `"*"`) aufgeführt sein. `defaultTo` legt gewöhnliche Standardnachrichtenziele fest, keine Liste der Genehmigenden. Manuelle `/approve`-Befehle durchlaufen weiterhin den normalen WhatsApp-Pfad zur Absenderautorisierung, bevor die Genehmigung aufgelöst wird.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Inhalte, Telefonnummern, Gruppenkennungen, Absendernamen und Felder zur Sitzungskorrelation enthalten. WhatsApp überträgt Nutzdaten des eingehenden Hooks `message_received` nur dann an Plugins, wenn Sie dies ausdrücklich aktivieren:

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

Beschränken Sie die Aktivierung auf ein Konto unter `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Aktivieren Sie dies nur für Plugins, denen Sie eingehende WhatsApp-Inhalte und Kennungen anvertrauen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy`:

    | Wert | Verhalten |
    | --- | --- |
    | `pairing` (Standard) | Unbekannte Absender fordern eine Kopplung an; der Eigentümer genehmigt sie |
    | `allowlist` | Nur Absender aus `allowFrom` werden zugelassen |
    | `open` | Erfordert, dass `allowFrom` `"*"` enthält |
    | `disabled` | Alle DMs blockieren |

    `allowFrom` akzeptiert Nummern im E.164-Format (intern normalisiert). Es ist ausschließlich eine Zugriffskontrollliste für DM-Absender – explizite ausgehende Sendungen an Gruppen-JIDs oder `@newsletter`-Kanal-JIDs werden dadurch nicht eingeschränkt.

    Außerkraftsetzung bei mehreren Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `.allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Kanalebene.

    Hinweise zur Laufzeit:

    - Kopplungen bleiben im kanalbezogenen Zulässigkeitsspeicher erhalten und werden mit dem konfigurierten `allowFrom` zusammengeführt
    - geplante Automatisierungen und der Empfänger-Fallback für Heartbeat verwenden explizite Zustellziele oder das konfigurierte `allowFrom`; Genehmigungen von DM-Kopplungen gelten nicht implizit als Cron-/Heartbeat-Empfänger
    - wenn keine Zulassungsliste konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig zugelassen
    - OpenClaw koppelt ausgehende `fromMe`-DMs (Nachrichten, die Sie sich selbst vom verknüpften Gerät senden) niemals automatisch

  </Tab>

  <Tab title="Gruppenrichtlinie und Zulassungslisten">
    Der Gruppenzugriff umfasst zwei Ebenen:

    1. **Zulassungsliste für Gruppenmitgliedschaften** (`channels.whatsapp.groups`): Wenn `groups` ausgelassen wird, sind alle Gruppen zulässig; wenn es vorhanden ist, fungiert es als Gruppenzulassungsliste (`"*"` lässt alle zu).
    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` umgeht die Absenderzulassungsliste, `allowlist` erfordert eine Übereinstimmung mit `groupAllowFrom` (oder `*`), `disabled` blockiert alle eingehenden Gruppennachrichten.

    Wenn `groupAllowFrom` nicht gesetzt ist, greifen Absenderprüfungen auf `allowFrom` zurück, sofern es Einträge enthält. Absenderzulassungslisten werden vor der Aktivierung durch Erwähnung oder Antwort ausgewertet.

    Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, greift die Laufzeit auf `groupPolicy: "allowlist"` zurück (mit einem Warnprotokolleintrag), selbst wenn `channels.defaults.groupPolicy` auf einen anderen Wert gesetzt ist.

    <Note>
    Die Auflösung der Gruppenmitgliedschaft verfügt bei einem einzelnen Konto über ein Sicherheitsnetz: Wenn nur ein WhatsApp-Konto konfiguriert ist und dessen `accounts.<id>.groups` ein explizit leeres Objekt (`{}`) ist, wird dies als „nicht gesetzt“ behandelt und auf die übergeordnete Zuordnung `channels.whatsapp.groups` zurückgegriffen, anstatt unbemerkt jede Gruppe zu blockieren. Wenn mindestens zwei Konten konfiguriert sind, bleibt eine explizit leere Kontozuordnung leer und greift nicht auf den übergeordneten Wert zurück – dadurch kann ein Konto absichtlich alle Gruppen deaktivieren, ohne andere Konten zu beeinflussen.
    </Note>

  </Tab>

  <Tab title="Erwähnungen und /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung. Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte reguläre Ausdrücke für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback: `messages.groupChat.mentionPatterns`)
    - Transkripte eingehender Sprachnachrichten für autorisierte Gruppennachrichten
    - implizite Erkennung einer Antwort an den Bot (der Absender der beantworteten Nachricht stimmt mit der Bot-Identität überein)

    Sicherheit: Ein Zitat oder eine Antwort erfüllt lediglich die Erwähnungsanforderung – es gewährt **keine** Absenderautorisierung. Bei `groupPolicy: "allowlist"` bleiben Absender, die nicht auf der Zulassungsliste stehen, auch dann blockiert, wenn sie auf die Nachricht eines zugelassenen Benutzers antworten.

    Aktivierungsbefehl auf Sitzungsebene: `/activation mention` oder `/activation always`. Dadurch wird der Sitzungsstatus aktualisiert (nicht die globale Konfiguration); der Befehl ist Eigentümern vorbehalten.

  </Tab>
</Tabs>

## Konfigurierte ACP-Bindungen

WhatsApp unterstützt persistente ACP-Bindungen über das übergeordnete Array `bindings[]`:

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

Direktchats werden anhand von E.164-Nummern zugeordnet; Gruppen anhand von WhatsApp-Gruppen-JIDs. Gruppenzulassungslisten, Absenderrichtlinie und Aktivierungsanforderungen für Erwähnungen werden ausgeführt, bevor OpenClaw sicherstellt, dass die gebundene ACP-Sitzung vorhanden ist. Eine übereinstimmende Bindung übernimmt die Route – Broadcast-Gruppen verteilen diesen Durchlauf nicht an gewöhnliche WhatsApp-Sitzungen.

## Verhalten bei persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` enthalten ist, werden Schutzmaßnahmen für Selbstchats aktiviert: Lesebestätigungen werden bei Selbstchat-Durchläufen übersprungen, das automatische Auslösen durch Erwähnungs-JIDs, durch das Sie sich selbst benachrichtigen würden, wird ignoriert, und Antworten erhalten standardmäßig das Präfix `[{identity.name}]` (oder `[openclaw]`), wenn `messages.responsePrefix` nicht gesetzt ist.

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag und Antwortkontext">
    Eingehende Nachrichten werden in den gemeinsamen Eingangsnachrichten-Umschlag eingeschlossen. Bei einer zitierten Antwort wird Kontext in folgender Form angehängt:

    ```text
    [Antwort auf <sender> id:<stanzaId>]
    <zitierter Inhalt oder Medienplatzhalter>
    [/Antwort]
    ```

    Antwortmetadaten (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164) werden eingetragen, sofern verfügbar. Wenn das zitierte Ziel ein herunterladbares Medium ist, speichert OpenClaw es über den normalen Speicher für eingehende Medien und stellt `MediaPath`/`MediaType` bereit, damit der Agent es direkt untersuchen kann, anstatt nur `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort-/Kontaktdaten">
    Nachrichten, die ausschließlich Medien enthalten, werden zu Platzhaltern normalisiert: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Autorisierte Gruppensprachnachrichten werden vor der Erwähnungsprüfung transkribiert, wenn der Inhalt ausschließlich aus `<media:audio>` besteht. Dadurch kann eine in der Sprachnachricht ausgesprochene Bot-Erwähnung die Antwort auslösen. Wenn das Transkript den Bot weiterhin nicht erwähnt, verbleibt es anstelle des unverarbeiteten Platzhalters im Verlauf ausstehender Gruppennachrichten.

    Standortinhalte werden als knapper Koordinatentext dargestellt. Standortbezeichnungen/-kommentare sowie Kontakt-/vCard-Details werden als abgegrenzte, nicht vertrauenswürdige Metadaten und nicht als eingebetteter Prompt-Text dargestellt.

  </Accordion>

  <Accordion title="Einfügen des ausstehenden Gruppenverlaufs">
    Nicht verarbeitete Gruppennachrichten werden gepuffert und als Kontext eingefügt, sobald der Bot schließlich ausgelöst wird.

    - Standardgrenze: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`, Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert die Funktion

    Einfügungsmarkierungen: `[Chatnachrichten seit Ihrer letzten Antwort – als Kontext]` und `[Aktuelle Nachricht – antworten Sie darauf]`.

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Für akzeptierte eingehende Nachrichten standardmäßig aktiviert. Global deaktivieren:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Bei Selbstchat-Durchläufen werden Lesebestätigungen auch dann übersprungen, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - standardmäßige Abschnittsgrenze: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift anschließend auf eine längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Nutzlasten für Bilder, Videos, Audio (PTT-Sprachnachrichten) und Dokumente
    - Audio wird als Baileys-`audio`-Nutzlast mit `ptt: true` gesendet und als Push-to-Talk-Sprachnachricht dargestellt; `audioAsVoice` bleibt in Antwortnutzlasten erhalten, damit die Ausgabe von TTS-Sprachnachrichten unabhängig vom Quellformat des Providers diesen Pfad verwendet
    - natives Ogg-/Opus-Audio wird als `audio/ogg; codecs=opus` gesendet; alle anderen Formate (einschließlich der MP3-/WebM-Ausgabe von Microsoft Edge TTS) werden vor der PTT-Zustellung mit `ffmpeg` in ein einkanaliges Ogg-/Opus-Format mit 48 kHz transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als einzelne Sprachnachricht und unterdrückt wiederholtes Senden derselben Antwort; `/tts chat on|off|default` steuert automatisches TTS für den aktuellen Chat
    - `gifPlayback: true` bei gesendeten Videos aktiviert die Wiedergabe als animiertes GIF
    - `forceDocument`/`asDocument` leitet ausgehende Bilder, GIFs und Videos über die Baileys-Dokumentnutzlast, um die Medienkomprimierung von WhatsApp zu vermeiden und den ermittelten Dateinamen sowie MIME-Typ beizubehalten
    - Beschriftungen werden auf das erste Medienelement einer Antwort mit mehreren Medien angewendet, ausgenommen PTT-Sprachnachrichten: Das Audio wird zuerst ohne Beschriftung gesendet; anschließend wird die Beschriftung als separate Textnachricht gesendet (WhatsApp-Clients stellen Beschriftungen von Sprachnachrichten nicht konsistent dar)
    - die Medienquelle kann HTTP(S), `file://` oder ein lokaler Pfad sein

  </Accordion>

  <Accordion title="Mediengrößenbeschränkungen und Fallback-Verhalten">
    - Obergrenze für das Speichern eingehender und das Senden ausgehender Medien: `channels.whatsapp.mediaMaxMb` (Standardwert `50`)
    - kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Anpassung von Größe und Qualität), damit sie die Beschränkungen einhalten, sofern `forceDocument`/`asDocument` nicht die Zustellung als Dokument anfordert
    - wenn das Senden von Medien fehlschlägt, sendet der Fallback für das erste Element eine Textwarnung, anstatt die Antwort unbemerkt zu verwerfen

  </Accordion>
</AccordionGroup>

## Zitieren von Antworten

`channels.whatsapp.replyToMode` steuert das native Zitieren von Antworten (ausgehende Antworten zitieren sichtbar die eingehende Nachricht):

| Wert                | Verhalten                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| `"off"` (Standard)  | Niemals zitieren; als einfache Nachricht senden                        |
| `"first"`           | Nur den ersten Abschnitt der ausgehenden Antwort zitieren              |
| `"all"`             | Jeden Abschnitt der ausgehenden Antwort zitieren                       |
| `"batched"`         | In die Warteschlange gestellte gebündelte Antworten zitieren; sofortige Antworten nicht zitieren |

Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie umfassend der Agent Emoji-Reaktionen verwendet:

| Stufe                 | Bestätigungsreaktionen | Vom Agenten ausgelöste Reaktionen |
| --------------------- | ---------------------- | --------------------------------- |
| `"off"`               | Nein                   | Nein                              |
| `"ack"`               | Ja                     | Nein                              |
| `"minimal"` (Standard) | Ja                    | Ja, zurückhaltende Vorgabe        |
| `"extensive"`         | Ja                     | Ja, ausdrücklich erwünscht        |

Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Bestätigungsreaktionen

`channels.whatsapp.ackReaction` sendet beim Eingang sofort eine Reaktion, die durch `reactionLevel` eingeschränkt wird (bei `"off"` unterdrückt):

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

Hinweise: Wird unmittelbar gesendet, nachdem die eingehende Nachricht akzeptiert wurde (vor der Antwort); wenn `ackReaction` ohne `emoji` vorhanden ist, verwendet WhatsApp das Identitäts-Emoji des zuständigen Agenten und greift ersatzweise auf „👀“ zurück (`ackReaction` auslassen oder `emoji: ""` festlegen, um keine Bestätigung zu senden); Fehler werden protokolliert, blockieren die Zustellung der Antwort jedoch nicht; der Gruppenmodus `mentions` reagiert nur auf Durchläufe, die durch Erwähnungen ausgelöst wurden, während die Gruppenaktivierung `always` diese Prüfung umgeht; WhatsApp verwendet ausschließlich `channels.whatsapp.ackReaction` (das ältere `messages.ackReaction` gilt hier nicht).

## Statusreaktionen während des Lebenszyklus

Setzen Sie `messages.statusReactions.enabled: true`, damit WhatsApp die Bestätigungsreaktion während eines Durchlaufs ersetzt, anstatt ein statisches Empfangs-Emoji beizubehalten, und dabei Status wie „in der Warteschlange“, „denkt nach“, „Werkzeugaktivität“, Compaction, „abgeschlossen“ und „Fehler“ durchläuft:

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

Hinweise: `channels.whatsapp.ackReaction` steuert weiterhin die Zulässigkeit für Direktnachrichten und Gruppen; der Warteschlangenstatus verwendet dasselbe effektive Emoji wie einfache Bestätigungsreaktionen; WhatsApp verfügt pro Nachricht über einen Reaktionsplatz für den Bot, daher ersetzen Lebenszyklusaktualisierungen die aktuelle Reaktion direkt; `messages.removeAckAfterReply: true` entfernt die abschließende Statusreaktion nach der konfigurierten Haltezeit für Abschluss/Fehler; Kategorien für Werkzeug-Emojis umfassen `tool`, `coding`, `web`, `deploy`, `build` und `concierge`.

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontenauswahl und Standardwerte">
    Konto-IDs stammen aus `channels.whatsapp.accounts`. Bei der Auswahl des Standardkontos wird `default` verwendet, sofern vorhanden; andernfalls die erste konfigurierte Konto-ID in alphabetischer Reihenfolge. Konto-IDs werden intern für die Suche normalisiert.
  </Accordion>

  <Accordion title="Pfade für Zugangsdaten und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (Sicherung: `creds.json.bak`)
    - die bisherige Standardauthentifizierung unter `~/.openclaw/credentials/` wird für Abläufe mit dem Standardkonto weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto. Wenn ein Gateway erreichbar ist, beendet die Abmeldung zuerst den aktiven Listener für dieses Konto, sodass die verknüpfte Sitzung bereits vor dem nächsten Neustart keine Nachrichten mehr empfängt. `openclaw channels remove --channel whatsapp` beendet ebenfalls den aktiven Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während die Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionsfreigaben: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (vorhandene Aktionen haben standardmäßig den Wert `true`), `channels.whatsapp.actions.calls` (standardmäßig `false`, siehe MeowCaller weiter oben).
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert; deaktivieren Sie sie über `channels.whatsapp.configWrites: false`.

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR-Code erforderlich)">
    Symptom: Der Kanalstatus meldet, dass keine Verknüpfung besteht.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: Ein verknüpftes Konto weist wiederholte Verbindungsabbrüche oder Wiederverbindungsversuche auf.

    Inaktive Konten können über das normale Nachrichten-Zeitlimit hinaus verbunden bleiben; der Watchdog führt nur dann einen Neustart durch, wenn die Transportaktivität von WhatsApp Web aussetzt, der Socket geschlossen wird oder die Aktivität auf Anwendungsebene über das längere Sicherheitszeitfenster hinaus ausbleibt (siehe Laufzeitmodell weiter oben).

    Wenn die Protokolle wiederholt `status=408 Request Time-out Connection was lost` anzeigen, passen Sie die Baileys-Socket-Zeitvorgaben unter `web.whatsapp` an. Verkürzen Sie zunächst `keepAliveIntervalMs` auf einen Wert unterhalb des Inaktivitäts-Zeitlimits Ihres Netzwerks und erhöhen Sie `connectTimeoutMs` bei langsamen oder verlustbehafteten Verbindungen:

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

    Wenn die Schleife nach der Behebung der Hostkonnektivität und der Zeitvorgaben fortbesteht, sichern Sie das Authentifizierungsverzeichnis des Kontos und verknüpfen Sie es erneut:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` den Eintrag `Gateway inactive` enthält, aber sowohl `openclaw gateway status` als auch `openclaw channels status --probe` einen fehlerfreien Zustand anzeigen, führen Sie `openclaw doctor` aus. Unter Linux warnt Doctor vor Legacy-Crontab-Einträgen, die das außer Betrieb genommene Skript `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese Einträge mit `crontab -e` — Cron verfügt möglicherweise nicht über die systemd-Benutzerbus-Umgebung, wodurch dieses alte Skript den Zustand des Gateways fälschlicherweise als fehlerhaft meldet.

  </Accordion>

  <Accordion title="Zeitüberschreitung bei der QR-Anmeldung hinter einem Proxy">
    Symptom: `openclaw channels login --channel whatsapp` schlägt mit `status=408 Request Time-out` oder einer getrennten TLS-Socket-Verbindung fehl, bevor ein nutzbarer QR-Code angezeigt wird.

    Die Anmeldung bei WhatsApp Web verwendet die Standard-Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinschreibung, `NO_PROXY`). Vergewissern Sie sich, dass der Gateway-Prozess die Proxy-Umgebungsvariablen übernimmt und dass `NO_PROXY` nicht auf `mmg.whatsapp.net` zutrifft.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendevorgänge schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist. Vergewissern Sie sich, dass das Gateway ausgeführt wird und das Konto verknüpft ist.
  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen erfassen, was der Agent erzeugt hat; die Zustellung über WhatsApp wird separat geprüft. OpenClaw betrachtet eine automatische Antwort erst dann als gesendet, wenn Baileys für mindestens einen sichtbaren Text- oder Mediendateiversand eine ausgehende Nachrichten-ID zurückgibt.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort — eine erfolgreiche Reaktion beweist nicht, dass die nachfolgende Text-/Medienantwort akzeptiert wurde. Suchen Sie in den Gateway-Protokollen nach `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge: `groupPolicy`, `groupAllowFrom`/`allowFrom`, Einträge in der `groups`-Positivliste, Erwähnungsprüfung (`requireMention` + Erwähnungsmuster) und doppelte Schlüssel in `openclaw.json` (bei JSON5 überschreiben spätere Einträge frühere — verwenden Sie pro Geltungsbereich nur eine einzige `groupPolicy`).

    Wenn `channels.whatsapp.groups` vorhanden ist, kann WhatsApp weiterhin Nachrichten aus anderen Gruppen erkennen, OpenClaw verwirft sie jedoch vor der Sitzungsweiterleitung. Fügen Sie die Gruppen-JID zu `channels.whatsapp.groups` hinzu oder fügen Sie `groups["*"]` hinzu, um alle Gruppen zuzulassen, während die Absenderautorisierung weiterhin durch `groupPolicy`/`groupAllowFrom` gesteuert wird.

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun wird als inkompatibel mit dem stabilen Gateway-Betrieb für WhatsApp/Telegram gekennzeichnet.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt über die Zuordnungen `groups` und `direct` System-Prompts im Telegram-Stil für Gruppen und Direktchats.

Auflösung für Gruppennachrichten: Zuerst wird die wirksame `groups`-Zuordnung bestimmt — wenn das Konto einen eigenen `groups`-Schlüssel definiert, ersetzt dieser die `groups`-Zuordnung auf Stammebene vollständig (keine tiefe Zusammenführung). Die Prompt-Suche erfolgt anschließend in dieser einen resultierenden Zuordnung:

1. **Gruppenspezifischer Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der Gruppeneintrag vorhanden **und** sein Schlüssel `systemPrompt` definiert ist. Eine leere Zeichenfolge (`""`) unterdrückt den Platzhalter und wendet keinen Prompt an.
2. **Gruppenplatzhalter-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag fehlt oder ohne Schlüssel `systemPrompt` vorhanden ist.

Die Auflösung für Direktnachrichten folgt demselben Muster anhand der Zuordnung `direct` und `direct["*"]`.

<Note>
`dms` bleibt der kompakte Bereich zum Überschreiben des Verlaufs einzelner Direktnachrichten (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

<Note>
Dieses Verhalten, bei dem das Konto für die Prompt-Auflösung die Stammebene ersetzt, ist eine einfache flache Überschreibung: Jeder `groups`-/`direct`-Schlüssel eines Kontos, einschließlich eines explizit leeren Objekts, ersetzt die Zuordnung auf Stammebene. Es unterscheidet sich von der oben beschriebenen Prüfung der Positivliste für die Gruppenzugehörigkeit, die bei einem einzelnen Konto ein Sicherheitsnetz für ein versehentlich leeres `groups: {}` bietet.
</Note>

**Unterschied zu Telegram:** Telegram unterdrückt `groups` auf Stammebene für jedes Konto in einer Mehrkontoeinrichtung (selbst für Konten ohne eigenes `groups`), damit ein Bot keine Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diesen Schutz nicht an — `groups`/`direct` auf Stammebene werden unabhängig von der Anzahl der Konten von jedem Konto ohne eigene Überschreibung übernommen. Definieren Sie in einer WhatsApp-Mehrkontoeinrichtung die vollständige Zuordnung ausdrücklich unter jedem Konto, wenn Sie kontospezifische Prompts wünschen.

Wichtige Verhaltensweisen:

- `channels.whatsapp.groups` dient sowohl als Konfigurationszuordnung pro Gruppe als auch als Positivliste für Gruppen auf Chat-Ebene. Sowohl auf Stamm- als auch auf Kontoebene bedeutet `groups["*"]`, dass für diesen Geltungsbereich alle Gruppen zugelassen sind.
- Fügen Sie einen Platzhalter-`systemPrompt` nur hinzu, wenn für diesen Geltungsbereich ohnehin alle Gruppen zugelassen werden sollen. Wenn nur eine feste Gruppe von Gruppen-IDs zulässig bleiben soll, wiederholen Sie den Prompt für jeden ausdrücklich in die Positivliste aufgenommenen Eintrag, anstatt `groups["*"]` zu verwenden.
- Gruppenzulassung und Absenderautorisierung sind separate Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die von der Gruppenverarbeitung erfasst werden; dadurch wird nicht jeder Absender in diesen Gruppen autorisiert — dies wird weiterhin durch `groupPolicy`/`groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat keine entsprechende Nebenwirkung für Direktnachrichten: `direct["*"]` stellt lediglich eine Standardkonfiguration bereit, nachdem eine Direktnachricht bereits durch `dmPolicy` zusammen mit `allowFrom` oder den Regeln des Kopplungsspeichers zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn alle Gruppen auf Stammebene zugelassen werden sollen.
        // Gilt für alle Konten, die keine eigene groups-Zuordnung definieren.
        "*": { systemPrompt: "Standard-Prompt für alle Gruppen." },
      },
      direct: {
        // Gilt für alle Konten, die keine eigene direct-Zuordnung definieren.
        "*": { systemPrompt: "Standard-Prompt für alle Direktchats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene Gruppen, daher werden die Gruppen auf
            // Stammebene vollständig ersetzt. Um einen Platzhalter beizubehalten,
            // definieren Sie "*" auch hier ausdrücklich.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Konzentrieren Sie sich auf das Projektmanagement.",
            },
            // Nur verwenden, wenn alle Gruppen in diesem Konto zugelassen werden sollen.
            "*": { systemPrompt: "Standard-Prompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Zuordnung, daher werden die
            // direct-Einträge auf Stammebene vollständig ersetzt. Um einen Platzhalter
            // beizubehalten, definieren Sie "*" auch hier ausdrücklich.
            "+15551234567": { systemPrompt: "Prompt für einen bestimmten Arbeits-Direktchat." },
            "*": { systemPrompt: "Standard-Prompt für Arbeits-Direktchats." },
          },
        },
      },
    },
  },
}
```

## Verweise zur Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – WhatsApp](/de/gateway/config-channels#whatsapp)

| Bereich          | Felder                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Zugriff          | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Zustellung       | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Mehrere Konten   | `accounts.<id>.enabled`, `accounts.<id>.authDir` und weitere kontospezifische Überschreibungen                 |
| Betrieb          | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Sitzungsverhalten | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                  |
| Prompts          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalweiterleitung](/de/channels/channel-routing)
- [Multi-Agent-Weiterleitung](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
