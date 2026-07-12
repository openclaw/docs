---
read_when:
    - Vous souhaitez exécuter OpenClaw avec les modèles GMI Cloud
    - Vous avez besoin de l’identifiant, de la clé ou du point de terminaison du fournisseur GMI
summary: Utilisez l’API compatible avec OpenAI de GMI Cloud avec OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T15:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud est une plateforme d’inférence hébergée pour les modèles de pointe et à poids ouverts,
accessible via une API compatible avec OpenAI. Dans OpenClaw, il s’agit d’un plugin
de fournisseur externe officiel : installez-le une fois, stockez les identifiants via
l’authentification de modèle habituelle et utilisez des références de modèle telles que
`gmi/google/gemini-3.1-flash-lite`.

Utilisez GMI lorsque vous souhaitez employer une seule clé d’API pour plusieurs familles de modèles
hébergés, notamment les routes Anthropic, DeepSeek, Google, Moonshot, OpenAI et Z.AI
exposées par le catalogue de GMI. Il peut servir de fournisseur secondaire pour le repli
de modèle, pour comparer des routes hébergées entre différents fournisseurs, ou lorsque
GMI propose un modèle avant votre fournisseur principal. OpenClaw gère l’identifiant
du fournisseur, le profil d’authentification, les alias, l’amorçage du catalogue de modèles
et l’URL de base ; GMI gère la disponibilité effective des modèles, la facturation,
les limites de débit et toute politique de routage côté fournisseur.

| Propriété              | Valeur                                   |
| ---------------------- | ---------------------------------------- |
| Identifiant fournisseur | `gmi` (alias : `gmi-cloud`, `gmicloud`) |
| Paquet                 | `@openclaw/gmi-provider`                 |
| Variable d’environnement d’authentification | `GMI_API_KEY`            |
| API                    | Compatible avec OpenAI (`openai-completions`) |
| URL de base            | `https://api.gmi-serving.com/v1`         |
| Modèle par défaut      | `gmi/google/gemini-3.1-flash-lite`       |

## Configuration

Installez le plugin, redémarrez le Gateway, puis créez une clé d’API dans GMI Cloud
(`https://www.gmicloud.ai/`) :

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Exécutez ensuite :

```bash
openclaw onboard --auth-choice gmi-api-key
```

Les configurations non interactives peuvent transmettre `--gmi-api-key <key>`, ou définir :

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Quand choisir GMI

- Vous souhaitez un point de terminaison hébergé compatible avec OpenAI plutôt qu’un serveur de modèles local.
- Vous souhaitez essayer plusieurs familles de modèles commerciaux et à poids ouverts au moyen d’un seul
  compte fournisseur.
- Vous souhaitez un fournisseur de repli dont le routage en amont diffère de celui de DeepInfra,
  OpenRouter, Together ou des API directes des fournisseurs.
- Vous avez besoin d’identifiants de modèles, de tarifs ou de contrôles de compte propres à GMI.

Choisissez plutôt le fournisseur direct du fabricant lorsque vous avez besoin de fonctionnalités natives
que GMI n’expose pas par l’intermédiaire de sa route compatible avec OpenAI. Choisissez un fournisseur
local tel que LM Studio, Ollama, SGLang ou vLLM lorsque la localisation des données ou le contrôle
du GPU local est plus important que la commodité d’un service hébergé.

## Modèles

Le catalogue du plugin amorce les identifiants de routes GMI Cloud couramment disponibles :

| Référence du modèle                | Entrée       | Contexte  | Sortie maximale |
| ---------------------------------- | ------------ | --------- | --------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | texte + image | 200,000   | 64,000          |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | texte        | 163,840   | 65,536          |
| `gmi/google/gemini-3.1-flash-lite` | texte + image | 1,048,576 | 65,536          |
| `gmi/moonshotai/Kimi-K2.5`         | texte + image | 262,144   | 65,536          |
| `gmi/openai/gpt-5.4`               | texte + image | 400,000   | 128,000         |
| `gmi/zai-org/GLM-5.1-FP8`          | texte        | 202,752   | 65,536          |

Le catalogue constitue un amorçage, et non la garantie que chaque compte peut appeler chaque modèle
à tout moment. Répertoriez ce que le fournisseur configuré signale dans votre environnement :

```bash
openclaw models list --provider gmi
```

## Dépannage

- `401` ou `403` : vérifiez que `GMI_API_KEY` est défini pour le processus exécutant
  OpenClaw, ou relancez l’intégration pour stocker la clé dans le profil d’authentification du fournisseur.
- Erreurs de modèle inconnu : vérifiez que le modèle existe dans votre compte GMI et utilisez la
  référence complète `gmi/<route-id>` affichée par `openclaw models list --provider gmi`.
- Erreurs intermittentes du fournisseur : essayez une autre route GMI ou configurez GMI comme
  fournisseur de repli plutôt que comme unique fournisseur de modèle principal.

## Voir aussi

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
