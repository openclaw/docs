---
read_when:
    - Configuration des approbations ou des listes d’autorisation d’exécution
    - Implémenter l’expérience utilisateur d’approbation d’exécution dans l’application macOS
    - Examen des prompts d’évasion du bac à sable et de leurs implications
sidebarTitle: Exec approvals
summary: 'Approbations d’exécution hôte : réglages de politique, listes d’autorisation et flux de travail YOLO/strict'
title: Approbations d’exécution
x-i18n:
    generated_at: "2026-06-27T18:17:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Les approbations d’exécution sont le **garde-fou de l’app compagnon / de l’hôte de nœud** qui permet à un agent en bac à sable d’exécuter des commandes sur un hôte réel (`gateway` ou `node`). Un verrou de sécurité : les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation + l’approbation utilisateur (facultative) concordent toutes. Les approbations d’exécution s’empilent **par-dessus** la politique d’outils et le contrôle d’élévation (sauf si l’élévation est définie sur `full`, ce qui ignore les approbations).

Pour une vue d’ensemble axée sur les modes de `deny`, `allowlist`, `ask`, `auto`, `full`, la correspondance Codex Guardian et les permissions du harnais ACPX, consultez
[Modes de permission](/fr/tools/permission-modes).

<Note>
La politique effective est la **plus stricte** entre les valeurs par défaut de `tools.exec.*` et des approbations ; si un champ d’approbations est omis, la valeur de `tools.exec` est utilisée. L’exécution hôte utilise aussi l’état local des approbations sur cette machine : un `ask: "always"` local à l’hôte dans le fichier d’approbations de l’hôte d’exécution continue à demander une confirmation même si les valeurs par défaut de session ou de configuration demandent `ask: "on-miss"`.
</Note>

## Inspecter la politique effective

| Commande                                                          | Ce qu’elle affiche                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Politique demandée, sources de politique de l’hôte et résultat effectif.                       |
| `openclaw exec-policy show`                                      | Vue fusionnée de la machine locale.                                                             |
| `openclaw exec-policy set` / `preset`                            | Synchronise la politique locale demandée avec le fichier local d’approbations de l’hôte en une étape. |

Quand une portée locale demande `host=node`, `exec-policy show` signale cette portée comme gérée par le nœud à l’exécution au lieu de prétendre que le fichier local d’approbations est la source de vérité.

Si l’interface de l’app compagnon **n’est pas disponible**, toute demande qui déclencherait normalement une invite est résolue par le **repli ask** (par défaut : `deny`).

<Tip>
Les clients natifs d’approbation par chat peuvent préremplir des possibilités propres au canal dans le message d’approbation en attente. Par exemple, Matrix préremplit des raccourcis par réaction (`✅` autoriser une fois, `❌` refuser, `♾️` toujours autoriser) tout en laissant les commandes `/approve ...` dans le message comme solution de repli.
</Tip>

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **Hôte Gateway** → processus `openclaw` sur la machine Gateway.
- **Hôte Node** → exécuteur de nœud (app compagnon macOS ou hôte de nœud sans interface).

### Modèle de confiance

- Les appelants authentifiés auprès du Gateway sont des opérateurs approuvés pour ce Gateway.
- Les nœuds appairés étendent cette capacité d’opérateur approuvé à l’hôte de nœud.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent **pas** une frontière d’authentification par utilisateur ni une politique de système de fichiers en lecture seule.
- Une fois approuvée, une commande peut modifier des fichiers selon les permissions de système de fichiers de l’hôte ou du bac à sable sélectionné.
- Les exécutions approuvées sur hôte de nœud lient le contexte d’exécution canonique : cwd canonique, argv exact, liaison d’environnement lorsqu’elle est présente et chemin d’exécutable épinglé le cas échéant.
- Pour les scripts shell et les invocations directes de fichiers par interpréteur/environnement d’exécution, OpenClaw essaie aussi de lier un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution, l’exécution est refusée au lieu d’exécuter un contenu qui a dérivé.
- La liaison de fichiers est volontairement au mieux, **pas** un modèle sémantique complet de chaque chemin de chargeur d’interpréteur/environnement d’exécution. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier, il refuse d’émettre une exécution adossée à une approbation au lieu de prétendre offrir une couverture complète.

