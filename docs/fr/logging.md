---
read_when:
    - Vous avez besoin d’une vue d’ensemble de la journalisation d’OpenClaw adaptée aux débutants
    - Vous voulez configurer les niveaux de journalisation, les formats ou le masquage
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Journaux de fichiers, sortie de console, suivi en direct via la CLI et onglet Journaux de l’interface de contrôle
title: Journalisation
x-i18n:
    generated_at: "2026-04-30T07:35:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw dispose de deux principales surfaces de journalisation :

- **Journaux de fichiers** (lignes JSON) écrits par le Gateway.
- **Sortie console** affichée dans les terminaux et l’interface utilisateur Gateway Debug.

L’onglet **Logs** de l’interface Control UI suit le journal de fichier du Gateway. Cette page explique où se trouvent les journaux, comment les lire et comment configurer les niveaux et formats de journalisation.

## Emplacement des journaux

Par défaut, le Gateway écrit un fichier journal rotatif sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du gateway.

Chaque fichier pivote lorsqu’il atteint `logging.maxFileBytes` (par défaut : 100 Mo). OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif, comme `openclaw-YYYY-MM-DD.1.log`, et continue d’écrire dans un nouveau journal actif au lieu de supprimer les diagnostics.

Vous pouvez remplacer ce comportement dans `~/.openclaw/openclaw.json` :

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Lire les journaux

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

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement les identifiants de configuration ou d’environnement ; incluez vous-même `--token` si le Gateway cible exige une authentification.

En mode JSON, la CLI émet des objets balisés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si le Gateway local loopback implicite demande un appairage, se ferme pendant la connexion ou expire avant que `logs.tail` ne réponde, `openclaw logs` se rabat automatiquement sur le fichier journal du Gateway configuré. Les cibles `--url` explicites n’utilisent pas ce repli.

Si le Gateway est inaccessible, la CLI affiche une courte suggestion d’exécuter :

```bash
openclaw doctor
```

### Control UI (web)

