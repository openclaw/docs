---
read_when:
    - Vous souhaitez une configuration guidée pour le Gateway, l’espace de travail, l’authentification, les canaux et les Skills
summary: Référence CLI pour `openclaw onboard` (intégration interactive)
title: Intégrer
x-i18n:
    generated_at: "2026-06-30T22:14:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidé complet pour une configuration de Gateway locale ou distante. Utilisez cette commande lorsque vous voulez qu’OpenClaw vous guide à travers l’authentification du modèle, l’espace de travail, le Gateway, les canaux, les Skills et l’état de santé dans un seul flux.

## Guides connexes

<CardGroup cols={2}>
  <Card title="Hub d’onboarding CLI" href="/fr/start/wizard" icon="rocket">
    Procédure pas à pas du flux CLI interactif.
  </Card>
  <Card title="Vue d’ensemble de l’onboarding" href="/fr/start/onboarding-overview" icon="map">
    Comment l’onboarding OpenClaw s’articule.
  </Card>
  <Card title="Référence de configuration CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, éléments internes et comportement étape par étape.
  </Card>
  <Card title="Automatisation CLI" href="/fr/start/wizard-cli-automation" icon="terminal">
    Indicateurs non interactifs et configurations scriptées.
  </Card>
  <Card title="Onboarding de l’application macOS" href="/fr/start/onboarding" icon="apple">
    Flux d’onboarding pour l’application de barre de menus macOS.
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

`--flow import` utilise des fournisseurs de migration appartenant aux plugins, comme Hermes. Il s’exécute uniquement sur une nouvelle configuration OpenClaw ; si une configuration, des identifiants, des sessions ou des fichiers de mémoire/d’identité d’espace de travail existent déjà, réinitialisez ou choisissez une nouvelle configuration avant l’importation.

`--modern` lance l’aperçu d’onboarding conversationnel Crestodian. Sans
`--modern`, `openclaw onboard` conserve le flux d’onboarding classique.

Sur une nouvelle installation où le fichier de configuration actif est absent ou ne contient aucun
paramètre rédigé (vide ou contenant uniquement des métadonnées), la commande nue `openclaw` lance aussi le flux
d’onboarding classique. Dès qu’un fichier de configuration contient des paramètres rédigés, la commande nue `openclaw`
ouvre Crestodian à la place.

Le `ws://` en texte clair est accepté pour le loopback, les littéraux d’IP privées, `.local` et les
URL de Gateway Tailnet `*.ts.net`. Pour les autres noms DNS privés approuvés, définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’onboarding.

## Paramètres régionaux

L’onboarding interactif utilise les paramètres régionaux de l’assistant CLI pour le texte fixe de configuration. L’ordre de résolution
est le suivant :

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Repli vers l’anglais

Les paramètres régionaux pris en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`. Les valeurs de paramètres régionaux peuvent utiliser
des traits de soulignement ou des formes avec suffixe POSIX comme `zh_CN.UTF-8`. Les noms de produits, noms de commandes,
clés de configuration, URL, identifiants de fournisseurs, identifiants de modèles et libellés de plugins/canaux
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
OpenClaw marque automatiquement les identifiants de modèles de vision courants comme compatibles avec les images. Passez `--custom-image-input` pour les identifiants de vision personnalisés inconnus, ou `--custom-text-input` pour forcer des métadonnées texte uniquement.
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

`--custom-base-url` utilise `http://127.0.0.1:11434` par défaut. `--custom-model-id` est facultatif ; s’il est omis, l’onboarding utilise les valeurs par défaut suggérées par Ollama. Les identifiants de modèles cloud comme `kimi-k2.5:cloud` fonctionnent également ici.

