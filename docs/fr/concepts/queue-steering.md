---
read_when:
    - Explication du comportement du pilotage lorsqu’un agent utilise des outils
    - Modification du comportement de la file d’attente des exécutions actives ou de l’intégration du pilotage à l’exécution
    - Comparaison du pilotage avec les modes de file d’attente followup, collect et interrupt
summary: Comment le pilotage des exécutions actives met les messages en file d’attente aux frontières d’exécution
title: File de pilotage
x-i18n:
    generated_at: "2026-07-12T02:48:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Lorsqu’une invite normale arrive alors que l’exécution d’une session est déjà en cours de diffusion et que le mode de file d’attente est `steer` (mode par défaut, aucune configuration nécessaire), OpenClaw tente d’envoyer cette invite au moteur d’exécution actif. OpenClaw et le harnais natif du serveur d’application Codex implémentent différemment les modalités de transmission.

Cette page décrit le pilotage par mode de file d’attente des messages entrants normaux en mode `steer`. En mode `followup` ou `collect`, les messages normaux ignorent ce chemin et attendent la fin de l’exécution active. Pour la commande explicite `/steer <message>`, consultez [Piloter](/fr/tools/steer).

## Limite du moteur d’exécution

Le pilotage n’interrompt pas un appel d’outil déjà en cours. OpenClaw recherche les messages de pilotage en attente aux limites du modèle :

1. L’assistant demande des appels d’outils.
2. OpenClaw exécute le lot d’appels d’outils du message actuel de l’assistant.
3. OpenClaw émet l’événement de fin de tour.
4. OpenClaw vide la file des messages de pilotage en attente.
5. OpenClaw ajoute ces messages en tant que messages utilisateur avant le prochain appel au LLM.

Cela permet d’associer les résultats des outils au message de l’assistant qui les a demandés, puis de présenter les dernières entrées utilisateur au prochain appel du modèle.

Le harnais natif du serveur d’application Codex expose `turn/steer` au lieu de la file de pilotage interne du moteur d’exécution d’OpenClaw. OpenClaw regroupe les invites en attente pendant la fenêtre de silence configurée, puis envoie une seule requête `turn/steer` contenant toutes les entrées utilisateur collectées dans leur ordre d’arrivée.

Les tours de révision et de compaction manuelle de Codex refusent le pilotage au cours du même tour. Lorsqu’un moteur d’exécution ne peut pas accepter le pilotage en mode `steer`, OpenClaw attend la fin de l’exécution active avant de traiter l’invite.

## Modes

| Mode        | Comportement pendant l’exécution active                                  | Comportement ultérieur                                                                                         |
| ----------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `steer`     | Injecte l’invite dans le moteur d’exécution actif lorsque c’est possible. | Attend la fin de l’exécution active si le pilotage n’est pas disponible.                                       |
| `followup`  | N’effectue aucun pilotage.                                                | Traite ultérieurement les messages en attente après la fin de l’exécution active.                              |
| `collect`   | N’effectue aucun pilotage.                                                | Regroupe les messages en attente compatibles dans un même tour ultérieur après la fenêtre d’anti-rebond.       |
| `interrupt` | Abandonne l’exécution active au lieu de la piloter.                       | Traite le message le plus récent après l’abandon.                                                              |

## Exemple de rafale

Si quatre utilisateurs envoient des messages pendant que l’agent exécute un appel d’outil :

- Avec le comportement par défaut, le moteur d’exécution actif reçoit les quatre messages dans leur ordre d’arrivée avant sa prochaine décision de modèle. OpenClaw les retire de la file à la prochaine limite du modèle ; Codex les reçoit dans une seule requête `turn/steer` groupée.
- Avec `/queue collect`, OpenClaw n’effectue aucun pilotage. Il attend la fin de l’exécution active, puis crée un tour de suivi contenant les messages en attente compatibles après la fenêtre d’anti-rebond.
- Avec `/queue interrupt`, OpenClaw abandonne l’exécution active et traite le message le plus récent au lieu d’effectuer un pilotage.

## Portée

Le pilotage cible toujours l’exécution active de la session actuelle. Il ne crée pas de nouvelle session, ne modifie pas la politique d’utilisation des outils de l’exécution active et ne répartit pas les messages par expéditeur. Dans les canaux multi-utilisateurs, les invites entrantes incluent déjà le contexte de l’expéditeur et de l’acheminement, ce qui permet au prochain appel du modèle d’identifier l’auteur de chaque message.

Utilisez `followup` ou `collect` lorsque vous souhaitez que les messages soient placés en file d’attente par défaut au lieu de piloter l’exécution active. Utilisez `interrupt` lorsque l’invite la plus récente doit remplacer l’exécution active.

## Anti-rebond

`messages.queue.debounceMs` s’applique à la transmission des messages `followup` et `collect` en attente. En mode `steer` avec le harnais natif Codex, ce paramètre définit également la fenêtre de silence précédant l’envoi d’une requête `turn/steer` groupée. Pour OpenClaw, le pilotage actif lui-même n’utilise pas le minuteur d’anti-rebond, car OpenClaw regroupe naturellement les messages jusqu’à la prochaine limite du modèle.

## Voir aussi

- [File d’attente des commandes](/fr/concepts/queue)
- [Piloter](/fr/tools/steer)
- [Messages](/fr/concepts/messages)
- [Boucle de l’agent](/fr/concepts/agent-loop)
