---
read_when:
    - Ajustando a cadência ou as mensagens de Heartbeat
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
summary: Mensagens de polling de Heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-04-25T13:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17353a03bbae7ad564548e767099f8596764e2cf9bc3d457ec9fc3482ba7d71c
    source_path: gateway/heartbeat.md
    workflow: 15
---

> **Heartbeat ou Cron?** Consulte [Automação e tarefas](/pt-BR/automation) para orientações sobre quando usar cada um.

Heartbeat executa **interações periódicas do agente** na sessão principal para que o modelo possa
trazer à tona qualquer coisa que precise de atenção sem enviar spam para você.

Heartbeat é uma interação agendada da sessão principal — ele **não** cria registros de [tarefa em segundo plano](/pt-BR/automation/tasks).
Registros de tarefa são para trabalho desacoplado (execuções ACP, subagentes, jobs Cron isolados).

Solução de problemas: [Tarefas agendadas](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

1. Deixe Heartbeats ativados (o padrão é `30m`, ou `1h` para autenticação Anthropic OAuth/token, incluindo reutilização do Claude CLI) ou defina sua própria cadência.
2. Crie uma pequena checklist em `HEARTBEAT.md` ou um bloco `tasks:` no workspace do agente (opcional, mas recomendado).
3. Decida para onde as mensagens de Heartbeat devem ir (`target: "none"` é o padrão; defina `target: "last"` para rotear para o último contato).
4. Opcional: ative a entrega de reasoning do Heartbeat para mais transparência.
5. Opcional: use contexto leve de bootstrap se as execuções de Heartbeat precisarem apenas de `HEARTBEAT.md`.
6. Opcional: ative sessões isoladas para evitar enviar o histórico completo da conversa a cada Heartbeat.
7. Opcional: restrinja Heartbeats a horas ativas (hora local).

Exemplo de configuração:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        directPolicy: "allow", // padrão: permite alvos diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injeta apenas HEARTBEAT.md dos arquivos de bootstrap
        isolatedSession: true, // opcional: sessão nova em cada execução (sem histórico da conversa)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: envia também uma mensagem separada `Reasoning:`
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando o modo de autenticação detectado é Anthropic OAuth/token, incluindo reutilização do Claude CLI). Defina `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every`; use `0m` para desativar.
- Corpo do prompt (configurável por `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt de Heartbeat é enviado **literalmente** como a mensagem do usuário. O prompt
  de sistema inclui uma seção “Heartbeat” apenas quando Heartbeats estão ativados para o
  agente padrão e a execução está sinalizada internamente.
- Quando Heartbeats são desativados com `0m`, execuções normais também omitem `HEARTBEAT.md`
  do contexto de bootstrap para que o modelo não veja instruções exclusivas de Heartbeat.
- Horas ativas (`heartbeat.activeHours`) são verificadas no fuso horário configurado.
  Fora da janela, Heartbeats são ignorados até o próximo tick dentro da janela.

## Para que serve o prompt de Heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em segundo plano**: “Consider outstanding tasks” incentiva o agente a revisar
  acompanhamentos (caixa de entrada, calendário, lembretes, trabalho enfileirado) e trazer à tona qualquer coisa urgente.
- **Check-in humano**: “Checkup sometimes on your human during day time” incentiva uma
  mensagem ocasional e leve do tipo “precisa de algo?”, mas evita spam noturno
  usando seu fuso horário local configurado (consulte [/concepts/timezone](/pt-BR/concepts/timezone)).

Heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de Heartbeat por si só não cria um registro de tarefa.

Se você quiser que um Heartbeat faça algo muito específico (por exemplo, “verificar estatísticas do Gmail PubSub”
ou “verificar a integridade do Gateway”), defina `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) para um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Durante execuções de Heartbeat, o OpenClaw trata `HEARTBEAT_OK` como ack quando ele aparece
  no **início ou no fim** da resposta. O token é removido e a resposta é
  descartada se o conteúdo restante for **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não é tratado
  de forma especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora de Heartbeats, ocorrências soltas de `HEARTBEAT_OK` no início/fim de uma mensagem são removidas
e registradas em log; uma mensagem que seja apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // padrão: 30m (0m desativa)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entrega uma mensagem separada `Reasoning:` quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos de bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada Heartbeat em uma sessão nova (sem histórico de conversa)
        target: "last", // padrão: none | opções: last | none | <id do canal> (core ou Plugin, por exemplo "bluebubbles")
        to: "+15551234567", // substituição opcional específica do canal
        accountId: "ops-bot", // id opcional de canal com várias contas
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // número máximo de caracteres permitidos após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global de Heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se qualquer agente tiver um bloco `heartbeat`, **somente esses agentes** executam Heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com várias contas) substitui as configurações por canal.

### Heartbeats por agente

Se qualquer entrada `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes**
executarão Heartbeats. O bloco por agente é mesclado sobre `agents.defaults.heartbeat`
(assim você pode definir padrões compartilhados uma vez e substituí-los por agente).

Exemplo: dois agentes, apenas o segundo executa Heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemplo de horas ativas

Restrinja Heartbeats ao horário comercial em um fuso horário específico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa seu userTimezone se definido, caso contrário usa o fuso do host
        },
      },
    },
  },
}
```

