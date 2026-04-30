---
read_when:
    - Vous voulez comprendre OAuth OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation de jeton / de déconnexion
    - Vous voulez les flux d’authentification Claude CLI ou OAuth
    - Vous voulez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T07:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw prend en charge « l’authentification par abonnement » via OAuth pour les fournisseurs qui la proposent
(notamment **OpenAI Codex (ChatGPT OAuth)**). Pour Anthropic, la séparation pratique
est désormais :

- **Clé API Anthropic** : facturation normale de l’API Anthropic
- **Anthropic Claude CLI / authentification par abonnement dans OpenClaw** : le personnel d’Anthropic
  nous a indiqué que cet usage est de nouveau autorisé

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé API est l’approche recommandée la plus sûre.

- comment fonctionne l’**échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend également en charge les **plugins de fournisseur** qui fournissent leurs propres flux OAuth ou par clé API.
Exécutez-les via :

```bash
openclaw models auth login --provider <id>
```

## Le réceptacle de jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau jeton d’actualisation** pendant les flux de connexion ou d’actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau est émis pour le même utilisateur/la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux finit plus tard par être « déconnecté » de façon aléatoire

Pour réduire cela, OpenClaw traite `auth-profiles.json` comme un **réceptacle de jetons** :

- le runtime lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les router de façon déterministe
- la réutilisation d’une CLI externe dépend du fournisseur : Codex CLI peut initialiser un profil
  `openai-codex:default` vide, mais une fois qu’OpenClaw possède un profil OAuth local,
  le jeton d’actualisation local fait autorité ; les autres intégrations peuvent rester
  gérées en externe et relire leur magasin d’authentification CLI
- les chemins d’état et de démarrage qui connaissent déjà l’ensemble de fournisseurs configuré limitent
  la découverte de CLI externe à cet ensemble, afin qu’un magasin de connexion CLI sans rapport ne soit pas
  sondé pour une configuration à fournisseur unique

## Stockage (où vivent les jetons)

Les secrets sont stockés dans les magasins d’authentification des agents :

- Profils d’authentification (OAuth + clés API + références optionnelles au niveau des valeurs) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées `api_key` statiques sont supprimées lorsqu’elles sont découvertes)

Fichier hérité uniquement importé (toujours pris en charge, mais ce n’est pas le magasin principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation)

Tous les éléments ci-dessus respectent également `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les références statiques de secrets et le comportement d’activation des instantanés au runtime, consultez [Gestion des secrets](/fr/gateway/secrets).

Lorsqu’un agent secondaire n’a aucun profil d’authentification local, OpenClaw utilise une
héritage par lecture depuis le magasin de l’agent par défaut/principal. Il ne clone pas le fichier
`auth-profiles.json` de l’agent principal à la lecture. Les jetons d’actualisation OAuth sont particulièrement
sensibles : les flux de copie normaux les ignorent par défaut, car certains fournisseurs font tourner
ou invalident les jetons d’actualisation après usage. Configurez une connexion OAuth séparée pour un
agent lorsqu’il a besoin d’un compte indépendant.

## Compatibilité avec les jetons hérités Anthropic

<Warning>
La documentation publique Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans les
limites de l’abonnement Claude, et le personnel d’Anthropic nous a indiqué que l’utilisation de Claude
CLI façon OpenClaw est de nouveau autorisée. OpenClaw considère donc la réutilisation de Claude CLI et
l’utilisation de `claude -p` comme approuvées pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour la documentation actuelle d’Anthropic sur les offres directes Claude Code, consultez [Utiliser Claude Code
avec votre offre Pro ou Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Utiliser Claude Code avec votre offre Team ou Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding
Plan](/fr/providers/qwen), [MiniMax Coding Plan](/fr/providers/minimax),
et [Z.AI / GLM Coding Plan](/fr/providers/glm).
</Warning>

OpenClaw expose également le setup-token Anthropic comme chemin d’authentification par jeton pris en charge, mais il privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Migration Anthropic Claude CLI

OpenClaw prend de nouveau en charge la réutilisation d’Anthropic Claude CLI. Si vous avez déjà une connexion locale
Claude sur l’hôte, l’onboarding/la configuration peut la réutiliser directement.

## Échange OAuth (fonctionnement de la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@mariozechner/pi-ai` et raccordés aux assistants/commandes.

### Setup-token Anthropic

Forme du flux :

1. démarrez le setup-token Anthropic ou collez un jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic résultant dans un profil d’authentification
3. la sélection de modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le contrôle de retour arrière/d’ordre

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation en dehors de Codex CLI, y compris dans les workflows OpenClaw.

Forme du flux (PKCE) :

1. générer un vérificateur/défi PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. tenter de capturer le rappel sur `http://127.0.0.1:1455/auth/callback`
4. si le rappel ne peut pas se lier (ou si vous êtes en environnement distant/sans interface), coller l’URL/le code de redirection
5. effectuer l’échange sur `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

Au runtime :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- si expiré → actualiser (sous verrou de fichier) et écraser les identifiants stockés
- si un agent secondaire lit un profil OAuth hérité de l’agent principal, l’actualisation
  réécrit dans le magasin de l’agent principal au lieu de copier le jeton d’actualisation dans
  le magasin de l’agent secondaire
- exception : certains identifiants CLI externes restent gérés en externe ; OpenClaw
  relit ces magasins d’authentification CLI au lieu de consommer des jetons d’actualisation copiés.
  L’initialisation Codex CLI est volontairement plus étroite : elle crée un profil
  `openai-codex:default` vide, puis les actualisations détenues par OpenClaw gardent le profil
  local comme source d’autorité.

Le flux d’actualisation est automatique ; vous n’avez généralement pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Préféré : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et routez les discussions vers le bon agent.

### 2) Avancé : plusieurs profils dans un seul agent

`auth-profiles.json` prend en charge plusieurs IDs de profil pour le même fournisseur.

Choisissez le profil utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Comment voir les IDs de profil existants :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation connexe :

- [Basculement de modèle](/fr/concepts/model-failover) (règles de rotation + période de récupération)
- [Commandes slash](/fr/tools/slash-commands) (surface de commande)

## Connexe

- [Authentification](/fr/gateway/authentication) — aperçu de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) — stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) — clés de configuration d’authentification
