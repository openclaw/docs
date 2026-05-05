---
read_when:
    - Werken aan WhatsApp-/webkanaalgedrag of inboxroutering
summary: WhatsApp-kanaalondersteuning, toegangscontroles, aflevergedrag en operationeel beheer
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:16:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). Gateway beheert gekoppelde sessie(s).

## Installeren (op aanvraag)

- Onboarding (`openclaw onboard`) en `openclaw channels add --channel whatsapp`
  vragen om de WhatsApp-Plugin te installeren wanneer je deze voor het eerst selecteert.
- `openclaw channels login --channel whatsapp` biedt ook de installatiestroom wanneer
  de Plugin nog niet aanwezig is.
- Dev-kanaal + git-checkout: gebruikt standaard het lokale Plugin-pad.
- Stabiel/Beta: gebruikt het npm-pakket `@openclaw/whatsapp` op de huidige officiële
  release-tag.

Handmatige installatie blijft beschikbaar:

```bash
openclaw plugins install @openclaw/whatsapp
```

Gebruik het kale pakket om de huidige officiële release-tag te volgen. Pin alleen een exacte
versie wanneer je een reproduceerbare installatie nodig hebt.

Op Windows heeft de WhatsApp-Plugin Git nodig op `PATH` tijdens `npm install`, omdat
een van de Baileys/libsignal-afhankelijkheden wordt opgehaald via een git-URL. Installeer
Git for Windows, herstart daarna de shell en voer de installatie opnieuw uit:

```powershell
winget install --id Git.Git -e
```

Portable Git werkt ook als de `bin`-directory ervan op `PATH` staat.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Standaard DM-beleid is koppelen voor onbekende afzenders.
  </Card>
  <Card title="Kanaalproblemen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Kanaaloverstijgende diagnostiek en herstel-playbooks.
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

    Om een bestaande/aangepaste WhatsApp Web-auth-directory te koppelen vóór het inloggen:

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

  <Step title="Eerste koppelingsverzoek goedkeuren (bij gebruik van koppelingsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelingsverzoeken verlopen na 1 uur. Openstaande verzoeken zijn beperkt tot 3 per kanaal.

  </Step>
</Steps>

<Note>
OpenClaw raadt aan om WhatsApp waar mogelijk op een apart nummer te draaien. (De kanaalmetadata en configuratiestroom zijn geoptimaliseerd voor die opzet, maar configuraties met een persoonlijk nummer worden ook ondersteund.)
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciaal nummer (aanbevolen)">
    Dit is de schoonste operationele modus:

    - afzonderlijke WhatsApp-identiteit voor OpenClaw
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

  <Accordion title="Fallback met persoonlijk nummer">
    Onboarding ondersteunt de modus met persoonlijk nummer en schrijft een zelf-chat-vriendelijke basisconfiguratie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` bevat je persoonlijke nummer
    - `selfChatMode: true`

    Tijdens runtime baseren zelf-chatbeveiligingen zich op het gekoppelde eigen nummer en `allowFrom`.

  </Accordion>

  <Accordion title="Kanaalscope alleen voor WhatsApp Web">
    Het berichtenplatformkanaal is gebaseerd op WhatsApp Web (`Baileys`) in de huidige OpenClaw-kanaalarchitectuur.

    Er is geen afzonderlijk Twilio WhatsApp-berichtenkanaal in het ingebouwde chatkanaalregister.

  </Accordion>
</AccordionGroup>

## Runtimemodel

- Gateway beheert de WhatsApp-socket en reconnect-lus.
- De reconnect-watchdog gebruikt WhatsApp Web-transportactiviteit, niet alleen inkomend app-berichtvolume, zodat een stille gekoppeld-apparaat-sessie niet alleen opnieuw wordt gestart omdat niemand recent een bericht heeft gestuurd. Een langere applicatiestilte-limiet forceert nog steeds een reconnect als transportframes blijven binnenkomen maar er tijdens het watchdog-venster geen applicatieberichten worden verwerkt; na een tijdelijke reconnect voor een recent actieve sessie gebruikt die applicatiestiltecontrole de normale berichttime-out voor het eerste herstelvenster.
- Baileys-sockettimings zijn expliciet onder `web.whatsapp.*`: `keepAliveIntervalMs` bepaalt WhatsApp Web-applicatiepings, `connectTimeoutMs` bepaalt de time-out voor de openingshandshake, en `defaultQueryTimeoutMs` bepaalt Baileys-querytime-outs.
- Uitgaande verzendingen vereisen een actieve WhatsApp-listener voor het doelaccount.
- Groepsverzendingen voegen native vermeldingsmetadata toe voor `@+<digits>`- en `@<digits>`-tokens in tekst en mediabijschriften wanneer het token overeenkomt met huidige WhatsApp-deelnemersmetadata, inclusief LID-ondersteunde groepen.
- Status- en broadcastchats worden genegeerd (`@status`, `@broadcast`).
- De reconnect-watchdog volgt WhatsApp Web-transportactiviteit, niet alleen inkomend app-berichtvolume: stille gekoppeld-apparaat-sessies blijven actief zolang transportframes doorgaan, maar een transportstoring forceert ruim vóór het latere pad voor externe verbreking een reconnect.
- Directe chats gebruiken DM-sessieregels (`session.dmScope`; standaard `main` vouwt DM's samen naar de hoofdsessie van de agent).
- Groepssessies zijn geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters kunnen expliciete uitgaande doelen zijn met hun native `@newsletter`-JID. Uitgaande nieuwsbriefverzendingen gebruiken kanaalsessiemetadata (`agent:<agentId>:whatsapp:channel:<jid>`) in plaats van DM-sessiesemantiek.
- WhatsApp Web-transport respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven kanaalspecifieke WhatsApp-proxyinstellingen.
- Wanneer `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de WhatsApp-ack-reactie nadat een zichtbaar antwoord is afgeleverd.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke berichtinhoud, telefoonnummers,
groepsidentificaties, afzendernamen en sessiecorrelatievelden bevatten. Daarom
zendt WhatsApp inkomende `message_received`-hookpayloads niet uit naar plugins
tenzij je dit expliciet inschakelt:

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
en identificaties te ontvangen.

