---
read_when:
    - Vous exécutez openclaw sans commande et souhaitez comprendre Crestodian
    - Vous avez besoin d’un moyen sûr sans configuration pour inspecter ou réparer OpenClaw
    - Vous concevez ou activez le mode de secours des canaux de messagerie
summary: Référence CLI et modèle de sécurité pour Crestodian, l’assistant de configuration, de réparation et de mise en sécurité sans configuration dangereuse
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian est l’assistant local de configuration, de réparation et de mise en place d’OpenClaw. Il
est conçu pour rester accessible lorsque le chemin normal de l’agent est défaillant.

Exécuter `openclaw` sans commande démarre Crestodian dans un terminal interactif.
Exécuter `openclaw crestodian` démarre explicitement le même assistant.

## Ce que Crestodian affiche

Au démarrage, Crestodian interactif ouvre le même shell TUI que celui utilisé par
`openclaw tui`, avec un backend de discussion Crestodian. Le journal de discussion commence par un court
message d’accueil :

- quand démarrer Crestodian
- le modèle ou le chemin du planificateur déterministe que Crestodian utilise réellement
- la validité de la configuration et l’agent par défaut
- l’accessibilité de Gateway issue de la première sonde de démarrage
- la prochaine action de débogage que Crestodian peut entreprendre

Il n’affiche pas les secrets et ne charge pas les commandes CLI des Plugins juste pour démarrer. Le TUI
fournit toujours l’en-tête, le journal de discussion, la ligne d’état, le pied de page, l’autocomplétion
et les contrôles de l’éditeur habituels.

Utilisez `status` pour obtenir l’inventaire détaillé avec le chemin de configuration, les chemins docs/source,
les sondes CLI locales, la présence de clés API, les agents, le modèle et les détails de Gateway.

Crestodian utilise la même découverte de références OpenClaw que les agents classiques. Dans une extraction Git,
il se pointe vers `docs/` local et l’arborescence source locale. Dans une installation de package npm, il
utilise la documentation fournie avec le package et crée des liens vers
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), avec une
indication explicite de consulter le code source lorsque la documentation ne suffit pas.

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

À l’intérieur du TUI Crestodian :

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

Le chemin de démarrage de Crestodian est volontairement minimal. Il peut fonctionner lorsque :

- `openclaw.json` est absent
- `openclaw.json` n’est pas valide
- Gateway est arrêté
- l’enregistrement des commandes de Plugin n’est pas disponible
- aucun agent n’a encore été configuré

`openclaw --help` et `openclaw --version` utilisent toujours les chemins rapides normaux.
`openclaw` non interactif quitte avec un court message au lieu d’afficher l’aide racine,
car le produit sans commande est Crestodian.

## Opérations et approbation

Crestodian utilise des opérations typées au lieu de modifier la configuration de manière ad hoc.

Les opérations en lecture seule peuvent s’exécuter immédiatement :

- afficher la vue d’ensemble
- lister les agents
- afficher l’état du modèle/backend
- exécuter des vérifications `status` ou d’état
- vérifier l’accessibilité de Gateway
- exécuter doctor sans correctifs interactifs
- valider la configuration
- afficher le chemin du journal d’audit

Les opérations persistantes nécessitent une approbation conversationnelle en mode interactif sauf
si vous passez `--yes` pour une commande directe :

- écrire dans la configuration
- exécuter `config set`
- définir les valeurs SecretRef prises en charge via `config set-ref`
- exécuter le bootstrap de configuration/intégration initiale
- changer le modèle par défaut
- démarrer, arrêter ou redémarrer Gateway
- créer des agents
- exécuter des réparations doctor qui réécrivent la configuration ou l’état

Les écritures appliquées sont enregistrées dans :

```text
~/.openclaw/audit/crestodian.jsonl
```

La découverte n’est pas auditée. Seules les opérations appliquées et les écritures sont journalisées.

`openclaw onboard --modern` démarre Crestodian comme aperçu moderne de l’intégration initiale.
`openclaw onboard` simple exécute toujours l’intégration initiale classique.

## Bootstrap de configuration

`setup` est le bootstrap d’intégration initiale orienté discussion. Il n’écrit que via des
opérations de configuration typées et demande d’abord une approbation.

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
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, puis exécutez setup à nouveau.

## Planificateur assisté par modèle

Crestodian démarre toujours en mode déterministe. Pour les commandes approximatives que
l’analyseur déterministe ne comprend pas, Crestodian local peut effectuer un seul tour de
planificateur borné via les chemins d’exécution normaux d’OpenClaw. Il utilise d’abord le
modèle OpenClaw configuré. Si aucun modèle configuré n’est encore utilisable, il peut se
replier sur les exécutions locales déjà présentes sur la machine :

