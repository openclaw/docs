---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Posteingangs-Routing
summary: Unterstützung für den WhatsApp-Kanal, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-07-24T03:40:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7489b37f91775868d0694daea8a0958ee000d1411674d1800bb1e77df5961e68
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet die verknüpfte(n) Sitzung(en); es gibt keinen separaten Twilio-WhatsApp-Kanal.

## Installation

`openclaw onboard` und `openclaw channels add --channel whatsapp` fordern zur Installation des Plugins auf, wenn Sie es zum ersten Mal auswählen; `openclaw channels login --channel whatsapp` bietet denselben Installationsablauf an, wenn das Plugin fehlt. Entwicklungs-Checkouts verwenden den lokalen Plugin-Pfad; Stable-/Beta-Installationen installieren zuerst `@openclaw/whatsapp` aus ClawHub und greifen ersatzweise auf npm zurück. Die WhatsApp-Laufzeit wird außerhalb des OpenClaw-npm-Kernpakets ausgeliefert, daher verbleiben ihre Laufzeitabhängigkeiten beim externen Plugin. Manuelle Installation:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Verwenden Sie das reine npm-Paket (`@openclaw/whatsapp`) nur als Registry-Fallback; fixieren Sie eine exakte Version nur für eine reproduzierbare Installation.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die standardmäßige DM-Richtlinie für unbekannte Absender ist die Kopplung.
  </Card>
  <Card title="Kanalfehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
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

  <Step title="WhatsApp verknüpfen (QR)">

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

  <Step title="Erste DM-Zugriffsanfrage genehmigen (Kopplungsmodus)">

    Öffnen Sie **Settings → Channels → DM access requests**, suchen Sie das WhatsApp-Konto
    und genehmigen Sie den Absender. Wenn Sie die CLI bevorzugen:

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    DM-Zugriffsanfragen laufen nach 1 Stunde ab; pro Konto sind höchstens 3 ausstehende
    Anfragen zulässig. Diese Genehmigung ist vom WhatsApp-Anmelde-QR-Code getrennt, mit dem
    das Konto selbst verknüpft wird.

  </Step>
</Steps>

<Note>
Eine separate WhatsApp-Nummer wird empfohlen (Einrichtung und Metadaten sind dafür optimiert), aber Konfigurationen mit persönlicher Nummer bzw. Selbstchat werden vollständig unterstützt.
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

  <Accordion title="Fallback mit persönlicher Nummer">
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basiskonfiguration: `dmPolicy: "allowlist"`, `allowFrom` einschließlich Ihrer eigenen Nummer, `selfChatMode: true`. Die Selbstchat-Schutzmechanismen der Laufzeit richten sich nach der verknüpften eigenen Nummer sowie nach `allowFrom`.
  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Ein Watchdog überwacht zwei Signale unabhängig voneinander: die reine WhatsApp-Web-Transportaktivität und die Aktivität von Anwendungsnachrichten. Eine ruhige, aber verbundene Sitzung wird nicht neu gestartet, nur weil kürzlich keine Nachricht eingetroffen ist; eine Wiederverbindung wird nur erzwungen, wenn für ein festes internes Zeitfenster keine Transport-Frames mehr eintreffen (nicht benutzerkonfigurierbar) oder Anwendungsnachrichten länger als das 4-Fache des normalen Nachrichten-Timeouts ausbleiben. Direkt nach einer Wiederverbindung einer kürzlich aktiven Sitzung verwendet dieses erste Zeitfenster statt des 4-fachen Zeitfensters den kürzeren normalen Nachrichten-Timeout. OpenClaw kann automatisch auf Offline-Nachrichten antworten, die Baileys zu Beginn dieser Wiederverbindung zustellt, begrenzt durch die Deduplizierungsdauer für eingehende Nachrichten-IDs; beim ersten Start bleibt die kurze Schutzfrist gegen veraltete Verlaufsnachrichten bestehen.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto; andernfalls schlagen Sendungen sofort fehl.
