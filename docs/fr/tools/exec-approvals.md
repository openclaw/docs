---
read_when:
    - Configurer les approbations Exec ou les listes d’autorisation
    - Implémentation de l’UX d’approbation Exec dans l’application macOS
    - Examen des invites d’échappement au bac à sable et de leurs implications
summary: Approbations Exec, listes d’autorisation et invites d’échappement au bac à sable
title: Approbations Exec
x-i18n:
    generated_at: "2026-04-25T13:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Les approbations Exec sont la **barrière de sécurité de l’application compagnon / de l’hôte de Node** qui permet à un agent isolé d’exécuter des commandes sur un hôte réel (`gateway` ou `node`). Il s’agit d’un interverrouillage de sécurité : les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation + l’approbation utilisateur (facultative) sont toutes d’accord. Les approbations Exec se superposent **par-dessus** la politique des outils et le contrôle elevated (sauf si elevated est défini sur `full`, ce qui ignore les approbations).

<Note>
La politique effective est la plus **stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ; si un champ d’approbation est omis, la valeur `tools.exec` est utilisée. L’exécution sur l’hôte utilise aussi l’état local des approbations sur cette machine — un `ask: "always"` local dans `~/.openclaw/exec-approvals.json` continue d’afficher des invites même si la session ou les valeurs par défaut de la configuration demandent `ask: "on-miss"`.
</Note>

## Inspection de la politique effective

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — affiche la politique demandée, les sources de politique de l’hôte et le résultat effectif.
- `openclaw exec-policy show` — vue fusionnée de la machine locale.
- `openclaw exec-policy set|preset` — synchronise en une étape la politique locale demandée avec le fichier local d’approbations de l’hôte.

Lorsqu’une portée locale demande `host=node`, `exec-policy show` signale cette portée
comme gérée par le node à l’exécution au lieu de prétendre que le fichier local
d’approbations est la source de vérité.

Si l’interface de l’application compagnon n’est **pas disponible**, toute demande qui devrait normalement
afficher une invite est résolue par le **repli ask** (par défaut : deny).

<Tip>
Les clients d’approbation natifs du chat peuvent injecter des affordances spécifiques au canal dans le message d’approbation en attente. Par exemple, Matrix injecte des raccourcis de réaction (`✅`
autoriser une fois, `❌` refuser, `♾️` autoriser toujours) tout en conservant les
commandes `/approve ...` dans le message comme solution de secours.
</Tip>

## Où cela s’applique

Les approbations Exec sont appliquées localement sur l’hôte d’exécution :

- **hôte gateway** → processus `openclaw` sur la machine Gateway
- **hôte node** → exécuteur de node (application compagnon macOS ou hôte de node headless)

Remarque sur le modèle de confiance :

- Les appelants authentifiés auprès du Gateway sont des opérateurs de confiance pour ce Gateway.
- Les nodes appairés étendent cette capacité d’opérateur de confiance à l’hôte node.
- Les approbations Exec réduisent le risque d’exécution accidentelle, mais ne constituent pas une frontière d’authentification par utilisateur.
- Les exécutions approuvées sur l’hôte node lient le contexte d’exécution canonique : `cwd` canonique, `argv` exact, liaison de l’environnement quand elle est présente, et chemin d’exécutable épinglé lorsqu’applicable.
- Pour les scripts shell et les invocations directes de fichiers d’interpréteur/runtime, OpenClaw essaie aussi de lier
  un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution,
  l’exécution est refusée au lieu d’exécuter un contenu qui a dérivé.
- Cette liaison de fichier est volontairement au mieux, pas un modèle sémantique complet de chaque
  chemin de chargement d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un seul
  fichier local concret à lier, il refuse de créer une exécution adossée à une approbation au lieu de prétendre à une couverture complète.

Découpage macOS :

- Le **service hôte de node** transfère `system.run` vers l’**application macOS** via IPC local.
- L’**application macOS** applique les approbations + exécute la commande dans le contexte de l’interface.

## Paramètres et stockage

Les approbations vivent dans un fichier JSON local sur l’hôte d’exécution :

`~/.openclaw/exec-approvals.json`

Exemple de schéma :

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Mode « YOLO » sans approbation

Si vous voulez que l’exécution sur l’hôte s’exécute sans invites d’approbation, vous devez ouvrir **les deux** couches de politique :

- la politique Exec demandée dans la configuration OpenClaw (`tools.exec.*`)
- la politique locale d’approbations de l’hôte dans `~/.openclaw/exec-approvals.json`

C’est désormais le comportement par défaut sur l’hôte, sauf si vous le resserrez explicitement :

- `tools.exec.security`: `full` sur `gateway`/`node`
- `tools.exec.ask`: `off`
- hôte `askFallback`: `full`

Distinction importante :

