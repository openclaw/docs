---
read_when:
    - Vous souhaitez ouvrir l’interface de contrôle avec votre jeton actuel
    - Vous voulez afficher l’URL sans lancer de navigateur
summary: Référence CLI pour `openclaw dashboard` (ouvrir l’interface utilisateur de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-05-05T01:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

Ouvrez l’interface utilisateur de contrôle avec votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notes :

- `dashboard` résout les SecretRefs `gateway.auth.token` configurées lorsque c’est possible.
- `dashboard` suit `gateway.tls.enabled` : les passerelles avec TLS activé affichent/ouvrent
  des URL d’interface utilisateur de contrôle en `https://` et se connectent via `wss://`.
- Si la livraison via le presse-papiers ou le navigateur échoue pour une URL de tableau de bord authentifiée par jeton,
  `dashboard` consigne un indice sûr d’authentification manuelle nommant `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` et la clé de fragment `token`, sans afficher la valeur du jeton.
- Pour les jetons gérés par SecretRef (résolus ou non résolus), `dashboard` affiche/copie/ouvre une URL sans jeton afin d’éviter d’exposer des secrets externes dans la sortie du terminal, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais non résolu dans ce chemin de commande, la commande affiche une URL sans jeton et des consignes de correction explicites au lieu d’intégrer un espace réservé de jeton invalide.

## Associé

- [Référence CLI](/fr/cli)
- [Tableau de bord](/fr/web/dashboard)
