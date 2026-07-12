---
read_when:
    - Vous souhaitez que l’agent crée ou mette à jour une compétence depuis le chat
    - Vous devez examiner, appliquer, rejeter ou mettre en quarantaine une ébauche de skill générée
    - Vous configurez l’approbation, l’autonomie, le stockage ou les limites de Skill Workshop
sidebarTitle: Skill Workshop
summary: Créez et mettez à jour les Skills de l’espace de travail grâce à la révision de Skill Workshop
title: Atelier de Skills
x-i18n:
    generated_at: "2026-07-12T16:05:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop est le processus encadré d’OpenClaw pour créer et mettre à jour les
Skills de l’espace de travail. Les agents et les opérateurs n’écrivent jamais directement
dans `SKILL.md` par ce processus : ils créent une **proposition** (brouillon en attente
avec contenu, liaison à la cible, état de l’analyseur, hachages et métadonnées de
restauration) qui ne devient une Skill active qu’après son application.

Skill Workshop écrit uniquement des Skills d’espace de travail. Il ne modifie jamais les
Skills intégrées, de Plugin, de ClawHub, de racine supplémentaire, gérées, d’agent
personnel ou système.

## Fonctionnement

- **Proposition d’abord :** le contenu généré est stocké sous le nom `PROPOSAL.md`, et non
  `SKILL.md`.
- **L’application est la seule écriture active :** la création, la mise à jour et la révision ne modifient
  jamais les Skills actives.
- **Limité à l’espace de travail :** les créations ciblent la racine `skills/` de l’espace de travail ; les mises à jour
  sont autorisées uniquement pour les Skills d’espace de travail accessibles en écriture.
- **Aucun écrasement :** la création échoue si la Skill cible existe déjà.
- **Lié par hachage :** les propositions de mise à jour sont liées au hachage actuel de la cible et deviennent
  `stale` si la Skill active change avant l’application.
- **Soumis à l’analyseur :** l’application réexécute l’analyseur de sécurité avant l’écriture.
- **Récupérable :** l’application écrit les métadonnées de restauration avant de modifier les fichiers actifs.
- **Interfaces cohérentes :** le chat, la CLI et le Gateway appellent tous le même service.

## Cycle de vie

```text
création/mise à jour -> en attente
révision             -> en attente
application          -> appliquée
rejet                -> rejetée
quarantaine          -> mise en quarantaine
changement de cible  -> obsolète
```

Seule une proposition `pending` peut être révisée, appliquée, rejetée ou mise en quarantaine.

## Gestion du cycle de vie

Le Gateway suit l’utilisation agrégée des Skills dans la base de données d’état partagée. Une fois
par jour, il examine les Skills créées et appliquées par Skill Workshop. Les Skills inutilisées pendant
plus de 30 jours deviennent `stale` ; après 90 jours, elles deviennent `archived` et sont
exclues des nouveaux instantanés de Skills des agents. Les fichiers des Skills archivées restent inchangés
sur le disque. Les Skills créées manuellement ne sont jamais gérées ; seules les Skills créées par des
propositions Skill Workshop entrent dans la gestion du cycle de vie.

Les Skills épinglées ne subissent pas les transitions du cycle de vie. Une Skill obsolète redevient `active`
après son utilisation et l’exécution du balayage suivant. Les Skills archivées ne reviennent que par une
restauration explicite :

Les transitions du cycle de vie et les restaurations s’appliquent aux nouvelles sessions ; les sessions en cours conservent
leur instantané actuel de Skills.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Toutes les commandes de gestion acceptent `--json`. L’état signale également les candidats au chevauchement
déterministes uniquement sous forme de suggestions ; il ne fusionne jamais les Skills et n’appelle jamais de modèle.

## Chat

Demandez à l’agent la Skill souhaitée ; il appelle `skill_workshop` et renvoie un
identifiant de proposition.

### Apprendre à partir du travail récent

Utilisez `/learn` pour transformer la conversation actuelle ou des sources nommées en une
proposition de Skill guidée par des normes :

