---
read_when:
    - Je wilt de provider-id `qwen-oauth` configureren
    - Je hebt eerder OAuth-referenties van Qwen Portal gebruikt
    - Je hebt het Qwen Portal-eindpunt of migratiehandleiding nodig
summary: Gebruik de provider-ID van Qwen Portal met OpenClaw
title: Qwen OAuth / portaal
x-i18n:
    generated_at: "2026-06-27T18:14:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` is de provider-id van Qwen Portal. Deze richt zich op het Qwen Portal-endpoint
en houdt oudere Qwen OAuth- / portalconfiguraties aanspreekbaar via een afzonderlijke
provider-id.

Gebruik deze provider wanneer je specifiek een huidige Qwen Portal-token hebt voor
`https://portal.qwen.ai/v1`, of wanneer je een oudere Qwen Portal- /
Qwen CLI-configuratie migreert en die inloggegevens gescheiden wilt houden van de canonieke
Qwen Cloud-provider. Dit is niet de aanbevolen eerste keuze voor nieuwe Qwen-gebruikers.

Voor nieuwe Qwen Cloud-configuraties geef je de voorkeur aan [Qwen](/nl/providers/qwen) met het Standard
ModelStudio-endpoint, tenzij je specifiek een huidige Qwen Portal-token hebt.

## Configuratie

Geef je portal-token op via het onboardingproces:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Of stel in:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Standaardwaarden

- Provider: `qwen-oauth`
- Aliassen: `qwen-portal`, `qwen-cli`
- Basis-URL: `https://portal.qwen.ai/v1`
- Omgevingsvariabele: `QWEN_API_KEY`
- API-stijl: OpenAI-compatibel
- Standaardmodel: `qwen-oauth/qwen3.5-plus`

## Hoe dit verschilt van Qwen

OpenClaw heeft twee provider-id's voor Qwen:

| Provider     | Endpointfamilie                                         | Beste voor                                                                             |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope- en Coding Plan-endpoints | Nieuwe API-sleutelconfiguraties, Standard pay-as-you-go, Coding Plan, multimodale DashScope-functies |
| `qwen-oauth` | Qwen Portal-endpoint op `portal.qwen.ai/v1`              | Bestaande Qwen Portal-tokens en legacy Qwen OAuth- / CLI-configuraties                 |

Beide providers gebruiken OpenAI-compatibele aanvraagvormen, maar het zijn afzonderlijke
authenticatieoppervlakken. Een token die voor `qwen-oauth` is opgeslagen, mag niet worden behandeld als een DashScope-
of ModelStudio-sleutel, en een nieuwe DashScope-sleutel moet in plaats daarvan de canonieke `qwen`-
provider gebruiken.

## Wanneer Qwen OAuth / Portal kiezen

- Je hebt al een werkende Qwen Portal-token.
- Je behoudt een legacy Qwen OAuth- of Qwen CLI-workflow terwijl je overstapt naar
  OpenClaw's providermodel.
- Je moet specifiek compatibiliteit met het Qwen Portal-endpoint testen.

Kies [Qwen](/nl/providers/qwen) voor nieuwe configuratie, bredere endpointkeuzes, Standard
ModelStudio, Coding Plan en de volledige Qwen Plugin-catalogus.

## Modellen

De Qwen Plugin-catalogus vult de standaardwaarde voor Qwen Portal:

- `qwen-oauth/qwen3.5-plus`

Beschikbaarheid hangt af van het huidige Qwen Portal-account en de token. Als je
account in plaats daarvan ModelStudio- / DashScope-API-sleutels gebruikt, configureer dan de canonieke
`qwen`-provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migratie

Legacy Qwen Portal OAuth-profielen zijn mogelijk niet te vernieuwen. Als een portalprofiel
niet meer werkt, authenticeer je opnieuw met een huidige token of stap je over naar de Standard
Qwen-provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard global ModelStudio gebruikt:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Problemen oplossen

- Vernieuwingsfouten met Portal OAuth: legacy Qwen Portal OAuth-profielen zijn mogelijk niet
  te vernieuwen. Voer het onboardingproces opnieuw uit met een huidige token.
- Fouten door verkeerd endpoint: bevestig dat de modelreferentie begint met `qwen-oauth/` wanneer
  je een portal-token gebruikt. Gebruik `qwen/`-referenties alleen voor de canonieke Qwen-provider.
- Verwarring rond `QWEN_API_KEY`: beide Qwen-pagina's noemen deze omgevingsvariabele, maar het onboardingproces
  slaat inloggegevens op onder de geselecteerde provider-id. Geef de voorkeur aan het onboardingproces wanneer je
  zowel `qwen` als `qwen-oauth` beschikbaar houdt op dezelfde machine.

## Gerelateerd

- [Qwen](/nl/providers/qwen)
- [Alibaba Model Studio](/nl/providers/alibaba)
- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
