---
read_when:
    - Werken aan het gedrag van WhatsApp-/webkanalen of de routering van het Postvak IN
summary: Ondersteuning voor het WhatsApp-kanaal, toegangsbeheer, afleveringsgedrag en beheeractiviteiten
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T08:38:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productierijp via WhatsApp Web (Baileys). De Gateway beheert de gekoppelde sessie(s); er is geen afzonderlijk Twilio WhatsApp-kanaal.

## Installatie

`openclaw onboard` en `openclaw channels add --channel whatsapp` vragen om de Plugin te installeren wanneer je deze voor het eerst selecteert; `openclaw channels login --channel whatsapp` biedt dezelfde installatiestroom als de Plugin ontbreekt. Ontwikkel-checkouts gebruiken het lokale Plugin-pad; stabiele/bèta-installaties installeren eerst `@openclaw/whatsapp` vanuit ClawHub, met npm als terugvaloptie. De WhatsApp-runtime wordt buiten het kernpakket van OpenClaw op npm geleverd, zodat de runtime-afhankelijkheden bij de externe Plugin blijven. Handmatige installatie:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gebruik het kale npm-pakket (`@openclaw/whatsapp`) alleen als terugvaloptie voor het register; zet alleen een exacte versie vast voor een reproduceerbare installatie.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaardbeleid voor privéberichten is koppeling voor onbekende afzenders.
  </Card>
  <Card title="Problemen met kanalen oplossen" icon="wrench" href="/nl/channels/troubleshooting">
    Diagnose- en herstelprocedures voor meerdere kanalen.
  </Card>
  <Card title="Gateway-configuratie" icon="settings" href="/nl/gateway/configuration">
    Volledige configuratiepatronen en voorbeelden voor kanalen.
  </Card>
</CardGroup>

## Snelle configuratie

<Steps>
  <Step title="Toegangsbeleid configureren">

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

    Aanmelden kan alleen via QR. Zorg op externe hosts of hosts zonder grafische interface voor een betrouwbare manier om de actuele QR-code vóór het aanmelden aan de telefoon te leveren; in de terminal weergegeven QR-codes, schermafbeeldingen of chatbijlagen kunnen onderweg verlopen.

    Voor een specifiek account:

```bash
openclaw channels login --channel whatsapp --account work
```

    Om vóór het aanmelden een bestaande/aangepaste authenticatiemap te koppelen:

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

  <Step title="Het eerste koppelingsverzoek goedkeuren (koppelingsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Koppelingsverzoeken verlopen na 1 uur; er kunnen maximaal 3 verzoeken per account in behandeling zijn.

  </Step>
</Steps>

<Note>
Een afzonderlijk WhatsApp-nummer wordt aanbevolen (de configuratie en metagegevens zijn hiervoor geoptimaliseerd), maar configuraties met een persoonlijk nummer/zelfchat worden volledig ondersteund.
</Note>

## Implementatiepatronen

<AccordionGroup>
  <Accordion title="Speciaal nummer (aanbevolen)">
    - afzonderlijke WhatsApp-identiteit voor OpenClaw
    - duidelijkere toelatingslijsten voor privéberichten en routeringsgrenzen
    - kleinere kans op verwarring met zelfchat

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

  <Accordion title="Terugvaloptie met persoonlijk nummer">
    De onboarding ondersteunt de modus voor persoonlijke nummers en schrijft een basisconfiguratie die geschikt is voor zelfchat: `dmPolicy: "allowlist"`, `allowFrom` met je eigen nummer en `selfChatMode: true`. De runtime-beveiligingen voor zelfchat zijn gebaseerd op het gekoppelde eigen nummer plus `allowFrom`.
  </Accordion>
</AccordionGroup>

## Runtimemodel

