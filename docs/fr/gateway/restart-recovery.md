---
read_when:
    - Vous voulez savoir si le redémarrage du Gateway entraîne la perte du travail d’agent en cours.
    - Une exécution d’agent a été interrompue par un redémarrage, un plantage ou un rechargement de la configuration
    - Vous déboguez la récupération automatique de session après le redémarrage du Gateway
summary: 'Ce qui subsiste après un redémarrage ou une panne du Gateway : les tours d’agent interrompus reprennent automatiquement, les sous-agents et les tâches en arrière-plan sont récupérés, et les livraisons en attente sont traitées'
title: Récupération après redémarrage
x-i18n:
    generated_at: "2026-07-12T15:26:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b2701cb9cdc5aabffc395a2956260389cbe81a6c3ca2876830ef4ed83db2fb53
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Le redémarrage du Gateway n’entraîne aucune perte de l’état des agents. Les conversations, les transcriptions,
les tâches planifiées, les enregistrements des tâches en arrière-plan et les messages sortants en file d’attente sont tous conservés
sur disque, et le travail interrompu en cours de tour est détecté et repris
automatiquement une fois le Gateway de nouveau opérationnel. Aucune intervention manuelle n’est
requise et il n’y a rien à configurer : la récupération est toujours active.

Cette page décrit ce qui subsiste après un redémarrage, comment le travail interrompu est détecté
et comment se déroule la reprise automatique.

## Ce qui subsiste après un redémarrage

| État                          | Stockage                                            | Comportement après un redémarrage                                       |
| ----------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Historique des conversations  | Transcriptions JSONL + stockage de sessions par agent sur disque | Inchangé ; les sessions se poursuivent à partir de la transcription stockée |
| Tour de session principale interrompu | Marqueurs de récupération dans le stockage de sessions | Repris automatiquement quelques secondes après le démarrage             |
| Exécutions de sous-agents     | SQLite (base de données d’état partagée)            | Registre restauré au démarrage ; exécutions interrompues reprises       |
| Tâches en arrière-plan        | SQLite (base de données d’état partagée)            | Rapprochées au démarrage ; exécutions orphelines récupérées ou marquées comme perdues |
| Livraisons sortantes en file d’attente | File d’attente de livraison SQLite          | Traitée après le redémarrage ; les réponses non livrées sont réessayées |
| Tâches planifiées (cron)      | Stockage cron SQLite                                | Les planifications persistent ; le planificateur se réarme au démarrage |
| Poursuite après redémarrage   | Sentinelle de redémarrage SQLite                    | Suivi ponctuel envoyé à la session ayant demandé le redémarrage         |

## Les redémarrages progressifs attendent d’abord la fin des opérations

Un redémarrage demandé (`openclaw gateway restart`, une modification de configuration nécessitant
un redémarrage ou une mise à jour du Gateway) n’interrompt pas immédiatement le travail en cours. Le
Gateway cesse d’accepter de nouvelles tâches, puis attend que les tours d’agent actifs et les
tâches en arrière-plan se terminent, dans la limite d’un délai d’attente (5 minutes par défaut). La plupart
des redémarrages n’interrompent donc aucun travail.

Seul le travail qui ne peut pas se terminer dans ce délai (ou toute exécution interrompue
par un redémarrage forcé ou une panne) est abandonné — et avant cela, chaque
session concernée est marquée pour récupération.

## Détection du travail interrompu

Deux mécanismes complémentaires marquent les sessions dont le tour ne s’est pas terminé :

- **À l’arrêt :** pendant l’attente précédant le redémarrage, chaque session comportant une exécution active
  reçoit un marqueur de récupération dans le stockage de sessions avant que l’exécution ne soit
  abandonnée.
- **Au démarrage :** le Gateway analyse les stockages de sessions afin de repérer celles qui indiquent encore
  être en cours d’exécution, mais ne possèdent aucun propriétaire actif dans le nouveau processus. Cela permet de détecter
  les pannes brutales et les arrêts forcés pendant lesquels aucun code d’arrêt n’a été exécuté. Les fichiers de verrouillage
  obsolètes des transcriptions sont nettoyés simultanément.

## Reprise automatique

Quelques secondes après le démarrage, le Gateway renvoie chaque session marquée
avec un message système synthétique indiquant à l’agent que son tour précédent a été
interrompu par un redémarrage et qu’il doit reprendre à partir de la transcription existante. Si une
réponse finale avait déjà été produite, mais pas livrée, son texte est inclus
afin que l’agent puisse la transmettre au lieu de recommencer le travail. La récupération effectue jusqu’à
3 tentatives avec temporisation exponentielle.

