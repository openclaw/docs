---
read_when:
    - Explicando como o streaming ou a fragmentação funcionam nos canais
    - Alterando o comportamento de streaming em blocos ou de fragmentação de canal
    - Depurando respostas em bloco duplicadas/antecipadas ou streaming de prévia do canal
summary: Comportamento de streaming + fragmentação (respostas em blocos, streaming de prévia do canal, mapeamento de modos)
title: Streaming e fragmentação
x-i18n:
    generated_at: "2026-04-22T04:22:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + fragmentação

O OpenClaw tem duas camadas separadas de streaming:

- **Streaming em blocos (canais):** emite **blocos** concluídos conforme o assistente escreve. Essas são mensagens normais do canal (não deltas de token).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária enquanto gera.

Hoje **não existe streaming verdadeiro de deltas de token** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/acréscimos).

## Streaming em blocos (mensagens de canal)

O streaming em blocos envia a saída do assistente em fragmentos maiores conforme ela fica disponível.

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
- `channel send`: mensagens reais de saída (respostas em bloco).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão desativado).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mescla blocos em streaming antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentação do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da fragmentação por comprimento).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limite:**

- `text_end`: faz streaming dos blocos assim que o chunker os emite; descarrega em cada `text_end`.
- `message_end`: espera até a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o chunker se o texto em buffer exceder `maxChars`, então pode emitir vários fragmentos no final.

## Algoritmo de fragmentação (limites baixo/alto)

A fragmentação em blocos é implementada por `EmbeddedBlockChunker`:

- **Limite baixo:** não emite até o buffer ser >= `minChars` (a menos que seja forçado).
- **Limite alto:** prefere dividir antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Code fences:** nunca divide dentro de fences; quando forçado em `maxChars`, fecha e reabre a fence para manter o Markdown válido.

`maxChars` é limitado por `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos em streaming)

Quando o streaming em blocos está habilitado, o OpenClaw pode **mesclar fragmentos consecutivos**
antes de enviá-los. Isso reduz o “spam de linha única” e ainda fornece
saída progressiva.

- A coalescência espera por **intervalos de inatividade** (`idleMs`) antes de descarregar.
- Os buffers são limitados por `maxChars` e serão descarregados se os excederem.
- `minChars` impede que fragmentos minúsculos sejam enviados até que texto suficiente se acumule
  (o descarregamento final sempre envia o texto restante).
- O joiner é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições por canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão da coalescência é elevado para 1500 em Signal/Slack/Discord, a menos que seja substituído.

## Ritmo humano entre blocos

Quando o streaming em blocos está habilitado, você pode adicionar uma **pausa aleatória**
entre respostas em bloco (após o primeiro bloco). Isso faz respostas com várias bolhas parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (substituível por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em bloco**, não a respostas finais nem a resumos de ferramentas.

## "Transmitir fragmentos ou tudo"

Isso corresponde a:

- **Transmitir fragmentos:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não sejam Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em vários fragmentos se for muito longo).
- **Sem streaming em blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação de canal:** o streaming em blocos fica **desativado, a menos que**
`*.blockStreaming` seja explicitamente definido como `true`. Os canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em bloco.

Lembrete sobre a localização da configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita o streaming de prévia.
- `partial`: uma única prévia que é substituída pelo texto mais recente.
- `block`: atualizações de prévia em etapas fragmentadas/anexadas.
- `progress`: prévia de progresso/status durante a geração, resposta final ao concluir.

### Mapeamento por canal

| Canal      | `off` | `partial` | `block` | `progress`            |
| ---------- | ----- | --------- | ------- | --------------------- |
| Telegram   | ✅    | ✅        | ✅      | mapeia para `partial` |
| Discord    | ✅    | ✅        | ✅      | mapeia para `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                    |
| Mattermost | ✅    | ✅        | ✅      | ✅                    |

Somente no Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API nativa de streaming do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente no Slack exigem um destino de thread de resposta; DMs de nível superior não exibem essa prévia no estilo de thread.

Migração de chaves legadas:

- Telegram: `streamMode` + booleano `streaming` são migrados automaticamente para o enum `streaming`.
- Discord: `streamMode` + booleano `streaming` são migrados automaticamente para o enum `streaming`.
- Slack: `streamMode` é migrado automaticamente para `streaming.mode`; booleano `streaming` é migrado automaticamente para `streaming.mode` mais `streaming.nativeTransport`; o legado `nativeStreaming` é migrado automaticamente para `streaming.nativeTransport`.

### Comportamento em runtime

Telegram:

- Usa `sendMessage` + `editMessageText` para atualizações de prévia em DMs e grupos/tópicos.
- O streaming de prévia é ignorado quando o streaming em blocos do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode gravar o raciocínio na prévia.

Discord:

- Usa envio + edição de mensagens de prévia.
- O modo `block` usa fragmentação de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming em blocos do Discord está explicitamente habilitado.
- Payloads finais de mídia, erro e resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho, depois usam entrega normal.

Slack:

- `partial` pode usar o streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias em rascunho no estilo append.
- `progress` usa texto de prévia de status, depois a resposta final.
- Payloads finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a prévia descarregam o texto pendente do rascunho.

Mattermost:

- Faz streaming de raciocínio, atividade de ferramentas e texto parcial de resposta em uma única publicação de prévia em rascunho que é finalizada no mesmo lugar quando a resposta final é segura para envio.
- Recorre ao envio de uma nova publicação final se a publicação de prévia tiver sido excluída ou não estiver disponível no momento da finalização.
- Payloads finais de mídia/erro cancelam atualizações pendentes de prévia antes da entrega normal, em vez de descarregar uma publicação temporária de prévia.

Matriz:

- Prévias em rascunho são finalizadas no mesmo lugar quando o texto final pode reutilizar o evento de prévia.
- Finais somente com mídia, de erro e com incompatibilidade de destino de resposta cancelam atualizações pendentes de prévia antes da entrega normal; uma prévia obsoleta já visível é redigida.

### Atualizações de prévia de progresso de ferramentas

O streaming de prévia também pode incluir atualizações de **progresso de ferramentas** — linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" — que aparecem na mesma mensagem de prévia enquanto as ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas com várias etapas visualmente ativos em vez de silenciosos entre a primeira prévia de raciocínio e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack** e **Telegram** fazem streaming do progresso de ferramentas na edição de prévia ao vivo.
- **Mattermost** já incorpora a atividade de ferramentas em sua única publicação de prévia em rascunho (veja acima).
- Edições de progresso de ferramentas seguem o modo ativo de streaming de prévia; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming em blocos assumiu a mensagem.

## Relacionado

- [Mensagens](/pt-BR/concepts/messages) — ciclo de vida e entrega de mensagens
- [Retry](/pt-BR/concepts/retry) — comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) — suporte de streaming por canal
