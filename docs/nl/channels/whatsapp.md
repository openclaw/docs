---
read_when:
    - Werken aan gedrag van WhatsApp-/webkanalen of inboxroutering
summary: Ondersteuning voor WhatsApp-kanalen, toegangscontroles, aflevergedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:13:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productierijp via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp-Plugin te installeren wanneer je deze voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom wanneer
  de Plugin nog niet aanwezig is.
- Ontwikkelkanaal + git-checkout: gebruikt standaard het lokale Plugin-pad.
- Stable/Beta: installeert eerst de officiële `@openclaw/whatsapp`-Plugin vanuit ClawHub,
  met npm als fallback.
- De WhatsApp-runtime wordt buiten het kernpakket van OpenClaw op npm gedistribueerd, zodat
  WhatsApp-specifieke runtime-afhankelijkheden bij de externe Plugin blijven.

Handmatig installeren blijft beschikbaar:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gebruik het kale npm-pakket (`@openclaw/whatsapp`) alleen wanneer je de registry-
fallback nodig hebt. Pin alleen een exacte versie wanneer je een reproduceerbare installatie nodig hebt.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige patronen en voorbeelden voor kanaalconfiguratie.
  </Card>
</CardGroup>

## Snelle installatie

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
    een betrouwbaar pad hebt om de live QR-code te leveren aan de telefoon die deze zal scannen
    voordat je login start.

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

  <Step title="De gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Eerste koppelingsverzoek goedkeuren (bij gebruik van koppelingsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelingsverzoeken verlopen na 1 uur. Openstaande verzoeken zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan WhatsApp waar mogelijk op een apart nummer te draaien. (De kanaalmetadata en installatiestroom zijn voor die opzet geoptimaliseerd, maar opzetten met een persoonlijk nummer worden ook ondersteund.)
</Note>

<Warning>
De huidige WhatsApp-installatiestroom is alleen QR. In de terminal weergegeven QR-codes, screenshots,
PDF's of chatbijlagen kunnen verlopen of onleesbaar worden terwijl ze worden doorgestuurd
vanaf een externe machine. Geef voor externe/headless hosts de voorkeur aan een direct pad voor
QR-afbeeldingsoverdracht boven handmatige terminalvastlegging.
</Warning>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciaal nummer (aanbevolen)">
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
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een basisconfiguratie die geschikt is voor zelfchat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    In runtime gebruiken zelfchatbeschermingen het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="Alleen WhatsApp Web-kanaalbereik">
    Het kanaal voor het berichtenplatform is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen apart Twilio WhatsApp-berichtenkanaal in de ingebouwde chatkanaalregistry.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en reconnect-loop.
- De reconnect-watchdog gebruikt WhatsApp Web-transportactiviteit, niet alleen het volume van inkomende app-berichten, zodat een stille gekoppeld-apparaat-sessie niet uitsluitend wordt herstart omdat niemand recent een bericht heeft gestuurd. Een langere limiet voor applicatiestilte forceert nog steeds een reconnect als transportframes blijven binnenkomen maar er binnen het watchdog-venster geen applicatieberichten worden verwerkt; na een tijdelijke reconnect voor een recent actieve sessie gebruikt die controle op applicatiestilte de normale bericht-time-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` beheert WhatsApp Web-applicatiepings, `connectTimeoutMs` beheert de time-out voor de openingshandshake, en `defaultQueryTimeoutMs` beheert Baileys-querywachttijden plus de grenzen voor lokale uitgaande verzend-/aanwezigheidsbewerkingen en inkomende leesbevestigingsbewerkingen van OpenClaw.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Groepsverzendingen voegen native mentionmetadata toe voor `@+<digits>`- en `@<digits>`-tokens in tekst en mediabijschriften wanneer het token overeenkomt met de huidige WhatsApp-deelnemersmetadata, inclusief groepen met LID-ondersteuning.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De reconnect-watchdog volgt WhatsApp Web-transportactiviteit, niet alleen het volume van inkomende app-berichten: stille gekoppeld-apparaat-sessies blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere pad voor externe verbreking een reconnect.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` vouwt DM's samen naar de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters kunnen expliciete uitgaande doelen zijn met hun native `@newsletter`-JID. Uitgaande nieuwsbriefverzendingen gebruiken kanaalsessiemetadata (`agent:<agentId>:whatsapp:channel:<jid>`) in plaats van DM-sessiesemantiek.
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan hostniveau-proxyconfiguratie boven kanaalspecifieke WhatsApp-proxyinstellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ackreactie nadat een zichtbare reactie is afgeleverd.

