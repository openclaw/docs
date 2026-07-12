---
read_when:
    - Modification de la sortie ou des formats de journalisation
    - Débogage de la sortie de la CLI ou du Gateway
summary: Surfaces de journalisation, journaux dans des fichiers, styles de journaux WS et mise en forme de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-07-12T02:39:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Journalisation

Pour une vue d’ensemble destinée aux utilisateurs (CLI + interface de contrôle + configuration), consultez [/logging](/fr/logging).

OpenClaw dispose de deux surfaces de journalisation :

- **Sortie de la console** - ce que vous voyez dans le terminal ou l’interface de débogage.
- **Journaux dans des fichiers** - lignes JSON écrites par le journaliseur du Gateway.

Au démarrage, le Gateway journalise le modèle résolu de l’agent par défaut ainsi que les modes par défaut qui affectent les nouvelles sessions :

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` provient de l’agent par défaut, des paramètres du modèle ou de la valeur globale par défaut de l’agent ; lorsqu’il n’est pas défini, `medium` est affiché. `fast` provient de l’agent par défaut ou des paramètres `fastMode` du modèle.

## Journaliseur basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`, daté selon le fuseau horaire local de l’hôte du Gateway. Si ce répertoire n’est pas sûr ou n’est pas accessible en écriture (propriétaire incorrect, accessible en écriture par tous ou lien symbolique), OpenClaw utilise à la place un chemin `os.tmpdir()/openclaw-<uid>` propre à l’utilisateur ; sous Windows, ce chemin de repli dans le répertoire temporaire du système d’exploitation est toujours utilisé.
- Les fichiers journaux actifs sont soumis à une rotation lorsqu’ils atteignent `logging.maxFileBytes` (valeur par défaut : 100 Mo), avec conservation de cinq archives numérotées au maximum (`.1` à `.5`) et poursuite de l’écriture dans un nouveau fichier actif.
- Configurez le chemin et le niveau du fichier journal dans `~/.openclaw/openclaw.json` : `logging.file`, `logging.level`.
- Le format du fichier contient un objet JSON par ligne.

Les chemins de code pour la conversation, la voix en temps réel et les salons gérés utilisent le journaliseur de fichiers partagé afin de produire des enregistrements de cycle de vie limités, destinés au débogage opérationnel et à l’exportation des journaux OTLP. Le texte des transcriptions, les charges utiles audio, les identifiants de tours, d’appels et d’éléments de fournisseur ne sont jamais copiés dans l’enregistrement du journal.

L’onglet Journaux de l’interface de contrôle suit ce fichier via le Gateway (`logs.tail`). La CLI fait de même :

```bash
openclaw logs --follow
```

### Mode détaillé et niveaux de journalisation

- Les **journaux dans des fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` affecte uniquement la **verbosité de la console** (ainsi que le style des journaux WS) ; il **n’augmente pas** le niveau de journalisation des fichiers.
- Pour enregistrer dans les fichiers journaux les détails visibles uniquement en mode détaillé, définissez `logging.level` sur `debug` ou `trace`.
- La journalisation de niveau trace comprend également des synthèses diagnostiques de durée pour certains chemins critiques, comme la préparation de la fabrique d’outils des plugins. Consultez [/tools/plugin#slow-plugin-tool-setup](/fr/tools/plugin#slow-plugin-tool-setup).

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace`, les écrit dans les fichiers journaux et continue de les afficher sur stdout/stderr.

Réglez indépendamment la verbosité de la console :

- `logging.consoleLevel` (valeur par défaut : `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json` ; valeur par défaut : `pretty` sur un TTY, `compact` dans les autres cas)

## Masquage

OpenClaw masque les jetons sensibles avant que la sortie des journaux ou des transcriptions ne quitte le processus. Cette politique de masquage s’applique aux sorties de la console, aux fichiers journaux, aux enregistrements de journaux OTLP et aux sorties textuelles des transcriptions de session, afin que les valeurs secrètes correspondantes soient masquées avant l’écriture de lignes JSONL ou de messages sur le disque.

