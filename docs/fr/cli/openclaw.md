---
read_when:
    - Vous avez terminé la configuration de l’inférence et souhaitez qu’OpenClaw configure le reste
    - Vous devez inspecter ou réparer OpenClaw avec l’agent de configuration local
    - Vous concevez ou activez le mode de secours des canaux de messagerie
summary: Référence de la CLI et modèle de sécurité de l’assistant de configuration et de réparation d’OpenClaw basé sur l’inférence
title: Agent de configuration OpenClaw
x-i18n:
    generated_at: "2026-07-16T13:09:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw est fourni avec un agent système intégré — il s'exprime sous le nom « OpenClaw » — pour
la configuration locale, la réparation et la configuration avancée (anciennement appelé Crestodian). Il ne démarre qu'après que le modèle par défaut effectif a terminé un véritable tour.
Les nouvelles installations établissent d'abord l'inférence ; une configuration mal formée reste sur le
parcours classique de doctor.

## Quand il démarre

L'exécution de `openclaw` sans sous-commande est aiguillée en fonction de l'état de la configuration :

- Configuration absente, ou présente sans paramètres définis (vide, ou contenant uniquement les clés `$schema`/`meta`) : démarre l'intégration guidée avec vérification en direct par l'IA.
- La configuration existe mais échoue à la validation : démarre l'intégration classique, qui signale les problèmes et vous dirige vers `openclaw doctor`.
- La configuration existe et est valide : ouvre la TUI normale de l'agent. Un Gateway configuré et accessible dont l'agent par défaut possède un modèle accède directement à cette interface
  sans intégration ni OpenClaw. Utilisez `/openclaw` dans la TUI, ou exécutez
  directement `openclaw setup`, pour accéder ultérieurement à OpenClaw.

L'exécution de `openclaw setup` teste d'abord en direct le modèle par défaut configuré. Un tour réussi démarre OpenClaw. Un échec interactif ouvre la configuration guidée de l'inférence et passe le relais à OpenClaw après la réussite d'un candidat. Les requêtes ponctuelles, JSON et autres requêtes non interactives échouent en indiquant d'exécuter `openclaw onboard` lorsque l'inférence est indisponible. `openclaw --help` et `openclaw --version` conservent leurs parcours rapides habituels.

L'exécution non interactive de `openclaw` sans argument (sans TTY) se termine avec un court message au lieu d'afficher l'aide racine : il renvoie vers l'intégration non interactive pour une installation nouvelle ou non valide, ou vers `openclaw agent --local ...` lorsque la configuration est valide.

`openclaw onboard --modern` reste un alias de compatibilité pour OpenClaw, mais utilise la même barrière d'inférence : une inférence fonctionnelle ouvre la discussion, les échecs interactifs démarrent la configuration guidée de l'inférence et les échecs non interactifs se terminent avec des instructions d'intégration. `openclaw onboard --classic` ouvre l'assistant complet étape par étape.

## Ce qu'affiche OpenClaw

OpenClaw en mode interactif ouvre la même interface TUI que `openclaw tui`, avec un backend de discussion OpenClaw. Le message d'accueil au démarrage couvre :

- la validité de la configuration et l'agent par défaut
- le modèle vérifié qu'utilise OpenClaw
- l'accessibilité du Gateway d'après la première sonde de démarrage
- la prochaine action de débogage recommandée

Il n'affiche pas les secrets et ne charge pas les commandes CLI des plugins uniquement pour démarrer.

Utilisez `status` pour obtenir l'inventaire détaillé : chemin de configuration, chemins de la documentation et des sources, sondes CLI locales, présence des clés et jetons, agents, modèle et détails du Gateway.

OpenClaw utilise la même découverte des références que les agents ordinaires : dans un checkout Git, il renvoie vers le fichier local `docs/` et l'arborescence des sources ; dans une installation npm, il utilise la documentation incluse et fournit un lien vers [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), en recommandant de consulter les sources lorsque la documentation ne suffit pas.

## Exemples

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dans la TUI OpenClaw :

```text
statut
santé
doctor
valider la configuration
configurer
configurer l'espace de travail ~/Projects/work
configurer le port gateway.port sur 19001
configurer la référence gateway.auth.token sur la variable d'environnement OPENCLAW_GATEWAY_TOKEN
statut du Gateway
redémarrer le Gateway
agents
créer l'agent work avec l'espace de travail ~/Projects/work
modèles
configurer le fournisseur du modèle
définir le modèle par défaut sur openai/gpt-5.6
canaux
informations sur le canal slack
connecter slack
ouvrir l'assistant de canal pour slack
répertorier les plugins
rechercher le plugin slack
installer le plugin clawhub:openclaw-codex-app-server
parler à l'agent work
parler à l'agent associé à ~/Projects/work
audit
quitter
```

