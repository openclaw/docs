---
read_when:
    - Werken aan het gedrag van WhatsApp-/webkanalen of inboxroutering
summary: Ondersteuning voor het WhatsApp-kanaal, toegangsbeheer, afleveringsgedrag en beheeractiviteiten
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T15:16:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: productieklaar via WhatsApp Web (Baileys). De Gateway beheert de gekoppelde sessie(s); er is geen afzonderlijk Twilio WhatsApp-kanaal.

## Installatie

`openclaw onboard` en `openclaw channels add --channel whatsapp` vragen om de plugin te installeren wanneer je deze voor het eerst selecteert; `openclaw channels login --channel whatsapp` biedt dezelfde installatiestroom als de plugin ontbreekt. Ontwikkelcheck-outs gebruiken het lokale pluginpad; stabiele/bèta-installaties installeren eerst `@openclaw/whatsapp` vanuit ClawHub, met npm als terugvaloptie. De WhatsApp-runtime wordt buiten het OpenClaw-kernpakket op npm geleverd, zodat de runtimeafhankelijkheden bij de externe plugin blijven. Handmatige installatie:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gebruik het kale npm-pakket (`@openclaw/whatsapp`) alleen voor de terugval naar het register; zet een exacte versie alleen vast voor een reproduceerbare installatie.

<CardGroup cols={3}>
  <Card title="Koppelen" icon="link" href="/nl/channels/pairing">
    Het standaard DM-beleid voor onbekende afzenders is koppelen.
  </Card>
  <Card title="Probleemoplossing voor kanalen" icon="wrench" href="/nl/channels/troubleshooting">
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

    Aanmelden kan alleen via QR. Zorg op externe hosts of hosts zonder grafische interface vóór het aanmelden voor een betrouwbare manier om de actuele QR-code op de telefoon te krijgen; in de terminal weergegeven QR-codes, schermafbeeldingen of chatbijlagen kunnen tijdens de overdracht verlopen.

    Voor een specifiek account:

```bash
openclaw channels login --channel whatsapp --account work
```

    Een bestaande/aangepaste authenticatiemap vóór het aanmelden koppelen:

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
    - duidelijkere DM-toegestane lijsten en routeringsgrenzen
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

  <Accordion title="Terugval naar persoonlijk nummer">
    De onboarding ondersteunt de modus voor persoonlijke nummers en schrijft een basisconfiguratie die geschikt is voor zelfchat: `dmPolicy: "allowlist"`, `allowFrom` inclusief je eigen nummer, `selfChatMode: true`. Runtimebeveiligingen voor zelfchat gebruiken het gekoppelde eigen nummer plus `allowFrom`.
  </Accordion>
</AccordionGroup>

## Runtimemodel

- De Gateway beheert de WhatsApp-socket en de lus voor opnieuw verbinden.
- Een watchdog volgt twee signalen onafhankelijk: onbewerkte transportactiviteit van WhatsApp Web en activiteit van applicatieberichten. Een stille maar verbonden sessie wordt niet opnieuw gestart alleen omdat er onlangs geen bericht is binnengekomen; opnieuw verbinden wordt alleen afgedwongen wanneer er gedurende een vast intern tijdvenster (niet door de gebruiker configureerbaar) geen transportframes binnenkomen of applicatieberichten langer dan 4x de normale berichttime-out uitblijven. Direct na opnieuw verbinden voor een onlangs actieve sessie gebruikt dat eerste tijdvenster de kortere normale berichttime-out in plaats van het 4x-venster. OpenClaw kan automatisch antwoorden op offlineberichten die Baileys vroeg tijdens die herverbinding aflevert, begrensd door de levensduur van de deduplicatie van inkomende bericht-ID's; bij de eerste start blijft de korte beveiliging tegen verouderde geschiedenis van kracht.
- De sockettimings van Baileys zijn expliciet ingesteld onder `web.whatsapp.*`: `keepAliveIntervalMs` (pinginterval van de applicatie), `connectTimeoutMs` (time-out voor de openingshandshake), `defaultQueryTimeoutMs` (wachttijden voor Baileys-query's, plus de time-outs van OpenClaw voor uitgaand verzenden/aanwezigheid en inkomende leesbevestigingen).
- Voor uitgaande verzendingen is een actieve WhatsApp-listener voor het doelaccount vereist; anders mislukken verzendingen onmiddellijk.
- Groepsverzendingen voegen systeemeigen vermeldingsmetagegevens toe voor tokens `@+<digits>` en `@<digits>` (in tekst en mediabijschriften) wanneer het token overeenkomt met actuele metagegevens van deelnemers, inclusief groepen die door LID worden ondersteund.
- Status- en broadcastchats (`@status`, `@broadcast`) worden genegeerd.
- Directe chats gebruiken de sessieregels voor DM's (`session.dmScope`; standaard voegt `main` DM's samen in de hoofdsessie van de agent). Groepssessies worden per JID geïsoleerd (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp-kanalen/nieuwsbrieven kunnen expliciete uitgaande doelen zijn via hun systeemeigen `@newsletter`-JID, waarbij kanaalsessiemetagegevens (`agent:<agentId>:whatsapp:channel:<jid>`) worden gebruikt in plaats van DM-semantiek.
- Het WhatsApp Web-transport respecteert standaard proxyomgevingsvariabelen op de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, varianten in kleine letters). Geef de voorkeur aan proxyconfiguratie op hostniveau boven instellingen per kanaal.
- Als `messages.removeAckAfterReply` is ingeschakeld, verwijdert OpenClaw de bevestigingsreactie zodra een zichtbaar antwoord is afgeleverd.

