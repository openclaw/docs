---
read_when:
    - Vous souhaitez ajuster les identifiants, les appareils ou les paramètres par défaut de l’agent de manière interactive
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: Configurer
x-i18n:
    generated_at: "2026-05-11T20:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Invite interactive pour apporter des modifications ciblées à une configuration existante : identifiants, appareils, valeurs par défaut des agents, Gateway, canaux, plugins, Skills et contrôles d’intégrité.

Utilisez `openclaw onboard` pour le parcours initial complet guidé, `openclaw setup` uniquement pour la configuration/l’espace de travail de base, et `openclaw channels add` lorsque vous avez seulement besoin de configurer un compte de canal.

<Note>
La section **Model** inclut une sélection multiple pour la liste d’autorisation `agents.defaults.models` (ce qui apparaît dans `/model` et dans le sélecteur de modèle). Les choix de configuration propres aux fournisseurs fusionnent leurs modèles sélectionnés dans la liste d’autorisation existante au lieu de remplacer les fournisseurs non liés déjà présents dans la configuration.

Relancer l’authentification d’un fournisseur depuis configure conserve un `agents.defaults.model.primary` existant, même lorsque l’étape d’authentification du fournisseur renvoie un correctif de configuration avec son propre modèle par défaut recommandé. Cela signifie qu’ajouter ou réauthentifier xAI, OpenRouter ou un autre fournisseur doit rendre le nouveau modèle disponible sans prendre la place de votre modèle principal actuel. Utilisez `openclaw models auth login --provider <id> --set-default` ou `openclaw models set <model>` lorsque vous voulez intentionnellement changer le modèle par défaut.
</Note>

Lorsque configure démarre depuis un choix d’authentification de fournisseur, les sélecteurs de modèle par défaut et de liste d’autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs associés comme Volcengine et BytePlus, la même préférence correspond également à leurs variantes de plans de codage (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre du fournisseur préféré produit une liste vide, configure revient au catalogue non filtré au lieu d’afficher un sélecteur vide.

<Tip>
`openclaw config` sans sous-commande ouvre le même assistant. Utilisez `openclaw config get|set|unset` pour les modifications non interactives.
</Tip>

Pour la recherche web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent également des
invites de suivi propres au fournisseur :

- **Grok** peut proposer une configuration facultative de `x_search` avec la même `XAI_API_KEY` et
  vous laisser choisir un modèle `x_search`.
- **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` ou
  `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

Connexe :

- Référence de configuration du Gateway : [Configuration](/fr/gateway/configuration)
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

- Choisir où s’exécute le Gateway met toujours à jour `gateway.mode`. Vous pouvez sélectionner « Continuer » sans autres sections si c’est tout ce dont vous avez besoin.
- Après les écritures dans la configuration locale, configure installe les plugins téléchargeables sélectionnés lorsque le parcours de configuration choisi les exige. La configuration d’un gateway distant n’installe pas de paquets de plugins locaux.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent des listes d’autorisation de canaux/salles pendant la configuration. Vous pouvez saisir des noms ou des identifiants ; l’assistant résout les noms en identifiants lorsque c’est possible.
- Si vous exécutez l’étape d’installation du daemon, que l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, configure valide le SecretRef mais ne persiste pas les valeurs de jeton en texte clair résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, configure bloque l’installation du daemon avec des conseils de remédiation exploitables.
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
