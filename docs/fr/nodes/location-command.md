---
read_when:
    - Ajout de la prise en charge des nœuds de localisation ou d’une interface utilisateur pour les autorisations
    - Conception des autorisations de localisation ou du comportement au premier plan sur Android
summary: Commande de localisation pour les Nodes, modes d’autorisation de la plateforme et configuration de GeoClue sous Linux
title: Commande de localisation
x-i18n:
    generated_at: "2026-07-16T13:29:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` est une commande de Node, appelée via `node.invoke` ou `openclaw nodes location get`.
- Désactivée par défaut.
- Les versions Android tierces utilisent un sélecteur : Désactivé / Lors de l’utilisation / Toujours. Les versions Play restent limitées à Désactivé / Lors de l’utilisation.
- La localisation précise dispose d’un bouton distinct.

## Pourquoi un sélecteur (et pas simplement un interrupteur)

Les autorisations de localisation du système d’exploitation comportent plusieurs niveaux. La localisation précise est également une autorisation distincte du système d’exploitation (« Précise » à partir d’iOS 14, « fine » ou « approximative » sur Android). Le sélecteur intégré à l’application détermine le mode demandé, mais le système d’exploitation décide toujours de l’autorisation réellement accordée.

## Modèle de paramètres

Pour chaque appareil Node :

- `location.enabledMode` : `off | whileUsing | always`
- `location.preciseEnabled` : booléen

Comportement de l’interface utilisateur :

- La sélection de `whileUsing` demande l’autorisation au premier plan.
- Dans la version Android tierce, la sélection de `always` demande d’abord l’autorisation au premier plan, explique l’accès en arrière-plan, puis ouvre les paramètres de l’application Android afin d’accorder séparément l’autorisation **Allow all the time**.
- Les versions Android Play ne déclarent pas l’autorisation de localisation en arrière-plan et n’affichent pas `always`.
- Si le système d’exploitation refuse le niveau demandé, l’application revient au niveau accordé le plus élevé et affiche l’état.

## Correspondance des autorisations (node.permissions)

Facultatif. Le Node macOS indique `location` via la table `permissions` sur `node.list`/`node.describe` ; iOS et Android peuvent l’omettre.

## Commande : `location.get`

Appelée via `node.invoke` ou l’utilitaire CLI :

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

Les options CLI correspondent directement : `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_BACKGROUND_UNAVAILABLE` : l’application est en arrière-plan, mais seule l’autorisation Lors de l’utilisation est accordée.
- `LOCATION_TIMEOUT` : aucune position obtenue dans le délai imparti.
- `LOCATION_UNAVAILABLE` : défaillance du système ou absence de fournisseurs.

## Comportement en arrière-plan

- Les versions Android tierces acceptent `location.get` en arrière-plan uniquement lorsque la personne utilisatrice a sélectionné `Always` et qu’Android a accordé l’accès à la localisation en arrière-plan. Le service Node persistant existant ajoute le type de service `location` et affiche `Location: Always` lorsqu’il est actif.
- Les versions Android Play et le mode `While Using` refusent `location.get` lorsque l’application est en arrière-plan.
- Le comportement peut différer sur les autres plateformes Node.

## Hôte Node Linux

Le Plugin Node Linux intégré ajoute `location.get` au service CLI `openclaw node`, y compris sur les hôtes sans interface graphique qui ne disposent pas de l’application de bureau Linux. La localisation est désactivée par défaut. Activez-la dans l’entrée du Plugin, puis redémarrez le service Node :

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Installez GeoClue2 et sa démonstration `where-am-i` (`geoclue-2-demo` sous Debian et Ubuntu). L’utilisateur du service Node doit être autorisé par la politique GeoClue et l’agent d’autorisation de l’hôte.

Le Plugin utilise `where-am-i` au lieu d’une suite d’appels `busctl`. GeoClue associe la création du client, les propriétés, le démarrage, les mises à jour et l’arrêt à une même connexion client D-Bus ; la démonstration conserve ce cycle de vie au sein d’une même connexion, contrairement à des sous-processus `busctl` distincts. Aucune dépendance npm n’est ajoutée.

Linux associe `coarse`, `balanced` et `precise` aux niveaux de précision GeoClue `4`, `6` et `8`. Il valide `maxAgeMs` par rapport à l’horodatage renvoyé. La démonstration de GeoClue n’indique pas le fournisseur sélectionné ; `source` vaut donc `unknown`. `isPrecise` vaut vrai uniquement lorsque la précision indiquée est de 100 mètres ou moins.

Linux utilise les mêmes erreurs stables : `LOCATION_DISABLED`, `LOCATION_TIMEOUT` et `LOCATION_UNAVAILABLE`.

## Intégration au modèle et aux outils

- Outil de l’agent : l’action `location_get` de l’outil `nodes` (Node requis).
- CLI : `openclaw nodes location get --node <id>`.
- Consignes pour l’agent : effectuer l’appel uniquement lorsque la personne utilisatrice a activé la localisation et en comprend la portée.

## Texte de l’interface (suggestion)

- Désactivé : « Le partage de la localisation est désactivé. »
- Lors de l’utilisation : « Uniquement lorsque OpenClaw est ouvert. »
- Toujours : « Autoriser les vérifications de localisation demandées lorsque OpenClaw est en arrière-plan. »
- Précise : « Utiliser la localisation GPS précise. Désactivez cette option pour partager une localisation approximative. »

## Pages connexes

- [Présentation des Nodes](/fr/nodes)
- [Analyse de la localisation des canaux](/fr/channels/location)
- [Capture par la caméra](/fr/nodes/camera)
- [Mode conversation](/fr/nodes/talk)
