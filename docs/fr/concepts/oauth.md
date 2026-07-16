---
read_when:
    - Vous souhaitez comprendre OAuth dans OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation des jetons ou de déconnexion
    - Vous souhaitez utiliser la CLI Claude ou des flux d’authentification OAuth
    - Vous souhaitez utiliser plusieurs comptes ou le routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multicomptes'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T13:12:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw prend en charge OAuth (« authentification par abonnement ») pour les fournisseurs qui le proposent,
notamment **OpenAI Codex (OAuth ChatGPT)** et la **réutilisation de la CLI Anthropic Claude**.
Pour Anthropic, la distinction pratique est la suivante :

- **Clé API Anthropic** : facturation normale de l'API Anthropic.
- **CLI Anthropic Claude / authentification par abonnement dans OpenClaw** : le personnel d'Anthropic
  nous a indiqué que cet usage est de nouveau autorisé. OpenClaw considère donc la réutilisation de la CLI Claude et
  l'utilisation de `claude -p` comme autorisées pour cette intégration, sauf si Anthropic
  publie une nouvelle politique. Pour Anthropic en production, l'authentification par clé API reste
  la méthode recommandée la plus sûre.

OpenClaw stocke l'authentification par clé API OpenAI et l'OAuth ChatGPT/Codex sous
l'identifiant de fournisseur canonique `openai`. Les anciens identifiants de profil `openai-codex:*` et
les entrées `auth.order.openai-codex` constituent un état hérité réparé par
`openclaw doctor --fix` ; utilisez les identifiants de profil `openai:*` et `auth.order.openai` pour
les nouvelles configurations.

Cette page présente :

- le fonctionnement de l'**échange de jetons** OAuth (PKCE)
- l'endroit où les jetons sont **stockés** (et pourquoi)
- la gestion de **plusieurs comptes** (profils et remplacements par session)

Les Plugins de fournisseur qui fournissent leur propre flux OAuth ou par clé API passent par le
même point d'entrée :

```bash
openclaw models auth login --provider <id>
```

## Le réceptacle de jetons (pourquoi il existe)

Les fournisseurs OAuth génèrent souvent un nouveau jeton d'actualisation à chaque connexion ou actualisation.
Certains fournisseurs invalident le jeton d'actualisation précédent lorsqu'un nouveau jeton est
émis pour le même utilisateur et la même application. Symptôme concret : une connexion via OpenClaw _et_
via Claude Code ou la CLI Codex entraîne ultérieurement la déconnexion aléatoire de l'un des deux.

Pour limiter ce problème, OpenClaw traite le magasin de profils d'authentification comme un **réceptacle de jetons** :

- l'environnement d'exécution lit les identifiants depuis un emplacement unique par agent
- plusieurs profils peuvent coexister et être acheminés de manière déterministe
- la réutilisation d'une CLI externe dépend du fournisseur : dès qu'OpenClaw possède un profil OAuth
  local pour un fournisseur, le jeton d'actualisation local fait autorité. Si ce jeton
  d'actualisation local est refusé, OpenClaw signale que le profil doit être
  réauthentifié au lieu de revenir aux données de jeton de la CLI externe.
  L'amorçage par la CLI Codex est encore plus limité : il peut uniquement initialiser un profil vide
  de type `openai:default` avant qu'OpenClaw ne possède l'OAuth pour ce
  fournisseur ; ensuite, les actualisations gérées par OpenClaw restent canoniques
- les chemins d'état et de démarrage limitent la détection des CLI externes à l'ensemble des fournisseurs
  déjà configurés, afin que le magasin de connexion d'une CLI sans rapport ne soit pas sondé dans une
  configuration à fournisseur unique

## Stockage (emplacement des jetons)

