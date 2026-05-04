---
read_when:
    - Vous devez valider le routage du proxy géré par l’opérateur avant le déploiement
    - Vous devez capturer localement le trafic de transport d’OpenClaw à des fins de débogage
    - Vous souhaitez inspecter des sessions de proxy de débogage, des objets binaires ou des préréglages de requêtes intégrés
summary: Référence CLI pour `openclaw proxy`, incluant la validation du proxy géré par l’opérateur et l’inspecteur de capture du proxy de débogage local
title: Proxy
x-i18n:
    generated_at: "2026-05-04T07:03:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9589bedafb97c31bcb6536a04307cd0c6550e1f307693bd4401785d79f34a1eb
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valider le routage proxy géré par l'opérateur, ou exécuter le proxy de débogage explicite local
et inspecter le trafic capturé.

Utilisez `validate` pour contrôler en amont un proxy direct géré par l'opérateur avant d'activer
le routage proxy d'OpenClaw. Les autres commandes sont des outils de débogage pour
l'investigation au niveau du transport : elles peuvent démarrer un proxy local, exécuter une commande enfant
avec la capture activée, lister les sessions de capture, interroger les modèles de trafic courants, lire
les blobs capturés et purger les données de capture locales.

## Commandes

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Valider

`openclaw proxy validate` vérifie l'URL effective du proxy géré par l'opérateur depuis
`--proxy-url`, la configuration ou `OPENCLAW_PROXY_URL`. Elle signale un problème de configuration lorsqu'
aucun proxy n'est activé et configuré ; utilisez `--proxy-url` pour un contrôle en amont ponctuel
avant de modifier la configuration. Par défaut, elle vérifie qu'une destination publique réussit
via le proxy et que le proxy ne peut pas atteindre un canari loopback temporaire.
Les destinations refusées personnalisées échouent fermées : les réponses HTTP et les échecs de
transport ambigus échouent tous deux, sauf si vous pouvez vérifier séparément un signal de refus
spécifique au déploiement.

Options :

- `--json` : afficher du JSON lisible par machine.
- `--proxy-url <url>` : valider cette URL de proxy au lieu de la configuration ou de l'environnement.
- `--allowed-url <url>` : ajouter une destination censée réussir via le proxy. Répétez pour vérifier plusieurs destinations.
- `--denied-url <url>` : ajouter une destination censée être bloquée par le proxy. Répétez pour vérifier plusieurs destinations.
- `--timeout-ms <ms>` : délai d'expiration par requête en millisecondes.

Consultez [Proxy réseau](/fr/security/network-proxy) pour les conseils de déploiement et la sémantique
de refus.

## Préréglages de requête

`openclaw proxy query --preset <name>` accepte :

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Remarques

- `start` utilise `127.0.0.1` par défaut, sauf si `--host` est défini.
- `run` démarre un proxy de débogage local, puis exécute la commande après `--`.
- Le transfert direct vers l'amont du proxy de débogage ouvre des sockets amont à des fins de diagnostic. Lorsque le mode proxy géré d'OpenClaw est actif, le transfert direct pour les requêtes proxy et les tunnels CONNECT est désactivé par défaut ; définissez `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` uniquement pour les diagnostics locaux approuvés.
- `validate` se termine avec le code 1 lorsque la configuration du proxy ou les vérifications de destination échouent.
- Les captures sont des données de débogage locales ; utilisez `openclaw proxy purge` lorsque vous avez terminé.

## Connexe

- [Référence CLI](/fr/cli)
- [Proxy réseau](/fr/security/network-proxy)
- [Authentification de proxy approuvé](/fr/gateway/trusted-proxy-auth)
