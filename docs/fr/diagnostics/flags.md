---
read_when:
    - Vous avez besoin de journaux de débogage ciblés sans augmenter les niveaux de journalisation globaux
    - Vous devez recueillir les journaux propres au sous-système pour obtenir de l’aide.
summary: Indicateurs de diagnostic pour des journaux de débogage ciblés
title: Indicateurs de diagnostic
x-i18n:
    generated_at: "2026-07-12T02:49:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9847f464fde89d9e639b089fe54fb933deb9debad2a6d8b120ab01bacff181a8
    source_path: diagnostics/flags.md
    workflow: 16
---

Les indicateurs de diagnostic activent une journalisation supplémentaire pour un sous-système sans augmenter globalement `logging.level`. Un indicateur reste sans effet tant qu’un sous-système ne le vérifie pas.

## Fonctionnement

- Les indicateurs sont des chaînes insensibles à la casse, déterminées à partir de `diagnostics.flags` dans la configuration et de la valeur de remplacement fournie par la variable d’environnement `OPENCLAW_DIAGNOSTICS`, puis dédupliquées et converties en minuscules.
- `name.*` correspond à `name` lui-même et à tout ce qui se trouve sous `name.` (par exemple, `telegram.*` correspond à `telegram.http`).
- `*` ou `all` active tous les indicateurs.
- Redémarrez le Gateway après avoir modifié `diagnostics.flags` dans la configuration ; cette valeur n’est pas rechargée à chaud.

## Indicateurs connus

| Indicateur       | Active                                                                |
| ---------------- | --------------------------------------------------------------------- |
| `telegram.http`  | Journalisation des erreurs HTTP de l’API Telegram Bot                 |
| `brave.http`     | Journalisation des requêtes, réponses et du cache de Brave Search     |
| `profiler`       | Profileur de l’étape de réponse et du serveur d’application Codex     |
| `reply.profiler` | Profileur de l’étape de réponse uniquement                            |
| `codex.profiler` | Profileur du serveur d’application Codex uniquement                   |
| `timeline`       | Artefact de chronologie JSONL structurée (voir ci-dessous)            |

## Activation par la configuration

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Plusieurs indicateurs :

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

## Remplacement ponctuel par une variable d’environnement

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,brave.http
```

Les valeurs sont séparées par des virgules ou des espaces. Valeurs spéciales :

| Valeur                      | Effet                                                        |
| --------------------------- | ------------------------------------------------------------ |
| `0`, `false`, `off`, `none` | Désactive tous les indicateurs, y compris ceux configurés     |
| `1`, `true`, `all`, `*`     | Active tous les indicateurs                                  |

`OPENCLAW_DIAGNOSTICS=0` désactive pour ce processus les indicateurs provenant à la fois de l’environnement et de la configuration. Cela permet de désactiver temporairement un indicateur de profilage resté actif dans la configuration sans modifier le fichier.

## Indicateurs de profilage

Les indicateurs de profilage contrôlent des intervalles de mesure légers ; lorsqu’ils sont désactivés, ils n’ajoutent aucune surcharge.

Activez tous les intervalles contrôlés par le profilage pour une exécution du Gateway :

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Activez uniquement les intervalles de profilage de distribution des réponses :

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Activez uniquement les intervalles de profilage du démarrage, des outils et des fils d’exécution du serveur d’application Codex :

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

`profiler` active à la fois le profileur de réponse et le profileur Codex ; utilisez les noms d’indicateurs à portée limitée pour n’en activer qu’un seul.

Vous pouvez également les définir dans la configuration :

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Redémarrez le Gateway après avoir modifié les indicateurs de configuration. Pour désactiver un indicateur de profilage, supprimez-le de `diagnostics.flags` et redémarrez, ou lancez le processus avec `OPENCLAW_DIAGNOSTICS=0` afin de remplacer tous les indicateurs de diagnostic pour cette exécution.

## Artefacts de chronologie

L’indicateur `timeline` (alias : `diagnostics.timeline`) écrit sous forme de JSONL des événements structurés de mesure du démarrage et de l’exécution, destinés aux bancs de test d’assurance qualité externes :

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Vous pouvez également l’activer dans la configuration :

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Le chemin de sortie provient toujours de `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`, même lorsque l’indicateur lui-même est défini dans la configuration ; aucune clé de configuration ne permet de définir ce chemin. Lorsque `timeline` est activé uniquement dans la configuration, les premiers intervalles de chargement de la configuration sont absents, car OpenClaw ne l’a pas encore lue ; les intervalles de démarrage suivants sont enregistrés normalement.

`OPENCLAW_DIAGNOSTICS=1`, `=all` et `=*` activent également la chronologie, puisqu’ils activent tous les indicateurs. Préférez l’indicateur à portée limitée `timeline` si vous souhaitez uniquement l’artefact JSONL, sans activer tous les autres indicateurs de diagnostic.

Les échantillons de retard de la boucle d’événements dans la chronologie nécessitent une activation supplémentaire en plus de `timeline` : définissez `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` (ou `on`/`true`/`yes`) en plus d’activer la chronologie.

Les enregistrements de chronologie utilisent l’enveloppe `openclaw.diagnostics.v1` et peuvent inclure les identifiants de processus, les noms de phases, les noms d’intervalles, les durées, les identifiants de plugins, le nombre de dépendances, les échantillons de retard de la boucle d’événements, les noms des opérations des fournisseurs, l’état de sortie des processus enfants ainsi que les noms et messages des erreurs de démarrage. Traitez les fichiers de chronologie comme des artefacts de diagnostic locaux ; examinez-les avant de les partager en dehors de votre machine.

## Emplacement des journaux

Les indicateurs écrivent les journaux dans le fichier de diagnostic standard. Par défaut :

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si vous définissez `logging.file`, utilisez plutôt ce chemin. Les journaux sont au format JSONL (un objet JSON par ligne). La rédaction des données sensibles continue de s’appliquer selon `logging.redactSensitive`. Consultez [Journalisation](/fr/logging) pour connaître le modèle complet de résolution des chemins de journaux, de rotation et de rédaction.

## Extraction des journaux

Sélectionnez le fichier journal le plus récent :

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrez les diagnostics HTTP de Telegram :

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtrez les diagnostics HTTP de Brave Search :

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Ou suivez le journal pendant la reproduction du problème :

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Pour les Gateway distants, utilisez plutôt `openclaw logs --follow` (voir [/cli/logs](/fr/cli/logs)).

## Remarques

- Si `logging.level` est défini à un niveau supérieur à `warn`, les journaux contrôlés par les indicateurs peuvent être supprimés. La valeur par défaut `info` convient.
- `brave.http` journalise les URL et paramètres de requête de Brave Search, l’état et la durée des réponses, ainsi que les événements d’accès réussi, d’échec d’accès et d’écriture dans le cache. Il ne journalise pas la clé d’API (envoyée dans un en-tête de requête) ni le corps des réponses, mais les requêtes de recherche peuvent contenir des données sensibles.
- Vous pouvez laisser les indicateurs activés sans risque ; ils influent uniquement sur le volume des journaux du sous-système concerné.
- Utilisez [/logging](/fr/logging) pour modifier les destinations, les niveaux et la rédaction des journaux.

## Pages connexes

- [Diagnostics du Gateway](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
