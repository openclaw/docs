---
read_when:
    - Hospedar o PeekabooBridge em OpenClaw.app
    - Integrar o Peekaboo via Swift Package Manager
    - Alterar protocolo/caminhos do PeekabooBridge
summary: Integração do PeekabooBridge para automação de interface no macOS
title: Ponte PeekabooBridge
x-i18n:
    generated_at: "2026-04-24T06:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

O OpenClaw pode hospedar o **PeekabooBridge** como um broker local de automação de interface com reconhecimento de permissões. Isso permite que a CLI `peekaboo` conduza automação de interface reutilizando as permissões TCC do app do macOS.

## O que isso é (e não é)

- **Host**: o OpenClaw.app pode atuar como host do PeekabooBridge.
- **Cliente**: use a CLI `peekaboo` (não existe uma superfície separada `openclaw ui ...`).
- **UI**: overlays visuais permanecem no Peekaboo.app; o OpenClaw é um host broker fino.

## Ativar a ponte

No app do macOS:

- Configurações → **Enable Peekaboo Bridge**

Quando ativado, o OpenClaw inicia um servidor local de socket UNIX. Se desativado, o host
é interrompido e `peekaboo` fará fallback para outros hosts disponíveis.

## Ordem de descoberta do cliente

Clientes Peekaboo normalmente tentam hosts nesta ordem:

1. Peekaboo.app (experiência completa)
2. Claude.app (se instalado)
3. OpenClaw.app (broker fino)

Use `peekaboo bridge status --verbose` para ver qual host está ativo e qual
caminho de socket está em uso. Você pode sobrescrever com:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Segurança e permissões

- A ponte valida **assinaturas de código do chamador**; uma allowlist de TeamIDs é
  aplicada (TeamID do host Peekaboo + TeamID do app OpenClaw).
- As requisições atingem timeout após ~10 segundos.
- Se permissões necessárias estiverem ausentes, a ponte retorna uma mensagem de erro clara
  em vez de abrir as Configurações do Sistema.

## Comportamento de snapshot (automação)

Snapshots são armazenados em memória e expiram automaticamente após uma janela curta.
Se você precisar de retenção mais longa, recapture a partir do cliente.

## Solução de problemas

- Se `peekaboo` relatar “bridge client is not authorized”, certifique-se de que o cliente está
  corretamente assinado ou execute o host com `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  apenas em modo de **debug**.
- Se nenhum host for encontrado, abra um dos apps host (Peekaboo.app ou OpenClaw.app)
  e confirme que as permissões foram concedidas.

## Relacionado

- [App do macOS](/pt-BR/platforms/macos)
- [Permissões do macOS](/pt-BR/platforms/mac/permissions)
