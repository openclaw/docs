---
read_when:
    - Werken aan WhatsApp-/webkanaalgedrag of inboxroutering
summary: WhatsApp-kanaalondersteuning, toegangscontroles, aflevergedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:34:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp-plugin te installeren wanneer je deze voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom wanneer
  de plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale pluginpad.
- Stable/Beta: gebruikt het npm-pakket `@openclaw/whatsapp` wanneer een actueel pakket
  is gepubliceerd.

Handmatig installeren blijft beschikbaar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Als npm meldt dat het pakket van OpenClaw is verouderd of ontbreekt, gebruik dan een
actuele verpakte OpenClaw-build of een lokale checkout totdat de npm-pakkettrein
is bijgewerkt.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstelhandleidingen.
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

  <Step title="Start de Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Keur het eerste koppelingsverzoek goed (als je de koppelingsmodus gebruikt)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelingsverzoeken verlopen na 1 uur. Openstaande verzoeken zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan om WhatsApp waar mogelijk op een apart nummer te gebruiken. (De kanaalmetadata en configuratiestroom zijn voor die opzet geoptimaliseerd, maar configuraties met een persoonlijk nummer worden ook ondersteund.)
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciaal nummer (aanbevolen)">
    Dit is de schoonste operationele modus:

    - afzonderlijke WhatsApp-identiteit voor OpenClaw
    - duidelijkere DM-allowlists en routeringsgrenzen
    - minder kans op verwarring door chatten met jezelf

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
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een basisconfiguratie die geschikt is voor chatten met jezelf:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime baseren beveiligingen voor chatten met jezelf zich op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="Kanaalbereik alleen voor WhatsApp Web">
    Het berichtenplatformkanaal is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen afzonderlijk Twilio WhatsApp-berichtenkanaal in het ingebouwde chatkanaalregister.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en reconnect-lus.
- De reconnect-watchdog gebruikt WhatsApp Web-transportactiviteit, niet alleen het volume van inkomende app-berichten, zodat een stille gekoppelde-apparaatsessie niet opnieuw wordt gestart alleen omdat er recent niemand een bericht heeft gestuurd. Een langere limiet voor applicatiestilte forceert nog steeds een reconnect als transportframes blijven binnenkomen maar er gedurende het watchdogvenster geen applicatieberichten worden verwerkt; na een tijdelijke reconnect voor een recent actieve sessie gebruikt die controle op applicatiestilte de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` regelt WhatsApp Web-applicatiepings, `connectTimeoutMs` regelt de time-out voor de openingshandshake en `defaultQueryTimeoutMs` regelt Baileys-querytime-outs.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De reconnect-watchdog volgt WhatsApp Web-transportactiviteit, niet alleen het volume van inkomende app-berichten: stille gekoppelde-apparaatsessies blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere externe verbreekpad een reconnect.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` voegt DM's samen in de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxy-instellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, verwijdert OpenClaw de WhatsApp-ack-reactie nadat een zichtbaar antwoord is afgeleverd.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groepsidentificaties, afzendernamen en sessiecorrelatievelden bevatten. Daarom
zendt WhatsApp inkomende `message_received`-hookpayloads niet uit naar plugins,
tenzij je je daar expliciet voor aanmeldt:

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

