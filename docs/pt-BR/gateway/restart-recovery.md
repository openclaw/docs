---
read_when:
    - Você quer saber se reiniciar o Gateway faz com que o trabalho do agente em andamento seja perdido
    - Uma execução do agente foi interrompida por uma reinicialização, falha ou recarregamento da configuração
    - Você está depurando a recuperação automática da sessão após o Gateway voltar a ficar disponível
summary: 'O que persiste após a reinicialização ou falha do Gateway: turnos de agentes interrompidos são retomados automaticamente, subagentes e tarefas em segundo plano se recuperam, e as entregas enfileiradas são processadas'
title: Recuperação após reinicialização
x-i18n:
    generated_at: "2026-07-12T15:15:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b2701cb9cdc5aabffc395a2956260389cbe81a6c3ca2876830ef4ed83db2fb53
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Reiniciar o Gateway não causa perda do estado do agente. Conversas, transcrições,
tarefas agendadas, registros de tarefas em segundo plano e mensagens de saída na fila
ficam armazenados em disco, e o trabalho interrompido durante um turno é detectado e retomado
automaticamente depois que o Gateway volta a funcionar. Nenhuma intervenção manual é
necessária e não há nada para configurar: a recuperação está sempre ativada.

Esta página descreve o que sobrevive a uma reinicialização, como o trabalho interrompido é detectado
e como funciona a retomada automática.

## O que sobrevive a uma reinicialização

| Estado                         | Armazenamento                                             | Comportamento após a reinicialização                                                 |
| ----------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Histórico de conversas          | Transcrições JSONL + armazenamento de sessões por agente em disco | Permanece intacto; as sessões continuam a partir da transcrição armazenada                 |
| Turno interrompido da sessão principal | Marcadores de recuperação no armazenamento de sessões               | Retomado automaticamente alguns segundos após a inicialização                       |
| Execuções de subagentes                 | SQLite (banco de dados de estado compartilhado)                      | Registro restaurado na inicialização; execuções interrompidas retomadas                     |
| Tarefas em segundo plano              | SQLite (banco de dados de estado compartilhado)                      | Reconciliadas na inicialização; execuções órfãs recuperadas ou marcadas como perdidas              |
| Entregas de saída na fila    | Fila de entrega SQLite                               | Processada após a reinicialização; respostas não entregues são tentadas novamente                  |
| Tarefas agendadas (cron)         | Armazenamento cron SQLite                                   | Os agendamentos persistem; o agendador é reativado na inicialização                        |
| Continuação após reinicialização          | Sentinela de reinicialização SQLite                             | Acompanhamento único enviado à sessão que solicitou a reinicialização |

## Reinicializações normais aguardam a conclusão primeiro

Uma reinicialização solicitada (`openclaw gateway restart`, uma alteração de configuração que exige
uma reinicialização ou uma atualização do Gateway) não encerra imediatamente o trabalho em andamento. O
Gateway deixa de aceitar novos trabalhos e aguarda a conclusão dos turnos ativos dos agentes e das
tarefas em segundo plano, até o limite de tempo de esvaziamento (5 minutos por padrão). Portanto, a maioria
das reinicializações não interrompe nenhum trabalho.

Somente o trabalho que não consegue terminar dentro do limite de esvaziamento (ou qualquer execução interrompida
por uma reinicialização forçada ou falha) é abortado — e, antes disso, cada
sessão afetada é marcada para recuperação.

## Como o trabalho interrompido é detectado

Dois mecanismos complementares marcam as sessões cujo turno não foi concluído:

- **No encerramento:** durante o esvaziamento para reinicialização, cada sessão com uma execução ativa
  recebe um marcador de recuperação no armazenamento de sessões antes que a execução seja
  abortada.
- **Na inicialização:** o Gateway verifica os armazenamentos de sessões em busca de sessões que ainda
  declaram estar em execução, mas não têm um proprietário ativo no novo processo. Isso detecta
  falhas graves e encerramentos nos quais nenhum código de desligamento foi executado. Arquivos obsoletos de bloqueio
  de transcrição são removidos ao mesmo tempo.

## Retomada automática

Alguns segundos após a inicialização, o Gateway despacha novamente cada sessão marcada
com uma mensagem sintética do sistema informando ao agente que seu turno anterior foi
interrompido por uma reinicialização e que ele deve continuar a partir da transcrição existente. Se uma
resposta final já tiver sido produzida, mas não entregue, o texto dela será incluído
para que o agente possa entregá-la em vez de refazer o trabalho. A recuperação faz até
3 tentativas com espera exponencial.

