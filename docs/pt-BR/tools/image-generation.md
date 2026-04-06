---
read_when:
    - Gerar imagens pelo agente
    - Configurar provedores e models de geração de imagens
    - Entender os parâmetros da tool `image_generate`
summary: Gere e edite imagens usando provedores configurados (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Geração de imagens
x-i18n:
    generated_at: "2026-04-06T03:12:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: dde416dd1441a06605db85b5813cf61ccfc525813d6db430b7b7dfa53d6a3134
    source_path: tools/image-generation.md
    workflow: 15
---

# Geração de imagens

A tool `image_generate` permite que o agente crie e edite imagens usando seus provedores configurados. As imagens geradas são entregues automaticamente como anexos de mídia na resposta do agente.

<Note>
A tool só aparece quando pelo menos um provedor de geração de imagens está disponível. Se você não vir `image_generate` nas tools do seu agente, configure `agents.defaults.imageGenerationModel` ou defina uma chave de API de provedor.
</Note>

## Início rápido

1. Defina uma chave de API para pelo menos um provedor (por exemplo `OPENAI_API_KEY` ou `GEMINI_API_KEY`).
2. Opcionalmente, defina seu model preferido:

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

3. Peça ao agente: _"Gere uma imagem de um mascote lagosta simpático."_

O agente chama `image_generate` automaticamente. Não é necessário allow-list de tool — ela vem ativada por padrão quando um provedor está disponível.

## Provedores compatíveis

| Provedor | Model padrão                     | Suporte a edição                   | Chave de API                                            |
| -------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| OpenAI   | `gpt-image-1`                    | Sim (até 5 imagens)                | `OPENAI_API_KEY`                                        |
| Google   | `gemini-3.1-flash-image-preview` | Sim                                | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`                | Sim                                | `FAL_KEY`                                               |
| MiniMax  | `image-01`                       | Sim (referência de assunto)        | `MINIMAX_API_KEY` ou OAuth do MiniMax (`minimax-portal`) |
| ComfyUI  | `workflow`                       | Sim (1 imagem, configurada no workflow) | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` para cloud |
| Vydra    | `grok-imagine`                   | Não                                | `VYDRA_API_KEY`                                         |

Use `action: "list"` para inspecionar provedores e models disponíveis em runtime:

```
/tool image_generate action=list
```

## Parâmetros da tool

| Parâmetro    | Tipo     | Descrição                                                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------ |
| `prompt`     | string   | Prompt de geração de imagem (obrigatório para `action: "generate"`)                  |
| `action`     | string   | `"generate"` (padrão) ou `"list"` para inspecionar provedores                        |
| `model`      | string   | Sobrescrita de provedor/model, por exemplo `openai/gpt-image-1`                      |
| `image`      | string   | Caminho ou URL de uma única imagem de referência para o modo de edição               |
| `images`     | string[] | Várias imagens de referência para o modo de edição (até 5)                           |
| `size`       | string   | Dica de tamanho: `1024x1024`, `1536x1024`, `1024x1536`, `1024x1792`, `1792x1024`     |
| `aspectRatio` | string  | Proporção: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution` | string   | Dica de resolução: `1K`, `2K` ou `4K`                                                |
| `count`      | number   | Número de imagens a gerar (1–4)                                                      |
| `filename`   | string   | Dica de nome do arquivo de saída                                                     |

Nem todos os provedores oferecem suporte a todos os parâmetros. A tool passa o que cada provedor aceita, ignora o restante e informa as sobrescritas descartadas no resultado da tool.

## Configuração

### Seleção de model

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

1. Parâmetro **`model`** da chamada da tool (se o agente especificar um)
2. **`imageGenerationModel.primary`** da config
3. **`imageGenerationModel.fallbacks`** em ordem
4. **Detecção automática** — usa somente padrões de provedores com auth:
   - provedor padrão atual primeiro
   - provedores de geração de imagem restantes registrados, em ordem de provider-id

Se um provedor falhar (erro de auth, rate limit etc.), o próximo candidato será tentado automaticamente. Se todos falharem, o erro incluirá detalhes de cada tentativa.

Observações:

- A detecção automática considera auth. Um padrão de provedor só entra na lista de candidatos
  quando o OpenClaw consegue realmente autenticar esse provedor.
- Use `action: "list"` para inspecionar os provedores registrados no momento, seus
  models padrão e dicas de variáveis de ambiente de auth.

### Edição de imagem

OpenAI, Google, fal, MiniMax e ComfyUI oferecem suporte à edição de imagens de referência. Passe um caminho ou URL de imagem de referência:

```
"Gerar uma versão em aquarela desta foto" + image: "/path/to/photo.jpg"
```

OpenAI e Google oferecem suporte a até 5 imagens de referência via parâmetro `images`. fal, MiniMax e ComfyUI oferecem suporte a 1.

A geração de imagens MiniMax está disponível pelos dois caminhos de auth integrados do MiniMax:

- `minimax/image-01` para configurações com chave de API
- `minimax-portal/image-01` para configurações com OAuth

## Capabilities do provedor

| Capability            | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ----- |
| Gerar                 | Sim (até 4)          | Sim (até 4)          | Sim (até 4)         | Sim (até 9)                | Sim (saídas definidas pelo workflow) | Sim (1) |
| Editar/referência     | Sim (até 5 imagens)  | Sim (até 5 imagens)  | Sim (1 imagem)      | Sim (1 imagem, ref. de assunto) | Sim (1 imagem, configurada no workflow) | Não |
| Controle de tamanho   | Sim                  | Sim                  | Sim                 | Não                        | Não                                 | Não |
| Proporção             | Não                  | Sim                  | Sim (somente geração) | Sim                      | Não                                 | Não |
| Resolução (1K/2K/4K)  | Não                  | Sim                  | Sim                 | Não                        | Não                                 | Não |

## Relacionados

- [Visão geral das tools](/pt-BR/tools) — todas as tools de agente disponíveis
- [fal](/providers/fal) — configuração do provedor fal para imagem e vídeo
- [ComfyUI](/providers/comfy) — configuração de workflow do ComfyUI local e Comfy Cloud
- [Google (Gemini)](/pt-BR/providers/google) — configuração do provedor de imagem Gemini
- [MiniMax](/pt-BR/providers/minimax) — configuração do provedor de imagem MiniMax
- [OpenAI](/pt-BR/providers/openai) — configuração do provedor OpenAI Images
- [Vydra](/providers/vydra) — configuração de imagem, vídeo e fala no Vydra
- [Referência de configuração](/pt-BR/gateway/configuration-reference#agent-defaults) — config `imageGenerationModel`
- [Models](/pt-BR/concepts/models) — configuração de model e failover
