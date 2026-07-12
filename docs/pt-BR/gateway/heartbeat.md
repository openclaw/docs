---
read_when:
    - Ajustando a frequência ou as mensagens do Heartbeat
    - Decidindo entre Heartbeat e Cron para tarefas agendadas
sidebarTitle: Heartbeat
summary: Mensagens de sondagem do Heartbeat e regras de notificação
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T15:15:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat ou Cron?** Consulte [Automação](/pt-BR/automation) para obter orientações sobre quando usar cada um.
</Note>

O Heartbeat executa **turnos periódicos do agente** na sessão principal para que o modelo possa indicar qualquer coisa que precise de atenção sem enviar mensagens em excesso.

O Heartbeat é um turno agendado da sessão principal — ele **não** cria registros de [tarefa em segundo plano](/pt-BR/automation/tasks). Os registros de tarefas são destinados a trabalhos desvinculados (execuções de ACP, subagentes, trabalhos Cron isolados).

Solução de problemas: [Tarefas agendadas](/pt-BR/automation/cron-jobs#troubleshooting)

## Início rápido (iniciante)

<Steps>
  <Step title="Escolha uma frequência">
    Mantenha os Heartbeats ativados (o padrão é `30m`, ou `1h` quando a autenticação por OAuth/token da Anthropic está configurada, incluindo a reutilização da CLI do Claude) ou defina sua própria frequência.
  </Step>
  <Step title="Adicione HEARTBEAT.md (opcional)">
    Crie uma pequena lista de verificação em `HEARTBEAT.md` ou um bloco `tasks:` no espaço de trabalho do agente.
  </Step>
  <Step title="Decida para onde as mensagens de Heartbeat devem ir">
    `target: "none"` é o padrão; defina `target: "last"` para encaminhá-las ao último contato.
  </Step>
  <Step title="Ajustes opcionais">
    - Ative a entrega do raciocínio do Heartbeat para maior transparência.
    - Use um contexto de inicialização leve se as execuções do Heartbeat precisarem apenas de `HEARTBEAT.md`.
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
        target: "last", // entrega explícita ao último contato (o padrão é "none")
        directPolicy: "allow", // padrão: permite destinos diretos/DM; defina "block" para suprimir
        lightContext: true, // opcional: injeta apenas HEARTBEAT.md dos arquivos de inicialização
        isolatedSession: true, // opcional: nova sessão a cada execução (sem histórico da conversa)
        skipWhenBusy: true, // opcional: também adia quando o subagente deste agente ou as filas aninhadas estão ocupados
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // opcional: também envia uma mensagem `Thinking` separada
      },
    },
  },
}
```

## Padrões

- Intervalo: `30m`. A aplicação dos padrões do provedor Anthropic aumenta esse valor para `1h` quando o modo de autenticação resolvido é OAuth/token (incluindo a reutilização da CLI do Claude), mas somente enquanto `heartbeat.every` não estiver definido. Defina `agents.defaults.heartbeat.every` ou `agents.list[].heartbeat.every` por agente; use `0m` para desativar.
- Corpo do prompt (configurável por meio de `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Tempo limite: quando definido, `agents.defaults.timeoutSeconds` é usado para execuções de Heartbeat sem configuração. Caso contrário, elas usam a cadência do Heartbeat, limitada a 600 segundos. Defina `agents.defaults.heartbeat.timeoutSeconds` ou `agents.list[].heartbeat.timeoutSeconds` por agente para trabalhos de Heartbeat mais longos.
- O prompt do Heartbeat é enviado **sem alterações** como a mensagem do usuário. O prompt do sistema inclui uma seção "Heartbeats" somente quando os Heartbeats estão ativados para o agente padrão (e `includeSystemPromptSection` não é `false`), e a execução é sinalizada internamente.
- Quando os Heartbeats são desativados com `0m`, as execuções normais também omitem `HEARTBEAT.md` do contexto de inicialização para que o modelo não veja instruções exclusivas de Heartbeat.
- O horário ativo (`heartbeat.activeHours`) é verificado no fuso horário configurado. Fora desse período, os Heartbeats são ignorados até o próximo ciclo dentro do período.
- Os Heartbeats são adiados automaticamente enquanto um trabalho Cron está ativo ou na fila. Defina `heartbeat.skipWhenBusy: true` para também adiar um agente nas vias de subagente com chave de sessão ou de comandos aninhados desse próprio agente; agentes irmãos não são mais pausados apenas porque outro agente tem um trabalho de subagente em andamento.

