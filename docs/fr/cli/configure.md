---
read_when:
    - Vous souhaitez ajuster de manière interactive les identifiants, les appareils ou les valeurs par défaut de l’agent
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: Configurer
x-i18n:
    generated_at: "2026-04-25T13:43:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f445b1b5dd7198175c718d51ae50f9c9c0f3dcbb199adacf9155f6a512d93a
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Invite interactive pour configurer les identifiants, les appareils et les valeurs par défaut de l’agent.

Remarque : la section **Model** inclut désormais une sélection multiple pour la liste d’autorisation
`agents.defaults.models` (ce qui s’affiche dans `/model` et dans le sélecteur de modèle).
Les choix de configuration limités à un fournisseur fusionnent leurs modèles sélectionnés dans la
liste d’autorisation existante au lieu de remplacer les fournisseurs non liés déjà présents dans la configuration.
Relancer l’authentification d’un fournisseur depuis configure préserve un
`agents.defaults.model.primary` existant ; utilisez `openclaw models auth login --provider <id> --set-default`
ou `openclaw models set <model>` lorsque vous souhaitez délibérément changer le modèle par défaut.

Lorsque configure démarre à partir d’un choix d’authentification de fournisseur, les sélecteurs du modèle par défaut et de la
liste d’autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs appariés tels
que Volcengine/BytePlus, cette même préférence correspond aussi à leurs variantes de
planification de code (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre de
fournisseur préféré produirait une liste vide, configure revient au catalogue
non filtré au lieu d’afficher un sélecteur vide.

Astuce : `openclaw config` sans sous-commande ouvre le même assistant. Utilisez
`openclaw config get|set|unset` pour les modifications non interactives.

Pour la recherche web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent également des
invites de suivi spécifiques au fournisseur :

- **Grok** peut proposer une configuration facultative de `x_search` avec la même `XAI_API_KEY` et
  vous permettre de choisir un modèle `x_search`.
- **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

Associé :

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

- Choisir où la Gateway s’exécute met toujours à jour `gateway.mode`. Vous pouvez sélectionner « Continuer » sans autres sections si c’est tout ce dont vous avez besoin.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent des listes d’autorisation de canal/salon pendant la configuration. Vous pouvez saisir des noms ou des IDs ; l’assistant résout les noms en IDs lorsque c’est possible.
- Si vous exécutez l’étape d’installation du daemon, que l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, configure valide le SecretRef mais ne conserve pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, configure bloque l’installation du daemon avec des indications de remédiation exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, configure bloque l’installation du daemon jusqu’à ce que le mode soit défini explicitement.

## Exemples

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Associé

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
