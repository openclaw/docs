---
read_when:
    - Vous avez besoin d’une vue d’ensemble adaptée aux débutants de la journalisation d’OpenClaw
    - Vous voulez configurer les niveaux de journalisation, les formats ou la rédaction
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Fichiers journaux, sortie console, suivi CLI et onglet Journaux de l’interface de contrôle
title: Journalisation
x-i18n:
    generated_at: "2026-06-27T17:40:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw dispose de deux surfaces de journalisation principales :

- **Journaux fichier** (lignes JSON) écrits par le Gateway.
- **Sortie console** affichée dans les terminaux et l’interface Gateway Debug.

L’onglet **Journaux** de l’interface Control suit le fichier journal du gateway. Cette page explique où
se trouvent les journaux, comment les lire, et comment configurer les niveaux et formats de journalisation.

## Où se trouvent les journaux

Par défaut, le Gateway écrit un fichier journal rotatif sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du gateway.

Chaque fichier fait l’objet d’une rotation lorsqu’il atteint `logging.maxFileBytes` (par défaut : 100 Mo).
OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif, par exemple
`openclaw-YYYY-MM-DD.1.log`, et continue d’écrire dans un nouveau journal actif au lieu de
supprimer les diagnostics.

Vous pouvez remplacer ce comportement dans `~/.openclaw/openclaw.json` :

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Comment lire les journaux

### CLI : suivi en direct (recommandé)

Utilisez la CLI pour suivre le fichier journal du gateway via RPC :

```bash
openclaw logs --follow
```

Options actuelles utiles :

