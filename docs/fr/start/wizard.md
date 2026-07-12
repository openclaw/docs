---
read_when:
    - Exécution ou configuration de l’intégration via la CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Intégration via la CLI : vérifiez l’inférence, puis confiez le reste de la configuration à Crestodian'
title: Intégration (CLI)
x-i18n:
    generated_at: "2026-07-12T03:10:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

L’intégration via la CLI est la méthode de configuration recommandée dans le terminal sous macOS, Linux et Windows (natif ou WSL2). Par défaut, elle détecte les accès à l’IA déjà disponibles sur la machine, les vérifie à l’aide d’une complétion réelle, puis démarre Crestodian afin de configurer l’espace de travail, le Gateway et les fonctionnalités facultatives. `openclaw setup` exécute le même processus ([Configuration](/fr/cli/setup) décrit la variante `--baseline`, limitée à la configuration). Les utilisateurs de l’application de bureau Windows peuvent également commencer depuis le [Hub Windows](/fr/platforms/windows).

L’intégration guidée commence par établir l’inférence. Elle détecte les accès à l’IA disponibles, exige une complétion réelle, puis démarre seulement ensuite [Crestodian](/fr/cli/crestodian) pour configurer le reste d’OpenClaw. Le processus guidé ne propose ni Crestodian avant l’inférence, ni option permettant d’ignorer l’IA.

L’assistant classique reste disponible pour la connexion aux fournisseurs, la configuration d’un Gateway distant, l’association des canaux, la gestion du démon, les Skills et les importations. Exécutez-le explicitement avec `openclaw onboard --classic` ; l’écran guidé des candidats d’inférence ne lui délègue pas le processus. Une fois l’inférence validée, Crestodian peut utiliser `open channel wizard for <channel>` pour confier à un assistant de terminal masqué la configuration des canaux nécessitant des secrets. Pour changer de fournisseur de modèle ou modifier son authentification, quittez Crestodian et exécutez `openclaw onboard` ; Crestodian n’ouvre pas les processus guidés ou classiques des fournisseurs.

<Info>
Pour démarrer une première conversation au plus vite, terminez la configuration guidée, exécutez `openclaw dashboard`, puis discutez dans le navigateur via l’interface de contrôle. Documentation : [Tableau de bord](/fr/web/dashboard).
</Info>

## Paramètres régionaux

