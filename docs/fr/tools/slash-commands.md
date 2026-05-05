---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
sidebarTitle: Slash commands
summary: 'Commandes slash : texte ou natives, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-05-05T06:19:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

Commands are handled by the Gateway. Most commands must be sent as a **standalone** message that starts with `/`. The host-only bash chat command uses `! <cmd>` (with `/bash <cmd>` as an alias).

When a conversation or thread is bound to an ACP session, normal follow-up text routes to that ACP harness. Gateway management commands still stay local: `/acp ...` always reaches the OpenClaw ACP command handler, and `/status` plus `/unfocus` stay local whenever command handling is enabled for the surface.

There are two related systems:

<AccordionGroup>
  <Accordion title="Commands">
    Standalone `/...` messages.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives are stripped from the message before the model sees it.
    - In normal chat messages (not directive-only), they are treated as "inline hints" and do **not** persist session settings.
    - In directive-only messages (the message contains only directives), they persist to the session and reply with an acknowledgement.
    - Directives are only applied for **authorized senders**. If `commands.allowFrom` is set, it is the only allowlist used; otherwise authorization comes from channel allowlists/pairing plus `commands.useAccessGroups`. Unauthorized senders see directives treated as plain text.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Allowlisted/authorized senders only: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    They run immediately, are stripped before the model sees the message, and the remaining text continues through the normal flow.

  </Accordion>
</AccordionGroup>

