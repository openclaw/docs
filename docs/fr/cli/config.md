---
read_when:
    - Vous voulez lire ou modifier la configuration de manière non interactive
sidebarTitle: Config
summary: Référence CLI pour `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuration
x-i18n:
    generated_at: "2026-06-28T22:33:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Assistants de configuration pour les modifications non interactives dans `openclaw.json` : obtenir/définir/corriger/annuler/afficher le fichier/le schéma/valider des valeurs par chemin et afficher le fichier de configuration actif. Exécutez sans sous-commande pour ouvrir l’assistant de configuration (identique à `openclaw configure`).

<Note>
Lorsque `OPENCLAW_NIX_MODE=1`, OpenClaw traite `openclaw.json` comme immuable. Les commandes en lecture seule comme `config get`, `config file`, `config schema` et `config validate` fonctionnent toujours, mais les commandes d’écriture de configuration refusent de s’exécuter. Les agents doivent plutôt modifier la source Nix de l’installation ; pour la distribution interne nix-openclaw, utilisez [Démarrage rapide nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) et définissez les valeurs sous `programs.openclaw.config` ou `instances.<name>.config`.
</Note>

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

### `config schema`

Affiche le schéma JSON généré pour `openclaw.json` sur stdout au format JSON.

<AccordionGroup>
  <Accordion title="Ce qu’il inclut">
    - Le schéma de configuration racine actuel, plus un champ de chaîne `$schema` racine pour les outils d’éditeur.
    - Les métadonnées de documentation `title` et `description` des champs utilisées par l’interface utilisateur de contrôle.
    - Les nœuds d’objet imbriqué, de joker (`*`) et d’élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsque la documentation de champ correspondante existe.
    - Les branches `anyOf` / `oneOf` / `allOf` héritent elles aussi des mêmes métadonnées de documentation lorsque la documentation de champ correspondante existe.
    - Métadonnées de schéma des plugins et canaux en direct, au mieux, lorsque les manifestes d’exécution peuvent être chargés.
    - Un schéma de repli propre même lorsque la configuration actuelle est invalide.

  </Accordion>
  <Accordion title="RPC d’exécution associé">
    `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma superficiel (`title`, `description`, `type`, `enum`, `const`, bornes courantes), les métadonnées d’indice d’interface utilisateur correspondantes et des résumés des enfants immédiats. Utilisez-le pour l’exploration ciblée par chemin dans l’interface utilisateur de contrôle ou dans des clients personnalisés.
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

Les chemins utilisent la notation par points ou par crochets. Mettez entre guillemets les chemins en notation par crochets dans les exemples shell afin que les shells comme zsh ne développent pas `[0]` comme un glob avant qu’OpenClaw ne reçoive le chemin :

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Utilisez l’index de la liste d’agents pour cibler un agent précis :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Valeurs

