---
read_when:
    - Refactorisation de l’interface des messages de canal, des charges utiles interactives ou des moteurs de rendu natifs des canaux
    - Modification des capacités de l’outil de message, des indications de distribution ou des marqueurs inter-contexte
    - Débogage de la diffusion des imports Discord Carbon ou de la paresse d’exécution du Plugin de canal
summary: Découpler la présentation sémantique des messages des moteurs de rendu d’interface natifs des canaux.
title: Plan de refactorisation de la présentation des canaux
x-i18n:
    generated_at: "2026-04-22T04:24:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Plan de refactorisation de la présentation des canaux

## Statut

Implémenté pour l’agent partagé, la CLI, la capacité du Plugin et les surfaces de distribution sortante :

- `ReplyPayload.presentation` transporte l’interface sémantique des messages.
- `ReplyPayload.delivery.pin` transporte les demandes d’épinglage des messages envoyés.
- Les actions de message partagées exposent `presentation`, `delivery` et `pin` au lieu de `components`, `blocks`, `buttons` ou `card` natifs au provider.
- Le core effectue le rendu ou l’auto-dégradation de la présentation via les capacités sortantes déclarées par le Plugin.
- Les moteurs de rendu Discord, Slack, Telegram, Mattermost, Microsoft Teams et Feishu consomment le contrat générique.
- Le code de plan de contrôle du canal Discord n’importe plus de conteneurs d’interface adossés à Carbon.

La documentation canonique se trouve désormais dans [Présentation des messages](/fr/plugins/message-presentation).
Conservez ce plan comme contexte historique d’implémentation ; mettez à jour le guide canonique
pour tout changement de contrat, de moteur de rendu ou de comportement de repli.

## Problème

L’interface des canaux est actuellement répartie sur plusieurs surfaces incompatibles :

- Le core possède un hook de rendu inter-contexte de forme Discord via `buildCrossContextComponents`.
- `channel.ts` de Discord peut importer l’interface native via `DiscordUiContainer`, ce qui tire des dépendances d’interface d’exécution dans le plan de contrôle du Plugin de canal.
- L’agent et la CLI exposent des échappatoires de charge utile natives comme `components` pour Discord, `blocks` pour Slack, `buttons` pour Telegram ou Mattermost, et `card` pour Teams ou Feishu.
- `ReplyPayload.channelData` transporte à la fois des indications de transport et des enveloppes d’interface natives.
- Le modèle générique `interactive` existe, mais il est plus étroit que les mises en page plus riches déjà utilisées par Discord, Slack, Teams, Feishu, LINE, Telegram et Mattermost.

Cela rend le core conscient des formes d’interface natives, affaiblit la paresse d’exécution du Plugin et donne aux agents trop de manières spécifiques au provider d’exprimer la même intention de message.

## Objectifs

- Le core décide de la meilleure présentation sémantique pour un message à partir des capacités déclarées.
- Les extensions déclarent des capacités et rendent la présentation sémantique en charges utiles de transport natives.
- L’interface Web Control reste distincte de l’interface native de chat.
- Les charges utiles natives de canal ne sont pas exposées via la surface de message partagée de l’agent ou de la CLI.
- Les fonctionnalités de présentation non prises en charge se dégradent automatiquement vers la meilleure représentation textuelle.
- Le comportement de distribution, comme l’épinglage d’un message envoyé, est une métadonnée de distribution générique, pas une présentation.

## Non-objectifs

- Aucun shim de rétrocompatibilité pour `buildCrossContextComponents`.
- Aucune échappatoire native publique pour `components`, `blocks`, `buttons` ou `card`.
- Aucune importation par le core de bibliothèques d’interface natives de canal.
- Aucune seam SDK spécifique au provider pour les canaux intégrés.

## Modèle cible

Ajouter un champ `presentation` possédé par le core à `ReplyPayload`.

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

- le bloc texte `interactive` se mappe vers `presentation.blocks[].type = "text"`.
- le bloc boutons `interactive` se mappe vers `presentation.blocks[].type = "buttons"`.
- le bloc sélection `interactive` se mappe vers `presentation.blocks[].type = "select"`.

Les schémas externes de l’agent et de la CLI utilisent désormais `presentation` ; `interactive` reste un helper interne hérité d’analyse/rendu pour les producteurs de réponses existants.

## Métadonnées de distribution

Ajouter un champ `delivery` possédé par le core pour le comportement d’envoi qui n’est pas de l’interface.

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
- `required` vaut `false` par défaut ; les canaux non pris en charge ou un échec d’épinglage se dégradent automatiquement en poursuivant la distribution.
- Les actions manuelles de message `pin`, `unpin` et `list-pins` restent pour les messages existants.

La liaison de sujet ACP Telegram actuelle doit passer de `channelData.telegram.pin = true` à `delivery.pin = true`.

## Contrat de capacité d’exécution

Ajouter des hooks de rendu de présentation et de distribution à l’adaptateur sortant d’exécution, pas au Plugin de canal du plan de contrôle.

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

Comportement du core :

- Résoudre le canal cible et l’adaptateur d’exécution.
- Demander les capacités de présentation.
- Dégrader les blocs non pris en charge avant le rendu.
- Appeler `renderPresentation`.
- S’il n’existe pas de moteur de rendu, convertir la présentation en repli texte.
- Après un envoi réussi, appeler `pinDeliveredMessage` lorsque `delivery.pin` est demandé et pris en charge.

