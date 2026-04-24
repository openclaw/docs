---
read_when:
    - Você quer executar o OpenClaw com modelos open source via LM Studio
    - Você quer configurar e ajustar o LM Studio
summary: Execute o OpenClaw com LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T06:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio é um app amigável e poderoso para executar modelos open-weight no seu próprio hardware. Ele permite executar modelos llama.cpp (GGUF) ou MLX (Apple Silicon). Está disponível em pacote com GUI ou como daemon headless (`llmster`). Para documentação do produto e configuração, consulte [lmstudio.ai](https://lmstudio.ai/).

## Início rápido

1. Instale o LM Studio (desktop) ou `llmster` (headless) e depois inicie o servidor local:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Inicie o servidor

Certifique-se de iniciar o app desktop ou executar o daemon usando o seguinte comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se você estiver usando o app, garanta que o JIT esteja habilitado para uma experiência fluida. Saiba mais no [guia de JIT e TTL do LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. O OpenClaw exige um valor de token do LM Studio. Defina `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se a autenticação do LM Studio estiver desabilitada, use qualquer valor de token não vazio:

```bash
export LM_API_TOKEN="placeholder-key"
```

Para detalhes da configuração de autenticação do LM Studio, consulte [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Execute o onboarding e escolha `LM Studio`:

```bash
openclaw onboard
```

5. No onboarding, use o prompt `Default model` para escolher seu modelo do LM Studio.

Você também pode defini-lo ou alterá-lo depois:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

As chaves de modelo do LM Studio seguem o formato `author/model-name` (por exemplo `qwen/qwen3.5-9b`). Referências de modelo do OpenClaw
prefixam o nome do provedor: `lmstudio/qwen/qwen3.5-9b`. Você pode encontrar a chave exata de
um modelo executando `curl http://localhost:1234/api/v1/models` e olhando o campo `key`.

## Onboarding não interativo

Use onboarding não interativo quando quiser automatizar a configuração (CI, provisionamento, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ou especifique base URL ou modelo com chave de API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` recebe a chave do modelo retornada pelo LM Studio (por exemplo `qwen/qwen3.5-9b`), sem
o prefixo do provedor `lmstudio/`.

O onboarding não interativo exige `--lmstudio-api-key` (ou `LM_API_TOKEN` no env).
Para servidores LM Studio sem autenticação, qualquer valor de token não vazio funciona.

`--custom-api-key` continua compatível por compatibilidade, mas `--lmstudio-api-key` é preferível para LM Studio.

Isso grava `models.providers.lmstudio`, define o modelo padrão como
`lmstudio/<custom-model-id>` e grava o perfil de autenticação `lmstudio:default`.

A configuração interativa pode solicitar um comprimento preferido opcional de contexto de carga e aplica isso aos modelos LM Studio descobertos que ela salva na configuração.

## Configuração

### Compatibilidade com uso em streaming

LM Studio é compatível com uso em streaming. Quando ele não emite um objeto
`usage` no formato da OpenAI, o OpenClaw recupera contagens de tokens a partir de metadados
no estilo llama.cpp `timings.prompt_n` / `timings.predicted_n`.

O mesmo comportamento se aplica a estes backends locais compatíveis com OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Configuração explícita

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Solução de problemas

### LM Studio não detectado

Certifique-se de que o LM Studio esteja em execução e de que você definiu `LM_API_TOKEN` (para servidores sem autenticação, qualquer valor de token não vazio funciona):

```bash
# Inicie pelo app desktop ou, em modo headless:
lms server start --port 1234
```

Verifique se a API está acessível:

```bash
curl http://localhost:1234/api/v1/models
```

### Erros de autenticação (HTTP 401)

Se a configuração reportar HTTP 401, verifique sua chave de API:

- Confirme que `LM_API_TOKEN` corresponde à chave configurada no LM Studio.
- Para detalhes da configuração de autenticação do LM Studio, consulte [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Se o seu servidor não exigir autenticação, use qualquer valor de token não vazio para `LM_API_TOKEN`.

### Carregamento just-in-time de modelo

O LM Studio oferece suporte a carregamento just-in-time (JIT) de modelo, em que os modelos são carregados na primeira solicitação. Certifique-se de que isso esteja habilitado para evitar erros de "Model not loaded".

## Relacionados

- [Model selection](/pt-BR/concepts/model-providers)
- [Ollama](/pt-BR/providers/ollama)
- [Local models](/pt-BR/gateway/local-models)
