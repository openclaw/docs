---
read_when:
    - Vous souhaitez consulter ou modifier la configuration de manière non interactive
sidebarTitle: Config
summary: Référence de la CLI pour `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuration
x-i18n:
    generated_at: "2026-07-12T15:06:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Aides non interactives pour `openclaw.json` : obtenir/définir/modifier/supprimer une valeur par chemin, afficher le schéma, valider ou afficher le chemin du fichier actif. Exécutez `openclaw config` sans sous-commande pour ouvrir le même assistant guidé que `openclaw configure`.

<Note>
Lorsque `OPENCLAW_NIX_MODE=1`, OpenClaw considère `openclaw.json` comme immuable. Les commandes en lecture seule (`config get`, `config file`, `config schema`, `config validate`) fonctionnent toujours ; les commandes d’écriture de configuration sont refusées. Modifiez plutôt la source Nix de l’installation ; pour la distribution officielle nix-openclaw, consultez le [démarrage rapide de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) et définissez les valeurs sous `programs.openclaw.config` ou `instances.<name>.config`.
</Note>

## Options racines

<ParamField path="--section <section>" type="string">
  Filtre de section répétable pour la configuration guidée lorsque vous exécutez `openclaw config` sans sous-commande.
</ParamField>

Sections guidées : `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Exemples

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### Chemins

