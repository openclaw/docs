---
read_when:
    - Refactorisation des définitions de scénarios QA ou du code du harnais qa-lab
    - Déplacement du comportement QA entre les scénarios Markdown et la logique de harnais TypeScript
summary: Plan de refactorisation QA pour la consolidation du catalogue de scénarios et du harnais
title: Refactorisation QA
x-i18n:
    generated_at: "2026-04-23T07:10:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Refactorisation QA

Statut : migration fondamentale effectuée.

## Objectif

Faire évoluer la QA OpenClaw d’un modèle à définitions scindées vers une source unique de vérité :

- métadonnées de scénario
- prompts envoyés au modèle
- configuration et nettoyage
- logique de harnais
- assertions et critères de réussite
- artefacts et indications de rapport

L’état final souhaité est un harnais QA générique qui charge des fichiers de définition de scénario puissants au lieu de coder en dur la plupart des comportements dans TypeScript.

## État actuel

La source principale de vérité vit désormais dans `qa/scenarios/index.md` plus un fichier par
scénario sous `qa/scenarios/<theme>/*.md`.

Mis en œuvre :

- `qa/scenarios/index.md`
  - métadonnées canoniques du pack QA
  - identité de l’opérateur
  - mission de lancement
- `qa/scenarios/<theme>/*.md`
  - un fichier Markdown par scénario
  - métadonnées de scénario
  - liaisons de gestionnaire
  - configuration d’exécution spécifique au scénario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parseur de pack Markdown + validation zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendu du plan à partir du pack Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - initialise des fichiers de compatibilité générés plus `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - sélectionne les scénarios exécutables via les liaisons de gestionnaire définies en Markdown
- Protocole + UI du bus QA
  - pièces jointes inline génériques pour le rendu image/vidéo/audio/fichier

Surfaces encore scindées :

- `extensions/qa-lab/src/suite.ts`
  - possède encore la majeure partie de la logique de gestionnaire personnalisé exécutable
- `extensions/qa-lab/src/report.ts`
  - dérive encore la structure du rapport à partir des sorties d’exécution

Donc la séparation de la source de vérité est corrigée, mais l’exécution reste encore majoritairement fondée sur des gestionnaires plutôt que pleinement déclarative.

## À quoi ressemble réellement la surface de scénario

La lecture de la suite actuelle montre quelques classes distinctes de scénarios.

### Interaction simple

- baseline de canal
- baseline de DM
- suivi dans un fil
- changement de modèle
- poursuite d’approbation
- réaction/modification/suppression

### Mutation de configuration et de runtime

- désactivation de compétence via config patch
- réveil après redémarrage via config apply
- bascule de capacité après redémarrage de config
- vérification de dérive d’inventaire runtime

### Assertions sur système de fichiers et dépôt

- rapport de découverte source/docs
- build de Lobster Invaders
- recherche d’artefact image généré

### Orchestration mémoire

- rappel mémoire
- outils mémoire dans le contexte du canal
- repli en cas d’échec mémoire
- classement de mémoire de session
- isolation mémoire de fil
- balayage de Dreaming mémoire

### Intégration outils et Plugins

- appel d’outil MCP Plugin-tools
- visibilité des Skills
- installation à chaud de Skills
- génération d’image native
- aller-retour d’image
- compréhension d’image depuis une pièce jointe

### Multi-tour et multi-acteur

- transfert vers sous-agent
- synthèse de diffusion en éventail de sous-agents
- flux de style reprise après redémarrage

Ces catégories sont importantes car elles déterminent les exigences du DSL. Une liste plate de prompt + texte attendu ne suffit pas.

## Direction

### Source unique de vérité

Utiliser `qa/scenarios/index.md` plus `qa/scenarios/<theme>/*.md` comme
source de vérité rédigée.

Le pack doit rester :

- lisible par un humain en revue
- parseable par machine
- assez riche pour piloter :
  - l’exécution de la suite
  - l’initialisation de l’espace de travail QA
  - les métadonnées de l’UI QA Lab
  - les prompts docs/discovery
  - la génération de rapports

### Format d’écriture préféré

Utiliser Markdown comme format de premier niveau, avec du YAML structuré à l’intérieur.

Forme recommandée :

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - surcharges de modèle/fournisseur
  - prérequis
- sections en prose
  - objectif
  - notes
  - indications de débogage
- blocs YAML clôturés
  - setup
  - steps
  - assertions
  - cleanup

Cela donne :

- une meilleure lisibilité en PR que du JSON géant
- un contexte plus riche que du YAML pur
- un parsing strict et une validation zod

Le JSON brut n’est acceptable qu’en tant que forme générée intermédiaire.

## Forme proposée pour un fichier de scénario

Exemple :

````md
---
id: image-generation-roundtrip
title: Aller-retour de génération d’image
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Objectif

Vérifier que les médias générés sont rattachés au tour suivant.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Vérification de génération d’image : génère une image QA de phare et résume-la en une phrase courte.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Vérification de génération d’image
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Vérification d’inspection d’image aller-retour : décris la pièce jointe générée du phare en une phrase courte.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: phare
- assert: requestLog.matches
  where:
    promptIncludes: Vérification d’inspection d’image aller-retour
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capacités du runner que le DSL doit couvrir

D’après la suite actuelle, le runner générique a besoin de plus que l’exécution de prompts.

### Actions d’environnement et de setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Actions de tour d’agent

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Actions de configuration et de runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Actions sur fichiers et artefacts

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Actions mémoire et Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Actions MCP

- `mcp.callTool`

### Assertions

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variables et références d’artefacts

Le DSL doit prendre en charge les sorties enregistrées et les références ultérieures.

Exemples issus de la suite actuelle :

- créer un fil, puis réutiliser `threadId`
- créer une session, puis réutiliser `sessionKey`
- générer une image, puis joindre le fichier au tour suivant
- générer une chaîne de marqueur de réveil, puis vérifier qu’elle apparaît plus tard

Capacités nécessaires :

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- références typées pour chemins, clés de session, ID de fil, marqueurs, sorties d’outils

Sans prise en charge des variables, le harnais continuera de laisser fuir la logique de scénario dans TypeScript.

## Ce qui doit rester comme échappatoires

Un runner entièrement déclaratif pur n’est pas réaliste en phase 1.

Certains scénarios sont intrinsèquement lourds en orchestration :

- balayage de Dreaming mémoire
- réveil après redémarrage via config apply
- bascule de capacité après redémarrage de config
- résolution d’artefact d’image générée par horodatage/chemin
- évaluation de discovery-report

Ceux-ci devraient utiliser pour l’instant des gestionnaires personnalisés explicites.

Règle recommandée :

- 85-90 % déclaratif
- `customHandler` explicites pour le reste difficile
- gestionnaires personnalisés nommés et documentés uniquement
- pas de code inline anonyme dans le fichier de scénario

Cela garde le moteur générique propre tout en permettant d’avancer.

## Changement d’architecture

### Actuel

Le Markdown de scénario est déjà la source de vérité pour :

- l’exécution de la suite
- les fichiers d’initialisation d’espace de travail
- le catalogue de scénarios QA Lab UI
- les métadonnées de rapport
- les prompts de discovery

Compatibilité générée :

- l’espace de travail initialisé inclut encore `QA_KICKOFF_TASK.md`
- l’espace de travail initialisé inclut encore `QA_SCENARIO_PLAN.md`
- l’espace de travail initialisé inclut maintenant aussi `QA_SCENARIOS.md`

## Plan de refactorisation

### Phase 1 : chargeur et schéma

Terminé.

- ajout de `qa/scenarios/index.md`
- découpage des scénarios dans `qa/scenarios/<theme>/*.md`
- ajout d’un parseur pour le contenu nommé YAML dans Markdown
- validation avec zod
- basculement des consommateurs vers le pack parsé
- suppression de `qa/seed-scenarios.json` et `qa/QA_KICKOFF_TASK.md` au niveau du dépôt

### Phase 2 : moteur générique

- découper `extensions/qa-lab/src/suite.ts` en :
  - chargeur
  - moteur
  - registre d’actions
  - registre d’assertions
  - gestionnaires personnalisés
- conserver les fonctions utilitaires existantes comme opérations du moteur

Livrable :

- le moteur exécute des scénarios déclaratifs simples

Commencer par les scénarios principalement composés de prompt + attente + assertion :

- suivi dans un fil
- compréhension d’image depuis une pièce jointe
- visibilité et invocation de Skills
- baseline de canal

Livrable :

- premiers vrais scénarios définis en Markdown livrés via le moteur générique

### Phase 4 : migrer les scénarios intermédiaires

- aller-retour de génération d’image
- outils mémoire dans le contexte du canal
- classement de mémoire de session
- transfert vers sous-agent
- synthèse de diffusion en éventail de sous-agents

Livrable :

- variables, artefacts, assertions d’outils, assertions de journal de requêtes éprouvés

### Phase 5 : garder les scénarios difficiles sur des gestionnaires personnalisés

- balayage de Dreaming mémoire
- réveil après redémarrage via config apply
- bascule de capacité après redémarrage de config
- dérive d’inventaire runtime

Livrable :

- même format d’écriture, mais avec des blocs d’étapes personnalisées explicites lorsque nécessaire

### Phase 6 : supprimer la map de scénarios codée en dur

Une fois que la couverture du pack est suffisante :

- supprimer la majeure partie du branchement TypeScript spécifique aux scénarios de `extensions/qa-lab/src/suite.ts`

## Faux Slack / prise en charge des médias riches

Le bus QA actuel est centré sur le texte.

Fichiers concernés :

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Aujourd’hui, le bus QA prend en charge :

- texte
- réactions
- fils

Il ne modélise pas encore les pièces jointes média inline.

### Contrat de transport nécessaire

Ajouter un modèle générique de pièce jointe au bus QA :

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Puis ajouter `attachments?: QaBusAttachment[]` à :

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Pourquoi commencer par le générique

Ne construisez pas un modèle média spécifique à Slack uniquement.

À la place :

- un modèle de transport QA générique
- plusieurs moteurs de rendu par-dessus
  - le chat QA Lab actuel
  - un futur faux web Slack
  - toute autre vue de faux transport

Cela évite la logique dupliquée et permet aux scénarios média de rester agnostiques au transport.

### Travail UI nécessaire

Mettre à jour l’UI QA pour afficher :

- aperçu image inline
- lecteur audio inline
- lecteur vidéo inline
- puce de pièce jointe fichier

L’UI actuelle peut déjà afficher les fils et les réactions, donc le rendu des pièces jointes devrait se superposer au même modèle de carte de message.

### Travail sur les scénarios rendu possible par le transport média

Une fois que les pièces jointes circulent dans le bus QA, nous pouvons ajouter des scénarios de faux chat plus riches :

- réponse image inline dans faux Slack
- compréhension de pièce jointe audio
- compréhension de pièce jointe vidéo
- ordre mixte des pièces jointes
- réponse de fil avec conservation des médias

## Recommandation

Le prochain bloc d’implémentation devrait être :

1. ajouter le chargeur de scénarios Markdown + le schéma zod
2. générer le catalogue actuel à partir du Markdown
3. migrer d’abord quelques scénarios simples
4. ajouter la prise en charge générique des pièces jointes au bus QA
5. afficher l’image inline dans l’UI QA
6. puis étendre à l’audio et à la vidéo

C’est le plus petit chemin qui prouve les deux objectifs :

- QA générique définie en Markdown
- surfaces de fausse messagerie plus riches

## Questions ouvertes

- si les fichiers de scénario doivent autoriser des modèles de prompt Markdown intégrés avec interpolation de variables
- si la configuration/le nettoyage doivent être des sections nommées ou simplement des listes d’actions ordonnées
- si les références d’artefacts doivent être fortement typées dans le schéma ou basées sur des chaînes
- si les gestionnaires personnalisés doivent vivre dans un registre unique ou dans des registres par surface
- si le fichier de compatibilité JSON généré doit rester versionné pendant la migration
