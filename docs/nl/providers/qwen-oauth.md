---
read_when:
    - U wilt de provider-id `qwen-oauth` configureren
    - U gebruikte eerder Qwen Portal OAuth-referenties
    - Je hebt het Qwen Portal-eindpunt of migratierichtlijnen nodig
summary: Gebruik de provider-id van Qwen Portal met OpenClaw
title: Qwen OAuth / Portal
x-i18n:
    generated_at: "2026-07-12T09:20:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` is de provider-id van Qwen Portal, geregistreerd door de Qwen-plugin
(`@openclaw/qwen-provider`). Deze is gericht op het Qwen Portal-eindpunt op
`https://portal.qwen.ai/v1` en houdt oudere Qwen OAuth-/portalconfiguraties
toegankelijk via een afzonderlijke provider-id, los van de canonieke `qwen`-
provider.

Kies `qwen-oauth` als u al een werkend Qwen Portal-token hebt, een verouderde
Qwen OAuth- of Qwen CLI-workflow migreert, of specifiek het Qwen Portal-eindpunt
moet testen. Geef voor nieuwe configuraties de voorkeur aan
[Qwen](/nl/providers/qwen) met het Standard ModelStudio-eindpunt: dit ondersteunt
nieuwe configuraties met API-sleutels, meer eindpuntopties, Standard-betaling
naar gebruik, Coding Plan en de volledige catalogus van de Qwen-plugin.

## Configuratie

Installeer de Qwen-plugin als u dat nog niet hebt gedaan:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Geef uw portaltoken op via de onboarding:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Niet-interactieve uitvoeringen lezen het token uit `--qwen-oauth-token <token>`,
of stel het volgende in:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

De onboarding slaat het token op in een `qwen-oauth`-authenticatieprofiel, vult
de portalmodelcatalogus en stelt `qwen-oauth/qwen3.5-plus` in als standaardmodel
wanneer er geen model is geconfigureerd.

## Standaardwaarden

- Provider: `qwen-oauth`
- Aliassen: `qwen-portal`, `qwen-cli`
- Basis-URL: `https://portal.qwen.ai/v1`
- Omgevingsvariabele: `QWEN_API_KEY`
- API-stijl: OpenAI-compatibel
- Standaardmodel: `qwen-oauth/qwen3.5-plus`

## Verschillen met Qwen

OpenClaw heeft twee op Qwen gerichte provider-id's:

| Provider     | Eindpuntfamilie                                           | Meest geschikt voor                                                                       |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud-/Alibaba DashScope- en Coding Plan-eindpunten  | Nieuwe configuraties met API-sleutels, Standard-betaling naar gebruik, Coding Plan en multimodale DashScope-functies |
| `qwen-oauth` | Qwen Portal-eindpunt op `portal.qwen.ai/v1`               | Bestaande Qwen Portal-tokens en verouderde Qwen OAuth-/CLI-configuraties                   |

Beide providers gebruiken OpenAI-compatibele aanvraagstructuren, maar het zijn
afzonderlijke authenticatieoppervlakken. Een voor `qwen-oauth` opgeslagen token
mag niet worden behandeld als een DashScope- of ModelStudio-sleutel, en voor een
nieuwe DashScope-sleutel moet in plaats daarvan de canonieke `qwen`-provider
worden gebruikt.

## Modellen

De Qwen-plugin vult deze statische catalogus voor het Qwen Portal-eindpunt. Alle
vermeldingen gebruiken een maximale uitvoer van 65.536 tokens; de beschikbaarheid
is afhankelijk van het huidige Qwen Portal-account en -token.

| Modelreferentie                    | Invoer         | Context   | Opmerkingen    |
| ---------------------------------- | -------------- | --------- | -------------- |
| `qwen-oauth/qwen3.5-plus`          | tekst, afbeelding | 1.000.000 | Standaardmodel |
| `qwen-oauth/qwen3.6-plus`          | tekst, afbeelding | 1.000.000 |                |
| `qwen-oauth/qwen3-max-2026-01-23`  | tekst          | 262.144   |                |
| `qwen-oauth/qwen3-coder-next`      | tekst          | 262.144   |                |
| `qwen-oauth/qwen3-coder-plus`      | tekst          | 1.000.000 |                |
| `qwen-oauth/MiniMax-M2.5`          | tekst          | 1.000.000 | Redeneren      |
| `qwen-oauth/glm-5`                 | tekst          | 202.752   |                |
| `qwen-oauth/glm-4.7`               | tekst          | 202.752   |                |
| `qwen-oauth/kimi-k2.5`             | tekst, afbeelding | 262.144 |                |

Als uw account in plaats daarvan ModelStudio-/DashScope-API-sleutels gebruikt,
configureert u de canonieke `qwen`-provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migratie

Verouderde OAuth-profielen van Qwen Portal kunnen niet worden vernieuwd;
`openclaw doctor` markeert ze. Als een portalprofiel niet meer werkt, voert u de
onboarding opnieuw uit met een actueel token of schakelt u over naar de Standard
Qwen-provider:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

De wereldwijde Standard ModelStudio gebruikt:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Probleemoplossing

- Mislukte vernieuwing van Portal OAuth: verouderde OAuth-profielen van Qwen
  Portal kunnen niet worden vernieuwd. Voer de onboarding opnieuw uit met een
  actueel token.
- Fouten door een verkeerd eindpunt: controleer of de modelreferentie begint met
  `qwen-oauth/` wanneer u een portaltoken gebruikt. Gebruik `qwen/`-referenties
  alleen voor de canonieke Qwen-provider.
- Verwarring over `QWEN_API_KEY`: beide Qwen-pagina's vermelden deze
  omgevingsvariabele, maar de onboarding slaat referenties op onder de
  geselecteerde provider-id. Geef de voorkeur aan onboarding wanneer u zowel
  `qwen` als `qwen-oauth` op dezelfde machine beschikbaar houdt.

## Gerelateerd

- [Qwen](/nl/providers/qwen)
- [Alibaba Model Studio](/nl/providers/alibaba)
- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
