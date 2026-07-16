---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder an der Posteingangsweiterleitung
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T12:30:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsbereit über WhatsApp Web (Baileys). Der Gateway verwaltet die verknüpfte(n) Sitzung(en); es gibt keinen separaten Twilio-WhatsApp-Kanal.

## Installation

`openclaw onboard` und `openclaw channels add --channel whatsapp` fordern zur Installation des Plugins auf, wenn Sie es zum ersten Mal auswählen; `openclaw channels login --channel whatsapp` bietet denselben Installationsablauf an, wenn das Plugin fehlt. Entwicklungs-Checkouts verwenden den lokalen Plugin-Pfad; bei stabilen/Beta-Installationen wird zunächst `@openclaw/whatsapp` aus ClawHub installiert, mit npm als Fallback. Die WhatsApp-Laufzeit wird außerhalb des zentralen OpenClaw-npm-Pakets ausgeliefert, daher verbleiben ihre Laufzeitabhängigkeiten beim externen Plugin. Manuelle Installation:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Verwenden Sie das reine npm-Paket (`@openclaw/whatsapp`) nur für den Registry-Fallback; fixieren Sie eine exakte Version nur für eine reproduzierbare Installation.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie für unbekannte Absender ist die Kopplung.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturanleitungen.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Kanalkonfigurationsmuster und Beispiele.
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

    Die Anmeldung ist nur per QR-Code möglich. Stellen Sie auf entfernten oder monitorlosen Hosts vor Beginn der Anmeldung sicher, dass der aktuelle QR-Code zuverlässig an das Telefon übermittelt werden kann; im Terminal dargestellte QR-Codes, Screenshots oder Chat-Anhänge können während der Übertragung ablaufen.

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

    Kopplungsanfragen laufen nach 1 Stunde ab; pro Konto sind höchstens 3 ausstehende Anfragen zulässig.

  </Step>
</Steps>

<Note>
Eine separate WhatsApp-Nummer wird empfohlen (Einrichtung und Metadaten sind dafür optimiert), Konfigurationen mit persönlicher Nummer bzw. Selbst-Chat werden jedoch vollständig unterstützt.
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Zulassungslisten und Routing-Grenzen
    - geringeres Risiko von Verwechslungen beim Selbst-Chat

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
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine für Selbst-Chats geeignete Basiskonfiguration: `dmPolicy: "allowlist"`, `allowFrom` einschließlich Ihrer eigenen Nummer, `selfChatMode: true`. Die Laufzeitschutzmechanismen für Selbst-Chats orientieren sich an der verknüpften eigenen Nummer sowie an `allowFrom`.
  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Der Gateway verwaltet den WhatsApp-Socket und die Schleife für erneute Verbindungen.
- Ein Watchdog überwacht zwei Signale unabhängig voneinander: die reine WhatsApp-Web-Transportaktivität und die Aktivität von Anwendungsnachrichten. Eine ruhige, aber verbundene Sitzung wird nicht allein deshalb neu gestartet, weil zuletzt keine Nachricht eingegangen ist; eine erneute Verbindung wird nur erzwungen, wenn für ein festes internes Zeitfenster (nicht benutzerkonfigurierbar) keine Transport-Frames mehr eintreffen oder Anwendungsnachrichten länger als das Vierfache des normalen Nachrichten-Timeouts ausbleiben. Unmittelbar nach einer erneuten Verbindung für eine kürzlich aktive Sitzung verwendet dieses erste Zeitfenster statt des vierfachen Zeitfensters den kürzeren normalen Nachrichten-Timeout. OpenClaw kann automatisch auf Offline-Nachrichten antworten, die Baileys frühzeitig während dieser erneuten Verbindung zustellt, begrenzt durch die Lebensdauer der Deduplizierung eingehender Nachrichten-IDs; beim ersten Start bleibt die kurze Schutzfrist gegen veraltete Verlaufsdaten bestehen.
- Die Baileys-Socket-Zeitvorgaben sind unter `web.whatsapp.*` explizit festgelegt: `keepAliveIntervalMs` (Ping-Intervall der Anwendung), `connectTimeoutMs` (Timeout für den Verbindungsaufbau), `defaultQueryTimeoutMs` (Wartezeiten für Baileys-Abfragen sowie OpenClaws Timeouts für ausgehendes Senden/Präsenz und eingehende Lesebestätigungen).
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto; andernfalls schlagen sie sofort fehl.
- Bei Sendungen an Gruppen werden native Erwähnungsmetadaten für `@+<digits>`- und `@<digits>`-Token (in Texten und Medienbeschriftungen) angefügt, wenn das Token mit den aktuellen Teilnehmermetadaten übereinstimmt; dies schließt LID-basierte Gruppen ein.
- Status- und Broadcast-Chats (`@status`, `@broadcast`) werden ignoriert.
- Direkt-Chats verwenden die DM-Sitzungsregeln (`session.dmScope`; der Standardwert `main` führt DMs in der Hauptsitzung des Agenten zusammen). Gruppensitzungen werden pro JID isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-Kanäle/Newsletter können über ihre native `@newsletter`-JID explizite ausgehende Ziele sein und verwenden dabei Kanal-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) anstelle der DM-Semantik.
- Der WhatsApp-Web-Transport berücksichtigt die standardmäßigen Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, einschließlich Varianten in Kleinbuchstaben). Bevorzugen Sie eine Proxy-Konfiguration auf Hostebene gegenüber kanalspezifischen Einstellungen.
- Wenn `messages.removeAckAfterReply` aktiviert ist, entfernt OpenClaw die Bestätigungsreaktion, sobald eine sichtbare Antwort zugestellt wurde.

