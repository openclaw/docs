---
read_when:
    - Un utilisateur signale que des agents restent bloqués en répétant des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques relatives aux outils et à l’environnement d’exécution de l’agent
    - Vous rencontrez des abandons `compaction_loop_persisted` après une nouvelle tentative due à un dépassement de contexte
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-07-12T03:12:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fccbb81281b6c6921e6dad50d15295c1be3f59c664f2caed900bf3dce14bc40a
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dispose de deux garde-fous complémentaires contre les schémas répétitifs d’appels d’outils,
tous deux configurés sous `tools.loopDetection` :

1. **Détection des boucles** (`enabled`) — désactivée par défaut. Surveille l’historique glissant
   des appels d’outils afin de repérer les schémas répétitifs et les nouvelles tentatives d’utilisation d’outils inconnus.
2. **Garde post-Compaction** (`postCompactionGuard`) — activée tant que
   `enabled` n’est pas explicitement défini sur `false`. Elle s’arme après chaque nouvelle tentative suivant une Compaction et
   interrompt l’exécution si l’agent répète le même triplet `(outil, arguments, résultat)`
   dans la fenêtre.

Définissez `tools.loopDetection.enabled: false` pour désactiver les deux garde-fous.

## Pourquoi ce mécanisme existe

- Détecter les séquences répétitives qui ne produisent aucune progression.
- Détecter les boucles à haute fréquence sans résultat (même outil, mêmes entrées, erreurs
  répétées).
- Détecter des schémas spécifiques d’appels répétés pour les outils d’interrogation connus.
- Interrompre les cycles dépassement de contexte -> Compaction -> même boucle au lieu de les laisser
  s’exécuter indéfiniment.

## Bloc de configuration

Valeurs globales par défaut, avec tous les champs documentés :

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // commutateur principal des détecteurs basés sur l’historique glissant
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

Les paramètres propres à chaque agent se superposent champ par champ au bloc global (y compris les objets imbriqués
`detectors` et `postCompactionGuard`). Un agent ne doit donc définir que les
champs qu’il souhaite modifier.

### Comportement des champs

| Champ                            | Valeur par défaut | Effet                                                                                                                                     |
| -------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false`           | Commutateur principal des détecteurs basés sur l’historique glissant. `false` désactive également la garde post-Compaction.               |
| `historySize`                    | `30`              | Nombre d’appels d’outils récents conservés pour l’analyse.                                                                                |
| `warningThreshold`               | `10`              | Nombre de répétitions à partir duquel un schéma est classé comme simple avertissement.                                                     |
| `criticalThreshold`              | `20`              | Nombre de répétitions entraînant le blocage d’un schéma de boucle sans progression. À l’exécution, cette valeur est ramenée au-dessus de `warningThreshold` en cas de mauvaise configuration. |
| `unknownToolThreshold`           | `10`              | Bloque les appels répétés au même outil indisponible après ce nombre d’échecs. Indépendant de `detectors`.                                |
| `globalCircuitBreakerThreshold`  | `30`              | Coupe-circuit global sans progression pour tous les détecteurs. À l’exécution, cette valeur est ramenée au-dessus de `criticalThreshold` en cas de mauvaise configuration. Indépendant de `detectors`. |
| `detectors.genericRepeat`        | `true`            | Avertit en cas d’appels répétés au même outil avec les mêmes arguments, puis bloque dès que ces appels renvoient également des résultats identiques. |
| `detectors.knownPollNoProgress`  | `true`            | Détecte les schémas d’interrogation connus sans progression (`process` avec `action: "poll"`/`"log"`, `command_status`).                  |
| `detectors.pingPong`             | `true`            | Détecte les schémas alternés de va-et-vient sans progression entre deux appels.                                                           |
| `postCompactionGuard.windowSize` | `3`               | Nombre de tentatives pendant lesquelles la garde reste armée après une Compaction, ainsi que nombre de triplets identiques entraînant l’interruption de l’exécution. |

Pour `exec`, le hachage de l’absence de progression compare les résultats stables des commandes (état,
code de sortie, indicateur d’expiration du délai, sortie) et ignore les métadonnées d’exécution volatiles telles
que la durée, le PID, l’identifiant de session et le répertoire de travail. Les résultats d’envoi de messages
sortants sont hachés après suppression des identifiants volatils propres à chaque appel (identifiant du message, identifiant du fichier, horodatage),
afin qu’un résultat « envoyé » ne paraisse pas identique à un autre résultat « envoyé ».
Lorsqu’un identifiant d’exécution est disponible, l’historique n’est évalué qu’au sein de cette exécution ;
les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent donc pas des anciens nombres de boucles
issus d’exécutions antérieures.

## Configuration recommandée

- Pour les modèles plus petits, définissez `enabled: true` et conservez les seuils
  par défaut. Les modèles de pointe ont rarement besoin de la détection basée sur l’historique glissant et peuvent
  conserver le commutateur principal sur `false` tout en bénéficiant de la
  garde post-Compaction.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold <
globalCircuitBreakerThreshold` ; à l’exécution, `criticalThreshold` et
  `globalCircuitBreakerThreshold` sont augmentés si vous les définissez à une valeur inférieure ou égale au
  seuil qu’ils doivent dépasser.
