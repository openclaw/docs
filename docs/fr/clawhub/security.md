---
read_when:
    - Comprendre les résultats de l’analyse et de la modération de ClawHub
    - Signaler une compétence ou un paquet
    - Récupération après une fiche mise en attente, masquée ou bloquée
summary: Comportement de confiance, d’analyse, de signalement et de modération de ClawHub.
x-i18n:
    generated_at: "2026-05-13T05:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Sécurité + modération

ClawHub est ouvert à la publication, mais les référencements publics passent tout de même par des contrôles de confiance,
d’analyse, de signalement et de modération. L’objectif est pratique : aider les utilisateurs
à examiner ce qu’ils installent, offrir aux éditeurs une voie de recours en cas de faux positifs,
et empêcher les paquets abusifs d’apparaître dans la découverte publique.

Voir aussi [Utilisation acceptable](/fr/clawhub/acceptable-usage).

## Ce que les utilisateurs peuvent examiner

Avant d’installer un Skills ou un plugin, consultez son référencement ClawHub pour vérifier :

- l’attribution du propriétaire et de la source
- la dernière version et le journal des modifications
- les variables d’environnement ou autorisations requises
- les métadonnées de compatibilité pour les plugins
- l’état d’analyse ou de modération
- les signalements, commentaires, étoiles, téléchargements et signaux d’installation lorsqu’ils sont affichés

Installez uniquement du contenu que vous comprenez et auquel vous faites confiance.

## États d’analyse

ClawHub peut afficher les résultats d’analyse ou de modération sur les pages publiques et dans les
diagnostics visibles par le propriétaire.

Les résultats courants incluent :

- `clean` : aucun problème bloquant n’a été trouvé.
- `suspicious` : la version nécessite de la prudence ou une révision.
- `malicious` : la version est considérée comme dangereuse.
- `pending` : les vérifications ne sont pas encore terminées.
- `held`, `quarantined`, `revoked` ou `hidden` : la version n’est pas entièrement
  disponible sur les surfaces d’installation publiques.

La formulation exacte peut varier selon la surface, mais le sens pratique reste le même : si une
version est retenue ou bloquée, les utilisateurs ne doivent pas l’installer tant que le propriétaire n’a pas résolu
le problème ou que la modération ne l’a pas rétablie.

## Skills

Les analyses de Skills examinent le bundle Skills publié, les métadonnées, les exigences
déclarées et les instructions suspectes.

ClawHub accorde une attention particulière aux incohérences entre ce qu’un Skills déclare et
ce qu’il semble faire. Par exemple, un Skills qui fait référence à une clé d’API requise
devrait déclarer cette exigence dans `SKILL.md` afin que les utilisateurs puissent la voir avant
l’installation.

Les résultats d’analyse sont fondés sur les artefacts. Le comportement attendu du fournisseur, comme les
identifiants d’API déclarés, les callbacks OAuth localhost, le nettoyage de désinstallation limité au périmètre,
l’encodage Basic Auth ou les téléversements de fichiers sélectionnés par l’utilisateur vers le fournisseur indiqué, est traité
différemment de la transmission cachée d’identifiants, de l’accès étendu à des fichiers privés,
des destinations réseau sans rapport ou de l’abus furtif de navigateur.

Voir [Format Skills](/fr/clawhub/skill-format).

## Plugins

Les versions de plugins incluent les métadonnées de paquet, l’attribution de la source, les champs
de compatibilité et les informations d’intégrité des artefacts.

OpenClaw vérifie la compatibilité avant d’installer des plugins hébergés par ClawHub. Les enregistrements de paquet
peuvent également exposer des métadonnées de condensat afin qu’OpenClaw puisse vérifier les
artefacts téléchargés. ClawScan inclut les métadonnées env/config `openclaw.environment` déclarées par le paquet
lors de l’examen des versions de plugins, afin que les exigences d’exécution déclarées soient
comparées au comportement observé.

## Signalements

Les utilisateurs connectés peuvent signaler des Skills, des paquets et des commentaires.

Les signalements doivent être précis et exploitables. L’abus du signalement peut lui-même entraîner une
action sur le compte.

Exemples de signalements :

- métadonnées trompeuses
- exigences d’identifiants ou d’autorisations non déclarées
- instructions d’installation suspectes
- commentaires frauduleux ou usurpation d’identité
- enregistrements de mauvaise foi ou usage abusif de marque
- contenu qui enfreint l’[Utilisation acceptable](/fr/clawhub/acceptable-usage)

## Notes ClawScan de l’éditeur

Les éditeurs peuvent fournir une note ClawScan facultative lors de la publication d’un Skills ou d’un
plugin. Cette note donne à ClawScan du contexte sur un comportement qui pourrait autrement paraître
inhabituel, comme l’accès réseau, l’accès à l’hôte natif ou des identifiants
propres à un fournisseur.

## Retenues de modération

Lorsque l’analyseur statique signale un Skills téléversé comme malveillant, l’éditeur est
automatiquement placé sous retenue de modération (`requiresModerationAt` défini sur
l’utilisateur). Cela masque tous les Skills de l’éditeur, fait commencer les publications futures
comme masquées, et crée une entrée de journal d’audit `user.moderation.auto`.

Les constats statiques suspects sont conservés comme preuves fichier/ligne pour les modérateurs,
mais ils ne masquent pas le contenu et ne déterminent pas à eux seuls le verdict d’analyse public.
Les nouveaux téléversements restent en état de révision/en attente jusqu’à la conclusion de l’examen LLM. L’analyse
statique ne bloque immédiatement que pour les signatures malveillantes. Les détections du moteur
VirusTotal restent des preuves de sécurité visibles, mais les verdicts VirusTotal Code Insight/Palm
sont consultatifs et ne masquent pas les Skills à eux seuls. Les examens LLM de ClawScan
conservent les notes alignées sur l’objectif comme indications. Les constats de révision moyens restent visibles sur
l’artefact, tandis que le filtre suspect est réservé aux préoccupations LLM à fort impact,
aux constats malveillants ou aux détections corroborées par un moteur AV.

Les administrateurs peuvent lever une retenue due à un faux positif :

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Cela efface `requiresModerationAt` et `requiresModerationReason`, restaure
les Skills masqués par la retenue au niveau utilisateur, et écrit une entrée de journal d’audit
`user.moderation.lift`. Les Skills masqués pour d’autres raisons, ou dont la propre analyse statique reste
malveillante, restent masqués.

## Bannissements et état du compte

Les comptes qui enfreignent la politique ClawHub peuvent perdre l’accès à la publication. Les abus graves
peuvent entraîner des bannissements de compte, la révocation de jetons, du contenu masqué ou des
référencements supprimés.

Les comptes supprimés, bannis ou désactivés ne peuvent pas utiliser les jetons d’API ClawHub. Si l’authentification CLI
commence à échouer après une action sur le compte, connectez-vous à l’interface web pour examiner l’état du
compte. Si la connexion ou l’accès CLI normal est bloqué, contactez
security@openclaw.ai pour un examen de récupération.

## Conseils aux éditeurs

Pour réduire les faux positifs et améliorer la confiance des utilisateurs :

- gardez les noms, résumés, étiquettes et journaux de modifications exacts
- déclarez les variables d’environnement et autorisations requises
- ajoutez une note ClawScan d’éditeur lorsqu’une version a un comportement inhabituel mais intentionnel
- évitez les commandes d’installation obscurcies
- ajoutez un lien vers la source lorsque c’est possible
- utilisez des essais à blanc avant de publier des plugins
- répondez clairement si des utilisateurs ou des modérateurs posent des questions sur le comportement du paquet