## Toegangscontrole en activatie

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy` beheert directe chattoegang:

    - `pairing` (standaard)
    - `allowlist`
    - `open` (vereist dat `allowFrom` `"*"` bevat)
    - `disabled`

    `allowFrom` accepteert E.164-achtige nummers (intern genormaliseerd).

    `allowFrom` is een toegangscontrolelijst voor DM-afzenders. Het blokkeert geen expliciete uitgaande verzendingen naar WhatsApp-groeps-JID's of `@newsletter`-kanaal-JID's.

    Override voor meerdere accounts: `channels.whatsapp.accounts.<id>.dmPolicy` (en `allowFrom`) krijgen voorrang op kanaalbrede standaardwaarden voor dat account.

    Details van runtimegedrag:

    - koppelingen worden opgeslagen in de kanaal-allow-store en samengevoegd met geconfigureerde `allowFrom`
    - geplande automatisering en Heartbeat-ontvangerfallback gebruiken expliciete bezorgdoelen of geconfigureerde `allowFrom`; DM-koppelingsgoedkeuringen zijn geen impliciete Cron- of Heartbeat-ontvangers
    - als er geen allowlist is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt nooit automatisch uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid + allowlists">
    Groepstoegang heeft twee lagen:

    1. **Allowlist voor groepslidmaatschap** (`channels.whatsapp.groups`)
       - als `groups` is weggelaten, komen alle groepen in aanmerking
       - als `groups` aanwezig is, fungeert dit als groeps-allowlist (`"*"` toegestaan)

    2. **Beleid voor groepsafzenders** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: afzender-allowlist wordt omzeild
       - `allowlist`: afzender moet overeenkomen met `groupAllowFrom` (of `*`)
       - `disabled`: blokkeer alle inkomende groepsberichten

    Fallback voor afzender-allowlist:

    - als `groupAllowFrom` niet is ingesteld, valt runtime terug op `allowFrom` wanneer beschikbaar
    - afzender-allowlists worden geëvalueerd vóór activatie door vermelding/antwoord

    Opmerking: als er helemaal geen `channels.whatsapp`-blok bestaat, is de runtimefallback voor groepsbeleid `allowlist` (met een waarschuwingslog), zelfs als `channels.defaults.groupPolicy` is ingesteld.

  </Tab>

  <Tab title="Vermeldingen + /activation">
    Groepsantwoorden vereisen standaard een vermelding.

    Vermeldingsdetectie omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - inkomende transcripties van spraaknotities voor geautoriseerde groepsberichten
    - impliciete detectie van antwoorden op de bot (antwoordafzender komt overeen met botidentiteit)

    Beveiligingsopmerking:

    - citeren/antwoorden voldoet alleen aan de vermeldingspoort; het verleent **geen** afzenderautorisatie
    - met `groupPolicy: "allowlist"` worden niet-geallowliste afzenders nog steeds geblokkeerd, zelfs als ze antwoorden op het bericht van een geallowliste gebruiker

    Activatiecommando op sessieniveau:

    - `/activation mention`
    - `/activation always`

    `activation` werkt de sessiestatus bij (niet de globale configuratie). Het is beperkt tot de eigenaar.

  </Tab>
</Tabs>

## Gedrag met persoonlijk nummer en zelf-chat

Wanneer het gekoppelde eigen nummer ook aanwezig is in `allowFrom`, worden WhatsApp-zelf-chatbeveiligingen geactiveerd:

- leesbevestigingen overslaan voor zelf-chatbeurten
- auto-triggergedrag voor vermeldings-JID's negeren dat anders jezelf zou pingen
- als `messages.responsePrefix` niet is ingesteld, gebruiken zelf-chatantwoorden standaard `[{identity.name}]` of `[openclaw]`

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

    Geautoriseerde groepsspraaknotities worden vóór vermeldingspoorten getranscribeerd wanneer de
    body alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de spraaknotitie
    het antwoord kan triggeren. Als de transcriptie de bot nog steeds niet vermeldt, wordt de
    transcriptie bewaard in de openstaande groepsgeschiedenis in plaats van de ruwe placeholder.

    Locatiebody's gebruiken beknopte coördinatentekst. Locatielabels/opmerkingen en contact-/vCard-details worden weergegeven als omheinde niet-vertrouwde metadata, niet als inline prompttekst.

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

    Beurten in een chat met jezelf slaan leesbevestigingen over, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Bezorging, opsplitsing en media

<AccordionGroup>
  <Accordion title="Tekst opsplitsen">
    - standaard chunklimiet: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - de modus `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op lengteveilige opsplitsing

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraaknotitie) en documenten
    - audiomedia worden verzonden via de Baileys-`audio`-payload met `ptt: true`, zodat WhatsApp-clients deze weergeven als een push-to-talk-spraaknotitie
    - antwoordpayloads behouden `audioAsVoice`; TTS-spraaknotitie-uitvoer voor WhatsApp blijft dit PTT-pad gebruiken, zelfs wanneer de provider MP3 of WebM retourneert
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus` voor compatibiliteit met spraaknotities
    - niet-Ogg-audio, inclusief Microsoft Edge TTS MP3/WebM-uitvoer, wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus vóór PTT-bezorging
    - `/tts latest` verzendt het laatste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen voor hetzelfde antwoord; `/tts chat on|off|default` regelt automatische TTS voor de huidige WhatsApp-chat
    - afspelen van geanimeerde GIF's wordt ondersteund via `gifPlayback: true` bij videoverzendingen
    - bij het verzenden van antwoordpayloads met meerdere media-items worden bijschriften toegepast op het eerste media-item, behalve dat PTT-spraaknotities de audio eerst en zichtbare tekst afzonderlijk verzenden omdat WhatsApp-clients bijschriften bij spraaknotities niet consistent weergeven
    - mediabronnen kunnen HTTP(S), `file://` of lokale paden zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en terugvalgedrag">
    - opslaglimiet voor inkomende media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijvingen per account gebruiken `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (formaat wijzigen/kwaliteitssweep) om binnen de limieten te passen
    - bij mislukte mediaverzending verzendt de terugval voor het eerste item een tekstwaarschuwing in plaats van de reactie stilzwijgend te laten vallen

  </Accordion>
</AccordionGroup>

## Antwoordcitaat

WhatsApp ondersteunt native antwoordcitaten, waarbij uitgaande antwoorden het inkomende bericht zichtbaar citeren. Regel dit met `channels.whatsapp.replyToMode`.

| Waarde      | Gedrag                                                               |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Nooit citeren; verzenden als een gewoon bericht                      |
| `"first"`   | Alleen de eerste uitgaande antwoordchunk citeren                     |
| `"all"`     | Elke uitgaande antwoordchunk citeren                                 |
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

| Niveau        | Ack-reacties | Door agent gestarte reacties | Beschrijving                                      |
| ------------- | ------------ | ---------------------------- | ------------------------------------------------- |
| `"off"`       | Nee          | Nee                          | Helemaal geen reacties                            |
| `"ack"`       | Ja           | Nee                          | Alleen ack-reacties (ontvangst vóór antwoord)     |
| `"minimal"`   | Ja           | Ja (conservatief)            | Ack + agentreacties met conservatieve begeleiding |
| `"extensive"` | Ja           | Ja (aangemoedigd)            | Ack + agentreacties met aangemoedigde begeleiding |

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

WhatsApp ondersteunt onmiddellijke ack-reacties bij inkomende ontvangst via `channels.whatsapp.ackReaction`.
Ack-reacties worden begrensd door `reactionLevel`: ze worden onderdrukt wanneer `reactionLevel` `"off"` is.

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
- groepsmodus `mentions` reageert op beurten die door een vermelding worden geactiveerd; groepsactivatie `always` werkt als bypass voor deze controle
- WhatsApp gebruikt `channels.whatsapp.ackReaction` (legacy `messages.ackReaction` wordt hier niet gebruikt)

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardinstellingen">
    - account-id's komen uit `channels.whatsapp.accounts`
    - standaardaccountselectie: `default` indien aanwezig, anders de eerste geconfigureerde account-id (gesorteerd)
    - account-id's worden intern genormaliseerd voor opzoeken

  </Accordion>

  <Accordion title="Paden voor referenties en legacy-compatibiliteit">
    - huidig auth-pad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - back-upbestand: `creds.json.bak`
    - legacy standaardauth in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountflows

  </Accordion>

  <Accordion title="Uitloggedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authstatus voor dat account.

    Wanneer een Gateway bereikbaar is, stopt uitloggen eerst de live WhatsApp-listener voor het geselecteerde account, zodat de gekoppelde sessie geen berichten blijft ontvangen tot de volgende herstart. `openclaw channels remove --channel whatsapp` stopt ook de live listener voordat accountconfiguratie wordt uitgeschakeld of verwijderd.

    In legacy auth-mappen blijft `oauth.json` behouden terwijl Baileys-authbestanden worden verwijderd.

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

  <Accordion title="Gekoppeld maar verbroken / herverbindingslus">
    Symptoom: gekoppeld account met herhaalde verbrekeningen of herverbindingspogingen.

    Stille accounts kunnen na de normale berichttime-out verbonden blijven; de watchdog
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
    openclaw doctor
    openclaw logs --follow
    ```

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldt maar
    `openclaw gateway status` en `openclaw channels status --probe` laten zien dat de
    gateway en WhatsApp gezond zijn, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor
    voor legacy crontab-items die nog steeds
    `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die verouderde items met
    `crontab -e` omdat Cron de systemd-gebruikersbusomgeving kan missen en
    ervoor kan zorgen dat dat oude script Gateway-gezondheid verkeerd rapporteert.

    Koppel indien nodig opnieuw met `channels login`.

  </Accordion>

  <Accordion title="QR-login verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt getoond met `status=408 Request Time-out` of een verbroken TLS-socket.

    WhatsApp Web-login gebruikt de standaard proxyomgeving van de gatewayhost (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters en `NO_PROXY`). Controleer of het gatewayproces de proxy-env erft en dat `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken snel wanneer er geen actieve gatewaylistener bestaat voor het doelaccount.

    Zorg dat de gateway draait en dat het account is gekoppeld.

  </Accordion>

  <Accordion title="Antwoord verschijnt in transcript maar niet in WhatsApp">
    Transcriptrijen registreren wat de agent heeft gegenereerd. WhatsApp-bezorging wordt afzonderlijk gecontroleerd: OpenClaw behandelt een automatisch antwoord pas als verzonden nadat Baileys een uitgaand bericht-id retourneert voor minstens één zichtbare tekst- of mediaverzending.

    Ack-reacties zijn onafhankelijke ontvangsten vóór antwoord. Een geslaagde reactie bewijst niet dat het latere tekst- of media-antwoord door WhatsApp is geaccepteerd.

    Controleer gatewaylogs op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten onverwacht genegeerd">
    Controleer in deze volgorde:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - allowlist-items in `groups`
    - vermeldingsgating (`requireMention` + vermeldingspatronen)
    - dubbele sleutels in `openclaw.json` (JSON5): latere items overschrijven eerdere, dus houd één `groupPolicy` per scope aan

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp-gatewayruntime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel voor stabiele WhatsApp/Telegram-gatewaywerking.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt Telegram-achtige systeemprompts voor groepen en directe chats via de maps `groups` en `direct`.