Fora dessa janela (antes das 9h ou depois das 22h no horário do leste), Heartbeats são ignorados. O próximo tick agendado dentro da janela será executado normalmente.

### Configuração 24/7

Se você quiser que Heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` completamente (sem restrição de janela de horário; este é o comportamento padrão).
- Defina uma janela de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

Não defina `start` e `end` com o mesmo horário (por exemplo, `08:00` até `08:00`).
Isso é tratado como uma janela de largura zero, então Heartbeats serão sempre ignorados.

### Exemplo com várias contas

Use `accountId` para direcionar uma conta específica em canais com várias contas, como Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: roteia para um tópico/thread específico
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Observações sobre os campos

- `every`: intervalo de Heartbeat (string de duração; unidade padrão = minutos).
- `model`: substituição opcional de modelo para execuções de Heartbeat (`provider/model`).
- `includeReasoning`: quando ativado, também entrega a mensagem separada `Reasoning:` quando disponível (mesmo formato de `/reasoning on`).
- `lightContext`: quando true, execuções de Heartbeat usam contexto leve de bootstrap e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada Heartbeat é executado em uma sessão nova sem histórico anterior de conversa. Usa o mesmo padrão de isolamento de `sessionTarget: "isolated"` do Cron. Reduz drasticamente o custo de tokens por Heartbeat. Combine com `lightContext: true` para economia máxima. O roteamento de entrega ainda usa o contexto da sessão principal.
- `session`: chave opcional de sessão para execuções de Heartbeat.
  - `main` (padrão): sessão principal do agente.
  - Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/pt-BR/cli/sessions)).
  - Formatos de chave de sessão: consulte [Sessões](/pt-BR/concepts/session) e [Grupos](/pt-BR/channels/groups).
- `target`:
  - `last`: entrega para o último canal externo usado.
  - canal explícito: qualquer canal configurado ou id de Plugin, por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (padrão): executa o Heartbeat, mas **não entrega** externamente.
- `directPolicy`: controla o comportamento de entrega direta/DM:
  - `allow` (padrão): permite entrega direta/DM de Heartbeat.
  - `block`: suprime entrega direta/DM (`reason=dm-blocked`).
- `to`: substituição opcional de destinatário (id específico do canal, por exemplo E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: id opcional de conta para canais com várias contas. Quando `target: "last"`, o id da conta se aplica ao último canal resolvido se ele oferecer suporte a contas; caso contrário é ignorado. Se o id da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.
- `prompt`: substitui o corpo padrão do prompt (não é mesclado).
- `ackMaxChars`: número máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de Heartbeat.
- `activeHours`: restringe execuções de Heartbeat a uma janela de horário. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM, exclusivo; `24:00` é permitido para fim do dia) e `timezone` opcional.
  - Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se definido; caso contrário usa o fuso horário do sistema host.
  - `"local"`: sempre usa o fuso horário do sistema host.
  - Qualquer identificador IANA (por exemplo `America/New_York`): usado diretamente; se for inválido, faz fallback para o comportamento `"user"` acima.
  - `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
  - Fora da janela ativa, Heartbeats são ignorados até o próximo tick dentro da janela.

## Comportamento de entrega

- Heartbeats são executados na sessão principal do agente por padrão (`agent:<id>:<mainKey>`),
  ou `global` quando `session.scope = "global"`. Defina `session` para substituir por uma
  sessão específica de canal (Discord/WhatsApp/etc.).
- `session` afeta apenas o contexto da execução; a entrega é controlada por `target` e `to`.
- Para entregar a um canal/destinatário específico, defina `target` + `to`. Com
  `target: "last"`, a entrega usa o último canal externo dessa sessão.
- Entregas de Heartbeat permitem alvos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios para alvos diretos e ainda assim executar a interação de Heartbeat.
- Se a fila principal estiver ocupada, o Heartbeat será ignorado e tentado novamente depois.
- Se `target` não resolver para nenhum destino externo, a execução ainda acontece, mas nenhuma
  mensagem de saída é enviada.
- Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução será ignorada imediatamente com `reason=alerts-disabled`.
- Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda poderá executar o Heartbeat, atualizar timestamps de tarefas vencidas, restaurar o timestamp de inatividade da sessão e suprimir a carga útil de alerta enviada para fora.
- Se o alvo resolvido do Heartbeat suportar indicador de digitação, o OpenClaw exibirá digitação enquanto
  a execução do Heartbeat estiver ativa. Isso usa o mesmo alvo para o qual o Heartbeat enviaria
  a saída do chat e é desativado por `typingMode: "never"`.
- Respostas exclusivas de Heartbeat **não** mantêm a sessão ativa; o último `updatedAt`
  é restaurado para que a expiração por inatividade se comporte normalmente.
- O histórico da Control UI e do WebChat oculta prompts de Heartbeat e
  confirmações contendo apenas OK. A transcrição subjacente da sessão ainda pode conter essas
  interações para auditoria/replay.
