---
read_when:
    - Vous souhaitez ouvrir l’interface de contrôle avec votre jeton actuel
    - Vous souhaitez afficher l’URL sans ouvrir de navigateur
summary: Référence de la CLI pour `openclaw dashboard` (ouvrir l’interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-07-12T15:13:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Ouvrez l’interface de contrôle avec votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open` : affiche l’URL sans lancer de navigateur.
- `--yes` : démarre/installe le Gateway sans demander de confirmation lorsque nécessaire.

Remarques :

- Résout les SecretRefs `gateway.auth.token` configurées lorsque cela est possible.
- Suit `gateway.tls.enabled` : les Gateway avec TLS activé affichent/ouvrent des URL d’interface de contrôle en `https://` et se connectent via `wss://`.
- Pour une liaison `lan` ou une liaison `custom` avec caractère générique, les lancements sur le même hôte utilisent toujours l’adresse de bouclage, car un caractère générique n’est pas une destination de navigateur. Les liaisons `tailnet` et `custom` en texte clair utilisent également `127.0.0.1` afin que le navigateur dispose d’un contexte sécurisé ; avec TLS activé, les hôtes spécifiques conservent l’adresse configurée afin que les noms des certificats correspondent.
- Avant de fournir une URL de bouclage authentifiée pour une liaison à une interface spécifique, la commande sonde l’interface configurée et vérifie qu’elle et `127.0.0.1` appartiennent au même processus Gateway. Si la propriété de l’écouteur est ambiguë, la commande échoue de manière sécurisée et fournit des indications sur l’état.
- Pour les jetons gérés par SecretRef (résolus ou non résolus), l’URL affichée, copiée ou ouverte n’inclut jamais le jeton, afin que les secrets externes ne soient pas divulgués dans la sortie du terminal, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais non résolu, la commande affiche une URL sans jeton et des instructions de résolution plutôt qu’un espace réservé de jeton non valide.
- Si la transmission par le presse-papiers ou le navigateur échoue pour une URL authentifiée par jeton, la commande consigne une indication sûre d’authentification manuelle mentionnant `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` et la clé de fragment d’URL `token`, sans afficher la valeur du jeton.

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Tableau de bord](/fr/web/dashboard)
