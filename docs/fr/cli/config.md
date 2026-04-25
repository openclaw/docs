---
read_when:
    - Vous voulez lire ou modifier la configuration de manière non interactive
summary: Référence CLI pour `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Config
x-i18n:
    generated_at: "2026-04-25T13:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Assistants de configuration pour les modifications non interactives dans `openclaw.json` : obtenir/définir/supprimer/fichier/schéma/valider
des valeurs par chemin et afficher le fichier de configuration actif. Exécutez sans sous-commande pour
ouvrir l’assistant de configuration (identique à `openclaw configure`).

Options racine :

- `--section <section>` : filtre de section de configuration guidée répétable lorsque vous exécutez `openclaw config` sans sous-commande

Sections guidées prises en charge :

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

Ce qu’il inclut :

- Le schéma de configuration racine actuel, plus un champ chaîne `$schema` à la racine pour l’outillage de l’éditeur
- Les métadonnées de documentation des champs `title` et `description` utilisées par l’interface de contrôle
- Les nœuds d’objet imbriqué, générique (`*`) et d’élément de tableau (`[]`) héritent des mêmes métadonnées `title` / `description` lorsqu’une documentation de champ correspondante existe
- Les branches `anyOf` / `oneOf` / `allOf` héritent également des mêmes métadonnées de documentation lorsqu’une documentation de champ correspondante existe
- Des métadonnées de schéma best-effort en direct pour les Plugin + canaux lorsque les manifestes d’exécution peuvent être chargés
- Un schéma de repli propre même lorsque la configuration actuelle est invalide

RPC d’exécution associé :

- `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de
  schéma superficiel (`title`, `description`, `type`, `enum`, `const`, bornes courantes),
  les métadonnées d’indice d’interface correspondantes et des résumés des enfants immédiats. Utilisez-le pour
  une exploration ciblée par chemin dans l’interface de contrôle ou dans des clients personnalisés.

```bash
openclaw config schema
```

Redirigez-le vers un fichier lorsque vous souhaitez l’inspecter ou le valider avec d’autres outils :

```bash
openclaw config schema > openclaw.schema.json
```

### Chemins

Les chemins utilisent la notation par points ou par crochets :

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Utilisez l’index de la liste d’agents pour cibler un agent spécifique :

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valeurs

Les valeurs sont analysées comme JSON5 lorsque c’est possible ; sinon elles sont traitées comme des chaînes.
Utilisez `--strict-json` pour exiger l’analyse JSON5. `--json` reste pris en charge comme alias hérité.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` affiche la valeur brute en JSON au lieu d’un texte formaté pour le terminal.

L’affectation d’objet remplace par défaut le chemin cible. Les chemins protégés de map/liste
qui contiennent fréquemment des entrées ajoutées par l’utilisateur, comme `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` et
`auth.profiles`, refusent les remplacements qui supprimeraient des entrées existantes, sauf si
vous passez `--replace`.

Utilisez `--merge` lorsque vous ajoutez des entrées à ces maps :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Utilisez `--replace` uniquement lorsque vous souhaitez intentionnellement que la valeur fournie
devienne la valeur cible complète.

## Modes de `config set`

`openclaw config set` prend en charge quatre styles d’affectation :

1. Mode valeur : `openclaw config set <path> <value>`
2. Mode constructeur de SecretRef :

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Mode constructeur de fournisseur (chemin `secrets.providers.<alias>` uniquement) :

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Mode lot (`--batch-json` ou `--batch-file`) :

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

Remarque de politique :

- Les affectations de SecretRef sont rejetées sur les surfaces mutables d’exécution non prises en charge (par exemple `hooks.token`, `commands.ownerDisplaySecret`, les jetons Webhook de liaison de fil Discord et le JSON d’identifiants WhatsApp). Voir [Surface d’identifiants SecretRef](/fr/reference/secretref-credential-surface).

L’analyse en lot utilise toujours la charge utile du lot (`--batch-json`/`--batch-file`) comme source de vérité.
`--strict-json` / `--json` ne modifient pas le comportement d’analyse en lot.

Le mode JSON chemin/valeur reste pris en charge à la fois pour les SecretRef et les fournisseurs :

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Drapeaux du constructeur de fournisseur

Les cibles du constructeur de fournisseur doivent utiliser `secrets.providers.<alias>` comme chemin.

Drapeaux courants :

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Fournisseur env (`--provider-source env`) :

- `--provider-allowlist <ENV_VAR>` (répétable)

Fournisseur file (`--provider-source file`) :

- `--provider-path <path>` (obligatoire)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Fournisseur exec (`--provider-source exec`) :

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

## Simulation

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

Comportement de la simulation :

- Mode constructeur : exécute des vérifications de résolvabilité SecretRef pour les références/fournisseurs modifiés.
- Mode JSON (`--strict-json`, `--json` ou mode lot) : exécute la validation du schéma ainsi que les vérifications de résolvabilité SecretRef.
- La validation de politique s’exécute également pour les surfaces cibles SecretRef connues comme non prises en charge.
- Les vérifications de politique évaluent la configuration complète après modification ; ainsi, les écritures sur objet parent (par exemple définir `hooks` comme objet) ne peuvent pas contourner la validation des surfaces non prises en charge.
- Les vérifications SecretRef exec sont ignorées par défaut pendant la simulation afin d’éviter les effets de bord des commandes.
- Utilisez `--allow-exec` avec `--dry-run` pour choisir d’exécuter les vérifications SecretRef exec (cela peut exécuter des commandes de fournisseur).
- `--allow-exec` est réservé à la simulation et produit une erreur s’il est utilisé sans `--dry-run`.

`--dry-run --json` affiche un rapport lisible par machine :

- `ok` : indique si la simulation a réussi
- `operations` : nombre d’affectations évaluées
- `checks` : indique si les vérifications de schéma/résolvabilité ont été exécutées
- `checks.resolvabilityComplete` : indique si les vérifications de résolvabilité sont allées jusqu’au bout (false lorsque les références exec sont ignorées)
- `refsChecked` : nombre de références réellement résolues pendant la simulation
- `skippedExecRefs` : nombre de références exec ignorées parce que `--allow-exec` n’était pas défini
- `errors` : échecs structurés de schéma/résolvabilité lorsque `ok=false`

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

Exemple de réussite :

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

Exemple d’échec :

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

Si la simulation échoue :

- `config schema validation failed` : la forme de votre configuration après modification est invalide ; corrigez le chemin/la valeur ou la forme de l’objet fournisseur/référence.
- `Config policy validation failed: unsupported SecretRef usage` : replacez cet identifiant sur une entrée en texte brut/chaîne et conservez les SecretRef uniquement sur les surfaces prises en charge.
- `SecretRef assignment(s) could not be resolved` : le fournisseur/la référence référencé ne peut actuellement pas être résolu (variable d’environnement manquante, pointeur de fichier invalide, échec du fournisseur exec ou incompatibilité fournisseur/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)` : la simulation a ignoré des références exec ; relancez avec `--allow-exec` si vous avez besoin de la validation de résolvabilité exec.
- Pour le mode lot, corrigez les entrées en échec puis relancez `--dry-run` avant d’écrire.

