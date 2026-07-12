---
read_when:
    - Vous souhaitez comprendre OAuth dans OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation de jeton ou de déconnexion
    - Vous souhaitez utiliser les flux d’authentification de la CLI Claude ou OAuth
    - Vous souhaitez utiliser plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multicomptes'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T15:17:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw prend en charge OAuth (« authentification par abonnement ») pour les fournisseurs qui le proposent,
notamment **OpenAI Codex (OAuth ChatGPT)** et la **réutilisation de la CLI Anthropic Claude**.
Pour Anthropic, la distinction pratique est la suivante :

- **Clé d’API Anthropic** : facturation normale de l’API Anthropic.
- **Authentification par la CLI Anthropic Claude / par abonnement dans OpenClaw** : le personnel d’Anthropic
  nous a indiqué que cet usage était de nouveau autorisé ; OpenClaw considère donc la réutilisation de la CLI Claude et
  l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic
  publie une nouvelle politique. Pour Anthropic en production, l’authentification par clé d’API reste
  la voie recommandée la plus sûre.

OpenClaw stocke à la fois l’authentification par clé d’API OpenAI et l’OAuth ChatGPT/Codex sous
l’identifiant canonique de fournisseur `openai`. Les anciens identifiants de profil `openai-codex:*` et
les entrées `auth.order.openai-codex` constituent un état hérité corrigé par
`openclaw doctor --fix` ; utilisez les identifiants de profil `openai:*` et `auth.order.openai` pour
les nouvelles configurations.

Cette page présente :

- le fonctionnement de l’**échange de jetons** OAuth (PKCE)
- l’endroit où les jetons sont **stockés** (et pourquoi)
- la gestion de **plusieurs comptes** (profils + remplacements par session)

Les Plugins de fournisseur qui fournissent leur propre flux OAuth ou par clé d’API passent par le
même point d’entrée :

```bash
openclaw models auth login --provider <id>
```

## Le réceptacle de jetons (raison d’être)

Les fournisseurs OAuth génèrent couramment un nouveau jeton d’actualisation à chaque connexion ou actualisation.
Certains fournisseurs invalident le jeton d’actualisation précédent lorsqu’un nouveau est
émis pour le même utilisateur et la même application. Symptôme concret : vous vous connectez via OpenClaw _et_
via Claude Code / la CLI Codex, puis l’un des deux est déconnecté de manière aléatoire ultérieurement.

Pour limiter ce problème, OpenClaw traite le magasin de profils d’authentification comme un **réceptacle de jetons** :

- l’environnement d’exécution lit les identifiants depuis un emplacement unique par agent
- plusieurs profils peuvent coexister et être acheminés de manière déterministe
- la réutilisation d’une CLI externe dépend du fournisseur : dès qu’OpenClaw possède un profil OAuth
  local pour un fournisseur, le jeton d’actualisation local est canonique. Si ce jeton
  d’actualisation local est rejeté, OpenClaw signale le profil comme nécessitant une
  nouvelle authentification au lieu de revenir aux données de jeton de la CLI externe.
  L’amorçage depuis la CLI Codex est encore plus restreint : il peut uniquement initialiser un profil vide
  de type `openai:default` avant qu’OpenClaw ne possède l’OAuth pour ce
  fournisseur ; ensuite, les actualisations gérées par OpenClaw restent canoniques
- les chemins d’état et de démarrage limitent la découverte des CLI externes à l’ensemble des fournisseurs
  déjà configurés, afin que le magasin de connexion d’une CLI sans rapport ne soit pas interrogé dans une
  configuration à fournisseur unique

## Stockage (emplacement des jetons)

Les secrets sont propres à chaque agent et indexés par le nom logique `auth-profiles.json` (le
magasin sous-jacent est la base de données SQLite de l’agent ; le nom JSON est conservé pour
la compatibilité et l’affichage dans les outils) :

- Profils d’authentification (OAuth + clés d’API + références facultatives au niveau des valeurs) :
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées `api_key` statiques sont supprimées lorsqu’elles sont découvertes)

Fichier hérité réservé à l’importation (toujours pris en charge, mais ce n’est pas le magasin principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans le magasin de profils d’authentification lors de la première utilisation)