- Gruppensendungen fügen native Erwähnungsmetadaten für `@+<digits>`- und `@<digits>`-Tokens (im Text und in Medienbeschriftungen) hinzu, wenn das Token mit aktuellen Teilnehmermetadaten übereinstimmt; dies schließt LID-basierte Gruppen ein.
- Status- und Broadcast-Chats (`@status`, `@broadcast`) werden ignoriert.
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; der Standard `main` führt DMs in der Hauptsitzung des Agenten zusammen). Gruppensitzungen werden pro JID isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters können über ihre native `@newsletter`-JID explizite ausgehende Ziele sein und verwenden dabei Kanal-Sitzungsmetadaten (`agent:<agentId>:whatsapp:channel:<jid>`) anstelle der DM-Semantik.
- Der WhatsApp-Web-Transport berücksichtigt standardmäßige Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, Varianten in Kleinschreibung). Bevorzugen Sie eine Proxy-Konfiguration auf Hostebene gegenüber kanalspezifischen Einstellungen.

## Aktuell anfragende Person mit MeowCaller anrufen (experimentell)

Das Plugin kann `whatsapp_call` in von WhatsApp ausgehenden Agentendurchläufen bereitstellen. Es verwendet [MeowCaller](https://github.com/purpshell/meowcaller), um einen WhatsApp-Sprachanruf an die aktuell autorisierte anfragende Person zu tätigen und nach Annahme eine OpenClaw-TTS-Nachricht abzuspielen. Das Tool besitzt keinen Parameter für die Zielnummer, sodass ein Prompt den Anruf nicht umleiten kann. Standardmäßig deaktiviert.

<Warning>
MeowCaller ist experimentell, besitzt keine getaggte Version und verwendet eine separat gekoppelte whatsmeow-Sitzung für verknüpfte Geräte — die Baileys-Anmeldedaten des Plugins können nicht wiederverwendet werden. Durch die Kopplung wird demselben WhatsApp-Konto ein weiteres verknüpftes Gerät hinzugefügt; scannen Sie mit der von OpenClaw verwendeten Identität. Im Modus mit persönlicher Nummer bzw. Selbstchat kann die Nummer sich nicht selbst anrufen; verwenden Sie eine dedizierte OpenClaw-Nummer, um Ihre persönliche Nummer anzurufen.
</Warning>

<Steps>
  <Step title="Experimentelle Anrufe aktivieren">

    Fügen Sie `actions.calls: true` zur WhatsApp-Kanalkonfiguration hinzu und starten Sie das Gateway neu:

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

    Wenn die Einstellung fehlt oder `false` ist, stellt OpenClaw das Tool `whatsapp_call` nicht bereit.

  </Step>

  <Step title="Überprüfte MeowCaller-CLI installieren">

    Der Adapter erwartet eine ausführbare Datei `meowcaller` im `PATH` des Gateway-Hosts. Bis [MeowCaller-PR #7](https://github.com/purpshell/meowcaller/pull/7) zusammengeführt wird, erstellen Sie den überprüften Branch:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Stellen Sie sicher, dass `$HOME/.local/bin` im `PATH` des Gateway-Dienstes enthalten ist. Diese Revision verfügt über explizite `pair`- und reine Sende-`notify`-Befehle; `notify` öffnet weder Mikrofon noch Lautsprecher, Videogerät oder Diagnoseaufzeichnung. Verwenden Sie nicht ersatzweise den Befehl `play` der Beispiel-CLI des Upstream-Projekts.

  </Step>

  <Step title="Verknüpftes MeowCaller-Gerät koppeln">

    Bitten Sie den WhatsApp-Agenten, die Anrufeinrichtung zu prüfen (die Statusaktion `whatsapp_call` meldet das kontospezifische Statusverzeichnis und den Kopplungsbefehl). Für das Standardkonto:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Führen Sie dies interaktiv aus, scannen Sie den QR-Code unter **WhatsApp > Linked devices** und warten Sie auf `MeowCaller linked device ready`. Halten Sie `wa-voip.db` geheim — dies ist die MeowCaller-Sitzung. Nicht standardmäßige Konten erhalten über die Statusaktion einen eigenen Speicherpfad; führen Sie unter Windows den entsprechenden PowerShell-Befehl aus.

  </Step>

  <Step title="TTS konfigurieren und über WhatsApp anrufen">

    Konfigurieren Sie einen telefoniefähigen [TTS-Provider](/de/tools/tts), starten Sie das Gateway neu und senden Sie dann eine Anfrage wie `Call me and say the build finished.` Das Tool ermittelt den Absender aus dem vertrauenswürdigen eingehenden Kontext, synthetisiert eine temporäre private WAV-Datei, führt MeowCaller für ein begrenztes Anruffenster aus und löscht anschließend die Audiodatei. OpenClaw übergibt den Speicher des Kontos explizit, wartet nach Annahme/Wiedergabe/Auflegen auf den Exit-Status null und behandelt einen Timeout oder einen Exit-Status ungleich null als fehlgeschlagenen Tool-Aufruf.

  </Step>
</Steps>

Einschränkungen: nur ausgehende Eins-zu-eins-Audioanrufe, keine beliebigen Zielnummern, keine gemeinsame Authentifizierung mit der Chatverbindung, keine Selbstanrufe im Modus mit persönlicher Nummer bzw. Selbstchat, synthetisiertes Audio auf 60 Sekunden begrenzt, keine Empfangsbestätigung für die Hörbarkeit auf dem Endgerät über den Abschluss von Annahme/Wiedergabe/Auflegen durch MeowCaller hinaus, und OpenClaw beendet den Begleitprozess nach einem begrenzten Zeitfenster von 115–175 Sekunden (einschließlich der Verbindungs-, Annahme-, Wiedergabe- und Beendigungsphasen von MeowCaller).

## Genehmigungsaufforderungen

WhatsApp kann Ausführungs- und Plugin-Genehmigungsaufforderungen als `👍`-/`👎`-Reaktionen darstellen, gesteuert durch die übergeordnete Konfiguration für die Weiterleitung von Genehmigungen:

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

`approvals.exec` und `approvals.plugin` sind unabhängig voneinander; die Aktivierung von WhatsApp als Kanal verknüpft nur den Transport und sendet nichts, sofern nicht die entsprechende Genehmigungsfamilie aktiviert und dorthin geroutet wird. Der Sitzungsmodus übermittelt native Emoji-Genehmigungen nur für Genehmigungen, die aus WhatsApp stammen. Der Zielmodus verwendet die gemeinsame Weiterleitungspipeline für explizite Ziele und erzeugt keine separate Auffächerung in Genehmiger-DMs.

WhatsApp-Genehmigungsreaktionen erfordern explizite Genehmiger in `allowFrom` (oder `"*"`). `defaultTo` legt gewöhnliche Standardnachrichtenziele fest, keine Genehmigerliste. Manuelle `/approve`-Befehle durchlaufen vor der Genehmigungsauflösung weiterhin den normalen WhatsApp-Pfad zur Absenderautorisierung.

## Reaktionen auf Fragen

Bei einem `ask_user`-Prompt mit einer einzelnen nicht geheimen Einfachauswahlfrage und einer bis vier Optionen zeigt WhatsApp `1️⃣` bis `4️⃣` neben den Optionsbezeichnungen an. Reagieren Sie auf den zugestellten Prompt mit der passenden Zahl, um ihn zu beantworten. OpenClaw ordnet die Zahl über das Gateway der kanonischen Option zu; veraltete oder doppelte Eingaben werden ignoriert. Prompts mit mehreren Fragen, Mehrfachauswahl oder Freitext können weiterhin nur per Textantwort beantwortet werden. Die normalen WhatsApp-Zulassungsregeln für DMs und Gruppen autorisieren den reagierenden Absender.

## Plugin-Hooks und Datenschutz

Eingehende WhatsApp-Nachrichten können persönliche Inhalte, Telefonnummern, Gruppenkennungen, Absendernamen und Felder zur Sitzungskorrelation enthalten. WhatsApp sendet eingehende `message_received`-Hook-Nutzdaten nicht an Plugins, sofern Sie dies nicht ausdrücklich aktivieren:

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

    `allowFrom` akzeptiert Nummern im E.164-Format (intern normalisiert). Es handelt sich ausschließlich um eine Zugriffskontrollliste für DM-Absender — sie beschränkt keine expliziten ausgehenden Sendungen an Gruppen-JIDs oder `@newsletter`-Kanal-JIDs.

    Überschreibung bei mehreren Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `.allowFrom`) haben für dieses Konto Vorrang vor den Standardeinstellungen auf Kanalebene.

    Laufzeithinweise:

    - Kopplungen bleiben im Allow-Store des Kanals erhalten und werden mit dem konfigurierten `allowFrom` zusammengeführt
    - Geplante Automatisierungen und der Empfänger-Fallback für Heartbeat verwenden explizite Zustellziele oder das konfigurierte `allowFrom`; Genehmigungen von DM-Kopplungen sind nicht implizit Empfänger von Cron/Heartbeat
    - Wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig zulässig
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie sich selbst vom verknüpften Gerät senden)

  </Tab>

  <Tab title="Gruppenrichtlinie und Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`): Wenn `groups` weggelassen wird, kommen alle Gruppen infrage; falls vorhanden, fungiert es als Gruppen-Allowlist (`"*"` lässt alle zu).
    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` umgeht die Absender-Allowlist, `allowlist` erfordert eine Übereinstimmung mit `groupAllowFrom` (oder `*`), `disabled` blockiert alle eingehenden Gruppennachrichten.

    Wenn `groupAllowFrom` nicht gesetzt ist, greifen Absenderprüfungen auf `allowFrom` zurück, sofern es Einträge enthält. Absender-Allowlists werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet.

    Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, greift die Laufzeit auf `groupPolicy: "allowlist"` zurück (mit einem Warnprotokolleintrag), selbst wenn `channels.defaults.groupPolicy` auf einen anderen Wert gesetzt ist.

    <Note>
    Die Auflösung der Gruppenmitgliedschaft verfügt über ein Sicherheitsnetz für ein einzelnes Konto: Wenn nur ein WhatsApp-Konto konfiguriert ist und dessen `accounts.<id>.groups` ein explizit leeres Objekt (`{}`) ist, wird dies als „nicht gesetzt“ behandelt und auf die `channels.whatsapp.groups`-Map auf Root-Ebene zurückgegriffen, statt unbemerkt jede Gruppe zu blockieren. Bei 2+ konfigurierten Konten bleibt eine explizit leere Konto-Map leer und greift nicht auf den Root-Wert zurück — dadurch kann ein Konto absichtlich alle Gruppen deaktivieren, ohne andere Konten zu beeinflussen.
    </Note>

  </Tab>

  <Tab title="Erwähnungen und /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung. Die Erkennung von Erwähnungen umfasst:

    - Explizite WhatsApp-Erwähnungen der Bot-Identität
    - Konfigurierte Regex-Muster für Erwähnungen (`agents.entries.*.groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - Transkripte eingehender Sprachnachrichten für autorisierte Gruppennachrichten
    - Implizite Erkennung einer Antwort an den Bot (der Absender der Antwort entspricht der Bot-Identität)

    Sicherheit: Ein Zitat/eine Antwort erfüllt nur die Erwähnungsanforderung — es gewährt **keine** Absenderautorisierung. Mit `groupPolicy: "allowlist"` bleiben Absender, die nicht in der Allowlist stehen, selbst dann blockiert, wenn sie auf die Nachricht eines zugelassenen Benutzers antworten.

    Aktivierungsbefehl auf Sitzungsebene: `/activation mention` oder `/activation always`. Dadurch wird der Sitzungsstatus aktualisiert (nicht die globale Konfiguration); der Vorgang ist dem Eigentümer vorbehalten.

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

