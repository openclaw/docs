---
read_when:
    - Vous souhaitez une chronologie de votre journée à la manière de Dayflow dans l’interface de contrôle
    - Vous activez ou configurez le plugin Logbook inclus.
    - Vous souhaitez des résumés de réunion quotidienne ou un rappel de la journée fondés sur l’activité à l’écran
summary: Journal de travail automatique facultatif créé à partir de captures d’écran périodiques
title: Plugin de journal de bord
x-i18n:
    generated_at: "2026-07-12T15:39:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Le plugin Logbook transforme l’activité à l’écran en journal de travail automatique. Il
capture périodiquement des instantanés d’écran depuis un Node appairé, les résume sous
forme d’observations horodatées et crée des cartes chronologiques dans la
[Control UI](/fr/web/control-ui). Il peut également générer des notes de réunion quotidienne et
répondre à des questions sur une journée suivie.

L’état détenu par OpenClaw reste sur le Gateway sous `<state-dir>/logbook/`, mais
le traitement par les modèles n’est pas nécessairement local. Les captures d’écran échantillonnées sont envoyées à la
route de vision configurée ; les observations et le texte de la chronologie sont envoyés au modèle
d’agent par défaut. Utilisez des routes de modèles locales pour les deux étapes si le contenu de l’écran et
le texte d’activité dérivé doivent rester sur la machine.

Logbook est inclus et désactivé par défaut. L’activation du plugin autorise le
Gateway à effectuer des captures d’écran, car `captureEnabled` vaut `true` par défaut.

## Avant de commencer

Vous avez besoin des éléments suivants :

- Un Node connecté qui expose `screen.snapshot` ou `logbook.snapshot`. Le
  Node de l’application macOS nécessite l’autorisation Screen Recording. Un hôte de Node macOS sans interface graphique
  (`openclaw node host run`) obtient la commande `logbook.snapshot` fournie par le plugin,
  qui s’appuie sur l’outil système `screencapture`.
- Le plugin Codex inclus, activé et authentifié. Codex fournit actuellement
  le contrat d’extraction structurée d’images requis par Logbook. Connectez-vous avec
  `openclaw models auth login --provider openai` ; consultez
  [l’environnement d’exécution Codex](/fr/plugins/codex-harness) pour les autres méthodes d’authentification.
- Un modèle d’agent par défaut fonctionnel. Logbook l’utilise pour synthétiser les cartes, les notes de
  réunion quotidienne et les questions-réponses sur une journée après l’étape de vision.

## Démarrage rapide

Activez les plugins Codex et Logbook :

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configurez explicitement un modèle de vision pour garantir un démarrage déterministe :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Si vous utilisez `plugins.allow`, incluez `codex` et `logbook`. Redémarrez le
Gateway après avoir modifié la configuration des plugins, puis inspectez les enregistrements
et ouvrez le tableau de bord :

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

La description du Node doit inclure `screen.snapshot` ou `logbook.snapshot`.
Les Nodes sans interface graphique n’annoncent `logbook.snapshot` qu’après l’activation du plugin.
Consultez le [dépannage des Nodes](/fr/nodes/troubleshooting) si la commande est absente.

L’onglet Logbook apparaît uniquement si le plugin est activé et si la session de la
Control UI dispose de `operator.write`. La ligne d’état doit afficher **Capture en cours** sans erreur.
Une carte chronologique apparaît à la fermeture de la fenêtre d’analyse, ou vous pouvez sélectionner
**Analyser maintenant** après la capture d’une activité.

## Fonctionnement

1. **Capture** : toutes les `captureIntervalSeconds` (30s par défaut), Logbook appelle
   la commande de capture du Node sélectionné et stocke une image JPEG redimensionnée.
   Les images consécutives identiques sont marquées comme inactives et exclues de l’analyse.
2. **Observation** : une fois qu’une fenêtre d’analyse (15 minutes par défaut) s’est écoulée, le
   plugin échantillonne jusqu’à 16 images actives et les envoie au modèle de vision,
   qui renvoie des observations d’activité horodatées (« VS Code : modification de
   store.ts, correction d’une erreur de type »). Une interruption de capture supérieure à deux minutes ou
   le passage de minuit local ferme également la fenêtre actuelle.
3. **Synthèse** : les observations, ainsi que les cartes existantes des 45 dernières minutes, sont
   remaniées en cartes chronologiques (de 10 à 60 minutes chacune) comprenant un titre, un résumé,
   une catégorie, l’application principale et les éventuelles distractions brèves.
4. **Nettoyage** : les images antérieures à `retentionDays` (14 par défaut) sont supprimées.
   Les cartes, les observations et les réunions quotidiennes mises en cache sont conservées.

Les limites de journée et les horloges de la chronologie utilisent le fuseau horaire local du Gateway, et non celui du
navigateur. Les images et la base de données SQLite de la chronologie se trouvent sous
`<state-dir>/logbook/`.

