---
read_when:
    - Vous modifiez la façon dont les horodatages sont affichés au modèle ou aux utilisateurs
    - Vous déboguez le formatage de l’heure dans les messages ou la sortie de l’invite système
summary: Gestion des dates et des heures dans les enveloppes, les invites, les outils et les connecteurs
title: Date et heure
x-i18n:
    generated_at: "2026-05-06T07:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw utilise par défaut **l’heure locale de l’hôte pour les horodatages de transport** et **le fuseau horaire de l’utilisateur uniquement dans le prompt système**.
Les horodatages des fournisseurs sont préservés afin que les outils conservent leur sémantique native (l’heure actuelle est disponible via `session_status`).

## Enveloppes de messages (locales par défaut)

Les messages entrants sont enveloppés avec un horodatage (précision à la minute) :

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Cet horodatage d’enveloppe est **local à l’hôte par défaut**, quel que soit le fuseau horaire du fournisseur.

Vous pouvez remplacer ce comportement :

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` utilise UTC.
- `envelopeTimezone: "local"` utilise le fuseau horaire de l’hôte.
- `envelopeTimezone: "user"` utilise `agents.defaults.userTimezone` (avec repli sur le fuseau horaire de l’hôte).
- Utilisez un fuseau horaire IANA explicite (par exemple, `"America/Chicago"`) pour une zone fixe.
- `envelopeTimestamp: "off"` supprime les horodatages absolus des en-têtes d’enveloppe.
- `envelopeElapsed: "off"` supprime les suffixes de temps écoulé (le style `+2m`).

### Exemples

**Local (par défaut) :**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Fuseau horaire de l’utilisateur :**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Temps écoulé activé :**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt système : date et heure actuelles

Si le fuseau horaire de l’utilisateur est connu, le prompt système inclut une section dédiée
**Date et heure actuelles** avec **uniquement le fuseau horaire** (sans horloge ni format d’heure)
afin de stabiliser la mise en cache du prompt :

```
Time zone: America/Chicago
```

Lorsque l’agent a besoin de l’heure actuelle, utilisez l’outil `session_status` ; la carte
d’état inclut une ligne d’horodatage.

## Lignes d’événements système (locales par défaut)

Les événements système en file d’attente insérés dans le contexte de l’agent sont préfixés par un horodatage utilisant la
même sélection de fuseau horaire que les enveloppes de messages (par défaut : local à l’hôte).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurer le fuseau horaire utilisateur + le format

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

- `userTimezone` définit le **fuseau horaire local de l’utilisateur** pour le contexte du prompt.
- `timeFormat` contrôle **l’affichage 12 h/24 h** dans le prompt. `auto` suit les préférences du système d’exploitation.

## Détection du format horaire (auto)

Lorsque `timeFormat: "auto"`, OpenClaw inspecte les préférences du système d’exploitation (macOS/Windows)
et se replie sur le formatage des paramètres régionaux. La valeur détectée est **mise en cache par processus**
afin d’éviter des appels système répétés.

## Charges utiles d’outils + connecteurs (heure brute du fournisseur + champs normalisés)

Les outils de canaux renvoient des **horodatages natifs du fournisseur** et ajoutent des champs normalisés par souci de cohérence :

- `timestampMs` : millisecondes depuis l’époque Unix (UTC)
- `timestampUtc` : chaîne UTC ISO 8601

Les champs bruts du fournisseur sont préservés afin que rien ne soit perdu.

- Slack : chaînes de type epoch provenant de l’API
- Discord : horodatages ISO UTC
- Telegram/WhatsApp : horodatages numériques/ISO spécifiques au fournisseur

Si vous avez besoin de l’heure locale, convertissez-la en aval à l’aide du fuseau horaire connu.

## Documentation associée

- [Prompt système](/fr/concepts/system-prompt)
- [Fuseaux horaires](/fr/concepts/timezone)
- [Messages](/fr/concepts/messages)
