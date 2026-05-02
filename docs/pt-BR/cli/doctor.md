---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-02T05:43:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
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
- `--repair`: aplica reparos recomendados que não envolvem serviços sem solicitar confirmação; instalações e regravações do serviço Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configurações de serviço personalizadas quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não envolvem serviços
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (Cron, Telegram, sem terminal) ignoram prompts.
- Desempenho: execuções não interativas de `doctor` ignoram o carregamento antecipado de plugins para que verificações de integridade headless continuem rápidas. Sessões interativas ainda carregam plugins completamente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço Gateway ausentes ou obsoletas, mas não as instala nem regrava fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador.
- As verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs Cron e pode regravá-los no local antes que o agendador precise normalizá-los automaticamente em runtime.
- No Linux, o Doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas interrupções do Gateway WhatsApp quando o Cron não tem o ambiente user-bus do systemd.
- O Doctor limpa o estado legado de preparação de dependências de plugins criado por versões antigas do OpenClaw. Ele também repara plugins baixáveis configurados ausentes quando o registry consegue resolvê-los.
- O Doctor repara configuração obsoleta de plugins removendo IDs de plugins ausentes de `plugins.allow`/`plugins.entries`, além das configurações de canal pendentes correspondentes, destinos de Heartbeat e substituições de modelo de canal quando a descoberta de plugins está saudável.
- O Doctor coloca em quarentena configurações inválidas de plugins desabilitando a entrada `plugins.entries.<id>` afetada e removendo o payload `config` inválido. A inicialização do Gateway já ignora apenas esse plugin problemático para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor gerencia o ciclo de vida do Gateway. O Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviços, mas ignora instalação/início/reinício/bootstrap de serviço e limpeza de serviços legados.
- No Linux, o Doctor ignora unidades systemd inativas extras semelhantes ao Gateway e não regrava metadados de comando/entrypoint para um serviço Gateway systemd em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador ativo.
- O Doctor migra automaticamente a configuração Talk plana legada (`talk.voiceId`, `talk.modelId` e similares) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embeddings estão ausentes.
- O Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta do operador humano autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM só permite que alguém fale com o bot; se você aprovou um remetente antes da existência do bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- O Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI do Codex existem no diretório inicial do Codex do operador. Inicializações locais do app-server do Codex usam diretórios iniciais isolados por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- Se o modo sandbox estiver habilitado, mas o Docker estiver indisponível, o Doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, o Doctor relata um aviso somente leitura e não grava credenciais alternativas em texto puro.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, o Doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, o Doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback por env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do Doctor.
- A resolução automática de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho do comando atual. Se a inspeção do token estiver indisponível, o Doctor relata um aviso e ignora a resolução automática nessa execução.

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
