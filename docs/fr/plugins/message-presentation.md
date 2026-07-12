---
read_when:
    - Ajout ou modification du rendu des cartes de message, graphiques, tableaux, boutons ou listes de sélection
    - Créer un Plugin de canal prenant en charge les messages sortants enrichis
    - Modification des capacités de présentation ou de distribution de l’outil de messagerie
    - Débogage des régressions de rendu des cartes, blocs et composants propres aux fournisseurs
summary: Cartes de message sémantiques, graphiques, tableaux, contrôles, texte de secours et indications de remise pour les plugins de canal
title: Présentation des messages
x-i18n:
    generated_at: "2026-07-12T15:34:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

La présentation des messages est le contrat partagé d’OpenClaw pour les interfaces de discussion sortantes enrichies.
Elle permet aux agents, aux commandes CLI, aux flux d’approbation et aux plugins de décrire une seule fois
l’intention du message, tandis que chaque plugin de canal produit la meilleure forme native possible.

Utilisez la présentation pour une interface de message portable : sections de texte, petit texte de contexte ou de pied de page,
séparateurs, graphiques, tableaux, boutons, menus de sélection, ainsi que titre et tonalité de carte.

N’ajoutez pas au niveau de l’outil de message partagé de nouveaux champs natifs propres aux fournisseurs, tels que les
`components` de Discord, les `blocks` de Slack, les `buttons` de Telegram, la `card` de Teams ou la `card` de Feishu.
Il s’agit de sorties de rendu qui appartiennent au plugin de canal.

## Contrat

Les auteurs de plugins importent le contrat public depuis :

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Structure :

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Valeur de rappel héritée. Préférez action pour les nouveaux contrôles. */
  value?: string;
  /** @deprecated Utilisez une action de type "url". */
  url?: string;
  /** @deprecated Utilisez une action de type "web-app". */
  webApp?: { url: string };
  /** @deprecated Utilisez une action de type "web-app". */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** Valeur de rappel héritée. Préférez action pour les nouveaux contrôles. */
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

- `action.type: "command"` exécute une commande slash native par l’intermédiaire du chemin de commandes
  du cœur. Utilisez ce type pour les boutons et menus de commandes intégrés.
- `action.type: "callback"` transporte des données opaques du plugin par l’intermédiaire du chemin
  d’interaction du canal. Les plugins de canal ne doivent pas réinterpréter les données de rappel comme des commandes
  slash.
- `action.type: "approval"` identifie une approbation durable d’un opérateur, son type explicite
  `exec` ou `plugin`, ainsi que la décision demandée. Les plugins de canal
  encodent cette action dans un rappel privé au transport et la résolvent par l’intermédiaire
  du service d’approbation ; ils ne doivent pas analyser le texte de la commande `/approve` ni déduire
  le type à partir de l’ID.
- `action.type: "url"` ouvre un lien normal.
- `action.type: "web-app"` lance une application web native du canal.
- `value` est la valeur de rappel opaque héritée. Les nouveaux contrôles doivent utiliser `action`
  afin que les plugins de canal puissent associer les commandes et les rappels sans faire de supposition à partir du texte.
- `url`, `webApp` et `web_app` restent acceptés comme entrées de frontière obsolètes.
  Les normalisateurs conservent ces champs afin que les moteurs de rendu puissent distinguer les sémantiques héritées
  déjà livrées des actions typées explicites. Les nouveaux producteurs doivent utiliser `action`.
- `label` est obligatoire et sert également dans le texte de repli.
- `style` est indicatif. Les moteurs de rendu doivent associer les styles non pris en charge à une valeur
  par défaut sûre, sans faire échouer l’envoi.
- `priority` est facultatif. Lorsqu’un canal annonce des limites d’actions et que des contrôles
  doivent être supprimés, le cœur conserve d’abord les boutons de priorité supérieure et préserve
  l’ordre d’origine entre les boutons de priorité égale. Lorsque tous les contrôles tiennent dans les limites, l’ordre
  de création est préservé.
- `disabled` est facultatif. Les canaux doivent explicitement activer `supportsDisabled` ; sinon,
  le cœur transforme le contrôle désactivé en texte de repli non interactif. Un
  bouton désactivé est toujours rendu uniquement sous forme de libellé dans le texte de repli, même lorsqu’il
  contient une action `command`.
