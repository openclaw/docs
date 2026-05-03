---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-03T21:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o gateway e os canais.

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
- `--yes`: aceita os padrões sem perguntar
- `--repair`: aplica correções recomendadas que não envolvem serviço sem perguntar; instalações e reescritas do serviço de gateway ainda exigem confirmação interativa ou comandos explícitos de gateway
- `--fix`: alias para `--repair`
- `--force`: aplica correções agressivas, incluindo sobrescrever a configuração personalizada do serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e correções que não envolvem serviço
- `--generate-gateway-token`: gera e configura um token de gateway
- `--deep`: verifica os serviços do sistema em busca de instalações extras do gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) pularão os prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para que as verificações de integridade sem interface permaneçam rápidas. Sessões interativas ainda carregam plugins por completo quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` informa definições de serviço de gateway ausentes ou obsoletas, mas não as instala nem reescreve fora do modo de correção de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas cron e pode reescrevê-los no local antes que o agendador precise normalizá-los automaticamente em runtime.
- No Linux, o Doctor avisa quando o crontab do usuário ainda executa o `~/.openclaw/bin/ensure-whatsapp.sh` legado; esse script não é mais mantido e pode registrar falsas indisponibilidades do gateway do WhatsApp quando o cron não tem o ambiente de barramento de usuário do systemd.
- O Doctor limpa o estado legado de preparação de dependências de plugins criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis configurados ausentes quando o registro consegue resolvê-los, e a passagem do Doctor 2026.5.2 instala automaticamente plugins baixáveis que uma configuração antiga já usa antes de marcar a configuração como tocada para essa versão.
- O Doctor repara configurações obsoletas de plugins removendo ids de plugins ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal correspondente pendente, destinos de heartbeat e substituições de modelo de canal quando a descoberta de plugins está saudável.
- O Doctor coloca em quarentena configurações inválidas de plugins desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse plugin inválido para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor gerencia o ciclo de vida do gateway. O Doctor ainda informa a integridade do gateway/serviço e aplica correções que não envolvem serviço, mas pula instalação/início/reinício/bootstrap do serviço e limpeza de serviços legados.
- No Linux, o Doctor ignora unidades systemd extras inativas semelhantes ao gateway e não reescreve metadados de comando/entrypoint para um serviço de gateway systemd em execução durante a correção. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador ativo.
- O Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e relacionados) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não informam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- O Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM só permite que alguém converse com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- O Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI do Codex existem na home do Codex do operador. Inicializações locais do servidor de aplicativo do Codex usam homes isoladas por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- O Doctor avisa quando skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, env vars, config ou requisitos de SO estão ausentes. `doctor --fix` pode desativar essas skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente quando quiser manter a skill ativa.
- Se o modo sandbox estiver ativado, mas o Docker estiver indisponível, o Doctor informa um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro do sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, o Doctor os informa; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, o Doctor informa um aviso somente leitura e não grava credenciais de fallback em texto puro.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o Doctor continua e informa um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, o Doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback por env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do Doctor.
- A resolução automática de nome de usuário de `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho de comando atual. Se a inspeção do token estiver indisponível, o Doctor informa um aviso e pula a resolução automática nessa passagem.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