- `--local-time` : afficher les horodatages dans votre fuseau horaire local
- `--url <url>` / `--token <token>` / `--timeout <ms>` : indicateurs RPC Gateway standard
- `--expect-final` : indicateur d’attente de réponse finale RPC adossée à un agent (accepté ici via la couche cliente partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal structurées, lisibles et colorisées.
- **Sessions non-TTY** : texte brut.
- `--json` : JSON délimité par ligne (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement la configuration ni
les identifiants d’environnement ; incluez vous-même `--token` si le Gateway cible
requiert une authentification.

En mode JSON, la CLI émet des objets balisés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si le Gateway local loopback implicite demande un appairage, se ferme pendant la connexion
ou expire avant que `logs.tail` ne réponde, `openclaw logs` se rabat automatiquement sur le
fichier journal du Gateway configuré. Les cibles `--url` explicites n’utilisent pas
ce repli. `openclaw logs --follow` est plus strict : sous Linux, il utilise le journal Gateway user-systemd actif par PID lorsqu’il est disponible, et sinon continue de réessayer
le Gateway en direct au lieu de suivre un fichier côte à côte potentiellement obsolète.

Si le Gateway est inaccessible, la CLI affiche une brève indication invitant à exécuter :

```bash
openclaw doctor
```

### Interface Control (web)

L’onglet **Journaux** de l’interface Control suit le même fichier avec `logs.tail`.
Consultez [Interface Control](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux propres aux canaux

Pour filtrer l’activité des canaux (WhatsApp/Telegram/etc), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journal

### Journaux fichier (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et l’interface Control analysent ces
entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

Les enregistrements JSONL des journaux fichier incluent aussi des champs de premier niveau filtrables par machine lorsque
disponibles :

- `hostname` : nom d’hôte du gateway.
- `message` : texte du message de journal aplati pour la recherche plein texte.
- `agent_id` : identifiant de l’agent actif lorsque l’appel de journalisation porte un contexte d’agent.
- `session_id` : identifiant/clé de la session active lorsque l’appel de journalisation porte un contexte de session.
- `channel` : canal actif lorsque l’appel de journalisation porte un contexte de canal.

OpenClaw préserve les arguments de journal structurés d’origine à côté de ces champs
afin que les analyseurs existants qui lisent les clés d’arguments tslog numérotées continuent de fonctionner.

Les activités de conversation, de voix en temps réel et de salon géré émettent des enregistrements de journal de cycle de vie bornés
via ce même pipeline de journaux fichier. Ces enregistrements incluent le type d’événement,
le mode, le transport, le fournisseur et les mesures de taille/durée lorsqu’elles sont disponibles, mais omettent
le texte de transcription, les charges utiles audio, les identifiants de tour, les identifiants d’appel et les identifiants d’élément fournisseur.

### Sortie console

Les journaux console sont **conscients du TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (p. ex. `gateway/channels/whatsapp`)
- Coloration des niveaux (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage de la console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket du Gateway

`openclaw gateway` dispose aussi d’une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : uniquement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style de rendu détaillé
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurer la journalisation

Toute la configuration de journalisation se trouve sous `logging` dans `~/.openclaw/openclaw.json`.

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

- `logging.level` : niveau des **journaux fichier** (JSONL).
- `logging.consoleLevel` : niveau de verbosité de la **console**.

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (p. ex. `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement a priorité sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option CLI globale **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` affecte uniquement la sortie console et la verbosité des journaux WS ; il ne modifie pas
les niveaux des journaux fichier.

### Diagnostics ciblés du transport de modèle

Lors du débogage des appels fournisseur, utilisez des indicateurs d’environnement ciblés au lieu de passer
tous les journaux à `debug` :

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Indicateurs disponibles :

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1` : émettre le début de requête, la réponse fetch, les en-têtes SDK,
  le premier événement de streaming, la fin du flux et les erreurs de transport au
  niveau `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary` : inclure un résumé borné de la charge utile de requête
  dans les journaux de requête modèle.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools` : inclure tous les noms d’outils exposés au modèle dans
  le résumé de charge utile.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` : inclure un instantané de charge utile JSON expurgé et plafonné. À utiliser uniquement pendant le débogage ; les secrets sont expurgés, mais les prompts
  et le texte des messages peuvent encore être présents.
- `OPENCLAW_DEBUG_SSE=events` : émettre les timings du premier événement et de fin de flux.
- `OPENCLAW_DEBUG_SSE=peek` : émettre aussi les cinq premières charges utiles d’événements SSE expurgées,
  plafonnées par événement.
- `OPENCLAW_DEBUG_CODE_MODE=1` : émettre les diagnostics de surface modèle en mode code,
  y compris lorsque les outils fournisseurs natifs sont masqués parce que le mode code possède la
  surface d’outils.

Ces indicateurs journalisent via la journalisation normale d’OpenClaw, donc `openclaw logs --follow`
et l’onglet Journaux de l’interface Control les affichent. Sans ces indicateurs, les mêmes diagnostics
restent disponibles au niveau `debug`.

Les métadonnées de début et de réponse `[model-fetch]` (fournisseur, API, modèle, statut,
latence, et champs de requête comme méthode, URL, délai d’expiration, proxy et politique)
sont toujours émises au niveau `info`, indépendamment de
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, afin que l’hygiène de base du transport de modèle soit visible
sans indicateurs de débogage.

### Corrélation des traces

Les journaux fichier sont en JSONL. Lorsqu’un appel de journalisation porte un contexte de trace diagnostique valide,
OpenClaw écrit les champs de trace comme clés JSON de premier niveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) afin que les processeurs de journaux externes puissent corréler la ligne
avec les spans OTEL et la propagation `traceparent` du fournisseur.

Les requêtes HTTP Gateway et les trames WebSocket Gateway établissent une portée de trace de requête interne. Les journaux et événements de diagnostic émis à l’intérieur de cette portée asynchrone héritent
de la trace de requête lorsqu’ils ne passent pas de contexte de trace explicite. Les traces d’exécution d’agent et
d’appel de modèle deviennent des enfants de la trace de requête active, ce qui permet de joindre les journaux locaux,
les instantanés de diagnostic, les spans OTEL et les en-têtes `traceparent` de fournisseurs de confiance
par `traceId` sans journaliser le contenu brut des requêtes ou des modèles.

Les enregistrements de journal de cycle de vie des conversations sont aussi transmis à l’export de journaux diagnostics-otel lorsque
l’export de journaux OpenTelemetry est activé, en utilisant les mêmes attributs bornés que les journaux fichier. Configurez `diagnostics.otel.logsExporter` pour choisir OTLP, stdout JSONL ou
les deux destinations.

### Taille et durée des appels de modèle

Les diagnostics d’appel de modèle enregistrent des mesures bornées de requête/réponse sans
capturer le contenu brut du prompt ou de la réponse :

- `requestPayloadBytes` : taille en octets UTF-8 de la charge utile finale de requête modèle
- `responseStreamBytes` : taille en octets UTF-8 des charges utiles de fragments de réponse modèle diffusés en streaming. Les événements de texte haute fréquence, de réflexion et de delta d’appel d’outil comptent
  uniquement les octets `delta` incrémentaux au lieu des instantanés `partial` complets.
- `timeToFirstByteMs` : temps écoulé avant le premier événement de réponse en streaming
- `durationMs` : durée totale de l’appel de modèle

Ces champs sont disponibles pour les instantanés de diagnostic, les hooks Plugin d’appel de modèle et
les spans/métriques OTEL d’appel de modèle lorsque l’export de diagnostics est activé.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial, coloré, avec horodatages.
- `compact` : sortie plus resserrée (idéal pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Expurgation

OpenClaw peut expurger les jetons sensibles avant qu’ils n’atteignent la sortie console, les journaux fichier,
les enregistrements de journal OTLP, le texte de transcription de session persistant ou les charges utiles d’événements d’outils
de l’interface Control (arguments de démarrage d’outil, charges utiles de résultat partiel/final, sortie
exec dérivée et résumés de patch) :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut. Les motifs personnalisés s’appliquent en plus des valeurs intégrées par défaut pour les charges utiles d’outils de l’interface Control, donc l’ajout d’un motif n’affaiblit jamais l’expurgation des valeurs déjà capturées par les valeurs par défaut.

Les journaux fichier et les transcriptions de session restent en JSONL, mais les valeurs secrètes correspondantes sont
masquées avant que la ligne ou le message ne soit écrit sur disque. L’expurgation est une mesure au mieux :
elle s’applique au contenu de message textuel et aux chaînes de journal, pas à chaque
identifiant ni à chaque champ de charge utile binaire.

Les valeurs intégrées par défaut couvrent les identifiants d’API courants et les noms de champs d’identifiants de paiement
tels que numéro de carte, CVC/CVV, jeton de paiement partagé et identifiant de paiement
lorsqu’ils apparaissent comme champs JSON, paramètres d’URL, indicateurs CLI ou affectations.

`logging.redactSensitive: "off"` désactive uniquement cette politique générale de journal/transcription.
OpenClaw expurge toujours les charges utiles de frontière de sécurité qui peuvent être affichées aux clients UI,
aux bundles de support, aux observateurs de diagnostics, aux prompts d’approbation ou aux outils d’agent. Exemples : événements d’appel d’outil de l’interface Control, sortie `sessions_history`,
exports de support de diagnostics, observations d’erreurs fournisseur, affichage de commande d’approbation exec
et journaux de protocole WebSocket Gateway. Les `logging.redactPatterns` personnalisés
peuvent toujours ajouter des motifs propres au projet sur ces surfaces.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés, lisibles par machine, pour les exécutions de modèle et
la télémétrie de flux de messages (webhooks, mise en file d’attente, état de session). Ils ne
remplacent **pas** les journaux : ils alimentent les métriques, les traces et les exportateurs. Les événements sont émis
dans le processus, que vous les exportiez ou non.

Deux surfaces adjacentes :

- **Export OpenTelemetry** — envoyer métriques, traces et journaux via OTLP/HTTP à
  tout collecteur ou backend compatible OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuration complète, le catalogue des signaux,
  les noms de métriques/spans, les variables d’environnement et le modèle de confidentialité se trouvent sur une page dédiée :
  [Export OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostics** — indicateurs de journaux de débogage ciblés qui acheminent des journaux supplémentaires vers
  `logging.file` sans augmenter `logging.level`. Les indicateurs sont insensibles à la casse
  et prennent en charge les jokers (`telegram.*`, `*`). Configurez-les sous `diagnostics.flags`
  ou via le remplacement d’environnement `OPENCLAW_DIAGNOSTICS=...`. Guide complet :
  [Indicateurs de diagnostics](/fr/diagnostics/flags).

Pour activer les événements de diagnostics pour les plugins ou les destinations personnalisées sans export OTLP :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour l’export OTLP vers un collecteur, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).

## Conseils de dépannage

- **Gateway inaccessible ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que le Gateway est en cours d’exécution et écrit dans le chemin de fichier
  indiqué dans `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace` et réessayez.

## Connexe

- [Export OpenTelemetry](/fr/gateway/opentelemetry) — export OTLP/HTTP, catalogue des métriques/spans, modèle de confidentialité
- [Indicateurs de diagnostic](/fr/diagnostics/flags) — indicateurs de journaux de débogage ciblés
- [Internes de journalisation du Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-systèmes et capture de la console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
