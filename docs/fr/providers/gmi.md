---
read_when:
    - Vous souhaitez exécuter OpenClaw avec les modèles GMI Cloud
    - Vous avez besoin de l’identifiant, de la clé ou du point de terminaison du fournisseur GMI
summary: Utiliser l’API compatible OpenAI de GMI Cloud avec OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:04:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud est une plateforme d’inférence hébergée pour les modèles frontier et à poids ouverts
derrière une API compatible avec OpenAI. Dans OpenClaw, c’est un Plugin fournisseur externe
officiel, ce qui signifie que vous l’installez une fois, le sélectionnez avec l’id de fournisseur `gmi`,
stockez les identifiants via l’authentification de modèle normale, et utilisez des références de modèle comme
`gmi/google/gemini-3.1-flash-lite`.

Utilisez GMI lorsque vous voulez une seule clé d’API pour plusieurs familles de modèles hébergés, notamment
les routes Google, Anthropic, OpenAI, DeepSeek, Moonshot et Z.AI exposées par le
catalogue de GMI. Il est utile comme fournisseur secondaire pour le basculement de modèle, pour comparer
des routes hébergées entre fournisseurs, ou lorsque GMI propose un modèle avant votre
fournisseur principal.

Ce fournisseur utilise une sémantique de chat compatible avec OpenAI. OpenClaw possède l’id de fournisseur,
le profil d’authentification, les alias, la graine de catalogue de modèles et l’URL de base ; GMI possède la disponibilité
des modèles en direct, la facturation, les limites de débit et toute politique de routage côté fournisseur.

## Configuration

Installez le Plugin, redémarrez le Gateway, puis créez une clé d’API dans GMI Cloud :

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Exécutez ensuite :

```bash
openclaw onboard --auth-choice gmi-api-key
```

Ou définissez :

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Valeurs par défaut

- Fournisseur : `gmi`
- Alias : `gmi-cloud`, `gmicloud`
- URL de base : `https://api.gmi-serving.com/v1`
- Variable d’environnement : `GMI_API_KEY`
- Modèle par défaut : `gmi/google/gemini-3.1-flash-lite`

## Quand choisir GMI

- Vous voulez un point de terminaison hébergé compatible avec OpenAI plutôt qu’un serveur de modèles local.
- Vous voulez essayer plusieurs familles de modèles commerciaux et à poids ouverts via un seul
  compte fournisseur.
- Vous voulez un fournisseur de secours avec un routage amont différent d’OpenRouter,
  DeepInfra, Together ou des API directes des fournisseurs.
- Vous avez besoin d’ids de modèles, de tarifs ou de contrôles de compte propres à GMI.

Choisissez plutôt le fournisseur direct du vendeur lorsque vous avez besoin de fonctionnalités natives du vendeur
que GMI n’expose pas via sa route compatible avec OpenAI. Choisissez un fournisseur local
tel qu’Ollama, LM Studio, vLLM ou SGLang lorsque la localité des données ou le contrôle local
du GPU compte plus que la commodité de l’hébergement.

## Modèles

Le catalogue du Plugin amorce les ids de routes GMI Cloud couramment disponibles, notamment :

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

Le catalogue est une graine, pas une promesse que chaque compte peut appeler chaque modèle à
tout moment. Utilisez la commande de liste des modèles d’OpenClaw pour voir ce que le
fournisseur configuré signale dans votre environnement :

```bash
openclaw models list --provider gmi
```

## Dépannage

- `401` ou `403` : vérifiez que `GMI_API_KEY` est défini pour le processus exécutant
  OpenClaw, ou relancez l’onboarding pour stocker la clé dans le profil d’authentification du fournisseur.
- Erreurs de modèle inconnu : confirmez que le modèle existe dans votre compte GMI et utilisez la
  référence complète `gmi/<route-id>` affichée par `openclaw models list --provider gmi`.
- Erreurs intermittentes du fournisseur : essayez une autre route GMI ou configurez GMI comme
  fournisseur de secours plutôt que comme seul fournisseur de modèle principal.

## Connexe

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
