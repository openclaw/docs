---
read_when:
    - Vous avez besoin d’une présentation de la journalisation d’OpenClaw adaptée aux débutants
    - Vous souhaitez configurer les niveaux de journalisation, les formats ou la caviardisation
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Journaux de fichiers, sortie de la console, suivi en temps réel via la CLI et onglet Journaux de l’interface de contrôle
title: Journalisation
x-i18n:
    generated_at: "2026-07-12T15:34:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw dispose de deux principales surfaces de journalisation :

- **Journaux dans des fichiers** (lignes JSON) écrits par le Gateway.
- **Sortie de console** dans le terminal exécutant le Gateway.

L’onglet **Journaux** de l’interface de contrôle suit en temps réel le fichier journal du Gateway. Cette page explique où
se trouvent les journaux, comment les lire et comment configurer leurs niveaux et formats.

## Emplacement des journaux

Par défaut, le Gateway écrit un fichier journal rotatif par jour :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du Gateway. Lorsque `/tmp/openclaw` n’est pas sûr
ou n’est pas disponible (et toujours sous Windows), OpenClaw utilise à la place un répertoire
`openclaw-<uid>` propre à l’utilisateur dans le répertoire temporaire du système d’exploitation. Les fichiers journaux datés sont
supprimés après 24 heures.

Chaque fichier est soumis à une rotation lorsque l’écriture suivante dépasserait `logging.maxFileBytes`
(valeur par défaut : 100 MB). OpenClaw conserve jusqu’à cinq archives numérotées à côté du
fichier actif, telles que `openclaw-YYYY-MM-DD.1.log`, et continue à écrire dans un nouveau
journal actif au lieu de supprimer les diagnostics.

Vous pouvez remplacer le chemin dans `~/.openclaw/openclaw.json` :

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Lecture des journaux

### CLI : suivi en temps réel (recommandé)

Suivez le fichier journal du Gateway via RPC :

```bash
openclaw logs --follow
```

Options :

| Option              | Valeur par défaut | Comportement                                                                         |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `--follow`          | désactivé         | Poursuit le suivi ; se reconnecte avec temporisation progressive après une déconnexion |
| `--limit <n>`       | `200`             | Nombre maximal de lignes par récupération                                            |
| `--max-bytes <n>`   | `250000`          | Nombre maximal d’octets à lire par récupération                                      |
| `--interval <ms>`   | `1000`            | Intervalle d’interrogation pendant le suivi                                           |
| `--json`            | désactivé         | JSON délimité par lignes (un événement par ligne)                                    |
| `--plain`           | désactivé         | Force le texte brut dans les sessions TTY                                             |
| `--no-color`        | —                 | Désactive les couleurs ANSI                                                           |
| `--utc`             | désactivé         | Affiche les horodatages en UTC (l’heure locale est utilisée par défaut)              |
| `--local-time`      | désactivé         | Variante orthographique de compatibilité acceptée pour la valeur par défaut d’heure locale ; aucun autre effet |
| `--url` / `--token` | —                 | Options RPC standard du Gateway                                                       |
| `--timeout <ms>`    | `30000`           | Délai d’expiration RPC du Gateway                                                     |
| `--expect-final`    | désactivé         | Option d’attente de la réponse finale RPC prise en charge par un agent (acceptée ici via la couche cliente partagée) |

Modes de sortie :

- **Sessions TTY** : lignes de journal structurées, mises en forme et colorées.
- **Sessions non-TTY** : texte brut.

Lorsque vous fournissez explicitement `--url`, la CLI n’applique pas automatiquement les identifiants
de configuration ou d’environnement ; fournissez vous-même `--token`, sinon l’appel échoue avec
`gateway url override requires explicit credentials`.

En mode JSON, la CLI émet des objets étiquetés par `type` :

