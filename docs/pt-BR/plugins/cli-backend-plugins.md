---
read_when:
    - Você está criando um Plugin de backend de CLI de IA local
    - Você quer registrar um backend para referências de modelo como acme-cli/model
    - Você precisa mapear uma CLI de terceiros para o executor de fallback de texto do OpenClaw
sidebarTitle: CLI backend plugins
summary: Crie um Plugin que registre um backend local de CLI de IA
title: Criando plugins de backend de CLI
x-i18n:
    generated_at: "2026-05-07T13:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Os plugins de backend CLI permitem que o OpenClaw chame uma CLI de IA local como um backend de inferência de texto. O backend aparece como um prefixo de provedor em refs de modelo:

```text
acme-cli/acme-large
```

Use um backend CLI quando a integração upstream já estiver exposta como um comando local, quando a CLI possuir o estado de login local ou quando a CLI for uma alternativa útil caso provedores de API estejam indisponíveis.

<Info>
  Se o serviço upstream expõe uma API HTTP normal de modelo, escreva um
  [Plugin de provedor](/pt-BR/plugins/sdk-provider-plugins) em vez disso. Se o runtime
  upstream possui sessões completas de agente, eventos de ferramenta, Compaction
  ou estado de tarefas em segundo plano, use um [harness de agente](/pt-BR/plugins/sdk-agent-harness).
</Info>

## O que o Plugin possui

Um Plugin de backend CLI tem três contratos:

| Contrato              | Arquivo                | Finalidade                                                |
| --------------------- | ---------------------- | --------------------------------------------------------- |
| Entrada do pacote     | `package.json`         | Aponta o OpenClaw para o módulo de runtime do Plugin      |
| Propriedade do manifesto | `openclaw.plugin.json` | Declara o id do backend antes do carregamento do runtime |
| Registro em runtime   | `index.ts`             | Chama `api.registerCliBackend(...)` com padrões de comando |

