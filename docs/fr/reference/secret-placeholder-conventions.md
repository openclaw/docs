---
read_when:
    - Rédiger une documentation contenant des jetons, des clés API ou des extraits d’identifiants
    - Mise à jour d’exemples susceptibles d’être analysés par des outils de détection de secrets
summary: Conventions d’espaces réservés sûres pour l’analyseur de secrets dans la documentation et les exemples
title: Conventions des espaces réservés secrets
x-i18n:
    generated_at: "2026-06-27T18:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Conventions relatives aux espaces réservés de secrets

Utilisez des espaces réservés lisibles par des humains, mais qui ne ressemblent pas à de vrais secrets.

## Style recommandé

- Préférez des valeurs descriptives comme `example-openai-key-not-real` ou `example-discord-bot-token`.
- Pour les extraits shell, préférez `${OPENAI_API_KEY}` aux chaînes intégrées ressemblant à des jetons.
- Gardez les exemples manifestement fictifs et limités à leur objectif (fournisseur, canal, type d’authentification).

## Évitez ces motifs dans la documentation

- Texte littéral d’en-tête ou de pied de clé privée PEM.
- Préfixes ressemblant à des identifiants actifs, par exemple `sk-...`, `xoxb-...`, `AKIA...`.
- Jetons bearer d’apparence réaliste copiés depuis des journaux d’exécution.

## Exemple

```bash
# Bon
export OPENAI_API_KEY="example-openai-key-not-real"

# Mieux (quand la documentation porte sur le câblage env)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