## Goedkeuringsprompts

WhatsApp kan prompts voor exec- en Plugin-goedkeuring weergeven met `👍` / `👎`-reacties. Levering wordt
beheerd door de goedkeuringsforwardingconfiguratie op topniveau:

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

`approvals.exec` en `approvals.plugin` zijn onafhankelijk. WhatsApp als kanaal inschakelen koppelt alleen
het transport; het verzendt geen goedkeuringsprompts tenzij de bijbehorende goedkeuringsfamilie is ingeschakeld
en naar WhatsApp routeert. Sessiemodus levert native emoji-goedkeuringen alleen voor goedkeuringen die
vanuit WhatsApp ontstaan. Doelmodus gebruikt de gedeelde forwardingpipeline voor expliciete WhatsApp-
doelen en maakt geen aparte fanout voor goedkeurders-DM's.

WhatsApp-goedkeuringsreacties vereisen expliciete WhatsApp-goedkeurders uit `allowFrom` of `"*"`.
`defaultTo` beheert gewone standaard berichtdoelen; het is geen goedkeuringsgoedkeurder. Handmatige
`/approve`-commando's lopen nog steeds door het normale WhatsApp-autorisatiepad voor afzenders voordat
goedkeuringsresolutie plaatsvindt.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groeps-ID's, afzendernamen en sessiecorrelatievelden bevatten. Daarom
broadcast WhatsApp geen inkomende `message_received`-hookpayloads naar Plugins
tenzij je daar expliciet voor kiest:

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

Je kunt de opt-in beperken tot één account:

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