Stocker les clés de fournisseur sous forme de références au lieu de texte en clair :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’onboarding écrit des références adossées à l’environnement au lieu de valeurs de clés en texte clair.
Pour les fournisseurs adossés à un profil d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence d’environnement (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode `ref` non interactif :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’onboarding (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’indicateurs de clé en ligne (par exemple `--openai-api-key`) sauf si cette variable d’environnement est également définie.
- Si un indicateur de clé en ligne est passé sans la variable d’environnement requise, l’onboarding échoue rapidement avec des instructions.

Options de jeton de Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte clair.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef d’environnement.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- `--gateway-token-ref-env` nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
- Avec `--install-daemon`, lorsque l’authentification par jeton nécessite un jeton, les jetons Gateway gérés par SecretRef sont validés mais ne sont pas persistés sous forme de texte clair résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton nécessite un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’onboarding échoue fermé avec des instructions de correction.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’onboarding bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’onboarding local écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur ne contient pas `gateway.mode`, traitez cela comme une configuration endommagée ou une modification manuelle incomplète, et non comme un raccourci valide de mode local.
- L’onboarding local installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les exige.
- L’onboarding distant écrit uniquement les informations de connexion pour le Gateway distant et n’installe pas de paquets de plugins locaux.
- `--allow-unconfigured` est une échappatoire d’exécution de Gateway distincte. Cela ne signifie pas que l’onboarding peut omettre `gateway.mode`.

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

- Sauf si vous passez `--skip-health`, l’onboarding attend qu’un Gateway local joignable soit disponible avant de se terminer avec succès.
- `--install-daemon` lance d’abord le chemin d’installation du Gateway géré. Sans cet indicateur, vous devez déjà avoir un Gateway local en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez uniquement écrire la configuration, l’espace de travail et le bootstrap en automatisation, utilisez `--skip-health`.
- Si vous gérez vous-même les fichiers d’espace de travail, passez `--skip-bootstrap` pour définir `agents.defaults.skipBootstrap: true` et ignorer la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sur Windows natif, `--install-daemon` essaie d’abord les tâches planifiées et se replie sur un élément de connexion dans le dossier de démarrage par utilisateur si la création de tâche est refusée.

Comportement de l’onboarding interactif avec le mode référence :

- Choisissez **Utiliser une référence secrète** lorsque l’invite s’affiche.
- Choisissez ensuite l’un des deux :
  - Variable d’environnement
  - Fournisseur de secrets configuré (`file` ou `exec`)
- L’onboarding effectue une validation préalable rapide avant d’enregistrer la référence.
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

## Notes sur les flux

<AccordionGroup>
  <Accordion title="Types de flux">
    - `quickstart` : invites minimales, génère automatiquement un jeton de Gateway.
    - `manual` : invites complètes pour le port, l’adresse d’écoute et l’authentification (alias de `advanced`).
    - `import` : exécute un fournisseur de migration détecté, prévisualise le plan, puis l’applique après confirmation.

  </Accordion>
  <Accordion title="Préfiltrage des fournisseurs">
    Lorsqu’un choix d’authentification implique un fournisseur préféré, l’onboarding préfiltre les sélecteurs de modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et BytePlus, cela correspond aussi aux variantes de coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Si le filtre de fournisseur préféré ne produit encore aucun modèle chargé, l’onboarding se replie sur le catalogue non filtré au lieu de laisser le sélecteur vide.

  </Accordion>
  <Accordion title="Suivis de recherche Web">
    Certains fournisseurs de recherche Web déclenchent des invites de suivi propres au fournisseur :

    - **Grok** peut proposer une configuration facultative `x_search` avec le même profil OAuth xAI ou la même clé d’API et un choix de modèle `x_search`.
    - **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) et le modèle de recherche Web Kimi par défaut.

  </Accordion>
  <Accordion title="Autres comportements">
    - Comportement de périmètre DM de l’onboarding local : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
    - Premier chat le plus rapide : `openclaw dashboard` (Control UI, sans configuration de canal).
    - Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic, y compris les fournisseurs hébergés non répertoriés. Utilisez Unknown pour détecter automatiquement.
    - Si un état Hermes est détecté, l’onboarding propose un flux de migration. Utilisez [Migrer](/fr/cli/migrate) pour les plans d’essai à blanc, le mode écrasement, les rapports et les correspondances exactes.

  </Accordion>
</AccordionGroup>

## Commandes de suivi courantes

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Utilisez `openclaw setup` comme même point d’entrée d’onboarding guidé. Utilisez `openclaw setup --baseline` lorsque vous avez uniquement besoin de la configuration/l’espace de travail de base, `openclaw configure` plus tard pour des modifications ciblées, et `openclaw channels add` pour une configuration limitée aux canaux.

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
