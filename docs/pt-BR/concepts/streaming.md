---
read_when:
    - Explicando como a transmissão contínua ou a divisão em partes funcionam nos canais
    - Alteração do comportamento de streaming de blocos ou de fragmentação de canais
    - Depuração de respostas de bloco duplicadas/antecipadas ou streaming de prévia do canal
summary: Comportamento de streaming + divisão em partes (respostas em bloco, streaming de prévia do canal, mapeamento de modos)
title: Transmissão em fluxo e fragmentação
x-i18n:
    generated_at: "2026-04-30T09:46:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d428355e1a0dbd426c4807add2b15fcfb09776849681bfeb2293173a2d31ee4f
    source_path: concepts/streaming.md
    workflow: 16
---

O OpenClaw tem duas camadas de streaming separadas:

- **Streaming de blocos (canais):** emite **blocos** concluídos conforme o assistente escreve. Estas são mensagens normais de canal (não deltas de tokens).
- **Streaming de pré-visualização (Telegram/Discord/Slack):** atualiza uma **mensagem de pré-visualização** temporária durante a geração.

Hoje **não há streaming real de deltas de tokens** para mensagens de canal. O streaming de pré-visualização é baseado em mensagens (envio + edições/anexos).

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

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (desativado por padrão).
- Substituições de canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de divisão do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: transmite blocos assim que o chunker emite; descarrega a cada `text_end`.
- `message_end`: aguarda a mensagem do assistente terminar e então descarrega a saída armazenada.

`message_end` ainda usa o chunker se o texto armazenado exceder `maxChars`, então pode emitir vários chunks no final.

### Entrega de mídia com streaming de blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming de blocos envia um bloco de mídia antecipadamente, o OpenClaw lembra dessa entrega para o turno. Se a carga final do assistente repetir a mesma URL de mídia, a entrega final remove a mídia duplicada em vez de enviar o anexo novamente.

Cargas finais exatamente duplicadas são suprimidas. Se a carga final adicionar texto distinto ao redor de uma mídia que já foi transmitida, o OpenClaw ainda envia o novo texto mantendo a mídia com entrega única. Isso evita notas de voz ou arquivos duplicados em canais como Telegram quando um agente emite `MEDIA:` durante o streaming e o provedor também a inclui na resposta concluída.

## Algoritmo de divisão (limites baixo/alto)

A divisão em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até buffer >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Blocos de código:** nunca divide dentro de fences; quando forçado em `maxChars`, fecha + reabre a fence para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming de blocos está ativado, o OpenClaw pode **mesclar chunks de blocos consecutivos** antes de enviá-los. Isso reduz “spam de linhas únicas” enquanto ainda fornece saída progressiva.

