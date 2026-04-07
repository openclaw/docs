---
read_when:
    - Gerando imagens via o agente
    - Configurando provedores e modelos de geração de imagens
    - Entendendo os parâmetros da ferramenta image_generate
summary: Gere e edite imagens usando provedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Geração de Imagens
x-i18n:
    generated_at: "2026-04-07T05:32:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f7303c199d46e63e88f5f9567478a1025631afb03cb35f44344c12370365e57
    source_path: tools/image-generation.md
    workflow: 15
---

# Geração de Imagens

A ferramenta `image_generate` permite que o agente crie e edite imagens usando seus provedores configurados. As imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A ferramenta só aparece quando pelo menos um provedor de geração de imagens está disponível. Se você não vir `image_generate` nas ferramentas do seu agente, configure `agents.defaults.imageGenerationModel` ou defina uma chave de API de provedor.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provedor (por exemplo `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
2. Opcionalmente, defina seu modelo preferido:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. Peça ao agente: _"Gere uma imagem de um mascote lagosta amigável."_

O agente chama `image_generate` automaticamente. Não é necessário allow-list da ferramenta — ela fica ativada por padrão quando um provedor está disponível.

## Provedores compatíveis

| Provedor | Modelo padrão                    | Suporte a edição                  | Chave de API                                           |
| -------- | -------------------------------- | --------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-1`                    | Sim (até 5 imagens)               | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sim                               | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                   |
| fal      | `fal-ai/flux/dev`                | Sim                               | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Sim (referência de assunto)       | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Sim (1 imagem, configurada pelo workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para cloud    |
| Vydra    | `grok-imagine`                   | Não                               | `VYDRA_API_KEY`                                        |

Use `action: "list"` para inspecionar provedores e modelos disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da ferramenta

| Parâmetro    | Tipo     | Descrição                                                                           |
| ------------ | -------- | ----------------------------------------------------------------------------------- |
| `prompt`     | string   | Prompt de geração de imagem (obrigatório para `action: "generate"`)                 |
| `action`     | string   | `"generate"` (padrão) ou `"list"` para inspecionar provedores                       |
| `model`      | string   | Sobrescrita de provedor/modelo, por exemplo `openai/gpt-image-1`                    |
| `image`      | string   | Caminho ou URL de uma única imagem de referência para modo de edição                |
| `images`     | string[] | Múltiplas imagens de referência para modo de edição (até 5)                         |
| `size`       | string   | Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`    |
| `aspectRatio` | string  | Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Dica de resolução: `1K`, `2K` ou `4K`                                               |
| `count`      | number   | Número de imagens a gerar (1–4)                                                     |
| `filename`   | string   | Dica de nome do arquivo de saída                                                    |

Nem todos os provedores oferecem suporte a todos os parâmetros. Quando um provedor de fallback oferece uma opção de geometria próxima em vez da opção exata solicitada, o OpenClaw remapeia para o tamanho, proporção ou resolução compatível mais próxima antes do envio. Sobrescritas realmente sem suporte ainda são informadas no resultado da ferramenta.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw remapeia a geometria durante o fallback de provedor, os valores retornados de `size`, `aspectRatio` e `resolution` refletem o que realmente foi enviado, e `details.normalization` captura a tradução do solicitado para o aplicado.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
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
4. **Detecção automática** — usa apenas padrões de provedor com autenticação disponível:
   - provedor padrão atual primeiro
   - provedores de geração de imagem restantes registrados, em ordem de id do provedor

Se um provedor falhar (erro de autenticação, limite de taxa etc.), o próximo candidato é tentado automaticamente. Se todos falharem, o erro inclui detalhes de cada tentativa.

Observações:

- A detecção automática considera autenticação. Um padrão de provedor só entra na lista de candidatos
  quando o OpenClaw realmente consegue autenticar esse provedor.
- A detecção automática fica ativada por padrão. Defina
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a geração de imagem
  use apenas as entradas explícitas `model`, `primary` e `fallbacks`.
- Use `action: "list"` para inspecionar os provedores atualmente registrados, seus
  modelos padrão e dicas de variáveis de ambiente para autenticação.

### Edição de imagem

OpenAI, Google, fal, MiniMax e ComfyUI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Gerar uma versão em aquarela desta foto" + image: "/path/to/photo.jpg"
```

OpenAI e Google oferecem suporte a até 5 imagens de referência via o parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

A geração de imagem do MiniMax está disponível pelos dois caminhos integrados de autenticação do MiniMax:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Capacidades do provedor

| Capacidade            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Gerar                 | Sim (até 4)          | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                | Sim (saídas definidas pelo workflow) | Sim (1) |
| Editar/referência     | Sim (até 5 imagens)  | Sim (até 5 imagens)  | Sim (1 imagem)      | Sim (1 imagem, ref. de assunto) | Sim (1 imagem, configurada pelo workflow) | Não     |
| Controle de tamanho   | Sim                  | Sim                  | Sim                 | Não                        | Não                                 | Não      |
| Proporção             | Não                  | Sim                  | Sim (apenas geração) | Sim                       | Não                                 | Não      |
| Resolução (1K/2K/4K)  | Não                  | Sim                  | Sim                 | Não                        | Não                                 | Não      |

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [fal](/pt-BR/providers/fal) — configuração do provedor de imagem e vídeo fal
- [ComfyUI](/pt-BR/providers/comfy) — configuração de workflow do ComfyUI local e do Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provedor de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provedor de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provedor OpenAI Images
- [Vydra](/pt-BR/providers/vydra) — configuração de imagem, vídeo e fala do Vydra
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — configuração `imageGenerationModel`
- [Modelos](/pt-BR/concepts/models) — configuração de modelo e failover
