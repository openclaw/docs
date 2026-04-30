---
read_when:
    - Ajout ou modification du rendu des cartes de message, des boutons ou des menus de sélection
    - Création d’un Plugin de canal prenant en charge les messages sortants enrichis
    - Modifier la présentation de l’outil de messagerie ou les capacités de remise
    - Débogage des régressions de rendu de cartes/blocs/composants propres aux fournisseurs
summary: Cartes de messages sémantiques, boutons, menus de sélection, texte de repli et indications de livraison pour les plugins de canal
title: Présentation des messages
x-i18n:
    generated_at: "2026-04-30T07:39:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

La présentation des messages est le contrat partagé d’OpenClaw pour une interface de chat sortante enrichie.
Elle permet aux agents, commandes CLI, flux d’approbation et plugins de décrire une seule fois l’intention du message, tandis que chaque plugin de canal l’affiche sous la meilleure forme native possible.

Utilisez la présentation pour une interface de message portable :

- sections de texte
- petit texte de contexte/pied de page
- séparateurs
- boutons
- menus de sélection
- titre et ton de carte

N’ajoutez pas de nouveaux champs natifs de fournisseur comme Discord `components`, Slack `blocks`, Telegram `buttons`, Teams `card` ou Feishu `card` à l’outil de message partagé. Ce sont des sorties de rendu détenues par le plugin de canal.

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

- `value` est une valeur d’action applicative renvoyée par le chemin d’interaction existant du canal lorsque celui-ci prend en charge les contrôles cliquables.
- `url` est un bouton de lien. Il peut exister sans `value`.
- `label` est obligatoire et est aussi utilisé dans le texte de repli.
- `style` est indicatif. Les moteurs de rendu doivent faire correspondre les styles non pris en charge à une valeur par défaut sûre, sans faire échouer l’envoi.

Sémantique de la sélection :

- `options[].value` est la valeur applicative sélectionnée.
- `placeholder` est indicatif et peut être ignoré par les canaux sans prise en charge native des sélections.
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

Bouton de lien avec URL uniquement :

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

Les champs de capacité sont volontairement de simples booléens. Ils décrivent ce que le moteur de rendu peut rendre interactif, pas toutes les limites de la plateforme native. Les moteurs de rendu restent responsables des limites propres à chaque plateforme, comme le nombre maximal de boutons, le nombre de blocs et la taille de carte.

## Flux de rendu du cœur

Lorsqu’un `ReplyPayload` ou une action de message inclut `presentation`, le cœur :

1. Normalise la charge utile de présentation.
2. Résout l’adaptateur sortant du canal cible.
3. Lit `presentationCapabilities`.
4. Appelle `renderPresentation` lorsque l’adaptateur peut afficher la charge utile.
5. Revient à un texte prudent lorsque l’adaptateur est absent ou ne peut pas effectuer le rendu.
6. Envoie la charge utile obtenue par le chemin de livraison normal du canal.
7. Applique les métadonnées de livraison comme `delivery.pin` après le premier message envoyé avec succès.

Le cœur détient le comportement de repli afin que les producteurs puissent rester indépendants des canaux. Les plugins de canal détiennent le rendu natif et la gestion des interactions.

## Règles de dégradation

La présentation doit pouvoir être envoyée sans risque sur les canaux limités.

Le texte de repli inclut :

- `title` comme première ligne
- les blocs `text` comme paragraphes normaux
- les blocs `context` comme lignes de contexte compactes
- les blocs `divider` comme séparateur visuel
- les libellés de boutons, y compris les URL des boutons de lien
- les libellés des options de sélection

Les contrôles natifs non pris en charge doivent se dégrader plutôt que faire échouer tout l’envoi. Exemples :

- Telegram avec les boutons en ligne désactivés envoie un texte de repli.
- Un canal sans prise en charge des sélections liste les options de sélection sous forme de texte.
- Un bouton avec URL uniquement devient soit un bouton de lien natif, soit une ligne d’URL de repli.
- Les échecs d’épinglage facultatifs ne font pas échouer le message livré.

La principale exception est `delivery.pin.required: true` ; si l’épinglage est demandé comme obligatoire et que le canal ne peut pas épingler le message envoyé, la livraison signale un échec.

## Correspondance des fournisseurs

