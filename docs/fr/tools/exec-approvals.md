---
read_when:
    - Configurer les approbations exec ou les listes d’autorisation
    - Mettre en œuvre l’UX d’approbation exec dans l’app macOS
    - Examiner les invites d’échappement au sandbox et leurs implications
sidebarTitle: Exec approvals
summary: 'Approbations exec de l’hôte : réglages de politique, listes d’autorisation, et workflow YOLO/strict'
title: Approbations Exec
x-i18n:
    generated_at: "2026-04-26T11:39:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Les approbations exec sont le **garde-fou de l’app compagnon / de l’hôte Node** pour laisser
un agent sandboxé exécuter des commandes sur un hôte réel (`gateway` ou `node`). C’est
un verrou de sécurité : les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation +
(l’approbation utilisateur facultative) sont toutes d’accord. Les approbations exec se superposent **par-dessus**
la politique d’outils et le filtrage elevated (sauf si elevated est défini sur `full`, ce qui
ignore les approbations).

<Note>
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs
par défaut des approbations ; si un champ d’approbation est omis, la valeur `tools.exec`
est utilisée. L’exec hôte utilise aussi l’état d’approbation local sur cette machine — un
`ask: "always"` local dans `~/.openclaw/exec-approvals.json` continue d’afficher des invites
même si les valeurs par défaut de session ou de configuration demandent `ask: "on-miss"`.
</Note>

## Inspection de la politique effective

| Commande                                                         | Ce qu’elle affiche                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Politique demandée, sources de politique de l’hôte, et résultat effectif.             |
| `openclaw exec-policy show`                                      | Vue fusionnée de la machine locale.                                                     |
| `openclaw exec-policy set` / `preset`                            | Synchroniser la politique locale demandée avec le fichier d’approbations de l’hôte local en une seule étape. |

Lorsqu’une portée locale demande `host=node`, `exec-policy show` rapporte cette
portée comme gérée par le Node à l’exécution au lieu de prétendre que le fichier local
d’approbations est la source de vérité.

Si l’UI de l’app compagnon **n’est pas disponible**, toute requête qui devrait
normalement afficher une invite est résolue par le **fallback ask** (par défaut : `deny`).

<Tip>
Les clients d’approbation de discussion natifs peuvent amorcer des affordances spécifiques au canal sur le
message d’approbation en attente. Par exemple, Matrix amorce des raccourcis de réaction
(`✅` autoriser une fois, `❌` refuser, `♾️` toujours autoriser) tout en laissant
les commandes `/approve ...` dans le message comme solution de repli.
</Tip>

## Où cela s’applique

Les approbations exec sont appliquées localement sur l’hôte d’exécution :

- **Hôte Gateway** → processus `openclaw` sur la machine Gateway.
- **Hôte Node** → runner Node (app compagnon macOS ou hôte Node headless).

### Modèle de confiance

- Les appelants authentifiés par la Gateway sont des opérateurs de confiance pour cette Gateway.
- Les Node appairés étendent cette capacité d’opérateur de confiance jusqu’à l’hôte Node.
- Les approbations exec réduisent le risque d’exécution accidentelle, mais **ne** constituent **pas** une frontière d’authentification par utilisateur.
- Les exécutions sur hôte Node approuvées lient le contexte d’exécution canonique : cwd canonique, argv exact, liaison env lorsqu’elle est présente, et chemin d’exécutable épinglé lorsque cela s’applique.
- Pour les scripts shell et les invocations directes de fichiers d’interpréteur/runtime, OpenClaw essaie aussi de lier un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution, l’exécution est refusée au lieu d’exécuter un contenu dérivant.
- La liaison de fichier est intentionnellement best-effort, **pas** un modèle sémantique complet de chaque chemin de chargement d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier, il refuse de créer une exécution adossée à une approbation au lieu de prétendre offrir une couverture complète.

### Séparation macOS

- Le **service d’hôte Node** transmet `system.run` à l’**app macOS** via IPC local.
- L’**app macOS** applique les approbations et exécute la commande dans le contexte UI.

## Réglages et stockage

Les approbations vivent dans un fichier JSON local sur l’hôte d’exécution :

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Réglages de politique

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — bloquer toutes les requêtes d’exec sur hôte.
  - `allowlist` — autoriser uniquement les commandes présentes dans la liste d’autorisation.
  - `full` — tout autoriser (équivalent à elevated).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — ne jamais afficher d’invite.
  - `on-miss` — afficher une invite uniquement lorsqu’il n’y a pas de correspondance dans la liste d’autorisation.
  - `always` — afficher une invite pour chaque commande. La confiance durable `allow-always` **ne** supprime **pas** les invites lorsque le mode ask effectif est `always`.
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
  Lorsque `true`, OpenClaw traite les formes d’évaluation de code en ligne comme nécessitant une approbation
  même si le binaire de l’interpréteur lui-même est dans la liste d’autorisation. Défense en profondeur
  pour les chargeurs d’interpréteur qui ne correspondent pas proprement à un opérande
  de fichier stable unique.
