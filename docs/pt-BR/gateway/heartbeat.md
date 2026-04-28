---
read_when:
    - Ajustando a cadência ou as mensagens de Heartbeat
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Heartbeat
summary: Mensagens de polling de Heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-04-26T11:28:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0d3e9c531062d90e8e24cb7795fed20bc0985c3eadc8ed367295fc2544d14e
    source_path: gateway/heartbeat.md
    workflow: 15
---

<Note>
**Heartbeat ou Cron?** Consulte [Automação e tarefas](/pt-BR/automation) para orientações sobre quando usar cada um.
</Note>

Heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa destacar qualquer coisa que precise de atenção sem enviar spam para você.

Heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefa em segundo plano](/pt-BR/automation/tasks). Registros de tarefa são para trabalho desacoplado (execuções ACP, subagentes, trabalhos Cron isolados).

Solução de problemas: [Tarefas agendadas](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

<Steps>
  <Step title="Escolha uma cadência">
    Mantenha Heartbeat ativado (o padrão é `30m`, ou `1h` para autenticação OAuth/token da Anthropic, incluindo reutilização do Claude CLI) ou defina sua própria cadência.
  </Step>
  <Step title="Adicione HEARTBEAT.md (opcional)">
    Crie uma pequena checklist `HEARTBEAT.md` ou bloco `tasks:` no workspace do agente.
  </Step>
  <Step title="Decida para onde as mensagens de Heartbeat devem ir">
    `target: "none"` é o padrão; defina `target: "last"` para rotear para o último contato.
  </Step>
  <Step title="Ajuste opcional">
    - Ative a entrega de raciocínio do Heartbeat para transparência.
    - Use contexto de bootstrap leve se as execuções de Heartbeat precisarem apenas de `HEARTBEAT.md`.
    - Ative sessões isoladas para evitar enviar o histórico completo da conversa a cada Heartbeat.
    - Restrinja Heartbeats ao horário ativo (hora local).
  </Step>
</Steps>

Exemplo de configuração:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        directPolicy: "allow", // padrão: permite destinos diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injeta apenas HEARTBEAT.md dos arquivos de bootstrap
        isolatedSession: true, // opcional: sessão nova a cada execução (sem histórico de conversa)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: envia também uma mensagem separada `Reasoning:`
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando autenticação OAuth/token da Anthropic é o modo de autenticação detectado, incluindo reutilização do Claude CLI). Defina `agents.defaults.heartbeat.every` ou por agente em `agents.list[].heartbeat.every`; use `0m` para desativar.
- Corpo do prompt (configurável via `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt de Heartbeat é enviado **literalmente** como mensagem do usuário. O prompt de sistema inclui uma seção "Heartbeat" apenas quando Heartbeats estão ativados para o agente padrão, e a execução está marcada internamente.
- Quando Heartbeats são desativados com `0m`, execuções normais também omitem `HEARTBEAT.md` do contexto de bootstrap para que o modelo não veja instruções exclusivas de Heartbeat.
- Horário ativo (`heartbeat.activeHours`) é verificado no fuso horário configurado. Fora da janela, Heartbeats são ignorados até o próximo tick dentro da janela.

## Para que serve o prompt de Heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em segundo plano**: "Consider outstanding tasks" orienta o agente a revisar acompanhamentos (caixa de entrada, calendário, lembretes, trabalho em fila) e destacar qualquer coisa urgente.
- **Check-in humano**: "Checkup sometimes on your human during day time" orienta uma mensagem ocasional e leve do tipo "precisa de alguma coisa?", mas evita spam noturno usando o fuso horário local configurado (consulte [Fuso horário](/pt-BR/concepts/timezone)).

Heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de Heartbeat em si não cria um registro de tarefa.

Se você quiser que um Heartbeat faça algo muito específico (por exemplo, "check Gmail PubSub stats" ou "verify gateway health"), defina `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Durante execuções de Heartbeat, o OpenClaw trata `HEARTBEAT_OK` como um ack quando ele aparece no **início ou no fim** da resposta. O token é removido e a resposta é descartada se o conteúdo restante tiver **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não recebe tratamento especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora de Heartbeats, `HEARTBEAT_OK` solto no início/fim de uma mensagem é removido e registrado em log; uma mensagem que seja apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // padrão: 30m (0m desativa)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entrega mensagem separada `Reasoning:` quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md dos arquivos de bootstrap do workspace
        isolatedSession: false, // padrão: false; true executa cada Heartbeat em uma sessão nova (sem histórico de conversa)
        target: "last", // padrão: none | opções: last | none | <id do canal> (core ou plugin, por exemplo "bluebubbles")
        to: "+15551234567", // substituição opcional específica do canal
        accountId: "ops-bot", // id opcional do canal com múltiplas contas
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // máximo de caracteres permitidos após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global de Heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se qualquer agente tiver um bloco `heartbeat`, **somente esses agentes** executarão Heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com múltiplas contas) substitui configurações por canal.

### Heartbeats por agente

Se qualquer entrada em `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes** executarão Heartbeats. O bloco por agente é mesclado por cima de `agents.defaults.heartbeat` (assim você pode definir padrões compartilhados uma vez e substituir por agente).

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

### Exemplo de horário ativo

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

Fora dessa janela (antes das 9h ou depois das 22h no horário do leste dos EUA), Heartbeats são ignorados. O próximo tick agendado dentro da janela será executado normalmente.

### Configuração 24/7

Se você quiser que Heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` completamente (sem restrição de janela de tempo; este é o comportamento padrão).
- Defina uma janela de dia completo: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Não defina `start` e `end` com o mesmo horário (por exemplo, `08:00` a `08:00`). Isso é tratado como uma janela de largura zero, então Heartbeats sempre serão ignorados.
</Warning>

### Exemplo com múltiplas contas

Use `accountId` para direcionar uma conta específica em canais com múltiplas contas, como Telegram:

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

### Observações sobre campos

<ParamField path="every" type="string">
  Intervalo de Heartbeat (string de duração; unidade padrão = minutos).
</ParamField>
<ParamField path="model" type="string">
  Substituição opcional de modelo para execuções de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando ativado, também entrega a mensagem separada `Reasoning:` quando disponível (mesmo formato de `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando true, execuções de Heartbeat usam contexto de bootstrap leve e mantêm apenas `HEARTBEAT.md` dos arquivos de bootstrap do workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando true, cada Heartbeat é executado em uma sessão nova sem histórico de conversa anterior. Usa o mesmo padrão de isolamento de Cron `sessionTarget: "isolated"`. Reduz drasticamente o custo de tokens por Heartbeat. Combine com `lightContext: true` para economia máxima. O roteamento de entrega ainda usa o contexto da sessão principal.
</ParamField>
<ParamField path="session" type="string">
  Chave de sessão opcional para execuções de Heartbeat.

- `main` (padrão): sessão principal do agente.
- Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/pt-BR/cli/sessions)).
- Formatos de chave de sessão: consulte [Sessões](/pt-BR/concepts/session) e [Grupos](/pt-BR/channels/groups).
</ParamField>
  <ParamField path="target" type="string">
- `last`: entrega ao último canal externo usado.
- canal explícito: qualquer canal configurado ou id de plugin, por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (padrão): executa o Heartbeat, mas **não entrega** externamente.
  </ParamField>
  <ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla o comportamento de entrega direta/DM. `allow`: permite entrega direta/DM de Heartbeat. `block`: suprime entrega direta/DM (`reason=dm-blocked`).
  </ParamField>
  <ParamField path="to" type="string">
  Substituição opcional de destinatário (id específico do canal, por exemplo E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.
  </ParamField>
  <ParamField path="accountId" type="string">
  Id de conta opcional para canais com múltiplas contas. Quando `target: "last"`, o id da conta se aplica ao último canal resolvido se ele oferecer suporte a contas; caso contrário, é ignorado. Se o id da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.
  </ParamField>
  <ParamField path="prompt" type="string">
  Substitui o corpo padrão do prompt (não é mesclado).
  </ParamField>
  <ParamField path="ackMaxChars" type="number" default="300">
  Máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.
  </ParamField>
  <ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando true, suprime cargas de aviso de erro de ferramenta durante execuções de Heartbeat.
  </ParamField>
  <ParamField path="activeHours" type="object">
  Restringe execuções de Heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM exclusivo; `24:00` é permitido para fim do dia) e `timezone` opcional.

- Omitido ou `"user"`: usa `agents.defaults.userTimezone` se estiver definido; caso contrário, usa como fallback o fuso horário do sistema host.
- `"local"`: sempre usa o fuso horário do sistema host.
- Qualquer identificador IANA (por exemplo `America/New_York`): usado diretamente; se for inválido, usa como fallback o comportamento `"user"` acima.
- `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
- Fora da janela ativa, Heartbeats são ignorados até o próximo tick dentro da janela.
  </ParamField>

## Comportamento de entrega

<AccordionGroup>
  <Accordion title="Roteamento de sessão e destino">
    - Heartbeats são executados por padrão na sessão principal do agente (`agent:<id>:<mainKey>`), ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma sessão específica de canal (Discord/WhatsApp/etc.).
    - `session` afeta apenas o contexto de execução; a entrega é controlada por `target` e `to`.
    - Para entregar a um canal/destinatário específico, defina `target` + `to`. Com `target: "last"`, a entrega usa o último canal externo dessa sessão.
    - Entregas de Heartbeat permitem destinos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios para destino direto, mantendo ainda assim o turno de Heartbeat em execução.
    - Se a fila principal estiver ocupada, o Heartbeat será ignorado e tentado novamente mais tarde.
    - Se `target` for resolvido sem destino externo, a execução ainda acontece, mas nenhuma mensagem de saída é enviada.
  </Accordion>
  <Accordion title="Visibilidade e comportamento de ignorar">
    - Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução será ignorada logo de início como `reason=alerts-disabled`.
    - Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda poderá executar o Heartbeat, atualizar timestamps de tarefas vencidas, restaurar o timestamp de inatividade da sessão e suprimir a carga de alerta externa.
    - Se o destino de Heartbeat resolvido oferecer suporte a digitação, o OpenClaw mostrará digitação enquanto a execução do Heartbeat estiver ativa. Isso usa o mesmo destino para o qual o Heartbeat enviaria a saída de chat, e é desativado por `typingMode: "never"`.
  </Accordion>
  <Accordion title="Ciclo de vida da sessão e auditoria">
    - Respostas somente de Heartbeat **não** mantêm a sessão ativa. Metadados de Heartbeat podem atualizar a linha da sessão, mas a expiração por inatividade usa `lastInteractionAt` da última mensagem real de usuário/canal, e a expiração diária usa `sessionStartedAt`.
    - O histórico da Control UI e do WebChat oculta prompts de Heartbeat e confirmações apenas com OK. A transcrição subjacente da sessão ainda pode conter esses turnos para auditoria/replay.
    - [Tarefas em segundo plano](/pt-BR/automation/tasks) desacopladas podem enfileirar um evento de sistema e ativar o Heartbeat quando a sessão principal precisar notar algo rapidamente. Essa ativação não transforma a execução do Heartbeat em uma tarefa em segundo plano.
  </Accordion>
</AccordionGroup>

## Controles de visibilidade

Por padrão, confirmações `HEARTBEAT_OK` são suprimidas enquanto o conteúdo de alerta é entregue. Você pode ajustar isso por canal ou por conta:

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
          showAlerts: false # Suprime entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões embutidos.

### O que cada flag faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta somente OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta não-OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da UI.

Se **todos os três** forem false, o OpenClaw ignora totalmente a execução do Heartbeat (sem chamada ao modelo).

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

| Objetivo                                  | Configuração                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativados) | _(nenhuma configuração necessária)_                                                      |
| Totalmente silencioso (sem mensagens, sem indicador)     | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)                        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs em apenas um canal                                   | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se existir um arquivo `HEARTBEAT.md` no workspace, o prompt padrão orienta o agente a lê-lo. Pense nele como sua "checklist de Heartbeat": pequena, estável e segura para incluir a cada 30 minutos.

