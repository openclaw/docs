---
read_when:
    - Vous souhaitez qu’OpenClaw apprenne des procédures réutilisables à partir de conversations terminées
    - Vous décidez d’activer ou non les propositions autonomes de Skills
    - Vous devez comprendre la sécurité, le coût, l’éligibilité ou le dépannage de l’auto-apprentissage.
sidebarTitle: Self-learning
summary: Laissez OpenClaw proposer des Skills réutilisables à partir des corrections et des travaux substantiels achevés
title: Auto-apprentissage
x-i18n:
    generated_at: "2026-07-16T13:53:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

L’auto-apprentissage permet à OpenClaw de transformer des éléments probants utiles issus des conversations en propositions en attente dans le
[Skill Workshop](/fr/tools/skill-workshop). Il n’entraîne pas les poids du modèle,
ne modifie pas les Skills actifs et ne change pas silencieusement le comportement de l’agent. Chaque
procédure apprise reste en attente jusqu’à ce qu’un opérateur l’examine et l’applique.

L’auto-apprentissage est **désactivé par défaut**. Activez-le uniquement lorsqu’une
exécution supplémentaire du modèle en arrière-plan et l’examen de la transcription sont appropriés pour votre espace de travail.

## Activer l’auto-apprentissage

Dans l’interface de contrôle, ouvrez **Plugins → Workshop** et activez **Self-learning**. La
modification prend effet immédiatement ; lorsqu’un autre processus d’écriture de configuration a mis à jour le
fichier, l’interface de contrôle actualise l’instantané de configuration et réessaie d’actionner le commutateur sans
recharger la page ni le Gateway.

Utilisez la CLI :

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Ou modifiez `~/.openclaw/openclaw.json` :

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Désactivez-le à nouveau avec :

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

La création de Skills demandée par l’utilisateur, `/learn` et les opérations manuelles du Skill Workshop
continuent de fonctionner lorsque l’auto-apprentissage est désactivé.

## Examiner manuellement les sessions précédentes

L’examen manuel de l’historique est l’alternative prudente à la capture autonome.
Ouvrez **Plugins → Workshop** dans l’interface de contrôle et sélectionnez **Find skill ideas**.
Cela ne modifie pas `skills.workshop.autonomous.enabled`.

Chaque analyse :

- commence par les sessions non examinées les plus récentes et remonte dans le temps ;
- examine jusqu’à 20 sessions substantielles comportant au moins six tours du modèle ;
- ignore les sessions Cron, Heartbeat, de hook, de sous-agent, ACP, détenues par un Plugin et d’examen
  interne ;
- masque les secrets reconnus et limite le paquet de transcriptions avant de l’envoyer
  au modèle configuré de l’agent sélectionné ;
- applique les mêmes critères stricts que l’examen autonome de l’expérience ; et
- peut créer ou réviser au maximum trois propositions en attente, jamais des Skills actifs.

Le Workshop indique le nombre cumulé de sessions, la période couverte et les idées trouvées.
Sélectionnez **Scan earlier work** pour la fenêtre antérieure suivante. Lorsque le curseur atteint
le début de l’historique admissible, l’action devient **Scan new work**.
OpenClaw ne conserve que le curseur et les métadonnées de couverture dans la base de données d’état partagée ;
il ne crée pas une seconde archive de transcriptions.

Les sessions ne sont analysées que lorsqu’OpenClaw peut prouver leur propriété et exclure
le contenu provenant de hooks externes. Après une mise à niveau, la transcription actuelle antérieure à la mise à niveau peut
être classée localement, mais les transcriptions antérieures à la mise à niveau ayant fait l’objet d’une rotation et dépourvues de provenance
par exécution sont ignorées. Les nouvelles transcriptions conservent cette provenance après rotation.

Les analyses manuelles entraînent tout de même un coût auprès du fournisseur de modèles et envoient le contenu
admissible des conversations au fournisseur configuré. Ne les utilisez que lorsque cet examen respecte les
exigences de l’espace de travail en matière de confidentialité et de traitement des données.

## Ce qu’OpenClaw peut apprendre

L’auto-apprentissage suit deux voies prudentes :

1. **Instructions directes et corrections.** OpenClaw détecte les formulations durables
   telles que « dorénavant », « la prochaine fois », ainsi que les corrections apportées à une approche ayant échoué.
   Lorsque l’auto-apprentissage est activé, il peut transformer ces signaux en propositions en attente
   sans attendre une autre requête. Cette voie déterministe peut regrouper des
   instructions liées dans un maximum de trois propositions, cibler un Skill modifiable de l’espace de travail
   ou réviser sa propre proposition en attente associée. Elle s’exécute également après les tours ayant échoué,
   car elle capture les instructions de l’utilisateur plutôt que d’évaluer l’achèvement.
