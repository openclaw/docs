---
read_when:
    - Je wilt LongCat-2.0 gebruiken met OpenClaw
    - Je hebt de LongCat-API-sleutel of modellimieten nodig
summary: LongCat API-configuratie voor LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T09:14:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) biedt een gehoste API voor LongCat-2.0, een
redeneermodel dat is ontwikkeld voor programmeer- en agentische workloads. OpenClaw biedt de
officiële `longcat`-Plugin voor het OpenAI-compatibele eindpunt van LongCat.

| Eigenschap   | Waarde                              |
| ------------ | ----------------------------------- |
| Provider     | `longcat`                           |
| Authenticatie | `LONGCAT_API_KEY`                  |
| API          | OpenAI-compatibele Chat Completions |
| Basis-URL    | `https://api.longcat.chat/openai`   |
| Model        | `longcat/LongCat-2.0`               |
| Context      | 1.048.576 tokens                    |
| Maximale uitvoer | 131.072 tokens                 |
| Invoer       | Tekst                               |

## Plugin installeren

Installeer het officiële pakket en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Een API-sleutel maken">
    Meld u aan bij het [LongCat API-platform](https://longcat.chat/platform/) en
    maak een sleutel aan op de pagina [API Keys](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Het model verifiëren">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Onboarding voegt de gehoste catalogus toe en selecteert `longcat/LongCat-2.0` als
er nog geen primair model is geconfigureerd.

### Niet-interactieve configuratie

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Redeneergedrag

LongCat biedt binaire besturing van het denkproces. OpenClaw koppelt ingeschakelde denkniveaus
aan `thinking: { type: "enabled" }` en `/think off` aan
`thinking: { type: "disabled" }`. LongCat documenteert momenteel geen
`reasoning_effort`, dus OpenClaw verzendt dit niet.

LongCat retourneert redeneringen in `reasoning_content`. OpenClaw behoudt dit veld
bij het opnieuw afspelen van assistentbeurten met toolaanroepen, zodat agentsessies met meerdere beurten
de door de provider verwachte berichtstructuur behouden.

## Prijzen

De ingebouwde catalogus gebruikt de pay-as-you-go-lijstprijzen van LongCat in USD per miljoen
tokens: $0,75 voor niet-gecachete invoer, $0,015 voor gecachete invoer en $2,95 voor uitvoer. LongCat kan
tijdelijke kortingen aanbieden; de [prijzenpagina](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
en uw facturatiegegevens zijn leidend.

## Zelfgehoste LongCat-2.0

De `longcat`-provider is bedoeld voor de gehoste API van LongCat. Voor de open gewichten op
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) stelt u het
model beschikbaar via een OpenAI-compatibele runtime en gebruikt u in plaats daarvan de bestaande
[vLLM](/nl/providers/vllm)- of [SGLang](/nl/providers/sglang)-provider van OpenClaw.

Behoud de exacte model-ID van de runtime in de catalogus van de zelfgehoste provider;
routeer een lokale implementatie niet via `longcat/LongCat-2.0`.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="De sleutel werkt in een shell, maar niet in de Gateway">
    Door een daemon beheerde Gateway-processen nemen niet alle variabelen uit een interactieve shell
    over. Plaats `LONGCAT_API_KEY` in `~/.openclaw/.env`, configureer deze via
    onboarding of gebruik een goedgekeurde geheimverwijzing.
  </Accordion>

  <Accordion title="Aanvragen mislukken met 402 of 429">
    `402` betekent dat het account onvoldoende tokenquotum heeft. `429` betekent dat de API-
    sleutel een snelheidslimiet heeft bereikt. Controleer het [LongCat-verbruik](https://longcat.chat/platform/usage)
    en probeer aanvragen met een snelheidsbeperking opnieuw na de back-offperiode van de provider.
  </Accordion>

  <Accordion title="Het model wordt niet weergegeven">
    Voer `openclaw plugins list` uit en bevestig dat de `longcat`-Plugin is
    ingeschakeld. Voer daarna `openclaw models list --provider longcat` uit.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providerconfiguratie, modelverwijzingen en failovergedrag.
  </Card>
  <Card title="LongCat API-documentatie" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Gehoste API-eindpunten, authenticatie, limieten en voorbeelden.
  </Card>
  <Card title="LongCat-2.0-modelkaart" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Architectuur, implementatierichtlijnen en modeldetails.
  </Card>
  <Card title="Geheimen" href="/nl/gateway/secrets" icon="key">
    Sla providerreferenties op zonder platte tekst in de configuratie op te nemen.
  </Card>
</CardGroup>
