---
read_when:
    - Modifier le rendu de la sortie de l’assistant dans l’interface Control UI
    - Débogage des directives de présentation `[embed ...]`, `MEDIA:`, de réponse ou audio
summary: Protocole de shortcodes de sortie enrichie pour les intégrations, les médias, les indications audio et les réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-04-26T11:38:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c62e41073196c2ff4867230af55469786fcfb29414f5cc5b7d38f6b1ffc3718
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

La sortie de l’assistant peut contenir un petit ensemble de directives de livraison/rendu :

- `MEDIA:` pour la livraison de pièces jointes
- `[[audio_as_voice]]` pour les indications de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi dans le Control UI

Les pièces jointes `MEDIA:` distantes doivent être des URL `https:` publiques. Les URL `http:` simples,
de loopback, link-local, de réseau privé et les noms d’hôte internes sont ignorés comme directives
de pièce jointe ; les récupérateurs de médias côté serveur appliquent toujours leurs propres protections réseau.

Ces directives sont distinctes. `MEDIA:` et les balises de réponse/voix restent des métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi réservé au web.
Les médias de résultats d’outils approuvés utilisent le même parseur `MEDIA:` / `[[audio_as_voice]]` avant la livraison, afin que les sorties d’outils textuelles puissent toujours marquer une pièce jointe audio comme note vocale.

Lorsque le streaming par blocs est activé, `MEDIA:` reste une métadonnée de livraison unique pour un
tour. Si la même URL de média est envoyée dans un bloc streamé et répétée dans la charge utile finale de
l’assistant, OpenClaw livre la pièce jointe une seule fois et supprime le doublon
de la charge utile finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi exposée à l’agent pour le Control UI.

Exemple autofermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les shortcodes d’intégration sont rendus uniquement dans la surface de message de l’assistant.
- Seules les intégrations adossées à une URL sont rendues. Utilisez `ref="..."` ou `url="..."`.
- Les shortcodes d’intégration HTML inline en forme bloc ne sont pas rendus.
- L’interface web retire le shortcode du texte visible et rend l’intégration inline.
- `MEDIA:` n’est pas un alias d’intégration et ne doit pas être utilisé pour le rendu d’intégration enrichi.

## Forme de rendu stockée

Le bloc de contenu assistant normalisé/stocké est un élément `canvas` structuré :

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

## Liens associés

- [Adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