- En cas de faux positifs :
  - Augmentez `warningThreshold` et/ou `criticalThreshold`.
  - Augmentez éventuellement `globalCircuitBreakerThreshold`.
  - Désactivez uniquement le détecteur précis à l’origine des problèmes (`detectors.<name>: false`).
  - Réduisez `historySize` pour raccourcir la fenêtre historique.
- Pour tout désactiver, y compris la garde post-Compaction, définissez explicitement
  `tools.loopDetection.enabled: false`.

## Garde post-Compaction

Après une nouvelle tentative suivant une Compaction provoquée par un dépassement de contexte, l’exécuteur arme une
garde à fenêtre courte pour les quelques appels d’outils suivants. Si l’agent émet le même
triplet `(toolName, argsHash, resultHash)` `postCompactionGuard.windowSize`
fois dans cette fenêtre, la garde conclut que la Compaction n’a pas interrompu la
boucle et interrompt l’exécution avec une erreur `compaction_loop_persisted`.

La garde dépend du drapeau principal `tools.loopDetection.enabled`, avec une
particularité : elle reste **activée lorsque le drapeau n’est pas défini ou vaut `true`**, et ne se
désactive que lorsque le drapeau vaut explicitement `false`. Ce comportement est intentionnel : la garde
sert à échapper aux boucles de Compaction qui consommeraient autrement un nombre illimité de jetons.
Ainsi, même un utilisateur sans configuration bénéficie de cette protection.

```json5
{
  tools: {
    loopDetection: {
      // commutateur principal ; définissez-le sur false pour désactiver la garde avec les détecteurs basés sur l’historique glissant
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
- Elle ne s’arme que juste après une nouvelle tentative suivant une Compaction, et non à d’autres
  moments de l’exécution.

<Note>
  La garde post-Compaction s’exécute dès lors que le drapeau principal n’est pas explicitement défini sur `false`, même si vous n’avez jamais écrit de bloc `tools.loopDetection`. Pour le vérifier, recherchez `post-compaction guard armed for N attempts` dans le journal du Gateway immédiatement après un événement de Compaction.
</Note>

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw consigne un événement de boucle et émet un avertissement ou bloque
le cycle d’outil suivant selon sa gravité, afin d’éviter une consommation incontrôlée de jetons
et les blocages tout en préservant l’accès normal aux outils.

- Les avertissements surviennent en premier.
- Le blocage intervient lorsqu’un schéma persiste au-delà du seuil d’avertissement.
- Les seuils critiques bloquent le cycle d’outil suivant et indiquent clairement
  la raison de la détection de boucle dans l’enregistrement de l’exécution.
- La garde post-Compaction émet des erreurs `compaction_loop_persisted` qui indiquent
  l’outil en cause et le nombre d’appels identiques.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation et de refus pour l’exécution de commandes shell.
  </Card>
  <Card title="Niveaux de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec la politique du fournisseur.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Création d’agents isolés pour limiter les comportements incontrôlés.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-tools#toolsloopdetection" icon="gear">
    Schéma complet de `tools.loopDetection` et sémantique de fusion.
  </Card>
</CardGroup>
