---
read_when:
    - Você ainda usa `openclaw daemon ...` em scripts
    - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
summary: Referência de CLI para `openclaw daemon` (alias legado para gerenciamento do serviço Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-30T09:40:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legado para comandos de gerenciamento de serviço do Gateway.

`openclaw daemon ...` mapeia para a mesma superfície de controle de serviço que os comandos de serviço `openclaw gateway ...`.

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

- `status` resolve SecretRefs de autenticação configuradas para autenticação da verificação quando possível.
- Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `daemon status --json` relata `rpc.authWarning` quando a conectividade/autenticação da verificação falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a verificação for bem-sucedida, os avisos de referência de autenticação não resolvida são suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema, de melhor esforço. Quando encontra outros serviços semelhantes ao Gateway, a saída legível imprime dicas de limpeza e avisa que um Gateway por máquina ainda é a recomendação normal.
- Em instalações systemd no Linux, as verificações de desvio de token de `status` incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o ambiente de runtime mesclado (primeiro o ambiente do comando de serviço, depois o fallback para o ambiente do processo).
- Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido quando a senha pode prevalecer e nenhum candidato a token pode prevalecer), as verificações de desvio de token ignoram a resolução do token de configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que a SecretRef pode ser resolvida, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e a SecretRef de token configurada não for resolvida, a instalação falhará de forma fechada.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- No macOS, `install` mantém plists de LaunchAgent acessíveis somente pelo proprietário e carrega valores de ambiente do serviço gerenciado por meio de um arquivo e wrapper acessíveis somente pelo proprietário, em vez de serializar chaves de API ou referências de ambiente de perfil de autenticação em `EnvironmentVariables`.
- Se você executar intencionalmente vários Gateways em um host, isole portas, configuração/estado e workspaces; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

## Prefira

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Manual operacional do Gateway](/pt-BR/gateway)