Moteurs de rendu groupés actuels :

| Canal           | Cible de rendu native                 | Notes                                                                                                                                                                            |
| --------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Composants et conteneurs de composants | Préserve l’ancien `channelData.discord.components` pour les producteurs de charges utiles natives de fournisseur existants, mais les nouveaux envois partagés doivent utiliser `presentation`. |
| Slack           | Block Kit                             | Préserve l’ancien `channelData.slack.blocks` pour les producteurs de charges utiles natives de fournisseur existants, mais les nouveaux envois partagés doivent utiliser `presentation`.       |
| Telegram        | Texte avec claviers en ligne          | Les boutons/sélections nécessitent la capacité de bouton en ligne pour la surface cible ; sinon, le texte de repli est utilisé.                                                   |
| Mattermost      | Texte avec propriétés interactives     | Les autres blocs se dégradent en texte.                                                                                                                                          |
| Microsoft Teams | Adaptive Cards                        | Le texte `message` brut est inclus avec la carte lorsque les deux sont fournis.                                                                                                  |
| Feishu          | Cartes interactives                   | L’en-tête de carte peut utiliser `title` ; le corps évite de dupliquer ce titre.                                                                                                 |
| Canaux simples  | Texte de repli                        | Les canaux sans moteur de rendu reçoivent tout de même une sortie lisible.                                                                                                       |

La compatibilité des charges utiles natives de fournisseur est une facilité de transition pour les producteurs de réponses existants. Ce n’est pas une raison d’ajouter de nouveaux champs natifs partagés.

## Présentation ou InteractiveReply

`InteractiveReply` est l’ancien sous-ensemble interne utilisé par les assistants d’approbation et d’interaction. Il prend en charge :

- texte
- boutons
- sélections

`MessagePresentation` est le contrat canonique d’envoi partagé. Il ajoute :

- titre
- ton
- contexte
- séparateur
- boutons avec URL uniquement
- métadonnées de livraison génériques via `ReplyPayload.delivery`

Utilisez les assistants de `openclaw/plugin-sdk/interactive-runtime` lors de l’adaptation d’ancien code :

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Le nouveau code doit accepter ou produire directement `MessagePresentation`.

## Épinglage de livraison

L’épinglage est un comportement de livraison, pas une présentation. Utilisez `delivery.pin` au lieu de champs natifs de fournisseur comme `channelData.telegram.pin`.

Sémantique :

- `pin: true` épingle le premier message livré avec succès.
- `pin.notify` vaut `false` par défaut.
- `pin.required` vaut `false` par défaut.
- Les échecs d’épinglage facultatifs se dégradent et laissent le message envoyé intact.
- Les échecs d’épinglage obligatoires font échouer la livraison.
- Les messages découpés en morceaux épinglent le premier morceau livré, pas le dernier.

Les actions de message manuelles `pin`, `unpin` et `pins` existent toujours pour les messages existants lorsque le fournisseur prend en charge ces opérations.

## Liste de contrôle pour les auteurs de plugins

- Déclarez `presentation` depuis `describeMessageTool(...)` lorsque le canal peut afficher ou dégrader sans risque la présentation sémantique.
- Ajoutez `presentationCapabilities` à l’adaptateur sortant d’exécution.
- Implémentez `renderPresentation` dans le code d’exécution, pas dans le code de configuration de plugin du plan de contrôle.
- Gardez les bibliothèques d’interface native hors des chemins de configuration/catalogue critiques.
- Préservez les limites de la plateforme dans le moteur de rendu et les tests.
- Ajoutez des tests de repli pour les boutons non pris en charge, les sélections, les boutons d’URL, la duplication titre/texte et les envois mixtes `message` plus `presentation`.
- Ajoutez la prise en charge de l’épinglage de livraison via `deliveryCapabilities.pin` et `pinDeliveredMessage` uniquement lorsque le fournisseur peut épingler l’identifiant du message envoyé.
- N’exposez pas de nouveaux champs de carte/bloc/composant/bouton natifs de fournisseur via le schéma d’action de message partagé.

## Documentation connexe

- [CLI de message](/fr/cli/message)
- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview)
- [Architecture de Plugin](/fr/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorisation de la présentation des canaux](/fr/plan/ui-channels)