Resolutiehiërarchie voor groepsberichten:

De effectieve map `groups` wordt eerst bepaald: als het account zijn eigen `groups` definieert, vervangt deze de rootmap `groups` volledig (geen diepe merge). Promptopzoeking wordt daarna uitgevoerd op de resulterende enkele map:

1. **Groepsspecifieke systeemprompt** (`groups["<groupId>"].systemPrompt`): gebruikt wanneer het specifieke groepsitem in de map bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Groepswildcard-systeemprompt** (`groups["*"].systemPrompt`): gebruikt wanneer het specifieke groepsitem volledig afwezig is in de map, of wanneer het bestaat maar geen sleutel `systemPrompt` definieert.

Resolutiehiërarchie voor directe berichten:

De effectieve map `direct` wordt eerst bepaald: als het account zijn eigen `direct` definieert, vervangt deze de rootmap `direct` volledig (geen diepe merge). Promptopzoeking wordt daarna uitgevoerd op de resulterende enkele map:

1. **Direct-specifieke systeemprompt** (`direct["<peerId>"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding in de map bestaat **en** de sleutel `systemPrompt` is gedefinieerd. Als `systemPrompt` een lege string (`""`) is, wordt de wildcard onderdrukt en wordt er geen systeemprompt toegepast.
2. **Direct-wildcard-systeemprompt** (`direct["*"].systemPrompt`): gebruikt wanneer de specifieke peer-vermelding volledig ontbreekt in de map, of wanneer die wel bestaat maar geen sleutel `systemPrompt` definieert.

<Note>
`dms` blijft de lichte per-DM-bucket voor geschiedenisoverschrijvingen (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

**Verschil met het multi-accountgedrag van Telegram:** In Telegram wordt root-`groups` bewust onderdrukt voor alle accounts in een multi-accountconfiguratie — zelfs accounts die zelf geen `groups` definiëren — om te voorkomen dat een bot groepsberichten ontvangt voor groepen waarvan hij geen lid is. WhatsApp past deze beveiliging niet toe: root-`groups` en root-`direct` worden altijd overgenomen door accounts die geen override op accountniveau definiëren, ongeacht hoeveel accounts zijn geconfigureerd. Als je in een multi-accountconfiguratie van WhatsApp prompts per account voor groepen of directe chats wilt, definieer dan de volledige map expliciet onder elk account in plaats van te vertrouwen op standaardwaarden op rootniveau.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratiemap per groep als de allowlist voor groepen op chatniveau. Op root- of accountniveau betekent `groups["*"]` dat "alle groepen worden toegelaten" voor dat bereik.
- Voeg alleen een wildcardgroep-`systemPrompt` toe wanneer je al wilt dat dat bereik alle groepen toelaat. Als je nog steeds wilt dat alleen een vaste set groeps-ID's in aanmerking komt, gebruik dan niet `groups["*"]` als standaardwaarde voor de prompt. Herhaal de prompt in plaats daarvan op elke expliciet toegestane groepsvermelding.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` vergroot de set groepen die groepsafhandeling kunnen bereiken, maar autoriseert op zichzelf niet elke afzender in die groepen. Afzendertoegang wordt nog steeds afzonderlijk geregeld door `channels.whatsapp.groupPolicy` en `channels.whatsapp.groupAllowFrom`.
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
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, overrides op accountniveau
- beheer: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- sessiegedrag: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Gerelateerd

- [Pairing](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Multi-agentroutering](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
