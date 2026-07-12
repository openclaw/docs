---
read_when:
    - Vous avez terminé la configuration de l’inférence et souhaitez que Crestodian configure le reste
    - Vous devez inspecter ou réparer OpenClaw à l’aide de l’agent de configuration local
    - Vous concevez ou activez le mode de secours du canal de messagerie
summary: Référence de la CLI et modèle de sécurité de l’assistant de configuration et de réparation de Crestodian reposant sur l’inférence
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T15:13:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian conversationnel est l’agent local de configuration initiale, de réparation et de configuration d’OpenClaw. Il ne démarre qu’après que le modèle par défaut effectif a terminé une véritable interaction. Les nouvelles installations établissent d’abord l’inférence ; une configuration mal formée reste traitée par le parcours doctor classique.

## Quand il démarre

L’exécution de `openclaw` sans sous-commande choisit le parcours selon l’état de la configuration :

- Configuration absente, ou existante sans paramètres définis (vide, ou contenant uniquement les clés `$schema`/`meta`) : démarre l’intégration guidée avec vérification en direct par l’IA.
- La configuration existe mais échoue à la validation : démarre l’intégration classique, qui signale les problèmes et vous renvoie vers `openclaw doctor`.
- La configuration existe et est valide : ouvre la TUI normale de l’agent. Un Gateway configuré et accessible, dont l’agent par défaut dispose d’un modèle, accède directement à cette interface sans intégration ni Crestodian. Utilisez `/crestodian` dans la TUI, ou exécutez directement `openclaw crestodian`, pour accéder ultérieurement à Crestodian.

L’exécution de `openclaw crestodian` teste d’abord en direct le modèle par défaut configuré. Une interaction réussie démarre Crestodian. En mode interactif, un échec ouvre la configuration guidée de l’inférence et passe le relais à Crestodian après la réussite d’un modèle candidat. Les requêtes ponctuelles, JSON et autres requêtes non interactives échouent avec des instructions demandant d’exécuter `openclaw onboard` lorsque l’inférence n’est pas disponible. `openclaw --help` et `openclaw --version` conservent leurs parcours rapides habituels.

En mode non interactif, `openclaw` sans sous-commande (sans TTY) se ferme avec un court message au lieu d’afficher l’aide racine : il renvoie vers l’intégration non interactive pour une installation nouvelle ou non valide, ou vers `openclaw agent --local ...` lorsque la configuration est valide.

`openclaw onboard --modern` reste un alias de compatibilité pour Crestodian, mais utilise la même condition d’accès liée à l’inférence : une inférence fonctionnelle ouvre la conversation, les échecs interactifs démarrent la configuration guidée de l’inférence et les échecs non interactifs provoquent la fermeture avec des instructions d’intégration. `openclaw onboard --classic` ouvre l’assistant complet étape par étape.

## Ce qu’affiche Crestodian

Crestodian interactif ouvre la même interface TUI que `openclaw tui`, avec un moteur de conversation Crestodian. Le message d’accueil au démarrage couvre :

- la validité de la configuration et l’agent par défaut
- le modèle vérifié utilisé par Crestodian
- l’accessibilité du Gateway lors de la première sonde de démarrage
- la prochaine action de débogage recommandée

Il n’affiche pas les secrets et ne charge pas les commandes CLI des plugins uniquement pour démarrer.

Utilisez `status` pour obtenir l’inventaire détaillé : chemin de la configuration, chemins de la documentation et des sources, sondes de la CLI locale, présence des clés et jetons, agents, modèle et détails du Gateway.

Crestodian utilise la même détection des références que les agents ordinaires : dans un dépôt Git, il renvoie vers le répertoire `docs/` local et l’arborescence des sources ; dans une installation npm, il utilise la documentation incluse et fournit un lien vers [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), avec la recommandation de consulter les sources lorsque la documentation ne suffit pas.

## Exemples

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "modèles"
openclaw crestodian --message "valider la configuration"
openclaw crestodian --message "configurer l’espace de travail ~/Projects/work" --yes
openclaw crestodian --message "définir le modèle par défaut sur openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dans la TUI de Crestodian :

```text
état
santé
doctor
valider la configuration
configuration
configurer l’espace de travail ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
état du Gateway
redémarrer le Gateway
agents
créer l’agent work avec l’espace de travail ~/Projects/work
modèles
configurer le fournisseur de modèles
définir le modèle par défaut sur openai/gpt-5.6
canaux
informations sur le canal slack
connecter slack
ouvrir l’assistant de canal pour slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
parler à l’agent work
parler à l’agent pour ~/Projects/work
audit
quitter
```