- `reusable` est facultatif. Les canaux qui prennent en charge les rappels natifs réutilisables peuvent
  maintenir l’action disponible après une interaction réussie. Utilisez-le pour les
  actions répétables ou idempotentes telles que l’actualisation, l’inspection ou l’affichage de détails supplémentaires ;
  laissez-le non défini pour les approbations normales à usage unique et les actions destructrices.

Sémantique des sélections :

- `options[].action` accepte uniquement `command` ou `callback` ; les actions d’approbation et de lien sont réservées aux boutons.
- `options[].value` est la valeur d’application héritée de l’option sélectionnée.
- `placeholder` est indicatif et peut être ignoré par les canaux qui ne prennent pas en charge nativement
  les sélections.
- Si un canal ne prend pas en charge les sélections, le texte de repli répertorie les libellés.

Sémantique des graphiques :

- `pie` exige des valeurs de segments positives.
- `bar`, `area` et `line` utilisent un seul tableau ordonné `categories`. Chaque série
  fournit exactement une valeur finie par catégorie, dans le même ordre.
- Les libellés de catégories et les noms de séries doivent être uniques. Les blocs de graphique
  non valides ou incomplets sont supprimés pendant la normalisation plutôt que de modifier silencieusement les données.
- Le rendu natif des graphiques est activé explicitement par l’intermédiaire de `presentationCapabilities.charts`.
  Les autres canaux reçoivent le titre du graphique, les axes, les catégories, les séries et les valeurs
  sous forme de texte déterministe. Il s’agit également de la solution de repli pour l’accessibilité.

Sémantique des tableaux :

- `caption` est un titre court obligatoire. `headers` doit contenir au moins un
  libellé de colonne unique et non vide.
- `rows` doit contenir au moins une ligne. Chaque ligne doit comporter exactement une cellule par
  en-tête, et chaque cellule doit être une chaîne non vide ou un nombre fini.
- `rowHeaderColumnIndex` est un index facultatif basé sur zéro qui identifie la colonne
  dont les cellules doivent être exposées comme en-têtes de ligne par les moteurs de rendu natifs.
- La normalisation des tableaux est atomique. Une légende, un en-tête, une largeur de ligne, une cellule
  ou un index d’en-tête de ligne non valide entraîne la suppression du bloc de tableau au lieu de tronquer ou de réparer
  ses données.
- Le rendu natif des tableaux est activé explicitement par l’intermédiaire de `presentationCapabilities.tables`.
  Les autres canaux reçoivent la légende et chaque ligne sous forme de texte linéaire déterministe,
  avec les espaces internes réduits :

  ```text
  Pipeline ouvert (tableau)
  - Compte : Acme ; Étape : Gagnée ; ARR : 125000
  - Compte : Globex ; Étape : Révision ; ARR : 82000
  ```

Il n’existe aucun discriminateur `report` distinct. Composez un rapport à partir de blocs `title`,
`tone`, `text`, `context`, `chart`, `table` et d’actions. Cela permet à chaque
bloc d’être rendu indépendamment et fournit au rapport complet la même
solution de repli textuelle déterministe.

## Exemples de producteurs

Carte simple :

```json
{
  "title": "Approbation du déploiement",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary est prêt à être promu." },
    { "type": "context", "text": "Build 1234, environnement de préproduction validé." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Approuver",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "Refuser",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

Bouton contenant uniquement un lien URL :

```json
{
  "blocks": [
    { "type": "text", "text": "Les notes de version sont prêtes." },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Ouvrir les notes",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Bouton de mini-application Telegram :

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "Lancer",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
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

Graphique :

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "Chiffre d’affaires trimestriel",
      "categories": ["T1", "T2", "T3"],
      "series": [
        { "name": "Produit", "values": [120, 145, 138] },
        { "name": "Services", "values": [80, 95, 104] }
      ],
      "xLabel": "Trimestre",
      "yLabel": "Chiffre d’affaires"
    }
  ]
}
```

Rapport sous forme de tableau :

```json
{
  "title": "Rapport sur le pipeline",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "Opportunités actuelles par étape." },
    {
      "type": "table",
      "caption": "Pipeline ouvert",
      "headers": ["Compte", "Étape", "ARR"],
      "rows": [
        ["Acme", "Gagnée", 125000],
        ["Globex", "Révision", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "Mis à jour à partir de l’instantané du CRM." }
  ]
}
```

Envoi par la CLI :

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Approbation du déploiement" \
  --presentation '{"title":"Approbation du déploiement","tone":"warning","blocks":[{"type":"text","text":"Canary est prêt."},{"type":"buttons","buttons":[{"label":"Approuver","value":"deploy:approve","style":"success"},{"label":"Refuser","value":"deploy:decline","style":"danger"}]}]}'
```

