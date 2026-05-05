---
read_when:
    - CLI voor het toevoegen of wijzigen van modellen (models list/set/scan/aliases/fallbacks)
    - Fallbackgedrag van modellen of selectie-UX wijzigen
    - Modelscanprobes bijwerken (hulpmiddelen/afbeeldingen)
sidebarTitle: Models CLI
summary: 'Modellen-CLI: lijst, instellen, aliassen, terugvalopties, scannen, status'
title: Modellen-CLI
x-i18n:
    generated_at: "2026-05-05T01:45:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a1dcdb046b914d35513974d4b69fec03a415118d11860dd1c5107efc754ed4f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model-failover" href="/nl/concepts/model-failover">
    Rotatie van auth-profielen, cooldowns, en hoe dat samenwerkt met fallbacks.
  </Card>
  <Card title="Modelproviders" href="/nl/concepts/model-providers">
    Kort provideroverzicht en voorbeelden.
  </Card>
  <Card title="Agentruntimes" href="/nl/concepts/agent-runtimes">
    PI, Codex en andere agent-loopruntimes.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults">
    Modelconfiguratiesleutels.
  </Card>
</CardGroup>

Modelreferenties kiezen een provider en model. Ze kiezen meestal niet de laag-niveau agentruntime. `openai/gpt-5.5` kan bijvoorbeeld via het normale OpenAI-providerpad of via de Codex app-serverruntime draaien, afhankelijk van `agents.defaults.agentRuntime.id`. In Codex-runtimemodus impliceert de `openai/gpt-*`-referentie geen facturering via API-sleutels; auth kan afkomstig zijn van een Codex-account of `openai-codex`-auth-profiel. Zie [Agentruntimes](/nl/concepts/agent-runtimes).

## Hoe modelselectie werkt

OpenClaw selecteert modellen in deze volgorde:

