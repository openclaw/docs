---
read_when:
    - Você quer ler ou editar a configuração de forma não interativa
sidebarTitle: Config
summary: Referência da CLI para `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Configuração
x-i18n:
    generated_at: "2026-04-26T11:25:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Helpers de configuração para edições não interativas em `openclaw.json`: obter/definir/remover/arquivo/esquema/validar valores por caminho e imprimir o arquivo de configuração ativo. Execute sem um subcomando para abrir o assistente de configuração (igual a `openclaw configure`).

## Opções de raiz

<ParamField path="--section <section>" type="string">
  Filtro repetível de seção da configuração guiada quando você executa `openclaw config` sem um subcomando.
</ParamField>

Seções guiadas compatíveis: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

Imprime o esquema JSON gerado para `openclaw.json` em stdout como JSON.

<AccordionGroup>
  <Accordion title="O que ele inclui">
    - O esquema de configuração de raiz atual, mais um campo de string `$schema` na raiz para ferramentas de editor.
    - Metadados de documentação de campo `title` e `description` usados pela Control UI.
    - Nós aninhados de objeto, curinga (`*`) e item de array (`[]`) herdam os mesmos metadados de `title` / `description` quando existe documentação de campo correspondente.
    - Ramificações `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação quando existe documentação de campo correspondente.
    - Metadados, no melhor esforço, de esquema de Plugin + canal em tempo real quando manifestos de runtime podem ser carregados.
    - Um esquema de fallback limpo mesmo quando a configuração atual é inválida.
  </Accordion>
  <Accordion title="RPC de runtime relacionado">
    `config.schema.lookup` retorna um caminho de configuração normalizado com um nó superficial de esquema (`title`, `description`, `type`, `enum`, `const`, limites comuns), metadados correspondentes de dica de UI e resumos dos filhos imediatos. Use-o para aprofundamento com escopo por caminho na Control UI ou em clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Redirecione para um arquivo quando quiser inspecioná-lo ou validá-lo com outras ferramentas:

```bash
openclaw config schema > openclaw.schema.json
```

### Caminhos

Os caminhos usam notação de ponto ou colchetes:

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

Os valores são analisados como JSON5 quando possível; caso contrário, são tratados como strings. Use `--strict-json` para exigir análise JSON5. `--json` continua compatível como alias legado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime o valor bruto como JSON em vez de texto formatado para terminal.

<Note>
A atribuição de objeto substitui o caminho de destino por padrão. Caminhos protegidos de mapa/lista que normalmente armazenam entradas adicionadas pelo usuário, como `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`, recusam substituições que removeriam entradas existentes, a menos que você passe `--replace`.
</Note>

