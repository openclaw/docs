---
read_when:
    - Création ou signature de builds de débogage Mac
summary: Étapes de signature pour les builds de débogage macOS générés par les scripts de packaging
title: Signature macOS
x-i18n:
    generated_at: "2026-06-27T17:44:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Signature mac (builds de débogage)

Cette application est généralement construite depuis [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), qui désormais :

- définit un identifiant de bundle de débogage stable : `ai.openclaw.mac.debug`
- écrit l’Info.plist avec cet identifiant de bundle (remplacement possible via `BUNDLE_ID=...`)
- appelle [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) pour signer le binaire principal et le bundle de l’application afin que macOS traite chaque reconstruction comme le même bundle signé et conserve les autorisations TCC (notifications, accessibilité, enregistrement d’écran, micro, synthèse vocale). Pour des autorisations stables, utilisez une véritable identité de signature ; ad hoc est une activation explicite et fragile (voir [autorisations macOS](/fr/platforms/mac/permissions)).
- utilise `CODESIGN_TIMESTAMP=auto` par défaut ; cela active les horodatages de confiance pour les signatures Developer ID. Définissez `CODESIGN_TIMESTAMP=off` pour ignorer l’horodatage (builds de débogage hors ligne).
- injecte les métadonnées de build dans Info.plist : `OpenClawBuildTimestamp` (UTC) et `OpenClawGitCommit` (hachage court) afin que le volet À propos puisse afficher le build, git et le canal debug/release.
- **Le packaging utilise Node 24 par défaut** : le script exécute les builds TS et le build de Control UI. Node 22 LTS, actuellement `22.19+`, reste pris en charge pour la compatibilité.
- lit `SIGN_IDENTITY` depuis l’environnement. Ajoutez `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou votre certificat Developer ID Application) à votre rc de shell pour toujours signer avec votre certificat. La signature ad hoc nécessite une activation explicite via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (non recommandé pour les tests d’autorisations).
- exécute un audit de Team ID après la signature et échoue si un Mach-O dans le bundle de l’application est signé par un Team ID différent. Définissez `SKIP_TEAM_ID_CHECK=1` pour le contourner.

## Utilisation

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Remarque sur la signature ad hoc

Lors d’une signature avec `SIGN_IDENTITY="-"` (ad hoc), le script désactive automatiquement le **Hardened Runtime** (`--options runtime`). Cela est nécessaire pour éviter les plantages lorsque l’application tente de charger des frameworks intégrés (comme Sparkle) qui ne partagent pas le même Team ID. Les signatures ad hoc cassent aussi la persistance des autorisations TCC ; consultez [autorisations macOS](/fr/platforms/mac/permissions) pour les étapes de récupération.

## Métadonnées de build pour À propos

`package-mac-app.sh` estampille le bundle avec :

- `OpenClawBuildTimestamp` : UTC ISO8601 au moment du packaging
- `OpenClawGitCommit` : hachage git court (ou `unknown` si indisponible)

L’onglet À propos lit ces clés pour afficher la version, la date de build, le commit git et s’il s’agit d’un build de débogage (via `#if DEBUG`). Exécutez le packager pour actualiser ces valeurs après des changements de code.

## Pourquoi

Les autorisations TCC sont liées à l’identifiant de bundle _et_ à la signature de code. Les builds de débogage non signés avec des UUID changeants faisaient oublier les autorisations à macOS après chaque reconstruction. Signer les binaires (ad hoc par défaut) et conserver un identifiant/chemin de bundle fixe (`dist/OpenClaw.app`) préserve les autorisations entre les builds, conformément à l’approche de VibeTunnel.

## Connexe

- [application macOS](/fr/platforms/macos)
- [autorisations macOS](/fr/platforms/mac/permissions)
