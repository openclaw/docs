---
read_when:
    - Vous devez comprendre comment les horodatages sont normalisés pour le modèle
    - Configuration du fuseau horaire utilisateur pour les prompts système
summary: Gestion des fuseaux horaires pour les agents, les enveloppes et les prompts
title: Fuseaux horaires
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:08:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClaw standardise les horodatages afin que le modèle voie une **seule heure de référence**.

## Enveloppes de message (locales par défaut)

Les messages entrants sont encapsulés dans une enveloppe comme :

```text
[Provider ... 2026-01-05 16:26 PST] message text
```

L’horodatage dans l’enveloppe est **local à l’hôte par défaut**, avec une précision à la minute.

Vous pouvez remplacer cela avec :

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

- `envelopeTimezone: "utc"` utilise l’UTC.
- `envelopeTimezone: "user"` utilise `agents.defaults.userTimezone` (repli sur le fuseau horaire de l’hôte).
- Utilisez un fuseau horaire IANA explicite (par ex. `"Europe/Vienna"`) pour un décalage fixe.
- `envelopeTimestamp: "off"` supprime les horodatages absolus des en-têtes d’enveloppe.
- `envelopeElapsed: "off"` supprime les suffixes de temps écoulé (style `+2m`).

### Exemples

**Local (par défaut) :**

```text
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Fuseau horaire fixe :**

```text
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Temps écoulé :**

```text
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Charges utiles des outils (données brutes du fournisseur + champs normalisés)

Les appels d’outil (`channels.discord.readMessages`, `channels.slack.readMessages`, etc.) renvoient des **horodatages bruts du fournisseur**.
Nous joignons également des champs normalisés pour la cohérence :

- `timestampMs` (millisecondes d’époque UTC)
- `timestampUtc` (chaîne UTC ISO 8601)

Les champs bruts du fournisseur sont préservés.

## Fuseau horaire utilisateur pour le prompt système

Définissez `agents.defaults.userTimezone` pour indiquer au modèle le fuseau horaire local de l’utilisateur. S’il
n’est pas défini, OpenClaw résout le **fuseau horaire de l’hôte à l’exécution** (sans écriture dans la configuration).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Le prompt système inclut :

- une section `Current Date & Time` avec l’heure locale et le fuseau horaire
- `Time format: 12-hour` ou `24-hour`

Vous pouvez contrôler le format du prompt avec `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Voir [Date & Time](/fr/date-time) pour le comportement complet et des exemples.

## Lié

- [Heartbeat](/fr/gateway/heartbeat) — les heures actives utilisent le fuseau horaire pour la planification
- [Tâches Cron](/fr/automation/cron-jobs) — les expressions Cron utilisent le fuseau horaire pour la planification
- [Date & Time](/fr/date-time) — comportement complet de la date/heure et exemples
