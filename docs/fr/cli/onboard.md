---
read_when:
    - Vous souhaitez une configuration guidée pour le Gateway, l’espace de travail, l’authentification, les canaux et les Skills
summary: Référence de la CLI pour `openclaw onboard` (intégration interactive)
title: Intégrer
x-i18n:
    generated_at: "2026-07-04T20:29:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuration initiale guidée complète pour une configuration de Gateway locale ou distante. Utilisez-la lorsque vous voulez qu’OpenClaw vous guide dans un seul flux pour l’authentification du modèle, l’espace de travail, le Gateway, les canaux, les Skills et l’état de santé.

## Guides associés

<CardGroup cols={2}>
  <Card title="Hub d’intégration CLI" href="/fr/start/wizard" icon="rocket">
    Parcours du flux CLI interactif.
  </Card>
  <Card title="Vue d’ensemble de l’intégration" href="/fr/start/onboarding-overview" icon="map">
    Comment l’intégration OpenClaw s’articule.
  </Card>
  <Card title="Référence de configuration CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, fonctionnement interne et comportement par étape.
  </Card>
  <Card title="Automatisation CLI" href="/fr/start/wizard-cli-automation" icon="terminal">
    Options non interactives et configurations scriptées.
  </Card>
  <Card title="Intégration de l’app macOS" href="/fr/start/onboarding" icon="apple">
    Flux d’intégration pour l’app de barre de menus macOS.
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

`--flow import` utilise des fournisseurs de migration appartenant aux plugins, comme Hermes. Il ne s’exécute que sur une configuration OpenClaw neuve ; si une configuration, des identifiants, des sessions ou des fichiers de mémoire/identité d’espace de travail existent déjà, réinitialisez-les ou choisissez une configuration neuve avant l’importation.

`--modern` lance l’aperçu d’intégration conversationnelle Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux d’intégration classique.

Dans un terminal interactif, `openclaw` seul (sans sous-commande) choisit la route selon l’état de la configuration :

- Si le fichier de configuration actif est absent ou ne contient aucun paramètre rédigé (vide ou
  uniquement des métadonnées), ce flux d’intégration classique démarre.
- Si le fichier de configuration existe mais échoue à la validation, il lance
  [Crestodian](/fr/cli/crestodian) pour réparation.
- Si le fichier de configuration est valide, il ouvre le TUI d’agent normal, soit localement,
  soit connecté à un Gateway configuré joignable. Sur une installation configurée,
  accédez à Crestodian avec `/crestodian` dans le TUI ou `openclaw crestodian`.

Le texte en clair `ws://` est accepté pour les URL de Gateway en local loopback, les littéraux d’IP privée, `.local` et les Tailnet `*.ts.net`. Pour les autres noms DNS privés de confiance, définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’intégration.

## Paramètres régionaux

L’intégration interactive utilise les paramètres régionaux de l’assistant CLI pour les textes fixes de configuration. L’ordre de résolution est :

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Repli en anglais

Les paramètres régionaux pris en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`. Les valeurs de paramètres régionaux peuvent utiliser le trait de soulignement ou des suffixes POSIX, comme `zh_CN.UTF-8`. Les noms de produits, noms de commandes, clés de configuration, URL, identifiants de fournisseurs, identifiants de modèles et libellés de plugins/canaux restent littéraux.

Exemple :

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, l’intégration vérifie `CUSTOM_API_KEY`.
OpenClaw marque automatiquement les identifiants courants de modèles de vision comme compatibles avec l’image. Passez `--custom-image-input` pour les identifiants de vision personnalisés inconnus, ou `--custom-text-input` pour forcer des métadonnées texte uniquement.
Utilisez `--custom-compatibility openai-responses` pour les points de terminaison compatibles OpenAI qui prennent en charge `/v1/responses`, mais pas `/v1/chat/completions`.

LM Studio prend aussi en charge une option de clé propre au fournisseur en mode non interactif :

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

`--custom-base-url` vaut par défaut `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; s’il est omis, l’intégration utilise les valeurs par défaut suggérées par Ollama. Les identifiants de modèles cloud comme `kimi-k2.5:cloud` fonctionnent aussi ici.

