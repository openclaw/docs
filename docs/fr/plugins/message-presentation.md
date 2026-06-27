---
read_when:
    - Ajout ou modification du rendu des cartes de message, des boutons ou des sélecteurs
    - Créer un plugin de canal prenant en charge les messages sortants enrichis
    - Modifier la présentation des outils de message ou les capacités de livraison
    - Débogage des régressions de rendu des cartes/blocs/composants propres aux fournisseurs
summary: Cartes de message sémantiques, boutons, menus de sélection, texte de repli et indications de livraison pour les plugins de canal
title: Présentation des messages
x-i18n:
    generated_at: "2026-06-27T17:50:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

La présentation des messages est le contrat partagé d’OpenClaw pour les interfaces de chat sortantes enrichies.
Elle permet aux agents, aux commandes CLI, aux flux d’approbation et aux plugins de décrire une seule fois l’intention du message, tandis que chaque plugin de canal affiche la meilleure forme native possible.

Utilisez la présentation pour une interface de message portable :

- sections de texte
- petit texte de contexte/pied de page
- séparateurs
- boutons
- menus de sélection
- titre et ton de carte

N’ajoutez pas de nouveaux champs natifs de fournisseur tels que Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` ou Feishu `card` à l’outil de message partagé. Ce sont des sorties de rendu appartenant au plugin de canal.

## Contrat

Les auteurs de plugins importent le contrat public depuis :

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Forme :

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
};

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

Sémantique des boutons :

- `action.type: "command"` exécute une commande slash native via le chemin de commande du cœur. Utilisez cela pour les boutons et menus de commandes intégrés.
- `action.type: "callback"` transporte des données opaques de plugin via le chemin d’interaction du canal. Les plugins de canal ne doivent pas réinterpréter les données de rappel comme des commandes slash.
- `value` est l’ancienne valeur de rappel opaque. Les nouveaux contrôles doivent utiliser `action` afin que les plugins de canal puissent mapper les commandes et les rappels sans déduire à partir du texte.
- `url` est un bouton de lien. Il peut exister sans `value`.
- `webApp` décrit un bouton d’application web natif du canal. Telegram l’affiche comme `web_app` et ne le prend en charge que dans les discussions privées. `web_app` reste accepté dans les charges utiles JSON souples pour compatibilité, mais les producteurs TypeScript doivent utiliser `webApp`.
- `label` est obligatoire et est aussi utilisé dans le repli textuel.
- `style` est indicatif. Les moteurs de rendu doivent mapper les styles non pris en charge vers une valeur par défaut sûre, et non faire échouer l’envoi.
- `priority` est facultatif. Lorsqu’un canal annonce des limites d’actions et que des contrôles doivent être supprimés, le cœur conserve d’abord les boutons de priorité plus élevée et préserve l’ordre d’origine entre les boutons de priorité égale. Lorsque tous les contrôles tiennent, l’ordre rédigé est préservé.
- `disabled` est facultatif. Les canaux doivent s’y inscrire avec `supportsDisabled`; sinon, le cœur dégrade le contrôle désactivé en texte de repli non interactif.
- `reusable` est facultatif. Les canaux qui prennent en charge les rappels natifs réutilisables peuvent conserver l’action disponible après une interaction réussie. Utilisez-le pour les actions répétables ou idempotentes comme actualiser, inspecter ou afficher plus de détails ; laissez-le non défini pour les approbations ponctuelles normales et les actions destructrices.

Sémantique des sélections :

- `options[].action` a le même sens commande/rappel que le bouton `action`.
- `options[].value` est l’ancienne valeur applicative sélectionnée.
- `placeholder` est indicatif et peut être ignoré par les canaux sans prise en charge native de sélection.
- Si un canal ne prend pas en charge les sélections, le texte de repli liste les libellés.

## Exemples de producteurs

Carte simple :

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Bouton de lien uniquement URL :

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Bouton Mini App Telegram :

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Menu de sélection :

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Envoi CLI :

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Livraison épinglée :

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Livraison épinglée avec JSON explicite :

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contrat de rendu

Les plugins de canal déclarent la prise en charge du rendu sur leur adaptateur sortant :

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Les booléens de capacité décrivent ce que le moteur de rendu peut rendre interactif. Les `limits` facultatives décrivent l’enveloppe générique que le cœur peut adapter avant d’appeler le moteur de rendu :

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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
```

