---
read_when:
    - Modification du rendu de sortie de l’assistant dans l’interface de contrôle
    - Débogage des directives de présentation `[embed ...]`, de médias structurés, de réponse ou audio
summary: Protocole de sortie enrichie pour les médias structurés, les intégrations, les indications audio et les réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-06-27T18:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La sortie de l’assistant peut transporter un petit ensemble de directives de livraison/rendu :

- champs structurés `mediaUrl` / `mediaUrls` pour la livraison des pièces jointes
- `[[audio_as_voice]]` pour les indications de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi de Control UI

Les pièces jointes multimédias distantes doivent être des URL publiques `https:`. Les URL `http:` simples,
loopback, link-local, privées et les noms d’hôtes internes sont ignorés comme directives de pièce jointe ;
les récupérateurs de médias côté serveur appliquent toujours leurs propres protections réseau.

Les pièces jointes multimédias locales peuvent utiliser des chemins absolus, des chemins relatifs à l’espace de travail ou
des chemins relatifs au répertoire personnel `~/`. Elles passent toujours par la politique de lecture de fichiers de l’agent et
les vérifications de type de média avant livraison.

<Warning>
N’émettez pas de commandes textuelles pour les pièces jointes depuis des outils, plugins, blocs de streaming,
sorties de navigateur ou actions de message. Utilisez plutôt des champs multimédias structurés.

Charge utile d’outil de message valide :

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Le texte hérité de la réponse finale de l’assistant peut encore être normalisé pour compatibilité, mais
ce n’est pas un protocole général de plugin/outil.
</Warning>

La syntaxe d’image Markdown simple reste du texte par défaut. Les canaux qui mappent intentionnellement
les réponses d’image Markdown vers des pièces jointes multimédias l’activent dans leur adaptateur sortant ;
Telegram le fait afin que `![alt](url)` puisse toujours devenir une réponse multimédia.

Ces directives sont distinctes. Les champs multimédias structurés et les balises de réponse/voix sont des
métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi réservé au web.

Lorsque le streaming par blocs est activé, les médias doivent être transportés dans des champs de charge utile
structurés. Si la même URL de média est envoyée dans un bloc diffusé en streaming et répétée dans la
charge utile finale de l’assistant, OpenClaw livre la pièce jointe une seule fois et supprime le doublon
de la charge utile finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi exposée à l’agent pour Control UI.

Exemple autofermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les codes courts d’intégration sont rendus uniquement dans la surface de message de l’assistant.
- Seules les intégrations adossées à une URL sont rendues. Utilisez `ref="..."` ou `url="..."`.
- Les codes courts d’intégration HTML en ligne sous forme de bloc ne sont pas rendus.
- L’interface utilisateur web supprime le code court du texte visible et rend l’intégration en ligne.
- Le média structuré n’est pas un alias d’intégration et ne doit pas être utilisé pour le rendu d’intégrations enrichies.

## Forme de rendu stockée

Le bloc de contenu normalisé/stocké de l’assistant est un élément `canvas` structuré :

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

## Connexe

- [adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
