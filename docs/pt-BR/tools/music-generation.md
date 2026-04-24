---
read_when:
    - Gerando música ou áudio por meio do agente
    - Configurando providers e modelos de geração de música
    - Entendendo os parâmetros da ferramenta `music_generate`
summary: Gerar música com providers compartilhados, incluindo Plugins sustentados por workflow
title: Geração de música
x-i18n:
    generated_at: "2026-04-24T06:17:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

A ferramenta `music_generate` permite que o agente crie música ou áudio por meio da
capacidade compartilhada de geração de música com providers configurados, como Google,
MiniMax e ComfyUI configurado por workflow.

Para sessões de agente com suporte de provider compartilhado, o OpenClaw inicia a geração de música como uma
tarefa em segundo plano, rastreia-a no registro de tarefas e depois desperta o agente novamente quando
a faixa fica pronta para que ele possa publicar o áudio finalizado de volta no canal
original.

<Note>
A ferramenta compartilhada integrada só aparece quando pelo menos um provider de geração de música está disponível. Se você não vir `music_generate` nas ferramentas do seu agente, configure `agents.defaults.musicGenerationModel` ou defina uma chave de API de provider.
</Note>

## Início rápido

### Geração compartilhada com suporte de provider

1. Defina uma chave de API para pelo menos um provider, por exemplo `GEMINI_API_KEY` ou
   `MINIMAX_API_KEY`.
2. Opcionalmente, defina seu modelo preferido:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Peça ao agente: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

O agente chama `music_generate` automaticamente. Não é necessária lista de permissão de ferramenta.

Para contextos síncronos diretos sem uma execução de agente sustentada por sessão, a ferramenta integrada
ainda recorre à geração inline e retorna o caminho final da mídia no resultado
da ferramenta.

Exemplos de prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Geração com Comfy orientada por workflow

O Plugin incluído `comfy` conecta-se à ferramenta compartilhada `music_generate` por meio
do registro de providers de geração de música.

1. Configure `models.providers.comfy.music` com um workflow JSON e
   nós de prompt/saída.
