---
read_when:
    - Utiliser ou configurer les commandes de chat
    - Débogage du routage des commandes ou des autorisations
    - Comprendre comment les commandes Skills sont enregistrées
sidebarTitle: Slash commands
summary: Toutes les commandes slash, directives et raccourcis en ligne disponibles — configuration, routage et comportement propre à chaque surface.
title: Commandes slash
x-i18n:
    generated_at: "2026-06-30T13:59:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Le Gateway gère les commandes envoyées comme messages autonomes commençant par `/`.
Les commandes bash réservées à l'hôte utilisent `! <cmd>` (avec `/bash <cmd>` comme alias).

Lorsqu'une conversation est liée à une session ACP, le texte normal est acheminé vers le
harnais ACP. Les commandes de gestion du Gateway restent locales : `/acp ...` atteint toujours
le gestionnaire de commandes OpenClaw, et `/status` ainsi que `/unfocus` restent locales chaque fois
que la gestion des commandes est activée pour la surface.

## Trois types de commandes

<CardGroup cols={3}>
  <Card title="Commandes" icon="terminal">
    Messages `/...` autonomes gérés par le Gateway. Ils doivent être envoyés comme
    seul contenu du message.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — retirées du message avant que le modèle
    le voie. Elles persistent les paramètres de session lorsqu'elles sont envoyées seules ; elles agissent comme indices en ligne
    lorsqu'elles sont envoyées avec un autre texte.
  </Card>
  <Card title="Raccourcis en ligne" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — s'exécutent immédiatement et sont
    retirés avant que le modèle voie le texte restant. Expéditeurs autorisés uniquement.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Détails du comportement des directives">
    - Les directives sont retirées du message avant que le modèle le voie.
    - Dans les messages **uniquement composés de directives** (le message ne contient que des directives), elles
      persistent dans la session et répondent avec un accusé de réception.
    - Dans les messages de **conversation normale** avec un autre texte, elles agissent comme indices en ligne et
      ne persistent **pas** les paramètres de session.
    - Les directives ne s'appliquent qu'aux **expéditeurs autorisés**. Si `commands.allowFrom`
      est défini, c'est la seule liste d'autorisation utilisée ; sinon, l'autorisation provient
      des listes d'autorisation/du jumelage de canal plus `commands.useAccessGroups`. Les expéditeurs
      non autorisés voient les directives traitées comme du texte brut.
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
  Active l'analyse de `/...` dans les messages de conversation. Sur les surfaces sans commandes natives
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), les commandes textuelles
  fonctionnent même lorsque cette option est définie sur `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes natives. Auto : activé pour Discord/Telegram ; désactivé pour Slack ;
  ignoré pour les fournisseurs sans prise en charge native. Remplacez par canal avec
  `channels.<provider>.commands.native`. Sur Discord, `false` ignore l'enregistrement des commandes slash ;
  les commandes précédemment enregistrées peuvent rester visibles jusqu'à leur suppression.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Enregistre nativement les commandes de Skills lorsque c'est pris en charge. Auto : activé pour
  Discord/Telegram ; désactivé pour Slack. Remplacez avec
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Active `! <cmd>` pour exécuter des commandes shell de l'hôte (alias `/bash <cmd>`). Nécessite
  les listes d'autorisation `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durée pendant laquelle bash attend avant de basculer en mode arrière-plan (`0` met en arrière-plan
  immédiatement).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Active `/config` (lit/écrit `openclaw.json`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Active `/plugins` (découverte/statut des plugins, plus installation et activation/désactivation). Écritures réservées au propriétaire.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Active `/debug` (remplacements de configuration uniquement à l'exécution). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Active `/restart` et les actions d'outil de redémarrage du Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Liste d'autorisation explicite des propriétaires pour les surfaces de commandes réservées au propriétaire. Séparée de
  `commands.allowFrom` et de l'accès par jumelage en MP.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Par canal : exige l'identité du propriétaire pour les commandes réservées au propriétaire. Lorsque `true`,
  l'expéditeur doit correspondre à `commands.ownerAllowFrom` ou détenir le périmètre interne `operator.admin`.
  Une entrée générique `allowFrom` n'est **pas** suffisante.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Contrôle la façon dont les identifiants de propriétaire apparaissent dans le prompt système.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secret HMAC utilisé lorsque `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Liste d'autorisation par fournisseur pour l'autorisation des commandes. Lorsqu'elle est configurée, c'est la
  **seule** source d'autorisation pour les commandes et directives. Utilisez `"*"` pour une
  valeur globale par défaut ; les clés propres au fournisseur la remplacent.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applique les listes d'autorisation/politiques pour les commandes lorsque `commands.allowFrom` n'est pas défini.
</ParamField>

## Liste des commandes

Les commandes proviennent de trois sources :

- **Intégrées au cœur :** `src/auto-reply/commands-registry.shared.ts`
- **Commandes dock générées :** `src/auto-reply/commands-registry.data.ts`
- **Commandes de Plugin :** appels plugin `registerCommand()`

La disponibilité dépend des indicateurs de configuration, de la surface du canal et des plugins installés/activés.

### Commandes du cœur

<AccordionGroup>
  <Accordion title="Sessions et exécutions">
    | Commande | Description |
    | --- | --- |
    | `/new [model]` | Archive la session actuelle et en démarre une nouvelle |
    | `/reset [soft [message]]` | Réinitialise la session actuelle sur place. `soft` conserve la transcription, supprime les identifiants de session de backend CLI réutilisés et relance le démarrage |
    | `/name <title>` | Nomme ou renomme la session actuelle. Omettez le titre pour voir le nom actuel et une suggestion |
    | `/compact [instructions]` | Compacte le contexte de session. Voir [Compaction](/fr/concepts/compaction) |
    | `/stop` | Interrompt l'exécution actuelle |
    | `/session idle <duration\|off>` | Gère l'expiration d'inactivité de liaison du fil |
    | `/session max-age <duration\|off>` | Gère l'expiration d'âge maximal de liaison du fil |
    | `/export-session [path]` | Exporte la session actuelle en HTML. Alias : `/export` |
    | `/export-trajectory [path]` | Exporte un paquet de trajectoire JSONL pour la session actuelle. Alias : `/trajectory` |

    <Note>
      Control UI intercepte `/new` saisi pour créer une nouvelle session de tableau de bord et basculer vers celle-ci,
      sauf lorsque `session.dmScope: "main"` est configuré
      et que le parent actuel est la session principale de l'agent — dans ce cas, `/new`
      réinitialise la session principale sur place. `/reset` saisi exécute toujours la réinitialisation sur place du Gateway.
      Utilisez `/model default` lorsque vous voulez effacer une sélection de modèle
      épinglée à la session.
    </Note>

  </Accordion>

  <Accordion title="Contrôles du modèle et de l'exécution">
    | Commande | Description |
    | --- | --- |
    | `/think <level\|default>` | Définit le niveau de réflexion ou efface le remplacement de session. Alias : `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Active/désactive la sortie détaillée. Alias : `/v` |
    | `/trace on\|off` | Active/désactive la sortie de trace des plugins pour la session actuelle |
    | `/fast [status\|auto\|on\|off\|default]` | Affiche, définit ou efface le mode rapide |
    | `/reasoning [on\|off\|stream]` | Active/désactive la visibilité du raisonnement. Alias : `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Active/désactive le mode élevé. Alias : `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Affiche ou définit les valeurs par défaut d'exécution |
    | `/model [name\|#\|status]` | Affiche ou définit le modèle |
    | `/models [provider] [page] [limit=<n>\|all]` | Liste les fournisseurs ou modèles configurés/disponibles par auth |
    | `/queue <mode>` | Gère le comportement de la file d'exécution active. Voir [File d'attente](/fr/concepts/queue) et [Pilotage de file d'attente](/fr/concepts/queue-steering) |
    | `/steer <message>` | Injecte des instructions dans l'exécution active. Alias : `/tell`. Voir [Piloter](/fr/tools/steer) |

    <AccordionGroup>
      <Accordion title="sécurité de verbose / trace / fast / reasoning">
        - `/verbose` sert au débogage — gardez-le **désactivé** en utilisation normale.
        - `/trace` ne révèle que les lignes de trace/débogage détenues par les plugins ; le bavardage détaillé normal reste désactivé.
        - `/fast auto|on|off` persiste un remplacement de session ; utilisez l'option `inherit` de l'interface Sessions pour l'effacer.
        - `/fast` est propre au fournisseur : OpenAI/Codex le mappe vers `service_tier=priority` ; les requêtes Anthropic directes le mappent vers `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` et `/trace` sont risqués en contexte de groupe — ils peuvent révéler le raisonnement interne ou des diagnostics de plugin. Gardez-les désactivés dans les discussions de groupe.

      </Accordion>
      <Accordion title="Détails du changement de modèle">
        - `/model` persiste immédiatement le nouveau modèle dans la session.
        - Si l'agent est inactif, la prochaine exécution l'utilise immédiatement.
        - Si une exécution est active, le changement est marqué comme en attente et appliqué au prochain point de nouvelle tentative propre.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Découverte et statut">
    | Commande | Description |
    | --- | --- |
    | `/help` | Affiche le court résumé d'aide |
    | `/commands` | Affiche le catalogue de commandes généré |
    | `/tools [compact\|verbose]` | Affiche ce que l'agent actuel peut utiliser dès maintenant |
    | `/status` | Affiche le statut d'exécution/runtime, la disponibilité du Gateway et du système, la santé des plugins, ainsi que l'utilisation/le quota du fournisseur |
    | `/status plugins` | Affiche la santé détaillée des plugins : erreurs de chargement, quarantaines, échecs de canal, problèmes de dépendance, avis de compatibilité |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Gère le [goal](/fr/tools/goal) durable de la session actuelle |
    | `/diagnostics [note]` | Flux de rapport d'assistance réservé au propriétaire. Demande l'approbation d'exécution à chaque fois |
    | `/crestodian <request>` | Exécute l'assistant de configuration et de réparation Crestodian depuis un MP du propriétaire |
    | `/tasks` | Liste les tâches en arrière-plan actives/récentes pour la session actuelle |
    | `/context [list\|detail\|map\|json]` | Explique comment le contexte est assemblé |
    | `/whoami` | Affiche votre identifiant d'expéditeur. Alias : `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Contrôle le pied de page d'utilisation par réponse (`reset`/`inherit`/`clear`/`default` efface le remplacement de session pour réhériter de la valeur par défaut configurée) ou imprime un résumé local des coûts |
  </Accordion>

  <Accordion title="Skills, listes d'autorisation, approbations">
    | Commande | Description |
    | --- | --- |
    | `/skill <name> [input]` | Exécute un skill par nom |
    | `/allowlist [list\|add\|remove] ...` | Gère les entrées de liste d'autorisation. Texte uniquement |
    | `/approve <id> <decision>` | Résout les invites d'approbation d'exécution ou de plugin |
    | `/btw <question>` | Pose une question secondaire sans modifier le contexte de session. Alias : `/side`. Voir [BTW](/fr/tools/btw) |
  </Accordion>

  <Accordion title="Sous-agents et ACP">
    | Commande | Description |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecter les exécutions de sous-agents pour la session actuelle |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gérer les sessions ACP et les options d’exécution. Les contrôles d’exécution nécessitent une identité de propriétaire externe ou d’administrateur Gateway interne |
    | `/focus <target>` | Lier le fil Discord actuel ou le sujet Telegram actuel à une cible de session |
    | `/unfocus` | Supprimer la liaison du fil actuel |
    | `/agents` | Lister les agents liés au fil pour la session actuelle |
  </Accordion>

  <Accordion title="Écritures réservées au propriétaire et administration">
    | Commande | Nécessite | Description |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lire ou écrire `openclaw.json`. Réservé au propriétaire |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lire ou écrire la configuration de serveur MCP gérée par OpenClaw. Réservé au propriétaire |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecter ou modifier l’état des Plugins. Écritures réservées au propriétaire. Alias : `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Remplacements de configuration uniquement à l’exécution. Réservé au propriétaire |
    | `/restart` | `commands.restart: true` (par défaut) | Redémarrer OpenClaw |
    | `/send on\|off\|inherit` | propriétaire | Définir la politique d’envoi |
  </Accordion>

  <Accordion title="Voix, TTS, contrôle de canal">
    | Commande | Description |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Contrôler TTS. Voir [TTS](/fr/tools/tts) |
    | `/activation mention\|always` | Définir le mode d’activation de groupe |
    | `/bash <command>` | Exécuter une commande shell hôte. Alias : `! <command>`. Nécessite `commands.bash: true` |
    | `!poll [sessionId]` | Vérifier une tâche bash en arrière-plan |
    | `!stop [sessionId]` | Arrêter une tâche bash en arrière-plan |
  </Accordion>
</AccordionGroup>

### Commandes d’ancrage

Les commandes d’ancrage basculent la route de réponse de la session active vers un autre canal lié.
Voir [Ancrage de canaux](/fr/concepts/channel-docking) pour la configuration et le dépannage.

Généré depuis les Plugins de canal avec prise en charge des commandes natives :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

Les commandes d’ancrage nécessitent `session.identityLinks`. L’expéditeur source et le pair cible
doivent appartenir au même groupe d’identité.

### Commandes des Plugins inclus

| Commande                                                                                     | Description                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Activer ou désactiver le Dreaming de mémoire (propriétaire ou administrateur Gateway). Voir [Dreaming](/fr/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gérer l’appairage d’appareils. Voir [Appairage](/fr/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | Armer temporairement les commandes de nœud téléphonique à haut risque                         |
| `/voice status\|list\|set <voiceId>`                                                         | Gérer la configuration de voix Talk. Nom natif Discord : `/talkvoice`                         |
| `/card ...`                                                                                  | Envoyer des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line)                |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Contrôler le harnais de serveur d’application Codex. Voir [Harnais Codex](/fr/plugins/codex-harness) |

QQBot uniquement : `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Commandes Skills

Les Skills invocables par l’utilisateur sont exposés comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- Les Skills peuvent s’enregistrer comme commandes directes (par exemple `/prose` pour OpenProse).
- L’enregistrement des commandes Skills natives est contrôlé par `commands.nativeSkills` et
  `channels.<provider>.commands.nativeSkills`.
- Les noms sont assainis en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques.

<AccordionGroup>
  <Accordion title="Distribution des commandes Skills">
    Par défaut, les commandes Skills sont routées vers le modèle comme une requête normale.

    Les Skills peuvent déclarer `command-dispatch: tool` pour router directement vers un outil
    (déterministe, sans intervention du modèle). Exemple : `/prose` (Plugin OpenProse)
    — voir [OpenProse](/fr/prose).

  </Accordion>
  <Accordion title="Arguments des commandes natives">
    Discord utilise l’autocomplétion pour les options dynamiques et les menus de boutons lorsque les
    arguments requis sont omis. Telegram et Slack affichent un menu de boutons pour les commandes avec
    choix. Les choix dynamiques se résolvent par rapport au modèle de session cible, donc les options
    propres au modèle comme les niveaux `/think` suivent le remplacement `/model` de la session.
  </Accordion>
</AccordionGroup>

## `/tools` — ce que l’agent peut utiliser maintenant

`/tools` répond à une question d’exécution : **ce que cet agent peut utiliser maintenant dans cette
conversation** — pas un catalogue de configuration statique.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

Les résultats sont limités à la session. Changer d’agent, de canal, de fil, d’autorisation
d’expéditeur ou de modèle peut modifier la sortie. Pour modifier les profils et les remplacements,
utilisez le panneau Tools de Control UI ou les surfaces de configuration.

## `/model` — sélection du modèle

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants de
fournisseur et de modèle. Le sélecteur respecte `agents.defaults.models`, y compris les entrées
`provider/*`.

## `/config` — écritures de configuration sur disque

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez avec `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuration est validée avant écriture. Les changements invalides sont rejetés. Les mises à jour `/config`
persistent après les redémarrages.

## `/mcp` — configuration de serveur MCP

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez avec `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` stocke la configuration dans la configuration OpenClaw, pas dans les paramètres de projet de l’agent intégré.

## `/debug` — remplacements uniquement à l’exécution

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez avec `commands.debug: true`.
  Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration mais ne sont **pas** écrits sur disque.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — gestion des Plugins

<Note>
  Écritures réservées au propriétaire. Désactivé par défaut — activez avec `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` met à jour la configuration des Plugins et recharge à chaud l’exécution des Plugins du Gateway
pour les nouveaux tours d’agent. `/plugins install` redémarre automatiquement les
Gateways gérés car les modules sources des Plugins ont changé.

## `/trace` — sortie de trace des Plugins

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` révèle les lignes de trace/débogage des Plugins limitées à la session sans mode entièrement détaillé.
Il ne remplace pas `/debug` (remplacements d’exécution) ni `/verbose` (sortie normale
des outils).

## `/btw` — questions annexes

`/btw` est une question annexe rapide sur le contexte de la session actuelle. Alias : `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Contrairement à un message normal :

- Utilise la session actuelle comme contexte d’arrière-plan.
- Dans les sessions du harnais Codex, s’exécute comme fil Codex éphémère annexe.
- Ne modifie **pas** le contexte futur de la session.
- N’est pas écrit dans l’historique de transcription.

Voir [Questions annexes BTW](/fr/tools/btw) pour le comportement complet.

## Notes de surface

<AccordionGroup>
  <Accordion title="Portée de session par surface">
    - **Commandes texte :** s’exécutent dans la session de discussion normale (les DM partagent `main`, les groupes ont leur propre session).
    - **Commandes Discord natives :** `agent:<agentId>:discord:slash:<userId>`
    - **Commandes Slack natives :** `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
    - **Commandes Telegram natives :** `telegram:slash:<userId>` (ciblent la session de discussion via `CommandTargetSessionKey`)
    - **`/stop`** cible la session de discussion active pour interrompre l’exécution actuelle.

  </Accordion>
  <Accordion title="Spécificités Slack">
    `channels.slack.slashCommand` prend en charge une seule commande de style `/openclaw`.
    Avec `commands.native: true`, créez une commande slash Slack par commande intégrée.
    Enregistrez `/agentstatus` (pas `/status`) car Slack réserve
    `/status`. Le texte `/status` fonctionne toujours dans les messages Slack.
  </Accordion>
  <Accordion title="Chemin rapide et raccourcis en ligne">
    - Les messages ne contenant qu’une commande provenant d’expéditeurs allowlistés sont traités immédiatement (contournent la file + le modèle).
    - Les raccourcis en ligne (`/help`, `/commands`, `/status`, `/whoami`) fonctionnent aussi intégrés dans des messages normaux et sont retirés avant que le modèle voie le texte restant.
    - Les messages non autorisés ne contenant qu’une commande sont ignorés silencieusement ; les jetons `/...` en ligne sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Notes sur les arguments">
    - Les commandes acceptent un `:` facultatif entre la commande et les arguments (`/think: high`, `/send: on`).
    - `/new <model>` accepte un alias de modèle, `provider/model`, ou un nom de fournisseur (correspondance approximative) ; si aucune correspondance n’est trouvée, le texte est traité comme corps du message.
    - `/allowlist add|remove` nécessite `commands.config: true` et respecte le paramètre de canal `configWrites`.

  </Accordion>
</AccordionGroup>

## Utilisation et état des fournisseurs

- **Utilisation/quota du fournisseur** (par exemple, « Claude 80 % restant ») s’affiche dans `/status` pour le fournisseur du modèle actuel lorsque le suivi d’utilisation est activé.
- **Les lignes de tokens/cache** dans `/status` peuvent se rabattre sur la dernière entrée d’utilisation de transcription lorsque l’instantané de session en direct est clairsemé.
- **Exécution contre environnement d’exécution :** `/status` signale `Execution` pour le chemin de bac à sable effectif et `Runtime` pour l’entité qui exécute la session : `OpenClaw Default`, `OpenAI Codex`, un backend CLI, ou un backend ACP.
- **Tokens/coût par réponse :** contrôlé par `/usage off|tokens|full`.
- `/model status` concerne les modèles/l’authentification/les points de terminaison, pas l’utilisation.

## Connexe

<CardGroup cols={2}>
  <Card title="Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Comment les commandes slash Skills sont enregistrées et contrôlées.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Créer un Skill qui enregistre sa propre commande slash.
  </Card>
  <Card title="BTW" href="/fr/tools/btw" icon="comments">
    Questions annexes sans modifier le contexte de session.
  </Card>
  <Card title="Steer" href="/fr/tools/steer" icon="compass">
    Guider l’agent en cours d’exécution avec `/steer`.
  </Card>
</CardGroup>
