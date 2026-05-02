---
read_when:
    - Modellen-CLI toevoegen of wijzigen (models list/set/scan/aliases/fallbacks)
    - Fallbackgedrag van modellen of selectie-UX wijzigen
    - Modelscanprobes bijwerken (hulpmiddelen/afbeeldingen)
sidebarTitle: Models CLI
summary: 'Modellen-CLI: lijst, instellen, aliassen, fallbacks, scannen, status'
title: Modellen-CLI
x-i18n:
    generated_at: "2026-05-02T11:14:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d362c8cc41801b5e480560c8d34be53e1ada53a23c49af99adb7874e265ddb1f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model-failover" href="/nl/concepts/model-failover">
    Rotatie van auth-profielen, cooldowns en hoe dat samenwerkt met fallbacks.
  </Card>
  <Card title="Modelproviders" href="/nl/concepts/model-providers">
    Snel provideroverzicht en voorbeelden.
  </Card>
  <Card title="Agent-runtimes" href="/nl/concepts/agent-runtimes">
    PI, Codex en andere runtimes voor agent-loops.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults">
    Modelconfiguratiesleutels.
  </Card>
</CardGroup>

Modelrefs kiezen een provider en model. Ze kiezen meestal niet de onderliggende agent-runtime op laag niveau. `openai/gpt-5.5` kan bijvoorbeeld via het normale OpenAI-providerpad draaien of via de Codex app-server-runtime, afhankelijk van `agents.defaults.agentRuntime.id`. In Codex-runtime-modus impliceert de ref `openai/gpt-*` geen facturering via API-sleutels; authenticatie kan afkomstig zijn van een Codex-account of een `openai-codex`-auth-profiel. Zie [Agent-runtimes](/nl/concepts/agent-runtimes).

## Hoe modelselectie werkt

OpenClaw selecteert modellen in deze volgorde:

<Steps>
  <Step title="Primair model">
    `agents.defaults.model.primary` (of `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (op volgorde).
  </Step>
  <Step title="Auth-failover van provider">
    Auth-failover gebeurt binnen een provider voordat naar het volgende model wordt overgeschakeld.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Gerelateerde modeloppervlakken">
    - `agents.defaults.models` is de allowlist/catalogus van modellen die OpenClaw kan gebruiken (plus aliassen).
    - `agents.defaults.imageModel` wordt **alleen gebruikt wanneer** het primaire model geen afbeeldingen kan accepteren.
    - `agents.defaults.pdfModel` wordt gebruikt door de `pdf`-tool. Als dit wordt weggelaten, valt de tool terug op `agents.defaults.imageModel` en daarna op het opgeloste sessie-/standaardmodel.
    - `agents.defaults.imageGenerationModel` wordt gebruikt door de gedeelde mogelijkheid voor afbeeldingsgeneratie. Als dit wordt weggelaten, kan `image_generate` nog steeds een door auth ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde providers voor afbeeldingsgeneratie in volgorde van provider-id. Als je een specifieke provider/model instelt, configureer dan ook de auth/API-sleutel van die provider.
    - `agents.defaults.musicGenerationModel` wordt gebruikt door de gedeelde mogelijkheid voor muziekgeneratie. Als dit wordt weggelaten, kan `music_generate` nog steeds een door auth ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde providers voor muziekgeneratie in volgorde van provider-id. Als je een specifieke provider/model instelt, configureer dan ook de auth/API-sleutel van die provider.
    - `agents.defaults.videoGenerationModel` wordt gebruikt door de gedeelde mogelijkheid voor videogeneratie. Als dit wordt weggelaten, kan `video_generate` nog steeds een door auth ondersteunde providerstandaard afleiden. Het probeert eerst de huidige standaardprovider en daarna de resterende geregistreerde providers voor videogeneratie in volgorde van provider-id. Als je een specifieke provider/model instelt, configureer dan ook de auth/API-sleutel van die provider.
    - Standaarden per agent kunnen `agents.defaults.model` overschrijven via `agents.list[].model` plus bindingen (zie [Multi-agent-routing](/nl/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Selectiebron en fallbackgedrag

Dezelfde `provider/model` kan verschillende dingen betekenen, afhankelijk van waar die vandaan kwam:

- Geconfigureerde standaarden (`agents.defaults.model.primary` en agentspecifieke primaire modellen) zijn het normale startpunt en gebruiken `agents.defaults.model.fallbacks`.
- Automatische fallbackselecties zijn tijdelijke herstelstatus. Ze worden opgeslagen met `modelOverrideSource: "auto"` zodat latere beurten de fallbackketen kunnen blijven gebruiken zonder eerst een bekend slecht primair model te proberen.
- Gebruikerssessieselecties zijn exact. `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` slaan `modelOverrideSource: "user"` op; als die geselecteerde provider/model onbereikbaar is, faalt OpenClaw zichtbaar in plaats van door te vallen naar een ander geconfigureerd model.
- Cron `--model` / payload `model` is een primair model per taak. Het gebruikt nog steeds geconfigureerde fallbacks, tenzij de taak expliciete payload `fallbacks` opgeeft (gebruik `fallbacks: []` voor een strikte Cron-run).
- CLI-standaardmodel- en allowlist-kiezers respecteren `models.mode: "replace"` door expliciete `models.providers.*.models` te tonen in plaats van de volledige ingebouwde catalogus te laden.
- De modelkiezer in de Control UI vraagt de Gateway om de geconfigureerde modelweergave: `agents.defaults.models` wanneer aanwezig, anders expliciete `models.providers.*.models` plus providers met bruikbare auth. De volledige ingebouwde catalogus is gereserveerd voor expliciete browseweergaven zoals `models.list` met `view: "all"` of `openclaw models list --all`.

## Snel modelbeleid

- Stel je primaire model in op het sterkste nieuwste-generatiemodel dat voor jou beschikbaar is.
- Gebruik fallbacks voor kosten-/latentiegevoelige taken en chat met lagere inzet.
- Vermijd voor agents met tools of niet-vertrouwde invoer oudere/zwakkere modelniveaus.

## Onboarding (aanbevolen)

Als je de configuratie niet handmatig wilt bewerken, voer dan onboarding uit:

```bash
openclaw onboard
```

Dit kan model + auth instellen voor gangbare providers, waaronder **OpenAI Code (Codex)-abonnement** (OAuth) en **Anthropic** (API-sleutel of Claude CLI).

## Configuratiesleutels (overzicht)

- `agents.defaults.model.primary` en `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` en `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` en `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` en `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` en `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliassen + providerparameters)
- `models.providers` (aangepaste providers geschreven naar `models.json`)