L’assistant localise les textes fixes de l’intégration. Ordre de résolution : `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG`, puis l’anglais. Paramètres régionaux pris en charge : `en`, `zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Les noms de produits, commandes, clés de configuration, URL, identifiants de fournisseurs, identifiants de modèles et libellés de plugins ou de canaux restent en anglais quels que soient les paramètres régionaux.

Pour reconfigurer ultérieurement les paramètres sans rapport avec l’inférence :

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’active pas implicitement le mode non interactif. Pour les scripts, utilisez `--non-interactive` (consultez [Automatisation de la CLI](/fr/start/wizard-cli-automation)).
</Note>

<Tip>
L’assistant classique comprend une étape de recherche Web permettant de choisir un fournisseur : Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily. Certains nécessitent une clé API, tandis que d’autres fonctionnent sans clé. Configurez cette option ultérieurement avec `openclaw configure --section web`. Documentation : [Outils Web](/fr/tools/web).
</Tip>

## Processus guidé par défaut

La commande simple `openclaw onboard` suit ce processus :

1. Acceptez l’avis de sécurité.
2. Détectez les modèles configurés, les variables d’environnement contenant des clés API et les CLI d’IA locales prises en charge.
3. Testez le premier candidat détecté à l’aide d’une complétion réelle. En cas d’échec, affichez la raison et passez au candidat utilisable suivant.
4. Si la détection ne trouve plus de candidats, réessayez un candidat détecté ou saisissez la clé API d’un fournisseur dans une invite masquée. L’intégration guidée ne propose ni Crestodian ni une sortie permettant d’ignorer l’IA tant que l’inférence ne fonctionne pas.
5. Enregistrez uniquement la route de modèle vérifiée ainsi que les éventuels états d’identifiants ou de plugins qu’elle requiert. Les paramètres de l’espace de travail et du Gateway restent inchangés.
6. Démarrez Crestodian avec le modèle vérifié afin qu’il puisse configurer l’espace de travail, le Gateway, les canaux, les agents, les plugins et les autres éléments facultatifs.

Lors d’une nouvelle exécution de la commande sur une installation déjà configurée, le modèle par défaut actuel est testé en premier, ce qui transforme le processus guidé en étape de vérification et de réparation. Un échec de vérification ne remplace jamais automatiquement le modèle configuré ; l’intégration s’arrête et demande comment poursuivre. Exécutez `openclaw channels add` ou `openclaw configure` pour ajouter ultérieurement des éléments sans rapport avec l’inférence ; utilisez `openclaw onboard` pour modifier le fournisseur ou la route d’authentification.

## Assistant classique : démarrage rapide ou avancé

Exécutez `openclaw onboard --classic` pour ouvrir l’assistant complet. Il commence par proposer **Démarrage rapide** (valeurs par défaut) ou **Avancé** (contrôle total). Utilisez `--flow quickstart` ou `--flow advanced` (alias `manual`) pour sélectionner le processus classique et ignorer cette invite.

<Tabs>
  <Tab title="Démarrage rapide (valeurs par défaut)">
    - Gateway local, liaison sur l’adresse de bouclage
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway : **18789**
    - Authentification du Gateway : **Jeton** (généré automatiquement, même sur l’adresse de bouclage)
    - Politique des outils : `tools.profile: "coding"` pour les nouvelles configurations (un profil explicite existant est conservé)
    - Isolation des messages privés : `session.dmScope: "per-channel-peer"` pour les nouvelles configurations. Détails : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale : **Désactivée**
    - Les messages privés Telegram et WhatsApp utilisent par défaut une **liste d’autorisation** : Telegram demande un identifiant utilisateur Telegram numérique, tandis que WhatsApp demande un numéro de téléphone

  </Tab>
  <Tab title="Avancé (contrôle total)">
    - Affiche chaque étape : mode, espace de travail, Gateway, canaux, démon, Skills

  </Tab>
</Tabs>

Le mode distant (`--mode remote`) utilise toujours le processus avancé ; il configure uniquement cette machine pour se connecter à un Gateway situé ailleurs et n’installe ni ne modifie jamais quoi que ce soit sur l’hôte distant.

## Éléments configurés par l’intégration classique

Le mode local (par défaut) suit les étapes suivantes :

1. **Modèle/Authentification** - choisissez un processus d’authentification du fournisseur (clé API, OAuth ou authentification manuelle propre au fournisseur), y compris un fournisseur personnalisé (compatible avec OpenAI, compatible avec OpenAI Responses, compatible avec Anthropic ou détection automatique inconnue). Choisissez un modèle par défaut.
   Une nouvelle configuration par clé API OpenAI utilise par défaut `openai/gpt-5.6` (l’identifiant d’API directe sans préfixe est résolu vers Sol) ; une nouvelle configuration ChatGPT/Codex utilise par défaut `openai/gpt-5.6-sol`. Une nouvelle exécution de la configuration conserve un modèle explicite existant, y compris `openai/gpt-5.5`. Sélectionnez explicitement `openai/gpt-5.5` si le compte ne donne pas accès à GPT-5.6.
   Remarque de sécurité : si cet agent doit exécuter des outils ou traiter du contenu provenant de Webhooks ou de hooks, privilégiez le modèle de dernière génération le plus puissant disponible et appliquez une politique stricte aux outils ; les niveaux moins puissants ou plus anciens sont plus vulnérables aux injections de prompt.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références reposant sur des variables d’environnement plutôt que les valeurs des clés API en texte brut ; la variable d’environnement référencée doit déjà être définie, sinon l’intégration échoue immédiatement. En mode interactif de référence de secret, il est possible de pointer vers une variable d’environnement ou une référence de fournisseur configurée (`file` ou `exec`), avec une vérification préalable rapide avant l’enregistrement. Après la configuration du modèle et de l’authentification, l’assistant propose un test facultatif de complétion en direct ; en cas d’échec, vous pouvez revenir une fois à la configuration du modèle et de l’authentification ou ignorer l’échec sans bloquer la suite de l’assistant classique. Ignorer l’échec ne déverrouille pas Crestodian ; la configuration conversationnelle nécessite toujours la réussite d’une vérification d’inférence.
2. **Espace de travail** - répertoire des fichiers de l’agent (`~/.openclaw/workspace` par défaut). Initialise les fichiers d’amorçage.
3. **Gateway** - port, adresse de liaison, mode d’authentification et exposition Tailscale. En mode interactif avec jeton, choisissez le stockage du jeton en texte brut (par défaut) ou optez pour une SecretRef. Chemin SecretRef non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** - canaux de discussion intégrés et fournis par des plugins officiels, notamment Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp et d’autres.
5. **Démon** - installe un LaunchAgent (macOS), une unité utilisateur systemd (Linux/WSL2) ou une tâche planifiée Windows native avec un mécanisme de secours dans le dossier de démarrage propre à l’utilisateur.
   Si l’authentification par jeton est requise et que `gateway.auth.token` est géré par SecretRef, l’installation du démon le valide, mais n’enregistre pas le jeton résolu dans les métadonnées d’environnement du service de supervision ; une SecretRef non résolue bloque l’installation et affiche des instructions. Si `gateway.auth.token` et `gateway.auth.password` sont tous deux définis alors que `gateway.auth.mode` ne l’est pas, l’installation est bloquée jusqu’à ce que vous définissiez explicitement le mode.
6. **Vérification d’intégrité** - démarre le Gateway et vérifie qu’il est accessible.
7. **Skills** - installe les Skills recommandées et leurs dépendances facultatives.

<Note>
Une nouvelle exécution de l’intégration n’efface **rien**, sauf si vous choisissez explicitement **Réinitialiser** (ou utilisez `--reset`). Dans la CLI, `--reset` réinitialise par défaut la configuration, les identifiants et les sessions ; utilisez `--reset-scope full` pour supprimer également l’espace de travail. Si la configuration est invalide ou contient d’anciennes clés, l’intégration vous demande d’abord d’exécuter `openclaw doctor`.
</Note>

`--flow import` exécute dans l’assistant classique un processus de migration détecté (par exemple Hermes) à la place d’une nouvelle configuration ; consultez [Migrer](/fr/cli/migrate) et les guides de migration sous [Installation](/fr/install/migrating-hermes). `openclaw onboard --modern` est un alias de compatibilité pour [Crestodian](/fr/cli/crestodian). Il utilise la même barrière d’inférence que `openclaw crestodian` : une inférence vérifiée démarre l’assistant, tandis qu’un échec interactif renvoie vers la configuration guidée de l’inférence.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent distinct disposant de ses propres espace de travail, sessions et profils d’authentification. Une exécution sans `--workspace` démarre un processus interactif pour le nom, l’espace de travail, l’authentification, les canaux et les liaisons ; il ne s’agit pas de l’assistant complet `openclaw onboard`.

Éléments définis :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Remarques :

- Espace de travail par défaut : `~/.openclaw/workspace-<agentId>` (ou sous `agents.defaults.workspace` si cette option est définie).
- Ajoutez des `bindings` pour acheminer les messages entrants vers cet agent (l’intégration peut le faire pour vous).
- Options non interactives : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour obtenir une description détaillée, étape par étape, du comportement et des configurations générées, consultez la [Référence de configuration de la CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation de la CLI](/fr/start/wizard-cli-automation).
Pour la référence complète des options, consultez [`openclaw onboard`](/fr/cli/onboard).

## Documentation associée

- Référence des commandes de la CLI : [`openclaw onboard`](/fr/cli/onboard)
- Présentation de l’intégration : [Présentation de l’intégration](/fr/start/onboarding-overview)
- Intégration de l’application macOS : [Intégration](/fr/start/onboarding)
- Rituel de premier démarrage de l’agent : [Amorçage de l’agent](/fr/start/bootstrapping)