Livraison épinglée :

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Sujet ouvert" \
  --pin
```

Livraison épinglée avec un JSON explicite :

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
    charts: false,
    tables: false,
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

Les valeurs booléennes de capacité décrivent ce que le moteur de rendu peut rendre interactif. Les
`limits` facultatives décrivent l’enveloppe générique que le cœur peut adapter avant d’appeler le
moteur de rendu :

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
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

Le cœur applique des limites génériques aux contrôles sémantiques avant le rendu. Les moteurs de rendu
restent responsables de la validation finale propre au fournisseur et de la troncature concernant le nombre
de blocs natifs, la taille des cartes, les limites d’URL et les particularités du fournisseur qui ne peuvent pas être exprimées dans
le contrat générique. Si les limites suppriment tous les contrôles d’un bloc, le cœur conserve
les libellés sous forme de texte contextuel non interactif afin que le message remis dispose toujours d’un
repli visible.

## Flux de rendu du cœur

Sur le chemin sortant canonique utilisé par la CLI et les actions de message standard, le cœur :

1. Normalise la charge utile de présentation.
2. Résout l’adaptateur sortant du canal cible.
3. Lit `presentationCapabilities`.
4. Applique les limites génériques de capacité, telles que le nombre d’actions, la longueur des libellés et
   le nombre d’options de sélection, lorsque l’adaptateur les annonce. Les blocs de graphiques et de tableaux
   sont convertis en texte déterministe, sauf si l’adaptateur annonce explicitement
   `charts: true` ou `tables: true`, respectivement.
5. Appelle `renderPresentation` lorsque l’adaptateur peut effectuer le rendu de la charge utile.
6. Se replie sur du texte prudent lorsque l’adaptateur est absent ou ne peut pas effectuer le rendu.
7. Envoie la charge utile obtenue via le chemin normal de remise du canal.
8. Applique les métadonnées de remise telles que `delivery.pin` après le premier message
   envoyé avec succès.

Les circuits locaux au canal de réponse ou d’aperçu qui consomment directement `ReplyPayload`
doivent soit emprunter ce chemin canonique, soit matérialiser le même repli de présentation
avant de réduire la charge utile à du texte brut ou à des médias.

Le cœur gère le comportement de repli afin que les producteurs puissent rester indépendants des canaux. Les
plugins de canal gèrent le rendu natif et le traitement des interactions.

## Règles de dégradation

La présentation doit pouvoir être envoyée en toute sécurité sur les canaux limités.

Le texte de repli comprend :

- `title` sur la première ligne
- les blocs `text` sous forme de paragraphes normaux
- les blocs `context` sous forme de lignes de contexte compactes
- les blocs `divider` sous forme de séparateur visuel
- les libellés des boutons, y compris les URL des boutons de lien
- les libellés des options de sélection
- le titre, le type, les axes, les catégories, les séries et les valeurs du graphique
- la légende du tableau, les en-têtes et chaque valeur de ligne

### Visibilité de la valeur de repli des boutons

Lorsqu’un canal ne peut pas afficher de contrôles interactifs, les valeurs des boutons et des sélecteurs sont remplacées par du texte brut. Ce comportement de repli préserve la facilité d’utilisation tout en gardant privées les données de rappel opaques :

- Les **actions typées `command`** s’affichent sous la forme `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**
  Les entrées affichent le texte de l’URL à côté du libellé du bouton, car l’URL est
  visible par l’utilisateur.
- Les **options de sélection** s’affichent uniquement sous forme de libellé. La valeur sous-jacente de l’option n’est pas
  exposée dans le texte de secours.

Les adaptateurs de canal qui ajoutent des instructions relatives aux commandes manuelles dans leur interface utilisateur de secours (par exemple,
les instructions sur les commentaires de documents Feishu) doivent déterminer la présence d’une commande
à partir des mêmes blocs de présentation que ceux utilisés par le moteur de rendu de secours, afin que le
texte d’instructions n’apparaisse que lorsqu’une commande manuelle est effectivement affichée.

Les contrôles natifs non pris en charge doivent être dégradés plutôt que de faire échouer l’ensemble de l’envoi.
Exemples :

