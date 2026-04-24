---
read_when:
    - Alterando o comportamento ou os padrões do indicador de digitação
summary: Quando o OpenClaw mostra indicadores de digitação e como ajustá-los
title: Indicadores de digitação
x-i18n:
    generated_at: "2026-04-24T05:49:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Indicadores de digitação são enviados ao canal de chat enquanto uma execução está ativa. Use
`agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds`
para controlar **com que frequência** ela é atualizada.

## Padrões

Quando `agents.defaults.typingMode` está **indefinido**, o OpenClaw mantém o comportamento legado:

- **Chats diretos**: a digitação começa imediatamente assim que o loop do modelo se inicia.
- **Chats em grupo com menção**: a digitação começa imediatamente.
- **Chats em grupo sem menção**: a digitação começa somente quando o texto da mensagem começa a ser transmitido.
- **Execuções de Heartbeat**: a digitação começa quando a execução de Heartbeat se inicia, se o
  destino de Heartbeat resolvido for um chat com suporte a digitação e a digitação não estiver desabilitada.

## Modos

Defina `agents.defaults.typingMode` como um destes:

- `never` — nunca mostra indicador de digitação.
- `instant` — começa a digitar **assim que o loop do modelo se inicia**, mesmo que a execução
  depois retorne apenas o token de resposta silenciosa.
- `thinking` — começa a digitar no **primeiro delta de raciocínio** (exige
  `reasoningLevel: "stream"` para a execução).
- `message` — começa a digitar no **primeiro delta de texto não silencioso** (ignora
  o token silencioso `NO_REPLY`).

Ordem de “com que antecedência é acionado”:
`never` → `message` → `thinking` → `instant`

## Configuração

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Você pode substituir o modo ou a cadência por sessão:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Observações

- O modo `message` não mostrará digitação para respostas apenas silenciosas quando toda a
  carga útil for o token silencioso exato (por exemplo `NO_REPLY` / `no_reply`,
  com correspondência sem diferenciar maiúsculas de minúsculas).
- `thinking` só dispara se a execução transmitir raciocínio (`reasoningLevel: "stream"`).
  Se o modelo não emitir deltas de raciocínio, a digitação não começará.
- A digitação do Heartbeat é um sinal de vivacidade para o destino de entrega resolvido. Ela
  começa no início da execução de Heartbeat em vez de seguir o tempo de streaming de `message` ou `thinking`.
  Defina `typingMode: "never"` para desabilitá-la.
- Heartbeats não mostram digitação quando `target: "none"`, quando o destino não pode
  ser resolvido, quando a entrega por chat está desabilitada para o Heartbeat ou quando o
  canal não oferece suporte à digitação.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o momento de início.
  O padrão é 6 segundos.

## Relacionado

- [Presença](/pt-BR/concepts/presence)
- [Streaming e fragmentação](/pt-BR/concepts/streaming)
