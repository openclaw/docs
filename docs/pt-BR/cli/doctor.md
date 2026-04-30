---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma checagem de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-04-30T20:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o Gateway e canais.

Relacionado:

- Solução de problemas: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Segurança](/pt-BR/gateway/security)

## Exemplos

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica os reparos recomendados sem solicitar confirmação
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever a configuração personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) ignorarão prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento antecipado de plugins para que verificações de integridade headless permaneçam rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e descarta chaves de configuração desconhecidas, listando cada remoção.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de trabalhos cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- Doctor repara dependências de runtime ausentes de plugins incluídos sem gravar em instalações globais empacotadas. Para instalações npm pertencentes a root ou unidades systemd reforçadas, defina `OPENCLAW_PLUGIN_STAGE_DIR` como um diretório gravável, como `/var/lib/openclaw/plugin-runtime-deps`; ele também pode ser uma lista de caminhos, como `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, em que as raízes anteriores são camadas de consulta somente leitura e a raiz final é o destino do reparo.
- Doctor repara configurações obsoletas de plugins removendo ids de plugins ausentes de `plugins.allow`/`plugins.entries`, além de configurações de canal pendentes correspondentes, destinos de Heartbeat e substituições de modelo de canal quando a descoberta de plugins está íntegra.
- Doctor coloca em quarentena configurações inválidas de plugins desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já ignora apenas esse plugin com problema para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor controla o ciclo de vida do Gateway. Doctor ainda informa a integridade do Gateway/serviço e aplica reparos que não envolvem serviço, mas ignora instalação/início/reinício/bootstrap de serviço e limpeza de serviços legados.
- No Linux, doctor ignora unidades systemd extras semelhantes ao Gateway que estejam inativas e não regrava metadados de comando/entrypoint de um serviço Gateway systemd em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador ativo.
- Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não informam/aplicam mais a normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estiverem ausentes.
- Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta humana de operador autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém converse com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI do Codex existem no diretório inicial do Codex do operador. Inicializações locais do servidor de app do Codex usam diretórios iniciais isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- Se o modo sandbox estiver ativado, mas o Docker estiver indisponível, doctor informa um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, doctor informa um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, doctor continua e informa um aviso em vez de sair antecipadamente.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token resolvível do Telegram no caminho de comando atual. Se a inspeção de token estiver indisponível, doctor informa um aviso e ignora a resolução automática nessa execução.

## macOS: substituições de ambiente do `launchctl`

Se você já executou `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
