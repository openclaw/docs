---
read_when:
    - Je wilt Anthropic-modellen gebruiken in OpenClaw
    - Je wilt Claude CLI- of Claude Desktop-sessies op gekoppelde computers bekijken
summary: Gebruik Anthropic Claude via API-sleutels of de Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T16:20:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic ontwikkelt de modelfamilie **Claude**. OpenClaw ondersteunt twee authenticatieroutes:

- **API-sleutel** - rechtstreekse toegang tot de Anthropic-API met facturering op basis van gebruik (`anthropic/*`-modellen)
- **Claude CLI** - hergebruik een bestaande Claude Code-aanmelding op dezelfde host

## Gebruiks- en kostentracering

OpenClaw detecteert de beschikbare Anthropic-inloggegevens en selecteert de bijbehorende gebruiksweergave:

- Inloggegevens voor een Claude-abonnement of -configuratie tonen quotaperioden en een optioneel budget voor extra gebruik.
- `ANTHROPIC_ADMIN_KEY` of `ANTHROPIC_ADMIN_API_KEY` toont 30 dagen aan door de provider gerapporteerde organisatiekosten en Messages API-gebruik in **Usage** van de Control UI, inclusief dagelijkse uitgaven, totalen voor tokens/cache, populairste modellen en kostencategorieën.
- Een `sk-ant-admin...`-inloggegeven dat in het Anthropic-providerprofiel is opgeslagen, wordt automatisch als een Admin API-sleutel gedetecteerd.

De kostengeschiedenis van de Admin API is afkomstig uit Anthropics [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api). Dit zijn de werkelijke providerkosten, los van de door OpenClaw op basis van sessies geschatte kosten.

<Warning>
De Claude CLI-backend van OpenClaw voert de geïnstalleerde Claude Code CLI uit in
niet-interactieve afdrukmodus (`claude -p`). De huidige Claude Code-documentatie van Anthropic
beschrijft die modus als Agent SDK-/programmatisch gebruik. De ondersteuningsupdate van Anthropic van 15 juni 2026
heeft de aangekondigde afzonderlijke wijziging in de facturering van de Agent SDK
opgeschort: gebruik van de Claude Agent SDK, `claude -p` en apps van derden valt nog steeds onder de
gebruikslimieten van een aangemeld abonnement, en het eerder aangekondigde maandelijkse Agent SDK-
tegoed is niet beschikbaar zolang Anthropic dat plan herziet.

Interactief Claude Code-gebruik valt nog steeds onder de limieten van het aangemelde Claude-abonnement.
Authenticatie met een API-sleutel wordt rechtstreeks naar gebruik gefactureerd en is niet afhankelijk van dat abonnement.
Gebruik voor lang draaiende Gateway-hosts, gedeelde automatisering en voorspelbare productie-
uitgaven een Anthropic API-sleutel.

De huidige ondersteuningsartikelen van Anthropic kunnen dit gedrag wijzigen zonder een
OpenClaw-release:

