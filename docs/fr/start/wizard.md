---
read_when:
    - Exécution ou configuration de l’intégration via la CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Intégration via la CLI : vérifiez l’inférence, puis confiez le reste de la configuration à OpenClaw'
title: Intégration (CLI)
x-i18n:
    generated_at: "2026-07-16T13:51:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

L’intégration via la CLI est la méthode de configuration recommandée dans le terminal sous macOS, Linux et
Windows (natif ou WSL2). Par défaut, elle détecte l’accès à l’IA déjà disponible sur
la machine, le vérifie au moyen d’une complétion réelle, puis démarre OpenClaw afin de
configurer l’espace de travail, le Gateway et les fonctionnalités facultatives. `openclaw setup` exécute le même processus ([Configuration](/fr/cli/setup) décrit
la variante de configuration uniquement `--baseline`). Les utilisateurs de l’application de bureau Windows peuvent également commencer
depuis [Windows Hub](/fr/platforms/windows).

L’intégration guidée commence par établir l’inférence. Elle détecte les accès à l’IA disponibles,
exige une complétion réelle, puis démarre seulement ensuite [OpenClaw](/cli/openclaw)
afin de configurer le reste d’OpenClaw. Choisir **Skip for now** quitte l’intégration
sans démarrer OpenClaw.

L’assistant classique reste disponible pour les fournisseurs personnalisés, la configuration d’un Gateway
distant, l’association des canaux, les contrôles du daemon, les Skills et les importations. Exécutez-le explicitement
avec `openclaw onboard --classic` ; le sélecteur d’inférence guidé ne lui délègue pas
le processus. Une fois l’inférence validée, OpenClaw peut utiliser `open channel wizard for
<channel>` pour confier la configuration des canaux nécessitant des secrets à un assistant de terminal qui masque les saisies.
Pour changer le fournisseur du modèle ou son authentification, quittez OpenClaw et exécutez
`openclaw onboard` ; OpenClaw n’ouvre pas les processus guidés ou classiques relatifs aux fournisseurs.

<Info>
Pour démarrer une première conversation au plus vite : terminez la configuration guidée, exécutez `openclaw dashboard`, puis discutez dans
le navigateur via l’interface de contrôle. Documentation : [Tableau de bord](/fr/web/dashboard).
</Info>

## Paramètres régionaux

L’assistant localise les textes fixes de l’intégration. Ordre de résolution : `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, puis l’anglais. Paramètres régionaux pris en charge : `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Les noms de produits, commandes, clés de configuration, URL, identifiants de fournisseurs, identifiants de modèles et
libellés de plugins/canaux restent en anglais, quels que soient les paramètres régionaux.

Pour reconfigurer ultérieurement les paramètres sans rapport avec l’inférence :

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Pour les scripts, utilisez `--non-interactive` (voir [Automatisation de la CLI](/fr/start/wizard-cli-automation)).
</Note>

<Tip>
L’assistant classique comprend une étape de recherche sur le Web permettant de choisir un fournisseur : Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG ou Tavily. Certains nécessitent une clé API ; d’autres
n’en nécessitent aucune. Configurez cela ultérieurement avec `openclaw configure --section web`. Documentation :
[Outils Web](/fr/tools/web).
</Tip>

## Parcours guidé par défaut

La commande simple `openclaw onboard` suit ce parcours :

1. Acceptez l’avis de sécurité.
2. Détectez les modèles configurés, les variables d’environnement contenant des clés API, les CLI d’IA locales
   prises en charge et les modèles déjà installés capables d’utiliser des outils sur les serveurs Ollama ou LM
   Studio accessibles depuis l’hôte du Gateway. Cette analyse en lecture seule ne télécharge jamais de
   modèle. Les installations de Gemini CLI et d’Antigravity sont signalées, mais ne sont pas testées automatiquement,
   car elles ne permettent pas d’imposer un test sans outil.
3. Testez le premier candidat détecté au moyen d’une complétion réelle. En cas d’échec, affichez-en
   la raison et passez au candidat utilisable suivant.
4. Si la détection ne trouve plus aucun candidat, choisissez OpenAI, Anthropic, xAI (Grok), Google ou
   OpenRouter, ou choisissez **More…** pour accéder aux autres fournisseurs. Les
   régions, offres et méthodes prises en charge par chaque fournisseur — navigateur, appareil, clé API ou jeton —
   apparaissent dans un second menu et sont testées au moyen de la même complétion réelle.
   Choisissez **Skip for now** pour quitter sans démarrer OpenClaw.