Tous les éléments ci-dessus respectent également `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration-reference#auth-storage](/fr/gateway/configuration-reference#auth-storage)

Pour les références statiques aux secrets et le comportement d’activation des instantanés d’exécution, consultez [Gestion des secrets](/fr/gateway/secrets).

Lorsqu’un agent secondaire ne possède aucun profil d’authentification local, OpenClaw utilise un héritage
en lecture depuis le magasin de l’agent par défaut/principal ; il ne clone pas le magasin de l’agent
principal lors de la lecture. Les jetons d’actualisation OAuth sont particulièrement sensibles : les flux de
copie normaux les ignorent par défaut, car certains fournisseurs renouvellent ou invalident les
jetons d’actualisation après leur utilisation. Configurez une connexion OAuth distincte pour un agent lorsqu’il
a besoin d’un compte indépendant.

## Réutilisation de la CLI Anthropic Claude

OpenClaw prend en charge la réutilisation de la CLI Anthropic Claude et `claude -p` comme voie
d’authentification approuvée. Si vous disposez déjà d’une connexion Claude locale sur l’hôte,
l’intégration initiale ou la configuration peut la réutiliser directement. Le jeton de configuration Anthropic reste
disponible comme voie d’authentification par jeton prise en charge, mais OpenClaw privilégie la réutilisation de la CLI Claude
lorsqu’elle est disponible.

<Warning>
La documentation publique de Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans les
limites de l’abonnement Claude, et le personnel d’Anthropic nous a indiqué que l’utilisation de la CLI Claude
de type OpenClaw était de nouveau autorisée. OpenClaw considère donc la réutilisation de la CLI Claude et
l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour consulter la documentation actuelle d’Anthropic sur les offres d’utilisation directe de Claude Code, voir [Utilisation de Claude Code
avec votre offre Pro ou Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Utilisation de Claude Code avec votre offre Team ou Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous recherchez d’autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Offre Qwen Cloud Coding
Plan](/fr/providers/qwen), [Offre MiniMax Coding Plan](/fr/providers/minimax),
et [Offre Z.AI / GLM Coding Plan](/fr/providers/zai).
</Warning>

## Échange OAuth (fonctionnement de la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `openclaw/plugin-sdk/llm.ts` et intégrés aux assistants et aux commandes.

### Jeton de configuration Anthropic

Déroulement du flux :

1. lancez le jeton de configuration Anthropic ou collez un jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic obtenu dans un profil d’authentification
3. la sélection du modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le retour en arrière et le contrôle de l’ordre

### OpenAI Codex (OAuth ChatGPT)

L’OAuth OpenAI Codex est explicitement pris en charge pour une utilisation en dehors de la CLI Codex, notamment dans les flux de travail OpenClaw.

La commande de connexion utilise l’identifiant canonique du fournisseur OpenAI :

```bash
openclaw models auth login --provider openai
```

Utilisez `--profile-id openai:<name>` pour plusieurs comptes OAuth ChatGPT/Codex dans
un même agent. N’utilisez pas `openai-codex:<name>` pour les nouveaux profils. Doctor migre
cet ancien préfixe vers un identifiant de profil `openai:*` sans collision ; exécutez
`openclaw models auth list --provider openai` après la correction avant de copier les
identifiants de profil dans `auth.order` ou `/model ...@<profileId>`.

Déroulement du flux (PKCE) :

1. générez un vérificateur/défi PKCE et une valeur `state` aléatoire
2. ouvrez `https://auth.openai.com/oauth/authorize?...` (portée
   `openid profile email offline_access`)
3. tentez de capturer le rappel sur `http://localhost:1455/auth/callback` (l’hôte de
   rappel est par défaut `localhost` et n’accepte que les hôtes de bouclage ;
   remplacez-le avec `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. si vous pouvez coller un code avant l’arrivée du rappel (ou si vous êtes
   sur un système distant/sans interface graphique et que le rappel ne peut pas se lier), collez plutôt l’URL ou le code de redirection
   ; le collage manuel entre en concurrence avec le rappel du navigateur et le premier à aboutir
   l’emporte
5. échangez le code auprès de `https://auth.openai.com/oauth/token`
6. extrayez `accountId` du jeton d’accès et stockez `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`. À l’exécution :

- si `expires` se situe dans le futur, utilisez le jeton d’accès stocké
- s’il a expiré, actualisez-le (sous verrou de fichier) et remplacez les identifiants stockés
- si un agent secondaire lit un profil OAuth hérité de l’agent principal, l’actualisation
  est réécrite dans le magasin de l’agent principal au lieu de copier le jeton d’actualisation
  dans le magasin de l’agent secondaire
- les identifiants de CLI gérés en externe (CLI Claude, amorçage restreint depuis la CLI Codex ;
  voir [Le réceptacle de jetons](#the-token-sink-why-it-exists)) sont relus au lieu
  d’utiliser un jeton d’actualisation copié. Si une actualisation gérée échoue, OpenClaw
  signale le profil concerné comme nécessitant une nouvelle authentification au lieu de renvoyer
  les données de jeton de la CLI externe.

Le flux d’actualisation est automatique ; vous n’avez généralement pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + acheminement

Deux approches :

### 1) Recommandée : agents distincts

Si vous souhaitez que les contextes « personnel » et « professionnel » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail distincts) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et acheminez les conversations vers l’agent approprié.

### 2) Avancée : plusieurs profils dans un même agent

Le magasin de profils d’authentification prend en charge plusieurs identifiants de profil pour un même fournisseur.
Choisissez lequel utiliser :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement pour la session) :

- `/model Opus@anthropic:work`

Répertoriez les identifiants de profil existants avec :

```bash
openclaw models auth list --provider <id>
```

Documentation associée :

- [Basculement de modèle](/fr/concepts/model-failover) (règles de rotation + délai de récupération)
- [Commandes slash](/fr/tools/slash-commands) (surface de commandes)

## Voir aussi

- [Authentification](/fr/gateway/authentication) - présentation de l’authentification auprès des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) - stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) - clés de configuration de l’authentification
