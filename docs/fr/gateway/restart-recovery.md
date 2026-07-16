---
read_when:
    - Vous souhaitez savoir si le redémarrage du Gateway entraîne la perte du travail de l’agent en cours.
    - L’exécution d’un agent a été interrompue par un redémarrage, un plantage ou un rechargement de la configuration
    - Vous déboguez la récupération automatique de la session après le redémarrage du Gateway
summary: 'Ce qui survit à un redémarrage ou à un plantage du Gateway : les tours d’agent interrompus reprennent automatiquement, les sous-agents et les tâches en arrière-plan sont récupérés, et les livraisons en file d’attente sont traitées.'
title: Récupération après redémarrage
x-i18n:
    generated_at: "2026-07-16T13:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Le redémarrage du Gateway n’entraîne aucune perte de l’état de l’agent. Les conversations, les transcriptions,
les tâches planifiées, les enregistrements des tâches en arrière-plan et les messages sortants en file d’attente résident tous
sur disque, et le travail interrompu au milieu d’un tour est détecté et repris
automatiquement une fois le Gateway redémarré. Aucune intervention manuelle n’est
requise et rien n’est à configurer : la récupération est toujours activée.

Cette page décrit ce qui persiste après un redémarrage, comment le travail interrompu est détecté
et comment se déroule la reprise automatique.

## Ce qui persiste après un redémarrage

| État                          | Stockage                                    | Comportement après un redémarrage                                      |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Historique des conversations  | Base de données SQLite propre à chaque agent | Inchangé ; les sessions se poursuivent à partir de la transcription stockée |
| Tour interrompu de la session principale | Ligne de session et transcription SQLite propres à chaque agent | Repris ou réconcilié automatiquement quelques secondes après le démarrage |
| Exécutions de sous-agents     | SQLite (base de données d’état partagée)    | Registre restauré au démarrage ; exécutions interrompues reprises       |
| Tâches en arrière-plan        | SQLite (base de données d’état partagée)    | Réconciliées au démarrage ; exécutions orphelines récupérées ou marquées comme perdues |
| Livraisons sortantes en file d’attente | File de livraison SQLite           | File traitée après le redémarrage ; nouvelles tentatives pour les réponses non livrées |
| Tâches planifiées (cron)      | Stockage cron SQLite                        | Les planifications persistent ; le planificateur se réarme au démarrage |
| Poursuite après redémarrage   | Sentinelle de redémarrage SQLite            | Suivi ponctuel envoyé à la session qui a demandé le redémarrage         |

## Les redémarrages progressifs attendent d’abord la fin des tâches

Un redémarrage demandé (`openclaw gateway restart`, une modification de configuration nécessitant
un redémarrage ou une mise à jour du Gateway) n’interrompt pas immédiatement le travail en cours. Le
Gateway cesse d’accepter de nouvelles tâches, puis attend la fin des tours d’agent actifs et des
tâches en arrière-plan, dans la limite d’un délai d’attente (5 minutes par défaut). La plupart
des redémarrages n’interrompent donc aucun travail.

Seul le travail qui ne peut pas se terminer dans ce délai (ou toute exécution interrompue
par un redémarrage forcé ou un plantage) est abandonné — et avant cela, chaque
session concernée est marquée pour récupération.

## Détection du travail interrompu

Trois mécanismes complémentaires marquent les sessions dont le tour ne s’est pas terminé :

- **Lors de l’admission du tour :** pour un tour de texte ordinaire dans une session principale existante,
  le Gateway ajoute le message utilisateur, marque la session comme en cours d’exécution et enregistre
  sa revendication de livraison de récupération dans une transaction SQLite avant l’exécution du modèle ou du
  hook `before_agent_reply`. Control UI effectue cette opération avant de renvoyer
  l’accusé de réception `started` ; la distribution par canal l’effectue lorsque le tour préparé
  adopte l’exécution de l’agent.
  Les commandes, pièces jointes, substitutions propres au tour, livraisons en attente, indications d’abandon
  antérieures, sessions détenues par des plugins et tours dotés de hooks d’exécution conservent leurs
  chemins d’admission spécialisés.
  Si un hook `before_agent_reply` est installé, l’admission enregistre également sa phase.
  La récupération ne réexécute jamais un hook interrompu en cours d’appel. Lorsqu’un hook non géré
  se termine, son point de contrôle enregistre ce résultat, mais la récupération continue d’échouer de manière sécurisée
  tant que ce hook reste actif : un point de contrôle ne peut pas prouver que le même
  code de plugin et la même configuration ont été chargés après le redémarrage. Les résultats de texte géré et
  les résultats silencieux sont enregistrés séparément dans des points de contrôle afin de garantir un règlement déterministe.
  Les revendications de récupération persistantes écrites par des versions antérieures ne comportent aucun marqueur
  de propriété de la source ; elles font donc l’objet du même contrôle sécurisé des hooks lors d’une mise à niveau.
