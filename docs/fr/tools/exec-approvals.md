---
read_when:
    - Configurer les approbations d’exécution ou les listes d’autorisation
    - Implémentation de l’expérience utilisateur d’approbation de l’exécution dans l’application macOS
    - Examen des invites d’évasion du bac à sable et de leurs implications
sidebarTitle: Exec approvals
summary: 'Approbations d’exécution sur l’hôte : paramètres de politique, listes d’autorisation et flux de travail YOLO/strict'
title: Approbations d’exécution
x-i18n:
    generated_at: "2026-05-06T07:41:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Les approbations d’exécution sont le **garde-fou de l’application compagnon / de l’hôte Node** qui permet
à un agent placé en bac à sable d’exécuter des commandes sur un hôte réel (`gateway` ou `node`). Un
verrou de sécurité : les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation +
l’approbation utilisateur (facultative) concordent toutes. Les approbations d’exécution s’empilent **au-dessus de**
la politique d’outils et du filtrage élevé (sauf si elevated est défini sur `full`, ce qui
ignore les approbations).

<Note>
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ;
si un champ d’approbations est omis, la valeur `tools.exec` est utilisée.
L’exécution sur l’hôte utilise aussi l’état local des approbations sur cette machine : un
`ask: "always"` local à l’hôte dans `~/.openclaw/exec-approvals.json` continue
de demander confirmation même si les valeurs par défaut de session ou de config demandent `ask: "on-miss"`.
</Note>

## Inspecter la politique effective

| Commande                                                         | Ce qu’elle affiche                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Politique demandée, sources de politique de l’hôte et résultat effectif.               |
| `openclaw exec-policy show`                                      | Vue fusionnée de la machine locale.                                                    |
| `openclaw exec-policy set` / `preset`                            | Synchronise la politique demandée locale avec le fichier d’approbations de l’hôte local en une seule étape. |

Lorsqu’un périmètre local demande `host=node`, `exec-policy show` signale ce
périmètre comme géré par le Node à l’exécution au lieu de prétendre que le fichier
d’approbations local est la source de vérité.

Si l’interface utilisateur de l’application compagnon n’est **pas disponible**, toute demande qui
déclencherait normalement une invite est résolue par le **repli ask** (par défaut : `deny`).

<Tip>
Les clients d’approbation de chat natifs peuvent préremplir des options propres au canal dans le
message d’approbation en attente. Par exemple, Matrix préremplit des raccourcis de réaction
(`✅` autoriser une fois, `❌` refuser, `♾️` toujours autoriser) tout en laissant
les commandes `/approve ...` dans le message comme solution de repli.
</Tip>

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **Hôte Gateway** → processus `openclaw` sur la machine Gateway.
- **Hôte Node** → exécuteur Node (application compagnon macOS ou hôte Node sans interface).

### Modèle de confiance

- Les appelants authentifiés auprès du Gateway sont des opérateurs de confiance pour ce Gateway.
- Les nœuds appairés étendent cette capacité d’opérateur de confiance à l’hôte Node.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent **pas** une frontière d’authentification par utilisateur.
- Les exécutions approuvées sur l’hôte Node lient le contexte d’exécution canonique : cwd canonique, argv exact, liaison d’env lorsqu’elle est présente, et chemin d’exécutable épinglé le cas échéant.
- Pour les scripts shell et les invocations directes de fichiers d’interpréteur/runtime, OpenClaw essaie aussi de lier un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution, l’exécution est refusée au lieu d’exécuter un contenu modifié.
- La liaison de fichiers est volontairement au mieux, **pas** un modèle sémantique complet de chaque chemin de chargeur d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier, il refuse de créer une exécution adossée à une approbation au lieu de prétendre offrir une couverture complète.

### Séparation macOS

- Le **service d’hôte Node** transfère `system.run` à l’**application macOS** via IPC local.
- L’**application macOS** applique les approbations et exécute la commande dans le contexte de l’interface utilisateur.

