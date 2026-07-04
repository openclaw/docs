---
read_when:
    - Werken aan WhatsApp-/webkanaalgedrag of inboxroutering
summary: WhatsApp-kanaalondersteuning, toegangscontroles, bezorggedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:49:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp Plugin te installeren wanneer je die voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom aan wanneer
  de Plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale Plugin-pad.
- Stable/Beta: installeert eerst de officiële `@openclaw/whatsapp` Plugin vanuit ClawHub,
  met npm als fallback.
- De WhatsApp-runtime wordt buiten het kernpakket van OpenClaw op npm gedistribueerd, zodat
  WhatsApp-specifieke runtime-afhankelijkheden bij de externe Plugin blijven.

Handmatige installatie blijft beschikbaar:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gebruik het kale npm-pakket (`@openclaw/whatsapp`) alleen wanneer je de registry-
fallback nodig hebt. Pin alleen een exacte versie wanneer je een reproduceerbare installatie nodig hebt.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle configuratie

<Steps>
  <Step title="WhatsApp-toegangsbeleid configureren">

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

  <Step title="WhatsApp koppelen (QR)">

```bash
openclaw channels login --channel whatsapp
```

    De huidige login is gebaseerd op QR. Zorg er in externe of headless omgevingen voor dat je
    een betrouwbaar pad hebt om de live QR-code af te leveren bij de telefoon die deze zal scannen
    voordat je de login start.

    Voor een specifiek account:

```bash
openclaw channels login --channel whatsapp --account work
```

    Om vóór login een bestaande/aangepaste WhatsApp Web-authenticatiemap te koppelen:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="De Gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Eerste koppelingsaanvraag goedkeuren (bij gebruik van koppelingsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelingsaanvragen verlopen na 1 uur. Openstaande aanvragen zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan WhatsApp waar mogelijk op een apart nummer te gebruiken. (De kanaalmetadata en configuratiestroom zijn geoptimaliseerd voor die opzet, maar configuraties met persoonlijke nummers worden ook ondersteund.)
</Note>

<Warning>
De huidige WhatsApp-configuratiestroom werkt alleen met QR. In de terminal weergegeven QR-codes, screenshots,
PDF's of chatbijlagen kunnen verlopen of onleesbaar worden terwijl ze vanaf een externe machine worden doorgestuurd.
Gebruik voor externe/headless hosts bij voorkeur een direct pad voor QR-afbeeldingsoverdracht in plaats van handmatige terminalopname.
</Warning>

## De huidige aanvrager bellen met MeowCaller (experimenteel)

