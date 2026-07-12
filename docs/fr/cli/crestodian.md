---
read_when:
    - Vous avez terminé la configuration de l’inférence et souhaitez que Crestodian configure le reste
    - Vous devez inspecter ou réparer OpenClaw à l’aide de l’agent de configuration local
    - Vous concevez ou activez le mode de secours du canal de messagerie
summary: Référence de la CLI et modèle de sécurité pour l’assistant de configuration et de réparation de Crestodian basé sur l’inférence
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T02:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian conversationnel est l’agent local d’installation, de réparation et de configuration d’OpenClaw. Il ne démarre qu’après que le modèle effectif par défaut a terminé un véritable tour. Les nouvelles installations établissent d’abord l’inférence ; les configurations mal formées restent prises en charge par le parcours classique de doctor.

## Quand démarre-t-il ?

L’exécution de `openclaw` sans sous-commande est orientée selon l’état de la configuration :

- Configuration absente, ou présente sans paramètres définis par l’utilisateur (vide, ou contenant uniquement les clés `$schema`/`meta`) : démarre l’intégration guidée avec vérification en direct par l’IA.
- Configuration présente mais non valide : démarre l’intégration classique, qui signale les problèmes et vous oriente vers `openclaw doctor`.
- Configuration présente et valide : ouvre la TUI normale de l’agent. Un Gateway configuré et accessible, dont l’agent par défaut possède un modèle, mène directement à cette interface sans intégration ni Crestodian. Utilisez `/crestodian` dans la TUI, ou exécutez directement `openclaw crestodian`, pour accéder ultérieurement à Crestodian.

L’exécution de `openclaw crestodian` teste d’abord en direct le modèle configuré par défaut. Un tour réussi démarre Crestodian. En mode interactif, un échec ouvre la configuration guidée de l’inférence, puis transmet le contrôle à Crestodian dès qu’un candidat réussit. Les requêtes ponctuelles, JSON et autres requêtes non interactives échouent avec des instructions invitant à exécuter `openclaw onboard` lorsque l’inférence est indisponible. `openclaw --help` et `openclaw --version` conservent leurs parcours rapides habituels.

En mode non interactif, l’exécution de `openclaw` seul (sans TTY) se termine avec un bref message au lieu d’afficher l’aide racine : celui-ci indique l’intégration non interactive pour une installation nouvelle ou non valide, ou `openclaw agent --local ...` lorsque la configuration est valide.

`openclaw onboard --modern` reste un alias de compatibilité pour Crestodian, mais utilise la même barrière d’inférence : une inférence fonctionnelle ouvre la conversation, les échecs interactifs démarrent la configuration guidée de l’inférence et les échecs non interactifs se terminent avec des indications d’intégration. `openclaw onboard --classic` ouvre l’assistant complet étape par étape.

## Ce qu’affiche Crestodian

Crestodian interactif ouvre la même enveloppe TUI que `openclaw tui`, avec un moteur de conversation Crestodian. Le message d’accueil au démarrage présente :

- la validité de la configuration et l’agent par défaut
- le modèle vérifié utilisé par Crestodian
- l’accessibilité du Gateway selon la première sonde de démarrage
- la prochaine action de débogage recommandée

Il n’affiche pas les secrets et ne charge pas les commandes CLI des plugins uniquement pour démarrer.

Utilisez `status` pour obtenir l’inventaire détaillé : chemin de configuration, chemins de la documentation et des sources, sondes de la CLI locale, présence des clés/jetons, agents, modèle et détails du Gateway.

Crestodian utilise la même découverte des références que les agents ordinaires : dans un checkout Git, il indique le répertoire local `docs/` et l’arborescence des sources ; dans une installation npm, il utilise la documentation intégrée et renvoie vers [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), en recommandant de consulter les sources lorsque la documentation ne suffit pas.

## Exemples

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dans la TUI de Crestodian :

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Opérations et approbation

Crestodian utilise des opérations typées au lieu de modifier la configuration de manière improvisée.

Les opérations en lecture seule s’exécutent immédiatement : afficher la vue d’ensemble, répertorier les agents, répertorier les plugins installés, rechercher des plugins ClawHub, afficher l’état du modèle et du moteur, exécuter les contrôles d’état et de santé, vérifier l’accessibilité du Gateway, exécuter doctor sans corrections interactives, valider la configuration et afficher le chemin du journal d’audit.

