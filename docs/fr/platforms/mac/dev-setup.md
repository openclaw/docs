---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application macOS OpenClaw
title: Configuration de développement macOS
x-i18n:
    generated_at: "2026-06-27T17:43:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuration développeur macOS

Compilez et exécutez l’application macOS OpenClaw à partir du code source.

## Prérequis

Avant de compiler l’app, assurez-vous que les éléments suivants sont installés :

1. **Xcode 26.2+** : requis pour le développement Swift.
2. **Node.js 24 et pnpm** : recommandés pour le Gateway, la CLI et les scripts de packaging. Node 22 LTS, actuellement `22.19+`, reste pris en charge pour la compatibilité.

## 1. Installer les dépendances

Installez les dépendances de l’ensemble du projet :

```bash
pnpm install
```

## 2. Compiler et packager l’app

Pour compiler l’app macOS et la packager dans `dist/OpenClaw.app`, exécutez :

```bash
./scripts/package-mac-app.sh
```

Si vous n’avez pas de certificat Apple Developer ID, le script utilisera automatiquement une **signature ad hoc** (`-`).

Pour les modes d’exécution de développement, les options de signature et le dépannage de l’identifiant d’équipe, consultez le README de l’app macOS :
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Remarque** : les apps signées ad hoc peuvent déclencher des invites de sécurité. Si l’app plante immédiatement avec « Abort trap 6 », consultez la section [Dépannage](#troubleshooting).

## 3. Installer la CLI

L’app macOS attend une installation globale de la CLI `openclaw` pour gérer les tâches en arrière-plan.

**Pour l’installer (recommandé) :**

1. Ouvrez l’app OpenClaw.
2. Accédez à l’onglet de paramètres **Général**.
3. Cliquez sur **« Installer CLI »**.

Vous pouvez aussi l’installer manuellement :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent aussi.
Pour le runtime Gateway, Node reste la méthode recommandée.

## Dépannage

### Échec de la compilation : incompatibilité de chaîne d’outils ou de SDK

La compilation de l’app macOS attend le dernier SDK macOS et la chaîne d’outils Swift 6.2.

**Dépendances système (requises) :**

- **Dernière version de macOS disponible dans Mise à jour de logiciels** (requise par les SDK Xcode 26.2)
- **Xcode 26.2** (chaîne d’outils Swift 6.2)

**Vérifications :**

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez à jour macOS/Xcode et relancez la compilation.

### L’app plante lors de l’octroi d’une autorisation

Si l’app plante lorsque vous essayez d’autoriser l’accès à la **Reconnaissance vocale** ou au **Microphone**, cela peut être dû à un cache TCC corrompu ou à une incompatibilité de signature.

**Correction :**

1. Réinitialisez les autorisations TCC :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement le `BUNDLE_ID` dans [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) pour forcer un « nouvel état propre » depuis macOS.

### Le Gateway reste indéfiniment sur « Démarrage... »

Si l’état du Gateway reste sur « Démarrage... », vérifiez si un processus zombie occupe le port :

```bash
openclaw gateway status
openclaw gateway stop

# Si vous n’utilisez pas de LaunchAgent (mode développement / exécutions manuelles), trouvez l’écouteur :
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle occupe le port, arrêtez ce processus (Ctrl+C). En dernier recours, tuez le PID trouvé ci-dessus.

## Liens associés

- [App macOS](/fr/platforms/macos)
- [Vue d’ensemble de l’installation](/fr/install)
