---
read_when:
    - Vous avez besoin d’une vue d’ensemble de la journalisation d’OpenClaw adaptée aux débutants.
    - Vous voulez configurer les niveaux de journalisation, les formats ou le masquage
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Journaux de fichiers, sortie de console, suivi en direct via la CLI et onglet Journaux de l’interface de contrôle
title: Journalisation
x-i18n:
    generated_at: "2026-05-11T20:43:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw comporte deux surfaces principales de journaux :

- **Journaux de fichiers** (lignes JSON) écrits par le Gateway.
- **Sortie console** affichée dans les terminaux et l’interface de débogage du Gateway.

L’onglet **Journaux** de l’interface de contrôle suit le journal de fichier du Gateway. Cette page explique où
se trouvent les journaux, comment les lire, et comment configurer les niveaux et formats de journalisation.

## Emplacement des journaux

Par défaut, le Gateway écrit un fichier journal tournant sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du Gateway.

Chaque fichier effectue une rotation lorsqu’il atteint `logging.maxFileBytes` (par défaut : 100 Mo).
OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif, comme
`openclaw-YYYY-MM-DD.1.log`, et continue à écrire dans un nouveau journal actif au lieu de
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

Utilisez la CLI pour suivre le fichier journal du Gateway via RPC :

```bash
openclaw logs --follow
```

Options actuelles utiles :

