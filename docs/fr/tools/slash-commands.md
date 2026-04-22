---
read_when:
    - Utiliser ou configurer des commandes de chat
    - Déboguer le routage des commandes ou les autorisations
summary: 'Commandes slash : texte vs natives, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-04-22T04:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43cc050149de60ca39083009fd6ce566af3bfa79d455e2e0f44e2d878bf4d2d9
    source_path: tools/slash-commands.md
    workflow: 15
---

# Commandes slash

Les commandes sont gérées par la Gateway. La plupart des commandes doivent être envoyées comme un message **autonome** qui commence par `/`.
La commande de chat bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Il existe deux systèmes liés :

- **Commandes** : messages autonomes `/...`.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Les directives sont retirées du message avant que le modèle ne le voie.
  - Dans les messages de chat normaux (pas uniquement des directives), elles sont traitées comme des « indications inline » et **ne** persistent **pas** les paramètres de session.
  - Dans les messages composés uniquement de directives (le message ne contient que des directives), elles persistent dans la session et répondent avec un accusé de réception.
  - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule
    liste d’autorisation utilisée ; sinon l’autorisation provient des listes d’autorisation/appairages de canal ainsi que de `commands.useAccessGroups`.
    Les expéditeurs non autorisés voient les directives traitées comme du texte brut.

Il existe aussi quelques **raccourcis inline** (expéditeurs sur liste d’autorisation/autorisés uniquement) : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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

- `commands.text` (par défaut `true`) active l’analyse de `/...` dans les messages de chat.
  - Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes texte fonctionnent quand même même si vous définissez cette valeur à `false`.
- `commands.native` (par défaut `"auto"`) enregistre les commandes natives.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native.
  - Définissez `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` pour remplacer par fournisseur (booléen ou `"auto"`).
  - `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l’application Slack et ne sont pas supprimées automatiquement.
- `commands.nativeSkills` (par défaut `"auto"`) enregistre les commandes de **skill** nativement lorsque cela est pris en charge.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack exige la création d’une commande slash par skill).
  - Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` pour remplacer par fournisseur (booléen ou `"auto"`).
- `commands.bash` (par défaut `false`) active `! <cmd>` pour exécuter des commandes shell hôte (`/bash <cmd>` est un alias ; requiert les listes d’autorisation `tools.elevated`).
- `commands.bashForegroundMs` (par défaut `2000`) contrôle combien de temps bash attend avant de passer en mode arrière-plan (`0` passe immédiatement en arrière-plan).
- `commands.config` (par défaut `false`) active `/config` (lecture/écriture de `openclaw.json`).
- `commands.mcp` (par défaut `false`) active `/mcp` (lecture/écriture de la configuration MCP gérée par OpenClaw sous `mcp.servers`).
- `commands.plugins` (par défaut `false`) active `/plugins` (découverte/statut des Plugin ainsi que contrôles d’installation + activation/désactivation).
- `commands.debug` (par défaut `false`) active `/debug` (remplacements réservés au runtime).
- `commands.restart` (par défaut `true`) active `/restart` ainsi que les actions d’outil de redémarrage de la gateway.
- `commands.ownerAllowFrom` (facultatif) définit la liste d’autorisation explicite des propriétaires pour les surfaces de commande/outil réservées au propriétaire. Cela est distinct de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` par canal (facultatif, par défaut `false`) fait que les commandes réservées au propriétaire exigent une **identité propriétaire** pour s’exécuter sur cette surface. Lorsque cette valeur est `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées de propriétaire natives au fournisseur), soit détenir le scope interne `operator.admin` sur un canal de message interne. Une entrée joker dans `allowFrom` du canal, ou une liste vide/non résolue de candidats propriétaires, n’est **pas** suffisante — les commandes réservées au propriétaire échouent en mode fermé sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient contrôlées uniquement par `ownerAllowFrom` et les listes d’autorisation standard des commandes.
- `commands.ownerDisplay` contrôle la manière dont les ids propriétaires apparaissent dans le prompt système : `raw` ou `hash`.
- `commands.ownerDisplaySecret` définit facultativement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facultatif) définit une liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la
  seule source d’autorisation pour les commandes et directives (les listes d’autorisation/appairages de canal et `commands.useAccessGroups`
  sont ignorés). Utilisez `"*"` pour une valeur globale par défaut ; les clés spécifiques au fournisseur la remplacent.
- `commands.useAccessGroups` (par défaut `true`) applique les listes d’autorisation/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.

## Liste des commandes

Source de vérité actuelle :

