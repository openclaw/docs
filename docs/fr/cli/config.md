---
read_when:
    - Vous souhaitez lire ou modifier la configuration de façon non interactive
sidebarTitle: Config
summary: Référence CLI pour `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuration
x-i18n:
    generated_at: "2026-05-03T21:28:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

Aides de configuration pour les modifications non interactives dans `openclaw.json` : obtenir/définir/corriger/supprimer/fichier/schéma/valider des valeurs par chemin et afficher le fichier de configuration actif. Exécutez sans sous-commande pour ouvrir l’assistant de configuration, comme avec `openclaw configure`.

## Options racine

<ParamField path="--section <section>" type="string">
  Filtre de section répétable pour la configuration guidée lorsque vous exécutez `openclaw config` sans sous-commande.
</ParamField>

Sections guidées prises en charge : `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Affiche le schéma JSON généré pour `openclaw.json` sur stdout au format JSON.

<AccordionGroup>
  <Accordion title="Ce qu’il inclut">
    - Le schéma de configuration racine actuel, plus un champ de chaîne racine `$schema` pour les outils d’éditeur.
    - Les métadonnées de documentation des champs `title` et `description` utilisées par l’interface de contrôle.
    - Les nœuds d’objet imbriqué, de joker (`*`) et d’élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsqu’une documentation de champ correspondante existe.
    - Les branches `anyOf` / `oneOf` / `allOf` héritent aussi des mêmes métadonnées de documentation lorsqu’une documentation de champ correspondante existe.
    - Les métadonnées de schéma Plugin + canal en direct au mieux lorsque les manifestes d’exécution peuvent être chargés.
    - Un schéma de repli propre même lorsque la configuration actuelle est invalide.

  </Accordion>
  <Accordion title="RPC d’exécution associé">
    `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma superficiel (`title`, `description`, `type`, `enum`, `const`, limites courantes), les métadonnées d’indice d’interface correspondantes et des résumés des enfants immédiats. Utilisez-le pour l’exploration détaillée par chemin dans l’interface de contrôle ou des clients personnalisés.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Redirigez-le vers un fichier lorsque vous voulez l’inspecter ou le valider avec d’autres outils :

```bash
openclaw config schema > openclaw.schema.json
```

### Chemins

Les chemins utilisent la notation par points ou par crochets :

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Utilisez l’index de la liste d’agents pour cibler un agent précis :

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valeurs

Les valeurs sont analysées comme du JSON5 lorsque c’est possible ; sinon, elles sont traitées comme des chaînes. Utilisez `--strict-json` pour exiger l’analyse JSON5. `--json` reste pris en charge comme alias hérité.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` affiche la valeur brute en JSON au lieu d’un texte formaté pour le terminal.

<Note>
L’affectation d’objet remplace le chemin cible par défaut. Les chemins de cartes/listes protégés qui contiennent souvent des entrées ajoutées par l’utilisateur, comme `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` et `auth.profiles`, refusent les remplacements qui supprimeraient des entrées existantes sauf si vous passez `--replace`.
</Note>

Utilisez `--merge` lorsque vous ajoutez des entrées à ces cartes :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Utilisez `--replace` uniquement lorsque vous voulez intentionnellement que la valeur fournie devienne la valeur cible complète.

## Modes de `config set`

`openclaw config set` prend en charge quatre styles d’affectation :

