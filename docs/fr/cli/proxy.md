---
read_when:
    - Vous devez valider le routage proxy géré par l’opérateur avant le déploiement
    - Vous devez capturer le trafic de transport d’OpenClaw localement pour le débogage
    - Vous voulez inspecter les sessions de proxy de débogage, les blobs ou les préréglages de requête intégrés
summary: Référence CLI pour `openclaw proxy`, incluant la validation du proxy géré par l’opérateur et l’inspecteur de capture du proxy de débogage local
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:20:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validez le routage proxy géré par l’opérateur, ou exécutez le proxy de débogage explicite local
et inspectez le trafic capturé.

Utilisez `validate` pour précontrôler un proxy direct géré par l’opérateur avant d’activer
le routage proxy OpenClaw. Les autres commandes sont des outils de débogage pour
l’investigation au niveau transport : elles peuvent démarrer un proxy local, exécuter une commande enfant
avec la capture activée, lister les sessions de capture, interroger les modèles de trafic courants, lire
les blobs capturés et purger les données de capture locales.

## Commandes

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validation

`openclaw proxy validate` vérifie l’URL de proxy effective gérée par l’opérateur depuis
`--proxy-url`, la configuration ou `OPENCLAW_PROXY_URL`. Les URL de proxy gérées peuvent utiliser
`http://` pour un écouteur de proxy direct en clair ou `https://` lorsque OpenClaw doit
ouvrir TLS vers le point de terminaison du proxy avant d’envoyer les requêtes proxy. La commande signale un
problème de configuration lorsqu’aucun proxy n’est activé et configuré ; utilisez `--proxy-url` pour un
précontrôle ponctuel avant de modifier la configuration. Ajoutez `--proxy-ca-file` pour faire confiance à une
CA privée pour la connexion TLS vers un point de terminaison de proxy HTTPS. Par défaut, elle
vérifie qu’une destination publique réussit via le proxy et que le proxy
ne peut pas atteindre un canari loopback temporaire. Les destinations refusées personnalisées
échouent en mode fermé : les réponses HTTP et les échecs de transport ambigus échouent tous deux, sauf si
vous pouvez vérifier séparément un signal de refus propre au déploiement. Ajoutez
`--apns-reachable` pour ouvrir également un tunnel CONNECT HTTP/2 APNs via le proxy
et confirmer que le bac à sable APNs répond ; la sonde utilise un jeton de fournisseur volontairement invalide,
donc une réponse APNs `403 InvalidProviderToken` constitue un signal de joignabilité réussi.

Options :

- `--json` : affiche du JSON lisible par machine.
- `--proxy-url <url>` : valide cette URL de proxy `http://` ou `https://` au lieu de la configuration ou de l’environnement.
- `--proxy-ca-file <path>` : fait confiance à ce fichier CA PEM pour la vérification TLS d’un point de terminaison de proxy HTTPS.
- `--allowed-url <url>` : ajoute une destination censée réussir via le proxy. Répétez pour vérifier plusieurs destinations.
- `--denied-url <url>` : ajoute une destination censée être bloquée par le proxy. Répétez pour vérifier plusieurs destinations.
- `--apns-reachable` : vérifie aussi que le bac à sable APNs HTTP/2 est joignable via le proxy.
- `--apns-authority <url>` : autorité APNs à sonder avec `--apns-reachable` (`https://api.sandbox.push.apple.com` par défaut ; la production est `https://api.push.apple.com`).
- `--timeout-ms <ms>` : délai d’expiration par requête en millisecondes.

Consultez [Proxy réseau](/fr/security/network-proxy) pour les conseils de déploiement et la sémantique de refus.

## Préréglages de requête

`openclaw proxy query --preset <name>` accepte :

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notes

- `start` utilise `127.0.0.1` par défaut sauf si `--host` est défini.
- `run` démarre un proxy de débogage local puis exécute la commande après `--`.
- Le transfert direct vers l’amont du proxy de débogage ouvre des sockets amont pour le diagnostic. Lorsque le mode proxy géré OpenClaw est actif, le transfert direct des requêtes proxy et des tunnels CONNECT est désactivé par défaut ; définissez `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` uniquement pour des diagnostics locaux approuvés.
- `validate` se termine avec le code 1 lorsque la configuration du proxy ou les vérifications de destination échouent.
- Les captures sont des données de débogage locales ; utilisez `openclaw proxy purge` lorsque vous avez terminé.

## Connexe

- [Référence CLI](/fr/cli)
- [Proxy réseau](/fr/security/network-proxy)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)
