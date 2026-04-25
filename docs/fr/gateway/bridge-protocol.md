---
read_when:
    - Création ou débogage de clients node (mode node iOS/Android/macOS)
    - Investigation des échecs d’appairage ou d’auth du pont
    - Audit de la surface node exposée par la passerelle
summary: 'Protocole de pont historique (nodes hérités) : TCP JSONL, appairage, RPC à portée limitée'
title: Protocole de pont
x-i18n:
    generated_at: "2026-04-25T13:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
Le pont TCP a été **supprimé**. Les versions actuelles d’OpenClaw n’incluent plus l’écouteur de pont et les clés de configuration `bridge.*` ne figurent plus dans le schéma. Cette page est conservée uniquement à titre de référence historique. Utilisez le [Protocole Gateway](/fr/gateway/protocol) pour tous les clients node/opérateur.
</Warning>

## Pourquoi il existait

- **Frontière de sécurité** : le pont expose une petite liste d’autorisation au lieu de la
  surface complète de l’API Gateway.
- **Appairage + identité du node** : l’admission du node est gérée par la passerelle et liée
  à un jeton par node.
- **UX de découverte** : les nodes peuvent découvrir des passerelles via Bonjour sur le LAN, ou se connecter
  directement via un tailnet.
- **WS loopback** : le plan de contrôle WS complet reste local sauf s’il est tunnelisé via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (lorsque `bridge.tls.enabled` vaut true).
- Le port d’écoute historique par défaut était `18790` (les versions actuelles ne démarrent pas de
  pont TCP).

Lorsque TLS est activé, les enregistrements TXT de découverte incluent `bridgeTls=1` ainsi que
`bridgeTlsSha256` comme indice non secret. Notez que les enregistrements TXT Bonjour/mDNS ne sont pas
authentifiés ; les clients ne doivent pas traiter l’empreinte annoncée comme un pin
faisant autorité sans intention explicite de l’utilisateur ou autre vérification hors bande.

## Handshake + appairage

1. Le client envoie `hello` avec les métadonnées du node + le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, la passerelle répond avec `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. La passerelle attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

Historiquement, `hello-ok` renvoyait `serverName` et pouvait inclure
`canvasHostUrl`.

## Trames

Client → Gateway :

- `req` / `res` : RPC Gateway à portée limitée (chat, sessions, config, health, voicewake, skills.bins)
- `event` : signaux du node (transcription vocale, requête d’agent, abonnement au chat, cycle de vie exec)

Gateway → Client :

- `invoke` / `invoke-res` : commandes du node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event` : mises à jour du chat pour les sessions abonnées
- `ping` / `pong` : keepalive

L’application historique de la liste d’autorisation se trouvait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie exec

Les nodes peuvent émettre des événements `exec.finished` ou `exec.denied` pour exposer l’activité de system.run.
Ceux-ci sont mappés à des événements système dans la passerelle. (Les nodes hérités peuvent encore émettre `exec.started`.)

Champs de charge utile (tous facultatifs sauf mention contraire) :

- `sessionKey` (obligatoire) : session d’agent qui doit recevoir l’événement système.
- `runId` : identifiant exec unique pour le regroupement.
- `command` : chaîne de commande brute ou formatée.
- `exitCode`, `timedOut`, `success`, `output` : détails d’achèvement (finished uniquement).
- `reason` : raison du refus (denied uniquement).

## Utilisation historique du tailnet

- Lier le pont à une IP tailnet : `bridge.bind: "tailnet"` dans
  `~/.openclaw/openclaw.json` (historique uniquement ; `bridge.*` n’est plus valide).
- Les clients se connectent via le nom MagicDNS ou l’IP tailnet.
- Bonjour **ne** traverse **pas** les réseaux ; utilisez un hôte/port manuel ou DNS‑SD étendu
  si nécessaire.

## Versionnement

Le pont était en **v1 implicite** (pas de négociation min/max). Cette section est
uniquement une référence historique ; les clients node/opérateur actuels utilisent le WebSocket
[Protocole Gateway](/fr/gateway/protocol).

## Lié

- [Protocole Gateway](/fr/gateway/protocol)
- [Nodes](/fr/nodes)
