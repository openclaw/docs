---
read_when:
    - Vous souhaitez une configuration guidée pour le Gateway, l’espace de travail, l’authentification, les canaux et les Skills
summary: Référence CLI pour `openclaw onboard` (onboarding interactif)
title: onboard
x-i18n:
    generated_at: "2026-04-23T07:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interactif pour une configuration locale ou distante du Gateway.

## Guides associés

- Hub d’onboarding CLI : [Onboarding (CLI)](/fr/start/wizard)
- Vue d’ensemble de l’onboarding : [Onboarding Overview](/fr/start/onboarding-overview)
- Référence d’onboarding CLI : [CLI Setup Reference](/fr/start/wizard-cli-reference)
- Automatisation CLI : [CLI Automation](/fr/start/wizard-cli-automation)
- Onboarding macOS : [Onboarding (macOS App)](/fr/start/onboarding)

## Exemples

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Pour les cibles `ws://` en clair sur réseau privé (réseaux de confiance uniquement), définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’onboarding.

Fournisseur personnalisé non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, l’onboarding vérifie `CUSTOM_API_KEY`.

LM Studio prend également en charge un indicateur de clé spécifique au fournisseur en mode non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` a pour valeur par défaut `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; s’il est omis, l’onboarding utilise les valeurs par défaut suggérées par Ollama. Les ID de modèles cloud tels que `kimi-k2.5:cloud` fonctionnent également ici.

Stocker les clés de fournisseur comme références plutôt qu’en texte brut :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’onboarding écrit des références adossées à l’environnement au lieu de valeurs de clé en texte brut.
Pour les fournisseurs adossés à des profils d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode `ref` non interactif :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’onboarding (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’indicateurs de clé en ligne de commande (par exemple `--openai-api-key`) sauf si cette variable d’environnement est également définie.
- Si un indicateur de clé en ligne de commande est passé sans la variable d’environnement requise, l’onboarding échoue immédiatement avec des indications.

Options de token Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un token en texte brut.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
- Avec `--install-daemon`, lorsque l’authentification par token exige un token, les tokens Gateway gérés par SecretRef sont validés mais ne sont pas persistés comme texte brut résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode token exige un token et que le SecretRef de token configuré n’est pas résolu, l’onboarding échoue en mode fail-closed avec des indications de remédiation.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’onboarding bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’onboarding local écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, considérez cela comme une configuration endommagée ou une modification manuelle incomplète, pas comme un raccourci valide pour le mode local.
- `--allow-unconfigured` est une échappatoire distincte à l’exécution du Gateway. Cela ne signifie pas que l’onboarding peut omettre `gateway.mode`.

Exemple :

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

État de santé du Gateway local en mode non interactif :

- Sauf si vous passez `--skip-health`, l’onboarding attend qu’un Gateway local joignable soit disponible avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du Gateway géré. Sans lui, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez uniquement des écritures de configuration/espace de travail/bootstrap dans l’automatisation, utilisez `--skip-health`.
- Sous Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis revient à un élément de connexion du dossier Startup par utilisateur si la création de tâche est refusée.

Comportement de l’onboarding interactif avec le mode référence :

- Choisissez **Use secret reference** lorsque cela est proposé.
- Choisissez ensuite soit :
  - Variable d’environnement
  - Fournisseur de secret configuré (`file` ou `exec`)
- L’onboarding effectue une validation preflight rapide avant d’enregistrer la référence.
  - Si la validation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.

Choix de point de terminaison Z.AI en mode non interactif :

Remarque : `--auth-choice zai-api-key` détecte maintenant automatiquement le meilleur point de terminaison Z.AI pour votre clé (préfère l’API générale avec `zai/glm-5.1`).
Si vous voulez spécifiquement les points de terminaison GLM Coding Plan, choisissez `zai-coding-global` ou `zai-coding-cn`.

```bash
# Sélection de point de terminaison sans invite
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Autres choix de point de terminaison Z.AI :
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemple Mistral non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Notes sur le flux :

- `quickstart` : invites minimales, génère automatiquement un token Gateway.
- `manual` : invites complètes pour port/liaison/authentification (alias de `advanced`).
- Lorsqu’un choix d’authentification implique un fournisseur préféré, l’onboarding préfiltre les sélecteurs default-model et allowlist sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond également aux variantes coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Si le filtre de fournisseur préféré ne produit encore aucun modèle chargé, l’onboarding revient au catalogue non filtré au lieu de laisser le sélecteur vide.
- À l’étape de recherche web, certains fournisseurs peuvent déclencher des invites de suivi spécifiques au fournisseur :
  - **Grok** peut proposer une configuration facultative `x_search` avec la même `XAI_API_KEY`
    et un choix de modèle `x_search`.
  - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.
- Comportement de portée des messages privés pour l’onboarding local : [CLI Setup Reference](/fr/start/wizard-cli-reference#outputs-and-internals).
- Premier chat le plus rapide : `openclaw dashboard` (interface de contrôle, sans configuration de canal).
- Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic,
  y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.

## Commandes de suivi courantes

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
