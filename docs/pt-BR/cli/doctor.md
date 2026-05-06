---
read_when:
    - Você está com problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação rápida
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-06T17:53:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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
- `--yes`: aceita padrões sem solicitar confirmação
- `--repair`: aplica reparos recomendados que não envolvem serviços sem solicitar confirmação; instalações e reescritas do serviço do Gateway ainda exigem confirmação interativa ou comandos explícitos do Gateway
- `--fix`: alias para `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração personalizada de serviço quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras e reparos que não envolvem serviços
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: verifica serviços do sistema em busca de instalações extras do Gateway e relata transferências recentes de reinicialização do supervisor do Gateway

Observações:

- No modo Nix (`OPENCLAW_NIX_MODE=1`), as verificações somente leitura do doctor ainda funcionam, mas `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` ficam desativados porque `openclaw.json` é imutável. Edite a origem Nix desta instalação em vez disso; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente primeiro.
- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (cron, Telegram, sem terminal) pularão prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de plugins para manter rápidas as verificações de integridade headless. Sessões interativas ainda carregam plugins totalmente quando uma verificação precisa da contribuição deles.
- `--fix` (alias para `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- `doctor --fix --non-interactive` relata definições de serviço do Gateway ausentes ou obsoletas, mas não as instala nem reescreve fora do modo de reparo de atualização. Execute `openclaw gateway install` para um serviço ausente, ou `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador.
- Verificações de integridade de estado agora detectam arquivos de transcrição órfãos no diretório de sessões. Arquivá-los como `.deleted.<timestamp>` exige uma confirmação interativa; `--fix`, `--yes` e execuções headless os deixam no lugar.
- O Doctor também verifica `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de jobs cron e pode reescrevê-los no lugar antes que o scheduler precise normalizá-los automaticamente em runtime.
- No Linux, o doctor avisa quando o crontab do usuário ainda executa o legado `~/.openclaw/bin/ensure-whatsapp.sh`; esse script não é mais mantido e pode registrar falsas indisponibilidades do Gateway do WhatsApp quando o cron não tem o ambiente de user-bus do systemd.
- Quando o WhatsApp está habilitado, o doctor verifica se há um loop de eventos do Gateway degradado com clientes locais `openclaw-tui` ainda em execução. `doctor --fix` interrompe apenas clientes TUI locais verificados para que respostas do WhatsApp não fiquem enfileiradas atrás de loops obsoletos de atualização da TUI.
- O Doctor reescreve referências de modelo legadas `openai-codex/*` para referências canônicas `openai/*` em modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e pins obsoletos de rota de sessão. `--fix` seleciona `agentRuntime.id: "codex"` apenas quando o Plugin Codex está instalado, habilitado, contribui com o harness `codex` e tem OAuth utilizável; caso contrário, seleciona `agentRuntime.id: "pi"` para que a rota permaneça no runner padrão do OpenClaw.
- O Doctor limpa o estado legado de preparação de dependências de plugin criado por versões mais antigas do OpenClaw. Ele também repara plugins baixáveis ausentes referenciados pela configuração, como `plugins.entries`, canais configurados, configurações configuradas de provedor/pesquisa ou runtimes de agente configurados. Durante atualizações de pacote, o doctor pula o reparo de plugins pelo gerenciador de pacotes até que a troca de pacote seja concluída; execute `openclaw doctor --fix` novamente depois se um plugin configurado ainda precisar de recuperação. Se o download falhar, o doctor relata o erro de instalação e preserva a entrada de plugin configurada para a próxima tentativa de reparo.
- O Doctor repara configurações obsoletas de plugin removendo ids de plugin ausentes de `plugins.allow`/`plugins.entries`, além da configuração de canal pendente correspondente, alvos de heartbeat e substituições de modelo de canal quando a descoberta de plugins está íntegra.
- O Doctor coloca em quarentena configuração inválida de plugin desabilitando a entrada `plugins.entries.<id>` afetada e removendo seu payload `config` inválido. A inicialização do Gateway já pula apenas esse plugin defeituoso para que outros plugins e canais possam continuar em execução.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando outro supervisor possuir o ciclo de vida do Gateway. O Doctor ainda relata a integridade do Gateway/serviço e aplica reparos que não envolvem serviços, mas pula instalação/início/reinício/bootstrap de serviço e limpeza de serviços legados.
- No Linux, o doctor ignora unidades systemd extras inativas semelhantes ao Gateway e não reescreve metadados de comando/entrypoint para um serviço systemd do Gateway em execução durante o reparo. Pare o serviço primeiro ou use `openclaw gateway install --force` quando você intencionalmente quiser substituir o inicializador ativo.
- O Doctor migra automaticamente a configuração plana legada do Talk (`talk.voiceId`, `talk.modelId` e afins) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização do Talk quando a única diferença é a ordem das chaves do objeto.
- O Doctor inclui uma verificação de prontidão de pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estão ausentes.
- O Doctor avisa quando nenhum proprietário de comando está configurado. O proprietário de comando é a conta humana de operador autorizada a executar comandos exclusivos do proprietário e aprovar ações perigosas. O pareamento por DM apenas permite que alguém fale com o bot; se você aprovou um remetente antes da existência do bootstrap do primeiro proprietário, defina `commands.ownerAllowFrom` explicitamente.
- O Doctor avisa quando agentes em modo Codex estão configurados e ativos pessoais da CLI Codex existem na home Codex do operador. Inicializações locais do app-server Codex usam homes isoladas por agente, então use `openclaw migrate codex --dry-run` para inventariar ativos que devem ser promovidos deliberadamente.
- O Doctor avisa quando skills permitidas para o agente padrão estão indisponíveis no ambiente de runtime atual porque bins, env vars, configuração ou requisitos de SO estão ausentes. `doctor --fix` pode desabilitar essas skills indisponíveis com `skills.entries.<skill>.enabled=false`; instale/configure o requisito ausente em vez disso quando quiser manter a skill ativa.
- Se o modo sandbox estiver habilitado, mas o Docker estiver indisponível, o doctor relata um aviso de alto sinal com remediação (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se arquivos legados de registro de sandbox (`~/.openclaw/sandbox/containers.json` ou `~/.openclaw/sandbox/browsers.json`) estiverem presentes, o doctor os relata; `openclaw doctor --fix` migra entradas válidas para diretórios de registro fragmentados e coloca arquivos legados inválidos em quarentena.
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho do comando atual, o doctor relata um aviso somente leitura e não grava credenciais fallback em texto puro.
- Se a inspeção de SecretRef de canal falhar em um caminho de correção, o doctor continua e relata um aviso em vez de sair antecipadamente.
- Após migrações de diretório de estado, o doctor avisa quando contas padrão habilitadas do Telegram ou Discord dependem de fallback de env e `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` está indisponível para o processo do doctor.
- A resolução automática de nome de usuário de `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho do comando atual. Se a inspeção de token estiver indisponível, o doctor relata um aviso e pula a resolução automática nessa execução.

## macOS: substituições de env do `launchctl`

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