- Claude Code CLI : `claude-cli/claude-opus-4-7`
- harnais app-server Codex : `openai/gpt-5.5` avec `embeddedHarness.runtime: "codex"`
- Codex CLI : `codex-cli/gpt-5.5`

Le planificateur assisté par modèle ne peut pas modifier la configuration directement. Il doit
traduire la requête en l’une des commandes typées de Crestodian, puis les règles normales
d’approbation et d’audit s’appliquent. Crestodian affiche le modèle utilisé et la commande
interprétée avant d’exécuter quoi que ce soit. Les tours du planificateur de repli sans configuration
sont temporaires, avec outils désactivés lorsque l’exécution le prend en charge, et utilisent un
espace de travail/session temporaire.

Le mode de secours des canaux de messagerie n’utilise pas le planificateur assisté par modèle. Le
secours distant reste déterministe afin qu’un chemin d’agent normal défaillant ou compromis ne
puisse pas être utilisé comme éditeur de configuration.

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

Les changements d’agent dans le TUI laissent une trace indiquant que `/crestodian` est disponible.

## Mode de secours des messages

Le mode de secours des messages est le point d’entrée canal de messagerie de Crestodian. Il sert
au cas où votre agent normal est hors service, mais où un canal de confiance comme WhatsApp
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

La création d’agent peut aussi être mise en file d’attente depuis l’invite locale ou le mode de secours :

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Le mode de secours distant est une surface d’administration. Il doit être traité comme une réparation
de configuration distante, et non comme une discussion normale.

Contrat de sécurité pour le secours distant :

- Désactivé lorsque le sandboxing est actif. Si un agent/une session est sandboxé,
  Crestodian doit refuser le secours distant et expliquer qu’une réparation CLI locale est
  nécessaire.
- L’état effectif par défaut est `auto` : autoriser le secours distant uniquement dans une
  opération YOLO de confiance, où l’exécution dispose déjà d’une autorité locale non sandboxée.
- Exiger une identité explicite du propriétaire. Le secours ne doit pas accepter des règles
  d’expéditeur génériques, une politique de groupe ouverte, des Webhooks non authentifiés ou des canaux anonymes.
- Messages privés du propriétaire uniquement par défaut. Le secours en groupe/canal nécessite une
  activation explicite et doit continuer à router les invites d’approbation vers le message privé du propriétaire.
- Le secours distant ne peut pas ouvrir le TUI local ni basculer vers une session d’agent interactive.
  Utilisez `openclaw` local pour le transfert vers un agent.
- Les écritures persistantes nécessitent toujours une approbation, même en mode secours.
- Auditer chaque opération de secours appliquée, y compris le canal, le compte, l’expéditeur,
  la clé de session, l’opération, le hachage de configuration avant et le hachage de configuration après.
- Ne jamais afficher les secrets. L’inspection SecretRef doit signaler la disponibilité, pas les valeurs.
- Si Gateway est actif, préférez les opérations typées Gateway. Si Gateway est arrêté, utilisez
  uniquement la surface minimale de réparation locale qui ne dépend pas de la boucle normale de l’agent.

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

- `"auto"` : valeur par défaut. Autoriser uniquement lorsque l’exécution effective est YOLO et
  que le sandboxing est désactivé.
- `false` : ne jamais autoriser le secours via canal de messagerie.
- `true` : autoriser explicitement le secours lorsque les vérifications propriétaire/canal réussissent. Cela
  ne doit toujours pas contourner le refus du sandboxing.

La posture YOLO par défaut de `"auto"` est :

- le mode sandbox se résout à `off`
- `tools.exec.security` se résout à `full`
- `tools.exec.ask` se résout à `off`

Le secours distant est couvert par la voie Docker :

```bash
pnpm test:docker:crestodian-rescue
```

Le repli du planificateur local sans configuration est couvert par :

```bash
pnpm test:docker:crestodian-planner
```

Une vérification smoke de surface de commande de canal live sur activation contrôle `/crestodian status` ainsi qu’un
aller-retour d’approbation persistante via le gestionnaire de secours :

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuration initiale fraîche sans configuration via Crestodian est couverte par :

```bash
pnpm test:docker:crestodian-first-run
```

Cette voie démarre avec un répertoire d’état vide, route `openclaw` nu vers Crestodian,
définit le modèle par défaut, crée un agent supplémentaire, configure Discord via
une activation de Plugin plus un SecretRef de jeton, valide la configuration et vérifie le journal
d’audit. QA Lab dispose aussi d’un scénario adossé au dépôt pour le même flux Ring 0 :

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Liens associés

- [Référence CLI](/fr/cli)
- [Doctor](/fr/cli/doctor)
- [TUI](/fr/cli/tui)
- [Sandbox](/fr/cli/sandbox)
- [Sécurité](/fr/cli/security)
