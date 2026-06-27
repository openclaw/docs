---
read_when:
    - Gerando ou editando imagens via agente
    - Configurando provedores e modelos de geração de imagens
    - Entendendo os parâmetros da ferramenta image_generate
sidebarTitle: Image generation
summary: Gere e edite imagens por meio de image_generate na OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra
title: Geração de imagens
x-i18n:
    generated_at: "2026-06-27T18:16:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus
provedores configurados. Em sessões de chat, a geração de imagens é executada de forma assíncrona:
o OpenClaw registra uma tarefa em segundo plano, retorna o id da tarefa imediatamente e desperta
o agente quando o provedor termina. O agente de conclusão segue o modo normal de resposta visível
da sessão: entrega automática da resposta final quando
configurado, ou `message(action="send")` quando a sessão exige a ferramenta de mensagem.
Se a sessão solicitante estiver inativa ou sua ativação ativa falhar, e algumas
imagens geradas ainda estiverem ausentes na resposta de conclusão, o OpenClaw envia um
fallback direto idempotente apenas com as imagens ausentes.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagens está
disponível. Se você não vir `image_generate` nas ferramentas do seu agente,
configure `agents.defaults.imageGenerationModel`, configure uma chave de API do provedor
ou entre com OpenAI ChatGPT/Codex OAuth.
</Note>

## Início rápido