## Paramètres et stockage

Les approbations résident dans un fichier JSON local sur l’hôte d’exécution :

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
  - `deny` - bloque toutes les demandes d’exécution sur l’hôte.
  - `allowlist` - autorise uniquement les commandes présentes dans la liste d’autorisation.
  - `full` - autorise tout (équivalent à elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - ne demande jamais de confirmation.
  - `on-miss` - demande uniquement lorsque la liste d’autorisation ne correspond pas.
  - `always` - demande à chaque commande. La confiance durable `allow-always` ne supprime **pas** les invites lorsque le mode ask effectif est `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Résolution lorsqu’une invite est requise mais qu’aucune interface utilisateur n’est accessible.

- `deny` - bloque.
- `allowlist` - autorise uniquement si la liste d’autorisation correspond.
- `full` - autorise.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Lorsque `true`, OpenClaw traite les formes d’évaluation de code en ligne comme nécessitant uniquement une approbation,
  même si le binaire de l’interpréteur lui-même figure dans la liste d’autorisation. Défense en profondeur
  pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un opérande
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
`allow-always` ne conserve pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Mode YOLO (sans approbation)

Si vous voulez que l’exécution sur l’hôte s’exécute sans invites d’approbation, vous devez ouvrir
**les deux** couches de politique : la politique d’exécution demandée dans la configuration OpenClaw
(`tools.exec.*`) **et** la politique d’approbations locale à l’hôte dans
`~/.openclaw/exec-approvals.json`.

YOLO est le comportement d’hôte par défaut sauf si vous le durcissez explicitement :

| Couche                | Paramètre YOLO             |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` sur `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Distinctions importantes :**

- `tools.exec.host=auto` choisit **où** l’exécution a lieu : bac à sable lorsqu’il est disponible, sinon Gateway.
- YOLO choisit **comment** l’exécution sur l’hôte est approuvée : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw n’ajoute **pas** de porte d’approbation heuristique distincte contre l’obfuscation des commandes ni de couche de rejet préalable des scripts au-dessus de la politique d’exécution sur l’hôte configurée.
- `auto` ne fait pas du routage Gateway un contournement libre depuis une session placée en bac à sable. Une demande par appel `host=node` est autorisée depuis `auto` ; `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime de bac à sable n’est actif. Pour une valeur par défaut stable non automatique, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

</Warning>

Les fournisseurs adossés à une CLI qui exposent leur propre mode d’autorisation non interactif
peuvent suivre cette politique. Claude CLI ajoute
`--permission-mode bypassPermissions` lorsque la politique d’exécution demandée par OpenClaw
est YOLO. Remplacez ce comportement du backend avec des arguments Claude explicites
sous `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
par exemple `--permission-mode default`, `acceptEdits` ou
`bypassPermissions`.

Si vous voulez une configuration plus conservatrice, resserrez l’une ou l’autre couche à
`allowlist` / `on-miss` ou `deny`.

### Configuration persistante "ne jamais demander" sur l’hôte Gateway

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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

- `tools.exec.host/security/ask` local.
- Valeurs par défaut locales de `~/.openclaw/exec-approvals.json`.

Il est volontairement local uniquement. Pour modifier à distance les approbations de l’hôte Gateway ou de l’hôte Node,
utilisez `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Hôte Node

Pour un hôte Node, appliquez plutôt le même fichier d’approbations sur ce Node :

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
**Limitations locales uniquement :**

- `openclaw exec-policy` ne synchronise pas les approbations Node.
- `openclaw exec-policy set --host node` est rejeté.
- Les approbations d’exécution Node sont récupérées depuis le Node à l’exécution, donc les mises à jour ciblant un Node doivent utiliser `openclaw approvals --node ...`.

</Note>

### Raccourci limité à la session

- `/exec security=full ask=off` modifie uniquement la session actuelle.
- `/elevated full` est un raccourci de dernier recours qui ignore aussi les approbations d’exécution pour cette session.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique de l’hôte
plus stricte l’emporte toujours.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. S’il existe plusieurs agents, changez l’agent
que vous modifiez dans l’application macOS. Les motifs sont des correspondances glob.

Les motifs peuvent être des globs de chemin de binaire résolu ou des globs de nom de commande brut.
Les noms bruts correspondent uniquement aux commandes invoquées via `PATH`, donc `rg` peut correspondre
à `/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais **pas** à `./rg` ni
`/tmp/rg`. Utilisez un glob de chemin lorsque vous voulez faire confiance à un emplacement de binaire
spécifique.

Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell comme `echo ok && pwd` exigent toujours que chaque segment de premier niveau
satisfasse les règles de liste d’autorisation.

Exemples :

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restreindre les arguments avec argPattern

Ajoutez `argPattern` lorsqu’une entrée de liste d’autorisation doit correspondre à un binaire et à une
forme d’arguments spécifique. OpenClaw évalue l’expression régulière
sur les arguments de commande analysés, en excluant le jeton de l’exécutable
(`argv[0]`). Pour les entrées rédigées à la main, les arguments sont joints avec une
seule espace ; ancrez donc le motif lorsque vous avez besoin d’une correspondance exacte.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Cette entrée autorise `python3 safe.py` ; `python3 other.py` est un échec de liste d’autorisation. Si une entrée uniquement par chemin pour le même binaire est également présente, les
arguments sans correspondance peuvent encore se rabattre sur cette entrée uniquement par chemin. Omettez l’entrée uniquement par chemin
lorsque l’objectif est de restreindre le binaire aux arguments déclarés.

Les entrées enregistrées par les flux d’approbation peuvent utiliser un format de séparateur interne pour
la correspondance argv exacte. Préférez l’interface utilisateur ou le flux d’approbation pour régénérer ces
entrées au lieu de modifier à la main la valeur encodée. Si OpenClaw ne peut pas
analyser argv pour un segment de commande, les entrées avec `argPattern` ne correspondent pas.

Chaque entrée de liste d’autorisation prend en charge :

| Champ              | Signification                                                |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | Glob de chemin binaire résolu ou glob de nom de commande nu  |
| `argPattern`       | Regex argv facultative ; les entrées omises ne concernent que le chemin |
| `id`               | UUID stable utilisé pour l’identité de l’UI                  |
| `source`           | Source de l’entrée, comme `allow-always`                     |
| `commandText`      | Texte de commande capturé lorsqu’un flux d’approbation a créé l’entrée |
| `lastUsedAt`       | Horodatage de dernière utilisation                           |
| `lastUsedCommand`  | Dernière commande correspondante                             |
| `lastResolvedPath` | Dernier chemin binaire résolu                                |

## CLI de Skills autorisées automatiquement

Lorsque **Autoriser automatiquement les CLI de Skills** est activé, les exécutables référencés par
les Skills connues sont traités comme autorisés sur les nœuds (nœud macOS ou hôte de nœud
sans interface graphique). Cela utilise `skills.bins` via le RPC du Gateway pour récupérer la
liste des binaires de Skills. Désactivez cette option si vous voulez des listes d’autorisation
manuelles strictes.

<Warning>
- Il s’agit d’une **liste d’autorisation de commodité implicite**, distincte des entrées de liste d’autorisation de chemins manuelles.
- Elle est destinée aux environnements d’opérateurs de confiance où le Gateway et le nœud se trouvent dans la même frontière de confiance.
- Si vous exigez une confiance strictement explicite, conservez `autoAllowSkills: false` et utilisez uniquement des entrées de liste d’autorisation de chemins manuelles.

</Warning>

## Binaires sûrs et transfert des approbations

Pour les binaires sûrs (le chemin rapide limité à stdin), les détails de liaison d’interpréteur et
la façon de transférer les invites d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme
clients d’approbation natifs), consultez
[Approbations exec - avancé](/fr/tools/exec-approvals-advanced).

## Modification dans l’UI de contrôle

Utilisez la carte **UI de contrôle → Nœuds → Approbations exec** pour modifier les valeurs par défaut,
les dérogations par agent et les listes d’autorisation. Choisissez une portée (valeurs par défaut ou un agent),
ajustez la politique, ajoutez/supprimez des motifs de liste d’autorisation, puis **Enregistrer**. L’UI
affiche les métadonnées de dernière utilisation par motif afin que vous puissiez garder la liste ordonnée.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**.
Les nœuds doivent annoncer `system.execApprovals.get/set` (application macOS ou
hôte de nœud sans interface graphique). Si un nœud n’annonce pas encore les approbations exec,
modifiez directement son fichier local `~/.openclaw/exec-approvals.json`.

CLI : `openclaw approvals` prend en charge la modification du Gateway ou d’un nœud ; consultez
[CLI des approbations](/fr/cli/approvals).

## Flux d’approbation

Lorsqu’une invite est requise, le Gateway diffuse
`exec.approval.requested` aux clients opérateurs. L’UI de contrôle et l’application macOS
la résolvent via `exec.approval.resolve`, puis le Gateway transfère la requête
approuvée à l’hôte de nœud.

Pour `host=node`, les demandes d’approbation incluent une charge utile `systemRunPlan`
canonique. Le Gateway utilise ce plan comme contexte de référence
pour la commande, le cwd et la session lors du transfert des requêtes `system.run`
approuvées.

C’est important pour la latence d’approbation asynchrone :

- Le chemin exec du nœud prépare un plan canonique dès le départ.
- L’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison.
- Une fois approuvé, l’appel `system.run` final transféré réutilise le plan stocké au lieu de faire confiance à des modifications ultérieures de l’appelant.
- Si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` après la création de la demande d’approbation, le Gateway rejette l’exécution transférée comme incompatibilité d’approbation.

## Événements système

Le cycle de vie d’exec est exposé sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution).
- `Exec finished`.
- `Exec denied`.

