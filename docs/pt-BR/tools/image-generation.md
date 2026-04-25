---
read_when:
    - Gerando imagens via o agente
    - Configurando providers e modelos de geração de imagem
    - Entendendo os parâmetros da ferramenta `image_generate`
summary: Gere e edite imagens usando providers configurados (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Geração de imagens
x-i18n:
    generated_at: "2026-04-25T18:22:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus providers configurados. As imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provider de geração de imagem está disponível. Se você não vir `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel`, defina uma chave de API de provider ou faça login com OpenAI Codex OAuth.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provider (por exemplo `OPENAI_API_KEY`, `GEMINI_API_KEY` ou `OPENROUTER_API_KEY`) ou faça login com OpenAI Codex OAuth.
2. Opcionalmente, defina seu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Timeout padrão opcional da requisição ao provider para image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

O Codex OAuth usa a mesma referência de modelo `openai/gpt-image-2`. Quando um
profile OAuth `openai-codex` está configurado, o OpenClaw roteia requisições de imagem
por esse mesmo profile OAuth em vez de tentar primeiro `OPENAI_API_KEY`.
A configuração explícita e personalizada de imagem em `models.providers.openai`, como uma chave de API ou
URL base customizada/Azure, faz a opção voltar para a rota direta da OpenAI Images API.
Para endpoints LAN compatíveis com OpenAI, como LocalAI, mantenha a
`models.providers.openai.baseUrl` personalizada e ative explicitamente com
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; endpoints de imagem privados/internos continuam bloqueados por padrão.

3. Peça ao agente: _"Gere uma imagem de um mascote de robô amigável."_

O agente chama `image_generate` automaticamente. Não é necessário allow-list de ferramenta — ela é ativada por padrão quando um provider está disponível.

## Rotas comuns

| Objetivo                                             | Referência de modelo                               | Autenticação                         |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Geração de imagem com OpenAI usando cobrança por API | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Geração de imagem com OpenAI usando autenticação por assinatura do Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| Geração de imagem com OpenRouter                     | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Geração de imagem com LiteLLM                        | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                    |
| Geração de imagem com Google Gemini                  | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

A mesma ferramenta `image_generate` lida com geração a partir de texto e
edição de imagem de referência. Use `image` para uma referência ou `images` para
múltiplas referências.
Dicas de saída compatíveis com o provider, como `quality`, `outputFormat` e
`background` específico da OpenAI, são encaminhadas quando disponíveis e relatadas como
ignoradas quando um provider não as oferece.

## Providers compatíveis

| Provider   | Modelo padrão                           | Suporte a edição                   | Autenticação                                          |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Sim (até 4 imagens)                | `OPENAI_API_KEY` ou OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sim (até 5 imagens de entrada)     | `OPENROUTER_API_KEY`                                  |
| LiteLLM    | `gpt-image-2`                           | Sim (até 5 imagens de entrada)     | `LITELLM_API_KEY`                                     |
| Google     | `gemini-3.1-flash-image-preview`        | Sim                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| fal        | `fal-ai/flux/dev`                       | Sim                                | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | Sim (referência de sujeito)        | `MINIMAX_API_KEY` ou MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | Sim (1 imagem, configurada no workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para cloud    |
| Vydra      | `grok-imagine`                          | Não                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Sim (até 5 imagens)                | `XAI_API_KEY`                                         |

Use `action: "list"` para inspecionar providers e modelos disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
Prompt de geração de imagem. Obrigatório para `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Use `"list"` para inspecionar providers e modelos disponíveis em runtime.
</ParamField>

<ParamField path="model" type="string">
Substituição de provider/modelo, por exemplo `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Caminho ou URL de uma única imagem de referência para o modo de edição.
</ParamField>

<ParamField path="images" type="string[]">
Múltiplas imagens de referência para o modo de edição (até 5).
</ParamField>

<ParamField path="size" type="string">
Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Dica de resolução.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Dica de qualidade quando o provider oferecer suporte.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Dica de formato de saída quando o provider oferecer suporte.
</ParamField>

<ParamField path="count" type="number">
Número de imagens a gerar (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Timeout opcional da requisição ao provider em milissegundos.
</ParamField>

<ParamField path="filename" type="string">
Dica de nome de arquivo de saída.
</ParamField>

<ParamField path="openai" type="object">
Dicas exclusivas da OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

Nem todos os providers oferecem suporte a todos os parâmetros. Quando um provider de fallback oferece uma opção de geometria próxima em vez da solicitada exatamente, o OpenClaw remapeia para o tamanho, proporção ou resolução compatível mais próximo antes do envio. Dicas de saída não compatíveis, como `quality` ou `outputFormat`, são descartadas para providers que não declaram suporte e são relatadas no resultado da ferramenta.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia geometria durante fallback de provider, os valores retornados de `size`, `aspectRatio` e `resolution` refletem o que foi realmente enviado, e `details.normalization` captura a tradução do solicitado para o aplicado.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Ordem de seleção de provider

Ao gerar uma imagem, o OpenClaw tenta providers nesta ordem:

1. **Parâmetro `model`** da chamada da ferramenta (se o agente especificar um)
2. **`imageGenerationModel.primary`** da configuração
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Detecção automática** — usa apenas padrões de provider com autenticação ativa:
   - provider padrão atual primeiro
   - providers restantes registrados de geração de imagem em ordem de ID do provider

Se um provider falhar (erro de autenticação, rate limit etc.), o próximo candidato configurado é tentado automaticamente. Se todos falharem, o erro inclui detalhes de cada tentativa.

Observações:

- Uma substituição `model` por chamada é exata: o OpenClaw tenta apenas esse provider/modelo
  e não continua para `primary`/`fallback` configurados nem para providers
  detectados automaticamente.
- A detecção automática reconhece autenticação. Um padrão de provider só entra na lista de candidatos
  quando o OpenClaw consegue autenticar esse provider de fato.
- A detecção automática é ativada por padrão. Defina
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a
  geração de imagem use apenas as entradas explícitas de `model`, `primary` e `fallbacks`.
- Defina `agents.defaults.imageGenerationModel.timeoutMs` para backends lentos de imagem.
  Um parâmetro de ferramenta `timeoutMs` por chamada substitui o padrão configurado.
- Use `action: "list"` para inspecionar os providers registrados no momento, seus
  modelos padrão e dicas de variáveis de ambiente de autenticação.

### Edição de imagem

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Gerar uma versão em aquarela desta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI oferecem suporte a até 5 imagens de referência via parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

### Modelos de imagem do OpenRouter

A geração de imagem com OpenRouter usa o mesmo `OPENROUTER_API_KEY` e roteia pela API de imagem de chat completions do OpenRouter. Selecione modelos de imagem do OpenRouter com o prefixo `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

O OpenClaw encaminha `prompt`, `count`, imagens de referência e dicas compatíveis com Gemini de `aspectRatio` / `resolution` para o OpenRouter. Os atalhos internos atuais de modelos de imagem do OpenRouter incluem `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`; use `action: "list"` para ver o que o Plugin configurado expõe.

### OpenAI `gpt-image-2`

A geração de imagem da OpenAI usa `openai/gpt-image-2` por padrão. Se um
profile OAuth `openai-codex` estiver configurado, o OpenClaw reutiliza o mesmo profile OAuth
usado por modelos de chat com assinatura do Codex e envia a requisição de imagem
pelo backend Codex Responses. URLs base legadas do Codex, como
`https://chatgpt.com/backend-api`, são canonicalizadas para
`https://chatgpt.com/backend-api/codex` em requisições de imagem. Ele não
faz fallback silencioso para `OPENAI_API_KEY` nessa requisição. Para forçar o roteamento direto
pela OpenAI Images API, configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure. O modelo antigo
`openai/gpt-image-1` ainda pode ser selecionado explicitamente, mas novas
requisições de geração e edição de imagem da OpenAI devem usar `gpt-image-2`.

`gpt-image-2` oferece suporte tanto à geração de imagem a partir de texto quanto à
edição de imagem de referência pela mesma ferramenta `image_generate`. O OpenClaw encaminha `prompt`,
`count`, `size`, `quality`, `outputFormat` e imagens de referência para a OpenAI.
A OpenAI não recebe `aspectRatio` nem `resolution` diretamente; quando possível,
o OpenClaw mapeia isso para um `size` compatível; caso contrário, a ferramenta os informa como
substituições ignoradas.

As opções específicas da OpenAI ficam no objeto `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` aceita `transparent`, `opaque` ou `auto`; saídas
transparentes exigem `outputFormat` `png` ou `webp`. `openai.outputCompression`
se aplica a saídas JPEG/WebP.

Gere uma imagem em paisagem 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Um pôster editorial limpo para geração de imagens do OpenClaw" size=3840x2160 count=1
```

Gere duas imagens quadradas:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Duas direções visuais para um ícone de app de produtividade calmo" size=1024x1024 count=2
```

Edite uma imagem de referência local:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantenha o sujeito, substitua o fundo por uma configuração de estúdio iluminada" image=/path/to/reference.png size=1024x1536
```

Edite com múltiplas referências:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine a identidade do personagem da primeira imagem com a paleta de cores da segunda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para rotear a geração de imagem da OpenAI por uma implantação do Azure OpenAI em vez
de `api.openai.com`, veja [Endpoints do Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints)
na documentação do provider OpenAI.

A geração de imagem do MiniMax está disponível pelos dois caminhos de autenticação empacotados do MiniMax:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Capacidades do provider

| Capacidade            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Gerar                 | Sim (até 4)          | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                | Sim (saídas definidas pelo workflow) | Sim (1) | Sim (até 4)          |
| Edição/referência     | Sim (até 5 imagens)  | Sim (até 5 imagens)  | Sim (1 imagem)      | Sim (1 imagem, ref. do sujeito) | Sim (1 imagem, configurada no workflow) | Não     | Sim (até 5 imagens) |
| Controle de tamanho   | Sim (até 4K)         | Sim                  | Sim                 | Não                        | Não                                 | Não     | Não                   |
| Proporção             | Não                  | Sim                  | Sim (apenas gerar)  | Sim                        | Não                                 | Não     | Sim                  |
| Resolução (1K/2K/4K)  | Não                  | Sim                  | Sim                 | Não                        | Não                                 | Não     | Sim (1K/2K)          |

### xAI `grok-imagine-image`

O provider xAI empacotado usa `/v1/images/generations` para requisições somente com prompt
e `/v1/images/edits` quando `image` ou `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Quantidade: até 4
- Referências: um `image` ou até cinco `images`
- Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluções: `1K`, `2K`
- Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

O OpenClaw intencionalmente não expõe `quality`, `mask`, `user` nativos do xAI nem
proporções extras exclusivas do nativo até que esses controles existam no contrato
compartilhado entre providers de `image_generate`.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [fal](/pt-BR/providers/fal) — configuração do provider de imagem e vídeo fal
- [ComfyUI](/pt-BR/providers/comfy) — configuração de workflow do ComfyUI local e Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provider de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provider de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provider OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala do Vydra
- [xAI](/pt-BR/providers/xai) — configuração de imagem, vídeo, busca, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — config `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) — configuração de modelo e failover
