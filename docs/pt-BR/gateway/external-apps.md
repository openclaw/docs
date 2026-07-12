---
read_when:
    - Você está criando um aplicativo externo, script, painel, tarefa de CI ou extensão de IDE que se comunica com o OpenClaw
    - Você está escolhendo entre o RPC do Gateway e o SDK de Plugin
    - Você está fazendo uma integração com execuções de agentes, sessões, eventos, aprovações, modelos ou ferramentas do Gateway
    - Você está pareando um controlador de hospedagem com um agendador de ativação externo
sidebarTitle: External apps
summary: Caminho de integração atual para aplicativos externos, scripts, painéis, tarefas de CI e extensões de IDE
title: Integrações do Gateway para aplicativos externos
x-i18n:
    generated_at: "2026-07-12T15:15:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplicativos externos se comunicam com o OpenClaw por meio do protocolo do Gateway: transporte
WebSocket mais métodos RPC. Use-o quando um script, painel, trabalho de CI, extensão
de IDE ou outro processo precisar iniciar execuções de agentes, transmitir eventos, aguardar
resultados, cancelar trabalhos ou inspecionar recursos do Gateway.

<Warning>
  Ainda não há um pacote cliente público no npm. Não adicione nomes de pacotes cliente
  do OpenClaw como dependências do aplicativo até que as notas de versão anunciem um pacote
  publicado e esta página inclua instruções de instalação.
</Warning>

<Note>
  Esta página se destina a código externo ao processo do OpenClaw. O código de Plugin executado
  dentro do OpenClaw deve usar os subcaminhos documentados de `openclaw/plugin-sdk/*`.
</Note>

## O que está disponível atualmente

| Interface                               | Status | Use para                                                                                                  |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| [Protocolo do Gateway](/pt-BR/gateway/protocol) | Pronto | Transporte WebSocket, handshake de conexão, escopos de autenticação, versionamento do protocolo e eventos. |
| [Referência de RPC do Gateway](/pt-BR/reference/rpc) | Pronto | Métodos atuais do Gateway para agentes, sessões, tarefas, modelos, ferramentas, artefatos e aprovações. |
| [`openclaw agent`](/pt-BR/cli/agent)          | Pronto | Integração pontual com scripts quando executar a CLI por meio do shell for suficiente.                     |
| [`openclaw message`](/pt-BR/cli/message)      | Pronto | Envio de mensagens ou ações de canais a partir de scripts.                                                |

Um futuro pacote de biblioteca cliente está em desenvolvimento interno, mas ainda não é uma
interface pública de instalação. Trate-o como um detalhe de implementação em prévia até que uma
versão anuncie um pacote publicado e versionado.

## Caminho recomendado

1. Execute ou descubra um Gateway.
2. Conecte-se pelo [protocolo do Gateway](/pt-BR/gateway/protocol).
3. Chame os métodos RPC documentados na [referência de RPC do Gateway](/pt-BR/reference/rpc).
4. Fixe a versão do OpenClaw usada nos testes.
5. Consulte novamente a referência de RPC ao atualizar o OpenClaw.

Para execuções de agentes, comece com o RPC `agent` e combine-o com `agent.wait` para obter um
resultado terminal. Para um estado durável de conversa, use os métodos `sessions.*`.
Para integrações de UI, assine os eventos do Gateway e renderize apenas as famílias de eventos
que seu aplicativo entende.

## Suspensão cooperativa do host

Controladores de hospedagem que congelam ou criam snapshots de um processo em execução podem usar o
handshake de suspensão independente do host:

1. Pare de aceitar entradas externas controladas pelo host.
2. Chame `gateway.suspend.prepare` com um `requestId` estável e exclusivo.
3. Se a resposta for `busy`, mantenha o processo em execução e tente novamente mais tarde.
4. Se for `ready`, salve o `suspensionId` retornado e, em seguida, congele ou crie um snapshot
   do processo antes de `expiresAtMs`.
5. Após o descongelamento, ou se a suspensão for abandonada, chame `gateway.suspend.resume`
   com esse `suspensionId` pela conexão WebSocket existente ou pelo caminho de controle
   HTTP administrativo.

Um Gateway preparado rejeita novos handshakes WebSocket. Um controlador WebSocket
deve manter sua conexão autenticada aberta durante toda a operação do host. Se isso
não puder ser garantido, habilite e use o
[Plugin de RPC HTTP administrativo](/pt-BR/plugins/admin-http-rpc) antes da preparação. Se o
caminho de controle for perdido, aguarde a expiração da concessão de dois minutos antes de
se reconectar; a expiração reabre a admissão automaticamente.

O contrato RPC é:

- `gateway.suspend.prepare` — `operator.admin`; parâmetros
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parâmetros
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parâmetros
  `{ "suspensionId": "id-from-prepare" }`

Os IDs têm os espaços nas extremidades removidos, devem conter um caractere que não seja espaço em branco e estão limitados a
128 caracteres. Um resultado de preparação ocupado tem `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount` e `blockers`. Um resultado pronto tem este formato:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

O status retorna `{"status":"running"}` ou um resultado pronto com `expiresAtMs`.
A retomada retorna `{"ok":true,"status":"running","resumed":true}`; repeti-la
após uma retomada bem-sucedida retorna `resumed: false`.

