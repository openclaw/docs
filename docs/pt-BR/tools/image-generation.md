---
read_when:
    - Gerando imagens via o agente
    - Configurando provedores e modelos de geração de imagem
    - Entendendo os parâmetros da ferramenta image_generate
summary: Gerar e editar imagens usando provedores configurados (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Geração de imagem
x-i18n:
    generated_at: "2026-04-24T06:17:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus provedores configurados. Imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagem está disponível. Se você não vir `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel`, configure uma chave de API de provedor ou faça login com OpenAI Codex OAuth.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provedor (por exemplo `OPENAI_API_KEY`, `GEMINI_API_KEY` ou `OPENROUTER_API_KEY`) ou faça login com OpenAI Codex OAuth.
2. Opcionalmente, defina seu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

O Codex OAuth usa a mesma ref de modelo `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` está configurado, o OpenClaw roteia solicitações de imagem
por esse mesmo perfil OAuth em vez de tentar primeiro `OPENAI_API_KEY`.
Configuração explícita de imagem personalizada em `models.providers.openai`, como uma chave de API ou
base URL personalizada/Azure, faz o sistema voltar à rota direta da API OpenAI Images.
Para endpoints OpenAI compatíveis em LAN, como LocalAI, mantenha a
`models.providers.openai.baseUrl` personalizada e opte explicitamente por
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; endpoints de imagem privados/internos continuam bloqueados por padrão.

3. Peça ao agente: _"Generate an image of a friendly robot mascot."_

O agente chama `image_generate` automaticamente. Nenhuma allowlist de ferramenta é necessária — ela é ativada por padrão quando um provedor está disponível.

## Provedores compatíveis

| Provider   | Modelo padrão                          | Suporte a edição                  | Auth                                                  |
| ---------- | -------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                          | Sim (até 4 imagens)               | `OPENAI_API_KEY` ou OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sim (até 5 imagens de entrada)    | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`       | Sim                               | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| fal        | `fal-ai/flux/dev`                      | Sim                               | `FAL_KEY`                                             |
| MiniMax    | `image-01`                             | Sim (referência de assunto)       | `MINIMAX_API_KEY` ou MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                             | Sim (1 imagem, configurada no workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para nuvem |
| Vydra      | `grok-imagine`                         | Não                               | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                   | Sim (até 5 imagens)               | `XAI_API_KEY`                                         |

Use `action: "list"` para inspecionar provedores e modelos disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
Prompt de geração de imagem. Obrigatório para `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Use `"list"` para inspecionar provedores e modelos disponíveis em runtime.
</ParamField>

<ParamField path="model" type="string">
Substituição de provedor/modelo, por exemplo `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Caminho ou URL de uma única imagem de referência para modo de edição.
</ParamField>

<ParamField path="images" type="string[]">
Várias imagens de referência para modo de edição (até 5).
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
Dica de qualidade quando o provedor oferece suporte.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Dica de formato de saída quando o provedor oferece suporte.
</ParamField>

<ParamField path="count" type="number">
Número de imagens a gerar (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Timeout opcional de solicitação ao provedor em milissegundos.
</ParamField>

<ParamField path="filename" type="string">
Dica de nome de arquivo de saída.
</ParamField>

<ParamField path="openai" type="object">
Dicas exclusivas do OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

Nem todos os provedores oferecem suporte a todos os parâmetros. Quando um provedor de fallback oferece suporte a uma opção de geometria próxima em vez da opção exata solicitada, o OpenClaw remapeia para o tamanho, proporção ou resolução compatível mais próximos antes do envio. Dicas de saída não compatíveis, como `quality` ou `outputFormat`, são descartadas para provedores que não declaram suporte e são relatadas no resultado da ferramenta.

Os resultados da ferramenta relatam as configurações aplicadas. Quando o OpenClaw remapeia geometria durante fallback de provedor, os valores retornados de `size`, `aspectRatio` e `resolution` refletem o que foi realmente enviado, e `details.normalization` captura a tradução de solicitado para aplicado.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
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

### Ordem de seleção de provedor

Ao gerar uma imagem, o OpenClaw tenta provedores nesta ordem:

1. Parâmetro **`model`** da chamada da ferramenta (se o agente especificar um)
2. **`imageGenerationModel.primary`** da configuração
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Autodetecção** — usa apenas padrões de provedor respaldados por autenticação:
   - provedor padrão atual primeiro
   - demais provedores registrados de geração de imagem na ordem do ID do provedor

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo candidato é tentado automaticamente. Se todos falharem, o erro incluirá detalhes de cada tentativa.

Observações:

- A autodetecção considera autenticação. Um padrão de provedor só entra na lista de candidatos
  quando o OpenClaw consegue autenticar esse provedor de fato.
- A autodetecção vem ativada por padrão. Defina
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a geração de imagem use apenas as entradas explícitas de `model`, `primary` e `fallbacks`.
- Use `action: "list"` para inspecionar os provedores atualmente registrados, seus
  modelos padrão e dicas de variáveis de ambiente de autenticação.

### Edição de imagem

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI oferecem suporte a até 5 imagens de referência via parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

### Modelos de imagem OpenRouter

A geração de imagem via OpenRouter usa o mesmo `OPENROUTER_API_KEY` e roteia pelas chat completions image API do OpenRouter. Selecione modelos de imagem OpenRouter com o prefixo `openrouter/`:

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

O OpenClaw encaminha `prompt`, `count`, imagens de referência e dicas compatíveis com Gemini de `aspectRatio` / `resolution` ao OpenRouter. Os atalhos atuais de modelos de imagem OpenRouter incluídos incluem `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`; use `action: "list"` para ver o que o Plugin configurado expõe.

### OpenAI `gpt-image-2`

A geração de imagem da OpenAI usa `openai/gpt-image-2` como padrão. Se um
perfil OAuth `openai-codex` estiver configurado, o OpenClaw reutiliza o mesmo perfil OAuth
usado pelos modelos de chat com assinatura Codex e envia a solicitação de imagem
pelo backend Codex Responses; ele não recorre silenciosamente a
`OPENAI_API_KEY` para essa solicitação. Para forçar o roteamento direto pela API OpenAI Images,
configure `models.providers.openai` explicitamente com uma chave de API, base URL personalizada
ou endpoint Azure. O modelo antigo
`openai/gpt-image-1` ainda pode ser selecionado explicitamente, mas novas solicitações de
geração e edição de imagem da OpenAI devem usar `gpt-image-2`.

`gpt-image-2` oferece suporte tanto à geração texto-para-imagem quanto à
edição de imagem de referência por meio da mesma ferramenta `image_generate`. O OpenClaw encaminha `prompt`,
`count`, `size`, `quality`, `outputFormat` e imagens de referência à OpenAI.
A OpenAI não recebe `aspectRatio` ou `resolution` diretamente; quando possível,
o OpenClaw os mapeia para um `size` compatível; caso contrário, a ferramenta os relata como
substituições ignoradas.

Opções específicas da OpenAI ficam dentro do objeto `openai`:

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

`openai.background` aceita `transparent`, `opaque` ou `auto`; saídas transparentes
exigem `outputFormat` `png` ou `webp`. `openai.outputCompression`
se aplica a saídas JPEG/WebP.

Gerar uma imagem de paisagem 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Gerar duas imagens quadradas:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Editar uma imagem de referência local:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Editar com múltiplas referências:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para rotear a geração de imagem OpenAI por uma implantação Azure OpenAI em vez
de `api.openai.com`, consulte [Endpoints Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints)
na documentação do provedor OpenAI.

A geração de imagem MiniMax está disponível por ambos os caminhos de autenticação MiniMax incluídos:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Capacidades do provedor

| Capacidade            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Gerar                 | Sim (até 4)          | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                | Sim (saídas definidas pelo workflow) | Sim (1) | Sim (até 4)        |
| Edição/referência     | Sim (até 5 imagens)  | Sim (até 5 imagens)  | Sim (1 imagem)      | Sim (1 imagem, ref. de assunto) | Sim (1 imagem, configurada no workflow) | Não | Sim (até 5 imagens) |
| Controle de tamanho   | Sim (até 4K)         | Sim                  | Sim                 | Não                        | Não                                 | Não     | Não                  |
| Proporção             | Não                  | Sim                  | Sim (apenas gerar)  | Sim                        | Não                                 | Não     | Sim                  |
| Resolução (1K/2K/4K)  | Não                  | Sim                  | Sim                 | Não                        | Não                                 | Não     | Sim (1K/2K)          |

### xAI `grok-imagine-image`

O provedor xAI incluído usa `/v1/images/generations` para solicitações
somente com prompt e `/v1/images/edits` quando `image` ou `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Quantidade: até 4
- Referências: uma `image` ou até cinco `images`
- Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluções: `1K`, `2K`
- Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

O OpenClaw intencionalmente não expõe `quality`, `mask`, `user` nativos do xAI, nem
proporções extras exclusivas da API nativa, até que esses controles existam no
contrato compartilhado e multiplataforma de provedores `image_generate`.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [fal](/pt-BR/providers/fal) — configuração do provedor de imagem e vídeo fal
- [ComfyUI](/pt-BR/providers/comfy) — configuração de workflow local do ComfyUI e do Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provedor de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provedor de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala do Vydra
- [xAI](/pt-BR/providers/xai) — configuração de imagem, vídeo, busca, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração `imageGenerationModel`
- [Models](/pt-BR/concepts/models) — configuração de modelo e failover
