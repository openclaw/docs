---
read_when:
    - OpenClaw ne fonctionne pas et vous avez besoin de la solution la plus rapide
    - Vous souhaitez un processus de triage avant de vous plonger dans des guides opérationnels détaillés
summary: Centre de dépannage d’OpenClaw axé d’abord sur les symptômes
title: Dépannage général
x-i18n:
    generated_at: "2026-07-12T15:30:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: db50e0cdf4d11f3aa6196be445358d904a2b9c40c89243f1b124c77167f6dd85
    source_path: help/troubleshooting.md
    workflow: 16
---

Porte d’entrée du triage. 2 minutes pour établir un diagnostic, puis passez à la page détaillée.

## 60 premières secondes

Exécutez cette séquence dans l’ordre :

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Sortie correcte, une ligne pour chaque commande :

- `openclaw status` affiche les canaux configurés, sans erreur d’authentification.
- `openclaw status --all` produit un rapport complet et partageable.
- `openclaw gateway probe` affiche `Reachable: yes`. `Capability: ...` correspond au
  niveau d’authentification démontré par la sonde ; `Read probe: limited - missing scope:
operator.read` indique un diagnostic dégradé, et non un échec de connexion.
- `openclaw gateway status` affiche `Runtime: running`, `Connectivity probe:
ok` et une valeur plausible pour `Capability: ...`. Ajoutez `--require-rpc` pour exiger
  également une preuve RPC de la portée de lecture.
- `openclaw doctor` ne signale aucune erreur bloquante de configuration ou de service.
- `openclaw channels status --probe` renvoie l’état de transport en direct pour chaque compte
  (`works` / `audit ok`) lorsque le Gateway est accessible ; sinon, la commande
  revient à des résumés fondés uniquement sur la configuration.
- `openclaw logs --follow` affiche une activité régulière, sans erreur fatale récurrente.

## L’assistant semble limité ou des outils manquent

Vérifiez le profil d’outils effectif :

```bash
openclaw status
openclaw status --all
openclaw doctor
```

Causes courantes :

- `tools.profile: "minimal"` autorise uniquement `session_status`.
- `tools.profile: "messaging"` est restreint et destiné aux agents de conversation uniquement.
- `tools.profile: "coding"` est la valeur par défaut des nouvelles configurations locales
  (travail sur le dépôt, les fichiers, le shell et l’environnement d’exécution).
- `tools.profile: "full"` supprime les restrictions du profil ; réservez-le aux agents
  de confiance contrôlés par l’opérateur.
- Les remplacements par agent dans `agents.list[].tools` restreignent ou étendent le profil racine
  pour un agent donné.