<Steps>
  <Step title="Primair model">
    `agents.defaults.model.primary` (of `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (op volgorde).
  </Step>
  <Step title="Provider-auth-failover">
    Auth-failover gebeurt binnen een provider voordat naar het volgende model wordt gegaan.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Gerelateerde modeloppervlakken">
    - `agents.defaults.models` is de allowlist/catalogus van modellen die OpenClaw kan gebruiken (plus aliassen).
    - `agents.defaults.imageModel` wordt **alleen gebruikt wanneer** het primaire model geen afbeeldingen kan accepteren.
    - `agents.defaults.pdfModel` wordt gebruikt door de `pdf`-tool. Als dit is weggelaten, valt de tool terug op `agents.defaults.imageModel`, en daarna op het opgeloste sessie-/standaardmodel.
    - `agents.defaults.imageGenerationModel` wordt gebruikt door de gedeelde mogelijkheid voor afbeeldingsgeneratie. Als dit is weggelaten, kan `image_generate` nog steeds een auth-ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider, en daarna de resterende geregistreerde providers voor afbeeldingsgeneratie op volgorde van provider-id. Als je een specifieke provider/model instelt, configureer dan ook de auth/API-sleutel van die provider.
    - `agents.defaults.musicGenerationModel` wordt gebruikt door de gedeelde mogelijkheid voor muziekgeneratie. Als dit is weggelaten, kan `music_generate` nog steeds een auth-ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider, en daarna de resterende geregistreerde providers voor muziekgeneratie op volgorde van provider-id. Als je een specifieke provider/model instelt, configureer dan ook de auth/API-sleutel van die provider.
    - `agents.defaults.videoGenerationModel` wordt gebruikt door de gedeelde mogelijkheid voor videogeneratie. Als dit is weggelaten, kan `video_generate` nog steeds een auth-ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider, en daarna de resterende geregistreerde providers voor videogeneratie op volgorde van provider-id. Als je een specifieke provider/model instelt, configureer dan ook de auth/API-sleutel van die provider.
    - Standaarden per agent kunnen `agents.defaults.model` overschrijven via `agents.list[].model` plus bindingen (zie [Multi-agentroutering](/nl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Selectiebron en fallbackgedrag

Dezelfde `provider/model` kan verschillende dingen betekenen, afhankelijk van waar deze vandaan kwam:

- Geconfigureerde standaarden (`agents.defaults.model.primary` en agentspecifieke primaire modellen) zijn het normale startpunt en gebruiken `agents.defaults.model.fallbacks`.
- Automatische fallbackselecties zijn tijdelijke herstelstatus. Ze worden opgeslagen met `modelOverrideSource: "auto"` zodat latere beurten de fallbackketen kunnen blijven gebruiken zonder eerst een bekende slechte primary te proberen.
- Gebruikerssessieselecties zijn exact. `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` slaan `modelOverrideSource: "user"` op; als die geselecteerde provider/model niet bereikbaar is, faalt OpenClaw zichtbaar in plaats van door te vallen naar een ander geconfigureerd model.
- Cron `--model` / payload `model` is een primaire instelling per taak. Deze gebruikt nog steeds geconfigureerde fallbacks tenzij de taak expliciete payload-`fallbacks` opgeeft (gebruik `fallbacks: []` voor een strikte cron-run).
- CLI-standaardmodel- en allowlistkiezers respecteren `models.mode: "replace"` door expliciete `models.providers.*.models` te tonen in plaats van de volledige ingebouwde catalogus te laden.
- De modelkiezer in de Control UI vraagt de Gateway om de geconfigureerde modelweergave: `agents.defaults.models` wanneer aanwezig, anders expliciete `models.providers.*.models` plus providers met bruikbare auth. De volledige ingebouwde catalogus is gereserveerd voor expliciete bladerweergaven zoals `models.list` met `view: "all"` of `openclaw models list --all`.

## Kort modelbeleid

- Stel je primaire model in op het sterkste beschikbare model van de nieuwste generatie.
- Gebruik fallbacks voor kosten-/latentiegevoelige taken en chat met lagere inzet.
- Vermijd oudere/zwakkere modelniveaus voor agents met tools of niet-vertrouwde invoer.

## Onboarding (aanbevolen)

Als je de configuratie niet handmatig wilt bewerken, voer onboarding uit:

```bash
openclaw onboard
```

Dit kan model + auth instellen voor veelgebruikte providers, waaronder **OpenAI Code (Codex) subscription** (OAuth) en **Anthropic** (API-sleutel of Claude CLI).

## Configuratiesleutels (overzicht)

- `agents.defaults.model.primary` en `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` en `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` en `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` en `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` en `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliassen + providerparameters)
- `models.providers` (aangepaste providers geschreven naar `models.json`)

<Note>
Modelreferenties worden genormaliseerd naar kleine letters. Provideraliassen zoals `z.ai/*` normaliseren naar `zai/*`.

Providerconfiguratievoorbeelden (inclusief OpenCode) staan in [OpenCode](/nl/providers/opencode).
</Note>

### Veilige allowlist-bewerkingen

