---
read_when:
    - Refactorisation de l’interface utilisateur des messages de canal, des charges utiles interactives ou des moteurs de rendu natifs des canaux
    - Modification des capacités des outils de message, des indications de livraison ou des marqueurs inter-contextes
    - Débogage de l’éventail des importations Discord Carbon ou du chargement paresseux à l’exécution du Plugin de canal
summary: Découpler la présentation sémantique des messages des moteurs de rendu de l’interface utilisateur native des canaux.
title: Plan de refactorisation de la présentation des canaux
x-i18n:
    generated_at: "2026-06-27T17:42:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## État

Implémenté pour l’agent partagé, la CLI, la capacité de Plugin et les surfaces de livraison sortante:

- `ReplyPayload.presentation` transporte l’interface de message sémantique.
- `ReplyPayload.delivery.pin` transporte les demandes d’épinglage des messages envoyés.
- Les actions de message partagées exposent `presentation`, `delivery` et `pin` au lieu de `components`, `blocks`, `buttons` ou `card` natifs du fournisseur.
- Le noyau affiche ou dégrade automatiquement la présentation via les capacités sortantes déclarées par les plugins.
- Les moteurs de rendu Discord, Slack, Telegram, Mattermost, MS Teams et Feishu consomment le contrat générique.
- Le code de plan de contrôle du canal Discord n’importe plus les conteneurs d’interface basés sur Carbon.

La documentation canonique se trouve maintenant dans [Présentation des messages](/fr/plugins/message-presentation).
Conservez ce plan comme contexte historique d’implémentation; mettez à jour le guide canonique
pour les changements de contrat, de moteur de rendu ou de comportement de repli.

## Problème

L’interface des canaux est actuellement répartie sur plusieurs surfaces incompatibles:

- Le noyau possède un hook de moteur de rendu intercontextuel de forme Discord via `buildCrossContextComponents`.
- Le fichier Discord `channel.ts` peut importer l’interface Carbon native via `DiscordUiContainer`, ce qui attire les dépendances d’interface d’exécution dans le plan de contrôle du Plugin de canal.
- L’agent et la CLI exposent des échappatoires de charge utile natives telles que Discord `components`, Slack `blocks`, Telegram ou Mattermost `buttons`, et Teams ou Feishu `card`.
- `ReplyPayload.channelData` transporte à la fois des indications de transport et des enveloppes d’interface natives.
- Le modèle générique `interactive` existe, mais il est plus restreint que les mises en page plus riches déjà utilisées par Discord, Slack, Teams, Feishu, LINE, Telegram et Mattermost.

Cela rend le noyau conscient des formes d’interface natives, affaiblit la paresse d’exécution des plugins et donne aux agents trop de façons spécifiques aux fournisseurs d’exprimer la même intention de message.

## Objectifs

- Le noyau choisit la meilleure présentation sémantique pour un message à partir des capacités déclarées.
- Les extensions déclarent des capacités et rendent la présentation sémantique en charges utiles de transport natives.
- L’interface Web Control reste séparée de l’interface native de chat.
- Les charges utiles de canal natives ne sont pas exposées via la surface de message partagée de l’agent ou de la CLI.
- Les fonctionnalités de présentation non prises en charge se dégradent automatiquement vers la meilleure représentation textuelle.
- Le comportement de livraison, comme l’épinglage d’un message envoyé, est une métadonnée de livraison générique, pas une présentation.

## Non-objectifs

- Aucun shim de rétrocompatibilité pour `buildCrossContextComponents`.
- Aucune échappatoire native publique pour `components`, `blocks`, `buttons` ou `card`.
- Aucun import par le noyau de bibliothèques d’interface natives de canal.
- Aucun point d’intégration SDK spécifique au fournisseur pour les canaux groupés.

## Modèle cible

Ajouter un champ `presentation` possédé par le noyau à `ReplyPayload`.

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

`interactive` devient un sous-ensemble de `presentation` pendant la migration:

- Le bloc de texte `interactive` correspond à `presentation.blocks[].type = "text"`.
- Le bloc de boutons `interactive` correspond à `presentation.blocks[].type = "buttons"`.
- Le bloc de sélection `interactive` correspond à `presentation.blocks[].type = "select"`.

Les schémas externes de l’agent et de la CLI utilisent maintenant `presentation`; `interactive` reste un ancien assistant interne d’analyse et de rendu pour les producteurs de réponses existants.
L’API publique destinée aux producteurs traite `interactive` comme obsolète. La prise en charge à l’exécution reste en place afin que les assistants d’approbation existants et les anciens plugins continuent de fonctionner pendant que le nouveau code émet `presentation`.

## Métadonnées de livraison

Ajouter un champ `delivery` possédé par le noyau pour le comportement d’envoi qui n’est pas de l’interface.

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

Sémantique:

- `delivery.pin = true` signifie épingler le premier message livré avec succès.
- `notify` vaut `false` par défaut.
- `required` vaut `false` par défaut; les canaux non pris en charge ou les échecs d’épinglage se dégradent automatiquement en poursuivant la livraison.
- Les actions de message manuelles `pin`, `unpin` et `list-pins` restent disponibles pour les messages existants.

La liaison actuelle du sujet Telegram ACP doit passer de `channelData.telegram.pin = true` à `delivery.pin = true`.

## Contrat de capacité d’exécution

Ajouter des hooks de rendu de présentation et de livraison à l’adaptateur sortant d’exécution, pas au Plugin de canal du plan de contrôle.

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

Comportement du noyau:

- Résoudre le canal cible et l’adaptateur d’exécution.
- Demander les capacités de présentation.
- Dégrader les blocs non pris en charge et appliquer les limites de capacité génériques avant
  le rendu.
