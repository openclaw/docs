---
x-i18n:
    generated_at: "2026-05-10T19:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# Guide de la documentation

Ce répertoire couvre la rédaction de la documentation, les règles de liens Mintlify et la politique d’i18n de la documentation.

## Règles Mintlify

- La documentation est hébergée sur Mintlify (`https://docs.openclaw.ai`).
- Les liens internes de documentation dans `docs/**/*.md` doivent rester relatifs à la racine, sans suffixe `.md` ni `.mdx` (exemple : `[Configuration](/gateway/configuration)`).
- Les références croisées de sections doivent utiliser des ancres sur des chemins relatifs à la racine (exemple : `[Hooks](/gateway/configuration-reference#hooks)`).
- Les titres de documentation doivent éviter les tirets cadratins et les apostrophes, car la génération d’ancres Mintlify est fragile dans ces cas.
- Le README et les autres documents rendus par GitHub doivent conserver des URL absolues vers la documentation afin que les liens fonctionnent en dehors de Mintlify.
- Le contenu de la documentation doit rester générique : pas de noms d’appareils personnels, de noms d’hôte ni de chemins locaux ; utilisez des espaces réservés comme `user@gateway-host`.

## Règles de contenu de la documentation

- Pour la documentation, les libellés d’interface utilisateur et les listes de sélection, classez les services/fournisseurs par ordre alphabétique, sauf si la section décrit explicitement l’ordre d’exécution ou l’ordre de détection automatique.
- Gardez la dénomination des plugins intégrés cohérente avec les règles terminologiques relatives aux plugins à l’échelle du dépôt dans le fichier racine `AGENTS.md`.

## Documentation interne

- La documentation privée durable destinée aux opérateurs doit se trouver dans `~/Projects/manager/docs/`.
- Les brouillons ou miroirs internes locaux au dépôt peuvent se trouver sous `docs/internal/`, qui est ignoré.
- N’ajoutez jamais de pages `docs/internal/**` à la navigation `docs/docs.json` et ne créez jamais de lien vers ces pages depuis la documentation publique.
- `scripts/docs-sync-publish.mjs` exclut et supprime `docs/internal/**` du dépôt public de publication `openclaw/docs` si une page est ajoutée de force plus tard.
- La documentation interne peut mentionner des chemins du dépôt, des noms d’applications privées, des noms d’éléments 1Password et des runbooks, mais ne doit jamais inclure de valeurs secrètes.

## i18n de la documentation

- La documentation en langues étrangères n’est pas maintenue dans ce dépôt. La sortie de publication générée se trouve dans le dépôt séparé `openclaw/docs` (souvent cloné localement sous `../openclaw-docs`).
- N’ajoutez ni ne modifiez ici de documentation localisée sous `docs/<locale>/**`.
- Considérez la documentation anglaise de ce dépôt ainsi que les fichiers de glossaire comme la source de vérité.
- Pipeline : mettez à jour ici la documentation anglaise, mettez à jour `docs/.i18n/glossary.<locale>.json` si nécessaire, puis laissez la synchronisation du dépôt de publication et `scripts/docs-i18n` s’exécuter dans `openclaw/docs`.
- Avant de relancer `scripts/docs-i18n`, ajoutez des entrées de glossaire pour tout nouveau terme technique, titre de page ou court libellé de navigation qui doit rester en anglais ou utiliser une traduction fixe.
- `pnpm docs:check-i18n-glossary` est la garde pour les titres de documentation anglaise modifiés et les courts libellés internes de documentation.
- La mémoire de traduction se trouve dans les fichiers générés `docs/.i18n/*.tm.jsonl` dans le dépôt de publication.
- Voir `docs/.i18n/README.md`.
