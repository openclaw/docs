---
read_when:
    - Vous souhaitez configurer l’inférence, puis terminer la configuration avec Crestodian
summary: Référence de la CLI pour `openclaw onboard` (intégration interactive)
title: Intégration
x-i18n:
    generated_at: "2026-07-12T15:15:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuration guidée qui établit d’abord l’inférence : elle détecte les accès existants à l’IA,
exige une complétion en direct, ne conserve que la route fonctionnelle, puis démarre
Crestodian pour configurer le reste. `openclaw setup` est le même point d’entrée ;
`openclaw setup --baseline` écrit uniquement la configuration et l’espace de travail de référence.

<CardGroup cols={2}>
  <Card title="Centre d’intégration de la CLI" href="/fr/start/wizard" icon="rocket">
    Présentation détaillée du flux interactif de la CLI.
  </Card>
  <Card title="Vue d’ensemble de l’intégration" href="/fr/start/onboarding-overview" icon="map">
    Fonctionnement global de l’intégration d’OpenClaw.
  </Card>
  <Card title="Référence de configuration de la CLI" href="/fr/start/wizard-cli-reference" icon="book">
    Sorties, fonctionnement interne et comportement de chaque étape.
  </Card>
  <Card title="Automatisation de la CLI" href="/fr/start/wizard-cli-automation" icon="terminal">
    Options non interactives et configurations scriptées.
  </Card>
  <Card title="Intégration de l’application macOS" href="/fr/start/onboarding" icon="apple">
    Flux d’intégration de l’application de barre des menus macOS.
  </Card>
</CardGroup>

