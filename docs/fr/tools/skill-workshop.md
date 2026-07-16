---
read_when:
    - Vous souhaitez que l’agent crée ou mette à jour une compétence depuis le chat
    - Vous devez examiner, appliquer, rejeter ou mettre en quarantaine un brouillon de skill généré.
    - Vous configurez l’approbation, l’autonomie, le stockage ou les limites de Skill Workshop
    - Vous souhaitez comprendre où sont examinées les propositions d’auto-apprentissage
sidebarTitle: Skill Workshop
summary: Créer et mettre à jour les Skills de l’espace de travail via l’examen de Skill Workshop
title: Atelier de Skills
x-i18n:
    generated_at: "2026-07-16T13:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

L’Atelier de Skills est le processus gouverné d’OpenClaw permettant de créer et de mettre à jour les
Skills de l’espace de travail. Les agents et les opérateurs n’écrivent jamais `SKILL.md` directement par ce
processus — ils créent une **proposition** (brouillon en attente avec contenu, liaison à la
cible, état de l’analyseur, hachages et métadonnées de restauration) qui ne devient un
Skill actif qu’après son application.

L’Atelier de Skills écrit uniquement les Skills de l’espace de travail. Il ne modifie jamais les Skills
intégrés, de Plugin, de ClawHub, de racine supplémentaire, gérés, d’agent personnel ou système.

## Fonctionnement

- **Proposition d’abord :** le contenu généré est stocké sous `PROPOSAL.md`, et non
  sous `SKILL.md`.
- **L’application est la seule écriture active :** la création, la mise à jour et la révision ne modifient jamais
  les Skills actifs.
- **Limité à l’espace de travail :** les créations ciblent la racine `skills/` de l’espace de travail ; les mises à jour
  sont autorisées uniquement pour les Skills d’espace de travail accessibles en écriture.
- **Aucun écrasement :** la création échoue si le Skill cible existe déjà.
- **Lié par hachage :** les propositions de mise à jour sont liées au hachage actuel de la cible et passent
  à l’état `stale` si le Skill actif change avant l’application.
- **Soumis à l’analyseur :** l’application relance l’analyseur de sécurité avant toute écriture.
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

Le Gateway suit l’utilisation agrégée des Skills dans la base de données d’état partagée. Une fois par
jour, il examine les Skills créés et appliqués par l’Atelier de Skills. Les Skills inutilisés pendant
plus de 30 jours deviennent `stale` ; après 90 jours, ils deviennent `archived` et sont
exclus des nouveaux instantanés de Skills des agents. Les fichiers des Skills archivés restent inchangés sur
le disque. Les Skills créés manuellement ne sont jamais gérés ; seuls les Skills créés par des
propositions de l’Atelier de Skills entrent dans la gestion du cycle de vie.

Les Skills épinglés échappent aux transitions du cycle de vie. Un Skill obsolète revient à l’état `active`
après son utilisation et l’exécution du balayage suivant. Les Skills archivés ne reviennent que par une
restauration explicite :

Les transitions du cycle de vie et les restaurations s’appliquent aux nouvelles sessions ; les sessions en cours conservent
leur instantané de Skills actuel.

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

Toutes les commandes du gestionnaire acceptent `--json`. L’état signale également les candidats de
chevauchement déterministes à titre de simples suggestions ; il ne fusionne jamais les Skills et n’appelle jamais de modèle.

## Chat

Demandez à l’agent le Skill souhaité ; il appelle `skill_workshop` et renvoie un
identifiant de proposition.

### Apprendre à partir des travaux récents

Utilisez `/learn` pour transformer la conversation actuelle ou des sources nommées en une
proposition de Skill guidée par les normes :

```text
/learn
/learn docs/runbook.md et https://example.com/guide ; se concentrer sur la récupération
```

