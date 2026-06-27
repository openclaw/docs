---
read_when:
    - Modification de la sortie ou des formats de journalisation
    - Débogage de la sortie de la CLI ou du Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et formatage de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-06-27T17:31:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble destinée aux utilisateurs (CLI + Control UI + config), consultez [/logging](/fr/logging).

OpenClaw a deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface Debug).
- **Journaux de fichiers** (lignes JSON) écrits par le journaliseur du Gateway.

Au démarrage, le Gateway journalise le modèle d’agent par défaut résolu avec les
valeurs par défaut de mode qui affectent les nouvelles sessions, par exemple :

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` provient de l’agent par défaut, des paramètres du modèle ou de la valeur
globale par défaut de l’agent ; lorsqu’il n’est pas défini, le récapitulatif de
démarrage affiche `medium`. `fast` provient de l’agent par défaut ou des paramètres
`fastMode` du modèle.

## Journaliseur basé sur des fichiers

- Le fichier journal roulant par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du Gateway.
- Les fichiers journaux actifs tournent à `logging.maxFileBytes` (par défaut : 100 Mo), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin et le niveau du fichier journal peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format de fichier est un objet JSON par ligne.

Les chemins de code de conversation, de voix en temps réel et de salles gérées utilisent le journaliseur de fichiers partagé pour
des enregistrements de cycle de vie bornés. Ces enregistrements sont destinés au débogage opérationnel
et à l’exportation de journaux OTLP ; le texte de transcription, les charges utiles audio, les identifiants de tour, les identifiants d’appel et
les identifiants d’éléments fournisseur ne sont pas copiés dans l’enregistrement de journal.

L’onglet Journaux du Control UI suit ce fichier via le Gateway (`logs.tail`).
La CLI peut faire de même :

```bash
openclaw logs --follow
```

**Verbeux vs niveaux de journalisation**

- Les **journaux de fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` affecte uniquement la **verbosité de la console** (et le style des journaux WS) ; il ne
  relève **pas** le niveau des journaux de fichiers.
- Pour capturer les détails uniquement verbeux dans les journaux de fichiers, définissez `logging.level` sur `debug` ou
  `trace`.
- La journalisation trace inclut aussi des récapitulatifs de chronométrage diagnostique pour certains chemins critiques,
  comme la préparation des fabriques d’outils de Plugin. Consultez
  [/tools/plugin#slow-plugin-tool-setup](/fr/tools/plugin#slow-plugin-tool-setup).

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichiers,
tout en continuant à les imprimer vers stdout/stderr.

Vous pouvez régler indépendamment la verbosité de la console via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Caviardage

OpenClaw peut masquer les jetons sensibles avant que la sortie de journal ou de transcription ne quitte le
processus. Cette politique de caviardage de journalisation est appliquée aux puits de texte de console, de journal de fichiers, d’enregistrements
de journaux OTLP et de transcriptions de session, afin que les valeurs secrètes correspondantes soient
masquées avant l’écriture des lignes JSONL ou des messages sur le disque.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (`gi` automatique), ou `/pattern/flags` si vous avez besoin d’indicateurs personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les indicateurs CLI, les champs JSON, les en-têtes bearer, les blocs PEM, les préfixes de jetons populaires et les noms de champs d’identifiants de paiement comme le numéro de carte, CVC/CVV, le jeton de paiement partagé et l’identifiant de paiement.

Certaines limites de sécurité caviardent toujours, quel que soit `logging.redactSensitive`.
Cela inclut les événements d’appels d’outils du Control UI, la sortie de l’outil `sessions_history`,
les exportations de support de diagnostics, les observations d’erreurs fournisseur, l’affichage des commandes
d’approbation exec et les journaux du protocole WebSocket du Gateway. Ces surfaces peuvent toujours utiliser
`logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"`
ne leur fait pas émettre de secrets bruts.

## Journaux WebSocket du Gateway

Le gateway imprime les journaux du protocole WebSocket dans deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont imprimés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbeux (`--verbose`)** : imprime tout le trafic de requêtes/réponses WS.

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

Le formateur de console est **conscient du TTY** et imprime des lignes cohérentes avec préfixe.
Les journaliseurs de sous-système gardent la sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration par niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les préfixes initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-journaliseurs par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (pas de préfixe, pas de formatage)
- **Styles de console** (par ex. `pretty | compact | json`)
- **Niveau de journalisation console** distinct du niveau de journalisation fichier (le fichier conserve tous les détails lorsque `logging.level` est défini sur `debug`/`trace`)
- **Corps de messages WhatsApp** journalisés à `debug` (utilisez `--verbose` pour les voir)

Cela garde les journaux de fichiers existants stables tout en rendant la sortie interactive facile à parcourir.

## Associé

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostics](/fr/gateway/diagnostics)
