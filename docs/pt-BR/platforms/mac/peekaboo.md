---
read_when:
    - Hospedagem do PeekabooBridge no OpenClaw.app
    - Integração do Peekaboo pelo Swift Package Manager
    - Alteração do protocolo/dos caminhos do PeekabooBridge
    - Como decidir entre PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integração com o PeekabooBridge para automação da interface do usuário no macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-07-12T00:04:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

O OpenClaw pode hospedar o **PeekabooBridge** como um intermediário local de automação de interface, com reconhecimento de permissões (`PeekabooBridgeHostCoordinator`, baseado no pacote Swift `steipete/Peekaboo`). Isso permite que a CLI `peekaboo` controle a automação da interface reutilizando as permissões TCC do aplicativo para macOS.

## O que isto é (e o que não é)

- **Host**: o OpenClaw.app pode atuar como host do PeekabooBridge.
- **Cliente**: a CLI `peekaboo` (não há uma interface `openclaw ui ...` separada).
- **Interface**: as sobreposições visuais permanecem no Peekaboo.app; o OpenClaw é um host intermediário simples.

## Relação com outros métodos de controle da área de trabalho

O OpenClaw tem quatro métodos de controle da área de trabalho que são intencionalmente mantidos separados:

- **Host do PeekabooBridge**: o OpenClaw.app hospeda o soquete local do PeekabooBridge. A CLI `peekaboo` é o cliente e usa as permissões do OpenClaw.app no macOS para capturas de tela, cliques, menus, caixas de diálogo, ações do Dock e gerenciamento de janelas.
- **Uso do computador controlado pelo agente (`computer.act`)**: a ferramenta `computer` integrada ao agente do Gateway captura telas por meio de `screen.snapshot` e controla o ponteiro e o teclado usando o perigoso comando de Node `computer.act`. Um Node do macOS executa `computer.act` no próprio processo usando os serviços incorporados de automação do Peekaboo expostos por esta ponte, além de primitivas restritas do CoreGraphics, sem passar pelo soquete do PeekabooBridge nem pela CLI `peekaboo`. Consulte [Uso do computador](/nodes/computer-use).
- **Uso do computador pelo Codex**: o plugin `codex` incluído verifica e pode instalar o plugin MCP `computer-use` do Codex (`extensions/codex/src/app-server/computer-use.ts`) e, em seguida, permite que o Codex controle as chamadas de ferramentas nativas de controle da área de trabalho durante as interações no modo Codex. O OpenClaw não encaminha essas ações pelo PeekabooBridge.
- **MCP `cua-driver` direto**: o OpenClaw pode registrar o servidor `cua-driver mcp` original do TryCua como um servidor MCP normal, fornecendo aos agentes os próprios esquemas do driver CUA e o fluxo de trabalho de PID/janela/índice de elementos, sem encaminhamento pelo marketplace do Codex nem pelo soquete do PeekabooBridge.

Use o Peekaboo para a ampla gama de automações do macOS por meio do host de ponte com reconhecimento de permissões do OpenClaw.app. Use o controle do computador pelo agente quando o agente do Gateway precisar visualizar e controlar a área de trabalho por meio de um comando uniforme de Node `computer.act`, que pode ser controlado por qualquer modelo de visão. Use o Uso do Computador pelo Codex quando um agente no modo Codex precisar depender do plugin nativo do Codex. Use `cua-driver mcp` diretamente para disponibilizar o driver CUA a qualquer ambiente de execução gerenciado pelo OpenClaw como um servidor MCP normal.

## Ativar a ponte

No aplicativo para macOS: **Settings -> Enable Peekaboo Bridge**.

Quando ativada, o OpenClaw inicia um servidor de soquete UNIX local em `~/Library/Application Support/OpenClaw/<socket-name>`. Quando desativada, o host é interrompido e o `peekaboo` recorre a outros hosts disponíveis. O coordenador também mantém links simbólicos de soquetes legados (`clawdbot`, `clawdis` e `moltbot` em Application Support) apontando para o soquete atual, para instalações mais antigas do `peekaboo`.

## Ordem de descoberta de clientes

Os clientes do Peekaboo geralmente tentam acessar os hosts nesta ordem:

1. Peekaboo.app (experiência completa)
2. Claude.app (se instalado)
3. OpenClaw.app (intermediário simples)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual caminho de soquete está em uso. Substitua-o com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida as **assinaturas de código dos chamadores**; uma lista de permissões de TeamIDs é aplicada (o TeamID do host do Peekaboo e o TeamID do próprio aplicativo em execução).
- Prefira a identidade assinada da ponte/do aplicativo em vez de um ambiente de execução `node` genérico para Acessibilidade. Conceder Acessibilidade ao `node` permite que qualquer pacote iniciado por esse executável do Node herde o acesso à automação da interface gráfica; consulte [permissões do macOS](/pt-BR/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- As solicitações expiram após 10 segundos (`requestTimeoutSec: 10`).
- Se as permissões necessárias estiverem ausentes, a ponte retorna uma mensagem de erro clara em vez de abrir os Ajustes do Sistema.

## Comportamento dos snapshots (automação)

Os snapshots são armazenados na memória com uma janela de validade de 10 minutos e um limite de 50 snapshots (`InMemorySnapshotManager`); os artefatos não são excluídos durante a limpeza. Se precisar retê-los por mais tempo, faça uma nova captura pelo cliente.

## Solução de problemas

- Se o `peekaboo` informar "o cliente da ponte não está autorizado", verifique se o cliente está devidamente assinado ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` somente no modo de **depuração**.
- Se nenhum host for encontrado, abra um dos aplicativos host (Peekaboo.app ou OpenClaw.app) e confirme que as permissões foram concedidas.

## Relacionados

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