Avant la reprise, le Gateway vérifie que la fin de la transcription permet de
continuer en toute sécurité. Si ce n’est pas le cas (par exemple, si le tour s’est terminé sur une approbation
en attente obsolète), la session n’est pas réexécutée à l’aveugle ; l’agent publie plutôt une brève
notification demandant à l’utilisateur de renvoyer sa dernière requête.

OpenClaw peut également reconstruire les travaux [Code Mode](/fr/reference/code-mode)
interrompus et accessibles en lecture seule. Code Mode marque ces exécutions comme compatibles avec les redémarrages et rejette les outils
du catalogue produisant des effets de bord ou les espaces de noms de plugins avant leur exécution. Si un redémarrage survient sur
la commande `wait`, le nouveau Gateway reconstruit le tour à partir de sa transcription
et impose que l’exécution reconstruite reste compatible avec les redémarrages, même si le
modèle omet ou désactive cet indicateur. L’hôte limite l’intégralité du tour reconstruit
aux outils principaux audités en lecture seule et aux outils de plugins explicitement sûrs pour la réexécution,
y compris lorsque Code Mode est désactivé après le redémarrage. Le travail produisant des effets de bord
reste protégé par la notification de renvoi afin de ne pas risquer une écriture en double.

### Sous-agents

Les exécutions de sous-agents sont conservées dans la base de données d’état SQLite partagée, de sorte que le
registre des sous-agents subsiste après l’arrêt du processus. Au démarrage, le registre est restauré et
les sessions de sous-agents interrompues sont reprises avec le contexte de leur tâche d’origine.
Deux mécanismes de sécurité s’appliquent :

- Les exécutions interrompues il y a plus de 2 heures sont finalisées au lieu d’être reprises, afin qu’un
  Gateway resté arrêté pendant la nuit ne réactive pas un travail obsolète.
- Une session dont la récupération échoue à plusieurs reprises est marquée par une pierre tombale comme bloquée afin que
  la récupération ne puisse pas boucler indéfiniment.

### Tâches en arrière-plan

Le [registre des tâches en arrière-plan](/fr/automation/tasks) repose sur SQLite et fait l’objet d’un
rapprochement au démarrage ainsi qu’à intervalles réguliers : les résultats durables enregistrés par
les exécutions terminées sont récupérés, et les exécutions dont le processus propriétaire a disparu sont
marquées comme perdues après un délai de grâce au lieu de rester indéfiniment suspendues.

### Redémarrages demandés par l’agent

Lorsque l’agent déclenche lui-même un redémarrage (pour appliquer une modification de configuration, mettre à jour
le Gateway ou répondre à une demande explicite de redémarrage), une sentinelle de redémarrage est écrite dans
SQLite avant l’arrêt du processus. Après le démarrage, le Gateway publie le résultat dans
la discussion d’origine et lance un tour de continuation ponctuel afin que
l’agent reprenne exactement là où il s’était arrêté, dans le même canal et le même fil.

## Mécanismes de sécurité et observabilité

- **Disjoncteur de boucle de panne :** 3 démarrages non propres en 5 minutes déclenchent un disjoncteur qui
  empêche le démarrage automatique des services annexes lors du démarrage suivant, afin qu’un Gateway en panne
  n’amplifie pas le problème. Le fonctionnement normal reprend une fois la fenêtre des démarrages non propres écoulée.
- **Métriques :** l’activité de récupération est exportée par l’intermédiaire de
  [Prometheus](/fr/gateway/prometheus) sous les noms `openclaw_session_recovery_total` et
  `openclaw_session_recovery_age_seconds`.
- **Journaux :** les décisions de récupération sont consignées dans les sous-systèmes
  `main-session-restart-recovery` et `subagent-interrupted-resume`.

## Ce qui n’est pas repris

- Les sessions exclues de la récupération de session principale parce qu’un autre propriétaire
  les gère déjà : les sessions de sous-agents (récupération des sous-agents), les sessions cron (le
  planificateur les réexécute conformément à la planification) et les sessions gérées par ACP (l’IDE
  ou le client connecté prend en charge la reprise).
- Les sessions dont la fin de transcription ne permet pas de continuer en toute sécurité ; elles reçoivent la
  notification de renvoi décrite ci-dessus au lieu d’être réexécutées silencieusement.
- Le travail qui n’a jamais été accepté : les messages arrivant pendant la période d’attente sont
  rejetés avec une erreur explicite de redémarrage au lieu d’être silencieusement placés dans la file d’attente d’un
  processus en cours d’arrêt.