Direktchats werden anhand von E.164-Nummern abgeglichen; Gruppen anhand von WhatsApp-Gruppen-JIDs. Gruppen-Allowlists, Absenderrichtlinie und die Aktivierungsanforderungen für Erwähnungen werden ausgeführt, bevor OpenClaw sicherstellt, dass die gebundene ACP-Sitzung vorhanden ist. Eine übereinstimmende Bindung übernimmt die Route — Broadcast-Gruppen verteilen diesen Durchlauf nicht auf gewöhnliche WhatsApp-Sitzungen.

## Verhalten bei persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` enthalten ist, werden Schutzmaßnahmen für Selbstchats aktiviert: Lesebestätigungen für Selbstchat-Durchläufe werden übersprungen, das automatische Auslösen durch Erwähnungs-JIDs, das Sie selbst benachrichtigen würde, wird ignoriert, und Antworten werden standardmäßig an `[{identity.name}]` (oder `[openclaw]`) gesendet, wenn `responsePrefix` für den Kanal/das Konto nicht gesetzt ist.

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag und Antwortkontext">
    Eingehende Nachrichten werden in den gemeinsamen eingehenden Umschlag eingebettet. Bei einer zitierten Antwort wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwortmetadaten (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164) werden ausgefüllt, sofern verfügbar. Wenn das zitierte Ziel herunterladbare Medien enthält, speichert OpenClaw diese über den normalen Speicher für eingehende Medien und stellt `MediaPath`/`MediaType` bereit, damit der Agent sie direkt prüfen kann, statt nur `<media:image>` zu sehen.

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standorten/Kontakten">
    Nachrichten, die nur Medien enthalten, werden in Platzhalter normalisiert: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Autorisierte Gruppensprachnachrichten werden vor der Erwähnungsanforderung transkribiert, wenn der Textkörper nur `<media:audio>` enthält, sodass das Aussprechen der Bot-Erwähnung in der Sprachnachricht die Antwort auslösen kann. Wenn das Transkript den Bot weiterhin nicht erwähnt, verbleibt es statt des unverarbeiteten Platzhalters im ausstehenden Gruppenverlauf.

    Standortinhalte werden als knapper Koordinatentext dargestellt. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als abgegrenzte, nicht vertrauenswürdige Metadaten dargestellt, nicht als eingebetteter Prompt-Text.

  </Accordion>

  <Accordion title="Einfügen des ausstehenden Gruppenverlaufs">
    Nicht verarbeitete Gruppennachrichten werden gepuffert und als Kontext eingefügt, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`, Fallback `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügungsmarkierungen: `[Chat messages since your last reply - for context]` und `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Standardmäßig für akzeptierte eingehende Nachrichten aktiviert. Global deaktivieren:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Selbstchat-Durchläufe überspringen Lesebestätigungen, selbst wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - Standardlimit für Textabschnitte: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift anschließend auf eine längensichere Aufteilung zurück

  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - Unterstützt Bild-, Video-, Audio- (PTT-Sprachnachricht) und Dokument-Nutzdaten
    - Audio wird als Baileys-Nutzdaten vom Typ `audio` mit `ptt: true` gesendet und als Push-to-Talk-Sprachnachricht dargestellt; `audioAsVoice` bleibt bei Antwort-Nutzdaten erhalten, sodass die Ausgabe von TTS-Sprachnachrichten unabhängig vom Quellformat des Providers diesen Pfad verwendet
    - Natives Ogg/Opus-Audio wird als `audio/ogg; codecs=opus` gesendet; alle anderen Formate (einschließlich der MP3-/WebM-Ausgabe von Microsoft Edge TTS) werden vor der PTT-Zustellung mit `ffmpeg` in Mono-Ogg/Opus mit 48 kHz transkodiert
    - `/tts latest` sendet die neueste Assistentenantwort als eine Sprachnachricht und verhindert wiederholte Sendungen derselben Antwort; `/tts chat on|off|default` steuert automatisches TTS für den aktuellen Chat
    - `gifPlayback: true` bei Videosendungen aktiviert die Wiedergabe als animiertes GIF
    - `forceDocument`/`asDocument` leitet ausgehende Bilder, GIFs und Videos über die Baileys-Dokument-Nutzdaten, um die Medienkomprimierung von WhatsApp zu vermeiden, wobei der aufgelöste Dateiname und MIME-Typ erhalten bleiben
    - Beschriftungen gelten für das erste Medienelement einer Antwort mit mehreren Medien, ausgenommen PTT-Sprachnachrichten: Das Audio wird zuerst ohne Beschriftung gesendet, anschließend wird die Beschriftung als separate Textnachricht gesendet (WhatsApp-Clients stellen Beschriftungen von Sprachnachrichten nicht konsistent dar)
    - Die Medienquelle kann HTTP(S), `file://` oder ein lokaler Pfad sein

  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherlimit für eingehende Medien und Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standardwert `50`)
    - Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Änderung der Größe/Qualitätsdurchlauf), um die Limits einzuhalten, sofern `forceDocument`/`asDocument` keine Dokumentzustellung anfordert
    - Wenn das Senden von Medien fehlschlägt, sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort unbemerkt zu verwerfen

  </Accordion>