Em execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de Heartbeat está ativada para o agente padrão. Desativar a cadência de Heartbeat com `0m` ou definir `includeSystemPromptSection: false` o omite do contexto normal de bootstrap.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (somente linhas em branco e cabeçalhos Markdown como `# Heading`), o OpenClaw ignora a execução do Heartbeat para economizar chamadas de API. Essa ignorada é relatada como `reason=empty-heartbeat-file`. Se o arquivo estiver ausente, o Heartbeat ainda será executado e o modelo decidirá o que fazer.

Mantenha-o pequeno (checklist curta ou lembretes) para evitar inchaço do prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Checklist de Heartbeat

- Verificação rápida: há algo urgente nas caixas de entrada?
- Se for de dia, faça um check-in leve se nada mais estiver pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte ao Peter na próxima vez.
```

### Blocos `tasks:`

`HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para verificações baseadas em intervalo dentro do próprio Heartbeat.

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

<AccordionGroup>
  <Accordion title="Comportamento">
    - O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa em relação ao próprio `interval`.
    - Somente tarefas **vencidas** são incluídas no prompt de Heartbeat daquele tick.
    - Se nenhuma tarefa estiver vencida, o Heartbeat será totalmente ignorado (`reason=no-tasks-due`) para evitar uma chamada inútil ao modelo.
    - Conteúdo não relacionado a tarefas em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas vencidas.
    - Timestamps da última execução da tarefa são armazenados no estado da sessão (`heartbeatTaskState`), então os intervalos sobrevivem a reinicializações normais.
    - Timestamps de tarefa só são avançados depois que uma execução de Heartbeat conclui seu caminho normal de resposta. Execuções ignoradas `empty-heartbeat-file` / `no-tasks-due` não marcam tarefas como concluídas.
  </Accordion>
