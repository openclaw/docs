---
read_when:
    - Vous souhaitez lire ou modifier la configuration de manière non interactive
summary: Référence CLI pour `openclaw config` (get/set/unset/file/schema/validate)
title: config
x-i18n:
    generated_at: "2026-04-23T07:00:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Utilitaires de configuration pour les modifications non interactives dans `openclaw.json` : obtenir/définir/supprimer/fichier/schéma/valider
les valeurs par chemin et afficher le fichier de configuration actif. Exécutez sans sous-commande pour
ouvrir l’assistant de configuration (identique à `openclaw configure`).

Options racine :

- `--section <section>` : filtre de section de configuration guidée répétable lorsque vous exécutez `openclaw config` sans sous-commande

Sections guidées prises en charge :

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Exemples

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Affiche le schéma JSON généré pour `openclaw.json` sur stdout au format JSON.

Ce qu’il inclut :

- Le schéma de configuration racine actuel, plus un champ chaîne `$schema` à la racine pour l’outillage d’éditeur
- Les métadonnées de documentation de champ `title` et `description` utilisées par l’UI Control
- Les nœuds d’objet imbriqué, générique (`*`) et d’élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsqu’une documentation de champ correspondante existe
- Les branches `anyOf` / `oneOf` / `allOf` héritent aussi des mêmes métadonnées de documentation lorsqu’une documentation de champ correspondante existe
- Les métadonnées de schéma Plugin + canal live au mieux lorsque les manifestes de runtime peuvent être chargés
- Un schéma de repli propre même lorsque la configuration actuelle est invalide

RPC de runtime associé :

- `config.schema.lookup` renvoie un chemin de configuration normalisé avec un
  nœud de schéma superficiel (`title`, `description`, `type`, `enum`, `const`, bornes communes),
  les métadonnées d’indice UI correspondantes et les résumés des enfants immédiats. Utilisez-le pour
  une exploration ciblée par chemin dans l’UI Control ou dans des clients personnalisés.

```bash
openclaw config schema
```

Redirigez-le vers un fichier si vous souhaitez l’inspecter ou le valider avec d’autres outils :

```bash
openclaw config schema > openclaw.schema.json
```

### Chemins

Les chemins utilisent la notation par point ou par crochets :

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

Les valeurs sont analysées comme JSON5 lorsque possible ; sinon elles sont traitées comme des chaînes.
Utilisez `--strict-json` pour exiger l’analyse JSON5. `--json` reste pris en charge comme alias hérité.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` affiche la valeur brute au format JSON au lieu d’un texte formaté pour le terminal.

L’affectation d’objet remplace le chemin cible par défaut. Les chemins protégés de map/liste
qui contiennent fréquemment des entrées ajoutées par l’utilisateur, comme `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` et
`auth.profiles`, refusent les remplacements qui supprimeraient des entrées existantes sauf
si vous passez `--replace`.

Utilisez `--merge` lorsque vous ajoutez des entrées à ces maps :

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Utilisez `--replace` uniquement lorsque vous souhaitez intentionnellement que la valeur fournie
devienne la valeur cible complète.

## Modes de `config set`

`openclaw config set` prend en charge quatre styles d’affectation :

1. Mode valeur : `openclaw config set <path> <value>`
2. Mode constructeur SecretRef :

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Mode constructeur de fournisseur (chemin `secrets.providers.<alias>` uniquement) :

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Mode lot (`--batch-json` ou `--batch-file`) :

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

Remarque sur la politique :

- Les affectations SecretRef sont rejetées sur les surfaces non mutables au runtime non prises en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons Webhook de binding de fil Discord et WhatsApp creds JSON). Voir [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).

L’analyse des lots utilise toujours la charge utile du lot (`--batch-json`/`--batch-file`) comme source de vérité.
`--strict-json` / `--json` ne modifient pas le comportement d’analyse des lots.

Le mode chemin/valeur JSON reste pris en charge à la fois pour SecretRefs et pour les fournisseurs :

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

Indicateurs courants :

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Fournisseur env (`--provider-source env`) :

- `--provider-allowlist <ENV_VAR>` (répétable)

Fournisseur de fichier (`--provider-source file`) :

- `--provider-path <path>` (obligatoire)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Fournisseur exec (`--provider-source exec`) :

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

## Exécution à blanc

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

Comportement de l’exécution à blanc :

- Mode constructeur : exécute les vérifications de résolvabilité SecretRef pour les ref/fournisseurs modifiés.
- Mode JSON (`--strict-json`, `--json` ou mode lot) : exécute la validation du schéma plus les vérifications de résolvabilité SecretRef.
- La validation de politique s’exécute aussi pour les surfaces cibles SecretRef non prises en charge connues.
- Les vérifications de politique évaluent la configuration complète après modification, donc les écritures d’objet parent (par exemple définir `hooks` comme objet) ne peuvent pas contourner la validation des surfaces non prises en charge.
- Les vérifications SecretRef exec sont ignorées par défaut pendant l’exécution à blanc afin d’éviter les effets de bord des commandes.
- Utilisez `--allow-exec` avec `--dry-run` pour activer les vérifications SecretRef exec (cela peut exécuter des commandes de fournisseur).
- `--allow-exec` est réservé à l’exécution à blanc et produit une erreur s’il est utilisé sans `--dry-run`.

`--dry-run --json` affiche un rapport lisible par machine :

- `ok` : si l’exécution à blanc a réussi
- `operations` : nombre d’affectations évaluées
- `checks` : si les vérifications de schéma/résolvabilité ont été exécutées
- `checks.resolvabilityComplete` : si les vérifications de résolvabilité se sont exécutées jusqu’au bout (`false` lorsque les refs exec sont ignorées)
- `refsChecked` : nombre de refs effectivement résolues pendant l’exécution à blanc
- `skippedExecRefs` : nombre de refs exec ignorées parce que `--allow-exec` n’était pas défini
- `errors` : échecs structurés de schéma/résolvabilité lorsque `ok=false`

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
      ref?: string, // présent pour les erreurs de résolvabilité
    },
  ],
}
```