<Tabs>
  <Tab title="Mode valeur">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Mode constructeur SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Mode constructeur de fournisseur">
    Le mode constructeur de fournisseur cible uniquement les chemins `secrets.providers.<alias>` :

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Mode lot">
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
Les affectations SecretRef sont rejetées sur les surfaces mutables à l’exécution non prises en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons Webhook de liaison de fil Discord et le JSON des identifiants WhatsApp). Voir [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Warning>

L’analyse par lots utilise toujours la charge utile de lot (`--batch-json`/`--batch-file`) comme source de vérité. `--strict-json` / `--json` ne modifient pas le comportement d’analyse par lots.

## `config patch`

Utilisez `config patch` lorsque vous voulez coller ou transférer par pipe un correctif en forme de configuration au lieu d’exécuter de nombreuses commandes `config set` basées sur des chemins. L’entrée est un objet JSON5. Les objets fusionnent récursivement, les tableaux et les valeurs scalaires remplacent la valeur cible, et `null` supprime le chemin cible.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Vous pouvez aussi transmettre un correctif par stdin, ce qui est utile pour les scripts de configuration distante :

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Utilisez `--replace-path <path>` lorsqu’un objet ou un tableau doit devenir exactement la valeur fournie au lieu d’être corrigé récursivement :

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` exécute les vérifications de schéma et de résolubilité SecretRef sans écrire. Les SecretRefs basées sur exec sont ignorées par défaut pendant dry-run ; ajoutez `--allow-exec` lorsque vous voulez intentionnellement que dry-run exécute les commandes du fournisseur.

Le mode chemin/valeur JSON reste pris en charge pour les SecretRefs comme pour les fournisseurs :

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Options du constructeur de fournisseur

Les cibles du constructeur de fournisseur doivent utiliser `secrets.providers.<alias>` comme chemin.

<AccordionGroup>
  <Accordion title="Options communes">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Fournisseur env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (répétable)

  </Accordion>
  <Accordion title="Fournisseur de fichier (--provider-source file)">
    - `--provider-path <path>` (obligatoire)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Fournisseur exec (--provider-source exec)">
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

Exemple de fournisseur exec renforcé :

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

## Dry run

Utilisez `--dry-run` pour valider les modifications sans écrire `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

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
  <Accordion title="Comportement de dry-run">
    - Mode constructeur : exécute les vérifications de résolubilité SecretRef pour les refs/fournisseurs modifiés.
    - Mode JSON (`--strict-json`, `--json` ou mode lot) : exécute la validation de schéma plus les vérifications de résolubilité SecretRef.
    - La validation de politique s’exécute aussi pour les surfaces cibles SecretRef connues comme non prises en charge.
    - Les vérifications de politique évaluent la configuration complète après modification, de sorte que les écritures d’objet parent (par exemple définir `hooks` comme objet) ne peuvent pas contourner la validation des surfaces non prises en charge.
    - Les vérifications SecretRef exec sont ignorées par défaut pendant dry-run afin d’éviter les effets de bord des commandes.
    - Utilisez `--allow-exec` avec `--dry-run` pour opter pour les vérifications SecretRef exec (cela peut exécuter des commandes de fournisseur).
    - `--allow-exec` est réservé à dry-run et produit une erreur s’il est utilisé sans `--dry-run`.

  </Accordion>
  <Accordion title="Champs de --dry-run --json">
    `--dry-run --json` affiche un rapport lisible par machine :

    - `ok` : indique si dry-run a réussi
    - `operations` : nombre d’affectations évaluées
    - `checks` : indique si les vérifications de schéma/résolubilité ont été exécutées
    - `checks.resolvabilityComplete` : indique si les vérifications de résolubilité sont allées jusqu’au bout (false lorsque les refs exec sont ignorées)
    - `refsChecked` : nombre de refs réellement résolues pendant dry-run
    - `skippedExecRefs` : nombre de refs exec ignorées parce que `--allow-exec` n’était pas défini
    - `errors` : échecs structurés de schéma/résolubilité lorsque `ok=false`

  </Accordion>
</AccordionGroup>

### Forme de la sortie JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="If dry-run fails">
    - `config schema validation failed` : la forme de votre configuration après modification est invalide ; corrigez le chemin/la valeur ou la forme de l’objet provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage` : remettez cet identifiant en entrée texte brut/chaîne et gardez les SecretRefs uniquement sur les surfaces prises en charge.
    - `SecretRef assignment(s) could not be resolved` : le provider/ref référencé ne peut actuellement pas être résolu (variable d’environnement manquante, pointeur de fichier invalide, échec du provider d’exécution ou incompatibilité provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : dry-run a ignoré les refs d’exécution ; relancez avec `--allow-exec` si vous avez besoin de valider leur résolvabilité.
    - Pour le mode par lot, corrigez les entrées en échec et relancez `--dry-run` avant l’écriture.

  </Accordion>
</AccordionGroup>

## Sécurité d’écriture

`openclaw config set` et les autres outils d’écriture de configuration appartenant à OpenClaw valident toute la configuration après modification avant de l’enregistrer sur disque. Si la nouvelle charge utile échoue à la validation du schéma ou ressemble à un écrasement destructeur, la configuration active est conservée et la charge utile rejetée est enregistrée à côté sous le nom `openclaw.json.rejected.*`.

<Warning>
Le chemin de la configuration active doit être un fichier régulier. Les dispositions `openclaw.json` sous forme de lien symbolique ne sont pas prises en charge pour les écritures ; utilisez plutôt `OPENCLAW_CONFIG_PATH` pour pointer directement vers le vrai fichier.
</Warning>

Préférez les écritures via la CLI pour les petites modifications :

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si une écriture est rejetée, inspectez la charge utile enregistrée et corrigez la forme complète de la configuration :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Les écritures directes dans l’éditeur restent autorisées, mais le Gateway en cours d’exécution les traite comme non fiables tant qu’elles ne sont pas validées. Les modifications directes invalides font échouer le démarrage ou sont ignorées par le rechargement à chaud ; le Gateway ne réécrit pas `openclaw.json`. Exécutez `openclaw doctor --fix` pour réparer une configuration préfixée/écrasée ou restaurer la dernière copie connue comme valide. Consultez [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config).

La récupération du fichier complet est réservée à la réparation par doctor. Les changements de schéma de Plugin ou les décalages `minHostVersion` restent visibles au lieu de restaurer des paramètres utilisateur sans rapport, comme les modèles, providers, profils d’authentification, canaux, exposition du Gateway, outils, mémoire, navigateur ou configuration cron.

## Sous-commandes

- `config file` : affiche le chemin du fichier de configuration actif (résolu depuis `OPENCLAW_CONFIG_PATH` ou l’emplacement par défaut). Le chemin doit désigner un fichier régulier, pas un lien symbolique.

Redémarrez le Gateway après les modifications.

## Valider

Validez la configuration actuelle par rapport au schéma actif sans démarrer le Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Une fois que `openclaw config validate` réussit, vous pouvez utiliser le TUI local pour qu’un agent intégré compare la configuration active à la documentation pendant que vous validez chaque changement depuis le même terminal :

<Note>
Si la validation échoue déjà, commencez par `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre les configurations invalides.
</Note>

```bash
openclaw chat
```

Puis dans le TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Boucle de réparation typique :

<Steps>
  <Step title="Compare with docs">
    Demandez à l’agent de comparer votre configuration actuelle avec la page de documentation pertinente et de suggérer la plus petite correction.
  </Step>
  <Step title="Apply targeted edits">
    Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Relancez `openclaw config validate` après chaque changement.
  </Step>
  <Step title="Doctor for runtime issues">
    Si la validation réussit mais que l’exécution reste défaillante, lancez `openclaw doctor` ou `openclaw doctor --fix` pour obtenir de l’aide sur la migration et la réparation.
  </Step>
</Steps>

## Connexe

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
