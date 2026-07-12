---
read_when:
    - Vous souhaitez comprendre rapidement le fonctionnement de la gestion des fuseaux horaires
    - Vous déterminez où définir ou remplacer un fuseau horaire
summary: Où les fuseaux horaires apparaissent dans OpenClaw — enveloppes, charges utiles des outils, invite système
title: Fuseaux horaires
x-i18n:
    generated_at: "2026-07-12T02:48:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw standardise les horodatages afin que le modèle voie une **heure de référence unique** plutôt qu’un mélange d’horloges locales propres aux fournisseurs. Trois surfaces affichent des fuseaux horaires, chacune ayant son propre objectif :

## Trois surfaces de fuseau horaire

| Surface                | Ce qu’elle affiche                                                                                                                         | Valeur par défaut                                  | Configuration via                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Enveloppes de messages | Encapsule les messages entrants des canaux : `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                              | Fuseau local de l’hôte                             | `agents.defaults.envelopeTimezone`                     |
| Charges utiles d’outil | Les outils de canal de type `readMessages` renvoient l’heure brute du fournisseur ainsi que les champs normalisés `timestampMs` / `timestampUtc` | Champs UTC toujours présents                       | Non configurable ; conserve les horodatages natifs du fournisseur |
| Invite système         | Un petit bloc `Date et heure actuelles` contenant **uniquement le fuseau horaire** (sans heure, pour préserver la stabilité du cache)        | Fuseau de l’hôte si `userTimezone` n’est pas défini | `agents.defaults.userTimezone`                         |

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

Si `userTimezone` n’est pas défini, OpenClaw détermine le fuseau horaire de l’hôte à l’exécution via `Intl.DateTimeFormat().resolvedOptions().timeZone` (sans écrire dans la configuration). `agents.defaults.timeFormat` (`auto` | `12` | `24`) contrôle l’affichage au format 12 ou 24 heures dans les enveloppes et les surfaces en aval, mais pas dans la section de l’invite système.

## Valeurs du fuseau horaire des enveloppes

`agents.defaults.envelopeTimezone` accepte :

- `"local"` (valeur par défaut) ou `"host"` - fuseau horaire de la machine hôte.
- `"utc"` ou `"gmt"` - UTC.
- `"user"` - valeur résolue de `agents.defaults.userTimezone` (utilise le fuseau horaire de l’hôte si elle n’est pas définie).
- Toute chaîne explicite de fuseau IANA, par exemple `"Europe/Vienna"`.

## Quand remplacer la valeur par défaut

- **Utilisez `"utc"`** pour obtenir des horodatages cohérents entre des hôtes situés dans différentes régions, ou pour les faire correspondre à des diagnostics et journaux alignés sur UTC.
- **Utilisez `"user"`** pour aligner les enveloppes sur le fuseau horaire configuré pour l’utilisateur, quel que soit le fuseau dans lequel s’exécute l’hôte du Gateway.
- **Utilisez un fuseau IANA fixe** lorsque l’hôte du Gateway se trouve dans un fuseau, mais que l’enveloppe doit toujours être affichée dans un autre, indépendamment des migrations de l’hôte.
- **Définissez `envelopeTimestamp: "off"`** lorsque le contexte temporel n’est pas utile à la conversation. Cela supprime les horodatages absolus des enveloppes, des préfixes directs des invites de l’agent et des préfixes intégrés aux entrées du modèle.

Pour consulter la référence complète du comportement, des exemples par fournisseur et le formatage du temps écoulé, voir [Date et heure](/fr/date-time).

## Pages connexes

- [Date et heure](/fr/date-time) - comportement complet des enveloppes, outils et invites, ainsi que des exemples.
- [Heartbeat](/fr/gateway/heartbeat) - les heures d’activité utilisent le fuseau horaire pour la planification.
- [Tâches Cron](/fr/automation/cron-jobs) - les expressions cron utilisent le fuseau horaire pour la planification.
