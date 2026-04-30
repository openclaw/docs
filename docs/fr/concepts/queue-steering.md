---
read_when:
    - Expliquer le comportement du pilotage pendant qu’un agent utilise des outils
    - Modifier le comportement de la file d’attente des exécutions actives ou l’intégration du pilotage de l’exécution
    - Comparaison des modes steer, queue, collect et followup
summary: Comment le pilotage des exécutions actives met les messages en file d’attente aux limites d’exécution
title: File de pilotage
x-i18n:
    generated_at: "2026-04-30T07:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Lorsqu’un message arrive alors qu’une exécution de session est déjà en streaming, OpenClaw peut
envoyer ce message dans le runtime actif au lieu de démarrer une autre exécution pour
la même session. Les modes publics sont indépendants du runtime ; Pi et le harnais
app-server natif de Codex implémentent les détails de livraison différemment.

## Limite du runtime

Le pilotage n’interrompt pas un appel d’outil déjà en cours. Pi vérifie les
messages de pilotage en file d’attente aux limites du modèle :

1. L’assistant demande des appels d’outils.
2. Pi exécute le lot d’appels d’outils du message d’assistant courant.
3. Pi émet l’événement de fin de tour.
4. Pi vide les messages de pilotage en file d’attente.
5. Pi ajoute ces messages comme messages utilisateur avant le prochain appel LLM.

Cela conserve les résultats d’outils associés au message d’assistant qui les a demandés,
puis permet au prochain appel de modèle de voir la dernière saisie utilisateur.

Le harnais app-server natif de Codex expose `turn/steer` au lieu de la file
de pilotage interne de Pi. OpenClaw adapte les mêmes modes dans ce contexte :

- `steer` regroupe les messages en file d’attente pendant la fenêtre de silence configurée, puis envoie une
  seule requête `turn/steer` avec toutes les saisies utilisateur collectées dans l’ordre d’arrivée.
- `queue` conserve la forme sérialisée historique en envoyant des requêtes `turn/steer`
  séparées.
- `followup`, `collect`, `steer-backlog` et `interrupt` restent des
  comportements de file d’attente gérés par OpenClaw autour du tour Codex actif.

Les tours de revue Codex et de compaction manuelle rejettent le pilotage dans le même tour. Lorsqu’un
runtime ne peut pas accepter le pilotage, OpenClaw revient à la file de suivi lorsque
ce mode l’autorise.

## Modes

| Mode            | Comportement pendant l’exécution active                                                                                      | Comportement de suivi ultérieur                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `steer`         | Injecte tous les messages de pilotage en file d’attente ensemble à la prochaine limite du runtime. C’est le comportement par défaut. | Revient au suivi uniquement lorsque le pilotage est indisponible.                     |
| `queue`         | Pilotage hérité un par un. Pi injecte un message en file d’attente par limite de modèle ; Codex envoie des requêtes `turn/steer` séparées. | Revient au suivi uniquement lorsque le pilotage est indisponible.                     |
| `steer-backlog` | Même comportement de pilotage pendant l’exécution active que `steer`.                                                        | Conserve aussi le même message pour un tour de suivi ultérieur.                       |
| `followup`      | Ne pilote pas l’exécution courante.                                                                                          | Exécute les messages en file d’attente plus tard.                                     |
| `collect`       | Ne pilote pas l’exécution courante.                                                                                          | Fusionne les messages compatibles en file d’attente dans un tour ultérieur après la fenêtre d’anti-rebond. |
| `interrupt`     | Interrompt l’exécution active, puis démarre le message le plus récent.                                                       | Aucun.                                                                                |

## Exemple de rafale

Si quatre utilisateurs envoient des messages pendant que l’agent exécute un appel d’outil :

- `steer` : le runtime actif reçoit les quatre messages dans l’ordre d’arrivée avant
  sa prochaine décision de modèle. Pi les vide à la prochaine limite de modèle ; Codex
  les reçoit comme un seul `turn/steer` groupé.
- `queue` : pilotage sérialisé hérité. Pi injecte un message en file d’attente à la fois ;
  Codex reçoit des requêtes `turn/steer` séparées.
- `collect` : OpenClaw attend la fin de l’exécution active, puis crée un tour de suivi
  avec les messages compatibles en file d’attente après la fenêtre d’anti-rebond.

## Portée

Le pilotage cible toujours l’exécution de session active courante. Il ne crée pas de nouvelle
session, ne modifie pas la politique d’outils de l’exécution active, et ne répartit pas les messages par expéditeur. Dans
les canaux multi-utilisateurs, les prompts entrants incluent déjà le contexte d’expéditeur et de routage, afin que
le prochain appel de modèle puisse voir qui a envoyé chaque message.

Utilisez `collect` lorsque vous voulez qu’OpenClaw construise un tour de suivi ultérieur capable de
fusionner les messages compatibles et de préserver la politique d’abandon de la file de suivi. Utilisez
`queue` uniquement lorsque vous avez besoin de l’ancien comportement de pilotage un par un.

## Anti-rebond

`messages.queue.debounceMs` s’applique à la livraison de suivi, y compris `collect`,
`followup`, `steer-backlog` et le repli de `steer` lorsque le pilotage pendant l’exécution active n’est pas
disponible. Pour Pi, le `steer` actif lui-même n’utilise pas le minuteur d’anti-rebond, car
Pi regroupe naturellement les messages jusqu’à la prochaine limite de modèle. Pour le harnais
Codex natif, OpenClaw utilise la même valeur d’anti-rebond que la fenêtre de silence avant
d’envoyer le `turn/steer` groupé.

## Connexe

- [File de commandes](/fr/concepts/queue)
- [Messages](/fr/concepts/messages)
- [Boucle d’agent](/fr/concepts/agent-loop)
