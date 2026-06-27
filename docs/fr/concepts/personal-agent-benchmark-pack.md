---
read_when:
    - Exécution des vérifications locales de fiabilité de l’agent personnel
    - Extension du catalogue de scénarios QA adossé au dépôt
    - Vérification des rappels, des réponses, de la mémoire, de la rédaction, du suivi sécurisé des outils, de l’état des tâches, des diagnostics partageables en toute sécurité, des déclarations d’achèvement étayées par des preuves et de la récupération après échec
summary: Scénarios qa-channel locaux pour les vérifications de workflows d’assistant personnel respectueux de la confidentialité.
title: Pack de benchmarks pour agent personnel
x-i18n:
    generated_at: "2026-06-27T17:25:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Le pack Personal Agent Benchmark est un petit pack de scénarios QA adossé à un dépôt pour
les workflows d’assistant personnel local. Ce n’est pas un benchmark de modèle générique et il
ne nécessite pas de nouvel exécuteur. Le pack réutilise la pile QA privée décrite dans la
[vue d’ensemble QA](/fr/concepts/qa-e2e-automation), le
[canal QA](/fr/channels/qa-channel) synthétique, ainsi que le catalogue YAML
`qa/scenarios` existant.

Le premier pack est volontairement restreint :

- faux rappels personnels via distribution Cron locale
- routage de faux messages directs et de réponses de fils via `qa-channel`
- rappel de fausses préférences depuis les fichiers de mémoire temporaires de l’espace de travail QA
- fausses vérifications de secrets sans réémission
- suivi sûr d’outil fondé sur une lecture après un court tour de type approbation
- comportement d’arrêt sur refus d’approbation pour une demande sensible de lecture locale
- rapport d’état de tâche étayé par des preuves qui garde séparés les états en attente, bloqués et terminés
- artefacts de diagnostic partageables en sécurité qui conservent un état utile tout en omettant le contenu personnel brut
- déclarations d’achèvement étayées par des preuves qui évitent les faux progrès avant l’existence de preuves locales
- récupération après échec qui signale un état partiel et garde des limites de nouvelle tentative claires

## Scénarios

Les métadonnées lisibles par machine du pack se trouvent dans
`extensions/qa-lab/src/scenario-packs.ts`. Exécutez le pack avec
`--pack personal-agent` :

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` est additif avec les indicateurs `--scenario` répétés. Les scénarios explicites s’exécutent
d’abord, puis les scénarios du pack s’exécutent dans l’ordre de `QA_PERSONAL_AGENT_SCENARIO_IDS`, avec
les doublons supprimés.

Le pack est conçu pour `qa-channel` avec `mock-openai` ou une autre voie de fournisseur QA
locale. Il ne doit pas être dirigé vers des services de discussion en direct ni de vrais comptes
personnels.

## Modèle de confidentialité

Les scénarios utilisent uniquement de faux utilisateurs, de fausses préférences, de faux secrets et
l’espace de travail Gateway QA temporaire créé par la suite. Ils ne doivent ni lire ni écrire
la mémoire, les sessions, les identifiants, les agents de lancement, les configurations globales
ou l’état Gateway en direct de vrais utilisateurs OpenClaw.

Les artefacts restent dans le répertoire d’artefacts existant de la suite QA et doivent être
traités comme une sortie de test. Les vérifications de caviardage utilisent de faux marqueurs afin que les échecs soient sûrs
à inspecter et à consigner dans les issues.

## Étendre le pack

Ajoutez de nouveaux cas `.yaml` sous `qa/scenarios/personal/`, puis ajoutez l’identifiant de scénario
à `QA_PERSONAL_AGENT_SCENARIO_IDS`. Gardez chaque cas petit, local, déterministe
dans `mock-openai`, et centré sur un seul comportement d’assistant personnel.

Bons candidats de suivi :

- vérifications d’export de trajectoire caviardée
- vérifications de workflow Plugin local uniquement

Évitez d’ajouter un nouvel exécuteur, Plugin, dépendance, transport en direct ou juge de modèle
tant que le catalogue de scénarios ne contient pas assez de cas stables pour justifier cette surface.
