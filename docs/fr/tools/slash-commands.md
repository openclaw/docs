---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
    - Comprendre comment les commandes de Skills sont enregistrées
sidebarTitle: Slash commands
summary: Toutes les commandes à barre oblique, directives et raccourcis en ligne disponibles — configuration, routage et comportement propre à chaque interface.
title: Commandes à barre oblique
x-i18n:
    generated_at: "2026-07-12T03:10:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Le Gateway traite les commandes envoyées sous forme de messages autonomes commençant par `/`.
Les commandes bash réservées à l’hôte utilisent `! <cmd>` (avec `/bash <cmd>` comme alias).

Lorsqu’une conversation est liée à une session ACP, le texte normal est acheminé vers le
harnais ACP. Les commandes de gestion du Gateway restent locales : `/acp ...` atteint
toujours le gestionnaire de commandes OpenClaw, tandis que `/status` et `/unfocus` restent
locales chaque fois que le traitement des commandes est activé pour l’interface.

## Trois types de commandes

<CardGroup cols={3}>
  <Card title="Commandes" icon="terminal">
    Messages `/...` autonomes traités par le Gateway. Ils doivent constituer
    l’unique contenu du message.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — supprimées du message avant que le modèle
    ne le voie. Elles conservent les paramètres de session lorsqu’elles sont envoyées seules
    et servent d’indications intégrées lorsqu’elles accompagnent un autre texte.
  </Card>
  <Card title="Raccourcis intégrés" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — s’exécutent immédiatement et sont
    supprimés avant que le modèle ne voie le texte restant. Expéditeurs autorisés uniquement.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Détails du comportement des directives">
    - Les directives sont supprimées du message avant que le modèle ne le voie.
    - Dans les messages contenant **uniquement des directives** (le message ne contient que des directives), elles
      sont conservées dans la session et renvoient un accusé de réception.
    - Dans les messages de **discussion normale** contenant un autre texte, elles servent d’indications intégrées et
      ne conservent **pas** les paramètres de session.
    - Les directives ne s’appliquent qu’aux **expéditeurs autorisés**. Si `commands.allowFrom`
      est défini, il constitue l’unique liste d’autorisation utilisée ; sinon, l’autorisation provient
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
  Active l’analyse des commandes `/...` dans les messages de discussion. Sur les interfaces dépourvues de commandes natives
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), les commandes textuelles
  fonctionnent même lorsque ce paramètre est défini sur `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes natives. Mode automatique : activé pour Discord/Telegram, désactivé pour Slack ;
  ignoré pour les fournisseurs sans prise en charge native. Remplacez ce réglage par canal avec
  `channels.<provider>.commands.native`. Sur Discord, `false` ignore l’enregistrement des commandes slash ;
  les commandes précédemment enregistrées peuvent rester visibles jusqu’à leur suppression.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Enregistre nativement les commandes de Skills lorsque cela est pris en charge. Mode automatique : activé pour
  Discord/Telegram, désactivé pour Slack. Remplacez ce réglage avec
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Active `! <cmd>` pour exécuter des commandes shell sur l’hôte (alias `/bash <cmd>`). Nécessite
  les listes d’autorisation de `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durée pendant laquelle bash attend avant de passer en arrière-plan (`0` passe
  immédiatement en arrière-plan).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Active `/config` (lecture/écriture de `openclaw.json`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Active `/mcp` (lecture/écriture de la configuration MCP gérée par OpenClaw sous `mcp.servers`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Active `/plugins` (découverte et état des plugins, ainsi qu’installation, activation et désactivation). Écritures réservées au propriétaire.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Active `/debug` (remplacements de configuration limités à l’exécution). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Active `/restart` et les actions de redémarrage du Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Liste d’autorisation explicite du propriétaire pour les interfaces de commande qui lui sont réservées. Distincte de
  `commands.allowFrom` et de l’accès par association aux messages privés.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Par canal : exige l’identité du propriétaire pour les commandes qui lui sont réservées. Lorsque la valeur est `true`,
  l’expéditeur doit correspondre à `commands.ownerAllowFrom` ou disposer de la portée interne `operator.admin`.
  Une entrée générique dans `allowFrom` ne suffit **pas**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Contrôle la manière dont les identifiants des propriétaires apparaissent dans le prompt système.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Secret HMAC utilisé lorsque `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, elle constitue
  l’**unique** source d’autorisation pour les commandes et les directives. Utilisez `"*"` comme
  valeur globale par défaut ; les clés propres aux fournisseurs la remplacent.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applique les listes d’autorisation et les politiques aux commandes lorsque `commands.allowFrom` n’est pas défini.
</ParamField>

## Liste des commandes

Les commandes proviennent de trois sources :

- **Commandes intégrées au cœur :** `src/auto-reply/commands-registry.shared.ts`
- **Commandes de dock générées :** `src/auto-reply/commands-registry.data.ts`
- **Commandes des Plugins :** appels à `registerCommand()` par les Plugins

La disponibilité dépend des indicateurs de configuration, de la surface du canal et des Plugins
installés et activés.

### Commandes du cœur

  <AccordionGroup>
  <Accordion title="Sessions et exécutions">
    | Commande | Description |
    | --- | --- |
    | `/new [model]` | Archiver la session actuelle et en démarrer une nouvelle |
    | `/reset [soft [message]]` | Réinitialiser la session actuelle sur place. `soft` conserve la transcription, supprime les identifiants de session réutilisés du backend CLI et relance le démarrage |
    | `/name <title>` | Nommer ou renommer la session actuelle. Omettre le titre pour afficher le nom actuel et une suggestion |
    | `/compact [instructions]` | Compacter le contexte de la session. Voir [Compaction](/fr/concepts/compaction) |
    | `/stop` | Interrompre l’exécution actuelle |
    | `/session idle <duration\|off>` | Gérer l’expiration pour inactivité de la liaison au fil de discussion |
    | `/session max-age <duration\|off>` | Gérer l’expiration à l’âge maximal de la liaison au fil de discussion |
    | `/export-session [path]` | Exporter la session actuelle au format HTML. Alias : `/export` |
    | `/export-trajectory [path]` | Exporter un ensemble de trajectoires JSONL pour la session actuelle. Alias : `/trajectory` |

    <Note>
      L’interface de contrôle intercepte la saisie de `/new` pour créer une nouvelle
      session du tableau de bord et y basculer, sauf lorsque `session.dmScope: "main"`
      est configuré et que le parent actuel est la session principale de l’agent —
      dans ce cas, `/new` réinitialise la session principale sur place. La saisie de
      `/reset` exécute toujours la réinitialisation sur place du Gateway. Utilisez
      `/model default` pour effacer la sélection de modèle épinglée à la session.
    </Note>

  </Accordion>

  <Accordion title="Contrôles du modèle et de l’exécution">
    | Commande | Description |
    | --- | --- |
    | `/think <level\|default>` | Définir le niveau de réflexion ou effacer le remplacement propre à la session. Alias : `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Activer ou désactiver la sortie détaillée. Alias : `/v` |
    | `/trace on\|off` | Activer ou désactiver la sortie de trace du Plugin pour la session actuelle |
    | `/fast [status\|auto\|on\|off\|default]` | Afficher, définir ou effacer le mode rapide |
    | `/reasoning [on\|off\|stream]` | Activer ou désactiver la visibilité du raisonnement. Alias : `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Activer ou désactiver le mode élevé. Alias : `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Afficher ou définir les valeurs par défaut d’exécution |
    | `/login [codex\|openai\|openai-codex]` | Associer la connexion Codex/OpenAI depuis une discussion privée ou une session de l’interface Web. Réservé au propriétaire ou à l’administrateur |
    | `/model [name\|#\|status]` | Afficher ou définir le modèle |
    | `/models [provider] [page] [limit=<n>\|all]` | Répertorier les fournisseurs ou modèles configurés ou disponibles pour l’authentification |
    | `/queue <mode>` | Gérer le comportement de la file d’attente des exécutions actives. Voir [File d’attente](/fr/concepts/queue) et [Pilotage de la file d’attente](/fr/concepts/queue-steering) |
    | `/steer <message>` | Injecter des directives dans l’exécution active. Alias : `/tell`. Voir [Pilotage](/fr/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sécurité de verbose / trace / fast / reasoning">
        - `/verbose` est destiné au débogage — laissez-le **désactivé** en utilisation normale.
        - `/trace` ne révèle que les lignes de trace et de débogage propres aux Plugins ; les messages détaillés ordinaires restent désactivés.
        - `/fast auto|on|off` conserve un remplacement propre à la session ; utilisez l’option `inherit` de l’interface Sessions pour l’effacer.
        - `/fast` dépend du fournisseur : OpenAI/Codex le traduit en `service_tier=priority` ; les requêtes directes à Anthropic le traduisent en `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` et `/trace` présentent des risques dans les groupes — ils peuvent révéler le raisonnement interne ou les diagnostics des Plugins. Laissez-les désactivés dans les discussions de groupe.

      </Accordion>
      <Accordion title="Détails du changement de modèle">
        - `/model` enregistre immédiatement le nouveau modèle dans la session.
        - Si l’agent est inactif, la prochaine exécution l’utilise immédiatement.
        - Si une exécution est en cours, le changement est marqué comme en attente et appliqué au prochain point de nouvelle tentative propre.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Découverte et état">
    | Commande | Description |
    | --- | --- |
    | `/help` | Afficher le résumé succinct de l’aide |
    | `/commands` | Afficher le catalogue de commandes généré |
    | `/tools [compact\|verbose]` | Afficher ce que l’agent actuel peut utiliser à cet instant |
    | `/status` | Afficher l’état de l’exécution et de l’environnement d’exécution, la durée de fonctionnement du Gateway et du système, l’état des plugins, ainsi que l’utilisation et le quota du fournisseur |
    | `/status plugins` | Afficher l’état détaillé des plugins : erreurs de chargement, mises en quarantaine, défaillances des plugins de canaux, problèmes de dépendances et avis de compatibilité. Nécessite `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gérer l’[objectif](/fr/tools/goal) persistant de la session actuelle |
    | `/diagnostics [note]` | Processus de rapport d’assistance réservé au propriétaire. Demande systématiquement l’autorisation d’exécution |
    | `/crestodian <request>` | Exécuter l’assistant de configuration et de réparation Crestodian depuis un message privé du propriétaire |
    | `/tasks` | Répertorier les tâches en arrière-plan actives ou récentes de la session actuelle |
    | `/context [list\|detail\|map\|json]` | Expliquer comment le contexte est assemblé |
    | `/whoami` | Afficher votre identifiant d’expéditeur. Alias : `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Contrôler le pied de page d’utilisation de chaque réponse (`reset`/`inherit`/`clear`/`default` efface la valeur de remplacement de la session afin d’hériter à nouveau de la valeur par défaut configurée) ou afficher un résumé local des coûts |
  </Accordion>

  <Accordion title="Skills, listes d’autorisation et approbations">
    | Commande | Description |
    | --- | --- |
    | `/skill <name> [input]` | Exécuter une Skill par son nom |
    | `/learn [request]` | Préparer une Skill révisable à partir de la conversation actuelle ou de sources nommées avec l’[Atelier de Skills](/fr/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gérer les entrées de la liste d’autorisation. Texte uniquement |
    | `/approve <id> <decision>` | Répondre aux demandes d’approbation d’exécution ou de plugin |
    | `/btw <question>` | Poser une question annexe sans modifier le contexte de la session. Alias : `/side`. Voir [BTW](/fr/tools/btw) |
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
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lire ou modifier `openclaw.json`. Réservé au propriétaire |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lire ou modifier la configuration des serveurs MCP gérés par OpenClaw. Réservé au propriétaire |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Inspecter ou modifier l’état des plugins. Écritures réservées au propriétaire. Alias : `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Remplacements de configuration limités à l’exécution. Réservé au propriétaire |
    | `/restart` | `commands.restart: true` (par défaut) | Redémarrer OpenClaw |
    | `/send on\|off\|inherit` | propriétaire | Définir la stratégie d’envoi |
  </Accordion>

  <Accordion title="Voix, TTS et contrôle des canaux">
    | Commande | Description |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Contrôler la synthèse vocale. Voir [TTS](/fr/tools/tts) |
    | `/activation mention\|always` | Définir le mode d’activation des groupes |
    | `/bash <command>` | Exécuter une commande shell sur l’hôte. Alias : `! <command>`. Nécessite `commands.bash: true` |
    | `!poll [sessionId]` | Vérifier une tâche bash en arrière-plan |
    | `!stop [sessionId]` | Arrêter une tâche bash en arrière-plan |
  </Accordion>
</AccordionGroup>

### Commandes d’ancrage

Les commandes d’ancrage basculent l’itinéraire de réponse de la session active vers un autre canal lié.
Consultez [Ancrage des canaux](/fr/concepts/channel-docking) pour la configuration et le dépannage.

Générées à partir des plugins de canaux prenant en charge les commandes natives :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

Les commandes d’ancrage nécessitent `session.identityLinks`. L’expéditeur source et le pair cible
doivent appartenir au même groupe d’identités.

### Commandes des plugins intégrés

| Commande                                                | Description                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activer ou désactiver le Dreaming de la mémoire (propriétaire ou administrateur du Gateway). Voir [Dreaming](/fr/concepts/dreaming)                                                               |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gérer l’association des appareils. Voir [Association](/fr/channels/pairing)                                                                                                                       |
| `/phone status\|arm ...\|disarm`                        | Autoriser temporairement les commandes à haut risque du Node (caméra/écran/ordinateur/écritures). Voir [Utilisation de l’ordinateur](/fr/nodes/computer-use)                                      |
| `/voice status\|list\|set <voiceId>`                    | Gérer la configuration de la voix Talk. Nom natif dans Discord : `/talkvoice`                                                                                                                   |
| `/card ...`                                             | Envoyer des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line)                                                                                                                   |
| `/codex <action> ...`                                   | Lier, piloter et inspecter le banc d’essai du serveur d’application Codex (état, fils, reprise, modèle, mode rapide, autorisations, compactage, révision, MCP, Skills, etc.). Voir [Banc d’essai Codex](/fr/plugins/codex-harness) |

Exclusivement pour QQBot : `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Commandes de Skills

Les Skills pouvant être invoquées par l’utilisateur sont exposées sous forme de commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- Les Skills peuvent s’enregistrer comme commandes directes (par exemple `/prose` pour OpenProse).
- L’enregistrement natif des commandes de Skills est contrôlé par `commands.nativeSkills` et
  `channels.<provider>.commands.nativeSkills`.
- Les noms sont normalisés selon `a-z0-9_` (32 caractères maximum) ; les collisions reçoivent des suffixes numériques.

<AccordionGroup>
  <Accordion title="Acheminement des commandes de Skills">
    Par défaut, les commandes de Skills sont acheminées vers le modèle comme une requête normale.

    Les Skills peuvent déclarer `command-dispatch: tool` afin d’être acheminées directement vers un outil
    (comportement déterministe, sans intervention du modèle). Exemple : `/prose` (plugin OpenProse)
    — voir [OpenProse](/fr/prose).

  </Accordion>
  <Accordion title="Arguments des commandes natives">
    Discord utilise la saisie semi-automatique pour les options dynamiques et des menus de boutons lorsque des
    arguments requis sont omis. Telegram et Slack affichent un menu de boutons pour les commandes proposant
    des choix. Les choix dynamiques sont résolus en fonction du modèle de la session cible ; les options propres
    au modèle, telles que les niveaux de `/think`, suivent donc le remplacement `/model` de la session.
  </Accordion>
</AccordionGroup>

## `/tools` : ce que l’agent peut utiliser maintenant

`/tools` répond à une question d’exécution : **ce que cet agent peut utiliser actuellement dans cette
conversation** — et non un catalogue de configuration statique.

```text
/tools         # vue compacte
/tools verbose # avec de brèves descriptions
```

Les résultats sont propres à la session. Changer d’agent, de canal, de fil, d’autorisation
de l’expéditeur ou de modèle peut modifier la sortie. Pour modifier les profils et les remplacements,
utilisez le panneau Outils de l’interface de contrôle ou les surfaces de configuration.

## `/model` : sélection du modèle

```text
/model             # afficher le sélecteur de modèle
/model list        # identique
/model 3           # sélectionner par numéro dans le sélecteur
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # effacer la sélection de modèle de la session
/model status      # vue détaillée avec le point de terminaison et le mode d’API
```

Dans Discord, `/model` et `/models` ouvrent un sélecteur interactif comportant des listes déroulantes
de fournisseurs et de modèles. Le sélecteur respecte `agents.defaults.models`, y compris les
entrées `provider/*`.

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
d’exécution des plugins du Gateway pour les nouveaux tours d’agent. `/plugins install` redémarre
automatiquement les Gateways gérés, car les modules sources des plugins ont changé.

## `/trace` : sortie de traçage des plugins

```text
/trace          # afficher l’état actuel du traçage
/trace on
/trace off
```

`/trace` affiche les lignes de traçage et de débogage des plugins propres à la session sans activer le mode
entièrement détaillé. Cette commande ne remplace ni `/debug` (remplacements d’exécution) ni `/verbose` (sortie
normale des outils).

## `/btw` : questions annexes

`/btw` permet de poser rapidement une question annexe sur le contexte de la session actuelle. Alias : `/side`.

```text
/btw que faisons-nous actuellement ?
/side qu’est-ce qui a changé pendant la poursuite de l’exécution principale ?
```

Contrairement à un message normal :

- Utilise la session actuelle comme contexte d’arrière-plan.
- Dans les sessions du banc d’essai Codex, s’exécute comme un fil annexe Codex éphémère.
- Ne modifie **pas** le contexte futur de la session.
- N’est pas inscrit dans l’historique de la transcription.

Consultez [Questions annexes BTW](/fr/tools/btw) pour connaître le comportement complet.

## Notes sur les surfaces

<AccordionGroup>
  <Accordion title="Portée des sessions selon la surface">
    - **Commandes textuelles :** s’exécutent dans la session de conversation normale (les messages privés partagent `main`, les groupes disposent de leur propre session).
    - **Commandes natives Discord :** `agent:<agentId>:discord:slash:<userId>`
    - **Commandes natives Slack :** `agent:<agentId>:slack:slash:<userId>` (préfixe configurable avec `channels.slack.slashCommand.sessionPrefix`)
    - **Commandes natives Telegram :** `telegram:slash:<userId>` (ciblent la session de conversation au moyen de `CommandTargetSessionKey`)
    - **`/login codex`** envoie les codes d’association de l’appareil uniquement par conversation privée ou par les chemins de réponse de l’interface Web. Les appels depuis un groupe ou un sujet Telegram demandent plutôt au propriétaire d’envoyer un message privé au bot.
    - **`/stop`** cible la session de conversation active afin d’interrompre l’exécution actuelle.

  </Accordion>
  <Accordion title="Spécificités de Slack">
    `channels.slack.slashCommand` prend en charge une seule commande de type `/openclaw`.
    Avec `commands.native: true`, créez une commande slash Slack pour chaque commande
    intégrée. Enregistrez `/agentstatus` (et non `/status`), car Slack réserve
    `/status`. La commande textuelle `/status` continue de fonctionner dans les messages Slack.
  </Accordion>
  <Accordion title="Chemin rapide et raccourcis intégrés">
    - Les messages contenant uniquement une commande et provenant d’expéditeurs figurant sur la liste d’autorisation sont traités immédiatement (sans passer par la file d’attente ni par le modèle).
    - Les raccourcis intégrés (`/help`, `/commands`, `/status`, `/whoami`) fonctionnent également au sein des messages normaux et sont retirés avant que le modèle ne voie le texte restant.
    - Les messages non autorisés contenant uniquement une commande sont ignorés silencieusement ; les jetons `/...` intégrés sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Notes sur les arguments">
    - Les commandes acceptent un caractère `:` facultatif entre la commande et les arguments (`/think: high`, `/send: on`).
    - `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; en l’absence de correspondance, le texte est traité comme le corps du message.
    - `/allowlist add|remove` nécessite `commands.config: true` et respecte le paramètre de canal `configWrites`.

  </Accordion>
</AccordionGroup>

## Utilisation et état des fournisseurs

- **Utilisation/quota du fournisseur** (par exemple, « Claude : 80 % restants ») s’affiche dans `/status` pour le fournisseur du modèle actuel lorsque le suivi de l’utilisation est activé.
- **Les lignes relatives aux tokens/au cache** dans `/status` peuvent utiliser en dernier recours la dernière entrée d’utilisation de la transcription lorsque l’instantané de la session en direct contient peu d’informations.
- **Exécution ou environnement d’exécution :** `/status` indique `Execution` pour le chemin effectif du bac à sable et `Runtime` pour l’entité qui exécute la session : `OpenClaw Default`, `OpenAI Codex`, un moteur CLI ou un moteur ACP.
- **Tokens/coût par réponse :** contrôlés par `/usage off|tokens|full`.
- `/model status` concerne les modèles, l’authentification et les points de terminaison, et non l’utilisation.

## Pages connexes

<CardGroup cols={2}>
  <Card title="Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Fonctionnement de l’enregistrement et du contrôle d’accès des commandes slash des Skills.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Créez une Skill qui enregistre sa propre commande slash.
  </Card>
  <Card title="BTW" href="/fr/tools/btw" icon="comments">
    Posez des questions annexes sans modifier le contexte de la session.
  </Card>
  <Card title="Pilotage" href="/fr/tools/steer" icon="compass">
    Guidez l’agent pendant l’exécution avec `/steer`.
  </Card>
</CardGroup>
