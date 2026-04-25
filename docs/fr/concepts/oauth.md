---
read_when:
    - Vous voulez comprendre OAuth de bout en bout dans OpenClaw
    - Vous rencontrez des problèmes d’invalidation de jeton / de déconnexion
    - Vous voulez des flux d’authentification Claude CLI ou OAuth
    - Vous voulez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw prend en charge l’« authentification par abonnement » via OAuth pour les fournisseurs qui la proposent
(notamment **OpenAI Codex (ChatGPT OAuth)**). Pour Anthropic, la répartition pratique
est désormais la suivante :

- **Clé API Anthropic** : facturation API Anthropic normale
- **Anthropic Claude CLI / authentification par abonnement dans OpenClaw** : le personnel d’Anthropic
  nous a indiqué que cet usage est de nouveau autorisé

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé API reste la voie recommandée et la plus sûre.

- comment fonctionne l’**échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend aussi en charge des **plugins de fournisseur** qui embarquent leurs propres flux OAuth ou API‑key.
Exécutez-les via :

```bash
openclaw models auth login --provider <id>
```

## Le puits de jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau jeton d’actualisation** lors des flux de connexion/actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau est émis pour le même utilisateur/la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux se retrouve ensuite « déconnecté » de manière aléatoire

Pour réduire cela, OpenClaw traite `auth-profiles.json` comme un **puits de jetons** :

- le runtime lit les identifiants depuis **un seul emplacement**
- nous pouvons conserver plusieurs profils et les router de manière déterministe
- la réutilisation de CLI externes dépend du fournisseur : Codex CLI peut initialiser un profil
  `openai-codex:default` vide, mais une fois qu’OpenClaw possède un profil OAuth local,
  le jeton d’actualisation local devient canonique ; d’autres intégrations peuvent rester
  gérées en externe et relire leur stockage d’authentification CLI

## Stockage (où vivent les jetons)

Les secrets sont stockés **par agent** :

- Profils d’authentification (OAuth + clés API + références facultatives au niveau des valeurs) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes)

Fichier hérité d’import uniquement (toujours pris en charge, mais ce n’est pas le stockage principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation)

Tout ce qui précède respecte aussi `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les références statiques de secrets et le comportement d’activation d’instantané à l’exécution, voir [Gestion des secrets](/fr/gateway/secrets).

## Compatibilité des jetons Anthropic hérités

<Warning>
La documentation publique de Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans les
limites d’abonnement Claude, et le personnel d’Anthropic nous a indiqué que l’usage de type Claude
CLI dans OpenClaw est de nouveau autorisé. OpenClaw traite donc la réutilisation de Claude CLI et
l’usage de `claude -p` comme autorisés pour cette intégration sauf si Anthropic
publie une nouvelle politique.

Pour la documentation actuelle d’Anthropic sur les offres directes Claude Code, voir [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, voir [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding
Plan](/fr/providers/qwen), [MiniMax Coding Plan](/fr/providers/minimax),
et [Z.AI / GLM Coding Plan](/fr/providers/glm).
</Warning>

OpenClaw expose aussi `setup-token` Anthropic comme chemin d’authentification par jeton pris en charge, mais il préfère désormais la réutilisation de Claude CLI et `claude -p` lorsque disponibles.

## Migration Anthropic Claude CLI

OpenClaw prend de nouveau en charge la réutilisation d’Anthropic Claude CLI. Si vous avez déjà une connexion
Claude locale sur l’hôte, l’onboarding/configuration peut la réutiliser directement.

## Échange OAuth (comment fonctionne la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@mariozechner/pi-ai` et branchés sur les assistants/commandes.

### Anthropic setup-token

Forme du flux :

1. démarrer `setup-token` Anthropic ou le collage de jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic résultant dans un profil d’authentification
3. la sélection du modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour les retours arrière/le contrôle de l’ordre

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation en dehors de Codex CLI, y compris dans les workflows OpenClaw.

Forme du flux (PKCE) :

1. générer le vérificateur/défi PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. tenter de capturer le callback sur `http://127.0.0.1:1455/auth/callback`
4. si le callback ne peut pas se lier (ou si vous êtes en distant/headless), coller l’URL/le code de redirection
5. échanger sur `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

À l’exécution :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- s’il est expiré → l’actualiser (sous verrou de fichier) et écraser les identifiants stockés
- exception : certains identifiants de CLI externes restent gérés en externe ; OpenClaw
  relit ces stockages d’authentification CLI au lieu de consommer des jetons d’actualisation copiés.
  L’initialisation depuis Codex CLI est volontairement plus limitée : elle amorce un profil
  `openai-codex:default` vide, puis les actualisations possédées par OpenClaw maintiennent le profil local comme canonique.

Le flux d’actualisation est automatique ; en général, vous n’avez pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Préféré : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Ensuite, configurez l’authentification par agent (assistant) et routez les discussions vers le bon agent.

### 2) Avancé : plusieurs profils dans un même agent

`auth-profiles.json` prend en charge plusieurs identifiants de profil pour le même fournisseur.

Choisissez quel profil est utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Comment voir quels identifiants de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [Basculement de modèle](/fr/concepts/model-failover) (règles de rotation + cooldown)
- [Commandes slash](/fr/tools/slash-commands) (surface de commande)

## Voir aussi

- [Authentification](/fr/gateway/authentication) — vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) — stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) — clés de configuration d’authentification
