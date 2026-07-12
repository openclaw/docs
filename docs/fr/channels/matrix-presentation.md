---
read_when:
    - Création de clients Matrix affichant les réponses enrichies d’OpenClaw
    - Débogage du contenu des événements com.openclaw.presentation
summary: Métadonnées Matrix MessagePresentation pour les clients compatibles avec OpenClaw
title: Métadonnées de présentation de Matrix
x-i18n:
    generated_at: "2026-07-12T02:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw associe des métadonnées `MessagePresentation` normalisées aux événements Matrix `m.room.message` sortants sous la clé de contenu `com.openclaw.presentation`.

Les clients Matrix standard continuent d’afficher le texte brut de `body`. Les clients compatibles avec OpenClaw peuvent lire les métadonnées structurées et afficher une interface utilisateur native, notamment des boutons, des listes de sélection, des lignes de contexte et des séparateurs.

## Contenu de l’événement

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
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

- `version` est la version du schéma de métadonnées ; la version actuelle est `1`. `type` est un discriminant stable, toujours égal à `"message.presentation"`. L’adaptateur Matrix n’émet que des charges utiles possédant exactement cette version et ce type ; de même, les clients doivent ignorer les versions inconnues qu’ils ne peuvent pas interpréter de manière sûre, les valeurs de `type` inconnues et les types de blocs inconnus.
- `title` et `tone` (`info`, `success`, `warning`, `danger`, `neutral`) sont des indications facultatives.
- Les boutons et les options de sélection peuvent contenir une `action` typée (`{ "type": "command", "command": "/..." }` ou `{ "type": "callback", "value": "..." }`) en plus de l’ancienne chaîne `value`. Privilégiez `action` lorsque les deux sont présentes.

## Comportement de repli

OpenClaw génère toujours dans `body` un texte brut de repli lisible. Les métadonnées structurées sont complémentaires et ne doivent pas être requises pour l’interopérabilité Matrix de base.

Règles d’affichage de repli :

- Le contenu de `title`, `text` et `context` est affiché sous forme de lignes de texte brut.
- Les boutons dotés d’une action `command` sont affichés sous la forme ``libellé : `/commande` `` afin que la commande reste copiable. Les boutons dotés d’une action `callback` ou uniquement d’une ancienne valeur `value` n’affichent que leur libellé afin que les valeurs de rappel opaques restent privées ; les boutons désactivés n’affichent toujours que leur libellé. Les boutons d’URL et d’application web sont affichés sous la forme `libellé : URL`.
- Les blocs de sélection affichent le texte indicatif (ou `Options :`) comme titre, suivi de lignes d’options ne contenant que leur libellé.
- Si aucun élément n’est affiché, par exemple pour une présentation contenant uniquement un séparateur, le corps utilise `---` comme contenu de repli.

Les clients non compatibles continuent d’afficher le texte de repli. Les clients compatibles avec OpenClaw peuvent privilégier les métadonnées structurées pour l’affichage tout en conservant le contenu de repli pour la copie, la recherche, les notifications et l’accessibilité.

## Blocs pris en charge

L’adaptateur Matrix sortant annonce une prise en charge native des éléments suivants :

- `buttons`
- `select`
- `context`
- `divider`

Les blocs `text` sont toujours pris en charge par l’intermédiaire du corps de repli. Considérez tous les blocs comme des indications de présentation traitées dans la mesure du possible ; ignorez les champs et les types de blocs inconnus plutôt que de faire échouer l’intégralité du message.

## Interactions

Ces métadonnées n’ajoutent aucune sémantique de rappel à Matrix. Les valeurs des boutons et des options de sélection sont des charges utiles d’interaction de repli, généralement des commandes préfixées par une barre oblique ou des commandes textuelles. Un client Matrix souhaitant prendre en charge l’interaction résout la valeur du contrôle (`action.command`, puis `action.value`, puis `value`) et la renvoie dans la salle sous forme de message normal.

Par exemple, un bouton dont la valeur est `/model deepseek/deepseek-chat` peut être traité en envoyant cette valeur comme message texte Matrix chiffré dans la même salle.

## Relation avec les métadonnées d’approbation

`com.openclaw.presentation` sert à la présentation générale des messages enrichis.

Les demandes d’approbation utilisent les métadonnées dédiées `com.openclaw.approval`, car les approbations contiennent un état sensible pour la sécurité, des décisions ainsi que des détails sur l’exécution et les plugins. Si les deux clés de métadonnées sont présentes sur le même événement, les clients doivent privilégier le moteur d’affichage dédié aux approbations.

## Messages multimédias

Lorsqu’une réponse contient plusieurs URL de médias, OpenClaw envoie un événement Matrix par URL de média. Le texte de légende et les métadonnées de présentation sont associés uniquement au premier événement, afin que les clients reçoivent une seule charge utile structurée stable, sans moteurs d’affichage en double. La même règle s’applique lorsqu’un texte long est réparti entre plusieurs événements : les métadonnées sont uniquement associées au premier événement.

Conservez des métadonnées de présentation compactes. Les longs textes visibles par l’utilisateur doivent rester dans `body` et emprunter le mécanisme normal de découpage du texte de Matrix.
