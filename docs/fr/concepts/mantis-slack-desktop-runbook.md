---
read_when:
    - Exécuter l’assurance qualité de l’application de bureau Slack de Mantis depuis GitHub ou en local
    - Débogage des exécutions lentes de Mantis sur Slack Desktop
    - Choisir le mode source, préhydraté ou bail à chaud
    - Publier des preuves sous forme de captures d’écran et de vidéos sur une PR
summary: 'Guide d’exploitation opérateur pour la QA de bureau Mantis Slack : déclenchement GitHub, CLI locale, baux VNC préchauffés, modes d’hydratation, interprétation des délais, artefacts et gestion des échecs.'
title: Guide d’exploitation de Mantis Slack sur ordinateur
x-i18n:
    generated_at: "2026-05-06T07:18:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

La QA du bureau Slack Mantis est la voie d’interface réelle pour les bogues de classe Slack qui nécessitent un
bureau Linux, un secours VNC, Slack Web, un vrai Gateway OpenClaw, des captures d’écran,
des vidéos et un commentaire de preuve sur la PR.

Utilisez-la lorsque les tests unitaires ou la voie live Slack sans interface ne peuvent pas prouver le bogue.

## Modèle de stockage

Mantis utilise trois couches de stockage différentes :

- Image du fournisseur : détenue par Crabbox et stockée dans le compte du fournisseur cloud.
  Elle contient les capacités de la machine comme Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, les outils de build natifs et des répertoires de cache vides.
- État du bail chaud : détenu par la session de l’opérateur actuel. Il peut contenir un
  profil de navigateur connecté, `/var/cache/crabbox/pnpm` et un checkout source préparé
  tant que le bail est actif.
- Artefacts Mantis : détenus par l’exécution OpenClaw. Ils résident sous
  `.artifacts/qa-e2e/mantis/...`, puis GitHub Actions les téléverse et la
  GitHub App Mantis commente les preuves en ligne sur la PR.

Ne placez jamais de secrets, de cookies de navigateur, d’état de connexion Slack, de checkouts de dépôt,
`node_modules` ni `dist/` dans une image de fournisseur précuite.

## Dispatch GitHub

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

Les valeurs `candidate_ref` autorisées sont volontairement limitées, car le workflow
utilise des identifiants live : ascendance de `main` actuel, tags de version, ou tête de PR ouverte
depuis `openclaw/openclaw`.

Le workflow écrit :

- artefact téléversé : `mantis-slack-desktop-smoke-<run-id>-<attempt>` ;
- commentaire de PR en ligne depuis la GitHub App Mantis ;
- `slack-desktop-smoke.png` ;
- `slack-desktop-smoke.mp4` ;
- `slack-desktop-smoke-preview.gif` ;
- `slack-desktop-smoke-change.mp4` ;
- `mantis-slack-desktop-smoke-summary.json` ;
- `mantis-slack-desktop-smoke-report.md` ;
- journaux distants comme `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` et `ffmpeg.log`.

Le commentaire de PR est mis à jour sur place grâce au marqueur masqué
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

Conservez la VM pour un secours VNC :

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

Réutiliser un bail chaud :

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Utilisez `--hydrate-mode prehydrated` uniquement lorsque l’espace de travail distant réutilisé
a déjà `node_modules` et un `dist/` construit. Mantis échoue en mode fermé s’ils sont
absents.

## Modes d’hydratation

| Mode          | À utiliser quand                         | Comportement distant                                                                 | Compromis                                                |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Preuve de PR normale, machines froides, CI | Exécute `pnpm install --frozen-lockfile --prefer-offline` et `pnpm build` dans la VM | Plus lent, preuve de checkout source la plus forte       |
| `prehydrated` | Vous avez préparé intentionnellement un bail réutilisé | Nécessite `node_modules` et `dist/` existants ; ignore install/build                  | Rapide, mais valide uniquement pour les baux chauds contrôlés par l’opérateur |

GitHub Actions prépare toujours le checkout candidat avant l’exécution de la VM. Son
store pnpm est mis en cache par OS, version de Node et lockfile. L’exécution source dans la VM utilise aussi
`/var/cache/crabbox/pnpm` lorsqu’il est présent.

## Interprétation du minutage

`mantis-slack-desktop-smoke-report.md` inclut les durées par phase :

- `crabbox.warmup` : démarrage du fournisseur cloud, disponibilité du bureau/navigateur et SSH.
- `crabbox.inspect` : recherche des métadonnées du bail.
- `credentials.prepare` : acquisition du bail d’identifiants Convex.
- `crabbox.remote_run` : synchronisation, lancement du navigateur, install/build OpenClaw ou
  validation d’hydratation, démarrage du Gateway, capture d’écran et capture vidéo.
- `artifacts.copy` : rsync de retour depuis la VM.

`crabbox.remote_run` peut être marqué `accepted` lorsque Crabbox renvoie un statut distant
non nul après que Mantis a copié les métadonnées prouvant que le Gateway OpenClaw
est actif et que la configuration est terminée. Traitez `accepted` comme une réussite avec explication,
pas comme un scénario échoué.

Si l’exécution est lente :

- warmup domine : précuisez ou promouvez une meilleure image de fournisseur Crabbox ;
- remote_run domine en `source` : utilisez un bail chaud, améliorez la réutilisation du store pnpm,
  ou déplacez les prérequis machine dans l’image du fournisseur ;
- remote_run domine en `prehydrated` : l’espace de travail distant n’était pas réellement
  prêt, ou la configuration du Gateway/navigateur/Slack est lente ;
- la copie des artefacts domine : inspectez la taille de la vidéo et le contenu du répertoire d’artefacts.

## Liste de contrôle des preuves

Un bon commentaire de PR doit afficher :

- identifiant du scénario et SHA candidat ;
- URL de l’exécution GitHub Actions ;
- URL de l’artefact ;
- capture d’écran en ligne ;
- aperçu animé en ligne lorsqu’il est disponible ;
- liens MP4 complet et MP4 rogné ;
- statut réussite/échec ;
- résumé des durées dans le rapport joint.

Ne committez pas de captures d’écran ni de vidéos dans le dépôt. Conservez-les dans les
artefacts GitHub Actions ou le commentaire de PR.

## Gestion des échecs

Si le workflow échoue avant l’exécution de la VM, inspectez d’abord le job Actions. Les causes
typiques sont un `candidate_ref` non fiable, des secrets d’environnement manquants, ou un échec
d’installation/build du candidat.

Si l’exécution de la VM échoue mais que les captures d’écran ont été recopiées, inspectez :

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Si l’exécution a conservé le bail, ouvrez VNC avec la commande `crabbox vnc ...` du rapport.
Arrêtez le bail une fois terminé :

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Si la connexion Slack a expiré, réparez-la dans VNC sur un bail conservé et relancez avec
`--lease-id`. Ne précuisez pas ce profil de navigateur dans une image de fournisseur.

## Associé

- [Vue d’ensemble de la QA](/fr/concepts/qa-e2e-automation)
- [Canal Slack](/fr/channels/slack)
- [Tests](/fr/help/testing)
