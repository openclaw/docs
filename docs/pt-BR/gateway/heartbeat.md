---
read_when:
    - Ajuste da frequência ou das mensagens do Heartbeat
    - Como decidir entre heartbeat e cron para tarefas agendadas
sidebarTitle: Heartbeat
summary: Mensagens de sondagem do Heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-07-11T23:57:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou Cron?** Consulte [Automação](/pt-BR/automation) para obter orientações sobre quando usar cada um.
</Note>

O Heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa apresentar qualquer coisa que precise de atenção sem enviar mensagens em excesso.

O Heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefas em segundo plano](/pt-BR/automation/tasks). Os registros de tarefas destinam-se a trabalhos desvinculados (execuções ACP, subagentes e trabalhos Cron isolados).

Solução de problemas: [Tarefas agendadas](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

<Steps>
  <Step title="Escolha uma frequência">
    Deixe os Heartbeats ativados (o padrão é `30m`, ou `1h` quando a autenticação OAuth/por token da Anthropic está configurada, incluindo a reutilização da CLI do Claude) ou defina sua própria frequência.
  </Step>
  <Step title="Adicione HEARTBEAT.md (opcional)">
    Crie uma pequena lista de verificação em `HEARTBEAT.md` ou um bloco `tasks:` no espaço de trabalho do agente.
  </Step>
  <Step title="Decida para onde as mensagens de Heartbeat devem ir">
    `target: "none"` é o padrão; defina `target: "last"` para encaminhá-las ao último contato.
  </Step>
  <Step title="Ajustes opcionais">
    - Ative a entrega do raciocínio do Heartbeat para dar transparência.
    - Use um contexto de inicialização leve se as execuções de Heartbeat precisarem apenas de `HEARTBEAT.md`.
    - Ative sessões isoladas para evitar o envio de todo o histórico da conversa a cada Heartbeat.
    - Restrinja os Heartbeats ao horário ativo (hora local).

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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m`. A aplicação dos padrões do provedor Anthropic aumenta esse valor para `1h` quando o modo de autenticação resolvido é OAuth/por token (incluindo a reutilização da CLI do Claude), mas somente enquanto `heartbeat.every` não estiver definido. Defina `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` por agente; use `0m` para desativar.
- Corpo do prompt (configurável por meio de `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Tempo limite: turnos de Heartbeat sem um valor definido usam `agents.defaults.timeoutSeconds` quando configurado. Caso contrário, usam a frequência do Heartbeat, limitada a 600 segundos. Defina `agents.defaults.heartbeat.timeoutSeconds` ou `agents.list[].heartbeat.timeoutSeconds` por agente para trabalhos de Heartbeat mais longos.
- O prompt do Heartbeat é enviado **textualmente** como a mensagem do usuário. O prompt do sistema inclui uma seção "Heartbeats" somente quando os Heartbeats estão ativados para o agente padrão (e `includeSystemPromptSection` não é `false`), e a execução é sinalizada internamente.
- Quando os Heartbeats são desativados com `0m`, as execuções normais também omitem `HEARTBEAT.md` do contexto de inicialização para que o modelo não veja instruções exclusivas de Heartbeat.
- O horário ativo (`heartbeat.activeHours`) é verificado no fuso horário configurado. Fora desse período, os Heartbeats são ignorados até a próxima marcação dentro do período.
- Os Heartbeats são adiados automaticamente enquanto houver trabalho Cron ativo ou na fila. Defina `heartbeat.skipWhenBusy: true` para também adiar um agente quando seu próprio subagente vinculado à chave de sessão ou suas linhas de comando aninhadas estiverem ocupados; agentes pares não são mais pausados apenas porque outro agente tem trabalho de subagente em andamento.

## Para que serve o prompt do Heartbeat

O prompt padrão é intencionalmente abrangente:

- **Tarefas em segundo plano**: "Considere as tarefas pendentes" incentiva o agente a revisar acompanhamentos (caixa de entrada, calendário, lembretes e trabalhos na fila) e apresentar qualquer coisa urgente.
- **Contato com a pessoa**: "Às vezes, verifique como está sua pessoa durante o dia" incentiva uma mensagem ocasional e breve perguntando "precisa de algo?", mas evita mensagens excessivas durante a noite usando o fuso horário local configurado (consulte [Fuso horário](/pt-BR/concepts/timezone)).

O Heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de Heartbeat não cria um registro de tarefa.

Se quiser que um Heartbeat faça algo muito específico (por exemplo, "verificar as estatísticas do Gmail PubSub" ou "verificar a integridade do Gateway"), defina `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado textualmente).

## Contrato de resposta

- Se nada precisar de atenção, responda com **`HEARTBEAT_OK`**.
- Em vez disso, as execuções de Heartbeat podem chamar `heartbeat_respond` com `notify: false` para não exibir nenhuma atualização, ou com `notify: true` e `notificationText` para emitir um alerta. Quando presente, a resposta estruturada da ferramenta tem precedência sobre o texto alternativo.
- Durante execuções de Heartbeat, o OpenClaw trata `HEARTBEAT_OK` como uma confirmação quando aparece no **início ou no fim** da resposta. O token é removido, e a resposta é descartada se o conteúdo restante tiver **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não receberá tratamento especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne apenas o texto do alerta.

Fora dos Heartbeats, ocorrências isoladas de `HEARTBEAT_OK` no início ou no fim de uma mensagem são removidas e registradas; uma mensagem que contenha apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global do Heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se qualquer agente tiver um bloco `heartbeat`, **somente esses agentes** executarão Heartbeats.
- `channels.defaults.heartbeat` define os padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com várias contas) substitui as configurações por canal.

### Heartbeats por agente

Se qualquer entrada de `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes** executarão Heartbeats. O bloco por agente é mesclado por cima de `agents.defaults.heartbeat` (assim, você pode definir padrões compartilhados uma vez e substituí-los por agente).

Exemplo: dois agentes, mas somente o segundo executa Heartbeats.

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

### Exemplo de horário ativo

Restrinja os Heartbeats ao horário comercial em um fuso horário específico:

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

Fora desse período (antes das 9h ou depois das 22h no horário do leste dos EUA), os Heartbeats são ignorados. A próxima marcação agendada dentro do período será executada normalmente.

### Configuração 24 horas por dia, 7 dias por semana

Se quiser que os Heartbeats sejam executados o dia inteiro, use um destes padrões:

- Omita completamente `activeHours` (sem restrição de período; esse é o comportamento padrão).
- Defina um período de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Não defina o mesmo horário de `start` e `end` (por exemplo, de `08:00` a `08:00`). Isso é tratado como um período de duração zero, portanto os Heartbeats são sempre ignorados.
</Warning>

### Exemplo com várias contas

Use `accountId` para direcionar a uma conta específica em canais com várias contas, como o Telegram:

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

### Observações sobre os campos

<ParamField path="every" type="string">
  Intervalo do Heartbeat (string de duração; unidade padrão = minutos).
</ParamField>
<ParamField path="model" type="string">
  Substituição opcional do modelo para execuções de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando ativado, também entrega a mensagem `Thinking` separada quando disponível (mesmo formato de `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando verdadeiro, as execuções de Heartbeat usam um contexto de inicialização leve e mantêm apenas `HEARTBEAT.md` entre os arquivos de inicialização do espaço de trabalho.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando verdadeiro, cada Heartbeat é executado em uma sessão nova, sem histórico de conversas anteriores. Usa o mesmo padrão de isolamento do Cron `sessionTarget: "isolated"`. Reduz drasticamente o custo de tokens por Heartbeat. Combine com `lightContext: true` para obter a máxima economia. O encaminhamento da entrega ainda usa o contexto da sessão principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando verdadeiro, as execuções de Heartbeat são adiadas nas linhas ocupadas adicionais desse agente: o próprio trabalho de subagente vinculado à chave de sessão ou o trabalho de comando aninhado. As linhas de Cron sempre adiam os Heartbeats, mesmo sem esse sinalizador, para que hosts de modelos locais não executem prompts de Cron e Heartbeat ao mesmo tempo.
</ParamField>
<ParamField path="session" type="string">
  Chave de sessão opcional para execuções de Heartbeat.

- `main` (padrão): sessão principal do agente.
- Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/pt-BR/cli/sessions)).
- Formatos de chave de sessão: consulte [Sessões](/pt-BR/concepts/session) e [Grupos](/pt-BR/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entrega ao último canal externo usado.
- canal explícito: qualquer canal configurado ou id de Plugin, por exemplo, `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (padrão): executa o Heartbeat, mas **não faz a entrega** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla o comportamento de entrega direta/por mensagem direta. `allow`: permite a entrega direta/por mensagem direta do Heartbeat. `block`: impede a entrega direta/por mensagem direta (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Substituição opcional do destinatário (ID específico do canal, por exemplo, E.164 para WhatsApp ou um ID de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  ID de conta opcional para canais com várias contas. Quando `target: "last"`, o ID da conta se aplica ao último canal resolvido se ele oferecer suporte a contas; caso contrário, é ignorado. Se o ID da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.

</ParamField>
<ParamField path="prompt" type="string">
  Substitui o corpo padrão do prompt (sem mesclagem).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Define se a seção `## Heartbeats` do prompt de sistema do agente padrão é injetada. Defina como `false` para manter o comportamento do Heartbeat em tempo de execução (cadência, entrega, HEARTBEAT.md), mas omitir as instruções de Heartbeat do prompt de sistema do agente.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Número máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando verdadeiro, suprime as cargas de aviso de erro das ferramentas durante as execuções de Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Número máximo de segundos permitido para um turno do agente de Heartbeat antes de ser interrompido. Deixe sem definir para usar `agents.defaults.timeoutSeconds`, quando configurado; caso contrário, usa a cadência do Heartbeat limitada a 600 segundos.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe as execuções de Heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para o início do dia), `end` (HH:MM, exclusivo; `24:00` é permitido para o fim do dia) e `timezone` opcional.

- Omitido ou `"user"`: usa seu `agents.defaults.userTimezone`, se definido; caso contrário, recorre ao fuso horário do sistema host.
- `"local"`: sempre usa o fuso horário do sistema host.
- Qualquer identificador IANA (por exemplo, `America/New_York`): usado diretamente; se for inválido, recorre ao comportamento de `"user"` descrito acima.
- `start` e `end` não podem ser iguais em uma janela ativa; valores iguais são tratados como uma janela de largura zero (sempre fora da janela).
- Fora da janela ativa, os Heartbeats são ignorados até a próxima execução dentro da janela.

</ParamField>

## Comportamento da entrega

<AccordionGroup>
  <Accordion title="Roteamento de sessão e destino">
    - Por padrão, os Heartbeats são executados na sessão principal do agente (`agent:<id>:<mainKey>`), ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma sessão de canal específica (Discord/WhatsApp/etc.).
    - `session` afeta apenas o contexto de execução; a entrega é controlada por `target` e `to`.
    - Para entregar a um canal/destinatário específico, defina `target` + `to`. Com `target: "last"`, a entrega usa o último canal externo dessa sessão.
    - Por padrão, as entregas de Heartbeat permitem destinos diretos/DM. Defina `directPolicy: "block"` para suprimir envios a destinos diretos e ainda executar o turno do Heartbeat.
    - Se a fila principal, a fila da sessão de destino, a fila do Cron ou um trabalho Cron ativo estiver ocupado, o Heartbeat será ignorado e tentado novamente mais tarde.
    - Se `skipWhenBusy: true`, as filas de subagentes vinculadas à chave de sessão deste agente e as filas aninhadas também adiam as execuções de Heartbeat. Filas ocupadas de outros agentes não adiam este agente.
    - Se `target` não for resolvido para nenhum destino externo, a execução ainda ocorrerá, mas nenhuma mensagem de saída será enviada.

  </Accordion>
  <Accordion title="Visibilidade e comportamento de omissão">
    - Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução será ignorada de imediato como `reason=alerts-disabled`.
    - Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda poderá executar o Heartbeat, atualizar os carimbos de data/hora das tarefas pendentes, restaurar o carimbo de data/hora de inatividade da sessão e suprimir a carga de alerta externa.
    - Se o destino resolvido do Heartbeat oferecer suporte ao indicador de digitação, o OpenClaw exibirá esse indicador enquanto a execução do Heartbeat estiver ativa. Isso usa o mesmo destino ao qual o Heartbeat enviaria a saída do chat e é desativado por `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida e auditoria da sessão">
    - Respostas exclusivas de Heartbeat **não** mantêm a sessão ativa. Os metadados do Heartbeat podem atualizar a linha da sessão, mas a expiração por inatividade usa `lastInteractionAt` da última mensagem real do usuário/canal, e a expiração diária usa `sessionStartedAt`.
    - O histórico da Control UI e do WebChat oculta prompts de Heartbeat e confirmações que contêm apenas OK. A transcrição subjacente da sessão ainda pode conter esses turnos para auditoria/reprodução.
    - [Tarefas em segundo plano](/pt-BR/automation/tasks) desacopladas podem enfileirar um evento do sistema e despertar o Heartbeat quando a sessão principal precisar perceber algo rapidamente. Esse despertar não transforma a execução do Heartbeat em uma tarefa em segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidade

Por padrão, as confirmações `HEARTBEAT_OK` são suprimidas enquanto o conteúdo de alerta é entregue. Você pode ajustar isso por canal ou por conta:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ocultar HEARTBEAT_OK (padrão)
      showAlerts: true # Exibir mensagens de alerta (padrão)
      useIndicator: true # Emitir eventos de indicador (padrão)
  telegram:
    heartbeat:
      showOk: true # Exibir confirmações OK no Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suprimir a entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões integrados.

### O que cada sinalizador faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta contendo apenas OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta diferente de OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da interface.

Se **todos os três** forem falsos, o OpenClaw ignorará completamente a execução do Heartbeat (sem chamada ao modelo).

### Exemplos por canal e por conta

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

| Objetivo                                      | Configuração                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativados) | _(nenhuma configuração necessária)_                                              |
| Totalmente silencioso (sem mensagens nem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Somente indicador (sem mensagens)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`   |
| OKs em apenas um canal                        | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (opcional)

Se houver um arquivo `HEARTBEAT.md` no espaço de trabalho, o prompt padrão instruirá o agente a lê-lo. Pense nele como sua "lista de verificação de Heartbeat": pequena, estável e segura para ser considerada a cada 30 minutos.

Em execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de Heartbeat está ativada para o agente padrão. Desativar a cadência do Heartbeat com `0m` ou definir `includeSystemPromptSection: false` o omite do contexto normal de inicialização.

No ambiente nativo do Codex, o conteúdo de `HEARTBEAT.md` não é injetado no turno como outros arquivos de inicialização. Se o arquivo existir e tiver conteúdo que não seja apenas espaço em branco, uma observação do modo de colaboração do Heartbeat direcionará o Codex ao arquivo e o instruirá a lê-lo antes de prosseguir.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco, comentários Markdown/HTML, títulos Markdown como `# Heading`, marcadores de bloco ou itens vazios de lista de verificação), o OpenClaw ignorará a execução do Heartbeat para economizar chamadas à API. Essa omissão é relatada como `reason=empty-heartbeat-file`. Se o arquivo não existir, o Heartbeat ainda será executado e o modelo decidirá o que fazer.

Mantenha-o pequeno (uma lista de verificação curta ou lembretes) para evitar o inchaço do prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Lista de verificação de Heartbeat

- Verificação rápida: há algo urgente nas caixas de entrada?
- Se for durante o dia, faça uma verificação breve se não houver mais nada pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte ao Peter na próxima vez.
```

### Blocos `tasks:`

O `HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para verificações baseadas em intervalos dentro do próprio Heartbeat.

Exemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Verifique se há e-mails urgentes não lidos e sinalize qualquer item com prazo crítico."
- name: calendar-scan
  interval: 2h
  prompt: "Verifique se há reuniões próximas que precisem de preparação ou acompanhamento."

# Instruções adicionais

- Mantenha os alertas curtos.
- Se nada precisar de atenção depois de todas as tarefas pendentes, responda HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamento">
    - O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa de acordo com seu próprio `interval`.
    - Somente as tarefas **pendentes** são incluídas no prompt do Heartbeat nessa execução.
    - Se nenhuma tarefa estiver pendente, o Heartbeat será completamente ignorado (`reason=no-tasks-due`) para evitar uma chamada desperdiçada ao modelo.
    - O conteúdo não relacionado a tarefas em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas pendentes.
    - Os carimbos de data/hora da última execução das tarefas são armazenados no estado da sessão (`heartbeatTaskState`), portanto, os intervalos persistem após reinicializações normais.
    - Os carimbos de data/hora das tarefas só avançam depois que uma execução de Heartbeat conclui seu fluxo normal de resposta. Execuções ignoradas por `empty-heartbeat-file` / `no-tasks-due` não marcam as tarefas como concluídas.

  </Accordion>
</AccordionGroup>

O modo de tarefas é útil quando você quer que um único arquivo de Heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada execução.

### O agente pode atualizar o HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no espaço de trabalho do agente, portanto, você pode dizer ao agente (em um chat normal) algo como:

- "Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário."
- "Reescreva `HEARTBEAT.md` para que fique mais curto e focado nos acompanhamentos da caixa de entrada."

Se quiser que isso aconteça proativamente, você também pode incluir uma linha explícita no prompt do Heartbeat, como: "Se a lista de verificação ficar desatualizada, atualize HEARTBEAT.md com uma versão melhor."

<Warning>
Não coloque segredos (chaves de API, números de telefone, tokens privados) em `HEARTBEAT.md` — ele passa a fazer parte do contexto do prompt.
</Warning>

## Ativação manual (sob demanda)

Use `openclaw system event` para enfileirar um evento do sistema e, opcionalmente, acionar um Heartbeat imediato:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

| Sinalizador                    | Descrição                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `--text <text>`               | Texto do evento do sistema (obrigatório).                                                               |
| `--mode <mode>`               | `now` executa um Heartbeat imediato; `next-heartbeat` (padrão) aguarda a próxima execução programada.   |
| `--session-key <sessionKey>`  | Direciona o evento a uma sessão específica; o padrão é a sessão principal do agente.                    |
| `--json`                      | Gera a saída em JSON.                                                                                   |

Se nenhum `--session-key` for fornecido e vários agentes tiverem `heartbeat` configurado, `--mode now` executará imediatamente o Heartbeat de cada um desses agentes.

Controles relacionados ao Heartbeat no mesmo grupo da CLI:

```bash
openclaw system heartbeat last     # exibir o último evento de Heartbeat
openclaw system heartbeat enable   # ativar Heartbeats
openclaw system heartbeat disable  # desativar Heartbeats
```

## Entrega de raciocínio (opcional)

Por padrão, os heartbeats entregam apenas o payload final de "resposta".

Se quiser transparência, ative:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando ativado, os heartbeats também entregarão uma mensagem separada com o prefixo `Thinking` (no mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente está gerenciando várias sessões/codexes e você quer saber por que ele decidiu enviar uma notificação — mas também pode expor mais detalhes internos do que você deseja. Prefira mantê-lo desativado em conversas em grupo.

## Considerações sobre custos

Os heartbeats executam turnos completos do agente. Intervalos menores consomem mais tokens. Para reduzir os custos:

- Use `isolatedSession: true` para evitar o envio de todo o histórico da conversa (de cerca de 100 mil tokens para aproximadamente 2 a 5 mil por execução).
- Use `lightContext: true` para limitar os arquivos de inicialização apenas ao `HEARTBEAT.md`.
- Defina um `model` mais econômico (por exemplo, `ollama/llama3.2:1b`).
- Mantenha o `HEARTBEAT.md` pequeno.
- Use `target: "none"` se quiser apenas atualizações de estado internas.

## Estouro de contexto após o heartbeat

Os heartbeats preservam o modelo de runtime existente da sessão compartilhada após a conclusão da execução. Portanto, um heartbeat que tenha mudado uma sessão para um modelo local menor (por exemplo, um modelo do Ollama com uma janela de 32 mil tokens) pode manter esse modelo ativo no próximo turno da sessão principal. Se esse próximo turno relatar um estouro de contexto e o último modelo de runtime da sessão corresponder ao `heartbeat.model` configurado, a mensagem de recuperação do OpenClaw indicará a propagação do modelo do heartbeat como a causa provável e sugerirá uma correção.

Para evitar isso: use `isolatedSession: true` para executar os heartbeats em uma nova sessão (opcionalmente combinado com `lightContext: true` para obter o menor prompt possível) ou escolha um modelo de heartbeat com uma janela de contexto grande o suficiente para a sessão compartilhada.

## Relacionado

- [Automação](/pt-BR/automation) — visão geral de todos os mecanismos de automação
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como o trabalho desvinculado é monitorado
- [Fuso horário](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento de heartbeats
- [Solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
