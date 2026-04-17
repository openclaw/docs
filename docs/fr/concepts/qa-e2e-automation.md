---
read_when:
    - Extension de qa-lab ou de qa-channel
    - Ajout de scénarios QA adossés au dépôt
    - Création d’une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Forme de l’automatisation QA privée pour qa-lab, qa-channel, les scénarios initialisés et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-17T06:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f97293c184d7c04c95d9858305668fbc0f93273f587ec7e54896ad5d603ab0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatisation QA E2E

La pile QA privée a pour but d’exercer OpenClaw d’une manière plus réaliste,
structurée comme un canal, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec des surfaces pour les MP, les canaux, les fils,
  les réactions, les modifications et les suppressions.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources initiales adossées au dépôt pour la tâche de démarrage et les
  scénarios QA de référence.

Le flux opérateur QA actuel est un site QA à deux volets :

- Gauche : tableau de bord Gateway (UI de contrôle) avec l’agent.
- Droite : QA Lab, affichant la transcription de type Slack et le plan du scénario.

Exécutez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut confier à l’agent une mission QA,
observer le comportement réel du canal et consigner ce qui a fonctionné, échoué ou
est resté bloqué.

Pour itérer plus rapidement sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hachage
des ressources QA Lab change.

Pour une voie de smoke test Matrix sur transport réel, exécutez :

```bash
pnpm openclaw qa matrix
```

