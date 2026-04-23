---
x-i18n:
    generated_at: "2026-04-23T06:58:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Guide de la documentation

Ce répertoire gère la rédaction de la documentation, les règles de liens Mintlify et la politique d’i18n de la documentation.

## Règles Mintlify

- La documentation est hébergée sur Mintlify (`https://docs.openclaw.ai`).
- Les liens internes de documentation dans `docs/**/*.md` doivent rester relatifs à la racine, sans suffixe `.md` ni `.mdx` (exemple : `[Configuration](/gateway/configuration)`).
- Les références croisées vers des sections doivent utiliser des ancres sur des chemins relatifs à la racine (exemple : `[Hooks](/gateway/configuration-reference#hooks)`).
- Les titres de documentation doivent éviter les tirets cadratins et les apostrophes, car la génération d’ancres de Mintlify est fragile avec ces caractères.
- Les README et autres documents rendus sur GitHub doivent conserver des URL absolues vers la documentation afin que les liens fonctionnent en dehors de Mintlify.
- Le contenu de la documentation doit rester générique : pas de noms d’appareils personnels, d’hôtes ou de chemins locaux ; utilisez des espaces réservés comme `user@gateway-host`.

## Règles de contenu de la documentation

- Pour la documentation, les textes d’interface et les listes de sélection, classez les services/fournisseurs par ordre alphabétique, sauf si la section décrit explicitement l’ordre d’exécution ou l’ordre d’auto-détection.
- Gardez une dénomination cohérente des plugins intégrés avec les règles de terminologie plugin à l’échelle du dépôt définies dans le `AGENTS.md` racine.

## i18n de la documentation

- Les versions en langue étrangère de la documentation ne sont pas maintenues dans ce dépôt. La sortie de publication générée se trouve dans le dépôt séparé `openclaw/docs` (souvent cloné localement comme `../openclaw-docs`).
- N’ajoutez ni ne modifiez de documentation localisée sous `docs/<locale>/**` ici.
- Considérez la documentation en anglais de ce dépôt, ainsi que les fichiers de glossaire, comme la source de vérité.
- Pipeline : mettez à jour la documentation en anglais ici, mettez à jour `docs/.i18n/glossary.<locale>.json` si nécessaire, puis laissez la synchronisation du dépôt de publication et `scripts/docs-i18n` s’exécuter dans `openclaw/docs`.
- Avant de relancer `scripts/docs-i18n`, ajoutez des entrées au glossaire pour tout nouveau terme technique, titre de page ou libellé de navigation court qui doit rester en anglais ou utiliser une traduction fixe.
- `pnpm docs:check-i18n-glossary` est le garde-fou pour les titres de documentation anglaise modifiés et les libellés internes courts de la documentation.
- La mémoire de traduction se trouve dans les fichiers générés `docs/.i18n/*.tm.jsonl` dans le dépôt de publication.
- Voir `docs/.i18n/README.md`.
