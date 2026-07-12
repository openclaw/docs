---
read_when:
    - Rédaction de documentation comprenant des jetons, des clés API ou des extraits d’identifiants d’accès
    - Mise à jour des exemples susceptibles d’être analysés par des outils de détection des secrets
summary: Conventions d’espaces réservés sûres pour les analyseurs de secrets dans la documentation et les exemples
title: Conventions relatives aux espaces réservés pour les secrets
x-i18n:
    generated_at: "2026-07-12T15:48:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Conventions relatives aux espaces réservés pour les secrets

Utilisez des espaces réservés lisibles par les humains, mais qui ne ressemblent pas à de véritables secrets.

## Style recommandé

- Privilégiez des valeurs descriptives comme `example-openai-key-not-real` ou `example-discord-bot-token`.
- Pour les extraits de shell, préférez `${OPENAI_API_KEY}` aux chaînes intégrées ressemblant à des jetons.
- Veillez à ce que les exemples soient manifestement fictifs et adaptés à leur usage (fournisseur, canal, type d’authentification).

## Motifs à éviter dans la documentation

- Texte littéral d’en-tête ou de pied de page d’une clé privée PEM.
- Préfixes ressemblant à des identifiants actifs, par exemple `sk-...`, `xoxb-...`, `AKIA...`.
- Jetons de porteur d’apparence réaliste copiés depuis les journaux d’exécution.

## Exemple

```bash
# Bon
export OPENAI_API_KEY="example-openai-key-not-real"

# Mieux (lorsque la documentation porte sur la configuration des variables d’environnement)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
