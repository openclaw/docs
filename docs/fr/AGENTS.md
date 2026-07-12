---
x-i18n:
    generated_at: "2026-07-12T14:59:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Guide de la documentation

Ce répertoire régit la rédaction de la documentation, les règles de liens Mintlify et la politique d’internationalisation de la documentation.

## Règles Mintlify

- La documentation est hébergée sur Mintlify (`https://docs.openclaw.ai`).
- Les liens internes de la documentation dans `docs/**/*.md` doivent rester relatifs à la racine, sans suffixe `.md` ni `.mdx` (exemple : `[Config](/gateway/configuration)`).
- Les références croisées vers des sections doivent utiliser des ancres sur des chemins relatifs à la racine (exemple : `[Hooks](/gateway/configuration-reference#hooks)`).
- Les titres de la documentation doivent éviter les tirets cadratins et les apostrophes, car leur gestion par la génération d’ancres de Mintlify est fragile.
- Le README et les autres documents rendus par GitHub doivent conserver des URL absolues vers la documentation afin que les liens fonctionnent en dehors de Mintlify.
- Le contenu de la documentation doit rester générique : aucun nom d’appareil personnel, nom d’hôte ou chemin local ; utilisez des espaces réservés comme `user@gateway-host`.

## Règles relatives au contenu de la documentation

- Dans la documentation, les textes de l’interface utilisateur et les listes de sélection, classez les services/fournisseurs par ordre alphabétique, sauf si la section décrit explicitement l’ordre d’exécution ou l’ordre de détection automatique.
- Veillez à ce que la dénomination des plugins intégrés respecte les règles terminologiques relatives aux plugins appliquées à l’ensemble du dépôt dans le fichier `AGENTS.md` racine.
- Documentation générée, ne jamais la modifier manuellement : `docs/plugins/reference/**`, `docs/plugins/reference.md` et `docs/plugins/plugin-inventory.md` sont générés par `pnpm plugins:inventory:gen` ; `docs/docs_map.md` par `pnpm docs:map:gen` ; `docs/maturity/**` par `pnpm maturity:render`.

## Documentation interne

- La documentation privée de longue durée destinée aux opérateurs doit être placée dans `~/Projects/manager/docs/`.
- Les brouillons et miroirs internes propres au dépôt peuvent être placés sous le répertoire ignoré `docs/internal/`.
- N’ajoutez jamais de pages `docs/internal/**` à la navigation de `docs/docs.json` et ne créez jamais de liens vers celles-ci depuis la documentation publique.
- `scripts/docs-sync-publish.mjs` exclut et supprime `docs/internal/**` du dépôt de publication public `openclaw/docs` si une page est ultérieurement ajoutée de force.
- La documentation interne peut mentionner des chemins du dépôt, des noms d’applications privées, des noms d’éléments 1Password et des procédures opérationnelles, mais ne doit jamais inclure de valeurs secrètes.

## Modification de la grille d’évaluation de la maturité

`taxonomy.yaml` et `qa/maturity-scores.yaml` sont les entrées sources ; les documents de maturité générés sous `docs/maturity/` sont des projections et ne doivent pas être modifiés manuellement pour les scores, le LTS, la taxonomie, le profil d’assurance qualité ou les tableaux de preuves.
`scripts/qa/render-maturity-docs.ts` assure la génération ; utilisez `pnpm maturity:render` pour actualiser les documents suivis et `pnpm maturity:check` pour les vérifier.
`.github/workflows/maturity-scorecard.yml` génère des aperçus d’artefacts et peut ouvrir des PR de documents générés ; `.github/workflows/openclaw-release-checks.yml` le déclenche pour l’assurance qualité des versions.
Conservez les données déterministes `qa-evidence.json.scorecard` dans les artefacts GitHub Actions, sauf si un responsable demande explicitement une projection assainie et suivie dans le dépôt.
Les modifications manuelles doivent changer l’état source dans une PR et expliquer la raison, accompagnée de preuves publiques ou expurgées.

## Internationalisation de la documentation

- La documentation en langues étrangères n’est pas maintenue dans ce dépôt. La sortie de publication générée se trouve dans le dépôt distinct `openclaw/docs` (souvent cloné localement sous `../openclaw-docs`).
- N’ajoutez ni ne modifiez de documentation localisée sous `docs/<locale>/**` ici.
- Considérez la documentation anglaise de ce dépôt ainsi que les fichiers de glossaire comme la source de référence.
- Pipeline : mettez à jour la documentation anglaise ici, mettez à jour `docs/.i18n/glossary.<locale>.json` si nécessaire, puis laissez la synchronisation du dépôt de publication et `scripts/docs-i18n` s’exécuter dans `openclaw/docs`.
- Avant de réexécuter `scripts/docs-i18n`, ajoutez des entrées au glossaire pour tout nouveau terme technique, titre de page ou libellé de navigation court qui doit rester en anglais ou utiliser une traduction fixe.
- `pnpm docs:check-i18n-glossary` est le contrôle des titres modifiés de la documentation anglaise et des libellés internes courts de la documentation.
- La mémoire de traduction se trouve dans les fichiers générés `docs/.i18n/*.tm.jsonl` du dépôt de publication.
- Consultez `docs/.i18n/README.md`.
