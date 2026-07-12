---
read_when:
    - Explication du comportement de steer lorsqu’un agent utilise des outils
    - Modification du comportement de la file d’attente des exécutions actives ou de l’intégration du pilotage à l’exécution
    - Comparaison du pilotage avec les modes de file d’attente followup, collect et interrupt
summary: Comment le pilotage d’une exécution active met les messages en file d’attente aux limites d’exécution
title: File d’attente de pilotage
x-i18n:
    generated_at: "2026-07-12T15:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Lorsqu’un prompt normal arrive alors qu’une exécution de session est déjà en cours de diffusion et que le mode de file d’attente est `steer` (valeur par défaut, aucune configuration nécessaire), OpenClaw tente d’envoyer ce prompt au runtime actif. OpenClaw et le harnais app-server natif de Codex implémentent différemment les détails de la livraison.

Cette page décrit le pilotage par mode de file d’attente des messages entrants normaux en mode `steer`. En mode `followup` ou `collect`, les messages normaux ignorent ce chemin et attendent la fin de l’exécution active. Pour la commande explicite `/steer <message>`, consultez [Piloter](/fr/tools/steer).

## Limite du runtime

Le pilotage n’interrompt pas un appel d’outil déjà en cours d’exécution. OpenClaw vérifie la présence de messages de pilotage en file d’attente aux limites du modèle :

1. L’assistant demande des appels d’outils.
2. OpenClaw exécute le lot d’appels d’outils du message actuel de l’assistant.
3. OpenClaw émet l’événement de fin de tour.
4. OpenClaw extrait les messages de pilotage de la file d’attente.
5. OpenClaw ajoute ces messages en tant que messages utilisateur avant l’appel suivant au LLM.

Ainsi, les résultats des outils restent associés au message de l’assistant qui les a demandés, puis l’appel suivant au modèle peut prendre en compte la saisie utilisateur la plus récente.

Le harnais app-server natif de Codex expose `turn/steer` au lieu de la file d’attente de pilotage interne du runtime OpenClaw. OpenClaw regroupe les prompts mis en file d’attente pendant la fenêtre de silence configurée, puis envoie une seule requête `turn/steer` contenant toutes les saisies utilisateur collectées, dans leur ordre d’arrivée.

Les tours de revue Codex et de compaction manuelle refusent le pilotage pendant le même tour. Lorsqu’un runtime ne peut pas accepter le pilotage en mode `steer`, OpenClaw attend la fin de l’exécution active avant de lancer le prompt.

## Modes

| Mode        | Comportement pendant l’exécution active                           | Comportement ultérieur                                                                                              |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `steer`     | Pilote le prompt dans le runtime actif lorsque cela est possible. | Attend la fin de l’exécution active si le pilotage n’est pas disponible.                                            |
| `followup`  | Ne pilote pas.                                                    | Exécute ultérieurement les messages en file d’attente après la fin de l’exécution active.                           |
| `collect`   | Ne pilote pas.                                                    | Regroupe les messages compatibles en file d’attente dans un tour ultérieur après la fenêtre d’anti-rebond.          |
| `interrupt` | Interrompt l’exécution active au lieu de la piloter.              | Lance le message le plus récent après l’interruption.                                                               |

## Exemple de rafale

Si quatre utilisateurs envoient des messages pendant que l’agent exécute un appel d’outil :

- Avec le comportement par défaut, le runtime actif reçoit les quatre messages dans leur ordre d’arrivée avant sa prochaine décision de modèle. OpenClaw les extrait de la file d’attente à la limite de modèle suivante ; Codex les reçoit sous la forme d’un unique `turn/steer` groupé.
- Avec `/queue collect`, OpenClaw ne pilote pas. Il attend la fin de l’exécution active, puis crée un tour de suivi contenant les messages compatibles en file d’attente après la fenêtre d’anti-rebond.
- Avec `/queue interrupt`, OpenClaw interrompt l’exécution active et lance le message le plus récent au lieu d’effectuer un pilotage.

## Portée

Le pilotage cible toujours l’exécution active de la session actuelle. Il ne crée pas de nouvelle session, ne modifie pas la politique d’outils de l’exécution active et ne sépare pas les messages par expéditeur. Dans les canaux multi-utilisateurs, les prompts entrants incluent déjà le contexte de l’expéditeur et de l’acheminement, afin que l’appel suivant au modèle puisse déterminer qui a envoyé chaque message.

Utilisez `followup` ou `collect` lorsque vous souhaitez que les messages soient mis en file d’attente par défaut au lieu de piloter l’exécution active. Utilisez `interrupt` lorsque le prompt le plus récent doit remplacer l’exécution active.

## Anti-rebond

`messages.queue.debounceMs` s’applique à la livraison des messages `followup` et `collect` en file d’attente. En mode `steer` avec le harnais Codex natif, il définit également la fenêtre de silence avant l’envoi du lot `turn/steer`. Pour OpenClaw, le pilotage actif lui-même n’utilise pas le minuteur d’anti-rebond, car OpenClaw regroupe naturellement les messages jusqu’à la limite de modèle suivante.

## Pages connexes

- [File d’attente des commandes](/fr/concepts/queue)
- [Piloter](/fr/tools/steer)
- [Messages](/fr/concepts/messages)
- [Boucle de l’agent](/fr/concepts/agent-loop)