Exemple de réussite :

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

Exemple d’échec :

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

Si l’exécution à blanc échoue :

- `config schema validation failed` : la forme de votre configuration après modification est invalide ; corrigez le chemin/la valeur ou la forme de l’objet fournisseur/ref.
- `Config policy validation failed: unsupported SecretRef usage` : remettez cet identifiant en saisie plaintext/string et conservez SecretRefs uniquement sur les surfaces prises en charge.
- `SecretRef assignment(s) could not be resolved` : le fournisseur/ref référencé ne peut actuellement pas être résolu (variable env manquante, pointeur de fichier invalide, échec du fournisseur exec ou incompatibilité fournisseur/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : l’exécution à blanc a ignoré des refs exec ; relancez avec `--allow-exec` si vous avez besoin de valider leur résolvabilité.
- Pour le mode lot, corrigez les entrées en échec et relancez `--dry-run` avant l’écriture.

## Sécurité d’écriture

`openclaw config set` et les autres rédacteurs de configuration gérés par OpenClaw valident la
configuration complète après modification avant de la valider sur disque. Si la nouvelle charge utile échoue à la validation de schéma
ou ressemble à un écrasement destructeur, la configuration active est laissée intacte
et la charge utile rejetée est enregistrée à côté sous le nom `openclaw.json.rejected.*`.
Le chemin de la configuration active doit être un fichier ordinaire. Les dispositions `openclaw.json`
avec lien symbolique ne sont pas prises en charge pour l’écriture ; utilisez `OPENCLAW_CONFIG_PATH` pour pointer directement
vers le fichier réel à la place.

Préférez les écritures CLI pour les petites modifications :

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

Les écritures directes dans l’éditeur restent autorisées, mais la Gateway en cours d’exécution les traite comme
non fiables tant qu’elles ne sont pas validées. Les modifications directes invalides peuvent être restaurées à partir de la
sauvegarde last-known-good au démarrage ou lors du rechargement à chaud. Voir
[Dépannage de Gateway](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Sous-commandes

- `config file` : Affiche le chemin du fichier de configuration actif (résolu à partir de `OPENCLAW_CONFIG_PATH` ou de l’emplacement par défaut). Le chemin doit désigner un fichier ordinaire, pas un lien symbolique.

Redémarrez la passerelle après les modifications.

## Validation

Validez la configuration actuelle par rapport au schéma actif sans démarrer la
passerelle.

```bash
openclaw config validate
openclaw config validate --json
```

Une fois que `openclaw config validate` réussit, vous pouvez utiliser le TUI local pour demander à
un agent intégré de comparer la configuration active à la documentation pendant que vous validez
chaque modification depuis le même terminal :

Si la validation échoue déjà, commencez par `openclaw configure` ou
`openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection
contre les configurations invalides.

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

- Demandez à l’agent de comparer votre configuration actuelle avec la page de documentation pertinente et de suggérer la plus petite correction.
- Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`.
- Relancez `openclaw config validate` après chaque modification.
- Si la validation réussit mais que le runtime reste en mauvais état, exécutez `openclaw doctor` ou `openclaw doctor --fix` pour obtenir de l’aide sur la migration et la réparation.
