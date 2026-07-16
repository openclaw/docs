---
read_when:
    - Je wilt de standaardmodellen wijzigen of de authenticatiestatus van de provider bekijken
    - Je wilt beschikbare modellen/providers scannen en authenticatieprofielen debuggen
summary: CLI-referentie voor `openclaw models` (status/lijst/instellen/scannen, aliassen, fallbacks, authenticatie)
title: Modellen
x-i18n:
    generated_at: "2026-07-16T15:22:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Modeldetectie, scannen en configuratie (standaardmodel, fallbacks, authenticatieprofielen).

Gerelateerd:

- Providers + modellen: [Modellen](/nl/providers/models)
- Concepten voor modelselectie + `/models`-slashopdracht: [Modelconcept](/nl/concepts/models)
- Authenticatie van providers instellen: [Aan de slag](/nl/start/getting-started)

## Veelgebruikte opdrachten

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

De subopdrachten `status` en `auth` accepteren `--agent <id>` om een geconfigureerde agent als doel te kiezen; `list`, `scan`, `aliases` en `fallbacks`/`image-fallbacks` gebruiken altijd de geconfigureerde standaardagent, en `set`/`set-image` wijzen `--agent` zonder meer af. Wanneer dit wordt weggelaten, gebruiken opdrachten die rekening houden met `--agent` eerst `OPENCLAW_AGENT_DIR` als dit is ingesteld, en anders de geconfigureerde standaardagent.

### Status

`openclaw models status` toont het herleide standaardmodel en de fallbacks, plus een authenticatieoverzicht. Wanneer momentopnamen van het providergebruik beschikbaar zijn, bevat het statusgedeelte voor OAuth/API-sleutels gebruiksvensters en quotamomentopnamen van providers. Providers met huidige gebruiksvensters: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi en z.ai. Gebruiksverificatie is afkomstig van providerspecifieke hooks wanneer die beschikbaar zijn; anders valt OpenClaw terug op overeenkomende OAuth-/API-sleutelreferenties uit authenticatieprofielen, omgevingsvariabelen of configuratie.

In de uitvoer van `--json` is `auth.providers` het provideroverzicht dat rekening houdt met omgeving, configuratie en opslag, terwijl `auth.oauth` alleen de status van profielen in de authenticatieopslag weergeeft.

Opties:

| Vlag                      | Effect                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON-uitvoer; diagnostiek voor authenticatieprofielen, providers en opstarten gaat naar stderr, zodat stdout via een pipe aan `jq` kan worden doorgegeven. |
| `--plain`                 | Uitvoer als platte tekst.                                                                                            |
| `--check`                 | Sluit af met een andere code dan nul als authenticatie bijna of al verlopen is: `1` = verlopen/ontbrekend, `2` = bijna verlopen.                             |
| `--probe`                 | Livecontrole van geconfigureerde authenticatieprofielen. Echte aanvragen; kan tokens verbruiken en snelheidslimieten activeren.            |
| `--probe-provider <name>` | Controleer slechts één provider.                                                                                      |
| `--probe-profile <id>`    | Controleer specifieke ID's van authenticatieprofielen (herhaald of door komma's gescheiden).                                                  |
| `--probe-timeout <ms>`    | Time-out per controle.                                                                                            |
| `--probe-concurrency <n>` | Gelijktijdige controles.                                                                                            |
| `--probe-max-tokens <n>`  | Maximumaantal tokens voor controles (naar beste vermogen).                                                                               |
| `--agent <id>`            | ID van de geconfigureerde agent; overschrijft `OPENCLAW_AGENT_DIR`.                                                          |

Controleregels kunnen afkomstig zijn van authenticatieprofielen, omgevingsreferenties of `models.json`. Statuscategorieën voor controles: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Detail-/redencodes die je kunt verwachten wanneer een controle nooit tot een modelaanroep komt:

