---
read_when:
    - Ao ajustar a cadência ou as mensagens de heartbeat
    - Ao decidir entre heartbeat e cron para tarefas agendadas
summary: Mensagens de polling de heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-04-08T02:15:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8021d747637060eacb91ec5f75904368a08790c19f4fca32acda8c8c0a25e41
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat ou Cron?** Consulte [Automação e tarefas](/pt-BR/automation) para orientações sobre quando usar cada um.

O heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa
destacar qualquer coisa que precise de atenção sem enviar spam para você.

O heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefas em segundo plano](/pt-BR/automation/tasks).
Os registros de tarefa são para trabalho desacoplado (execuções ACP, subagentes, trabalhos cron isolados).

Solução de problemas: [Tarefas agendadas](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

1. Deixe os heartbeats habilitados (o padrão é `30m`, ou `1h` para autenticação Anthropic OAuth/token, incluindo reutilização do Claude CLI) ou defina sua própria cadência.
2. Crie uma pequena checklist em `HEARTBEAT.md` ou um bloco `tasks:` no workspace do agente (opcional, mas recomendado).
3. Decida para onde as mensagens de heartbeat devem ir (`target: "none"` é o padrão; defina `target: "last"` para encaminhar ao último contato).
4. Opcional: habilite a entrega de raciocínio do heartbeat para transparência.
5. Opcional: use contexto de bootstrap leve se as execuções de heartbeat precisarem apenas de `HEARTBEAT.md`.
6. Opcional: habilite sessões isoladas para evitar o envio de todo o histórico da conversa a cada heartbeat.
7. Opcional: restrinja heartbeats a horários ativos (hora local).

Exemplo de configuração:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        directPolicy: "allow", // padrão: permitir destinos diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injetar apenas HEARTBEAT.md dos arquivos de bootstrap
        isolatedSession: true, // opcional: nova sessão em cada execução (sem histórico da conversa)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: enviar também uma mensagem separada `Reasoning:`
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando o modo de autenticação detectado é Anthropic OAuth/token, incluindo reutilização do Claude CLI). Defina `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` por agente; use `0m` para desabilitar.
- Corpo do prompt (configurável via `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt de heartbeat é enviado **literalmente** como mensagem do usuário. O prompt do
  sistema inclui uma seção “Heartbeat” apenas quando os heartbeats estão habilitados para o
  agente padrão e a execução é marcada internamente.
- Quando os heartbeats são desabilitados com `0m`, execuções normais também omitem `HEARTBEAT.md`
  do contexto de bootstrap para que o modelo não veja instruções exclusivas de heartbeat.
- Os horários ativos (`heartbeat.activeHours`) são verificados no fuso horário configurado.
  Fora da janela, os heartbeats são ignorados até o próximo tick dentro da janela.

## Para que serve o prompt de heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em segundo plano**: “Consider outstanding tasks” incentiva o agente a revisar
  acompanhamentos pendentes (caixa de entrada, calendário, lembretes, trabalho enfileirado) e destacar qualquer coisa urgente.
- **Check-in humano**: “Checkup sometimes on your human during day time” incentiva uma
  mensagem ocasional e leve do tipo “precisa de algo?”, mas evita spam noturno
  usando seu fuso horário local configurado (consulte [/concepts/timezone](/pt-BR/concepts/timezone)).

O heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de heartbeat por si só não cria um registro de tarefa.

Se você quiser que um heartbeat faça algo muito específico (por exemplo, “verificar estatísticas do Gmail PubSub”
ou “verificar a integridade do gateway”), defina `agents.defaults.heartbeat.prompt` (ou
`agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Durante execuções de heartbeat, o OpenClaw trata `HEARTBEAT_OK` como um ack quando ele aparece
  no **início ou no fim** da resposta. O token é removido e a resposta é
  descartada se o conteúdo restante for **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não é tratado
  de forma especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora dos heartbeats, um `HEARTBEAT_OK` perdido no início/fim de uma mensagem é removido
e registrado em log; uma mensagem que seja apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // padrão: 30m (0m desabilita)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entrega mensagem separada `Reasoning:` quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos de bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma nova sessão (sem histórico da conversa)
        target: "last", // padrão: none | opções: last | none | <id do canal> (core ou plugin, por exemplo "bluebubbles")
        to: "+15551234567", // substituição específica do canal, opcional
        accountId: "ops-bot", // id de canal com várias contas, opcional
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // máximo de caracteres permitido após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global de heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se qualquer agente tiver um bloco `heartbeat`, **apenas esses agentes** executarão heartbeats.
- `channels.defaults.heartbeat` define os padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com várias contas) substitui as configurações por canal.

### Heartbeats por agente

Se qualquer entrada em `agents.list[]` incluir um bloco `heartbeat`, **apenas esses agentes**
executarão heartbeats. O bloco por agente é mesclado sobre `agents.defaults.heartbeat`
(assim você pode definir padrões compartilhados uma vez e substituí-los por agente).

Exemplo: dois agentes, apenas o segundo executa heartbeats.

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
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Exemplo de horários ativos