## Opérations et approbation

OpenClaw utilise des opérations typées au lieu de modifier la configuration de manière ponctuelle.

Les opérations en lecture seule s'exécutent immédiatement : afficher la vue d'ensemble, répertorier les agents, répertorier les plugins installés, rechercher des plugins ClawHub, afficher l'état du modèle/backend, exécuter les vérifications de statut et de santé, vérifier l'accessibilité du Gateway, exécuter doctor sans corrections interactives, valider la configuration et afficher le chemin du journal d'audit.

Le démarrage de la configuration guidée d'un canal (`connect telegram`) s'exécute également immédiatement. Son assistant recueille des réponses explicites et prend en charge les écritures qui en résultent.

Les opérations persistantes nécessitent une approbation conversationnelle (ou `--yes` pour une commande directe) : écrire la configuration, `config set`, `config set-ref`, amorcer la configuration/l'intégration, modifier le modèle par défaut, démarrer/arrêter/redémarrer le Gateway, créer des agents et installer des plugins.

Les réparations de doctor ne sont pas disponibles dans OpenClaw, car elles peuvent réécrire le fournisseur, l'authentification ou la route d'inférence de l'agent par défaut qui alimente la session. Quittez OpenClaw et exécutez `openclaw doctor --fix` dans un terminal. La commande en lecture seule `doctor` reste disponible dans OpenClaw.

Les nouveaux agents héritent de la route d'inférence par défaut vérifiée en direct. Les identifiants d'agent `openclaw` et `crestodian` sont réservés à l'agent système et ne peuvent pas être créés comme agents ordinaires. L'identifiant retiré reste bloqué afin qu'une ancienne configuration ne puisse pas se l'approprier.

`config set` et `config set-ref` ne peuvent pas modifier l'état de la route d'inférence,
notamment les identifiants du fournisseur d'inférence, le niveau supérieur `auth.*`, les catalogues de modèles,
les backends CLI, les routes de modèle par défaut ou propres à chaque agent, les paramètres/outils des agents ou la racine
`tools.*`. Les écritures brutes sous `env.*`, `secrets.*`, `plugins.*` et `$include`
sont également refusées, car elles peuvent remplacer la résolution des identifiants ou l'activation
du fournisseur. L'authentification du Gateway et des canaux reste une surface de configuration normale. Utilisez les workflows typés des plugins/canaux et
`set default model <provider/model>` pour une route déjà
configurée ; la route est testée en direct avant son enregistrement. Pour configurer ou
réparer l'accès au fournisseur ou à l'authentification, quittez OpenClaw et exécutez `openclaw onboard`.

La désinstallation d'un plugin est refusée dans OpenClaw, car la suppression d'un plugin
de fournisseur pourrait désactiver la route d'inférence qui alimente la session. Quittez OpenClaw
et exécutez `openclaw plugins uninstall <id>` depuis un terminal.

L'approbation est formulée avec vos propres mots : les réponses sans ambiguïté (« oui », « bien sûr », « allez-y », « pas maintenant ») sont résolues à partir d'une liste déterministe fermée. Lorsque la route configurée prend en charge un appel de complétion distinct, les autres réponses peuvent être classées uniquement à partir de votre message et de la proposition en attente — jamais par le modèle conversationnel lui-même, qui ne peut pas s'auto-approuver. Les réponses non classées ou ambiguës laissent la proposition en attente et la conversation repose la question.

Les écritures appliquées sont enregistrées dans `~/.openclaw/audit/system-agent.jsonl`. La découverte n'est pas auditée ; seules les opérations et écritures appliquées le sont.

La configuration d'un canal peut se dérouler comme une conversation hébergée jusqu'à ce qu'elle atteigne un secret. La
TUI OpenClaw locale n'accepte pas les réponses sensibles de l'assistant, car la saisie dans la
discussion du terminal est visible. Elle propose immédiatement `open channel wizard`, en transmettant
le canal sélectionné à l'assistant de terminal masqué ; vous pouvez également exécuter
`openclaw channels add --channel <channel>` ultérieurement.

### Passage à la configuration masquée d'un canal

La discussion locale peut transmettre le contrôle à l'assistant de canal masqué :

```text
ouvrir l'assistant de canal pour slack
informations sur le canal slack
```

`open channel wizard for <channel>` ouvre la configuration masquée du canal après la fermeture de la
TUI de discussion. Utilisez d'abord `channel info <channel>` pour obtenir le libellé du canal, l'état de la configuration,
le résumé des prérequis et le lien vers la documentation.

