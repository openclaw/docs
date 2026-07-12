---
read_when:
    - Mattermost instellen
    - Mattermost-routering debuggen
sidebarTitle: Mattermost
summary: Mattermost-botinstellingen en OpenClaw-configuratie
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T08:38:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Status: downloadbare plugin (bottoken + WebSocket-gebeurtenissen). Kanalen, privékanalen, groeps-DM's en DM's worden ondersteund. Mattermost is een zelf te hosten platform voor teamberichten ([mattermost.com](https://mattermost.com)).

## Installeren

<Tabs>
  <Tab title="npm-register">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Lokale checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie

<Steps>
  <Step title="Controleren of de plugin beschikbaar is">
    Installeer `@openclaw/mattermost` met de bovenstaande opdracht en start daarna de Gateway opnieuw als deze al actief is.
  </Step>
  <Step title="Een Mattermost-bot maken">
    Maak een Mattermost-botaccount, kopieer het **bottoken** en voeg de bot toe aan de teams en kanalen die deze moet lezen.
  </Step>
  <Step title="De basis-URL kopiëren">
    Kopieer de **basis-URL** van Mattermost (bijvoorbeeld `https://chat.example.com`). Een afsluitend `/api/v4` wordt automatisch verwijderd.
  </Step>
  <Step title="OpenClaw configureren en de Gateway starten">
    Minimale configuratie:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Niet-interactief alternatief:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Zelf gehoste Mattermost op een privé-/LAN-/tailnet-adres: uitgaande Mattermost-API-aanvragen gaan door een SSRF-beveiliging die privé- en interne IP-adressen standaard blokkeert. Schakel dit in met `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (per account: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Systeemeigen slash-opdrachten

Systeemeigen slash-opdrachten zijn optioneel. Wanneer ze zijn ingeschakeld, registreert OpenClaw `oc_*`-slash-opdrachten voor elk team waarvan de bot lid is en ontvangt het callback-POST-aanvragen op de HTTP-server van de Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Gebruik dit wanneer Mattermost de Gateway niet rechtstreeks kan bereiken (reverse proxy/openbare URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Geregistreerde opdrachten: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Met `nativeSkills: true` worden Skills-opdrachten ook geregistreerd als `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Opmerkingen over gedrag">
    - `native` en `nativeSkills` zijn standaard ingesteld op `"auto"`, wat voor Mattermost als uitgeschakeld wordt geïnterpreteerd. Stel ze expliciet in op `true`.
    - `callbackPath` is standaard ingesteld op `/api/channels/mattermost/command`.
    - Als `callbackUrl` wordt weggelaten, leidt OpenClaw `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` af. Jokerteken-bindhosts (`0.0.0.0`, `::`) vallen terug op `localhost`.
    - Voor configuraties met meerdere accounts kan `commands` op het hoogste niveau of onder `channels.mattermost.accounts.<id>.commands` worden ingesteld (accountwaarden overschrijven velden op het hoogste niveau).
    - Bestaande slash-opdrachten met dezelfde trigger die door andere integraties zijn gemaakt, blijven ongewijzigd (ze worden bij registratie overgeslagen); opdrachten die door de bot zijn gemaakt, worden bijgewerkt of opnieuw gemaakt wanneer de callback-URL afwijkt.
    - Opdrachtcallbacks worden gevalideerd met de tokens per opdracht die Mattermost retourneert wanneer OpenClaw `oc_*`-opdrachten registreert.
    - OpenClaw vernieuwt de huidige registratie van Mattermost-opdrachten voordat elke callback wordt geaccepteerd, zodat verouderde tokens van verwijderde of opnieuw gegenereerde slash-opdrachten niet langer worden geaccepteerd zonder dat de Gateway opnieuw hoeft te worden gestart.
    - Callbackvalidatie wordt veilig geweigerd als de Mattermost-API niet kan bevestigen dat de opdracht nog actueel is; mislukte validaties worden kort in de cache opgeslagen, gelijktijdige opzoekacties worden samengevoegd en nieuwe opzoekacties worden per opdracht in frequentie beperkt om de druk van herhalingsaanvallen te begrenzen.
    - Slash-callbacks worden veilig geweigerd wanneer de registratie is mislukt, het opstarten slechts gedeeltelijk is voltooid of het callbacktoken niet overeenkomt met het geregistreerde token van de gevonden opdracht (een token dat geldig is voor één opdracht kan de bovenliggende validatie voor een andere opdracht niet bereiken).
    - Geaccepteerde callbacks worden bevestigd met een kortstondig antwoord `"Processing..."`; het echte antwoord wordt als een normaal bericht verzonden.

  </Accordion>
  <Accordion title="Bereikbaarheidsvereiste">
    Het callback-eindpunt moet bereikbaar zijn vanaf de Mattermost-server.

    - Stel `callbackUrl` niet in op `localhost`, tenzij Mattermost in dezelfde host-/netwerknaamruimte als OpenClaw draait.
    - Stel `callbackUrl` niet in op de basis-URL van Mattermost, tenzij die URL `/api/channels/mattermost/command` via een reverse proxy naar OpenClaw doorstuurt.
    - Een snelle controle is `curl https://<gateway-host>/api/channels/mattermost/command`; een GET-aanvraag moet `405 Method Not Allowed` van OpenClaw retourneren, niet `404`.

  </Accordion>
  <Accordion title="Mattermost-toegestane lijst voor uitgaand verkeer">
    Als uw callback op privé-, tailnet- of interne adressen is gericht, stelt u Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` zo in dat de callbackhost of het callbackdomein wordt opgenomen.

    Gebruik host-/domeinvermeldingen, geen volledige URL's.

    - Goed: `gateway.tailnet-name.ts.net`
    - Fout: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen (standaardaccount)

Stel deze op de Gateway-host in als u de voorkeur geeft aan omgevingsvariabelen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Omgevingsvariabelen zijn alleen van toepassing op het **standaardaccount** (`default`). Andere accounts moeten configuratiewaarden gebruiken.

`MATTERMOST_URL` kan niet vanuit een `.env`-bestand in de werkruimte worden ingesteld; zie [`.env`-bestanden in de werkruimte](/nl/gateway/security).
</Note>

## Chatmodi

Mattermost reageert automatisch op DM's. Het gedrag in kanalen wordt geregeld door `chatmode`:

<Tabs>
  <Tab title="oncall (standaard)">
    Reageer in kanalen alleen bij een @vermelding.
  </Tab>
  <Tab title="onmessage">
    Reageer op elk kanaalbericht.
  </Tab>
  <Tab title="onchar">
    Reageer wanneer een bericht met een triggerprefix begint.
  </Tab>
</Tabs>

Configuratievoorbeeld:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // standaard
    },
  },
}
```

Opmerkingen:

- `onchar` reageert nog steeds op expliciete @vermeldingen.
- `channels.mattermost.requireMention` wordt nog steeds gerespecteerd, maar `chatmode` heeft de voorkeur. Instellingen per kanaal in `groups.<channelId>.requireMention` hebben voorrang op beide.
- Nadat de bot een zichtbaar antwoord in een kanaalthread heeft verzonden, worden latere berichten in diezelfde thread beantwoord zonder een nieuwe @vermelding of `onchar`-prefix, zodat threadgesprekken met meerdere beurten kunnen doorgaan. Deelname wordt 7 dagen onthouden nadat de bot voor het laatst in die thread heeft geantwoord en blijft behouden wanneer de Gateway opnieuw wordt gestart. Threads die de bot alleen heeft waargenomen, worden niet beïnvloed; begin een nieuw bericht op het hoogste niveau om opnieuw een expliciete vermelding te vereisen.

## Threads en sessies

Gebruik `channels.mattermost.replyToMode` om te bepalen of antwoorden in kanalen en groepen in het hoofdkanaal blijven of een thread starten onder het bericht dat de reactie heeft geactiveerd.

- `off` (standaard): antwoord alleen in een thread wanneer het inkomende bericht zich al in een thread bevindt.
- `first`: start voor kanaal-/groepsberichten op het hoogste niveau een thread onder dat bericht en leid het gesprek naar een threadgebonden sessie.
- `all` en `batched`: hebben momenteel hetzelfde gedrag als `first` voor Mattermost, omdat vervolgfragmenten en media in dezelfde thread blijven zodra Mattermost een threadbegin heeft.
- Directe berichten gebruiken standaard `off`, zelfs wanneer `replyToMode` is ingesteld.

Gebruik `channels.mattermost.replyToModeByChatType` om de modus te overschrijven voor chats van het type `direct`, `group` of `channel`. Stel `direct` in om threads voor directe berichten in te schakelen:

- `off` (standaard): directe berichten blijven zonder threads in één doorlopende sessie.
- `first`, `all` of `batched`: elk direct bericht op het hoogste niveau start een Mattermost-thread die door een nieuwe, onafhankelijke sessie wordt ondersteund.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Opmerkingen:

- Threadgebonden sessies gebruiken de id van het activerende bericht als threadbegin.
- `first` en `all` zijn momenteel gelijkwaardig, omdat vervolgfragmenten en media in dezelfde thread blijven zodra Mattermost een threadbegin heeft.
- Overschrijvingen per chattype hebben voorrang op `replyToMode`. Zonder een overschrijving voor `direct` behouden bestaande implementaties vlakke DM's zonder threads.

## Toegangsbeheer (DM's)

- Standaard: `channels.mattermost.dmPolicy = "pairing"` (onbekende afzenders krijgen een koppelcode). Andere waarden: `allowlist`, `open`, `disabled`.
- Goedkeuren via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Openbare DM's: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]` (het configuratieschema dwingt het jokerteken af).
- `channels.mattermost.allowFrom` accepteert gebruikers-id's (aanbevolen) en vermeldingen van het type `accessGroup:<name>`. Zie [Toegangsgroepen](/nl/channels/access-groups).

## Kanalen (groepen)

- Standaard: `channels.mattermost.groupPolicy = "allowlist"` (vermelding vereist).
- Sta afzenders toe met `channels.mattermost.groupAllowFrom` (gebruikers-id's aanbevolen).
- `channels.mattermost.groupAllowFrom` accepteert vermeldingen van het type `accessGroup:<name>`. Zie [Toegangsgroepen](/nl/channels/access-groups).
- Overschrijvingen per kanaal voor vermeldingen staan onder `channels.mattermost.groups.<channelId>.requireMention` of, voor een standaardwaarde, `channels.mattermost.groups["*"].requireMention`.
- Overeenkomsten met `@username` kunnen veranderen en worden alleen ingeschakeld wanneer `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Open kanalen: `channels.mattermost.groupPolicy="open"` (vermelding vereist).
- Volgorde van bepaling: `channels.mattermost.groupPolicy`, vervolgens `channels.defaults.groupPolicy` en daarna `"allowlist"`.
- Opmerking over de runtime: als de sectie `channels.mattermost` volledig ontbreekt, weigert de runtime groepscontroles veilig met `groupPolicy="allowlist"` (zelfs als `channels.defaults.groupPolicy` is ingesteld) en registreert deze een eenmalige waarschuwing.

Voorbeeld:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Doelen voor uitgaande bezorging

Gebruik deze doelindelingen met `openclaw message send` of Cron/Webhooks:

| Doel                                | Wordt bezorgd bij                                              |
| ----------------------------------- | -------------------------------------------------------------- |
| `channel:<id>`                      | Kanaal op id                                                   |
| `channel:<name>` of `#channel-name` | Kanaal op naam, gezocht in alle teams waarvan de bot lid is    |
| `user:<id>` of `mattermost:<id>`    | DM met die gebruiker                                           |
| `@username`                         | DM (gebruikersnaam wordt via de Mattermost-API gevonden)       |

Uitgaande verzendingen ondersteunen maximaal één bijlage per bericht; splits meerdere bestanden op in afzonderlijke verzendingen.

<Warning>
Losse, nietszeggende id's (zoals `64ifufp...`) zijn **dubbelzinnig** in Mattermost (gebruikers-id tegenover kanaal-id).

OpenClaw probeert ze **eerst als gebruiker** te vinden:

- Als de id als gebruiker bestaat (`GET /api/v4/users/<id>` slaagt), verzendt OpenClaw een **DM** door het directe kanaal via `/api/v4/channels/direct` te vinden.
- Anders wordt de id als een **kanaal-id** behandeld.

Gebruik altijd de expliciete prefixen (`user:<id>` / `channel:<id>`) als u deterministisch gedrag nodig hebt.
</Warning>

## Opnieuw proberen voor DM-kanalen

Wanneer OpenClaw naar een Mattermost-DM-doel verzendt en eerst het directe kanaal moet vinden, probeert het tijdelijke fouten bij het maken van directe kanalen standaard opnieuw.

Gebruik `channels.mattermost.dmChannelRetry` om dat gedrag wereldwijd voor de Mattermost-plugin af te stemmen, of `channels.mattermost.accounts.<id>.dmChannelRetry` voor één account. Standaardwaarden:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Opmerkingen:

- Dit is alleen van toepassing op het aanmaken van DM-kanalen (`/api/v4/channels/direct`), niet op elke Mattermost-API-aanroep.
- Nieuwe pogingen gebruiken exponentiële back-off met jitter en worden toegepast op tijdelijke fouten, zoals snelheidslimieten, 5xx-responsen en netwerk- of time-outfouten.
- 4xx-clientfouten anders dan `429` worden als permanent beschouwd en niet opnieuw geprobeerd.

## Previewstreaming

Mattermost streamt denkactiviteit, toolactiviteit en gedeeltelijke antwoordtekst naar een **concept-previewbericht**, dat ter plaatse wordt voltooid zodra het uiteindelijke antwoord veilig kan worden verzonden. In de modus `partial` wordt de preview bijgewerkt op hetzelfde bericht-ID, in plaats van het kanaal te overspoelen met een bericht per fragment. In de modus `block` wisselt de preview tussen voltooide tekstblokken en blokken met toolactiviteit, zodat eerdere blokken als afzonderlijke berichten zichtbaar blijven in plaats van door het volgende blok te worden overschreven. Definitieve media- en foutberichten annuleren wachtende previewbewerkingen en gebruiken de normale bezorging in plaats van een wegwerp-previewbericht te voltooien.

Previewstreaming is **standaard ingeschakeld** in de modus `partial`. Configureer dit via `channels.mattermost.streaming` (een modustekenreeks, booleaanse waarde of een object zoals `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streamingmodi">
    - `partial` (standaard): één previewbericht dat wordt bewerkt naarmate het antwoord groeit en vervolgens wordt voltooid met het volledige antwoord.
    - `block` wisselt de preview tussen voltooide tekstblokken en blokken met toolactiviteit, zodat elk blok als afzonderlijk bericht zichtbaar blijft in plaats van ter plaatse te worden overschreven. Parallelle en opeenvolgende toolupdates delen het huidige toolactiviteitsbericht.
    - `progress` toont tijdens het genereren een statuspreview en plaatst het definitieve antwoord pas na voltooiing.
    - `off` schakelt previewstreaming uit. Met `blockStreaming: true` worden voltooide assistentblokken nog steeds als normale blokantwoorden (afzonderlijke berichten) bezorgd, in plaats van als één samengevoegd definitief bericht.

  </Accordion>
  <Accordion title="Opmerkingen over streaminggedrag">
    - Als de stream niet ter plaatse kan worden voltooid (bijvoorbeeld omdat het bericht tijdens het streamen is verwijderd), valt OpenClaw terug op het verzenden van een nieuw definitief bericht, zodat het antwoord nooit verloren gaat.
    - Payloads die uitsluitend denkactiviteit bevatten, worden niet in kanaalberichten geplaatst, inclusief tekst die als een `> Thinking`-blokcitaat binnenkomt. Stel `/reasoning on` in om denkactiviteit op andere oppervlakken te zien; het definitieve Mattermost-bericht bevat alleen het antwoord.
    - Zie [Streaming](/nl/concepts/streaming#preview-streaming-modes) voor de kanaaltoewijzingsmatrix.

  </Accordion>
</AccordionGroup>

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=mattermost`.
- `messageId` is het Mattermost-bericht-ID.
- `emoji` accepteert namen zoals `thumbsup` of `:+1:` (dubbele punten zijn optioneel).
- Stel `remove=true` (booleaanse waarde) in om een reactie te verwijderen.
- Gebeurtenissen voor het toevoegen/verwijderen van reacties worden als systeemgebeurtenissen doorgestuurd naar de gerouteerde agentsessie, onder dezelfde DM-/groepsbeleidscontroles als berichten.

Voorbeelden:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuratie:

- `channels.mattermost.actions.reactions`: reactieacties in-/uitschakelen (standaard true).
- Overschrijving per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interactieve knoppen (berichttool)

Verzend berichten met aanklikbare knoppen. Wanneer een gebruiker op een knop klikt, ontvangt de agent de selectie en kan deze reageren.

Knoppen zijn afkomstig uit de semantische `presentation`-payload (in normale agentantwoorden en in `message action=send`). OpenClaw geeft waardeknoppen weer als interactieve Mattermost-knoppen, houdt URL-knoppen zichtbaar in de berichttekst en zet keuzemenu's om in leesbare tekst.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Velden voor presentatieknoppen:

<ParamField path="label" type="string" required>
  Weergavelabel (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Waarde die bij een klik wordt teruggestuurd en als actie-ID wordt gebruikt (aliassen: `callback_data`, `callbackData`). Vereist voor een aanklikbare knop, tenzij `url` is ingesteld.
</ParamField>
<ParamField path="url" type="string">
  Koppelingsknop; wordt in de berichttekst weergegeven als `label: url` in plaats van als interactieve knop.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Knopstijl. Mattermost past de standaardstijl toe op waarden die het niet ondersteunt.
</ParamField>

Voeg `inlineButtons` toe aan de kanaalmogelijkheden om knopondersteuning in de systeemprompt van de agent bekend te maken:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Wanneer een gebruiker op een knop klikt:

<Steps>
  <Step title="Toegangscontrole">
    De gebruiker die klikt, moet dezelfde DM-/groepsbeleidscontroles doorstaan als een afzender van een bericht; ongeautoriseerde klikken krijgen een tijdelijke melding en worden genegeerd.
  </Step>
  <Step title="Knoppen vervangen door bevestiging">
    Alle knoppen worden vervangen door een bevestigingsregel (bijvoorbeeld „✓ **Yes** geselecteerd door @user”).
  </Step>
  <Step title="Agent ontvangt de selectie">
    De agent ontvangt de selectie als een inkomend bericht (plus een systeemgebeurtenis) en reageert.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementatieopmerkingen">
    - Knopcallbacks gebruiken HMAC-SHA256-verificatie (automatisch, geen configuratie nodig).
    - Bij een klik wordt het volledige bijlageblok vervangen, zodat alle knoppen tegelijk worden verwijderd; gedeeltelijke verwijdering is niet mogelijk.
    - Actie-ID's die koppeltekens of onderstrepingstekens bevatten, worden automatisch opgeschoond (beperking van Mattermost-routering).
    - Klikken waarvan de `action_id` niet overeenkomt met een actie in het oorspronkelijke bericht, worden geweigerd met `403` ("Unknown action").

  </Accordion>
  <Accordion title="Configuratie en bereikbaarheid">
    - `channels.mattermost.capabilities`: matrix van mogelijkheden als tekenreeksen. Voeg `"inlineButtons"` toe om de beschrijving van de knoptool in de systeemprompt van de agent in te schakelen.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionele externe basis-URL voor knopcallbacks (bijvoorbeeld `https://gateway.example.com`). Gebruik dit wanneer Mattermost de Gateway niet rechtstreeks via diens bindingshost kan bereiken.
    - In configuraties met meerdere accounts kunt u hetzelfde veld ook instellen onder `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Als `interactions.callbackBaseUrl` is weggelaten, leidt OpenClaw de callback-URL af van `gateway.customBindHost` + `gateway.port` (standaard 18789) en valt vervolgens terug op `http://localhost:<port>`. Het callbackpad is `/mattermost/interactions/<accountId>`.
    - Bereikbaarheidsregel: de callback-URL van de knop moet bereikbaar zijn vanaf de Mattermost-server. `localhost` werkt alleen wanneer Mattermost en OpenClaw op dezelfde host/netwerknaamruimte draaien.
    - `channels.mattermost.interactions.allowedSourceIps`: toelatingslijst met bron-IP-adressen voor knopcallbacks. Zonder deze lijst worden alleen loopback-bronnen (`127.0.0.1`, `::1`) geaccepteerd. Een externe Mattermost-server moet hier dus aan de toelatingslijst worden toegevoegd, anders worden klikken geweigerd met `403`. Stel achter een reverse proxy ook `gateway.trustedProxies` in, zodat het echte client-IP-adres wordt afgeleid uit doorgestuurde headers.
    - Als uw callbackdoel privé, intern of in een tailnet is, voegt u de host/het domein ervan toe aan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Rechtstreekse API-integratie (externe scripts)

Externe scripts en Webhooks kunnen knoppen rechtstreeks via de Mattermost REST-API plaatsen in plaats van de `message`-tool van de agent te gebruiken. Gebruik waar mogelijk `buildButtonAttachments()` uit de Plugin; volg bij het plaatsen van onbewerkte JSON deze regels:

**Payloadstructuur:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Kritieke regels**

1. Bijlagen horen in `props.attachments`, niet in `attachments` op het hoogste niveau (wordt zonder melding genegeerd).
2. Elke actie heeft `type: "button"` nodig; zonder dit worden klikken zonder melding genegeerd.
3. Elke actie heeft een `id`-veld nodig; Mattermost negeert acties zonder ID's.
4. De `id` van een actie mag **alleen alfanumerieke tekens** bevatten (`[a-zA-Z0-9]`). Koppeltekens en onderstrepingstekens verstoren de serverroutering van acties in Mattermost (retourneert 404). Verwijder deze vóór gebruik.
5. `context.action_id` moet overeenkomen met de `id` van de knop; de Gateway weigert klikken waarvan de `action_id` niet in het bericht bestaat.
6. `context.action_id` is vereist; zonder deze waarde retourneert de interactiehandler 400.
7. Het bron-IP-adres van de callback moet zijn toegestaan (zie `interactions.allowedSourceIps` hierboven).

</Warning>

**HMAC-token genereren**

De Gateway verifieert klikken op knoppen met HMAC-SHA256. Externe scripts moeten tokens genereren die overeenkomen met de verificatielogica van de Gateway:

<Steps>
  <Step title="Het geheim afleiden van het bottoken">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, hexadecimaal gecodeerd.
  </Step>
  <Step title="Het contextobject samenstellen">
    Stel het contextobject samen met alle velden **behalve** `_token`.
  </Step>
  <Step title="Serialiseren met gesorteerde sleutels">
    Serialiseer met **recursief gesorteerde sleutels** en **zonder spaties** (de Gateway canonicaliseert ook geneste objecten en produceert compacte JSON).
  </Step>
  <Step title="De payload ondertekenen">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Het token toevoegen">
    Voeg de resulterende hexadecimale digest als `_token` aan de context toe.
  </Step>
</Steps>

Python-voorbeeld:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Veelvoorkomende HMAC-valkuilen">
    - Python-functie `json.dumps` voegt standaard spaties toe (`{"key": "val"}`). Gebruik `separators=(",", ":")` om overeen te komen met de compacte uitvoer van JavaScript (`{"key":"val"}`).
    - Onderteken altijd **alle** contextvelden (met uitzondering van `_token`). De Gateway verwijdert `_token` en ondertekent vervolgens alles wat overblijft. Het ondertekenen van een deelverzameling veroorzaakt een verificatiefout zonder melding.
    - Gebruik `sort_keys=True`; de Gateway sorteert sleutels vóór ondertekening en Mattermost kan contextvelden opnieuw ordenen bij het opslaan van de payload.
    - Leid het geheim af van het bottoken (deterministisch), niet van willekeurige bytes. Het geheim moet hetzelfde zijn in het proces dat knoppen maakt en in de Gateway die ze verifieert.

  </Accordion>
</AccordionGroup>

## Directory-adapter

De Mattermost-Plugin bevat een Directory-adapter die kanaal- en gebruikersnamen via de Mattermost-API omzet. Hierdoor kunnen doelen als `#channel-name` en `@username` worden gebruikt in `openclaw message send` en bij leveringen via Cron/Webhooks.

Er is geen configuratie nodig; de adapter gebruikt het bottoken uit de accountconfiguratie.

## Meerdere accounts

Mattermost ondersteunt meerdere accounts onder `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primair", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Waarschuwingen", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Accountwaarden overschrijven velden op het hoogste niveau; `channels.mattermost.defaultAccount` bepaalt welk account wordt gebruikt wanneer er geen is opgegeven.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Geen antwoorden in kanalen">
    Zorg ervoor dat de bot zich in het kanaal bevindt en vermeld de bot (oncall), gebruik een triggerprefix (onchar) of stel `chatmode: "onmessage"` in.
  </Accordion>
  <Accordion title="Authenticatie- of multi-accountfouten">
    - Controleer het bottoken, de basis-URL en of het account is ingeschakeld.
    - Problemen met meerdere accounts: omgevingsvariabelen zijn alleen van toepassing op het `default`-account.
    - Privé-/LAN-Mattermost-hosts vereisen `network.dangerouslyAllowPrivateNetwork: true` (de SSRF-beveiliging blokkeert standaard privé-IP-adressen).

  </Accordion>
  <Accordion title="Native slash-opdrachten mislukken">
    - `Unauthorized: invalid command token.`: OpenClaw heeft het callbacktoken niet geaccepteerd. Gebruikelijke oorzaken:
      - de registratie van slash-opdrachten is mislukt of bij het opstarten slechts gedeeltelijk voltooid
      - de callback bereikt de verkeerde Gateway of het verkeerde account
      - Mattermost heeft nog oude opdrachten die naar een eerder callbackdoel verwijzen
      - de Gateway is opnieuw gestart zonder de slash-opdrachten opnieuw te activeren
    - Als native slash-opdrachten niet meer werken, controleer dan de logboeken op `mattermost: failed to register slash commands` of `mattermost: native slash commands enabled but no commands could be registered`.
    - Als `callbackUrl` is weggelaten en de logboeken waarschuwen dat de callback is omgezet naar een local loopback-URL zoals `http://localhost:18789/...`, is die URL waarschijnlijk alleen bereikbaar wanneer Mattermost in dezelfde host-/netwerknaamruimte als OpenClaw draait. Stel in plaats daarvan expliciet een extern bereikbare `commands.callbackUrl` in.

  </Accordion>
  <Accordion title="Problemen met knoppen">
    - Knoppen verschijnen als witte vakken of helemaal niet: de knopgegevens zijn ongeldig. Elke presentatieknop heeft een `label` en een `value` nodig (knoppen waarbij een van beide ontbreekt, worden weggelaten).
    - Knoppen worden weergegeven, maar klikken doet niets: controleer of de Gateway bereikbaar is vanaf de Mattermost-server, of het IP-adres van de Mattermost-server is opgenomen in `channels.mattermost.interactions.allowedSourceIps` (zonder deze instelling wordt alleen local loopback geaccepteerd) en of `ServiceSettings.AllowedUntrustedInternalConnections` de callbackhost bevat voor privédoelen.
    - Knoppen retourneren bij klikken een 404-fout: de knop-`id` bevat waarschijnlijk koppeltekens of underscores. De actierouter van Mattermost werkt niet met niet-alfanumerieke ID's. Gebruik uitsluitend `[a-zA-Z0-9]`.
    - De Gateway logt `rejected callback source`: de klik kwam van een IP-adres buiten `interactions.allowedSourceIps`. Voeg de Mattermost-server of uw ingress toe aan de toelatingslijst en stel `gateway.trustedProxies` in bij gebruik van een reverse proxy.
    - De Gateway logt `invalid _token`: HMAC komt niet overeen. Controleer of u alle contextvelden ondertekent (niet slechts een subset), gesorteerde sleutels gebruikt en compacte JSON gebruikt (zonder spaties). Zie de HMAC-sectie hierboven.
    - De Gateway logt `missing _token in context`: het veld `_token` staat niet in de context van de knop. Zorg ervoor dat het wordt opgenomen bij het samenstellen van de integratiepayload.
    - De Gateway weigert de klik met `Unknown action`: `context.action_id` komt niet overeen met een actie-`id` in het bericht. Stel beide in op dezelfde opgeschoonde waarde.
    - De agent biedt geen knoppen aan: voeg `capabilities: ["inlineButtons"]` toe aan de Mattermost-kanaalconfiguratie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermeldingstoegang
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsproces
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiliging
