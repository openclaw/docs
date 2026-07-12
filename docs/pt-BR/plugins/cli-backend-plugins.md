---
read_when:
    - Você está criando um plugin de backend de CLI de IA local
    - Você quer registrar um backend para referências de modelo como acme-cli/model
    - Você precisa mapear uma CLI de terceiros para o executor alternativo de texto do OpenClaw
sidebarTitle: CLI backend plugins
summary: Crie um plugin que registre um backend local de CLI de IA
title: Criação de plugins de backend para a CLI
x-i18n:
    generated_at: "2026-07-12T15:26:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugins de backend de CLI permitem que o OpenClaw chame uma CLI de IA local como backend de inferência
de texto. O backend aparece como um prefixo de provedor nas referências de modelo:

```text
acme-cli/acme-large
```

Use um backend de CLI quando a integração upstream já estiver exposta como um comando
local, quando a CLI gerenciar o estado de login local ou como fallback quando os provedores
de API estiverem indisponíveis.

<Info>
  Se o serviço upstream expuser uma API HTTP de modelo convencional, crie um
  [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins). Se o runtime upstream
  gerenciar sessões completas de agentes, eventos de ferramentas, Compaction ou o estado
  de tarefas em segundo plano, use um [harness de agente](/pt-BR/plugins/sdk-agent-harness).
</Info>

## O que o plugin gerencia

Um plugin de backend de CLI tem três contratos:

| Contrato             | Arquivo                | Finalidade                                                        |
| -------------------- | ---------------------- | ----------------------------------------------------------------- |
| Entrada do pacote    | `package.json`         | Direciona o OpenClaw ao módulo de runtime do plugin               |
| Propriedade do manifesto | `openclaw.plugin.json` | Declara o id do backend antes do carregamento do runtime       |
| Registro no runtime  | `index.ts`             | Chama `api.registerCliBackend(...)` com os padrões do comando     |

O manifesto contém metadados de descoberta: ele não executa a CLI nem registra
comportamentos de runtime. O comportamento de runtime começa quando a entrada do plugin chama
`api.registerCliBackend(...)`.

## Plugin de backend mínimo