## De huidige aanvrager bellen met MeowCaller (experimenteel)

De plugin kan `whatsapp_call` beschikbaar stellen tijdens agentbeurten die vanuit WhatsApp afkomstig zijn. Deze gebruikt [MeowCaller](https://github.com/purpshell/meowcaller) om een WhatsApp-spraakoproep naar de huidige geautoriseerde aanvrager te plaatsen en na beantwoording een OpenClaw-TTS-bericht af te spelen. De tool heeft geen parameter voor het bestemmingsnummer, zodat een prompt de oproep niet kan omleiden. Standaard uitgeschakeld.

<Warning>
MeowCaller is experimenteel, heeft geen getagde release en gebruikt een afzonderlijk gekoppelde whatsmeow-sessie voor gekoppelde apparaten — deze kan de Baileys-inloggegevens van de plugin niet hergebruiken. Door koppeling wordt een extra gekoppeld apparaat aan hetzelfde WhatsApp-account toegevoegd; scan met de identiteit die OpenClaw gebruikt. De modus met een persoonlijk nummer/zelfchat kan zichzelf niet bellen; gebruik een speciaal OpenClaw-nummer om je persoonlijke nummer te bellen.
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

    Wanneer deze ontbreekt of `false` is, stelt OpenClaw de tool `whatsapp_call` niet beschikbaar.

  </Step>

  <Step title="De beoordeelde MeowCaller-CLI installeren">

    De adapter verwacht een uitvoerbaar bestand `meowcaller` in de `PATH` van de Gateway-host. Bouw de beoordeelde branch totdat [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) is samengevoegd:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Zorg dat `$HOME/.local/bin` in de `PATH` van de Gateway-service staat. Deze revisie heeft expliciete opdrachten `pair` en alleen-verzendenopdrachten `notify`; `notify` opent geen microfoon, luidspreker, videoapparaat of diagnostische opname. Vervang dit niet door de opdracht `play` van de upstream voorbeeld-CLI.

  </Step>

  <Step title="Het gekoppelde MeowCaller-apparaat koppelen">

    Vraag de WhatsApp-agent om de oproepconfiguratie te controleren (de statusactie `whatsapp_call` rapporteert de accountspecifieke statusmap en koppelingsopdracht). Voor het standaardaccount:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Voer dit interactief uit, scan de QR via **WhatsApp > Linked devices** en wacht op `MeowCaller linked device ready`. Houd `wa-voip.db` privé — dit is de MeowCaller-sessie. Niet-standaardaccounts krijgen hun eigen opslagpad via de statusactie; voer op Windows de bijbehorende PowerShell-opdracht uit.

  </Step>

  <Step title="TTS configureren en bellen vanuit WhatsApp">

    Configureer een [TTS-provider](/nl/tools/tts) die geschikt is voor telefonie, start de Gateway opnieuw en stuur vervolgens een verzoek zoals `Call me and say the build finished.` De tool bepaalt de afzender uit de vertrouwde inkomende context, synthetiseert een tijdelijk privé-WAV-bestand, voert MeowCaller uit binnen een begrensd oproepvenster en verwijdert het audiobestand daarna. OpenClaw geeft de opslaglocatie van het account expliciet door, wacht na beantwoorden/afspelen/ophangen op een exitstatus van nul en behandelt een time-out of een exitstatus die niet nul is als een mislukte toolaanroep.

  </Step>
</Steps>

Beperkingen: alleen één-op-één uitgaande audio-oproepen, geen willekeurige bestemmingsnummers, geen gedeelde authenticatie met de chatverbinding, geen oproepen naar zichzelf vanuit de modus voor een persoonlijk nummer/zelfchat, gesynthetiseerde audio beperkt tot 60 seconden, geen ontvangstbevestiging voor hoorbaarheid op de handset buiten de voltooiing van beantwoorden/afspelen/ophangen door MeowCaller, en OpenClaw stopt het begeleidende proces na een begrensd venster van 115-175 seconden (voor de fasen verbinding, beantwoorden, afspelen en afsluiten van MeowCaller).

## Goedkeuringsprompts

WhatsApp kan goedkeuringsprompts voor uitvoering en plugins weergeven als reacties `👍`/`👎`, beheerd door de configuratie op het hoogste niveau voor het doorsturen van goedkeuringen:

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

`approvals.exec` en `approvals.plugin` zijn onafhankelijk; WhatsApp als kanaal inschakelen koppelt alleen het transport en verzendt niets, tenzij de overeenkomende goedkeuringscategorie is ingeschakeld en daarheen wordt gerouteerd. De sessiemodus levert systeemeigen emoji-goedkeuringen alleen voor goedkeuringen die vanuit WhatsApp afkomstig zijn. De doelmodus gebruikt de gedeelde doorstuurpijplijn voor expliciete doelen en maakt geen afzonderlijke uitwaaiering naar DM's van goedkeurders.

Voor WhatsApp-goedkeuringsreacties zijn expliciete goedkeurders vereist in `allowFrom` (of `"*"`). `defaultTo` stelt gewone standaardberichtdoelen in, geen lijst met goedkeurders. Handmatige opdrachten `/approve` doorlopen vóór het afhandelen van de goedkeuring nog steeds het normale WhatsApp-autorisatiepad voor afzenders.

## Plugin-hooks en privacy

Inkomende WhatsApp-berichten kunnen persoonlijke inhoud, telefoonnummers, groeps-id's, namen van afzenders en velden voor sessiecorrelatie bevatten. WhatsApp zendt inkomende hookpayloads `message_received` niet naar plugins uit, tenzij je je hiervoor aanmeldt:

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

Beperk de aanmelding tot één account onder `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Schakel dit alleen in voor plugins die je vertrouwt met inkomende WhatsApp-inhoud en -id's.

## Toegangsbeheer en activering

<Tabs>
  <Tab title="DM-beleid">
    `channels.whatsapp.dmPolicy`:

    | Waarde | Gedrag |
    | --- | --- |
    | `pairing` (standaard) | Onbekende afzenders vragen om koppeling; de eigenaar keurt dit goed |
    | `allowlist` | Alleen afzenders uit `allowFrom` worden toegelaten |
    | `open` | Vereist dat `allowFrom` `"*"` bevat |
    | `disabled` | Alle DM's blokkeren |

    `allowFrom` accepteert nummers in E.164-stijl (intern genormaliseerd). Dit is uitsluitend een toegangsbeheerlijst voor DM-afzenders — expliciete uitgaande verzendingen naar groeps-JID's of `@newsletter`-kanaal-JID's worden er niet door geblokkeerd.

    Overschrijving voor meerdere accounts: `channels.whatsapp.accounts.<id>.dmPolicy` (en `.allowFrom`) hebben voor dat account voorrang op de standaardwaarden op kanaalniveau.

    Runtime-opmerkingen:

    - koppelingen blijven behouden in de toestemmingsopslag van het kanaal en worden samengevoegd met de geconfigureerde `allowFrom`
    - geplande automatisering en terugval voor Heartbeat-ontvangers gebruiken expliciete afleveringsdoelen of de geconfigureerde `allowFrom`; goedkeuringen van DM-koppelingen zijn niet impliciet ontvangers van Cron/Heartbeat
    - als er geen toestemmingslijst is geconfigureerd, is het gekoppelde eigen nummer standaard toegestaan
    - OpenClaw koppelt uitgaande `fromMe`-DM's nooit automatisch (berichten die je vanaf het gekoppelde apparaat naar jezelf stuurt)

  </Tab>

  <Tab title="Groepsbeleid en toestemmingslijsten">
    Groepstoegang heeft twee lagen:

    1. **Toestemmingslijst voor groepslidmaatschap** (`channels.whatsapp.groups`): als `groups` is weggelaten, komen alle groepen in aanmerking; indien aanwezig, fungeert deze als toestemmingslijst voor groepen (`"*"` staat alles toe).
    2. **Beleid voor groepsafzenders** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` omzeilt de toestemmingslijst voor afzenders, `allowlist` vereist een overeenkomst met `groupAllowFrom` (of `*`), `disabled` blokkeert alle inkomende groepsberichten.

    Als `groupAllowFrom` niet is ingesteld, vallen afzendercontroles terug op `allowFrom` wanneer deze vermeldingen bevat. Toestemmingslijsten voor afzenders worden vóór activering via vermelding/antwoord geëvalueerd.

    Als er helemaal geen `channels.whatsapp`-blok bestaat, valt de runtime terug op `groupPolicy: "allowlist"` (met een waarschuwing in het logboek), zelfs als `channels.defaults.groupPolicy` op iets anders is ingesteld.

    <Note>
    De bepaling van groepslidmaatschap heeft een vangnet voor één account: als slechts één WhatsApp-account is geconfigureerd en de bijbehorende `accounts.<id>.groups` een expliciet leeg object is (`{}`), wordt dit behandeld als 'niet ingesteld' en wordt teruggevallen op de hoofdmap `channels.whatsapp.groups`, in plaats van stilzwijgend elke groep te blokkeren. Als er 2+ accounts zijn geconfigureerd, blijft een expliciet lege accountmap leeg en wordt niet teruggevallen — zo kan één account doelbewust alle groepen uitschakelen zonder andere accounts te beïnvloeden.
    </Note>

  </Tab>

  <Tab title="Vermeldingen en /activation">
    Voor groepsantwoorden is standaard een vermelding vereist. Detectie van vermeldingen omvat:

    - expliciete WhatsApp-vermeldingen van de botidentiteit
    - geconfigureerde regex-patronen voor vermeldingen (`agents.list[].groupChat.mentionPatterns`, terugval `messages.groupChat.mentionPatterns`)
    - transcripties van inkomende spraakberichten voor geautoriseerde groepsberichten
    - impliciete detectie van antwoorden aan de bot (de afzender van het antwoord komt overeen met de botidentiteit)

    Beveiliging: citeren/antwoorden voldoet alleen aan de vermeldingsvoorwaarde — het verleent **geen** afzenderautorisatie. Met `groupPolicy: "allowlist"` blijven afzenders die niet op de toestemmingslijst staan geblokkeerd, zelfs wanneer ze antwoorden op een bericht van een gebruiker die wel op de toestemmingslijst staat.

    Activeringsopdracht op sessieniveau: `/activation mention` of `/activation always`. Hiermee wordt de sessiestatus bijgewerkt (niet de globale configuratie) en dit is voorbehouden aan de eigenaar.

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

Directe chats komen overeen met E.164-nummers; groepen komen overeen met WhatsApp-groeps-JID's. Groepstoestemmingslijsten, afzenderbeleid en voorwaarden voor vermelding/activering worden uitgevoerd voordat OpenClaw waarborgt dat de gebonden ACP-sessie bestaat. Een overeenkomende binding beheert de route — broadcastgroepen verspreiden die beurt niet naar gewone WhatsApp-sessies.

## Gedrag voor het persoonlijke nummer en de chat met jezelf

Wanneer het gekoppelde eigen nummer ook voorkomt in `allowFrom`, worden beveiligingen voor chats met jezelf geactiveerd: leesbevestigingen voor beurten in de chat met jezelf worden overgeslagen, automatische activering via vermeldings-JID's die jezelf zouden pingen wordt genegeerd en antwoorden gaan standaard naar `[{identity.name}]` (of `[openclaw]`) wanneer `messages.responsePrefix` niet is ingesteld.

## Berichtnormalisatie en context

<AccordionGroup>
  <Accordion title="Inkomende envelop en antwoordcontext">
    Inkomende berichten worden verpakt in de gedeelde inkomende envelop. Een geciteerd antwoord voegt context in deze vorm toe:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Antwoordmetadata (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 van de afzender) wordt ingevuld wanneer deze beschikbaar is. Als het geciteerde doel downloadbare media bevat, slaat OpenClaw deze via de normale opslag voor inkomende media op en stelt het `MediaPath`/`MediaType` beschikbaar, zodat de agent deze rechtstreeks kan inspecteren in plaats van alleen `<media:image>` te zien.

  </Accordion>

  <Accordion title="Mediaplaatsaanduidingen en extractie van locaties/contactpersonen">
    Berichten met uitsluitend media worden genormaliseerd tot plaatsaanduidingen: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Geautoriseerde spraakberichten in groepen worden vóór de vermeldingsvoorwaarde getranscribeerd wanneer de inhoud uitsluitend `<media:audio>` is, zodat het uitspreken van de botvermelding in het spraakbericht het antwoord kan activeren. Als de transcriptie de bot nog steeds niet vermeldt, blijft deze in de wachtende groepsgeschiedenis staan in plaats van als de onbewerkte plaatsaanduiding.

    Locatie-inhoud wordt weergegeven als beknopte coördinatentekst. Locatielabels/-opmerkingen en contact-/vCard-gegevens worden weergegeven als omheinde niet-vertrouwde metadata, niet als inline prompttekst.

  </Accordion>

  <Accordion title="Injectie van wachtende groepsgeschiedenis">
    Niet-verwerkte groepsberichten worden gebufferd en als context geïnjecteerd wanneer de bot uiteindelijk wordt geactiveerd.

    - standaardlimiet: `50`
    - configuratie: `channels.whatsapp.historyLimit`, terugval `messages.groupChat.historyLimit`
    - `0` schakelt dit uit

    Injectiemarkeringen: `[Chat messages since your last reply - for context]` en `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Leesbevestigingen">
    Standaard ingeschakeld voor geaccepteerde inkomende berichten. Globaal uitschakelen:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Overschrijving per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Bij beurten in de chat met jezelf worden leesbevestigingen overgeslagen, zelfs wanneer ze globaal zijn ingeschakeld.

  </Accordion>
</AccordionGroup>

## Aflevering, opsplitsing en media

<AccordionGroup>
  <Accordion title="Tekstopsplitsing">
    - standaardlimiet per deel: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` geeft de voorkeur aan alineagrenzen (lege regels) en valt daarna terug op lengteveilige opsplitsing

  </Accordion>

  <Accordion title="Gedrag van uitgaande media">
    - ondersteunt payloads voor afbeeldingen, video, audio (PTT-spraakbericht) en documenten
    - audio wordt verzonden als de Baileys-payload `audio` met `ptt: true`, waardoor deze als een push-to-talk-spraakbericht wordt weergegeven; `audioAsVoice` blijft behouden in antwoordpayloads, zodat uitvoer van TTS-spraakberichten dit pad blijft volgen, ongeacht de bronindeling van de provider
    - native Ogg/Opus-audio wordt verzonden als `audio/ogg; codecs=opus`; al het andere (waaronder MP3/WebM-uitvoer van Microsoft Edge TTS) wordt met `ffmpeg` getranscodeerd naar 48 kHz mono Ogg/Opus vóór PTT-aflevering
    - `/tts latest` verzendt het nieuwste assistentantwoord als één spraakbericht en onderdrukt herhaalde verzendingen van hetzelfde antwoord; `/tts chat on|off|default` beheert automatische TTS voor de huidige chat
    - door `gifPlayback: true` voor videoverzendingen in te schakelen, wordt het afspelen als geanimeerde GIF mogelijk
    - `forceDocument`/`asDocument` routeert uitgaande afbeeldingen, GIF's en video's via de Baileys-documentpayload om mediacompressie van WhatsApp te vermijden, waarbij de bepaalde bestandsnaam en het MIME-type behouden blijven
    - bijschriften worden toegepast op het eerste media-item in een antwoord met meerdere media, behalve bij PTT-spraakberichten: de audio wordt eerst zonder bijschrift verzonden, waarna het bijschrift als afzonderlijk tekstbericht wordt verzonden (WhatsApp-clients geven bijschriften bij spraakberichten niet consistent weer)
    - de mediabron kan HTTP(S), `file://` of een lokaal pad zijn

  </Accordion>

  <Accordion title="Limieten voor mediagrootte en terugvalgedrag">
    - opslaglimiet voor inkomende media en verzendlimiet voor uitgaande media: `channels.whatsapp.mediaMaxMb` (standaard `50`)
    - overschrijving per account: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - afbeeldingen worden automatisch geoptimaliseerd (grootte-/kwaliteitsscan) om binnen de limieten te passen, tenzij `forceDocument`/`asDocument` om aflevering als document verzoekt
    - als het verzenden van media mislukt, verzendt de terugval voor het eerste item een tekstwaarschuwing in plaats van het antwoord stilzwijgend te laten vervallen

  </Accordion>
</AccordionGroup>

## Antwoorden citeren

`channels.whatsapp.replyToMode` beheert native citeren in antwoorden (uitgaande antwoorden citeren zichtbaar het inkomende bericht):

| Waarde             | Gedrag                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (standaard) | Nooit citeren; als gewoon bericht verzenden                           |
| `"first"`         | Alleen het eerste deel van het uitgaande antwoord citeren                      |
| `"all"`           | Elk deel van het uitgaande antwoord citeren                               |
| `"batched"`       | Gebundelde antwoorden in de wachtrij citeren; directe antwoorden ongeciteerd laten |

Overschrijving per account: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Reactieniveau

`channels.whatsapp.reactionLevel` bepaalt hoe breed de agent emoji-reacties gebruikt:

| Niveau                 | Bevestigingsreacties | Door de agent geïnitieerde reacties  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Nee            | Nee                         |
| `"ack"`               | Ja           | Nee                         |
| `"minimal"` (standaard) | Ja           | Ja, terughoudende richtlijn |
| `"extensive"`         | Ja           | Ja, aangemoedigde richtlijn   |

Overschrijving per account: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Bevestigingsreacties

`channels.whatsapp.ackReaction` verzendt direct na ontvangst van een inkomend bericht een reactie, afhankelijk van `reactionLevel` (onderdrukt wanneer `"off"`):

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

Opmerkingen: wordt direct verzonden nadat het inkomende bericht is geaccepteerd (vóór het antwoord); als `ackReaction` aanwezig is zonder `emoji`, gebruikt WhatsApp de identiteitsemoji van de gerouteerde agent, met "👀" als terugval (laat `ackReaction` weg of stel `emoji: ""` in voor geen bevestiging); fouten worden gelogd maar blokkeren de aflevering van antwoorden niet; groepsmodus `mentions` reageert alleen bij beurten die door een vermelding zijn geactiveerd, terwijl groepsactivering `always` die controle omzeilt; WhatsApp gebruikt uitsluitend `channels.whatsapp.ackReaction` (verouderde `messages.ackReaction` is hier niet van toepassing).

## Reacties op levenscyclusstatus

Stel `messages.statusReactions.enabled: true` in om WhatsApp tijdens een beurt de bevestigingsreactie te laten vervangen in plaats van een statische ontvangstemoji te laten staan, waarbij toestanden zoals in de wachtrij, nadenken, toolactiviteit, Compaction, voltooid en fout worden doorlopen:

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

Opmerkingen: `channels.whatsapp.ackReaction` bepaalt nog steeds of directe berichten en groepen in aanmerking komen; de wachtrijstatus gebruikt dezelfde effectieve emoji als gewone bevestigingsreacties; WhatsApp heeft per bericht één reactievak voor de bot, zodat levenscyclusupdates de huidige reactie ter plaatse vervangen; `messages.removeAckAfterReply: true` wist de uiteindelijke statusreactie na de geconfigureerde wachttijd voor voltooid/fout; categorieën voor toolemoji's omvatten `tool`, `coding`, `web`, `deploy`, `build` en `concierge`.

## Meerdere accounts en inloggegevens

<AccordionGroup>
  <Accordion title="Accountselectie en standaardwaarden">
    Account-id's zijn afkomstig uit `channels.whatsapp.accounts`. De standaardaccountselectie is `default` indien aanwezig, anders het eerste geconfigureerde account-id (alfabetisch gesorteerd). Account-id's worden intern genormaliseerd voor opzoekacties.
  </Accordion>

  <Accordion title="Paden voor aanmeldgegevens en compatibiliteit met oudere versies">
    - huidig authenticatiepad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (back-up: `creds.json.bak`)
    - de verouderde standaarda authenticatie in `~/.openclaw/credentials/` wordt nog steeds herkend/gemigreerd voor standaardaccountstromen

  </Accordion>

  <Accordion title="Afmeldgedrag">
    `openclaw channels logout --channel whatsapp [--account <id>]` wist de WhatsApp-authenticatiestatus voor dat account. Wanneer een Gateway bereikbaar is, stopt afmelden eerst de actieve listener voor dat account, zodat de gekoppelde sessie vóór de volgende herstart geen berichten meer ontvangt. `openclaw channels remove --channel whatsapp` stopt ook de actieve listener voordat de accountconfiguratie wordt uitgeschakeld of verwijderd.

    In verouderde authenticatiemappen blijft `oauth.json` behouden terwijl de Baileys-authenticatiebestanden worden verwijderd.

  </Accordion>
</AccordionGroup>

## Tools, acties en configuratieschrijfbewerkingen

- Ondersteuning voor agenttools omvat de WhatsApp-reactieactie (`react`).
- Actiepoorten: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (bestaande acties gebruiken standaard `true`), `channels.whatsapp.actions.calls` (standaard `false`, zie MeowCaller hierboven).
- Door het kanaal geïnitieerde configuratieschrijfbewerkingen zijn standaard ingeschakeld; schakel ze uit via `channels.whatsapp.configWrites: false`.

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Niet gekoppeld (QR vereist)">
    Symptoom: de kanaalstatus meldt dat het kanaal niet is gekoppeld.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Gekoppeld maar niet verbonden/herverbindingslus">
    Symptoom: een gekoppeld account met herhaalde verbrekingen of pogingen om opnieuw verbinding te maken.

    Inactieve accounts kunnen langer dan de normale berichttime-out verbonden blijven; de watchdog start alleen opnieuw wanneer de transportactiviteit van WhatsApp Web stopt, de socket wordt gesloten of de activiteit op applicatieniveau langer dan het ruimere veiligheidsvenster stil blijft (zie het runtimemodel hierboven).

    Als de logboeken herhaaldelijk `status=408 Request Time-out Connection was lost` tonen, pas dan de timing van de Baileys-socket aan onder `web.whatsapp`. Begin door `keepAliveIntervalMs` korter in te stellen dan de inactiviteitstime-out van je netwerk en verhoog `connectTimeoutMs` op langzame verbindingen of verbindingen met pakketverlies:

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

    Als de lus blijft bestaan nadat de hostconnectiviteit en timing zijn hersteld, maak dan een back-up van de authenticatiemap van het account en koppel het opnieuw:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Als `~/.openclaw/logs/whatsapp-health.log` `Gateway inactive` meldt, maar `openclaw gateway status` en `openclaw channels status --probe` beide een goede status tonen, voer dan `openclaw doctor` uit. Op Linux waarschuwt doctor voor verouderde crontab-vermeldingen die het uitgefaseerde script `~/.openclaw/bin/ensure-whatsapp.sh` aanroepen; verwijder die vermeldingen met `crontab -e` — Cron beschikt mogelijk niet over de systemd-userbusomgeving, waardoor dat oude script de status van de Gateway onjuist kan rapporteren.

  </Accordion>

  <Accordion title="QR-aanmelding verloopt achter een proxy">
    Symptoom: `openclaw channels login --channel whatsapp` mislukt voordat een bruikbare QR wordt weergegeven, met `status=408 Request Time-out` of een verbroken TLS-socketverbinding.

    Aanmelding bij WhatsApp Web gebruikt de standaard proxyomgeving van de Gateway-host (`HTTPS_PROXY`, `HTTP_PROXY`, varianten in kleine letters, `NO_PROXY`). Controleer of het Gateway-proces de proxyomgeving overneemt en of `NO_PROXY` niet overeenkomt met `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Geen actieve listener bij verzenden">
    Uitgaande verzendingen mislukken direct wanneer er geen actieve Gateway-listener voor het doelaccount bestaat. Controleer of de Gateway actief is en het account is gekoppeld.
  </Accordion>

  <Accordion title="Antwoord verschijnt in het transcript maar niet in WhatsApp">
    Transcriptregels registreren wat de agent heeft gegenereerd; de bezorging via WhatsApp wordt afzonderlijk gecontroleerd. OpenClaw beschouwt een automatisch antwoord pas als verzonden nadat Baileys voor ten minste één zichtbare tekst- of mediaverzending een id voor een uitgaand bericht retourneert.

    Bevestigingsreacties zijn onafhankelijke ontvangstbevestigingen vóór het antwoord — een geslaagde reactie bewijst niet dat het latere tekst-/media-antwoord is geaccepteerd. Controleer de Gateway-logboeken op `auto-reply delivery failed` of `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Groepsberichten worden onverwacht genegeerd">
    Controleer in deze volgorde: `groupPolicy`, `groupAllowFrom`/`allowFrom`, vermeldingen in de toelatingslijst van `groups`, vermeldingsfiltering (`requireMention` + vermeldingspatronen) en dubbele sleutels in `openclaw.json` (latere JSON5-vermeldingen overschrijven eerdere — behoud één `groupPolicy` per bereik).

    Als `channels.whatsapp.groups` aanwezig is, kan WhatsApp nog steeds berichten uit andere groepen waarnemen, maar OpenClaw verwijdert ze vóór de sessieroutering. Voeg de groeps-JID toe aan `channels.whatsapp.groups`, of voeg `groups["*"]` toe om alle groepen toe te laten terwijl de afzenderautorisatie onder `groupPolicy`/`groupAllowFrom` blijft vallen.

  </Accordion>

  <Accordion title="Bun-runtimewaarschuwing">
    OpenClaw-Gateways vereisen Node. Bun biedt de `node:sqlite`-API niet die door de canonieke statusopslag wordt gebruikt, en doctor migreert verouderde Bun-services naar Node.
  </Accordion>
</AccordionGroup>

## Systeemprompts

WhatsApp ondersteunt systeemprompts in Telegram-stijl voor groepen en directe chats via de toewijzingen `groups` en `direct`.

Resolutie voor groepsberichten: eerst wordt de effectieve toewijzing `groups` bepaald — als het account überhaupt een eigen sleutel `groups` definieert, vervangt deze de hoofdtoewijzing `groups` volledig (geen diepe samenvoeging). Daarna wordt de prompt opgezocht in die ene resulterende toewijzing:

1. **Groepsspecifieke prompt** (`groups["<groupId>"].systemPrompt`): wordt gebruikt wanneer de groepsvermelding bestaat **en** de sleutel `systemPrompt` ervan is gedefinieerd. Een lege tekenreeks (`""`) onderdrukt het jokerteken en past geen prompt toe.
2. **Prompt met groepsjokerteken** (`groups["*"].systemPrompt`): wordt gebruikt wanneer de specifieke groepsvermelding ontbreekt of zonder sleutel `systemPrompt` bestaat.

De resolutie voor directe berichten volgt hetzelfde patroon voor de toewijzing `direct` en `direct["*"]`.

<Note>
`dms` blijft de eenvoudige bucket voor het overschrijven van de geschiedenis per direct bericht (`dms.<id>.historyLimit`). Promptoverschrijvingen staan onder `direct`.
</Note>

<Note>
Dit gedrag waarbij het account de hoofdwaarde vervangt voor promptresolutie is een gewone oppervlakkige overschrijving: elke accountssleutel `groups`/`direct`, inclusief een expliciet leeg object, vervangt de hoofdtoewijzing. Dit verschilt van de hierboven beschreven controle van de toelatingslijst voor groepslidmaatschap, die voor één account een vangnet heeft voor een per ongeluk lege `groups: {}`.
</Note>

**Verschil met Telegram:** Telegram onderdrukt de hoofdwaarde `groups` voor elk account in een configuratie met meerdere accounts (zelfs voor accounts zonder een eigen `groups`) om te voorkomen dat een bot groepsberichten ontvangt van groepen waarvan deze geen lid is. WhatsApp past die beveiliging niet toe — hoofdwaarden `groups`/`direct` worden overgenomen door elk account zonder een eigen overschrijving, ongeacht het aantal accounts. Definieer in een WhatsApp-configuratie met meerdere accounts de volledige toewijzing expliciet onder elk account als je prompts per account wilt.

Belangrijk gedrag:

- `channels.whatsapp.groups` is zowel een configuratietoewijzing per groep als de toelatingslijst voor groepen op chatniveau. Op hoofd- of accountniveau betekent `groups["*"]` dat "alle groepen worden toegelaten" voor dat bereik.
- Voeg alleen een jokerteken `systemPrompt` toe wanneer je al wilt dat dit bereik alle groepen toelaat. Om alleen een vaste verzameling groeps-id's in aanmerking te laten komen, herhaal je de prompt bij elke expliciet toegelaten vermelding in plaats van `groups["*"]` te gebruiken.
- Groepstoelating en afzenderautorisatie zijn afzonderlijke controles. `groups["*"]` verruimt welke groepen de groepsverwerking bereiken; het autoriseert niet elke afzender in die groepen — dat blijft geregeld door `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` heeft geen vergelijkbaar neveneffect voor directe berichten: `direct["*"]` levert alleen een standaardconfiguratie nadat een direct bericht al is toegelaten door `dmPolicy` plus `allowFrom` of regels uit de koppelingsopslag.

Voorbeeld:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Alleen gebruiken als alle groepen op hoofdniveau moeten worden toegelaten.
        // Geldt voor alle accounts die geen eigen groepentoewijzing definiëren.
        "*": { systemPrompt: "Standaardprompt voor alle groepen." },
      },
      direct: {
        // Geldt voor alle accounts die geen eigen toewijzing voor directe chats definiëren.
        "*": { systemPrompt: "Standaardprompt voor alle directe chats." },
      },
      accounts: {
        work: {
          groups: {
            // Dit account definieert eigen groepen, dus de hoofdgroepen worden volledig
            // vervangen. Definieer "*" hier ook expliciet om een jokerteken te behouden.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Richt je op projectmanagement.",
            },
            // Alleen gebruiken als alle groepen in dit account moeten worden toegelaten.
            "*": { systemPrompt: "Standaardprompt voor werkgroepen." },
          },
          direct: {
            // Dit account definieert een eigen toewijzing voor directe chats, dus directe
            // hoofdvermeldingen worden volledig vervangen. Definieer "*" hier ook expliciet om een jokerteken te behouden.
            "+15551234567": { systemPrompt: "Prompt voor een specifieke directe werkchat." },
            "*": { systemPrompt: "Standaardprompt voor directe werkchats." },
          },
        },
      },
    },
  },
}
```

## Verwijzingen naar de configuratiereferentie

Primaire referentie: [Configuratiereferentie - WhatsApp](/nl/gateway/config-channels#whatsapp)

| Gebied           | Velden                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Toegang          | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Bezorging        | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Meerdere accounts | `accounts.<id>.enabled`, `accounts.<id>.authDir` en andere overschrijvingen per account                              |
| Bewerkingen      | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Sessiegedrag     | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompts          | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Gerelateerd

- [Koppelen](/nl/channels/pairing)
- [Groepen](/nl/channels/groups)
- [Beveiliging](/nl/gateway/security)
- [Kanaalroutering](/nl/channels/channel-routing)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Probleemoplossing](/nl/channels/troubleshooting)
