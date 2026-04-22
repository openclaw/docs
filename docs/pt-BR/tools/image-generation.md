---
read_when:
    - Gerando imagens pelo agente
    - Configurando provedores e modelos de geração de imagem
    - Entendendo os parâmetros da ferramenta `image_generate`
summary: Gerar e editar imagens usando provedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Geração de imagem
x-i18n:
    generated_at: "2026-04-22T04:27:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Geração de imagem

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus provedores configurados. As imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagem está disponível. Se você não vir `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel` ou defina uma chave de API de provedor.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provedor (por exemplo, `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
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

3. Peça ao agente: _"Gere uma imagem de um mascote lagosta amigável."_

O agente chama `image_generate` automaticamente. Não é necessário allow-listing de ferramenta — ela é habilitada por padrão quando um provedor está disponível.

## Provedores compatíveis

| Provedor | Modelo padrão                   | Suporte a edição                   | Chave de API                                           |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI   | `gpt-image-2`                    | Sim (até 5 imagens)                | `OPENAI_API_KEY`                                      |
| Google   | `gemini-3.1-flash-image-preview` | Sim                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                  |
| fal      | `fal-ai/flux/dev`                | Sim                                | `FAL_KEY`                                             |
| MiniMax  | `image-01`                       | Sim (referência de assunto)        | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Sim (1 imagem, configurado por workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para cloud    |
| Vydra    | `grok-imagine`                   | Não                                | `VYDRA_API_KEY`                                       |

Use `action: "list"` para inspecionar provedores e modelos disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

| Parâmetro    | Tipo     | Descrição                                                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------ |
| `prompt`     | string   | Prompt de geração de imagem (obrigatório para `action: "generate"`)                 |
| `action`     | string   | `"generate"` (padrão) ou `"list"` para inspecionar provedores                        |
| `model`      | string   | Substituição de provedor/modelo, por exemplo `openai/gpt-image-2`                    |
| `image`      | string   | Caminho ou URL de uma única imagem de referência para modo de edição                 |
| `images`     | string[] | Múltiplas imagens de referência para modo de edição (até 5)                          |
| `size`       | string   | Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`     |
| `aspectRatio`| string   | Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Dica de resolução: `1K`, `2K` ou `4K`                                                |
| `count`      | number   | Número de imagens a gerar (1–4)                                                      |
| `filename`   | string   | Dica de nome de arquivo de saída                                                     |

Nem todos os provedores oferecem suporte a todos os parâmetros. Quando um provedor de fallback oferece uma opção de geometria próxima em vez da exata solicitada, o OpenClaw remapeia para o tamanho, a proporção ou a resolução compatíveis mais próximos antes do envio. Substituições realmente sem suporte ainda são informadas no resultado da ferramenta.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia a geometria durante o fallback de provedor, os valores retornados de `size`, `aspectRatio` e `resolution` refletem o que foi realmente enviado, e `details.normalization` captura a tradução do solicitado para o aplicado.

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

### Ordem de seleção de provedor

Ao gerar uma imagem, o OpenClaw tenta os provedores nesta ordem:

1. **Parâmetro `model`** da chamada da ferramenta (se o agente especificar um)
2. **`imageGenerationModel.primary`** da configuração
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Detecção automática** — usa apenas padrões de provedor respaldados por autenticação:
   - o provedor padrão atual primeiro
   - os demais provedores registrados de geração de imagem em ordem de ID do provedor

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo candidato é tentado automaticamente. Se todos falharem, o erro inclui detalhes de cada tentativa.

Observações:

- A detecção automática tem reconhecimento de autenticação. Um padrão de provedor só entra na lista de candidatos
  quando o OpenClaw realmente consegue autenticar esse provedor.
- A detecção automática é habilitada por padrão. Defina
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a
  geração de imagem use apenas as entradas explícitas `model`, `primary` e `fallbacks`.
- Use `action: "list"` para inspecionar os provedores atualmente registrados, seus
  modelos padrão e dicas de variáveis de ambiente de autenticação.

### Edição de imagem

OpenAI, Google, fal, MiniMax e ComfyUI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI e Google oferecem suporte a até 5 imagens de referência via parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

### OpenAI `gpt-image-2`

A geração de imagem da OpenAI usa `openai/gpt-image-2` por padrão. O modelo mais antigo
`openai/gpt-image-1` ainda pode ser selecionado explicitamente, mas novas solicitações de
geração e edição de imagem da OpenAI devem usar `gpt-image-2`.

`gpt-image-2` oferece suporte tanto à geração de imagem a partir de texto quanto à
edição de imagem de referência pela mesma ferramenta `image_generate`. O OpenClaw encaminha `prompt`,
`count`, `size` e imagens de referência para a OpenAI. A OpenAI não recebe
`aspectRatio` nem `resolution` diretamente; quando possível, o OpenClaw mapeia isso para um
`size` compatível; caso contrário, a ferramenta informa isso como substituições ignoradas.

Gerar uma imagem em paisagem 4K:

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

A geração de imagem do MiniMax está disponível pelos dois caminhos bundled de autenticação do MiniMax:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Capacidades do provedor

| Capacidade            | OpenAI                | Google               | fal                  | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | --------------------- | -------------------- | -------------------- | -------------------------- | ---------------------------------- | ------- |
| Gerar                 | Sim (até 4)           | Sim (até 4)          | Sim (até 4)          | Sim (até 9)                | Sim (saídas definidas pelo workflow) | Sim (1) |
| Editar/referência     | Sim (até 5 imagens)   | Sim (até 5 imagens)  | Sim (1 imagem)       | Sim (1 imagem, referência de assunto) | Sim (1 imagem, configurado por workflow) | Não     |
| Controle de tamanho   | Sim (até 4K)          | Sim                  | Sim                  | Não                        | Não                                 | Não      |
| Proporção             | Não                   | Sim                  | Sim (apenas gerar)   | Sim                        | Não                                 | Não      |
| Resolução (1K/2K/4K)  | Não                   | Sim                  | Sim                  | Não                        | Não                                 | Não      |

## Relacionado

- [Visão geral de ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [fal](/pt-BR/providers/fal) — configuração de provedor de imagem e vídeo do fal
- [ComfyUI](/pt-BR/providers/comfy) — configuração de workflow local do ComfyUI e Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração de provedor de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração de provedor de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração de provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala do Vydra
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — configuração `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) — configuração de modelo e failover
