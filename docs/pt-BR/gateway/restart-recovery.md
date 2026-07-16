---
read_when:
    - Você quer saber se reiniciar o Gateway faz com que o trabalho do agente em andamento seja perdido
    - Uma execução do agente foi interrompida por uma reinicialização, falha ou recarregamento da configuração
    - Você está depurando a recuperação automática da sessão após o Gateway voltar a funcionar
summary: 'O que persiste após uma reinicialização ou falha do Gateway: turnos interrompidos do agente são retomados automaticamente, subagentes e tarefas em segundo plano são recuperados, entregas enfileiradas são processadas'
title: Recuperação após reinicialização
x-i18n:
    generated_at: "2026-07-16T12:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Reiniciar o Gateway não causa perda do estado dos agentes. Conversas, transcrições,
tarefas agendadas, registros de tarefas em segundo plano e mensagens de saída na fila
ficam armazenados em disco, e trabalhos interrompidos no meio de um turno são detectados
e retomados automaticamente após o Gateway voltar a funcionar. Nenhuma intervenção
manual é necessária e não há nada a configurar: a recuperação está sempre ativada.

Esta página descreve o que sobrevive a uma reinicialização, como trabalhos interrompidos
são detectados e como funciona a retomada automática.

## O que sobrevive a uma reinicialização

| Estado                              | Armazenamento                                     | Comportamento após a reinicialização                                    |
| ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Histórico de conversas              | Banco de dados SQLite por agente                  | Permanece intacto; as sessões continuam a partir da transcrição armazenada |
| Turno interrompido da sessão principal | Linha de sessão e transcrição SQLite por agente | Retomado ou reconciliado automaticamente alguns segundos após a inicialização |
| Execuções de subagentes             | SQLite (banco de dados de estado compartilhado)   | Registro restaurado na inicialização; execuções interrompidas são retomadas |
| Tarefas em segundo plano            | SQLite (banco de dados de estado compartilhado)   | Reconciliadas na inicialização; execuções órfãs são recuperadas ou marcadas como perdidas |
| Entregas de saída na fila           | Fila de entregas SQLite                           | Processada após a reinicialização; respostas não entregues são reenviadas |
| Tarefas agendadas (Cron)            | Armazenamento Cron SQLite                         | Os agendamentos persistem; o agendador é reativado na inicialização     |
| Continuação após reinicialização    | Sentinela de reinicialização SQLite               | Continuação única enviada à sessão que solicitou a reinicialização      |

## Reinicializações normais primeiro aguardam a conclusão dos trabalhos

Uma reinicialização solicitada (`openclaw gateway restart`, uma alteração de configuração que exige
uma reinicialização ou uma atualização do Gateway) não encerra imediatamente os trabalhos
em andamento. O Gateway deixa de aceitar novos trabalhos e aguarda a conclusão dos turnos
ativos dos agentes e das tarefas em segundo plano, até o limite do período de espera
(5 minutos por padrão). Portanto, a maioria das reinicializações não interrompe trabalho algum.

Somente trabalhos que não conseguem terminar dentro do período de espera (ou qualquer execução
interrompida por uma reinicialização forçada ou uma falha) são abortados — e, antes que isso
aconteça, cada sessão afetada é marcada para recuperação.

## Como trabalhos interrompidos são detectados

Três mecanismos complementares marcam as sessões cujo turno não foi concluído:

