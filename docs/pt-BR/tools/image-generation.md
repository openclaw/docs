---
read_when:
    - Gerando ou editando imagens por meio do agente
    - Configurando provedores e modelos de geração de imagens
    - Entendendo os parâmetros da ferramenta image_generate
sidebarTitle: Image generation
summary: Gere e edite imagens via image_generate em OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Geração de imagens
x-i18n:
    generated_at: "2026-04-30T10:11:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus
provedores configurados. As imagens geradas são entregues automaticamente como
anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagens está
disponível. Se você não vir `image_generate` nas ferramentas do seu agente,
configure `agents.defaults.imageGenerationModel`, defina uma chave de API do provedor
ou entre com o OAuth do OpenAI Codex.
</Note>

## Início rápido

<Steps>
  <Step title="Configurar autenticação">
    Defina uma chave de API para pelo menos um provedor (por exemplo `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) ou entre com o OAuth do OpenAI Codex.
  </Step>
  <Step title="Escolher um modelo padrão (opcional)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    O OAuth do Codex usa a mesma referência de modelo `openai/gpt-image-2`. Quando um
    perfil OAuth `openai-codex` está configurado, o OpenClaw encaminha solicitações de imagem
    por esse perfil OAuth em vez de tentar primeiro
    `OPENAI_API_KEY`. A configuração explícita `models.providers.openai` (chave de API,
    URL base personalizada/Azure) volta a usar a rota direta da API OpenAI Images.

  </Step>
  <Step title="Pedir ao agente">
    _"Gere uma imagem de um mascote robô simpático."_

    O agente chama `image_generate` automaticamente. Não é necessário incluir a ferramenta
    em uma lista de permissões — ela é habilitada por padrão quando um provedor está disponível.

  </Step>
</Steps>

<Warning>
Para endpoints LAN compatíveis com OpenAI, como LocalAI, mantenha o
`models.providers.openai.baseUrl` personalizado e opte explicitamente por
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Endpoints de imagem privados e
internos permanecem bloqueados por padrão.
</Warning>

## Rotas comuns

| Objetivo                                             | Referência de modelo                                | Autenticação                          |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| Geração de imagens OpenAI com cobrança por API       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Geração de imagens OpenAI com autenticação de assinatura Codex | `openai/gpt-image-2`                               | OAuth do OpenAI Codex                  |
| PNG/WebP com fundo transparente da OpenAI            | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` ou OAuth do OpenAI Codex |
| Geração de imagens DeepInfra                        | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Geração de imagens OpenRouter                       | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| Geração de imagens LiteLLM                          | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Geração de imagens Google Gemini                    | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`   |

A mesma ferramenta `image_generate` lida com texto para imagem e edição com imagem
de referência. Use `image` para uma referência ou `images` para várias referências.
Dicas de saída compatíveis com o provedor, como `quality`, `outputFormat` e
`background`, são encaminhadas quando disponíveis e relatadas como ignoradas quando um
provedor não oferece suporte a elas. O suporte integrado a fundo transparente é
específico da OpenAI; outros provedores ainda podem preservar o alfa de PNG se o
backend deles o emitir.

## Provedores compatíveis

| Provedor   | Modelo padrão                         | Suporte a edição                   | Autenticação                                           |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Sim (1 imagem, configurada por workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para nuvem    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Sim (1 imagem)                     | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Sim                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Sim                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | Sim (até 5 imagens de entrada)     | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Sim (referência de assunto)        | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Sim (até 4 imagens)                | `OPENAI_API_KEY` ou OAuth do OpenAI Codex             |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sim (até 5 imagens de entrada)     | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Não                                | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Sim (até 5 imagens)                | `XAI_API_KEY`                                         |

Use `action: "list"` para inspecionar provedores e modelos disponíveis em runtime:

```text
/tool image_generate action=list
```

## Capacidades dos provedores

| Capacidade            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| Gerar (contagem máxima) | Definido pelo workflow | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| Edição / referência   | 1 imagem (workflow) | 1 imagem  | 1 imagem          | Até 5 imagens  | 1 imagem (ref. de assunto) | Até 5 imagens | —     | Até 5 imagens |
| Controle de tamanho   | —                  | ✓         | ✓                 | ✓              | —                     | Até 4K         | —     | —              |
| Proporção             | —                  | —         | ✓ (somente geração) | ✓              | ✓                     | —              | —     | ✓              |
| Resolução (1K/2K/4K)  | —                  | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
  Prompt de geração de imagem. Obrigatório para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Use `"list"` para inspecionar provedores e modelos disponíveis em runtime.
</ParamField>
<ParamField path="model" type="string">
  Substituição de provedor/modelo (por exemplo, `openai/gpt-image-2`). Use
  `openai/gpt-image-1.5` para fundos transparentes da OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Caminho ou URL de uma única imagem de referência para o modo de edição.
</ParamField>
<ParamField path="images" type="string[]">
  Várias imagens de referência para o modo de edição (até 5 em provedores compatíveis).
</ParamField>
<ParamField path="size" type="string">
  Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Dica de resolução.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Dica de qualidade quando o provedor oferece suporte.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Dica de formato de saída quando o provedor oferece suporte.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Dica de fundo quando o provedor oferece suporte. Use `transparent` com
  `outputFormat: "png"` ou `"webp"` para provedores compatíveis com transparência.
</ParamField>
<ParamField path="count" type="number">Número de imagens a gerar (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Timeout opcional da solicitação ao provedor em milissegundos.</ParamField>
<ParamField path="filename" type="string">Dica de nome do arquivo de saída.</ParamField>
<ParamField path="openai" type="object">
  Dicas somente para OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. Quando um provedor de fallback oferece suporte a uma
opção de geometria próxima em vez da opção exata solicitada, o OpenClaw remapeia para
o tamanho, a proporção ou a resolução compatível mais próxima antes do envio.
Dicas de saída não compatíveis são descartadas para provedores que não declaram
suporte e relatadas no resultado da ferramenta. Os resultados da ferramenta relatam as
configurações aplicadas; `details.normalization` captura qualquer tradução
de solicitado para aplicado.
</Note>

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

### Ordem de seleção de provedores

O OpenClaw tenta os provedores nesta ordem:

1. **Parâmetro `model`** da chamada da ferramenta (se o agente especificar um).
2. **`imageGenerationModel.primary`** da configuração.
3. **`imageGenerationModel.fallbacks`** em ordem.
4. **Detecção automática** — somente padrões de provedores com autenticação:
   - provedor padrão atual primeiro;
   - demais provedores de geração de imagens registrados em ordem de id do provedor.

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo
candidato configurado será tentado automaticamente. Se todos falharem, o erro inclui detalhes
de cada tentativa.

<AccordionGroup>
  <Accordion title="Substituições de modelo por chamada são exatas">
    Uma substituição `model` por chamada tenta somente esse provedor/modelo e
    não continua para provedores primários/fallback configurados ou detectados automaticamente.
  </Accordion>
  <Accordion title="A detecção automática considera autenticação">
    Um padrão de provedor só entra na lista de candidatos quando o OpenClaw consegue
    autenticar esse provedor de fato. Defina
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar somente
    entradas explícitas de `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Defina `agents.defaults.imageGenerationModel.timeoutMs` para backends de imagem lentos.
    Um parâmetro de ferramenta `timeoutMs` por chamada substitui o padrão
    configurado.
  </Accordion>
  <Accordion title="Inspecionar em runtime">
    Use `action: "list"` para inspecionar os provedores registrados no momento,
    seus modelos padrão e dicas de variáveis de ambiente de autenticação.
  </Accordion>
</AccordionGroup>

### Edição de imagens

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI e xAI oferecem suporte à edição
de imagens de referência. Passe um caminho ou URL de imagem de referência:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI oferecem suporte a até 5 imagens de referência por meio do
parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

## Análises detalhadas de provedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (e gpt-image-1.5)">
    A geração de imagens da OpenAI usa `openai/gpt-image-2` por padrão. Se um
    perfil OAuth `openai-codex` estiver configurado, o OpenClaw reutiliza o mesmo
    perfil OAuth usado pelos modelos de chat de assinatura do Codex e envia a
    solicitação de imagem pelo backend de Responses do Codex. URLs base legadas
    do Codex, como `https://chatgpt.com/backend-api`, são canonicalizadas para
    `https://chatgpt.com/backend-api/codex` em solicitações de imagem. O OpenClaw
    **não** recorre silenciosamente a `OPENAI_API_KEY` para essa solicitação —
    para forçar o roteamento direto pela API Images da OpenAI, configure
    `models.providers.openai` explicitamente com uma chave de API, URL base
    personalizada ou endpoint do Azure.

    Os modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` e
    `openai/gpt-image-1-mini` ainda podem ser selecionados explicitamente. Use
    `gpt-image-1.5` para saída PNG/WebP com fundo transparente; a API atual do
    `gpt-image-2` rejeita `background: "transparent"`.

    `gpt-image-2` é compatível tanto com geração de texto para imagem quanto com
    edição de imagens de referência pela mesma ferramenta `image_generate`.
    O OpenClaw encaminha `prompt`, `count`, `size`, `quality`, `outputFormat`
    e imagens de referência para a OpenAI. A OpenAI **não** recebe
    `aspectRatio` ou `resolution` diretamente; quando possível, o OpenClaw mapeia
    esses valores para um `size` compatível, caso contrário a ferramenta os relata
    como substituições ignoradas.

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

    `openai.background` aceita `transparent`, `opaque` ou `auto`;
    saídas transparentes exigem `outputFormat` `png` ou `webp` e um
    modelo de imagem da OpenAI compatível com transparência. O OpenClaw roteia
    solicitações padrão do `gpt-image-2` com fundo transparente para `gpt-image-1.5`.
    `openai.outputCompression` se aplica a saídas JPEG/WebP.

    A dica de nível superior `background` é neutra em relação ao provedor e atualmente
    é mapeada para o mesmo campo de solicitação `background` da OpenAI quando o provedor
    OpenAI é selecionado. Provedores que não declaram suporte a fundo a retornam em
    `ignoredOverrides` em vez de receber o parâmetro não compatível.

    Para rotear a geração de imagens da OpenAI por uma implantação do Azure OpenAI
    em vez de `api.openai.com`, consulte
    [endpoints do Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Modelos de imagem do OpenRouter">
    A geração de imagens do OpenRouter usa a mesma `OPENROUTER_API_KEY` e
    roteia pela API de imagens de conclusões de chat do OpenRouter. Selecione
    modelos de imagem do OpenRouter com o prefixo `openrouter/`:

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

    O OpenClaw encaminha `prompt`, `count`, imagens de referência e dicas de
    `aspectRatio` / `resolution` compatíveis com Gemini para o OpenRouter.
    Os atalhos atuais integrados de modelos de imagem do OpenRouter incluem
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Use
    `action: "list"` para ver o que seu Plugin configurado expõe.

  </Accordion>
  <Accordion title="Autenticação dupla do MiniMax">
    A geração de imagens do MiniMax está disponível pelos dois caminhos de autenticação
    integrados do MiniMax:

    - `minimax/image-01` para configurações com chave de API
    - `minimax-portal/image-01` para configurações com OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    O provedor xAI integrado usa `/v1/images/generations` para solicitações somente
    com prompt e `/v1/images/edits` quando `image` ou `images` está presente.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Contagem: até 4
    - Referências: uma `image` ou até cinco `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

    O OpenClaw intencionalmente não expõe `quality`, `mask`, `user` nativos da xAI
    nem proporções extras exclusivas do provedor até que esses controles existam
    no contrato compartilhado entre provedores de `image_generate`.

  </Accordion>
</AccordionGroup>

## Exemplos

<Tabs>
  <Tab title="Gerar (paisagem 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Gerar (PNG transparente)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Gerar (duas quadradas)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Editar (uma referência)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Editar (múltiplas referências)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

As mesmas flags `--output-format` e `--background` estão disponíveis em
`openclaw infer image edit`; `--openai-background` permanece como um
alias específico da OpenAI. Provedores integrados que não sejam a OpenAI não declaram
controle explícito de fundo atualmente, portanto `background: "transparent"` é relatado
como ignorado para eles.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [ComfyUI](/pt-BR/providers/comfy) — configuração de fluxo de trabalho local do ComfyUI e do Comfy Cloud
- [fal](/pt-BR/providers/fal) — configuração do provedor de imagem e vídeo fal
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provedor de imagens Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provedor de imagens MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala do Vydra
- [xAI](/pt-BR/providers/xai) — configuração de imagem, vídeo, busca, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — configuração de `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) — configuração de modelos e failover
