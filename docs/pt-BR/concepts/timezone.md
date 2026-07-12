---
read_when:
    - Você quer um modelo mental rápido para lidar com fusos horários
    - Você está decidindo onde definir ou substituir um fuso horário
summary: Onde os fusos horários aparecem no OpenClaw — envelopes, payloads de ferramentas e prompt do sistema
title: Fusos horários
x-i18n:
    generated_at: "2026-07-11T23:53:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

O OpenClaw padroniza os carimbos de data/hora para que o modelo veja um **único horário de referência**, em vez de uma combinação de relógios locais dos provedores. Três superfícies exibem fusos horários, cada uma com sua própria finalidade:

## Três superfícies de fuso horário

| Superfície                  | O que exibe                                                                                                                    | Padrão                                                | Configurada por                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------ |
| Envelopes de mensagens      | Envolve mensagens recebidas dos canais: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                     | Horário local do host                                 | `agents.defaults.envelopeTimezone`                     |
| Cargas úteis de ferramentas | Ferramentas de canal do tipo `readMessages` retornam o horário bruto do provedor e `timestampMs` / `timestampUtc` normalizados | Campos UTC sempre presentes                           | Não configurável; preserva os carimbos nativos do provedor |
| Prompt do sistema           | Um pequeno bloco `Data e hora atuais` somente com o **fuso horário** (sem o valor do relógio, para estabilidade do cache)       | Fuso horário do host se `userTimezone` não estiver definido | `agents.defaults.userTimezone`                         |

O prompt do sistema omite deliberadamente o relógio em tempo real para manter o cache de prompts estável entre os turnos. Quando o agente precisa do horário atual, ele chama `session_status`.

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

Se `userTimezone` não estiver definido, o OpenClaw resolve o fuso horário do host em tempo de execução por meio de `Intl.DateTimeFormat().resolvedOptions().timeZone` (sem gravar na configuração). `agents.defaults.timeFormat` (`auto` | `12` | `24`) controla a renderização em formato de 12/24 horas nos envelopes e nas superfícies subsequentes, mas não na seção do prompt do sistema.

## Valores de fuso horário do envelope

`agents.defaults.envelopeTimezone` aceita:

- `"local"` (padrão) ou `"host"` — fuso horário da máquina host.
- `"utc"` ou `"gmt"` — UTC.
- `"user"` — o `agents.defaults.userTimezone` resolvido (usa o fuso horário do host como alternativa se não estiver definido).
- Qualquer identificador explícito de fuso horário da IANA, por exemplo, `"Europe/Vienna"`.

## Quando substituir

- **Use `"utc"`** para obter carimbos de data/hora consistentes entre hosts em regiões diferentes ou para corresponder à saída de diagnósticos e logs alinhada ao UTC.
- **Use `"user"`** para manter os envelopes alinhados ao fuso horário configurado para o usuário, independentemente do fuso em que o host do Gateway esteja sendo executado.
- **Use um fuso horário fixo da IANA** quando o host do Gateway estiver em um fuso, mas o envelope sempre precisar exibir outro, independentemente da migração do host.
- **Defina `envelopeTimestamp: "off"`** quando o contexto de data e hora não for útil para a conversa. Isso remove os carimbos absolutos dos envelopes, dos prefixos de prompt enviados diretamente ao agente e dos prefixos incorporados à entrada do modelo.

Para consultar a referência completa de comportamento, exemplos por provedor e a formatação do tempo decorrido, consulte [Data e hora](/pt-BR/date-time).

## Relacionados

- [Data e hora](/pt-BR/date-time) — comportamento completo e exemplos de envelopes, ferramentas e prompts.
- [Heartbeat](/pt-BR/gateway/heartbeat) — os horários de atividade usam o fuso horário para o agendamento.
- [Tarefas Cron](/pt-BR/automation/cron-jobs) — as expressões cron usam o fuso horário para o agendamento.
