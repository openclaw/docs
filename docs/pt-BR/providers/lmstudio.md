---
read_when:
    - Você quer executar o OpenClaw com modelos de código aberto por meio do LM Studio
    - Você quer instalar e configurar o LM Studio
summary: Execute o OpenClaw com o LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T15:33:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

O LM Studio executa modelos llama.cpp (GGUF) ou MLX localmente, como um aplicativo com interface gráfica ou pelo daemon headless `llmster`.
Para obter instruções de instalação e a documentação do produto, consulte [lmstudio.ai](https://lmstudio.ai/).

## Início rápido

<Steps>
  <Step title="Instale e inicie o servidor">
    Instale o LM Studio (desktop) ou o `llmster` (headless) e, em seguida, inicie o servidor:

    ```bash
    lms server start --port 1234
    ```

    Ou execute o daemon headless:

    ```bash
    lms daemon up
    ```

    Se estiver usando o aplicativo para desktop, habilite o JIT para obter um carregamento fluido dos modelos; consulte o
    [guia de JIT e TTL do LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Defina uma chave de API se a autenticação estiver habilitada">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Se a autenticação do LM Studio estiver desabilitada, deixe a chave de API em branco durante a configuração. Consulte
    [Autenticação do LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Execute a integração inicial">
    ```bash
    openclaw onboard
    ```

    Escolha `LM Studio` e selecione um modelo no prompt `Default model`.

  </Step>
</Steps>

Altere o modelo padrão posteriormente:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

As chaves de modelo do LM Studio usam o formato `author/model-name` (por exemplo, `qwen/qwen3.5-9b`); as referências de modelo do OpenClaw
incluem o provedor como prefixo: `lmstudio/qwen/qwen3.5-9b`. Encontre a chave exata de um modelo executando o
comando abaixo e verificando o campo `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Integração inicial não interativa

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Ou especifique explicitamente a URL base, o modelo e a chave de API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` recebe a chave do modelo conforme retornada pelo LM Studio (por exemplo, `qwen/qwen3.5-9b`), sem
o prefixo de provedor `lmstudio/`. Passe `--lmstudio-api-key` (ou defina `LM_API_TOKEN`) para servidores autenticados;
omita-o para servidores sem autenticação, e o OpenClaw armazenará um marcador local não secreto.
`--custom-api-key` ainda é aceito por compatibilidade, mas `--lmstudio-api-key` é preferível.

Isso grava `models.providers.lmstudio` e define o modelo padrão como `lmstudio/<custom-model-id>`.
Fornecer uma chave de API também grava o perfil de autenticação `lmstudio:default`.

A configuração interativa também pode solicitar um tamanho preferencial para o contexto de carregamento e aplicá-lo a todos
os modelos descobertos que ela salva na configuração.

## Configuração

### Compatibilidade de uso em streaming

O LM Studio nem sempre emite um objeto `usage` no formato do OpenAI em respostas transmitidas por streaming. O OpenClaw
recupera as contagens de tokens dos metadados `timings.prompt_n` / `timings.predicted_n` no estilo do llama.cpp.
Qualquer endpoint compatível com o OpenAI identificado como endpoint local (host de loopback) recebe o mesmo
fallback, abrangendo outros backends locais, como vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
e text-generation-webui.

### Compatibilidade de raciocínio

Quando a descoberta de `/api/v1/models` do LM Studio informa opções de raciocínio específicas do modelo, o OpenClaw
expõe os valores correspondentes de `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) nos
metadados de compatibilidade do modelo. Algumas versões do LM Studio anunciam uma opção binária na interface (`allowed_options: ["off",
"on"]`), mas rejeitam esses valores literais em `/v1/chat/completions`; o OpenClaw normaliza esse
formato binário para a escala de seis níveis antes de enviar solicitações, inclusive para configurações salvas mais antigas que
ainda contêm mapas de raciocínio `off`/`on`.

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

### Desabilitar o pré-carregamento

O LM Studio oferece suporte ao carregamento de modelos just-in-time (JIT), carregando-os na primeira solicitação. Por padrão, o OpenClaw
pré-carrega os modelos por meio do endpoint de carregamento nativo do LM Studio, o que ajuda quando o JIT está
desabilitado. Para que o JIT, o TTL de inatividade e o comportamento de remoção automática do LM Studio controlem o ciclo de vida dos modelos,
desabilite a etapa de pré-carregamento do OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Host na LAN ou tailnet

Use o endereço acessível do host do LM Studio, mantenha `/v1` e verifique se o LM Studio está vinculado a endereços além do
loopback nessa máquina:

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

`lmstudio` confia automaticamente no endpoint configurado para solicitações de modelos, incluindo hosts de loopback,
LAN e tailnet (exceto origens de metadados/link-local). Qualquer entrada personalizada/local de provedor compatível com o OpenAI
recebe a mesma confiança para a origem exata. Solicitações para outro host ou porta privados ainda
exigem `models.providers.<id>.request.allowPrivateNetwork: true`; defina como `false` para desativar
a confiança padrão.

## Solução de problemas

### LM Studio não detectado

Verifique se o LM Studio está em execução:

```bash
lms server start --port 1234
```

Se a autenticação estiver habilitada, defina também `LM_API_TOKEN`. Verifique se a API está acessível:

```bash
curl http://localhost:1234/api/v1/models
```

### Erros de autenticação (HTTP 401)

- Verifique se `LM_API_TOKEN` corresponde à chave configurada no LM Studio.
- Consulte [Autenticação do LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se o servidor não exigir autenticação, deixe a chave em branco durante a configuração.

## Relacionados

- [Seleção de modelos](/pt-BR/concepts/model-providers)
- [Ollama](/pt-BR/providers/ollama)
- [Modelos locais](/pt-BR/gateway/local-models)
