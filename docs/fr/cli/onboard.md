---
read_when:
    - Vous souhaitez une configuration guidée pour le Gateway, l’espace de travail, l’authentification, les canaux et les Skills
summary: Référence de la CLI pour `openclaw onboard` (intégration interactive)
title: Intégration
x-i18n:
    generated_at: "2026-04-30T07:19:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuration interactive pour une installation Gateway locale ou distante.

## Guides associés

<CardGroup cols={2}>
  <Card title="Hub de configuration initiale CLI" href="/fr/start/wizard" icon="rocket">
    Parcours du flux CLI interactif.
  </Card>
  <Card title="Vue d’ensemble de la configuration initiale" href="/fr/start/onboarding-overview" icon="map">
    Comment la configuration initiale d’OpenClaw s’articule.
  </Card>
  <Card title="Référence de configuration CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, éléments internes et comportement par étape.
  </Card>
  <Card title="Automatisation CLI" href="/fr/start/wizard-cli-automation" icon="terminal">
    Indicateurs non interactifs et configurations scriptées.
  </Card>
  <Card title="Configuration initiale de l’app macOS" href="/fr/start/onboarding" icon="apple">
    Flux de configuration initiale pour l’app de barre de menus macOS.
  </Card>
</CardGroup>

## Exemples

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` utilise des fournisseurs de migration appartenant à des plugins, comme Hermes. Il ne s’exécute que sur une installation OpenClaw neuve ; si une configuration, des identifiants, des sessions ou des fichiers de mémoire/identité d’espace de travail existants sont présents, réinitialisez ou choisissez une nouvelle installation avant l’importation.

`--modern` démarre l’aperçu de configuration conversationnelle Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux de configuration initiale classique.

Pour les cibles `ws://` en texte brut sur réseau privé (réseaux de confiance uniquement), définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus de configuration initiale.
Il n’existe pas d’équivalent `openclaw.json` pour ce contournement d’urgence du transport
côté client.

Fournisseur personnalisé non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, la configuration initiale vérifie `CUSTOM_API_KEY`.
OpenClaw marque automatiquement les ID de modèles de vision courants comme compatibles avec l’image. Passez `--custom-image-input` pour les ID de vision personnalisés inconnus, ou `--custom-text-input` pour forcer des métadonnées texte uniquement.

LM Studio prend aussi en charge un indicateur de clé propre au fournisseur en mode non interactif :

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

`--custom-base-url` utilise `http://127.0.0.1:11434` par défaut. `--custom-model-id` est facultatif ; s’il est omis, la configuration initiale utilise les valeurs par défaut suggérées par Ollama. Les ID de modèles cloud comme `kimi-k2.5:cloud` fonctionnent également ici.

Stocker les clés de fournisseur comme références plutôt qu’en texte brut :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, la configuration initiale écrit des références adossées à l’environnement plutôt que des valeurs de clés en texte brut.
Pour les fournisseurs adossés à un profil d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode non interactif `ref` :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus de configuration initiale (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’indicateurs de clé en ligne (par exemple `--openai-api-key`), sauf si cette variable d’environnement est aussi définie.
- Si un indicateur de clé en ligne est passé sans la variable d’environnement requise, la configuration initiale échoue rapidement avec des instructions.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte brut.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` nécessite une variable d’environnement non vide dans l’environnement du processus de configuration initiale.
- Avec `--install-daemon`, lorsque l’authentification par jeton nécessite un jeton, les jetons Gateway gérés par SecretRef sont validés mais ne sont pas conservés en texte brut résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, la configuration initiale échoue de manière fermée avec des instructions de correction.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, la configuration initiale bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- La configuration initiale locale écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, considérez cela comme une configuration endommagée ou une modification manuelle incomplète, et non comme un raccourci valide pour le mode local.
- `--allow-unconfigured` est une issue de secours distincte pour l’exécution du Gateway. Cela ne signifie pas que la configuration initiale peut omettre `gateway.mode`.

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

Santé du Gateway local non interactif :

- Sauf si vous passez `--skip-health`, la configuration initiale attend qu’un Gateway local soit joignable avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du Gateway géré. Sans lui, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous souhaitez uniquement écrire la configuration/l’espace de travail/le bootstrap dans l’automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers de l’espace de travail, passez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et ignorer la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sur Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis se rabat sur un élément de connexion par utilisateur dans le dossier Démarrage si la création de tâche est refusée.

Comportement de la configuration interactive avec le mode référence :

- Choisissez **Utiliser une référence de secret** lorsque l’invite s’affiche.
- Choisissez ensuite l’une des options suivantes :
  - Variable d’environnement
  - Fournisseur de secrets configuré (`file` ou `exec`)
- La configuration initiale effectue une validation préliminaire rapide avant d’enregistrer la référence.
  - Si la validation échoue, la configuration initiale affiche l’erreur et vous permet de réessayer.

### Choix de point de terminaison Z.AI non interactifs

<Note>
`--auth-choice zai-api-key` détecte automatiquement le meilleur point de terminaison Z.AI pour votre clé (préfère l’API générale avec `zai/glm-5.1`). Si vous voulez spécifiquement les points de terminaison GLM Coding Plan, choisissez `zai-coding-global` ou `zai-coding-cn`.
</Note>

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

Exemple Mistral non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Notes sur le flux

<AccordionGroup>
  <Accordion title="Types de flux">
    - `quickstart` : invites minimales, génère automatiquement un jeton Gateway.
    - `manual` : invites complètes pour le port, l’adresse de liaison et l’authentification (alias de `advanced`).
    - `import` : exécute un fournisseur de migration détecté, prévisualise le plan, puis l’applique après confirmation.

  </Accordion>
  <Accordion title="Préfiltrage des fournisseurs">
    Lorsqu’un choix d’authentification implique un fournisseur préféré, la configuration initiale préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond également aux variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`).

    Si le filtre de fournisseur préféré ne renvoie encore aucun modèle chargé, la configuration initiale se rabat sur le catalogue non filtré au lieu de laisser le sélecteur vide.

  </Accordion>
  <Accordion title="Relances de recherche web">
    Certains fournisseurs de recherche web déclenchent des invites de suivi propres au fournisseur :

    - **Grok** peut proposer une configuration facultative `x_search` avec le même `XAI_API_KEY` et un choix de modèle `x_search`.
    - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

  </Accordion>
  <Accordion title="Autres comportements">
    - Comportement de portée DM de la configuration initiale locale : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
    - Premier chat le plus rapide : `openclaw dashboard` (Control UI, sans configuration de canal).
    - Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic, y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.
    - Si un état Hermes est détecté, la configuration initiale propose un flux de migration. Utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai, le mode écrasement, les rapports et les correspondances exactes.

  </Accordion>
</AccordionGroup>

## Commandes de suivi courantes

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
