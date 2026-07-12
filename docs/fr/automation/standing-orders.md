---
read_when:
    - Configuration de workflows d’agents autonomes s’exécutant sans invite pour chaque tâche
    - Définir ce que l’agent peut faire de manière autonome et ce qui nécessite une approbation humaine
    - Structurer des agents multiprogrammes avec des limites claires et des règles d’escalade
summary: Définir une autorité opérationnelle permanente pour les programmes d’agents autonomes
title: Ordres permanents
x-i18n:
    generated_at: "2026-07-12T15:00:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Les ordres permanents accordent à votre agent une **autorité opérationnelle permanente** pour des programmes définis. Au lieu de solliciter l’agent pour chaque tâche, vous définissez des programmes dont la portée, les déclencheurs et les règles d’escalade sont clairs, et l’agent les exécute de façon autonome dans ces limites : « Vous êtes responsable du rapport hebdomadaire. Compilez-le chaque vendredi, envoyez-le et ne procédez à une escalade que si quelque chose semble anormal. »

## Pourquoi utiliser des ordres permanents

**Sans ordres permanents :** vous sollicitez l’agent pour chaque tâche, les travaux routiniers sont oubliés ou retardés, et vous devenez le goulot d’étranglement.

**Avec des ordres permanents :** l’agent agit de façon autonome dans des limites définies, les travaux routiniers sont effectués selon le calendrier prévu, et vous n’intervenez que pour les exceptions et les approbations.

## Fonctionnement

Les ordres permanents sont définis dans les fichiers de votre [espace de travail de l’agent](/fr/concepts/agent-workspace). L’approche recommandée consiste à les inclure directement dans `AGENTS.md` (qui est injecté automatiquement à chaque session), afin que l’agent les ait toujours dans son contexte. Pour les configurations plus importantes, vous pouvez également les placer dans un fichier dédié, tel que `standing-orders.md`, et y faire référence depuis `AGENTS.md`.

Chaque programme précise :

1. **Portée** - ce que l’agent est autorisé à faire
2. **Déclencheurs** - quand l’exécuter (calendrier, événement ou condition)
3. **Points de contrôle d’approbation** - ce qui nécessite une validation humaine avant toute action
4. **Règles d’escalade** - quand s’arrêter et demander de l’aide

L’agent charge ces instructions à chaque session par l’intermédiaire des fichiers d’amorçage de l’espace de travail (consultez [Espace de travail de l’agent](/fr/concepts/agent-workspace) pour obtenir la liste complète des fichiers injectés automatiquement) et les exécute conjointement avec les [tâches Cron](/fr/automation/cron-jobs), qui garantissent leur application aux moments prévus.

<Tip>
Placez les ordres permanents dans `AGENTS.md` pour garantir leur chargement à chaque session. Le processus d’amorçage de l’espace de travail injecte automatiquement `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et `MEMORY.md`, mais pas les fichiers arbitraires situés dans des sous-répertoires.
</Tip>

## Anatomie d’un ordre permanent

```markdown
## Programme : Rapport d’état hebdomadaire

**Autorité :** Compiler les données, générer le rapport, le transmettre aux parties prenantes
**Déclencheur :** Chaque vendredi à 16 h (application garantie par une tâche Cron)
**Point de contrôle d’approbation :** Aucun pour les rapports standard. Signaler les anomalies pour qu’elles soient examinées par une personne.
**Escalade :** Si la source de données est indisponible ou si les métriques semblent inhabituelles (>2σ par rapport à la norme)

### Étapes d’exécution

1. Récupérer les métriques depuis les sources configurées
2. Les comparer à celles de la semaine précédente et aux objectifs
3. Générer le rapport dans Reports/weekly/YYYY-MM-DD.md
4. Transmettre le résumé par le canal configuré
5. Consigner l’achèvement dans Agent/Logs/

### Ce qu’il ne faut PAS faire