</ParamField>

Exemples détectés par le mode strict :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

En mode strict, ces commandes nécessitent toujours une approbation explicite, et
`allow-always` ne persiste pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Mode YOLO (sans approbation)

Si vous voulez qu’exec hôte s’exécute sans invites d’approbation, vous devez ouvrir
**les deux** couches de politique — la politique exec demandée dans la configuration OpenClaw
(`tools.exec.*`) **et** la politique locale d’approbation de l’hôte dans
`~/.openclaw/exec-approvals.json`.

YOLO est le comportement hôte par défaut sauf si vous le resserrez explicitement :

| Couche                | Réglage YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` sur `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Hôte `askFallback`    | `full`                     |

<Warning>
**Distinctions importantes :**

- `tools.exec.host=auto` choisit **où** exec s’exécute : sandbox lorsqu’il est disponible, sinon gateway.
- YOLO choisit **comment** l’exec hôte est approuvé : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw **n’ajoute pas** de gate d’approbation heuristique séparée contre l’obfuscation de commande ni de couche de rejet preflight de script par-dessus la politique configurée d’exec hôte.
- `auto` ne fait pas du routage gateway une dérogation gratuite depuis une session sandboxée. Une requête `host=node` par appel est autorisée depuis `auto` ; `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime sandbox n’est actif. Pour une valeur par défaut stable non-`auto`, définissez `tools.exec.host` ou utilisez explicitement `/exec host=...`.
  </Warning>

Les fournisseurs soutenus par CLI qui exposent leur propre mode de permission non interactif
peuvent suivre cette politique. Claude CLI ajoute
`--permission-mode bypassPermissions` lorsque la politique exec demandée par OpenClaw
est YOLO. Remplacez ce comportement backend avec des arguments Claude explicites
sous `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
par exemple `--permission-mode default`, `acceptEdits`, ou
`bypassPermissions`.

Si vous voulez une configuration plus prudente, resserrez l’une ou l’autre couche vers
`allowlist` / `on-miss` ou `deny`.

### Configuration persistante « ne jamais demander » sur l’hôte Gateway

<Steps>
  <Step title="Définir la politique demandée de configuration">
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

Ce raccourci local met à jour à la fois :

- Le `tools.exec.host/security/ask` local.
- Les valeurs par défaut locales de `~/.openclaw/exec-approvals.json`.

