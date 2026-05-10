---
read_when:
    - Você ainda usa `openclaw daemon ...` em scripts
    - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
summary: Referência da CLI para `openclaw daemon` (alias legado para gerenciamento do serviço de Gateway)
title: Serviço em segundo plano
x-i18n:
    generated_at: "2026-05-10T19:27:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legado para comandos de gerenciamento do serviço Gateway.

`openclaw daemon ...` mapeia para a mesma superfície de controle de serviço dos comandos de serviço `openclaw gateway ...`.

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
- `stop`: para o serviço
- `restart`: reinicia o serviço

## Opções comuns

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Observações:

- `status` resolve SecretRefs de autenticação configurados para autenticação da verificação quando possível.
- Se um SecretRef de autenticação obrigatório não for resolvido neste caminho de comando, `daemon status --json` relata `rpc.authWarning` quando a conectividade/autenticação da verificação falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a verificação for bem-sucedida, avisos de auth-ref não resolvidos são suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema com melhor esforço. Quando encontra outros serviços semelhantes ao Gateway, a saída legível imprime dicas de limpeza e avisa que um Gateway por máquina ainda é a recomendação normal.
- Em instalações Linux systemd, as verificações de divergência de token de `status` incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando o ambiente de runtime mesclado (ambiente do comando de serviço primeiro, depois fallback para o ambiente do processo).
- Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito como `password`/`none`/`trusted-proxy`, ou modo não definido quando a senha pode prevalecer e nenhum candidato a token pode prevalecer), as verificações de divergência de token pulam a resolução do token de configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, a instalação falha de forma fechada.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação é bloqueada até que o modo seja definido explicitamente.
- No macOS, `install` mantém os plists de LaunchAgent somente para o proprietário e carrega os valores de ambiente do serviço gerenciado por meio de um arquivo e wrapper somente para o proprietário, em vez de serializar chaves de API ou refs de ambiente de perfil de autenticação em `EnvironmentVariables`.
- Se você executar intencionalmente vários gateways em um único host, isole portas, configuração/estado e workspaces; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
- `restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo e agende uma única reinicialização agrupada depois que o trabalho ativo for drenado. `restart` simples mantém o comportamento existente do gerenciador de serviço; `--force` continua sendo o caminho de substituição imediata.
- `restart --safe --skip-deferral` executa a reinicialização segura ciente do OpenClaw, mas ignora o bloqueio de adiamento por trabalho ativo para que o Gateway emita a reinicialização imediatamente, mesmo quando bloqueadores são relatados. Saída de emergência para operadores quando uma execução de tarefa travada prende a reinicialização segura; exige `--safe`.

## Preferir

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
