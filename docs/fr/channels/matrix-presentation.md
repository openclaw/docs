---
read_when:
    - Créer des clients Matrix qui affichent les réponses enrichies d’OpenClaw
    - Débogage du contenu de l’événement com.openclaw.presentation
summary: Métadonnées MessagePresentation Matrix pour les clients compatibles avec OpenClaw
title: Métadonnées de présentation de Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw peut joindre des métadonnées `MessagePresentation` normalisées aux événements Matrix `m.room.message` sortants sous `com.openclaw.presentation`.

Les clients Matrix standard continuent d’afficher le texte brut `body`. Les clients compatibles avec OpenClaw peuvent lire les métadonnées structurées et afficher une interface utilisateur native comme des boutons, des sélecteurs, des lignes de contexte et des séparateurs.

## Contenu de l’événement

Les métadonnées sont stockées dans le contenu de l’événement Matrix :

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` est la version du schéma des métadonnées de présentation Matrix. `type` est un discriminateur stable pour les clients compatibles avec OpenClaw. Les clients doivent ignorer les valeurs `type` inconnues, les versions inconnues qu’ils ne peuvent pas interpréter de façon sûre, ainsi que les types de blocs inconnus.

## Comportement de repli

OpenClaw affiche toujours un texte brut de repli lisible dans `body`. Les métadonnées structurées sont additives et ne doivent pas être requises pour l’interopérabilité Matrix de base.

Les clients non pris en charge doivent continuer à afficher le texte de repli. Les clients compatibles avec OpenClaw peuvent privilégier les métadonnées structurées pour l’affichage, tout en conservant le texte de repli pour la copie, la recherche, les notifications et l’accessibilité.

## Blocs pris en charge

L’adaptateur sortant Matrix annonce la prise en charge de :

- `buttons`
- `select`
- `context`
- `divider`

Les clients doivent traiter ces blocs comme des indications de présentation fournies au mieux. Les champs inconnus et les types de blocs inconnus doivent être ignorés plutôt que de provoquer l’échec de l’affichage du message entier.

## Interactions

Ces métadonnées n’ajoutent pas de sémantique de rappel Matrix. Les valeurs des boutons et des options de sélection sont des charges utiles d’interaction de repli, généralement des commandes slash ou des commandes textuelles. Un client Matrix qui veut prendre en charge l’interaction peut renvoyer la valeur sélectionnée dans le salon sous forme de message normal.

Par exemple, un bouton dont la valeur est `/model deepseek/deepseek-chat` peut être géré en envoyant cette valeur comme message texte Matrix chiffré dans le même salon.

## Relation avec les métadonnées d’approbation

`com.openclaw.presentation` sert à la présentation générale de messages enrichis.

Les invites d’approbation utilisent les métadonnées dédiées `com.openclaw.approval`, car les approbations transportent un état sensible pour la sécurité, des décisions, ainsi que des détails d’exécution et de plugin. Si les deux clés de métadonnées sont présentes sur le même événement, les clients doivent privilégier le moteur d’affichage dédié aux approbations.

## Messages multimédias

Lorsqu’une réponse contient plusieurs URL de médias, OpenClaw envoie un événement Matrix par URL de média. Les métadonnées de présentation ne sont jointes qu’au premier événement multimédia, afin que les clients disposent d’une charge utile structurée stable unique et d’éviter les moteurs d’affichage en double.

Gardez les métadonnées de présentation compactes. Les grands textes visibles par l’utilisateur doivent rester dans `body` et utiliser le chemin normal de découpage du texte Matrix.