Il est intentionnellement réservé au local. Pour modifier à distance les
approbations de l’hôte Gateway ou de l’hôte Node, utilisez `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Hôte Node

Pour un hôte Node, appliquez à la place le même fichier d’approbations sur ce Node :

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
**Limites du local uniquement :**

- `openclaw exec-policy` ne synchronise pas les approbations du Node.
- `openclaw exec-policy set --host node` est rejeté.
- Les approbations exec du Node sont récupérées depuis le Node à l’exécution, donc les mises à jour ciblant le Node doivent utiliser `openclaw approvals --node ...`.
  </Note>

### Raccourci session uniquement

- `/exec security=full ask=off` ne modifie que la session actuelle.
- `/elevated full` est un raccourci break-glass qui ignore aussi les approbations exec pour cette session.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique de l’hôte
la plus stricte l’emporte quand même.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. Si plusieurs agents existent, changez l’agent
que vous modifiez dans l’app macOS. Les motifs sont des correspondances glob.

Les motifs peuvent être des globs de chemin binaire résolu ou des globs de nom de commande nu.
Les noms nus ne correspondent qu’aux commandes invoquées via `PATH`, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais **pas** à `./rg` ni
`/tmp/rg`. Utilisez un glob de chemin lorsque vous voulez faire confiance à un emplacement
binaire spécifique.

Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell telles que `echo ok && pwd` exigent toujours que chaque segment de niveau supérieur
respecte les règles de la liste d’autorisation.

Exemples :

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d’autorisation suit :

| Champ              | Signification                     |
| ------------------ | --------------------------------- |
| `id`               | UUID stable utilisé pour l’identité UI |
| `lastUsedAt`       | Horodatage de la dernière utilisation |
| `lastUsedCommand`  | Dernière commande ayant correspondu |
| `lastResolvedPath` | Dernier chemin binaire résolu     |

## Auto-autoriser les CLI de Skills

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par
des Skills connus sont traités comme autorisés sur les Node (Node macOS ou hôte
Node headless). Cela utilise `skills.bins` via la RPC Gateway pour récupérer la
liste des binaires de Skills. Désactivez cela si vous voulez des listes d’autorisation strictement manuelles.

<Warning>
- Il s’agit d’une **liste d’autorisation implicite de confort**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée aux environnements opérateur de confiance où Gateway et Node partagent la même frontière de confiance.
- Si vous exigez une confiance explicite stricte, gardez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.
</Warning>

## Bins sûrs et transfert d’approbation

Pour les bins sûrs (chemin rapide stdin-only), les détails de liaison des interpréteurs, et
la manière de transférer les invites d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme
clients d’approbation natifs), voir
[Exec approvals — avancé](/fr/tools/exec-approvals-advanced).

## Édition dans la Control UI

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut,
les remplacements par agent, et les listes d’autorisation. Choisissez une portée (Defaults ou un agent),
ajustez la politique, ajoutez/supprimez des motifs de liste d’autorisation, puis cliquez sur **Save**. L’UI
affiche les métadonnées de dernière utilisation par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**.
Les Node doivent annoncer `system.execApprovals.get/set` (app macOS ou
hôte Node headless). Si un Node n’annonce pas encore les approbations exec,
modifiez directement son `~/.openclaw/exec-approvals.json` local.

CLI : `openclaw approvals` prend en charge l’édition côté gateway ou côté node — voir
[CLI des approbations](/fr/cli/approvals).

## Flux d’approbation

Lorsqu’une invite est requise, la gateway diffuse
`exec.approval.requested` aux clients opérateur. La Control UI et l’app macOS
la résolvent via `exec.approval.resolve`, puis la gateway transmet la
requête approuvée à l’hôte Node.

Pour `host=node`, les requêtes d’approbation incluent un payload canonique
`systemRunPlan`. La gateway utilise ce plan comme contexte de
commande/cwd/session faisant autorité lors du transfert des requêtes
`system.run` approuvées.

C’est important pour la latence d’approbation asynchrone :

- Le chemin exec du Node prépare un plan canonique unique dès le départ.
- L’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison.
- Une fois approuvé, l’appel `system.run` final transmis réutilise le plan stocké au lieu de faire confiance à des modifications ultérieures de l’appelant.
- Si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId`, ou `sessionKey` après la création de la requête d’approbation, la gateway rejette l’exécution transmise comme incohérence d’approbation.

## Événements système

Le cycle de vie exec apparaît comme des messages système :

- `Exec running` (uniquement si la commande dépasse le seuil d’avis d’exécution).
- `Exec finished`.
- `Exec denied`.

Ils sont publiés dans la session de l’agent après que le Node a signalé l’événement.
Les approbations exec sur hôte Gateway émettent les mêmes événements de cycle de vie lorsque la
commande se termine (et éventuellement lorsqu’elle dure plus longtemps que le seuil).
Les exec contrôlés par approbation réutilisent l’id d’approbation comme `runId` dans ces
messages pour une corrélation facile.

## Comportement lors d’un refus d’approbation

Lorsqu’une approbation exec asynchrone est refusée, OpenClaw empêche l’agent de
réutiliser la sortie d’une exécution antérieure de la même commande dans la session.
La raison du refus est transmise avec une indication explicite qu’aucune sortie de commande
n’est disponible, ce qui empêche l’agent d’affirmer qu’il existe une nouvelle sortie ou
de répéter la commande refusée avec des résultats obsolètes d’une exécution réussie antérieure.

## Implications

- **`full`** est puissant ; préférez les listes d’autorisation lorsque c’est possible.
- **`ask`** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de fuiter vers les autres.
- Les approbations ne s’appliquent qu’aux requêtes exec sur hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau session pour les opérateurs autorisés et ignore les approbations par conception. Pour bloquer strictement l’exec sur hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outils.

## Associé

<CardGroup cols={2}>
  <Card title="Exec approvals — avancé" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Bins sûrs, liaison d’interpréteur, et transfert des approbations vers la discussion.
  </Card>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Outil d’exécution de commandes shell.
  </Card>
  <Card title="Mode Elevated" href="/fr/tools/elevated" icon="shield-exclamation">
    Chemin break-glass qui ignore aussi les approbations.
  </Card>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing" icon="box">
    Modes sandbox et accès à l’espace de travail.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security" icon="lock">
    Modèle de sécurité et durcissement.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chaque contrôle.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’auto-autorisation adossé aux Skills.
  </Card>
</CardGroup>
