---
read_when:
    - Vous acheminez les discussions de groupe vers des agents dédiés
    - Vous souhaitez exécuter des tâches en parallèle sans qu’une tâche longue ne bloque toutes les conversations
    - Vous concevez une configuration d’exploitation multi-agents
sidebarTitle: Specialist lanes
status: active
summary: Exécutez des agents spécialisés en parallèle sans saturer les capacités partagées du modèle et des outils
title: Voies spécialisées parallèles
x-i18n:
    generated_at: "2026-07-12T02:48:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Les voies spécialisées parallèles permettent à un Gateway d’acheminer différentes conversations ou différents salons vers
différents agents tout en conservant une expérience utilisateur rapide. Considérez le parallélisme comme
un problème de conception lié à des ressources limitées, et non simplement comme « davantage d’agents ».

## Principes fondamentaux

Une voie spécialisée n’améliore le débit que lorsqu’elle réduit la contention sur les
véritables goulots d’étranglement :

- **Verrous de session** : une seule exécution doit modifier une session donnée à la fois.
- **Capacité globale du modèle** : toutes les exécutions de conversation visibles partagent toujours les limites du fournisseur.
- **Capacité des outils** : les opérations dans le shell, le navigateur, le réseau et le dépôt peuvent être plus lentes
  que le tour du modèle lui-même.
- **Budget de contexte** : les longues transcriptions ralentissent chaque tour ultérieur et réduisent
  sa précision.
- **Ambiguïté de responsabilité** : plusieurs agents effectuant la même tâche gaspillent de la capacité.

OpenClaw sérialise déjà les exécutions par session et limite le parallélisme global
au moyen de la [file d’attente des commandes](/fr/concepts/queue). Les voies spécialisées ajoutent une politique
par-dessus : quel agent est responsable de quel travail, ce qui reste dans la conversation et ce qui devient
une tâche en arrière-plan.

## Déploiement recommandé

### Phase 1 : contrats de voie et travaux lourds en arrière-plan

Attribuez à chaque voie un contrat écrit dans son espace de travail et son invite système :

- **Objectif** : le travail dont cette voie est responsable.
- **Non-objectifs** : le travail qu’elle doit transmettre au lieu de tenter de l’effectuer.
- **Budget de conversation** : les réponses rapides restent dans la conversation ; les tâches longues font l’objet d’un bref accusé de réception,
  puis sont exécutées par un sous-agent ou une tâche en arrière-plan.
- **Règle de transfert** : lorsqu’une autre voie est responsable du travail, indiquez où il doit être envoyé et
  fournissez un résumé de transfert concis.
- **Règle relative aux risques des outils** : privilégiez la surface d’outils minimale permettant d’accomplir la tâche.

Il s’agit de la phase la moins coûteuse, qui élimine la plupart des encombrements : une tâche de programmation ne
transforme plus la voie de recherche en mélasse, et chaque conversation conserve son propre contexte
propre.

### Phase 2 : contrôles de priorité et de concurrence

Ajustez la capacité de la file d’attente et du modèle en fonction de la valeur opérationnelle de chaque voie :

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
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

Réservez les conversations directes ou personnelles et les agents d’exploitation en production aux tâches hautement prioritaires. Laissez
les recherches, la rédaction et la programmation par lots passer à des tâches en arrière-plan lorsque le système est
occupé.

### Phase 3 : coordinateur / contrôleur de trafic

Ajoutez un modèle de coordination léger une fois que plusieurs voies sont actives :

- Suivre les tâches et les responsables actifs de chaque voie.
- Détecter les demandes en double entre les groupes.
- Acheminer les résumés de transfert entre les voies.
- Ne présenter que les blocages, les résultats terminés et les décisions que l’utilisateur doit prendre.

Ne commencez pas par cette phase. Un coordinateur sans contrats de voie ne fait que coordonner le chaos.

## Modèle minimal de contrat de voie

```md
# Contrat de voie

## Responsabilités

- <tâche dont cette voie est responsable>

## Hors périmètre

- <travail à transférer>

## Budget de conversation

- Répondre directement aux questions rapides.
- Pour les travaux en plusieurs étapes, lents ou exigeants en outils : en accuser brièvement réception, lancer/exécuter
  le travail en arrière-plan, puis renvoyer le résultat une fois terminé.

## Transfert

Si une autre voie est responsable de la demande, répondre avec :

- voie cible
- objectif
- contexte pertinent
- prochaine action exacte

## Utilisation des outils

Utiliser la surface d’outils minimale permettant d’accomplir la tâche. Éviter les opérations générales dans le shell ou
sur le réseau, sauf si cette voie en est explicitement responsable.
```

## Voir aussi

- [Routage multi-agent](/fr/concepts/multi-agent)
- [File d’attente des commandes](/fr/concepts/queue)
- [Sous-agents](/fr/tools/subagents)