## Exemples

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic` : ouvre l’assistant complet étape par étape. Cette option ne peut pas être combinée avec
  `--non-interactive` ; omettez `--classic` pour une configuration automatisée.
- `--flow quickstart` : ouvre l’assistant classique avec un minimum d’invites et
  génère automatiquement un jeton de Gateway.
- `--flow manual` (alias `advanced`) : ouvre l’assistant classique avec toutes les invites
  relatives au port, à la liaison et à l’authentification.
- `--flow import` : exécute un fournisseur de migration détecté (par exemple Hermes via `--import-from hermes`), affiche un aperçu du plan, puis l’applique après confirmation. L’importation ne s’exécute que sur une nouvelle configuration OpenClaw : réinitialisez d’abord la configuration, les identifiants, les sessions et l’état de l’espace de travail s’ils existent. Utilisez [`openclaw migrate`](/fr/cli/migrate) pour les plans d’exécution à blanc, le mode d’écrasement, les rapports et les correspondances exactes.
- `--modern` est un alias de compatibilité pour l’assistant de configuration conversationnelle
  Crestodian. Il utilise le même contrôle d’inférence en direct que `openclaw crestodian` et
  accepte uniquement `--workspace`, `--accept-risk`,
  `--non-interactive` et `--json`. Les autres options de configuration sont rejetées au lieu
  d’être ignorées silencieusement.

## Flux guidé

La commande simple `openclaw onboard` démarre le flux guidé. Elle affiche l’avis de sécurité,
détecte les accès à l’IA déjà disponibles par l’intermédiaire des modèles configurés, des variables
d’environnement de clés d’API et des CLI locales prises en charge, puis teste le
candidat recommandé avec une véritable complétion. Si ce candidat échoue, l’intégration affiche
la raison et essaie automatiquement le candidat utilisable suivant.

Si la détection automatique ne trouve plus aucun candidat, choisissez un autre candidat détecté ou saisissez
une clé d’API de fournisseur dans une invite masquée. Une clé saisie manuellement est testée par le même
processus de complétion en direct. L’intégration guidée
ne propose ni Crestodian ni une sortie sans IA avant la réussite d’un candidat. OpenClaw
ne conserve la route du modèle vérifiée et son identifiant qu’après la réussite du
test ; un candidat en échec ne remplace pas le modèle configuré et n’enregistre pas
l’identifiant essayé. La configuration de l’espace de travail et du Gateway reste inchangée jusqu’au
démarrage de Crestodian.

En mode guidé, `--workspace <dir>` fournit l’espace de travail proposé par Crestodian
et le contexte d’inférence isolé. Il n’est pas conservé tant que vous n’avez pas approuvé la
proposition de configuration de Crestodian. Les intégrations classique et non interactive conservent leur
espace de travail dans le cadre de leur flux de configuration habituel.

Une fois l’inférence validée, l’intégration guidée démarre immédiatement Crestodian avec
le modèle vérifié. Crestodian peut ensuite configurer l’espace de travail, le Gateway,
les canaux, les agents, les plugins et d’autres fonctionnalités facultatives. Dans Crestodian, utilisez
`open channel wizard for <channel>` pour confier la collecte des identifiants du canal à un
assistant de terminal masqué. Pour changer de fournisseur de modèle ou de méthode d’authentification,
quittez Crestodian et exécutez `openclaw onboard` ; Crestodian n’ouvre pas les flux
guidés ou classiques de fournisseur.

Sur une installation configurée, une nouvelle exécution de `openclaw onboard` vérifie d’abord le
modèle par défaut actuel, de sorte que le même flux sert de processus de vérification et de réparation.
Si cette vérification échoue, le modèle configuré n’est jamais remplacé automatiquement —
l’intégration s’arrête et vous demande comment continuer. La vérification s’exécute en dehors de votre
espace de travail ; un modèle fourni par un plugin de l’espace de travail peut donc échouer ici tout en
fonctionnant dans l’agent.
Utilisez `openclaw onboard --classic` pour l’authentification propre au fournisseur, les canaux, les Skills,
la configuration d’un Gateway distant, les importations ou les contrôles complets du Gateway. Pour la configuration
et la réparation conversationnelles sans rapport avec l’inférence, exécutez `openclaw crestodian` ; `openclaw onboard
--modern` est un alias de compatibilité qui passe par le même contrôle d’inférence. L’assistant classique
peut éventuellement vérifier le modèle par défaut avec une complétion en direct, mais
Crestodian ne démarrera pas avant la réussite de son propre contrôle d’inférence en direct.

Dans un terminal interactif, la commande simple `openclaw` (sans sous-commande) est aiguillée selon l’état
de la configuration :

- Si le fichier de configuration actif est absent ou ne contient aucun paramètre défini (vide ou
  contenant uniquement des métadonnées), elle démarre l’intégration guidée.
- Si le fichier de configuration existe mais échoue à la validation, elle démarre le parcours
  d’intégration classique avec des indications relatives à `openclaw doctor`. Crestodian exige une
  inférence fonctionnelle et n’est pas utilisé pour réparer cet état antérieur à l’inférence.
- Si le fichier de configuration est valide, elle ouvre la TUI normale de l’agent. Un Gateway configuré
  et accessible disposant d’un agent et d’un modèle mène directement à cette interface sans
  intégration ni Crestodian. Sur une installation configurée, accédez à Crestodian avec
  `/crestodian` dans la TUI ou `openclaw crestodian`.

Les URL de Gateway en texte clair `ws://` sont acceptées pour l’adresse de bouclage, les littéraux d’adresses IP privées, `.local` et les adresses Tailnet `*.ts.net`. Pour les autres noms DNS privés approuvés, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’intégration.

## Réinitialisation

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` efface l’état avant d’exécuter la configuration. `--reset-scope` contrôle l’étendue de l’effacement : `config` (configuration uniquement), `config+creds+sessions` (valeur par défaut lorsque `--reset` est fourni sans portée) ou `full` (réinitialise également l’espace de travail). L’espace de travail n’est réinitialisé qu’avec `--reset-scope full`.

## Paramètres régionaux

L’intégration interactive utilise les paramètres régionaux de l’assistant CLI pour les textes fixes de configuration. Ordre de résolution :

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Repli sur l’anglais

Les paramètres régionaux pris en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`. Les valeurs des paramètres régionaux peuvent utiliser un trait de soulignement ou des formes avec suffixe POSIX telles que `zh_CN.UTF-8`. Les noms de produits, les noms de commandes, les clés de configuration, les URL, les identifiants de fournisseurs, les identifiants de modèles et les libellés de plugins ou de canaux restent littéraux.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Configuration non interactive

`--non-interactive` exige `--accept-risk` (qui reconnaît que les agents sont puissants et qu’un accès complet au système présente des risques). La valeur par défaut de `--mode` est `local`.

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

