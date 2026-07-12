---
read_when:
    - Refactorisation de l’interface utilisateur des messages de canal, des charges utiles interactives ou des moteurs de rendu natifs des canaux
    - Modification des capacités de l’outil de messagerie, des indications de livraison ou des marqueurs intercontextes
    - Débogage du déploiement en éventail des imports Carbon de Discord ou du chargement différé de l’exécution du Plugin de canal
summary: Découpler la présentation sémantique des messages des moteurs de rendu d’interface utilisateur natifs des canaux.
title: Plan de refactorisation de la présentation des canaux
x-i18n:
    generated_at: "2026-07-12T02:59:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## État

Implémenté pour l’agent partagé, la CLI, les capacités des plugins et les surfaces d’envoi sortant :

- `ReplyPayload.presentation` transporte une interface de message sémantique.
- `ReplyPayload.delivery.pin` transporte les demandes d’épinglage des messages envoyés.
- Les actions de message partagées exposent `presentation`, `delivery` et `pin` au lieu des éléments natifs du fournisseur `components`, `blocks`, `buttons` ou `card`.
- Le cœur effectue le rendu de la présentation ou la dégrade automatiquement selon les capacités d’envoi sortant déclarées par le plugin.
- Les moteurs de rendu de Discord, Slack, Telegram, Mattermost, MS Teams et Feishu utilisent le contrat générique.
- Le code du plan de contrôle du canal Discord n’importe plus de conteneurs d’interface reposant sur Carbon.

La documentation canonique se trouve désormais dans [Présentation des messages](/fr/plugins/message-presentation).
Conservez ce plan comme contexte historique de l’implémentation ; mettez à jour le guide canonique
pour toute modification du contrat, du moteur de rendu ou du comportement de repli.

## Problème

L’interface des canaux est actuellement répartie entre plusieurs surfaces incompatibles :

- Le cœur possède un hook de rendu intercontexte conçu selon le modèle de Discord via `buildCrossContextComponents`.
- Le fichier `channel.ts` de Discord peut importer l’interface native Carbon via `DiscordUiContainer`, ce qui introduit des dépendances d’interface d’exécution dans le plan de contrôle du plugin de canal.
- L’agent et la CLI exposent des échappatoires de charges utiles natives telles que `components` pour Discord, `blocks` pour Slack, `buttons` pour Telegram ou Mattermost, et `card` pour Teams ou Feishu.
- `ReplyPayload.channelData` transporte à la fois des indications de transport et des enveloppes d’interface natives.
- Le modèle générique `interactive` existe, mais il est plus limité que les mises en page enrichies déjà utilisées par Discord, Slack, Teams, Feishu, LINE, Telegram et Mattermost.

Cela rend le cœur dépendant des structures d’interface natives, affaiblit le chargement différé de l’exécution des plugins et offre aux agents trop de moyens propres aux fournisseurs pour exprimer la même intention de message.

## Objectifs

- Le cœur détermine la meilleure présentation sémantique d’un message à partir des capacités déclarées.
- Les extensions déclarent leurs capacités et transforment la présentation sémantique en charges utiles de transport natives.
- L’interface Web Control UI reste distincte de l’interface native des discussions.
- Les charges utiles natives des canaux ne sont pas exposées par la surface de messagerie partagée de l’agent ou de la CLI.
- Les fonctionnalités de présentation non prises en charge sont automatiquement dégradées vers la meilleure représentation textuelle.
- Le comportement d’envoi, tel que l’épinglage d’un message envoyé, relève de métadonnées génériques d’envoi et non de la présentation.

## Hors objectifs

- Aucun adaptateur de rétrocompatibilité pour `buildCrossContextComponents`.
- Aucune échappatoire native publique pour `components`, `blocks`, `buttons` ou `card`.
- Aucune importation, par le cœur, de bibliothèques d’interface natives des canaux.
- Aucune surface du SDK propre à un fournisseur pour les canaux intégrés.

## Modèle cible

Ajouter à `ReplyPayload` un champ `presentation` appartenant au cœur.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