</AccordionGroup>

## Antwortzitate

`channels.whatsapp.replyToMode` steuert das native Zitieren bei Antworten (ausgehende Antworten zitieren sichtbar die eingehende Nachricht):

| Wert              | Verhalten                                                        |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (Standardwert) | Nie zitieren; als einfache Nachricht senden                           |
| `"first"`         | Nur den ersten ausgehenden Antwortabschnitt zitieren                      |
| `"all"`           | Jeden ausgehenden Antwortabschnitt zitieren                               |
| `"batched"`       | In der Warteschlange gesammelte Antworten zitieren; sofortige Antworten unzitiert lassen |

Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie umfassend der Agent Emoji-Reaktionen verwendet:

| Stufe                 | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Nein          | Nein                       |
| `"ack"`               | Ja            | Nein                       |
| `"minimal"` (Standardwert) | Ja            | Ja, zurückhaltende Vorgabe |
| `"extensive"`         | Ja            | Ja, empfohlene Vorgabe     |

Kontospezifische Überschreibung: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Bestätigungsreaktionen

`channels.whatsapp.ackReaction` sendet beim Eingang einer eingehenden Nachricht sofort eine Reaktion, gesteuert durch `reactionLevel` (unterdrückt, wenn `"off"`):

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // immer | Erwähnungen | nie
      },
    },
  },
}
```

Hinweise: Wird unmittelbar nach Annahme der eingehenden Nachricht gesendet (vor der Antwort); wenn `ackReaction` ohne `emoji` vorhanden ist, verwendet WhatsApp das Identitäts-Emoji des weitergeleiteten Agenten und greift auf „👀“ zurück (lassen Sie `ackReaction` weg oder setzen Sie `emoji: ""`, um keine Bestätigung zu senden); Fehler werden protokolliert, blockieren aber nicht die Zustellung der Antwort; der Gruppenmodus `mentions` reagiert nur bei durch Erwähnungen ausgelösten Durchläufen, während die Gruppenaktivierung `always` diese Prüfung umgeht; WhatsApp verwendet ausschließlich `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` gilt hier nicht).

## Reaktionen auf Lebenszyklusstatus

Setzen Sie `messages.statusReactions.enabled: true`, damit WhatsApp die Bestätigungsreaktion während eines Durchlaufs ersetzt, statt ein statisches Empfangs-Emoji beizubehalten, und dabei Zustände wie „in der Warteschlange“, „denkt nach“, Werkzeugaktivität, Compaction, „abgeschlossen“ und „Fehler“ durchläuft:

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
    },
  },
}
```

