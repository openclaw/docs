---
read_when:
    - Você ainda usa `openclaw daemon ...` em scripts
    - Você precisa de comandos de ciclo de vida do serviço (instalar/iniciar/parar/reiniciar/status)
summary: Referência da CLI para `openclaw daemon` (alias legado para gerenciamento do serviço Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-06-30T13:53:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
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

- `status` resolve SecretRefs de autenticação configurados para autenticação da verificação quando possível.
- Se um SecretRef de autenticação obrigatório não for resolvido neste caminho de comando, `daemon status --json` relata `rpc.authWarning` quando a conectividade/autenticação da verificação falha; passe `--token`/`--password` explicitamente ou resolva a origem do segredo primeiro.
- Se a verificação for bem-sucedida, avisos de auth-ref não resolvidas são suprimidos para evitar falsos positivos.
- `status --deep` adiciona uma varredura de serviço em nível de sistema de melhor esforço. Quando encontra outros serviços semelhantes a gateway, a saída humana imprime dicas de limpeza e avisa que um gateway por máquina ainda é a recomendação normal.
- `status --deep` também executa validação de configuração em modo ciente de Plugin e expõe avisos de manifesto de Plugin configurados (por exemplo, metadados ausentes de configuração de canal), para que verificações rápidas de instalação e atualização os capturem. O `status` padrão mantém o caminho rápido somente leitura que ignora a validação de Plugin.
- Em instalações systemd no Linux, as verificações de desvio de token de `status` incluem fontes de unidade `Environment=` e `EnvironmentFile=`.
- As verificações de desvio resolvem SecretRefs de `gateway.auth.token` usando o env de runtime mesclado (primeiro o env do comando de serviço, depois o fallback para o env do processo).
- Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` explícito como `password`/`none`/`trusted-proxy`, ou modo não definido quando a senha pode prevalecer e nenhum candidato a token pode prevalecer), as verificações de desvio de token ignoram a resolução do token de configuração.
- Quando a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, `install` valida que o SecretRef pode ser resolvido, mas não persiste o token resolvido nos metadados de ambiente do serviço.
- Se a autenticação por token exige um token e o SecretRef de token configurado não foi resolvido, a instalação falha de forma fechada.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação é bloqueada até que o modo seja definido explicitamente.
- No macOS, `install` mantém os plists do LaunchAgent acessíveis somente ao proprietário e carrega valores de ambiente de serviço gerenciados por meio de um arquivo e wrapper acessíveis somente ao proprietário, em vez de serializar chaves de API ou refs de env de perfil de autenticação em `EnvironmentVariables`.
- Se você executar intencionalmente vários gateways em um host, isole portas, configuração/estado e workspaces; consulte [/gateway#multiple-gateways-same-host](/pt-BR/gateway#multiple-gateways-same-host).
- `restart --safe` pede ao Gateway em execução para fazer uma pré-verificação do trabalho ativo e agendar uma reinicialização coalescida depois que o trabalho ativo for escoado. A reinicialização segura padrão aguarda o trabalho ativo até o `gateway.reload.deferralTimeoutMs` configurado (padrão de 5 minutos); quando esse orçamento expira, a reinicialização é forçada. Defina `gateway.reload.deferralTimeoutMs` como `0` para uma espera segura indefinida que nunca força. `restart` simples mantém o comportamento existente do gerenciador de serviço; `--force` continua sendo o caminho de substituição imediata.
- `restart --safe --skip-deferral` executa a reinicialização segura ciente de OpenClaw, mas ignora o gate de adiamento por trabalho ativo, então o Gateway emite a reinicialização imediatamente mesmo quando bloqueadores são relatados. É uma saída de emergência para o operador quando uma execução de tarefa travada prende a reinicialização segura; exige `--safe`.

## Prefira

Use [`openclaw gateway`](/pt-BR/cli/gateway) para a documentação e os exemplos atuais.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Runbook do Gateway](/pt-BR/gateway)
