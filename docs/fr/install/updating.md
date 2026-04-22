---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose casse après une mise à jour
summary: Mise à jour sûre d’OpenClaw (installation globale ou depuis les sources), plus stratégie de retour arrière
title: Mise à jour
x-i18n:
    generated_at: "2026-04-22T04:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Mise à jour

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

La façon la plus rapide de faire la mise à jour. Cette commande détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor`, puis redémarre la gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # aperçu sans appliquer
```

`--channel beta` privilégie la bêta, mais le runtime revient à stable/latest lorsque
le tag bêta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm bêta brut pour une mise à jour ponctuelle du package.

Voir [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour les installations depuis les sources, passez `--install-method git --no-onboard`.

## Alternative : npm, pnpm ou bun en manuel

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Installations npm globales appartenant à root

Certaines configurations npm sous Linux installent les packages globaux dans des répertoires appartenant à root, tels que
`/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition : le
package installé est traité comme en lecture seule à l’exécution, et les dépendances
d’exécution des plugins intégrés sont placées dans un répertoire d’exécution inscriptible au lieu de modifier
l’arborescence du package.

Pour les unités systemd renforcées, définissez un répertoire de préparation inscriptible inclus dans
`ReadWritePaths` :

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` n’est pas défini, OpenClaw utilise `$STATE_DIRECTORY` lorsque
systemd le fournit, puis revient à `~/.openclaw/plugin-runtime-deps`.

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

| Canal    | Comportement                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec un décalage déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.       |
| `dev`    | Pas d’application automatique. Utilisez `openclaw update` manuellement.                                       |

La gateway journalise également une indication de mise à jour au démarrage (désactivez-la avec `update.checkOnStart: false`).

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de MP et vérifie l’état de santé de la gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer la gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Retour arrière

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
- Pour `openclaw update --channel dev` sur des checkouts source, l’outil de mise à jour amorce automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) puis relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Doctor](/fr/gateway/doctor) — vérifications d’état après les mises à jour
- [Migration](/fr/install/migrating) — guides de migration des versions majeures
