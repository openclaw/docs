---
read_when:
    - Configuration des approbations d’exécution ou des listes d’autorisation
    - Implémentation de l’expérience utilisateur d’approbation de l’exécution dans l’app macOS
    - Examen des invites d’évasion du bac à sable et de leurs implications
sidebarTitle: Exec approvals
summary: 'Approbations d’exécution sur l’hôte : paramètres de stratégie, listes d’autorisation et flux de travail YOLO/strict'
title: Autorisations d’exécution
x-i18n:
    generated_at: "2026-07-12T03:23:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Les approbations d’exécution constituent le **garde-fou de l’application compagnon / de l’hôte Node** permettant à un agent en bac à sable d’exécuter des commandes sur un hôte réel (`gateway` ou `node`). Les commandes ne s’exécutent que lorsque la stratégie, la liste d’autorisation et l’approbation facultative de l’utilisateur concordent toutes.
Les approbations s’appliquent **en plus de** la stratégie des outils et du contrôle du mode élevé (le mode élevé `full` les ignore).

Pour une présentation axée sur les modes `deny`, `allowlist`, `ask`, `auto`, `full`, la correspondance avec Codex Guardian et les autorisations du harnais ACPX, consultez [Modes d’autorisation](/fr/tools/permission-modes).

<Note>
La stratégie effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations : les approbations peuvent uniquement renforcer les paramètres de sécurité et de demande issus de la configuration, jamais les assouplir. Si un champ d’approbation est omis, la valeur de `tools.exec` est utilisée. L’exécution sur l’hôte utilise également l’état local des approbations sur cette machine : une valeur locale à l’hôte `ask: "always"` dans le fichier d’approbations de l’hôte d’exécution continue de demander une confirmation, même si les valeurs par défaut de la session ou de la configuration demandent `ask: "on-miss"`.
</Note>

## Champ d’application

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **Hôte Gateway** -> processus `openclaw` sur la machine Gateway.
- **Hôte Node** -> exécuteur Node (application compagnon macOS ou hôte Node sans interface graphique).

### Modèle de confiance

- Les appelants authentifiés auprès du Gateway sont des opérateurs de confiance pour ce Gateway.
- Les Nodes appairés étendent cette capacité d’opérateur de confiance à l’hôte Node.
- Les approbations réduisent le risque d’exécution accidentelle, mais ne constituent **pas** une frontière d’authentification par utilisateur ni une stratégie de système de fichiers en lecture seule.
- Une fois approuvée, une commande peut modifier des fichiers selon les autorisations du système de fichiers de l’hôte ou du bac à sable sélectionné.
- Les exécutions approuvées sur l’hôte Node lient le contexte d’exécution canonique : répertoire de travail, argv exact, liaison de l’environnement lorsqu’elle est présente et chemin d’exécutable épinglé lorsqu’il s’applique.
- Pour les scripts shell et les appels directs de fichiers par un interpréteur ou un environnement d’exécution, OpenClaw tente également de lier un seul opérande de fichier local concret. Si ce fichier change après l’approbation, mais avant l’exécution, l’exécution est refusée plutôt que de lancer un contenu modifié.
- La liaison de fichier est mise en œuvre au mieux et ne constitue pas un modèle complet de tous les chemins de chargement des interpréteurs ou environnements d’exécution. Si un seul fichier local concret ne peut pas être identifié exactement, OpenClaw refuse de créer une exécution fondée sur une approbation plutôt que de prétendre assurer une couverture complète.

### Séparation sous macOS

- Le **service de l’hôte Node** transmet `system.run` à l’**application macOS** via un IPC local.
- L’**application macOS** applique les approbations et exécute la commande dans le contexte de l’interface utilisateur.

## Inspection de la stratégie effective

| Commande                                                         | Informations affichées                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Stratégie demandée, sources de stratégie de l’hôte et résultat effectif.                 |
| `openclaw exec-policy show`                                      | Vue fusionnée de la machine locale.                                                      |
| `openclaw exec-policy set` / `preset`                            | Synchronise en une seule étape la stratégie locale demandée avec le fichier local d’approbations de l’hôte. |

