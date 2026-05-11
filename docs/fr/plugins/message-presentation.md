---
read_when:
    - Ajouter ou modifier le rendu des cartes de message, des boutons ou des menus de sélection
    - Créer un Plugin de canal prenant en charge les messages sortants enrichis
    - Modification de la présentation de l’outil de messagerie ou des capacités de remise
    - Débogage des régressions de rendu de cartes/blocs/composants spécifiques aux fournisseurs
summary: Cartes de message sémantiques, boutons, menus de sélection, texte de repli et indications de distribution pour les Plugins de canal
title: Présentation des messages
x-i18n:
    generated_at: "2026-05-11T20:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

La présentation des messages est le contrat partagé d’OpenClaw pour une interface de chat sortante riche.
Elle permet aux agents, aux commandes CLI, aux flux d’approbation et aux plugins de décrire l’intention
du message une seule fois, tandis que chaque plugin de canal rend la meilleure forme native possible.

Utilisez la présentation pour une interface de message portable :

- sections de texte
- petit texte de contexte/pied de page
- séparateurs
- boutons
- menus de sélection
- titre et tonalité de carte

N’ajoutez pas de nouveaux champs natifs de fournisseur tels que les `components` Discord, les
`blocks` Slack, les `buttons` Telegram, les `card` Teams ou les `card` Feishu à l’outil
de message partagé. Ce sont des sorties de rendu appartenant au plugin de canal.

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

- `value` est une valeur d’action applicative routée via le chemin d’interaction
  existant du canal lorsque celui-ci prend en charge les contrôles cliquables.
- `url` est un bouton de lien. Il peut exister sans `value`.
- `label` est obligatoire et est également utilisé dans le repli textuel.
- `style` est indicatif. Les moteurs de rendu doivent mapper les styles non pris
  en charge vers une valeur par défaut sûre, sans faire échouer l’envoi.

Sémantique des sélections :

- `options[].value` est la valeur applicative sélectionnée.
- `placeholder` est indicatif et peut être ignoré par les canaux sans prise en
  charge native des sélections.
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

Les champs de capacité sont volontairement de simples booléens. Ils décrivent ce que
le moteur de rendu peut rendre interactif, et non chaque limite de la plateforme native.
Les moteurs de rendu restent responsables des limites propres à la plateforme, comme
le nombre maximal de boutons, le nombre de blocs et la taille des cartes.

## Flux de rendu principal

Lorsqu’un `ReplyPayload` ou une action de message inclut `presentation`, le cœur :

1. Normalise la charge utile de présentation.
2. Résout l’adaptateur sortant du canal cible.
3. Lit `presentationCapabilities`.
4. Appelle `renderPresentation` lorsque l’adaptateur peut rendre la charge utile.
5. Se replie vers un texte conservateur lorsque l’adaptateur est absent ou ne peut pas rendre.
6. Envoie la charge utile résultante via le chemin normal de livraison du canal.
7. Applique les métadonnées de livraison telles que `delivery.pin` après le premier
   message envoyé avec succès.

Le cœur possède le comportement de repli afin que les producteurs puissent rester
agnostiques du canal. Les plugins de canal possèdent le rendu natif et la gestion
des interactions.

## Règles de dégradation

La présentation doit pouvoir être envoyée en toute sécurité sur des canaux limités.

Le texte de repli inclut :

- `title` comme première ligne
- les blocs `text` comme paragraphes normaux
- les blocs `context` comme lignes de contexte compactes
- les blocs `divider` comme séparateur visuel
- les libellés des boutons, y compris les URL pour les boutons de lien
- les libellés des options de sélection

Les contrôles natifs non pris en charge doivent se dégrader plutôt que faire échouer
tout l’envoi. Exemples :

- Telegram avec les boutons en ligne désactivés envoie le texte de repli.
- Un canal sans prise en charge des sélections liste les options de sélection comme texte.
- Un bouton uniquement URL devient soit un bouton de lien natif, soit une ligne d’URL de repli.
- Les échecs d’épinglage facultatif ne font pas échouer le message livré.

La principale exception est `delivery.pin.required: true` ; si l’épinglage est demandé
comme obligatoire et que le canal ne peut pas épingler le message envoyé, la livraison
signale un échec.

## Mappage des fournisseurs

Moteurs de rendu groupés actuels :

