---
read_when:
    - Adicionando ou modificando comandos `openclaw infer`
    - Projetando automação headless de capacidades estáveis
summary: CLI infer-first para fluxos com suporte de provedor de modelo, imagem, áudio, TTS, vídeo, web e embeddings
title: CLI de inferência
x-i18n:
    generated_at: "2026-04-23T14:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# CLI de inferência

`openclaw infer` é a superfície headless canônica para fluxos de inferência com suporte de provedor.

Ela expõe intencionalmente famílias de capacidades, não nomes brutos de RPC do Gateway nem IDs brutos de ferramentas de agente.

## Transforme infer em uma skill

Copie e cole isto em um agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Uma boa skill baseada em infer deve:

- mapear intenções comuns do usuário para o subcomando infer correto
- incluir alguns exemplos canônicos de infer para os fluxos que ela cobre
- preferir `openclaw infer ...` em exemplos e sugestões
- evitar redocumentar toda a superfície de infer dentro do corpo da skill

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
- Mantenha fluxos de modelo, imagem, transcrição de áudio, TTS, vídeo, web e embedding sob uma única árvore de comandos.
- Use um formato de saída `--json` estável para scripts, automação e fluxos dirigidos por agente.
- Prefira uma superfície nativa do OpenClaw quando a tarefa for fundamentalmente “executar inferência”.
- Use o caminho local normal sem exigir o Gateway para a maioria dos comandos infer.

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
| Sintetizar fala         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` é orientado ao Gateway                  |
| Gerar um vídeo          | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Descrever um arquivo de vídeo | `openclaw infer video describe --file ./clip.mp4 --json`         | `--model` deve ser `<provider/model>`                 |
| Pesquisar na web        | `openclaw infer web search --query "..." --json`                      |                                                       |
| Buscar uma página web   | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Criar embeddings        | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Comportamento

- `openclaw infer ...` é a principal superfície de CLI para esses fluxos.
- Use `--json` quando a saída for consumida por outro comando ou script.
- Use `--provider` ou `--model provider/model` quando um backend específico for necessário.
- Para `image describe`, `audio transcribe` e `video describe`, `--model` deve usar o formato `<provider/model>`.
- Para `image describe`, um `--model` explícito executa diretamente esse provedor/modelo. O modelo deve ter suporte a imagem no catálogo de modelos ou na configuração do provedor.
- Comandos de execução stateless usam o modo local por padrão.
- Comandos de estado gerenciado pelo Gateway usam o Gateway por padrão.
- O caminho local normal não exige que o Gateway esteja em execução.

## Modelo

Use `model` para inferência de texto com suporte de provedor e inspeção de modelo/provedor.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
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

- Use `image edit` ao partir de arquivos de entrada existentes.
- Para `image describe`, `--model` deve ser um `<provider/model>` com suporte a imagem.
- Para modelos de visão locais do Ollama, baixe o modelo primeiro e defina `OLLAMA_API_KEY` com qualquer valor placeholder, por exemplo `ollama-local`. Veja [Ollama](/pt-BR/providers/ollama#vision-and-image-description).

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

- `tts status` usa o Gateway por padrão porque reflete o estado de TTS gerenciado pelo Gateway.
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

Use `web` para fluxos de pesquisa e busca.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Observações:

- Use `web providers` para inspecionar provedores disponíveis, configurados e selecionados.

## Embedding

Use `embedding` para criação de vetores e inspeção do provedor de embeddings.

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
