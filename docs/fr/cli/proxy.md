---
read_when:
    - Vous devez valider le routage du proxy géré par l’opérateur avant le déploiement
    - Vous devez capturer le trafic de transport OpenClaw localement pour le débogage
    - Vous voulez inspecter des sessions de proxy de débogage, des blobs ou des préréglages de requêtes intégrés
summary: Référence CLI pour `openclaw proxy`, incluant la validation du proxy géré par l’opérateur et l’inspecteur de capture du proxy de débogage local
title: Proxy
x-i18n:
    generated_at: "2026-05-01T07:13:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validez le routage proxy géré par l’opérateur, ou exécutez le proxy de débogage explicite local
et inspectez le trafic capturé.

Utilisez `validate` pour vérifier en amont un proxy de transfert géré par l’opérateur avant d’activer
le routage proxy d’OpenClaw. Les autres commandes sont des outils de débogage pour
l’investigation au niveau du transport : elles peuvent démarrer un proxy local, exécuter une commande enfant
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

## Validation

`openclaw proxy validate` vérifie l’URL effective du proxy géré par l’opérateur à partir de
`--proxy-url`, de la configuration ou de `OPENCLAW_PROXY_URL`. Il signale un problème de configuration lorsque
aucun proxy n’est activé et configuré ; utilisez `--proxy-url` pour une vérification ponctuelle
avant de modifier la configuration. Par défaut, il vérifie qu’une destination publique réussit
via le proxy et que le proxy ne peut pas atteindre un canari loopback temporaire.
Les destinations refusées personnalisées échouent en mode fermé : les réponses HTTP et les échecs de transport
ambigus échouent tous deux, sauf si vous pouvez vérifier séparément un signal de refus propre au déploiement.

Options :

- `--json` : afficher du JSON lisible par machine.
- `--proxy-url <url>` : valider cette URL de proxy au lieu de la configuration ou de l’environnement.
- `--allowed-url <url>` : ajouter une destination censée réussir via le proxy. Répétez pour vérifier plusieurs destinations.
- `--denied-url <url>` : ajouter une destination censée être bloquée par le proxy. Répétez pour vérifier plusieurs destinations.
- `--timeout-ms <ms>` : délai d’expiration par requête en millisecondes.

Consultez [Proxy réseau](/fr/security/network-proxy) pour les recommandations de déploiement et la sémantique
de refus.

## Préréglages de requête

`openclaw proxy query --preset <name>` accepte :

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Notes

- `start` utilise `127.0.0.1` par défaut, sauf si `--host` est défini.
- `run` démarre un proxy de débogage local, puis exécute la commande après `--`.
- `validate` quitte avec le code 1 lorsque la configuration du proxy ou les vérifications de destination échouent.
- Les captures sont des données de débogage locales ; utilisez `openclaw proxy purge` lorsque vous avez terminé.

## Connexe

- [Référence CLI](/fr/cli)
- [Proxy réseau](/fr/security/network-proxy)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)
