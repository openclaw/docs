---
read_when:
    - Modification de la sortie ou des formats de journalisation
    - Débogage de la sortie CLI ou Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et mise en forme de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-05-06T07:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble orientée utilisateur (CLI + Control UI + configuration), consultez [/logging](/fr/logging).

OpenClaw a deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / Debug UI).
- **Journaux fichier** (lignes JSON) écrits par le logger du Gateway.

Au démarrage, le Gateway journalise le modèle d’agent par défaut résolu avec les
valeurs par défaut de mode qui affectent les nouvelles sessions, par exemple :

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` provient de l’agent par défaut, des paramètres du modèle ou de la valeur
globale par défaut de l’agent ; lorsqu’il n’est pas défini, le résumé de démarrage
affiche `medium`. `fast` provient de l’agent par défaut ou des paramètres `fastMode`
du modèle.

## Logger basé sur fichier

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du Gateway.
- Les fichiers journaux actifs effectuent une rotation à `logging.maxFileBytes` (par défaut : 100 Mo), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin et le niveau du fichier journal peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format du fichier est d’un objet JSON par ligne.

L’onglet Logs de la Control UI suit ce fichier via le Gateway (`logs.tail`).
La CLI peut faire la même chose :

```bash
openclaw logs --follow
```

**Verbeux et niveaux de journalisation**

- Les **journaux fichier** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité de la console** (et le style des journaux WS) ; il **n’augmente pas**
  le niveau de journalisation du fichier.
- Pour capturer dans les journaux fichier les détails visibles uniquement en mode verbeux, définissez `logging.level` sur `debug` ou
  `trace`.
- La journalisation trace inclut aussi des résumés de chronométrage de diagnostic pour certains chemins critiques,
  comme la préparation de la factory d’outils de Plugin. Voir
  [/tools/plugin#slow-plugin-tool-setup](/fr/tools/plugin#slow-plugin-tool-setup).

## Capture console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux fichier,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez régler indépendamment la verbosité de la console via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Caviardage

OpenClaw peut masquer les jetons sensibles avant que la sortie de journal ou de transcription ne quitte le
processus. Cette politique de caviardage de la journalisation est appliquée aux sorties texte de console, de journal fichier, d’enregistrement
de journal OTLP et de transcription de session, de sorte que les valeurs secrètes correspondantes sont
masquées avant l’écriture des lignes JSONL ou des messages sur disque.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (`gi` automatique), ou `/pattern/flags` si vous avez besoin de flags personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les flags CLI, les champs JSON, les en-têtes bearer, les blocs PEM, les préfixes de jetons populaires et les noms de champs d’identifiants de paiement comme le numéro de carte, CVC/CVV, le jeton de paiement partagé et l’identifiant de paiement.

Certaines limites de sécurité caviardent toujours, indépendamment de `logging.redactSensitive`.
Cela inclut les événements d’appels d’outils de la Control UI, la sortie de l’outil `sessions_history`,
les exports de support de diagnostic, les observations d’erreurs de fournisseurs, l’affichage des commandes
d’approbation d’exécution et les journaux du protocole WebSocket du Gateway. Ces surfaces peuvent toujours utiliser
`logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"`
ne leur fait pas émettre de secrets bruts.

## Journaux WebSocket du Gateway

Le gateway affiche les journaux du protocole WebSocket selon deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbeux (`--verbose`)** : affiche tout le trafic de requêtes/réponses WS.

### Style des journaux WS

`openclaw gateway` prend en charge un commutateur de style par gateway :

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

Le formateur de console est **compatible TTY** et affiche des lignes préfixées cohérentes.
Les loggers de sous-système gardent la sortie regroupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (p. ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration par niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les `gateway/` + `channels/` initiaux, conserve les 2 derniers segments (p. ex. `whatsapp/outbound`)
- **Sous-loggers par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans formatage)
- **Styles de console** (p. ex. `pretty | compact | json`)
- **Niveau de journalisation console** séparé du niveau de journalisation fichier (le fichier conserve tous les détails quand `logging.level` est défini sur `debug`/`trace`)
- Les **corps de messages WhatsApp** sont journalisés au niveau `debug` (utilisez `--verbose` pour les voir)

Cela garde les journaux fichier existants stables tout en rendant la sortie interactive facile à parcourir.

## Connexe

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostic](/fr/gateway/diagnostics)
