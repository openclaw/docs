---
read_when:
    - Vous souhaitez ouvrir l’interface de contrôle avec votre jeton actuel
    - Vous souhaitez afficher l’URL sans lancer de navigateur
summary: Référence de la CLI pour `openclaw dashboard` (ouvrir l’interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-07-12T02:42:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Ouvrez l’interface de contrôle en utilisant votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open` : affiche l’URL, mais ne lance pas de navigateur.
- `--yes` : démarre/installe le Gateway sans demander de confirmation lorsque cela est nécessaire.

Remarques :

- Résout les SecretRefs configurées dans `gateway.auth.token` lorsque cela est possible.
- Respecte `gateway.tls.enabled` : les Gateways avec TLS activé affichent/ouvrent des URL de l’interface de contrôle en `https://` et se connectent via `wss://`.
- Pour une liaison `lan` ou une liaison `custom` avec caractère générique, les lancements sur le même hôte utilisent toujours l’adresse de bouclage, car un caractère générique ne constitue pas une destination de navigateur. Les liaisons `tailnet` et `custom` en texte clair utilisent également `127.0.0.1` afin que le navigateur dispose d’un contexte sécurisé ; les hôtes spécifiques avec TLS activé conservent l’adresse configurée afin que les noms de certificat correspondent.
- Avant de fournir une URL de bouclage authentifiée pour une liaison à une interface spécifique, la commande sonde l’interface configurée et vérifie que celle-ci et `127.0.0.1` appartiennent au même processus Gateway. Si la propriété de l’écouteur est ambiguë, la commande échoue de manière sécurisée et fournit des indications sur l’état.
- Pour les jetons gérés par SecretRef, qu’ils soient résolus ou non, l’URL affichée, copiée ou ouverte n’inclut jamais le jeton, afin que les secrets externes ne soient divulgués ni dans la sortie du terminal, ni dans l’historique du presse-papiers, ni dans les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais n’est pas résolu, la commande affiche une URL sans jeton et des instructions de correction plutôt qu’un espace réservé de jeton non valide.
- Si la copie dans le presse-papiers ou l’ouverture dans le navigateur échoue pour une URL authentifiée par jeton, la commande consigne une indication sûre pour l’authentification manuelle mentionnant `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` et la clé de fragment d’URL `token`, sans afficher la valeur du jeton.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Tableau de bord](/fr/web/dashboard)
