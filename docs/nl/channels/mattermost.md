---
read_when:
    - Mattermost instellen
    - Mattermost-routering debuggen
sidebarTitle: Mattermost
summary: Mattermost-botconfiguratie en OpenClaw-configuratie
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

Status: downloadbare plugin (bottoken + WebSocket-gebeurtenissen). Kanalen, groepen en DM's worden ondersteund. Mattermost is een zelf te hosten platform voor teamberichten; zie de officiële site op [mattermost.com](https://mattermost.com) voor productdetails en downloads.

## Installeren

Installeer Mattermost voordat je het kanaal configureert:

<Tabs>
  <Tab title="npm registry">
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

## Snelle installatie

<Steps>
  <Step title="Zorg dat de plugin beschikbaar is">
    Huidige verpakte OpenClaw-releases bundelen deze al. Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de opdrachten hierboven.
  </Step>
  <Step title="Maak een Mattermost-bot">
    Maak een Mattermost-botaccount en kopieer de **bottoken**.
  </Step>
  <Step title="Kopieer de basis-URL">
    Kopieer de Mattermost-**basis-URL** (bijv. `https://chat.example.com`).
  </Step>
  <Step title="Configureer OpenClaw en start de gateway">
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

  </Step>
</Steps>

## Native slashcommando's

Native slashcommando's zijn opt-in. Wanneer ze zijn ingeschakeld, registreert OpenClaw `oc_*`-slashcommando's via de Mattermost API en ontvangt het callback-POST's op de Gateway-HTTP-server.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Gedragsnotities">
    - `native: "auto"` is standaard uitgeschakeld voor Mattermost. Stel `native: true` in om dit in te schakelen.
    - Als `callbackUrl` is weggelaten, leidt OpenClaw er een af uit Gateway-host/poort + `callbackPath`.
    - Voor configuraties met meerdere accounts kan `commands` op het hoogste niveau worden ingesteld of onder `channels.mattermost.accounts.<id>.commands` (accountwaarden overschrijven velden op het hoogste niveau).
    - Commandocallbacks worden gevalideerd met de tokens per commando die Mattermost retourneert wanneer OpenClaw `oc_*`-commando's registreert.
    - OpenClaw vernieuwt de huidige Mattermost-commandoregistratie voordat elke callback wordt geaccepteerd, zodat verouderde tokens van verwijderde of opnieuw gegenereerde slashcommando's niet meer worden geaccepteerd zonder een herstart van de Gateway.
    - Callbackvalidatie faalt gesloten als de Mattermost API niet kan bevestigen dat het commando nog actueel is; mislukte validaties worden kort gecachet, gelijktijdige lookups worden samengevoegd, en nieuwe lookup-starts worden per commando beperkt in snelheid om replay-druk te begrenzen.
    - Slashcallbacks falen gesloten wanneer registratie is mislukt, het opstarten gedeeltelijk was, of de callbacktoken niet overeenkomt met de geregistreerde token van het opgeloste commando (een token die geldig is voor één commando kan geen upstreamvalidatie bereiken voor een ander commando).

  </Accordion>
  <Accordion title="Bereikbaarheidsvereiste">
    Het callback-eindpunt moet bereikbaar zijn vanaf de Mattermost-server.

    - Stel `callbackUrl` niet in op `localhost`, tenzij Mattermost op dezelfde host/netwerknaamruimte draait als OpenClaw.
    - Stel `callbackUrl` niet in op je Mattermost-basis-URL, tenzij die URL `/api/channels/mattermost/command` via een reverse proxy naar OpenClaw doorstuurt.
    - Een snelle controle is `curl https://<gateway-host>/api/channels/mattermost/command`; een GET moet `405 Method Not Allowed` van OpenClaw retourneren, niet `404`.

  </Accordion>
  <Accordion title="Mattermost-egress-allowlist">
    Als je callback naar private/tailnet/interne adressen verwijst, stel dan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` in om de callbackhost/het callbackdomein op te nemen.

    Gebruik host-/domeinitems, geen volledige URL's.

    - Goed: `gateway.tailnet-name.ts.net`
    - Fout: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen (standaardaccount)

Stel deze in op de Gateway-host als je liever omgevingsvariabelen gebruikt:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Omgevingsvariabelen gelden alleen voor het **standaardaccount** (`default`). Andere accounts moeten configuratiewaarden gebruiken.

`MATTERMOST_URL` kan niet worden ingesteld vanuit een werkruimte-`.env`; zie [Werkruimte-`.env`-bestanden](/nl/gateway/security).
</Note>

## Chatmodi

Mattermost reageert automatisch op DM's. Kanaalgedrag wordt bepaald door `chatmode`:

<Tabs>
  <Tab title="oncall (standaard)">
    Reageer alleen wanneer er in kanalen een @vermelding is.
  </Tab>
  <Tab title="onmessage">
    Reageer op elk kanaalbericht.
  </Tab>
  <Tab title="onchar">
    Reageer wanneer een bericht begint met een triggerprefix.
  </Tab>
</Tabs>

Configuratievoorbeeld:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notities:

- `onchar` reageert nog steeds op expliciete @vermeldingen.
- `channels.mattermost.requireMention` wordt gerespecteerd voor legacyconfiguraties, maar `chatmode` heeft de voorkeur.

## Threads en sessies

Gebruik `channels.mattermost.replyToMode` om te bepalen of kanaal- en groepsantwoorden in het hoofdkanaal blijven of een thread starten onder het activerende bericht.

- `off` (standaard): antwoord alleen in een thread wanneer het inkomende bericht daar al in staat.
- `first`: start voor kanaal-/groepsberichten op het hoogste niveau een thread onder dat bericht en routeer het gesprek naar een threadgebonden sessie.
- `all`: hetzelfde gedrag als `first` voor Mattermost vandaag.
- Direct messages negeren deze instelling en blijven zonder thread.

Configuratievoorbeeld:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notities:

- Threadgebonden sessies gebruiken de id van het activerende bericht als threadroot.
- `first` en `all` zijn momenteel equivalent, omdat zodra Mattermost een threadroot heeft, vervolgdelen en media in dezelfde thread doorgaan.

## Toegangscontrole (DM's)

- Standaard: `channels.mattermost.dmPolicy = "pairing"` (onbekende afzenders krijgen een koppelingscode).
- Goedkeuren via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Openbare DM's: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` accepteert `accessGroup:<name>`-items. Zie [Toegangsgroepen](/nl/channels/access-groups).