- les intégrées du cœur proviennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées proviennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de Plugin proviennent des appels `registerCommand()` du Plugin
- la disponibilité réelle sur votre gateway dépend toujours des drapeaux de configuration, de la surface du canal et des Plugin installés/activés

### Commandes intégrées du cœur

Commandes intégrées disponibles aujourd’hui :

- `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
- `/reset soft [message]` conserve la transcription actuelle, supprime les ids de session backend CLI réutilisés, et relance sur place le chargement du prompt de démarrage/système.
- `/compact [instructions]` compacte le contexte de session. Voir [/concepts/compaction](/fr/concepts/compaction).
- `/stop` interrompt l’exécution en cours.
- `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de la liaison au fil.
- `/think <level>` définit le niveau de réflexion. Les options proviennent du profil fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium` et `high`, avec des niveaux personnalisés comme `xhigh`, `adaptive`, `max`, ou `on` binaire uniquement lorsque pris en charge. Alias : `/thinking`, `/t`.
- `/verbose on|off|full` active ou désactive la sortie détaillée. Alias : `/v`.
- `/trace on|off` active ou désactive la sortie de trace du Plugin pour la session actuelle.
- `/fast [status|on|off]` affiche ou définit le mode rapide.
- `/reasoning [on|off|stream]` active ou désactive la visibilité du raisonnement. Alias : `/reason`.
- `/elevated [on|off|ask|full]` active ou désactive le mode élevé. Alias : `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exécution.
- `/model [name|#|status]` affiche ou définit le modèle.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs ou les modèles d’un fournisseur.
- `/queue <mode>` gère le comportement de file d’attente (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ainsi que des options telles que `debounce:2s cap:25 drop:summarize`.
- `/help` affiche le résumé d’aide court.
- `/commands` affiche le catalogue de commandes généré.
- `/tools [compact|verbose]` affiche ce que l’agent actuel peut utiliser maintenant.
- `/status` affiche l’état d’exécution, y compris l’utilisation/le quota du fournisseur lorsque disponible.
- `/tasks` liste les tâches d’arrière-plan actives/récentes pour la session actuelle.
- `/context [list|detail|json]` explique comment le contexte est assemblé.
- `/export-session [path]` exporte la session actuelle en HTML. Alias : `/export`.
- `/whoami` affiche votre id expéditeur. Alias : `/id`.
- `/skill <name> [input]` exécute une skill par nom.
- `/allowlist [list|add|remove] ...` gère les entrées de liste d’autorisation. Texte uniquement.
- `/approve <id> <decision>` résout les invites d’approbation exec.
- `/btw <question>` pose une question annexe sans modifier le futur contexte de session. Voir [/tools/btw](/fr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agent pour la session actuelle.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options runtime.
- `/focus <target>` lie le fil Discord actuel ou le sujet/conversation Telegram à une cible de session.
- `/unfocus` supprime la liaison actuelle.
- `/agents` liste les agents liés à un fil pour la session actuelle.
- `/kill <id|#|all>` interrompt un ou tous les sous-agents en cours.
- `/steer <id|#> <message>` envoie un pilotage à un sous-agent en cours. Alias : `/tell`.
- `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Requiert `commands.config: true`.
- `/mcp show|get|set|unset` lit ou écrit la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Requiert `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des Plugin. `/plugin` est un alias. Réservé au propriétaire pour les écritures. Requiert `commands.plugins: true`.
- `/debug show|set|unset|reset` gère les remplacements de configuration réservés au runtime. Réservé au propriétaire. Requiert `commands.debug: true`.
- `/usage off|tokens|full|cost` contrôle le pied de page d’utilisation par réponse ou affiche un résumé local des coûts.
- `/tts on|off|status|provider|limit|summary|audio|help` contrôle TTS. Voir [/tools/tts](/fr/tools/tts).
- `/restart` redémarre OpenClaw lorsqu’il est activé. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
- `/activation mention|always` définit le mode d’activation de groupe.
- `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.
- `/bash <command>` exécute une commande shell hôte. Texte uniquement. Alias : `! <command>`. Requiert `commands.bash: true` ainsi que les listes d’autorisation `tools.elevated`.
- `!poll [sessionId]` vérifie un travail bash en arrière-plan.
- `!stop [sessionId]` arrête un travail bash en arrière-plan.

### Commandes dock générées

Les commandes dock sont générées à partir de Plugin de canal avec prise en charge des commandes natives. Ensemble fourni actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

### Commandes des Plugin fournis

Les Plugin fournis peuvent ajouter d’autres commandes slash. Commandes fournies actuelles dans ce dépôt :

- `/dreaming [on|off|status|help]` active ou désactive le Dreaming mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/configuration d’appareil. Voir [Appairage](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement des commandes de nœud téléphone à haut risque.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration de voix Talk. Sur Discord, le nom de commande native est `/talkvoice`.
- `/card ...` envoie des préréglages de carte enrichie LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecte et contrôle le harnais app-server Codex fourni. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes QQBot uniquement :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes de skill dynamiques

Les skills invocables par l’utilisateur sont aussi exposées comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque la skill/le Plugin les enregistre.
- l’enregistrement natif des commandes de skill est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.

Remarques :

- Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accepte un alias de modèle, `provider/model`, ou un nom de fournisseur (correspondance approximative) ; s’il n’y a pas de correspondance, le texte est traité comme corps du message.
- Pour le détail complet d’utilisation par fournisseur, utilisez `openclaw status --usage`.
- `/allowlist add|remove` requiert `commands.config=true` et respecte `configWrites` du canal.
- Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé configuration et `/config set channels.<provider>.accounts.<id>...` respectent également `configWrites` du compte cible.
- `/usage` contrôle le pied de page d’utilisation par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
- `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
- `/plugins install <spec>` accepte les mêmes spécifications de Plugin que `openclaw plugins install` : chemin/archive local, package npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` met à jour la configuration du Plugin et peut demander un redémarrage.
- Commande native réservée à Discord : `/vc join|leave|status` contrôle les canaux vocaux (requiert `channels.discord.voice` et les commandes natives ; non disponible en texte).
- Les commandes de liaison de fil Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) requièrent que les liaisons de fil effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
- Référence de commande ACP et comportement runtime : [Agents ACP](/fr/tools/acp-agents).
- `/verbose` est destiné au débogage et à une visibilité supplémentaire ; laissez-le **désactivé** en usage normal.
- `/trace` est plus étroit que `/verbose` : il ne révèle que les lignes de trace/débogage possédées par des Plugin et laisse désactivé le bavardage détaillé normal des outils.
- `/fast on|off` persiste un remplacement de session. Utilisez l’option `inherit` de l’UI Sessions pour l’effacer et revenir aux valeurs par défaut de la configuration.
- `/fast` est spécifique au fournisseur : OpenAI/OpenAI Codex le mappent à `service_tier=priority` sur les points de terminaison natifs Responses, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent à `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
- Les résumés d’échec d’outil sont toujours affichés lorsque pertinent, mais le texte détaillé d’échec n’est inclus que lorsque `/verbose` est `on` ou `full`.
- `/reasoning`, `/verbose` et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler un raisonnement interne, une sortie d’outil ou des diagnostics de Plugin que vous n’aviez pas l’intention d’exposer. Préférez les laisser désactivés, en particulier dans les discussions de groupe.
- `/model` persiste immédiatement le nouveau modèle de session.
- Si l’agent est inactif, l’exécution suivante l’utilise immédiatement.
- Si une exécution est déjà active, OpenClaw marque un changement à chaud comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
- Si l’activité d’outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité de nouvelle tentative ultérieure ou au prochain tour utilisateur.
- **Voie rapide :** les messages composés uniquement de commandes provenant d’expéditeurs sur liste d’autorisation sont traités immédiatement (contournent la file + le modèle).
- **Filtrage par mention en groupe :** les messages composés uniquement de commandes provenant d’expéditeurs sur liste d’autorisation contournent les exigences de mention.
- **Raccourcis inline (expéditeurs sur liste d’autorisation uniquement) :** certaines commandes fonctionnent également lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le texte restant.
  - Exemple : `hey /status` déclenche une réponse d’état, et le texte restant continue dans le flux normal.
- Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Les messages composés uniquement de commandes non autorisés sont ignorés silencieusement, et les jetons inline `/...` sont traités comme du texte brut.
- **Commandes de skill :** les skills `user-invocable` sont exposées comme commandes slash. Les noms sont assainis en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
  - `/skill <name> [input]` exécute une skill par nom (utile lorsque les limites de commandes natives empêchent des commandes par skill).
  - Par défaut, les commandes de skill sont transmises au modèle comme une requête normale.
  - Les skills peuvent déclarer facultativement `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
  - Exemple : `/prose` (Plugin OpenProse) — voir [OpenProse](/fr/prose).
- **Arguments des commandes natives :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus de boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu de boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument.

## `/tools`

`/tools` répond à une question d’exécution, et non à une question de configuration : **ce que cet agent peut utiliser maintenant dans
cette conversation**.

- Le `/tools` par défaut est compact et optimisé pour un balayage rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces de commande native qui prennent en charge les arguments exposent le même changement de mode que `compact|verbose`.
- Les résultats sont limités à la session, donc un changement d’agent, de canal, de fil, d’autorisation de l’expéditeur ou de modèle peut
  modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l’exécution, y compris les outils du cœur, les
  outils de Plugin connectés et les outils possédés par des canaux.

Pour l’édition des profils et remplacements, utilisez le panneau Outils de Control UI ou les surfaces config/catalogue au lieu
de traiter `/tools` comme un catalogue statique.

## Surfaces d’utilisation (ce qui s’affiche où)

- **Utilisation/quota du fournisseur** (exemple : « Claude 80% left ») s’affiche dans `/status` pour le fournisseur du modèle actuel lorsque le suivi d’utilisation est activé. OpenClaw normalise les fenêtres fournisseur en `% left` ; pour MiniMax, les champs de pourcentage restant uniquement sont inversés avant affichage, et les réponses `model_remains` privilégient l’entrée de modèle de chat plus un libellé de plan balisé par modèle.
- **Lignes de jetons/cache** dans `/status` peuvent revenir à la dernière entrée d’utilisation de transcription lorsque l’instantané de session en direct est clairsemé. Les valeurs en direct non nulles existantes gagnent toujours, et le repli de transcription peut également récupérer le libellé du modèle runtime actif ainsi qu’un total plus orienté prompt lorsque les totaux stockés sont manquants ou plus petits.
- **Jetons/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne **modèles/authentification/points de terminaison**, et non l’utilisation.

## Sélection du modèle (`/model`)

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
- `/model <#>` sélectionne depuis ce sélecteur (et préfère le fournisseur actuel lorsque possible).
- `/model status` affiche la vue détaillée, y compris le point de terminaison (`baseUrl`) du fournisseur configuré et le mode API (`api`) lorsque disponibles.

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

## Sortie de trace de Plugin

`/trace` vous permet d’activer ou désactiver des **lignes de trace/débogage de Plugin limitées à la session** sans activer le mode détaillé complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état actuel de trace de la session.
- `/trace on` active les lignes de trace de Plugin pour la session actuelle.
- `/trace off` les désactive à nouveau.
- Les lignes de trace de Plugin peuvent apparaître dans `/status` et sous forme de message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` gère toujours les remplacements de configuration réservés au runtime.
- `/trace` ne remplace pas `/verbose` ; la sortie détaillée normale des outils/statuts relève toujours de `/verbose`.

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

- La configuration est validée avant l’écriture ; les changements invalides sont rejetés.
- Les mises à jour `/config` persistent entre les redémarrages.

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

- `/mcp` stocke la configuration dans la configuration OpenClaw, et non dans les paramètres de projet possédés par Pi.
- Les adaptateurs runtime décident quels transports sont réellement exécutables.

## Mises à jour de Plugin

`/plugins` permet aux opérateurs d’inspecter les Plugin découverts et de basculer leur activation dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Remarques :

- `/plugins list` et `/plugins show` utilisent la vraie découverte de Plugin sur l’espace de travail actuel plus la configuration sur disque.
- `/plugins enable|disable` met à jour uniquement la configuration du Plugin ; il n’installe ni ne désinstalle les Plugin.
- Après des changements `enable|disable`, redémarrez la gateway pour les appliquer.

## Remarques sur les surfaces

- **Les commandes texte** s’exécutent dans la session de chat normale (les messages privés partagent `main`, les groupes ont leur propre session).
- **Les commandes natives** utilisent des sessions isolées :
  - Discord : `agent:<agentId>:discord:slash:<userId>`
  - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram : `telegram:slash:<userId>` (cible la session de chat via `CommandTargetSessionKey`)
- **`/stop`** cible la session de chat active afin de pouvoir interrompre l’exécution en cours.
- **Slack :** `channels.slack.slashCommand` reste pris en charge pour une seule commande de type `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont livrés sous forme de boutons Block Kit éphémères.
  - Exception native Slack : enregistrez `/agentstatus` (et non `/status`) car Slack réserve `/status`. Le texte `/status` fonctionne toujours dans les messages Slack.

## Questions annexes BTW

`/btw` est une **question annexe** rapide sur la session actuelle.

Contrairement au chat normal :

- elle utilise la session actuelle comme contexte d’arrière-plan,
- elle s’exécute comme un appel ponctuel **sans outil** distinct,
- elle ne modifie pas le futur contexte de session,
- elle n’est pas écrite dans l’historique de transcription,
- elle est livrée comme un résultat annexe en direct plutôt que comme un message normal de l’assistant.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la
tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
```

Voir [Questions annexes BTW](/fr/tools/btw) pour le comportement complet et les
détails UX client.
