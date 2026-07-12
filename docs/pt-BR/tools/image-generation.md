---
read_when:
    - Geração ou edição de imagens por meio do agente
    - Configurando provedores e modelos de geração de imagens
    - Entendendo os parâmetros da ferramenta image_generate
sidebarTitle: Image generation
summary: Gere e edite imagens por meio de image_generate no OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI e Vydra
title: Geração de imagens
x-i18n:
    generated_at: "2026-07-12T00:25:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

A ferramenta `image_generate` cria e edita imagens por meio dos provedores
configurados. Em sessões de chat, ela é executada de forma assíncrona: o OpenClaw
registra uma tarefa em segundo plano, retorna imediatamente o id da tarefa e
reativa o agente quando o provedor conclui. O agente de conclusão segue o modo
normal de resposta visível da sessão: entrega automática da resposta final
quando configurada ou `message(action="send")` quando a sessão exige a
ferramenta de mensagens. Se a sessão solicitante estiver inativa ou sua
reativação ativa falhar, o OpenClaw enviará diretamente um fallback idempotente
com as imagens geradas para que o resultado não seja perdido.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagens
está disponível. Se você não vir `image_generate` entre as ferramentas do
agente, configure `agents.defaults.imageGenerationModel`, defina uma chave de
API de provedor ou entre com o OAuth do OpenAI ChatGPT/Codex.
</Note>

## Início rápido

