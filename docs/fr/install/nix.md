---
read_when:
    - Vous voulez des installations reproductibles et restaurables უკან
    - Vous utilisez déjà Nix/NixOS/Home Manager
    - Vous voulez que tout soit épinglé et géré de manière déclarative
summary: Installer OpenClaw de manière déclarative avec Nix
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

Installez OpenClaw de manière déclarative avec **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — un module Home Manager tout compris.

<Info>
Le dépôt [nix-openclaw](https://github.com/openclaw/nix-openclaw) est la source de vérité pour l’installation avec Nix. Cette page est une vue d’ensemble rapide.
</Info>

## Ce que vous obtenez

- Gateway + app macOS + outils (whisper, spotify, caméras) — tous épinglés
- Service Launchd qui survit aux redémarrages
- Système de Plugin avec configuration déclarative
- Restauration instantanée : `home-manager switch --rollback`

## Démarrage rapide

<Steps>
  <Step title="Installer Determinate Nix">
    Si Nix n’est pas déjà installé, suivez les instructions de l’[installateur Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Créer un flake local">
    Utilisez le modèle agent-first du dépôt nix-openclaw :
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configurer les secrets">
    Configurez le jeton de votre bot de messagerie et la clé API de votre fournisseur de modèles. De simples fichiers dans `~/.secrets/` conviennent très bien.
  </Step>
  <Step title="Remplir les espaces réservés du modèle et appliquer">
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

Lorsque `OPENCLAW_NIX_MODE=1` est défini (automatique avec nix-openclaw), OpenClaw passe en mode déterministe, ce qui désactive les flux d’installation automatique.

Vous pouvez également le définir manuellement :

```bash
export OPENCLAW_NIX_MODE=1
```

Sur macOS, l’app GUI n’hérite pas automatiquement des variables d’environnement du shell. Activez plutôt le mode Nix via les defaults :

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Ce qui change en mode Nix

- Les flux d’installation automatique et d’auto-mutation sont désactivés
- Les dépendances manquantes affichent des messages de remédiation spécifiques à Nix
- L’interface affiche une bannière de mode Nix en lecture seule

### Chemins de configuration et d’état

OpenClaw lit la configuration JSON5 depuis `OPENCLAW_CONFIG_PATH` et stocke les données mutables dans `OPENCLAW_STATE_DIR`. Lors d’une exécution sous Nix, définissez-les explicitement vers des emplacements gérés par Nix afin que l’état d’exécution et la configuration restent hors du store immuable.

| Variable               | Par défaut                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Découverte du PATH du service

Le service Gateway launchd/systemd découvre automatiquement les binaires du profil Nix afin que
les Plugins et outils qui exécutent des binaires installés via `nix`
fonctionnent sans configuration manuelle du PATH :

- Lorsque `NIX_PROFILES` est défini, chaque entrée est ajoutée au PATH du service avec une
  priorité de droite à gauche (correspond à la priorité du shell Nix — l’entrée la plus à droite l’emporte).
- Lorsque `NIX_PROFILES` n’est pas défini, `~/.nix-profile/bin` est ajouté comme solution de repli.

Cela s’applique aux environnements de service macOS launchd et Linux systemd.

## Lié

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — guide d’installation complet
- [Assistant](/fr/start/wizard) — configuration CLI sans Nix
- [Docker](/fr/install/docker) — configuration conteneurisée
