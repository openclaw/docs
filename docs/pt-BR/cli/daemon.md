---
read_when:
    - Você ainda usa `openclaw daemon ...` nos scripts
    - Você precisa de comandos de ciclo de vida do serviço (install/start/stop/restart/status)
summary: Referência da CLI para `openclaw daemon` (alias legado para gerenciamento do serviço Gateway)
title: Serviço em segundo plano
x-i18n:
    generated_at: "2026-05-04T18:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legado para comandos de gerenciamento do serviço Gateway.

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
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Observações:

- `status` resolve SecretRefs de autenticação configuradas para autenticação de verificação quando possível.
- Se uma SecretRef de autenticação obrigatória não for resolvida neste caminho de comando, `daemon status --json` relata `rpc.authWarning` quando a conectividade/autenticação da verificação falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a verificação for bem-sucedida, avisos de auth-ref não resolvidos são suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema em regime de melhor esforço. Quando encontra outros serviços semelhantes a gateway, a saída humana imprime dicas de limpeza e avisa que um Gateway por máquina ainda é a recomendação normal.
- Em instalações systemd no Linux, as verificações de desvio de token de `status` incluem tanto origens de unidade `Environment=` quanto `EnvironmentFile=`.
- As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env do comando de serviço, depois o fallback do env do processo).
- Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode prevalecer e nenhum candidato de token pode prevalecer), as verificações de desvio de token pulam a resolução do token de configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que a SecretRef é resolvível, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exige um token e a SecretRef de token configurada não está resolvida, a instalação falha de forma fechada.
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- No macOS, `install` mantém os plists do LaunchAgent acessíveis somente ao proprietário e carrega valores de ambiente do serviço gerenciado por meio de um arquivo e wrapper acessíveis somente ao proprietário, em vez de serializar chaves de API ou refs de env de perfil de autenticação em `EnvironmentVariables`.
- Se você executar intencionalmente vários Gateways em um host, isole portas, configuração/estado e espaços de trabalho; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
- `restart --safe` pede ao Gateway em execução que faça uma pré-verificação do trabalho ativo e agende uma reinicialização coalescida após o escoamento do trabalho ativo. `restart` simples mantém o comportamento existente do gerenciador de serviço; `--force` continua sendo o caminho de substituição imediata.

## Prefira

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
