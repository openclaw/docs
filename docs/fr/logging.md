---
read_when:
    - Vous avez besoin d’une vue d’ensemble accessible aux débutants sur la journalisation OpenClaw
    - Vous souhaitez configurer les niveaux de journalisation, les formats ou le masquage des données sensibles
    - Vous effectuez un dépannage et devez trouver rapidement les journaux
summary: Journaux de fichiers, sortie console, suivi CLI et onglet Journaux de Control UI
title: Journalisation
x-i18n:
    generated_at: "2026-04-26T11:33:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fa55caa65a2a06a757e37ad64c5fd030f958cf6827596db5c183c6c6db2ed9b
    source_path: logging.md
    workflow: 15
---

OpenClaw possède deux surfaces de journalisation principales :

- **Journaux de fichiers** (lignes JSON) écrits par la Gateway.
- **Sortie console** affichée dans les terminaux et dans l’UI de débogage Gateway.

L’onglet **Journaux** de Control UI suit le journal de fichier de la Gateway. Cette page explique où
se trouvent les journaux, comment les lire et comment configurer les niveaux et formats de journalisation.

## Où se trouvent les journaux

Par défaut, la Gateway écrit un fichier journal tournant dans :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte de la Gateway.

Chaque fichier effectue une rotation lorsqu’il atteint `logging.maxFileBytes` (par défaut : 100 Mo).
OpenClaw conserve jusqu’à cinq archives numérotées à côté du fichier actif, comme
`openclaw-YYYY-MM-DD.1.log`, et continue d’écrire dans un nouveau journal actif au lieu de
supprimer les diagnostics.

Vous pouvez remplacer cela dans `~/.openclaw/openclaw.json` :

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Comment lire les journaux

### CLI : suivi en direct (recommandé)

Utilisez la CLI pour suivre le journal de fichier Gateway via RPC :

```bash
openclaw logs --follow
```

Options actuelles utiles :

- `--local-time` : afficher les horodatages dans votre fuseau horaire local
- `--url <url>` / `--token <token>` / `--timeout <ms>` : options RPC Gateway standard
- `--expect-final` : option d’attente de réponse finale RPC adossée à un agent (acceptée ici via la couche client partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal structurées, jolies, colorées.
- **Sessions non TTY** : texte brut.
- `--json` : JSON délimité par ligne (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement la configuration ni
les identifiants d’environnement ; incluez vous-même `--token` si la Gateway cible
nécessite une authentification.

En mode JSON, la CLI émet des objets étiquetés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si la Gateway loopback locale demande un appairage, `openclaw logs` se replie automatiquement sur
le fichier journal local configuré. Les cibles `--url` explicites n’utilisent pas ce repli.

Si la Gateway est inaccessible, la CLI affiche une courte suggestion pour lancer :

```bash
openclaw doctor
```

### Control UI (web)

L’onglet **Journaux** de Control UI suit le même fichier à l’aide de `logs.tail`.
Voir [/web/control-ui](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux de canaux uniquement

Pour filtrer l’activité d’un canal (WhatsApp/Telegram/etc.), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journal

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et Control UI analysent ces
entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

### Sortie console

Les journaux console sont **compatibles TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par ex. `gateway/channels/whatsapp`)
- Couleurs par niveau (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket Gateway

`openclaw gateway` dispose aussi d’une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : uniquement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style de rendu verbeux
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configuration de la journalisation

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

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par ex. `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement est prioritaire sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option CLI globale **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` n’affecte que la sortie console et la verbosité des journaux WS ; il ne modifie pas
les niveaux des journaux de fichiers.

### Styles de console

`logging.consoleStyle` :

- `pretty` : convivial pour l’humain, coloré, avec horodatages.
- `compact` : sortie plus serrée (idéal pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Masquage des données sensibles

Les résumés d’outils peuvent masquer les jetons sensibles avant qu’ils n’atteignent la console :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut

Le masquage s’applique au niveau des sorties de journalisation pour la **sortie console**, les **diagnostics console
redirigés vers stderr**, et les **journaux de fichiers**. Les journaux de fichiers restent en JSONL, mais les
valeurs secrètes correspondantes sont masquées avant que la ligne ne soit écrite sur disque.

## Diagnostics et OpenTelemetry

Les diagnostics sont des événements structurés et lisibles par machine pour les exécutions de modèles et la
télémétrie de flux de messages (Webhooks, mise en file, état de session). Ils ne **remplacent**
pas les journaux — ils alimentent les métriques, traces et exportateurs. Les événements sont émis
dans le processus, que vous les exportiez ou non.

Deux surfaces adjacentes :

- **Export OpenTelemetry** — envoie métriques, traces et journaux via OTLP/HTTP vers
  n’importe quel collecteur ou backend compatible OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, etc.). La configuration complète, le catalogue des signaux,
  les noms de métriques/spans, les variables d’environnement et le modèle de confidentialité se trouvent sur une page dédiée :
  [Export OpenTelemetry](/fr/gateway/opentelemetry).
- **Indicateurs de diagnostics** — indicateurs ciblés de journal de débogage qui routent des journaux supplémentaires vers
  `logging.file` sans augmenter `logging.level`. Les indicateurs sont insensibles à la casse
  et prennent en charge les jokers (`telegram.*`, `*`). Configurez-les sous `diagnostics.flags`
  ou via le remplacement d’environnement `OPENCLAW_DIAGNOSTICS=...`. Guide complet :
  [Indicateurs de diagnostics](/fr/diagnostics/flags).

Pour activer les événements de diagnostic pour des plugins ou des sorties personnalisées sans export OTLP :

```json5
{
  diagnostics: { enabled: true },
}
```

Pour l’export OTLP vers un collecteur, voir [Export OpenTelemetry](/fr/gateway/opentelemetry).

## Conseils de dépannage

- **Gateway inaccessible ?** Lancez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que la Gateway est en cours d’exécution et écrit vers le chemin de fichier
  dans `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace` et recommencez.

## Liens connexes

- [Export OpenTelemetry](/fr/gateway/opentelemetry) — export OTLP/HTTP, catalogue de métriques/spans, modèle de confidentialité
- [Indicateurs de diagnostics](/fr/diagnostics/flags) — indicateurs ciblés de journal de débogage
- [Internes de journalisation Gateway](/fr/gateway/logging) — styles de journal WS, préfixes de sous-système et capture console
- [Référence de configuration](/fr/gateway/configuration-reference#diagnostics) — référence complète des champs `diagnostics.*`
