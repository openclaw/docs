---
read_when:
    - Explicando como a transmissão contínua ou a divisão em partes funciona nos canais
    - Alterando o comportamento de streaming de blocos ou fragmentação de canal
    - Depuração de respostas de bloco duplicadas/antecipadas ou do streaming de pré-visualização do canal
summary: Comportamento de transmissão contínua + fragmentação (respostas em bloco, transmissão contínua de pré-visualização do canal, mapeamento de modos)
title: Transmissão contínua e fragmentação
x-i18n:
    generated_at: "2026-05-03T21:30:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1335f4f5532060bd8bf839683a2b1fbab38f38887c5583135652b4753e0f6a50
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming separadas:

- **Streaming de blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Essas são mensagens normais de canal (não deltas de tokens).
- **Streaming de pré-visualização (Telegram/Discord/Slack):** atualiza uma **mensagem de pré-visualização** temporária durante a geração.

Atualmente, **não há streaming real de deltas de tokens** para mensagens de canal. O streaming de pré-visualização é baseado em mensagens (envio + edições/anexos).

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
- `channel send`: mensagens de saída reais (respostas em blocos).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desativado por padrão).
- Substituições de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de divisão do canal: `*.chunkMode` (`length` padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar cortes na UI.

**Semântica de limites:**

- `text_end`: transmite blocos assim que o chunker emite; descarrega a cada `text_end`.
- `message_end`: espera a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, portanto pode emitir vários blocos no final.

### Entrega de mídia com streaming de blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming de blocos envia um bloco de mídia antecipadamente, o OpenClaw se lembra dessa entrega no turno. Se a carga final do assistente repetir a mesma URL de mídia, a entrega final remove a mídia duplicada em vez de enviar o anexo novamente.

Cargas finais exatamente duplicadas são suprimidas. Se a carga final adicionar texto distinto ao redor de mídia que já foi transmitida, o OpenClaw ainda envia o novo texto mantendo a mídia com entrega única. Isso evita notas de voz ou arquivos duplicados em canais como Telegram quando um agente emite `MEDIA:` durante o streaming e o provedor também a inclui na resposta concluída.

## Algoritmo de divisão (limites baixo/alto)

A divisão de blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até o buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha + reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming de blocos está ativado, o OpenClaw pode **mesclar blocos consecutivos**
antes de enviá-los. Isso reduz “spam de linha única” enquanto ainda fornece
saída progressiva.

- A coalescência espera **intervalos ociosos** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se excederem esse valor.
- `minChars` impede que fragmentos minúsculos sejam enviados até que texto suficiente se acumule
  (a descarga final sempre envia o texto restante).
- O juntador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência é aumentado para 1500 para Signal/Slack/Discord, a menos que seja substituído.

## Ritmo semelhante ao humano entre blocos

Quando o streaming de blocos está ativado, você pode adicionar uma **pausa aleatória** entre
respostas em blocos (após o primeiro bloco). Isso faz respostas com várias bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (substitua por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em blocos**, não a respostas finais ou resumos de ferramentas.

## "Transmitir partes ou tudo"

Isso corresponde a:

- **Transmitir partes:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não sejam Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários blocos se for muito longo).
- **Sem streaming de blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação sobre canais:** O streaming de blocos fica **desativado a menos que**
`*.blockStreaming` seja definido explicitamente como `true`. Os canais podem transmitir uma pré-visualização ao vivo
(`channels.<channel>.streaming`) sem respostas em blocos.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de pré-visualização

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desativa o streaming de pré-visualização.
- `partial`: pré-visualização única que é substituída pelo texto mais recente.
- `block`: pré-visualização atualizada em etapas divididas/anexadas.
- `progress`: pré-visualização de progresso/status durante a geração, resposta final ao concluir.

`streaming.mode: "block"` é um modo de streaming de pré-visualização para canais com suporte a edição
como Discord e Telegram. Ele não habilita a entrega de blocos de canal ali.
Use `streaming.block.enabled` ou a chave legada de canal `blockStreaming` quando
quiser respostas normais em blocos. Microsoft Teams é a exceção: ele não tem
transporte de bloco de pré-visualização de rascunho, então `streaming.mode: "block"` é mapeado para entrega de blocos do Teams
em vez de streaming parcial/progresso nativo.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram   | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Discord    | ✅    | ✅        | ✅      | rascunho de progresso editável |
| Slack      | ✅    | ✅        | ✅      | ✅                         |
| Mattermost | ✅    | ✅        | ✅      | ✅                         |
| MS Teams   | ✅    | ✅        | ✅      | stream de progresso nativo |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas à API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread de assistente do Slack exigem um destino de thread de resposta. DMs no nível superior não mostram essa pré-visualização em estilo de thread, mas ainda podem usar publicações e edições de pré-visualização de rascunho do Slack.

Migração de chaves legadas:

- Telegram: valores legados `streamMode` e valores escalares/booleanos de `streaming` são detectados e migrados pelos caminhos de compatibilidade de doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; `streaming` booleano migra automaticamente para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado migra automaticamente para `streaming.nativeTransport`.

### Comportamento em tempo de execução

Telegram:

- Usa `sendMessage` + atualizações de pré-visualização `editMessageText` em DMs e grupos/tópicos.
- Envia uma nova mensagem final em vez de editar no mesmo lugar quando uma pré-visualização ficou visível por cerca de um minuto, depois limpa a pré-visualização para que o carimbo de data/hora do Telegram reflita a conclusão da resposta.
- O streaming de pré-visualização é ignorado quando o streaming de blocos do Telegram está explicitamente ativado (para evitar streaming duplo).
- `/reasoning stream` pode escrever o raciocínio na pré-visualização.

Discord:

- Usa envio + edição de mensagens de pré-visualização.
- O modo `block` usa divisão de rascunho (`draftChunk`).
- O streaming de pré-visualização é ignorado quando o streaming de blocos do Discord está explicitamente ativado.
- Mídia final, erro e cargas de resposta explícita cancelam pré-visualizações pendentes sem descarregar um novo rascunho e então usam a entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa pré-visualizações de rascunho em estilo de anexo.
- `progress` usa texto de pré-visualização de status e depois a resposta final.
- DMs no nível superior sem uma thread de resposta usam publicações e edições de pré-visualização de rascunho em vez de streaming nativo do Slack.
- Streaming de pré-visualização nativo e de rascunho suprime respostas em blocos para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Cargas finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a pré-visualização descarregam texto de rascunho pendente.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto parcial de resposta em uma única publicação de pré-visualização de rascunho que finaliza no mesmo lugar quando a resposta final é segura para enviar.
- Recai para o envio de uma nova publicação final se a publicação de pré-visualização foi excluída ou está indisponível no momento da finalização.
- Cargas finais de mídia/erro cancelam atualizações de pré-visualização pendentes antes da entrega normal em vez de descarregar uma publicação temporária de pré-visualização.

Matrix:

- Pré-visualizações de rascunho finalizam no mesmo lugar quando o texto final pode reutilizar o evento de pré-visualização.
- Finais apenas com mídia, erro e incompatibilidade de destino de resposta cancelam atualizações de pré-visualização pendentes antes da entrega normal; uma pré-visualização obsoleta já visível é redigida.

### Atualizações de pré-visualização de progresso de ferramentas

O streaming de pré-visualização também pode incluir atualizações de **progresso de ferramentas** — linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" — que aparecem na mesma mensagem de pré-visualização enquanto as ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramenta em várias etapas visualmente ativos em vez de silenciosos entre a primeira pré-visualização de pensamento e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem progresso de ferramentas para a edição de pré-visualização ao vivo por padrão quando o streaming de pré-visualização está ativo. Microsoft Teams usa seu stream de progresso nativo em conversas pessoais.
- Telegram foi lançado com atualizações de pré-visualização de progresso de ferramentas ativadas desde `v2026.4.22`; mantê-las ativadas preserva esse comportamento lançado.
- **Mattermost** já incorpora atividade de ferramentas em sua única publicação de pré-visualização de rascunho (veja acima).
- Edições de progresso de ferramentas seguem o modo ativo de streaming de pré-visualização; elas são ignoradas quando o streaming de pré-visualização está `off` ou quando o streaming de blocos assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: conversas genéricas de progresso também são suprimidas em vez de serem entregues como mensagens de status independentes, enquanto solicitações de aprovação, cargas de mídia e erros ainda são roteados normalmente.
- Para manter o streaming de pré-visualização mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para desativar totalmente edições de pré-visualização, defina `streaming.mode` como `off`.
- Respostas a citações selecionadas do Telegram são uma exceção: quando `replyToMode` não está `"off"` e há texto de citação selecionada, o OpenClaw ignora o stream de pré-visualização da resposta para esse turno, então linhas de pré-visualização de progresso de ferramentas não podem ser renderizadas. Respostas à mensagem atual sem texto de citação selecionada ainda mantêm o streaming de pré-visualização. Veja [documentação do canal Telegram](/pt-BR/channels/telegram) para detalhes.

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

## Relacionados

- [Rascunhos de progresso](/pt-BR/concepts/progress-drafts) — mensagens visíveis de trabalho em andamento que são atualizadas durante turnos longos
- [Mensagens](/pt-BR/concepts/messages) — ciclo de vida e entrega de mensagens
- [Tentativa](/pt-BR/concepts/retry) — comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) — suporte a streaming por canal
