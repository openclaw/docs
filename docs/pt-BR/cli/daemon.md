---
read_when:
    - Você ainda usa `openclaw daemon ...` em scripts
    - Você precisa de comandos de ciclo de vida do serviço (instalar/iniciar/parar/reiniciar/status)
summary: Referência da CLI para `openclaw daemon` (alias legado para o gerenciamento do serviço do Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-07-12T15:00:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legado para o gerenciamento do serviço Gateway. `openclaw daemon ...` corresponde aos mesmos comandos de controle de serviço que `openclaw gateway ...`. Prefira [`openclaw gateway`](/pt-BR/cli/gateway) na documentação e nos exemplos atuais.

## Uso

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subcomandos e opções

| Subcomando  | Opções                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`            |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (somente launchd: desativa persistentemente KeepAlive/RunAtLoad até a próxima inicialização) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: mostra o estado de instalação do serviço (launchd/systemd/schtasks) e verifica a integridade do Gateway.
- `install`: instala o serviço; `--force` reinstala/substitui uma instalação existente.
- `restart --safe`: solicita que o Gateway em execução faça uma verificação preliminar do trabalho ativo e agende uma única reinicialização consolidada depois que o trabalho for concluído, limitada por `gateway.reload.deferralTimeoutMs` (padrão de 300000ms/5 minutos; defina como `0` para aguardar indefinidamente). Quando esse limite expira, a reinicialização é forçada mesmo assim. `restart` sem opções usa diretamente o gerenciador de serviços; `--force` é a substituição imediata.
- `restart --safe --skip-deferral`: ignora o bloqueio de adiamento por trabalho ativo para que o Gateway seja reiniciado imediatamente, mesmo quando bloqueadores são relatados. Requer `--safe`.

## Observações

- `status` resolve as SecretRefs de autenticação configuradas para a autenticação da verificação quando possível. Se uma SecretRef obrigatória não for resolvida, `status --json` relata `rpc.authWarning`; passe `--token`/`--password` explicitamente ou resolva primeiro a origem do segredo. Os avisos de autenticação não resolvida são suprimidos quando a verificação é bem-sucedida por outros meios.
- `status --deep` adiciona uma varredura de melhor esforço no nível do sistema em busca de outros serviços semelhantes ao Gateway (exibe dicas de limpeza; a recomendação continua sendo um Gateway por máquina) e executa a validação da configuração no modo compatível com plugins, apresentando avisos do manifesto do plugin que o caminho padrão rápido ignora.
- Em instalações systemd no Linux, as verificações de divergência de token inspecionam as origens `Environment=` e `EnvironmentFile=` da unidade.
- As verificações de divergência de token resolvem as SecretRefs de `gateway.auth.token` usando o ambiente de execução mesclado (primeiro o ambiente do comando do serviço e, depois, o ambiente do processo). Se a autenticação por token não estiver efetivamente ativa (`gateway.auth.mode` definido como `password`/`none`/`trusted-proxy`, ou não definido quando a senha puder prevalecer), a resolução do token da configuração será ignorada.
- `install` valida que um `gateway.auth.token` gerenciado por SecretRef possa ser resolvido, mas nunca persiste o valor resolvido nos metadados do ambiente do serviço; se não puder resolvê-lo, a instalação falhará de forma segura.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, `install` será bloqueado até que você defina o modo explicitamente.
- No macOS, `install` mantém os plists do LaunchAgent e o arquivo de ambiente/wrapper gerado acessíveis somente pelo proprietário (modo `0600`/`0700`), em vez de incorporar segredos em `EnvironmentVariables`.
- Para executar vários Gateways em um host: isole portas, configuração/estado e espaços de trabalho. Consulte [Vários gateways](/pt-BR/gateway#multiple-gateways-same-host).

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Guia operacional do Gateway](/pt-BR/gateway)
