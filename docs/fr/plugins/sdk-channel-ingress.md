---
read_when:
    - Création ou migration d’un plugin de canal de messagerie
    - Modification des listes d’autorisation des messages privés ou des groupes, des contrôles de routage, de l’autorisation des commandes, de l’autorisation des événements ou de l’activation par mention
    - Examen de la suppression des données sensibles à l’entrée des canaux ou des limites de compatibilité du SDK
sidebarTitle: Channel Ingress
summary: API expérimentale d’entrée de canal pour l’autorisation des messages entrants
title: API d’entrée des canaux
x-i18n:
    generated_at: "2026-07-12T15:41:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

L’entrée de canal est la limite expérimentale de contrôle d’accès pour les
événements de canal entrants. Les plugins gèrent les informations propres à la plateforme et les effets de bord ; le cœur gère
la politique générique : listes d’autorisation des messages privés/groupes, entrées de messages privés du magasin d’appairage, contrôles de route,
contrôles de commande, autorisation des événements, activation par mention, diagnostics expurgés et
admission.

Utilisez `openclaw/plugin-sdk/channel-ingress-runtime` pour les nouveaux chemins de réception. L’ancien
sous-chemin `openclaw/plugin-sdk/channel-ingress` reste exporté en tant que
façade de compatibilité obsolète pour les plugins tiers.

## Résolveur d’exécution

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

Ne précalculez pas les listes d’autorisation effectives, les propriétaires de commandes ni les groupes de commandes.
Le résolveur les déduit des listes d’autorisation brutes, des rappels du magasin, des descripteurs
de route, des groupes d’accès, de la politique et du type de conversation.

## Résultat

Les plugins intégrés doivent consommer directement les projections modernes :

| Champ              | Signification                                                               |
| ------------------ | --------------------------------------------------------------------------- |
| `ingress`          | décision ordonnée des contrôles et admission                                |
| `senderAccess`     | autorisation de l’expéditeur et de la conversation uniquement               |
| `routeAccess`      | projection de la route et de l’expéditeur de la route                       |
| `commandAccess`    | autorisation de commande ; `requested: false` si aucun contrôle n’a été exécuté |
| `activationAccess` | résultat de la mention ou de l’activation                                    |

L’autorisation des événements reste disponible dans le graphe ordonné `ingress.graph` et dans le
code de motif décisif `ingress.reasonCode` ; aucune projection d’événement distincte n’est émise.

Les assistants obsolètes du SDK tiers peuvent reconstruire d’anciennes structures en interne. Les nouveaux
chemins de réception intégrés ne doivent pas reconvertir les résultats modernes en
DTO locaux.

## Groupes d’accès

Les entrées `accessGroup:<name>` restent expurgées. Le cœur résout lui-même les groupes statiques
`message.senders` et appelle `resolveAccessGroupMembership` uniquement
pour les groupes dynamiques qui nécessitent une recherche sur la plateforme. Les groupes absents, non pris en charge ou
en échec sont refusés par défaut.

## Modes d’événement

| `authMode`       | Signification                                                      |
| ---------------- | ------------------------------------------------------------------ |
| `inbound`        | contrôles normaux de l’expéditeur entrant                          |
| `command`        | contrôles de commande pour les rappels ou les boutons à portée limitée |
| `origin-subject` | l’acteur doit correspondre au sujet du message d’origine           |
| `route-only`     | contrôles de route uniquement pour les événements fiables propres à une route |
| `none`           | les événements internes gérés par le plugin contournent l’autorisation partagée |

Utilisez `mayPair: false` pour les réactions, les boutons, les rappels et les commandes natives.

## Routes et activation

Utilisez des descripteurs de route pour les politiques de salle, de sujet, de guilde, de fil ou de route imbriquée :

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

Utilisez `channelIngressRoutes(...)` lorsqu’un plugin comporte plusieurs descripteurs de route
facultatifs ; cette fonction filtre les branches désactivées tout en conservant des informations de route génériques
et ordonnées selon la `precedence` de chaque descripteur.

Le contrôle des mentions est un contrôle d’activation. L’absence de mention renvoie
`admission: "skip"` afin que le noyau de tour ne traite pas un tour limité à l’observation.
La plupart des canaux doivent placer l’activation après les contrôles de l’expéditeur et des commandes. Les surfaces
de discussion publiques qui doivent réduire au silence le trafic sans mention avant le bruit généré par la liste d’autorisation
des expéditeurs peuvent choisir `activation.order: "before-sender"` lorsque le contournement
par commande textuelle est désactivé. Les canaux dotés d’une activation implicite, comme les réponses dans les fils
du bot, peuvent transmettre `activation.allowedImplicitMentionKinds` ; la projection
`activationAccess.shouldBypassMention` indique alors quand une commande ou une activation
implicite a contourné une mention explicite.

## Expurgation

Les valeurs brutes des expéditeurs et les entrées brutes des listes d’autorisation servent uniquement d’entrées au résolveur. Elles
ne doivent pas apparaître dans l’état résolu, les décisions, les diagnostics, les instantanés ni les
données de compatibilité. Utilisez des identifiants opaques de sujet, d’entrée, de route et de
diagnostic.

## Vérification

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