## Sécurité d’écriture

`openclaw config set` et les autres écrivains de configuration gérés par OpenClaw valident la configuration complète
après modification avant de l’écrire sur le disque. Si la nouvelle charge utile échoue à la
validation du schéma ou ressemble à un écrasement destructeur, la configuration active est laissée intacte
et la charge utile rejetée est enregistrée à côté sous le nom `openclaw.json.rejected.*`.
Le chemin de la configuration active doit être un fichier ordinaire. Les dispositions de `openclaw.json`
liées par symlink ne sont pas prises en charge pour l’écriture ; utilisez `OPENCLAW_CONFIG_PATH` pour pointer directement
vers le vrai fichier à la place.

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

Les écritures directes via éditeur restent autorisées, mais la Gateway en cours d’exécution les traite comme
non fiables tant qu’elles ne sont pas validées. Les modifications directes invalides peuvent être restaurées à partir de la
dernière sauvegarde valide connue au démarrage ou lors d’un rechargement à chaud. Voir
[Dépannage Gateway](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config).

La récupération du fichier entier est réservée aux configurations globalement cassées, comme les
erreurs d’analyse, les échecs de schéma au niveau racine, les échecs de migration hérités ou les échecs mixtes
de Plugin et de racine. Si la validation échoue uniquement sous `plugins.entries.<id>...`,
OpenClaw conserve `openclaw.json` actif en place et signale plutôt le problème local au Plugin au lieu de restaurer `.last-good`.
Cela empêche les changements de schéma du Plugin ou le décalage de `minHostVersion` d’annuler des paramètres utilisateur non liés tels que les modèles,
fournisseurs, profils d’auth, canaux, exposition Gateway, outils, mémoire, navigateur ou
configuration Cron.

## Sous-commandes

- `config file` : affiche le chemin du fichier de configuration actif (résolu depuis `OPENCLAW_CONFIG_PATH` ou l’emplacement par défaut). Le chemin doit désigner un fichier ordinaire, et non un symlink.

Redémarrez la passerelle après les modifications.

## Valider

Validez la configuration actuelle par rapport au schéma actif sans démarrer la
passerelle.

```bash
openclaw config validate
openclaw config validate --json
```

Une fois que `openclaw config validate` réussit, vous pouvez utiliser la TUI locale pour demander
à un agent intégré de comparer la configuration active à la documentation pendant que vous validez
chaque modification depuis le même terminal :

Si la validation échoue déjà, commencez par `openclaw configure` ou
`openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection
contre les configurations invalides.

```bash
openclaw chat
```

Puis dans la TUI :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Boucle de réparation typique :

- Demandez à l’agent de comparer votre configuration actuelle avec la page de documentation pertinente et de suggérer la correction la plus petite possible.
- Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`.
- Relancez `openclaw config validate` après chaque modification.
- Si la validation réussit mais que l’exécution reste non saine, exécutez `openclaw doctor` ou `openclaw doctor --fix` pour obtenir de l’aide sur la migration et la réparation.

## Lié

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
