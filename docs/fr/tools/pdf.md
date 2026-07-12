---
read_when:
    - Vous souhaitez analyser des PDF provenant d’agents
    - Vous avez besoin des paramètres et limites exacts de l’outil PDF
    - Vous déboguez le mode PDF natif par rapport au repli sur l’extraction
summary: Analysez un ou plusieurs documents PDF avec la prise en charge native du fournisseur et une solution de repli par extraction
title: Outil PDF
x-i18n:
    generated_at: "2026-07-12T03:25:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyse un ou plusieurs documents PDF et renvoie du texte. Il utilise l’entrée de document native avec les modèles Anthropic et Google, et se rabat sur l’extraction de texte et d’images pour tous les autres fournisseurs.

## Disponibilité

L’outil est enregistré uniquement lorsqu’OpenClaw peut résoudre un modèle prenant en charge les PDF pour l’agent. Ordre de résolution :

1. `agents.defaults.pdfModel` (modèle principal et modèles de secours explicites)
2. `agents.defaults.imageModel` (modèle principal et modèles de secours explicites)
3. Le modèle de session/par défaut résolu de l’agent, si son fournisseur prend en charge l’entrée PDF native (Anthropic, Google) ou dispose déjà d’un modèle de vision configuré
4. Les fournisseurs détectés automatiquement qui prennent en charge les images ou la vision et disposent d’une authentification utilisable, en privilégiant d’abord ceux qui prennent en charge les PDF natifs

L’authentification de chaque modèle de secours candidat est vérifiée avant son utilisation. Ainsi, un `provider/model` configuré n’est pris en compte que si OpenClaw peut authentifier ce fournisseur pour l’agent. Si aucun modèle utilisable ne peut être résolu, l’outil `pdf` n’est pas exposé.

## Référence des entrées

<ParamField path="pdf" type="string">
Chemin ou URL d’un PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Chemins ou URL de plusieurs PDF, jusqu’à 10 au total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Invite d’analyse.
</ParamField>

<ParamField path="pages" type="string">
Filtre de pages tel que `1-5` ou `1,3,7-9`. Non pris en charge en mode fournisseur natif.
</ParamField>

<ParamField path="password" type="string">
Mot de passe des PDF chiffrés. S’applique à chaque PDF de la requête ; utilisé uniquement en mode de secours par extraction.
</ParamField>

<ParamField path="model" type="string">
Remplacement facultatif du modèle au format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Taille maximale par PDF en Mo. Utilise par défaut `agents.defaults.pdfMaxBytesMb`, ou `10` si cette valeur n’est pas définie.
</ParamField>

Remarques :

- `pdf` et `pdfs` sont fusionnés et dédupliqués avant le chargement ; au moins l’un des deux est requis.
- `pages` est analysé comme une liste de numéros de pages commençant à 1, dédupliquée, triée et limitée à `agents.defaults.pdfMaxPages` (`20` par défaut). Une plage ne correspondant à aucune page dans les limites provoque une erreur avant l’appel du modèle.

## Références PDF prises en charge

- Chemin de fichier local (y compris avec développement de `~`)
- URL `file://`
- URL `http://` et `https://`
- Références entrantes gérées par OpenClaw, telles que `media://inbound/<id>`

Les autres schémas d’URI (par exemple `ftp://`) renvoient `details.error = "unsupported_pdf_reference"`. Les URL `http(s)` distantes sont refusées lorsque l’outil s’exécute dans un bac à sable. Lorsque la stratégie de fichiers limités à l’espace de travail est activée, les chemins locaux situés hors des racines autorisées sont refusés ; les références entrantes gérées et les chemins rejoués sous le stockage de médias entrants d’OpenClaw restent autorisés.

## Modes d’exécution

### Mode fournisseur natif

Utilisé pour les fournisseurs `anthropic` et `google` (les seuls fournisseurs déclarant actuellement une prise en charge native des documents PDF). Les octets bruts de chaque PDF sont transmis directement à l’API du fournisseur sous forme de document natif ou de partie PDF intégrée.

