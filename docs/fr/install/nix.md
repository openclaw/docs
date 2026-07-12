---
read_when:
    - Vous souhaitez des installations reproductibles et réversibles
    - Vous utilisez déjà Nix/NixOS/Home Manager
    - Vous souhaitez que tout soit épinglé à une version précise et géré de manière déclarative
summary: Installer OpenClaw de manière déclarative avec Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T02:45:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Installez OpenClaw de manière déclarative avec **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, le module Home Manager officiel prêt à l’emploi.

<Info>
Le dépôt [nix-openclaw](https://github.com/openclaw/nix-openclaw) constitue la source de référence pour l’installation avec Nix. Cette page en donne un aperçu rapide.
</Info>

## Ce que vous obtenez

- Gateway + application macOS + outils (whisper, spotify, caméras), tous épinglés
- Service launchd persistant après les redémarrages
- Système de Plugins avec configuration déclarative
- Restauration instantanée : `home-manager switch --rollback`

## Démarrage rapide

<Steps>
  <Step title="Installer Determinate Nix">
    Si Nix n’est pas déjà installé, suivez les instructions du [programme d’installation de Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Créer un flake local">
    Utilisez le modèle axé sur les agents du dépôt nix-openclaw :
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copier templates/agent-first/flake.nix depuis le dépôt nix-openclaw
    ```
  </Step>
  <Step title="Configurer les secrets">
    Configurez le jeton de votre bot de messagerie et la clé d’API du fournisseur de modèles. De simples fichiers dans `~/.secrets/` conviennent parfaitement.
  </Step>
  <Step title="Renseigner les espaces réservés du modèle et appliquer la configuration">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Vérifier">
    Vérifiez que le service launchd est actif et que votre bot répond aux messages.
  </Step>
</Steps>

Consultez le [README de nix-openclaw](https://github.com/openclaw/nix-openclaw) pour découvrir toutes les options du module et des exemples.

## Comportement d’exécution en mode Nix

Lorsque `OPENCLAW_NIX_MODE=1` est défini (automatiquement avec nix-openclaw), OpenClaw passe en mode déterministe pour les installations gérées par Nix. D’autres paquets Nix peuvent définir le même mode ; nix-openclaw est l’implémentation de référence officielle.

Vous pouvez également le définir manuellement :

```bash
export OPENCLAW_NIX_MODE=1
```

Sous macOS, l’application graphique n’hérite pas des variables d’environnement de l’interpréteur de commandes. Activez plutôt le mode Nix avec `defaults` :

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Changements apportés par le mode Nix

- Les processus d’installation automatique et d’auto-modification sont désactivés.
- `openclaw.json` est considéré comme immuable. Les valeurs par défaut déduites au démarrage restent limitées à l’exécution, et les outils qui écrivent la configuration (configuration initiale, intégration, commande `openclaw update` avec modification, installation/mise à jour/désinstallation/activation de Plugins, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) refusent de modifier le fichier.
- Modifiez plutôt la source Nix. Pour nix-openclaw, suivez le [démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) axé sur les agents et définissez la configuration sous `programs.openclaw.config` ou `instances.<name>.config`.
- Les dépendances manquantes déclenchent des messages de résolution propres à Nix.
- L’interface affiche une bannière indiquant que le mode Nix est en lecture seule.

### Chemins de configuration et d’état

OpenClaw lit la configuration JSON5 depuis `OPENCLAW_CONFIG_PATH` et stocke les données modifiables dans `OPENCLAW_STATE_DIR`. Sous Nix, définissez-les explicitement sur des emplacements gérés par Nix afin que l’état d’exécution et la configuration restent en dehors du magasin immuable.

| Variable               | Valeur par défaut                       |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Détection du PATH du service

Le service Gateway launchd/systemd détecte automatiquement les exécutables des profils Nix afin que les Plugins et les outils qui lancent des exécutables installés par `nix` fonctionnent sans configuration manuelle du PATH :

- Lorsque `NIX_PROFILES` est défini, chaque entrée est ajoutée au PATH du service selon un ordre de priorité allant de droite à gauche (conforme à la priorité de l’interpréteur de commandes Nix : l’entrée la plus à droite l’emporte).
- Lorsque `NIX_PROFILES` n’est pas défini, `~/.nix-profile/bin` est ajouté comme solution de repli.

Cela s’applique aux environnements de service launchd sous macOS et systemd sous Linux.

## Pages connexes

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Module Home Manager de référence et guide de configuration complet.
  </Card>
  <Card title="Assistant de configuration" href="/fr/start/wizard" icon="wand-magic-sparkles">
    Guide de configuration avec la CLI sans Nix.
  </Card>
  <Card title="Docker" href="/fr/install/docker" icon="docker">
    Configuration conteneurisée comme alternative à Nix.
  </Card>
  <Card title="Mise à jour" href="/fr/install/updating" icon="arrow-up-right-from-square">
    Mise à jour des installations gérées par Home Manager conjointement avec le paquet.
  </Card>
</CardGroup>
