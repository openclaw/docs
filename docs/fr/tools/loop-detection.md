---
read_when:
    - Un utilisateur signale que les agents restent bloqués en répétant des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs.
    - Vous modifiez les politiques relatives aux outils et à l’environnement d’exécution de l’agent
    - Vous rencontrez des interruptions `compaction_loop_persisted` après une nouvelle tentative due à un dépassement de contexte
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-07-12T15:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dispose de deux garde-fous coopérants contre les motifs répétitifs d’appels d’outils,
tous deux configurés sous `tools.loopDetection` :

1. **Détection des boucles** (`enabled`) - désactivée par défaut. Surveille l’historique
   glissant des appels d’outils afin de détecter les motifs répétés et les nouvelles tentatives avec des outils inconnus.
2. **Garde post-Compaction** (`postCompactionGuard`) - activée dès lors que
   `enabled` n’est pas explicitement défini sur `false`. Elle s’arme après chaque nouvelle tentative suivant une Compaction et
   interrompt l’exécution si l’agent répète le même triplet `(tool, args, result)`
   dans la fenêtre.

Définissez `tools.loopDetection.enabled: false` pour désactiver les deux garde-fous.

## Pourquoi ce mécanisme existe

- Détecter les séquences répétitives qui ne progressent pas.
- Détecter les boucles à haute fréquence sans résultat (même outil, mêmes entrées,
  erreurs répétées).
- Détecter des motifs spécifiques d’appels répétés pour les outils d’interrogation connus.
- Rompre les cycles dépassement de contexte -> Compaction -> même boucle au lieu de les laisser
  s’exécuter indéfiniment.

## Bloc de configuration

Valeurs globales par défaut, avec tous les champs documentés :

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // commutateur principal des détecteurs fondés sur l’historique glissant
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armé après une nouvelle tentative suivant une Compaction ; s’exécute sauf si enabled vaut explicitement false
      },
    },
  },
}
```

Remplacement par agent (facultatif, dans `agents.list[].tools.loopDetection`) :

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

Les paramètres par agent se superposent champ par champ au bloc global (y compris les objets imbriqués
`detectors` et `postCompactionGuard`). Un agent doit donc uniquement définir les
champs qu’il souhaite modifier.

### Comportement des champs

| Champ                            | Valeur par défaut | Effet                                                                                                                                     |
| -------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`           | Commutateur principal des détecteurs fondés sur l’historique glissant. `false` désactive également la garde post-Compaction.              |
| `historySize`                    | `30`              | Nombre d’appels d’outils récents conservés pour analyse.                                                                                   |
| `warningThreshold`               | `10`              | Nombre de répétitions avant qu’un motif soit classé comme simple avertissement.                                                            |
| `criticalThreshold`              | `20`              | Nombre de répétitions entraînant le blocage d’un motif de boucle sans progression. Le runtime force cette valeur au-dessus de `warningThreshold` si elle est mal configurée. |
| `unknownToolThreshold`           | `10`              | Bloque les appels répétés au même outil indisponible après ce nombre d’échecs. Ne dépend pas de `detectors`.                               |
| `globalCircuitBreakerThreshold`  | `30`              | Coupe-circuit global en cas d’absence de progression sur l’ensemble des détecteurs. Le runtime force cette valeur au-dessus de `criticalThreshold` si elle est mal configurée. Ne dépend pas de `detectors`. |
| `detectors.genericRepeat`        | `true`            | Avertit lors d’appels répétés avec le même outil et les mêmes arguments ; bloque lorsque ces appels renvoient également des résultats identiques. |
| `detectors.knownPollNoProgress`  | `true`            | Détecte les motifs connus d’interrogation sans progression (`process` avec `action: "poll"`/`"log"`, `command_status`).                    |
| `detectors.pingPong`             | `true`            | Détecte les motifs alternés de ping-pong sans progression entre deux appels.                                                               |
| `postCompactionGuard.windowSize` | `3`               | Nombre de tentatives pendant lesquelles la garde reste armée après une Compaction, ainsi que nombre de triplets identiques entraînant l’interruption de l’exécution. |

Pour `exec`, le hachage d’absence de progression compare les résultats stables des commandes (état,
code de sortie, indicateur d’expiration du délai, sortie) et ignore les métadonnées volatiles du runtime telles
que la durée, le PID, l’identifiant de session et le répertoire de travail. Les résultats d’envoi de messages
sortants sont hachés après suppression des identifiants volatils propres à chaque appel (identifiant du message, identifiant du fichier, horodatage),
afin qu’un résultat « envoyé » ne paraisse pas identique à un autre résultat « envoyé ».
Lorsqu’un identifiant d’exécution est disponible, l’historique est évalué uniquement au sein de cette exécution ;
les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent donc pas des nombres de boucles obsolètes
issus d’exécutions précédentes.

