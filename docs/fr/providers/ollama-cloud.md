---
read_when:
    - Vous souhaitez utiliser des modèles Ollama hébergés sans serveur Ollama local
    - Vous avez besoin de l’identifiant, de la clé ou du point de terminaison du fournisseur ollama-cloud
summary: Utiliser Ollama Cloud directement avec OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T15:45:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud est l’API de modèles hébergée d’Ollama. Le fournisseur `ollama-cloud` l’appelle
directement à l’adresse `https://ollama.com` via l’API native `/api/chat` d’Ollama, sans
serveur Ollama local ni application Ollama locale connectée en mode cloud. Utilisez des
références de modèle telles que `ollama-cloud/kimi-k2.6`.

OpenClaw enregistre `ollama-cloud` avec son propre identifiant de fournisseur afin que les
identifiants d’authentification réservés au cloud, la découverte en direct du catalogue et
la sélection de modèles ne soient pas mélangés avec un hôte `ollama` local. Pour Ollama
local, le routage hybride cloud et local, les embeddings et les détails des hôtes
personnalisés, consultez [Ollama](/fr/providers/ollama).

## Configuration

Créez une clé d’API Ollama Cloud sur [ollama.com/settings/keys](https://ollama.com/settings/keys), puis exécutez :

```bash
openclaw onboard --auth-choice ollama-cloud
```

Ou définissez :

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

L’intégration non interactive accepte directement la clé :

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

L’intégration définit le modèle par défaut sur `ollama-cloud/kimi-k2.5:cloud`.

## Valeurs par défaut

- Fournisseur : `ollama-cloud`
- URL de base : `https://ollama.com`
- Variable d’environnement : `OLLAMA_API_KEY`
- Style d’API : API native `/api/chat` d’Ollama
- Modèle par défaut lors de l’intégration : `ollama-cloud/kimi-k2.5:cloud`

## Quand choisir Ollama Cloud

- Vous souhaitez utiliser des modèles Ollama hébergés sans exécuter `ollama serve` localement.
- Vous souhaitez utiliser le même format d’API de chat native d’Ollama qu’OpenClaw utilise pour
  Ollama local, mais en le dirigeant vers `https://ollama.com`.
- Vous souhaitez un accès cloud simple aux modèles déjà présents dans le catalogue
  hébergé d’Ollama.
- Vous n’avez pas besoin de téléchargements locaux de modèles, du contrôle d’un GPU local ni d’une inférence limitée au réseau local.

Utilisez plutôt [Ollama](/fr/providers/ollama) si vous souhaitez un routage exclusivement local ou
cloud et local via un hôte Ollama connecté. Utilisez plutôt un
fournisseur compatible avec OpenAI si vous avez besoin de la sémantique de `/v1/chat/completions`
ou de fonctionnalités propres au fournisseur dans le style d’OpenAI.

## Modèles

Le fournisseur nécessite une clé d’API ; sans clé, il reste inactif. Avec une clé,
OpenClaw découvre en direct les modèles Ollama Cloud depuis le catalogue hébergé :

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Les identifiants hébergés du catalogue en direct comprennent `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` et `minimax-m2.7`. Lorsque la découverte en direct ne renvoie
rien, OpenClaw utilise en secours les entrées intégrées `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` et `glm-5.2:cloud`.

Les identifiants de modèles sont ceux du catalogue cloud, et non les noms de téléchargement locaux. Si le nom d’un modèle fonctionne sur
un hôte Ollama local, mais ne figure pas dans le catalogue hébergé, utilisez plutôt le fournisseur `ollama`
avec cet hôte local.

## Test en direct

Pour les tests de bon fonctionnement d’Ollama Cloud avec une clé d’API, dirigez le test en direct d’Ollama vers le point de terminaison
hébergé et choisissez un modèle dans votre catalogue actuel :

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Le test de bon fonctionnement dans le cloud exécute du texte, un flux natif et une recherche Web ; définissez
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` pour ignorer la recherche Web. Par défaut, il ignore les embeddings pour
`https://ollama.com`, car les clés d’API Ollama Cloud peuvent ne pas
autoriser `/api/embed` ; forcez-les avec `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Résolution des problèmes

- Erreurs `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` : fournissez une
  véritable clé d’API cloud. Le marqueur local `ollama-local` est uniquement destiné aux hôtes Ollama
  locaux ou privés.
- Erreurs de modèle inconnu : exécutez `openclaw models list --provider ollama-cloud` et
  copiez exactement l’identifiant du modèle hébergé.
- Problèmes d’appels d’outils ou de JSON brut sur des hôtes Ollama personnalisés : vérifiez si vous
  utilisez accidentellement une URL `/v1` compatible avec OpenAI. Les routes Ollama doivent utiliser
  l’URL de base native sans suffixe `/v1`.

## Voir aussi

- [Ollama](/fr/providers/ollama)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
