---
read_when:
    - Vous souhaitez comprendre rapidement le fonctionnement de la gestion des fuseaux horaires
    - Vous décidez où définir ou remplacer un fuseau horaire
summary: Où les fuseaux horaires apparaissent dans OpenClaw — enveloppes, charges utiles des outils, invite système
title: Fuseaux horaires
x-i18n:
    generated_at: "2026-07-12T15:15:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw normalise les horodatages afin que le modèle voie une **heure de référence unique** plutôt qu’un mélange d’horloges locales aux fournisseurs. Trois surfaces affichent les fuseaux horaires, chacune ayant son propre objectif :

## Trois surfaces de fuseau horaire

| Surface               | Ce qu’elle affiche                                                                                                       | Valeur par défaut                                        | Configuration via                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Enveloppes de message | Encapsulent les messages entrants des canaux : `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                        | Fuseau local de l’hôte                                   | `agents.defaults.envelopeTimezone`                     |
| Charges utiles d’outil | Les outils de canal de type `readMessages` renvoient l’heure brute du fournisseur ainsi que les valeurs normalisées `timestampMs` / `timestampUtc` | Champs UTC toujours présents                             | Non configurable ; conserve les horodatages natifs du fournisseur |
| Invite système        | Un petit bloc `Current Date & Time` contenant **uniquement le fuseau horaire** (sans valeur d’heure, pour la stabilité du cache) | Fuseau horaire de l’hôte si `userTimezone` n’est pas défini | `agents.defaults.userTimezone`                         |

L’invite système omet délibérément l’heure actuelle afin de préserver la stabilité de la mise en cache des invites entre les tours. Lorsque l’agent a besoin de l’heure actuelle, il appelle `session_status`.

## Définition du fuseau horaire de l’utilisateur

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Si `userTimezone` n’est pas défini, OpenClaw détermine le fuseau horaire de l’hôte à l’exécution via `Intl.DateTimeFormat().resolvedOptions().timeZone` (sans écrire dans la configuration). `agents.defaults.timeFormat` (`auto` | `12` | `24`) contrôle le rendu au format 12 h/24 h dans les enveloppes et les surfaces en aval, mais pas dans la section de l’invite système.

## Valeurs de fuseau horaire des enveloppes

`agents.defaults.envelopeTimezone` accepte :

- `"local"` (par défaut) ou `"host"` — le fuseau horaire de la machine hôte.
- `"utc"` ou `"gmt"` — UTC.
- `"user"` — la valeur résolue de `agents.defaults.userTimezone` (utilise le fuseau horaire de l’hôte si elle n’est pas définie).
- Toute chaîne de zone IANA explicite, par exemple `"Europe/Vienna"`.

## Quand remplacer la valeur par défaut

- **Utilisez `"utc"`** pour obtenir des horodatages stables entre des hôtes situés dans différentes régions, ou pour les faire correspondre aux diagnostics et aux journaux alignés sur UTC.
- **Utilisez `"user"`** pour maintenir les enveloppes alignées sur le fuseau horaire configuré pour l’utilisateur, quel que soit le fuseau dans lequel s’exécute l’hôte du Gateway.
- **Utilisez une zone IANA fixe** lorsque l’hôte du Gateway se trouve dans un fuseau, mais que l’enveloppe doit toujours afficher l’heure d’un autre fuseau, indépendamment des migrations de l’hôte.
- **Définissez `envelopeTimestamp: "off"`** lorsque le contexte d’horodatage n’est pas utile à la conversation. Cela supprime les horodatages absolus des enveloppes, des préfixes directs des invites de l’agent et des préfixes intégrés aux entrées du modèle.

Pour consulter la référence complète du comportement, des exemples pour chaque fournisseur et le formatage du temps écoulé, reportez-vous à [Date et heure](/fr/date-time).

## Voir aussi

- [Date et heure](/fr/date-time) — comportement complet des enveloppes, outils et invites, avec des exemples.
- [Heartbeat](/fr/gateway/heartbeat) — les heures d’activité utilisent le fuseau horaire pour la planification.
- [Tâches Cron](/fr/automation/cron-jobs) — les expressions Cron utilisent le fuseau horaire pour la planification.
