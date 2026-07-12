---
read_when:
    - Je wilt inferentie instellen en vervolgens de configuratie voltooien met Crestodian
summary: CLI-referentie voor `openclaw onboard` (interactieve onboarding)
title: Onboarding
x-i18n:
    generated_at: "2026-07-12T08:42:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Begeleide configuratie waarbij inferentie als eerste wordt ingesteld: bestaande AI-toegang wordt gedetecteerd,
een live voltooiing is vereist, alleen de werkende route wordt opgeslagen en vervolgens wordt
Crestodian gestart om de rest te configureren. `openclaw setup` is hetzelfde toegangspunt;
`openclaw setup --baseline` schrijft alleen de basisconfiguratie/-werkruimte.

<CardGroup cols={2}>
  <Card title="CLI-onboardingcentrum" href="/nl/start/wizard" icon="rocket">
    Stapsgewijze uitleg van de interactieve CLI-stroom.
  </Card>
  <Card title="Onboardingoverzicht" href="/nl/start/onboarding-overview" icon="map">
    Hoe de onboarding van OpenClaw in elkaar zit.
  </Card>
  <Card title="CLI-configuratiereferentie" href="/nl/start/wizard-cli-reference" icon="book">
    Uitvoer, interne werking en gedrag per stap.
  </Card>
  <Card title="CLI-automatisering" href="/nl/start/wizard-cli-automation" icon="terminal">
    Niet-interactieve vlaggen en gescripte configuraties.
  </Card>
  <Card title="Onboarding van de macOS-app" href="/nl/start/onboarding" icon="apple">
    Onboardingstroom voor de macOS-menubalkapp.
  </Card>
</CardGroup>

## Voorbeelden

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: opent de volledige stapsgewijze wizard. Deze kan niet worden gecombineerd met
  `--non-interactive`; laat `--classic` weg voor geautomatiseerde configuratie.
- `--flow quickstart`: opent de klassieke wizard met minimale vragen en
  genereert automatisch een Gateway-token.
- `--flow manual` (alias `advanced`): opent de klassieke wizard met alle vragen
  voor poort, binding en authenticatie.
- `--flow import`: voert een gedetecteerde migratieprovider uit (bijvoorbeeld Hermes via `--import-from hermes`), toont een voorbeeld van het plan en past het vervolgens na bevestiging toe. Importeren werkt alleen met een nieuwe OpenClaw-configuratie: stel eerst de configuratie, aanmeldgegevens, sessies en werkruimtestatus opnieuw in als deze bestaan. Gebruik [`openclaw migrate`](/nl/cli/migrate) voor proefuitvoeringsplannen, overschrijfmodus, rapporten en exacte toewijzingen.
- `--modern` is een compatibiliteitsalias voor de conversationele configuratieassistent
  Crestodian. Deze gebruikt dezelfde live-inferentiecontrole als `openclaw crestodian` en
  accepteert alleen `--workspace`, `--accept-risk`,
  `--non-interactive` en `--json`. Andere configuratievlaggen worden geweigerd in plaats van
  stilzwijgend genegeerd.

## Begeleide stroom

Een gewone `openclaw onboard` start de begeleide stroom. Deze toont de beveiligingsmelding,
detecteert AI-toegang die al beschikbaar is via geconfigureerde modellen, API-sleutel-
omgevingsvariabelen en ondersteunde lokale CLI's, en test vervolgens de aanbevolen
kandidaat met een echte voltooiing. Als die kandidaat mislukt, toont de onboarding
de reden en probeert deze automatisch de volgende bruikbare kandidaat.

Als de automatische detectie geen opties meer oplevert, kiest u een andere gedetecteerde kandidaat of voert u
een API-sleutel van een provider in via een gemaskeerde vraag. Een handmatige sleutel wordt via hetzelfde
live-voltooiingspad getest. Begeleide onboarding
biedt geen Crestodian of een afsluitoptie zonder AI voordat een kandidaat slaagt. OpenClaw
slaat pas na een geslaagde test de geverifieerde modelroute en de bijbehorende aanmeldgegevens op;
een mislukte kandidaat vervangt het geconfigureerde model niet en slaat de
geprobeerde aanmeldgegevens niet op. De configuratie van de werkruimte en Gateway blijft ongewijzigd totdat
Crestodian wordt gestart.

In de begeleide modus levert `--workspace <dir>` de voorgestelde werkruimte van Crestodian
en de geïsoleerde inferentiecontext. Deze wordt pas opgeslagen nadat u het
configuratievoorstel van Crestodian hebt goedgekeurd. Klassieke en niet-interactieve onboarding slaan hun
werkruimte via hun normale configuratiestroom op.