2. Se você usa Comfy Cloud, defina `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Peça música ao agente ou chame a ferramenta diretamente.

Exemplo:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Suporte compartilhado de providers incluídos

| Provider | Modelo padrão         | Entradas de referência | Controles compatíveis                                      | Chave de API                            |
| -------- | --------------------- | ---------------------- | ---------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`            | Até 1 imagem           | Música ou áudio definidos pelo workflow                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview`| Até 10 imagens         | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.5+`          | Nenhuma                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`  | `MINIMAX_API_KEY`                       |

### Matriz declarada de capacidades

Este é o contrato explícito de modo usado por `music_generate`, testes de contrato
e a varredura compartilhada ao vivo.

| Provider | `generate` | `edit` | Limite de edição | Lanes compartilhadas ao vivo                                                 |
| -------- | ---------- | ------ | ---------------- | --------------------------------------------------------------------------- |
| ComfyUI  | Sim        | Sim    | 1 imagem         | Não está na varredura compartilhada; coberto por `extensions/comfy/comfy.live.test.ts` |
| Google   | Sim        | Sim    | 10 imagens       | `generate`, `edit`                                                          |
| MiniMax  | Sim        | Não    | Nenhum           | `generate`                                                                  |

Use `action: "list"` para inspecionar providers e modelos compartilhados
disponíveis em runtime:

```text
/tool music_generate action=list
```

Use `action: "status"` para inspecionar a tarefa ativa de música sustentada por sessão:

```text
/tool music_generate action=status
```

Exemplo de geração direta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parâmetros da ferramenta integrada

| Parâmetro         | Tipo     | Descrição                                                                                         |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de geração de música (obrigatório para `action: "generate"`)                              |
| `action`          | string   | `"generate"` (padrão), `"status"` para a tarefa da sessão atual ou `"list"` para inspecionar providers |
| `model`           | string   | Substituição de provider/model, por exemplo `google/lyria-3-pro-preview` ou `comfy/workflow`     |
| `lyrics`          | string   | Letras opcionais quando o provider oferece suporte a entrada explícita de letra                   |
| `instrumental`    | boolean  | Solicita saída apenas instrumental quando o provider oferece suporte                              |
| `image`           | string   | Caminho ou URL de uma única imagem de referência                                                  |
| `images`          | string[] | Múltiplas imagens de referência (até 10)                                                          |
| `durationSeconds` | number   | Duração alvo em segundos quando o provider oferece suporte a dicas de duração                     |
| `timeoutMs`       | number   | Timeout opcional da solicitação ao provider em milissegundos                                      |
| `format`          | string   | Dica de formato de saída (`mp3` ou `wav`) quando o provider oferece suporte                       |
| `filename`        | string   | Dica de nome do arquivo de saída                                                                  |

Nem todos os providers oferecem suporte a todos os parâmetros. O OpenClaw ainda valida limites rígidos
como contagens de entrada antes do envio. Quando um provider oferece suporte a duração, mas
usa um máximo menor do que o valor solicitado, o OpenClaw limita automaticamente
ao valor compatível mais próximo. Dicas opcionais realmente não compatíveis são ignoradas
com um aviso quando o provider ou modelo selecionado não consegue respeitá-las.

Os resultados da ferramenta informam as configurações aplicadas. Quando o OpenClaw limita a duração durante o fallback de provider, o `durationSeconds` retornado reflete o valor enviado e `details.normalization.durationSeconds` mostra o mapeamento de solicitado para aplicado.

## Comportamento assíncrono para o caminho compartilhado com suporte de provider

- Execuções de agente com suporte de sessão: `music_generate` cria uma tarefa em segundo plano, retorna imediatamente uma resposta de tarefa iniciada e publica a faixa finalizada depois em uma mensagem de acompanhamento do agente.
- Prevenção de duplicatas: enquanto essa tarefa em segundo plano ainda estiver `queued` ou `running`, chamadas posteriores de `music_generate` na mesma sessão retornam o status da tarefa em vez de iniciar outra geração.
- Consulta de status: use `action: "status"` para inspecionar a tarefa ativa de música sustentada por sessão sem iniciar uma nova.
- Rastreamento de tarefa: use `openclaw tasks list` ou `openclaw tasks show <taskId>` para inspecionar status enfileirado, em execução e terminal da geração.
- Despertar na conclusão: o OpenClaw injeta um evento interno de conclusão de volta na mesma sessão para que o modelo possa escrever o acompanhamento voltado ao usuário.
- Dica de prompt: turnos posteriores do usuário/manuais na mesma sessão recebem uma pequena dica de runtime quando uma tarefa de música já está em andamento, para que o modelo não chame cegamente `music_generate` de novo.
- Fallback sem sessão: contextos diretos/locais sem uma sessão real de agente ainda são executados inline e retornam o resultado final de áudio no mesmo turno.

### Ciclo de vida da tarefa

Cada solicitação de `music_generate` passa por quatro estados:

1. **queued** -- tarefa criada, aguardando o provider aceitá-la.
2. **running** -- o provider está processando (normalmente de 30 segundos a 3 minutos, dependendo do provider e da duração).
3. **succeeded** -- faixa pronta; o agente desperta e a publica na conversa.
4. **failed** -- erro ou timeout do provider; o agente desperta com detalhes do erro.

Verifique o status pela CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenção de duplicatas: se uma tarefa de música já estiver `queued` ou `running` para a sessão atual, `music_generate` retorna o status da tarefa existente em vez de iniciar uma nova. Use `action: "status"` para verificar explicitamente sem acionar uma nova geração.

## Configuração

### Seleção de modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Ordem de seleção de provider

Ao gerar música, o OpenClaw tenta providers nesta ordem:

1. parâmetro `model` da chamada da ferramenta, se o agente especificar um
2. `musicGenerationModel.primary` da configuração
3. `musicGenerationModel.fallbacks` na ordem
4. detecção automática usando somente padrões de provider sustentados por autenticação:
   - primeiro o provider padrão atual
   - depois os providers restantes registrados de geração de música em ordem de ID de provider

Se um provider falhar, o próximo candidato será tentado automaticamente. Se todos falharem, o
erro incluirá detalhes de cada tentativa.

Defina `agents.defaults.mediaGenerationAutoProviderFallback: false` se quiser que a
geração de música use apenas as entradas explícitas de `model`, `primary` e
`fallbacks`.

## Observações sobre providers

- Google usa geração em lote do Lyria 3. O fluxo incluído atual oferece suporte a
  prompt, texto opcional de letras e imagens opcionais de referência.
- MiniMax usa o endpoint em lote `music_generation`. O fluxo incluído atual
  oferece suporte a prompt, letras opcionais, modo instrumental, ajuste de duração e
  saída mp3.
- O suporte a ComfyUI é orientado por workflow e depende do grafo configurado mais
  o mapeamento de nós para campos de prompt/saída.

## Modos de capacidade do provider

O contrato compartilhado de geração de música agora oferece suporte a declarações explícitas de modo:

- `generate` para geração somente com prompt
- `edit` quando a solicitação inclui uma ou mais imagens de referência

Novas implementações de provider devem preferir blocos explícitos de modo:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Campos legados planos como `maxInputImages`, `supportsLyrics` e
`supportsFormat` não bastam para anunciar suporte a edição. Providers devem
declarar `generate` e `edit` explicitamente para que testes ao vivo, testes de contrato e
a ferramenta compartilhada `music_generate` possam validar o suporte de modo de forma determinística.

## Escolhendo o caminho certo

- Use o caminho compartilhado com suporte de provider quando quiser seleção de modelo, failover de provider e o fluxo assíncrono integrado de tarefa/status.
- Use um caminho de Plugin como ComfyUI quando precisar de um grafo de workflow personalizado ou de um provider que não faça parte da capacidade compartilhada de música incluída.
- Se estiver depurando comportamento específico do ComfyUI, consulte [ComfyUI](/pt-BR/providers/comfy). Se estiver depurando comportamento compartilhado de provider, comece por [Google (Gemini)](/pt-BR/providers/google) ou [MiniMax](/pt-BR/providers/minimax).

## Testes ao vivo

Cobertura ao vivo opt-in para os providers compartilhados incluídos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper do repositório:

```bash
pnpm test:live:media music
```

Esse arquivo ao vivo carrega variáveis de ambiente ausentes de provider a partir de `~/.profile`, prefere
chaves de API ao vivo/de ambiente em vez de perfis de autenticação armazenados por padrão e executa cobertura de `generate` e do `edit` declarado quando o provider habilita o modo de edição.

Hoje isso significa:

- `google`: `generate` mais `edit`
- `minimax`: somente `generate`
- `comfy`: cobertura ao vivo separada do Comfy, não da varredura compartilhada de provider

Cobertura ao vivo opt-in para o caminho incluído do ComfyUI para música:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

O arquivo ao vivo do Comfy também cobre workflows de imagem e vídeo do comfy quando essas
seções estão configuradas.

## Relacionado

- [Tarefas em segundo plano](/pt-BR/automation/tasks) - rastreamento de tarefas para execuções desacopladas de `music_generate`
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) - configuração de `musicGenerationModel`
- [ComfyUI](/pt-BR/providers/comfy)
- [Google (Gemini)](/pt-BR/providers/google)
- [MiniMax](/pt-BR/providers/minimax)
- [Modelos](/pt-BR/concepts/models) - configuração de modelo e failover
- [Visão geral das ferramentas](/pt-BR/tools)
