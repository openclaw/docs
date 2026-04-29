---
read_when:
    - Mattermost instellen
    - Mattermost-routering debuggen
sidebarTitle: Mattermost
summary: Mattermost-botinstallatie en OpenClaw-configuratie
title: Mattermost
x-i18n:
    generated_at: "2026-04-29T22:26:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Status: meegeleverde Plugin (bottoken + WebSocket-gebeurtenissen). Kanalen, groepen en DM's worden ondersteund. Mattermost is een zelf te hosten platform voor teambberichten; zie de officiële site op [mattermost.com](https://mattermost.com) voor productdetails en downloads.

## Meegeleverde Plugin

<Note>
Mattermost wordt in huidige OpenClaw-releases meegeleverd als Plugin, dus normale verpakte builds hebben geen aparte installatie nodig.
</Note>

Als je een oudere build of een aangepaste installatie gebruikt waarin Mattermost niet is opgenomen, installeer dan een huidig npm-pakket wanneer er een is gepubliceerd:

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

Als npm meldt dat het pakket dat eigendom is van OpenClaw is verouderd, gebruik dan een huidige verpakte
OpenClaw-build of het lokale checkout-pad totdat een nieuwer npm-pakket is
gepubliceerd.

Details: [Plugins](/nl/tools/plugin)

## Snelle installatie

<Steps>
  <Step title="Zorg dat de Plugin beschikbaar is">
    Huidige verpakte OpenClaw-releases leveren deze al mee. Oudere/aangepaste installaties kunnen deze handmatig toevoegen met de bovenstaande opdrachten.
  </Step>
  <Step title="Maak een Mattermost-bot">
    Maak een Mattermost-botaccount aan en kopieer de **bottoken**.
  </Step>
  <Step title="Kopieer de basis-URL">
    Kopieer de Mattermost **basis-URL** (bijv. `https://chat.example.com`).
  </Step>
  <Step title="Configureer OpenClaw en start de Gateway">
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

## Native slash-commando's

Native slash-commando's zijn opt-in. Wanneer ze zijn ingeschakeld, registreert OpenClaw `oc_*` slash-commando's via de Mattermost-API en ontvangt callback-POSTs op de Gateway-HTTP-server.

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
    - Als `callbackUrl` is weggelaten, leidt OpenClaw er een af uit de Gateway-host/poort + `callbackPath`.
    - Voor setups met meerdere accounts kan `commands` op het hoogste niveau worden ingesteld of onder `channels.mattermost.accounts.<id>.commands` (accountwaarden overschrijven velden op het hoogste niveau).
    - Commandocallbacks worden gevalideerd met de tokens per commando die Mattermost retourneert wanneer OpenClaw `oc_*`-commando's registreert.
    - Slash-callbacks falen gesloten wanneer registratie is mislukt, opstarten gedeeltelijk was, of de callbacktoken niet overeenkomt met een van de geregistreerde commando's.

  </Accordion>
  <Accordion title="Bereikbaarheidsvereiste">
    Het callback-eindpunt moet bereikbaar zijn vanaf de Mattermost-server.

    - Stel `callbackUrl` niet in op `localhost`, tenzij Mattermost op dezelfde host/netwerknamespace draait als OpenClaw.
    - Stel `callbackUrl` niet in op je Mattermost-basis-URL, tenzij die URL `/api/channels/mattermost/command` via een reverse proxy naar OpenClaw doorstuurt.
    - Een snelle controle is `curl https://<gateway-host>/api/channels/mattermost/command`; een GET moet `405 Method Not Allowed` van OpenClaw retourneren, niet `404`.

  </Accordion>
  <Accordion title="Mattermost-uitgaande allowlist">
    Als je callback privé-/tailnet-/interne adressen target, stel dan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` zo in dat de callbackhost/het callbackdomein is opgenomen.

    Gebruik host-/domeinvermeldingen, geen volledige URL's.

    - Goed: `gateway.tailnet-name.ts.net`
    - Fout: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Omgevingsvariabelen (standaardaccount)

Stel deze in op de Gateway-host als je de voorkeur geeft aan env-vars:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env-vars gelden alleen voor het **standaard**account (`default`). Andere accounts moeten configuratiewaarden gebruiken.

`MATTERMOST_URL` kan niet worden ingesteld vanuit een workspace-`.env`; zie [Workspace-`.env`-bestanden](/nl/gateway/security).
</Note>

## Chatmodi

Mattermost reageert automatisch op DM's. Kanaalgedrag wordt beheerd door `chatmode`:

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

## Threads en sessies

Gebruik `channels.mattermost.replyToMode` om te bepalen of kanaal- en groepsantwoorden in het hoofdkanaal blijven of een thread starten onder de activerende post.

- `off` (standaard): antwoord alleen in een thread wanneer de inkomende post er al in staat.
- `first`: start voor posts op het hoogste niveau in kanalen/groepen een thread onder die post en routeer het gesprek naar een thread-scoped sessie.
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

- Thread-scoped sessies gebruiken de ID van de activerende post als threadroot.
- `first` en `all` zijn momenteel equivalent, omdat vervolgchunks en media in dezelfde thread doorgaan zodra Mattermost een threadroot heeft.

## Toegangscontrole (DM's)

- Standaard: `channels.mattermost.dmPolicy = "pairing"` (onbekende afzenders krijgen een koppelingscode).
- Goedkeuren via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Openbare DM's: `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Kanalen (groepen)