## Opérations et approbation

Crestodian utilise des opérations typées au lieu de modifier la configuration de manière ponctuelle.

Les opérations en lecture seule s’exécutent immédiatement : afficher la vue d’ensemble, répertorier les agents, répertorier les plugins installés, rechercher des plugins ClawHub, afficher l’état du modèle et du moteur, exécuter les vérifications d’état et de santé, vérifier l’accessibilité du Gateway, exécuter doctor sans corrections interactives, valider la configuration et afficher le chemin du journal d’audit.

Le démarrage de la configuration guidée d’un canal (`connect telegram`) s’exécute également immédiatement. Son assistant recueille des réponses explicites et gère les écritures qui en résultent.

Les opérations persistantes nécessitent une approbation conversationnelle (ou `--yes` pour une commande directe) : écrire la configuration, `config set`, `config set-ref`, initialiser la configuration ou l’intégration, modifier le modèle par défaut, démarrer/arrêter/redémarrer le Gateway, créer des agents et installer des plugins.

Les réparations doctor ne sont pas disponibles dans Crestodian, car elles peuvent réécrire le fournisseur, l’authentification ou le parcours d’inférence de l’agent par défaut qui alimente la session. Quittez Crestodian et exécutez `openclaw doctor --fix` dans un terminal. La commande `doctor` en lecture seule reste disponible dans Crestodian.

Les nouveaux agents héritent de la route d’inférence par défaut vérifiée en conditions réelles. L’identifiant d’agent `crestodian` est réservé au gardien virtuel privilégié et ne peut pas être créé comme un agent normal.

`config set` et `config set-ref` ne peuvent pas modifier l’état de la route d’inférence,
notamment les identifiants d’accès au fournisseur d’inférence, les paramètres `auth.*` de premier niveau, les catalogues de modèles,
les backends CLI, les routes de modèles par défaut ou par agent, les paramètres et outils des agents, ni les paramètres
`tools.*` racine. Les écritures brutes sous `env.*`, `secrets.*`, `plugins.*` et `$include`
sont également refusées, car elles peuvent remplacer la résolution des identifiants d’accès ou l’activation du fournisseur.
L’authentification du Gateway et des canaux reste une surface de configuration normale. Utilisez les workflows typés des plugins et des canaux ainsi que
`set default model <provider/model>` pour une route déjà
configurée ; la route est testée en conditions réelles avant son enregistrement. Pour configurer ou
réparer l’accès au fournisseur ou à l’authentification, quittez Crestodian et exécutez `openclaw onboard`.

La désinstallation d’un Plugin est refusée dans Crestodian, car la suppression d’un
Plugin de fournisseur pourrait désactiver la route d’inférence qui alimente la session. Quittez Crestodian
et exécutez `openclaw plugins uninstall <id>` depuis un terminal.

L’approbation est donnée avec vos propres mots : les réponses sans ambiguïté (« oui », « bien sûr », « allez-y », « pas maintenant ») sont résolues à partir d’une liste fermée et déterministe. Lorsque la route configurée prend en charge un appel de complétion distinct, les autres réponses peuvent être classées uniquement à partir de votre message et de la proposition en attente — jamais par le modèle conversationnel lui-même, qui ne peut pas s’auto-approuver. Les réponses non classées ou ambiguës laissent la proposition en attente et la conversation repose la question.

Les écritures appliquées sont consignées dans `~/.openclaw/audit/crestodian.jsonl`. La découverte n’est pas auditée ; seules les opérations et écritures appliquées le sont.

La configuration d’un canal peut s’effectuer sous forme de conversation hébergée jusqu’à ce qu’elle nécessite un secret. La
TUI locale de Crestodian n’accepte pas les réponses sensibles de l’assistant de configuration, car les saisies
du chat dans le terminal sont visibles. Elle propose immédiatement `open channel wizard`, en transmettant
le canal sélectionné à l’assistant de configuration masqué du terminal ; vous pouvez également exécuter
`openclaw channels add --channel <channel>` ultérieurement.

### Passage à la configuration masquée d’un canal

Le chat local peut transférer le contrôle à l’assistant masqué de configuration du canal :

```text
ouvrir l’assistant de canal pour slack
informations sur le canal slack
```

`open channel wizard for <channel>` ouvre la configuration masquée du canal après la fermeture de la
TUI de chat. Utilisez d’abord `channel info <channel>` pour obtenir le libellé du canal, son état de configuration,
un résumé des prérequis et le lien vers la documentation.

