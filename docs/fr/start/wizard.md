---
read_when:
    - Exécuter ou configurer l’intégration CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Intégration CLI : configuration guidée du Gateway, de l’espace de travail, des canaux et des Skills'
title: Prise en main (CLI)
x-i18n:
    generated_at: "2026-04-30T07:49:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding est la méthode **recommandée** pour configurer OpenClaw sur macOS,
Linux ou Windows (via WSL2 ; fortement recommandé).
Elle configure un Gateway local ou une connexion à un Gateway distant, ainsi que les canaux, les skills
et les paramètres par défaut de l’espace de travail dans un seul parcours guidé.

```bash
openclaw onboard
```

<Info>
Première discussion la plus rapide : ouvrez la Control UI (aucune configuration de canal requise). Exécutez
`openclaw dashboard` et discutez dans le navigateur. Docs : [Tableau de bord](/fr/web/dashboard).
</Info>

Pour reconfigurer plus tard :

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Pour les scripts, utilisez `--non-interactive`.
</Note>

<Tip>
CLI onboarding inclut une étape de recherche web où vous pouvez choisir un fournisseur
comme Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Certains fournisseurs nécessitent une
clé API, tandis que d’autres fonctionnent sans clé. Vous pouvez aussi configurer cela plus tard avec
`openclaw configure --section web`. Docs : [Outils web](/fr/tools/web).
</Tip>

## Démarrage rapide ou avancé

L’onboarding commence par **Démarrage rapide** (valeurs par défaut) ou **Avancé** (contrôle complet).

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Gateway local (loopback)
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway **18789**
    - Authentification du Gateway **Token** (généré automatiquement, même en loopback)
    - Politique d’outils par défaut pour les nouvelles configurations locales : `tools.profile: "coding"` (le profil explicite existant est conservé)
    - Valeur par défaut d’isolation des messages privés : l’onboarding local écrit `session.dmScope: "per-channel-peer"` lorsqu’elle n’est pas définie. Détails : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale **désactivée**
    - Les messages privés Telegram + WhatsApp utilisent par défaut une **liste d’autorisation** (votre numéro de téléphone vous sera demandé)

  </Tab>
  <Tab title="Advanced (full control)">
    - Expose chaque étape (mode, espace de travail, gateway, canaux, daemon, skills).

  </Tab>
</Tabs>

## Ce que l’onboarding configure

Le **mode local (par défaut)** vous guide à travers ces étapes :

1. **Modèle/Auth** — choisissez n’importe quel fournisseur/flux d’authentification pris en charge (clé API, OAuth ou authentification manuelle propre au fournisseur), y compris Custom Provider
   (compatible OpenAI, compatible Anthropic ou auto-détection Unknown). Choisissez un modèle par défaut.
   Note de sécurité : si cet agent exécutera des outils ou traitera du contenu webhook/hooks, privilégiez le modèle de dernière génération le plus puissant disponible et gardez une politique d’outils stricte. Les niveaux plus faibles/anciens sont plus faciles à prompt-injecter.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références adossées à l’environnement dans les profils d’authentification au lieu de valeurs de clé API en clair.
   En mode non interactif `ref`, la variable d’environnement du fournisseur doit être définie ; passer des options de clé en ligne sans cette variable d’environnement échoue immédiatement.
   Dans les exécutions interactives, choisir le mode de référence de secret vous permet de pointer soit vers une variable d’environnement, soit vers une référence de fournisseur configurée (`file` ou `exec`), avec une validation préliminaire rapide avant l’enregistrement.
   Pour Anthropic, l’onboarding/configuration interactif propose **Anthropic Claude CLI** comme chemin local privilégié et **Anthropic API key** comme chemin de production recommandé. Anthropic setup-token reste aussi disponible comme chemin d’authentification par jeton pris en charge.
2. **Espace de travail** — emplacement des fichiers d’agent (par défaut `~/.openclaw/workspace`). Initialise les fichiers de démarrage.
3. **Gateway** — port, adresse d’écoute, mode d’authentification, exposition Tailscale.
   En mode jeton interactif, choisissez le stockage de jeton en clair par défaut ou optez pour SecretRef.
   Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** — canaux de discussion intégrés et groupés comme BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, et plus encore.
5. **Daemon** — installe un LaunchAgent (macOS), une unité utilisateur systemd (Linux/WSL2) ou une tâche planifiée Windows native avec solution de repli par dossier de démarrage propre à l’utilisateur.
   Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service superviseur.
   Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’installation du daemon est bloquée avec des indications actionnables.
   Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
6. **Vérification de santé** — démarre le Gateway et vérifie qu’il est en cours d’exécution.
7. **Skills** — installe les skills recommandées et les dépendances facultatives.

<Note>
Relancer l’onboarding n’efface **rien**, sauf si vous choisissez explicitement **Réinitialiser** (ou passez `--reset`).
CLI `--reset` cible par défaut la configuration, les identifiants et les sessions ; utilisez `--reset-scope full` pour inclure l’espace de travail.
Si la configuration est invalide ou contient des clés héritées, l’onboarding vous demande d’exécuter d’abord `openclaw doctor`.
</Note>

Le **mode distant** configure uniquement le client local pour se connecter à un Gateway ailleurs.
Il n’installe ni ne modifie **rien** sur l’hôte distant.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent séparé avec son propre espace de travail,
ses sessions et ses profils d’authentification. L’exécution sans `--workspace` lance l’onboarding.

Ce qu’il définit :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notes :

- Les espaces de travail par défaut suivent `~/.openclaw/workspace-<agentId>`.
- Ajoutez `bindings` pour acheminer les messages entrants (l’onboarding peut le faire).
- Options non interactives : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour des explications détaillées étape par étape et les sorties de configuration, consultez
[Référence de configuration CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation CLI](/fr/start/wizard-cli-automation).
Pour la référence technique plus approfondie, y compris les détails RPC, consultez
[Référence d’onboarding](/fr/reference/wizard).

## Docs associées

- Référence des commandes CLI : [`openclaw onboard`](/fr/cli/onboard)
- Vue d’ensemble de l’onboarding : [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview)
- Onboarding de l’app macOS : [Onboarding](/fr/start/onboarding)
- Rituel de premier démarrage de l’agent : [Initialisation de l’agent](/fr/start/bootstrapping)
