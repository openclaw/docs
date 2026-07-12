---
read_when:
    - Vous venez de Hermes et souhaitez conserver la configuration de votre modèle, vos prompts, votre mémoire et vos Skills
    - Vous voulez savoir ce qu’OpenClaw importe automatiquement et ce qui reste uniquement dans l’archive
    - Vous avez besoin d’un processus de migration propre et scripté (CI, nouvel ordinateur portable, automatisation)
summary: Migrez de Hermes vers OpenClaw grâce à un import prévisualisé et réversible
title: Migration depuis Hermes
x-i18n:
    generated_at: "2026-07-12T02:57:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Le fournisseur de migration Hermes intégré détecte l’état dans `~/.hermes`, affiche un aperçu de chaque modification avant de l’appliquer, masque les secrets dans les plans et les rapports, et crée une sauvegarde OpenClaw vérifiée avant toute modification.

<Note>
Les importations nécessitent une nouvelle configuration d’OpenClaw. Si vous disposez déjà d’un état OpenClaw local, réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail, ou utilisez directement `openclaw migrate apply hermes` avec `--overwrite` après avoir examiné le plan.
</Note>

## Deux méthodes d’importation

<Tabs>
  <Tab title="Assistant d’intégration">
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
    Utilisez `openclaw migrate` pour les exécutions scriptées ou reproductibles. Consultez [`openclaw migrate`](/fr/cli/migrate) pour la référence complète.

    ```bash
    openclaw migrate hermes --dry-run    # aperçu uniquement
    openclaw migrate apply hermes --yes  # application sans demander de confirmation
    ```

    Ajoutez `--from <path>` lorsque Hermes se trouve en dehors de `~/.hermes`.

  </Tab>
</Tabs>

## Éléments importés

<AccordionGroup>
  <Accordion title="Configuration des modèles">
    - Sélection du modèle par défaut depuis le fichier `config.yaml` de Hermes.
    - Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles avec OpenAI depuis `providers` et `custom_providers`.

  </Accordion>
  <Accordion title="Serveurs MCP">
    Définitions des serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
  </Accordion>
  <Accordion title="Fichiers de l’espace de travail">
    - `SOUL.md` et `AGENTS.md` sont copiés dans l’espace de travail de l’agent OpenClaw.
    - `memories/MEMORY.md` et `memories/USER.md` sont **ajoutés à la suite** des fichiers de mémoire OpenClaw correspondants au lieu de les remplacer.

  </Accordion>
  <Accordion title="Configuration de la mémoire">
    Paramètres de mémoire par défaut pour la mémoire sur fichiers d’OpenClaw. Les fournisseurs de mémoire externes tels que Honcho sont enregistrés comme éléments à archiver ou à examiner manuellement afin que vous puissiez les déplacer de manière délibérée.
  </Accordion>
  <Accordion title="Skills">
    Les Skills disposant d’un fichier `SKILL.md` sous `skills/<name>/` sont copiés avec leurs valeurs de configuration propres provenant de `skills.config`.
  </Accordion>
  <Accordion title="Identifiants d’authentification">
    La commande interactive `openclaw migrate` demande confirmation avant d’importer les identifiants d’authentification, avec oui sélectionné par défaut. En acceptant, les entrées OAuth OpenAI d’OpenCode et GitHub Copilot provenant du fichier `auth.json` d’OpenCode sont importées, ainsi que les [clés `.env` Hermes prises en charge](/fr/cli/migrate#supported-env-keys). Les entrées OAuth du propre fichier `auth.json` de Hermes constituent un état ancien : elles sont signalées comme nécessitant une réauthentification manuelle ou une intervention de Doctor au lieu d’être importées dans l’authentification active. Utilisez `--include-secrets` pour importer les identifiants lors d’une exécution non interactive, `--no-auth-credentials` pour ignorer entièrement leur importation, ou l’option `--import-secrets` de l’assistant d’intégration.
  </Accordion>
</AccordionGroup>

## Éléments conservés uniquement dans l’archive

Le fournisseur copie les éléments suivants dans le répertoire du rapport de migration pour permettre leur examen manuel, mais ne les charge **pas** dans la configuration ou les identifiants OpenClaw actifs :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw refuse d’exécuter cet état ou de lui faire automatiquement confiance, car les formats et les hypothèses de confiance peuvent diverger entre les systèmes. Après avoir examiné l’archive, déplacez manuellement les éléments dont vous avez besoin.

## Procédure recommandée

<Steps>
  <Step title="Prévisualiser le plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Le plan répertorie tout ce qui sera modifié, notamment les conflits, les éléments ignorés et les éléments sensibles. Les clés imbriquées ressemblant à des secrets sont masquées dans la sortie.

  </Step>
  <Step title="Appliquer avec une sauvegarde">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crée et vérifie une sauvegarde avant l’application. Cet exemple non interactif importe uniquement l’état non secret. Exécutez la commande sans `--yes` pour répondre de manière interactive à l’invite concernant les identifiants, ou ajoutez `--include-secrets` pour inclure les identifiants pris en charge lors d’une exécution sans surveillance.

  </Step>
  <Step title="Exécuter Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/fr/gateway/doctor) réapplique toutes les migrations de configuration en attente et recherche les problèmes introduits lors de l’importation.

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

L’application refuse de continuer lorsque le plan signale des conflits, c’est-à-dire lorsqu’un fichier ou une valeur de configuration existe déjà à l’emplacement cible.

<Warning>
Relancez la commande avec `--overwrite` uniquement si vous souhaitez délibérément remplacer la cible existante. Les fournisseurs peuvent tout de même créer des sauvegardes individuelles des fichiers remplacés dans le répertoire du rapport de migration.
</Warning>

Les conflits sont rares sur une nouvelle installation. Ils apparaissent généralement lorsque vous relancez l’importation sur une configuration contenant déjà des modifications apportées par l’utilisateur.

Si un conflit survient pendant l’application, par exemple en raison d’un accès concurrent inattendu à un fichier de configuration, Hermes marque les éléments de configuration dépendants restants comme `skipped` avec le motif `blocked by earlier apply conflict`, au lieu de les écrire partiellement. Le rapport de migration consigne chaque élément bloqué afin que vous puissiez résoudre le conflit initial et relancer l’importation.

## Secrets

La commande interactive `openclaw migrate` demande s’il faut importer les identifiants d’authentification détectés, avec oui sélectionné par défaut.

- En acceptant, les entrées OAuth OpenAI d’OpenCode et GitHub Copilot provenant du fichier `auth.json` d’OpenCode sont importées, ainsi que les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys). Les entrées OAuth du propre fichier `auth.json` de Hermes sont plutôt signalées comme nécessitant une réauthentification OpenAI manuelle ou une réparation par Doctor.
- Utilisez `--no-auth-credentials`, ou répondez non à l’invite, pour importer uniquement l’état non secret.
- Utilisez `--include-secrets` pour importer les identifiants lors d’une exécution `--yes` sans surveillance.
- Utilisez l’option `--import-secrets` de l’assistant d’intégration pour importer les identifiants depuis celui-ci.