<Steps>
  <Step title="Criar os metadados do pacote">
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

    Os pacotes publicados devem incluir arquivos de runtime JavaScript compilados. Se a entrada
    do código-fonte for `./src/index.ts`, adicione `openclaw.runtimeExtensions` apontando para o
    arquivo JavaScript correspondente compilado. Consulte [Pontos de entrada](/pt-BR/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declarar a propriedade do backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Execute a CLI de IA local da Acme por meio do OpenClaw",
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

    `cliBackends` é a lista de propriedade do runtime; ela permite que o OpenClaw carregue
    automaticamente o plugin quando a configuração ou a seleção de modelo mencionar `acme-cli/...`.

    `setup.cliBackends` é a superfície de configuração orientada primeiro por descritores. Adicione-a quando
    a descoberta de modelos, a integração inicial ou o status precisarem reconhecer o backend
    sem carregar o runtime do plugin. Use `requiresRuntime: false` somente quando
    esses descritores estáticos forem suficientes para a configuração.

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
    `agents.defaults.cliBackends.acme-cli` é mesclada sobre ela no runtime.

  </Step>
</Steps>

## Formato da configuração

`CliBackendConfig` descreve como o OpenClaw deve iniciar e analisar a CLI:

| Campo                                                     | Uso                                                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `command`                                                 | Nome do binário ou caminho absoluto do comando                                                           |
| `args`                                                    | argv base para novas execuções                                                                           |
| `resumeArgs`                                              | argv alternativo para sessões retomadas; aceita `{sessionId}`                                            |
| `output` / `resumeOutput`                                 | Analisador: `json`, `jsonl` ou `text`                                                                    |
| `jsonlDialect`                                            | Dialeto de eventos JSONL: `claude-stream-json` ou `gemini-stream-json`                                   |
| `liveSession`                                             | Modo de processo de CLI de longa duração (`claude-stdio`)                                                |
| `input`                                                   | Transporte do prompt: `arg` ou `stdin`                                                                   |
| `maxPromptArgChars`                                       | Tamanho máximo do prompt no modo `arg` antes de recorrer ao stdin                                        |
| `env` / `clearEnv`                                        | Variáveis de ambiente adicionais a injetar ou nomes a remover antes da inicialização                     |
| `modelArg`                                                | Flag usada antes do id do modelo                                                                         |
| `modelAliases`                                            | Mapeia ids de modelo do OpenClaw para ids nativos da CLI                                                 |
| `sessionArg` / `sessionArgs`                              | Como passar um id de sessão                                                                              |
| `sessionMode`                                             | `always`, `existing` ou `none`                                                                           |
| `sessionIdFields`                                         | Campos JSON que o OpenClaw lê da saída da CLI                                                            |
| `systemPromptArg` / `systemPromptFileArg`                 | Transporte do prompt de sistema                                                                          |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transporte de substituição de configuração para um arquivo de prompt de sistema (por exemplo, `-c`)      |
| `systemPromptMode`                                        | `append` ou `replace`                                                                                     |
| `systemPromptWhen`                                        | `first`, `always` ou `never`                                                                              |
| `imageArg` / `imageMode`                                  | Flag do caminho da imagem e como passar várias imagens (`repeat` ou `list`)                               |
| `imagePathScope`                                          | Onde ficam os arquivos de imagem preparados antes da transferência: `temp` ou `workspace`                |
| `serialize`                                               | Mantém ordenadas as execuções do mesmo backend                                                           |
| `reseedFromRawTranscriptWhenUncompacted`                  | Ativa a reinicialização limitada pelo transcript bruto antes da Compaction para redefinições seguras de sessão |
| `reliability.outputLimits`                                | Máximo de caracteres/linhas JSONL brutos retidos para um turno ativo da CLI (backends de sessão ativa)   |
| `reliability.watchdog`                                    | Ajuste do tempo limite sem saída, separado para execuções novas e retomadas                              |

Prefira a menor configuração estática que corresponda à CLI. Adicione callbacks do plugin
somente para comportamentos que realmente pertençam ao backend.

## Hooks avançados do backend

`CliBackendPlugin` também pode definir:

| Hook                               | Uso                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Reescreve a configuração legada do usuário após a mesclagem                               |
| `resolveExecutionArgs(ctx)`        | Adiciona flags específicas da solicitação, como esforço de raciocínio ou isolamento de perguntas paralelas |
| `prepareExecution(ctx)`            | Cria pontes temporárias de autenticação ou configuração antes da inicialização            |
| `transformSystemPrompt(ctx)`       | Aplica uma transformação final do prompt de sistema específica da CLI                     |
| `textTransforms`                   | Substituições bidirecionais de prompt/saída                                                |
| `defaultAuthProfileId`             | Dá preferência a um perfil de autenticação específico do OpenClaw                         |
| `authEpochMode`                    | Decide como alterações de autenticação invalidam sessões armazenadas da CLI               |
| `nativeToolMode`                   | Declara se as ferramentas nativas estão ausentes, sempre ativas ou selecionáveis pelo host |
| `sideQuestionToolMode`             | Declara ferramentas nativas desativadas para perguntas paralelas de `/btw`                |
| `bundleMcp` / `bundleMcpMode`      | Ativa a ponte de ferramentas MCP de loopback do OpenClaw                                  |
| `ownsNativeCompaction`             | O backend gerencia sua própria Compaction — o OpenClaw adia                               |
| `runtimeArtifact`                  | Vincula um inicializador de script à árvore completa do pacote incluído                   |

Mantenha esses hooks sob responsabilidade do provedor. Não adicione ramificações específicas da CLI ao núcleo quando
um hook de backend puder expressar o comportamento.

`runtimeArtifact` pertence ao plugin e não pode ser substituído pelo usuário. Ele é consultado
somente quando um turno de inferência ativo emite ou revalida uma autoridade de configuração verificada;
execuções normais da CLI não precisam dele. Um backend sem essa declaração não pode
emitir autoridade de configuração verificada da CLI. Uma declaração `bundled-package-tree` nomeia
o proprietário exato do `package.json` e exige que o ponto de entrada do pacote seja o
comando. O OpenClaw calcula o hash da árvore completa e delimitada do pacote instalado, incluindo
dependências aninhadas, e falha de forma fechada em caso de links simbólicos que redirecionem,
inicializadores fora do pacote declarado, declarações de dependências externas
obrigatórias, árvores grandes demais e scripts desconhecidos. Declare isso somente quando essa
árvore contiver a implementação completa da inferência; integrações opcionais de ferramentas
não tornam seguro um grafo de implementação externo.

Se o mesmo backend também fornecer um executável nativo autocontido, liste seus
nomes-base canônicos em `nativeExecutableNames`. Outros comandos nativos continuam
não verificados mesmo quando um usuário substitui o comando do backend.

`ctx.executionMode` é `"agent"` para interações normais e `"side-question"` para
chamadas efêmeras de `/btw`. Use-o quando a CLI precisar de sinalizadores de uso único diferentes,
como para desativar ferramentas nativas, a persistência da sessão ou o comportamento de retomada no
BTW. Se um backend normalmente tiver `nativeToolMode: "always-on"`, mas seus
argv de pergunta paralela desativarem essas ferramentas de forma confiável, defina também
`sideQuestionToolMode: "disabled"`; caso contrário, o OpenClaw falhará de modo seguro quando o BTW
exigir uma execução da CLI sem ferramentas.

Defina `nativeToolMode: "selectable"` somente quando `resolveExecutionArgs` puder desativar
todas as ferramentas nativas do backend para uma execução individual. Nessas execuções restritas,
`ctx.toolAvailability.native` é uma tupla vazia e
`ctx.toolAvailability.mcp` é a lista de permissões MCP exata e isolada pelo host. O hook
deve substituir sinalizadores de ferramentas conflitantes e retornar argv que imponha ambos os valores;
o OpenClaw o chama uma vez com o argv final de uma execução nova ou retomada e falha de modo seguro quando
o backend não consegue impor a restrição. Nesse contexto, é seguro aprovar automaticamente os nomes MCP
somente porque o host já limitou a configuração MCP gerada
a esses servidores e ferramentas.

### `ownsNativeCompaction`: desativando a Compaction do OpenClaw

Se o seu backend executar um agente que compacta sua **própria** transcrição, defina
`ownsNativeCompaction: true` para que o sumarizador de proteção do OpenClaw nunca seja executado
em suas sessões — o ciclo de vida de Compaction da CLI retorna uma operação nula e a
interação prossegue. `claude-cli` declara essa opção porque o Claude Code faz a Compaction
internamente, sem um endpoint do harness. Sessões de harness nativo, como o Codex,
continuam sendo encaminhadas ao endpoint de Compaction do respectivo harness.

**Declare essa opção somente quando todas as condições a seguir forem atendidas**; caso contrário, uma sessão adiada
acima do orçamento poderá permanecer acima do orçamento ou ficar obsoleta (o OpenClaw deixará de
recuperá-la):

- o backend compacta ou limita sua própria transcrição de forma confiável à medida que ela se aproxima de sua
  janela;
- ele persiste uma sessão retomável para que o estado compactado seja preservado entre interações
  (por exemplo, `--resume` / `--session-id`);
- não se trata de uma sessão de Compaction de harness nativo — sessões que correspondem a `agentHarnessId`
  são encaminhadas ao endpoint do harness.

## Ponte de ferramentas MCP

Os backends de CLI não recebem ferramentas do OpenClaw por padrão. Se a CLI puder consumir
uma configuração MCP, habilite explicitamente:

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
| `gemini-system-settings` | CLIs que leem configurações MCP do diretório de configurações do sistema |

Habilite a ponte somente quando a CLI realmente puder consumi-la. Se a CLI tiver
sua própria camada de ferramentas integrada que não possa ser desativada, defina `nativeToolMode:
"always-on"` para que o OpenClaw possa falhar de modo seguro quando um chamador exigir que não haja ferramentas
nativas. Se ela puder desativar todas as ferramentas nativas por execução, use `"selectable"` com o
contrato de `resolveExecutionArgs` acima.

## Configuração do usuário

Os usuários podem substituir qualquer padrão de backend:

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

Documente a substituição mínima de que os usuários provavelmente precisarão — geralmente apenas
`command` quando o binário estiver fora de `PATH`.

## Verificação

Para plugins incluídos, adicione um teste específico para o construtor e o registro
da configuração e, em seguida, execute a faixa de testes direcionada do plugin:

```bash
pnpm test extensions/acme-cli
```

Para plugins locais ou instalados, verifique a descoberta e uma execução real do modelo:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "responda exatamente: backend ok" --model acme-cli/acme-large
```

Se o backend oferecer suporte a imagens ou MCP, adicione um teste rápido real que comprove esses
fluxos com a CLI real. Não dependa de inspeção estática para o comportamento de prompt, imagem,
MCP ou retomada de sessão.

## Lista de verificação

<Check>`package.json` contém `openclaw.extensions` e entradas de runtime compiladas para pacotes publicados</Check>
<Check>`openclaw.plugin.json` declara `cliBackends` e um `activation.onStartup` intencional</Check>
<Check>`setup.cliBackends` está presente quando a configuração/descoberta de modelos deve detectar o backend sem inicialização prévia</Check>
<Check>`api.registerCliBackend(...)` usa o mesmo ID de backend que o manifesto</Check>
<Check>As substituições do usuário em `agents.defaults.cliBackends.<id>` continuam prevalecendo</Check>
<Check>As configurações de sessão, prompt do sistema, imagem e analisador de saída correspondem ao contrato real da CLI</Check>
<Check>Testes direcionados e pelo menos um teste rápido real da CLI comprovam o fluxo do backend</Check>

## Relacionado

- [Backends de CLI](/pt-BR/gateway/cli-backends) - configuração do usuário e comportamento do runtime
- [Criação de plugins](/pt-BR/plugins/building-plugins) - conceitos básicos de pacotes e manifestos
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview) - referência da API de registro
- [Manifesto de Plugin](/pt-BR/plugins/manifest) - `cliBackends` e descritores de configuração
- [Harness de agente](/pt-BR/plugins/sdk-agent-harness) - runtimes completos de agentes externos