- [Claude Code CLI-referentie](https://code.claude.com/docs/en/cli-usage)
- [De Claude Agent SDK gebruiken met je Claude-abonnement](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code gebruiken met je Pro- of Max-abonnement](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code gebruiken met je Team- of Enterprise-abonnement](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code-kosten beheren](https://code.claude.com/docs/en/costs)

</Warning>

## Aan de slag

<Tabs>
  <Tab title="API-sleutel">
    **Het meest geschikt voor:** standaard API-toegang en facturering op basis van gebruik.

    <Steps>
      <Step title="Verkrijg je API-sleutel">
        Maak een API-sleutel aan in de [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Voer de onboarding uit">
        ```bash
        openclaw onboard
        # kies: Anthropic API key
        ```

        Of geef de sleutel rechtstreeks door:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Het meest geschikt voor:** hergebruik van een bestaande Claude CLI-aanmelding zonder afzonderlijke API-sleutel.

    <Steps>
      <Step title="Zorg dat Claude CLI is geïnstalleerd en aangemeld">
        Controleer dit met:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Voer de onboarding uit">
        ```bash
        openclaw onboard
        # kies: Claude CLI
        ```

        OpenClaw detecteert en hergebruikt de bestaande Claude CLI-inloggegevens.
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Informatie over de configuratie en runtime van de Claude CLI-backend staat in [CLI-backends](/nl/gateway/cli-backends).
    </Note>

    <Warning>
    Voor hergebruik van Claude CLI moet het OpenClaw-proces op dezelfde host draaien als de
    Claude CLI-aanmelding. Bij Docker-installaties kan een container-home worden behouden en kan daar bij
    Claude Code worden aangemeld; zie
    [Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).
    Andere containerinstallaties, zoals [Podman](/nl/install/podman), koppelen de `~/.claude` van de host
    niet aan de configuratie of runtime; gebruik daar een Anthropic API-sleutel of kies
    een provider met door OpenClaw beheerde OAuth, zoals
    [OpenAI Codex](/nl/providers/openai).
    </Warning>

    ### Een configuratietoken verkrijgen

    Voer `claude setup-token` uit op een computer waarop Claude Code is geïnstalleerd. Dit geeft
    een token met lange geldigheidsduur weer dat begint met `sk-ant-oat01-`.

    Plak het token tijdens de onboarding in de macOS-app door
    **Anthropic setup-token** te kiezen onder **Connect with an API key or token**, of gebruik:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Configuratievoorbeeld

    Geef de voorkeur aan de canonieke Anthropic-modelreferentie met een CLI-runtime-overschrijving:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Verouderde `claude-cli/claude-opus-4-7`-modelreferenties blijven werken voor
    compatibiliteit, maar nieuwe configuraties moeten de provider-/modelselectie als
    `anthropic/*` behouden en de uitvoeringsbackend in het runtimebeleid van de provider/het model plaatsen.

    ### Facturering en `claude -p`

    OpenClaw gebruikt het niet-interactieve `claude -p`-pad van Claude Code voor Claude CLI-
    uitvoeringen. Anthropic behandelt dat pad momenteel als Agent SDK-/programmatisch gebruik:

    - De ondersteuningsupdate van Anthropic van 15 juni 2026 heeft het eerder aangekondigde
      afzonderlijke Agent SDK-tegoedplan opgeschort.
    - Gebruik van de Claude Agent SDK binnen een abonnement, `claude -p` en apps van derden
      valt nog steeds onder de gebruikslimieten van het aangemelde abonnement.
    - Het eerder aangekondigde maandelijkse Agent SDK-tegoed is niet beschikbaar zolang
      Anthropic dat plan herziet.
    - Aanmeldingen met Console/API-sleutels gebruiken API-facturering op basis van gebruik en ontvangen
      niet het Agent SDK-tegoed van het abonnement.

    Zie het [artikel over het Agent SDK-abonnement
    van Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    voor de melding over de opschorting en de Claude Code-abonnementsartikelen voor het gedrag van
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)-
    en
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)-
    abonnementen.

    Anthropic kan de facturering en frequentielimieten van Claude Code wijzigen zonder een
    OpenClaw-release. Controleer `claude auth status`, `/status` en
    de gekoppelde documentatie van Anthropic wanneer voorspelbare facturering belangrijk is.

    <Tip>
    Gebruik voor gedeelde productieautomatisering een Anthropic API-sleutel in plaats van
    Claude CLI. OpenClaw ondersteunt ook abonnementsachtige opties van
    [OpenAI Codex](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax) en [Z.AI / GLM](/nl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Claude-sessies op meerdere computers

De gebundelde Anthropic-plugin voegt een groep **Claude Code** toe aan de normale sessie-
zijbalk. Rijen worden geopend in het normale Chat-paneel. De Plugin detecteert niet-gearchiveerde Claude
Code-sessies op de Gateway en op verbonden Node-hosts:

- Claude CLI-sessies zijn afkomstig uit geldige projectindexrecords en actuele JSONL-
  bestanden waarvan het begrensde metadatavoorvoegsel een `sdk-cli`-
  sessie identificeert die geen sidechain is, onder `~/.claude/projects/`.
- Claude Desktop-sessies gebruiken de Desktop-titel, het activiteitstijdstip en de
  archiefstatus wanneer de metadata naar dezelfde Claude Code-sessie-ID verwijst.
- Een sessie die alleen in de CLI bestaat, heeft geen archiefvlag en blijft dus zichtbaar zolang het
  transcript aanwezig is.

Voor de detectie is geen aanvullende OpenClaw-configuratie vereist. De Anthropic-Plugin
is gebundeld en standaard ingeschakeld; een native macOS-Node maakt de alleen-lezen
Claude-sessiecommando's bekend wanneer de lokale map `~/.claude/projects/` bestaat.
Keur de upgrade van de Node-koppeling goed wanneer die commando's voor het eerst verschijnen.

De zijbalk groepeert rijen op basis van hun Gateway- of gekoppelde Node-host, begint met de
nieuwste begrensde pagina van elke host en wordt volgens het normale interval van 30 seconden
vernieuwd. Gebruik **Meer sessies laden** onder een catalogusgroep om de volgende pagina toe te voegen
voor elke host met meer geschiedenis; toegevoegde rijen blijven zichtbaar en worden
bij verversingen opnieuw tot dezelfde diepte opgehaald. Catalogusclients gebruiken
`sessions.catalog.list`; bij het openen van een rij wordt `sessions.catalog.read` gebruikt.

Bij overname door de terminal wordt `claude` via het PATH van de login-shell van de hostgebruiker
opgelost vóór het PATH van de service/daemon. Hierdoor blijven vanuit de app gestarte sessies afgestemd
op de Claude CLI die de beheerder in een normale terminal gebruikt.

Wanneer je een rij selecteert, wordt eerst de nieuwste transcriptpagina gelezen. **Oudere transcript-
items laden** volgt een ondoorzichtige bytecursor en leest nog een begrensd gedeelte uit het
JSONL-bestand in plaats van de volledige geschiedenis te laden. Normale inhoud van gebruikers, assistenten,
redeneringen, toolaanroepen en toolresultaten blijft behouden. Een afzonderlijk item
dat groter is dan de veiligheidslimiet van de Node/Gateway, wordt duidelijk als afgekapt gemarkeerd.

Voor een lokale `claude-cli`-rij van de Gateway roept typen in het normale invoerveld
`sessions.catalog.continue` aan. OpenClaw lost het lokale catalogusrecord opnieuw op,
maakt een modelgebonden native sessie aan of hergebruikt deze, importeert maximaal 200 zichtbare
items of 512 KiB en initialiseert de Claude CLI-koppeling. De eerste beurt wordt hervat met
`--fork-session`; Claude wijst de fork een nieuwe sessie-ID toe, zodat latere beurten
de fork gebruiken en de bronsessie onaangetast blijft.

Een headless Node-host kan zijn Claude CLI-rijen ook voortzetbaar maken door
de onderstaande lokale Node-instelling in te schakelen en de Node-host opnieuw te starten:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

De Node maakt `agent.cli.claude.run.v1` alleen bekend wanneer de instelling is ingeschakeld
en het lokale uitvoerbare bestand `claude` kan worden gevonden. OpenClaw lost het catalogus-
record op die Node opnieuw op, importeert dezelfde begrensde geschiedenis en koppelt de overgenomen
sessie aan de Node en de door de catalogus gerapporteerde werkmap. Bij elke beurt wordt het
echte `claude -p`-proces van de Node uitgevoerd met de Claude-bestanden en aanmelding van die Node. Het
beleid voor uitvoeringsgoedkeuring van de Node blijft van toepassing; de Gateway kan de opt-in niet afdwingen.

Node-voortzetting v1 is uitsluitend eenmalig. Gateway-loopback-MCP-configuratie en
argumenten voor de Gateway-Skills-Plugin worden weggelaten, er wordt niet opnieuw geïnitialiseerd vanuit een Gateway-transcript en
bijlagen en afbeeldingen worden geweigerd. Claude Desktop-rijen blijven alleen-lezen. Native
macOS-app-Nodes blijven eveneens alleen-lezen totdat de app het uitvoeringscommando bekendmaakt.

<Note>
Claude-sessies op gekoppelde Nodes blijven alleen-lezen, tenzij de headless Node expliciet
`agent.cli.claude.run.v1` bekendmaakt. OpenClaw wijzigt nooit Claude Desktop-
metadata en archiveert geen Claude-sessies. De pagina vereist een beheerdersverbinding
met schrijfrechten omdat deze geauthenticeerde `node.invoke` gebruikt; weergeven en lezen
blijven alleen-lezen, zelfs op een Node waarop voortzetting is ingeschakeld.
</Note>

Zie [Nodes: Claude-sessies en transcripties](/nl/nodes#claude-sessions-and-transcripts)
voor het Node-commando en de beveiligingsgrens.

## Standaardinstellingen voor denken (Claude Sonnet 5, Mythos 5, Fable 5, 4.8 en 4.6)

`anthropic/claude-sonnet-5` gebruikt standaard adaptief denken met `high` inspanningsniveau.
Gebruik `/think off` om denken uit te schakelen, of `/think xhigh|max` voor de hogere
systeemeigen inspanningsniveaus van het model. OpenClaw laat handmatige denkbudgetten, aangepaste
samplingparameters, vooraf ingevulde assistentteksten en Priority Tier voor Sonnet 5 weg, omdat
Anthropic deze aanvraagfuncties voor dit model niet ondersteunt.
De catalogus gebruikt tot en met 31 augustus 2026 de introductieprijzen van Anthropic van `$2/$10` voor invoer/uitvoer;
de standaardprijzen van `$3/$15` gelden vanaf 1 september 2026.

`anthropic/claude-fable-5` gebruikt altijd adaptief denken en heeft standaard het inspanningsniveau `high`.
Anthropic staat niet toe dat denken voor dit model wordt uitgeschakeld, dus
`/think off` en `/think minimal` worden in plaats daarvan toegewezen aan het inspanningsniveau `low`. OpenClaw laat ook
aangepaste temperatuurwaarden weg bij aanvragen voor Fable 5, omdat Anthropic
een temperatuurwijziging afwijst voor elke aanvraag waarbij denken is ingeschakeld.

`anthropic/claude-mythos-5` is een model met beperkte toegang en hetzelfde contract voor
adaptief denken dat altijd is ingeschakeld. OpenClaw gebruikt standaard `high`, wijst `/think off` en
`/think minimal` toe aan `low` en laat door de aanroeper gekozen samplingparameters weg.
De catalogus vermeldt het contextvenster van 1.000.000 tokens, de uitvoerlimiet
van 128.000 tokens, beeldinvoer en de invoer-/uitvoerprijzen van `$10/$50`.

Voor Claude Opus 4.8 blijft denken standaard uitgeschakeld in OpenClaw. Wanneer je
adaptief denken expliciet inschakelt met `/think high|xhigh|max`, verzendt OpenClaw
de inspanningswaarden van Anthropic voor Opus 4.8; Claude 4.6-modellen (Opus 4.6 en Sonnet 4.6)
gebruiken standaard `adaptive`.

Overschrijf dit per bericht met `/think:<level>` of in de modelparameters:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Gerelateerde documentatie van Anthropic:
- [Adaptief denken](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Uitgebreid denken](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Terugval bij veiligheidsweigering (Claude Fable 5)

<Warning>
Claude Fable 5 gebruiken betekent ook Claude Opus 4.8 gebruiken. Fable 5 wordt geleverd met
veiligheidsclassificatoren die een aanvraag kunnen weigeren, en de door Anthropic goedgekeurde
herstelmethode is om `claude-opus-4-8` die beurt te laten afhandelen. OpenClaw schakelt dit
automatisch in voor rechtstreekse aanvragen met een API-sleutel, waardoor sommige Fable-beurten
worden beantwoord en gefactureerd als Claude Opus 4.8. Als jouw beleid of budget
geen door Opus afgehandelde beurten toestaat, selecteer dan niet `anthropic/claude-fable-5`.
</Warning>

### Waarom dit bestaat

Fable 5-classificatoren retourneren `stop_reason: "refusal"` voor aanvragen in beperkte
domeinen, en geven ook fout-positieve resultaten bij aangrenzend onschuldig werk (beveiligingstools,
levenswetenschappen of zelfs wanneer het model wordt gevraagd zijn onbewerkte
redenering te reproduceren). Zonder terugval mislukt de beurt met een fout, hoewel
een ander Claude-model deze probleemloos zou afhandelen. Het eigen weigeringsbericht van Anthropic
vertelt API-integrators dat ze een terugvalmodel moeten configureren.

### Hoe het werkt

1. Voor elke rechtstreekse aanvraag met een API-sleutel aan `anthropic/claude-fable-5` verzendt OpenClaw
   de opt-in van Anthropic voor terugval aan de serverzijde: de bètaheader
   `server-side-fallback-2026-06-01` plus
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 is het enige
   terugvaldoel dat Anthropic voor Fable 5 toestaat.
2. Alleen een weigering door een veiligheidsclassificator activeert de terugval. Snelheidslimieten,
   overbelasting en serverfouten gedragen zich precies zoals voorheen en worden afgehandeld via
   de normale [modelovername](/nl/concepts/model-failover) van OpenClaw.
3. De redding vindt plaats binnen dezelfde aanroep. Een weigering vóór enige uitvoer is
   afgezien van de latentie onzichtbaar; het volledige antwoord komt van Opus 4.8. Bij een
   weigering halverwege de stream blijft de gedeeltelijke tekst behouden als het voorvoegsel waarop het terugvalmodel
   verdergaat, terwijl de redenering en toolaanroepen van het weigerende model
   volgens de herhalingsregels van Anthropic worden verwijderd (ze mogen niet worden teruggestuurd of
   uitgevoerd).
4. Als Claude Opus 4.8 eveneens weigert, wordt de weigering voor de beurt weergegeven als een
   fout, precies zoals vóór deze functie.

De terugval vindt plaats op het niveau van de Anthropic-API, dus `claude-opus-4-8` hoeft niet
in je geconfigureerde modellenlijst of terugvalketen te staan: een API-sleutel
die Fable ondersteunt, kan altijd Opus afhandelen.

### Observatie en facturering

- Een door terugval afgehandelde beurt registreert een diagnostiekwaarde `provider_fallback` in het
  assistentbericht, met daarin `fromModel` en `toModel`, en de
  `responseModel` van het bericht vermeldt `claude-opus-4-8`.
- Anthropic factureert per poging: een weigering vóór uitvoer is gratis en de redding
  wordt gefactureerd tegen de tarieven van Claude Opus 4.8 (momenteel de helft van de Fable 5-tarieven). De
  kostenraming per beurt van OpenClaw berekent door terugval afgehandelde beurten tegen Opus-tarieven, zodat dit overeenkomt.
- Bij een weigering halverwege de stream factureert Anthropic daarnaast het reeds gestreamde gedeeltelijke
  Fable-resultaat; dat deel wordt gerapporteerd in het gebruik per poging van de API,
  maar niet opgenomen in de kostenraming per beurt van OpenClaw.

### Bereik

Van toepassing op `anthropic/claude-fable-5` met authenticatie via een API-sleutel bij
`api.anthropic.com`. OAuth (hergebruik van een Claude CLI-abonnement), proxybasis-URL's,
Bedrock-, Vertex- en Foundry-aanvragen blijven ongewijzigd en geven
weigeringen daar nog steeds als fouten weer.

Live geverifieerd: een onschuldige prompt die Fable 5 vraagt zijn onbewerkte redeneerketen
te reproduceren, wordt geweigerd met `category: "reasoning_extraction"` wanneer deze zonder
terugvalopties wordt verzonden, en dezelfde prompt via OpenClaw retourneert een normaal, door Opus afgehandeld
antwoord waaraan de diagnostiekwaarde `provider_fallback` is toegevoegd.

Zie de [handleiding voor weigeringen en terugval
van Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
voor het onderliggende gedrag.

## Promptcaching

OpenClaw ondersteunt de promptcachingfunctie van Anthropic voor authenticatie via een API-sleutel.

| Waarde               | Cacheduur | Beschrijving                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (standaard) | 5 minuten      | Automatisch toegepast bij authenticatie via een API-sleutel |
| `"long"`            | 1 uur         | Uitgebreide cache                         |
| `"none"`            | Geen caching     | Promptcaching uitschakelen                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cache-instellingen per agent overschrijven">
    Gebruik parameters op modelniveau als uitgangspunt en overschrijf vervolgens specifieke agents via `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Volgorde voor het samenvoegen van configuratie:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (overeenkomend met `id`, overschrijft per sleutel)

    Hierdoor kan de ene agent een langdurige cache behouden, terwijl een andere agent op hetzelfde model caching uitschakelt voor piekverkeer/verkeer met weinig hergebruik.

  </Accordion>

  <Accordion title="Opmerkingen over Bedrock Claude">
    - Anthropic Claude-modellen op Bedrock (`amazon-bedrock/*anthropic.claude*`) accepteren doorvoer van `cacheRetention` wanneer dit is geconfigureerd.
    - Niet-Anthropic-modellen op Bedrock worden tijdens runtime gedwongen tot `cacheRetention: "none"`.
    - Slimme standaardwaarden voor API-sleutels stellen ook `cacheRetention: "short"` in voor Claude-on-Bedrock-verwijzingen wanneer geen expliciete waarde is ingesteld.

  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Snelle modus">
    De gedeelde `/fast`-schakelaar van OpenClaw stelt het veld `service_tier` van Anthropic voor rechtstreeks API-sleutelverkeer in op `api.anthropic.com`.

    | Opdracht | Wordt toegewezen aan |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Geldt alleen voor rechtstreekse `api.anthropic.com`-verzoeken die met een API-sleutel worden gedaan. Verzoeken met OAuth-/abonnementstokens en proxyroutes krijgen nooit een `service_tier`-veld.
    - Expliciete `serviceTier`- of `service_tier`-parameters overschrijven `/fast` wanneer beide zijn ingesteld.
    - Voor accounts zonder capaciteit voor Priority Tier kan `service_tier: "auto"` worden omgezet in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Mediabegrip (afbeeldingen en PDF)">
    De gebundelde Anthropic-plugin registreert begrip van afbeeldingen en PDF-bestanden. OpenClaw
    bepaalt mediacapaciteiten automatisch op basis van de geconfigureerde Anthropic-authenticatie;
    er is geen aanvullende configuratie nodig.

    | Eigenschap       | Waarde                 |
    | --------------- | --------------------- |
    | Standaardmodel  | `claude-opus-4-8`     |
    | Ondersteunde invoer | Afbeeldingen, PDF-documenten |

    Wanneer een afbeelding of PDF aan een gesprek wordt toegevoegd, leidt OpenClaw
    deze automatisch door de Anthropic-provider voor mediabegrip.

  </Accordion>

  <Accordion title="Contextvenster van 1M">
    Claude Sonnet 5, Mythos 5 en Fable 5 hebben een exact invoervenster van
    1,000,000 tokens en ondersteunen maximaal 128,000 uitvoertokens. Het 1M-contextvenster
    van Anthropic is ook algemeen beschikbaar voor Claude 4.x-modellen met adaptief denken: Opus 4.8,
    Opus 4.7, Opus 4.6 en Sonnet 4.6. OpenClaw stelt de grootte voor deze modellen
    automatisch in; `params.context1m` is niet nodig:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Oudere configuraties kunnen `params.context1m: true` behouden; voor
    deze modellen is dit een onschadelijke no-op en OpenClaw verzendt de uitgefaseerde
    bètaheader `context-1m-2025-08-07` niet meer, ongeacht de configuratie. Oudere
    `anthropicBeta`-configuratievermeldingen met die waarde worden verwijderd tijdens
    het bepalen van verzoekheaders, en niet-ondersteunde oudere Claude-modellen behouden hun normale contextvenster.

    `params.context1m: true` werkt op dezelfde manier voor de Claude CLI-backend
    (`claude-cli/*`): geschikte Opus- en Sonnet-modellen die algemeen beschikbaar zijn, krijgen het
    1M-venster al automatisch, dus ook daar is de parameter optioneel.

    <Warning>
    Vereist toegang tot lange contexten voor je Anthropic-referentie. Authenticatie met OAuth-/abonnementstokens behoudt de vereiste Anthropic-bètaheaders, maar OpenClaw verwijdert de uitgefaseerde 1M-bètaheader als deze nog in een oudere configuratie staat.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8-context van 1M">
    `anthropic/claude-opus-4-8` en de bijbehorende `claude-cli`-variant hebben standaard een
    contextvenster van 1M; `params.context1m: true` is niet nodig.
  </Accordion>
</AccordionGroup>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="401-fouten / token plotseling ongeldig">
    Anthropic-tokenauthenticatie verloopt en kan worden ingetrokken. Gebruik voor nieuwe configuraties in plaats daarvan een Anthropic API-sleutel.
  </Accordion>

  <Accordion title='Geen API-sleutel gevonden voor provider "anthropic"'>
    Anthropic-authenticatie is **per agent**; nieuwe agents nemen de sleutels van de hoofdagent niet over. Voer de onboarding opnieuw uit voor die agent (of configureer een API-sleutel op de Gateway-host) en verifieer dit vervolgens met `openclaw models status`.
  </Accordion>

  <Accordion title='Geen referenties gevonden voor profiel "anthropic:default"'>
    Voer `openclaw models status` uit om te zien welk authenticatieprofiel actief is. Voer de onboarding opnieuw uit of configureer een API-sleutel voor dat profielpad.
  </Accordion>

  <Accordion title="Geen beschikbaar authenticatieprofiel (allemaal in afkoelperiode)">
    Controleer `openclaw models status --json` op `auth.unusableProfiles`. Afkoelperioden voor Anthropic-snelheidslimieten kunnen modelspecifiek zijn, waardoor een verwant Anthropic-model mogelijk nog bruikbaar is. Voeg een ander Anthropic-profiel toe of wacht tot de afkoelperiode voorbij is.
  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [Veelgestelde vragen](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="CLI-backends" href="/nl/gateway/cli-backends" icon="terminal">
    Installatie- en runtimegegevens voor de Claude CLI-backend.
  </Card>
  <Card title="Promptcaching" href="/nl/reference/prompt-caching" icon="database">
    Hoe promptcaching bij verschillende providers werkt.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiegegevens en regels voor het hergebruik van inloggegevens.
  </Card>
</CardGroup>
