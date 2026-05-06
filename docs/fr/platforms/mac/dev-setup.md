---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application macOS OpenClaw
title: Configuration de développement macOS
x-i18n:
    generated_at: "2026-05-06T07:31:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuration développeur macOS

Compilez et exécutez l’application macOS OpenClaw depuis le code source.

## Prérequis

Avant de compiler l’application, assurez-vous que les éléments suivants sont installés :

1. **Xcode 26.2+** : requis pour le développement Swift.
2. **Node.js 24 et pnpm** : recommandé pour le Gateway, la CLI et les scripts de packaging. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour la compatibilité.

## 1. Installer les dépendances

Installez les dépendances de l’ensemble du projet :

```bash
pnpm install
```

## 2. Compiler et empaqueter l’application

Pour compiler l’application macOS et l’empaqueter dans `dist/OpenClaw.app`, exécutez :

```bash
./scripts/package-mac-app.sh
```

Si vous ne disposez pas d’un certificat Apple Developer ID, le script utilisera automatiquement la **signature ad hoc** (`-`).

Pour les modes d’exécution de développement, les indicateurs de signature et le dépannage de l’identifiant d’équipe, consultez le README de l’application macOS :
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Remarque** : les applications signées ad hoc peuvent déclencher des invites de sécurité. Si l’application plante immédiatement avec « Abort trap 6 », consultez la section [Dépannage](#troubleshooting).

## 3. Installer la CLI

L’application macOS attend une installation globale de la CLI `openclaw` pour gérer les tâches en arrière-plan.

**Pour l’installer (recommandé) :**

1. Ouvrez l’application OpenClaw.
2. Accédez à l’onglet des paramètres **Général**.
3. Cliquez sur **« Installer la CLI »**.

Vous pouvez aussi l’installer manuellement :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent également.
Pour l’environnement d’exécution du Gateway, Node reste l’approche recommandée.

## Dépannage

### Échec de la compilation : incompatibilité de la chaîne d’outils ou du SDK

La compilation de l’application macOS attend le dernier SDK macOS et la chaîne d’outils Swift 6.2.

**Dépendances système (requises) :**

- **Dernière version de macOS disponible dans Mise à jour de logiciels** (requise par les SDK Xcode 26.2)
- **Xcode 26.2** (chaîne d’outils Swift 6.2)

**Vérifications :**

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez à jour macOS/Xcode et relancez la compilation.

### L’application plante lors de l’octroi des autorisations

Si l’application plante lorsque vous essayez d’autoriser l’accès à la **Reconnaissance vocale** ou au **Microphone**, cela peut être dû à un cache TCC corrompu ou à une incompatibilité de signature.

**Correctif :**

1. Réinitialisez les autorisations TCC :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement le `BUNDLE_ID` dans [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) pour forcer macOS à repartir d’un « état propre ».

### Gateway bloqué indéfiniment sur « Starting... »

Si l’état du Gateway reste sur « Starting... », vérifiez si un processus zombie occupe le port :

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle occupe le port, arrêtez ce processus (Ctrl+C). En dernier recours, tuez le PID trouvé ci-dessus.

## Connexe

- [Application macOS](/fr/platforms/macos)
- [Vue d’ensemble de l’installation](/fr/install)
