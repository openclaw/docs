---
read_when:
    - Vous voulez configurer l’identifiant de fournisseur qwen-oauth
    - Vous avez précédemment utilisé des identifiants OAuth Qwen Portal
    - Vous avez besoin du point de terminaison Qwen Portal ou des conseils de migration
summary: Utilisez l’identifiant de fournisseur Qwen Portal avec OpenClaw
title: OAuth / portail Qwen
x-i18n:
    generated_at: "2026-06-27T18:07:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` est l’identifiant du fournisseur Qwen Portal. Il cible le point de terminaison Qwen Portal
et permet aux anciennes configurations Qwen OAuth / portal de rester adressables via un identifiant de
fournisseur distinct.

Utilisez ce fournisseur lorsque vous disposez spécifiquement d’un jeton Qwen Portal actuel pour
`https://portal.qwen.ai/v1`, ou lorsque vous migrez une ancienne configuration Qwen Portal /
Qwen CLI et souhaitez conserver ces identifiants séparés du fournisseur Qwen Cloud canonique. Ce n’est pas le premier choix recommandé pour les nouveaux utilisateurs de Qwen.

Pour les nouvelles configurations Qwen Cloud, préférez [Qwen](/fr/providers/qwen) avec le point de terminaison Standard
ModelStudio, sauf si vous disposez spécifiquement d’un jeton Qwen Portal actuel.

## Configuration

Fournissez votre jeton de portal lors de l’intégration :

```bash
openclaw onboard --auth-choice qwen-oauth
```

Ou définissez :

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Valeurs par défaut

- Fournisseur : `qwen-oauth`
- Alias : `qwen-portal`, `qwen-cli`
- URL de base : `https://portal.qwen.ai/v1`
- Variable d’environnement : `QWEN_API_KEY`
- Style d’API : compatible OpenAI
- Modèle par défaut : `qwen-oauth/qwen3.5-plus`

## Différences avec Qwen

OpenClaw dispose de deux identifiants de fournisseur orientés Qwen :

| Fournisseur  | Famille de points de terminaison                         | Idéal pour                                                                            |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `qwen`       | Points de terminaison Qwen Cloud / Alibaba DashScope et Coding Plan | Nouvelles configurations par clé d’API, Standard à l’usage, Coding Plan, fonctionnalités multimodales DashScope |
| `qwen-oauth` | Point de terminaison Qwen Portal sur `portal.qwen.ai/v1` | Jetons Qwen Portal existants et anciennes configurations Qwen OAuth / CLI             |

Les deux fournisseurs utilisent des formes de requêtes compatibles OpenAI, mais ce sont des surfaces
d’authentification séparées. Un jeton stocké pour `qwen-oauth` ne doit pas être traité comme une clé DashScope
ou ModelStudio, et une nouvelle clé DashScope doit utiliser le fournisseur canonique `qwen`
à la place.

## Quand choisir Qwen OAuth / Portal

- Vous disposez déjà d’un jeton Qwen Portal fonctionnel.
- Vous préservez un flux de travail Qwen OAuth ou Qwen CLI hérité tout en passant au modèle de fournisseurs d’OpenClaw.
- Vous devez tester spécifiquement la compatibilité avec le point de terminaison Qwen Portal.

Choisissez [Qwen](/fr/providers/qwen) pour une nouvelle configuration, un choix plus large de points de terminaison, Standard
ModelStudio, Coding Plan et le catalogue complet du plugin Qwen.

## Modèles

Le catalogue du plugin Qwen initialise la valeur par défaut Qwen Portal :

- `qwen-oauth/qwen3.5-plus`

La disponibilité dépend du compte et du jeton Qwen Portal actuels. Si votre
compte utilise plutôt des clés d’API ModelStudio / DashScope, configurez le fournisseur canonique
`qwen` :

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migration

Les profils OAuth Qwen Portal hérités peuvent ne pas être actualisables. Si un profil portal
cesse de fonctionner, authentifiez-vous de nouveau avec un jeton actuel ou basculez vers le fournisseur Qwen
Standard :

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Le ModelStudio global Standard utilise :

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Dépannage

- Échecs d’actualisation OAuth Portal : les profils OAuth Qwen Portal hérités peuvent ne pas être
  actualisables. Relancez l’intégration avec un jeton actuel.
- Erreurs de mauvais point de terminaison : vérifiez que la référence de modèle commence par `qwen-oauth/` lorsque
  vous utilisez un jeton portal. Utilisez les références `qwen/` uniquement pour le fournisseur Qwen canonique.
- Confusion autour de `QWEN_API_KEY` : les deux pages Qwen mentionnent cette variable d’environnement, mais l’intégration
  stocke les identifiants sous l’identifiant de fournisseur sélectionné. Préférez l’intégration lorsque vous
  gardez `qwen` et `qwen-oauth` disponibles sur la même machine.

## Connexe

- [Qwen](/fr/providers/qwen)
- [Alibaba Model Studio](/fr/providers/alibaba)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