<Note>
Les remplacements `/exec` propres à chaque session ne sont pas inclus. Exécutez `/exec` dans la session concernée pour inspecter ses valeurs par défaut actuelles. Consultez les [remplacements de session](/fr/tools/exec#session-overrides-exec).
</Note>

Référence complète de la CLI (indicateurs, sortie JSON, ajout/suppression dans la liste d’autorisation) : [CLI des approbations](/fr/cli/approvals).

Lorsqu’une portée locale demande `host=node`, `exec-policy show` indique que cette portée est gérée par le Node lors de l’exécution, au lieu de considérer le fichier local d’approbations comme source de vérité.

Si l’interface utilisateur de l’application compagnon **n’est pas disponible**, toute requête qui devrait normalement afficher une demande est résolue par la **solution de repli des demandes** (valeur par défaut : `deny`).

<Tip>
Les clients natifs d’approbation par messagerie peuvent ajouter des possibilités d’action propres au canal au message d’approbation en attente. Matrix ajoute des raccourcis de réaction (`✅` autoriser une fois, `♾️` toujours autoriser, `❌` refuser), tout en conservant `/approve ...` dans le message comme solution de repli.
</Tip>

## Paramètres et stockage

Les approbations sont enregistrées dans un fichier JSON local sur l’hôte d’exécution. Lorsque `OPENCLAW_STATE_DIR` est défini, le fichier suit ce répertoire d’état ; sinon, il utilise le répertoire d’état par défaut d’OpenClaw :

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# sinon
~/.openclaw/exec-approvals.json
```

Le socket d’approbation par défaut utilise la même racine :
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, ou
`~/.openclaw/exec-approvals.sock` lorsque la variable n’est pas définie.

Les versions antérieures à 2026.6.6 conservaient toujours le fichier dans `~/.openclaw`. Si `OPENCLAW_STATE_DIR` pointe vers un autre emplacement et qu’un fichier d’approbations existe encore dans le répertoire par défaut, exécutez directement `openclaw doctor --fix` une fois pour l’importer dans le répertoire d’état (l’original est archivé avec le suffixe `.migrated`). Le diagnostic interactif peut également prévisualiser et confirmer l’importation. Les exécutions automatisées de mise à jour et de réparation par surveillance du Gateway n’importent jamais de données entre des répertoires d’état : un répertoire d’état temporaire ou de préproduction ne doit pas capturer les approbations de l’installation par défaut. La même limite s’applique aux importations de l’ancien fichier `plugin-binding-approvals.json` vers l’état SQLite partagé.

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Paramètres de stratégie

### `tools.exec.mode`

`tools.exec.mode` est l’interface de stratégie normalisée privilégiée pour l’exécution sur l’hôte :

| Valeur      | Comportement                                                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | Bloque l’exécution sur l’hôte.                                                                                                                                                                                |
| `allowlist` | Exécute uniquement les commandes figurant dans la liste d’autorisation, sans demander de confirmation.                                                                                                        |
| `ask`       | Utilise la stratégie de liste d’autorisation et demande une confirmation en cas d’absence de correspondance.                                                                                                  |
| `auto`      | Utilise la stratégie de liste d’autorisation, exécute directement les correspondances déterministes et transmet les absences de correspondance au réviseur automatique natif d’OpenClaw avant de recourir à une approbation humaine. |
| `full`      | Exécute les commandes sur l’hôte sans demande d’approbation.                                                                                                                                                  |

Les anciens paramètres `tools.exec.security` / `tools.exec.ask` restent pris en charge et continuent de s’appliquer lorsque `mode` n’est pas défini dans la portée concernée.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - bloque toutes les requêtes d’exécution sur l’hôte.
  - `allowlist` - autorise uniquement les commandes figurant dans la liste d’autorisation.
  - `full` - autorise tout (équivalent au mode élevé).

La valeur par défaut est `full` pour les hôtes Gateway/Node ; un hôte `sandbox` utilise plutôt `deny` par défaut.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Stratégie de demande configurée pour l’exécution sur l’hôte. Contrôle le comportement de base des demandes d’approbation provenant de `tools.exec.ask` et des valeurs par défaut des approbations de l’hôte.
  La valeur par défaut est `off`. Le paramètre d’outil `ask` propre à chaque appel (consultez
  [Outil d’exécution](/fr/tools/exec#parameters)) peut uniquement renforcer cette base, et
  les appels de modèle provenant d’un canal l’ignorent lorsque la demande effective de l’hôte est `off`.

- `off` - ne demande jamais de confirmation.
- `on-miss` - demande une confirmation uniquement lorsque la liste d’autorisation ne correspond pas.
- `always` - demande une confirmation pour chaque commande. La confiance persistante `allow-always` ne supprime **pas** les demandes lorsque le mode de demande effectif est `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Résolution utilisée lorsqu’une demande est requise, mais qu’aucune interface utilisateur n’est accessible (ou que la demande expire). La valeur par défaut est `deny` lorsque ce paramètre est omis.

- `deny` - bloque.
- `allowlist` - autorise uniquement si la liste d’autorisation correspond.
- `full` - autorise.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Lorsque la valeur est `true`, traite les formes d’évaluation de code en ligne comme soumises exclusivement à approbation, même si le binaire de l’interpréteur figure lui-même dans la liste d’autorisation. Cette mesure offre une défense en profondeur pour les chargeurs d’interpréteur qui ne correspondent pas clairement à un seul opérande de fichier stable.
</ParamField>

Exemples détectés par le mode strict : `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (ainsi que les formes en ligne de `awk`, `sed`, `make`, `find -exec` et `xargs`).

En mode strict, ces commandes nécessitent l’approbation d’un réviseur ou une approbation explicite. Avec `tools.exec.mode: "auto"`, le réviseur peut accorder une seule exécution à faible risque lorsque la commande possède un plan applicable ; sinon, OpenClaw demande l’approbation d’un humain.
Les approbations de commandes de `Codex app-server` qui atteignent la solution de repli du réviseur sollicitent un humain, car leurs requêtes d’approbation n’exposent pas d’exécutable résolu dont l’utilisation peut être imposée.
`allow-always` ne conserve pas de nouvelles entrées dans la liste d’autorisation pour les commandes d’évaluation en ligne.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Présentation uniquement : lorsque ce paramètre est activé, OpenClaw peut joindre des segments de commande issus de l’analyseur afin que les demandes d’approbation Web puissent mettre en évidence les jetons de commande. Cela ne modifie **pas** `security`, `ask`, la correspondance avec la liste d’autorisation, le comportement strict de l’évaluation en ligne, la transmission des approbations ni l’exécution des commandes.
</ParamField>

Définissez ce paramètre globalement sous `tools.exec.commandHighlighting` ou pour chaque agent sous `agents.list[].tools.exec.commandHighlighting`.

## Mode YOLO (sans approbation)

Pour exécuter des commandes sur l’hôte sans demande d’approbation, ouvrez les **deux** couches de stratégie :
la stratégie d’exécution demandée dans la configuration OpenClaw (`tools.exec.*`) **et**
la stratégie locale d’approbation de l’hôte dans le fichier d’approbations de l’hôte d’exécution.

Lorsque `askFallback` est omis, sa valeur par défaut est `deny`. Définissez explicitement `askFallback` sur `full` pour l’hôte lorsqu’une demande d’approbation sans interface utilisateur doit se rabattre sur l’autorisation.

| Couche                | Paramètre YOLO             |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` sur `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` de l’hôte | `full`                   |

<Warning>
**Distinctions importantes :**

- `tools.exec.host=auto` choisit **où** l’exécution a lieu : dans le bac à sable lorsqu’il est disponible, sinon sur le Gateway.
- YOLO choisit **comment** l’exécution sur l’hôte est approuvée : `security=full` avec `ask=off`.
- YOLO n’ajoute **pas** de mécanisme heuristique distinct d’approbation des commandes obscurcies ni de couche de rejet préalable des scripts en plus de la stratégie configurée d’exécution sur l’hôte.
- `auto` ne fait pas du routage vers le Gateway un remplacement libre depuis une session en bac à sable. Une requête propre à un appel `host=node` est autorisée depuis `auto` ; `host=gateway` est uniquement autorisé depuis `auto` lorsqu’aucun environnement d’exécution en bac à sable n’est actif. Pour une valeur par défaut stable autre que `auto`, définissez `tools.exec.host` ou utilisez explicitement `/exec host=...`.

</Warning>

Les fournisseurs reposant sur une CLI qui exposent leur propre mode d’autorisation non interactif
peuvent suivre cette politique. La CLI Claude ajoute
`--permission-mode bypassPermissions` lorsque la politique d’exécution effective
d’OpenClaw est YOLO. Pour les sessions Claude en direct gérées par OpenClaw, la
politique d’exécution effective d’OpenClaw prévaut sur le mode d’autorisation natif de Claude :
YOLO normalise les lancements en direct avec `--permission-mode bypassPermissions`, tandis
qu’une politique d’exécution effective restrictive normalise les lancements en direct avec
`--permission-mode default`, même si les arguments bruts du backend Claude spécifient un autre
mode.

Si vous souhaitez une configuration plus prudente, rendez à nouveau la politique d’exécution d’OpenClaw
plus stricte avec `allowlist` / `on-miss` ou `deny`.

### Configuration persistante « ne jamais demander » sur l’hôte du Gateway

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

Met à jour à la fois les paramètres locaux `tools.exec.host/security/ask` et les valeurs par défaut
du fichier local d’approbations (y compris `askFallback: "full"`). Cette commande est volontairement
limitée à l’environnement local. Pour modifier à distance les approbations de l’hôte du Gateway ou de l’hôte Node, utilisez
`openclaw approvals set --gateway` ou `openclaw approvals set --node
<id|name|ip>`.

Autres préréglages intégrés : `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) et `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Appliquez-les de la même manière :
`openclaw exec-policy preset cautious`.

Pour définir des champs individuels plutôt qu’un préréglage complet, utilisez
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` avec n’importe quel sous-ensemble de ces options.

### Hôte Node

Appliquez plutôt le même fichier d’approbations sur le Node :

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
**Limitations de l’utilisation locale uniquement :**

- `openclaw exec-policy` ne synchronise pas les approbations des Nodes.
- `openclaw exec-policy set --host node` est rejeté.
- Les approbations d’exécution des Nodes sont récupérées depuis le Node à l’exécution ; les mises à jour ciblant un Node doivent donc utiliser `openclaw approvals --node ...`.

</Note>

### Raccourci limité à la session

- `/exec security=full ask=off` modifie uniquement la session actuelle.
- `/elevated full` est un raccourci d’urgence qui ignore les approbations d’exécution uniquement
  lorsque la politique demandée et le fichier d’approbations de l’hôte aboutissent tous deux à
  `security: "full"` et `ask: "off"`. Un fichier d’hôte plus strict, tel que `ask:
"always"`, demande toujours une confirmation.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique
plus stricte de l’hôte continue de prévaloir.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont définies **par agent**. S’il existe plusieurs agents, sélectionnez l’agent
que vous modifiez dans l’application macOS. Les motifs utilisent la correspondance glob.

Les motifs peuvent être des globs de chemins résolus vers des exécutables ou des globs de noms de commandes seuls.
Les noms seuls correspondent uniquement aux commandes invoquées via `PATH` ; ainsi, `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais **pas** à `./rg` ni à
`/tmp/rg`. Utilisez un glob de chemin pour approuver un emplacement précis d’exécutable.

Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes de commandes shell telles que `echo ok && pwd` exigent toujours que chaque segment de premier niveau
respecte les règles de la liste d’autorisation.

Exemples :

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Restriction des arguments avec argPattern

Ajoutez `argPattern` lorsqu’une entrée de liste d’autorisation doit correspondre à un exécutable et à une
forme d’arguments précise. OpenClaw utilise la sémantique des expressions régulières ECMAScript (JavaScript)
sur chaque hôte et évalue l’expression par rapport aux arguments analysés de la commande, sans inclure
le jeton de l’exécutable (`argv[0]`).
Pour les entrées créées manuellement, les arguments sont joints par une seule espace ; ancrez donc
le motif lorsqu’une correspondance exacte est nécessaire.

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

Cette entrée autorise `python3 safe.py` ; `python3 other.py` ne correspond pas à la liste
d’autorisation. Si une entrée limitée au chemin existe également pour le même exécutable, les arguments
non correspondants peuvent toujours se rabattre sur cette entrée limitée au chemin. Omettez l’entrée limitée au chemin
si l’objectif est de restreindre l’exécutable aux arguments déclarés.

Les entrées enregistrées par les flux d’approbation utilisent un format de séparateur interne pour faire
correspondre exactement argv. Préférez l’interface utilisateur ou le flux d’approbation pour régénérer ces entrées
plutôt que de modifier manuellement la valeur encodée. Si OpenClaw ne peut pas analyser argv
pour un segment de commande, les entrées comportant `argPattern` ne correspondent pas.

Chaque entrée de liste d’autorisation prend en charge :

| Champ              | Signification                                                        |
| ------------------ | -------------------------------------------------------------------- |
| `pattern`          | Glob de chemin résolu vers l’exécutable ou glob de nom de commande seul |
| `argPattern`       | Expression régulière ECMAScript facultative pour argv ; son absence signifie « chemin uniquement » |
| `id`               | Identifiant opaque stable ; généré sous forme d’UUID s’il est absent |
| `source`           | Source de l’entrée, telle que `allow-always`                         |
| `commandText`      | Entrée historique en texte brut ; supprimée lors du chargement       |
| `lastUsedAt`       | Horodatage de la dernière utilisation                                |
| `lastUsedCommand`  | Dernière commande ayant correspondu                                  |
| `lastResolvedPath` | Dernier chemin résolu vers l’exécutable                               |

## Autorisation automatique des CLI de Skills

Lorsque l’option **Autoriser automatiquement les CLI de Skills** (`autoAllowSkills`) est activée, les exécutables
référencés par des Skills connus sont considérés comme autorisés sur les Nodes (Node macOS
ou hôte Node sans interface graphique). Cette fonctionnalité utilise `skills.bins` par l’intermédiaire du RPC du Gateway pour
récupérer la liste des exécutables des Skills. Désactivez-la si vous souhaitez appliquer des
listes d’autorisation manuelles strictes.

<Warning>
- Il s’agit d’une **liste d’autorisation implicite de commodité**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée aux environnements d’opérateurs de confiance dans lesquels le Gateway et le Node appartiennent au même périmètre de confiance.
- Si vous exigez une confiance explicite stricte, conservez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.

</Warning>

## Exécutables sûrs et transfert des approbations

Pour les exécutables sûrs (le chemin rapide limité à stdin), les détails de liaison des interpréteurs et
la manière de transférer les demandes d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme
clients d’approbation natifs), consultez
[Approbations d’exécution — avancé](/fr/tools/exec-approvals-advanced).

