---
read_when:
    - Vous voulez comprendre comment OpenClaw assemble le contexte du modèle
    - Vous basculez entre l’ancien moteur et un moteur Plugin.
    - Vous créez un Plugin de moteur de contexte
sidebarTitle: Context engine
summary: 'Moteur de contexte : assemblage de contexte enfichable, Compaction et cycle de vie des sous-agents'
title: Moteur de contexte
x-i18n:
    generated_at: "2026-04-30T07:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Un **moteur de contexte** contrôle la manière dont OpenClaw construit le contexte du modèle pour chaque exécution : quels messages inclure, comment résumer l’historique plus ancien et comment gérer le contexte au-delà des limites des sous-agents.

OpenClaw inclut un moteur `legacy` intégré et l’utilise par défaut — la plupart des utilisateurs n’ont jamais besoin de changer cela. Installez et sélectionnez un moteur Plugin uniquement lorsque vous souhaitez un comportement différent d’assemblage, de Compaction ou de rappel entre sessions.

## Démarrage rapide

<Steps>
  <Step title="Vérifier quel moteur est actif">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installer un moteur Plugin">
    Les Plugins de moteur de contexte s’installent comme n’importe quel autre Plugin OpenClaw.

    <Tabs>
      <Tab title="Depuis npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Depuis un chemin local">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Activer et sélectionner le moteur">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Redémarrez le Gateway après l’installation et la configuration.

  </Step>
  <Step title="Revenir à legacy (facultatif)">
    Définissez `contextEngine` sur `"legacy"` (ou supprimez entièrement la clé — `"legacy"` est la valeur par défaut).
  </Step>
</Steps>

## Fonctionnement

Chaque fois qu’OpenClaw exécute une invite de modèle, le moteur de contexte intervient à quatre points du cycle de vie :

<AccordionGroup>
  <Accordion title="1. Ingestion">
    Appelé lorsqu’un nouveau message est ajouté à la session. Le moteur peut stocker ou indexer le message dans son propre magasin de données.
  </Accordion>
  <Accordion title="2. Assemblage">
    Appelé avant chaque exécution du modèle. Le moteur renvoie un ensemble ordonné de messages (et un `systemPromptAddition` facultatif) qui respecte le budget de tokens.
  </Accordion>
  <Accordion title="3. Compactage">
    Appelé lorsque la fenêtre de contexte est pleine, ou lorsque l’utilisateur exécute `/compact`. Le moteur résume l’historique plus ancien afin de libérer de l’espace.
  </Accordion>
  <Accordion title="4. Après le tour">
    Appelé une fois une exécution terminée. Le moteur peut conserver l’état, déclencher une Compaction en arrière-plan ou mettre à jour des index.
  </Accordion>
</AccordionGroup>

Pour le harnais Codex non ACP intégré, OpenClaw applique le même cycle de vie en projetant le contexte assemblé dans les instructions développeur de Codex et dans l’invite du tour courant. Codex reste propriétaire de son historique de fil natif et de son compacteur natif.

### Cycle de vie des sous-agents (facultatif)

OpenClaw appelle deux hooks facultatifs du cycle de vie des sous-agents :

<ParamField path="prepareSubagentSpawn" type="method">
  Prépare l’état de contexte partagé avant le démarrage d’une exécution enfant. Le hook reçoit les clés de session parent/enfant, `contextMode` (`isolated` ou `fork`), les identifiants/fichiers de transcription disponibles et un TTL facultatif. S’il renvoie un handle de restauration, OpenClaw l’appelle lorsque le lancement échoue après une préparation réussie.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Nettoie lorsqu’une session de sous-agent se termine ou est balayée.
</ParamField>

### Ajout à l’invite système

La méthode `assemble` peut renvoyer une chaîne `systemPromptAddition`. OpenClaw la préfixe à l’invite système de l’exécution. Cela permet aux moteurs d’injecter des consignes de rappel dynamiques, des instructions de récupération ou des indices tenant compte du contexte sans nécessiter de fichiers statiques dans l’espace de travail.

## Le moteur legacy

Le moteur `legacy` intégré préserve le comportement d’origine d’OpenClaw :

