---
read_when:
    - Explicando como a transmissão contínua ou a divisão em partes funcionam nos canais
    - Alterando o comportamento de streaming de blocos ou de fragmentação de canais
    - Depuração de respostas de bloco duplicadas/antecipadas ou do streaming de prévia do canal
summary: Comportamento de transmissão + fragmentação (respostas em bloco, transmissão da prévia do canal, mapeamento de modos)
title: Transmissão em fluxo e fragmentação
x-i18n:
    generated_at: "2026-05-04T07:03:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff7b6cd8127255352fe16fb746469e9828e7d5aea183d3799ab10cc768515bd1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming separadas:

- **Streaming de blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Essas são mensagens normais de canal (não deltas de tokens).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Atualmente, **não há streaming real de delta de tokens** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/acréscimos).

## Streaming de blocos (mensagens de canal)

O streaming de blocos envia a saída do assistente em partes maiores à medida que ela fica disponível.

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

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimos/máximos + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desativado por padrão).
- Sobrescritas de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de divisão do canal: `*.chunkMode` (`length` é o padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: transmite blocos assim que o divisor emite; descarrega em cada `text_end`.
- `message_end`: aguarda até que a mensagem do assistente termine e então descarrega a saída em buffer.

`message_end` ainda usa o divisor se o texto em buffer exceder `maxChars`, então ele pode emitir várias partes ao final.

### Entrega de mídia com streaming de blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming de blocos envia um bloco de mídia antecipadamente, o OpenClaw lembra dessa entrega para o turno. Se a carga final do assistente repetir a mesma URL de mídia, a entrega final remove a mídia duplicada em vez de enviar o anexo novamente.

Cargas finais exatamente duplicadas são suprimidas. Se a carga final adicionar texto distinto ao redor de mídia que já foi transmitida, o OpenClaw ainda envia o novo texto mantendo a mídia com entrega única. Isso evita notas de voz ou arquivos duplicados em canais como Telegram quando um agente emite `MEDIA:` durante o streaming e o provedor também o inclui na resposta concluída.

## Algoritmo de divisão (limites baixo/alto)

A divisão em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até que o buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Blocos de código:** nunca divide dentro de blocos; quando forçado em `maxChars`, fecha + reabre o bloco para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não consegue exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming de blocos está ativado, o OpenClaw pode **mesclar partes de blocos consecutivas** antes de enviá-las. Isso reduz “spam de uma linha” enquanto ainda fornece saída progressiva.

- A coalescência aguarda **intervalos ociosos** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se o excederem.
- `minChars` impede o envio de fragmentos pequenos até que texto suficiente se acumule (o descarregamento final sempre envia o texto restante).
- O conector é derivado de `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Sobrescritas de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão da coalescência é aumentado para 1500 para Signal/Slack/Discord, a menos que seja sobrescrito.

## Ritmo semelhante ao humano entre blocos

Quando o streaming de blocos está ativado, você pode adicionar uma **pausa aleatória** entre respostas em bloco (após o primeiro bloco). Isso faz respostas em múltiplos balões parecerem mais naturais.

- Configuração: `agents.defaults.humanDelay` (sobrescreva por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais ou resumos de ferramentas.

## "Transmitir partes ou tudo"

Isso corresponde a:

- **Transmitir partes:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não sejam Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo ao final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em várias partes se for muito longo).
- **Sem streaming de blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação de canal:** O streaming de blocos fica **desativado a menos que**
`*.blockStreaming` esteja explicitamente definido como `true`. Canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desativa o streaming de prévia.
- `partial`: prévia única que é substituída pelo texto mais recente.
- `block`: atualizações de prévia em etapas divididas/acrescentadas.
- `progress`: prévia de progresso/status durante a geração, resposta final ao concluir.

`streaming.mode: "block"` é um modo de streaming de prévia para canais com suporte a edição, como Discord e Telegram. Ele não habilita a entrega de blocos do canal nesses casos. Use `streaming.block.enabled` ou a chave de canal legada `blockStreaming` quando quiser respostas normais em bloco. Microsoft Teams é a exceção: ele não tem transporte de blocos de prévia de rascunho, então `streaming.mode: "block"` mapeia para a entrega de blocos do Teams em vez de streaming parcial/progresso nativo.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Discord    | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream de progresso nativo  |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas à API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente do Slack exigem um destino de thread de resposta. DMs de nível superior não mostram essa prévia no estilo thread, mas ainda podem usar publicações e edições de prévia de rascunho do Slack.

Migração de chave legada:

- Telegram: valores legados de `streamMode` e valores escalares/booleanos de `streaming` são detectados e migrados pelos caminhos de compatibilidade de doctor/config para `streaming.mode`.
- Discord: `streamMode` + booleano `streaming` migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; booleano `streaming` migra automaticamente para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado migra automaticamente para `streaming.nativeTransport`.

### Comportamento em runtime

Telegram:

- Usa `sendMessage` + atualizações de prévia com `editMessageText` em DMs e grupos/tópicos.
- Envia uma nova mensagem final em vez de editar no local quando uma prévia ficou visível por cerca de um minuto, então limpa a prévia para que o timestamp do Telegram reflita a conclusão da resposta.
- O streaming de prévia é ignorado quando o streaming de blocos do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode escrever o raciocínio em uma prévia transitória que é excluída após a entrega final.

Discord:

- Usa mensagens de prévia com envio + edição.
- O modo `block` usa divisão de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming de blocos do Discord está explicitamente habilitado.
- Mídia final, erro e cargas de resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho, então usam a entrega normal.

Slack:

- `partial` pode usar o streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho no estilo acréscimo.
- `progress` usa texto de prévia de status, então a resposta final.
- DMs de nível superior sem uma thread de resposta usam publicações e edições de prévia de rascunho em vez do streaming nativo do Slack.
- O streaming de prévia nativo e de rascunho suprime respostas em bloco para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Cargas finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a prévia descarregam o texto de rascunho pendente.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto parcial de resposta em uma única publicação de prévia de rascunho que é finalizada no local quando a resposta final pode ser enviada com segurança.
- Recorre ao envio de uma nova publicação final se a publicação de prévia tiver sido excluída ou estiver indisponível no momento da finalização.
- Cargas finais de mídia/erro cancelam atualizações de prévia pendentes antes da entrega normal em vez de descarregar uma publicação de prévia temporária.

Matrix:

- Prévias de rascunho são finalizadas no local quando o texto final pode reutilizar o evento de prévia.
- Finais somente com mídia, erro e incompatibilidade de destino de resposta cancelam atualizações de prévia pendentes antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramentas

O streaming de prévia também pode incluir atualizações de **progresso de ferramentas** — linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" — que aparecem na mesma mensagem de prévia enquanto as ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas com várias etapas visualmente ativos em vez de silenciosos entre a primeira prévia de pensamento e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem progresso de ferramentas na edição da prévia ao vivo por padrão quando o streaming de prévia está ativo. Microsoft Teams usa seu stream de progresso nativo em conversas pessoais.
- Telegram foi lançado com atualizações de prévia de progresso de ferramentas habilitadas desde `v2026.4.22`; mantê-las habilitadas preserva esse comportamento lançado.
- **Mattermost** já incorpora a atividade de ferramentas em sua única publicação de prévia de rascunho (veja acima).
- Edições de progresso de ferramentas seguem o modo de streaming de prévia ativo; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming de blocos assumiu a mensagem. No Telegram, `streaming.mode: "off"` é apenas final: conversa genérica de progresso também é suprimida em vez de ser entregue como mensagens de status independentes, enquanto prompts de aprovação, cargas de mídia e erros ainda são roteados normalmente.
- Para manter o streaming de prévia, mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para manter linhas de progresso de ferramentas visíveis enquanto oculta texto de comando/execução, defina `streaming.preview.commandText` como `"status"` ou `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para preservar o comportamento lançado. Essa política é compartilhada por canais de rascunho/progresso que usam o renderizador de progresso compacto do OpenClaw, incluindo Discord, Matrix, Microsoft Teams, Mattermost, prévias de rascunho do Slack e Telegram. Para desativar edições de prévia completamente, defina `streaming.mode` como `off`.
- Respostas a citações selecionadas no Telegram são uma exceção: quando `replyToMode` não é `"off"` e texto de citação selecionado está presente, o OpenClaw ignora o stream de prévia da resposta para esse turno, então linhas de prévia de progresso de ferramentas não podem ser renderizadas. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de prévia. Consulte a [documentação do canal Telegram](/pt-BR/channels/telegram) para detalhes.

Mantenha as linhas de progresso visíveis, mas oculte o texto bruto de comando/execução:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

Use a mesma forma sob outra chave compacta de canal de progresso, por exemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou pré-visualizações de rascunhos do Slack. Para o modo de rascunho de progresso, coloque a mesma política sob `streaming.progress`:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## Relacionado

- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) — mensagens visíveis de trabalho em andamento que são atualizadas durante turnos longos
- [Mensagens](/pt-BR/concepts/messages) — ciclo de vida e entrega de mensagens
- [Nova tentativa](/pt-BR/concepts/retry) — comportamento de nova tentativa em caso de falha na entrega
- [Canais](/pt-BR/channels) — suporte a streaming por canal
