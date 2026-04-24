---
read_when:
    - Integrando o app para Mac com o ciclo de vida do Gateway
summary: Ciclo de vida do Gateway no macOS (launchd)
title: Ciclo de vida do Gateway
x-i18n:
    generated_at: "2026-04-24T06:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Ciclo de vida do Gateway no macOS

O app macOS **gerencia o Gateway via launchd** por padrão e não inicia
o Gateway como um processo filho. Ele primeiro tenta se conectar a um
Gateway já em execução na porta configurada; se nenhum estiver acessível, ele habilita o
serviço launchd via a CLI externa `openclaw` (sem runtime embutido). Isso oferece
inicialização automática confiável no login e reinício em caso de falhas.

O modo de processo filho (Gateway iniciado diretamente pelo app) **não é usado** hoje.
Se você precisar de um acoplamento mais forte com a UI, execute o Gateway manualmente em um terminal.

## Comportamento padrão (launchd)

- O app instala um LaunchAgent por usuário rotulado como `ai.openclaw.gateway`
  (ou `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`; o legado `com.openclaw.*` é compatível).
- Quando o modo Local está habilitado, o app garante que o LaunchAgent esteja carregado e
  inicia o Gateway se necessário.
- Logs são gravados no caminho de log do gateway do launchd (visível em Debug Settings).

Comandos comuns:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o rótulo por `ai.openclaw.<profile>` ao executar com um perfil nomeado.

## Builds de desenvolvimento sem assinatura

`scripts/restart-mac.sh --no-sign` é para builds locais rápidos quando você não tem
chaves de assinatura. Para impedir que o launchd aponte para um binário relay sem assinatura, ele:

- Grava `~/.openclaw/disable-launchagent`.

Execuções assinadas de `scripts/restart-mac.sh` limpam essa sobrescrita se o marcador
estiver presente. Para redefinir manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo somente anexar

Para forçar o app macOS a **nunca instalar nem gerenciar launchd**, inicie-o com
`--attach-only` (ou `--no-launchd`). Isso define `~/.openclaw/disable-launchagent`,
então o app só se conecta a um Gateway já em execução. Você pode alternar o mesmo
comportamento em Debug Settings.

## Modo remoto

O modo remoto nunca inicia um Gateway local. O app usa um túnel SSH até o
host remoto e se conecta por esse túnel.

## Por que preferimos launchd

- Inicialização automática no login.
- Semântica integrada de reinício/KeepAlive.
- Logs e supervisão previsíveis.

Se um verdadeiro modo de processo filho voltar a ser necessário algum dia, ele deverá ser documentado como um
modo separado, explícito e apenas para desenvolvimento.

## Relacionados

- [macOS app](/pt-BR/platforms/macos)
- [Gateway runbook](/pt-BR/gateway)