Le démarrage de la configuration guidée d’un canal (`connect telegram`) s’exécute également immédiatement. Son assistant recueille des réponses explicites et prend en charge les écritures qui en résultent.

Les opérations persistantes nécessitent une approbation conversationnelle (ou `--yes` pour une commande directe) : écrire la configuration, exécuter `config set`, exécuter `config set-ref`, amorcer l’installation ou l’intégration, modifier le modèle par défaut, démarrer/arrêter/redémarrer le Gateway, créer des agents et installer des plugins.

Les réparations de doctor ne sont pas disponibles dans Crestodian, car elles peuvent réécrire le fournisseur, l’authentification ou la route d’inférence de l’agent par défaut qui alimente la session. Quittez Crestodian et exécutez `openclaw doctor --fix` dans un terminal. La commande `doctor` en lecture seule reste disponible dans Crestodian.

Les nouveaux agents héritent de la route d’inférence par défaut vérifiée en direct. L’identifiant d’agent `crestodian` est réservé au gardien virtuel privilégié et ne peut pas être créé comme agent ordinaire.

`config set` et `config set-ref` ne peuvent pas modifier l’état de la route d’inférence, notamment les identifiants du fournisseur d’inférence, les clés `auth.*` de premier niveau, les catalogues de modèles, les moteurs CLI, les routes de modèles par défaut ou propres à chaque agent, les paramètres et outils des agents, ni les clés racines `tools.*`. Les écritures brutes sous `env.*`, `secrets.*`, `plugins.*` et `$include` sont également refusées, car elles peuvent remplacer la résolution des identifiants ou l’activation du fournisseur. L’authentification du Gateway et des canaux reste une surface de configuration normale. Utilisez les processus typés des plugins et des canaux ainsi que `set default model <provider/model>` pour une route déjà configurée ; la route est testée en direct avant son enregistrement. Pour configurer ou réparer l’accès au fournisseur ou à l’authentification, quittez Crestodian et exécutez `openclaw onboard`.

La désinstallation d’un plugin est refusée dans Crestodian, car la suppression d’un plugin fournisseur pourrait désactiver la route d’inférence qui alimente la session. Quittez Crestodian et exécutez `openclaw plugins uninstall <id>` depuis un terminal.

L’approbation est donnée avec vos propres mots : les réponses sans ambiguïté (« oui », « bien sûr », « allez-y », « pas maintenant ») sont interprétées à partir d’une liste déterministe fermée. Lorsque la route configurée prend en charge un appel de complétion distinct, les autres réponses peuvent être classées uniquement à partir de votre message et de la proposition en attente — jamais par le modèle conversationnel lui-même, qui ne peut pas s’auto-approuver. Les réponses non classées ou ambiguës maintiennent la proposition en attente et la conversation repose la question.

Les écritures appliquées sont enregistrées dans `~/.openclaw/audit/crestodian.jsonl`. La découverte n’est pas auditée ; seules les opérations appliquées et les écritures le sont.

La configuration d’un canal peut s’exécuter sous forme de conversation hébergée jusqu’à ce qu’elle atteigne un secret. La TUI locale de Crestodian n’accepte pas les réponses sensibles de l’assistant, car les saisies de la conversation dans le terminal sont visibles. Elle propose immédiatement `open channel wizard`, en transmettant le canal sélectionné à l’assistant masqué du terminal ; vous pouvez également exécuter ultérieurement `openclaw channels add --channel <channel>`.

### Passage à la configuration masquée d’un canal

