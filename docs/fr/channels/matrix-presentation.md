---
read_when:
    - Création de clients Matrix affichant les réponses enrichies d’OpenClaw
    - Débogage du contenu des événements com.openclaw.presentation
summary: Métadonnées MessagePresentation de Matrix pour les clients compatibles avec OpenClaw
title: Métadonnées de présentation de Matrix
x-i18n:
    generated_at: "2026-07-12T15:05:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw attache des métadonnées `MessagePresentation` normalisées aux événements Matrix `m.room.message` sortants sous la clé de contenu `com.openclaw.presentation`.

Les clients Matrix standard continuent d’afficher le corps en texte brut `body`. Les clients compatibles avec OpenClaw peuvent lire les métadonnées structurées et afficher une interface utilisateur native, notamment des boutons, des listes de sélection, des lignes contextuelles et des séparateurs.

## Contenu de l’événement

```json
{
  "msgtype": "m.text",
  "body": "Sélectionner un modèle\n\nChoisissez un modèle :\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Sélectionner un modèle",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choisissez un modèle",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` est la version du schéma des métadonnées ; la version actuelle est `1`. `type` est un discriminateur stable, toujours égal à `"message.presentation"`. L’adaptateur Matrix n’émet que des charges utiles correspondant exactement à cette version et à ce type ; les clients doivent de même ignorer les versions inconnues qu’ils ne peuvent pas interpréter de manière sûre, les valeurs `type` inconnues et les types de blocs inconnus.
- `title` et `tone` (`info`, `success`, `warning`, `danger`, `neutral`) sont des indications facultatives.
- Les boutons et les options de sélection peuvent inclure une `action` typée (`{ "type": "command", "command": "/..." }` ou `{ "type": "callback", "value": "..." }`) en plus de la chaîne `value` héritée. Privilégiez `action` lorsque les deux sont présentes.

## Comportement de repli

OpenClaw génère toujours une version de repli lisible en texte brut dans `body`. Les métadonnées structurées sont complémentaires et ne doivent pas être requises pour l’interopérabilité de base avec Matrix.

Règles de rendu de la version de repli :

- Le contenu de `title`, `text` et `context` est rendu sous forme de lignes de texte brut.
- Les boutons dotés d’une action `command` sont rendus sous la forme ``label: `/command` `` afin que la commande reste copiable. Les boutons dotés d’une action `callback` ou uniquement d’une propriété `value` héritée affichent seulement leur libellé afin que les valeurs de rappel opaques restent privées ; les boutons désactivés affichent toujours uniquement leur libellé. Les boutons d’URL et d’application web sont rendus sous la forme `label: URL`.
- Les blocs de sélection affichent le texte indicatif (ou `Options:`) comme titre, suivi de lignes d’options contenant uniquement leur libellé.
- Si rien n’est rendu, par exemple dans une présentation contenant uniquement un séparateur, le corps utilise `---` comme contenu de repli.

Les clients non compatibles continuent d’afficher le texte de repli. Les clients compatibles avec OpenClaw peuvent privilégier les métadonnées structurées pour l’affichage tout en conservant la version de repli pour la copie, la recherche, les notifications et l’accessibilité.

## Blocs pris en charge

L’adaptateur sortant Matrix annonce une prise en charge native de :

- `buttons`
- `select`
- `context`
- `divider`

Les blocs `text` sont toujours pris en charge au moyen du corps de repli. Traitez tous les blocs comme des indications de présentation appliquées au mieux ; ignorez les champs et les types de blocs inconnus plutôt que de faire échouer l’ensemble du message.

## Interactions

Ces métadonnées n’ajoutent aucune sémantique de rappel Matrix. Les valeurs des boutons et des sélecteurs sont des charges utiles d’interaction de repli, généralement des commandes slash ou des commandes textuelles. Un client Matrix souhaitant prendre en charge l’interaction résout la valeur du contrôle (`action.command`, puis `action.value`, puis `value`) et la renvoie dans le salon sous forme de message normal.

Par exemple, un bouton ayant pour valeur `/model deepseek/deepseek-chat` peut être traité en envoyant cette valeur sous forme de message texte Matrix chiffré dans le même salon.

## Relation avec les métadonnées d’approbation

`com.openclaw.presentation` sert à la présentation générale des messages enrichis.

Les demandes d’approbation utilisent les métadonnées dédiées `com.openclaw.approval`, car les approbations contiennent un état sensible pour la sécurité, des décisions et des détails sur l’exécution ou les Plugins. Si les deux clés de métadonnées figurent sur le même événement, les clients doivent privilégier le moteur de rendu dédié aux approbations.

## Messages multimédias

Lorsqu’une réponse contient plusieurs URL de médias, OpenClaw envoie un événement Matrix par URL de média. Le texte de la légende et les métadonnées de présentation ne sont associés qu’au premier événement, afin que les clients reçoivent une seule charge utile structurée stable sans moteurs de rendu en double. La même règle s’applique lorsqu’un texte long est découpé entre plusieurs événements : les métadonnées ne sont associées qu’au premier événement.

Conservez des métadonnées de présentation compactes. Le texte volumineux visible par l’utilisateur doit rester dans `body` et utiliser le mécanisme normal de découpage du texte de Matrix.
