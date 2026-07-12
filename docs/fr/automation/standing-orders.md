---
read_when:
    - Configuration de workflows d’agents autonomes s’exécutant sans invite pour chaque tâche
    - Définir ce que l’agent peut faire de manière autonome et ce qui nécessite une approbation humaine
    - Structurer des agents multiprogrammes avec des limites et des règles d’escalade claires
summary: Définir une autorité opérationnelle permanente pour les programmes d’agents autonomes
title: Ordres permanents
x-i18n:
    generated_at: "2026-07-12T02:21:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Les ordres permanents accordent à votre agent une **autorité opérationnelle permanente** pour des programmes définis. Au lieu de solliciter l’agent pour chaque tâche, vous définissez des programmes avec un périmètre, des déclencheurs et des règles d’escalade clairs, puis l’agent s’exécute de manière autonome dans ces limites : « Vous êtes responsable du rapport hebdomadaire. Compilez-le chaque vendredi, envoyez-le et ne faites remonter la situation que si quelque chose semble anormal. »

## Pourquoi utiliser des ordres permanents

**Sans ordres permanents :** vous sollicitez l’agent pour chaque tâche, les activités courantes sont oubliées ou retardées, et vous devenez le goulot d’étranglement.

**Avec des ordres permanents :** l’agent s’exécute de manière autonome dans des limites définies, les activités courantes sont effectuées selon le calendrier prévu, et vous n’intervenez que pour les exceptions et les approbations.

## Fonctionnement

Les ordres permanents sont définis dans les fichiers de votre [espace de travail de l’agent](/fr/concepts/agent-workspace). L’approche recommandée consiste à les inclure directement dans `AGENTS.md` (qui est injecté automatiquement à chaque session), afin que l’agent les ait toujours dans son contexte. Pour les configurations plus volumineuses, vous pouvez également les placer dans un fichier dédié, tel que `standing-orders.md`, et le référencer depuis `AGENTS.md`.

Chaque programme précise :

1. **Périmètre** - ce que l’agent est autorisé à faire
2. **Déclencheurs** - quand l’exécuter (calendrier, événement ou condition)
3. **Points de contrôle d’approbation** - ce qui nécessite une validation humaine avant d’agir
4. **Règles d’escalade** - quand s’arrêter et demander de l’aide

L’agent charge ces instructions à chaque session par l’intermédiaire des fichiers d’amorçage de l’espace de travail (consultez [Espace de travail de l’agent](/fr/concepts/agent-workspace) pour obtenir la liste complète des fichiers injectés automatiquement) et les exécute en association avec les [tâches Cron](/fr/automation/cron-jobs) pour garantir leur application selon un calendrier.

<Tip>
Placez les ordres permanents dans `AGENTS.md` afin de garantir leur chargement à chaque session. L’amorçage de l’espace de travail injecte automatiquement `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et `MEMORY.md`, mais pas les fichiers arbitraires situés dans des sous-répertoires.
</Tip>

## Anatomie d’un ordre permanent

```markdown
## Programme : Rapport d’état hebdomadaire

**Autorité :** Compiler les données, générer le rapport et le transmettre aux parties prenantes
**Déclencheur :** Chaque vendredi à 16 h (appliqué par une tâche Cron)
**Point de contrôle d’approbation :** Aucun pour les rapports standards. Signaler les anomalies pour examen humain.
**Escalade :** Si la source de données est indisponible ou si les métriques semblent inhabituelles (>2σ par rapport à la norme)

### Étapes d’exécution

1. Récupérer les métriques depuis les sources configurées
2. Les comparer à la semaine précédente et aux objectifs
3. Générer le rapport dans Reports/weekly/YYYY-MM-DD.md
4. Transmettre le résumé par le canal configuré
5. Consigner l’achèvement dans Agent/Logs/

### Ce qu’il ne faut PAS faire

