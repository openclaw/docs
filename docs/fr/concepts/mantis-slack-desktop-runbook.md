---
read_when:
    - Exécution de l’assurance qualité de bureau Mantis Slack depuis GitHub ou localement
    - Débogage des exécutions lentes de Mantis Slack Desktop
    - Choisir le mode source, préhydraté ou warm-lease
    - Publication de preuves par capture d’écran et vidéo dans une PR
summary: 'Manuel d’exploitation pour l’assurance qualité du bureau Slack Mantis : déclenchement GitHub, CLI local, baux VNC préchauffés, modes d’hydratation, interprétation des délais, artefacts et gestion des échecs.'
title: Runbook de bureau Mantis Slack
x-i18n:
    generated_at: "2026-06-27T17:24:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA est la voie d’interface réelle pour les bugs de classe Slack qui nécessitent un bureau Linux, une récupération VNC, Slack Web, un vrai Gateway OpenClaw, des captures d’écran, des vidéos et un commentaire de preuve sur la PR.

Utilisez-la lorsque les tests unitaires ou la voie Slack live sans interface graphique ne peuvent pas prouver le bug.

## Modèle de stockage

Mantis utilise trois couches de stockage différentes :

- Image du fournisseur : propriété de Crabbox et stockée dans le compte du fournisseur cloud.
  Elle contient des capacités machine comme Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, les outils de compilation natifs et des répertoires de cache vides.
- État de réservation chaude : propriété de la session opérateur actuelle. Il peut contenir un
  profil de navigateur connecté, `/var/cache/crabbox/pnpm` et un checkout source
  préparé tant que la réservation est active.
- Artefacts Mantis : propriété de l’exécution OpenClaw. Ils résident sous
  `.artifacts/qa-e2e/mantis/...`, puis GitHub Actions les téléverse et la
  Mantis GitHub App commente les preuves en ligne sur la PR.

Ne placez jamais de secrets, de cookies de navigateur, d’état de connexion Slack, de checkouts de dépôt,
`node_modules` ni `dist/` dans une image fournisseur précuite.

## Déclenchement GitHub

Exécutez le flux de travail depuis `main` :

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

Les valeurs autorisées de `candidate_ref` sont volontairement limitées, car le flux de travail
utilise des identifiants live : ascendance actuelle de `main`, tags de publication ou tête d’une PR ouverte
depuis `openclaw/openclaw`.

Le flux de travail écrit :

- artefact téléversé : `mantis-slack-desktop-smoke-<run-id>-<attempt>` ;
- commentaire de PR en ligne depuis la Mantis GitHub App ;
- `slack-desktop-smoke.png` ;
- `slack-desktop-smoke.mp4` ;
- `slack-desktop-smoke-preview.gif` ;
- `slack-desktop-smoke-change.mp4` ;
- `mantis-slack-desktop-smoke-summary.json` ;
- `mantis-slack-desktop-smoke-report.md` ;
- journaux distants comme `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` et `ffmpeg.log`.

Le commentaire de PR est mis à jour sur place grâce au marqueur caché
`<!-- mantis-slack-desktop-smoke -->`.

## CLI locale

Preuve source à froid :

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

Conserver la VM pour une récupération VNC :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ouvrir VNC :

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Réutiliser une réservation chaude :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
dispose déjà de `node_modules` et d’un `dist/` compilé. Mantis échoue en mode fermé s’ils
sont absents.

Prouver l’interface d’approbation Slack native :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Le mode point de contrôle d’approbation est mutuellement exclusif avec `--gateway-setup`. Il exécute
les scénarios optionnels `slack-approval-exec-native` et `slack-approval-plugin-native`,
sauf si vous passez des indicateurs `--scenario` explicites pour les points de contrôle d’approbation ; les autres
scénarios Slack sont rejetés avant le démarrage de la VM. Le lanceur Slack QA écrit
chaque fichier JSON de point de contrôle à partir du vrai message d’API Slack qu’il a observé, puis le
surveillant distant rend cet instantané de message dans
`approval-checkpoints/<scenario>-pending.png` et
`approval-checkpoints/<scenario>-resolved.png`. L’exécution échoue si un JSON de point de contrôle,
une preuve de message, un JSON d’accusé de réception ou une capture d’écran rendue est manquant ou vide.