Pendant la migration, `interactive` devient un sous-ensemble de `presentation` :

- Le bloc de texte `interactive` correspond à `presentation.blocks[].type = "text"`.
- Le bloc de boutons `interactive` correspond à `presentation.blocks[].type = "buttons"`.
- Le bloc de sélection `interactive` correspond à `presentation.blocks[].type = "select"`.

Les schémas externes de l’agent et de la CLI utilisent désormais `presentation` ; `interactive` reste un ancien utilitaire interne d’analyse et de rendu pour les producteurs de réponses existants.
L’API publique destinée aux producteurs considère `interactive` comme obsolète. Sa prise en charge à l’exécution
est conservée afin que les utilitaires d’approbation existants et les anciens plugins continuent de
fonctionner, tandis que le nouveau code émet `presentation`.

## Métadonnées d’envoi

Ajouter un champ `delivery` appartenant au cœur pour le comportement d’envoi qui ne relève pas de l’interface.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Sémantique :

- `delivery.pin = true` signifie épingler le premier message envoyé avec succès.
- La valeur par défaut de `notify` est `false`.
- La valeur par défaut de `required` est `false` ; les canaux non pris en charge ou les échecs d’épinglage sont automatiquement dégradés en poursuivant l’envoi.
- Les actions de message manuelles `pin`, `unpin` et `list-pins` restent disponibles pour les messages existants.

L’association actuelle des sujets ACP de Telegram doit passer de `channelData.telegram.pin = true` à `delivery.pin = true`.

## Contrat de capacités d’exécution

Ajouter les hooks de rendu de présentation et d’envoi à l’adaptateur d’envoi sortant d’exécution, et non au plugin de canal du plan de contrôle.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Comportement du cœur :

- Résoudre le canal cible et l’adaptateur d’exécution.
- Demander les capacités de présentation.
- Dégrader les blocs non pris en charge et appliquer les limites génériques des capacités avant
  le rendu.
- Appeler `renderPresentation`.
- Si aucun moteur de rendu n’existe, convertir la présentation en représentation textuelle de repli.
- Après un envoi réussi, appeler `pinDeliveredMessage` lorsque `delivery.pin` est demandé et pris en charge.

## Correspondance des canaux

Discord :

- Transformer `presentation` en composants v2 et en conteneurs Carbon dans des modules réservés à l’exécution.
- Conserver les utilitaires de couleur d’accentuation dans des modules légers.
- Supprimer les importations de `DiscordUiContainer` du code du plan de contrôle du plugin de canal.

Slack :

- Transformer `presentation` en Block Kit.
- Supprimer l’entrée `blocks` de l’agent et de la CLI.

Telegram :

- Afficher le texte, le contexte et les séparateurs sous forme de texte.
- Afficher les actions et la sélection sous forme de claviers intégrés lorsqu’ils sont configurés et autorisés pour la surface cible.
- Utiliser la représentation textuelle de repli lorsque les boutons intégrés sont désactivés.
- Déplacer l’épinglage des sujets ACP vers `delivery.pin`.

Mattermost :

- Afficher les actions sous forme de boutons interactifs lorsqu’ils sont configurés.
- Afficher les autres blocs sous forme de représentation textuelle de repli.

MS Teams :

- Transformer `presentation` en Adaptive Cards.
- Conserver les actions manuelles d’épinglage, de désépinglage et de liste des éléments épinglés.
- Implémenter éventuellement `pinDeliveredMessage` si la prise en charge de Graph est fiable pour la conversation cible.

Feishu :

- Transformer `presentation` en cartes interactives.
- Conserver les actions manuelles d’épinglage, de désépinglage et de liste des éléments épinglés.
- Implémenter éventuellement `pinDeliveredMessage` pour épingler les messages envoyés si le comportement de l’API est fiable.

LINE :

- Transformer `presentation` en messages Flex ou en modèles de messages lorsque cela est possible.
- Revenir au texte pour les blocs non pris en charge.
- Supprimer les charges utiles d’interface de LINE de `channelData`.

