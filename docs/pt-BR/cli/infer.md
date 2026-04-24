---
read_when:
    - Adicionando ou modificando comandos de `openclaw infer`
    - Projetando automação estável de capacidades headless
summary: CLI infer-first para fluxos de trabalho com suporte de provedor para modelo, imagem, áudio, TTS, vídeo, web e embeddings
title: CLI de inferência
x-i18n:
    generated_at: "2026-04-24T05:45:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` é a superfície headless canônica para fluxos de trabalho de inferência com suporte de provedor.

Ele expõe intencionalmente famílias de capacidades, não nomes brutos de RPC do gateway nem IDs brutos de ferramentas do agente.

## Transforme infer em uma skill

Copie e cole isto para um agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Uma boa skill baseada em infer deve:

- mapear intenções comuns do usuário para o subcomando infer correto
- incluir alguns exemplos canônicos de infer para os fluxos de trabalho que cobre
- preferir `openclaw infer ...` em exemplos e sugestões
- evitar redocumentar toda a superfície de infer dentro do corpo da skill

Cobertura típica de skill focada em infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Por que usar infer

`openclaw infer` fornece uma CLI consistente para tarefas de inferência com suporte de provedor dentro do OpenClaw.

Benefícios:

- Use os provedores e modelos já configurados no OpenClaw em vez de criar wrappers isolados para cada backend.
- Mantenha fluxos de trabalho de modelo, imagem, transcrição de áudio, TTS, vídeo, web e embeddings sob uma única árvore de comandos.
- Use um formato estável de saída `--json` para scripts, automação e fluxos de trabalho dirigidos por agentes.
- Prefira uma superfície nativa do OpenClaw quando a tarefa for fundamentalmente “executar inferência”.
- Use o caminho local normal sem exigir o gateway para a maioria dos comandos infer.

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

| Tarefa                  | Comando                                                               | Observações                                           |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Executar um prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`            | Usa o caminho local normal por padrão                 |
| Gerar uma imagem        | `openclaw infer image generate --prompt "..." --json`                 | Use `image edit` ao partir de um arquivo existente    |
| Descrever um arquivo de imagem | `openclaw infer image describe --file ./image.png --json`       | `--model` deve ser um `<provider/model>` com suporte a imagem |
| Transcrever áudio       | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` deve ser `<provider/model>`                 |
| Sintetizar fala         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` é orientado ao gateway                 |
| Gerar um vídeo          | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Descrever um arquivo de vídeo | `openclaw infer video describe --file ./clip.mp4 --json`       | `--model` deve ser `<provider/model>`                 |
| Pesquisar na web        | `openclaw infer web search --query "..." --json`                      |                                                       |
| Buscar uma página web   | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Criar embeddings        | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Comportamento

- `openclaw infer ...` é a superfície principal da CLI para esses fluxos de trabalho.
- Use `--json` quando a saída for consumida por outro comando ou script.
- Use `--provider` ou `--model provider/model` quando um backend específico for necessário.
- Para `image describe`, `audio transcribe` e `video describe`, `--model` deve usar a forma `<provider/model>`.
- Para `image describe`, um `--model` explícito executa diretamente esse provedor/modelo. O modelo deve ter suporte a imagem no catálogo de modelos ou na configuração do provedor. `codex/<model>` executa um turno limitado de entendimento de imagem no servidor de apps do Codex; `openai-codex/<model>` usa o caminho do provedor OAuth do OpenAI Codex.
- Comandos de execução sem estado usam o modo local por padrão.
- Comandos de estado gerenciado pelo gateway usam o gateway por padrão.
- O caminho local normal não exige que o gateway esteja em execução.

## Modelo

Use `model` para inferência de texto com suporte de provedor e inspeção de modelo/provedor.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Observações:

- `model run` reutiliza o runtime do agente para que substituições de provedor/modelo se comportem como na execução normal do agente.
- `model auth login`, `model auth logout` e `model auth status` gerenciam o estado salvo de autenticação do provedor.

## Imagem

Use `image` para geração, edição e descrição.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Observações:

- Use `image edit` ao começar com arquivos de entrada existentes.
- Para `image describe`, `--model` deve ser um `<provider/model>` com suporte a imagem.
- Para modelos locais de visão do Ollama, faça o pull do modelo primeiro e defina `OLLAMA_API_KEY` com qualquer valor placeholder, por exemplo `ollama-local`. Consulte [Ollama](/pt-BR/providers/ollama#vision-and-image-description).

## Áudio

Use `audio` para transcrição de arquivos.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Observações:

- `audio transcribe` é para transcrição de arquivos, não para gerenciamento de sessão em tempo real.
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

- `tts status` usa o gateway por padrão porque reflete o estado de TTS gerenciado pelo gateway.
- Use `tts providers`, `tts voices` e `tts set-provider` para inspecionar e configurar o comportamento de TTS.

## Vídeo

Use `video` para geração e descrição.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Observações:

- `--model` deve ser `<provider/model>` para `video describe`.

## Web

Use `web` para fluxos de trabalho de busca e busca de páginas.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Observações:

- Use `web providers` para inspecionar provedores disponíveis, configurados e selecionados.

## Embedding

Use `embedding` para criação de vetores e inspeção de provedores de embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Saída JSON

Os comandos infer normalizam a saída JSON sob um envelope compartilhado:

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

## Armadilhas comuns

```bash
# Ruim
openclaw infer media image generate --prompt "friendly lobster"

# Bom
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Ruim
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Bom
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Observações

- `openclaw capability ...` é um alias para `openclaw infer ...`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Modelos](/pt-BR/concepts/models)
