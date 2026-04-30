---
read_when:
    - Vous venez d’Hermes et souhaitez conserver votre configuration de modèle, vos prompts, votre mémoire et vos Skills
    - Vous voulez savoir ce qu’OpenClaw importe automatiquement et ce qui reste réservé aux archives
    - Vous avez besoin d’un chemin de migration propre et scripté (CI, ordinateur portable fraîchement configuré, automatisation)
summary: Migrez de Hermes vers OpenClaw avec un import prévisualisé et réversible
title: Migrer depuis Hermes
x-i18n:
    generated_at: "2026-04-30T07:34:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importe l’état Hermes via un fournisseur de migration intégré. Le fournisseur prévisualise tout avant de modifier l’état, masque les secrets dans les plans et les rapports, et crée une sauvegarde vérifiée avant l’application.

<Note>
Les imports nécessitent une nouvelle configuration OpenClaw propre. Si vous avez déjà un état OpenClaw local, réinitialisez d’abord la configuration, les identifiants, les sessions et l’espace de travail, ou utilisez directement `openclaw migrate` avec `--overwrite` après avoir examiné le plan.
</Note>

## Deux façons d’importer

<Tabs>
  <Tab title="Assistant d’intégration">
    Le chemin le plus rapide. L’assistant détecte Hermes dans `~/.hermes` et affiche une prévisualisation avant l’application.

    ```bash
    openclaw onboard --flow import
    ```

    Ou indiquez une source spécifique :

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Utilisez `openclaw migrate` pour les exécutions scriptées ou reproductibles. Consultez [`openclaw migrate`](/fr/cli/migrate) pour la référence complète.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Ajoutez `--from <path>` lorsque Hermes se trouve hors de `~/.hermes`.

  </Tab>
</Tabs>

## Ce qui est importé

