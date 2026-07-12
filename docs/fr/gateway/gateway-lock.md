---
read_when:
    - Exécution ou débogage du processus Gateway
    - Étude de l’application d’une instance unique
summary: 'Protection du singleton Gateway : verrouillage de fichier et liaison WebSocket/HTTP'
title: Verrou du Gateway
x-i18n:
    generated_at: "2026-07-12T02:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c3ba4e8c12d6aadd089cb05722444eaa99d4b573553ac52a21c5c91e5ce1c09
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Pourquoi

- Un seul processus Gateway doit gérer une configuration et un port donnés sur un hôte ; exécutez les Gateway supplémentaires avec des profils isolés et des ports uniques.
- Résister aux plantages/SIGKILL sans laisser de fichiers de verrouillage obsolètes.
- Échouer rapidement avec une erreur claire lorsqu’un autre Gateway gère déjà le port.

## Deux niveaux

Au démarrage, la propriété de l’instance unique est garantie en deux étapes indépendantes, dans l’ordre suivant :

1. Le **verrouillage de fichier** acquiert un fichier de verrouillage propre à la configuration dans le répertoire des verrous d’état. Lors de cette acquisition, le démarrage sonde le port configuré pour détecter un processus à l’écoute et identifier un propriétaire de verrou obsolète à la suite d’un plantage.
2. La **liaison de socket** lie le point d’écoute HTTP/WebSocket (par défaut `ws://127.0.0.1:18789`) en tant que point d’écoute TCP exclusif.

Chaque niveau peut échouer indépendamment et lève sa propre erreur `GatewayLockError`.

### Verrouillage de fichier

- Si le fichier de verrouillage est absent, si le processus propriétaire enregistré n’existe plus ou si la sonde du port du propriétaire ne détecte aucun processus à l’écoute, le démarrage récupère le verrou et se poursuit.
- Si le verrou est activement détenu et qu’aucune des conditions ci-dessus ne s’applique, le démarrage réessaie pendant un maximum de 5 secondes (par défaut) avant d’abandonner :

  ```text
  GatewayLockError("gateway already running (pid <pid>); lock timeout after <ms>ms")
  ```

### Liaison de socket

- En cas de `EADDRINUSE`, le démarrage réessaie la liaison jusqu’à 20 fois à intervalles de 500 ms (environ 10 secondes au total) afin de laisser expirer une période `TIME_WAIT` après l’arrêt récent d’un processus.
- Si le port est toujours utilisé après les nouvelles tentatives :

  ```text
  GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")
  ```

- Autres échecs de liaison :

  ```text
  GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: <cause>")
  ```

Lors de l’arrêt, le Gateway ferme le serveur HTTP/WebSocket et supprime le fichier de verrouillage.

## Remarques opérationnelles

- Si le port est occupé par un processus différent qui n’est pas un Gateway, l’erreur est la même ; libérez le port ou choisissez-en un autre avec `openclaw gateway --port <port>`.
- Sous la supervision d’un gestionnaire de services, un nouveau processus Gateway qui rencontre l’une des erreurs ci-dessus sonde d’abord `/healthz` sur le processus existant. Si ce processus est sain, le nouveau processus lui laisse le contrôle au lieu d’échouer. Sous systemd, il se termine avec le code `78` ; le paramètre `RestartPreventExitStatus=78` de l’unité empêche `Restart=always` de boucler en cas de conflit de verrouillage ou de `EADDRINUSE`. Si le processus existant ne devient jamais sain, les nouvelles tentatives de sondage d’intégrité sont limitées dans le temps, puis le démarrage échoue avec l’erreur de verrouillage ci-dessus au lieu de boucler indéfiniment.
- L’application macOS conserve son propre contrôle léger du PID avant de lancer le Gateway ; le verrouillage de fichier et la liaison de socket décrits ci-dessus constituent les véritables mécanismes d’application à l’exécution.

## Voir aussi

- [Plusieurs Gateway](/fr/gateway/multiple-gateways) - exécution de plusieurs instances avec des ports uniques
- [Dépannage](/fr/gateway/troubleshooting) - diagnostic de `EADDRINUSE` et des conflits de ports
