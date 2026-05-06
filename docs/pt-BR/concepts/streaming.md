---
read_when:
    - Explicando como streaming ou divisão em blocos funcionam nos canais
    - Alteração do comportamento de streaming de blocos ou de fragmentação de canais
    - Depuração de respostas de bloco duplicadas/antecipadas ou streaming de pré-visualização de canal
summary: Comportamento de streaming + fragmentação (respostas em bloco, streaming de pré-visualização de canal, mapeamento de modo)
title: Transmissão contínua e divisão em blocos
x-i18n:
    generated_at: "2026-05-06T17:55:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e43dc87211e764f9721c4e6c0aa69088441344e1f7c34084fd711a780a852a17
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming separadas:

- **Streaming de blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Estas são mensagens normais de canal (não deltas de token).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Hoje, **não há streaming real de deltas de token** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/anexos).

## Streaming de blocos (mensagens de canal)

O streaming de blocos envia a saída do assistente em partes maiores conforme ela fica disponível.

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
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimo/máximo + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão desativado).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentação do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da fragmentação por comprimento).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: transmite blocos assim que o chunker emite; descarrega a cada `text_end`.
- `message_end`: espera até a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, então pode emitir várias partes no final.

### Entrega de mídia com streaming de blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming de blocos envia um bloco de mídia antecipadamente, o OpenClaw lembra dessa entrega para o turno. Se a carga útil final do assistente repetir a mesma URL de mídia, a entrega final remove a mídia duplicada em vez de enviar o anexo novamente.

Cargas úteis finais exatamente duplicadas são suprimidas. Se a carga útil final adicionar texto distinto ao redor da mídia que já foi transmitida, o OpenClaw ainda envia o novo texto mantendo a mídia com entrega única. Isso evita notas de voz ou arquivos duplicados em canais como Telegram quando um agente emite `MEDIA:` durante o streaming e o provedor também o inclui na resposta concluída.

## Algoritmo de fragmentação (limites baixo/alto)

A fragmentação de blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emita até o buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha + reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming de blocos está habilitado, o OpenClaw pode **mesclar partes de blocos consecutivas** antes de enviá-las. Isso reduz o "spam de linhas únicas" e ainda fornece saída progressiva.

- A coalescência espera por **intervalos ociosos** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se excederem esse valor.
- `minChars` impede o envio de fragmentos minúsculos até que texto suficiente se acumule (o descarregamento final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições por canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão da coalescência é aumentado para 1500 para Signal/Slack/Discord, a menos que seja substituído.

## Ritmo semelhante ao humano entre blocos

Quando o streaming de blocos está habilitado, você pode adicionar uma **pausa aleatória** entre respostas em bloco (após o primeiro bloco). Isso faz respostas com várias bolhas parecerem mais naturais.

- Configuração: `agents.defaults.humanDelay` (substitua por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se somente a **respostas em bloco**, não a respostas finais ou resumos de ferramentas.

## "Transmitir partes ou tudo"

Isso mapeia para:

- **Transmitir partes:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emitir conforme avança). Canais que não sejam Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em várias partes se for muito longo).
- **Sem streaming de blocos:** `blockStreamingDefault: "off"` (somente resposta final).

**Observação sobre canais:** o streaming de blocos fica **desativado a menos que**
`*.blockStreaming` seja definido explicitamente como `true`. Canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita o streaming de prévia.
- `partial`: prévia única que é substituída pelo texto mais recente.
- `block`: a prévia é atualizada em etapas fragmentadas/anexadas.
- `progress`: prévia de progresso/status durante a geração, resposta final na conclusão.

