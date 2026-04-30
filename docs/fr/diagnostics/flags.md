---
read_when:
    - Vous avez besoin de journaux de débogage ciblés sans augmenter les niveaux de journalisation globaux
    - Vous devez capturer les journaux spécifiques au sous-système pour l’assistance
summary: Options de diagnostic pour les journaux de débogage ciblés
title: Options de diagnostic
x-i18n:
    generated_at: "2026-04-30T07:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

Les flags de diagnostic vous permettent d’activer des journaux de débogage ciblés sans activer la journalisation détaillée partout. Les flags sont à activer explicitement et n’ont aucun effet sauf si un sous-système les vérifie.

## Fonctionnement

- Les flags sont des chaînes (insensibles à la casse).
- Vous pouvez activer des flags dans la configuration ou via une surcharge env.
- Les caractères génériques sont pris en charge :
  - `telegram.*` correspond à `telegram.http`
  - `*` active tous les flags

## Activer via la configuration

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Plusieurs flags :

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Redémarrez le Gateway après avoir modifié les flags.

## Surcharge env (ponctuelle)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Désactiver tous les flags :

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Artifacts de chronologie

Le flag `timeline` écrit des événements structurés de démarrage et de mesure du temps d’exécution pour
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
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. Quand `timeline` est activé uniquement depuis
la configuration, les tout premiers intervalles de chargement de configuration ne sont pas émis, car OpenClaw n’a
pas encore lu la configuration ; les intervalles de démarrage suivants utilisent le flag de configuration.

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all` et
`OPENCLAW_DIAGNOSTICS=*` activent également la chronologie, car ils activent tous les
flags de diagnostic. Préférez `timeline` quand vous voulez uniquement l’artifact de mesure du temps
JSONL.

Les enregistrements de chronologie utilisent l’enveloppe `openclaw.diagnostics.v1`. Les événements peuvent inclure
des ids de processus, des noms de phase, des noms d’intervalle, des durées, des ids de plugin, des nombres de dépendances,
des échantillons de délai de boucle d’événements, des noms d’opération de fournisseur, l’état de sortie de processus enfant
et des noms/messages d’erreur de démarrage. Traitez les fichiers de chronologie comme des artifacts de diagnostic
locaux ; examinez-les avant de les partager en dehors de votre machine.

## Emplacement des journaux

Les flags émettent les journaux dans le fichier journal de diagnostic standard. Par défaut :

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si vous définissez `logging.file`, utilisez plutôt ce chemin. Les journaux sont en JSONL (un objet JSON par ligne). La rédaction s’applique toujours selon `logging.redactSensitive`.

## Extraire les journaux

Choisir le dernier fichier journal :

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrer les diagnostics HTTP Telegram :

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Ou suivre le journal pendant la reproduction :

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Pour les Gateways distants, vous pouvez aussi utiliser `openclaw logs --follow` (voir [/cli/logs](/fr/cli/logs)).

## Notes

- Si `logging.level` est défini à un niveau supérieur à `warn`, ces journaux peuvent être supprimés. La valeur par défaut `info` convient.
- Les flags peuvent être laissés activés sans risque ; ils n’affectent que le volume de journaux du sous-système spécifique.
- Utilisez [/logging](/fr/logging) pour modifier les destinations, les niveaux et la rédaction des journaux.

## Connexe

- [Diagnostics Gateway](/fr/gateway/diagnostics)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