- **Lors de l’arrêt :** pendant l’attente précédant le redémarrage, chaque session comportant une exécution active
  reçoit un marqueur de récupération dans le stockage des sessions avant l’abandon de
  l’exécution.
- **Au démarrage :** le Gateway analyse les stockages de sessions à la recherche des sessions qui
  déclarent toujours être en cours d’exécution, mais ne disposent d’aucun propriétaire actif dans le nouveau processus. Cela permet de détecter
  les plantages brutaux et les arrêts forcés pour lesquels aucun code d’arrêt n’a été exécuté. Les fichiers de verrouillage
  obsolètes des transcriptions sont nettoyés simultanément.

## Reprise automatique

Quelques secondes après le démarrage, le Gateway redistribue chaque session marquée
avec un message système synthétique indiquant à l’agent que son tour précédent a été
interrompu par un redémarrage et qu’il doit reprendre à partir de la transcription existante. Si une
réponse finale avait déjà été produite, mais pas livrée, son texte est inclus
afin que l’agent puisse la livrer au lieu de refaire le travail. La récupération effectue jusqu’à
3 tentatives avec un délai exponentiel. Chaque tentative réutilise un même identifiant de distribution
persistant, de sorte qu’un échec de connexion ambigu ne puisse pas lancer deux fois la même récupération.
Les tours de Control UI terminés et impossibles à reprendre conservent également des marqueurs d’idempotence
persistants et limités, ce qui permet à une boîte d’envoi qui se reconnecte de les retirer sans
réexécuter la requête.

Les réponses envoyées uniquement par l’outil de messagerie utilisent une seconde corrélation persistante. Avant qu’un envoi terminal
dans la même conversation n’atteigne le canal, le Gateway enregistre une intention de livraison non résolue
dans la session et le tour source exacts. Une réussite confirmée du fournisseur
la résout sous forme d’accusé de livraison persistant ; un échec confirmé l’efface.
La récupération finalise un accusé de livraison sans réexécuter les outils. Si un plantage
laisse le résultat du fournisseur inconnu, la récupération échoue de manière sécurisée au lieu de réexécuter
un effet externe.

La réponse livrée est également répliquée dans la transcription avec l’ID de son message source.
Les répliques terminales utilisent une clé d’accusé distincte, de sorte qu’un envoi de progression avec
la même clé d’idempotence du fournisseur ne puisse pas masquer le marqueur terminal. Les envois de progression
et les accusés de tours antérieurs ne peuvent pas terminer le tour actuel. Seules
les revendications persistantes d’entrée de canal peuvent restaurer l’autorité d’action sur les messages. Une exécution reprise
conserve le mode de livraison source et la corrélation source d’origine, notamment
l’identité du demandeur et toute restriction au même canal ou fil de discussion, afin que le même accusé
reste déterminant même si un autre redémarrage se produit pendant la récupération. Un
tour utilisant uniquement l’outil de messagerie sans autorité de canal reconstructible échoue
de manière sécurisée et reçoit la notification unique demandant un nouvel envoi.

Avant la reprise, le Gateway vérifie qu’il est sûr de poursuivre à partir de la fin de la
transcription. Si ce n’est pas le cas (par exemple, si le tour s’est terminé sur une approbation
obsolète en attente), la session n’est pas réexécutée aveuglément ; l’agent publie plutôt une courte
notification demandant à l’utilisateur de renvoyer la dernière requête. Pour WebChat, cette notification est
écrite directement dans l’historique de la session afin de rester visible après la reconnexion.