```text
/learn
/learn docs/runbook.md et https://example.com/guide ; se concentrer sur la récupération
```

Sans demande, `/learn` demande à l’agent d’extraire le processus réutilisable de
la conversation actuelle. Avec une demande, l’agent traite les chemins, URL, notes collées
et références à la conversation comme des sources tout en respectant les exigences de priorité, de portée et
de nommage. Il collecte les sources avec ses outils existants, puis appelle
`skill_workshop` avec `action: "create"`.

La proposition obtenue reste `pending` ; `/learn` ne l’applique jamais. Examinez-la et
appliquez-la par le processus d’approbation normal ou avec `openclaw skills workshop`.

Créer :

```text
Crée une Skill appelée morning-catchup qui exécute ma routine de boîte de réception du lundi.
```

Mettre à jour une Skill d’espace de travail existante :

```text
Mets à jour trip-planning pour vérifier également les plans de cabine avant la réservation.
```

Itérer sur une proposition en attente :

```text
Montre-moi la proposition morning-catchup.
Révise-la pour signaler également tout élément marqué comme urgent.
Applique la proposition morning-catchup.
```

Les actions `apply`, `reject` et `quarantine` initiées par un agent affichent par défaut
une invite d’approbation. Définissez `skills.workshop.approvalPolicy` sur `"auto"` pour l’ignorer dans les
environnements de confiance.

L’invite identifie l’identifiant de la proposition et la Skill cible, et affiche la description de la proposition,
le nombre de fichiers complémentaires et la taille du corps. Les demandes d’approbation sont limitées afin
de se terminer avant le délai de surveillance de l’outil de l’agent. Si aucune décision n’est reçue avant
l’expiration de l’invite, l’action de cycle de vie ne s’exécute pas : la proposition reste en attente
et inchangée. Décidez ultérieurement dans l’interface de Skill Workshop ou exécutez
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Les agents ne doivent
pas réessayer en boucle une action de cycle de vie expirée.

## CLI

```bash
# Créer
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Rattrapage quotidien de la boîte de réception : trier, archiver, faire ressortir, rédiger, planifier" \
  --proposal ./PROPOSAL.md

# Mettre à jour une Skill d’espace de travail existante
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Répertorier et examiner
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Réviser avant l’approbation
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Finaliser
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Doublon"
openclaw skills workshop quarantine <proposal-id> --reason "Nécessite un examen de sécurité"
```

Chaque sous-commande accepte `--agent <id>` (espace de travail cible ; par défaut, celui
déduit du répertoire de travail actuel, puis celui de l’agent par défaut) et `--json` (sortie structurée).
`propose-create`, `propose-update` et `revise` acceptent également `--goal <text>` et
`--evidence <text>` pour enregistrer le contexte de la proposition avec `--proposal`.

## Contenu de la proposition

Tant qu’elle est en attente, la proposition est stockée sous le nom `PROPOSAL.md` avec des métadonnées liminaires
propres à la proposition :

```markdown
---
name: "morning-catchup"
description: "Rattrapage quotidien de la boîte de réception : trier, archiver, faire ressortir, rédiger, planifier"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Lors de l’application, Skill Workshop écrit le fichier `SKILL.md` actif et supprime les
champs propres à la proposition : `status`, la `version` de la proposition et la `date` de la proposition.

## Fichiers complémentaires

Utilisez `--proposal-dir` lorsque la Skill proposée nécessite des fichiers à côté de
`PROPOSAL.md` :

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Bilan du vendredi : statistiques, faits marquants, trois priorités de la semaine prochaine" \
  --proposal-dir ./weekly-update-proposal
```

Le répertoire doit contenir `PROPOSAL.md`. Les fichiers complémentaires doivent se trouver sous
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. Skill
Workshop les analyse, les hache et les stocke avec la proposition, puis les écrit
à côté du fichier `SKILL.md` actif uniquement lors de l’application.

