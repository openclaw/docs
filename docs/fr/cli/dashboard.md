---
read_when:
    - Vous souhaitez ouvrir l’interface de contrôle avec votre jeton actuel
    - Vous souhaitez afficher l’URL sans lancer de navigateur
summary: Référence de la CLI pour `openclaw dashboard` (ouvrir l’interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-07-16T13:09:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Ouvrez l’interface de contrôle à l’aide de votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open` : affichez l’URL sans lancer de navigateur.
- `--json` : affichez un objet de connexion lisible par machine sans ouvrir de navigateur, utiliser le presse-papiers, demander une confirmation ni démarrer le Gateway.
- `--yes` : démarrez/installez le Gateway sans demander de confirmation si nécessaire.

## Sortie lisible par machine

Utilisez `--json` pour les intégrations de bureau et les scripts qui nécessitent l’URL résolue de l’interface de contrôle :

```bash
openclaw dashboard --json
```

La réponse inclut `url`, `httpUrl`, `wsUrl`, `port` et `tokenIncluded`. Si le Gateway n’est pas prêt, la commande renvoie `{"ok":false,"reason":"..."}` et se termine avec un code différent de zéro. Les jetons gérés par SecretRef ne sont jamais inclus dans `url`.

Remarques :

- Résout les SecretRefs `gateway.auth.token` configurées lorsque cela est possible.
- Suit `gateway.tls.enabled` : les gateways avec TLS activé affichent/ouvrent des URL de l’interface de contrôle `https://` et se connectent via `wss://`.
- Pour une liaison `lan` ou une liaison générique `custom`, les lancements sur le même hôte utilisent toujours l’adresse de bouclage, car une adresse générique n’est pas une destination de navigateur. Les liaisons en texte clair `tailnet` et `custom` utilisent également `127.0.0.1` afin que le navigateur dispose d’un contexte sécurisé ; les hôtes spécifiques avec TLS activé conservent l’adresse configurée afin que les noms des certificats correspondent.
- Avant de fournir une URL de bouclage authentifiée pour une liaison à une interface spécifique, la commande sonde l’interface configurée et vérifie qu’elle et `127.0.0.1` appartiennent au même processus Gateway. Si la propriété de l’écouteur est ambiguë, l’opération échoue de manière sécurisée avec des indications sur l’état.
- Pour les jetons gérés par SecretRef (résolus ou non), l’URL affichée, copiée ou ouverte n’inclut jamais le jeton, afin que les secrets externes ne soient pas divulgués dans la sortie du terminal, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais non résolu, la commande affiche une URL sans jeton et des instructions de correction au lieu d’un espace réservé de jeton non valide.
- Si la transmission par le presse-papiers ou le navigateur échoue pour une URL authentifiée par jeton, la commande consigne une indication sûre d’authentification manuelle mentionnant `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` et la clé de fragment d’URL `token`, sans afficher la valeur du jeton.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Tableau de bord](/fr/web/dashboard)
