---
read_when:
    - Você está criando um app externo, script, dashboard, job de CI ou extensão de IDE que se comunica com o OpenClaw
    - Você está escolhendo entre RPC do Gateway e o SDK do Plugin
    - Você está integrando com execuções de agentes, sessões, eventos, aprovações, modelos ou ferramentas do Gateway
sidebarTitle: External apps
summary: Caminho de integração atual para apps externos, scripts, painéis, tarefas de CI e extensões de IDE
title: Integrações do Gateway para apps externos
x-i18n:
    generated_at: "2026-06-27T17:30:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Aplicativos externos devem falar com o OpenClaw pelo protocolo Gateway hoje. Use
métodos WebSocket e RPC do Gateway quando um script, painel, job de CI, extensão
de IDE ou outro processo quiser iniciar execuções de agentes, transmitir eventos, aguardar
resultados, cancelar trabalho ou inspecionar recursos do Gateway.

<Warning>
  Ainda não há um pacote cliente npm público. Não adicione nomes de pacotes
  cliente do OpenClaw como dependências de aplicação até que as notas de versão anunciem um pacote
  publicado e esta página inclua instruções de instalação.
</Warning>

<Note>
  Esta página é para código fora do processo do OpenClaw. Código de Plugin que roda
  dentro do OpenClaw deve usar os subcaminhos documentados `openclaw/plugin-sdk/*`.
</Note>

## O que está disponível hoje

| Superfície                              | Status | Use para                                                                                         |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| [Protocolo Gateway](/pt-BR/gateway/protocol)  | Pronto | Transporte WebSocket, handshake de conexão, escopos de autenticação, versionamento de protocolo e eventos. |
| [Referência RPC do Gateway](/pt-BR/reference/rpc) | Pronto | Métodos atuais do Gateway para agentes, sessões, tarefas, modelos, ferramentas, artefatos e aprovações. |
| [`openclaw agent`](/pt-BR/cli/agent)          | Pronto | Integração de script de execução única quando chamar a CLI via shell é suficiente.                |
| [`openclaw message`](/pt-BR/cli/message)      | Pronto | Enviar mensagens ou ações de canal a partir de scripts.                                          |

A árvore de código-fonte contém trabalho de pacote interno para uma futura biblioteca cliente, mas
isso não é uma superfície de instalação pública. Trate-o como detalhe de implementação em prévia
até que os pacotes sejam publicados e versionados.

## Caminho recomendado

1. Execute ou descubra um Gateway.
2. Conecte-se pelo [protocolo Gateway](/pt-BR/gateway/protocol).
3. Chame métodos RPC documentados da [referência RPC do Gateway](/pt-BR/reference/rpc).
4. Fixe a versão do OpenClaw contra a qual você testa.
5. Verifique novamente a referência RPC ao atualizar o OpenClaw.

Para execuções de agentes, comece com o RPC `agent` e combine-o com `agent.wait` quando
você precisar de um resultado terminal. Para estado de conversa durável, use os métodos
`sessions.*`. Para integrações de UI, assine eventos do Gateway e renderize apenas as
famílias de eventos que seu app entende.

## Código de app versus código de Plugin

Use RPC do Gateway quando o código vive fora do OpenClaw:

- scripts Node que iniciam ou observam execuções de agentes
- jobs de CI que chamam um Gateway
- dashboards e painéis administrativos
- extensões de IDE
- bridges externos que não precisam se tornar plugins de canal
- testes de integração com transportes Gateway falsos ou reais

Use o SDK de Plugin quando o código roda dentro do OpenClaw:

- plugins de provedor
- plugins de canal
- hooks de ferramenta ou ciclo de vida
- plugins de harness de agente
- auxiliares de runtime confiáveis

Aplicativos externos não devem importar `openclaw/plugin-sdk/*`; esses subcaminhos são para
plugins carregados pelo OpenClaw.

## Relacionado

- [Protocolo Gateway](/pt-BR/gateway/protocol)
- [Referência RPC do Gateway](/pt-BR/reference/rpc)
- [Comando de agente da CLI](/pt-BR/cli/agent)
- [Comando de mensagem da CLI](/pt-BR/cli/message)
- [Loop de agente](/pt-BR/concepts/agent-loop)
- [Runtimes de agentes](/pt-BR/concepts/agent-runtimes)
- [Sessões](/pt-BR/concepts/session)
- [Tarefas em segundo plano](/pt-BR/automation/tasks)
- [Agentes ACP](/pt-BR/tools/acp-agents)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
