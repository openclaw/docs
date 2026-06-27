---
read_when:
    - Création ou débogage de clients Node (mode nœud iOS/Android/macOS)
    - Recherche des échecs d’authentification de couplage ou de pont
    - Audit de la surface Node exposée par le Gateway
summary: 'Protocole de pont historique (nœuds hérités) : TCP JSONL, appairage, RPC à portée limitée'
title: Protocole de pont
x-i18n:
    generated_at: "2026-06-27T17:28:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Le pont TCP a été **supprimé**. Les builds OpenClaw actuels ne livrent plus l’écouteur du pont et les clés de configuration `bridge.*` ne figurent plus dans le schéma. Cette page est conservée uniquement à titre de référence historique. Utilisez le [protocole Gateway](/fr/gateway/protocol) pour tous les clients nœud/opérateur.
</Warning>

## Pourquoi il existait

- **Frontière de sécurité** : le pont expose une petite liste d’autorisation au lieu de
  toute la surface de l’API Gateway.
- **Appairage + identité du nœud** : l’admission des nœuds est gérée par la Gateway et liée
  à un jeton propre à chaque nœud.
- **UX de découverte** : les nœuds peuvent découvrir les Gateway via Bonjour sur le LAN, ou se connecter
  directement sur un tailnet.
- **WS en loopback** : le plan de contrôle WS complet reste local sauf s’il est tunnelé via SSH.

## Transport

- TCP, un objet JSON par ligne (JSONL).
- TLS facultatif (lorsque `bridge.tls.enabled` vaut true).
- Le port d’écoute par défaut historique était `18790` (les builds actuels ne démarrent pas de
  pont TCP).

Lorsque TLS est activé, les enregistrements TXT de découverte incluent `bridgeTls=1` plus
`bridgeTlsSha256` comme indice non secret. Notez que les enregistrements TXT Bonjour/mDNS ne sont
pas authentifiés ; les clients ne doivent pas traiter l’empreinte annoncée comme un
ancrage faisant autorité sans intention explicite de l’utilisateur ou autre vérification hors bande.

## Handshake + appairage

1. Le client envoie `hello` avec les métadonnées du nœud + le jeton (s’il est déjà appairé).
2. S’il n’est pas appairé, la Gateway répond `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Le client envoie `pair-request`.
4. La Gateway attend l’approbation, puis envoie `pair-ok` et `hello-ok`.

Historiquement, `hello-ok` renvoyait `serverName` ; les surfaces de Plugin hébergées sont maintenant
annoncées via `pluginSurfaceUrls`. Canvas/A2UI utilise
`pluginSurfaceUrls.canvas` ; l’alias obsolète `canvasHostUrl` ne fait pas partie du
protocole refactorisé.

## Trames

Client → Gateway :

- `req` / `res` : RPC Gateway à portée limitée (chat, sessions, config, santé, voicewake, skills.bins)
- `event` : signaux de nœud (transcription vocale, demande d’agent, abonnement au chat, cycle de vie d’exécution)

Gateway → Client :

- `invoke` / `invoke-res` : commandes de nœud (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event` : mises à jour de chat pour les sessions abonnées
- `ping` / `pong` : keepalive

L’application historique de la liste d’autorisation vivait dans `src/gateway/server-bridge.ts` (supprimé).

## Événements du cycle de vie d’exécution

Les nœuds peuvent émettre des événements `exec.finished` pour exposer l’activité `system.run` terminée.
Ils sont mappés vers des événements système dans la Gateway. (Les nœuds historiques peuvent encore émettre `exec.started`.)
Les nœuds peuvent émettre `exec.denied` pour les tentatives `system.run` refusées ; la Gateway accepte
l’événement comme un refus terminal et ne met pas en file d’attente d’événement système ni ne réveille le travail d’agent.

Champs de charge utile (tous facultatifs sauf indication contraire) :

- `sessionKey` (obligatoire) : session d’agent pour la corrélation des événements et, pour
  `exec.finished`, la livraison d’événements système.
- `runId` : identifiant d’exécution unique pour le regroupement.
- `command` : chaîne de commande brute ou formatée.
- `exitCode`, `timedOut`, `success`, `output` : détails d’achèvement (terminé uniquement).
- `reason` : raison du refus (refusé uniquement).

## Utilisation historique du tailnet

- Liez le pont à une IP de tailnet : `bridge.bind: "tailnet"` dans
  `~/.openclaw/openclaw.json` (historique uniquement ; `bridge.*` n’est plus valide).
- Les clients se connectent via le nom MagicDNS ou l’IP du tailnet.
- Bonjour ne traverse **pas** les réseaux ; utilisez un hôte/port manuel ou DNS-SD étendu
  si nécessaire.

## Versionnement

Le pont était en **v1 implicite** (aucune négociation min/max). Cette section est
uniquement une référence historique ; les clients nœud/opérateur actuels utilisent le WebSocket
[protocole Gateway](/fr/gateway/protocol).

## Connexe

- [Protocole Gateway](/fr/gateway/protocol)
- [Nœuds](/fr/nodes)
