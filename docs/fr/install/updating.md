---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mise à jour sécurisée d’OpenClaw (installation globale ou depuis les sources), avec stratégie de retour à la version précédente
title: Mise à jour
x-i18n:
    generated_at: "2026-07-12T15:34:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Maintenez OpenClaw à jour.

Pour les remplacements d’images Docker, Podman et Kubernetes, consultez
[Mettre à niveau les images de conteneur](/fr/install/docker#upgrading-container-images). Le
Gateway effectue avant d’être prêt les opérations de mise à niveau sûres au démarrage et se ferme si
l’état monté nécessite une réparation manuelle.

## Recommandé : `openclaw update`

Détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

```bash
openclaw update
```

Changez de canal ou ciblez une version spécifique :

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # aperçu sans application
```

`openclaw update` ne comporte pas d’option `--verbose` (contrairement au programme d’installation). Pour le diagnostic, utilisez
`--dry-run` afin de prévisualiser les actions prévues, `--json` pour obtenir des résultats structurés, ou
`openclaw update status --json` pour examiner l’état du canal et de la disponibilité.

`--channel beta` privilégie le dist-tag npm bêta, mais revient à stable/latest
lorsque le tag bêta est absent ou que sa version est antérieure à la dernière version
stable. Utilisez plutôt `--tag beta` pour une mise à jour ponctuelle du paquet épinglée au
dist-tag npm bêta brut.

`--channel extended-stable` est réservé aux paquets, et l’installation s’effectue
uniquement au premier plan. OpenClaw lit le sélecteur npm public `extended-stable`,
vérifie le paquet exact sélectionné et installe cette version exacte. Des données de
registre absentes ou incohérentes provoquent un échec en mode fermé ; aucun retour à `latest`
n’est effectué. Si la version sélectionnée est antérieure à la version installée, la
confirmation normale de rétrogradation s’applique toujours. La CLI conserve le canal après une
mise à jour réussie du cœur ; une commande directe `npm install -g openclaw@extended-stable`
ne met pas à jour `update.channel`.
Après le remplacement du cœur, les plugins npm officiels admissibles avec une intention
nue/par défaut ou `latest` convergent vers cette version exacte du cœur. Les épinglages exacts et les
tags explicites autres que `latest`, les plugins tiers et les sources autres que npm restent inchangés.
Les installations depuis le catalogue créées par les versions actuelles d’OpenClaw conservent cette intention
par défaut. Les anciens enregistrements qui contiennent uniquement une version exacte restent épinglés, car
OpenClaw ne peut pas distinguer de manière sûre un ancien épinglage automatique d’un épinglage utilisateur ; exécutez
une fois `openclaw plugins update @openclaw/name` sur le canal extended-stable
pour réactiver le suivi de la version exacte du cœur pour ce plugin.

`--channel dev` fournit un checkout persistant et évolutif de la branche GitHub `main`. Pour une mise à jour
ponctuelle du paquet, `--tag main` correspond à la spécification de paquet
`github:openclaw/openclaw#main` et l’installe directement via le gestionnaire de paquets cible (npm/pnpm/bun).

Pour les plugins gérés, l’absence d’une version bêta constitue un avertissement, et non un échec : la
mise à jour du cœur peut tout de même réussir tandis qu’un plugin revient à sa version
par défaut/latest enregistrée.

Consultez [Canaux de publication](/fr/install/development-channels) pour connaître la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux pour changer de type d’installation. Le programme de mise à jour conserve votre état, votre configuration,
vos identifiants et votre espace de travail dans `~/.openclaw` ; il modifie uniquement l’installation du code OpenClaw
utilisée par la CLI et le Gateway.

```bash
# installation du paquet npm -> checkout git modifiable
openclaw update --channel dev

# checkout git -> installation du paquet npm
openclaw update --channel stable
```

Prévisualisez d’abord le changement de mode d’installation :

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantit la présence d’un checkout git, le compile et installe la CLI globale depuis ce
checkout. Les canaux `stable`, `extended-stable` et `beta` utilisent des installations de
paquets. Extended-stable est refusé sur un checkout git sans le modifier ni
le convertir. Si le Gateway est déjà installé, `openclaw update` actualise
les métadonnées du service et le redémarre, sauf si vous transmettez `--no-restart`.

Pour les installations de paquets avec un service Gateway géré, `openclaw update` cible
la racine du paquet utilisée par ce service. Si la commande `openclaw` du shell provient
d’une autre installation, le programme de mise à jour affiche les deux racines et le chemin Node
du service géré, puis vérifie cette version de Node par rapport à l’exigence
`engines.node` de la version cible avant de remplacer le paquet.

## Alternative : réexécuter le programme d’installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’intégration initiale. Pour imposer un type d’installation spécifique, transmettez
`--install-method git --no-onboard` ou `--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du paquet npm, réexécutez plutôt le
programme d’installation. Il n’appelle pas le programme de mise à jour ; il exécute directement l’installation globale
du paquet et peut restaurer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Épinglez la récupération à une version ou à un dist-tag spécifique avec `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative : npm, pnpm ou bun manuellement

```bash
npm i -g openclaw@latest
```

Préférez `openclaw update` pour les installations supervisées : cette commande peut coordonner le remplacement du paquet
avec le service Gateway en cours d’exécution. Si vous effectuez une mise à jour manuelle sur une installation supervisée,
arrêtez d’abord le Gateway géré. Les gestionnaires de paquets remplacent les fichiers
sur place, et un Gateway en cours d’exécution pourrait sinon tenter de charger des fichiers du cœur ou de plugins
pendant le remplacement. Redémarrez le Gateway lorsque le gestionnaire de paquets a terminé afin qu’il utilise
la nouvelle installation.

Pour une installation globale à l’échelle du système Linux appartenant à root, si `openclaw update` échoue avec
`EACCES`, effectuez la récupération avec le npm système tout en maintenant le Gateway arrêté pendant le
remplacement manuel. Utilisez les mêmes options de profil et le même environnement que ceux que vous utilisez habituellement pour
ce Gateway. Remplacez `/usr/bin/npm` par le npm système qui possède le
préfixe global appartenant à root sur votre hôte :

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Vérifiez ensuite :

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Lorsque `openclaw update` gère une installation npm globale, il installe d’abord la cible
dans un préfixe npm temporaire, vérifie l’inventaire `dist` du paquet, puis
remplace l’arborescence propre du paquet dans le véritable préfixe global, évitant ainsi que npm
superpose un nouveau paquet aux fichiers obsolètes de l’ancien. Si la commande
d’installation échoue, OpenClaw réessaie une fois avec `--omit=optional`, ce qui aide sur les hôtes
où les dépendances natives facultatives ne peuvent pas être compilées.

Les commandes de mise à jour npm et de mise à jour des plugins gérées par OpenClaw effacent également la
quarantaine de la chaîne d’approvisionnement `min-release-age` de npm (ou l’ancienne clé de configuration `before`)
pour le processus npm enfant. Cette politique assure une protection générale, mais une
mise à jour explicite d’OpenClaw signifie « installer maintenant la version sélectionnée ».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Sujets avancés relatifs à l’installation npm

<AccordionGroup>
  <Accordion title="Arborescence de paquets en lecture seule">
    OpenClaw traite les installations globales empaquetées comme étant en lecture seule lors de l’exécution, même lorsque le répertoire global des paquets est accessible en écriture par l’utilisateur actuel. Les installations de paquets de plugins résident dans des racines npm/git appartenant à OpenClaw sous le répertoire de configuration de l’utilisateur, et le démarrage du Gateway ne modifie pas l’arborescence des paquets OpenClaw.

    Certaines configurations npm sous Linux installent les paquets globaux dans des répertoires appartenant à root, tels que `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition, car les commandes d’installation et de mise à jour des plugins écrivent en dehors de ce répertoire global de paquets.

  </Accordion>
  <Accordion title="Unités systemd renforcées">
    Accordez à OpenClaw un accès en écriture à ses racines de configuration et d’état afin que les installations explicites de plugins, les mises à jour de plugins et le nettoyage effectué par doctor puissent conserver leurs modifications :

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Vérification préalable de l’espace disque">
    Avant les mises à jour de paquets et les installations explicites de plugins, OpenClaw tente d’effectuer au mieux une vérification de l’espace disque pour le volume cible. Un espace insuffisant génère un avertissement indiquant le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas du système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation réelle par le gestionnaire de paquets et la vérification après installation restent déterminantes.
  </Accordion>
</AccordionGroup>

## Programme de mise à jour automatique

Désactivé par défaut. Activez-le dans `~/.openclaw/openclaw.json` :

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

| Canal             | Comportement                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Attend `stableDelayHours` (valeur par défaut : 6), puis applique la mise à jour avec une gigue déterministe sur `stableJitterHours` (valeur par défaut : 12) afin d’échelonner le déploiement. |
| `extended-stable` | Recherche une indication de mise à jour en lecture seule au démarrage et toutes les 24 heures lorsque `checkOnStart` est activé. Ne l’applique jamais automatiquement.                    |
| `beta`            | Vérifie toutes les `betaCheckIntervalHours` (valeur par défaut : 1) et applique immédiatement la mise à jour.                                                                              |
| `dev`             | Aucune application automatique. Utilisez `openclaw update` manuellement.                                                                                                                  |

Le Gateway consigne également une indication de mise à jour au démarrage (désactivez-la avec
`update.checkOnStart: false`). Les sélections extended-stable enregistrées utilisent ce
chemin d’indication en lecture seule et l’intervalle d’indication existant de 24 heures, mais ne déclenchent jamais
d’installation automatique, de transfert, de redémarrage, de délai/gigue stable ni d’interrogation bêta.
Pour une rétrogradation ou une récupération après incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway afin de bloquer les applications automatiques même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours s’exécuter, sauf si `update.checkOnStart` est également désactivé.

Les mises à jour du gestionnaire de paquets demandées via le plan de contrôle actif du Gateway
(`update.run`) ne remplacent pas l’arborescence des paquets dans le processus Gateway
en cours d’exécution. Sur les installations avec service géré, le Gateway lance un transfert détaché,
se ferme et laisse le chemin normal de la CLI `openclaw update --yes --json` arrêter le
service, remplacer le paquet, actualiser les métadonnées du service, redémarrer, vérifier la
version et l’accessibilité du Gateway, et restaurer si possible un LaunchAgent macOS
installé mais non chargé. Si le Gateway ne peut pas effectuer ce transfert en toute sécurité,
`update.run` fournit une commande shell sûre au lieu d’exécuter le gestionnaire de
paquets dans le processus.

La carte de mise à jour de la barre latérale de l’interface de contrôle lance ce même flux `update.run`. Dans
l’application macOS signée, la carte met d’abord à jour l’application via Sparkle ; après la relance,
l’application met son Gateway local géré à la version correspondante.

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

- Exécutez de nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur les checkouts du code source, le programme de mise à jour initialise automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’initialisation pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`), puis relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Contenu associé

- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : vérifications de l’état après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration entre versions majeures.
