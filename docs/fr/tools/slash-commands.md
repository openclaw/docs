---
read_when:
    - Utiliser ou configurer les commandes de chat
    - Débogage du routage des commandes ou des autorisations
sidebarTitle: Slash commands
summary: 'Commandes slash : texte ou natives, configuration et commandes prises en charge'
title: Commandes avec barre oblique
x-i18n:
    generated_at: "2026-05-03T21:40:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

Les commandes sont gérées par le Gateway. La plupart des commandes doivent être envoyées comme un message **autonome** qui commence par `/`. La commande de chat bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Lorsqu’une conversation ou un fil est lié à une session ACP, le texte de suivi normal est routé vers ce harnais ACP. Les commandes de gestion du Gateway restent locales : `/acp ...` atteint toujours le gestionnaire de commandes ACP d’OpenClaw, et `/status` ainsi que `/unfocus` restent locales chaque fois que la gestion des commandes est activée pour la surface.

Il existe deux systèmes liés :

<AccordionGroup>
  <Accordion title="Commandes">
    Messages `/...` autonomes.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Les directives sont retirées du message avant que le modèle ne le voie.
    - Dans les messages de chat normaux (pas uniquement des directives), elles sont traitées comme des « indications en ligne » et ne persistent **pas** dans les paramètres de session.
    - Dans les messages composés uniquement de directives (le message ne contient que des directives), elles persistent dans la session et répondent avec un accusé de réception.
    - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule liste d’autorisation utilisée ; sinon, l’autorisation vient des listes d’autorisation/appairage du canal plus `commands.useAccessGroups`. Pour les expéditeurs non autorisés, les directives sont traitées comme du texte brut.

  </Accordion>
  <Accordion title="Raccourcis en ligne">
    Expéditeurs sur liste d’autorisation/autorisés uniquement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).

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
  Active l’analyse de `/...` dans les messages de chat. Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes textuelles fonctionnent toujours même si vous définissez ce paramètre sur `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes natives. Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native. Définissez `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` pour remplacer par fournisseur (booléen ou `"auto"`). Sur Discord, `false` ignore l’enregistrement et le nettoyage des commandes slash au démarrage ; les commandes précédemment enregistrées peuvent rester visibles jusqu’à ce que vous les supprimiez de l’application Discord. Les commandes Slack sont gérées dans l’application Slack et ne sont pas supprimées automatiquement.
</ParamField>
Sur Discord, les spécifications de commandes natives peuvent inclure `descriptionLocalizations`, qu’OpenClaw publie comme `description_localizations` Discord et inclut dans les comparaisons de réconciliation.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Enregistre nativement les commandes **Skills** quand elles sont prises en charge. Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack nécessite de créer une commande slash par Skill). Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` pour remplacer par fournisseur (booléen ou `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Active `! <cmd>` pour exécuter des commandes shell hôte (`/bash <cmd>` est un alias ; nécessite des listes d’autorisation `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Contrôle la durée pendant laquelle bash attend avant de passer en mode arrière-plan (`0` passe immédiatement en arrière-plan).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Active `/config` (lit/écrit `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Active `/plugins` (découverte/état des plugins plus commandes d’installation et d’activation/désactivation).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Active `/debug` (remplacements uniquement à l’exécution).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Active `/restart` plus les actions d’outil de redémarrage du Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Définit la liste d’autorisation explicite des propriétaires pour les surfaces de commandes/outils réservées au propriétaire. Il s’agit du compte opérateur humain qui peut approuver des actions dangereuses et exécuter des commandes comme `/diagnostics`, `/export-trajectory` et `/config`. Elle est distincte de `commands.allowFrom` et de l’accès par appairage DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Par canal : exige l’**identité propriétaire** pour exécuter les commandes réservées au propriétaire sur cette surface. Lorsque `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées propriétaire natives du fournisseur), soit disposer du scope interne `operator.admin` sur un canal de messages interne. Une entrée joker dans `allowFrom` du canal, ou une liste de candidats propriétaires vide/non résolue, n’est **pas** suffisante — les commandes réservées au propriétaire échouent fermées sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient contrôlées uniquement par `ownerAllowFrom` et les listes d’autorisation de commandes standard.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Contrôle la façon dont les identifiants propriétaire apparaissent dans le prompt système.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Définit éventuellement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la seule source d’autorisation pour les commandes et directives (les listes d’autorisation/appairage de canal et `commands.useAccessGroups` sont ignorés). Utilisez `"*"` pour une valeur globale par défaut ; les clés propres à un fournisseur la remplacent.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applique les listes d’autorisation/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.
</ParamField>

## Liste des commandes

Source de vérité actuelle :

- les commandes intégrées du cœur viennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées viennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de plugins viennent des appels `registerCommand()` des plugins
- la disponibilité réelle sur votre Gateway dépend toujours des indicateurs de configuration, de la surface du canal et des plugins installés/activés

### Commandes intégrées du cœur

<AccordionGroup>
  <Accordion title="Sessions et exécutions">
    - `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
    - Control UI intercepte `/new` saisi pour créer une nouvelle session de tableau de bord et basculer vers celle-ci ; `/reset` saisi exécute toujours la réinitialisation en place du Gateway.
    - `/reset soft [message]` conserve la transcription actuelle, supprime les identifiants de session de backend CLI réutilisés et relance en place le chargement de démarrage/du prompt système.
    - `/compact [instructions]` compacte le contexte de session. Voir [Compaction](/fr/concepts/compaction).
    - `/stop` interrompt l’exécution en cours.
    - `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de la liaison de fil.
    - `/export-session [path]` exporte la session actuelle en HTML. Alias : `/export`.
    - `/export-trajectory [path]` demande une approbation d’exécution, puis exporte un [lot de trajectoire](/fr/tools/trajectory) JSONL pour la session actuelle. Utilisez-le quand vous avez besoin de la chronologie du prompt, des outils et de la transcription pour une session OpenClaw. Dans les chats de groupe, le prompt d’approbation et le résultat d’exportation sont envoyés au propriétaire en privé. Alias : `/trajectory`.

  </Accordion>
  <Accordion title="Contrôles du modèle et de l’exécution">
    - `/think <level>` définit le niveau de réflexion. Les options viennent du profil de fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium` et `high`, avec des niveaux personnalisés comme `xhigh`, `adaptive`, `max`, ou le binaire `on` uniquement là où ils sont pris en charge. Alias : `/thinking`, `/t`.
    - `/verbose on|off|full` active/désactive la sortie détaillée. Alias : `/v`.
    - `/trace on|off` active/désactive la sortie de trace des plugins pour la session actuelle.
    - `/fast [status|on|off]` affiche ou définit le mode rapide.
    - `/reasoning [on|off|stream]` active/désactive la visibilité du raisonnement. Alias : `/reason`.
    - `/elevated [on|off|ask|full]` active/désactive le mode élevé. Alias : `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exécution.
    - `/model [name|#|status]` affiche ou définit le modèle.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs configurés/disponibles avec authentification ou les modèles d’un fournisseur ; ajoutez `all` pour parcourir le catalogue complet de ce fournisseur.
    - `/queue <mode>` gère le comportement de la file (`steer`, `queue` hérité, `followup`, `collect`, `steer-backlog`, `interrupt`) plus des options comme `debounce:0.5s cap:25 drop:summarize` ; `/queue default` ou `/queue reset` efface le remplacement de session. Voir [File de commandes](/fr/concepts/queue) et [File de pilotage](/fr/concepts/queue-steering).

  </Accordion>
  <Accordion title="Découverte et état">
    - `/help` affiche le court résumé d’aide.
    - `/commands` affiche le catalogue de commandes généré.
    - `/tools [compact|verbose]` affiche ce que l’agent actuel peut utiliser maintenant.
    - `/status` affiche l’état d’exécution/runtime, y compris les libellés `Execution`/`Runtime` et l’utilisation/quota du fournisseur quand disponible.
    - `/diagnostics [note]` est le flux de rapport de support réservé au propriétaire pour les bugs du Gateway et les exécutions du harnais Codex. Il demande une approbation d’exécution explicite à chaque fois avant d’exécuter `openclaw gateway diagnostics export --json` ; n’approuvez pas les diagnostics avec une règle d’autorisation globale. Après approbation, il envoie un rapport collable avec le chemin local du lot, le résumé du manifeste, les notes de confidentialité et les identifiants de session pertinents. Dans les chats de groupe, le prompt d’approbation et le rapport sont envoyés au propriétaire en privé. Lorsque la session active utilise le harnais OpenAI Codex, la même approbation envoie aussi les retours Codex pertinents aux serveurs OpenAI et la réponse terminée liste les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes `codex resume <thread-id>`. Voir [Exportation des diagnostics](/fr/gateway/diagnostics).
    - `/crestodian <request>` exécute l’assistant de configuration et de réparation Crestodian depuis un DM propriétaire.
    - `/tasks` liste les tâches en arrière-plan actives/récentes pour la session actuelle.
    - `/context [list|detail|json]` explique comment le contexte est assemblé.
    - `/whoami` affiche votre identifiant d’expéditeur. Alias : `/id`.
    - `/usage off|tokens|full|cost` contrôle le pied de page d’utilisation par réponse ou imprime un résumé local des coûts.

  </Accordion>
  <Accordion title="Skills, listes d’autorisation, approbations">
    - `/skill <name> [input]` exécute un Skill par nom.
    - `/allowlist [list|add|remove] ...` gère les entrées de liste d’autorisation. Texte uniquement.
    - `/approve <id> <decision>` résout les prompts d’approbation d’exécution.
    - `/btw <question>` pose une question annexe sans modifier le contexte de session futur. Alias : `/side`. Voir [BTW](/fr/tools/btw).

  </Accordion>
  <Accordion title="Sous-agents et ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agents pour la session actuelle.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options d’exécution.
    - `/focus <target>` lie le fil Discord actuel ou le sujet/la conversation Telegram à une cible de session.
    - `/unfocus` supprime la liaison actuelle.
    - `/agents` liste les agents liés au fil pour la session actuelle.
    - `/kill <id|#|all>` interrompt un ou tous les sous-agents en cours d’exécution.
    - `/steer <id|#> <message>` envoie des consignes à un sous-agent en cours d’exécution. Alias : `/tell`.

  </Accordion>
  <Accordion title="Écritures réservées au propriétaire et administration">
    - `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Nécessite `commands.config: true`.
    - `/mcp show|get|set|unset` lit ou écrit la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Nécessite `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Écritures réservées au propriétaire. Nécessite `commands.plugins: true`.
    - `/debug show|set|unset|reset` gère les remplacements de configuration uniquement valables à l’exécution. Réservé au propriétaire. Nécessite `commands.debug: true`.
    - `/restart` redémarre OpenClaw lorsque cette commande est activée. Par défaut : activée ; définissez `commands.restart: false` pour la désactiver.
    - `/send on|off|inherit` définit la stratégie d’envoi. Réservé au propriétaire.

  </Accordion>
  <Accordion title="Voix, TTS, contrôle du canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` contrôle le TTS. Voir [TTS](/fr/tools/tts).
    - `/activation mention|always` définit le mode d’activation de groupe.
    - `/bash <command>` exécute une commande shell hôte. Texte uniquement. Alias : `! <command>`. Nécessite `commands.bash: true` ainsi que les listes d’autorisation `tools.elevated`.
    - `!poll [sessionId]` vérifie une tâche bash en arrière-plan.
    - `!stop [sessionId]` arrête une tâche bash en arrière-plan.

  </Accordion>
</AccordionGroup>

### Commandes dock générées

Les commandes dock basculent la route de réponse de la session actuelle vers un autre
canal lié. Voir [Docking de canal](/fr/concepts/channel-docking) pour la configuration,
des exemples et le dépannage.

Les commandes dock sont générées à partir des plugins de canal avec prise en charge des commandes natives. Ensemble intégré actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

Utilisez les commandes dock depuis une discussion directe pour basculer la route de réponse de la session actuelle vers un autre canal lié. L’agent conserve le même contexte de session, mais les réponses futures de cette session sont livrées au pair du canal sélectionné.

Les commandes dock nécessitent `session.identityLinks`. L’expéditeur source et le pair cible doivent appartenir au même groupe d’identités, par exemple `["telegram:123", "discord:456"]`. Si un utilisateur Telegram avec l’id `123` envoie `/dock_discord`, OpenClaw stocke `lastChannel: "discord"` et `lastTo: "456"` sur la session active. Si l’expéditeur n’est pas lié à un pair Discord, la commande répond par une indication de configuration au lieu de retomber sur la discussion normale.

Le docking ne modifie que la route de session active. Il ne crée pas de comptes de canal, n’accorde pas d’accès, ne contourne pas les listes d’autorisation de canal et ne déplace pas l’historique de transcription vers une autre session. Utilisez `/dock-telegram`, `/dock-slack`, `/dock-mattermost` ou une autre commande dock générée pour basculer de nouveau la route.

### Commandes de plugins intégrées

Les plugins intégrés peuvent ajouter davantage de commandes slash. Commandes intégrées actuelles dans ce dépôt :

- `/dreaming [on|off|status|help]` active ou désactive le dreaming de mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/configuration d’appareil. Voir [Appairage](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement les commandes de nœud téléphonique à haut risque.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration de voix Talk. Sur Discord, le nom de la commande native est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecte et contrôle le harnais de serveur d’application Codex intégré. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes réservées à QQBot :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes de Skills dynamiques

Les Skills invoquables par l’utilisateur sont aussi exposées comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les Skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque la Skill/le Plugin les enregistre.
- l’enregistrement des commandes de Skills natives est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.
- les spécifications de commande peuvent fournir `descriptionLocalizations` pour les surfaces natives qui prennent en charge les descriptions localisées, y compris Discord.

<AccordionGroup>
  <Accordion title="Notes sur les arguments et l’analyseur">
    - Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; en l’absence de correspondance, le texte est traité comme corps du message.
    - Pour une ventilation complète de l’utilisation par fournisseur, utilisez `openclaw status --usage`.
    - `/allowlist add|remove` nécessite `commands.config=true` et respecte `configWrites` du canal.
    - Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé sur la configuration et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
    - `/usage` contrôle le pied de page d’utilisation par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
    - `/restart` est activée par défaut ; définissez `commands.restart: false` pour la désactiver.
    - `/plugins install <spec>` accepte les mêmes spécifications de Plugin que `openclaw plugins install` : chemin/archive local, paquet npm, `git:<repo>` ou `clawhub:<pkg>`, puis demande un redémarrage du Gateway parce que les modules sources du Plugin ont changé.
    - `/plugins enable|disable` met à jour la configuration de Plugin et déclenche le rechargement des plugins du Gateway pour les nouveaux tours d’agent.

  </Accordion>
  <Accordion title="Comportement propre aux canaux">
    - Commande native réservée à Discord : `/vc join|leave|status` contrôle les canaux vocaux (non disponible sous forme de texte). `join` nécessite une guilde et un canal vocal/stage sélectionné. Nécessite `channels.discord.voice` et les commandes natives.
    - Les commandes de liaison de fil Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) nécessitent l’activation effective des liaisons de fil (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
    - Référence des commandes ACP et comportement d’exécution : [agents ACP](/fr/tools/acp-agents).

  </Accordion>
  <Accordion title="Sécurité de verbose / trace / fast / reasoning">
    - `/verbose` est destiné au débogage et à une visibilité supplémentaire ; gardez-le **désactivé** en utilisation normale.
    - `/trace` est plus limité que `/verbose` : il ne révèle que les lignes de trace/débogage appartenant au Plugin et garde désactivé le bavardage verbose normal des outils.
    - `/fast on|off` persiste un remplacement de session. Utilisez l’option `inherit` dans l’interface Sessions pour l’effacer et revenir aux valeurs par défaut de la configuration.
    - `/fast` dépend du fournisseur : OpenAI/OpenAI Codex le mappe à `service_tier=priority` sur les endpoints Responses natifs, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent à `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
    - Les résumés d’échec d’outils sont toujours affichés lorsqu’ils sont pertinents, mais le texte détaillé de l’échec n’est inclus que lorsque `/verbose` vaut `on` ou `full`.
    - `/reasoning`, `/verbose` et `/trace` sont risqués dans les paramètres de groupe : ils peuvent révéler un raisonnement interne, une sortie d’outil ou des diagnostics de Plugin que vous ne vouliez pas exposer. Préférez les laisser désactivés, surtout dans les discussions de groupe.

  </Accordion>
  <Accordion title="Changement de modèle">
    - `/model` persiste immédiatement le nouveau modèle de session.
    - Si l’agent est inactif, la prochaine exécution l’utilise immédiatement.
    - Si une exécution est déjà active, OpenClaw marque un changement en direct comme en attente et ne redémarre avec le nouveau modèle qu’à un point de nouvelle tentative propre.
    - Si l’activité d’outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une occasion de nouvelle tentative ultérieure ou jusqu’au prochain tour utilisateur.
    - Dans le TUI local, `/crestodian [request]` revient du TUI d’agent normal vers Crestodian. Cela est distinct du mode de secours des canaux de messagerie et n’accorde pas d’autorité de configuration distante.

  </Accordion>
  <Accordion title="Chemin rapide et raccourcis en ligne">
    - **Chemin rapide :** les messages constitués uniquement d’une commande provenant d’expéditeurs autorisés sont traités immédiatement (contournement de la file + du modèle).
    - **Filtrage des mentions de groupe :** les messages constitués uniquement d’une commande provenant d’expéditeurs autorisés contournent les exigences de mention.
    - **Raccourcis en ligne (expéditeurs autorisés uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle voie le texte restant.
      - Exemple : `hey /status` déclenche une réponse de statut, et le texte restant continue dans le flux normal.
    - Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Les messages non autorisés constitués uniquement d’une commande sont ignorés silencieusement, et les jetons `/...` en ligne sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Commandes de Skills et arguments natifs">
    - **Commandes de Skills :** les Skills `user-invocable` sont exposées comme commandes slash. Les noms sont assainis en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
      - `/skill <name> [input]` exécute une Skill par nom (utile lorsque les limites des commandes natives empêchent les commandes par Skill).
      - Par défaut, les commandes de Skills sont transmises au modèle comme une requête normale.
      - Les Skills peuvent facultativement déclarer `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
      - Exemple : `/prose` (Plugin OpenProse) — voir [OpenProse](/fr/prose).
    - **Arguments de commandes natives :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus à boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu à boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument. Les choix dynamiques sont résolus par rapport au modèle de session cible, donc les options propres au modèle comme les niveaux `/think` suivent le remplacement `/model` de cette session.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` répond à une question d’exécution, pas à une question de configuration : **ce que cet agent peut utiliser maintenant dans cette conversation**.

- `/tools` par défaut est compact et optimisé pour une lecture rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces de commandes natives qui prennent en charge les arguments exposent le même changement de mode que `compact|verbose`.
- Les résultats sont limités à la session, donc changer d’agent, de canal, de fil, d’autorisation d’expéditeur ou de modèle peut modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l’exécution, y compris les outils du cœur, les outils de plugins connectés et les outils appartenant au canal.

Pour modifier les profils et les remplacements, utilisez le panneau Outils de l’interface de contrôle ou les surfaces de configuration/catalogue au lieu de traiter `/tools` comme un catalogue statique.

## Surfaces d’utilisation (ce qui s’affiche où)

- **Utilisation/quota du fournisseur** (exemple : "Claude 80% left") apparaît dans `/status` pour le fournisseur de modèle actuel lorsque le suivi de l'utilisation est activé. OpenClaw normalise les fenêtres des fournisseurs en `% left` ; pour MiniMax, les champs de pourcentage indiquant uniquement le reste sont inversés avant l'affichage, et les réponses `model_remains` privilégient l'entrée du modèle de chat ainsi qu'une étiquette de plan avec balise de modèle.
- **Lignes de tokens/cache** dans `/status` peuvent se rabattre sur la dernière entrée d'utilisation de transcript lorsque l'instantané de session en direct est clairsemé. Les valeurs en direct non nulles existantes restent prioritaires, et le repli sur le transcript peut aussi récupérer l'étiquette du modèle d'exécution actif ainsi qu'un total plus grand orienté prompt lorsque les totaux stockés sont absents ou plus petits.
- **Exécution vs runtime :** `/status` indique `Execution` pour le chemin de sandbox effectif et `Runtime` pour ce qui exécute réellement la session : `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP.
- **Tokens/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/authentification/points de terminaison**, pas l'utilisation.

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

Notes :

- `/model` et `/model list` affichent un sélecteur compact et numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants pour le fournisseur et le modèle, plus une étape Envoyer.
- `/model <#>` sélectionne depuis ce sélecteur (et privilégie le fournisseur actuel lorsque possible).
- `/model status` affiche la vue détaillée, y compris le point de terminaison du fournisseur configuré (`baseUrl`) et le mode d'API (`api`) lorsqu'ils sont disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de config **uniquement au runtime** (en mémoire, pas sur disque). Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Les remplacements s'appliquent immédiatement aux nouvelles lectures de config, mais ne sont **pas** écrits dans `openclaw.json`. Utilisez `/debug reset` pour effacer tous les remplacements et revenir à la config sur disque.
</Note>

## Sortie de trace Plugin

`/trace` vous permet d'activer ou de désactiver les **lignes de trace/débogage de Plugin limitées à la session** sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Notes :

- `/trace` sans argument affiche l'état actuel de la trace de session.
- `/trace on` active les lignes de trace Plugin pour la session actuelle.
- `/trace off` les désactive à nouveau.
- Les lignes de trace Plugin peuvent apparaître dans `/status` et comme message de diagnostic complémentaire après la réponse normale de l'assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` gère toujours les remplacements de config uniquement au runtime.
- `/trace` ne remplace pas `/verbose` ; la sortie normale détaillée des outils/statuts relève toujours de `/verbose`.

## Mises à jour de config

`/config` écrit dans votre config sur disque (`openclaw.json`). Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.config: true`.

Exemples :

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
La config est validée avant l'écriture ; les changements invalides sont rejetés. Les mises à jour de `/config` persistent entre les redémarrages.
</Note>

## Mises à jour MCP

`/mcp` écrit les définitions de serveurs MCP gérées par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.mcp: true`.

Exemples :

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` stocke la config dans la config OpenClaw, pas dans les paramètres de projet détenus par Pi. Les adaptateurs de runtime décident quels transports sont réellement exécutables.
</Note>

## Mises à jour Plugin

`/plugins` permet aux opérateurs d'inspecter les plugins découverts et d'activer ou désactiver leur activation dans la config. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` et `/plugins show` utilisent la découverte réelle de plugins sur l'espace de travail actuel plus la config sur disque.
- `/plugins install` installe depuis ClawHub, npm, git, des répertoires locaux et des archives.
- `/plugins enable|disable` met uniquement à jour la config des plugins ; cela n'installe ni ne désinstalle les plugins.
- Les changements d'activation et de désactivation rechargent à chaud les surfaces de runtime Plugin du Gateway pour les nouveaux tours d'agent ; l'installation demande un redémarrage du Gateway, car les modules sources du Plugin ont changé.

</Note>

## Notes de surface

<AccordionGroup>
  <Accordion title="Sessions par surface">
    - Les **commandes texte** s'exécutent dans la session de chat normale (les DM partagent `main`, les groupes ont leur propre session).
    - Les **commandes natives** utilisent des sessions isolées :
      - Discord : `agent:<agentId>:discord:slash:<userId>`
      - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram : `telegram:slash:<userId>` (cible la session de chat via `CommandTargetSessionKey`)
    - **`/stop`** cible la session de chat active afin de pouvoir interrompre l'exécution en cours.

  </Accordion>
  <Accordion title="Spécificités Slack">
    `channels.slack.slashCommand` reste pris en charge pour une seule commande de style `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d'arguments de commande pour Slack sont fournis comme boutons Block Kit éphémères.

    Exception native Slack : enregistrez `/agentstatus` (pas `/status`), car Slack réserve `/status`. Le texte `/status` fonctionne toujours dans les messages Slack.

  </Accordion>
</AccordionGroup>

## Questions annexes BTW

`/btw` est une **question annexe** rapide au sujet de la session actuelle. `/side` est un alias.

Contrairement au chat normal :

- il utilise la session actuelle comme contexte d'arrière-plan,
- il s'exécute comme un appel ponctuel séparé **sans outil**,
- il ne modifie pas le contexte futur de la session,
- il n'est pas écrit dans l'historique du transcript,
- il est fourni comme résultat annexe en direct au lieu d'un message normal de l'assistant.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Consultez [Questions annexes BTW](/fr/tools/btw) pour le comportement complet et les détails d'UX client.

## Liens connexes

- [Création de Skills](/fr/tools/creating-skills)
- [Skills](/fr/tools/skills)
- [Config des Skills](/fr/tools/skills-config)