<Steps>
  <Step title="Configure auth">
    Defina uma chave de API para pelo menos um provedor (por exemplo `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) ou entre com OpenAI Codex OAuth.
  </Step>
  <Step title="Pick a default model (optional)">
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

    ChatGPT/Codex OAuth usa a mesma referência de modelo `openai/gpt-image-2`. Quando um
    perfil OAuth `openai` está configurado, o OpenClaw roteia solicitações de imagem
    por esse perfil OAuth em vez de primeiro tentar
    `OPENAI_API_KEY`. A configuração explícita `models.providers.openai` (chave de API,
    URL base personalizada/Azure) volta a optar pela rota direta da OpenAI Images API.

  </Step>
  <Step title="Ask the agent">
    _"Gere uma imagem de um mascote robô amigável."_

    O agente chama `image_generate` automaticamente. Não é necessário colocar a ferramenta em uma lista de permissões:
    ela é habilitada por padrão quando um provedor está disponível. A ferramenta
    retorna um id de tarefa em segundo plano, então o agente de conclusão envia o anexo
    gerado pela ferramenta `message` quando ele estiver pronto.

  </Step>
</Steps>

<Warning>
Para endpoints LAN compatíveis com OpenAI, como LocalAI, mantenha o
`models.providers.openai.baseUrl` personalizado e opte explicitamente com
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Endpoints de imagem privados e
internos continuam bloqueados por padrão.
</Warning>

## Rotas comuns

| Objetivo                                             | Referência do modelo                               | Autenticação                          |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| Geração de imagens OpenAI com cobrança por API       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                      |
| Geração de imagens OpenAI com autenticação de assinatura Codex | `openai/gpt-image-2`                    | OpenAI ChatGPT/Codex OAuth            |
| PNG/WebP com fundo transparente OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` ou OpenAI Codex OAuth |
| Geração de imagens DeepInfra                         | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                   |
| Geração expressiva/direcionada por estilo fal Krea 2 | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                             |
| Geração de imagens OpenRouter                        | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                  |
| Geração de imagens LiteLLM                           | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                     |
| Geração de imagens Microsoft Foundry MAI             | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` ou Entra ID    |
| Geração de imagens Google Gemini                     | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`  |

A mesma ferramenta `image_generate` lida com texto-para-imagem e edição com imagem
de referência. Use `image` para uma referência ou `images` para várias referências.
Para modelos Krea 2 no fal, essas referências são enviadas como referências de estilo
em vez de entradas de edição.
Dicas de saída compatíveis com o provedor, como `quality`, `outputFormat` e
`background`, são encaminhadas quando disponíveis e relatadas como ignoradas quando um
provedor não oferece suporte a elas. O suporte integrado a fundo transparente é
específico da OpenAI; outros provedores ainda podem preservar o alfa de PNG se o
backend deles o emitir.

## Provedores compatíveis

| Provedor          | Modelo padrão                          | Suporte a edição                    | Autenticação                                          |
| ----------------- | -------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                             | Sim (1 imagem, configurada por workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`     | Sim (1 imagem)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                      | Sim (limites específicos do modelo) | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`       | Sim                                 | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                          | Sim (até 5 imagens de entrada)      | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                    | Sim (somente modelos MAI-Image-2.5) | `AZURE_OPENAI_API_KEY` ou Entra ID (`az login`)       |
| MiniMax           | `image-01`                             | Sim (referência de assunto)         | `MINIMAX_API_KEY` ou MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                          | Sim (até 4 imagens)                 | `OPENAI_API_KEY` ou OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Sim (até 5 imagens de entrada)     | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                         | Não                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                   | Sim (até 5 imagens)                 | `XAI_API_KEY`                                         |

Use `action: "list"` para inspecionar provedores e modelos disponíveis em tempo de execução:

```text
/tool image_generate action=list
```

Use `action: "status"` para inspecionar a tarefa ativa de geração de imagens para a
sessão atual:

```text
/tool image_generate action=status
```

## Recursos dos provedores

| Recurso               | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Gerar (contagem máxima) | Definido pelo workflow | 4     | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Edição / referência   | 1 imagem (workflow) | 1 imagem | Flux: 1; GPT: 10; refs de estilo Krea: 10; NB2: 14 | Até 5 imagens | 1 imagem          | 1 imagem (ref de assunto) | Até 5 imagens | -     | Até 5 imagens |
| Controle de tamanho   | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Até 4K         | -     | -              |
| Proporção             | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Resolução (1K/2K/4K)  | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
  Prompt de geração de imagens. Obrigatório para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Use `"status"` para inspecionar a tarefa ativa da sessão ou `"list"` para inspecionar
  provedores e modelos disponíveis em tempo de execução.
</ParamField>
<ParamField path="model" type="string">
  Substituição de provedor/modelo (por exemplo, `openai/gpt-image-2`). Use
  `openai/gpt-image-1.5` para fundos transparentes da OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Caminho ou URL de uma única imagem de referência para o modo de edição.
</ParamField>
<ParamField path="images" type="string[]">
  Várias imagens de referência para modo de edição ou modelos de referência de estilo (até 10
  pela ferramenta compartilhada; limites específicos do provedor ainda se aplicam).
</ParamField>
<ParamField path="size" type="string">
  Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporção: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Os provedores
  validam seu subconjunto específico do modelo.
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
<ParamField path="count" type="number">Número de imagens a gerar (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Timeout opcional da solicitação ao provedor em milissegundos. Quando Codex chama
  `image_generate` por ferramentas dinâmicas, esse valor por chamada ainda substitui
  o padrão configurado e é limitado a 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Dica de nome de arquivo de saída.</ParamField>
<ParamField path="openai" type="object">
  Dicas exclusivas da OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Controle de criatividade do fal Krea 2. O padrão é `medium`.
</ParamField>

<Note>
Nem todos os provedores oferecem suporte a todos os parâmetros. Quando um provedor de fallback oferece suporte a uma
opção de geometria próxima em vez da opção exata solicitada, o OpenClaw remapeia para
o tamanho, a proporção ou a resolução compatível mais próxima antes do envio.
Dicas de saída sem suporte são descartadas para provedores que não declaram
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

O OpenClaw tenta provedores nesta ordem:

1. Parâmetro **`model`** da chamada de ferramenta (se o agente especificar um).
2. **`imageGenerationModel.primary`** da configuração.
3. **`imageGenerationModel.fallbacks`** em ordem.
4. **Detecção automática** - somente padrões de provedor com auth:
   - provedor padrão atual primeiro;
   - demais provedores de geração de imagens registrados em ordem de ID de provedor.

Se um provedor falhar (erro de auth, limite de taxa etc.), o próximo
candidato configurado será tentado automaticamente. Se todos falharem, o erro
inclui detalhes de cada tentativa.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Uma substituição de `model` por chamada tenta somente esse provedor/modelo e
    não continua para provedores primário/substitutos configurados ou detectados
    automaticamente.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    Um padrão de provedor só entra na lista de candidatos quando o OpenClaw
    consegue realmente autenticar esse provedor. Defina
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
    somente entradas explícitas de `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Defina `agents.defaults.imageGenerationModel.timeoutMs` para backends de
    imagem lentos. Um parâmetro de ferramenta `timeoutMs` por chamada substitui o
    padrão configurado, e padrões configurados substituem padrões de provedor
    criados por Plugin. Provedores de imagem hospedados do Google e OpenRouter
    usam padrões de 180 segundos; geração de imagens do Microsoft Foundry MAI,
    xAI e Azure OpenAI usa 600 segundos. Chamadas de ferramenta dinâmica do
    Codex usam um padrão de ponte `image_generate` de 120 segundos e respeitam o
    mesmo orçamento de timeout quando configurado, limitado pelo máximo de
    600000 ms da ponte de ferramenta dinâmica do OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Use `action: "list"` para inspecionar os provedores registrados atualmente,
    seus modelos padrão e dicas de variáveis de ambiente de auth.
  </Accordion>
</AccordionGroup>

### Edição de imagens

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI e xAI oferecem suporte à edição de imagens de referência. Modelos Krea 2
no fal usam os mesmos campos `image` / `images` como referências de estilo em
vez de entradas de edição. Passe um caminho ou URL de imagem de referência:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI oferecem suporte a até 5 imagens de referência
por meio do parâmetro `images`. fal oferece suporte a 1 imagem de referência
para Flux imagem-para-imagem, até 10 para edições do GPT Image 2, até 10
referências de estilo para Krea 2 e até 14 para edições do Nano Banana 2.
Microsoft Foundry, MiniMax e ComfyUI oferecem suporte a 1.

## Análises detalhadas de provedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    A geração de imagens da OpenAI usa `openai/gpt-image-2` por padrão. Se um
    perfil OAuth `openai` estiver configurado, o OpenClaw reutiliza o mesmo
    perfil OAuth usado pelos modelos de chat por assinatura do Codex e envia a
    solicitação de imagem pelo backend Codex Responses. URLs base legadas do
    Codex, como `https://chatgpt.com/backend-api`, são canonicalizadas para
    `https://chatgpt.com/backend-api/codex` em solicitações de imagem. O
    OpenClaw **não** recorre silenciosamente a `OPENAI_API_KEY` para essa
    solicitação - para forçar o roteamento direto pela OpenAI Images API,
    configure `models.providers.openai` explicitamente com uma chave de API, URL
    base personalizada ou endpoint do Azure.

    Os modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` e
    `openai/gpt-image-1-mini` ainda podem ser selecionados explicitamente. Use
    `gpt-image-1.5` para saída PNG/WebP com fundo transparente; a API atual de
    `gpt-image-2` rejeita `background: "transparent"`.

    `gpt-image-2` oferece suporte tanto à geração texto-para-imagem quanto à
    edição com imagem de referência pela mesma ferramenta `image_generate`.
    O OpenClaw encaminha `prompt`, `count`, `size`, `quality`, `outputFormat`
    e imagens de referência para a OpenAI. A OpenAI **não** recebe
    `aspectRatio` ou `resolution` diretamente; quando possível, o OpenClaw
    mapeia esses valores para um `size` compatível, caso contrário a ferramenta
    os relata como substituições ignoradas.

    Opções específicas da OpenAI ficam no objeto `openai`:

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
    saídas transparentes exigem `outputFormat` `png` ou `webp` e um modelo de
    imagem OpenAI compatível com transparência. O OpenClaw roteia solicitações
    padrão de fundo transparente de `gpt-image-2` para `gpt-image-1.5`.
    `openai.outputCompression` se aplica a saídas JPEG/WebP e é ignorado para
    saídas PNG.

    A dica de nível superior `background` é neutra em relação ao provedor e
    atualmente mapeia para o mesmo campo de solicitação `background` da OpenAI
    quando o provedor OpenAI é selecionado. Provedores que não declaram suporte
    a fundo retornam isso em `ignoredOverrides` em vez de receber o parâmetro sem
    suporte.

    Para rotear a geração de imagens da OpenAI por uma implantação do Azure
    OpenAI em vez de `api.openai.com`, consulte
    [endpoints do Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    A geração de imagens do Microsoft Foundry usa nomes de implantação de
    imagem MAI implantados sob o prefixo de provedor `microsoft-foundry/`.
    Não há modelo padrão em nível de provedor porque a API MAI espera o nome da
    sua implantação no campo `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    O provedor usa a API MAI do Microsoft Foundry, não a OpenAI Images API:

    - Endpoint de geração: `/mai/v1/images/generations`
    - Endpoint de edição: `/mai/v1/images/edits`
    - Auth: `AZURE_OPENAI_API_KEY` / chave de API do provedor, ou Entra ID via `az login`
    - Saída: uma imagem PNG
    - Tamanho: padrão `1024x1024`; largura e altura devem ter pelo menos 768 px cada,
      e o total de pixels deve ser no máximo 1.048.576
    - Edições: uma imagem de referência PNG ou JPEG, compatível somente com
      implantações `MAI-Image-2.5-Flash` e `MAI-Image-2.5`

    Geração somente por prompt pode usar um nome de implantação personalizado
    com apenas o endpoint Foundry configurado. Edições com nomes de implantação
    personalizados precisam de metadados de onboarding/modelo para que o
    OpenClaw possa verificar que a implantação é baseada em `MAI-Image-2.5-Flash`
    ou `MAI-Image-2.5`.

    Os modelos de imagem MAI atuais são `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` e `MAI-Image-2`. Consulte o
    [Plugin Microsoft Foundry](/pt-BR/plugins/reference/microsoft-foundry) para
    configuração e comportamento de modelos de chat.

  </Accordion>
  <Accordion title="OpenRouter image models">
    A geração de imagens do OpenRouter usa a mesma `OPENROUTER_API_KEY` e
    roteia pela API de imagem de conclusões de chat do OpenRouter. Selecione
    modelos de imagem OpenRouter com o prefixo `openrouter/`:

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

    O OpenClaw encaminha `prompt`, `count`, imagens de referência e dicas
    compatíveis com Gemini de `aspectRatio` / `resolution` para o OpenRouter.
    Os atalhos atuais integrados de modelo de imagem OpenRouter incluem
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Use
    `action: "list"` para ver o que seu Plugin configurado expõe.

  </Accordion>
  <Accordion title="fal Krea 2">
    Modelos Krea 2 no fal usam o schema Krea nativo do fal em vez do schema
    genérico `image_size` usado pelo Flux. O OpenClaw envia:

    - `aspect_ratio` para dicas de proporção
    - `creativity`, com padrão `medium`
    - `image_style_references` quando `image` ou `images` são fornecidos

    Selecione Krea 2 Medium para ilustrações expressivas mais rápidas e Krea 2
    Large para visuais fotorrealistas e texturizados mais lentos e detalhados:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    No momento, Krea 2 retorna uma imagem por solicitação. Prefira
    `aspectRatio` para Krea; o OpenClaw mapeia `size` para a proporção Krea
    compatível mais próxima e rejeita `resolution` para Krea em vez de descartá-la.
    Use `fal.creativity` quando quiser um nível de criatividade nativo do Krea:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    A geração de imagens MiniMax está disponível pelos dois caminhos de auth
    MiniMax integrados:

    - `minimax/image-01` para configurações com chave de API
    - `minimax-portal/image-01` para configurações com OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    O provedor xAI integrado usa `/v1/images/generations` para solicitações
    somente por prompt e `/v1/images/edits` quando `image` ou `images` está
    presente.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Contagem: até 4
    - Referências: um `image` ou até cinco `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

    O OpenClaw intencionalmente não expõe `quality`, `mask`, `user` nativos da
    xAI nem proporções extras apenas nativas até que esses controles existam no
    contrato compartilhado entre provedores `image_generate`.

  </Accordion>
</AccordionGroup>

## Exemplos

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
  <Tab title="Generate (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI equivalente:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

As mesmas flags `--output-format`, `--background`, `--quality` e
`--openai-moderation` estão disponíveis em `openclaw infer image edit`;
`--openai-background` permanece como um alias específico da OpenAI. Provedores
incluídos além da OpenAI não declaram controle explícito de fundo hoje, então
`background: "transparent"` é informado como ignorado para eles.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
- [ComfyUI](/pt-BR/providers/comfy) - configuração de fluxo de trabalho local do ComfyUI e do Comfy Cloud
- [fal](/pt-BR/providers/fal) - configuração do provedor de imagem e vídeo fal
- [Google (Gemini)](/pt-BR/providers/google) - configuração do provedor de imagem Gemini
- [Plugin Microsoft Foundry](/pt-BR/plugins/reference/microsoft-foundry) - configuração de chat do Microsoft Foundry e imagem MAI
- [MiniMax](/pt-BR/providers/minimax) - configuração do provedor de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) - configuração do provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) - configuração de imagem, vídeo e fala do Vydra
- [xAI](/pt-BR/providers/xai) - configuração de imagem, vídeo, pesquisa, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - configuração `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) - configuração de modelos e failover