`--custom-api-key` est facultatif ; s’il est omis, l’intégration recherche `CUSTOM_API_KEY` dans l’environnement. OpenClaw marque automatiquement comme compatibles avec les images les identifiants courants de modèles de vision (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral et modèles similaires). Fournissez `--custom-image-input` pour les identifiants personnalisés inconnus de modèles de vision, ou `--custom-text-input` pour imposer des métadonnées indiquant une entrée textuelle uniquement. Utilisez `--custom-compatibility openai-responses` pour les points de terminaison compatibles avec OpenAI qui prennent en charge `/v1/responses`, mais pas `/v1/chat/completions` ; les valeurs valides sont `openai` (par défaut), `openai-responses`, `anthropic`.

LM Studio dispose également d’une option de clé propre au fournisseur :

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

La valeur par défaut de `--custom-base-url` est `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; s’il est omis, l’intégration utilise les valeurs par défaut suggérées par Ollama. Les identifiants de modèles cloud tels que `kimi-k2.5:cloud` fonctionnent également ici.

Stockez les clés de fournisseur sous forme de références plutôt qu’en texte clair :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’intégration écrit des références adossées à l’environnement plutôt que des valeurs de clé en texte clair : pour les fournisseurs adossés à un profil d’authentification, elle écrit `keyRef: { source: "env", provider: "default", id: <envVar> }` ; pour les fournisseurs personnalisés, elle écrit `models.providers.<id>.apiKey` de la même manière (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contrat : définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration (par exemple `OPENAI_API_KEY`) et ne fournissez pas également une option de clé intégrée à la commande, sauf si cette variable d’environnement est définie — une valeur d’option sans variable d’environnement correspondante échoue immédiatement avec des indications.

### Authentification du Gateway (non interactive)

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte clair. `token` est le mode d’authentification par défaut.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` sous la forme d’une SecretRef d’environnement. Exige une variable d’environnement non vide portant ce nom dans l’environnement du processus d’intégration.
- `--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.
- Avec `--install-daemon` : un `gateway.auth.token` géré par SecretRef est validé, mais sa valeur résolue en texte clair n’est pas conservée dans les métadonnées d’environnement du service du superviseur ; si la référence n’est pas résolue, l’installation échoue de manière fermée avec des indications de correction. Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- L’intégration locale écrit `gateway.mode="local"` dans la configuration. Si ce paramètre `gateway.mode` est ensuite absent du fichier de configuration, cela indique une configuration endommagée ou une modification manuelle incomplète, et non un raccourci valide vers le mode local.
- L’intégration locale installe les plugins téléchargeables requis par le parcours de configuration choisi (par exemple un plugin d’exécution Codex ou Copilot pour ces choix d’authentification). L’intégration distante écrit uniquement les informations de connexion au Gateway distant — elle n’installe jamais de paquets de plugins locaux.
- `--allow-unconfigured` est une échappatoire distincte de `openclaw gateway run` ; elle ne permet pas à l’intégration d’omettre `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### État du Gateway local

