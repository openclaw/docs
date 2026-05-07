---
read_when:
    - Compiler ou déboguer des clients Node (mode Node iOS/Android/macOS)
    - Examiner les échecs d’appairage ou d’authentification du pont
    - Audit de la surface Node exposée par le Gateway
summary: 'Protocole de pont historique (nœuds hérités) : TCP JSONL, appariement, RPC à portée limitée'
title: Protocole de pont
x-i18n:
    generated_at: "2026-05-07T13:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Le pont TCP a été **supprimé**. Les versions actuelles d’OpenClaw n’incluent pas l’écouteur du pont et les clés de configuration `bridge.*` ne font plus partie du schéma. Cette page est conservée uniquement à titre de référence historique. Utilisez le [Gateway Protocol](/fr/gateway/protocol) pour tous les clients de nœud/opérateur.
</Warning>

## Pourquoi il existait

- **Limite de sécurité** : le pont expose une petite liste d’autorisations au lieu de
  toute la surface d’API du Gateway.
- **Appairage + identité du nœud** : l’admission des nœuds appartient au Gateway et est liée
  à un jeton par nœud.
- **UX de découverte** : les nœuds peuvent découvrir les Gateway via Bonjour sur le LAN, ou se connecter
  directement via un tailnet.
- **WS en loopback** : le plan de contrôle WS complet reste local sauf s’il est tunnelisé via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (lorsque `bridge.tls.enabled` vaut true).
- Le port d’écoute par défaut historique était `18790` (les versions actuelles ne démarrent pas de
  pont TCP).

Lorsque TLS est activé, les enregistrements TXT de découverte incluent `bridgeTls=1` plus
`bridgeTlsSha256` comme indice non secret. Notez que les enregistrements TXT Bonjour/mDNS ne sont
pas authentifiés ; les clients ne doivent pas considérer l’empreinte annoncée comme un
épinglage faisant autorité sans intention explicite de l’utilisateur ou autre vérification hors bande.

## Handshake + appairage

1. Le client envoie `hello` avec les métadonnées du nœud + le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, le Gateway répond `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. Le Gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

Historiquement, `hello-ok` renvoyait `serverName` ; les surfaces de Plugin hébergées sont désormais
annoncées via `pluginSurfaceUrls`. Canvas/A2UI utilise
`pluginSurfaceUrls.canvas` ; l’alias obsolète `canvasHostUrl` ne fait pas partie du
protocole refactorisé.

## Trames

Client → Gateway :

- `req` / `res` : RPC Gateway limitées au périmètre (chat, sessions, config, santé, voicewake, skills.bins)
- `event` : signaux du nœud (transcription vocale, requête d’agent, abonnement au chat, cycle de vie exec)

Gateway → Client :

- `invoke` / `invoke-res` : commandes du nœud (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event` : mises à jour de chat pour les sessions abonnées
- `ping` / `pong` : keepalive

L’application historique de la liste d’autorisations se trouvait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements de cycle de vie exec

Les nœuds peuvent émettre des événements `exec.finished` ou `exec.denied` pour exposer l’activité system.run.
Ils sont mappés à des événements système dans le Gateway. (Les anciens nœuds peuvent encore émettre `exec.started`.)

Champs de payload (tous facultatifs sauf indication contraire) :

- `sessionKey` (obligatoire) : session d’agent qui doit recevoir l’événement système.
- `runId` : identifiant exec unique pour le regroupement.
- `command` : chaîne de commande brute ou formatée.
- `exitCode`, `timedOut`, `success`, `output` : détails d’achèvement (uniquement pour finished).
- `reason` : raison du refus (uniquement pour denied).

## Utilisation historique du tailnet

- Liez le pont à une IP de tailnet : `bridge.bind: "tailnet"` dans
  `~/.openclaw/openclaw.json` (historique uniquement ; `bridge.*` n’est plus valide).
- Les clients se connectent via le nom MagicDNS ou l’IP de tailnet.
- Bonjour ne traverse **pas** les réseaux ; utilisez un hôte/port manuel ou DNS-SD étendu
  si nécessaire.

## Gestion des versions

Le pont était une **v1 implicite** (pas de négociation min/max). Cette section est
une référence historique uniquement ; les clients actuels de nœud/opérateur utilisent le WebSocket
[Gateway Protocol](/fr/gateway/protocol).

## Associés

- [Protocole Gateway](/fr/gateway/protocol)
- [Nœuds](/fr/nodes)
