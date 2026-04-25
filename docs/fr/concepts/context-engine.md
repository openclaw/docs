---
read_when:
    - Vous voulez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous passez du moteur historique à un moteur Plugin
    - Vous créez un Plugin de moteur de contexte
summary: 'Moteur de contexte : assemblage de contexte extensible, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-04-25T13:45:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1dc4a6f0a9fb669893a6a877924562d05168fde79b3c41df335d697e651d534d
    source_path: concepts/context-engine.md
    workflow: 15
---

Un **moteur de contexte** contrôle la manière dont OpenClaw construit le contexte du modèle pour chaque exécution :
quels messages inclure, comment résumer l’historique plus ancien, et comment gérer
le contexte au-delà des limites des sous-agents.

OpenClaw fournit un moteur intégré `legacy` et l’utilise par défaut — la plupart des
utilisateurs n’ont jamais besoin de le changer. Installez et sélectionnez un moteur Plugin uniquement lorsque
vous voulez un comportement différent pour l’assemblage, la Compaction ou le rappel inter-session.

## Démarrage rapide

Vérifiez quel moteur est actif :

```bash
openclaw doctor
# ou inspectez directement la config :
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Installer un Plugin de moteur de contexte

Les Plugins de moteur de contexte s’installent comme n’importe quel autre Plugin OpenClaw. Installez-le
d’abord, puis sélectionnez le moteur dans l’emplacement :

```bash
# Installation depuis npm
openclaw plugins install @martian-engineering/lossless-claw

# Ou installation depuis un chemin local (pour le développement)
openclaw plugins install -l ./my-context-engine
```

Ensuite, activez le Plugin et sélectionnez-le comme moteur actif dans votre config :

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // doit correspondre à l’id de moteur enregistré par le Plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // La config spécifique au Plugin va ici (voir la documentation du Plugin)
      },
    },
  },
}
```

Redémarrez la Gateway après l’installation et la configuration.

Pour revenir au moteur intégré, définissez `contextEngine` sur `"legacy"` (ou
supprimez complètement la clé — `"legacy"` est la valeur par défaut).

## Fonctionnement

Chaque fois qu’OpenClaw exécute une invite de modèle, le moteur de contexte intervient à
quatre points du cycle de vie :

1. **Ingest** — appelé lorsqu’un nouveau message est ajouté à la session. Le moteur
   peut stocker ou indexer le message dans son propre magasin de données.
2. **Assemble** — appelé avant chaque exécution de modèle. Le moteur renvoie un ensemble
   ordonné de messages (et un éventuel `systemPromptAddition`) qui tient dans
   le budget de jetons.
3. **Compact** — appelé lorsque la fenêtre de contexte est pleine, ou lorsque l’utilisateur exécute
   `/compact`. Le moteur résume l’historique plus ancien pour libérer de l’espace.
4. **After turn** — appelé après la fin d’une exécution. Le moteur peut persister l’état,
   déclencher une Compaction en arrière-plan ou mettre à jour les index.

Pour le harnais Codex intégré non ACP, OpenClaw applique le même cycle de vie en
projetant le contexte assemblé dans les instructions développeur de Codex et l’invite
du tour en cours. Codex conserve toujours son historique de fil natif et son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

- **prepareSubagentSpawn** — prépare un état de contexte partagé avant qu’une exécution enfant
  ne commence. Le hook reçoit les clés de session parent/enfant, `contextMode`
  (`isolated` ou `fork`), les ids/fichiers de transcription disponibles, et un TTL facultatif.
  S’il renvoie un handle de restauration, OpenClaw l’appelle lorsque la création échoue après
  que la préparation a réussi.
- **onSubagentEnded** — nettoie lorsqu’une session de sous-agent se termine ou est purgée.

### Ajout à l’invite système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw
l’ajoute au début de l’invite système pour l’exécution. Cela permet aux moteurs d’injecter
des consignes dynamiques de rappel, des instructions de récupération, ou des indications
sensibles au contexte sans nécessiter de fichiers statiques dans l’espace de travail.

## Le moteur legacy

Le moteur intégré `legacy` préserve le comportement d’origine d’OpenClaw :

- **Ingest** : no-op (le gestionnaire de session gère directement la persistance des messages).
- **Assemble** : passage direct (le pipeline existant sanitize → validate → limit
  du runtime gère l’assemblage du contexte).
- **Compact** : délègue à la Compaction intégrée par résumé, qui crée
  un résumé unique des anciens messages et conserve intacts les messages récents.
- **After turn** : no-op.

Le moteur legacy n’enregistre pas d’outils et ne fournit pas de `systemPromptAddition`.

Lorsque `plugins.slots.contextEngine` n’est pas défini (ou vaut `"legacy"`), ce
moteur est utilisé automatiquement.

## Moteurs Plugin

