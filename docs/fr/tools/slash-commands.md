---
read_when:
    - Utiliser ou configurer des commandes de discussion
    - Déboguer le routage des commandes ou les autorisations
summary: 'Commandes slash : texte vs natif, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-04-23T07:12:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# Commandes slash

Les commandes sont gérées par la Gateway. La plupart des commandes doivent être envoyées comme un message **autonome** qui commence par `/`.
La commande de discussion bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Il existe deux systèmes liés :

- **Commandes** : messages autonomes `/...`.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Les directives sont retirées du message avant que le modèle ne le voie.
  - Dans les messages de discussion normaux (pas uniquement des directives), elles sont traitées comme des « indications inline » et **ne** persistent **pas** les paramètres de session.
  - Dans les messages contenant uniquement des directives (le message ne contient que des directives), elles persistent dans la session et répondent avec un accusé de réception.
  - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule
    liste d’autorisation utilisée ; sinon, l’autorisation provient des listes d’autorisation/d’association du canal plus `commands.useAccessGroups`.
    Les expéditeurs non autorisés voient les directives traitées comme du texte brut.

Il existe aussi quelques **raccourcis inline** (expéditeurs autorisés/sur liste d’autorisation uniquement) : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Ils s’exécutent immédiatement, sont retirés avant que le modèle ne voie le message, et le texte restant continue dans le flux normal.

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
  - Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes texte continuent de fonctionner même si vous définissez cette valeur à `false`.
- `commands.native` (par défaut `"auto"`) enregistre les commandes natives.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native.
  - Définissez `channels.discord.commands.native`, `channels.telegram.commands.native`, ou `channels.slack.commands.native` pour remplacer par fournisseur (booléen ou `"auto"`).
  - `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l’application Slack et ne sont pas supprimées automatiquement.
- `commands.nativeSkills` (par défaut `"auto"`) enregistre les commandes **Skills** en natif lorsqu’elles sont prises en charge.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack nécessite de créer une commande slash par Skill).
  - Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, ou `channels.slack.commands.nativeSkills` pour remplacer par fournisseur (booléen ou `"auto"`).
- `commands.bash` (par défaut `false`) active `! <cmd>` pour exécuter des commandes shell de l’hôte (`/bash <cmd>` est un alias ; requiert les listes d’autorisation `tools.elevated`).
- `commands.bashForegroundMs` (par défaut `2000`) contrôle combien de temps bash attend avant de passer en mode arrière-plan (`0` bascule immédiatement en arrière-plan).
- `commands.config` (par défaut `false`) active `/config` (lit/écrit `openclaw.json`).
- `commands.mcp` (par défaut `false`) active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`).
- `commands.plugins` (par défaut `false`) active `/plugins` (découverte/état des plugins plus contrôles d’installation + activation/désactivation).
- `commands.debug` (par défaut `false`) active `/debug` (remplacements réservés au runtime).
- `commands.restart` (par défaut `true`) active `/restart` ainsi que les actions d’outil de redémarrage de la Gateway.
- `commands.ownerAllowFrom` (facultatif) définit la liste d’autorisation explicite du propriétaire pour les surfaces de commande/d’outil réservées au propriétaire. Cette liste est distincte de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` par canal (facultatif, `false` par défaut) impose que les commandes réservées au propriétaire nécessitent une **identité de propriétaire** pour s’exécuter sur cette surface. Lorsque cette valeur vaut `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées de propriétaire natives du fournisseur), soit détenir la portée interne `operator.admin` sur un canal de message interne. Une entrée joker dans le canal `allowFrom`, ou une liste vide/non résolue de candidats propriétaires, n’est **pas** suffisante — les commandes réservées au propriétaire échouent en mode fermé sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient filtrées uniquement par `ownerAllowFrom` et les listes d’autorisation de commande standard.
- `commands.ownerDisplay` contrôle la façon dont les IDs du propriétaire apparaissent dans le prompt système : `raw` ou `hash`.
- `commands.ownerDisplaySecret` définit éventuellement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facultatif) définit une liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la
  seule source d’autorisation pour les commandes et directives (les listes d’autorisation/l’association de canal et `commands.useAccessGroups`
  sont ignorés). Utilisez `"*"` pour une valeur globale par défaut ; les clés spécifiques au fournisseur la remplacent.
