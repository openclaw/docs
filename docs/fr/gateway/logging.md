---
read_when:
    - Modifier la sortie ou les formats de journalisation
    - Débogage de la sortie de la CLI ou du Gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et mise en forme de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-05-01T07:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble destinée aux utilisateurs (CLI + interface de contrôle + configuration), consultez [/logging](/fr/logging).

OpenClaw a deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface de débogage).
- **Journaux fichier** (lignes JSON) écrits par le journaliseur du Gateway.

## Journaliseur basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du Gateway.
- Les fichiers journaux actifs font l’objet d’une rotation à `logging.maxFileBytes` (par défaut : 100 Mo), en conservant
  jusqu’à cinq archives numérotées et en continuant à écrire dans un nouveau fichier actif.
- Le chemin et le niveau du fichier journal peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format de fichier est un objet JSON par ligne.

L’onglet Journaux de l’interface de contrôle suit ce fichier via le Gateway (`logs.tail`).
La CLI peut faire de même :

```bash
openclaw logs --follow
```

**Verbosité et niveaux de journalisation**

- Les **journaux fichier** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité de la console** (et le style des journaux WS) ; il ne
  relève **pas** le niveau de journalisation du fichier.
- Pour capturer les détails visibles uniquement en mode verbeux dans les journaux fichier, définissez `logging.level` sur `debug` ou
  `trace`.

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux fichier,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez régler indépendamment la verbosité de la console via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Caviardage

OpenClaw peut masquer les jetons sensibles avant que la sortie des journaux ou des transcriptions ne quitte le
processus. Cette politique de caviardage de journalisation est appliquée aux sorties console, journaux fichier, enregistrements
de journaux OTLP et texte de transcription de session, de sorte que les valeurs secrètes correspondantes sont
masquées avant que les lignes JSONL ou les messages ne soient écrits sur le disque.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (`gi` automatique), ou `/pattern/flags` si vous avez besoin de drapeaux personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les indicateurs CLI, les champs JSON, les en-têtes bearer, les blocs PEM, les préfixes de jetons populaires et les noms de champs d’identifiants de paiement tels que numéro de carte, CVC/CVV, jeton de paiement partagé et identifiant de paiement.

Certaines limites de sécurité caviardent toujours, indépendamment de `logging.redactSensitive`.
Cela inclut les événements d’appel d’outil de l’interface de contrôle, la sortie de l’outil `sessions_history`,
les exports de support de diagnostics, les observations d’erreurs de fournisseurs, l’affichage des commandes d’approbation
exec et les journaux du protocole WebSocket du Gateway. Ces surfaces peuvent toujours utiliser
`logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"`
ne leur fait pas émettre de secrets bruts.

## Journaux WebSocket du Gateway

Le Gateway affiche les journaux du protocole WebSocket dans deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbeux (`--verbose`)** : affiche tout le trafic de requête/réponse WS.

### Style des journaux WS

`openclaw gateway` prend en charge un commutateur de style propre au Gateway :

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

## Mise en forme de la console (journalisation par sous-système)

Le formateur de console est **adapté aux TTY** et affiche des lignes cohérentes avec préfixe.
Les journaliseurs de sous-systèmes gardent la sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par exemple `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration du niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les préfixes initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par exemple `whatsapp/outbound`)
- **Sous-journaliseurs par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans mise en forme)
- **Styles de console** (par exemple `pretty | compact | json`)
- **Niveau de journalisation console** distinct du niveau de journalisation fichier (le fichier conserve tous les détails lorsque `logging.level` est défini sur `debug`/`trace`)
- **Les corps de messages WhatsApp** sont journalisés au niveau `debug` (utilisez `--verbose` pour les voir)

Cela garde les journaux fichier existants stables tout en rendant la sortie interactive facile à parcourir.

## Connexe

- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry)
- [Export de diagnostics](/fr/gateway/diagnostics)
