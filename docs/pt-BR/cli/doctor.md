---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-12T08:45:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

Para permissões específicas de canal, use as sondas de canal em vez de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

A sonda direcionada de recursos do Discord relata as permissões efetivas do bot no canal; a sonda de status audita canais Discord configurados e destinos de entrada automática em voz.

## Opções

- `--no-workspace-suggestions`: desabilita sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados que não sejam de serviço sem solicitar confirmação; instalações e regravações do serviço de Gateway ainda exigem confirmação interativa ou comandos explícitos de Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração de serviço personalizada quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não sejam de serviço
- `--generate-gateway-token`: gera e configura um token de Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras de Gateway e relata handoffs recentes de reinicialização do supervisor do Gateway

Observações:

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor ainda funcionam, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` são desabilitados porque `openclaw.json` é imutável. Edite a origem Nix desta instalação em vez disso; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente primeiro.
- Prompts interativos (como correções de chaveiro/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) pularão os prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para que verificações de integridade sem interface permaneçam rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias de `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições ausentes ou obsoletas do serviço de Gateway, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- O doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente do barramento de usuário do systemd.
- Quando o WhatsApp está habilitado, o doctor verifica se há um loop de eventos do Gateway degradado com clientes locais `openclaw-tui` ainda em execução. `doctor --fix` interrompe apenas clientes TUI locais verificados para que as respostas do WhatsApp não fiquem enfileiradas atrás de loops obsoletos de atualização do TUI.
- O doctor regrava refs de modelo legadas `openai-codex/*` para refs canônicas `openai/*` em modelos primários, fallbacks, sobrescritas de heartbeat/subagente/compaction, hooks, sobrescritas de modelo de canal e pins obsoletos de rota de sessão. `--fix` move a intenção do Codex para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo, preserva pins de perfil de autenticação de sessão como `openai-codex:...`, remove pins obsoletos de runtime de agente inteiro/sessão e mantém refs reparadas de agente OpenAI no roteamento de autenticação do Codex em vez de autenticação direta por chave de API da OpenAI.
- O doctor limpa estado legado de staging de dependências de plugin criado por versões mais antigas do OpenClaw e vincula novamente o pacote host `openclaw` para plugins npm gerenciados que o declaram como dependência peer. Ele também repara plugins baixáveis ausentes que são referenciados pela configuração, como `plugins.entries`, canais configurados, configurações de provedor/pesquisa configuradas ou runtimes de agente configurados. Durante atualizações de pacote, o doctor pula o reparo de plugin pelo gerenciador de pacotes até que a troca de pacote esteja concluída; execute novamente `openclaw doctor --fix` depois se um plugin configurado ainda precisar de recuperação. Se o download falhar, o doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- O doctor repara configuração obsoleta de plugin removendo ids de plugin ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, além da configuração pendente de canal correspondente, destinos de heartbeat e sobrescritas de modelo de canal quando a descoberta de plugins está íntegra.
- O doctor coloca em quarentena configuração inválida de plugin desabilitando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse plugin inválido para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor controla o ciclo de vida do Gateway. O doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não sejam de serviço, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, o doctor ignora unidades systemd extras inativas semelhantes a Gateway e não regrava metadados de comando/entrypoint para um serviço systemd de Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador ativo.
- O doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e relacionados) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- O doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta do operador humano autorizada a executar comandos exclusivos de proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém converse com o bot; se você aprovou um remetente antes que o bootstrap do primeiro proprietário existisse, defina `commands.ownerAllowFrom` explicitamente.
- O doctor avisa quando agentes em modo Codex estão configurados e assets pessoais da CLI Codex existem no home Codex do operador. Inicializações locais do app-server Codex usam homes isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar assets que devem ser promovidos deliberadamente.
- O doctor remove o `plugins.entries.codex.config.codexDynamicToolsProfile` aposentado; o app-server Codex sempre mantém ferramentas nativas de workspace do Codex como nativas.
- O doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, vars de ambiente, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desabilitar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando você quiser manter a skill ativa.
- Se o modo sandbox estiver habilitado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, o doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações do diretório de estado, o doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback de ambiente e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token resolvível do Telegram no caminho do comando atual. Se a inspeção do token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa passagem.

## macOS: sobrescritas de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor sobrescreve seu arquivo de configuração e pode causar erros persistentes de "não autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