Notation par points ou crochets. Dans les exemples de shell, placez les chemins avec crochets entre guillemets afin que zsh ne développe pas `[0]` comme un motif glob :

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Lit une valeur depuis l’instantané expurgé de la configuration (les secrets ne sont jamais affichés). `--json` affiche la valeur brute au format JSON ; sinon, les chaînes, nombres et booléens sont affichés sans mise en forme, tandis que les objets et tableaux sont affichés au format JSON mis en forme.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Affiche le chemin du fichier de configuration actif, déterminé à partir de `OPENCLAW_CONFIG_PATH` ou de l’emplacement par défaut. Le chemin désigne un fichier standard, et non un lien symbolique ; consultez [Sécurité de l’écriture](#write-safety).

### `config schema`

Affiche sur la sortie standard le schéma JSON généré pour `openclaw.json`.

<AccordionGroup>
  <Accordion title="Ce qu’il comprend">
    - Le schéma racine actuel de la configuration, ainsi qu’un champ de chaîne `$schema` à la racine pour les outils d’édition.
    - Les métadonnées de documentation des champs `title` / `description` utilisées par l’interface de contrôle.
    - Les nœuds d’objet imbriqué, génériques (`*`) et d’élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsque la documentation des champs correspondants existe.
    - Les branches `anyOf` / `oneOf` / `allOf` héritent également des mêmes métadonnées de documentation.
    - Les métadonnées de schéma en direct des plugins et canaux, dans la mesure du possible, lorsque les manifestes d’exécution peuvent être chargés.
    - Un schéma de repli propre, même lorsque la configuration actuelle n’est pas valide.

  </Accordion>
  <Accordion title="RPC d’exécution associé">
    `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma superficiel (`title`, `description`, `type`, `enum`, `const`, limites courantes), les métadonnées d’indication d’interface correspondantes et les résumés des enfants immédiats. Utilisez-le pour une exploration ciblée par chemin dans l’interface de contrôle ou dans des clients personnalisés.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Valide la configuration actuelle par rapport au schéma actif sans démarrer le Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Si la validation échoue déjà, commencez par `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre les configurations non valides.
</Note>

## Valeurs

Les valeurs sont analysées comme du JSON5 lorsque cela est possible ; sinon, elles sont traitées comme des chaînes brutes. Utilisez `--strict-json` pour exiger du JSON standard sans repli vers une chaîne (la syntaxe propre à JSON5, comme les commentaires, les virgules finales ou les clés sans guillemets, est alors rejetée). Pour `config set`, `--json` est un alias historique de `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` affiche la valeur brute au format JSON plutôt que sous forme de texte mis en forme pour le terminal.

<Note>
Par défaut, l’affectation d’un objet remplace le chemin cible. Les chemins protégés qui contiennent couramment des entrées ajoutées par l’utilisateur refusent les remplacements qui supprimeraient des entrées existantes, sauf si vous transmettez `--replace` : `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` et `auth.profiles`.
</Note>

Utilisez `--merge` pour ajouter des entrées à ces tables associatives :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Utilisez `--replace` uniquement lorsque la valeur fournie doit intentionnellement devenir la valeur cible complète.

## Modes de `config set`

<Tabs>
  <Tab title="Mode valeur">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Mode générateur de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Mode générateur de fournisseur">
    Cible uniquement les chemins `secrets.providers.<alias>` :

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Mode par lots">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
Les affectations SecretRef sont rejetées sur les surfaces modifiables à l’exécution qui ne les prennent pas en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons Webhook de liaison des fils Discord et le JSON d’identifiants WhatsApp). Consultez [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Warning>

L’analyse par lots utilise toujours la charge utile du lot (`--batch-json`/`--batch-file`) comme source de vérité ; `--strict-json` / `--json` ne modifient pas le comportement d’analyse par lots.

Le mode chemin/valeur JSON fonctionne également directement pour les SecretRefs et les fournisseurs :

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Options du générateur de fournisseur

Les cibles du générateur de fournisseur doivent utiliser `secrets.providers.<alias>` comme chemin.

<AccordionGroup>
  <Accordion title="Options communes">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Fournisseur d’environnement (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (répétable)

  </Accordion>
  <Accordion title="Fournisseur de fichier (--provider-source file)">
    - `--provider-path <path>` (obligatoire)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Fournisseur d’exécution (--provider-source exec)">
    - `--provider-command <path>` (obligatoire)
    - `--provider-arg <arg>` (répétable)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (répétable)
    - `--provider-pass-env <ENV_VAR>` (répétable)
    - `--provider-trusted-dir <path>` (répétable)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Exemple de fournisseur d’exécution renforcé :

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## `config patch`

Collez ou transmettez par canal un correctif JSON5 ayant la forme d’une configuration, plutôt que d’exécuter de nombreuses commandes `config set` fondées sur des chemins. Les objets sont fusionnés récursivement ; les tableaux et les valeurs scalaires remplacent la cible ; `null` supprime le chemin cible.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Transmettez un correctif via l’entrée standard pour les scripts de configuration à distance :

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Exemple de correctif :

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Utilisez `--replace-path <path>` lorsqu’un objet ou un tableau doit devenir exactement la valeur fournie au lieu d’être modifié récursivement :

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` exécute les vérifications du schéma et de la résolubilité des SecretRef sans écrire. Les SecretRef reposant sur une exécution sont ignorées par défaut lors d’une simulation ; ajoutez `--allow-exec` lorsque vous souhaitez intentionnellement que la simulation exécute les commandes du fournisseur.

## Simulation

`--dry-run` valide les modifications sans écrire dans `openclaw.json`. Disponible pour `config set`, `config patch` et `config unset`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Comportement de la simulation">
    - Mode générateur : exécute des vérifications de résolvabilité des SecretRef pour les références/fournisseurs modifiés.
    - Mode JSON (`--strict-json`, `--json` ou mode par lots) : exécute la validation du schéma ainsi que les vérifications de résolvabilité des SecretRef.
    - La validation de la politique s’effectue sur l’ensemble de la configuration après modification ; les écritures d’objets parents (par exemple, la définition de `hooks` comme objet) ne peuvent donc pas contourner la validation des surfaces non prises en charge.
    - Les vérifications des SecretRef d’exécution sont ignorées par défaut afin d’éviter les effets secondaires des commandes ; transmettez `--allow-exec` pour les activer (cela peut exécuter les commandes du fournisseur). `--allow-exec` est réservé à la simulation et génère une erreur sans `--dry-run`.

  </Accordion>
  <Accordion title="Champs de --dry-run --json">
    - `ok` : indique si la simulation a réussi
    - `operations` : nombre d’affectations évaluées
    - `checks` : indique si les vérifications de schéma/résolvabilité ont été exécutées
    - `checks.resolvabilityComplete` : indique si les vérifications de résolvabilité ont été exécutées jusqu’à leur terme (false lorsque les références d’exécution sont ignorées)
    - `refsChecked` : nombre de références effectivement résolues pendant la simulation
    - `skippedExecRefs` : nombre de références d’exécution ignorées parce que `--allow-exec` n’était pas défini
    - `errors` : échecs structurés de chemin manquant, de schéma ou de résolvabilité lorsque `ok=false`

  </Accordion>
</AccordionGroup>

### Structure de la sortie JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // présent pour les erreurs de résolvabilité
    },
  ],
}
```

<Tabs>
  <Tab title="Exemple de réussite">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Exemple d’échec">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Erreur : la variable d’environnement \"MISSING_TEST_SECRET\" n’est pas définie.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="En cas d’échec de la simulation">
    - `config schema validation failed` : la structure de votre configuration après modification n’est pas valide ; corrigez le chemin/la valeur ou la structure de l’objet fournisseur/référence.
    - `Config policy validation failed: unsupported SecretRef usage` : rétablissez cette information d’identification sous forme de texte brut/chaîne en entrée ; utilisez les SecretRef uniquement sur les surfaces prises en charge.
    - `SecretRef assignment(s) could not be resolved` : le fournisseur ou la référence indiqué ne peut pas être résolu actuellement (variable d’environnement manquante, pointeur de fichier non valide, échec du fournisseur d’exécution ou incompatibilité entre le fournisseur et la source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : réexécutez avec `--allow-exec` si vous avez besoin de valider la résolvabilité de l’exécution.
    - En mode par lots, corrigez les entrées en échec et réexécutez `--dry-run` avant l’écriture.

  </Accordion>
</AccordionGroup>

## Application des modifications

Après chaque commande `config set` / `config patch` / `config unset` réussie, la CLI affiche l’une des trois indications suivantes afin que vous sachiez si le Gateway doit être redémarré :

| Indication                                          | Signification                                        |
| --------------------------------------------------- | ---------------------------------------------------- |
| `Restart the gateway to apply.`                     | Le chemin modifié nécessite un redémarrage complet.  |
| `Change will apply without restarting the gateway.` | Le rechargement à chaud l’applique automatiquement.  |
| `No gateway restart needed.`                        | Aucun élément pertinent pour l’exécution n’a changé. |

Les écritures dans `plugins.entries` (ou dans l’un de ses sous-chemins) nécessitent toujours un redémarrage, car la CLI ne peut pas vérifier que les métadonnées de rechargement de chaque Plugin sont chargées.

## Sécurité des écritures

`openclaw config set` et les autres outils d’écriture de configuration appartenant à OpenClaw valident l’ensemble de la configuration après modification avant de l’enregistrer sur le disque. Si le nouveau contenu échoue à la validation du schéma ou semble écraser des données de façon destructive, la configuration active reste inchangée et le contenu rejeté est enregistré à côté sous le nom `openclaw.json.rejected.*`.

<Warning>
Le chemin de la configuration active doit désigner un fichier ordinaire. Les configurations où `openclaw.json` est un lien symbolique ne sont pas prises en charge pour les écritures ; utilisez plutôt `OPENCLAW_CONFIG_PATH` pour désigner directement le fichier réel.
</Warning>

Privilégiez les écritures via la CLI pour les petites modifications :

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si une écriture est rejetée, examinez le contenu enregistré et corrigez la structure complète de la configuration :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Les écritures directes avec un éditeur restent autorisées, mais le Gateway en cours d’exécution les considère comme non fiables jusqu’à leur validation. Les modifications directes non valides empêchent le démarrage ou sont ignorées lors du rechargement à chaud ; le Gateway ne réécrit pas `openclaw.json`. Exécutez `openclaw doctor --fix` pour réparer une configuration préfixée/écrasée ou restaurer la dernière copie valide connue. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config).

La récupération du fichier complet est réservée aux réparations effectuées par doctor. Les modifications du schéma d’un Plugin ou les décalages de `minHostVersion` restent explicitement signalés au lieu d’entraîner l’annulation de paramètres utilisateur sans rapport, tels que la configuration des modèles, des fournisseurs, des profils d’authentification, des canaux, de l’exposition du Gateway, des outils, de la mémoire, du navigateur ou de Cron.

## Boucle de réparation

Après la réussite de `openclaw config validate`, utilisez la TUI locale pour demander à un agent intégré de comparer la configuration active à la documentation pendant que vous validez chaque modification depuis le même terminal :

```bash
openclaw chat
```

Dans la TUI, un `!` initial exécute une commande shell locale littérale (après une demande de confirmation unique par session) :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Comparer avec la documentation">
    Demandez à l’agent de comparer votre configuration actuelle avec la page de documentation correspondante et de suggérer la correction la plus limitée.
  </Step>
  <Step title="Appliquer des modifications ciblées">
    Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Valider à nouveau">
    Réexécutez `openclaw config validate` après chaque modification.
  </Step>
  <Step title="Utiliser doctor pour les problèmes d’exécution">
    Si la validation réussit, mais que l’exécution présente toujours des problèmes, exécutez `openclaw doctor` ou `openclaw doctor --fix` pour obtenir de l’aide concernant la migration et la réparation.
  </Step>
</Steps>

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
