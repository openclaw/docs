---
read_when:
    - Você quer ler ou editar a configuração de forma não interativa
sidebarTitle: Config
summary: Referência da CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuração
x-i18n:
    generated_at: "2026-04-30T09:40:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

Auxiliares de configuração para edições não interativas em `openclaw.json`: obter/definir/aplicar patch/remover/arquivo/esquema/validar valores por caminho e imprimir o arquivo de configuração ativo. Execute sem subcomando para abrir o assistente de configuração (igual a `openclaw configure`).

## Opções raiz

<ParamField path="--section <section>" type="string">
  Filtro repetível de seção da configuração guiada ao executar `openclaw config` sem subcomando.
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
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Imprime o esquema JSON gerado para `openclaw.json` em stdout como JSON.

<AccordionGroup>
  <Accordion title="What it includes">
    - O esquema atual da configuração raiz, além de um campo de string `$schema` raiz para ferramentas de editor.
    - Metadados de documentação `title` e `description` de campos usados pela Control UI.
    - Nós de objeto aninhado, curinga (`*`) e item de array (`[]`) herdam os mesmos metadados `title` / `description` quando há documentação de campo correspondente.
    - Ramificações `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação quando há documentação de campo correspondente.
    - Metadados de esquema de Plugin + canal em tempo real em caráter de melhor esforço quando os manifestos de runtime podem ser carregados.
    - Um esquema de fallback limpo mesmo quando a configuração atual é inválida.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` retorna um caminho de configuração normalizado com um nó de esquema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns), metadados de dica de UI correspondentes e resumos dos filhos imediatos. Use-o para aprofundamento com escopo de caminho na Control UI ou em clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Encaminhe para um arquivo quando quiser inspecioná-lo ou validá-lo com outras ferramentas:

```bash
openclaw config schema > openclaw.schema.json
```

### Caminhos

Os caminhos usam notação por ponto ou colchetes:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Use o índice da lista de agentes para mirar um agente específico:

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
A atribuição de objeto substitui o caminho de destino por padrão. Caminhos protegidos de mapas/listas que normalmente contêm entradas adicionadas pelo usuário, como `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`, recusam substituições que removeriam entradas existentes, a menos que você passe `--replace`.
</Note>

Use `--merge` ao adicionar entradas a esses mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` somente quando você quiser intencionalmente que o valor fornecido se torne o valor completo de destino.

## Modos de `config set`

`openclaw config set` aceita quatro estilos de atribuição:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    O modo construtor de provedor mira apenas caminhos `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
Atribuições SecretRef são rejeitadas em superfícies runtime-mutáveis incompatíveis (por exemplo, `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculação de threads do Discord e JSON de credenciais do WhatsApp). Consulte [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Warning>

A análise em lote sempre usa o payload de lote (`--batch-json`/`--batch-file`) como fonte da verdade. `--strict-json` / `--json` não alteram o comportamento de análise em lote.

## `config patch`

Use `config patch` quando quiser colar ou encaminhar por pipe um patch com formato de configuração em vez de executar muitos comandos `config set` baseados em caminho. A entrada é um objeto JSON5. Objetos são mesclados recursivamente, arrays e valores escalares substituem o valor de destino, e `null` exclui o caminho de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Você também pode encaminhar um patch por stdin, o que é útil para scripts de configuração remota:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Exemplo de patch:

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

Use `--replace-path <path>` quando um objeto ou array precisar se tornar exatamente o valor fornecido em vez de ser aplicado como patch recursivamente:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` executa verificações de esquema e de resolubilidade de SecretRef sem gravar. SecretRefs baseados em exec são ignorados por padrão durante o dry-run; adicione `--allow-exec` quando quiser intencionalmente que o dry-run execute comandos de provedor.

O modo caminho/valor JSON continua compatível tanto para SecretRefs quanto para provedores:

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
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetível)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (obrigatório)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

Exemplo de provedor exec reforçado:

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