## Para que serve o prompt de Heartbeat

O prompt padrão é intencionalmente abrangente:

- **Tarefas em segundo plano**: "Considere as tarefas pendentes" incentiva o agente a revisar acompanhamentos (caixa de entrada, calendário, lembretes, trabalhos na fila) e destacar qualquer item urgente.
- **Contato com a pessoa**: "Verifique ocasionalmente como está sua pessoa durante o dia" incentiva uma mensagem breve e ocasional perguntando "precisa de alguma coisa?", mas evita mensagens indesejadas à noite usando o fuso horário local configurado (consulte [Fuso horário](/pt-BR/concepts/timezone)).

O Heartbeat pode reagir a [tarefas em segundo plano](/pt-BR/automation/tasks) concluídas, mas uma execução de Heartbeat não cria, por si só, um registro de tarefa.

Se você quiser que um heartbeat faça algo muito específico (por exemplo, "verificar as estatísticas do Gmail PubSub" ou "verificar a integridade do gateway"), defina `agents.defaults.heartbeat.prompt` (ou `agents.list[].heartbeat.prompt`) com um corpo personalizado (enviado literalmente).

## Contrato de resposta

- Se nada exigir atenção, responda com **`HEARTBEAT_OK`**.
- As execuções de heartbeat também podem chamar `heartbeat_respond` com `notify: false` para não exibir nenhuma atualização, ou `notify: true` junto com `notificationText` para um alerta. Quando presente, a resposta estruturada da ferramenta tem precedência sobre o texto de fallback.
- Durante as execuções de heartbeat, o OpenClaw trata `HEARTBEAT_OK` como uma confirmação quando ele aparece no **início ou no fim** da resposta. O token é removido, e a resposta é descartada se o conteúdo restante tiver **≤ `ackMaxChars`** (padrão: 300).
- Se `HEARTBEAT_OK` aparecer no **meio** de uma resposta, ele não receberá tratamento especial.
- Para alertas, **não** inclua `HEARTBEAT_OK`; retorne somente o texto do alerta.

Fora dos heartbeats, ocorrências isoladas de `HEARTBEAT_OK` no início ou no fim de uma mensagem são removidas e registradas; uma mensagem que contenha apenas `HEARTBEAT_OK` é descartada.

## Configuração

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // padrão: 30m (0m desativa)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // padrão: false (entrega uma mensagem de Raciocínio separada quando disponível)
        lightContext: false, // padrão: false; true mantém apenas HEARTBEAT.md entre os arquivos de inicialização do espaço de trabalho
        isolatedSession: false, // padrão: false; true executa cada heartbeat em uma sessão nova (sem histórico da conversa)
        skipWhenBusy: false, // padrão: false; true também aguarda as execuções de subagentes/aninhadas deste agente
        target: "last", // padrão: none | opções: last | none | <channel id> (principal ou plugin, por exemplo, "imessage")
        to: "+15551234567", // substituição opcional específica do canal
        accountId: "ops-bot", // id opcional do canal para múltiplas contas
        prompt: "Leia HEARTBEAT.md se ele existir (contexto do espaço de trabalho). Siga-o rigorosamente. Não deduza nem repita tarefas antigas de conversas anteriores. Se nada exigir atenção, responda HEARTBEAT_OK.",
        includeSystemPromptSection: true, // padrão: true; false omite a seção ## Heartbeats do prompt do sistema para o agente padrão
        ackMaxChars: 300, // máximo de caracteres permitidos após HEARTBEAT_OK
      },
    },
  },
}
```

### Escopo e precedência

- `agents.defaults.heartbeat` define o comportamento global do Heartbeat.
- `agents.list[].heartbeat` é mesclado por cima; se algum agente tiver um bloco `heartbeat`, **somente esses agentes** executarão Heartbeats.
- `channels.defaults.heartbeat` define os padrões de visibilidade para todos os canais.
- `channels.<channel>.heartbeat` substitui os padrões do canal.
- `channels.<channel>.accounts.<id>.heartbeat` (canais com várias contas) substitui as configurações por canal.

### Heartbeats por agente

Se alguma entrada de `agents.list[]` incluir um bloco `heartbeat`, **somente esses agentes** executarão Heartbeats. O bloco por agente é mesclado por cima de `agents.defaults.heartbeat` (assim, você pode definir os padrões compartilhados uma vez e substituí-los por agente).

Exemplo: dois agentes, somente o segundo executa Heartbeats.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // entrega explícita para o último contato (o padrão é "none")
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
          prompt: "Leia HEARTBEAT.md se ele existir (contexto do espaço de trabalho). Siga-o rigorosamente. Não deduza nem repita tarefas antigas de conversas anteriores. Se nada exigir atenção, responda HEARTBEAT_OK.",
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
        target: "last", // entrega explícita para o último contato (o padrão é "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // opcional; usa seu userTimezone, se definido; caso contrário, o fuso horário do host
        },
      },
    },
  },
}
```