## Flux des modèles et des données

Logbook utilise deux routes de modèles distinctes :

| Étape                         | Données envoyées                                                   | Route du modèle                                                         |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Observation                   | Jusqu’à 16 images JPEG échantillonnées avec leurs heures de capture | `visionModel`, ou une entrée Codex `tools.media` compatible empruntée    |
| Synthèse des cartes           | Observations horodatées et cartes chronologiques récentes          | Modèle d’agent par défaut via l’environnement d’exécution LLM du plugin  |
| Génération de la réunion quotidienne | Cartes du jour sélectionné et du jour précédent                     | Modèle d’agent par défaut via l’environnement d’exécution LLM du plugin  |
| Interrogation de votre journée | Question, cartes du jour sélectionné et observations récentes      | Modèle d’agent par défaut via l’environnement d’exécution LLM du plugin  |

La base de données SQLite complète n’est envoyée à aucun des deux modèles. Les captures d’écran brutes sont uniquement envoyées
à l’étape d’observation ; la synthèse des cartes, la réunion quotidienne et les questions-réponses reçoivent du
texte dérivé.

## Configuration

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Toutes les clés de configuration de Logbook sont facultatives. Les valeurs numériques sont arrondies à des nombres entiers
et limitées à la plage prise en charge.

| Clé                       | Valeur par défaut | Plage ou valeurs          | Comportement                                                                                              |
| ------------------------- | ----------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`            | booléen                   | Interrupteur principal persistant pour les nouveaux instantanés ; la chronologie reste disponible avec `false` |
| `captureIntervalSeconds`  | `30`              | `5`-`600`                 | Délai entre les tentatives de capture                                                                     |
| `analysisIntervalMinutes` | `15`              | `3`-`120`                 | Fenêtre d’observation cible ; les interruptions et minuit peuvent la fermer plus tôt                       |
| `nodeId`                  | non défini        | identifiant ou nom d’affichage du Node | Fixe la capture à un Node connecté ; la correspondance ne tient pas compte de la casse          |
| `screenIndex`             | `0`               | `0`-`16`                  | Index d’écran commençant à zéro                                                                           |
| `maxWidth`                | `1440`            | `480`-`3840`              | Limite de taille de capture demandée ; macOS sans interface graphique l’applique à la plus grande dimension |
| `visionModel`             | non défini        | `provider/model`          | Route structurée explicite ; les références incorrectes suspendent l’analyse, les fournisseurs non pris en charge font échouer les lots |
| `retentionDays`           | `14`              | `1`-`365`                 | Supprime les anciennes images ; les cartes, observations et réunions quotidiennes sont conservées         |

Sans `nodeId`, Logbook privilégie un Node d’application connecté exposant
`screen.snapshot`, puis se rabat sur un Node sans interface graphique exposant
`logbook.snapshot`. Dans une configuration non fixée, un Node en échec passe derrière les autres
Nodes admissibles. Le bouton de pause du tableau de bord s’applique uniquement à la session et se réinitialise lorsque le
Gateway redémarre ; utilisez `captureEnabled: false` pour un arrêt persistant.

### Sélection du modèle de vision

Logbook résout le modèle d’observation dans l’ordre suivant :

1. `plugins.entries.logbook.config.visionModel`
2. la première entrée Codex compatible avec les images sous `tools.media.image.models`
3. la première entrée Codex compatible avec les images sous `tools.media.models`

Les autres fournisseurs multimédias sont ignorés, car ils n’exposent actuellement pas le
contrat d’extraction structurée requis par Logbook. Définir
`tools.media.image.enabled: false` désactive les valeurs multimédias par défaut empruntées, mais un
`visionModel` Logbook explicite reste applicable.

## Onglet du tableau de bord

- **Chronologie** : cartes extensibles par activité avec des couleurs de catégorie, l’application
  principale, des pastilles de distraction et une image clé.
- **La journée en un coup d’œil** : ratio de concentration, répartition par catégorie, applications principales.
- **Réunion quotidienne** : transforme hier et aujourd’hui en compte rendu prêt à être collé.
- **Interroger votre journée** : questions en langage naturel auxquelles la chronologie suivie
  permet de répondre (« quand ai-je relu la PR du Gateway ? »).
- **Analyser maintenant** : ferme immédiatement la fenêtre de capture actuelle au lieu
  d’attendre l’intervalle d’analyse.

## Méthodes du Gateway

Logbook enregistre les méthodes RPC du Gateway suivantes :

| Méthode               | Paramètres               | Portée           | Résultat                                                                                   |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------------------ |
| `logbook.status`      | aucun                    | `operator.read`  | État de la capture, de l’analyse, du modèle, du Node, du jour du Gateway et de son fuseau horaire |
| `logbook.days`        | aucun                    | `operator.read`  | Jours avec le nombre de cartes chronologiques et les limites temporelles des cartes        |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Cartes dérivées et statistiques du jour ; utilise par défaut le jour actuel du Gateway     |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Métadonnées des images dans la plage demandée en millisecondes depuis l’époque              |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Une image JPEG brute encodée en base64                                                      |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Texte de réunion quotidienne mis en cache ou régénéré pour une journée                     |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Réponse fondée sur la chronologie pour une journée                                          |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | État de pause limité à la session et état mis à jour                                        |
| `logbook.analyze.now` | aucun                    | `operator.write` | Lance l’analyse en attente ou renvoie la raison pour laquelle elle n’a pas pu démarrer      |

Les méthodes de lecture renvoient l’état opérationnel ou du texte dérivé. Les pixels bruts des captures d’écran,
les actions entraînant des dépenses de modèle et les mutations de l’environnement d’exécution nécessitent
`operator.write`. L’onglet de la Control UI nécessite également `operator.write`, car il
expose ces actions et les aperçus des images brutes ; un client en lecture seule peut toujours appeler
directement les méthodes de texte dérivé.

## Remarques sur la confidentialité

- Les instantanés peuvent contenir tout ce qui apparaît à l’écran, y compris des secrets. Les images ne
  quittent jamais la machine, sauf en tant qu’entrées échantillonnées envoyées au modèle
  d’observation configuré.
- Les observations, les cartes récentes et les questions peuvent quitter la machine via le
  modèle d’agent par défaut lors de la synthèse des cartes, de la génération de la réunion quotidienne ou des questions-réponses. Appliquez
  la politique de traitement des données du fournisseur aux deux routes de modèles.
- Utilisez des routes locales pour le modèle d’observation structurée et le modèle d’agent
  par défaut lorsque vous avez besoin d’un pipeline entièrement local.
- Les images, la base de données de la chronologie et les captures temporaires sont écrites avec des
  autorisations de fichiers réservées au propriétaire.
- Ajouter `screen.snapshot` à `gateway.nodes.denyCommands` constitue le
  coupe-circuit de la capture d’écran : cela bloque aussi bien la capture par le Node d’application que la commande
  `logbook.snapshot` propre à Logbook.
- Définir `tools.media.image.enabled: false` empêche également Logbook d’emprunter
  les modèles d’image multimédias pour l’analyse ; seul un `visionModel` explicite dans la
  configuration du plugin est alors utilisé.

## Dépannage

### L’onglet Logbook est absent

Vérifiez les trois conditions suivantes :

1. `openclaw plugins list --enabled` inclut `logbook`.
2. Le Gateway a redémarré après la modification du plugin ou de la liste d’autorisation.
3. La connexion à la Control UI dispose de `operator.write` ; les sessions en lecture seule ne
   reçoivent pas le descripteur d’onglet interactif.

Si `plugins.allow` est défini, il doit inclure à la fois `logbook` et `codex` pour la
configuration recommandée.

### La capture signale une erreur

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Vérifiez que le Node expose `screen.snapshot` ou `logbook.snapshot`.
- Accordez l’autorisation d’enregistrement de l’écran sur le Mac de capture.
- Si `nodeId` est configuré, vérifiez qu’il correspond à l’identifiant ou au nom d’affichage du Node.
- Vérifiez que `gateway.nodes.denyCommands` ne contient pas
  `screen.snapshot`.

Après trois échecs consécutifs, Logbook suspend les tentatives pendant dix cycles de capture, puis
réessaie. Une configuration sans Node épinglé peut basculer vers un autre Node éligible.

### Les captures réussissent, mais aucune carte n’apparaît

- Un état **Modèle manquant** signifie qu’aucune route de vision structurée compatible n’a été
  trouvée. Activez et authentifiez le Plugin Codex, ou définissez un
  `visionModel` explicite valide. Les images capturées restent en attente tant que le modèle est manquant et
  peuvent être analysées une fois la configuration corrigée.
- Attendez la durée définie par `analysisIntervalMinutes`, ou sélectionnez **Analyser maintenant** après la capture
  d’une activité.
- Les images identiques consécutives indiquent une inactivité et ne sont pas incluses dans les lots
  d’analyse. Modifiez le contenu visible à l’écran avant d’effectuer le test.
- Si le dernier lot affiche une erreur, corrigez le problème de modèle ou d’authentification, puis sélectionnez
  **Analyser maintenant**. Les lots ayant échoué ne sont relancés que par cette action explicite afin
  d’éviter des dépenses répétées liées au modèle.

## Voir aussi

- [Gérer les plugins](/fr/plugins/manage-plugins)
- [Harness Codex](/fr/plugins/codex-harness)
- [Compréhension des médias](/fr/nodes/media-understanding)
- [Nodes](/fr/nodes)
- [Dépannage des Nodes](/fr/nodes/troubleshooting)
- [Interface de contrôle](/fr/web/control-ui)
