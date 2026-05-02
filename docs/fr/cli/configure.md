---
read_when:
    - Vous souhaitez ajuster les identifiants, les appareils ou les paramètres par défaut de l’agent de manière interactive
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: Configurer
x-i18n:
    generated_at: "2026-05-02T07:00:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Invite interactive pour configurer les identifiants, les appareils et les valeurs par défaut des agents.

<Note>
La section **Modèle** inclut une sélection multiple pour la liste d’autorisation `agents.defaults.models` (ce qui apparaît dans `/model` et le sélecteur de modèle). Les choix de configuration limités à un fournisseur fusionnent leurs modèles sélectionnés dans la liste d’autorisation existante au lieu de remplacer les fournisseurs non liés déjà présents dans la configuration.

Relancer l’authentification d’un fournisseur depuis la configuration conserve un `agents.defaults.model.primary` existant, même lorsque l’étape d’authentification du fournisseur renvoie un correctif de configuration avec son propre modèle par défaut recommandé. Cela signifie qu’ajouter ou réauthentifier xAI, OpenRouter ou un autre fournisseur doit rendre le nouveau modèle disponible sans remplacer votre modèle principal actuel. Utilisez `openclaw models auth login --provider <id> --set-default` ou `openclaw models set <model>` lorsque vous souhaitez volontairement changer le modèle par défaut.
</Note>

Lorsque la configuration démarre à partir d’un choix d’authentification de fournisseur, les sélecteurs de modèle par défaut et de liste d’autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs appariés tels que Volcengine et BytePlus, la même préférence correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre de fournisseur préféré produisait une liste vide, la configuration revient au catalogue non filtré au lieu d’afficher un sélecteur vide.

<Tip>
`openclaw config` sans sous-commande ouvre le même assistant. Utilisez `openclaw config get|set|unset` pour les modifications non interactives.
</Tip>

Pour la recherche web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent aussi des invites de suivi
propres au fournisseur :

- **Grok** peut proposer une configuration facultative de `x_search` avec la même `XAI_API_KEY` et
  vous permettre de choisir un modèle `x_search`.
- **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` ou
  `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

Connexe :

- Référence de configuration du Gateway : [Configuration](/fr/gateway/configuration)
- CLI de configuration : [Configuration](/fr/cli/config)

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

- Choisir où le Gateway s’exécute met toujours à jour `gateway.mode`. Vous pouvez sélectionner « Continuer » sans autre section si c’est tout ce dont vous avez besoin.
- Après les écritures de configuration locale, la configuration installe les plugins téléchargeables sélectionnés lorsque le chemin de configuration choisi les requiert. La configuration d’un Gateway distant n’installe pas de packages de plugins locaux.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent des listes d’autorisation de canaux/salles pendant la configuration. Vous pouvez saisir des noms ou des ID ; l’assistant résout les noms en ID lorsque c’est possible.
- Si vous exécutez l’étape d’installation du démon, que l’authentification par jeton requiert un jeton et que `gateway.auth.token` est géré par SecretRef, la configuration valide la SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton requiert un jeton et que la SecretRef de jeton configurée n’est pas résolue, la configuration bloque l’installation du démon avec des conseils de remédiation exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, la configuration bloque l’installation du démon jusqu’à ce que le mode soit défini explicitement.

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
