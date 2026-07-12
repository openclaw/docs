---
read_when:
    - Ajout de la prise en charge du nœud de localisation ou d’une interface de gestion des autorisations
    - Conception des autorisations de localisation ou du comportement au premier plan sur Android
summary: Commande de localisation pour les Nodes (location.get), modes d’autorisation et comportement au premier plan sur Android
title: Commande de localisation
x-i18n:
    generated_at: "2026-07-12T15:28:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` est une commande de nœud, appelée via `node.invoke` ou `openclaw nodes location get`.
- Désactivée par défaut.
- Les versions Android tierces utilisent un sélecteur : Désactivé / Pendant l’utilisation / Toujours. Les versions Play restent limitées à Désactivé / Pendant l’utilisation.
- La localisation précise dispose d’un bouton distinct.

## Pourquoi un sélecteur (et pas un simple interrupteur)

Les autorisations de localisation du système d’exploitation comportent plusieurs niveaux. La localisation précise est également une autorisation distincte du système d’exploitation (« Precise » à partir d’iOS 14, « fine » ou « coarse » sous Android). Le sélecteur intégré à l’application détermine le mode demandé, mais le système d’exploitation décide toujours de l’autorisation réellement accordée.

## Modèle de paramètres

Pour chaque appareil de nœud :

- `location.enabledMode` : `off | whileUsing | always`
- `location.preciseEnabled` : bool

Comportement de l’interface utilisateur :

- La sélection de `whileUsing` demande l’autorisation d’accès au premier plan.
- La sélection de `always` dans la version Android tierce demande d’abord l’autorisation d’accès au premier plan, explique l’accès en arrière-plan, puis ouvre les paramètres Android de l’application afin d’obtenir l’autorisation distincte **Allow all the time**.
- Les versions Android Play ne déclarent pas l’autorisation de localisation en arrière-plan et n’affichent pas `always`.
- Si le système d’exploitation refuse le niveau demandé, l’application revient au niveau accordé le plus élevé et affiche l’état.

## Correspondance des autorisations (node.permissions)

Facultative. Le nœud macOS indique `location` dans la map `permissions` de `node.list`/`node.describe` ; iOS et Android peuvent l’omettre.

## Commande : `location.get`

Appelée via `node.invoke` ou avec l’assistant CLI :

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Paramètres :

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Les options de la CLI correspondent directement aux paramètres : `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Charge utile de la réponse :

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
- `LOCATION_PERMISSION_REQUIRED` : l’autorisation requise pour le mode demandé est manquante.
- `LOCATION_BACKGROUND_UNAVAILABLE` : l’application est en arrière-plan, mais seule l’autorisation Pendant l’utilisation est accordée.
- `LOCATION_TIMEOUT` : aucune position obtenue dans le délai imparti.
- `LOCATION_UNAVAILABLE` : défaillance du système ou absence de fournisseurs.

## Comportement en arrière-plan

- Les versions Android tierces acceptent `location.get` en arrière-plan uniquement si l’utilisateur a sélectionné `Always` et si Android a accordé l’accès à la localisation en arrière-plan. Le service de nœud persistant existant ajoute le type de service `location` et affiche `Location: Always` lorsqu’il est actif.
- Les versions Android Play et le mode `While Using` refusent `location.get` lorsque l’application est en arrière-plan.
- Les autres plateformes de nœuds peuvent se comporter différemment.

## Intégration au modèle et aux outils

- Outil de l’agent : l’action `location_get` de l’outil `nodes` (nœud requis).
- CLI : `openclaw nodes location get --node <id>`.
- Directives pour l’agent : appeler cette action uniquement lorsque l’utilisateur a activé la localisation et comprend sa portée.

## Texte de l’interface utilisateur (suggestion)

- Désactivé : « Le partage de la localisation est désactivé. »
- Pendant l’utilisation : « Uniquement lorsque OpenClaw est ouvert. »
- Toujours : « Autoriser les vérifications de localisation demandées lorsque OpenClaw est en arrière-plan. »
- Précise : « Utilisez la localisation GPS précise. Désactivez cette option pour partager une localisation approximative. »

## Pages connexes

- [Présentation des nœuds](/fr/nodes)
- [Analyse de la localisation des canaux](/fr/channels/location)
- [Capture avec la caméra](/fr/nodes/camera)
- [Mode conversation](/fr/nodes/talk)
