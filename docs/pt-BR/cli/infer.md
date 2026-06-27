---
read_when:
    - Adicionar ou modificar comandos `openclaw infer`
    - Criando automação estável de recursos headless
summary: CLI de inferência primeiro para fluxos de trabalho com suporte de provedores para modelos, imagens, áudio, TTS, vídeo, web e embeddings
title: CLI de inferência
x-i18n:
    generated_at: "2026-06-27T17:19:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` é a superfície headless canônica para fluxos de trabalho de inferência com suporte de provedores.

Ela expõe intencionalmente famílias de capacidades, não nomes brutos de RPC do gateway nem ids brutos de ferramentas de agentes.

## Transformar infer em uma skill

Copie e cole isto para um agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Uma boa skill baseada em infer deve:

- mapear intenções comuns do usuário para o subcomando infer correto
- incluir alguns exemplos canônicos de infer para os fluxos de trabalho que cobre
- preferir `openclaw infer ...` em exemplos e sugestões
- evitar redocumentar toda a superfície de infer no corpo da skill

Cobertura típica de uma skill focada em infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Por que usar infer

`openclaw infer` fornece uma CLI consistente para tarefas de inferência com suporte de provedores dentro do OpenClaw.

Benefícios:

- Use os provedores e modelos já configurados no OpenClaw em vez de montar wrappers pontuais para cada backend.
- Mantenha fluxos de trabalho de modelo, imagem, transcrição de áudio, TTS, vídeo, web e embeddings sob uma única árvore de comandos.
- Use um formato de saída `--json` estável para scripts, automação e fluxos de trabalho conduzidos por agentes.
- Prefira uma superfície primária do OpenClaw quando a tarefa for fundamentalmente "executar inferência".
- Use o caminho local normal sem exigir o gateway para a maioria dos comandos infer.

Para verificações de provedores de ponta a ponta, prefira `openclaw infer ...` quando os testes de provedor de nível inferior estiverem verdes. Ele exercita a CLI distribuída, o carregamento de configuração, a resolução do agente padrão, a ativação de plugins incluídos e o runtime de capacidades compartilhadas antes que a solicitação ao provedor seja feita.

## Árvore de comandos

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tarefas comuns

Esta tabela mapeia tarefas comuns de inferência para o comando infer correspondente.

| Tarefa                        | Comando                                                                                       | Observações                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Executar um prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                                              | Usa o caminho local normal por padrão                 |
| Executar um prompt de modelo em imagens | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repita `--file` para múltiplas entradas de imagem     |
| Gerar uma imagem              | `openclaw infer image generate --prompt "..." --json`                                         | Use `image edit` ao iniciar a partir de um arquivo existente |
| Descrever um arquivo de imagem ou URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` deve ser um `<provider/model>` compatível com imagem |
| Transcrever áudio             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` deve ser `<provider/model>`                 |
| Sintetizar fala               | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` é orientado ao gateway                   |
| Gerar um vídeo                | `openclaw infer video generate --prompt "..." --json`                                         | Aceita dicas de provedor, como `--resolution`         |
| Descrever um arquivo de vídeo | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` deve ser `<provider/model>`                 |
| Pesquisar na web              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Buscar uma página da web      | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Criar embeddings              | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportamento

- `openclaw infer ...` é a superfície principal de CLI para esses fluxos de trabalho.
- Use `--json` quando a saída for consumida por outro comando ou script.
- Use `--provider` ou `--model provider/model` quando um backend específico for necessário.
- Use `model run --thinking <level>` para passar um nível pontual de pensamento/raciocínio (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` ou `max`) mantendo a execução bruta.
- Para `image describe`, `audio transcribe` e `video describe`, `--model` deve usar o formato `<provider/model>`.
- Para `image describe`, `--file` aceita caminhos locais e URLs de imagens HTTP(S). URLs remotas usam a política normal de SSRF de busca de mídia.
- Para `image describe`, um `--model` explícito executa diretamente esse provedor/modelo. O modelo deve ser compatível com imagem no catálogo de modelos ou na configuração do provedor. `codex/<model>` executa uma rodada limitada de entendimento de imagem no servidor de aplicativo Codex; `openai/<model>` usa o caminho do provedor OpenAI com autenticação por chave de API ou OAuth ChatGPT/Codex.
- Comandos de execução sem estado usam local por padrão.
- Comandos de estado gerenciados pelo Gateway usam gateway por padrão.
- O caminho local normal não exige que o gateway esteja em execução.
- `model run` local é uma conclusão enxuta e pontual de provedor. Ele resolve o modelo e a autenticação configurados do agente, mas não inicia uma rodada de agente de chat, carrega ferramentas nem abre servidores MCP incluídos.
- `model run --file` aceita arquivos de imagem, detecta seu tipo MIME e os envia com o prompt fornecido para o modelo selecionado. Repita `--file` para múltiplas imagens.
- `model run --file` rejeita entradas que não sejam imagens. Use `infer audio transcribe` para arquivos de áudio e `infer video describe` para arquivos de vídeo.
- `model run --gateway` exercita o roteamento do Gateway, autenticação salva, seleção de provedor e o runtime incorporado, mas ainda executa como uma sondagem bruta de modelo: envia o prompt fornecido e quaisquer anexos de imagem sem transcrição prévia da sessão, contexto de bootstrap/AGENTS, montagem do mecanismo de contexto, ferramentas ou servidores MCP incluídos.
- `model run --gateway --model <provider/model>` exige uma credencial de gateway de operador confiável porque a solicitação pede ao Gateway para executar uma substituição pontual de provedor/modelo.
- `model run --thinking` local usa o caminho enxuto de conclusão de provedor; níveis específicos de provedor, como `adaptive` e `max`, são mapeados para o nível portátil de conclusão simples mais próximo.

## Modelo

Use `model` para inferência de texto com suporte de provedor e inspeção de modelo/provedor.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Use referências completas `<provider/model>` para fazer um smoke test de um provedor específico sem iniciar o Gateway nem carregar a superfície completa de ferramentas do agente:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Observações:

- `model run` local é o smoke mais restrito da CLI para integridade de provedor/modelo/autenticação porque, para provedores que não sejam Codex, envia apenas o prompt fornecido ao modelo selecionado.
- `model run --model <provider/model>` local pode usar linhas exatas do catálogo estático incluído de `models list --all` antes que esse provedor seja gravado na configuração. A autenticação do provedor ainda é obrigatória; credenciais ausentes falham como erros de autenticação, não como `Unknown model`.
- Para sondagens de raciocínio do Mistral Medium 3.5, deixe a temperatura não definida/padrão. O Mistral rejeita `reasoning_effort="high"` mais `temperature: 0`; use `mistral/mistral-medium-3-5` com temperatura padrão ou um valor de modo de raciocínio diferente de zero, como `0.7`.
- Sondagens locais de Codex Responses são a exceção estreita: o OpenClaw adiciona uma instrução mínima de sistema para que o transporte possa preencher seu campo `instructions` obrigatório, sem adicionar contexto completo de agente, ferramentas, memória ou transcrição de sessão.
- `model run --file` local mantém esse caminho enxuto e anexa o conteúdo da imagem diretamente à única mensagem do usuário. Arquivos de imagem comuns, como PNG, JPEG e WebP, funcionam quando seu tipo MIME é detectado como `image/*`; arquivos sem suporte ou não reconhecidos falham antes que o provedor seja chamado.
- `model run --file` é melhor quando você quer testar diretamente o modelo de texto multimodal selecionado. Use `infer image describe` quando quiser a seleção de provedor de entendimento de imagem do OpenClaw e o roteamento padrão de modelo de imagem.
- O modelo selecionado deve aceitar entrada de imagem; modelos somente de texto podem rejeitar a solicitação na camada do provedor.
- `model run --prompt` deve conter texto que não seja apenas espaços em branco; prompts vazios são rejeitados antes que provedores locais ou o Gateway sejam chamados.
- `model run` local sai com código diferente de zero quando o provedor não retorna saída de texto, portanto provedores locais inacessíveis e conclusões vazias não parecem sondagens bem-sucedidas.
- Use `model run --gateway` quando precisar testar o roteamento do Gateway, a configuração do runtime do agente ou o estado de provedor gerenciado pelo Gateway mantendo a entrada do modelo bruta. Use `openclaw agent` ou superfícies de chat quando quiser o contexto completo do agente, ferramentas, memória e transcrição de sessão.
- `model auth login`, `model auth logout` e `model auth status` gerenciam o estado de autenticação salvo do provedor.

## Imagem

Use `image` para geração, edição e descrição.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Observações:

- Use `image edit` ao começar a partir de arquivos de entrada existentes.
- Use `--size`, `--aspect-ratio` ou `--resolution` com `image edit` para
  provedores/modelos que oferecem suporte a dicas de geometria em edições de imagem de referência.
- Use `--output-format png --background transparent` com
  `--model openai/gpt-image-1.5` para saída PNG da OpenAI com fundo transparente;
  `--openai-background` continua disponível como um alias específico da OpenAI. Provedores
  que não declaram suporte a fundo relatam a dica como uma substituição ignorada.
- Use `--quality low|medium|high|auto` para provedores que oferecem suporte a dicas de qualidade
  de imagem, incluindo a OpenAI. A OpenAI também aceita `--openai-moderation low|auto` para
  a dica de moderação específica do provedor.
- Use `image providers --json` para verificar quais provedores de imagem incluídos são
  detectáveis, configurados, selecionados e quais recursos de geração/edição
  cada provedor expõe.
- Use `image generate --model <provider/model> --json` como o teste de fumaça em tempo real
  mais restrito da CLI para mudanças de geração de imagens. Exemplo:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  A resposta JSON relata `ok`, `provider`, `model`, `attempts` e caminhos de
  saída gravados. Quando `--output` é definido, a extensão final pode seguir o
  tipo MIME retornado pelo provedor.

- Para `image describe` e `image describe-many`, use `--prompt` para dar ao modelo de visão uma instrução específica da tarefa, como OCR, comparação, inspeção de UI ou criação de legenda concisa.
- Use `--timeout-ms` com modelos locais de visão lentos ou inicializações a frio do Ollama.
- Para `image describe`, `--model` deve ser um `<provider/model>` com suporte a imagem.
- Para modelos locais de visão do Ollama, baixe o modelo primeiro e defina `OLLAMA_API_KEY` como qualquer valor de espaço reservado, por exemplo `ollama-local`. Consulte [Ollama](/pt-BR/providers/ollama#vision-and-image-description).

## Áudio

Use `audio` para transcrição de arquivos.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Observações:

- `audio transcribe` é para transcrição de arquivos, não para gerenciamento de sessões em tempo real.
- `--model` deve ser `<provider/model>`.

## TTS

Use `tts` para síntese de fala e estado do provedor de TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Observações:

- `tts status` usa Gateway por padrão porque reflete o estado de TTS gerenciado pelo Gateway.
- Use `tts providers`, `tts voices` e `tts set-provider` para inspecionar e configurar o comportamento de TTS.

## Vídeo

Use `video` para geração e descrição.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Observações:

- `video generate` aceita `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` e `--timeout-ms`, e os encaminha para o runtime de geração de vídeo.
- `--model` deve ser `<provider/model>` para `video describe`.

## Web

Use `web` para fluxos de trabalho de busca e obtenção.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Observações:

- Use `web providers` para inspecionar provedores disponíveis, configurados e selecionados.

## Incorporação

Use `embedding` para criação de vetores e inspeção de provedores de incorporação.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Saída JSON

Os comandos Infer normalizam a saída JSON em um envelope compartilhado:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Os campos de nível superior são estáveis:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Para comandos de mídia gerada, `outputs` contém arquivos gravados pelo OpenClaw. Use
`path`, `mimeType`, `size` e quaisquer dimensões específicas de mídia nesse array
para automação em vez de analisar stdout legível por humanos.

## Armadilhas comuns

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Observações

- `openclaw capability ...` é um alias para `openclaw infer ...`.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Modelos](/pt-BR/concepts/models)
