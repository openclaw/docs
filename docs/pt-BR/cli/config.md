---
read_when:
    - Você quer ler ou editar a configuração sem interação
summary: Referência de CLI para `openclaw config` (get/set/unset/file/schema/validate)
title: Configuração
x-i18n:
    generated_at: "2026-04-25T13:43:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helpers de configuração para edições sem interação em `openclaw.json`: get/set/unset/file/schema/validate
valores por caminho e imprimem o arquivo de configuração ativo. Execute sem um subcomando para
abrir o assistente de configuração (o mesmo que `openclaw configure`).

Opções raiz:

- `--section <section>`: filtro repetível de seção da configuração guiada ao executar `openclaw config` sem um subcomando

Seções guiadas compatíveis:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Exemplos

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

Imprime o schema JSON gerado para `openclaw.json` em stdout como JSON.

O que ele inclui:

- O schema atual da configuração raiz, além de um campo de string `$schema` na raiz para ferramentas de editor
- Metadados de documentação dos campos `title` e `description` usados pela Control UI
- Nós de objetos aninhados, wildcard (`*`) e itens de array (`[]`) herdam os mesmos metadados `title` / `description` quando existe documentação de campo correspondente
- Ramos `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação quando existe documentação de campo correspondente
- Metadados de schema de Plugin + canal em melhor esforço quando manifests de runtime podem ser carregados ao vivo
- Um schema de fallback limpo mesmo quando a configuração atual é inválida

RPC de runtime relacionado:

- `config.schema.lookup` retorna um caminho de configuração normalizado com um
  nó de schema raso (`title`, `description`, `type`, `enum`, `const`, limites comuns),
  metadados de dica de UI correspondentes e resumos imediatos dos filhos. Use-o para
  detalhamento com escopo de caminho na Control UI ou em clientes personalizados.

```bash
openclaw config schema
```

Envie para um arquivo quando quiser inspecioná-lo ou validá-lo com outras ferramentas:

```bash
openclaw config schema > openclaw.schema.json
```

### Caminhos

Os caminhos usam notação por ponto ou por colchetes:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Use o índice da lista de agentes para direcionar um agente específico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Os valores são analisados como JSON5 quando possível; caso contrário, são tratados como strings.
Use `--strict-json` para exigir análise JSON5. `--json` continua compatível como alias legado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime o valor bruto como JSON em vez de texto formatado para terminal.

Atribuição de objeto substitui o caminho de destino por padrão. Caminhos protegidos de mapa/lista
que normalmente contêm entradas adicionadas pelo usuário, como `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` e
`auth.profiles`, recusam substituições que removeriam entradas existentes, a menos que
você use `--replace`.

Use `--merge` ao adicionar entradas a esses mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` apenas quando você realmente quiser que o valor fornecido se torne
o valor completo de destino.

## Modos de `config set`

`openclaw config set` oferece suporte a quatro estilos de atribuição:

1. Modo de valor: `openclaw config set <path> <value>`
2. Modo builder de SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Modo builder de provider (apenas para caminho `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Modo em lote (`--batch-json` ou `--batch-file`):

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

Observação de política:

- Atribuições de SecretRef são rejeitadas em superfícies mutáveis em runtime não compatíveis (por exemplo, `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculação de thread do Discord e JSON de credenciais do WhatsApp). Consulte [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).

A análise em lote sempre usa a carga do lote (`--batch-json`/`--batch-file`) como fonte da verdade.
`--strict-json` / `--json` não alteram o comportamento de análise em lote.

O modo JSON de caminho/valor continua compatível tanto para SecretRefs quanto para providers:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flags do builder de provider

Os destinos do builder de provider devem usar `secrets.providers.<alias>` como caminho.

Flags comuns:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider de env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (repetível)

Provider de arquivo (`--provider-source file`):

- `--provider-path <path>` (obrigatório)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Provider de exec (`--provider-source exec`):

- `--provider-command <path>` (obrigatório)
- `--provider-arg <arg>` (repetível)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (repetível)
- `--provider-pass-env <ENV_VAR>` (repetível)
- `--provider-trusted-dir <path>` (repetível)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Exemplo de provider de exec endurecido:

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

## Simulação

Use `--dry-run` para validar alterações sem gravar em `openclaw.json`.

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

Comportamento de `dry-run`:

- Modo builder: executa verificações de resolubilidade de SecretRef para refs/providers alterados.
- Modo JSON (`--strict-json`, `--json` ou modo em lote): executa validação de schema mais verificações de resolubilidade de SecretRef.
- A validação de política também é executada para superfícies de destino de SecretRef conhecidas como não compatíveis.
- As verificações de política avaliam a configuração completa após a alteração, portanto gravações em objetos pais (por exemplo, definir `hooks` como objeto) não podem contornar a validação de superfície não compatível.
- Verificações de SecretRef de exec são ignoradas por padrão durante `dry-run` para evitar efeitos colaterais de comandos.
- Use `--allow-exec` com `--dry-run` para ativar as verificações de SecretRef de exec (isso pode executar comandos de provider).
- `--allow-exec` é apenas para `dry-run` e gera erro se usado sem `--dry-run`.