Sans demande, `/learn` demande à l’agent d’extraire le processus réutilisable de
la conversation actuelle. Avec une demande, l’agent traite les chemins, URL, notes
collées et références à la conversation comme des sources, tout en respectant les exigences de priorité, de portée et
de nommage. Il rassemble les sources avec ses outils existants, puis appelle
`skill_workshop` avec `action: "create"`.

La proposition obtenue reste `pending` ; `/learn` ne l’applique jamais. Examinez-la et
appliquez-la au moyen du processus d’approbation normal ou avec `openclaw skills workshop`.

Créer :

```text
Créez un Skill appelé morning-catchup qui exécute ma routine de boîte de réception du lundi.
```

Mettre à jour un Skill d’espace de travail existant :

```text
Mettez à jour trip-planning afin de vérifier également les plans de cabine avant la réservation.
```

Itérer sur une proposition en attente :

```text
Montrez-moi la proposition morning-catchup.
Révisez-la afin de signaler également tout élément marqué comme urgent.
Appliquez la proposition morning-catchup.
```

Les opérations `apply`, `reject` et `quarantine` lancées par l’agent s’exécutent par défaut sans
demande d’approbation supplémentaire. Définissez `skills.workshop.approvalPolicy` sur `"pending"`
pour exiger l’approbation de l’opérateur avant ces actions.

Lorsqu’une approbation est requise, l’invite indique l’identifiant de la proposition et le
Skill cible, et affiche la description de la proposition, le nombre de fichiers complémentaires et la taille du corps.
Les demandes d’approbation sont limitées afin de se terminer avant le délai de surveillance de l’outil de l’agent. Si aucune
décision n’est reçue avant l’expiration de l’invite, l’action du cycle de vie ne s’exécute pas :
la proposition reste en attente et inchangée. Décidez ultérieurement dans l’interface de l’Atelier de Skills ou exécutez
`openclaw skills workshop apply|reject|quarantine <proposal-id>`. Les agents ne doivent
pas réessayer en boucle une action du cycle de vie ayant expiré.

## CLI

```bash
# Créer
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Rattrapage quotidien de la boîte de réception : trier, archiver, faire ressortir, rédiger, planifier" \
  --proposal ./PROPOSAL.md

# Mettre à jour un Skill d’espace de travail existant
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# Répertorier et examiner
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Réviser avant l’approbation
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Clore
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Doublon"
openclaw skills workshop quarantine <proposal-id> --reason "Nécessite un examen de sécurité"
```

Chaque sous-commande accepte `--agent <id>` (espace de travail cible ; par défaut, celui
déduit du répertoire de travail actuel, puis l’agent par défaut) et `--json` (sortie structurée).
`propose-create`, `propose-update` et `revise` acceptent également `--goal <text>` et
`--evidence <text>` pour enregistrer le contexte de la proposition avec `--proposal`.

## Contenu de la proposition

Tant qu’elle est en attente, la proposition est stockée sous `PROPOSAL.md` avec un
frontmatter propre à la proposition :

```markdown
---
name: "morning-catchup"
description: "Rattrapage quotidien de la boîte de réception : trier, archiver, faire ressortir, rédiger, planifier"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

Lors de l’application, l’Atelier de Skills écrit le `SKILL.md` actif et supprime les
champs propres à la proposition : `status`, `version` de la proposition et `date` de la proposition.

## Fichiers complémentaires

Utilisez `--proposal-dir` lorsque le Skill proposé nécessite des fichiers à côté de
`PROPOSAL.md` :

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Bilan du vendredi : statistiques, faits marquants, trois principales priorités de la semaine prochaine" \
  --proposal-dir ./weekly-update-proposal
```

