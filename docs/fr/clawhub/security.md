---
read_when:
    - Comprendre les résultats d’analyse et de modération de ClawHub
    - Signalement d’une compétence ou d’un paquet
    - Récupération après une fiche retenue, masquée ou bloquée
summary: Comportement de confiance, d’analyse, de signalement et de modération de ClawHub.
x-i18n:
    generated_at: "2026-05-13T02:52:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sécurité + Modération

ClawHub accepte les publications, mais les fiches publiques passent toujours par
des contrôles de confiance, d’analyse, de signalement et de modération. L’objectif
est pratique : aider les utilisateurs à inspecter ce qu’ils installent, offrir aux
éditeurs une voie de recours en cas de faux positifs et maintenir les packages
abusifs hors de la découverte publique.

Voir aussi [Utilisation acceptable](/fr/clawhub/acceptable-usage).

## Ce que les utilisateurs peuvent inspecter

Avant d’installer un skill ou un plugin, consultez sa fiche ClawHub pour vérifier :

- l’attribution du propriétaire et de la source
- la dernière version et le journal des modifications
- les variables d’environnement ou permissions requises
- les métadonnées de compatibilité des plugins
- l’état d’analyse ou de modération
- les signalements, commentaires, étoiles, téléchargements et signaux d’installation lorsqu’ils sont affichés

N’installez que le contenu que vous comprenez et auquel vous faites confiance.

## États d’analyse

ClawHub peut afficher les résultats d’analyse ou de modération sur les pages
publiques et dans les diagnostics visibles par le propriétaire.

Les résultats courants incluent :

- `clean` : aucun problème bloquant n’a été trouvé.
- `suspicious` : la publication exige de la prudence ou une vérification.
- `malicious` : la publication est considérée comme non sûre.
- `pending` : les vérifications ne sont pas encore terminées.
- `held`, `quarantined`, `revoked` ou `hidden` : la publication n’est pas
  entièrement disponible sur les surfaces d’installation publiques.

La formulation exacte peut varier selon la surface, mais la signification
pratique est la même : si une publication est retenue ou bloquée, les
utilisateurs ne doivent pas l’installer tant que le propriétaire n’a pas résolu
le problème ou que la modération ne l’a pas rétablie.

## Skills

Les analyses de Skills examinent le bundle de skill publié, les métadonnées, les
exigences déclarées et les instructions suspectes.

ClawHub accorde une attention particulière aux incohérences entre ce qu’un skill
déclare et ce qu’il semble faire. Par exemple, un skill qui référence une clé
d’API requise doit déclarer cette exigence dans `SKILL.md` afin que les
utilisateurs puissent la voir avant l’installation.

Les constats d’analyse sont fondés sur les artefacts. Le comportement attendu
d’un fournisseur, comme les identifiants d’API déclarés, les rappels OAuth sur
localhost, le nettoyage de désinstallation limité au périmètre prévu, l’encodage
Basic Auth ou les téléversements de fichiers choisis par l’utilisateur vers le
fournisseur indiqué, est traité différemment du transfert masqué
d’identifiants, de l’accès étendu à des fichiers privés, de destinations réseau
sans rapport ou de l’abus furtif du navigateur.

Voir [Format de skill](/fr/clawhub/skill-format).

## Plugins

Les publications de plugins incluent les métadonnées de package, l’attribution
de la source, les champs de compatibilité et les informations d’intégrité des
artefacts.

OpenClaw vérifie la compatibilité avant d’installer des plugins hébergés par
ClawHub. Les enregistrements de package peuvent aussi exposer des métadonnées de
condensat afin qu’OpenClaw puisse vérifier les artefacts téléchargés. ClawScan
inclut les métadonnées env/config `openclaw.environment` déclarées par le
package lors de l’examen des publications de plugins, afin que les exigences
d’exécution déclarées soient comparées au comportement observé.

## Signalements

Les utilisateurs connectés peuvent signaler des skills, des packages et des
commentaires.

Les signalements doivent être précis et exploitables. L’abus du système de
signalement peut lui-même entraîner une action sur le compte.

Exemples de signalements :

- métadonnées trompeuses
- exigences d’identifiants ou de permissions non déclarées
- instructions d’installation suspectes
- commentaires frauduleux ou usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marques
- contenu qui enfreint l’[Utilisation acceptable](/fr/clawhub/acceptable-usage)

## Notes ClawScan des éditeurs

Les éditeurs peuvent fournir une note ClawScan facultative lors de la
publication d’un skill ou d’un plugin. Cette note donne à ClawScan du contexte
sur un comportement qui pourrait sinon sembler inhabituel, comme l’accès réseau,
l’accès à un hôte natif ou des identifiants propres à un fournisseur.

## Retenues de modération

Lorsque l’analyseur statique signale un skill téléversé comme malveillant,
l’éditeur est automatiquement placé sous retenue de modération
(`requiresModerationAt` défini sur l’utilisateur). Cela masque tous les skills de
l’éditeur, fait commencer les futures publications en état masqué et crée une
entrée de journal d’audit `user.moderation.auto`.

Les constats statiques suspects sont conservés comme preuves de fichier/ligne
pour les modérateurs, mais ils ne masquent pas le contenu et ne décident pas à
eux seuls du verdict d’analyse public. Les nouveaux téléversements restent en
état d’examen/en attente jusqu’à la fin de l’examen LLM. L’analyse statique ne
bloque immédiatement que les signatures malveillantes. Les détections des
moteurs VirusTotal restent des preuves de sécurité visibles, mais les verdicts
VirusTotal Code Insight/Palm sont consultatifs et ne masquent pas les skills à
eux seuls. Les examens LLM de ClawScan conservent les notes alignées sur
l’objectif comme indications. Les constats d’examen de gravité moyenne restent
visibles sur l’artefact, tandis que le filtre suspect est réservé aux
préoccupations LLM à fort impact, aux constats malveillants ou aux détections de
moteurs antivirus corroborées.

Les administrateurs peuvent lever une retenue due à un faux positif :

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Cela efface `requiresModerationAt` et `requiresModerationReason`, restaure les
skills masqués par la retenue au niveau utilisateur et écrit une entrée de
journal d’audit `user.moderation.lift`. Les skills masqués pour d’autres
raisons, ou dont la propre analyse statique reste malveillante, restent masqués.

## Bannissements et état du compte

Les comptes qui enfreignent la politique de ClawHub peuvent perdre l’accès à la
publication. Les abus graves peuvent entraîner des bannissements de compte, la
révocation de jetons, du contenu masqué ou des fiches supprimées.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons
d’API ClawHub. Si l’authentification CLI commence à échouer après une action sur
le compte, connectez-vous à l’interface web pour examiner l’état du compte. Si
la connexion ou l’accès CLI normal est bloqué, contactez security@openclaw.ai
pour une étude de récupération.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, tags et journaux des modifications exacts
- déclarez les variables d’environnement et permissions requises
- ajoutez une note ClawScan d’éditeur lorsqu’une publication présente un comportement inhabituel mais intentionnel
- évitez les commandes d’installation obscurcies
- ajoutez un lien vers la source lorsque c’est possible
- utilisez des dry runs avant de publier des plugins
- répondez clairement si les utilisateurs ou les modérateurs posent des questions sur le comportement du package
