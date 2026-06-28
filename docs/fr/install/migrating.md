---
read_when:
    - Vous migrez OpenClaw vers un nouvel ordinateur portable ou un nouveau serveur
    - Vous venez d’un autre système d’agents et souhaitez conserver l’état
    - Vous mettez à niveau un Plugin en place
summary: 'Hub de migration : imports inter-systèmes, déplacements de machine à machine et mises à niveau des Plugins'
title: Guide de migration
x-i18n:
    generated_at: "2026-05-02T07:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e447e38cf0086603a7b30ee5204e63cc8227ebc7a56add26d06ac2798a23e26f
    source_path: install/migrating.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw prend en charge trois parcours de migration : l’import depuis un autre système d’agent, le déplacement d’une installation existante vers une nouvelle machine et la mise à niveau d’un plugin sur place.

## Importer depuis un autre système d’agent

Utilisez les fournisseurs de migration inclus pour importer dans OpenClaw les instructions, les serveurs MCP, les skills, la configuration du modèle et, avec consentement explicite, les clés d’API. Les plans sont prévisualisés avant toute modification, les secrets sont masqués dans les rapports, et l’application s’appuie sur une sauvegarde vérifiée.

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/fr/install/migrating-claude" icon="brain">
    Importez l’état de Claude Code et Claude Desktop, notamment `CLAUDE.md`, les serveurs MCP, les skills et les commandes de projet.
  </Card>
  <Card title="Migrating from Hermes" href="/fr/install/migrating-hermes" icon="feather">
    Importez la configuration Hermes, les fournisseurs, les serveurs MCP, la mémoire, les skills et les clés `.env` prises en charge.
  </Card>
</CardGroup>

Le point d’entrée CLI est [`openclaw migrate`](/fr/cli/migrate). L’onboarding peut aussi proposer une migration lorsqu’il détecte une source connue (`openclaw onboard --flow import`).

## Déplacer OpenClaw vers une nouvelle machine

Copiez le **répertoire d’état** (`~/.openclaw/` par défaut) et votre **espace de travail** pour préserver :

- **Configuration** — `openclaw.json` et tous les paramètres du gateway.
- **Authentification** — les `auth-profiles.json` propres à chaque agent (clés d’API et OAuth), ainsi que tout état de canal ou de fournisseur sous `credentials/`.
- **Sessions** — l’historique des conversations et l’état de l’agent.
- **État des canaux** — connexion WhatsApp, session Telegram, et éléments similaires.
- **Fichiers de l’espace de travail** — `MEMORY.md`, `USER.md`, skills et prompts.

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

    Vérifiez que les répertoires cachés ont été inclus et que le propriétaire des fichiers correspond à l’utilisateur qui exécutera le gateway.

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

Si Telegram ou Discord utilise le repli d’environnement par défaut (`TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN`), vérifiez que le `.env` du répertoire d’état migré contient ces clés sans afficher les valeurs secrètes :

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` avertit également lorsqu’un compte Telegram ou Discord par défaut activé n’a aucun jeton configuré et que la variable d’environnement correspondante n’est pas disponible pour le processus doctor.

### Pièges courants

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    Si l’ancien gateway utilisait `--profile` ou `OPENCLAW_STATE_DIR` et que le nouveau ne le fait pas, les canaux sembleront déconnectés et les sessions seront vides. Lancez le gateway avec le **même** profil ou répertoire d’état que celui que vous avez migré, puis relancez `openclaw doctor`.
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
    Le répertoire d’état contient des profils d’authentification, des identifiants de canaux et d’autres états de fournisseurs. Stockez les sauvegardes chiffrées, évitez les canaux de transfert non sécurisés et effectuez une rotation des clés si vous soupçonnez une exposition.
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

- [Migration Matrix](/fr/channels/matrix-migration) : limites de récupération de l’état chiffré, comportement de snapshot automatique et commandes de récupération manuelle.

## Connexe

- [`openclaw migrate`](/fr/cli/migrate) : référence CLI pour les imports entre systèmes.
- [Vue d’ensemble de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : contrôle de santé après migration.
- [Désinstaller](/fr/install/uninstall) : supprimer OpenClaw proprement.
