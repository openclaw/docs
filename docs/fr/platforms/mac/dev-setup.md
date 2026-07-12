---
read_when:
    - Configuration de l’environnement de développement macOS
summary: Guide de configuration pour les développeurs travaillant sur l’application macOS OpenClaw
title: Configuration de l’environnement de développement sous macOS
x-i18n:
    generated_at: "2026-07-12T15:37:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuration de l’environnement de développement macOS

Compilez et exécutez l’application OpenClaw pour macOS à partir du code source.

## Prérequis

- **Xcode 26.2+** (chaîne d’outils Swift 6.2), sur la dernière version de macOS disponible dans
  Software Update.
- **Node.js 24 et pnpm** pour le Gateway, la CLI et les scripts de packaging. Node
  22.19+ fonctionne également.

## 1. Installer les dépendances

```bash
pnpm install
```

## 2. Compiler et empaqueter l’application

```bash
./scripts/package-mac-app.sh
```

Génère `dist/OpenClaw.app`. Sans certificat Apple Developer ID, le
script utilise à la place une signature ad hoc.

Pour les modes d’exécution de développement, les options de signature et la résolution des problèmes liés à l’identifiant d’équipe, consultez
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md).
Boucle de développement rapide depuis la racine du dépôt : `scripts/restart-mac.sh` (ajoutez `--no-sign` pour
une signature ad hoc ; les autorisations TCC ne sont pas conservées avec `--no-sign`).

<Note>
Les applications signées ad hoc peuvent déclencher des invites de sécurité. Si l’application plante
immédiatement avec « Abort trap 6 », consultez la section [Résolution des problèmes](#troubleshooting).
</Note>

## 3. Installer la CLI et le Gateway

L’application empaquetée intègre le programme d’installation canonique `scripts/install-cli.sh`. Sur un
nouveau profil, choisissez **This Mac** pendant la configuration initiale ; l’application installe la
CLI en espace utilisateur et l’environnement d’exécution correspondants avant de lancer l’assistant du Gateway.

Pour une récupération manuelle de l’environnement de développement, installez vous-même la CLI correspondante :

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` et `bun add -g openclaw@<version>` fonctionnent
également. Node reste l’environnement d’exécution recommandé pour le Gateway lui-même.

## Résolution des problèmes

### Échec de la compilation : incompatibilité de la chaîne d’outils ou du SDK

La compilation de l’application macOS nécessite le dernier SDK macOS et la chaîne d’outils Swift 6.2
(Xcode 26.2+).

```bash
xcodebuild -version
xcrun swift --version
```

Si les versions ne correspondent pas, mettez à jour macOS/Xcode et relancez la compilation.

### L’application plante lors de l’octroi d’une autorisation

Si l’application plante lorsque vous tentez d’autoriser l’accès à **Speech Recognition** ou au
**Microphone**, il peut s’agir d’un cache TCC corrompu ou d’une incompatibilité de signature.

1. Réinitialisez les autorisations TCC pour l’identifiant de bundle de débogage :

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Si cela échoue, modifiez temporairement `BUNDLE_ID` dans
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   afin de repartir d’un état vierge dans macOS.

### Le Gateway reste indéfiniment sur « Starting... »

Vérifiez si un processus zombie occupe le port :

```bash
openclaw gateway status
openclaw gateway stop

# Si vous n’utilisez pas de LaunchAgent (mode développement / exécutions manuelles), recherchez le processus à l’écoute :
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Si une exécution manuelle occupe le port, arrêtez-la (Ctrl+C) ou, en dernier
recours, terminez le PID trouvé ci-dessus.

## Contenu associé

- [Application macOS](/fr/platforms/macos)
- [Présentation de l’installation](/fr/install)