Crestodian ne modifie jamais l’accès au fournisseur ou à l’authentification depuis sa propre session : celle-ci
dépend déjà de cette route d’inférence. Pour configurer ou
réparer un fournisseur de modèles, `configure model provider` renvoie des instructions de sortie et d’intégration sans
lancer d’assistant ni écrire de configuration. Quittez Crestodian et exécutez `openclaw
onboard` ; l’intégration prépare les identifiants d’accès et n’enregistre qu’une route qui
effectue réellement un tour complet en conditions réelles. Redémarrez Crestodian après la réussite de l’intégration.

## Initialisation de la configuration

`setup` configure le reste de l’espace de travail et l’état du Gateway après que l’intégration guidée a déjà établi l’inférence. Il écrit uniquement au moyen d’opérations de configuration typées et demande d’abord votre approbation.

```text
setup
setup workspace ~/Projects/work
```

`setup` préserve le modèle effectif vérifié. Il ne configure ni ne
remplace l’inférence.

Si l’inférence est absente ou si sa vérification en conditions réelles échoue, quittez Crestodian et exécutez `openclaw onboard`. L’intégration guidée détecte les modèles configurés, les clés d’API et les CLI locales authentifiées, demande une réponse réelle à chaque candidat et ne conserve qu’une route validée. Crestodian démarre immédiatement après cette étape et peut alors configurer l’espace de travail, le Gateway, les canaux, les agents, les plugins et les autres fonctionnalités facultatives.

L’application macOS ignore entièrement cette séquence lorsqu’elle atteint un Gateway configuré
dont l’agent par défaut dispose déjà d’un modèle configuré ; elle ouvre l’interface utilisateur normale de l’agent.
Pour un Gateway nouveau ou incomplet, l’application exécute la séquence d’inférence au moyen
des méthodes Gateway `crestodian.setup.detect` et `crestodian.setup.activate` :
la détection répertorie chaque backend candidat trouvé, l’activation teste en conditions réelles un
candidat (une véritable complétion « répondre par OK ») et ne conserve le modèle,
l’identifiant d’accès et l’état du fournisseur ou du runtime nécessaires à cette route qu’après la réussite du test. Les valeurs par défaut de l’espace de travail et du Gateway restent sous la responsabilité de Crestodian. Un candidat défaillant
ne modifie jamais la configuration ; l’application parcourt automatiquement la séquence et propose finalement
une étape manuelle de saisie de clé ou de jeton, alimentée à partir des plugins de fournisseurs
d’inférence de texte actifs du Gateway. Le fournisseur sélectionné possède son modèle
initial et sa configuration, et l’identifiant d’accès est vérifié de la même manière avant son enregistrement.

La supervision Codex et les autres fonctionnalités facultatives des plugins restent en dehors de cette
transaction d’activation de l’inférence. Configurez-les uniquement après le bon fonctionnement de l’inférence et
le démarrage de Crestodian ; les règles existantes des plugins et les désactivations explicites de la
supervision restent inchangées pendant la configuration de l’inférence.

## Conversation avec l’IA

La conversation libre de Crestodian interactif passe par la même boucle d’agent que les agents OpenClaw ordinaires, restreinte à un unique outil d’autorité OpenClaw de niveau zéro, `crestodian`, qui encapsule les opérations typées. Les actions de lecture s’exécutent librement, les mutations nécessitent votre approbation conversationnelle pour cette opération exacte (voir Opérations et approbation), et chaque écriture appliquée est auditée et revalidée. La session de l’agent persiste, de sorte que Crestodian dispose d’une véritable mémoire sur plusieurs tours. Si la route d’inférence vérifiée cesse ensuite de fonctionner, revenez à `openclaw onboard` et réparez-la avant de continuer.

L’hôte n’analyse pas les demandes en langage naturel pour les convertir en opérations. Les messages libres
— notamment les textes ressemblant à des commandes et les questions telles que « pourquoi mon
Gateway s’est-il arrêté ? » — sont transmis à l’IA, qui peut associer la demande à une opération typée
au moyen de l’outil `crestodian`.

