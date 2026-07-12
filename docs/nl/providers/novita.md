---
read_when:
    - Je wilt OpenClaw uitvoeren met NovitaAI-modellen
    - Je hebt de provider-id, sleutel of het eindpunt van Novita nodig
summary: Gebruik de OpenAI-compatibele API van NovitaAI met OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T09:14:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI is een gehoste aanbieder van AI-infrastructuur met een OpenAI-compatibele API.
Deze wordt geleverd als een gebundelde OpenClaw-aanbieder (geen afzonderlijke Plugin-installatie), zodat
referenties via de normale modelauthenticatiestroom verlopen en modelverwijzingen eruitzien als
`novita/deepseek/deepseek-v3-0324`.

## Configuratie

Maak een API-sleutel aan op [novita.ai/settings/key-management](https://novita.ai/settings/key-management) en voer vervolgens het volgende uit:

```bash
openclaw onboard --auth-choice novita-api-key
```

Of stel het volgende in:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Standaardwaarden

| Instelling           | Waarde                             |
| -------------------- | ---------------------------------- |
| Aanbieder-id         | `novita`                           |
| Aliassen             | `novita-ai`, `novitaai`            |
| Basis-URL            | `https://api.novita.ai/openai/v1`  |
| Omgevingsvariabele   | `NOVITA_API_KEY`                   |
| Standaardmodel       | `novita/deepseek/deepseek-v3-0324` |

## Gebundelde modelcatalogus

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Dit is een uitgangspunt, geen actuele catalogus. Uw account, regio of
het huidige aanbod van Novita kan routes toevoegen, verwijderen of beperken. Controleer dit voordat u
een langdurige standaardwaarde instelt:

```bash
openclaw models list --provider novita
```

## Wanneer kiest u voor Novita?

- Gehoste toegang tot modellen met open gewichten via een OpenAI-compatibele API.
- Routes voor de DeepSeek-, Kimi-, MiniMax-, GLM- of Qwen-modelfamilie via één
  aanbiedersaccount.
- Een ander gehost terugvalpad naast DeepInfra, GMI, OpenRouter of rechtstreekse
  API's van leveranciers.
- Modelhosting door de aanbieder in plaats van zelf infrastructuur voor LM Studio, Ollama,
  SGLang of vLLM te onderhouden.

Kies een rechtstreekse leverancier als u leverancierspecifieke aanvraagparameters
of ondersteuningscontracten nodig hebt. Kies een lokale aanbieder als het model
op uw eigen hardware of binnen uw eigen netwerkgrens moet worden uitgevoerd.

## Probleemoplossing

- `401`/`403`: controleer de sleutel op de sleutelbeheerpagina van Novita en voer
  `openclaw onboard --auth-choice novita-api-key` opnieuw uit als het opgeslagen profiel
  verouderd is.
- Fouten over een onbekend model: gebruik exact de `novita/<route-id>` die wordt geretourneerd door
  `openclaw models list --provider novita`.
- Trage of mislukte routes: probeer een andere Novita-modelroute of stel Novita in als
  terugvalaanbieder voor werklasten die aanbiederspecifieke
  variatie kunnen verdragen.

## Gerelateerd

- [Modelaanbieders](/nl/concepts/model-providers)
- [Aanbiedersoverzicht](/nl/providers/index)