Le répertoire doit contenir `PROPOSAL.md`. Les fichiers complémentaires doivent se trouver sous
`assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. L’Atelier de
Skills les analyse, les hache et les stocke avec la proposition, puis les écrit
à côté du `SKILL.md` actif uniquement lors de l’application.

Chemins de fichiers complémentaires rejetés : chemins absolus, segments de chemin masqués, traversée de
répertoires, chemins qui se chevauchent, fichiers exécutables, texte non UTF-8, octets nuls
et chemins situés hors des dossiers complémentaires standard.

## Outil de l’agent

Le modèle utilise `skill_workshop` avec un paramètre `action` obligatoire :
`create | update | revise | list | inspect | apply | reject | quarantine`.
Les autres paramètres s’appliquent selon l’action :

| Paramètre                  | Utilisé par                                           | Remarques                                                             |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | Obligatoire pour `create` ; sinon, résout une proposition en attente par son nom |
| `description`              | `create`, `update`, `revise`                         | 160 octets maximum                                                    |
| `skill_name`               | `update`                                             | Nom ou clé du Skill existant                                          |
| `proposal_content`         | `create`, `update`, `revise`                         | Stocké sous `PROPOSAL.md` ; limité par `skills.workshop.maxSkillBytes` |
| `support_files`            | `create`, `update`, `revise`                         | Tableau de `{ path, content }`                                         |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | Contexte en texte libre                                               |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | Proposition cible                                                     |
| `reason`                   | `apply`, `reject`, `quarantine`                      | Facultatif                                                            |
| `query`, `status`, `limit` | `list`                                               | Filtrer/paginer ; `limit` maximum 50, valeur par défaut 20 |

Les agents doivent utiliser `skill_workshop` pour les travaux de génération de Skills. Ils ne doivent pas
créer ni modifier les fichiers de proposition au moyen de `write`, `edit`, `exec`, de commandes
shell ou d’opérations directes sur le système de fichiers.

<Note>
`skill_workshop` est un outil d’agent intégré inclus dans
`tools.profile: "coding"`. Si une politique plus stricte le masque, ajoutez
`skill_workshop` à la liste `tools.allow` active, ou utilisez
`tools.alsoAllow: ["skill_workshop"]` lorsque la portée utilise un profil sans
`tools.allow` explicite. Les exécutions en bac à sable ne construisent pas l’outil
Atelier de Skills côté hôte ; exécutez donc les actions d’examen des propositions depuis une session
d’agent normale côté hôte ou depuis la CLI.
</Note>

## Skills suggérés

OpenClaw détecte les instructions durables telles que « la prochaine fois », « n’oubliez pas de » et les corrections réactives
à la fin d’un tour interactif, y compris les tours ayant échoué. Au tour suivant, l’agent propose d’enregistrer
le processus détecté le plus récent au moyen de `skill_workshop` ; l’utilisateur décide s’il faut créer une
proposition. Cette suggestion intégrée ne crée ni ne modifie aucun Skill par elle-même. Activez
`skills.workshop.autonomous.enabled` pour créer directement des propositions en attente à la place. Dans l’interface de
contrôle, l’onglet Atelier propose le même réglage sous forme de bouton **Auto-apprentissage** dans l’en-tête de la page, ainsi
que sous forme de bouton d’activation sur le tableau de propositions vide.

### Analyser les sessions précédentes

L’interface de contrôle peut examiner des travaux plus anciens sans activer l’auto-apprentissage autonome.
Ouvrez **Plugins → Atelier** et sélectionnez **Rechercher des idées de Skills**. L’analyse commence par
les sessions admissibles les plus récentes et examine une fenêtre limitée de travaux substantiels.
Elle ignore les sessions Cron, Heartbeat, de hook, de sous-agent, ACP, appartenant à un Plugin et d’examen
interne, ainsi que les conversations comportant moins de six tours du modèle.

Le réviseur utilise le modèle configuré de l’agent sélectionné et reçoit un ensemble de transcriptions
dont les secrets ont été masqués et dont la taille est limitée. Il applique le même seuil prudent
que l’examen de l’expérience : un modèle de récupération concret ou une procédure stable qui
éliminerait au moins deux futurs appels au modèle ou aux outils. Les travaux courants et les faits
ponctuels ne doivent produire aucune proposition.

Une analyse peut créer ou réviser au maximum trois propositions en attente. Elle ne peut ni appliquer,
ni rejeter, ni mettre en quarantaine, ni modifier un Skill actif. L’Atelier affiche la couverture cumulée,
par exemple **20 sessions examinées · 18 juin–aujourd’hui · 2 idées trouvées**. Sélectionnez
**Analyser des travaux antérieurs** pour continuer à partir du curseur persistant de la session la plus ancienne. Une fois
l’historique disponible épuisé, l’action devient **Analyser les nouveaux travaux**.

L’examen historique est manuel même lorsque
`skills.workshop.autonomous.enabled` vaut `false`. Chaque clic lance une exécution du modèle ;
les tarifs et les conditions de traitement des données du fournisseur s’appliquent donc. Le curseur et les nombres d’éléments couverts
sont stockés dans la base de données d’état partagée d’OpenClaw ; le contenu des transcriptions n’est pas copié
dans l’état de l’analyse.

Lorsque la capture autonome est activée, OpenClaw peut également effectuer un examen prudent après un travail
substantiel réussi et une fois que l’ensemble du système d’agents devient inactif. Cet examen isolé peut créer ou
réviser au plus une proposition en attente. Il ne peut pas mettre à jour une compétence active ni appliquer, rejeter ou mettre en quarantaine une
proposition, même lorsque `approvalPolicy` vaut `"auto"`.

Consultez [Auto-apprentissage](/tools/self-learning) pour en savoir plus sur l’activation, l’admissibilité, la confidentialité et les coûts,
le seuil de proposition et la résolution des problèmes.

## Approbation et autonomie

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| Paramètre                  | Valeur par défaut | Effet                                                                                                                                                              |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autonomous.enabled`       | `false`  | Crée des propositions en attente à partir de corrections explicites et, après un délai d’inactivité, d’un travail substantiel achevé offrant une récupération réutilisable ou des gains significatifs sur le cycle complet. |
| `allowSymlinkTargetWrites` | `false`  | Permet à l’application d’écrire par l’intermédiaire des liens symboliques des compétences de l’espace de travail dont la cible réelle figure dans `skills.load.allowSymlinkTargets`. |
| `approvalPolicy`           | `"auto"` | `"auto"` ignore une invite supplémentaire pour les opérations `apply`, `reject` ou `quarantine` lancées par l’agent (l’agent doit toujours appeler l’action). `"pending"` exige une approbation. |
| `maxPending`               | `50`     | Limite le nombre de propositions en attente et mises en quarantaine par espace de travail (1-200). |
| `maxSkillBytes`            | `40000`  | Limite la taille du corps d’une proposition en octets (1024-200000). |