## Configuration recommandée

- Pour les modèles plus petits, définissez `enabled: true` et conservez les seuils à leurs
  valeurs par défaut. Les modèles phares ont rarement besoin de la détection fondée sur l’historique glissant et peuvent
  laisser le commutateur principal sur `false` tout en bénéficiant de la
  garde post-Compaction.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold` ; le runtime augmente `criticalThreshold` et
  `globalCircuitBreakerThreshold` si vous les définissez à une valeur inférieure ou égale au
  seuil qu’ils doivent dépasser.
- En cas de faux positifs :
  - Augmentez `warningThreshold` et/ou `criticalThreshold`.
  - Augmentez éventuellement `globalCircuitBreakerThreshold`.
  - Désactivez uniquement le détecteur spécifique à l’origine des problèmes (`detectors.<name>: false`).
  - Réduisez `historySize` afin de raccourcir la fenêtre historique.
- Pour tout désactiver, y compris la garde post-Compaction, définissez explicitement
  `tools.loopDetection.enabled: false`.

## Garde post-Compaction

Après une nouvelle tentative suivant une Compaction consécutive à un dépassement de contexte, le processus d’exécution arme une
garde à fenêtre courte pour les quelques appels d’outils suivants. Si l’agent émet le même
triplet `(toolName, argsHash, resultHash)` `postCompactionGuard.windowSize`
fois dans cette fenêtre, la garde conclut que la Compaction n’a pas rompu la
boucle et interrompt l’exécution avec une erreur `compaction_loop_persisted`.

La garde est contrôlée par l’indicateur principal `tools.loopDetection.enabled`, avec une
particularité : elle reste **activée lorsque l’indicateur n’est pas défini ou vaut `true`**, et ne se
désactive que lorsque l’indicateur vaut explicitement `false`. Ce comportement est intentionnel : la garde
sert à sortir des boucles de Compaction qui consommeraient autrement une quantité illimitée de jetons ;
un utilisateur sans configuration bénéficie donc tout de même de cette protection.

```json5
{
  tools: {
    loopDetection: {
      // commutateur principal ; définissez-le sur false pour désactiver la garde ainsi que les détecteurs fondés sur l’historique glissant
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // valeur par défaut
      },
    },
  },
}
```

- Une valeur `windowSize` plus faible est plus stricte (moins de tentatives avant l’interruption).
- Une valeur `windowSize` plus élevée accorde davantage de tentatives de récupération à l’agent.
- La garde n’interrompt jamais l’exécution tant que les résultats changent ; seuls des résultats identiques
  octet par octet dans toute la fenêtre la déclenchent.
- Elle ne s’arme qu’immédiatement après une nouvelle tentative suivant une Compaction, et non à d’autres
  moments de l’exécution.

<Note>
  La garde post-Compaction s’exécute dès lors que l’indicateur principal ne vaut pas explicitement `false`, même si vous n’avez jamais écrit de bloc `tools.loopDetection`. Pour le vérifier, recherchez `post-compaction guard armed for N attempts` dans le journal du Gateway immédiatement après un événement de Compaction.
</Note>

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw consigne un événement de boucle et émet un avertissement ou bloque
le cycle d’outil suivant selon la gravité, ce qui protège contre la consommation incontrôlée de jetons
et les blocages tout en préservant l’accès normal aux outils.

- Les avertissements sont émis en premier.
- Le blocage intervient lorsqu’un motif persiste au-delà du seuil d’avertissement.
- Les seuils critiques bloquent le cycle d’outil suivant et indiquent clairement
  le motif de détection de boucle dans l’enregistrement de l’exécution.
- La garde post-Compaction émet des erreurs `compaction_loop_persisted` qui indiquent
  l’outil concerné et le nombre d’appels identiques.

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation et de refus pour l’exécution de commandes shell.
  </Card>
  <Card title="Niveaux de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec la politique du fournisseur.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Création d’agents isolés afin de limiter les comportements incontrôlés.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-tools#toolsloopdetection" icon="gear">
    Schéma complet de `tools.loopDetection` et sémantique de fusion.
  </Card>
</CardGroup>