## Kanalen (groepen)

- Standaard: `channels.mattermost.groupPolicy = "allowlist"` (vermelding vereist).
- Sta afzenders toe met `channels.mattermost.groupAllowFrom` (gebruikers-ID's aanbevolen).
- `channels.mattermost.groupAllowFrom` accepteert `accessGroup:<name>`-items. Zie [Toegangsgroepen](/nl/channels/access-groups).
- Vermeldingsoverrides per kanaal staan onder `channels.mattermost.groups.<channelId>.requireMention` of `channels.mattermost.groups["*"].requireMention` voor een standaardwaarde.
- `@username`-matching is veranderlijk en alleen ingeschakeld wanneer `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Open kanalen: `channels.mattermost.groupPolicy="open"` (vermelding vereist).
- Runtime-notitie: als `channels.mattermost` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

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

## Doelen voor uitgaande levering

Gebruik deze doelformaten met `openclaw message send` of Cron/Webhooks:

- `channel:<id>` voor een kanaal
- `user:<id>` voor een DM
- `@username` voor een DM (opgelost via de Mattermost API)

<Warning>
Kale ondoorzichtige ID's (zoals `64ifufp...`) zijn **ambigu** in Mattermost (gebruikers-ID versus kanaal-ID).

OpenClaw lost ze **eerst als gebruiker** op:

- Als de ID bestaat als gebruiker (`GET /api/v4/users/<id>` slaagt), stuurt OpenClaw een **DM** door het directe kanaal op te lossen via `/api/v4/channels/direct`.
- Anders wordt de ID behandeld als een **kanaal-ID**.

Als je deterministisch gedrag nodig hebt, gebruik dan altijd de expliciete prefixen (`user:<id>` / `channel:<id>`).
</Warning>

## DM-kanaal opnieuw proberen

Wanneer OpenClaw naar een Mattermost-DM-doel verzendt en eerst het directe kanaal moet oplossen, probeert het tijdelijke fouten bij het maken van het directe kanaal standaard opnieuw.

Gebruik `channels.mattermost.dmChannelRetry` om dat gedrag globaal af te stemmen voor de Mattermost-plugin, of `channels.mattermost.accounts.<id>.dmChannelRetry` voor één account.

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

Notities:

- Dit geldt alleen voor het maken van DM-kanalen (`/api/v4/channels/direct`), niet voor elke Mattermost API-aanroep.
- Nieuwe pogingen gelden voor tijdelijke fouten zoals snelheidslimieten, 5xx-responsen en netwerk- of time-outfouten.
- 4xx-clientfouten anders dan `429` worden als permanent behandeld en niet opnieuw geprobeerd.

## Previewstreaming

Mattermost streamt denken, toolactiviteit en gedeeltelijke antwoordtekst naar één **conceptpreviewbericht** dat ter plekke definitief wordt wanneer het definitieve antwoord veilig kan worden verzonden. De preview wordt bijgewerkt op dezelfde bericht-ID in plaats van het kanaal te overspoelen met berichten per deel. Media-/foutfinales annuleren openstaande previewbewerkingen en gebruiken normale levering in plaats van een wegwerppreviewbericht te flushen.

Inschakelen via `channels.mattermost.streaming`:

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
    - `partial` is de gebruikelijke keuze: één previewbericht dat wordt bewerkt terwijl het antwoord groeit, en daarna definitief wordt gemaakt met het volledige antwoord.
    - `block` gebruikt conceptdelen in append-stijl binnen het previewbericht.
    - `progress` toont een statuspreview tijdens het genereren en plaatst het definitieve antwoord pas bij voltooiing.
    - `off` schakelt previewstreaming uit.

  </Accordion>
  <Accordion title="Gedragsnotities voor streaming">
    - Als de stream niet ter plekke definitief kan worden gemaakt (bijvoorbeeld omdat het bericht halverwege de stream is verwijderd), valt OpenClaw terug op het verzenden van een nieuw definitief bericht, zodat het antwoord nooit verloren gaat.
    - Payloads met alleen redenering worden onderdrukt in kanaalberichten, inclusief tekst die binnenkomt als een `> Reasoning:`-blockquote. Stel `/reasoning on` in om denken op andere oppervlakken te zien; het definitieve Mattermost-bericht behoudt alleen het antwoord.
    - Zie [Streaming](/nl/concepts/streaming#preview-streaming-modes) voor de kanaaltoewijzingsmatrix.

  </Accordion>
</AccordionGroup>

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=mattermost`.
- `messageId` is de Mattermost-bericht-ID.
- `emoji` accepteert namen zoals `thumbsup` of `:+1:` (dubbelepunten zijn optioneel).
- Stel `remove=true` (booleaans) in om een reactie te verwijderen.
- Gebeurtenissen voor toevoegen/verwijderen van reacties worden als systeemgebeurtenissen doorgestuurd naar de gerouteerde agentsessie.

Voorbeelden:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuratie:

- `channels.mattermost.actions.reactions`: schakel reactieacties in/uit (standaard true).
- Override per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interactieve knoppen (berichttool)

Verzend berichten met klikbare knoppen. Wanneer een gebruiker op een knop klikt, ontvangt de agent de selectie en kan deze reageren.

Schakel knoppen in door `inlineButtons` toe te voegen aan de kanaalcapabilities:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Gebruik `message action=send` met een parameter `buttons`. Knoppen zijn een 2D-array (rijen met knoppen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Knopvelden:

<ParamField path="text" type="string" required>
  Weergavelabel.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Waarde die bij klikken wordt teruggestuurd (gebruikt als actie-ID).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Knopstijl.
</ParamField>

Wanneer een gebruiker op een knop klikt:

<Steps>
  <Step title="Buttons replaced with confirmation">
    Alle knoppen worden vervangen door een bevestigingsregel (bijvoorbeeld "✓ **Yes** geselecteerd door @user").
  </Step>
  <Step title="Agent receives the selection">
    De agent ontvangt de selectie als inkomend bericht en reageert.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Knop-callbacks gebruiken HMAC-SHA256-verificatie (automatisch, geen configuratie nodig).
    - Mattermost verwijdert callbackgegevens uit zijn API-antwoorden (beveiligingsfunctie), dus alle knoppen worden bij klikken verwijderd - gedeeltelijke verwijdering is niet mogelijk.
    - Actie-ID's met koppeltekens of underscores worden automatisch gesaneerd (routeringsbeperking van Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: array van capability-strings. Voeg `"inlineButtons"` toe om de beschrijving van de knoppentool in de systeemprompt van de agent in te schakelen.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionele externe basis-URL voor knop-callbacks (bijvoorbeeld `https://gateway.example.com`). Gebruik dit wanneer Mattermost de gateway niet rechtstreeks kan bereiken op de bindhost ervan.
    - In opstellingen met meerdere accounts kun je hetzelfde veld ook instellen onder `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Als `interactions.callbackBaseUrl` wordt weggelaten, leidt OpenClaw de callback-URL af uit `gateway.customBindHost` + `gateway.port`, en valt daarna terug op `http://localhost:<port>`.
    - Bereikbaarheidsregel: de URL voor knop-callbacks moet bereikbaar zijn vanaf de Mattermost-server. `localhost` werkt alleen wanneer Mattermost en OpenClaw op dezelfde host/netwerknamespace draaien.
    - Als je callbackdoel privé/tailnet/intern is, voeg dan de host/het domein toe aan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Rechtstreekse API-integratie (externe scripts)

Externe scripts en webhooks kunnen knoppen rechtstreeks via de Mattermost REST API plaatsen in plaats van via de `message`-tool van de agent. Gebruik waar mogelijk `buildButtonAttachments()` uit de Plugin; volg deze regels als je ruwe JSON plaatst:

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
                action_id: "mybutton01", // must match button id (for name lookup)
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

1. Bijlagen komen in `props.attachments`, niet in `attachments` op het hoogste niveau (stilzwijgend genegeerd).
2. Elke actie heeft `type: "button"` nodig - zonder dit worden klikken stilzwijgend ingeslikt.
3. Elke actie heeft een `id`-veld nodig - Mattermost negeert acties zonder ID's.
4. Actie-`id` mag **alleen alfanumeriek** zijn (`[a-zA-Z0-9]`). Koppeltekens en underscores breken de server-side actieroutering van Mattermost (retourneert 404). Verwijder ze vóór gebruik.
5. `context.action_id` moet overeenkomen met de `id` van de knop, zodat het bevestigingsbericht de knopnaam toont (bijvoorbeeld "Approve") in plaats van een ruwe ID.
6. `context.action_id` is vereist - de interactiehandler retourneert 400 zonder dit veld.

</Warning>

**HMAC-token genereren**

De Gateway verifieert knopklikken met HMAC-SHA256. Externe scripts moeten tokens genereren die overeenkomen met de verificatielogica van de Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Bouw het contextobject met alle velden **behalve** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Serialiseer met **gesorteerde sleutels** en **zonder spaties** (de Gateway gebruikt `JSON.stringify` met gesorteerde sleutels, wat compacte uitvoer oplevert).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Voeg de resulterende hex-digest toe als `_token` in de context.
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
  <Accordion title="Common HMAC pitfalls">
    - Python's `json.dumps` voegt standaard spaties toe (`{"key": "val"}`). Gebruik `separators=(",", ":")` om overeen te komen met de compacte uitvoer van JavaScript (`{"key":"val"}`).
    - Onderteken altijd **alle** contextvelden (minus `_token`). De Gateway verwijdert `_token` en ondertekent daarna alles wat overblijft. Het ondertekenen van een subset veroorzaakt een stilzwijgende verificatiefout.
    - Gebruik `sort_keys=True` - de Gateway sorteert sleutels vóór het ondertekenen, en Mattermost kan contextvelden opnieuw ordenen bij het opslaan van de payload.
    - Leid het geheim af uit het bottoken (deterministisch), niet uit willekeurige bytes. Het geheim moet hetzelfde zijn in het proces dat knoppen maakt en de Gateway die verifieert.

  </Accordion>
</AccordionGroup>

## Directory-adapter

De Mattermost-Plugin bevat een directory-adapter die kanaal- en gebruikersnamen via de Mattermost API oplost. Dit maakt `#channel-name`- en `@username`-doelen mogelijk in `openclaw message send` en cron-/Webhook-leveringen.

Er is geen configuratie nodig - de adapter gebruikt het bottoken uit de accountconfiguratie.

## Meerdere accounts

Mattermost ondersteunt meerdere accounts onder `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Probleemoplossing

<AccordionGroup>
  <Accordion title="No replies in channels">
    Zorg dat de bot in het kanaal zit en vermeld deze (oncall), gebruik een triggerprefix (onchar), of stel `chatmode: "onmessage"` in.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Controleer het bottoken, de basis-URL en of het account is ingeschakeld.
    - Problemen met meerdere accounts: env-vars zijn alleen van toepassing op het `default`-account.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw heeft het callbacktoken niet geaccepteerd. Typische oorzaken:
      - registratie van slash commands is mislukt of slechts gedeeltelijk voltooid bij het opstarten
      - de callback raakt de verkeerde gateway/het verkeerde account
      - Mattermost heeft nog oude commands die naar een eerder callbackdoel wijzen
      - de Gateway is opnieuw gestart zonder slash commands opnieuw te activeren
    - Als native slash commands niet meer werken, controleer dan de logs op `mattermost: failed to register slash commands` of `mattermost: native slash commands enabled but no commands could be registered`.
    - Als `callbackUrl` wordt weggelaten en logs waarschuwen dat de callback is opgelost naar `http://127.0.0.1:18789/...`, is die URL waarschijnlijk alleen bereikbaar wanneer Mattermost op dezelfde host/netwerknamespace draait als OpenClaw. Stel in plaats daarvan een expliciete extern bereikbare `commands.callbackUrl` in.

  </Accordion>
  <Accordion title="Buttons issues">
    - Knoppen verschijnen als witte vakken: de agent stuurt mogelijk misvormde knopgegevens. Controleer of elke knop zowel `text`- als `callback_data`-velden heeft.
    - Knoppen worden weergegeven maar klikken doen niets: controleer of `AllowedUntrustedInternalConnections` in de Mattermost-serverconfiguratie `127.0.0.1 localhost` bevat, en dat `EnablePostActionIntegration` `true` is in ServiceSettings.
    - Knoppen retourneren 404 bij klikken: de knop-`id` bevat waarschijnlijk koppeltekens of underscores. De actierouter van Mattermost breekt op niet-alfanumerieke ID's. Gebruik alleen `[a-zA-Z0-9]`.
    - Gateway-logs `invalid _token`: HMAC komt niet overeen. Controleer of je alle contextvelden ondertekent (niet een subset), gesorteerde sleutels gebruikt en compacte JSON gebruikt (geen spaties). Zie de HMAC-sectie hierboven.
    - Gateway-logs `missing _token in context`: het `_token`-veld staat niet in de context van de knop. Zorg dat het is opgenomen bij het bouwen van de integratiepayload.
    - Bevestiging toont ruwe ID in plaats van knopnaam: `context.action_id` komt niet overeen met de `id` van de knop. Stel beide in op dezelfde gesaneerde waarde.
    - Agent weet niets van knoppen: voeg `capabilities: ["inlineButtons"]` toe aan de Mattermost-kanaalconfiguratie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermeldingsgate
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