Stocker les clés de fournisseur sous forme de références plutôt qu’en texte en clair :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’intégration écrit des références adossées à l’environnement au lieu de valeurs de clé en texte en clair.
Pour les fournisseurs adossés à des profils d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode non interactif `ref` :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’options de clé en ligne (par exemple `--openai-api-key`), sauf si cette variable d’environnement est aussi définie.
- Si une option de clé en ligne est passée sans la variable d’environnement requise, l’intégration échoue rapidement avec des instructions.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte en clair.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` nécessite une variable d’environnement non vide dans l’environnement du processus d’intégration.
- Avec `--install-daemon`, lorsque l’authentification par jeton nécessite un jeton, les jetons Gateway gérés par SecretRef sont validés, mais ne sont pas conservés comme texte en clair résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’intégration échoue fermée avec des instructions de remédiation.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’intégration bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’intégration locale écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, traitez cela comme une configuration endommagée ou une modification manuelle incomplète, pas comme un raccourci valide vers le mode local.
- L’intégration locale installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les exige.
- L’intégration distante écrit uniquement les informations de connexion au Gateway distant et n’installe pas de paquets de plugin locaux.
- `--allow-unconfigured` est une échappatoire d’exécution Gateway distincte. Cela ne signifie pas que l’intégration peut omettre `gateway.mode`.

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

État de santé du Gateway local non interactif :

- Sauf si vous passez `--skip-health`, l’intégration attend qu’un Gateway local joignable soit disponible avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du Gateway géré. Sans cette option, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez seulement écrire la configuration, l’espace de travail et le bootstrap dans l’automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers d’espace de travail, passez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et éviter la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sur Windows natif, `--install-daemon` essaie d’abord les tâches planifiées et se rabat sur un élément de connexion dans le dossier de démarrage par utilisateur si la création de tâche est refusée.

Comportement de l’intégration interactive avec le mode référence :

- Choisissez **Utiliser une référence de secret** lorsque l’invite apparaît.
- Puis choisissez l’un des deux éléments suivants :
  - Variable d’environnement
  - Fournisseur de secrets configuré (`file` ou `exec`)
- L’intégration effectue une validation préliminaire rapide avant d’enregistrer la référence.
  - Si la validation échoue, l’intégration affiche l’erreur et vous permet de réessayer.

### Choix de points de terminaison Z.AI non interactifs

<Note>
`--auth-choice zai-api-key` détecte automatiquement le meilleur point de terminaison et le meilleur modèle Z.AI pour
votre clé. Les points de terminaison Coding Plan préfèrent `zai/glm-5.2` ; les points de terminaison d’API généraux utilisent
`zai/glm-5.1`. Pour forcer un point de terminaison Coding Plan, choisissez `zai-coding-global` ou
`zai-coding-cn`.
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

## Options non interactives supplémentaires

Authentification de modèle basée sur jeton (non interactive ; utilisée avec `--auth-choice token`) :

- `--token-provider <id>` — Identifiant du fournisseur de jetons. Identifie le fournisseur qui émet le jeton.
- `--token <token>` — Valeur du jeton pour l’authentification du modèle.
- `--token-profile-id <id>` — Identifiant du profil d’authentification. Le stockage de jeton générique vaut par défaut `<provider>:manual` ; les flux de configuration appartenant au fournisseur peuvent utiliser leur propre valeur par défaut, comme `anthropic:default`.
- `--token-expires-in <duration>` — Durée facultative d’expiration du jeton (par exemple `365d`, `12h`).

Cloudflare AI Gateway (non interactif) :

- `--cloudflare-ai-gateway-account-id <id>` — ID de compte Cloudflare pour le routage via Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID Cloudflare AI Gateway.

Contrôle de l’installation du daemon :

- `--no-install-daemon` — Ignorer explicitement l’installation du service Gateway.
- `--skip-daemon` — Alias de `--no-install-daemon`.

Contrôle de la configuration de l’UI et des hooks :

- `--skip-ui` — Ignorer les invites Control UI / TUI pendant l’intégration.
- `--skip-hooks` — Ignorer les invites de configuration de webhook / hook pendant l’intégration.

Suppression de sortie :

- `--suppress-gateway-token-output` — Supprimer la sortie Gateway/UI contenant des jetons (indices de jeton, URL de connexion automatique avec jeton intégré et lancement automatique de Control UI). Utile dans les environnements de terminal partagé et de CI.

## Notes sur les flux

<AccordionGroup>
  <Accordion title="Types de flux">
    - `quickstart` : invites minimales, génère automatiquement un jeton Gateway.
    - `manual` : invites complètes pour le port, l’adresse d’écoute et l’authentification (alias de `advanced`).
    - `import` : exécute un fournisseur de migration détecté, affiche un aperçu du plan, puis l’applique après confirmation.

  </Accordion>
  <Accordion title="Préfiltrage des fournisseurs">
    Lorsqu’un choix d’authentification implique un fournisseur préféré, l’intégration préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond aussi aux variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`).

    Si le filtre de fournisseur préféré ne renvoie encore aucun modèle chargé, l’intégration revient au catalogue non filtré au lieu de laisser le sélecteur vide.

  </Accordion>
  <Accordion title="Suivis de recherche web">
    Certains fournisseurs de recherche web déclenchent des invites de suivi propres au fournisseur :

    - **Grok** peut proposer une configuration facultative `x_search` avec le même profil OAuth xAI ou la même clé API, et un choix de modèle `x_search`.
    - **Kimi** peut demander la région d’API Moonshot (`api.moonshot.ai` contre `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

  </Accordion>
  <Accordion title="Autres comportements">
    - Comportement de portée DM de l’intégration locale : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
    - Premier chat le plus rapide : `openclaw dashboard` (Control UI, aucune configuration de canal).
    - Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic, y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.
    - Si un état Hermes est détecté, l’intégration propose un flux de migration. Utilisez [Migrer](/fr/cli/migrate) pour les plans en simulation, le mode d’écrasement, les rapports et les correspondances exactes.

  </Accordion>
</AccordionGroup>

## Commandes de suivi courantes

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Utilisez `openclaw setup` comme le même point d’entrée d’intégration guidée. Utilisez `openclaw setup --baseline` lorsque vous n’avez besoin que de la config/de l’espace de travail de base, `openclaw configure` plus tard pour des changements ciblés, et `openclaw channels add` pour la configuration limitée aux canaux.

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
