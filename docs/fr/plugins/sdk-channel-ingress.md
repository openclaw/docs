---
read_when:
    - Création ou migration d’un plugin de canal de messagerie
    - Modification des listes d’autorisation des messages privés ou des groupes, des contrôles de routage, de l’authentification des commandes, de l’authentification des événements ou de l’activation par mention
    - Examen de la rédaction des données sensibles à l’entrée des canaux ou des limites de compatibilité du SDK
sidebarTitle: Channel Ingress
summary: API expérimentale de réception des canaux pour l’autorisation des messages entrants
title: API d’entrée des canaux
x-i18n:
    generated_at: "2026-07-16T13:36:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

L’ingress de canal constitue la limite expérimentale de contrôle d’accès pour les événements
de canal entrants. Les Plugins gèrent les informations propres à la plateforme et les effets secondaires ; le cœur gère
la politique générique : listes d’autorisation des messages privés/groupes, entrées de messages privés du registre d’appairage, barrières de routage,
barrières de commandes, autorisation des événements, activation par mention, diagnostics expurgés et
admission.

Utilisez `openclaw/plugin-sdk/channel-ingress-runtime` pour les chemins de réception.

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
Le résolveur les déduit des listes d’autorisation brutes, des rappels du registre, des descripteurs
de routage, des groupes d’accès, de la politique et du type de conversation.

## Résultat

Les Plugins intégrés doivent consommer directement les projections modernes :

| Champ              | Signification                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | décision ordonnée des barrières et admission                                |
| `senderAccess`     | autorisation de l’expéditeur/de la conversation uniquement                             |
| `routeAccess`      | projection du routage et de l’expéditeur du routage                                  |
| `commandAccess`    | autorisation de commande ; `requested: false` lorsqu’aucune barrière de commande n’a été exécutée |
| `activationAccess` | résultat de la mention/activation                                          |

L’autorisation des événements reste disponible dans la séquence ordonnée `ingress.graph` et dans
la décision déterminante `ingress.reasonCode` ; aucune projection d’événement distincte n’est émise.

Les assistants obsolètes du SDK tiers peuvent reconstruire d’anciennes structures en interne. Les nouveaux
chemins de réception intégrés ne doivent pas reconvertir les résultats modernes en DTO
locaux.

## Groupes d’accès

Les entrées `accessGroup:<name>` restent expurgées. Le cœur résout lui-même les groupes
statiques `message.senders` et appelle `resolveAccessGroupMembership` uniquement
pour les groupes dynamiques nécessitant une recherche sur la plateforme. Les groupes absents, non pris en charge ou
ayant échoué sont refusés par défaut.

## Modes d’événement

| `authMode`       | Signification                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | barrières normales de l’expéditeur entrant                      |
| `command`        | barrières de commandes pour les rappels ou les boutons à portée limitée    |
| `origin-subject` | l’acteur doit correspondre au sujet du message d’origine    |
| `route-only`     | barrières de routage uniquement pour les événements de confiance limités au routage |
| `none`           | les événements internes gérés par le Plugin contournent l’autorisation partagée  |

Utilisez `mayPair: false` pour les réactions, boutons, rappels et commandes natives.

## Routages et activation

Utilisez des descripteurs de routage pour la politique de salle, de sujet, de serveur, de fil de discussion ou de routage imbriqué :

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

Utilisez `channelIngressRoutes(...)` lorsqu’un Plugin comporte plusieurs descripteurs de routage
facultatifs ; il filtre les branches désactivées tout en conservant des informations de routage génériques
et ordonnées selon la valeur `precedence` de chaque descripteur.

Le filtrage par mention est une barrière d’activation. Une mention manquante renvoie
`admission: "skip"` afin que le noyau de tour ne traite pas un tour d’observation uniquement.
La plupart des canaux doivent placer l’activation après les barrières d’expéditeur et de commande. Les surfaces
de discussion publiques qui doivent ignorer le trafic sans mention avant le bruit produit par la liste d’autorisation
des expéditeurs peuvent activer `activation.order: "before-sender"` lorsque le contournement
par commande textuelle est désactivé. Les canaux à activation implicite, comme les réponses dans les
fils de discussion du bot, peuvent transmettre `activation.allowedImplicitMentionKinds` ; la projection
`activationAccess.shouldBypassMention` indique alors si une commande ou une activation
implicite a contourné une mention explicite.

## Expurgation

Les valeurs brutes des expéditeurs et les entrées brutes des listes d’autorisation sont uniquement des données d’entrée du résolveur. Elles
ne doivent pas apparaître dans l’état résolu, les décisions, les diagnostics, les instantanés ni les
informations de compatibilité. Utilisez des identifiants opaques de sujets, d’entrées, de routages et de
diagnostics.

## Vérification

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