### Séparation macOS

- Le **service d’hôte de nœud** transmet `system.run` à l’**app macOS** via l’IPC local.
- L’**app macOS** applique les approbations et exécute la commande dans le contexte de l’interface utilisateur.

## Paramètres et stockage

Les approbations résident dans un fichier JSON local sur l’hôte d’exécution. Quand
`OPENCLAW_STATE_DIR` est défini, le fichier suit ce répertoire d’état ;
sinon, il utilise le répertoire d’état OpenClaw par défaut :

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Le socket d’approbation par défaut suit la même racine :
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, ou
`~/.openclaw/exec-approvals.sock` lorsque la variable n’est pas définie.

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

### `tools.exec.mode`

`tools.exec.mode` est la surface de politique normalisée privilégiée pour l’exécution hôte.
Les valeurs sont :

- `deny` - bloque l’exécution hôte.
- `allowlist` - exécute uniquement les commandes figurant dans la liste d’autorisation sans demander.
- `ask` - utilise la politique de liste d’autorisation et demande en cas d’absence de correspondance.
- `auto` - utilise la politique de liste d’autorisation, exécute directement les correspondances déterministes et envoie les absences d’approbation au réviseur automatique natif d’OpenClaw avant de revenir à une voie d’approbation humaine.
- `full` - exécute l’hôte sans invites d’approbation.

