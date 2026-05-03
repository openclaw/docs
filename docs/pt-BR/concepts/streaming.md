---
read_when:
    - Explicando como a transmissão contínua ou a divisão em blocos funciona nos canais
    - Alterando o comportamento de transmissão em blocos ou de fragmentação de canal
    - Depuração de respostas de bloco duplicadas/antecipadas ou transmissão de prévia do canal
summary: Comportamento de transmissão contínua + segmentação (respostas em bloco, transmissão contínua da prévia do canal, mapeamento de modos)
title: Transmissão em fluxo e fragmentação
x-i18n:
    generated_at: "2026-05-03T05:48:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85f6cb33031a6c818bb709e0ed14d8dd0f8c30a3dd90468a40396b3a515b5e65
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw tem duas camadas de streaming separadas:

- **Streaming de blocos (canais):** emite **blocos** concluídos enquanto o assistente escreve. Essas são mensagens normais de canal (não deltas de tokens).
- **Streaming de prévia (Telegram/Discord/Slack):** atualiza uma **mensagem de prévia** temporária durante a geração.

Hoje, **não há streaming real de delta de tokens** para mensagens de canal. O streaming de prévia é baseado em mensagens (envio + edições/acréscimos).

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
- `chunker`: `EmbeddedBlockChunker` aplicando limites mínimos/máximos + preferência de quebra.
- `channel send`: mensagens de saída reais (respostas em blocos).

**Controles:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (padrão desligado).
- Substituições por canal: `*.blockStreaming` (e variantes por conta) para forçar `"on"`/`"off"` por canal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (mesclar blocos transmitidos antes do envio).
- Limite rígido do canal: `*.textChunkLimit` (por exemplo, `channels.whatsapp.textChunkLimit`).
- Modo de fragmentação do canal: `*.chunkMode` (`length` por padrão, `newline` divide em linhas em branco (limites de parágrafo) antes da fragmentação por comprimento).
- Limite flexível do Discord: `channels.discord.maxLinesPerMessage` (padrão 17) divide respostas altas para evitar corte na UI.

**Semântica de limites:**

- `text_end`: transmite blocos assim que o fragmentador emite; descarrega em cada `text_end`.
- `message_end`: espera a mensagem do assistente terminar e então descarrega a saída em buffer.

`message_end` ainda usa o fragmentador se o texto em buffer exceder `maxChars`, então pode emitir várias partes no final.

### Entrega de mídia com streaming de blocos

Diretivas `MEDIA:` são metadados normais de entrega. Quando o streaming de blocos envia um
bloco de mídia cedo, o OpenClaw lembra essa entrega para o turno. Se a carga final
do assistente repetir a mesma URL de mídia, a entrega final remove a mídia
duplicada em vez de enviar o anexo novamente.

Cargas finais exatamente duplicadas são suprimidas. Se a carga final adicionar
texto distinto ao redor de mídia que já foi transmitida, o OpenClaw ainda envia o
novo texto enquanto mantém a mídia em entrega única. Isso evita notas de voz
ou arquivos duplicados em canais como Telegram quando um agente emite `MEDIA:` durante
o streaming e o provedor também a inclui na resposta concluída.

## Algoritmo de fragmentação (limites inferior/superior)

A fragmentação de blocos é implementada por `EmbeddedBlockChunker`:

- **Limite inferior:** não emite até buffer >= `minChars` (a menos que seja forçado).
- **Limite superior:** prefere divisões antes de `maxChars`; se forçado, divide em `maxChars`.
- **Preferência de quebra:** `paragraph` → `newline` → `sentence` → `whitespace` → quebra rígida.
- **Cercas de código:** nunca divide dentro de cercas; quando forçado em `maxChars`, fecha + reabre a cerca para manter o Markdown válido.

`maxChars` é limitado ao `textChunkLimit` do canal, então você não pode exceder os limites por canal.

## Coalescência (mesclar blocos transmitidos)

