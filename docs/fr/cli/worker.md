---
read_when:
    - Exploitation ou débogage des workers cloud lancés par le Gateway
    - Vérification de l’admission des workers, de l’affectation des sessions ou de l’isolation locale des outils
summary: Référence interne pour les opérateurs concernant l’environnement d’exécution restreint des workers cloud
title: Agent d’exécution
x-i18n:
    generated_at: "2026-07-16T13:14:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` est le point d’entrée d’exécution restreint qu’un orchestrateur de workers
cloud lance dans un environnement de worker préparé. Il ne s’agit pas d’une
commande générique destinée à l’enregistrement manuel des workers.

Le Gateway installe le bundle OpenClaw correspondant et ouvre le tunnel SSH inverse
avec épinglage de la clé d’hôte. Le lanceur de workers démarre cette commande avec une
affectation préparée. La commande se connecte par l’intermédiaire du socket local transféré
par le tunnel et est admise sous le rôle dédié `worker`.

## Contrat de lancement

La commande lit exactement une enveloppe de lancement JSON de taille limitée depuis l’entrée standard.
L’enveloppe contient l’emplacement du socket local, l’identifiant d’accès généré du worker, l’identité
du bundle et du protocole, l’époque du propriétaire, ainsi que l’unique session et le tour affectés.
L’identifiant d’accès n’est jamais accepté dans les arguments de ligne de commande, et cette page
ne fournit intentionnellement aucun exemple d’identifiant d’accès ni d’enveloppe rédigée manuellement.

L’admission échoue de manière fermée si l’enveloppe n’est pas valide, si l’identifiant d’accès est rejeté,
si les fonctionnalités du bundle ou du protocole ne correspondent pas, ou si la session et l’époque du propriétaire
ne sont plus à jour. Les opérateurs doivent démarrer les workers au moyen de l’orchestrateur de workers
cloud plutôt que d’appeler directement ce point d’entrée.

## Limite d’exécution

Le processus exécute la boucle d’agent intégrée normale avec un backend restreint :

- Les outils de programmation `read`, `write`, `edit`, `apply_patch`, `exec` et `process`
  s’exécutent localement dans l’espace de travail du worker.
- Les appels au modèle utilisent le proxy d’inférence du Gateway. Aucun profil local d’authentification au modèle
  n’est chargé.
- Les écritures de transcription utilisent la RPC de validation de transcription du Gateway.
- Les mises à jour du streaming et du cycle de vie des outils utilisent la RPC d’événements en direct du Gateway.
- Seuls la session et le tour affectés sont acceptés.

Le mode worker ne démarre ni les canaux, ni les surfaces HTTP du Gateway, ni le démarrage automatique
des plugins au-delà de l’ensemble d’outils affecté à la session. Il utilise un répertoire d’état temporaire et ne dispose
d’aucun identifiant d’accès permanent à un fournisseur ou à une forge.

La répartition de sessions entre workers n’est pas exposée dans ce mode. Le placement et
la répartition restent sous la responsabilité du Gateway : un opérateur peut répartir, par l’intermédiaire du Gateway, une session locale existante
avec arborescence de travail gérée, tandis qu’un processus worker ne peut pas
se répartir lui-même ni répartir un autre worker.

L’affectation préparée contient le contexte de transcription, la feuille de base acceptée,
la séquence de validation et le curseur d’événements en direct. Lors d’une reconnexion du tunnel, le processus
est de nouveau admis avec le même identifiant d’accès et la même époque du propriétaire, conserve la base
de transcription acceptée, rejoue la fin non acquittée de ses événements en direct et rattache
un tour d’inférence en cours avec la même identité. Le message d’inférence terminal
fait autorité si des deltas diffusés ont été manqués. Une époque du propriétaire qui en remplace une autre
isole le processus et provoque un arrêt propre.

Un rejet de transcription `stale-base-leaf` arrête immédiatement l’exécution en cours. Le mode worker
ne réessaie pas la séquence rejetée sur une autre feuille ; aucune
validation en double n’est donc produite. Toute fin de transcription encore non validée et conservée en mémoire pour cette
exécution est perdue. La relance relève du propriétaire du placement de l’étape 3, qui doit
créer une nouvelle affectation à partir de la transcription faisant autorité du Gateway et de son
registre de validations. De même, le redémarrage d’un processus Gateway met fin à un tour
d’inférence en attente avec une erreur du fournisseur ; seule la reconnexion d’un tunnel ou du WebSocket
du worker peut rattacher un flux d’inférence actif du même processus.

Consultez [Protocole du Gateway](/fr/gateway/protocol#worker-role-and-closed-protocol) pour découvrir la
surface RPC fermée des workers et [Plan des workers cloud](/fr/plan/cloud-workers) pour
l’architecture et le modèle de sécurité.
