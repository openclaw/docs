---
read_when:
    - Publication des âmes
    - Débogage des échecs de publication de soul
summary: Format du paquet Soul, fichiers requis, limites.
x-i18n:
    generated_at: "2026-05-13T04:18:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Format d’âme

## Sur le disque

Une âme est un fichier unique :

- `SOUL.md` (ou `soul.md`)

Pour l’instant, onlycrabs.ai refuse tout fichier supplémentaire.

## `SOUL.md`

- Markdown avec frontmatter YAML facultatif.
- Le serveur extrait les métadonnées du frontmatter lors de la publication.
- `description` est utilisé comme résumé de l’âme dans l’UI/la recherche.

## Limites

- Taille totale du paquet : 50 Mo.
- Le texte d’embedding inclut uniquement `SOUL.md`.

## Identifiants d’URL

- Dérivés du nom du dossier par défaut.
- Doivent être en minuscules et compatibles avec les URL : `^[a-z0-9][a-z0-9-]*$`.

## Versionnement + tags

- Chaque publication crée une nouvelle version (semver).
- Les tags sont des pointeurs sous forme de chaîne vers une version ; `latest` est couramment utilisé.