Schakel dit alleen in voor Plugins die je vertrouwt om inkomende WhatsApp-berichtinhoud
en ID's te ontvangen.

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy` beheert directe chattoegang:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert E.164-achtige nummers (intern genormaliseerd).

    `allowFrom` is een toegangscontrolelijst voor DM-afzenders. Het beperkt geen expliciete uitgaande verzendingen naar WhatsApp-groeps-JID's of `@newsletter`-kanaal-JID's.

    Override voor meerdere accounts: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) krijgen voorrang op kanaalniveau-standaarden voor dat account.

    Details van runtimegedrag:

    - koppelingen worden bewaard in de kanaal-allow-store en samengevoegd met geconfigureerde `allowFrom`
    - geplande automatisering en Heartbeat-ontvangerfallback gebruiken expliciete leveringsdoelen of geconfigureerde `allowFrom`; DM-koppelingsgoedkeuringen zijn geen impliciete Cron- of Heartbeat-ontvangers
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt nooit automatisch uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Allowlist voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, fungeert dit als een allowlist voor groepen (`"*"` toegestaan)

    2. **Beleid voor groepsafzenders** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist voor afzenders overgeslagen
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: blokkeer alle inkomende groepsberichten

    Fallback voor afzender-allowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzender-allowlists worden geëvalueerd vóór mention-/antwoordactivering

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtimefallback voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Mentions + /activation">
    Groepsantwoorden vereisen standaard een mention.

    Mention-detectie omvat:

    - expliciete WhatsApp-mentions van de botidentiteit
    - geconfigureerde regexpatronen voor mentions (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripties van inkomende spraaknotities voor geautoriseerde groepsberichten
    - impliciete reply-to-bot-detectie (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan mention-gating; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden niet-geallowliste afzenders nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een geallowliste gebruiker

    Activeringscommando op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt sessiestatus bij (geen globale configuratie). Het is owner-gated.

  </Tab>
</Tabs>

## Geconfigureerde ACP-bindingen

WhatsApp ondersteunt persistente ACP-bindingen met `bindings[]`-items op topniveau:

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

- Directe chats matchen E.164-nummers zoals `+15555550123`.
- Groepen matchen WhatsApp-groeps-JID's zoals `120363424282127706@g.us`.
- Groepsallowlists, afzenderbeleid en vermeldings- of activeringsgating worden uitgevoerd voordat OpenClaw ervoor zorgt dat de geconfigureerde ACP-sessie bestaat.
- Een gematchte geconfigureerde ACP-binding is eigenaar van de route. WhatsApp-broadcastgroepen waaieren die beurt niet uit naar gewone WhatsApp-sessies.

## Gedrag voor persoonlijk nummer en self-chat

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-self-chatbeveiligingen actief:

- leesbevestigingen overslaan voor self-chatbeurten
- automatisch triggergedrag via mention-JID negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken self-chatantwoorden standaard `[{identity.name}]` of `[openclaw]`

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

    Metadatavelden voor antwoorden worden ook gevuld wanneer beschikbaar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, afzender-JID/E.164).
    Wanneer het geciteerde antwoorddoel downloadbare media is, slaat OpenClaw deze op via
    de normale inkomende mediaopslag en stelt deze beschikbaar als `MediaPath`/`MediaType`, zodat
    de agent de gerefereerde afbeelding kan inspecteren in plaats van alleen
    `<media:image>` te zien.

  </Accordion>

  <Accordion title="Mediaplaceholders en locatie-/contactextractie">
    Inkomende berichten met alleen media worden genormaliseerd met placeholders zoals:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Geautoriseerde groepsspraaknotities worden getranscribeerd vóór vermeldingsgating wanneer de
    body alleen `<media:audio>` is, zodat het noemen van de botvermelding in de spraaknotitie
    het antwoord kan triggeren. Als het transcript de bot nog steeds niet vermeldt, wordt het
    transcript bewaard in de wachtende groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebody's gebruiken beknopte coördinatentekst. Locatielabels/opmerkingen en contact-/vCard-details worden weergegeven als fenced onvertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van wachtende groepsgeschiedenis">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt getriggerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    Injectiemarkers:

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

    Overschrijving per account:

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

    Self-chatbeurten slaan leesbevestigingen over, zelfs wanneer deze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Bezorging, chunking en media

<AccordionGroup>
  <Accordion title="Tekstchunking">
    - standaard chunklimiet: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - de modus `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op chunking die veilig is qua lengte

  </Accordion>

  <Accordion title="Gedrag voor uitgaande media">
    - ondersteunt payloads voor afbeelding, video, audio (PTT-spraaknotitie) en document
    - audiomedia wordt verzonden via de Baileys-`audio`-payload met `ptt: true`, zodat WhatsApp-clients deze weergeven als een push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-spraaknotitie-uitvoer voor WhatsApp blijft op dit PTT-pad, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3-/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus vóór PTT-bezorging
    - `/tts latest` verzendt het nieuwste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` beheert auto-TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIF's wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - `forceDocument` / `asDocument` verzendt uitgaande afbeeldingen, GIF's en video's via de Baileys-documentpayload om WhatsApp-mediacompressie te vermijden terwijl de opgeloste bestandsnaam en het MIME-type behouden blijven
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve dat PTT-spraaknotities eerst de audio en zichtbare tekst apart verzenden omdat WhatsApp-clients bijschriften bij spraaknotities niet consistent weergeven
    - mediabron kan HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en fallbackgedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijvingen per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (formaat wijzigen/kwaliteitssweep) om binnen limieten te passen, tenzij `forceDocument` / `asDocument` documentbezorging aanvraagt
    - bij mislukte mediaverzending verzendt de fallback voor het eerste item een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Beheer dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                               |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als gewoon bericht                           |
| `"first"`   | Alleen de eerste uitgaande antwoordchunk citeren                      |
| `"all"`     | Elke uitgaande antwoordchunk citeren                                  |
| `"batched"` | In de wachtrij geplaatste gebatchte antwoorden citeren en directe antwoorden niet citeren |

Standaard is `"off"`. Overschrijvingen per account gebruiken `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Niveau        | Ack-reacties | Door agent geïnitieerde reacties | Beschrijving                                     |
| ------------- | ------------ | --------------------------------- | ------------------------------------------------ |
| `"off"`       | Nee          | Nee                               | Helemaal geen reacties                           |
| `"ack"`       | Ja           | Nee                               | Alleen ack-reacties (ontvangst vóór antwoord)    |
| `"minimal"`   | Ja           | Ja (conservatief)                 | Ack + agentreacties met conservatieve richtlijnen |
| `"extensive"` | Ja           | Ja (aangemoedigd)                 | Ack + agentreacties met aangemoedigde richtlijnen |