<AccordionGroup>
  <Accordion title="Configuration du modèle">
    - Sélection du modèle par défaut depuis le `config.yaml` de Hermes.
    - Fournisseurs de modèles configurés et points de terminaison personnalisés compatibles OpenAI depuis `providers` et `custom_providers`.

  </Accordion>
  <Accordion title="Serveurs MCP">
    Définitions de serveurs MCP depuis `mcp_servers` ou `mcp.servers`.
  </Accordion>
  <Accordion title="Fichiers de l’espace de travail">
    - `SOUL.md` et `AGENTS.md` sont copiés dans l’espace de travail de l’agent OpenClaw.
    - `memories/MEMORY.md` et `memories/USER.md` sont **ajoutés** aux fichiers de mémoire OpenClaw correspondants au lieu de les remplacer.

  </Accordion>
  <Accordion title="Configuration de la mémoire">
    Valeurs par défaut de configuration de la mémoire pour la mémoire de fichiers OpenClaw. Les fournisseurs de mémoire externes comme Honcho sont enregistrés comme éléments d’archive ou de révision manuelle afin que vous puissiez les déplacer délibérément.
  </Accordion>
  <Accordion title="Skills">
    Les Skills comportant un fichier `SKILL.md` sous `skills/<name>/` sont copiées, avec les valeurs de configuration propres à chaque Skill depuis `skills.config`.
  </Accordion>
  <Accordion title="Clés d’API (optionnel)">
    Définissez `--include-secrets` pour importer les clés `.env` prises en charge : `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Sans cet indicateur, les secrets ne sont jamais copiés.
  </Accordion>
</AccordionGroup>

## Ce qui reste uniquement archivé

Le fournisseur copie ces éléments dans le répertoire de rapport de migration pour révision manuelle, mais ne les charge **pas** dans la configuration ou les identifiants OpenClaw actifs :

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw refuse d’exécuter cet état ou de lui faire automatiquement confiance, car les formats et les hypothèses de confiance peuvent diverger entre les systèmes. Déplacez manuellement ce dont vous avez besoin après avoir examiné l’archive.

## Flux recommandé

<Steps>
  <Step title="Prévisualiser le plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Le plan répertorie tout ce qui changera, y compris les conflits, les éléments ignorés et tout élément sensible. La sortie du plan masque les clés imbriquées qui ressemblent à des secrets.

  </Step>
  <Step title="Appliquer avec sauvegarde">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crée et vérifie une sauvegarde avant d’appliquer. Si vous devez importer des clés d’API, ajoutez `--include-secrets`.

  </Step>
  <Step title="Exécuter doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/fr/gateway/doctor) réapplique toute migration de configuration en attente et recherche les problèmes introduits pendant l’import.

  </Step>
  <Step title="Redémarrer et vérifier">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirmez que le Gateway est sain et que votre modèle, votre mémoire et vos Skills importés sont chargés.

  </Step>
</Steps>

## Gestion des conflits

L’application refuse de continuer lorsque le plan signale des conflits (un fichier ou une valeur de configuration existe déjà à la cible).

<Warning>
Réexécutez avec `--overwrite` uniquement lorsque le remplacement de la cible existante est intentionnel. Les fournisseurs peuvent encore écrire des sauvegardes au niveau des éléments pour les fichiers remplacés dans le répertoire de rapport de migration.
</Warning>

Pour une installation OpenClaw propre, les conflits sont inhabituels. Ils apparaissent généralement lorsque vous relancez l’import sur une configuration qui comporte déjà des modifications utilisateur.

Si un conflit survient en cours d’application (par exemple, une course inattendue sur un fichier de configuration), Hermes marque les éléments de configuration dépendants restants comme `skipped` avec la raison `blocked by earlier apply conflict` au lieu de les écrire partiellement. Le rapport de migration enregistre chaque élément bloqué afin que vous puissiez résoudre le conflit d’origine et relancer l’import.

## Secrets

Les secrets ne sont jamais importés par défaut.

- Exécutez d’abord `openclaw migrate apply hermes --yes` pour importer l’état non secret.
- Si vous souhaitez aussi copier les clés `.env` prises en charge, relancez avec `--include-secrets`.
- Pour les identifiants gérés par SecretRef, configurez la source SecretRef une fois l’import terminé.

## Sortie JSON pour l’automatisation

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Avec `--json` et sans `--yes`, l’application affiche le plan et ne modifie pas l’état. C’est le mode le plus sûr pour la CI et les scripts partagés.

## Dépannage

<AccordionGroup>
  <Accordion title="L’application refuse avec des conflits">
    Inspectez la sortie du plan. Chaque conflit identifie le chemin source et la cible existante. Décidez pour chaque élément s’il faut l’ignorer, modifier la cible ou relancer avec `--overwrite`.
  </Accordion>
  <Accordion title="Hermes se trouve hors de ~/.hermes">
    Passez `--from /actual/path` (CLI) ou `--import-source /actual/path` (intégration).
  </Accordion>
  <Accordion title="L’intégration refuse d’importer sur une configuration existante">
    Les imports d’intégration nécessitent une configuration propre. Réinitialisez l’état et relancez l’intégration, ou utilisez directement `openclaw migrate apply hermes`, qui prend en charge `--overwrite` et le contrôle explicite de la sauvegarde.
  </Accordion>
  <Accordion title="Les clés d’API n’ont pas été importées">
    `--include-secrets` est requis, et seules les clés listées ci-dessus sont reconnues. Les autres variables dans `.env` sont ignorées.
  </Accordion>
</AccordionGroup>

## Associés

- [`openclaw migrate`](/fr/cli/migrate) : référence CLI complète, contrat de plugin et formes JSON.
- [Intégration](/fr/cli/onboard) : flux de l’assistant et indicateurs non interactifs.
- [Migration](/fr/install/migrating) : déplacer une installation OpenClaw entre machines.
- [Doctor](/fr/gateway/doctor) : contrôle de santé post-migration.
- [Espace de travail de l’agent](/fr/concepts/agent-workspace) : emplacement de `SOUL.md`, `AGENTS.md` et des fichiers de mémoire.