Schakel dit alleen in voor plugins die je vertrouwt om inkomende WhatsApp-berichtinhoud
en identificatoren te ontvangen.

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy` regelt directe chattoegang:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert nummers in E.164-stijl (intern genormaliseerd).

    Multi-accountoverride: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) hebben voor dat account voorrang op kanaalbrede standaardwaarden.

    Details van runtimegedrag:

    - koppelingen worden opgeslagen in de kanaal-allow-store en samengevoegd met geconfigureerde `allowFrom`
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt uitgaande `fromMe`-DM's nooit automatisch (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Allowlist voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, fungeert het als groepsallowlist (`"*"` toegestaan)

    2. **Groepsafzenderbeleid** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzenderallowlist wordt omzeild
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: blokkeer alle inkomende groepsberichten

    Fallback voor afzenderallowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzenderallowlists worden geëvalueerd vóór activering via vermelding/antwoord

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtimefallback voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Vermeldingen + /activation">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regexpatronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripties van inkomende spraaknotities voor geautoriseerde groepsberichten
    - impliciete detectie van antwoord-aan-bot (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan de vermeldingscontrole; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden niet-geallowliste afzenders nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een geallowliste gebruiker

    Activeringsopdracht op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Dit is eigenaar-afgeschermd.

  </Tab>
</Tabs>

## Gedrag met persoonlijk nummer en chatten met jezelf

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-beveiligingen voor chatten met jezelf geactiveerd:

- leesbevestigingen overslaan voor beurten in chatten met jezelf
- auto-triggergedrag voor mention-JID negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken antwoorden in chatten met jezelf standaard `[{identity.name}]` of `[openclaw]`

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

  </Accordion>

  <Accordion title="Mediaplaatshouders en locatie-/contactextractie">
    Inkomende berichten met alleen media worden genormaliseerd met plaatshouders zoals:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Geautoriseerde groepsspraaknotities worden vóór vermeldingscontrole getranscribeerd wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de spraaknotitie het
    antwoord kan activeren. Als de transcriptie de bot nog steeds niet vermeldt, wordt de
    transcriptie in de openstaande groepsgeschiedenis bewaard in plaats van de ruwe plaatshouder.

    Locatiebodies gebruiken beknopte coördinatentekst. Locatielabels/-opmerkingen en contact-/vCard-details worden weergegeven als afgeschermde niet-vertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van openstaande groepsgeschiedenis">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt geactiveerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt dit uit

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

    Beurten in chatten met jezelf slaan leesbevestigingen over, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Aflevering, opdelen en media

<AccordionGroup>
  <Accordion title="Tekst opdelen">
    - standaard segmentlimiet: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - de modus `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op lengteveilig opdelen

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraaknotitie) en documenten
    - audiomedia wordt verzonden via de Baileys `audio`-payload met `ptt: true`, zodat WhatsApp-clients het weergeven als een push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-spraaknotitie-uitvoer voor WhatsApp blijft dit PTT-pad gebruiken, zelfs wanneer de provider MP3 of WebM teruggeeft
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus vóór PTT-levering
    - `/tts latest` verzendt het nieuwste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` beheert automatische TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIF's wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve bij PTT-spraaknotities: die verzenden eerst de audio en zichtbare tekst apart, omdat WhatsApp-clients bijschriften bij spraaknotities niet consistent weergeven
    - mediabronnen kunnen HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en fallbackgedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijvingen per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (formaat wijzigen/kwaliteitssweep) om binnen limieten te passen
    - bij een fout tijdens mediaverzending stuurt de fallback voor het eerste item een tekstwaarschuwing in plaats van de reactie stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Beheer dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                               |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                      |
| `"first"`   | Alleen het eerste uitgaande antwoordfragment citeren                 |
| `"all"`     | Elk uitgaand antwoordfragment citeren                                |
| `"batched"` | In de wachtrij geplaatste gebundelde antwoorden citeren, terwijl directe antwoorden ongeciteerd blijven |

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
| ------------- | ------------ | --------------------------------- | ------------------------------------------------- |
| `"off"`       | Nee          | Nee                               | Helemaal geen reacties                            |
| `"ack"`       | Ja           | Nee                               | Alleen ack-reacties (ontvangst vóór antwoord)     |
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

WhatsApp ondersteunt directe ack-reacties bij ontvangst van inkomende berichten via `channels.whatsapp.ackReaction`.
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

- onmiddellijk verzonden nadat het inkomende bericht is geaccepteerd (vóór antwoord)
- fouten worden gelogd maar blokkeren normale antwoordlevering niet
- groepsmodus `mentions` reageert op beurten die door een vermelding worden geactiveerd; groepsactivatie `always` werkt als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaard accountselectie: `default` indien aanwezig, anders het eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor opzoeken

  </Accordion>

  <Accordion title="Paden voor referenties en legacy-compatibiliteit">
    - huidig auth-pad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaard-auth in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authstatus voor dat account.

    In legacy auth-mappen wordt `oauth.json` behouden terwijl Baileys auth-bestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratiewijzigingen

- Ondersteuning voor agenttools omvat de WhatsApp-reactieactie (`react`).
- Actiepoorten:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door het kanaal geïnitieerde configuratiewijzigingen zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

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

  <Accordion title="Gekoppeld maar verbroken / herverbindingslus">
    Symptoom: gekoppeld account met herhaalde verbrekingen of herverbindingspogingen.

    Stille accounts kunnen verbonden blijven voorbij de normale berichttime-out; de watchdog
    herstart wanneer WhatsApp Web-transportactiviteit stopt, de socket sluit of
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

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een verbroken TLS-socket.

    WhatsApp Web-login gebruikt de standaard proxy-omgeving van de gatewayhost (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het gatewayproces de proxy-env erft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen falen snel wanneer er geen actieve Gateway-listener bestaat voor het doelaccount.

    Zorg dat de Gateway actief is en dat het account is gekoppeld.

  </Accordion>

  <Accordion title="Antwoord verschijnt in transcript maar niet in WhatsApp">
    Transcriptregels registreren wat de agent heeft gegenereerd. WhatsApp-levering wordt apart gecontroleerd: OpenClaw behandelt een automatisch antwoord pas als verzonden nadat Baileys een uitgaand bericht-id teruggeeft voor ten minste één zichtbare tekst- of mediaverzending.

    Ack-reacties zijn onafhankelijke ontvangsten vóór antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer Gateway-logs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-vermeldingen in `groups`
    - vermeldingspoorten (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere vermeldingen overschrijven eerdere, dus houd één `groupPolicy` per scope aan

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp Gateway-runtime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram Gateway-werking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de `groups`- en `direct`-maps.

Resolutiehiërarchie voor groepsberichten:

De effectieve `groups`-map wordt eerst bepaald: als het account zijn eigen `groups` definieert, vervangt die de root-`groups`-map volledig (geen diepe merge). Promptopzoeking wordt daarna uitgevoerd op de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt geen systeemprompt toegepast.
2. **Groepswildcard-systeemprompt** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig afwezig is in de map, of wanneer die bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve `direct`-map wordt eerst bepaald: als het account zijn eigen `direct` definieert, vervangt die de root-`direct`-map volledig (geen diepe merge). Promptopzoeking wordt daarna uitgevoerd op de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt geen systeemprompt toegepast.
2. **Direct wildcard-systeemprompt** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding volledig afwezig is in de map, of wanneer die bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichte overridebucket voor geschiedenis per DM (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

**Verschil met Telegram-gedrag met meerdere accounts:** In Telegram wordt root-`groups` opzettelijk onderdrukt voor alle accounts in een setup met meerdere accounts — zelfs accounts die geen eigen `groups` definiëren — om te voorkomen dat een bot groepsberichten ontvangt voor groepen waartoe die niet behoort. WhatsApp past deze bescherming niet toe: root-`groups` en root-`direct` worden altijd geërfd door accounts die geen override op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. In een WhatsApp-setup met meerdere accounts moet je, als je groeps- of directe prompts per account wilt, de volledige map expliciet onder elk account definiëren in plaats van te vertrouwen op standaardwaarden op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de toelatingslijst voor groepen op chatniveau. Binnen de root- of accountscope betekent `groups["*"]` voor die scope: "alle groepen worden toegelaten".
- Voeg alleen een wildcard-groep `systemPrompt` toe wanneer je al wilt dat die scope alle groepen toelaat. Als je nog steeds alleen een vaste set groep-ID's in aanmerking wilt laten komen, gebruik dan niet `groups["*"]` voor de standaardprompt. Herhaal in plaats daarvan de prompt op elke expliciet toegelaten groepsvermelding.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` vergroot de set groepen die groepsafhandeling kan bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Afzendertoegang wordt nog steeds apart beheerd door `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` heeft niet hetzelfde neveneffect voor DM's. `direct["*"]` biedt alleen een standaardconfiguratie voor directe chats nadat een DM al is toegelaten door `dmPolicy` plus `allowFrom` of regels uit de koppelingsopslag.

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

## Verwijzingen in de configuratiereferentie

Primaire referentie:

- [Configuratiereferentie - WhatsApp](/nl/gateway/config-channels#whatsapp)

Belangrijke WhatsApp-velden:

- toegang: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- aflevering: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- meerdere accounts: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrides op accountniveau
- beheer: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