- **Ingestion** : aucune opération (le gestionnaire de session gère directement la persistance des messages).
- **Assemblage** : transmission directe (le pipeline existant sanitize → validate → limit du runtime gère l’assemblage du contexte).
- **Compactage** : délègue à la Compaction de résumé intégrée, qui crée un résumé unique des messages plus anciens et conserve intacts les messages récents.
- **Après le tour** : aucune opération.

Le moteur legacy n’enregistre pas d’outils et ne fournit pas de `systemPromptAddition`.

Lorsqu’aucun `plugins.slots.contextEngine` n’est défini (ou lorsqu’il est défini sur `"legacy"`), ce moteur est utilisé automatiquement.

## Moteurs Plugin

Un Plugin peut enregistrer un moteur de contexte à l’aide de l’API Plugin :

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
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
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

La fabrique `ctx` inclut des valeurs facultatives `config`, `agentDir` et `workspaceDir`
afin que les Plugins puissent initialiser un état par agent ou par espace de travail avant l’exécution du
premier hook de cycle de vie.

Activez-le ensuite dans la configuration :

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

| Membre             | Type     | Objectif                                                        |
| ------------------ | -------- | --------------------------------------------------------------- |
| `info`             | Propriété | Identifiant du moteur, nom, version et s’il possède la Compaction |
| `ingest(params)`   | Méthode  | Stocker un message unique                                      |
| `assemble(params)` | Méthode  | Construire le contexte pour une exécution de modèle (renvoie `AssembleResult`) |
| `compact(params)`  | Méthode  | Résumer/réduire le contexte                                    |

`assemble` renvoie un `AssembleResult` avec :

<ParamField path="messages" type="Message[]" required>
  Les messages ordonnés à envoyer au modèle.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  L’estimation par le moteur du nombre total de tokens dans le contexte assemblé. OpenClaw l’utilise pour les décisions de seuil de Compaction et les rapports de diagnostic.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Préfixé à l’invite système.
</ParamField>

`compact` renvoie un `CompactResult`. Lorsque la Compaction fait pivoter la
transcription active, `result.sessionId` et `result.sessionFile` identifient la session
successeur que la prochaine tentative ou le prochain tour doit utiliser.

Membres facultatifs :

| Membre                         | Type    | Objectif                                                                                                         |
| ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Méthode | Initialiser l’état du moteur pour une session. Appelé une fois lorsque le moteur voit une session pour la première fois (par exemple, import d’historique). |
| `ingestBatch(params)`          | Méthode | Ingérer un tour terminé sous forme de lot. Appelé après la fin d’une exécution, avec tous les messages de ce tour en une seule fois. |
| `afterTurn(params)`            | Méthode | Travail de cycle de vie après exécution (persister l’état, déclencher une Compaction en arrière-plan). |
| `prepareSubagentSpawn(params)` | Méthode | Configurer l’état partagé pour une session enfant avant son démarrage. |
| `onSubagentEnded(params)`      | Méthode | Nettoyer après la fin d’un sous-agent. |
| `dispose()`                    | Méthode | Libérer les ressources. Appelé lors de l’arrêt du Gateway ou du rechargement du Plugin — pas par session. |

### ownsCompaction

`ownsCompaction` contrôle si l’auto-Compaction intégrée en cours de tentative de Pi reste activée pour l’exécution :

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Le moteur possède le comportement de Compaction. OpenClaw désactive l’auto-Compaction intégrée de Pi pour cette exécution, et l’implémentation `compact()` du moteur est responsable de `/compact`, de la Compaction de récupération après dépassement et de toute Compaction proactive qu’il souhaite effectuer dans `afterTurn()`. OpenClaw peut toujours exécuter la protection contre le dépassement avant invite ; lorsqu’elle prédit que la transcription complète dépassera la limite, le chemin de récupération appelle `compact()` du moteur actif avant de soumettre une autre invite.
  </Accordion>
  <Accordion title="ownsCompaction: false ou non défini">
    L’auto-Compaction intégrée de Pi peut toujours s’exécuter pendant l’exécution de l’invite, mais la méthode `compact()` du moteur actif est toujours appelée pour `/compact` et la récupération après dépassement.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` ne signifie **pas** qu’OpenClaw revient automatiquement au chemin de Compaction du moteur legacy.
</Warning>

Cela signifie qu’il existe deux modèles Plugin valides :

<Tabs>
  <Tab title="Mode propriétaire">
    Implémentez votre propre algorithme de Compaction et définissez `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode délégué">
    Définissez `ownsCompaction: false` et faites appeler à `compact()` `delegateCompactionToRuntime(...)` depuis `openclaw/plugin-sdk/core` pour utiliser le comportement de Compaction intégré d’OpenClaw.
  </Tab>
