---
read_when:
    - Configuration des approbations d’exécution ou des listes d’autorisation
    - Implémentation de l’expérience utilisateur d’approbation d’exécution dans l’application macOS
    - Examen des invites d’échappement du bac à sable et de leurs implications
sidebarTitle: Exec approvals
summary: 'Approbations d’exécution sur l’hôte : paramètres de politique, listes d’autorisation et workflow YOLO/strict'
title: Autorisations d’exécution
x-i18n:
    generated_at: "2026-04-30T07:51:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Les approbations d’exécution sont le **garde-fou de l’application compagnon / de l’hôte de nœud** permettant à un agent en bac à sable d’exécuter des commandes sur un hôte réel (`gateway` ou `node`). Un verrou de sécurité : les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation + l’approbation utilisateur (facultative) concordent toutes. Les approbations d’exécution s’empilent **par-dessus** la politique des outils et le contrôle d’élévation (sauf si l’élévation est définie sur `full`, ce qui ignore les approbations).

<Note>
La politique effective est la **plus stricte** entre les valeurs par défaut de `tools.exec.*` et des approbations ; si un champ des approbations est omis, la valeur de `tools.exec` est utilisée. L’exécution sur l’hôte utilise aussi l’état local des approbations sur cette machine : un `ask: "always"` local à l’hôte dans `~/.openclaw/exec-approvals.json` continue de demander confirmation même si la session ou les valeurs par défaut de configuration demandent `ask: "on-miss"`.
</Note>

## Inspection de la politique effective

| Commande                                                         | Ce qu’elle affiche                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Politique demandée, sources de politique de l’hôte et résultat effectif.               |
| `openclaw exec-policy show`                                      | Vue fusionnée de la machine locale.                                                    |
| `openclaw exec-policy set` / `preset`                            | Synchronise en une étape la politique locale demandée avec le fichier local d’approbations de l’hôte. |

Lorsqu’une portée locale demande `host=node`, `exec-policy show` signale cette portée comme gérée par le nœud à l’exécution au lieu de prétendre que le fichier local d’approbations est la source de vérité.

Si l’UI de l’application compagnon n’est **pas disponible**, toute demande qui déclencherait normalement une invite est résolue par le **repli ask** (par défaut : `deny`).

<Tip>
Les clients d’approbation de chat natifs peuvent initialiser des affordances propres au canal sur le message d’approbation en attente. Par exemple, Matrix initialise des raccourcis de réaction (`✅` autoriser une fois, `❌` refuser, `♾️` toujours autoriser) tout en laissant les commandes `/approve ...` dans le message comme repli.
</Tip>

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **Hôte Gateway** → processus `openclaw` sur la machine Gateway.
- **Hôte Node** → exécuteur Node (application compagnon macOS ou hôte Node sans interface).

### Modèle de confiance

- Les appelants authentifiés auprès du Gateway sont des opérateurs approuvés pour ce Gateway.
- Les nœuds appairés étendent cette capacité d’opérateur approuvé à l’hôte Node.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent **pas** une limite d’authentification par utilisateur.
- Les exécutions approuvées sur hôte Node lient un contexte d’exécution canonique : cwd canonique, argv exact, liaison d’environnement lorsqu’elle est présente et chemin d’exécutable épinglé le cas échéant.
- Pour les scripts shell et les invocations directes de fichiers d’interpréteur/runtime, OpenClaw tente aussi de lier un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution, l’exécution est refusée au lieu d’exécuter un contenu qui a dérivé.
- La liaison de fichier est volontairement au mieux, et **non** un modèle sémantique complet de tous les chemins de chargeur d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier, il refuse de créer une exécution adossée à une approbation au lieu de prétendre couvrir tous les cas.

### Séparation macOS

- Le **service d’hôte Node** transmet `system.run` à l’**application macOS** via l’IPC local.
- L’**application macOS** applique les approbations et exécute la commande dans le contexte UI.

## Paramètres et stockage

Les approbations se trouvent dans un fichier JSON local sur l’hôte d’exécution :