O manifesto é metadado de descoberta. Ele não executa a CLI e não registra comportamento em runtime. O comportamento em runtime começa quando a entrada do Plugin chama `api.registerCliBackend(...)`.

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

    Pacotes publicados devem enviar arquivos JavaScript de runtime compilados. Se a entrada de origem for `./src/index.ts`, adicione `openclaw.runtimeExtensions` apontando para o par JavaScript compilado. Consulte [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

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

    `cliBackends` é a lista de propriedade em runtime. Ela permite que o OpenClaw carregue automaticamente o Plugin quando a configuração ou a seleção de modelo mencionar `acme-cli/...`.

    `setup.cliBackends` é a superfície de configuração orientada primeiro por descritor. Adicione-a quando descoberta de modelo, onboarding ou status devem reconhecer o backend sem carregar o runtime do Plugin. Use `requiresRuntime: false` somente quando esses descritores estáticos forem suficientes para a configuração.

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

    O id do backend deve corresponder à entrada `cliBackends` do manifesto. O `config` registrado é apenas o padrão; a configuração do usuário em `agents.defaults.cliBackends.acme-cli` é mesclada sobre ele em runtime.

  </Step>
</Steps>

## Formato da configuração

`CliBackendConfig` descreve como o OpenClaw deve iniciar e analisar a CLI:

| Campo                                     | Uso                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nome do binário ou caminho absoluto do comando              |
| `args`                                    | argv base para execuções novas                              |
| `resumeArgs`                              | argv alternativa para sessões retomadas; aceita `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` ou `text`                           |
| `input`                                   | Transporte do prompt: `arg` ou `stdin`                      |
| `modelArg`                                | Flag usada antes do id do modelo                            |
| `modelAliases`                            | Mapeia ids de modelo do OpenClaw para ids nativos da CLI    |
| `sessionArg` / `sessionArgs`              | Como passar um id de sessão                                 |
| `sessionMode`                             | `always`, `existing` ou `none`                              |
| `sessionIdFields`                         | Campos JSON que o OpenClaw lê da saída da CLI               |
| `systemPromptArg` / `systemPromptFileArg` | Transporte do prompt de sistema                             |
| `systemPromptWhen`                        | `first`, `always` ou `never`                                |
| `imageArg` / `imageMode`                  | Suporte a caminho de imagem                                 |
| `serialize`                               | Mantém execuções do mesmo backend ordenadas                 |
| `reliability.watchdog`                    | Ajuste de timeout sem saída                                 |

Prefira a menor configuração estática que corresponda à CLI. Adicione callbacks do Plugin somente para comportamentos que realmente pertencem ao backend.

## Hooks avançados de backend

`CliBackendPlugin` também pode definir:

| Hook                               | Uso                                                    |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | Reescreve configuração legada do usuário após a mesclagem |
| `resolveExecutionArgs(ctx)`        | Adiciona flags com escopo da solicitação, como esforço de raciocínio |
| `prepareExecution(ctx)`            | Cria pontes temporárias de autenticação ou configuração antes da inicialização |
| `transformSystemPrompt(ctx)`       | Aplica uma transformação final específica da CLI ao prompt de sistema |
| `textTransforms`                   | Substituições bidirecionais de prompt/saída            |
| `defaultAuthProfileId`             | Prefere um perfil de autenticação específico do OpenClaw |
| `authEpochMode`                    | Decide como mudanças de autenticação invalidam sessões CLI armazenadas |
| `nativeToolMode`                   | Declara se a CLI tem ferramentas nativas sempre ativas |
| `bundleMcp` / `bundleMcpMode`      | Opta por usar a ponte de ferramentas MCP de loopback do OpenClaw |

Mantenha esses hooks pertencentes ao provedor. Não adicione ramificações específicas de CLI ao core quando um hook de backend puder expressar o comportamento.

## Ponte de ferramentas MCP

Backends CLI não recebem ferramentas do OpenClaw por padrão. Se a CLI puder consumir uma configuração MCP, opte explicitamente:

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
| `codex-config-overrides` | CLIs que aceitam substituições de configuração em argv           |
| `gemini-system-settings` | CLIs que leem configurações MCP do diretório de configurações do sistema |

Habilite a ponte somente quando a CLI puder realmente consumi-la. Se a CLI tiver sua própria camada de ferramentas integrada que não pode ser desabilitada, defina `nativeToolMode:
"always-on"` para que o OpenClaw possa falhar fechado quando um chamador exigir ausência de ferramentas nativas.

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

Documente a substituição mínima de que os usuários provavelmente precisarão. Normalmente, é apenas `command` quando o binário está fora de `PATH`.

## Verificação

Para plugins empacotados, adicione um teste focado no builder e no registro de configuração, depois execute a faixa de testes direcionada do Plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locais ou instalados, verifique a descoberta e uma execução real de modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Se o backend for compatível com imagens ou MCP, adicione uma fumaça ao vivo que comprove esses caminhos com a CLI real. Não dependa de inspeção estática para comportamento de prompt, imagem, MCP ou retomada de sessão.

## Checklist

<Check>`package.json` tem `openclaw.extensions` e entradas de runtime compiladas para pacotes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` e `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente quando configuração/descoberta de modelo deve ver o backend a frio</Check>
<Check>`api.registerCliBackend(...)` usa o mesmo id de backend que o manifesto</Check>
<Check>Substituições do usuário em `agents.defaults.cliBackends.<id>` ainda vencem</Check>
<Check>Configurações de sessão, prompt de sistema, imagem e parser de saída correspondem ao contrato real da CLI</Check>
<Check>Testes direcionados e ao menos uma fumaça CLI ao vivo comprovam o caminho do backend</Check>

## Relacionados

- [Backends CLI](/pt-BR/gateway/cli-backends) - configuração do usuário e comportamento em runtime
- [Criação de plugins](/pt-BR/plugins/building-plugins) - fundamentos de pacote e manifesto
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview) - referência da API de registro
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - `cliBackends` e descritores de configuração
- [Harness de agente](/pt-BR/plugins/sdk-agent-harness) - runtimes completos de agente externo
