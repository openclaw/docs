---
read_when:
    - Vous devez valider le routage du proxy géré par l’opérateur avant le déploiement
    - Vous devez capturer localement le trafic de transport d’OpenClaw à des fins de débogage.
    - Vous souhaitez inspecter les sessions du proxy de débogage, les blobs ou les préréglages de requête intégrés
summary: Référence de la CLI pour `openclaw proxy`, notamment la validation des proxys gérés par l’opérateur et l’inspecteur local de capture du proxy de débogage
title: Proxy
x-i18n:
    generated_at: "2026-07-12T02:44:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validez le routage via un proxy géré par l’opérateur, ou exécutez le proxy de débogage explicite local et inspectez le trafic capturé.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` effectue les vérifications préalables d’un proxy direct géré par l’opérateur. Les autres commandes sont des outils de débogage destinés aux investigations au niveau du transport : démarrer un proxy local avec capture, exécuter une commande enfant via celui-ci, répertorier les sessions de capture, interroger les schémas de trafic, lire les objets binaires capturés et purger les données de capture locales.

## Validation

Vérifie l’URL effective du proxy géré par l’opérateur provenant de `--proxy-url`, de la configuration (`proxy.proxyUrl`) ou de `OPENCLAW_PROXY_URL`, dans cet ordre de priorité. Signale un problème de configuration si aucun proxy n’est activé et configuré ; transmettez `--proxy-url` pour effectuer une vérification préalable ponctuelle sans modifier la configuration.

Les URL de proxy géré utilisent `http://` pour un service d’écoute de proxy direct non chiffré, ou `https://` lorsqu’OpenClaw doit établir une connexion TLS avec le point de terminaison du proxy lui-même avant d’envoyer les requêtes de proxy. Utilisez `--proxy-ca-file` pour approuver une autorité de certification privée pour cette connexion TLS.

Par défaut, la commande effectue :

- une vérification **autorisée** sur `https://example.com/` (remplacez-la ou ajoutez-en avec `--allowed-url`, option répétable)
- une vérification **refusée** sur une adresse sentinelle temporaire de local loopback (remplacez-la avec `--denied-url`, option répétable)

Les cibles `--denied-url` personnalisées suivent un principe de fermeture en cas d’échec : les réponses HTTP et les échecs de transport ambigus sont tous considérés comme des échecs, sauf si vous pouvez vérifier indépendamment un signal de refus propre au déploiement. L’adresse sentinelle local loopback intégrée est la seule cible pour laquelle une erreur de transport est considérée comme une preuve de blocage.

Ajoutez `--apns-reachable` pour ouvrir également un tunnel CONNECT HTTP/2 APNs via le proxy et confirmer que l’environnement de test APNs répond. La sonde envoie intentionnellement un jeton de fournisseur non valide ; une réponse APNs `403 InvalidProviderToken` est donc considérée comme un signal d’accessibilité positif, et non comme un échec.

### Options

| Option                   | Effet                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | affiche du JSON exploitable par une machine                                                                                        |
| `--proxy-url <url>`      | valide cette URL de proxy `http://`/`https://` au lieu de celle de la configuration ou de l’environnement                          |
| `--proxy-ca-file <path>` | approuve ce fichier d’autorité de certification PEM pour la vérification TLS d’un point de terminaison de proxy HTTPS              |
| `--allowed-url <url>`    | destination censée aboutir via le proxy (option répétable)                                                                         |
| `--denied-url <url>`     | destination censée être bloquée par le proxy (option répétable)                                                                    |
| `--apns-reachable`       | vérifie également que l’environnement de test APNs est accessible en HTTP/2 via le proxy                                           |
| `--apns-authority <url>` | autorité APNs à sonder (par défaut `https://api.sandbox.push.apple.com` ; en production : `https://api.push.apple.com`)             |
| `--timeout-ms <ms>`      | délai d’expiration par requête                                                                                                     |

Se termine avec le code 1 lorsque la configuration du proxy ou les vérifications des destinations échouent.

Consultez [Proxy réseau](/fr/security/network-proxy) pour obtenir des recommandations de déploiement et connaître la sémantique des refus.

## Proxy de débogage

`start` lance un proxy local avec capture et affiche son URL, le chemin du certificat de l’autorité de certification et le chemin de la base de données de capture ; arrêtez-le avec Ctrl+C. Par défaut, il écoute sur `127.0.0.1`, sauf si `--host` est défini.

`run` démarre un proxy de débogage local, puis exécute `<cmd...>` (après `--`) avec les variables d’environnement du proxy appliquées, dans sa propre session de capture.

La transmission directe en amont du proxy de débogage ouvre des sockets en amont à des fins de diagnostic. Lorsque le mode de proxy géré d’OpenClaw est actif, la transmission directe des requêtes de proxy et des tunnels CONNECT est désactivée par défaut ; définissez `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` uniquement pour des diagnostics locaux approuvés.

`coverage` affiche un rapport JSON (`summary` et `entries` par transport) indiquant quels transports sont capturés, utilisables uniquement via le proxy ou non couverts.

`sessions` répertorie les sessions de capture récentes (`--limit`, 20 par défaut).

`query --preset <name>` exécute une requête intégrée sur le trafic capturé, éventuellement limitée à `--session <id>`. Préréglages :

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` affiche le contenu brut d’un objet binaire de charge utile capturé.

`purge` supprime toutes les métadonnées et tous les objets binaires du trafic capturé. Les captures sont des données de débogage locales ; purgez-les lorsque vous avez terminé.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Proxy réseau](/fr/security/network-proxy)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)
