---
read_when:
    - Exécution ou débogage du processus Gateway
    - Analyse de l’application de l’instance unique
summary: Protection du singleton Gateway utilisant la liaison de l’écouteur WebSocket
title: Verrou du Gateway
x-i18n:
    generated_at: "2026-04-30T07:26:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe61ff81106554e98de1ca04c213b76d230265cdf3e81b70897d2de00f6a0179
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## Pourquoi

- Garantir qu’une seule instance de Gateway s’exécute par port de base sur le même hôte ; les Gateways supplémentaires doivent utiliser des profils isolés et des ports uniques.
- Résister aux plantages/SIGKILL sans laisser de fichiers de verrouillage obsolètes.
- Échouer rapidement avec une erreur claire lorsque le port de contrôle est déjà occupé.

## Mécanisme

- Le Gateway acquiert d’abord un fichier de verrouillage par configuration dans le répertoire des verrous d’état et sonde le port configuré pour détecter un écouteur existant.
- Si le propriétaire du verrou enregistré n’existe plus, si le port est libre ou si le verrou est obsolète, le démarrage récupère le verrou et continue.
- Le Gateway lie ensuite l’écouteur HTTP/WebSocket (par défaut `ws://127.0.0.1:18789`) au moyen d’un écouteur TCP exclusif.
- Si la liaison échoue avec `EADDRINUSE`, le démarrage lève `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- À l’arrêt, le Gateway ferme le serveur HTTP/WebSocket et supprime le fichier de verrouillage.

## Surface d’erreur

- Si un autre processus occupe le port, le démarrage lève `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Les autres échecs de liaison apparaissent sous la forme `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Notes opérationnelles

- Si le port est occupé par un _autre_ processus, l’erreur est la même ; libérez le port ou choisissez-en un autre avec `openclaw gateway --port <port>`.
- Sous un superviseur de service, un nouveau processus Gateway qui détecte un répondant `/healthz` existant et sain se termine avec succès et laisse ce processus garder le contrôle. Si le processus existant ne devient jamais sain, les nouvelles tentatives sont bornées et le démarrage échoue avec une erreur de verrouillage claire au lieu de boucler indéfiniment.
- L’app macOS conserve toujours son propre garde PID léger avant de lancer le Gateway ; le verrou d’exécution est appliqué par le fichier de verrouillage plus la liaison HTTP/WebSocket.

## Liens connexes

- [Gateways multiples](/fr/gateway/multiple-gateways) — exécuter plusieurs instances avec des ports uniques
- [Dépannage](/fr/gateway/troubleshooting) — diagnostiquer `EADDRINUSE` et les conflits de ports
