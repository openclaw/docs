---
read_when:
    - Vous voulez comprendre OAuth d’OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation de jetons / de déconnexion
    - Vous voulez utiliser les flux d’authentification Claude CLI ou OAuth
    - Vous souhaitez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw prend en charge l’« authentification par abonnement » via OAuth pour les fournisseurs qui la proposent
(notamment **OpenAI Codex (ChatGPT OAuth)**). Pour Anthropic, la séparation pratique
est désormais :

- **Clé API Anthropic** : facturation normale de l’API Anthropic
- **Anthropic Claude CLI / authentification par abonnement dans OpenClaw** : le personnel d’Anthropic
  nous a indiqué que cet usage est de nouveau autorisé

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé API est le chemin recommandé le plus sûr.

- comment fonctionne l’**échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend également en charge les **Plugins de fournisseur** qui livrent leurs propres flux OAuth ou par clé API.
Exécutez-les avec :

```bash
openclaw models auth login --provider <id>
```

## Le réceptacle de jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau jeton d’actualisation** pendant les flux de connexion ou d’actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau est émis pour le même utilisateur ou la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un d’eux finit aléatoirement par être « déconnecté » plus tard

Pour réduire ce risque, OpenClaw traite `auth-profiles.json` comme un **réceptacle de jetons** :

- le runtime lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les router de façon déterministe
- la réutilisation d’un CLI externe est propre à chaque fournisseur : Codex CLI peut amorcer un profil
  `openai-codex:default` vide, mais dès qu’OpenClaw dispose d’un profil OAuth local,
  le jeton d’actualisation local fait autorité ; les autres intégrations peuvent rester
  gérées en externe et relire le magasin d’authentification de leur CLI
- les chemins de statut et de démarrage qui connaissent déjà l’ensemble des fournisseurs configurés limitent
  la découverte de CLI externe à cet ensemble, afin qu’un magasin de connexion CLI sans rapport ne soit pas
  sondé pour une configuration à fournisseur unique

## Stockage (où se trouvent les jetons)

Les secrets sont stockés dans les magasins d’authentification des agents :

- Profils d’authentification (OAuth + clés API + références facultatives au niveau des valeurs) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées `api_key` statiques sont purgées lorsqu’elles sont détectées)

Fichier hérité d’importation uniquement (toujours pris en charge, mais ce n’est pas le magasin principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation)

Tous les éléments ci-dessus respectent également `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les références statiques à des secrets et le comportement d’activation des instantanés au runtime, consultez [Gestion des secrets](/fr/gateway/secrets).

Lorsqu’un agent secondaire n’a pas de profil d’authentification local, OpenClaw utilise une
héritage en lecture traversante depuis le magasin de l’agent par défaut/principal. Il ne clone pas le fichier
`auth-profiles.json` de l’agent principal à la lecture. Les jetons d’actualisation OAuth sont particulièrement
sensibles : les flux de copie normaux les ignorent par défaut, car certains fournisseurs les font tourner
ou les invalident après utilisation. Configurez une connexion OAuth distincte pour un agent
lorsqu’il a besoin d’un compte indépendant.

## Compatibilité avec les jetons hérités Anthropic

<Warning>
La documentation publique Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans les
limites de l’abonnement Claude, et le personnel d’Anthropic nous a indiqué que l’usage Claude
CLI de type OpenClaw est de nouveau autorisé. OpenClaw considère donc la réutilisation de Claude CLI et
l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour la documentation actuelle d’Anthropic sur les offres Claude Code directes, consultez [Utiliser Claude Code
avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Utiliser Claude Code avec votre offre Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Offre Qwen Cloud Coding
Plan](/fr/providers/qwen), [Offre MiniMax Coding Plan](/fr/providers/minimax),
et [Offre Z.AI / GLM Coding Plan](/fr/providers/glm).
</Warning>

OpenClaw expose également le jeton de configuration Anthropic comme chemin d’authentification par jeton pris en charge, mais il privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Migration Anthropic Claude CLI

OpenClaw prend de nouveau en charge la réutilisation d’Anthropic Claude CLI. Si vous avez déjà une connexion
Claude locale sur l’hôte, l’onboarding/la configuration peut la réutiliser directement.

## Échange OAuth (fonctionnement de la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@earendil-works/pi-ai` et raccordés aux assistants/commandes.

### Jeton de configuration Anthropic

Forme du flux :

1. démarrer le jeton de configuration Anthropic ou coller le jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic obtenu dans un profil d’authentification
3. la sélection de modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le retour arrière/le contrôle de l’ordre

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation en dehors de Codex CLI, y compris dans les workflows OpenClaw.

Forme du flux (PKCE) :

1. générer un vérificateur/défi PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. essayer de capturer le rappel sur `http://127.0.0.1:1455/auth/callback`
4. si le rappel ne peut pas se lier (ou si vous êtes à distance/sans interface), coller l’URL de redirection/le code
5. échanger auprès de `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

Au runtime :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- si expiré → actualiser (sous verrou de fichier) et remplacer les identifiants stockés
- si un agent secondaire lit un profil OAuth hérité de l’agent principal, l’actualisation
  réécrit dans le magasin de l’agent principal au lieu de copier le jeton d’actualisation dans
  le magasin de l’agent secondaire
- exception : certains identifiants de CLI externes restent gérés en externe ; OpenClaw
  relit ces magasins d’authentification CLI au lieu de consommer des jetons d’actualisation copiés.
  L’amorçage de Codex CLI est volontairement plus limité : il initialise un profil
  `openai-codex:default` vide, puis les actualisations gérées par OpenClaw gardent le profil
  local comme référence canonique.

Le flux d’actualisation est automatique ; vous n’avez généralement pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Recommandé : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et routez les chats vers le bon agent.

### 2) Avancé : plusieurs profils dans un seul agent

`auth-profiles.json` prend en charge plusieurs ID de profil pour le même fournisseur.

Choisir le profil utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Comment voir quels ID de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [Basculement de modèle](/fr/concepts/model-failover) (rotation + règles de délai de récupération)
- [Commandes Slash](/fr/tools/slash-commands) (surface de commande)

## Associé

- [Authentification](/fr/gateway/authentication) - vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) - stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) - clés de configuration d’authentification
