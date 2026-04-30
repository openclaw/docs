---
read_when:
    - Werken aan WhatsApp-/webkanaalgedrag of inboxroutering
summary: WhatsApp-kanaalondersteuning, toegangscontroles, aflevergedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T00:06:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf363ec2cc7100635ee6b0a7b0e7bb956521d0203b445fd38b5a75a13e8918a6
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installatie (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp Plugin te installeren wanneer je deze voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom wanneer
  de Plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale Plugin-pad.
- Stable/Beta: gebruikt het npm-pakket `@openclaw/whatsapp` wanneer een huidig pakket
  is gepubliceerd.

Handmatige installatie blijft beschikbaar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Als npm meldt dat het OpenClaw-pakket is verouderd of ontbreekt, gebruik dan een
huidige verpakte OpenClaw-build of een lokale checkout totdat de npm-pakkettrein
is bijgewerkt.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Kanaalprobleemoplossing" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en reparatiedraaiboeken.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
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

    Voor een specifiek account:

```bash
openclaw channels login --channel whatsapp --account work
```

    Om een bestaande/aangepaste WhatsApp Web-auth-directory vóór het inloggen te koppelen:

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

  <Step title="Eerste koppelingsverzoek goedkeuren (als koppelingsmodus wordt gebruikt)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelingsverzoeken verlopen na 1 uur. Openstaande verzoeken zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan WhatsApp waar mogelijk op een apart nummer te gebruiken. (De kanaalmetadata en installatiestroom zijn voor die opzet geoptimaliseerd, maar opzetten met een persoonlijk nummer worden ook ondersteund.)
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciaal nummer (aanbevolen)">
    Dit is de schoonste operationele modus:

    - aparte WhatsApp-identiteit voor OpenClaw
    - duidelijkere DM-allowlists en routeringsgrenzen
    - kleinere kans op verwarring door chatten met jezelf

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

  <Accordion title="Terugval op persoonlijk nummer">
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een basisconfiguratie die geschikt is voor chatten met jezelf:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime baseren beveiligingen voor chatten met jezelf zich op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="Kanaalscope alleen voor WhatsApp Web">
    Het messagingplatformkanaal is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen apart Twilio WhatsApp-berichtenkanaal in het ingebouwde chatkanaalregister.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en reconnect-loop.
- De reconnect-watchdog gebruikt WhatsApp Web-transportactiviteit, niet alleen het volume van inkomende app-berichten, zodat een stille sessie van een gekoppeld apparaat niet opnieuw wordt gestart alleen omdat niemand onlangs een bericht heeft gestuurd. Een langere limiet voor applicatiestilte forceert nog steeds een reconnect als transportframes blijven binnenkomen maar er geen applicatieberichten worden verwerkt binnen het watchdog-venster; na een tijdelijke reconnect voor een recent actieve sessie gebruikt die controle op applicatiestilte de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` beheert WhatsApp Web-applicatiepings, `connectTimeoutMs` beheert de time-out voor de openingshandshake en `defaultQueryTimeoutMs` beheert Baileys-querytime-outs.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De reconnect-watchdog volgt WhatsApp Web-transportactiviteit, niet alleen het volume van inkomende app-berichten: stille sessies van gekoppelde apparaten blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere externe disconnect-pad een reconnect.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` vouwt DM's samen naar de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxy-instellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ack-reactie nadat een zichtbaar antwoord is afgeleverd.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groeps-ID's, afzendernamen en sessiecorrelatievelden bevatten. Daarom
zendt WhatsApp inkomende `message_received`-hook-payloads niet uit naar Plugins
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

## Toegangscontrole en activatie

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy` beheert toegang tot directe chats:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert nummers in E.164-stijl (intern genormaliseerd).

    Multi-account-override: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) krijgen voorrang op kanaalbrede standaardwaarden voor dat account.

    Details van runtimegedrag:

    - koppelingen worden opgeslagen in de kanaal-allow-store en samengevoegd met geconfigureerde `allowFrom`
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt nooit automatisch uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Allowlist voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, werkt het als een groeps-allowlist (`"*"` toegestaan)

    2. **Groepsafzenderbeleid** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzender-allowlist wordt overgeslagen
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: blokkeer alle inkomende groepsberichten

    Terugval voor afzender-allowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzender-allowlists worden geëvalueerd vóór activatie via vermelding/antwoord

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtime-terugval voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Vermeldingen + /activation">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - inkomende voice-note-transcripties voor geautoriseerde groepsberichten
    - impliciete detectie van antwoorden aan de bot (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan de vermeldingspoort; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden afzenders die niet op de allowlist staan nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een gebruiker die wel op de allowlist staat

    Activatiecommando op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Het is eigenaar-afgeschermd.

  </Tab>
</Tabs>

## Gedrag met persoonlijk nummer en chatten met jezelf

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-beveiligingen voor chatten met jezelf geactiveerd:

- leesbevestigingen overslaan voor beurten waarin je met jezelf chat
- auto-triggergedrag via mention-JID negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken antwoorden aan jezelf standaard `[{identity.name}]` of `[openclaw]`

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

  </Accordion>

  <Accordion title="Mediaplaceholders en extractie van locatie/contact">
    Inkomende berichten met alleen media worden genormaliseerd met placeholders zoals:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Geautoriseerde groeps-voice-notes worden getranscribeerd vóór vermeldingspoortcontrole wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de voice-note het
    antwoord kan triggeren. Als het transcript de bot nog steeds niet vermeldt, wordt het
    transcript bewaard in openstaande groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebodies gebruiken beknopte coördinatentekst. Locatielabels/opmerkingen en contact-/vCard-details worden weergegeven als fenced niet-vertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van openstaande groepsgeschiedenis">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt getriggerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - terugval: `messages.groupChat.historyLimit`
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

    Beurten waarin je met jezelf chat slaan leesbevestigingen over, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Aflevering, chunking en media

<AccordionGroup>
  <Accordion title="Tekstchunking">
    - standaard chunklimiet: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline`-modus geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op lengteveilige chunking

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt afbeeldings-, video-, audio- (PTT-spraaknotitie) en documentpayloads
    - audiomedia wordt verzonden via de Baileys-`audio`-payload met `ptt: true`, zodat WhatsApp-clients dit weergeven als een push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-uitvoer als spraaknotitie voor WhatsApp blijft dit PTT-pad gebruiken, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus voordat deze via PTT wordt afgeleverd
    - `/tts latest` verzendt het laatste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` regelt automatische TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIF's wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve dat PTT-spraaknotities de audio eerst verzenden en zichtbare tekst apart, omdat WhatsApp-clients bijschriften bij spraaknotities niet consistent weergeven
    - mediabronnen kunnen HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en fallbackgedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijvingen per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (formaat wijzigen/kwaliteitsronde) om binnen de limieten te passen
    - bij een fout tijdens mediaverzending verzendt de fallback voor het eerste item een tekstwaarschuwing in plaats van de reactie stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Regel dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                               |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                      |
| `"first"`   | Alleen het eerste uitgaande antwoordfragment citeren                 |
| `"all"`     | Elk uitgaand antwoordfragment citeren                                |
| `"batched"` | In wachtrij geplaatste gebundelde antwoorden citeren en directe antwoorden niet citeren |

De standaardwaarde is `"off"`. Overschrijvingen per account gebruiken `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Niveau        | Bevestigingsreacties | Door agent geïnitieerde reacties | Beschrijving                                      |
| ------------- | -------------------- | -------------------------------- | ------------------------------------------------- |
| `"off"`       | Nee                  | Nee                              | Helemaal geen reacties                            |
| `"ack"`       | Ja                   | Nee                              | Alleen bevestigingsreacties (ontvangstbewijs vóór antwoord) |
| `"minimal"`   | Ja                   | Ja (conservatief)                | Bevestiging + agentreacties met conservatieve richtlijnen |
| `"extensive"` | Ja                   | Ja (aangemoedigd)                | Bevestiging + agentreacties met aangemoedigde richtlijnen |

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

WhatsApp ondersteunt directe bevestigingsreacties bij ontvangst van inkomende berichten via `channels.whatsapp.ackReaction`.
Bevestigingsreacties worden begrensd door `reactionLevel` — ze worden onderdrukt wanneer `reactionLevel` `"off"` is.

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

- onmiddellijk verzonden nadat inkomend is geaccepteerd (vóór het antwoord)
- fouten worden gelogd maar blokkeren normale antwoordaflevering niet
- groepsmodus `mentions` reageert op beurten die door een vermelding zijn geactiveerd; groepsactivatie `always` werkt als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardinstellingen">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaard accountselectie: `default` als die aanwezig is, anders de eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor opzoeken

  </Accordion>

  <Accordion title="Paden voor referenties en legacycompatibiliteit">
    - huidig authenticatiepad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaardauthenticatie in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authenticatiestatus voor dat account.

    In legacy authenticatiemappen blijft `oauth.json` behouden terwijl Baileys-authenticatiebestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratieschrijfbewerkingen

- Ondersteuning voor agenttools omvat de WhatsApp-reactieactie (`react`).
- Actiepoorten:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door het kanaal geïnitieerde configuratieschrijfbewerkingen zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Niet gekoppeld (QR vereist)">
    Symptoom: kanaalstatus meldt niet gekoppeld.

    Oplossing:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Gekoppeld maar verbroken / reconnectlus">
    Symptoom: gekoppeld account met herhaalde verbrekingen of reconnectpogingen.

    Stille accounts kunnen verbonden blijven na de normale berichttime-out; de watchdog
    herstart wanneer WhatsApp Web-transportactiviteit stopt, de socket sluit, of
    activiteit op applicatieniveau langer stil blijft dan het langere veiligheidsvenster.

    Als logs herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, stem dan
    de Baileys-sockettimings af onder `web.whatsapp`. Begin met het verkorten van
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

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een TLS-socketverbreking.

    WhatsApp Web-login gebruikt de standaard proxyomgeving van de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het Gateway-proces de proxy-env overneemt en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken snel wanneer er geen actieve Gateway-listener bestaat voor het doelaccount.

    Zorg ervoor dat de Gateway draait en dat het account is gekoppeld.

  </Accordion>

  <Accordion title="Groepsberichten onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-vermeldingen in `groups`
    - vermeldingspoort (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere vermeldingen overschrijven eerdere, dus houd één `groupPolicy` per scope aan

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp Gateway-runtime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram Gateway-werking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de `groups`- en `direct`-maps.

Resolutiehiërarchie voor groepsberichten:

De effectieve `groups`-map wordt eerst bepaald: als het account zijn eigen `groups` definieert, vervangt die de root-`groups`-map volledig (geen diepe merge). Daarna wordt de prompt opgezocht op de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Wildcard-systeemprompt voor groepen** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig ontbreekt in de map, of wanneer die bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve `direct`-map wordt eerst bepaald: als het account zijn eigen `direct` definieert, vervangt die de root-`direct`-map volledig (geen diepe merge). Daarna wordt de prompt opgezocht op de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peervermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Wildcard-systeemprompt voor direct** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peervermelding volledig ontbreekt in de map, of wanneer die bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichte bucket voor per-DM-overschrijvingen van geschiedenis (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

**Verschil met Telegram-gedrag met meerdere accounts:** In Telegram wordt root-`groups` bewust onderdrukt voor alle accounts in een configuratie met meerdere accounts — zelfs accounts die geen eigen `groups` definiëren — om te voorkomen dat een bot groepsberichten ontvangt voor groepen waar deze niet toe behoort. WhatsApp past deze guard niet toe: root-`groups` en root-`direct` worden altijd geërfd door accounts die geen overschrijving op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. Als je in een WhatsApp-configuratie met meerdere accounts groeps- of directe prompts per account wilt, definieer dan expliciet de volledige map onder elk account in plaats van te vertrouwen op standaardinstellingen op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de allowlist op chatniveau voor groepen. Op root- of accountscope betekent `groups["*"]` dat "alle groepen worden toegelaten" voor die scope.
- Voeg alleen een wildcard-groep `systemPrompt` toe wanneer je al wilt dat die scope alle groepen toelaat. Als je nog steeds wilt dat alleen een vaste set groeps-ID's in aanmerking komt, gebruik dan niet `groups["*"]` voor de promptstandaard. Herhaal de prompt in plaats daarvan op elke expliciet toegestane groepsvermelding.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` verbreedt de set groepen die groepsafhandeling kan bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Afzendertoegang wordt nog steeds afzonderlijk geregeld door `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
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
- bezorging: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- meerdere accounts: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overschrijvingen op accountniveau
- bewerkingen: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- instructies: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Koppeling](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering voor meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