- Standaard: `channels.mattermost.groupPolicy = "allowlist"` (mention-gated).
- Zet afzenders op de allowlist met `channels.mattermost.groupAllowFrom` (gebruikers-ID's aanbevolen).
- Mentionsoverschrijvingen per kanaal staan onder `channels.mattermost.groups.<channelId>.requireMention` of `channels.mattermost.groups["*"].requireMention` voor een standaardwaarde.
- `@username`-matching is veranderlijk en alleen ingeschakeld wanneer `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Open kanalen: `channels.mattermost.groupPolicy="open"` (mention-gated).
- Runtimenotitie: als `channels.mattermost` volledig ontbreekt, valt runtime terug op `groupPolicy="allowlist"` voor groepscontroles (zelfs als `channels.defaults.groupPolicy` is ingesteld).

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

## Targets voor uitgaande aflevering

Gebruik deze targetformaten met `openclaw message send` of cron/webhooks:

- `channel:<id>` voor een kanaal
- `user:<id>` voor een DM
- `@username` voor een DM (opgelost via de Mattermost-API)

<Warning>
Kale opaque ID's (zoals `64ifufp...`) zijn **ambigu** in Mattermost (gebruikers-ID versus kanaal-ID).

OpenClaw lost ze **eerst als gebruiker** op:

- Als de ID bestaat als gebruiker (`GET /api/v4/users/<id>` slaagt), stuurt OpenClaw een **DM** door het directe kanaal op te lossen via `/api/v4/channels/direct`.
- Anders wordt de ID behandeld als een **kanaal-ID**.

Als je deterministisch gedrag nodig hebt, gebruik dan altijd de expliciete prefixes (`user:<id>` / `channel:<id>`).
</Warning>

## DM-kanaalretry

Wanneer OpenClaw naar een Mattermost-DM-target stuurt en eerst het directe kanaal moet oplossen, probeert het standaard tijdelijke fouten bij het maken van directe kanalen opnieuw.

Gebruik `channels.mattermost.dmChannelRetry` om dat gedrag globaal voor de Mattermost-Plugin af te stemmen, of `channels.mattermost.accounts.<id>.dmChannelRetry` voor één account.

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
- Retries gelden voor tijdelijke fouten zoals rate limits, 5xx-responses en netwerk- of timeoutfouten.
- 4xx-clientfouten anders dan `429` worden als permanent behandeld en worden niet opnieuw geprobeerd.

## Previewstreaming

Mattermost streamt denkwerk, toolactiviteit en gedeeltelijke antwoordtekst naar één **conceptpreviewpost** die ter plekke wordt afgerond wanneer het definitieve antwoord veilig kan worden verzonden. De preview wordt bijgewerkt op dezelfde post-ID in plaats van het kanaal te spammen met berichten per chunk. Media-/foutfinals annuleren openstaande previewbewerkingen en gebruiken normale aflevering in plaats van een wegwerppreviewpost te flushen.

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
    - `partial` is de gebruikelijke keuze: één previewpost die wordt bewerkt terwijl het antwoord groeit, en daarna wordt afgerond met het volledige antwoord.
    - `block` gebruikt conceptchunks in append-stijl binnen de previewpost.
    - `progress` toont een statuspreview tijdens het genereren en plaatst het definitieve antwoord pas na voltooiing.
    - `off` schakelt previewstreaming uit.

  </Accordion>
  <Accordion title="Notities over streaminggedrag">
    - Als de stream niet ter plekke kan worden afgerond (bijvoorbeeld omdat de post halverwege de stream is verwijderd), valt OpenClaw terug op het sturen van een nieuwe definitieve post zodat het antwoord nooit verloren gaat.
    - Payloads met alleen redenering worden onderdrukt in kanaalposts, inclusief tekst die binnenkomt als een `> Reasoning:`-blockquote. Stel `/reasoning on` in om denkwerk in andere oppervlakken te zien; de definitieve Mattermost-post behoudt alleen het antwoord.
    - Zie [Streaming](/nl/concepts/streaming#preview-streaming-modes) voor de kanaalmappingmatrix.

  </Accordion>
</AccordionGroup>

## Reacties (berichttool)

- Gebruik `message action=react` met `channel=mattermost`.
- `messageId` is de Mattermost-post-ID.
- `emoji` accepteert namen zoals `thumbsup` of `:+1:` (dubbele punten zijn optioneel).
- Stel `remove=true` (booleaans) in om een reactie te verwijderen.
- Gebeurtenissen voor toevoegen/verwijderen van reacties worden als systeemgebeurtenissen doorgestuurd naar de gerouteerde agentsessie.

Voorbeelden:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuratie:

- `channels.mattermost.actions.reactions`: schakel reactieacties in/uit (standaard true).
- Overschrijving per account: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interactieve knoppen (berichttool)

Stuur berichten met klikbare knoppen. Wanneer een gebruiker op een knop klikt, ontvangt de agent de selectie en kan reageren.

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
    Alle knoppen worden vervangen door een bevestigingsregel (bijv. "✓ **Ja** geselecteerd door @user").
  </Step>
  <Step title="Agent ontvangt de selectie">
    De agent ontvangt de selectie als een inkomend bericht en reageert.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementatieopmerkingen">
    - Button-callbacks gebruiken HMAC-SHA256-verificatie (automatisch, geen configuratie nodig).
    - Mattermost verwijdert callbackgegevens uit de API-responses (beveiligingsfunctie), dus alle knoppen worden bij een klik verwijderd — gedeeltelijke verwijdering is niet mogelijk.
    - Actie-ID's met koppeltekens of underscores worden automatisch opgeschoond (routeringsbeperking van Mattermost).

  </Accordion>
  <Accordion title="Configuratie en bereikbaarheid">
    - `channels.mattermost.capabilities`: array met capability-strings. Voeg `"inlineButtons"` toe om de beschrijving van de knoppentool in de systeemprompt van de agent in te schakelen.
    - `channels.mattermost.interactions.callbackBaseUrl`: optionele externe basis-URL voor button-callbacks (bijvoorbeeld `https://gateway.example.com`). Gebruik dit wanneer Mattermost de Gateway niet rechtstreeks kan bereiken via de bind-host.
    - In multi-account-configuraties kun je hetzelfde veld ook instellen onder `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Als `interactions.callbackBaseUrl` wordt weggelaten, leidt OpenClaw de callback-URL af uit `gateway.customBindHost` + `gateway.port` en valt daarna terug op `http://localhost:<port>`.
    - Bereikbaarheidsregel: de button-callback-URL moet bereikbaar zijn vanaf de Mattermost-server. `localhost` werkt alleen wanneer Mattermost en OpenClaw op dezelfde host/netwerknamespace draaien.
    - Als je callbackdoel privé/tailnet/intern is, voeg de host/het domein ervan toe aan Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Directe API-integratie (externe scripts)

Externe scripts en Webhooks kunnen knoppen rechtstreeks plaatsen via de Mattermost REST API in plaats van via de `message`-tool van de agent. Gebruik waar mogelijk `buildButtonAttachments()` uit de Plugin; volg deze regels als je raw JSON plaatst:

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
            id: "mybutton01", // alphanumeric only — see below
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

1. Attachments horen in `props.attachments`, niet in top-level `attachments` (wordt stilzwijgend genegeerd).
2. Elke actie heeft `type: "button"` nodig — zonder dit worden klikken stilzwijgend ingeslikt.
3. Elke actie heeft een `id`-veld nodig — Mattermost negeert acties zonder ID's.
4. Actie-`id` mag **alleen alfanumeriek** zijn (`[a-zA-Z0-9]`). Koppeltekens en underscores breken de server-side actieroutering van Mattermost (retourneert 404). Verwijder ze voor gebruik.
5. `context.action_id` moet overeenkomen met de `id` van de knop, zodat het bevestigingsbericht de knopnaam toont (bijv. "Goedkeuren") in plaats van een raw ID.
6. `context.action_id` is verplicht — de interaction handler retourneert 400 zonder dit veld.

</Warning>

**HMAC-token genereren**

De Gateway verifieert klikken op knoppen met HMAC-SHA256. Externe scripts moeten tokens genereren die overeenkomen met de verificatielogica van de Gateway:

<Steps>
  <Step title="Leid het geheim af uit het bottoken">
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
    Voeg de resulterende hex digest toe als `_token` in de context.
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
    - Python's `json.dumps` voegt standaard spaties toe (`{"key": "val"}`). Gebruik `separators=(",", ":")` om overeen te komen met de compacte output van JavaScript (`{"key":"val"}`).
    - Onderteken altijd **alle** contextvelden (min `_token`). De Gateway verwijdert `_token` en ondertekent daarna alles wat overblijft. Het ondertekenen van een subset veroorzaakt een stille verificatiefout.
    - Gebruik `sort_keys=True` — de Gateway sorteert sleutels voor het ondertekenen, en Mattermost kan contextvelden opnieuw ordenen bij het opslaan van de payload.
    - Leid het geheim af uit het bottoken (deterministisch), niet uit willekeurige bytes. Het geheim moet hetzelfde zijn in het proces dat knoppen maakt en de Gateway die verifieert.

  </Accordion>
</AccordionGroup>

## Directory-adapter

De Mattermost-Plugin bevat een directory-adapter die kanaal- en gebruikersnamen via de Mattermost API oplost. Dit maakt `#channel-name`- en `@username`-doelen mogelijk in `openclaw message send` en cron-/webhookleveringen.

Er is geen configuratie nodig — de adapter gebruikt het bottoken uit de accountconfiguratie.

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
  <Accordion title="Auth- of multi-account-fouten">
    - Controleer het bottoken, de basis-URL en of het account is ingeschakeld.
    - Multi-account-problemen: env-vars gelden alleen voor het `default`-account.

  </Accordion>
  <Accordion title="Native slash-commands mislukken">
    - `Unauthorized: invalid command token.`: OpenClaw heeft het callbacktoken niet geaccepteerd. Typische oorzaken:
      - registratie van slash-commands is mislukt of slechts gedeeltelijk voltooid bij het opstarten
      - de callback raakt de verkeerde Gateway/het verkeerde account
      - Mattermost heeft nog oude commands die naar een eerder callbackdoel wijzen
      - de Gateway is opnieuw gestart zonder slash-commands opnieuw te activeren
    - Als native slash-commands niet meer werken, controleer de logs op `mattermost: failed to register slash commands` of `mattermost: native slash commands enabled but no commands could be registered`.
    - Als `callbackUrl` is weggelaten en logs waarschuwen dat de callback is opgelost naar `http://127.0.0.1:18789/...`, is die URL waarschijnlijk alleen bereikbaar wanneer Mattermost op dezelfde host/netwerknamespace draait als OpenClaw. Stel in plaats daarvan een expliciete extern bereikbare `commands.callbackUrl` in.

  </Accordion>
  <Accordion title="Problemen met knoppen">
    - Knoppen verschijnen als witte vakken: de agent verzendt mogelijk misvormde knopgegevens. Controleer of elke knop zowel `text`- als `callback_data`-velden heeft.
    - Knoppen worden weergegeven, maar klikken doet niets: controleer of `AllowedUntrustedInternalConnections` in de Mattermost-serverconfiguratie `127.0.0.1 localhost` bevat en of `EnablePostActionIntegration` `true` is in ServiceSettings.
    - Knoppen retourneren 404 bij klikken: de knop-`id` bevat waarschijnlijk koppeltekens of underscores. De actierouter van Mattermost breekt op niet-alfanumerieke ID's. Gebruik alleen `[a-zA-Z0-9]`.
    - Gateway-logt `invalid _token`: HMAC komt niet overeen. Controleer of je alle contextvelden ondertekent (geen subset), gesorteerde sleutels gebruikt en compacte JSON gebruikt (geen spaties). Zie de HMAC-sectie hierboven.
    - Gateway-logt `missing _token in context`: het veld `_token` staat niet in de context van de knop. Zorg dat het wordt opgenomen bij het bouwen van de integratiepayload.
    - Bevestiging toont raw ID in plaats van knopnaam: `context.action_id` komt niet overeen met de `id` van de knop. Stel beide in op dezelfde opgeschoonde waarde.
    - Agent weet niets van knoppen: voeg `capabilities: ["inlineButtons"]` toe aan de Mattermost-kanaalconfiguratie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsgating
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
