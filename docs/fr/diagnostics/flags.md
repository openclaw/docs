---
read_when:
    - Vous avez besoin de journaux de débogage ciblés sans augmenter les niveaux de journalisation globaux
    - Vous devez capturer les journaux propres au sous-système pour le support
summary: Indicateurs de diagnostic pour des journaux de débogage ciblés
title: Indicateurs de diagnostic
x-i18n:
    generated_at: "2026-06-27T17:28:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

Les indicateurs de diagnostic vous permettent d’activer des journaux de débogage ciblés sans activer la journalisation détaillée partout. Les indicateurs sont optionnels et n’ont aucun effet sauf si un sous-système les vérifie.

## Fonctionnement

- Les indicateurs sont des chaînes (insensibles à la casse).
- Vous pouvez activer des indicateurs dans la configuration ou via une surcharge d’environnement.
- Les caractères génériques sont pris en charge :
  - `telegram.*` correspond à `telegram.http`
  - `*` active tous les indicateurs

## Activation via la configuration

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

## Surcharge d’environnement (ponctuelle)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Désactiver tous les indicateurs :

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` est une surcharge de désactivation au niveau du processus : elle désactive
les indicateurs provenant à la fois de l’environnement et de la configuration pour ce processus.

## Indicateurs de profilage

Les indicateurs du profileur activent des intervalles de chronométrage ciblés sans augmenter les niveaux
globaux de journalisation. Ils sont désactivés par défaut.

Activer tous les intervalles contrôlés par le profileur pour une exécution du Gateway :

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

Activer uniquement les intervalles du profileur de distribution des réponses :

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

Activer uniquement les intervalles du profileur de démarrage/outil/fil du serveur d’application Codex :

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

Activer les indicateurs du profileur depuis la configuration :

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

Redémarrez le Gateway après avoir modifié les indicateurs de configuration. Pour désactiver un indicateur du profileur,
retirez-le de `diagnostics.flags` et redémarrez. Pour désactiver temporairement tous les
indicateurs de diagnostic même lorsque la configuration active des indicateurs du profileur, démarrez le processus avec :

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## Artefacts de chronologie

L’indicateur `timeline` écrit des événements structurés de chronométrage au démarrage et à l’exécution pour
les harnais QA externes :

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
configuration, les premiers intervalles de chargement de la configuration ne sont pas émis, car OpenClaw n’a
pas encore lu la configuration ; les intervalles de démarrage suivants utilisent l’indicateur de configuration.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` et
`OPENCLAW_DIAGNOSTICS=*` activent aussi la chronologie, car ils activent tous les
indicateurs de diagnostic. Préférez `timeline` lorsque vous voulez uniquement l’artefact
de chronométrage JSONL.

Les enregistrements de chronologie utilisent l’enveloppe `openclaw.diagnostics.v1`. Les événements peuvent inclure
des identifiants de processus, des noms de phase, des noms d’intervalle, des durées, des identifiants de Plugin, des nombres de dépendances,
des échantillons de délai de boucle d’événements, des noms d’opérations de fournisseur, l’état de sortie de processus enfant,
ainsi que des noms/messages d’erreur au démarrage. Traitez les fichiers de chronologie comme des
artefacts de diagnostic locaux ; vérifiez-les avant de les partager hors de votre machine.

## Emplacement des journaux

Les indicateurs émettent des journaux dans le fichier journal de diagnostic standard. Par défaut :

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

Ou suivre le journal pendant la reproduction :

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Pour les Gateways distants, vous pouvez aussi utiliser `openclaw logs --follow` (voir [/cli/logs](/fr/cli/logs)).

## Notes

- Si `logging.level` est défini à un niveau supérieur à `warn`, ces journaux peuvent être supprimés. La valeur par défaut `info` convient.
- `brave.http` journalise les URL/paramètres de requête Brave Search, l’état/le chronométrage des réponses, ainsi que les événements d’accès/échec/écriture du cache. Il ne journalise pas les clés API ni les corps de réponse, mais les requêtes de recherche peuvent être sensibles.
- Les indicateurs peuvent rester activés sans risque ; ils n’affectent que le volume des journaux pour le sous-système spécifique.
- Utilisez [/logging](/fr/logging) pour modifier les destinations, niveaux et règles de rédaction des journaux.

## Connexe

- [Diagnostics du Gateway](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