2. **Examen de l’expérience.** Après un tour de premier plan réussi et substantiel,
   OpenClaw peut examiner le travail achevé afin d’identifier une technique de récupération réutilisable ou
   une procédure stable qui éviterait au moins deux futurs allers-retours avec le
   modèle ou les outils.

Les bons candidats comprennent :

- une récupération fiable après des échecs répétés d’un outil ou d’un modèle ;
- une contrainte d’ordre non évidente qui a empêché une erreur récurrente ;
- un workflow stable en plusieurs étapes ayant nécessité des recherches répétées ; ou
- une vérification préalable réutilisable qui éviterait plusieurs futurs appels.

L’examinateur doit s’abstenir pour les tâches routinières réussies, les demandes ponctuelles,
les faits personnels, les préférences simples, les défaillances temporaires de l’environnement, les conseils
génériques, les affirmations négatives non étayées et les secrets.

## Quand l’examen de l’expérience s’exécute

L’examen de l’expérience est volontairement différé et limité :

- Le tour de premier plan doit se terminer avec succès.
- Le tour actuel doit comporter au moins dix itérations du modèle.
- Les sessions Cron, Heartbeat, de mémoire, de dépassement, de hook, de sous-agent et d’examen sont
  exclues.
- L’exécution de premier plan doit avoir résolu un fournisseur et un modèle et doit réellement
  avoir eu accès à `skill_workshop`.
- OpenClaw attend 30 secondes après l’achèvement. Un achèvement ultérieur au premier plan dans
  la même session redémarre cette période de calme.
- Si une exécution d’agent ou de réponse est encore active, l’examen attend 30 secondes supplémentaires.
- Un seul examen de l’expérience s’exécute à la fois.
- L’examen différé est une tâche locale au processus du Gateway. Le Gateway doit continuer de s’exécuter
  pendant la fenêtre d’inactivité ; les environnements d’exécution locaux ponctuels et ceux adossés à la CLI ne conservent pas
  suffisamment de contexte sur la trajectoire et la disponibilité des outils pour le planifier.

La réponse de premier plan n’est jamais retardée par l’apprentissage. Un tour ayant échoué ou non admissible
ne déclenche pas l’examen de l’expérience, bien que les corrections directes de l’utilisateur puissent
toujours être proposées comme suggestion lorsque l’autonomie est désactivée.

## Ce que reçoit l’examinateur

L’examinateur en arrière-plan ne reçoit que le tour actuel, à partir de son message utilisateur
le plus récent. La trajectoire rendue est limitée à 60,000 caractères ;
si nécessaire, OpenClaw conserve le premier message et les éléments probants les plus récents, et
signale la partie centrale omise.

L’examinateur réutilise le fournisseur et le modèle résolus. Il réutilise le profil
d’authentification du premier plan lorsque cette identité est disponible et désactive les solutions de repli du modèle. L’examen
démarre donc une exécution supplémentaire du modèle auprès du fournisseur configuré.
Cette exécution peut effectuer plusieurs requêtes auprès du fournisseur lorsqu’elle inspecte ou rédige une
proposition. Les tarifs et les conditions de traitement des données du fournisseur s’appliquent comme pour le
tour de premier plan.

Avant de commencer, OpenClaw recharge la configuration actuelle de l’environnement d’exécution et vérifie à nouveau la
sandbox effective et la politique des outils de la conversation d’origine. Si l’exécution est
dans une sandbox, si la politique n’autorise plus `skill_workshop` ou si des informations requises sur l’environnement d’exécution
sont manquantes, l’examen échoue de manière sécurisée et ne crée rien.

<Warning>
  L’activation de l’auto-apprentissage autorise l’envoi au fournisseur du modèle
  sélectionné, pour un examen supplémentaire, du contenu admissible des conversations, y compris les entrées
  et les résultats des outils du tour actuel. Ne l’activez pas dans un espace de travail où
  cet examen contreviendrait aux exigences de traitement des données.
</Warning>

## Sécurité des propositions

L’examinateur s’exécute dans une session isolée avec une surface d’outils volontairement
restreinte :

- Il peut uniquement répertorier ou inspecter les propositions du Workshop et créer ou réviser une
  proposition en attente.
- Il ne peut pas mettre à jour un Skill actif, appliquer une proposition, rejeter une proposition, placer
  une proposition en quarantaine, envoyer un message ni utiliser les outils généraux de l’agent.
