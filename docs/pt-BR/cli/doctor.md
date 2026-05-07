---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-07T13:14:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

Para permissões específicas de canais, use as sondagens de canal em vez de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

A sondagem direcionada de capacidades do Discord informa as permissões efetivas do bot no canal; a sondagem de status audita os canais do Discord configurados e os destinos de entrada automática por voz.

## Opções

- `--no-workspace-suggestions`: desativa sugestões de memória/pesquisa do espaço de trabalho
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados que não envolvem serviços sem solicitar confirmação; instalações e regravações do serviço de gateway ainda exigem confirmação interativa ou comandos explícitos de gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não envolvem serviços
- `--generate-gateway-token`: gera e configura um token de gateway
- `--deep`: examina serviços do sistema em busca de instalações extras de gateway e relata transferências recentes de reinicialização do supervisor do Gateway

Observações:

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor ainda funcionam, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` ficam desativados porque `openclaw.json` é imutável. Edite a fonte Nix desta instalação; para nix-openclaw, use o [Guia de início rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado no agente.
- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) ignoram prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento ansioso de plugin para que verificações de integridade sem interface permaneçam rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e descarta chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço de gateway ausentes ou obsoletas, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- O doctor também examina `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do gateway do WhatsApp quando o cron não tem o ambiente do barramento de usuário do systemd.
- Quando o WhatsApp está ativado, o doctor verifica se há um loop de eventos do Gateway degradado com clientes locais `openclaw-tui` ainda em execução. `doctor --fix` interrompe apenas clientes TUI locais verificados para que as respostas do WhatsApp não fiquem enfileiradas atrás de loops de atualização TUI obsoletos.
- O doctor regrava referências legadas de modelo `openai-codex/*` para referências canônicas `openai/*` em modelos principais, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e pins obsoletos de rota de sessão. `--fix` seleciona `agentRuntime.id: "codex"` apenas quando o plugin Codex está instalado, ativado, contribui com o harness `codex` e tem OAuth utilizável; caso contrário, seleciona `agentRuntime.id: "pi"` para que a rota permaneça no runner padrão do OpenClaw.
- O doctor limpa o estado legado de preparação de dependências de plugin criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis ausentes que são referenciados pela configuração, como `plugins.entries`, canais configurados, configurações configuradas de provedor/pesquisa ou runtimes de agente configurados. Durante atualizações de pacote, o doctor pula o reparo de plugin do gerenciador de pacotes até que a substituição do pacote seja concluída; execute `openclaw doctor --fix` novamente depois se um plugin configurado ainda precisar de recuperação. Se o download falhar, o doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- O doctor repara configuração obsoleta de plugin removendo ids de plugin ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal pendente correspondente, destinos de heartbeat e substituições de modelo de canal quando a descoberta de plugins está saudável.
- O doctor coloca em quarentena configuração inválida de plugin desativando a entrada `plugins.entries.<id>` afetada e removendo o payload `config` inválido dela. A inicialização do Gateway já pula apenas esse plugin incorreto para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor for responsável pelo ciclo de vida do gateway. O doctor ainda relata a integridade do gateway/serviço e aplica reparos que não envolvem serviços, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, o doctor ignora unidades systemd extras inativas semelhantes a gateway e não regrava metadados de comando/ponto de entrada para um serviço de gateway systemd em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador ativo.
- O doctor migra automaticamente a configuração Talk plana legada (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O doctor inclui uma verificação de prontidão da pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estão ausentes.
- O doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém converse com o bot; se você aprovou um remetente antes de o bootstrap do primeiro proprietário existir, defina `commands.ownerAllowFrom` explicitamente.
- O doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI Codex existem no diretório inicial Codex do operador. Inicializações locais do servidor de aplicativo Codex usam diretórios iniciais isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- O doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, vars de ambiente, config ou requisitos de SO estão ausentes. `doctor --fix` pode desativar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; em vez disso, instale/configure o requisito ausente quando quiser manter a skill ativa.
- Se o modo sandbox estiver ativado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, o doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro particionados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, o doctor avisa quando contas padrão ativadas do Telegram ou Discord dependem de fallback por env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho do comando atual. Se a inspeção do token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa passagem.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de "não autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
