---
read_when:
    - Exécution ou configuration de l’onboarding CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Onboarding CLI : configuration guidée du gateway, de l’espace de travail, des canaux et des Skills'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-24T07:34:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

L’onboarding CLI est la méthode **recommandée** pour configurer OpenClaw sur macOS,
Linux ou Windows (via WSL2, fortement recommandé).
Il configure un Gateway local ou une connexion à un Gateway distant, ainsi que les canaux, les Skills
et les valeurs par défaut de l’espace de travail dans un seul flux guidé.

```bash
openclaw onboard
```

<Info>
Premier chat le plus rapide : ouvrez l’interface de contrôle (aucune configuration de canal nécessaire). Exécutez
`openclaw dashboard` et discutez dans le navigateur. Documentation : [Dashboard](/fr/web/dashboard).
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
Ollama Web Search, Perplexity, SearXNG ou Tavily. Certains fournisseurs nécessitent une
clé API, d’autres sont sans clé. Vous pouvez aussi configurer cela plus tard avec
`openclaw configure --section web`. Documentation : [Outils web](/fr/tools/web).
</Tip>

## QuickStart vs avancé

L’onboarding commence avec **QuickStart** (valeurs par défaut) vs **Advanced** (contrôle total).

<Tabs>
  <Tab title="QuickStart (valeurs par défaut)">
    - Gateway local (loopback)
    - Espace de travail par défaut (ou espace de travail existant)
    - Port Gateway **18789**
    - Authentification Gateway **Token** (généré automatiquement, même sur loopback)
    - Politique d’outils par défaut pour les nouvelles configurations locales : `tools.profile: "coding"` (le profil explicite existant est conservé)
    - Valeur par défaut d’isolation DM : l’onboarding local écrit `session.dmScope: "per-channel-peer"` lorsqu’il n’est pas défini. Détails : [Référence CLI Setup](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale **désactivée**
    - Les DM Telegram + WhatsApp sont par défaut en **allowlist** (on vous demandera votre numéro de téléphone)

  </Tab>
  <Tab title="Advanced (contrôle total)">
    - Expose chaque étape (mode, espace de travail, gateway, canaux, daemon, Skills).

  </Tab>
</Tabs>

## Ce que configure l’onboarding

**Le mode local (par défaut)** vous guide à travers ces étapes :

1. **Modèle/Auth** — choisissez n’importe quel flux fournisseur/authentification pris en charge (clé API, OAuth ou authentification manuelle spécifique au fournisseur), y compris Custom Provider
   (compatible OpenAI, compatible Anthropic ou détection automatique Unknown). Choisissez un modèle par défaut.
   Remarque de sécurité : si cet agent exécute des outils ou traite du contenu webhook/hooks, privilégiez le modèle le plus puissant et de dernière génération disponible et gardez une politique d’outils stricte. Les niveaux plus faibles/anciens sont plus faciles à atteindre par injection de prompt.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références adossées à l’environnement dans les profils d’authentification au lieu de valeurs de clé API en clair.
   En mode `ref` non interactif, la variable d’environnement du fournisseur doit être définie ; passer des indicateurs de clé inline sans cette variable d’environnement échoue immédiatement.
   Dans les exécutions interactives, choisir le mode de référence secrète vous permet de pointer soit vers une variable d’environnement, soit vers une référence fournisseur configurée (`file` ou `exec`), avec une validation préalable rapide avant enregistrement.
   Pour Anthropic, l’onboarding/configure interactif propose **Anthropic Claude CLI** comme chemin local préféré et **Anthropic API key** comme chemin de production recommandé. Le setup-token Anthropic reste aussi disponible comme chemin d’authentification par jeton pris en charge.
2. **Workspace** — emplacement des fichiers de l’agent (par défaut `~/.openclaw/workspace`). Initialise les fichiers d’initialisation.
3. **Gateway** — port, adresse de bind, mode d’authentification, exposition Tailscale.
   En mode interactif token, choisissez le stockage en clair par défaut du jeton ou activez SecretRef.
   Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — canaux de chat intégrés et groupés tels que BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, et plus encore.
5. **Daemon** — installe un LaunchAgent (macOS), une unité systemd utilisateur (Linux/WSL2), ou une tâche planifiée Windows native avec repli par dossier Startup au niveau utilisateur.
   Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service superviseur.
   Si l’authentification par jeton exige un jeton et que le SecretRef configuré du jeton n’est pas résolu, l’installation du daemon est bloquée avec des indications concrètes.
   Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
6. **Contrôle de santé** — démarre le Gateway et vérifie qu’il fonctionne.
7. **Skills** — installe les Skills recommandés et les dépendances facultatives.

<Note>
Relancer l’onboarding **n’efface rien** sauf si vous choisissez explicitement **Reset** (ou passez `--reset`).
Le `--reset` CLI vise par défaut la configuration, les identifiants et les sessions ; utilisez `--reset-scope full` pour inclure l’espace de travail.
Si la configuration est invalide ou contient des clés héritées, l’onboarding vous demande d’abord d’exécuter `openclaw doctor`.
</Note>

**Le mode distant** configure uniquement le client local pour se connecter à un Gateway situé ailleurs.
Il n’installe ni ne modifie rien sur l’hôte distant.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent séparé avec son propre espace de travail,
ses sessions et ses profils d’authentification. L’exécution sans `--workspace` lance l’onboarding.

Ce que cela définit :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Remarques :

- Les espaces de travail par défaut suivent `~/.openclaw/workspace-<agentId>`.
- Ajoutez des `bindings` pour router les messages entrants (l’onboarding peut le faire).
- Indicateurs non interactifs : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour des décompositions détaillées étape par étape et les sorties de configuration, consultez
[Référence CLI Setup](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [CLI Automation](/fr/start/wizard-cli-automation).
Pour la référence technique approfondie, y compris les détails RPC, consultez
[Onboarding Reference](/fr/reference/wizard).

## Documentation associée

- Référence de commande CLI : [`openclaw onboard`](/fr/cli/onboard)
- Vue d’ensemble de l’onboarding : [Onboarding Overview](/fr/start/onboarding-overview)
- Onboarding de l’application macOS : [Onboarding](/fr/start/onboarding)
- Rituel de premier lancement de l’agent : [Agent Bootstrapping](/fr/start/bootstrapping)