- **Na admissão do turno:** para um turno de texto comum em uma sessão principal existente,
  o Gateway acrescenta a mensagem do usuário, marca a sessão como em execução e registra
  sua reivindicação de entrega de recuperação em uma única transação SQLite antes da execução
  do modelo ou do gancho `before_agent_reply`. A Interface de Controle faz isso antes de retornar
  a confirmação `started`; o encaminhamento do canal faz isso quando o turno preparado
  adota a execução do agente.
  Comandos, anexos, substituições específicas do turno, entregas pendentes, indicações de
  cancelamento anteriores, sessões pertencentes a plugins e turnos com ganchos de execução
  mantêm seus fluxos de admissão especializados.
  Se um gancho `before_agent_reply` estiver instalado, a admissão também registrará sua fase.
  A recuperação nunca repete um gancho interrompido no meio de uma chamada. Quando um gancho
  não tratado termina, seu ponto de verificação registra esse resultado, mas a recuperação
  ainda falha de forma segura enquanto esse gancho permanece ativo: um ponto de verificação
  não pode comprovar que o mesmo código e a mesma configuração do plugin foram carregados
  após a reinicialização. Resultados de texto tratados e resultados silenciosos são registrados
  separadamente em pontos de verificação para garantir uma resolução determinística.
  Reivindicações duráveis de recuperação gravadas por versões anteriores não possuem um
  marcador de propriedade da origem, portanto recebem a mesma verificação de gancho com
  falha segura durante uma atualização.
- **No desligamento:** durante o período de espera da reinicialização, cada sessão com uma execução
  ativa recebe um marcador de recuperação no armazenamento de sessões antes que a execução
  seja abortada.
- **Na inicialização:** o Gateway verifica os armazenamentos de sessões em busca de sessões que
  ainda afirmam estar em execução, mas não possuem um proprietário ativo no novo processo.
  Isso detecta falhas graves e encerramentos nos quais nenhum código de desligamento foi
  executado. Arquivos obsoletos de bloqueio de transcrição são removidos ao mesmo tempo.

## Retomada automática

Alguns segundos após a inicialização, o Gateway reencaminha cada sessão marcada
com uma mensagem sintética do sistema informando ao agente que seu turno anterior foi
interrompido por uma reinicialização e que ele deve continuar a partir da transcrição existente.
Se uma resposta final já tiver sido produzida, mas não entregue, seu texto será incluído
para que o agente possa entregá-la em vez de refazer o trabalho. A recuperação realiza até
3 tentativas com espera exponencial. Cada tentativa reutiliza um único identificador durável
de encaminhamento, portanto uma falha de conexão ambígua não pode iniciar a mesma recuperação
duas vezes. Turnos concluídos e não retomáveis da Interface de Controle também mantêm
marcadores duráveis de idempotência com duração limitada, permitindo que uma caixa de saída
reconectada os descarte sem executar novamente a solicitação.

Respostas enviadas somente pela ferramenta de mensagens usam uma segunda correlação durável.
Antes que um envio terminal para a mesma conversa chegue ao canal, o Gateway registra uma
intenção de entrega não resolvida na sessão e no turno de origem exatos. Um sucesso confirmado
pelo provedor a resolve como um comprovante durável de entrega; uma falha confirmada a remove.
A recuperação conclui um comprovante de entrega sem executar novamente as ferramentas. Se uma
falha deixar o resultado do provedor desconhecido, a recuperação falhará de forma segura em vez
de repetir um efeito externo.

A resposta entregue também é espelhada na transcrição com o ID de sua mensagem de origem.
Espelhamentos terminais usam uma chave de comprovante distinta, portanto um envio de progresso
com a mesma chave de idempotência do provedor não pode ocultar o marcador terminal. Envios de
progresso e comprovantes de turnos anteriores não podem concluir o turno atual. Somente
reivindicações duráveis de entrada do canal podem restaurar a autoridade para ações de mensagem.
Uma execução retomada mantém o modo original de entrega da origem e a correlação da origem,
incluindo a identidade do solicitante e qualquer restrição ao mesmo canal ou à mesma conversa,
portanto o mesmo comprovante permanece válido mesmo se outra reinicialização ocorrer durante
a recuperação. Um turno que usa somente a ferramenta de mensagens sem autoridade de canal
reconstruível falha de forma segura e recebe o aviso único para reenvio.

Antes da retomada, o Gateway verifica se é seguro continuar a partir do final da transcrição.
Caso não seja (por exemplo, se o turno tiver terminado em uma aprovação pendente obsoleta),
a sessão não será executada novamente às cegas; em vez disso, o agente publicará um breve
aviso solicitando que o usuário reenvie a última solicitação. No WebChat, esse aviso é gravado
diretamente no histórico da sessão para permanecer visível após a reconexão.