## Modification dans l’interface de contrôle

Utilisez la carte **Interface de contrôle -> Nodes -> Approbations d’exécution** pour modifier les valeurs par défaut,
les remplacements propres à chaque agent et les listes d’autorisation. Choisissez une portée (Valeurs par défaut ou un agent),
ajustez la politique, ajoutez ou supprimez des motifs de liste d’autorisation, puis cliquez sur **Enregistrer**. L’interface
affiche les métadonnées de dernière utilisation pour chaque motif afin de vous aider à garder la liste ordonnée.

Le sélecteur de cible permet de choisir le **Gateway** (approbations locales) ou un **Node**.
Les Nodes doivent annoncer `system.execApprovals.get/set` (application macOS ou
hôte Node sans interface graphique). Si un Node n’annonce pas encore les approbations d’exécution, modifiez directement son
fichier local d’approbations.

Certains hôtes Node, notamment l’application compagnon Windows, utilisent un format de politique d’approbation
différent. L’interface de contrôle affiche ces politiques natives de l’hôte en lecture seule. Utilisez
l’application compagnon ou `openclaw approvals set --node <id|name|ip>` avec la forme native
de la politique pour les modifier ; consultez [CLI des approbations](/fr/cli/approvals).

CLI : `openclaw approvals` permet de modifier les paramètres du Gateway ou d’un Node — consultez
[CLI des approbations](/fr/cli/approvals).