- `tools.exec.host=auto` choisit l’endroit où Exec s’exécute : bac à sable quand disponible, sinon gateway.
- YOLO choisit comment l’exécution sur l’hôte est approuvée : `security=full` plus `ask=off`.
- Les fournisseurs adossés à une CLI qui exposent leur propre mode d’autorisation non interactif peuvent suivre cette politique.
  Claude CLI ajoute `--permission-mode bypassPermissions` lorsque la politique Exec demandée par OpenClaw est
  YOLO. Remplacez ce comportement backend avec des arguments Claude explicites sous
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, par exemple
  `--permission-mode default`, `acceptEdits` ou `bypassPermissions`.
- En mode YOLO, OpenClaw n’ajoute pas de garde supplémentaire distincte d’approbation heuristique contre l’obfuscation des commandes ni de couche de rejet de pré-vérification de script au-dessus de la politique d’exécution sur l’hôte configurée.
- `auto` ne fait pas du routage gateway une dérogation gratuite depuis une session isolée. Une demande par appel `host=node` est autorisée depuis `auto`, et `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime isolé n’est actif. Si vous voulez une valeur par défaut stable non auto, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

Si vous voulez une configuration plus prudente, resserrez l’une ou l’autre couche vers `allowlist` / `on-miss`
ou `deny`.

Configuration persistante « ne jamais demander » sur l’hôte gateway :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Puis définissez le fichier d’approbations de l’hôte pour qu’il corresponde :

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Raccourci local pour la même politique d’hôte gateway sur la machine actuelle :

```bash
openclaw exec-policy preset yolo
```

Ce raccourci local met à jour les deux :

- `tools.exec.host/security/ask` local
- les valeurs par défaut locales de `~/.openclaw/exec-approvals.json`

Il est volontairement local uniquement. Si vous devez modifier à distance les approbations de l’hôte gateway ou de l’hôte node,
continuez à utiliser `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Pour un hôte node, appliquez à la place le même fichier d’approbations sur ce node :

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Limitation importante locale uniquement :

- `openclaw exec-policy` ne synchronise pas les approbations des nodes
- `openclaw exec-policy set --host node` est rejeté
- les approbations d’exécution des nodes sont récupérées depuis le node à l’exécution, donc les mises à jour ciblant un node doivent utiliser `openclaw approvals --node ...`

Raccourci pour la session uniquement :

- `/exec security=full ask=off` change uniquement la session actuelle.
- `/elevated full` est un raccourci de dernier recours qui ignore aussi les approbations Exec pour cette session.

Si le fichier local d’approbations de l’hôte reste plus strict que la configuration, la politique d’hôte la plus stricte l’emporte quand même.

## Réglages de politique

### Sécurité (`exec.security`)

- **deny** : bloque toutes les demandes d’exécution sur l’hôte.
- **allowlist** : autorise uniquement les commandes de la liste d’autorisation.
- **full** : autorise tout (équivalent à elevated).

### Ask (`exec.ask`)

- **off** : ne jamais afficher d’invite.
- **on-miss** : afficher une invite uniquement lorsqu’aucune correspondance n’existe dans la liste d’autorisation.
- **always** : afficher une invite pour chaque commande.
- La confiance durable `allow-always` ne supprime pas les invites lorsque le mode ask effectif est `always`

### Ask fallback (`askFallback`)

Si une invite est requise mais qu’aucune interface n’est joignable, le repli décide :

- **deny** : bloquer.
- **allowlist** : autoriser uniquement si la liste d’autorisation correspond.
- **full** : autoriser.

### Durcissement de l’évaluation inline de l’interpréteur (`tools.exec.strictInlineEval`)

Lorsque `tools.exec.strictInlineEval=true`, OpenClaw traite les formes d’évaluation inline de code comme nécessitant une approbation même si le binaire de l’interpréteur lui-même figure dans la liste d’autorisation.

Exemples :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Il s’agit d’une défense en profondeur pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un seul opérande de fichier stable. En mode strict :

- ces commandes nécessitent toujours une approbation explicite ;
- `allow-always` ne conserve pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. S’il existe plusieurs agents, changez l’agent que vous
modifiez dans l’application macOS. Les motifs sont des correspondances glob.
Les motifs peuvent être des globs de chemin de binaire résolu ou des globs de simple nom de commande. Les noms simples
correspondent uniquement aux commandes invoquées via PATH, donc `rg` peut correspondre à `/opt/homebrew/bin/rg`
lorsque la commande est `rg`, mais pas à `./rg` ni `/tmp/rg`. Utilisez un glob de chemin lorsque vous
voulez faire confiance à un emplacement de binaire précis.
Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell comme `echo ok && pwd` exigent toujours que chaque segment de niveau supérieur satisfasse les règles de la liste d’autorisation.

