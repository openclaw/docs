---
read_when:
    - Explicando como streaming ou divisão em chunks funciona nos canais
    - Alteração do comportamento de streaming de blocos ou fragmentação de canal
    - Depuração de respostas de bloco duplicadas/antecipadas ou streaming de pré-visualização de canal
summary: Comportamento de streaming + fragmentação (respostas em bloco, streaming de pré-visualização de canal, mapeamento de modo)
title: Streaming e fragmentação
x-i18n:
    generated_at: "2026-06-27T17:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6667e95a1ed89e6bd8990a1b8784edb73885c59c7a3905eabc14184270efcfe1
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de transmissão separadas:

- **Transmissão de blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Essas são mensagens normais de canal (não deltas de tokens).
- **Transmissão de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Atualmente, **não há transmissão real de deltas de tokens** para mensagens de canal. A transmissão de prévia é baseada em mensagens (envio + edições/anexos).

## Transmissão de blocos (mensagens de canal)

A transmissão de blocos envia a saída do assistente em partes maiores conforme ela fica disponível.

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

- `text_delta/events`: eventos de transmissão do modelo (podem ser esparsos para modelos sem transmissão).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mín./máx. + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão desligado).
- Sobrescritas de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de divisão do canal: `*.chunkMode` (`length` padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar cortes na UI.

**Semântica de limites:**

- `text_end`: transmite blocos assim que o chunker emite; descarrega em cada `text_end`.
- `message_end`: aguarda até a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, portanto pode emitir vários chunks ao final.

### Entrega de mídia com transmissão de blocos

A mídia transmitida deve usar campos de payload estruturados, como `mediaUrl` ou
`mediaUrls`; o texto transmitido não é analisado como um comando de anexo. Quando a transmissão de blocos
envia mídia antecipadamente, o OpenClaw lembra essa entrega para o turno. Se
o payload final do assistente repetir a mesma URL de mídia, a entrega final
remove a mídia duplicada em vez de enviar o anexo novamente.

Payloads finais exatamente duplicados são suprimidos. Se o payload final adiciona
texto distinto em torno de mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto mantendo a mídia com entrega única. Isso evita notas de voz ou
arquivos duplicados em canais como Telegram.

## Algoritmo de divisão (limites baixo/alto)

A divisão em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Blocos de código:** nunca divide dentro de blocos; quando forçado em `maxChars`, fecha + reabre o bloco para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando a transmissão de blocos está ativada, o OpenClaw pode **mesclar chunks de bloco consecutivos**
antes de enviá-los. Isso reduz "spam de linha única" enquanto ainda fornece
saída progressiva.

- A coalescência aguarda **intervalos de inatividade** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se excederem esse valor.
- `minChars` impede que fragmentos minúsculos sejam enviados até que texto suficiente se acumule
  (o descarregamento final sempre envia o texto restante).
- O juntador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Sobrescritas de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão da coalescência é elevado para 1500 para Signal/Slack/Discord, a menos que seja sobrescrito.

## Ritmo semelhante ao humano entre blocos

Quando a transmissão de blocos está ativada, você pode adicionar uma **pausa aleatória** entre
respostas em bloco (após o primeiro bloco). Isso faz respostas em várias bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (sobrescreva por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais ou resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso corresponde a:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não são Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo ao final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários chunks se for muito longo).
- **Sem transmissão de blocos:** `blockStreamingDefault: "off"` (somente resposta final).

**Observação de canal:** A transmissão de blocos fica **desligada a menos que**
`*.blockStreaming` seja definido explicitamente como `true`. Canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de transmissão de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desativa a transmissão de prévia.
- `partial`: prévia única que é substituída pelo texto mais recente.
- `block`: prévia atualizada em etapas divididas/anexadas.
- `progress`: prévia de progresso/status durante a geração, resposta final na conclusão.

`streaming.mode: "block"` é um modo de transmissão de prévia para canais com suporte a edição,
como Discord e Telegram. Ele não ativa a entrega de blocos do canal nesses casos.
Use `streaming.block.enabled` ou a chave legada de canal `blockStreaming` quando
quiser respostas normais em bloco. Microsoft Teams é a exceção: ele não tem
transporte de blocos de prévia de rascunho, então `streaming.mode: "block"` mapeia para entrega de blocos do Teams
em vez de transmissão parcial/de progresso nativa.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Discord    | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | transmissão de progresso nativa |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API de transmissão nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- A transmissão nativa do Slack e o status de thread do assistente do Slack exigem um destino de thread de resposta. DMs de nível superior não mostram essa prévia em estilo de thread, mas ainda podem usar publicações e edições de prévia de rascunho do Slack.

Migração de chaves legadas:

- Telegram: valores legados `streamMode` e valores escalares/booleanos de `streaming` são detectados e migrados pelos caminhos de compatibilidade de doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano permanecem aliases de runtime para o enum `streaming`; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- Slack: `streamMode` permanece um alias de runtime para `streaming.mode`; `streaming` booleano permanece um alias de runtime para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado permanece um alias de runtime para `streaming.nativeTransport`. Execute `openclaw doctor --fix` para reescrever a configuração persistida.

### Comportamento em runtime

Telegram:

- Usa `sendMessage` + `editMessageText` para atualizações de prévia em DMs e grupos/tópicos.
- Prévias iniciais curtas ainda usam debounce para a UX de notificações push, mas o Telegram agora as materializa após um atraso limitado para que execuções ativas não permaneçam visualmente silenciosas.
- O texto final edita a prévia ativa no lugar; finais longos reutilizam essa mensagem para o primeiro chunk e enviam apenas os chunks restantes.
- O modo `block` rotaciona a prévia para uma nova mensagem em `streaming.preview.chunk.maxChars` (padrão 800, limitado ao limite de edição de 4096 do Telegram); outros modos expandem uma prévia até 4096 caracteres.
- O modo `progress` mantém o progresso da ferramenta em um rascunho de status editável, materializa o rótulo de status quando a transmissão da resposta está ativa mas nenhuma linha de ferramenta ainda está disponível, limpa esse rascunho na conclusão e envia a resposta final pela entrega normal.
- Se a edição final falhar antes de o texto concluído ser confirmado, o OpenClaw usa a entrega final normal e limpa a prévia obsoleta.
- A transmissão de prévia é ignorada quando a transmissão de blocos do Telegram está explicitamente ativada (para evitar transmissão dupla).
- `/reasoning stream` pode gravar raciocínio em uma prévia transitória que é excluída após a entrega final.

Discord:

- Usa envio + edição de mensagens de prévia.
- O modo `block` usa divisão de rascunho (`draftChunk`).
- A transmissão de prévia é ignorada quando a transmissão de blocos do Discord está explicitamente ativada.
- Payloads finais de mídia, erro e resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho e então usam a entrega normal.

Slack:

- `partial` pode usar a transmissão nativa do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho em estilo de anexo.
- `progress` usa texto de prévia de status e depois a resposta final.
- DMs de nível superior sem uma thread de resposta usam publicações e edições de prévia de rascunho em vez da transmissão nativa do Slack.
- A transmissão de prévia nativa e de rascunho suprime respostas em bloco para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Payloads finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a prévia descarregam texto de rascunho pendente.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto de resposta parcial para uma única publicação de prévia de rascunho que é finalizada no lugar quando a resposta final é segura para envio.
- Recorre ao envio de uma nova publicação final se a publicação de prévia foi excluída ou está indisponível no momento da finalização.
- Payloads finais de mídia/erro cancelam atualizações de prévia pendentes antes da entrega normal em vez de descarregar uma publicação de prévia temporária.

Matrix:

- Prévias de rascunho são finalizadas no lugar quando o texto final pode reutilizar o evento de prévia.
- Finais somente de mídia, erro e incompatibilidade de destino de resposta cancelam atualizações de prévia pendentes antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramentas

A transmissão de prévia também pode incluir atualizações de **progresso de ferramentas** - linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" - que aparecem na mesma mensagem de prévia enquanto ferramentas estão em execução, antes da resposta final. No modo de servidor de app do Codex, mensagens de preâmbulo/comentário do Codex usam esse mesmo caminho de prévia, então notas curtas de progresso como "Estou verificando..." podem ser transmitidas para o rascunho editável sem se tornarem parte da resposta final. Isso mantém turnos de ferramentas em várias etapas visualmente ativos em vez de silenciosos entre a primeira prévia de pensamento e a resposta final.

Ferramentas de longa duração podem emitir progresso tipado antes de retornarem. Por exemplo,
`web_fetch` arma um temporizador de cinco segundos quando inicia: se a busca ainda estiver
pendente, a prévia pode mostrar `Fetching page content...`; se a busca terminar
ou for cancelada antes disso, nenhuma linha de progresso é emitida. O resultado final posterior da ferramenta
ainda é entregue normalmente ao modelo.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem atualizações de progresso de ferramenta e preâmbulo do Codex para a edição de pré-visualização ao vivo por padrão quando o streaming de pré-visualização está ativo. Microsoft Teams usa seu fluxo de progresso nativo em chats pessoais.
- Telegram é entregue com atualizações de pré-visualização de progresso de ferramenta habilitadas desde `v2026.4.22`; mantê-las habilitadas preserva esse comportamento lançado.
- **Mattermost** já incorpora a atividade de ferramentas em sua única postagem de pré-visualização de rascunho (veja acima).
- As edições de progresso de ferramenta seguem o modo ativo de streaming de pré-visualização; elas são ignoradas quando o streaming de pré-visualização está `off` ou quando o streaming em blocos assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: conversas genéricas de progresso também são suprimidas em vez de serem entregues como mensagens de status independentes, enquanto prompts de aprovação, cargas úteis de mídia e erros continuam sendo roteados normalmente.
- Para manter o streaming de pré-visualização, mas ocultar linhas de progresso de ferramenta, defina `streaming.preview.toolProgress` como `false` para esse canal. Para manter as linhas de progresso de ferramenta visíveis enquanto oculta texto de comando/execução, defina `streaming.preview.commandText` como `"status"` ou `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para preservar o comportamento lançado. Essa política é compartilhada por canais de rascunho/progresso que usam o renderizador compacto de progresso do OpenClaw, incluindo Discord, Matrix, Microsoft Teams, Mattermost, pré-visualizações de rascunho do Slack e Telegram. Para desabilitar totalmente as edições de pré-visualização, defina `streaming.mode` como `off`.
- As respostas a citações selecionadas do Telegram são uma exceção: quando `replyToMode` não é `"off"` e há texto de citação selecionado, o OpenClaw ignora o fluxo de pré-visualização da resposta para essa interação, de modo que linhas de pré-visualização de progresso de ferramenta não possam ser renderizadas. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de pré-visualização. Consulte a [documentação do canal Telegram](/pt-BR/channels/telegram) para obter detalhes.

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

Use o mesmo formato sob outra chave de canal de progresso compacto, por exemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou pré-visualizações de rascunho do Slack. Para o modo de rascunho de progresso, coloque a mesma política em `streaming.progress`:

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

## Relacionados

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design-alvo compartilhado de pré-visualização, edição, streaming e finalização
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) - mensagens visíveis de trabalho em andamento que são atualizadas durante interações longas
- [Mensagens](/pt-BR/concepts/messages) - ciclo de vida e entrega de mensagens
- [Nova tentativa](/pt-BR/concepts/retry) - comportamento de nova tentativa em caso de falha na entrega
- [Canais](/pt-BR/channels) - suporte a streaming por canal