Quando o streaming de blocos está habilitado, o OpenClaw pode **mesclar partes consecutivas de blocos**
antes de enviá-las. Isso reduz “spam de uma linha” enquanto ainda fornece
saída progressiva.

- A coalescência espera por **intervalos ociosos** (`idleMs`) antes de descarregar.
- Buffers são limitados por `maxChars` e serão descarregados se o excederem.
- `minChars` impede que fragmentos minúsculos sejam enviados até texto suficiente se acumular
  (a descarga final sempre envia o texto restante).
- O separador é derivado de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espaço).
- Substituições por canal estão disponíveis via `*.blockStreamingCoalesce` (incluindo configurações por conta).
- O `minChars` padrão de coalescência é aumentado para 1500 para Signal/Slack/Discord, a menos que seja sobrescrito.

## Ritmo humano entre blocos

Quando o streaming de blocos está habilitado, você pode adicionar uma **pausa aleatória** entre
respostas em blocos (após o primeiro bloco). Isso faz respostas com vários balões parecerem
mais naturais.

- Configuração: `agents.defaults.humanDelay` (sobrescreva por agente via `agents.list[].humanDelay`).
- Modos: `off` (padrão), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Aplica-se apenas a **respostas em blocos**, não a respostas finais ou resumos de ferramentas.

## "Transmitir partes ou tudo"

Isso corresponde a:

- **Transmitir partes:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (emite conforme avança). Canais que não são Telegram também precisam de `*.blockStreaming: true`.
- **Transmitir tudo no final:** `blockStreamingBreak: "message_end"` (descarrega uma vez, possivelmente em várias partes se for muito longo).
- **Sem streaming de blocos:** `blockStreamingDefault: "off"` (apenas resposta final).

**Observação de canal:** O streaming de blocos fica **desligado a menos que**
`*.blockStreaming` esteja explicitamente definido como `true`. Canais podem transmitir uma prévia ao vivo
(`channels.<channel>.streaming`) sem respostas em blocos.

Lembrete de local de configuração: os padrões `blockStreaming*` ficam em
`agents.defaults`, não na configuração raiz.

## Modos de streaming de prévia

Chave canônica: `channels.<channel>.streaming`

Modos:

- `off`: desabilita o streaming de prévia.
- `partial`: prévia única que é substituída pelo texto mais recente.
- `block`: a prévia é atualizada em etapas fragmentadas/acrescentadas.
- `progress`: prévia de progresso/status durante a geração, resposta final na conclusão.

### Mapeamento de canais

| Canal      | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | mapeia para `partial`   |
| Discord    | ✅    | ✅        | ✅      | mapeia para `partial`   |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |

Somente Slack:

- `channels.slack.streaming.nativeTransport` alterna chamadas da API de streaming nativa do Slack quando `channels.slack.streaming.mode="partial"` (padrão: `true`).
- O streaming nativo do Slack e o status de thread do assistente do Slack exigem um destino de thread de resposta. DMs de nível superior não mostram essa prévia em estilo de thread, mas ainda podem usar publicações e edições de prévia de rascunho do Slack.

Migração de chaves legadas:

- Telegram: valores legados `streamMode` e valores escalares/booleanos de `streaming` são detectados e migrados pelos caminhos de compatibilidade de doctor/config para `streaming.mode`.
- Discord: `streamMode` + `streaming` booleano migram automaticamente para o enum `streaming`.
- Slack: `streamMode` migra automaticamente para `streaming.mode`; `streaming` booleano migra automaticamente para `streaming.mode` mais `streaming.nativeTransport`; `nativeStreaming` legado migra automaticamente para `streaming.nativeTransport`.

### Comportamento em tempo de execução

Telegram:

- Usa atualizações de prévia `sendMessage` + `editMessageText` em DMs e grupos/tópicos.
- Envia uma nova mensagem final em vez de editar no lugar quando uma prévia ficou visível por cerca de um minuto, depois limpa a prévia para que o carimbo de data/hora do Telegram reflita a conclusão da resposta.
- O streaming de prévia é ignorado quando o streaming de blocos do Telegram está explicitamente habilitado (para evitar streaming duplo).
- `/reasoning stream` pode escrever raciocínio na prévia.

