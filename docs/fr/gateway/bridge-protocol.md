---
read_when:
    - Création ou débogage de clients Node (mode Node iOS/Android/macOS)
    - Diagnostiquer les échecs d’appairage ou d’authentification du pont
    - Audit de la surface Node exposée par le Gateway
summary: 'Protocole de pont historique (nœuds hérités) : TCP JSONL, appairage, RPC à portée limitée'
title: Protocole de pont
x-i18n:
    generated_at: "2026-05-06T17:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Le pont TCP a été **supprimé**. Les versions actuelles d’OpenClaw n’incluent pas le listener du pont et les clés de configuration `bridge.*` ne figurent plus dans le schéma. Cette page est conservée uniquement à titre de référence historique. Utilisez le [Protocole Gateway](/fr/gateway/protocol) pour tous les clients nœud/opérateur.
</Warning>

## Pourquoi il existait

- **Limite de sécurité** : le pont expose une petite liste d’autorisation au lieu de
  toute la surface d’API du Gateway.
- **Appairage + identité du nœud** : l’admission des nœuds est gérée par le Gateway et liée
  à un jeton par nœud.
- **UX de découverte** : les nœuds peuvent découvrir les Gateway via Bonjour sur le LAN, ou se connecter
  directement via un tailnet.
- **WS en local loopback** : le plan de contrôle WS complet reste local, sauf s’il est tunnelisé via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (quand `bridge.tls.enabled` vaut true).
- Le port d’écoute historique par défaut était `18790` (les versions actuelles ne démarrent pas de
  pont TCP).

Quand TLS est activé, les enregistrements TXT de découverte incluent `bridgeTls=1` plus
`bridgeTlsSha256` comme indication non secrète. Notez que les enregistrements TXT Bonjour/mDNS ne sont
pas authentifiés ; les clients ne doivent pas traiter l’empreinte annoncée comme un
ancrage faisant autorité sans intention explicite de l’utilisateur ou autre vérification hors bande.

## Handshake + appairage

1. Le client envoie `hello` avec les métadonnées du nœud + le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, le Gateway répond `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. Le Gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

Historiquement, `hello-ok` renvoyait `serverName` et pouvait inclure
`canvasHostUrl`.

## Trames

Client → Gateway :

- `req` / `res` : RPC Gateway à portée limitée (chat, sessions, config, santé, voicewake, skills.bins)
- `event` : signaux du nœud (transcription vocale, demande d’agent, abonnement au chat, cycle de vie exec)

Gateway → Client :

- `invoke` / `invoke-res` : commandes du nœud (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event` : mises à jour du chat pour les sessions abonnées
- `ping` / `pong` : keepalive

L’application de l’ancienne liste d’autorisation se trouvait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie exec

Les nœuds peuvent émettre des événements `exec.finished` ou `exec.denied` pour exposer l’activité system.run.
Ils sont mappés à des événements système dans le Gateway. (Les nœuds hérités peuvent encore émettre `exec.started`.)

Champs de payload (tous facultatifs sauf indication contraire) :

- `sessionKey` (obligatoire) : session d’agent qui recevra l’événement système.
- `runId` : identifiant exec unique pour le regroupement.
- `command` : chaîne de commande brute ou formatée.
- `exitCode`, `timedOut`, `success`, `output` : détails d’achèvement (terminé uniquement).
- `reason` : raison du refus (refusé uniquement).

## Utilisation historique du tailnet

- Lier le pont à une IP de tailnet : `bridge.bind: "tailnet"` dans
  `~/.openclaw/openclaw.json` (historique uniquement ; `bridge.*` n’est plus valide).
- Les clients se connectent via un nom MagicDNS ou une IP de tailnet.
- Bonjour ne traverse **pas** les réseaux ; utilisez un hôte/port manuel ou DNS-SD étendu
  si nécessaire.

## Versionnement

Le pont était en **v1 implicite** (aucune négociation min/max). Cette section est
une référence historique uniquement ; les clients nœud/opérateur actuels utilisent le WebSocket
[Protocole Gateway](/fr/gateway/protocol).

## Associé

- [Protocole Gateway](/fr/gateway/protocol)
- [Nœuds](/fr/nodes)
