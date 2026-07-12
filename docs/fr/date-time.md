---
read_when:
    - Vous modifiez la manière dont les horodatages sont présentés au modèle ou aux utilisateurs
    - Vous déboguez le formatage de l’heure dans les messages ou la sortie de l’invite système
summary: Gestion de la date et de l’heure dans les enveloppes, les prompts, les outils et les connecteurs
title: Date et heure
x-i18n:
    generated_at: "2026-07-12T02:32:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw utilise **l’heure locale de l’hôte pour les horodatages de transport** et n’inclut **que le fuseau horaire** dans le prompt système.
Les horodatages des fournisseurs sont conservés afin que les outils gardent leur sémantique native. Lorsque l’agent a besoin de l’heure
actuelle, il exécute l’outil `session_status`.

## Enveloppes de messages (locales par défaut)

Les messages entrants sont encapsulés avec le jour de la semaine et un horodatage à la seconde près :

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

L’horodatage de l’enveloppe utilise **l’heure locale de l’hôte par défaut**, quel que soit le fuseau horaire du fournisseur.
Vous pouvez modifier ce comportement sous `agents.defaults` :

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuseau horaire IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Clé                 | Valeurs                                               | Comportement                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (par défaut), `utc`, `user`, nom IANA explicite | `user` utilise `agents.defaults.userTimezone` (le fuseau horaire de l’hôte s’il n’est pas défini). Un nom IANA explicite (par ex. `"America/Chicago"`) fixe un fuseau donné ; les noms non reconnus utilisent UTC par défaut. |
| `envelopeTimestamp` | `on` (par défaut), `off`                                | `off` supprime les horodatages absolus des en-têtes d’enveloppe, des préfixes directs du prompt de l’agent et des préfixes intégrés aux entrées du modèle.                                                       |
| `envelopeElapsed`   | `on` (par défaut), `off`                                | `off` supprime le suffixe de temps écoulé (au format `+30s` / `+2m`) affiché depuis le message précédent de la session.                                                               |

### Exemples

**Local (par défaut) :**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Fuseau horaire de l’utilisateur :**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Temps écoulé avec `envelopeTimezone: "utc"` :**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt système : date et heure actuelles

Le prompt système comprend une section **Date et heure actuelles** qui contient **uniquement le fuseau horaire**
(sans heure ni format d’heure), afin que la mise en cache du prompt reste stable :

```
Fuseau horaire : America/Chicago
```

Le fuseau utilisé est celui de `agents.defaults.userTimezone` lorsqu’il est configuré, sinon celui de l’hôte.
Le prompt demande également à l’agent d’exécuter l’outil `session_status` chaque fois qu’il a besoin de la
date actuelle, de l’heure actuelle ou du jour de la semaine.

## Lignes d’événements système (locales par défaut)

Les événements système en file d’attente insérés dans le contexte de l’agent sont préfixés par un horodatage qui utilise
la même valeur `envelopeTimezone` que les enveloppes de messages (par défaut : heure locale de l’hôte).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurer le fuseau horaire de l’utilisateur et le format

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` définit le **fuseau horaire local de l’utilisateur** pour le contexte du prompt (et pour `envelopeTimezone: "user"`).
- `timeFormat` contrôle **l’affichage sur 12 ou 24 heures** des heures présentées dans le prompt. `auto` suit les préférences du système d’exploitation.

## Détection du format de l’heure (`auto`)

Lorsque `timeFormat: "auto"`, OpenClaw examine les préférences du système d’exploitation (macOS et Windows)
et utilise à défaut le format défini par les paramètres régionaux. La valeur détectée est **mise en cache pour chaque processus**
afin d’éviter les appels système répétés.

## Charges utiles des outils et connecteurs (heure brute du fournisseur et champs normalisés)

Les outils de canal renvoient les **horodatages natifs du fournisseur** et ajoutent des champs normalisés pour assurer la cohérence :

- `timestampMs` : millisecondes depuis l’époque Unix (UTC)
- `timestampUtc` : chaîne UTC au format ISO 8601

Les champs bruts du fournisseur sont conservés afin qu’aucune information ne soit perdue.

- Discord : horodatages ISO en UTC
- Slack : chaînes similaires à des temps Unix provenant de l’API
- Telegram/WhatsApp : horodatages numériques ou ISO propres au fournisseur

Si vous avez besoin de l’heure locale, convertissez-la en aval à l’aide du fuseau horaire connu.

## Documentation associée

- [Prompt système](/fr/concepts/system-prompt)
- [Fuseaux horaires](/fr/concepts/timezone)
- [Messages](/fr/concepts/messages)
