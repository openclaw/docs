---
read_when:
    - Você quer ler ou editar a configuração de forma não interativa
sidebarTitle: Config
summary: Referência da CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuração
x-i18n:
    generated_at: "2026-07-16T12:19:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Helpers não interativos para `openclaw.json`: obter/definir/aplicar patch/remover um valor por caminho, imprimir o esquema, validar ou imprimir o caminho do arquivo ativo. Execute `openclaw config` sem subcomando para abrir o mesmo assistente guiado de `openclaw configure`.

<Note>
Quando `OPENCLAW_NIX_MODE=1`, o OpenClaw trata `openclaw.json` como imutável. Os comandos somente leitura (`config get`, `config file`, `config schema`, `config validate`) continuam funcionando; os comandos que gravam a configuração se recusam a fazê-lo. Em vez disso, edite a fonte Nix da instalação; para a distribuição própria nix-openclaw, use o [Início rápido do nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) e defina os valores em `programs.openclaw.config` ou `instances.<name>.config`.
</Note>

## Opções raiz

<ParamField path="--section <section>" type="string">
  Filtro repetível de seção da configuração guiada ao executar `openclaw config` sem um subcomando.
</ParamField>

Seções guiadas: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Caminhos

Notação de ponto ou colchetes. Coloque os caminhos com colchetes entre aspas nos exemplos de shell para que o zsh não expanda `[0]` como glob:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Lê um valor do snapshot de configuração com dados sensíveis ocultados (segredos nunca são impressos). `--json` imprime o valor bruto como JSON; caso contrário, strings/números/booleanos são impressos sem formatação adicional, e objetos/arrays são impressos como JSON formatado.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Imprime o caminho do arquivo de configuração ativo, resolvido a partir de `OPENCLAW_CONFIG_PATH` ou do local padrão. O caminho identifica um arquivo comum, não um link simbólico; consulte [Segurança de gravação](#write-safety).

### `config schema`

Imprime em stdout o esquema JSON gerado para `openclaw.json`.

<AccordionGroup>
  <Accordion title="O que está incluído">
    - O esquema de configuração raiz atual, além de um campo de string raiz `$schema` para ferramentas de edição.
    - Metadados de documentação dos campos `title` / `description` usados pela Control UI.
    - Nós de objetos aninhados, curingas (`*`) e itens de array (`[]`) herdam os mesmos metadados `title` / `description` quando há documentação correspondente para os campos.
    - As ramificações `anyOf` / `oneOf` / `allOf` também herdam os mesmos metadados de documentação.
    - Metadados de esquema de plugins + canais ativos, em caráter de melhor esforço, quando os manifestos de runtime podem ser carregados.
    - Um esquema alternativo limpo mesmo quando a configuração atual é inválida.

  </Accordion>
  <Accordion title="RPC de runtime relacionado">
    `config.schema.lookup` retorna um caminho de configuração normalizado com um nó de esquema superficial (`title`, `description`, `type`, `enum`, `const`, limites comuns), metadados correspondentes de dicas de UI e resumos dos filhos imediatos. Use-o para detalhamento com escopo de caminho na Control UI ou em clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Valida a configuração atual em relação ao esquema ativo sem iniciar o Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Se a validação já estiver falhando, comece com `openclaw configure` ou `openclaw doctor --fix`. `openclaw chat` não ignora a proteção contra configuração inválida.
</Note>

## Valores

Os valores são analisados como JSON5 quando possível; caso contrário, são tratados como strings brutas. Use `--strict-json` para exigir JSON padrão sem fallback para string (nesse caso, sintaxe exclusiva de JSON5, como comentários, vírgulas finais ou chaves sem aspas, é rejeitada). `--json` é um alias legado de `--strict-json` em `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime o valor bruto como JSON em vez de texto formatado para o terminal.

<Note>
Por padrão, a atribuição de objeto substitui o caminho de destino. Caminhos protegidos que normalmente contêm entradas adicionadas pelo usuário recusam substituições que removeriam entradas existentes, a menos que seja passado `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` e `auth.profiles`.
</Note>

Use `--merge` ao adicionar entradas a esses mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` somente quando o valor fornecido deva se tornar intencionalmente o valor completo do destino.

## Modos de `config set`

<Tabs>
  <Tab title="Modo de valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo do construtor SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo do construtor de provedor">
    Destina-se somente a caminhos `secrets.providers.<alias>`:

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
Atribuições de SecretRef são rejeitadas em superfícies mutáveis em runtime sem suporte (por exemplo, `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculação de threads do Discord e JSON de credenciais do WhatsApp). Consulte [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Warning>

A análise em lote sempre usa o payload do lote (`--batch-json`/`--batch-file`) como fonte da verdade; `--strict-json` / `--json` não alteram o comportamento da análise em lote.

O modo de caminho/valor JSON também funciona diretamente para SecretRefs e provedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Flags do construtor de provedor

Os destinos do construtor de provedor devem usar `secrets.providers.<alias>` como caminho.

<AccordionGroup>
  <Accordion title="Flags comuns">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Provedor de ambiente (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetível)

  </Accordion>
  <Accordion title="Provedor de arquivo (--provider-source file)">
    - `--provider-path <path>` (obrigatório)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Provedor de execução (--provider-source exec)">
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

Exemplo de provedor de execução reforçado:

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

Cole ou encaminhe por pipe um patch JSON5 com formato de configuração em vez de executar muitos comandos `config set` baseados em caminho. Objetos são mesclados recursivamente; arrays e valores escalares substituem o destino; `null` exclui o caminho de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Encaminhe um patch pela entrada padrão para scripts de configuração remota:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Use `--replace-path <path>` quando um objeto ou array precisar se tornar exatamente o valor fornecido, em vez de receber um patch recursivo:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` executa verificações de esquema e resolubilidade de SecretRef sem gravar. SecretRefs baseadas em execução são ignoradas por padrão durante a simulação; adicione `--allow-exec` quando quiser intencionalmente que a simulação execute comandos do provedor.

## Simulação

`--dry-run` valida as alterações sem gravar `openclaw.json`. Disponível em `config set`, `config patch` e `config unset`.

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
  <Accordion title="Comportamento da simulação">
    - Modo builder: executa verificações de resolução de SecretRef para refs/provedores alterados.
    - Modo JSON (`--strict-json`, `--json` ou modo em lote): executa a validação do esquema e as verificações de resolução de SecretRef.
    - A validação de política é executada na configuração completa após a alteração, portanto gravações no objeto pai (por exemplo, definir `hooks` como um objeto) não podem contornar a validação de superfícies não compatíveis.
    - As verificações de SecretRef do tipo exec são ignoradas por padrão para evitar efeitos colaterais de comandos; passe `--allow-exec` para habilitá-las (isso pode executar comandos do provedor). `--allow-exec` funciona somente em simulação e gera erro sem `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    - `ok`: se a simulação foi aprovada
    - `operations`: número de atribuições avaliadas
    - `checks`: se as verificações de esquema/resolução foram executadas
    - `checks.resolvabilityComplete`: se as verificações de resolução foram executadas até a conclusão (falso quando refs do tipo exec são ignoradas)
    - `refsChecked`: número de refs efetivamente resolvidas durante a simulação
    - `skippedExecRefs`: número de refs do tipo exec ignoradas porque `--allow-exec` não foi definido
    - `errors`: falhas estruturadas de caminho ausente, esquema ou resolução quando `ok=false`

  </Accordion>
</AccordionGroup>

### Estrutura da saída JSON

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
      ref?: string, // presente para erros de resolução
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
          "message": "Erro: a variável de ambiente \"MISSING_TEST_SECRET\" não está definida.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Se a simulação falhar">
    - `config schema validation failed`: a estrutura da configuração após a alteração é inválida; corrija o caminho/valor ou a estrutura do objeto de provedor/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: mova essa credencial de volta para uma entrada de texto simples/string; mantenha SecretRefs somente nas superfícies compatíveis.
    - `SecretRef assignment(s) could not be resolved`: o provedor/ref referenciado não pode ser resolvido no momento (variável de ambiente ausente, ponteiro de arquivo inválido, falha do provedor exec ou incompatibilidade entre provedor e origem).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: execute novamente com `--allow-exec` se precisar validar a resolução de exec.
    - No modo em lote, corrija as entradas com falha e execute `--dry-run` novamente antes de gravar.

  </Accordion>
</AccordionGroup>

## Aplicação das alterações

Após cada `config set` / `config patch` / `config unset` bem-sucedido, a CLI exibe uma de três dicas para indicar se o Gateway precisa ser reiniciado:

| Dica                                                | Significado                                       |
| --------------------------------------------------- | ------------------------------------------------- |
| `Restart the gateway to apply.`                     | O caminho alterado exige uma reinicialização completa. |
| `Change will apply without restarting the gateway.` | O recarregamento dinâmico o detecta automaticamente.   |
| `No gateway restart needed.`                        | Nada relevante para o runtime foi alterado.             |

Gravações em `plugins.entries` (ou qualquer subcaminho) sempre exigem reinicialização, pois a CLI não pode comprovar que os metadados de recarregamento de todos os plugins estejam carregados.

## Segurança de gravação

`openclaw config set` e outros gravadores de configuração pertencentes ao OpenClaw validam a configuração completa após a alteração antes de gravá-la no disco. Se a nova carga falhar na validação do esquema ou parecer uma sobrescrita destrutiva, a configuração ativa permanece intacta e a carga rejeitada é salva ao lado dela como `openclaw.json.rejected.*`.

As gravações pertencentes ao OpenClaw serializam novamente o JSON5 como JSON padrão. Quando a origem contém comentários, o gravador emite um aviso imediatamente antes de removê-los; use um editor diretamente quando for importante preservar os comentários.

<Warning>
O caminho da configuração ativa deve ser um arquivo comum. Estruturas de `openclaw.json` com links simbólicos não são compatíveis com gravações; use `OPENCLAW_CONFIG_PATH` para apontar diretamente para o arquivo real.
</Warning>

Prefira gravações pela CLI para pequenas edições:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se uma gravação for rejeitada, inspecione a carga salva e corrija a estrutura completa da configuração:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Gravações diretas com um editor continuam permitidas, mas o Gateway em execução as trata como não confiáveis até que sejam validadas. Edições diretas inválidas impedem a inicialização ou são ignoradas pelo recarregamento dinâmico; o Gateway não regrava `openclaw.json`. Execute `openclaw doctor --fix` para reparar uma configuração prefixada/sobrescrita ou restaurar a última cópia válida conhecida. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config).

A recuperação do arquivo inteiro é reservada para reparos pelo doctor. Alterações no esquema de plugins ou divergências de `minHostVersion` permanecem explícitas em vez de reverter configurações não relacionadas do usuário, como modelos, provedores, perfis de autenticação, canais, exposição do Gateway, ferramentas, memória, navegador ou configuração do cron.

## Ciclo de reparo

Depois que `openclaw config validate` for aprovado, use a TUI local para que um agente incorporado compare a configuração ativa com a documentação enquanto cada alteração é validada no mesmo terminal:

```bash
openclaw chat
```

Dentro da TUI, um `!` inicial executa um comando literal no shell local (após uma solicitação de confirmação única por sessão):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Comparar com a documentação">
    Peça ao agente para comparar a configuração atual com a página relevante da documentação e sugerir a menor correção.
  </Step>
  <Step title="Aplicar edições específicas">
    Aplique edições específicas com `openclaw config set` ou `openclaw configure`.
  </Step>
  <Step title="Validar novamente">
    Execute `openclaw config validate` novamente após cada alteração.
  </Step>
  <Step title="Usar o doctor para problemas de runtime">
    Se a validação for aprovada, mas o runtime ainda apresentar problemas, execute `openclaw doctor` ou `openclaw doctor --fix` para obter ajuda com migração e reparo.
  </Step>
</Steps>

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Configuração](/pt-BR/gateway/configuration)