- Ne pas envoyer les rapports à des parties externes
- Ne pas modifier les données sources
- Ne pas omettre l’envoi si les métriques sont mauvaises : les présenter avec exactitude
```

## Ordres permanents et tâches Cron

Les ordres permanents définissent **ce que** l’agent est autorisé à faire. Les [tâches Cron](/fr/automation/cron-jobs) définissent **quand** cela se produit. Ils fonctionnent ensemble :

```text
Ordre permanent : « Vous êtes responsable du tri quotidien de la boîte de réception »
    ↓
Tâche Cron (tous les jours à 8 h) : « Effectuer le tri de la boîte de réception conformément aux ordres permanents »
    ↓
Agent : Lit les ordres permanents → exécute les étapes → communique les résultats
```

L’invite de la tâche Cron doit référencer l’ordre permanent plutôt que de le dupliquer :

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Exemples

### Exemple 1 : contenu et réseaux sociaux (cycle hebdomadaire)

```markdown
## Programme : Contenu et réseaux sociaux

**Autorité :** Rédiger du contenu, programmer des publications et compiler les rapports d’engagement
**Point de contrôle d’approbation :** Toutes les publications nécessitent l’examen du propriétaire pendant les 30 premiers jours, puis bénéficient d’une approbation permanente
**Déclencheur :** Cycle hebdomadaire (examen le lundi → brouillons en milieu de semaine → synthèse le vendredi)

### Cycle hebdomadaire

- **Lundi :** Examiner les métriques des plateformes et l’engagement de l’audience
- **Mardi à jeudi :** Rédiger des publications pour les réseaux sociaux et créer du contenu de blog
- **Vendredi :** Compiler la synthèse marketing hebdomadaire → la transmettre au propriétaire

### Règles relatives au contenu

- Le ton doit correspondre à la marque (consultez SOUL.md ou le guide de ton de la marque)
- Ne jamais se présenter comme une IA dans le contenu destiné au public
- Inclure les métriques lorsqu’elles sont disponibles
- Se concentrer sur la valeur apportée à l’audience, et non sur l’autopromotion
```

### Exemple 2 : opérations financières (déclenchées par un événement)

```markdown
## Programme : Traitement financier

**Autorité :** Traiter les données de transaction, générer des rapports et envoyer des résumés
**Point de contrôle d’approbation :** Aucun pour l’analyse. Les recommandations nécessitent l’approbation du propriétaire.
**Déclencheur :** Détection d’un nouveau fichier de données OU cycle mensuel planifié

### Lors de l’arrivée de nouvelles données

1. Détecter le nouveau fichier dans le répertoire d’entrée désigné
2. Analyser et catégoriser toutes les transactions
3. Les comparer aux objectifs budgétaires
4. Signaler : les éléments inhabituels, les dépassements de seuil et les nouveaux frais récurrents
5. Générer le rapport dans le répertoire de sortie désigné
6. Transmettre le résumé au propriétaire par le canal configuré

### Règles d’escalade

- Élément unique > 500 $ : alerte immédiate
- Catégorie dépassant le budget de 20 % : la signaler dans le rapport
- Transaction non identifiable : demander sa catégorisation au propriétaire
- Échec du traitement après 2 nouvelles tentatives : signaler l’échec, ne pas faire de supposition
```

### Exemple 3 : surveillance et alertes (en continu)

```markdown
## Programme : Surveillance du système

**Autorité :** Vérifier l’état du système, redémarrer les services et envoyer des alertes
**Point de contrôle d’approbation :** Redémarrer automatiquement les services. Faire remonter la situation si le redémarrage échoue deux fois.
**Déclencheur :** À chaque cycle Heartbeat

### Vérifications

- Les points de terminaison d’état des services répondent
- L’espace disque est supérieur au seuil
- Les tâches en attente ne sont pas obsolètes (>24 heures)
- Les canaux de livraison sont opérationnels

### Matrice de réponse

