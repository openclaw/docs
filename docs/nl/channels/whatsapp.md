---
read_when:
    - Werken aan WhatsApp-/webkanaalgedrag of inboxroutering
summary: WhatsApp-kanaalondersteuning, toegangscontroles, afleveringsgedrag en beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T11:08:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp Plugin te installeren wanneer je deze voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom aan wanneer
  de Plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale Plugin-pad.
- Stable/Beta: gebruikt het npm-pakket `@openclaw/whatsapp` op de huidige officiële
  release-tag.

Handmatige installatie blijft beschikbaar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Gebruik het kale pakket om de huidige officiële release-tag te volgen. Pin alleen een exacte
versie wanneer je een reproduceerbare installatie nodig hebt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/nl/channels/pairing">
    Standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/nl/channels/troubleshooting">
    Cross-channel diagnostiek en herstel-playbooks.
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

    Om vóór het inloggen een bestaande/aangepaste WhatsApp Web-authenticatiemap te koppelen:

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
OpenClaw raadt aan om WhatsApp waar mogelijk op een apart nummer te draaien. (De kanaalmetadata en configuratiestroom zijn geoptimaliseerd voor die configuratie, maar configuraties met een persoonlijk nummer worden ook ondersteund.)
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Dit is de schoonste operationele modus:

    - aparte WhatsApp-identiteit voor OpenClaw
    - duidelijkere DM-toestaanlijsten en routeringsgrenzen
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
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een basisconfiguratie die geschikt is voor zelf-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime zijn zelf-chatbeschermingen gebaseerd op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Het messagingplatformkanaal is in de huidige OpenClaw-kanaalarchitectuur gebaseerd op WhatsApp Web (`Baileys`).

    Er is geen apart Twilio WhatsApp-berichtenkanaal in het ingebouwde chatkanaalregister.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en reconnect-lus.
