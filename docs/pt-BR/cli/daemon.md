---
read_when:
    - Você ainda usa `openclaw daemon ...` em scripts
    - Você precisa de comandos do ciclo de vida do serviço (install/start/stop/restart/status)
summary: Referência da CLI para `openclaw daemon` (alias legado para o gerenciamento do serviço Gateway)
title: Serviço em segundo plano
x-i18n:
    generated_at: "2026-05-11T20:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
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
- `stop`: para o serviço
- `restart`: reinicia o serviço

## Opções comuns

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ciclo de vida (`uninstall|start|stop`): `--json`

Observações:

- `status` resolve SecretRefs de autenticação configuradas para autenticação da verificação quando possível.
- Se uma SecretRef de autenticação necessária não for resolvida neste caminho de comando, `daemon status --json` relata `rpc.authWarning` quando a conectividade/autenticação da verificação falha; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo.
- Se a verificação for bem-sucedida, avisos de referências de autenticação não resolvidas serão suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema em melhor esforço. Quando encontra outros serviços semelhantes ao Gateway, a saída legível imprime dicas de limpeza e avisa que um Gateway por máquina ainda é a recomendação normal.
- `status --deep` também executa validação de configuração em modo ciente de Plugin e expõe avisos de manifesto de Plugin configurado (por exemplo, metadados de configuração de canal ausentes), para que verificações de instalação e atualização os detectem. O `status` padrão mantém o caminho rápido somente leitura que ignora a validação de Plugin.
- Em instalações Linux systemd, as verificações de divergência de token de `status` incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- As verificações de divergência resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env do comando de serviço, depois fallback para o env do processo).
- Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito de `password`/`none`/`trusted-proxy`, ou modo não definido em que a senha pode prevalecer e nenhum candidato a token pode prevalecer), as verificações de divergência de token ignoram a resolução do token de configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que a SecretRef é resolvível, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exigir um token e a SecretRef de token configurada não for resolvida, a instalação falha de forma fechada.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- No macOS, `install` mantém os plists de LaunchAgent exclusivos ao proprietário e carrega valores de ambiente do serviço gerenciado por meio de um arquivo e wrapper exclusivos ao proprietário, em vez de serializar chaves de API ou refs de env de perfil de autenticação em `EnvironmentVariables`.
- Se você executar intencionalmente vários Gateways em um host, isole portas, configuração/estado e workspaces; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
- `restart --safe` solicita ao Gateway em execução que faça uma pré-verificação do trabalho ativo e agende uma reinicialização agregada depois que o trabalho ativo for drenado. `restart` simples mantém o comportamento existente do gerenciador de serviço; `--force` permanece como o caminho de substituição imediata.
- `restart --safe --skip-deferral` executa a reinicialização segura compatível com OpenClaw, mas contorna a barreira de adiamento de trabalho ativo para que o Gateway emita a reinicialização imediatamente, mesmo quando bloqueadores forem relatados. É uma saída de emergência do operador quando uma execução de tarefa travada prende a reinicialização segura; exige `--safe`.

## Prefira

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
