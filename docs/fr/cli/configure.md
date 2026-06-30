---
read_when:
    - Vous souhaitez ajuster les identifiants, les appareils ou les valeurs par défaut de l’agent de manière interactive
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: Configurer
x-i18n:
    generated_at: "2026-06-30T22:14:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Invite interactive pour apporter des modifications ciblées à une configuration existante : identifiants, appareils, valeurs par défaut des agents, Gateway, canaux, plugins, Skills et contrôles de santé.

Utilisez `openclaw onboard` ou `openclaw setup` pour le parcours initial complet guidé, `openclaw setup --baseline` uniquement pour la configuration/l’espace de travail de base, et `openclaw channels add` lorsque vous n’avez besoin que de configurer un compte de canal.

<Note>
La section **Modèle** inclut une sélection multiple pour la liste d’autorisation `agents.defaults.models` (ce qui apparaît dans `/model` et le sélecteur de modèle). Les choix de configuration propres à un fournisseur fusionnent leurs modèles sélectionnés dans la liste d’autorisation existante au lieu de remplacer les fournisseurs non liés déjà présents dans la configuration.

Relancer l’authentification d’un fournisseur depuis configure préserve un `agents.defaults.model.primary` existant, même lorsque l’étape d’authentification du fournisseur renvoie un correctif de configuration avec son propre modèle par défaut recommandé. Cela signifie qu’ajouter ou réauthentifier xAI, OpenRouter ou un autre fournisseur doit rendre le nouveau modèle disponible sans remplacer votre modèle principal actuel. Utilisez `openclaw models auth login --provider <id> --set-default` ou `openclaw models set <model>` lorsque vous voulez intentionnellement changer le modèle par défaut.
</Note>

Lorsque configure démarre depuis un choix d’authentification de fournisseur, les sélecteurs de modèle par défaut et de liste d’autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs appariés tels que Volcengine et BytePlus, la même préférence correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre de fournisseur préféré produisait une liste vide, configure revient au catalogue non filtré au lieu d’afficher un sélecteur vide.

<Tip>
`openclaw config` sans sous-commande ouvre le même assistant. Utilisez `openclaw config get|set|unset` pour des modifications non interactives.
</Tip>

Pour la recherche web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent également des invites de suivi
propres au fournisseur :

- **Grok** peut proposer une configuration facultative de `x_search` avec le même profil OAuth xAI
  ou la même clé d’API, et vous laisser choisir un modèle `x_search`.
- **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` contre
  `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

Liés :

- Référence de configuration de Gateway : [Configuration](/fr/gateway/configuration)
- CLI de configuration : [Config](/fr/cli/config)

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

Notes :

- L’assistant complet et les sections liées à Gateway demandent où le Gateway s’exécute et mettent à jour `gateway.mode`. Les filtres de section qui n’incluent pas `gateway`, `daemon` ou `health` passent directement à la configuration demandée.
- Après les écritures de configuration locales, configure installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les exige. La configuration de Gateway distant n’installe pas les packages de plugin locaux.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent des listes d’autorisation de canaux/salons pendant la configuration. Vous pouvez saisir des noms ou des identifiants ; l’assistant résout les noms en identifiants lorsque c’est possible.
- Si vous exécutez l’étape d’installation du daemon, que l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, configure valide le SecretRef mais ne persiste pas les valeurs de jeton en texte clair résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, configure bloque l’installation du daemon avec des conseils de remédiation exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, configure bloque l’installation du daemon jusqu’à ce que le mode soit défini explicitement.

## Exemples

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Connexe

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