L’onglet **Logs** de Control UI suit le même fichier avec `logs.tail`. Consultez [/web/control-ui](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux par canal uniquement

Pour filtrer l’activité des canaux (WhatsApp/Telegram/etc.), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats des journaux

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et Control UI analysent ces entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

Les enregistrements JSONL du journal de fichier incluent également des champs de premier niveau filtrables par machine lorsqu’ils sont disponibles :

- `hostname` : nom de l’hôte du gateway.
- `message` : texte du message de journal aplati pour la recherche en texte intégral.
- `agent_id` : identifiant de l’agent actif lorsque l’appel de journalisation transporte un contexte d’agent.
- `session_id` : identifiant/clé de la session active lorsque l’appel de journalisation transporte un contexte de session.
- `channel` : canal actif lorsque l’appel de journalisation transporte un contexte de canal.

OpenClaw conserve les arguments de journalisation structurés d’origine à côté de ces champs afin que les analyseurs existants qui lisent les clés d’arguments tslog numérotées continuent de fonctionner.

### Sortie console

Les journaux de console sont **compatibles TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par exemple `gateway/channels/whatsapp`)
- Coloration des niveaux (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage de la console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket du Gateway

`openclaw gateway` dispose également d’une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : uniquement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style d’affichage détaillé
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

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par exemple `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement est prioritaire sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option CLI globale **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` n’affecte que la sortie console et la verbosité des journaux WS ; il ne change pas les niveaux des journaux de fichiers.

### Corrélation de trace

Les journaux de fichiers sont au format JSONL. Lorsqu’un appel de journalisation transporte un contexte de trace de diagnostic valide, OpenClaw écrit les champs de trace comme clés JSON de premier niveau (`traceId`, `spanId`, `parentSpanId`, `traceFlags`) afin que les processeurs de journaux externes puissent corréler la ligne avec les spans OTEL et la propagation `traceparent` des fournisseurs.

Les requêtes HTTP du Gateway et les trames WebSocket du Gateway établissent une portée de trace de requête interne. Les journaux et événements de diagnostic émis dans cette portée asynchrone héritent de la trace de requête lorsqu’ils ne passent pas de contexte de trace explicite. Les traces d’exécution d’agent et d’appel de modèle deviennent des enfants de la trace de requête active, de sorte que les journaux locaux, instantanés de diagnostic, spans OTEL et en-têtes `traceparent` de fournisseurs de confiance peuvent être reliés par `traceId` sans journaliser le contenu brut des requêtes ou du modèle.

### Taille et chronométrage des appels de modèle

Les diagnostics d’appel de modèle enregistrent des mesures bornées de requête/réponse sans capturer le prompt brut ni le contenu de réponse brut :

- `requestPayloadBytes` : taille en octets UTF-8 de la charge utile finale de la requête de modèle
- `responseStreamBytes` : taille en octets UTF-8 des événements de réponse de modèle diffusés
- `timeToFirstByteMs` : temps écoulé avant le premier événement de réponse diffusé
- `durationMs` : durée totale de l’appel de modèle

Ces champs sont disponibles pour les instantanés de diagnostic, les hooks de plugin d’appel de modèle et les spans/métriques OTEL d’appel de modèle lorsque l’export des diagnostics est activé.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial, coloré, avec horodatages.
- `compact` : sortie plus dense (idéale pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Masquage

OpenClaw peut masquer les jetons sensibles avant qu’ils n’atteignent la sortie console, les journaux de fichiers, les enregistrements de journaux OTLP, le texte de transcription de session persistant ou les charges utiles d’événements d’outils Control UI (arguments de démarrage d’outil, charges utiles de résultat partiel/final, sortie exec dérivée et résumés de patch) :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut. Les motifs personnalisés s’appliquent en plus des valeurs par défaut intégrées pour les charges utiles d’outils Control UI ; l’ajout d’un motif n’affaiblit donc jamais le masquage des valeurs déjà capturées par les valeurs par défaut.

Les journaux de fichiers et les transcriptions de session restent en JSONL, mais les valeurs secrètes correspondantes sont masquées avant l’écriture de la ligne ou du message sur disque. Le masquage est effectué au mieux : il s’applique au contenu de message textuel et aux chaînes de journalisation, pas à chaque identifiant ni à chaque champ de charge utile binaire.

`logging.redactSensitive: "off"` désactive uniquement cette politique générale de journaux/transcriptions. OpenClaw masque toujours les charges utiles situées aux frontières de sécurité qui peuvent être montrées aux clients UI, bundles de support, observateurs de diagnostics, invites d’approbation ou outils d’agent. Exemples : événements d’appel d’outil Control UI, sortie `sessions_history`, exports de support de diagnostics, observations d’erreurs de fournisseurs, affichage de commande d’approbation exec et journaux de protocole WebSocket du Gateway. Les motifs `logging.redactPatterns` personnalisés peuvent toujours ajouter des motifs propres au projet sur ces surfaces.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés et lisibles par machine pour les exécutions de modèle et la télémétrie de flux de messages (webhooks, mise en file, état de session). Ils ne remplacent **pas** les journaux — ils alimentent les métriques, les traces et les exportateurs. Les événements sont émis dans le processus, que vous les exportiez ou non.

Deux surfaces adjacentes :

- **Export OpenTelemetry** — envoyer métriques, traces et journaux via OTLP/HTTP vers tout collecteur ou backend compatible OpenTelemetry (Grafana, Datadog, Honeycomb, New Relic, Tempo, etc.). La configuration complète, le catalogue des signaux, les noms de métriques/spans, les variables d’environnement et le modèle de confidentialité se trouvent sur une page dédiée : [Export OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostics** — indicateurs de journaux de débogage ciblés qui routent des journaux supplémentaires vers `logging.file` sans augmenter `logging.level`. Les indicateurs ne sont pas sensibles à la casse et prennent en charge les caractères génériques (`telegram.*`, `*`). Configurez-les sous `diagnostics.flags` ou via la surcharge d’environnement `OPENCLAW_DIAGNOSTICS=...`. Guide complet : [Indicateurs de diagnostics](/fr/diagnostics/flags).

Pour activer les événements de diagnostics pour les plugins ou des récepteurs personnalisés sans export OTLP :

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

## Liens connexes

- [Export OpenTelemetry](/fr/gateway/opentelemetry) — export OTLP/HTTP, catalogue métriques/spans, modèle de confidentialité
- [Indicateurs de diagnostics](/fr/diagnostics/flags) — indicateurs de journaux de débogage ciblés
- [Internes de journalisation du Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
