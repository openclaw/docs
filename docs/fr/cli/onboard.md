---
read_when:
    - Vous souhaitez une configuration guidée du Gateway, de l’espace de travail, de l’authentification, des canaux et des Skills
summary: Référence CLI pour `openclaw onboard` (intégration interactive)
title: Intégrer
x-i18n:
    generated_at: "2026-05-02T07:02:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Intégration interactive pour la configuration d’un Gateway local ou distant.

## Guides associés

<CardGroup cols={2}>
  <Card title="Hub d’intégration CLI" href="/fr/start/wizard" icon="rocket">
    Parcours du flux CLI interactif.
  </Card>
  <Card title="Vue d’ensemble de l’intégration" href="/fr/start/onboarding-overview" icon="map">
    Comment l’intégration OpenClaw s’articule.
  </Card>
  <Card title="Référence de configuration CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, mécanismes internes et comportement par étape.
  </Card>
  <Card title="Automatisation CLI" href="/fr/start/wizard-cli-automation" icon="terminal">
    Indicateurs non interactifs et configurations scriptées.
  </Card>
  <Card title="Intégration de l’application macOS" href="/fr/start/onboarding" icon="apple">
    Flux d’intégration pour l’application de barre de menus macOS.
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

`--flow import` utilise des fournisseurs de migration appartenant aux plugins, comme Hermes. Il ne s’exécute que sur une configuration OpenClaw neuve ; si des fichiers de configuration, d’identifiants, de sessions ou de mémoire/identité d’espace de travail existent déjà, réinitialisez ou choisissez une configuration neuve avant l’importation.

`--modern` démarre l’aperçu d’intégration conversationnelle Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux d’intégration classique.

Pour les cibles `ws://` en texte clair sur réseau privé (réseaux fiables uniquement), définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’intégration.
Il n’existe pas d’équivalent `openclaw.json` pour cette dérogation de transport
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

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, l’intégration vérifie `CUSTOM_API_KEY`.
OpenClaw marque automatiquement les ID de modèles de vision courants comme compatibles avec les images. Passez `--custom-image-input` pour les ID de vision personnalisés inconnus, ou `--custom-text-input` pour forcer des métadonnées texte uniquement.

LM Studio prend également en charge un indicateur de clé propre au fournisseur en mode non interactif :

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

`--custom-base-url` vaut par défaut `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; s’il est omis, l’intégration utilise les valeurs par défaut suggérées par Ollama. Les ID de modèles cloud comme `kimi-k2.5:cloud` fonctionnent également ici.

Stocker les clés de fournisseur sous forme de refs plutôt qu’en texte clair :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’intégration écrit des refs adossées à l’environnement plutôt que des valeurs de clé en texte clair.
Pour les fournisseurs adossés à un profil d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme ref d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode `ref` non interactif :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’indicateurs de clé en ligne (par exemple `--openai-api-key`), sauf si cette variable d’environnement est également définie.
- Si un indicateur de clé en ligne est passé sans la variable d’environnement requise, l’intégration échoue rapidement avec des instructions.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte clair.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` exige une variable d’environnement non vide dans l’environnement du processus d’intégration.
- Avec `--install-daemon`, lorsque l’authentification par jeton exige un jeton, les jetons Gateway gérés par SecretRef sont validés, mais ne sont pas persistés en texte clair résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’intégration échoue de manière fermée avec des instructions de remédiation.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’intégration bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’intégration locale écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, traitez cela comme une configuration endommagée ou une modification manuelle incomplète, et non comme un raccourci valide de mode local.
- L’intégration locale installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les exige.
- L’intégration distante écrit uniquement les informations de connexion du Gateway distant et n’installe pas de paquets de plugins locaux.
- `--allow-unconfigured` est une trappe d’échappement distincte pour l’exécution du Gateway. Elle ne signifie pas que l’intégration peut omettre `gateway.mode`.

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

Santé du gateway local non interactif :

- Sauf si vous passez `--skip-health`, l’intégration attend qu’un gateway local joignable soit disponible avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du gateway géré. Sans cela, vous devez déjà avoir un gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez uniquement écrire la configuration, l’espace de travail et le bootstrap dans une automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers d’espace de travail, passez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et éviter de créer `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sous Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis revient à un élément de connexion dans le dossier de démarrage de l’utilisateur si la création de tâche est refusée.

Comportement de l’intégration interactive avec le mode référence :

- Choisissez **Utiliser une référence secrète** lorsque vous y êtes invité.
- Choisissez ensuite l’une des options suivantes :
  - Variable d’environnement
  - Fournisseur de secrets configuré (`file` ou `exec`)
- L’intégration effectue une validation préalable rapide avant d’enregistrer la ref.
  - Si la validation échoue, l’intégration affiche l’erreur et vous permet de réessayer.

### Choix de points de terminaison Z.AI non interactifs

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

## Notes de flux

<AccordionGroup>
  <Accordion title="Types de flux">
    - `quickstart` : invites minimales, génère automatiquement un jeton de gateway.
    - `manual` : invites complètes pour le port, l’adresse d’écoute et l’authentification (alias de `advanced`).
    - `import` : exécute un fournisseur de migration détecté, affiche un aperçu du plan, puis l’applique après confirmation.

  </Accordion>
  <Accordion title="Préfiltrage des fournisseurs">
    Lorsqu’un choix d’authentification implique un fournisseur préféré, l’intégration préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond également aux variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`).

    Si le filtre de fournisseur préféré ne renvoie encore aucun modèle chargé, l’intégration revient au catalogue non filtré au lieu de laisser le sélecteur vide.

  </Accordion>
  <Accordion title="Suivis de recherche web">
    Certains fournisseurs de recherche web déclenchent des invites de suivi propres au fournisseur :

    - **Grok** peut proposer une configuration facultative de `x_search` avec le même `XAI_API_KEY` et un choix de modèle `x_search`.
    - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

  </Accordion>
  <Accordion title="Autres comportements">
    - Comportement de portée DM de l’intégration locale : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
    - Premier chat le plus rapide : `openclaw dashboard` (Control UI, aucune configuration de canal).
    - Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic, y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.
    - Si un état Hermes est détecté, l’intégration propose un flux de migration. Utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai, le mode d’écrasement, les rapports et les correspondances exactes.

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
