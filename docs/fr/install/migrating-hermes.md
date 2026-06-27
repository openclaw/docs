---
read_when:
    - Vous venez de Hermes et souhaitez conserver votre configuration de modèle, vos prompts, votre mémoire et vos Skills
    - Vous voulez savoir ce qu’OpenClaw importe automatiquement et ce qui reste uniquement archivé
    - Vous avez besoin d’un chemin de migration propre et scripté (CI, nouvel ordinateur portable, automatisation)
summary: Passez d’Hermes à OpenClaw avec un import prévisualisé et réversible
title: Migration depuis Hermes
x-i18n:
    generated_at: "2026-06-27T17:39:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importe l’état Hermes au moyen d’un fournisseur de migration intégré. Le fournisseur prévisualise tout avant de modifier l’état, masque les secrets dans les plans et les rapports, et crée une sauvegarde vérifiée avant l’application.

<Note>
Les importations nécessitent une nouvelle configuration OpenClaw. Si vous disposez déjà d’un état OpenClaw local, réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail, ou utilisez directement `openclaw migrate` avec `--overwrite` après avoir examiné le plan.
</Note>

## Deux façons d’importer

<Tabs>
  <Tab title="Onboarding wizard">
    Le chemin le plus rapide. L’assistant détecte Hermes dans `~/.hermes` et affiche un aperçu avant d’appliquer les changements.

    ```bash
    openclaw onboard --flow import
    ```

    Ou indiquez une source précise :

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Utilisez `openclaw migrate` pour les exécutions scriptées ou répétables. Consultez [`openclaw migrate`](/fr/cli/migrate) pour la référence complète.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Ajoutez `--from <path>` lorsque Hermes se trouve en dehors de `~/.hermes`.

  </Tab>
</Tabs>

## Ce qui est importé

<AccordionGroup>
  <Accordion title="Model configuration">
    - Sélection du modèle par défaut depuis le `config.yaml` de Hermes.
    - Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles avec OpenAI depuis `providers` et `custom_providers`.

  </Accordion>
  <Accordion title="MCP servers">
    Définitions des serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
  </Accordion>
  <Accordion title="Workspace files">
    - `SOUL.md` et `AGENTS.md` sont copiés dans l’espace de travail de l’agent OpenClaw.
    - `memories/MEMORY.md` et `memories/USER.md` sont **ajoutés** aux fichiers de mémoire OpenClaw correspondants au lieu de les écraser.

  </Accordion>
  <Accordion title="Memory configuration">
    Valeurs par défaut de configuration de la mémoire pour la mémoire fichier OpenClaw. Les fournisseurs de mémoire externes tels que Honcho sont enregistrés comme éléments d’archive ou de revue manuelle afin que vous puissiez les déplacer délibérément.
  </Accordion>
  <Accordion title="Skills">
    Les Skills avec un fichier `SKILL.md` sous `skills/<name>/` sont copiées, ainsi que les valeurs de configuration propres à chaque Skill depuis `skills.config`.
  </Accordion>
  <Accordion title="Auth credentials">
    `openclaw migrate` interactif demande confirmation avant d’importer les identifiants d’authentification, avec oui sélectionné par défaut. Les importations acceptées incluent les identifiants OAuth OpenAI d’OpenCode depuis le `auth.json` d’OpenCode, les entrées OpenCode et GitHub Copilot depuis le `auth.json` d’OpenCode, ainsi que les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys). Les entrées OAuth du `auth.json` de Hermes sont un état hérité et sont présentées comme une réauthentification manuelle ou une tâche de doctor au lieu d’être importées dans l’authentification active. Utilisez `--include-secrets` pour l’importation non interactive d’identifiants avec `openclaw migrate`, `--no-auth-credentials` pour l’ignorer, ou `--import-secrets` dans l’onboarding lors de l’importation depuis l’assistant d’onboarding.
  </Accordion>
</AccordionGroup>

## Ce qui reste seulement archivé

Le fournisseur copie ces éléments dans le répertoire de rapport de migration pour revue manuelle, mais ne les charge **pas** dans la configuration ou les identifiants actifs d’OpenClaw :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw refuse d’exécuter ou de faire automatiquement confiance à cet état, car les formats et les hypothèses de confiance peuvent diverger entre les systèmes. Déplacez manuellement ce dont vous avez besoin après avoir examiné l’archive.