- Un même budget de mutation est partagé entre les nouvelles tentatives du modèle ; un examen peut donc créer ou
  réviser au maximum une proposition.
- La trajectoire examinée est traitée comme un élément probant non fiable, et non comme des instructions
  destinées à l’agent en arrière-plan.
- Le Skill Workshop analyse le contenu des propositions et rejette les identifiants littéraux
  reconnus avant l’écriture de l’état de la proposition.

Les limites normales du Workshop continuent de s’appliquer, notamment `maxPending`, `maxSkillBytes`,
les restrictions relatives aux fichiers d’accompagnement, les vérifications de l’analyseur et les écritures limitées à l’espace de travail. Le
paramètre `approvalPolicy: "auto"` n’accorde pas à l’examinateur en arrière-plan l’accès
aux actions du cycle de vie.

## Examiner les propositions apprises

L’auto-apprentissage produit les mêmes propositions en attente que l’utilisation manuelle du Workshop.
Inspectez-les avant de les appliquer :

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Révisez, rejetez ou placez en quarantaine les propositions utiles mais qui ne sont pas prêtes :

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Too specific"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

L’application est la seule opération qui écrit un `SKILL.md` actif. Consultez
[Skill Workshop](/fr/tools/skill-workshop) pour le cycle de vie complet et le modèle de
stockage.

## Configuration

| Paramètre                                  | Valeur par défaut | Effet sur l’auto-apprentissage                                                                                                    |
| ------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Active la capture des corrections directes et l’examen différé de l’expérience.                                                   |
| `skills.workshop.approvalPolicy`           | `"auto"` | Contrôle les demandes d’approbation pour les actions normales du cycle de vie lancées par l’agent ; n’étend pas les autorisations de l’examinateur en arrière-plan. |
| `skills.workshop.maxPending`               | `50`     | Limite le nombre de propositions en attente et en quarantaine par espace de travail.                                              |
| `skills.workshop.maxSkillBytes`            | `40000`  | Limite la taille du corps des propositions en octets.                                                                             |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Affecte uniquement le comportement d’application ; l’auto-apprentissage écrit l’état des propositions, et non les cibles de Skills actifs. |

Pour le schéma exhaustif, les plages et les paramètres de Skills associés, consultez
[Configuration des Skills](/fr/tools/skills-config#workshop-skills-workshop).

## Résolution des problèmes

### Aucune proposition n’apparaît après un long tour

Vérifiez tous les points suivants :

1. `skills.workshop.autonomous.enabled` vaut `true` dans la configuration active du Gateway.
2. Le tour a réussi et comportait au moins dix itérations du modèle après le
   message utilisateur le plus récent.
3. La conversation était une exécution normale au premier plan, et non une exécution planifiée, de mémoire,
   de hook ou de sous-agent.
4. L’exécution d’origine avait accès à `skill_workshop` et ne se trouvait pas dans une sandbox.
5. Le système est resté inactif suffisamment longtemps pour permettre l’examen différé.
6. Le processus Gateway de longue durée est resté actif pendant la fenêtre d’inactivité ; une
   commande locale ponctuelle n’attend pas l’examen différé.

Un examen admissible peut néanmoins ne produire aucune proposition. L’abstention est le résultat
attendu lorsque les éléments probants ne satisfont pas aux critères d’une procédure réutilisable.

### Doctor signale que l’outil Workshop est masqué

Lorsque l’auto-apprentissage est activé, `openclaw doctor` vérifie si la politique
effective des outils de l’agent par défaut autorise `skill_workshop`. Appliquez la modification
`tools.allow` ou `tools.alsoAllow` indiquée, ou désactivez l’auto-apprentissage.

### Trop de propositions de faible valeur apparaissent

Désactivez l’auto-apprentissage et continuez à utiliser `/learn` ou des demandes explicites au Workshop :

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Les propositions en attente restent examinables après la désactivation de la fonctionnalité. La désactivation
de l’auto-apprentissage ne les applique, ne les rejette et ne les supprime pas.

## Contenu associé

- [Atelier de Skills](/fr/tools/skill-workshop) pour l’examen, l’approbation et
  le stockage des propositions
- [Création de Skills](/fr/tools/creating-skills) pour les Skills créées manuellement et
  la structure `SKILL.md`
- [Configuration des Skills](/fr/tools/skills-config) pour tous les paramètres `skills.*`
- [CLI des Skills](/fr/cli/skills) pour les commandes de l’atelier et du conservateur
