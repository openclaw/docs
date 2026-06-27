---
read_when:
    - Vous voulez comprendre l’OAuth d’OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation de jeton / de déconnexion
    - Vous voulez les flux d'authentification Claude CLI ou OAuth
    - Vous voulez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multicompte'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:25:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
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
OpenClaw.

OpenClaw stocke à la fois l’authentification par clé API OpenAI et l’OAuth ChatGPT/Codex sous
l’id de fournisseur canonique `openai`. Les anciens ids de profil `openai-codex:*` et
les entrées `auth.order.openai-codex` sont un état hérité réparé par
`openclaw doctor --fix` ; utilisez les ids de profil `openai:*` et `auth.order.openai` pour
les nouvelles configurations.

Pour Anthropic en production, l’authentification par clé API est la voie recommandée la plus sûre.

Cette page explique :

- le fonctionnement de l’**échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend également en charge des **Plugins de fournisseur** qui livrent leurs propres flux
OAuth ou par clé API. Exécutez-les via :

```bash
openclaw models auth login --provider <id>
```

## Le puits de jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau jeton d’actualisation** pendant les flux de connexion/actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau est émis pour le même utilisateur/la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux se retrouve aléatoirement « déconnecté » plus tard

Pour réduire cela, OpenClaw traite `auth-profiles.json` comme un **puits de jetons** :

- le runtime lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les acheminer de façon déterministe
- la réutilisation de CLI externes dépend du fournisseur : Codex CLI peut initialiser un profil
  `openai:default` vide, mais une fois qu’OpenClaw dispose d’un profil OAuth local,
  le jeton d’actualisation local est canonique. Si ce jeton d’actualisation local est rejeté,
  OpenClaw peut utiliser un jeton Codex CLI utilisable du même compte comme solution de repli
  uniquement au runtime ; les autres intégrations peuvent rester gérées en externe et relire leur
  magasin d’authentification CLI
- les chemins d’état et de démarrage qui connaissent déjà l’ensemble de fournisseurs configuré limitent
  la découverte CLI externe à cet ensemble, afin qu’un magasin de connexion CLI sans rapport ne soit pas
  sondé pour une configuration à fournisseur unique

## Stockage (où vivent les jetons)

Les secrets sont stockés dans les magasins d’authentification des agents :

- Profils d’authentification (OAuth + clés API + refs optionnelles au niveau valeur) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées `api_key` statiques sont supprimées lorsqu’elles sont découvertes)

Fichier hérité uniquement pour l’import (toujours pris en charge, mais ce n’est pas le magasin principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation)

Tout ce qui précède respecte aussi `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les refs de secrets statiques et le comportement d’activation des instantanés runtime, consultez [Gestion des secrets](/fr/gateway/secrets).

Lorsqu’un agent secondaire n’a pas de profil d’authentification local, OpenClaw utilise une
héritage en lecture directe depuis le magasin de l’agent par défaut/principal. Il ne clone pas le
`auth-profiles.json` de l’agent principal à la lecture. Les jetons d’actualisation OAuth sont particulièrement
sensibles : les flux de copie normaux les ignorent par défaut, car certains fournisseurs font tourner
ou invalident les jetons d’actualisation après utilisation. Configurez une connexion OAuth séparée pour un
agent lorsqu’il a besoin d’un compte indépendant.

## Compatibilité des jetons hérités Anthropic

<Warning>
La documentation publique Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans
les limites des abonnements Claude, et le personnel d’Anthropic nous a indiqué que l’usage de Claude
CLI de type OpenClaw est de nouveau autorisé. OpenClaw considère donc la réutilisation de Claude CLI et
l’usage de `claude -p` comme approuvés pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour la documentation actuelle d’Anthropic sur les offres directes Claude Code, consultez [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding
Plan](/fr/providers/qwen), [MiniMax Coding Plan](/fr/providers/minimax),
et [Z.AI / GLM Coding Plan](/fr/providers/zai).
</Warning>

OpenClaw expose aussi le setup-token Anthropic comme chemin d’authentification par jeton pris en charge, mais il préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’elles sont disponibles.

## Migration Anthropic Claude CLI

OpenClaw prend de nouveau en charge la réutilisation d’Anthropic Claude CLI. Si vous avez déjà une connexion
Claude locale sur l’hôte, l’onboarding/la configuration peut la réutiliser directement.

## Échange OAuth (fonctionnement de la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `openclaw/plugin-sdk/llm` et raccordés aux assistants/commandes.

### setup-token Anthropic

Forme du flux :

1. démarrez un setup-token Anthropic ou collez un jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic obtenu dans un profil d’authentification
3. la sélection de modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le contrôle du retour arrière/de l’ordre

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation hors de Codex CLI, y compris dans les workflows OpenClaw.

La commande de connexion utilise toujours l’id de fournisseur OpenAI canonique :

```bash
openclaw models auth login --provider openai
```

Utilisez `--profile-id openai:<name>` pour plusieurs comptes ChatGPT/Codex OAuth dans
un même agent. N’utilisez pas `openai-codex:<name>` pour les nouveaux profils. Doctor migre
cet ancien préfixe vers un id de profil `openai:*` sans collision ; exécutez
`openclaw models auth list --provider openai` après réparation avant de copier
les ids de profil dans `auth.order` ou `/model ...@<profileId>`.

Forme du flux (PKCE) :

1. générer un vérificateur/challenge PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. essayer de capturer le rappel sur `http://127.0.0.1:1455/auth/callback`
4. si le rappel ne peut pas se lier (ou si vous êtes à distance/sans interface), coller l’URL/le code de redirection
5. échanger auprès de `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

Au runtime :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- si expiré → actualiser (sous verrou de fichier) et remplacer les identifiants stockés
- si un agent secondaire lit un profil OAuth hérité de l’agent principal, l’actualisation
  réécrit dans le magasin de l’agent principal au lieu de copier le jeton d’actualisation dans
  le magasin de l’agent secondaire
- exception : certains identifiants CLI externes restent gérés en externe ; OpenClaw
  relit ces magasins d’authentification CLI au lieu de dépenser des jetons d’actualisation copiés.
  L’initialisation Codex CLI est volontairement plus étroite : elle amorce un profil
  `openai:default` vide, puis les actualisations gérées par OpenClaw gardent le profil
  local canonique. Si l’actualisation Codex locale échoue et que Codex CLI dispose d’un
  jeton utilisable pour le même compte, OpenClaw peut utiliser ce jeton pour la requête
  runtime actuelle sans le réécrire dans `auth-profiles.json`.

Le flux d’actualisation est automatique ; vous n’avez généralement pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Préféré : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et acheminez les discussions vers le bon agent.

### 2) Avancé : plusieurs profils dans un agent

`auth-profiles.json` prend en charge plusieurs ids de profil pour le même fournisseur.

Choisir le profil utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Comment voir quels ids de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [Basculement de modèle](/fr/concepts/model-failover) (règles de rotation + refroidissement)
- [Commandes slash](/fr/tools/slash-commands) (surface de commande)

## Associé

- [Authentification](/fr/gateway/authentication) - vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) - stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) - clés de configuration d’authentification