OpenClaw peut également reconstruire le travail en lecture seule de [Code Mode](/fr/reference/code-mode)
interrompu. Code Mode marque ces exécutions comme résistantes aux redémarrages et rejette les outils
de catalogue produisant des effets secondaires ou les espaces de noms de plugins avant leur exécution. Si un redémarrage survient sur
le contrôle `wait`, le nouveau Gateway reconstruit le tour à partir de sa transcription
et oblige l’exécution reconstruite à rester résistante aux redémarrages, même si le
modèle omet ou efface cet indicateur. L’hôte limite l’intégralité du tour reconstruit
aux outils principaux en lecture seule audités et aux outils de plugins explicitement sûrs pour la réexécution,
y compris lorsque Code Mode est désactivé après le redémarrage. Le travail produisant des effets secondaires
reste protégé par la notification demandant un nouvel envoi plutôt que de risquer une écriture en double.

### Sous-agents

Les exécutions de sous-agents sont conservées dans la base de données d’état SQLite partagée ; le
registre des sous-agents persiste donc après l’arrêt du processus. Au démarrage, le registre est restauré et
les sessions de sous-agents interrompues sont reprises avec leur contexte de tâche d’origine.
Deux mécanismes de sécurité s’appliquent :

- Les exécutions interrompues il y a plus de 2 heures sont finalisées au lieu d’être reprises, afin qu’un
  Gateway resté arrêté toute une nuit ne ressuscite pas du travail obsolète.
- Une session dont la récupération échoue à plusieurs reprises est marquée comme bloquée afin que
  la récupération ne puisse pas se répéter indéfiniment.

### Tâches en arrière-plan

Le [registre des tâches en arrière-plan](/fr/automation/tasks) repose sur SQLite et est
réconcilié au démarrage et à intervalles réguliers : les résultats persistants enregistrés par
les exécutions terminées sont récupérés, et les exécutions dont le processus propriétaire a disparu sont
marquées comme perdues après un délai de grâce au lieu de rester indéfiniment bloquées.

### Redémarrages demandés par l’agent

Lorsque l’agent déclenche lui-même un redémarrage (application d’une modification de configuration, mise à jour
du Gateway ou demande explicite de redémarrage), une sentinelle de redémarrage est écrite dans
SQLite avant l’arrêt du processus. Après le démarrage, le Gateway publie le résultat dans
la conversation d’origine et distribue un tour de poursuite ponctuel afin que
l’agent reprenne exactement là où il s’était arrêté, sur le même canal et dans le même fil de discussion.

## Mécanismes de sécurité et observabilité

- **Disjoncteur de boucle de plantage :** 3 démarrages non propres en 5 minutes déclenchent un disjoncteur qui
  empêche le démarrage automatique des services auxiliaires au démarrage suivant, afin qu’un Gateway en échec
  n’amplifie pas son propre dysfonctionnement. Il se rétablit une fois la fenêtre des démarrages non propres écoulée.
- **Métriques :** l’activité de récupération est exportée via
  [Prometheus](/fr/gateway/prometheus) sous les noms `openclaw_session_recovery_total` et
  `openclaw_session_recovery_age_seconds`.
- **Journaux :** les décisions de récupération sont consignées dans les
  sous-systèmes `main-session-restart-recovery` et `subagent-interrupted-resume`.

## Ce qui n’est pas repris

- Sessions exclues de la récupération de la session principale parce qu’un autre propriétaire
  les gère déjà : sessions de sous-agents (récupération des sous-agents), sessions cron (le
  planificateur les réexécute selon la planification) et sessions gérées par ACP (l’IDE
  ou le client connecté prend en charge la reprise).
- Sessions dont la fin de la transcription ne permet pas une reprise sûre ; elles reçoivent la
  notification demandant un nouvel envoi décrite précédemment au lieu d’une réexécution silencieuse.
- Travail qui n’a jamais été admis : les messages arrivant pendant la période d’attente sont
  rejetés avec une erreur explicite de redémarrage au lieu d’être silencieusement placés en file d’attente dans un
  processus en cours d’arrêt.