Cette voie provisionne un homeserver Tuwunel jetable dans Docker, enregistre
des utilisateurs temporaires pilote, SUT et observateur, crée une salle privée, puis exécute
le vrai Plugin Matrix dans un enfant Gateway QA. La voie sur transport réel conserve
la configuration enfant limitée au transport testé, afin que Matrix s’exécute sans
`qa-channel` dans la configuration enfant. Elle écrit les artefacts de rapport structurés ainsi
qu’un journal combiné stdout/stderr dans le répertoire de sortie Matrix QA sélectionné. Pour
capturer également la sortie externe de build/lancement de `scripts/run-node.mjs`, définissez
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` vers un fichier journal local au dépôt.

Pour une voie de smoke test Telegram sur transport réel, exécutez :

```bash
pnpm openclaw qa telegram
```

Cette voie cible un vrai groupe Telegram privé au lieu de provisionner un
serveur jetable. Elle nécessite `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` et
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ainsi que deux bots distincts dans le même
groupe privé. Le bot SUT doit avoir un nom d’utilisateur Telegram, et l’observation
bot à bot fonctionne mieux lorsque les deux bots ont le mode de communication Bot-to-Bot
activé dans `@BotFather`.

Les voies sur transport réel partagent désormais un contrat plus réduit au lieu que chacune
invente sa propre structure de liste de scénarios.

`qa-channel` reste la suite large de comportements produit synthétiques et ne fait pas partie
de la matrice de couverture des transports réels.

| Voie     | Canary | Gating par mention | Blocage par allowlist | Réponse de niveau supérieur | Reprise après redémarrage | Suivi dans le fil | Isolation du fil | Observation des réactions | Commande d’aide |
| -------- | ------ | ------------------ | --------------------- | --------------------------- | ------------------------- | ----------------- | ---------------- | ------------------------- | --------------- |
| Matrix   | x      | x                  | x                     | x                           | x                         | x                 | x                | x                         |                 |
| Telegram | x      |                    |                       |                             |                           |                   |                  |                           | x               |

Cela permet à `qa-channel` de rester la suite large de comportements produit, tandis que Matrix,
Telegram et les futurs transports réels partagent une checklist explicite unique du contrat de transport.

Pour une voie de VM Linux jetable sans intégrer Docker dans le chemin QA, exécutez :

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Cela démarre un nouvel invité Multipass, installe les dépendances, construit OpenClaw
dans l’invité, exécute `qa suite`, puis copie le rapport QA normal et le
résumé dans `.artifacts/qa-e2e/...` sur l’hôte.
Cela réutilise le même comportement de sélection de scénarios que `qa suite` sur l’hôte.
Les exécutions de suite sur l’hôte et dans Multipass exécutent par défaut plusieurs scénarios sélectionnés en parallèle
avec des workers Gateway isolés, jusqu’à 64 workers ou au nombre de scénarios sélectionnés.
Utilisez `--concurrency <count>` pour ajuster le nombre de workers, ou
`--concurrency 1` pour une exécution en série.
Les exécutions live transmettent les entrées d’auth QA prises en charge qui sont pratiques pour
l’invité : clés de fournisseur basées sur l’environnement, chemin de configuration du fournisseur QA live, et
`CODEX_HOME` lorsqu’il est présent. Conservez `--output-dir` sous la racine du dépôt afin que l’invité
puisse écrire en retour via l’espace de travail monté.

## Ressources initiales adossées au dépôt

Les ressources initiales se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Elles sont volontairement dans git afin que le plan QA soit visible à la fois pour les humains et pour
l’agent.

`qa-lab` doit rester un exécuteur Markdown générique. Chaque fichier Markdown de scénario est
la source de vérité pour une exécution de test et doit définir :

- les métadonnées du scénario
- les références de documentation et de code
- les exigences facultatives en matière de Plugin
- le correctif facultatif de configuration Gateway
- le `qa-flow` exécutable

La surface d’exécution réutilisable qui sous-tend `qa-flow` peut rester générique
et transverse. Par exemple, des scénarios Markdown peuvent combiner des helpers côté transport
avec des helpers côté navigateur qui pilotent l’UI de contrôle intégrée via le
point d’intégration Gateway `browser.request` sans ajouter d’exécuteur spécialisé.

La liste de référence doit rester suffisamment large pour couvrir :

- les MP et les conversations en canal
- le comportement des fils
- le cycle de vie des actions sur les messages
- les rappels Cron
- le rappel de mémoire
- le changement de modèle
- le transfert vers un sous-agent
- la lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Voies avec fournisseur simulé

`qa suite` dispose de deux voies locales avec fournisseur simulé :

- `mock-openai` est le mock OpenClaw sensible aux scénarios. Il reste la
  voie simulée déterministe par défaut pour la QA adossée au dépôt et les gates de parité.
- `aimock` démarre un serveur fournisseur adossé à AIMock pour une couverture expérimentale
  de protocole, de fixtures, d’enregistrement/relecture et de chaos. Il est additionnel et ne
  remplace pas le répartiteur de scénarios `mock-openai`.

L’implémentation des voies fournisseur se trouve sous `extensions/qa-lab/src/providers/`.
Chaque fournisseur possède ses valeurs par défaut, le démarrage de serveur local, la configuration
du modèle Gateway, les besoins de préparation du profil d’auth, et les indicateurs de capacités live/simulées.
Le code partagé de suite et Gateway doit passer par le registre des fournisseurs plutôt que de
se brancher selon les noms de fournisseurs.

## Adaptateurs de transport

`qa-lab` possède un point d’intégration de transport générique pour les scénarios QA Markdown.
`qa-channel` est le premier adaptateur sur ce point d’intégration, mais l’objectif de conception est plus large :
les futurs canaux réels ou synthétiques doivent pouvoir se brancher sur le même exécuteur de suite
au lieu d’ajouter un exécuteur QA spécifique au transport.

Au niveau de l’architecture, la séparation est la suivante :

- `qa-lab` possède l’exécution générique des scénarios, la concurrence des workers, l’écriture des artefacts et les rapports.
- l’adaptateur de transport possède la configuration Gateway, l’état prêt, l’observation entrante et sortante, les actions de transport et l’état de transport normalisé.
- les fichiers de scénarios Markdown sous `qa/scenarios/` définissent l’exécution de test ; `qa-lab` fournit la surface d’exécution réutilisable qui les exécute.

Les directives d’adoption destinées aux mainteneurs pour les nouveaux adaptateurs de canal se trouvent dans
[Testing](/fr/help/testing#adding-a-channel-to-qa).

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre aux questions suivantes :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi méritent d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèles live
et écrivez un rapport Markdown évalué :

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

La commande exécute des processus enfants Gateway QA locaux, pas Docker. Les
scénarios d’évaluation de caractère doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur
ordinaires tels que la conversation, l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle
candidat ne doit pas être informé qu’il est en cours d’évaluation. La commande conserve chaque
transcription complète, enregistre les statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` de classer les exécutions selon le naturel, l’ambiance et l’humour.
Utilisez `--blind-judge-models` lors de la comparaison entre fournisseurs : l’invite du juge reçoit toujours
chaque transcription et l’état d’exécution, mais les références candidates sont remplacées par des
étiquettes neutres telles que `candidate-01` ; le rapport réassocie les classements aux vraies références après
l’analyse.
Les exécutions candidates utilisent par défaut un niveau de réflexion `high`, avec `xhigh` pour les modèles OpenAI qui
le prennent en charge. Remplacez un candidat spécifique en ligne avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours une
valeur de repli globale, et l’ancienne forme `--model-thinking <provider/model=level>` est
conservée pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé là
où le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` en ligne lorsqu’un
candidat ou juge particulier a besoin d’un remplacement. Passez `--fast` uniquement lorsque vous souhaitez
forcer le mode rapide pour tous les modèles candidats. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse de benchmark, mais les invites des juges indiquent explicitement
de ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur le Gateway local
rendent une exécution trop bruitée.
Lorsqu’aucun `--model` candidat n’est fourni, l’évaluation de caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est fourni.
Lorsqu’aucun `--judge-model` n’est fourni, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Dashboard](/web/dashboard)