- Ne pas envoyer de rapports à des tiers externes
- Ne pas modifier les données sources
- Ne pas ignorer la transmission si les métriques sont mauvaises : les présenter avec exactitude
```

## Ordres permanents et tâches Cron

Les ordres permanents définissent **ce que** l’agent est autorisé à faire. Les [tâches Cron](/fr/automation/cron-jobs) définissent **quand** cela se produit. Ils fonctionnent ensemble :

```text
Ordre permanent : « Vous êtes responsable du tri quotidien de la boîte de réception »
    ↓
Tâche Cron (tous les jours à 8 h) : « Exécuter le tri de la boîte de réception conformément aux ordres permanents »
    ↓
Agent : Lit les ordres permanents → exécute les étapes → rend compte des résultats
```

L’invite de la tâche Cron doit faire référence à l’ordre permanent plutôt que de le dupliquer :

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Exécutez le tri quotidien de la boîte de réception conformément aux ordres permanents. Recherchez les nouvelles alertes dans les e-mails. Analysez, catégorisez et conservez chaque élément. Envoyez un résumé au responsable. Procédez à une escalade pour les éléments inconnus."
```

## Exemples

### Exemple 1 : contenu et réseaux sociaux (cycle hebdomadaire)

```markdown
## Programme : Contenu et réseaux sociaux

**Autorité :** Rédiger du contenu, planifier des publications, compiler des rapports d’engagement
**Point de contrôle d’approbation :** Toutes les publications doivent être examinées par le responsable pendant les 30 premiers jours, puis elles bénéficient d’une approbation permanente
**Déclencheur :** Cycle hebdomadaire (examen le lundi → brouillons en milieu de semaine → synthèse le vendredi)

### Cycle hebdomadaire

- **Lundi :** Examiner les métriques des plateformes et l’engagement de l’audience
- **Du mardi au jeudi :** Rédiger des publications pour les réseaux sociaux et créer du contenu de blog
- **Vendredi :** Compiler la synthèse marketing hebdomadaire → la transmettre au responsable

### Règles relatives au contenu

- Le ton doit correspondre à la marque (consultez SOUL.md ou le guide du ton de la marque)
- Ne jamais se présenter comme une IA dans du contenu destiné au public
- Inclure des métriques lorsqu’elles sont disponibles
- Se concentrer sur la valeur apportée à l’audience, et non sur l’autopromotion
```

### Exemple 2 : opérations financières (déclenchées par un événement)

```markdown
## Programme : Traitement financier

**Autorité :** Traiter les données de transaction, générer des rapports, envoyer des résumés
**Point de contrôle d’approbation :** Aucun pour l’analyse. Les recommandations nécessitent l’approbation du responsable.
**Déclencheur :** Détection d’un nouveau fichier de données OU cycle mensuel planifié

### Lors de l’arrivée de nouvelles données

1. Détecter le nouveau fichier dans le répertoire d’entrée désigné
2. Analyser et catégoriser toutes les transactions
3. Les comparer aux objectifs budgétaires
4. Signaler : les éléments inhabituels, les dépassements de seuil et les nouveaux frais récurrents
5. Générer le rapport dans le répertoire de sortie désigné
6. Transmettre le résumé au responsable par le canal configuré

### Règles d’escalade

- Élément individuel > 500 $ : alerte immédiate
- Catégorie dépassant le budget de 20 % : la signaler dans le rapport
- Transaction non identifiable : demander au responsable de la catégoriser
- Échec du traitement après 2 nouvelles tentatives : signaler l’échec, ne pas faire de supposition
```

### Exemple 3 : surveillance et alertes (en continu)

