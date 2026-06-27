---
read_when:
    - Hospedando o PeekabooBridge no OpenClaw.app
    - Integrando o Peekaboo via Swift Package Manager
    - Alterando o protocolo/os caminhos do PeekabooBridge
    - Decidindo entre PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integração do PeekabooBridge para automação da interface do macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:43:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw pode hospedar o **PeekabooBridge** como um broker local de automação de UI ciente de permissões. Isso permite que a CLI `peekaboo` conduza a automação de UI enquanto reutiliza as permissões de TCC do app macOS.

## O que isto é (e não é)

- **Host**: OpenClaw.app pode atuar como um host do PeekabooBridge.
- **Client**: use a CLI `peekaboo` (sem uma superfície `openclaw ui ...` separada).
- **UI**: sobreposições visuais permanecem no Peekaboo.app; o OpenClaw é um host broker leve.

## Relação com Computer Use

O OpenClaw tem três caminhos de controle de desktop, e eles permanecem separados intencionalmente:

- **Host do PeekabooBridge**: OpenClaw.app pode hospedar o socket local do PeekabooBridge.
  A CLI `peekaboo` continua sendo o client e usa as permissões macOS do OpenClaw.app para primitivas de automação do Peekaboo, como capturas de tela, cliques, menus, diálogos, ações no Dock e gerenciamento de janelas.
- **Codex Computer Use**: o Plugin `codex` incluído prepara o servidor de app do Codex, verifica se o servidor MCP `computer-use` do Codex está disponível e então permite que o Codex seja responsável por chamadas de ferramentas nativas de controle de desktop durante turnos no modo Codex. O OpenClaw não encaminha essas ações por meio do PeekabooBridge.
- **MCP direto `cua-driver`**: o OpenClaw pode registrar o servidor upstream `cua-driver mcp` da TryCua como um servidor MCP normal. Isso fornece aos agentes os schemas próprios do driver CUA e o fluxo de trabalho de pid/janela/índice de elemento sem rotear pelo marketplace do Codex ou pelo socket do PeekabooBridge.

Use o Peekaboo quando quiser a ampla superfície de automação do macOS e o host de ponte ciente de permissões do OpenClaw.app. Use o Codex Computer Use quando um agente em modo Codex deve depender do Plugin nativo de computer-use do Codex. Use `cua-driver mcp` direto quando quiser expor o driver CUA a qualquer runtime gerenciado pelo OpenClaw como um servidor MCP normal.

## Ativar a ponte

No app macOS:

- Ajustes → **Ativar Peekaboo Bridge**

Quando ativado, o OpenClaw inicia um servidor de socket UNIX local. Se desativado, o host é interrompido e `peekaboo` voltará para outros hosts disponíveis.

## Ordem de descoberta do client

Clients do Peekaboo normalmente tentam hosts nesta ordem:

1. Peekaboo.app (UX completa)
2. Claude.app (se instalado)
3. OpenClaw.app (broker leve)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual caminho de socket está em uso. Você pode substituir com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida **assinaturas de código do chamador**; uma allowlist de TeamIDs é aplicada (TeamID do host Peekaboo + TeamID do app OpenClaw).
- Prefira a identidade assinada da ponte/app em vez de um runtime genérico `node` para Acessibilidade. Conceder Acessibilidade a `node` permite que qualquer pacote iniciado por esse executável Node herde acesso à automação de GUI; consulte [permissões do macOS](/pt-BR/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- As solicitações expiram após ~10 segundos.
- Se as permissões necessárias estiverem ausentes, a ponte retorna uma mensagem de erro clara em vez de abrir os Ajustes do Sistema.

## Comportamento de snapshots (automação)

Snapshots são armazenados na memória e expiram automaticamente após uma janela curta. Se precisar de retenção mais longa, capture novamente a partir do client.

## Solução de problemas

- Se `peekaboo` relatar "bridge client is not authorized", garanta que o client esteja devidamente assinado ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` apenas em modo **debug**.
- Se nenhum host for encontrado, abra um dos apps host (Peekaboo.app ou OpenClaw.app) e confirme que as permissões foram concedidas.

## Relacionados

- [app macOS](/pt-BR/platforms/macos)
- [permissões do macOS](/pt-BR/platforms/mac/permissions)
