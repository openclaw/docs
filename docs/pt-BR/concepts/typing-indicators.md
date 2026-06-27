---
read_when:
    - Alterando o comportamento ou os padrões do indicador de digitação
summary: Quando o OpenClaw mostra indicadores de digitação e como ajustá-los
title: Indicadores de digitação
x-i18n:
    generated_at: "2026-06-27T17:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
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
- **Chats em grupo sem uma menção**: a digitação começa quando a execução admitida tem
  atividade visível para o usuário, como atividade de execução do ambiente ou texto de mensagem.
- **Execuções de Heartbeat**: a digitação começa quando a execução de Heartbeat começa se o
  destino de Heartbeat resolvido for um chat compatível com digitação e a digitação não estiver desativada.

## Modos

Defina `agents.defaults.typingMode` como um destes:

- `never` - nenhum indicador de digitação, nunca.
- `instant` - começa a digitar **assim que o loop do modelo começa**, mesmo que a execução
  depois retorne apenas o token de resposta silenciosa.
- `thinking` - começa a digitar no **primeiro delta de raciocínio** ou na execução ativa
  do ambiente depois que o turno é aceito.
- `message` - começa a digitar na **primeira atividade de resposta visível para o usuário**, como
  execução ativa do ambiente ou um delta de texto não silencioso. Tokens de resposta silenciosa como
  `NO_REPLY` não contam como atividade de texto.

Ordem de "quão cedo é acionado":
`never` → `message`/`thinking` → `instant`

## Configuração

Defina o padrão no nível do agente:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Substitua o modo ou a cadência por sessão:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Observações

- O modo `message` não começa a partir de tokens de resposta silenciosa, mas a execução ativa
  ainda pode mostrar digitação antes que qualquer texto do assistente esteja disponível.
- `thinking` ainda reage ao raciocínio transmitido em streaming (`reasoningLevel: "stream"`),
  e também pode começar a partir da execução ativa antes que os deltas de raciocínio cheguem.
- A digitação de Heartbeat é um sinal de vivacidade para o destino de entrega resolvido. Ela
  começa no início da execução de Heartbeat em vez de seguir o tempo do fluxo de `message` ou `thinking`.
  Defina `typingMode: "never"` para desativá-la.
- Heartbeats não mostram digitação quando `target: "none"`, quando o destino não pode
  ser resolvido, quando a entrega de chat está desativada para o Heartbeat ou quando o
  canal não oferece suporte a digitação.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o horário de início.
  O padrão é 6 segundos.

## Relacionados

<CardGroup cols={2}>
  <Card title="Presença" href="/pt-BR/concepts/presence" icon="signal">
    Como o Gateway rastreia clientes conectados e os expõe na aba Instâncias do macOS.
  </Card>
  <Card title="Streaming e fragmentação" href="/pt-BR/concepts/streaming" icon="bars-staggered">
    Comportamento de streaming de saída, limites de fragmentos e entrega específica por canal.
  </Card>
</CardGroup>
