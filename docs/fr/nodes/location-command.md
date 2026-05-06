---
read_when:
    - Ajout de la prise en charge des nœuds de localisation ou de l’interface des autorisations
    - Conception des autorisations de localisation Android ou du comportement au premier plan
summary: Commande de localisation pour les nœuds (location.get), modes d’autorisation et comportement Android au premier plan
title: Commande de localisation
x-i18n:
    generated_at: "2026-05-06T07:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` est une commande de nœud (via `node.invoke`).
- Désactivée par défaut.
- Les paramètres de l’application Android utilisent un sélecteur : Désactivé / Lors de l’utilisation.
- Option séparée : localisation précise.

## Pourquoi un sélecteur (et pas seulement un interrupteur)

Les autorisations du système d’exploitation comportent plusieurs niveaux. Nous pouvons exposer un sélecteur dans l’application, mais le système d’exploitation décide toujours de l’autorisation réelle.

- iOS/macOS peuvent exposer **Lors de l’utilisation** ou **Toujours** dans les invites système/Paramètres.
- L’application Android prend actuellement uniquement en charge la localisation au premier plan.
- La localisation précise est une autorisation séparée (iOS 14+ « Precise », Android « fine » vs « coarse »).

Le sélecteur dans l’interface utilisateur pilote le mode que nous demandons ; l’autorisation réelle se trouve dans les paramètres du système d’exploitation.

## Modèle de paramètres

Par appareil de nœud :

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Comportement de l’interface utilisateur :

- Sélectionner `whileUsing` demande l’autorisation au premier plan.
- Si le système d’exploitation refuse le niveau demandé, revenir au niveau le plus élevé accordé et afficher l’état.

## Correspondance des autorisations (node.permissions)

Facultatif. Le nœud macOS signale `location` via la carte des autorisations ; iOS/Android peuvent l’omettre.

## Commande : `location.get`

Appelée via `node.invoke`.

Paramètres (suggérés) :

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Charge utile de réponse :

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Erreurs (codes stables) :

- `LOCATION_DISABLED` : le sélecteur est désactivé.
- `LOCATION_PERMISSION_REQUIRED` : autorisation manquante pour le mode demandé.
- `LOCATION_BACKGROUND_UNAVAILABLE` : l’application est en arrière-plan, mais seul Lors de l’utilisation est autorisé.
- `LOCATION_TIMEOUT` : aucune position obtenue à temps.
- `LOCATION_UNAVAILABLE` : défaillance système / aucun fournisseur.

## Comportement en arrière-plan

- L’application Android refuse `location.get` lorsqu’elle est en arrière-plan.
- Gardez OpenClaw ouvert lors de la demande de localisation sur Android.
- Les autres plateformes de nœud peuvent différer.

## Intégration modèle/outillage

- Surface d’outil : l’outil `nodes` ajoute l’action `location_get` (nœud requis).
- CLI : `openclaw nodes location get --node <id>`.
- Directives pour les agents : appeler uniquement lorsque l’utilisateur a activé la localisation et comprend la portée.

## Texte UX (suggéré)

- Désactivé : « Le partage de localisation est désactivé. »
- Lors de l’utilisation : « Uniquement quand OpenClaw est ouvert. »
- Précise : « Utiliser la localisation GPS précise. Désactivez cette option pour partager une localisation approximative. »

## Associé

- [Analyse de la localisation du canal](/fr/channels/location)
- [Capture de la caméra](/fr/nodes/camera)
- [Mode conversation](/fr/nodes/talk)
