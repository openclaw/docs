---
read_when:
    - Vous voulez ouvrir l’interface utilisateur de contrôle avec votre jeton actuel
    - Vous voulez afficher l’URL sans lancer de navigateur
summary: Référence CLI pour `openclaw dashboard` (ouvrir l’interface utilisateur de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-04-25T13:43:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Ouvrez l’interface utilisateur de contrôle à l’aide de votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Remarques :

- `dashboard` résout les SecretRef configurés dans `gateway.auth.token` lorsque c’est possible.
- `dashboard` suit `gateway.tls.enabled` : les gateways avec TLS activé affichent/ouvrent
  des URL d’interface utilisateur de contrôle en `https://` et se connectent en `wss://`.
- Pour les jetons gérés par SecretRef (résolus ou non résolus), `dashboard` affiche/copie/ouvre une URL sans jeton afin d’éviter d’exposer des secrets externes dans la sortie du terminal, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais non résolu dans ce chemin de commande, la commande affiche une URL sans jeton et des indications de remédiation explicites au lieu d’intégrer un espace réservé de jeton invalide.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Tableau de bord](/fr/web/dashboard)
