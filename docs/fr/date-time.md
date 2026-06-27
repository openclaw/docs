---
read_when:
    - Vous modifiez la façon dont les horodatages sont affichés au modèle ou aux utilisateurs
    - Vous déboguez la mise en forme de l’heure dans les messages ou la sortie de l’invite système
summary: Gestion de la date et de l’heure dans les enveloppes, les prompts, les outils et les connecteurs
title: Date et heure
x-i18n:
    generated_at: "2026-06-27T17:27:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw utilise par défaut **l’heure locale de l’hôte pour les horodatages de transport** et **le fuseau horaire utilisateur uniquement dans le prompt système**.
Les horodatages du fournisseur sont conservés afin que les outils gardent leur sémantique native (l’heure actuelle est disponible via `session_status`).

## Enveloppes de messages (locales par défaut)

Les messages entrants sont enveloppés avec un horodatage (précision à la seconde) :

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Cet horodatage d’enveloppe est **local à l’hôte par défaut**, quel que soit le fuseau horaire du fournisseur.

Vous pouvez modifier ce comportement :

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
- `envelopeTimestamp: "off"` supprime les horodatages absolus des en-têtes d’enveloppe, des préfixes de prompt agent directs et des préfixes d’entrée de modèle intégrés.
- `envelopeElapsed: "off"` supprime les suffixes de temps écoulé (le style `+2m`).

### Exemples

**Local (par défaut) :**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Fuseau horaire utilisateur :**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Temps écoulé activé :**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt système : date et heure actuelles

Si le fuseau horaire utilisateur est connu, le prompt système inclut une section dédiée
**Date et heure actuelles** avec **uniquement le fuseau horaire** (sans format d’horloge/d’heure)
afin de garder la mise en cache du prompt stable :

```
Time zone: America/Chicago
```

Lorsque l’agent a besoin de l’heure actuelle, utilisez l’outil `session_status` ; la carte
de statut inclut une ligne d’horodatage.

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

Lorsque `timeFormat: "auto"`, OpenClaw inspecte la préférence du système d’exploitation (macOS/Windows)
et se replie sur le formatage régional. La valeur détectée est **mise en cache par processus**
afin d’éviter les appels système répétés.

## Charges utiles d’outils + connecteurs (heure brute du fournisseur + champs normalisés)

Les outils de canal renvoient des **horodatages natifs du fournisseur** et ajoutent des champs normalisés pour la cohérence :

- `timestampMs` : millisecondes depuis l’époque Unix (UTC)
- `timestampUtc` : chaîne UTC ISO 8601

Les champs bruts du fournisseur sont conservés afin que rien ne soit perdu.

- Slack : chaînes de type epoch provenant de l’API
- Discord : horodatages ISO UTC
- Telegram/WhatsApp : horodatages numériques/ISO propres au fournisseur

Si vous avez besoin de l’heure locale, convertissez-la en aval avec le fuseau horaire connu.

## Documentation associée

- [Prompt système](/fr/concepts/system-prompt)
- [Fuseaux horaires](/fr/concepts/timezone)
- [Messages](/fr/concepts/messages)
