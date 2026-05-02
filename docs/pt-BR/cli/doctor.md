---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-02T20:43:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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
- `--repair`: aplica reparos recomendados que não envolvem serviços sem solicitar confirmação; instalações e regravações do serviço do Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configurações personalizadas de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não envolvem serviços
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) pularão prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para que verificações de integridade sem interface permaneçam rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições ausentes ou obsoletas do serviço do Gateway, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente de barramento de usuário do systemd.
- O Doctor limpa o estado legado de staging de dependências de Plugin criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis configurados ausentes quando o registro consegue resolvê-los, e a passagem do doctor 2026.5.2 instala automaticamente plugins baixáveis que uma configuração antiga já usa antes de marcar a configuração como tocada para essa versão.
- O Doctor repara configurações obsoletas de Plugin removendo IDs de Plugin ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal pendente correspondente, destinos de Heartbeat e substituições de modelo de canal quando a descoberta de plugins está saudável.
- O Doctor coloca em quarentena configurações inválidas de Plugin desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse Plugin problemático para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor controlar o ciclo de vida do Gateway. O Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviços, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, o doctor ignora unidades systemd extras inativas semelhantes ao Gateway e não regrava metadados de comando/ponto de entrada para um serviço systemd do Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador ativo.
- O Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e relacionadas) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estão ausentes.
- O Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes da existência do bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- O Doctor avisa quando agentes em modo Codex estão configurados e assets pessoais da CLI do Codex existem no Codex home do operador. Inicializações locais do app-server do Codex usam homes isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar assets que devem ser promovidos deliberadamente.
- O Doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de execução atual porque bins, variáveis de ambiente, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desativar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; em vez disso, instale/configure o requisito ausente quando quiser manter a skill ativa.
- Se o modo sandbox estiver ativado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair cedo.
- Após migrações do diretório de estado, o doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback de ambiente e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nomes de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token resolvível do Telegram no caminho de comando atual. Se a inspeção do token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa passagem.

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
