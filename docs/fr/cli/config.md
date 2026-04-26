---
read_when:
    - Vous souhaitez lire ou modifier la configuration de manière non interactive
sidebarTitle: Config
summary: Référence CLI pour `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Configuration
x-i18n:
    generated_at: "2026-04-26T11:25:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Helpers de configuration pour les modifications non interactives dans `openclaw.json` : obtenir/définir/supprimer/fichier/schéma/valider des valeurs par chemin et afficher le fichier de configuration actif. Exécutez sans sous-commande pour ouvrir l’assistant de configuration (identique à `openclaw configure`).

## Options racine

<ParamField path="--section <section>" type="string">
  Filtre de section de configuration guidée répétable lorsque vous exécutez `openclaw config` sans sous-commande.
</ParamField>

Sections guidées prises en charge : `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Affiche le schéma JSON généré pour `openclaw.json` sur stdout au format JSON.

<AccordionGroup>
  <Accordion title="Ce qu’il inclut">
    - Le schéma de configuration racine actuel, plus un champ chaîne `$schema` à la racine pour les outils d’éditeur.
    - Les métadonnées de documentation des champs `title` et `description` utilisées par l’interface de contrôle.
    - Les nœuds d’objet imbriqué, joker (`*`) et élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsqu’une documentation de champ correspondante existe.
    - Les branches `anyOf` / `oneOf` / `allOf` héritent également des mêmes métadonnées de documentation lorsqu’une documentation de champ correspondante existe.
    - Les métadonnées de schéma des Plugin + canaux chargées en direct au mieux de l’effort lorsque les manifestes runtime peuvent être chargés.
    - Un schéma de repli propre même lorsque la configuration actuelle est invalide.
  </Accordion>
  <Accordion title="RPC runtime associé">
    `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma superficiel (`title`, `description`, `type`, `enum`, `const`, bornes communes), les métadonnées d’indice d’interface correspondantes et des résumés des enfants immédiats. Utilisez-le pour une exploration ciblée par chemin dans l’interface de contrôle ou dans des clients personnalisés.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Redirigez-le vers un fichier lorsque vous souhaitez l’inspecter ou le valider avec d’autres outils :

```bash
openclaw config schema > openclaw.schema.json
```

### Chemins

Les chemins utilisent une notation par point ou par crochets :

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Utilisez l’index de la liste des agents pour cibler un agent spécifique :

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valeurs

Les valeurs sont analysées comme JSON5 lorsque c’est possible ; sinon elles sont traitées comme des chaînes. Utilisez `--strict-json` pour exiger une analyse JSON5. `--json` reste pris en charge comme alias hérité.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` affiche la valeur brute en JSON au lieu d’un texte formaté pour le terminal.

<Note>
Par défaut, une affectation d’objet remplace le chemin cible. Les chemins protégés de map/liste qui contiennent souvent des entrées ajoutées par l’utilisateur, tels que `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` et `auth.profiles`, refusent les remplacements qui supprimeraient des entrées existantes sauf si vous passez `--replace`.
</Note>

Utilisez `--merge` lorsque vous ajoutez des entrées à ces maps :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Utilisez `--replace` uniquement lorsque vous voulez intentionnellement que la valeur fournie devienne la valeur complète de la cible.

## Modes de `config set`

