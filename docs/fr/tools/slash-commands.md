---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
sidebarTitle: Slash commands
summary: 'Commandes slash : texte vs natives, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-04-26T11:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

Les commandes sont gérées par le Gateway. La plupart des commandes doivent être envoyées comme un message **autonome** qui commence par `/`. La commande de chat bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Lorsqu’une conversation ou un fil est lié à une session ACP, le texte de suivi normal est routé vers ce harnais ACP. Les commandes de gestion Gateway restent locales : `/acp ...` atteint toujours le gestionnaire de commandes ACP OpenClaw, et `/status` ainsi que `/unfocus` restent locaux dès que la gestion des commandes est activée pour la surface.

Il existe deux systèmes liés :

<AccordionGroup>
  <Accordion title="Commandes">
    Messages `/...` autonomes.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Les directives sont retirées du message avant que le modèle ne le voie.
    - Dans les messages de chat normaux (pas uniquement composés de directives), elles sont traitées comme des « indications en ligne » et ne persistent **pas** les réglages de session.
    - Dans les messages composés uniquement de directives (le message ne contient que des directives), elles persistent dans la session et répondent avec un accusé de réception.
    - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule liste d’autorisation utilisée ; sinon, l’autorisation provient des listes d’autorisation/appairages du canal plus `commands.useAccessGroups`. Les expéditeurs non autorisés voient les directives traitées comme du texte brut.

  </Accordion>
  <Accordion title="Raccourcis en ligne">
    Expéditeurs autorisés/sur liste d’autorisation uniquement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Ils s’exécutent immédiatement, sont retirés avant que le modèle ne voie le message, et le texte restant continue dans le flux normal.

  </Accordion>
</AccordionGroup>

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

