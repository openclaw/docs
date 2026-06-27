---
read_when:
    - Vous voulez une configuration guidée pour le Gateway, l’espace de travail, l’authentification, les canaux et les Skills
summary: Référence CLI pour `openclaw onboard` (configuration initiale interactive)
title: Intégration
x-i18n:
    generated_at: "2026-06-27T17:20:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Intégration guidée complète pour la configuration d’un Gateway local ou distant. Utilisez cette commande lorsque vous voulez qu’OpenClaw vous guide dans un seul flux pour l’authentification de modèle, l’espace de travail, le Gateway, les canaux, les Skills et l’état de santé.

## Guides associés

<CardGroup cols={2}>
  <Card title="Hub d’intégration CLI" href="/fr/start/wizard" icon="rocket">
    Parcours du flux CLI interactif.
  </Card>
  <Card title="Vue d’ensemble de l’intégration" href="/fr/start/onboarding-overview" icon="map">
    Comment l’intégration OpenClaw s’articule.
  </Card>
  <Card title="Référence de configuration CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, fonctionnement interne et comportement de chaque étape.
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

`--flow import` utilise des fournisseurs de migration appartenant aux plugins, comme Hermes. Il s’exécute uniquement sur une configuration OpenClaw fraîche ; si une configuration, des identifiants, des sessions ou des fichiers de mémoire/identité d’espace de travail existent déjà, réinitialisez ou choisissez une configuration fraîche avant d’importer.

`--modern` lance l’aperçu d’intégration conversationnelle Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux d’intégration classique.

Sur une nouvelle installation où le fichier de configuration actif est manquant ou ne contient aucun
paramètre rédigé (vide ou contenant uniquement des métadonnées), `openclaw` seul lance aussi le flux
d’intégration classique. Dès qu’un fichier de configuration contient des paramètres rédigés, `openclaw` seul
ouvre Crestodian à la place.

Le texte clair `ws://` est accepté pour le loopback, les littéraux d’IP privées, `.local` et les URL de Gateway
Tailnet `*.ts.net`. Pour les autres noms DNS privés de confiance, définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’intégration.

## Paramètres régionaux

L’intégration interactive utilise les paramètres régionaux de l’assistant CLI pour le texte de configuration fixe. L’ordre de
résolution est le suivant :

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Repli en anglais

Les paramètres régionaux pris en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`. Les valeurs de paramètres régionaux peuvent utiliser
un soulignement ou des formes avec suffixe POSIX, comme `zh_CN.UTF-8`. Les noms de produit, noms de commande,
clés de configuration, URL, ID de fournisseur, ID de modèle et libellés de plugin/canal
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

`--custom-api-key` est facultatif en mode non interactif. En cas d’omission, l’intégration vérifie `CUSTOM_API_KEY`.
OpenClaw marque automatiquement les ID de modèles de vision courants comme compatibles image. Passez `--custom-image-input` pour les ID de vision personnalisés inconnus, ou `--custom-text-input` pour forcer des métadonnées texte uniquement.
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

`--custom-base-url` vaut par défaut `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; en cas d’omission, l’intégration utilise les valeurs par défaut suggérées par Ollama. Les ID de modèles cloud comme `kimi-k2.5:cloud` fonctionnent aussi ici.

Stocker les clés de fournisseur sous forme de refs plutôt qu’en texte clair :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’intégration écrit des refs adossées à l’environnement plutôt que des valeurs de clé en texte clair.
Pour les fournisseurs adossés à un profil d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme ref d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode non interactif `ref` :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’options de clé en ligne (par exemple `--openai-api-key`) sauf si cette variable d’environnement est aussi définie.
- Si une option de clé en ligne est passée sans la variable d’environnement requise, l’intégration échoue immédiatement avec des consignes.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte clair.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` exige une variable d’environnement non vide dans l’environnement du processus d’intégration.
- Avec `--install-daemon`, lorsque l’authentification par jeton exige un jeton, les jetons Gateway gérés par SecretRef sont validés, mais ne sont pas conservés sous forme de texte clair résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton exige un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’intégration échoue de façon fermée avec des consignes de correction.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’intégration bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’intégration locale écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, considérez cela comme une configuration endommagée ou une modification manuelle incomplète, pas comme un raccourci valide de mode local.
- L’intégration locale installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les exige.
- L’intégration distante écrit uniquement les informations de connexion du Gateway distant et n’installe pas de paquets de plugins locaux.
- `--allow-unconfigured` est une échappatoire distincte pour l’exécution du Gateway. Cela ne signifie pas que l’intégration peut omettre `gateway.mode`.

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

- Sauf si vous passez `--skip-health`, l’intégration attend qu’un Gateway local soit joignable avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation du Gateway géré. Sans cette option, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez uniquement écrire la configuration, l’espace de travail et le bootstrap dans une automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers d’espace de travail, passez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et ignorer la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sur Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis se rabat sur un élément de connexion par utilisateur dans le dossier de démarrage si la création de tâche est refusée.

Comportement de l’intégration interactive avec le mode référence :

- Choisissez **Utiliser une référence de secret** lorsque l’invite s’affiche.
- Puis choisissez l’un des deux :
  - Variable d’environnement
  - Fournisseur de secrets configuré (`file` ou `exec`)
- L’intégration effectue une validation préliminaire rapide avant d’enregistrer la ref.
  - Si la validation échoue, l’intégration affiche l’erreur et vous permet de réessayer.

### Choix de points de terminaison Z.AI non interactifs

<Note>
`--auth-choice zai-api-key` détecte automatiquement le meilleur point de terminaison et le meilleur modèle Z.AI pour
votre clé. Les points de terminaison Coding Plan privilégient `zai/glm-5.2` ; les points de terminaison d’API générale utilisent
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

## Notes sur les flux

<AccordionGroup>
  <Accordion title="Types de flux">
    - `quickstart` : invites minimales, génère automatiquement un jeton Gateway.
    - `manual` : invites complètes pour le port, l’adresse de liaison et l’authentification (alias de `advanced`).
    - `import` : exécute un fournisseur de migration détecté, prévisualise le plan, puis l’applique après confirmation.

  </Accordion>
  <Accordion title="Préfiltrage des fournisseurs">
    Lorsqu’un choix d’authentification implique un fournisseur préféré, l’intégration préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond aussi aux variantes Coding Plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Si le filtre de fournisseur préféré ne produit encore aucun modèle chargé, l’intégration se rabat sur le catalogue non filtré au lieu de laisser le sélecteur vide.

  </Accordion>
  <Accordion title="Suivis de recherche web">
    Certains fournisseurs de recherche web déclenchent des invites de suivi propres au fournisseur :

    - **Grok** peut proposer une configuration `x_search` facultative avec le même profil OAuth xAI ou la même clé API, ainsi qu’un choix de modèle `x_search`.
    - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

  </Accordion>
  <Accordion title="Autres comportements">
    - Comportement de portée DM de l’intégration locale : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
    - Première discussion la plus rapide : `openclaw dashboard` (interface Control, aucune configuration de canal).
    - Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic, y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.
    - Si un état Hermes est détecté, l’intégration propose un flux de migration. Utilisez [Migrer](/fr/cli/migrate) pour les plans d’exécution à blanc, le mode écrasement, les rapports et les correspondances exactes.

  </Accordion>
</AccordionGroup>

## Commandes de suivi courantes

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Utilisez plutôt `openclaw setup` lorsque vous avez seulement besoin de la configuration et de l’espace de travail de base. Utilisez `openclaw configure` plus tard pour des changements ciblés et `openclaw channels add` pour une configuration limitée aux canaux.

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
