---
read_when:
    - Hospedagem do PeekabooBridge no OpenClaw.app
    - Integração do Peekaboo via Swift Package Manager
    - Alteração do protocolo/dos caminhos do PeekabooBridge
    - Como decidir entre PeekabooBridge, Codex Computer Use e cua-driver MCP
summary: Integração com o PeekabooBridge para automação da interface do macOS
title: Ponte Peekaboo
x-i18n:
    generated_at: "2026-07-16T12:37:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

O OpenClaw pode hospedar o **PeekabooBridge** como um broker local de automação de UI com reconhecimento de permissões (`PeekabooBridgeHostCoordinator`, baseado no pacote Swift `steipete/Peekaboo`). Isso permite que a CLI `peekaboo` controle a automação de UI enquanto reutiliza as permissões TCC do aplicativo para macOS.

## O que é (e o que não é)

- **Host**: o OpenClaw.app pode atuar como host do PeekabooBridge.
- **Cliente**: a CLI `peekaboo` (não há uma interface `openclaw ui ...` separada).
- **UI**: as sobreposições visuais permanecem no Peekaboo.app; o OpenClaw é um host broker leve.

## Relação com outros caminhos de controle da área de trabalho

O OpenClaw tem quatro caminhos de controle da área de trabalho que são mantidos separados intencionalmente:

- **Host do PeekabooBridge**: o OpenClaw.app hospeda o socket local do PeekabooBridge. A CLI `peekaboo` é o cliente e usa as permissões do OpenClaw.app no macOS para capturas de tela, cliques, menus, caixas de diálogo, ações no Dock e gerenciamento de janelas.
- **Uso do computador controlado pelo agente (`computer.act`)**: a ferramenta integrada `computer` do agente do Gateway captura telas por meio de `screen.snapshot` e controla o ponteiro e o teclado usando o perigoso comando de Node `computer.act`. Um Node do macOS atende a `computer.act` no processo usando os serviços de automação incorporados do Peekaboo que essa ponte expõe, além de primitivas restritas do CoreGraphics, sem passar pelo socket do PeekabooBridge nem pela CLI `peekaboo`. Consulte [Uso do computador](/pt-BR/nodes/computer-use).
- **Codex Computer Use**: o Plugin `codex` incluído verifica e pode instalar o Plugin MCP `computer-use` do Codex (`extensions/codex/src/app-server/computer-use.ts`) e, em seguida, permite que o Codex controle as chamadas de ferramentas nativas de controle da área de trabalho durante turnos no modo Codex. O OpenClaw não encaminha essas ações por meio do PeekabooBridge.
- **MCP `cua-driver` direto**: o OpenClaw pode registrar o servidor `cua-driver mcp` upstream da TryCua como um servidor MCP normal, fornecendo aos agentes os próprios esquemas e o fluxo de trabalho de pid/janela/índice de elemento do driver CUA, sem roteamento pelo marketplace do Codex nem pelo socket do PeekabooBridge.

Use o Peekaboo para a ampla interface de automação do macOS por meio do host de ponte com reconhecimento de permissões do OpenClaw.app. Use o uso do computador controlado pelo agente quando o agente do Gateway precisar ver e controlar a área de trabalho por meio de um comando uniforme de Node `computer.act` que qualquer modelo de visão possa controlar. Use o Codex Computer Use quando um agente no modo Codex precisar utilizar o Plugin nativo do Codex. Use `cua-driver mcp` direto para expor o driver CUA a qualquer runtime gerenciado pelo OpenClaw como um servidor MCP normal.

## Ativar a ponte

No aplicativo para macOS: **Settings -> Enable Peekaboo Bridge**. A opção exige que **Allow Computer Control** esteja ativado, pois ambos concedem automação local da UI; com o Computer Control desativado, a opção fica desabilitada e o host não é executado. Para controlar o Peekaboo sem o Computer Control, execute o próprio aplicativo do Peekaboo para Mac como host.

Quando ativado (e com o Computer Control ligado), o OpenClaw inicia um servidor de socket UNIX local em `~/Library/Application Support/OpenClaw/<socket-name>`. Se estiver desativado, o host para e `peekaboo` recorre a outros hosts disponíveis. O coordenador também mantém links simbólicos de sockets legados (`clawdbot`, `clawdis`, `moltbot` em Application Support) apontando para o socket atual para instalações mais antigas do `peekaboo`.

## Ordem de descoberta de clientes

Os clientes do Peekaboo normalmente tentam os hosts nesta ordem:

1. Peekaboo.app (experiência completa)
2. Claude.app (se instalado)
3. OpenClaw.app (broker leve)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual caminho de socket está em uso. Substitua com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida as **assinaturas de código do chamador**; uma lista de permissões de TeamIDs é aplicada (o TeamID do host do Peekaboo mais o TeamID do próprio aplicativo em execução).
- Prefira a identidade assinada da ponte/do aplicativo em vez de um runtime genérico `node` para Acessibilidade. Conceder Acessibilidade a `node` permite que qualquer pacote iniciado por esse executável do Node herde acesso à automação da GUI; consulte [permissões do macOS](/pt-BR/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- As solicitações expiram após 10 segundos (`requestTimeoutSec: 10`).
- Se as permissões necessárias estiverem ausentes, a ponte retornará uma mensagem de erro clara em vez de abrir os Ajustes do Sistema.

## Comportamento dos snapshots (automação)

Os snapshots são armazenados na memória com uma janela de validade de 10 minutos e um limite de 50 snapshots (`InMemorySnapshotManager`); os artefatos não são excluídos durante a limpeza. Se precisar de retenção mais longa, faça uma nova captura pelo cliente.

## Solução de problemas

- Se `peekaboo` informar "o cliente da ponte não está autorizado", verifique se o cliente está assinado corretamente ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` somente no modo **debug**.
- Se nenhum host for encontrado, abra um dos aplicativos host (Peekaboo.app ou OpenClaw.app) e confirme que as permissões foram concedidas.

## Relacionados

- [aplicativo para macOS](/pt-BR/platforms/macos)
- [permissões do macOS](/pt-BR/platforms/mac/permissions)
