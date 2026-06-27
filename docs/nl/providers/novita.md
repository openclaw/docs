---
read_when:
    - Je wilt OpenClaw uitvoeren met NovitaAI-modellen
    - Je hebt de Novita-provider-ID, sleutel of endpoint nodig
summary: Gebruik de OpenAI-compatibele API van NovitaAI met OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T18:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI is een gehoste AI-infrastructuurprovider met een OpenAI-compatibele model-API. In OpenClaw is het een gebundelde modelprovider, dus de provider-id is
`novita`, referenties lopen via de normale modelauthenticatiestroom, en modelverwijzingen zien eruit
als `novita/deepseek/deepseek-v3-0324`.

Gebruik Novita wanneer je gehoste toegang wilt tot open-weight en externe modelroutes zonder je eigen inferentieserver te draaien. De gebundelde catalogus richt zich op chatmodellen die praktisch zijn voor agentbeurten, waaronder routes voor DeepSeek, Moonshot,
MiniMax, GLM en Qwen die door Novita worden aangeboden.

Deze provider gebruikt Novita's OpenAI-compatibele endpoint. OpenClaw handelt
providerregistratie, authenticatie, aliassen, normalisatie van modelverwijzingen en selectie van de basis-URL af; Novita beheert live modelbeschikbaarheid, accountmachtigingen,
prijzen en snelheidslimieten.

## Instellen

Maak een API-sleutel aan op [novita.ai/settings/key-management](https://novita.ai/settings/key-management) en voer daarna uit:

```bash
openclaw onboard --auth-choice novita-api-key
```

Of stel in:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Standaardwaarden

- Provider: `novita`
- Aliassen: `novita-ai`, `novitaai`
- Basis-URL: `https://api.novita.ai/openai/v1`
- Omgevingsvariabele: `NOVITA_API_KEY`
- Standaardmodel: `novita/deepseek/deepseek-v3-0324`

## Wanneer je Novita kiest

- Je wilt gehoste toegang tot open-weight modellen met een OpenAI-compatibele API.
- Je wilt routes voor DeepSeek, Kimi, MiniMax, GLM of de Qwen-familie via één
  provideraccount.
- Je wilt nog een gehost fallback-pad naast OpenRouter, GMI, DeepInfra of
  directe leverancier-API's.
- Je geeft de voorkeur aan modelhosting aan de providerzijde boven het onderhouden van vLLM-, SGLang-, LM
  Studio- of Ollama-infrastructuur.

Kies een directe leverancierprovider wanneer je leverancierseigen aanvraagparameters
of supportcontracten nodig hebt. Kies een lokale provider wanneer het model op je
eigen hardware of achter je eigen netwerkgrens moet draaien.

## Modellen

De gebundelde catalogus vult veelgebruikte beschikbare NovitaAI-route-id's vooraf in, waaronder:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

De catalogus is een startpunt voor modelselectie in OpenClaw. Je account,
regio of Novita's huidige catalogus kan routes toevoegen, verwijderen of beperken. Controleer
de provider via de CLI voordat je een langlevende standaard instelt:

```bash
openclaw models list --provider novita
```

## Probleemoplossing

- `401` of `403`: controleer de sleutel op Novita's pagina voor sleutelbeheer en voer
  `openclaw onboard --auth-choice novita-api-key` opnieuw uit als het opgeslagen profiel
  verouderd is.
- Fouten voor onbekende modellen: gebruik de exacte `novita/<route-id>` die wordt geretourneerd door
  `openclaw models list --provider novita`.
- Trage of mislukte routes: probeer een andere Novita-modelroute of stel Novita in als
  fallbackprovider voor workloads die providerspecifieke variatie kunnen verdragen.

## Gerelateerd

- [Modelproviders](/nl/concepts/model-providers)
- [Alle providers](/nl/providers/index)
