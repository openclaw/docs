---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application macOS OpenClaw
title: Configuration de développement macOS
x-i18n:
    generated_at: "2026-07-04T06:31:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuration développeur macOS

Compiler et exécuter l’application macOS OpenClaw depuis les sources.

## Prérequis

Avant de compiler l’application, assurez-vous que les éléments suivants sont installés :

1. **Xcode 26.2+** : requis pour le développement Swift.
2. **Node.js 24 et pnpm** : recommandés pour le Gateway, la CLI et les scripts de packaging. Node 22 LTS, actuellement `22.19+`, reste pris en charge pour la compatibilité.

## 1. Installer les dépendances

Installez les dépendances de tout le projet :

```bash
pnpm install
```

## 2. Compiler et packager l’application

Pour compiler l’application macOS et la packager dans `dist/OpenClaw.app`, exécutez :

```bash
./scripts/package-mac-app.sh
```

Si vous n’avez pas de certificat Apple Developer ID, le script utilisera automatiquement la **signature ad-hoc** (`-`).

Pour les modes d’exécution de développement, les options de signature et le dépannage de l’ID d’équipe, consultez le README de l’application macOS :
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Remarque** : Les applications signées ad-hoc peuvent déclencher des invites de sécurité. Si l’application plante immédiatement avec « Abort trap 6 », consultez la section [Dépannage](#troubleshooting).

## 3. Installer la CLI et le Gateway

L’application packagée embarque l’installateur canonique `scripts/install-cli.sh`. Sur un
profil neuf, choisissez **Ce Mac** pendant l’onboarding ; l’application installe la
CLI et le runtime en espace utilisateur correspondants avant de démarrer l’assistant Gateway.

Pour une récupération manuelle en développement, installez vous-même la CLI correspondante :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent également.
Pour le runtime Gateway, Node reste l’approche recommandée.

## Dépannage

### Échec de la compilation : incompatibilité de chaîne d’outils ou de SDK

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

### L’application plante lors de l’autorisation d’accès

Si l’application plante lorsque vous essayez d’autoriser l’accès à la **Reconnaissance vocale** ou au **Microphone**, cela peut être dû à un cache TCC corrompu ou à une incompatibilité de signature.

**Correction :**

1. Réinitialisez les autorisations TCC :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement le `BUNDLE_ID` dans [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) pour forcer un « état vierge » depuis macOS.

### Gateway « Starting... » indéfiniment

Si l’état du Gateway reste sur « Starting... », vérifiez si un processus zombie occupe le port :

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
