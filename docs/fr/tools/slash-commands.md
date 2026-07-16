---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
    - Comprendre comment les commandes de Skills sont enregistrées
sidebarTitle: Slash commands
summary: Toutes les commandes slash, directives et raccourcis intégrés disponibles — configuration, routage et comportement propre à chaque interface.
title: Commandes slash
x-i18n:
    generated_at: "2026-07-16T13:53:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Le Gateway gère les commandes envoyées sous forme de messages autonomes commençant par `/`.
Les commandes bash réservées à l’hôte utilisent `! <cmd>` (avec `/bash <cmd>` comme alias).

Lorsqu’une conversation est liée à une session ACP, le texte normal est acheminé vers le
harnais ACP. Les commandes de gestion du Gateway restent locales : `/acp ...` atteint toujours
le gestionnaire de commandes OpenClaw, et `/status` ainsi que `/unfocus` restent locales chaque fois que
la gestion des commandes est activée pour l’interface.

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
    intégrées lorsqu’elles sont accompagnées d’un autre texte.
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
      sont conservées dans la session et une confirmation est renvoyée.
    - Dans les messages de **discussion normale** contenant un autre texte, elles servent d’indications intégrées et
      ne conservent **pas** les paramètres de session.
    - Les directives ne s’appliquent qu’aux **expéditeurs autorisés**. Si `commands.allowFrom`
      est défini, il constitue l’unique liste d’autorisation utilisée ; sinon, l’autorisation provient
      des listes d’autorisation/de l’association du canal ainsi que de `commands.useAccessGroups`. Pour les expéditeurs
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
  Active l’analyse de `/...` dans les messages de discussion. Sur les interfaces dépourvues de commandes natives
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), les commandes
  textuelles fonctionnent même lorsque cette option est définie sur `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Enregistre les commandes natives. Mode automatique : activé pour Discord/Telegram ; désactivé pour Slack ;
  ignoré pour les fournisseurs dépourvus de prise en charge native. Remplacez ce réglage pour chaque canal avec
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
  les listes d’autorisation `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durée pendant laquelle bash attend avant de passer en mode arrière-plan (`0` passe
  immédiatement en arrière-plan).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Active `/config` (lit/écrit `openclaw.json`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Active `/plugins` (découverte/état des plugins, installation et activation/désactivation). Écritures réservées au propriétaire.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Active `/debug` (remplacements de configuration limités à l’exécution). Réservé au propriétaire.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Active `/restart` et les demandes de redémarrage externes `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Liste d’autorisation explicite du propriétaire pour les interfaces de commandes réservées au propriétaire. Distincte de
  `commands.allowFrom` et de l’accès par association en message privé.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Par canal : exige l’identité du propriétaire pour les commandes réservées au propriétaire. Lorsque `true`,
  l’expéditeur doit correspondre à `commands.ownerAllowFrom` ou détenir la portée interne `operator.admin`.
  Une entrée générique `allowFrom` n’est **pas** suffisante.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Contrôle la manière dont les identifiants du propriétaire apparaissent dans l’invite système.
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
  Applique les listes d’autorisation/politiques aux commandes lorsque `commands.allowFrom` n’est pas défini.
</ParamField>

## Liste des commandes

Les commandes proviennent de trois sources :

- **Commandes intégrées au cœur :** `src/auto-reply/commands-registry.shared.ts`
- **Commandes de dock générées :** `src/auto-reply/commands-registry.data.ts`
- **Commandes de plugins :** appels `registerCommand()` du plugin

Leur disponibilité dépend des options de configuration, de l’interface du canal et des
plugins installés/activés.

### Commandes principales

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
    | `/session max-age <duration\|off>` | Gérer l’expiration selon l’âge maximal de la liaison au fil de discussion |
    | `/export-session [path]` | Réservé au propriétaire. Exporter la session actuelle au format HTML dans l’espace de travail. Alias : `/export` |
    | `/export-trajectory [path]` | Exporter un paquet de trajectoire JSONL pour la session actuelle. Alias : `/trajectory` |

    Les chemins `/export-session` explicites remplacent les fichiers existants dans
    l’espace de travail. Omettre le chemin pour générer un nom de fichier sans risque de collision.

    <Note>
      Control UI intercepte la saisie de `/new` pour créer une nouvelle
      session de tableau de bord et y basculer, sauf lorsque `session.dmScope: "main"` est configuré
      et que le parent actuel est la session principale de l’agent — dans ce cas, `/new`
      réinitialise la session principale sur place. La saisie de `/reset` exécute toujours la
      réinitialisation sur place du Gateway. Utilisez `/model default` pour effacer la sélection
      épinglée du modèle de session.
    </Note>

  </Accordion>

  <Accordion title="Contrôles du modèle et de l’exécution">
    | Commande | Description |
    | --- | --- |
    | `/think <level\|default>` | Définir le niveau de réflexion ou effacer le remplacement de session. Alias : `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Activer ou désactiver la sortie détaillée. Alias : `/v` |
    | `/trace on\|off` | Activer ou désactiver la sortie de traçage des plugins pour la session actuelle |
    | `/fast [status\|auto\|on\|off\|default]` | Afficher, définir ou désactiver le mode rapide |
    | `/reasoning [on\|off\|stream]` | Activer ou désactiver la visibilité du raisonnement. Alias : `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Activer ou désactiver le mode élevé. Alias : `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Afficher ou définir les valeurs par défaut d’exécution |
    | `/login [codex\|openai\|openai-codex]` | Associer la connexion Codex/OpenAI depuis une discussion privée ou une session de l’interface Web. Propriétaire/administrateur uniquement |
    | `/model [name\|#\|status]` | Afficher ou définir le modèle |
    | `/models [provider] [page] [limit=<n>\|all]` | Répertorier les fournisseurs ou modèles configurés/disponibles avec l’authentification actuelle |
    | `/queue <mode>` | Gérer le comportement de la file d’attente des exécutions actives. Voir [File d’attente](/fr/concepts/queue) et [Pilotage de la file d’attente](/fr/concepts/queue-steering) |
    | `/steer <message>` | Injecter des consignes dans l’exécution active. Alias : `/tell`. Voir [Pilotage](/fr/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sécurité des modes détaillé / traçage / rapide / raisonnement">
        - `/verbose` est destiné au débogage — laissez-le **désactivé** en utilisation normale.
        - `/trace` ne révèle que les lignes de traçage/débogage propres aux plugins ; les messages détaillés ordinaires restent désactivés.
        - `/fast auto|on|off` conserve un remplacement de session ; utilisez l’option `inherit` de l’interface Sessions pour l’effacer.
        - `/fast` dépend du fournisseur : OpenAI/Codex l’associent à `service_tier=priority` ; les requêtes Anthropic directes l’associent à `service_tier=auto` ou `standard_only`.
        - `/reasoning`, `/verbose` et `/trace` présentent des risques dans les groupes — ils peuvent révéler le raisonnement interne ou les diagnostics des plugins. Laissez-les désactivés dans les discussions de groupe.

      </Accordion>
      <Accordion title="Détails du changement de modèle">
        - `/model` conserve immédiatement le nouveau modèle dans la session.
        - Si l’agent est inactif, l’exécution suivante l’utilise immédiatement.
        - Si une exécution est active, le changement est marqué comme étant en attente et appliqué au prochain point de nouvelle tentative propre.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Découverte et état">
    | Commande | Description |
    | --- | --- |
    | `/help` | Afficher le résumé succinct de l’aide |
    | `/commands` | Afficher le catalogue de commandes généré |
    | `/tools [compact\|verbose]` | Afficher ce que l’agent actuel peut utiliser immédiatement |
    | `/status` | Afficher l’état de l’exécution/du runtime, la disponibilité du Gateway et du système, la santé des plugins, ainsi que l’utilisation/le quota du fournisseur |
    | `/status plugins` | Afficher l’état détaillé des plugins : erreurs de chargement, mises en quarantaine, échecs des plugins de canal, problèmes de dépendances, avis de compatibilité. Nécessite `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gérer l’[objectif](/fr/tools/goal) persistant de la session actuelle |
    | `/diagnostics [note]` | Flux de rapport d’assistance réservé au propriétaire. Demande à chaque fois l’approbation de l’exécution |
    | `/openclaw <request>` | Exécuter l’assistant de configuration et de réparation d’OpenClaw depuis un message privé du propriétaire |
    | `/tasks` | Répertorier les tâches d’arrière-plan actives/récentes de la session actuelle |
    | `/context [list\|detail\|map\|json]` | Expliquer comment le contexte est assemblé |
    | `/whoami` | Afficher votre identifiant d’expéditeur. Alias : `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Contrôler le pied de page d’utilisation par réponse (`reset`/`inherit`/`clear`/`default` efface le remplacement de session pour hériter à nouveau de la valeur par défaut configurée) ou afficher un récapitulatif local des coûts |
  </Accordion>

  <Accordion title="Skills, listes d’autorisation, approbations">
    | Commande | Description |
    | --- | --- |
    | `/skill <name> [input]` | Exécuter une compétence par son nom |
    | `/learn [request]` | Préparer une compétence révisable à partir de la conversation actuelle ou de sources nommées via [l’atelier de compétences](/fr/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gérer les entrées de la liste d’autorisation. Texte uniquement |
    | `/approve <id> <decision>` | Répondre aux demandes d’approbation d’exécution ou de Plugin |
    | `/btw <question>` | Poser une question secondaire sans modifier le contexte de la session. Alias : `/side`. Voir [BTW](/fr/tools/btw) |
  </Accordion>

  <Accordion title="Sous-agents et ACP">
    | Commande | Description |
    | --- | --- |
    | `/subagents list\|log\|info` | Examiner les exécutions des sous-agents pour la session actuelle |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gérer les sessions ACP et les options d’exécution. Les contrôles d’exécution nécessitent l’identité du propriétaire externe ou de l’administrateur interne du Gateway |
    | `/focus <target>` | Lier le fil Discord ou le sujet Telegram actuel à une cible de session |
    | `/unfocus` | Supprimer la liaison du fil actuel |
    | `/agents` | Répertorier les agents liés au fil pour la session actuelle |
  </Accordion>

  <Accordion title="Écritures et administration réservées au propriétaire">
    | Commande | Prérequis | Description |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Lire ou écrire `openclaw.json`. Réservé au propriétaire |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Lire ou écrire la configuration des serveurs MCP gérée par OpenClaw. Réservé au propriétaire |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Examiner ou modifier l’état des Plugins. Écritures réservées au propriétaire. Alias : `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Remplacements de configuration limités à l’exécution. Réservé au propriétaire |
    | `/restart` | `commands.restart: true` (par défaut) | Redémarrer OpenClaw |
    | `/send on\|off\|inherit` | propriétaire | Définir la stratégie d’envoi |
  </Accordion>

  <Accordion title="Voix, synthèse vocale et contrôle des canaux">
    | Commande | Description |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Contrôler la synthèse vocale. Voir [Synthèse vocale](/fr/tools/tts) |
    | `/activation mention\|always` | Définir le mode d’activation du groupe |
    | `/bash <command>` | Exécuter une commande shell sur l’hôte. Alias : `! <command>`. Nécessite `commands.bash: true` |
    | `!poll [sessionId]` | Vérifier une tâche bash en arrière-plan |
    | `!stop [sessionId]` | Arrêter une tâche bash en arrière-plan |
  </Accordion>
</AccordionGroup>

### Commandes d’ancrage

Les commandes d’ancrage font basculer la route de réponse de la session active vers un autre canal lié.
Consultez [Ancrage des canaux](/fr/concepts/channel-docking) pour la configuration et le dépannage.

Générées à partir des Plugins de canal prenant en charge les commandes natives :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

Les commandes d’ancrage nécessitent `session.identityLinks`. L’expéditeur source et le pair cible
doivent appartenir au même groupe d’identités.

### Commandes des Plugins intégrés

| Commande                                                 | Description                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Activer ou désactiver le Dreaming de la mémoire (propriétaire ou administrateur du Gateway). Voir [Dreaming](/fr/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gérer l’association des appareils. Voir [Association](/fr/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Autoriser temporairement les commandes Node à haut risque (caméra/écran/ordinateur/écritures). Voir [Utilisation de l’ordinateur](/fr/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gérer la configuration vocale de Talk. Nom natif Discord : `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Envoyer des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Lier, piloter et examiner le harnais du serveur d’application Codex (état, fils, reprise, modèle, mode rapide, autorisations, Compaction, révision, MCP, Skills, etc.). Voir [Harnais Codex](/fr/plugins/codex-harness) |

QQBot uniquement : `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Commandes de Skills

Les Skills invocables par l’utilisateur sont exposées comme commandes à barre oblique :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- Les Skills peuvent s’enregistrer comme commandes directes (par exemple `/prose` pour OpenProse).
- L’enregistrement natif des commandes de Skills est contrôlé par `commands.nativeSkills` et
  `channels.<provider>.commands.nativeSkills`.
- Les noms sont normalisés en `a-z0-9_` (32 caractères maximum) ; les collisions reçoivent des suffixes numériques.

<AccordionGroup>
  <Accordion title="Répartition des commandes de Skills">
    Par défaut, les commandes de Skills sont acheminées vers le modèle comme une requête normale.

    Les Skills peuvent déclarer `command-dispatch: tool` pour acheminer directement vers un outil
    (de manière déterministe, sans intervention du modèle). Exemple : `/prose` (Plugin OpenProse)
    — voir [OpenProse](/fr/prose).

  </Accordion>
  <Accordion title="Arguments des commandes natives">
    Discord utilise la saisie semi-automatique pour les options dynamiques et les menus de boutons lorsque des
    arguments obligatoires sont omis. Telegram et Slack affichent un menu de boutons pour les commandes comportant
    des choix. Les choix dynamiques sont déterminés en fonction du modèle de la session cible ; les options propres
    au modèle, telles que les niveaux `/think`, suivent donc le remplacement `/model` de la session.
  </Accordion>
</AccordionGroup>

## `/tools` : ce que l’agent peut utiliser maintenant

`/tools` répond à une question d’exécution : **ce que cet agent peut utiliser immédiatement dans cette
conversation** — et non un catalogue statique de configuration.

```text
/tools         # vue compacte
/tools verbose # avec de courtes descriptions
```

Les résultats sont limités à la session. Le changement d’agent, de canal, de fil, d’autorisation de l’expéditeur
ou de modèle peut modifier la sortie. Pour modifier le profil et les remplacements,
utilisez le panneau Tools de l’interface de contrôle ou les surfaces de configuration.

## `/model` : sélection du modèle

```text
/model             # afficher le sélecteur de modèle
/model list        # identique
/model 3           # sélectionner par numéro dans le sélecteur
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # effacer la sélection de modèle de la session
/model status      # vue détaillée avec le point de terminaison et le mode API
```

Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des listes déroulantes de fournisseurs et
de modèles. Le sélecteur respecte `agents.defaults.models`, y compris les
entrées `provider/*`.

## `/config` : écritures de la configuration sur disque

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

La configuration est validée avant l’écriture. Les modifications non valides sont rejetées. Les mises à jour `/config`
persistent après les redémarrages.

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
`/mcp show` masque les champs contenant des identifiants, les valeurs reconnues des options relatives aux identifiants
et les arguments présentant une forme connue de secret. Lorsqu’elle est exécutée depuis un groupe, la
configuration est envoyée en privé au propriétaire ; si aucune route privée vers le propriétaire n’est
disponible, la commande échoue de manière sécurisée et demande au propriétaire de réessayer depuis une
conversation directe.

## `/debug` : remplacements limités à l’exécution

<Note>
  Réservé au propriétaire. Désactivé par défaut — activez-le avec `commands.debug: true`.
  Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration, mais n’écrivent **pas** sur le disque.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` : gestion des Plugins

<Note>
  Écritures réservées au propriétaire. Désactivé par défaut — activez-le avec `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` met à jour la configuration des Plugins et recharge à chaud l’environnement d’exécution des
Plugins du Gateway pour les nouveaux tours des agents. `/plugins install` redémarre automatiquement les
Gateways gérés, car les modules sources des Plugins ont changé. Les installations ClawHub de confiance
et celles provenant du catalogue officiel ne nécessitent pas d’accusé de réception supplémentaire. Les sources npm,
git, d’archive, `npm-pack:` et de chemin local arbitraires affichent un avertissement de provenance et
nécessitent un `--force` final après examen de la source. Cette option confirme la prise en compte
de la source et autorise le remplacement d’une installation existante ; elle ne contourne ni
`security.installPolicy` ni les contrôles de sécurité du programme d’installation. Les versions ClawHub accompagnées
d’avertissements de risque nécessitent toujours l’option distincte, disponible uniquement dans le shell,
`--acknowledge-clawhub-risk`. Les installations issues de la place de marché, liées et épinglées
restent également limitées au shell.

## `/trace` : sortie de traçage des Plugins

```text
/trace          # afficher l’état actuel du traçage
/trace on
/trace off
```

`/trace` affiche les lignes de traçage et de débogage des Plugins limitées à la session sans activer le mode
entièrement détaillé. Il ne remplace ni `/debug` (remplacements d’exécution), ni `/verbose` (sortie
normale des outils).

## `/btw` : questions secondaires

`/btw` permet de poser rapidement une question secondaire sur le contexte de la session actuelle. Alias : `/side`.

```text
/btw que faisons-nous actuellement ?
/side qu’est-ce qui a changé pendant que l’exécution principale se poursuivait ?
```

Contrairement à un message normal :

- Utilise la session actuelle comme contexte d’arrière-plan.
- Dans les sessions du harnais Codex, s’exécute comme un fil secondaire Codex éphémère.
- Ne modifie **pas** le contexte futur de la session.
- N’est pas écrit dans l’historique de la transcription.

Consultez [Questions secondaires BTW](/fr/tools/btw) pour connaître le comportement complet.

## Remarques sur les surfaces

<AccordionGroup>
  <Accordion title="Portée des sessions selon la surface">
    - **Commandes textuelles :** s’exécutent dans la session de conversation normale (les messages privés partagent `main`, les groupes possèdent leur propre session).
    - **Commandes Discord natives :** `agent:<agentId>:discord:slash:<userId>`
    - **Commandes Slack natives :** `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
    - **Commandes Telegram natives :** `telegram:slash:<userId>` (ciblent la session de conversation via `CommandTargetSessionKey`)
    - **`/login codex`** envoie les codes d’association d’appareils uniquement par conversation privée ou via les chemins de réponse de l’interface Web. Les appels depuis un groupe ou un sujet Telegram demandent plutôt au propriétaire d’envoyer un message privé au bot.
    - **`/stop`** cible la session de conversation active afin d’interrompre l’exécution en cours.

  </Accordion>
  <Accordion title="Spécificités de Slack">
    `channels.slack.slashCommand` prend en charge une seule commande de type `/openclaw`.
    Avec `commands.native: true`, créez une commande slash Slack par commande
    intégrée. Enregistrez `/agentstatus` (et non `/status`), car Slack réserve
    `/status`. Le texte `/status` fonctionne toujours dans les messages Slack.
  </Accordion>
  <Accordion title="Chemin rapide et raccourcis intégrés">
    - Les messages contenant uniquement une commande et provenant d’expéditeurs figurant sur la liste d’autorisation sont traités immédiatement (sans passer par la file d’attente ni le modèle).
    - Les raccourcis intégrés (`/help`, `/commands`, `/status`, `/whoami`) fonctionnent également lorsqu’ils sont incorporés dans des messages normaux et sont retirés avant que le modèle ne voie le texte restant.
    - Les messages non autorisés contenant uniquement une commande sont ignorés silencieusement ; les jetons `/...` intégrés sont traités comme du texte brut.

  </Accordion>
  <Accordion title="Remarques sur les arguments">
    - Les commandes acceptent un `:` facultatif entre la commande et les arguments (`/think: high`, `/send: on`).
    - `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; en l’absence de correspondance, le texte est traité comme le corps du message.
    - `/allowlist add|remove` nécessite `commands.config: true` et respecte la valeur `configWrites` du canal.

  </Accordion>
</AccordionGroup>

## Utilisation et état du fournisseur

- **Utilisation/quota du fournisseur** (par exemple, « Claude : 80 % restants ») s’affiche dans `/status` pour le fournisseur du modèle actuel lorsque le suivi de l’utilisation est activé.
- **Les lignes de jetons/cache** dans `/status` peuvent utiliser en dernier recours la dernière entrée d’utilisation de la transcription lorsque l’instantané de la session en direct contient peu d’informations.
- **Exécution et environnement d’exécution :** `/status` indique `Execution` pour le chemin effectif du bac à sable et `Runtime` pour l’entité qui exécute la session : `OpenClaw Default`, `OpenAI Codex`, un moteur CLI ou un moteur ACP.
- **Jetons/coût par réponse :** contrôlés par `/usage off|tokens|full`.
- `/model status` concerne les modèles, l’authentification et les points de terminaison, et non l’utilisation.

## Pages connexes

<CardGroup cols={2}>
  <Card title="Skills" href="/fr/tools/skills" icon="puzzle-piece">
    Mode d’enregistrement et de contrôle des commandes slash de Skills.
  </Card>
  <Card title="Création de Skills" href="/fr/tools/creating-skills" icon="hammer">
    Créez une Skill qui enregistre sa propre commande slash.
  </Card>
  <Card title="BTW" href="/fr/tools/btw" icon="comments">
    Posez des questions annexes sans modifier le contexte de la session.
  </Card>
  <Card title="Pilotage" href="/fr/tools/steer" icon="compass">
    Guidez l’agent en cours d’exécution avec `/steer`.
  </Card>
</CardGroup>
