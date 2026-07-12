---
read_when:
    - Examen de l’ancien code client Node ou des journaux d’appairage archivés
    - Audit de ce que l’ancienne interface Node exposait auparavant
summary: 'Protocole de passerelle historique (nœuds hérités) : JSONL sur TCP, appairage, RPC à portée limitée'
title: Protocole de pont
x-i18n:
    generated_at: "2026-07-12T02:37:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Le pont TCP a été **supprimé**. Les versions actuelles d’OpenClaw ne fournissent plus l’écouteur du pont, et les clés de configuration `bridge.*` ne figurent plus dans le schéma. Cette page est fournie uniquement à titre de référence historique. Utilisez le [protocole Gateway](/fr/gateway/protocol) pour tous les clients de nœud ou d’opérateur.
</Warning>

## Pourquoi il existait

- **Périmètre de sécurité** : il exposait une petite liste d’autorisation plutôt que l’intégralité de la surface de l’API Gateway.
- **Appairage et identité du nœud** : l’admission des nœuds était gérée par le Gateway et liée à un jeton propre à chaque nœud.
- **Expérience de découverte** : les nœuds pouvaient découvrir les Gateway via Bonjour sur le réseau local, ou se connecter directement sur un tailnet.
- **WebSocket sur local loopback** : l’intégralité du plan de contrôle WebSocket restait locale, sauf en cas de tunnel via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (`bridge.tls.enabled: true`).
- Le port d’écoute par défaut était `18790`.

Lorsque TLS était activé, les enregistrements TXT de découverte incluaient `bridgeTls=1` ainsi que `bridgeTlsSha256` comme indication non secrète. Les enregistrements TXT Bonjour/mDNS ne sont pas authentifiés ; les clients ne pouvaient donc pas considérer l’empreinte annoncée comme une valeur d’ancrage faisant autorité sans autre vérification hors bande.

## Établissement de la connexion et appairage

1. Le client envoie `hello` avec les métadonnées du nœud et le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, le Gateway répond par `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. Le Gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

`hello-ok` renvoyait auparavant `serverName` ; les surfaces de Plugin hébergées sont désormais annoncées via `pluginSurfaceUrls` dans le protocole Gateway actuel (Canvas/A2UI utilise `pluginSurfaceUrls.canvas`).

## Trames

Du client vers le Gateway :

- `req` / `res` : RPC Gateway à portée limitée (discussion, sessions, configuration, état de santé, réveil vocal, skills.bins).
- `event` : signaux du nœud (transcription vocale, requête de l’agent, abonnement à la discussion, cycle de vie de l’exécution).

Du Gateway vers le client :

- `invoke` / `invoke-res` : commandes du nœud (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event` : mises à jour de discussion pour les sessions suivies.
- `ping` / `pong` : maintien de la connexion.

L’application de la liste d’autorisation se trouvait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie de l’exécution

Les nœuds émettaient `exec.finished` pour signaler la fin d’une activité `system.run`, convertie en événements système par le Gateway (les anciens nœuds pouvaient également émettre `exec.started`). `exec.denied` indiquait qu’une tentative `system.run` refusée constituait un refus définitif, sans mise en file d’attente d’un événement système ni réveil du travail de l’agent.

Champs de la charge utile (tous facultatifs sauf indication contraire) :

| Champ                            | Remarques                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `sessionKey`                     | Obligatoire. Session de l’agent pour la corrélation des événements et, pour `exec.finished`, la remise de l’événement système. |
| `runId`                          | Identifiant d’exécution unique pour le regroupement.                                                                     |
| `command`                        | Chaîne de commande brute ou mise en forme.                                                                               |
| `exitCode`, `timedOut`, `output` | Détails d’achèvement (uniquement en cas de fin).                                                                          |
| `reason`                         | Motif du refus (uniquement en cas de refus).                                                                              |

## Utilisation historique du tailnet

- Liez le pont à une adresse IP du tailnet : `bridge.bind: "tailnet"` dans `~/.openclaw/openclaw.json` (usage historique uniquement ; `bridge.*` n’est plus une configuration valide).
- Les clients se connectaient via un nom MagicDNS ou une adresse IP du tailnet.
- Bonjour ne traverse pas les réseaux ; un DNS-SD étendu ou un hôte et un port configurés manuellement étaient donc nécessaires.

## Gestion des versions

Le pont utilisait implicitement la version 1, sans négociation de version minimale ou maximale. Les clients de nœud ou d’opérateur actuels utilisent le [protocole Gateway](/fr/gateway/protocol) WebSocket, qui négocie une plage de versions du protocole.

## Voir aussi

- [Protocole Gateway](/fr/gateway/protocol)
- [Nœuds](/fr/nodes)