`streaming.mode: "block"` é um modo de streaming de prévia para canais com capacidade de edição,
como Discord e Telegram. Ele não habilita a entrega de blocos do canal nesses canais.
Use `streaming.block.enabled` ou a chave legada de canal `blockStreaming` quando
quiser respostas em bloco normais. Microsoft Teams é a exceção: ele não tem
transporte de bloco de prévia de rascunho, então `streaming.mode: "block"` mapeia para entrega de blocos do Teams
em vez de streaming parcial/progresso nativo.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`             |
| ---------- | ----- | --------- | ------- | ---------------------- |
| Telegram   | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Discord    | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Slack      | ✅    | ✅        | ✅      | ✅                     |
| Mattermost | ✅    | ✅        | ✅      | ✅                     |
| MS Teams   | ✅    | ✅        | ✅      | stream de progresso nativo |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente no Slack exigem um destino de thread de resposta. DMs de nível superior não mostram essa prévia em estilo de thread, mas ainda podem usar posts e edições de prévia de rascunho do Slack.

Migração de chaves legadas:

- Telegram: `streamMode` legado e valores escalares/booleanos de `streaming` são detectados e migrados por caminhos de compatibilidade doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano continuam como aliases em runtime para o enum `streaming`; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- Slack: `streamMode` continua como alias em runtime para `streaming.mode`; `streaming` booleano continua como alias em runtime para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado continua como alias em runtime para `streaming.nativeTransport`. Execute `openclaw doctor --fix` para reescrever a configuração persistida.

### Comportamento em runtime

Telegram:

- Usa atualizações de prévia `sendMessage` + `editMessageText` em DMs e grupos/tópicos.
- O texto final edita a prévia ativa no lugar; finais longos reutilizam essa mensagem para a primeira parte e enviam apenas as partes restantes.
- O modo `progress` mantém o progresso de ferramentas em um rascunho de status editável, limpa esse rascunho na conclusão e envia a resposta final por meio da entrega normal.
- Se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa a entrega final normal e limpa a prévia obsoleta.
- O streaming de prévia é ignorado quando o streaming de blocos do Telegram está explicitamente habilitado (para evitar streaming duplicado).
- `/reasoning stream` pode escrever o raciocínio em uma prévia transitória que é excluída após a entrega final.

Discord:

- Usa mensagens de prévia com envio + edição.
- O modo `block` usa fragmentação de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming de blocos do Discord está explicitamente habilitado.
- Mídia final, erro e cargas úteis de resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho e então usam a entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho no estilo de anexar.
- `progress` usa texto de prévia de status e depois a resposta final.
- DMs de nível superior sem uma thread de resposta usam posts e edições de prévia de rascunho em vez do streaming nativo do Slack.
- Streaming de prévia nativo e de rascunho suprime respostas em bloco para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Cargas úteis finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; somente finais de texto/bloco que podem editar a prévia descarregam texto de rascunho pendente.

Mattermost:

- Transmite raciocínio, atividade de ferramentas e texto parcial de resposta para um único post de prévia de rascunho que é finalizado no lugar quando a resposta final está segura para envio.
- Recai para o envio de um novo post final se o post de prévia tiver sido excluído ou estiver indisponível no momento da finalização.
- Cargas úteis finais de mídia/erro cancelam atualizações de prévia pendentes antes da entrega normal em vez de descarregar um post de prévia temporário.

Matrix:

- Prévias de rascunho são finalizadas no lugar quando o texto final pode reutilizar o evento de prévia.
- Finais somente de mídia, erro e com incompatibilidade de destino de resposta cancelam atualizações de prévia pendentes antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramentas

O streaming de prévia também pode incluir atualizações de **progresso de ferramentas**: linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta", que aparecem na mesma mensagem de prévia enquanto ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas em várias etapas visualmente ativos em vez de silenciosos entre a primeira prévia de raciocínio e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem o progresso de ferramentas para a edição da prévia ao vivo por padrão quando o streaming de prévia está ativo. Microsoft Teams usa seu stream de progresso nativo em conversas pessoais.
- Telegram é distribuído com atualizações de prévia de progresso de ferramentas ativadas desde a `v2026.4.22`; mantê-las ativadas preserva esse comportamento lançado.
- **Mattermost** já incorpora a atividade de ferramentas em sua única postagem de prévia de rascunho (veja acima).
- As edições de progresso de ferramentas seguem o modo ativo de streaming de prévia; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming em bloco assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: a conversa genérica de progresso também é suprimida em vez de ser entregue como mensagens de status independentes, enquanto prompts de aprovação, cargas de mídia e erros ainda são roteados normalmente.
- Para manter o streaming de prévia, mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para manter as linhas de progresso de ferramentas visíveis enquanto oculta texto de comando/execução, defina `streaming.preview.commandText` como `"status"` ou `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para preservar o comportamento lançado. Essa política é compartilhada por canais de rascunho/progresso que usam o renderizador compacto de progresso do OpenClaw, incluindo Discord, Matrix, Microsoft Teams, Mattermost, prévias de rascunho do Slack e Telegram. Para desativar completamente as edições de prévia, defina `streaming.mode` como `off`.
- Respostas com citação selecionada no Telegram são uma exceção: quando `replyToMode` não é `"off"` e há texto de citação selecionado, o OpenClaw ignora o stream de prévia da resposta nesse turno, portanto as linhas de prévia de progresso de ferramentas não podem ser renderizadas. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de prévia. Consulte a [documentação do canal Telegram](/pt-BR/channels/telegram) para obter detalhes.

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

Use o mesmo formato sob outra chave de canal com progresso compacto, por exemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou prévias de rascunho do Slack. Para o modo de rascunho de progresso, coloque a mesma política sob `streaming.progress`:

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

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design compartilhado de prévia, edição, stream e finalização
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) - mensagens visíveis de trabalho em andamento que são atualizadas durante turnos longos
- [Mensagens](/pt-BR/concepts/messages) - ciclo de vida e entrega de mensagens
- [Tentativa novamente](/pt-BR/concepts/retry) - comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) - suporte a streaming por canal
