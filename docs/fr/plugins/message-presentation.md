---
read_when:
    - Ajout ou modification du rendu des cartes de message, boutons ou sélections
    - Création d’un plugin de canal prenant en charge des messages sortants enrichis
    - Modification des capacités de présentation ou de distribution de l’outil de message
    - Débogage des régressions de rendu spécifiques au provider pour les cartes/blocs/composants
summary: Cartes de message sémantiques, boutons, sélections, texte de repli et indications de distribution pour les plugins de canal
title: Présentation des messages
x-i18n:
    generated_at: "2026-04-22T04:24:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Présentation des messages

La présentation des messages est le contrat partagé d’OpenClaw pour les interfaces de chat sortantes enrichies.
Elle permet aux agents, aux commandes CLI, aux flux d’approbation et aux plugins de décrire
une seule fois l’intention du message, tandis que chaque plugin de canal effectue le rendu
dans la meilleure forme native possible.

Utilisez la présentation pour une interface de message portable :

- sections de texte
- petit texte de contexte/pied de page
- séparateurs
- boutons
- menus de sélection
- titre et ton de carte

N’ajoutez pas de nouveaux champs natifs au provider comme `components` pour Discord, `blocks` pour Slack,
`buttons` pour Telegram, `card` pour Teams ou `card` pour Feishu dans l’outil de message
partagé. Ce sont des sorties de moteur de rendu possédées par le plugin de canal.

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

- `value` est une valeur d’action applicative reroutée via le chemin
  d’interaction existant du canal lorsque le canal prend en charge les contrôles cliquables.
- `url` est un bouton de lien. Il peut exister sans `value`.
- `label` est requis et est aussi utilisé dans le texte de repli.
- `style` est indicatif. Les moteurs de rendu doivent mapper les styles non pris en charge vers une valeur
  sûre par défaut, sans faire échouer l’envoi.

Sémantique des sélections :

- `options[].value` est la valeur applicative sélectionnée.
- `placeholder` est indicatif et peut être ignoré par les canaux sans prise en charge native
  des sélections.
- Si un canal ne prend pas en charge les sélections, le texte de repli liste les libellés.

## Exemples côté producteur

Carte simple :

