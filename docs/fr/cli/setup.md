---
read_when:
    - Vous effectuez la configuration initiale à l’aide de l’assistant d’intégration de la CLI.
    - Vous souhaitez définir le chemin d’accès par défaut de l’espace de travail
    - Vous avez besoin de l’option de configuration réservée à la ligne de base pour les scripts
summary: Référence de la CLI pour `openclaw setup` (alias pour l’intégration initiale, avec configuration de base disponible via une option)
title: Configuration
x-i18n:
    generated_at: "2026-07-12T15:10:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` exécute le même parcours d’intégration guidée que `openclaw onboard` :
il vérifie et enregistre d’abord l’inférence, puis démarre Crestodian pour configurer
l’espace de travail, le Gateway, les canaux, les Skills et l’état de santé. Utilisez `--baseline` si vous
devez uniquement initialiser les dossiers de configuration et d’espace de travail sans l’assistant.

En mode guidé, `--workspace <dir>` correspond à l’espace de travail proposé à Crestodian ;
il n’est enregistré qu’après votre approbation de cette proposition. Les configurations de référence, classique et
non interactive enregistrent l’espace de travail fourni selon leur parcours normal.

`setup` accepte les mêmes options d’intégration que `openclaw onboard`, notamment
celles d’authentification (`--auth-choice`, `--token`, options de clé du fournisseur), du Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
de Tailscale (`--tailscale`), de réinitialisation (`--reset`, `--reset-scope`), de parcours
(`--flow quickstart|advanced|manual|import`) et d’omission
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Consultez [Intégration](/fr/cli/onboard) et
[Automatisation de la CLI](/fr/start/wizard-cli-automation) pour obtenir la référence complète des options et
des exemples non interactifs. `openclaw onboard --modern` est l’alias de compatibilité
de l’assistant Crestodian soumis à la validation de l’inférence et n’a pas d’équivalent dans `setup`.

<Note>
`openclaw setup` est destiné aux installations dont la configuration est modifiable. En mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw refuse les écritures de configuration, car le fichier de configuration est géré par Nix. Utilisez le [guide de démarrage rapide de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) officiel ou la configuration source équivalente pour un autre paquet Nix.
</Note>

## Options

| Option                     | Description                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Proposition d’espace de travail en mode guidé ; enregistrée directement par les configurations de référence, classique et non interactive. |
| `--baseline`               | Crée les dossiers de configuration, d’espace de travail et de session de référence sans intégration.                    |
| `--wizard`                 | Acceptée à des fins de compatibilité ; la configuration exécute l’intégration par défaut.                               |
| `--non-interactive`        | Exécute l’intégration sans invites.                                                                                      |
| `--accept-risk`            | Confirme le risque lié à l’accès de l’agent à l’ensemble du système ; requise avec `--non-interactive`.                 |
| `--mode <mode>`            | Mode d’intégration : `local` ou `remote`.                                                                                |
| `--flow <flow>`            | Parcours d’intégration : `quickstart`, `advanced`, `manual` ou `import`.                                                 |
| `--reset`                  | Réinitialise la configuration, les identifiants et les sessions avant l’intégration (espace de travail uniquement avec `--reset-scope full`). |
| `--reset-scope <scope>`    | Portée de la réinitialisation : `config`, `config+creds+sessions` ou `full`.                                             |
| `--import-from <provider>` | Fournisseur de migration à utiliser pendant l’intégration.                                                              |
| `--import-source <path>`   | Répertoire personnel de l’agent source pour `--import-from`.                                                            |
| `--import-secrets`         | Importe les secrets pris en charge pendant la migration d’intégration.                                                  |
| `--remote-url <url>`       | URL WebSocket du Gateway distant.                                                                                        |
| `--remote-token <token>`   | Jeton du Gateway distant (facultatif).                                                                                   |
| `--json`                   | Produit un récapitulatif JSON.                                                                                           |

`--classic` et `--non-interactive` sont mutuellement exclusifs : le mode classique ouvre
l’assistant interactif, tandis que la configuration non interactive utilise le parcours d’automatisation.

### Mode de base

`openclaw setup --baseline` préserve l’ancien comportement limité à la configuration de base : il
crée les répertoires de configuration, d’espace de travail et de session, puis se termine sans
lancer l’intégration.

## Exemples

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Remarques

- Après la configuration de base, exécutez `openclaw setup` ou `openclaw onboard` pour suivre l’intégralité du parcours guidé, `openclaw configure` pour apporter des modifications ciblées, ou `openclaw channels add` pour ajouter des comptes de canaux.
- Si un état Hermes est détecté, l’intégration interactive peut proposer automatiquement une migration. L’intégration avec importation nécessite une nouvelle configuration ; utilisez [Migrer](/fr/cli/migrate) pour obtenir des plans d’exécution à blanc, des sauvegardes et un mode d’écrasement en dehors de l’intégration.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Intégration](/fr/cli/onboard)
- [Intégration (CLI)](/fr/start/wizard)
- [Bien démarrer](/fr/start/getting-started)
- [Vue d’ensemble de l’installation](/fr/install)
