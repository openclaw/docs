---
read_when:
    - Alteração do comportamento ou dos padrões do indicador de digitação
summary: Quando o OpenClaw exibe indicadores de digitação e como ajustá-los
title: Indicadores de digitação
x-i18n:
    generated_at: "2026-07-12T15:13:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Os indicadores de digitação são enviados ao canal de chat enquanto uma execução está ativa. Use `agents.defaults.typingMode` para controlar **quando** a digitação começa e `typingIntervalSeconds` para controlar **com que frequência** ela é atualizada (cadência de keepalive, padrão de 6 segundos).

## Padrões

Quando `agents.defaults.typingMode` **não está definido**:

- **Conversas diretas**: a digitação começa imediatamente quando o loop do modelo é iniciado.
- **Conversas em grupo com uma menção**: a digitação começa imediatamente.
- **Conversas em grupo sem uma menção**: a digitação começa quando a execução admitida apresenta atividade visível para o usuário, como atividade de execução do harness ou texto de mensagem.
- **Execuções de Heartbeat**: a digitação começa quando a execução de Heartbeat é iniciada, se o destino de Heartbeat resolvido for um chat compatível com digitação e a digitação não estiver desativada.

## Modos

Defina `agents.defaults.typingMode` como uma das seguintes opções:

- `never` - nunca exibe o indicador de digitação.
- `instant` - começa a digitar **assim que o loop do modelo é iniciado**, mesmo que posteriormente a execução retorne apenas o token de resposta silenciosa.
- `thinking` - começa a digitar no **primeiro delta de raciocínio** ou durante a execução ativa do harness após o turno ser aceito.
- `message` - começa a digitar na **primeira atividade de resposta visível para o usuário**, como a execução ativa do harness ou um delta de texto não silencioso. Tokens de resposta silenciosa como `NO_REPLY` não contam como atividade de texto.

Ordem de “quão cedo é acionado”: `never` -> `message`/`thinking` -> `instant`.

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

- O modo `message` não é iniciado por tokens de resposta silenciosa, mas a execução ativa ainda pode exibir a digitação antes que qualquer texto do assistente esteja disponível.
- O modo `thinking` ainda reage ao raciocínio transmitido (`reasoningLevel: "stream"`) e também pode ser iniciado pela execução ativa antes da chegada dos deltas de raciocínio.
- A digitação de Heartbeat é um sinal de atividade para o destino de entrega resolvido. Ela começa no início da execução de Heartbeat, em vez de seguir a temporização do fluxo de `message` ou `thinking`. Defina `typingMode: "never"` para desativá-la.
- Os Heartbeats não exibem a digitação quando o destino de Heartbeat é `"none"`, quando não é possível resolver o destino, quando a entrega no chat está desativada para o Heartbeat ou quando o canal não é compatível com digitação.
- `typingIntervalSeconds` controla a **cadência de atualização**, não o horário de início. Padrão: 6 segundos.

## Relacionados

<CardGroup cols={2}>
  <Card title="Presença" href="/pt-BR/concepts/presence" icon="signal">
    Como o Gateway rastreia clientes conectados para a página Dispositivos da Interface de Controle e a guia Instâncias do macOS.
  </Card>
  <Card title="Transmissão e segmentação" href="/pt-BR/concepts/streaming" icon="bars-staggered">
    Comportamento da transmissão de saída, limites dos segmentos e entrega específica de cada canal.
  </Card>
</CardGroup>