Use `--merge` ao adicionar entradas a esses mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` apenas quando você realmente quiser que o valor fornecido se torne o valor completo do destino.

## Modos de `config set`

`openclaw config set` oferece suporte a quatro estilos de atribuição:

<Tabs>
  <Tab title="Modo de valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo construtor de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo construtor de provedor">
    O modo construtor de provedor direciona apenas caminhos `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Modo em lote">
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
Atribuições de SecretRef são rejeitadas em superfícies mutáveis em runtime não compatíveis (por exemplo `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculação de thread do Discord e JSON de credenciais do WhatsApp). Veja [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Warning>

A análise em lote sempre usa a carga do lote (`--batch-json`/`--batch-file`) como fonte de verdade. `--strict-json` / `--json` não alteram o comportamento da análise em lote.

O modo JSON path/value continua compatível tanto para SecretRefs quanto para provedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flags do construtor de provedor

Os destinos do construtor de provedor devem usar `secrets.providers.<alias>` como caminho.

<AccordionGroup>
  <Accordion title="Flags comuns">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)
  </Accordion>
  <Accordion title="Provedor env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetível)
  </Accordion>
  <Accordion title="Provedor file (--provider-source file)">
    - `--provider-path <path>` (obrigatório)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`
  </Accordion>
  <Accordion title="Provedor exec (--provider-source exec)">
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
  </Accordion>
</AccordionGroup>

Exemplo reforçado de provedor exec:

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

<AccordionGroup>
  <Accordion title="Comportamento de simulação">
    - Modo construtor: executa verificações de resolubilidade de SecretRef para refs/provedores alterados.
    - Modo JSON (`--strict-json`, `--json` ou modo em lote): executa validação de esquema mais verificações de resolubilidade de SecretRef.
    - A validação de política também é executada para superfícies de destino de SecretRef conhecidas como não compatíveis.
    - As verificações de política avaliam a configuração completa após a alteração, então gravações de objeto pai (por exemplo, definir `hooks` como um objeto) não podem contornar a validação de superfícies não compatíveis.
    - Verificações de SecretRef exec são ignoradas por padrão durante a simulação para evitar efeitos colaterais de comando.
    - Use `--allow-exec` com `--dry-run` para ativar verificações de SecretRef exec (isso pode executar comandos de provedor).
    - `--allow-exec` é apenas para simulação e gera erro se usado sem `--dry-run`.
  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    `--dry-run --json` imprime um relatório legível por máquina:

    - `ok`: se a simulação passou
    - `operations`: número de atribuições avaliadas
    - `checks`: se verificações de esquema/resolubilidade foram executadas
    - `checks.resolvabilityComplete`: se as verificações de resolubilidade foram concluídas (false quando refs exec são ignoradas)
    - `refsChecked`: número de refs realmente resolvidos durante a simulação
    - `skippedExecRefs`: número de refs exec ignorados porque `--allow-exec` não foi definido
    - `errors`: falhas estruturadas de esquema/resolubilidade quando `ok=false`

  </Accordion>
</AccordionGroup>

### Formato da saída JSON

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

<Tabs>
  <Tab title="Exemplo de sucesso">
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
  <Tab title="Exemplo de falha">
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
  <Accordion title="Se a simulação falhar">
    - `config schema validation failed`: o formato da sua configuração após a alteração é inválido; corrija o caminho/valor ou o formato do objeto provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: mova essa credencial de volta para entrada em texto simples/string e mantenha SecretRefs apenas em superfícies compatíveis.
    - `SecretRef assignment(s) could not be resolved`: o provider/ref referenciado atualmente não pode ser resolvido (variável de ambiente ausente, ponteiro de arquivo inválido, falha do provider exec ou incompatibilidade entre provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: a simulação ignorou refs exec; execute novamente com `--allow-exec` se precisar validar a resolubilidade exec.
    - Para o modo em lote, corrija as entradas com falha e execute `--dry-run` novamente antes de gravar.
  </Accordion>
</AccordionGroup>

## Segurança de gravação

`openclaw config set` e outros gravadores de configuração controlados pelo OpenClaw validam a configuração completa após a alteração antes de gravá-la em disco. Se a nova carga falhar na validação de esquema ou parecer uma sobrescrita destrutiva, a configuração ativa é mantida e a carga rejeitada é salva ao lado dela como `openclaw.json.rejected.*`.

<Warning>
O caminho da configuração ativa deve ser um arquivo regular. Layouts de `openclaw.json` com symlink não são compatíveis para gravações; use `OPENCLAW_CONFIG_PATH` para apontar diretamente para o arquivo real.
</Warning>

Prefira gravações via CLI para pequenas edições:

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

Gravações diretas por editor ainda são permitidas, mas o Gateway em execução as trata como não confiáveis até que sejam validadas. Edições diretas inválidas podem ser restauradas a partir do último backup válido conhecido durante a inicialização ou recarga a quente. Veja [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config).

A recuperação de arquivo completo é reservada para configurações globalmente quebradas, como erros de análise, falhas de esquema no nível da raiz, falhas de migração legada ou falhas combinadas de Plugin e raiz. Se a validação falhar apenas em `plugins.entries.<id>...`, o OpenClaw mantém o `openclaw.json` ativo no lugar e relata o problema local do Plugin em vez de restaurar `.last-good`. Isso evita que mudanças de esquema de Plugin ou incompatibilidade de `minHostVersion` revertam configurações do usuário sem relação, como models, providers, perfis de auth, canais, exposição do Gateway, ferramentas, memória, navegador ou configuração de Cron.

## Subcomandos

- `config file`: Imprime o caminho do arquivo de configuração ativo (resolvido a partir de `OPENCLAW_CONFIG_PATH` ou do local padrão). O caminho deve nomear um arquivo regular, não um symlink.

Reinicie o Gateway após as edições.

## Validar

Valide a configuração atual em relação ao esquema ativo sem iniciar o Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Depois que `openclaw config validate` estiver passando, você pode usar a TUI local para que um agente incorporado compare a configuração ativa com a documentação enquanto você valida cada alteração no mesmo terminal:

<Note>
Se a validação já estiver falhando, comece com `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` não contorna a proteção contra configuração inválida.
</Note>

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

<Steps>
  <Step title="Comparar com a documentação">
    Peça ao agente para comparar sua configuração atual com a página de documentação relevante e sugerir a menor correção possível.
  </Step>
  <Step title="Aplicar edições direcionadas">
    Aplique edições direcionadas com `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Validar novamente">
    Execute `openclaw config validate` novamente após cada alteração.
  </Step>
  <Step title="Doctor para problemas de runtime">
    Se a validação passar, mas o runtime ainda não estiver íntegro, execute `openclaw doctor` ou `openclaw doctor --fix` para ajuda com migração e reparo.
  </Step>
</Steps>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Configuration](/pt-BR/gateway/configuration)