5. Conservez uniquement la route du modèle vérifiée ainsi que tout état d’identifiants ou de Plugin qu’elle
   requiert. Les paramètres de l’espace de travail et du Gateway restent inchangés.
6. Démarrez OpenClaw avec le modèle vérifié afin qu’il puisse configurer l’espace de travail,
   le Gateway, les canaux, les agents, les plugins et les autres éléments facultatifs de la configuration.

La réexécution de la commande sur une installation configurée teste d’abord le modèle actuellement défini
par défaut, ce qui transforme le processus guidé en une procédure de vérification et de réparation. Un échec
de vérification ne remplace jamais automatiquement le modèle configuré ; l’intégration s’interrompt et
demande comment continuer. Exécutez `openclaw channels add` ou `openclaw configure` pour
ajouter ultérieurement des éléments sans rapport avec l’inférence ; utilisez `openclaw onboard` pour modifier
le fournisseur ou la route d’authentification.

## Assistant classique : QuickStart ou Advanced

Exécutez `openclaw onboard --classic` pour ouvrir l’assistant complet. Il commence par proposer
**QuickStart** (valeurs par défaut) ou **Advanced** (contrôle total). Transmettez
`--flow quickstart` ou `--flow advanced` (alias `manual`) pour sélectionner le processus classique
et ignorer cette invite.

<Tabs>
  <Tab title="QuickStart (valeurs par défaut)">
    - Gateway local, liaison à l’interface de bouclage
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway : **18789**
    - Authentification du Gateway : **Token** (généré automatiquement, même sur l’interface de bouclage)
    - Politique des outils : `tools.profile: "coding"` pour les nouvelles configurations (un profil explicite existant est conservé)
    - Isolation des messages privés : `session.dmScope: "per-channel-peer"` pour les nouvelles configurations. Détails : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition via Tailscale : **Off**
    - Les messages privés Telegram et WhatsApp utilisent par défaut une **liste d’autorisation** : Telegram demande un identifiant numérique d’utilisateur Telegram, tandis que WhatsApp demande un numéro de téléphone

  </Tab>
  <Tab title="Advanced (contrôle total)">
    - Affiche toutes les étapes : mode, espace de travail, Gateway, canaux, daemon, Skills

  </Tab>
</Tabs>

Le mode distant (`--mode remote`) utilise toujours le processus avancé ; il se contente de
configurer cette machine pour qu’elle se connecte à un Gateway situé ailleurs et n’installe ni
ne modifie jamais quoi que ce soit sur l’hôte distant.

## Éléments configurés par l’intégration classique

Le mode local (par défaut) parcourt les étapes suivantes :

1. **Modèle/Authentification** - choisissez un processus d’authentification du fournisseur (clé API, OAuth ou
   authentification manuelle propre au fournisseur), y compris Fournisseur personnalisé
   (compatible avec OpenAI, compatible avec OpenAI Responses, compatible avec Anthropic ou
   détection automatique inconnue). Choisissez un modèle par défaut.
   Une nouvelle configuration par clé API OpenAI utilise par défaut `openai/gpt-5.6` (l’identifiant
   brut de l’API directe est résolu vers Sol) ; une nouvelle configuration ChatGPT/Codex utilise par défaut
   `openai/gpt-5.6-sol`. La réexécution de la configuration conserve tout modèle explicite existant,
   y compris `openai/gpt-5.5`. Sélectionnez explicitement `openai/gpt-5.5` si le
   compte ne donne pas accès à GPT-5.6.
   Remarque de sécurité : si cet agent doit exécuter des outils ou traiter le contenu de
   webhooks/hooks, privilégiez le modèle de dernière génération le plus puissant disponible et maintenez
   une politique stricte pour les outils ; les niveaux moins puissants ou plus anciens sont plus vulnérables aux injections de prompt.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références reposant sur l’environnement
   plutôt que des valeurs de clés API en texte brut ; la variable d’environnement référencée doit déjà
   être définie, faute de quoi l’intégration échoue immédiatement. En mode interactif, la référence du secret peut
   pointer vers une variable d’environnement ou une référence de fournisseur configurée (`file` ou
   `exec`), avec une vérification préalable rapide avant l’enregistrement. Après la configuration du modèle et de l’authentification,
   l’assistant propose un test facultatif de complétion en direct ; en cas d’échec, il est possible de revenir une fois à
   la configuration du modèle et de l’authentification ou d’ignorer l’échec sans bloquer le reste de
   l’assistant classique. L’ignorer ne déverrouille pas OpenClaw ; la configuration conversationnelle
   exige toujours une vérification d’inférence réussie.
