---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-11T20:25:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
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

Para permissões específicas de canal, use as sondagens de canal em vez de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

A sondagem direcionada de capacidades do Discord relata as permissões efetivas do canal para o bot; a sondagem de status audita os canais do Discord configurados e os alvos de entrada automática por voz.

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem perguntar
- `--repair`: aplica reparos recomendados que não são de serviço sem perguntar; instalações e regravações do serviço Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever a configuração personalizada do serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não são de serviço
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway e relata handoffs recentes de reinicialização do supervisor do Gateway

Observações:

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor ainda funcionam, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` são desativados porque `openclaw.json` é imutável. Edite a fonte Nix desta instalação em vez disso; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente em primeiro lugar.
- Prompts interativos (como correções de chaveiro/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) ignorarão prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento ansioso de plugin para que verificações de integridade headless permaneçam rápidas. Sessões interativas ainda carregam plugins totalmente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e descarta chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço Gateway ausentes ou obsoletas, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas cron e pode regravá-los no lugar antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, doctor avisa quando o crontab do usuário ainda executa o `~/.openclaw/bin/ensure-whatsapp.sh` legado; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente systemd user-bus.
- Quando WhatsApp está ativado, doctor verifica se há um loop de eventos degradado do Gateway com clientes locais `openclaw-tui` ainda em execução. `doctor --fix` interrompe apenas clientes TUI locais verificados para que as respostas do WhatsApp não fiquem enfileiradas atrás de loops obsoletos de atualização da TUI.
- Doctor regrava refs de modelo legados `openai-codex/*` para refs canônicas `openai/*` em modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo por canal e pins obsoletos de rota de sessão. `--fix` move a intenção do Codex para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo, preserva pins de perfil de autenticação de sessão como `openai-codex:...`, remove pins obsoletos de runtime de agente inteiro/sessão e mantém refs reparadas de agentes OpenAI no roteamento de autenticação do Codex em vez de autenticação direta por chave de API da OpenAI.
- Doctor limpa o estado legado de preparação de dependências de plugin criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis ausentes que são referenciados pela configuração, como `plugins.entries`, canais configurados, configurações configuradas de provedor/pesquisa ou runtimes de agente configurados. Durante atualizações de pacote, doctor ignora o reparo de plugin do gerenciador de pacotes até que a troca de pacote seja concluída; execute `openclaw doctor --fix` novamente depois se um plugin configurado ainda precisar de recuperação. Se o download falhar, doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- Doctor repara configurações obsoletas de plugin removendo ids de plugin ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, além de configurações de canal pendentes correspondentes, alvos de heartbeat e substituições de modelo por canal quando a descoberta de plugin está saudável.
- Doctor coloca em quarentena configurações inválidas de plugin desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já ignora apenas esse plugin problemático, para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor for responsável pelo ciclo de vida do Gateway. Doctor ainda relata a integridade de gateway/serviço e aplica reparos que não são de serviço, mas ignora instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, doctor ignora unidades systemd extras semelhantes ao Gateway que estão inativas e não regrava metadados de comando/entrypoint para um serviço Gateway systemd em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador ativo.
- Doctor migra automaticamente a configuração Talk plana legada (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- Doctor avisa quando nenhum proprietário de comandos está configurado. O proprietário de comandos é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes da existência do bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI do Codex existem no Codex home do operador. Inicializações locais do app-server do Codex usam homes isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- Doctor remove o `plugins.entries.codex.config.codexDynamicToolsProfile` aposentado; o app-server do Codex sempre mantém ferramentas nativas de workspace do Codex como nativas.
- Doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, variáveis de ambiente, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desativar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver ativado, mas Docker estiver indisponível, doctor relata um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro particionados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, doctor relata um aviso somente leitura e não grava credenciais fallback em texto claro.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, doctor avisa quando contas padrão ativadas do Telegram ou Discord dependem de fallback de ambiente e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token resolvível do Telegram no caminho do comando atual. Se a inspeção do token estiver indisponível, doctor relata um aviso e ignora a resolução automática nessa passagem.

## macOS: substituições de ambiente do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de "unauthorized".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
