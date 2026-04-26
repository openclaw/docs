---
read_when:
    - Vous exécutez `openclaw` sans commande et souhaitez comprendre Crestodian
    - Vous avez besoin d’un moyen sûr sans configuration pour inspecter ou réparer OpenClaw
    - Vous concevez ou activez le mode de secours des canaux de messagerie
summary: Référence CLI et modèle de sécurité pour Crestodian, l’assistant de configuration et de réparation sans config et sécurisé par défaut
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian est l’assistant local d’installation, de réparation et de configuration d’OpenClaw. Il est conçu pour rester accessible lorsque le chemin normal de l’agent est défaillant.

Exécuter `openclaw` sans commande démarre Crestodian dans un terminal interactif.
Exécuter `openclaw crestodian` démarre explicitement le même assistant.

## Ce que Crestodian affiche

Au démarrage, Crestodian interactif ouvre le même shell TUI que celui utilisé par
`openclaw tui`, avec un backend de discussion Crestodian. Le journal de discussion commence par un court
message d’accueil :

- quand démarrer Crestodian
- le modèle ou le chemin du planificateur déterministe que Crestodian utilise réellement
- la validité de la config et l’agent par défaut
- l’accessibilité du Gateway à partir de la première sonde de démarrage
- la prochaine action de débogage que Crestodian peut entreprendre

Il ne vide pas de secrets et ne charge pas de commandes CLI de Plugin juste pour démarrer. Le TUI
fournit toujours l’en-tête normal, le journal de discussion, la ligne d’état, le pied de page, l’autocomplétion
et les contrôles de l’éditeur.

Utilisez `status` pour l’inventaire détaillé avec le chemin de config, les chemins docs/source,
les sondes CLI locales, la présence de clé API, les agents, le modèle et les détails du Gateway.

Crestodian utilise la même découverte de références OpenClaw que les agents ordinaires. Dans un checkout Git,
il se pointe lui-même vers `docs/` local et l’arborescence locale des sources. Dans une installation de package npm, il
utilise la documentation incluse du package et renvoie vers
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), avec des indications explicites
de consulter la source lorsque la documentation ne suffit pas.

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Démarrage sécurisé

Le chemin de démarrage de Crestodian est volontairement réduit. Il peut s’exécuter lorsque :

- `openclaw.json` est absent
- `openclaw.json` n’est pas valide
- le Gateway est arrêté
- l’enregistrement des commandes de Plugin est indisponible
- aucun agent n’a encore été configuré

`openclaw --help` et `openclaw --version` utilisent toujours les chemins rapides normaux.
`openclaw` non interactif quitte avec un court message au lieu d’afficher l’aide racine,
car le produit sans commande est Crestodian.

## Opérations et approbation

Crestodian utilise des opérations typées au lieu de modifier la config de manière ad hoc.

Les opérations en lecture seule peuvent s’exécuter immédiatement :

- afficher la vue d’ensemble
- lister les agents
- afficher l’état du modèle/backend
- exécuter des vérifications d’état ou de santé
- vérifier l’accessibilité du Gateway
- exécuter doctor sans correctifs interactifs
- valider la config
- afficher le chemin du journal d’audit

Les opérations persistantes nécessitent une approbation conversationnelle en mode interactif sauf
si vous passez `--yes` pour une commande directe :

- écrire la config
- exécuter `config set`
- définir des valeurs SecretRef prises en charge via `config set-ref`
- exécuter le bootstrap d’installation/onboarding
- modifier le modèle par défaut
- démarrer, arrêter ou redémarrer le Gateway
- créer des agents
- exécuter des réparations doctor qui réécrivent la config ou l’état

Les écritures appliquées sont enregistrées dans :

```text
~/.openclaw/audit/crestodian.jsonl
```

La découverte n’est pas auditée. Seules les opérations appliquées et les écritures sont journalisées.

`openclaw onboard --modern` démarre Crestodian comme aperçu de l’onboarding moderne.
`openclaw onboard` simple exécute toujours l’onboarding classique.

## Bootstrap d’installation

`setup` est le bootstrap d’onboarding orienté discussion. Il écrit uniquement via des
opérations de config typées et demande d’abord une approbation.

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

Si aucun n’est disponible, setup écrit quand même l’espace de travail par défaut et laisse le
modèle non défini. Installez ou connectez-vous à Codex/Claude Code, ou exposez
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, puis relancez setup.

## Planificateur assisté par modèle

Crestodian démarre toujours en mode déterministe. Pour les commandes imprécises que le
parseur déterministe ne comprend pas, Crestodian local peut effectuer un tour de planificateur
borné via les chemins d’exécution normaux d’OpenClaw. Il utilise d’abord le
modèle OpenClaw configuré. Si aucun modèle configuré n’est encore utilisable, il peut
revenir sur des runtimes locaux déjà présents sur la machine :

