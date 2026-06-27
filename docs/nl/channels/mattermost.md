---
read_when:
    - Mattermost instellen
    - Mattermost-routering debuggen
sidebarTitle: Mattermost
summary: Mattermost-bot instellen en OpenClaw-configuratie
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Status: downloadbare plugin (bottoken + WebSocket-gebeurtenissen). Kanalen, groepen en DM's worden ondersteund. Mattermost is een zelf te hosten platform voor teamberichten; zie de officiële site op [mattermost.com](https://mattermost.com) voor productdetails en downloads.

## Installeren

Installeer Mattermost voordat je het kanaal configureert:

<Tabs>
  <Tab title="npm-registry">
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

## Snelle setup

<Steps>
  <Step title="Zorg dat de plugin beschikbaar is">
    Installeer `@openclaw/mattermost` met de bovenstaande opdracht en herstart daarna de Gateway als die al draait.
  </Step>
  <Step title="Maak een Mattermost-bot">
    Maak een Mattermost-botaccount en kopieer het **bottoken**.
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

## Native slash-commands

Native slash-commands zijn opt-in. Wanneer ingeschakeld registreert OpenClaw `oc_*` slash-commands via de Mattermost-API en ontvangt callback-POST's op de HTTP-server van de gateway.

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
    - Als `callbackUrl` is weggelaten, leidt OpenClaw er een af uit gateway-host/poort + `callbackPath`.
    - Voor setups met meerdere accounts kan `commands` op het hoogste niveau worden ingesteld of onder `channels.mattermost.accounts.<id>.commands` (accountwaarden overschrijven velden op het hoogste niveau).
    - Command-callbacks worden gevalideerd met de per-command tokens die Mattermost retourneert wanneer OpenClaw `oc_*`-commands registreert.
    - OpenClaw vernieuwt de huidige Mattermost-commandregistratie voordat elke callback wordt geaccepteerd, zodat verouderde tokens van verwijderde of opnieuw gegenereerde slash-commands niet meer worden geaccepteerd zonder herstart van de gateway.
    - Callbackvalidatie faalt gesloten als de Mattermost-API niet kan bevestigen dat het command nog actueel is; mislukte validaties worden kort gecachet, gelijktijdige lookups worden samengevoegd en het starten van nieuwe lookups wordt per command begrensd in snelheid om replay-druk te beperken.
    - Slash-callbacks falen gesloten wanneer registratie is mislukt, startup gedeeltelijk was, of het callbacktoken niet overeenkomt met het geregistreerde token van het opgeloste command (een token dat geldig is voor één command kan geen upstreamvalidatie bereiken voor een ander command).

  </Accordion>
  <Accordion title="Bereikbaarheidsvereiste">
    Het callback-eindpunt moet bereikbaar zijn vanaf de Mattermost-server.

    - Stel `callbackUrl` niet in op `localhost`, tenzij Mattermost op dezelfde host/netwerknaamruimte draait als OpenClaw.
    - Stel `callbackUrl` niet in op je Mattermost-basis-URL, tenzij die URL `/api/channels/mattermost/command` reverse-proxyt naar OpenClaw.
    - Een snelle controle is `curl https://<gateway-host>/api/channels/mattermost/command`; een GET zou `405 Method Not Allowed` van OpenClaw moeten retourneren, niet `404`.

  </Accordion>
  <Accordion title="Mattermost-egress-allowlist">
    Als je callbackdoelen privé-/tailnet-/interne adressen zijn, stel dan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` in zodat de callback-host/het callback-domein is opgenomen.

    Gebruik host-/domeinitems, geen volledige URL's.

    - Goed: `gateway.tailnet-name.ts.net`
    - Fout: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen (standaardaccount)

Stel deze in op de gateway-host als je de voorkeur geeft aan omgevingsvariabelen:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Omgevingsvariabelen gelden alleen voor het **standaardaccount** (`default`). Andere accounts moeten configuratiewaarden gebruiken.

`MATTERMOST_URL` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).
</Note>

## Chatmodi

Mattermost reageert automatisch op DM's. Kanaalgedrag wordt bepaald door `chatmode`:

<Tabs>
  <Tab title="oncall (standaard)">
    Reageer alleen wanneer er in kanalen een @mention is.
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

- `onchar` reageert nog steeds op expliciete @mentions.
- `channels.mattermost.requireMention` wordt gerespecteerd voor legacy-configuraties, maar `chatmode` heeft de voorkeur.
- Nadat de bot een zichtbaar antwoord in een kanaalthread heeft verzonden, worden latere berichten in diezelfde thread beantwoord zonder nieuwe @mention of `onchar`-prefix, zodat threadgesprekken met meerdere beurten blijven doorlopen. Deelname wordt 7 dagen threadinactiviteit onthouden (ververst bij elk antwoord) en blijft behouden na gateway-herstarts. Threads die de bot alleen heeft geobserveerd, blijven onaangetast; start een nieuw bericht op het hoogste niveau om weer een expliciete vermelding te vereisen.

## Threads en sessies

Gebruik `channels.mattermost.replyToMode` om te bepalen of antwoorden in kanalen en groepen in het hoofdkanaal blijven of een thread starten onder de activerende post.

- `off` (standaard): antwoord alleen in een thread wanneer de inkomende post er al in zit.
- `first`: start voor posts op het hoogste niveau in kanalen/groepen een thread onder die post en routeer het gesprek naar een thread-gescopeerde sessie.
- `all`: hetzelfde gedrag als `first` voor Mattermost vandaag.
- Directe berichten negeren deze instelling en blijven zonder thread.

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

- Thread-gescopeerde sessies gebruiken de ID van de activerende post als thread-root.
- `first` en `all` zijn momenteel equivalent omdat, zodra Mattermost een thread-root heeft, vervolgchunks en media in dezelfde thread doorgaan.

## Toegangsbeheer (DM's)

- Standaard: `channels.mattermost.dmPolicy = "pairing"` (onbekende afzenders krijgen een koppelingscode).
- Goedkeuren via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Openbare DM's: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` accepteert `accessGroup:<name>`-items. Zie [Toegangsgroepen](/nl/channels/access-groups).

