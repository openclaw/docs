---
read_when:
    - Você está criando um Plugin de backend local de IA para CLI
    - Você quer registrar um backend para referências de modelo como acme-cli/model
    - Você precisa mapear uma CLI de terceiros para o executor alternativo de texto do OpenClaw
sidebarTitle: CLI backend plugins
summary: Crie um plugin que registre um backend local de CLI de IA
title: Criando plugins de backend para a CLI
x-i18n:
    generated_at: "2026-07-12T00:05:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugins de backend de CLI permitem que o OpenClaw chame uma CLI de IA local como backend de inferência de texto. O backend aparece como um prefixo de provedor nas referências de modelo:

```text
acme-cli/acme-large
```

Use um backend de CLI quando a integração upstream já estiver disponível como um comando local, quando a CLI gerenciar o estado de login local ou como alternativa quando os provedores de API estiverem indisponíveis.

<Info>
  Se o serviço upstream disponibilizar uma API de modelo HTTP normal, crie um
  [Plugin de provedor](/pt-BR/plugins/sdk-provider-plugins). Se o runtime upstream
  gerenciar sessões completas de agentes, eventos de ferramentas, Compaction
  ou o estado de tarefas em segundo plano, use um
  [harness de agente](/pt-BR/plugins/sdk-agent-harness).
</Info>

## O que o Plugin gerencia

Um Plugin de backend de CLI tem três contratos:

| Contrato               | Arquivo                | Finalidade                                                        |
| ---------------------- | ---------------------- | ----------------------------------------------------------------- |
| Entrada do pacote      | `package.json`         | Direciona o OpenClaw ao módulo de runtime do Plugin               |
| Propriedade do manifesto | `openclaw.plugin.json` | Declara o ID do backend antes do carregamento do runtime          |
| Registro no runtime    | `index.ts`             | Chama `api.registerCliBackend(...)` com os padrões do comando     |

O manifesto contém metadados de descoberta: ele não executa a CLI nem registra comportamentos de runtime. O comportamento de runtime começa quando a entrada do Plugin chama `api.registerCliBackend(...)`.

## Plugin de backend mínimo