Les valeurs sont analysées comme JSON5 lorsque c’est possible ; sinon, elles sont traitées comme des chaînes. Utilisez `--strict-json` pour exiger une analyse JSON standard sans repli vers une chaîne. `--json` reste pris en charge comme alias historique de `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Lorsque `--strict-json` est activé, la syntaxe propre à JSON5, comme les commentaires, les virgules finales ou les clés d’objet non entre guillemets, est rejetée. Omettez `--strict-json` pour analyser les valeurs JSON5 avec repli vers une chaîne brute.

`config get <path> --json` affiche la valeur brute au format JSON au lieu d’un texte formaté pour le terminal.

<Note>
L’affectation d’objet remplace le chemin cible par défaut. Les chemins de mappe/liste protégés qui contiennent souvent des entrées ajoutées par l’utilisateur, comme `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` et `auth.profiles`, refusent les remplacements qui supprimeraient des entrées existantes, sauf si vous passez `--replace`.
</Note>

Utilisez `--merge` lorsque vous ajoutez des entrées à ces mappes :

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
  <Tab title="Mode générateur SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Mode générateur de fournisseur">
    Le mode générateur de fournisseur cible uniquement les chemins `secrets.providers.<alias>` :

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
Les affectations SecretRef sont rejetées sur les surfaces modifiables à l’exécution non prises en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons Webhook de liaison de fil Discord et le JSON des identifiants WhatsApp). Consultez [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Warning>

L’analyse des lots utilise toujours la charge utile du lot (`--batch-json`/`--batch-file`) comme source de vérité. `--strict-json` / `--json` ne changent pas le comportement d’analyse des lots.

## `config patch`

Utilisez `config patch` lorsque vous voulez coller ou rediriger un correctif ayant la forme d’une configuration au lieu d’exécuter de nombreuses commandes `config set` basées sur des chemins. L’entrée est un objet JSON5. Les objets fusionnent récursivement, les tableaux et les valeurs scalaires remplacent la valeur cible, et `null` supprime le chemin cible.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Vous pouvez aussi rediriger un correctif via stdin, ce qui est utile pour les scripts de configuration distante :

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

Utilisez `--replace-path <path>` lorsqu’un objet ou tableau doit devenir exactement la valeur fournie au lieu d’être corrigé récursivement :

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` exécute les vérifications de schéma et de résolvabilité SecretRef sans écrire. Les SecretRefs appuyées par exec sont ignorées par défaut pendant le dry run ; ajoutez `--allow-exec` lorsque vous voulez intentionnellement que le dry run exécute les commandes du fournisseur.

Le mode chemin/valeur JSON reste pris en charge pour les SecretRefs comme pour les fournisseurs :

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Indicateurs du générateur de fournisseur

Les cibles du générateur de fournisseur doivent utiliser `secrets.providers.<alias>` comme chemin.

<AccordionGroup>
  <Accordion title="Indicateurs communs">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Fournisseur env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (répétable)

  </Accordion>
  <Accordion title="Fournisseur fichier (--provider-source file)">
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
  <Accordion title="Comportement du dry-run">
    - Mode builder : exécute les vérifications de résolubilité SecretRef pour les refs/fournisseurs modifiés.
    - Mode JSON (`--strict-json`, `--json` ou mode batch) : exécute la validation du schéma ainsi que les vérifications de résolubilité SecretRef.
    - La validation des politiques s’exécute aussi pour les surfaces cibles SecretRef non prises en charge connues.
    - Les vérifications de politique évaluent toute la configuration après modification ; les écritures d’objets parents (par exemple définir `hooks` comme objet) ne peuvent donc pas contourner la validation des surfaces non prises en charge.
    - Les vérifications SecretRef exec sont ignorées par défaut pendant le dry-run afin d’éviter les effets de bord des commandes.
    - Utilisez `--allow-exec` avec `--dry-run` pour activer les vérifications SecretRef exec (cela peut exécuter des commandes de fournisseur).
    - `--allow-exec` est réservé au dry-run et produit une erreur s’il est utilisé sans `--dry-run`.

  </Accordion>
  <Accordion title="Champs --dry-run --json">
    `--dry-run --json` affiche un rapport lisible par machine :

    - `ok` : indique si le dry-run a réussi
    - `operations` : nombre d’affectations évaluées
    - `checks` : indique si les vérifications de schéma/résolubilité ont été exécutées
    - `checks.resolvabilityComplete` : indique si les vérifications de résolubilité sont allées à leur terme (false lorsque les refs exec sont ignorées)
    - `refsChecked` : nombre de refs réellement résolues pendant le dry-run
    - `skippedExecRefs` : nombre de refs exec ignorées parce que `--allow-exec` n’était pas défini
    - `errors` : échecs structurés de chemin manquant, de schéma ou de résolubilité lorsque `ok=false`

  </Accordion>
</AccordionGroup>

