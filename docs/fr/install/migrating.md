---
read_when:
    - Vous migrez OpenClaw vers un nouvel ordinateur portable ou serveur
    - Vous venez d’un autre système d’agents et souhaitez conserver l’état
    - Vous effectuez une mise à niveau sur place d’un Plugin
summary: 'Centre de migration : importations intersystèmes, déplacements de machine à machine et mises à niveau de Plugin'
title: Guide de migration
x-i18n:
    generated_at: "2026-04-30T07:34:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw prend en charge trois chemins de migration : importer depuis un autre système d’agent, déplacer une installation existante vers une nouvelle machine et mettre à niveau un plugin sur place.

## Importer depuis un autre système d’agent

Utilisez les fournisseurs de migration intégrés pour importer des instructions, des serveurs MCP, des skills, la configuration des modèles et, sur opt-in, des clés d’API dans OpenClaw. Les plans sont prévisualisés avant toute modification, les secrets sont masqués dans les rapports, et l’application s’appuie sur une sauvegarde vérifiée.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/fr/install/migrating-claude" icon="brain">
    Importez l’état de Claude Code et Claude Desktop, notamment `CLAUDE.md`, les serveurs MCP, les skills et les commandes de projet.
  </Card>
  <Card title="Migrating from Hermes" href="/fr/install/migrating-hermes" icon="feather">
    Importez la configuration Hermes, les fournisseurs, les serveurs MCP, la mémoire, les skills et les clés `.env` prises en charge.
  </Card>
</CardGroup>

Le point d’entrée CLI est [`openclaw migrate`](/fr/cli/migrate). L’onboarding peut également proposer une migration lorsqu’il détecte une source connue (`openclaw onboard --flow import`).

## Déplacer OpenClaw vers une nouvelle machine

Copiez le **répertoire d’état** (`~/.openclaw/` par défaut) et votre **espace de travail** afin de préserver :

- **Configuration** — `openclaw.json` et tous les paramètres du gateway.
- **Authentification** — les fichiers `auth-profiles.json` propres à chaque agent (clés d’API plus OAuth), ainsi que tout état de canal ou de fournisseur sous `credentials/`.
- **Sessions** — l’historique des conversations et l’état des agents.
- **État des canaux** — connexion WhatsApp, session Telegram, et éléments similaires.
- **Fichiers de l’espace de travail** — `MEMORY.md`, `USER.md`, les skills et les prompts.

<Tip>
Exécutez `openclaw status` sur l’ancienne machine pour confirmer le chemin de votre répertoire d’état. Les profils personnalisés utilisent `~/.openclaw-<profile>/` ou un chemin défini via `OPENCLAW_STATE_DIR`.
</Tip>

### Étapes de migration

<Steps>
  <Step title="Stop the gateway and back up">
    Sur l’**ancienne** machine, arrêtez le gateway afin que les fichiers ne changent pas pendant la copie, puis archivez :

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si vous utilisez plusieurs profils (par exemple `~/.openclaw-work`), archivez chacun séparément.

  </Step>

  <Step title="Install OpenClaw on the new machine">
    [Installez](/fr/install) la CLI (et Node si nécessaire) sur la nouvelle machine. Ce n’est pas un problème si l’onboarding crée un nouveau `~/.openclaw/`. Vous l’écraserez ensuite.
  </Step>

  <Step title="Copy state directory and workspace">
    Transférez l’archive via `scp`, `rsync -a` ou un disque externe, puis extrayez-la :

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Assurez-vous que les répertoires masqués ont été inclus et que la propriété des fichiers correspond à l’utilisateur qui exécutera le gateway.

  </Step>

  <Step title="Run doctor and verify">
    Sur la nouvelle machine, exécutez [Doctor](/fr/gateway/doctor) pour appliquer les migrations de configuration et réparer les services :

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Pièges courants

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Si l’ancien gateway utilisait `--profile` ou `OPENCLAW_STATE_DIR` et que le nouveau ne le fait pas, les canaux apparaîtront comme déconnectés et les sessions seront vides. Lancez le gateway avec le **même** profil ou répertoire d’état que celui que vous avez migré, puis réexécutez `openclaw doctor`.
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    Le fichier de configuration seul ne suffit pas. Les profils d’authentification des modèles se trouvent sous `agents/<agentId>/agent/auth-profiles.json`, et l’état des canaux et des fournisseurs se trouve sous `credentials/`. Migrez toujours l’**intégralité** du répertoire d’état.
  </Accordion>

  <Accordion title="Permissions and ownership">
    Si vous avez copié en tant que root ou changé d’utilisateur, le gateway peut ne pas parvenir à lire les identifiants. Assurez-vous que le répertoire d’état et l’espace de travail appartiennent à l’utilisateur qui exécute le gateway.
  </Accordion>

  <Accordion title="Remote mode">
    Si votre interface utilisateur pointe vers un gateway **distant**, l’hôte distant possède les sessions et l’espace de travail. Migrez l’hôte du gateway lui-même, pas votre ordinateur portable local. Consultez la [FAQ](/fr/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets in backups">
    Le répertoire d’état contient des profils d’authentification, des identifiants de canaux et d’autres états de fournisseurs. Stockez les sauvegardes sous forme chiffrée, évitez les canaux de transfert non sécurisés et faites tourner les clés si vous soupçonnez une exposition.
  </Accordion>
</AccordionGroup>

### Liste de vérification

Sur la nouvelle machine, confirmez que :

- [ ] `openclaw status` indique que le gateway est en cours d’exécution.
- [ ] Les canaux sont toujours connectés (aucun réappairage nécessaire).
- [ ] Le tableau de bord s’ouvre et affiche les sessions existantes.
- [ ] Les fichiers de l’espace de travail (mémoire, configurations) sont présents.

## Mettre à niveau un plugin sur place

Les mises à niveau de plugin sur place conservent le même identifiant de plugin et les mêmes clés de configuration, mais peuvent déplacer l’état sur disque vers la disposition actuelle. Les guides de mise à niveau propres aux plugins se trouvent avec leurs canaux :

- [Migration Matrix](/fr/channels/matrix-migration) : limites de récupération de l’état chiffré, comportement de capture automatique et commandes de récupération manuelle.

## Associés

- [`openclaw migrate`](/fr/cli/migrate) : référence CLI pour les importations entre systèmes.
- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : vérification de santé après migration.
- [Désinstallation](/fr/install/uninstall) : supprimer proprement OpenClaw.
