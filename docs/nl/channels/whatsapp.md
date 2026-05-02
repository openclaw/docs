---
read_when:
    - Werken aan WhatsApp-/webkanaalgedrag of inboxroutering
summary: Ondersteuning voor het WhatsApp-kanaal, toegangscontroles, bezorggedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productierijp via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp-plugin te installeren wanneer je deze voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom aan wanneer
  de plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale pluginpad.
- Stable/Beta: gebruikt het npm-pakket `@openclaw/whatsapp` wanneer er een actueel pakket
  is gepubliceerd.

Handmatige installatie blijft beschikbaar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Als npm meldt dat het door OpenClaw beheerde pakket deprecated is of ontbreekt, gebruik dan een
actuele verpakte OpenClaw-build of een lokale checkout totdat de npm-pakketreeks
is bijgewerkt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstelplaybooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/nl/gateway/configuration">
    Volledige kanaalconfiguratiepatronen en voorbeelden.
  </Card>
</CardGroup>

## Snelle configuratie

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

    Voor een specifiek account:

```bash
openclaw channels login --channel whatsapp --account work
```

    Om vóór het inloggen een bestaande/aangepaste WhatsApp Web-auth-directory te koppelen:

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

    Koppelingsverzoeken verlopen na 1 uur. Openstaande verzoeken zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan WhatsApp waar mogelijk op een apart nummer te gebruiken. (De kanaalmetadata en configuratiestroom zijn geoptimaliseerd voor die configuratie, maar configuraties met een persoonlijk nummer worden ook ondersteund.)
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Dit is de schoonste operationele modus:

    - aparte WhatsApp-identiteit voor OpenClaw
    - duidelijkere DM-allowlists en routeringsgrenzen
    - kleinere kans op verwarring door zelf-chat

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

  <Accordion title="Personal-number fallback">
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een zelf-chatvriendelijke basisconfiguratie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime baseren zelf-chatbeveiligingen zich op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Het berichtenplatformkanaal is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen apart Twilio WhatsApp-berichtenkanaal in de ingebouwde chatkanaalregistry.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en herverbindingslus.
- De herverbindingswaakhond gebruikt WhatsApp Web-transportactiviteit, niet alleen het volume van binnenkomende app-berichten, zodat een stille gekoppelde-apparaatsessie niet uitsluitend opnieuw wordt gestart omdat niemand recent een bericht heeft gestuurd. Een langere applicatiestilte-limiet forceert nog steeds een herverbinding als transportframes blijven binnenkomen maar er tijdens het waakhondvenster geen applicatieberichten worden verwerkt; na een tijdelijke herverbinding voor een recent actieve sessie gebruikt die applicatiestiltecontrole de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` beheert WhatsApp Web-applicatiepings, `connectTimeoutMs` beheert de time-out van de openingshandshake en `defaultQueryTimeoutMs` beheert Baileys-querytime-outs.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De herverbindingswaakhond volgt WhatsApp Web-transportactiviteit, niet alleen het volume van binnenkomende app-berichten: stille gekoppelde-apparaatsessies blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere externe verbreekpad een herverbinding.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` vouwt DM's samen naar de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-kanalen/nieuwsbrieven kunnen expliciete uitgaande doelen zijn met hun native `@newsletter` JID. Uitgaande nieuwsbriefverzendingen gebruiken kanaalsessiemetadata (`agent:<agentId>:whatsapp:channel:<jid>`) in plaats van DM-sessiesemantiek.
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxyinstellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ack-reactie nadat een zichtbaar antwoord is afgeleverd.

## Plugin-hooks en privacy

Binnenkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groepsidentificaties, afzendernamen en sessiecorrelatievelden bevatten. Daarom
zendt WhatsApp geen binnenkomende `message_received`-hookpayloads uit naar plugins
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

Schakel dit alleen in voor plugins die je vertrouwt om binnenkomende WhatsApp-berichtinhoud
en identifiers te ontvangen.