```text
~/.openclaw/exec-approvals.json
```

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
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Boutons de politique

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — bloque toutes les demandes d’exécution sur l’hôte.
  - `allowlist` — autorise uniquement les commandes en liste d’autorisation.
  - `full` — autorise tout (équivalent à élevé).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — ne jamais demander de confirmation.
  - `on-miss` — demander uniquement lorsque la liste d’autorisation ne correspond pas.
  - `always` — demander à chaque commande. La confiance durable `allow-always` ne supprime **pas** les invites lorsque le mode ask effectif est `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Résolution lorsqu’une invite est requise mais qu’aucune UI n’est joignable.

- `deny` — bloquer.
- `allowlist` — autoriser uniquement si la liste d’autorisation correspond.
- `full` — autoriser.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Lorsque `true`, OpenClaw traite les formes d’évaluation de code en ligne comme nécessitant une approbation, même si le binaire de l’interpréteur lui-même est en liste d’autorisation. Défense en profondeur pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un opérande de fichier stable unique.
</ParamField>

Exemples interceptés par le mode strict :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

En mode strict, ces commandes nécessitent toujours une approbation explicite, et `allow-always` ne conserve pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Mode YOLO (sans approbation)

Si vous voulez que l’exécution sur l’hôte s’exécute sans invites d’approbation, vous devez ouvrir **les deux** couches de politique : la politique d’exécution demandée dans la configuration OpenClaw (`tools.exec.*`) **et** la politique d’approbations locale à l’hôte dans `~/.openclaw/exec-approvals.json`.

YOLO est le comportement par défaut de l’hôte, sauf si vous le durcissez explicitement :

| Couche                | Paramètre YOLO             |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` sur `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Hôte `askFallback`    | `full`                     |

<Warning>
**Distinctions importantes :**

- `tools.exec.host=auto` choisit **où** l’exécution a lieu : bac à sable lorsqu’il est disponible, sinon Gateway.
- YOLO choisit **comment** l’exécution sur l’hôte est approuvée : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw n’ajoute **pas** de barrière d’approbation heuristique distincte pour l’obfuscation de commandes ni de couche de rejet préalable des scripts par-dessus la politique d’exécution sur l’hôte configurée.
- `auto` ne fait pas du routage vers Gateway un contournement libre depuis une session en bac à sable. Une demande par appel `host=node` est autorisée depuis `auto` ; `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime de bac à sable n’est actif. Pour une valeur par défaut stable non automatique, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

</Warning>

Les fournisseurs adossés à la CLI qui exposent leur propre mode d’autorisation non interactif peuvent suivre cette politique. Claude CLI ajoute `--permission-mode bypassPermissions` lorsque la politique d’exécution demandée par OpenClaw est YOLO. Remplacez ce comportement du backend avec des arguments Claude explicites sous `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` — par exemple `--permission-mode default`, `acceptEdits` ou `bypassPermissions`.

Si vous voulez une configuration plus conservatrice, resserrez l’une ou l’autre couche à `allowlist` / `on-miss` ou `deny`.

### Configuration persistante « ne jamais demander » pour l’hôte Gateway

<Steps>
  <Step title="Définir la politique de configuration demandée">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Faire correspondre le fichier d’approbations de l’hôte">
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
  </Step>
</Steps>

### Raccourci local

```bash
openclaw exec-policy preset yolo
```

Ce raccourci local met à jour les deux éléments :

- `tools.exec.host/security/ask` locaux.
- Valeurs par défaut locales de `~/.openclaw/exec-approvals.json`.

Il est volontairement limité au local. Pour modifier à distance les approbations de l’hôte Gateway ou de l’hôte Node, utilisez `openclaw approvals set --gateway` ou `openclaw approvals set --node <id|name|ip>`.

### Hôte Node

Pour un hôte Node, appliquez plutôt le même fichier d’approbations sur ce nœud :

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

<Note>
**Limites locales uniquement :**

- `openclaw exec-policy` ne synchronise pas les approbations des nœuds.
- `openclaw exec-policy set --host node` est rejeté.
- Les approbations d’exécution Node sont récupérées depuis le nœud à l’exécution ; les mises à jour ciblant un nœud doivent donc utiliser `openclaw approvals --node ...`.

</Note>

### Raccourci limité à la session

- `/exec security=full ask=off` modifie uniquement la session actuelle.
- `/elevated full` est un raccourci d’urgence qui ignore aussi les approbations d’exécution pour cette session.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique d’hôte plus stricte l’emporte toujours.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. S’il existe plusieurs agents, changez l’agent que vous modifiez dans l’application macOS. Les motifs sont des correspondances glob.

