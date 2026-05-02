---
read_when:
    - Vous voulez mettre à jour une copie de travail des sources en toute sécurité
    - Vous devez comprendre le comportement de raccourci de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour relativement sûre des sources + redémarrage automatique du Gateway)
title: Mettre à jour
x-i18n:
    generated_at: "2026-05-02T20:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Mettez à jour OpenClaw en toute sécurité et basculez entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour se font via le flux du gestionnaire de paquets dans [Mise à jour](/fr/install/updating).

## Utilisation

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Options

- `--no-restart` : ignorer le redémarrage du service Gateway après une mise à jour réussie. Les mises à jour via gestionnaire de paquets qui redémarrent le Gateway vérifient que le service redémarré indique la version mise à jour attendue avant que la commande ne réussisse.
- `--channel <stable|beta|dev>` : définir le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplacer la cible de paquet pour cette mise à jour uniquement. Pour les installations de paquets, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualiser les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire la configuration, installer, synchroniser les plugins ni redémarrer.
- `--json` : afficher le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.integrityDrifts` lorsqu’une dérive d’artefact de plugin npm est
  détectée pendant la synchronisation post-mise à jour des plugins.
- `--timeout <seconds>` : délai d’expiration par étape (valeur par défaut : 1800 s).
- `--yes` : ignorer les invites de confirmation (par exemple la confirmation de rétrogradation).

<Warning>
Les rétrogradations exigent une confirmation, car les anciennes versions peuvent casser la configuration.
</Warning>

## `update status`

Afficher le canal de mise à jour actif + le tag/la branche/le SHA git (pour les checkouts source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : afficher le JSON de statut lisible par machine.
- `--timeout <seconds>` : délai d’expiration pour les vérifications (valeur par défaut : 3 s).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (par défaut, il redémarre). Si vous sélectionnez `dev` sans checkout git, il
propose d’en créer un.

Options :

- `--timeout <seconds>` : délai d’expiration pour chaque étape de mise à jour (valeur par défaut : `1800`)

## Ce que cela fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw maintient aussi la
méthode d’installation alignée :

- `dev` → garantit un checkout git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  le met à jour et installe la CLI globale depuis ce checkout.
- `stable` → installe depuis npm avec `latest`.
- `beta` → privilégie le dist-tag npm `beta`, mais revient à `latest` lorsque beta est
  absent ou plus ancien que la version stable actuelle.

L’auto-updater du cœur Gateway (lorsqu’il est activé via la configuration) lance le chemin de mise à jour CLI
en dehors du gestionnaire de requêtes Gateway actif. Les mises à jour par gestionnaire de paquets
`update.run` du plan de contrôle forcent un redémarrage de mise à jour non différé et sans délai de refroidissement après le remplacement du paquet,
car l’ancien processus Gateway peut encore avoir en mémoire des fragments qui pointent vers
des fichiers supprimés par le nouveau paquet.

Pour les installations via gestionnaire de paquets, `openclaw update` résout la version du paquet cible
avant d’invoquer le gestionnaire de paquets. Les installations globales npm utilisent une installation préparée
par étapes : OpenClaw installe le nouveau paquet dans un préfixe npm temporaire, vérifie
l’inventaire `dist` empaqueté à cet endroit, puis remplace l’arborescence propre du paquet dans le
vrai préfixe global. Si la vérification échoue, le doctor post-mise à jour, la synchronisation des plugins et
le redémarrage ne s’exécutent pas depuis l’arborescence suspecte. Même lorsque la version installée
correspond déjà à la cible, la commande actualise l’installation globale du paquet,
puis exécute la synchronisation des plugins, une actualisation des complétions de commandes principales et le redémarrage. Cela
maintient les sidecars empaquetés et les enregistrements de plugins détenus par le canal alignés avec le build
OpenClaw installé, tout en laissant les reconstructions complètes de complétions de commandes de plugins aux
exécutions explicites de `openclaw completion --write-state`.

Lorsqu’un service Gateway géré localement est installé et que le redémarrage est activé,
les mises à jour via gestionnaire de paquets arrêtent le service en cours d’exécution avant de remplacer l’arborescence du paquet,
puis actualisent les métadonnées du service depuis l’installation mise à jour, redémarrent le
service et vérifient que le Gateway redémarré indique la version attendue. Avec
`--no-restart`, le remplacement du paquet s’exécute quand même, mais le service géré n’est pas
arrêté ni redémarré ; le Gateway en cours d’exécution peut donc conserver l’ancien code jusqu’à ce que vous le redémarriez
manuellement.

## Flux de checkout git

### Sélection du canal

- `stable` : checkout du dernier tag non beta, puis build et doctor.
- `beta` : privilégier le dernier tag `-beta`, mais revenir au dernier tag stable lorsque beta est absent ou plus ancien.
- `dev` : checkout de `main`, puis fetch et rebase.

### Étapes de mise à jour

<Steps>
  <Step title="Vérifier que le worktree est propre">
    Exige l’absence de changements non commités.
  </Step>
  <Step title="Changer de canal">
    Bascule vers le canal sélectionné (tag ou branche).
  </Step>
  <Step title="Récupérer l’amont">
    Dev uniquement.
  </Step>
  <Step title="Build de prévol (dev uniquement)">
    Exécute le lint et le build TypeScript dans un worktree temporaire. Si la pointe échoue, remonte jusqu’à 10 commits pour trouver le build propre le plus récent.
  </Step>
  <Step title="Rebase">
    Rebase sur le commit sélectionné (dev uniquement).
  </Step>
  <Step title="Installer les dépendances">
    Utilise le gestionnaire de paquets du dépôt. Pour les checkouts pnpm, l’updater amorce `pnpm` à la demande (d’abord via `corepack`, puis avec un fallback temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un workspace pnpm.
  </Step>
  <Step title="Builder l’interface utilisateur de contrôle">
    Builde le Gateway et l’interface utilisateur de contrôle.
  </Step>
  <Step title="Exécuter doctor">
    `openclaw doctor` s’exécute comme vérification finale de mise à jour sûre.
  </Step>
  <Step title="Synchroniser les plugins">
    Synchronise les plugins avec le canal actif. Dev utilise les plugins groupés ; stable et beta utilisent npm. Met à jour les installations de plugins suivies.
  </Step>
</Steps>

Sur le canal de mise à jour beta, les installations de plugins npm et ClawHub suivies qui suivent
la ligne par défaut/latest essaient d’abord une version de plugin `@beta`. Si le plugin n’a pas de
version beta, OpenClaw revient à la spec default/latest enregistrée. Les versions exactes
et les tags explicites ne sont pas réécrits.

<Warning>
Si une mise à jour de plugin npm épinglée à une version exacte se résout vers un artefact dont l’intégrité diffère de l’enregistrement d’installation stocké, `openclaw update` interrompt cette mise à jour d’artefact de plugin au lieu de l’installer. Réinstallez ou mettez à jour le plugin explicitement uniquement après avoir vérifié que vous faites confiance au nouvel artefact.
</Warning>

<Note>
Les échecs de synchronisation des plugins après mise à jour font échouer le résultat de mise à jour et arrêtent le travail de redémarrage de suivi. Corrigez l’erreur d’installation ou de mise à jour du plugin, puis relancez `openclaw update`.

Lorsque le Gateway mis à jour démarre, le chargement des plugins est en mode vérification uniquement : le démarrage n’exécute pas les gestionnaires de paquets et ne modifie pas les arborescences de dépendances. Les redémarrages `update.run` via gestionnaire de paquets contournent le report d’inactivité normal et le délai de refroidissement de redémarrage une fois l’arborescence du paquet remplacée, afin que l’ancien processus ne puisse pas continuer à charger paresseusement des fragments supprimés.

Si l’amorçage de pnpm échoue encore, l’updater s’arrête tôt avec une erreur propre au gestionnaire de paquets au lieu d’essayer `npm run build` dans le checkout.
</Note>

## Raccourci `--update`

`openclaw --update` se réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Associés

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les checkouts git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence CLI](/fr/cli)
