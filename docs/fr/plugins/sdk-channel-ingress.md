---
read_when:
    - Créer ou migrer un Plugin de canal de messagerie
    - Modifier les listes d’autorisation des messages directs ou des groupes, les contrôles de routage, l’autorisation des commandes, l’autorisation des événements ou l’activation par mention
    - Revue du masquage à l’entrée des canaux ou des limites de compatibilité du SDK
sidebarTitle: Channel Ingress
summary: API expérimentale d’entrée de canal pour l’autorisation des messages entrants
title: API d’entrée de canal
x-i18n:
    generated_at: "2026-05-11T20:48:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# API d’ingestion de canal

L’ingestion de canal est la limite expérimentale de contrôle d’accès pour les
événements de canal entrants. Utilisez `openclaw/plugin-sdk/channel-ingress-runtime` pour les chemins de réception.
L’ancien sous-chemin `openclaw/plugin-sdk/channel-ingress` reste exporté comme
façade de compatibilité obsolète pour les Plugins tiers.

Les Plugins possèdent les faits de plateforme et les effets de bord. Le noyau possède la politique générique : listes d’autorisation DM/groupe, entrées DM du stockage d’appairage, barrières de route, barrières de commande, authentification d’événement,
activation par mention, diagnostics expurgés et admission.

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

Ne pré-calculez pas les listes d’autorisation effectives, les propriétaires de commandes ni les groupes de commandes. Le
résolveur les déduit des listes d’autorisation brutes, des rappels de stockage, des descripteurs de route,
des groupes d’accès, de la politique et du type de conversation.

## Résultat

Les Plugins intégrés doivent consommer directement les projections modernes :

- `ingress` : décision de barrière ordonnée et admission
- `senderAccess` : autorisation de l’expéditeur/de la conversation uniquement
- `routeAccess` : projection de route et d’expéditeur de route
- `commandAccess` : autorisation de commande ; false lorsqu’aucune barrière de commande n’a été exécutée
- `activationAccess` : résultat de mention/activation

L’autorisation d’événement reste disponible sur le `ingress.graph` ordonné et le
`ingress.reasonCode` décisif ; aucune projection d’événement distincte n’est émise.

Les helpers SDK tiers obsolètes peuvent reconstruire d’anciennes formes en interne. Les nouveaux
chemins de réception intégrés ne doivent pas retraduire les résultats modernes en DTO locaux.

## Groupes d’accès

Les entrées `accessGroup:<name>` restent expurgées. Le noyau résout lui-même les groupes statiques
`message.senders` et appelle `resolveAccessGroupMembership` uniquement
pour les groupes dynamiques qui nécessitent une recherche de plateforme. Les groupes manquants, non pris en charge et
en échec échouent en mode fermé.

## Modes d’événement

| `authMode`       | Signification                                    |
| ---------------- | ------------------------------------------------ |
| `inbound`        | barrières normales d’expéditeur entrant          |
| `command`        | barrières de commande pour rappels ou boutons à portée limitée |
| `origin-subject` | l’acteur doit correspondre au sujet du message d’origine |
| `route-only`     | barrières de route uniquement pour les événements de confiance à portée de route |
| `none`           | les événements internes possédés par le Plugin contournent l’authentification partagée |

Utilisez `mayPair: false` pour les réactions, boutons, rappels et commandes natives.

## Routes et activation

Utilisez des descripteurs de route pour les politiques de salon, sujet, guilde, fil ou route imbriquée :

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

Utilisez `channelIngressRoutes(...)` lorsqu’un Plugin possède plusieurs descripteurs de route
facultatifs ; cela filtre les branches désactivées tout en gardant les faits de route génériques et
ordonnés selon la `precedence` de chaque descripteur.

La barrière de mention est une barrière d’activation. Une mention manquée renvoie
`admission: "skip"` afin que le noyau de tour ne traite pas un tour en observation seule.
La plupart des canaux doivent laisser l’activation après les barrières d’expéditeur et de commande. Les surfaces de
chat publiques qui doivent réduire au silence le trafic non mentionné avant le bruit de la liste d’autorisation des expéditeurs
peuvent opter pour `activation.order: "before-sender"` lorsque le contournement par commande textuelle
est désactivé. Les canaux avec activation implicite, comme les réponses dans les fils de bot,
peuvent transmettre `activation.allowedImplicitMentionKinds` ; la projection
`activationAccess.shouldBypassMention` indique alors quand une commande ou une activation implicite
a contourné une mention explicite.

## Expurgation

Les valeurs brutes d’expéditeur et les entrées brutes de liste d’autorisation sont uniquement des entrées du résolveur. Elles ne doivent
pas apparaître dans l’état résolu, les décisions, les diagnostics, les instantanés ni les
faits de compatibilité. Utilisez des identifiants de sujet opaques, des identifiants d’entrée, des identifiants de route et des
identifiants de diagnostic.

## Vérification

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
