---
read_when:
    - Modification de la sortie ou des formats de journalisation
    - Débogage de la sortie de la CLI ou du Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et mise en forme de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-04-30T07:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble destinée aux utilisateurs (CLI + interface de contrôle + configuration), consultez [/logging](/fr/logging).

OpenClaw a deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface de débogage).
- **Journaux de fichiers** (lignes JSON) écrits par le journaliseur du Gateway.

## Journaliseur basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du Gateway.
- Les fichiers journaux actifs font une rotation à `logging.maxFileBytes` (par défaut : 100 Mo), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin du fichier journal et le niveau peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format du fichier est d’un objet JSON par ligne.

L’onglet Journaux de l’interface de contrôle suit ce fichier via le Gateway (`logs.tail`).
La CLI peut faire de même :

```bash
openclaw logs --follow
```

**Verbosité vs niveaux de journalisation**

- Les **journaux de fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité de la console** (et le style des journaux WS) ; il ne
  relève **pas** le niveau des journaux de fichiers.
- Pour capturer les détails réservés au mode verbeux dans les journaux de fichiers, définissez `logging.level` sur `debug` ou
  `trace`.

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichiers,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez régler indépendamment la verbosité de la console via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Caviardage

OpenClaw peut masquer les jetons sensibles avant que les sorties de journaux ou de transcriptions ne quittent le
processus. Cette politique de caviardage de la journalisation est appliquée aux sorties texte de console, de fichier journal, d’enregistrements
de journaux OTLP et de transcriptions de session, de sorte que les valeurs secrètes correspondantes soient
masquées avant que les lignes JSONL ou les messages ne soient écrits sur disque.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (`gi` automatique), ou `/pattern/flags` si vous avez besoin d’indicateurs personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les flags CLI, les champs JSON, les en-têtes bearer, les blocs PEM et les préfixes de jetons populaires.

Certaines limites de sécurité caviardent toujours, indépendamment de `logging.redactSensitive`.
Cela inclut les événements d’appels d’outils de l’interface de contrôle, la sortie de l’outil `sessions_history`,
les exports de support de diagnostic, les observations d’erreurs de fournisseurs, l’affichage des commandes d’approbation
exec et les journaux du protocole WebSocket du Gateway. Ces surfaces peuvent toujours utiliser
`logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"`
ne leur fait pas émettre de secrets bruts.

## Journaux WebSocket du Gateway

Le Gateway affiche les journaux du protocole WebSocket dans deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbeux (`--verbose`)** : affiche tout le trafic de requêtes/réponses WS.

### Style des journaux WS

`openclaw gateway` prend en charge un commutateur de style par Gateway :

- `--ws-log auto` (par défaut) : le mode normal est optimisé ; le mode verbeux utilise une sortie compacte
- `--ws-log compact` : sortie compacte (requête/réponse appariées) en mode verbeux
- `--ws-log full` : sortie complète par trame en mode verbeux
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formatage de la console (journalisation par sous-système)

Le formateur de console est **adapté au TTY** et affiche des lignes cohérentes et préfixées.
Les journaliseurs de sous-systèmes gardent la sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration du niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les préfixes initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-journaliseurs par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (aucun préfixe, aucun formatage)
- **Styles de console** (par ex. `pretty | compact | json`)
- **Niveau de journalisation de la console** séparé du niveau de journalisation des fichiers (le fichier conserve tous les détails quand `logging.level` est défini sur `debug`/`trace`)
- **Les corps des messages WhatsApp** sont journalisés à `debug` (utilisez `--verbose` pour les voir)

Cela garde les journaux de fichiers existants stables tout en rendant la sortie interactive facile à parcourir.

## Associé

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostic](/fr/gateway/diagnostics)