Exemples :

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d’autorisation suit :

- **id** UUID stable utilisé pour l’identité de l’interface (facultatif)
- **dernière utilisation** horodatage
- **dernière commande utilisée**
- **dernier chemin résolu**

## Autoriser automatiquement les CLI de Skills

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par des Skills connus
sont traités comme figurant dans la liste d’autorisation sur les nodes (node macOS ou hôte node headless). Cela utilise
`skills.bins` via la RPC Gateway pour récupérer la liste des binaires du skill. Désactivez cette option si vous voulez des listes d’autorisation manuelles strictes.

Remarques importantes sur la confiance :

- Il s’agit d’une **liste d’autorisation implicite de confort**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée aux environnements d’opérateurs de confiance où le Gateway et le node sont dans la même frontière de confiance.
- Si vous exigez une confiance explicite stricte, gardez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.

## Binaires sûrs et transfert d’approbation

Pour les binaires sûrs (le chemin rapide stdin-only), les détails de liaison d’interpréteur et la manière
de transférer les invites d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme clients d’approbation natifs), voir [Approvals Exec — avancé](/fr/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Édition dans le Control UI

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut, les remplacements par agent
et les listes d’autorisation. Choisissez une portée (Defaults ou un agent), ajustez la politique,
ajoutez/supprimez des motifs de liste d’autorisation, puis cliquez sur **Save**. L’interface affiche les métadonnées **last used**
par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**. Les nodes
doivent annoncer `system.execApprovals.get/set` (application macOS ou hôte node headless).
Si un node n’annonce pas encore les approbations Exec, modifiez directement son
`~/.openclaw/exec-approvals.json` local.

CLI : `openclaw approvals` prend en charge l’édition gateway ou node (voir [CLI Approvals](/fr/cli/approvals)).

## Flux d’approbation

Lorsqu’une invite est requise, le gateway diffuse `exec.approval.requested` aux clients opérateurs.
Le Control UI et l’application macOS la résolvent via `exec.approval.resolve`, puis le gateway transfère la
demande approuvée à l’hôte node.

Pour `host=node`, les demandes d’approbation incluent une charge utile canonique `systemRunPlan`. Le gateway utilise
ce plan comme contexte de commande/cwd/session faisant autorité lors du transfert des demandes `system.run`
approuvées.

Ceci est important pour la latence d’approbation asynchrone :

- le chemin Exec du node prépare un plan canonique en amont
- l’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison
- une fois approuvé, l’appel final `system.run` transféré réutilise le plan stocké
  au lieu de faire confiance à des modifications ultérieures de l’appelant
- si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` après la création de la demande d’approbation, le gateway rejette l’exécution
  transférée comme non conforme à l’approbation

## Événements système

Le cycle de vie Exec apparaît sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution)
- `Exec finished`
- `Exec denied`

Ils sont publiés dans la session de l’agent après que le node a signalé l’événement.
Les approbations Exec sur l’hôte gateway émettent les mêmes événements de cycle de vie lorsque la commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les exécutions contrôlées par approbation réutilisent l’identifiant d’approbation comme `runId` dans ces messages pour faciliter la corrélation.

## Comportement en cas de refus d’approbation

Lorsqu’une approbation Exec asynchrone est refusée, OpenClaw empêche l’agent de réutiliser
la sortie d’une exécution antérieure de la même commande dans la session. La raison du refus
est transmise avec une indication explicite qu’aucune sortie de commande n’est disponible, ce qui empêche
l’agent d’affirmer qu’il existe une nouvelle sortie ou de répéter la commande refusée avec
des résultats obsolètes issus d’une exécution réussie précédente.

## Implications

- **full** est puissant ; préférez les listes d’autorisation lorsque c’est possible.
- **ask** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de fuiter vers d’autres.
- Les approbations s’appliquent uniquement aux demandes d’exécution sur l’hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception. Pour bloquer strictement l’exécution sur l’hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique des outils.

## Lié

<CardGroup cols={2}>
  <Card title="Approvals Exec — avancé" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Binaires sûrs, liaison de l’interpréteur et transfert d’approbation vers le chat.
  </Card>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Outil d’exécution de commandes shell.
  </Card>
  <Card title="Mode elevated" href="/fr/tools/elevated" icon="shield-exclamation">
    Chemin de dernier recours qui ignore aussi les approbations.
  </Card>
  <Card title="Isolation" href="/fr/gateway/sandboxing" icon="box">
    Modes de bac à sable et accès à l’espace de travail.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security" icon="lock">
    Modèle de sécurité et durcissement.
  </Card>
  <Card title="Bac à sable vs politique des outils vs elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chaque contrôle.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’autorisation automatique adossé aux Skills.
  </Card>
</CardGroup>
