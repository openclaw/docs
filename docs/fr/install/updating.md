---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mise à jour sécurisée d’OpenClaw (installation globale ou depuis les sources), avec stratégie de retour à la version précédente
title: Mise à jour
x-i18n:
    generated_at: "2026-07-12T02:45:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Maintenez OpenClaw à jour.

Pour le remplacement des images Docker, Podman et Kubernetes, consultez
[Mettre à niveau les images de conteneur](/fr/install/docker#upgrading-container-images). Le
Gateway exécute les opérations de mise à niveau sûres au démarrage avant d’être prêt et s’arrête si
l’état monté nécessite une réparation manuelle.

## Recommandé : `openclaw update`

Détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre le Gateway.

```bash
openclaw update
```

Changez de canal ou ciblez une version précise :

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # aperçu sans application
```

`openclaw update` ne possède pas d’option `--verbose` (contrairement au programme d’installation). Pour le diagnostic, utilisez
`--dry-run` afin de prévisualiser les actions prévues, `--json` pour obtenir des résultats structurés, ou
`openclaw update status --json` pour examiner l’état du canal et des versions disponibles.

`--channel beta` privilégie le dist-tag npm bêta, mais se rabat sur stable/latest
si le tag bêta est absent ou si sa version est antérieure à la dernière version
stable. Utilisez plutôt `--tag beta` pour une mise à jour ponctuelle du paquet épinglée directement
sur le dist-tag npm bêta.

`--channel extended-stable` est réservé aux paquets, et l’installation reste
exclusivement au premier plan. OpenClaw lit le sélecteur npm public `extended-stable`,
vérifie le paquet exact sélectionné et installe cette version précise. Des données
de registre absentes ou incohérentes provoquent un échec sans solution de repli ; le système ne se rabat jamais sur `latest`.
Si la version sélectionnée est antérieure à la version installée, la confirmation
habituelle de rétrogradation reste nécessaire. La CLI enregistre le canal après une
mise à jour réussie du cœur ; une commande directe `npm install -g openclaw@extended-stable`
ne met pas à jour `update.channel`.
Après le remplacement du cœur, les plugins npm officiels admissibles ayant une intention
nue/par défaut ou `latest` convergent vers cette version exacte du cœur. Les épinglages exacts et les tags explicites
autres que `latest`, les plugins tiers et les sources autres que npm restent inchangés.
Les installations depuis le catalogue créées par les versions actuelles d’OpenClaw conservent cette intention
par défaut. Les anciens enregistrements qui contiennent uniquement une version exacte restent épinglés, car
OpenClaw ne peut pas distinguer de manière fiable un ancien épinglage automatique d’un épinglage utilisateur ; exécutez
une fois `openclaw plugins update @openclaw/name` sur le canal extended-stable
pour réintégrer ce plugin au suivi exact de la version du cœur.

`--channel dev` fournit une copie de travail GitHub `main` mobile et persistante. Pour une mise à jour
ponctuelle du paquet, `--tag main` correspond à la spécification de paquet
`github:openclaw/openclaw#main` et l’installe directement avec le gestionnaire de paquets cible (npm/pnpm/bun).

Pour les plugins gérés, l’absence d’une version bêta produit un avertissement et non un échec :
la mise à jour du cœur peut tout de même réussir tandis qu’un plugin se rabat sur sa version
enregistrée par défaut/latest.

Consultez [Canaux de publication](/fr/install/development-channels) pour connaître la sémantique des canaux.

## Basculer entre les installations npm et git

Utilisez les canaux pour changer le type d’installation. Le programme de mise à jour conserve votre état, votre configuration,
vos identifiants et votre espace de travail dans `~/.openclaw` ; il modifie uniquement l’installation du code OpenClaw
utilisée par la CLI et le Gateway.

```bash
# installation du paquet npm -> copie de travail git modifiable
openclaw update --channel dev

# copie de travail git -> installation du paquet npm
openclaw update --channel stable
```

Prévisualisez d’abord le changement de mode d’installation :

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garantit la présence d’une copie de travail git, la compile et installe la CLI globale depuis cette
copie de travail. Les canaux `stable`, `extended-stable` et `beta` utilisent des installations
de paquets. Extended-stable est refusé sur une copie de travail git sans la modifier ni
la convertir. Si le Gateway est déjà installé, `openclaw update` actualise
les métadonnées du service et le redémarre, sauf si vous transmettez `--no-restart`.

Pour les installations de paquets dotées d’un service Gateway géré, `openclaw update` cible
la racine du paquet utilisée par ce service. Si la commande d’interpréteur `openclaw` provient
d’une autre installation, le programme de mise à jour affiche les deux racines ainsi que le chemin de Node
du service géré, puis vérifie cette version de Node par rapport à l’exigence
`engines.node` de la version cible avant de remplacer le paquet.

## Alternative : relancer le programme d’installation

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’intégration initiale. Pour imposer un type d’installation précis, transmettez
`--install-method git --no-onboard` ou `--install-method npm --no-onboard`.

Si `openclaw update` échoue après la phase d’installation du paquet npm, relancez plutôt le
programme d’installation. Celui-ci n’appelle pas le programme de mise à jour ; il exécute directement l’installation
globale du paquet et peut restaurer une installation npm partiellement mise à jour.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Épinglez la restauration sur une version ou un dist-tag précis avec `--version` :

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternative : utilisation manuelle de npm, pnpm ou bun

```bash
npm i -g openclaw@latest
```

Privilégiez `openclaw update` pour les installations supervisées : cette commande peut coordonner le remplacement
du paquet avec le service Gateway en cours d’exécution. Si vous effectuez une mise à jour manuelle sur une installation
supervisée, arrêtez d’abord le Gateway géré. Les gestionnaires de paquets remplacent les fichiers sur
place, et un Gateway en cours d’exécution pourrait autrement tenter de charger des fichiers du cœur ou de plugins
pendant le remplacement. Redémarrez le Gateway une fois le gestionnaire de paquets terminé afin qu’il utilise
la nouvelle installation.

Pour une installation Linux globale appartenant à root, si `openclaw update` échoue avec
`EACCES`, effectuez la restauration avec le npm système tout en maintenant le Gateway arrêté pendant le
remplacement manuel. Utilisez les mêmes options de profil et le même environnement que ceux que vous employez habituellement pour
ce Gateway. Remplacez `/usr/bin/npm` par le npm système qui possède le préfixe
global appartenant à root sur votre hôte :

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Vérifiez ensuite :

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Lorsque `openclaw update` gère une installation npm globale, il installe d’abord la cible
dans un préfixe npm temporaire, vérifie l’inventaire `dist` du paquet, puis
remplace l’arborescence propre du paquet dans le véritable préfixe global, ce qui évite que npm
superpose un nouveau paquet aux fichiers obsolètes de l’ancien. Si la commande
d’installation échoue, OpenClaw réessaie une fois avec `--omit=optional`, ce qui aide les hôtes
sur lesquels les dépendances natives facultatives ne peuvent pas être compilées.

Les commandes de mise à jour npm et de mise à jour des plugins gérées par OpenClaw désactivent également la
quarantaine de la chaîne d’approvisionnement `min-release-age` de npm (ou l’ancienne clé de configuration `before`)
pour le processus npm enfant. Cette politique offre une protection générale, mais une
mise à jour explicite d’OpenClaw signifie « installer maintenant la version sélectionnée ».

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Sujets avancés relatifs à l’installation npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw traite les installations globales de paquets comme étant en lecture seule pendant l’exécution, même lorsque le répertoire global du paquet est accessible en écriture par l’utilisateur actuel. Les installations de paquets de plugins résident dans des racines npm/git appartenant à OpenClaw sous le répertoire de configuration de l’utilisateur, et le démarrage du Gateway ne modifie pas l’arborescence du paquet OpenClaw.

    Certaines configurations npm sous Linux installent les paquets globaux dans des répertoires appartenant à root, tels que `/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette organisation, car les commandes d’installation et de mise à jour des plugins écrivent en dehors de ce répertoire global de paquets.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Accordez à OpenClaw un accès en écriture à ses racines de configuration et d’état afin que les installations explicites de plugins, les mises à jour de plugins et le nettoyage effectué par doctor puissent enregistrer leurs modifications :

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Avant les mises à jour de paquets et les installations explicites de plugins, OpenClaw tente d’effectuer une vérification indicative de l’espace disque disponible sur le volume cible. Un espace insuffisant génère un avertissement indiquant le chemin vérifié, mais ne bloque pas la mise à jour, car les quotas du système de fichiers, les instantanés et les volumes réseau peuvent changer après la vérification. L’installation effective par le gestionnaire de paquets et la vérification post-installation restent déterminantes.
  </Accordion>
</AccordionGroup>

## Mise à jour automatique

Désactivée par défaut. Activez-la dans `~/.openclaw/openclaw.json` :

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

| Canal             | Comportement                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Attend `stableDelayHours` (valeur par défaut : 6), puis applique la mise à jour avec une variation déterministe sur `stableJitterHours` (valeur par défaut : 12) afin d’échelonner le déploiement. |
| `extended-stable` | Recherche une indication de mise à jour en lecture seule au démarrage, puis toutes les 24 heures lorsque `checkOnStart` est activé. Ne l’applique jamais automatiquement. |
| `beta`            | Effectue une vérification toutes les `betaCheckIntervalHours` (valeur par défaut : 1) et applique immédiatement la mise à jour.                                      |
| `dev`             | Aucune application automatique. Utilisez manuellement `openclaw update`.                                                                                            |

Le Gateway consigne également une indication de mise à jour au démarrage (désactivez-la avec
`update.checkOnStart: false`). Les sélections extended-stable enregistrées utilisent ce
mécanisme d’indication en lecture seule et l’intervalle d’indication existant de 24 heures, mais ne déclenchent jamais
d’installation automatique, de transfert, de redémarrage, de délai/variation stable ni d’interrogation bêta.
Pour une rétrogradation ou une récupération après incident, définissez `OPENCLAW_NO_AUTO_UPDATE=1` dans l’environnement du Gateway afin de bloquer les applications automatiques même lorsque `update.auto.enabled` est configuré. Les indications de mise à jour au démarrage peuvent toujours être exécutées, sauf si `update.checkOnStart` est également désactivé.

Les mises à jour du gestionnaire de paquets demandées par l’intermédiaire du plan de contrôle du Gateway actif
(`update.run`) ne remplacent pas l’arborescence du paquet dans le processus Gateway
en cours d’exécution. Sur les installations avec service géré, le Gateway lance un transfert détaché,
s’arrête et laisse le parcours normal de la CLI `openclaw update --yes --json` arrêter le
service, remplacer le paquet, actualiser les métadonnées du service, redémarrer, vérifier la
version et l’accessibilité du Gateway, et restaurer si possible un LaunchAgent macOS
installé mais non chargé. Si le Gateway ne peut pas effectuer ce transfert de manière sûre,
`update.run` indique une commande d’interpréteur sûre au lieu d’exécuter le gestionnaire de
paquets dans le processus.

La carte de mise à jour de la barre latérale de l’interface de contrôle lance ce même parcours `update.run`. Dans
l’application macOS signée, la carte met d’abord à jour l’application avec Sparkle ; après la relance,
l’application aligne son Gateway local géré sur la même version.

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de messages privés et vérifie l’état du Gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le Gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Retour à une version antérieure

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

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez à nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur les copies de travail des sources, le programme de mise à jour initialise automatiquement `pnpm` si nécessaire. Si vous rencontrez une erreur d’initialisation de pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`), puis relancez la mise à jour.
- Consultez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Diagnostic](/fr/gateway/doctor) : vérifications de l’état après les mises à jour.
- [Migration](/fr/install/migrating) : guides de migration entre versions majeures.