`openclaw config set` prend en charge quatre styles d’affectation :

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
    Le mode constructeur de fournisseur cible uniquement les chemins `secrets.providers.<alias>` :

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
Les affectations SecretRef sont rejetées sur les surfaces non mutables au runtime non prises en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons Webhook de liaison de fil Discord et le JSON d’identifiants WhatsApp). Voir [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Warning>

L’analyse par lot utilise toujours la charge utile du lot (`--batch-json`/`--batch-file`) comme source de vérité. `--strict-json` / `--json` ne modifient pas le comportement d’analyse du lot.

Le mode JSON chemin/valeur reste pris en charge à la fois pour SecretRefs et pour les fournisseurs :

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Indicateurs du constructeur de fournisseur

Les cibles du constructeur de fournisseur doivent utiliser `secrets.providers.<alias>` comme chemin.

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

Exemple de fournisseur exec renforcé :

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

## Exécution à blanc

Utilisez `--dry-run` pour valider les modifications sans écrire dans `openclaw.json`.

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
  <Accordion title="Comportement de l’exécution à blanc">
    - Mode constructeur : exécute des vérifications de résolubilité SecretRef pour les refs/fournisseurs modifiés.
    - Mode JSON (`--strict-json`, `--json` ou mode lot) : exécute la validation du schéma plus les vérifications de résolubilité SecretRef.
    - La validation de politique s’exécute également pour les surfaces cibles SecretRef connues non prises en charge.
    - Les vérifications de politique évaluent toute la configuration après modification, donc les écritures d’objet parent (par exemple définir `hooks` comme objet) ne peuvent pas contourner la validation des surfaces non prises en charge.
    - Les vérifications exec SecretRef sont ignorées par défaut pendant l’exécution à blanc afin d’éviter les effets de bord des commandes.
    - Utilisez `--allow-exec` avec `--dry-run` pour activer les vérifications exec SecretRef (cela peut exécuter des commandes de fournisseur).
    - `--allow-exec` est réservé à l’exécution à blanc et produit une erreur s’il est utilisé sans `--dry-run`.
  </Accordion>
  <Accordion title="Champs de --dry-run --json">
    `--dry-run --json` affiche un rapport lisible par machine :

    - `ok` : si l’exécution à blanc a réussi
    - `operations` : nombre d’affectations évaluées
    - `checks` : si les vérifications schéma/résolubilité ont été exécutées
    - `checks.resolvabilityComplete` : si les vérifications de résolubilité se sont terminées complètement (false lorsque les refs exec sont ignorées)
    - `refsChecked` : nombre de refs réellement résolues pendant l’exécution à blanc
    - `skippedExecRefs` : nombre de refs exec ignorées parce que `--allow-exec` n’était pas défini
    - `errors` : échecs structurés de schéma/résolubilité lorsque `ok=false`

  </Accordion>
</AccordionGroup>

### Forme de sortie JSON

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
      ref?: string, // présent pour les erreurs de résolubilité
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
          "message": "Error: La variable d’environnement \"MISSING_TEST_SECRET\" n’est pas définie.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si l’exécution à blanc échoue">
    - `config schema validation failed` : la forme de votre configuration après modification est invalide ; corrigez le chemin/la valeur ou la forme de l’objet fournisseur/ref.
    - `Config policy validation failed: unsupported SecretRef usage` : remettez cet identifiant dans une entrée en texte brut/chaîne et conservez les SecretRefs uniquement sur les surfaces prises en charge.
    - `SecretRef assignment(s) could not be resolved` : le fournisseur/ref référencé ne peut actuellement pas être résolu (variable d’environnement manquante, pointeur de fichier invalide, échec du fournisseur exec ou incompatibilité fournisseur/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : l’exécution à blanc a ignoré des refs exec ; relancez avec `--allow-exec` si vous avez besoin d’une validation de résolubilité exec.
    - Pour le mode lot, corrigez les entrées en échec et relancez `--dry-run` avant l’écriture.
  </Accordion>
</AccordionGroup>

## Sécurité d’écriture

`openclaw config set` et les autres écrivains de configuration gérés par OpenClaw valident l’intégralité de la configuration après modification avant de la valider sur disque. Si la nouvelle charge utile échoue à la validation du schéma ou ressemble à un écrasement destructeur, la configuration active est laissée intacte et la charge utile rejetée est enregistrée à côté sous la forme `openclaw.json.rejected.*`.

<Warning>
Le chemin de configuration actif doit être un fichier ordinaire. Les dispositions `openclaw.json` avec lien symbolique ne sont pas prises en charge pour l’écriture ; utilisez plutôt `OPENCLAW_CONFIG_PATH` pour pointer directement vers le vrai fichier.
</Warning>

Préférez les écritures CLI pour les petites modifications :

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si une écriture est rejetée, inspectez la charge utile enregistrée et corrigez la forme complète de la configuration :

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Les écritures directes dans l’éditeur restent autorisées, mais la Gateway en cours d’exécution les traite comme non fiables jusqu’à leur validation. Les modifications directes invalides peuvent être restaurées à partir de la dernière sauvegarde valide connue au démarrage ou lors du rechargement à chaud. Voir [Dépannage de la Gateway](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config).

La récupération du fichier entier est réservée à une configuration globalement défectueuse, comme des erreurs d’analyse, des échecs de schéma au niveau racine, des échecs de migration héritée ou des échecs mixtes Plugin et racine. Si la validation échoue uniquement sous `plugins.entries.<id>...`, OpenClaw conserve `openclaw.json` actif en place et signale plutôt le problème local au Plugin au lieu de restaurer `.last-good`. Cela empêche les changements de schéma Plugin ou les décalages `minHostVersion` de faire revenir en arrière des paramètres utilisateur non liés, tels que les modèles, fournisseurs, profils d’authentification, canaux, exposition Gateway, outils, mémoire, navigateur ou configuration Cron.

## Sous-commandes

- `config file` : affiche le chemin du fichier de configuration actif (résolu depuis `OPENCLAW_CONFIG_PATH` ou l’emplacement par défaut). Le chemin doit désigner un fichier ordinaire, pas un lien symbolique.

Redémarrez la Gateway après les modifications.

## Valider

Validez la configuration actuelle par rapport au schéma actif sans démarrer la Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Une fois que `openclaw config validate` réussit, vous pouvez utiliser le TUI local pour demander à un agent intégré de comparer la configuration active avec la documentation pendant que vous validez chaque modification depuis le même terminal :

<Note>
Si la validation échoue déjà, commencez par `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre les configurations invalides.
</Note>

```bash
openclaw chat
```

Ensuite, dans le TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Boucle de réparation typique :

<Steps>
  <Step title="Comparer avec la documentation">
    Demandez à l’agent de comparer votre configuration actuelle avec la page de documentation pertinente et de suggérer la correction la plus petite possible.
  </Step>
  <Step title="Appliquer des modifications ciblées">
    Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Valider à nouveau">
    Relancez `openclaw config validate` après chaque modification.
  </Step>
  <Step title="Doctor pour les problèmes runtime">
    Si la validation réussit mais que le runtime reste en mauvais état, exécutez `openclaw doctor` ou `openclaw doctor --fix` pour obtenir de l’aide sur la migration et la réparation.
  </Step>
</Steps>

## Liens connexes

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
