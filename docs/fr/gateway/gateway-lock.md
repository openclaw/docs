---
read_when:
    - Exécution ou débogage du processus Gateway
    - Examen de l’application de l’instance unique
summary: 'Protection du singleton du Gateway : verrouillage de fichier et liaison WebSocket/HTTP'
title: Verrou du Gateway
x-i18n:
    generated_at: "2026-07-16T13:19:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5ac6d42c437b481c68a23a0aa4c00aeac9131acd76f3516ce3e949f325e265b
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Pourquoi

- Un seul processus Gateway doit être propriétaire d’un répertoire d’état ; exécutez les Gateway supplémentaires avec des profils, des répertoires d’état, des configurations et des ports isolés.
- Résister aux plantages/SIGKILL sans laisser de fichiers de verrouillage obsolètes.
- Échouer rapidement avec une erreur claire lorsqu’un autre Gateway est déjà propriétaire du port.

## Trois couches

Le démarrage impose la propriété en trois étapes, dans l’ordre suivant :

1. Le **verrou de propriété de l’état** acquiert un verrou associé au répertoire d’état canonique. Chaque Gateway y participe, y compris ceux démarrés avec `OPENCLAW_ALLOW_MULTI_GATEWAY=1`, afin que les opérations destructrices de maintenance SQLite ne puissent pas entrer en concurrence avec un propriétaire actif.
2. Le **verrou de configuration** acquiert le verrou historique propre à chaque configuration et enregistre le port d’exécution. Le mode multi-Gateway ignore ce singleton de configuration, mais conserve le verrou de propriété de l’état.
3. La **liaison du socket** lie l’écouteur HTTP/WebSocket (par défaut `ws://127.0.0.1:18789`) en tant qu’écouteur TCP exclusif.

Chaque couche peut échouer indépendamment et lève sa propre `GatewayLockError`.

### Verrous d’état et de configuration

- L’activité d’un verrou est déterminée par le PID enregistré, l’identité de démarrage du processus fournie par la plateforme lorsqu’elle est disponible et l’identité du processus Gateway. Un propriétaire vérifié reste la référence pendant le démarrage, avant que son port ne commence à écouter.
- Un coordinateur SQLite dédié sérialise l’inspection des métadonnées, la récupération des propriétaires obsolètes et le remplacement des verrous. Sa transaction exclusive est automatiquement libérée si le processus propriétaire plante.
- Si un fichier de verrouillage est absent ou si le processus propriétaire enregistré n’existe plus, le démarrage récupère le verrou et se poursuit.
- Si l’un des verrous est activement détenu, le démarrage réessaie pendant 5 secondes au maximum (par défaut) avant d’abandonner :

  ```text
  GatewayLockError("Gateway déjà en cours d’exécution (pid <pid>) ; expiration du verrou après <ms> ms")
  ```

### Liaison du socket

- En cas de `EADDRINUSE`, le démarrage réessaie la liaison jusqu’à 20 fois à intervalles de 500 ms (environ 10 secondes au total) afin de laisser passer une fenêtre `TIME_WAIT` après l’arrêt récent d’un processus.
- Si le port est toujours utilisé après les nouvelles tentatives :

  ```text
  GatewayLockError("une autre instance de Gateway écoute déjà sur ws://127.0.0.1:<port>")
  ```

- Autres échecs de liaison :

  ```text
  GatewayLockError("échec de la liaison du socket Gateway sur ws://127.0.0.1:<port> : <cause>")
  ```

Lors de l’arrêt, le Gateway ferme le serveur HTTP/WebSocket et supprime ses fichiers
de verrouillage d’état et de configuration.

## Notes opérationnelles

- Si le port est occupé par un autre processus qui n’est pas un Gateway, l’erreur est identique ; libérez le port ou choisissez-en un autre avec `openclaw gateway --port <port>`.
- `OPENCLAW_ALLOW_MULTI_GATEWAY=1` autorise plusieurs instances de configuration/d’exécution, mais pas un état mutable partagé. Chaque instance nécessite toujours un `OPENCLAW_STATE_DIR` unique.
- Sous la supervision d’un gestionnaire de services, un nouveau processus Gateway qui rencontre l’une des erreurs ci-dessus commence par sonder `/healthz` sur le processus existant. Si ce processus est sain, le nouveau processus lui laisse le contrôle au lieu d’échouer. Sous systemd, il se termine avec le code `78` ; le paramètre `RestartPreventExitStatus=78` de l’unité empêche `Restart=always` de boucler sur un conflit de verrouillage ou de `EADDRINUSE`. Si le processus existant ne devient jamais sain, les nouvelles tentatives de la sonde d’intégrité sont limitées dans le temps, puis le démarrage échoue avec l’erreur de verrouillage ci-dessus au lieu de boucler indéfiniment.
- L’application macOS conserve son propre contrôle léger du PID avant de lancer le Gateway ; le verrouillage de fichier et la liaison du socket décrits ci-dessus constituent les véritables mécanismes d’application lors de l’exécution.

## Voir aussi

- [Plusieurs Gateway](/fr/gateway/multiple-gateways) - exécution de plusieurs instances avec des ports uniques
- [Dépannage](/fr/gateway/troubleshooting) - diagnostic de `EADDRINUSE` et des conflits de ports
