---
read_when:
    - Você tem problemas de conectividade/autenticação e deseja correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-04T02:22:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
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
- `--repair`: aplica reparos recomendados que não envolvem serviço sem solicitar confirmação; instalações e reescritas do serviço do Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não envolvem serviço
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções sem interface (cron, Telegram, sem terminal) ignorarão prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento antecipado de plugins para manter verificações de integridade sem interface rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço do Gateway ausentes ou obsoletas, mas não as instala nem reescreve fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções sem interface os deixam no lugar.
- Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de tarefas cron e pode reescrevê-los no lugar antes que o agendador precise normalizá-los automaticamente em tempo de execução.
- No Linux, Doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente do barramento de usuário do systemd.
- Doctor limpa estado legado de preparação de dependências de plugins criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis configurados ausentes quando o registro consegue resolvê-los, e a passagem de Doctor 2026.5.2 instala automaticamente plugins baixáveis que uma configuração antiga já usa antes de marcar a configuração como tocada para essa versão. Se o download falhar, Doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- Doctor repara configuração obsoleta de plugins removendo ids de plugins ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal pendente correspondente, alvos de Heartbeat e substituições de modelo de canal quando a descoberta de plugins está íntegra.
- Doctor coloca configuração inválida de plugins em quarentena desativando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já ignora apenas esse plugin problemático, para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor gerencia o ciclo de vida do Gateway. Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviço, mas ignora instalação/início/reinício/bootstrap do serviço e limpeza de serviço legado.
- No Linux, Doctor ignora unidades systemd extras semelhantes ao Gateway que estejam inativas e não reescreve metadados de comando/entrypoint para um serviço systemd do Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o launcher ativo.
- Doctor migra automaticamente configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e relacionados) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- Doctor avisa quando nenhum proprietário de comandos está configurado. O proprietário de comandos é a conta do operador humano autorizada a executar comandos exclusivos de proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes de existir o bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais do Codex CLI existem no diretório inicial Codex do operador. Inicializações locais do servidor de app do Codex usam diretórios iniciais isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- Doctor avisa quando Skills permitidas para o agente padrão estão indisponíveis no ambiente de execução atual porque bins, variáveis de ambiente, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desativar essas skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver ativado mas o Docker estiver indisponível, Doctor relata um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados do registro do sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, Doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro particionados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, Doctor relata um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, Doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, Doctor avisa quando contas padrão ativadas do Telegram ou Discord dependem de fallback por env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do Doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho do comando atual. Se a inspeção do token estiver indisponível, Doctor relata um aviso e ignora a resolução automática nessa passagem.

## macOS: substituições de env do `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor sobrescreve seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor do Gateway](/pt-BR/gateway/doctor)