De WhatsApp Plugin kan `whatsapp_call` beschikbaar maken in agentbeurten die vanuit WhatsApp zijn gestart. De tool
gebruikt [MeowCaller](https://github.com/purpshell/meowcaller) om een WhatsApp-spraakoproep te plaatsen naar
de huidige geautoriseerde aanvrager en speelt een OpenClaw TTS-bericht af nadat die opneemt. De tool
accepteert geen bestemmingsnummer, dus een prompt kan de oproep niet omleiden naar een derde partij.
Deze experimentele mogelijkheid is standaard uitgeschakeld.

<Warning>
MeowCaller is experimenteel, heeft geen getagde release en gebruikt een afzonderlijk gekoppelde whatsmeow-
linked-device-sessie. Het kan de Baileys-referenties van de WhatsApp Plugin niet hergebruiken. Koppelen voegt
een ander gekoppeld apparaat toe aan hetzelfde WhatsApp-account. Scan met de WhatsApp-identiteit die door
OpenClaw wordt gebruikt. Modus met persoonlijk nummer/zelfchat kan zichzelf niet bellen; gebruik een specifiek OpenClaw-nummer
om je persoonlijke nummer te bellen.
</Warning>

<Steps>
  <Step title="Experimentele oproepen inschakelen">

    Voeg `actions.calls: true` toe aan het WhatsApp-kanaal in `openclaw.json`:

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

    Voeg dit samen met je bestaande WhatsApp-configuratie en herstart daarna de Gateway. Wanneer de
    instelling ontbreekt of `false` is, stelt OpenClaw de tool `whatsapp_call` niet beschikbaar aan de agent.

  </Step>

  <Step title="De beoordeelde MeowCaller CLI installeren">

    De adapter verwacht een uitvoerbaar bestand met de naam `meowcaller` op de `PATH` van de Gateway-host.
    Totdat [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) is samengevoegd, bouw je
    de beoordeelde branch op commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Zorg ervoor dat `$HOME/.local/bin` ook op de `PATH` van de Gateway-service staat. Deze revisie biedt
    expliciete opdrachten `pair` en send-only `notify`. `notify` opent geen microfoon, speaker,
    videoapparaat, inkomende audiosink of diagnostische opname. Vervang dit niet door de opdracht
    `play` van de voorbeeld-CLI.

  </Step>

  <Step title="Het MeowCaller-gekoppelde apparaat koppelen">

    Vraag de WhatsApp-agent om de oproepconfiguratie te controleren. De statusactie `whatsapp_call` rapporteert de
    accountspecifieke statusmap en koppelingsopdracht. Voor het standaardaccount:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Voer de opdracht uit in een interactieve terminal. Scan de QR-code vanuit **WhatsApp > Gekoppelde apparaten**
    en wacht op `MeowCaller linked device ready`. De opdracht sluit daarna af. Houd `wa-voip.db`
    privé; dit is de MeowCaller linked-device-sessie. De statusactie `whatsapp_call`
    retourneert de accountspecifieke opdracht en shell wanneer je een niet-standaardaccount gebruikt. Voer op
    Windows de PowerShell-opdracht uit; MeowCaller maakt de opslagmap aan.

  </Step>

  <Step title="TTS configureren en bellen vanuit WhatsApp">

    Configureer een telefoniegeschikte [TTS-provider](/nl/tools/tts), herstart de Gateway en stuur daarna een
    WhatsApp-verzoek zoals `Call me and say the build finished.` De tool bepaalt de afzender
    vanuit vertrouwde inkomende context, synthetiseert een tijdelijk privé-WAV-bestand, voert MeowCaller uit binnen een
    begrensd oproepvenster en verwijdert het audiobestand daarna. OpenClaw geeft de store van het account
    expliciet door, wacht op een nul-exitstatus na opnemen, afspelen en ophangen, en behandelt
    een time-out of niet-nul exit als een mislukte toolaanroep.

  </Step>
</Steps>

Huidige beperkingen:

- alleen een-op-een uitgaande audio-oproepen
- geen willekeurige bestemmingsnummers
- geen gedeelde authenticatie met de chatverbinding
- geen zelfoproepen vanuit modus met persoonlijk nummer/zelfchat
- gesynthetiseerde audio is beperkt tot 60 seconden
- geen ontvangstbewijs voor hoorbaarheid aan handsetzijde buiten voltooiing van opnemen/afspelen/ophangen door MeowCaller
- OpenClaw stopt het begeleidende proces na een begrensd venster van 115-175 seconden, inclusief
  de verbindings-, opname-, afspeel- en afsluitfasen van MeowCaller

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Specifiek nummer (aanbevolen)">
    Dit is de schoonste operationele modus:

    - aparte WhatsApp-identiteit voor OpenClaw
    - duidelijkere DM-allowlists en routeringsgrenzen
    - lagere kans op verwarring door zelfchat

    Minimaal beleidspatroon:

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

  <Accordion title="Fallback met persoonlijk nummer">
    Onboarding ondersteunt modus met persoonlijk nummer en schrijft een zelfchatvriendelijke baseline:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime baseren zelfchatbeschermingen zich op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="Kanaalbereik alleen voor WhatsApp Web">
    Het berichtenplatformkanaal is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen afzonderlijk Twilio WhatsApp-berichtenkanaal in de ingebouwde chatkanaalregistry.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en reconnect-lus.
- De reconnect-watchdog gebruikt WhatsApp Web-transportactiviteit, niet alleen inkomend app-berichtvolume, zodat een stille linked-device-sessie niet uitsluitend wordt herstart omdat niemand recent een bericht heeft gestuurd. Een langere limiet voor applicatiestilte forceert nog steeds een reconnect als transportframes blijven binnenkomen maar er binnen het watchdog-venster geen applicatieberichten worden verwerkt; na een tijdelijke reconnect voor een recent actieve sessie gebruikt die applicatiestiltecontrole de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` beheert WhatsApp Web-applicatiepings, `connectTimeoutMs` beheert de time-out voor de openingshandshake, en `defaultQueryTimeoutMs` beheert Baileys-querywachttijden plus de lokale grenzen van OpenClaw voor uitgaand verzenden/presence en inkomende leesbevestigingsbewerkingen.
- Uitgaand verzenden vereist een actieve WhatsApp-listener voor het doelaccount.
- Groepsverzendingen voegen native vermeldingsmetadata toe voor tokens `@+<digits>` en `@<digits>` in tekst en mediabijschriften wanneer het token overeenkomt met huidige WhatsApp-deelnemersmetadata, inclusief LID-ondersteunde groepen.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De reconnect-watchdog volgt WhatsApp Web-transportactiviteit, niet alleen inkomend app-berichtvolume: stille linked-device-sessies blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere pad voor externe verbreking een reconnect.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` klapt DM's samen naar de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-kanalen/nieuwsbrieven kunnen expliciete uitgaande doelen zijn met hun native `@newsletter` JID. Uitgaand verzenden naar nieuwsbrieven gebruikt kanaalsessiemetadata (`agent:<agentId>:whatsapp:channel:<jid>`) in plaats van DM-sessiesemantiek.
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxyinstellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ackreactie nadat een zichtbare reactie is afgeleverd.

## Goedkeuringsprompts

WhatsApp kan exec- en Plugin-goedkeuringsprompts weergeven met reacties `👍` / `👎`. Aflevering wordt
beheerd door de goedkeuringsdoorstuurconfiguratie op topniveau:

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

`approvals.exec` en `approvals.plugin` zijn onafhankelijk. WhatsApp inschakelen als kanaal koppelt alleen
het transport; het stuurt geen goedkeuringsprompts tenzij de overeenkomende goedkeuringsfamilie is ingeschakeld
en naar WhatsApp routeert. Sessiemodus levert native emoji-goedkeuringen alleen voor goedkeuringen die
afkomstig zijn van WhatsApp. Doelmodus gebruikt de gedeelde doorstuurpipeline voor expliciete WhatsApp-
doelen en maakt geen afzonderlijke approver-DM-fanout.

WhatsApp-goedkeuringsreacties vereisen expliciete WhatsApp-goedkeurders uit `allowFrom` of `"*"`.
`defaultTo` beheert gewone standaardberichtdoelen; het is geen goedkeuringsbevoegde. Handmatige
`/approve`-opdrachten lopen nog steeds via het normale WhatsApp-autorisatiepad voor afzenders voordat
goedkeuringsresolutie plaatsvindt.

## Plugin-hooks en privacy

WhatsApp-inkomende berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groeps-ID's, afzendernamen en sessiecorrelatievelden bevatten. Daarom
zendt WhatsApp inkomende `message_received`-hookpayloads niet uit naar plugins,
tenzij je er expliciet voor kiest:

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

Je kunt de expliciete keuze beperken tot één account:

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

Schakel dit alleen in voor plugins die je vertrouwt om inkomende WhatsApp-berichtinhoud
en ID's te ontvangen.

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy` bepaalt toegang tot directe chats:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert nummers in E.164-stijl (intern genormaliseerd).

    `allowFrom` is een toegangscontrolelijst voor DM-afzenders. Deze blokkeert geen expliciete uitgaande verzendingen naar WhatsApp-groeps-JID's of `@newsletter`-kanaal-JID's.

    Override voor meerdere accounts: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) heeft voorrang op kanaalbrede standaardwaarden voor dat account.

    Details van runtimegedrag:

    - koppelingen worden opgeslagen in de allow-store van het kanaal en samengevoegd met geconfigureerde `allowFrom`
    - geplande automatisering en Heartbeat-ontvangerfallback gebruiken expliciete bezorgdoelen of geconfigureerde `allowFrom`; DM-koppelingsgoedkeuringen zijn geen impliciete Cron- of Heartbeat-ontvangers
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt nooit automatisch uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Allowlist voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, werkt dit als een groeps-allowlist (`"*"` toegestaan)

    2. **Groepsafzenderbeleid** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzender-allowlist wordt overgeslagen
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: alle inkomende groepsberichten blokkeren

    Fallback voor afzender-allowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzender-allowlists worden geëvalueerd vóór vermelding-/antwoordactivering

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtimefallback voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Vermeldingen + /activation">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripties van inkomende voice notes voor geautoriseerde groepsberichten
    - impliciete antwoord-op-botdetectie (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan de vermeldingscontrole; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden afzenders die niet op de allowlist staan nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een gebruiker die wel op de allowlist staat

    Activeringscommando op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Dit is eigenaar-afgeschermd.

  </Tab>
</Tabs>

## Geconfigureerde ACP-bindingen

WhatsApp ondersteunt permanente ACP-bindingen met top-level `bindings[]`-items:

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

- Directe chats komen overeen met E.164-nummers zoals `+15555550123`.
- Groepen komen overeen met WhatsApp-groeps-JID's zoals `120363424282127706@g.us`.
- Groeps-allowlists, afzenderbeleid en vermeldings- of activeringscontroles worden uitgevoerd voordat OpenClaw zorgt dat de geconfigureerde ACP-sessie bestaat.
- Een overeenkomende geconfigureerde ACP-binding is eigenaar van de route. WhatsApp-uitzendgroepen verspreiden die beurt niet naar gewone WhatsApp-sessies.

## Gedrag voor persoonlijk nummer en zelfchat

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-zelfchatbeveiligingen geactiveerd:

- leesbevestigingen overslaan voor zelfchatbeurten
- automatisch triggergedrag voor mention-JID negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken zelfchatantwoorden standaard `[{identity.name}]` of `[openclaw]`

## Berichtnormalisatie en context

<AccordionGroup>
  <Accordion title="Inkomende envelop + antwoordcontext">
    Inkomende WhatsApp-berichten worden verpakt in de gedeelde inkomende envelop.

    Als er een geciteerd antwoord bestaat, wordt context in deze vorm toegevoegd:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwoordmetadatavelden worden ook ingevuld wanneer beschikbaar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, afzender-JID/E.164).
    Wanneer het geciteerde antwoorddoel downloadbare media is, slaat OpenClaw dit op via
    de normale inkomende mediaopslag en stelt het beschikbaar als `MediaPath`/`MediaType`, zodat
    de agent de gerefereerde afbeelding kan inspecteren in plaats van alleen
    `<media:image>` te zien.

  </Accordion>

  <Accordion title="Mediaplaceholders en extractie van locatie/contact">
    Inkomende berichten met alleen media worden genormaliseerd met placeholders zoals:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Geautoriseerde voice notes in groepen worden getranscribeerd vóór de vermeldingscontrole wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de voice note
    het antwoord kan triggeren. Als de transcriptie de bot nog steeds niet vermeldt, wordt de
    transcriptie bewaard in de wachtende groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebodies gebruiken beknopte coördinatentekst. Locatielabels/-opmerkingen en contact-/vCard-details worden weergegeven als fenced onvertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van wachtende groepsgeschiedenis">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt getriggerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    Injectiemarkeringen:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Leesbevestigingen">
    Leesbevestigingen zijn standaard ingeschakeld voor geaccepteerde inkomende WhatsApp-berichten.

    Globaal uitschakelen:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Override per account:

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

    Zelfchatbeurten slaan leesbevestigingen over, zelfs wanneer deze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Bezorging, opdelen en media

<AccordionGroup>
  <Accordion title="Tekst opdelen">
    - standaard chunklimiet: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline`-modus geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op lengteveilig opdelen

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-voice note) en documenten
    - audiomedia wordt verzonden via de Baileys `audio`-payload met `ptt: true`, zodat WhatsApp-clients dit weergeven als een push-to-talk-voice note
    - antwoordpayloads behouden `audioAsVoice`; TTS-voice note-uitvoer voor WhatsApp blijft op dit PTT-pad, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met voice notes
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3-/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus vóór PTT-bezorging
    - `/tts latest` verzendt het nieuwste assistentantwoord als één voice note en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` beheert auto-TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIFs wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - `forceDocument` / `asDocument` verzendt uitgaande afbeeldingen, GIFs en video's via de Baileys-documentpayload om WhatsApp-mediacompressie te vermijden, terwijl de opgeloste bestandsnaam en het MIME-type behouden blijven
    - bij het verzenden van multi-media-antwoordpayloads worden bijschriften toegepast op het eerste media-item, behalve dat PTT-voice notes eerst de audio en zichtbare tekst afzonderlijk verzenden omdat WhatsApp-clients bijschriften bij voice notes niet consistent weergeven
    - mediabron kan HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en fallbackgedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overrides per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (resize/kwaliteitsweep) om binnen limieten te passen, tenzij `forceDocument` / `asDocument` documentbezorging aanvraagt
    - bij mislukte mediaverzending stuurt first-item fallback een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoordcitaat

WhatsApp ondersteunt native antwoordcitaat, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Beheer dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                               |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                      |
| `"first"`   | Alleen de eerste uitgaande antwoordchunk citeren                     |
| `"all"`     | Elke uitgaande antwoordchunk citeren                                 |
| `"batched"` | In wachtrij geplaatste gebatchte antwoorden citeren en directe antwoorden ongeciteerd laten |

Standaard is `"off"`. Overrides per account gebruiken `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Reactieniveau