OpenClaw ne modifie jamais l'accès au fournisseur ou à l'authentification depuis sa propre session : la
session dépend déjà de cette route d'inférence. Pour configurer ou
réparer un fournisseur de modèles, `configure model provider` renvoie des instructions de sortie/intégration sans
démarrer d'assistant ni écrire la configuration. Quittez OpenClaw et exécutez `openclaw
onboard` ; l'intégration prépare les identifiants et enregistre uniquement une route qui
termine un véritable tour en direct. Redémarrez OpenClaw après la réussite de l'intégration.

## Amorçage de la configuration

`setup` configure l'espace de travail restant et l'état du Gateway après que l'intégration guidée a déjà établi l'inférence. Il écrit uniquement par l'intermédiaire d'opérations de configuration typées et demande d'abord une approbation.

```text
configurer
configurer l'espace de travail ~/Projects/work
```

`setup` conserve le modèle effectif vérifié. Il ne configure ni ne
remplace l'inférence.

Si l'inférence est absente ou si sa vérification en direct échoue, quittez OpenClaw et exécutez `openclaw onboard`. L'intégration guidée détecte les modèles configurés, les clés d'API et les CLI locales authentifiées, demande une véritable réponse à chaque candidat et ne conserve qu'une route fonctionnelle. OpenClaw démarre immédiatement après cette étape et peut ensuite configurer l'espace de travail, le Gateway, les canaux, les agents, les plugins et d'autres fonctionnalités facultatives.

L'application macOS ignore entièrement cette séquence lorsqu'elle accède à un Gateway configuré
dont l'agent par défaut possède déjà un modèle configuré ; elle ouvre l'interface normale de
l'agent.
Pour un Gateway nouveau ou incomplet, l'application pilote la séquence d'inférence au moyen
des méthodes Gateway `openclaw.setup.detect` et `openclaw.setup.activate` :
la détection répertorie chaque backend candidat trouvé, l'activation teste en direct un
candidat (une véritable complétion « répondre par OK ») et ne conserve le modèle,
l'identifiant et l'état du fournisseur/runtime nécessaires à cette route qu'après la réussite du test. Les valeurs par défaut de l'espace de travail et du Gateway restent réservées à OpenClaw. Un candidat défaillant
ne modifie jamais la configuration ; l'application parcourt automatiquement la séquence et propose finalement
une étape manuelle de saisie de clé/jeton alimentée par les plugins actifs du fournisseur
d'inférence textuelle du Gateway. Le fournisseur sélectionné contrôle son modèle
initial et sa configuration, et l'identifiant est vérifié de la même manière avant d'être enregistré.

La supervision Codex et les autres fonctionnalités facultatives des plugins restent en dehors de cette
transaction d'activation de l'inférence. Configurez-les uniquement une fois que l'inférence
fonctionne et qu'OpenClaw a démarré ; la politique existante des plugins et les désactivations explicites
de la supervision restent inchangées pendant la configuration de l'inférence.

## Conversation avec l'IA

La conversation libre d'OpenClaw en mode interactif passe par la même boucle d'agent que les agents OpenClaw ordinaires, limitée à un seul outil d'autorité OpenClaw de niveau zéro, `openclaw`, qui encapsule les opérations typées. Les actions de lecture s'exécutent librement, les mutations nécessitent votre approbation conversationnelle pour cette opération précise (voir Opérations et approbation), et chaque écriture appliquée est auditée et revalidée. La session de l'agent persiste, de sorte qu'OpenClaw dispose d'une véritable mémoire multitour. Si la route d'inférence vérifiée cesse ultérieurement de fonctionner, revenez à `openclaw onboard` et réparez-la avant de poursuivre.

L'hôte n'analyse pas les requêtes en langage naturel pour les convertir en opérations. Les messages libres
— y compris le texte ressemblant à une commande et les questions telles que « pourquoi mon
Gateway s'est-il arrêté ? » — sont transmis à l'IA, qui peut associer la requête à une opération typée
à l'aide de l'outil `openclaw`.

Lorsqu'une mutation est en attente, seules les formules d'approbation ou de refus sans ambiguïté issues d'une
liste fermée sont résolues sans inférence. Un consentement ambigu est transmis à un
appel de complétion configuré distinct et, à défaut, échoue en mode fermé. Les champs structurés
de l'assistant et la navigation exacte de l'hôte sont des contrôles d'interface, et non une analyse en langage naturel
des opérations. Une exception relative à l'hygiène des secrets est particulièrement importante : une commande
exacte `config set` sur un chemin sensible (jetons, clés, mots de passe) n'atteint jamais
un modèle. L'hôte crée une proposition expurgée et la valeur est masquée dans
l'historique visible par l'IA. Préférez `config set-ref <path> env <ENV_VAR>` pour les secrets.

Le mode de secours des canaux de messagerie n'utilise jamais le planificateur assisté par le modèle. Le secours à distance reste déterministe afin qu'un parcours normal d'agent défaillant ou compromis ne puisse pas être utilisé comme éditeur de configuration.

### Modèle de confiance du banc d'essai CLI

Les environnements d’exécution intégrés et le banc d’essai app-server de Codex appliquent directement la
restriction de niveau zéro : l’exécution comporte une liste d’autorisation d’outils OpenClaw contenant uniquement
l’outil `openclaw`. Pour Codex, OpenClaw désactive également les environnements, l’exécution
native, le mode multi-agent, les objectifs, les applications/Plugins, les Skills/MCP, la recherche web et les
surfaces `request_user_input` pour cette exécution. Codex injecte toujours son utilitaire natif inerte `update_plan` ;
celui-ci peut mettre à jour la liste de contrôle temporaire du modèle, mais ne peut écrire ni dans des fichiers
ni dans la configuration OpenClaw. Les bancs d’essai CLI n’utilisent pas la liste d’autorisation d’OpenClaw ;
OpenClaw n’admet donc que les backends dont le propre contrat de sélection d’outils peut prouver
la même restriction :

- Les backends sélectionnables, notamment Claude Code, démarrent avec une sélection vide
  d’outils natifs et un seul outil MCP, `openclaw`. La configuration MCP générée de Claude est
  appliquée avec `--strict-mcp-config`, afin qu’aucun autre serveur MCP ne soit chargé.
- Les backends qui ne déclarent aucun outil natif reçoivent le même serveur MCP OpenClaw
  dédié.
- Les backends dotés d’outils natifs toujours actifs ou inconnus échouent de manière fermée avant l’inférence ;
  ils ne peuvent pas héberger de session OpenClaw.

Seules les sessions OpenClaw reçoivent le serveur MCP openclaw ; les exécutions normales d’agents
ne voient jamais cet outil. Les backends CLI sélectionnables/sans outils natifs et les modèles
à clé API imposent donc la boucle littérale à outil unique. Les modèles app-server Codex imposent
un seul outil d’autorité OpenClaw ainsi que l’utilitaire natif inerte de planification. Dans les
trois cas, les écritures de configuration restent limitées au contrat d’approbation audité
d’OpenClaw.

Gemini CLI reste disponible pour les agents normaux, mais ne peut pas imposer la
sonde sans outil requise par la barrière d’inférence ; il ne peut donc pas héberger OpenClaw.

## Basculer vers un agent

Utilisez un sélecteur en langage naturel pour quitter OpenClaw et ouvrir la TUI normale :

```text
parler à l’agent
parler à l’agent de travail
basculer vers l’agent principal
```

`openclaw tui`, `openclaw chat` et `openclaw terminal` ouvrent directement la TUI normale de l’agent ; ils ne démarrent pas OpenClaw. Après avoir basculé vers la TUI normale, `/openclaw` permet de revenir à OpenClaw, éventuellement avec une demande de suivi :

```text
/openclaw
/openclaw restart gateway
```

## Mode de secours par message

Le mode de secours par message est le point d’entrée d’OpenClaw pour les canaux de messagerie : utilisez-le lorsque votre agent normal ne fonctionne plus, mais qu’un canal de confiance (par exemple WhatsApp) reçoit encore les commandes.

Il s’agit d’un gestionnaire déterministe de commandes d’urgence, et non de l’agent
conversationnel OpenClaw. Il n’amorce pas une nouvelle configuration et n’assouplit pas la barrière
d’inférence pour la conversation OpenClaw.

Commande prise en charge : `/openclaw <request>`. Le secours accepte uniquement la grammaire exacte de la commande saisie — le langage naturel est rejeté avec une indication, jamais interprété comme une opération, et aucun modèle n’est jamais consulté.

```text
Vous, dans un MP de propriétaire de confiance : /openclaw status
OpenClaw : mode de secours OpenClaw. Gateway accessible : non. Configuration valide : non.
Vous : /openclaw restart gateway
OpenClaw : plan : redémarrer le Gateway. Répondez /openclaw yes pour appliquer.
Vous : /openclaw yes
OpenClaw : appliqué. Entrée d’audit écrite.
```

La création d’un agent peut également être mise en file d’attente localement ou par l’intermédiaire du secours :

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

La création d’un agent ne peut nommer que le modèle par défaut actuellement vérifié en direct. Omettez le
modèle pour hériter de cette route.

Le secours distant est une surface d’administration et doit être traité comme une réparation distante de la configuration, et non comme une conversation normale.

Contrat de sécurité du secours distant :

- Désactivé lorsque le bac à sable est actif pour l’agent/la session ; OpenClaw refuse le secours distant et renvoie vers la réparation CLI locale.
- L’état effectif par défaut est `auto` : autoriser le secours distant uniquement en fonctionnement YOLO de confiance, lorsque l’environnement d’exécution dispose déjà d’une autorité locale sans bac à sable (`tools.exec.security` est résolu en `full` et `tools.exec.ask` en `off`, avec le mode de bac à sable `off`).
- Nécessite une identité de propriétaire explicite ; aucune règle d’expéditeur générique, politique de groupe ouverte, aucun Webhook non authentifié ni canal anonyme.
- MP du propriétaire uniquement par défaut ; le secours dans un groupe/canal nécessite une activation explicite.
- La recherche et la liste des Plugins sont en lecture seule. L’installation de Plugins est toujours locale uniquement (bloquée en mode de secours, même lorsqu’elle est par ailleurs activée), car elle télécharge du code exécutable. La désinstallation de Plugins est refusée aussi bien dans OpenClaw local qu’en mode de secours ; exécutez `openclaw plugins uninstall <id>` depuis un terminal.
- Le secours distant ne peut pas ouvrir la TUI locale ni basculer vers une session interactive d’agent ; utilisez la commande locale `openclaw` pour transférer le contrôle à l’agent.
- Les écritures persistantes nécessitent toujours une approbation, même en mode de secours.
- Les approbations en attente sont à usage unique. Toute commande de secours plus récente pour le même compte, canal et expéditeur révoque le plan précédent ; un échec d’exécution consomme également l’approbation, renvoyez donc la commande pour réessayer.
- Chaque opération de secours appliquée est auditée. Le secours par canal de messagerie enregistre les métadonnées du canal, du compte, de l’expéditeur et de l’adresse source ; les opérations modifiant la configuration enregistrent également les empreintes de configuration avant et après.
- Les secrets ne sont jamais affichés. L’inspection de SecretRef indique leur disponibilité, pas leurs valeurs.
- Si le Gateway fonctionne, le secours privilégie les opérations typées du Gateway ; s’il ne fonctionne pas, le secours utilise uniquement la surface minimale de réparation locale qui ne dépend pas de la boucle normale de l’agent.

Structure de configuration :

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled` : `"auto"` (par défaut) autorise le secours uniquement lorsque l’environnement d’exécution effectif est en mode YOLO et que le bac à sable est désactivé ; `false` n’autorise jamais le secours par canal de messagerie ; `true` autorise explicitement le secours lorsque les contrôles de propriétaire/canal réussissent (toujours sous réserve du refus lié au bac à sable).
- `ownerDmOnly` : limite le secours aux messages directs du propriétaire. Valeur par défaut : `true`.
- `pendingTtlMinutes` : durée pendant laquelle une écriture de secours en attente reste ouverte pour l’approbation `/openclaw yes` avant d’expirer. Valeur par défaut : `15`.

