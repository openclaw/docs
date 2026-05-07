---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou depuis les sources), avec une stratégie de retour en arrière
title: Mise à jour
x-i18n:
    generated_at: "2026-05-07T01:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

La façon la plus rapide d’effectuer une mise à jour. Elle détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version précise :

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # prévisualiser sans appliquer
```

`openclaw update` n’accepte pas `--verbose`. Pour les diagnostics de mise à jour, utilisez
`--dry-run` pour prévisualiser les actions prévues, `--json` pour obtenir des résultats structurés, ou
`openclaw update status --json` pour inspecter l’état du canal et de la disponibilité. Le
programme d’installation possède son propre indicateur `--verbose`, mais cet indicateur ne fait pas partie de
`openclaw update`.

`--channel beta` privilégie beta, mais le runtime revient à stable/latest lorsque
le tag beta est manquant ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm beta brut pour une mise à jour ponctuelle du paquet.

OpenClaw n’expose pas encore de canal de mise à jour de support LTS ou mensuel. Nous
travaillons à des lignes de support mensuelles compatibles avec SemVer, mais aujourd’hui les canaux pris en charge
restent `stable`, `beta` et `dev`.

Voir [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux lorsque vous souhaitez changer le type d’installation. L’outil de mise à jour conserve votre
état, votre configuration, vos identifiants et votre espace de travail dans `~/.openclaw` ; il ne change que
l’installation du code OpenClaw utilisée par la CLI et le Gateway.

```bash
# installation du paquet npm -> checkout git modifiable
openclaw update --channel dev

# checkout git -> installation du paquet npm
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
et le redémarre sauf si vous passez `--no-restart`.

## Alternative : relancer le programme d’installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour forcer un type d’installation précis via
le programme d’installation, passez `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du paquet npm, relancez le
programme d’installation. Le programme d’installation n’appelle pas l’ancien outil de mise à jour ; il exécute directement
l’installation du paquet global et peut récupérer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Pour épingler la récupération à une version précise ou à un dist-tag, ajoutez `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative : npm, pnpm ou bun manuel

```bash
npm i -g openclaw@latest
```

Préférez `openclaw update` pour les installations supervisées, car il peut coordonner le
remplacement du paquet avec le service Gateway en cours d’exécution. Si vous mettez à jour manuellement pendant qu’un
Gateway géré est en cours d’exécution, redémarrez le Gateway immédiatement après la fin du gestionnaire de paquets
afin que l’ancien processus ne continue pas à servir des fichiers de paquet remplacés.

Lorsque `openclaw update` gère une installation npm globale, il installe d’abord la cible dans
un préfixe npm temporaire, vérifie l’inventaire `dist` empaqueté, puis remplace
l’arborescence propre du paquet dans le vrai préfixe global. Cela évite que npm superpose un
nouveau paquet à des fichiers périmés de l’ancien paquet. Si la commande d’installation échoue,
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
  <Accordion title="Arborescence de paquets en lecture seule">
    OpenClaw traite les installations globales empaquetées comme étant en lecture seule au runtime, même lorsque le répertoire global du paquet est accessible en écriture par l’utilisateur actuel. Les installations de paquets de Plugin résident dans des racines npm/git appartenant à OpenClaw sous le répertoire de configuration utilisateur, et le démarrage du Gateway ne modifie pas l’arborescence du paquet OpenClaw.

    Certaines configurations npm Linux installent les paquets globaux dans des répertoires appartenant à root, comme `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition, car les commandes d’installation/mise à jour de Plugin écrivent en dehors de ce répertoire global de paquet.

  </Accordion>
  <Accordion title="Unités systemd renforcées">
    Donnez à OpenClaw un accès en écriture à ses racines de configuration/état afin que les installations explicites de Plugin, les mises à jour de Plugin et le nettoyage par doctor puissent persister leurs changements :

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Précontrôle de l’espace disque">
    Avant les mises à jour de paquets et les installations explicites de Plugin, OpenClaw tente une vérification de l’espace disque au mieux pour le volume cible. Un espace faible produit un avertissement avec le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas de système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation réelle par le gestionnaire de paquets et la vérification post-installation restent l’autorité.
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

| Canal    | Comportement                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec un jitter déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.        |
| `dev`    | Aucune application automatique. Utilisez `openclaw update` manuellement.                                      |

Le Gateway journalise également une indication de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).
Pour une rétrogradation ou une récupération après incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway pour bloquer les applications automatiques même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours s’exécuter sauf si `update.checkOnStart` est également désactivé.

Les mises à jour par gestionnaire de paquets demandées via le gestionnaire de plan de contrôle du Gateway en direct
forcent un redémarrage de mise à jour non différé et sans période de refroidissement après le remplacement du paquet. Cela
évite de laisser un ancien processus en mémoire assez longtemps pour charger paresseusement des fragments
depuis une arborescence de paquet qui a déjà été remplacée. La commande shell `openclaw update`
reste la voie privilégiée pour les installations supervisées, car elle peut arrêter et
redémarrer le service autour de la mise à jour.

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de DM et vérifie la santé du gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le gateway

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
`npm view openclaw version` affiche la version publiée actuelle.
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

- Exécutez à nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur les checkouts source, l’outil de mise à jour amorce automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) et relancez la mise à jour.
- Vérifiez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Associé

- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : contrôles de santé après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration des versions majeures.
