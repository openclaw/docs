---
read_when:
    - Explicando como o streaming ou chunking funciona nos canais
    - Alterando o streaming em blocos ou o comportamento de chunking do canal
    - Depurando respostas em bloco duplicadas/antecipadas ou streaming de prévia de canal
summary: Comportamento de streaming + chunking (respostas em blocos, streaming de prévia de canal, mapeamento de modos)
title: Streaming e chunking
x-i18n:
    generated_at: "2026-04-25T13:45:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

O OpenClaw tem duas camadas separadas de streaming:

- **Streaming em blocos (canais):** emite **blocos** concluídos conforme o assistente escreve. Essas são mensagens normais do canal (não deltas de token).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Hoje **não existe streaming real de deltas de token** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/anexos).

## Streaming em blocos (mensagens de canal)

O streaming em blocos envia a saída do assistente em partes maiores conforme ela fica disponível.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: eventos de streaming do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimo/máximo + preferência de quebra.
- `channel send`: mensagens reais de saída (respostas em blocos).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão: off).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos em streaming antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de chunking do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco — limites de parágrafo — antes da divisão por comprimento).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão: 17) divide respostas altas para evitar corte na UI.

**Semântica de fronteira:**

- `text_end`: transmite blocos assim que o chunker emite; descarrega em cada `text_end`.
- `message_end`: espera a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, então pode emitir vários chunks ao final.

### Entrega de mídia com streaming em blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming em blocos envia um
bloco de mídia antecipadamente, o OpenClaw memoriza essa entrega para o turno. Se a
payload final do assistente repetir a mesma URL de mídia, a entrega final remove a
mídia duplicada em vez de enviar o anexo novamente.

Payloads finais com duplicação exata são suprimidas. Se a payload final adicionar
texto distinto em torno de uma mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto mantendo a mídia em entrega única. Isso evita notas de voz ou arquivos
duplicados em canais como Telegram quando um agente emite `MEDIA:` durante o
streaming e o provedor também a inclui na resposta concluída.

## Algoritmo de chunking (limites baixo/alto)

O chunking em blocos é implementado por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até que o buffer seja >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Blocos de código:** nunca divide dentro de blocos; quando forçado em `maxChars`, fecha + reabre o bloco para manter o Markdown válido.

`maxChars` é limitado a `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos em streaming)

Quando o streaming em blocos está habilitado, o OpenClaw pode **mesclar chunks de bloco consecutivos**
antes de enviá-los. Isso reduz “spam de linha única” ao mesmo tempo que fornece
saída progressiva.

- A coalescência espera por **intervalos de inatividade** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se o excederem.
- `minChars` impede que fragmentos minúsculos sejam enviados até que texto suficiente se acumule
  (o descarregamento final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições por canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência sobe para 1500 em Signal/Slack/Discord, salvo substituição.

## Ritmo humanizado entre blocos

Quando o streaming em blocos está habilitado, você pode adicionar uma **pausa aleatória** entre
respostas em bloco (após o primeiro bloco). Isso faz respostas em múltiplas bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (substitua por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais nem a resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso corresponde a:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais não Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo ao final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários chunks se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (somente resposta final).

**Observação sobre canais:** O streaming em blocos fica **desativado, a menos que**
`*.blockStreaming` seja explicitamente definido como `true`. Canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete sobre local da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na raiz da configuração.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita o streaming de prévia.
- `partial`: uma única prévia que é substituída pelo texto mais recente.
- `block`: atualizações da prévia em etapas fragmentadas/anexadas.
- `progress`: prévia de progresso/status durante a geração, resposta final na conclusão.

### Mapeamento por canal

| Canal      | `off` | `partial` | `block` | `progress`         |
| ---------- | ----- | --------- | ------- | ------------------ |
| Telegram   | ✅    | ✅        | ✅      | mapeia para `partial` |
| Discord    | ✅    | ✅        | ✅      | mapeia para `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                 |
| Mattermost | ✅    | ✅        | ✅      | ✅                 |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API nativa de streaming do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- Streaming nativo do Slack e status de thread do assistente no Slack exigem um alvo de thread de resposta; DMs de nível superior não mostram essa prévia em estilo de thread.

Migração de chave legada:

- Telegram: valores legados `streamMode` e `streaming` escalar/booleano são detectados e migrados pelos caminhos de compatibilidade do doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; `streaming` booleano migra automaticamente para `streaming.mode` + `streaming.nativeTransport`; `nativeStreaming` legado migra automaticamente para `streaming.nativeTransport`.

### Comportamento em runtime

Telegram:

- Usa atualizações de prévia com `sendMessage` + `editMessageText` em DMs e grupos/tópicos.
- O streaming de prévia é ignorado quando o streaming em blocos do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode escrever raciocínio na prévia.

Discord:

- Usa mensagens de prévia com envio + edição.
- O modo `block` usa chunking de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming em blocos do Discord está explicitamente habilitado.
- Payloads finais de mídia, erro e resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho e então usam a entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias em rascunho no estilo append.
- `progress` usa texto de prévia de status e depois a resposta final.
- Streaming de prévia nativo e em rascunho suprimem respostas em bloco para aquele turno, de modo que uma resposta no Slack seja transmitida por apenas um caminho de entrega.
- Payloads finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; somente finais de texto/bloco que podem editar a prévia descarregam o texto pendente do rascunho.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto parcial de resposta em uma única postagem de prévia em rascunho, que é finalizada no mesmo lugar quando a resposta final pode ser enviada com segurança.
- Recorre ao envio de uma nova postagem final se a postagem de prévia tiver sido excluída ou estiver indisponível no momento da finalização.
- Payloads finais de mídia/erro cancelam atualizações de prévia pendentes antes da entrega normal, em vez de descarregar uma postagem de prévia temporária.

Matrix:

- Prévias em rascunho são finalizadas no mesmo lugar quando o texto final pode reutilizar o evento de prévia.
- Finais somente com mídia, erro e incompatibilidade de alvo de resposta cancelam atualizações de prévia pendentes antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramentas

O streaming de prévia também pode incluir atualizações de **progresso de ferramentas** — linhas curtas de status como “pesquisando na web”, “lendo arquivo” ou “chamando ferramenta” — que aparecem na mesma mensagem de prévia enquanto as ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas com várias etapas visualmente ativos em vez de silenciosos entre a primeira prévia de pensamento e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack** e **Telegram** transmitem o progresso de ferramentas para a edição da prévia ao vivo por padrão quando o streaming de prévia está ativo.
- O Telegram já é distribuído com atualizações de prévia de progresso de ferramentas habilitadas desde `v2026.4.22`; mantê-las habilitadas preserva esse comportamento já lançado.
- **Mattermost** já incorpora a atividade de ferramentas em sua única postagem de prévia em rascunho (veja acima).
- Edições de progresso de ferramentas seguem o modo ativo de streaming de prévia; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming em blocos assumiu a mensagem.
- Para manter o streaming de prévia, mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para desabilitar totalmente edições de prévia, defina `streaming.mode` como `off`.

Exemplo:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Relacionado

- [Mensagens](/pt-BR/concepts/messages) — ciclo de vida e entrega de mensagens
- [Retry](/pt-BR/concepts/retry) — comportamento de repetição em falha de entrega
- [Channels](/pt-BR/channels) — suporte a streaming por canal