Nadat inferentie is geslaagd, start begeleide onboarding Crestodian onmiddellijk met
het geverifieerde model. Crestodian kan vervolgens de werkruimte, Gateway,
kanalen, agents, plugins en andere optionele functies configureren. Gebruik binnen Crestodian
`open channel wizard for <channel>` om het verzamelen van kanaalaanmeldgegevens over te dragen aan een
gemaskeerde terminalwizard. Als u de modelprovider of de authenticatie daarvan wilt wijzigen,
sluit u Crestodian af en voert u `openclaw onboard` uit; Crestodian opent de begeleide
of klassieke providerstromen niet.

Als u `openclaw onboard` opnieuw uitvoert op een geconfigureerde installatie, wordt eerst het huidige
standaardmodel geverifieerd, zodat dezelfde stroom als verificatie- en herstelstap werkt.
Als die controle mislukt, wordt het geconfigureerde model nooit automatisch vervangen —
de onboarding stopt en vraagt hoe verder te gaan. De controle wordt buiten uw
werkruimte uitgevoerd, waardoor een model dat door een werkruimteplugin wordt geleverd hier kan mislukken terwijl het
in de agent wel werkt.
Gebruik `openclaw onboard --classic` voor providerspecifieke authenticatie, kanalen, Skills,
configuratie van een externe Gateway, imports of volledige Gateway-bediening. Voer voor conversationele
configuratie en herstel zonder inferentie `openclaw crestodian` uit; `openclaw onboard
--modern` is een compatibiliteitsalias die dezelfde inferentiecontrole gebruikt. De klassieke
wizard kan het standaardmodel optioneel met een live voltooiing verifiëren, maar
Crestodian wordt pas gestart nadat de eigen live-inferentiecontrole is geslaagd.

In een interactieve terminal wordt een kale `openclaw` (zonder subopdracht) op basis van de
configuratiestatus doorgestuurd:

- Als het actieve configuratiebestand ontbreekt of geen door de gebruiker opgegeven instellingen bevat (leeg of
  alleen metagegevens), wordt begeleide onboarding gestart.
- Als het configuratiebestand bestaat maar de validatie mislukt, wordt het klassieke
  onboardingpad gestart met begeleiding van `openclaw doctor`. Crestodian vereist werkende
  inferentie en wordt niet gebruikt om deze status van vóór de inferentie te herstellen.
- Als het configuratiebestand geldig is, wordt de normale agent-TUI geopend. Een bereikbare
  geconfigureerde Gateway met een agent en model gaat rechtstreeks naar die interface zonder
  onboarding of Crestodian. Op een geconfigureerde installatie opent u Crestodian met
  `/crestodian` in de TUI of met `openclaw crestodian`.

Platte-tekst-`ws://` wordt geaccepteerd voor local loopback, letterlijke privé-IP-adressen, `.local` en Gateway-URL's van het Tailnet met `*.ts.net`. Stel voor andere vertrouwde privé-DNS-namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in de procesomgeving van de onboarding in.

## Opnieuw instellen

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` wist de status voordat de configuratie wordt uitgevoerd. `--reset-scope` bepaalt hoeveel wordt gewist: `config` (alleen configuratie), `config+creds+sessions` (standaard wanneer `--reset` zonder bereik wordt doorgegeven) of `full` (stelt ook de werkruimte opnieuw in). De werkruimte wordt alleen opnieuw ingesteld met `--reset-scope full`.

## Landinstelling

Interactieve onboarding gebruikt de landinstelling van de CLI-wizard voor vaste configuratietekst. Volgorde van bepaling:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Engels als terugvaloptie

Ondersteunde wizard-landinstellingen zijn `en`, `zh-CN` en `zh-TW`. Waarden voor landinstellingen mogen onderstrepingstekens of POSIX-achtervoegselvormen gebruiken, zoals `zh_CN.UTF-8`. Productnamen, opdrachtnamen, configuratiesleutels, URL's, provider-ID's, model-ID's en plugin-/kanaallabels blijven letterlijk behouden.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Niet-interactieve configuratie

`--non-interactive` vereist `--accept-risk` (waarmee wordt erkend dat agents krachtig zijn en volledige systeemtoegang risico's met zich meebrengt). `--mode` is standaard `local`.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` is optioneel; indien weggelaten, controleert onboarding `CUSTOM_API_KEY` in de omgeving. OpenClaw markeert gangbare ID's van visiemodellen (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral en vergelijkbare modellen) automatisch als geschikt voor afbeeldingen. Geef `--custom-image-input` door voor onbekende aangepaste visiemodel-ID's of `--custom-text-input` om metagegevens voor uitsluitend tekst af te dwingen. Gebruik `--custom-compatibility openai-responses` voor OpenAI-compatibele eindpunten die `/v1/responses` ondersteunen maar niet `/v1/chat/completions`; geldige waarden zijn `openai` (standaard), `openai-responses` en `anthropic`.