Restrinja os heartbeats ao horário comercial em um fuso horário específico:

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
          timezone: "America/New_York", // opcional; usa seu userTimezone se definido, caso contrário o fuso do host
        },
      },
    },
  },
}
```

Fora dessa janela (antes das 9h ou depois das 22h no horário do leste dos EUA), os heartbeats são ignorados. O próximo tick agendado dentro da janela será executado normalmente.

### Configuração 24/7

Se você quiser que os heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` por completo (sem restrição de janela de tempo; este é o comportamento padrão).
- Defina uma janela de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

Não defina os mesmos horários para `start` e `end` (por exemplo `08:00` a `08:00`).
Isso é tratado como uma janela de largura zero, então os heartbeats são sempre ignorados.

### Exemplo com várias contas

Use `accountId` para direcionar uma conta específica em canais com várias contas, como o Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // opcional: encaminhar para um tópico/thread específico
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

### Notas dos campos

- `every`: intervalo do heartbeat (string de duração; unidade padrão = minutos).
- `model`: substituição opcional do modelo para execuções de heartbeat (`provider/model`).
- `includeReasoning`: quando habilitado, também entrega a mensagem separada `Reasoning:` quando disponível (mesmo formato de `/reasoning on`).
- `lightContext`: quando true, execuções de heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
- `isolatedSession`: quando true, cada heartbeat é executado em uma nova sessão, sem histórico anterior da conversa. Usa o mesmo padrão de isolamento que cron `sessionTarget: "isolated"`. Reduz drasticamente o custo de tokens por heartbeat. Combine com `lightContext: true` para máxima economia. O roteamento de entrega ainda usa o contexto da sessão principal.
- `session`: chave de sessão opcional para execuções de heartbeat.
  - `main` (padrão): sessão principal do agente.
  - Chave de sessão explícita (copie de `openclaw sessions --json` ou do [CLI de sessões](/cli/sessions)).
  - Formatos de chave de sessão: consulte [Sessões](/pt-BR/concepts/session) e [Grupos](/pt-BR/channels/groups).
- `target`:
  - `last`: entrega ao último canal externo usado.
  - canal explícito: qualquer canal configurado ou id de plugin, por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`.
  - `none` (padrão): executa o heartbeat, mas **não entrega** externamente.
- `directPolicy`: controla o comportamento de entrega direta/DM:
  - `allow` (padrão): permite entrega direta/DM de heartbeat.
  - `block`: suprime entrega direta/DM (`reason=dm-blocked`).
- `to`: substituição opcional do destinatário (id específico do canal, por exemplo E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
- `accountId`: id de conta opcional para canais com várias contas. Quando `target: "last"`, o id de conta se aplica ao último canal resolvido se ele oferecer suporte a contas; caso contrário, é ignorado. Se o id de conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.
- `prompt`: substitui o corpo do prompt padrão (não é mesclado).
- `ackMaxChars`: máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.
- `suppressToolErrorWarnings`: quando true, suprime payloads de aviso de erro de ferramenta durante execuções de heartbeat.
- `activeHours`: restringe execuções de heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM exclusivo; `24:00` permitido para fim do dia) e `timezone` opcional.
  - Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se definido; caso contrário, recorre ao fuso horário do sistema host.
  - `"local"`: sempre usa o fuso horário do sistema host.
  - Qualquer identificador IANA (por exemplo `America/New_York`): usado diretamente; se for inválido, recorre ao comportamento `"user"` acima.
  - `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
  - Fora da janela ativa, os heartbeats são ignorados até o próximo tick dentro da janela.

## Comportamento de entrega

- Os heartbeats são executados na sessão principal do agente por padrão (`agent:<id>:<mainKey>`),
  ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma
  sessão de canal específica (Discord/WhatsApp/etc.).
- `session` afeta apenas o contexto da execução; a entrega é controlada por `target` e `to`.
- Para entregar a um canal/destinatário específico, defina `target` + `to`. Com
  `target: "last"`, a entrega usa o último canal externo dessa sessão.
- As entregas de heartbeat permitem destinos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios a destinos diretos, mantendo a execução do turno de heartbeat.
- Se a fila principal estiver ocupada, o heartbeat será ignorado e tentado novamente mais tarde.
- Se `target` não resolver para nenhum destino externo, a execução ainda acontece, mas nenhuma
  mensagem de saída é enviada.
- Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desabilitados, a execução será ignorada antecipadamente como `reason=alerts-disabled`.
- Se apenas a entrega de alertas estiver desabilitada, o OpenClaw ainda pode executar o heartbeat, atualizar timestamps de tarefas vencidas, restaurar o timestamp ocioso da sessão e suprimir o payload externo do alerta.
- Respostas exclusivas de heartbeat **não** mantêm a sessão ativa; o último `updatedAt`
  é restaurado para que a expiração por inatividade se comporte normalmente.
- [Tarefas em segundo plano](/pt-BR/automation/tasks) desacopladas podem enfileirar um evento do sistema e acordar o heartbeat quando a sessão principal precisar perceber algo rapidamente. Esse despertar não faz da execução de heartbeat uma tarefa em segundo plano.