## Flux d’approbation

Lorsqu’une confirmation est requise, le Gateway diffuse
`exec.approval.requested` aux clients opérateurs. L’interface de contrôle et l’application
macOS la traitent via `exec.approval.resolve`, puis le Gateway transmet la
requête approuvée à l’hôte Node.

Pour `host=node`, les demandes d’approbation incluent une charge utile canonique `systemRunPlan`.
Le Gateway utilise ce plan comme contexte de commande/répertoire de travail/session faisant autorité
lorsqu’il transmet les requêtes `system.run` approuvées :

- Le chemin d’exécution du Node prépare initialement un plan canonique unique.
- L’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison.
- Après l’approbation, l’appel `system.run` finalement transmis réutilise le plan stocké au lieu de faire confiance aux modifications ultérieures de l’appelant.
- Si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` après la création de la demande d’approbation, le Gateway rejette l’exécution transmise en raison d’une incompatibilité avec l’approbation.

## Événements système et refus

Le cycle de vie d’une exécution publie un message système `Exec finished` dans la session de l’agent
après que le Node a signalé la fin de l’exécution. OpenClaw peut également émettre un avis
d’exécution en cours après l’octroi d’une approbation et l’écoulement de
`tools.exec.approvalRunningNoticeMs` (valeur par défaut : `10000` ; `0` le désactive).
Les approbations d’exécution refusées sont définitives pour la commande de l’hôte : la commande
n’est pas exécutée.

- Pour les approbations asynchrones de l’agent principal associées à une session d’origine, OpenClaw
  renvoie le refus dans cette session sous la forme d’un suivi interne afin que
  l’agent cesse d’attendre la commande asynchrone et évite une
  réparation due à un résultat manquant.
- S’il n’existe aucune session ou si la session ne peut pas être reprise, OpenClaw peut
  tout de même signaler un refus concis à l’opérateur ou à la route de discussion directe.
- Les refus concernant les sessions de sous-agents et de Cron ne sont pas renvoyés dans ces
  sessions.

Les approbations d’exécution sur l’hôte du Gateway émettent le même événement de fin de cycle de vie.
Les exécutions soumises à approbation réutilisent l’identifiant d’approbation pour associer la requête
en attente à son message d’achèvement ou de refus (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Implications

- **`full`** est puissant ; préférez les listes d’autorisation lorsque cela est possible.
- **`ask`** vous permet de garder le contrôle tout en autorisant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de s’appliquer aux autres.
- Les approbations s’appliquent uniquement aux requêtes d’exécution sur l’hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas utiliser `/exec`.
- `/exec security=full` est une commodité limitée à la session pour les opérateurs autorisés et ignore volontairement les approbations. Pour bloquer strictement l’exécution sur l’hôte, définissez la sécurité des approbations sur `deny` ou interdisez l’outil `exec` au moyen de la politique des outils.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Exécutables sûrs, liaison des interpréteurs et transfert des approbations vers la discussion.
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
    Modèle de sécurité et renforcement.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chacun de ces contrôles.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’autorisation automatique reposant sur les Skills.
  </Card>
</CardGroup>