- `meta` : métadonnées du flux (fichier, source, sourceKind, service, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncation ou de rotation
- `raw` : ligne de journal non analysée
- `error` : échecs de connexion au Gateway (écrits dans stderr)

Si le Gateway implicite sur l’interface de bouclage locale demande un appairage, ferme la connexion pendant son établissement
ou expire avant que `logs.tail` ne réponde, `openclaw logs` se rabat automatiquement sur le
fichier journal du Gateway configuré. Les cibles `--url` explicites n’utilisent pas
ce mécanisme de repli. `openclaw logs --follow` est plus strict : sous Linux, il utilise le journal
du Gateway user-systemd actif par PID lorsqu’il est disponible ; sinon, il réessaie de joindre le
Gateway en direct avec une temporisation progressive au lieu de suivre un fichier adjacent
potentiellement obsolète.

Si le Gateway est inaccessible, la CLI affiche une brève suggestion d’exécuter :

```bash
openclaw doctor
```

### Interface de contrôle (web)

L’onglet **Journaux** de l’interface de contrôle suit le même fichier avec `logs.tail`.
Consultez [Interface de contrôle](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux propres aux canaux

Pour filtrer l’activité des canaux (WhatsApp/Telegram/etc.), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

La valeur par défaut de `--channel` est `all` ; `--lines <n>` (valeur par défaut : 200) et `--json` sont également
disponibles.

## Formats des journaux

### Journaux dans des fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et l’interface de contrôle analysent ces
entrées afin d’afficher une sortie structurée (heure, niveau, sous-système, message).

Les enregistrements JSONL des journaux dans des fichiers incluent également, lorsqu’ils sont
disponibles, des champs de premier niveau filtrables par machine :

- `hostname` : nom de l’hôte du Gateway.
- `message` : texte aplati du message de journal pour la recherche en texte intégral.
- `agent_id` : identifiant de l’agent actif lorsque l’appel de journalisation contient un contexte d’agent.
- `session_id` : identifiant ou clé de la session active lorsque l’appel de journalisation contient un contexte de session.
- `channel` : canal actif lorsque l’appel de journalisation contient un contexte de canal.

OpenClaw conserve les arguments de journalisation structurés d’origine avec ces champs
afin que les analyseurs existants qui lisent les clés d’arguments tslog numérotées continuent de fonctionner.

Les activités de conversation, de voix en temps réel et de salle gérée émettent des enregistrements
bornés du cycle de vie dans ce même pipeline de journalisation dans des fichiers. Ces enregistrements incluent le type d’événement,
le mode, le transport, le fournisseur ainsi que les mesures de taille et de durée lorsqu’elles sont disponibles, mais omettent
le texte des transcriptions, les charges utiles audio, les identifiants de tour, les identifiants d’appel et les identifiants d’élément du fournisseur.

### Sortie de console

Les journaux de console **tiennent compte du TTY** et sont formatés pour faciliter la lecture :

- Préfixes des sous-systèmes (par exemple `gateway/channels/whatsapp`)
- Coloration par niveau (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage de la console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket du Gateway

`openclaw gateway` dispose également d’une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : uniquement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic de requêtes et de réponses
- `--ws-log auto|compact|full` : sélectionne le style de rendu détaillé
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configuration de la journalisation

Toute la configuration de la journalisation se trouve sous `logging` dans `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Niveaux de journalisation

Niveaux : `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level` : niveau des **journaux dans des fichiers** (JSONL) (valeur par défaut : `info`).
- `logging.consoleLevel` : niveau de verbosité de la **console**.

Vous pouvez remplacer les deux avec la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par exemple `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement a priorité sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez également fournir l’option globale de la CLI **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` affecte uniquement la sortie de console et la verbosité des journaux WS ; il ne modifie pas
les niveaux des journaux dans des fichiers.

### Diagnostics ciblés du transport des modèles

Lors du débogage des appels aux fournisseurs, utilisez des options d’environnement ciblées au lieu d’augmenter
tous les journaux au niveau `debug` :

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Options disponibles :

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1` : émet le début de la requête, la réponse de récupération, les en-têtes du SDK,
  le premier événement de diffusion, la fin du flux et les erreurs de transport au niveau
  `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary` : inclut un résumé borné de la charge utile de la requête
  dans les journaux des requêtes de modèle.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools` : inclut tous les noms d’outils exposés au modèle dans
  le résumé de la charge utile.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` : inclut un instantané JSON expurgé et limité
  de la charge utile. À utiliser uniquement pendant le débogage ; les secrets sont expurgés, mais les invites
  et le texte des messages peuvent toujours être présents.
- `OPENCLAW_DEBUG_SSE=events` : émet la durée jusqu’au premier événement et jusqu’à la fin du flux.
- `OPENCLAW_DEBUG_SSE=peek` : émet également les cinq premières charges utiles expurgées des événements SSE,
  avec une limite par événement.
- `OPENCLAW_DEBUG_CODE_MODE=1` : émet les diagnostics de la surface du modèle en mode code,
  notamment lorsque les outils natifs du fournisseur sont masqués parce que le mode code contrôle la
  surface des outils.

Ces options utilisent la journalisation normale d’OpenClaw ; `openclaw logs --follow`
et l’onglet Journaux de l’interface de contrôle les affichent donc. Sans ces options, les mêmes diagnostics
restent disponibles au niveau `debug`.

Les métadonnées de début et de réponse `[model-fetch]` (fournisseur, API, modèle, état,
latence et champs de requête tels que méthode, URL, délai d’expiration, proxy et politique)
sont toujours émises au niveau `info`, indépendamment de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, afin que les informations sanitaires de base du transport des modèles soient visibles
sans options de débogage.

### Corrélation des traces

Les journaux dans des fichiers sont au format JSONL. Lorsqu’un appel de journalisation contient un contexte de trace de diagnostic valide,
OpenClaw écrit les champs de trace sous forme de clés JSON de premier niveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) afin que les processeurs de journaux externes puissent corréler la ligne
avec les segments OTEL et la propagation de `traceparent` par le fournisseur.

Les requêtes HTTP du Gateway et les trames WebSocket du Gateway établissent une portée interne de trace
de requête. Les journaux et événements de diagnostic émis dans cette portée asynchrone héritent
de la trace de la requête lorsqu’ils ne fournissent pas de contexte de trace explicite. Les traces d’exécution de l’agent et
d’appel du modèle deviennent des enfants de la trace de requête active, ce qui permet de relier les journaux locaux,
les instantanés de diagnostic, les segments OTEL et les en-têtes `traceparent` des fournisseurs approuvés
par `traceId` sans journaliser le contenu brut de la requête ou du modèle.

Les enregistrements de journal du cycle de vie des conversations sont également transmis à l’exportation des journaux diagnostics-otel lorsque
l’exportation des journaux OpenTelemetry est activée, avec les mêmes attributs bornés que les journaux dans des
fichiers. Configurez `diagnostics.otel.logsExporter` pour choisir OTLP, JSONL sur stdout ou
les deux destinations.

### Taille et durée des appels de modèle

Les diagnostics d’appels de modèle enregistrent des mesures bornées des requêtes et réponses sans
capturer le contenu brut des invites ou des réponses :

- `requestPayloadBytes` : taille en octets UTF-8 de la charge utile finale de la requête au modèle
- `responseStreamBytes` : taille en octets UTF-8 des charges utiles des fragments de réponse du modèle
  diffusés. Pour les événements fréquents de texte, de raisonnement et de delta d’appel d’outil, seuls
  les octets `delta` incrémentiels sont comptés, au lieu des instantanés `partial` complets.
- `timeToFirstByteMs` : temps écoulé avant le premier événement de réponse diffusé
- `durationMs` : durée totale de l’appel du modèle

Ces champs sont disponibles pour les instantanés de diagnostic, les hooks de Plugin d’appel du modèle et
les segments et métriques OTEL des appels de modèle lorsque l’exportation des diagnostics est activée.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial, coloré, avec des horodatages.
- `compact` : sortie plus dense (idéale pour les longues sessions).
- `json` : un objet JSON par ligne (pour les processeurs de journaux).

### Expurgation

OpenClaw peut expurger les jetons sensibles avant qu’ils n’atteignent la sortie de console, les journaux dans des fichiers,
les enregistrements de journaux OTLP, le texte persistant des transcriptions de session ou les charges utiles des événements d’outils
de l’interface de contrôle (arguments de démarrage de l’outil, charges utiles des résultats partiels ou finaux, sortie
d’exécution dérivée et résumés des correctifs) :

- `logging.redactSensitive` : `off` | `tools` (valeur par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes d’expressions régulières qui remplace l’ensemble par défaut pour la sortie des journaux et des transcriptions. Pour les charges utiles d’outils de l’interface de contrôle, les motifs personnalisés s’appliquent en plus des valeurs par défaut intégrées ; l’ajout d’un motif ne réduit donc jamais l’expurgation des valeurs déjà détectées par les valeurs par défaut.

Les journaux dans des fichiers et les transcriptions de session restent au format JSONL, mais les valeurs secrètes correspondantes sont
masquées avant l’écriture de la ligne ou du message sur le disque. L’expurgation s’effectue au mieux :
elle s’applique au contenu textuel des messages et aux chaînes de journalisation, mais pas à tous les
identifiants ni à tous les champs de charge utile binaire.

Les valeurs par défaut intégrées couvrent les identifiants d’API courants et les noms
de champs d’identifiants de paiement tels que le numéro de carte, CVC/CVV, le jeton
de paiement partagé et l’identifiant de paiement, lorsqu’ils apparaissent sous forme
de champs JSON, de paramètres d’URL, d’options de CLI ou d’affectations.

`logging.redactSensitive: "off"` désactive uniquement cette politique générale
applicable aux journaux et aux transcriptions. OpenClaw masque toujours les charges
utiles aux limites de sécurité susceptibles d’être présentées aux clients de
l’interface utilisateur, aux paquets d’assistance, aux observateurs de diagnostic,
aux invites d’approbation ou aux outils de l’agent. Il s’agit notamment des événements
d’appel d’outil de l’interface de contrôle, de la sortie de `sessions_history`, des
exportations de diagnostic destinées à l’assistance, des observations d’erreurs du
fournisseur, de l’affichage des commandes pour l’approbation d’exécution et des
journaux du protocole WebSocket du Gateway. Les valeurs personnalisées de
`logging.redactPatterns` peuvent toujours ajouter des motifs propres au projet sur
ces surfaces.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés et lisibles par machine pour les
exécutions de modèles et la télémétrie des flux de messages (webhooks, mise en file
d’attente, état des sessions). Ils ne remplacent **pas** les journaux : ils alimentent
les métriques, les traces et les exportateurs. Par défaut, les événements sont émis
au sein du processus (définissez `diagnostics.enabled: false` pour les désactiver) ;
leur exportation est distincte.

Deux surfaces connexes :

- **Exportation OpenTelemetry** — envoyez les métriques, les traces et les journaux
  via OTLP/HTTP vers n’importe quel collecteur ou système dorsal compatible avec
  OpenTelemetry (Datadog, Grafana, Honeycomb, New Relic, Tempo, etc.). La configuration
  complète, le catalogue des signaux, les noms des métriques et des intervalles,
  les variables d’environnement et le modèle de confidentialité figurent sur une
  page dédiée : [Exportation OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostic** — indicateurs ciblés de journalisation de débogage
  qui acheminent des journaux supplémentaires vers `logging.file` sans augmenter
  `logging.level`. Les indicateurs sont insensibles à la casse et prennent en charge
  les caractères génériques (`telegram.*`, `*`). Configurez-les sous
  `diagnostics.flags` ou au moyen de la variable d’environnement de substitution
  `OPENCLAW_DIAGNOSTICS=...`. Guide complet :
  [Indicateurs de diagnostic](/fr/diagnostics/flags).

Pour exporter via OTLP vers un collecteur, consultez
[Exportation OpenTelemetry](/fr/gateway/opentelemetry).

## Conseils de dépannage

- **Gateway inaccessible ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que le Gateway est en cours d’exécution et écrit
  dans le chemin de fichier défini dans `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace`,
  puis réessayez.

## Pages connexes

- [Exportation OpenTelemetry](/fr/gateway/opentelemetry) — exportation OTLP/HTTP, catalogue des métriques et des intervalles, modèle de confidentialité
- [Indicateurs de diagnostic](/fr/diagnostics/flags) — indicateurs ciblés de journalisation de débogage
- [Fonctionnement interne de la journalisation du Gateway](/fr/gateway/logging) — styles des journaux WS, préfixes des sous-systèmes et capture de la console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