Discord:

- Usa envio + edição de mensagens de prévia.
- O modo `block` usa fragmentação de rascunho (`draftChunk`).
- O streaming de prévia é ignorado quando o streaming de blocos do Discord está explicitamente habilitado.
- Mídia final, erro e cargas de resposta explícita cancelam prévias pendentes sem descarregar um novo rascunho, depois usam a entrega normal.

Slack:

- `partial` pode usar streaming nativo do Slack (`chat.startStream`/`append`/`stop`) quando disponível.
- `block` usa prévias de rascunho em estilo de acréscimo.
- `progress` usa texto de prévia de status e depois a resposta final.
- DMs de nível superior sem uma thread de resposta usam publicações e edições de prévia de rascunho em vez do streaming nativo do Slack.
- Streaming de prévia nativo e de rascunho suprime respostas em blocos nesse turno, então uma resposta do Slack é transmitida por apenas um caminho de entrega.
- Cargas finais de mídia/erro e finais de progresso não criam mensagens de rascunho descartáveis; apenas finais de texto/bloco que podem editar a prévia descarregam o texto de rascunho pendente.

Mattermost:

- Transmite pensamento, atividade de ferramentas e texto parcial de resposta para uma única publicação de prévia de rascunho que é finalizada no lugar quando a resposta final é segura para enviar.
- Recorre ao envio de uma nova publicação final se a publicação de prévia foi excluída ou está indisponível no momento da finalização.
- Cargas finais de mídia/erro cancelam atualizações de prévia pendentes antes da entrega normal, em vez de descarregar uma publicação de prévia temporária.

Matrix:

- Prévias de rascunho são finalizadas no lugar quando o texto final pode reutilizar o evento de prévia.
- Finais apenas com mídia, erro e incompatibilidade de destino de resposta cancelam atualizações de prévia pendentes antes da entrega normal; uma prévia obsoleta já visível é removida.

### Atualizações de prévia de progresso de ferramentas

O streaming de prévia também pode incluir atualizações de **progresso de ferramentas** — linhas curtas de status como "pesquisando na web", "lendo arquivo" ou "chamando ferramenta" — que aparecem na mesma mensagem de prévia enquanto ferramentas estão em execução, antes da resposta final. Isso mantém turnos de ferramentas com várias etapas visualmente vivos em vez de silenciosos entre a primeira prévia de pensamento e a resposta final.

Superfícies compatíveis:

- **Discord**, **Slack**, **Telegram** e **Matrix** transmitem o progresso de ferramentas para a edição da prévia ao vivo por padrão quando o streaming de prévia está ativo.
- O Telegram é enviado com atualizações de prévia de progresso de ferramentas habilitadas desde `v2026.4.22`; mantê-las habilitadas preserva esse comportamento lançado.
- **Mattermost** já incorpora atividade de ferramentas em sua única publicação de prévia de rascunho (veja acima).
- Edições de progresso de ferramentas seguem o modo ativo de streaming de prévia; elas são ignoradas quando o streaming de prévia está `off` ou quando o streaming de blocos assumiu a mensagem. No Telegram, `streaming.mode: "off"` é somente final: conversas genéricas de progresso também são suprimidas em vez de serem entregues como mensagens autônomas "Trabalhando...", enquanto solicitações de aprovação, cargas de mídia e erros ainda são roteados normalmente.
- Para manter o streaming de prévia mas ocultar linhas de progresso de ferramentas, defina `streaming.preview.toolProgress` como `false` para esse canal. Para desabilitar completamente edições de prévia, defina `streaming.mode` como `off`.

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
- [Repetição](/pt-BR/concepts/retry) — comportamento de nova tentativa em falha de entrega
- [Canais](/pt-BR/channels) — suporte a streaming por canal