La capture autonome reconnaît les règles prospectives (par exemple, « à partir de maintenant ») et les
corrections réactives (par exemple, « ce n’est pas ce que j’ai demandé »). Elle regroupe les nouvelles instructions par sujet dans
un maximum de trois propositions par tour, achemine les correspondances de vocabulaire vers les compétences existantes et modifiables de l’espace de travail, et
révise sa propre proposition en attente lorsqu’une autre correction cible la même compétence.

Pour un travail substantiel réussi sans correction explicite, une exécution isolée du modèle sélectionné
détermine si la trajectoire achevée atteint le seuil prudent de proposition. Le modèle
au premier plan n’est pas invité à apprendre avant de répondre. Le réviseur en arrière-plan conserve
l’exécution au premier plan comme provenance de la proposition, ne peut pas accéder aux outils généraux de l’agent et ne peut pas prendre de décisions
concernant le cycle de vie. L’examen ne commence que lorsque l’environnement d’exécution au premier plan indique à la fois son modèle résolu exact
et que `skill_workshop` était effectivement disponible. Une politique d’outils restrictive ou inconnue
échoue donc de manière fermée et ne crée aucune proposition.

Consultez [Auto-apprentissage](/tools/self-learning) pour connaître le comportement complet de l’examen autonome et son modèle
de sécurité.

Les descriptions de propositions sont toujours limitées à 160 octets, indépendamment de
`maxSkillBytes`.

