---
read_when:
    - Explicando como streaming ou fragmentação funciona em canais
    - Alteração do comportamento de streaming de blocos ou de fragmentação de canais
    - Depuração de respostas duplicadas/antecipadas em bloco ou streaming de prévia de canal
summary: Comportamento de streaming + fragmentação (respostas em bloco, streaming de pré-visualização de canal, mapeamento de modo)
title: Streaming e fragmentação
x-i18n:
    generated_at: "2026-07-01T05:33:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming separadas:

- **Streaming em blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Essas são mensagens normais de canal (não deltas de tokens).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Hoje **não há streaming real de deltas de tokens** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/acréscimos).

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

- `text_delta/events`: eventos de stream do modelo (podem ser esparsos para modelos sem streaming).
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimos/máximos + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em blocos).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desativado por padrão).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de divisão do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho).
- Limite suave do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: transmite blocos assim que o chunker emite; descarrega em cada `text_end`.
- `message_end`: espera até a mensagem do assistente terminar e então descarrega a saída armazenada.

`message_end` ainda usa o chunker se o texto armazenado exceder `maxChars`, então pode emitir vários blocos no final.

### Entrega de mídia com streaming em blocos

Mídia em streaming deve usar campos estruturados de payload, como `mediaUrl` ou
`mediaUrls`; texto transmitido não é interpretado como comando de anexo. Quando o
streaming em blocos envia mídia antecipadamente, o OpenClaw lembra essa entrega
no turno. Se o payload final do assistente repetir a mesma URL de mídia, a entrega
final remove a mídia duplicada em vez de enviar o anexo novamente.

Payloads finais exatamente duplicados são suprimidos. Se o payload final adicionar
texto distinto ao redor da mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto mantendo a mídia em entrega única. Isso evita notas de voz ou arquivos
duplicados em canais como Telegram.

## Algoritmo de divisão (limites baixo/alto)

A divisão em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até o buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha + reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming em blocos está ativado, o OpenClaw pode **mesclar partes de blocos consecutivas**
antes de enviá-las. Isso reduz "spam de linha única" enquanto ainda fornece
saída progressiva.

- A coalescência aguarda **intervalos de inatividade** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se excederem esse limite.
- `minChars` impede que fragmentos muito pequenos sejam enviados até que texto suficiente se acumule
  (a descarga final sempre envia o texto restante).
- O juntador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições por canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência é aumentado para 1500 para Signal/Slack/Discord, a menos que seja sobrescrito.

## Ritmo semelhante ao humano entre blocos