## Kanalen (groepen)

- Standaard: `channels.mattermost.groupPolicy = "allowlist"` (mention-gated).
- Zet afzenders op de allowlist met `channels.mattermost.groupAllowFrom` (gebruikers-ID's aanbevolen).
- `channels.mattermost.groupAllowFrom` accepteert `accessGroup:<name>`-items. Zie [Toegangsgroepen](/nl/channels/access-groups).
- Per-kanaal mention-overschrijvingen staan onder `channels.mattermost.groups.<channelId>.requireMention` of `channels.mattermost.groups["*"].requireMention` voor een standaardwaarde.
- `@username`-matching is veranderlijk en alleen ingeschakeld wanneer `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Open kanalen: `channels.mattermost.groupPolicy="open"` (mention-gated).
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

Gebruik deze doelformaten met `openclaw message send` of cron/webhooks:

- `channel:<id>` voor een kanaal
- `user:<id>` voor een DM
- `@username` voor een DM (opgelost via de Mattermost-API)

<Warning>
Kale ondoorzichtige ID's (zoals `64ifufp...`) zijn **ambigu** in Mattermost (gebruikers-ID versus kanaal-ID).

OpenClaw lost ze **eerst als gebruiker** op:

- Als de ID bestaat als gebruiker (`GET /api/v4/users/<id>` slaagt), verzendt OpenClaw een **DM** door het directe kanaal op te lossen via `/api/v4/channels/direct`.
- Anders wordt de ID behandeld als een **kanaal-ID**.

Als je deterministisch gedrag nodig hebt, gebruik dan altijd de expliciete prefixen (`user:<id>` / `channel:<id>`).
</Warning>

## Opnieuw proberen voor DM-kanaal

Wanneer OpenClaw naar een Mattermost-DM-doel verzendt en eerst het directe kanaal moet oplossen, probeert het standaard tijdelijke fouten bij het maken van directe kanalen opnieuw.

Gebruik `channels.mattermost.dmChannelRetry` om dat gedrag globaal voor de Mattermost-plugin af te stemmen, of `channels.mattermost.accounts.<id>.dmChannelRetry` voor één account.

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

- Dit geldt alleen voor het maken van DM-kanalen (`/api/v4/channels/direct`), niet voor elke Mattermost-API-aanroep.
- Nieuwe pogingen gelden voor tijdelijke fouten zoals rate limits, 5xx-responses en netwerk- of timeoutfouten.
- 4xx-clientfouten anders dan `429` worden als permanent behandeld en niet opnieuw geprobeerd.

## Preview-streaming

Mattermost streamt denkstappen, toolactiviteit en gedeeltelijke antwoordtekst naar één **conceptpreviewpost** die ter plekke wordt afgerond wanneer het definitieve antwoord veilig kan worden verzonden. De preview wordt bijgewerkt op dezelfde post-ID in plaats van het kanaal te spammen met berichten per chunk. Definitieve media-/foutberichten annuleren openstaande previewbewerkingen en gebruiken normale levering in plaats van een wegwerp-previewpost te flushen.

Schakel in via `channels.mattermost.streaming`:

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
    - `partial` is de gebruikelijke keuze: één previewpost die wordt bewerkt terwijl het antwoord groeit en daarna wordt afgerond met het volledige antwoord.
    - `block` gebruikt conceptchunks in append-stijl binnen de previewpost.
    - `progress` toont een statuspreview tijdens het genereren en plaatst alleen het definitieve antwoord bij voltooiing.
    - `off` schakelt preview-streaming uit.

  </Accordion>
  <Accordion title="Gedragsnotities voor streaming">
    - Als de stream niet ter plekke kan worden afgerond (bijvoorbeeld omdat de post halverwege de stream is verwijderd), valt OpenClaw terug op het verzenden van een nieuwe definitieve post zodat het antwoord nooit verloren gaat.
    - Payloads met alleen denken worden onderdrukt in kanaalposts, inclusief tekst die binnenkomt als een `> Thinking`-blockquote. Stel `/reasoning on` in om denken in andere oppervlakken te zien; de definitieve Mattermost-post houdt alleen het antwoord.
    - Zie [Streaming](/nl/concepts/streaming#preview-streaming-modes) voor de kanaalmappingmatrix.

  </Accordion>
</AccordionGroup>

## Reacties (message-tool)

- Gebruik `message action=react` met `channel=mattermost`.
- `messageId` is de Mattermost-post-ID.
- `emoji` accepteert namen zoals `thumbsup` of `:+1:` (dubbele punten zijn optioneel).
- Stel `remove=true` (booleaan) in om een reactie te verwijderen.
- Gebeurtenissen voor toevoegen/verwijderen van reacties worden als systeemgebeurtenissen doorgestuurd naar de gerouteerde agentsessie.

Voorbeelden:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuratie:

- `channels.mattermost.actions.reactions`: schakel reactieacties in/uit (standaard true).
- Per-account overschrijving: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interactieve knoppen (message-tool)

Verzend berichten met klikbare knoppen. Wanneer een gebruiker op een knop klikt, ontvangt de agent de selectie en kan reageren.

Normale agentantwoorden kunnen ook semantische `presentation`-payloads bevatten. OpenClaw rendert waardeknoppen als interactieve Mattermost-knoppen, houdt URL-knoppen zichtbaar in de berichttekst en zet selectiemenu's om naar leesbare tekst.

Schakel knoppen in door `inlineButtons` toe te voegen aan de kanaalmogelijkheden:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Gebruik `message action=send` met een `buttons`-parameter. Knoppen zijn een 2D-array (rijen met knoppen):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Knopvelden:

<ParamField path="text" type="string" required>
  Weergavelabel.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Waarde die bij klikken wordt teruggestuurd (gebruikt als de actie-ID).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Knopstijl.
</ParamField>

Wanneer een gebruiker op een knop klikt:

<Steps>
  <Step title="Knoppen vervangen door bevestiging">
    Alle knoppen worden vervangen door een bevestigingsregel (bijvoorbeeld "✓ **Yes** geselecteerd door @user").
  </Step>
  <Step title="Agent ontvangt de selectie">
    De agent ontvangt de selectie als een inkomend bericht en reageert.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementatienotities">
    - Knop-callbacks gebruiken HMAC-SHA256-verificatie (automatisch, geen configuratie nodig).
    - Mattermost verwijdert callbackgegevens uit zijn API-antwoorden (beveiligingsfunctie), dus alle knoppen worden bij klikken verwijderd - gedeeltelijke verwijdering is niet mogelijk.
    - Actie-ID's met koppeltekens of underscores worden automatisch opgeschoond (beperking in Mattermost-routering).

  </Accordion>
  <Accordion title="Configuratie en bereikbaarheid">
    - `channels.mattermost.capabilities`: array van capability-strings. Voeg `"inlineButtons"` toe om de beschrijving van het knoppentool in de systeemprompt van de agent in te schakelen.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionele externe basis-URL voor knop-callbacks (bijvoorbeeld `https://gateway.example.com`). Gebruik dit wanneer Mattermost de Gateway niet rechtstreeks op de bind-host kan bereiken.
    - In setups met meerdere accounts kun je hetzelfde veld ook instellen onder `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Als `interactions.callbackBaseUrl` is weggelaten, leidt OpenClaw de callback-URL af van `gateway.customBindHost` + `gateway.port` en valt daarna terug op `http://localhost:<port>`.
    - Bereikbaarheidsregel: de knop-callback-URL moet bereikbaar zijn vanaf de Mattermost-server. `localhost` werkt alleen wanneer Mattermost en OpenClaw op dezelfde host/netwerk-namespace draaien.
    - Als je callback-doel privé/tailnet/intern is, voeg de host/het domein toe aan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Directe API-integratie (externe scripts)

Externe scripts en Webhooks kunnen knoppen rechtstreeks via de Mattermost REST API plaatsen in plaats van via het `message`-tool van de agent te gaan. Gebruik waar mogelijk `buildButtonAttachments()` uit de Plugin; als je ruwe JSON plaatst, volg dan deze regels:

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

1. Attachments horen in `props.attachments`, niet in `attachments` op topniveau (wordt stilzwijgend genegeerd).
2. Elke actie heeft `type: "button"` nodig - zonder dit worden klikken stilzwijgend genegeerd.
3. Elke actie heeft een `id`-veld nodig - Mattermost negeert acties zonder ID's.
4. Actie-`id` mag **alleen alfanumeriek** zijn (`[a-zA-Z0-9]`). Koppeltekens en underscores breken de server-side actieroutering van Mattermost (retourneert 404). Verwijder ze vóór gebruik.
5. `context.action_id` moet overeenkomen met de `id` van de knop, zodat het bevestigingsbericht de knopnaam toont (bijvoorbeeld "Approve") in plaats van een ruwe ID.
6. `context.action_id` is vereist - de interactiehandler retourneert 400 zonder dit veld.

</Warning>

**HMAC-token genereren**

De Gateway verifieert knopklikken met HMAC-SHA256. Externe scripts moeten tokens genereren die overeenkomen met de verificatielogica van de Gateway:

<Steps>
  <Step title="Leid het geheim af van het bot-token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bouw het contextobject">
    Bouw het contextobject met alle velden **behalve** `_token`.
  </Step>
  <Step title="Serialiseer met gesorteerde sleutels">
    Serialiseer met **gesorteerde sleutels** en **geen spaties** (de Gateway gebruikt `JSON.stringify` met gesorteerde sleutels, wat compacte output oplevert).
  </Step>
  <Step title="Onderteken de payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Voeg het token toe">
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
  <Accordion title="Veelvoorkomende HMAC-valkuilen">
    - Python's `json.dumps` voegt standaard spaties toe (`{"key": "val"}`). Gebruik `separators=(",", ":")` om overeen te komen met JavaScripts compacte output (`{"key":"val"}`).
    - Onderteken altijd **alle** contextvelden (min `_token`). De Gateway verwijdert `_token` en ondertekent daarna alles wat overblijft. Het ondertekenen van een subset veroorzaakt stilzwijgende verificatiefouten.
    - Gebruik `sort_keys=True` - de Gateway sorteert sleutels vóór het ondertekenen, en Mattermost kan contextvelden opnieuw ordenen wanneer de payload wordt opgeslagen.
    - Leid het geheim af van het bot-token (deterministisch), niet van willekeurige bytes. Het geheim moet hetzelfde zijn in het proces dat knoppen maakt en de Gateway die verifieert.

  </Accordion>
</AccordionGroup>

## Directory-adapter

De Mattermost-Plugin bevat een directory-adapter die kanaal- en gebruikersnamen via de Mattermost API oplost. Dit maakt `#channel-name`- en `@username`-doelen mogelijk in `openclaw message send` en Cron-/Webhook-leveringen.

Er is geen configuratie nodig - de adapter gebruikt het bot-token uit de accountconfiguratie.

## Multi-account

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
  <Accordion title="Geen antwoorden in kanalen">
    Zorg dat de bot in het kanaal zit en vermeld hem (oncall), gebruik een triggerprefix (onchar), of stel `chatmode: "onmessage"` in.
  </Accordion>
  <Accordion title="Auth- of multi-accountfouten">
    - Controleer het bot-token, de basis-URL en of het account is ingeschakeld.
    - Multi-accountproblemen: env vars zijn alleen van toepassing op het `default`-account.

  </Accordion>
  <Accordion title="Native slash-commands mislukken">
    - `Unauthorized: invalid command token.`: OpenClaw heeft het callback-token niet geaccepteerd. Typische oorzaken:
      - registratie van slash-commands is mislukt of slechts gedeeltelijk voltooid bij het opstarten
      - de callback raakt de verkeerde Gateway/het verkeerde account
      - Mattermost heeft nog oude commands die naar een vorig callback-doel wijzen
      - de Gateway is opnieuw gestart zonder slash-commands opnieuw te activeren
    - Als native slash-commands niet meer werken, controleer de logs op `mattermost: failed to register slash commands` of `mattermost: native slash commands enabled but no commands could be registered`.
    - Als `callbackUrl` is weggelaten en logs waarschuwen dat de callback is opgelost naar `http://127.0.0.1:18789/...`, is die URL waarschijnlijk alleen bereikbaar wanneer Mattermost op dezelfde host/netwerk-namespace draait als OpenClaw. Stel in plaats daarvan een expliciete extern bereikbare `commands.callbackUrl` in.

  </Accordion>
  <Accordion title="Problemen met knoppen">
    - Knoppen verschijnen als witte vakken: de agent verzendt mogelijk verkeerd gevormde knopgegevens. Controleer dat elke knop zowel `text`- als `callback_data`-velden heeft.
    - Knoppen worden weergegeven maar klikken doen niets: verifieer dat `AllowedUntrustedInternalConnections` in de Mattermost-serverconfiguratie `127.0.0.1 localhost` bevat, en dat `EnablePostActionIntegration` `true` is in ServiceSettings.
    - Knoppen retourneren 404 bij klikken: de knop-`id` bevat waarschijnlijk koppeltekens of underscores. De actierouter van Mattermost breekt op niet-alfanumerieke ID's. Gebruik alleen `[a-zA-Z0-9]`.
    - Gateway-logs tonen `invalid _token`: HMAC komt niet overeen. Controleer dat je alle contextvelden ondertekent (niet een subset), gesorteerde sleutels gebruikt en compacte JSON gebruikt (geen spaties). Zie de HMAC-sectie hierboven.
    - Gateway-logs tonen `missing _token in context`: het `_token`-veld staat niet in de context van de knop. Zorg dat het wordt opgenomen bij het bouwen van de integratiepayload.
    - Bevestiging toont ruwe ID in plaats van knopnaam: `context.action_id` komt niet overeen met de `id` van de knop. Stel beide in op dezelfde opgeschoonde waarde.
    - Agent kent knoppen niet: voeg `capabilities: ["inlineButtons"]` toe aan de Mattermost-kanaalconfiguratie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) - groepschatgedrag en vermeldingsgate
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