Fora dessa janela (antes das 9h ou depois das 22h no horário do leste dos EUA), os Heartbeats são ignorados. A próxima execução agendada dentro da janela ocorrerá normalmente.

### Configuração 24 horas por dia, 7 dias por semana

Se você quiser que os Heartbeats sejam executados o dia todo, use um destes padrões:

- Omita `activeHours` completamente (sem restrição de janela de tempo; esse é o comportamento padrão).
- Defina uma janela de dia inteiro: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Não defina o mesmo horário para `start` e `end` (por exemplo, de `08:00` a `08:00`). Isso é tratado como uma janela de largura zero, portanto, os Heartbeats são sempre ignorados.
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

### Observações sobre os campos

<ParamField path="every" type="string">
  Intervalo do Heartbeat (string de duração; unidade padrão = minutos).
</ParamField>
<ParamField path="model" type="string">
  Substituição opcional do modelo para execuções de Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Quando habilitado, também entrega a mensagem `Thinking` separada quando disponível (mesmo formato de `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Quando verdadeiro, as execuções de Heartbeat usam um contexto de inicialização leve e mantêm somente `HEARTBEAT.md` entre os arquivos de inicialização do espaço de trabalho.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Quando verdadeiro, cada Heartbeat é executado em uma nova sessão, sem histórico de conversas anteriores. Usa o mesmo padrão de isolamento do Cron `sessionTarget: "isolated"`. Reduz drasticamente o custo de tokens por Heartbeat. Combine com `lightContext: true` para obter a máxima economia. O roteamento da entrega ainda usa o contexto da sessão principal.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Quando verdadeiro, as execuções de Heartbeat são adiadas nas faixas adicionais ocupadas desse agente: o próprio subagente com chave de sessão ou trabalhos de comandos aninhados. As faixas do Cron sempre adiam os Heartbeats, mesmo sem essa opção, para que hosts de modelos locais não executem prompts de Cron e Heartbeat ao mesmo tempo.
</ParamField>
<ParamField path="session" type="string">
  Chave de sessão opcional para execuções de Heartbeat.

- `main` (padrão): sessão principal do agente.
- Chave de sessão explícita (copie de `openclaw sessions --json` ou da [CLI de sessões](/pt-BR/cli/sessions)).
- Formatos de chave de sessão: consulte [Sessões](/pt-BR/concepts/session) e [Grupos](/pt-BR/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: entrega ao último canal externo usado.
- canal explícito: qualquer canal configurado ou ID de plugin, por exemplo, `discord`, `matrix`, `telegram` ou `whatsapp`.
- `none` (padrão): executa o Heartbeat, mas **não entrega** externamente.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Controla o comportamento de entrega direta/por mensagem direta. `allow`: permite a entrega direta/por mensagem direta do Heartbeat. `block`: suprime a entrega direta/por mensagem direta (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Substituição opcional do destinatário (id específico do canal, por exemplo, E.164 para WhatsApp ou um id de chat do Telegram). Para tópicos/threads do Telegram, use `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id de conta opcional para canais com várias contas. Quando `target: "last"`, o id da conta se aplica ao último canal resolvido, se ele oferecer suporte a contas; caso contrário, é ignorado. Se o id da conta não corresponder a uma conta configurada para o canal resolvido, a entrega será ignorada.

</ParamField>
<ParamField path="prompt" type="string">
  Substitui o corpo padrão do prompt (sem mesclagem).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Define se a seção `## Heartbeats` do prompt de sistema do agente padrão é injetada. Defina como `false` para manter o comportamento de Heartbeat em tempo de execução (cadência, entrega, HEARTBEAT.md), omitindo as instruções de Heartbeat do prompt de sistema do agente.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Número máximo de caracteres permitidos após `HEARTBEAT_OK` antes da entrega.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Quando verdadeiro, suprime os conteúdos de aviso de erro de ferramenta durante as execuções de Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Número máximo de segundos permitido para um turno do agente de Heartbeat antes que ele seja abortado. Deixe sem definir para usar `agents.defaults.timeoutSeconds` quando estiver definido; caso contrário, será usada a cadência de Heartbeat, limitada a 600 segundos.

</ParamField>
<ParamField path="activeHours" type="object">
  Restringe as execuções de Heartbeat a uma janela de tempo. Objeto com `start` (HH:MM, inclusivo; use `00:00` para o início do dia), `end` (HH:MM exclusivo; `24:00` é permitido para o fim do dia) e `timezone` opcional.

- Omitido ou `"user"`: usa seu `agents.defaults.userTimezone`, se definido; caso contrário, recorre ao fuso horário do sistema host.
- `"local"`: sempre usa o fuso horário do sistema host.
- Qualquer identificador IANA (por exemplo, `America/New_York`): usado diretamente; se for inválido, recorre ao comportamento de `"user"` descrito acima.
- `start` e `end` não podem ser iguais para uma janela ativa; valores iguais são tratados como uma janela de largura zero (sempre fora da janela).
- Fora da janela ativa, os Heartbeats são ignorados até o próximo ciclo dentro da janela.

</ParamField>

## Comportamento da entrega

<AccordionGroup>
  <Accordion title="Roteamento de sessão e destino">
    - Por padrão, os Heartbeats são executados na sessão principal do agente (`agent:<id>:<mainKey>`), ou em `global` quando `session.scope = "global"`. Defina `session` para substituir por uma sessão de canal específica (Discord/WhatsApp/etc.).
    - `session` afeta apenas o contexto da execução; a entrega é controlada por `target` e `to`.
    - Para entregar a um canal/destinatário específico, defina `target` + `to`. Com `target: "last"`, a entrega usa o último canal externo dessa sessão.
    - Por padrão, as entregas de Heartbeat permitem destinos diretos/DM. Defina `directPolicy: "block"` para suprimir envios a destinos diretos, mantendo a execução do turno de Heartbeat.
    - Se a fila principal, a faixa da sessão de destino, a faixa do Cron ou um trabalho Cron ativo estiver ocupado, o Heartbeat será ignorado e tentado novamente mais tarde.
    - Se `skipWhenBusy: true`, as faixas de subagentes baseadas na chave de sessão deste agente e as faixas aninhadas também adiam as execuções de Heartbeat. Faixas ocupadas de outros agentes não adiam este agente.
    - Se `target` não for resolvido para nenhum destino externo, a execução ainda ocorrerá, mas nenhuma mensagem de saída será enviada.

  </Accordion>
  <Accordion title="Comportamento de visibilidade e omissão">
    - Se `showOk`, `showAlerts` e `useIndicator` estiverem todos desativados, a execução será ignorada desde o início como `reason=alerts-disabled`.
    - Se apenas a entrega de alertas estiver desativada, o OpenClaw ainda poderá executar o Heartbeat, atualizar os timestamps das tarefas pendentes, restaurar o timestamp de inatividade da sessão e suprimir o conteúdo do alerta externo.
    - Se o destino de Heartbeat resolvido oferecer suporte ao indicador de digitação, o OpenClaw mostrará esse indicador enquanto a execução de Heartbeat estiver ativa. Isso usa o mesmo destino ao qual o Heartbeat enviaria a saída do chat e é desativado por `typingMode: "never"`.

  </Accordion>
  <Accordion title="Ciclo de vida e auditoria da sessão">
    - Respostas exclusivas de Heartbeat **não** mantêm a sessão ativa. Os metadados de Heartbeat podem atualizar a linha da sessão, mas a expiração por inatividade usa `lastInteractionAt` da última mensagem real do usuário/canal, e a expiração diária usa `sessionStartedAt`.
    - O histórico da Control UI e do WebChat oculta prompts de Heartbeat e confirmações contendo apenas OK. A transcrição subjacente da sessão ainda pode conter esses turnos para auditoria/reprodução.
    - [Tarefas em segundo plano](/pt-BR/automation/tasks) desvinculadas podem enfileirar um evento do sistema e despertar o Heartbeat quando a sessão principal precisar perceber algo rapidamente. Esse despertar não transforma a execução de Heartbeat em uma tarefa em segundo plano.

  </Accordion>
</AccordionGroup>

## Controles de visibilidade

Por padrão, as confirmações `HEARTBEAT_OK` são suprimidas enquanto o conteúdo dos alertas é entregue. Você pode ajustar isso por canal ou por conta:

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
          showAlerts: false # Suprimir a entrega de alertas para esta conta
```

Precedência: por conta → por canal → padrões do canal → padrões integrados.

### O que cada sinalizador faz

- `showOk`: envia uma confirmação `HEARTBEAT_OK` quando o modelo retorna uma resposta contendo apenas OK.
- `showAlerts`: envia o conteúdo do alerta quando o modelo retorna uma resposta que não seja OK.
- `useIndicator`: emite eventos de indicador para superfícies de status da interface.

Se **os três** forem falsos, o OpenClaw ignorará completamente a execução de Heartbeat (sem chamada ao modelo).

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

| Objetivo                                          | Configuração                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Comportamento padrão (OKs silenciosos, alertas ativados) | _(nenhuma configuração necessária)_                                                |
| Totalmente silencioso (sem mensagens nem indicador) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Apenas indicador (sem mensagens)                  | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs em apenas um canal                            | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (opcional)

Se existir um arquivo `HEARTBEAT.md` no espaço de trabalho, o prompt padrão instruirá o agente a lê-lo. Pense nele como sua "lista de verificação de Heartbeat": pequena, estável e segura para ser considerada a cada 30 minutos.

Nas execuções normais, `HEARTBEAT.md` só é injetado quando a orientação de Heartbeat está ativada para o agente padrão. Desativar a cadência de Heartbeat com `0m` ou definir `includeSystemPromptSection: false` faz com que ele seja omitido do contexto normal de inicialização.

No ambiente nativo do Codex, o conteúdo de `HEARTBEAT.md` não é injetado no turno como os outros arquivos de inicialização. Se o arquivo existir e tiver conteúdo que não seja apenas espaços em branco, uma nota do modo de colaboração de Heartbeat direcionará o Codex ao arquivo e instruirá que ele seja lido antes de prosseguir.

Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco, comentários Markdown/HTML, cabeçalhos Markdown como `# Heading`, marcadores de cerca ou esboços vazios de listas de verificação), o OpenClaw ignorará a execução de Heartbeat para economizar chamadas à API. Essa omissão é informada como `reason=empty-heartbeat-file`. Se o arquivo estiver ausente, o Heartbeat ainda será executado, e o modelo decidirá o que fazer.

Mantenha-o pequeno (uma lista de verificação curta ou lembretes) para evitar o inchaço do prompt.

Exemplo de `HEARTBEAT.md`:

```md
# Lista de verificação de Heartbeat

- Verificação rápida: há algo urgente nas caixas de entrada?
- Se for durante o dia, faça uma verificação breve se não houver mais nada pendente.
- Se uma tarefa estiver bloqueada, anote _o que está faltando_ e pergunte ao Peter da próxima vez.
```

### Blocos `tasks:`

O `HEARTBEAT.md` também oferece suporte a um pequeno bloco estruturado `tasks:` para verificações baseadas em intervalos dentro do próprio Heartbeat.

Exemplo:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Verifique se há e-mails urgentes não lidos e sinalize tudo que for sensível ao tempo."
- name: calendar-scan
  interval: 2h
  prompt: "Verifique se há reuniões futuras que exijam preparação ou acompanhamento."

# Instruções adicionais

- Mantenha os alertas curtos.
- Se nada exigir atenção após todas as tarefas pendentes, responda HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Comportamento">
    - O OpenClaw analisa o bloco `tasks:` e verifica cada tarefa em relação ao seu próprio `interval`.
    - Apenas as tarefas **pendentes** são incluídas no prompt de Heartbeat desse ciclo.
    - Se nenhuma tarefa estiver pendente, o Heartbeat será completamente ignorado (`reason=no-tasks-due`) para evitar uma chamada desperdiçada ao modelo.
    - O conteúdo que não seja de tarefas em `HEARTBEAT.md` é preservado e anexado como contexto adicional após a lista de tarefas pendentes.
    - Os timestamps da última execução das tarefas são armazenados no estado da sessão (`heartbeatTaskState`), portanto os intervalos persistem após reinicializações normais.
    - Os timestamps das tarefas só são avançados depois que uma execução de Heartbeat conclui seu fluxo normal de resposta. Execuções ignoradas por `empty-heartbeat-file` / `no-tasks-due` não marcam as tarefas como concluídas.

  </Accordion>
</AccordionGroup>

O modo de tarefas é útil quando você deseja que um único arquivo de Heartbeat contenha várias verificações periódicas sem pagar por todas elas a cada ciclo.

### O agente pode atualizar o HEARTBEAT.md?

Sim — se você pedir.

`HEARTBEAT.md` é apenas um arquivo normal no espaço de trabalho do agente, portanto você pode dizer ao agente (em um chat normal) algo como:

- "Atualize `HEARTBEAT.md` para adicionar uma verificação diária do calendário."
- "Reescreva `HEARTBEAT.md` para deixá-lo mais curto e focado nos acompanhamentos da caixa de entrada."

Se quiser que isso aconteça de forma proativa, você também pode incluir uma linha explícita no prompt de Heartbeat, como: "Se a lista de verificação ficar desatualizada, atualize HEARTBEAT.md com uma versão melhor."

<Warning>
Não coloque segredos (chaves de API, números de telefone, tokens privados) em `HEARTBEAT.md` — ele se torna parte do contexto do prompt.
</Warning>

## Despertar manual (sob demanda)

Use `openclaw system event` para enfileirar um evento do sistema e, opcionalmente, acionar um Heartbeat imediato:

```bash
openclaw system event --text "Verifique se há acompanhamentos urgentes" --mode now
```

| Sinalizador                    | Descrição                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `--text <text>`                | Texto do evento do sistema (obrigatório).                                                        |
| `--mode <mode>`                | `now` executa um Heartbeat imediato; `next-heartbeat` (padrão) aguarda o próximo ciclo agendado. |
| `--session-key <sessionKey>`   | Direciona o evento a uma sessão específica; o padrão é a sessão principal do agente.            |
| `--json`                       | Saída em JSON.                                                                                   |

Se nenhum `--session-key` for fornecido e vários agentes tiverem `heartbeat` configurado, `--mode now` executará imediatamente o Heartbeat de cada um desses agentes.

Controles de Heartbeat relacionados no mesmo grupo da CLI:

```bash
openclaw system heartbeat last     # mostrar o último evento de Heartbeat
openclaw system heartbeat enable   # ativar Heartbeats
openclaw system heartbeat disable  # desativar Heartbeats
```

## Entrega do raciocínio (opcional)

Por padrão, os heartbeats entregam apenas o payload final de "resposta".

Se quiser transparência, habilite:

- `agents.defaults.heartbeat.includeReasoning: true`

Quando habilitado, os heartbeats também entregarão uma mensagem separada com o prefixo `Thinking` (no mesmo formato de `/reasoning on`). Isso pode ser útil quando o agente gerencia várias sessões/codexes e você quer saber por que ele decidiu enviar um ping — mas também pode expor mais detalhes internos do que você deseja. Prefira mantê-lo desabilitado em conversas em grupo.

## Controle de custos

Os heartbeats executam turnos completos do agente. Intervalos mais curtos consomem mais tokens. Para reduzir o custo:

- Use `isolatedSession: true` para evitar o envio de todo o histórico da conversa (de ~100K tokens para ~2-5K por execução).
- Use `lightContext: true` para limitar os arquivos de inicialização apenas a `HEARTBEAT.md`.
- Defina um `model` mais barato (por exemplo, `ollama/llama3.2:1b`).
- Mantenha o `HEARTBEAT.md` pequeno.
- Use `target: "none"` se quiser apenas atualizações de estado internas.

## Estouro de contexto após um heartbeat

Após a conclusão da execução, os heartbeats preservam o modelo de runtime existente da sessão compartilhada. Portanto, um heartbeat que tenha mudado uma sessão para um modelo local menor (por exemplo, um modelo Ollama com uma janela de 32k) pode deixar esse modelo ativo para o próximo turno da sessão principal. Se esse próximo turno relatar um estouro de contexto e o último modelo de runtime da sessão corresponder ao `heartbeat.model` configurado, a mensagem de recuperação do OpenClaw indicará que o provável motivo foi o modelo do heartbeat ter permanecido ativo e sugerirá uma correção.

Para evitar isso: use `isolatedSession: true` para executar heartbeats em uma nova sessão (opcionalmente combinado com `lightContext: true` para obter o menor prompt possível) ou escolha um modelo de heartbeat com uma janela de contexto grande o suficiente para a sessão compartilhada.

## Relacionados

- [Automação](/pt-BR/automation) — todos os mecanismos de automação em uma visão geral
- [Tarefas em segundo plano](/pt-BR/automation/tasks) — como o trabalho desvinculado é acompanhado
- [Fuso horário](/pt-BR/concepts/timezone) — como o fuso horário afeta o agendamento de heartbeats
- [Solução de problemas](/pt-BR/automation/cron-jobs#troubleshooting) — depuração de problemas de automação
