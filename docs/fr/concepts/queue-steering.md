---
read_when:
    - Expliquer le comportement du guidage lorsqu’un agent utilise des outils
    - Modifier le comportement de la file d’attente d’exécutions actives ou l’intégration du pilotage d’exécution
    - Comparaison des modes steer, queue, collect et followup
summary: Comment le pilotage des exécutions actives met les messages en file d’attente aux limites d’exécution
title: File de pilotage
x-i18n:
    generated_at: "2026-05-04T02:23:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Lorsqu’un message arrive alors qu’une exécution de session est déjà en streaming, OpenClaw peut
envoyer ce message dans le runtime actif au lieu de démarrer une autre exécution pour
la même session. Les modes publics sont neutres vis-à-vis du runtime ; Pi et le harnais
app-server Codex natif implémentent les détails de livraison différemment.

## Limite du runtime

Le pilotage n’interrompt pas un appel d’outil déjà en cours d’exécution. Pi vérifie les
messages de pilotage en attente aux limites du modèle :

1. L’assistant demande des appels d’outils.
2. Pi exécute le lot d’appels d’outils du message assistant courant.
3. Pi émet l’événement de fin de tour.
4. Pi vide les messages de pilotage en attente.
5. Pi ajoute ces messages comme messages utilisateur avant le prochain appel LLM.

Cela garde les résultats d’outil associés au message assistant qui les a demandés,
puis permet au prochain appel au modèle de voir la dernière saisie utilisateur.

Le harnais app-server Codex natif expose `turn/steer` au lieu de la file de pilotage
interne de Pi. OpenClaw y adapte les mêmes modes :

- `steer` regroupe les messages en attente pendant la fenêtre de silence configurée, puis envoie une
  seule requête `turn/steer` avec toutes les saisies utilisateur collectées dans l’ordre d’arrivée.
- `queue` conserve la forme sérialisée héritée en envoyant des requêtes `turn/steer`
  séparées.
- `followup`, `collect`, `steer-backlog` et `interrupt` restent un comportement de
  file d’attente géré par OpenClaw autour du tour Codex actif.

Les tours de revue Codex et de compaction manuelle refusent le pilotage dans le même tour. Lorsqu’un
runtime ne peut pas accepter le pilotage, OpenClaw revient à la file de suivi lorsque
ce mode l’autorise.

Cette page explique le pilotage en mode file d’attente pour les messages entrants normaux. Pour la
commande explicite `/steer <message>`, consultez [Pilotage](/fr/tools/steer).

## Modes

| Mode            | Comportement pendant l’exécution active                                                                                      | Comportement de suivi ultérieur                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Injecte tous les messages de pilotage en attente ensemble à la prochaine limite du runtime. C’est le comportement par défaut. | Revient au suivi uniquement lorsque le pilotage est indisponible.                   |
| `queue`         | Pilotage hérité, un message à la fois. Pi injecte un message en attente par limite de modèle ; Codex envoie des requêtes `turn/steer` séparées. | Revient au suivi uniquement lorsque le pilotage est indisponible.                   |
| `steer-backlog` | Même comportement de pilotage pendant l’exécution active que `steer`.                                                        | Conserve aussi le même message pour un tour de suivi ultérieur.                     |
| `followup`      | Ne pilote pas l’exécution courante.                                                                                          | Exécute les messages en attente plus tard.                                          |
| `collect`       | Ne pilote pas l’exécution courante.                                                                                          | Fusionne les messages en attente compatibles en un tour ultérieur après la fenêtre de debounce. |
| `interrupt`     | Abandonne l’exécution active, puis démarre le message le plus récent.                                                        | Aucun.                                                                              |

## Exemple de rafale

Si quatre utilisateurs envoient des messages pendant que l’agent exécute un appel d’outil :

- `steer` : le runtime actif reçoit les quatre messages dans l’ordre d’arrivée avant
  sa prochaine décision de modèle. Pi les vide à la prochaine limite du modèle ; Codex
  les reçoit comme un seul `turn/steer` groupé.
- `queue` : pilotage sérialisé hérité. Pi injecte un message en attente à la fois ;
  Codex reçoit des requêtes `turn/steer` séparées.
- `collect` : OpenClaw attend la fin de l’exécution active, puis crée un tour de suivi
  avec les messages en attente compatibles après la fenêtre de debounce.

## Portée

Le pilotage cible toujours l’exécution de session active courante. Il ne crée pas de nouvelle
session, ne modifie pas la politique d’outils de l’exécution active et ne répartit pas les messages par expéditeur. Dans
les canaux multi-utilisateurs, les prompts entrants incluent déjà le contexte d’expéditeur et de routage, de sorte que
le prochain appel au modèle peut voir qui a envoyé chaque message.

Utilisez `collect` lorsque vous voulez qu’OpenClaw construise un tour de suivi ultérieur pouvant
fusionner les messages compatibles et préserver la politique d’abandon de la file de suivi. Utilisez
`queue` uniquement lorsque vous avez besoin de l’ancien comportement de pilotage un message à la fois.

## Debounce

`messages.queue.debounceMs` s’applique à la livraison de suivi, y compris `collect`,
`followup`, `steer-backlog` et le repli de `steer` lorsque le pilotage pendant l’exécution active n’est pas
disponible. Pour Pi, `steer` actif lui-même n’utilise pas le minuteur de debounce, car
Pi regroupe naturellement les messages jusqu’à la prochaine limite du modèle. Pour le harnais
Codex natif, OpenClaw utilise la même valeur de debounce comme fenêtre de silence avant
d’envoyer le `turn/steer` groupé.

## Associés

- [File d’attente des commandes](/fr/concepts/queue)
- [Pilotage](/fr/tools/steer)
- [Messages](/fr/concepts/messages)
- [Boucle d’agent](/fr/concepts/agent-loop)
