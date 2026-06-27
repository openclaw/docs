---
read_when:
    - Vous installez, configurez ou auditez le plugin de stratégie
summary: Ajoute des contrôles doctor appuyés par des politiques pour la conformité de l’espace de travail.
title: Plugin de politique
x-i18n:
    generated_at: "2026-06-27T17:56:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de politique

Ajoute des vérifications doctor adossées à des politiques pour la conformité de l’espace de travail.

## Distribution

- Package : `@openclaw/policy`
- Voie d’installation : inclus dans OpenClaw

## Surface

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportement

Le Plugin Policy ajoute des vérifications d’intégrité doctor pour les paramètres OpenClaw gérés par politique et les déclarations d’espace de travail gouvernées. La politique couvre actuellement la conformité des canaux, les métadonnées des outils gouvernés, la posture des serveurs MCP, la posture des fournisseurs de modèles, la posture d’accès au réseau privé, la posture d’exposition du Gateway, la posture de l’espace de travail et des outils d’agent, la posture des outils globaux/par agent configurés, la posture du runtime de sandbox configuré, la posture d’accès entrant/canal, la posture de traitement des données et la posture des profils d’authentification du fournisseur de secrets de configuration OpenClaw.

Policy stocke les exigences rédigées dans `policy.jsonc`, observe les paramètres OpenClaw et les déclarations d’espace de travail existants comme preuves, et signale les écarts via `openclaw policy check` et `openclaw doctor --lint`. Une vérification de politique propre émet des hachages de politique, de preuves, de constats et d’attestation que les opérateurs peuvent enregistrer à des fins d’audit.

`openclaw policy compare --baseline <file>` compare un fichier de politique à un autre fichier de politique. Il s’agit uniquement de conformité au niveau de la configuration : la commande utilise les métadonnées des règles de politique pour vérifier que la politique contrôlée n’est pas absente ou plus faible que la référence rédigée, et elle n’inspecte pas l’état du runtime, les identifiants ni les valeurs secrètes.

Les règles de posture des outils peuvent exiger des profils approuvés, des outils de système de fichiers limités à l’espace de travail, des paramètres de sécurité/ask/host bornés pour exec, le mode élevé désactivé, des entrées `alsoAllow` exactes et des entrées de refus d’outils requises. Les preuves enregistrent les entrées `alsoAllow` additives, car elles peuvent élargir la posture effective des outils. Ces vérifications observent uniquement la conformité de la configuration ; elles ne lisent pas l’état d’approbation du runtime et n’ajoutent pas d’application au runtime.

Les règles de posture du sandbox peuvent exiger des modes/backends de sandbox approuvés, interdire la mise en réseau de conteneur hôte, interdire les jonctions d’espaces de noms de conteneur, exiger des montages de conteneur en lecture seule, interdire les montages de sockets de runtime de conteneur et les profils de conteneur non confinés, et exiger des plages sources CDP pour navigateur sandbox.
Ces vérifications observent uniquement la conformité de la configuration ; elles ne lisent pas l’état d’approbation du runtime, n’inspectent pas les conteneurs actifs et n’ajoutent pas d’application au runtime.

Les règles de traitement des données peuvent exiger la rédaction des journaux sensibles, interdire la capture de contenu de télémétrie, exiger la maintenance de la conservation des sessions et interdire l’indexation mémoire des transcriptions de session. Ces vérifications observent uniquement la conformité de la configuration ; elles n’inspectent pas les journaux bruts, les exports de télémétrie, les transcriptions, les fichiers mémoire, les secrets ni les données personnelles.

Les portées de politique nommées sous `scopes.<scopeName>` peuvent ajouter des sections de politique normale plus strictes pour le sélecteur qu’elles répertorient. `agentIds` prend en charge `tools`, `agents.workspace`, `sandbox` et `dataHandling.memory` ; `channelIds` prend en charge `ingress.channels`.
Les identifiants d’agents du runtime qui ne sont pas explicitement listés dans `agents.list[]` sont vérifiés par rapport à la posture globale/par défaut héritée au lieu de réussir silencieusement sans preuve. Chaque portée présente dans `policy.jsonc` doit être valide et applicable pour son sélecteur. Les règles de superposition sont des revendications supplémentaires ; elles n’affaiblissent donc pas la politique de premier niveau et peuvent produire leurs propres constats lorsque la même configuration observée enfreint les deux portées.

<!-- openclaw-plugin-reference:manual-end -->

## Documentation associée

- [politique](/fr/cli/policy)
