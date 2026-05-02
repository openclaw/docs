---
read_when:
    - Vous exécutez openclaw sans commande et souhaitez comprendre Crestodian
    - Vous avez besoin d’un moyen sûr sans configuration pour inspecter ou réparer OpenClaw
    - Vous concevez ou activez le mode de secours des canaux de messagerie
summary: Référence CLI et modèle de sécurité pour Crestodian, l’assistant d’installation et de réparation sécurisé sans configuration
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T07:01:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian est l’assistant local de configuration, de réparation et de paramétrage d’OpenClaw. Il est
conçu pour rester accessible lorsque le chemin normal de l’agent est cassé.

Exécuter `openclaw` sans commande démarre Crestodian dans un terminal interactif.
Exécuter `openclaw crestodian` démarre explicitement le même assistant.

## Ce que Crestodian affiche

Au démarrage, Crestodian interactif ouvre le même shell TUI que celui utilisé par
`openclaw tui`, avec un backend de discussion Crestodian. Le journal de discussion commence par une courte
salutation :

- quand démarrer Crestodian
- le modèle ou le chemin de planificateur déterministe que Crestodian utilise réellement
- la validité de la configuration et l’agent par défaut
- l’accessibilité du Gateway depuis la première sonde de démarrage
- la prochaine action de débogage que Crestodian peut effectuer

Il ne vide pas les secrets et ne charge pas les commandes CLI de plugins juste pour démarrer. Le TUI
fournit toujours l’en-tête normal, le journal de discussion, la ligne d’état, le pied de page, l’autocomplétion
et les contrôles de l’éditeur.

Utilisez `status` pour l’inventaire détaillé avec le chemin de configuration, les chemins docs/source,
les sondes CLI locales, la présence de clés API, les agents, le modèle et les détails du Gateway.

Crestodian utilise la même découverte de références OpenClaw que les agents ordinaires. Dans un checkout Git,
il se pointe vers le `docs/` local et l’arborescence source locale. Dans une installation de package npm, il
utilise les docs du package inclus et crée un lien vers
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), avec des indications explicites
pour examiner le source lorsque les docs ne suffisent pas.

## Exemples

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Dans le TUI Crestodian :

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Démarrage sûr

Le chemin de démarrage de Crestodian est volontairement réduit. Il peut s’exécuter lorsque :

- `openclaw.json` est absent
- `openclaw.json` est invalide
- le Gateway est arrêté
- l’enregistrement des commandes de plugins est indisponible
- aucun agent n’a encore été configuré

`openclaw --help` et `openclaw --version` utilisent toujours les chemins rapides normaux.
`openclaw` non interactif se termine avec un court message au lieu d’imprimer l’aide racine,
car le produit sans commande est Crestodian.

## Opérations et approbation

Crestodian utilise des opérations typées au lieu de modifier la configuration de manière ad hoc.

Les opérations en lecture seule peuvent s’exécuter immédiatement :

- afficher la vue d’ensemble
- lister les agents
- lister les plugins installés
- rechercher des plugins ClawHub
- afficher l’état du modèle/backend
- exécuter les vérifications d’état ou de santé
- vérifier l’accessibilité du Gateway
- exécuter doctor sans corrections interactives
- valider la configuration
- afficher le chemin du journal d’audit

Les opérations persistantes nécessitent une approbation conversationnelle en mode interactif, sauf si
vous passez `--yes` pour une commande directe :

- écrire la configuration
- exécuter `config set`
- définir les valeurs SecretRef prises en charge via `config set-ref`
- exécuter le bootstrap de configuration/onboarding
- modifier le modèle par défaut
- démarrer, arrêter ou redémarrer le Gateway
- créer des agents
- installer des plugins depuis ClawHub ou npm
- désinstaller des plugins
- exécuter des réparations doctor qui réécrivent la configuration ou l’état

Les écritures appliquées sont enregistrées dans :

```text
~/.openclaw/audit/crestodian.jsonl
```

La découverte n’est pas auditée. Seules les opérations appliquées et les écritures sont journalisées.

`openclaw onboard --modern` démarre Crestodian comme aperçu de l’onboarding moderne.
`openclaw onboard` simple exécute toujours l’onboarding classique.

## Bootstrap de configuration

`setup` est le bootstrap d’onboarding orienté discussion. Il écrit uniquement via des
opérations de configuration typées et demande d’abord l’approbation.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Lorsqu’aucun modèle n’est configuré, setup sélectionne le premier backend utilisable dans cet
ordre et vous indique ce qu’il a choisi :

- modèle explicite existant, s’il est déjà configuré
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Si aucun n’est disponible, setup écrit tout de même l’espace de travail par défaut et laisse le
modèle non défini. Installez ou connectez-vous à Codex/Claude Code, ou exposez
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, puis relancez setup.

## Planificateur Assisté par Modèle

Crestodian démarre toujours en mode déterministe. Pour les commandes floues que
l’analyseur déterministe ne comprend pas, Crestodian local peut effectuer un tour de
planificateur borné via les chemins d’exécution normaux d’OpenClaw. Il utilise d’abord le
modèle OpenClaw configuré. Si aucun modèle configuré n’est encore utilisable, il peut se
rabattre sur les runtimes locaux déjà présents sur la machine :

