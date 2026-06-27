---
read_when:
    - Vous souhaitez analyser des PDF provenant d’agents
    - Vous avez besoin des paramètres et limites exacts de l’outil PDF
    - Vous déboguez le mode PDF natif par rapport au repli d’extraction
summary: Analyser un ou plusieurs documents PDF avec la prise en charge native du fournisseur et une solution de repli par extraction
title: Outil PDF
x-i18n:
    generated_at: "2026-06-27T18:19:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyse un ou plusieurs documents PDF et renvoie du texte.

Comportement rapide :

- Mode fournisseur natif pour les fournisseurs de modèles Anthropic et Google.
- Mode de repli par extraction pour les autres fournisseurs (extraire d’abord le texte, puis les images de pages si nécessaire).
- Prend en charge une entrée unique (`pdf`) ou multiple (`pdfs`), avec un maximum de 10 PDF par appel.

## Disponibilité

L’outil n’est enregistré que lorsqu’OpenClaw peut résoudre une configuration de modèle compatible PDF pour l’agent :

1. `agents.defaults.pdfModel`
2. repli vers `agents.defaults.imageModel`
3. repli vers le modèle de session/par défaut résolu de l’agent
4. si les fournisseurs PDF natifs reposent sur l’authentification, les préférer aux candidats génériques de repli image

Si aucun modèle utilisable ne peut être résolu, l’outil `pdf` n’est pas exposé.

Notes de disponibilité :

- La chaîne de repli tient compte de l’authentification. Un `provider/model` configuré ne compte que si
  OpenClaw peut réellement authentifier ce fournisseur pour l’agent.
- Les fournisseurs PDF natifs sont actuellement **Anthropic** et **Google**.
- Si le fournisseur de session/par défaut résolu dispose déjà d’un modèle vision/PDF
  configuré, l’outil PDF le réutilise avant de se rabattre sur d’autres
  fournisseurs authentifiés.

## Référence d’entrée

<ParamField path="pdf" type="string">
Un chemin ou une URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Plusieurs chemins ou URL de PDF, jusqu’à 10 au total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Prompt d’analyse.
</ParamField>

<ParamField path="pages" type="string">
Filtre de pages comme `1-5` ou `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
Mot de passe pour les PDF chiffrés en mode de repli par extraction.
</ParamField>

<ParamField path="model" type="string">
Remplacement facultatif du modèle au format `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite de taille par PDF en Mo. Valeur par défaut : `agents.defaults.pdfMaxBytesMb` ou `10`.
</ParamField>

Notes d’entrée :

- `pdf` et `pdfs` sont fusionnés et dédupliqués avant le chargement.
- Si aucune entrée PDF n’est fournie, l’outil renvoie une erreur.
- `pages` est analysé comme des numéros de page commençant à 1, dédupliqués, triés et limités au nombre maximal de pages configuré.
- `password` s’applique à chaque PDF de la requête et n’est utilisé que par le mode de repli par extraction.
- `maxBytesMb` vaut par défaut `agents.defaults.pdfMaxBytesMb` ou `10`.

## Références PDF prises en charge

- chemin de fichier local (avec expansion de `~`)
- URL `file://`
- URL `http://` et `https://`
- références entrantes gérées par OpenClaw, comme `media://inbound/<id>`

Notes sur les références :

- Les autres schémas d’URI (par exemple `ftp://`) sont rejetés avec `unsupported_pdf_reference`.
- En mode bac à sable, les URL distantes `http(s)` sont rejetées.
- Lorsque la politique de fichiers limitée à l’espace de travail est activée, les chemins de fichiers locaux hors des racines autorisées sont rejetés.
- Les références entrantes gérées et les chemins rejoués sous le magasin de médias entrants d’OpenClaw sont autorisés avec la politique de fichiers limitée à l’espace de travail.

## Modes d’exécution

### Mode fournisseur natif

Le mode natif est utilisé pour les fournisseurs `anthropic` et `google`.
L’outil envoie les octets PDF bruts directement aux API des fournisseurs.

Limites du mode natif :

- `pages` n’est pas pris en charge. S’il est défini, l’outil renvoie une erreur.
- `password` n’est pas pris en charge. Utilisez un modèle non natif pour analyser les PDF chiffrés.
- L’entrée multi-PDF est prise en charge ; chaque PDF est envoyé comme bloc de document natif /
  partie PDF intégrée avant le prompt.

### Mode de repli par extraction

Le mode de repli est utilisé pour les fournisseurs non natifs.

Flux :

1. Extraire le texte des pages sélectionnées (jusqu’à `agents.defaults.pdfMaxPages`, valeur par défaut `20`).
2. Si la longueur du texte extrait est inférieure à `200` caractères, convertir les pages sélectionnées en images PNG et les inclure.
3. Envoyer le contenu extrait avec le prompt au modèle sélectionné.

Détails du repli :

- L’extraction d’images de pages utilise un budget de pixels de `4,000,000`.
- Les PDF chiffrés peuvent être ouverts avec le paramètre de premier niveau `password`.
- Si le modèle cible ne prend pas en charge l’entrée image et qu’il n’y a aucun texte extractible, l’outil renvoie une erreur.
- Si l’extraction de texte réussit mais que l’extraction d’images nécessiterait la vision sur un
  modèle texte uniquement, OpenClaw ignore les images rendues et continue avec le
  texte extrait.
- Le repli par extraction utilise le Plugin `document-extract` intégré. Le Plugin possède
  `clawpdf`, qui fournit l’extraction de texte et le rendu d’images via PDFium
  WebAssembly.

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

Voir la [référence de configuration](/fr/gateway/configuration-reference) pour le détail complet des champs.

## Détails de sortie

L’outil renvoie le texte dans `content[0].text` et les métadonnées structurées dans `details`.

Champs `details` courants :

- `model` : référence de modèle résolue (`provider/model`)
- `native` : `true` pour le mode fournisseur natif, `false` pour le repli
- `attempts` : tentatives de repli ayant échoué avant la réussite

Champs de chemin :

- entrée PDF unique : `details.pdf`
- entrées PDF multiples : `details.pdfs[]` avec des entrées `pdf`
- métadonnées de réécriture du chemin en bac à sable (le cas échéant) : `rewrittenFrom`

## Comportement en cas d’erreur

- Entrée PDF manquante : lève `pdf required: provide a path or URL to a PDF document`
- Trop de PDF : renvoie une erreur structurée dans `details.error = "too_many_pdfs"`
- Schéma de référence non pris en charge : renvoie `details.error = "unsupported_pdf_reference"`
- Mode natif avec `pages` : lève une erreur claire `pages is not supported with native PDF providers`

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

Modèle de repli avec filtre de pages :

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF chiffré avec repli par extraction :

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## Connexe

- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration pdfMaxBytesMb et pdfMaxPages
