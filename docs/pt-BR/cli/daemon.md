---
read_when:
    - Você ainda usa `openclaw daemon ...` nos scripts
    - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
summary: Referência da CLI para `openclaw daemon` (apelido legado para gerenciamento do serviço Gateway)
title: Serviço em segundo plano
x-i18n:
    generated_at: "2026-05-02T22:17:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
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

- `status`: mostrar o estado de instalação do serviço e sondar a integridade do Gateway
- `install`: instalar o serviço (`launchd`/`systemd`/`schtasks`)
- `uninstall`: remover o serviço
- `start`: iniciar o serviço
- `stop`: parar o serviço
- `restart`: reiniciar o serviço

## Opções comuns

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Observações:

- `status` resolve SecretRefs de autenticação configuradas para autenticação de sondagem quando possível.
- Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `daemon status --json` relata `rpc.authWarning` quando a conectividade/autenticação da sondagem falha; passe `--token`/`--password` explicitamente ou resolva primeiro a fonte do segredo.
- Se a sondagem for bem-sucedida, avisos de referência de autenticação não resolvida são suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema em melhor esforço. Quando encontra outros serviços semelhantes ao Gateway, a saída para humanos imprime dicas de limpeza e avisa que um Gateway por máquina ainda é a recomendação normal.
- Em instalações Linux com systemd, as verificações de desvio de token de `status` incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env do comando de serviço, depois o fallback para o env do processo).
- Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode vencer e nenhum candidato a token pode vencer), as verificações de desvio de token ignoram a resolução do token de configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que a SecretRef pode ser resolvida, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e a SecretRef de token configurada não for resolvida, a instalação falhará fechada.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- No macOS, `install` mantém os plists do LaunchAgent somente para o proprietário e carrega valores de ambiente do serviço gerenciado por meio de um arquivo e wrapper somente para o proprietário, em vez de serializar chaves de API ou referências de env de perfil de autenticação em `EnvironmentVariables`.
- Se você executa intencionalmente vários Gateways em um host, isole portas, configuração/estado e workspaces; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).

## Prefira

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