- Claude Code CLI : `claude-cli/claude-opus-4-7`
- Harness app-server Codex : `openai/gpt-5.5` avec `agentRuntime.id: "codex"`
- Codex CLI : `codex-cli/gpt-5.5`

Le planificateur assisté par modèle ne peut pas modifier directement la config. Il doit traduire la
demande en l’une des commandes typées de Crestodian, puis les règles normales d’approbation et
d’audit s’appliquent. Crestodian affiche le modèle utilisé et la commande interprétée avant
d’exécuter quoi que ce soit. Les tours de planificateur de repli sans config sont
temporaires, avec outils désactivés lorsque le runtime le prend en charge, et utilisent un
espace de travail/session temporaire.

Le mode de secours par canal de messages n’utilise pas le planificateur assisté par modèle. Le
secours distant reste déterministe afin qu’un chemin d’agent normal défaillant ou compromis ne
puisse pas être utilisé comme éditeur de config.

## Basculer vers un agent

Utilisez un sélecteur en langage naturel pour quitter Crestodian et ouvrir le TUI normal :

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` et `openclaw terminal` ouvrent toujours directement le TUI de
l’agent normal. Ils ne démarrent pas Crestodian.

Après être passé dans le TUI normal, utilisez `/crestodian` pour revenir à Crestodian.
Vous pouvez inclure une demande de suivi :

```text
/crestodian
/crestodian restart gateway
```

Les changements d’agent dans le TUI laissent une trace indiquant que `/crestodian` est disponible.

## Mode de secours par message

Le mode de secours par message est le point d’entrée de Crestodian pour les canaux de messages. Il est destiné au
cas où votre agent normal est hors service, mais où un canal approuvé tel que WhatsApp
reçoit encore des commandes.

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

La création d’agent peut aussi être mise en file depuis l’invite locale ou le mode de secours :

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Le mode de secours distant est une surface d’administration. Il doit être traité comme une réparation
distante de config, et non comme une discussion normale.

Contrat de sécurité pour le secours distant :

- Désactivé lorsque le sandboxing est actif. Si un agent/une session est sandboxé,
  Crestodian doit refuser le secours distant et expliquer qu’une réparation via CLI locale est
  requise.
- L’état effectif par défaut est `auto` : autoriser le secours distant uniquement en fonctionnement YOLO
  approuvé, où le runtime dispose déjà d’une autorité locale non sandboxée.
- Exiger une identité de propriétaire explicite. Le secours ne doit pas accepter de règles d’expéditeur génériques, de politique de groupe ouverte, de Webhook non authentifiés ou de canaux anonymes.
- DM de propriétaire uniquement par défaut. Le secours dans les groupes/canaux nécessite un opt-in explicite.
- Le secours distant ne peut pas ouvrir le TUI local ni basculer vers une session d’agent interactive. Utilisez `openclaw` local pour le transfert vers un agent.
- Les écritures persistantes nécessitent toujours une approbation, même en mode de secours.
- Auditer chaque opération de secours appliquée. Le secours par canal de messages enregistre le canal,
  le compte, l’expéditeur et les métadonnées d’adresse source. Les opérations qui modifient la config
  enregistrent aussi les hachages de config avant et après.
- Ne jamais renvoyer de secrets. L’inspection de SecretRef doit signaler la disponibilité, pas
  les valeurs.
- Si le Gateway est vivant, préférer les opérations typées du Gateway. Si le Gateway est
  hors service, n’utiliser que la surface minimale de réparation locale qui ne dépend pas de la
  boucle normale de l’agent.

Structure de config :

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

- `"auto"` : valeur par défaut. Autoriser uniquement lorsque le runtime effectif est YOLO et
  que le sandboxing est désactivé.
- `false` : ne jamais autoriser le secours par canal de messages.
- `true` : autoriser explicitement le secours lorsque les vérifications propriétaire/canal passent. Cela
  ne doit toujours pas contourner le refus lié au sandboxing.

La posture YOLO par défaut pour `"auto"` est :

- le mode sandbox se résout à `off`
- `tools.exec.security` se résout à `full`
- `tools.exec.ask` se résout à `off`

Le secours distant est couvert par la lane Docker :

```bash
pnpm test:docker:crestodian-rescue
```

Le repli du planificateur local sans config est couvert par :

```bash
pnpm test:docker:crestodian-planner
```

Une vérification smoke opt-in de la surface de commande sur canal live vérifie `/crestodian status` plus un
aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:crestodian-rescue-channel
```

L’installation fraîche sans config via Crestodian est couverte par :

```bash
pnpm test:docker:crestodian-first-run
```

Cette lane démarre avec un répertoire d’état vide, route `openclaw` nu vers Crestodian,
définit le modèle par défaut, crée un agent supplémentaire, configure Discord via
une activation de Plugin plus un token SecretRef, valide la config et vérifie le journal
d’audit. QA Lab dispose également d’un scénario adossé au dépôt pour le même flux Ring 0 :

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Lié

- [Référence CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Sandbox](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