## Correspondance par canal

Discord :

- Rendre `presentation` en components v2 et conteneurs Carbon dans des modules runtime-only.
- Conserver les helpers de couleur d’accent dans des modules légers.
- Supprimer les imports `DiscordUiContainer` du code de plan de contrôle du Plugin de canal.

Slack :

- Rendre `presentation` en Block Kit.
- Supprimer l’entrée `blocks` de l’agent et de la CLI.

Telegram :

- Rendre texte, contexte et séparateurs en texte.
- Rendre actions et sélection sous forme de claviers inline lorsqu’ils sont configurés et autorisés pour la surface cible.
- Utiliser le repli texte lorsque les boutons inline sont désactivés.
- Déplacer l’épinglage du sujet ACP vers `delivery.pin`.

Mattermost :

- Rendre les actions sous forme de boutons interactifs lorsqu’ils sont configurés.
- Rendre les autres blocs via un repli texte.

Microsoft Teams :

- Rendre `presentation` en Adaptive Cards.
- Conserver les actions manuelles `pin`/`unpin`/`list-pins`.
- Implémenter éventuellement `pinDeliveredMessage` si la prise en charge Graph est fiable pour la conversation cible.

Feishu :

- Rendre `presentation` en cartes interactives.
- Conserver les actions manuelles `pin`/`unpin`/`list-pins`.
- Implémenter éventuellement `pinDeliveredMessage` pour l’épinglage des messages envoyés si le comportement de l’API est fiable.

LINE :

- Rendre `presentation` en messages Flex ou template lorsque c’est possible.
- Revenir au texte pour les blocs non pris en charge.
- Supprimer les charges utiles d’interface LINE de `channelData`.

Canaux simples ou limités :

- Convertir la présentation en texte avec une mise en forme conservative.

## Étapes de refactorisation

1. Réappliquer le correctif de release Discord qui sépare `ui-colors.ts` de l’interface adossée à Carbon et supprime `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Ajouter `presentation` et `delivery` à `ReplyPayload`, à la normalisation des charges utiles sortantes, aux résumés de distribution et aux charges utiles de hook.
3. Ajouter le schéma `MessagePresentation` et des helpers d’analyse dans un sous-chemin SDK/runtime étroit.
4. Remplacer les capacités de message `buttons`, `cards`, `components` et `blocks` par des capacités de présentation sémantiques.
5. Ajouter des hooks d’adaptateur sortant d’exécution pour le rendu de présentation et l’épinglage de distribution.
6. Remplacer la construction de composants inter-contexte par `buildCrossContextPresentation`.
7. Supprimer `src/infra/outbound/channel-adapters.ts` et retirer `buildCrossContextComponents` des types du Plugin de canal.
8. Modifier `maybeApplyCrossContextMarker` pour attacher `presentation` au lieu de paramètres natifs.
9. Mettre à jour les chemins d’envoi plugin-dispatch afin qu’ils ne consomment que la présentation sémantique et les métadonnées de distribution.
10. Supprimer les paramètres de charge utile native de l’agent et de la CLI : `components`, `blocks`, `buttons` et `card`.
11. Supprimer les helpers SDK qui créent des schémas natifs d’outil de message, en les remplaçant par des helpers de schéma de présentation.
12. Supprimer les enveloppes UI/natives de `channelData` ; ne conserver que les métadonnées de transport jusqu’à examen de chaque champ restant.
13. Migrer les moteurs de rendu Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu et LINE.
14. Mettre à jour la documentation de la CLI de message, des pages de canal, du Plugin SDK et du cookbook de capacités.
15. Exécuter un profilage de diffusion des imports pour Discord et les points d’entrée de canal affectés.

Les étapes 1-11 et 13-14 sont implémentées dans cette refactorisation pour les contrats de l’agent partagé, de la CLI, des capacités du Plugin et de l’adaptateur sortant. L’étape 12 reste un passage de nettoyage interne plus profond pour les enveloppes de transport `channelData` privées au provider. L’étape 15 reste une validation de suivi si nous voulons des chiffres quantifiés de diffusion des imports au-delà de la gate de types/tests.

## Tests

Ajouter ou mettre à jour :

- tests de normalisation de présentation.
- tests d’auto-dégradation de la présentation pour les blocs non pris en charge.
- tests de marqueur inter-contexte pour les chemins plugin-dispatch et de distribution core.
- tests de matrice de rendu de canal pour Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE et le repli texte.
- tests de schéma d’outil de message prouvant que les champs natifs ont disparu.
- tests CLI prouvant que les flags natifs ont disparu.
- régression de paresse d’import du point d’entrée Discord couvrant Carbon.
- tests d’épinglage de distribution couvrant Telegram et le repli générique.

## Questions ouvertes

- `delivery.pin` doit-il être implémenté pour Discord, Slack, Microsoft Teams et Feishu dès le premier passage, ou seulement pour Telegram d’abord ?
- `delivery` doit-il à terme absorber des champs existants comme `replyToId`, `replyToCurrent`, `silent` et `audioAsVoice`, ou rester centré sur les comportements post-envoi ?
- La présentation doit-elle prendre directement en charge les images ou références de fichier, ou les médias doivent-ils rester séparés de la mise en page de l’interface pour le moment ?
