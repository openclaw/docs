---
read_when:
    - Utilisation ou configuration des commandes de discussion
    - Débogage du routage des commandes ou des permissions
summary: 'Commandes slash : texte vs natif, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-04-25T13:59:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Les commandes sont gérées par la Gateway. La plupart des commandes doivent être envoyées comme un message **autonome** qui commence par `/`.
La commande de discussion bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Il existe deux systèmes liés :

- **Commandes** : messages autonomes `/...`.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Les directives sont retirées du message avant que le modèle ne le voie.
  - Dans les messages de discussion normaux (pas uniquement des directives), elles sont traitées comme des « indications inline » et ne conservent **pas** les paramètres de session.
  - Dans les messages contenant uniquement des directives (le message ne contient que des directives), elles sont conservées dans la session et répondent avec un accusé de réception.
  - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule
    liste d’autorisations utilisée ; sinon l’autorisation provient des listes d’autorisations/appairages du canal plus `commands.useAccessGroups`.
    Les expéditeurs non autorisés voient les directives traitées comme du texte brut.

Il existe aussi quelques **raccourcis inline** (expéditeurs autorisés/sur liste d’autorisations uniquement) : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Ils s’exécutent immédiatement, sont retirés avant que le modèle ne les voie, et le texte restant continue via le flux normal.

## Configuration

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (par défaut `true`) active l’analyse de `/...` dans les messages de discussion.
  - Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes texte continuent de fonctionner même si vous définissez cette option sur `false`.
- `commands.native` (par défaut `"auto"`) enregistre les commandes natives.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native.
  - Définissez `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` pour remplacer cela par fournisseur (booléen ou `"auto"`).
  - `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l’application Slack et ne sont pas supprimées automatiquement.
- `commands.nativeSkills` (par défaut `"auto"`) enregistre les commandes **Skills** de manière native lorsque c’est pris en charge.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack nécessite la création d’une commande slash par skill).
  - Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` pour remplacer cela par fournisseur (booléen ou `"auto"`).
- `commands.bash` (par défaut `false`) active `! <cmd>` pour exécuter des commandes shell hôte (`/bash <cmd>` est un alias ; nécessite des listes d’autorisations `tools.elevated`).
- `commands.bashForegroundMs` (par défaut `2000`) contrôle la durée d’attente de bash avant de passer en mode arrière-plan (`0` envoie immédiatement en arrière-plan).
- `commands.config` (par défaut `false`) active `/config` (lecture/écriture de `openclaw.json`).
- `commands.mcp` (par défaut `false`) active `/mcp` (lecture/écriture de la configuration MCP gérée par OpenClaw sous `mcp.servers`).
- `commands.plugins` (par défaut `false`) active `/plugins` (découverte/état des plugins plus contrôles d’installation + activation/désactivation).
- `commands.debug` (par défaut `false`) active `/debug` (remplacements runtime uniquement).
- `commands.restart` (par défaut `true`) active `/restart` plus les actions d’outil de redémarrage de gateway.
- `commands.ownerAllowFrom` (facultatif) définit la liste d’autorisations explicite du propriétaire pour les surfaces de commande/outils réservées au propriétaire. Cela est distinct de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` par canal (facultatif, par défaut `false`) impose que les commandes réservées au propriétaire nécessitent **l’identité du propriétaire** pour s’exécuter sur cette surface. Lorsque `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées natives de propriétaire du fournisseur), soit détenir la portée interne `operator.admin` sur un canal de message interne. Une entrée joker dans `allowFrom` du canal, ou une liste de candidats propriétaires vide/non résolue, n’est **pas** suffisante — les commandes réservées au propriétaire échouent en mode fermé sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient limitées uniquement par `ownerAllowFrom` et les listes d’autorisations de commandes standard.
- `commands.ownerDisplay` contrôle la façon dont les identifiants de propriétaire apparaissent dans le prompt système : `raw` ou `hash`.
- `commands.ownerDisplaySecret` définit éventuellement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facultatif) définit une liste d’autorisations par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la
  seule source d’autorisation pour les commandes et directives (les listes d’autorisations/appairages de canal et `commands.useAccessGroups`
  sont ignorés). Utilisez `"*"` pour une valeur globale par défaut ; les clés spécifiques à un fournisseur la remplacent.
