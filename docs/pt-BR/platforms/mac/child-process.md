---
read_when:
    - Integração do aplicativo para Mac com o ciclo de vida do Gateway
summary: Ciclo de vida do Gateway no macOS (launchd)
title: Ciclo de vida do Gateway no macOS
x-i18n:
    generated_at: "2026-07-12T00:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

O app para macOS gerencia o Gateway via **launchd** por padrão e não
inicia o Gateway como um processo filho. Primeiro, ele tenta se conectar a um
Gateway já em execução na porta configurada; se nenhum estiver acessível, ele
habilita o serviço launchd por meio da CLI externa `openclaw` (sem runtime
incorporado). Isso proporciona inicialização automática confiável ao iniciar
uma sessão e reinicialização em caso de falhas.

O modo de processo filho (Gateway iniciado diretamente pelo app) **não está em uso**
atualmente. Se precisar de uma integração mais estreita com a interface, execute o Gateway manualmente em um
terminal.

## Comportamento padrão (launchd)

- O app instala um LaunchAgent por usuário, identificado como `ai.openclaw.gateway` (ou
  `ai.openclaw.<profile>` ao usar `--profile`/`OPENCLAW_PROFILE`).
- Quando o modo Local está habilitado, o app garante que o LaunchAgent esteja carregado e
  inicia o Gateway, se necessário.
- Os logs são gravados no caminho de log do Gateway do launchd (visível em Debug Settings).

Comandos comuns:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Substitua o identificador por `ai.openclaw.<profile>` ao executar um perfil nomeado.

## Builds de desenvolvimento não assinadas

`scripts/restart-mac.sh --no-sign` é usado para builds locais rápidas sem chaves de
assinatura. Para impedir que o launchd aponte para um binário de retransmissão não assinado, ele grava
`~/.openclaw/disable-launchagent`.

Execuções assinadas de `scripts/restart-mac.sh` removem essa substituição se o marcador estiver
presente. Para redefinir manualmente:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modo somente conexão

Para impedir que o app para macOS instale ou gerencie o launchd, inicie-o com
`--attach-only` (ou `--no-launchd`). Isso define
`~/.openclaw/disable-launchagent`, fazendo com que o app apenas se conecte a um Gateway já em
execução. Alterne o mesmo comportamento em Debug Settings.

## Modo remoto

O modo remoto nunca inicia um Gateway local. O app usa um túnel SSH para o
host remoto e se conecta por esse túnel.

## Por que preferimos o launchd

- Inicialização automática ao iniciar uma sessão.
- Semântica integrada de reinicialização/KeepAlive.
- Logs e supervisão previsíveis.

Se um verdadeiro modo de processo filho voltar a ser necessário, ele deverá ser documentado como
um modo separado, explícito e exclusivo para desenvolvimento.

## Relacionado

- [App para macOS](/pt-BR/platforms/macos)
- [Guia operacional do Gateway](/pt-BR/gateway)
