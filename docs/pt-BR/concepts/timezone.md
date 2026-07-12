---
read_when:
    - Você quer um modelo mental rápido para lidar com fusos horários
    - Você está decidindo onde definir ou substituir um fuso horário
summary: Onde os fusos horários aparecem no OpenClaw — envelopes, payloads de ferramentas, prompt do sistema
title: Fusos horários
x-i18n:
    generated_at: "2026-07-12T15:07:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

O OpenClaw padroniza os carimbos de data e hora para que o modelo veja um **único horário de referência**, em vez de uma combinação de relógios locais dos provedores. Três superfícies exibem fusos horários, cada uma com sua própria finalidade:

## Três superfícies de fuso horário

| Superfície                  | O que exibe                                                                                                                               | Padrão                                                 | Configurada por                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| Envelopes de mensagens      | Envolvem mensagens recebidas dos canais: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                               | Fuso local do host                                     | `agents.defaults.envelopeTimezone`                      |
| Payloads de ferramentas     | Ferramentas de canal do tipo `readMessages` retornam o horário bruto do provedor, além de `timestampMs` / `timestampUtc` normalizados      | Campos UTC sempre presentes                            | Não configurável; preserva os carimbos de data e hora nativos do provedor |
| Prompt do sistema           | Um pequeno bloco `Current Date & Time` contendo **apenas o fuso horário** (sem o valor do relógio, para manter a estabilidade do cache)   | Fuso horário do host se `userTimezone` não estiver definido | `agents.defaults.userTimezone`                          |

O prompt do sistema omite deliberadamente o horário atual para manter o cache de prompts estável entre os turnos. Quando o agente precisa do horário atual, ele chama `session_status`.

## Configuração do fuso horário do usuário

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Se `userTimezone` não estiver definido, o OpenClaw resolve o fuso horário do host em tempo de execução por meio de `Intl.DateTimeFormat().resolvedOptions().timeZone` (sem gravar na configuração). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla a renderização em formato de 12h/24h nos envelopes e nas superfícies subsequentes, mas não na seção do prompt do sistema.

## Valores de fuso horário do envelope

`agents.defaults.envelopeTimezone` aceita:

- `"local"` (padrão) ou `"host"` - o fuso horário da máquina host.
- `"utc"` ou `"gmt"` - UTC.
- `"user"` - o `agents.defaults.userTimezone` resolvido (usa o fuso horário do host como alternativa se não estiver definido).
- Qualquer string explícita de zona IANA, por exemplo, `"Europe/Vienna"`.

## Quando substituir

- **Use `"utc"`** para obter carimbos de data e hora consistentes entre hosts em regiões diferentes ou para corresponder à saída de diagnóstico/logs alinhada ao UTC.
- **Use `"user"`** para manter os envelopes alinhados ao fuso horário configurado do usuário, independentemente da zona em que o host do Gateway opera.
- **Use uma zona IANA fixa** quando o host do Gateway estiver em uma zona, mas o envelope sempre precisar exibir outra zona, independentemente da migração do host.
- **Defina `envelopeTimestamp: "off"`** quando o contexto de data e hora não for útil para a conversa. Isso remove os carimbos de data e hora absolutos dos envelopes, dos prefixos diretos do prompt do agente e dos prefixos incorporados à entrada do modelo.

Para consultar a referência completa de comportamento, exemplos por provedor e a formatação do tempo decorrido, consulte [Data e hora](/pt-BR/date-time).

## Relacionados

- [Data e hora](/pt-BR/date-time) - comportamento completo e exemplos de envelopes, ferramentas e prompts.
- [Heartbeat](/pt-BR/gateway/heartbeat) - os horários ativos usam o fuso horário para agendamento.
- [Tarefas Cron](/pt-BR/automation/cron-jobs) - as expressões cron usam o fuso horário para agendamento.
