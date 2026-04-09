---
read_when:
    - Étendre qa-lab ou qa-channel
    - Ajouter des scénarios QA adossés au dépôt
    - Créer une automatisation QA plus réaliste autour du tableau de bord Gateway
summary: Structure de l’automatisation QA privée pour qa-lab, qa-channel, les scénarios de départ, et les rapports de protocole
title: Automatisation QA E2E
x-i18n:
    generated_at: "2026-04-09T01:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c922607d67e0f3a2489ac82bc9f510f7294ced039c1014c15b676d826441d833
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatisation QA E2E

La pile QA privée est conçue pour exercer OpenClaw d’une manière plus réaliste,
avec une forme proche d’un canal, qu’un simple test unitaire ne peut le faire.

Éléments actuels :

- `extensions/qa-channel` : canal de messages synthétique avec surfaces de MP, de canal, de fil,
  de réaction, de modification et de suppression.
- `extensions/qa-lab` : interface de débogage et bus QA pour observer la transcription,
  injecter des messages entrants et exporter un rapport Markdown.
- `qa/` : ressources de départ adossées au dépôt pour la tâche de lancement et les
  scénarios QA de base.

Le flux opérateur QA actuel repose sur un site QA à deux volets :

- Gauche : tableau de bord Gateway (Control UI) avec l’agent.
- Droite : QA Lab, affichant la transcription de style Slack et le plan de scénario.

Lancez-le avec :

```bash
pnpm qa:lab:up
```

Cela construit le site QA, démarre la voie Gateway adossée à Docker et expose la
page QA Lab où un opérateur ou une boucle d’automatisation peut donner à l’agent une
mission QA, observer le comportement réel du canal et consigner ce qui a
fonctionné, échoué ou est resté bloqué.

Pour une itération plus rapide sur l’interface QA Lab sans reconstruire l’image Docker à chaque fois,
démarrez la pile avec un bundle QA Lab monté par liaison :

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` conserve les services Docker sur une image préconstruite et monte par liaison
`extensions/qa-lab/web/dist` dans le conteneur `qa-lab`. `qa:lab:watch`
reconstruit ce bundle à chaque modification, et le navigateur se recharge automatiquement lorsque le hachage des ressources QA Lab change.

## Ressources de départ adossées au dépôt

Les ressources de départ se trouvent dans `qa/` :

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Elles sont volontairement versionnées dans git afin que le plan QA soit visible à la fois pour les humains et pour l’agent. La liste de base doit rester suffisamment large pour couvrir :

- chat en MP et en canal
- comportement des fils
- cycle de vie des actions de message
- rappels cron
- rappel en mémoire
- changement de modèle
- transfert à un sous-agent
- lecture du dépôt et de la documentation
- une petite tâche de build comme Lobster Invaders

## Rapports

`qa-lab` exporte un rapport de protocole Markdown à partir de la chronologie observée du bus.
Le rapport doit répondre aux questions suivantes :

- Ce qui a fonctionné
- Ce qui a échoué
- Ce qui est resté bloqué
- Quels scénarios de suivi méritent d’être ajoutés

Pour les vérifications de caractère et de style, exécutez le même scénario sur plusieurs références de modèles réels
et rédigez un rapport Markdown évalué :

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

La commande exécute des processus enfants locaux de passerelle QA, pas Docker. Les
scénarios d’évaluation du caractère doivent définir la persona via `SOUL.md`, puis exécuter des tours utilisateur ordinaires
comme du chat, de l’aide sur l’espace de travail et de petites tâches sur des fichiers. Le modèle candidat ne doit
pas être informé qu’il est en cours d’évaluation. La commande préserve chaque
transcription complète, enregistre des statistiques d’exécution de base, puis demande aux modèles juges en mode rapide avec
un raisonnement `xhigh` de classer les exécutions selon leur naturel, leur ambiance et leur humour.
Utilisez `--blind-judge-models` lors de la comparaison de fournisseurs : l’invite du juge reçoit toujours
chaque transcription et le statut d’exécution, mais les références candidates sont remplacées par des
étiquettes neutres comme `candidate-01` ; le rapport remappe les classements vers les références réelles après
l’analyse.
Les exécutions candidates utilisent par défaut le niveau de réflexion `high`, avec `xhigh` pour les modèles OpenAI qui
le prennent en charge. Remplacez un candidat spécifique inline avec
`--model provider/model,thinking=<level>`. `--thinking <level>` définit toujours un
secours global, et l’ancien format `--model-thinking <provider/model=level>` est
conservé pour compatibilité.
Les références candidates OpenAI utilisent par défaut le mode rapide afin que le traitement prioritaire soit utilisé lorsque
le fournisseur le prend en charge. Ajoutez `,fast`, `,no-fast` ou `,fast=false` inline lorsqu’un
candidat unique ou un juge a besoin d’une dérogation. Passez `--fast` uniquement si vous voulez
forcer le mode rapide pour chaque modèle candidat. Les durées des candidats et des juges sont
enregistrées dans le rapport pour l’analyse comparative, mais les invites des juges précisent explicitement de
ne pas classer selon la vitesse.
Les exécutions des modèles candidats et juges utilisent toutes deux par défaut une concurrence de 16. Réduisez
`--concurrency` ou `--judge-concurrency` lorsque les limites du fournisseur ou la pression sur la passerelle locale
rendent l’exécution trop bruyante.
Lorsqu’aucun `--model` candidat n’est passé, l’évaluation du caractère utilise par défaut
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, et
`google/gemini-3.1-pro-preview` lorsqu’aucun `--model` n’est passé.
Lorsqu’aucun `--judge-model` n’est passé, les juges utilisent par défaut
`openai/gpt-5.4,thinking=xhigh,fast` et
`anthropic/claude-opus-4-6,thinking=high`.

## Documentation associée

- [Testing](/fr/help/testing)
- [QA Channel](/fr/channels/qa-channel)
- [Dashboard](/web/dashboard)
