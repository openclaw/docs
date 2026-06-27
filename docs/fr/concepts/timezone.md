---
read_when:
    - Vous voulez un modèle mental rapide pour la gestion des fuseaux horaires
    - Vous décidez où définir ou remplacer un fuseau horaire
summary: Où les fuseaux horaires apparaissent dans OpenClaw — enveloppes, charges utiles des outils, invite système
title: Fuseaux horaires
x-i18n:
    generated_at: "2026-06-27T17:27:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardise les horodatages afin que le modèle voie une **heure de référence unique** au lieu d’un mélange d’horloges locales aux fournisseurs. Les fuseaux horaires apparaissent à trois endroits, chacun avec son propre objectif :

## Trois surfaces de fuseau horaire

| Surface               | Ce qu’elle affiche                                                                                                  | Valeur par défaut                                  | Configuré via                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Enveloppes de message | Encapsule les messages entrants des canaux : `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                     | Locale de l’hôte                                   | `agents.defaults.envelopeTimezone`                      |
| Charges utiles d’outil | Les outils de type `readMessages` du canal renvoient l’heure brute du fournisseur + `timestampMs` / `timestampUtc` normalisés | Champs UTC toujours présents                       | Non configurable — préserve les horodatages natifs du fournisseur |
| Invite système        | Un petit bloc `Current Date & Time` avec le **fuseau horaire uniquement** (sans valeur d’horloge, pour la stabilité du cache) | Fuseau horaire de l’hôte si `userTimezone` n’est pas défini | `agents.defaults.userTimezone`                          |

L’invite système omet volontairement l’horloge en direct afin de garder la mise en cache des invites stable d’un tour à l’autre. Lorsque l’agent a besoin de l’heure actuelle, il appelle `session_status`.

## Définir le fuseau horaire de l’utilisateur

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Si `userTimezone` n’est pas défini, OpenClaw résout le fuseau horaire de l’hôte à l’exécution (sans écrire de configuration). `agents.defaults.timeFormat` (`auto` | `12` | `24`) contrôle le rendu 12 h/24 h dans les enveloppes et les surfaces en aval, pas dans la section de l’invite système.

## Quand remplacer la valeur par défaut

- **Utilisez des enveloppes UTC** (`envelopeTimezone: "utc"`) lorsque vous voulez des horodatages stables entre des hôtes situés dans différentes régions, ou lorsque vous voulez que les journaux alignés sur UTC correspondent à la sortie de diagnostic.
- **Utilisez une zone IANA fixe** (par exemple `"Europe/Vienna"`) lorsque l’hôte du Gateway se trouve dans une zone mais que l’utilisateur se trouve dans une autre, et que vous voulez que les enveloppes soient lues dans la zone de l’utilisateur indépendamment de la migration de l’hôte.
- **Définissez `envelopeTimestamp: "off"`** lorsque le contexte d’horodatage n’est pas utile à la conversation. Cela supprime les horodatages absolus des enveloppes, des préfixes d’invite directe de l’agent et des préfixes intégrés d’entrée du modèle.

Pour la référence complète du comportement, les exemples par fournisseur et la mise en forme du temps écoulé, consultez [Date et heure](/fr/date-time).

## Associé

- [Date et heure](/fr/date-time) — comportement et exemples complets pour les enveloppes, les outils et les invites.
- [Heartbeat](/fr/gateway/heartbeat) — les heures actives utilisent le fuseau horaire pour la planification.
- [Tâches Cron](/fr/automation/cron-jobs) — les expressions cron utilisent le fuseau horaire pour la planification.
