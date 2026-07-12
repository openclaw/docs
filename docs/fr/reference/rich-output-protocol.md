---
read_when:
    - Modification du rendu des réponses de l’assistant dans l’interface de contrôle
    - Débogage de `[embed ...]`, des directives de présentation structurée des médias, des réponses ou de l’audio
summary: Protocole de sortie enrichie pour les médias structurés, les intégrations, les indications audio et les réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-07-12T03:18:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La sortie de l’assistant transmet les directives de livraison et de rendu par l’intermédiaire de quelques canaux dédiés :

- Les champs structurés `mediaUrl` / `mediaUrls` pour la livraison des pièces jointes.
- `[[audio_as_voice]]` pour les indications de présentation audio.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse.
- `[embed ...]` pour le rendu enrichi dans l’interface de contrôle.

Les champs multimédias structurés et les balises `[[...]]` sont des métadonnées de livraison. `[embed ...]` constitue le chemin distinct de rendu enrichi réservé au Web ; ce n’est pas un alias de contenu multimédia.

## Pièces jointes multimédias

Les pièces jointes distantes doivent être des URL publiques en `https:`. Les URL en `http:`, les adresses local loopback ou lien-local, ainsi que les noms d’hôtes privés et internes, sont rejetés comme directives de pièce jointe ; les mécanismes de récupération de médias côté serveur appliquent en plus leurs propres protections réseau.

Les pièces jointes locales acceptent les chemins absolus, les chemins relatifs à l’espace de travail ou les chemins `~/` relatifs au répertoire personnel. Elles restent soumises à la politique de lecture des fichiers de l’agent et aux vérifications du type de média avant leur livraison.

<Warning>
N’émettez pas de commandes textuelles pour les pièces jointes depuis des outils, des plugins, des blocs diffusés en continu, la sortie du navigateur ou des actions de message. Utilisez plutôt les champs multimédias structurés :

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

Le texte hérité de la réponse finale peut encore être normalisé à des fins de compatibilité, mais il ne s’agit pas d’un protocole général pour les plugins ou les outils.
</Warning>

La syntaxe d’image Markdown simple (`![alt](url)`) reste du texte par défaut. Les canaux qui souhaitent traiter les images Markdown comme des réponses multimédias l’activent dans leur adaptateur sortant ; Telegram le fait afin que `![alt](url)` devienne une pièce jointe multimédia.

Lorsque la diffusion par blocs est activée, les médias doivent être transmis dans les champs structurés de la charge utile. Si la même URL de média apparaît dans un bloc diffusé puis de nouveau dans la charge utile finale de l’assistant, OpenClaw ne la livre qu’une seule fois et supprime le doublon de la charge utile finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi destinée aux agents pour l’interface de contrôle. Exemple à fermeture automatique :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les codes courts d’intégration sont uniquement rendus dans la surface des messages de l’assistant.
- Seules les intégrations adossées à une URL sont rendues ; utilisez `ref="..."` ou `url="..."`.
- Les codes courts d’intégration HTML en ligne sous forme de bloc ne sont pas rendus.
- L’interface Web retire le code court du texte visible et affiche l’intégration en ligne.

## Forme de rendu stockée

Le bloc de contenu normalisé et stocké de l’assistant est un élément `canvas` structuré :

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

`present_view` n’est pas reconnu ; les blocs enrichis stockés et rendus utilisent toujours cette forme `canvas`.

## Rubriques connexes

- [Adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