Standaard: `"minimal"`.

Overschrijvingen per account gebruiken `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp ondersteunt directe ack-reacties bij inkomende ontvangst via `channels.whatsapp.ackReaction`.
Ack-reacties worden begrensd door `reactionLevel` — ze worden onderdrukt wanneer `reactionLevel` `"off"` is.

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

- onmiddellijk verzonden nadat inkomend is geaccepteerd (vóór antwoord)
- als `ackReaction` aanwezig is zonder `emoji`, gebruikt WhatsApp de identiteits-emoji van de gerouteerde agent, met fallback naar "👀"; laat `ackReaction` weg of stel `emoji: ""` in om geen ack-reactie te verzenden
- fouten worden gelogd maar blokkeren normale antwoordbezorging niet
- groepsmodus `mentions` reageert op door vermeldingen getriggerde beurten; groepsactivering `always` fungeert als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Reacties voor levenscyclusstatus

Stel `messages.statusReactions.enabled: true` in om WhatsApp de ack-reactie tijdens een beurt te laten vervangen in plaats van een statische ontvangst-emoji te laten staan. Wanneer dit is ingeschakeld, gebruikt OpenClaw dezelfde reactieruimte voor inkomende berichten voor levenscyclusstatussen zoals in wachtrij geplaatst, denken, toolactiviteit, compaction, gereed en fout.

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
- De statusreactie voor wachtrij gebruikt dezelfde effectieve ack-emoji als gewone ack-reacties.
- WhatsApp heeft één botreactieruimte per bericht, dus levenscyclusupdates vervangen de huidige reactie op dezelfde plek.
- `messages.removeAckAfterReply: true` wist de uiteindelijke statusreactie na de geconfigureerde gereed-/foutwachttijd.
- Tool-emoji-categorieën omvatten `tool`, `coding`, `web`, `deploy`, `build` en `concierge`.

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaard accountselectie: `default` indien aanwezig, anders de eerst geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor lookup

  </Accordion>

  <Accordion title="Referentiepaden en legacy-compatibiliteit">
    - huidig auth-pad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaard-auth in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaard-accountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authstatus voor dat account.

    Wanneer een Gateway bereikbaar is, stopt uitloggen eerst de live WhatsApp-listener voor het geselecteerde account, zodat de gekoppelde sessie geen berichten blijft ontvangen tot de volgende herstart. `openclaw channels remove --channel whatsapp` stopt ook de live listener voordat accountconfiguratie wordt uitgeschakeld of verwijderd.

    In legacy-authmappen wordt `oauth.json` behouden terwijl Baileys-authbestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratieschrijfacties

- Ondersteuning voor agenttools omvat de WhatsApp-reactieactie (`react`).
- Actiegates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door het kanaal geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

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
    start opnieuw wanneer WhatsApp Web-transportactiviteit stopt, de socket sluit, of
    activiteit op applicatieniveau stil blijft voorbij het langere veiligheidsvenster.

    Als logs herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, stem dan
    de Baileys-sockettiming af onder `web.whatsapp`. Begin met het verkorten van
    `keepAliveIntervalMs` tot onder de idle-time-out van je netwerk en het verhogen van
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
    `openclaw gateway status` en `openclaw channels status --probe` aangeven dat de
    Gateway en WhatsApp gezond zijn, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor
    voor verouderde crontab-items die nog steeds
    `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die verouderde items met
    `crontab -e`, omdat Cron de systemd user-bus-omgeving kan missen en
    dat oude script de Gateway-gezondheid verkeerd kan rapporteren.

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login loopt vast achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond, met `status=408 Request Time-out` of een TLS-socketverbinding die wordt verbroken.

    WhatsApp Web-login gebruikt de standaard proxyomgeving van de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het Gateway-proces de proxy-env overerft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken snel wanneer er geen actieve Gateway-listener bestaat voor het doelaccount.

    Zorg ervoor dat de Gateway draait en dat het account is gekoppeld.

  </Accordion>

  <Accordion title="Antwoord verschijnt in transcript maar niet in WhatsApp">
    Transcriptrijen leggen vast wat de agent heeft gegenereerd. WhatsApp-bezorging wordt afzonderlijk gecontroleerd: OpenClaw beschouwt een automatisch antwoord pas als verzonden nadat Baileys een uitgaand bericht-id teruggeeft voor ten minste één zichtbare tekst- of mediaverzending.

    Ack-reacties zijn onafhankelijke ontvangstbevestigingen vóór het antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer Gateway-logs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten worden onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-items in `groups`
    - mention-gating (`requireMention` + mention-patronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere items overschrijven eerdere, dus gebruik één `groupPolicy` per scope

    Als `channels.whatsapp.groups` aanwezig is, kan WhatsApp nog steeds berichten uit andere groepen waarnemen, maar OpenClaw laat ze vallen vóór sessieroutering. Voeg de groeps-JID toe aan `channels.whatsapp.groups` of voeg `groups["*"]` toe om alle groepen toe te laten terwijl afzenderautorisatie onder `groupPolicy` en `groupAllowFrom` blijft.

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp Gateway-runtime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram Gateway-werking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de `groups`- en `direct`-maps.

Resolutiehiërarchie voor groepsberichten:

De effectieve `groups`-map wordt eerst bepaald: als het account een eigen `groups` definieert, vervangt die de root-`groups`-map volledig (geen deep merge). Daarna wordt de prompt opgezocht in de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer het specifieke groepsitem in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Systeemprompt voor groepswildcard** (`groups["*"].systemPrompt`): gebruikt wanneer het specifieke groepsitem volledig ontbreekt in de map, of wanneer het bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve `direct`-map wordt eerst bepaald: als het account een eigen `direct` definieert, vervangt die de root-`direct`-map volledig (geen deep merge). Daarna wordt de prompt opgezocht in de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer het specifieke peeritem in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Systeemprompt voor directe wildcard** (`direct["*"].systemPrompt`): gebruikt wanneer het specifieke peeritem volledig ontbreekt in de map, of wanneer het bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichte per-DM-bucket voor geschiedenisoverschrijvingen (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

**Verschil met Telegram-gedrag voor meerdere accounts:** In Telegram wordt root-`groups` bewust onderdrukt voor alle accounts in een setup met meerdere accounts, zelfs voor accounts die geen eigen `groups` definiëren, om te voorkomen dat een bot groepsberichten ontvangt voor groepen waar hij niet bij hoort. WhatsApp past deze guard niet toe: root-`groups` en root-`direct` worden altijd overgeërfd door accounts die geen overschrijving op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. Als je in een WhatsApp-setup met meerdere accounts prompts per account voor groepen of directe chats wilt, definieer dan de volledige map expliciet onder elk account in plaats van te vertrouwen op defaults op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de allowlist op chatniveau voor groepen. Op root- of accountscope betekent `groups["*"]` dat "alle groepen worden toegelaten" voor die scope.
- Voeg alleen een wildcard-groeps-`systemPrompt` toe wanneer je al wilt dat die scope alle groepen toelaat. Als je nog steeds alleen een vaste set groeps-ID's in aanmerking wilt laten komen, gebruik dan geen `groups["*"]` voor de promptdefault. Herhaal in plaats daarvan de prompt op elk expliciet toegelaten groepsitem.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` verbreedt de set groepen die groepsafhandeling kunnen bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Afzendertoegang wordt nog steeds afzonderlijk beheerd door `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` heeft niet hetzelfde neveneffect voor DM's. `direct["*"]` levert alleen een standaardconfiguratie voor directe chats nadat een DM al is toegelaten door `dmPolicy` plus `allowFrom` of pairing-store-regels.

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

WhatsApp-velden met hoge signaalwaarde:

- toegang: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- bezorging: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- meerdere accounts: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overschrijvingen op accountniveau
- beheer: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Pairing](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