```markdown
## Programme : Surveillance du système

**Autorité :** Vérifier l’état du système, redémarrer les services, envoyer des alertes
**Point de contrôle d’approbation :** Redémarrer automatiquement les services. Procéder à une escalade si le redémarrage échoue deux fois.
**Déclencheur :** À chaque cycle de Heartbeat

### Vérifications

- Les points de terminaison d’état des services répondent
- L’espace disque est supérieur au seuil
- Les tâches en attente ne sont pas obsolètes (>24 heures)
- Les canaux de transmission sont opérationnels

### Matrice de réponse

| Condition             | Action                                  | Escalade ?                      |
| --------------------- | --------------------------------------- | ------------------------------- |
| Service indisponible  | Redémarrer automatiquement              | Seulement après 2 échecs        |
| Espace disque < 10 %  | Alerter le responsable                  | Oui                             |
| Tâche obsolète > 24 h | Envoyer un rappel au responsable        | Non                             |
| Canal hors ligne      | Consigner et réessayer au cycle suivant | Si hors ligne pendant > 2 heures |
```

## Modèle exécuter-vérifier-rendre compte

Les ordres permanents sont plus efficaces lorsqu’ils sont associés à une discipline d’exécution stricte. Chaque tâche d’un ordre permanent doit suivre cette boucle :

1. **Exécuter** - Effectuer réellement le travail (ne pas se contenter d’accuser réception de l’instruction)
2. **Vérifier** - Confirmer que le résultat est correct (le fichier existe, le message a été transmis, les données ont été analysées)
3. **Rendre compte** - Indiquer au responsable ce qui a été fait et vérifié

```markdown
### Règles d’exécution

- Chaque tâche suit le modèle Exécuter-Vérifier-Rendre compte. Aucune exception.
- « Je vais m’en occuper » ne constitue pas une exécution. Faites-le, puis rendez compte.
- « Terminé » sans vérification n’est pas acceptable. Apportez-en la preuve.
- Si l’exécution échoue : réessayez une fois en adaptant l’approche.
- Si elle échoue encore : signalez l’échec en fournissant un diagnostic. N’échouez jamais silencieusement.
- Ne réessayez jamais indéfiniment : 3 tentatives au maximum, puis procédez à une escalade.
```

Ce modèle évite le mode d’échec le plus courant des agents : accuser réception d’une tâche sans l’accomplir.

## Architecture multiprogramme

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

Chaque programme doit avoir :

- Sa propre **cadence de déclenchement** (hebdomadaire, mensuelle, événementielle ou continue)
- Ses propres **points de contrôle d’approbation** (certains programmes nécessitent davantage de supervision que d’autres)
- Des **limites** claires (l’agent doit savoir où un programme se termine et où un autre commence)

## Bonnes pratiques

### À faire

- Commencer avec une autorité limitée et l’élargir à mesure que la confiance s’établit
- Définir des points de contrôle d’approbation explicites pour les actions à haut risque
- Inclure des sections « Ce qu’il ne faut PAS faire » : les limites comptent autant que les autorisations
- Associer les ordres à des tâches Cron pour garantir une exécution fiable aux moments prévus
- Examiner les journaux de l’agent chaque semaine pour vérifier que les ordres permanents sont respectés
- Mettre à jour les ordres permanents à mesure que vos besoins évoluent : ce sont des documents vivants

### À éviter

- Accorder une autorité étendue dès le premier jour (« faites ce qui vous semble préférable »)
- Omettre les règles d’escalade : chaque programme doit comporter une clause indiquant « quand s’arrêter et demander »
- Supposer que l’agent se souviendra des instructions verbales : consignez tout dans le fichier
- Mélanger plusieurs domaines dans un même programme : créez des programmes distincts pour des domaines distincts
- Oublier de les faire appliquer au moyen de tâches Cron : les ordres permanents sans déclencheurs ne sont que des suggestions

## Contenu connexe

- [Automatisation](/fr/automation) : aperçu de tous les mécanismes d’automatisation.
- [Tâches Cron](/fr/automation/cron-jobs) : application du calendrier des ordres permanents.
- [Hooks](/fr/automation/hooks) : scripts déclenchés par des événements du cycle de vie de l’agent.
- [Webhooks](/fr/automation/cron-jobs#webhooks) : déclencheurs d’événements HTTP entrants.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement des ordres permanents, y compris la liste complète des fichiers d’amorçage injectés automatiquement (`AGENTS.md`, `SOUL.md`, etc.).
