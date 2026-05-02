---
read_when:
    - Ajustando a cadência ou as mensagens de Heartbeat
    - Como decidir entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Heartbeat
summary: Mensagens de consulta periódica do Heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T05:46:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8198c74e2712c7ed9d34c41bad7c4e9be62043e8755cb4c9a60649222e04e37
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou Cron?** Consulte [Automação e tarefas](/pt-BR/automation) para orientação sobre quando usar cada um.
</Note>

Heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa destacar qualquer coisa que precise de atenção sem enviar spam.

Heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefa em segundo plano](/pt-BR/automation/tasks). Registros de tarefas são para trabalhos separados (execuções ACP, subagentes, trabalhos Cron isolados).

Solução de problemas: [Tarefas agendadas](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

<Steps>
  <Step title="Pick a cadence">
    Deixe os heartbeats ativados (o padrão é `30m`, ou `1h` para autenticação Anthropic OAuth/token, incluindo reutilização do Claude CLI) ou defina sua própria cadência.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Crie uma pequena lista de verificação `HEARTBEAT.md` ou um bloco `tasks:` no workspace do agente.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` é o padrão; defina `target: "last"` para encaminhar ao último contato.
  </Step>
  <Step title="Optional tuning">
    - Ative a entrega de raciocínio do heartbeat para transparência.
    - Use contexto leve de inicialização se as execuções do heartbeat precisarem apenas de `HEARTBEAT.md`.
    - Ative sessões isoladas para evitar enviar todo o histórico da conversa a cada heartbeat.
    - Restrinja heartbeats ao horário ativo (hora local).

  </Step>
</Steps>

Exemplo de configuração:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m` (ou `1h` quando autenticação Anthropic OAuth/token for o modo de autenticação detectado, incluindo reutilização do Claude CLI). Defina `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` por agente; use `0m` para desativar.
- Corpo do prompt (configurável via `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- O prompt do heartbeat é enviado **literalmente** como a mensagem do usuário. O prompt do sistema inclui uma seção "Heartbeat" apenas quando heartbeats estão ativados para o agente padrão, e a execução é marcada internamente.
- Quando heartbeats são desativados com `0m`, execuções normais também omitem `HEARTBEAT.md` do contexto de inicialização para que o modelo não veja instruções exclusivas de heartbeat.
- Horários ativos (`heartbeat.activeHours`) são verificados no fuso horário configurado. Fora da janela, heartbeats são ignorados até o próximo tick dentro da janela.
- Heartbeats são adiados automaticamente enquanto trabalho Cron está ativo ou enfileirado. Defina `heartbeat.skipWhenBusy: true` para adiar também em pistas mais ocupadas (trabalho de subagente ou comando aninhado); isso é útil para Ollama local e outros hosts restritos de runtime único.

## Para que serve o prompt do heartbeat

O prompt padrão é intencionalmente amplo:

- **Tarefas em segundo plano**: "Considerar tarefas pendentes" incentiva o agente a revisar acompanhamentos (caixa de entrada, calendário, lembretes, trabalho enfileirado) e destacar qualquer coisa urgente.
- **Check-in humano**: "Fazer check-in ocasionalmente com seu humano durante o dia" incentiva uma mensagem leve e ocasional de "precisa de algo?", mas evita spam noturno usando seu fuso horário local configurado (consulte [Fuso horário](/pt-BR/concepts/timezone)).

Heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de heartbeat em si não cria um registro de tarefa.

Se você quiser que um heartbeat faça algo muito específico (por exemplo, "verificar estatísticas do Gmail PubSub" ou "verificar a integridade do gateway"), defina `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) como um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Execuções de heartbeat com capacidade de ferramentas podem, em vez disso, chamar `heartbeat_respond` com `notify: false` para nenhuma atualização visível, ou `notify: true` mais `notificationText` para um alerta. Quando presente, a resposta estruturada da ferramenta tem precedência sobre o fallback de texto.
- Durante execuções de heartbeat, o OpenClaw trata `HEARTBEAT_OK` como uma confirmação quando aparece no **início ou fim** da resposta. O token é removido e a resposta é descartada se o conteúdo restante tiver **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não recebe tratamento especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora de heartbeats, `HEARTBEAT_OK` perdido no início/fim de uma mensagem é removido e registrado; uma mensagem que contenha apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global de heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se algum agente tiver um bloco `heartbeat`, **apenas esses agentes** executam heartbeats.
- `channels.defaults.heartbeat` define padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com várias contas) substitui as configurações por canal.