- A coalescência aguarda **intervalos ociosos** (`idleMs`) antes de descarregar.
- Os buffers são limitados por `maxChars` e serão descarregados se excederem esse valor.
- `minChars` impede o envio de fragmentos muito pequenos até que texto suficiente se acumule (a descarga final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference` (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições de canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência é elevado para 1500 para Signal/Slack/Discord, a menos que seja substituído.

## Ritmo semelhante ao humano entre blocos

Quando o streaming de blocos está ativado, você pode adicionar uma **pausa aleatória** entre respostas em bloco (após o primeiro bloco). Isso faz respostas com várias bolhas parecerem mais naturais.

- Configuração: `agents.defaults.humanDelay` (substitua por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais ou resumos de ferramentas.

## "Transmitir chunks ou tudo"

Isso corresponde a:

- **Transmitir chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não são Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários chunks se for muito longo).
- **Sem streaming de blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação de canal:** O streaming de blocos fica **desativado a menos que**
`*.blockStreaming` esteja definido explicitamente como `true`. Canais podem transmitir uma pré-visualização ao vivo (`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete de localização da configuração: os padrões `blockStreaming*` ficam em `agents.defaults`, não na configuração raiz.

## Modos de streaming de pré-visualização

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desativa o streaming de pré-visualização.
- `partial`: pré-visualização única que é substituída pelo texto mais recente.
- `block`: pré-visualização atualizada em etapas divididas/anexadas.
- `progress`: pré-visualização de progresso/status durante a geração, resposta final ao concluir.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | mapeia para `partial`   |
| Discord    | ✅    | ✅        | ✅      | mapeia para `partial`   |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente do Slack exigem um destino de thread de resposta; DMs de nível superior não exibem essa pré-visualização em estilo de thread.

Migração de chaves legadas:

- Telegram: valores legados `streamMode` e escalares/booleanos de `streaming` são detectados e migrados pelos caminhos de compatibilidade doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; `streaming` booleano migra automaticamente para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado migra automaticamente para `streaming.nativeTransport`.

### Comportamento em runtime

Telegram:

- Usa `sendMessage` + `editMessageText` para atualizações de pré-visualização em DMs e grupos/tópicos.
- Envia uma nova mensagem final em vez de editar no lugar quando uma pré-visualização ficou visível por cerca de um minuto, depois limpa a pré-visualização para que o carimbo de data/hora do Telegram reflita a conclusão da resposta.
- O streaming de pré-visualização é ignorado quando o streaming de blocos do Telegram está explicitamente ativado (para evitar streaming duplo).
- `/reasoning stream` pode gravar raciocínio na pré-visualização.

Discord:

- Usa envio + edição de mensagens de pré-visualização.
- O modo `block` usa divisão de rascunho (`draftChunk`).
- O streaming de pré-visualização é ignorado quando o streaming de blocos do Discord está explicitamente ativado.
- Cargas finais de mídia, erro e resposta explícita cancelam pré-visualizações pendentes sem descarregar um novo rascunho, depois usam a entrega normal.

Slack:

- `partial` pode usar o streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa pré-visualizações de rascunho em estilo de anexo.
- `progress` usa texto de pré-visualização de status, depois a resposta final.
- O streaming de pré-visualização nativo e de rascunho suprime respostas em bloco para esse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Cargas finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a pré-visualização descarregam texto de rascunho pendente.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto parcial de resposta em uma única publicação de pré-visualização de rascunho que é finalizada no lugar quando a resposta final é segura para enviar.
- Recai para o envio de uma nova publicação final se a publicação de pré-visualização foi excluída ou está indisponível no momento da finalização.
- Cargas finais de mídia/erro cancelam atualizações de pré-visualização pendentes antes da entrega normal em vez de descarregar uma publicação de pré-visualização temporária.

Matrix:

- Pré-visualizações de rascunho são finalizadas no lugar quando o texto final pode reutilizar o evento de pré-visualização.
- Finais somente de mídia, erro e com incompatibilidade de destino de resposta cancelam atualizações de pré-visualização pendentes antes da entrega normal; uma pré-visualização obsoleta já visível é removida.

### Atualizações de pré-visualização de progresso de ferramentas

O streaming de pré-visualização também pode incluir atualizações de **progresso de ferramentas** — linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" — que aparecem na mesma mensagem de pré-visualização enquanto ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas com várias etapas visualmente ativos em vez de silenciosos entre a primeira pré-visualização de pensamento e a resposta final.

Superfícies com suporte:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem progresso de ferramentas para a edição de pré-visualização ao vivo por padrão quando o streaming de pré-visualização está ativo.
- O Telegram é distribuído com atualizações de pré-visualização de progresso de ferramentas ativadas desde `v2026.4.22`; mantê-las ativadas preserva esse comportamento lançado.
- **Mattermost** já incorpora atividade de ferramentas em sua única publicação de pré-visualização de rascunho (veja acima).
- As edições de progresso de ferramentas seguem o modo de streaming de pré-visualização ativo; elas são ignoradas quando o streaming de pré-visualização está `off` ou quando o streaming de blocos assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: conversa genérica de progresso também é suprimida em vez de ser entregue como mensagens "Trabalhando..." independentes, enquanto solicitações de aprovação, cargas de mídia e erros ainda seguem a rota normal.
- Para manter o streaming de pré-visualização, mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para desativar edições de pré-visualização por completo, defina `streaming.mode` como `off`.

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

- [Mensagens](/pt-BR/concepts/messages) — ciclo de vida e entrega de mensagens
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) — suporte a streaming por canal