## Toegangscontrole en activering

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` beheert directe chattoegang:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert E.164-achtige nummers (intern genormaliseerd).

    `allowFrom` is een toegangscontrolelijst voor DM-afzenders. Deze blokkeert geen expliciete uitgaande verzendingen naar WhatsApp-groeps-JID's of `@newsletter`-kanaal-JID's.

    Multi-accountoverride: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) krijgen voor dat account voorrang op kanaalbrede standaardwaarden.

    Details van runtimegedrag:

    - koppelingen worden bewaard in de kanaal-allow-store en samengevoegd met geconfigureerde `allowFrom`
    - geplande automatisering en Heartbeat-ontvangerfallback gebruiken expliciete afleverdoelen of geconfigureerde `allowFrom`; DM-koppelingsgoedkeuringen zijn geen impliciete Cron- of Heartbeat-ontvangers
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt nooit automatisch uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Group policy + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Groepslidmaatschaps-allowlist** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, werkt dit als een groeps-allowlist (`"*"` toegestaan)

    2. **Groepsafzenderbeleid** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzender-allowlist overgeslagen
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: alle binnenkomende groepsberichten blokkeren

    Fallback voor afzender-allowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzender-allowlists worden geëvalueerd vóór mention-/reply-activering

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtimefallback voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Mentions + /activation">
    Groepsantwoorden vereisen standaard een mention.

    Mention-detectie omvat:

    - expliciete WhatsApp-mentions van de botidentiteit
    - geconfigureerde mention-regexpatronen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripties van binnenkomende spraaknotities voor geautoriseerde groepsberichten
    - impliciete reply-to-bot-detectie (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan mention-gating; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden afzenders die niet op de allowlist staan nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een gebruiker op de allowlist

    Activeringscommando op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Het is owner-gated.

  </Tab>
</Tabs>

## Gedrag bij persoonlijk nummer en zelf-chat

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-zelf-chatbeveiligingen geactiveerd:

- leesbevestigingen voor zelf-chatbeurten overslaan
- mention-JID-auto-triggergedrag negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken zelf-chatantwoorden standaard `[{identity.name}]` of `[openclaw]`

## Berichtnormalisatie en context

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Binnenkomende WhatsApp-berichten worden verpakt in de gedeelde binnenkomende envelope.

    Als er een geciteerd antwoord bestaat, wordt context in deze vorm toegevoegd:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwoordmetadatavelden worden ook gevuld wanneer beschikbaar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, afzender-JID/E.164).
    Wanneer het geciteerde antwoorddoel downloadbare media is, slaat OpenClaw dit op via
    de normale binnenkomende mediaopslag en stelt het beschikbaar als `MediaPath`/`MediaType`, zodat
    de agent de gerefereerde afbeelding kan inspecteren in plaats van alleen
    `<media:image>` te zien.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Binnenkomende berichten met alleen media worden genormaliseerd met placeholders zoals:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Geautoriseerde groepsspraaknotities worden vóór mention-gating getranscribeerd wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botmention in de spraaknotitie
    het antwoord kan activeren. Als het transcript de bot nog steeds niet noemt, wordt het
    transcript bewaard in de openstaande groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebodies gebruiken beknopte coördinatentekst. Locatielabels/opmerkingen en contact-/vCard-details worden weergegeven als fenced niet-vertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Pending group history injection">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt geactiveerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt dit uit

    Injectiemarkeringen:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    Leesbevestigingen zijn standaard ingeschakeld voor geaccepteerde binnenkomende WhatsApp-berichten.

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

    Zelfchatbeurten slaan leesbevestigingen over, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Levering, opdelen en media

<AccordionGroup>
  <Accordion title="Tekst opdelen">
    - standaardlimiet voor stukken: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - de modus `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op veilig opdelen op lengte

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraaknotitie) en documenten
    - audiomedia wordt verzonden via de Baileys-`audio`-payload met `ptt: true`, zodat WhatsApp-clients dit weergeven als push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-uitvoer als spraaknotitie voor WhatsApp blijft op dit PTT-pad, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus voordat PTT-levering plaatsvindt
    - `/tts latest` verzendt het nieuwste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` beheert auto-TTS voor de huidige WhatsApp-chat
    - het afspelen van geanimeerde GIFs wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve dat PTT-spraaknotities eerst de audio en daarna afzonderlijk zichtbare tekst verzenden, omdat WhatsApp-clients bijschriften bij spraaknotities niet consistent weergeven
    - de mediabron kan HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en fallbackgedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overrides per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (verkleinen/kwaliteitscontrole) om binnen limieten te passen
    - bij een fout bij mediaverzending stuurt de fallback voor het eerste item een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Beheer dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                                |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                       |
| `"first"`   | Alleen het eerste uitgaande antwoordstuk citeren                      |
| `"all"`     | Elk uitgaand antwoordstuk citeren                                     |
| `"batched"` | In de wachtrij geplaatste gebundelde antwoorden citeren, terwijl directe antwoorden niet worden geciteerd |

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

`channels.whatsapp.reactionLevel` bepaalt hoe breed de agent emoji-reacties gebruikt op WhatsApp:

| Niveau        | Bevestigingsreacties | Door agent gestarte reacties | Beschrijving                                      |
| ------------- | -------------------- | ---------------------------- | ------------------------------------------------- |
| `"off"`       | Nee                  | Nee                          | Helemaal geen reacties                            |
| `"ack"`       | Ja                   | Nee                          | Alleen bevestigingsreacties (ontvangst vóór antwoord) |
| `"minimal"`   | Ja                   | Ja (conservatief)            | Bevestiging + agentreacties met conservatieve richtlijnen |
| `"extensive"` | Ja                   | Ja (aangemoedigd)            | Bevestiging + agentreacties met aangemoedigde richtlijnen |

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

WhatsApp ondersteunt directe bevestigingsreacties bij ontvangst van inkomende berichten via `channels.whatsapp.ackReaction`.
Bevestigingsreacties worden begrensd door `reactionLevel`: ze worden onderdrukt wanneer `reactionLevel` `"off"` is.

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

- direct verzonden nadat het inkomende bericht is geaccepteerd (vóór antwoord)
- fouten worden gelogd, maar blokkeren normale antwoordlevering niet
- groepsmodus `mentions` reageert op beurten die door vermeldingen zijn geactiveerd; groepsactivatie `always` fungeert als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaardaccountselectie: `default` indien aanwezig, anders het eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor opzoeken

  </Accordion>

  <Accordion title="Referentiepaden en legacy-compatibiliteit">
    - huidig authenticatiepad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaardauthenticatie in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authenticatiestatus voor dat account.

    Wanneer een Gateway bereikbaar is, stopt uitloggen eerst de live WhatsApp-listener voor het geselecteerde account, zodat de gekoppelde sessie geen berichten blijft ontvangen tot de volgende herstart. `openclaw channels remove --channel whatsapp` stopt ook de live listener voordat accountconfiguratie wordt uitgeschakeld of verwijderd.

    In legacy authenticatiemappen blijft `oauth.json` behouden terwijl Baileys-authenticatiebestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratieschrijfacties

- Ondersteuning voor agenttools omvat de WhatsApp-reactieactie (`react`).
- Actiepoorten:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door het kanaal geïnitieerde configuratieschrijfacties zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet gekoppeld (QR vereist)">
    Symptoom: kanaalstatus meldt dat het niet gekoppeld is.

    Oplossing:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Gekoppeld maar verbroken / herverbindingslus">
    Symptoom: gekoppeld account met herhaalde verbrekingen of herverbindingspogingen.

    Stille accounts kunnen verbonden blijven voorbij de normale berichttime-out; de watchdog
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

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` vermeldt maar
    `openclaw gateway status` en `openclaw channels status --probe` tonen dat de
    Gateway en WhatsApp gezond zijn, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor
    voor legacy crontab-vermeldingen die nog steeds
    `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die verouderde vermeldingen met
    `crontab -e`, omdat cron de systemd user-busomgeving kan missen en
    dat oude script de Gateway-gezondheid onjuist kan laten rapporteren.

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een TLS-socketverbreking.

    WhatsApp Web-login gebruikt de standaardproxyomgeving van de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het Gateway-proces de proxy-env erft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen falen snel wanneer er geen actieve Gateway-listener bestaat voor het doelaccount.

    Zorg ervoor dat de Gateway actief is en dat het account is gekoppeld.

  </Accordion>

  <Accordion title="Antwoord verschijnt in transcript maar niet in WhatsApp">
    Transcriptregels registreren wat de agent heeft gegenereerd. WhatsApp-levering wordt afzonderlijk gecontroleerd: OpenClaw beschouwt een automatisch antwoord pas als verzonden nadat Baileys een uitgaand bericht-id retourneert voor ten minste één zichtbare tekst- of mediaverzending.

    Bevestigingsreacties zijn onafhankelijke ontvangsten vóór antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer Gateway-logs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-vermeldingen in `groups`
    - gating op vermeldingen (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere vermeldingen overschrijven eerdere, dus houd één `groupPolicy` per scope aan

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp Gateway-runtime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele werking van de WhatsApp/Telegram Gateway.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt systeemprompts in Telegram-stijl voor groepen en directe chats via de maps `groups` en `direct`.

Resolutiehiërarchie voor groepsberichten:

De effectieve map `groups` wordt eerst bepaald: als het account een eigen `groups` definieert, vervangt die de root-map `groups` volledig (geen diepe merge). Daarna wordt de prompt opgezocht in de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Wildcard-systeemprompt voor groepen** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig ontbreekt in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve map `direct` wordt eerst bepaald: als het account een eigen `direct` definieert, vervangt die de root-map `direct` volledig (geen diepe merge). Daarna wordt de prompt opgezocht in de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Wildcard-systeemprompt voor directe berichten** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding volledig ontbreekt in de map, of wanneer deze bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichtgewicht bucket voor geschiedenisoverrides per DM (`dms.<id>.historyLimit`). Promptoverrides staan onder `direct`.
</Note>

**Verschil met Telegram multi-accountgedrag:** In Telegram wordt root-`groups` bewust onderdrukt voor alle accounts in een multi-accountconfiguratie, ook voor accounts die zelf geen `groups` definiëren, om te voorkomen dat een bot groepsberichten ontvangt voor groepen waarvan hij geen lid is. WhatsApp past deze beveiliging niet toe: root-`groups` en root-`direct` worden altijd overgenomen door accounts die geen override op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. In een multi-accountconfiguratie voor WhatsApp moet je, als je groeps- of directe prompts per account wilt, de volledige map expliciet onder elk account definiëren in plaats van te vertrouwen op standaardwaarden op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de toelatingslijst voor groepen op chatniveau. Op root- of accountniveau betekent `groups["*"]` dat "alle groepen worden toegelaten" voor dat bereik.
- Voeg alleen een wildcardgroep-`systemPrompt` toe wanneer je al wilt dat dat bereik alle groepen toelaat. Als je nog steeds alleen een vaste set groeps-ID's in aanmerking wilt laten komen, gebruik dan geen `groups["*"]` voor de standaardprompt. Herhaal de prompt in plaats daarvan voor elke expliciet toegelaten groepsvermelding.
- Groepstoelating en autorisatie van afzenders zijn afzonderlijke controles. `groups["*"]` vergroot de set groepen die de groepsafhandeling kunnen bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Toegang voor afzenders wordt nog steeds afzonderlijk beheerd via `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` heeft niet hetzelfde neveneffect voor DM's. `direct["*"]` levert alleen een standaardconfiguratie voor directe chats nadat een DM al is toegelaten door `dmPolicy` plus `allowFrom` of regels uit de koppelingsopslag.

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
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrides op accountniveau
- bewerkingen: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Multi-agentroutering](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
