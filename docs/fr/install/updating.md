---
read_when:
    - Mettre à jour OpenClaw
    - Quelque chose se casse après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou source), plus stratégie de rollback
title: Mise à jour
x-i18n:
    generated_at: "2026-04-25T13:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

Le moyen le plus rapide de mettre à jour. Il détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor`, puis redémarre le gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # aperçu sans appliquer
```

`--channel beta` privilégie beta, mais le runtime revient à stable/latest lorsque
le tag beta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm beta brut pour une mise à jour ponctuelle du package.

Voir [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour les installations source, passez `--install-method git --no-onboard`.

## Alternative : npm, pnpm ou bun manuels

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Installations globales npm et dépendances runtime

OpenClaw traite les installations globales packagées comme étant en lecture seule à l’exécution, même lorsque le
répertoire global du package est inscriptible par l’utilisateur courant. Les dépendances runtime des plugins intégrés
sont mises en place dans un répertoire runtime inscriptible au lieu de modifier
l’arborescence du package. Cela évite que `openclaw update` entre en conflit avec un gateway en cours d’exécution ou un
agent local qui répare les dépendances de plugins pendant la même installation.

Certaines configurations npm Linux installent les packages globaux dans des répertoires appartenant à root
comme `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition via le
même chemin de staging externe.

Pour les unités systemd durcies, définissez un répertoire de staging inscriptible inclus dans
`ReadWritePaths` :

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` n’est pas défini, OpenClaw utilise `$STATE_DIRECTORY` lorsque
systemd le fournit, puis revient à `~/.openclaw/plugin-runtime-deps`.

### Dépendances runtime des plugins intégrés

Les installations packagées conservent les dépendances runtime des plugins intégrés hors de l’arborescence de package
en lecture seule. Au démarrage et pendant `openclaw doctor --fix`, OpenClaw répare
les dépendances runtime uniquement pour les plugins intégrés qui sont actifs dans la configuration, actifs
via l’ancienne configuration de canal, ou activés par la valeur par défaut de leur manifeste intégré.

La désactivation explicite l’emporte. Un plugin ou un canal désactivé ne voit pas ses
dépendances runtime réparées simplement parce qu’il existe dans le package. Les plugins externes
et les chemins de chargement personnalisés utilisent toujours `openclaw plugins install` ou
`openclaw plugins update`.

## Mise à jour automatique

La mise à jour automatique est désactivée par défaut. Activez-la dans `~/.openclaw/openclaw.json` :

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal    | Comportement                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec une gigue déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.          |
| `dev`    | Pas d’application automatique. Utilisez `openclaw update` manuellement.                                          |

Le gateway journalise aussi une indication de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques DM et vérifie l’état du gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Rollback

### Épingler une version (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Conseil : `npm view openclaw version` affiche la version actuellement publiée.

### Épingler un commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez à nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur des checkouts source, le programme de mise à jour initialise automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’initialisation pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) puis relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Connexes

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Doctor](/fr/gateway/doctor) — vérifications d’état après les mises à jour
- [Migration](/fr/install/migrating) — guides de migration de version majeure
