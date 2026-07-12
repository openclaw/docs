---
read_when:
    - Você quer que o OpenClaw inicie um servidor de modelo local somente quando o provedor de modelo ou de embeddings correspondente estiver selecionado
    - Você executa ds4, inferrs, vLLM, llama.cpp, MLX ou outro servidor local compatível com a OpenAI
    - Você precisa controlar a inicialização a frio, a prontidão e o desligamento por inatividade dos provedores locais
summary: Inicie servidores de modelos locais sob demanda antes das solicitações de modelos e embeddings do OpenClaw
title: Serviços de modelos locais
x-i18n:
    generated_at: "2026-07-11T23:56:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` inicia, sob demanda, um servidor local de modelos gerenciado pelo provedor. Quando uma solicitação de modelo ou embeddings seleciona esse provedor, o OpenClaw verifica o endpoint de integridade, inicia o processo se ele estiver inativo, aguarda até que esteja pronto e, então, envia a solicitação. Use esse recurso para evitar manter servidores locais de alto custo em execução o dia todo.

## Como funciona

1. Uma solicitação de modelo ou embeddings é resolvida para um provedor configurado.
2. Se esse provedor tiver `localService`, o OpenClaw verifica `healthUrl`.
3. Se a verificação for bem-sucedida, o OpenClaw usa o servidor que já está em execução.
4. Se a verificação falhar, o OpenClaw inicia `command` com `args`.
5. O OpenClaw consulta periodicamente o endpoint de integridade até que `readyTimeoutMs` expire.
6. A solicitação segue pelo transporte normal de modelo ou embeddings.
7. Se o OpenClaw tiver iniciado o processo e `idleStopMs` estiver definido, ele interromperá o processo quando, após a última solicitação em andamento, tiver transcorrido esse período de inatividade.

O OpenClaw não instala launchd, systemd, Docker nem nenhum daemon para isso. O servidor é simplesmente um processo filho do processo do OpenClaw que primeiro precisou dele.

A inicialização é serializada por provedor configurado e conjunto de comando, argumentos e variáveis de ambiente; assim, solicitações simultâneas de chat e embeddings para o mesmo serviço não iniciam servidores duplicados. Cada solicitação mantém sua própria concessão até a conclusão do processamento da resposta, de modo que o desligamento por inatividade aguarda todas as solicitações de modelo e embeddings em andamento. Os aliases de provedor configurados permanecem distintos: dois aliases podem apontar para hosts de GPU diferentes sem serem consolidados no mesmo identificador de adaptador do Ollama, LM Studio ou compatível com OpenAI.

Se outro processo do OpenClaw já tiver um servidor íntegro no mesmo `healthUrl`, este processo o reutilizará sem assumir seu gerenciamento (cada processo gerencia apenas o processo filho que ele próprio iniciou). Os logs de inicialização e encerramento incluem trechos finais limitados e ocultados da saída do processo filho, além de informações de duração e encerramento; os valores de ambiente configurados nunca são exibidos.

## Estrutura da configuração

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Defina `timeoutSeconds` na entrada do provedor (não em `localService`) para que inicializações a frio lentas e gerações longas não atinjam o tempo limite padrão das solicitações de modelo. Defina um `healthUrl` explícito sempre que o servidor expuser a prontidão em um local diferente de `/models` na URL base.

## Campos

| Campo            | Obrigatório | Descrição                                                                                                                                    |
| ---------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | sim         | Caminho absoluto do executável. Não há busca no PATH do shell.                                                                               |
| `args`           | não         | Argumentos do processo. Não há expansão do shell, pipes, correspondência de padrões ou interpretação de aspas.                               |
| `cwd`            | não         | Diretório de trabalho do processo.                                                                                                            |
| `env`            | não         | Variáveis de ambiente mescladas sobre o ambiente do processo do OpenClaw.                                                                     |
| `healthUrl`      | não         | URL de prontidão. Por padrão, acrescenta `/models` a `baseUrl` (`http://127.0.0.1:8000/v1` torna-se `http://127.0.0.1:8000/v1/models`).       |
| `readyTimeoutMs` | não         | Prazo para prontidão da inicialização. Padrão: `120000`.                                                                                      |
| `idleStopMs`     | não         | Atraso do desligamento por inatividade para um processo iniciado pelo OpenClaw. `0` ou a omissão mantém o processo ativo até o OpenClaw sair. |

## Exemplo com Inferrs

O Inferrs é um backend `/v1` personalizado compatível com OpenAI, portanto a mesma API `localService` funciona com uma entrada de provedor `inferrs`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

Substitua `command` pelo resultado de `which inferrs` na máquina que executa o OpenClaw. Configuração completa do inferrs: [Inferrs](/pt-BR/providers/inferrs).

## Exemplo com ds4

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

Comandos completos de configuração, dimensionamento do contexto e verificação: [ds4](/pt-BR/providers/ds4).

## Relacionados

<CardGroup cols={2}>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Configuração de modelos locais, opções de provedor e orientações de segurança.
  </Card>
  <Card title="Inferrs" href="/pt-BR/providers/inferrs" icon="cpu">
    Execute o OpenClaw por meio do servidor local do inferrs compatível com OpenAI.
  </Card>
</CardGroup>