Use `--dry-run` para validar alterações sem gravar `openclaw.json`.

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
  <Accordion title="Dry-run behavior">
    - Modo construtor: executa verificações de resolubilidade de SecretRef para refs/provedores alterados.
    - Modo JSON (`--strict-json`, `--json` ou modo em lote): executa validação de esquema e verificações de resolubilidade de SecretRef.
    - A validação de política também é executada para superfícies de destino SecretRef incompatíveis conhecidas.
    - As verificações de política avaliam a configuração completa após a alteração, portanto gravações de objeto pai (por exemplo, definir `hooks` como um objeto) não conseguem contornar a validação de superfície incompatível.
    - Verificações de SecretRef exec são ignoradas por padrão durante dry-run para evitar efeitos colaterais de comando.
    - Use `--allow-exec` com `--dry-run` para optar por verificações de SecretRef exec (isso pode executar comandos de provedor).
    - `--allow-exec` é somente para dry-run e gera erro se usado sem `--dry-run`.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` imprime um relatório legível por máquina:

    - `ok`: se o dry-run passou
    - `operations`: número de atribuições avaliadas
    - `checks`: se verificações de esquema/resolubilidade foram executadas
    - `checks.resolvabilityComplete`: se as verificações de resolubilidade foram executadas até a conclusão (false quando refs exec são ignoradas)
    - `refsChecked`: número de refs realmente resolvidas durante o dry-run
    - `skippedExecRefs`: número de refs exec ignoradas porque `--allow-exec` não foi definido
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
    - `config schema validation failed`: o formato da configuração após a alteração é inválido; corrija o caminho/valor ou o formato do objeto de provedor/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: mova essa credencial de volta para entrada de texto simples/string e mantenha SecretRefs apenas em superfícies compatíveis.
    - `SecretRef assignment(s) could not be resolved`: o provedor/ref referenciado não pode ser resolvido no momento (variável de ambiente ausente, ponteiro de arquivo inválido, falha do provedor exec ou incompatibilidade entre provedor/origem).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: o dry-run ignorou refs exec; execute novamente com `--allow-exec` se precisar validar a resolubilidade exec.
    - Para o modo em lote, corrija as entradas com falha e execute `--dry-run` novamente antes de gravar.

  </Accordion>
</AccordionGroup>

## Segurança de gravação

`openclaw config set` e outros gravadores de configuração de propriedade do OpenClaw validam toda a configuração após a alteração antes de gravá-la em disco. Se o novo payload falhar na validação de esquema ou parecer uma sobrescrita destrutiva, a configuração ativa é preservada e o payload rejeitado é salvo ao lado dela como `openclaw.json.rejected.*`.

<Warning>
O caminho da configuração ativa deve ser um arquivo regular. Layouts de `openclaw.json` com symlink não são compatíveis para gravações; use `OPENCLAW_CONFIG_PATH` para apontar diretamente para o arquivo real.
</Warning>

Prefira gravações pela CLI para pequenas edições:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se uma gravação for rejeitada, inspecione o payload salvo e corrija o formato completo da configuração:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Gravações diretas pelo editor ainda são permitidas, mas o Gateway em execução as trata como não confiáveis até que sejam validadas. Edições diretas inválidas podem ser restauradas a partir do último backup conhecido como bom durante a inicialização ou o hot reload. Consulte [solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-restored-last-known-good-config).

A recuperação do arquivo inteiro é reservada para configurações globalmente quebradas, como erros de análise, falhas de esquema no nível raiz, falhas de migração legada ou falhas mistas de Plugin e raiz. Se a validação falhar apenas em `plugins.entries.<id>...`, o OpenClaw mantém o `openclaw.json` ativo no lugar e relata o problema local do Plugin em vez de restaurar `.last-good`. Isso impede que alterações de esquema do Plugin ou divergências de `minHostVersion` revertam configurações não relacionadas do usuário, como modelos, provedores, perfis de autenticação, canais, exposição do Gateway, ferramentas, memória, navegador ou configuração de cron.

## Subcomandos

- `config file`: Imprime o caminho do arquivo de configuração ativo (resolvido a partir de `OPENCLAW_CONFIG_PATH` ou do local padrão). O caminho deve apontar para um arquivo regular, não para um symlink.

Reinicie o Gateway após as edições.

## Validar

Valide a configuração atual em relação ao esquema ativo sem iniciar o Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Depois que `openclaw config validate` estiver passando, você pode usar a TUI local para que um agente incorporado compare a configuração ativa com a documentação enquanto você valida cada alteração no mesmo terminal:

<Note>
Se a validação já estiver falhando, comece com `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` não ignora a proteção contra configuração inválida.
</Note>

```bash
openclaw chat
```

Então, dentro da TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Loop típico de reparo:

<Steps>
  <Step title="Compare with docs">
    Peça ao agente para comparar sua configuração atual com a página relevante da documentação e sugerir a menor correção.
  </Step>
  <Step title="Apply targeted edits">
    Aplique edições direcionadas com `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Re-validate">
    Execute `openclaw config validate` novamente após cada alteração.
  </Step>
  <Step title="Doctor for runtime issues">
    Se a validação passar, mas o runtime ainda não estiver íntegro, execute `openclaw doctor` ou `openclaw doctor --fix` para obter ajuda com migração e reparo.
  </Step>
</Steps>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Configuração](/pt-BR/gateway/configuration)
