---
read_when:
    - Vous souhaitez une configuration guidée du gateway, de l’espace de travail, de l’authentification, des canaux et des Skills
summary: Référence CLI pour `openclaw onboard` (configuration interactive)
title: Configuration initiale
x-i18n:
    generated_at: "2026-04-25T13:44:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Configuration interactive pour une installation locale ou distante du Gateway.

## Guides associés

- Hub de configuration CLI : [Configuration initiale (CLI)](/fr/start/wizard)
- Vue d’ensemble de la configuration initiale : [Vue d’ensemble de la configuration initiale](/fr/start/onboarding-overview)
- Référence de la configuration initiale CLI : [Référence de configuration CLI](/fr/start/wizard-cli-reference)
- Automatisation CLI : [Automatisation CLI](/fr/start/wizard-cli-automation)
- Configuration initiale macOS : [Configuration initiale (app macOS)](/fr/start/onboarding)

## Exemples

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` démarre l’aperçu de configuration conversationnelle Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux de configuration initiale classique.

Pour les cibles `ws://` en texte brut sur réseau privé (réseaux de confiance uniquement), définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus de configuration initiale.
Il n’existe pas d’équivalent `openclaw.json` pour ce mécanisme de secours
côté client pour le transport.

Fournisseur personnalisé non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, la configuration initiale vérifie `CUSTOM_API_KEY`.

LM Studio prend également en charge une option de clé spécifique au fournisseur en mode non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` utilise par défaut `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; s’il est omis, la configuration initiale utilise les valeurs par défaut suggérées par Ollama. Les identifiants de modèle cloud tels que `kimi-k2.5:cloud` fonctionnent également ici.

Stockez les clés de fournisseur comme références plutôt qu’en texte brut :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, la configuration initiale écrit des références adossées à l’environnement au lieu de valeurs de clé en texte brut.
Pour les fournisseurs adossés à des profils d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode `ref` non interactif :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus de configuration initiale (par exemple `OPENAI_API_KEY`).
- Ne transmettez pas d’options de clé en ligne de commande (par exemple `--openai-api-key`) sauf si cette variable d’environnement est également définie.
- Si une option de clé en ligne de commande est transmise sans la variable d’environnement requise, la configuration initiale échoue immédiatement avec des indications de remédiation.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte brut.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` exige une variable d’environnement non vide dans l’environnement du processus de configuration initiale.
- Avec `--install-daemon`, lorsque l’authentification par jeton exige un jeton, les jetons Gateway gérés par SecretRef sont validés mais ne sont pas conservés comme texte brut résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton exige un jeton et que le SecretRef de jeton configuré ne peut pas être résolu, la configuration initiale échoue en mode fail-closed avec des indications de remédiation.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, la configuration initiale bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- La configuration initiale locale écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, considérez cela comme une configuration endommagée ou une modification manuelle incomplète, et non comme un raccourci valide pour le mode local.
- `--allow-unconfigured` est un mécanisme de secours distinct de l’exécution Gateway. Cela ne signifie pas que la configuration initiale peut omettre `gateway.mode`.

Exemple :

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

État de santé du Gateway local en mode non interactif :

- À moins de transmettre `--skip-health`, la configuration initiale attend qu’un Gateway local joignable soit disponible avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du Gateway géré. Sans cela, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous ne voulez écrire que la configuration, l’espace de travail ou le bootstrap en automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers d’espace de travail, transmettez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et ignorer la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sous Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis revient à un élément de connexion du dossier Démarrage par utilisateur si la création de tâche est refusée.

Comportement de la configuration interactive avec le mode référence :

- Choisissez **Use secret reference** lorsque cela vous est demandé.
- Puis choisissez l’une des options suivantes :
  - Variable d’environnement
  - Fournisseur de secret configuré (`file` ou `exec`)
- La configuration initiale effectue une validation préliminaire rapide avant d’enregistrer la référence.
  - Si la validation échoue, la configuration initiale affiche l’erreur et vous permet de réessayer.

Choix de point de terminaison Z.AI en mode non interactif :

Remarque : `--auth-choice zai-api-key` détecte désormais automatiquement le meilleur point de terminaison Z.AI pour votre clé (privilégie l’API générale avec `zai/glm-5.1`).
Si vous voulez spécifiquement les points de terminaison GLM Coding Plan, choisissez `zai-coding-global` ou `zai-coding-cn`.

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemple Mistral non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Remarques sur les flux :

- `quickstart` : invites minimales, génère automatiquement un jeton Gateway.
- `manual` : invites complètes pour port/liaison/authentification (alias de `advanced`).
- Lorsqu’un choix d’authentification implique un fournisseur préféré, la configuration initiale préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond aussi aux variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`).
- Si le filtre de fournisseur préféré ne renvoie encore aucun modèle chargé, la configuration initiale revient au catalogue non filtré au lieu de laisser le sélecteur vide.
- À l’étape de recherche web, certains fournisseurs peuvent déclencher des invites de suivi spécifiques au fournisseur :
  - **Grok** peut proposer une configuration facultative `x_search` avec la même `XAI_API_KEY` et un choix de modèle `x_search`.
  - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.
- Comportement de portée DM de la configuration initiale locale : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
- Premier chat le plus rapide : `openclaw dashboard` (Control UI, sans configuration de canal).
- Fournisseur personnalisé : connectez tout point de terminaison compatible OpenAI ou Anthropic, y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.

## Commandes de suivi courantes

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