- Sauf si vous fournissez `--skip-health`, l’intégration attend qu’un Gateway local soit accessible avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le parcours d’installation du Gateway géré. Sans cette option, un Gateway local doit déjà être en cours d’exécution (par exemple `openclaw gateway run`).
- `--skip-health` ignore l’attente si vous souhaitez uniquement écrire la configuration, l’espace de travail et les fichiers d’amorçage dans le cadre d’une automatisation.
- `--skip-bootstrap` définit `agents.defaults.skipBootstrap: true` et ignore la création de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` et `BOOTSTRAP.md`.
- Sous Windows natif, `--install-daemon` essaie d’abord les tâches planifiées, puis utilise à défaut un élément de connexion propre à l’utilisateur dans le dossier de démarrage si la création de la tâche est refusée.

### Mode de référence interactif

- Choisissez **Utiliser une référence de secret** lorsque vous y êtes invité, puis **Variable d’environnement** ou un fournisseur de secrets configuré (`file` ou `exec`).
- L’intégration effectue une validation préliminaire rapide avant d’enregistrer la référence et vous permet de réessayer en cas d’échec.

### Choix de points de terminaison Z.AI

<Note>
`--auth-choice zai-api-key` détecte automatiquement le meilleur point de terminaison Z.AI et le meilleur modèle pour votre clé : les points de terminaison Coding Plan privilégient `zai/glm-5.2` (avec repli sur `glm-5.1` s'il n'est pas disponible) ; les points de terminaison de l'API générale utilisent par défaut `zai/glm-5.1`. Pour imposer un point de terminaison Coding Plan, choisissez directement `zai-coding-global` ou `zai-coding-cn`.
</Note>

```bash
# Sélection du point de terminaison sans invite
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Autres choix de points de terminaison Z.AI : zai-coding-cn, zai-global, zai-cn
```

Mistral :

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Options non interactives supplémentaires

Authentification du modèle par jeton (utilisée avec `--auth-choice token`) :

| Option                          | Description                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Identifiant du fournisseur de jetons qui émet le jeton                                                                             |
| `--token <token>`               | Valeur du jeton pour l'authentification du modèle                                                                                  |
| `--token-profile-id <id>`       | Identifiant du profil d'authentification (par défaut `<provider>:manual` ; certains flux gérés par le fournisseur utilisent leur propre valeur par défaut, comme `anthropic:default`) |
| `--token-expires-in <duration>` | Durée d'expiration facultative du jeton (par ex. `365d`, `12h`)                                                                    |

Cloudflare AI Gateway : `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Contrôle de l'installation du démon : `--no-install-daemon` / `--skip-daemon` (alias ; ignorent l'installation du service Gateway), `--daemon-runtime <node|bun>`.

Skills : `--node-manager <npm|pnpm|bun>` (valeur par défaut : `npm`), `--skip-skills`.

Configuration de l'interface utilisateur et des hooks : `--skip-ui` (ignore les invites de la Control UI/TUI), `--skip-hooks` (ignore la configuration des Webhooks/hooks), `--skip-channels`, `--skip-search`.

Sortie : `--suppress-gateway-token-output` masque les sorties du Gateway/de l'interface utilisateur contenant des jetons (indications de jeton, URL de connexion automatique avec jeton intégré et lancement automatique de la Control UI) — utile dans les terminaux partagés et la CI.

<Note>
`--json` n'implique pas le mode non interactif dans l'intégration guidée ou classique.
Avec `--modern`, JSON fournit une vue d'ensemble ponctuelle de Crestodian, puis le processus se termine après cet
unique résultat. Utilisez `--non-interactive` pour les autres scripts.
</Note>

## Préfiltrage des fournisseurs

Lorsqu'un choix d'authentification implique un fournisseur privilégié, l'intégration préfiltre les sélecteurs du modèle par défaut et de la liste d'autorisation pour n'afficher que les modèles de ce fournisseur. Le filtre correspond également aux autres fournisseurs gérés par le même Plugin, ce qui couvre les variantes de Coding Plan telles que `volcengine`/`volcengine-plan` et `byteplus`/`byteplus-plan`. Si le filtre du fournisseur privilégié ne produit aucun modèle chargé, l'intégration revient au catalogue non filtré au lieu de laisser le sélecteur vide.

## Questions de suivi pour la recherche Web

Certains fournisseurs de recherche Web déclenchent des invites de suivi propres au fournisseur pendant l'intégration :

- **Grok** peut proposer la configuration facultative de `x_search` avec la même authentification xAI et le choix d'un modèle `x_search`.
- **Kimi** peut demander la région de l'API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) et le modèle de recherche Web Kimi par défaut.

## Autres comportements

- Comportement de la portée des messages privés lors de l'intégration locale : [référence de configuration de la CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
- Première conversation la plus rapide : `openclaw dashboard` (Control UI, sans configuration de canal).
- Fournisseur personnalisé : connectez n'importe quel point de terminaison compatible avec OpenAI ou Anthropic, y compris des fournisseurs hébergés non répertoriés. Utilisez la compatibilité **Unknown** pour effectuer une détection automatique au moyen d'une sonde en direct.
- Si un état Hermes est détecté, l'intégration propose un flux de migration (voir `--flow import` ci-dessus).

## Commandes de suivi courantes

Utilisez ultérieurement `openclaw configure` pour des modifications ciblées sans inférence et `openclaw
channels add` pour configurer uniquement un canal. Pour modifier le fournisseur de modèles ou la méthode d'authentification,
exécutez plutôt `openclaw onboard`.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
