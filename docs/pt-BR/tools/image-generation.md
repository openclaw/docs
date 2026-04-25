---
read_when:
    - Gerando imagens por meio do agente
    - Configurando provedores e modelos de geração de imagens
    - Entendendo os parâmetros da ferramenta `image_generate`
summary: Gere e edite imagens usando os provedores configurados (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Geração de imagens
x-i18n:
    generated_at: "2026-04-25T13:57:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus provedores configurados. As imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagens está disponível. Se você não vir `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel`, defina uma chave de API de provedor ou faça login com OpenAI Codex OAuth.
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

O Codex OAuth usa a mesma referência de modelo `openai/gpt-image-2`. Quando um
perfil OAuth `openai-codex` está configurado, o OpenClaw roteia as solicitações de imagem
por esse mesmo perfil OAuth em vez de tentar primeiro `OPENAI_API_KEY`.
A configuração explícita de imagem personalizada em `models.providers.openai`, como uma chave de API ou
URL base personalizada/Azure, faz o sistema voltar a usar diretamente a rota da OpenAI Images API.
Para endpoints LAN compatíveis com OpenAI, como LocalAI, mantenha a
`models.providers.openai.baseUrl` personalizada e habilite explicitamente com
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; endpoints de imagem privados/internos
continuam bloqueados por padrão.

3. Peça ao agente: _"Gere uma imagem de um mascote robô amigável."_

O agente chama `image_generate` automaticamente. Não é necessário permitir a ferramenta em lista explícita — ela é habilitada por padrão quando um provedor está disponível.

## Rotas comuns

| Objetivo                                             | Ref. de modelo                                     | Autenticação                        |
| ---------------------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| Geração de imagens OpenAI com cobrança por API       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                    |
| Geração de imagens OpenAI com autenticação por assinatura Codex | `openai/gpt-image-2`                   | OpenAI Codex OAuth                  |
| Geração de imagens via OpenRouter                    | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                |
| Geração de imagens Google Gemini                     | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY` |

A mesma ferramenta `image_generate` lida com geração de imagem a partir de texto e
edição com imagem de referência. Use `image` para uma referência ou `images` para várias referências.
Dicas de saída suportadas pelo provedor, como `quality`, `outputFormat` e
`background` específico da OpenAI, são encaminhadas quando disponíveis e informadas como
ignoradas quando um provedor não oferece suporte a elas.

## Provedores compatíveis

| Provedor   | Modelo padrão                           | Suporte a edição                   | Autenticação                                             |
| ---------- | --------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Sim (até 4 imagens)                | `OPENAI_API_KEY` ou OpenAI Codex OAuth                   |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sim (até 5 imagens de entrada)     | `OPENROUTER_API_KEY`                                     |
| Google     | `gemini-3.1-flash-image-preview`        | Sim                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                     |
| fal        | `fal-ai/flux/dev`                       | Sim                                | `FAL_KEY`                                                |
| MiniMax    | `image-01`                              | Sim (referência de sujeito)        | `MINIMAX_API_KEY` ou MiniMax OAuth (`minimax-portal`)    |
| ComfyUI    | `workflow`                              | Sim (1 imagem, configurado no workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para cloud |
| Vydra      | `grok-imagine`                          | Não                                | `VYDRA_API_KEY`                                          |
| xAI        | `grok-imagine-image`                    | Sim (até 5 imagens)                | `XAI_API_KEY`                                            |

Use `action: "list"` para inspecionar os provedores e modelos disponíveis em tempo de execução:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
Prompt de geração de imagem. Obrigatório para `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Use `"list"` para inspecionar os provedores e modelos disponíveis em tempo de execução.
</ParamField>

<ParamField path="model" type="string">
Substituição de provedor/modelo, por exemplo `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Caminho ou URL de uma única imagem de referência para o modo de edição.
</ParamField>

<ParamField path="images" type="string[]">
Várias imagens de referência para o modo de edição (até 5).
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
Timeout opcional da solicitação ao provedor em milissegundos.
</ParamField>

<ParamField path="filename" type="string">
Dica de nome do arquivo de saída.
</ParamField>

<ParamField path="openai" type="object">
Dicas exclusivas da OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

Nem todos os provedores oferecem suporte a todos os parâmetros. Quando um provedor de fallback oferece uma opção de geometria próxima em vez da opção exata solicitada, o OpenClaw remapeia para o tamanho, proporção ou resolução compatível mais próximo antes do envio. Dicas de saída não compatíveis, como `quality` ou `outputFormat`, são descartadas para provedores que não declaram suporte e são informadas no resultado da ferramenta.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia a geometria durante o fallback de provedor, os valores retornados de `size`, `aspectRatio` e `resolution` refletem o que foi realmente enviado, e `details.normalization` captura a tradução do valor solicitado para o valor aplicado.

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

Ao gerar uma imagem, o OpenClaw tenta os provedores nesta ordem:

1. **Parâmetro `model`** da chamada da ferramenta (se o agente especificar um)
2. **`imageGenerationModel.primary`** da configuração
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Detecção automática** — usa apenas padrões de provedor com autenticação disponível:
   - provedor padrão atual primeiro
   - provedores restantes registrados para geração de imagens em ordem de provider-id

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo candidato configurado é tentado automaticamente. Se todos falharem, o erro inclui detalhes de cada tentativa.

Observações:

- Uma substituição de `model` por chamada é exata: o OpenClaw tenta apenas esse provedor/modelo
  e não continua para o primário/fallback configurado nem para provedores
  detectados automaticamente.
- A detecção automática reconhece autenticação. Um padrão de provedor só entra na lista de candidatos
  quando o OpenClaw realmente consegue autenticar esse provedor.
- A detecção automática fica habilitada por padrão. Defina
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a
  geração de imagens use apenas as entradas explícitas `model`, `primary` e `fallbacks`.
- Use `action: "list"` para inspecionar os provedores atualmente registrados, seus
  modelos padrão e as dicas de variáveis de ambiente de autenticação.

### Edição de imagens

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Gerar uma versão em aquarela desta foto" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI oferecem suporte a até 5 imagens de referência por meio do parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

### Modelos de imagem do OpenRouter

A geração de imagens via OpenRouter usa a mesma `OPENROUTER_API_KEY` e roteia por meio da API de imagens de completações de chat do OpenRouter. Selecione modelos de imagem do OpenRouter com o prefixo `openrouter/`:

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

O OpenClaw encaminha `prompt`, `count`, imagens de referência e dicas compatíveis com Gemini de `aspectRatio` / `resolution` para o OpenRouter. Os atalhos atualmente incluídos para modelos de imagem do OpenRouter incluem `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`; use `action: "list"` para ver o que seu Plugin configurado expõe.

### OpenAI `gpt-image-2`

A geração de imagens OpenAI usa por padrão `openai/gpt-image-2`. Se um
perfil OAuth `openai-codex` estiver configurado, o OpenClaw reutiliza o mesmo perfil OAuth
usado pelos modelos de chat de assinatura do Codex e envia a solicitação de imagem
pelo backend Codex Responses. URLs base legadas do Codex, como
`https://chatgpt.com/backend-api`, são canonizadas para
`https://chatgpt.com/backend-api/codex` para solicitações de imagem. O sistema não
recorre silenciosamente a `OPENAI_API_KEY` para essa solicitação. Para forçar o roteamento direto para a OpenAI
Images API, configure `models.providers.openai` explicitamente com uma chave de API,
URL base personalizada ou endpoint Azure. O modelo mais antigo
`openai/gpt-image-1` ainda pode ser selecionado explicitamente, mas novas
solicitações OpenAI de geração e edição de imagens devem usar `gpt-image-2`.

`gpt-image-2` oferece suporte tanto à geração de imagem a partir de texto quanto à
edição com imagem de referência por meio da mesma ferramenta `image_generate`. O OpenClaw encaminha `prompt`,
`count`, `size`, `quality`, `outputFormat` e imagens de referência para a OpenAI.
A OpenAI não recebe `aspectRatio` nem `resolution` diretamente; quando possível,
o OpenClaw os mapeia para um `size` compatível, caso contrário a ferramenta os informa como
substituições ignoradas.

As opções específicas da OpenAI ficam sob o objeto `openai`:

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
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Duas direções visuais para o ícone de um app de produtividade calmo" size=1024x1024 count=2
```

Edite uma imagem de referência local:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantenha o sujeito, substitua o fundo por um setup de estúdio iluminado" image=/path/to/reference.png size=1024x1536
```

Editar com várias referências:

```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine a identidade do personagem da primeira imagem com a paleta de cores da segunda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para rotear a geração de imagens da OpenAI por uma implantação Azure OpenAI em vez
de `api.openai.com`, consulte [Endpoints Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints)
na documentação do provedor OpenAI.

A geração de imagens MiniMax está disponível por ambos os caminhos de autenticação MiniMax incluídos:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Recursos do provedor

| Recurso               | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Gerar                 | Sim (até 4)          | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                | Sim (saídas definidas pelo workflow) | Sim (1) | Sim (até 4)        |
| Edição/referência     | Sim (até 5 imagens)  | Sim (até 5 imagens)  | Sim (1 imagem)      | Sim (1 imagem, ref. de sujeito) | Sim (1 imagem, configurado no workflow) | Não | Sim (até 5 imagens) |
| Controle de tamanho   | Sim (até 4K)         | Sim                  | Sim                 | Não                        | Não                                 | Não     | Não                  |
| Proporção             | Não                  | Sim                  | Sim (apenas gerar)  | Sim                        | Não                                 | Não     | Sim                  |
| Resolução (1K/2K/4K)  | Não                  | Sim                  | Sim                 | Não                        | Não                                 | Não     | Sim (1K/2K)          |

### xAI `grok-imagine-image`

O provedor xAI incluído usa `/v1/images/generations` para solicitações somente com prompt
e `/v1/images/edits` quando `image` ou `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Quantidade: até 4
- Referências: uma `image` ou até cinco `images`
- Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluções: `1K`, `2K`
- Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

O OpenClaw intencionalmente não expõe `quality`, `mask`, `user` nativos do xAI nem
proporções extras exclusivas do nativo até que esses controles existam no contrato compartilhado
multprovedor de `image_generate`.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [fal](/pt-BR/providers/fal) — configuração do provedor de imagem e vídeo fal
- [ComfyUI](/pt-BR/providers/comfy) — configuração de workflow local do ComfyUI e Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provedor de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provedor de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala do Vydra
- [xAI](/pt-BR/providers/xai) — configuração de imagem, vídeo, pesquisa, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) — configuração de modelo e failover