- De Gateway beheert de WhatsApp-socket en de lus voor opnieuw verbinden.
- Een bewakingsproces volgt twee signalen onafhankelijk: onbewerkte transportactiviteit van WhatsApp Web en activiteit van toepassingsberichten. Een stille maar verbonden sessie wordt niet opnieuw gestart alleen omdat er recent geen bericht is ontvangen; opnieuw verbinden wordt alleen afgedwongen wanneer gedurende een vast intern tijdvenster (niet door de gebruiker configureerbaar) geen transportframes binnenkomen of toepassingsberichten langer dan viermaal de normale berichttime-out uitblijven. Direct na opnieuw verbinden voor een recent actieve sessie gebruikt dat eerste tijdvenster de kortere normale berichttime-out in plaats van het viervoudige tijdvenster. OpenClaw kan automatisch antwoorden op offlineberichten die Baileys vroeg tijdens dat opnieuw verbinden aflevert, begrensd door de levensduur voor deduplicatie van inkomende bericht-ID's; bij de eerste start blijft de korte beveiliging tegen verouderde geschiedenis actief.
- De sockettimings van Baileys zijn expliciet ingesteld onder `web.whatsapp.*`: `keepAliveIntervalMs` (interval voor toepassingspings), `connectTimeoutMs` (time-out voor de openingshandshake), `defaultQueryTimeoutMs` (wachttijden voor Baileys-query's, plus de time-outs van OpenClaw voor uitgaand verzenden/aanwezigheid en inkomende leesbevestigingen).
- Voor uitgaande verzendingen is een actieve WhatsApp-listener voor het doelaccount vereist; anders mislukken verzendingen onmiddellijk.
- Bij verzendingen naar groepen worden systeemeigen vermeldingsmetagegevens gekoppeld aan tokens van de vorm `@+<digits>` en `@<digits>` (in tekst en mediabijschriften) wanneer het token overeenkomt met de actuele metagegevens van een deelnemer, inclusief groepen die door een LID worden ondersteund.
- Status- en broadcastchats (`@status`, `@broadcast`) worden genegeerd.
- Directe chats gebruiken de sessieregels voor privéberichten (`session.dmScope`; standaard voegt `main` privéberichten samen in de hoofdsessie van de agent). Groepssessies zijn per JID geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-kanalen/nieuwsbrieven kunnen expliciete uitgaande doelen zijn via hun systeemeigen `@newsletter`-JID, waarbij kanaalsessiemetagegevens (`agent:<agentId>:whatsapp:channel:<jid>`) worden gebruikt in plaats van semantiek voor privéberichten.
- Het transport van WhatsApp Web respecteert standaard proxy-omgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` en varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven instellingen per kanaal.
- Als `messages.removeAckAfterReply` is ingeschakeld, wist OpenClaw de bevestigingsreactie zodra een zichtbaar antwoord is afgeleverd.

## De huidige aanvrager bellen met MeowCaller (experimenteel)

De Plugin kan `whatsapp_call` beschikbaar maken in agentbeurten die vanuit WhatsApp zijn gestart. Hiervoor wordt [MeowCaller](https://github.com/purpshell/meowcaller) gebruikt om de huidige geautoriseerde aanvrager via WhatsApp te bellen en na het opnemen een OpenClaw-TTS-bericht af te spelen. De tool heeft geen parameter voor het bestemmingsnummer, zodat een prompt de oproep niet kan omleiden. Standaard uitgeschakeld.

<Warning>
MeowCaller is experimenteel, heeft geen getagde release en gebruikt een afzonderlijk gekoppelde whatsmeow-sessie voor gekoppelde apparaten; de Baileys-referenties van de Plugin kunnen niet worden hergebruikt. Door koppeling wordt nog een gekoppeld apparaat aan hetzelfde WhatsApp-account toegevoegd; scan met de identiteit die OpenClaw gebruikt. De modus met een persoonlijk nummer/zelfchat kan zichzelf niet bellen; gebruik een speciaal OpenClaw-nummer om je persoonlijke nummer te bellen.
</Warning>

<Steps>
  <Step title="Experimentele oproepen inschakelen">

    Voeg `actions.calls: true` toe aan de WhatsApp-kanaalconfiguratie en start de Gateway opnieuw:

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

    Wanneer dit ontbreekt of `false` is, stelt OpenClaw de tool `whatsapp_call` niet beschikbaar.

  </Step>

  <Step title="De beoordeelde MeowCaller-CLI installeren">

    De adapter verwacht een uitvoerbaar bestand `meowcaller` in het `PATH` van de Gateway-host. Bouw de beoordeelde branch totdat [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) is samengevoegd:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Zorg dat `$HOME/.local/bin` in het `PATH` van de Gateway-service staat. Deze revisie heeft expliciete opdrachten `pair` en `notify` voor alleen verzenden; `notify` opent geen microfoon, luidspreker, videoapparaat of diagnostische opname. Vervang dit niet door de opdracht `play` van de upstream-voorbeeld-CLI.

  </Step>

  <Step title="Het gekoppelde MeowCaller-apparaat koppelen">

    Vraag de WhatsApp-agent om de oproepconfiguratie te controleren (de statusactie van `whatsapp_call` meldt de accountspecifieke statusmap en koppelingsopdracht). Voor het standaardaccount:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Voer dit interactief uit, scan de QR-code via **WhatsApp > Linked devices** en wacht op `MeowCaller linked device ready`. Houd `wa-voip.db` privé: dit is de MeowCaller-sessie. Niet-standaardaccounts krijgen via de statusactie hun eigen opslagpad; voer op Windows de bijbehorende PowerShell-opdracht uit.

  </Step>

  <Step title="TTS configureren en bellen vanuit WhatsApp">

    Configureer een voor telefonie geschikte [TTS-provider](/nl/tools/tts), start de Gateway opnieuw en stuur vervolgens een verzoek zoals `Bel me en zeg dat de build is voltooid.` De tool bepaalt de afzender op basis van vertrouwde inkomende context, maakt tijdelijk een privé-WAV-bestand, voert MeowCaller uit gedurende een begrensd oproepvenster en verwijdert daarna het audiobestand. OpenClaw geeft de opslaglocatie van het account expliciet door, wacht na opnemen/afspelen/ophangen op een afsluitstatus van nul en behandelt een time-out of afsluitstatus die niet nul is als een mislukte toolaanroep.

  </Step>
</Steps>

Beperkingen: alleen uitgaande één-op-één-audio-oproepen, geen willekeurige bestemmingsnummers, geen gedeelde authenticatie met de chatverbinding, geen oproepen naar zichzelf vanuit de modus met een persoonlijk nummer/zelfchat, gesynthetiseerde audio is beperkt tot 60 seconden, geen ontvangstbevestiging van hoorbaarheid aan de toestelzijde buiten de voltooiing van opnemen/afspelen/ophangen door MeowCaller, en OpenClaw stopt het begeleidende proces na een begrensd tijdvenster van 115-175 seconden (voor de verbindings-, opname-, afspeel- en afsluitfasen van MeowCaller).

## Goedkeuringsprompts

WhatsApp kan prompts voor uitvoerings- en Plugin-goedkeuring weergeven als reacties met `👍`/`👎`, aangestuurd door de configuratie op het hoogste niveau voor het doorsturen van goedkeuringen:

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

`approvals.exec` en `approvals.plugin` zijn onafhankelijk; WhatsApp als kanaal inschakelen koppelt alleen het transport en verzendt niets tenzij de overeenkomstige goedkeuringscategorie is ingeschakeld en daarheen wordt gerouteerd. De sessiemodus levert alleen systeemeigen emoji-goedkeuringen voor goedkeuringen die vanuit WhatsApp afkomstig zijn. De doelmodus gebruikt de gedeelde doorstuurpijplijn voor expliciete doelen en maakt geen afzonderlijke verspreiding naar privéberichten van goedkeurders.

Voor WhatsApp-goedkeuringsreacties zijn expliciete goedkeurders in `allowFrom` (of `"*"`) vereist. `defaultTo` stelt gewone standaardberichtdoelen in, geen lijst met goedkeurders. Handmatige opdrachten `/approve` doorlopen vóór het afhandelen van de goedkeuring nog steeds het normale WhatsApp-pad voor afzenderautorisatie.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke inhoud, telefoonnummers, groepsidentificatoren, afzendernamen en velden voor sessiecorrelatie bevatten. WhatsApp zendt inkomende `message_received`-hookpayloads niet naar Plugins uit, tenzij je hiervoor kiest:

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

Beperk deze aanmelding tot één account onder `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Schakel dit alleen in voor Plugins die je vertrouwt met inkomende WhatsApp-inhoud en -identificatoren.

## Toegangsbeheer en activering

<Tabs>
  <Tab title="Beleid voor privéberichten">
    `channels.whatsapp.dmPolicy`:

    | Waarde | Gedrag |
    | --- | --- |
    | `pairing` (standaard) | Onbekende afzenders vragen om koppeling; de eigenaar keurt dit goed |
    | `allowlist` | Alleen afzenders in `allowFrom` worden toegelaten |
    | `open` | Vereist dat `allowFrom` `"*"` bevat |
    | `disabled` | Blokkeer alle privéberichten |

    `allowFrom` accepteert nummers in E.164-stijl (intern genormaliseerd). Het is uitsluitend een toegangsbeheerlijst voor afzenders van privéberichten; het blokkeert geen expliciete uitgaande verzendingen naar groeps-JID's of `@newsletter`-kanaal-JID's.

    Overschrijving voor meerdere accounts: `channels.whatsapp.accounts.<id>.dmPolicy` (en `.allowFrom`) heeft voor dat account voorrang op standaardwaarden op kanaalniveau.

    Runtime-opmerkingen:

    - koppelingen blijven behouden in de kanaaltoegangsopslag en worden samengevoegd met de geconfigureerde `allowFrom`
    - geplande automatisering en terugval voor Heartbeat-ontvangers gebruiken expliciete bezorgdoelen of de geconfigureerde `allowFrom`; goedkeuringen van DM-koppelingen zijn geen impliciete ontvangers van Cron/Heartbeat
    - als er geen toelatingslijst is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt uitgaande `fromMe`-DM's (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt) nooit automatisch

  </Tab>

  <Tab title="Groepsbeleid en toelatingslijsten">
    Groepstoegang heeft twee lagen:

    1. **Toelatingslijst voor groepslidmaatschap** (`channels.whatsapp.groups`): als `groups` is weggelaten, komen alle groepen in aanmerking; als deze aanwezig is, fungeert deze als toelatingslijst voor groepen (`"*"` laat alles toe).
    2. **Beleid voor groepsafzenders** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` omzeilt de toelatingslijst voor afzenders, `allowlist` vereist een overeenkomst met `groupAllowFrom` (of `*`), en `disabled` blokkeert alle inkomende groepsberichten.

    Als `groupAllowFrom` niet is ingesteld, vallen afzendercontroles terug op `allowFrom` wanneer deze vermeldingen bevat. Toelatingslijsten voor afzenders worden vóór activering door vermelding/antwoord geëvalueerd.

    Als er helemaal geen `channels.whatsapp`-blok bestaat, valt de runtime terug op `groupPolicy: "allowlist"` (met een waarschuwing in het logboek), zelfs als `channels.defaults.groupPolicy` op iets anders is ingesteld.

    <Note>
    Het bepalen van groepslidmaatschap heeft een vangnet voor één account: als slechts één WhatsApp-account is geconfigureerd en de bijbehorende `accounts.<id>.groups` een expliciet leeg object (`{}`) is, wordt dit behandeld als 'niet ingesteld' en wordt teruggevallen op de hoofdmap `channels.whatsapp.groups`, in plaats van stilzwijgend elke groep te blokkeren. Als er twee of meer accounts zijn geconfigureerd, blijft een expliciet lege accountmap leeg en wordt niet teruggevallen — zo kan één account doelbewust alle groepen uitschakelen zonder andere accounts te beïnvloeden.
    </Note>

  </Tab>

  <Tab title="Vermeldingen en /activation">
    Voor groepsantwoorden is standaard een vermelding vereist. Detectie van vermeldingen omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, met terugval op `messages.groupChat.mentionPatterns`)
    - transcripties van inkomende spraaknotities voor geautoriseerde groepsberichten
    - impliciete detectie van antwoorden aan de bot (de afzender van het beantwoorde bericht komt overeen met de botidentiteit)

    Beveiliging: citeren/beantwoorden voldoet alleen aan de vermeldingstoets — het verleent **geen** afzenderautorisatie. Met `groupPolicy: "allowlist"` blijven afzenders die niet op de toelatingslijst staan geblokkeerd, zelfs wanneer ze antwoorden op een bericht van een gebruiker die wel op de toelatingslijst staat.

    Activeringsopdracht op sessieniveau: `/activation mention` of `/activation always`. Hiermee wordt de sessiestatus bijgewerkt (niet de globale configuratie) en dit is beperkt tot de eigenaar.

  </Tab>
</Tabs>

## Geconfigureerde ACP-bindingen

WhatsApp ondersteunt permanente ACP-bindingen via `bindings[]` op het hoogste niveau:

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

Directe chats komen overeen met E.164-nummers; groepen komen overeen met WhatsApp-groeps-JID's. Groepstoelatingslijsten, afzenderbeleid en toetsen voor vermelding/activering worden uitgevoerd voordat OpenClaw waarborgt dat de gebonden ACP-sessie bestaat. Een overeenkomende binding beheert de route — uitzendgroepen vertakken die beurt niet naar gewone WhatsApp-sessies.

## Gedrag voor persoonlijke nummers en chats met jezelf

Wanneer het gekoppelde eigen nummer ook in `allowFrom` staat, worden beveiligingsmaatregelen voor chats met jezelf geactiveerd: leesbevestigingen voor beurten in chats met jezelf worden overgeslagen, automatisch activeringsgedrag op basis van vermeldings-JID's dat jezelf zou pingen wordt genegeerd, en antwoorden krijgen standaard het voorvoegsel `[{identity.name}]` (of `[openclaw]`) wanneer `messages.responsePrefix` niet is ingesteld.

## Berichtnormalisatie en context

<AccordionGroup>
  <Accordion title="Inkomende envelop en antwoordcontext">
    Inkomende berichten worden verpakt in de gedeelde inkomende envelop. Een geciteerd antwoord voegt context toe in deze vorm:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwoordmetadata (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 van de afzender) wordt waar beschikbaar ingevuld. Als het geciteerde doel downloadbare media bevat, slaat OpenClaw deze op via de normale opslag voor inkomende media en stelt het `MediaPath`/`MediaType` beschikbaar, zodat de agent deze rechtstreeks kan inspecteren in plaats van alleen `<media:image>` te zien.

  </Accordion>

  <Accordion title="Mediaplaatshouders en extractie van locatie/contactgegevens">
    Berichten die alleen media bevatten, worden genormaliseerd naar plaatshouders: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Geautoriseerde spraaknotities in groepen worden vóór de vermeldingstoets getranscribeerd wanneer de inhoud alleen `<media:audio>` is, zodat het uitspreken van de botvermelding in de spraaknotitie het antwoord kan activeren. Als het transcript de bot nog steeds niet vermeldt, blijft het in de wachtende groepsgeschiedenis staan in plaats van als de onbewerkte plaatshouder.

    Locatie-inhoud wordt weergegeven als beknopte coördinatentekst. Locatielabels/-opmerkingen en contact-/vCard-details worden weergegeven als afgeschermde, niet-vertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van wachtende groepsgeschiedenis">
    Niet-verwerkte groepsberichten worden gebufferd en als context geïnjecteerd wanneer de bot uiteindelijk wordt geactiveerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`, met terugval op `messages.groupChat.historyLimit`
    - `0` schakelt dit uit

    Injectiemarkeringen: `[Chat messages since your last reply - for context]` en `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Leesbevestigingen">
    Standaard ingeschakeld voor geaccepteerde inkomende berichten. Globaal uitschakelen:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Overschrijving per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Bij beurten in chats met jezelf worden leesbevestigingen overgeslagen, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Bezorging, opdelen en media

<AccordionGroup>
  <Accordion title="Tekst opdelen">
    - standaardlimiet per deel: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt vervolgens terug op veilig opdelen op lengte

  </Accordion>

  <Accordion title="Gedrag voor uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraaknotitie) en documenten
    - audio wordt verzonden als de Baileys-`audio`-payload met `ptt: true`, waardoor deze als een push-to-talk-spraaknotitie wordt weergegeven; `audioAsVoice` blijft behouden in antwoordpayloads, zodat uitvoer van TTS-spraaknotities dit pad blijft volgen, ongeacht de bronindeling van de provider
    - oorspronkelijke Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus`; al het andere (waaronder MP3-/WebM-uitvoer van Microsoft Edge TTS) wordt vóór PTT-bezorging met `ffmpeg` getranscodeerd naar mono Ogg/Opus van 48 kHz
    - `/tts latest` verzendt het recentste assistentantwoord als één spraaknotitie en onderdrukt herhaalde verzendingen van hetzelfde antwoord; `/tts chat on|off|default` regelt automatische TTS voor de huidige chat
    - `gifPlayback: true` bij videoverzendingen schakelt het afspelen van geanimeerde GIF's in
    - `forceDocument`/`asDocument` leidt uitgaande afbeeldingen, GIF's en video's via de Baileys-documentpayload om mediacompressie van WhatsApp te voorkomen, waarbij de bepaalde bestandsnaam en het MIME-type behouden blijven
    - bijschriften worden toegepast op het eerste media-item in een antwoord met meerdere media, behalve bij PTT-spraaknotities: de audio wordt eerst zonder bijschrift verzonden, waarna het bijschrift als afzonderlijk tekstbericht wordt verzonden (WhatsApp-clients geven bijschriften bij spraaknotities niet consistent weer)
    - de mediabron kan HTTP(S), `file://` of een lokaal pad zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en terugvalgedrag">
    - limiet voor inkomende opslag en uitgaande verzending: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijving per account: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (aanpassen van afmetingen/kwaliteit) om binnen de limieten te passen, tenzij `forceDocument`/`asDocument` om documentbezorging vraagt
    - als het verzenden van media mislukt, verzendt de terugval voor het eerste item een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vervallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

`channels.whatsapp.replyToMode` regelt het oorspronkelijke citeren bij antwoorden (uitgaande antwoorden citeren zichtbaar het inkomende bericht):

| Waarde            | Gedrag                                                          |
| ----------------- | --------------------------------------------------------------- |
| `"off"` (standaard) | Nooit citeren; verzenden als een gewoon bericht                |
| `"first"`         | Alleen het eerste uitgaande antwoorddeel citeren                 |
| `"all"`           | Elk uitgaand antwoorddeel citeren                                |
| `"batched"`       | Gebundelde antwoorden in de wachtrij citeren; directe antwoorden ongeciteerd laten |

Overschrijving per account: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Reactieniveau

`channels.whatsapp.reactionLevel` bepaalt hoe breed de agent emoji-reacties gebruikt:

| Niveau                | Bevestigingsreacties | Door agent geïnitieerde reacties |
| --------------------- | -------------------- | -------------------------------- |
| `"off"`               | Nee                  | Nee                              |
| `"ack"`               | Ja                   | Nee                              |
| `"minimal"` (standaard) | Ja                 | Ja, terughoudend aanbevolen      |
| `"extensive"`         | Ja                   | Ja, actief aanbevolen            |

Overschrijving per account: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Bevestigingsreacties

`channels.whatsapp.ackReaction` verzendt onmiddellijk een reactie bij ontvangst van een inkomend bericht, afhankelijk van `reactionLevel` (onderdrukt bij `"off"`):

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

Opmerkingen: wordt onmiddellijk verzonden nadat het inkomende bericht is geaccepteerd (vóór het antwoord); als `ackReaction` aanwezig is zonder `emoji`, gebruikt WhatsApp de identiteitsemoji van de gerouteerde agent, met terugval op "👀" (laat `ackReaction` weg of stel `emoji: ""` in voor geen bevestiging); fouten worden gelogd maar blokkeren de bezorging van antwoorden niet; groepsmodus `mentions` reageert alleen op beurten die door een vermelding zijn geactiveerd, terwijl groepsactivering `always` die controle omzeilt; WhatsApp gebruikt alleen `channels.whatsapp.ackReaction` (de verouderde `messages.ackReaction` is hier niet van toepassing).

## Statusreacties tijdens de levenscyclus

Stel `messages.statusReactions.enabled: true` in zodat WhatsApp tijdens een beurt de bevestigingsreactie kan vervangen in plaats van een statische ontvangstemoji te laten staan, waarbij statussen zoals in wachtrij, nadenken, toolactiviteit, Compaction, voltooid en fout worden doorlopen:

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

Opmerkingen: `channels.whatsapp.ackReaction` bepaalt nog steeds of directe berichten en groepen in aanmerking komen; de status in de wachtrij gebruikt dezelfde effectieve emoji als gewone bevestigingsreacties; WhatsApp heeft per bericht één reactievak voor de bot, zodat levenscyclusupdates de huidige reactie ter plaatse vervangen; `messages.removeAckAfterReply: true` wist de definitieve statusreactie na de geconfigureerde wachttijd voor voltooid/fout; categorieën voor toolemoji's omvatten `tool`, `coding`, `web`, `deploy`, `build` en `concierge`.

## Meerdere accounts en referenties

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    Account-ID's zijn afkomstig uit `channels.whatsapp.accounts`. Voor het standaardaccount wordt `default` geselecteerd als dit aanwezig is; anders wordt de eerste geconfigureerde account-ID geselecteerd (alfabetisch gesorteerd). Account-ID's worden intern genormaliseerd voor opzoeken.
  </Accordion>

  <Accordion title="Paden voor aanmeldgegevens en compatibiliteit met oudere versies">
    - huidig authenticatiepad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (back-up: `creds.json.bak`)
    - de oude standaarda​​uthenticatie in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor processen met het standaardaccount

  </Accordion>

  <Accordion title="Gedrag bij afmelden">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authenticatiestatus voor dat account. Wanneer een Gateway bereikbaar is, stopt afmelden eerst de actieve listener voor dat account, zodat de gekoppelde sessie vóór de volgende herstart geen berichten meer ontvangt. `openclaw channels remove --channel whatsapp` stopt de actieve listener eveneens voordat de accountconfiguratie wordt uitgeschakeld of verwijderd.

    In oude authenticatiemappen blijft `oauth.json` behouden, terwijl Baileys-authenticatiebestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Hulpmiddelen, acties en configuratiewijzigingen

- Ondersteuning voor agenthulpmiddelen omvat de WhatsApp-reactieactie (`react`).
- Actiepoorten: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (bestaande acties zijn standaard `true`), `channels.whatsapp.actions.calls` (standaard `false`, zie MeowCaller hierboven).
- Door het kanaal geïnitieerde configuratiewijzigingen zijn standaard ingeschakeld; schakel ze uit via `channels.whatsapp.configWrites: false`.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Niet gekoppeld (QR vereist)">
    Symptoom: de kanaalstatus meldt dat het kanaal niet is gekoppeld.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Gekoppeld maar niet verbonden/herverbindingslus">
    Symptoom: gekoppeld account met herhaalde verbrekingen of herverbindingspogingen.

    Stille accounts kunnen langer verbonden blijven dan de normale berichttime-out; de waakhond start alleen opnieuw wanneer de WhatsApp Web-transportactiviteit stopt, de socket wordt gesloten of de activiteit op toepassingsniveau langer stil blijft dan het ruimere veiligheidsvenster (zie Runtime-model hierboven).

    Als de logboeken herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, stel dan de sockettimings van Baileys af onder `web.whatsapp`. Begin door `keepAliveIntervalMs` korter in te stellen dan de time-out voor inactiviteit van uw netwerk en verhoog `connectTimeoutMs` voor trage verbindingen of verbindingen met pakketverlies:

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

    Als de lus aanhoudt nadat de hostconnectiviteit en timings zijn verholpen, maakt u een back-up van de authenticatiemap van het account en koppelt u het account opnieuw:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldt, maar zowel `openclaw gateway status` als `openclaw channels status --probe` een gezonde status tonen, voert u `openclaw doctor` uit. Op Linux waarschuwt doctor voor oude crontab-vermeldingen die het buiten gebruik gestelde script `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die vermeldingen met `crontab -e` — Cron beschikt mogelijk niet over de systemd-gebruikersbusomgeving, waardoor dat oude script de status van de Gateway onjuist kan rapporteren.

  </Accordion>

  <Accordion title="QR-aanmelding verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR-code wordt weergegeven, met `status=408 Request Time-out` of een verbroken TLS-socketverbinding.

    WhatsApp Web-aanmelding gebruikt de standaard proxyomgeving van de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters, `NO_PROXY`). Controleer of het Gateway-proces de proxyomgevingsvariabelen overneemt en of `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken onmiddellijk wanneer er geen actieve Gateway-listener voor het doelaccount bestaat. Controleer of de Gateway actief is en het account is gekoppeld.
  </Accordion>

  <Accordion title="Antwoord verschijnt in het transcript maar niet in WhatsApp">
    Transcriptregels registreren wat de agent heeft gegenereerd; de bezorging via WhatsApp wordt afzonderlijk gecontroleerd. OpenClaw beschouwt een automatisch antwoord pas als verzonden nadat Baileys voor ten minste één zichtbare tekst- of mediaverzending een uitgaand bericht-ID retourneert.

    Bevestigingsreacties zijn onafhankelijke ontvangstbevestigingen vóór het antwoord — een geslaagde reactie bewijst niet dat het latere tekst-/media-antwoord is geaccepteerd. Controleer de Gateway-logboeken op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten worden onverwacht genegeerd">
    Controleer in deze volgorde: `groupPolicy`, `groupAllowFrom`/`allowFrom`, vermeldingen in de `groups`-toelatingslijst, vermeldingstoegang (`requireMention` + vermeldingspatronen) en dubbele sleutels in `openclaw.json` (latere vermeldingen in JSON5 overschrijven eerdere — gebruik één `groupPolicy` per bereik).

    Als `channels.whatsapp.groups` aanwezig is, kan WhatsApp nog steeds berichten uit andere groepen waarnemen, maar OpenClaw verwijdert ze vóór de sessieroutering. Voeg de groeps-JID toe aan `channels.whatsapp.groups` of voeg `groups["*"]` toe om alle groepen toe te laten, terwijl de autorisatie van afzenders onder `groupPolicy`/`groupAllowFrom` blijft vallen.

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    De WhatsApp Gateway-runtime moet Node gebruiken. Bun wordt gemarkeerd als incompatibel met een stabiele werking van de WhatsApp-/Telegram-Gateway.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt systeemprompts in Telegram-stijl voor groepen en directe chats via de toewijzingen `groups` en `direct`.

Resolutie voor groepsberichten: eerst wordt de effectieve `groups`-toewijzing bepaald — als het account überhaupt een eigen `groups`-sleutel definieert, vervangt deze de hoofdtoewijzing `groups` volledig (geen diepe samenvoeging). Daarna wordt de prompt opgezocht in die ene resulterende toewijzing:

1. **Groepsspecifieke prompt** (`groups["<groupId>"].systemPrompt`): wordt gebruikt wanneer de groepsvermelding bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Een lege tekenreeks (`""`) onderdrukt het jokerteken en past geen prompt toe.
2. **Jokertekenprompt voor groepen** (`groups["*"].systemPrompt`): wordt gebruikt wanneer de specifieke groepsvermelding ontbreekt of zonder sleutel `systemPrompt` bestaat.

De resolutie voor directe berichten volgt hetzelfde patroon voor de toewijzing `direct` en `direct["*"]`.

<Note>
`dms` blijft de eenvoudige container voor het overschrijven van de geschiedenis per privébericht (`dms.<id>.historyLimit`). Promptoverschrijvingen bevinden zich onder `direct`.
</Note>

<Note>
Dit gedrag waarbij het account de hoofdconfiguratie voor promptresolutie vervangt, is een gewone oppervlakkige overschrijving: elke `groups`-/`direct`-sleutel van een account, inclusief een expliciet leeg object, vervangt de hoofdtoewijzing. Dit verschilt van de hierboven beschreven controle van de toelatingslijst voor groepslidmaatschap, die bij één account een vangnet heeft voor een per ongeluk lege `groups: {}`.
</Note>

**Verschil met Telegram:** Telegram onderdrukt de hoofdconfiguratie `groups` voor elk account in een configuratie met meerdere accounts (zelfs voor accounts zonder eigen `groups`) om te voorkomen dat een bot groepsberichten ontvangt voor groepen waarvan deze geen lid is. WhatsApp past die beveiliging niet toe — de hoofdconfiguraties `groups`/`direct` worden overgenomen door elk account zonder eigen overschrijving, ongeacht het aantal accounts. Definieer in een WhatsApp-configuratie met meerdere accounts de volledige toewijzing expliciet onder elk account als u prompts per account wilt.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratietoewijzing per groep als de toelatingslijst voor groepen op chatniveau. Op zowel hoofd- als accountniveau betekent `groups["*"]`: "alle groepen worden toegelaten" voor dat bereik.
- Voeg alleen een `systemPrompt` met jokerteken toe wanneer u al wilt dat dit bereik alle groepen toelaat. Als alleen een vaste reeks groeps-ID's in aanmerking moet komen, herhaalt u de prompt voor elke expliciet toegelaten vermelding in plaats van `groups["*"]` te gebruiken.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` breidt uit welke groepen door de groepsafhandeling worden verwerkt; het autoriseert niet elke afzender in die groepen — dat blijft geregeld door `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` heeft geen vergelijkbaar neveneffect voor privéberichten: `direct["*"]` levert alleen een standaardconfiguratie nadat een privébericht al is toegelaten door `dmPolicy` in combinatie met `allowFrom` of regels uit de koppelingsopslag.

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

Primaire referentie: [Configuratiereferentie - WhatsApp](/nl/gateway/config-channels#whatsapp)

| Onderdeel        | Velden                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Toegang          | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Bezorging        | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Meerdere accounts | `accounts.<id>.enabled`, `accounts.<id>.authDir` en andere overschrijvingen per account                        |
| Bewerkingen      | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Sessiegedrag     | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Problemen oplossen](/nl/channels/troubleshooting)
