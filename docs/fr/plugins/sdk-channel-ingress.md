---
read_when:
    - Création ou migration d’un plugin de canal de messagerie
    - Modification des listes d’autorisation des messages privés ou des groupes, des contrôles de routage, de l’autorisation des commandes, de l’autorisation des événements ou de l’activation par mention
    - Examen de la rédaction des données entrantes des canaux ou des limites de compatibilité du SDK
sidebarTitle: Channel Ingress
summary: API expérimentale d’entrée de canal pour l’autorisation des messages entrants
title: API d’entrée des canaux
x-i18n:
    generated_at: "2026-07-12T02:55:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

L’entrée des canaux constitue la frontière expérimentale de contrôle d’accès pour les événements de canal entrants. Les Plugins gèrent les informations propres aux plateformes et les effets de bord ; le cœur gère la politique générique : listes d’autorisation des messages privés et des groupes, entrées de messages privés du magasin d’appairage, contrôles de route, contrôles de commande, autorisation des événements, activation par mention, diagnostics expurgés et admission.

Utilisez `openclaw/plugin-sdk/channel-ingress-runtime` pour les nouveaux chemins de réception. L’ancien sous-chemin `openclaw/plugin-sdk/channel-ingress` reste exporté comme façade de compatibilité obsolète pour les Plugins tiers.

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

Ne précalculez pas les listes d’autorisation effectives, les propriétaires de commandes ni les groupes de commandes. Le résolveur les déduit des listes d’autorisation brutes, des rappels du magasin, des descripteurs de route, des groupes d’accès, de la politique et du type de conversation.

## Résultat

Les Plugins intégrés doivent utiliser directement les projections modernes :

| Champ              | Signification                                                                 |
| ------------------ | ----------------------------------------------------------------------------- |
| `ingress`          | décision ordonnée des contrôles et admission                                  |
| `senderAccess`     | autorisation de l’expéditeur et de la conversation uniquement                 |
| `routeAccess`      | projection de la route et de l’expéditeur de la route                         |
| `commandAccess`    | autorisation de commande ; `requested: false` si aucun contrôle n’a été exécuté |
| `activationAccess` | résultat de la mention ou de l’activation                                      |

L’autorisation des événements reste disponible dans le graphe ordonné `ingress.graph` et dans le code de motif décisif `ingress.reasonCode` ; aucune projection d’événement distincte n’est produite.

Les assistants obsolètes du SDK tiers peuvent reconstruire les anciennes structures en interne. Les nouveaux chemins de réception intégrés ne doivent pas reconvertir les résultats modernes en DTO locaux.

## Groupes d’accès

Les entrées `accessGroup:<name>` restent expurgées. Le cœur résout lui-même les groupes statiques `message.senders` et appelle `resolveAccessGroupMembership` uniquement pour les groupes dynamiques nécessitant une recherche sur la plateforme. Les groupes absents, non pris en charge ou dont la résolution échoue sont refusés par défaut.

## Modes d’événement

| `authMode`       | Signification                                                              |
| ---------------- | -------------------------------------------------------------------------- |
| `inbound`        | contrôles normaux des expéditeurs entrants                                 |
| `command`        | contrôles de commande pour les rappels ou les boutons à portée limitée     |
| `origin-subject` | l’acteur doit correspondre au sujet du message d’origine                   |
| `route-only`     | contrôles de route uniquement pour les événements fiables limités à celle-ci |
| `none`           | les événements internes gérés par le Plugin contournent l’autorisation partagée |

Utilisez `mayPair: false` pour les réactions, les boutons, les rappels et les commandes natives.

## Routes et activation

Utilisez des descripteurs de route pour les politiques de salon, de sujet, de serveur, de fil de discussion ou de route imbriquée :

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

Utilisez `channelIngressRoutes(...)` lorsqu’un Plugin possède plusieurs descripteurs de route facultatifs ; cette fonction filtre les branches désactivées tout en conservant des informations de route génériques, ordonnées selon la valeur `precedence` de chaque descripteur.

Le contrôle des mentions est un contrôle d’activation. Une mention absente renvoie `admission: "skip"` afin que le noyau de tour ne traite pas un tour réservé à l’observation. Pour la plupart des canaux, l’activation doit rester après les contrôles de l’expéditeur et des commandes. Les interfaces de discussion publiques qui doivent neutraliser le trafic sans mention avant le bruit lié aux listes d’autorisation des expéditeurs peuvent choisir `activation.order: "before-sender"` lorsque le contournement par commande textuelle est désactivé. Les canaux avec activation implicite, comme les réponses dans les fils de discussion d’un bot, peuvent transmettre `activation.allowedImplicitMentionKinds` ; la projection `activationAccess.shouldBypassMention` indique alors si une commande ou une activation implicite a contourné une mention explicite.

## Expurgation

Les valeurs brutes des expéditeurs et les entrées brutes des listes d’autorisation servent uniquement d’entrées au résolveur. Elles ne doivent pas apparaître dans l’état résolu, les décisions, les diagnostics, les instantanés ni les informations de compatibilité. Utilisez des identifiants opaques pour les sujets, les entrées, les routes et les diagnostics.

## Vérification

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
