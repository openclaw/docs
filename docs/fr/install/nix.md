---
read_when:
    - Vous voulez des installations reproductibles et réversibles
    - Vous utilisez déjà Nix/NixOS/Home Manager
    - Vous voulez que tout soit épinglé et géré de manière déclarative
summary: Installer OpenClaw de manière déclarative avec Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T07:29:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Installez OpenClaw de manière déclarative avec **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - un module Home Manager complet.

<Info>
Le dépôt [nix-openclaw](https://github.com/openclaw/nix-openclaw) est la source de vérité pour l’installation avec Nix. Cette page est un aperçu rapide.
</Info>

## Ce que vous obtenez

- Gateway + application macOS + outils (whisper, spotify, cameras) -- tous épinglés
- Service launchd qui survit aux redémarrages
- Système de Plugin avec configuration déclarative
- Restauration instantanée : `home-manager switch --rollback`

## Démarrage rapide

<Steps>
  <Step title="Installer Determinate Nix">
    Si Nix n’est pas déjà installé, suivez les instructions du [programme d’installation Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Créer un flake local">
    Utilisez le modèle agent-first du dépôt nix-openclaw :
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configurer les secrets">
    Configurez le jeton de votre bot de messagerie et la clé d’API du fournisseur de modèle. Des fichiers simples dans `~/.secrets/` conviennent parfaitement.
  </Step>
  <Step title="Remplir les espaces réservés du modèle et basculer">
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

Lorsque `OPENCLAW_NIX_MODE=1` est défini (automatique avec nix-openclaw), OpenClaw passe dans un mode déterministe qui désactive les flux d’installation automatique.

Vous pouvez aussi le définir manuellement :

```bash
export OPENCLAW_NIX_MODE=1
```

Sur macOS, l’application GUI n’hérite pas automatiquement des variables d’environnement du shell. Activez plutôt le mode Nix via defaults :

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Ce qui change en mode Nix

- Les flux d’installation automatique et d’auto-mutation sont désactivés
- Les dépendances manquantes affichent des messages de remédiation propres à Nix
- L’UI affiche une bannière de mode Nix en lecture seule

### Chemins de configuration et d’état

OpenClaw lit la configuration JSON5 depuis `OPENCLAW_CONFIG_PATH` et stocke les données modifiables dans `OPENCLAW_STATE_DIR`. Lors de l’exécution sous Nix, définissez-les explicitement vers des emplacements gérés par Nix afin que l’état d’exécution et la configuration restent en dehors du store immuable.

| Variable               | Par défaut                             |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Découverte du PATH du service

Le service Gateway launchd/systemd découvre automatiquement les binaires de profil Nix afin que
les plugins et outils qui appellent des exécutables installés par `nix` via le shell fonctionnent sans
configuration manuelle du PATH :

- Lorsque `NIX_PROFILES` est défini, chaque entrée est ajoutée au PATH du service avec une
  précédence de droite à gauche (correspond à la précédence du shell Nix - l’entrée la plus à droite l’emporte).
- Lorsque `NIX_PROFILES` n’est pas défini, `~/.nix-profile/bin` est ajouté comme solution de repli.

Cela s’applique aux environnements de service launchd sur macOS comme systemd sur Linux.

## Associés

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Module Home Manager source de vérité et guide de configuration complet.
  </Card>
  <Card title="Assistant de configuration" href="/fr/start/wizard" icon="wand-magic-sparkles">
    Guide pas à pas de configuration CLI non-Nix.
  </Card>
  <Card title="Docker" href="/fr/install/docker" icon="docker">
    Configuration conteneurisée comme alternative non-Nix.
  </Card>
  <Card title="Mise à jour" href="/fr/install/updating" icon="arrow-up-right-from-square">
    Mise à jour des installations gérées par Home Manager avec le paquet.
  </Card>
</CardGroup>