```json
{
  "title": "Approbation de déploiement",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "La canary est prête à être promue." },
    { "type": "context", "text": "Build 1234, staging validée." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approuver", "value": "deploy:approve", "style": "success" },
        { "label": "Refuser", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Bouton de lien URL uniquement :

```json
{
  "blocks": [
    { "type": "text", "text": "Les notes de version sont prêtes." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Ouvrir les notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu de sélection :

```json
{
  "title": "Choisir l’environnement",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environnement",
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
  --message "Approbation de déploiement" \
  --presentation '{"title":"Approbation de déploiement","tone":"warning","blocks":[{"type":"text","text":"La canary est prête."},{"type":"buttons","buttons":[{"label":"Approuver","value":"deploy:approve","style":"success"},{"label":"Refuser","value":"deploy:decline","style":"danger"}]}]}'
```

Distribution épinglée :

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Sujet ouvert" \
  --pin
```

Distribution épinglée avec JSON explicite :

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contrat du moteur de rendu

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

Les champs de capacité sont volontairement de simples booléens. Ils décrivent ce que le
moteur de rendu peut rendre interactif, pas toutes les limites de la plateforme native. Les moteurs de rendu restent
responsables des limites spécifiques à la plateforme comme le nombre maximal de boutons, le nombre de blocs et la taille des cartes.

## Flux de rendu du core

Lorsqu’un `ReplyPayload` ou une action de message inclut `presentation`, le core :

1. normalise la charge utile de présentation.
2. résout l’adaptateur sortant du canal cible.
3. lit `presentationCapabilities`.
4. appelle `renderPresentation` lorsque l’adaptateur peut rendre la charge utile.
5. revient à un texte conservateur lorsque l’adaptateur est absent ou ne peut pas effectuer le rendu.
6. envoie la charge utile résultante via le chemin normal de distribution du canal.
7. applique les métadonnées de distribution comme `delivery.pin` après le premier
   message envoyé avec succès.

Le core possède le comportement de repli afin que les producteurs puissent rester agnostiques du canal. Les
plugins de canal possèdent le rendu natif et la gestion des interactions.

## Règles de dégradation

La présentation doit pouvoir être envoyée en toute sécurité sur des canaux limités.

Le texte de repli inclut :

- `title` comme première ligne
- les blocs `text` comme paragraphes normaux
- les blocs `context` comme lignes de contexte compactes
- les blocs `divider` comme séparateur visuel
- les libellés des boutons, y compris les URL pour les boutons de lien
- les libellés des options de sélection

Les contrôles natifs non pris en charge doivent se dégrader plutôt que faire échouer l’ensemble de l’envoi.
Exemples :

- Telegram avec les boutons inline désactivés envoie un texte de repli.
- Un canal sans prise en charge des sélections liste les options de sélection en texte.
- Un bouton à URL seule devient soit un bouton de lien natif, soit une ligne URL de repli.
- Les échecs d’épinglage facultatifs ne font pas échouer le message distribué.

L’exception principale est `delivery.pin.required: true` ; si un épinglage est demandé comme
obligatoire et que le canal ne peut pas épingler le message envoyé, la distribution signale un échec.

## Correspondance par provider

Moteurs de rendu intégrés actuels :

| Canal           | Cible de rendu native                | Remarques                                                                                                                                         |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components et conteneurs de composants | Préserve l’ancien `channelData.discord.components` pour les producteurs existants de charges utiles natives au provider, mais les nouveaux envois partagés doivent utiliser `presentation`. |
| Slack           | Block Kit                            | Préserve l’ancien `channelData.slack.blocks` pour les producteurs existants de charges utiles natives au provider, mais les nouveaux envois partagés doivent utiliser `presentation`. |
| Telegram        | Texte plus claviers inline           | Les boutons/sélections nécessitent la capacité de boutons inline pour la surface cible ; sinon, un texte de repli est utilisé.                 |
| Mattermost      | Texte plus props interactives        | Les autres blocs se dégradent en texte.                                                                                                           |
| Microsoft Teams | Adaptive Cards                       | Le texte `message` brut est inclus avec la carte lorsque les deux sont fournis.                                                                   |
| Feishu          | Cartes interactives                  | L’en-tête de carte peut utiliser `title` ; le corps évite de dupliquer ce titre.                                                                 |
| Canaux simples  | Texte de repli                       | Les canaux sans moteur de rendu obtiennent tout de même une sortie lisible.                                                                       |

La compatibilité avec les charges utiles natives au provider est une facilité de transition pour les
producteurs de réponses existants. Ce n’est pas une raison pour ajouter de nouveaux champs natifs partagés.

## Présentation vs InteractiveReply

`InteractiveReply` est l’ancien sous-ensemble interne utilisé par les helpers d’approbation et d’interaction.
Il prend en charge :

- texte
- boutons
- sélections

`MessagePresentation` est le contrat partagé canonique d’envoi. Il ajoute :

- titre
- ton
- contexte
- séparateur
- boutons à URL seule
- métadonnées de distribution génériques via `ReplyPayload.delivery`

Utilisez les helpers de `openclaw/plugin-sdk/interactive-runtime` lors du pont avec l’ancien
code :

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Le nouveau code doit accepter ou produire directement `MessagePresentation`.

## Épinglage de distribution

L’épinglage est un comportement de distribution, pas de présentation. Utilisez `delivery.pin` au lieu de
champs natifs au provider comme `channelData.telegram.pin`.

Sémantique :

- `pin: true` épingle le premier message distribué avec succès.
- `pin.notify` vaut `false` par défaut.
- `pin.required` vaut `false` par défaut.
- Les échecs d’épinglage facultatifs se dégradent et laissent le message envoyé intact.
- Les échecs d’épinglage obligatoires font échouer la distribution.
- Les messages découpés en blocs épinglent le premier segment distribué, pas le segment final.

Les actions manuelles de message `pin`, `unpin` et `pins` existent toujours pour les
messages existants lorsque le provider prend en charge ces opérations.

## Checklist pour les auteurs de plugins

- Déclarez `presentation` depuis `describeMessageTool(...)` lorsque le canal peut
  rendre ou dégrader en toute sécurité une présentation sémantique.
- Ajoutez `presentationCapabilities` à l’adaptateur sortant d’exécution.
- Implémentez `renderPresentation` dans le code d’exécution, pas dans le code
  d’initialisation du Plugin de plan de contrôle.
- Gardez les bibliothèques d’interface natives hors des chemins chauds de configuration/catalogue.
- Préservez les limites de la plateforme dans le moteur de rendu et les tests.
- Ajoutez des tests de repli pour les boutons, sélections, boutons URL, duplication titre/texte non pris en charge,
  et les envois mixtes `message` plus `presentation`.
- Ajoutez la prise en charge de l’épinglage de distribution via `deliveryCapabilities.pin` et
  `pinDeliveredMessage` uniquement lorsque le provider peut épingler l’ID du message envoyé.
- N’exposez pas de nouveaux champs natifs au provider pour carte/bloc/composant/bouton via
  le schéma partagé des actions de message.

## Documentation associée

- [CLI Message](/cli/message)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [Architecture du Plugin](/fr/plugins/architecture#message-tool-schemas)
- [Plan de refactorisation de la présentation des canaux](/fr/plan/ui-channels)