- De reconnect-waakhond gebruikt WhatsApp Web-transportactiviteit, niet alleen het volume aan binnenkomende app-berichten, waardoor een stille gekoppelde-apparaatsessie niet uitsluitend opnieuw wordt gestart omdat niemand recent een bericht heeft gestuurd. Een langere limiet voor applicatiestilte forceert nog steeds een reconnect als transportframes blijven binnenkomen maar er geen applicatieberichten worden verwerkt gedurende het waakhondvenster; na een tijdelijke reconnect voor een recent actieve sessie gebruikt die applicatiestiltecontrole de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` beheert WhatsApp Web-applicatiepings, `connectTimeoutMs` beheert de time-out voor de openingshandshake, en `defaultQueryTimeoutMs` beheert Baileys-querytime-outs.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Groepsverzendingen voegen native vermeldingmetadata toe voor `@+<digits>`- en `@<digits>`-tokens in tekst en mediaonderschriften wanneer het token overeenkomt met huidige WhatsApp-deelnemermetadata, inclusief LID-ondersteunde groepen.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De reconnect-waakhond volgt WhatsApp Web-transportactiviteit, niet alleen het volume aan binnenkomende app-berichten: stille gekoppelde-apparaatsessies blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere pad voor externe disconnect een reconnect.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard vouwt `main` DM's samen naar de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters kunnen expliciete uitgaande doelen zijn met hun native `@newsletter`-JID. Uitgaande nieuwsbriefverzendingen gebruiken kanaalsessiemetadata (`agent:<agentId>:whatsapp:channel:<jid>`) in plaats van DM-sessiesemantiek.
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxyinstellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ack-reactie nadat een zichtbare reactie is afgeleverd.

## Plugin-hooks en privacy

Binnenkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groepsidentifiers, afzendernamen en sessiecorrelatievelden bevatten. Daarom
zendt WhatsApp binnenkomende `message_received`-hookpayloads niet uit naar Plugins
tenzij je hier expliciet voor kiest:

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

Schakel dit alleen in voor Plugins die je vertrouwt om binnenkomende WhatsApp-berichtinhoud
en identifiers te ontvangen.

## Toegangsbeheer en activering

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` beheert toegang tot directe chats:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert E.164-achtige nummers (intern genormaliseerd).

    `allowFrom` is een toegangsbeheerlijst voor DM-afzenders. Het blokkeert geen expliciete uitgaande verzendingen naar WhatsApp-groeps-JID's of `@newsletter`-kanaal-JID's.

    Multi-accountoverride: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) krijgen voor dat account voorrang op standaardwaarden op kanaalniveau.

    Details van runtimegedrag:

    - koppelingen worden bewaard in de kanaaltoestaanopslag en samengevoegd met geconfigureerde `allowFrom`
    - geplande automatisering en Heartbeat-ontvangersfallback gebruiken expliciete afleverdoelen of geconfigureerde `allowFrom`; DM-koppelingsgoedkeuringen zijn geen impliciete Cron- of Heartbeat-ontvangers
    - als er geen toestaanlijst is geconfigureerd, wordt het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt nooit automatisch uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Group policy + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Toestaanlijst voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, fungeert het als groepstoestaanlijst (`"*"` toegestaan)

    2. **Groepsafzenderbeleid** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzendertoestaanlijst wordt omzeild
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: blokkeer alle binnenkomende groepsberichten

    Fallback voor afzendertoestaanlijst:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzendertoestaanlijsten worden geëvalueerd vóór activering via vermelding/antwoord

    Let op: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtimefallback voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Mentions + /activation">
    Groepsantwoorden vereisen standaard een vermelding.

    Detectie van vermeldingen omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transcripties van binnenkomende voice-notes voor geautoriseerde groepsberichten
    - impliciete antwoord-aan-bot-detectie (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan de vermeldingspoort; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden afzenders die niet op de toestaanlijst staan nog steeds geblokkeerd, zelfs als zij antwoorden op een bericht van een gebruiker op de toestaanlijst

    Activeringsopdracht op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Het is door eigenaar beperkt.

  </Tab>
</Tabs>

## Gedrag voor persoonlijk nummer en zelf-chat

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-zelf-chatbeveiligingen geactiveerd:

- leesbevestigingen overslaan voor zelf-chatbeurten
- automatisch triggergedrag via vermeldings-JID negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken zelf-chatantwoorden standaard `[{identity.name}]` of `[openclaw]`

## Berichtnormalisatie en context

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Binnenkomende WhatsApp-berichten worden verpakt in de gedeelde inkomende envelope.

    Als er een geciteerd antwoord bestaat, wordt context toegevoegd in deze vorm:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwoordmetadata-velden worden ook ingevuld wanneer beschikbaar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, afzender-JID/E.164).
    Wanneer het geciteerde antwoorddoel downloadbare media is, slaat OpenClaw dit op via
    de normale opslag voor binnenkomende media en stelt het beschikbaar als `MediaPath`/`MediaType`, zodat
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

    Geautoriseerde groeps-voice-notes worden vóór de vermeldingspoort getranscribeerd wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de voice-note
    het antwoord kan triggeren. Als het transcript de bot nog steeds niet vermeldt, wordt het
    transcript bewaard in de openstaande groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebody's gebruiken beknopte coördinatentekst. Locatielabels/-opmerkingen en contact-/vCard-details worden weergegeven als fenced niet-vertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Pending group history injection">
    Voor groepen kunnen onverwerkte berichten worden gebufferd en als context worden geïnjecteerd wanneer de bot uiteindelijk wordt getriggerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` schakelt uit

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

    Zelfchatbeurten slaan leesbevestigingen over, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Bezorging, opdelen en media

<AccordionGroup>
  <Accordion title="Text chunking">
    - standaardlimiet voor opdelen: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - modus `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op veilig opdelen op lengte

  </Accordion>

  <Accordion title="Outbound media behavior">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraaknotitie) en documenten
    - audiomedia wordt verzonden via de Baileys-`audio`-payload met `ptt: true`, zodat WhatsApp-clients dit weergeven als een push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-spraaknotitie-uitvoer voor WhatsApp blijft dit PTT-pad gebruiken, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus vóór PTT-bezorging
    - `/tts latest` verzendt het nieuwste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` regelt automatische TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIF's wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve dat PTT-spraaknotities eerst de audio en zichtbare tekst afzonderlijk verzenden omdat WhatsApp-clients bijschriften bij spraaknotities niet consistent weergeven
    - mediabronnen kunnen HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijvingen per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (aanpassen van grootte/kwaliteit) om binnen limieten te passen
    - bij mislukte mediaverzending verzendt de fallback voor het eerste item een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Regel dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                                |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                       |
| `"first"`   | Alleen het eerste uitgaande antwoorddeel citeren                      |
| `"all"`     | Elk uitgaand antwoorddeel citeren                                     |
| `"batched"` | Gebufferde antwoorden in de wachtrij citeren en directe antwoorden ongeciteerd laten |

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

| Niveau        | Bevestigingsreacties | Door agent geïnitieerde reacties | Beschrijving                                      |
| ------------- | -------------------- | -------------------------------- | ------------------------------------------------- |
| `"off"`       | Nee                  | Nee                              | Helemaal geen reacties                            |
| `"ack"`       | Ja                   | Nee                              | Alleen bevestigingsreacties (ontvangst vóór antwoord) |
| `"minimal"`   | Ja                   | Ja (voorzichtig)                 | Bevestiging + agentreacties met voorzichtige richtlijnen |
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

WhatsApp ondersteunt directe bevestigingsreacties bij inkomende ontvangst via `channels.whatsapp.ackReaction`.
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

- direct verzonden nadat inkomend verkeer is geaccepteerd (vóór antwoord)
- fouten worden gelogd maar blokkeren normale antwoordbezorging niet
- groepsmodus `mentions` reageert op beurten die door een vermelding zijn geactiveerd; groepsactivatie `always` fungeert als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Meerdere accounts en aanmeldgegevens

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaardaccountselectie: `default` indien aanwezig, anders de eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor opzoeking

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - huidig auth-pad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaardauth in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authstatus voor dat account.

    Wanneer een Gateway bereikbaar is, stopt uitloggen eerst de live WhatsApp-listener voor het geselecteerde account, zodat de gekoppelde sessie niet berichten blijft ontvangen tot de volgende herstart. `openclaw channels remove --channel whatsapp` stopt ook de live listener voordat accountconfiguratie wordt uitgeschakeld of verwijderd.

    In legacy auth-mappen blijft `oauth.json` behouden terwijl Baileys-authbestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratieschrijfbewerkingen

- Ondersteuning voor agenttools omvat de WhatsApp-reactieactie (`react`).
- Actiepoorten:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Door kanalen geïnitieerde configuratieschrijfbewerkingen zijn standaard ingeschakeld (uitschakelen via `channels.whatsapp.configWrites=false`).

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Symptoom: kanaalstatus meldt niet gekoppeld.

    Oplossing:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Symptoom: gekoppeld account met herhaalde verbreking van verbinding of herverbindingspogingen.

    Stille accounts kunnen langer verbonden blijven dan de normale berichttime-out; de watchdog
    herstart wanneer WhatsApp Web-transportactiviteit stopt, de socket sluit of
    activiteit op applicatieniveau langer stil blijft dan het langere veiligheidsvenster.

    Als logs herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, stem dan
    Baileys-sockettimings af onder `web.whatsapp`. Begin met het verkorten van
    `keepAliveIntervalMs` tot onder de idle-time-out van je netwerk en het verhogen van
    `connectTimeoutMs` op langzame of verliesgevoelige verbindingen:

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

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` zegt maar
    `openclaw gateway status` en `openclaw channels status --probe` tonen dat de
    gateway en WhatsApp gezond zijn, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor
    voor legacy crontab-vermeldingen die nog steeds
    `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die verouderde vermeldingen met
    `crontab -e` omdat cron de systemd user-bus-omgeving kan missen en
    ervoor kan zorgen dat dat oude script de gatewaystatus verkeerd rapporteert.

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een TLS-socketverbreking.

    WhatsApp Web-login gebruikt de standaard proxyomgeving van de gatewayhost (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het gatewayproces de proxy-env erft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Uitgaande verzendingen falen snel wanneer er geen actieve gateway-listener bestaat voor het doelaccount.

    Zorg dat de gateway actief is en het account is gekoppeld.

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Transcriptrijen registreren wat de agent heeft gegenereerd. WhatsApp-bezorging wordt afzonderlijk gecontroleerd: OpenClaw beschouwt een automatisch antwoord pas als verzonden nadat Baileys een uitgaande bericht-id retourneert voor ten minste één zichtbare tekst- of mediaverzending.

    Bevestigingsreacties zijn onafhankelijke ontvangstbewijzen vóór antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer gatewaylogs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-allowlistvermeldingen
    - vermeldingspoorten (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere vermeldingen overschrijven eerdere, dus behoud één enkele `groupPolicy` per scope

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp-gatewayruntime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram-gatewaywerking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de `groups`- en `direct`-maps.

Resolutiehiërarchie voor groepsberichten:

De effectieve `groups`-map wordt eerst bepaald: als het account zijn eigen `groups` definieert, vervangt die de root-`groups`-map volledig (geen diepe samenvoeging). Promptopzoeking wordt daarna uitgevoerd op de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Groepswildcard-systeemprompt** (`groups["*"].systemPrompt`): gebruikt wanneer de specifieke groepsvermelding volledig afwezig is in de map, of wanneer die wel bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve `direct`-map wordt eerst bepaald: als het account zijn eigen `direct` definieert, vervangt die de root-`direct`-map volledig (geen diepe samenvoeging). Promptopzoeking wordt daarna uitgevoerd op de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege tekenreeks (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Directe wildcard-systeemprompt** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding volledig afwezig is in de map, of wanneer die wel bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichtgewicht override-bucket per DM voor geschiedenis (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

**Verschil met het gedrag voor meerdere accounts in Telegram:** In Telegram wordt root-`groups` bewust onderdrukt voor alle accounts in een configuratie met meerdere accounts, zelfs voor accounts die zelf geen `groups` definiëren, om te voorkomen dat een bot groepsberichten ontvangt voor groepen waar hij geen deel van uitmaakt. WhatsApp past deze bescherming niet toe: root-`groups` en root-`direct` worden altijd overgenomen door accounts die geen override op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. In een WhatsApp-configuratie met meerdere accounts moet je, als je groeps- of direct-prompts per account wilt, de volledige map expliciet onder elk account definiëren in plaats van te vertrouwen op standaardwaarden op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de allowlist voor groepen op chatniveau. Op root- of accountniveau betekent `groups["*"]` dat "alle groepen worden toegelaten" voor die scope.
- Voeg alleen een wildcardgroep-`systemPrompt` toe wanneer je al wilt dat die scope alle groepen toelaat. Als je nog steeds wilt dat alleen een vaste set groeps-ID's in aanmerking komt, gebruik dan geen `groups["*"]` als standaardprompt. Herhaal de prompt in plaats daarvan op elke expliciet toegelaten groepsvermelding.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` verruimt de set groepen die de groepsafhandeling kan bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Afzendertoegang wordt nog steeds afzonderlijk beheerd via `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` heeft niet hetzelfde neveneffect voor DM's. `direct["*"]` biedt alleen een standaardconfiguratie voor direct chats nadat een DM al is toegelaten door `dmPolicy` plus `allowFrom` of regels uit de pairing-store.

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

## Verwijzingen naar de configuratiereferentie

Primaire referentie:

- [Configuratiereferentie - WhatsApp](/nl/gateway/config-channels#whatsapp)

Belangrijke WhatsApp-velden:

- toegang: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- bezorging: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- meerdere accounts: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrides op accountniveau
- bewerkingen: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering voor meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
