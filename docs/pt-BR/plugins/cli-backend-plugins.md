---
read_when:
    - Você está criando um Plugin de backend de CLI de IA local
    - Você quer registrar um backend para referências de modelo como acme-cli/model
    - Você precisa mapear uma CLI de terceiros para o executor de fallback de texto do OpenClaw
sidebarTitle: CLI backend plugins
summary: Crie um plugin que registra um backend de CLI de IA local
title: Criando plugins de backend da CLI
x-i18n:
    generated_at: "2026-06-27T17:44:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugins de backend de CLI permitem que o OpenClaw chame uma CLI de IA local como um
backend de inferência de texto. O backend aparece como um prefixo de provedor em refs de modelo:

```text
acme-cli/acme-large
```

Use um backend de CLI quando a integração upstream já estiver exposta como um
comando local, quando a CLI for proprietária do estado de login local, ou quando a CLI for um
fallback útil se os provedores de API estiverem indisponíveis.

<Info>
  Se o serviço upstream expuser uma API de modelo HTTP normal, escreva um
  [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins). Se o runtime upstream
  possuir sessões completas de agente, eventos de ferramenta, compaction ou estado de
  tarefas em segundo plano, use um [harness de agente](/pt-BR/plugins/sdk-agent-harness).
</Info>

## O que o plugin possui

Um plugin de backend de CLI tem três contratos:

| Contrato             | Arquivo                | Finalidade                                                |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entrada do pacote    | `package.json`         | Aponta o OpenClaw para o módulo de runtime do plugin      |
| Propriedade do manifesto | `openclaw.plugin.json` | Declara o id do backend antes do carregamento do runtime |
| Registro do runtime  | `index.ts`             | Chama `api.registerCliBackend(...)` com padrões de comando |

O manifesto é metadado de descoberta. Ele não executa a CLI e não
registra comportamento de runtime. O comportamento de runtime começa quando a entrada do plugin chama
`api.registerCliBackend(...)`.

## Plugin de backend mínimo