| Canal           | Cible de rendu native               | Notes                                                                                                                                                                             |
| --------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Composants et conteneurs de composants | Préserve les anciens `channelData.discord.components` pour les producteurs existants de charges utiles natives de fournisseur, mais les nouveaux envois partagés doivent utiliser `presentation`. |
| Slack           | Block Kit                           | Préserve les anciens `channelData.slack.blocks` pour les producteurs existants de charges utiles natives de fournisseur, mais les nouveaux envois partagés doivent utiliser `presentation`.       |
| Telegram        | Texte plus claviers en ligne        | Les boutons/sélections nécessitent la capacité de bouton en ligne pour la surface cible ; sinon, le texte de repli est utilisé.                                                     |
| Mattermost      | Texte plus props interactives       | Les autres blocs se dégradent en texte.                                                                                                                                           |
| Microsoft Teams | Adaptive Cards                      | Le texte `message` brut est inclus avec la carte lorsque les deux sont fournis.                                                                                                    |
| Feishu          | Cartes interactives                 | L’en-tête de carte peut utiliser `title` ; le corps évite de dupliquer ce titre.                                                                                                  |
| Canaux simples  | Texte de repli                      | Les canaux sans moteur de rendu obtiennent tout de même une sortie lisible.                                                                                                        |

La compatibilité avec les charges utiles natives de fournisseur est une facilité de
transition pour les producteurs de réponses existants. Ce n’est pas une raison pour
ajouter de nouveaux champs natifs partagés.

## Présentation vs InteractiveReply

`InteractiveReply` est l’ancien sous-ensemble interne utilisé par les assistants
d’approbation et d’interaction. Il prend en charge :

- texte
- boutons
- sélections

`MessagePresentation` est le contrat d’envoi partagé canonique. Il ajoute :

- titre
- tonalité
- contexte
- séparateur
- boutons uniquement URL
- métadonnées de livraison génériques via `ReplyPayload.delivery`

Utilisez les assistants de `openclaw/plugin-sdk/interactive-runtime` lors de la
transition depuis du code plus ancien :

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Le nouveau code doit accepter ou produire directement `MessagePresentation`.

`presentationToInteractiveReply(...)` préserve le texte visible de présentation en
mappant le titre, le texte, le contexte, les boutons et les sélections vers l’ancienne
forme `InteractiveReply`. Les moteurs de rendu de composants qui dessinent déjà
nativement les blocs de titre, texte, contexte et séparateur doivent utiliser
`presentationToInteractiveControlsReply(...)` à la place, puis ajouter uniquement
les contrôles de boutons et de sélection.

`renderMessagePresentationFallbackText(...)` renvoie une chaîne vide pour les blocs
de présentation qui n’ont pas de repli textuel, comme une présentation composée
uniquement d’un séparateur. Les transports qui exigent un corps d’envoi non vide
peuvent passer `emptyFallback` pour opter pour un corps minimal sans modifier le
contrat de repli par défaut.

## Épinglage de livraison

L’épinglage est un comportement de livraison, pas de présentation. Utilisez
`delivery.pin` au lieu de champs natifs de fournisseur tels que `channelData.telegram.pin`.

Sémantique :

- `pin: true` épingle le premier message livré avec succès.
- `pin.notify` vaut `false` par défaut.
- `pin.required` vaut `false` par défaut.
- Les échecs d’épinglage facultatif se dégradent et laissent le message envoyé intact.
- Les échecs d’épinglage obligatoire font échouer la livraison.
- Les messages découpés épinglent le premier fragment livré, pas le fragment final.

Les actions de message manuelles `pin`, `unpin` et `pins` existent toujours pour
les messages existants lorsque le fournisseur prend en charge ces opérations.

## Liste de vérification pour les auteurs de plugins

- Déclarez `presentation` depuis `describeMessageTool(...)` lorsque le canal peut
  rendre ou dégrader en toute sécurité une présentation sémantique.
- Ajoutez `presentationCapabilities` à l’adaptateur sortant d’exécution.
- Implémentez `renderPresentation` dans le code d’exécution, pas dans le code de
  configuration de plugin du plan de contrôle.
- Gardez les bibliothèques d’interface native hors des chemins chauds de configuration/catalogue.
- Préservez les limites de plateforme dans le moteur de rendu et les tests.
- Ajoutez des tests de repli pour les boutons non pris en charge, les sélections,
  les boutons URL, la duplication titre/texte et les envois mixtes `message` plus `presentation`.
- Ajoutez la prise en charge de l’épinglage de livraison via `deliveryCapabilities.pin` et
  `pinDeliveredMessage` uniquement lorsque le fournisseur peut épingler l’identifiant du message envoyé.
- N’exposez pas de nouveaux champs natifs de fournisseur pour carte/bloc/composant/bouton via
  le schéma d’action de message partagé.

## Docs associées

- [CLI de message](/fr/cli/message)
- [Présentation du SDK de plugin](/fr/plugins/sdk-overview)
- [Architecture des plugins](/fr/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorisation de la présentation des canaux](/fr/plan/ui-channels)
