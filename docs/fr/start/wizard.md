---
read_when:
    - Exécution ou configuration de l’intégration via la CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Intégration via la CLI : vérifiez l’inférence, puis confiez le reste de la configuration à Crestodian'
title: Intégration (CLI)
x-i18n:
    generated_at: "2026-07-12T16:00:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

L’intégration via la CLI est la méthode de configuration recommandée dans le terminal sous macOS, Linux et
Windows (natif ou WSL2). Par défaut, elle détecte l’accès à l’IA déjà disponible sur
la machine, le vérifie à l’aide d’une véritable complétion, puis démarre Crestodian afin de
configurer l’espace de travail, le Gateway et les fonctionnalités facultatives. `openclaw setup` exécute le même processus ([Configuration](/fr/cli/setup) décrit
la variante `--baseline` qui configure uniquement les paramètres). Les utilisateurs de l’application de bureau Windows peuvent également commencer
depuis le [Hub Windows](/fr/platforms/windows).

L’intégration guidée établit d’abord l’inférence. Elle détecte les accès à l’IA disponibles,
exige une véritable complétion, puis démarre seulement ensuite [Crestodian](/fr/cli/crestodian)
afin de configurer le reste d’OpenClaw. Le processus guidé ne propose ni Crestodian avant
l’inférence ni de moyen d’ignorer l’IA.

L’assistant classique reste disponible pour la connexion au fournisseur, la configuration
d’un Gateway distant, l’association des canaux, le contrôle du daemon, les Skills et les importations. Exécutez-le explicitement
avec `openclaw onboard --classic` ; l’écran des candidats d’inférence guidée ne
lui délègue pas le processus. Une fois l’inférence validée, Crestodian peut utiliser `open channel
wizard for <channel>` pour confier la configuration d’un canal nécessitant des secrets à un assistant
de terminal masqué. Pour changer le fournisseur du modèle ou son authentification, quittez
Crestodian et exécutez `openclaw onboard` ; Crestodian n’ouvre pas les processus guidés ou
classiques des fournisseurs.

<Info>
Pour démarrer votre première discussion au plus vite : terminez la configuration guidée, exécutez `openclaw dashboard`, puis discutez dans
le navigateur au moyen de l’interface de contrôle. Documentation : [Tableau de bord](/fr/web/dashboard).
</Info>

## Paramètres régionaux

L’assistant localise le texte fixe de l’intégration. Ordre de résolution : `OPENCLAW_LOCALE`,
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
L’assistant classique comprend une étape de recherche Web permettant de choisir un fournisseur : Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG ou Tavily. Certains nécessitent une clé d’API ; d’autres
n’en nécessitent pas. Configurez cette option ultérieurement avec `openclaw configure --section web`. Documentation :
[Outils Web](/fr/tools/web).
</Tip>

## Processus guidé par défaut

La commande simple `openclaw onboard` suit ce processus :

1. Acceptez l’avis de sécurité.
2. Détectez les modèles configurés, les variables d’environnement contenant des clés d’API et les
   CLI d’IA locales prises en charge.
3. Testez le premier candidat détecté à l’aide d’une véritable complétion. En cas d’échec, affichez la
   raison et passez au candidat utilisable suivant.
4. Si la détection ne trouve plus de candidats, réessayez avec un candidat détecté ou saisissez une clé d’API
   de fournisseur dans une invite masquée. L’intégration guidée
   ne propose ni Crestodian ni de sortie permettant d’ignorer l’IA avant que l’inférence fonctionne.
5. Enregistrez uniquement la route du modèle vérifié ainsi que l’état des identifiants/plugins
   dont elle dépend. Les paramètres de l’espace de travail et du Gateway restent inchangés.
6. Démarrez Crestodian avec le modèle vérifié afin qu’il puisse configurer l’espace de travail,
   le Gateway, les canaux, les agents, les plugins et le reste de la configuration facultative.