Les réservations GitHub Actions à froid n’ont pas de cookies Slack Web, donc leur capture
de navigateur peut arriver sur la page de connexion Slack. Pour la preuve de point de contrôle d’approbation, fiez-vous aux
images de point de contrôle rendues et aux artefacts Slack QA plutôt qu’à
`slack-desktop-smoke.png`. Utilisez une réservation chaude conservée avec un profil Slack Web
connecté manuellement uniquement lorsque la capture d’écran du navigateur elle-même doit montrer Slack Web.

## Modes d’hydratation

| Mode          | À utiliser lorsque                         | Comportement distant                                                                  | Compromis                                                |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Preuve normale de PR, machines froides, CI | Exécute `pnpm install --frozen-lockfile --prefer-offline` et `pnpm build` dans la VM | Le plus lent, preuve de checkout source la plus robuste  |
| `prehydrated` | Vous avez préparé volontairement une réservation réutilisée | Nécessite des `node_modules` et un `dist/` existants ; saute installation/compilation | Rapide, mais valide uniquement pour les réservations chaudes contrôlées par l’opérateur |

GitHub Actions prépare toujours le checkout candidat avant l’exécution dans la VM. Son
store pnpm est mis en cache par OS, version de Node et lockfile. L’exécution source dans la VM
utilise aussi `/var/cache/crabbox/pnpm` lorsqu’il est présent.

## Interprétation des durées

`mantis-slack-desktop-smoke-report.md` inclut les durées par phase :

- `crabbox.warmup` : démarrage du fournisseur cloud, disponibilité du bureau/navigateur et SSH.
- `crabbox.inspect` : recherche des métadonnées de réservation.
- `credentials.prepare` : acquisition de la réservation d’identifiants Convex.
- `crabbox.remote_run` : synchronisation, lancement du navigateur, installation/compilation OpenClaw ou
  validation de l’hydratation, démarrage du Gateway, capture d’écran et capture vidéo.
- `artifacts.copy` : rsync de retour depuis la VM.

`crabbox.remote_run` peut être marqué `accepted` lorsque Crabbox renvoie un statut distant
non nul après que Mantis a copié les métadonnées prouvant que soit la configuration du Gateway OpenClaw
s’est terminée, soit la commande Slack QA elle-même s’est terminée avec succès.
Traitez `accepted` comme une réussite avec explication, pas comme un scénario échoué.

Si l’exécution est lente :

- warmup domine : précuisez ou promouvez une meilleure image fournisseur Crabbox ;
- remote_run domine en mode `source` : utilisez une réservation chaude, améliorez la réutilisation du store pnpm
  ou déplacez les prérequis machine dans l’image fournisseur ;
- remote_run domine en mode `prehydrated` : l’espace de travail distant n’était pas réellement
  prêt, ou la configuration du Gateway/navigateur/Slack est lente ;
- la copie d’artefacts domine : inspectez la taille des vidéos et le contenu du répertoire d’artefacts.

## Liste de contrôle des preuves

Un bon commentaire de PR doit montrer :

- l’id de scénario et le SHA candidat ;
- l’URL d’exécution GitHub Actions ;
- l’URL d’artefact ;
- une capture d’écran de point de contrôle d’approbation en ligne, ou une capture d’écran Slack Web depuis une
  réservation chaude connectée ;
- un aperçu animé en ligne lorsqu’il est disponible ;
- les liens MP4 complet et MP4 tronqué ;
- le statut réussite/échec ;
- le résumé des durées dans le rapport joint.

Ne commitez pas de captures d’écran ou de vidéos dans le dépôt. Conservez-les dans les
artefacts GitHub Actions ou dans le commentaire de PR.

## Gestion des échecs

Si le flux de travail échoue avant l’exécution dans la VM, inspectez d’abord le job Actions. Les causes
typiques sont un `candidate_ref` non approuvé, des secrets d’environnement manquants ou un échec
d’installation/compilation du candidat.

Si l’exécution dans la VM échoue mais que les captures d’écran ont été recopiées, inspectez :

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Si l’exécution a conservé la réservation, ouvrez VNC avec la commande `crabbox vnc ...` du rapport.
Arrêtez la réservation une fois terminé :

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Si la connexion Slack a expiré, réparez-la dans VNC sur une réservation conservée et relancez avec
`--lease-id`. N’intégrez pas ce profil de navigateur dans une image fournisseur.

## Connexe

- [Vue d’ensemble QA](/fr/concepts/qa-e2e-automation)
- [Canal Slack](/fr/channels/slack)
- [Tests](/fr/help/testing)