<Note>
Modelrefs worden genormaliseerd naar kleine letters. Provideraliassen zoals `z.ai/*` normaliseren naar `zai/*`.

Voorbeelden van providerconfiguratie (inclusief OpenCode) staan in [OpenCode](/nl/providers/opencode).
</Note>

### Veilige allowlist-bewerkingen

Gebruik additieve schrijfacties wanneer je `agents.defaults.models` handmatig bijwerkt:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regels voor clobber-bescherming">
    `openclaw config set` beschermt model-/providermaps tegen onbedoeld overschrijven. Een gewone objecttoewijzing aan `agents.defaults.models`, `models.providers` of `models.providers.<id>.models` wordt geweigerd wanneer die bestaande items zou verwijderen. Gebruik `--merge` voor additieve wijzigingen; gebruik `--replace` alleen wanneer de opgegeven waarde de volledige doelwaarde moet worden.

    Interactieve providerinstelling en `openclaw configure --section model` voegen providergebonden selecties ook samen in de bestaande allowlist, zodat het toevoegen van Codex, Ollama of een andere provider geen niet-gerelateerde modelitems verwijdert. Configure behoudt een bestaande `agents.defaults.model.primary` wanneer provider-auth opnieuw wordt toegepast. Expliciete opdrachten voor standaardinstellingen zoals `openclaw models auth login --provider <id> --set-default` en `openclaw models set <model>` vervangen nog steeds `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Model is niet toegestaan" (en waarom antwoorden stoppen)

Als `agents.defaults.models` is ingesteld, wordt dit de **allowlist** voor `/model` en voor sessie-overschrijvingen. Wanneer een gebruiker een model selecteert dat niet in die allowlist staat, retourneert OpenClaw:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Dit gebeurt **voordat** een normaal antwoord wordt gegenereerd, waardoor het bericht kan aanvoelen alsof het "niet heeft gereageerd." De oplossing is een van deze opties:

- Voeg het model toe aan `agents.defaults.models`, of
- Wis de allowlist (verwijder `agents.defaults.models`), of
- Kies een model uit `/model list`.

</Warning>

Sla voor lokale/GGUF-modellen de volledige provider-geprefixte ref op in de allowlist,
bijvoorbeeld `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` of de
exacte provider/model die wordt getoond door `openclaw models list --provider <provider>`.
Kale lokale bestandsnamen of weergavenamen zijn niet genoeg wanneer de allowlist
actief is.

Voorbeeldconfiguratie voor allowlist:

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

Je kunt modellen wisselen voor de huidige sessie zonder opnieuw te starten:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Gedrag van de kiezer">
    - `/model` (en `/model list`) is een compacte, genummerde kiezer (modelfamilie + beschikbare providers).
    - Op Discord openen `/model` en `/models` een interactieve kiezer met provider- en model-dropdowns plus een verzendstap.
    - Op Telegram zijn selecties in de `/models`-kiezer sessiegebonden; ze wijzigen de permanente standaard van de agent in `openclaw.json` niet.
    - `/models add` is verouderd en retourneert nu een afschaffingsbericht in plaats van modellen vanuit chat te registreren.
    - `/model <#>` selecteert uit die kiezer.

  </Accordion>
  <Accordion title="Persistentie en live wisselen">
    - `/model` bewaart de nieuwe sessieselectie onmiddellijk.
    - Als de agent inactief is, gebruikt de volgende run meteen het nieuwe model.
    - Als er al een run actief is, markeert OpenClaw een live wissel als wachtend en herstart pas met het nieuwe model op een schoon retrypunt.
    - Als toolactiviteit of antwoorduitvoer al is gestart, kan de wachtende wissel in de wachtrij blijven tot een latere retrymogelijkheid of de volgende gebruikersbeurt.
    - Een door de gebruiker geselecteerde `/model`-ref is strikt voor die sessie: als de geselecteerde provider/model onbereikbaar is, faalt het antwoord zichtbaar in plaats van stilzwijgend te antwoorden vanuit `agents.defaults.model.fallbacks`. Dit verschilt van geconfigureerde standaarden en primaire modellen voor Cron-taken, die nog steeds fallbackketens kunnen gebruiken.
    - `/model status` is de gedetailleerde weergave (auth-kandidaten en, wanneer geconfigureerd, provider-endpoint `baseUrl` + `api`-modus).

  </Accordion>
  <Accordion title="Ref-parsing">
    - Modelrefs worden geparsed door te splitsen op de **eerste** `/`. Gebruik `provider/model` wanneer je `/model <ref>` typt.
    - Als de model-ID zelf `/` bevat (OpenRouter-stijl), moet je de providerprefix opnemen (voorbeeld: `/model openrouter/moonshotai/kimi-k2`).
    - Als je de provider weglaat, lost OpenClaw de invoer in deze volgorde op:
      1. alias-match
      2. unieke match met geconfigureerde provider voor exact die ongeprefixte model-id
      3. verouderde fallback naar de geconfigureerde standaardprovider — als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw in plaats daarvan terug op de eerste geconfigureerde provider/model om te voorkomen dat een verouderde standaard van een verwijderde provider zichtbaar wordt.
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