### Heartbeats por agente

Se qualquer entrada `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes** executam Heartbeats. O bloco por agente é mesclado sobre `agents.defaults.heartbeat` (assim, você pode definir padrões compartilhados uma vez e sobrescrever por agente).

Exemplo: dois agentes, somente o segundo agente executa Heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
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

### Exemplo de horários ativos

Restrinja Heartbeats ao horário comercial em um fuso horário específico:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Fora dessa janela (antes das 9h ou depois das 22h no horário do Leste), os Heartbeats são ignorados. O próximo tick agendado dentro da janela será executado normalmente.

### Configuração 24/7

Se você quiser que os Heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` completamente (sem restrição de janela de tempo; este é o comportamento padrão).
- Defina uma janela de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Não defina o mesmo horário de `start` e `end` (por exemplo, de `08:00` a `08:00`). Isso é tratado como uma janela de largura zero, então os Heartbeats são sempre ignorados.
</Warning>

### Exemplo de múltiplas contas

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
          to: "12345678:topic:42", // optional: route to a specific topic/thread
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

### Observações dos campos

<ParamField path="every" type="string">
  Intervalo de Heartbeat (string de duração; unidade padrão = minutos).
</ParamField>
<ParamField path="model" type="string">
  Sobrescrita opcional de modelo para execuções de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando habilitado, também entrega a mensagem `Reasoning:` separada quando disponível (mesmo formato que `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando verdadeiro, as execuções de Heartbeat usam contexto de inicialização leve e mantêm apenas `HEARTBEAT.md` dos arquivos de inicialização do workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando verdadeiro, cada Heartbeat é executado em uma nova sessão sem histórico de conversa anterior. Usa o mesmo padrão de isolamento que o Cron `sessionTarget: "isolated"`. Reduz drasticamente o custo de tokens por Heartbeat. Combine com `lightContext: true` para máxima economia. O roteamento de entrega ainda usa o contexto da sessão principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando verdadeiro, as execuções de Heartbeat são adiadas em filas extras ocupadas: trabalho de subagente ou de comando aninhado. As filas de Cron sempre adiam Heartbeats, mesmo sem esta flag, então hosts de modelo local não executam prompts de Cron e Heartbeat ao mesmo tempo.
</ParamField>
<ParamField path="session" type="string">
  Chave de sessão opcional para execuções de Heartbeat.

- `main` (padrão): sessão principal do agente.
- Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/pt-BR/cli/sessions)).
- Formatos de chave de sessão: consulte [Sessões](/pt-BR/concepts/session) e [Grupos](/pt-BR/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entrega no último canal externo usado.
- canal explícito: qualquer canal configurado ou id de plugin, por exemplo `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (padrão): executa o Heartbeat, mas **não entrega** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla o comportamento de entrega direta/DM. `allow`: permite entrega direta/DM de Heartbeat. `block`: suprime entrega direta/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Sobrescrita opcional de destinatário (id específico do canal, por exemplo E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de conta opcional para canais com múltiplas contas. Quando `target: "last"`, o id da conta se aplica ao último canal resolvido se ele for compatível com contas; caso contrário, é ignorado. Se o id da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.

</ParamField>
<ParamField path="prompt" type="string">
  Sobrescreve o corpo padrão do prompt (não é mesclado).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando verdadeiro, suprime payloads de aviso de erro de ferramenta durante execuções de Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe execuções de Heartbeat a uma janela de horário. Objeto com `start` (HH:MM, inclusivo; use `00:00` para início do dia), `end` (HH:MM exclusivo; `24:00` permitido para fim do dia) e `timezone` opcional.

- Omitido ou `"user"`: usa seu `agents.defaults.userTimezone` se definido; caso contrário, recorre ao fuso horário do sistema host.
- `"local"`: sempre usa o fuso horário do sistema host.
- Qualquer identificador IANA (por exemplo, `America/New_York`): usado diretamente; se inválido, recorre ao comportamento de `"user"` acima.
- `start` e `end` não devem ser iguais para uma janela ativa; valores iguais são tratados como largura zero (sempre fora da janela).
- Fora da janela ativa, Heartbeats são ignorados até o próximo tick dentro da janela.

</ParamField>

## Comportamento de entrega

<AccordionGroup>
  <Accordion title="Roteamento de sessão e destino">
    - Heartbeats são executados na sessão principal do agente por padrão (`agent:<id>:<mainKey>`), ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma sessão de canal específica (Discord/WhatsApp/etc.).
    - `session` afeta apenas o contexto da execução; a entrega é controlada por `target` e `to`.
    - Para entregar a um canal/destinatário específico, defina `target` + `to`. Com `target: "last"`, a entrega usa o último canal externo dessa sessão.
    - Entregas de Heartbeat permitem destinos diretos/DM por padrão. Defina `directPolicy: "block"` para suprimir envios a destinos diretos enquanto ainda executa o turno de Heartbeat.
    - Se a fila principal, a lane da sessão de destino, a lane de cron ou um cron job ativo estiver ocupado, o Heartbeat será ignorado e tentado novamente depois.
    - Se `skipWhenBusy: true`, subagentes e lanes aninhadas também adiam execuções de Heartbeat.
    - Se `target` não resolver para nenhum destino externo, a execução ainda acontece, mas nenhuma mensagem de saída é enviada.

  </Accordion>
  <Accordion title="Visibilidade e comportamento de salto">
    - Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução será ignorada antecipadamente como `reason=alerts-disabled`.
    - Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda pode executar o Heartbeat, atualizar timestamps de tarefas vencidas, restaurar o timestamp de inatividade da sessão e suprimir o payload de alerta externo.
    - Se o destino resolvido do Heartbeat oferecer suporte a digitação, o OpenClaw mostra digitação enquanto a execução do Heartbeat está ativa. Isso usa o mesmo destino para o qual o Heartbeat enviaria a saída de chat e é desativado por `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida e auditoria da sessão">
    - Respostas somente de Heartbeat **não** mantêm a sessão ativa. Os metadados de Heartbeat podem atualizar a linha da sessão, mas a expiração por inatividade usa `lastInteractionAt` da última mensagem real do usuário/canal, e a expiração diária usa `sessionStartedAt`.
    - O histórico da Control UI e do WebChat oculta prompts de Heartbeat e confirmações somente OK. A transcrição subjacente da sessão ainda pode conter esses turnos para auditoria/replay.
    - [Tarefas em segundo plano](/pt-BR/automation/tasks) destacadas podem enfileirar um evento do sistema e acordar o Heartbeat quando a sessão principal deve notar algo rapidamente. Esse despertar não transforma a execução de Heartbeat em uma tarefa em segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidade

Por padrão, confirmações `HEARTBEAT_OK` são suprimidas enquanto o conteúdo de alerta é entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Precedência: por conta → por canal → padrões de canal → padrões integrados.

### O que cada sinalizador faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta somente OK.
- `showAlerts`: envia o conteúdo de alerta quando o modelo retorna uma resposta não OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da UI.

Se **todos os três** forem falsos, o OpenClaw ignora completamente a execução de Heartbeat (sem chamada ao modelo).

### Exemplos por canal vs. por conta

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Padrões comuns

| Objetivo                                      | Configuração                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativos) | _(nenhuma configuração necessária)_                                                      |
| Totalmente silencioso (sem mensagens, sem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs em apenas um canal                        | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se um arquivo `HEARTBEAT.md` existir no workspace, o prompt padrão instrui o agente a lê-lo. Pense nele como sua "lista de verificação de Heartbeat": pequena, estável e segura para incluir a cada 30 minutos.

Em execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de Heartbeat está habilitada para o agente padrão. Desativar a cadência de Heartbeat com `0m` ou definir `includeSystemPromptSection: false` o omite do contexto normal de bootstrap.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco e cabeçalhos markdown como `# Heading`), o OpenClaw ignora a execução de Heartbeat para economizar chamadas de API. Esse salto é relatado como `reason=empty-heartbeat-file`. Se o arquivo estiver ausente, o Heartbeat ainda é executado e o modelo decide o que fazer.

Mantenha-o minúsculo (lista de verificação curta ou lembretes) para evitar inchaço de prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
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

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamento">
    - O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa de acordo com seu próprio `interval`.
    - Apenas tarefas **vencidas** são incluídas no prompt de Heartbeat para aquele tick.
    - Se nenhuma tarefa estiver vencida, o Heartbeat será ignorado por completo (`reason=no-tasks-due`) para evitar uma chamada desperdiçada ao modelo.
    - Conteúdo que não é de tarefa em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas vencidas.
    - Timestamps da última execução de tarefas são armazenados no estado da sessão (`heartbeatTaskState`), então os intervalos sobrevivem a reinicializações normais.
    - Timestamps de tarefas só são avançados depois que uma execução de Heartbeat conclui seu caminho normal de resposta. Execuções ignoradas por `empty-heartbeat-file` / `no-tasks-due` não marcam tarefas como concluídas.

  </Accordion>
</AccordionGroup>

O modo de tarefas é útil quando você quer que um único arquivo de Heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada tick.

### O agente pode atualizar HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no workspace do agente, então você pode dizer ao agente (em um chat normal) algo como:

- "Atualize `HEARTBEAT.md` para adicionar uma verificação diária de calendário."
- "Reescreva `HEARTBEAT.md` para que fique mais curto e focado em acompanhamentos da caixa de entrada."

Se quiser que isso aconteça proativamente, você também pode incluir uma linha explícita no seu prompt de Heartbeat como: "Se a lista de verificação ficar obsoleta, atualize HEARTBEAT.md com uma melhor."

<Warning>
Não coloque segredos (chaves de API, números de telefone, tokens privados) em `HEARTBEAT.md` — ele se torna parte do contexto do prompt.
</Warning>

## Despertar manual (sob demanda)

Você pode enfileirar um evento do sistema e acionar um Heartbeat imediato com:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Se vários agentes tiverem `heartbeat` configurado, um despertar manual executa imediatamente cada um desses Heartbeats de agente.

Use `--mode next-heartbeat` para aguardar o próximo tick agendado.

## Entrega de raciocínio (opcional)

Por padrão, Heartbeats entregam apenas o payload final de "resposta".

Se quiser transparência, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando habilitado, Heartbeats também entregarão uma mensagem separada prefixada com `Reasoning:` (mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente está gerenciando várias sessões/códigos e você quer ver por que ele decidiu avisar você — mas também pode vazar mais detalhes internos do que você deseja. Prefira mantê-lo desativado em chats em grupo.

## Consciência de custo

Heartbeats executam turnos completos do agente. Intervalos mais curtos consomem mais tokens. Para reduzir o custo:

- Use `isolatedSession: true` para evitar enviar todo o histórico da conversa (~100K tokens para ~2-5K por execução).
- Use `lightContext: true` para limitar arquivos de bootstrap apenas a `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo, `ollama/llama3.2:1b`).
- Mantenha `HEARTBEAT.md` pequeno.
- Use `target: "none"` se você quer apenas atualizações de estado internas.

## Estouro de contexto após Heartbeat

Se um Heartbeat usa um modelo local menor, por exemplo um modelo Ollama com uma janela de 32k, e o próximo turno da sessão principal relata estouro de contexto, verifique se o Heartbeat anterior deixou a sessão no modelo de Heartbeat. A mensagem de redefinição do OpenClaw chama atenção para isso quando o último modelo de runtime corresponde ao `heartbeat.model` configurado.

Use `isolatedSession: true` para executar Heartbeats em uma sessão nova, combine com `lightContext: true` para o menor prompt, ou escolha um modelo de Heartbeat com uma janela de contexto grande o suficiente para a sessão compartilhada.

## Relacionado

- [Automação e Tarefas](/pt-BR/automation) — todos os mecanismos de automação em resumo
- [Tarefas em Segundo Plano](/pt-BR/automation/tasks) — como trabalho destacado é rastreado
- [Fuso horário](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento de Heartbeat
- [Solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
