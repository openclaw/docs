---
read_when:
    - Projetando a supervisão de frotas do Codex
    - Criando ferramentas do OpenClaw que leem, orientam ou iniciam sessões do Codex
    - Escolhendo entre implantação local, Cloudflare e VPS para Codex supervisionado
summary: Plano de supervisão de frota para sessões do servidor de aplicativos Codex controladas pelo OpenClaw.
title: Supervisor Claw
x-i18n:
    generated_at: "2026-06-27T18:11:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw Supervisor

## Objetivo

O Claw Supervisor permite que uma instância OpenClaw sempre ativa monitore e conduza uma frota de sessões Codex sem alterar a experiência normal do usuário do Codex. Um usuário pode acessar um host por SSH, iniciar o Codex, trabalhar na TUI e ainda assim fazer com que o supervisor leia a sessão, a conduza, a interrompa, crie sessões relacionadas e aceite transferências. Sessões Codex também podem chamar de volta para o OpenClaw por meio do MCP.

## Modelo do Produto

O Codex continua sendo a superfície principal de trabalho. O OpenClaw supervisiona o Codex em vez de esconder o Codex dentro de um subagente OpenClaw opaco.

O Plugin OpenClaw se chama `codex-supervisor`. `crabfleet` continua sendo o perfil de implantação
e frota de hosts para máquinas CRAB, em vez do nome do Plugin reutilizável.

O modelo tem três funções:

- Codex anexado a humano: uma TUI Codex interativa normal iniciada por meio de um app-server compartilhado.
- Codex autônomo: uma thread de app-server Codex criada pelo supervisor à qual um humano pode se anexar depois.
- Supervisor Claw: um agente OpenClaw sempre ativo com ferramentas para estado da frota, leitura de transcrições, condução, interrupção, criação e transferência.

O OpenClaw pode usar internamente seu maquinário existente de subagentes, mas o contrato externo é uma sessão Codex anexável com um id de thread Codex.

## Arquitetura

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Cada host compatível com Codex executa:

- Daemon do app-server Codex.
- Um launcher que sempre inicia o Codex interativo com `--remote`.
- Um conector que registra endpoints de app-server e threads ativas com o supervisor.

O supervisor executa:

- Registro de endpoints.
- Registro de sessões.
- Pool de clientes JSON-RPC do app-server Codex.
- Servidor MCP para chamadas de Codex para Claw.
- Ferramentas OpenClaw para controle de Claw para Codex.
- Motor de políticas para ações autônomas, aprovações e prevenção de loops.

## Contrato do App-Server Codex

Use as APIs do app-server Codex como plano de controle canônico:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

O Codex interativo deve ser iniciado com `codex --remote <endpoint>` para que a TUI e o supervisor se conectem ao mesmo app-server. `codex exec` independente não é uma sessão compartilhada ao vivo hoje; use APIs de app-server para trabalho autônomo até que o Codex ofereça suporte a `exec --remote`.

## Registro de Sessões

O supervisor armazena um registro por thread Codex observada:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

A implementação local pode derivar a maioria dos campos dos metadados da thread Codex. A implantação de frota deve enriquecer os registros com identidade do host, estado de anexação do usuário, estado do git e integridade do sidecar.

## Superfície MCP Para Codex

Todo Codex supervisionado recebe um servidor MCP chamado `openclaw-codex-supervisor`.

Ferramentas:

- `codex_sessions_list`: lista sessões Codex visíveis.
- `codex_session_read`: lê uma transcrição.
- `codex_session_send`: envia uma mensagem para uma thread ociosa ou conduz uma thread ativa.
- `codex_session_interrupt`: interrompe o turno ativo.
- `codex_endpoint_probe`: verifica a conectividade do endpoint.
- `claw_report_progress`: publica o estado atual da tarefa para o supervisor.
- `claw_ask`: pede ajuda ou delegação ao supervisor.
- `codex_spawn`: cria uma nova sessão Codex autônoma.
- `codex_handoff`: solicita tomada de controle por humano ou par.

Recursos:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Superfície de Controle do Claw

O Claw sempre ativo recebe as mesmas primitivas que as ferramentas internas:

- listar sessões e endpoints
- ler transcrições
- enviar/conduzir texto
- interromper trabalho ativo
- criar novas sessões
- resumir e atribuir sessões
- transmitir instruções para um grupo filtrado
- marcar sessões como bloqueadas, concluídas ou abandonadas

Comportamento da ferramenta:

- Se uma thread de destino estiver ociosa, `codex_session_send` é mapeado para `turn/start`.
- Se uma thread de destino estiver ativa e um id de turno em andamento estiver visível, ele é mapeado para `turn/steer`.
- Se o turno ativo não puder ser identificado, a ferramenta falha de forma fechada em vez de criar um turno não relacionado.
- Controles de escrita MCP expostos ao Codex permanecem desativados, a menos que uma política confiável apenas do supervisor os habilite.
- Leituras de transcrição bruta permanecem desativadas, a menos que uma política confiável apenas do supervisor as habilite.
- Aprovação autônoma por padrão nega aprovações de ferramentas/arquivos, a menos que uma política explícita diga o contrário.

## Fluxo de Inicialização

Login interativo no host:

