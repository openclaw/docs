---
read_when:
    - Vous voulez une configuration guidée pour le gateway, l’espace de travail, l’authentification, les canaux et les skills
summary: Référence CLI pour `openclaw onboard` (onboarding interactif)
title: Intégration
x-i18n:
    generated_at: "2026-07-01T13:00:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidé complet pour la configuration d’un Gateway local ou distant. Utilisez cette commande lorsque vous voulez qu’OpenClaw parcoure l’authentification du modèle, l’espace de travail, le Gateway, les canaux, les Skills et l’état de santé en un seul flux.

## Guides associés

<CardGroup cols={2}>
  <Card title="Hub d’onboarding CLI" href="/fr/start/wizard" icon="rocket">
    Parcours du flux CLI interactif.
  </Card>
  <Card title="Vue d’ensemble de l’onboarding" href="/fr/start/onboarding-overview" icon="map">
    Comment l’onboarding OpenClaw s’articule.
  </Card>
  <Card title="Référence de configuration CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, mécanismes internes et comportement de chaque étape.
  </Card>
  <Card title="Automatisation CLI" href="/fr/start/wizard-cli-automation" icon="terminal">
    Indicateurs non interactifs et configurations scriptées.
  </Card>
  <Card title="Onboarding de l’app macOS" href="/fr/start/onboarding" icon="apple">
    Flux d’onboarding pour l’app de barre de menus macOS.
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

`--flow import` utilise des fournisseurs de migration détenus par les plugins, comme Hermes. Il ne s’exécute que sur une nouvelle configuration OpenClaw ; si une configuration, des identifiants, des sessions ou des fichiers de mémoire/d’identité d’espace de travail existent déjà, réinitialisez ou choisissez une nouvelle configuration avant l’importation.

`--modern` lance l’aperçu d’onboarding conversationnel Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux d’onboarding classique.

Sur une nouvelle installation où le fichier de configuration actif est absent ou ne contient aucun
paramètre rédigé (vide ou uniquement des métadonnées), `openclaw` seul lance aussi le flux
d’onboarding classique. Dès qu’un fichier de configuration contient des paramètres rédigés,
`openclaw` seul ouvre Crestodian à la place.

Le `ws://` en texte clair est accepté pour le local loopback, les littéraux d’IP privées, `.local` et
les URL de Gateway Tailnet `*.ts.net`. Pour les autres noms DNS privés approuvés, définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’onboarding.

## Paramètres régionaux

L’onboarding interactif utilise les paramètres régionaux de l’assistant CLI pour le texte fixe de configuration. L’ordre de résolution est :

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Repli en anglais

Les paramètres régionaux pris en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`. Les valeurs de paramètres régionaux peuvent utiliser
des formes avec trait de soulignement ou suffixe POSIX, comme `zh_CN.UTF-8`. Les noms de produits, noms de commandes,
clés de configuration, URL, ID de fournisseurs, ID de modèles et libellés de plugins/canaux
restent littéraux.

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

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, l’onboarding vérifie `CUSTOM_API_KEY`.
OpenClaw marque automatiquement les ID de modèles de vision courants comme compatibles avec les images. Passez `--custom-image-input` pour les ID de vision personnalisés inconnus, ou `--custom-text-input` pour forcer des métadonnées texte uniquement.
Utilisez `--custom-compatibility openai-responses` pour les points de terminaison compatibles OpenAI qui prennent en charge `/v1/responses` mais pas `/v1/chat/completions`.

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

`--custom-base-url` utilise `http://127.0.0.1:11434` par défaut. `--custom-model-id` est facultatif ; s’il est omis, l’onboarding utilise les valeurs par défaut suggérées par Ollama. Les ID de modèles cloud comme `kimi-k2.5:cloud` fonctionnent aussi ici.