## Config

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
  Enables parsing `/...` in chat messages. On surfaces without native commands (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), text commands still work even if you set this to `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registers native commands. Auto: on for Discord/Telegram; off for Slack (until you add slash commands); ignored for providers without native support. Set `channels.discord.commands.native`, `channels.telegram.commands.native`, or `channels.slack.commands.native` to override per provider (bool or `"auto"`). On Discord, `false` skips slash-command registration and cleanup during startup; previously registered commands may remain visible until you remove them from the Discord app. Slack commands are managed in the Slack app and are not removed automatically.
</ParamField>
On Discord, native command specs may include `descriptionLocalizations`, which OpenClaw publishes as Discord `description_localizations` and includes in reconcile comparisons.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registers **skill** commands natively when supported. Auto: on for Discord/Telegram; off for Slack (Slack requires creating a slash command per skill). Set `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, or `channels.slack.commands.nativeSkills` to override per provider (bool or `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Enables `! <cmd>` to run host shell commands (`/bash <cmd>` is an alias; requires `tools.elevated` allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controls how long bash waits before switching to background mode (`0` backgrounds immediately).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Enables `/config` (reads/writes `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Enables `/mcp` (reads/writes OpenClaw-managed MCP config under `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Enables `/plugins` (plugin discovery/status plus install + enable/disable controls).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Enables `/debug` (runtime-only overrides).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Enables `/restart` plus gateway restart tool actions.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Sets the explicit owner allowlist for owner-only command/tool surfaces. This is the human operator account that can approve dangerous actions and run commands such as `/diagnostics`, `/export-trajectory`, and `/config`. It is separate from `commands.allowFrom` and from DM pairing access.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per-channel: makes owner-only commands require **owner identity** to run on that surface. When `true`, the sender must either match a resolved owner candidate (for example an entry in `commands.ownerAllowFrom` or provider-native owner metadata) or hold internal `operator.admin` scope on an internal message channel. A wildcard entry in channel `allowFrom`, or an empty/unresolved owner-candidate list, is **not** sufficient — owner-only commands fail closed on that channel. Leave this off if you want owner-only commands gated only by `ownerAllowFrom` and the standard command allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controls how owner ids appear in the system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Optionally sets the HMAC secret used when `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Per-provider allowlist for command authorization. When configured, it is the only authorization source for commands and directives (channel allowlists/pairing and `commands.useAccessGroups` are ignored). Use `"*"` for a global default; provider-specific keys override it.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Enforces allowlists/policies for commands when `commands.allowFrom` is not set.
</ParamField>

## Command list

Current source-of-truth:

- core built-ins come from `src/auto-reply/commands-registry.shared.ts`
- generated dock commands come from `src/auto-reply/commands-registry.data.ts`
- plugin commands come from plugin `registerCommand()` calls
- actual availability on your gateway still depends on config flags, channel surface, and installed/enabled plugins

### Core built-in commands

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` starts a new session; `/reset` is the reset alias.
    - Control UI intercepts typed `/new` to create and switch to a fresh dashboard session; typed `/reset` still runs the Gateway's in-place reset.
    - `/reset soft [message]` keeps the current transcript, drops reused CLI backend session ids, and reruns startup/system-prompt loading in-place.
    - `/compact [instructions]` compacts the session context. See [Compaction](/fr/concepts/compaction).
    - `/stop` aborts the current run.
    - `/session idle <duration|off>` and `/session max-age <duration|off>` manage thread-binding expiry.
    - `/export-session [path]` exports the current session to HTML. Alias: `/export`.
    - `/export-trajectory [path]` asks for exec approval, then exports a JSONL [trajectory bundle](/fr/tools/trajectory) for the current session. Use it when you need the prompt, tool, and transcript timeline for one OpenClaw session. In group chats, the approval prompt and export result go to the owner privately. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` sets the thinking level. Options come from the active model's provider profile; common levels are `off`, `minimal`, `low`, `medium`, and `high`, with custom levels such as `xhigh`, `adaptive`, `max`, or binary `on` only where supported. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` toggles verbose output. Alias: `/v`.
    - `/trace on|off` toggles plugin trace output for the current session.
    - `/fast [status|on|off]` shows or sets fast mode.
    - `/reasoning [on|off|stream]` toggles reasoning visibility. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` toggles elevated mode. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` shows or sets exec defaults.
    - `/model [name|#|status]` shows or sets the model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lists configured/auth-available providers or models for a provider; add `all` to browse that provider's full catalog.
    - `/queue <mode>` manages queue behavior (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus options like `debounce:0.5s cap:25 drop:summarize`; `/queue default` or `/queue reset` clears the session override. See [Command queue](/fr/concepts/queue) and [Steering queue](/fr/concepts/queue-steering).
    - `/steer <message>` injects guidance into the active run for the current session, independent of `/queue` mode. It does not start a new run when the session is idle. Alias: `/tell`. See [Steer](/fr/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` shows the short help summary.
    - `/commands` shows the generated command catalog.
    - `/tools [compact|verbose]` shows what the current agent can use right now.
    - `/status` shows execution/runtime status, Gateway and system uptime, plus provider usage/quota when available.
    - `/diagnostics [note]` is the owner-only support-report flow for Gateway bugs and Codex harness runs. It asks for explicit exec approval every time before running `openclaw gateway diagnostics export --json`; do not approve diagnostics with an allow-all rule. After approval, it sends a pasteable report with the local bundle path, manifest summary, privacy notes, and relevant session ids. In group chats, the approval prompt and report go to the owner privately. When the active session uses the OpenAI Codex harness, the same approval also sends relevant Codex feedback to OpenAI servers and the completed reply lists the OpenClaw session ids, Codex thread ids, and `codex resume <thread-id>` commands. See [Diagnostics Export](/fr/gateway/diagnostics).
    - `/crestodian <request>` runs the Crestodian setup and repair helper from an owner DM.
    - `/tasks` lists active/recent background tasks for the current session.
    - `/context [list|detail|json]` explains how context is assembled.
    - `/whoami` shows your sender id. Alias: `/id`.
    - `/usage off|tokens|full|cost` controls the per-response usage footer or prints a local cost summary.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` runs a skill by name.
    - `/allowlist [list|add|remove] ...` manages allowlist entries. Text-only.
    - `/approve <id> <decision>` resolves exec approval prompts.
    - `/btw <question>` asks a side question without changing future session context. Alias: `/side`. See [BTW](/fr/tools/btw).

  </Accordion>
  <Accordion title="Sous-agents et ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agents pour la session actuelle.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options d’exécution.
    - `/focus <target>` associe le fil Discord actuel ou le sujet/la conversation Telegram à une cible de session.
    - `/unfocus` supprime l’association actuelle.
    - `/agents` liste les agents liés au fil pour la session actuelle.
    - `/kill <id|#|all>` interrompt un sous-agent en cours d’exécution, ou tous.
    - `/subagents steer <id|#> <message>` envoie une directive à un sous-agent en cours d’exécution. Voir [Orienter](/fr/tools/steer).

  </Accordion>
  <Accordion title="Écritures réservées au propriétaire et administration">
    - `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Nécessite `commands.config: true`.
    - `/mcp show|get|set|unset` lit ou écrit la configuration des serveurs MCP gérés par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Nécessite `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Écritures réservées au propriétaire. Nécessite `commands.plugins: true`.
    - `/debug show|set|unset|reset` gère les remplacements de configuration uniquement à l’exécution. Réservé au propriétaire. Nécessite `commands.debug: true`.
    - `/restart` redémarre OpenClaw lorsque cette option est activée. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
    - `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.

  </Accordion>
  <Accordion title="Voix, TTS, contrôle du canal">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` contrôle TTS. Voir [TTS](/fr/tools/tts).
    - `/activation mention|always` définit le mode d’activation de groupe.
    - `/bash <command>` exécute une commande shell hôte. Texte uniquement. Alias : `! <command>`. Nécessite `commands.bash: true` ainsi que les listes d’autorisation `tools.elevated`.
    - `!poll [sessionId]` vérifie une tâche bash en arrière-plan.
    - `!stop [sessionId]` arrête une tâche bash en arrière-plan.

  </Accordion>
</AccordionGroup>

### Commandes d’ancrage générées

Les commandes d’ancrage basculent la route de réponse de la session actuelle vers un autre
canal lié. Voir [Ancrage de canal](/fr/concepts/channel-docking) pour la configuration,
des exemples et le dépannage.

Les commandes d’ancrage sont générées à partir de plugins de canal prenant en charge les commandes natives. Ensemble actuellement intégré :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

Utilisez les commandes d’ancrage depuis une conversation directe pour basculer la route de réponse de la session actuelle vers un autre canal lié. L’agent conserve le même contexte de session, mais les réponses futures de cette session sont transmises au pair de canal sélectionné.

Les commandes d’ancrage nécessitent `session.identityLinks`. L’expéditeur source et le pair cible doivent se trouver dans le même groupe d’identité, par exemple `["telegram:123", "discord:456"]`. Si un utilisateur Telegram avec l’id `123` envoie `/dock_discord`, OpenClaw stocke `lastChannel: "discord"` et `lastTo: "456"` sur la session active. Si l’expéditeur n’est lié à aucun pair Discord, la commande répond avec une indication de configuration au lieu de revenir à la discussion normale.

L’ancrage modifie uniquement la route de session active. Il ne crée pas de comptes de canal, n’accorde pas d’accès, ne contourne pas les listes d’autorisation de canal et ne déplace pas l’historique de transcription vers une autre session. Utilisez `/dock-telegram`, `/dock-slack`, `/dock-mattermost` ou une autre commande d’ancrage générée pour changer à nouveau de route.

### Commandes de plugins intégrés

Les plugins intégrés peuvent ajouter davantage de commandes slash. Commandes actuellement intégrées dans ce dépôt :

- `/dreaming [on|off|status|help]` active ou désactive le Dreaming de mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/de configuration de l’appareil. Voir [Appairage](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement les commandes de nœud de téléphone à haut risque.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration de voix Talk. Sur Discord, le nom de commande natif est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` inspecte et contrôle le harnais de serveur d’app Codex intégré. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes propres à QQBot :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes dynamiques de Skills

Les Skills invocables par l’utilisateur sont également exposées comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- Les Skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque la compétence/le plugin les enregistre.
- L’enregistrement natif des commandes de Skills est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.
- Les spécifications de commande peuvent fournir `descriptionLocalizations` pour les surfaces natives qui prennent en charge les descriptions localisées, y compris Discord.

<AccordionGroup>
  <Accordion title="Notes sur les arguments et l’analyseur">
    - Les commandes acceptent un `:` facultatif entre la commande et les arguments (par exemple `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; en l’absence de correspondance, le texte est traité comme le corps du message.
    - Pour une répartition complète de l’utilisation par fournisseur, utilisez `openclaw status --usage`.
    - `/allowlist add|remove` nécessite `commands.config=true` et respecte `configWrites` du canal.
    - Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé sur la configuration et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
    - `/usage` contrôle le pied de page d’utilisation par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
    - `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
    - `/plugins install <spec>` accepte les mêmes spécifications de Plugin que `openclaw plugins install` : chemin/archive local, package npm, `git:<repo>` ou `clawhub:<pkg>`, puis demande un redémarrage du Gateway, car les modules source du Plugin ont changé.
    - `/plugins enable|disable` met à jour la configuration du Plugin et déclenche le rechargement des plugins du Gateway pour les nouveaux tours d’agent.

  </Accordion>
  <Accordion title="Comportement propre au canal">
    - Commande native propre à Discord : `/vc join|leave|status` contrôle les canaux vocaux (non disponible sous forme de texte). `join` nécessite un serveur et un canal vocal/de scène sélectionné. Nécessite `channels.discord.voice` et les commandes natives.
    - Les commandes Discord de liaison aux fils (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) nécessitent l’activation effective des liaisons de fil (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
    - Référence des commandes ACP et comportement d’exécution : [agents ACP](/fr/tools/acp-agents).

  </Accordion>
  <Accordion title="Sécurité verbose / trace / fast / reasoning">
    - `/verbose` est destiné au débogage et à une visibilité supplémentaire ; gardez-le **désactivé** en utilisation normale.
    - `/trace` est plus restreint que `/verbose` : il révèle uniquement les lignes de trace/débogage appartenant aux plugins et garde désactivé le bavardage verbose normal des outils.
    - `/fast on|off` conserve un remplacement de session. Utilisez l’option `inherit` de l’interface Sessions pour l’effacer et revenir aux valeurs par défaut de la configuration.
    - `/fast` est propre au fournisseur : OpenAI/OpenAI Codex le mappe à `service_tier=priority` sur les points de terminaison Responses natifs, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent à `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
    - Les résumés d’échec des outils restent affichés lorsqu’ils sont pertinents, mais le texte détaillé de l’échec n’est inclus que lorsque `/verbose` vaut `on` ou `full`.
    - `/reasoning`, `/verbose` et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler un raisonnement interne, une sortie d’outil ou des diagnostics de Plugin que vous n’aviez pas l’intention d’exposer. Préférez les laisser désactivés, en particulier dans les discussions de groupe.

  </Accordion>
  <Accordion title="Changement de modèle">
    - `/model` conserve immédiatement le nouveau modèle de session.
    - Si l’agent est inactif, la prochaine exécution l’utilise immédiatement.
    - Si une exécution est déjà active, OpenClaw marque un changement en direct comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
    - Si l’activité des outils ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une occasion de nouvelle tentative ultérieure ou jusqu’au prochain tour utilisateur.
    - Dans la TUI locale, `/crestodian [request]` revient de la TUI d’agent normale à Crestodian. C’est distinct du mode de secours des canaux de message et cela n’accorde pas d’autorité distante sur la configuration.

  </Accordion>
  <Accordion title="Chemin rapide et raccourcis intégrés">
    - **Chemin rapide :** les messages contenant uniquement une commande envoyés par des expéditeurs sur liste d’autorisation sont traités immédiatement (contournement de la file + modèle).
    - **Garde par mention de groupe :** les messages contenant uniquement une commande envoyés par des expéditeurs sur liste d’autorisation contournent les exigences de mention.
    - **Raccourcis intégrés (expéditeurs sur liste d’autorisation uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont supprimées avant que le modèle voie le texte restant.
      - Exemple : `hey /status` déclenche une réponse d’état, et le texte restant poursuit le flux normal.
    - Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - Les messages non autorisés contenant uniquement une commande sont ignorés silencieusement, et les jetons `/...` intégrés sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Commandes de Skills et arguments natifs">
    - **Commandes de Skills :** les Skills `user-invocable` sont exposées comme commandes slash. Les noms sont assainis en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques (par exemple `_2`).
      - `/skill <name> [input]` exécute une Skill par nom (utile lorsque les limites des commandes natives empêchent les commandes par Skill).
      - Par défaut, les commandes de Skills sont transmises au modèle comme une requête normale.
      - Les Skills peuvent éventuellement déclarer `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
      - Exemple : `/prose` (Plugin OpenProse) — voir [OpenProse](/fr/prose).
    - **Arguments de commande natifs :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus de boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu de boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument. Les choix dynamiques sont résolus par rapport au modèle de session cible ; les options propres au modèle, telles que les niveaux `/think`, suivent donc le remplacement `/model` de cette session.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` répond à une question d’exécution, pas à une question de configuration : **ce que cet agent peut utiliser maintenant dans cette conversation**.

- `/tools` par défaut est compact et optimisé pour un balayage rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces de commandes natives qui prennent en charge les arguments exposent le même commutateur de mode que `compact|verbose`.
- Les résultats sont limités à la session ; changer d’agent, de canal, de fil, d’autorisation d’expéditeur ou de modèle peut donc modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l’exécution, y compris les outils du cœur, les outils de plugins connectés et les outils appartenant au canal.

Pour modifier les profils et les remplacements, utilisez le panneau Outils de l’interface de contrôle ou les surfaces de configuration/catalogue au lieu de traiter `/tools` comme un catalogue statique.

## Surfaces d’utilisation (ce qui s’affiche où)

- **Utilisation/quota du fournisseur** (exemple : "Claude 80% left") apparaît dans `/status` pour le fournisseur de modèle actuel lorsque le suivi de l’utilisation est activé. OpenClaw normalise les fenêtres fournisseur en `% left` ; pour MiniMax, les champs de pourcentage indiquant uniquement le reste sont inversés avant l’affichage, et les réponses `model_remains` privilégient l’entrée du modèle de chat plus une étiquette de forfait marquée par modèle.
- **Lignes de tokens/cache** dans `/status` peuvent se rabattre sur la dernière entrée d’utilisation de la transcription lorsque l’instantané de session en direct est pauvre. Les valeurs en direct non nulles existantes restent prioritaires, et le repli sur la transcription peut aussi récupérer l’étiquette du modèle d’exécution actif ainsi qu’un total plus grand orienté prompt lorsque les totaux stockés sont absents ou plus petits.
- **Exécution vs Runtime :** `/status` signale `Execution` pour le chemin de sandbox effectif et `Runtime` pour ce qui exécute réellement la session : `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI ou un backend ACP.
- **Tokens/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/l’authentification/les endpoints**, pas l’utilisation.

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
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants de fournisseur et de modèle, plus une étape Submit.
- `/model <#>` sélectionne depuis ce sélecteur (et privilégie le fournisseur actuel lorsque c’est possible).
- `/model status` affiche la vue détaillée, y compris l’endpoint du fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de configuration **uniquement à l’exécution** (mémoire, pas disque). Réservé au propriétaire. Désactivé par défaut ; activez avec `commands.debug: true`.

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

## Sortie de trace Plugin

`/trace` vous permet d’activer ou de désactiver des **lignes de trace/débogage Plugin limitées à la session** sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état de trace actuel de la session.
- `/trace on` active les lignes de trace Plugin pour la session actuelle.
- `/trace off` les désactive à nouveau.
- Les lignes de trace Plugin peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` gère toujours les remplacements de configuration uniquement à l’exécution.
- `/trace` ne remplace pas `/verbose` ; la sortie verbeuse normale des outils/états relève toujours de `/verbose`.

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

<Note>
La configuration est validée avant l’écriture ; les modifications invalides sont rejetées. Les mises à jour `/config` persistent entre les redémarrages.
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
`/mcp` stocke la configuration dans la configuration OpenClaw, pas dans les paramètres de projet appartenant à Pi. Les adaptateurs d’exécution décident quels transports sont réellement exécutables.
</Note>

## Mises à jour Plugin

`/plugins` permet aux opérateurs d’inspecter les Plugins découverts et d’activer ou désactiver leur activation dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` et `/plugins show` utilisent la vraie découverte de Plugins sur l’espace de travail actuel plus la configuration sur disque.
- `/plugins install` installe depuis ClawHub, npm, git, des répertoires locaux et des archives.
- `/plugins enable|disable` met uniquement à jour la configuration Plugin ; cela n’installe ni ne désinstalle les Plugins.
- Les changements d’activation et de désactivation rechargent à chaud les surfaces d’exécution Plugin du Gateway pour les nouveaux tours d’agent ; l’installation demande un redémarrage du Gateway parce que les modules sources Plugin ont changé.

</Note>

## Notes de surface

<AccordionGroup>
  <Accordion title="Sessions par surface">
    - **Commandes texte** s’exécutent dans la session de chat normale (les DM partagent `main`, les groupes ont leur propre session).
    - **Commandes natives** utilisent des sessions isolées :
      - Discord : `agent:<agentId>:discord:slash:<userId>`
      - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
      - Telegram : `telegram:slash:<userId>` (cible la session de chat via `CommandTargetSessionKey`)
    - **`/stop`** cible la session de chat active afin de pouvoir interrompre l’exécution actuelle.

  </Accordion>
  <Accordion title="Spécificités Slack">
    `channels.slack.slashCommand` reste pris en charge pour une seule commande de style `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont fournis sous forme de boutons Block Kit éphémères.

    Exception native Slack : enregistrez `/agentstatus` (pas `/status`) parce que Slack réserve `/status`. Le texte `/status` fonctionne toujours dans les messages Slack.

  </Accordion>
</AccordionGroup>

## Questions secondaires BTW

`/btw` est une **question secondaire** rapide sur la session actuelle. `/side` est un alias.

Contrairement au chat normal :

- elle utilise la session actuelle comme contexte d’arrière-plan,
- elle s’exécute comme un appel ponctuel séparé **sans outil**,
- elle ne modifie pas le futur contexte de session,
- elle n’est pas écrite dans l’historique de transcription,
- elle est fournie comme résultat secondaire en direct plutôt que comme message d’assistant normal.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Voir [Questions secondaires BTW](/fr/tools/btw) pour le comportement complet et les détails d’UX client.

## Connexe

- [Création de Skills](/fr/tools/creating-skills)
- [Skills](/fr/tools/skills)
- [Configuration des Skills](/fr/tools/skills-config)
