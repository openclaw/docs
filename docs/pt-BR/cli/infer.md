---
read_when:
    - Adicionando ou modificando comandos `openclaw infer`
    - Projetando uma automação estável de recursos sem interface gráfica
summary: CLI com inferência em primeiro lugar para fluxos de trabalho de modelos, imagens, áudio, TTS, vídeo, web e embeddings baseados em provedores
title: CLI de inferência
x-i18n:
    generated_at: "2026-07-12T15:05:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` é a interface headless canônica para inferência apoiada por provedores. Ela expõe famílias de recursos (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), não nomes brutos de RPC do Gateway nem ids de ferramentas do agente. `openclaw capability ...` é um alias para a mesma árvore de comandos.

Motivos para preferi-la a um wrapper específico de provedor:

- Reutiliza provedores e modelos já configurados no OpenClaw.
- Envelope `--json` estável para scripts e automação orientada por agentes (consulte [Saída JSON](#json-output)).
- Executa o caminho local normal sem o Gateway para a maioria dos subcomandos.
- Para verificações de provedor de ponta a ponta, exercita a CLI distribuída, o carregamento da configuração, a resolução do agente padrão, a ativação de plugins incluídos e o runtime de recursos compartilhado antes de enviar a solicitação ao provedor.

## Transforme infer em uma skill

Copie e cole isto para um agente:

```text
Leia https://docs.openclaw.ai/cli/infer e crie uma skill que encaminhe meus fluxos de trabalho comuns para `openclaw infer`.
Concentre-se em execuções de modelos, geração de imagens, geração de vídeos, transcrição de áudio, TTS, pesquisa na web e embeddings.
```

Uma boa skill baseada em infer mapeia intenções comuns do usuário para o subcomando correto, inclui alguns exemplos canônicos por fluxo de trabalho, prefere `openclaw infer ...` a alternativas de nível mais baixo e não documenta novamente toda a interface de infer no corpo da skill.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` mostram essa árvore como dados (id do recurso, transportes, descrição).

## Tarefas comuns

| Tarefa                               | Comando                                                                                       | Observações                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Executar um prompt de texto/modelo   | `openclaw infer model run --prompt "..." --json`                                              | Local por padrão                                                |
| Executar um prompt de modelo em imagens | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Repita `--file` para várias imagens                             |
| Gerar uma imagem                     | `openclaw infer image generate --prompt "..." --json`                                         | Use `image edit` ao começar com um arquivo existente            |
| Descrever um arquivo de imagem ou URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` deve ser um `<provider/model>` compatível com imagens |
| Transcrever áudio                    | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` deve ser `<provider/model>`                            |
| Sintetizar fala                      | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` só é executado por meio do Gateway                  |
| Gerar um vídeo                       | `openclaw infer video generate --prompt "..." --json`                                         | Aceita dicas do provedor, como `--resolution`                    |
| Descrever um arquivo de vídeo        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` deve ser `<provider/model>`                            |
| Pesquisar na web                     | `openclaw infer web search --query "..." --json`                                              |                                                                 |
| Buscar uma página da web             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                                 |
| Criar embeddings                     | `openclaw infer embedding create --text "..." --json`                                         |                                                                 |

## Comportamento

- Use `--json` quando a saída alimentar outro comando ou script; caso contrário, use saída de texto.
- Use `--provider` ou `--model provider/model` para fixar um backend específico.
- Use `model run --thinking <level>` para uma substituição pontual do nível de pensamento/raciocínio: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` ou `max`.
- Para `image describe`, `audio transcribe` e `video describe`, `--model` deve usar o formato `<provider/model>`.
- Para `image describe`, `--file` aceita caminhos locais e URLs HTTP(S); URLs remotas passam pela política normal de SSRF da busca de mídia.
- Comandos de execução sem estado (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) usam o modo local por padrão. Comandos de estado gerenciados pelo Gateway (`tts status`) usam o Gateway por padrão.
- O caminho local nunca exige que o Gateway esteja em execução.
- O `model run` local é uma conclusão pontual e enxuta do provedor: resolve o modelo e a autenticação configurados para o agente, mas não inicia um turno de agente de chat, carrega ferramentas nem abre servidores MCP incluídos.
- `model run --file` anexa arquivos de imagem (com tipo MIME detectado automaticamente) ao prompt; repita `--file` para várias imagens. Arquivos que não sejam imagens são rejeitados — use `infer audio transcribe` ou `infer video describe`.
- `model run --gateway` exercita o roteamento do Gateway, a autenticação salva, a seleção de provedor e o runtime incorporado, mas continua sendo uma sondagem bruta do modelo: sem transcrição da sessão anterior, contexto de bootstrap/AGENTS, ferramentas ou servidores MCP incluídos.
- `model run --gateway --model <provider/model>` exige uma credencial de Gateway de operador confiável, pois solicita que o Gateway execute uma substituição pontual de provedor/modelo.

## Modelo

Inferência de texto e inspeção de modelos/provedores.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Use referências completas no formato `<provider/model>` com `--local` para fazer um teste rápido de um provedor sem iniciar o Gateway nem carregar a interface de ferramentas do agente:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Observações:

- O `model run` local é o teste rápido de CLI mais restrito para verificar a integridade do provedor/modelo/autenticação: para provedores que não sejam ChatGPT-Codex, ele envia apenas o prompt fornecido.
- O `model run --model <provider/model>` local pode resolver linhas exatas do catálogo estático incluído (as mesmas linhas mostradas por `openclaw models list --all`) antes que esse provedor seja gravado na configuração. A autenticação do provedor ainda é obrigatória; a ausência de credenciais resulta em erros de autenticação, não em `Unknown model`.
- Para sondagens de raciocínio do Mistral Medium 3.5, deixe a temperatura não definida/no valor padrão. O Mistral rejeita `reasoning_effort="high"` com `temperature: 0`; use a temperatura padrão ou um valor diferente de zero, como `0.7`.
- Sondagens locais com OAuth do OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) adicionam uma instrução mínima de sistema para que o transporte possa preencher o campo obrigatório `instructions` — sem contexto completo do agente, ferramentas, memória ou transcrição da sessão.
- `model run --file` anexa o conteúdo da imagem diretamente à única mensagem do usuário. Formatos comuns (PNG, JPEG, WebP) funcionam quando o tipo MIME é detectado como `image/*`; arquivos incompatíveis ou não reconhecidos falham antes que o provedor seja chamado. Use `infer image describe` quando quiser o roteamento e os fallbacks de modelos de imagem do OpenClaw em vez de uma sondagem direta de modelo multimodal.
- O modelo selecionado deve aceitar entrada de imagem; modelos somente de texto podem rejeitar a solicitação na camada do provedor.
- `model run --prompt` deve conter texto que não seja apenas espaços em branco; prompts vazios são rejeitados antes de qualquer chamada ao provedor ou ao Gateway.
- O `model run` local encerra com código diferente de zero quando o provedor não retorna saída de texto, para que provedores inacessíveis e conclusões vazias não pareçam sondagens bem-sucedidas.
- Use `model run --gateway` para testar o roteamento do Gateway ou a configuração do runtime do agente, mantendo a entrada do modelo bruta. Use `openclaw agent` ou uma interface de chat para obter contexto completo do agente, ferramentas, memória e transcrição da sessão.
- `--thinking adaptive` é mapeado para o nível `medium` do runtime de conclusão; `--thinking max` é mapeado para `max` em modelos OpenAI compatíveis com o esforço máximo nativo e, nos demais casos, para `xhigh`.
- `model auth login`, `model auth logout` e `model auth status` gerenciam o estado salvo da autenticação do provedor.

## Imagem

Geração, edição e descrição.

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

- Use `image edit` ao começar com arquivos de entrada existentes; `--size`, `--aspect-ratio` ou `--resolution` adicionam sugestões de geometria nos provedores/modelos compatíveis.
- `--output-format png --background transparent` com `--model openai/gpt-image-1.5` gera uma saída PNG da OpenAI com fundo transparente; `--openai-background` é um alias específico da OpenAI para a mesma sugestão. Provedores que não declaram compatibilidade com fundo informam essa opção como uma substituição ignorada (consulte `ignoredOverrides` no [envelope JSON](#json-output)).
- `--quality low|medium|high|auto` funciona com provedores compatíveis com sugestões de qualidade de imagem, incluindo a OpenAI. A OpenAI também aceita `--openai-moderation low|auto`.
- `image providers --json` lista quais provedores de imagem incluídos são detectáveis, configurados e selecionados, além dos recursos de geração/edição que cada um oferece.
- `image generate --model <provider/model> --json` é o teste de fumaça ao vivo mais específico para alterações na geração de imagens:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Imagem de teste plana e minimalista: um quadrado azul sobre um fundo branco, sem texto." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  A resposta informa `ok`, `provider`, `model`, `attempts` e os caminhos das saídas gravadas. Quando `--output` é definido, a extensão final pode seguir o tipo MIME retornado pelo provedor.

- Para `image describe` e `image describe-many`, use `--prompt` para fornecer uma instrução específica da tarefa (OCR, comparação, inspeção da interface, criação de legendas concisas).
- Use `--timeout-ms` para modelos locais de visão lentos ou inicializações a frio do Ollama.
- Para `image describe`, um `--model` explícito (deve ser um `<provider/model>` com capacidade de imagem) é executado primeiro; em seguida, se essa chamada falhar, são tentados os fallbacks configurados em `agents.defaults.imageModel.fallbacks`. Erros de preparação da entrada (arquivo ausente, URL não compatível) causam falha antes de qualquer tentativa de fallback, e o modelo deve ter capacidade de imagem no catálogo de modelos ou na configuração do provedor.
- Para modelos locais de visão do Ollama, baixe primeiro o modelo e defina `OLLAMA_API_KEY` como qualquer valor de espaço reservado, por exemplo, `ollama-local`. Consulte [Ollama](/pt-BR/providers/ollama#vision-and-image-description).

## Áudio

Transcrição de arquivos (não gerenciamento de sessões em tempo real).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Concentre-se em nomes e itens de ação" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` deve ser `<provider/model>`.

## TTS

Síntese de fala e estado do provedor/persona de TTS.

```bash
openclaw infer tts convert --text "olá do openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Sua compilação foi concluída" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Observações:

- `tts status` só é compatível com `--gateway` (ele reflete o estado de TTS gerenciado pelo Gateway).
- Use `tts providers`, `tts voices`, `tts personas`, `tts set-provider` e `tts set-persona` para inspecionar e configurar o comportamento de TTS.

## Vídeo

Geração e descrição.

```bash
openclaw infer video generate --prompt "pôr do sol cinematográfico sobre o oceano" --json
openclaw infer video generate --prompt "tomada lenta de drone sobre um lago na floresta" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Observações:

- `video generate` aceita `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` e `--timeout-ms`, que são encaminhados ao runtime de geração de vídeo.
- `--model` deve ser `<provider/model>` para `video describe`.

## Web

Pesquisa e busca de conteúdo.

```bash
openclaw infer web search --query "documentação do OpenClaw" --json
openclaw infer web search --query "provedores web do OpenClaw infer" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` lista os provedores disponíveis, configurados e selecionados para pesquisa e busca de conteúdo.

## Embedding

Criação de vetores e inspeção de provedores de embedding.

```bash
openclaw infer embedding create --text "lagosta amigável" --json
openclaw infer embedding create --text "tíquete de suporte ao cliente: envio atrasado" --model openai/text-embedding-3-large --json
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

Campos estáveis de nível superior:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (anexos de imagem enviados com a solicitação, quando aplicável)
- `outputs`
- `ignoredOverrides` (chaves de sugestão não compatíveis com um provedor, quando aplicável)
- `error`

Para comandos de mídia gerada, `outputs` contém os arquivos gravados pelo OpenClaw. Para automação, use `path`, `mimeType`, `size` e quaisquer dimensões específicas da mídia nesse array, em vez de analisar o stdout legível por humanos.

## Armadilhas comuns

```bash
# Ruim
openclaw infer media image generate --prompt "lagosta amigável"

# Bom
openclaw infer image generate --prompt "lagosta amigável"
```

```bash
# Ruim
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Bom
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Modelos](/pt-BR/concepts/models)
