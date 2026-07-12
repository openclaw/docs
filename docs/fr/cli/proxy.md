---
read_when:
    - Vous devez valider le routage du proxy géré par l’opérateur avant le déploiement
    - Vous devez capturer localement le trafic de transport d’OpenClaw à des fins de débogage.
    - Vous souhaitez inspecter les sessions du proxy de débogage, les blobs ou les préréglages de requête intégrés
summary: Référence de la CLI pour `openclaw proxy`, y compris la validation des proxys gérés par l’opérateur et l’inspecteur local des captures du proxy de débogage
title: Proxy
x-i18n:
    generated_at: "2026-07-12T15:16:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Validez le routage du proxy géré par l’opérateur, ou exécutez le proxy de débogage explicite local et inspectez le trafic capturé.

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

`validate` effectue les vérifications préalables d’un proxy direct géré par l’opérateur. Les autres commandes sont des outils de débogage destinés aux investigations au niveau du transport : démarrer un proxy local avec capture, exécuter une commande enfant par son intermédiaire, répertorier les sessions de capture, interroger les schémas de trafic, lire les blobs capturés et purger les données de capture locales.

## Validation

Vérifie l’URL effective du proxy géré par l’opérateur à partir de `--proxy-url`, de la configuration (`proxy.proxyUrl`) ou de `OPENCLAW_PROXY_URL`, dans cet ordre de priorité. Signale un problème de configuration si aucun proxy n’est activé et configuré ; transmettez `--proxy-url` pour une vérification préalable ponctuelle sans modifier la configuration.

Les URL de proxy géré utilisent `http://` pour un écouteur de proxy direct non chiffré, ou `https://` lorsque OpenClaw doit établir une connexion TLS avec le point de terminaison du proxy lui-même avant d’envoyer les requêtes au proxy. Utilisez `--proxy-ca-file` pour approuver une autorité de certification privée pour cette connexion TLS.

Par défaut, la commande effectue :

- une vérification **autorisée** sur `https://example.com/` (remplacez-la ou ajoutez-en avec `--allowed-url`, option répétable)
- une vérification **refusée** sur un canari temporaire en boucle locale (remplacez-la avec `--denied-url`, option répétable)

Les cibles `--denied-url` personnalisées appliquent un refus par défaut : les réponses HTTP comme les échecs de transport ambigus sont considérés comme des échecs, sauf si vous pouvez vérifier indépendamment un signal de refus propre au déploiement. Le canari en boucle locale intégré est la seule cible pour laquelle une erreur de transport est considérée comme une preuve de blocage.

Ajoutez `--apns-reachable` pour ouvrir également un tunnel CONNECT HTTP/2 vers APNs par l’intermédiaire du proxy et confirmer que l’environnement bac à sable d’APNs répond. La sonde envoie volontairement un jeton de fournisseur non valide ; une réponse APNs `403 InvalidProviderToken` est donc considérée comme un signal d’accessibilité positif, et non comme un échec.

### Options

| Option                   | Effet                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | affiche du JSON lisible par une machine                                                                                      |
| `--proxy-url <url>`      | valide cette URL de proxy `http://`/`https://` au lieu de la configuration ou de la variable d’environnement                 |
| `--proxy-ca-file <path>` | approuve ce fichier d’autorité de certification PEM pour la vérification TLS d’un point de terminaison de proxy HTTPS        |
| `--allowed-url <url>`    | destination censée réussir par l’intermédiaire du proxy (option répétable)                                                    |
| `--denied-url <url>`     | destination censée être bloquée par le proxy (option répétable)                                                              |
| `--apns-reachable`       | vérifie également que l’environnement bac à sable d’APNs est accessible en HTTP/2 par l’intermédiaire du proxy               |
| `--apns-authority <url>` | autorité APNs à sonder (par défaut `https://api.sandbox.push.apple.com` ; en production : `https://api.push.apple.com`)       |
| `--timeout-ms <ms>`      | délai d’expiration par requête                                                                                               |

Se termine avec le code 1 lorsque la configuration du proxy ou les vérifications des destinations échouent.

Consultez [Proxy réseau](/fr/security/network-proxy) pour obtenir des conseils de déploiement et connaître la sémantique des refus.

## Proxy de débogage

`start` lance un proxy local avec capture et affiche son URL, le chemin de son certificat d’autorité de certification et le chemin de la base de données de capture ; arrêtez-le avec Ctrl+C. Par défaut, il écoute sur `127.0.0.1`, sauf si `--host` est défini.

`run` démarre un proxy de débogage local, puis exécute `<cmd...>` (après `--`) avec les variables d’environnement du proxy appliquées, dans sa propre session de capture.

La redirection directe vers l’amont du proxy de débogage ouvre des sockets en amont à des fins de diagnostic. Lorsque le mode proxy géré d’OpenClaw est actif, la redirection directe des requêtes de proxy et des tunnels CONNECT est désactivée par défaut ; définissez `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` uniquement pour les diagnostics locaux approuvés.

`coverage` affiche un rapport JSON (`summary` et `entries` par transport) indiquant quels transports sont capturés, limités au proxy ou non couverts.

`sessions` répertorie les sessions de capture récentes (`--limit`, valeur par défaut : 20).

`query --preset <name>` exécute une requête intégrée sur le trafic capturé, avec une limitation facultative à `--session <id>`. Préréglages :

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` affiche le contenu brut d’un blob de charge utile capturé.

`purge` supprime toutes les métadonnées et tous les blobs du trafic capturé. Les captures sont des données de débogage locales ; purgez-les lorsque vous avez terminé.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Proxy réseau](/fr/security/network-proxy)
- [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)
