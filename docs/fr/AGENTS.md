---
x-i18n:
    generated_at: "2026-06-27T17:08:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# Guide de la documentation

Ce répertoire définit la rédaction de la documentation, les règles de liens Mintlify et la politique i18n de la documentation.

## Règles Mintlify

- La documentation est hébergée sur Mintlify (`https://docs.openclaw.ai`).
- Les liens internes de documentation dans `docs/**/*.md` doivent rester relatifs à la racine, sans suffixe `.md` ni `.mdx` (exemple : `[Config](/gateway/configuration)`).
- Les références croisées de sections doivent utiliser des ancres sur des chemins relatifs à la racine (exemple : `[Hooks](/gateway/configuration-reference#hooks)`).
- Les titres de documentation doivent éviter les tirets cadratins et les apostrophes, car la génération d’ancres Mintlify est fragile avec ces caractères.
- Le README et les autres documents rendus par GitHub doivent conserver les URL absolues de la documentation afin que les liens fonctionnent hors de Mintlify.
- Le contenu de la documentation doit rester générique : aucun nom d’appareil personnel, nom d’hôte ni chemin local ; utilisez des espaces réservés comme `user@gateway-host`.

## Règles de contenu de la documentation

- Pour la documentation, les textes d’interface utilisateur et les listes de sélection, classez les services/fournisseurs par ordre alphabétique, sauf si la section décrit explicitement l’ordre d’exécution ou l’ordre de détection automatique.
- Gardez la nomenclature des Plugins intégrés cohérente avec les règles de terminologie Plugin applicables à tout le dépôt dans le fichier racine `AGENTS.md`.

## Documentation interne

- La documentation privée durable des opérateurs doit se trouver dans `~/Projects/manager/docs/`.
- Les brouillons internes locaux au dépôt et les documents miroirs peuvent se trouver sous `docs/internal/` ignoré.
- N’ajoutez jamais de pages `docs/internal/**` à la navigation `docs/docs.json` et ne créez jamais de liens vers elles depuis la documentation publique.
- `scripts/docs-sync-publish.mjs` exclut et supprime `docs/internal/**` du dépôt public de publication `openclaw/docs` si une page y est ajoutée de force plus tard.
- La documentation interne peut mentionner des chemins de dépôt, des noms d’applications privées, des noms d’éléments 1Password et des procédures d’exploitation, mais ne doit jamais inclure de valeurs secrètes.

## Modification de la fiche de maturité

`taxonomy.yaml` et `qa/maturity-scores.yaml` sont les entrées sources ; la documentation de maturité générée sous `docs/maturity/` est une projection et ne doit pas être modifiée manuellement pour les scores, LTS, la taxonomie, le profil QA ou les tableaux de preuves.
`scripts/qa/render-maturity-docs.ts` gère la génération ; utilisez `pnpm maturity:render` pour actualiser la documentation validée et `pnpm maturity:check` pour la vérifier.
`.github/workflows/maturity-scorecard.yml` génère des aperçus d’artefacts et peut ouvrir des PR de documentation générée ; `.github/workflows/openclaw-release-checks.yml` le déclenche pour la QA de publication.
Conservez les données déterministes `qa-evidence.json.scorecard` dans les artefacts GitHub Actions, sauf si un responsable de maintenance demande explicitement une projection nettoyée et validée dans le dépôt.
Les remplacements humains doivent modifier l’état source dans une PR et expliquer la raison, ainsi que les preuves publiques ou expurgées.

## i18n de la documentation

- La documentation en langues étrangères n’est pas maintenue dans ce dépôt. La sortie de publication générée se trouve dans le dépôt séparé `openclaw/docs` (souvent cloné localement sous `../openclaw-docs`).
- N’ajoutez ni ne modifiez de documentation localisée sous `docs/<locale>/**` ici.
- Traitez la documentation anglaise de ce dépôt ainsi que les fichiers de glossaire comme la source de vérité.
- Pipeline : mettez à jour la documentation anglaise ici, mettez à jour `docs/.i18n/glossary.<locale>.json` si nécessaire, puis laissez la synchronisation du dépôt de publication et `scripts/docs-i18n` s’exécuter dans `openclaw/docs`.
- Avant de relancer `scripts/docs-i18n`, ajoutez des entrées de glossaire pour tout nouveau terme technique, titre de page ou libellé de navigation court qui doit rester en anglais ou utiliser une traduction fixe.
- `pnpm docs:check-i18n-glossary` est le garde-fou pour les titres de documentation anglaise modifiés et les libellés courts de documentation interne.
- La mémoire de traduction se trouve dans les fichiers générés `docs/.i18n/*.tm.jsonl` du dépôt de publication.
- Consultez `docs/.i18n/README.md`.