1. O usuário acessa um host CRAB por SSH.
2. O serviço SSH inicia ou verifica `codex app-server daemon start`.
3. O wrapper de login inicia `codex --remote unix:// --cd <workspace>`.
4. O conector do host registra o endpoint e a thread carregada.
5. O supervisor emite um evento de frota de alta prioridade: nova sessão Codex, workspace, estado anexado a humano, prévia da tarefa atual.
6. O Supervisor Claw pode ler e conduzir imediatamente.

Criação autônoma:

1. O supervisor seleciona host e workspace.
2. O conector do host abre ou retoma uma thread de app-server Codex.
3. O supervisor inicia o primeiro turno com texto da tarefa e configuração MCP.
4. O registro de sessões a marca como autônoma e anexável.
5. Um humano pode se anexar depois com `codex --remote <endpoint> resume <threadId>` quando o Codex oferecer suporte a essa UX exata, ou pelo fluxo de retomada atual no mesmo app-server.

## Implantação

Plano de controle preferido:

- Conectores de host mantêm conexões WebSocket de saída com o supervisor.
- O estado do supervisor fica no armazenamento do OpenClaw Gateway.
- O app-server Codex permanece local a cada host; nunca exponha um app-server bruto sem autenticação à internet pública.

Viabilidade com Cloudflare:

- Bom para registro, durable objects, fan-in de WebSocket, roteamento leve de eventos e endpoints públicos de MCP/Gateway.
- Não é suficiente por si só para controle direto de hosts privados, porque Workers não conseguem discar sockets Unix privados arbitrários nem app-servers em local loopback.
- Use Cloudflare quando cada conector de host chamar para casa por WebSocket de saída.

Fallback com VPS:

- Use um serviço Hetzner quando controle de processo de longa duração, túneis SSH, roteamento de rede privada ou acesso ao sistema de arquivos local forem necessários.
- Mantenha o mesmo protocolo: conectores de host de saída, registro do supervisor central, app-server Codex local.

## Segurança

- O bind padrão é socket Unix local.
- App-server remoto usa token ou autenticação bearer assinada.
- O conector do host autentica-se no supervisor com um token de host com escopo.
- Ferramentas do supervisor aplicam política por sessão: leitura, condução, interrupção, criação, aprovação.
- Mensagens entre agentes incluem `originSessionId`; autoeco é descartado.
- Transmissão exige um filtro explícito e contagem limitada de destinos.
- Leituras de transcrição mascaram segredos na fronteira do OpenClaw.
- Solicitações de aprovação por padrão são negadas para turnos originados pelo supervisor, a menos que a política as permita.

## Plano de Implementação

Fase 1: MVP de supervisor local

- Adicionar cliente JSON-RPC do app-server Codex para proxy stdio e endpoints WebSocket.
- Adicionar registro de endpoints/sessões do supervisor.
- Adicionar ferramentas MCP: listar, ler, enviar, interromper, sondar.
- Adicionar configuração local de env para endpoints.
- Adicionar testes de app-server falso e um smoke local ao vivo de app-server.

Fase 2: Integração com OpenClaw

- Registrar ferramentas do supervisor no Plugin `codex-supervisor`.
- Injetar MCP do supervisor na configuração de thread Codex.
- Adicionar resumos de sessão ao contexto do agente.
- Adicionar notificações de evento quando novas threads Codex aparecerem.
- Adicionar configuração de política para envio/interrupção/criação autônomos.

Fase 3: Conector de frota

- Sidecar do host registra endpoint do app-server, metadados do host, metadados de git/workspace e estado de anexação humana.
- Adicionar conector WebSocket de saída para plano de controle Cloudflare ou VPS.
- Adicionar reconexão, Heartbeat e limpeza de sessões obsoletas.
- Adicionar wrapper de launcher SSH do CRAB.

Fase 4: Operação autônoma

- Adicionar fluxos de criação/retomada/tomada de controle.
- Adicionar transmissão e delegação.
- Adicionar relatórios de progresso e resumos de estado de tarefa.
- Adicionar prevenção de loops e limites de taxa.
- Adicionar visualizações de dashboard.

Fase 5: Multi-Claw

- Fragmentar sessões por grupo.
- Adicionar liderança/lease para cada sessão.
- Adicionar log de auditoria e replay.
- Adicionar escalonamento entre grupos Claw.

## Testes de Aceitação

- Um humano inicia a TUI Codex por meio de um app-server compartilhado.
- O supervisor lista a thread ativa via `thread/loaded/list`.
- O supervisor lê a transcrição via `thread/read`.
- O supervisor envia texto para uma thread ociosa via `turn/start`.
- O supervisor conduz uma thread ativa via `turn/steer`.
- A interrupção do supervisor para um turno ativo via `turn/interrupt`.
- O Codex chama o MCP do supervisor e lista sessões pares.
- Um Codex autônomo é criado e depois anexado a humano.
- A perda do conector de host marca sessões como obsoletas sem excluir o histórico.

## Perguntas em Aberto

- UX exata de anexação da TUI Codex para uma thread de app-server criada sem uma TUI.
- Se o Codex deve adicionar `exec --remote` para execuções headless compartilhadas ao vivo.
- Proprietário do estado durável: DB do OpenClaw Gateway, Cloudflare Durable Object ou banco de dados VPS.
- Granularidade da política de aprovação para turnos originados pelo supervisor.
- Quanto resumo de transcrição deve ser injetado no contexto do Claw sempre ativo versus mantido como ferramenta/recurso.
