---
read_when:
    - Vous installez, configurez ou auditez le Plugin de stratégie
summary: Ajoute des vérifications de diagnostic fondées sur des politiques pour contrôler la conformité de l’espace de travail.
title: Plugin de politique
x-i18n:
    generated_at: "2026-07-12T02:58:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin de politique

Ajoute des vérifications doctor fondées sur des politiques pour assurer la conformité de l’espace de travail.

## Distribution

- Paquet : `@openclaw/policy`
- Mode d’installation : inclus dans OpenClaw

## Surface

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Comportement

Le Plugin de politique ajoute des contrôles d’intégrité doctor pour les paramètres OpenClaw gérés par des politiques et les déclarations d’espace de travail soumises à une gouvernance. La politique couvre actuellement la conformité des canaux, les métadonnées d’outils soumises à une gouvernance, la posture des serveurs MCP, la posture des fournisseurs de modèles, la posture d’accès au réseau privé, la posture d’exposition du Gateway, la posture des espaces de travail et des outils des agents, la posture configurée des outils globaux et par agent, la posture configurée de l’environnement d’exécution du bac à sable, la posture d’accès entrant et aux canaux, la posture de traitement des données, ainsi que la posture des fournisseurs de secrets et des profils d’authentification de la configuration OpenClaw.

La politique stocke les exigences définies dans `policy.jsonc`, observe les paramètres OpenClaw et les déclarations d’espace de travail existants à titre de preuves, puis signale les écarts au moyen de `openclaw policy check` et de `openclaw doctor --lint`. Une vérification de politique sans anomalie produit les hachages de la politique, des preuves, des constatations et de l’attestation, que les opérateurs peuvent consigner à des fins d’audit.

`openclaw policy compare --baseline <file>` compare un fichier de politique à un autre. Cette comparaison porte uniquement sur la conformité au niveau de la configuration : elle utilise les métadonnées des règles de politique pour vérifier que la politique contrôlée n’est ni incomplète ni moins stricte que la référence définie, et elle n’examine pas l’état d’exécution, les identifiants ni les valeurs des secrets.

Les règles de posture des outils peuvent exiger des profils approuvés, des outils de système de fichiers limités à l’espace de travail, des paramètres de sécurité/demande/hôte d’exécution bornés, la désactivation du mode élevé, des entrées `alsoAllow` exactes et les entrées requises de refus d’outils. Les preuves consignent les entrées `alsoAllow` supplémentaires, car elles peuvent élargir la posture effective des outils. Ces contrôles observent uniquement la conformité de la configuration ; ils ne lisent pas l’état des approbations à l’exécution et n’ajoutent aucun mécanisme d’application à l’exécution.

Les règles de posture du bac à sable peuvent exiger des modes et des moteurs de bac à sable approuvés, interdire la mise en réseau du conteneur avec l’hôte, interdire de rejoindre les espaces de noms des conteneurs, exiger des montages de conteneur en lecture seule, interdire le montage des sockets d’environnement d’exécution des conteneurs ainsi que les profils de conteneur non confinés, et exiger des plages sources CDP pour le navigateur du bac à sable.
Ces contrôles observent uniquement la conformité de la configuration ; ils ne lisent pas l’état des approbations à l’exécution, n’inspectent pas les conteneurs actifs et n’ajoutent aucun mécanisme d’application à l’exécution.

Les règles de traitement des données peuvent exiger le masquage des données sensibles dans les journaux, interdire la capture de contenu par télémétrie, exiger la maintenance de la conservation des sessions et interdire l’indexation en mémoire des transcriptions de session. Ces contrôles observent uniquement la conformité de la configuration ; ils n’inspectent ni les journaux bruts, ni les exportations de télémétrie, ni les transcriptions, ni les fichiers de mémoire, ni les secrets, ni les données personnelles.

Les portées de politique nommées sous `scopes.<scopeName>` peuvent ajouter des sections de politique normales plus strictes pour le sélecteur qu’elles indiquent. `agentIds` prend en charge `tools`, `agents.workspace`, `sandbox` et `dataHandling.memory` ; `channelIds` prend en charge `ingress.channels`.
Les identifiants d’agents à l’exécution qui ne sont pas explicitement répertoriés dans `agents.list[]` sont contrôlés par rapport à la posture globale/par défaut héritée, au lieu d’être considérés tacitement comme conformes sans aucune preuve. Chaque portée présente dans `policy.jsonc` doit être valide et applicable à son sélecteur. Les règles de superposition constituent des exigences supplémentaires : elles n’affaiblissent donc pas la politique de niveau supérieur et peuvent produire leurs propres constatations lorsque la même configuration observée enfreint les deux portées.

<!-- openclaw-plugin-reference:manual-end -->

## Documentation associée

- [politique](/fr/cli/policy)