Les anciens `tools.exec.security` / `tools.exec.ask` restent pris en charge et prévalent encore
lorsqu’ils sont définis à une portée de session ou d’agent plus étroite.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloque toutes les demandes d’exécution hôte.
  - `allowlist` - autorise uniquement les commandes figurant dans la liste d’autorisation.
  - `full` - autorise tout (équivalent à l’élévation).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Politique de demande configurée pour l’exécution hôte. Contrôle le comportement
  de base des invites d’approbation depuis `tools.exec.ask` et les valeurs par défaut des approbations de l’hôte. Le
  paramètre d’outil `ask` par appel (voir [Outil Exec](/fr/tools/exec#parameters))
  ne peut que renforcer cette base, et les appels de modèle d’origine canal l’ignorent
  lorsque la demande effective de l’hôte est `off`.

- `off` - ne jamais demander.
- `on-miss` - demander uniquement lorsque la liste d’autorisation ne correspond pas.
- `always` - demander pour chaque commande. La confiance durable `allow-always` ne supprime **pas** les invites lorsque le mode ask effectif est `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Résolution lorsqu’une invite est requise mais qu’aucune interface utilisateur n’est joignable. Si ce
  champ est omis, OpenClaw utilise `deny` par défaut.

- `deny` - bloquer.
- `allowlist` - autoriser uniquement si la liste d’autorisation correspond.
- `full` - autoriser.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Lorsque `true`, OpenClaw traite les formes d’évaluation de code en ligne comme nécessitant uniquement une approbation,
  même si le binaire de l’interpréteur lui-même figure dans la liste d’autorisation. Défense en profondeur
  pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un opérande de fichier
  stable unique.
</ParamField>

Exemples interceptés par le mode strict :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

En mode strict, ces commandes nécessitent toujours une approbation explicite, et
`allow-always` ne persiste pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Contrôle uniquement la présentation dans les invites d’approbation d’exécution. Lorsqu’il est activé,
  OpenClaw peut joindre des segments de commande dérivés de l’analyseur afin que les invites d’approbation Web
  puissent mettre en évidence les jetons de commande. Définissez-le sur `true` pour activer
  la mise en évidence du texte de commande.
</ParamField>

Ce paramètre ne modifie **pas** `security`, `ask`, la correspondance de liste d’autorisation,
le comportement strict d’évaluation en ligne, la transmission des approbations ni l’exécution des commandes.
Il peut être défini globalement sous `tools.exec.commandHighlighting` ou par
agent sous `agents.list[].tools.exec.commandHighlighting`.

## Mode YOLO (sans approbation)

Si vous voulez que l’exécution hôte s’exécute sans invites d’approbation, vous devez ouvrir
**les deux** couches de politique : la politique d’exécution demandée dans la configuration OpenClaw
(`tools.exec.*`) **et** la politique d’approbations locale à l’hôte dans
le fichier d’approbations de l’hôte d’exécution.

OpenClaw définit par défaut les `askFallback` omis sur `deny`. Définissez explicitement
`askFallback` de l’hôte sur `full` lorsqu’une invite d’approbation sans interface utilisateur doit
se rabattre sur l’autorisation.

| Couche                 | Paramètre YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` sur `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` de l’hôte    | `full`                     |

<Warning>
**Distinctions importantes :**

- `tools.exec.host=auto` choisit **où** l’exécution se fait : bac à sable lorsqu’il est disponible, sinon Gateway.
- YOLO choisit **comment** l’exécution hôte est approuvée : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw n’ajoute **pas** de barrière d’approbation heuristique séparée contre l’obfuscation de commande ni de couche de rejet préalable des scripts par-dessus la politique d’exécution hôte configurée.
- `auto` ne transforme pas le routage Gateway en contournement libre depuis une session en bac à sable. Une demande par appel `host=node` est autorisée depuis `auto` ; `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun environnement d’exécution en bac à sable n’est actif. Pour une valeur par défaut stable non automatique, définissez `tools.exec.host` ou utilisez explicitement `/exec host=...`.

</Warning>

Les fournisseurs adossés à la CLI qui exposent leur propre mode de permission non interactif
peuvent suivre cette politique. Claude CLI ajoute
`--permission-mode bypassPermissions` lorsque la politique d’exécution effective d’OpenClaw
est YOLO. Pour les sessions live Claude gérées par OpenClaw, la politique d’exécution effective d’OpenClaw
fait autorité sur le mode de permission natif de Claude :
YOLO normalise les lancements live en `--permission-mode bypassPermissions`, et
une politique d’exécution effective restrictive normalise les lancements live en
`--permission-mode default`, même si les arguments bruts du backend Claude spécifient un autre
mode.

Si vous voulez une configuration plus conservatrice, resserrez la politique d’exécution OpenClaw à
`allowlist` / `on-miss` ou `deny`.

### Configuration persistante « ne jamais demander » de l’hôte Gateway

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

- `tools.exec.host/security/ask` local.
- Les valeurs par défaut du fichier local d’approbations, y compris `askFallback: "full"`.

Il est volontairement uniquement local. Pour modifier à distance les approbations d’hôte Gateway ou d’hôte de nœud, utilisez `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

### Hôte de nœud

Pour un hôte de nœud, appliquez plutôt le même fichier d’approbations sur ce nœud :

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
**Limitations uniquement locales :**

- `openclaw exec-policy` ne synchronise pas les approbations de nœud.
- `openclaw exec-policy set --host node` est rejeté.
- Les approbations d’exécution de nœud sont récupérées depuis le nœud à l’exécution, donc les mises à jour ciblant un nœud doivent utiliser `openclaw approvals --node ...`.

</Note>

### Raccourci limité à la session

- `/exec security=full ask=off` modifie uniquement la session actuelle.
- `/elevated full` est un raccourci de dernier recours qui ignore les approbations d’exécution uniquement lorsque
  la politique demandée et le fichier d’approbations de l’hôte se résolvent tous deux en
  `security: "full"` et `ask: "off"`. Un fichier d’hôte plus strict, comme
  `ask: "always"`, déclenche toujours une invite.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique d’hôte
plus stricte l’emporte toujours.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. S’il existe plusieurs agents, changez l’agent
que vous modifiez dans l’app macOS. Les motifs sont des correspondances glob.

Les motifs peuvent être des globs de chemins binaires résolus ou des globs de noms de commande seuls.
Les noms seuls ne correspondent qu’aux commandes invoquées via `PATH`, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais **pas** à `./rg` ni à
`/tmp/rg`. Utilisez un glob de chemin lorsque vous voulez faire confiance à un emplacement
binaire spécifique.

Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell comme `echo ok && pwd` doivent toujours avoir chaque segment de premier niveau
conforme aux règles de liste d’autorisation.

Exemples :

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restreindre les arguments avec argPattern

Ajoutez `argPattern` lorsqu’une entrée de liste d’autorisation doit correspondre à un binaire et à une
forme d’arguments spécifique. OpenClaw évalue l’expression régulière
par rapport aux arguments de commande analysés, en excluant le jeton exécutable
(`argv[0]`). Pour les entrées rédigées manuellement, les arguments sont joints avec un
seul espace, donc ancrez le motif lorsque vous avez besoin d’une correspondance exacte.

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

Cette entrée autorise `python3 safe.py` ; `python3 other.py` est un échec de correspondance
de la liste d’autorisation. Si une entrée par chemin uniquement pour le même binaire est également présente, les
arguments sans correspondance peuvent toujours se rabattre sur cette entrée par chemin uniquement. Omettez l’entrée par chemin uniquement
lorsque l’objectif est de restreindre le binaire aux arguments déclarés.

Les entrées enregistrées par les flux d’approbation peuvent utiliser un format de séparateur interne pour la
correspondance exacte de argv. Préférez l’interface utilisateur ou le flux d’approbation pour régénérer ces
entrées au lieu de modifier manuellement la valeur encodée. Si OpenClaw ne peut pas
analyser argv pour un segment de commande, les entrées avec `argPattern` ne correspondent pas.

Chaque entrée de liste d’autorisation prend en charge :

| Champ              | Signification                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob de chemin binaire résolu ou glob de nom de commande seul           |
| `argPattern`       | Regex argv facultative ; les entrées omises sont par chemin uniquement            |
| `id`               | UUID stable utilisé pour l’identité dans l’interface utilisateur                              |
| `source`           | Source de l’entrée, comme `allow-always`                          |
| `commandText`      | Texte de commande capturé lorsqu’un flux d’approbation a créé l’entrée |
| `lastUsedAt`       | Horodatage de dernière utilisation                                           |
| `lastUsedCommand`  | Dernière commande ayant correspondu                                     |
| `lastResolvedPath` | Dernier chemin binaire résolu                                     |

## Autorisation automatique des CLI de Skills

Lorsque **Autorisation automatique des CLI de Skills** est activé, les exécutables référencés par
des Skills connus sont traités comme autorisés sur les nœuds (nœud macOS ou hôte de nœud
headless). Cela utilise `skills.bins` via le RPC Gateway pour récupérer la
liste des binaires de Skills. Désactivez cette option si vous voulez des listes d’autorisation manuelles strictes.

<Warning>
- Il s’agit d’une **liste d’autorisation implicite de commodité**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée aux environnements d’opérateurs de confiance où Gateway et le nœud sont dans la même limite de confiance.
- Si vous exigez une confiance explicite stricte, conservez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.

</Warning>

## Binaires sûrs et transfert d’approbation

Pour les binaires sûrs (le chemin rapide stdin uniquement), les détails de liaison des interpréteurs, et
la manière de transférer les invites d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme
clients d’approbation natifs), consultez
[Approbations d’exécution - avancé](/fr/tools/exec-approvals-advanced).

## Modification dans Control UI

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut,
les remplacements par agent et les listes d’autorisation. Choisissez une portée (valeurs par défaut ou un agent),
ajustez la politique, ajoutez/supprimez des motifs de liste d’autorisation, puis **Enregistrer**. L’interface utilisateur
affiche les métadonnées de dernière utilisation par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **nœud**.
Les nœuds doivent annoncer `system.execApprovals.get/set` (app macOS ou
hôte de nœud headless). Si un nœud n’annonce pas encore les approbations d’exécution,
modifiez directement son fichier d’approbations local.

CLI : `openclaw approvals` prend en charge la modification du gateway ou du nœud - voir
[CLI d’approbations](/fr/cli/approvals).

## Flux d’approbation

Lorsqu’une invite est requise, le gateway diffuse
`exec.approval.requested` aux clients opérateurs. Control UI et l’app macOS
la résolvent via `exec.approval.resolve`, puis le gateway transfère la
requête approuvée à l’hôte de nœud.

Pour `host=node`, les requêtes d’approbation incluent une charge utile canonique `systemRunPlan`.
Le gateway utilise ce plan comme contexte
command/cwd/session faisant autorité lors du transfert des requêtes `system.run`
approuvées.

C’est important pour la latence d’approbation asynchrone :

- Le chemin d’exécution du nœud prépare un plan canonique en amont.
- L’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison.
- Une fois approuvé, l’appel final `system.run` transféré réutilise le plan stocké au lieu de faire confiance à des modifications ultérieures de l’appelant.
- Si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` après la création de la demande d’approbation, le gateway rejette l’exécution transférée comme non-concordance d’approbation.

## Événements système

Le cycle de vie d’exécution est exposé sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution).
- `Exec finished`.

Ils sont publiés dans la session de l’agent après que le nœud a signalé l’événement.
Les approbations d’exécution refusées sont terminales pour la commande hôte elle-même : la commande
ne s’exécute pas. Pour les approbations asynchrones de l’agent principal avec une session d’origine,
OpenClaw publie le refus dans cette session comme suivi interne afin que
l’agent puisse cesser d’attendre la commande asynchrone et éviter une réparation de résultat manquant.
S’il n’y a pas de session ou si la session ne peut pas être reprise, OpenClaw peut toujours
signaler un refus concis à l’opérateur ou à la route de chat directe. Les refus pour
les sessions de sous-agent ne sont pas renvoyés dans le sous-agent.
Les approbations d’exécution hébergées par Gateway émettent les mêmes événements de cycle de vie lorsque la
commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les exécutions soumises à approbation réutilisent l’identifiant d’approbation comme `runId` dans ces
messages pour faciliter la corrélation.

## Comportement en cas d’approbation refusée

Lorsqu’une approbation d’exécution asynchrone est refusée, OpenClaw traite la commande hôte comme
terminale et fail-closed. Pour les sessions de l’agent principal, le refus est remis comme
suivi de session interne qui indique à l’agent que la commande asynchrone ne s’est pas exécutée.
Cela préserve la continuité de la transcription sans exposer de sortie de commande obsolète. Si
la remise à la session est indisponible, OpenClaw se rabat sur un refus concis à l’opérateur ou
au chat direct lorsqu’une route sûre existe.

## Implications

- **`full`** est puissant ; préférez les listes d’autorisation lorsque c’est possible.
- **`ask`** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de fuiter vers d’autres.
- Les approbations ne s’appliquent qu’aux requêtes d’exécution hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception. Pour bloquer strictement l’exécution hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outils.

## Connexe

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Binaires sûrs, liaison d’interpréteur et transfert d’approbation vers le chat.
  </Card>
  <Card title="Exec tool" href="/fr/tools/exec" icon="terminal">
    Outil d’exécution de commandes shell.
  </Card>
  <Card title="Elevated mode" href="/fr/tools/elevated" icon="shield-exclamation">
    Chemin de dernier recours qui ignore aussi les approbations.
  </Card>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing" icon="box">
    Modes de sandbox et accès à l’espace de travail.
  </Card>
  <Card title="Security" href="/fr/gateway/security" icon="lock">
    Modèle de sécurité et durcissement.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chaque contrôle.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’autorisation automatique adossé aux Skills.
  </Card>
</CardGroup>
