---
read_when:
    - Vous acheminez les discussions de groupe vers des agents dédiés
    - Vous voulez travailler en parallèle sans qu’une longue tâche unique bloque chaque conversation
    - Vous concevez une configuration opérationnelle multi-agent
sidebarTitle: Specialist lanes
status: active
summary: Exécuter des agents spécialisés en parallèle sans saturer la capacité partagée des modèles et des outils
title: Voies spécialisées parallèles
x-i18n:
    generated_at: "2026-05-02T20:44:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Les voies spécialisées parallèles permettent à un même Gateway d’acheminer différents chats ou salons vers
différents agents, tout en gardant une expérience utilisateur rapide. L’astuce consiste à traiter
le parallélisme comme un problème de conception autour de ressources rares, et pas seulement comme « plus d’agents ».

## Premiers principes

Une voie spécialisée n’améliore le débit que lorsqu’elle réduit la contention sur les
vrais goulots d’étranglement :

- **Verrous de session** : une seule exécution doit modifier une session donnée à la fois.
- **Capacité globale des modèles** : toutes les exécutions de chat visibles partagent toujours les limites des fournisseurs.
- **Capacité des outils** : le shell, le navigateur, le réseau et le travail sur le dépôt peuvent être plus lents
  que le tour de modèle lui-même.
- **Budget de contexte** : les longs transcrits ralentissent chaque tour futur et le rendent moins
  ciblé.
- **Ambiguïté de propriété** : des agents en double qui font le même travail gaspillent de la capacité.

OpenClaw sérialise déjà les exécutions par session et plafonne le parallélisme global via
la [file d’attente de commandes](/fr/concepts/queue). Les voies spécialisées ajoutent une politique par-dessus :
quel agent possède quel travail, ce qui reste dans le chat, et ce qui devient du travail
en arrière-plan.

## Déploiement recommandé

### Phase 1 : contrats de voie + travail lourd en arrière-plan

Donnez à chaque voie un contrat écrit dans son espace de travail et son prompt système :

- **Objectif** : le travail dont cette voie est responsable.
- **Non-objectifs** : le travail qu’elle doit transférer au lieu de tenter elle-même.
- **Budget de chat** : les réponses rapides restent dans le chat ; les longues tâches doivent accuser réception
  brièvement, puis s’exécuter dans un sous-agent ou une tâche en arrière-plan.
- **Règle de transfert** : lorsqu’une autre voie possède le travail, dites où il doit aller et
  fournissez un résumé de transfert compact.
- **Règle de risque d’outil** : préférez le plus petit périmètre d’outils capable de faire le travail.

C’est la phase la moins coûteuse et elle corrige la plupart des engorgements : un travail de codage ne transforme plus
la voie de recherche en mélasse, et chaque chat garde son propre contexte propre.

### Phase 2 : contrôles de priorité et de concurrence

Ajustez la file d’attente et la capacité des modèles selon la valeur métier de chaque voie :

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Utilisez les chats directs/personnels et les agents d’exploitation de production pour les travaux à haute priorité. Laissez
la recherche, la rédaction et le codage par lots passer aux tâches en arrière-plan lorsque le système est
occupé.

### Phase 3 : coordinateur / contrôleur de trafic

Ajoutez un petit motif de coordinateur lorsque plusieurs voies sont actives :

- Suivre les tâches de voie actives et leurs propriétaires.
- Détecter les demandes en double entre groupes.
- Acheminer les résumés de transfert entre voies.
- Faire remonter uniquement les blocages, les résultats terminés et les décisions que l’humain doit prendre.

Ne commencez pas par là. Un coordinateur sans contrats de voie ne fait que coordonner le chaos.

## Modèle minimal de contrat de voie

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Connexe

- [Routage multi-agent](/fr/concepts/multi-agent)
- [File d’attente de commandes](/fr/concepts/queue)
- [Sous-agents](/fr/tools/subagents)
