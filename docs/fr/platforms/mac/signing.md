---
read_when:
    - Création ou signature de builds de débogage pour macOS
summary: Étapes de signature des builds de débogage macOS générés par les scripts de packaging
title: Signature macOS
x-i18n:
    generated_at: "2026-07-16T13:30:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Signature mac (builds de débogage)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compile et empaquette l’application dans un chemin fixe (`dist/OpenClaw.app`), puis appelle [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) pour la signer. Les autorisations TCC sont liées à l’identifiant du bundle et à la signature du code ; maintenir les deux stables (ainsi que l’application dans un chemin fixe) d’une recompilation à l’autre empêche macOS d’oublier les autorisations TCC (notifications, accessibilité, enregistrement de l’écran, microphone, reconnaissance vocale).

- L’identifiant du bundle de débogage est `ai.openclaw.mac.debug` par défaut (remplacez-le avec `BUNDLE_ID=...`).
- Node : `>=22.22.3 <23`, `>=24.15.0 <25` ou `>=25.9.0` (`package.json` `engines` du dépôt). L’outil d’empaquetage compile également l’interface de contrôle (`pnpm ui:build`).
- Nécessite par défaut une véritable identité de signature ; le script de signature se termine avec une erreur si aucune identité n’est trouvée et si `ALLOW_ADHOC_SIGNING` n’est pas défini. La signature ad hoc (`SIGN_IDENTITY="-"`) doit être explicitement activée et ne conserve pas les autorisations TCC d’une recompilation à l’autre. Consultez [Autorisations macOS](/fr/platforms/mac/permissions).
- Lit `SIGN_IDENTITY` depuis l’environnement (par exemple `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` ou un certificat Developer ID Application). En son absence, `codesign-mac-app.sh` sélectionne automatiquement une identité dans cet ordre : Developer ID Application, Apple Distribution, Apple Development, puis la première identité de signature de code valide trouvée.
- `CODESIGN_TIMESTAMP=auto` (valeur par défaut) active les horodatages de confiance uniquement pour les signatures Developer ID Application. Définissez `on`/`off` pour imposer l’un ou l’autre comportement.
- Ajoute à Info.plist `OpenClawBuildTimestamp` (ISO8601 UTC) et `OpenClawGitCommit` (hachage court, `unknown` s’il n’est pas disponible), afin que l’onglet À propos puisse afficher la version de build, les informations git et le canal de débogage ou de publication.
- Exécute un audit de l’identifiant d’équipe après la signature et échoue si un fichier Mach-O du bundle possède un identifiant d’équipe différent. Définissez `SKIP_TEAM_ID_CHECK=1` pour contourner cet audit.

## Utilisation

```bash
# depuis la racine du dépôt
scripts/package-mac-app.sh                                                      # sélectionne automatiquement l’identité ; erreur si aucune n’est trouvée
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # véritable certificat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (les autorisations ne seront pas conservées)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc explicite (même mise en garde)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # contournement réservé au développement pour une incompatibilité d’identifiant d’équipe Sparkle
```

### Remarque sur la signature ad hoc

`SIGN_IDENTITY="-"` désactive l’environnement d’exécution renforcé (`--options runtime`) pour éviter les plantages lorsque l’application charge des frameworks intégrés (comme Sparkle) qui ne partagent pas le même identifiant d’équipe. Les signatures ad hoc empêchent également la conservation des autorisations TCC ; consultez [Autorisations macOS](/fr/platforms/mac/permissions) pour connaître les étapes de récupération.

## Métadonnées de build pour À propos

L’onglet À propos lit `OpenClawBuildTimestamp` et `OpenClawGitCommit` depuis Info.plist pour afficher la version, la date de build, le commit git et indiquer si le build est en mode DEBUG (via `#if DEBUG`). Réexécutez l’outil d’empaquetage après toute modification du code pour actualiser ces valeurs.

## Voir aussi

- [Application macOS](/fr/platforms/macos)
- [Autorisations macOS](/fr/platforms/mac/permissions)
