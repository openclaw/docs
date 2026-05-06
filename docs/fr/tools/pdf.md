---
read_when:
    - Vous souhaitez analyser des PDF depuis des agents
    - Il vous faut les paramètres et les limites exacts de l’outil PDF
    - Vous déboguez le mode PDF natif par rapport à la solution de repli d’extraction
summary: Analyser un ou plusieurs documents PDF avec prise en charge native par le fournisseur et solution de repli pour l’extraction
title: Outil PDF
x-i18n:
    generated_at: "2026-05-06T07:42:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` analyse un ou plusieurs documents PDF et renvoie du texte.

Comportement rapide :

- Mode fournisseur natif pour les fournisseurs de modèles Anthropic et Google.
- Mode de repli par extraction pour les autres fournisseurs (extraire d’abord le texte, puis les images des pages si nécessaire).
- Prend en charge une entrée unique (`pdf`) ou multiple (`pdfs`), avec un maximum de 10 PDF par appel.

## Disponibilité

L’outil n’est enregistré que lorsque OpenClaw peut résoudre une configuration de modèle compatible PDF pour l’agent :

1. `agents.defaults.pdfModel`
2. repli vers `agents.defaults.imageModel`
3. repli vers le modèle de session/par défaut résolu de l’agent
4. si les fournisseurs PDF natifs sont appuyés par l’authentification, les préférer aux candidats de repli d’image génériques

Si aucun modèle utilisable ne peut être résolu, l’outil `pdf` n’est pas exposé.

Notes de disponibilité :

- La chaîne de repli tient compte de l’authentification. Un `provider/model` configuré ne compte que si
  OpenClaw peut réellement authentifier ce fournisseur pour l’agent.
- Les fournisseurs PDF natifs sont actuellement **Anthropic** et **Google**.
- Si le fournisseur de session/par défaut résolu dispose déjà d’un modèle vision/PDF
  configuré, l’outil PDF le réutilise avant de se rabattre sur d’autres
  fournisseurs appuyés par l’authentification.

## Référence des entrées

<ParamField path="pdf" type="string">
Un chemin ou une URL de PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
Plusieurs chemins ou URL de PDF, jusqu’à 10 au total.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Invite d’analyse.
</ParamField>

<ParamField path="pages" type="string">
Filtre de pages comme `1-5` ou `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
Remplacement facultatif du modèle sous la forme `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
Limite de taille par PDF en Mo. Par défaut, `agents.defaults.pdfMaxBytesMb` ou `10`.
</ParamField>

Notes d’entrée :

- `pdf` et `pdfs` sont fusionnés et dédupliqués avant le chargement.
- Si aucune entrée PDF n’est fournie, l’outil renvoie une erreur.
- `pages` est analysé comme des numéros de page en base 1, dédupliqués, triés et bornés au nombre maximal de pages configuré.
- `maxBytesMb` vaut par défaut `agents.defaults.pdfMaxBytesMb` ou `10`.

## Références PDF prises en charge

- chemin de fichier local (avec extension de `~`)
- URL `file://`
- URL `http://` et `https://`
- références entrantes gérées par OpenClaw comme `media://inbound/<id>`

Notes sur les références :

- Les autres schémas d’URI (par exemple `ftp://`) sont rejetés avec `unsupported_pdf_reference`.
- En mode sandbox, les URL `http(s)` distantes sont rejetées.
- Lorsque la politique de fichiers limitée à l’espace de travail est activée, les chemins de fichiers locaux hors des racines autorisées sont rejetés.
- Les références entrantes gérées et les chemins rejoués sous le magasin de médias entrants d’OpenClaw sont autorisés avec la politique de fichiers limitée à l’espace de travail.

## Modes d’exécution

### Mode fournisseur natif

Le mode natif est utilisé pour les fournisseurs `anthropic` et `google`.
L’outil envoie les octets PDF bruts directement aux API des fournisseurs.

Limites du mode natif :

- `pages` n’est pas pris en charge. S’il est défini, l’outil renvoie une erreur.
- L’entrée multi-PDF est prise en charge ; chaque PDF est envoyé comme bloc de document natif /
  partie PDF intégrée avant l’invite.

### Mode de repli par extraction

Le mode de repli est utilisé pour les fournisseurs non natifs.

Flux :

1. Extraire le texte des pages sélectionnées (jusqu’à `agents.defaults.pdfMaxPages`, `20` par défaut).
2. Si la longueur du texte extrait est inférieure à `200` caractères, convertir les pages sélectionnées en images PNG et les inclure.
3. Envoyer le contenu extrait avec l’invite au modèle sélectionné.

Détails du repli :

- L’extraction d’images de page utilise un budget de pixels de `4,000,000`.
- Si le modèle cible ne prend pas en charge l’entrée image et qu’il n’existe aucun texte extractible, l’outil renvoie une erreur.
- Si l’extraction de texte réussit mais que l’extraction d’images nécessiterait la vision sur un
  modèle texte uniquement, OpenClaw supprime les images rendues et continue avec le
  texte extrait.
- Le repli par extraction utilise le Plugin `document-extract` fourni. Le Plugin possède
  `pdfjs-dist` ; `@napi-rs/canvas` n’est utilisé que lorsque le repli de rendu d’images est
  disponible.

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

Consultez la [Référence de configuration](/fr/gateway/configuration-reference) pour les détails complets des champs.

## Détails de sortie

L’outil renvoie du texte dans `content[0].text` et des métadonnées structurées dans `details`.

Champs `details` courants :

- `model` : référence de modèle résolue (`provider/model`)
- `native` : `true` pour le mode fournisseur natif, `false` pour le repli
- `attempts` : tentatives de repli ayant échoué avant la réussite

Champs de chemin :

- entrée PDF unique : `details.pdf`
- plusieurs entrées PDF : `details.pdfs[]` avec des entrées `pdf`
- métadonnées de réécriture de chemin sandbox (le cas échéant) : `rewrittenFrom`

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

Modèle de repli filtré par pages :

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## Connexe

- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration pdfMaxBytesMb et pdfMaxPages