Gebruik additieve schrijfacties wanneer je `agents.defaults.models` handmatig bijwerkt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regels voor clobberbescherming">
    `openclaw config set` beschermt model-/providermaps tegen onbedoeld overschrijven. Een gewone objecttoewijzing aan `agents.defaults.models`, `models.providers` of `models.providers.<id>.models` wordt geweigerd wanneer deze bestaande vermeldingen zou verwijderen. Gebruik `--merge` voor additieve wijzigingen; gebruik `--replace` alleen wanneer de opgegeven waarde de volledige doelwaarde moet worden.

    Interactieve providerinstelling en `openclaw configure --section model` voegen providergebonden selecties ook samen in de bestaande allowlist, zodat het toevoegen van Codex, Ollama of een andere provider geen niet-gerelateerde modelvermeldingen verwijdert. Configure behoudt een bestaande `agents.defaults.model.primary` wanneer provider-auth opnieuw wordt toegepast. Expliciete opdrachten voor standaardinstellingen, zoals `openclaw models auth login --provider <id> --set-default` en `openclaw models set <model>`, vervangen nog steeds `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model is niet toegestaan" (en waarom antwoorden stoppen)

Als `agents.defaults.models` is ingesteld, wordt dit de **allowlist** voor `/model` en voor sessie-overschrijvingen. Wanneer een gebruiker een model selecteert dat niet in die allowlist staat, retourneert OpenClaw:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Dit gebeurt **voordat** een normaal antwoord wordt gegenereerd, dus het bericht kan aanvoelen alsof er "niet is gereageerd". De oplossing is een van de volgende:

- Voeg het model toe aan `agents.defaults.models`, of
- Wis de allowlist (verwijder `agents.defaults.models`), of
- Kies een model uit `/model list`.

</Warning>

Wanneer de geweigerde opdracht een runtime-overschrijving bevatte, zoals `/model openai/gpt-5.5 --runtime codex`, repareer dan eerst de allowlist en probeer daarna dezelfde opdracht `/model ... --runtime ...` opnieuw. Voor native Codex-uitvoering is het geselecteerde model nog steeds `openai/gpt-5.5`; de `codex`-runtime selecteert de harness en gebruikt Codex-auth afzonderlijk.

Sla voor lokale/GGUF-modellen de volledige providergeprefixte referentie op in de allowlist,
bijvoorbeeld `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, of de
exacte provider/model die wordt getoond door `openclaw models list --provider <provider>`.
Losse lokale bestandsnamen of weergavenamen zijn niet genoeg wanneer de allowlist
actief is.

Voorbeeld van allowlistconfiguratie:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Modellen wisselen in chat (`/model`)

Je kunt modellen voor de huidige sessie wisselen zonder opnieuw te starten:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Kiezergedrag">
    - `/model` (en `/model list`) is een compacte, genummerde kiezer (modelfamilie + beschikbare providers).
    - Op Discord openen `/model` en `/models` een interactieve kiezer met provider- en modelkeuzelijsten plus een verzendstap.
    - Op Telegram zijn `/models`-kiezerselecties sessiegebonden; ze wijzigen de permanente standaard van de agent in `openclaw.json` niet.
    - `/models add` is verouderd en retourneert nu een verouderingsbericht in plaats van modellen vanuit chat te registreren.
    - `/model <#>` selecteert uit die kiezer.

  </Accordion>
  <Accordion title="Persistentie en live wisselen">
    - `/model` slaat de nieuwe sessieselectie onmiddellijk op.
    - Als de agent inactief is, gebruikt de volgende run meteen het nieuwe model.
    - Als er al een run actief is, markeert OpenClaw een livewisseling als in behandeling en herstart het pas met het nieuwe model op een schoon retrypunt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de in behandeling zijnde wisseling in de wachtrij blijven tot een latere retrymogelijkheid of de volgende gebruikersbeurt.
    - Een door de gebruiker geselecteerde `/model`-referentie is strikt voor die sessie: als de geselecteerde provider/model niet bereikbaar is, faalt het antwoord zichtbaar in plaats van stilzwijgend te antwoorden vanuit `agents.defaults.model.fallbacks`. Dit verschilt van geconfigureerde standaarden en primaire modellen voor cron-taken, die nog steeds fallbackketens kunnen gebruiken.
    - `/model status` is de gedetailleerde weergave (auth-kandidaten en, wanneer geconfigureerd, providerendpoint `baseUrl` + `api`-modus).

  </Accordion>
  <Accordion title="Referentieparsering">
    - Modelreferenties worden geparseerd door te splitsen op de **eerste** `/`. Gebruik `provider/model` wanneer je `/model <ref>` typt.
    - Als de model-ID zelf `/` bevat (OpenRouter-stijl), moet je het providerprefix opnemen (voorbeeld: `/model openrouter/moonshotai/kimi-k2`).
    - Als je de provider weglaat, lost OpenClaw de invoer in deze volgorde op:
      1. aliasmatch
      2. unieke geconfigureerde-providermatch voor die exacte model-ID zonder prefix
      3. verouderde fallback naar de geconfigureerde standaardprovider — als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw in plaats daarvan terug op de eerste geconfigureerde provider/model om te voorkomen dat een verouderde verwijderde-providerstandaard zichtbaar wordt.
  </Accordion>