Limites :

- `pages` n’est pas pris en charge ; s’il est défini, l’outil lève l’erreur `pages is not supported with native PDF providers`.
- `password` n’est pas pris en charge ; s’il est défini, l’outil lève l’erreur `password is not supported with native PDF providers`. Utilisez un modèle non natif pour les PDF chiffrés.

### Mode de secours par extraction

Utilisé pour tous les autres fournisseurs.

1. Extrait le texte des pages sélectionnées (jusqu’à `agents.defaults.pdfMaxPages`, `20` par défaut) via le plugin `document-extract` intégré, qui utilise le paquet `clawpdf` (PDFium WebAssembly) pour extraire le texte et les images.
2. Si le texte extrait comporte moins de `200` caractères, restitue les mêmes pages sous forme d’images PNG. Le budget de restitution est de `4,000,000` pixels au total, partagé entre toutes les pages nécessitant des images (alloué proportionnellement par page restante, et non individuellement par page). Ainsi, les pages contenant déjà suffisamment de texte ne sont pas restituées.
3. Envoie le texte extrait, les éventuelles images restituées et l’invite au modèle sélectionné.

Détails :

- Les PDF chiffrés sont ouverts avec le paramètre `password` de premier niveau.
- Si le modèle n’accepte pas d’images en entrée et qu’aucun texte ne peut être extrait, l’outil renvoie une erreur.
- Si la restitution des images échoue, OpenClaw les ignore et poursuit avec le texte extrait.
- Si le modèle cible accepte uniquement du texte et que l’extraction a produit des images, OpenClaw ignore les images et envoie uniquement le texte.

## Configuration

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

| Clé                             | Valeur par défaut | Signification                                                                                                                             |
| ------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | non définie       | Modèles PDF principal et de secours explicites ; utilise ensuite `imageModel`, puis le modèle de session.                                |
| `agents.defaults.pdfMaxBytesMb` | `10`              | Taille maximale par PDF en Mo.                                                                                                            |
| `agents.defaults.pdfMaxPages`   | `20`              | Nombre maximal de pages traitées par PDF.                                                                                                 |

Consultez la [référence de configuration](/fr/gateway/config-agents#agent-defaults) pour obtenir tous les détails sur les champs.

## Détails de la sortie

L’outil renvoie le texte dans `content[0].text` et les métadonnées structurées dans `details`.

Champs `details` courants :

- `model` : référence du modèle résolu (`provider/model`)
- `native` : `true` pour le mode fournisseur natif, `false` pour le mode de secours
- `attempts` : tentatives de secours ayant échoué avant la réussite

Champs de chemin :

- Entrée PDF unique : `details.pdf`
- Entrées PDF multiples : `details.pdfs[]` avec des entrées `pdf`
- Métadonnées de réécriture du chemin du bac à sable, le cas échéant : `rewrittenFrom`

## Comportement en cas d’erreur

| Condition                                | Résultat                                                       |
| ---------------------------------------- | -------------------------------------------------------------- |
| Aucune entrée PDF                        | Lève `pdf required: provide a path or URL to a PDF document`   |
| Plus de 10 PDF                           | `details.error = "too_many_pdfs"`                              |
| Schéma de référence non pris en charge   | `details.error = "unsupported_pdf_reference"`                  |
| `pages` avec un fournisseur natif        | Lève `pages is not supported with native PDF providers`        |
| `password` avec un fournisseur natif     | Lève `password is not supported with native PDF providers`     |

## Exemples

PDF unique :

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Plusieurs PDF :

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Modèle de secours avec filtrage des pages :

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF chiffré avec secours par extraction :

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Pages connexes

- [Présentation des outils](/fr/tools) - tous les outils disponibles pour les agents
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration de `pdfMaxBytesMb` et `pdfMaxPages`
