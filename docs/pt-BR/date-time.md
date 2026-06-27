---
read_when:
    - Você está alterando como os carimbos de data/hora são exibidos para o modelo ou para os usuários
    - Você está depurando a formatação de horário em mensagens ou na saída do prompt do sistema
summary: Tratamento de data e hora em envelopes, prompts, ferramentas e conectores
title: Data e hora
x-i18n:
    generated_at: "2026-06-27T17:28:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

O OpenClaw usa por padrão **horário local do host para timestamps de transporte** e **fuso horário do usuário somente no prompt do sistema**.
Os timestamps do provedor são preservados para que as ferramentas mantenham sua semântica nativa (a hora atual está disponível via `session_status`).

## Envelopes de mensagem (local por padrão)

Mensagens recebidas são encapsuladas com um timestamp (precisão de segundos):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Esse timestamp do envelope é **local do host por padrão**, independentemente do fuso horário do provedor.

Você pode substituir esse comportamento:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "local"` usa o fuso horário do host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (recorre ao fuso horário do host).
- Use um fuso horário IANA explícito (por exemplo, `"America/Chicago"`) para uma zona fixa.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos cabeçalhos de envelope, dos prefixos diretos de prompt do agente e dos prefixos incorporados de entrada do modelo.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (o estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Fuso horário do usuário:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Tempo decorrido ativado:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Prompt do sistema: data e hora atuais

Se o fuso horário do usuário for conhecido, o prompt do sistema incluirá uma seção dedicada
**Data e hora atuais** com **somente o fuso horário** (sem formato de relógio/hora)
para manter o cache de prompt estável:

```
Time zone: America/Chicago
```

Quando o agente precisar da hora atual, use a ferramenta `session_status`; o cartão de
status inclui uma linha de timestamp.

## Linhas de evento do sistema (local por padrão)

Eventos do sistema enfileirados inseridos no contexto do agente recebem um prefixo com timestamp usando a
mesma seleção de fuso horário dos envelopes de mensagem (padrão: local do host).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Configurar fuso horário do usuário + formato

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` define o **fuso horário local do usuário** para o contexto do prompt.
- `timeFormat` controla a **exibição em 12h/24h** no prompt. `auto` segue as preferências do SO.

## Detecção de formato de hora (auto)

Quando `timeFormat: "auto"`, o OpenClaw inspeciona a preferência do SO (macOS/Windows)
e recorre à formatação de localidade. O valor detectado fica **em cache por processo**
para evitar chamadas repetidas ao sistema.

## Payloads de ferramentas + conectores (hora bruta do provedor + campos normalizados)

Ferramentas de canal retornam **timestamps nativos do provedor** e adicionam campos normalizados para consistência:

- `timestampMs`: milissegundos desde a época Unix (UTC)
- `timestampUtc`: string UTC ISO 8601

Campos brutos do provedor são preservados para que nada seja perdido.

- Slack: strings semelhantes a época Unix da API
- Discord: timestamps ISO UTC
- Telegram/WhatsApp: timestamps numéricos/ISO específicos do provedor

Se precisar do horário local, converta-o downstream usando o fuso horário conhecido.

## Documentação relacionada

- [Prompt do sistema](/pt-BR/concepts/system-prompt)
- [Fusos horários](/pt-BR/concepts/timezone)
- [Mensagens](/pt-BR/concepts/messages)
