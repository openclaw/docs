---
read_when:
    - Rédaction de documentation contenant des jetons, des clés d’API ou des extraits d’identifiants d’authentification
    - Mise à jour des exemples susceptibles d’être analysés par des outils de détection de secrets
summary: Conventions d’espaces réservés sûrs pour les analyseurs de secrets dans la documentation et les exemples
title: Conventions relatives aux espaces réservés de secrets
x-i18n:
    generated_at: "2026-07-12T03:06:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Conventions relatives aux espaces réservés pour les secrets

Utilisez des espaces réservés lisibles par l’utilisateur, mais qui ne ressemblent pas à de véritables secrets.

## Style recommandé

- Privilégiez des valeurs descriptives comme `example-openai-key-not-real` ou `example-discord-bot-token`.
- Pour les extraits de commandes shell, préférez `${OPENAI_API_KEY}` aux chaînes intégrées ressemblant à des jetons.
- Veillez à ce que les exemples soient manifestement fictifs et adaptés à leur objectif (fournisseur, canal, type d’authentification).

## Motifs à éviter dans la documentation

- Texte littéral d’en-tête ou de pied de page d’une clé privée PEM.
- Préfixes ressemblant à des identifiants réels, par exemple `sk-...`, `xoxb-...`, `AKIA...`.
- Jetons porteurs d’apparence réaliste copiés depuis les journaux d’exécution.

## Exemple

```bash
# Bon
export OPENAI_API_KEY="example-openai-key-not-real"

# Mieux (lorsque la documentation porte sur la configuration des variables d’environnement)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
