---
read_when:
    - Projetando ou refatorando a compreensão de mídia
    - Ajuste do pré-processamento de áudio, vídeo e imagem recebidos
sidebarTitle: Media understanding
summary: Compreensão de imagens/áudios/vídeos recebidos (opcional) com alternativas de provedor + CLI
title: Compreensão de mídia
x-i18n:
    generated_at: "2026-07-12T00:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

O OpenClaw pode resumir mídias recebidas (imagem/áudio/vídeo) antes da execução do pipeline de resposta, para que a análise e o roteamento de comandos operem com um texto curto em vez de bytes brutos. A compreensão detecta automaticamente ferramentas locais ou chaves de provedores, ou você pode configurar modelos explícitos. A mídia original é sempre entregue ao modelo normalmente; quando a compreensão falha ou está desativada, o fluxo de resposta continua sem alterações.

Os plugins dos fornecedores registram metadados de recursos (qual provedor oferece suporte a qual tipo de mídia, modelo padrão e prioridade). O núcleo do OpenClaw controla a configuração compartilhada `tools.media`, a ordem de fallback e a integração com o pipeline de resposta.

## Como funciona

<Steps>
  <Step title="Coletar anexos">
    Coleta os anexos recebidos (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Selecionar por recurso">
    Para cada recurso habilitado (imagem/áudio/vídeo), seleciona os anexos de acordo com a política `attachments` (padrão: somente o primeiro anexo).
  </Step>
  <Step title="Escolher um modelo">
    Seleciona a primeira entrada de modelo qualificada (tamanho + recurso + autenticação disponível).
  </Step>
  <Step title="Usar fallback em caso de falha">
    Se um modelo apresentar um erro, exceder o tempo limite ou a mídia ultrapassar `maxBytes`, tenta a próxima entrada.
  </Step>
  <Step title="Aplicar em caso de sucesso">
    `Body` se torna um bloco `[Image]`, `[Audio]` ou `[Video]`. O áudio também define `{{Transcript}}`; a análise de comandos usa o texto da legenda quando presente ou, caso contrário, a transcrição. As legendas são preservadas como `User text:` dentro do bloco.
  </Step>
</Steps>

## Configuração

`tools.media` contém uma lista compartilhada de modelos e substituições específicas para cada recurso:

```json5
{
  tools: {
    media: {
      concurrency: 2, // máximo de execuções simultâneas de recursos (padrão)
      models: [/* lista compartilhada, restrinja com capabilities */],
      image: {/* substituições opcionais */},
      audio: {
        /* substituições opcionais */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* substituições opcionais */},
    },
  },
}
```

Chaves específicas de cada recurso (`image`/`audio`/`video`):

| Chave                                           | Tipo      | Padrão                                               | Observações                                                                                       |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | automático (`false` desativa)                        | Defina como `false` para desativar a detecção automática desse recurso                            |
| `models`                                        | array     | nenhum                                               | Tem preferência sobre a lista compartilhada `tools.media.models`                                  |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ orientação de maxChars) | Por padrão, somente para imagem/vídeo                                                              |
| `maxChars`                                      | `number`  | `500` (imagem/vídeo), não definido (áudio)           | A saída é truncada se o modelo retornar mais                                                      |
| `maxBytes`                                      | `number`  | imagem `10485760`, áudio `20971520`, vídeo `52428800` | Mídias grandes demais fazem o processamento avançar para o próximo modelo                          |
| `timeoutSeconds`                                | `number`  | `60` (imagem/áudio), `120` (vídeo)                   |                                                                                                   |
| `language`                                      | `string`  | não definido                                         | Dica de idioma para a transcrição de áudio                                                        |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | Substituições de solicitação do provedor; consulte [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) |
| `attachments`                                   | object    | `{ mode: "first", maxAttachments: 1 }`               | Consulte [Política de anexos](#attachment-policy)                                                 |
| `scope`                                         | object    | não definido                                         | Restringe por canal/chatType/keyPrefix                                                             |
| `echoTranscript`                                | `boolean` | `false`                                              | Somente áudio: envia a transcrição de volta ao chat antes do processamento pelo agente            |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | Somente áudio: espaço reservado `{transcript}`                                                     |

As opções específicas do Deepgram ficam em `providerOptions.deepgram` (o campo de nível superior `deepgram: { detectLanguage, punctuate, smartFormat }` está obsoleto, mas ainda é lido).

### Entradas de modelo

Cada entrada em `models[]` é uma entrada de **provedor** (padrão) ou uma entrada de **CLI**:

<Tabs>
  <Tab title="Entrada de provedor">
    ```json5
    {
      type: "provider", // padrão se omitido
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // opcional, para entradas multimodais compartilhadas
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entrada de CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Os modelos de CLI também podem usar `{{MediaDir}}` (diretório que contém o arquivo de mídia), `{{OutputDir}}` (diretório temporário criado para esta execução) e `{{OutputBase}}` (caminho-base do arquivo temporário, sem extensão).

  </Tab>
</Tabs>

### Credenciais do provedor

A compreensão de mídia pelo provedor usa a mesma resolução de autenticação das chamadas normais de modelos: perfis de autenticação, variáveis de ambiente e, em seguida, `models.providers.<providerId>.apiKey`. As entradas `tools.media.*.models[]` não aceitam um campo `apiKey` embutido.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Consulte [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools) para obter informações sobre perfis, variáveis de ambiente e URLs-base personalizados.

## Regras e comportamento

- Mídias que ultrapassam `maxBytes` ignoram esse modelo e tentam o próximo.
- Arquivos de áudio com menos de 1024 bytes são tratados como vazios/corrompidos e ignorados antes da transcrição; em vez disso, o agente recebe uma transcrição de espaço reservado determinística.
- Se o modelo de imagem principal ativo já oferecer suporte nativo à visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original diretamente ao modelo. O MiniMax é uma exceção: `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` sempre encaminham a compreensão de imagens pelo provedor de mídia `MiniMax-VL-01`, controlado pelo plugin, mesmo que os metadados legados de chat do MiniMax M2.x afirmem aceitar entrada de imagem (somente `MiniMax-M3` e posteriores são tratados como compatíveis nativamente com visão).
- Se um modelo principal do Gateway/WebChat aceitar somente texto, os anexos de imagem são preservados como referências descarregadas `media://inbound/*`, para que ferramentas de imagem/PDF ou um modelo de imagem configurado ainda possam inspecioná-los, em vez de perder o anexo.
- O comando explícito `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) executa diretamente esse provedor/modelo compatível com imagens, incluindo referências do Ollama como `ollama/qwen2.5vl:7b` quando um modelo correspondente compatível com imagens está configurado em `models.providers.ollama.models[]`.
- Se `<capability>.enabled` não for `false`, mas nenhum modelo estiver configurado, o OpenClaw tentará usar o modelo de resposta ativo quando o provedor dele oferecer suporte ao recurso.

### Detecção automática (padrão)

Quando `tools.media.<capability>.enabled` não é `false` e nenhum modelo está configurado, o OpenClaw tenta as opções a seguir, em ordem, e para na primeira que funcionar:

<Steps>
  <Step title="Modelo de imagem configurado (somente imagem)">
    Referências primárias/de fallback de `agents.defaults.imageModel`, a menos que o modelo de resposta ativo já ofereça suporte nativo à visão. Dê preferência a referências `provider/model`; referências simples são qualificadas com base nas entradas configuradas de modelos de provedores compatíveis com imagens somente quando a correspondência é única.
  </Step>
  <Step title="Modelo de resposta ativo">
    O modelo de resposta ativo, quando seu provedor oferece suporte ao recurso.
  </Step>
  <Step title="Autenticação do provedor (somente áudio, antes das CLIs locais)">
    As entradas configuradas em `models.providers.*` que oferecem suporte a áudio são testadas antes das CLIs locais. Ordem de prioridade dos provedores incluídos (empates são resolvidos alfabeticamente pelo ID do provedor): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="CLIs locais (somente áudio)">
    Binários locais prontos tornam-se uma lista ordenada de fallback:
    - `whisper-cli` primeiro somente depois que uma invocação anterior de modelo no processo atual tiver detectado Metal ou CUDA
    - `sherpa-onnx-offline` com CPU como padrão (requer `SHERPA_ONNX_MODEL_DIR` com `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` quando a aceleração é apenas compatível com a compilação ou ainda não foi observada
    - `parakeet-mlx` no Apple Silicon (compatível com MLX, uso do dispositivo não observado)
    - `whisper` (CLI do Python; usa o modelo `turbo` por padrão e o baixa automaticamente)

    A inspeção dos recursos do backend é armazenada em cache e não carrega um modelo. A capacidade da compilação, as flags de backend solicitadas e o backend observado em uma invocação real permanecem separados. O whisper.cpp detectado automaticamente mantém os logs de execução do modelo ativados para que a linha do backend selecionado pelo componente upstream possa ser registrada. As entradas explícitas de CLI mantêm a ordem, as flags de backend e as flags de saída configuradas.

  </Step>
  <Step title="Autenticação do provedor (imagem/vídeo)">
    As entradas configuradas em `models.providers.*` que oferecem suporte ao recurso são testadas antes da ordem de fallback incluída. Provedores de configuração somente para imagem que tenham um modelo compatível com imagens são registrados automaticamente para a compreensão de mídia, mesmo quando não são um plugin de fornecedor incluído.

    Ordem de prioridade dos provedores incluídos (empates são resolvidos alfabeticamente pelo ID do provedor):
    - Imagem: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Vídeo: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="CLI do Antigravity (somente imagem/vídeo)">
    O primeiro binário `agy` ou `antigravity` instalado (substitua com `OPENCLAW_ANTIGRAVITY_CLI`), isolado no diretório da mídia.
  </Step>
</Steps>

Para desativar a detecção automática de um recurso:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
A detecção de binários é feita com o melhor esforço possível no macOS/Linux/Windows; certifique-se de que a CLI esteja no `PATH` (`~` é expandido) ou defina uma entrada explícita de modelo de CLI com o caminho completo do comando.
</Note>

### Suporte a proxy (chamadas de provedores de áudio/vídeo)

A compreensão de **áudio** e **vídeo** baseada em provedores respeita as variáveis de ambiente padrão de proxy de saída, incluindo as regras de desvio `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. As variáveis em minúsculas têm precedência sobre as maiúsculas. Se nenhuma estiver definida, a compreensão de mídia usa saída direta; se o valor do proxy estiver malformado, o OpenClaw registra um aviso e usa a busca direta como fallback. A compreensão de imagens não passa por esse caminho de proxy.

## Recursos

Defina `capabilities` em uma entrada `models[]` para restringi-la a tipos de mídia específicos. Para listas compartilhadas, o OpenClaw infere os padrões de cada provedor incluído:

| Provedor                                                                 | Recursos              |
| ------------------------------------------------------------------------ | --------------------- |
| `openai`, `anthropic`, `minimax`                                         | imagem                |
| `minimax-portal`                                                         | imagem                |
| `moonshot`                                                               | imagem + vídeo        |
| `openrouter`                                                             | imagem + áudio        |
| `google` (API Gemini)                                                    | imagem + áudio + vídeo |
| `qwen`                                                                   | imagem + vídeo        |
| `deepinfra`                                                              | imagem + áudio        |
| `mistral`                                                                | áudio                 |
| `zai`                                                                    | imagem                |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | áudio                 |
| Qualquer catálogo `models.providers.<id>.models[]` com um modelo compatível com imagens | imagem                 |

Para entradas da CLI, defina `capabilities` explicitamente para evitar correspondências inesperadas; se omitido, a entrada será elegível para todas as listas de recursos em que aparecer.

## Matriz de compatibilidade dos provedores

| Recurso    | Provedores                                                                                                                                               | Observações                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagem     | Anthropic, app-server do Codex, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OAuth do OpenAI Codex, OpenRouter, Qwen, Z.AI, provedores de configuração | Plugins dos fornecedores registram o suporte a imagens; `openai/*` pode usar roteamento por chave de API ou OAuth do Codex; `codex/*` usa um turno limitado do app-server do Codex; provedores de configuração compatíveis com imagens são registrados automaticamente. |
| Áudio      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transcrição pelo provedor (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Vídeo      | Google, Moonshot, Qwen                                                                                                                                  | Compreensão de vídeo pelo provedor por meio de Plugins dos fornecedores; a compreensão de vídeo do Qwen usa os endpoints padrão do DashScope.                                                                        |

<Note>
**Observação sobre o MiniMax**: a compreensão de imagens de `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` sempre vem do provedor de mídia `MiniMax-VL-01`, pertencente ao Plugin, mesmo que metadados legados de chat do MiniMax M2.x aleguem aceitar entrada de imagens.
</Note>

## Orientações para seleção de modelos

- Prefira o modelo mais avançado da geração atual para cada recurso de mídia quando qualidade e segurança forem importantes.
- Para agentes com ferramentas que processam entradas não confiáveis, evite modelos de mídia mais antigos ou menos avançados.
- Mantenha pelo menos uma alternativa por recurso para garantir disponibilidade (um modelo de qualidade + um modelo mais rápido ou barato).
- As alternativas da CLI (`whisper-cli`, `whisper`, `gemini`) ajudam quando as APIs dos provedores estão indisponíveis.
- Os modos conhecidos de saída em arquivo são determinantes: um arquivo de transcrição inferido vazio ou ausente não produz transcrição, em vez de recorrer à saída de progresso da CLI.
- `parakeet-mlx`: use `--output-format txt` (ou `all`) com `--output-dir` e o modelo de saída padrão `{filename}`. As variáveis de ambiente upstream `PARAKEET_OUTPUT_FORMAT` e `PARAKEET_OUTPUT_TEMPLATE` também são respeitadas. O OpenClaw lê `<output-dir>/<media-basename>.txt`; o formato padrão `srt`, outros formatos e modelos de saída personalizados continuam usando stdout.

## Política de anexos

A opção `attachments` de cada recurso controla quais anexos são processados:

<ParamField path="mode" type='"first" | "all"' default="first">
  Processa apenas o primeiro anexo selecionado ou todos eles.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita a quantidade processada.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferência de seleção entre os anexos candidatos.
</ParamField>

Quando `mode: "all"`, as saídas recebem rótulos como `[Imagem 1/2]`, `[Áudio 2/2]` etc.

### Extração de anexos de arquivo

- O texto extraído do arquivo é encapsulado como conteúdo externo não confiável antes de ser acrescentado ao prompt de mídia, usando marcadores de limite como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, além de uma linha de metadados `Source: External`.
- Esse caminho omite intencionalmente o longo banner `SECURITY NOTICE:` para manter o prompt de mídia curto; os marcadores de limite e os metadados continuam sendo aplicados.
- Um arquivo sem texto extraível recebe `[Nenhum texto extraível]`.
- Se um PDF recorrer a imagens renderizadas das páginas, o OpenClaw encaminhará essas imagens aos modelos de resposta com capacidade de visão e manterá o espaço reservado `[Conteúdo do PDF renderizado como imagens]` no bloco do arquivo.

## Exemplos de configuração

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Audio + video only">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Multi-modal single entry">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Saída de status

Quando a compreensão de mídia é executada, `/status` inclui uma linha de resumo por recurso:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Para o inventário de pré-verificação, execute `openclaw capability audio providers`. As linhas locais mostram separadamente a alternativa local selecionada, a seleção global de provedores, a prontidão e os campos distintos de back-end compatível, solicitado e observado. A mesma seleção local está disponível como uma constatação informativa do doctor:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Observações

- A compreensão é feita com o melhor esforço possível. Erros não bloqueiam as respostas.
- Os anexos ainda são enviados aos modelos mesmo quando a compreensão está desativada.
- Use `scope` para limitar onde a compreensão é executada (por exemplo, somente em mensagens diretas).

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Compatibilidade com imagens e mídia](/pt-BR/nodes/images)