<Steps>
  <Step title="Create package metadata">
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

    Pacotes publicados devem incluir arquivos JavaScript de runtime compilados. Se a entrada do código-fonte for `./src/index.ts`, adicione `openclaw.runtimeExtensions` apontando para o arquivo JavaScript compilado correspondente. Consulte [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
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

    `cliBackends` é a lista de propriedade do runtime; ela permite que o OpenClaw carregue automaticamente o Plugin quando a configuração ou a seleção de modelo mencionar `acme-cli/...`.

    `setup.cliBackends` é a superfície de configuração baseada primeiro em descritores. Adicione-a quando a descoberta de modelos, a integração inicial ou o status precisarem reconhecer o backend sem carregar o runtime do Plugin. Use `requiresRuntime: false` somente quando esses descritores estáticos forem suficientes para a configuração.

  </Step>

  <Step title="Register the backend">
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

    O ID do backend deve corresponder à entrada `cliBackends` do manifesto. A `config` registrada é apenas o padrão; a configuração do usuário em `agents.defaults.cliBackends.acme-cli` é mesclada sobre ela durante o runtime.

  </Step>
</Steps>

## Formato da configuração

`CliBackendConfig` descreve como o OpenClaw deve iniciar e interpretar a CLI:

| Campo                                                     | Uso                                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `command`                                                 | Nome do binário ou caminho absoluto do comando                                                |
| `args`                                                    | Argumentos básicos para novas execuções                                                       |
| `resumeArgs`                                              | Argumentos alternativos para sessões retomadas; aceita `{sessionId}`                          |
| `output` / `resumeOutput`                                 | Analisador: `json`, `jsonl` ou `text`                                                         |
| `jsonlDialect`                                            | Dialeto de eventos JSONL: `claude-stream-json` ou `gemini-stream-json`                        |
| `liveSession`                                             | Modo de processo de CLI de longa duração (`claude-stdio`)                                     |
| `input`                                                   | Transporte do prompt: `arg` ou `stdin`                                                        |
| `maxPromptArgChars`                                       | Tamanho máximo do prompt no modo `arg` antes de recorrer ao stdin                             |
| `env` / `clearEnv`                                        | Variáveis de ambiente adicionais a injetar ou nomes a remover antes da inicialização          |
| `modelArg`                                                | Opção usada antes do ID do modelo                                                             |
| `modelAliases`                                            | Mapeia IDs de modelos do OpenClaw para IDs nativos da CLI                                     |
| `sessionArg` / `sessionArgs`                              | Como transmitir um ID de sessão                                                               |
| `sessionMode`                                             | `always`, `existing` ou `none`                                                                |
| `sessionIdFields`                                         | Campos JSON que o OpenClaw lê da saída da CLI                                                 |
| `systemPromptArg` / `systemPromptFileArg`                 | Transporte do prompt de sistema                                                               |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transporte de substituição de configuração para um arquivo de prompt de sistema (por exemplo, `-c`) |
| `systemPromptMode`                                        | `append` ou `replace`                                                                         |
| `systemPromptWhen`                                        | `first`, `always` ou `never`                                                                  |
| `imageArg` / `imageMode`                                  | Opção de caminho da imagem e como transmitir várias imagens (`repeat` ou `list`)              |
| `imagePathScope`                                          | Onde os arquivos de imagem preparados ficam antes da entrega: `temp` ou `workspace`           |
| `serialize`                                               | Mantém ordenadas as execuções do mesmo backend                                                |
| `reseedFromRawTranscriptWhenUncompacted`                  | Habilita a reinicialização limitada a partir da transcrição bruta antes da Compaction para redefinições seguras de sessão |
| `reliability.outputLimits`                                | Máximo de caracteres/linhas JSONL brutos retidos para um turno ativo da CLI (backends de sessão ativa) |
| `reliability.watchdog`                                    | Ajuste do tempo limite sem saída, separado para execuções novas e retomadas                    |

Prefira a menor configuração estática que corresponda à CLI. Adicione callbacks do Plugin somente para comportamentos que realmente pertençam ao backend.

## Hooks avançados do backend

`CliBackendPlugin` também pode definir:

| Hook                               | Uso                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescreve a configuração legada do usuário após a mesclagem                             |
| `resolveExecutionArgs(ctx)`        | Adiciona opções específicas da solicitação, como esforço de raciocínio ou isolamento de perguntas paralelas |
| `prepareExecution(ctx)`            | Cria pontes temporárias de autenticação ou configuração antes da inicialização           |
| `transformSystemPrompt(ctx)`       | Aplica uma transformação final do prompt de sistema específica da CLI                   |
| `textTransforms`                   | Substituições bidirecionais de prompt/saída                                              |
| `defaultAuthProfileId`             | Dá preferência a um perfil de autenticação específico do OpenClaw                       |
| `authEpochMode`                    | Decide como alterações de autenticação invalidam sessões armazenadas da CLI             |
| `nativeToolMode`                   | Declara se as ferramentas nativas estão ausentes, sempre ativas ou selecionáveis pelo host |
| `sideQuestionToolMode`             | Declara ferramentas nativas desativadas para perguntas paralelas de `/btw`              |
| `bundleMcp` / `bundleMcpMode`      | Habilita a ponte de ferramentas MCP de local loopback do OpenClaw                       |
| `ownsNativeCompaction`             | O backend gerencia sua própria Compaction — o OpenClaw adia o processamento             |
| `runtimeArtifact`                  | Vincula um inicializador de script à árvore completa de seu pacote integrado             |

Mantenha esses hooks sob responsabilidade do provedor. Não adicione ramificações específicas de CLI ao núcleo quando um hook do backend puder expressar o comportamento.

`runtimeArtifact` pertence ao Plugin e não pode ser substituído pelo usuário. Ele é consultado somente quando um turno ativo de inferência emite ou revalida uma autoridade verificada de configuração; execuções normais da CLI não o exigem. Um backend sem essa declaração não pode emitir uma autoridade verificada de configuração da CLI. Uma declaração `bundled-package-tree` identifica o proprietário exato de `package.json` e exige que o ponto de entrada do pacote seja o comando. O OpenClaw calcula o hash da árvore completa e delimitada do pacote instalado, incluindo dependências aninhadas, e interrompe de forma segura no caso de links simbólicos com redirecionamento, inicializadores fora do pacote declarado, declarações de dependências externas obrigatórias, árvores grandes demais e scripts desconhecidos. Declare isso somente quando essa árvore contiver a implementação completa da inferência; integrações opcionais de ferramentas não tornam seguro um grafo de implementação externo.

Se o mesmo backend também incluir um executável nativo autocontido, liste seus nomes-base canônicos em `nativeExecutableNames`. Outros comandos nativos permanecem não verificados mesmo quando um usuário substitui o comando do backend.

`ctx.executionMode` é `"agent"` para turnos normais e `"side-question"` para
chamadas efêmeras de `/btw`. Use-o quando a CLI precisar de flags avulsas diferentes,
como para desabilitar ferramentas nativas, persistência de sessão ou comportamento de retomada no
BTW. Se um backend normalmente tiver `nativeToolMode: "always-on"`, mas seus
argv de pergunta paralela desabilitarem essas ferramentas de forma confiável, defina também
`sideQuestionToolMode: "disabled"`; caso contrário, o OpenClaw falhará de forma segura quando o BTW
exigir uma execução da CLI sem ferramentas.

Defina `nativeToolMode: "selectable"` somente quando `resolveExecutionArgs` puder desabilitar
todas as ferramentas nativas do backend em uma execução individual. Para essas execuções restritas,
`ctx.toolAvailability.native` é uma tupla vazia e
`ctx.toolAvailability.mcp` é a lista de permissões MCP exata e isolada pelo host. O hook
deve substituir flags de ferramentas conflitantes e retornar argv que imponha ambos os valores;
o OpenClaw o chama uma vez com o argv final de uma execução nova ou de retomada e falha de forma segura quando
o backend não consegue impor a restrição. Nesse contexto, é seguro aprovar automaticamente os nomes MCP
somente porque o host já limitou a configuração MCP gerada
a esses servidores e ferramentas.

### `ownsNativeCompaction`: desativando a Compaction do OpenClaw

Se o seu backend executar um agente que compacta sua **própria** transcrição, defina
`ownsNativeCompaction: true` para que o sumarizador de proteção do OpenClaw nunca seja executado
em suas sessões — o ciclo de vida da Compaction da CLI não realiza nenhuma operação e o
turno prossegue. `claude-cli` declara essa opção porque o Claude Code realiza a Compaction
internamente, sem um endpoint do harness. Sessões de harness nativo, como o Codex,
continuam sendo encaminhadas ao endpoint de Compaction do próprio harness.

**Declare essa opção somente quando todas as condições a seguir forem atendidas**; caso contrário, uma sessão
adiada que excedeu o orçamento pode continuar acima do orçamento ou ficar obsoleta (o OpenClaw deixa de
resgatá-la):

- o backend compacta ou limita de forma confiável sua própria transcrição à medida que ela se aproxima do
  limite da janela;
- ele persiste uma sessão retomável para que o estado compactado seja preservado entre os turnos
  (por exemplo, `--resume` / `--session-id`);
- não se trata de uma sessão de Compaction de harness nativo — sessões que correspondem a `agentHarnessId`
  são encaminhadas ao endpoint do harness.

## Ponte de ferramentas MCP

Por padrão, backends de CLI não recebem as ferramentas do OpenClaw. Se a CLI puder consumir
uma configuração MCP, habilite-a explicitamente:

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

Modos de ponte compatíveis:

| Modo                     | Uso                                                               |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLIs que aceitam um arquivo de configuração MCP                   |
| `codex-config-overrides` | CLIs que aceitam substituições de configuração no argv            |
| `gemini-system-settings` | CLIs que leem configurações MCP no diretório de configurações do sistema |

Habilite a ponte somente quando a CLI realmente puder consumi-la. Se a CLI tiver
sua própria camada de ferramentas integrada que não possa ser desabilitada, defina `nativeToolMode:
"always-on"` para que o OpenClaw possa falhar de forma segura quando um chamador exigir a ausência de ferramentas
nativas. Se ela puder desabilitar todas as ferramentas nativas por execução, use `"selectable"` com o
contrato de `resolveExecutionArgs` descrito acima.

## Configuração do usuário

Os usuários podem substituir qualquer padrão do backend:

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documente a substituição mínima que os usuários provavelmente precisarão fazer — geralmente apenas
`command`, quando o binário estiver fora de `PATH`.

## Verificação

Para plugins incluídos, adicione um teste específico para o construtor e o registro
de configuração e, em seguida, execute a faixa de testes direcionada do Plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locais ou instalados, verifique a descoberta e uma execução real do modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Se o backend for compatível com imagens ou MCP, adicione um teste rápido real que comprove esses
caminhos usando a CLI real. Não dependa de inspeção estática para verificar o comportamento de prompt, imagem,
MCP ou retomada de sessão.

## Lista de verificação

<Check>`package.json` contém `openclaw.extensions` e entradas de runtime compiladas para pacotes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` e um `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente quando a configuração/descoberta de modelos precisa detectar o backend antes da inicialização</Check>
<Check>`api.registerCliBackend(...)` usa o mesmo id de backend que o manifesto</Check>
<Check>As substituições do usuário em `agents.defaults.cliBackends.<id>` continuam prevalecendo</Check>
<Check>As configurações de sessão, prompt do sistema, imagem e analisador de saída correspondem ao contrato real da CLI</Check>
<Check>Testes direcionados e pelo menos um teste rápido real da CLI comprovam o caminho do backend</Check>

## Relacionados

- [Backends de CLI](/pt-BR/gateway/cli-backends) — configuração do usuário e comportamento de runtime
- [Criação de plugins](/pt-BR/plugins/building-plugins) — fundamentos de pacotes e manifestos
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview) — referência da API de registro
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — `cliBackends` e descritores de configuração
- [Harness do agente](/pt-BR/plugins/sdk-agent-harness) — runtimes completos de agentes externos
