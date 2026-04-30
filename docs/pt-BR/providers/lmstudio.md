---
read_when:
    - Você quer executar o OpenClaw com modelos de código aberto via LM Studio
    - Você quer instalar e configurar o LM Studio
summary: Executar o OpenClaw com o LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T10:04:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

O LM Studio é um aplicativo amigável, mas poderoso, para executar modelos de pesos abertos no seu próprio hardware. Ele permite executar modelos llama.cpp (GGUF) ou MLX (Apple Silicon). Vem em um pacote com GUI ou como daemon headless (`llmster`). Para a documentação do produto e de configuração, consulte [lmstudio.ai](https://lmstudio.ai/).

## Início rápido

1. Instale o LM Studio (desktop) ou `llmster` (headless) e, em seguida, inicie o servidor local:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Inicie o servidor

Certifique-se de iniciar o aplicativo desktop ou executar o daemon usando o seguinte comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se você estiver usando o aplicativo, certifique-se de que o JIT esteja habilitado para uma experiência fluida. Saiba mais no [guia de JIT e TTL do LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Se a autenticação do LM Studio estiver habilitada, defina `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se a autenticação do LM Studio estiver desabilitada, você pode deixar a chave de API em branco durante a configuração interativa do OpenClaw.

Para detalhes sobre a configuração de autenticação do LM Studio, consulte [Autenticação do LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Execute o onboarding e escolha `LM Studio`:

```bash
openclaw onboard
```

5. No onboarding, use o prompt `Default model` para escolher seu modelo do LM Studio.

Você também pode defini-lo ou alterá-lo depois:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

As chaves de modelo do LM Studio seguem o formato `author/model-name` (por exemplo, `qwen/qwen3.5-9b`). As refs de modelo do OpenClaw prefixam o nome do provedor: `lmstudio/qwen/qwen3.5-9b`. Você pode encontrar a chave exata de um modelo executando `curl http://localhost:1234/api/v1/models` e procurando o campo `key`.

## Onboarding não interativo

Use o onboarding não interativo quando quiser automatizar a configuração por script (CI, provisionamento, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Ou especifique a URL base, o modelo e a chave de API opcional:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` recebe a chave do modelo conforme retornada pelo LM Studio (por exemplo, `qwen/qwen3.5-9b`), sem o prefixo de provedor `lmstudio/`.

Para servidores LM Studio autenticados, passe `--lmstudio-api-key` ou defina `LM_API_TOKEN`.
Para servidores LM Studio não autenticados, omita a chave; o OpenClaw armazena um marcador local não secreto.

`--custom-api-key` continua compatível, mas `--lmstudio-api-key` é preferível para o LM Studio.

Isso grava `models.providers.lmstudio` e define o modelo padrão como `lmstudio/<custom-model-id>`. Quando você fornece uma chave de API, a configuração também grava o perfil de autenticação `lmstudio:default`.

A configuração interativa pode solicitar um comprimento de contexto de carregamento preferencial opcional e aplicá-lo aos modelos do LM Studio descobertos que ela salva na configuração.
A configuração do Plugin LM Studio confia no endpoint do LM Studio configurado para solicitações de modelo, incluindo hosts de loopback, LAN e tailnet. Você pode optar por não usar isso definindo `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Configuração

### Compatibilidade de uso em streaming

O LM Studio é compatível com uso em streaming. Quando ele não emite um objeto `usage` no formato do OpenAI, o OpenClaw recupera as contagens de tokens a partir dos metadados `timings.prompt_n` / `timings.predicted_n` no estilo llama.cpp.

O mesmo comportamento de uso em streaming se aplica a estes backends locais compatíveis com OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Compatibilidade de raciocínio

Quando a descoberta de `/api/v1/models` do LM Studio relata opções de raciocínio específicas do modelo, o OpenClaw preserva esses valores nativos nos metadados de compatibilidade do modelo. Para modelos de raciocínio binário que anunciam `allowed_options: ["off", "on"]`, o OpenClaw mapeia o raciocínio desabilitado para `off` e níveis `/think` habilitados para `on`, em vez de enviar valores exclusivos da OpenAI, como `low` ou `medium`.

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

Certifique-se de que o LM Studio esteja em execução. Se a autenticação estiver habilitada, defina também `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

Verifique se a API está acessível:

```bash
curl http://localhost:1234/api/v1/models
```

### Erros de autenticação (HTTP 401)

Se a configuração relatar HTTP 401, verifique sua chave de API:

- Confira se `LM_API_TOKEN` corresponde à chave configurada no LM Studio.
- Para detalhes sobre a configuração de autenticação do LM Studio, consulte [Autenticação do LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se o seu servidor não exigir autenticação, deixe a chave em branco durante a configuração.

### Carregamento de modelo just-in-time

O LM Studio é compatível com carregamento de modelo just-in-time (JIT), em que os modelos são carregados na primeira solicitação. Certifique-se de que isso esteja habilitado para evitar erros de 'Model not loaded'.

### Host LM Studio em LAN ou tailnet

Use o endereço acessível do host LM Studio, mantenha `/v1` e certifique-se de que o LM Studio esteja vinculado além do loopback nessa máquina:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

Ao contrário de provedores genéricos compatíveis com OpenAI, `lmstudio` confia automaticamente em seu endpoint local/privado configurado para solicitações de modelo protegidas. IDs de provedores personalizados de local loopback, como `localhost` ou `127.0.0.1`, também são confiáveis automaticamente; para IDs de provedores personalizados de LAN, tailnet ou DNS privado, defina explicitamente `models.providers.<id>.request.allowPrivateNetwork: true`.

## Relacionados

- [Seleção de modelo](/pt-BR/concepts/model-providers)
- [Ollama](/pt-BR/providers/ollama)
- [Modelos locais](/pt-BR/gateway/local-models)