- `excluded_by_auth_order`: er bestaat een opgeslagen profiel, maar expliciete `auth.order.<provider>` heeft het weggelaten. Daarom meldt de controle de uitsluiting in plaats van het profiel te proberen.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: het profiel is aanwezig, maar komt niet in aanmerking of kan niet worden herleid.
- `ineligible_profile`: het profiel is om een andere reden niet compatibel met de providerconfiguratie.
- `no_model`: er bestaat providerauthenticatie, maar OpenClaw kon voor die provider geen controleerbaar model als kandidaat herleiden.

Voor probleemoplossing met OpenAI ChatGPT/Codex OAuth zijn `openclaw models status`, `openclaw models auth list --provider openai` en `openclaw config get agents.defaults.model --json` de snelste manier om te bevestigen of een agent een bruikbaar OAuth-profiel van `openai` heeft voor `openai/*` via de systeemeigen Codex-runtime. Zie [OpenAI-provider instellen](/nl/providers/openai#check-and-recover-codex-oauth-routing).

### Lijst

`openclaw models list` is alleen-lezen: de opdracht leest configuratie, authenticatieprofielen, bestaande catalogusstatus en catalogusregels die eigendom zijn van providers, maar herschrijft `models.json` nooit.

Opties: `--all` (volledige catalogus), `--local` (filteren op lokale modellen), `--provider <id>`, `--json`, `--plain`.

Opmerkingen:

- De kolom `Auth` is alleen-lezen. Voor modelroutes die eigendom zijn van providers, zoals OpenAI, koppelt deze kolom de API-/basis-URL-route van elke regel aan geschikte profielen in effectieve `auth.order`, omgevings-/configuratiereferenties en herleide opdrachtgebonden SecretRefs. Een concrete OpenAI-regel blijft onbekend wanneer het routebeleid niet beschikbaar is, in plaats van authenticatie op providerniveau over te nemen; oude controles die alleen op de provider zijn gebaseerd en andere providers behouden gedrag op providerniveau. Metagegevens voor synthetische authenticatie van plugins zijn alleen een aanwijzing voor runtimefunctionaliteit en geen bewijs van systeemeigen accountauthenticatie. Daarom blijven accountafhankelijke routes onbekend zonder positief registerbewijs. De opdracht laadt de providerruntime niet, leest geen geheimen uit de sleutelhanger, roept geen provider-API's aan en bewijst niet dat uitvoering exact gereed is.
- `models list --all --provider <id>` kan statische catalogusregels bevatten die eigendom zijn van providers en afkomstig zijn uit pluginmanifesten of gebundelde providercatalogusmetagegevens, zelfs wanneer je nog niet bij die provider bent geauthenticeerd. Die regels worden nog steeds als niet beschikbaar weergegeven totdat overeenkomende authenticatie is geconfigureerd.
- `models list` houdt het besturingsvlak responsief wanneer de detectie van providercatalogi traag is. De standaardweergave en geconfigureerde weergaven vallen na kort wachten terug op geconfigureerde of synthetische modelregels en laten de detectie op de achtergrond voltooien. Gebruik `--all` wanneer je de exact volledig gedetecteerde catalogus nodig hebt en bereid bent op providerdetectie te wachten.
- Brede `models list --all` voegt manifestcatalogusregels samen over registerregels zonder aanvullende runtimehooks van providers te laden. Providergefilterde snelle manifestpaden gebruiken alleen providers die als `static` zijn gemarkeerd; providers die als `refreshable` zijn gemarkeerd, blijven gebaseerd op register/cache en voegen manifestregels als aanvullingen toe, terwijl providers die als `runtime` zijn gemarkeerd, register-/runtimedetectie blijven gebruiken.
- `models list` houdt systeemeigen modelmetagegevens en runtimelimieten gescheiden. In tabeluitvoer toont `Ctx` `contextTokens/contextWindow` wanneer een effectieve runtimelimiet afwijkt van het systeemeigen contextvenster; JSON-regels bevatten `contextTokens` wanneer een provider die limiet beschikbaar stelt.
- Voor routes die eigendom zijn van providers projecteert `models list` één logische provider-/modelregel op de geselecteerde route. `Input` en `Ctx` zijn uitsluitend afkomstig van een catalogusregel voor een exact overeenkomende fysieke route, waarbij expliciet geconfigureerde logische overschrijvingen als laatste worden toegepast; niet-herleide routeselectie toont onbekende functionaliteitsvelden in plaats van metagegevens van een verwante route over te nemen.
- `models list --provider <id>` filtert op provider-ID, zoals `moonshot` of `openai`. De optie accepteert geen weergavelabels uit interactieve providerkiezers, zoals `Moonshot AI`.
- Modelverwijzingen worden ontleed door ze bij de **eerste** `/` te splitsen. Als de model-ID `/` bevat (in OpenRouter-stijl), neem dan het providervoorvoegsel op (voorbeeld: `openrouter/moonshotai/kimi-k2`).
- Als je de provider weglaat, herleidt OpenClaw de invoer eerst als een alias, vervolgens als een unieke overeenkomst bij een geconfigureerde provider voor die exacte model-ID, en valt pas daarna met een waarschuwing over veroudering terug op de geconfigureerde standaardprovider. Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde provider-/modelcombinatie in plaats van een verouderde standaardwaarde van een verwijderde provider te tonen.
- `models status` kan `marker(<value>)` in authenticatie-uitvoer tonen voor niet-geheime tijdelijke aanduidingen (bijvoorbeeld `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) in plaats van ze als geheimen te maskeren.

### Standaardmodel/afbeeldingsmodel instellen

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` schrijft `agents.defaults.model.primary`; `set-image` schrijft `agents.defaults.imageModel.primary`. Beide accepteren `provider/model` of een geconfigureerde alias. `set` herstelt ook installaties van Codex-/Copilot-runtimeplugins wanneer het nieuw geselecteerde model er een nodig heeft; `set-image` doet dat niet. Geen van beide opdrachten accepteert `--agent`; ze schrijven altijd de standaardwaarden van de agent.

### Scannen

`models scan` leest de openbare `:free`-catalogus van OpenRouter en rangschikt kandidaten voor gebruik als fallback. De catalogus zelf is openbaar, dus voor scans die alleen metagegevens gebruiken, is geen OpenRouter-sleutel nodig.

Standaard probeert OpenClaw ondersteuning voor tools en afbeeldingen te controleren met live-modelaanroepen. Als er geen OpenRouter-sleutel is geconfigureerd, valt de opdracht terug op uitvoer met alleen metagegevens en legt uit dat `:free`-modellen nog steeds `OPENROUTER_API_KEY` vereisen voor controles en inferentie.

Opties:

- `--no-probe` (alleen metagegevens; geen configuratie-/geheimenopzoeking)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (time-out voor catalogusaanvraag en per controle)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` en `--set-image` vereisen livecontroles; scanresultaten met alleen metagegevens zijn informatief en worden niet op de configuratie toegepast.

## Aliassen

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Aliassen worden per modelvermelding opgeslagen als `agents.defaults.models.<key>.alias`. `add` herleidt `<model-or-alias>` eerst tot een canonieke provider-/modelsleutel. Daardoor verwijst het maken van een alias voor een alias deze opnieuw in plaats van een keten te vormen.

## Fallbacks

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Beheert `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` beheert de parallelle lijst `agents.defaults.imageModel.fallbacks` met dezelfde subopdrachtstructuur.

## Authenticatieprofielen

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` is de interactieve authenticatiehelper. Deze kan een authenticatiestroom van een provider starten (OAuth/API-sleutel) of je begeleiden bij het handmatig plakken van een token, afhankelijk van de provider die je kiest.

`models auth list` geeft opgeslagen authenticatieprofielen voor de geselecteerde agent weer zonder tokens, API-sleutels of geheim OAuth-materiaal te tonen. Gebruik `--provider <id>` om op één provider te filteren, zoals `openai`, en `--json` voor scripts.

`models auth login` voert de authenticatiestroom (OAuth/API-sleutel) van een providerplugin uit. Gebruik `openclaw plugins list` om te zien welke providers zijn geïnstalleerd. `login` accepteert `--profile-id <id>` voor providers die tijdens het aanmelden benoemde profielen ondersteunen (gebruik dit om meerdere aanmeldingen voor dezelfde provider gescheiden te houden), `--method <id>` om een specifieke authenticatiemethode te kiezen, `--device-code` als snelkoppeling voor `--method device-code`, `--set-default` om het aanbevolen standaardmodel van de provider toe te passen en `--force` om eerst bestaande profielen voor die provider te verwijderen (gebruik dit wanneer een OAuth-profiel in de cache vastzit of je van account wilt wisselen).

`models auth login-github-copilot` is een snelkoppeling voor `models auth login --provider github-copilot --method device` (GitHub-apparaatstroom); deze accepteert `--yes` om een bestaand profiel zonder bevestigingsvraag te overschrijven.

Gebruik `openclaw models auth --agent <id> <subcommand>` om authenticatieresultaten naar de opslag van een specifieke geconfigureerde agent te schrijven. De bovenliggende vlag `--agent` wordt gerespecteerd door `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` en `order get`/`set`/`clear`.

Voor OpenAI-modellen gebruikt `--provider openai` standaard aanmelding met een ChatGPT/Codex-account. Gebruik `--method api-key` alleen wanneer je een OpenAI-profiel met API-sleutel wilt toevoegen, meestal als reserve voor de abonnementslimieten van Codex. Voer `openclaw doctor --fix` uit om oudere verouderde authenticatie-/profielstatus met het OpenAI Codex-voorvoegsel te migreren naar `openai`.

Voorbeelden:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Opmerkingen:

- `paste-api-key` accepteert API-sleutels die elders zijn gegenereerd, vraagt om de sleutelwaarde en schrijft deze naar de standaardprofiel-id `<provider>:manual`, tenzij je `--profile-id` doorgeeft. Leid bij automatisering de sleutel via stdin door, bijvoorbeeld `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` en `paste-token` blijven algemene tokenopdrachten voor providers die tokenauthenticatiemethoden aanbieden.
- `setup-token` vereist een interactieve TTY en voert de tokenauthenticatiemethode van de provider uit (standaard de methode `setup-token` van die provider wanneer deze er een aanbiedt).
- `paste-token` vereist `--provider`, vraagt standaard om de tokenwaarde en schrijft deze naar de standaardprofiel-id `<provider>:manual`, tenzij je `--profile-id` doorgeeft. Leid bij automatisering het token via stdin door in plaats van het als argument door te geven, zodat providerreferenties niet in de shellgeschiedenis of proceslijsten verschijnen.
- `paste-token --expires-in <duration>` slaat een absolute vervaltijd voor het token op aan de hand van een relatieve duur, zoals `365d` of `12h`.
- Voor `openai` hebben OpenAI API-sleutels en ChatGPT/OAuth-tokenmateriaal verschillende authenticatiestructuren. Gebruik `paste-api-key` voor OpenAI API-sleutels van `sk-...` en `paste-token` alleen voor tokenauthenticatiemateriaal.
- Anthropic: `setup-token`/`paste-token` zijn ondersteunde OpenClaw-authenticatiepaden voor `anthropic`, maar OpenClaw geeft er de voorkeur aan de Claude CLI (`claude -p`) op de host te hergebruiken wanneer deze beschikbaar is.
- `auth order get/set/clear` beheert voor één provider een overschrijving van de volgorde van authenticatieprofielen per agent, opgeslagen in `auth-state.json` (los van de configuratiesleutel `auth.order.<provider>`). `set` accepteert een of meer profiel-id's in prioriteitsvolgorde; `clear` valt terug op de configuratie-/round-robinvolgorde.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modelselectie](/nl/concepts/model-providers)
- [Model-failover](/nl/concepts/model-failover)