Le cœur applique des limites génériques aux contrôles sémantiques avant le rendu. Les moteurs de rendu restent responsables de la validation finale spécifique au fournisseur et du rognage pour le nombre de blocs natifs, la taille de carte, les limites d’URL et les particularités des fournisseurs qui ne peuvent pas être exprimées dans le contrat générique. Si les limites retirent tous les contrôles d’un bloc, le cœur conserve les libellés sous forme de texte de contexte non interactif afin que le message livré dispose toujours d’un repli visible.

## Flux de rendu du cœur

Lorsqu’un `ReplyPayload` ou une action de message inclut `presentation`, le cœur :

1. Normalise la charge utile de présentation.
2. Résout l’adaptateur sortant du canal cible.
3. Lit `presentationCapabilities`.
4. Applique les limites de capacité génériques comme le nombre d’actions, la longueur des libellés et le nombre d’options de sélection lorsque l’adaptateur les annonce.
5. Appelle `renderPresentation` lorsque l’adaptateur peut afficher la charge utile.
6. Se replie vers un texte prudent lorsque l’adaptateur est absent ou ne peut pas afficher.
7. Envoie la charge utile résultante via le chemin normal de livraison du canal.
8. Applique les métadonnées de livraison comme `delivery.pin` après le premier message envoyé avec succès.

Le cœur possède le comportement de repli afin que les producteurs puissent rester indépendants des canaux. Les plugins de canal possèdent le rendu natif et la gestion des interactions.

## Règles de dégradation

La présentation doit pouvoir être envoyée en toute sécurité sur les canaux limités.

Le texte de repli inclut :

- `title` comme première ligne
- les blocs `text` comme paragraphes normaux
- les blocs `context` comme lignes de contexte compactes
- les blocs `divider` comme séparateur visuel
- les libellés de boutons, y compris les URL pour les boutons de lien
- les libellés des options de sélection

Les contrôles natifs non pris en charge doivent se dégrader plutôt que faire échouer tout l’envoi.
Exemples :

- Telegram avec les boutons inline désactivés envoie un repli textuel.
- Un canal sans prise en charge des sélections liste les options de sélection sous forme de texte.
- Un bouton uniquement URL devient soit un bouton de lien natif, soit une ligne d’URL de repli.
- Les échecs d’épinglage facultatifs ne font pas échouer le message livré.

L’exception principale est `delivery.pin.required: true` ; si l’épinglage est demandé comme obligatoire et que le canal ne peut pas épingler le message envoyé, la livraison signale un échec.

## Mappage des fournisseurs

Moteurs de rendu groupés actuels :

| Canal           | Cible de rendu native               | Notes                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Composants et conteneurs de composants | Préserve l’ancien `channelData.discord.components` pour les producteurs de charges utiles natives de fournisseur existants, mais les nouveaux envois partagés doivent utiliser `presentation`. |
| Slack           | Block Kit                           | Préserve l’ancien `channelData.slack.blocks` pour les producteurs de charges utiles natives de fournisseur existants, mais les nouveaux envois partagés doivent utiliser `presentation`.       |
| Telegram        | Texte plus claviers inline          | Les boutons/sélections nécessitent la capacité de bouton inline pour la surface cible ; sinon, le repli textuel est utilisé.                      |
| Mattermost      | Texte plus propriétés interactives  | Les autres blocs se dégradent en texte.                                                                                                           |
| Microsoft Teams | Adaptive Cards                      | Le texte `message` brut est inclus avec la carte lorsque les deux sont fournis.                                                                    |
| Feishu          | Cartes interactives                 | L’en-tête de carte peut utiliser `title` ; le corps évite de dupliquer ce titre.                                                                  |
| Canaux simples  | Repli textuel                       | Les canaux sans moteur de rendu reçoivent tout de même une sortie lisible.                                                                         |

La compatibilité des charges utiles natives au fournisseur est une facilité de transition pour les
producteurs de réponses existants. Ce n’est pas une raison d’ajouter de nouveaux champs natifs partagés.

