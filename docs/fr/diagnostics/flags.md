---
read_when:
    - Vous avez besoin de journaux de débogage ciblés sans augmenter les niveaux de journalisation globaux
    - Vous devez collecter les journaux propres à un sous-système pour l’assistance
summary: Indicateurs de diagnostic pour les journaux de débogage ciblés
title: Options de diagnostic
x-i18n:
    generated_at: "2026-05-02T07:05:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

Les indicateurs de diagnostic vous permettent d’activer des journaux de débogage ciblés sans activer la journalisation détaillée partout. Les indicateurs sont opt-in et n’ont aucun effet sauf si un sous-système les vérifie.

## Fonctionnement

- Les indicateurs sont des chaînes de caractères (insensibles à la casse).
- Vous pouvez activer des indicateurs dans la configuration ou via un remplacement par variable d’environnement.
- Les caractères génériques sont pris en charge :
  - `telegram.*` correspond à `telegram.http`
  - `*` active tous les indicateurs

## Activer via la configuration

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

Redémarrez le Gateway après avoir modifié les indicateurs.

## Remplacement par variable d’environnement (ponctuel)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Désactiver tous les indicateurs :

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artefacts de chronologie

L’indicateur `timeline` écrit des événements structurés de démarrage et de synchronisation d’exécution pour
les harnais de QA externes :

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

Vous pouvez aussi l’activer dans la configuration :

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

Le chemin du fichier de chronologie provient toujours de
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Lorsque `timeline` est activé uniquement depuis la
configuration, les premiers segments de chargement de la configuration ne sont pas émis, car OpenClaw n’a
pas encore lu la configuration ; les segments de démarrage suivants utilisent l’indicateur de configuration.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` et
`OPENCLAW_DIAGNOSTICS=*` activent aussi la chronologie, car ils activent tous les
indicateurs de diagnostic. Préférez `timeline` lorsque vous voulez uniquement l’artefact de synchronisation
JSONL.

Les enregistrements de chronologie utilisent l’enveloppe `openclaw.diagnostics.v1`. Les événements peuvent inclure
des identifiants de processus, des noms de phase, des noms de segment, des durées, des identifiants de plugin, des nombres de dépendances,
des échantillons de délai de boucle d’événements, des noms d’opérations de fournisseur, l’état de sortie de processus enfants,
ainsi que des noms/messages d’erreurs de démarrage. Traitez les fichiers de chronologie comme des
artefacts de diagnostic locaux ; examinez-les avant de les partager en dehors de votre machine.

## Emplacement des journaux

Les indicateurs émettent des journaux dans le fichier de journaux de diagnostic standard. Par défaut :

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si vous définissez `logging.file`, utilisez plutôt ce chemin. Les journaux sont au format JSONL (un objet JSON par ligne). La rédaction s’applique toujours selon `logging.redactSensitive`.

## Extraire les journaux

Choisir le fichier journal le plus récent :

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrer les diagnostics HTTP de Telegram :

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Filtrer les diagnostics HTTP de Brave Search :

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

Ou suivre les journaux pendant la reproduction :

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Pour les Gateways distants, vous pouvez aussi utiliser `openclaw logs --follow` (voir [/cli/logs](/fr/cli/logs)).

## Remarques

- Si `logging.level` est défini à une valeur supérieure à `warn`, ces journaux peuvent être supprimés. La valeur par défaut `info` convient.
- `brave.http` journalise les URL/paramètres de requête des demandes Brave Search, l’état/le temps de réponse et les événements de réussite/échec/écriture du cache. Il ne journalise pas les clés d’API ni les corps de réponse, mais les requêtes de recherche peuvent être sensibles.
- Les indicateurs peuvent rester activés sans risque ; ils n’affectent que le volume de journaux du sous-système spécifique.
- Utilisez [/logging](/fr/logging) pour modifier les destinations, les niveaux et la rédaction des journaux.

## Connexe

- [Diagnostics du Gateway](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