Toont standaard geconfigureerde/auth-beschikbare modellen. Nuttige vlaggen:

<ParamField path="--all" type="boolean">
  Volledige catalogus. Bevat gebundelde statische catalogusrijen die eigendom zijn van providers voordat auth is geconfigureerd, zodat weergaven voor alleen ontdekking modellen kunnen tonen die niet beschikbaar zijn totdat je bijpassende providerreferenties toevoegt.
</ParamField>
<ParamField path="--local" type="boolean">
  Alleen lokale providers.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filter op provider-id, bijvoorbeeld `moonshot`. Weergavelabels uit interactieve keuzelijsten worden niet geaccepteerd.
</ParamField>
<ParamField path="--plain" type="boolean">
  Eén model per regel.
</ParamField>
<ParamField path="--json" type="boolean">
  Machineleesbare uitvoer.
</ParamField>

### `models status`

Toont het opgeloste primaire model, fallbacks, afbeeldingsmodel en een auth-overzicht van geconfigureerde providers. Het toont ook de OAuth-vervalstatus voor profielen die in de auth-opslag zijn gevonden (waarschuwt standaard binnen 24 uur). `--plain` drukt alleen het opgeloste primaire model af.

<AccordionGroup>
  <Accordion title="Auth and probe behavior">
    - OAuth-status wordt altijd getoond (en opgenomen in `--json`-uitvoer). Als een geconfigureerde provider geen referenties heeft, drukt `models status` een sectie **Ontbrekende auth** af.
    - JSON bevat `auth.oauth` (waarschuwingsvenster + profielen) en `auth.providers` (effectieve auth per provider, inclusief referenties uit de omgeving). `auth.oauth` is alleen de profielgezondheid van de auth-opslag; providers met alleen omgevingsvariabelen verschijnen daar niet.
    - Gebruik `--check` voor automatisering (afsluitcode `1` bij ontbrekend/verlopen, `2` bij bijna verlopen).
    - Gebruik `--probe` voor live auth-controles; probe-rijen kunnen afkomstig zijn van auth-profielen, omgevingsreferenties of `models.json`.
    - Als expliciete `auth.order.<provider>` een opgeslagen profiel weglaat, rapporteert de probe `excluded_by_auth_order` in plaats van het te proberen. Als auth bestaat maar er geen probeerbaar model voor die provider kan worden opgelost, rapporteert de probe `status: no_model`.

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