- Appeler `renderPresentation`.
- Si aucun moteur de rendu n’existe, convertir la présentation en repli textuel.
- Après un envoi réussi, appeler `pinDeliveredMessage` quand `delivery.pin` est demandé et pris en charge.

## Correspondance des canaux

Discord:

- Rendre `presentation` en composants v2 et conteneurs Carbon dans des modules réservés à l’exécution.
- Conserver les assistants de couleur d’accent dans des modules légers.
- Supprimer les imports `DiscordUiContainer` du code de plan de contrôle du Plugin de canal.

Slack:

- Rendre `presentation` en Block Kit.
- Supprimer l’entrée `blocks` de l’agent et de la CLI.

Telegram:

- Rendre le texte, le contexte et les séparateurs sous forme de texte.
- Rendre les actions et la sélection sous forme de claviers intégrés quand cela est configuré et autorisé pour la surface cible.
- Utiliser le repli textuel lorsque les boutons intégrés sont désactivés.
- Déplacer l’épinglage de sujet ACP vers `delivery.pin`.

Mattermost:

- Rendre les actions sous forme de boutons interactifs lorsque cela est configuré.
- Rendre les autres blocs sous forme de repli textuel.

MS Teams:

- Rendre `presentation` en Adaptive Cards.
- Conserver les actions manuelles pin/unpin/list-pins.
- Implémenter éventuellement `pinDeliveredMessage` si la prise en charge Graph est fiable pour la conversation cible.

Feishu:

- Rendre `presentation` en cartes interactives.
- Conserver les actions manuelles pin/unpin/list-pins.
- Implémenter éventuellement `pinDeliveredMessage` pour l’épinglage de messages envoyés si le comportement de l’API est fiable.

LINE:

- Rendre `presentation` en messages Flex ou modèles lorsque c’est possible.
- Revenir au texte pour les blocs non pris en charge.
- Supprimer les charges utiles d’interface LINE de `channelData`.

Canaux simples ou limités:

- Convertir la présentation en texte avec un formatage conservateur.

## Étapes de refactorisation

1. Réappliquer le correctif de publication Discord qui sépare `ui-colors.ts` de l’interface basée sur Carbon et supprime `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Ajouter `presentation` et `delivery` à `ReplyPayload`, à la normalisation des charges utiles sortantes, aux résumés de livraison et aux charges utiles de hooks.
3. Ajouter le schéma `MessagePresentation` et des assistants d’analyse dans un sous-chemin SDK/exécution étroit.
4. Remplacer les capacités de message `buttons`, `cards`, `components` et `blocks` par des capacités de présentation sémantiques.
5. Ajouter des hooks d’adaptateur sortant d’exécution pour le rendu de présentation et l’épinglage de livraison.
6. Remplacer la construction de composants intercontextuels par `buildCrossContextPresentation`.
7. Supprimer `src/infra/outbound/channel-adapters.ts` et retirer `buildCrossContextComponents` des types de Plugin de canal.
8. Modifier `maybeApplyCrossContextMarker` pour attacher `presentation` au lieu de paramètres natifs.
9. Mettre à jour les chemins d’envoi de répartition de plugins pour consommer uniquement la présentation sémantique et les métadonnées de livraison.
10. Supprimer les paramètres de charge utile native de l’agent et de la CLI: `components`, `blocks`, `buttons` et `card`.
11. Supprimer les assistants SDK qui créent des schémas d’outils de message natifs, et les remplacer par des assistants de schéma de présentation.
12. Supprimer les enveloppes d’interface/natives de `channelData`; conserver uniquement les métadonnées de transport jusqu’à ce que chaque champ restant soit examiné.
13. Migrer les moteurs de rendu Discord, Slack, Telegram, Mattermost, MS Teams, Feishu et LINE.
14. Mettre à jour la documentation pour la CLI de message, les pages de canaux, le SDK de Plugin et le guide pratique des capacités.
15. Exécuter le profilage du fanout d’import pour Discord et les points d’entrée de canal affectés.

Les étapes 1 à 11 et 13 à 14 sont implémentées dans cette refactorisation pour les contrats de l’agent partagé, de la CLI, des capacités de Plugin et des adaptateurs sortants. L’étape 12 reste une passe de nettoyage interne plus profonde pour les enveloppes de transport `channelData` privées aux fournisseurs. L’étape 15 reste une validation de suivi si nous voulons des nombres quantifiés de fanout d’import au-delà de la barrière de types/tests.

## Tests

Ajouter ou mettre à jour:

- Tests de normalisation de présentation.
- Tests de dégradation automatique de présentation pour les blocs non pris en charge.
- Tests de marqueur intercontextuel pour la répartition des plugins et les chemins de livraison du noyau.
- Tests de matrice de rendu de canal pour Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE et le repli textuel.
- Tests de schéma d’outil de message prouvant que les champs natifs ont disparu.
- Tests CLI prouvant que les indicateurs natifs ont disparu.
- Régression de paresse d’import du point d’entrée Discord couvrant Carbon.
- Tests d’épinglage de livraison couvrant Telegram et le repli générique.

## Questions ouvertes

- `delivery.pin` doit-il être implémenté pour Discord, Slack, MS Teams et Feishu lors de la première passe, ou seulement pour Telegram d’abord?
- `delivery` doit-il finir par absorber les champs existants tels que `replyToId`, `replyToCurrent`, `silent` et `audioAsVoice`, ou rester concentré sur les comportements post-envoi?
- La présentation doit-elle prendre en charge directement les images ou les références de fichiers, ou les médias doivent-ils rester séparés de la mise en page d’interface pour l’instant?

## Connexe

- [Vue d’ensemble des canaux](/fr/channels)
- [Présentation des messages](/fr/plugins/message-presentation)