Un Plugin peut enregistrer un moteur de contexte à l’aide de l’API Plugin :

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Stockez le message dans votre magasin de données
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Renvoyez les messages qui tiennent dans le budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Résumez le contexte plus ancien
      return { ok: true, compacted: true };
    },
  }));
}
```

Ensuite, activez-le dans la config :

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### L’interface ContextEngine

Membres requis :

| Membre             | Type     | But                                                      |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Propriété | Id, nom, version du moteur, et s’il possède la Compaction |
| `ingest(params)`   | Méthode   | Stocker un seul message                                  |
| `assemble(params)` | Méthode   | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode   | Résumer/réduire le contexte                              |

`assemble` renvoie un `AssembleResult` avec :

- `messages` — les messages ordonnés à envoyer au modèle.
- `estimatedTokens` (obligatoire, `number`) — l’estimation par le moteur du total
  de jetons dans le contexte assemblé. OpenClaw l’utilise pour les décisions de seuil de Compaction
  et les rapports de diagnostic.
- `systemPromptAddition` (facultatif, `string`) — ajouté au début de l’invite système.

Membres facultatifs :

| Membre                         | Type   | But                                                                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelé une fois lorsque le moteur voit une session pour la première fois (par ex. importer l’historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé comme lot. Appelé après la fin d’une exécution, avec tous les messages de ce tour d’un coup. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie après exécution (persister l’état, déclencher une Compaction en arrière-plan). |
| `prepareSubagentSpawn(params)` | Méthode | Mettre en place un état partagé pour une session enfant avant son démarrage. |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d’un sous-agent. |
| `dispose()`                    | Méthode | Libérer les ressources. Appelé pendant l’arrêt de la Gateway ou le rechargement du Plugin — pas par session. |

### ownsCompaction

`ownsCompaction` contrôle si l’auto-Compaction intégrée en cours de tentative de Pi reste
activée pour l’exécution :

- `true` — le moteur possède le comportement de Compaction. OpenClaw désactive l’auto-Compaction intégrée de Pi
  pour cette exécution, et l’implémentation `compact()` du moteur est responsable de `/compact`, de la Compaction de récupération en cas de dépassement, et de toute
  Compaction proactive qu’il souhaite faire dans `afterTurn()`. OpenClaw peut toujours exécuter la
  protection anti-dépassement avant l’invite ; lorsqu’il prédit que la transcription complète
  dépassera la limite, le chemin de récupération appelle `compact()` du moteur actif avant
  d’envoyer une nouvelle invite.
- `false` ou non défini — l’auto-Compaction intégrée de Pi peut toujours s’exécuter pendant
  l’exécution de l’invite, mais la méthode `compact()` du moteur actif est toujours appelée pour
  `/compact` et la récupération après dépassement.

`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement
au chemin de Compaction du moteur legacy.

Cela signifie qu’il existe deux modèles Plugin valides :

- **Mode propriétaire** — implémentez votre propre algorithme de Compaction et définissez
  `ownsCompaction: true`.
- **Mode délégué** — définissez `ownsCompaction: false` et faites appeler par `compact()`
  `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser
  le comportement de Compaction intégré d’OpenClaw.

Un `compact()` no-op est dangereux pour un moteur actif non propriétaire, car il
désactive le chemin normal de Compaction `/compact` et de récupération après dépassement pour cet
emplacement de moteur.

## Référence de configuration

```json5
{
  plugins: {
    slots: {
      // Sélectionne le moteur de contexte actif. Par défaut : "legacy".
      // Définissez un id de Plugin pour utiliser un moteur Plugin.
      contextEngine: "legacy",
    },
  },
}
```

L’emplacement est exclusif à l’exécution — un seul moteur de contexte enregistré est
résolu pour une exécution ou une opération de Compaction donnée. Les autres
Plugins `kind: "context-engine"` activés peuvent toujours se charger et exécuter leur code
d’enregistrement ; `plugins.slots.contextEngine` ne sélectionne que l’id de moteur enregistré
qu’OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.

## Relation avec la Compaction et la mémoire

- **Compaction** est l’une des responsabilités du moteur de contexte. Le moteur legacy
  délègue au résumé intégré d’OpenClaw. Les moteurs Plugin peuvent implémenter
  n’importe quelle stratégie de Compaction (résumés DAG, récupération vectorielle, etc.).
- **Plugins de mémoire** (`plugins.slots.memory`) sont distincts des moteurs de contexte.
  Les Plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que le
  modèle voit. Ils peuvent fonctionner ensemble — un moteur de contexte peut utiliser les données d’un
  Plugin de mémoire pendant l’assemblage. Les moteurs Plugin qui veulent le chemin d’invite de Active Memory
  doivent préférer `buildMemorySystemPromptAddition(...)` depuis
  `openclaw/plugin-sdk/core`, qui convertit les sections d’invite Active Memory actives
  en un `systemPromptAddition` prêt à être préfixé. Si un moteur a besoin d’un contrôle de plus bas niveau,
  il peut toujours extraire les lignes brutes depuis
  `openclaw/plugin-sdk/memory-host-core` via
  `buildActiveMemoryPromptSection(...)`.
- **Élagage de session** (suppression en mémoire des anciens résultats d’outils) continue de s’exécuter
  quel que soit le moteur de contexte actif.

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes continuent avec leur historique actuel.
  Le nouveau moteur prend le relais pour les exécutions futures.
- Les erreurs de moteur sont journalisées et exposées dans les diagnostics. Si un moteur Plugin
  n’arrive pas à s’enregistrer ou si l’id de moteur sélectionné ne peut pas être résolu, OpenClaw
  ne revient pas automatiquement en arrière ; les exécutions échouent jusqu’à ce que vous corrigiez le Plugin ou
  que vous remettiez `plugins.slots.contextEngine` à `"legacy"`.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` pour lier un
  répertoire de Plugin local sans le copier.

Voir aussi : [Compaction](/fr/concepts/compaction), [Contexte](/fr/concepts/context),
[Plugins](/fr/tools/plugin), [Manifeste Plugin](/fr/plugins/manifest).

## Lié

- [Contexte](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Architecture des Plugins](/fr/plugins/architecture) — enregistrement de Plugins de moteur de contexte
- [Compaction](/fr/concepts/compaction) — résumé des longues conversations