- `logging.redactSensitive` : `off` | `tools` (valeur par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes d’expressions régulières (remplace les valeurs par défaut)
  - Utilisez des chaînes d’expressions régulières brutes (`gi` appliqué automatiquement), ou `/pattern/flags` pour des indicateurs personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers et les 4 derniers caractères (pour les valeurs d’au moins 18 caractères) ; les valeurs plus courtes deviennent `***`.
  - Les valeurs par défaut couvrent les affectations courantes de clés, les options de la CLI, les champs JSON, les en-têtes de type bearer, les blocs PEM, les préfixes de jetons de fournisseurs courants et les noms de champs d’identifiants de paiement (numéro de carte, CVC/CVV, jeton de paiement partagé, identifiant de paiement).

Certaines limites de sécurité appliquent toujours le masquage, quelle que soit la valeur de `logging.redactSensitive` : événements d’appel d’outil de l’interface de contrôle, sortie de l’outil `sessions_history`, exportations de diagnostic pour l’assistance, observations des erreurs des fournisseurs, affichage des commandes soumises à approbation d’exécution et journaux du protocole WebSocket du Gateway. Ces surfaces prennent toujours en compte `logging.redactPatterns` comme motifs supplémentaires, mais `redactSensitive: "off"` ne leur permet pas d’émettre des secrets en clair.

## Journaux WebSocket du Gateway

Le Gateway affiche les journaux du protocole WebSocket selon deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés — erreurs (`ok=false`), appels lents (seuil par défaut : `>= 50ms`) et erreurs d’analyse.
- **Mode détaillé (`--verbose`)** : affiche tout le trafic de requêtes et de réponses WS.

### Style des journaux WS

`openclaw gateway` prend en charge un sélecteur de style propre à chaque Gateway :

- `--ws-log auto` (valeur par défaut) : le mode normal est optimisé ; le mode détaillé utilise une sortie compacte.
- `--ws-log compact` : sortie compacte (requête et réponse appariées) en mode détaillé.
- `--ws-log full` : sortie complète par trame en mode détaillé.
- `--compact` : alias de `--ws-log compact`.

```bash
# optimisé (uniquement les erreurs/appels lents)
openclaw gateway

# afficher tout le trafic WS (apparié)
openclaw gateway --verbose --ws-log compact

# afficher tout le trafic WS (métadonnées complètes)
openclaw gateway --verbose --ws-log full
```

## Formatage de la console (journalisation par sous-système)

Le formateur de la console **détecte les TTY** et affiche des lignes cohérentes dotées d’un préfixe. Les journaliseurs de sous-systèmes regroupent les sorties pour faciliter leur consultation :

- **Préfixes de sous-système** sur chaque ligne (par exemple `[gateway]`, `[canvas]`, `[tailscale]`).
- **Couleurs des sous-systèmes** (stables pour chaque sous-système, dérivées par hachage du nom), auxquelles s’ajoute la coloration selon le niveau.
- **Couleur lorsque la sortie est un TTY** ou que l’environnement ressemble à un terminal enrichi (`TERM`/`COLORTERM`/`TERM_PROGRAM`) ; respecte `NO_COLOR` et `FORCE_COLOR`.
- **Préfixes de sous-système raccourcis** : supprime un segment initial `gateway/`, `channels/` ou `providers/`, puis conserve au maximum les deux derniers segments restants (par exemple, `channels/turn/kernel` s’affiche sous la forme `turn/kernel`). Les sous-systèmes de canaux connus (`telegram`, `whatsapp`, `slack`, etc.) sont toujours réduits au seul nom du canal.
- **Sous-journaliseurs par sous-système** (préfixe automatique + champ structuré `{ subsystem }`).
- **`logRaw()`** pour les sorties QR/UX (sans préfixe ni formatage).
- **Styles de console** : `pretty` | `compact` | `json`.
- Le **niveau de journalisation de la console** est distinct de celui des fichiers (les fichiers conservent tous les détails lorsque `logging.level` vaut `debug` ou `trace`).
- Le **corps des messages WhatsApp** est journalisé au niveau `debug` (utilisez `--verbose` pour le voir).

Cela préserve la stabilité des fichiers journaux tout en facilitant la consultation des sorties interactives.

## Voir aussi

- [Journalisation](/fr/logging)
- [Exportation OpenTelemetry](/fr/gateway/opentelemetry)
- [Exportation des diagnostics](/fr/gateway/diagnostics)