- Telegram avec les boutons intégrés désactivés envoie une version de secours sous forme de texte.
- Un canal ne prenant pas en charge les sélections répertorie les options de sélection sous forme de texte.
- Un canal ne prenant pas en charge nativement les graphiques répertorie les données du graphique sous forme de texte.
- Un canal ne prenant pas en charge nativement les tableaux répertorie chaque ligne du tableau sous forme de texte.
- Un bouton contenant uniquement une URL devient soit un bouton de lien natif, soit une ligne d’URL de secours.
- Les échecs facultatifs d’épinglage ne font pas échouer la remise du message.

La principale exception est `delivery.pin.required: true` ; si l’épinglage est demandé comme
obligatoire et que le canal ne peut pas épingler le message envoyé, la remise signale un échec.

## Mappage des fournisseurs

Moteurs de rendu intégrés actuels :

| Canal           | Cible de rendu native                     | Remarques                                                                                                                                                                                                                  |
| --------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Composants et conteneurs de composants    | Préserve l’ancien `channelData.discord.components` pour les producteurs existants de charges utiles natives du fournisseur, mais les nouveaux envois partagés doivent utiliser `presentation`.                             |
| Feishu          | Cartes interactives                       | L’en-tête de la carte peut utiliser `title` ; le corps évite de dupliquer ce titre.                                                                                                                                         |
| Matrix          | Repli textuel avec champ d’événement structuré | Les boutons et sélecteurs sont annoncés comme pris en charge, mais chaque bloc est actuellement rendu sous forme de sortie `renderMessagePresentationFallbackText` transportée dans un champ d’événement `com.openclaw.presentation`, et non comme des widgets interactifs natifs. |
| Mattermost      | Texte avec propriétés interactives        | Les sélecteurs et les séparateurs ne sont pas pris en charge ; ces blocs sont dégradés en texte.                                                                                                                           |
| Microsoft Teams | Cartes adaptatives                        | Le texte brut `message` est inclus avec la carte lorsque les deux sont fournis. Les sélecteurs, les styles et l’état désactivé ne sont pas pris en charge.                                                                 |
| Slack           | Block Kit                                 | Rend `chart` sous forme de `data_visualization` native et `table` sous forme de `data_table` native ; préserve l’ancien `channelData.slack.blocks`, mais les nouveaux envois partagés doivent utiliser `presentation`.     |
| Telegram        | Texte avec claviers intégrés              | Les boutons et sélecteurs nécessitent la capacité de boutons intégrés pour la surface cible ; sinon, le repli textuel est utilisé.                                                                                          |
| Canaux simples  | Repli textuel                             | Les canaux dépourvus de moteur de rendu obtiennent tout de même une sortie lisible.                                                                                                                                         |

La compatibilité des charges utiles natives du fournisseur est une facilité de transition pour les producteurs
de réponses existants. Elle ne justifie pas l’ajout de nouveaux champs natifs partagés.

## Présentation ou InteractiveReply

`InteractiveReply` est l’ancien sous-ensemble interne utilisé par les assistants
d’approbation et d’interaction. Il prend en charge :

- le texte
- les boutons
- les sélecteurs

`MessagePresentation` est le contrat canonique d’envoi partagé. Il ajoute :

- le titre
- le ton
- le contexte
- le séparateur
- le graphique
- le tableau
- les boutons contenant uniquement une URL
- les métadonnées de livraison génériques via `ReplyPayload.delivery`

Utilisez les assistants de `openclaw/plugin-sdk/interactive-runtime` pour assurer la liaison avec l’ancien
code :
__OC_I18N_900014__
Le nouveau code doit accepter ou produire directement `MessagePresentation`. Les charges utiles
`interactive` existantes constituent un sous-ensemble obsolète de `presentation` ; la prise en charge à l’exécution
est maintenue pour les anciens producteurs.

Assistants non obsolètes à connaître :

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  valident et convertissent une charge utile non typée (par exemple, du JSON provenant de l’option CLI
  `--presentation`) en `MessagePresentation`.
- `isMessagePresentationInteractiveBlock(block)` restreint un bloc à l’union
  `buttons` | `select`.