<Steps>
  <Step title="Criar metadados do pacote">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Pacotes publicados devem enviar arquivos de runtime JavaScript compilados. Se sua entrada
    de código-fonte for `./src/index.ts`, adicione `openclaw.runtimeExtensions` apontando para
    o par JavaScript compilado. Consulte [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declarar propriedade do backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` é a lista de propriedade de runtime. Ela permite que o OpenClaw carregue automaticamente o
    plugin quando a configuração ou a seleção de modelo mencionar `acme-cli/...`.

    `setup.cliBackends` é a superfície de configuração descriptor-first. Adicione-a quando
    a descoberta de modelos, o onboarding ou o status devem reconhecer o backend sem
    carregar o runtime do plugin. Use `requiresRuntime: false` somente quando esses descritores estáticos
    forem suficientes para a configuração.

  </Step>

  <Step title="Registrar o backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    O id do backend deve corresponder à entrada `cliBackends` do manifesto. A
    `config` registrada é apenas o padrão; a configuração do usuário em
    `agents.defaults.cliBackends.acme-cli` é mesclada sobre ela em runtime.

  </Step>
</Steps>

## Formato da configuração

`CliBackendConfig` descreve como o OpenClaw deve iniciar e analisar a CLI:

| Campo                                     | Uso                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nome do binário ou caminho absoluto do comando              |
| `args`                                    | argv base para execuções novas                              |
| `resumeArgs`                              | argv alternativo para sessões retomadas; aceita `{sessionId}` |
| `output` / `resumeOutput`                 | Analisador: `json`, `jsonl` ou `text`                       |
| `input`                                   | Transporte do prompt: `arg` ou `stdin`                      |
| `modelArg`                                | Flag usada antes do id do modelo                            |
| `modelAliases`                            | Mapeia ids de modelo do OpenClaw para ids nativos da CLI    |
| `sessionArg` / `sessionArgs`              | Como passar um id de sessão                                 |
| `sessionMode`                             | `always`, `existing` ou `none`                              |
| `sessionIdFields`                         | Campos JSON que o OpenClaw lê da saída da CLI               |
| `systemPromptArg` / `systemPromptFileArg` | Transporte do prompt do sistema                             |
| `systemPromptWhen`                        | `first`, `always` ou `never`                                |
| `imageArg` / `imageMode`                  | Suporte a caminho de imagem                                 |
| `serialize`                               | Mantém execuções do mesmo backend ordenadas                 |
| `reliability.watchdog`                    | Ajuste de timeout sem saída                                 |

Prefira a menor configuração estática que corresponda à CLI. Adicione callbacks de plugin
somente para comportamento que realmente pertence ao backend.

## Hooks avançados de backend

`CliBackendPlugin` também pode definir:

| Hook                               | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescrever configuração legada do usuário após a mesclagem                  |
| `resolveExecutionArgs(ctx)`        | Adicionar flags com escopo de solicitação, como esforço de raciocínio ou isolamento de pergunta lateral |
| `prepareExecution(ctx)`            | Criar pontes temporárias de autenticação ou configuração antes da inicialização |
| `transformSystemPrompt(ctx)`       | Aplicar uma transformação final de prompt do sistema específica da CLI      |
| `textTransforms`                   | Substituições bidirecionais de prompt/saída                                 |
| `defaultAuthProfileId`             | Preferir um perfil de autenticação específico do OpenClaw                   |
| `authEpochMode`                    | Decidir como alterações de autenticação invalidam sessões de CLI armazenadas |
| `nativeToolMode`                   | Declarar se a CLI tem ferramentas nativas sempre ativas                     |
| `sideQuestionToolMode`             | Declarar ferramentas nativas desativadas para perguntas laterais `/btw`     |
| `bundleMcp` / `bundleMcpMode`      | Optar pela ponte local loopback de ferramentas MCP do OpenClaw              |
| `ownsNativeCompaction`             | O backend possui sua própria compaction - o OpenClaw adia                  |

Mantenha esses hooks sob propriedade do provedor. Não adicione ramificações específicas de CLI ao núcleo quando um
hook de backend puder expressar o comportamento.

`ctx.executionMode` é `"agent"` para turnos normais e `"side-question"` para
chamadas efêmeras `/btw`. Use-o quando a CLI precisar de flags one-shot diferentes, como
desativar ferramentas nativas, persistência de sessão ou comportamento de retomada para BTW. Se um
backend normalmente tiver `nativeToolMode: "always-on"`, mas seu argv de pergunta lateral
desativar essas ferramentas de forma confiável, também defina `sideQuestionToolMode: "disabled"`;
caso contrário, o OpenClaw falha fechado quando BTW exige uma execução de CLI sem ferramentas.

### `ownsNativeCompaction`: optar por sair da compaction do OpenClaw

Se seu backend executa um agente que compacta sua **própria** transcrição, defina
`ownsNativeCompaction: true` para que o sumarizador de salvaguarda do OpenClaw nunca rode contra suas
sessões - o ciclo de vida de compaction da CLI retorna um no-op e o turno prossegue. `claude-cli`
declara isso porque o Claude Code compacta internamente sem endpoint de harness. Sessões de harness nativo,
como o Codex, continuam roteando para o endpoint de compaction do harness.

**Declare isso somente quando todos os itens a seguir forem verdadeiros**, ou uma sessão acima do orçamento adiada pode
permanecer acima do orçamento / ficar obsoleta (o OpenClaw não a resgata mais):

- o backend compacta ou limita sua própria transcrição de forma confiável à medida que se aproxima de sua janela;
- ele persiste uma sessão retomável para que o estado compactado sobreviva aos turnos
  (por exemplo, `--resume` / `--session-id`);
- ele não é uma sessão de compaction de harness nativo - sessões correspondentes a `agentHarnessId`
  são roteadas para o endpoint do harness.

## Ponte de ferramentas MCP

Backends de CLI não recebem ferramentas do OpenClaw por padrão. Se a CLI puder consumir uma
configuração MCP, opte explicitamente:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Os modos de ponte compatíveis são:

| Modo                     | Uso                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLIs que aceitam um arquivo de configuração MCP                  |
| `codex-config-overrides` | CLIs que aceitam substituições de configuração no argv           |
| `gemini-system-settings` | CLIs que leem configurações MCP do diretório de configurações do sistema |

Habilite a ponte somente quando a CLI puder realmente consumi-la. Se a CLI tiver sua
própria camada de ferramentas integrada que não pode ser desativada, defina `nativeToolMode:
"always-on"` para que o OpenClaw possa falhar fechado quando um chamador exigir nenhuma ferramenta nativa.

## Configuração do usuário

Usuários podem substituir qualquer padrão de backend:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documente a substituição mínima que os usuários provavelmente precisarão. Geralmente é apenas
`command` quando o binário está fora de `PATH`.

## Verificação

Para plugins empacotados, adicione um teste focado no builder e no registro
de configuração, depois execute a faixa de testes direcionada do plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locais ou instalados, verifique a descoberta e uma execução real de modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Se o backend oferecer suporte a imagens ou MCP, adicione um smoke test ao vivo que comprove esses caminhos
com a CLI real. Não dependa de inspeção estática para comportamento de prompt, imagem, MCP ou
retomada de sessão.

## Lista de verificação

<Check>`package.json` tem `openclaw.extensions` e entradas de runtime compiladas para pacotes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` e `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente quando a configuração/descoberta de modelo deve ver o backend frio</Check>
<Check>`api.registerCliBackend(...)` usa o mesmo ID de backend que o manifesto</Check>
<Check>As substituições do usuário em `agents.defaults.cliBackends.<id>` ainda prevalecem</Check>
<Check>As configurações de sessão, prompt de sistema, imagem e parser de saída correspondem ao contrato real da CLI</Check>
<Check>Testes direcionados e pelo menos um smoke test de CLI ao vivo comprovam o caminho do backend</Check>

## Relacionados

- [Backends de CLI](/pt-BR/gateway/cli-backends) - configuração do usuário e comportamento de runtime
- [Criando plugins](/pt-BR/plugins/building-plugins) - fundamentos de pacote e manifesto
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview) - referência da API de registro
- [Manifesto de Plugin](/pt-BR/plugins/manifest) - `cliBackends` e descritores de configuração
- [Harness de agente](/pt-BR/plugins/sdk-agent-harness) - runtimes completos de agente externo
