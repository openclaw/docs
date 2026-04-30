---
read_when:
    - Refactorisation de l’interface utilisateur des messages de canal, des charges utiles interactives ou des moteurs de rendu natifs des canaux
    - Modification des capacités des outils de message, des indications de livraison ou des marqueurs inter-contextes
    - Débogage de l’éventail d’importation Carbon de Discord ou du chargement paresseux à l’exécution du plugin de canal
summary: Découpler la présentation sémantique des messages des moteurs de rendu d’interface utilisateur native des canaux.
title: Plan de refactorisation de la présentation des canaux
x-i18n:
    generated_at: "2026-04-30T07:35:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Statut

Implémenté pour les surfaces de l’agent partagé, de la CLI, des capacités de plugin et de livraison sortante :

- `ReplyPayload.presentation` transporte l’interface de message sémantique.
- `ReplyPayload.delivery.pin` transporte les demandes d’épinglage des messages envoyés.
- Les actions de message partagées exposent `presentation`, `delivery` et `pin` au lieu de `components`, `blocks`, `buttons` ou `card` natifs du fournisseur.
- Le cœur effectue le rendu ou la dégradation automatique de la présentation via les capacités sortantes déclarées par le plugin.
- Les moteurs de rendu Discord, Slack, Telegram, Mattermost, MS Teams et Feishu consomment le contrat générique.
- Le code du plan de contrôle du canal Discord n’importe plus de conteneurs d’interface adossés à Carbon.

La documentation canonique se trouve désormais dans [Présentation des messages](/fr/plugins/message-presentation).
Conservez ce plan comme contexte historique d’implémentation ; mettez à jour le guide canonique
pour les changements de contrat, de moteur de rendu ou de comportement de repli.

## Problème

L’interface des canaux est actuellement répartie entre plusieurs surfaces incompatibles :

- Le cœur possède un hook de rendu intercontextuel de forme Discord via `buildCrossContextComponents`.
- Le fichier Discord `channel.ts` peut importer l’interface Carbon native via `DiscordUiContainer`, ce qui introduit des dépendances d’interface à l’exécution dans le plan de contrôle du plugin de canal.
- L’agent et la CLI exposent des échappatoires de charge utile native telles que les `components` Discord, les `blocks` Slack, les `buttons` Telegram ou Mattermost, et les `card` Teams ou Feishu.
- `ReplyPayload.channelData` transporte à la fois des indications de transport et des enveloppes d’interface natives.
- Le modèle générique `interactive` existe, mais il est plus étroit que les mises en page plus riches déjà utilisées par Discord, Slack, Teams, Feishu, LINE, Telegram et Mattermost.

Cela rend le cœur conscient des formes d’interface natives, affaiblit la paresse d’exécution des plugins et donne aux agents trop de façons spécifiques aux fournisseurs d’exprimer la même intention de message.

## Objectifs

- Le cœur décide de la meilleure présentation sémantique pour un message à partir des capacités déclarées.
- Les extensions déclarent des capacités et rendent la présentation sémantique en charges utiles de transport natives.
- L’interface Web Control reste séparée de l’interface native de chat.
- Les charges utiles de canal natives ne sont pas exposées via la surface de message partagée de l’agent ou de la CLI.
- Les fonctionnalités de présentation non prises en charge se dégradent automatiquement vers la meilleure représentation textuelle.
- Les comportements de livraison tels que l’épinglage d’un message envoyé sont des métadonnées de livraison génériques, pas de la présentation.

## Non-objectifs

- Aucun shim de rétrocompatibilité pour `buildCrossContextComponents`.
- Aucune échappatoire native publique pour `components`, `blocks`, `buttons` ou `card`.
- Aucun import par le cœur de bibliothèques d’interface natives de canal.
- Aucun seam de SDK spécifique aux fournisseurs pour les canaux groupés.

## Modèle cible

Ajouter un champ `presentation` appartenant au cœur à `ReplyPayload`.

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

`interactive` devient un sous-ensemble de `presentation` pendant la migration :

- Le bloc texte `interactive` correspond à `presentation.blocks[].type = "text"`.
- Le bloc de boutons `interactive` correspond à `presentation.blocks[].type = "buttons"`.
- Le bloc de sélection `interactive` correspond à `presentation.blocks[].type = "select"`.

Les schémas externes de l’agent et de la CLI utilisent désormais `presentation` ; `interactive` reste un ancien assistant interne d’analyse et de rendu pour les producteurs de réponses existants.

## Métadonnées de livraison

Ajouter un champ `delivery` appartenant au cœur pour les comportements d’envoi qui ne sont pas de l’interface.

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

- `delivery.pin = true` signifie épingler le premier message livré avec succès.
- `notify` vaut `false` par défaut.
- `required` vaut `false` par défaut ; les canaux non pris en charge ou les échecs d’épinglage se dégradent automatiquement en poursuivant la livraison.
- Les actions de message manuelles `pin`, `unpin` et `list-pins` restent disponibles pour les messages existants.

La liaison actuelle de sujet Telegram ACP doit passer de `channelData.telegram.pin = true` à `delivery.pin = true`.

## Contrat de capacité d’exécution

Ajouter des hooks de rendu de présentation et de livraison à l’adaptateur sortant d’exécution, pas au plugin de canal du plan de contrôle.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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
- Dégrader les blocs non pris en charge avant le rendu.
- Appeler `renderPresentation`.
- Si aucun moteur de rendu n’existe, convertir la présentation en repli textuel.
- Après un envoi réussi, appeler `pinDeliveredMessage` lorsque `delivery.pin` est demandé et pris en charge.