O OpenClaw também pode reconstruir trabalhos interrompidos e somente leitura do
[Modo de Código](/pt-BR/reference/code-mode). O Modo de Código marca essas execuções como seguras
para reinicialização e rejeita ferramentas de catálogo ou namespaces de plugins com efeitos
colaterais antes que sejam executados. Se uma reinicialização ocorrer no controle
`wait`, o novo Gateway reconstruirá o turno a partir de sua transcrição e obrigará
a execução reconstruída a permanecer segura para reinicialização, mesmo que o modelo omita
ou remova essa sinalização. O host limita todo o turno reconstruído às ferramentas principais
auditadas e somente leitura e às ferramentas de plugins explicitamente seguras para repetição,
inclusive quando o Modo de Código é desativado após a reinicialização. Trabalhos com efeitos
colaterais continuam protegidos pelo aviso de reenvio, em vez de arriscar uma gravação duplicada.

### Subagentes

As execuções de subagentes são persistidas no banco de dados de estado SQLite compartilhado,
portanto o registro de subagentes sobrevive ao processo. Na inicialização, o registro é
restaurado e as sessões interrompidas de subagentes são retomadas com o contexto original
de suas tarefas. Duas proteções se aplicam:

- Execuções interrompidas há mais de 2 horas são finalizadas em vez de retomadas, para que
  um Gateway que ficou desligado durante a noite não ressuscite trabalhos obsoletos.
- Uma sessão que falha repetidamente ao se recuperar é marcada definitivamente como travada,
  para que a recuperação não possa entrar em um ciclo infinito.

### Tarefas em segundo plano

O [registro de tarefas em segundo plano](/pt-BR/automation/tasks) usa SQLite e é
reconciliado na inicialização e em intervalos periódicos: resultados duráveis registrados
por execuções concluídas são recuperados, e execuções cujo processo proprietário desapareceu
são marcadas como perdidas após um período de tolerância, em vez de ficarem suspensas para sempre.

### Reinicializações solicitadas pelo agente

Quando o próprio agente aciona uma reinicialização (ao aplicar uma alteração de configuração,
atualizar o Gateway ou por meio de uma solicitação explícita de reinicialização), uma sentinela
de reinicialização é gravada no SQLite antes que o processo seja encerrado. Após a inicialização,
o Gateway publica o resultado no chat de origem e encaminha um turno único de continuação para
que o agente retome exatamente do ponto em que parou, no mesmo canal e na mesma conversa.

## Proteções e observabilidade

- **Disjuntor de ciclo de falhas:** 3 inicializações anormais em até 5 minutos acionam um disjuntor
  que impede o início automático de serviços auxiliares na próxima inicialização, para que um
  Gateway com falhas não amplifique o próprio problema. Ele se recupera quando a janela de
  inicializações anormais se esgota.
- **Métricas:** a atividade de recuperação é exportada por meio do
  [Prometheus](/pt-BR/gateway/prometheus) como `openclaw_session_recovery_total` e
  `openclaw_session_recovery_age_seconds`.
- **Logs:** as decisões de recuperação são registradas nos subsistemas
  `main-session-restart-recovery` e `subagent-interrupted-resume`.

## O que não é retomado

- Sessões excluídas da recuperação da sessão principal porque outro proprietário já
  cuida delas: sessões de subagentes (recuperação de subagentes), sessões Cron (o
  agendador as executa novamente conforme a programação) e sessões gerenciadas por ACP
  (o IDE ou cliente conectado é responsável pela retomada).
- Sessões cujo final da transcrição não permite uma continuação segura; elas recebem o
  aviso de reenvio descrito anteriormente, em vez de serem executadas novamente de forma silenciosa.
- Trabalhos que nunca foram admitidos: mensagens recebidas durante o período de espera
  são rejeitadas com um erro explícito de reinicialização, em vez de serem silenciosamente
  colocadas na fila de um processo que está sendo encerrado.
