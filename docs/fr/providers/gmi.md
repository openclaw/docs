---
read_when:
    - Vous souhaitez utiliser OpenClaw avec les modèles GMI Cloud
    - Vous avez besoin de l’identifiant, de la clé ou du point de terminaison du fournisseur GMI
summary: Utiliser l’API compatible avec OpenAI de GMI Cloud avec OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T03:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud est une plateforme d’inférence hébergée pour les modèles de pointe et à poids ouverts,
accessible via une API compatible avec OpenAI. Dans OpenClaw, il s’agit d’un Plugin
de fournisseur externe officiel : installez-le une fois, enregistrez les identifiants via
l’authentification habituelle des modèles et utilisez des références de modèle telles que
`gmi/google/gemini-3.1-flash-lite`.

Utilisez GMI lorsque vous souhaitez employer une seule clé d’API pour plusieurs familles de
modèles hébergés, notamment les routes Anthropic, DeepSeek, Google, Moonshot, OpenAI et Z.AI
exposées par le catalogue de GMI. Il peut servir de fournisseur secondaire pour le repli de
modèle, pour comparer les routes hébergées de différents fournisseurs, ou lorsque GMI propose
un modèle avant votre fournisseur principal. OpenClaw gère l’identifiant du fournisseur, le
profil d’authentification, les alias, le catalogue initial de modèles et l’URL de base ; GMI
gère la disponibilité des modèles en temps réel, la facturation, les limites de débit et toute
politique de routage côté fournisseur.

| Propriété                | Valeur                                   |
| ------------------------ | ---------------------------------------- |
| Identifiant du fournisseur | `gmi` (alias : `gmi-cloud`, `gmicloud`) |
| Paquet                   | `@openclaw/gmi-provider`                 |
| Variable d’environnement d’authentification | `GMI_API_KEY`            |
| API                      | Compatible avec OpenAI (`openai-completions`) |
| URL de base              | `https://api.gmi-serving.com/v1`         |
| Modèle par défaut        | `gmi/google/gemini-3.1-flash-lite`       |

## Configuration

Installez le Plugin, redémarrez le Gateway, puis créez une clé d’API dans GMI Cloud
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

- Vous souhaitez utiliser un point de terminaison hébergé compatible avec OpenAI plutôt qu’un serveur de modèles local.
- Vous souhaitez essayer plusieurs familles de modèles commerciaux et à poids ouverts avec un seul
  compte fournisseur.
- Vous souhaitez un fournisseur de repli dont le routage en amont diffère de celui de DeepInfra,
  OpenRouter, Together ou des API directes des fournisseurs.
- Vous avez besoin d’identifiants de modèle, de tarifs ou de contrôles de compte propres à GMI.

Choisissez plutôt le fournisseur direct lorsque vous avez besoin de fonctionnalités natives
qu’il n’expose pas par l’intermédiaire de sa route compatible avec OpenAI. Choisissez un
fournisseur local tel que LM Studio, Ollama, SGLang ou vLLM lorsque la localisation des données
ou le contrôle local du GPU importe davantage que la commodité d’un service hébergé.

## Modèles

Le catalogue du Plugin fournit une liste initiale d’identifiants de routes GMI Cloud couramment disponibles :

| Référence du modèle                | Entrée       | Contexte  | Sortie maximale |
| ---------------------------------- | ------------ | --------- | --------------- |
| `gmi/anthropic/claude-sonnet-4.6`  | texte + image | 200,000   | 64,000          |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | texte         | 163,840   | 65,536          |
| `gmi/google/gemini-3.1-flash-lite` | texte + image | 1,048,576 | 65,536          |
| `gmi/moonshotai/Kimi-K2.5`         | texte + image | 262,144   | 65,536          |
| `gmi/openai/gpt-5.4`               | texte + image | 400,000   | 128,000         |
| `gmi/zai-org/GLM-5.1-FP8`          | texte         | 202,752   | 65,536          |

Le catalogue constitue une liste initiale et ne garantit pas que chaque compte puisse appeler
chaque modèle à tout moment. Répertoriez les modèles signalés par le fournisseur configuré dans
votre environnement :

```bash
openclaw models list --provider gmi
```

## Dépannage

- `401` ou `403` : vérifiez que `GMI_API_KEY` est définie pour le processus exécutant
  OpenClaw, ou relancez l’intégration afin d’enregistrer la clé dans le profil d’authentification du fournisseur.
- Erreurs de modèle inconnu : vérifiez que le modèle existe dans votre compte GMI et utilisez la
  référence complète `gmi/<route-id>` affichée par `openclaw models list --provider gmi`.
- Erreurs intermittentes du fournisseur : essayez une autre route GMI ou configurez GMI comme
  fournisseur de repli plutôt que comme unique fournisseur de modèle principal.

## Pages connexes

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
