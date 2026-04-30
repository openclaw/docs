---
read_when:
    - Hospedando o PeekabooBridge no OpenClaw.app
    - Integrando o Peekaboo por meio do Swift Package Manager
    - Alteração do protocolo/caminhos do PeekabooBridge
    - Escolhendo entre PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integração do PeekabooBridge para automação de interface do usuário no macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-04-30T09:57:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw pode hospedar o **PeekabooBridge** como um intermediador local de automação de interface ciente de permissões. Isso permite que a CLI `peekaboo` conduza a automação de interface enquanto reutiliza as permissões TCC do app macOS.

## O que isto é (e não é)

- **Hospedeiro**: OpenClaw.app pode atuar como um hospedeiro do PeekabooBridge.
- **Cliente**: use a CLI `peekaboo` (sem uma superfície `openclaw ui ...` separada).
- **Interface**: as sobreposições visuais permanecem no Peekaboo.app; OpenClaw é um hospedeiro intermediador leve.

## Relação com o Computer Use

OpenClaw tem três caminhos de controle de desktop, e eles permanecem separados intencionalmente:

- **Hospedeiro do PeekabooBridge**: OpenClaw.app pode hospedar o socket local do PeekabooBridge. A CLI `peekaboo` continua sendo o cliente e usa as permissões macOS do OpenClaw.app para primitivas de automação do Peekaboo, como capturas de tela, cliques, menus, diálogos, ações do Dock e gerenciamento de janelas.
- **Codex Computer Use**: o Plugin `codex` incluído prepara o servidor de app do Codex, verifica se o servidor MCP `computer-use` do Codex está disponível e, então, permite que o Codex controle chamadas de ferramentas nativas de controle de desktop durante turnos no modo Codex. OpenClaw não encaminha essas ações pelo PeekabooBridge.
- **MCP `cua-driver` direto**: OpenClaw pode registrar o servidor `cua-driver mcp` upstream da TryCua como um servidor MCP normal. Isso fornece aos agentes os próprios esquemas do driver CUA e o fluxo de trabalho de pid/janela/índice de elemento sem rotear pelo marketplace do Codex ou pelo socket do PeekabooBridge.

Use o Peekaboo quando quiser a ampla superfície de automação do macOS e o hospedeiro de ponte ciente de permissões do OpenClaw.app. Use o Codex Computer Use quando um agente em modo Codex deve depender do Plugin nativo de computer-use do Codex. Use `cua-driver mcp` direto quando quiser que o driver CUA seja exposto a qualquer runtime gerenciado pelo OpenClaw como um servidor MCP normal.

## Habilitar a ponte

No app macOS:

- Ajustes → **Habilitar Peekaboo Bridge**

Quando habilitado, OpenClaw inicia um servidor de socket UNIX local. Se desabilitado, o hospedeiro é interrompido e `peekaboo` recorrerá a outros hospedeiros disponíveis.

## Ordem de descoberta do cliente

Clientes Peekaboo normalmente tentam hospedeiros nesta ordem:

1. Peekaboo.app (UX completa)
2. Claude.app (se instalado)
3. OpenClaw.app (intermediador leve)

Use `peekaboo bridge status --verbose` para ver qual hospedeiro está ativo e qual caminho de socket está em uso. Você pode substituir com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida **assinaturas de código do chamador**; uma allowlist de TeamIDs é aplicada (TeamID do hospedeiro Peekaboo + TeamID do app OpenClaw).
- As solicitações expiram após cerca de 10 segundos.
- Se as permissões necessárias estiverem ausentes, a ponte retorna uma mensagem de erro clara em vez de abrir os Ajustes do Sistema.

## Comportamento de snapshots (automação)

Snapshots são armazenados na memória e expiram automaticamente após uma janela curta. Se precisar de retenção mais longa, capture novamente pelo cliente.

## Solução de problemas

- Se `peekaboo` relatar “bridge client is not authorized”, garanta que o cliente esteja assinado corretamente ou execute o hospedeiro com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` apenas no modo **debug**.
- Se nenhum hospedeiro for encontrado, abra um dos apps hospedeiros (Peekaboo.app ou OpenClaw.app) e confirme que as permissões foram concedidas.

## Relacionados

- [app macOS](/pt-BR/platforms/macos)
- [permissões macOS](/pt-BR/platforms/mac/permissions)
