---
read_when:
    - Você está alterando como os timestamps são mostrados ao modelo ou aos usuários
    - Você está depurando a formatação de hora em mensagens ou na saída do prompt de sistema
summary: Tratamento de data e hora em envelopes, prompts, tools e conectores
title: Data e hora
x-i18n:
    generated_at: "2026-04-24T05:50:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# Data e hora

O OpenClaw usa por padrão **hora local do host para timestamps de transporte** e **timezone do usuário apenas no prompt de sistema**.
Timestamps do provider são preservados para que as tools mantenham sua semântica nativa (a hora atual está disponível via `session_status`).

## Envelopes de mensagem (local por padrão)

Mensagens de entrada são encapsuladas com um timestamp (precisão de minuto):

```
[Provider ... 2026-01-05 16:26 PST] texto da mensagem
```

Esse timestamp do envelope é **local do host por padrão**, independentemente do timezone do provider.

Você pode substituir esse comportamento:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | timezone IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "local"` usa o timezone do host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (usa o timezone do host como fallback).
- Use um timezone IANA explícito (por exemplo, `"America/Chicago"`) para uma zona fixa.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos cabeçalhos do envelope.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (no estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Timezone do usuário:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Tempo decorrido habilitado:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt de sistema: Data e hora atuais

Se o timezone do usuário for conhecido, o prompt de sistema inclui uma seção dedicada
**Data e hora atuais** com **apenas o fuso horário** (sem formato de relógio/hora)
para manter o cache de prompt estável:

```
Time zone: America/Chicago
```

Quando o agente precisar da hora atual, use a tool `session_status`; o card de status
inclui uma linha de timestamp.

## Linhas de evento do sistema (local por padrão)

Eventos de sistema enfileirados inseridos no contexto do agente recebem um prefixo com timestamp usando a
mesma seleção de timezone dos envelopes de mensagem (padrão: hora local do host).

```
System: [2026-01-12 12:19:17 PST] Modelo alterado.
```

### Configurar timezone + formato do usuário

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

- `userTimezone` define o **timezone local do usuário** para o contexto do prompt.
- `timeFormat` controla a exibição em **12h/24h** no prompt. `auto` segue as preferências do SO.

## Detecção do formato de hora (auto)

Quando `timeFormat: "auto"`, o OpenClaw inspeciona a preferência do SO (macOS/Windows)
e usa a formatação da localidade como fallback. O valor detectado é **armazenado em cache por processo**
para evitar chamadas repetidas ao sistema.

## Payloads de tools + conectores (hora bruta do provider + campos normalizados)

As tools de canal retornam **timestamps nativos do provider** e adicionam campos normalizados para consistência:

- `timestampMs`: milissegundos epoch (UTC)
- `timestampUtc`: string UTC ISO 8601

Os campos brutos do provider são preservados para que nada seja perdido.

- Slack: strings no estilo epoch da API
- Discord: timestamps UTC ISO
- Telegram/WhatsApp: timestamps numéricos/ISO específicos do provider

Se você precisar da hora local, converta-a downstream usando o timezone conhecido.

## Documentação relacionada

- [Prompt de sistema](/pt-BR/concepts/system-prompt)
- [Timezones](/pt-BR/concepts/timezone)
- [Mensagens](/pt-BR/concepts/messages)
