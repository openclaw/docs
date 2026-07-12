---
read_when:
    - Vous venez de Hermes et souhaitez conserver la configuration de votre modèle, vos prompts, votre mémoire et vos compétences
    - Vous voulez savoir ce qu’OpenClaw importe automatiquement et ce qui reste uniquement dans l’archive
    - Vous avez besoin d’un parcours de migration propre et scripté (CI, nouvel ordinateur portable, automatisation)
summary: Migrez de Hermes vers OpenClaw grâce à un import réversible avec aperçu
title: Migration depuis Hermes
x-i18n:
    generated_at: "2026-07-12T15:26:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Le fournisseur de migration Hermes intégré détecte l’état dans `~/.hermes`, affiche un aperçu de chaque modification avant de l’appliquer, masque les secrets dans les plans et les rapports, et crée une sauvegarde OpenClaw vérifiée avant toute modification.

<Note>
Les importations nécessitent une nouvelle configuration OpenClaw. Si vous disposez déjà d’un état OpenClaw local, réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail, ou utilisez directement `openclaw migrate apply hermes` avec `--overwrite` après avoir examiné le plan.
</Note>

## Deux méthodes d’importation

<Tabs>
  <Tab title="Assistant de configuration initiale">
    Détecte Hermes dans `~/.hermes` et affiche un aperçu avant l’application.

    ```bash
    openclaw onboard --flow import
    ```

    Vous pouvez également indiquer une source spécifique :

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Utilisez `openclaw migrate` pour les exécutions scriptées ou répétables. Consultez [`openclaw migrate`](/fr/cli/migrate) pour la référence complète.

    ```bash
    openclaw migrate hermes --dry-run    # aperçu uniquement
    openclaw migrate apply hermes --yes  # application sans demander de confirmation
    ```

    Ajoutez `--from <path>` lorsque Hermes se trouve en dehors de `~/.hermes`.

  </Tab>
</Tabs>

## Éléments importés

<AccordionGroup>
  <Accordion title="Configuration du modèle">
    - Sélection du modèle par défaut à partir du fichier `config.yaml` de Hermes.
    - Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles avec OpenAI issus de `providers` et `custom_providers`.

  </Accordion>
  <Accordion title="Serveurs MCP">
    Définitions des serveurs MCP provenant de `mcp_servers` ou de `mcp.servers`.
  </Accordion>
  <Accordion title="Fichiers de l’espace de travail">
    - `SOUL.md` et `AGENTS.md` sont copiés dans l’espace de travail de l’agent OpenClaw.
    - `memories/MEMORY.md` et `memories/USER.md` sont **ajoutés** aux fichiers de mémoire OpenClaw correspondants au lieu de les écraser.

  </Accordion>
  <Accordion title="Configuration de la mémoire">
    Paramètres de configuration par défaut de la mémoire de fichiers OpenClaw. Les fournisseurs de mémoire externes tels que Honcho sont consignés comme éléments à archiver ou à examiner manuellement afin que vous puissiez les déplacer de façon délibérée.
  </Accordion>
  <Accordion title="Skills">
    Les Skills comportant un fichier `SKILL.md` sous `skills/<name>/` sont copiés avec les valeurs de configuration propres à chaque Skill provenant de `skills.config`.
  </Accordion>
  <Accordion title="Identifiants d’authentification">
    En mode interactif, `openclaw migrate` demande confirmation avant d’importer les identifiants d’authentification, l’option oui étant sélectionnée par défaut. L’acceptation importe les entrées OAuth OpenCode OpenAI et GitHub Copilot du fichier `auth.json` d’OpenCode, ainsi que les [clés `.env` Hermes prises en charge](/fr/cli/migrate#supported-env-keys). Les propres entrées OAuth du fichier `auth.json` de Hermes constituent un état hérité : elles sont signalées comme nécessitant une réauthentification manuelle ou une intervention de Doctor au lieu d’être importées dans l’authentification active. Utilisez `--include-secrets` pour importer les identifiants lors d’une exécution non interactive, `--no-auth-credentials` pour ignorer entièrement leur importation, ou l’option `--import-secrets` de l’assistant de configuration initiale.
  </Accordion>
</AccordionGroup>

## Éléments conservés uniquement dans l’archive

Le fournisseur copie les éléments suivants dans le répertoire du rapport de migration pour un examen manuel, mais ne les charge **pas** dans la configuration ou les identifiants OpenClaw actifs :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw refuse d’exécuter cet état ou de lui faire automatiquement confiance, car les formats et les hypothèses de confiance peuvent diverger entre les systèmes. Déplacez manuellement les éléments dont vous avez besoin après avoir examiné l’archive.

## Procédure recommandée

<Steps>
  <Step title="Prévisualiser le plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Le plan répertorie tous les éléments qui seront modifiés, y compris les conflits, les éléments ignorés et les éléments sensibles. Les clés imbriquées qui semblent contenir des secrets sont masquées dans la sortie.

  </Step>
  <Step title="Appliquer avec une sauvegarde">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crée et vérifie une sauvegarde avant l’application. Cet exemple non interactif importe uniquement l’état non secret. Exécutez la commande sans `--yes` pour répondre de manière interactive à la demande concernant les identifiants, ou ajoutez `--include-secrets` pour inclure les identifiants pris en charge lors d’une exécution sans surveillance.

  </Step>
  <Step title="Exécuter Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/fr/gateway/doctor) réapplique toutes les migrations de configuration en attente et recherche les problèmes apparus pendant l’importation.

  </Step>
  <Step title="Redémarrer et vérifier">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Vérifiez que le Gateway fonctionne correctement et que le modèle, la mémoire et les Skills importés sont chargés.

  </Step>
</Steps>

## Gestion des conflits

L’application refuse de continuer lorsque le plan signale des conflits (un fichier ou une valeur de configuration existe déjà dans la cible).

<Warning>
Relancez la commande avec `--overwrite` uniquement si le remplacement de la cible existante est intentionnel. Les fournisseurs peuvent néanmoins créer des sauvegardes individuelles des fichiers écrasés dans le répertoire du rapport de migration.
</Warning>

Les conflits sont rares lors d’une nouvelle installation. Ils apparaissent généralement lorsque vous relancez l’importation sur une configuration qui contient déjà des modifications utilisateur.

Si un conflit survient pendant l’application, par exemple en raison d’une condition de concurrence inattendue sur un fichier de configuration, Hermes marque les éléments de configuration dépendants restants comme `skipped` avec le motif `blocked by earlier apply conflict`, au lieu de les écrire partiellement. Le rapport de migration consigne chaque élément bloqué afin que vous puissiez résoudre le conflit initial et relancer l’importation.

## Secrets

En mode interactif, `openclaw migrate` demande si les identifiants d’authentification détectés doivent être importés, l’option oui étant sélectionnée par défaut.

- L’acceptation importe les entrées OAuth OpenCode OpenAI et GitHub Copilot du fichier `auth.json` d’OpenCode, ainsi que les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys). Les propres entrées OAuth du fichier `auth.json` de Hermes sont signalées comme nécessitant une réauthentification OpenAI manuelle ou une réparation par Doctor.
- Utilisez `--no-auth-credentials`, ou répondez non à la demande, pour importer uniquement l’état non secret.
- Utilisez `--include-secrets` pour importer les identifiants lors d’une exécution `--yes` sans surveillance.
- Utilisez l’option `--import-secrets` de l’assistant de configuration initiale pour importer les identifiants depuis l’assistant.