<ParamField path="commands.text" type="boolean" default="true">
  Active l’analyse de `/...` dans les messages de chat. Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes textuelles fonctionnent toujours même si vous définissez cette valeur sur `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes natives. Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native. Définissez `channels.discord.commands.native`, `channels.telegram.commands.native`, ou `channels.slack.commands.native` pour remplacer par fournisseur (bool ou `"auto"`). `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l’application Slack et ne sont pas supprimées automatiquement.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes **Skills** de manière native lorsque c’est pris en charge. Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack nécessite la création d’une commande slash par skill). Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, ou `channels.slack.commands.nativeSkills` pour remplacer par fournisseur (bool ou `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Active `! <cmd>` pour exécuter des commandes shell sur l’hôte (`/bash <cmd>` est un alias ; nécessite les listes d’autorisation `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Contrôle la durée d’attente de bash avant de passer en mode arrière-plan (`0` passe immédiatement en arrière-plan).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Active `/config` (lit/écrit `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Active `/plugins` (découverte/statut des plugins plus contrôles d’installation et d’activation/désactivation).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Active `/debug` (remplacements à l’exécution uniquement).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Active `/restart` ainsi que les actions d’outil de redémarrage du gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Définit la liste d’autorisation explicite du propriétaire pour les surfaces de commande/d’outil réservées au propriétaire. Séparée de `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Par canal : impose que les commandes réservées au propriétaire nécessitent une **identité propriétaire** pour s’exécuter sur cette surface. Lorsque la valeur est `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées natives propriétaire du fournisseur), soit disposer du scope interne `operator.admin` sur un canal de message interne. Une entrée joker dans `allowFrom` du canal, ou une liste de candidats propriétaires vide/non résolue, n’est **pas** suffisante — les commandes réservées au propriétaire échouent en mode fermé sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient limitées uniquement par `ownerAllowFrom` et les listes d’autorisation de commande standard.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Contrôle la manière dont les identifiants du propriétaire apparaissent dans l’invite système.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Définit éventuellement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la seule source d’autorisation pour les commandes et directives (les listes d’autorisation/appairages du canal et `commands.useAccessGroups` sont ignorés). Utilisez `"*"` pour une valeur par défaut globale ; les clés spécifiques au fournisseur la remplacent.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applique les listes d’autorisation/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.
</ParamField>

## Liste des commandes

Source de vérité actuelle :

- les intégrées du noyau proviennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées proviennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de plugin proviennent des appels `registerCommand()` du plugin
- la disponibilité réelle sur votre gateway dépend toujours des drapeaux de configuration, de la surface du canal, et des plugins installés/activés

### Commandes intégrées du noyau

<AccordionGroup>
  <Accordion title="Sessions et exécutions">
    - `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
    - `/reset soft [message]` conserve la transcription actuelle, supprime les identifiants de session backend CLI réutilisés, et relance sur place le chargement de démarrage/de l’invite système.
    - `/compact [instructions]` compacte le contexte de session. Voir [Compaction](/fr/concepts/compaction).
    - `/stop` annule l’exécution en cours.
    - `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de liaison au fil.
    - `/export-session [path]` exporte la session actuelle vers HTML. Alias : `/export`.
    - `/export-trajectory [path]` exporte un [bundle de trajectoire](/fr/tools/trajectory) JSONL pour la session actuelle. Alias : `/trajectory`.

  </Accordion>
  <Accordion title="Contrôles du modèle et de l’exécution">
    - `/think <level>` définit le niveau de réflexion. Les options proviennent du profil fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium`, et `high`, avec des niveaux personnalisés tels que `xhigh`, `adaptive`, `max`, ou le binaire `on` uniquement lorsque pris en charge. Alias : `/thinking`, `/t`.
    - `/verbose on|off|full` active ou désactive la sortie détaillée. Alias : `/v`.
    - `/trace on|off` active ou désactive la sortie de trace du plugin pour la session actuelle.
    - `/fast [status|on|off]` affiche ou définit le mode rapide.
    - `/reasoning [on|off|stream]` active ou désactive la visibilité du raisonnement. Alias : `/reason`.
    - `/elevated [on|off|ask|full]` active ou désactive le mode élevé. Alias : `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exécution.
    - `/model [name|#|status]` affiche ou définit le modèle.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs ou les modèles d’un fournisseur.
    - `/queue <mode>` gère le comportement de file d’attente (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ainsi que des options comme `debounce:2s cap:25 drop:summarize`.

  </Accordion>
  <Accordion title="Découverte et statut">
    - `/help` affiche le résumé d’aide court.
    - `/commands` affiche le catalogue de commandes généré.
    - `/tools [compact|verbose]` affiche ce que l’agent actuel peut utiliser maintenant.
    - `/status` affiche le statut d’exécution/runtime, y compris les libellés `Execution`/`Runtime` et l’utilisation/quota du fournisseur lorsqu’ils sont disponibles.
    - `/crestodian <request>` exécute l’assistant de configuration et de réparation Crestodian depuis un message privé du propriétaire.
    - `/tasks` liste les tâches d’arrière-plan actives/récentes pour la session actuelle.
    - `/context [list|detail|json]` explique comment le contexte est assemblé.
    - `/whoami` affiche votre identifiant d’expéditeur. Alias : `/id`.
    - `/usage off|tokens|full|cost` contrôle le pied de page d’utilisation par réponse ou affiche un résumé local des coûts.

  </Accordion>
  <Accordion title="Skills, listes d’autorisation, approbations">
    - `/skill <name> [input]` exécute une skill par son nom.
    - `/allowlist [list|add|remove] ...` gère les entrées de la liste d’autorisation. Texte uniquement.
    - `/approve <id> <decision>` résout les invites d’approbation d’exécution.
    - `/btw <question>` pose une question parallèle sans modifier le contexte futur de la session. Voir [BTW](/fr/tools/btw).

  </Accordion>
  <Accordion title="Sous-agents et ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agents pour la session actuelle.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options d’exécution.
    - `/focus <target>` lie le fil Discord actuel ou le sujet/conversation Telegram à une cible de session.
    - `/unfocus` supprime la liaison actuelle.
    - `/agents` liste les agents liés au fil pour la session actuelle.
    - `/kill <id|#|all>` annule un ou tous les sous-agents en cours d’exécution.
    - `/steer <id|#> <message>` envoie une instruction à un sous-agent en cours d’exécution. Alias : `/tell`.

  </Accordion>
  <Accordion title="Écritures réservées au propriétaire et administration">
    - `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Nécessite `commands.config: true`.
    - `/mcp show|get|set|unset` lit ou écrit la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Nécessite `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Réservé au propriétaire pour les écritures. Nécessite `commands.plugins: true`.
    - `/debug show|set|unset|reset` gère les remplacements de configuration à l’exécution uniquement. Réservé au propriétaire. Nécessite `commands.debug: true`.
    - `/restart` redémarre OpenClaw lorsqu’il est activé. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
    - `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.

  </Accordion>
  <Accordion title="Voix, TTS, contrôle du canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` contrôle le TTS. Voir [TTS](/fr/tools/tts).
    - `/activation mention|always` définit le mode d’activation du groupe.
    - `/bash <command>` exécute une commande shell sur l’hôte. Texte uniquement. Alias : `! <command>`. Nécessite `commands.bash: true` ainsi que les listes d’autorisation `tools.elevated`.
    - `!poll [sessionId]` vérifie une tâche bash en arrière-plan.
    - `!stop [sessionId]` arrête une tâche bash en arrière-plan.

  </Accordion>
</AccordionGroup>

### Commandes dock générées

Les commandes dock sont générées à partir des plugins de canal avec prise en charge des commandes natives. Ensemble intégré actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

### Commandes de Plugin intégrées

Les Plugins intégrés peuvent ajouter d’autres commandes slash. Commandes intégrées actuelles dans ce dépôt :

- `/dreaming [on|off|status|help]` active ou désactive le Dreaming de la mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/de configuration des appareils. Voir [Appairage](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement les commandes à haut risque des nœuds téléphone.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration de la voix Talk. Sur Discord, le nom de la commande native est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecte et contrôle le harnais app-server Codex intégré. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes QQBot uniquement :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes Skills dynamiques

Les Skills invocables par l’utilisateur sont aussi exposées comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les Skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque la skill/le plugin les enregistre.
- l’enregistrement natif des commandes Skills est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Remarques sur les arguments et l’analyseur">
    - Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepte un alias de modèle, `provider/model`, ou un nom de fournisseur (correspondance approximative) ; si aucune correspondance n’est trouvée, le texte est traité comme le corps du message.
    - Pour la ventilation complète de l’usage par fournisseur, utilisez `openclaw status --usage`.
    - `/allowlist add|remove` nécessite `commands.config=true` et respecte `configWrites` du canal.
    - Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé sur la configuration et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
    - `/usage` contrôle le pied de page d’usage par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
    - `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
    - `/plugins install <spec>` accepte les mêmes spécifications de plugin que `openclaw plugins install` : chemin/archive local, package npm, ou `clawhub:<pkg>`.
    - `/plugins enable|disable` met à jour la configuration du plugin et peut demander un redémarrage.

  </Accordion>
  <Accordion title="Comportement spécifique au canal">
    - Commande native Discord uniquement : `/vc join|leave|status` contrôle les canaux vocaux (non disponible en texte). `join` nécessite un serveur et un canal vocal/stage sélectionné. Nécessite `channels.discord.voice` et les commandes natives.
    - Les commandes de liaison de fil Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigent que les liaisons de fil effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
    - Référence des commandes ACP et comportement d’exécution : [Agents ACP](/fr/tools/acp-agents).

  </Accordion>
  <Accordion title="Sécurité de verbose / trace / fast / reasoning">
    - `/verbose` est destiné au débogage et à une visibilité accrue ; laissez-le **désactivé** en usage normal.
    - `/trace` est plus ciblé que `/verbose` : il ne révèle que les lignes de trace/débogage propres au plugin et laisse désactivé le bavardage normal détaillé des outils.
    - `/fast on|off` persiste un remplacement de session. Utilisez l’option `inherit` de l’UI Sessions pour l’effacer et revenir aux valeurs par défaut de la configuration.
    - `/fast` est spécifique au fournisseur : OpenAI/OpenAI Codex le mappe sur `service_tier=priority` sur les points de terminaison Responses natifs, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent sur `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
    - Les résumés d’échec d’outil sont toujours affichés lorsqu’ils sont pertinents, mais le texte d’échec détaillé n’est inclus que lorsque `/verbose` vaut `on` ou `full`.
    - `/reasoning`, `/verbose`, et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler le raisonnement interne, la sortie des outils, ou les diagnostics du plugin que vous n’aviez pas l’intention d’exposer. Préférez les laisser désactivés, surtout dans les discussions de groupe.

  </Accordion>
  <Accordion title="Changement de modèle">
    - `/model` persiste immédiatement le nouveau modèle de session.
    - Si l’agent est inactif, la prochaine exécution l’utilise tout de suite.
    - Si une exécution est déjà active, OpenClaw marque un changement en direct comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
    - Si l’activité des outils ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité de nouvelle tentative ultérieure ou jusqu’au prochain tour utilisateur.
    - Dans le TUI local, `/crestodian [request]` revient du TUI normal de l’agent vers Crestodian. C’est distinct du mode de secours du canal de messages et n’accorde pas d’autorité de configuration à distance.

  </Accordion>
  <Accordion title="Chemin rapide et raccourcis en ligne">
    - **Chemin rapide :** les messages composés uniquement de commandes provenant d’expéditeurs sur liste d’autorisation sont traités immédiatement (contournent la file d’attente + le modèle).
    - **Contrôle des mentions en groupe :** les messages composés uniquement de commandes provenant d’expéditeurs sur liste d’autorisation contournent les exigences de mention.
    - **Raccourcis en ligne (expéditeurs sur liste d’autorisation uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le texte restant.
      - Exemple : `hey /status` déclenche une réponse de statut, et le texte restant continue dans le flux normal.
    - Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Les messages composés uniquement de commandes mais non autorisés sont ignorés silencieusement, et les jetons `/...` en ligne sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Commandes Skills et arguments natifs">
    - **Commandes Skills :** les Skills `user-invocable` sont exposées comme commandes slash. Les noms sont nettoyés en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
      - `/skill <name> [input]` exécute une skill par son nom (utile lorsque les limites de commandes natives empêchent les commandes par skill).
      - Par défaut, les commandes Skills sont transmises au modèle comme une requête normale.
      - Les Skills peuvent facultativement déclarer `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
      - Exemple : `/prose` (Plugin OpenProse) — voir [OpenProse](/fr/prose).
    - **Arguments de commande native :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus à boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu à boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument. Les choix dynamiques sont résolus par rapport au modèle de session cible, de sorte que les options spécifiques au modèle telles que les niveaux `/think` suivent le remplacement `/model` de cette session.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` répond à une question d’exécution, pas à une question de configuration : **ce que cet agent peut utiliser maintenant dans cette conversation**.

- Par défaut, `/tools` est compact et optimisé pour un balayage rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces de commandes natives qui prennent en charge les arguments exposent le même changement de mode que `compact|verbose`.
- Les résultats sont limités à la session ; changer d’agent, de canal, de fil, d’autorisation d’expéditeur, ou de modèle peut donc changer la sortie.
- `/tools` inclut les outils effectivement accessibles à l’exécution, notamment les outils du noyau, les outils de Plugins connectés, et les outils propres au canal.

Pour l’édition des profils et des remplacements, utilisez le panneau Tools de l’UI de contrôle ou les surfaces de configuration/catalogue au lieu de traiter `/tools` comme un catalogue statique.

## Surfaces d’usage (ce qui s’affiche où)

- **Usage/quota du fournisseur** (exemple : « Claude 80% left ») apparaît dans `/status` pour le fournisseur de modèle actuel lorsque le suivi de l’usage est activé. OpenClaw normalise les fenêtres de fournisseur en `% left` ; pour MiniMax, les champs de pourcentage restants uniquement sont inversés avant affichage, et les réponses `model_remains` privilégient l’entrée du modèle de chat plus un libellé de plan étiqueté par modèle.
- **Lignes tokens/cache** dans `/status` peuvent revenir à la dernière entrée d’usage de transcription lorsque l’instantané de session en direct est incomplet. Les valeurs en direct non nulles existantes restent prioritaires, et le repli sur la transcription peut aussi récupérer le libellé du modèle d’exécution actif ainsi qu’un total orienté invite plus grand lorsque les totaux stockés sont absents ou plus petits.
- **Exécution vs runtime :** `/status` rapporte `Execution` pour le chemin sandbox effectif et `Runtime` pour l’entité qui exécute réellement la session : `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI, ou un backend ACP.
- **Tokens/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/auth/points de terminaison**, pas l’usage.

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
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec listes déroulantes de fournisseurs et de modèles plus une étape Submit.
- `/model <#>` sélectionne à partir de ce sélecteur (et privilégie le fournisseur actuel lorsque c’est possible).
- `/model status` affiche la vue détaillée, y compris le point de terminaison fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de configuration **uniquement à l’exécution** (en mémoire, pas sur disque). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration, mais n’écrivent **pas** dans `openclaw.json`. Utilisez `/debug reset` pour effacer tous les remplacements et revenir à la configuration sur disque.
</Note>

## Sortie de trace du Plugin

`/trace` vous permet d’activer ou désactiver les **lignes de trace/débogage du plugin limitées à la session** sans activer le mode détaillé complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état actuel de trace de la session.
- `/trace on` active les lignes de trace du plugin pour la session actuelle.
- `/trace off` les désactive de nouveau.
- Les lignes de trace du plugin peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` continue de gérer les remplacements de configuration uniquement à l’exécution.
- `/trace` ne remplace pas `/verbose` ; la sortie détaillée normale des outils/statuts relève toujours de `/verbose`.

## Mises à jour de configuration

`/config` écrit dans votre configuration sur disque (`openclaw.json`). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.config: true`.

Exemples :

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
La configuration est validée avant écriture ; les modifications invalides sont rejetées. Les mises à jour `/config` persistent après les redémarrages.
</Note>

## Mises à jour MCP

`/mcp` écrit les définitions de serveur MCP gérées par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.mcp: true`.

Exemples :

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` stocke la configuration dans la configuration OpenClaw, et non dans les réglages de projet appartenant à Pi. Les adaptateurs d’exécution décident quels transports sont réellement exécutables.
</Note>

## Mises à jour des Plugins

`/plugins` permet aux opérateurs d’inspecter les Plugins découverts et d’activer/désactiver leur activation dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez-le avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` et `/plugins show` utilisent la découverte réelle des Plugins par rapport à l’espace de travail actuel et à la configuration sur disque.
- `/plugins enable|disable` met à jour uniquement la configuration du Plugin ; cela n’installe ni ne désinstalle les Plugins.
- Après des changements `enable/disable`, redémarrez le gateway pour les appliquer.

</Note>

## Remarques sur les surfaces

<AccordionGroup>
  <Accordion title="Sessions par surface">
    - **Les commandes textuelles** s’exécutent dans la session de chat normale (les messages privés partagent `main`, les groupes ont leur propre session).
    - **Les commandes natives** utilisent des sessions isolées :
      - Discord : `agent:<agentId>:discord:slash:<userId>`
      - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram : `telegram:slash:<userId>` (cible la session du chat via `CommandTargetSessionKey`)
    - **`/stop`** cible la session de chat active afin de pouvoir annuler l’exécution en cours.

  </Accordion>
  <Accordion title="Spécificités de Slack">
    `channels.slack.slashCommand` reste pris en charge pour une seule commande de style `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont envoyés sous forme de boutons Block Kit éphémères.

    Exception native Slack : enregistrez `/agentstatus` (et non `/status`) car Slack réserve `/status`. Le `/status` textuel fonctionne toujours dans les messages Slack.

  </Accordion>
</AccordionGroup>

## Questions parallèles BTW

`/btw` est une **question parallèle** rapide à propos de la session actuelle.

Contrairement au chat normal :

- elle utilise la session actuelle comme contexte d’arrière-plan,
- elle s’exécute comme un appel ponctuel séparé **sans outils**,
- elle ne modifie pas le contexte futur de la session,
- elle n’est pas écrite dans l’historique de transcription,
- elle est fournie comme résultat parallèle en direct au lieu d’un message assistant normal.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la tâche principale continue.

Exemple :

```text
/btw qu’est-ce que nous faisons en ce moment ?
```

Consultez [Questions parallèles BTW](/fr/tools/btw) pour le comportement complet et les détails UX côté client.

## Lié

- [Créer des Skills](/fr/tools/creating-skills)
- [Skills](/fr/tools/skills)
- [Configuration des Skills](/fr/tools/skills-config)
