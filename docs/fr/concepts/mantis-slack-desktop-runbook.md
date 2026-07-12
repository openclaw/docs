---
read_when:
    - Exécution de l’assurance qualité de l’application de bureau Slack Mantis depuis GitHub ou en local
    - Débogage des exécutions lentes de Mantis dans l’application de bureau Slack
    - Choisir le mode source, préhydraté ou bail préchauffé
    - Publication de captures d’écran et de preuves vidéo dans une PR
summary: 'Guide d’exploitation pour l’assurance qualité de Mantis dans l’application de bureau Slack : déclenchement GitHub, CLI locale, baux VNC préchauffés, modes d’hydratation, interprétation des durées, artefacts et gestion des échecs.'
title: Guide d’exploitation de Mantis pour l’application de bureau Slack
x-i18n:
    generated_at: "2026-07-12T02:47:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Le QA de bureau Mantis pour Slack est le parcours avec interface réelle destiné aux bugs de type Slack qui nécessitent un
bureau Linux, une intervention de secours via VNC, Slack Web, un véritable Gateway OpenClaw, des captures d’écran,
des vidéos et un commentaire de preuve sur une PR. Utilisez-le lorsque les tests unitaires ou le
parcours Slack réel sans interface graphique ne permettent pas de démontrer le bug.

## Modèle de stockage

Mantis utilise trois couches de stockage :

- **Image du fournisseur** - gérée par Crabbox et stockée dans le compte du fournisseur cloud.
  Elle contient les capacités de la machine (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, outils de compilation natifs) et des répertoires de cache vides.
- **État du bail actif** - géré par la session actuelle de l’opérateur. Il peut contenir un
  profil de navigateur authentifié, `/var/cache/crabbox/pnpm` et une copie de travail des sources
  préparée tant que le bail reste actif.
- **Artefacts Mantis** - générés par l’exécution OpenClaw. Ils se trouvent sous
  `.artifacts/qa-e2e/mantis/...` ; GitHub Actions les téléverse et l’application GitHub Mantis
  ajoute des preuves intégrées dans un commentaire sur la PR.

N’intégrez jamais de secrets, de cookies de navigateur, d’état de connexion Slack, de copies de travail de dépôts,
de `node_modules` ni de `dist/` dans une image de fournisseur.

## Déclenchement GitHub

Exécutez le workflow depuis `main` :

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` est restreint, car le workflow utilise de véritables identifiants : il
doit correspondre à un ancêtre de la version actuelle de `main`, à une balise de publication ou à la tête d’une PR ouverte dans
`openclaw/openclaw`.

Le workflow produit :

- l’artefact téléversé `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- un commentaire intégré sur la PR provenant de l’application GitHub Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- les journaux distants : `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Le commentaire de la PR est mis à jour sur place grâce au marqueur masqué `<!-- mantis-slack-desktop-smoke -->`.

## CLI locale

Preuve à froid depuis les sources :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Conservez la machine virtuelle pour une intervention de secours via VNC :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ouvrez VNC :

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Réutilisez un bail actif :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
contient déjà `node_modules` et un `dist/` compilé ; sinon, Mantis échoue par sécurité.

Démontrez l’interface native d’approbation de Slack :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` et `--gateway-setup` sont mutuellement exclusifs. Cette option exécute
les scénarios facultatifs `slack-approval-exec-native` et `slack-approval-plugin-native`,
sauf si vous transmettez explicitement un `--scenario` de point de contrôle d’approbation ; les autres
scénarios Slack sont rejetés avant le démarrage de la machine virtuelle. Le programme d’exécution du QA Slack écrit
chaque fichier JSON de point de contrôle à partir du véritable message de l’API Slack qu’il a observé, puis
le processus de surveillance distant affiche ce message dans
`approval-checkpoints/<scenario>-pending.png` et
`approval-checkpoints/<scenario>-resolved.png`. L’exécution échoue si un
fichier JSON de point de contrôle, une preuve de message, un fichier JSON d’accusé de réception ou une capture d’écran générée est manquant
ou vide.

Les baux GitHub Actions à froid ne contiennent aucun cookie Slack Web ; leur capture du navigateur
peut donc afficher l’écran de connexion Slack. Pour démontrer les points de contrôle d’approbation, fiez-vous aux
images générées des points de contrôle et aux artefacts du QA Slack plutôt qu’à
`slack-desktop-smoke.png`. Utilisez uniquement un bail actif conservé avec un profil Slack Web
connecté manuellement lorsque la capture d’écran du navigateur doit elle-même afficher
Slack Web.

