---
read_when:
    - Vous exécutez openclaw sans commande et souhaitez comprendre Crestodian
    - Vous avez besoin d’une méthode sûre sans configuration pour inspecter ou réparer OpenClaw
    - Vous concevez ou activez le mode de secours du canal de messages
summary: Référence CLI et modèle de sécurité pour Crestodian, l’assistant d’installation et de réparation sécurisé sans configuration
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T07:17:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian est l’assistant local de configuration, de réparation et de paramétrage d’OpenClaw. Il est
conçu pour rester joignable lorsque le chemin d’agent normal est interrompu.

Exécuter `openclaw` sans commande démarre Crestodian dans un terminal interactif.
Exécuter `openclaw crestodian` démarre explicitement le même assistant.

## Ce que Crestodian affiche

Au démarrage, Crestodian interactif ouvre le même shell TUI que celui utilisé par
`openclaw tui`, avec un backend de chat Crestodian. Le journal de chat commence par un bref
message d’accueil :

- quand démarrer Crestodian
- le modèle ou le chemin de planificateur déterministe que Crestodian utilise réellement
- la validité de la configuration et l’agent par défaut
- l’accessibilité du Gateway depuis la première sonde de démarrage
- la prochaine action de débogage que Crestodian peut effectuer

Il ne déverse pas de secrets et ne charge pas les commandes CLI de plugin seulement pour démarrer. La TUI
fournit toujours l’en-tête normal, le journal de chat, la ligne d’état, le pied de page, l’autocomplétion
et les contrôles de l’éditeur.

Utilisez `status` pour obtenir l’inventaire détaillé avec le chemin de configuration, les chemins de docs/source,
les sondes CLI locales, la présence des clés API, les agents, le modèle et les détails du Gateway.

Crestodian utilise la même découverte de références OpenClaw que les agents ordinaires. Dans un checkout Git,
il pointe vers les `docs/` locales et l’arborescence source locale. Dans une installation de paquet npm, il
utilise la documentation empaquetée et renvoie vers
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), avec des consignes explicites
pour consulter le source chaque fois que la documentation ne suffit pas.

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

Dans la TUI de Crestodian :

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

## Démarrage sûr

Le chemin de démarrage de Crestodian est volontairement réduit. Il peut s’exécuter lorsque :

- `openclaw.json` est absent
- `openclaw.json` est invalide
- le Gateway est arrêté
- l’enregistrement des commandes de plugin est indisponible
- aucun agent n’a encore été configuré

`openclaw --help` et `openclaw --version` utilisent toujours les chemins rapides normaux.
`openclaw` non interactif se termine avec un court message au lieu d’imprimer l’aide racine,
car le produit sans commande est Crestodian.

## Opérations et approbation

Crestodian utilise des opérations typées au lieu de modifier la configuration de façon ad hoc.

Les opérations en lecture seule peuvent s’exécuter immédiatement :

- afficher la vue d’ensemble
- lister les agents
- afficher l’état du modèle/backend
- exécuter des vérifications d’état ou de santé
- vérifier l’accessibilité du Gateway
- exécuter doctor sans correctifs interactifs
- valider la configuration
- afficher le chemin du journal d’audit

Les opérations persistantes exigent une approbation conversationnelle en mode interactif, sauf si
vous passez `--yes` pour une commande directe :

- écrire la configuration
- exécuter `config set`
- définir les valeurs SecretRef prises en charge via `config set-ref`
- exécuter le bootstrap de configuration/onboarding
- changer le modèle par défaut
- démarrer, arrêter ou redémarrer le Gateway
- créer des agents
- exécuter les réparations doctor qui réécrivent la configuration ou l’état

Les écritures appliquées sont enregistrées dans :

```text
~/.openclaw/audit/crestodian.jsonl
```

La découverte n’est pas auditée. Seules les opérations appliquées et les écritures sont consignées.

`openclaw onboard --modern` démarre Crestodian comme aperçu de l’onboarding moderne.
`openclaw onboard` seul exécute toujours l’onboarding classique.

## Bootstrap de configuration

`setup` est le bootstrap d’onboarding axé sur le chat. Il écrit uniquement via des opérations de
configuration typées et demande d’abord l’approbation.

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
- CLI Claude Code -> `claude-cli/claude-opus-4-7`
- CLI Codex -> `codex-cli/gpt-5.5`

Si aucun n’est disponible, setup écrit tout de même l’espace de travail par défaut et laisse le
modèle non défini. Installez Codex/Claude Code ou connectez-vous-y, ou exposez
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, puis relancez setup.

## Planificateur assisté par modèle

Crestodian démarre toujours en mode déterministe. Pour les commandes approximatives que le
parseur déterministe ne comprend pas, Crestodian local peut effectuer un tour de planificateur borné
via les chemins d’exécution normaux d’OpenClaw. Il utilise d’abord le modèle OpenClaw configuré.
Si aucun modèle configuré n’est encore utilisable, il peut se rabattre sur les runtimes locaux
déjà présents sur la machine :