- Claude Code CLI : `claude-cli/claude-opus-4-7`
- harnais Codex app-server : `openai/gpt-5.5` avec `agentRuntime.id: "codex"`
- Codex CLI : `codex-cli/gpt-5.5`

Le planificateur assisté par modèle ne peut pas modifier directement la configuration. Il doit traduire la
requête en l’une des commandes typées de Crestodian, puis les règles normales d’approbation et
d’audit s’appliquent. Crestodian imprime le modèle utilisé et la commande interprétée
avant d’exécuter quoi que ce soit. Les tours de planificateur de secours sans configuration sont
temporaires, avec les outils désactivés lorsque le runtime le prend en charge, et utilisent un
espace de travail/session temporaire.

Le mode de secours par canal de messages n’utilise pas le planificateur assisté par modèle. Le secours
distant reste déterministe afin qu’un chemin d’agent normal cassé ou compromis ne puisse pas
être utilisé comme éditeur de configuration.

## Basculer vers un agent

Utilisez un sélecteur en langage naturel pour quitter Crestodian et ouvrir le TUI normal :

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` et `openclaw terminal` ouvrent toujours directement le TUI
d’agent normal. Ils ne démarrent pas Crestodian.

Après avoir basculé dans le TUI normal, utilisez `/crestodian` pour revenir à Crestodian.
Vous pouvez inclure une requête de suivi :

```text
/crestodian
/crestodian restart gateway
```

Les bascules d’agent dans le TUI laissent un fil d’Ariane indiquant que `/crestodian` est disponible.

## Mode de secours par message

Le mode de secours par message est le point d’entrée de canal de messages pour Crestodian. Il est destiné au
cas où votre agent normal est mort, mais où un canal de confiance comme WhatsApp
reçoit encore les commandes.

Commande texte prise en charge :

- `/crestodian <request>`

Flux opérateur :

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

La création d’agent peut également être mise en file d’attente depuis l’invite locale ou le mode de secours :

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Le mode de secours distant est une surface d’administration. Il doit être traité comme une réparation
de configuration distante, pas comme une discussion normale.

Contrat de sécurité pour le secours distant :

- Désactivé lorsque le sandboxing est actif. Si un agent/session est sandboxé,
  Crestodian doit refuser le secours distant et expliquer qu’une réparation CLI locale est
  requise.
- L’état effectif par défaut est `auto` : autoriser le secours distant uniquement en
  fonctionnement YOLO de confiance, lorsque le runtime dispose déjà d’une autorité locale non sandboxée.
- Exiger une identité de propriétaire explicite. Le secours ne doit pas accepter les règles
  d’expéditeur wildcard, les politiques de groupe ouvert, les webhooks non authentifiés ni les canaux anonymes.
- DM de propriétaire uniquement par défaut. Le secours en groupe/canal nécessite une activation explicite.
- La recherche et la liste de plugins sont en lecture seule. L’installation de plugins est locale uniquement par défaut
  car elle télécharge du code exécutable. La désinstallation de plugins peut être autorisée comme
  opération de réparation approuvée lorsque la politique de secours permet les écritures persistantes.
- Le secours distant ne peut pas ouvrir le TUI local ni basculer vers une session d’agent
  interactive. Utilisez `openclaw` local pour le transfert vers l’agent.
- Les écritures persistantes nécessitent toujours une approbation, même en mode secours.
- Auditer chaque opération de secours appliquée. Le secours par canal de messages enregistre le canal,
  le compte, l’expéditeur et les métadonnées d’adresse source. Les opérations modifiant la configuration
  enregistrent également les hash de configuration avant et après.
- Ne jamais renvoyer de secrets. L’inspection SecretRef doit signaler la disponibilité, pas
  les valeurs.
- Si le Gateway est actif, privilégier les opérations typées du Gateway. Si le Gateway est
  mort, utiliser uniquement la surface de réparation locale minimale qui ne dépend pas de la
  boucle d’agent normale.

Forme de configuration :

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` doit accepter :

- `"auto"` : valeur par défaut. Autoriser uniquement lorsque le runtime effectif est YOLO et que
  le sandboxing est désactivé.
- `false` : ne jamais autoriser le secours par canal de messages.
- `true` : autoriser explicitement le secours lorsque les vérifications de propriétaire/canal réussissent. Cela
  ne doit toujours pas contourner le refus lié au sandboxing.

La posture YOLO `"auto"` par défaut est :

- le mode sandbox se résout en `off`
- `tools.exec.security` se résout en `full`
- `tools.exec.ask` se résout en `off`

Le secours distant est couvert par la voie Docker :

```bash
pnpm test:docker:crestodian-rescue
```

Le repli de planificateur local sans configuration est couvert par :

```bash
pnpm test:docker:crestodian-planner
```

Une smoke de surface de commande de canal live opt-in vérifie `/crestodian status` ainsi qu’un
aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuration fraîche sans configuration préalable via Crestodian est couverte par :

```bash
pnpm test:docker:crestodian-first-run
```

Cette voie démarre avec un répertoire d’état vide, route `openclaw` nu vers Crestodian,
définit le modèle par défaut, crée un agent supplémentaire, configure Discord via
une activation de plugin plus un token SecretRef, valide la configuration et vérifie le journal
d’audit. QA Lab dispose également d’un scénario adossé au repo pour le même flux Ring 0 :

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Connexe

- [Référence CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Sandbox](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
