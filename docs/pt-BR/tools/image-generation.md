---
read_when:
    - Gerando imagens via o agente
    - Configurando providers e modelos de geração de imagem
    - Entendendo os parâmetros da ferramenta `image_generate`
summary: Gerar e editar imagens usando providers configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Geração de imagem
x-i18n:
    generated_at: "2026-04-23T14:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# Geração de imagem

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus providers configurados. Imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provider de geração de imagem está disponível. Se você não vir `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel` ou defina uma chave de API de provider.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provider (por exemplo `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
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

3. Peça ao agente: _"Gere uma imagem de um mascote de lagosta amigável."_

O agente chama `image_generate` automaticamente. Nenhuma allowlist de ferramenta é necessária — ela é habilitada por padrão quando um provider está disponível.

## Providers compatíveis

| Provider | Modelo padrão                   | Suporte a edição                  | Chave de API                                            |
| -------- | ------------------------------- | --------------------------------- | ------------------------------------------------------- |
| OpenAI   | `gpt-image-2`                   | Sim (até 5 imagens)               | `OPENAI_API_KEY`                                        |
| Google   | `gemini-3.1-flash-image-preview`| Sim                               | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`               | Sim                               | `FAL_KEY`                                               |
| MiniMax  | `image-01`                      | Sim (referência de assunto)       | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                      | Sim (1 imagem, configurada pelo workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para nuvem |
| Vydra    | `grok-imagine`                  | Não                               | `VYDRA_API_KEY`                                         |
| xAI      | `grok-imagine-image`            | Sim (até 5 imagens)               | `XAI_API_KEY`                                           |

Use `action: "list"` para inspecionar providers e modelos disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

| Parâmetro    | Tipo      | Descrição                                                                            |
| ------------ | --------- | ------------------------------------------------------------------------------------ |
| `prompt`     | string    | Prompt de geração de imagem (obrigatório para `action: "generate"`)                  |
| `action`     | string    | `"generate"` (padrão) ou `"list"` para inspecionar providers                         |
| `model`      | string    | Substituição de provider/model, por exemplo `openai/gpt-image-2`                     |
| `image`      | string    | Caminho ou URL de uma única imagem de referência para modo de edição                 |
| `images`     | string[]  | Várias imagens de referência para modo de edição (até 5)                             |
| `size`       | string    | Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`     |
| `aspectRatio`| string    | Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`  |
| `resolution` | string    | Dica de resolução: `1K`, `2K` ou `4K`                                                |
| `count`      | number    | Número de imagens a gerar (1–4)                                                      |
| `filename`   | string    | Dica de nome de arquivo de saída                                                     |

Nem todos os providers oferecem suporte a todos os parâmetros. Quando um provider de fallback oferece suporte a uma opção de geometria próxima em vez da solicitada exatamente, o OpenClaw remapeia para o tamanho, a proporção ou a resolução compatível mais próxima antes do envio. Substituições realmente não compatíveis ainda são relatadas no resultado da ferramenta.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia geometria durante o fallback de provider, os valores retornados de `size`, `aspectRatio` e `resolution` refletem o que foi realmente enviado, e `details.normalization` registra a tradução entre solicitado e aplicado.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordem de seleção de provider

Ao gerar uma imagem, o OpenClaw tenta os providers nesta ordem:

1. **Parâmetro `model`** da chamada da ferramenta (se o agente especificar um)
2. **`imageGenerationModel.primary`** da configuração
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Detecção automática** — usa apenas padrões de provider com autenticação disponível:
   - provider padrão atual primeiro
   - demais providers de geração de imagem registrados em ordem de ID do provider

Se um provider falhar (erro de autenticação, limite de taxa etc.), o próximo candidato é tentado automaticamente. Se todos falharem, o erro inclui detalhes de cada tentativa.

Observações:

- A detecção automática considera autenticação. Um padrão de provider só entra na lista de candidatos
  quando o OpenClaw realmente consegue autenticar esse provider.
- A detecção automática é habilitada por padrão. Defina
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a geração de imagem
  use apenas as entradas explícitas `model`, `primary` e `fallbacks`.
- Use `action: "list"` para inspecionar os providers atualmente registrados, seus
  modelos padrão e dicas de variáveis de ambiente para autenticação.

### Edição de imagem

OpenAI, Google, fal, MiniMax, ComfyUI e xAI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, Google e xAI oferecem suporte a até 5 imagens de referência por meio do parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

### OpenAI `gpt-image-2`

A geração de imagem do OpenAI usa por padrão `openai/gpt-image-2`. O modelo mais antigo
`openai/gpt-image-1` ainda pode ser selecionado explicitamente, mas novas solicitações de
geração e edição de imagem no OpenAI devem usar `gpt-image-2`.

`gpt-image-2` oferece suporte tanto à geração de texto para imagem quanto à
edição de imagem de referência pela mesma ferramenta `image_generate`. O OpenClaw encaminha `prompt`,
`count`, `size` e imagens de referência para o OpenAI. O OpenAI não recebe
`aspectRatio` nem `resolution` diretamente; quando possível, o OpenClaw os mapeia para um
`size` compatível, caso contrário a ferramenta os reporta como substituições ignoradas.

Gerar uma imagem horizontal em 4K:

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

Editar com várias referências:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Para rotear a geração de imagem do OpenAI por uma implantação do Azure OpenAI
em vez de `api.openai.com`, veja [endpoints do Azure OpenAI](/pt-BR/providers/openai#azure-openai-endpoints)
na documentação do provider OpenAI.

A geração de imagem do MiniMax está disponível pelos dois caminhos integrados de autenticação MiniMax:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Recursos do provider

| Recurso               | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                             | Vydra | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ----------------------------------- | ----- | -------------------- |
| Gerar                 | Sim (até 4)          | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                | Sim (saídas definidas pelo workflow)| Sim (1) | Sim (até 4)       |
| Editar/referência     | Sim (até 5 imagens)  | Sim (até 5 imagens)  | Sim (1 imagem)      | Sim (1 imagem, ref. de assunto) | Sim (1 imagem, configurada pelo workflow) | Não | Sim (até 5 imagens) |
| Controle de tamanho   | Sim (até 4K)         | Sim                  | Sim                 | Não                        | Não                                 | Não   | Não                  |
| Proporção             | Não                  | Sim                  | Sim (apenas gerar)  | Sim                        | Não                                 | Não   | Sim                  |
| Resolução (1K/2K/4K)  | Não                  | Sim                  | Sim                 | Não                        | Não                                 | Não   | Sim (1K/2K)          |

### xAI `grok-imagine-image`

O provider integrado xAI usa `/v1/images/generations` para solicitações apenas com prompt
e `/v1/images/edits` quando `image` ou `images` está presente.

- Modelos: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Quantidade: até 4
- Referências: uma `image` ou até cinco `images`
- Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Resoluções: `1K`, `2K`
- Saídas: retornadas como anexos de imagem gerenciados pelo OpenClaw

O OpenClaw intencionalmente não expõe `quality`, `mask`, `user` nativos do xAI nem
proporções extras exclusivas do provider até que esses controles existam no contrato
compartilhado e multiplataforma de `image_generate`.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [fal](/pt-BR/providers/fal) — configuração do provider de imagem e vídeo fal
- [ComfyUI](/pt-BR/providers/comfy) — configuração de workflow local do ComfyUI e Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provider de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provider de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provider OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala da Vydra
- [xAI](/pt-BR/providers/xai) — configuração de imagem, vídeo, pesquisa, execução de código e TTS do Grok
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — configuração `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) — configuração de modelos e failover
