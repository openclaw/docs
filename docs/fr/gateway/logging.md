---
read_when:
    - Modifier la sortie ou les formats de journalisation
    - Débogage de la sortie de la CLI ou du Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et mise en forme de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-05-06T17:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble destinée aux utilisateurs (CLI + interface de contrôle + configuration), consultez [/logging](/fr/logging).

OpenClaw dispose de deux « surfaces » de journaux :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface Debug).
- **Journaux de fichiers** (lignes JSON) écrits par le journaliseur du Gateway.

Au démarrage, le Gateway consigne le modèle d’agent par défaut résolu avec les
valeurs par défaut du mode qui affectent les nouvelles sessions, par exemple :

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` provient de l’agent par défaut, des paramètres du modèle ou de la valeur
par défaut globale de l’agent ; lorsqu’il n’est pas défini, le résumé de démarrage
affiche `medium`. `fast` provient de l’agent par défaut ou des paramètres `fastMode`
du modèle.

## Journaliseur basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du Gateway.
- Les fichiers journaux actifs tournent à `logging.maxFileBytes` (par défaut : 100 MB), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin et le niveau du fichier journal peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format du fichier est d’un objet JSON par ligne.

Les chemins de code de conversation, de voix en temps réel et de salon géré utilisent le journaliseur de fichiers partagé pour
des enregistrements de cycle de vie bornés. Ces enregistrements sont destinés au débogage opérationnel
et à l’exportation des journaux OTLP ; le texte de transcription, les charges utiles audio, les identifiants de tour, les identifiants d’appel et
les identifiants d’éléments de fournisseur ne sont pas copiés dans l’enregistrement de journal.

L’onglet Journaux de l’interface de contrôle suit ce fichier via le Gateway (`logs.tail`).
La CLI peut faire la même chose :

```bash
openclaw logs --follow
```

**Verbeux ou niveaux de journal**

- Les **journaux de fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité de la console** (et le style des journaux WS) ; il ne
  relève **pas** le niveau de journal des fichiers.
- Pour capturer les détails réservés au mode verbeux dans les journaux de fichiers, définissez `logging.level` sur `debug` ou
  `trace`.
- La journalisation de trace inclut également des résumés de minutage de diagnostic pour certains chemins critiques,
  comme la préparation des fabriques d’outils de Plugin. Consultez
  [/tools/plugin#slow-plugin-tool-setup](/fr/tools/plugin#slow-plugin-tool-setup).

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichiers,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez régler la verbosité de la console indépendamment via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Caviardage

OpenClaw peut masquer les jetons sensibles avant que la sortie de journal ou de transcription ne quitte le
processus. Cette politique de caviardage de la journalisation s’applique aux sorties de texte de console, de fichier journal, d’enregistrements
de journal OTLP et de transcription de session, de sorte que les valeurs secrètes correspondantes sont
masquées avant que les lignes JSONL ou les messages soient écrits sur le disque.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (`gi` automatique), ou `/pattern/flags` si vous avez besoin d’indicateurs personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + les 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les indicateurs CLI, les champs JSON, les en-têtes bearer, les blocs PEM, les préfixes de jetons populaires et les noms de champs d’identifiants de paiement tels que numéro de carte, CVC/CVV, jeton de paiement partagé et identifiant de paiement.

Certaines limites de sécurité caviardent toujours, quelle que soit la valeur de `logging.redactSensitive`.
Cela inclut les événements d’appel d’outil de l’interface de contrôle, la sortie de l’outil `sessions_history`,
les exportations de support de diagnostic, les observations d’erreur de fournisseur, l’affichage des commandes d’approbation
d’exécution et les journaux de protocole WebSocket du Gateway. Ces surfaces peuvent toujours utiliser
`logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"`
ne leur fait pas émettre de secrets bruts.

## Journaux WebSocket du Gateway

Le Gateway affiche les journaux du protocole WebSocket dans deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbeux (`--verbose`)** : affiche tout le trafic de requête/réponse WS.

### Style de journal WS

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

## Mise en forme de la console (journalisation des sous-systèmes)

Le formateur de console est **compatible TTY** et affiche des lignes cohérentes avec préfixe.
Les journaliseurs de sous-systèmes gardent la sortie groupée et lisible.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration du niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les préfixes initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-journaliseurs par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans mise en forme)
- **Styles de console** (par ex. `pretty | compact | json`)
- **Niveau de journal de console** séparé du niveau de journal de fichier (le fichier conserve le niveau de détail complet lorsque `logging.level` est défini sur `debug`/`trace`)
- Les **corps de messages WhatsApp** sont journalisés au niveau `debug` (utilisez `--verbose` pour les voir)

Cela maintient la stabilité des journaux de fichiers existants tout en rendant la sortie interactive lisible.

## Associé

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostics](/fr/gateway/diagnostics)
