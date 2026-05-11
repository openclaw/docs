---
read_when:
    - Publication des âmes
    - Débogage des échecs de publication de soul
summary: Format du bundle Soul, fichiers requis, limites.
x-i18n:
    generated_at: "2026-05-11T22:20:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Format Soul

## Sur disque

Une soul est un fichier unique :

- `SOUL.md` (ou `soul.md`)

Pour l’instant, onlycrabs.ai rejette tout fichier supplémentaire.

## `SOUL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` est utilisé comme résumé de la soul dans l’UI/la recherche.

## Limites

- Taille totale du bundle : 50 Mo.
- Le texte d’embedding inclut uniquement `SOUL.md`.

## Slugs

- Dérivés par défaut du nom du dossier.
- Doivent être en minuscules et compatibles avec les URL : `^[a-z0-9][a-z0-9-]*$`.

## Versionnement + balises

- Chaque publication crée une nouvelle version (semver).
- Les balises sont des pointeurs sous forme de chaîne vers une version ; `latest` est couramment utilisé.
