---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
    - Comprendre comment les commandes de Skills sont enregistrées
sidebarTitle: Slash commands
summary: Toutes les commandes slash, directives et raccourcis intégrés disponibles — configuration, routage et comportement propre à chaque interface.
title: Commandes slash
x-i18n:
    generated_at: "2026-07-12T16:05:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Le Gateway gère les commandes envoyées sous forme de messages autonomes commençant par `/`.
Les commandes bash réservées à l’hôte utilisent `! <cmd>` (avec `/bash <cmd>` comme alias).

Lorsqu’une conversation est liée à une session ACP, le texte normal est acheminé vers le
harnais ACP. Les commandes de gestion du Gateway restent locales : `/acp ...` atteint toujours
le gestionnaire de commandes OpenClaw, tandis que `/status` et `/unfocus` restent locales chaque fois
que la gestion des commandes est activée pour la surface.

## Trois types de commandes

<CardGroup cols={3}>
  <Card title="Commandes" icon="terminal">
    Messages `/...` autonomes gérés par le Gateway. Ils doivent constituer
    l’unique contenu du message.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — supprimées du message avant que le modèle
    ne le voie. Elles conservent les paramètres de session lorsqu’elles sont envoyées seules et servent d’indications
    en ligne lorsqu’elles accompagnent un autre texte.
  </Card>
  <Card title="Raccourcis en ligne" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — s’exécutent immédiatement et sont
    supprimés avant que le modèle ne voie le texte restant. Réservés aux expéditeurs autorisés.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Détails du comportement des directives">
    - Les directives sont supprimées du message avant que le modèle ne le voie.
    - Dans les messages contenant **uniquement des directives** (le message ne contient que des directives), elles
      sont conservées dans la session et une confirmation est renvoyée.
    - Dans les messages de **discussion normale** contenant un autre texte, elles servent d’indications en ligne et
      ne conservent **pas** les paramètres de session.
    - Les directives ne s’appliquent qu’aux **expéditeurs autorisés**. Si `commands.allowFrom`
      est défini, il constitue la seule liste d’autorisation utilisée ; sinon, l’autorisation provient
      des listes d’autorisation ou de l’association du canal, ainsi que de `commands.useAccessGroups`. Pour les expéditeurs
      non autorisés, les directives sont traitées comme du texte brut.
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
  Active l’analyse de `/...` dans les messages de discussion. Sur les surfaces dépourvues de commandes natives
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), les commandes
  textuelles fonctionnent même si cette option est définie sur `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes natives. Mode automatique : activé pour Discord/Telegram ; désactivé pour Slack ;
  ignoré pour les fournisseurs ne prenant pas en charge les commandes natives. Remplacez ce réglage pour chaque canal avec
  `channels.<provider>.commands.native`. Sur Discord, `false` ignore l’enregistrement des commandes
  à barre oblique ; les commandes précédemment enregistrées peuvent rester visibles jusqu’à leur suppression.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Enregistre nativement les commandes de Skills lorsque cela est pris en charge. Mode automatique : activé pour
  Discord/Telegram ; désactivé pour Slack. Remplacez ce réglage avec
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Active `! <cmd>` pour exécuter des commandes shell sur l’hôte (alias `/bash <cmd>`). Nécessite
  les listes d’autorisation de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durée d’attente de bash avant de passer en mode arrière-plan (`0` passe
  immédiatement en arrière-plan).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Active `/config` (lit/écrit `openclaw.json`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Active `/plugins` (découverte/état des plugins, ainsi qu’installation et activation/désactivation). Écritures réservées au propriétaire.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Active `/debug` (remplacements de configuration limités à l’exécution). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Active `/restart` et les actions de l’outil de redémarrage du Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Liste d’autorisation explicite du propriétaire pour les surfaces de commandes réservées au propriétaire. Distincte de
  `commands.allowFrom` et de l’accès par association en message privé.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Par canal : exige l’identité du propriétaire pour les commandes qui lui sont réservées. Lorsque la valeur est `true`,
  l’expéditeur doit correspondre à `commands.ownerAllowFrom` ou disposer de la portée interne `operator.admin`.
  Une entrée générique dans `allowFrom` n’est **pas** suffisante.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Contrôle la manière dont les identifiants des propriétaires apparaissent dans le prompt système.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secret HMAC utilisé lorsque `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, elle constitue l’**unique** source d’autorisation pour les commandes et les directives. Utilisez `"*"` comme valeur globale par défaut ; les clés propres aux fournisseurs la remplacent.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applique les listes d’autorisation et les politiques aux commandes lorsque `commands.allowFrom` n’est pas défini.
