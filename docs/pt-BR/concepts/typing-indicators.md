---
read_when:
    - Alterando o comportamento ou os padrões do indicador de digitação
summary: Quando o OpenClaw exibe indicadores de digitação e como ajustá-los
title: Indicadores de digitação
x-i18n:
    generated_at: "2026-05-06T05:53:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Indicadores de digitação são enviados ao canal de chat enquanto uma execução está ativa. Use
`agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds`
para controlar **com que frequência** ela é atualizada.

## Padrões

Quando `agents.defaults.typingMode` **não está definido**, o OpenClaw mantém o comportamento legado:

- **Chats diretos**: a digitação começa imediatamente assim que o loop do modelo começa.
- **Chats em grupo com uma menção**: a digitação começa imediatamente.
- **Chats em grupo sem uma menção**: a digitação começa somente quando o texto da mensagem começa a ser transmitido em streaming.
- **Execuções de Heartbeat**: a digitação começa quando a execução de Heartbeat começa se o
  destino de Heartbeat resolvido for um chat com suporte a digitação e a digitação não estiver desabilitada.

## Modos

Defina `agents.defaults.typingMode` como um dos seguintes:

- `never` - nenhum indicador de digitação, nunca.
- `instant` - começa a digitar **assim que o loop do modelo começa**, mesmo que a execução
  depois retorne apenas o token de resposta silenciosa.
- `thinking` - começa a digitar no **primeiro delta de raciocínio** (requer
  `reasoningLevel: "stream"` para a execução).
- `message` - começa a digitar no **primeiro delta de texto não silencioso** (ignora
  o token silencioso `NO_REPLY`).

Ordem de "quão cedo é acionado":
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

## Notas

- O modo `message` não mostrará digitação para respostas somente silenciosas quando todo o
  payload for exatamente o token silencioso (por exemplo, `NO_REPLY` / `no_reply`,
  correspondido sem diferenciar maiúsculas de minúsculas).
- `thinking` só é acionado se a execução transmitir raciocínio (`reasoningLevel: "stream"`).
  Se o modelo não emitir deltas de raciocínio, a digitação não começará.
- A digitação de Heartbeat é um sinal de atividade para o destino de entrega resolvido. Ela
  começa no início da execução de Heartbeat, em vez de seguir o tempo de stream de `message` ou `thinking`.
  Defina `typingMode: "never"` para desabilitá-la.
- Heartbeats não mostram digitação quando `target: "none"`, quando o destino não pode
  ser resolvido, quando a entrega por chat está desabilitada para o Heartbeat ou quando o
  canal não oferece suporte a digitação.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o horário de início.
  O padrão é 6 segundos.

## Relacionados

<CardGroup cols={2}>
  <Card title="Presence" href="/pt-BR/concepts/presence" icon="signal">
    Como o Gateway rastreia clientes conectados e os expõe na aba Instâncias do macOS.
  </Card>
  <Card title="Streaming and chunking" href="/pt-BR/concepts/streaming" icon="bars-staggered">
    Comportamento de streaming de saída, limites de chunks e entrega específica por canal.
  </Card>
</CardGroup>