## Méthodes du Gateway

| Méthode                            | Portée           |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
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

`requestRevision` est propre au Gateway (sans équivalent dans la CLI ni dans les outils de l’agent) : cette méthode
transmet des instructions de révision en texte libre à la session de discussion de l’agent propriétaire
au lieu de remplacer directement `PROPOSAL.md`, pour les interfaces utilisateur qui demandent à l’agent de
réviser plutôt que d’envoyer littéralement un nouveau contenu.

`historyStatus` et `historyScan` sont des méthodes de prise en charge de l’interface de contrôle. `historyScan`
accepte `direction: "older" | "newer"` ; cette méthode laisse toujours les résultats sous forme de
propositions en attente.

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
- `PROPOSAL.md` : proposition de compétence en attente.
- `rollback.json` : métadonnées de récupération écrites avant que l’application ne modifie les fichiers actifs.

## Limites

| Limite                          | Valeur                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| Description                     | 160 octets                                                           |
| Corps de la proposition         | `skills.workshop.maxSkillBytes` (40 000 par défaut ; plafond absolu de 1 MiB) |
| Fichiers complémentaires        | 64 par proposition                                                   |
| Taille des fichiers complémentaires | 256 KiB chacun, 2 MiB au total                                  |
| Propositions en attente et mises en quarantaine | `skills.workshop.maxPending` par espace de travail (50 par défaut) |

## Résolution des problèmes

| Problème                                       | Résolution                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | Raccourcissez `description` à 160 octets ou moins. |
| `Skill proposal content is too large`          | Raccourcissez le corps de la proposition ou augmentez `skills.workshop.maxSkillBytes`. |
| `Target skill changed after proposal creation` | Révisez la proposition par rapport à la cible actuelle ou créez une nouvelle proposition. |
| `Proposal scan failed`                         | Examinez les résultats de l’analyse, puis révisez ou mettez en quarantaine la proposition. |
| `untrusted symlink target`                     | Configurez `skills.load.allowSymlinkTargets` et activez `skills.workshop.allowSymlinkTargetWrites` uniquement pour les racines de compétences partagées intentionnellement. |
| `Support file paths must be under one of...`   | Déplacez les fichiers complémentaires sous `assets/`, `examples/`, `references/`, `scripts/` ou `templates/`. |
| La proposition n’apparaît pas dans la liste   | Vérifiez l’espace de travail `--agent` sélectionné et `OPENCLAW_STATE_DIR`. |
| L’agent ne peut pas appeler `skill_workshop` | Vérifiez la politique d’outils active et le mode d’exécution. `coding` inclut l’outil ; les politiques `tools.allow` restrictives doivent le répertorier explicitement, et les exécutions en bac à sable doivent utiliser une session d’agent normale côté hôte ou la CLI. |

### Diagnostic de la politique d’outils

Lorsque la capture autonome est activée, `openclaw doctor` exécute la
vérification `core/doctor/skill-workshop-tool-policy` pour l’agent par défaut. Si la politique
masque `skill_workshop`, l’avertissement indique la première couche de configuration qui l’exclut ainsi que
la modification exacte de `allow` ou `alsoAllow` à effectuer. Les anciens guides d’exploitation peuvent encore utiliser
`openclaw plugins inspect skill-workshop` ; cette commande explique désormais que l’atelier de compétences
est intégré et affiche la même indication concernant la politique, le cas échéant.

## Ressources connexes

- [Skills](/fr/tools/skills) pour l’ordre de chargement, la priorité et la visibilité
- [Auto-apprentissage](/tools/self-learning) pour les propositions prudentes de compétences après exécution
- [Création de compétences](/fr/tools/creating-skills) pour les principes de base de `SKILL.md`
  rédigé manuellement
- [Configuration des compétences](/fr/tools/skills-config) pour le schéma `skills.workshop` complet
- [CLI des compétences](/fr/cli/skills) pour les commandes `openclaw skills`
