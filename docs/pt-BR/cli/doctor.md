---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-10T19:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
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

A sondagem direcionada de capacidades do Discord relata as permissões efetivas do bot no canal; a sondagem de status audita canais do Discord configurados e destinos de entrada automática em voz.

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados que não sejam de serviço sem solicitar confirmação; instalações e reescritas do serviço Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configurações personalizadas de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não sejam de serviço
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway e relata handoffs recentes de reinicialização do supervisor do Gateway

Observações:

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor ainda funcionam, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` ficam desativados porque `openclaw.json` é imutável. Edite a fonte Nix desta instalação em vez disso; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado ao agente.
- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) ignorarão prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para manter verificações de integridade headless rápidas. Sessões interativas ainda carregam totalmente os plugins quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço Gateway ausentes ou obsoletas, mas não as instala nem reescreve fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs cron e pode reescrevê-los no lugar antes que o agendador precise normalizá-los automaticamente em runtime.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente de barramento de usuário do systemd.
- Quando o WhatsApp está ativado, o doctor verifica se há um loop de eventos do Gateway degradado com clientes locais `openclaw-tui` ainda em execução. `doctor --fix` interrompe apenas clientes TUI locais verificados para que respostas do WhatsApp não fiquem enfileiradas atrás de loops obsoletos de atualização do TUI.
- O Doctor reescreve refs de modelo legadas `openai-codex/*` para refs canônicas `openai/*` em modelos primários, fallbacks, sobrescritas de heartbeat/subagente/compaction, hooks, sobrescritas de modelo de canal e pins obsoletos de rota de sessão. `--fix` move a intenção do Codex para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo, preserva pins de perfil de autenticação de sessão como `openai-codex:...`, remove pins obsoletos de runtime de agente/sessão inteira e mantém refs reparadas de agentes OpenAI no roteamento de autenticação Codex em vez de autenticação direta por chave de API OpenAI.
- O Doctor limpa o estado legado de preparação de dependências de plugins criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis ausentes referenciados pela configuração, como `plugins.entries`, canais configurados, configurações configuradas de provedor/pesquisa ou runtimes de agente configurados. Durante atualizações de pacote, o doctor pula o reparo de plugins do gerenciador de pacotes até que a troca de pacote esteja concluída; execute novamente `openclaw doctor --fix` depois se um plugin configurado ainda precisar de recuperação. Se o download falhar, o doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- O Doctor repara configurações obsoletas de plugin removendo ids de plugin ausentes de `plugins.allow`/`plugins.entries`, além de configurações de canal pendentes, destinos de heartbeat e sobrescritas de modelo de canal correspondentes quando a descoberta de plugins está saudável.
- O Doctor coloca em quarentena configurações inválidas de plugin desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse plugin inválido para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor controlar o ciclo de vida do Gateway. O Doctor ainda relata a integridade de Gateway/serviço e aplica reparos que não sejam de serviço, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, o doctor ignora unidades systemd extras semelhantes ao Gateway que estejam inativas e não reescreve metadados de comando/entrypoint para um serviço systemd do Gateway em execução durante o reparo. Interrompa o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher ativo.
- O Doctor migra automaticamente a configuração Talk plana legada (`talk.voiceId`, `talk.modelId` e similares) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais a normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estão ausentes.
- O Doctor avisa quando nenhum dono de comando está configurado. O dono de comando é a conta do operador humano autorizada a executar comandos exclusivos do dono e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro dono, defina `commands.ownerAllowFrom` explicitamente.
- O Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI Codex existem no diretório inicial Codex do operador. Inicializações locais do app-server Codex usam diretórios iniciais isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- O Doctor remove o `plugins.entries.codex.config.codexDynamicToolsProfile` aposentado; o app-server Codex sempre mantém ferramentas de workspace nativas do Codex como nativas.
- O Doctor avisa quando skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, vars de ambiente, config ou requisitos de SO estão ausentes. `doctor --fix` pode desativar essas skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver ativado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, o doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto puro.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair cedo.
- Após migrações de diretório de estado, o doctor avisa quando contas padrão ativadas do Telegram ou Discord dependem de fallback por env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho de comando atual. Se a inspeção do token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa execução.

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
