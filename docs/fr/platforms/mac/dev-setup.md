---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application OpenClaw pour macOS
title: Configuration de l’environnement de développement sous macOS
x-i18n:
    generated_at: "2026-07-16T13:27:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuration de l’environnement de développement macOS

Compilez et exécutez l’application OpenClaw pour macOS à partir du code source.

## Prérequis

- **Xcode 26.2+** (chaîne d’outils Swift 6.2), sur la dernière version de macOS disponible dans
  Software Update.
- **Node.js 24.15+ et pnpm** pour le Gateway, la CLI et les scripts de mise en paquet. Node
  22.22.3+ fonctionne également.

## 1. Installer les dépendances

```bash
pnpm install
```

## 2. Compiler et mettre en paquet l’application

```bash
./scripts/package-mac-app.sh
```

Génère `dist/OpenClaw.app`. En l’absence de certificat Apple Developer ID, le
script utilise à défaut une signature ad hoc.

Pour les modes d’exécution de développement, les options de signature et la résolution des problèmes liés à l’identifiant d’équipe, consultez
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Boucle de développement rapide depuis la racine du dépôt : `scripts/restart-mac.sh` (ajoutez `--no-sign` pour
la signature ad hoc ; les autorisations TCC ne sont pas conservées avec `--no-sign`).

<Note>
Les applications signées ad hoc peuvent déclencher des invites de sécurité. Si l’application plante
immédiatement avec « Abort trap 6 », consultez la section [Résolution des problèmes](#troubleshooting).
</Note>

## 3. Installer la CLI et le Gateway

L’application mise en paquet intègre le programme d’installation canonique `scripts/install-cli.sh`. Sur un
nouveau profil, choisissez **This Mac** pendant la configuration initiale ; l’application installe la
CLI et l’environnement d’exécution correspondants dans l’espace utilisateur avant de démarrer l’assistant du Gateway.

Pour une récupération manuelle de l’environnement de développement, installez vous-même la CLI correspondante :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>`
fonctionnent également. Node reste l’environnement d’exécution recommandé pour le Gateway lui-même.

## Résolution des problèmes

### Échec de la compilation : incompatibilité de la chaîne d’outils ou du SDK

La compilation de l’application macOS nécessite la dernière version du SDK macOS et la chaîne d’outils Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez à jour macOS/Xcode et relancez la compilation.

### L’application plante lors de l’octroi d’une autorisation

Si l’application plante lorsque vous tentez d’autoriser l’accès à **Speech Recognition** ou au
**Microphone**, il peut s’agir d’un cache TCC corrompu ou d’une incompatibilité de signature.

1. Réinitialisez les autorisations TCC pour l’identifiant du paquet de débogage :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement `BUNDLE_ID` dans
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   afin de repartir sur une configuration macOS vierge.

### Le Gateway reste indéfiniment sur « Starting... »

Vérifiez si un processus zombie occupe le port :

```bash
openclaw gateway status
openclaw gateway stop

# Si vous n’utilisez pas de LaunchAgent (mode développement / exécutions manuelles), recherchez le processus à l’écoute :
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle occupe le port, arrêtez-la (Ctrl+C) ou, en dernier recours,
tuez le PID trouvé ci-dessus.

## Pages connexes

- [Application macOS](/fr/platforms/macos)
- [Vue d’ensemble de l’installation](/fr/install)
