---
read_when:
    - Você quer um modelo mental rápido para lidar com fusos horários
    - Você está decidindo onde definir ou substituir um fuso horário
summary: Onde os fusos horários aparecem no OpenClaw — envelopes, payloads de ferramentas, prompt do sistema
title: Fusos horários
x-i18n:
    generated_at: "2026-06-27T17:27:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw padroniza carimbos de data e hora para que o modelo veja um **único horário de referência** em vez de uma mistura de relógios locais de provedores. Há três superfícies onde os fusos horários aparecem, cada uma com sua própria finalidade:

## Três superfícies de fuso horário

| Superfície           | O que mostra                                                                                           | Padrão                                | Configurado via                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Envelopes de mensagens | Envolve mensagens de canais recebidas: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                      | Local do host                         | `agents.defaults.envelopeTimezone`                      |
| Cargas de ferramentas     | Ferramentas no estilo `readMessages` do canal retornam hora bruta do provedor + `timestampMs` / `timestampUtc` normalizados | Campos UTC sempre presentes           | Não configurável — preserva carimbos de data e hora nativos do provedor |
| Prompt do sistema     | Um pequeno bloco `Current Date & Time` com **apenas o fuso horário** (sem valor de relógio, para estabilidade do cache)   | Fuso horário do host se `userTimezone` não estiver definido | `agents.defaults.userTimezone`                          |

O prompt do sistema omite deliberadamente o relógio ao vivo para manter o cache de prompt estável entre turnos. Quando o agente precisa do horário atual, ele chama `session_status`.

## Definindo o fuso horário do usuário

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Se `userTimezone` não estiver definido, o OpenClaw resolve o fuso horário do host em tempo de execução (sem gravação de configuração). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla a renderização em 12h/24h em envelopes e superfícies downstream, não na seção do prompt do sistema.

## Quando substituir

- **Use envelopes em UTC** (`envelopeTimezone: "utc"`) quando quiser carimbos de data e hora estáveis entre hosts em regiões diferentes, ou quando quiser logs alinhados a UTC para corresponder à saída de diagnósticos.
- **Use uma zona IANA fixa** (por exemplo, `"Europe/Vienna"`) quando o host do gateway estiver em uma zona, mas o usuário estiver em outra, e você quiser que os envelopes sejam lidos na zona do usuário independentemente da migração do host.
- **Defina `envelopeTimestamp: "off"`** quando o contexto de carimbo de data e hora não for útil para a conversa. Isso remove carimbos de data e hora absolutos de envelopes, prefixos diretos de prompt do agente e prefixos incorporados de entrada do modelo.

Para a referência completa de comportamento, exemplos por provedor e formatação de tempo decorrido, consulte [Data e Hora](/pt-BR/date-time).

## Relacionado

- [Data e Hora](/pt-BR/date-time) — comportamento completo de envelopes/ferramentas/prompts e exemplos.
- [Heartbeat](/pt-BR/gateway/heartbeat) — horários ativos usam fuso horário para agendamento.
- [Tarefas Cron](/pt-BR/automation/cron-jobs) — expressões cron usam fuso horário para agendamento.
