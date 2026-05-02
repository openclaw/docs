---
read_when:
    - Werken aan gedrag van het WhatsApp-/webkanaal of inboxroutering
summary: WhatsApp-kanaalondersteuning, toegangscontroles, afleveringsgedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). De Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen je de WhatsApp-Plugin te installeren wanneer je die voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom wanneer
  de Plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale Plugin-pad.
- Stabiel/Bèta: gebruikt het npm-pakket `@openclaw/whatsapp` op de huidige officiële
  releasetag.

Handmatige installatie blijft beschikbaar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Gebruik het pakket zonder versie om de huidige officiële releasetag te volgen. Zet alleen een exacte
versie vast wanneer je een reproduceerbare installatie nodig hebt.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard-DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnostiek over meerdere kanalen en herstelprocedures.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige patronen en voorbeelden voor kanaalconfiguratie.
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

    Voor een specifiek account:

```bash
openclaw channels login --channel whatsapp --account work
```

    Om vóór het inloggen een bestaande/aangepaste WhatsApp Web-authenticatiemap te koppelen:

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

  <Step title="Eerste koppelverzoek goedkeuren (bij gebruik van koppelmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelverzoeken verlopen na 1 uur. Openstaande verzoeken zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan WhatsApp waar mogelijk met een apart nummer te gebruiken. (De kanaalmetadata en configuratiestroom zijn geoptimaliseerd voor die configuratie, maar configuraties met persoonlijke nummers worden ook ondersteund.)
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciaal nummer (aanbevolen)">
    Dit is de meest overzichtelijke operationele modus:

    - aparte WhatsApp-identiteit voor OpenClaw
    - duidelijkere DM-allowlists en routeringsgrenzen
    - kleinere kans op verwarring door zelfchat

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

  <Accordion title="Terugval voor persoonlijk nummer">
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een zelfchatvriendelijke basisconfiguratie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime baseren zelfchatbeveiligingen zich op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="Kanaalscope alleen voor WhatsApp Web">
    Het berichtenplatformkanaal is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen apart Twilio WhatsApp-berichtenkanaal in het ingebouwde chatkanaalregister.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- De Gateway beheert de WhatsApp-socket en herverbindingslus.
- De herverbindingswatchdog gebruikt WhatsApp Web-transportactiviteit, niet alleen inkomend appberichtvolume, zodat een stille sessie van een gekoppeld apparaat niet opnieuw wordt gestart alleen omdat niemand recent een bericht heeft verzonden. Een langere limiet voor applicatiestilte forceert nog steeds een herverbinding als transportframes blijven binnenkomen maar er geen applicatieberichten worden verwerkt binnen het watchdogvenster; na een tijdelijke herverbinding voor een recent actieve sessie gebruikt die applicatiestiltecontrole de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` regelt WhatsApp Web-applicatiepings, `connectTimeoutMs` regelt de time-out voor de openingshandshake, en `defaultQueryTimeoutMs` regelt Baileys-querytime-outs.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De herverbindingswatchdog volgt WhatsApp Web-transportactiviteit, niet alleen inkomend appberichtvolume: stille sessies van gekoppelde apparaten blijven actief zolang transportframes doorgaan, maar een transportstagnatie forceert ruim vóór het latere pad voor externe verbreking een herverbinding.
- Rechtstreekse chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` voegt DM's samen in de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-kanalen/nieuwsbrieven kunnen expliciete uitgaande doelen zijn met hun native `@newsletter` JID. Uitgaande nieuwsbriefverzendingen gebruiken kanaalsessiemetadata (`agent:<agentId>:whatsapp:channel:<jid>`) in plaats van DM-sessiesemantiek.
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxyinstellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ack-reactie nadat een zichtbaar antwoord is afgeleverd.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groepsidentificatoren, afzendernamen en velden voor sessiecorrelatie bevatten. Daarom
zendt WhatsApp inkomende `message_received`-hookpayloads niet uit naar Plugins
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

Je kunt deze keuze beperken tot één account:

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
en identificatoren te ontvangen.

