---
read_when:
    - Editando contratos de IPC ou IPC do app da barra de menu
summary: Arquitetura de IPC do macOS para o app OpenClaw, transporte de node do gateway e PeekabooBridge
title: IPC do macOS
x-i18n:
    generated_at: "2026-04-24T06:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Arquitetura de IPC do macOS no OpenClaw

**Modelo atual:** um socket Unix local conecta o **serviço de host do node** ao **app macOS** para aprovações de exec + `system.run`. Existe uma CLI de depuração `openclaw-mac` para verificações de descoberta/conexão; ações do agente ainda fluem pelo WebSocket do Gateway e `node.invoke`. A automação de UI usa PeekabooBridge.

## Objetivos

- Uma única instância de app GUI que controla todo trabalho voltado a TCC (notificações, gravação de tela, microfone, fala, AppleScript).
- Uma pequena superfície para automação: Gateway + comandos de node, além de PeekabooBridge para automação de UI.
- Permissões previsíveis: sempre o mesmo bundle ID assinado, iniciado pelo launchd, para que as concessões de TCC persistam.

## Como funciona

### Transporte de Gateway + node

- O app executa o Gateway (modo local) e se conecta a ele como um node.
- Ações do agente são executadas via `node.invoke` (por exemplo `system.run`, `system.notify`, `canvas.*`).

### Serviço de node + IPC do app

- Um serviço headless de host do node se conecta ao WebSocket do Gateway.
- Solicitações de `system.run` são encaminhadas ao app macOS por um socket Unix local.
- O app executa o exec no contexto da UI, solicita confirmação se necessário e retorna a saída.

Diagrama (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automação de UI)

- A automação de UI usa um socket UNIX separado chamado `bridge.sock` e o protocolo JSON do PeekabooBridge.
- Ordem de preferência do host (lado do cliente): Peekaboo.app → Claude.app → OpenClaw.app → execução local.
- Segurança: hosts de bridge exigem um TeamID permitido; a válvula de escape de mesmo UID apenas para DEBUG é protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenção do Peekaboo).
- Consulte: [Uso do PeekabooBridge](/pt-BR/platforms/mac/peekaboo) para detalhes.

## Fluxos operacionais

- Reiniciar/rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Encerra instâncias existentes
  - Faz build + package em Swift
  - Grava/inicializa/reinicia o LaunchAgent
- Instância única: o app sai cedo se outra instância com o mesmo bundle ID estiver em execução.

## Observações de endurecimento

- Prefira exigir correspondência de TeamID para todas as superfícies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (apenas DEBUG) pode permitir chamadores com o mesmo UID para desenvolvimento local.
- Toda a comunicação permanece apenas local; nenhum socket de rede é exposto.
- Prompts de TCC se originam apenas do bundle do app GUI; mantenha o bundle ID assinado estável entre rebuilds.
- Endurecimento de IPC: modo do socket `0600`, token, verificações de UID do peer, desafio/resposta com HMAC, TTL curto.

## Relacionado

- [App macOS](/pt-BR/platforms/macos)
- [Fluxo de IPC do macOS (Aprovações de exec)](/pt-BR/tools/exec-approvals-advanced#macos-ipc-flow)