`--dry-run --json` imprime um relatório legível por máquina:

- `ok`: se o dry-run passou
- `operations`: número de atribuições avaliadas
- `checks`: se as verificações de schema/resolubilidade foram executadas
- `checks.resolvabilityComplete`: se as verificações de resolubilidade foram concluídas por completo (`false` quando refs de exec são ignorados)
- `refsChecked`: número de refs realmente resolvidos durante o dry-run
- `skippedExecRefs`: número de refs de exec ignorados porque `--allow-exec` não foi definido
- `errors`: falhas estruturadas de schema/resolubilidade quando `ok=false`

### Estrutura da saída JSON

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
      ref?: string, // presente para erros de resolubilidade
    },
  ],
}
```

Exemplo de sucesso:

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

Exemplo de falha:

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

Se o dry-run falhar:

- `config schema validation failed`: o formato da sua configuração após a alteração é inválido; corrija o caminho/valor ou o formato do objeto de provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: mova essa credencial de volta para entrada plaintext/string e mantenha SecretRefs apenas em superfícies compatíveis.
- `SecretRef assignment(s) could not be resolved`: o provider/ref referenciado atualmente não pode ser resolvido (variável de ambiente ausente, ponteiro de arquivo inválido, falha do provider de exec ou incompatibilidade entre provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: o dry-run ignorou refs de exec; execute novamente com `--allow-exec` se precisar da validação de resolubilidade de exec.
- Para o modo em lote, corrija as entradas com falha e execute `--dry-run` novamente antes de gravar.

## Segurança de gravação

`openclaw config set` e outros gravadores de configuração controlados pelo OpenClaw validam a configuração completa
após a alteração antes de confirmá-la em disco. Se a nova carga falhar na
validação de schema ou parecer uma sobrescrita destrutiva, a configuração ativa será mantida
inalterada e a carga rejeitada será salva ao lado dela como `openclaw.json.rejected.*`.
O caminho da configuração ativa deve ser um arquivo regular. Layouts de `openclaw.json`
com symlink não são compatíveis para gravações; use `OPENCLAW_CONFIG_PATH` para apontar diretamente
para o arquivo real.

Prefira gravações pela CLI para pequenas edições:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se uma gravação for rejeitada, inspecione a carga salva e corrija o formato completo da configuração:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Gravações diretas no editor ainda são permitidas, mas o Gateway em execução as trata como
não confiáveis até que sejam validadas. Edições diretas inválidas podem ser restauradas a partir do
backup da última configuração válida conhecida durante a inicialização ou hot reload. Consulte
[Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config).

A recuperação do arquivo inteiro é reservada para configurações globalmente quebradas, como
erros de análise, falhas de schema no nível raiz, falhas de migração legadas ou falhas mistas
de Plugin e raiz. Se a validação falhar apenas em `plugins.entries.<id>...`,
o OpenClaw mantém o `openclaw.json` ativo no lugar e relata o problema local do Plugin
em vez de restaurar `.last-good`. Isso evita que mudanças de schema de Plugin ou
incompatibilidade de `minHostVersion` revertam configurações do usuário não relacionadas, como modelos,
providers, perfis de autenticação, canais, exposição do Gateway, ferramentas, memória, navegador ou
configuração de Cron.

## Subcomandos

- `config file`: imprime o caminho do arquivo de configuração ativo (resolvido a partir de `OPENCLAW_CONFIG_PATH` ou do local padrão). O caminho deve nomear um arquivo regular, não um symlink.

Reinicie o Gateway após as edições.

## Validar

Valide a configuração atual em relação ao schema ativo sem iniciar o
Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Depois que `openclaw config validate` estiver passando, você pode usar a TUI local para que
um agente incorporado compare a configuração ativa com a documentação enquanto você valida
cada alteração a partir do mesmo terminal:

Se a validação já estiver falhando, comece com `openclaw configure` ou
`openclaw doctor --fix`. `openclaw chat` não contorna a proteção contra
configuração inválida.

```bash
openclaw chat
```

Depois, dentro da TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Loop típico de reparo:

- Peça ao agente para comparar sua configuração atual com a página relevante da documentação e sugerir a menor correção possível.
- Aplique edições direcionadas com `openclaw config set` ou `openclaw configure`.
- Execute `openclaw config validate` novamente após cada alteração.
- Se a validação passar, mas o runtime ainda não estiver saudável, execute `openclaw doctor` ou `openclaw doctor --fix` para ajuda com migração e reparo.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Configuração](/pt-BR/gateway/configuration)
