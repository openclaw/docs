---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou depuis les sources), avec stratégie de restauration
title: Mise à jour
x-i18n:
    generated_at: "2026-05-03T21:35:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

La méthode la plus rapide pour effectuer une mise à jour. Elle détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

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

`openclaw update` n’accepte pas `--verbose`. Pour diagnostiquer une mise à jour, utilisez
`--dry-run` afin de prévisualiser les actions prévues, `--json` pour obtenir des résultats structurés, ou
`openclaw update status --json` pour examiner l’état du canal et de la disponibilité. Le
programme d’installation possède son propre indicateur `--verbose`, mais cet indicateur ne fait pas partie de
`openclaw update`.

`--channel beta` privilégie la bêta, mais l’environnement d’exécution revient à la version stable/latest lorsque
le tag bêta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm bêta brut pour une mise à jour ponctuelle de paquet.

Consultez [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux lorsque vous voulez changer de type d’installation. Le programme de mise à jour conserve votre
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
depuis ce checkout. Les canaux `stable` et `beta` utilisent des installations de paquets. Si le
Gateway est déjà installé, `openclaw update` actualise les métadonnées du service
et le redémarre, sauf si vous passez `--no-restart`.

## Alternative : réexécuter le programme d’installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’intégration. Pour forcer un type d’installation spécifique via
le programme d’installation, passez `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du paquet npm, réexécutez le
programme d’installation. Le programme d’installation n’appelle pas l’ancien programme de mise à jour ; il exécute directement
l’installation du paquet global et peut récupérer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Pour limiter la récupération à une version ou un dist-tag spécifique, ajoutez `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative : npm, pnpm ou bun manuel

```bash
npm i -g openclaw@latest
```

Lorsque `openclaw update` gère une installation npm globale, il installe d’abord la cible dans
un préfixe npm temporaire, vérifie l’inventaire `dist` empaqueté, puis remplace
l’arborescence propre du paquet dans le véritable préfixe global. Cela évite que npm superpose un
nouveau paquet à des fichiers obsolètes de l’ancien paquet. Si la commande d’installation échoue,
OpenClaw réessaie une fois avec `--omit=optional`. Cette nouvelle tentative aide les hôtes où les
dépendances optionnelles natives ne peuvent pas être compilées, tout en gardant l’échec initial visible
si le repli échoue également.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Sujets avancés d’installation npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw traite les installations globales empaquetées comme étant en lecture seule à l’exécution, même lorsque le répertoire global du paquet est accessible en écriture par l’utilisateur actuel. Les installations de paquets Plugin résident dans des racines npm/git appartenant à OpenClaw sous le répertoire de configuration utilisateur, et le démarrage du Gateway ne modifie pas l’arborescence du paquet OpenClaw.

    Certaines configurations npm Linux installent les paquets globaux sous des répertoires appartenant à root, comme `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition, car les commandes d’installation/mise à jour de Plugin écrivent en dehors de ce répertoire global de paquet.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Donnez à OpenClaw un accès en écriture à ses racines de configuration/état afin que les installations explicites de Plugin, les mises à jour de Plugin et le nettoyage par doctor puissent persister leurs changements :

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Avant les mises à jour de paquets et les installations explicites de Plugin, OpenClaw tente une vérification opportuniste de l’espace disque pour le volume cible. Un espace faible produit un avertissement avec le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas de système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation réelle par le gestionnaire de paquets et la vérification post-installation restent l’autorité.
  </Accordion>
</AccordionGroup>

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

| Canal    | Comportement                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec un décalage déterministe sur `stableJitterHours` (déploiement réparti). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.                              |
| `dev`    | Aucune application automatique. Utilisez `openclaw update` manuellement.                                                           |

Le Gateway journalise également une indication de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).
Pour une rétrogradation ou une récupération après incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway afin de bloquer les applications automatiques même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours s’exécuter, sauf si `update.checkOnStart` est également désactivé.

Les mises à jour du gestionnaire de paquets demandées via le gestionnaire actif du plan de contrôle du Gateway
forcent un redémarrage de mise à jour non différé, sans délai de récupération, après le remplacement du paquet. Cela
évite de conserver un ancien processus en mémoire assez longtemps pour charger paresseusement des morceaux
depuis une arborescence de paquet qui a déjà été remplacée. La commande shell `openclaw update`
reste le chemin privilégié pour les installations supervisées, car elle peut arrêter et
redémarrer le service autour de la mise à jour.

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de messages privés et vérifie l’état du Gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le Gateway

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

<Tip>
`npm view openclaw version` affiche la version actuellement publiée.
</Tip>

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
- Pour `openclaw update --channel dev` sur les checkouts source, le programme de mise à jour initialise automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) et relancez la mise à jour.
- Vérifiez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Associé

- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : vérifications d’état après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration des versions majeures.
