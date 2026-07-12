---
read_when:
    - Création ou signature de versions de débogage pour Mac
summary: Étapes de signature des builds de débogage macOS générés par les scripts de packaging
title: Signature macOS
x-i18n:
    generated_at: "2026-07-12T03:01:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Signature mac (versions de débogage)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) compile et empaquette l’application dans un chemin fixe (`dist/OpenClaw.app`), puis appelle [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) pour la signer. Les autorisations TCC sont liées à l’identifiant du paquet et à la signature du code ; conserver ces deux éléments stables (ainsi que l’application dans un chemin fixe) d’une recompilation à l’autre empêche macOS d’oublier les autorisations TCC accordées (notifications, accessibilité, enregistrement de l’écran, microphone, reconnaissance vocale).

- L’identifiant du paquet de débogage est par défaut `ai.openclaw.mac.debug` (remplacez-le avec `BUNDLE_ID=...`).
- Node : `>=22.19.0 <23` ou `>=23.11.0` (`engines` dans le fichier `package.json` du dépôt). L’outil d’empaquetage compile également l’interface de contrôle (`pnpm ui:build`).
- Nécessite par défaut une véritable identité de signature ; le script de signature se termine avec une erreur si aucune n’est trouvée et si `ALLOW_ADHOC_SIGNING` n’est pas défini. La signature ad hoc (`SIGN_IDENTITY="-"`) doit être explicitement activée et ne conserve pas les autorisations TCC d’une recompilation à l’autre. Consultez [les autorisations macOS](/fr/platforms/mac/permissions).
- Lit `SIGN_IDENTITY` depuis l’environnement (par exemple `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`, ou un certificat Developer ID Application). Si cette variable n’est pas définie, `codesign-mac-app.sh` sélectionne automatiquement une identité dans l’ordre suivant : Developer ID Application, Apple Distribution, Apple Development, puis la première identité de signature de code valide trouvée.
- `CODESIGN_TIMESTAMP=auto` (valeur par défaut) active les horodatages fiables uniquement pour les signatures Developer ID Application. Définissez `on`/`off` pour imposer l’un ou l’autre comportement.
- Ajoute à Info.plist les valeurs `OpenClawBuildTimestamp` (UTC au format ISO 8601) et `OpenClawGitCommit` (hachage court, `unknown` s’il est indisponible), afin que l’onglet À propos puisse afficher la version, Git et le canal de débogage ou de publication.
- Exécute un audit de l’identifiant d’équipe après la signature et échoue si un fichier Mach-O du paquet possède un identifiant d’équipe différent. Définissez `SKIP_TEAM_ID_CHECK=1` pour ignorer cette vérification.

## Utilisation

```bash
# depuis la racine du dépôt
scripts/package-mac-app.sh                                                      # sélectionne automatiquement l’identité ; erreur si aucune n’est trouvée
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # véritable certificat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (les autorisations ne seront pas conservées)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ad hoc explicite (même réserve)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # contournement réservé au développement pour une incompatibilité d’identifiant d’équipe Sparkle
```

### Remarque sur la signature ad hoc

`SIGN_IDENTITY="-"` désactive l’environnement d’exécution renforcé (`--options runtime`) afin d’éviter les plantages lorsque l’application charge des frameworks intégrés (comme Sparkle) qui ne partagent pas le même identifiant d’équipe. Les signatures ad hoc empêchent également la conservation des autorisations TCC ; consultez [les autorisations macOS](/fr/platforms/mac/permissions) pour connaître les étapes de récupération.

## Métadonnées de compilation pour À propos

L’onglet À propos lit `OpenClawBuildTimestamp` et `OpenClawGitCommit` dans Info.plist afin d’afficher la version, la date de compilation, le commit Git et d’indiquer si la compilation est en mode DEBUG (via `#if DEBUG`). Réexécutez l’outil d’empaquetage après toute modification du code afin d’actualiser ces valeurs.

## Pages connexes

- [Application macOS](/fr/platforms/macos)
- [Autorisations macOS](/fr/platforms/mac/permissions)
