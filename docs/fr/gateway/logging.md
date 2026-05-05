---
read_when:
    - Modifier la sortie ou les formats de journalisation
    - Débogage de la sortie de la CLI ou du Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et formatage de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-05-05T01:47:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble destinée aux utilisateurs (CLI + interface de contrôle + configuration), consultez [/logging](/fr/logging).

OpenClaw dispose de deux « surfaces » de journaux :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface de débogage).
- **Journaux de fichier** (lignes JSON) écrits par le journaliseur du Gateway.

Au démarrage, le Gateway journalise le modèle d’agent par défaut résolu avec les
valeurs par défaut de mode qui affectent les nouvelles sessions, par exemple :

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` provient de l’agent par défaut, des paramètres du modèle ou de la valeur
par défaut globale de l’agent ; lorsqu’il n’est pas défini, le résumé de démarrage
affiche `medium`. `fast` provient de l’agent par défaut ou des paramètres
`fastMode` du modèle.

## Journaliseur basé sur les fichiers

- Le fichier de journal tournant par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du Gateway.
- Les fichiers de journal actifs tournent à `logging.maxFileBytes` (par défaut : 100 Mo), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin et le niveau du fichier de journal peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format de fichier est d’un objet JSON par ligne.

L’onglet Journaux de l’interface de contrôle suit ce fichier via le Gateway (`logs.tail`).
La CLI peut faire la même chose :

```bash
openclaw logs --follow
```

**Mode détaillé vs niveaux de journalisation**

- Les **journaux de fichier** sont contrôlés exclusivement par `logging.level`.
- `--verbose` affecte uniquement la **verbosité de la console** (et le style des journaux WS) ; il ne
  relève **pas** le niveau des journaux de fichier.
- Pour capturer les détails disponibles uniquement en mode détaillé dans les journaux de fichier, définissez `logging.level` sur `debug` ou
  `trace`.
- La journalisation de trace inclut aussi des résumés de diagnostic de minutage pour certains chemins critiques,
  comme la préparation de la fabrique d’outils de Plugin. Voir
  [/tools/plugin#slow-plugin-tool-setup](/fr/tools/plugin#slow-plugin-tool-setup).

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichier,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez régler indépendamment la verbosité de la console via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Caviardage

OpenClaw peut masquer les jetons sensibles avant que la sortie de journal ou de transcript ne quitte le
processus. Cette politique de caviardage de journalisation est appliquée aux récepteurs de texte console,
journal de fichier, enregistrement de journal OTLP et transcript de session, afin que les valeurs secrètes
correspondantes soient masquées avant que les lignes JSONL ou les messages soient écrits sur disque.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (`gi` automatique), ou `/pattern/flags` si vous avez besoin de drapeaux personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les options de CLI, les champs JSON, les en-têtes bearer, les blocs PEM, les préfixes de jetons populaires et les noms de champs d’identifiants de paiement comme le numéro de carte, le CVC/CVV, le jeton de paiement partagé et l’identifiant de paiement.

Certaines limites de sécurité caviardent toujours, quelle que soit la valeur de `logging.redactSensitive`.
Cela inclut les événements d’appels d’outils de l’interface de contrôle, la sortie d’outil
`sessions_history`, les exports de support de diagnostics, les observations d’erreurs de fournisseur,
l’affichage des commandes d’approbation exec et les journaux du protocole WebSocket du Gateway. Ces surfaces peuvent toujours utiliser
`logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"`
ne leur fait pas émettre de secrets bruts.

## Journaux WebSocket du Gateway

Le Gateway affiche les journaux du protocole WebSocket selon deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode détaillé (`--verbose`)** : affiche tout le trafic de requêtes/réponses WS.

### Style des journaux WS

`openclaw gateway` prend en charge un sélecteur de style par Gateway :

- `--ws-log auto` (par défaut) : le mode normal est optimisé ; le mode détaillé utilise une sortie compacte
- `--ws-log compact` : sortie compacte (requête/réponse appariées) en mode détaillé
- `--ws-log full` : sortie complète par trame en mode détaillé
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

Le formateur de console est **conscient du TTY** et affiche des lignes cohérentes et préfixées.
Les journaliseurs de sous-système gardent la sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration du niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les préfixes initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-journaliseurs par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans formatage)
- **Styles de console** (par ex. `pretty | compact | json`)
- **Niveau de journalisation console** séparé du niveau de journalisation fichier (le fichier conserve tous les détails lorsque `logging.level` est défini sur `debug`/`trace`)
- **Corps des messages WhatsApp** journalisés à `debug` (utilisez `--verbose` pour les voir)

Cela maintient la stabilité des journaux de fichier existants tout en rendant la sortie interactive facile à parcourir.

## Connexe

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostics](/fr/gateway/diagnostics)