</Tabs>

Un `compact()` sans opération est dangereux pour un moteur actif non propriétaire, car il désactive le chemin normal de Compaction `/compact` et de récupération après dépassement pour cet emplacement de moteur.

## Référence de configuration

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
L’emplacement est exclusif au moment de l’exécution — un seul moteur de contexte enregistré est résolu pour une exécution ou une opération de Compaction donnée. Les autres Plugins `kind: "context-engine"` activés peuvent toujours se charger et exécuter leur code d’enregistrement ; `plugins.slots.contextEngine` sélectionne uniquement l’identifiant de moteur enregistré qu’OpenClaw résout lorsqu’il a besoin d’un moteur de contexte.
</Note>

<Note>
**Désinstallation du Plugin :** lorsque vous désinstallez le Plugin actuellement sélectionné comme `plugins.slots.contextEngine`, OpenClaw réinitialise l’emplacement à la valeur par défaut (`legacy`). Le même comportement de réinitialisation s’applique à `plugins.slots.memory`. Aucune modification manuelle de la configuration n’est requise.
</Note>

## Relation avec la Compaction et la mémoire

<AccordionGroup>
  <Accordion title="Compaction">
    La Compaction est l’une des responsabilités du moteur de contexte. Le moteur hérité délègue à la synthèse intégrée d’OpenClaw. Les moteurs de Plugin peuvent implémenter n’importe quelle stratégie de compaction (résumés DAG, récupération vectorielle, etc.).
  </Accordion>
  <Accordion title="Plugins de mémoire">
    Les plugins de mémoire (`plugins.slots.memory`) sont distincts des moteurs de contexte. Les plugins de mémoire fournissent la recherche/récupération ; les moteurs de contexte contrôlent ce que le modèle voit. Ils peuvent fonctionner ensemble — un moteur de contexte peut utiliser les données d’un plugin de mémoire pendant l’assemblage. Les moteurs de Plugin qui veulent utiliser le chemin de prompt de mémoire active doivent privilégier `buildMemorySystemPromptAddition(...)` depuis `openclaw/plugin-sdk/core`, qui convertit les sections du prompt de mémoire active en un `systemPromptAddition` prêt à être préfixé. Si un moteur a besoin d’un contrôle de plus bas niveau, il peut toujours extraire les lignes brutes depuis `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Élagage de session">
    La suppression des anciens résultats d’outils en mémoire s’exécute toujours, quel que soit le moteur de contexte actif.
  </Accordion>
</AccordionGroup>

## Conseils

- Utilisez `openclaw doctor` pour vérifier que votre moteur se charge correctement.
- Si vous changez de moteur, les sessions existantes continuent avec leur historique actuel. Le nouveau moteur prend le relais pour les futures exécutions.
- Les erreurs de moteur sont journalisées et affichées dans les diagnostics. Si un moteur de Plugin ne parvient pas à s’enregistrer ou si l’identifiant du moteur sélectionné ne peut pas être résolu, OpenClaw ne revient pas automatiquement en arrière ; les exécutions échouent jusqu’à ce que vous corrigiez le plugin ou que vous rétablissiez `plugins.slots.contextEngine` sur `"legacy"`.
- Pour le développement, utilisez `openclaw plugins install -l ./my-engine` pour lier un répertoire de plugin local sans le copier.

## Connexe

- [Compaction](/fr/concepts/compaction) — synthétiser de longues conversations
- [Contexte](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Architecture des Plugin](/fr/plugins/architecture) — enregistrer des plugins de moteur de contexte
- [Manifeste de Plugin](/fr/plugins/manifest) — champs du manifeste de plugin
- [Plugins](/fr/tools/plugin) — aperçu des plugins
