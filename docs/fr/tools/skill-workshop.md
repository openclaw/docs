---
read_when:
    - Vous voulez que l’agent crée ou mette à jour une skill depuis le chat
    - Vous devez examiner, appliquer, rejeter ou mettre en quarantaine un brouillon de skill généré
    - Vous configurez l’approbation, l’autonomie, le stockage ou les limites de Skill Workshop
sidebarTitle: Skill Workshop
summary: Créer et mettre à jour les Skills de l’espace de travail via la revue Skill Workshop
title: Atelier Skills
x-i18n:
    generated_at: "2026-06-27T18:20:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 449b9cb4d26731555af97ff5b85a6fed48eecad02c81965ff95d871cc6fe1b33
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop est le parcours gouverné d’OpenClaw pour créer et mettre à jour les
skills d’espace de travail.

Les agents et les opérateurs n’écrivent pas directement les fichiers `SKILL.md`
actifs par ce parcours. Ils créent d’abord une **proposition**. Une proposition
est un brouillon en attente contenant le contenu de skill proposé, la liaison de
cible, l’état du scanner, les hachages, les métadonnées des fichiers de support
et les métadonnées de rollback. Elle devient un skill actif uniquement une fois
appliquée.

Skill Workshop écrit uniquement les skills d’espace de travail. Il ne modifie
pas les skills groupés, de Plugin, ClawHub, de racine supplémentaire,
administrés, d’agent personnel ou système.

## Fonctionnement

- **Proposition d’abord :** le contenu de skill généré est stocké sous
  `PROPOSAL.md`, pas sous `SKILL.md`.
- **Appliquer est la seule écriture active :** créer, mettre à jour et réviser ne
  modifient pas les skills actifs.
- **Portée limitée à l’espace de travail :** les créations ciblent la racine
  `skills/` de l’espace de travail. Les mises à jour sont autorisées uniquement
  pour les skills d’espace de travail inscriptibles.
- **Aucun écrasement :** la création échoue si le skill cible existe déjà.
- **Lié au hachage :** les propositions de mise à jour se lient au hachage
  actuel de la cible et deviennent obsolètes si le skill actif change avant
  l’application.
- **Contrôlé par scanner :** l’application relance le scan avant l’écriture.
- **Récupérable :** l’application écrit les métadonnées de rollback avant de
  modifier les fichiers actifs.
- **Surfaces cohérentes :** le chat, la CLI et le Gateway appellent tous le même
  service Skill Workshop.

## Cycle de vie

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

Seules les propositions `pending` peuvent être révisées, appliquées, rejetées ou
mises en quarantaine.

## Chat

Demandez à l’agent le skill souhaité. L’agent appelle `skill_workshop` et
renvoie un identifiant de proposition.

Créer :

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

Mettre à jour un skill d’espace de travail existant :

```text
Update trip-planning to also check seat maps before booking.
```

Itérer sur une proposition en attente :

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

Par défaut, les actions `apply`, `reject` et `quarantine` initiées par l’agent
affichent une invite d’approbation avant leur exécution. Définissez
`skills.workshop.approvalPolicy` sur `"auto"` pour ignorer l’invite dans les
environnements de confiance.

## CLI

Créer une nouvelle proposition de skill :

```bash
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md
```

Créer une proposition de mise à jour pour un skill d’espace de travail existant :

```bash
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md
```

Lister et inspecter :

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
```

Réviser avant approbation :

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
```

Clore la proposition :