## Modes d’hydratation

| Mode          | À utiliser lorsque                         | Comportement distant                                                                    | Compromis                                                            |
| ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `source`      | Preuve normale de PR, machines à froid, CI | Exécute `pnpm install --frozen-lockfile --prefer-offline` et `pnpm build` dans la machine virtuelle | Le plus lent, mais offre la preuve la plus solide depuis les sources |
| `prehydrated` | Vous avez volontairement préparé un bail réutilisé | Nécessite `node_modules` et `dist/` existants ; ignore l’installation et la compilation | Rapide, mais valable uniquement pour les baux actifs gérés par l’opérateur |

GitHub Actions prépare toujours la copie de travail candidate avant l’exécution dans la machine virtuelle. Son
magasin pnpm est mis en cache selon le système d’exploitation, la version de Node et le fichier de verrouillage. L’exécution `source`
dans la machine virtuelle réutilise également `/var/cache/crabbox/pnpm` lorsqu’il est présent.

## Interprétation des durées

`mantis-slack-desktop-smoke-report.md` inclut les durées des phases :

- `crabbox.warmup` - démarrage du fournisseur cloud, préparation du bureau et du navigateur, SSH.
- `crabbox.inspect` - recherche des métadonnées du bail.
- `credentials.prepare` - acquisition d’un bail d’identifiants Convex.
- `crabbox.remote_run` - synchronisation, lancement du navigateur, installation/compilation d’OpenClaw ou
  validation de l’hydratation, démarrage du Gateway, capture d’écran et enregistrement vidéo.
- `artifacts.copy` - récupération par rsync depuis la machine virtuelle.

`crabbox.remote_run` peut afficher `accepted` lorsque Crabbox renvoie un état distant
non nul, mais que Mantis a copié des métadonnées prouvant soit que la configuration du Gateway OpenClaw
s’est terminée, soit que la commande du QA Slack elle-même s’est achevée correctement. Considérez
`accepted` comme une réussite avec explication, et non comme un scénario ayant échoué.

Si une exécution est lente :

- Le préchauffage domine : précompilez ou promouvez une meilleure image de fournisseur Crabbox.
- `remote_run` domine en mode `source` : utilisez un bail actif, améliorez la réutilisation du magasin pnpm
  ou déplacez les prérequis de la machine dans l’image du fournisseur.
- `remote_run` domine en mode `prehydrated` : l’espace de travail distant n’était pas
  réellement prêt, ou la configuration du Gateway, du navigateur ou de Slack est lente.
- La copie des artefacts domine : examinez la taille de la vidéo et le contenu du répertoire des artefacts.

## Liste de contrôle des preuves

Un bon commentaire de PR présente :

- l’identifiant du scénario et le SHA candidat
- l’URL de l’exécution GitHub Actions et l’URL de l’artefact
- une capture d’écran intégrée du point de contrôle d’approbation, ou une capture d’écran de Slack Web issue d’un
  bail actif connecté
- un aperçu animé intégré lorsqu’il est disponible
- les liens vers le MP4 complet et le MP4 raccourci
- l’état de réussite ou d’échec et le récapitulatif des durées du rapport

N’intégrez pas de captures d’écran ni de vidéos au dépôt. Conservez-les dans les
artefacts GitHub Actions ou dans le commentaire de la PR.

## Gestion des échecs

Si le workflow échoue avant l’exécution dans la machine virtuelle, examinez d’abord la tâche Actions.
Causes typiques : `candidate_ref` non approuvée, secrets d’environnement manquants ou
échec de l’installation ou de la compilation du candidat.

Si l’exécution dans la machine virtuelle échoue, mais que les captures d’écran ont été récupérées, examinez :

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Si l’exécution a conservé le bail, ouvrez VNC avec la commande `crabbox vnc ...`
du rapport, puis arrêtez le bail lorsque vous avez terminé :

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Si la connexion Slack a expiré, rétablissez-la via VNC sur un bail conservé, puis relancez avec
`--lease-id`. N’intégrez pas ce profil de navigateur à une image de fournisseur.

## Voir aussi

- [Présentation du QA](/fr/concepts/qa-e2e-automation)
- [Canal Slack](/fr/channels/slack)
- [Tests](/fr/help/testing)
