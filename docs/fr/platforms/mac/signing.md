---
read_when:
    - Création ou signature de versions de débogage Mac
summary: Étapes de signature pour les versions de débogage macOS générées par les scripts d’empaquetage
title: Signature macOS
x-i18n:
    generated_at: "2026-05-06T07:31:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# signature mac (builds de débogage)

Cette application est généralement compilée depuis [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), qui désormais :

- définit un identifiant de bundle de débogage stable : `ai.openclaw.mac.debug`
- écrit le fichier Info.plist avec cet identifiant de bundle (remplacement via `BUNDLE_ID=...`)
- appelle [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) pour signer le binaire principal et le bundle de l’application afin que macOS traite chaque recompilation comme le même bundle signé et conserve les autorisations TCC (notifications, accessibilité, enregistrement de l’écran, micro, parole). Pour des autorisations stables, utilisez une vraie identité de signature ; la signature ad hoc est optionnelle et fragile (voir [autorisations macOS](/fr/platforms/mac/permissions)).
- utilise `CODESIGN_TIMESTAMP=auto` par défaut ; cela active les horodatages de confiance pour les signatures Developer ID. Définissez `CODESIGN_TIMESTAMP=off` pour ignorer l’horodatage (builds de débogage hors ligne).
- injecte les métadonnées de build dans Info.plist : `OpenClawBuildTimestamp` (UTC) et `OpenClawGitCommit` (hachage court) afin que le panneau À propos puisse afficher le build, git et le canal débogage/release.
- **Le packaging utilise Node 24 par défaut** : le script exécute les builds TS et le build de l’interface utilisateur de contrôle. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour la compatibilité.
- lit `SIGN_IDENTITY` depuis l’environnement. Ajoutez `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou votre certificat Developer ID Application) à votre rc de shell pour toujours signer avec votre certificat. La signature ad hoc nécessite une activation explicite via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (non recommandé pour tester les autorisations).
- exécute un audit du Team ID après la signature et échoue si un Mach-O dans le bundle de l’application est signé par un Team ID différent. Définissez `SKIP_TEAM_ID_CHECK=1` pour contourner cette vérification.

## Utilisation

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Note sur la signature ad hoc

Lors de la signature avec `SIGN_IDENTITY="-"` (ad hoc), le script désactive automatiquement le **Hardened Runtime** (`--options runtime`). C’est nécessaire pour éviter les plantages lorsque l’application tente de charger des frameworks intégrés (comme Sparkle) qui ne partagent pas le même Team ID. Les signatures ad hoc rompent également la persistance des autorisations TCC ; consultez [autorisations macOS](/fr/platforms/mac/permissions) pour les étapes de récupération.

## Métadonnées de build pour À propos

`package-mac-app.sh` marque le bundle avec :

- `OpenClawBuildTimestamp` : UTC ISO8601 au moment du packaging
- `OpenClawGitCommit` : hachage git court (ou `unknown` si indisponible)

L’onglet À propos lit ces clés pour afficher la version, la date de build, le commit git et indiquer s’il s’agit d’un build de débogage (via `#if DEBUG`). Exécutez le packageur pour actualiser ces valeurs après des modifications du code.

## Pourquoi

Les autorisations TCC sont liées à l’identifiant du bundle _et_ à la signature de code. Les builds de débogage non signés avec des UUID changeants faisaient que macOS oubliait les autorisations accordées après chaque recompilation. La signature des binaires (ad hoc par défaut) et la conservation d’un identifiant/chemin de bundle fixe (`dist/OpenClaw.app`) préservent les autorisations entre les builds, conformément à l’approche VibeTunnel.

## Connexe

- [application macOS](/fr/platforms/macos)
- [autorisations macOS](/fr/platforms/mac/permissions)
