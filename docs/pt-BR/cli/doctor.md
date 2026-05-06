---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-06T05:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o Gateway e os canais.

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

- `--no-workspace-suggestions`: desabilita sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem perguntar
- `--repair`: aplica reparos recomendados que não envolvem serviço sem perguntar; instalações e regravações do serviço do Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever a configuração personalizada do serviço quando necessário
- `--non-interactive`: executa sem prompts; somente migrações seguras e reparos que não envolvem serviço
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway e relata handoffs recentes de reinicialização do supervisor do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) ignorarão prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento antecipado de plugins para manter rápidas as verificações de integridade headless. Sessões interativas ainda carregam plugins por completo quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições ausentes ou obsoletas do serviço do Gateway, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas Cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente de barramento de usuário do systemd.
- Quando WhatsApp está habilitado, doctor verifica se há um loop de eventos degradado do Gateway com clientes locais `openclaw-tui` ainda em execução. `doctor --fix` interrompe somente clientes TUI locais verificados para que as respostas do WhatsApp não fiquem enfileiradas atrás de loops obsoletos de atualização da TUI.
- Doctor regrava referências legadas de modelo `openai-codex/*` para referências canônicas `openai/*` em modelos primários, fallbacks, substituições de Heartbeat/subagente/Compaction, hooks, substituições de modelo de canal e pins obsoletos de rota de sessão. `--fix` seleciona `agentRuntime.id: "codex"` somente quando o Plugin Codex está instalado, habilitado, contribui com o harness `codex` e tem OAuth utilizável; caso contrário, seleciona `agentRuntime.id: "pi"` para que a rota permaneça no executor padrão do OpenClaw.
- Doctor limpa o estado legado de preparação de dependências de plugins criado por versões mais antigas do OpenClaw. Ele também repara plugins baixáveis ausentes que são referenciados pela configuração, como `plugins.entries`, canais configurados, configurações configuradas de provedor/pesquisa ou runtimes configurados de agentes. Durante atualizações de pacote, doctor ignora o reparo de plugins pelo gerenciador de pacotes até que a troca de pacote seja concluída; execute novamente `openclaw doctor --fix` depois se um Plugin configurado ainda precisar de recuperação. Se o download falhar, doctor relata o erro de instalação e preserva a entrada configurada do Plugin para a próxima tentativa de reparo.
- Doctor repara configurações obsoletas de plugins removendo ids de plugins ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal pendente correspondente, destinos de Heartbeat e substituições de modelo de canal quando a descoberta de plugins está saudável.
- Doctor coloca em quarentena configurações inválidas de plugins desabilitando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já ignora somente esse Plugin inválido para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor gerenciar o ciclo de vida do Gateway. Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviço, mas ignora instalação/inicialização/reinicialização/bootstrap do serviço e a limpeza de serviços legados.
- No Linux, doctor ignora unidades systemd extras semelhantes a Gateway que estejam inativas e não regrava metadados de comando/entrypoint para um serviço systemd do Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando quiser substituir intencionalmente o inicializador ativo.
- Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e relacionados) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- Doctor inclui uma verificação de prontidão da pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estão ausentes.
- Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta humana operadora autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém converse com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI do Codex existem no home do Codex do operador. Inicializações locais do app-server do Codex usam homes isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- Doctor avisa quando Skills permitidas para o agente padrão não estão disponíveis no ambiente de execução atual porque binários, env vars, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desabilitar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver habilitado, mas Docker não estiver disponível, doctor relata um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro do sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, doctor avisa quando contas padrão habilitadas de Telegram ou Discord dependem de fallback de env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token resolvível do Telegram no caminho de comando atual. Se a inspeção do token estiver indisponível, doctor relata um aviso e ignora a resolução automática nessa execução.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