- CLI Claude Code : `claude-cli/claude-opus-4-7`
- Harnais app-server Codex : `openai/gpt-5.5` avec `agentRuntime.id: "codex"`
- CLI Codex : `codex-cli/gpt-5.5`

Le planificateur assisté par modèle ne peut pas modifier directement la configuration. Il doit traduire la
demande en l’une des commandes typées de Crestodian, puis les règles normales d’approbation et
d’audit s’appliquent. Crestodian imprime le modèle utilisé et la commande interprétée avant
d’exécuter quoi que ce soit. Les tours de planificateur de secours sans configuration sont
temporaires, sans outils lorsque le runtime le permet, et utilisent un espace de travail/une session
temporaire.

Le mode de secours par canal de messages n’utilise pas le planificateur assisté par modèle. Le
secours à distance reste déterministe afin qu’un chemin d’agent normal cassé ou compromis ne
puisse pas servir d’éditeur de configuration.

## Basculer vers un agent

Utilisez un sélecteur en langage naturel pour quitter Crestodian et ouvrir la TUI normale :

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` et `openclaw terminal` ouvrent toujours directement la TUI
d’agent normale. Ils ne démarrent pas Crestodian.

Après avoir basculé dans la TUI normale, utilisez `/crestodian` pour revenir à Crestodian.
Vous pouvez inclure une demande de suivi :

```text
/crestodian
/crestodian restart gateway
```

Les bascules d’agent dans la TUI laissent un fil d’Ariane indiquant que `/crestodian` est disponible.

## Mode de secours par message

Le mode de secours par message est le point d’entrée de canal de messages pour Crestodian. Il sert
dans le cas où votre agent normal est mort, mais où un canal de confiance tel que WhatsApp
reçoit toujours les commandes.

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

Le mode de secours à distance est une surface d’administration. Il doit être traité comme une
réparation de configuration à distance, et non comme un chat normal.

Contrat de sécurité pour le secours à distance :

- Désactivé lorsque le sandboxing est actif. Si un agent/une session est sandboxé,
  Crestodian doit refuser le secours à distance et expliquer qu’une réparation CLI locale est
  requise.
- L’état effectif par défaut est `auto` : autoriser le secours à distance uniquement en opération YOLO
  de confiance, où le runtime dispose déjà d’une autorité locale non sandboxée.
- Exiger une identité de propriétaire explicite. Le secours ne doit pas accepter de règles d’expéditeur
  génériques, de politique de groupe ouverte, de webhooks non authentifiés ou de canaux anonymes.
- DM de propriétaires uniquement par défaut. Le secours en groupe/canal exige une adhésion explicite.
- Le secours à distance ne peut pas ouvrir la TUI locale ni basculer dans une session d’agent
  interactive. Utilisez `openclaw` local pour le passage à un agent.
- Les écritures persistantes exigent toujours une approbation, même en mode secours.
- Auditer chaque opération de secours appliquée. Le secours par canal de messages enregistre les métadonnées
  de canal, de compte, d’expéditeur et d’adresse source. Les opérations qui modifient la configuration
  enregistrent également les hachages de configuration avant et après.
- Ne jamais renvoyer les secrets. L’inspection de SecretRef doit signaler la disponibilité, pas les
  valeurs.
- Si le Gateway est vivant, préférer les opérations typées du Gateway. Si le Gateway est
  mort, utiliser uniquement la surface minimale de réparation locale qui ne dépend pas de la
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

- `"auto"` : par défaut. Autoriser uniquement lorsque le runtime effectif est YOLO et que
  le sandboxing est désactivé.
- `false` : ne jamais autoriser le secours par canal de messages.
- `true` : autoriser explicitement le secours lorsque les vérifications propriétaire/canal réussissent. Cela
  ne doit toujours pas contourner le refus lié au sandboxing.

La posture YOLO `"auto"` par défaut est :

- le mode sandbox se résout en `off`
- `tools.exec.security` se résout en `full`
- `tools.exec.ask` se résout en `off`

Le secours à distance est couvert par la voie Docker :

```bash
pnpm test:docker:crestodian-rescue
```

Le secours local du planificateur sans configuration est couvert par :

```bash
pnpm test:docker:crestodian-planner
```

Une smoke de surface de commande de canal live avec adhésion vérifie `/crestodian status` plus un
aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuration fraîche sans configuration via Crestodian est couverte par :

```bash
pnpm test:docker:crestodian-first-run
```

Cette voie démarre avec un répertoire d’état vide, route `openclaw` nu vers Crestodian,
définit le modèle par défaut, crée un agent supplémentaire, configure Discord via
l’activation d’un plugin plus un token SecretRef, valide la configuration et vérifie le journal
d’audit. QA Lab dispose également d’un scénario appuyé sur le dépôt pour le même flux Ring 0 :

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Associés

- [Référence CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Sandbox](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
