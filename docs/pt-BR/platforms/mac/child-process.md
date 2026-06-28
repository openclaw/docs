---
read_when:
    - Integrando o aplicativo para Mac com o ciclo de vida do Gateway
summary: Ciclo de vida do Gateway no macOS (launchd)
title: Ciclo de vida do Gateway no macOS
x-i18n:
    generated_at: "2026-05-06T06:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

O app para macOS **gerencia o Gateway via launchd** por padrão e não inicia
o Gateway como um processo filho. Primeiro, ele tenta se conectar a um
Gateway já em execução na porta configurada; se nenhum estiver acessível, ele habilita o serviço
launchd via CLI externa `openclaw` (sem runtime incorporado). Isso fornece
inicialização automática confiável no login e reinicialização em caso de falhas.

O modo de processo filho (Gateway iniciado diretamente pelo app) **não está em uso** hoje.
Se você precisa de um acoplamento mais estreito com a UI, execute o Gateway manualmente em um terminal.

## Comportamento padrão (launchd)

- O app instala um LaunchAgent por usuário rotulado como `ai.openclaw.gateway`
  (ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` é compatível).
- Quando o modo Local está habilitado, o app garante que o LaunchAgent esteja carregado e
  inicia o Gateway se necessário.
- Os logs são gravados no caminho de log do gateway do launchd (visível nas Configurações de depuração).

Comandos comuns:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar um perfil nomeado.

## Builds de desenvolvimento não assinadas

`scripts/restart-mac.sh --no-sign` é usado para builds locais rápidas quando você não tem
chaves de assinatura. Para impedir que o launchd aponte para um binário de retransmissão não assinado, ele:

- Grava `~/.openclaw/disable-launchagent`.

Execuções assinadas de `scripts/restart-mac.sh` removem essa substituição se o marcador estiver
presente. Para redefinir manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo somente conexão

Para forçar o app para macOS a **nunca instalar nem gerenciar o launchd**, inicie-o com
`--attach-only` (ou `--no-launchd`). Isso define `~/.openclaw/disable-launchagent`,
então o app apenas se conecta a um Gateway já em execução. Você pode alternar o mesmo
comportamento nas Configurações de depuração.

## Modo remoto

O modo remoto nunca inicia um Gateway local. O app usa um túnel SSH para o
host remoto e se conecta por esse túnel.

## Por que preferimos launchd

- Inicialização automática no login.
- Semântica integrada de reinicialização/KeepAlive.
- Logs e supervisão previsíveis.

Se um verdadeiro modo de processo filho for necessário novamente algum dia, ele deverá ser documentado como um
modo separado, explícito e exclusivo para desenvolvimento.

## Relacionado

- [app para macOS](/pt-BR/platforms/macos)
- [runbook do Gateway](/pt-BR/gateway)
