---
read_when:
    - Hospedando o PeekabooBridge no OpenClaw.app
    - Integração do Peekaboo via Swift Package Manager
    - Alterando o protocolo/os caminhos do PeekabooBridge
    - Escolhendo entre PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integração do PeekabooBridge para automação de interface do usuário no macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-05-06T09:05:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw pode hospedar **PeekabooBridge** como um broker local de automação de UI com reconhecimento de permissões. Isso permite que a CLI `peekaboo` conduza a automação de UI enquanto reutiliza as permissões TCC do app macOS.

## O que isto é (e o que não é)

- **Hospedeiro**: OpenClaw.app pode atuar como um hospedeiro PeekabooBridge.
- **Cliente**: use a CLI `peekaboo` (sem uma superfície `openclaw ui ...` separada).
- **UI**: as sobreposições visuais permanecem no Peekaboo.app; OpenClaw é um hospedeiro broker leve.

## Relação com Computer Use

OpenClaw tem três caminhos de controle de desktop, e eles permanecem separados intencionalmente:

- **Hospedeiro PeekabooBridge**: OpenClaw.app pode hospedar o soquete local do PeekabooBridge. A CLI `peekaboo` continua sendo o cliente e usa as permissões macOS do OpenClaw.app para primitivas de automação do Peekaboo, como capturas de tela, cliques, menus, diálogos, ações no Dock e gerenciamento de janelas.
- **Codex Computer Use**: o Plugin `codex` incluído prepara o servidor de app do Codex, verifica se o servidor MCP `computer-use` do Codex está disponível e então permite que o Codex assuma chamadas de ferramenta nativas de controle de desktop durante turnos no modo Codex. OpenClaw não encaminha essas ações pelo PeekabooBridge.
- **MCP direto do `cua-driver`**: OpenClaw pode registrar o servidor `cua-driver mcp` upstream da TryCua como um servidor MCP normal. Isso oferece aos agentes os esquemas próprios do driver CUA e o fluxo de trabalho de pid/janela/índice de elemento sem roteamento pelo marketplace do Codex ou pelo soquete do PeekabooBridge.

Use Peekaboo quando quiser a superfície ampla de automação do macOS e o hospedeiro de ponte do OpenClaw.app com reconhecimento de permissões. Use Codex Computer Use quando um agente em modo Codex deve depender do Plugin nativo de uso de computador do Codex. Use `cua-driver mcp` direto quando quiser que o driver CUA seja exposto a qualquer runtime gerenciado pelo OpenClaw como um servidor MCP normal.

## Habilitar a ponte

No app macOS:

- Ajustes → **Habilitar Peekaboo Bridge**

Quando habilitado, OpenClaw inicia um servidor de soquete UNIX local. Se desabilitado, o hospedeiro é interrompido e `peekaboo` recorrerá a outros hospedeiros disponíveis.

## Ordem de descoberta de clientes

Clientes Peekaboo normalmente tentam hospedeiros nesta ordem:

1. Peekaboo.app (UX completa)
2. Claude.app (se instalado)
3. OpenClaw.app (broker leve)

Use `peekaboo bridge status --verbose` para ver qual hospedeiro está ativo e qual caminho de soquete está em uso. Você pode substituir com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida **assinaturas de código do chamador**; uma lista de permissões de TeamIDs é aplicada (TeamID do hospedeiro Peekaboo + TeamID do app OpenClaw).
- As solicitações expiram após cerca de 10 segundos.
- Se as permissões necessárias estiverem ausentes, a ponte retorna uma mensagem de erro clara em vez de abrir os Ajustes do Sistema.

## Comportamento de snapshot (automação)

Snapshots são armazenados na memória e expiram automaticamente após uma janela curta. Se precisar de retenção mais longa, capture novamente a partir do cliente.

## Solução de problemas

- Se `peekaboo` relatar "bridge client is not authorized", garanta que o cliente esteja devidamente assinado ou execute o hospedeiro com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` somente no modo **debug**.
- Se nenhum hospedeiro for encontrado, abra um dos apps hospedeiros (Peekaboo.app ou OpenClaw.app) e confirme que as permissões foram concedidas.

## Relacionado

- [app macOS](/pt-BR/platforms/macos)
- [permissões do macOS](/pt-BR/platforms/mac/permissions)