- `--local-time` : afficher les horodatages dans votre fuseau horaire local
- `--url <url>` / `--token <token>` / `--timeout <ms>` : indicateurs RPC standard du Gateway
- `--expect-final` : indicateur d’attente de réponse finale RPC reposant sur un agent (accepté ici via la couche cliente partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal structurées, jolies et colorisées.
- **Sessions non-TTY** : texte brut.
- `--json` : JSON délimité par lignes (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous transmettez un `--url` explicite, la CLI n’applique pas automatiquement les identifiants de configuration ou
d’environnement ; incluez vous-même `--token` si le Gateway cible
exige une authentification.

En mode JSON, la CLI émet des objets balisés par `type` :

- `meta` : métadonnées de flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si le Gateway local loopback implicite demande un appairage, se ferme pendant la connexion,
ou expire avant que `logs.tail` ne réponde, `openclaw logs` bascule automatiquement vers le
journal de fichier configuré du Gateway. Les cibles `--url` explicites n’utilisent pas
ce repli.

Si le Gateway est injoignable, la CLI affiche une courte suggestion d’exécuter :

```bash
openclaw doctor
```

### Interface de contrôle (web)

L’onglet **Journaux** de l’interface de contrôle suit le même fichier avec `logs.tail`.
Consultez [Interface de contrôle](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux par canal uniquement

Pour filtrer l’activité des canaux (WhatsApp/Telegram/etc.), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journal

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et l’interface de contrôle analysent ces
entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

Les enregistrements JSONL des journaux de fichiers incluent aussi des champs de premier niveau filtrables par machine lorsque
disponibles :

- `hostname` : nom d’hôte du Gateway.
- `message` : texte aplati du message de journal pour la recherche plein texte.
- `agent_id` : id de l’agent actif lorsque l’appel de journal porte un contexte d’agent.
- `session_id` : id/clé de session active lorsque l’appel de journal porte un contexte de session.
- `channel` : canal actif lorsque l’appel de journal porte un contexte de canal.

OpenClaw conserve les arguments de journal structurés d’origine à côté de ces champs
afin que les analyseurs existants qui lisent les clés d’arguments tslog numérotées continuent de fonctionner.

Les activités de conversation, de voix en temps réel et de salons gérés émettent des enregistrements bornés de journal de cycle de vie
via ce même pipeline de journaux de fichiers. Ces enregistrements incluent le type d’événement,
le mode, le transport, le fournisseur et les mesures de taille/temps lorsqu’ils sont disponibles, mais omettent
le texte de transcription, les charges utiles audio, les ids de tours, les ids d’appels et les ids d’éléments fournisseur.

### Sortie console

Les journaux console sont **compatibles TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par exemple `gateway/channels/whatsapp`)
- Coloration par niveau (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage console est contrôlé par `logging.consoleStyle`.

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

### Niveaux de journal

- `logging.level` : niveau des **journaux de fichiers** (JSONL).
- `logging.consoleLevel` : niveau de verbosité de la **console**.

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par exemple `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement est prioritaire sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi transmettre l’option globale de CLI **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` affecte uniquement la sortie console et la verbosité des journaux WS ; il ne modifie pas
les niveaux des journaux de fichiers.

### Diagnostics ciblés du transport de modèle

Lorsque vous déboguez des appels fournisseur, utilisez des indicateurs d’environnement ciblés au lieu d’augmenter
tous les journaux à `debug` :

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Indicateurs disponibles :

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1` : émettre le début de requête, la réponse fetch, les en-têtes SDK,
  le premier événement de streaming, la fin du flux et les erreurs de transport au niveau
  `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary` : inclure un résumé borné de la charge utile de requête
  dans les journaux de requête de modèle.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools` : inclure tous les noms d’outils exposés au modèle dans
  le résumé de la charge utile.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` : inclure un instantané JSON expurgé et plafonné
  de la charge utile. À utiliser uniquement pendant le débogage ; les secrets sont expurgés, mais les invites
  et le texte des messages peuvent encore être présents.
- `OPENCLAW_DEBUG_SSE=events` : émettre les temps du premier événement et de fin de flux.
- `OPENCLAW_DEBUG_SSE=peek` : émettre aussi les cinq premières charges utiles d’événements SSE expurgées,
  plafonnées par événement.
- `OPENCLAW_DEBUG_CODE_MODE=1` : émettre des diagnostics de surface modèle du mode code,
  y compris lorsque les outils fournisseur natifs sont masqués parce que le mode code possède
  la surface d’outils.

Ces indicateurs journalisent via la journalisation normale d’OpenClaw, donc `openclaw logs --follow`
et l’onglet Journaux de l’interface de contrôle les affichent. Sans les indicateurs, les mêmes diagnostics
restent disponibles au niveau `debug`.

### Corrélation des traces

Les journaux de fichiers sont en JSONL. Lorsqu’un appel de journal porte un contexte de trace de diagnostic valide,
OpenClaw écrit les champs de trace comme clés JSON de premier niveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) afin que les processeurs de journaux externes puissent corréler la ligne
avec les spans OTEL et la propagation `traceparent` du fournisseur.

Les requêtes HTTP du Gateway et les trames WebSocket du Gateway établissent une portée interne de trace de requête.
Les journaux et événements de diagnostic émis dans cette portée asynchrone héritent
de la trace de requête lorsqu’ils ne transmettent pas de contexte de trace explicite. Les traces d’exécution d’agent et
d’appel de modèle deviennent des enfants de la trace de requête active, de sorte que les journaux locaux,
les instantanés de diagnostic, les spans OTEL et les en-têtes `traceparent` de fournisseur fiables peuvent
être reliés par `traceId` sans journaliser le contenu brut de la requête ou du modèle.

Les enregistrements de journal de cycle de vie des conversations circulent aussi vers les journaux OTLP lorsque l’exportation des journaux OpenTelemetry
est activée, avec les mêmes attributs bornés que les journaux de fichiers.

### Taille et temps des appels de modèle

Les diagnostics d’appel de modèle enregistrent des mesures bornées de requête/réponse sans
capturer le contenu brut de l’invite ou de la réponse :

- `requestPayloadBytes` : taille en octets UTF-8 de la charge utile finale de requête au modèle
- `responseStreamBytes` : taille en octets UTF-8 des événements de réponse de modèle diffusés
- `timeToFirstByteMs` : temps écoulé avant le premier événement de réponse diffusé
- `durationMs` : durée totale de l’appel de modèle

Ces champs sont disponibles pour les instantanés de diagnostic, les hooks Plugin d’appel de modèle et
les spans/métriques OTEL d’appel de modèle lorsque l’exportation des diagnostics est activée.

### Styles de console

`logging.consoleStyle` :

- `pretty` : lisible par l’humain, coloré, avec horodatages.
- `compact` : sortie plus dense (idéale pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Expurgation

OpenClaw peut expurger les jetons sensibles avant qu’ils n’atteignent la sortie console, les journaux de fichiers,
les enregistrements de journaux OTLP, le texte de transcription de session persistant ou les charges utiles d’événements d’outils
de l’interface de contrôle (arguments de démarrage d’outil, charges utiles de résultat partiel/final, sortie
exec dérivée et résumés de correctifs) :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut. Les motifs personnalisés s’appliquent en plus des valeurs intégrées par défaut pour les charges utiles d’outils de l’interface de contrôle ; ajouter un motif n’affaiblit donc jamais l’expurgation des valeurs déjà capturées par les valeurs par défaut.

Les journaux de fichiers et les transcriptions de session restent en JSONL, mais les valeurs secrètes correspondantes sont
masquées avant l’écriture de la ligne ou du message sur disque. L’expurgation est au mieux :
elle s’applique au contenu de message textuel et aux chaînes de journal, pas à chaque
identifiant ou champ de charge utile binaire.

Les valeurs intégrées par défaut couvrent les identifiants d’API courants et les noms de champs d’identifiants de paiement
comme le numéro de carte, CVC/CVV, le jeton de paiement partagé et l’identifiant de paiement
lorsqu’ils apparaissent comme champs JSON, paramètres d’URL, indicateurs CLI ou affectations.

`logging.redactSensitive: "off"` désactive uniquement cette politique générale de journaux/transcriptions.
OpenClaw continue d’expurger les charges utiles de frontière de sécurité qui peuvent être affichées aux clients d’interface utilisateur,
aux bundles de support, aux observateurs de diagnostics, aux invites d’approbation ou aux outils d’agent.
Exemples : événements d’appel d’outil de l’interface de contrôle, sortie `sessions_history`,
exports de support de diagnostics, observations d’erreurs fournisseur, affichage de commande d’approbation exec
et journaux de protocole WebSocket du Gateway. Les `logging.redactPatterns` personnalisés
peuvent toujours ajouter des motifs propres au projet sur ces surfaces.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés, lisibles par machine, pour les exécutions de modèle et
la télémétrie de flux de messages (webhooks, mise en file d’attente, état de session). Ils ne
remplacent **pas** les journaux : ils alimentent les métriques, traces et exportateurs. Les événements sont émis
dans le processus, que vous les exportiez ou non.

Deux surfaces adjacentes :

- **Export OpenTelemetry** — envoyer des métriques, traces et journaux via OTLP/HTTP à
  n’importe quel collecteur ou backend compatible OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuration complète, le catalogue de signaux,
  les noms de métriques/spans, les variables d’environnement et le modèle de confidentialité se trouvent sur une page dédiée :
  [Export OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostics** — indicateurs de journal de débogage ciblés qui dirigent des journaux supplémentaires vers
  `logging.file` sans augmenter `logging.level`. Les indicateurs sont insensibles à la casse
  et prennent en charge les jokers (`telegram.*`, `*`). Configurez-les sous `diagnostics.flags`
  ou via le remplacement d’environnement `OPENCLAW_DIAGNOSTICS=...`. Guide complet :
  [Indicateurs de diagnostics](/fr/diagnostics/flags).

Pour activer les événements de diagnostics pour les plugins ou les collecteurs personnalisés sans export OTLP :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour l’export OTLP vers un collecteur, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).

## Conseils de dépannage

- **Gateway injoignable ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que le Gateway est en cours d’exécution et écrit dans le chemin de fichier
  défini dans `logging.file`.
- **Besoin de plus de détails ?** Réglez `logging.level` sur `debug` ou `trace`, puis réessayez.

## Connexe

- [Export OpenTelemetry](/fr/gateway/opentelemetry) — export OTLP/HTTP, catalogue de métriques/spans, modèle de confidentialité
- [Indicateurs de diagnostics](/fr/diagnostics/flags) — indicateurs de journal de débogage ciblés
- [Internes de journalisation du Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
