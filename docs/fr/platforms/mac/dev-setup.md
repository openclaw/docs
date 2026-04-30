---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application macOS OpenClaw
title: Configuration de développement macOS
x-i18n:
    generated_at: "2026-04-30T07:36:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuration développeur macOS

Compilez et exécutez l’application macOS OpenClaw à partir des sources.

## Prérequis

Avant de compiler l’application, assurez-vous d’avoir installé les éléments suivants :

1. **Xcode 26.2+** : requis pour le développement Swift.
2. **Node.js 24 et pnpm** : recommandés pour le Gateway, la CLI et les scripts d’empaquetage. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour la compatibilité.

## 1. Installer les dépendances

Installez les dépendances à l’échelle du projet :

```bash
pnpm install
```

## 2. Compiler et empaqueter l’application

Pour compiler l’application macOS et l’empaqueter dans `dist/OpenClaw.app`, exécutez :

```bash
./scripts/package-mac-app.sh
```

Si vous ne disposez pas d’un certificat Apple Developer ID, le script utilisera automatiquement la **signature ad hoc** (`-`).

Pour les modes d’exécution de développement, les indicateurs de signature et le dépannage de Team ID, consultez le README de l’application macOS :
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Remarque** : les applications signées ad hoc peuvent déclencher des invites de sécurité. Si l’application plante immédiatement avec « Abort trap 6 », consultez la section [Dépannage](#troubleshooting).

## 3. Installer la CLI

L’application macOS attend une installation globale de la CLI `openclaw` pour gérer les tâches en arrière-plan.

**Pour l’installer (recommandé) :**

1. Ouvrez l’application OpenClaw.
2. Accédez à l’onglet des paramètres **Général**.
3. Cliquez sur **"Install CLI"**.

Vous pouvez également l’installer manuellement :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent également.
Pour l’exécution du Gateway, Node reste la méthode recommandée.

## Dépannage

### Échec de la compilation : incompatibilité de chaîne d’outils ou de SDK

La compilation de l’application macOS attend le dernier SDK macOS et la chaîne d’outils Swift 6.2.

**Dépendances système (requises) :**

- **Dernière version de macOS disponible dans Software Update** (requise par les SDK Xcode 26.2)
- **Xcode 26.2** (chaîne d’outils Swift 6.2)

**Vérifications :**

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez à jour macOS/Xcode et relancez la compilation.

### L’application plante lors de l’octroi d’une autorisation

Si l’application plante lorsque vous essayez d’autoriser l’accès à la **reconnaissance vocale** ou au **microphone**, cela peut être dû à un cache TCC corrompu ou à une incompatibilité de signature.

**Correction :**

1. Réinitialisez les autorisations TCC :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement le `BUNDLE_ID` dans [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) pour forcer une « configuration propre » depuis macOS.

### Gateway "Starting..." indéfiniment

Si le statut du Gateway reste sur "Starting...", vérifiez si un processus zombie occupe le port :

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle occupe le port, arrêtez ce processus (Ctrl+C). En dernier recours, tuez le PID trouvé ci-dessus.

## Liens associés

- [Application macOS](/fr/platforms/macos)
- [Vue d’ensemble de l’installation](/fr/install)