2. **Espace de travail** - répertoire des fichiers de l’agent (par défaut `~/.openclaw/workspace`). Crée les fichiers d’amorçage.
3. **Gateway** - port, adresse de liaison, mode d’authentification, exposition via Tailscale. En
   mode interactif avec jeton, choisissez le stockage du jeton en texte brut (par défaut) ou optez
   pour une SecretRef. Chemin non interactif de la SecretRef : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** - canaux de discussion intégrés et fournis par des plugins officiels, notamment
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp et bien d’autres.
5. **Daemon** - installe un LaunchAgent (macOS), une unité utilisateur systemd
   (Linux/WSL2) ou une tâche planifiée Windows native, avec un mécanisme de secours par utilisateur
   dans le dossier Startup.
   Si l’authentification par jeton est requise et que `gateway.auth.token` est géré par une SecretRef,
   l’installation du daemon la valide, mais ne conserve aucun jeton résolu dans
   les métadonnées d’environnement du service de supervision ; une SecretRef non résolue bloque
   l’installation et fournit des instructions. Si `gateway.auth.token` et
   `gateway.auth.password` sont tous deux définis alors que `gateway.auth.mode` ne l’est pas, l’installation
   est bloquée jusqu’à ce que le mode soit défini explicitement.
6. **Vérification de l’état** - démarre le Gateway et vérifie qu’il est accessible.
7. **Skills** - installe les Skills recommandés et leurs dépendances facultatives.

<Note>
La réexécution de l’intégration n’efface **rien**, sauf si vous choisissez explicitement
**Reset** (ou transmettez `--reset`). La commande CLI `--reset` cible par défaut la configuration, les identifiants
et les sessions ; utilisez `--reset-scope full` pour supprimer également l’espace de travail. Si la
configuration n’est pas valide ou contient des clés héritées, l’intégration vous demande d’abord d’exécuter
`openclaw doctor`.
</Note>

`--flow import` exécute dans l’assistant classique un processus de migration détecté (par exemple Hermes)
au lieu d’une nouvelle configuration ; consultez [Migrer](/fr/cli/migrate) et les guides de migration sous
[Installation](/fr/install/migrating-hermes). `openclaw onboard --modern` est un
alias de compatibilité pour [OpenClaw](/cli/openclaw). Il utilise la même
barrière d’inférence que `openclaw setup` : une inférence vérifiée démarre
l’assistant, tandis qu’un échec interactif renvoie à la configuration guidée de l’inférence.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent distinct disposant de ses propres
espace de travail, sessions et profils d’authentification. Une exécution sans `--workspace` démarre
un processus interactif pour le nom, l’espace de travail, l’authentification, les canaux et les liaisons ; il ne s’agit
pas de l’assistant `openclaw onboard` complet.

Éléments définis :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Remarques :

- Espace de travail par défaut : `~/.openclaw/workspace-<agentId>` (ou sous
  `agents.defaults.workspace` si cette valeur est définie).
- Ajoutez `bindings` pour acheminer les messages entrants vers cet agent (l’intégration peut le faire pour vous).
- Options non interactives : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour connaître en détail le comportement étape par étape et les configurations produites, consultez la
[Référence de configuration de la CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation de la CLI](/fr/start/wizard-cli-automation).
Pour la référence complète des options, consultez [`openclaw onboard`](/fr/cli/onboard).

## Documentation associée

- Référence des commandes de la CLI : [`openclaw onboard`](/fr/cli/onboard)
- Présentation de l’intégration : [Présentation de l’intégration](/fr/start/onboarding-overview)
- Intégration de l’application macOS : [Intégration](/fr/start/onboarding)
- Rituel de premier démarrage de l’agent : [Amorçage de l’agent](/fr/start/bootstrapping)
