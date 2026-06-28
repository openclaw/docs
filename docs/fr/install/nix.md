---
read_when:
    - Vous souhaitez des installations reproductibles et réversibles
    - Vous utilisez déjà Nix/NixOS/Home Manager
    - Vous voulez que tout soit épinglé et géré de manière déclarative
summary: Installer OpenClaw de manière déclarative avec Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Installez OpenClaw de manière déclarative avec **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - le module Home Manager officiel et clé en main.

<Info>
Le dépôt [nix-openclaw](https://github.com/openclaw/nix-openclaw) est la source de vérité pour l’installation avec Nix. Cette page est un aperçu rapide.
</Info>

## Ce que vous obtenez

- Gateway + application macOS + outils (whisper, spotify, cameras) -- tous épinglés
- Service launchd qui survit aux redémarrages
- Système de Plugin avec configuration déclarative
- Retour arrière instantané : `home-manager switch --rollback`

## Démarrage rapide

<Steps>
  <Step title="Installer Determinate Nix">
    Si Nix n’est pas déjà installé, suivez les instructions de l’[installateur Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Créer une flake locale">
    Utilisez le modèle agent-first du dépôt nix-openclaw :
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configurer les secrets">
    Configurez le jeton de votre bot de messagerie et la clé API du fournisseur de modèle. Des fichiers simples dans `~/.secrets/` conviennent très bien.
  </Step>
  <Step title="Renseigner les espaces réservés du modèle et appliquer">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Vérifier">
    Confirmez que le service launchd est en cours d’exécution et que votre bot répond aux messages.
  </Step>
</Steps>

Consultez le [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) pour les options complètes du module et des exemples.

## Comportement d’exécution en mode Nix

Lorsque `OPENCLAW_NIX_MODE=1` est défini (automatique avec nix-openclaw), OpenClaw passe en mode déterministe pour les installations gérées par Nix. D’autres packages Nix peuvent définir le même mode ; nix-openclaw est la référence officielle.

Vous pouvez également le définir manuellement :

```bash
export OPENCLAW_NIX_MODE=1
```

Sur macOS, l’application GUI n’hérite pas automatiquement des variables d’environnement du shell. Activez plutôt le mode Nix via defaults :

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Ce qui change en mode Nix

- Les flux d’installation automatique et d’auto-mutation sont désactivés
- `openclaw.json` est traité comme immuable. Les valeurs par défaut dérivées du démarrage restent uniquement disponibles à l’exécution, et les outils d’écriture de configuration comme setup, onboarding, la mutation via `openclaw update`, l’installation/mise à jour/désinstallation/activation de Plugin, `doctor --fix`, `doctor --generate-gateway-token` et `openclaw config set` refusent de modifier le fichier.
- Les agents doivent plutôt modifier la source Nix. Pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) agent-first et définissez la configuration sous `programs.openclaw.config` ou `instances.<name>.config`.
- Les dépendances manquantes affichent des messages de remédiation propres à Nix
- L’UI affiche une bannière de mode Nix en lecture seule

### Chemins de configuration et d’état

OpenClaw lit la configuration JSON5 depuis `OPENCLAW_CONFIG_PATH` et stocke les données mutables dans `OPENCLAW_STATE_DIR`. Lors de l’exécution sous Nix, définissez-les explicitement vers des emplacements gérés par Nix afin que l’état d’exécution et la configuration restent hors du magasin immuable.

| Variable               | Par défaut                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Découverte du PATH du service

Le service gateway launchd/systemd découvre automatiquement les binaires du profil Nix afin que
les Plugins et les outils qui appellent des exécutables installés via `nix` fonctionnent sans
configuration manuelle du PATH :

- Lorsque `NIX_PROFILES` est défini, chaque entrée est ajoutée au PATH du service avec une
  précédence de droite à gauche (correspond à la précédence du shell Nix - l’élément le plus à droite gagne).
- Lorsque `NIX_PROFILES` n’est pas défini, `~/.nix-profile/bin` est ajouté comme solution de repli.

Cela s’applique aux environnements de service macOS launchd comme Linux systemd.

## Connexe

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Module Home Manager source de vérité et guide de configuration complet.
  </Card>
  <Card title="Assistant de configuration" href="/fr/start/wizard" icon="wand-magic-sparkles">
    Guide pas à pas de configuration CLI hors Nix.
  </Card>
  <Card title="Docker" href="/fr/install/docker" icon="docker">
    Configuration conteneurisée comme alternative hors Nix.
  </Card>
  <Card title="Mise à jour" href="/fr/install/updating" icon="arrow-up-right-from-square">
    Mise à jour des installations gérées par Home Manager avec le package.
  </Card>
</CardGroup>