- `resolveMessagePresentationButtonAction(button)` et
  `resolveMessagePresentationOptionAction(option)` renvoient l’action typée canonique
  tout en acceptant les champs de frontière obsolètes. Une `action` explicite
  est toujours prioritaire.
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` lisent uniquement les valeurs scalaires
  de commande ou de rappel. Une action canonique non scalaire ne se rabat jamais sur une
  valeur `value` ancienne parallèle ; les identifiants d’approbation et les cibles de liens restent donc typés.
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` rendent un bloc de données structurées
  sous forme de texte déterministe pour les chemins de repli propres aux canaux.

Les anciens types `InteractiveReply*` et assistants de conversion sont marqués
`@deprecated` dans le SDK :

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` et
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` et
`presentationToInteractiveControlsReply(...)` restent disponibles comme passerelles de rendu
pour les anciennes implémentations de canaux. Le nouveau code producteur ne doit pas les appeler ;
envoyez `presentation` et laissez l’adaptation du cœur ou du canal gérer le rendu.

Les assistants d’approbation disposent également de remplacements privilégiant la présentation :

- utilisez `buildApprovalPresentationFromActionDescriptors(...)` au lieu de
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- utilisez `buildApprovalPresentation(...)` au lieu de
  `buildApprovalInteractiveReply(...)`
- utilisez `buildExecApprovalPresentation(...)` au lieu de
  `buildExecApprovalInteractiveReply(...)`

Ces générateurs livrés restent adossés à des commandes pour assurer la compatibilité des plugins. Le Gateway
et le code des canaux intégrés qui possèdent un type d’approbation durable doivent utiliser
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)` ou
`buildTypedPluginApprovalPendingReplyPayload(...)` afin que les transports reçoivent une
action `approval` explicite au lieu de déduire la sémantique du texte `/approve`.

`renderMessagePresentationFallbackText(...)` renvoie une chaîne vide pour les
blocs de présentation dépourvus de repli textuel, comme une présentation contenant uniquement
un séparateur. Les transports qui exigent un corps d’envoi non vide peuvent transmettre
`emptyFallback` afin d’opter pour un corps minimal sans modifier le contrat de repli
par défaut.

## Épingle de livraison

L’épinglage relève du comportement de livraison, pas de la présentation. Utilisez `delivery.pin` au lieu de
champs natifs du fournisseur tels que `channelData.telegram.pin`.

Sémantique :

- `pin: true` épingle le premier message livré avec succès.
- `pin.notify` vaut `false` par défaut.
- `pin.required` vaut `false` par défaut.
- Les échecs d’épinglage facultatif entraînent un fonctionnement dégradé et laissent le message envoyé intact.
- Les échecs d’épinglage obligatoire font échouer la livraison.
- Pour les messages segmentés, le premier segment livré est épinglé, et non le dernier.

Les actions de message manuelles `pin`, `unpin` et `pins` existent toujours pour les
messages existants lorsque le fournisseur prend en charge ces opérations.

## Liste de contrôle pour les auteurs de Plugins

- Déclarez `presentation` à partir de `describeMessageTool(...)` lorsque le canal peut
  afficher la présentation sémantique ou appliquer sans risque un fonctionnement dégradé.
- Ajoutez `presentationCapabilities` à l’adaptateur sortant d’exécution.
- Implémentez `renderPresentation` dans le code d’exécution, et non dans le code de
  configuration du Plugin du plan de contrôle.
- Maintenez les bibliothèques d’interface utilisateur natives hors des chemins critiques de configuration et de catalogue.
- Déclarez les limites de capacité génériques dans `presentationCapabilities.limits` lorsqu’elles
  sont connues.
- Préservez les limites finales de la plateforme dans le moteur de rendu et les tests.
- Ajoutez des tests de repli pour les graphiques, tableaux, boutons, sélecteurs et boutons d’URL
  non pris en charge, la duplication du titre et du texte, ainsi que les envois combinant
  `message` et `presentation`.
- Ajoutez la prise en charge de l’épinglage lors de la livraison au moyen de `deliveryCapabilities.pin` et
  `pinDeliveredMessage` uniquement lorsque le fournisseur peut épingler l’identifiant du message envoyé.
- N’exposez pas de nouveaux champs natifs du fournisseur pour les cartes, blocs, composants ou boutons au moyen
  du schéma partagé des actions de message.

## Documentation associée

- [CLI de messagerie](/fr/cli/message)
- [Présentation du SDK des Plugins](/fr/plugins/sdk-overview)
- [Architecture des Plugins](/fr/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorisation de la présentation des canaux](/fr/plan/ui-channels)
