---
read_when:
    - Você quer um modelo mental rápido para lidar com fusos horários
    - Você está decidindo onde definir ou substituir um fuso horário
summary: Onde os fusos horários aparecem no OpenClaw — envelopes, payloads de ferramentas, prompt do sistema
title: Fusos horários
x-i18n:
    generated_at: "2026-05-06T05:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

O OpenClaw padroniza timestamps para que o modelo veja um **único horário de referência** em vez de uma mistura de relógios locais de provedores. Há três superfícies onde fusos horários aparecem, cada uma com sua própria finalidade:

## Três superfícies de fuso horário

| Superfície        | O que ela mostra                                                                                         | Padrão                                | Configurado via                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Envelopes de mensagem | Encapsula mensagens de canal recebidas: `[Signal +1555 2026-01-18 00:19 PST] hello`                      | Local do host                         | `agents.defaults.envelopeTimezone`                      |
| Payloads de ferramentas | Ferramentas de canal no estilo `readMessages` retornam o horário bruto do provedor + `timestampMs` / `timestampUtc` normalizados | Campos UTC sempre presentes           | Não configurável — preserva timestamps nativos do provedor |
| Prompt do sistema | Um pequeno bloco `Current Date & Time` com **apenas o fuso horário** (sem valor de relógio, para estabilidade do cache) | Fuso horário do host se `userTimezone` não estiver definido | `agents.defaults.userTimezone`                          |

O prompt do sistema omite deliberadamente o relógio em tempo real para manter o cache de prompts estável entre turnos. Quando o agente precisa do horário atual, ele chama `session_status`.

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

Se `userTimezone` não estiver definido, o OpenClaw resolve o fuso horário do host em tempo de execução (sem gravar configuração). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla a renderização em 12h/24h nos envelopes e em superfícies downstream, não na seção do prompt do sistema.

## Quando substituir

- **Use envelopes em UTC** (`envelopeTimezone: "utc"`) quando quiser timestamps estáveis entre hosts em regiões diferentes, ou quando quiser que logs alinhados a UTC correspondam à saída de diagnóstico.
- **Use uma zona IANA fixa** (por exemplo, `"Europe/Vienna"`) quando o host do Gateway estiver em uma zona, mas o usuário estiver em outra, e você quiser que os envelopes sejam lidos na zona do usuário independentemente da migração do host.
- **Defina `envelopeTimestamp: "off"`** para envelopes com poucos tokens quando o contexto de timestamp não for útil para a conversa.

Para a referência completa de comportamento, exemplos por provedor e formatação de tempo decorrido, consulte [Data e Hora](/pt-BR/date-time).

## Relacionados

- [Data e Hora](/pt-BR/date-time) — comportamento e exemplos completos de envelope/ferramenta/prompt.
- [Heartbeat](/pt-BR/gateway/heartbeat) — horários ativos usam fuso horário para agendamento.
- [Trabalhos Cron](/pt-BR/automation/cron-jobs) — expressões cron usam fuso horário para agendamento.
