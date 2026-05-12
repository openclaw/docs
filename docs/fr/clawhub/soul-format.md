---
read_when:
    - Publication d’âmes
    - Débogage des échecs de publication de soul
summary: Format du bundle Soul, fichiers requis, limites.
x-i18n:
    generated_at: "2026-05-12T12:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# Format d’âme

## Sur disque

Une âme est un fichier unique :

- `SOUL.md` (ou `soul.md`)

Pour l’instant, onlycrabs.ai rejette tout fichier supplémentaire.

## `SOUL.md`

- Markdown avec un en-tête YAML facultatif.
- Le serveur extrait les métadonnées de l’en-tête lors de la publication.
- `description` est utilisée comme résumé de l’âme dans l’interface utilisateur/la recherche.

## Limites

- Taille totale du paquet : 50 Mo.
- Le texte d’embedding inclut uniquement `SOUL.md`.

## Slugs

- Dérivés par défaut du nom du dossier.
- Doivent être en minuscules et compatibles avec les URL : `^[a-z0-9][a-z0-9-]*$`.

## Gestion des versions + tags

- Chaque publication crée une nouvelle version (semver).
- Les tags sont des pointeurs textuels vers une version ; `latest` est couramment utilisé.
