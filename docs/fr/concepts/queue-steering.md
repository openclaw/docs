---
read_when:
    - Expliquer le comportement de steer pendant qu’un agent utilise des outils
    - Modification du comportement de la file d’attente des exécutions actives ou de l’intégration du pilotage runtime
    - Comparer le pilotage avec les modes de file d’attente followup, collect et interrupt
summary: Comment le pilotage d’exécution active met en file les messages aux limites d’exécution
title: File de pilotage
x-i18n:
    generated_at: "2026-06-27T17:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Lorsqu'un prompt normal arrive alors qu'une exécution de session est déjà en streaming, OpenClaw
essaie par défaut d'envoyer ce prompt dans le runtime actif lorsque le mode de file d'attente
est `steer`. Aucune entrée de configuration ni aucune directive de file d'attente n'est requise pour ce comportement
par défaut. OpenClaw et le harnais app-server Codex natif implémentent les détails
de livraison différemment.

## Limite du runtime

Le pilotage n'interrompt pas un appel d'outil déjà en cours d'exécution. OpenClaw vérifie les
messages de pilotage en file d'attente aux limites du modèle :

1. L'assistant demande des appels d'outils.
2. OpenClaw exécute le lot d'appels d'outils du message d'assistant actuel.
3. OpenClaw émet l'événement de fin de tour.
4. OpenClaw vide les messages de pilotage en file d'attente.
5. OpenClaw ajoute ces messages comme messages utilisateur avant le prochain appel au LLM.

Cela conserve les résultats d'outils associés au message d'assistant qui les a demandés,
puis permet au prochain appel de modèle de voir la dernière saisie utilisateur.

Le harnais app-server Codex natif expose `turn/steer` au lieu de la file de pilotage
interne du runtime OpenClaw. OpenClaw regroupe les prompts en file d'attente pendant la fenêtre
de silence configurée, puis envoie une seule requête `turn/steer` avec toutes les entrées utilisateur
collectées dans leur ordre d'arrivée.

Les tours de revue Codex et de compaction manuelle refusent le pilotage dans le même tour. Lorsqu'un
runtime ne peut pas accepter le pilotage en mode `steer`, OpenClaw attend que l'exécution
active se termine avant de démarrer le prompt.

Cette page explique le pilotage en mode de file d'attente pour les messages entrants normaux lorsque le mode
est `steer`. Si le mode est `followup` ou `collect`, les messages normaux n'empruntent pas
ce chemin de pilotage ; ils attendent que l'exécution active se termine. Pour la commande explicite
`/steer <message>`, consultez [Orienter](/fr/tools/steer).

## Modes

| Mode        | Comportement pendant l'exécution active                | Comportement ultérieur                                                              |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Pilote le prompt dans le runtime actif lorsque c'est possible. | Attend que l'exécution active se termine si le pilotage est indisponible.           |
| `followup`  | Ne pilote pas.                                         | Exécute plus tard les messages en file d'attente après la fin de l'exécution active. |
| `collect`   | Ne pilote pas.                                         | Regroupe les messages en file d'attente compatibles dans un tour ultérieur après la fenêtre de temporisation. |
| `interrupt` | Abandonne l'exécution active au lieu de la piloter.    | Démarre le message le plus récent après l'abandon.                                  |

## Exemple de rafale

Si quatre utilisateurs envoient des messages pendant que l'agent exécute un appel d'outil :

- Avec le comportement par défaut, le runtime actif reçoit les quatre messages dans leur
  ordre d'arrivée avant sa prochaine décision de modèle. OpenClaw les vide à la prochaine limite de modèle ;
  Codex les reçoit sous forme d'un seul `turn/steer` groupé.
- Avec `/queue collect`, OpenClaw ne pilote pas. Il attend que l'exécution active
  se termine, puis crée un tour de suivi avec les messages en file d'attente compatibles après la
  fenêtre de temporisation.
- Avec `/queue interrupt`, OpenClaw abandonne l'exécution active et démarre le message
  le plus récent au lieu de piloter.

## Portée

Le pilotage cible toujours l'exécution de session active actuelle. Il ne crée pas de nouvelle
session, ne modifie pas la politique d'outils de l'exécution active et ne répartit pas les messages par expéditeur. Dans
les canaux multi-utilisateurs, les prompts entrants incluent déjà le contexte d'expéditeur et de route, ce qui permet
au prochain appel de modèle de voir qui a envoyé chaque message.

Utilisez `followup` ou `collect` lorsque vous voulez que les messages soient mis en file d'attente par défaut au lieu
de piloter l'exécution active. Utilisez `interrupt` lorsque le prompt le plus récent doit
remplacer l'exécution active.

## Temporisation

`messages.queue.debounceMs` s'applique à la livraison en file d'attente `followup` et `collect`.
En mode `steer` avec le harnais Codex natif, il définit aussi la fenêtre de silence
avant l'envoi du `turn/steer` groupé. Pour OpenClaw, le pilotage actif lui-même n'utilise pas
le minuteur de temporisation, car OpenClaw regroupe naturellement les messages jusqu'à la prochaine limite
de modèle.

## Associés

- [File d'attente de commandes](/fr/concepts/queue)
- [Orienter](/fr/tools/steer)
- [Messages](/fr/concepts/messages)
- [Boucle d'agent](/fr/concepts/agent-loop)