Um ID de solicitação concorrente ou uma falha transitória na retomada do agendador retorna
`UNAVAILABLE`, passível de nova tentativa, com `retryAfterMs`. Durante a recuperação do agendador, preparação, status
e retomada retornam esse erro, o Gateway permanece não pronto e
bloqueado em caso de falha, e o host não deve congelá-lo nem criar um snapshot. O OpenClaw tenta
recuperar o agendador automaticamente e só reabre a admissão após a recuperação ser bem-sucedida. Um
ID de retomada incompatível retorna `INVALID_REQUEST`. A preparação compartilha o orçamento de gravação
do plano de controle do Gateway de três tentativas por minuto; respeite o atraso
retornado para nova tentativa. Os clientes WebSocket são agrupados por dispositivo e IP. Os controladores HTTP
administrativos são agrupados pelo IP resolvido do cliente, portanto controladores atrás de um mesmo
proxy podem compartilhar um orçamento.

A preparação serve apenas para recusar: o OpenClaw fecha novas admissões de raiz/sessão/comando,
pausa os ciclos automáticos de cron e inspeciona o trabalho de forma síncrona. Se houver algo
ativo, ele retoma o agendador e reabre a admissão antes de retornar
`busy`; ele não interrompe nem drena esse trabalho. Uma concessão pronta dura dois
minutos. Repetir `prepare` com o mesmo `requestId` a renova; a expiração retoma
o agendador antes de reabrir a admissão.
Uma emissão de reinicialização que vencer durante uma concessão pronta aguarda até que a concessão
seja retomada; uma reinicialização em andamento faz a preparação retornar `busy`.

Enquanto estiver pronto, `/healthz` permanece ativo e `/readyz` retorna `503`. As respostas locais ou
autenticadas de prontidão incluem `gateway-draining`; sondagens remotas não autenticadas
recebem apenas `{ "ready": false }`. A sondagem de integridade HTTP,
os métodos de suspensão em conexões WebSocket existentes e uma rota de RPC HTTP
administrativo já habilitada permanecem disponíveis. Outros RPCs retornam
`UNAVAILABLE`, passível de nova tentativa. As rotas HTTP integradas para trabalho do usuário e as rotas HTTP comuns de plugins,
incluindo APIs compatíveis com OpenAI, operações de ferramentas/sessões, observações de Nodes e
hooks configurados, retornam `503` com `error.code: "gateway_unavailable"`. Novos
upgrades de WebSocket pertencentes a plugins também retornam `503`; isso abrange a
propriedade do upgrade, não o trabalho realizado posteriormente por meio de um socket de Plugin estabelecido.

Esse handshake não persiste mensagens recebidas, não interrompe transportes de canais
de terceiros nem controla a plataforma de hospedagem. O host deve bloquear sua entrada
antes da preparação e continua responsável por despertar, criar snapshot/congelar e
interromper. `activeCount` é a contagem agregada de trabalhos rastreados, enquanto `blockers`
contém as contagens de categorias diferentes de zero e detalhes limitados das tarefas. Isso não é uma
barreira geral de quiescência do processo. Um bloqueador `background-exec` é apenas agregado:
texto de comando, IDs de processo, saída e identificadores de sessão ou escopo nunca
atravessam o protocolo. A integridade dos canais, a manutenção, a atualização de cache, sessões
WebSocket de plugins estabelecidas e trabalhos em segundo plano não registrados pertencentes a plugins podem
continuar ativos.
A plataforma de hospedagem deve congelar ou criar um snapshot de toda a árvore de processos e de seu
sistema de arquivos de forma consistente; este primeiro contrato não pode comprovar que trabalhos não registrados
estejam inativos.

<Tip>
  Para o agendamento de despertar do host, mantenha a parte voltada ao OpenClaw em um
  Plugin no processo e projete snapshots completos idempotentes para o adaptador externo do host.
  O controlador de hospedagem não deve importar o SDK de Plugin nem reconstruir o estado do cron
  a partir de deltas de eventos. Consulte [Projeção externa segura de cron
  ](/pt-BR/plugins/hooks#safe-external-cron-projection).
</Tip>

## Código de aplicativo versus código de Plugin

Use RPC do Gateway quando o código estiver fora do OpenClaw:

- Scripts Node que iniciam ou observam execuções de agentes
- Trabalhos de CI que chamam um Gateway
- painéis e painéis administrativos
- extensões de IDE
- pontes externas que não precisam se tornar plugins de canal
- testes de integração com transportes de Gateway simulados ou reais

Use o SDK de Plugin quando o código for executado dentro do OpenClaw:

- plugins de provedor
- plugins de canal
- hooks de ferramentas ou de ciclo de vida
- plugins de infraestrutura de agentes
- auxiliares confiáveis de runtime

Aplicativos externos não devem importar `openclaw/plugin-sdk/*`; esses subcaminhos destinam-se a
plugins carregados pelo OpenClaw.

## Relacionados

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Referência de RPC do Gateway](/pt-BR/reference/rpc)
- [Comando de agente da CLI](/pt-BR/cli/agent)
- [Comando de mensagem da CLI](/pt-BR/cli/message)
- [Loop do agente](/pt-BR/concepts/agent-loop)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Sessões](/pt-BR/concepts/session)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
