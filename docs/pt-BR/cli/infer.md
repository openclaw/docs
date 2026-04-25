---
read_when:
    - Adicionando ou modificando comandos `openclaw infer`
    - Projetando automação estável de capacidades headless
summary: CLI com inferência automática para fluxos de trabalho de modelo, imagem, áudio, TTS, vídeo, web e embeddings com suporte de provedor
title: CLI de inferência
x-i18n:
    generated_at: "2026-04-25T18:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23242bfa8a354b949473322f47da90876e05a5e54d467ca134f2e59c3ae8bb02
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` é a superfície headless canônica para fluxos de trabalho de inferência com suporte de provedor.

Ele expõe intencionalmente famílias de capacidades, não nomes brutos de RPC do gateway nem ids brutos de ferramentas do agente.

## Transforme o infer em uma skill

Copie e cole isto em um agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Uma boa skill baseada em infer deve:

- mapear intenções comuns do usuário para o subcomando infer correto
- incluir alguns exemplos canônicos de infer para os fluxos de trabalho que cobre
- preferir `openclaw infer ...` em exemplos e sugestões
- evitar documentar novamente toda a superfície de infer dentro do corpo da skill

Cobertura típica de uma skill focada em infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Por que usar infer

`openclaw infer` fornece uma CLI consistente para tarefas de inferência com suporte de provedor dentro do OpenClaw.

Benefícios:

- Use os provedores e modelos já configurados no OpenClaw em vez de criar wrappers pontuais para cada backend.
- Mantenha fluxos de trabalho de modelo, imagem, transcrição de áudio, TTS, vídeo, web e embeddings sob uma única árvore de comandos.
- Use um formato de saída `--json` estável para scripts, automação e fluxos de trabalho orientados por agente.
- Prefira uma superfície oficial do OpenClaw quando a tarefa for fundamentalmente "executar inferência".
- Use o caminho local normal sem exigir o gateway para a maioria dos comandos infer.

Para verificações ponta a ponta do provedor, prefira `openclaw infer ...` quando os testes de provedor de nível mais baixo já estiverem verdes. Ele exercita a CLI distribuída, o carregamento de configuração, a resolução do agente padrão, a ativação de Plugin empacotado, o reparo de dependências de runtime e o runtime de capacidades compartilhado antes de a requisição ao provedor ser feita.

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

| Tarefa                  | Comando                                                                | Observações                                           |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Executar um prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                       | Usa o caminho local normal por padrão                 |
| Gerar uma imagem        | `openclaw infer image generate --prompt "..." --json`                  | Use `image edit` ao partir de um arquivo existente    |
| Descrever um arquivo de imagem | `openclaw infer image describe --file ./image.png --json`              | `--model` deve ser um `<provider/model>` com capacidade para imagem |
| Transcrever áudio       | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` deve ser `<provider/model>`                 |
| Sintetizar fala         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` é orientado a gateway                    |
| Gerar um vídeo          | `openclaw infer video generate --prompt "..." --json`                  | Aceita dicas específicas do provedor, como `--resolution` |
| Descrever um arquivo de vídeo | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` deve ser `<provider/model>`                 |
| Pesquisar na web        | `openclaw infer web search --query "..." --json`                       |                                                       |
| Buscar uma página web   | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Criar embeddings        | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportamento

- `openclaw infer ...` é a superfície principal da CLI para esses fluxos de trabalho.
- Use `--json` quando a saída for consumida por outro comando ou script.
- Use `--provider` ou `--model provider/model` quando um backend específico for necessário.
- Para `image describe`, `audio transcribe` e `video describe`, `--model` deve usar o formato `<provider/model>`.
- Para `image describe`, um `--model` explícito executa esse provedor/modelo diretamente. O modelo deve ter capacidade para imagem no catálogo de modelos ou na configuração do provedor. `codex/<model>` executa um turno limitado de entendimento de imagem do servidor de app Codex; `openai-codex/<model>` usa o caminho do provedor OAuth do OpenAI Codex.
- Comandos de execução stateless usam local por padrão.
- Comandos de estado gerenciado pelo gateway usam gateway por padrão.
- O caminho local normal não exige que o gateway esteja em execução.
- `model run` é de execução única. Servidores MCP abertos por meio do runtime do agente para esse comando são encerrados após a resposta, tanto na execução local quanto com `--gateway`, então invocações repetidas em scripts não mantêm processos filho MCP via stdio em execução.

## Model

Use `model` para inferência de texto com suporte de provedor e inspeção de modelo/provedor.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Observações:

- `model run` reutiliza o runtime do agente para que substituições de provedor/modelo se comportem como na execução normal do agente.
- Como `model run` é destinado à automação headless, ele não mantém runtimes MCP empacotados por sessão após o comando terminar.
- `model auth login`, `model auth logout` e `model auth status` gerenciam o estado de autenticação salvo do provedor.

## Image

Use `image` para geração, edição e descrição.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Observações:

- Use `image edit` ao partir de arquivos de entrada existentes.
- Use `image providers --json` para verificar quais provedores de imagem empacotados são detectáveis, estão configurados, selecionados e quais capacidades de geração/edição cada provedor expõe.
- Use `image generate --model <provider/model> --json` como o teste de fumaça mais restrito da CLI em tempo real para mudanças na geração de imagens. Exemplo:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  A resposta JSON informa `ok`, `provider`, `model`, `attempts` e os caminhos de saída gravados. Quando `--output` é definido, a extensão final pode seguir o tipo MIME retornado pelo provedor.

- Para `image describe`, `--model` deve ser um `<provider/model>` com capacidade para imagem.
- Para modelos de visão locais do Ollama, baixe o modelo primeiro e defina `OLLAMA_API_KEY` com qualquer valor placeholder, por exemplo `ollama-local`. Consulte [Ollama](/pt-BR/providers/ollama#vision-and-image-description).

## Audio

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

- `tts status` usa gateway por padrão porque reflete o estado de TTS gerenciado pelo gateway.
- Use `tts providers`, `tts voices` e `tts set-provider` para inspecionar e configurar o comportamento de TTS.

## Video

Use `video` para geração e descrição.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Observações:

- `video generate` aceita `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` e `--timeout-ms`, e os encaminha ao runtime de geração de vídeo.
- `--model` deve ser `<provider/model>` para `video describe`.

## Web

Use `web` para fluxos de trabalho de pesquisa e busca.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Observações:

- Use `web providers` para inspecionar os provedores disponíveis, configurados e selecionados.

## Embedding

Use `embedding` para criação de vetores e inspeção do provedor de embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Saída JSON

Os comandos infer normalizam a saída JSON em um envelope compartilhado:

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

Para comandos de mídia gerada, `outputs` contém arquivos gravados pelo OpenClaw. Use `path`, `mimeType`, `size` e quaisquer dimensões específicas de mídia nesse array para automação, em vez de analisar stdout legível por humanos.

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

- `openclaw capability ...` é um alias de `openclaw infer ...`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Models](/pt-BR/concepts/models)
