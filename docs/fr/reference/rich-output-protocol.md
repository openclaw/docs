---
read_when:
    - Modifier le rendu de la sortie de l’assistant dans l’interface de contrôle
    - Débogage des directives de présentation `[embed ...]`, `MEDIA:`, de réponse ou audio
summary: Protocole de codes courts de sortie enrichie pour les contenus intégrés, les médias, les indications audio et les réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-05-02T22:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e0c365029c26d198090e1f181703e3979394afb0dfa1742f9c088885650de8b
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La sortie de l’assistant peut contenir un petit ensemble de directives de livraison/rendu :

- `MEDIA:` pour la livraison de pièces jointes
- `[[audio_as_voice]]` pour les indications de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi de l’interface Control UI

Les pièces jointes distantes `MEDIA:` doivent être des URL publiques `https:`. Les URL simples `http:`,
loopback, link-local, privées et les noms d’hôte internes sont ignorés comme directives de pièce jointe ; les récupérateurs de médias côté serveur appliquent toujours leurs propres protections réseau.

Les pièces jointes locales `MEDIA:` peuvent utiliser des chemins absolus, des chemins relatifs à l’espace de travail ou des chemins relatifs au répertoire personnel `~/`. Elles passent toujours par la politique de lecture de fichiers de l’agent et les vérifications de type de média avant la livraison.

La syntaxe d’image Markdown simple reste du texte par défaut. Les canaux qui associent intentionnellement les réponses d’images Markdown à des pièces jointes multimédias l’activent dans leur adaptateur sortant ; Telegram le fait afin que `![alt](url)` puisse toujours devenir une réponse multimédia.

Ces directives sont distinctes. `MEDIA:` et les balises de réponse/voix restent des métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi réservé au web.
Les médias de résultats d’outils fiables utilisent le même analyseur `MEDIA:` / `[[audio_as_voice]]` avant la livraison, de sorte que les sorties textuelles d’outils puissent toujours marquer une pièce jointe audio comme note vocale.

Lorsque le streaming par blocs est activé, `MEDIA:` reste une métadonnée de livraison unique pour un tour. Si la même URL de média est envoyée dans un bloc diffusé en streaming puis répétée dans la charge finale de l’assistant, OpenClaw livre la pièce jointe une seule fois et supprime le doublon de la charge finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi exposée à l’agent pour la Control UI.

Exemple auto-fermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les shortcodes d’intégration s’affichent uniquement dans la surface de message de l’assistant.
- Seules les intégrations basées sur des URL sont rendues. Utilisez `ref="..."` ou `url="..."`.
- Les shortcodes d’intégration HTML en ligne sous forme de bloc ne sont pas rendus.
- L’interface web retire le shortcode du texte visible et affiche l’intégration en ligne.
- `MEDIA:` n’est pas un alias d’intégration et ne doit pas être utilisé pour le rendu d’intégrations enrichies.

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

## Associés

- [Adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
