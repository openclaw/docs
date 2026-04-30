---
read_when:
    - Modification du rendu de la sortie de l’assistant dans l’interface de contrôle
    - Débogage des directives `[embed ...]`, `MEDIA:`, de réponse ou de présentation audio
summary: Protocole de shortcodes de sortie enrichie pour les intégrations, les médias, les indications audio et les réponses
title: Protocole de sortie enrichie
x-i18n:
    generated_at: "2026-04-30T07:47:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c52a2f3a37e7a8d1237046edafc3e80c3199c01f890a1ef39662436590ef55d
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

La sortie de l’assistant peut porter un petit ensemble de directives de livraison/rendu :

- `MEDIA:` pour la livraison de pièces jointes
- `[[audio_as_voice]]` pour les indications de présentation audio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` pour les métadonnées de réponse
- `[embed ...]` pour le rendu enrichi de la Control UI

Les pièces jointes `MEDIA:` distantes doivent être des URL publiques `https:`. Le `http:` simple,
les boucles locales, les adresses lien-local, les hôtes privés et les noms d’hôtes internes sont ignorés en tant que directives de pièce jointe ; les récupérateurs de médias côté serveur appliquent toujours leurs propres protections réseau.

La syntaxe d’image Markdown simple reste du texte par défaut. Les canaux qui associent intentionnellement les réponses d’image Markdown à des pièces jointes multimédias s’y inscrivent dans leur adaptateur sortant ; Telegram le fait afin que `![alt](url)` puisse toujours devenir une réponse multimédia.

Ces directives sont distinctes. `MEDIA:` et les balises de réponse/voix restent des métadonnées de livraison ; `[embed ...]` est le chemin de rendu enrichi propre au web.
Les médias de résultats d’outils approuvés utilisent le même analyseur `MEDIA:` / `[[audio_as_voice]]` avant la livraison, de sorte que les sorties textuelles d’outils peuvent toujours marquer une pièce jointe audio comme note vocale.

Lorsque la diffusion en continu par blocs est activée, `MEDIA:` reste une métadonnée à livraison unique pour un tour. Si la même URL de média est envoyée dans un bloc diffusé en continu puis répétée dans la charge utile finale de l’assistant, OpenClaw livre la pièce jointe une seule fois et supprime le doublon de la charge utile finale.

## `[embed ...]`

`[embed ...]` est la seule syntaxe de rendu enrichi exposée à l’agent pour la Control UI.

Exemple autofermant :

```text
[embed ref="cv_123" title="Status" /]
```

Règles :

- `[view ...]` n’est plus valide pour les nouvelles sorties.
- Les codes courts d’intégration s’affichent uniquement dans la surface de message de l’assistant.
- Seules les intégrations adossées à une URL sont rendues. Utilisez `ref="..."` ou `url="..."`.
- Les codes courts d’intégration HTML en ligne sous forme de bloc ne sont pas rendus.
- L’interface utilisateur web supprime le code court du texte visible et rend l’intégration en ligne.
- `MEDIA:` n’est pas un alias d’intégration et ne doit pas être utilisé pour le rendu d’intégration enrichie.

## Forme de rendu stockée

Le bloc de contenu normalisé/stocké de l’assistant est un élément `canvas` structuré :

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

- [adaptateurs RPC](/fr/reference/rpc)
- [Typebox](/fr/concepts/typebox)
