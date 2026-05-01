---
read_when:
    - Vous avez besoin d’un aperçu de la journalisation d’OpenClaw adapté aux débutants
    - Vous souhaitez configurer les niveaux de journalisation, les formats ou le masquage
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Journaux de fichiers, sortie de console, affichage en continu via la CLI et onglet Journaux de l’interface de contrôle
title: Journalisation
x-i18n:
    generated_at: "2026-05-01T07:15:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw a deux principales surfaces de journalisation :

- **Journaux de fichiers** (lignes JSON) écrits par le Gateway.
- **Sortie de la console** affichée dans les terminaux et l’interface de débogage du Gateway.

L’onglet **Journaux** de la Control UI suit en temps réel le journal fichier du gateway. Cette page explique où
se trouvent les journaux, comment les lire, et comment configurer les niveaux et formats de journalisation.

## Où se trouvent les journaux

Par défaut, le Gateway écrit un fichier journal rotatif sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du gateway.

Chaque fichier pivote lorsqu’il atteint `logging.maxFileBytes` (par défaut : 100 Mo).
OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif, comme
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
- `--url <url>` / `--token <token>` / `--timeout <ms>` : indicateurs RPC standard du Gateway
- `--expect-final` : indicateur d’attente de réponse finale RPC adossée à un agent (accepté ici via la couche cliente partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal structurées, jolies et colorisées.
- **Sessions non-TTY** : texte brut.
- `--json` : JSON délimité par lignes (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement la configuration ni
les identifiants d’environnement ; incluez vous-même `--token` si le Gateway cible
exige une authentification.

En mode JSON, la CLI émet des objets étiquetés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si le Gateway local loopback implicite demande un appairage, se ferme pendant la connexion,
ou expire avant que `logs.tail` réponde, `openclaw logs` revient automatiquement au
fichier journal du Gateway configuré. Les cibles `--url` explicites n’utilisent pas
ce repli.

Si le Gateway est inaccessible, la CLI affiche une courte indication pour exécuter :

```bash
openclaw doctor
```

### Control UI (web)

L’onglet **Journaux** de la Control UI suit le même fichier avec `logs.tail`.
Consultez [/web/control-ui](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux par canal uniquement

Pour filtrer l’activité des canaux (WhatsApp/Telegram/etc), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journal

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et la Control UI analysent ces
entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

Les enregistrements JSONL des journaux de fichiers incluent aussi des champs de premier niveau filtrables par machine lorsque
disponibles :

- `hostname` : nom d’hôte du gateway.
- `message` : texte du message de journal aplati pour la recherche plein texte.
- `agent_id` : id de l’agent actif lorsque l’appel de journal transporte un contexte d’agent.
- `session_id` : id/clé de session active lorsque l’appel de journal transporte un contexte de session.
- `channel` : canal actif lorsque l’appel de journal transporte un contexte de canal.

OpenClaw préserve les arguments de journal structurés d’origine avec ces champs
afin que les analyseurs existants qui lisent les clés d’arguments tslog numérotées continuent de fonctionner.

### Sortie de la console

Les journaux de console sont **compatibles TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par ex. `gateway/channels/whatsapp`)
- Coloration des niveaux (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage de la console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket du Gateway

`openclaw gateway` dispose aussi d’une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : uniquement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style de rendu détaillé
- `--compact` : alias pour `--ws-log compact`

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

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par ex. `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement prime sur le fichier de configuration, ce qui permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option globale de CLI **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` affecte uniquement la sortie de la console et la verbosité des journaux WS ; il ne modifie pas
les niveaux des journaux de fichiers.

### Corrélation des traces

Les journaux de fichiers sont au format JSONL. Lorsqu’un appel de journal transporte un contexte de trace de diagnostic valide,
OpenClaw écrit les champs de trace comme clés JSON de premier niveau (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) afin que les processeurs de journaux externes puissent corréler la ligne
avec les spans OTEL et la propagation `traceparent` du fournisseur.

Les requêtes HTTP du Gateway et les trames WebSocket du Gateway établissent une portée de trace de requête
interne. Les journaux et événements de diagnostic émis dans cette portée asynchrone héritent
de la trace de requête lorsqu’ils ne transmettent pas de contexte de trace explicite. Les traces d’exécution d’agent et
d’appel de modèle deviennent des enfants de la trace de requête active, afin que les journaux locaux,
instantanés de diagnostic, spans OTEL et en-têtes `traceparent` de fournisseur approuvé puissent
être joints par `traceId` sans journaliser le contenu brut de la requête ou du modèle.

### Taille et temporisation des appels de modèle

Les diagnostics d’appel de modèle enregistrent des mesures bornées de requête/réponse sans
capturer le contenu brut du prompt ou de la réponse :

- `requestPayloadBytes` : taille en octets UTF-8 de la charge utile finale de requête au modèle
- `responseStreamBytes` : taille en octets UTF-8 des événements de réponse de modèle diffusés
- `timeToFirstByteMs` : temps écoulé avant le premier événement de réponse diffusé
- `durationMs` : durée totale de l’appel de modèle

Ces champs sont disponibles pour les instantanés de diagnostic, les hooks de Plugin d’appel de modèle et
les spans/métriques d’appel de modèle OTEL lorsque l’exportation des diagnostics est activée.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial, coloré, avec horodatages.
- `compact` : sortie plus resserrée (idéale pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Masquage

OpenClaw peut masquer les jetons sensibles avant qu’ils n’atteignent la sortie de la console, les journaux de fichiers,
les enregistrements de journal OTLP, le texte de transcription de session persisté ou les charges utiles d’événements d’outil
de la Control UI (arguments de démarrage d’outil, charges utiles de résultat partiel/final, sortie
exec dérivée et résumés de patch) :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut. Les motifs personnalisés s’appliquent en plus des valeurs par défaut intégrées pour les charges utiles d’outil de la Control UI, donc l’ajout d’un motif n’affaiblit jamais le masquage des valeurs déjà capturées par les valeurs par défaut.

Les journaux de fichiers et les transcriptions de session restent en JSONL, mais les valeurs secrètes correspondantes sont
masquées avant que la ligne ou le message soit écrit sur disque. Le masquage est fait au mieux :
il s’applique au contenu de message contenant du texte et aux chaînes de journal, pas à chaque
identifiant ou champ de charge utile binaire.

Les valeurs par défaut intégrées couvrent les identifiants API courants et les noms de champs
d’identifiants de paiement comme le numéro de carte, CVC/CVV, jeton de paiement partagé et identifiant de paiement
lorsqu’ils apparaissent comme champs JSON, paramètres d’URL, indicateurs CLI ou affectations.

`logging.redactSensitive: "off"` désactive uniquement cette politique générale de journaux/transcriptions.
OpenClaw masque toujours les charges utiles de frontière de sécurité qui peuvent être affichées aux clients UI,
bundles de support, observateurs de diagnostics, prompts d’approbation ou outils d’agent.
Exemples : événements d’appel d’outil de la Control UI, sortie `sessions_history`,
exportations de support de diagnostics, observations d’erreurs de fournisseur, affichage de commande d’approbation exec
et journaux de protocole WebSocket du Gateway. Les `logging.redactPatterns` personnalisés
peuvent toujours ajouter des motifs propres au projet sur ces surfaces.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés, lisibles par machine, pour les exécutions de modèles et
la télémétrie de flux de messages (webhooks, mise en file d’attente, état de session). Ils ne
remplacent pas les journaux — ils alimentent les métriques, les traces et les exportateurs. Les événements sont émis
dans le processus, que vous les exportiez ou non.

Deux surfaces adjacentes :

- **Exportation OpenTelemetry** — envoyer métriques, traces et journaux via OTLP/HTTP vers
  n’importe quel collecteur ou backend compatible OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuration complète, le catalogue des signaux,
  les noms de métriques/spans, les variables d’environnement et le modèle de confidentialité se trouvent sur une page dédiée :
  [Exportation OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostic** — indicateurs de journaux de débogage ciblés qui acheminent des journaux supplémentaires vers
  `logging.file` sans augmenter `logging.level`. Les indicateurs sont insensibles à la casse
  et prennent en charge les caractères génériques (`telegram.*`, `*`). Configurez-les sous `diagnostics.flags`
  ou via le remplacement d’environnement `OPENCLAW_DIAGNOSTICS=...`. Guide complet :
  [Indicateurs de diagnostic](/fr/diagnostics/flags).

Pour activer les événements de diagnostic pour les plugins ou récepteurs personnalisés sans exportation OTLP :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour exporter OTLP vers un collecteur, consultez [Exportation OpenTelemetry](/fr/gateway/opentelemetry).

## Conseils de dépannage

- **Gateway inaccessible ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que le Gateway est en cours d’exécution et écrit dans le chemin de fichier
  défini dans `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace`, puis réessayez.

## Connexe

- [Exportation OpenTelemetry](/fr/gateway/opentelemetry) — exportation OTLP/HTTP, catalogue de métriques/spans, modèle de confidentialité
- [Indicateurs de diagnostic](/fr/diagnostics/flags) — indicateurs de journaux de débogage ciblés
- [Internes de journalisation du Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture de console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
