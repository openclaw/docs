---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou depuis les sources), avec stratégie de restauration en arrière arrière
title: Mise à jour
x-i18n:
    generated_at: "2026-06-27T17:40:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Maintenez OpenClaw à jour.

## Recommandé : `openclaw update`

Le moyen le plus rapide de mettre à jour. Il détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

```bash
openclaw update
```

Pour changer de canaux ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` n’accepte pas `--verbose`. Pour les diagnostics de mise à jour, utilisez
`--dry-run` pour prévisualiser les actions prévues, `--json` pour obtenir des résultats structurés, ou
`openclaw update status --json` pour inspecter l’état des canaux et de disponibilité. Le
programme d’installation possède son propre indicateur `--verbose`, mais cet indicateur ne fait pas partie de
`openclaw update`.

`--channel beta` privilégie beta, mais le runtime revient à stable/latest lorsque
le tag beta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm beta brut pour une mise à jour ponctuelle de package.

Utilisez `--channel dev` pour un checkout GitHub `main` mobile et persistant. Pour les mises à jour de package,
`--tag main` correspond à `github:openclaw/openclaw#main` pour une seule exécution, et
les spécifications de source GitHub/git sont empaquetées dans une archive tar temporaire avant l’installation
npm préparée.

Pour les plugins gérés, le repli du canal beta est un avertissement : la mise à jour du cœur peut
toujours réussir pendant qu’un plugin utilise sa version par défaut/latest enregistrée, car aucune
version beta du plugin n’est disponible.

Voir [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux lorsque vous voulez changer de type d’installation. Le programme de mise à jour conserve votre
état, votre configuration, vos identifiants et votre espace de travail dans `~/.openclaw` ; il modifie seulement
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
depuis ce checkout. Les canaux `stable` et `beta` utilisent des installations de packages. Si le
Gateway est déjà installé, `openclaw update` actualise les métadonnées du service
et le redémarre, sauf si vous passez `--no-restart`.

Pour les installations de packages avec un service Gateway géré, `openclaw update` cible
la racine de package utilisée par ce service. Si la commande shell `openclaw` provient
d’une autre installation, le programme de mise à jour affiche les deux racines et le chemin Node
du service géré. La mise à jour du package utilise le gestionnaire de packages qui possède la racine
du service et vérifie le Node du service géré par rapport au moteur de la version cible
avant de remplacer le package.

## Alternative : relancer le programme d’installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’intégration initiale. Pour imposer un type d’installation spécifique via
le programme d’installation, passez `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du package npm, relancez le
programme d’installation. Le programme d’installation n’appelle pas l’ancien programme de mise à jour ; il exécute directement
l’installation globale du package et peut récupérer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Pour épingler la récupération à une version ou un dist-tag spécifique, ajoutez `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative : npm, pnpm ou bun manuels

```bash
npm i -g openclaw@latest
```

Préférez `openclaw update` pour les installations supervisées, car il peut coordonner le
remplacement du package avec le service Gateway en cours d’exécution. Si vous mettez à jour manuellement sur une
installation supervisée, arrêtez le Gateway géré avant le démarrage du gestionnaire de packages.
Les gestionnaires de packages remplacent les fichiers sur place, et un Gateway en cours d’exécution peut sinon tenter
de charger des fichiers du cœur ou de plugin pendant que l’arborescence de packages est temporairement à moitié remplacée.
Redémarrez le Gateway une fois le gestionnaire de packages terminé afin que le service prenne en compte
la nouvelle installation.

Pour une installation globale Linux appartenant à root au niveau du système, si `openclaw update` échoue avec
`EACCES` et que vous récupérez avec npm système, gardez le Gateway arrêté pendant le
remplacement manuel du package. Utilisez les mêmes indicateurs de profil `openclaw` ou le même environnement
que vous utilisez normalement pour ce Gateway. Remplacez `/usr/bin/npm` par le npm système
qui possède le préfixe global appartenant à root sur votre hôte :

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Puis vérifiez le service :

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Lorsque `openclaw update` gère une installation npm globale, il installe d’abord la cible dans
un préfixe npm temporaire, vérifie l’inventaire `dist` empaqueté, puis remplace
l’arborescence de package propre dans le vrai préfixe global. Cela évite à npm de superposer un
nouveau package sur des fichiers obsolètes de l’ancien package. Si la commande d’installation échoue,
OpenClaw réessaie une fois avec `--omit=optional`. Cette nouvelle tentative aide les hôtes où les
dépendances optionnelles natives ne peuvent pas être compilées, tout en gardant l’échec d’origine visible
si le repli échoue également.

Les commandes de mise à jour npm et de mise à jour de plugin gérées par OpenClaw effacent aussi la quarantaine npm
`min-release-age` pour le processus npm enfant. npm peut signaler cette
politique comme une limite dérivée `before` ; les deux sont utiles pour les politiques générales de quarantaine
de chaîne d’approvisionnement, mais une mise à jour OpenClaw explicite signifie « installer maintenant la version
OpenClaw sélectionnée ».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Sujets avancés d’installation npm

<AccordionGroup>
  <Accordion title="Arborescence de packages en lecture seule">
    OpenClaw traite les installations globales empaquetées comme étant en lecture seule au runtime, même lorsque le répertoire global de packages est accessible en écriture par l’utilisateur actuel. Les installations de packages de plugin résident dans des racines npm/git appartenant à OpenClaw sous le répertoire de configuration utilisateur, et le démarrage du Gateway ne modifie pas l’arborescence de packages OpenClaw.

    Certaines configurations npm Linux installent les packages globaux dans des répertoires appartenant à root, comme `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition, car les commandes d’installation/mise à jour de plugin écrivent en dehors de ce répertoire global de packages.

  </Accordion>
  <Accordion title="Unités systemd renforcées">
    Donnez à OpenClaw un accès en écriture à ses racines de configuration/état afin que les installations explicites de plugins, les mises à jour de plugins et le nettoyage par doctor puissent conserver leurs modifications :

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Précontrôle de l’espace disque">
    Avant les mises à jour de packages et les installations explicites de plugins, OpenClaw tente une vérification au mieux de l’espace disque pour le volume cible. Un espace faible produit un avertissement avec le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas de système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation réelle par le gestionnaire de packages et la vérification post-installation restent l’autorité.
  </Accordion>
</AccordionGroup>

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

| Canal    | Comportement                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec une gigue déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.        |
| `dev`    | Aucune application automatique. Utilisez `openclaw update` manuellement.                                      |

Le Gateway journalise aussi une indication de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).
Pour une rétrogradation ou une récupération d’incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway afin de bloquer les applications automatiques même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours s’exécuter, sauf si `update.checkOnStart` est également désactivé.

Les mises à jour par gestionnaire de packages demandées via le gestionnaire de plan de contrôle du Gateway en direct
ne remplacent pas l’arborescence de packages à l’intérieur du processus Gateway en cours d’exécution. Sur les
installations de service géré, le Gateway démarre un transfert détaché, se ferme et laisse le
chemin CLI normal `openclaw update --yes --json` arrêter le service, remplacer le
package, actualiser les métadonnées du service, redémarrer, vérifier la version et
l’accessibilité du Gateway, et récupérer un LaunchAgent macOS installé mais non chargé lorsque
c’est possible. Si le Gateway ne peut pas effectuer ce transfert en toute sécurité, `update.run` signale une
commande shell sûre au lieu d’exécuter le gestionnaire de packages dans le processus.

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

- Exécutez à nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur les checkouts source, le programme de mise à jour amorce automatiquement `pnpm` lorsque nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) et relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Connexe

- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : vérifications de santé après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration de version majeure.