</AccordionGroup>

O modo de tarefa é útil quando você quer que um único arquivo de Heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada tick.

### O agente pode atualizar HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao agente (em um chat normal) algo como:

- "Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário."
- "Reescreva `HEARTBEAT.md` para que fique mais curto e focado em acompanhamentos da caixa de entrada."

Se você quiser que isso aconteça proativamente, também pode incluir uma linha explícita no prompt de Heartbeat como: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Não coloque segredos (chaves de API, números de telefone, tokens privados) em `HEARTBEAT.md` — ele passa a fazer parte do contexto do prompt.
</Warning>

## Ativação manual (sob demanda)

Você pode enfileirar um evento de sistema e acionar um Heartbeat imediato com:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se vários agentes tiverem `heartbeat` configurado, uma ativação manual executará imediatamente os Heartbeats de cada um desses agentes.

Use `--mode next-heartbeat` para esperar pelo próximo tick agendado.

## Entrega de raciocínio (opcional)

Por padrão, Heartbeats entregam apenas a carga final de "resposta".

Se você quiser transparência, ative:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando ativado, Heartbeats também entregarão uma mensagem separada prefixada com `Reasoning:` (mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente está gerenciando várias sessões/codexes e você quer ver por que ele decidiu chamar sua atenção — mas também pode expor mais detalhes internos do que você deseja. Prefira mantê-lo desativado em chats em grupo.

## Consciência de custo

Heartbeats executam turnos completos do agente. Intervalos mais curtos consomem mais tokens. Para reduzir custo:

- Use `isolatedSession: true` para evitar enviar o histórico completo da conversa (~100 mil tokens para ~2-5 mil por execução).
- Use `lightContext: true` para limitar os arquivos de bootstrap apenas a `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se quiser apenas atualizações de estado internas.

## Relacionados

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em uma visão rápida
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como o trabalho desacoplado é rastreado
- [Fuso horário](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento de Heartbeat
- [Solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