Chemins de fichiers complémentaires rejetés : chemins absolus, segments de chemin masqués, traversée
de chemin, chemins se chevauchant, fichiers exécutables, texte non UTF-8, octets nuls
et chemins situés en dehors des dossiers complémentaires standard.

## Outil de l’agent

Le modèle utilise `skill_workshop` avec une `action` obligatoire :
`create | update | revise | list | inspect | apply | reject | quarantine`.
Les autres paramètres s’appliquent selon l’action :

| Paramètre                  | Utilisé par                                           | Remarques                                                             |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                         | Obligatoire pour `create` ; sinon, résout une proposition en attente par son nom |
| `description`              | `create`, `update`, `revise`                          | 160 octets maximum                                                    |
| `skill_name`               | `update`                                              | Nom ou clé de la Skill existante                                      |
| `proposal_content`         | `create`, `update`, `revise`                          | Stocké sous le nom `PROPOSAL.md` ; limité par `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                          | Tableau de `{ path, content }`                                        |
| `goal`, `evidence`         | `create`, `update`, `revise`                          | Contexte en texte libre                                               |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposition cible                                                     |
| `reason`                   | `apply`, `reject`, `quarantine`                       | Facultatif                                                            |
| `query`, `status`, `limit` | `list`                                                | Filtrage/pagination ; `limit` : maximum 50, valeur par défaut 20       |

Les agents doivent utiliser `skill_workshop` pour les travaux de génération de Skills. Ils ne doivent pas
créer ni modifier les fichiers de proposition au moyen de `write`, `edit`, `exec`, de commandes
shell ou d’opérations directes sur le système de fichiers.

<Note>
`skill_workshop` est un outil d’agent intégré inclus dans
`tools.profile: "coding"`. Si une politique plus stricte le masque, ajoutez
`skill_workshop` à la liste active `tools.allow`, ou utilisez
`tools.alsoAllow: ["skill_workshop"]` lorsque la portée utilise un profil sans
`tools.allow` explicite. Les exécutions en bac à sable ne construisent pas l’outil
Skill Workshop côté hôte ; exécutez donc les actions d’examen des propositions depuis une session d’agent
normale côté hôte ou depuis la CLI.
</Note>

## Skills suggérées

OpenClaw détecte les instructions durables telles que « la prochaine fois », « n’oublie pas de » et les corrections
réactives à la fin d’un tour interactif, y compris les tours ayant échoué. Au tour suivant, l’agent propose d’enregistrer
le dernier processus détecté au moyen de `skill_workshop` ; l’utilisateur décide de créer ou non une
proposition. Cette suggestion intégrée ne crée ni ne modifie une Skill par elle-même. Activez
`skills.workshop.autonomous.enabled` pour créer directement des propositions en attente à la place.

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

| Paramètre                  | Valeur par défaut | Effet                                                                                                                                                                  |
| -------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`           | Crée directement des propositions en attente au lieu de proposer le dernier processus détecté au tour suivant.                                                         |
| `allowSymlinkTargetWrites` | `false`           | Permet à l’application d’écrire via les liens symboliques de Skills d’espace de travail dont la cible réelle figure dans `skills.load.allowSymlinkTargets`.              |
| `approvalPolicy`           | `"pending"`       | `"pending"` exige une invite d’approbation avant les actions `apply`, `reject` ou `quarantine` initiées par l’agent. `"auto"` ignore l’invite (l’agent doit toujours appeler l’action). |
| `maxPending`               | `50`              | Limite le nombre de propositions en attente et en quarantaine par espace de travail (1-200).                                                                            |
| `maxSkillBytes`            | `40000`           | Limite la taille du corps de la proposition en octets (1024-200000).                                                                                                    |

La capture autonome reconnaît les règles prospectives (par exemple, « à partir de maintenant ») et les
corrections réactives (par exemple, « ce n’est pas ce que j’ai demandé »). Elle regroupe les nouvelles instructions par sujet en
un maximum de trois propositions par tour, dirige les correspondances de vocabulaire vers les Skills d’espace de travail existantes accessibles en écriture et
révise sa propre proposition en attente lorsqu’une autre correction cible la même Skill.

