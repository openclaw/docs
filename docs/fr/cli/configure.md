---
read_when:
    - Vous voulez ajuster de manière interactive les identifiants, appareils ou valeurs par défaut des agents
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: configure
x-i18n:
    generated_at: "2026-04-23T07:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Invite interactive pour configurer les identifiants, les appareils et les valeurs par défaut des agents.

Remarque : la section **Model** inclut désormais une sélection multiple pour la liste d’autorisation `agents.defaults.models` (ce qui apparaît dans `/model` et dans le sélecteur de modèle).
Les choix de configuration à portée fournisseur fusionnent leurs modèles sélectionnés dans la liste d’autorisation existante au lieu de remplacer les autres fournisseurs déjà présents dans la configuration.

Lorsque configure démarre depuis un choix d’authentification fournisseur, les sélecteurs du modèle par défaut et de la liste d’autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs appariés comme Volcengine/BytePlus, cette même préférence correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre de fournisseur préféré produirait une liste vide, configure revient au catalogue non filtré au lieu d’afficher un sélecteur vide.

Astuce : `openclaw config` sans sous-commande ouvre le même assistant. Utilisez
`openclaw config get|set|unset` pour les modifications non interactives.

Pour la recherche web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent aussi des
invites de suivi spécifiques au fournisseur :

- **Grok** peut proposer une configuration optionnelle `x_search` avec la même clé `XAI_API_KEY` et
  vous laisser choisir un modèle `x_search`.
- **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) ainsi que le modèle de recherche web Kimi par défaut.

Voir aussi :

- Référence de configuration de la Gateway : [Configuration](/fr/gateway/configuration)
- CLI config : [Config](/fr/cli/config)

## Options

- `--section <section>` : filtre de section répétable

Sections disponibles :

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Remarques :

- Choisir où la Gateway s’exécute met toujours à jour `gateway.mode`. Vous pouvez sélectionner « Continue » sans autres sections si c’est tout ce dont vous avez besoin.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent des listes d’autorisation de canal/salon pendant la configuration. Vous pouvez saisir des noms ou des identifiants ; l’assistant résout les noms en identifiants lorsque c’est possible.
- Si vous exécutez l’étape d’installation du daemon, que l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, configure valide le SecretRef mais ne conserve pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef du jeton configuré n’est pas résolu, configure bloque l’installation du daemon avec des conseils de remédiation exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, configure bloque l’installation du daemon jusqu’à ce que le mode soit défini explicitement.

## Exemples

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