Lorsqu’une mutation est en attente, seules les formulations d’approbation ou de refus sans ambiguïté issues d’une
liste fermée sont résolues sans inférence. Un consentement ambigu est transmis à un
appel de complétion configuré distinct et, dans le cas contraire, échoue de manière fermée. Les champs structurés
de l’assistant et la navigation exacte de l’hôte sont des contrôles d’interface utilisateur, et non une analyse en langage naturel
des opérations. Une exception liée à l’hygiène des secrets est particulièrement importante : une
commande `config set` exacte sur un chemin sensible (jetons, clés, mots de passe) n’atteint jamais
un modèle. L’hôte crée une proposition expurgée et la valeur est masquée dans l’historique
visible par l’IA. Préférez `config set-ref <path> env <ENV_VAR>` pour les secrets.

Le mode de secours des canaux de messages n’utilise jamais le planificateur assisté par le modèle. Le secours à distance reste déterministe afin qu’un chemin d’agent normal défaillant ou compromis ne puisse pas servir d’éditeur de configuration.

### Modèle de confiance du banc d’essai CLI

Les runtimes intégrés et le banc d’essai du serveur d’application Codex appliquent directement la restriction de niveau zéro :
l’exécution utilise une liste d’autorisation d’outils OpenClaw contenant uniquement
l’outil `crestodian`. Pour Codex, OpenClaw désactive également pour cette exécution les environnements, l’exécution
native, le mode multi-agent, les objectifs, les applications et plugins, les surfaces Skills/MCP, la recherche web et
`request_user_input`. Codex injecte toujours son utilitaire natif inerte `update_plan` ;
il peut mettre à jour la liste de contrôle temporaire du modèle, mais ne peut pas écrire de fichiers
ni modifier la configuration OpenClaw. Les bancs d’essai CLI n’utilisent pas la liste d’autorisation d’OpenClaw ;
Crestodian n’accepte donc que les backends dont le propre contrat de sélection des outils peut garantir
la même restriction :

- Les backends sélectionnables, notamment Claude Code, démarrent avec une sélection
  d’outils natifs vide et un outil MCP, `crestodian`. La configuration MCP générée
  par Claude est appliquée avec `--strict-mcp-config`, afin qu’aucun autre serveur MCP ne soit chargé.
- Les backends qui ne déclarent aucun outil natif reçoivent le même serveur MCP
  Crestodian dédié.
- Les backends avec outils natifs toujours actifs ou inconnus échouent de manière fermée avant l’inférence ; ils
  ne peuvent pas héberger de session Crestodian.

Seules les sessions Crestodian disposent du serveur MCP crestodian ; les exécutions normales de l’agent
ne voient jamais cet outil. Les backends CLI sélectionnables/sans outils natifs et les modèles
à clé API imposent donc la boucle littérale à outil unique. Les modèles de serveur d’application Codex imposent
un seul outil d’autorité OpenClaw, plus l’utilitaire natif inerte de planification. Dans les
trois cas, les écritures de configuration restent limitées au contrat d’approbation audité
de Crestodian.

Gemini CLI reste disponible pour les agents normaux, mais ne peut pas imposer la
sonde sans outil requise par la barrière d’inférence ; il ne peut donc pas héberger Crestodian.

## Passer à un agent

Utilisez un sélecteur en langage naturel pour quitter Crestodian et ouvrir la TUI normale :

```text
parler à l’agent
parler à l’agent de travail
passer à l’agent principal
```

`openclaw tui`, `openclaw chat` et `openclaw terminal` ouvrent directement la TUI normale de l’agent ; ils ne démarrent pas Crestodian. Après être passé dans la TUI normale, `/crestodian` permet de revenir à Crestodian, avec éventuellement une demande complémentaire :

```text
/crestodian
/crestodian redémarrer gateway
```

## Mode de secours des messages

Le mode de secours des messages est le point d’entrée de Crestodian par canal de messagerie : utilisez-le lorsque votre agent normal est hors service, mais qu’un canal de confiance (par exemple WhatsApp) reçoit toujours les commandes.

Il s’agit d’un gestionnaire déterministe de commandes d’urgence, et non de l’agent
conversationnel Crestodian. Il n’amorce pas une nouvelle configuration et n’assouplit pas la barrière
d’inférence pour la conversation Crestodian.

Commande prise en charge : `/crestodian <request>`. Le secours accepte uniquement la grammaire exacte de la commande saisie — le langage naturel est rejeté avec une indication, sans jamais être interprété comme une opération, et aucun modèle n’est jamais consulté.

```text
Vous, dans un message privé de propriétaire de confiance : /crestodian status
OpenClaw : Mode de secours Crestodian. Gateway accessible : non. Configuration valide : non.
Vous : /crestodian restart gateway
OpenClaw : Plan : redémarrer le Gateway. Répondez /crestodian yes pour appliquer.
Vous : /crestodian yes
OpenClaw : Appliqué. Entrée d’audit enregistrée.
```