- [Tarefas em segundo plano](/pt-BR/automation/tasks) desacopladas podem enfileirar um evento do sistema e despertar o Heartbeat quando a sessão principal precisar notar algo rapidamente. Esse despertar não faz a execução do Heartbeat se tornar uma tarefa em segundo plano.

## Controles de visibilidade

Por padrão, confirmações `HEARTBEAT_OK` são suprimidas enquanto o conteúdo de alerta é
entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Oculta HEARTBEAT_OK (padrão)
      showAlerts: true # Mostra mensagens de alerta (padrão)
      useIndicator: true # Emite eventos de indicador (padrão)
  telegram:
    heartbeat:
      showOk: true # Mostra confirmações OK no Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprime a entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões internos.

### O que cada flag faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta contendo apenas OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta diferente de OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da UI.

Se **todas as três** forem false, o OpenClaw ignora totalmente a execução do Heartbeat (sem chamada ao modelo).

### Exemplos por canal vs por conta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # todas as contas do Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suprime alertas apenas para a conta ops
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                 | Configuração                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativados) | _(nenhuma configuração necessária)_                                                     |
| Totalmente silencioso (sem mensagens, sem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| OKs em apenas um canal                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se um arquivo `HEARTBEAT.md` existir no workspace, o prompt padrão informa ao
agente para lê-lo. Pense nele como sua “checklist de Heartbeat”: pequeno, estável e
seguro para incluir a cada 30 minutos.

Em execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de Heartbeat está
ativada para o agente padrão. Desativar a cadência de Heartbeat com `0m` ou
definir `includeSystemPromptSection: false` o remove do bootstrap normal
de contexto.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e
cabeçalhos Markdown como `# Heading`), o OpenClaw ignora a execução do Heartbeat para economizar chamadas de API.
Essa omissão é relatada como `reason=empty-heartbeat-file`.
Se o arquivo estiver ausente, o Heartbeat ainda será executado e o modelo decidirá o que fazer.

Mantenha-o pequeno (checklist curta ou lembretes) para evitar inchaço do prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Checklist de Heartbeat

- Verificação rápida: há algo urgente nas caixas de entrada?
- Se for horário diurno, faça um check-in leve se não houver mais nada pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte ao Peter na próxima vez.
```

### Blocos `tasks:`

`HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para
verificações baseadas em intervalo dentro do próprio Heartbeat.

Exemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Instruções adicionais

- Mantenha os alertas curtos.
- Se nada precisar de atenção depois de todas as tarefas vencidas, responda HEARTBEAT_OK.
```

Comportamento:

- O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa em relação ao seu próprio `interval`.
- Apenas tarefas **vencidas** são incluídas no prompt de Heartbeat desse tick.
- Se nenhuma tarefa estiver vencida, o Heartbeat será totalmente ignorado (`reason=no-tasks-due`) para evitar uma chamada de modelo desperdiçada.
- Conteúdo que não seja tarefa em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas vencidas.
- Timestamps da última execução das tarefas são armazenados no estado da sessão (`heartbeatTaskState`), então os intervalos sobrevivem a reinicializações normais.
- Os timestamps das tarefas só avançam depois que uma execução de Heartbeat conclui seu caminho normal de resposta. Execuções ignoradas por `empty-heartbeat-file` / `no-tasks-due` não marcam tarefas como concluídas.

O modo de tarefa é útil quando você quer que um único arquivo de Heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada tick.

### O agente pode atualizar HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao
agente (em um chat normal) algo como:

- “Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário.”
- “Reescreva `HEARTBEAT.md` para que fique mais curto e focado em acompanhamentos da caixa de entrada.”

Se você quiser que isso aconteça de forma proativa, também pode incluir uma linha explícita no
seu prompt de Heartbeat, como: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Observação de segurança: não coloque segredos (chaves de API, números de telefone, tokens privados) em
`HEARTBEAT.md` — ele passa a fazer parte do contexto do prompt.

## Despertar manual (sob demanda)

Você pode enfileirar um evento do sistema e acionar um Heartbeat imediato com:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se vários agentes tiverem `heartbeat` configurado, um despertar manual executará imediatamente os
Heartbeats de cada um desses agentes.

Use `--mode next-heartbeat` para esperar até o próximo tick agendado.

## Entrega de reasoning (opcional)

Por padrão, Heartbeats entregam apenas a carga útil final de “resposta”.

Se você quiser transparência, ative:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando ativado, Heartbeats também entregarão uma mensagem separada prefixada com
`Reasoning:` (mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente
está gerenciando várias sessões/codexes e você quer ver por que ele decidiu chamar sua atenção
— mas também pode expor mais detalhes internos do que você deseja. Prefira manter isso
desativado em chats em grupo.

## Atenção ao custo

Heartbeats executam interações completas do agente. Intervalos menores consomem mais tokens. Para reduzir custo:

- Use `isolatedSession: true` para evitar enviar o histórico completo da conversa (~100 mil tokens para ~2-5 mil por execução).
- Use `lightContext: true` para limitar os arquivos de bootstrap a apenas `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se você quiser apenas atualizações de estado internas.

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um só lugar
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como o trabalho desacoplado é rastreado
- [Fuso horário](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento de Heartbeat
- [Solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