## Toegangscontrole en activatie

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy` regelt toegang tot rechtstreekse chats:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert nummers in E.164-stijl (intern genormaliseerd).

    `allowFrom` is een toegangscontrolelijst voor DM-afzenders. Het beperkt geen expliciete uitgaande verzendingen naar WhatsApp-groeps-JID's of `@newsletter`-kanaal-JID's.

    Multi-account-override: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) gaan voor op kanaalbrede standaardwaarden voor dat account.

    Details van runtimegedrag:

    - koppelingen worden opgeslagen in de kanaal-allow-store en samengevoegd met geconfigureerde `allowFrom`
    - geplande automatisering en terugval voor Heartbeat-ontvangers gebruiken expliciete bezorgdoelen of geconfigureerde `allowFrom`; goedkeuringen van DM-koppelingen zijn geen impliciete Cron- of Heartbeat-ontvangers
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt uitgaande `fromMe`-DM's nooit automatisch (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Allowlist voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, werkt het als een groepsallowlist (`"*"` toegestaan)

    2. **Groepsafzenderbeleid** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzenderallowlist wordt omzeild
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: blokkeer alle inkomende groepsberichten

    Terugval voor afzenderallowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzenderallowlists worden geëvalueerd vóór activatie via vermelding/antwoord

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtime-terugval voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Vermeldingen + /activation">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - transcripties van inkomende spraaknotities voor geautoriseerde groepsberichten
    - impliciete detectie van antwoord-aan-bot (afzender van antwoord komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan de vermeldingscontrole; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden afzenders buiten de allowlist nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een gebruiker op de allowlist

    Activatieopdracht op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Alleen de eigenaar mag dit gebruiken.

  </Tab>
</Tabs>

## Gedrag voor persoonlijk nummer en zelfchat

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-zelfchatbeveiligingen geactiveerd:

- leesbevestigingen overslaan voor zelfchatinteracties
- auto-triggergedrag voor vermelding-JID's negeren dat anders jezelf zou pingen
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

    Antwoordmetadata-velden worden ook ingevuld wanneer beschikbaar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, afzender-JID/E.164).
    Wanneer het doel van het geciteerde antwoord downloadbare media is, slaat OpenClaw die op via
    de normale opslag voor inkomende media en stelt die beschikbaar als `MediaPath`/`MediaType`, zodat
    de agent de verwezen afbeelding kan inspecteren in plaats van alleen
    `<media:image>` te zien.

  </Accordion>

  <Accordion title="Mediaplaceholders en extractie van locatie/contact">
    Inkomende berichten die alleen media bevatten, worden genormaliseerd met placeholders zoals:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Geautoriseerde groepsspraaknotities worden getranscribeerd vóór vermeldingscontrole wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de spraaknotitie het
    antwoord kan activeren. Als de transcriptie de bot nog steeds niet vermeldt, wordt de
    transcriptie bewaard in de openstaande groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebody's gebruiken beknopte coördinatentekst. Locatielabels/-opmerkingen en contact-/vCard-details worden weergegeven als afgebakende onvertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van openstaande groepsgeschiedenis">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt geactiveerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - terugval: `messages.groupChat.historyLimit`
    - `0` schakelt uit

    Injectiemarkeringen:

    - `[Chatberichten sinds je laatste antwoord - voor context]`
    - `[Huidig bericht - reageer hierop]`

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

    Zelf-chatbeurten slaan leesbevestigingen over, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Bezorging, opdelen en media

<AccordionGroup>
  <Accordion title="Tekst opdelen">
    - standaard opdeellimiet: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - de modus `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op lengteveilig opdelen

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraaknotitie) en documenten
    - audiomedia wordt verzonden via de Baileys-`audio`-payload met `ptt: true`, zodat WhatsApp-clients dit weergeven als een push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-uitvoer als spraaknotitie voor WhatsApp blijft dit PTT-pad gebruiken, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS-uitvoer in MP3/WebM, wordt vóór PTT-bezorging met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus
    - `/tts latest` verzendt het nieuwste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` beheert automatische TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIF's wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve dat PTT-spraaknotities de audio eerst verzenden en zichtbare tekst apart, omdat WhatsApp-clients bijschriften bij spraaknotities niet consequent weergeven
    - mediabron kan HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en fallback-gedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijvingen per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (verkleinen/kwaliteitsafstemming) om binnen limieten te passen
    - bij mislukte mediaverzending verzendt de fallback voor het eerste item een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Beheer dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                               |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                      |
| `"first"`   | Alleen het eerste uitgaande antwoorddeel citeren                     |
| `"all"`     | Elk uitgaand antwoorddeel citeren                                    |
| `"batched"` | In wachtrij geplaatste gebundelde antwoorden citeren, terwijl directe antwoorden niet worden geciteerd |

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

| Niveau        | Ack-reacties | Door agent geïnitieerde reacties | Beschrijving                                      |
| ------------- | ------------ | -------------------------------- | ------------------------------------------------- |
| `"off"`       | Nee          | Nee                              | Helemaal geen reacties                            |
| `"ack"`       | Ja           | Nee                              | Alleen Ack-reacties (ontvangst vóór antwoord)     |
| `"minimal"`   | Ja           | Ja (conservatief)                | Ack + agentreacties met conservatieve richtlijnen |
| `"extensive"` | Ja           | Ja (aangemoedigd)                | Ack + agentreacties met aangemoedigde richtlijnen |

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

- direct verzonden nadat inkomend verkeer is geaccepteerd (vóór antwoord)
- fouten worden gelogd, maar blokkeren normale antwoordbezorging niet
- groepsmodus `mentions` reageert op beurten die door een vermelding zijn geactiveerd; groepsactivering `always` fungeert als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaard accountselectie: `default` indien aanwezig, anders het eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor opzoeken

  </Accordion>

  <Accordion title="Referentiepaden en legacy-compatibiliteit">
    - huidig auth-pad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaardauth in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authstatus voor dat account.

    Wanneer een Gateway bereikbaar is, stopt uitloggen eerst de live WhatsApp-listener voor het geselecteerde account, zodat de gekoppelde sessie niet berichten blijft ontvangen tot de volgende herstart. `openclaw channels remove --channel whatsapp` stopt ook de live listener voordat accountconfiguratie wordt uitgeschakeld of verwijderd.

    In legacy auth-mappen wordt `oauth.json` behouden terwijl Baileys-authbestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratieschrijfbewerkingen

- Ondersteuning voor agenttools omvat WhatsApp-reactieactie (`react`).
- Actiegates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door het kanaal geïnitieerde configuratieschrijfbewerkingen zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

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
    herstart wanneer de WhatsApp Web-transportactiviteit stopt, de socket sluit of
    activiteit op applicatieniveau langer stil blijft dan het langere veiligheidsvenster.

    Als logs herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, stem dan
    Baileys-sockettimings af onder `web.whatsapp`. Begin met het verkorten van
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
    openclaw doctor
    openclaw logs --follow
    ```

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldt maar
    `openclaw gateway status` en `openclaw channels status --probe` laten zien dat de
    Gateway en WhatsApp gezond zijn, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor
    voor legacy crontab-items die nog steeds
    `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die verouderde items met
    `crontab -e`, omdat cron de systemd user-busomgeving kan missen en
    ervoor kan zorgen dat dat oude script de gatewaystatus onjuist rapporteert.

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een verbroken TLS-socket.

    WhatsApp Web-login gebruikt de standaard proxyomgeving van de gatewayhost (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het Gateway-proces de proxy-env erft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken snel wanneer er geen actieve gatewaylistener bestaat voor het doelaccount.

    Zorg ervoor dat de Gateway draait en het account is gekoppeld.

  </Accordion>

  <Accordion title="Antwoord verschijnt in transcript maar niet in WhatsApp">
    Transcriptregels registreren wat de agent heeft gegenereerd. WhatsApp-bezorging wordt apart gecontroleerd: OpenClaw beschouwt een automatisch antwoord pas als verzonden nadat Baileys een uitgaand bericht-id retourneert voor ten minste één zichtbare tekst- of mediaverzending.

    Ack-reacties zijn onafhankelijke ontvangsten vóór antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer gatewaylogs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-vermeldingen in `groups`
    - vermeldingsgating (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere vermeldingen overschrijven eerdere, dus houd één enkele `groupPolicy` per scope aan

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    WhatsApp-gatewayruntime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram-gatewaywerking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de `groups`- en `direct`-maps.

Resolutiehiërarchie voor groepsberichten:

De effectieve `groups`-map wordt eerst bepaald: als het account zijn eigen `groups` definieert, vervangt die de root-`groups`-map volledig (geen deep merge). Daarna wordt promptopzoeking uitgevoerd op de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Groepswildcard-systeemprompt** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig ontbreekt in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve `direct`-map wordt eerst bepaald: als het account zijn eigen `direct` definieert, vervangt die de root-`direct`-map volledig (geen deep merge). Daarna wordt promptopzoeking uitgevoerd op de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peervermelding in de map bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Direct-wildcard-systeemprompt** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peervermelding volledig ontbreekt in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichte bucket voor geschiedenisoverschrijvingen per DM (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

**Verschil met Telegram-gedrag voor meerdere accounts:** In Telegram worden root-`groups` opzettelijk onderdrukt voor alle accounts in een setup met meerdere accounts, zelfs voor accounts die zelf geen `groups` definiëren, om te voorkomen dat een bot groepsberichten ontvangt voor groepen waarvan hij geen lid is. WhatsApp past deze beveiliging niet toe: root-`groups` en root-`direct` worden altijd geërfd door accounts die geen override op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. In een WhatsApp-setup met meerdere accounts moet je, als je per account groeps- of directe prompts wilt, de volledige map expliciet onder elk account definiëren in plaats van te vertrouwen op defaults op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de allowlist voor groepen op chatniveau. Op root- of accountscope betekent `groups["*"]` "alle groepen worden toegelaten" voor die scope.
- Voeg alleen een wildcard-groep `systemPrompt` toe wanneer je al wilt dat die scope alle groepen toelaat. Als je nog steeds wilt dat alleen een vaste set groeps-ID's in aanmerking komt, gebruik dan geen `groups["*"]` voor de prompt-default. Herhaal de prompt in plaats daarvan op elke expliciet toegestane groepsvermelding.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` verbreedt de set groepen die de groepsafhandeling kunnen bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Toegang voor afzenders wordt nog steeds afzonderlijk beheerd door `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` heeft niet hetzelfde neveneffect voor DM's. `direct["*"]` biedt alleen een default-configuratie voor directe chats nadat een DM al is toegelaten door `dmPolicy` plus `allowFrom` of regels uit de pairing-store.

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
- aflevering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- meerdere accounts: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrides op accountniveau
- bewerkingen: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