## Aktuellen Anfragenden mit MeowCaller anrufen (experimentell)

Das Plugin kann `whatsapp_call` in Agentendurchläufen verfügbar machen, die von WhatsApp stammen. Es verwendet [MeowCaller](https://github.com/purpshell/meowcaller), um den aktuell autorisierten Anfragenden per WhatsApp-Sprachanruf anzurufen und nach der Annahme eine OpenClaw-TTS-Nachricht abzuspielen. Das Tool besitzt keinen Parameter für die Zielnummer, sodass ein Prompt den Anruf nicht umleiten kann. Standardmäßig deaktiviert.

<Warning>
MeowCaller ist experimentell, besitzt kein mit einem Tag versehenes Release und verwendet eine separat gekoppelte whatsmeow-Sitzung für ein verknüpftes Gerät – die Baileys-Anmeldedaten des Plugins können nicht wiederverwendet werden. Durch die Kopplung wird demselben WhatsApp-Konto ein weiteres verknüpftes Gerät hinzugefügt; scannen Sie mit der von OpenClaw verwendeten Identität. Im Modus mit persönlicher Nummer bzw. Selbst-Chat kann kein Selbstanruf erfolgen; verwenden Sie eine dedizierte OpenClaw-Nummer, um Ihre persönliche Nummer anzurufen.
</Warning>

<Steps>
  <Step title="Experimentelle Anrufe aktivieren">

    Fügen Sie `actions.calls: true` zur WhatsApp-Kanalkonfiguration hinzu und starten Sie den Gateway neu:

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

    Wenn die Option fehlt oder auf `false` gesetzt ist, stellt OpenClaw das Tool `whatsapp_call` nicht bereit.

  </Step>

  <Step title="Überprüfte MeowCaller-CLI installieren">

    Der Adapter erwartet eine ausführbare Datei `meowcaller` im `PATH` des Gateway-Hosts. Bis [MeowCaller-PR Nr. 7](https://github.com/purpshell/meowcaller/pull/7) zusammengeführt wird, erstellen Sie den überprüften Branch:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Stellen Sie sicher, dass sich `$HOME/.local/bin` im `PATH` des Gateway-Dienstes befindet. Diese Revision verfügt über explizite Befehle `pair` und `notify` nur zum Senden; `notify` öffnet weder Mikrofon, Lautsprecher oder Videogerät noch eine Diagnoseaufzeichnung. Ersetzen Sie dies nicht durch den Befehl `play` der Beispiel-CLI des Upstream-Projekts.

  </Step>

  <Step title="Verknüpftes MeowCaller-Gerät koppeln">

    Bitten Sie den WhatsApp-Agenten, die Anrufeinrichtung zu prüfen (die Statusaktion `whatsapp_call` meldet das kontospezifische Statusverzeichnis und den Kopplungsbefehl). Für das Standardkonto:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Führen Sie dies interaktiv aus, scannen Sie den QR-Code unter **WhatsApp > Linked devices** und warten Sie auf `MeowCaller linked device ready`. Halten Sie `wa-voip.db` geheim – dies ist die MeowCaller-Sitzung. Nicht standardmäßige Konten erhalten über die Statusaktion einen eigenen Speicherpfad; führen Sie unter Windows den zugehörigen PowerShell-Befehl aus.

  </Step>

  <Step title="TTS konfigurieren und von WhatsApp aus anrufen">

    Konfigurieren Sie einen telefoniefähigen [TTS-Provider](/de/tools/tts), starten Sie den Gateway neu und senden Sie dann eine Anfrage wie `Call me and say the build finished.` Das Tool ermittelt den Absender aus dem vertrauenswürdigen eingehenden Kontext, synthetisiert eine temporäre private WAV-Datei, führt MeowCaller für ein begrenztes Anruffenster aus und löscht anschließend die Audiodatei. OpenClaw übergibt den Speicher des Kontos explizit, wartet nach Annahme/Wiedergabe/Auflegen auf einen Exit-Status von null und behandelt einen Timeout oder einen Exit-Status ungleich null als fehlgeschlagenen Tool-Aufruf.

  </Step>
</Steps>

Einschränkungen: nur ausgehende Eins-zu-eins-Audioanrufe, keine beliebigen Zielnummern, keine gemeinsame Authentifizierung mit der Chatverbindung, keine Selbstanrufe im Modus mit persönlicher Nummer bzw. Selbst-Chat, synthetisierte Audiodauer auf 60 Sekunden begrenzt, keine Empfangsbestätigung für die Hörbarkeit auf der Mobilgeräteseite über MeowCallers Abschluss von Annahme/Wiedergabe/Auflegen hinaus, und OpenClaw beendet den Begleitprozess nach einem begrenzten Zeitfenster von 115–175 Sekunden (einschließlich der Verbindungs-, Annahme-, Wiedergabe- und Beendigungsphasen von MeowCaller).

## Genehmigungsaufforderungen

WhatsApp kann Aufforderungen zur Genehmigung von Ausführungen und Plugins als `👍`-/`👎`-Reaktionen darstellen, gesteuert durch die oberste Konfiguration für die Weiterleitung von Genehmigungen:

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

`approvals.exec` und `approvals.plugin` sind unabhängig voneinander; die Aktivierung von WhatsApp als Kanal verknüpft lediglich den Transport und sendet nichts, sofern nicht die entsprechende Genehmigungsfamilie aktiviert und dorthin weitergeleitet wird. Der Sitzungsmodus liefert native Emoji-Genehmigungen nur für Genehmigungen, die aus WhatsApp stammen. Der Zielmodus verwendet die gemeinsame Weiterleitungspipeline für explizite Ziele und erzeugt keine separate Auffächerung in Genehmiger-DMs.

WhatsApp-Genehmigungsreaktionen erfordern explizite Genehmiger in `allowFrom` (oder `"*"`). `defaultTo` legt gewöhnliche Standardnachrichtenziele fest, keine Genehmigerliste. Manuelle `/approve`-Befehle durchlaufen weiterhin den normalen WhatsApp-Pfad zur Absenderautorisierung, bevor die Genehmigung aufgelöst wird.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Inhalte, Telefonnummern, Gruppenkennungen, Absendernamen und Felder zur Sitzungskorrelation enthalten. WhatsApp sendet eingehende `message_received`-Hook-Nutzlasten nicht an Plugins, sofern Sie dies nicht ausdrücklich aktivieren:

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

Beschränken Sie die Aktivierung unter `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` auf ein Konto. Aktivieren Sie dies nur für Plugins, denen Sie eingehende WhatsApp-Inhalte und -Kennungen anvertrauen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy`:

    | Wert | Verhalten |
    | --- | --- |
    | `pairing` (Standard) | Unbekannte Absender fordern eine Kopplung an; der Eigentümer genehmigt sie |
    | `allowlist` | Nur Absender aus `allowFrom` werden zugelassen |
    | `open` | Erfordert, dass `allowFrom` den Wert `"*"` enthält |
    | `disabled` | Alle DMs blockieren |

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert). Dies ist ausschließlich eine Zugriffskontrollliste für DM-Absender – sie beschränkt keine expliziten ausgehenden Sendungen an Gruppen-JIDs oder `@newsletter`-Kanal-JIDs.

    Überschreibung für mehrere Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `.allowFrom`) haben für dieses Konto Vorrang vor den Standardeinstellungen auf Kanalebene.

    Laufzeithinweise:

    - Kopplungen bleiben im Allow-Store des Kanals erhalten und werden mit konfigurierten `allowFrom` zusammengeführt
    - geplante Automatisierung und der Heartbeat-Empfänger-Fallback verwenden explizite Zustellungsziele oder konfigurierte `allowFrom`; Genehmigungen von DM-Kopplungen sind keine impliziten Cron-/Heartbeat-Empfänger
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig zugelassen
    - OpenClaw koppelt ausgehende `fromMe`-DMs (Nachrichten, die Sie sich selbst vom verknüpften Gerät senden) niemals automatisch

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für die Gruppenmitgliedschaft** (`channels.whatsapp.groups`): Wenn `groups` weggelassen wird, kommen alle Gruppen infrage; falls vorhanden, dient es als Gruppen-Allowlist (`"*"` lässt alle zu).
    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` umgeht die Absender-Allowlist, `allowlist` erfordert eine Übereinstimmung mit `groupAllowFrom` (oder `*`), `disabled` blockiert alle eingehenden Gruppennachrichten.

    Wenn `groupAllowFrom` nicht festgelegt ist, greifen Absenderprüfungen auf `allowFrom` zurück, sofern es Einträge enthält. Absender-Allowlists werden vor der Aktivierung durch Erwähnung oder Antwort ausgewertet.

    Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, greift die Laufzeit auf `groupPolicy: "allowlist"` zurück (mit einem Warnprotokolleintrag), selbst wenn `channels.defaults.groupPolicy` auf einen anderen Wert gesetzt ist.

    <Note>
    Die Auflösung der Gruppenmitgliedschaft verfügt über ein Sicherheitsnetz für Einzelkonten: Wenn nur ein WhatsApp-Konto konfiguriert ist und dessen `accounts.<id>.groups` ein explizit leeres Objekt (`{}`) ist, wird dies als „nicht festgelegt“ behandelt und es wird auf die `channels.whatsapp.groups`-Zuordnung auf Stammebene zurückgegriffen, statt unbemerkt jede Gruppe zu blockieren. Sind mindestens 2 Konten konfiguriert, bleibt eine explizit leere Kontozuordnung leer und greift nicht auf die Stammebene zurück – dadurch kann ein Konto absichtlich alle Gruppen deaktivieren, ohne andere Konten zu beeinträchtigen.
    </Note>

  </Tab>

  <Tab title="Erwähnungen und /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung. Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Transkripte eingehender Sprachnachrichten für autorisierte Gruppennachrichten
    - implizite Erkennung von Antworten an den Bot (der Antwortabsender stimmt mit der Bot-Identität überein)

    Sicherheit: Ein Zitat oder eine Antwort erfüllt lediglich die Erwähnungsprüfung – es erteilt **keine** Absenderautorisierung. Mit `groupPolicy: "allowlist"` bleiben Absender, die nicht auf der Allowlist stehen, selbst dann blockiert, wenn sie auf die Nachricht eines zugelassenen Benutzers antworten.

    Aktivierungsbefehl auf Sitzungsebene: `/activation mention` oder `/activation always`. Dadurch wird der Sitzungsstatus (nicht die globale Konfiguration) aktualisiert; der Befehl ist auf den Eigentümer beschränkt.

  </Tab>
</Tabs>

## Konfigurierte ACP-Bindungen

WhatsApp unterstützt persistente ACP-Bindungen über `bindings[]` auf oberster Ebene:

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

Direktchats werden anhand von E.164-Nummern zugeordnet; Gruppen anhand von WhatsApp-Gruppen-JIDs. Gruppen-Allowlists, Absenderrichtlinie und die Aktivierungsprüfung anhand von Erwähnungen werden ausgeführt, bevor OpenClaw sicherstellt, dass die gebundene ACP-Sitzung vorhanden ist. Eine übereinstimmende Bindung übernimmt die Route – Broadcast-Gruppen verteilen diesen Durchlauf nicht an gewöhnliche WhatsApp-Sitzungen.

## Verhalten für persönliche Nummern und Selbstchats

Wenn die verknüpfte eigene Nummer ebenfalls in `allowFrom` enthalten ist, werden Schutzmaßnahmen für Selbstchats aktiviert: Lesebestätigungen für Selbstchat-Durchläufe werden übersprungen, das automatische Auslösen durch Erwähnungs-JIDs, durch das Sie sich selbst benachrichtigen würden, wird ignoriert, und Antworten verwenden standardmäßig `[{identity.name}]` (oder `[openclaw]`), wenn `messages.responsePrefix` nicht festgelegt ist.

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag und Antwortkontext">
    Eingehende Nachrichten werden in den gemeinsamen Eingangsumschlag eingebettet. Eine zitierte Antwort fügt Kontext in folgender Form an:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwortmetadaten (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164) werden eingetragen, sofern verfügbar. Wenn das zitierte Ziel herunterladbare Medien enthält, speichert OpenClaw diese über den normalen Speicher für eingehende Medien und stellt `MediaPath`/`MediaType` bereit, damit der Agent sie direkt untersuchen kann, statt nur `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standorten/Kontakten">
    Nachrichten, die ausschließlich Medien enthalten, werden auf Platzhalter normalisiert: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Autorisierte Gruppensprachnachrichten werden vor der Erwähnungsprüfung transkribiert, wenn der Inhalt ausschließlich `<media:audio>` umfasst, sodass das Aussprechen der Bot-Erwähnung in der Sprachnachricht die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, verbleibt es im ausstehenden Gruppenverlauf anstelle des unverarbeiteten Platzhalters.

    Standortinhalte werden als knapper Koordinatentext dargestellt. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als eingezäunte, nicht vertrauenswürdige Metadaten dargestellt, nicht als Inline-Prompttext.

  </Accordion>

  <Accordion title="Einfügung des ausstehenden Gruppenverlaufs">
    Nicht verarbeitete Gruppennachrichten werden gepuffert und als Kontext eingefügt, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`, Fallback `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügungsmarkierungen: `[Chat messages since your last reply - for context]` und `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Für akzeptierte eingehende Nachrichten standardmäßig aktiviert. Global deaktivieren:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Außerkraftsetzung pro Konto: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Selbstchat-Durchläufe überspringen Lesebestätigungen auch bei globaler Aktivierung.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - Standardlimit für Textblöcke: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift anschließend auf eine längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Bild-, Video-, Audio- (PTT-Sprachnachricht) und Dokumentnutzdaten
    - Audio wird als Baileys-Nutzdaten vom Typ `audio` mit `ptt: true` gesendet und als Push-to-Talk-Sprachnachricht dargestellt; `audioAsVoice` bleibt in Antwortnutzdaten erhalten, sodass die Ausgabe von TTS-Sprachnachrichten unabhängig vom Quellformat des Providers auf diesem Pfad bleibt
    - natives Ogg/Opus-Audio wird als `audio/ogg; codecs=opus` gesendet; alles andere (einschließlich der MP3-/WebM-Ausgabe von Microsoft Edge TTS) wird vor der PTT-Zustellung mit `ffmpeg` in Ogg/Opus mit 48 kHz und einem Kanal transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als einzelne Sprachnachricht und unterdrückt wiederholte Sendungen derselben Antwort; `/tts chat on|off|default` steuert automatisches TTS für den aktuellen Chat
    - `gifPlayback: true` bei Videos aktiviert die Wiedergabe als animiertes GIF
    - `forceDocument`/`asDocument` leitet ausgehende Bilder, GIFs und Videos über die Baileys-Dokumentnutzdaten, um die Medienkomprimierung von WhatsApp zu vermeiden, wobei der ermittelte Dateiname und MIME-Typ erhalten bleiben
    - Beschriftungen gelten für das erste Medienelement einer Antwort mit mehreren Medien, außer bei PTT-Sprachnachrichten: Das Audio wird zuerst ohne Beschriftung gesendet, anschließend wird die Beschriftung als separate Textnachricht gesendet (WhatsApp-Clients stellen Beschriftungen von Sprachnachrichten nicht konsistent dar)
    - die Medienquelle kann HTTP(S), `file://` oder ein lokaler Pfad sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherlimit für eingehende und Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Außerkraftsetzung pro Konto: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenanpassung/Qualitätsdurchlauf), damit sie die Limits einhalten, sofern `forceDocument`/`asDocument` keine Dokumentzustellung anfordert
    - wenn das Senden von Medien fehlschlägt, sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort unbemerkt zu verwerfen

  </Accordion>
</AccordionGroup>

## Zitieren bei Antworten

`channels.whatsapp.replyToMode` steuert das native Zitieren bei Antworten (ausgehende Antworten zitieren die eingehende Nachricht sichtbar):

| Wert              | Verhalten                                                      |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (Standard) | Nie zitieren; als einfache Nachricht senden                    |
| `"first"`         | Nur den ersten ausgehenden Antwortblock zitieren               |
| `"all"`           | Jeden ausgehenden Antwortblock zitieren                        |
| `"batched"`       | In die Warteschlange eingereihte gebündelte Antworten zitieren; unmittelbare Antworten unzitiert lassen |

Außerkraftsetzung pro Konto: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie umfassend der Agent Emoji-Reaktionen verwendet:

| Stufe                 | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen |
| --------------------- | ---------------------- | --------------------------------- |
| `"off"`               | Nein                   | Nein                              |
| `"ack"`               | Ja                     | Nein                              |
| `"minimal"` (Standard) | Ja                     | Ja, zurückhaltende Richtlinie     |
| `"extensive"`         | Ja                     | Ja, ausdrücklich empfohlen        |

Außerkraftsetzung pro Konto: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Bestätigungsreaktionen

`channels.whatsapp.ackReaction` sendet unmittelbar beim Empfang einer eingehenden Nachricht eine Reaktion, die durch `reactionLevel` gesteuert wird (unterdrückt, wenn `"off"`):

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

Hinweise: Wird unmittelbar nach Annahme der eingehenden Nachricht gesendet (vor der Antwort); wenn `ackReaction` ohne `emoji` vorhanden ist, verwendet WhatsApp das Identitäts-Emoji des weitergeleiteten Agenten und greift ersatzweise auf „👀“ zurück (`ackReaction` weglassen oder `emoji: ""` festlegen, um keine Bestätigung zu senden); Fehler werden protokolliert, blockieren aber nicht die Zustellung der Antwort; der Gruppenmodus `mentions` reagiert nur bei durch Erwähnungen ausgelösten Durchläufen, während die Gruppenaktivierung `always` diese Prüfung umgeht; WhatsApp verwendet ausschließlich `channels.whatsapp.ackReaction` (das ältere `messages.ackReaction` gilt hier nicht).

## Reaktionen auf Lebenszyklusstatus

Legen Sie `messages.statusReactions.enabled: true` fest, damit WhatsApp während eines Durchlaufs die Bestätigungsreaktion ersetzt, statt ein statisches Empfangs-Emoji beizubehalten, und dabei Zustände wie „in Warteschlange“, „Denken“, Werkzeugaktivität, Compaction, „abgeschlossen“ und „Fehler“ durchläuft:

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

Hinweise: `channels.whatsapp.ackReaction` steuert weiterhin die Berechtigung für Direktnachrichten und Gruppen; der Warteschlangenzustand verwendet dasselbe effektive Emoji wie einfache Bestätigungsreaktionen; WhatsApp verfügt pro Nachricht über einen Bot-Reaktionsplatz, daher ersetzen Lebenszyklusaktualisierungen die aktuelle Reaktion direkt; `messages.removeAckAfterReply: true` entfernt die abschließende Statusreaktion nach der konfigurierten Haltezeit für Abschluss/Fehler; die Werkzeug-Emoji-Kategorien umfassen `tool`, `coding`, `web`, `deploy`, `build` und `concierge`.

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    Konto-IDs stammen aus `channels.whatsapp.accounts`. Für die Standardkontoauswahl wird `default` verwendet, sofern vorhanden, andernfalls die erste konfigurierte Konto-ID (alphabetisch sortiert). Konto-IDs werden intern für die Suche normalisiert.
  </Accordion>

  <Accordion title="Anmeldeinformationspfade und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (Sicherung: `creds.json.bak`)
    - die Legacy-Standardauthentifizierung in `~/.openclaw/credentials/` wird für Abläufe mit dem Standardkonto weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto. Wenn ein Gateway erreichbar ist, beendet die Abmeldung zuerst den aktiven Listener für dieses Konto, sodass die verknüpfte Sitzung bereits vor dem nächsten Neustart keine Nachrichten mehr empfängt. `openclaw channels remove --channel whatsapp` beendet ebenfalls den aktiven Listener, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während die Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Unterstützung für Agent-Tools umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionsfreigaben: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (vorhandene Aktionen verwenden standardmäßig `true`), `channels.whatsapp.actions.calls` (Standardwert `false`, siehe MeowCaller oben).
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

  <Accordion title="Verknüpft, aber getrennt / Schleife bei der erneuten Verbindung">
    Symptom: Ein verknüpftes Konto weist wiederholte Verbindungsabbrüche oder Versuche zur erneuten Verbindung auf.

    Konten mit wenig Aktivität können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog startet nur neu, wenn die Transportaktivität von WhatsApp Web endet, der Socket geschlossen wird oder die Aktivität auf Anwendungsebene länger als das längere Sicherheitszeitfenster ausbleibt (siehe Laufzeitmodell oben).

    Wenn die Protokolle wiederholt `status=408 Request Time-out Connection was lost` anzeigen, passen Sie die Baileys-Socket-Zeitwerte unter `web.whatsapp` an. Verkürzen Sie zunächst `keepAliveIntervalMs` auf einen Wert unterhalb des Leerlauf-Timeouts Ihres Netzwerks und erhöhen Sie `connectTimeoutMs` bei langsamen oder verlustbehafteten Verbindungen:

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

    Wenn die Schleife weiterhin besteht, nachdem die Hostkonnektivität und die Zeitwerte korrigiert wurden, sichern Sie das Authentifizierungsverzeichnis des Kontos und stellen Sie die Verknüpfung erneut her:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldet, `openclaw gateway status` und `openclaw channels status --probe` jedoch beide einen fehlerfreien Zustand anzeigen, führen Sie `openclaw doctor` aus. Unter Linux warnt doctor vor Legacy-crontab-Einträgen, die das außer Betrieb genommene Skript `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese Einträge mit `crontab -e` — Cron kann die Umgebung des systemd-Benutzerbusses fehlen, wodurch dieses alte Skript den Zustand des Gateways falsch meldet.

  </Accordion>

  <Accordion title="Zeitüberschreitung bei der QR-Anmeldung hinter einem Proxy">
    Symptom: `openclaw channels login --channel whatsapp` schlägt mit `status=408 Request Time-out` oder einer TLS-Socket-Trennung fehl, bevor ein verwendbarer QR-Code angezeigt wird.

    Die Anmeldung bei WhatsApp Web verwendet die standardmäßige Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben, `NO_PROXY`). Stellen Sie sicher, dass der Gateway-Prozess die Proxy-Umgebungsvariablen erbt und dass `NO_PROXY` nicht mit `mmg.whatsapp.net` übereinstimmt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendevorgänge schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist. Vergewissern Sie sich, dass das Gateway ausgeführt wird und das Konto verknüpft ist.
  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen zeichnen auf, was der Agent generiert hat; die Zustellung über WhatsApp wird separat überprüft. OpenClaw behandelt eine automatische Antwort erst dann als gesendet, nachdem Baileys für mindestens einen sichtbaren Text- oder Medienversand eine ID der ausgehenden Nachricht zurückgegeben hat.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort — eine erfolgreiche Reaktion beweist nicht, dass die spätere Text-/Medienantwort akzeptiert wurde. Prüfen Sie die Gateway-Protokolle auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge: `groupPolicy`, `groupAllowFrom`/`allowFrom`, Zulassungslisteneinträge in `groups`, Erwähnungsfreigabe (`requireMention` + Erwähnungsmuster) und doppelte Schlüssel in `openclaw.json` (spätere JSON5-Einträge überschreiben frühere — verwenden Sie pro Geltungsbereich nur ein `groupPolicy`).

    Wenn `channels.whatsapp.groups` vorhanden ist, kann WhatsApp weiterhin Nachrichten aus anderen Gruppen erfassen, OpenClaw verwirft sie jedoch vor der Sitzungsweiterleitung. Fügen Sie die Gruppen-JID zu `channels.whatsapp.groups` hinzu oder fügen Sie `groups["*"]` hinzu, um alle Gruppen zuzulassen, während die Absenderautorisierung weiterhin über `groupPolicy`/`groupAllowFrom` gesteuert wird.

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    OpenClaw-Gateways erfordern Node. Bun stellt die vom kanonischen Zustandsspeicher verwendete API `node:sqlite` nicht bereit, und doctor migriert ältere Bun-Dienste zu Node.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und Direktchats über die Zuordnungen `groups` und `direct`.

Auflösung für Gruppennachrichten: Zuerst wird die effektive Zuordnung `groups` bestimmt — wenn das Konto überhaupt einen eigenen Schlüssel `groups` definiert, ersetzt dieser die Stammzuordnung `groups` vollständig (keine tiefe Zusammenführung). Die Prompt-Suche erfolgt anschließend in dieser einzelnen resultierenden Zuordnung:

1. **Gruppenspezifischer Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der Gruppeneintrag vorhanden **und** sein Schlüssel `systemPrompt` definiert ist. Eine leere Zeichenfolge (`""`) unterdrückt den Platzhalter und wendet keinen Prompt an.
2. **Gruppen-Platzhalter-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag fehlt oder ohne Schlüssel `systemPrompt` vorhanden ist.

Die Auflösung für Direktnachrichten folgt demselben Muster anhand der Zuordnung `direct` und `direct["*"]`.

<Note>
`dms` bleibt der schlanke Überschreibungsbereich für den Verlauf einzelner Direktnachrichten (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

<Note>
Dieses Verhalten, bei dem das Konto bei der Prompt-Auflösung die Stammzuordnung ersetzt, ist eine einfache flache Überschreibung: Jeder kontospezifische Schlüssel `groups`/`direct`, einschließlich eines explizit leeren Objekts, ersetzt die Stammzuordnung. Dies unterscheidet sich von der oben beschriebenen Prüfung der Gruppenzugehörigkeits-Zulassungsliste, die für ein versehentlich leeres `groups: {}` ein Sicherheitsnetz für Einzelkonten besitzt.
</Note>

**Unterschied zu Telegram:** Telegram unterdrückt das Stamm-`groups` für jedes Konto in einer Mehrkontoeinrichtung (selbst für Konten ohne eigenes `groups`), um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzmaßnahme nicht an — Stamm-`groups`/`direct` werden unabhängig von der Anzahl der Konten von jedem Konto ohne eigene Überschreibung geerbt. Definieren Sie in einer WhatsApp-Mehrkontoeinrichtung die vollständige Zuordnung explizit unter jedem Konto, wenn Sie kontospezifische Prompts verwenden möchten.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine gruppenspezifische Konfigurationszuordnung als auch die Zulassungsliste für Gruppen auf Chat-Ebene. Sowohl im Stamm- als auch im Kontogeltungsbereich bedeutet `groups["*"]`: „Alle Gruppen werden für diesen Geltungsbereich zugelassen.“
- Fügen Sie den Platzhalter `systemPrompt` nur hinzu, wenn dieser Geltungsbereich bereits alle Gruppen zulassen soll. Damit nur eine festgelegte Gruppe von Gruppen-IDs berechtigt bleibt, wiederholen Sie den Prompt in jedem explizit zugelassenen Eintrag, anstatt `groups["*"]` zu verwenden.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen; dadurch werden nicht alle Absender in diesen Gruppen autorisiert — dies wird weiterhin über `groupPolicy`/`groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für Direktnachrichten keine entsprechende Nebenwirkung: `direct["*"]` stellt lediglich eine Standardkonfiguration bereit, nachdem eine Direktnachricht bereits durch `dmPolicy` zusammen mit `allowFrom` oder Regeln des Kopplungsspeichers zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn alle Gruppen im Stammgeltungsbereich zugelassen werden sollen.
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
            // Dieses Konto definiert eigene Gruppen, daher werden die Stammgruppen
            // vollständig ersetzt. Um einen Platzhalter beizubehalten, definieren Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Konzentrieren Sie sich auf das Projektmanagement.",
            },
            // Nur verwenden, wenn alle Gruppen in diesem Konto zugelassen werden sollen.
            "*": { systemPrompt: "Standard-Prompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert seine eigene direct-Zuordnung, daher werden die direct-Stammeinträge
            // vollständig ersetzt. Um einen Platzhalter beizubehalten, definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt für einen bestimmten geschäftlichen Direktchat." },
            "*": { systemPrompt: "Standard-Prompt für geschäftliche Direktchats." },
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
| Zustellung       | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Mehrere Konten   | `accounts.<id>.enabled`, `accounts.<id>.authDir` und weitere kontospezifische Überschreibungen                              |
| Betrieb          | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Sitzungsverhalten | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalweiterleitung](/de/channels/channel-routing)
- [Multi-Agent-Weiterleitung](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