Antes de retomar, o Gateway verifica se é seguro continuar a partir do fim da
transcrição. Caso não seja (por exemplo, se o turno tiver terminado em uma aprovação pendente
obsoleta), a sessão não será executada novamente às cegas; em vez disso, o agente publicará um breve
aviso solicitando que o usuário reenvie a última solicitação.

O OpenClaw também pode reconstruir trabalhos somente leitura do [Modo de Código](/pt-BR/reference/code-mode)
que tenham sido interrompidos. O Modo de Código marca essas execuções como seguras para reinicialização e rejeita ferramentas
de catálogo ou namespaces de plugins que causem efeitos colaterais antes que sejam executados. Se uma reinicialização ocorrer
no controle `wait`, o novo Gateway reconstruirá o turno a partir de sua transcrição
e obrigará a execução reconstruída a permanecer segura para reinicialização, mesmo que o
modelo omita ou desative esse sinalizador. O host restringe todo o turno reconstruído
às ferramentas principais auditadas somente leitura e às ferramentas de plugins explicitamente seguras para repetição,
inclusive quando o Modo de Código é desativado após a reinicialização. Trabalhos com efeitos colaterais
continuam protegidos pelo aviso de reenvio, em vez de correr o risco de uma gravação duplicada.

### Subagentes

As execuções de subagentes são armazenadas no banco de dados de estado compartilhado SQLite, portanto o
registro de subagentes sobrevive ao processo. Na inicialização, o registro é restaurado e
as sessões interrompidas de subagentes são retomadas com o contexto original da tarefa.
Duas proteções se aplicam:

- Execuções interrompidas há mais de 2 horas são finalizadas em vez de retomadas, para que
  um Gateway que tenha ficado inativo durante a noite não reative trabalhos obsoletos.
- Uma sessão que falha repetidamente na recuperação recebe uma marca permanente de travamento para que
  a recuperação não entre em um ciclo infinito.

### Tarefas em segundo plano

O [registro de tarefas em segundo plano](/pt-BR/automation/tasks) usa SQLite e é
reconciliado na inicialização e em intervalos periódicos: resultados duráveis registrados por
execuções concluídas são recuperados, e execuções cujo processo proprietário desapareceu são
marcadas como perdidas após um período de carência, em vez de ficarem bloqueadas indefinidamente.

### Reinicializações solicitadas pelo agente

Quando o próprio agente aciona uma reinicialização (ao aplicar uma alteração de configuração, atualizar
o Gateway ou fazer uma solicitação explícita de reinicialização), uma sentinela de reinicialização é gravada no
SQLite antes de o processo ser encerrado. Após a inicialização, o Gateway publica o resultado de volta
no chat de origem e despacha um turno único de continuação para que o
agente retome exatamente de onde parou, no mesmo canal e tópico.

## Proteções e observabilidade

- **Disjuntor de ciclo de falhas:** 3 inicializações anormais em um intervalo de 5 minutos acionam um disjuntor que
  impede a inicialização automática de serviços auxiliares na próxima inicialização, para que um Gateway com falhas
  não amplifique o problema. Ele se recupera quando o intervalo de inicializações anormais termina.
- **Métricas:** a atividade de recuperação é exportada pelo
  [Prometheus](/pt-BR/gateway/prometheus) como `openclaw_session_recovery_total` e
  `openclaw_session_recovery_age_seconds`.
- **Logs:** as decisões de recuperação são registradas nos subsistemas
  `main-session-restart-recovery` e `subagent-interrupted-resume`.

## O que não é retomado

- Sessões excluídas da recuperação da sessão principal porque outro proprietário já
  cuida delas: sessões de subagentes (recuperação de subagentes), sessões cron (o
  agendador as executa novamente conforme o agendamento) e sessões gerenciadas por ACP (o IDE
  ou cliente conectado é responsável pela retomada).
- Sessões cujo fim da transcrição não permite uma continuação segura; elas recebem o
  aviso de reenvio descrito acima, em vez de uma nova execução silenciosa.
- Trabalho que nunca foi aceito: mensagens recebidas durante o período de esvaziamento são
  rejeitadas com um erro explícito de reinicialização, em vez de serem silenciosamente adicionadas à fila de um
  processo que está sendo encerrado.
