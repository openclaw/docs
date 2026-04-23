---
read_when:
    - Você tem problemas de conectividade/autenticação e quer correções guiadas
    - Você atualizou e quer uma verificação de sanidade
summary: Referência da CLI para `openclaw doctor` (verificações de integridade + reparos guiados)
title: doctor
x-i18n:
    generated_at: "2026-04-23T14:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Verificações de integridade + correções rápidas para o Gateway e canais.

Relacionado:

- Solução de problemas: [Troubleshooting](/pt-BR/gateway/troubleshooting)
- Auditoria de segurança: [Security](/pt-BR/gateway/security)

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
- `--yes`: aceita os padrões sem perguntar
- `--repair`: aplica os reparos recomendados sem perguntar
- `--fix`: alias de `--repair`
- `--force`: aplica reparos agressivos, incluindo sobrescrever configuração de serviço personalizada quando necessário
- `--non-interactive`: executa sem prompts; apenas migrações seguras
- `--generate-gateway-token`: gera e configura um token do Gateway
- `--deep`: examina serviços do sistema em busca de instalações extras do Gateway

Observações:

- Prompts interativos (como correções de keychain/OAuth) só são executados quando stdin é um TTY e `--non-interactive` **não** está definido. Execuções headless (Cron, Telegram, sem terminal) ignoram prompts.
- Desempenho: execuções não interativas de `doctor` pulam o carregamento antecipado de Plugin para manter rápidas as verificações de integridade headless. Sessões interativas ainda carregam totalmente os Plugins quando uma verificação precisa da contribuição deles.
- `--fix` (alias de `--repair`) grava um backup em `~/.openclaw/openclaw.json.bak` e remove chaves de configuração desconhecidas, listando cada remoção.
- As verificações de integridade do estado agora detectam arquivos de transcrição órfãos no diretório de sessões e podem arquivá-los como `.deleted.<timestamp>` para recuperar espaço com segurança.
- O doctor também examina `~/.openclaw/cron/jobs.json` (ou `cron.store`) em busca de formatos legados de trabalhos de Cron e pode regravá-los no local antes que o agendador tenha de normalizá-los automaticamente em runtime.
- O doctor repara dependências de runtime ausentes de Plugins integrados sem exigir acesso de gravação ao pacote OpenClaw instalado. Para instalações npm pertencentes ao root ou unidades systemd endurecidas, defina `OPENCLAW_PLUGIN_STAGE_DIR` como um diretório gravável, como `/var/lib/openclaw/plugin-runtime-deps`.
- O doctor migra automaticamente a configuração plana legada de Talk (`talk.voiceId`, `talk.modelId` e semelhantes) para `talk.provider` + `talk.providers.<provider>`.
- Execuções repetidas de `doctor --fix` não relatam/aplicam mais normalização de Talk quando a única diferença é a ordem das chaves do objeto.
- O doctor inclui uma verificação de prontidão da pesquisa de memória e pode recomendar `openclaw configure --section model` quando credenciais de embedding estiverem ausentes.
- Se o modo sandbox estiver ativado, mas Docker não estiver disponível, o doctor informa um aviso de alto sinal com correção (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Se `gateway.auth.token`/`gateway.auth.password` forem gerenciados por SecretRef e estiverem indisponíveis no caminho atual do comando, o doctor informa um aviso somente leitura e não grava credenciais fallback em texto simples.
- Se a inspeção de SecretRef do canal falhar em um caminho de correção, o doctor continua e informa um aviso em vez de encerrar antecipadamente.
- A autorresolução de nome de usuário `allowFrom` do Telegram (`doctor --fix`) exige um token do Telegram resolvível no caminho atual do comando. Se a inspeção do token não estiver disponível, o doctor informa um aviso e ignora a autorresolução nessa execução.

## macOS: sobrescritas de ambiente `launchctl`

Se você executou anteriormente `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), esse valor substitui seu arquivo de configuração e pode causar erros persistentes de “não autorizado”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
