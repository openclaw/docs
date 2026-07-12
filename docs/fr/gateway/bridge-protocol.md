---
read_when:
    - Examen de l’ancien code client Node ou des journaux d’appairage archivés
    - Audit de ce que l’ancienne surface Node exposait auparavant
summary: 'Protocole de pont historique (nœuds hérités) : JSONL sur TCP, appairage, RPC à portée limitée'
title: Protocole de pont
x-i18n:
    generated_at: "2026-07-12T15:16:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Le pont TCP a été **supprimé**. Les versions actuelles d’OpenClaw n’incluent plus le processus d’écoute du pont, et les clés de configuration `bridge.*` ne figurent plus dans le schéma. Cette page est fournie uniquement à titre de référence historique. Utilisez le [protocole du Gateway](/fr/gateway/protocol) pour tous les clients de nœud ou d’opérateur.
</Warning>

## Pourquoi il existait

- **Périmètre de sécurité** : il exposait une petite liste d’autorisations au lieu de toute la surface d’API du Gateway.
- **Appairage et identité du nœud** : l’admission des nœuds était gérée par le Gateway et liée à un jeton propre à chaque nœud.
- **Expérience de découverte** : les nœuds pouvaient découvrir les Gateway via Bonjour sur le réseau local, ou se connecter directement sur un réseau Tailscale.
- **WebSocket en boucle locale** : l’ensemble du plan de contrôle WebSocket restait local, sauf s’il était acheminé par un tunnel SSH.

## Transport

- TCP, avec un objet JSON par ligne (JSONL).
- TLS facultatif (`bridge.tls.enabled: true`).
- Le port d’écoute par défaut était `18790`.

Lorsque TLS était activé, les enregistrements TXT de découverte incluaient `bridgeTls=1` ainsi que `bridgeTlsSha256` comme indication non secrète. Les enregistrements TXT Bonjour/mDNS ne sont pas authentifiés ; les clients ne pouvaient pas considérer l’empreinte annoncée comme une valeur de référence faisant autorité sans autre vérification hors bande.

## Établissement de la connexion et appairage

1. Le client envoie `hello` avec les métadonnées du nœud et le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, le Gateway répond par `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. Le Gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

`hello-ok` renvoyait auparavant `serverName` ; les surfaces de Plugin hébergées sont désormais annoncées via `pluginSurfaceUrls` dans le protocole actuel du Gateway (Canvas/A2UI utilise `pluginSurfaceUrls.canvas`).

## Trames

Du client vers le Gateway :

- `req` / `res` : RPC du Gateway à portée limitée (discussion, sessions, configuration, état de santé, activation vocale, skills.bins).
- `event` : signaux du nœud (transcription vocale, requête de l’agent, abonnement à la discussion, cycle de vie de l’exécution).

Du Gateway vers le client :

- `invoke` / `invoke-res` : commandes du nœud (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event` : mises à jour de discussion pour les sessions suivies.
- `ping` / `pong` : maintien de la connexion.

L’application de la liste d’autorisations se trouvait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie de l’exécution

Les nœuds émettaient `exec.finished` pour signaler l’achèvement d’une activité `system.run`, convertie en événements système par le Gateway (les anciens nœuds pouvaient également émettre `exec.started`). `exec.denied` marquait une tentative `system.run` refusée comme un refus définitif, sans mettre en file d’attente un événement système ni déclencher le travail de l’agent.

Champs de la charge utile (tous facultatifs, sauf indication contraire) :

| Champ                            | Remarques                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Obligatoire. Session de l’agent pour la corrélation de l’événement et, pour `exec.finished`, la remise de l’événement système. |
| `runId`                          | Identifiant d’exécution unique pour le regroupement.                                                               |
| `command`                        | Chaîne de commande brute ou mise en forme.                                                                         |
| `exitCode`, `timedOut`, `output` | Détails d’achèvement (uniquement en cas d’exécution terminée).                                                      |
| `reason`                         | Motif du refus (uniquement en cas de refus).                                                                        |

## Utilisation historique sur un réseau Tailscale

- Liez le pont à une adresse IP du réseau Tailscale : `bridge.bind: "tailnet"` dans `~/.openclaw/openclaw.json` (usage historique uniquement ; `bridge.*` n’est plus une configuration valide).
- Les clients se connectaient via un nom MagicDNS ou une adresse IP du réseau Tailscale.
- Bonjour ne traverse pas les réseaux ; un DNS-SD étendu ou un hôte et un port définis manuellement étaient autrement nécessaires.

## Gestion des versions

Le pont utilisait implicitement la version 1, sans négociation des versions minimale et maximale. Les clients actuels de nœud ou d’opérateur utilisent le [protocole WebSocket du Gateway](/fr/gateway/protocol), qui négocie une plage de versions du protocole.

## Voir aussi

- [Protocole du Gateway](/fr/gateway/protocol)
- [Nœuds](/fr/nodes)
