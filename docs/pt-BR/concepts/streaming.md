---
read_when:
    - Explicando como streaming ou chunking funciona nos canais
    - Alterando o comportamento de streaming em bloco ou chunking de canal
    - Depurando respostas em bloco duplicadas/precoces ou streaming de prévia de canal
summary: Comportamento de streaming + chunking (respostas em bloco, streaming de prévia de canal, mapeamento de modo)
title: Streaming e chunking
x-i18n:
    generated_at: "2026-04-24T05:49:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

O OpenClaw tem duas camadas separadas de streaming:

- **Streaming em bloco (canais):** emite **blocos** concluídos à medida que o assistente escreve. Essas são mensagens normais do canal (não deltas de token).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Hoje **não existe streaming verdadeiro de deltas de token** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/anexos).

## Streaming em bloco (mensagens de canal)

O streaming em bloco envia a saída do assistente em blocos maiores à medida que ela fica disponível.

```
Saída do modelo
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emite blocos à medida que o buffer cresce
       └─ (blockStreamingBreak=message_end)
            └─ chunker descarrega em message_end
                   └─ envio no canal (respostas em bloco)
```

Legenda:

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimo/máximo + preferência de quebra.
- `channel send`: mensagens reais de saída (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão desativado).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos em stream antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de chunk do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes de dividir por comprimento).
- Limite suave do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar recorte na UI.

**Semântica de limites:**

- `text_end`: transmite blocos assim que o chunker os emite; descarrega em cada `text_end`.
- `message_end`: espera até a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, então ele pode emitir vários chunks no final.

## Algoritmo de chunking (limites inferior/superior)

O chunking em bloco é implementado por `EmbeddedBlockChunker`:

- **Limite inferior:** não emite até que o buffer >= `minChars` (a menos que seja forçado).
- **Limite superior:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Code fences:** nunca divide dentro de fences; quando forçado em `maxChars`, fecha + reabre a fence para manter o Markdown válido.

`maxChars` é limitado por `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos em stream)

Quando o streaming em bloco está habilitado, o OpenClaw pode **mesclar chunks consecutivos de bloco**
antes de enviá-los. Isso reduz “spam de uma única linha” enquanto ainda fornece
saída progressiva.

- A coalescência espera por **intervalos de inatividade** (`idleMs`) antes de descarregar.
- Os buffers são limitados por `maxChars` e serão descarregados se o excederem.
- `minChars` evita que fragmentos muito pequenos sejam enviados até que texto suficiente se acumule
  (o descarregamento final sempre envia o texto restante).
- O juntador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições por canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência sobe para 1500 em Signal/Slack/Discord, salvo substituição.

## Ritmo humano entre blocos

Quando o streaming em bloco está habilitado, você pode adicionar uma **pausa aleatória** entre
respostas em bloco (após o primeiro bloco). Isso faz respostas com múltiplas bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (substituição por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais nem a resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso corresponde a:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite durante a geração). Canais que não sejam Telegram também exigem `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários chunks se for muito longo).
- **Sem streaming em bloco:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação sobre canais:** o streaming em bloco fica **desativado, a menos que**
`*.blockStreaming` seja explicitamente definido como `true`. Os canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de local da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na raiz da configuração.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita o streaming de prévia.
- `partial`: uma única prévia que é substituída pelo texto mais recente.
- `block`: a prévia é atualizada em etapas com chunks/anexos.
- `progress`: prévia de progresso/status durante a geração, resposta final ao concluir.

### Mapeamento por canal

| Canal      | `off` | `partial` | `block` | `progress`          |
| ---------- | ----- | --------- | ------- | ------------------- |
| Telegram   | ✅    | ✅        | ✅      | mapeia para `partial` |
| Discord    | ✅    | ✅        | ✅      | mapeia para `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                  |
| Mattermost | ✅    | ✅        | ✅      | ✅                  |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API nativa de streaming do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- Streaming nativo do Slack e status de thread de assistente do Slack exigem um destino de thread de resposta; DMs de nível superior não mostram essa prévia em estilo de thread.

Migração de chaves legadas:

- Telegram: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Discord: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; booleano `streaming` migra automaticamente para `streaming.mode` mais `streaming.nativeTransport`; o legado `nativeStreaming` migra automaticamente para `streaming.nativeTransport`.

### Comportamento em runtime

Telegram:

- Usa atualizações de prévia com `sendMessage` + `editMessageText` em DMs e grupos/tópicos.
- O streaming de prévia é ignorado quando o streaming em bloco do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode gravar reasoning na prévia.

Discord:

- Usa mensagens de prévia com envio + edição.
- O modo `block` usa chunking de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming em bloco do Discord está explicitamente habilitado.
- Cargas finais de mídia, erro e resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho e depois usam a entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho em estilo append.
- `progress` usa texto de prévia de status e depois a resposta final.
- Cargas finais de mídia/erro e finais de progresso não criam mensagens descartáveis de rascunho; apenas finais de texto/bloco que podem editar a prévia descarregam texto pendente do rascunho.

Mattermost:

- Transmite pensamento, atividade de ferramenta e texto parcial de resposta para um único post de prévia em rascunho que é finalizado no local quando a resposta final é segura para envio.
- Usa fallback para enviar um novo post final se o post de prévia tiver sido excluído ou estiver indisponível no momento da finalização.
- Cargas finais de mídia/erro cancelam atualizações pendentes de prévia antes da entrega normal em vez de descarregar um post temporário de prévia.

Matrix:

- Prévias em rascunho são finalizadas no local quando o texto final pode reutilizar o evento de prévia.
- Finais somente com mídia, erro e incompatibilidade de alvo de resposta cancelam atualizações pendentes de prévia antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramenta

O streaming de prévia também pode incluir atualizações de **progresso de ferramenta** — pequenas linhas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" — que aparecem na mesma mensagem de prévia enquanto as ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramenta com várias etapas visualmente ativos em vez de silenciosos entre a primeira prévia de pensamento e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack** e **Telegram** transmitem o progresso de ferramenta na edição da prévia ao vivo.
- **Mattermost** já incorpora a atividade de ferramenta em seu único post de prévia em rascunho (veja acima).
- Edições de progresso de ferramenta seguem o modo ativo de streaming de prévia; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming em bloco assumiu a mensagem.

## Relacionado

- [Mensagens](/pt-BR/concepts/messages) — ciclo de vida e entrega de mensagens
- [Retry](/pt-BR/concepts/retry) — comportamento de retry em falha de entrega
- [Canais](/pt-BR/channels) — suporte de streaming por canal