`channels.whatsapp.reactionLevel` bepaalt hoe breed de agent emoji-reacties op WhatsApp gebruikt:

| Niveau        | Ack-reacties | Door agent geïnitieerde reacties | Beschrijving                                      |
| ------------- | ------------ | -------------------------------- | ------------------------------------------------- |
| `"off"`       | Nee          | Nee                              | Helemaal geen reacties                            |
| `"ack"`       | Ja           | Nee                              | Alleen Ack-reacties (ontvangst vóór antwoord)     |
| `"minimal"`   | Ja           | Ja (conservatief)                | Ack + agentreacties met conservatieve richtlijnen |
| `"extensive"` | Ja           | Ja (aangemoedigd)                | Ack + agentreacties met aangemoedigde richtlijnen |

Standaard: `"minimal"`.

Overrides per account gebruiken `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Bevestigingsreacties

WhatsApp ondersteunt directe Ack-reacties bij ontvangst van inkomende berichten via `channels.whatsapp.ackReaction`.
Ack-reacties worden beperkt door `reactionLevel` — ze worden onderdrukt wanneer `reactionLevel` `"off"` is.

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

Gedragsnotities:

- direct verzonden nadat inkomend verkeer is geaccepteerd (vóór het antwoord)
- als `ackReaction` aanwezig is zonder `emoji`, gebruikt WhatsApp de identiteitsemoji van de geroute agent, met terugval naar "👀"; laat `ackReaction` weg of stel `emoji: ""` in om geen bevestigingsreactie te verzenden
- fouten worden gelogd, maar blokkeren normale antwoordbezorging niet
- groepsmodus `mentions` reageert op beurten die door een vermelding zijn gestart; groepsactivatie `always` werkt als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Lifecycle-statusreacties

Stel `messages.statusReactions.enabled: true` in om WhatsApp de bevestigingsreactie tijdens een beurt te laten vervangen in plaats van een statische ontvangstemoji te laten staan. Wanneer dit is ingeschakeld, gebruikt OpenClaw dezelfde reactiesleuf van het inkomende bericht voor lifecycle-statussen zoals in wachtrij, nadenken, toolactiviteit, Compaction, voltooid en fout.

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

Gedragsnotities:

- `channels.whatsapp.ackReaction` bepaalt nog steeds of statusreacties in aanmerking komen voor directe berichten en groepen.
- De statusreactie voor de wachtrij gebruikt dezelfde effectieve bevestigingsemoji als gewone bevestigingsreacties.
- WhatsApp heeft één botreactiesleuf per bericht, dus lifecycle-updates vervangen de huidige reactie op dezelfde plek.
- `messages.removeAckAfterReply: true` wist de uiteindelijke statusreactie na de geconfigureerde vasthoudtijd voor voltooid/fout.
- Tool-emojicategorieën omvatten `tool`, `coding`, `web`, `deploy`, `build` en `concierge`.

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaard accountselectie: `default` indien aanwezig, anders de eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor lookup

  </Accordion>

  <Accordion title="Referentiepaden en legacy-compatibiliteit">
    - huidig auth-pad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaard-auth in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authstatus voor dat account.

    Wanneer een Gateway bereikbaar is, stopt uitloggen eerst de live WhatsApp-listener voor het geselecteerde account, zodat de gekoppelde sessie geen berichten blijft ontvangen tot de volgende herstart. `openclaw channels remove --channel whatsapp` stopt ook de live-listener voordat accountconfiguratie wordt uitgeschakeld of verwijderd.

    In legacy auth-mappen blijft `oauth.json` behouden terwijl Baileys-authbestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en config-schrijfacties

- Agent-toolondersteuning omvat de WhatsApp-reactieactie (`react`).
- Actiegates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door het kanaal geïnitieerde config-schrijfacties zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet gekoppeld (QR vereist)">
    Symptoom: kanaalstatus meldt niet gekoppeld.

    Oplossing:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Gekoppeld maar verbroken / reconnect-lus">
    Symptoom: gekoppeld account met herhaalde verbrekingen of reconnect-pogingen.

    Stille accounts kunnen verbonden blijven na de normale berichttime-out; de watchdog
    herstart wanneer WhatsApp Web-transportactiviteit stopt, de socket sluit, of
    activiteit op applicatieniveau langer stil blijft dan het langere veiligheidsvenster.

    Als logs herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, stem dan
    Baileys-sockettimings af onder `web.whatsapp`. Begin met het verkorten van
    `keepAliveIntervalMs` tot onder de idle-time-out van je netwerk en verhoog
    `connectTimeoutMs` op trage of verliesgevoelige verbindingen:

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

    Oplossing:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Als de lus blijft bestaan nadat hostconnectiviteit en timing zijn opgelost, maak dan een back-up
    van de auth-map van het account en koppel dat account opnieuw:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldt maar
    `openclaw gateway status` en `openclaw channels status --probe` tonen dat de
    gateway en WhatsApp gezond zijn, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor
    voor legacy crontab-vermeldingen die nog steeds
    `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die verouderde vermeldingen met
    `crontab -e`, omdat Cron de systemd user-bus-omgeving kan missen en
    dat oude script de Gateway-gezondheid verkeerd kan laten rapporteren.

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een TLS-socketverbreking.

    WhatsApp Web-login gebruikt de standaard proxy-omgeving van de gatewayhost (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters, en `NO_PROXY`). Controleer of het gatewayproces de proxy-env erft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken snel wanneer er geen actieve Gateway-listener bestaat voor het doelaccount.

    Zorg dat Gateway actief is en dat het account gekoppeld is.

  </Accordion>

  <Accordion title="Antwoord verschijnt in transcript maar niet in WhatsApp">
    Transcriptrijen registreren wat de agent heeft gegenereerd. WhatsApp-bezorging wordt apart gecontroleerd: OpenClaw behandelt een automatisch antwoord pas als verzonden nadat Baileys een uitgaand bericht-id retourneert voor ten minste één zichtbare tekst- of mediaverzending.

    Bevestigingsreacties zijn onafhankelijke ontvangstbewijzen vóór het antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer gatewaylogs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-vermeldingen in `groups`
    - vermelding-gating (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere vermeldingen overschrijven eerdere, dus houd één `groupPolicy` per scope aan

    Als `channels.whatsapp.groups` aanwezig is, kan WhatsApp nog steeds berichten uit andere groepen waarnemen, maar OpenClaw laat ze vallen vóór sessierouting. Voeg de groeps-JID toe aan `channels.whatsapp.groups` of voeg `groups["*"]` toe om alle groepen toe te laten terwijl afzenderautorisatie onder `groupPolicy` en `groupAllowFrom` blijft.

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp Gateway-runtime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram Gateway-werking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de maps `groups` en `direct`.

Resolutiehiërarchie voor groepsberichten:

De effectieve `groups`-map wordt eerst bepaald: als het account zijn eigen `groups` definieert, vervangt die de root-`groups`-map volledig (geen diepe merge). Promptlookup draait daarna op de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Groepswildcard-systeemprompt** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig afwezig is in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve `direct`-map wordt eerst bepaald: als het account zijn eigen `direct` definieert, vervangt die de root-`direct`-map volledig (geen diepe merge). Promptlookup draait daarna op de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Directe wildcard-systeemprompt** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding volledig afwezig is in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichte override-bucket voor geschiedenis per DM (`dms.<id>.historyLimit`). Promptoverrides staan onder `direct`.
</Note>

**Verschil met Telegram-gedrag voor meerdere accounts:** In Telegram wordt root-`groups` opzettelijk onderdrukt voor alle accounts in een opstelling met meerdere accounts — zelfs accounts die geen eigen `groups` definiëren — om te voorkomen dat een bot groepsberichten ontvangt voor groepen waartoe deze niet behoort. WhatsApp past deze guard niet toe: root-`groups` en root-`direct` worden altijd geërfd door accounts die geen override op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. In een WhatsApp-opstelling met meerdere accounts moet je, als je groeps- of directe prompts per account wilt, de volledige map expliciet onder elk account definiëren in plaats van te vertrouwen op standaardwaarden op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een config-map per groep als de allowlist op chatniveau voor groepen. Op root- of accountscope betekent `groups["*"]` dat "alle groepen worden toegelaten" voor die scope.
- Voeg alleen een wildcard-groep `systemPrompt` toe wanneer je al wilt dat die scope alle groepen toelaat. Als je nog steeds alleen een vaste set groeps-ID's in aanmerking wilt laten komen, gebruik dan geen `groups["*"]` voor de promptstandaard. Herhaal in plaats daarvan de prompt op elke expliciet toegestane groepsvermelding.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` verbreedt de set groepen die groepsafhandeling kan bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Afzendertoegang wordt nog steeds afzonderlijk beheerd door `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` heeft niet hetzelfde neveneffect voor DM's. `direct["*"]` biedt alleen een standaardconfiguratie voor directe chats nadat een DM al is toegelaten door `dmPolicy` plus `allowFrom` of regels uit de pairing-store.

Voorbeeld:

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

## Verwijzingen naar configuratiereferentie

Primaire referentie:

- [Configuratiereferentie - WhatsApp](/nl/gateway/config-channels#whatsapp)

Belangrijke WhatsApp-velden:

- toegang: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- aflevering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- meerdere accounts: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overschrijvingen op accountniveau
- bewerkingen: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Channel-routering](/nl/channels/channel-routing)
- [Routering voor meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