LM Studio heeft ook een providerspecifieke sleutelvlag:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Niet-interactieve Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` is standaard `http://127.0.0.1:11434`. `--custom-model-id` is optioneel; indien weggelaten, gebruikt onboarding de voorgestelde standaardwaarden van Ollama. Cloudmodel-ID's zoals `kimi-k2.5:cloud` werken hier ook.

Sla providersleutels op als verwijzingen in plaats van als platte tekst:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Met `--secret-input-mode ref` schrijft onboarding door de omgeving ondersteunde verwijzingen in plaats van sleutelwaarden in platte tekst: voor providers die door authenticatieprofielen worden ondersteund, wordt `keyRef: { source: "env", provider: "default", id: <envVar> }` geschreven; voor aangepaste providers wordt `models.providers.<id>.apiKey` op dezelfde manier geschreven (bijvoorbeeld `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contract: stel de omgevingsvariabele van de provider in de procesomgeving van de onboarding in (bijvoorbeeld `OPENAI_API_KEY`) en geef niet ook een inline sleutelvlag door tenzij die omgevingsvariabele is ingesteld — een vlagwaarde zonder de overeenkomende omgevingsvariabele mislukt onmiddellijk met aanwijzingen.

### Gateway-authenticatie (niet-interactief)

- `--gateway-auth token --gateway-token <token>` slaat een token in platte tekst op. `token` is de standaardauthenticatiemodus.
- `--gateway-auth token --gateway-token-ref-env <name>` slaat `gateway.auth.token` op als een SecretRef naar een omgevingsvariabele. Vereist een niet-lege omgevingsvariabele met die naam in de procesomgeving van de onboarding.
- `--gateway-token` en `--gateway-token-ref-env` sluiten elkaar wederzijds uit.
- Met `--install-daemon`: een via SecretRef beheerde `gateway.auth.token` wordt gevalideerd, maar niet als opgeloste platte tekst opgeslagen in de omgevingsmetagegevens van de supervisorservice; als de verwijzing niet kan worden opgelost, wordt de installatie veilig afgebroken met herstelrichtlijnen. Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, wordt de installatie geblokkeerd totdat de modus expliciet is ingesteld.
- Lokale onboarding schrijft `gateway.mode="local"` naar de configuratie. Als in een later configuratiebestand `gateway.mode` ontbreekt, duidt dit op beschadigde configuratie of een onvolledige handmatige bewerking, niet op een geldige snelkoppeling voor de lokale modus.
- Lokale onboarding installeert downloadbare plugins die voor het gekozen configuratiepad vereist zijn (bijvoorbeeld een Codex- of Copilot-runtimeplugin voor die authenticatiekeuzes). Externe onboarding schrijft alleen verbindingsgegevens voor de externe Gateway — er worden nooit lokale pluginpakketten geïnstalleerd.
- `--allow-unconfigured` is een afzonderlijke nooduitgang voor `openclaw gateway run`; hiermee kan onboarding `gateway.mode` niet overslaan.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Status van de lokale Gateway

- Tenzij u `--skip-health` doorgeeft, wacht onboarding op een bereikbare lokale Gateway voordat deze succesvol wordt afgesloten.
- `--install-daemon` start eerst het beheerde installatiepad van de Gateway. Zonder deze vlag moet er al een lokale Gateway actief zijn (bijvoorbeeld `openclaw gateway run`).
- `--skip-health` slaat het wachten over als u in automatisering alleen de configuratie-/werkruimte-/bootstrapgegevens wilt schrijven.
- `--skip-bootstrap` stelt `agents.defaults.skipBootstrap: true` in en slaat het maken van `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` en `BOOTSTRAP.md` over.
- Op systeemeigen Windows probeert `--install-daemon` eerst Scheduled Tasks en valt deze terug op een aanmelditem per gebruiker in de map Startup als het maken van een taak wordt geweigerd.

### Interactieve verwijzingsmodus

- Kies **Geheime verwijzing gebruiken** wanneer daarom wordt gevraagd en kies vervolgens **Omgevingsvariabele** of een geconfigureerde geheimprovider (`file` of `exec`).
- Onboarding voert vóór het opslaan van de verwijzing een snelle voorbereidende validatie uit en laat u het opnieuw proberen als deze mislukt.

### Keuzes voor Z.AI-eindpunten

<Note>
`--auth-choice zai-api-key` detecteert automatisch het beste Z.AI-eindpunt en model voor je sleutel: Coding Plan-eindpunten geven de voorkeur aan `zai/glm-5.2` (met terugval op `glm-5.1` als dit niet beschikbaar is); algemene API-eindpunten gebruiken standaard `zai/glm-5.1`. Kies rechtstreeks `zai-coding-global` of `zai-coding-cn` om een Coding Plan-eindpunt af te dwingen.
</Note>

```bash
# Selectie van eindpunt zonder prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Andere Z.AI-eindpuntkeuzes: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Aanvullende niet-interactieve vlaggen

Modelauthenticatie op basis van tokens (gebruikt met `--auth-choice token`):

| Vlag                            | Beschrijving                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--token-provider <id>`         | ID van de tokenprovider die het token uitgeeft                                                                                             |
| `--token <token>`               | Tokenwaarde voor modelauthenticatie                                                                                                        |
| `--token-profile-id <id>`       | ID van het authenticatieprofiel (standaard `<provider>:manual`; sommige provider-eigen processen gebruiken hun eigen standaardwaarde, zoals `anthropic:default`) |
| `--token-expires-in <duration>` | Optionele geldigheidsduur van het token (bijv. `365d`, `12h`)                                                                              |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Beheer van daemoninstallatie: `--no-install-daemon` / `--skip-daemon` (aliassen; sla de installatie van de Gateway-service over), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (standaard `npm`), `--skip-skills`.

Instelling van UI en hooks: `--skip-ui` (sla prompts van de Control UI/TUI over), `--skip-hooks` (sla de instelling van webhooks/hooks over), `--skip-channels`, `--skip-search`.

Uitvoer: `--suppress-gateway-token-output` onderdrukt Gateway/UI-uitvoer die tokens bevat (tokenhints, een URL voor automatisch aanmelden met een ingesloten token en het automatisch starten van de Control UI) - nuttig in gedeelde terminals en CI.

<Note>
`--json` impliceert geen niet-interactieve modus bij begeleide of klassieke onboarding.
Met `--modern` geeft JSON een eenmalig Crestodian-overzicht en wordt het proces na dat
ene resultaat afgesloten. Gebruik `--non-interactive` voor andere scripts.
</Note>

## Voorfiltering van providers

Wanneer een authenticatiekeuze een voorkeursprovider impliceert, filtert onboarding de keuzelijsten voor het standaardmodel en de toestemmingslijst vooraf op de modellen van die provider. Het filter komt ook overeen met andere providers die eigendom zijn van dezelfde plugin, waaronder Coding Plan-varianten zoals `volcengine`/`volcengine-plan` en `byteplus`/`byteplus-plan`. Als het filter voor de voorkeursprovider geen geladen modellen oplevert, valt onboarding terug op de ongefilterde catalogus in plaats van de keuzelijst leeg te laten.

## Vervolgvragen voor zoeken op het web

Sommige providers voor zoeken op het web activeren providerspecifieke vervolgvragen tijdens de onboarding:

- **Grok** kan optionele configuratie van `x_search` aanbieden met dezelfde xAI-authenticatie en een keuze voor een `x_search`-model.
- **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` versus `api.moonshot.cn`) en het standaardmodel van Kimi voor zoeken op het web.

## Overig gedrag

- Gedrag van het DM-bereik bij lokale onboarding: [CLI-configuratiereferentie](/nl/start/wizard-cli-reference#outputs-and-internals).
- Snelste eerste chat: `openclaw dashboard` (Control UI, geen kanaalconfiguratie).
- Aangepaste provider: verbind met elk OpenAI- of Anthropic-compatibel eindpunt, inclusief gehoste providers die niet worden vermeld. Gebruik de compatibiliteit **Unknown** om dit automatisch te detecteren via een live-probe.
- Als een Hermes-status wordt gedetecteerd, biedt onboarding een migratieproces aan (zie `--flow import` hierboven).

## Veelgebruikte vervolgopdrachten

Gebruik later `openclaw configure` voor gerichte wijzigingen zonder inferentie en `openclaw
channels add` om uitsluitend kanalen in te stellen. Voer in plaats daarvan
`openclaw onboard` uit voor wijzigingen aan de modelprovider of authenticatieroute.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
