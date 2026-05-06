---
read_when:
    - Vous avez besoin d’un aperçu de la journalisation d’OpenClaw adapté aux débutants
    - Vous souhaitez configurer les niveaux de journalisation, les formats ou le masquage
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Journaux de fichiers, sortie console, suivi en temps réel via la CLI et onglet Journaux de l’interface utilisateur de contrôle
title: Journalisation
x-i18n:
    generated_at: "2026-05-06T07:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw possède deux principales surfaces de journaux :

- **Journaux de fichiers** (lignes JSON) écrits par le Gateway.
- **Sortie console** affichée dans les terminaux et l’interface de débogage du Gateway.

L’onglet **Journaux** de l’interface de contrôle suit le journal de fichier du gateway. Cette page explique où se trouvent les journaux, comment les lire, et comment configurer les niveaux et formats de journalisation.

## Où se trouvent les journaux

Par défaut, le Gateway écrit un fichier journal rotatif sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du gateway.

Chaque fichier effectue une rotation lorsqu’il atteint `logging.maxFileBytes` (par défaut : 100 Mo). OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif, comme `openclaw-YYYY-MM-DD.1.log`, et continue d’écrire dans un nouveau journal actif au lieu de supprimer les diagnostics.

Vous pouvez remplacer ce réglage dans `~/.openclaw/openclaw.json` :

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
- `--expect-final` : indicateur d’attente de réponse finale RPC basée sur agent (accepté ici via la couche client partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal jolies, colorisées et structurées.
- **Sessions non TTY** : texte brut.
- `--json` : JSON délimité par ligne (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement la configuration ni les identifiants d’environnement ; incluez vous-même `--token` si le Gateway cible exige une authentification.

En mode JSON, la CLI émet des objets étiquetés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si le Gateway local loopback implicite demande un appairage, ferme pendant la connexion, ou expire avant que `logs.tail` réponde, `openclaw logs` bascule automatiquement vers le journal de fichier du Gateway configuré. Les cibles `--url` explicites n’utilisent pas ce repli.

Si le Gateway est inaccessible, la CLI affiche une courte indication pour exécuter :

```bash
openclaw doctor
```

### Interface de contrôle (web)

L’onglet **Journaux** de l’interface de contrôle suit le même fichier avec `logs.tail`. Consultez [Interface de contrôle](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux par canal uniquement

Pour filtrer l’activité d’un canal (WhatsApp/Telegram/etc), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journaux

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et l’interface de contrôle analysent ces entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

Les enregistrements JSONL des journaux de fichiers incluent également des champs de premier niveau filtrables par machine lorsqu’ils sont disponibles :

- `hostname` : nom d’hôte du gateway.
- `message` : texte du message de journal aplati pour la recherche plein texte.
- `agent_id` : id de l’agent actif lorsque l’appel de journal contient un contexte d’agent.
- `session_id` : id/clé de session active lorsque l’appel de journal contient un contexte de session.
- `channel` : canal actif lorsque l’appel de journal contient un contexte de canal.

OpenClaw conserve les arguments structurés originaux du journal à côté de ces champs afin que les analyseurs existants qui lisent les clés d’arguments tslog numérotées continuent de fonctionner.

### Sortie console

Les journaux console sont **compatibles TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par ex. `gateway/channels/whatsapp`)
- Coloration des niveaux (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket du Gateway

`openclaw gateway` dispose aussi d’une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : uniquement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style d’affichage verbeux
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

- `logging.level` : niveau des **journaux de fichiers** (JSONL).
- `logging.consoleLevel` : niveau de verbosité de la **console**.

Vous pouvez remplacer les deux avec la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par ex. `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement est prioritaire sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option CLI globale **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` affecte uniquement la sortie console et la verbosité des journaux WS ; il ne modifie pas les niveaux des journaux de fichiers.

### Corrélation des traces

Les journaux de fichiers sont en JSONL. Lorsqu’un appel de journal contient un contexte de trace diagnostique valide, OpenClaw écrit les champs de trace comme clés JSON de premier niveau (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) afin que les processeurs de journaux externes puissent corréler la ligne avec les spans OTEL et la propagation `traceparent` du fournisseur.

Les requêtes HTTP du Gateway et les trames WebSocket du Gateway établissent une portée de trace de requête interne. Les journaux et événements de diagnostic émis dans cette portée asynchrone héritent de la trace de requête lorsqu’ils ne passent pas de contexte de trace explicite. Les traces d’exécution d’agent et d’appel de modèle deviennent des enfants de la trace de requête active, afin que les journaux locaux, instantanés de diagnostic, spans OTEL et en-têtes `traceparent` de fournisseurs fiables puissent être associés par `traceId` sans journaliser le contenu brut des requêtes ou des modèles.

### Taille et chronométrage des appels de modèle

Les diagnostics d’appel de modèle enregistrent des mesures bornées de requête/réponse sans capturer le contenu brut du prompt ni de la réponse :

- `requestPayloadBytes` : taille en octets UTF-8 de la charge utile finale de requête au modèle
- `responseStreamBytes` : taille en octets UTF-8 des événements de réponse du modèle diffusés en streaming
- `timeToFirstByteMs` : temps écoulé avant le premier événement de réponse diffusé
- `durationMs` : durée totale de l’appel de modèle

Ces champs sont disponibles pour les instantanés de diagnostic, les hooks Plugin d’appel de modèle et les spans/métriques OTEL d’appel de modèle lorsque l’export de diagnostics est activé.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial, colorisé, avec horodatages.
- `compact` : sortie plus resserrée (idéale pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Masquage

OpenClaw peut masquer les jetons sensibles avant qu’ils n’atteignent la sortie console, les journaux de fichiers, les enregistrements de journaux OTLP, le texte de transcription de session persistant ou les charges utiles d’événements d’outils de l’interface de contrôle (arguments de démarrage d’outil, charges utiles de résultat partiel/final, sortie `exec` dérivée et résumés de patch) :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut. Les motifs personnalisés s’appliquent en plus des valeurs intégrées par défaut pour les charges utiles d’outils de l’interface de contrôle ; ajouter un motif n’affaiblit donc jamais le masquage des valeurs déjà capturées par les valeurs par défaut.

Les journaux de fichiers et les transcriptions de session restent en JSONL, mais les valeurs secrètes correspondantes sont masquées avant l’écriture de la ligne ou du message sur disque. Le masquage est fourni au mieux : il s’applique au contenu de message textuel et aux chaînes de journal, pas à chaque identifiant ni à chaque champ de charge utile binaire.

Les valeurs intégrées par défaut couvrent les identifiants d’API courants et les noms de champs d’identifiants de paiement comme le numéro de carte, CVC/CVV, le jeton de paiement partagé et l’identifiant de paiement lorsqu’ils apparaissent comme champs JSON, paramètres d’URL, indicateurs CLI ou affectations.

`logging.redactSensitive: "off"` désactive uniquement cette stratégie générale de journaux/transcriptions. OpenClaw masque toujours les charges utiles de frontière de sécurité qui peuvent être affichées aux clients d’interface utilisateur, aux bundles de support, aux observateurs de diagnostics, aux prompts d’approbation ou aux outils d’agent. Les exemples incluent les événements d’appel d’outil de l’interface de contrôle, la sortie `sessions_history`, les exports de support de diagnostics, les observations d’erreurs de fournisseur, l’affichage de commande d’approbation `exec` et les journaux du protocole WebSocket du Gateway. Les `logging.redactPatterns` personnalisés peuvent toujours ajouter des motifs spécifiques au projet sur ces surfaces.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés, lisibles par machine, pour les exécutions de modèle et la télémétrie des flux de messages (webhooks, mise en file d’attente, état de session). Ils ne remplacent **pas** les journaux : ils alimentent les métriques, les traces et les exporteurs. Les événements sont émis dans le processus, que vous les exportiez ou non.

Deux surfaces adjacentes :

- **Export OpenTelemetry** — envoyer les métriques, traces et journaux via OTLP/HTTP vers tout collecteur ou backend compatible OpenTelemetry (Grafana, Datadog, Honeycomb, New Relic, Tempo, etc.). La configuration complète, le catalogue des signaux, les noms de métriques/spans, les variables d’environnement et le modèle de confidentialité se trouvent sur une page dédiée : [Export OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostics** — indicateurs ciblés de journaux de débogage qui dirigent des journaux supplémentaires vers `logging.file` sans augmenter `logging.level`. Les indicateurs ne tiennent pas compte de la casse et prennent en charge les jokers (`telegram.*`, `*`). Configurez-les sous `diagnostics.flags` ou via le remplacement d’environnement `OPENCLAW_DIAGNOSTICS=...`. Guide complet : [Indicateurs de diagnostics](/fr/diagnostics/flags).

Pour activer les événements de diagnostics pour les plugins ou des collecteurs personnalisés sans export OTLP :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour l’export OTLP vers un collecteur, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).

## Conseils de dépannage

- **Gateway inaccessible ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que le Gateway est en cours d’exécution et écrit dans le chemin de fichier indiqué dans `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace`, puis réessayez.

## Connexe

- [Export OpenTelemetry](/fr/gateway/opentelemetry) — export OTLP/HTTP, catalogue des métriques/spans, modèle de confidentialité
- [Indicateurs de diagnostics](/fr/diagnostics/flags) — indicateurs ciblés de journaux de débogage
- [Internes de journalisation du Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
