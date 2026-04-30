---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou depuis les sources), avec une stratégie de retour arrière
title: Mise à jour
x-i18n:
    generated_at: "2026-04-30T07:34:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

La façon la plus rapide de mettre à jour. Elle détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` privilégie la bêta, mais le runtime revient à stable/latest lorsque
le tag bêta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm bêta brut pour une mise à jour ponctuelle du paquet.

Consultez [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux lorsque vous voulez changer le type d’installation. L’outil de mise à jour conserve votre
état, votre configuration, vos identifiants et votre espace de travail dans `~/.openclaw` ; il ne change que
l’installation du code OpenClaw utilisée par la CLI et le Gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Exécutez d’abord avec `--dry-run` pour prévisualiser le changement exact de mode d’installation :

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Le canal `dev` garantit un checkout git, le compile et installe la CLI globale
depuis ce checkout. Les canaux `stable` et `beta` utilisent des installations de paquet. Si le
Gateway est déjà installé, `openclaw update` actualise les métadonnées du service
et le redémarre, sauf si vous passez `--no-restart`.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour forcer un type d’installation spécifique via
l’installateur, passez `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du paquet npm, relancez
l’installateur. L’installateur n’appelle pas l’ancien outil de mise à jour ; il exécute directement
l’installation globale du paquet et peut récupérer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Pour verrouiller la récupération sur une version ou un dist-tag spécifique, ajoutez `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative : npm, pnpm ou bun manuel

```bash
npm i -g openclaw@latest
```

Lorsque `openclaw update` gère une installation npm globale, il installe d’abord la cible dans
un préfixe npm temporaire, vérifie l’inventaire `dist` empaqueté, puis remplace
l’arborescence propre du paquet dans le vrai préfixe global. Cela évite que npm superpose un
nouveau paquet sur des fichiers obsolètes de l’ancien paquet. Si la commande d’installation échoue,
OpenClaw réessaie une fois avec `--omit=optional`. Cette nouvelle tentative aide les hôtes où les
dépendances optionnelles natives ne peuvent pas compiler, tout en laissant l’échec initial visible
si le repli échoue aussi.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Sujets avancés d’installation npm

<AccordionGroup>
  <Accordion title="Arborescence de paquets en lecture seule">
    OpenClaw traite les installations globales empaquetées comme en lecture seule à l’exécution, même lorsque le répertoire global du paquet est accessible en écriture par l’utilisateur courant. Les dépendances runtime des plugins groupés sont placées dans un répertoire runtime accessible en écriture au lieu de modifier l’arborescence du paquet. Cela empêche `openclaw update` d’entrer en concurrence avec un Gateway en cours d’exécution ou un agent local qui répare les dépendances de plugins pendant la même installation.

    Certaines configurations npm Linux installent les paquets globaux dans des répertoires appartenant à root, comme `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition via le même chemin de staging externe.

  </Accordion>
  <Accordion title="Unités systemd renforcées">
    Définissez un répertoire de staging accessible en écriture inclus dans `ReadWritePaths` :

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` accepte aussi une liste de chemins. OpenClaw résout les dépendances runtime des plugins groupés de gauche à droite dans les racines listées, traite les racines précédentes comme des couches préinstallées en lecture seule, et installe ou répare uniquement dans la dernière racine accessible en écriture :

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Si `OPENCLAW_PLUGIN_STAGE_DIR` n’est pas défini, OpenClaw utilise `$STATE_DIRECTORY` lorsque systemd le fournit, puis revient à `~/.openclaw/plugin-runtime-deps`. L’étape de réparation traite ce staging comme une racine locale de paquets appartenant à OpenClaw et ignore le préfixe npm utilisateur ainsi que les paramètres globaux, afin que la configuration npm d’installation globale ne redirige pas les dépendances de plugins groupés vers `~/node_modules` ou l’arborescence globale du paquet.

  </Accordion>
  <Accordion title="Vérification préalable de l’espace disque">
    Avant les mises à jour de paquets et les réparations des dépendances runtime groupées, OpenClaw tente une vérification approximative de l’espace disque pour le volume cible. Un espace insuffisant produit un avertissement avec le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas de système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation npm réelle, la copie et la vérification post-installation restent l’autorité.
  </Accordion>
  <Accordion title="Dépendances runtime des plugins groupés">
    Les installations empaquetées gardent les dépendances runtime des plugins groupés hors de l’arborescence du paquet en lecture seule. Au démarrage et pendant `openclaw doctor --fix`, OpenClaw répare les dépendances runtime uniquement pour les plugins groupés actifs dans la configuration, actifs via l’ancienne configuration de canal, ou activés par la valeur par défaut de leur manifeste groupé. L’état d’authentification de canal persistant seul ne déclenche pas la réparation des dépendances runtime au démarrage du Gateway.

    La désactivation explicite prévaut. Un plugin ou un canal désactivé ne voit pas ses dépendances runtime réparées simplement parce qu’il existe dans le paquet. Les plugins externes et les chemins de chargement personnalisés utilisent toujours `openclaw plugins install` ou `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

## Outil de mise à jour automatique

L’outil de mise à jour automatique est désactivé par défaut. Activez-le dans `~/.openclaw/openclaw.json` :

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
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.            |
| `dev`    | Aucune application automatique. Utilisez `openclaw update` manuellement.                                           |

Le Gateway journalise aussi une indication de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).
Pour une rétrogradation ou une récupération après incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway afin de bloquer les applications automatiques même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours s’exécuter, sauf si `update.checkOnStart` est également désactivé.

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de DM et vérifie la santé du Gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le Gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Rollback

### Verrouiller une version (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` affiche la version publiée actuelle.
</Tip>

### Verrouiller un commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez `openclaw doctor` à nouveau et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur des checkouts source, l’outil de mise à jour amorce automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) et relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez dans Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Connexe

- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : vérifications de santé après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration de version majeure.
