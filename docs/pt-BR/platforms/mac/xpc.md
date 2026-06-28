---
read_when:
    - Edição de contratos IPC ou IPC do aplicativo da barra de menus
summary: Arquitetura de IPC do macOS para o app OpenClaw, transporte de nó do gateway e PeekabooBridge
title: macOS IPC
x-i18n:
    generated_at: "2026-06-28T00:12:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Arquitetura de IPC do OpenClaw no macOS

**Modelo atual:** um soquete Unix local conecta o **serviço host de nó** ao **app macOS** para aprovações de exec + `system.run`. Existe uma CLI de depuração `openclaw-mac` para verificações de descoberta/conexão; as ações do agente ainda fluem pelo WebSocket do Gateway e por `node.invoke`. A automação de UI usa PeekabooBridge.

## Objetivos

- Uma única instância do app GUI que controla todo o trabalho voltado ao TCC (notificações, gravação de tela, microfone, fala, AppleScript).
- Uma superfície pequena para automação: Gateway + comandos de nó, além do PeekabooBridge para automação de UI.
- Permissões previsíveis: sempre o mesmo ID de pacote assinado, iniciado pelo launchd, para que as concessões do TCC persistam.

## Como funciona

### Transporte Gateway + nó

- O app executa o Gateway (modo local) e se conecta a ele como um nó.
- As ações do agente são executadas via `node.invoke` (por exemplo, `system.run`, `system.notify`, `canvas.*`).
- Comandos comuns do nó no Mac incluem `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` e `system.notify`.
- O nó informa um mapa `permissions` para que agentes possam ver se acesso a tela,
  câmera, microfone, fala, automação ou acessibilidade está disponível.

### Serviço de nó + IPC do app

- Um serviço host de nó sem interface se conecta ao WebSocket do Gateway.
- Solicitações `system.run` são encaminhadas ao app macOS por um soquete Unix local.
- O app executa o exec no contexto da UI, solicita aprovação se necessário e retorna a saída.

Diagrama (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automação de UI)

- A automação de UI usa um soquete UNIX separado chamado `bridge.sock` e o protocolo JSON do PeekabooBridge.
- Ordem de preferência de host (no lado do cliente): Peekaboo.app → Claude.app → OpenClaw.app → execução local.
- Segurança: hosts de bridge exigem um TeamID permitido; a saída de emergência DEBUG-only para mesmo UID é protegida por `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenção do Peekaboo).
- Veja: [Uso do PeekabooBridge](/pt-BR/platforms/mac/peekaboo) para detalhes.

## Fluxos operacionais

- Reiniciar/recompilar: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Encerra instâncias existentes
  - Build Swift + pacote
  - Grava/inicializa/reinicia o LaunchAgent
- Instância única: o app sai antecipadamente se outra instância com o mesmo ID de pacote estiver em execução.

## Notas de reforço de segurança

- Prefira exigir correspondência de TeamID para todas as superfícies privilegiadas.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) pode permitir chamadores com o mesmo UID para desenvolvimento local.
- Toda a comunicação permanece somente local; nenhum soquete de rede é exposto.
- Prompts do TCC se originam somente do pacote do app GUI; mantenha o ID de pacote assinado estável entre recompilações.
- Reforço de IPC: modo de soquete `0600`, token, verificações de peer-UID, desafio/resposta HMAC, TTL curto.

## Relacionado

- [App macOS](/pt-BR/platforms/macos)
- [Fluxo de IPC do macOS (aprovações de exec)](/pt-BR/tools/exec-approvals-advanced#macos-ipc-flow)