## Flux recommandé

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Le plan liste tout ce qui va changer, y compris les conflits, les éléments ignorés et les éléments sensibles. La sortie du plan masque les clés imbriquées qui ressemblent à des secrets.

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crée et vérifie une sauvegarde avant l’application. Cet exemple non interactif importe un état non secret. Exécutez sans `--yes` pour répondre à l’invite concernant les identifiants, ou ajoutez `--include-secrets` pour inclure les identifiants pris en charge dans les exécutions sans surveillance.

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/fr/gateway/doctor) réapplique toute migration de configuration en attente et vérifie les problèmes introduits pendant l’importation.

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirmez que le Gateway est sain et que votre modèle, votre mémoire et vos Skills importés sont chargés.

  </Step>
</Steps>

## Gestion des conflits

L’application refuse de continuer lorsque le plan signale des conflits (un fichier ou une valeur de configuration existe déjà à la destination).

<Warning>
Relancez avec `--overwrite` uniquement lorsque le remplacement de la cible existante est intentionnel. Les fournisseurs peuvent tout de même écrire des sauvegardes au niveau des éléments pour les fichiers écrasés dans le répertoire de rapport de migration.
</Warning>

Pour une nouvelle installation OpenClaw, les conflits sont inhabituels. Ils apparaissent généralement lorsque vous relancez l’importation sur une configuration qui comporte déjà des modifications utilisateur.

Si un conflit apparaît au milieu de l’application (par exemple, une course inattendue sur un fichier de configuration), Hermes marque les éléments de configuration dépendants restants comme `skipped` avec la raison `blocked by earlier apply conflict` au lieu de les écrire partiellement. Le rapport de migration enregistre chaque élément bloqué afin que vous puissiez résoudre le conflit d’origine et relancer l’importation.

## Secrets

`openclaw migrate` interactif demande s’il faut importer les identifiants d’authentification détectés, avec oui sélectionné par défaut.

- Accepter l’invite importe les identifiants OAuth OpenAI d’OpenCode depuis le `auth.json` d’OpenCode, les entrées OpenCode et GitHub Copilot depuis le `auth.json` d’OpenCode, ainsi que les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys). Les entrées OAuth du `auth.json` de Hermes sont signalées pour une réauthentification OpenAI manuelle ou une réparation par doctor.
- Utilisez `--no-auth-credentials` ou choisissez non à l’invite pour importer uniquement l’état non secret.
- Utilisez `--include-secrets` lors d’une exécution sans surveillance avec `--yes`.
- Utilisez `--import-secrets` dans l’onboarding lors de l’importation d’identifiants depuis l’assistant d’onboarding.
- Pour les identifiants gérés par SecretRef, configurez la source SecretRef une fois l’importation terminée.

## Sortie JSON pour l’automatisation

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état. C’est le mode le plus sûr pour la CI et les scripts partagés.

## Dépannage

<AccordionGroup>
  <Accordion title="Apply refuses with conflicts">
    Inspectez la sortie du plan. Chaque conflit identifie le chemin source et la cible existante. Décidez pour chaque élément s’il faut l’ignorer, modifier la cible ou relancer avec `--overwrite`.
  </Accordion>
  <Accordion title="Hermes lives outside ~/.hermes">
    Passez `--from /actual/path` (CLI) ou `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    Les importations d’onboarding nécessitent une nouvelle configuration. Réinitialisez l’état et relancez l’onboarding, ou utilisez directement `openclaw migrate apply hermes`, qui prend en charge `--overwrite` et le contrôle explicite des sauvegardes.
  </Accordion>
  <Accordion title="API keys did not import">
    `openclaw migrate` interactif importe les clés API uniquement lorsque vous acceptez l’invite concernant les identifiants. Les exécutions non interactives avec `--yes` nécessitent `--include-secrets` ; les importations via l’onboarding nécessitent `--import-secrets`. Seules les [clés `.env` prises en charge](/fr/cli/migrate#supported-env-keys) sont reconnues ; les autres variables dans `.env` sont ignorées.
  </Accordion>
</AccordionGroup>

## Connexe

- [`openclaw migrate`](/fr/cli/migrate) : référence CLI complète, contrat de Plugin et formes JSON.
- [Onboarding](/fr/cli/onboard) : flux d’assistant et indicateurs non interactifs.
- [Migration](/fr/install/migrating) : déplacer une installation OpenClaw entre machines.
- [Doctor](/fr/gateway/doctor) : contrôle de santé après migration.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement de `SOUL.md`, `AGENTS.md` et des fichiers de mémoire.