## Présentation vs InteractiveReply

`InteractiveReply` est l’ancien sous-ensemble interne utilisé par les assistants d’approbation et
d’interaction. Il prend en charge :

- texte
- boutons
- sélections

`MessagePresentation` est le contrat d’envoi partagé canonique. Il ajoute :

- titre
- ton
- contexte
- séparateur
- boutons URL uniquement
- métadonnées de livraison génériques via `ReplyPayload.delivery`

Utilisez les assistants de `openclaw/plugin-sdk/interactive-runtime` lors du pontage avec du
code plus ancien :

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Le nouveau code doit accepter ou produire directement `MessagePresentation`. Les charges utiles
`interactive` existantes sont un sous-ensemble obsolète de `presentation` ; la prise en charge à
l’exécution reste en place pour les anciens producteurs.

Les anciens types `InteractiveReply*` et assistants de conversion sont marqués
`@deprecated` dans le SDK :

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, et
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` et
`presentationToInteractiveControlsReply(...)` restent disponibles comme ponts de rendu
pour les anciennes implémentations de canaux. Le nouveau code producteur ne doit pas les appeler ;
envoyez `presentation` et laissez l’adaptation cœur/canal gérer le rendu.

Les assistants d’approbation ont également des remplacements axés d’abord sur la présentation :

- utilisez `buildApprovalPresentationFromActionDescriptors(...)` au lieu de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- utilisez `buildApprovalPresentation(...)` au lieu de
  `buildApprovalInteractiveReply(...)`
- utilisez `buildExecApprovalPresentation(...)` au lieu de
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` renvoie une chaîne vide pour les blocs de
présentation qui n’ont pas de repli textuel, comme une présentation contenant uniquement un
séparateur. Les transports qui exigent un corps d’envoi non vide peuvent passer
`emptyFallback` pour opter pour un corps minimal sans modifier le contrat de repli par défaut.

## Épinglage de livraison

L’épinglage relève du comportement de livraison, pas de la présentation. Utilisez `delivery.pin` au lieu de
champs natifs au fournisseur tels que `channelData.telegram.pin`.

Sémantique :

- `pin: true` épingle le premier message livré avec succès.
- `pin.notify` vaut `false` par défaut.
- `pin.required` vaut `false` par défaut.
- Les échecs d’épinglage facultatifs se dégradent et laissent le message envoyé intact.
- Les échecs d’épinglage requis font échouer la livraison.
- Les messages fragmentés épinglent le premier fragment livré, pas le dernier fragment.

Les actions de message manuelles `pin`, `unpin` et `pins` existent toujours pour les messages
existants lorsque le fournisseur prend en charge ces opérations.

## Liste de contrôle des auteurs de Plugin

- Déclarez `presentation` depuis `describeMessageTool(...)` lorsque le canal peut
  rendre ou dégrader sans risque la présentation sémantique.
- Ajoutez `presentationCapabilities` à l’adaptateur sortant d’exécution.
- Implémentez `renderPresentation` dans le code d’exécution, pas dans le code de
  configuration du Plugin du plan de contrôle.
- Gardez les bibliothèques d’interface natives hors des chemins critiques de configuration/catalogue.
- Déclarez les limites de capacité génériques sur `presentationCapabilities.limits` lorsqu’elles
  sont connues.
- Préservez les limites finales de la plateforme dans le moteur de rendu et les tests.
- Ajoutez des tests de repli pour les boutons non pris en charge, les sélections, les boutons URL, la
  duplication titre/texte et les envois mixtes `message` plus `presentation`.
- Ajoutez la prise en charge de l’épinglage de livraison via `deliveryCapabilities.pin` et
  `pinDeliveredMessage` uniquement lorsque le fournisseur peut épingler l’id du message envoyé.
- N’exposez pas de nouveaux champs natifs au fournisseur de carte/bloc/composant/bouton via
  le schéma d’action de message partagé.

## Docs connexes

- [CLI de message](/fr/cli/message)
- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview)
- [Architecture de Plugin](/fr/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorisation de la présentation des canaux](/fr/plan/ui-channels)