`openclaw models scan` inspecteert de **gratis modelcatalogus** van OpenRouter en kan optioneel modellen proben op tool- en afbeeldingsondersteuning.

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
  Stel `agents.defaults.imageModel.primary` in op de eerste afbeeldingsselectie.
</ParamField>

<Note>
De OpenRouter-catalogus `/models` is openbaar, dus scans met alleen metadata kunnen gratis kandidaten tonen zonder sleutel. Proben en inferentie vereisen nog steeds een OpenRouter-API-sleutel (uit auth-profielen of `OPENROUTER_API_KEY`). Als er geen sleutel beschikbaar is, valt `openclaw models scan` terug op uitvoer met alleen metadata en blijft de configuratie ongewijzigd. Gebruik `--no-probe` om de modus met alleen metadata expliciet aan te vragen.
</Note>

Scanresultaten worden gerangschikt op:

1. Afbeeldingsondersteuning
2. Toollatentie
3. Contextgrootte
4. Aantal parameters

Invoer:

- OpenRouter-lijst `/models` (filter `:free`)
- Live probes vereisen een OpenRouter-API-sleutel uit auth-profielen of `OPENROUTER_API_KEY` (zie [Omgevingsvariabelen](/nl/help/environment))
- Optionele filters: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Aanvraag-/probe-instellingen: `--timeout`, `--concurrency`

Wanneer live probes in een TTY worden uitgevoerd, kun je fallbacks interactief selecteren. Geef in niet-interactieve modus `--yes` door om standaardwaarden te accepteren. Resultaten met alleen metadata zijn informatief; `--set-default` en `--set-image` vereisen live probes, zodat OpenClaw geen onbruikbaar OpenRouter-model zonder sleutel configureert.

## Modellenregister (`models.json`)

Aangepaste providers in `models.providers` worden naar `models.json` geschreven onder de agentdirectory (standaard `~/.openclaw/agents/<agentId>/agent/models.json`). Dit bestand wordt standaard samengevoegd, tenzij `models.mode` is ingesteld op `replace`.

<AccordionGroup>
  <Accordion title="Merge mode precedence">
    Voorrang in samenvoegmodus voor overeenkomende provider-ID's:

    - Niet-lege `baseUrl` die al aanwezig is in de agent-`models.json` wint.
    - Niet-lege `apiKey` in de agent-`models.json` wint alleen wanneer die provider niet SecretRef-beheerd is in de huidige configuratie-/auth-profielcontext.
    - SecretRef-beheerde providerwaarden voor `apiKey` worden vernieuwd vanuit bronmarkeringen (`ENV_VAR_NAME` voor env-verwijzingen, `secretref-managed` voor file/exec-verwijzingen) in plaats van opgeloste geheimen persistent op te slaan.
    - SecretRef-beheerde providerheaderwaarden worden vernieuwd vanuit bronmarkeringen (`secretref-env:ENV_VAR_NAME` voor env-verwijzingen, `secretref-managed` voor file/exec-verwijzingen).
    - Lege of ontbrekende agent-`apiKey`/`baseUrl` vallen terug op configuratie `models.providers`.
    - Andere providervelden worden vernieuwd vanuit configuratie en genormaliseerde catalogusgegevens.

  </Accordion>
</AccordionGroup>

<Note>
Persistentie van markeringen is bronauthoritatief: OpenClaw schrijft markeringen uit de actieve bronconfiguratiesnapshot (vóór oplossing), niet uit opgeloste runtime-geheimwaarden. Dit geldt telkens wanneer OpenClaw `models.json` opnieuw genereert, inclusief commandogestuurde paden zoals `openclaw agent`.
</Note>

## Gerelateerd

- [Agentruntimes](/nl/concepts/agent-runtimes) — PI, Codex en andere agent-loop-runtimes
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — modelconfiguratiesleutels
- [Afbeeldingsgeneratie](/nl/tools/image-generation) — configuratie van afbeeldingsmodellen
- [Model-failover](/nl/concepts/model-failover) — fallbackketens
- [Modelproviders](/nl/concepts/model-providers) — providerrouting en auth
- [Muziekgeneratie](/nl/tools/music-generation) — configuratie van muziekmodellen
- [Videogeneratie](/nl/tools/video-generation) — configuratie van videomodellen