## Sortie JSON pour l’automatisation

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Avec `--json` et sans `--yes`, l’application affiche le plan sans modifier l’état : il s’agit du mode le plus sûr pour la CI et les scripts partagés.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="L’application est refusée en raison de conflits">
    Examinez la sortie du plan. Chaque conflit indique le chemin source et la cible existante. Décidez pour chaque élément s’il convient de l’ignorer, de modifier la cible ou de relancer la commande avec `--overwrite`.
  </Accordion>
  <Accordion title="Hermes se trouve en dehors de ~/.hermes">
    Transmettez `--from /actual/path` (CLI) ou `--import-source /actual/path` (configuration initiale).
  </Accordion>
  <Accordion title="La configuration initiale refuse l’importation dans une configuration existante">
    Les importations effectuées lors de la configuration initiale nécessitent une nouvelle configuration. Réinitialisez l’état et recommencez la configuration initiale, ou utilisez directement `openclaw migrate apply hermes`, qui prend en charge `--overwrite` et le contrôle explicite des sauvegardes.
  </Accordion>
  <Accordion title="Les clés d’API n’ont pas été importées">
    En mode interactif, `openclaw migrate` importe les clés d’API uniquement si vous acceptez la demande concernant les identifiants. Les exécutions non interactives avec `--yes` nécessitent `--include-secrets` ; les importations effectuées lors de la configuration initiale nécessitent `--import-secrets`. Seules les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys) sont reconnues ; les autres variables `.env` sont ignorées.
  </Accordion>
</AccordionGroup>

## Pages connexes

- [`openclaw migrate`](/fr/cli/migrate) : référence complète de la CLI, contrat du Plugin et structures JSON.
- [Configuration initiale](/fr/cli/onboard) : déroulement de l’assistant et options non interactives.
- [Migration](/fr/install/migrating) : déplacement d’une installation OpenClaw entre des machines.
- [Doctor](/fr/gateway/doctor) : contrôle d’intégrité après la migration.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement des fichiers `SOUL.md`, `AGENTS.md` et des fichiers de mémoire.
