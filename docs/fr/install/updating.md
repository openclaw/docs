---
read_when:
    - Mettre à jour OpenClaw
    - Quelque chose casse après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou source), plus stratégie de restauration
title: Mise à jour
x-i18n:
    generated_at: "2026-04-26T11:33:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

Le moyen le plus rapide de mettre à jour. Il détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor`, et redémarre la Gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # aperçu sans appliquer
```

`--channel beta` préfère beta, mais le runtime revient à stable/latest lorsque
le tag beta est absent ou plus ancien que la dernière release stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm beta brut pour une mise à jour ponctuelle du package.

Voir [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux lorsque vous voulez changer le type d’installation. Le programme de mise à jour conserve votre
état, configuration, identifiants et espace de travail dans `~/.openclaw` ; il ne change que
l’installation du code OpenClaw utilisée par la CLI et la Gateway.

```bash
# installation package npm -> checkout git modifiable
openclaw update --channel dev

# checkout git -> installation package npm
openclaw update --channel stable
```

Exécutez d’abord avec `--dry-run` pour prévisualiser le changement exact de mode d’installation :

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Le canal `dev` garantit un checkout git, le construit, et installe la CLI globale
à partir de ce checkout. Les canaux `stable` et `beta` utilisent des installations package. Si la
Gateway est déjà installée, `openclaw update` actualise les métadonnées du service
et la redémarre sauf si vous passez `--no-restart`.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’intégration guidée. Pour forcer un type d’installation spécifique via
l’installateur, passez `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

## Alternative : npm, pnpm ou bun manuels

```bash
npm i -g openclaw@latest
```

Lorsque `openclaw update` gère une installation npm globale, il exécute d’abord la commande normale
d’installation globale. Si cette commande échoue, OpenClaw réessaie une fois avec
`--omit=optional`. Cette nouvelle tentative aide les hôtes où les dépendances optionnelles natives
ne peuvent pas être compilées, tout en gardant l’échec d’origine visible si la solution de repli
échoue aussi.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Installations npm globales et dépendances d’exécution

OpenClaw traite les installations globales packagées comme étant en lecture seule à l’exécution, même lorsque le
répertoire de package global est inscriptible par l’utilisateur courant. Les dépendances d’exécution des Plugins intégrés
sont préparées dans un répertoire d’exécution inscriptible au lieu de modifier
l’arborescence du package. Cela évite que `openclaw update` n’entre en concurrence avec une Gateway en cours d’exécution ou
un agent local qui répare les dépendances de Plugins pendant la même installation.

Certaines configurations npm Linux installent les packages globaux sous des répertoires appartenant à root tels
que `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition via le
même chemin de préparation externe.

Pour les unités systemd durcies, définissez un répertoire de préparation inscriptible inclus dans
`ReadWritePaths` :

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` n’est pas défini, OpenClaw utilise `$STATE_DIRECTORY` lorsque
systemd le fournit, puis revient à `~/.openclaw/plugin-runtime-deps`.
L’étape de réparation traite cet espace de préparation comme une racine de package locale possédée par OpenClaw et
ignore les réglages utilisateur npm prefix/global, de sorte que la configuration npm d’installation globale ne
redirige pas les dépendances de Plugins intégrés vers `~/node_modules` ni vers l’arborescence globale de packages.

Avant les mises à jour de package et les réparations de dépendances d’exécution intégrées, OpenClaw tente une
vérification best-effort de l’espace disque sur le volume cible. Un espace faible produit un avertissement
avec le chemin vérifié, mais ne bloque pas la mise à jour car les quotas de système de fichiers,
instantanés et volumes réseau peuvent changer après la vérification. L’installation npm réelle,
la copie et la vérification post-installation restent déterminantes.

### Dépendances d’exécution des Plugins intégrés

Les installations packagées conservent les dépendances d’exécution des Plugins intégrés en dehors de l’arborescence
de package en lecture seule. Au démarrage et pendant `openclaw doctor --fix`, OpenClaw répare
les dépendances d’exécution uniquement pour les Plugins intégrés actifs dans la configuration, actifs
via l’ancienne configuration de canal, ou activés par leur manifeste intégré par défaut.
L’état d’authentification de canal persisté seul ne déclenche pas la réparation des dépendances d’exécution
au démarrage de la Gateway.

La désactivation explicite l’emporte. Un Plugin ou canal désactivé ne voit pas ses
dépendances d’exécution réparées simplement parce qu’il existe dans le package. Les
Plugins externes et chemins de chargement personnalisés utilisent toujours `openclaw plugins install` ou
`openclaw plugins update`.

## Programme de mise à jour automatique

Le programme de mise à jour automatique est désactivé par défaut. Activez-le dans `~/.openclaw/openclaw.json` :

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

| Canal    | Comportement                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec un jitter déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : chaque heure) et applique immédiatement.               |
| `dev`    | Pas d’application automatique. Utilisez `openclaw update` manuellement.                                          |

La Gateway journalise aussi un indice de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques DM, et vérifie l’état de la Gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer la Gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Restauration

### Épingler une version (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Astuce : `npm view openclaw version` affiche la version actuellement publiée.

### Épingler un commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez `openclaw doctor` à nouveau et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur des checkouts source, le programme de mise à jour amorce automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) et relancez la mise à jour.
- Consultez : [Résolution des problèmes](/fr/gateway/troubleshooting)
- Demandez sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Associé

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Doctor](/fr/gateway/doctor) — vérifications d’état après les mises à jour
- [Migration](/fr/install/migrating) — guides de migration de version majeure