Ils sont publiés dans la session de l’agent après que le nœud a signalé l’événement.
Les approbations exec hébergées par le Gateway émettent les mêmes événements de cycle de vie lorsque la
commande se termine (et, facultativement, lorsqu’elle s’exécute plus longtemps que le seuil).
Les execs soumis à approbation réutilisent l’ID d’approbation comme `runId` dans ces
messages afin de faciliter la corrélation.

## Comportement en cas d’approbation refusée

Lorsqu’une approbation exec asynchrone est refusée, OpenClaw empêche l’agent de
réutiliser la sortie d’une exécution antérieure de la même commande dans la session.
La raison du refus est transmise avec une indication explicite qu’aucune sortie de commande
n’est disponible, ce qui empêche l’agent d’affirmer qu’il existe une nouvelle sortie ou
de répéter la commande refusée avec des résultats obsolètes provenant d’une exécution
réussie précédente.

## Implications

- **`full`** est puissant ; privilégiez les listes d’autorisation lorsque c’est possible.
- **`ask`** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de se propager aux autres.
- Les approbations ne s’appliquent qu’aux requêtes exec d’hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception. Pour bloquer strictement les execs d’hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outils.

## Associés

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Binaires sûrs, liaison d’interpréteur et transfert des approbations vers la messagerie.
  </Card>
  <Card title="Exec tool" href="/fr/tools/exec" icon="terminal">
    Outil d’exécution de commandes shell.
  </Card>
  <Card title="Elevated mode" href="/fr/tools/elevated" icon="shield-exclamation">
    Chemin d’urgence qui ignore également les approbations.
  </Card>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing" icon="box">
    Modes de bac à sable et accès à l’espace de travail.
  </Card>
  <Card title="Security" href="/fr/gateway/security" icon="lock">
    Modèle de sécurité et durcissement.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chaque contrôle.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’autorisation automatique basé sur les Skills.
  </Card>
</CardGroup>