Les motifs peuvent être des globs de chemin binaire résolu ou des globs de nom de commande nu. Les noms nus ne correspondent qu’aux commandes invoquées via `PATH`, donc `rg` peut correspondre à `/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais **pas** à `./rg` ni à `/tmp/rg`. Utilisez un glob de chemin lorsque vous voulez faire confiance à un emplacement de binaire précis.

Les entrées héritées `agents.default` sont migrées vers `agents.main` au chargement. Les chaînes shell comme `echo ok && pwd` nécessitent toujours que chaque segment de premier niveau satisfasse aux règles de la liste d’autorisation.

Exemples :

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d’autorisation suit :

| Champ              | Signification                         |
| ------------------ | ------------------------------------- |
| `id`               | UUID stable utilisé pour l’identité UI |
| `lastUsedAt`       | Horodatage de dernière utilisation    |
| `lastUsedCommand`  | Dernière commande qui a correspondu   |
| `lastResolvedPath` | Dernier chemin binaire résolu         |

## Autorisation automatique des CLI de Skills

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par les Skills connus sont traités comme en liste d’autorisation sur les nœuds (nœud macOS ou hôte Node sans interface). Cela utilise `skills.bins` via la RPC Gateway pour récupérer la liste des bins de Skills. Désactivez cette option si vous voulez des listes d’autorisation manuelles strictes.

<Warning>
- Il s’agit d’une **liste d’autorisation de commodité implicite**, distincte des entrées manuelles de liste d’autorisation de chemins.
- Elle est destinée aux environnements d’opérateurs approuvés où Gateway et le nœud se trouvent dans la même limite de confiance.
- Si vous exigez une confiance strictement explicite, conservez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation de chemins.

</Warning>

## Bins sûrs et transfert d’approbations

Pour les bins sûrs (le chemin rapide stdin uniquement), les détails de liaison d’interpréteur et la manière de transférer les invites d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme clients d’approbation natifs), consultez [Approbations d’exécution — avancé](/fr/tools/exec-approvals-advanced).

## Modification dans l’UI de contrôle

Utilisez la carte **UI de contrôle → Nœuds → Approbations d’exécution** pour modifier les valeurs par défaut, les remplacements par agent et les listes d’autorisation. Choisissez une portée (valeurs par défaut ou un agent), ajustez la politique, ajoutez/supprimez des motifs de liste d’autorisation, puis **Enregistrer**. L’UI affiche les métadonnées de dernière utilisation par motif afin que vous puissiez garder la liste ordonnée.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**.
Les Nodes doivent annoncer `system.execApprovals.get/set` (application macOS ou
hôte de node sans interface). Si un node n’annonce pas encore les approbations exec,
modifiez directement son fichier local `~/.openclaw/exec-approvals.json`.

CLI : `openclaw approvals` prend en charge la modification du gateway ou d’un node — voir
[CLI des approbations](/fr/cli/approvals).

## Flux d’approbation

Lorsqu’une invite est requise, le gateway diffuse
`exec.approval.requested` aux clients opérateurs. L’interface de contrôle et l’application macOS
la résolvent via `exec.approval.resolve`, puis le gateway transmet la
requête approuvée à l’hôte du node.

Pour `host=node`, les requêtes d’approbation incluent une charge utile canonique
`systemRunPlan`. Le gateway utilise ce plan comme contexte
command/cwd/session faisant autorité lors de la transmission des requêtes
`system.run` approuvées.

C’est important pour la latence des approbations asynchrones :

- Le chemin d’exécution du node prépare un plan canonique unique en amont.
- L’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison.
- Une fois approuvé, l’appel final `system.run` transmis réutilise le plan stocké au lieu de faire confiance à des modifications ultérieures de l’appelant.
- Si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` après la création de la requête d’approbation, le gateway rejette l’exécution transmise pour non-correspondance d’approbation.

## Événements système

Le cycle de vie exec est exposé sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution).
- `Exec finished`.
- `Exec denied`.

Ces messages sont publiés dans la session de l’agent après que le node a signalé l’événement.
Les approbations exec hébergées par le gateway émettent les mêmes événements de cycle de vie lorsque la
commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les execs soumises à approbation réutilisent l’identifiant d’approbation comme `runId` dans ces
messages afin de faciliter la corrélation.

## Comportement en cas d’approbation refusée

Lorsqu’une approbation exec asynchrone est refusée, OpenClaw empêche l’agent de
réutiliser la sortie d’une exécution antérieure de la même commande dans la session.
Le motif du refus est transmis avec une indication explicite qu’aucune sortie de commande
n’est disponible, ce qui empêche l’agent d’affirmer qu’il existe une nouvelle sortie ou
de répéter la commande refusée avec des résultats obsolètes provenant d’une exécution
réussie précédente.

## Implications

- **`full`** est puissant ; privilégiez les listes d’autorisation lorsque c’est possible.
- **`ask`** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de se propager aux autres.
- Les approbations s’appliquent uniquement aux requêtes exec hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception. Pour bloquer strictement l’exec hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outils.

## Connexe

<CardGroup cols={2}>
  <Card title="Approbations exec — avancé" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Bacs sécurisés, liaison d’interpréteur et transmission des approbations vers le chat.
  </Card>
  <Card title="Outil exec" href="/fr/tools/exec" icon="terminal">
    Outil d’exécution de commandes shell.
  </Card>
  <Card title="Mode élevé" href="/fr/tools/elevated" icon="shield-exclamation">
    Chemin d’urgence qui ignore également les approbations.
  </Card>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing" icon="box">
    Modes de sandbox et accès à l’espace de travail.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security" icon="lock">
    Modèle de sécurité et renforcement.
  </Card>
  <Card title="Sandbox vs politique d’outils vs mode élevé" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chaque contrôle.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’autorisation automatique adossé aux Skills.
  </Card>
</CardGroup>