Modifiez le profil, redémarrez ou rechargez le Gateway, puis vérifiez à nouveau avec
`openclaw status --all`. Tableau complet des profils et groupes : [Profils d’outils](/fr/gateway/config-tools#tool-profiles).

## Erreur 429 d’Anthropic avec un contexte long

`HTTP 429: rate_limit_error: Extra usage is required for long context requests`
→ [Erreur 429 d’Anthropic : utilisation supplémentaire requise pour un contexte long](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Le backend local compatible avec OpenAI fonctionne directement, mais échoue dans OpenClaw

Votre backend `/v1` local ou auto-hébergé répond aux sondes directes
`/v1/chat/completions`, mais échoue avec `openclaw infer model run` ou lors des tours normaux de l’agent :

1. Si l’erreur indique que `messages[].content` doit être une chaîne, définissez
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Si l’échec persiste uniquement lors des tours d’agent OpenClaw, définissez
   `models.providers.<provider>.models[].compat.supportsTools: false`, puis réessayez.
3. Si les petits appels directs fonctionnent, mais que les invites OpenClaw plus volumineuses font planter le backend,
   il s’agit d’une limite du modèle ou du serveur en amont, et non d’un bogue d’OpenClaw. Poursuivez dans
   [Le backend local compatible avec OpenAI réussit les sondes directes, mais les exécutions d’agent échouent](/fr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail).

## L’installation du Plugin échoue en raison d’extensions OpenClaw manquantes

`package.json missing openclaw.extensions` signifie que le paquet du Plugin utilise une
structure qu’OpenClaw n’accepte plus.

Corrigez le paquet du Plugin :

1. Ajoutez `openclaw.extensions` à `package.json`, en le faisant pointer vers les fichiers
   compilés de l’environnement d’exécution (généralement `./dist/index.js`).
2. Republiez le paquet, puis exécutez à nouveau `openclaw plugins install <package>`.

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Référence : [Architecture des Plugins](/fr/plugins/architecture)

## La politique d’installation bloque les installations ou les mises à jour des Plugins

La mise à jour se termine, mais les Plugins sont obsolètes, désactivés ou affichent `blocked by install
policy`, `install policy failed closed` ou `Disabled "<plugin>" after plugin
update failure` : vérifiez `security.installPolicy`.

La politique d’installation s’exécute lors des installations et des mises à jour de Plugins. Les versions des Plugins
`@openclaw/*` évoluent normalement avec la version d’OpenClaw ; une mise à jour d’OpenClaw peut donc
nécessiter une mise à jour correspondante des Plugins lors de la synchronisation après mise à jour.

Évitez les formes de politique suivantes, sauf si vous maintenez également la règle de mise à niveau correspondante :

- Figer les Plugins appartenant à OpenClaw sur une ancienne version précise (par exemple, uniquement
  `@openclaw/*@2026.5.3`).
- Bloquer uniquement selon le type de source (toutes les requêtes npm, réseau ou `request.mode:
"update"`).
- Considérer la commande de politique comme facultative : lorsque `security.installPolicy` est
  activé, un exécutable de politique manquant, lent, illisible ou bloqué par les autorisations
  provoque un refus par défaut.
- Approuver des versions sans comparer la valeur `openclawVersion` de la requête aux
  métadonnées du Plugin candidat.

Préférez des règles qui autorisent les mises à jour de confiance de `@openclaw/*` compatibles avec
l’hôte actuel, plutôt que d’épingler définitivement une seule version. Si vous bloquez npm
par défaut, ajoutez une exception restreinte pour les identifiants de Plugin que vous utilisez et appliquez la même
règle de confiance à `request.mode: "update"` qu’aux installations.

Récupération :

```bash
openclaw doctor --deep
openclaw plugins update --all
openclaw status --all
```

Si la politique est intentionnellement stricte, assouplissez-la pendant la fenêtre de mise à niveau
de confiance, réexécutez `openclaw plugins update --all`, puis rétablissez la règle plus stricte.
Si l’échec de la mise à jour a désactivé un Plugin, inspectez-le avant de le réactiver :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
openclaw plugins enable <plugin-id>
```

Référence : [Politique d’installation de l’opérateur](/fr/tools/skills-config#operator-install-policy-securityinstallpolicy)

## Le Plugin est présent, mais bloqué en raison d’un propriétaire suspect

Les avertissements de `openclaw doctor`, de la configuration ou du démarrage affichent :

```text
candidat Plugin bloqué : propriétaire suspect (... uid=1000, uid attendu=0 ou root)
Plugin présent mais bloqué
```

Les fichiers du Plugin appartiennent à un utilisateur Unix différent de celui du processus qui les charge.
Ne supprimez pas la configuration du Plugin ; corrigez le propriétaire des fichiers ou exécutez
OpenClaw sous l’identité de l’utilisateur propriétaire du répertoire d’état.

Les installations Docker s’exécutent sous l’utilisateur `node` (uid `1000`). Corrigez les montages bind de l’hôte :

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

Si vous exécutez intentionnellement OpenClaw en tant que root, corrigez plutôt le répertoire racine
géré des Plugins :

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

Documentation détaillée : [Propriétaire bloqué du chemin du Plugin](/fr/tools/plugin#blocked-plugin-path-ownership), [Docker : autorisations et EACCES](/fr/install/docker#shell-helpers-optional)

## Arbre de décision

```mermaid
flowchart TD
  A[OpenClaw ne fonctionne pas] --> B{Quel élément échoue en premier}
  B --> C[Aucune réponse]
  B --> D[Le tableau de bord ou l’interface de contrôle ne se connecte pas]
  B --> E[Le Gateway ne démarre pas ou le service ne s’exécute pas]
  B --> F[Le canal se connecte, mais les messages ne circulent pas]
  B --> G[Le Cron ou le Heartbeat ne s’est pas déclenché ou n’a rien transmis]
  B --> H[Le Node est appairé, mais l’exécution de la caméra, du canevas ou de l’écran échoue]
  B --> I[L’outil de navigateur échoue]

  C --> C1[/Section Aucune réponse/]
  D --> D1[/Section Interface de contrôle/]
  E --> E1[/Section Gateway/]
  F --> F1[/Section Flux du canal/]
  G --> G1[/Section Automatisation/]
  H --> H1[/Section Outils du Node/]
  I --> I1[/Section Navigateur/]
```

<AccordionGroup>
  <Accordion title="Aucune réponse">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Sortie correcte :

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Le canal indique que le transport est connecté et, lorsque cette fonction est prise en charge, `works` ou
      `audit ok` dans `channels status --probe`
    - L’expéditeur est approuvé (ou la politique des messages privés est ouverte ou utilise une liste d’autorisation)

    Signatures dans les journaux :

    - `drop guild message (mention required` → le filtrage des mentions Discord a bloqué le message.
    - `pairing request` → l’expéditeur n’est pas approuvé et attend l’approbation de l’appairage par message privé.
    - `blocked` / `allowlist` dans les journaux du canal → l’expéditeur, le salon ou le groupe a été filtré.

    Pages détaillées : [Aucune réponse](/fr/gateway/troubleshooting#no-replies), [Dépannage des canaux](/fr/channels/troubleshooting), [Appairage](/fr/channels/pairing)

  </Accordion>

  <Accordion title="Le tableau de bord ou l’interface de contrôle ne se connecte pas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Sortie correcte :

    - `Dashboard: http://...` apparaît dans `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`
    - Aucune boucle d’authentification dans les journaux

    Signatures dans les journaux :

    - `device identity required` → le contexte HTTP/non sécurisé ne permet pas de terminer l’authentification de l’appareil.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas autorisée pour la cible Gateway de l’interface de contrôle.
    - `AUTH_TOKEN_MISMATCH` avec `canRetryWithDeviceToken=true` → une nouvelle tentative unique avec le jeton d’appareil de confiance peut se produire automatiquement en réutilisant les portées mises en cache du jeton appairé.
    - répétition de `unauthorized` après cette nouvelle tentative → jeton ou mot de passe incorrect, mode d’authentification incompatible ou jeton d’appareil appairé obsolète.
    - `too many failed authentication attempts (retry later)` → les échecs répétés provenant de cette `Origin` de navigateur sont temporairement bloqués ; les autres origines localhost utilisent des compartiments distincts. Consultez [Connectivité du tableau de bord et de l’interface de contrôle](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity) pour la subtilité liée aux nouvelles tentatives simultanées de Tailscale Serve.
    - `gateway connect failed:` → l’interface cible une URL ou un port incorrect, ou le Gateway est inaccessible.

    Pages détaillées : [Connectivité du tableau de bord et de l’interface de contrôle](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity), [Interface de contrôle](/fr/web/control-ui), [Authentification](/fr/gateway/authentication)

  </Accordion>

  <Accordion title="Le Gateway ne démarre pas ou le service est installé, mais ne s’exécute pas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Sortie correcte :

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` ou `admin-capable`

    Signatures dans les journaux :

    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode du Gateway est distant, ou le marquage du mode local manque dans la configuration et doit être réparé.
    - `refusing to bind gateway ... without auth` → liaison hors boucle locale sans méthode d’authentification valide (jeton/mot de passe ou proxy de confiance, lorsqu’il est configuré).
    - `another gateway instance is already listening` ou `EADDRINUSE` → le port est déjà utilisé.

    Pages détaillées : [Le service Gateway ne s’exécute pas](/fr/gateway/troubleshooting#gateway-service-not-running), [Processus en arrière-plan](/fr/gateway/background-process), [Configuration](/fr/gateway/configuration)

  </Accordion>

  <Accordion title="Le canal se connecte, mais les messages ne circulent pas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Sortie correcte :

    - Le transport du canal est connecté.
    - Les vérifications d’appairage et de liste d’autorisation réussissent.
    - Les mentions sont détectées lorsqu’elles sont requises.

    Signatures dans les journaux :

    - `mention required` → le filtrage des mentions de groupe a bloqué le traitement.
    - `pairing` / `pending` → l’expéditeur du message privé n’est pas encore approuvé.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problème de jeton d’autorisation du canal.

    Pages détaillées : [Canal connecté, mais les messages ne circulent pas](/fr/gateway/troubleshooting#channel-connected-messages-not-flowing), [Dépannage des canaux](/fr/channels/troubleshooting)

  </Accordion>

  <Accordion title="Le Cron ou le Heartbeat ne s’est pas déclenché ou n’a rien transmis">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Sortie correcte :

    - `cron status` indique que le planificateur est activé et affiche son prochain réveil.
    - `cron runs` affiche des entrées `ok` récentes.
    - Le Heartbeat est activé et se trouve dans les heures d’activité.

    Signatures dans les journaux :

    - `cron: scheduler disabled; jobs will not run automatically` → cron est désactivé.
    - `heartbeat skipped` motif `quiet-hours` → en dehors des heures d’activité configurées.
    - `heartbeat skipped` motif `empty-heartbeat-file` → `HEARTBEAT.md` existe, mais ne contient que des éléments de structure vides, tels que des lignes vierges, commentaires, en-têtes, clôtures ou listes de contrôle vides.
    - `heartbeat skipped` motif `no-tasks-due` → le mode tâche est actif, mais aucun intervalle de tâche n’est encore arrivé à échéance.
    - `heartbeat skipped` motif `alerts-disabled` → `showOk`, `showAlerts` et `useIndicator` sont tous désactivés.
    - `requests-in-flight` → la file principale est occupée ; le réveil Heartbeat est différé.
    - `unknown accountId` → le compte cible de livraison Heartbeat n’existe pas.

    Pages détaillées : [Livraison Cron et Heartbeat](/fr/gateway/troubleshooting#cron-and-heartbeat-delivery), [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting), [Heartbeat](/fr/gateway/heartbeat)

  </Accordion>

  <Accordion title="Le Node est appairé, mais l’outil échoue pour la caméra, le canevas, l’écran ou l’exécution">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Sortie attendue :

    - Le Node est indiqué comme connecté et appairé pour le rôle `node`.
    - La fonctionnalité requise par la commande appelée est disponible.
    - L’autorisation est accordée pour l’outil.

    Signatures dans les journaux :

    - `NODE_BACKGROUND_UNAVAILABLE` → placez l’application du Node au premier plan.
    - `*_PERMISSION_REQUIRED` → autorisation du système d’exploitation refusée ou manquante.
    - `SYSTEM_RUN_DENIED: approval required` → l’approbation de l’exécution est en attente.
    - `SYSTEM_RUN_DENIED: allowlist miss` → la commande ne figure pas dans la liste d’autorisation d’exécution.

    Pages détaillées : [Node appairé, échec de l’outil](/fr/gateway/troubleshooting#node-paired-tool-fails), [Dépannage des Nodes](/fr/nodes/troubleshooting), [Approbations d’exécution](/fr/tools/exec-approvals)

  </Accordion>

  <Accordion title="L’exécution demande soudainement une approbation">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    Ce qui a changé :

    - Si `tools.exec.host` n’est pas défini, sa valeur par défaut est `auto`, qui se résout en `sandbox`
      lorsqu’un environnement d’exécution sandbox est actif, et en `gateway` dans le cas contraire.
    - `host=auto` ne fait que déterminer le routage ; l’absence de demande de confirmation provient de
      `security=full` associé à `ask=off` sur le Gateway/Node.
    - Si `tools.exec.security` n’est pas défini, sa valeur par défaut est `full` sur `gateway`/`node`.
    - Si `tools.exec.ask` n’est pas défini, sa valeur par défaut est `off`.
    - Si des approbations vous sont demandées, une politique locale à l’hôte ou propre à la session
      a renforcé les restrictions d’exécution par rapport à ces valeurs par défaut.

    Restaurez les valeurs par défaut actuelles sans approbation :

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Solutions de remplacement plus sûres :

    - Définissez uniquement `tools.exec.host=gateway` pour obtenir un routage stable vers l’hôte.
    - Utilisez `security=allowlist` avec `ask=on-miss` pour exécuter sur l’hôte avec validation
      lorsque la commande ne figure pas dans la liste d’autorisation.
    - Activez le mode sandbox afin que `host=auto` se résolve de nouveau en `sandbox`.

    Signatures dans les journaux :

    - `Approval required.` → la commande attend `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → l’approbation de l’exécution sur l’hôte Node est en attente.
    - `exec host=sandbox requires a sandbox runtime for this session` → sélection implicite ou explicite de la sandbox, mais le mode sandbox est désactivé.

    Pages détaillées : [Exécution](/fr/tools/exec), [Approbations d’exécution](/fr/tools/exec-approvals), [Sécurité : éléments vérifiés par l’audit](/fr/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="L’outil de navigation échoue">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Sortie attendue :

    - L’état du navigateur affiche `running: true` ainsi qu’un navigateur/profil sélectionné.
    - Le profil `openclaw` démarre, ou le profil `user` détecte les onglets Chrome locaux.

    Signatures dans les journaux :

    - `unknown command "browser"` → `plugins.allow` est défini et exclut `browser`.
    - `Failed to start Chrome CDP on port` → le démarrage du navigateur local a échoué.
    - `browser.executablePath not found` → le chemin configuré vers le fichier binaire est incorrect.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée contient un port incorrect ou hors plage.
    - `No Chrome tabs found for profile="user"` → le profil de connexion Chrome MCP ne comporte aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré est inaccessible depuis cet hôte.
    - `Browser attachOnly is enabled ... not reachable` → le profil en connexion seule ne dispose d’aucune cible CDP active.
    - Remplacements obsolètes de la fenêtre d’affichage, du mode sombre, des paramètres régionaux ou du mode hors ligne sur les profils en connexion seule ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle et libérer l’état d’émulation sans redémarrer le Gateway.

    Pages détaillées : [Échec de l’outil de navigation](/fr/gateway/troubleshooting#browser-tool-fails), [Commande ou outil de navigation manquant](/fr/tools/browser#missing-browser-command-or-tool), [Navigateur : dépannage sous Linux](/fr/tools/browser-linux-troubleshooting), [Navigateur : dépannage de CDP distant sous WSL2/Windows](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Pages connexes

- [FAQ](/fr/help/faq) — questions fréquentes
- [Dépannage du Gateway](/fr/gateway/troubleshooting) — problèmes propres au Gateway
- [Doctor](/fr/gateway/doctor) — contrôles d’intégrité et réparations automatisés
- [Dépannage des canaux](/fr/channels/troubleshooting) — problèmes de connectivité des canaux
- [Tâches planifiées : dépannage](/fr/automation/cron-jobs#troubleshooting) — problèmes liés à Cron et à Heartbeat
