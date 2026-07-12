---
read_when:
    - Você está alterando como os registros de data e hora são exibidos ao modelo ou aos usuários
    - Você está depurando a formatação de horário em mensagens ou na saída do prompt do sistema
summary: Tratamento de data e hora em envelopes, prompts, ferramentas e conectores
title: Data e hora
x-i18n:
    generated_at: "2026-07-11T23:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw usa **a hora local do host nos carimbos de data e hora do transporte** e inclui **somente o fuso horário** no prompt do sistema.
Os carimbos de data e hora do provedor são preservados para que as ferramentas mantenham sua semântica nativa. Quando o agente precisa saber a hora atual,
ele executa a ferramenta `session_status`.

## Envelopes de mensagens (locais por padrão)

As mensagens recebidas são envolvidas com o dia da semana e um carimbo de data e hora com precisão de segundos:

```
[WhatsApp +1555 seg. 2026-01-05 16:26:34 PST] texto da mensagem
```

Por padrão, o carimbo de data e hora do envelope usa **a hora local do host**, independentemente do fuso horário do provedor.
Substitua essa configuração em `agents.defaults`:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuso horário IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Chave               | Valores                                              | Comportamento                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `envelopeTimezone`  | `local` (padrão), `utc`, `user`, nome IANA explícito | `user` usa `agents.defaults.userTimezone` (o fuso horário do host quando não definido). Um nome IANA explícito (por exemplo, `"America/Chicago"`) fixa um fuso; nomes não reconhecidos usam UTC como alternativa. |
| `envelopeTimestamp` | `on` (padrão), `off`                                 | `off` remove os carimbos de data e hora absolutos dos cabeçalhos de envelope, dos prefixos diretos do prompt do agente e dos prefixos incorporados à entrada do modelo.                                        |
| `envelopeElapsed`   | `on` (padrão), `off`                                 | `off` remove o sufixo de tempo decorrido (no formato `+30s` / `+2m`) exibido desde a mensagem anterior na sessão.                                                                                              |

### Exemplos

**Local (padrão):**

```
[WhatsApp +1555 dom. 2026-01-18 00:19:42 PST] olá
```

**Fuso horário do usuário:**

```
[WhatsApp +1555 dom. 2026-01-18 00:19:42 CST] olá
```

**Tempo decorrido com `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s dom. 2026-01-18T05:19:00Z] acompanhamento
```

## Prompt do sistema: data e hora atuais

O prompt do sistema inclui uma seção **Data e hora atuais** somente com o **fuso horário**
(sem relógio nem formato de hora), para que o cache do prompt permaneça estável:

```
Fuso horário: America/Chicago
```

O fuso é definido por `agents.defaults.userTimezone` quando configurado; caso contrário, é usado o fuso horário do host.
O prompt também instrui o agente a executar a ferramenta `session_status` sempre que precisar da
data atual, da hora atual ou do dia da semana.

## Linhas de eventos do sistema (locais por padrão)

Eventos do sistema enfileirados e inseridos no contexto do agente recebem como prefixo um carimbo de data e hora que usa a
mesma seleção de `envelopeTimezone` dos envelopes de mensagens (padrão: hora local do host).

```
Sistema: [2026-01-12 12:19:17 PST] Modelo alterado.
```

### Configurar fuso horário do usuário e formato

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

- `userTimezone` define o **fuso horário local do usuário** para o contexto do prompt (e para `envelopeTimezone: "user"`).
- `timeFormat` controla a **exibição em 12 ou 24 horas** nos horários apresentados no prompt. `auto` segue as preferências do sistema operacional.

## Detecção do formato de hora (automática)

Quando `timeFormat: "auto"`, o OpenClaw verifica a preferência do sistema operacional (macOS e Windows)
e, se necessário, usa a formatação da localidade como alternativa. O valor detectado é **armazenado em cache por processo**
para evitar chamadas repetidas ao sistema.

## Cargas úteis de ferramentas e conectores (hora bruta do provedor e campos normalizados)

As ferramentas de canal retornam **carimbos de data e hora nativos do provedor** e adicionam campos normalizados para manter a consistência:

- `timestampMs`: milissegundos desde a época (UTC)
- `timestampUtc`: string UTC no formato ISO 8601

Os campos brutos do provedor são preservados para que nada seja perdido.

- Discord: carimbos de data e hora ISO em UTC
- Slack: strings semelhantes a valores de época fornecidas pela API
- Telegram/WhatsApp: carimbos de data e hora numéricos ou ISO específicos do provedor

Se precisar da hora local, converta-a posteriormente usando o fuso horário conhecido.

## Documentação relacionada

- [Prompt do sistema](/pt-BR/concepts/system-prompt)
- [Fusos horários](/pt-BR/concepts/timezone)
- [Mensagens](/pt-BR/concepts/messages)