### Forme de la sortie JSON

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
      ref?: string, // présent pour les erreurs de résolubilité
    },
  ],
}
```

<Tabs>
  <Tab title="Exemple de succès">
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
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si le dry-run échoue">
    - `config schema validation failed` : la forme de votre configuration après modification est invalide ; corrigez le chemin/la valeur ou la forme de l’objet fournisseur/ref.
    - `Config policy validation failed: unsupported SecretRef usage` : replacez cet identifiant dans une entrée en clair/chaîne et conservez les SecretRefs uniquement sur les surfaces prises en charge.
    - `SecretRef assignment(s) could not be resolved` : le fournisseur/la ref référencé(e) ne peut actuellement pas être résolu(e) (variable d’environnement manquante, pointeur de fichier invalide, échec du fournisseur exec ou incompatibilité fournisseur/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : le dry-run a ignoré les refs exec ; relancez avec `--allow-exec` si vous avez besoin de valider la résolubilité exec.
    - En mode batch, corrigez les entrées en échec et relancez `--dry-run` avant l’écriture.

  </Accordion>
</AccordionGroup>

## Sécurité d’écriture

`openclaw config set` et les autres outils d’écriture de configuration appartenant à OpenClaw valident l’intégralité de la configuration après modification avant de l’enregistrer sur disque. Si la nouvelle charge utile échoue à la validation du schéma ou ressemble à un écrasement destructeur, la configuration active est laissée intacte et la charge utile rejetée est enregistrée à côté sous le nom `openclaw.json.rejected.*`.

<Warning>
Le chemin de configuration active doit être un fichier ordinaire. Les dispositions `openclaw.json` avec lien symbolique ne sont pas prises en charge pour les écritures ; utilisez `OPENCLAW_CONFIG_PATH` pour pointer directement vers le fichier réel à la place.
</Warning>

Privilégiez les écritures CLI pour les petites modifications :

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si une écriture est rejetée, inspectez la charge utile enregistrée et corrigez toute la forme de la configuration :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Les écritures directes dans un éditeur restent autorisées, mais le Gateway en cours d’exécution les traite comme non fiables jusqu’à ce qu’elles soient validées. Les modifications directes invalides font échouer le démarrage ou sont ignorées par le rechargement à chaud ; Gateway ne réécrit pas `openclaw.json`. Exécutez `openclaw doctor --fix` pour réparer une configuration préfixée/écrasée ou restaurer la dernière copie connue valide. Voir [Dépannage du Gateway](/fr/gateway/troubleshooting#gateway-rejected-invalid-config).

La récupération de fichier complet est réservée à la réparation par doctor. Les changements de schéma Plugin ou les décalages `minHostVersion` restent visibles au lieu d’annuler des paramètres utilisateur sans lien, tels que les modèles, fournisseurs, profils d’authentification, canaux, exposition du Gateway, outils, mémoire, navigateur ou configuration cron.

## Sous-commandes

- `config file` : affiche le chemin du fichier de configuration actif (résolu depuis `OPENCLAW_CONFIG_PATH` ou l’emplacement par défaut). Le chemin doit désigner un fichier ordinaire, pas un lien symbolique.

Redémarrez le gateway après les modifications.

## Valider

Validez la configuration actuelle par rapport au schéma actif sans démarrer le gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Une fois `openclaw config validate` réussi, vous pouvez utiliser le TUI local pour qu’un agent intégré compare la configuration active à la documentation pendant que vous validez chaque modification depuis le même terminal :

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

Boucle de réparation type :

<Steps>
  <Step title="Comparer avec la documentation">
    Demandez à l’agent de comparer votre configuration actuelle avec la page de documentation pertinente et de suggérer le plus petit correctif.
  </Step>
  <Step title="Appliquer des modifications ciblées">
    Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Revalider">
    Relancez `openclaw config validate` après chaque changement.
  </Step>
  <Step title="Doctor pour les problèmes d’exécution">
    Si la validation réussit mais que l’exécution reste dégradée, exécutez `openclaw doctor` ou `openclaw doctor --fix` pour obtenir de l’aide sur les migrations et les réparations.
  </Step>
</Steps>

## Liens connexes

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