`openclaw doctor --fix` migre l’ancien bloc de configuration `crestodian` vers
`systemAgent`. L’environnement d’exécution lit uniquement le bloc canonique.

Le secours distant est couvert par le parcours Docker :

```bash
pnpm test:docker:system-agent-rescue
```

Un test de bon fonctionnement facultatif de la surface de commandes du canal en direct vérifie `/openclaw status` ainsi qu’un aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:system-agent-rescue-channel
```

La configuration ponctuelle empaquetée soumise à la barrière d’inférence est couverte par :

```bash
pnpm test:docker:system-agent-first-run
```

Ce parcours CLI empaqueté démarre avec un répertoire d’état vide et prouve qu’OpenClaw
échoue de manière fermée sans inférence. Il teste ensuite un faux Claude et l’active au moyen
du module d’activation empaqueté. Ce n’est qu’ensuite qu’une requête approximative atteint le
planificateur et est convertie en configuration typée, suivie de commandes ponctuelles qui créent un
agent supplémentaire, configurent Discord par l’activation d’un Plugin et une SecretRef de jeton,
valident la configuration et vérifient le journal d’audit. Ce parcours fournit des éléments de preuve
sur la barrière et les opérations ; il n’exerce ni l’intégration interactive ni la
conversation entre l’agent OpenClaw, les outils et les approbations. Le scénario QA Lab ci-dessous redirige
vers le même parcours Docker :

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Bac à sable](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