Stocker les clés de fournisseur comme références plutôt qu’en texte clair :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’onboarding écrit des références adossées à l’environnement au lieu de valeurs de clés en texte clair.
Pour les fournisseurs adossés à un profil d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode non interactif `ref` :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’onboarding (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’indicateurs de clé en ligne (par exemple `--openai-api-key`) sauf si cette variable d’environnement est aussi définie.
- Si un indicateur de clé en ligne est passé sans la variable d’environnement requise, l’onboarding échoue rapidement avec des consignes.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte clair.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` s’excluent mutuellement.
- `--gateway-token-ref-env` nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
- Avec `--install-daemon`, lorsque l’authentification par jeton nécessite un jeton, les jetons Gateway gérés par SecretRef sont validés mais ne sont pas persistés comme texte clair résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’onboarding échoue fermé avec des consignes de remédiation.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’onboarding bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’onboarding local écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, considérez cela comme une configuration endommagée ou une modification manuelle incomplète, et non comme un raccourci valide vers le mode local.
- L’onboarding local installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les exige.
- L’onboarding distant écrit uniquement les informations de connexion du Gateway distant et n’installe pas de paquets de plugins locaux.
- `--allow-unconfigured` est une échappatoire d’exécution Gateway distincte. Cela ne signifie pas que l’onboarding peut omettre `gateway.mode`.

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

- Sauf si vous passez `--skip-health`, l’onboarding attend qu’un Gateway local soit joignable avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du Gateway géré. Sans cet indicateur, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez uniquement écrire la configuration, l’espace de travail et le bootstrap dans une automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers de l’espace de travail, passez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et ignorer la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sur Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis se rabat sur un élément de connexion par utilisateur dans le dossier de démarrage si la création de tâche est refusée.

Comportement d’onboarding interactif avec le mode référence :

- Choisissez **Utiliser une référence secrète** lorsque l’invite s’affiche.
- Puis choisissez soit :
  - Variable d’environnement
  - Fournisseur de secrets configuré (`file` ou `exec`)
- L’onboarding effectue une validation préliminaire rapide avant d’enregistrer la référence.
  - Si la validation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.

### Choix de points de terminaison Z.AI non interactifs

<Note>
`--auth-choice zai-api-key` détecte automatiquement le meilleur point de terminaison et le meilleur modèle Z.AI pour
votre clé. Les points de terminaison Coding Plan préfèrent `zai/glm-5.2` ; les points de terminaison d’API générale utilisent
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

## Indicateurs non interactifs supplémentaires

Authentification de modèle basée sur un jeton (non interactive ; utilisée avec `--auth-choice token`) :

- `--token-provider <id>` — ID du fournisseur de jeton. Identifie le fournisseur qui émet le jeton.
- `--token <token>` — Valeur du jeton pour l’authentification du modèle.
- `--token-profile-id <id>` — ID du profil d’authentification. Le stockage générique des jetons utilise `<provider>:manual` par défaut ; les flux de configuration détenus par le fournisseur peuvent utiliser leur propre valeur par défaut, comme `anthropic:default`.
- `--token-expires-in <duration>` — Durée d’expiration facultative du jeton (par exemple `365d`, `12h`).

Cloudflare AI Gateway (non interactif) :

- `--cloudflare-ai-gateway-account-id <id>` — ID de compte Cloudflare pour le routage via Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID Cloudflare AI Gateway.

Contrôle de l’installation du démon :

- `--no-install-daemon` — Ignorer explicitement l’installation du service Gateway.
- `--skip-daemon` — Alias de `--no-install-daemon`.

Contrôle de la configuration de l’interface utilisateur et des hooks :

- `--skip-ui` — Ignorer les invites Control UI / TUI pendant l’onboarding.
- `--skip-hooks` — Ignorer les invites de configuration de webhook / hook pendant l’onboarding.

Suppression de sortie :

- `--suppress-gateway-token-output` — Supprimer la sortie Gateway/UI contenant des jetons (indices de jeton, URL de connexion automatique avec jeton intégré et lancement automatique de Control UI). Utile dans les terminaux partagés et les environnements CI.

## Notes sur les flux

<AccordionGroup>
  <Accordion title="Types de flux">
    - `quickstart` : invites minimales, génère automatiquement un jeton Gateway.
    - `manual` : invites complètes pour le port, l’adresse de liaison et l’authentification (alias de `advanced`).
    - `import` : exécute un fournisseur de migration détecté, affiche un aperçu du plan, puis l’applique après confirmation.

  </Accordion>
  <Accordion title="Préfiltrage des fournisseurs">
    Lorsqu’un choix d’authentification implique un fournisseur préféré, l’onboarding préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation pour ce fournisseur. Pour Volcengine et BytePlus, cela correspond aussi aux variantes coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Si le filtre de fournisseur préféré ne renvoie encore aucun modèle chargé, l’onboarding se rabat sur le catalogue non filtré au lieu de laisser le sélecteur vide.

  </Accordion>
  <Accordion title="Suivis de recherche web">
    Certains fournisseurs de recherche web déclenchent des invites de suivi propres au fournisseur :

    - **Grok** peut proposer une configuration facultative de `x_search` avec le même profil OAuth xAI ou la même clé API et un choix de modèle `x_search`.
    - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

  </Accordion>
  <Accordion title="Autres comportements">
    - Comportement de portée DM de l’onboarding local : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
    - Première discussion la plus rapide : `openclaw dashboard` (Control UI, sans configuration de canal).
    - Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic, y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.
    - Si un état Hermes est détecté, l’onboarding propose un flux de migration. Utilisez [Migrate](/fr/cli/migrate) pour les plans d’essai à blanc, le mode d’écrasement, les rapports et les correspondances exactes.

  </Accordion>
</AccordionGroup>

## Commandes de suivi courantes

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Utilisez `openclaw setup` comme même point d’entrée d’onboarding guidé. Utilisez `openclaw setup --baseline` lorsque vous avez uniquement besoin de la configuration et de l’espace de travail de base, `openclaw configure` ensuite pour les modifications ciblées, et `openclaw channels add` pour la configuration des canaux uniquement.

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