</ParamField>

## Liste des commandes

Les commandes proviennent de trois sources :

- **Commandes intégrées au cœur :** `src/auto-reply/commands-registry.shared.ts`
- **Commandes de dock générées :** `src/auto-reply/commands-registry.data.ts`
- **Commandes de Plugin :** appels à `registerCommand()` du Plugin

La disponibilité dépend des indicateurs de configuration, de la surface du canal et des
plugins installés et activés.

### Commandes du cœur

<AccordionGroup>
  <Accordion title="Sessions et exécutions">
    | Commande | Description |
    | --- | --- |
    | `/new [model]` | Archive la session actuelle et en démarre une nouvelle |
    | `/reset [soft [message]]` | Réinitialise la session actuelle sur place. `soft` conserve la transcription, supprime les identifiants de session réutilisés du backend CLI et relance le démarrage |
    | `/name <title>` | Nomme ou renomme la session actuelle. Omettez le titre pour afficher le nom actuel et une suggestion |
    | `/compact [instructions]` | Effectue la Compaction du contexte de session. Consultez [Compaction](/fr/concepts/compaction) |
    | `/stop` | Interrompt l’exécution actuelle |
    | `/session idle <duration\|off>` | Gère l’expiration après inactivité de la liaison au fil de discussion |
    | `/session max-age <duration\|off>` | Gère l’expiration selon l’âge maximal de la liaison au fil de discussion |
    | `/export-session [path]` | Exporte la session actuelle au format HTML. Alias : `/export` |
    | `/export-trajectory [path]` | Exporte un ensemble de trajectoires JSONL pour la session actuelle. Alias : `/trajectory` |

    <Note>
      L’interface de contrôle intercepte la saisie de `/new` pour créer une nouvelle
      session de tableau de bord et y basculer, sauf lorsque `session.dmScope: "main"` est configuré
      et que le parent actuel est la session principale de l’agent — dans ce cas, `/new`
      réinitialise la session principale sur place. La saisie de `/reset` exécute toujours la
      réinitialisation sur place du Gateway. Utilisez `/model default` lorsque vous souhaitez effacer
      la sélection de modèle épinglée pour la session.
    </Note>

  </Accordion>

  <Accordion title="Contrôles du modèle et de l’exécution">
    | Commande | Description |
    | --- | --- |
    | `/think <level\|default>` | Définit le niveau de réflexion ou efface le remplacement propre à la session. Alias : `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Active ou désactive la sortie détaillée. Alias : `/v` |
    | `/trace on\|off` | Active ou désactive la sortie de traçage du Plugin pour la session actuelle |
    | `/fast [status\|auto\|on\|off\|default]` | Affiche, définit ou efface le mode rapide |
    | `/reasoning [on\|off\|stream]` | Active ou désactive la visibilité du raisonnement. Alias : `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Active ou désactive le mode élevé. Alias : `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Affiche ou définit les valeurs par défaut d’exécution |
    | `/login [codex\|openai\|openai-codex]` | Associe la connexion Codex/OpenAI depuis une discussion privée ou une session de l’interface Web. Réservé au propriétaire ou à l’administrateur |
    | `/model [name\|#\|status]` | Affiche ou définit le modèle |
    | `/models [provider] [page] [limit=<n>\|all]` | Répertorie les fournisseurs ou modèles configurés ou disponibles via l’authentification |
    | `/queue <mode>` | Gère le comportement de la file d’attente des exécutions actives. Consultez [File d’attente](/fr/concepts/queue) et [Pilotage de la file d’attente](/fr/concepts/queue-steering) |
    | `/steer <message>` | Injecte des consignes dans l’exécution active. Alias : `/tell`. Consultez [Piloter](/fr/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sécurité des modes détaillé, traçage, rapide et raisonnement">
        - `/verbose` est destiné au débogage — laissez-le **désactivé** en utilisation normale.
        - `/trace` révèle uniquement les lignes de traçage et de débogage appartenant au Plugin ; les messages détaillés habituels restent désactivés.
        - `/fast auto|on|off` conserve un remplacement propre à la session ; utilisez l’option `inherit` de l’interface Sessions pour l’effacer.
        - `/fast` dépend du fournisseur : OpenAI/Codex le mappe à `service_tier=priority` ; les requêtes Anthropic directes le mappent à `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` et `/trace` présentent des risques dans les groupes — ils peuvent révéler le raisonnement interne ou les diagnostics du Plugin. Laissez-les désactivés dans les discussions de groupe.

      </Accordion>
      <Accordion title="Détails du changement de modèle">
        - `/model` enregistre immédiatement le nouveau modèle dans la session.
        - Si l’agent est inactif, l’exécution suivante l’utilise immédiatement.
        - Si une exécution est active, le changement est marqué comme en attente et appliqué au prochain point de nouvelle tentative propre.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Découverte et état">
    | Commande | Description |
    | --- | --- |
    | `/help` | Affiche le résumé succinct de l’aide |
    | `/commands` | Affiche le catalogue de commandes généré |
    | `/tools [compact\|verbose]` | Affiche ce que l’agent actuel peut utiliser immédiatement |
    | `/status` | Affiche l’état de l’exécution et du runtime, la durée de fonctionnement du Gateway et du système, l’intégrité des plugins, ainsi que l’utilisation et le quota du fournisseur |
    | `/status plugins` | Affiche l’intégrité détaillée des plugins : erreurs de chargement, mises en quarantaine, échecs des plugins de canal, problèmes de dépendances et avis de compatibilité. Nécessite `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gère l’[objectif](/fr/tools/goal) persistant de la session actuelle |
    | `/diagnostics [note]` | Processus de rapport d’assistance réservé au propriétaire. Demande systématiquement l’autorisation d’exécution |
    | `/crestodian <request>` | Exécute l’assistant de configuration et de réparation Crestodian depuis un message privé du propriétaire |
    | `/tasks` | Répertorie les tâches d’arrière-plan actives ou récentes pour la session actuelle |
    | `/context [list\|detail\|map\|json]` | Explique comment le contexte est assemblé |
    | `/whoami` | Affiche votre identifiant d’expéditeur. Alias : `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Contrôle le pied de page d’utilisation de chaque réponse (`reset`/`inherit`/`clear`/`default` efface le remplacement propre à la session afin d’hériter à nouveau de la valeur par défaut configurée) ou affiche un récapitulatif local des coûts |
  </Accordion>

  <Accordion title="Skills, listes d’autorisation et approbations">
    | Commande | Description |
    | --- | --- |
    | `/skill <name> [input]` | Exécute une Skill par son nom |
    | `/learn [request]` | Prépare une Skill révisable à partir de la conversation actuelle ou de sources nommées via l’[Atelier de Skills](/fr/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gère les entrées de la liste d’autorisation. Texte uniquement |
    | `/approve <id> <decision>` | Traite les demandes d’approbation d’exécution ou de Plugin |
    | `/btw <question>` | Pose une question annexe sans modifier le contexte de la session. Alias : `/side`. Consultez [À propos](/fr/tools/btw) |
  </Accordion>

  <Accordion title="Sous-agents et ACP">
    | Commande | Description |
    | --- | --- |
    | `/subagents list\|log\|info` | Inspecter les exécutions des sous-agents pour la session actuelle |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gérer les sessions ACP et les options d’exécution. Les contrôles d’exécution nécessitent l’identité d’un propriétaire externe ou d’un administrateur interne du Gateway |
    | `/focus <target>` | Lier le fil Discord ou le sujet Telegram actuel à une cible de session |
    | `/unfocus` | Supprimer la liaison du fil actuel |
    | `/agents` | Répertorier les agents liés au fil pour la session actuelle |
  </Accordion>

  <Accordion title="Écritures et administration réservées au propriétaire">
    | Commande | Prérequis | Description |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lire ou écrire `openclaw.json`. Réservé au propriétaire |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lire ou écrire la configuration des serveurs MCP gérés par OpenClaw. Réservé au propriétaire |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecter ou modifier l’état des plugins. Écritures réservées au propriétaire. Alias : `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Remplacements de configuration limités à l’exécution. Réservé au propriétaire |
    | `/restart` | `commands.restart: true` (par défaut) | Redémarrer OpenClaw |
    | `/send on\|off\|inherit` | propriétaire | Définir la politique d’envoi |
  </Accordion>

  <Accordion title="Voix, synthèse vocale et contrôle des canaux">
    | Commande | Description |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Contrôler la synthèse vocale. Consultez [Synthèse vocale](/fr/tools/tts) |
    | `/activation mention\|always` | Définir le mode d’activation des groupes |
    | `/bash <command>` | Exécuter une commande shell sur l’hôte. Alias : `! <command>`. Nécessite `commands.bash: true` |
    | `!poll [sessionId]` | Vérifier une tâche bash en arrière-plan |
    | `!stop [sessionId]` | Arrêter une tâche bash en arrière-plan |
  </Accordion>
</AccordionGroup>

### Commandes d’ancrage

Les commandes d’ancrage redirigent les réponses de la session active vers un autre canal lié.
Consultez [Ancrage des canaux](/fr/concepts/channel-docking) pour la configuration et le dépannage.

Générées à partir des plugins de canal prenant en charge les commandes natives :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

Les commandes d’ancrage nécessitent `session.identityLinks`. L’expéditeur source et le pair cible
doivent appartenir au même groupe d’identités.

### Commandes des plugins intégrés

| Commande                                                | Description                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activer ou désactiver le Dreaming de la mémoire (propriétaire ou administrateur du Gateway). Consultez [Dreaming](/fr/concepts/dreaming)                                                           |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gérer l’appairage des appareils. Consultez [Appairage](/fr/channels/pairing)                                                                                                                       |
| `/phone status\|arm ...\|disarm`                        | Autoriser temporairement les commandes de Node à haut risque (caméra/écran/ordinateur/écritures). Consultez [Utilisation de l’ordinateur](/nodes/computer-use)                                  |
| `/voice status\|list\|set <voiceId>`                    | Gérer la configuration vocale de Talk. Nom natif Discord : `/talkvoice`                                                                                                                        |
| `/card ...`                                             | Envoyer des préréglages de cartes enrichies LINE. Consultez [LINE](/fr/channels/line)                                                                                                              |
| `/codex <action> ...`                                   | Lier, piloter et inspecter le banc d’essai du serveur d’application Codex (état, fils, reprise, modèle, mode rapide, autorisations, compaction, révision, MCP, Skills, etc.). Consultez [Banc d’essai Codex](/fr/plugins/codex-harness) |

QQBot uniquement : `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Commandes de Skills

Les Skills pouvant être invoqués par l’utilisateur sont exposés sous forme de commandes à barre oblique :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- Les Skills peuvent s’enregistrer comme commandes directes (par exemple `/prose` pour OpenProse).
- L’enregistrement natif des commandes de Skills est contrôlé par `commands.nativeSkills` et
  `channels.<provider>.commands.nativeSkills`.
- Les noms sont normalisés selon `a-z0-9_` (32 caractères maximum) ; les collisions reçoivent des suffixes numériques.

<AccordionGroup>
  <Accordion title="Routage des commandes de Skills">
    Par défaut, les commandes de Skills sont transmises au modèle comme une requête normale.

    Les Skills peuvent déclarer `command-dispatch: tool` pour être transmis directement à un outil
    (de manière déterministe, sans intervention du modèle). Exemple : `/prose` (plugin OpenProse)
    — consultez [OpenProse](/fr/prose).

  </Accordion>
  <Accordion title="Arguments des commandes natives">
    Discord utilise l’autocomplétion pour les options dynamiques et des menus de boutons lorsque des
    arguments obligatoires sont omis. Telegram et Slack affichent un menu de boutons pour les commandes
    comportant des choix. Les choix dynamiques sont résolus en fonction du modèle de la session cible ; les options
    propres au modèle, telles que les niveaux de `/think`, suivent le remplacement `/model` de la session.
  </Accordion>
</AccordionGroup>

## `/tools` : ce que l’agent peut utiliser maintenant

`/tools` répond à une question d’exécution : **ce que cet agent peut utiliser maintenant dans cette
conversation** — et non un catalogue de configuration statique.

```text
/tools         # vue compacte
/tools verbose # avec de courtes descriptions
```

Les résultats sont propres à la session. Changer d’agent, de canal, de fil, d’autorisation
de l’expéditeur ou de modèle peut modifier la sortie. Pour modifier les profils et les remplacements,
utilisez le panneau Tools de l’interface de contrôle ou les surfaces de configuration.

## `/model` : sélection du modèle

```text
/model             # afficher le sélecteur de modèle
/model list        # identique
/model 3           # sélectionner par numéro dans le sélecteur
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # effacer la sélection du modèle de la session
/model status      # vue détaillée avec le point de terminaison et le mode API
```

Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des listes déroulantes
de fournisseurs et de modèles. Le sélecteur respecte `agents.defaults.models`, y compris les entrées
`provider/*`.

## `/config` : écritures de configuration sur disque

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez-le avec `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configuration est validée avant l’écriture. Les modifications non valides sont rejetées. Les mises à jour
effectuées avec `/config` persistent après les redémarrages.

## `/mcp` : configuration des serveurs MCP

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez-le avec `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` stocke la configuration dans celle d’OpenClaw, et non dans les paramètres de projet de l’agent intégré.
`/mcp show` masque les champs contenant des identifiants, les valeurs des options reconnues comme contenant
des identifiants et les arguments connus pour avoir la forme de secrets. Lorsqu’elle est exécutée depuis un groupe, la
configuration est envoyée en privé au propriétaire ; si aucun itinéraire privé vers le propriétaire n’est
disponible, la commande échoue de manière sécurisée et demande au propriétaire de réessayer depuis une
conversation directe.

## `/debug` : remplacements limités à l’exécution

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez-le avec `commands.debug: true`.
  Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration, mais ne sont **pas** écrits sur disque.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` : gestion des plugins

<Note>
  Écritures réservées au propriétaire. Désactivé par défaut — activez-le avec `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` met à jour la configuration des plugins et recharge à chaud l’environnement
d’exécution des plugins du Gateway pour les nouveaux tours d’agent. `/plugins install` redémarre automatiquement
les Gateways gérés, car les modules sources des plugins ont changé.

## `/trace` : sortie de traçage des plugins

```text
/trace          # afficher l’état actuel du traçage
/trace on
/trace off
```

`/trace` révèle les lignes de traçage et de débogage des plugins propres à la session sans activer le mode
entièrement détaillé. Il ne remplace pas `/debug` (remplacements d’exécution) ni `/verbose` (sortie normale
des outils).

## `/btw` : questions secondaires

`/btw` permet de poser rapidement une question secondaire sur le contexte de la session actuelle. Alias : `/side`.

```text
/btw que faisons-nous actuellement ?
/side qu’est-ce qui a changé pendant que l’exécution principale se poursuivait ?
```

Contrairement à un message normal :

- Utilise la session actuelle comme contexte d’arrière-plan.
- Dans les sessions du banc d’essai Codex, s’exécute comme un fil secondaire Codex éphémère.
- Ne modifie **pas** le contexte futur de la session.
- N’est pas enregistré dans l’historique de la transcription.

Consultez [Questions secondaires BTW](/fr/tools/btw) pour connaître le comportement complet.

## Remarques sur les surfaces

<AccordionGroup>
  <Accordion title="Portée des sessions par surface">
    - **Commandes textuelles :** s’exécutent dans la session de conversation normale (les messages privés partagent `main`, les groupes ont leur propre session).
    - **Commandes Discord natives :** `agent:<agentId>:discord:slash:<userId>`
    - **Commandes Slack natives :** `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
    - **Commandes Telegram natives :** `telegram:slash:<userId>` (ciblent la session de conversation via `CommandTargetSessionKey`)
    - **`/login codex`** envoie les codes d’appairage des appareils uniquement par conversation privée ou via les chemins de réponse de l’interface Web. Les appels depuis un groupe ou un sujet Telegram demandent au propriétaire d’envoyer plutôt un message privé au bot.
    - **`/stop`** cible la session de conversation active afin d’interrompre l’exécution en cours.

  </Accordion>
  <Accordion title="Spécificités de Slack">
    `channels.slack.slashCommand` prend en charge une seule commande de type `/openclaw`.
    Avec `commands.native: true`, créez une commande Slack à barre oblique pour chaque commande
    intégrée. Enregistrez `/agentstatus` (et non `/status`), car Slack réserve
    `/status`. La commande textuelle `/status` fonctionne toujours dans les messages Slack.
  </Accordion>
  <Accordion title="Chemin rapide et raccourcis intégrés">
    - Les messages contenant uniquement une commande provenant d’expéditeurs figurant sur la liste d’autorisation sont traités immédiatement (sans passer par la file d’attente ni le modèle).
    - Les raccourcis intégrés (`/help`, `/commands`, `/status`, `/whoami`) fonctionnent également au sein de messages normaux et sont supprimés avant que le modèle ne voie le texte restant.
    - Les messages contenant uniquement une commande provenant d’expéditeurs non autorisés sont ignorés silencieusement ; les jetons `/...` intégrés sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Remarques sur les arguments">
    - Les commandes acceptent un `:` facultatif entre la commande et les arguments (`/think: high`, `/send: on`).
    - `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; en l’absence de correspondance, le texte est traité comme le corps du message.
    - `/allowlist add|remove` nécessite `commands.config: true` et respecte le paramètre `configWrites` du canal.

  </Accordion>
</AccordionGroup>

## Utilisation et état des fournisseurs

- **Utilisation/quota du fournisseur** (par exemple, « Claude : 80 % restants ») s’affiche dans `/status` pour le fournisseur du modèle actuel lorsque le suivi de l’utilisation est activé.
- **Les lignes de jetons/cache** dans `/status` peuvent utiliser en dernier recours la dernière entrée d’utilisation de la transcription lorsque l’instantané de la session en direct contient peu d’informations.
- **Exécution et environnement d’exécution :** `/status` indique `Execution` pour le chemin effectif du bac à sable et `Runtime` pour l’entité qui exécute la session : `OpenClaw Default`, `OpenAI Codex`, un backend CLI ou un backend ACP.
- **Jetons/coût par réponse :** contrôlés par `/usage off|tokens|full`.
- `/model status` concerne les modèles, l’authentification et les points de terminaison, et non l’utilisation.

## Contenu associé

<CardGroup cols={2}>
  <Card title="Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Comment les commandes obliques de Skills sont enregistrées et soumises à des contrôles d’accès.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Créez une Skill qui enregistre sa propre commande oblique.
  </Card>
  <Card title="BTW" href="/fr/tools/btw" icon="comments">
    Posez des questions annexes sans modifier le contexte de la session.
  </Card>
  <Card title="Pilotage" href="/fr/tools/steer" icon="compass">
    Guidez l’agent pendant l’exécution avec `/steer`.
  </Card>
</CardGroup>
