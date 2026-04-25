---
read_when:
    - Modification du rendu de la sortie de l’assistant dans l’interface utilisateur de contrôle
    - Débogage de `[embed ...]`, `MEDIA:`, des directives de réponse ou de présentation audio
summary: Protocole des shortcodes de sortie enrichie pour les intégrations, les médias, les indications audio et les réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-04-25T13:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 643d1594d05174abf984f06c76a675670968c42c7260e7b73821f346e3f683df
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La sortie de l’assistant peut contenir un petit ensemble de directives de livraison/rendu :

- `MEDIA:` pour la livraison de pièces jointes
- `[[audio_as_voice]]` pour les indications de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi dans l’interface utilisateur de contrôle

Ces directives sont distinctes. `MEDIA:` ainsi que les balises de réponse/voix restent des métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi réservé au web.

Lorsque le streaming par blocs est activé, `MEDIA:` reste une métadonnée de livraison unique pour un tour. Si la même URL média est envoyée dans un bloc diffusé en continu puis répétée dans la charge utile finale de l’assistant, OpenClaw livre la pièce jointe une seule fois et supprime le doublon de la charge utile finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi visible par l’agent pour l’interface utilisateur de contrôle.

Exemple auto-fermable :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les shortcodes d’intégration sont rendus uniquement dans la surface de message de l’assistant.
- Seules les intégrations adossées à une URL sont rendues. Utilisez `ref="..."` ou `url="..."`.
- Les shortcodes d’intégration HTML inline au format bloc ne sont pas rendus.
- L’interface web retire le shortcode du texte visible et rend l’intégration inline.
- `MEDIA:` n’est pas un alias d’intégration et ne doit pas être utilisé pour le rendu d’intégration enrichi.

## Forme de rendu stockée

Le bloc de contenu d’assistant normalisé/stocké est un élément `canvas` structuré :

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

## Lié

- [Adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
