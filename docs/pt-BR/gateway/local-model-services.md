---
read_when:
    - Você quer que o OpenClaw inicie um servidor de modelo local somente quando seu modelo estiver selecionado
    - Você executa ds4, inferrs, vLLM, llama.cpp, MLX ou outro servidor local compatível com OpenAI
    - Você precisa controlar a inicialização a frio, a prontidão e o desligamento por inatividade para provedores locais
summary: Inicie servidores de modelos locais sob demanda antes das solicitações de modelo do OpenClaw
title: Serviços de modelo local
x-i18n:
    generated_at: "2026-06-27T17:31:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` permite que o OpenClaw inicie sob demanda um
servidor de modelo local de propriedade do provedor. É uma configuração no nível do provedor: quando o modelo selecionado
pertence a esse provedor, o OpenClaw sonda o serviço, inicia o processo se o
endpoint estiver indisponível, aguarda a prontidão e então envia a solicitação do modelo.

Use isso para servidores locais que são caros de manter em execução o dia todo, ou para
configurações manuais nas quais a seleção do modelo deve bastar para ativar o backend.

## Como funciona

1. Uma solicitação de modelo é resolvida para um provedor configurado.
2. Se esse provedor tiver `localService`, o OpenClaw sonda `healthUrl`.
3. Se a sondagem tiver sucesso, o OpenClaw usa o servidor existente.
4. Se a sondagem falhar, o OpenClaw inicia `command` com `args`.
5. O OpenClaw verifica a prontidão até `readyTimeoutMs` expirar.
6. A solicitação do modelo é enviada pelo transporte normal do provedor.
7. Se o OpenClaw iniciou o processo e `idleStopMs` for positivo, o processo é
   interrompido depois que a última solicitação em andamento ficar ociosa por esse tempo.

O OpenClaw não instala launchd, systemd, Docker nem um daemon para isso. O
servidor é um processo filho do processo do OpenClaw que primeiro precisou dele.

## Formato da configuração

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

## Campos

- `command`: caminho absoluto do executável. A busca pelo shell não é usada.
- `args`: argumentos do processo. Nenhuma expansão de shell, pipes, globbing ou regras de aspas
  são aplicadas.
- `cwd`: diretório de trabalho opcional para o processo.
- `env`: variáveis de ambiente opcionais mescladas sobre o ambiente do processo
  do OpenClaw.
- `healthUrl`: URL de prontidão. Se omitida, o OpenClaw adiciona `/models` a
  `baseUrl`, então `http://127.0.0.1:8000/v1` se torna
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: prazo de prontidão da inicialização. Padrão: `120000`.
- `idleStopMs`: atraso de desligamento por ociosidade para processos iniciados pelo OpenClaw. `0` ou
  omitido mantém o processo ativo até o OpenClaw sair.

## Exemplo do Inferrs

O Inferrs é um backend `/v1` personalizado compatível com OpenAI, portanto a mesma API de serviço local
funciona com a entrada de provedor `inferrs`.

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

Substitua `command` pelo resultado de `which inferrs` na máquina que executa
o OpenClaw.

## Exemplo do ds4

Para a configuração completa, orientações de dimensionamento de contexto e comandos de verificação, consulte
[ds4](/pt-BR/providers/ds4).

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

## Notas operacionais

- Um processo do OpenClaw gerencia o filho que iniciou. Outro processo do OpenClaw
  que vê a mesma URL de integridade já ativa a reutilizará sem adotá-la.
- A inicialização é serializada por comando e conjunto de argumentos do provedor, para que solicitações
  concorrentes não criem servidores duplicados para a mesma configuração.
- Respostas de streaming ativas mantêm uma concessão; o desligamento por ociosidade aguarda até que o tratamento
  do corpo da resposta seja concluído.
- Use `timeoutSeconds` em provedores locais lentos para que inicializações a frio e gerações longas
  não atinjam o tempo limite padrão de solicitação de modelo.
- Use uma `healthUrl` explícita se o servidor expuser prontidão em outro lugar
  que não seja `/v1/models`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Local models" href="/pt-BR/gateway/local-models" icon="server">
    Configuração de modelo local, opções de provedor e orientações de segurança.
  </Card>
  <Card title="Inferrs" href="/pt-BR/providers/inferrs" icon="cpu">
    Execute o OpenClaw pelo servidor local compatível com OpenAI do inferrs.
  </Card>
</CardGroup>