## Sortie JSON pour l’automatisation

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état : il s’agit du mode le plus sûr pour l’intégration continue et les scripts partagés.

## Dépannage

<AccordionGroup>
  <Accordion title="L’application refuse de continuer en raison de conflits">
    Examinez la sortie du plan. Chaque conflit indique le chemin source et la cible existante. Pour chaque élément, décidez s’il faut l’ignorer, modifier la cible ou relancer la commande avec `--overwrite`.
  </Accordion>
  <Accordion title="Hermes se trouve en dehors de ~/.hermes">
    Transmettez `--from /actual/path` à la CLI ou `--import-source /actual/path` à l’intégration.
  </Accordion>
  <Accordion title="L’intégration refuse l’importation dans une configuration existante">
    Les importations effectuées pendant l’intégration nécessitent une nouvelle configuration. Réinitialisez l’état et recommencez l’intégration, ou utilisez directement `openclaw migrate apply hermes`, qui prend en charge `--overwrite` et le contrôle explicite des sauvegardes.
  </Accordion>
  <Accordion title="Les clés d’API n’ont pas été importées">
    La commande interactive `openclaw migrate` importe les clés d’API uniquement si vous acceptez l’invite concernant les identifiants. Les exécutions non interactives avec `--yes` nécessitent `--include-secrets` ; les importations pendant l’intégration nécessitent `--import-secrets`. Seules les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys) sont reconnues ; les autres variables `.env` sont ignorées.
  </Accordion>
</AccordionGroup>

## Pages connexes

- [`openclaw migrate`](/fr/cli/migrate) : référence complète de la CLI, contrat du Plugin et structures JSON.
- [Intégration](/fr/cli/onboard) : procédure de l’assistant et options non interactives.
- [Migration](/fr/install/migrating) : déplacement d’une installation OpenClaw entre plusieurs machines.
- [Doctor](/fr/gateway/doctor) : contrôle d’intégrité après la migration.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement de `SOUL.md`, `AGENTS.md` et des fichiers de mémoire.