La réexécution de la commande sur une installation configurée teste d’abord le modèle
par défaut actuel, ce qui transforme le processus guidé en une procédure de vérification et de réparation. Un échec
de vérification ne remplace jamais automatiquement le modèle configuré ; l’intégration s’arrête et
vous demande comment continuer. Exécutez `openclaw channels add` ou `openclaw configure` pour
ajouter ultérieurement des éléments sans rapport avec l’inférence ; utilisez `openclaw onboard` pour modifier le fournisseur ou la route
d’authentification.

## Assistant classique : démarrage rapide ou avancé

Exécutez `openclaw onboard --classic` pour ouvrir l’assistant complet. Il commence par vous
proposer de choisir entre **Démarrage rapide** (valeurs par défaut) et **Avancé** (contrôle complet). Utilisez
`--flow quickstart` ou `--flow advanced` (alias `manual`) pour sélectionner le processus classique
et ignorer cette invite.

<Tabs>
  <Tab title="Démarrage rapide (valeurs par défaut)">
    - Gateway local, liaison sur l’interface de bouclage
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway **18789**
    - Authentification du Gateway par **jeton** (généré automatiquement, même sur l’interface de bouclage)
    - Politique des outils : `tools.profile: "coding"` pour les nouvelles configurations (un profil explicite existant est conservé)
    - Isolation des messages privés : `session.dmScope: "per-channel-peer"` pour les nouvelles configurations. Détails : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale **désactivée**
    - Les messages privés Telegram et WhatsApp utilisent par défaut une **liste d’autorisation** : Telegram demande un identifiant utilisateur Telegram numérique, tandis que WhatsApp demande un numéro de téléphone

  </Tab>
  <Tab title="Avancé (contrôle complet)">
    - Présente toutes les étapes : mode, espace de travail, Gateway, canaux, daemon, Skills

  </Tab>
</Tabs>

Le mode distant (`--mode remote`) utilise toujours le processus avancé ; il
configure uniquement cette machine pour se connecter à un Gateway situé ailleurs et n’installe ni
ne modifie jamais quoi que ce soit sur l’hôte distant.

## Ce que configure l’intégration classique

Le mode local (par défaut) vous guide à travers les étapes suivantes :

1. **Modèle/authentification** - choisissez un processus d’authentification du fournisseur (clé d’API, OAuth ou
   authentification manuelle propre au fournisseur), y compris un fournisseur personnalisé
   (compatible avec OpenAI, compatible avec OpenAI Responses, compatible avec Anthropic ou
   détection automatique inconnue). Choisissez un modèle par défaut.
   Une nouvelle configuration avec une clé d’API OpenAI utilise par défaut `openai/gpt-5.6` (l’identifiant
   simple de l’API directe correspond à Sol) ; une nouvelle configuration ChatGPT/Codex utilise par défaut
   `openai/gpt-5.6-sol`. La réexécution de la configuration conserve un modèle explicite existant,
   y compris `openai/gpt-5.5`. Sélectionnez explicitement `openai/gpt-5.5` si le
   compte ne donne pas accès à GPT-5.6.
   Remarque de sécurité : si cet agent doit exécuter des outils ou traiter le contenu
   de webhooks/hooks, privilégiez le modèle de dernière génération le plus performant disponible et conservez
   une politique d’outils stricte : les niveaux moins performants ou plus anciens sont plus vulnérables aux injections de prompts.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références adossées à des variables
   d’environnement plutôt que les valeurs des clés d’API en texte brut ; la variable d’environnement référencée doit déjà
   être définie, sinon l’intégration échoue immédiatement. Le mode interactif de référence des secrets peut
   pointer vers une variable d’environnement ou une référence de fournisseur configurée (`file` ou
   `exec`), avec une vérification préalable rapide avant l’enregistrement. Après la configuration du modèle/de l’authentification,
   l’assistant propose un test facultatif de complétion en direct ; en cas d’échec, vous pouvez revenir une fois à
   la configuration du modèle/de l’authentification ou ignorer l’échec sans bloquer le reste de
   l’assistant classique. L’ignorer ne déverrouille pas Crestodian ; la configuration conversationnelle
   exige toujours une vérification d’inférence réussie.