Hinweise: `channels.whatsapp.ackReaction` steuert weiterhin die Berechtigung für Direktnachrichten und Gruppen; der Warteschlangenzustand verwendet dasselbe effektive Emoji wie einfache Bestätigungsreaktionen; WhatsApp verfügt pro Nachricht über einen Bot-Reaktionsplatz, daher ersetzen Lebenszyklusaktualisierungen die aktuelle Reaktion direkt und stellen die Bestätigung nach dem abschließenden Erfolgs-/Fehlerzustand wieder her.

## Mehrere Konten und Zugangsdaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    Konto-IDs stammen aus `channels.whatsapp.accounts`. Für die Standardkontoauswahl wird `default` verwendet, sofern vorhanden; andernfalls die erste konfigurierte Konto-ID (alphabetisch sortiert). Konto-IDs werden intern für die Suche normalisiert.
  </Accordion>

  <Accordion title="Anmeldedatenpfade und Legacy-Kompatibilität">
    - aktueller Authentifizierungspfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (Sicherung: `creds.json.bak`)
    - die veraltete Standardauthentifizierung in `~/.openclaw/credentials/` wird für Abläufe mit dem Standardkonto weiterhin erkannt/migriert

  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto. Wenn ein Gateway erreichbar ist, beendet die Abmeldung zuerst den aktiven Listener für dieses Konto, sodass die verknüpfte Sitzung bereits vor dem nächsten Neustart keine Nachrichten mehr empfängt. `openclaw channels remove --channel whatsapp` beendet den aktiven Listener ebenfalls, bevor die Kontokonfiguration deaktiviert oder gelöscht wird.

    In veralteten Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während die Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsänderungen

- Die Unterstützung für Agent-Tools umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionsfreigaben: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (vorhandene Aktionen verwenden standardmäßig `true`), `channels.whatsapp.actions.calls` (Standardwert `false`, siehe MeowCaller oben).
- Vom Kanal initiierte Konfigurationsänderungen sind standardmäßig aktiviert; deaktivieren Sie sie über `channels.whatsapp.configWrites: false`.

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

    Konten mit wenig Aktivität können über das normale Nachrichten-Timeout hinaus verbunden bleiben; der Watchdog startet nur neu, wenn die WhatsApp-Web-Transportaktivität aussetzt, der Socket geschlossen wird oder die Aktivität auf Anwendungsebene über das längere Sicherheitszeitfenster hinaus ausbleibt (siehe Laufzeitmodell oben).

    Lösung:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Wenn die Schleife nach Behebung der Hostkonnektivität und der Zeitsteuerung weiterhin besteht, sichern Sie das Authentifizierungsverzeichnis des Kontos und verknüpfen Sie es erneut:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Wenn `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldet, aber `openclaw gateway status` und `openclaw channels status --probe` beide einen fehlerfreien Zustand anzeigen, führen Sie `openclaw doctor` aus. Unter Linux warnt doctor vor veralteten crontab-Einträgen, die das außer Betrieb genommene Skript `~/.openclaw/bin/ensure-whatsapp.sh` aufrufen; entfernen Sie diese Einträge mit `crontab -e` — Cron verfügt möglicherweise nicht über die systemd-Benutzerbus-Umgebung, wodurch dieses alte Skript den Zustand des Gateways falsch melden kann.

  </Accordion>

  <Accordion title="Zeitüberschreitung bei der QR-Anmeldung hinter einem Proxy">
    Symptom: `openclaw channels login --channel whatsapp` schlägt mit `status=408 Request Time-out` oder einer Trennung des TLS-Sockets fehl, bevor ein verwendbarer QR-Code angezeigt wird.

    Die WhatsApp-Web-Anmeldung verwendet die standardmäßige Proxy-Umgebung des Gateway-Hosts (`HTTPS_PROXY`, `HTTP_PROXY`, Varianten in Kleinbuchstaben, `NO_PROXY`). Stellen Sie sicher, dass der Gateway-Prozess die Proxy-Umgebungsvariablen übernimmt und dass `NO_PROXY` nicht mit `mmg.whatsapp.net` übereinstimmt.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendevorgänge schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist. Stellen Sie sicher, dass das Gateway ausgeführt wird und das Konto verknüpft ist.
  </Accordion>

  <Accordion title="Antwort erscheint im Transkript, aber nicht in WhatsApp">
    Transkriptzeilen erfassen, was der Agent generiert hat; die Zustellung über WhatsApp wird separat geprüft. OpenClaw betrachtet eine automatische Antwort erst dann als gesendet, wenn Baileys für mindestens einen sichtbaren Text- oder Medienversand eine ID der ausgehenden Nachricht zurückgibt.

    Bestätigungsreaktionen sind unabhängige Empfangsbestätigungen vor der Antwort — eine erfolgreiche Reaktion belegt nicht, dass die nachfolgende Text-/Medienantwort akzeptiert wurde. Prüfen Sie die Gateway-Protokolle auf `auto-reply delivery failed` oder `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge: `groupPolicy`, `groupAllowFrom`/`allowFrom`, Zulassungslisteneinträge in `groups`, Erwähnungsprüfung (`requireMention` + Erwähnungsmuster) und doppelte Schlüssel in `openclaw.json` (spätere JSON5-Einträge überschreiben frühere — verwenden Sie pro Geltungsbereich nur ein `groupPolicy`).

    Wenn `channels.whatsapp.groups` vorhanden ist, kann WhatsApp weiterhin Nachrichten aus anderen Gruppen beobachten, OpenClaw verwirft sie jedoch vor dem Sitzungsrouting. Fügen Sie die Gruppen-JID zu `channels.whatsapp.groups` hinzu oder fügen Sie `groups["*"]` hinzu, um alle Gruppen zuzulassen, während die Absenderautorisierung weiterhin über `groupPolicy`/`groupAllowFrom` gesteuert wird.

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    OpenClaw-Gateways benötigen Node. Bun stellt die vom kanonischen Zustandsspeicher verwendete API `node:sqlite` nicht bereit, und doctor migriert veraltete Bun-Dienste zu Node.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt über die Zuordnungen `groups` und `direct` System-Prompts im Telegram-Stil für Gruppen und Direktchats.

