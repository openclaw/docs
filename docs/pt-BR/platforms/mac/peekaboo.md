---
read_when:
    - Hospedagem do PeekabooBridge no OpenClaw.app
    - Integração do Peekaboo via Swift Package Manager
    - Alteração do protocolo/dos caminhos do PeekabooBridge
    - Decidindo entre PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integração com o PeekabooBridge para automação da interface do usuário no macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-07-12T15:24:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

O OpenClaw pode hospedar o **PeekabooBridge** como um broker local de automação de interface, ciente das permissões (`PeekabooBridgeHostCoordinator`, apoiado pelo pacote Swift `steipete/Peekaboo`). Isso permite que a CLI `peekaboo` execute automações de interface reutilizando as permissões TCC do aplicativo para macOS.

## O que isto é (e o que não é)

- **Host**: o OpenClaw.app pode atuar como host do PeekabooBridge.
- **Cliente**: a CLI `peekaboo` (não há uma interface `openclaw ui ...` separada).
- **Interface**: as sobreposições visuais permanecem no Peekaboo.app; o OpenClaw é um host broker simples.

## Relação com outros métodos de controle da área de trabalho

O OpenClaw tem quatro métodos de controle da área de trabalho que são mantidos separados intencionalmente:

- **Host do PeekabooBridge**: o OpenClaw.app hospeda o socket local do PeekabooBridge. A CLI `peekaboo` é o cliente e usa as permissões do OpenClaw.app no macOS para capturas de tela, cliques, menus, caixas de diálogo, ações no Dock e gerenciamento de janelas.
- **Uso do computador orientado pelo agente (`computer.act`)**: a ferramenta `computer` integrada ao agente do Gateway captura telas por meio de `screen.snapshot` e controla o ponteiro e o teclado pelo comando perigoso de Node `computer.act`. Um Node do macOS executa `computer.act` no próprio processo usando os serviços de automação incorporados do Peekaboo que essa ponte disponibiliza, além de primitivas específicas do CoreGraphics, sem passar pelo socket do PeekabooBridge nem pela CLI `peekaboo`. Consulte [Uso do computador](/nodes/computer-use).
- **Uso do computador pelo Codex**: o Plugin `codex` incluído verifica e pode instalar o Plugin MCP `computer-use` do Codex (`extensions/codex/src/app-server/computer-use.ts`) e permite que o Codex controle as chamadas de ferramentas nativas de controle da área de trabalho durante turnos no modo Codex. O OpenClaw não encaminha essas ações pelo PeekabooBridge.
- **MCP `cua-driver` direto**: o OpenClaw pode registrar o servidor `cua-driver mcp` upstream da TryCua como um servidor MCP normal, disponibilizando aos agentes os próprios esquemas e o fluxo de trabalho de PID/janela/índice de elementos do driver CUA, sem encaminhamento pelo marketplace do Codex nem pelo socket do PeekabooBridge.

Use o Peekaboo para acessar a ampla superfície de automação do macOS pelo host de ponte ciente das permissões do OpenClaw.app. Use o controle do computador orientado pelo agente quando o agente do Gateway precisar visualizar e controlar a área de trabalho por meio de um comando de Node `computer.act` uniforme, que qualquer modelo de visão possa controlar. Use o Uso do Computador pelo Codex quando um agente no modo Codex precisar utilizar o Plugin nativo do Codex. Use o `cua-driver mcp` direto para disponibilizar o driver CUA a qualquer runtime gerenciado pelo OpenClaw como um servidor MCP normal.

## Ativar a ponte

No aplicativo para macOS: **Settings -> Enable Peekaboo Bridge**.

Quando ativado, o OpenClaw inicia um servidor de socket UNIX local em `~/Library/Application Support/OpenClaw/<socket-name>`. Se estiver desativado, o host é interrompido e o `peekaboo` passa a usar outros hosts disponíveis. O coordenador também mantém links simbólicos de sockets legados (`clawdbot`, `clawdis`, `moltbot` em Application Support) apontando para o socket atual, para instalações mais antigas do `peekaboo`.

## Ordem de descoberta de clientes

Os clientes do Peekaboo normalmente tentam os hosts nesta ordem:

1. Peekaboo.app (experiência completa)
2. Claude.app (se estiver instalado)
3. OpenClaw.app (broker simples)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual caminho de socket está em uso. Substitua-o com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida as **assinaturas de código dos chamadores**; uma lista de permissões de TeamIDs é aplicada (o TeamID do host Peekaboo e o TeamID do próprio aplicativo em execução).
- Prefira a identidade assinada da ponte/do aplicativo em vez de um runtime `node` genérico para Acessibilidade. Conceder Acessibilidade ao `node` permite que qualquer pacote iniciado por esse executável do Node herde o acesso à automação da interface gráfica; consulte [permissões do macOS](/pt-BR/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- As solicitações expiram após 10 segundos (`requestTimeoutSec: 10`).
- Se as permissões necessárias estiverem ausentes, a ponte retornará uma mensagem de erro clara em vez de abrir os Ajustes do Sistema.

## Comportamento dos snapshots (automação)

Os snapshots são armazenados na memória com uma janela de validade de 10 minutos e um limite de 50 snapshots (`InMemorySnapshotManager`); os artefatos não são excluídos durante a limpeza. Se precisar de retenção mais longa, faça uma nova captura pelo cliente.

## Solução de problemas

- Se o `peekaboo` informar "o cliente da ponte não está autorizado", verifique se o cliente está devidamente assinado ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` somente no modo de **depuração**.
- Se nenhum host for encontrado, abra um dos aplicativos host (Peekaboo.app ou OpenClaw.app) e confirme se as permissões foram concedidas.

## Relacionado

- [aplicativo para macOS](/pt-BR/platforms/macos)
- [permissões do macOS](/pt-BR/platforms/mac/permissions)