<Steps>
  <Step title="Configurar a autenticação">
    Defina uma chave de API para pelo menos um provedor (por exemplo,
    `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) ou entre com o
    OAuth do OpenAI Codex.
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

    O OAuth do ChatGPT/Codex usa a mesma referência de modelo
    `openai/gpt-image-2`. Quando um perfil OAuth `openai` está configurado, o
    OpenClaw encaminha as solicitações de imagem por esse perfil OAuth, em vez
    de tentar primeiro `OPENAI_API_KEY`. Uma configuração explícita de
    `models.providers.openai` (chave de API, URL base personalizada/do Azure)
    volta a habilitar a rota direta da API de Imagens da OpenAI.

  </Step>
  <Step title="Pedir ao agente">
    _"Gere uma imagem de um mascote robô simpático."_

    O agente chama `image_generate` automaticamente. Não é necessário incluir
    a ferramenta em uma lista de permissões — ela é habilitada por padrão
    quando um provedor está disponível. A ferramenta retorna o id de uma tarefa
    em segundo plano e, quando ela estiver pronta, o agente de conclusão envia o
    anexo gerado por meio da ferramenta `message`.

  </Step>
</Steps>

<Warning>
Para endpoints de LAN compatíveis com a OpenAI, como o LocalAI, mantenha o
`models.providers.openai.baseUrl` personalizado e habilite-o explicitamente
com `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Endpoints de
imagem privados e internos permanecem bloqueados por padrão.
</Warning>

## Rotas comuns

| Objetivo                                                    | Referência do modelo                                | Autenticação                            |
| ----------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Geração de imagens da OpenAI com cobrança por API           | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                        |
| Geração de imagens da OpenAI com autenticação da assinatura Codex | `openai/gpt-image-2`                           | OAuth do OpenAI ChatGPT/Codex           |
| PNG/WebP da OpenAI com fundo transparente                   | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` ou OAuth do OpenAI Codex |
| Geração de imagens com DeepInfra                            | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                     |
| Geração expressiva/orientada por estilo do fal Krea 2       | `fal/krea/v2/medium/text-to-image`                  | `FAL_KEY`                               |
| Geração de imagens com OpenRouter                           | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                    |
| Geração de imagens com LiteLLM                              | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                       |
| Geração de imagens com Microsoft Foundry MAI                | `microsoft-foundry/<deployment-name>`               | `AZURE_OPENAI_API_KEY` ou Entra ID      |
| Geração de imagens com Google Gemini                        | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`    |

A mesma ferramenta processa a geração de texto para imagem e a edição com
imagens de referência. Use `image` para uma referência ou `images` para várias.
Para modelos Krea 2 no fal, essas referências são enviadas como referências de
estilo, em vez de entradas de edição. As opções de saída compatíveis com o
provedor, como `quality`, `outputFormat` e `background`, são encaminhadas
quando disponíveis e informadas como ignoradas quando um provedor não declara
compatibilidade. A compatibilidade integrada com fundos transparentes é
específica da OpenAI; outros provedores ainda podem preservar o canal alfa do
PNG se o backend deles o emitir.

## Provedores compatíveis

| Provedor          | Modelo padrão                           | Compatibilidade com edição                         | Autenticação                                           |
| ----------------- | --------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| ComfyUI           | `workflow`                              | Sim (1 imagem, configurada no fluxo de trabalho)   | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para a nuvem  |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Sim (1 imagem)                                     | `DEEPINFRA_API_KEY`                                    |
| fal               | `fal-ai/flux/dev`                       | Sim (limites específicos do modelo)                | `FAL_KEY`                                              |
| Google            | `gemini-3.1-flash-image-preview`        | Sim (até 5 imagens)                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                   |
| LiteLLM           | `gpt-image-2`                           | Sim (até 5 imagens de entrada)                     | `LITELLM_API_KEY`                                      |
| Microsoft Foundry | `<deployment-name>`                     | Sim (somente modelos MAI-Image-2.5)                | `AZURE_OPENAI_API_KEY` ou Entra ID (`az login`)        |
| MiniMax           | `image-01`                              | Sim (referência de sujeito)                        | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Sim (até 5 imagens)                                | `OPENAI_API_KEY` ou OAuth do OpenAI ChatGPT/Codex      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Sim (até 5 imagens de entrada)                     | `OPENROUTER_API_KEY`                                   |
| Vydra             | `grok-imagine`                          | Não                                                | `VYDRA_API_KEY`                                        |
| xAI               | `grok-imagine-image`                    | Sim (até 3 imagens)                                | `XAI_API_KEY`                                          |

Use `action: "list"` para inspecionar os provedores e modelos disponíveis em
tempo de execução:

```text
/tool image_generate action=list
```

Use `action: "status"` para inspecionar a tarefa ativa de geração de imagens da
sessão atual:

```text
/tool image_generate action=status
```

## Recursos dos provedores

| Recurso                  | ComfyUI                       | DeepInfra | fal                                                   | Google        | Microsoft Foundry | MiniMax                          | OpenAI        | Vydra | xAI           |
| ------------------------ | ----------------------------- | --------- | ----------------------------------------------------- | ------------- | ----------------- | -------------------------------- | ------------- | ----- | ------------- |
| Gerar (quantidade máxima) | 1                            | 4         | 4                                                     | 4             | 1                 | 9                                | 4             | 1     | 4             |
| Editar / referência      | 1 imagem (fluxo de trabalho)  | 1 imagem  | Flux: 1; GPT: 10; refs. de estilo Krea: 10; NB2: 14   | Até 5 imagens | 1 imagem          | 1 imagem (ref. de sujeito)       | Até 5 imagens | -     | Até 3 imagens |
| Controle de tamanho      | -                             | ✓         | ✓                                                     | ✓             | ✓                 | -                                | Até 4K        | -     | -             |
| Proporção                | -                             | -         | ✓                                                     | ✓             | -                 | ✓                                | -             | -     | ✓             |
| Resolução (1K/2K/4K)     | -                             | -         | ✓                                                     | ✓             | -                 | -                                | -             | -     | 1K, 2K        |

## Parâmetros da ferramenta

<ParamField path="prompt" type="string" required>
  Prompt de geração de imagem. Obrigatório para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Use `"status"` para inspecionar a tarefa ativa da sessão ou `"list"` para
  inspecionar os provedores e modelos disponíveis em tempo de execução.
</ParamField>
<ParamField path="model" type="string">
  Substituição de provedor/modelo (por exemplo, `openai/gpt-image-2`). Use
  `openai/gpt-image-1.5` para fundos transparentes da OpenAI.
</ParamField>
<ParamField path="image" type="string">
  Caminho ou URL de uma única imagem de referência para o modo de edição.
</ParamField>
<ParamField path="images" type="string[]">
  Várias imagens de referência para o modo de edição ou modelos com referências
  de estilo (até 14 pela ferramenta compartilhada; os limites específicos do
  provedor ainda se aplicam).
</ParamField>
<ParamField path="size" type="string">
  Indicação de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`,
  `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Proporção: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Os provedores validam o subconjunto específico de cada
  modelo.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Indicação de resolução.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Indicação de qualidade quando o provedor oferece compatibilidade.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Indicação de formato de saída quando o provedor oferece compatibilidade.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Indicação de fundo quando o provedor oferece compatibilidade. Use
  `transparent` com `outputFormat: "png"` ou `"webp"` para provedores que
  oferecem transparência.
</ParamField>
<ParamField path="count" type="number">Número de imagens a gerar (1 a 4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Tempo limite opcional da solicitação ao provedor, em milissegundos. Quando o
  Codex chama `image_generate` por meio de ferramentas dinâmicas, esse valor por
  chamada ainda substitui o padrão configurado e é limitado a 600000 ms.
</ParamField>
<ParamField path="filename" type="string">Indicação do nome do arquivo de saída.</ParamField>
<ParamField path="openai" type="object">
  Opções exclusivas da OpenAI: `background`, `moderation`, `outputCompression`
  e `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Controle de criatividade do fal Krea 2. O padrão é `medium`.
</ParamField>

<Note>
Nem todos os provedores oferecem compatibilidade com todos os parâmetros.
Quando um provedor de fallback oferece uma opção de geometria próxima, em vez
da opção exata solicitada, o OpenClaw remapeia para o tamanho, a proporção ou a
resolução compatível mais próxima antes do envio. Opções de saída não
compatíveis são descartadas para provedores que não declaram compatibilidade e
informadas no resultado da ferramenta. Os resultados da ferramenta informam as
configurações aplicadas; `details.normalization` registra qualquer conversão
entre o valor solicitado e o aplicado.
</Note>

## Configuração

### Seleção do modelo

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

### Ordem de seleção dos provedores

O OpenClaw tenta os provedores nesta ordem:

1. Parâmetro **`model`** da chamada da ferramenta (se o agente especificar um).
2. **`imageGenerationModel.primary`** da configuração.
3. **`imageGenerationModel.fallbacks`** na ordem definida.
4. **Detecção automática** — somente padrões de provedores com autenticação disponível:
   - primeiro, o provedor padrão atual;
   - depois, os demais provedores de geração de imagens registrados, ordenados pelo ID do provedor.

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo
candidato configurado será tentado automaticamente. Se todos falharem, o erro
incluirá detalhes de cada tentativa.

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    Uma substituição de `model` por chamada tenta somente esse provedor/modelo e
    não continua para o provedor primário, os fallbacks configurados nem os
    provedores detectados automaticamente.
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    O padrão de um provedor somente entra na lista de candidatos quando o
    OpenClaw consegue realmente autenticar esse provedor. Defina
    `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar
    somente as entradas explícitas de `model`, `primary` e `fallbacks`.
  </Accordion>
  <Accordion title="Timeouts">
    Defina `agents.defaults.imageGenerationModel.timeoutMs` para backends lentos
    de imagem. Um parâmetro `timeoutMs` da ferramenta por chamada substitui o
    padrão configurado, e os padrões configurados substituem os padrões do
    provedor definidos pelo Plugin. Os provedores de imagem hospedados pelo
    Google e pelo OpenRouter usam padrões de 180 segundos; a geração de imagens
    do Microsoft Foundry MAI, xAI e Azure OpenAI usa 600 segundos. As chamadas
    de ferramentas dinâmicas do Codex usam um padrão de 120 segundos para a
    ponte `image_generate` e respeitam o mesmo limite de tempo quando
    configurado, limitado ao máximo de 600000 ms da ponte de ferramentas
    dinâmicas do OpenClaw.
  </Accordion>
  <Accordion title="Inspect at runtime">
    Use `action: "list"` para inspecionar os provedores registrados no momento,
    seus modelos padrão e as indicações de variáveis de ambiente para
    autenticação.
  </Accordion>
</AccordionGroup>

### Edição de imagens

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI e xAI oferecem suporte à edição de imagens de referência. Os modelos
Krea 2 no fal usam os mesmos campos `image` / `images` como referências de
estilo, em vez de entradas para edição. Passe o caminho ou URL de uma imagem
de referência:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter e Google oferecem suporte a até 5 imagens de referência por
meio do parâmetro `images`; o xAI oferece suporte a até 3. O fal oferece
suporte a 1 imagem de referência para Flux image-to-image, até 10 para edições
com GPT Image 2, até 10 referências de estilo para Krea 2 e até 14 para edições
com Nano Banana 2. Microsoft Foundry, MiniMax e ComfyUI oferecem suporte a 1.

## Análises detalhadas dos provedores

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    A geração de imagens da OpenAI usa `openai/gpt-image-2` por padrão. Se um
    perfil OAuth `openai` estiver configurado, o OpenClaw reutilizará o mesmo
    perfil OAuth usado pelos modelos de chat da assinatura do Codex e enviará
    a solicitação de imagem pelo backend Codex Responses. URLs base antigas do
    Codex, como `https://chatgpt.com/backend-api`, são normalizadas para
    `https://chatgpt.com/backend-api/codex` nas solicitações de imagem. O
    OpenClaw **não** recorre silenciosamente a `OPENAI_API_KEY` nessa
    solicitação — para forçar o roteamento direto pela API OpenAI Images,
    configure `models.providers.openai` explicitamente com uma chave de API,
    URL base personalizada ou endpoint do Azure.

    Os modelos `openai/gpt-image-1.5`, `openai/gpt-image-1` e
    `openai/gpt-image-1-mini` ainda podem ser selecionados explicitamente. Use
    `gpt-image-1.5` para gerar PNG/WebP com fundo transparente; a API atual do
    `gpt-image-2` rejeita `background: "transparent"`.

    O `gpt-image-2` oferece suporte tanto à geração de texto para imagem quanto
    à edição de imagens de referência por meio da mesma ferramenta
    `image_generate`. O OpenClaw encaminha `prompt`, `count`, `size`, `quality`,
    `outputFormat` e as imagens de referência para a OpenAI. A OpenAI **não**
    recebe `aspectRatio` nem `resolution` diretamente; quando possível, o
    OpenClaw os converte em um `size` compatível. Caso contrário, a ferramenta
    os informa como substituições ignoradas.

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
    transparentes exigem `outputFormat` igual a `png` ou `webp` e um modelo de
    imagem da OpenAI compatível com transparência. O OpenClaw encaminha
    solicitações de fundo transparente do `gpt-image-2` padrão para o
    `gpt-image-1.5`. `openai.outputCompression` aplica-se às saídas JPEG/WebP e
    é ignorado nas saídas PNG.

    A indicação `background` no nível superior é independente de provedor e,
    atualmente, é mapeada para o mesmo campo `background` da solicitação da
    OpenAI quando esse provedor está selecionado. Os provedores que não
    declaram suporte a fundos retornam essa indicação em `ignoredOverrides`,
    em vez de receberem o parâmetro não compatível.

    Para encaminhar a geração de imagens da OpenAI por uma implantação do
    Azure OpenAI em vez de `api.openai.com`, consulte
    [Endpoints do Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI image models">
    A geração de imagens do Microsoft Foundry usa os nomes das implantações de
    imagem MAI sob o prefixo de provedor `microsoft-foundry/`. Não há um modelo
    padrão no nível do provedor porque a API MAI espera o nome da sua
    implantação no campo `model`:

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

    O provedor usa a API MAI do Microsoft Foundry, não a API OpenAI Images:

    - Endpoint de geração: `/mai/v1/images/generations`
    - Endpoint de edição: `/mai/v1/images/edits`
    - Autenticação: `AZURE_OPENAI_API_KEY` / chave de API do provedor ou Entra ID por meio de `az login`
    - Saída: uma imagem PNG
    - Tamanho: padrão `1024x1024`; largura e altura devem ter pelo menos 768 px
      cada, e o total de pixels deve ser de, no máximo, 1.048.576
    - Edições: uma imagem de referência PNG ou JPEG, compatível somente com
      implantações `MAI-Image-2.5-Flash` e `MAI-Image-2.5`

    A geração somente por prompt pode usar um nome de implantação personalizado
    tendo apenas o endpoint do Foundry configurado. Edições com nomes de
    implantação personalizados precisam de metadados de integração/modelo para
    que o OpenClaw possa verificar se a implantação usa
    `MAI-Image-2.5-Flash` ou `MAI-Image-2.5`.

    Os modelos de imagem MAI atuais são `MAI-Image-2.5-Flash`,
    `MAI-Image-2.5`, `MAI-Image-2e` e `MAI-Image-2`. Consulte o
    [Plugin do Microsoft Foundry](/pt-BR/plugins/reference/microsoft-foundry) para
    saber como configurar e entender o comportamento dos modelos de chat.

  </Accordion>
  <Accordion title="OpenRouter image models">
    A geração de imagens do OpenRouter usa a mesma `OPENROUTER_API_KEY` e é
    encaminhada pela API de imagens de conclusões de chat do OpenRouter.
    Selecione modelos de imagem do OpenRouter com o prefixo `openrouter/`:

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

    O OpenClaw encaminha `prompt`, `count`, imagens de referência e as
    indicações `aspectRatio` / `resolution` compatíveis com o Gemini para o
    OpenRouter. Os atalhos integrados atuais para modelos de imagem do
    OpenRouter incluem `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`. Use
    `action: "list"` para ver o que o Plugin configurado disponibiliza.

  </Accordion>
  <Accordion title="fal Krea 2">
    Os modelos Krea 2 no fal usam o esquema Krea nativo do fal, em vez do
    esquema genérico `image_size` usado pelo Flux. O OpenClaw envia:

    - `aspect_ratio` para indicações de proporção
    - `creativity`, usando `medium` por padrão
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

    Atualmente, o Krea 2 retorna uma imagem por solicitação. Prefira
    `aspectRatio` para o Krea; o OpenClaw mapeia `size` para a proporção
    compatível mais próxima do Krea e rejeita `resolution` para o Krea, em vez
    de descartá-la. Use `fal.creativity` quando quiser um nível de criatividade
    nativo do Krea:

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
    A geração de imagens do MiniMax está disponível pelos dois métodos de
    autenticação integrados do MiniMax:

    - `minimax/image-01` para configurações com chave de API
    - `minimax-portal/image-01` para configurações com OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    O provedor xAI integrado usa `/v1/images/generations` para solicitações
    somente por prompt e `/v1/images/edits` quando `image` ou `images` está
    presente.

    - Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Quantidade: até 4
    - Referências: um `image` ou até três `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Resoluções: `1K`, `2K`
    - Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

    O OpenClaw não disponibiliza intencionalmente `quality`, `mask` e `user`
    nativos do xAI, nem a proporção `auto`, até que esses controles existam no
    contrato compartilhado e independente de provedor de `image_generate`.

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
  <Tab title="Gerar (duas imagens quadradas)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Duas direções visuais para o ícone de um aplicativo de produtividade tranquilo" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Editar (uma referência)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantenha o objeto principal e substitua o fundo por um cenário de estúdio bem iluminado" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Editar (várias referências)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine a identidade do personagem da primeira imagem com a paleta de cores da segunda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Referências de estilo do Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Um retrato editorial expressivo usando esta paleta de cores e textura de impressão" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

As mesmas opções `--output-format`, `--background`, `--quality` e
`--openai-moderation` estão disponíveis em `openclaw infer image edit`;
`--openai-background` permanece como um alias específico da OpenAI. Atualmente,
os provedores incluídos, exceto a OpenAI, não declaram controle explícito do
fundo; portanto, `background: "transparent"` é informado como ignorado para eles.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) - todas as ferramentas de agente disponíveis
- [ComfyUI](/pt-BR/providers/comfy) - configuração de fluxos de trabalho do ComfyUI local e do Comfy Cloud
- [fal](/pt-BR/providers/fal) - configuração do provedor de imagens e vídeos fal
- [Google (Gemini)](/pt-BR/providers/google) - configuração do provedor de imagens Gemini
- [Plugin Microsoft Foundry](/pt-BR/plugins/reference/microsoft-foundry) - configuração de chat do Microsoft Foundry e de imagens MAI
- [MiniMax](/pt-BR/providers/minimax) - configuração do provedor de imagens MiniMax
- [OpenAI](/pt-BR/providers/openai) - configuração do provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) - configuração de imagens, vídeos e fala do Vydra
- [xAI](/pt-BR/providers/xai) - configuração de imagens, vídeos, pesquisa, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - configuração de `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) - configuração de modelos e failover
