---
read_when:
    - Você quer ler ou editar a configuração de forma não interativa
sidebarTitle: Config
summary: Referência da CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuração
x-i18n:
    generated_at: "2026-05-06T17:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

Auxiliares de configuração para edições não interativas em `openclaw.json`: obtenha/defina/aplique patch/remova/arquivo/esquema/valide valores por caminho e imprima o arquivo de configuração ativo. Execute sem um subcomando para abrir o assistente de configuração (igual a `openclaw configure`).

<Note>
Quando `OPENCLAW_NIX_MODE=1`, o OpenClaw trata `openclaw.json` como imutável. Comandos somente leitura, como `config get`, `config file`, `config schema` e `config validate`, ainda funcionam, mas gravadores de configuração recusam alterações. Em vez disso, agentes devem editar a origem Nix da instalação; para a distribuição nix-openclaw oficial, use [Início Rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) e defina valores em `programs.openclaw.config` ou `instances.<name>.config`.
</Note>

## Opções raiz

<ParamField path="--section <section>" type="string">
  Filtro repetível de seção de configuração guiada quando você executa `openclaw config` sem um subcomando.
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
  <Accordion title="O que ele inclui">
    - O esquema de configuração raiz atual, além de um campo de string `$schema` raiz para ferramentas de editor.
    - Metadados de documentação `title` e `description` de campos usados pela UI de Controle.
    - Nós de objeto aninhado, curinga (`*`) e item de array (`[]`) herdam os mesmos metadados `title` / `description` quando existir documentação de campo correspondente.
    - Ramificações `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação quando existir documentação de campo correspondente.
    - Metadados de esquema de Plugin + canal em tempo real, em melhor esforço, quando os manifestos de runtime puderem ser carregados.
    - Um esquema alternativo limpo mesmo quando a configuração atual é inválida.

  </Accordion>
  <Accordion title="RPC de runtime relacionado">
    `config.schema.lookup` retorna um caminho de configuração normalizado com um nó de esquema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns), metadados de dica de UI correspondentes e resumos dos filhos imediatos. Use para detalhamento com escopo por caminho na UI de Controle ou em clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Redirecione para um arquivo quando quiser inspecionar ou validar com outras ferramentas:

```bash
openclaw config schema > openclaw.schema.json
```

### Caminhos

Caminhos usam notação por ponto ou colchetes:

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

Valores são analisados como JSON5 quando possível; caso contrário, são tratados como strings. Use `--strict-json` para exigir análise como JSON5. `--json` continua compatível como alias legado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime o valor bruto como JSON em vez de texto formatado para terminal.

<Note>
A atribuição de objeto substitui o caminho de destino por padrão. Caminhos protegidos de mapa/lista que normalmente mantêm entradas adicionadas pelo usuário, como `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`, recusam substituições que removeriam entradas existentes, a menos que você passe `--replace`.
</Note>

Use `--merge` ao adicionar entradas a esses mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` somente quando você intencionalmente quiser que o valor fornecido se torne o valor de destino completo.

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
Atribuições SecretRef são rejeitadas em superfícies mutáveis em runtime sem suporte (por exemplo, `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculação de threads do Discord e JSON de credenciais do WhatsApp). Consulte [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Warning>

A análise em lote sempre usa o payload em lote (`--batch-json`/`--batch-file`) como fonte da verdade. `--strict-json` / `--json` não alteram o comportamento de análise em lote.

## `config patch`

Use `config patch` quando quiser colar ou enviar por pipe um patch com formato de configuração em vez de executar muitos comandos `config set` baseados em caminho. A entrada é um objeto JSON5. Objetos são mesclados recursivamente, arrays e valores escalares substituem o valor de destino, e `null` exclui o caminho de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Você também pode enviar um patch por pipe via stdin, o que é útil para scripts de configuração remota:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Patch de exemplo:

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

Use `--replace-path <path>` quando um objeto ou array deve se tornar exatamente o valor fornecido em vez de receber patch recursivo:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` executa verificações de esquema e resolubilidade de SecretRef sem gravar. SecretRefs baseadas em exec são ignoradas por padrão durante dry-run; adicione `--allow-exec` quando você intencionalmente quiser que o dry-run execute comandos de provedor.

O modo de caminho/valor JSON continua compatível tanto para SecretRefs quanto para provedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flags de construtor de provedor

Destinos de construtor de provedor devem usar `secrets.providers.<alias>` como caminho.

<AccordionGroup>
  <Accordion title="Flags comuns">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Provedor de env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetível)

  </Accordion>
  <Accordion title="Provedor de arquivo (--provider-source file)">
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
  <Accordion title="Comportamento de dry-run">
    - Modo construtor: executa verificações de resolubilidade de SecretRef para refs/provedores alterados.
    - Modo JSON (`--strict-json`, `--json` ou modo em lote): executa validação de esquema mais verificações de resolubilidade de SecretRef.
    - A validação de política também é executada para superfícies de destino SecretRef conhecidas sem suporte.
    - Verificações de política avaliam a configuração completa pós-alteração, então gravações de objeto pai (por exemplo, definir `hooks` como objeto) não podem contornar a validação de superfície sem suporte.
    - Verificações de SecretRef exec são ignoradas por padrão durante dry-run para evitar efeitos colaterais de comandos.
    - Use `--allow-exec` com `--dry-run` para optar por verificações de SecretRef exec (isso pode executar comandos de provedor).
    - `--allow-exec` é somente para dry-run e gera erro se usado sem `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    `--dry-run --json` imprime um relatório legível por máquina:

    - `ok`: se o dry-run passou
    - `operations`: número de atribuições avaliadas
    - `checks`: se as verificações de schema/resolubilidade foram executadas
    - `checks.resolvabilityComplete`: se as verificações de resolubilidade foram executadas até o fim (false quando refs exec são ignoradas)
    - `refsChecked`: número de refs realmente resolvidas durante o dry-run
    - `skippedExecRefs`: número de refs exec ignoradas porque `--allow-exec` não foi definido
    - `errors`: falhas estruturadas de schema/resolubilidade quando `ok=false`

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
  <Accordion title="Se o dry-run falhar">
    - `config schema validation failed`: o formato da sua configuração após a alteração é inválido; corrija o caminho/valor ou o formato do objeto de provedor/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: mova essa credencial de volta para entrada em texto simples/string e mantenha SecretRefs apenas nas superfícies compatíveis.
    - `SecretRef assignment(s) could not be resolved`: o provedor/ref referenciado atualmente não pode ser resolvido (variável de ambiente ausente, ponteiro de arquivo inválido, falha do provedor exec ou incompatibilidade de provedor/origem).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: o dry-run ignorou refs exec; execute novamente com `--allow-exec` se precisar da validação de resolubilidade de exec.
    - Para modo em lote, corrija as entradas com falha e execute `--dry-run` novamente antes de gravar.

  </Accordion>
</AccordionGroup>

## Segurança de gravação

`openclaw config set` e outros gravadores de configuração pertencentes ao OpenClaw validam a configuração completa após a alteração antes de salvá-la em disco. Se o novo payload falhar na validação de schema ou parecer uma substituição destrutiva, a configuração ativa é deixada intacta e o payload rejeitado é salvo ao lado dela como `openclaw.json.rejected.*`.

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

Gravações diretas pelo editor ainda são permitidas, mas o Gateway em execução as trata como não confiáveis até que sejam validadas. Edições diretas inválidas impedem a inicialização ou são ignoradas pelo hot reload; o Gateway não reescreve `openclaw.json`. Execute `openclaw doctor --fix` para reparar configurações prefixadas/sobrescritas ou restaurar a última cópia válida conhecida. Consulte [solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config).

A recuperação do arquivo inteiro é reservada para reparo pelo doctor. Alterações de schema de Plugin ou divergência de `minHostVersion` permanecem explícitas em vez de reverter configurações não relacionadas do usuário, como modelos, provedores, perfis de autenticação, canais, exposição do Gateway, ferramentas, memória, navegador ou configuração de cron.

## Subcomandos

- `config file`: Imprime o caminho do arquivo de configuração ativa (resolvido a partir de `OPENCLAW_CONFIG_PATH` ou do local padrão). O caminho deve nomear um arquivo regular, não um symlink.

Reinicie o gateway após as edições.

## Validar

Valide a configuração atual em relação ao schema ativo sem iniciar o gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Depois que `openclaw config validate` estiver passando, você poderá usar a TUI local para que um agente incorporado compare a configuração ativa com a documentação enquanto você valida cada alteração no mesmo terminal:

<Note>
Se a validação já estiver falhando, comece com `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` não ignora a proteção de configuração inválida.
</Note>

```bash
openclaw chat
```

Em seguida, dentro da TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Loop de reparo típico:

<Steps>
  <Step title="Comparar com a documentação">
    Peça ao agente para comparar sua configuração atual com a página relevante da documentação e sugerir a menor correção.
  </Step>
  <Step title="Aplicar edições direcionadas">
    Aplique edições direcionadas com `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Validar novamente">
    Execute `openclaw config validate` novamente após cada alteração.
  </Step>
  <Step title="Doctor para problemas de runtime">
    Se a validação passar, mas o runtime ainda estiver com problemas, execute `openclaw doctor` ou `openclaw doctor --fix` para obter ajuda com migração e reparo.
  </Step>
</Steps>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Configuração](/pt-BR/gateway/configuration)