```bash
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Contenu de la proposition

Tant qu’elle est en attente, la proposition est stockée sous `PROPOSAL.md` avec
un frontmatter propre aux propositions :

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Lors de l’application, Skill Workshop écrit le `SKILL.md` actif et supprime les
champs propres à la proposition : `status`, la `version` de proposition et la
`date` de proposition.

## Fichiers de support

Utilisez `--proposal-dir` lorsque le skill proposé a besoin de fichiers à côté
de `PROPOSAL.md` :

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

Le répertoire doit contenir `PROPOSAL.md`. Les fichiers de support doivent se
trouver sous :

- `assets/`
- `examples/`
- `references/`
- `scripts/`
- `templates/`

Skill Workshop scanne, hache et stocke les fichiers de support avec la
proposition. Ils sont écrits à côté du `SKILL.md` actif uniquement lors de
l’application.

Les chemins de fichiers de support rejetés incluent les chemins absolus, les
segments de chemin masqués, la traversée de chemins, les chemins qui se
chevauchent, les fichiers exécutables issus de répertoires de proposition, le
texte non UTF-8, les octets nuls et les fichiers hors des dossiers de support
standard.

## Outil d’agent

Le modèle utilise `skill_workshop` :

```text
action: create | update | revise | list | inspect | apply | reject | quarantine
```

Les agents doivent utiliser `skill_workshop` pour le travail de skill généré.
Ils ne doivent pas créer ni modifier les fichiers de proposition au moyen de
`write`, `edit`, `exec`, de commandes shell ou d’opérations directes sur le
système de fichiers.

<Note>
`skill_workshop` est un outil d’agent intégré et il est inclus dans
`tools.profile: "coding"`. Si une politique plus stricte le masque, ajoutez
`skill_workshop` à la liste active `tools.allow`, ou utilisez
`tools.alsoAllow: ["skill_workshop"]` lorsque la portée utilise un profil sans
`tools.allow` explicite. Les exécutions sandboxées ne construisent pas l’outil
Skill Workshop côté hôte ; exécutez donc les actions de revue de proposition
depuis une session d’agent normale côté hôte ou depuis la CLI.
</Note>

## Approbation et autonomie

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

- `autonomous.enabled` : autorise OpenClaw à créer des propositions en attente à
  partir de signaux de conversation durables après des tours réussis. Par défaut :
  `false`.
- `allowSymlinkTargetWrites` : autorise l’application à écrire à travers les
  liens symboliques de skills d’espace de travail dont la cible réelle est
  listée dans `skills.load.allowSymlinkTargets`. Par défaut : `false`.
- `approvalPolicy: "pending"` : exige une invite d’approbation avant une action
  `apply`, `reject` ou `quarantine` initiée par l’agent.
- `approvalPolicy: "auto"` : ignore cette invite d’approbation. L’agent doit
  tout de même appeler l’action.
- `maxPending` : limite les propositions en attente et mises en quarantaine par
  espace de travail.
- `maxSkillBytes` : limite la taille du corps de la proposition. Par défaut :
  `40000`.

Les descriptions de proposition sont toujours limitées à 160 octets.

## Méthodes Gateway

```text
skills.proposals.list
skills.proposals.inspect
skills.proposals.create
skills.proposals.update
skills.proposals.revise
skills.proposals.apply
skills.proposals.reject
skills.proposals.quarantine
```

Les méthodes en lecture seule nécessitent `operator.read`. Les méthodes
mutantes nécessitent `operator.admin`.

## Stockage

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

Répertoire d’état par défaut : `~/.openclaw`.

- `proposal.json` : enregistrement canonique de la proposition.
- `proposals.json` : index de listage rapide, reconstructible à partir des
  dossiers de proposition.
- `PROPOSAL.md` : proposition de skill en attente.
- `rollback.json` : métadonnées de récupération écrites avant que l’application
  ne modifie les fichiers actifs.

## Limites

- Description : 160 octets.
- Corps de proposition : `skills.workshop.maxSkillBytes` (40 000 par défaut).
- Fichiers de support : 64 par proposition.
- Taille des fichiers de support : 256 Ko chacun, 2 Mo au total.
- Propositions en attente et mises en quarantaine :
  `skills.workshop.maxPending` par espace de travail (50 par défaut).

## Dépannage

| Problème                                       | Résolution                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Raccourcissez `description` à 160 octets ou moins.                                                                                                                                                          |
| `Skill proposal content is too large`          | Raccourcissez le corps de la proposition ou augmentez `skills.workshop.maxSkillBytes`.                                                                                                                       |
| `Target skill changed after proposal creation` | Révisez la proposition par rapport à la cible actuelle, ou créez une nouvelle proposition.                                                                                                                   |
| `Proposal scan failed`                         | Inspectez les résultats du scanner, puis révisez ou mettez la proposition en quarantaine.                                                                                                                    |
| `untrusted symlink target`                     | Configurez `skills.load.allowSymlinkTargets` et activez `skills.workshop.allowSymlinkTargetWrites` uniquement pour les racines de skills partagées intentionnelles.                                         |
| `Support file paths must be under one of...`   | Déplacez les fichiers de support sous `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.                                                                                                    |
| La proposition n’apparaît pas dans la liste    | Vérifiez l’espace de travail `--agent` sélectionné et `OPENCLAW_STATE_DIR`.                                                                                                                                  |
| L’agent ne peut pas appeler `skill_workshop`   | Vérifiez la politique d’outils active et le mode d’exécution. `coding` inclut l’outil ; les politiques `tools.allow` restrictives doivent le lister explicitement, et les exécutions sandboxées doivent utiliser une session d’agent normale côté hôte ou la CLI. |

## Connexe

- [Skills](/fr/tools/skills) pour l’ordre de chargement, la priorité et la
  visibilité
- [Créer des skills](/fr/tools/creating-skills) pour les bases d’un `SKILL.md`
  écrit à la main
- [Configuration des Skills](/fr/tools/skills-config) pour le schéma complet
  `skills.workshop`
- [CLI Skills](/fr/cli/skills) pour les commandes `openclaw skills`
