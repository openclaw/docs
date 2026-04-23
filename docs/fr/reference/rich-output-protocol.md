---
read_when:
    - Modification du rendu de la sortie de l’assistant dans la Control UI
    - Débogage des directives de présentation `[embed ...]`, `MEDIA:`, reply ou audio
summary: Protocole de shortcodes de sortie enrichie pour les intégrations, médias, indices audio et réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-04-23T07:10:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protocole de sortie enrichie

La sortie de l’assistant peut transporter un petit ensemble de directives de livraison/rendu :

- `MEDIA:` pour la livraison des pièces jointes
- `[[audio_as_voice]]` pour les indices de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi de la Control UI

Ces directives sont séparées. `MEDIA:` et les balises de réponse/voix restent des métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi réservé au web.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi orientée agent pour la Control UI.

Exemple autofermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les shortcodes embed ne sont rendus que dans la surface de message de l’assistant.
- Seules les intégrations adossées à une URL sont rendues. Utilisez `ref="..."` ou `url="..."`.
- Les shortcodes embed en HTML inline de forme bloc ne sont pas rendus.
- L’interface web supprime le shortcode du texte visible et rend l’intégration inline.
- `MEDIA:` n’est pas un alias d’embed et ne doit pas être utilisé pour le rendu enrichi d’intégration.

## Forme de rendu stockée

Le bloc de contenu assistant normalisé/stoké est un élément `canvas` structuré :

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Les blocs enrichis stockés/rendus utilisent directement cette forme `canvas`. `present_view` n’est pas reconnu.