| Condition          | Action                                      | Faire remonter ?                  |
| ------------------ | ------------------------------------------- | --------------------------------- |
| Service indisponible | Redémarrer automatiquement                | Seulement si le redémarrage échoue 2 fois |
| Espace disque < 10 % | Alerter le propriétaire                   | Oui                               |
| Tâche obsolète > 24 h | Envoyer un rappel au propriétaire         | Non                               |
| Canal hors ligne     | Consigner et réessayer au prochain cycle   | S’il reste hors ligne > 2 heures  |
```

## Modèle Exécuter-Vérifier-Rendre compte

Les ordres permanents sont plus efficaces lorsqu’ils sont associés à une discipline d’exécution stricte. Chaque tâche d’un ordre permanent doit suivre cette boucle :

1. **Exécuter** - Effectuer réellement le travail (ne pas se contenter d’accuser réception de l’instruction)
2. **Vérifier** - Confirmer que le résultat est correct (le fichier existe, le message a été transmis, les données ont été analysées)
3. **Rendre compte** - Indiquer au propriétaire ce qui a été fait et vérifié

```markdown
### Règles d’exécution

- Chaque tâche suit le modèle Exécuter-Vérifier-Rendre compte. Aucune exception.
- « Je vais m’en occuper » ne constitue pas une exécution. Faites-le, puis rendez compte.
- « Terminé » sans vérification n’est pas acceptable. Apportez-en la preuve.
- Si l’exécution échoue : réessayez une fois en adaptant l’approche.
- Si elle échoue encore : signalez l’échec avec un diagnostic. Ne laissez jamais un échec sans signalement.
- Ne réessayez jamais indéfiniment : 3 tentatives au maximum, puis faites remonter la situation.
```

Ce modèle évite le mode d’échec le plus courant des agents : accuser réception d’une tâche sans l’accomplir.

## Architecture à plusieurs programmes

Pour les agents qui gèrent plusieurs domaines, organisez les ordres permanents sous forme de programmes distincts aux limites claires :

```markdown
## Programme 1 : [Domaine A] (Hebdomadaire)

...

## Programme 2 : [Domaine B] (Mensuel + À la demande)

...

## Programme 3 : [Domaine C] (Selon les besoins)

...

## Règles d’escalade (Tous les programmes)

- [Critères d’escalade communs]
- [Points de contrôle d’approbation applicables à tous les programmes]
```

Chaque programme doit disposer :

- De sa propre **cadence de déclenchement** (hebdomadaire, mensuelle, événementielle ou continue)
- De ses propres **points de contrôle d’approbation** (certains programmes nécessitent davantage de supervision que d’autres)
- De **limites** claires (l’agent doit savoir où se termine un programme et où commence un autre)

## Bonnes pratiques

### À faire

- Commencer avec une autorité limitée et l’étendre à mesure que la confiance s’établit
- Définir des points de contrôle d’approbation explicites pour les actions à haut risque
- Inclure des sections « Ce qu’il ne faut PAS faire » : les limites sont aussi importantes que les autorisations
- Associer les ordres permanents à des tâches Cron pour une exécution fiable selon un calendrier
- Examiner chaque semaine les journaux de l’agent afin de vérifier que les ordres permanents sont respectés
- Mettre à jour les ordres permanents à mesure que vos besoins évoluent : ce sont des documents vivants

### À éviter

- Accorder une autorité étendue dès le premier jour (« faites ce qui vous semble le mieux »)
- Omettre les règles d’escalade : chaque programme doit comporter une clause indiquant « quand s’arrêter et demander »
- Supposer que l’agent se souviendra des instructions verbales : consignez tout dans le fichier
- Mélanger plusieurs domaines dans un même programme : utilisez des programmes distincts pour des domaines distincts
- Oublier d’imposer l’exécution avec des tâches Cron : des ordres permanents sans déclencheurs ne sont que des suggestions

## Voir aussi

- [Automatisation](/fr/automation) : aperçu de tous les mécanismes d’automatisation.
- [Tâches Cron](/fr/automation/cron-jobs) : application du calendrier des ordres permanents.
- [Hooks](/fr/automation/hooks) : scripts déclenchés par des événements du cycle de vie de l’agent.
- [Webhooks](/fr/automation/cron-jobs#webhooks) : déclencheurs d’événements HTTP entrants.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement des ordres permanents, avec la liste complète des fichiers d’amorçage injectés automatiquement (`AGENTS.md`, `SOUL.md`, etc.).