Les secrets sont stockés par agent, sous le nom logique `auth-profiles.json` (le
magasin sous-jacent est la base de données SQLite de l'agent ; le nom JSON est conservé pour
la compatibilité et l'affichage dans les outils) :

- Profils d'authentification (OAuth + clés API + références facultatives au niveau des valeurs) :
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées statiques `api_key` sont supprimées lorsqu'elles sont détectées)

Fichier hérité destiné uniquement à l'importation (toujours pris en charge, mais ce n'est pas le magasin principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans le magasin de profils d'authentification à la première utilisation)

Tous les éléments ci-dessus respectent également `$OPENCLAW_STATE_DIR` (remplacement du répertoire d'état). Référence complète : [/gateway/configuration-reference#auth-storage](/fr/gateway/configuration-reference#auth-storage)

Pour les références statiques aux secrets et le comportement d'activation des instantanés à l'exécution, consultez [Gestion des secrets](/fr/gateway/secrets).

Lorsqu'un agent secondaire ne possède aucun profil d'authentification local, OpenClaw utilise un héritage
avec lecture transparente depuis le magasin de l'agent principal/par défaut ; il ne clone pas le magasin de l'agent
principal lors de la lecture. Les jetons d'actualisation OAuth sont particulièrement sensibles : les flux de
copie normaux les ignorent par défaut, car certains fournisseurs font tourner ou invalident
les jetons d'actualisation après leur utilisation. Configurez une connexion OAuth distincte pour un agent lorsqu'il
a besoin d'un compte indépendant.

## Réutilisation de la CLI Anthropic Claude

OpenClaw prend en charge la réutilisation de la CLI Anthropic Claude et `claude -p` comme méthode
d'authentification autorisée. Si une connexion Claude locale existe déjà sur l'hôte,
l'intégration initiale ou la configuration peut la réutiliser directement. Le jeton de configuration Anthropic reste
disponible comme méthode d'authentification par jeton prise en charge, mais OpenClaw préfère la réutilisation de la CLI Claude
lorsqu'elle est disponible.

<Warning>
La documentation publique de Claude Code d'Anthropic indique que l'utilisation directe de Claude Code reste soumise aux
limites de l'abonnement Claude, et le personnel d'Anthropic nous a indiqué que l'utilisation de la CLI Claude à la manière d'OpenClaw
est de nouveau autorisée. OpenClaw considère donc la réutilisation de la CLI Claude et
l'utilisation de `claude -p` comme autorisées pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour consulter la documentation actuelle d'Anthropic concernant les offres utilisées directement avec Claude Code, voir [Utilisation de Claude Code
avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Utilisation de Claude Code avec votre offre Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Pour découvrir d'autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Offre Qwen Cloud Coding
Plan](/fr/providers/qwen), [Offre MiniMax Coding Plan](/fr/providers/minimax)
et [Offre Z.AI / GLM Coding Plan](/fr/providers/zai).
</Warning>

## Échange OAuth (fonctionnement de la connexion)

Les flux de connexion interactifs d'OpenClaw sont implémentés dans `openclaw/plugin-sdk/llm.ts` et reliés aux assistants et aux commandes.

### Jeton de configuration Anthropic

Structure du flux :

1. créez le jeton en exécutant `claude setup-token` sur n'importe quelle machine dotée de Claude Code, puis lancez la configuration par jeton Anthropic ou collez le jeton depuis OpenClaw
2. OpenClaw stocke l'identifiant Anthropic obtenu dans un profil d'authentification
3. la sélection du modèle reste sur `anthropic/...`
4. les profils d'authentification Anthropic existants restent disponibles pour contrôler le retour en arrière et l'ordre

### OpenAI Codex (OAuth ChatGPT)

L'OAuth OpenAI Codex est explicitement pris en charge pour une utilisation en dehors de la CLI Codex, y compris dans les flux de travail OpenClaw.

La commande de connexion utilise l'identifiant de fournisseur OpenAI canonique :

```bash
openclaw models auth login --provider openai
```

Utilisez `--profile-id openai:<name>` pour plusieurs comptes OAuth ChatGPT/Codex dans
un même agent. N'utilisez pas `openai-codex:<name>` pour les nouveaux profils. Doctor migre
cet ancien préfixe vers un identifiant de profil `openai:*` sans collision ; exécutez
`openclaw models auth list --provider openai` après la réparation, avant de copier les
identifiants de profil dans `auth.order` ou `/model ...@<profileId>`.

Structure du flux (PKCE) :

1. générez un vérificateur/défi PKCE et un `state` aléatoire
2. ouvrez `https://auth.openai.com/oauth/authorize?...` (portée
   `openid profile email offline_access`)
3. essayez de capturer le rappel sur `http://localhost:1455/auth/callback` (l'hôte de
   rappel utilise par défaut `localhost` et accepte uniquement les hôtes de bouclage ;
   remplacez-le avec `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. si vous pouvez coller un code avant l'arrivée du rappel (ou si vous êtes
   à distance/sans interface graphique et que le rappel ne peut pas être lié), collez plutôt l'URL de redirection ou le code
   — le collage manuel entre en concurrence avec le rappel du navigateur et le premier
   terminé l'emporte
5. échangez le code auprès de `https://auth.openai.com/oauth/token`
6. extrayez `accountId` du jeton d'accès et stockez `{ access, refresh, expires, accountId }`

Le chemin de l'assistant est `openclaw onboard` → choix d'authentification `openai`.

## Actualisation et expiration

Les profils stockent un horodatage `expires`. À l'exécution :

- si `expires` est dans le futur, utilisez le jeton d'accès stocké
- s'il a expiré, actualisez-le (sous verrouillage de fichier) et remplacez les identifiants stockés
- si un agent secondaire lit un profil OAuth hérité de l'agent principal,
  l'actualisation est réécrite dans le magasin de l'agent principal au lieu de copier le jeton
  d'actualisation dans le magasin de l'agent secondaire
- les identifiants de CLI gérés en externe (CLI Claude, amorçage limité par la CLI Codex ;
  voir [Le réceptacle de jetons](#the-token-sink-why-it-exists)) sont relus au lieu
  de consommer un jeton d'actualisation copié. Si une actualisation gérée échoue, OpenClaw
  signale le profil concerné pour réauthentification au lieu de renvoyer
  les données de jeton de la CLI externe.

Le flux d'actualisation est automatique ; il n'est généralement pas nécessaire de gérer les jetons manuellement.

## Plusieurs comptes (profils) et acheminement

Deux méthodes :

### 1) Recommandée : agents distincts

Pour éviter toute interaction entre les comptes « personnel » et « professionnel », utilisez des agents isolés (sessions, identifiants et espace de travail distincts) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l'authentification par agent (assistant) et acheminez les discussions vers l'agent approprié.

### 2) Avancée : plusieurs profils dans un agent

Le magasin de profils d'authentification prend en charge plusieurs identifiants de profil pour un même fournisseur.
Choisissez celui à utiliser :

- globalement, au moyen de l'ordre défini dans la configuration (`auth.order`)
- par session, au moyen de `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Répertoriez les identifiants de profil existants avec :

```bash
openclaw models auth list --provider <id>
```

Documentation connexe :

- [Basculement de modèle](/fr/concepts/model-failover) (règles de rotation et de délai de récupération)
- [Commandes à barre oblique](/fr/tools/slash-commands) (surface de commandes)

## Voir aussi

- [Authentification](/fr/gateway/authentication) — présentation de l'authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) — stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) — clés de configuration d'authentification
