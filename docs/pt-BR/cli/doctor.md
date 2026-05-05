---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-05T01:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
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
- `--yes`: aceita os padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados que não sejam de serviço sem solicitar confirmação; instalações e regravações do serviço de Gateway ainda exigem confirmação interativa ou comandos explícitos de Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; somente migrações seguras e reparos que não sejam de serviço
- `--generate-gateway-token`: gera e configura um token de Gateway
- `--deep`: examina os serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) ignorarão os prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento antecipado de Plugin para que as verificações de integridade headless permaneçam rápidas. Sessões interativas ainda carregam Plugins por completo quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` informa definições de serviço de Gateway ausentes ou obsoletas, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador.
- As verificações de integridade de estado agora detectam arquivos órfãos de transcrição no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- Doctor também examina `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de trabalhos Cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando Cron não tem o ambiente de barramento de usuário do systemd.
- Doctor limpa o estado legado de preparação de dependências de Plugin criado por versões antigas do OpenClaw. Ele também repara Plugins baixáveis ausentes que são referenciados pela configuração, como `plugins.entries`, canais configurados, configurações de provedor/pesquisa configuradas ou runtimes de agente configurados. Durante atualizações de pacote, doctor ignora o reparo de Plugin pelo gerenciador de pacotes até que a troca de pacote seja concluída; execute novamente `openclaw doctor --fix` depois se um Plugin configurado ainda precisar de recuperação. Se o download falhar, doctor relata o erro de instalação e preserva a entrada de Plugin configurada para a próxima tentativa de reparo.
- Doctor repara configuração obsoleta de Plugin removendo ids de Plugin ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal pendente correspondente, alvos de Heartbeat e substituições de modelo de canal quando a descoberta de Plugin está íntegra.
- Doctor coloca em quarentena configuração inválida de Plugin desabilitando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já ignora apenas esse Plugin problemático para que outros Plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor gerenciar o ciclo de vida do Gateway. Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não sejam de serviço, mas ignora instalação/início/reinício/bootstrap de serviço e limpeza de serviço legado.
- No Linux, doctor ignora unidades systemd extras semelhantes a Gateway que estejam inativas e não regrava metadados de comando/entrypoint para um serviço systemd de Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você quiser substituir intencionalmente o inicializador ativo.
- Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais a normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- Doctor inclui uma verificação de prontidão de pesquisa em memória e pode recomendar `openclaw configure --section model` quando as credenciais de embedding estão ausentes.
- Doctor avisa quando nenhum proprietário de comandos está configurado. O proprietário de comandos é a conta de operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes da existência do bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI do Codex existem na home Codex do operador. Inicializações locais do app-server do Codex usam homes isoladas por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- Doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, env vars, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desabilitar essas Skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver habilitado, mas o Docker estiver indisponível, doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho de comando atual, doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações do diretório de estado, doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback de env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho de comando atual. Se a inspeção do token estiver indisponível, doctor relata um aviso e ignora a resolução automática nessa passagem.

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
