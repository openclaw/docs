---
read_when:
    - Exécution ou configuration de l’onboarding CLI
    - Configuration d’une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'Intégration CLI : configuration guidée du Gateway, de l’espace de travail, des canaux et des Skills'
title: Intégration (CLI)
x-i18n:
    generated_at: "2026-06-27T18:14:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

L’onboarding CLI est le parcours de configuration en terminal **recommandé** pour OpenClaw sur
macOS, Linux ou Windows. Les utilisateurs du bureau Windows peuvent aussi commencer avec
[Windows Hub](/fr/platforms/windows).
Il configure un Gateway local ou une connexion à un Gateway distant, ainsi que les canaux, les Skills
et les valeurs par défaut de l’espace de travail dans un seul flux guidé.

```bash
openclaw onboard
```

## Langue

L’assistant CLI localise les textes fixes de l’onboarding. Il détermine la langue à partir de
`OPENCLAW_LOCALE`, puis `LC_ALL`, puis `LC_MESSAGES`, puis `LANG`, et revient
à l’anglais par défaut. Les langues prises en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Les noms et identifiants stables restent littéraux : `OpenClaw`, `Gateway`, `Tailscale`,
les commandes, les clés de configuration, les URL, les ID de fournisseur, les ID de modèle et les libellés de Plugin/canal
ne sont pas traduits.

<Info>
Premier chat le plus rapide : ouvrez l’interface Control UI (aucune configuration de canal nécessaire). Exécutez
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
L’onboarding CLI inclut une étape de recherche web où vous pouvez choisir un fournisseur
comme Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Certains fournisseurs nécessitent une
clé API, tandis que d’autres n’en ont pas besoin. Vous pouvez aussi configurer cela plus tard avec
`openclaw configure --section web`. Docs : [Outils web](/fr/tools/web).
</Tip>

## Démarrage rapide ou Avancé

L’onboarding commence par **Démarrage rapide** (valeurs par défaut) ou **Avancé** (contrôle complet).

<Tabs>
  <Tab title="Démarrage rapide (valeurs par défaut)">
    - Gateway local (local loopback)
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway **18789**
    - Authentification du Gateway **Jeton** (généré automatiquement, même sur local loopback)
    - Politique d’outils par défaut pour les nouvelles configurations locales : `tools.profile: "coding"` (le profil explicite existant est conservé)
    - Valeur par défaut d’isolation des DM : l’onboarding local écrit `session.dmScope: "per-channel-peer"` lorsque cette valeur n’est pas définie. Détails : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale **Désactivée**
    - Les DM Telegram + WhatsApp utilisent par défaut une **liste d’autorisation** (votre numéro de téléphone vous sera demandé)

  </Tab>
  <Tab title="Avancé (contrôle complet)">
    - Affiche toutes les étapes (mode, espace de travail, Gateway, canaux, daemon, Skills).

  </Tab>
</Tabs>

## Ce que configure l’onboarding

Le **mode local (par défaut)** vous guide à travers ces étapes :

1. **Modèle/Auth** — choisissez n’importe quel fournisseur/flux d’authentification pris en charge (clé API, OAuth ou authentification manuelle propre au fournisseur), y compris un fournisseur personnalisé
   (compatible OpenAI, compatible Anthropic ou détection automatique inconnue). Choisissez un modèle par défaut.
   Note de sécurité : si cet agent exécutera des outils ou traitera du contenu de Webhook/hooks, privilégiez le modèle de dernière génération le plus robuste disponible et gardez une politique d’outils stricte. Les niveaux plus faibles/anciens sont plus faciles à injecter par prompt.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références adossées à l’environnement dans les profils d’authentification au lieu de valeurs de clé API en clair.
   En mode `ref` non interactif, la variable d’environnement du fournisseur doit être définie ; transmettre des indicateurs de clé en ligne sans cette variable d’environnement échoue immédiatement.
   Lors des exécutions interactives, choisir le mode de référence de secret vous permet de pointer soit vers une variable d’environnement, soit vers une référence fournisseur configurée (`file` ou `exec`), avec une validation préalable rapide avant l’enregistrement.
   Pour Anthropic, l’onboarding/configuration interactif propose **Anthropic Claude CLI** comme parcours local préféré et **clé API Anthropic** comme parcours recommandé en production. Anthropic setup-token reste aussi disponible comme parcours d’authentification par jeton pris en charge.
2. **Espace de travail** — emplacement des fichiers d’agent (par défaut `~/.openclaw/workspace`). Initialise les fichiers de démarrage.
3. **Gateway** — port, adresse de liaison, mode d’authentification, exposition Tailscale.
   En mode jeton interactif, choisissez le stockage de jeton en clair par défaut ou optez pour SecretRef.
   Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** — canaux de chat intégrés et Plugins officiels comme iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, et plus encore.
5. **Daemon** — installe un LaunchAgent (macOS), une unité utilisateur systemd (Linux/WSL2) ou une tâche planifiée Windows native avec repli par dossier de démarrage propre à l’utilisateur.
   Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service superviseur.
   Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’installation du daemon est bloquée avec des indications exploitables.
   Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
6. **Contrôle de santé** — démarre le Gateway et vérifie qu’il fonctionne.
7. **Skills** — installe les Skills recommandées et les dépendances facultatives.

<Note>
Relancer l’onboarding n’efface **rien**, sauf si vous choisissez explicitement **Réinitialiser** (ou transmettez `--reset`).
CLI `--reset` cible par défaut la configuration, les identifiants et les sessions ; utilisez `--reset-scope full` pour inclure l’espace de travail.
Si la configuration est invalide ou contient des clés héritées, l’onboarding vous demande d’abord d’exécuter `openclaw doctor`.
</Note>

Le **mode distant** configure uniquement le client local pour se connecter à un Gateway ailleurs.
Il n’installe ni ne modifie **rien** sur l’hôte distant.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent séparé avec son propre espace de travail,
ses sessions et ses profils d’authentification. Une exécution sans `--workspace` lance l’onboarding.

Ce qu’il définit :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notes :

- Les espaces de travail par défaut suivent `~/.openclaw/workspace-<agentId>`.
- Ajoutez `bindings` pour router les messages entrants (l’onboarding peut le faire).
- Indicateurs non interactifs : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour des explications détaillées étape par étape et les sorties de configuration, consultez
[Référence de configuration CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation CLI](/fr/start/wizard-cli-automation).
Pour la référence technique plus approfondie, y compris les détails RPC, consultez
[Référence d’onboarding](/fr/reference/wizard).

## Docs connexes

- Référence des commandes CLI : [`openclaw onboard`](/fr/cli/onboard)
- Vue d’ensemble de l’onboarding : [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview)
- Onboarding de l’application macOS : [Onboarding](/fr/start/onboarding)
- Rituel de premier lancement de l’agent : [Initialisation de l’agent](/fr/start/bootstrapping)
