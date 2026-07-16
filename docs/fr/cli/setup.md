---
read_when:
    - Vous souhaitez discuter avec OpenClaw pour le configurer ou le réparer
    - Vous effectuez la configuration initiale avec l’assistant d’intégration
    - Vous souhaitez définir le chemin d’accès par défaut de l’espace de travail
    - Vous avez besoin de l’option de configuration limitée à la référence pour les scripts
summary: Référence de la CLI pour `openclaw setup` (chat avec l’agent système et solution de repli vers l’intégration)
title: Configuration
x-i18n:
    generated_at: "2026-07-16T13:14:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` est le point d’entrée de l’agent système. Sur un système configuré,
`openclaw setup` seul ouvre une conversation interactive OpenClaw. Sur un nouveau système, il
lance à la place l’intégration guidée. Utilisez `-m`/`--message` pour une seule requête ou
`--baseline` pour initialiser les dossiers de configuration et d’espace de travail sans l’assistant.

Ordre de routage :

1. Toute option d’intégration (`--wizard`, `--baseline`, espace de travail, réinitialisation,
   mode non interactif, parcours, mode, Gateway, démon, ignorer, importation, distant ou options
   d’authentification) exécute l’intégration exactement comme `openclaw onboard`.
2. `-m`/`--message` ou `--yes` exécute l’agent système.
3. Sans option de routage, un système interactif configuré ouvre OpenClaw. Un
   nouveau système exécute l’intégration. Sur un système configuré, `--json` affiche la
   vue d’ensemble du système même sans TTY ; une option d’intégration conserve le
   résumé JSON de l’intégration.

En mode guidé, `--workspace <dir>` est l’espace de travail proposé à OpenClaw ;
il n’est conservé qu’après votre approbation de cette proposition. Les configurations de référence, classique et
non interactive conservent l’espace de travail fourni via leur parcours normal.

La détection guidée des services d’inférence s’exécute sur l’hôte du Gateway sous macOS ou Linux. La CLI
et l’application macOS appellent le même détecteur géré par le Gateway, qui vérifie les
modèles configurés, les connexions CLI prises en charge, les variables d’environnement des clés d’API et les
modèles Ollama ou LM Studio déjà installés. Les modèles locaux ne sont jamais téléchargés par cette
analyse automatique ; le candidat sélectionné doit répondre à une véritable requête de complétion avant que sa
configuration de fournisseur et de modèle soit enregistrée.

`setup` accepte les mêmes indicateurs d’intégration que `openclaw onboard`, notamment ceux
d’authentification (`--auth-choice`, `--token`, indicateurs de clé du fournisseur), du Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
de Tailscale (`--tailscale`), de réinitialisation (`--reset`, `--reset-scope`), de parcours
(`--flow quickstart|advanced|manual|import`) et d’omission
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consultez [Intégration](/fr/cli/onboard) et
[Automatisation de la CLI](/fr/start/wizard-cli-automation) pour la liste complète des indicateurs et des
exemples non interactifs. `openclaw onboard --modern` reste un point d’entrée de compatibilité
pour le même assistant OpenClaw soumis à la détection des services d’inférence.

<Note>
`openclaw setup` est destiné aux installations dont la configuration est modifiable. En mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw refuse les écritures de configuration, car le fichier de configuration est géré par Nix. Utilisez le [Guide de démarrage rapide de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) officiel ou la configuration source équivalente pour un autre paquet Nix.
</Note>

## Options

| Indicateur                 | Description                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Exécute une requête OpenClaw.                                                                                   |
| `--yes`                    | Approuve les écritures persistantes dans la configuration pour une requête `--message`.                         |
| `--workspace <dir>`        | Proposition d’espace de travail en mode guidé ; conservée directement par les configurations de référence, classique et non interactive. |
| `--baseline`               | Crée les dossiers de configuration de référence, d’espace de travail et de sessions sans intégration.                    |
| `--wizard`                 | Force l’intégration interactive.                                                                                         |
| `--non-interactive`        | Exécute l’intégration sans invites.                                                                                       |
| `--accept-risk`            | Confirme le risque lié à l’accès de l’agent à l’ensemble du système ; requis avec `--non-interactive`.                   |
| `--mode <mode>`            | Mode d’intégration : `local` ou `remote`.                                                           |
| `--flow <flow>`            | Parcours d’intégration : `quickstart`, `advanced`, `manual` ou `import`.              |
| `--reset`                  | Réinitialise la configuration, les identifiants et les sessions avant l’intégration (espace de travail uniquement avec `--reset-scope full`). |
| `--reset-scope <scope>`    | Portée de la réinitialisation : `config`, `config+creds+sessions` ou `full`.                            |
| `--import-from <provider>` | Fournisseur de migration à exécuter pendant l’intégration.                                                                |
| `--import-source <path>`   | Répertoire personnel de l’agent source pour `--import-from`.                                                          |
| `--import-secrets`         | Importe les secrets pris en charge pendant la migration d’intégration.                                                    |
| `--remote-url <url>`       | URL WebSocket du Gateway distant.                                                                                         |
| `--remote-token <token>`   | Jeton du Gateway distant (facultatif).                                                                                    |
| `--json`                   | Système configuré : vue d’ensemble d’OpenClaw. Routage vers l’intégration : résumé de l’intégration.                     |

`--classic` et `--non-interactive` sont mutuellement exclusifs : le mode classique ouvre
l’assistant interactif, tandis que la configuration non interactive utilise le parcours d’automatisation.

### Mode de référence

`openclaw setup --baseline` préserve l’ancien comportement limité à la configuration de référence : il
crée les répertoires de configuration, d’espace de travail et de sessions, puis se termine sans
exécuter l’intégration.

## Exemples

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Remarques

- Après la configuration de référence, exécutez `openclaw onboard` pour suivre l’intégralité du parcours guidé, `openclaw configure` pour effectuer des modifications ciblées ou `openclaw channels add` pour ajouter des comptes de canaux.
- Si un état Hermes est détecté, l’intégration interactive peut proposer automatiquement une migration. L’intégration avec importation nécessite une nouvelle configuration ; utilisez [Migrer](/fr/cli/migrate) pour obtenir des plans d’exécution à blanc, des sauvegardes et le mode d’écrasement en dehors de l’intégration.

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Intégration](/fr/cli/onboard)
- [Intégration (CLI)](/fr/start/wizard)
- [Bien démarrer](/fr/start/getting-started)
- [Vue d’ensemble de l’installation](/fr/install)