La création d’un agent peut également être mise en file d’attente localement ou par le secours :

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

La création d’un agent ne peut nommer que le modèle par défaut actuellement vérifié en direct. Omettez le
modèle pour hériter de cette route.

Le secours à distance est une surface d’administration et doit être traité comme une réparation de configuration à distance, et non comme une conversation normale.

Contrat de sécurité du secours à distance :

- Désactivé lorsque le bac à sable est actif pour l’agent/la session ; Crestodian refuse le secours à distance et renvoie vers la réparation locale avec la CLI.
- L’état effectif par défaut est `auto` : autoriser le secours à distance uniquement dans un fonctionnement YOLO de confiance, où l’environnement d’exécution dispose déjà d’une autorité locale sans bac à sable (`tools.exec.security` se résout en `full` et `tools.exec.ask` se résout en `off`, avec le mode de bac à sable `off`).
- Nécessite une identité de propriétaire explicite ; aucune règle d’expéditeur générique, politique de groupe ouverte, aucun webhook non authentifié ni canal anonyme.
- Messages privés du propriétaire uniquement par défaut ; le secours dans un groupe/canal nécessite une activation explicite.
- La recherche et la liste des Plugins sont en lecture seule. L’installation d’un Plugin est toujours locale uniquement (bloquée en mode secours, même lorsqu’elle est par ailleurs activée), car elle télécharge du code exécutable. La désinstallation d’un Plugin est refusée dans Crestodian local comme en mode secours ; exécutez `openclaw plugins uninstall <id>` depuis un terminal.
- Le secours à distance ne peut pas ouvrir la TUI locale ni passer à une session interactive d’agent ; utilisez localement `openclaw` pour transférer vers un agent.
- Les écritures persistantes nécessitent toujours une approbation, même en mode secours.
- Chaque opération de secours appliquée est auditée. Le secours par canal de messagerie enregistre les métadonnées de canal, de compte, d’expéditeur et d’adresse source ; les opérations modifiant la configuration enregistrent également les hachages de configuration avant et après.
- Les secrets ne sont jamais affichés. L’inspection de SecretRef indique leur disponibilité, pas leurs valeurs.
- Si le Gateway est actif, le secours privilégie les opérations typées du Gateway ; s’il est hors service, le secours utilise uniquement la surface minimale de réparation locale qui ne dépend pas de la boucle normale de l’agent.

Structure de configuration :

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled` : `"auto"` (valeur par défaut) autorise le secours uniquement lorsque l’environnement d’exécution effectif est YOLO et que le bac à sable est désactivé ; `false` n’autorise jamais le secours par canal de messagerie ; `true` autorise explicitement le secours lorsque les vérifications du propriétaire et du canal réussissent (toujours sous réserve du refus lié au bac à sable).
- `ownerDmOnly` : limite le secours aux messages directs du propriétaire. Valeur par défaut : `true`.
- `pendingTtlMinutes` : durée pendant laquelle une écriture de secours en attente reste ouverte pour approbation avec `/crestodian yes` avant d’expirer. Valeur par défaut : `15`.

Le secours à distance est couvert par le parcours Docker :

```bash
pnpm test:docker:crestodian-rescue
```

Un test rapide facultatif de la surface de commandes d’un canal actif vérifie `/crestodian status`, ainsi qu’un aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuration ponctuelle empaquetée, protégée par la barrière d’inférence, est couverte par :

```bash
pnpm test:docker:crestodian-first-run
```

Ce parcours de CLI empaquetée démarre avec un répertoire d’état vide et démontre que Crestodian
échoue de manière fermée sans inférence. Il teste et active ensuite un faux Claude par
l’intermédiaire du module d’activation empaqueté. Ce n’est qu’après cela qu’une demande approximative atteint le
planificateur et est résolue en configuration typée, suivie de commandes ponctuelles qui créent un
agent supplémentaire, configurent Discord grâce à l’activation d’un Plugin et à un jeton
SecretRef, valident la configuration et vérifient le journal d’audit. Ce parcours fournit des
preuves complémentaires concernant la barrière et les opérations ; il n’exerce ni l’intégration interactive ni la
conversation Crestodian avec l’agent, les outils et les approbations. Le scénario QA Lab ci-dessous redirige
vers le même parcours Docker :

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Bac à sable](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
