---
read_when:
    - Editando contratos de IPC ou o IPC do aplicativo da barra de menus
summary: Arquitetura de IPC do macOS para o aplicativo OpenClaw, transporte de Node do Gateway e PeekabooBridge
title: IPC do macOS
x-i18n:
    generated_at: "2026-07-12T00:06:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arquitetura de IPC do OpenClaw no macOS

Um socket Unix local conecta o serviço host do Node ao aplicativo para macOS para aprovações de execução e `system.run`. Uma CLI de depuração `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) está disponível para verificações de descoberta/conexão; as ações do agente ainda fluem pelo WebSocket do Gateway e por `node.invoke`. O caminho `computer.act` apoiado pelo Node executa a automação integrada do Peekaboo no processo; clientes autônomos do Peekaboo usam o PeekabooBridge.

## Objetivos

- Uma única instância do aplicativo com interface gráfica, responsável por todo o trabalho voltado ao TCC (notificações, gravação de tela, microfone, fala e AppleScript).
- Uma pequena superfície para automação: Gateway + comandos do Node, `computer.act` no processo e PeekabooBridge para clientes autônomos de automação da interface.
- Permissões previsíveis: sempre o mesmo ID de pacote assinado, iniciado pelo launchd, para que as concessões do TCC sejam mantidas.

## Como funciona

### Transporte do Gateway + Node

- O aplicativo executa o Gateway (modo local) e se conecta a ele como um Node.
- As ações do agente são realizadas por meio de `node.invoke` (por exemplo, `system.run`, `system.notify`, `canvas.*`).
- Os comandos do Node incluem `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` e `system.notify`.
- O Node informa um mapa `permissions` para que os agentes possam verificar se o acesso à tela, câmera, microfone, fala, automação ou acessibilidade está disponível.

### Serviço do Node + IPC do aplicativo

- Um serviço host do Node sem interface gráfica se conecta ao WebSocket do Gateway.
- As solicitações `system.run` são encaminhadas ao aplicativo para macOS por um socket Unix local (`ExecApprovalsSocket.swift`).
- O aplicativo realiza a execução no contexto da interface, solicita confirmação se necessário e retorna a saída.

Diagrama (SCI):

```text
Agente -> Gateway -> Serviço do Node (WS)
                       |  IPC (UDS + token + HMAC + TTL)
                       v
                   Aplicativo para Mac (interface + TCC + system.run)
```

### PeekabooBridge (automação da interface)

- A ferramenta `computer` integrada do agente **não** usa esse socket. Um Node do macOS emparelhado realiza `computer.act` no processo do aplicativo com serviços integrados do Peekaboo.
- A automação da interface usa um socket UNIX separado (`~/Library/Application Support/OpenClaw/<socket>`) e o protocolo JSON do PeekabooBridge.
- Ordem de preferência de host (no lado do cliente): Peekaboo.app -> Claude.app -> OpenClaw.app -> execução local.
- Segurança: os hosts da ponte exigem um TeamID incluído na lista de permissões (o `PeekabooBridgeHostCoordinator` fornecido inclui na lista uma equipe fixa e a própria equipe de assinatura do aplicativo); uma alternativa restrita a DEBUG para o mesmo UID é protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenção do Peekaboo).
- Consulte: [Uso do PeekabooBridge](/pt-BR/platforms/mac/peekaboo) para obter detalhes.

## Fluxos operacionais

- Reinicialização/recompilação: `scripts/restart-mac.sh` encerra as instâncias existentes, recompila por meio do Swift, reempacota e reinicia. Ele detecta automaticamente uma identidade de assinatura disponível e usa `--no-sign` como alternativa se nenhuma for encontrada; passe `--sign` para exigir assinatura (falha se nenhuma chave estiver disponível) ou `--no-sign` para forçar o caminho sem assinatura. A variável `SIGN_IDENTITY` definida no ambiente é removida no caminho assinado, para que a detecção automática de identidade do próprio `scripts/codesign-mac-app.sh` selecione o certificado.
- Instância única: o aplicativo verifica `NSWorkspace.runningApplications` em busca de um ID de pacote duplicado e encerra se mais de uma instância for encontrada (`isDuplicateInstance()` em `MenuBar.swift`).

## Notas de reforço de segurança

- Prefira exigir uma correspondência de TeamID para todas as superfícies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (somente DEBUG) pode permitir chamadores com o mesmo UID para desenvolvimento local.
- Toda a comunicação permanece exclusivamente local; nenhum socket de rede é exposto.
- As solicitações do TCC são originadas somente pelo pacote do aplicativo com interface gráfica; mantenha o ID de pacote assinado estável entre recompilações.
- Reforço de segurança do socket de aprovações de execução: modo de arquivo `0600`, token compartilhado, verificação do UID do par (`getpeereid`), desafio/resposta HMAC-SHA256 e um TTL curto para as solicitações.

## Relacionado

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Fluxo de IPC do macOS (aprovações de execução)](/pt-BR/tools/exec-approvals-advanced#macos-ipc-flow)