</AccordionGroup>

Volledig opdrachtgedrag/configuratie: [Slash-opdrachten](/nl/tools/slash-commands).

## CLI-opdrachten

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (zonder subopdracht) is een snelkoppeling voor `models status`.

### `models list`

Toont standaard geconfigureerde/auth-beschikbare modellen. Handige vlaggen:

<ParamField path="--all" type="boolean">
  Volledige catalogus. Bevat gebundelde statische catalogusrijen die eigendom zijn van providers voordat auth is geconfigureerd, zodat discovery-only-weergaven modellen kunnen tonen die niet beschikbaar zijn totdat je bijpassende providerreferenties toevoegt.
</ParamField>
<ParamField path="--local" type="boolean">
  Alleen lokale providers.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filter op provider-id, bijvoorbeeld `moonshot`. Weergavelabels uit interactieve pickers worden niet geaccepteerd.
</ParamField>
<ParamField path="--plain" type="boolean">
  Eén model per regel.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare uitvoer.
</ParamField>

### `models status`

Toont het opgeloste primaire model, fallbacks, beeldmodel en een auth-overzicht van geconfigureerde providers. Het toont ook de OAuth-vervalstatus voor profielen die in de auth-store zijn gevonden (waarschuwt standaard binnen 24 uur). `--plain` drukt alleen het opgeloste primaire model af.

