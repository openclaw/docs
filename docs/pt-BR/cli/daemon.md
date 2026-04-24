---
read_when:
    - Você ainda usa `openclaw daemon ...` em scripts
    - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
summary: Referência de CLI para `openclaw daemon` (alias legado para gerenciamento do serviço Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-24T05:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias legado para comandos de gerenciamento do serviço Gateway.

`openclaw daemon ...` é mapeado para a mesma superfície de controle de serviço que os comandos de serviço `openclaw gateway ...`.

## Uso

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subcomandos

- `status`: mostra o estado de instalação do serviço e verifica a integridade do Gateway
- `install`: instala o serviço (`launchd`/`systemd`/`schtasks`)
- `uninstall`: remove o serviço
- `start`: inicia o serviço
- `stop`: interrompe o serviço
- `restart`: reinicia o serviço

## Opções comuns

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ciclo de vida (`uninstall|start|stop|restart`): `--json`

Observações:

- `status` resolve SecretRefs de autenticação configurados para autenticação da probe quando possível.
- Se um SecretRef de autenticação necessário não for resolvido neste caminho de comando, `daemon status --json` reporta `rpc.authWarning` quando a conectividade/autenticação da probe falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a probe for bem-sucedida, avisos de auth-ref não resolvidos são suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema com melhor esforço. Quando encontra outros serviços semelhantes ao gateway, a saída legível por humanos imprime dicas de limpeza e avisa que um gateway por máquina ainda é a recomendação normal.
- Em instalações Linux com systemd, as verificações de divergência de token em `status` incluem tanto fontes `Environment=` quanto `EnvironmentFile=` da unit.
- As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando env de runtime mesclado (env do comando de serviço primeiro, depois fallback para env do processo).
- Se a autenticação por token não estiver efetivamente ativa (modo explícito `gateway.auth.mode` como `password`/`none`/`trusted-proxy`, ou modo não definido em que password pode prevalecer e nenhum candidato de token pode prevalecer), as verificações de divergência de token ignoram a resolução do token da configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida se o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não puder ser resolvido, a instalação falha de forma fechada.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- Se você executa intencionalmente vários gateways em um único host, isole portas, config/state e workspaces; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

## Prefira

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionado

- [Referência de CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
