---
read_when:
    - Vous souhaitez comprendre l’OAuth d’OpenClaw de bout en bout
    - Vous rencontrez des problèmes d'invalidation de jeton / de déconnexion
    - Vous souhaitez utiliser les flux d’authentification Claude CLI ou OAuth
    - Vous souhaitez utiliser plusieurs comptes ou un routage de profils
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T07:19:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw prend en charge l’« authentification par abonnement » via OAuth pour les fournisseurs qui la proposent
(notamment **OpenAI Codex (ChatGPT OAuth)**). Pour Anthropic, la séparation pratique
est désormais :

- **Clé d’API Anthropic** : facturation normale de l’API Anthropic
- **Anthropic Claude CLI / authentification par abonnement dans OpenClaw** : le personnel d’Anthropic
  nous a indiqué que cet usage est de nouveau autorisé

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé d’API est l’approche recommandée la plus sûre.

- comment fonctionne l’**échange de jeton** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend également en charge les **plugins de fournisseur** qui embarquent leurs propres flux OAuth ou par clé d’API.
Exécutez-les via :

```bash
openclaw models auth login --provider <id>
```

## Le collecteur de jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau jeton d’actualisation** pendant les flux de connexion ou d’actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau jeton est émis pour le même utilisateur ou la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux se retrouve aléatoirement « déconnecté » plus tard

Pour limiter cela, OpenClaw traite `auth-profiles.json` comme un **collecteur de jetons** :

- le runtime lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les router de manière déterministe
- la réutilisation de CLI externes dépend du fournisseur : Codex CLI peut initialiser un profil
  `openai-codex:default` vide, mais dès qu’OpenClaw dispose d’un profil OAuth local,
  le jeton d’actualisation local fait autorité ; les autres intégrations peuvent rester
  gérées en externe et relire le stockage d’authentification de leur CLI
- les chemins d’état et de démarrage qui connaissent déjà l’ensemble de fournisseurs configuré limitent
  la découverte de CLI externes à cet ensemble, afin qu’un stockage de connexion CLI sans rapport ne soit pas
  sondé pour une configuration à fournisseur unique

## Stockage (où résident les jetons)

Les secrets sont stockés dans les stockages d’authentification des agents :

- Profils d’authentification (OAuth + clés d’API + références optionnelles au niveau des valeurs) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées `api_key` statiques sont nettoyées lorsqu’elles sont découvertes)

Fichier hérité d’import uniquement (toujours pris en charge, mais ce n’est pas le stockage principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation)

Tous les éléments ci-dessus respectent aussi `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les références de secrets statiques et le comportement d’activation des instantanés runtime, consultez [Gestion des secrets](/fr/gateway/secrets).

Lorsqu’un agent secondaire n’a pas de profil d’authentification local, OpenClaw utilise une
héritance en lecture depuis le stockage de l’agent par défaut/principal. Il ne clone pas le
`auth-profiles.json` de l’agent principal à la lecture. Les jetons d’actualisation OAuth sont particulièrement
sensibles : les flux de copie normaux les ignorent par défaut, car certains fournisseurs font tourner
ou invalident les jetons d’actualisation après utilisation. Configurez une connexion OAuth séparée pour un
agent lorsqu’il a besoin d’un compte indépendant.

## Compatibilité avec les jetons hérités Anthropic

<Warning>
La documentation publique Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans les limites
de l’abonnement Claude, et le personnel d’Anthropic nous a indiqué que l’usage de Claude
CLI de type OpenClaw est de nouveau autorisé. OpenClaw considère donc la réutilisation de Claude CLI et
l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour la documentation actuelle d’Anthropic sur les offres Claude Code directes, consultez [Utiliser Claude Code
avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Utiliser Claude Code avec votre offre Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding
Plan](/fr/providers/qwen), [MiniMax Coding Plan](/fr/providers/minimax),
et [Z.AI / GLM Coding Plan](/fr/providers/glm).
</Warning>

OpenClaw expose également le jeton de configuration Anthropic comme chemin d’authentification par jeton pris en charge, mais il privilégie désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Migration Anthropic Claude CLI

OpenClaw prend de nouveau en charge la réutilisation d’Anthropic Claude CLI. Si vous avez déjà une connexion
Claude locale sur l’hôte, l’intégration/la configuration peut la réutiliser directement.

## Échange OAuth (comment fonctionne la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@mariozechner/pi-ai` et connectés aux assistants/commandes.

### Jeton de configuration Anthropic

Forme du flux :

1. démarrer le jeton de configuration Anthropic ou coller le jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic obtenu dans un profil d’authentification
3. la sélection du modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le retour arrière/le contrôle de l’ordre

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation en dehors de Codex CLI, y compris dans les workflows OpenClaw.

Forme du flux (PKCE) :

1. générer le vérificateur/défi PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. essayer de capturer le rappel sur `http://127.0.0.1:1455/auth/callback`
4. si le rappel ne peut pas se lier (ou si vous êtes à distance/sans interface graphique), coller l’URL/le code de redirection
5. échanger auprès de `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

Au runtime :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- s’il a expiré → actualiser (sous verrou de fichier) et écraser les identifiants stockés
- si un agent secondaire lit un profil OAuth hérité de l’agent principal, l’actualisation
  réécrit dans le stockage de l’agent principal au lieu de copier le jeton d’actualisation dans
  le stockage de l’agent secondaire
- exception : certains identifiants de CLI externes restent gérés en externe ; OpenClaw
  relit ces stockages d’authentification CLI au lieu de consommer des jetons d’actualisation copiés.
  L’initialisation Codex CLI est volontairement plus étroite : elle crée un profil
  `openai-codex:default` vide, puis les actualisations détenues par OpenClaw gardent le profil
  local comme source faisant autorité.

Le flux d’actualisation est automatique ; vous n’avez généralement pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Préféré : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et routez les conversations vers le bon agent.

### 2) Avancé : plusieurs profils dans un seul agent

`auth-profiles.json` prend en charge plusieurs IDs de profil pour le même fournisseur.

Choisissez le profil utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Comment voir quels IDs de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [Bascule de modèle](/fr/concepts/model-failover) (règles de rotation + cooldown)
- [Commandes slash](/fr/tools/slash-commands) (surface de commande)

## Associé

- [Authentification](/fr/gateway/authentication) - vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) - stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) - clés de configuration d’authentification