La conversation locale peut transmettre le contrôle à l’assistant masqué de configuration des canaux :

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` ouvre la configuration masquée du canal après la fermeture de la TUI de conversation. Utilisez d’abord `channel info <channel>` pour obtenir le libellé du canal, l’état de la configuration, un résumé des prérequis et le lien vers la documentation.

Crestodian ne modifie jamais l’accès au fournisseur ou à l’authentification depuis sa propre session : celle-ci dépend déjà de cette route d’inférence. Pour configurer ou réparer un fournisseur de modèles, `configure model provider` renvoie des instructions invitant à quitter Crestodian et à lancer l’intégration, sans démarrer d’assistant ni écrire la configuration. Quittez Crestodian et exécutez `openclaw onboard` ; l’intégration prépare les identifiants et enregistre uniquement une route qui termine un véritable tour en direct. Redémarrez Crestodian après la réussite de l’intégration.

## Amorçage de l’installation

`setup` configure l’espace de travail restant et l’état du Gateway une fois que l’intégration guidée a déjà établi l’inférence. Il écrit uniquement au moyen d’opérations de configuration typées et demande d’abord une approbation.

```text
setup
setup workspace ~/Projects/work
```

`setup` conserve le modèle effectif vérifié. Il ne configure ni ne remplace l’inférence.

Si l’inférence est absente ou si sa vérification en direct échoue, quittez Crestodian et exécutez `openclaw onboard`. L’intégration guidée détecte les modèles configurés, les clés d’API et les CLI locales authentifiées, demande une véritable réponse à chaque candidat et ne conserve qu’une route fonctionnelle. Crestodian démarre immédiatement après cette étape et peut alors configurer l’espace de travail, le Gateway, les canaux, les agents, les plugins et les autres fonctionnalités facultatives.

L’application macOS ignore entièrement cette séquence lorsqu’elle atteint un Gateway configuré dont l’agent par défaut possède déjà un modèle configuré ; elle ouvre l’interface normale de l’agent.
Pour un Gateway nouveau ou incomplet, l’application pilote la séquence d’inférence au moyen des méthodes Gateway `crestodian.setup.detect` et `crestodian.setup.activate` : detect répertorie tous les moteurs candidats qu’elle trouve, activate teste en direct un candidat (une véritable complétion demandant de « répondre OK ») et ne conserve le modèle, les identifiants et l’état du fournisseur ou de l’environnement d’exécution nécessaires à cette route qu’après la réussite du test. Les valeurs par défaut de l’espace de travail et du Gateway restent gérées par Crestodian. Un candidat en échec ne modifie jamais la configuration ; l’application parcourt automatiquement la séquence, puis propose finalement une étape manuelle de saisie de clé ou de jeton, alimentée par les plugins fournisseurs d’inférence textuelle actifs du Gateway. Le fournisseur sélectionné détermine son modèle initial et sa configuration, et les identifiants sont vérifiés de la même manière avant leur enregistrement.

La supervision de Codex et les autres fonctionnalités facultatives des plugins restent en dehors de cette transaction d’activation de l’inférence. Configurez-les uniquement après que l’inférence fonctionne et que Crestodian a démarré ; la politique existante des plugins et les désactivations explicites de la supervision restent inchangées pendant la configuration de l’inférence.

## Conversation avec l’IA

La conversation libre de Crestodian interactif s’exécute dans la même boucle d’agent que les agents OpenClaw ordinaires, avec un accès limité à un seul outil d’autorité OpenClaw de niveau zéro, `crestodian`, qui encapsule les opérations typées. Les actions de lecture s’exécutent librement, les mutations nécessitent votre approbation conversationnelle pour l’opération exacte concernée (voir Opérations et approbation), et chaque écriture appliquée est auditée et de nouveau validée. La session de l’agent persiste, de sorte que Crestodian dispose d’une véritable mémoire sur plusieurs tours. Si la route d’inférence vérifiée cesse ensuite de fonctionner, revenez à `openclaw onboard` et réparez-la avant de poursuivre.

L’hôte n’analyse pas les requêtes en langage naturel pour les convertir en opérations. Les messages libres — y compris le texte ressemblant à une commande et les questions telles que « pourquoi mon Gateway s’est-il arrêté ? » — sont transmis à l’IA, qui peut associer la requête à une opération typée au moyen de l’outil `crestodian`.

Lorsqu’une mutation est en attente, seules les formulations d’approbation ou de refus sans ambiguïté issues d’une liste fermée sont interprétées sans inférence. Un consentement ambigu est transmis à un appel de complétion configuré distinct et, à défaut, est refusé par sécurité. Les champs structurés de l’assistant et la navigation exacte de l’hôte sont des contrôles d’interface utilisateur, et non une analyse des opérations en langage naturel. Une exception relative à l’hygiène des secrets est particulièrement importante : une commande `config set` exacte visant un chemin sensible (jetons, clés, mots de passe) n’atteint jamais un modèle. L’hôte crée une proposition expurgée et la valeur est masquée dans l’historique visible par l’IA. Pour les secrets, privilégiez `config set-ref <path> env <ENV_VAR>`.

Le mode de secours des canaux de messagerie n’utilise jamais le planificateur assisté par le modèle. Le secours distant reste déterministe afin qu’un parcours d’agent normal défaillant ou compromis ne puisse pas servir d’éditeur de configuration.

### Modèle de confiance du banc d’essai CLI

Les environnements d’exécution intégrés et le banc d’essai du serveur d’application Codex imposent directement la restriction de niveau zéro : l’exécution transporte une liste d’autorisation des outils OpenClaw contenant uniquement l’outil `crestodian`. Pour Codex, OpenClaw désactive également les environnements, l’exécution native, le mode multi-agent, les objectifs, les surfaces d’applications/plugins, de Skills/MCP, de recherche Web et `request_user_input` pour cette exécution. Codex injecte toujours son utilitaire natif inerte `update_plan` ; celui-ci peut mettre à jour la liste de contrôle temporaire du modèle, mais ne peut écrire ni dans les fichiers ni dans la configuration d’OpenClaw. Les bancs d’essai CLI ne consomment pas la liste d’autorisation d’OpenClaw ; Crestodian n’accepte donc que les moteurs dont le propre contrat de sélection des outils peut garantir la même restriction :

- Les backends sélectionnables, y compris Claude Code, démarrent avec une sélection
  vide d’outils natifs et un outil MCP, `crestodian`. La configuration MCP générée
  par Claude est appliquée avec `--strict-mcp-config`, afin qu’aucun autre serveur MCP ne soit chargé.
- Les backends qui ne déclarent aucun outil natif reçoivent le même serveur MCP
  Crestodian dédié.
- Les backends dont les outils natifs sont toujours actifs ou inconnus échouent de
  manière sécurisée avant l’inférence ; ils ne peuvent pas héberger de session Crestodian.

Seules les sessions Crestodian reçoivent le serveur MCP crestodian ; les exécutions
normales d’agents ne voient jamais cet outil. Les backends CLI sélectionnables/sans
outil natif et les modèles à clé API imposent donc la boucle littérale à outil unique.
Les modèles de serveur d’application Codex imposent un seul outil d’autorité OpenClaw,
accompagné de l’utilitaire natif de planification inerte. Dans les trois cas, les
écritures de configuration restent limitées au contrat d’approbation audité de Crestodian.

Gemini CLI reste disponible pour les agents normaux, mais il ne peut pas imposer la
sonde sans outil requise par la barrière d’inférence ; il ne peut donc pas héberger Crestodian.

## Passer à un agent

Utilisez un sélecteur en langage naturel pour quitter Crestodian et ouvrir la TUI normale :

```text
parler à l’agent
parler à l’agent de travail
passer à l’agent principal
```

`openclaw tui`, `openclaw chat` et `openclaw terminal` ouvrent directement la TUI normale de l’agent ; ils ne démarrent pas Crestodian. Après être passé dans la TUI normale, `/crestodian` permet de revenir à Crestodian, éventuellement avec une demande complémentaire :

```text
/crestodian
/crestodian redémarrer gateway
```

## Mode de secours par messages

Le mode de secours par messages est le point d’entrée de Crestodian pour les canaux de messagerie : utilisez-le lorsque votre agent normal est hors service, mais qu’un canal de confiance (par exemple WhatsApp) reçoit toujours les commandes.

Il s’agit d’un gestionnaire déterministe de commandes d’urgence, et non de l’agent
conversationnel Crestodian. Il n’amorce pas une nouvelle configuration et n’assouplit
pas la barrière d’inférence pour la discussion avec Crestodian.

Commande prise en charge : `/crestodian <request>`. Le mode de secours accepte uniquement la grammaire exacte des commandes saisies — le langage naturel est rejeté avec une indication, jamais interprété arbitrairement comme une opération, et aucun modèle n’est jamais consulté.

```text
Vous, dans un message privé de propriétaire de confiance : /crestodian status
OpenClaw : Mode de secours Crestodian. Gateway joignable : non. Configuration valide : non.
Vous : /crestodian restart gateway
OpenClaw : Plan : redémarrer le Gateway. Répondez /crestodian yes pour appliquer.
Vous : /crestodian yes
OpenClaw : Appliqué. Entrée d’audit enregistrée.
```

La création d’un agent peut également être mise en file d’attente localement ou via le mode de secours :

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

La création d’un agent ne peut nommer que le modèle par défaut actuel vérifié en
direct. Omettez le modèle pour hériter de cette route.

Le secours à distance est une surface d’administration et doit être traité comme une réparation de configuration à distance, et non comme une discussion normale.

Contrat de sécurité du secours à distance :

- Désactivé lorsque le bac à sable est actif pour l’agent ou la session ; Crestodian refuse le secours à distance et renvoie vers une réparation locale via la CLI.
- L’état effectif par défaut est `auto` : autoriser le secours à distance uniquement en fonctionnement YOLO de confiance, lorsque l’environnement d’exécution dispose déjà d’une autorité locale sans bac à sable (`tools.exec.security` se résout en `full` et `tools.exec.ask` se résout en `off`, avec le mode de bac à sable `off`).
- Exige une identité de propriétaire explicite ; aucune règle d’expéditeur générique, politique de groupe ouverte, Webhook non authentifié ou canal anonyme.
- Messages privés du propriétaire uniquement par défaut ; le secours dans un groupe ou un canal nécessite une activation explicite.
- La recherche et la liste des Plugins sont en lecture seule. L’installation d’un Plugin est toujours locale uniquement (bloquée en mode de secours, même lorsqu’elle est autrement activée), car elle télécharge du code exécutable. La désinstallation d’un Plugin est refusée à la fois dans Crestodian local et dans le mode de secours ; exécutez `openclaw plugins uninstall <id>` depuis un terminal.
- Le secours à distance ne peut pas ouvrir la TUI locale ni passer à une session interactive d’agent ; utilisez localement `openclaw` pour transférer le contrôle à l’agent.
- Les écritures persistantes nécessitent toujours une approbation, même en mode de secours.
- Chaque opération de secours appliquée est auditée. Le secours par canal de messagerie enregistre les métadonnées du canal, du compte, de l’expéditeur et de l’adresse source ; les opérations qui modifient la configuration enregistrent également les empreintes de configuration avant et après.
- Les secrets ne sont jamais affichés. L’inspection de SecretRef indique leur disponibilité, pas leurs valeurs.
- Si le Gateway est actif, le mode de secours privilégie les opérations typées du Gateway ; s’il est hors service, il utilise uniquement la surface minimale de réparation locale qui ne dépend pas de la boucle normale de l’agent.

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

- `enabled` : `"auto"` (valeur par défaut) autorise le secours uniquement lorsque l’environnement d’exécution effectif est en mode YOLO et que le bac à sable est désactivé ; `false` n’autorise jamais le secours par canal de messagerie ; `true` l’autorise explicitement lorsque les vérifications du propriétaire et du canal réussissent, tout en restant soumis au refus lié au bac à sable.
- `ownerDmOnly` : limite le secours aux messages privés du propriétaire. Valeur par défaut : `true`.
- `pendingTtlMinutes` : durée pendant laquelle une écriture de secours en attente reste ouverte pour approbation avec `/crestodian yes` avant d’expirer. Valeur par défaut : `15`.

Le secours à distance est couvert par le parcours Docker :

```bash
pnpm test:docker:crestodian-rescue
```

Un test de fumée optionnel de la surface de commandes d’un canal actif vérifie `/crestodian status` ainsi qu’un aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuration ponctuelle empaquetée, soumise à la barrière d’inférence, est couverte par :

```bash
pnpm test:docker:crestodian-first-run
```

Ce parcours de CLI empaquetée démarre avec un répertoire d’état vide et prouve que
Crestodian échoue de manière sécurisée sans inférence. Il teste ensuite et active un
faux Claude via le module d’activation empaqueté. Ce n’est qu’ensuite qu’une demande
approximative atteint le planificateur et est convertie en configuration typée, suivie
de commandes ponctuelles qui créent un agent supplémentaire, configurent Discord en
activant un Plugin et en ajoutant un jeton SecretRef, valident la configuration et
vérifient le journal d’audit. Ce parcours fournit des éléments de preuve relatifs à la
barrière et aux opérations ; il ne couvre ni l’intégration interactive ni la conversation
entre l’agent Crestodian, les outils et le mécanisme d’approbation. Le scénario QA Lab
ci-dessous redirige vers le même parcours Docker :

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Bac à sable](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