Auflösung für Gruppennachrichten: Zuerst wird die wirksame Zuordnung `groups` bestimmt — wenn das Konto überhaupt einen eigenen Schlüssel `groups` definiert, ersetzt dieser die Stammzuordnung `groups` vollständig (keine tiefe Zusammenführung). Die Prompt-Suche erfolgt anschließend in dieser einen resultierenden Zuordnung:

1. **Gruppenspezifischer Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der Gruppeneintrag vorhanden **und** sein Schlüssel `systemPrompt` definiert ist. Eine leere Zeichenfolge (`""`) unterdrückt den Platzhalter und wendet keinen Prompt an.
2. **Gruppen-Platzhalter-Prompt** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag fehlt oder ohne einen Schlüssel `systemPrompt` vorhanden ist.

Die Auflösung für Direktnachrichten folgt demselben Muster anhand der Zuordnung `direct` und `direct["*"]`.

<Note>
`dms` bleibt der kompakte Bucket für DM-spezifische Verlaufsüberschreibungen (`dms.<id>.historyLimit`). Prompt-Überschreibungen befinden sich unter `direct`.
</Note>

<Note>
Dieses Verhalten, bei dem das Konto für die Prompt-Auflösung den Stamm ersetzt, ist eine einfache flache Überschreibung: Jeder Konto-Schlüssel `groups`/`direct`, einschließlich eines ausdrücklich leeren Objekts, ersetzt die Stammzuordnung. Es unterscheidet sich von der oben beschriebenen Prüfung der Gruppenmitgliedschafts-Zulassungsliste, die für ein versehentlich leeres `groups: {}` ein Sicherheitsnetz für Einzelkonten besitzt.
</Note>