Canaux simples ou limités :

- Convertir la présentation en texte avec un formatage prudent.

## Étapes de refactorisation

1. Réappliquer le correctif de version de Discord qui sépare `ui-colors.ts` de l’interface reposant sur Carbon et supprime `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Ajouter `presentation` et `delivery` à `ReplyPayload`, à la normalisation des charges utiles sortantes, aux résumés d’envoi et aux charges utiles des hooks.
3. Ajouter le schéma `MessagePresentation` et les utilitaires d’analyse dans un sous-chemin étroit du SDK ou de l’exécution.
4. Remplacer les capacités de message `buttons`, `cards`, `components` et `blocks` par des capacités de présentation sémantiques.
5. Ajouter aux adaptateurs d’envoi sortant d’exécution des hooks pour le rendu de la présentation et l’épinglage après envoi.
6. Remplacer la construction de composants intercontextes par `buildCrossContextPresentation`.
7. Supprimer `src/infra/outbound/channel-adapters.ts` et retirer `buildCrossContextComponents` des types des plugins de canal.
8. Modifier `maybeApplyCrossContextMarker` afin qu’il ajoute `presentation` au lieu de paramètres natifs.
9. Mettre à jour les chemins d’envoi de la répartition des plugins afin qu’ils n’utilisent que la présentation sémantique et les métadonnées d’envoi.
10. Supprimer les paramètres de charges utiles natives de l’agent et de la CLI : `components`, `blocks`, `buttons` et `card`.
11. Supprimer les utilitaires du SDK qui créent des schémas natifs d’outils de messagerie et les remplacer par des utilitaires de schéma de présentation.
12. Supprimer les enveloppes d’interface natives de `channelData` ; ne conserver que les métadonnées de transport jusqu’à l’examen de chaque champ restant.
13. Migrer les moteurs de rendu de Discord, Slack, Telegram, Mattermost, MS Teams, Feishu et LINE.
14. Mettre à jour la documentation de la CLI de messagerie, des pages des canaux, du SDK de plugins et du guide pratique des capacités.
15. Exécuter un profilage de la propagation des importations pour Discord et les points d’entrée des canaux concernés.

Les étapes 1 à 11 et 13 à 14 sont implémentées dans cette refactorisation pour l’agent partagé, la CLI, les capacités des plugins et les contrats des adaptateurs d’envoi sortant. L’étape 12 reste une passe de nettoyage interne plus approfondie concernant les enveloppes de transport `channelData` privées des fournisseurs. L’étape 15 reste une validation ultérieure si nous souhaitons obtenir des mesures quantifiées de propagation des importations au-delà des contrôles de types et des tests.

## Tests

Ajouter ou mettre à jour :

- Les tests de normalisation de la présentation.
- Les tests de dégradation automatique de la présentation pour les blocs non pris en charge.
- Les tests des marqueurs intercontextes pour la répartition des plugins et les chemins d’envoi du cœur.
- Les tests matriciels du rendu des canaux pour Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE et la représentation textuelle de repli.
- Les tests du schéma des outils de messagerie prouvant que les champs natifs ont été supprimés.
- Les tests de la CLI prouvant que les options natives ont été supprimées.
- Le test de non-régression du chargement différé des importations du point d’entrée Discord couvrant Carbon.
- Les tests d’épinglage après envoi couvrant Telegram et le repli générique.

## Questions ouvertes

- `delivery.pin` doit-il être implémenté dès la première passe pour Discord, Slack, MS Teams et Feishu, ou uniquement pour Telegram dans un premier temps ?
- `delivery` doit-il finalement intégrer des champs existants tels que `replyToId`, `replyToCurrent`, `silent` et `audioAsVoice`, ou rester centré sur les comportements postérieurs à l’envoi ?
- La présentation doit-elle prendre directement en charge les images ou les références de fichiers, ou les médias doivent-ils rester séparés de la mise en page de l’interface pour le moment ?

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels)
- [Présentation des messages](/fr/plugins/message-presentation)