Les descriptions des propositions sont toujours limitées à 160 octets, indépendamment de
`maxSkillBytes`.

## Méthodes du Gateway

| Méthode                            | Portée           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` est disponible uniquement dans le Gateway (sans équivalent dans la CLI ni dans les outils d’agent) : cette méthode
transmet des instructions de révision en texte libre à la session de discussion de l’agent propriétaire
au lieu de remplacer directement `PROPOSAL.md`, pour les interfaces qui demandent à l’agent
d’effectuer une révision plutôt que de soumettre littéralement un nouveau contenu.

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
- `proposals.json` : index de liste rapide, reconstructible à partir des dossiers de propositions.
- `PROPOSAL.md` : proposition de Skill en attente.
- `rollback.json` : métadonnées de récupération écrites avant l’application des modifications aux fichiers actifs.

## Limites

| Limite                             | Valeur                                                               |
| ---------------------------------- | -------------------------------------------------------------------- |
| Description                        | 160 octets                                                           |
| Corps de la proposition            | `skills.workshop.maxSkillBytes` (40 000 par défaut ; plafond absolu de 1 Mio) |
| Fichiers annexes                   | 64 par proposition                                                   |
| Taille des fichiers annexes        | 256 Kio chacun, 2 Mio au total                                       |
| Propositions en attente + isolées  | `skills.workshop.maxPending` par espace de travail (50 par défaut)    |

## Résolution des problèmes

| Problème                                       | Résolution                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Réduisez `description` à 160 octets ou moins.                                                                                                                                                               |
| `Skill proposal content is too large`          | Réduisez le corps de la proposition ou augmentez `skills.workshop.maxSkillBytes`.                                                                                                                           |
| `Target skill changed after proposal creation` | Révisez la proposition par rapport à la cible actuelle ou créez-en une nouvelle.                                                                                                                            |
| `Proposal scan failed`                         | Examinez les résultats de l’analyseur, puis révisez ou isolez la proposition.                                                                                                                               |
| `untrusted symlink target`                     | Configurez `skills.load.allowSymlinkTargets` et activez `skills.workshop.allowSymlinkTargetWrites` uniquement pour les racines de Skills partagées intentionnellement.                                      |
| `Support file paths must be under one of...`   | Déplacez les fichiers annexes sous `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`.                                                                                                       |
| La proposition n’apparaît pas dans la liste    | Vérifiez l’espace de travail `--agent` sélectionné et `OPENCLAW_STATE_DIR`.                                                                                                                                 |
| L’agent ne peut pas appeler `skill_workshop`   | Vérifiez la politique d’outils active et le mode d’exécution. `coding` inclut l’outil ; les politiques restrictives `tools.allow` doivent le répertorier explicitement, et les exécutions en bac à sable doivent utiliser une session d’agent normale côté hôte ou la CLI. |

### Diagnostic de la politique d’outils

Lorsque la capture autonome est activée, `openclaw doctor` exécute la vérification
`core/doctor/skill-workshop-tool-policy` pour l’agent par défaut. Si la politique
masque `skill_workshop`, l’avertissement indique la première couche de configuration qui l’exclut ainsi que
la modification exacte à apporter à `allow` ou `alsoAllow`. Les anciens guides d’exploitation peuvent encore utiliser
`openclaw plugins inspect skill-workshop` ; cette commande explique désormais que Skill
Workshop est intégré et affiche la même indication de politique, le cas échéant.

## Voir aussi

- [Skills](/fr/tools/skills) pour l’ordre de chargement, la priorité et la visibilité
- [Création de Skills](/fr/tools/creating-skills) pour les principes de base de `SKILL.md`
  écrit manuellement
- [Configuration des Skills](/fr/tools/skills-config) pour le schéma complet de `skills.workshop`
- [CLI des Skills](/fr/cli/skills) pour les commandes `openclaw skills`
