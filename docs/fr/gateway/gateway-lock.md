---
read_when:
    - Exécution ou débogage du processus Gateway
    - Analyse de l’application d’une instance unique
summary: Garde singleton du Gateway utilisant la liaison de l’écouteur WebSocket
title: Verrou du Gateway
x-i18n:
    generated_at: "2026-04-30T16:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Pourquoi

- Garantir qu’une seule instance de Gateway s’exécute par port de base sur le même hôte ; les Gateway supplémentaires doivent utiliser des profils isolés et des ports uniques.
- Survivre aux plantages/SIGKILL sans laisser de fichiers de verrouillage obsolètes.
- Échouer rapidement avec une erreur claire lorsque le port de contrôle est déjà occupé.

## Mécanisme

- Le Gateway acquiert d’abord un fichier de verrouillage par configuration dans le répertoire des verrous d’état et sonde le port configuré pour détecter un écouteur existant.
- Si le propriétaire du verrou enregistré n’existe plus, si le port est libre ou si le verrou est obsolète, le démarrage récupère le verrou et continue.
- Le Gateway lie ensuite l’écouteur HTTP/WebSocket (par défaut `ws://127.0.0.1:18789`) au moyen d’un écouteur TCP exclusif.
- Si la liaison échoue avec `EADDRINUSE`, le démarrage lance `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- À l’arrêt, le Gateway ferme le serveur HTTP/WebSocket et supprime le fichier de verrouillage.

## Surface d’erreur

- Si un autre processus détient le port, le démarrage lance `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Les autres échecs de liaison apparaissent sous la forme `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notes opérationnelles

- Si le port est occupé par un _autre_ processus, l’erreur est la même ; libérez le port ou choisissez-en un autre avec `openclaw gateway --port <port>`.
- Sous un superviseur de service, un nouveau processus Gateway qui voit un répondant `/healthz` existant et sain laisse ce processus garder le contrôle. Sur systemd, le démarreur dupliqué se termine avec le code 78 afin que la valeur par défaut `RestartPreventExitStatus=78` empêche `Restart=always` de boucler sur un conflit de verrou ou `EADDRINUSE`. Si le processus existant ne devient jamais sain, les nouvelles tentatives sont bornées et le démarrage échoue avec une erreur de verrou claire au lieu de boucler indéfiniment.
- L’application macOS conserve toujours sa propre garde PID légère avant de lancer le Gateway ; le verrou d’exécution est imposé par le fichier de verrouillage ainsi que par la liaison HTTP/WebSocket.

## Associé

- [Plusieurs Gateway](/fr/gateway/multiple-gateways) — exécuter plusieurs instances avec des ports uniques
- [Dépannage](/fr/gateway/troubleshooting) — diagnostiquer `EADDRINUSE` et les conflits de ports