## Controles de visibilidade

Por padrão, os acks `HEARTBEAT_OK` são suprimidos, enquanto o conteúdo de alerta é
entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (padrão)
      showAlerts: true # Mostrar mensagens de alerta (padrão)
      useIndicator: true # Emitir eventos de indicador (padrão)
  telegram:
    heartbeat:
      showOk: true # Mostrar confirmações OK no Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprimir entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões internos.

### O que cada flag faz

- `showOk`: envia um ack `HEARTBEAT_OK` quando o modelo retorna uma resposta somente com OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta diferente de OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da UI.

Se **todos os três** forem false, o OpenClaw ignora completamente a execução de heartbeat (sem chamada ao modelo).

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
          showAlerts: false # suprimir alertas apenas para a conta ops
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                  | Configuração                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativados) | _(nenhuma configuração necessária)_                                                       |
| Totalmente silencioso (sem mensagens, sem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Apenas indicador (sem mensagens)          | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs apenas em um canal                    | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (opcional)

Se um arquivo `HEARTBEAT.md` existir no workspace, o prompt padrão diz ao
agente para lê-lo. Pense nele como sua “checklist de heartbeat”: pequena, estável e
segura para incluir a cada 30 minutos.

Em execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de heartbeat está
habilitada para o agente padrão. Desabilitar a cadência de heartbeat com `0m` ou
definir `includeSystemPromptSection: false` o omite do contexto normal de bootstrap.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos
Markdown como `# Heading`), o OpenClaw ignora a execução de heartbeat para economizar chamadas de API.
Essa ignorada é relatada como `reason=empty-heartbeat-file`.
Se o arquivo estiver ausente, o heartbeat ainda é executado e o modelo decide o que fazer.

Mantenha-o pequeno (checklist curta ou lembretes) para evitar inchaço do prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Checklist de heartbeat

- Verificação rápida: há algo urgente nas caixas de entrada?
- Se for durante o dia, faça um check-in leve se nada mais estiver pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte ao Peter na próxima vez.
```

### Blocos `tasks:`

`HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para verificações baseadas em intervalo
dentro do próprio heartbeat.

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
- Se nada precisar de atenção após todas as tarefas vencidas, responda HEARTBEAT_OK.
```

Comportamento:

- O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa em relação ao seu próprio `interval`.
- Apenas tarefas **vencidas** são incluídas no prompt de heartbeat daquele tick.
- Se nenhuma tarefa estiver vencida, o heartbeat será totalmente ignorado (`reason=no-tasks-due`) para evitar uma chamada desperdiçada ao modelo.
- O conteúdo que não pertence a tarefas em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas vencidas.
- Os timestamps da última execução da tarefa são armazenados no estado da sessão (`heartbeatTaskState`), de modo que os intervalos sobrevivem a reinicializações normais.
- Os timestamps das tarefas só avançam depois que uma execução de heartbeat conclui seu caminho normal de resposta. Execuções ignoradas por `empty-heartbeat-file` / `no-tasks-due` não marcam tarefas como concluídas.

O modo de tarefas é útil quando você quer que um único arquivo de heartbeat mantenha várias verificações periódicas sem pagar por todas elas a cada tick.

### O agente pode atualizar `HEARTBEAT.md`?

Sim — se você pedir a ele.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao
agente (em um chat normal) algo como:

- “Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário.”
- “Reescreva `HEARTBEAT.md` para que fique mais curto e focado em acompanhamentos da caixa de entrada.”

Se você quiser que isso aconteça de forma proativa, também pode incluir uma linha explícita no
seu prompt de heartbeat como: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

Observação de segurança: não coloque segredos (chaves de API, números de telefone, tokens privados) em
`HEARTBEAT.md` — ele se torna parte do contexto do prompt.

## Despertar manual (sob demanda)

Você pode enfileirar um evento do sistema e acionar um heartbeat imediato com:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se vários agentes tiverem `heartbeat` configurado, um despertar manual executará imediatamente os heartbeats de cada um desses agentes.

Use `--mode next-heartbeat` para aguardar o próximo tick agendado.

## Entrega de raciocínio (opcional)

Por padrão, os heartbeats entregam apenas o payload final da “resposta”.

Se você quiser transparência, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando habilitado, os heartbeats também entregarão uma mensagem separada com o prefixo
`Reasoning:` (mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente
está gerenciando várias sessões/codexes e você quer ver por que ele decidiu
notificar você — mas isso também pode expor mais detalhes internos do que você deseja. Prefira mantê-lo
desativado em chats em grupo.

## Atenção ao custo

Os heartbeats executam turnos completos do agente. Intervalos menores consomem mais tokens. Para reduzir o custo:

- Use `isolatedSession: true` para evitar enviar todo o histórico da conversa (~100K tokens para ~2-5K por execução).
- Use `lightContext: true` para limitar os arquivos de bootstrap a apenas `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se quiser apenas atualizações internas de estado.

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um só lugar
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como o trabalho desacoplado é rastreado
- [Fuso horário](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento de heartbeats
- [Solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
