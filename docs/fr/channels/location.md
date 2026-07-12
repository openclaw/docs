---
read_when:
    - Ajout ou modification de l’analyse de l’emplacement du canal
    - Utilisation des champs de contexte de localisation dans les prompts ou les outils de l’agent
summary: Analyse de la localisation des canaux et charges utiles de localisation sortantes portables
title: Analyse de l’emplacement du canal
x-i18n:
    generated_at: "2026-07-12T15:02:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw normalise les emplacements partagés provenant des canaux de discussion en :

- un texte concis contenant les coordonnées, ajouté au corps du message entrant ; et
- des champs structurés dans la charge utile de contexte de réponse automatique. Les libellés, adresses et légendes/commentaires fournis par le canal sont intégrés à l’invite par le bloc JSON partagé de métadonnées non fiables, et non directement dans le corps du message utilisateur.

Actuellement pris en charge :

- **LINE** (messages de localisation avec titre/adresse)
- **Matrix** (`m.location` avec `geo_uri`)
- **Telegram** (repères de localisation, lieux et localisations en direct)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)

## Mise en forme du texte

Les emplacements sont affichés sous forme de lignes lisibles sans crochets. Les coordonnées utilisent six décimales ; la précision est arrondie au mètre entier :

- Repère :
  - `📍 48.858844, 2.294351 ±12m`
- Lieu nommé (sur la même ligne ; le nom et l’adresse figurent uniquement dans le bloc de métadonnées) :
  - `📍 48.858844, 2.294351 ±12m`
- Partage en direct :
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

Si le canal inclut un libellé, une adresse ou une légende/un commentaire, cet élément est conservé dans la charge utile de contexte et apparaît dans l’invite sous forme de JSON non fiable délimité (les champs sont omis lorsqu’ils sont absents) :

````text
Localisation (métadonnées non fiables) :
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Tour Eiffel",
  "address": "Champ de Mars, Paris",
  "caption": "Retrouvez-nous ici"
}
```
````

## Champs de contexte

Lorsqu’un emplacement est présent, les champs suivants sont ajoutés à `ctx` :

- `LocationLat` (nombre)
- `LocationLon` (nombre)
- `LocationAccuracy` (nombre, en mètres ; facultatif)
- `LocationName` (chaîne ; facultatif)
- `LocationAddress` (chaîne ; facultatif)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booléen)
- `LocationCaption` (chaîne ; facultatif)

Lorsque le canal ne définit pas de source explicite, OpenClaw la déduit : les partages en direct deviennent `live`, les emplacements comportant un nom ou une adresse deviennent `place`, et tous les autres deviennent `pin`.

Le moteur de rendu de l’invite traite `LocationName`, `LocationAddress` et `LocationCaption` comme des métadonnées non fiables et les sérialise via le même chemin JSON à taille limitée que celui utilisé pour les autres éléments de contexte du canal.

## Charges utiles sortantes

L’outil de messagerie et le SDK de Plugin utilisent la même structure `NormalizedLocation` pour les emplacements sortants portables. Une charge utile contenant uniquement des coordonnées représente un repère. Les canaux prenant en charge nativement les lieux peuvent convertir `name` et `address` en une fiche de lieu.

Telegram expose actuellement cette fonctionnalité par l’intermédiaire de `message(action="send")`. Sa première implémentation est volontairement autonome : les charges utiles de localisation ne peuvent pas être combinées avec du texte ou des médias, et les paires de données de lieu incomplètes provoquent un échec au lieu d’ignorer silencieusement un nom ou une adresse. Les canaux non pris en charge n’annoncent pas le paramètre de localisation.

## Remarques sur les canaux

- **LINE** : les propriétés `title`/`address` du message de localisation correspondent à `LocationName`/`LocationAddress` ; aucune localisation en direct.
- **Matrix** : `geo_uri` est analysé comme un emplacement de type repère ; le paramètre `u` (incertitude) correspond à `LocationAccuracy`, le corps de l’événement renseigne `LocationCaption`, l’altitude est ignorée et `LocationIsLive` est toujours faux.
- **Telegram** : les lieux correspondent à `LocationName`/`LocationAddress` ; les localisations en direct sont détectées via `live_period`.
- **WhatsApp** : `locationMessage.comment` et `liveLocationMessage.caption` renseignent `LocationCaption`.

## Pages connexes

- [Commande de localisation (nœuds)](/fr/nodes/location-command)
- [Capture avec la caméra](/fr/nodes/camera)
- [Compréhension des médias](/fr/nodes/media-understanding)
