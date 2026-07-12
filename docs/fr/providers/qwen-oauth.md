---
read_when:
    - Vous souhaitez configurer l’identifiant du fournisseur qwen-oauth
    - Vous utilisiez auparavant des identifiants OAuth de Qwen Portal
    - Vous avez besoin du point de terminaison du portail Qwen ou d’instructions de migration.
summary: Utiliser l’identifiant de fournisseur Qwen Portal avec OpenClaw
title: OAuth / Portail Qwen
x-i18n:
    generated_at: "2026-07-12T15:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` est l’identifiant du fournisseur Qwen Portal, enregistré par le plugin Qwen
(`@openclaw/qwen-provider`). Il cible le point de terminaison Qwen Portal à l’adresse
`https://portal.qwen.ai/v1` et permet de continuer à accéder aux anciennes configurations
Qwen OAuth / Portal au moyen d’un identifiant de fournisseur distinct, séparé du fournisseur
canonique `qwen`.

Choisissez `qwen-oauth` si vous disposez déjà d’un jeton Qwen Portal fonctionnel, si vous
migrez un ancien workflow Qwen OAuth ou Qwen CLI, ou si vous devez tester spécifiquement
le point de terminaison Qwen Portal. Pour les nouvelles configurations, privilégiez
[Qwen](/fr/providers/qwen) avec le point de terminaison ModelStudio Standard : il prend en charge les nouvelles
configurations par clé API, un choix plus large de points de terminaison, l’offre Standard avec paiement à l’utilisation, Coding Plan,
ainsi que le catalogue complet du plugin Qwen.

## Configuration

Installez le plugin Qwen si ce n’est pas déjà fait :

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Fournissez votre jeton Portal lors de l’intégration :

```bash
openclaw onboard --auth-choice qwen-oauth
```

Les exécutions non interactives lisent le jeton depuis `--qwen-oauth-token <token>`, ou définissez :

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

L’intégration stocke le jeton dans un profil d’authentification `qwen-oauth`, initialise le catalogue
de modèles Portal et définit `qwen-oauth/qwen3.5-plus` comme modèle par défaut lorsqu’aucun
modèle n’est configuré.

## Valeurs par défaut

- Fournisseur : `qwen-oauth`
- Alias : `qwen-portal`, `qwen-cli`
- URL de base : `https://portal.qwen.ai/v1`
- Variable d’environnement : `QWEN_API_KEY`
- Style d’API : compatible avec OpenAI
- Modèle par défaut : `qwen-oauth/qwen3.5-plus`

## Différences avec Qwen

OpenClaw dispose de deux identifiants de fournisseur associés à Qwen :

| Fournisseur  | Famille de points de terminaison                         | Recommandé pour                                                                         |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope et points de terminaison Coding Plan | Nouvelles configurations par clé API, offre Standard avec paiement à l’utilisation, Coding Plan, fonctionnalités multimodales DashScope |
| `qwen-oauth` | Point de terminaison Qwen Portal à `portal.qwen.ai/v1`   | Jetons Qwen Portal existants et anciennes configurations Qwen OAuth / CLI               |

Les deux fournisseurs utilisent des formats de requête compatibles avec OpenAI, mais leurs surfaces
d’authentification sont distinctes. Un jeton stocké pour `qwen-oauth` ne doit pas être considéré comme une clé DashScope
ou ModelStudio, et une nouvelle clé DashScope doit utiliser le fournisseur canonique `qwen`
à la place.

## Modèles

Le plugin Qwen initialise ce catalogue statique pour le point de terminaison Qwen Portal. Toutes les
entrées utilisent une sortie maximale de 65,536 jetons ; leur disponibilité dépend du compte et du jeton
Qwen Portal actuels.

| Référence du modèle               | Entrée      | Contexte  | Remarques      |
| --------------------------------- | ----------- | --------- | -------------- |
| `qwen-oauth/qwen3.5-plus`         | texte, image | 1,000,000 | Modèle par défaut |
| `qwen-oauth/qwen3.6-plus`         | texte, image | 1,000,000 |                |
| `qwen-oauth/qwen3-max-2026-01-23` | texte       | 262,144   |                |
| `qwen-oauth/qwen3-coder-next`     | texte       | 262,144   |                |
| `qwen-oauth/qwen3-coder-plus`     | texte       | 1,000,000 |                |
| `qwen-oauth/MiniMax-M2.5`         | texte       | 1,000,000 | Raisonnement   |
| `qwen-oauth/glm-5`                | texte       | 202,752   |                |
| `qwen-oauth/glm-4.7`              | texte       | 202,752   |                |
| `qwen-oauth/kimi-k2.5`            | texte, image | 262,144   |                |

Si votre compte utilise plutôt des clés API ModelStudio / DashScope, configurez le
fournisseur canonique `qwen` :

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Migration

Les anciens profils OAuth Qwen Portal ne peuvent pas être actualisés ; `openclaw doctor` les
signale. Si un profil Portal cesse de fonctionner, relancez l’intégration avec un jeton actuel
ou passez au fournisseur Qwen Standard :

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Le service ModelStudio Standard global utilise :

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Résolution des problèmes

- Échecs d’actualisation OAuth de Portal : les anciens profils OAuth Qwen Portal ne peuvent pas
  être actualisés. Relancez l’intégration avec un jeton actuel.
- Erreurs de point de terminaison incorrect : vérifiez que la référence du modèle commence par `qwen-oauth/` lorsque
  vous utilisez un jeton Portal. Utilisez les références `qwen/` uniquement pour le fournisseur Qwen canonique.
- Confusion autour de `QWEN_API_KEY` : les deux pages Qwen mentionnent cette variable d’environnement, mais l’intégration
  stocke les identifiants sous l’identifiant du fournisseur sélectionné. Privilégiez l’intégration lorsque vous
  conservez à la fois `qwen` et `qwen-oauth` sur la même machine.

## Pages connexes

- [Qwen](/fr/providers/qwen)
- [Alibaba Model Studio](/fr/providers/alibaba)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