Quando o streaming em blocos está ativado, você pode adicionar uma **pausa aleatória** entre
respostas em blocos (após o primeiro bloco). Isso faz respostas com várias bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (sobrescreva por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em blocos**, não a respostas finais ou resumos de ferramentas.

## "Transmitir blocos ou tudo"

Isso corresponde a:

- **Transmitir blocos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não sejam Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários blocos se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação sobre canais:** O streaming em blocos fica **desativado a menos que**
`*.blockStreaming` seja definido explicitamente como `true`. Canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em blocos.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desativa o streaming de prévia.
- `partial`: prévia única que é substituída pelo texto mais recente.
- `block`: prévia atualizada em etapas divididas/anexadas.
- `progress`: prévia de progresso/status durante a geração, resposta final na conclusão.

`streaming.mode: "block"` é um modo de streaming de prévia para canais com capacidade
de edição, como Discord e Telegram. Ele não habilita a entrega de blocos no canal ali.
Use `streaming.block.enabled` ou a chave de canal legada `blockStreaming` quando
quiser respostas normais em blocos. Microsoft Teams é a exceção: ele não tem
transporte de bloco de prévia em rascunho, então `streaming.mode: "block"` mapeia para entrega
em blocos do Teams em vez de streaming parcial/de progresso nativo.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Discord    | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | stream de progresso nativo  |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente do Slack exigem um destino de thread de resposta. DMs de nível superior não mostram essa prévia em estilo de thread, mas ainda podem usar posts de prévia em rascunho e edições do Slack.

Migração de chaves legadas:

- Telegram: valores legados `streamMode` e valores escalares/booleanos de `streaming` são detectados e migrados pelos caminhos de compatibilidade de doctor/config para `streaming.mode`.
- Discord: `streamMode` + booleano `streaming` continuam como aliases de runtime para o enum `streaming`; execute `openclaw doctor --fix` para reescrever a configuração persistida.
- Slack: `streamMode` continua como alias de runtime para `streaming.mode`; booleano `streaming` continua como alias de runtime para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado continua como alias de runtime para `streaming.nativeTransport`. Execute `openclaw doctor --fix` para reescrever a configuração persistida.

### Comportamento em runtime

Telegram:

- Usa atualizações de prévia `sendMessage` + `editMessageText` em DMs e grupos/tópicos.
- Prévias iniciais curtas ainda recebem debounce para melhorar a UX de notificações push, mas o Telegram agora as materializa após um atraso limitado para que execuções ativas não fiquem visualmente silenciosas.
- O texto final edita a prévia ativa no lugar; finais longos reutilizam essa mensagem para o primeiro bloco e enviam apenas os blocos restantes.
- O modo `block` rotaciona a prévia para uma nova mensagem em `streaming.preview.chunk.maxChars` (padrão 800, limitado ao limite de edição de 4096 do Telegram); outros modos aumentam uma prévia até 4096 caracteres.
- O modo `progress` mantém o progresso de ferramentas em um rascunho de status editável, materializa o rótulo de status quando o streaming da resposta está ativo mas nenhuma linha de ferramenta está disponível ainda, limpa esse rascunho na conclusão e envia a resposta final pela entrega normal.
- Se a edição final falhar antes que o texto concluído seja confirmado, o OpenClaw usa a entrega final normal e limpa a prévia obsoleta.
- O streaming de prévia é ignorado quando o streaming em blocos do Telegram está explicitamente ativado (para evitar streaming duplo).
- `/reasoning stream` pode escrever o raciocínio em uma prévia transitória que é excluída após a entrega final.

Discord:

- Usa envio + edição de mensagens de prévia.
- O modo `block` usa divisão de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming em blocos do Discord está explicitamente ativado.
- Payloads finais de mídia, erro e resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho, depois usam a entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho em estilo de acréscimo.
- `progress` usa texto de prévia de status e depois a resposta final.
- DMs de nível superior sem uma thread de resposta usam posts de prévia em rascunho e edições em vez de streaming nativo do Slack.
- Streaming de prévia nativo e em rascunho suprime respostas em blocos para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Payloads finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a prévia descarregam texto de rascunho pendente.

Mattermost:

- Transmite raciocínio, atividade de ferramentas e texto parcial de resposta para um único post de prévia em rascunho que é finalizado no lugar quando a resposta final é segura para enviar.
- Recorre ao envio de um novo post final se o post de prévia foi excluído ou está indisponível no momento da finalização.
- Payloads finais de mídia/erro cancelam atualizações de prévia pendentes antes da entrega normal em vez de descarregar um post de prévia temporário.

Matrix:

- Prévias em rascunho são finalizadas no lugar quando o texto final pode reutilizar o evento de prévia.
- Finais somente de mídia, de erro e com incompatibilidade de destino de resposta cancelam atualizações de prévia pendentes antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramentas

O streaming de prévia também pode incluir atualizações de **progresso de ferramentas** - linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" - que aparecem na mesma mensagem de prévia enquanto as ferramentas estão em execução, antes da resposta final. No modo app-server do Codex, mensagens de preâmbulo/comentário do Codex usam esse mesmo caminho de prévia, então notas curtas de progresso como "Estou verificando..." podem ser transmitidas para o rascunho editável sem se tornarem parte da resposta final. Isso mantém turnos de ferramentas em várias etapas visualmente ativos, em vez de silenciosos entre a primeira prévia de raciocínio e a resposta final.

Ferramentas de longa duração podem emitir progresso tipado antes de retornarem. Por exemplo,
`web_fetch` arma um temporizador de cinco segundos ao iniciar: se a busca ainda estiver
pendente, a prévia pode mostrar `Fetching page content...`; se a busca terminar
ou for cancelada antes disso, nenhuma linha de progresso é emitida. O resultado final posterior da ferramenta
ainda é entregue normalmente ao modelo.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem o progresso de ferramentas e atualizações de preâmbulo do Codex para a edição de prévia ao vivo por padrão quando o streaming de prévia está ativo. Microsoft Teams usa seu stream de progresso nativo em conversas pessoais.
- Telegram é distribuído com atualizações de prévia de progresso de ferramentas habilitadas desde `v2026.4.22`; mantê-las habilitadas preserva esse comportamento lançado.
- **Mattermost** já incorpora a atividade de ferramentas em sua única publicação de prévia de rascunho (veja acima).
- Edições de progresso de ferramentas seguem o modo de streaming de prévia ativo; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming em blocos assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: conversas genéricas de progresso também são suprimidas em vez de serem entregues como mensagens de status avulsas, enquanto solicitações de aprovação, payloads de mídia e erros ainda são roteados normalmente.
- Para manter o streaming de prévia, mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para manter linhas de progresso de ferramentas visíveis enquanto oculta texto de comando/execução, defina `streaming.preview.commandText` como `"status"` ou `streaming.progress.commandText` como `"status"`; o padrão é `"raw"` para preservar o comportamento lançado. Essa política é compartilhada por canais de rascunho/progresso que usam o renderizador compacto de progresso do OpenClaw, incluindo Discord, Matrix, Microsoft Teams, Mattermost, prévias de rascunho do Slack e Telegram. Para desabilitar completamente as edições de prévia, defina `streaming.mode` como `off`.
- Respostas a citações selecionadas do Telegram são uma exceção: quando `replyToMode` não é `"off"` e há texto de citação selecionado, o OpenClaw ignora o stream de prévia da resposta para esse turno, de modo que as linhas de prévia de progresso de ferramentas não possam ser renderizadas. Respostas à mensagem atual sem texto de citação selecionado ainda mantêm o streaming de prévia. Consulte a [documentação do canal Telegram](/pt-BR/channels/telegram) para detalhes.

### Faixa de progresso de comentário

Além do progresso de ferramentas, o renderizador compacto de progresso pode exibir mais uma faixa no rascunho:

- **`streaming.progress.commentary`** — renderiza o **comentário** pré-ferramenta do modelo (💬) — narração curta do tipo "Vou verificar… então…" — intercalado com linhas de ferramentas no rascunho de progresso.

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

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

Use a mesma forma sob outra chave de canal de progresso compacto, por exemplo `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost` ou prévias de rascunho do Slack. Para o modo de rascunho de progresso, coloque a mesma política sob `streaming.progress`:

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

- [Refatoração do ciclo de vida de mensagens](/pt-BR/concepts/message-lifecycle-refactor) - design compartilhado alvo de prévia, edição, stream e finalização
- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) - mensagens visíveis de trabalho em andamento que são atualizadas durante turnos longos
- [Mensagens](/pt-BR/concepts/messages) - ciclo de vida e entrega de mensagens
- [Nova tentativa](/pt-BR/concepts/retry) - comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) - suporte a streaming por canal