**Unterschied zu Telegram:** Telegram unterdrückt das Stamm-`groups` für jedes Konto in einer Mehrkontoeinrichtung (auch für Konten ohne eigenes `groups`), damit ein Bot keine Gruppennachrichten aus Gruppen empfängt, denen er nicht angehört. WhatsApp wendet diese Schutzmaßnahme nicht an — Stamm-`groups`/`direct` werden unabhängig von der Anzahl der Konten von jedem Konto ohne eigene Überschreibung geerbt. Definieren Sie in einer WhatsApp-Mehrkontoeinrichtung die vollständige Zuordnung ausdrücklich unter jedem Konto, wenn Sie kontospezifische Prompts verwenden möchten.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine gruppenspezifische Konfigurationszuordnung als auch die Zulassungsliste für Gruppen auf Chat-Ebene. Sowohl im Stamm- als auch im Kontogeltungsbereich bedeutet `groups["*"]`: „Alle Gruppen sind für diesen Geltungsbereich zugelassen.“
- Fügen Sie den Platzhalter `systemPrompt` nur hinzu, wenn dieser Geltungsbereich ohnehin alle Gruppen zulassen soll. Um nur eine feste Gruppe von Gruppen-IDs zuzulassen, wiederholen Sie den Prompt in jedem ausdrücklich zugelassenen Eintrag, statt `groups["*"]` zu verwenden.
- Gruppenzulassung und Absenderautorisierung sind separate Prüfungen. `groups["*"]` erweitert die Gruppen, die zur Gruppenverarbeitung gelangen; dadurch wird nicht jeder Absender in diesen Gruppen autorisiert — dies wird weiterhin durch `groupPolicy`/`groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für DMs keine entsprechende Nebenwirkung: `direct["*"]` stellt lediglich eine Standardkonfiguration bereit, nachdem eine DM bereits durch `dmPolicy` zusammen mit `allowFrom` oder durch Regeln des Kopplungsspeichers zugelassen wurde.

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
            // Dieses Konto definiert eigene groups, daher werden die Stamm-groups
            // vollständig ersetzt. Um einen Platzhalter beizubehalten, definieren Sie "*" auch hier ausdrücklich.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Konzentrieren Sie sich auf das Projektmanagement.",
            },
            // Nur verwenden, wenn alle Gruppen in diesem Konto zugelassen werden sollen.
            "*": { systemPrompt: "Standard-Prompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Zuordnung, daher werden die direct-Stammeinträge
            // vollständig ersetzt. Um einen Platzhalter beizubehalten, definieren Sie "*" auch hier ausdrücklich.
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
| Betrieb          | `configWrites`, `enabled`                                                                                      |
| Eingangs-Batching | `messages.inbound.debounceMs`, `messages.inbound.byChannel.whatsapp`                                           |
| Sitzungsverhalten | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Verwandte Themen

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanalrouting](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