- `commands.useAccessGroups` (par défaut `true`) applique les listes d’autorisation/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.

## Liste des commandes

Source de vérité actuelle :

- les built-ins du cœur proviennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées proviennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de plugin proviennent des appels `registerCommand()` des plugins
- la disponibilité réelle sur votre Gateway dépend toujours des indicateurs de configuration, de la surface du canal et des plugins installés/activés

### Commandes built-in du cœur

Commandes built-in disponibles aujourd’hui :

- `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
- `/reset soft [message]` conserve la transcription actuelle, supprime les IDs de session de backend CLI réutilisés, et relance en place le chargement du prompt de démarrage/système.
- `/compact [instructions]` compacte le contexte de session. Voir [/concepts/compaction](/fr/concepts/compaction).
- `/stop` interrompt l’exécution en cours.
- `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de liaison de fil.
- `/think <level>` définit le niveau de réflexion. Les options proviennent du profil fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium`, et `high`, avec des niveaux personnalisés comme `xhigh`, `adaptive`, `max`, ou binaire `on` uniquement là où cela est pris en charge. Aliases : `/thinking`, `/t`.
- `/verbose on|off|full` active ou désactive la sortie verbeuse. Alias : `/v`.
- `/trace on|off` active ou désactive la sortie de trace de Plugin pour la session actuelle.
- `/fast [status|on|off]` affiche ou définit le mode rapide.
- `/reasoning [on|off|stream]` active ou désactive la visibilité du raisonnement. Alias : `/reason`.
- `/elevated [on|off|ask|full]` active ou désactive le mode élevé. Alias : `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exec.
- `/model [name|#|status]` affiche ou définit le modèle.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs ou les modèles d’un fournisseur.
- `/queue <mode>` gère le comportement de file (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ainsi que des options comme `debounce:2s cap:25 drop:summarize`.
- `/help` affiche le court résumé d’aide.
- `/commands` affiche le catalogue de commandes généré.
- `/tools [compact|verbose]` affiche ce que l’agent actuel peut utiliser immédiatement.
- `/status` affiche l’état d’exécution, y compris l’usage/le quota fournisseur lorsqu’ils sont disponibles.
- `/tasks` liste les tâches en arrière-plan actives/récentes pour la session actuelle.
- `/context [list|detail|json]` explique comment le contexte est assemblé.
- `/export-session [path]` exporte la session actuelle en HTML. Alias : `/export`.
- `/export-trajectory [path]` exporte un [bundle de trajectoire](/fr/tools/trajectory) JSONL pour la session actuelle. Alias : `/trajectory`.
- `/whoami` affiche votre ID d’expéditeur. Alias : `/id`.
- `/skill <name> [input]` exécute une Skill par nom.
- `/allowlist [list|add|remove] ...` gère les entrées de liste d’autorisation. Texte uniquement.
- `/approve <id> <decision>` résout les invites d’approbation exec.
- `/btw <question>` pose une question secondaire sans modifier le contexte futur de la session. Voir [/tools/btw](/fr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agent pour la session actuelle.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options runtime.
- `/focus <target>` lie le fil Discord actuel ou le sujet/conversation Telegram à une cible de session.
- `/unfocus` supprime la liaison actuelle.
- `/agents` liste les agents liés au fil pour la session actuelle.
- `/kill <id|#|all>` interrompt un ou tous les sous-agents en cours d’exécution.
- `/steer <id|#> <message>` envoie un guidage à un sous-agent en cours d’exécution. Alias : `/tell`.
- `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Requiert `commands.config: true`.
- `/mcp show|get|set|unset` lit ou écrit la configuration du serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Requiert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Réservé au propriétaire pour les écritures. Requiert `commands.plugins: true`.
- `/debug show|set|unset|reset` gère les remplacements de configuration réservés au runtime. Réservé au propriétaire. Requiert `commands.debug: true`.
- `/usage off|tokens|full|cost` contrôle le pied de page d’usage par réponse ou affiche un résumé local des coûts.
- `/tts on|off|status|provider|limit|summary|audio|help` contrôle TTS. Voir [/tools/tts](/fr/tools/tts).
- `/restart` redémarre OpenClaw lorsqu’il est activé. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
- `/activation mention|always` définit le mode d’activation de groupe.
- `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.
- `/bash <command>` exécute une commande shell de l’hôte. Texte uniquement. Alias : `! <command>`. Requiert `commands.bash: true` plus les listes d’autorisation `tools.elevated`.
- `!poll [sessionId]` vérifie une tâche bash en arrière-plan.
- `!stop [sessionId]` arrête une tâche bash en arrière-plan.

### Commandes dock générées

Les commandes dock sont générées depuis les plugins de canal avec prise en charge des commandes natives. Ensemble intégré actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

### Commandes des plugins intégrés

Les plugins intégrés peuvent ajouter d’autres commandes slash. Commandes intégrées actuelles dans ce dépôt :

- `/dreaming [on|off|status|help]` active ou désactive Dreaming de la mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’association/configuration des appareils. Voir [Association](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` active temporairement les commandes de node de téléphone à haut risque.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration de la voix Talk. Sur Discord, le nom de commande natif est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecte et contrôle le harnais app-server Codex intégré. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes réservées à QQBot :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes Skills dynamiques

Les Skills invocables par l’utilisateur sont aussi exposées comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les Skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque la skill/le plugin les enregistre.
- l’enregistrement natif des commandes de Skills est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.

Remarques :

- Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accepte un alias de modèle, `provider/model`, ou un nom de fournisseur (correspondance approximative) ; s’il n’y a pas de correspondance, le texte est traité comme corps du message.
- Pour la ventilation complète de l’usage par fournisseur, utilisez `openclaw status --usage`.
- `/allowlist add|remove` requiert `commands.config=true` et respecte `configWrites` du canal.
- Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé configuration et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
- `/usage` contrôle le pied de page d’usage par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
- `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
- `/plugins install <spec>` accepte les mêmes spécifications de plugin que `openclaw plugins install` : chemin local/archive, package npm, ou `clawhub:<pkg>`.
- `/plugins enable|disable` met à jour la configuration du plugin et peut demander un redémarrage.
- Commande native réservée à Discord : `/vc join|leave|status` contrôle les canaux vocaux (requiert `channels.discord.voice` et les commandes natives ; non disponible en texte).
- Les commandes de liaison de fil Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requièrent que les liaisons de fil effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
- Référence des commandes ACP et comportement runtime : [Agents ACP](/fr/tools/acp-agents).
- `/verbose` est destiné au débogage et à une visibilité supplémentaire ; laissez-le **désactivé** en usage normal.
- `/trace` est plus étroit que `/verbose` : il ne révèle que les lignes de trace/débogage détenues par le plugin et laisse désactivé le bavardage normal verbeux des outils.
- `/fast on|off` persiste un remplacement de session. Utilisez l’option `inherit` de l’UI Sessions pour l’effacer et revenir aux valeurs par défaut de la configuration.
- `/fast` dépend du fournisseur : OpenAI/OpenAI Codex le mappe vers `service_tier=priority` sur les endpoints Responses natifs, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé vers `api.anthropic.com`, le mappent vers `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
- Les résumés d’échec d’outil sont toujours affichés lorsqu’ils sont pertinents, mais le texte détaillé d’échec n’est inclus que lorsque `/verbose` est `on` ou `full`.
- `/reasoning`, `/verbose`, et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler un raisonnement interne, des sorties d’outil, ou des diagnostics de plugin que vous ne vouliez pas exposer. Préférez les laisser désactivés, surtout dans les discussions de groupe.
- `/model` persiste immédiatement le nouveau modèle de session.
- Si l’agent est inactif, l’exécution suivante l’utilise immédiatement.
- Si une exécution est déjà active, OpenClaw marque un changement en direct comme en attente et ne redémarre vers le nouveau modèle qu’à un point de nouvelle tentative propre.
- Si une activité d’outil ou une sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité ultérieure de nouvelle tentative ou jusqu’au prochain tour utilisateur.
- **Chemin rapide :** les messages contenant uniquement des commandes provenant d’expéditeurs sur liste d’autorisation sont traités immédiatement (contournent la file + le modèle).
- **Filtrage par mention en groupe :** les messages contenant uniquement des commandes provenant d’expéditeurs sur liste d’autorisation contournent les exigences de mention.
- **Raccourcis inline (expéditeurs sur liste d’autorisation uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le texte restant.
  - Exemple : `hey /status` déclenche une réponse d’état, et le texte restant continue dans le flux normal.
- Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Les messages contenant uniquement des commandes provenant d’expéditeurs non autorisés sont silencieusement ignorés, et les jetons inline `/...` sont traités comme du texte brut.
- **Commandes de Skills :** les Skills `user-invocable` sont exposées comme commandes slash. Les noms sont assainis en `a-z0-9_` (max 32 caractères) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
  - `/skill <name> [input]` exécute une Skill par nom (utile lorsque les limites de commandes natives empêchent des commandes par Skill).
  - Par défaut, les commandes de Skills sont transmises au modèle comme une requête normale.
  - Les Skills peuvent éventuellement déclarer `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
  - Exemple : `/prose` (plugin OpenProse) — voir [OpenProse](/fr/prose).
- **Arguments de commandes natives :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus de boutons lorsque vous omettez des arguments obligatoires). Telegram et Slack affichent un menu de boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument.

## `/tools`

`/tools` répond à une question d’exécution, pas à une question de configuration : **ce que cet agent peut utiliser immédiatement dans
cette conversation**.

- `/tools` par défaut est compact et optimisé pour une lecture rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces à commande native qui prennent en charge les arguments exposent le même changement de mode `compact|verbose`.
- Les résultats sont limités à la session, donc changer d’agent, de canal, de fil, d’autorisation d’expéditeur ou de modèle peut
  modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l’exécution, y compris les outils du cœur, les outils
  de plugin connectés, et les outils détenus par le canal.

Pour l’édition des profils et remplacements, utilisez le panneau Outils de Control UI ou les surfaces de configuration/catalogue au lieu
de traiter `/tools` comme un catalogue statique.

## Surfaces d’usage (ce qui s’affiche où)

- **Usage/quota fournisseur** (exemple : « Claude 80% left ») s’affiche dans `/status` pour le fournisseur du modèle actuel lorsque le suivi d’usage est activé. OpenClaw normalise les fenêtres de fournisseur en `% restant` ; pour MiniMax, les champs de pourcentage restants seuls sont inversés avant affichage, et les réponses `model_remains` privilégient l’entrée du modèle de discussion plus un libellé de plan étiqueté par modèle.
- Les **lignes jetons/cache** dans `/status` peuvent revenir à la dernière entrée d’usage de transcription lorsque l’instantané live de session est pauvre. Les valeurs live existantes non nulles l’emportent toujours, et le repli depuis la transcription peut aussi récupérer le libellé du modèle runtime actif plus un total plus important orienté prompt lorsque les totaux stockés sont absents ou plus petits.
- Les **jetons/coût par réponse** sont contrôlés par `/usage off|tokens|full` (ajoutés aux réponses normales).
- `/model status` concerne les **modèles/authentification/endpoints**, pas l’usage.

## Sélection de modèle (`/model`)

`/model` est implémenté comme une directive.

Exemples :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Remarques :

- `/model` et `/model list` affichent un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec menus déroulants de fournisseur et de modèle plus une étape Submit.
- `/model <#>` sélectionne depuis ce sélecteur (et préfère si possible le fournisseur actuel).
- `/model status` affiche la vue détaillée, y compris l’endpoint fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de configuration **réservés au runtime** (en mémoire, pas sur disque). Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Remarques :

- Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration, mais n’écrivent **pas** dans `openclaw.json`.
- Utilisez `/debug reset` pour effacer tous les remplacements et revenir à la configuration sur disque.

## Sortie de trace de plugin

`/trace` vous permet d’activer ou désactiver des **lignes de trace/débogage de plugin limitées à la session** sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état actuel de la trace pour la session.
- `/trace on` active les lignes de trace du plugin pour la session actuelle.
- `/trace off` les désactive à nouveau.
- Les lignes de trace du plugin peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` continue de gérer les remplacements de configuration réservés au runtime.
- `/trace` ne remplace pas `/verbose` ; la sortie normale verbeuse des outils/états relève toujours de `/verbose`.

## Mises à jour de configuration

`/config` écrit dans votre configuration sur disque (`openclaw.json`). Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.config: true`.

Exemples :

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Remarques :

- La configuration est validée avant écriture ; les modifications invalides sont rejetées.
- Les mises à jour `/config` persistent après redémarrage.

## Mises à jour MCP

`/mcp` écrit les définitions de serveur MCP gérées par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.mcp: true`.

Exemples :

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Remarques :

- `/mcp` stocke la configuration dans la configuration OpenClaw, et non dans les paramètres de projet détenus par Pi.
- Les adaptateurs runtime décident quels transports sont réellement exécutables.

## Mises à jour de plugin

`/plugins` permet aux opérateurs d’inspecter les plugins découverts et de basculer leur activation dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Remarques :

- `/plugins list` et `/plugins show` utilisent la vraie découverte de plugins par rapport à l’espace de travail actuel plus la configuration sur disque.
- `/plugins enable|disable` met à jour uniquement la configuration du plugin ; cela n’installe ni ne désinstalle les plugins.
- Après des changements d’activation/désactivation, redémarrez la Gateway pour les appliquer.

## Remarques sur les surfaces

- Les **commandes texte** s’exécutent dans la session de discussion normale (les messages privés partagent `main`, les groupes ont leur propre session).
- Les **commandes natives** utilisent des sessions isolées :
  - Discord : `agent:<agentId>:discord:slash:<userId>`
  - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram : `telegram:slash:<userId>` (cible la session de discussion via `CommandTargetSessionKey`)
- **`/stop`** cible la session de discussion active afin de pouvoir interrompre l’exécution en cours.
- **Slack :** `channels.slack.slashCommand` reste pris en charge pour une seule commande de type `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande built-in (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont livrés sous forme de boutons Block Kit éphémères.
  - Exception native Slack : enregistrez `/agentstatus` (et non `/status`) parce que Slack réserve `/status`. La commande texte `/status` fonctionne toujours dans les messages Slack.

## Questions secondaires BTW

`/btw` est une **question secondaire** rapide sur la session en cours.

Contrairement à une discussion normale :

- elle utilise la session en cours comme contexte d’arrière-plan,
- elle s’exécute comme un appel ponctuel séparé **sans outil**,
- elle ne modifie pas le contexte futur de la session,
- elle n’est pas écrite dans l’historique de transcription,
- elle est livrée comme résultat secondaire en direct au lieu d’un message normal de l’assistant.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
```

Voir [Questions secondaires BTW](/fr/tools/btw) pour le comportement complet et les
détails d’UX client.