<AccordionGroup>
  <Accordion title="Auth- en probegedrag">
    - OAuth-status wordt altijd getoond (en opgenomen in `--json`-uitvoer). Als een geconfigureerde provider geen referenties heeft, drukt `models status` een sectie **Ontbrekende auth** af.
    - JSON bevat `auth.oauth` (waarschuwingsvenster + profielen) en `auth.providers` (effectieve auth per provider, inclusief door env ondersteunde referenties). `auth.oauth` is alleen de gezondheid van auth-storeprofielen; providers met alleen env verschijnen daar niet.
    - Gebruik `--check` voor automatisering (exit `1` wanneer ontbrekend/verlopen, `2` wanneer bijna verlopen).
    - Gebruik `--probe` voor live auth-controles; proberijen kunnen afkomstig zijn van auth-profielen, env-referenties of `models.json`.
    - Als expliciete `auth.order.<provider>` een opgeslagen profiel weglaat, rapporteert probe `excluded_by_auth_order` in plaats van het te proberen. Als auth bestaat maar er geen probeerbaar model voor die provider kan worden opgelost, rapporteert probe `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Auth-keuze is afhankelijk van provider/account. Voor altijd actieve Gateway-hosts zijn API-sleutels meestal het meest voorspelbaar; hergebruik van Claude CLI en bestaande Anthropic OAuth-/tokenprofielen worden ook ondersteund.
</Note>

Voorbeeld (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scannen (gratis OpenRouter-modellen)

`openclaw models scan` inspecteert OpenRouter's **gratis modellencatalogus** en kan optioneel modellen proben op tool- en beeldondersteuning.

<ParamField path="--no-probe" type="boolean">
  Sla live probes over (alleen metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Minimale parametergrootte (miljarden).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Sla oudere modellen over.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filter op providerprefix.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Grootte van fallbacklijst.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Stel `agents.defaults.model.primary` in op de eerste selectie.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Stel `agents.defaults.imageModel.primary` in op de eerste beeldselectie.
</ParamField>

<Note>
De OpenRouter `/models`-catalogus is openbaar, dus scans met alleen metadata kunnen gratis kandidaten zonder sleutel weergeven. Probing en inferentie vereisen nog steeds een OpenRouter API-sleutel (uit auth-profielen of `OPENROUTER_API_KEY`). Als er geen sleutel beschikbaar is, valt `openclaw models scan` terug op uitvoer met alleen metadata en blijft de configuratie ongewijzigd. Gebruik `--no-probe` om expliciet de modus met alleen metadata aan te vragen.
</Note>

Scanresultaten worden gerangschikt op:

1. Beeldondersteuning
2. Toollatentie
3. Contextgrootte
4. Aantal parameters

Invoer:

- OpenRouter `/models`-lijst (filter `:free`)
- Live probes vereisen een OpenRouter API-sleutel uit auth-profielen of `OPENROUTER_API_KEY` (zie [Omgevingsvariabelen](/nl/help/environment))
- Optionele filters: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Aanvraag-/probebesturing: `--timeout`, `--concurrency`

Wanneer live probes in een TTY worden uitgevoerd, kun je fallbacks interactief selecteren. Geef in niet-interactieve modus `--yes` mee om de standaardwaarden te accepteren. Resultaten met alleen metadata zijn informatief; `--set-default` en `--set-image` vereisen live probes zodat OpenClaw geen onbruikbaar OpenRouter-model zonder sleutel configureert.

## Modellenregister (`models.json`)

Aangepaste providers in `models.providers` worden weggeschreven naar `models.json` onder de agentmap (standaard `~/.openclaw/agents/<agentId>/agent/models.json`). Dit bestand wordt standaard samengevoegd, tenzij `models.mode` is ingesteld op `replace`.

<AccordionGroup>
  <Accordion title="Voorrang in samenvoegmodus">
    Voorrang in samenvoegmodus voor overeenkomende provider-ID's:

    - Niet-lege `baseUrl` die al aanwezig is in de agent-`models.json` wint.
    - Niet-lege `apiKey` in de agent-`models.json` wint alleen wanneer die provider niet door SecretRef wordt beheerd in de huidige config-/auth-profielcontext.
    - Door SecretRef beheerde provider-`apiKey`-waarden worden vernieuwd vanuit bronmarkeringen (`ENV_VAR_NAME` voor env-refs, `secretref-managed` voor file/exec-refs) in plaats van opgeloste geheimen blijvend op te slaan.
    - Door SecretRef beheerde providerheaderwaarden worden vernieuwd vanuit bronmarkeringen (`secretref-env:ENV_VAR_NAME` voor env-refs, `secretref-managed` voor file/exec-refs).
    - Lege of ontbrekende agent-`apiKey`/`baseUrl` vallen terug op config `models.providers`.
    - Andere providervelden worden vernieuwd vanuit config en genormaliseerde catalogusgegevens.

  </Accordion>
</AccordionGroup>

<Note>
Het bewaren van markeringen is bron-autoritatief: OpenClaw schrijft markeringen uit de actieve bronconfiguratiesnapshot (vóór oplossing), niet uit opgeloste runtimegeheimwaarden. Dit is van toepassing telkens wanneer OpenClaw `models.json` opnieuw genereert, inclusief door opdrachten aangestuurde paden zoals `openclaw agent`.
</Note>

## Gerelateerd

- [Agentruntimes](/nl/concepts/agent-runtimes) — PI, Codex en andere agentloopruntimes
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — modelconfiguratiesleutels
- [Beeldgeneratie](/nl/tools/image-generation) — beeldmodelconfiguratie
- [Modelfailover](/nl/concepts/model-failover) — fallbackketens
- [Modelproviders](/nl/concepts/model-providers) — providerrouting en auth
- [Muziekgeneratie](/nl/tools/music-generation) — muziekmodelconfiguratie
- [Videogeneratie](/nl/tools/video-generation) — videomodelconfiguratie
