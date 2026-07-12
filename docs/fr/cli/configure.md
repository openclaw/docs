---
read_when:
    - Vous souhaitez modifier interactivement les identifiants, les appareils ou les valeurs par défaut de l’agent
summary: Référence de la CLI pour `openclaw configure` (invites de configuration interactives)
title: Configurer
x-i18n:
    generated_at: "2026-07-12T15:09:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Invites interactives permettant d'apporter des modifications ciblées à une configuration existante : identifiants, appareils, paramètres par défaut des agents, Gateway, canaux, plugins, Skills et contrôles d'intégrité.

Utilisez `openclaw onboard` ou `openclaw setup` pour suivre l'intégralité du parcours guidé de première exécution, `openclaw setup --baseline` pour créer uniquement la configuration et l'espace de travail de référence, et `openclaw channels add` lorsque vous devez seulement configurer un compte de canal.

<Tip>
`openclaw config` sans sous-commande ouvre le même assistant. Utilisez `openclaw config get|set|unset` pour effectuer des modifications non interactives.
</Tip>

## Options

`--section <section>` : filtre de section répétable. Sections disponibles :

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

La sélection de `gateway`, `daemon` ou `health` (ou l'exécution de l'assistant complet sans `--section`) demande où s'exécute le Gateway et met à jour `gateway.mode`. Les filtres de section qui ignorent ces trois sections accèdent directement à la configuration demandée, sans demander le mode du Gateway. La sélection du mode Gateway distant écrit la configuration distante et quitte immédiatement ; elle n'exécute pas les étapes exclusivement locales, telles que l'installation de plugins.

<Note>
`openclaw configure` nécessite un terminal interactif (stdin et stdout doivent tous deux être des TTY). Sans terminal interactif, la commande affiche les commandes non interactives équivalentes `openclaw config get|set|patch|validate`, puis se termine avec une erreur au lieu de s'exécuter partiellement.
</Note>

## Section Modèle

<Note>
**Modèle** comprend une sélection multiple pour la liste d'autorisation `agents.defaults.models` (ce qui apparaît dans `/model` et dans le sélecteur de modèle). Les choix de configuration propres à un fournisseur fusionnent les modèles sélectionnés avec la liste d'autorisation existante, au lieu de remplacer les fournisseurs sans rapport déjà présents dans la configuration.

La réexécution de l'authentification d'un fournisseur depuis la configuration préserve une valeur `agents.defaults.model.primary` existante, même lorsque l'étape d'authentification du fournisseur renvoie un correctif de configuration contenant son propre modèle par défaut recommandé. L'ajout ou la réauthentification d'un fournisseur rend ses modèles disponibles sans remplacer votre modèle principal actuel. Utilisez `openclaw models auth login --provider <id> --set-default` ou `openclaw models set <model>` pour modifier intentionnellement le modèle par défaut.
</Note>

Lorsque la configuration démarre à partir d'un choix d'authentification de fournisseur, les sélecteurs de modèle par défaut et de liste d'autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs associés tels que Volcengine et BytePlus, cette préférence correspond également aux variantes de leurs forfaits de programmation (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre du fournisseur privilégié produisait une liste vide, la configuration revient au catalogue non filtré au lieu d'afficher un sélecteur vide.

## Section Web

`openclaw configure --section web` permet de choisir un fournisseur de recherche Web et de configurer ses identifiants. Certains fournisseurs affichent des étapes supplémentaires qui leur sont propres :

- **Grok** peut proposer la configuration facultative de `x_search` avec le même profil OAuth xAI ou la même clé API, et vous permettre de choisir un modèle `x_search`.
- **Kimi** peut demander la région de l'API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) et le modèle de recherche Web Kimi par défaut.

## Autres remarques

- Après l'écriture de la configuration locale, la configuration installe les plugins téléchargeables sélectionnés lorsque le parcours choisi l'exige. La configuration d'un Gateway distant n'installe pas de paquets de plugins locaux.
- Les services orientés canaux (Slack/Discord/Matrix/Microsoft Teams) demandent les listes d'autorisation des canaux ou salons pendant la configuration. Vous pouvez saisir des noms ou des identifiants ; l'assistant résout les noms en identifiants lorsque cela est possible.
- Si vous exécutez l'étape d'installation du démon, l'authentification par jeton nécessite un jeton. Si `gateway.auth.token` est géré par SecretRef, la configuration valide la SecretRef, mais ne conserve pas les valeurs de jeton en texte clair résolues dans les métadonnées d'environnement du service superviseur ; si la SecretRef n'est pas résolue, la configuration bloque l'installation du démon et fournit des instructions correctives exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n'est pas défini, la configuration bloque l'installation du démon jusqu'à ce que vous définissiez explicitement le mode.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
- CLI de configuration : [Configuration](/fr/cli/config)