- `commands.useAccessGroups` (par défaut `true`) applique les listes d’autorisations/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.

## Liste des commandes

Source de vérité actuelle :

- les commandes intégrées cœur proviennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées proviennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de plugin proviennent des appels `registerCommand()` des plugins
- la disponibilité réelle sur votre gateway dépend toujours des indicateurs de configuration, de la surface du canal et des plugins installés/activés

### Commandes intégrées cœur

Commandes intégrées disponibles aujourd’hui :

- `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
- `/reset soft [message]` conserve la transcription actuelle, supprime les identifiants de session de backend CLI réutilisés et relance en place le chargement du démarrage/prompt système.
- `/compact [instructions]` compacte le contexte de session. Voir [/concepts/compaction](/fr/concepts/compaction).
- `/stop` interrompt l’exécution en cours.
- `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de liaison de fil.
- `/think <level>` définit le niveau de réflexion. Les options proviennent du profil fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium` et `high`, avec des niveaux personnalisés comme `xhigh`, `adaptive`, `max`, ou le binaire `on` uniquement lorsqu’ils sont pris en charge. Alias : `/thinking`, `/t`.
- `/verbose on|off|full` active/désactive la sortie verbeuse. Alias : `/v`.
- `/trace on|off` active/désactive la sortie de trace des plugins pour la session courante.
- `/fast [status|on|off]` affiche ou définit le mode rapide.
- `/reasoning [on|off|stream]` active/désactive la visibilité du raisonnement. Alias : `/reason`.
- `/elevated [on|off|ask|full]` active/désactive le mode élevé. Alias : `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exécution.
- `/model [name|#|status]` affiche ou définit le modèle.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs ou les modèles pour un fournisseur.
- `/queue <mode>` gère le comportement de file (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus des options comme `debounce:2s cap:25 drop:summarize`.
- `/help` affiche le résumé d’aide court.
- `/commands` affiche le catalogue généré des commandes.
- `/tools [compact|verbose]` affiche ce que l’agent courant peut utiliser maintenant.
- `/status` affiche l’état d’exécution/runtime, y compris les libellés `Execution`/`Runtime` et l’usage/quota du fournisseur lorsqu’ils sont disponibles.
- `/crestodian <request>` exécute l’assistant de configuration et de réparation Crestodian depuis un message privé du propriétaire.
- `/tasks` liste les tâches d’arrière-plan actives/récentes pour la session courante.
- `/context [list|detail|json]` explique comment le contexte est assemblé.
- `/export-session [path]` exporte la session courante en HTML. Alias : `/export`.
- `/export-trajectory [path]` exporte un [bundle trajectory](/fr/tools/trajectory) JSONL pour la session courante. Alias : `/trajectory`.
- `/whoami` affiche votre identifiant d’expéditeur. Alias : `/id`.
- `/skill <name> [input]` exécute un skill par son nom.
- `/allowlist [list|add|remove] ...` gère les entrées de liste d’autorisations. Texte uniquement.
- `/approve <id> <decision>` résout les invites d’approbation d’exécution.
- `/btw <question>` pose une question secondaire sans modifier le contexte futur de la session. Voir [/tools/btw](/fr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agents pour la session courante.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options de runtime.
- `/focus <target>` lie le fil Discord courant ou le sujet/conversation Telegram à une cible de session.
- `/unfocus` supprime la liaison actuelle.
- `/agents` liste les agents liés au fil pour la session courante.
- `/kill <id|#|all>` interrompt un ou tous les sous-agents en cours d’exécution.
- `/steer <id|#> <message>` envoie une instruction de pilotage à un sous-agent en cours d’exécution. Alias : `/tell`.
- `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Nécessite `commands.config: true`.
- `/mcp show|get|set|unset` lit ou écrit la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Nécessite `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Écriture réservée au propriétaire. Nécessite `commands.plugins: true`.
- `/debug show|set|unset|reset` gère les remplacements de configuration runtime uniquement. Réservé au propriétaire. Nécessite `commands.debug: true`.
- `/usage off|tokens|full|cost` contrôle le pied de page d’usage par réponse ou affiche un résumé local des coûts.
- `/tts on|off|status|provider|limit|summary|audio|help` contrôle TTS. Voir [/tools/tts](/fr/tools/tts).
- `/restart` redémarre OpenClaw lorsqu’il est activé. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
- `/activation mention|always` définit le mode d’activation de groupe.
- `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.
- `/bash <command>` exécute une commande shell hôte. Texte uniquement. Alias : `! <command>`. Nécessite `commands.bash: true` plus des listes d’autorisations `tools.elevated`.
- `!poll [sessionId]` vérifie une tâche bash d’arrière-plan.
- `!stop [sessionId]` arrête une tâche bash d’arrière-plan.

### Commandes dock générées

Les commandes dock sont générées à partir de plugins de canal avec prise en charge des commandes natives. Ensemble inclus actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

### Commandes de plugins inclus

Les plugins inclus peuvent ajouter d’autres commandes slash. Commandes incluses actuelles dans ce dépôt :

- `/dreaming [on|off|status|help]` active/désactive le Dreaming mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/configuration des appareils. Voir [Appairage](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement les commandes de nœud de téléphone à haut risque.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration vocale de Talk. Sur Discord, le nom de commande natif est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecte et contrôle le harnais inclus Codex app-server. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes réservées à QQBot :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes de skills dynamiques

Les skills invocables par l’utilisateur sont aussi exposés comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque le skill/plugin les enregistre.
- l’enregistrement natif des commandes de skill est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.

Remarques :

- Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accepte un alias de modèle, `provider/model`, ou un nom de fournisseur (correspondance floue) ; s’il n’y a pas de correspondance, le texte est traité comme le corps du message.
- Pour la ventilation complète de l’usage par fournisseur, utilisez `openclaw status --usage`.
- `/allowlist add|remove` nécessite `commands.config=true` et respecte `configWrites` du canal.
- Dans les canaux multi-comptes, les commandes ciblées configuration `/allowlist --account <id>` et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
- `/usage` contrôle le pied de page d’usage par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
- `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
- `/plugins install <spec>` accepte les mêmes spécifications de plugin que `openclaw plugins install` : chemin/archive local, package npm, ou `clawhub:<pkg>`.
- `/plugins enable|disable` met à jour la configuration du plugin et peut demander un redémarrage.
- Commande native réservée à Discord : `/vc join|leave|status` contrôle les canaux vocaux (non disponible en texte). `join` nécessite une guilde et un canal vocal/scène sélectionné. Nécessite `channels.discord.voice` et les commandes natives.
- Les commandes de liaison de fil Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) nécessitent que les liaisons de fil effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
- Référence des commandes ACP et comportement du runtime : [ACP Agents](/fr/tools/acp-agents).
- `/verbose` est destiné au débogage et à une visibilité supplémentaire ; laissez-le **désactivé** en usage normal.
- `/trace` est plus ciblé que `/verbose` : il ne révèle que les lignes de trace/débogage détenues par les plugins et laisse désactivé le bavardage verbeux normal des outils.
- `/fast on|off` conserve un remplacement de session. Utilisez l’option `inherit` de l’interface Sessions pour l’effacer et revenir aux valeurs de configuration par défaut.
- `/fast` est spécifique au fournisseur : OpenAI/OpenAI Codex le mappe vers `service_tier=priority` sur les points de terminaison Responses natifs, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié OAuth envoyé à `api.anthropic.com`, le mappent vers `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
- Les résumés d’échec d’outil sont toujours affichés lorsqu’ils sont pertinents, mais le texte détaillé d’échec n’est inclus que lorsque `/verbose` est sur `on` ou `full`.
- `/reasoning`, `/verbose` et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler un raisonnement interne, la sortie d’outils ou des diagnostics de plugin que vous n’aviez pas l’intention d’exposer. Préférez les laisser désactivés, surtout dans les discussions de groupe.
- `/model` conserve immédiatement le nouveau modèle de session.
- Si l’agent est inactif, l’exécution suivante l’utilise immédiatement.
- Si une exécution est déjà active, OpenClaw marque un basculement live comme en attente et ne redémarre vers le nouveau modèle qu’à un point de réessai propre.
- Si une activité d’outil ou une sortie de réponse a déjà commencé, le basculement en attente peut rester en file jusqu’à une prochaine opportunité de réessai ou au tour utilisateur suivant.
- Dans la TUI locale, `/crestodian [request]` revient de la TUI normale de l’agent vers Crestodian. Cela est distinct du mode de secours sur canal de messages et n’accorde pas d’autorité de configuration distante.
- **Chemin rapide :** les messages contenant uniquement des commandes provenant d’expéditeurs sur liste d’autorisations sont traités immédiatement (contournent la file + le modèle).
- **Restriction par mention en groupe :** les messages contenant uniquement des commandes provenant d’expéditeurs sur liste d’autorisations contournent les exigences de mention.
- **Raccourcis inline (expéditeurs sur liste d’autorisations uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le texte restant.
  - Exemple : `hey /status` déclenche une réponse d’état, et le texte restant continue via le flux normal.
- Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Les messages contenant uniquement des commandes non autorisés sont silencieusement ignorés, et les jetons inline `/...` sont traités comme du texte brut.
- **Commandes de skill :** les Skills `user-invocable` sont exposés comme commandes slash. Les noms sont assainis en `a-z0-9_` (max 32 caractères) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
  - `/skill <name> [input]` exécute un skill par son nom (utile lorsque les limites des commandes natives empêchent les commandes par skill).
  - Par défaut, les commandes de skill sont transmises au modèle comme une requête normale.
  - Les Skills peuvent éventuellement déclarer `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
  - Exemple : `/prose` (plugin OpenProse) — voir [OpenProse](/fr/prose).
- **Arguments de commande native :** Discord utilise l’autocomplétion pour les options dynamiques (et les menus à boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu à boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument. Les choix dynamiques sont résolus par rapport au modèle de session cible, de sorte que les options spécifiques au modèle comme les niveaux `/think` suivent le remplacement `/model` de cette session.

## `/tools`

`/tools` répond à une question de runtime, pas à une question de configuration : **ce que cet agent peut utiliser maintenant
dans cette conversation**.

- `/tools` par défaut est compact et optimisé pour une lecture rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces de commande native qui prennent en charge les arguments exposent le même basculement de mode `compact|verbose`.
- Les résultats sont à portée de session, de sorte qu’un changement d’agent, de canal, de fil, d’autorisation d’expéditeur ou de modèle peut
  modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l’exécution, y compris les outils cœur, les outils
  de plugin connectés et les outils détenus par le canal.

Pour modifier les profils et remplacements, utilisez le panneau Tools de l’interface utilisateur de contrôle ou les surfaces de configuration/catalogue au lieu de traiter `/tools` comme un catalogue statique.

## Surfaces d’usage (ce qui s’affiche où)

- **Usage/quota fournisseur** (exemple : « Claude 80% left ») s’affiche dans `/status` pour le fournisseur du modèle courant lorsque le suivi d’usage est activé. OpenClaw normalise les fenêtres de fournisseur en `% left` ; pour MiniMax, les champs de pourcentage restant uniquement sont inversés avant affichage, et les réponses `model_remains` préfèrent l’entrée du modèle de chat plus une étiquette de plan balisée par modèle.
- **Lignes token/cache** dans `/status` peuvent se replier sur la dernière entrée d’usage de la transcription lorsque l’instantané live de la session est clairsemé. Les valeurs live non nulles existantes restent prioritaires, et le repli sur la transcription peut aussi récupérer l’étiquette du modèle runtime actif ainsi qu’un total orienté prompt plus grand lorsque les totaux stockés sont absents ou plus petits.
- **Exécution vs runtime :** `/status` signale `Execution` pour le chemin sandbox effectif et `Runtime` pour ce qui exécute réellement la session : `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP.
- **Tokens/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/authentifications/points de terminaison**, pas l’usage.

## Sélection de modèle (`/model`)

`/model` est implémenté comme une directive.

Exemples :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Remarques :

- `/model` et `/model list` affichent un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des listes déroulantes fournisseur et modèle plus une étape Submit.
- `/model <#>` sélectionne depuis ce sélecteur (et préfère le fournisseur courant lorsque c’est possible).
- `/model status` affiche la vue détaillée, y compris le point de terminaison fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de configuration **runtime uniquement** (en mémoire, pas sur disque). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Remarques :

- Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration, mais n’écrivent **pas** dans `openclaw.json`.
- Utilisez `/debug reset` pour effacer tous les remplacements et revenir à la configuration sur disque.

## Sortie de trace des plugins

`/trace` vous permet d’activer/désactiver des **lignes de trace/débogage de plugin à portée de session** sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état de trace de la session courante.
- `/trace on` active les lignes de trace de plugin pour la session courante.
- `/trace off` les désactive de nouveau.
- Les lignes de trace de plugin peuvent apparaître dans `/status` et sous forme de message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` continue de gérer les remplacements de configuration runtime uniquement.
- `/trace` ne remplace pas `/verbose` ; la sortie verbeuse normale des outils/états reste du ressort de `/verbose`.

## Mises à jour de configuration

`/config` écrit dans votre configuration sur disque (`openclaw.json`). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.config: true`.

Exemples :

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Remarques :

- La configuration est validée avant écriture ; les modifications invalides sont rejetées.
- Les mises à jour `/config` persistent après redémarrage.

## Mises à jour MCP

`/mcp` écrit les définitions de serveur MCP gérées par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.mcp: true`.

Exemples :

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Remarques :

- `/mcp` stocke la configuration dans la configuration OpenClaw, pas dans les paramètres de projet détenus par Pi.
- Les adaptateurs runtime décident quels transports sont réellement exécutables.

## Mises à jour de plugins

`/plugins` permet aux opérateurs d’inspecter les plugins découverts et de basculer leur activation dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez-le avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Remarques :

- `/plugins list` et `/plugins show` utilisent la véritable découverte de plugins sur l’espace de travail courant plus la configuration sur disque.
- `/plugins enable|disable` met uniquement à jour la configuration du plugin ; cela n’installe ni ne désinstalle les plugins.
- Après des changements enable/disable, redémarrez la gateway pour les appliquer.

## Remarques sur les surfaces

- **Les commandes texte** s’exécutent dans la session de discussion normale (les messages privés partagent `main`, les groupes ont leur propre session).
- **Les commandes natives** utilisent des sessions isolées :
  - Discord : `agent:<agentId>:discord:slash:<userId>`
  - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram : `telegram:slash:<userId>` (cible la session de discussion via `CommandTargetSessionKey`)
- **`/stop`** cible la session de discussion active afin de pouvoir interrompre l’exécution en cours.
- **Slack :** `channels.slack.slashCommand` est toujours pris en charge pour une seule commande de type `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont distribués sous forme de boutons Block Kit éphémères.
  - Exception native Slack : enregistrez `/agentstatus` (pas `/status`) car Slack réserve `/status`. Le texte `/status` continue de fonctionner dans les messages Slack.

## Questions secondaires BTW

`/btw` est une **question secondaire** rapide à propos de la session courante.

Contrairement à une discussion normale :

- il utilise la session courante comme contexte d’arrière-plan,
- il s’exécute comme un appel ponctuel **sans outils** distinct,
- il ne modifie pas le contexte futur de la session,
- il n’est pas écrit dans l’historique de transcription,
- il est distribué comme un résultat secondaire live au lieu d’un message d’assistant normal.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la
tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
```

Voir [Questions secondaires BTW](/fr/tools/btw) pour le comportement complet et les
détails UX côté client.

## Voir aussi

- [Skills](/fr/tools/skills)
- [Configuration des Skills](/fr/tools/skills-config)
- [Créer des Skills](/fr/tools/creating-skills)