2. **Espace de travail** - répertoire des fichiers de l’agent (par défaut `~/.openclaw/workspace`). Initialise les fichiers d’amorçage.
3. **Gateway** - port, adresse de liaison, mode d’authentification, exposition Tailscale. En
   mode interactif avec jeton, choisissez le stockage du jeton en texte brut (par défaut) ou optez
   pour un SecretRef. Chemin SecretRef non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** - canaux de discussion intégrés et plugins officiels, notamment
   Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams,
   QQ Bot, Signal, Slack, Telegram, WhatsApp et d’autres.
5. **Daemon** - installe un LaunchAgent (macOS), une unité utilisateur systemd
   (Linux/WSL2) ou une tâche planifiée Windows native avec un mécanisme de secours par utilisateur
   dans le dossier de démarrage.
   Si l’authentification par jeton est requise et que `gateway.auth.token` est géré par SecretRef,
   l’installation du daemon le valide, mais n’enregistre pas le jeton résolu dans
   les métadonnées d’environnement du service du superviseur ; un SecretRef non résolu bloque
   l’installation et affiche des instructions. Si `gateway.auth.token` et
   `gateway.auth.password` sont tous deux définis alors que `gateway.auth.mode` ne l’est pas, l’installation
   est bloquée jusqu’à ce que vous définissiez explicitement le mode.
6. **Vérification de l’état** - démarre le Gateway et vérifie qu’il est accessible.
7. **Skills** - installe les Skills recommandés et leurs dépendances facultatives.

<Note>
La réexécution de l’intégration ne supprime **rien**, sauf si vous choisissez explicitement
**Réinitialiser** (ou utilisez `--reset`). Dans la CLI, `--reset` réinitialise par défaut la configuration, les identifiants
et les sessions ; utilisez `--reset-scope full` pour supprimer également l’espace de travail. Si la
configuration est invalide ou contient d’anciennes clés, l’intégration vous demande d’abord d’exécuter
`openclaw doctor`.
</Note>

`--flow import` exécute un processus de migration détecté (par exemple Hermes) dans
l’assistant classique au lieu d’une nouvelle configuration ; consultez [Migrer](/fr/cli/migrate) et les guides de migration sous
[Installation](/fr/install/migrating-hermes). `openclaw onboard --modern` est un
alias de compatibilité pour [Crestodian](/fr/cli/crestodian). Il utilise la même
condition d’inférence que `openclaw crestodian` : une inférence vérifiée démarre
l’assistant, tandis qu’un échec interactif renvoie à la configuration guidée de l’inférence.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent distinct disposant de ses propres
espace de travail, sessions et profils d’authentification. Une exécution sans `--workspace` démarre
un processus interactif pour le nom, l’espace de travail, l’authentification, les canaux et les liaisons ; il ne s’agit
pas de l’assistant complet `openclaw onboard`.

Paramètres définis :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Remarques :

- Espace de travail par défaut : `~/.openclaw/workspace-<agentId>` (ou sous
  `agents.defaults.workspace` si cette valeur est définie).
- Ajoutez des `bindings` pour acheminer les messages entrants vers cet agent (l’intégration peut le faire pour vous).
- Options non interactives : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour obtenir une description détaillée du comportement étape par étape et des résultats de configuration, consultez la
[Référence de configuration de la CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation de la CLI](/fr/start/wizard-cli-automation).
Pour la référence complète des options, consultez [`openclaw onboard`](/fr/cli/onboard).

## Documentation associée

- Référence des commandes de la CLI : [`openclaw onboard`](/fr/cli/onboard)
- Présentation de l’intégration : [Présentation de l’intégration](/fr/start/onboarding-overview)
- Intégration de l’application macOS : [Intégration](/fr/start/onboarding)
- Rituel de premier démarrage de l’agent : [Amorçage de l’agent](/fr/start/bootstrapping)