## Correspondance des canaux

Discord :

- Rendre `presentation` en composants v2 et conteneurs Carbon dans des modules uniquement d’exécution.
- Conserver les assistants de couleur d’accent dans des modules légers.
- Supprimer les imports `DiscordUiContainer` du code du plan de contrôle du plugin de canal.

Slack :

- Rendre `presentation` en Block Kit.
- Supprimer l’entrée `blocks` de l’agent et de la CLI.

Telegram :

- Rendre le texte, le contexte et les séparateurs sous forme de texte.
- Rendre les actions et la sélection comme claviers en ligne lorsque c’est configuré et autorisé pour la surface cible.
- Utiliser le repli textuel lorsque les boutons en ligne sont désactivés.
- Déplacer l’épinglage de sujet ACP vers `delivery.pin`.

Mattermost :

- Rendre les actions comme boutons interactifs lorsque c’est configuré.
- Rendre les autres blocs comme repli textuel.

MS Teams :

- Rendre `presentation` en Adaptive Cards.
- Conserver les actions manuelles d’épinglage, de désépinglage et de liste des épingles.
- Implémenter éventuellement `pinDeliveredMessage` si la prise en charge Graph est fiable pour la conversation cible.

Feishu :

- Rendre `presentation` en cartes interactives.
- Conserver les actions manuelles d’épinglage, de désépinglage et de liste des épingles.
- Implémenter éventuellement `pinDeliveredMessage` pour l’épinglage des messages envoyés si le comportement de l’API est fiable.

LINE :

- Rendre `presentation` en messages Flex ou modèles lorsque c’est possible.
- Revenir au texte pour les blocs non pris en charge.
- Supprimer les charges utiles d’interface LINE de `channelData`.

Canaux simples ou limités :

- Convertir la présentation en texte avec un formatage conservateur.

## Étapes de refactorisation

1. Réappliquer le correctif de version Discord qui sépare `ui-colors.ts` de l’interface adossée à Carbon et supprime `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Ajouter `presentation` et `delivery` à `ReplyPayload`, à la normalisation des charges utiles sortantes, aux résumés de livraison et aux charges utiles de hooks.
3. Ajouter le schéma `MessagePresentation` et des assistants d’analyse dans un sous-chemin SDK/exécution étroit.
4. Remplacer les capacités de message `buttons`, `cards`, `components` et `blocks` par des capacités de présentation sémantique.
5. Ajouter des hooks d’adaptateur sortant d’exécution pour le rendu de présentation et l’épinglage de livraison.
6. Remplacer la construction de composants intercontextuels par `buildCrossContextPresentation`.
7. Supprimer `src/infra/outbound/channel-adapters.ts` et retirer `buildCrossContextComponents` des types de plugin de canal.
8. Modifier `maybeApplyCrossContextMarker` pour attacher `presentation` au lieu de paramètres natifs.
9. Mettre à jour les chemins d’envoi de répartition des plugins pour ne consommer que la présentation sémantique et les métadonnées de livraison.
10. Supprimer les paramètres de charge utile native de l’agent et de la CLI : `components`, `blocks`, `buttons` et `card`.
11. Supprimer les assistants SDK qui créent des schémas d’outils de message natifs, en les remplaçant par des assistants de schéma de présentation.
12. Supprimer les enveloppes d’interface/natives de `channelData` ; ne conserver que les métadonnées de transport jusqu’à l’examen de chaque champ restant.
13. Migrer les moteurs de rendu Discord, Slack, Telegram, Mattermost, MS Teams, Feishu et LINE.
14. Mettre à jour la documentation de la CLI de message, des pages de canaux, du SDK de plugin et du guide de recettes des capacités.
15. Exécuter le profilage du fanout d’import pour Discord et les points d’entrée de canaux concernés.

Les étapes 1 à 11 et 13 à 14 sont implémentées dans cette refactorisation pour l’agent partagé, la CLI, les capacités de plugin et les contrats d’adaptateur sortant. L’étape 12 reste une passe de nettoyage interne plus profonde pour les enveloppes de transport `channelData` privées des fournisseurs. L’étape 15 reste une validation de suivi si nous voulons des nombres quantifiés de fanout d’import au-delà du gate de types/tests.

## Tests

Ajouter ou mettre à jour :

- Tests de normalisation de présentation.
- Tests de dégradation automatique de présentation pour les blocs non pris en charge.
- Tests de marqueur intercontextuel pour les chemins de répartition de plugins et de livraison cœur.
- Tests de matrice de rendu des canaux pour Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE et le repli textuel.
- Tests de schéma d’outil de message prouvant que les champs natifs ont disparu.
- Tests de CLI prouvant que les flags natifs ont disparu.
- Régression de paresse d’import du point d’entrée Discord couvrant Carbon.
- Tests d’épinglage de livraison couvrant Telegram et le repli générique.

## Questions ouvertes

- `delivery.pin` doit-il être implémenté pour Discord, Slack, MS Teams et Feishu dès la première passe, ou seulement Telegram d’abord ?
- `delivery` doit-il finir par absorber des champs existants tels que `replyToId`, `replyToCurrent`, `silent` et `audioAsVoice`, ou rester concentré sur les comportements post-envoi ?
- La présentation doit-elle prendre directement en charge les images ou les références de fichiers, ou les médias doivent-ils rester séparés de la mise en page d’interface pour l’instant ?

## Connexe

- [Vue d’ensemble des canaux](/fr/channels)
- [Présentation des messages](/fr/plugins/message-presentation)
