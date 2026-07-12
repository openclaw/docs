---
read_when:
    - Vous déplacez OpenClaw vers un nouvel ordinateur portable ou serveur
    - Vous venez d’un autre système d’agents et souhaitez conserver l’état
    - Vous mettez à niveau un plugin existant sur place
summary: 'Centre de migration : importations intersystèmes, transferts de machine à machine et mises à niveau des plugins'
title: Guide de migration
x-i18n:
    generated_at: "2026-07-12T02:45:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw prend en charge trois parcours de migration : l’importation depuis un autre système d’agents, le déplacement d’une installation existante vers une nouvelle machine et la mise à niveau d’un plugin sur place.

## Importer depuis un autre système d’agents

Les fournisseurs de migration intégrés importent dans OpenClaw les instructions, les serveurs MCP, les Skills, la configuration des modèles et, sur acceptation explicite, les clés API. Les plans sont prévisualisés avant toute modification, les secrets sont masqués dans les rapports et l’application s’appuie sur une sauvegarde vérifiée.

<CardGroup cols={2}>
  <Card title="Migration depuis Claude" href="/fr/install/migrating-claude" icon="brain">
    Importez l’état de Claude Code et de Claude Desktop, notamment `CLAUDE.md`, les serveurs MCP, les Skills et les commandes de projet.
  </Card>
  <Card title="Migration depuis Hermes" href="/fr/install/migrating-hermes" icon="feather">
    Importez la configuration, les fournisseurs, les serveurs MCP, la mémoire, les Skills et les clés `.env` prises en charge de Hermes.
  </Card>
</CardGroup>

Le point d’entrée de la CLI est [`openclaw migrate`](/fr/cli/migrate). L’intégration peut également proposer une migration lorsqu’elle détecte une source connue (`openclaw onboard --flow import`).

## Déplacer OpenClaw vers une nouvelle machine

Copiez le **répertoire d’état** (`~/.openclaw/` par défaut) et votre **espace de travail** afin de conserver :

- **Configuration** — `openclaw.json` et tous les paramètres du Gateway.
- **Authentification** — le fichier `auth-profiles.json` de chaque agent (clés API et OAuth), ainsi que tout état de canal ou de fournisseur sous `credentials/`.
- **Sessions** — l’historique des conversations et l’état des agents.
- **État des canaux** — la connexion WhatsApp, la session Telegram et les éléments similaires.
- **Fichiers de l’espace de travail** — `MEMORY.md`, `USER.md`, les Skills et les invites.

<Tip>
Exécutez `openclaw status` sur l’ancienne machine pour confirmer le chemin de votre répertoire d’état. Les profils personnalisés utilisent `~/.openclaw-<profile>/` ou un chemin défini par `OPENCLAW_STATE_DIR`.
</Tip>

### Étapes de migration

<Steps>
  <Step title="Arrêter le Gateway et effectuer une sauvegarde">
    Sur l’**ancienne** machine, arrêtez le Gateway afin que les fichiers ne soient pas modifiés pendant la copie, puis créez une archive :

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si vous utilisez plusieurs profils (par exemple `~/.openclaw-work`), archivez-les séparément.

  </Step>

  <Step title="Installer OpenClaw sur la nouvelle machine">
    [Installez](/fr/install) la CLI (et Node si nécessaire) sur la nouvelle machine. Ce n’est pas un problème si l’intégration crée un nouveau répertoire `~/.openclaw/` : vous le remplacerez à l’étape suivante.
  </Step>

  <Step title="Copier le répertoire d’état et l’espace de travail">
    Transférez l’archive avec `scp`, `rsync -a` ou un disque externe, puis extrayez-la :

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Vérifiez que les répertoires masqués ont été inclus et que les propriétaires des fichiers correspondent à l’utilisateur qui exécutera le Gateway.

  </Step>

  <Step title="Exécuter le diagnostic et vérifier">
    Sur la nouvelle machine, exécutez [Doctor](/fr/gateway/doctor) afin d’appliquer les migrations de configuration et de réparer les services :

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Si Telegram ou Discord utilise la variable d’environnement de secours par défaut (`TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN`), vérifiez que le fichier `.env` du répertoire d’état migré contient ces clés sans afficher les valeurs secrètes :

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` affiche également un avertissement lorsqu’un compte Telegram ou Discord par défaut activé ne dispose d’aucun jeton configuré et que la variable d’environnement correspondante n’est pas accessible au processus de diagnostic.

### Problèmes courants

<AccordionGroup>
  <Accordion title="Incohérence de profil ou de répertoire d’état">
    Si l’ancien Gateway utilisait `--profile` ou `OPENCLAW_STATE_DIR`, contrairement au nouveau, les canaux sembleront déconnectés et les sessions seront vides. Lancez le Gateway avec le **même** profil ou répertoire d’état que celui que vous avez migré, puis réexécutez `openclaw doctor`.
  </Accordion>

  <Accordion title="Copie du seul fichier openclaw.json">
    Le fichier de configuration seul ne suffit pas. Les profils d’authentification des modèles se trouvent sous `agents/<agentId>/agent/auth-profiles.json`, tandis que l’état des canaux et des fournisseurs se trouve sous `credentials/`. Migrez toujours l’**intégralité** du répertoire d’état.
  </Accordion>

  <Accordion title="Autorisations et propriété">
    Si vous avez effectué la copie en tant que superutilisateur ou changé d’utilisateur, le Gateway risque de ne pas pouvoir lire les identifiants. Assurez-vous que le répertoire d’état et l’espace de travail appartiennent à l’utilisateur qui exécute le Gateway.
  </Accordion>

  <Accordion title="Mode distant">
    Si votre interface utilisateur pointe vers un Gateway **distant**, l’hôte distant détient les sessions et l’espace de travail. Migrez l’hôte du Gateway lui-même, et non votre ordinateur portable local. Consultez la [FAQ](/fr/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secrets dans les sauvegardes">
    Le répertoire d’état contient les profils d’authentification, les identifiants des canaux et d’autres états de fournisseurs. Stockez les sauvegardes sous forme chiffrée, évitez les canaux de transfert non sécurisés et renouvelez les clés si vous soupçonnez une exposition.
  </Accordion>
</AccordionGroup>

### Liste de vérification

Sur la nouvelle machine, vérifiez les points suivants :

- [ ] `openclaw status` indique que le Gateway est en cours d’exécution.
- [ ] Les canaux sont toujours connectés (aucun nouvel appairage nécessaire).
- [ ] Le tableau de bord s’ouvre et affiche les sessions existantes.
- [ ] Les fichiers de l’espace de travail (mémoire, configurations) sont présents.

## Mettre à niveau un plugin sur place

Les mises à niveau de plugins sur place conservent le même identifiant de plugin et les mêmes clés de configuration, mais peuvent déplacer l’état stocké sur disque vers la structure actuelle. Les guides de mise à niveau propres aux plugins se trouvent à côté de leurs canaux :

- [Migration de Matrix](/fr/channels/matrix-migration) : limites de récupération de l’état chiffré, comportement des instantanés automatiques et commandes de récupération manuelle.

## Ressources associées

- [`openclaw migrate`](/fr/cli/migrate) : référence de la CLI pour les importations entre systèmes.
- [Présentation de l’installation](/fr/install) : toutes les méthodes d’installation.
- [Doctor](/fr/gateway/doctor) : contrôle de l’état après la migration.
- [Désinstallation](/fr/install/uninstall) : suppression propre d’OpenClaw.
