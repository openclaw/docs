---
read_when:
    - Exécution ou configuration de l’intégration CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Prise en main de la CLI : configuration guidée du Gateway, de l’espace de travail, des canaux et des Skills'
title: Intégration (CLI)
x-i18n:
    generated_at: "2026-05-06T07:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding est la méthode **recommandée** pour configurer OpenClaw sur macOS,
Linux ou Windows (via WSL2 ; fortement recommandé).
Elle configure un Gateway local ou une connexion à un Gateway distant, ainsi que les canaux, les Skills
et les paramètres par défaut de l’espace de travail dans un seul flux guidé.

```bash
openclaw onboard
```

<Info>
Première conversation la plus rapide : ouvrez l’interface de contrôle (aucune configuration de canal nécessaire). Exécutez
`openclaw dashboard` et discutez dans le navigateur. Documentation : [Tableau de bord](/fr/web/dashboard).
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
L’onboarding CLI inclut une étape de recherche web où vous pouvez choisir un fournisseur
comme Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Certains fournisseurs exigent une
clé API, tandis que d’autres n’en nécessitent pas. Vous pouvez aussi configurer cela plus tard avec
`openclaw configure --section web`. Documentation : [Outils web](/fr/tools/web).
</Tip>

## QuickStart ou Avancé

L’onboarding commence par **QuickStart** (paramètres par défaut) ou **Avancé** (contrôle complet).

<Tabs>
  <Tab title="QuickStart (paramètres par défaut)">
    - Gateway local (loopback)
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway **18789**
    - Authentification du Gateway **Token** (généré automatiquement, même sur loopback)
    - Politique d’outils par défaut pour les nouvelles configurations locales : `tools.profile: "coding"` (le profil explicite existant est conservé)
    - Isolation des DM par défaut : l’onboarding local écrit `session.dmScope: "per-channel-peer"` lorsqu’il n’est pas défini. Détails : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale **Désactivée**
    - Les DM Telegram et WhatsApp utilisent par défaut une **liste d’autorisation** (votre numéro de téléphone vous sera demandé)

  </Tab>
  <Tab title="Avancé (contrôle complet)">
    - Affiche chaque étape (mode, espace de travail, Gateway, canaux, daemon, Skills).

  </Tab>
</Tabs>

## Ce que l’onboarding configure

Le **mode local (par défaut)** vous guide à travers ces étapes :

1. **Modèle/authentification** — choisissez n’importe quel fournisseur/flux d’authentification pris en charge (clé API, OAuth ou authentification manuelle propre au fournisseur), y compris Custom Provider
   (compatible OpenAI, compatible Anthropic ou auto-détection inconnue). Choisissez un modèle par défaut.
   Note de sécurité : si cet agent exécutera des outils ou traitera du contenu de Webhook/hooks, privilégiez le modèle de dernière génération le plus puissant disponible et gardez une politique d’outils stricte. Les niveaux plus faibles/anciens sont plus faciles à injecter par prompt.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références basées sur l’environnement dans les profils d’authentification au lieu de valeurs de clé API en clair.
   En mode non interactif `ref`, la variable d’environnement du fournisseur doit être définie ; transmettre des flags de clé en ligne sans cette variable d’environnement échoue immédiatement.
   Lors des exécutions interactives, choisir le mode de référence secrète vous permet de pointer soit vers une variable d’environnement, soit vers une référence de fournisseur configurée (`file` ou `exec`), avec une validation préliminaire rapide avant l’enregistrement.
   Pour Anthropic, l’onboarding/la configuration interactive propose **Anthropic Claude CLI** comme chemin local préféré et **Anthropic API key** comme chemin de production recommandé. Anthropic setup-token reste également disponible comme chemin d’authentification par token pris en charge.
2. **Espace de travail** — emplacement des fichiers de l’agent (par défaut `~/.openclaw/workspace`). Initialise les fichiers de démarrage.
3. **Gateway** — port, adresse de liaison, mode d’authentification, exposition Tailscale.
   En mode interactif par token, choisissez le stockage du token en clair par défaut ou optez pour SecretRef.
   Chemin SecretRef de token non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** — canaux de discussion intégrés et inclus comme BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, et d’autres.
5. **Daemon** — installe un LaunchAgent (macOS), une unité utilisateur systemd (Linux/WSL2) ou une tâche planifiée Windows native avec repli par dossier de démarrage propre à l’utilisateur.
   Si l’authentification par token exige un token et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas le token résolu dans les métadonnées d’environnement du service superviseur.
   Si l’authentification par token exige un token et que le SecretRef de token configuré n’est pas résolu, l’installation du daemon est bloquée avec des indications exploitables.
   Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
6. **Vérification de santé** — démarre le Gateway et vérifie qu’il fonctionne.
7. **Skills** — installe les Skills recommandées et les dépendances facultatives.

<Note>
Relancer l’onboarding n’efface **rien** sauf si vous choisissez explicitement **Réinitialiser** (ou passez `--reset`).
CLI `--reset` cible par défaut la configuration, les identifiants et les sessions ; utilisez `--reset-scope full` pour inclure l’espace de travail.
Si la configuration est invalide ou contient d’anciennes clés, l’onboarding vous demande d’exécuter d’abord `openclaw doctor`.
</Note>

Le **mode distant** configure uniquement le client local pour se connecter à un Gateway situé ailleurs.
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
- Ajoutez `bindings` pour router les messages entrants (l’onboarding peut le faire).
- Flags non interactifs : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour des explications détaillées étape par étape et les sorties de configuration, consultez
[Référence de configuration CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation CLI](/fr/start/wizard-cli-automation).
Pour la référence technique plus approfondie, y compris les détails RPC, consultez
[Référence d’onboarding](/fr/reference/wizard).

## Documentation connexe

- Référence de commande CLI : [`openclaw onboard`](/fr/cli/onboard)
- Vue d’ensemble de l’onboarding : [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview)
- Onboarding de l’app macOS : [Onboarding](/fr/start/onboarding)
- Rituel de premier lancement de l’agent : [Amorçage de l’agent](/fr/start/bootstrapping)
