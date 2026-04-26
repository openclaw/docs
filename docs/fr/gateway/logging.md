---
read_when:
    - Modification de la sortie ou des formats de journalisation
    - Débogage de la sortie CLI ou Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et formatage de la console
title: Journalisation Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Journalisation

Pour une vue d’ensemble orientée utilisateur (CLI + interface de contrôle + configuration), voir [/logging](/fr/logging).

OpenClaw possède deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface Debug).
- **Journaux de fichiers** (lignes JSON) écrits par le logger Gateway.

## Logger basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte Gateway.
- Les fichiers journaux actifs tournent à `logging.maxFileBytes` (par défaut : 100 MB), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin du fichier journal et le niveau peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format du fichier est un objet JSON par ligne.

L’onglet Logs de l’interface de contrôle suit ce fichier via la Gateway (`logs.tail`).
La CLI peut faire de même :

```bash
openclaw logs --follow
```

**Mode verbeux vs. niveaux de journal**

- Les **journaux de fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité de la console** (et le style de journal WS) ; il **n’augmente pas**
  le niveau de journal du fichier.
- Pour capturer dans les journaux de fichiers les détails visibles uniquement en mode verbeux, définissez `logging.level` sur `debug` ou
  `trace`.

## Capture de console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichiers,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez ajuster la verbosité de la console indépendamment via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Masquage des résumés d’outils

Les résumés d’outils verbeux (par ex. `🛠️ Exec: ...`) peuvent masquer les jetons sensibles avant qu’ils n’atteignent le
flux console. Cela concerne **uniquement les outils** et ne modifie pas les journaux de fichiers.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (auto `gi`), ou `/pattern/flags` si vous avez besoin d’indicateurs personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + les 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les indicateurs CLI, les champs JSON, les en-têtes bearer, les blocs PEM et les préfixes de jetons populaires.

## Journaux WebSocket Gateway

La Gateway affiche les journaux du protocole WebSocket en deux modes :

- **Mode normal** (sans `--verbose`) : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbeux** (`--verbose`) : affiche tout le trafic requête/réponse WS.

### Style de journal WS

`openclaw gateway` prend en charge un changement de style par Gateway :

- `--ws-log auto` (par défaut) : le mode normal est optimisé ; le mode verbeux utilise une sortie compacte
- `--ws-log compact` : sortie compacte (requête/réponse appariées) en mode verbeux
- `--ws-log full` : sortie complète par trame en mode verbeux
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
# optimisé (uniquement erreurs/lenteurs)
openclaw gateway

# afficher tout le trafic WS (apparié)
openclaw gateway --verbose --ws-log compact

# afficher tout le trafic WS (métadonnées complètes)
openclaw gateway --verbose --ws-log full
```

## Formatage de la console (journalisation par sous-système)

Le formateur de console est **sensible au TTY** et affiche des lignes cohérentes avec préfixe.
Les loggers de sous-système gardent la sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration par niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal enrichi** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), tout en respectant `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les segments initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-loggers par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans formatage)
- **Styles de console** (par ex. `pretty | compact | json`)
- **Niveau de journal de console** séparé du niveau de journal de fichier (le fichier conserve tout le détail lorsque `logging.level` est défini sur `debug`/`trace`)
- **Les corps de message WhatsApp** sont journalisés au niveau `debug` (utilisez `--verbose` pour les voir)

Cela permet de conserver des journaux de fichiers existants stables tout en rendant la sortie interactive facile à parcourir.

## Liens connexes

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostics](/fr/gateway/diagnostics)
