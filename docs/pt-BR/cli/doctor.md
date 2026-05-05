---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T08:25:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
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

- `--no-workspace-suggestions`: desabilita sugestões de memória/pesquisa do workspace
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados que não envolvem serviços sem solicitar confirmação; instalações e regravações do serviço de gateway ainda exigem confirmação interativa ou comandos explícitos de gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever config personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não envolvem serviços
- `--generate-gateway-token`: gera e configura um token de gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras de gateway e relata handoffs recentes de reinicialização do supervisor do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) pularão prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para que verificações de integridade sem interface permaneçam rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de config desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço de gateway ausentes ou obsoletas, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs de cron e pode regravá-los no lugar antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas interrupções do gateway do WhatsApp quando o cron não tem o ambiente user-bus do systemd.
- Quando o WhatsApp está habilitado, doctor verifica se há um loop de eventos do Gateway degradado com clientes `openclaw-tui` locais ainda em execução. `doctor --fix` para apenas clientes TUI locais verificados para que respostas do WhatsApp não fiquem enfileiradas atrás de loops de atualização TUI obsoletos.
- Doctor limpa o estado legado de preparação de dependências de Plugin criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis ausentes que são referenciados pela config, como `plugins.entries`, canais configurados, configurações configuradas de provedor/pesquisa ou runtimes de agentes configurados. Durante atualizações de pacote, doctor pula o reparo de Plugin pelo gerenciador de pacotes até que a troca de pacote seja concluída; execute novamente `openclaw doctor --fix` depois se um Plugin configurado ainda precisar de recuperação. Se o download falhar, doctor relata o erro de instalação e preserva a entrada do Plugin configurado para a próxima tentativa de reparo.
- Doctor repara config obsoleta de Plugin removendo ids de Plugin ausentes de `plugins.allow`/`plugins.entries`, além de config de canal pendente correspondente, destinos de Heartbeat e substituições de modelo de canal quando a descoberta de Plugin está íntegra.
- Doctor coloca config inválida de Plugin em quarentena desabilitando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse Plugin defeituoso para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor controla o ciclo de vida do gateway. Doctor ainda relata a integridade do gateway/serviço e aplica reparos que não envolvem serviços, mas pula instalação/inicialização/reinicialização/bootstrap de serviço e limpeza de serviço legado.
- No Linux, doctor ignora unidades systemd inativas extras parecidas com gateway e não regrava metadados de comando/entrypoint para um serviço de gateway systemd em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher ativo.
- Doctor migra automaticamente a config plana legada do Talk (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta do operador humano autorizada a executar comandos restritos a proprietários e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Doctor avisa quando agentes em modo Codex estão configurados e assets pessoais da CLI do Codex existem no home do Codex do operador. Inicializações locais do app-server do Codex usam homes isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar assets que devem ser promovidos deliberadamente.
- Doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, variáveis de ambiente, config ou requisitos de SO estão ausentes. `doctor --fix` pode desabilitar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver habilitado, mas o Docker estiver indisponível, doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, doctor relata um aviso somente leitura e não grava credenciais alternativas em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback por env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token resolvível do Telegram no caminho de comando atual. Se a inspeção do token estiver indisponível, doctor relata um aviso e pula a resolução automática naquela execução.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de config e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
