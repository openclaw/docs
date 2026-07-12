---
read_when:
    - Vous souhaitez exécuter OpenClaw avec les modèles NovitaAI
    - Vous avez besoin de l’identifiant, de la clé ou du point de terminaison du fournisseur Novita
summary: Utilisez l’API compatible avec OpenAI de NovitaAI avec OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T15:53:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI est un fournisseur d’infrastructure d’IA hébergée proposant une API compatible avec OpenAI.
Il est fourni en tant que fournisseur OpenClaw intégré (aucune installation de Plugin distincte) ; les
identifiants passent donc par le flux normal d’authentification des modèles et les références de modèles ressemblent à
`novita/deepseek/deepseek-v3-0324`.

## Configuration

Créez une clé d’API sur [novita.ai/settings/key-management](https://novita.ai/settings/key-management), puis exécutez :

```bash
openclaw onboard --auth-choice novita-api-key
```

Ou définissez :

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Valeurs par défaut

| Paramètre             | Valeur                             |
| --------------------- | ---------------------------------- |
| Identifiant du fournisseur | `novita`                      |
| Alias                 | `novita-ai`, `novitaai`            |
| URL de base           | `https://api.novita.ai/openai/v1`  |
| Variable d’environnement | `NOVITA_API_KEY`                |
| Modèle par défaut     | `novita/deepseek/deepseek-v3-0324` |

## Catalogue de modèles intégré

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Il s’agit d’un point de départ, et non d’un catalogue mis à jour en temps réel. Votre compte, votre région ou
l’offre actuelle de Novita peuvent ajouter, supprimer ou restreindre des routes. Effectuez une vérification avant
de définir une valeur par défaut à long terme :

```bash
openclaw models list --provider novita
```

## Quand choisir Novita

- Accès hébergé à des modèles à poids ouverts via une API compatible avec OpenAI.
- Routes des familles DeepSeek, Kimi, MiniMax, GLM ou Qwen via un seul compte
  fournisseur.
- Une autre solution de repli hébergée aux côtés de DeepInfra, GMI, OpenRouter ou des API
  directes des fournisseurs.
- Hébergement des modèles côté fournisseur au lieu de maintenir une infrastructure LM Studio, Ollama,
  SGLang ou vLLM.

Choisissez un fournisseur direct lorsque vous avez besoin de paramètres de requête
propres au fournisseur ou de contrats de support. Choisissez un fournisseur local lorsque le modèle doit
s’exécuter sur votre propre matériel ou à l’intérieur de votre périmètre réseau.

## Dépannage

- `401`/`403` : vérifiez la clé sur la page de gestion des clés de Novita et réexécutez
  `openclaw onboard --auth-choice novita-api-key` si le profil enregistré est
  obsolète.
- Erreurs de modèle inconnu : utilisez la valeur exacte `novita/<route-id>` renvoyée par
  `openclaw models list --provider novita`.
- Routes lentes ou défaillantes : essayez une autre route de modèle Novita ou définissez Novita comme
  fournisseur de repli pour les charges de travail pouvant tolérer les variations propres au
  fournisseur.

## Voir aussi

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Répertoire des fournisseurs](/fr/providers/index)
